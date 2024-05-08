"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ACTIVE = 'active';
const INACTIVE = 'inactive';
export default function Page() {
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false); 
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [searchValue, setSearchValue] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchField, setSearchField] = useState('all');
    const router = useRouter();
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
        async function fetchCustomers() {
            try {
                const { data: customersData, error } = await supabase
                    .from('Customer')
                    .select('*')
        
                if (error) {
                    throw error;
                }
                const packageIds = customersData.map((customer) => customer.package_id);

                // Fetch package names based on package_ids
                const { data: packagesData, error: packageError } = await supabase
                    .from('Package')
                    .select('package_id, package_name')
                    .in('package_id', packageIds);

                if (packageError) {
                    throw packageError;
                }

                // Map package_ids to package_names
                const packageMap = {};
                packagesData.forEach((pkg) => {
                    packageMap[pkg.package_id] = pkg.package_name;
                });

                // Combine customer data with package_names
                const customersWithPackages = customersData.map((customer) => ({
                    ...customer,
                    package_name: packageMap[customer.package_id] || 'Unknown Package',
                }));

                // Update the state with customers including package names
                setCustomers(customersWithPackages);

                const deviceIds = customersData.map((customer) => customer.device_id);

                // Fetch device names based on device_ids
                const { data: devicesData, error: deviceError } = await supabase
                    .from('Device')
                    .select('device_id, device_name')
                    .in('device_id', deviceIds);

                if (deviceError) {
                    throw deviceError;
                }

                // Map device_ids to device_names
                const deviceMap = {};
                devicesData.forEach((dvc) => {
                    deviceMap[dvc.device_id] = dvc.device_name;
                });

                // Update the state with customers including device names
                const customersWithDevices = customersWithPackages.map((customer) => ({
                    ...customer,
                    device_name: deviceMap[customer.device_id] || 'Unknown Device',
                }));

                setCustomers(customersWithDevices);
                
                const serviceIds = customersData.map((customer) => customer.service_id);

                // Fetch service names based on service_ids
                const { data: servicesData, error: serviceError } = await supabase
                    .from('Service')
                    .select('service_id, service_name')
                    .in('service_id', serviceIds);

                if (serviceError) {
                    throw serviceError;
                }

                // Map service_ids to service_names
                const serviceMap = {};
                servicesData.forEach((service) => {
                    serviceMap[service.service_id] = service.service_name;
                });

                // Update the state with customers including service names
                const customersWithServices = customersWithDevices.map((customer) => ({
                    ...customer,
                    service_name: serviceMap[customer.service_id] || 'Unknown Service',
                }));

                setCustomers(customersWithServices);

                const locationIds = customersData.map((customer) => customer.location_id);

                // Fetch service names based on service_ids
                const { data: locationsData, error: locationError } = await supabase
                    .from('Location')
                    .select('location_id, location_name')
                    .in('location_id', locationIds);

                if (locationError) {
                    throw locationError;
                }

                // Map service_ids to service_names
                const locationMap = {};
                locationsData.forEach((location) => {
                    locationMap[location.location_id] = location.location_name;
                });

                // Update the state with customers including service names
                const customersWithLocations = customersWithServices.map((customer) => ({
                    ...customer,
                    location_name: locationMap[customer.location_id] || 'Unknown Service',
                }));

                setCustomers(customersWithLocations);

                const oltIds = customersData.map((customer) => customer.olt_id);

                // Fetch device names based on device_ids
                const { data: oltsData, error: oltError } = await supabase
                    .from<OLT>('OLT')
                    .select('olt_id, olt_name')
                    .in('olt_id', oltIds);

                if (oltError) {
                    throw oltError;
                }

                // Map device_ids to device_names
                const oltMap: Record<number, string> = {};
                oltsData.forEach((olt) => {
                    oltMap[olt.olt_id] = olt.olt_name;
                });

                // Update the state with customers including device names
                const customersWithOLTs = customersWithLocations.map((customer) => ({
                    ...customer,
                    olt_name: oltMap[customer.olt_id] || 'Unknown Device',
                }));
                setCustomers(customersWithOLTs); 

            } catch (error) {
                console.error('Error fetching data:', error.message);
            }
        }

        fetchCustomers();
    }, [customerToDelete, showModal]);
    
    // Filter the displayed data based on the search value
    const filteredCustomers = customers.filter((customer) => {
        const searchTerm = searchValue.toLowerCase(); // Convert search term to lowercase
      
        if (searchValue === '') {
            return true; // No search term, return all customers
        }
      
        let isMatchingSearch = false;
      
        if (searchField === 'all') {
            isMatchingSearch = (
                customer.customer_name.toLowerCase().includes(searchTerm) ||
                customer.phone_number.toLowerCase().includes(searchTerm) ||
                // ... (Add more search criteria here as needed)
                customer.cid.toLowerCase().includes(searchTerm) ||
                customer.package_name.toLowerCase().includes(searchTerm) ||
                (customer.slot && customer.slot.toString().toLowerCase().includes(searchTerm)) ||
                (customer.port && customer.port.toString().toLowerCase().includes(searchTerm)) ||
                (customer.service_port && customer.service_port.toString().toLowerCase().includes(searchTerm)) ||
                (customer.onu_id && typeof customer.onu_id === 'string' && customer.onu_id.toLowerCase().includes(searchTerm)) ||
                customer.ip_address.toLowerCase().includes(searchTerm) ||
                customer.device_name.toLowerCase().includes(searchTerm) ||
                customer.olt_name.toLowerCase().includes(searchTerm)
            );
        } else if (searchField === 'name') {
            isMatchingSearch = customer.customer_name.toLowerCase().includes(searchTerm);
        } else if (searchField === 'service_port') {
            const servicePortString = customer.service_port?.toString() || '';
            isMatchingSearch = parseInt(servicePortString) === parseInt(searchTerm);
        }
    
        console.log('Customer isActive status:', customer.isActive);
        console.log('isMatchingSearch:', isMatchingSearch);
        
    
        const matchesStatusFilter = () => {
            if (statusFilter === "") {
                return true; // No status filter, match all customers
            }
    
            if (statusFilter === "active") {
                return customer.isActive;
            } else if (statusFilter === "inactive") {
                return !customer.isActive;
            }
    
            // Add additional status filter conditions here if needed
        };
    
        // Return true only if both search and status filter conditions are met
        return isMatchingSearch && matchesStatusFilter();
    });

    const handleSearch = () => {
        // Log the search value
        console.log("Search value:", searchValue);
        // Perform search logic if needed
    };
    const handleStatusFilterChange = (event) => {
        setStatusFilter(event.target.value);
    };
    const handleSearchInputChange = (event) => {
        setSearchValue(event.target.value); // Update the search input value
    };

    const handleSearchInputKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSearch(); // Call the search function when Enter key is pressed
        }
    };
    
    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };
    const handleSearchFieldChange = (event) => {
        setSearchField(event.target.value);
      };
    if (customers.length === 0) {
        return <div>Loading...</div>;
    }
    
    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900">
                <button onClick={() => router.back()} type="button" className="w-full flex items-center justify-center w-1/2 ml-5 mt-5 mb-2 px-5 py-2 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700">
                    <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                    </svg>
                </button>
                <div className='relative flex items-center mr-5'>
                
                </div>
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
                        className="mr-2 p-2 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-50" // Updated styling
                    >
                        <option value="all">All Fields</option>
                        <option value="name">Name</option>
                        <option value="service_port">Service Port</option>
                        {/* Add more search field options here */}
                    </select>

                    {/* Search Input - Existing Code (with slight modification) */}
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
                <thead className="title-dashboard text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        {/* <th scope="col" className="p-4">
                          
                        </th> */}
                        <th scope="col" className="px-6 py-3">
                            Name
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Status
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
                        </th>
                        <th scope="col" className="px-6 py-3">
                            IP Address
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Customer Router 
                        </th>
                        <th scope="col" className="px-6 py-3">
                            OLT
                        </th>
                        <th scope="col" className="px-6 py-3">
                            
                        </th>
                        <th scope="col" className="px-6 py-3">
                          
                        </th>
                        <th scope="col" className="px-6 py-3">
                           
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCustomers.map((customer) => (
                        <tr key={customer.customer_id} className="dashboard-text bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            {/* <td className="w-4 p-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </td> */}
                            <td className="px-6 py-4">{customer.customer_name}</td>
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => toggleUserStatus(customer)}
                                    className={`text-sm font-medium rounded-lg px-3 py-1 ${
                                        customer.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                    }`}
                                >
                                    {customer.isActive ? 'Active' : 'Inactive'}
                                </button>
                            </td>
                            <td className="px-6 py-4">{customer.phone_number}</td>
                            <td className="px-6 py-4">{customer.cid}</td>
                            <td className="px-6 py-4">{customer.package_name}</td>
                            <td className="px-6 py-4">{customer.slot}</td>
                            <td className="px-6 py-4">{customer.port}</td>
                            <td className="px-6 py-4">{customer.service_port}</td>
                            <td className="px-6 py-4">{customer.onu_id}</td>
                            <td className="px-6 py-4">{customer.ip_address}</td>
                            <td className="px-6 py-4">{customer.device_name}</td>
                            <td className="px-6 py-4">{customer.olt_name}</td>
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
                            <td className="px-6 py-4">
                                <Link href={`/editCustomer/${customer.customer_id}`}>
                                    <div className="flex items-center text-blue-600 dark:text-blue-500 hover:underline">
                                        <svg className="feather feather-edit" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                        {/* Optionally, you can add a title attribute for accessibility */}
                                    </div>
                                </Link>
                            </td>
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => {
                                        setShowModal(true);
                                        setCustomerToDelete(customer.customer_id);
                                    }}
                                    className="block text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                                    type="button"
                                >
                                    <p>Delete</p>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
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
