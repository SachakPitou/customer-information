"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Page() {
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false); 
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [searchValue, setSearchValue] = useState('');
    const router = useRouter();
    const handleDeleteCustomer = async () => {
        try {
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
                const { data: customersData, error } = await supabase.from('Customer').select('*');
                if (error) {
                    throw error;
                }

                // Extract all package_ids from customers
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

                setCustomers(customersWithDevices); // Set the state with customers that include device names

            } catch (error) {
                console.error('Error fetching data:', error.message);
            }
        }

        fetchCustomers();
    }, [customerToDelete, showModal]);

    
    // Filter the displayed data based on the search value
    const filteredCustomers = customers.filter((customer) => {
        return (
            customer.customer_name.toLowerCase().includes(searchValue.toLowerCase()) ||
            customer.phone_number.toLowerCase().includes(searchValue.toLowerCase()) ||
            customer.cid.toLowerCase().includes(searchValue.toLowerCase()) ||
            customer.package_name.toLowerCase().includes(searchValue.toLowerCase()) ||
            (customer.slot && customer.slot.toString().toLowerCase().includes(searchValue.toLowerCase())) ||
            (customer.port && customer.port.toString().toLowerCase().includes(searchValue.toLowerCase())) ||
            (customer.service_port && customer.service_port.toString().toLowerCase().includes(searchValue.toLowerCase())) ||
            (customer.onu_id && typeof customer.onu_id === 'string' && customer.onu_id.toLowerCase().includes(searchValue.toLowerCase())) ||
            customer.ip_address.toLowerCase().includes(searchValue.toLowerCase()) ||
            customer.device_name.toLowerCase().includes(searchValue.toLowerCase())
        );
    });

    const handleSearch = () => {
        // Log the search value
        console.log("Search value:", searchValue);
        // Perform search logic if needed
    };

    const handleSearchInputChange = (event) => {
        setSearchValue(event.target.value); // Update the search input value
    };

    const handleSearchInputKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSearch(); // Call the search function when Enter key is pressed
        }
    };
    if (customers.length === 0) {
        return <div>Loading...</div>;
    }
    
    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 pb-4 bg-white dark:bg-gray-900">
                <button onClick={() => router.back()} type="button" className="w-full flex items-center justify-center w-1/2 ml-5 mt-5 mb-2 px-5 py-2 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700">
                    <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                    </svg>
                </button>
                
                <label htmlFor="table-search" className="sr-only">Search</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 rtl:inset-r-0 rtl:right-0 flex items-center ps-3 pointer-events-none">
                        <svg className="mr-8 mt-5 w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path></svg>
                    </div>
                    <input 
                        type="text" 
                        id="table-search" 
                        className="mr-8 mt-5 block p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                        placeholder="Search for items" 
                        value={searchValue}
                        onChange={handleSearchInputChange}
                        onKeyPress={handleSearchInputKeyPress}
                    />
                </div>
                {/* <button 
                    onClick={handleSearch}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:bg-blue-700"
                >
                    Search
                </button> */}
            </div>
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        {/* <th scope="col" className="p-4">
                          
                        </th> */}
                        <th scope="col" className="px-6 py-3">
                            Name
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
                            <div className="truncate">
                                Customer Router 
                            </div>
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
                            <td className="px-6 py-4">{customer.phone_number}</td>
                            <td className="px-6 py-4">{customer.cid}</td>
                            <td className="px-6 py-4">{customer.package_name}</td>
                            <td className="px-6 py-4">{customer.slot}</td>
                            <td className="px-6 py-4">{customer.port}</td>
                            <td className="px-6 py-4">{customer.service_port}</td>
                            <td className="px-6 py-4">{customer.onu_id}</td>
                            <td className="px-6 py-4">{customer.ip_address}</td>
                            <td className="px-6 py-4">{customer.device_name}</td>
                            <td className="px-6 py-4">
                                <Link href={`/viewCustomer/${customer.customer_id}`} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                                    View Customer
                                </Link>
                            </td>
                            <td className="px-6 py-4">
                                <Link href={`/editCustomer/${customer.customer_id}`} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                                    Edit Customer
                                </Link>
                            </td>
                            <td className="px-6 py-4">
                            <button
                                onClick={() => {
                                    setShowModal(true);
                                    setCustomerToDelete(customer.customer_id); // Set the customer ID to delete when the button is clicked
                                }}
                                className="block text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                                type="button"
                                >
                                Delete Customer
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
