"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import SideBar from '../component/SideBar';

export default function Dashboard() {
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [searchValue, setSearchValue] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchField, setSearchField] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [userType, setUserType] = useState('');
    const [session, setSession] = useState(null);
    const [editHistories, setEditHistories] = useState({});
    const [expandedRows, setExpandedRows] = useState({});
    

    const router = useRouter();
    const packagesPerPage = 15;

    const toggleRow = (customerId) => {
        setExpandedRows((prevState) => ({
            ...prevState,
            [customerId]: !prevState[customerId],
        }));
    };

    const toggleUserStatus = async (customer) => {
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
            console.error('Error toggling user status:', error.message);
        }
    };

    const handleFetchHistory = async (customerId) => {
        try {
            const { data: historyData, error: historyError } = await supabase
                .from('CustomerHistory')
                .select('*')
                .eq('customer_id', customerId);

            if (historyError) throw historyError;

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

            // Fetch details for all relevant entities
            const [locationsData, oltsData, devicesData, servicesData, packagesData, interfacesData] = await Promise.all([
                supabase.from('Location').select('location_id, location_name').in('location_id', locationIds),
                supabase.from('OLT').select('olt_id, olt_name').in('olt_id', oltIds),
                supabase.from('Device').select('device_id, device_name').in('device_id', deviceIds),
                supabase.from('Service').select('service_id, service_name').in('service_id', serviceIds),
                supabase.from('Package').select('package_id, package_name').in('package_id', packageIds),
                supabase.from('Interface').select('interface_id, interface_name').in('interface_id', interfaceIds),
            ]);

            // Create maps for easy lookup
            const locationMap = Object.fromEntries(locationsData.data.map((loc) => [loc.location_id, loc.location_name]));
            const oltMap = Object.fromEntries(oltsData.data.map((olt) => [olt.olt_id, olt.olt_name]));
            const deviceMap = Object.fromEntries(devicesData.data.map((dev) => [dev.device_id, dev.device_name]));
            const serviceMap = Object.fromEntries(servicesData.data.map((srv) => [srv.service_id, srv.service_name]));
            const packageMap = Object.fromEntries(packagesData.data.map((pkg) => [pkg.package_id, pkg.package_name]));
            const interfaceMap = Object.fromEntries(interfacesData.data.map((inte) => [inte.interface_id, inte.interface_name]));

            const historyWithDetails = historyData.map((history) => {
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
                    changeDescription = `Package changed from "${oldInterfaceName}" to "${newInterfaceName}"`;
                } else if (history.field_changed === 'isActive') {
                    const oldStatusName = history.old_value === 'true' ? 'Active' : 'Inactive';
                    const newStatusName = history.new_value === 'true' ? 'Active' : 'Inactive';
                    changeDescription = `Status changed from "${oldStatusName}" to "${newStatusName}"`;
                } else {
                    changeDescription = `${history.field_changed} changed from "${history.old_value}" to "${history.new_value}"`;
                }

                return {
                    ...history,
                    changeDescription,
                };
            });

            setEditHistories((prevHistories) => ({
                ...prevHistories,
                [customerId]: historyWithDetails,
            }));

            // Toggle visibility of edit history
            setExpandedRows((prevExpanded) => ({
                ...prevExpanded,
                [customerId]: !prevExpanded[customerId], // Toggle visibility
            }));
        } catch (error) {
            console.error('Error fetching edit history:', error.message);
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
            console.error('Error deleting customer:', error.message);
        }
    };
    

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const { data: customersData, error: customerError } = await supabase
                    .from('Customer')
                    .select('*');
    
                if (customerError) throw customerError;
    
                const customerPromises = customersData.map(async (customer) => {
                    const { data: packageData } = await supabase
                        .from('Package')
                        .select('package_name')
                        .eq('package_id', customer.package_id)
                        .single();
    
                    const { data: deviceData } = await supabase
                        .from('Device')
                        .select('device_name')
                        .eq('device_id', customer.device_id)
                        .single();
    
                    const { data: oltData } = await supabase
                        .from('OLT')
                        .select('olt_name')
                        .eq('olt_id', customer.olt_id)
                        .single();

                    const { data: interfaceData } = await supabase
                        .from('Interface')
                        .select('interface_name')
                        .eq('interface_id', customer.interface_id)
                        .single();
                    
                    const { data: statusData } = await supabase
                        .from('Customer')
                        .select('*')
                        .eq('status', 'Completed')
                        .eq('customer_id', customer.customer_id)
                        .single();
                    return {
                        ...customer,
                        package_name: packageData?.package_name || 'Unknown Package',
                        device_name: deviceData?.device_name || 'Unknown Device',
                        interface_name: interfaceData?.interface_name || 'Unknown Interface',
                        olt_name: oltData?.olt_name || 'Unknown OLT',
                        status: statusData?.status
                    };
                });
    
                const customersWithDetails = await Promise.all(customerPromises);
                setCustomers(customersWithDetails);
            } catch (error) {
                console.error('Error fetching customers:', error.message);
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
                console.error('Error fetching user type:', error.message);
            }
        };
        
        fetchCustomers();
        fetchUserType();
    }, [customerToDelete, showModal]);
    
    
        console.log("Filtering customers...");
    
        const filteredCustomers = customers.filter((customer) => {
            const searchTerm = searchValue.toLowerCase(); // Convert search term to lowercase
            
            const statusCustomer = customer.status === "Completed";

            const statusMatch = statusFilter === "" || (statusFilter === "active" && customer.isActive) || (statusFilter === "inactive" && !customer.isActive);
            
            if (searchValue === '' && statusMatch) {
                return statusCustomer; // No search term and status filter match, return all customers
            }
            
            let isMatchingSearch = false; // Initialize the flag
            
            // Search filter
            if (searchField === 'all') {
                isMatchingSearch = (
                    customer.customer_name.toLowerCase().includes(searchTerm) ||
                    customer.phone_number.toLowerCase().includes(searchTerm) ||
                    customer.cid.toLowerCase().includes(searchTerm) ||
                    customer.package_name.toLowerCase().includes(searchTerm) ||
                    (customer.slot && customer.slot.toString().toLowerCase().includes(searchTerm)) ||
                    (customer.port && customer.port.toString().toLowerCase().includes(searchTerm)) ||
                    (customer.service_port && customer.service_port.toString().toLowerCase().includes(searchTerm)) ||
                    (typeof customer.onu_id === 'string' && customer.onu_id.toLowerCase().includes(searchTerm)) ||
                    customer.ip_address.toLowerCase().includes(searchTerm) ||
                    customer.device_name.toLowerCase().includes(searchTerm) ||
                    customer.olt_name.toLowerCase().includes(searchTerm)
                );
            } else if (searchField === 'name') {
                isMatchingSearch = customer.customer_name.toLowerCase().includes(searchTerm);
            } else if (searchField === 'phone_number') {
                const phoneNumberString = customer.phone_number?.toString() || '';
                isMatchingSearch = parseInt(phoneNumberString) === parseInt(searchTerm);
            } else if (searchField === 'service_port') {
                const servicePortString = customer.service_port?.toString() || '';
                isMatchingSearch = parseInt(servicePortString) === parseInt(searchTerm);
            } else if (searchField === 'port') {
                const portString = customer.port?.toString() || '';
                isMatchingSearch = parseInt(portString) === parseInt(searchTerm);
            } else if (searchField === 'slot') {
                const slotString = customer.slot?.toString() || '';
                isMatchingSearch = parseInt(slotString) === parseInt(searchTerm);
            } else if (searchField === 'cid') {
                const cidString = customer.cid?.toString().toLowerCase() || ''; // Convert to lowercase for case-insensitive comparison
                isMatchingSearch = cidString.startsWith(searchTerm.toLowerCase());
            } else if (searchField === 'internet_package') {
                const internetPackageString = customer.package_name?.toString().toLowerCase() || ''; // Convert to lowercase for case-insensitive comparison
                isMatchingSearch = internetPackageString.startsWith(searchTerm.toLowerCase());
            } else if (searchField === 'onu_id') {
                const onuIDString = customer.onu_id?.toString() || '';
                isMatchingSearch = parseInt(onuIDString) === parseInt(searchTerm);
            } else if (searchField === 'ip_address') {
                const ipAddressString = customer.ip_address?.toString().toLowerCase() || ''; // Convert to lowercase for case-insensitive comparison
                isMatchingSearch = ipAddressString.startsWith(searchTerm.toLowerCase());
            }
            // console.log ("status customer: ", statusCustomer);
            return isMatchingSearch && statusMatch && statusCustomer;
            
             // Return true if both search and status match
        });
        console.log("Filtered customers:", filteredCustomers);
        
    const handleSearch = () => {
        // Log the search value
        console.log("Search value:", searchValue);
        // Perform search logic if needed
    };
    const handleStatusFilterChange = (event) => {
        setStatusFilter(event.target.value);
        // Consider adding logic to trigger re-rendering or data fetching here
      };
    const handleSearchInputChange = (event) => {
        setSearchValue(event.target.value); // Update the search input value
    };

    const handleSearchInputKeyPress = (event: { key: string; }) => {
        if (event.key === 'Enter') {
            handleSearch(); // Call the search function when Enter key is pressed
        }
    };
    
    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };
    const handleSearchFieldChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        setSearchField(event.target.value);
      };
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
    // Calculate the packages to be displayed on the current page
    const totalPages = Math.ceil(filteredCustomers.length / packagesPerPage);
    const startIndex = (currentPage - 1) * packagesPerPage;
    const displayedCustomers = filteredCustomers.slice(startIndex, startIndex + packagesPerPage);
    if (customers.length === 0) {
        return <div>Loading...</div>;
    }
    return (
        <div className="w-full relative overflow-x-auto shadow-md">
            <div className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900">
                <div className="w-full relative flex items-center mr-5">
                    <button onClick={() => router.back()} type="button" className="w-full flex items-center justify-center w-1/2 ml-5 mt-5 mb-2 px-5 py-2 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700">
                        <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                        </svg>
                    </button>
                    <button onClick={() => router.push('/')} type="button" className="w-full flex items-center justify-center w-1/2 ml-5 mt-5 mb-2 px-5 py-2 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700">
                        <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m4 12 8-8 8 8M6 10.5V19a1 1 0 0 0 1 1h3v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h3a1 1 0 0 0 1-1v-8.5"/>
                        </svg>
                    </button>
                </div>
                {/* <div className='relative flex items-center'>
                
                </div> */}
                <div className="relative flex items-center mr-5">
                <div className='mr-5'>
                        <button
                            id="dropdownRadioButton"
                            data-dropdown-toggle="dropdownRadio"
                            className="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
                            type="button"
                            onClick={toggleDropdown}
                        >
                            Status
                            <svg
                                className="w-2.5 h-2.5 ms-2.5"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 10 6"
                            >
                                <path
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="m1 1 4 4 4-4"
                                />
                            </svg>
                        </button>
                            {dropdownOpen && (
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
                            )}
                    </div>
                    <select 
                        value={searchField} 
                        onChange={handleSearchFieldChange} 
                        className="mr-5 p-2 text-sm text-gray-900 border border-gray-300 rounded-lg w-30 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-50" // Updated styling
                    >
                        <option value="all">All Fields</option>
                        <option value="name">Name</option>
                        <option value="phone_number">Phone Number</option>
                        <option value="cid">CID</option>
                        <option value="internet_package">Internet Package</option>
                        {/* <option value="slot">Slot</option>
                        <option value="port">Port</option>
                        <option value="service_port">Service Port</option>  
                        <option value="onu_id">ONU ID</option>  
                        <option value="ip_address">IP Address</option>   */}
                    </select>
                    <label htmlFor="table-search" className="sr-only">Search</label> 
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                        </svg>
                        </div>
                        <input 
                        type="text" 
                        id="table-search" 
                        className="block p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                        placeholder="Search for items" 
                        value={searchValue}
                        onChange={handleSearchInputChange}
                        onKeyPress={handleSearchInputKeyPress}
                        />
                    </div>
                </div>
                {/* <button 
                    onClick={handleSearch}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:bg-blue-700"
                >
                    Search
                </button> */}
            </div>
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="title-dashboard text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-300 dark:text-gray-700">
                    <tr>
                        {/* <th scope="col" className="p-4">
                            <!-- Adjust as needed -->
                        </th> */}
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
                        {/* {/* <th scope="col" className="px-6 py-3">
                            Slot
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Port
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Service Port
                        </th>
                        <th scope="col" className="px-6 py-3">
                            ONU ID
                        </th> */}
                        <th scope="col" className="px-6 py-3">
                            IP Address
                        </th>
                        {/* <th scope="col" className="px-6 py-3">
                            Interface
                        </th>  */}
                        {/* <th scope="col" className="px-6 py-3">
                            OLT
                        </th> */}
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
                                {/* <td className="w-4 p-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>
                                </td> */}
                                <td className="px-6 py-4">{customer.customer_name}</td>
                                {/* <td className="px-6 py-4">
                                    <button
                                        onClick={() => toggleUserStatus(customer)}
                                        className={`text-sm font-medium rounded-lg px-3 py-1 ${
                                            customer.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                        }`}
                                    >
                                        {customer.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </td> */}
                                <td className="px-6 py-4">
                                    <button className={`px-4 py-2 font-semibold text-sm text-white rounded-full ${customer.isActive ? 'bg-green-500' : 'bg-red-500'}`}>
                                        {customer.isActive ? 'Active' : 'Inactive'}
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
                                {/* <td className="px-6 py-4">{customer.slot}</td>
                                <td className="px-6 py-4">{customer.port}</td>
                                <td className="px-6 py-4">{customer.service_port}</td>
                                <td className="px-6 py-4">{customer.onu_id}</td>
                                <td className="px-6 py-4">{customer.ip_address}</td> */}
                                <td className="px-6 py-4">{customer.ip_address}</td>
                                {/* <td className="px-6 py-4">{customer.interface_name}</td> */}
                                {/* <td className="px-6 py-4">{customer.olt_name}</td> */}
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
                                    <td colSpan="15" className="px-6 py-4">
                                        <div className="mt-4">
                                            {editHistories[customer.customer_id]?.map((history) => (
                                                <div key={history.id} className="p-2 border-b border-white text-black">
                                                    <div>
                                                        <strong>Edit Date:</strong> {new Date(history.timestamp.replace(',', '')).toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}
                                                    </div>
                                                    <div>
                                                        <strong>Changes:</strong> {history.changeDescription}
                                                    </div>
                                                </div>
                                            ))}
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
                            className={`px-3 py-1 border ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'} hover:bg-blue-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700`}
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
                        No, cancel
                    </button>
                    </div>
                </div>
                </div>
            )}
        </div>
    );
}
 