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

interface Customer {
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

    const handleStatusChangeFilter = (params: { startDate: string; endDate: string; statusType: string }) => {
        setStatusChangeFilter(params);
    };

    const getStatusTimestamp = (customer: Customer): string | null => {
        switch(customer.status_type) {
            case 'ACTIVE':
                return customer.active_timestamp || null;
            case 'INACTIVE':
                return customer.inactive_timestamp || null;
            case 'REACTIVE':
                return customer.reactive_timestamp || null;
            case 'TERMINATE':
                return customer.terminate_timestamp || null;
            default:
                return null;
        }
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
        try {
            console.log(`Fetching history for customer ${customerId}`);
            
            // Fetch history data without joining Users table
            const { data: historyData, error: historyError } = await supabase
                .from('CustomerHistory')
                .select('*')
                .eq('customer_id', customerId);
    
            if (historyError) throw historyError;
    
            if (!historyData || historyData.length === 0) {
                console.log(`No history data found for customer ${customerId}`);
                setEditHistories((prevHistories) => ({
                    ...prevHistories,
                    [customerId]: [],
                }));
                return;
            }
    
            console.log(`Fetched ${historyData.length} history records for customer ${customerId}`);

            const { data: testUserData, error: testUserError } = await supabase
                .from('userAccount')
                .select('id, user_name');

            if (testUserError) {
                console.error('Error in test query for userAccount:', testUserError);
            } else {
                console.log('Test query returned:', testUserData);
            }
        
            // Collect all the IDs that need to be fetched
            const locationIds = historyData.flatMap((history) =>
                history.field_changed === 'location_id' ? [history.old_value, history.new_value] : []
            );
            const oltIds = historyData.flatMap((history) =>
                history.field_changed === 'olt_id' ? [history.old_value, history.new_value] : []
            );
            const deviceIds = historyData.flatMap((history) =>
                history.field_changed === 'device_id' ? [history.old_value, history.new_value] : []
            );
            const serviceIds = historyData.flatMap((history) =>
                history.field_changed === 'service_id' ? [history.old_value, history.new_value] : []
            );
            const packageIds = historyData.flatMap((history) =>
                history.field_changed === 'package_id' ? [history.old_value, history.new_value] : []
            );
            const interfaceIds = historyData.flatMap((history) =>
                history.field_changed === 'interface_id' ? [history.old_value, history.new_value] : []
            );
    
            // Collect unique user IDs
            const userIdsSet = new Set<string>();
            historyData.forEach(history => {
                const editedBy = history.editedBy;
                if (editedBy !== null && 
                    typeof editedBy === 'string' && 
                    editedBy.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
                    userIdsSet.add(editedBy);
                }
            });
            const userIds = Array.from(userIdsSet);
    
            console.log('Fetching details for related entities...');
            // Fetch user data
            // Fetch details for all relevant entities
            const [locationsData, oltsData, devicesData, servicesData, packagesData, interfacesData, usersData] = await Promise.all([
                supabase.from('Location').select('location_id, location_name').in('location_id', locationIds),
                supabase.from('OLT').select('olt_id, olt_name').in('olt_id', oltIds),
                supabase.from('Device').select('device_id, device_name').in('device_id', deviceIds),
                supabase.from('Service').select('service_id, service_name').in('service_id', serviceIds),
                supabase.from('Package').select('package_id, package_name').in('package_id', packageIds),
                supabase.from('Interface').select('interface_id, interface_name').in('interface_id', interfaceIds),
                supabase.from('userAccount').select('id, user_name').in('id', userIds)
            ]);
    
            // Check for null results and log them
            [
                { name: 'Location', data: locationsData },
                { name: 'OLT', data: oltsData },
                { name: 'Device', data: devicesData },
                { name: 'Service', data: servicesData },
                { name: 'Package', data: packagesData },
                { name: 'Interface', data: interfacesData },
                { name: 'userAccount', data: usersData }
            ].forEach(({ name, data }) => {
                if (data.error) {
                    console.error(`Error fetching ${name} data:`, data.error);
                }
                if (!data.data) {
                    console.error(`No data returned for ${name}`);
                } else {
                    console.log(`Fetched ${data.data.length} ${name} records`);
                }
            });
    
            // Create maps for easy lookup
            const createMap = (data: any) => data && data.data ? Object.fromEntries(data.data.map((item: any) => [item[`${Object.keys(item)[0]}`], item[`${Object.keys(item)[1]}`]])) : {};
            const locationMap = createMap(locationsData);
            const oltMap = createMap(oltsData);
            const deviceMap = createMap(devicesData);
            const serviceMap = createMap(servicesData);
            const packageMap = createMap(packagesData);
            const interfaceMap = createMap(interfacesData);
            const userMap = usersData && usersData.data
                ? Object.fromEntries(
                    usersData.data.map((user: any) => [
                        user.id, 
                        { name: user.user_name || 'Unknown User' }
                    ])
                )
                : {};
    
            console.log('User map:', userMap);
            console.log('Processing history data...');
    
            const historyWithDetails = historyData.map((history: any) => {
                let changeDescription;
    
                // Generate change descriptions based on the field changed
                if (history.field_changed === 'location_id') {
                    const oldLocationName = locationMap[history.old_value] || 'Unknown Location';
                    const newLocationName = locationMap[history.new_value] || 'Unknown Location';
                    changeDescription = `Location changed from "${oldLocationName}" to "${newLocationName}"`;
                } else if (history.field_changed === 'olt_id') {
                    const oldOltName = oltMap[history.old_value] || 'Unknown OLT';
                    const newOltName = oltMap[history.new_value] || 'Unknown OLT';
                    changeDescription = `OLT changed from "${oldOltName}" to "${newOltName}"`;
                } else if (history.field_changed === 'device_id') {
                    const oldDeviceName = deviceMap[history.old_value] || 'Unknown Device';
                    const newDeviceName = deviceMap[history.new_value] || 'Unknown Device';
                    changeDescription = `Device changed from "${oldDeviceName}" to "${newDeviceName}"`;
                } else if (history.field_changed === 'service_id') {
                    const oldServiceName = serviceMap[history.old_value] || 'Unknown Service';
                    const newServiceName = serviceMap[history.new_value] || 'Unknown Service';
                    changeDescription = `Service changed from "${oldServiceName}" to "${newServiceName}"`;
                } else if (history.field_changed === 'package_id') {
                    const oldPackageName = packageMap[history.old_value] || 'Unknown Package';
                    const newPackageName = packageMap[history.new_value] || 'Unknown Package';
                    changeDescription = `Package changed from "${oldPackageName}" to "${newPackageName}"`;
                } else if (history.field_changed === 'interface_id') {
                    const oldInterfaceName = interfaceMap[history.old_value] || 'Unknown Interface';
                    const newInterfaceName = interfaceMap[history.new_value] || 'Unknown Interface';
                    changeDescription = `Interface changed from "${oldInterfaceName}" to "${newInterfaceName}"`;
                } else if (history.field_changed === 'isActive') {
                    const oldStatusName = history.old_value === 'true' ? 'Active' : 'Inactive';
                    const newStatusName = history.new_value === 'true' ? 'Active' : 'Inactive';
                    changeDescription = `Status changed from "${oldStatusName}" to "${newStatusName}"`;
                } else {
                    changeDescription = `${history.field_changed} changed from "${history.old_value}" to "${history.new_value}"`;
                }
    
                // Format the date
                const formattedDate = new Date(history.timestamp.replace(',', '')).toLocaleString('en-GB', {
                    timeZone: 'Asia/Phnom_Penh',
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
    
                const userInfo = userMap[history.editedBy] || { name: 'Unknown User'};

                return {
                    ...history,
                    changeDescription,
                    formattedDate,
                    editedBy: userInfo.name,
                    displayString: `${formattedDate} edited by ${userInfo.name}`
                };
            });
    
            console.log(`Processed ${historyWithDetails.length} history records`);
    
            setEditHistories((prevHistories) => ({
                ...prevHistories,
                [customerId]: historyWithDetails,
            }));
    
            // Toggle visibility of edit history
            setExpandedRows((prevExpanded) => ({
                ...prevExpanded,
                [customerId]: !prevExpanded[customerId], // Toggle visibility
            }));
    
            console.log('History fetch and processing completed successfully');
        } catch (error) {
            console.error('Error in handleFetchHistory:', error);
            // Set an empty array for this customer in case of error
            setEditHistories((prevHistories) => ({
                ...prevHistories,
                [customerId]: [],
            }));
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
        const fetchCustomers = async () => {
            try {
                const { data: customersData, error: customerError } = await supabase
                    .from('Customer')
                    .select('*');
    
                if (customerError) throw customerError;
    
                const customerPromises = customersData.map(async (customer: Customer, index: number) => {
                    const [
                        { data: packageData },
                        { data: deviceData },
                        { data: oltData },
                        { data: interfaceData },
                        { data: statusData },
                        { data: statusHistoryData }
                    ] = await Promise.all([
                        supabase.from('Package').select('package_name').eq('package_id', customer.package_id).single(),
                        supabase.from('Device').select('device_name').eq('device_id', customer.device_id).single(),
                        supabase.from('OLT').select('olt_name').eq('olt_id', customer.olt_id).single(),
                        supabase.from('Interface').select('interface_name').eq('interface_id', customer.interface_id).single(),
                        supabase.from('Customer').select('*').eq('status', 'Completed').eq('customer_id', customer.customer_id).single(),
                        supabase.from('statushistory').select('*').eq('customer_id', customer.customer_id)
                    ]);
    
                    return {
                        ...customer,
                        rowNumber: index + 1,
                        package_name: packageData?.package_name || 'Unknown Package',
                        device_name: deviceData?.device_name || 'Unknown Device',
                        interface_name: interfaceData?.interface_name || 'Unknown Interface',
                        olt_name: oltData?.olt_name || 'Unknown OLT',
                        status: statusData?.status,
                        statusHistory: statusHistoryData || []
                    };
                });
    
                const customersWithDetails = await Promise.all(customerPromises);
                setCustomers(customersWithDetails);
            } catch (error) {
                console.error('Error fetching customers:', error);
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
        
        fetchCustomers();
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

    const handleStatusFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(event.target.value);
        // Consider adding logic to trigger re-rendering or data fetching here
    };

    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value); // Update the search input value
    };

    const handleSearchInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSearch(); // Call the search function when Enter key is pressed
        }
    };
    
    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleSearchFieldChange = (e: { target: { value: React.SetStateAction<string>; }; }) => {
        setSearchField(e.target.value);
    };

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    // Calculate the packages to be displayed on the current page
    const totalPages = Math.ceil(filteredCustomers.length / packagesPerPage);
    const startIndex = (currentPage - 1) * packagesPerPage;
    const displayedCustomers = filteredCustomers.slice(startIndex, startIndex + packagesPerPage);

    if (customers.length === 0) {
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
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => handlePageChange(i + 1)}
                            className={`px-3 py-1 border ${currentPage === i + 1 ? 'bg-red-500 text-white' : 'bg-white text-gray-700'} hover:bg-red-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700`}
                        >
                            {i + 1}
                        </button>
                    ))}
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
 {/* {dropdownOpen && (
                                <div
                                    id="dropdownRadio"
                                    className="z-10 absolute top-full left-0 mt-1 w-48 bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600"
                                    data-popper-reference-hidden=""
                                    data-popper-escaped=""
                                    data-popper-placement="top"
                                >
                                    <ul
                                        className="p-3 space-y-1 text-sm text-gray-700 dark:text-gray-200"
                                        aria-labelledby="dropdownRadioButton"
                                    >
                                        <li>
                                            <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                                <input
                                                    type="radio"
                                                    value=""
                                                    name="status-filter"
                                                    checked={statusFilter === ""}
                                                    onChange={handleStatusFilterChange}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                                <label
                                                    htmlFor="filter-radio-example-1"
                                                    className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                                >
                                                    All
                                                </label>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                                <input
                                                    type="radio"
                                                    value="active"
                                                    name="status-filter"
                                                    checked={statusFilter === "active"}
                                                    onChange={handleStatusFilterChange}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                                <label
                                                    htmlFor="filter-radio-example-2"
                                                    className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                                >
                                                    Active
                                                </label>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                                <input
                                                    type="radio"
                                                    value="inactive"
                                                    name="status-filter"
                                                    checked={statusFilter === "inactive"}
                                                    onChange={handleStatusFilterChange}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                                <label
                                                    htmlFor="filter-radio-example-3"
                                                    className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                                >
                                                    Inactive
                                                </label>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            )} */}