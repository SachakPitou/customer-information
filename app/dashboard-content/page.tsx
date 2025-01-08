"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import StatusChangeFilter from '../component/statusChangeFilter';
import LoadingSpinner from '../component/LoadingSpinner';
import LocationChangeFilter from '../component/LocationChangeFilter';

interface Customer {
    location_id: number;
    ONU_mac_address: string;
    customer_id: string;
    customer_name: string;
    phone_number: string;
    cid: string;
    package_name: string;
    service_port?: number;
    status_type: string;
    active_timestamp?: string;
    inactive_timestamp?: string;
    reactive_timestamp?: string;
    terminate_timestamp?: string;
    isActive: boolean;
    rowNumber: number;
    device_name: string;
    interface_name: string;
    olt_name: string;
    status: string;
    slot?: string;
    port?: string;
    onu_id?: string;
    ip_address?: string;
    package_id: string;
    device_id: string;
    olt_id: string;
    interface_id: string;
    ACL: string; 
    switch_port: string;
    port_type: string;
    ont_id: string;
    serial_number: string;
    frame: number,
    statusHistory: Array<{
        status_type: string;
        start_date: string;
        end_date: string | null;
    }>;
}

interface StatusChangeFilter {
    startDate: Date | null;
    endDate: Date | null;
    statusType: string;
}
interface FetchResponse {
    data: any;
    error: any;
}

export default function Dashboard() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchField, setSearchField] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [userType, setUserType] = useState('');
    const [session, setSession] = useState<any>(null);
    const [editHistories, setEditHistories] = useState<Record<string, any[]>>({});
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
    const [customerCount, setCustomerCount] = useState(0);const [pendingEditCount, setPendingEditCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const BATCH_SIZE = 50; // Number of customers to process at once
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; 
    const [statusChangeFilter, setStatusChangeFilter] = useState<{
        startDate: string;
        endDate: string;
        statusType: string;
      }>({
        startDate: '',
        endDate: '',
        statusType: 'ALL',
    });

    const router = useRouter();
    const packagesPerPage = 15;
    const handleFailedFetch = (error: any, customerId: string, entityType: string) => {
        console.error(`Error fetching ${entityType} for customer ${customerId}:`, error);
        return null;
    };
    
    // Retry logic for failed fetches
    const fetchWithRetry = async (
        fetchPromise: Promise<FetchResponse>,
        retries = 3,
        delay = 1000
    ): Promise<FetchResponse> => {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetchPromise;
                if (!response.error) return response;
                
                console.warn(`Attempt ${i + 1} failed, retrying...`);
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                }
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            }
        }
        throw new Error(`Failed after ${retries} retries`);
    };
    const handleStatusChangeFilter = (params: { startDate: string; endDate: string; statusType: string }) => {
        setStatusChangeFilter(params);
    };
    const downloadExcel = () => {
        const excelData = filteredCustomers.map(customer => {
            let relevantStatus = null;
            
            // Check if statusHistory exists and is an array
            if (Array.isArray(customer.statusHistory) && customer.statusHistory.length > 0) {
                // Always sort the status history to get the latest status first
                const sortedStatusHistory = customer.statusHistory
                    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    
                if (statusChangeFilter.startDate && statusChangeFilter.endDate) {
                    const filterStartDate = new Date(statusChangeFilter.startDate);
                    const filterEndDate = new Date(statusChangeFilter.endDate);
                    filterStartDate.setHours(0, 0, 0, 0);
                    filterEndDate.setHours(23, 59, 59, 999);
    
                    // Find the most recent status within the filter date range
                    relevantStatus = sortedStatusHistory.find(status => {
                        const statusStartDate = new Date(status.start_date);
                        const statusEndDate = status.end_date ? new Date(status.end_date) : new Date();
                        return (statusStartDate <= filterEndDate && statusEndDate >= filterStartDate);
                    });
                }
    
                // If no relevant status found within the date range or no date filter applied, use the latest status
                if (!relevantStatus) {
                    relevantStatus = sortedStatusHistory[0];
                }
            }
    
            // If no relevant status found in history, use the current status
            if (!relevantStatus) {
                relevantStatus = {
                    status_type: customer.status_type || 'Unknown',
                    start_date: customer.active_timestamp || '',
                    end_date: null
                };
            }
    
            // Helper function to format date in Cambodian locale
            const formatDateForCambodia = (dateStr: string | number | Date) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                return date.toLocaleString('km-KH', {
                    timeZone: 'Asia/Phnom_Penh',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
            };
    
            return {
                'No.': customer.rowNumber,
                'Name': customer.customer_name,
                'Phone Number': customer.phone_number,
                'CID': customer.cid,
                'Internet Package': customer.package_name,
                'Slot': customer.slot,
                'Port': customer.port,
                'Frame': customer.frame,
                'Service Port': customer.service_port,
                'ONT ID': customer.ont_id,
                'ACL': customer.ACL,
                'Switch Port': customer.switch_port,
                'Port Type': customer.port_type,
                'ONU MAC Address': customer.ONU_mac_address,
                'Serial Number': customer.serial_number,
                'IP Address': customer.ip_address,
                'Interface': customer.interface_name,
                'Device': customer.device_name,
                'Status': relevantStatus.status_type,
                'Status Start Date': formatDateForCambodia(relevantStatus.start_date),
                'Status End Date': relevantStatus.end_date 
                    ? formatDateForCambodia(relevantStatus.end_date) 
                    : 'Current',
            };
        });
    
        // Create a new workbook
        const workbook = XLSX.utils.book_new();
    
        // Create a worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
    
        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    
        // Generate Excel file buffer
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
        // Create a Blob from the buffer
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
        // Save the file with Cambodian locale date and time
        const now = new Date();
        const formattedDateTime = now.toLocaleString('km-KH', {
            timeZone: 'Asia/Phnom_Penh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/[/:\s]/g, '-');
    
        const filename = `customer_dashboard_${formattedDateTime}.xlsx`;
    
        // Save the file
        saveAs(data, filename);
    };
    const toggleRow = (customerId: string) => {
        setExpandedRows((prevState) => ({
            ...prevState,
            [customerId]: !prevState[customerId],
        }));
    };

    const toggleUserStatus = async (customer: Customer) => {
        try {
            const updatedStatus = !customer.isActive;

            // Update the status in the database
            await supabase
                .from('Customer')
                .update({ isActive: updatedStatus })
                .eq('customer_id', customer.customer_id);

            // Update the local state to reflect the change
            setCustomers((prevCustomers) =>
                prevCustomers.map((c) =>
                    c.customer_id === customer.customer_id ? { ...c, isActive: updatedStatus } : c
                )
            );

            console.log(`Customer with ID ${customer.customer_id} is now ${updatedStatus ? 'active' : 'inactive'}`);
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    };

    const handleFetchHistory = async (customerId: string) => {
        if (editHistories[customerId]) {
            // If we already have the history, just toggle the visibility
            setExpandedRows(prev => ({
                ...prev,
                [customerId]: !prev[customerId]
            }));
            return;
        }

        try {
            const [
                { data: historyData },
                { data: userData }
            ] = await Promise.all([
                supabase.from('CustomerHistory').select('*').eq('customer_id', customerId),
                supabase.from('userAccount').select('id, user_name')
            ]);

            if (!historyData) return;

            // Create user map for quick lookups
            const userMap = new Map(userData?.map(user => [user.id, user.user_name]) || []);

            const processedHistory = historyData.map(history => {
                const formattedDate = new Date(history.timestamp.replace(',', '')).toLocaleString('en-GB', {
                    timeZone: 'Asia/Phnom_Penh',
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });

                const userName = userMap.get(history.editedBy) || 'Unknown User';

                return {
                    ...history,
                    formattedDate,
                    editedBy: userName,
                    displayString: `${formattedDate} edited by ${userName}`,
                    changeDescription: `${history.field_changed} changed from "${history.old_value}" to "${history.new_value}"`
                };
            });

            setEditHistories(prev => ({
                ...prev,
                [customerId]: processedHistory
            }));

            setExpandedRows(prev => ({
                ...prev,
                [customerId]: true
            }));
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };
    const handleDeleteCustomer = async () => {
        try {
            if (!customerToDelete) return;

            // Delete the customer from the database
            await supabase.from("Customer")
                .delete()
                .eq("customer_id", customerToDelete);
        
            // Update the state to remove the deleted customer
            setCustomers(prevCustomers => prevCustomers.filter(customer => customer.customer_id !== customerToDelete));
        
            // Log success message
            console.log(`Customer with ID ${customerToDelete} deleted successfully`);
        
            // Close the modal after successful deletion
            setShowModal(false);
        } catch (error) {
            console.error('Error deleting customer:', error);
        }
    };
    

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                // Fetch all required data in parallel
                const [
                    { data: customersData, error: customersError },
                    { data: packageData, error: packageError },
                    { data: deviceData, error: deviceError },
                    { data: interfaceData, error: interfaceError },
                    { data: statusData, error: statusError },
                    { data: statusHistoryData, error: historyError }
                ] = await Promise.all([
                    supabase.from('Customer').select('*'),
                    supabase.from('Package').select('package_id, package_name'),
                    supabase.from('Device').select('device_id, device_name'),
                    supabase.from('Interface').select('interface_id, interface_name'),
                    supabase.from('Customer').select('customer_id, status').eq('status', 'Completed'),
                    supabase.from('statushistory').select('*')
                ]);

                if (customersError) throw customersError;

                // Create lookup maps for faster access
                const packageMap = new Map(packageData?.map(p => [p.package_id, p.package_name]));
                const deviceMap = new Map(deviceData?.map(d => [d.device_id, d.device_name]));
                const interfaceMap = new Map(interfaceData?.map(i => [i.interface_id, i.interface_name]));
                const statusMap = new Map(statusData?.map(s => [s.customer_id, s.status]));
                const statusHistoryMap = new Map();
                
                // Group status history by customer_id
                statusHistoryData?.forEach(history => {
                    if (!statusHistoryMap.has(history.customer_id)) {
                        statusHistoryMap.set(history.customer_id, []);
                    }
                    statusHistoryMap.get(history.customer_id).push(history);
                });

                // Process customer data with the lookup maps
                const processedCustomers = customersData?.map((customer, index) => ({
                    ...customer,
                    rowNumber: index + 1,
                    package_name: packageMap.get(customer.package_id) || 'Unknown Package',
                    device_name: deviceMap.get(customer.device_id) || 'Unknown Device',
                    interface_name: interfaceMap.get(customer.interface_id) || 'Unknown Interface',
                    status: statusMap.get(customer.customer_id),
                    statusHistory: statusHistoryMap.get(customer.customer_id) || []
                }));

                setCustomers(processedCustomers || []);
                setCustomerCount(statusData?.length || 0);
                setPendingEditCount((customersData?.length || 0) - (statusData?.length || 0));
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        const fetchUserType = async () => {
            try {
                const supabase = createClient();
                const { data, error } = await supabase.auth.getSession(); // Get session data

                if (error) {
                    console.error('Error fetching session:', error.message);
                    return;
                }
    
                const session = data.session;
                setSession(session); // Set session state
    
                if (session) {
                    const userId = session.user.id; // Extract user ID from session
                    const { data: userData, error: userError } = await supabase
                        .from('userAccount')
                        .select('user_type') 
                        .eq("id", userId)
                        .single();
    
                    if (userError) {
                        throw userError;
                    }
    
                    if (userData) {
                        setUserType(userData.user_type); // Set user type state
                    }
                }
            } catch (error) {
                console.error('Error fetching user type:', error);
            }
        };
        const fetchCounts = async () => {
            try {
                setIsLoading(true);
                const [customerData, pendingEditData] = await Promise.all([
                    supabase
                        .from('Customer')
                        .select('customer_id')
                        .eq('status', 'Completed'),
                    supabase
                        .from('Customer')
                        .select('customer_id')
                        .eq('status', 'Pending Technical Review'),
                ]);
    
                // Error handling
                if (customerData.error) throw customerData.error;
                if (pendingEditData.error) throw pendingEditData.error;
    
                // Set states
                setCustomerCount(customerData.data?.length || 0);
                setPendingEditCount(pendingEditData.data?.length || 0);
            } catch (error) {
                console.error('Error fetching counts:', error);
                // Handle error appropriately
            } finally {
                setIsLoading(false);
            }
        };
        fetchCounts();
        fetchAllData();
        fetchUserType();
    }, [customerToDelete, showModal]);
    
    
    console.log("Filtering customers...");
    
    const filteredCustomers = customers.filter((customer) => {
        console.log('Processing customer:', customer.customer_name, 'ID:', customer.customer_id);
        console.log('Customer statusHistory:', customer.statusHistory);
    
        // First, check if the customer status is "Completed"
        if (customer.status !== "Completed") {
            console.log('Customer status not Completed:', customer.status);
            return false; // Immediately exclude customers who are not "Completed"
        }
    
        const searchTerm = searchValue.toLowerCase();
        let statusChangeFilterPass = true;
        if (selectedLocation !== null) {
            // Ensure the customer's location matches the selected location
            if (customer.location_id !== selectedLocation) {
                return false;
            }
        }
        // Date range and status type filter logic
        if (statusChangeFilter.startDate && statusChangeFilter.endDate) {
            console.log('Applying date filter:', statusChangeFilter.startDate, 'to', statusChangeFilter.endDate);
            
            const filterStartDate = new Date(statusChangeFilter.startDate);
            const filterEndDate = new Date(statusChangeFilter.endDate);
    
            filterStartDate.setHours(0, 0, 0, 0);  // Set to beginning of the day
            filterEndDate.setHours(23, 59, 59, 999);  // Set to end of the day
    
            if (Array.isArray(customer.statusHistory) && customer.statusHistory.length > 0) {
                console.log('Status history found. Entries:', customer.statusHistory.length);
                
                // Find the status that was active during the filter date range
                const relevantStatus = customer.statusHistory.find(status => {
                    const statusStartDate = new Date(status.start_date);
                    const statusEndDate = status.end_date ? new Date(status.end_date) : new Date();
    
                    return (statusStartDate <= filterEndDate && statusEndDate >= filterStartDate);
                });
    
                console.log('Relevant status:', relevantStatus);
    
                if (relevantStatus) {
                    if (statusChangeFilter.statusType !== 'ALL') {
                        statusChangeFilterPass = relevantStatus.status_type === statusChangeFilter.statusType;
                    }
                } else {
                    statusChangeFilterPass = false;
                }
            } else {
                console.log('No status history found for customer');
                statusChangeFilterPass = false;
            }
        } else if (statusChangeFilter.statusType !== 'ALL') {
            // If no date range is specified, use the latest status
            const latestStatus = customer.statusHistory.length > 0 
                ? customer.statusHistory[customer.statusHistory.length - 1].status_type 
                : customer.status_type;
            
            statusChangeFilterPass = latestStatus === statusChangeFilter.statusType;
        }
    
        console.log('Status filter pass:', statusChangeFilterPass);
    
        // If no search value and the customer passes the status filter, include them
        if (searchValue === '' && statusChangeFilterPass) {
            console.log('Customer passes the filter:', customer.customer_name);
            return true;
        }
    
        let isMatchingSearch = false;
    
        // Search filter (existing logic)
        if (searchField === 'all') {
            isMatchingSearch = (
                (customer.customer_name?.toLowerCase().includes(searchTerm) || false) ||
                (customer.phone_number?.toLowerCase().includes(searchTerm) || false) ||
                (customer.cid?.toLowerCase().includes(searchTerm) || false) ||
                (customer.package_name?.toLowerCase().includes(searchTerm) || false) 
            );
        } else if (searchField === 'name') {
            isMatchingSearch = customer.customer_name?.toLowerCase().includes(searchTerm) || false;
        } else if (searchField === 'phone_number') {
            const phoneNumberString = customer.phone_number?.toString() || '';
            isMatchingSearch = phoneNumberString.includes(searchTerm);
        } else if (searchField === 'cid') {
            const cidString = customer.cid?.toString().toLowerCase() || '';
            isMatchingSearch = cidString.startsWith(searchTerm.toLowerCase());
        } else if (searchField === 'internet_package') {
            const internetPackageString = customer.package_name?.toString().toLowerCase() || '';
            isMatchingSearch = internetPackageString.startsWith(searchTerm.toLowerCase());
        }
    
        console.log('Search filter match:', isMatchingSearch);
    
        return isMatchingSearch && statusChangeFilterPass;
    });
    
    console.log("Filtered customers:", filteredCustomers);
        
    const handleSearch = () => {
        // Log the search value
        console.log("Search value:", searchValue);
        // Perform search logic if needed
    };

    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value); // Update the search input value
    };

    const handleSearchInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSearch(); // Call the search function when Enter key is pressed
        }
    };
    
    const handleSearchFieldChange = (e: { target: { value: React.SetStateAction<string>; }; }) => {
        setSearchField(e.target.value);
    };

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };
    const handleLocationChange = (locationId: number | null) => {
        setSelectedLocation(locationId);
        // Perform filtering or other actions based on selected location
    };
    // Calculate the packages to be displayed on the current page
    const totalPages = Math.ceil(filteredCustomers.length / packagesPerPage);
    const startIndex = (currentPage - 1) * packagesPerPage;
    const displayedCustomers = filteredCustomers.slice(startIndex, startIndex + packagesPerPage);

    if (customers.length === 0 || (customers.length - pendingEditCount) !== customerCount) {
        console.log("customer:", customers.length); // Log first to debug
        return <LoadingSpinner />;
    }
    return (
        <div className="w-full relative overflow-x-auto shadow-md dark:bg-gray-900">
            <div className="w-full bg-gray-100 p-4 dark:bg-gray-800 !bg-gray-200 dark:!bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
                            {/* Navigation Buttons */}
                            <div className="flex space-x-2">
                                <button onClick={() => router.back()} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
                                    <svg className="w-5 h-5 mr-2 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                                    </svg>
                                    Back
                                </button>
                                <button onClick={() => router.push('/')} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
                                    <svg className="w-5 h-5 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m4 12 8-8 8 8M6 10.5V19a1 1 0 0 0 1 1h3v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h3a1 1 0 0 0 1-1v-8.5"/>
                                    </svg>
                                    Home
                                </button>
                            </div>

                            {/* Download Excel Button */}
                            <div>
                                <button
                                onClick={downloadExcel}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm text-white font-medium rounded-md shadow-sm bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                Download Excel
                                </button>
                            </div>
                            <LocationChangeFilter 
                                    onLocationChange={handleLocationChange} 
                            />
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
                                <StatusChangeFilter onFilter={handleStatusChangeFilter} />
                                
                                <select 
                                value={searchField} 
                                onChange={handleSearchFieldChange} 
                                className="mt-1 block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="all">All Fields</option>
                                    <option value="name">Name</option>
                                    <option value="phone_number">Phone Number</option>
                                    <option value="cid">CID</option>
                                    <option value="internet_package">Internet Package</option>
                                </select>
                            </div>

                            {/* Search Input */}
                            <div className="relative flex-grow max-w-md w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                type="text"
                                name="search"
                                id="search"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
                                placeholder="Search"
                                value={searchValue}
                                onChange={handleSearchInputChange}
                                onKeyPress={handleSearchInputKeyPress}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="title-dashboard text-xs text-gray-700 uppercase bg-gray-150 dark:bg-gray-300 dark:text-gray-700">
                    <tr>
                        {/* <th scope="col" className="p-4">
                            <!-- Adjust as needed -->
                        </th> */}
                        <th scope="col" className="px-6 py-3">
                            No.
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Name
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Status
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Edit History
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Phone Number
                        </th>
                        <th scope="col" className="px-6 py-3">
                            CID
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Internet Package
                        </th>
                        <th scope="col" className="px-6 py-3">
                            IP Address
                        </th>
                        <th scope="col" className="px-6 py-3">
                            View
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Edit
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Delete
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {displayedCustomers.map((customer) => (
                        <React.Fragment key={customer.customer_id}>
                            <tr className="dashboard-text bg-white border-b dark:bg-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-300">
                                <td className="px-6 py-4">{customer.rowNumber}</td>
                                <td className="px-6 py-4">{customer.customer_name}</td>
                                <td className="px-6 py-4">
                                    <button 
                                        className={`px-4 py-2 font-semibold text-sm text-white rounded-full ${
                                            customer.status_type === 'ACTIVE' ? 'bg-green-500' :
                                            customer.status_type === 'REACTIVE' ? 'bg-blue-500' :
                                            customer.status_type === 'INACTIVE' ? 'bg-yellow-500' :
                                            customer.status_type === 'TERMINATE' ? 'bg-red-500' :
                                            'bg-gray-500' // default color if status is unknown
                                        }`}
                                    >
                                        {customer.status_type}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleFetchHistory(customer.customer_id)}
                                        className="px-4 py-2 bg-red-700 text-white rounded"
                                    >
                                        {expandedRows[customer.customer_id] ? 
                                            <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 15 7-7 7 7"/>
                                            </svg>
                                            : 
                                            <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/>
                                            </svg>
                                            }
                                    </button>
                                </td>
                                <td className="px-6 py-4">{customer.phone_number}</td>
                                <td className="px-6 py-4">{customer.cid}</td>
                                <td className="px-6 py-4">{customer.package_name}</td>
                                <td className="px-6 py-4">{customer.ip_address}</td>
                                <td className="px-6 py-4">
                                    <Link href={`/viewCustomer/${customer.customer_id}`}>
                                        <div className="flex items-center text-blue-600 dark:text-blue-500 hover:underline">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M19 10c0 3.682-2.914 6-7 6s-7-2.318-7-6 2.914-6 7-6 7 2.318 7 6zm-7 4a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                                            </svg>
                                            {/* Optionally, you can add a title attribute for accessibility */}
                                        </div>
                                    </Link>
                                </td>
                                {userType !== "technical" && (
                                <td className="px-6 py-4">
                                    <Link href={`/editCustomerService/${customer.customer_id}`}>
                                        <div className="flex items-center text-blue-600 dark:text-blue-500 hover:underline">
                                            <svg className="feather feather-edit" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                            </svg>
                                            {/* Optionally, you can add a title attribute for accessibility */}
                                        </div>
                                    </Link>
                                </td>
                                )}
                                {userType !== "customer_service" && (
                                <td className="px-6 py-4">
                                    <Link href={`/editCustomer/${customer.customer_id}`}>
                                        <div className="flex items-center text-blue-600 dark:text-blue-500 hover:underline">
                                            <svg className="feather feather-edit" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                            </svg>
                                            {/* Optionally, you can add a title attribute for accessibility */}
                                        </div>
                                    </Link>
                                </td>
                                )}
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => {
                                            setShowModal(true);
                                            setCustomerToDelete(customer.customer_id);
                                        }}
                                        className="block text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                                        type="button"
                                    >
                                        <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                            {expandedRows[customer.customer_id] && (
                                <tr>
                                    <td colSpan={15} className="px-6 py-4">
                                    <div className="mt-4">
                                        {editHistories[customer.customer_id] && editHistories[customer.customer_id].length > 0 ? (
                                        editHistories[customer.customer_id].map((history) => (
                                            <div key={history.id} className="p-2 border-b border-white text-black">
                                            <div>
                                                <strong>{history.displayString}</strong>
                                            </div>
                                            <div>
                                                <strong>Changes:</strong> {history.changeDescription}
                                            </div>
                                            </div>
                                        ))
                                        ) : (
                                        <div>No edit history available.</div>
                                        )}
                                    </div>
                                    </td>
                                </tr>
                                )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-900">
                <span className="text-sm text-gray-700 dark:text-gray-400">
                    Showing {startIndex + 1} to {Math.min(startIndex + packagesPerPage, filteredCustomers.length)} of {filteredCustomers.length} Customers
                </span>
                <div className="flex space-x-2">
                    {/* Previous Button */}
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border bg-white text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        Previous
                    </button>
                    
                    {/* Pagination Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => 
                            page === 1 || 
                            page === totalPages || 
                            (page >= currentPage - 2 && page <= currentPage + 2)
                        )
                        .map(page => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-1 border ${currentPage === page ? 'bg-red-500 text-white' : 'bg-white text-gray-700'} hover:bg-red-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700`}
                            >
                                {page}
                            </button>
                        ))}
                    
                    {/* Ellipsis for Skipped Pages */}
                    {currentPage < totalPages - 3 && <span className="px-3 py-1 text-gray-700 dark:text-gray-400">...</span>}
                    
                    {/* Next Button */}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border bg-white text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        Next
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="fixed top-0 left-0 z-50 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
                    <h2 className="text-lg font-semibold text-gray-800">Are you sure you want to delete this customer?</h2>
                    <div className="flex justify-end mt-4">
                    <button
                        onClick={handleDeleteCustomer} // Call the delete function when 'Yes' button is clicked
                        className="text-white bg-red-600 hover:bg-red-800 px-4 py-2 rounded-md mr-2"
                    >
                        Yes, I'm sure
                    </button>
                    <button
                        onClick={() => setShowModal(false)} // Close the modal when 'No' button is clicked
                        className="text-gray-700 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md"
                    >
                        No, Cancel
                    </button>
                    </div>
                </div>
                </div>
            )}
        </div>
    );
}
 