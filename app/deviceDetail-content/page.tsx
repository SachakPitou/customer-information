"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SideBar from '../component/SideBar';


// const ACTIVE = 'active';
// const INACTIVE = 'inactive';
export default function DeviceDetail() {
    const [devices, setDevices] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false); 
    const [deviceToDelete, setDeviceToDelete] = useState(null);
    const [searchValue, setSearchValue] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchField, setSearchField] = useState('all');
    const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
    const [locationFilter, setLocationFilter] = useState('');
    const [powersourceDropdownOpen, setPowerSourceDropdownOpen] = useState(false);
    const [powersourceFilter, setPowerSourceFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const packagesPerPage = 15;
    
    const router = useRouter();

    const handleDeleteDevice = async () => {
        try {
            if (!deviceToDelete) return;

            // Delete the customer from the database
            await supabase.from("Device")
                .delete()
                .eq("device_id", deviceToDelete);
        
            // Update the state to remove the deleted customer
            setDevices(prevDevices => prevDevices.filter(device => device.device_id !== deviceToDelete));
        
            // Log success message
            console.log(`Device with ID ${deviceToDelete} deleted successfully`);
        
            // Close the modal after successful deletion
            setShowModal(false);
        } catch (error) {
            console.error('Error deleting customer:', error.message);
        }
    };
    

    useEffect(() => {
        async function fetchDevices() {
            try {
                const { data: devicesData, error } = await supabase
                    .from('Device')
                    .select('*')
        
                if (error) {
                    throw error;
                }
                const powersourceIds = devicesData.map((device) => device.power_source_id);

                // Fetch package names based on package_ids
                const { data: powersourcesData, error: powersourceError } = await supabase
                    .from('Power Source')
                    .select('power_source_id, power_source_type')
                    .in('power_source_id', powersourceIds);

                if (powersourceError) {
                    throw powersourceError;
                }

                // Map package_ids to package_names
                const powersourceMap = {};
                powersourcesData.forEach((PWS) => {
                    powersourceMap[PWS.power_source_id] = PWS.power_source_type;
                });

                // Combine customer data with package_names
                const devicesWithPowerSources = devicesData.map((device) => ({
                    ...device,
                    power_source_type: powersourceMap[device.power_source_id] || 'Unknown Package',
                }));

                // Update the state with customers including package names
                setDevices(devicesWithPowerSources);

                const locationIds = devicesData.map((device) => device.location_id);

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
                const devicesWithLocations = devicesWithPowerSources.map((device) => ({
                    ...device,
                    location_name: locationMap[device.location_id] || 'Unknown Service',
                }));

                setDevices(devicesWithLocations);

            } catch (error) {
                console.error('Error fetching data:', error.message);
            }
        }
        fetchDevices();
    }, [deviceToDelete, showModal]);
    

        console.log("Filtering devices...");
    
        const filteredDevices = devices.filter((device) => {
            const searchTerm = searchValue.toLowerCase(); // Convert search term to lowercase
        
            // Location filter
            const locationMatch =
                locationFilter === '' || device.location_name.toLowerCase() === locationFilter.toLowerCase();
        
            const powerSourceMatch =
                powersourceFilter === '' || device.power_source_type.toLowerCase() === powersourceFilter.toLowerCase();
        
            if (searchValue === '') {
                return locationMatch && powerSourceMatch; // No search term, return all devices matching location and power source
            }
        
            let isMatchingSearch = false; // Initialize the flag
        
            // Search filter
            if (searchField === 'all') {
                isMatchingSearch = (
                    device.device_name.toLowerCase().includes(searchTerm) ||
                    device.device_type.toLowerCase().includes(searchTerm) ||
                    device.model.toLowerCase().includes(searchTerm) ||
                    device.ip_address.toLowerCase().includes(searchTerm)
                );
            } else if (searchField === 'device_name') {
                isMatchingSearch = device.device_name.toLowerCase().includes(searchTerm);
            } else if (searchField === 'model') {
                const modelString = device.model?.toString() || '';
                const lowerModelString = modelString.toLowerCase();
                const lowerSearchTerm = searchTerm.toLowerCase();
                isMatchingSearch = lowerModelString.includes(lowerSearchTerm);
            } else if (searchField === 'device_type') {
                isMatchingSearch = device.device_type.toLowerCase().includes(searchTerm);
            } else if (searchField === 'ip_address') {
                const ipAddressString = device.ip_address?.toString() || '';
                isMatchingSearch = parseInt(ipAddressString) === parseInt(searchTerm);
            }
        
            return locationMatch && powerSourceMatch && isMatchingSearch; // Return true if location and search match
        });
        
        console.log("Filtered devices:", filteredDevices);
    
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
    const toggleLocationDropdown = () => {
        setLocationDropdownOpen(!locationDropdownOpen);
        // Close power source dropdown
        if (powersourceDropdownOpen) {
            setPowerSourceDropdownOpen(false);
        }
    };
    
    const handleLocationFilterChange = (e) => {
        setLocationFilter(e.target.value);
    };
    
    const togglePowerSourceDropdown = () => {
        setPowerSourceDropdownOpen(!powersourceDropdownOpen);
        // Close location dropdown
        if (locationDropdownOpen) {
            setLocationDropdownOpen(false);
        }
    };
    
    const handlePowerSourceFilterChange = (e) => {
        setPowerSourceFilter(e.target.value);
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
    const totalPages = Math.ceil(filteredDevices.length / packagesPerPage);
    const startIndex = (currentPage - 1) * packagesPerPage;
    const displayedDevices = filteredDevices.slice(startIndex, startIndex + packagesPerPage);


    if (devices.length === 0) {
        return <div>Loading...</div>;
    }
    return (
        <div className="relative w-full overflow-x-auto shadow-md">
            <div className="flex w-full items-center justify-between p-4 bg-white dark:bg-gray-900">
            <div className="relative flex items-center mr-5">
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
                            id="locationDropdownButton"
                            data-dropdown-toggle="locationDropdown"
                            className="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
                            type="button"
                            onClick={toggleLocationDropdown}
                        >
                            Location
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
                        {locationDropdownOpen && (
                            <div
                                id="locationDropdown"
                                className="z-10 absolute top-full left-0 mt-1 w-48 bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600"
                                data-popper-reference-hidden=""
                                data-popper-escaped=""
                                data-popper-placement="top"
                            >
                                <ul
                                    className="p-3 space-y-1 text-sm text-gray-700 dark:text-gray-200"
                                    aria-labelledby="locationDropdownButton"
                                >
                                    <li>
                                        <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <input
                                                type="radio"
                                                value=""
                                                name="location-filter"
                                                checked={locationFilter === ""}
                                                onChange={handleLocationFilterChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <label
                                                htmlFor="location-radio-example-1"
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
                                                value="Poipet"
                                                name="location-filter"
                                                checked={locationFilter === "Poipet"}
                                                onChange={handleLocationFilterChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <label
                                                htmlFor="location-radio-example-2"
                                                className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                            >
                                                Poipet
                                            </label>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <input
                                                type="radio"
                                                value="Phnom Penh"
                                                name="location-filter"
                                                checked={locationFilter === "Phnom Penh"}
                                                onChange={handleLocationFilterChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <label
                                                htmlFor="location-radio-example-3"
                                                className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                            >
                                                Phnom Penh
                                            </label>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <input
                                                type="radio"
                                                value="Pailin"
                                                name="location-filter"
                                                checked={locationFilter === "Pailin"}
                                                onChange={handleLocationFilterChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <label
                                                htmlFor="location-radio-example-4"
                                                className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                            >
                                                Pailin
                                            </label>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <input
                                                type="radio"
                                                value="Bavet"
                                                name="location-filter"
                                                checked={locationFilter === "Bavet"}
                                                onChange={handleLocationFilterChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <label
                                                htmlFor="location-radio-example-5"
                                                className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                            >
                                                Bavet
                                            </label>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className='mr-5'>
                        <button
                            id="powerSourceDropdownButton"
                            data-dropdown-toggle="powerSourceDropdown"
                            className="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
                            type="button"
                            onClick={togglePowerSourceDropdown}
                        >
                            Power Source
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
                        {powersourceDropdownOpen && (
                            <div
                                id="powerSourceDropdown"
                                className="z-10 absolute top-full left-0 mt-1 w-48 bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600"
                                data-popper-reference-hidden=""
                                data-popper-escaped=""
                                data-popper-placement="top"
                            >
                                <ul
                                    className="p-3 space-y-1 text-sm text-gray-700 dark:text-gray-200"
                                    aria-labelledby="powerSourceDropdownButton"
                                >
                                    <li>
                                        <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <input
                                                type="radio"
                                                value=""
                                                name="power-source-filter"
                                                checked={powersourceFilter === ""}
                                                onChange={handlePowerSourceFilterChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <label
                                                htmlFor="power-source-radio-example-1"
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
                                                value="APC-01"
                                                name="power-source-filter"
                                                checked={powersourceFilter === "APC-01"}
                                                onChange={handlePowerSourceFilterChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <label
                                                htmlFor="power-source-radio-example-2"
                                                className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                            >
                                                APC-01
                                            </label>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <input
                                                type="radio"
                                                value="APC-02"
                                                name="power-source-filter"
                                                checked={powersourceFilter === "APC-02"}
                                                onChange={handlePowerSourceFilterChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <label
                                                htmlFor="power-source-radio-example-3"
                                                className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                            >
                                                APC-02
                                            </label>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <input
                                                type="radio"
                                                value="APC-03"
                                                name="power-source-filter"
                                                checked={powersourceFilter === "APC-03"}
                                                onChange={handlePowerSourceFilterChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <label
                                                htmlFor="power-source-radio-example-4"
                                                className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                            >
                                                APC-03
                                            </label>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <input
                                                type="radio"
                                                value="EMERSON"
                                                name="power-source-filter"
                                                checked={powersourceFilter === "EMERSON"}
                                                onChange={handlePowerSourceFilterChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <label
                                                htmlFor="power-source-radio-example-5"
                                                className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                            >
                                                EMERSON
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
                        <option value="device_name">Device Name</option>
                        <option value="model">Model</option>
                        <option value="device_type">Device Type</option>
                        <option value="ip_address">IP Address</option>
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
                          
                        </th> */}
                        <th scope="col" className="px-6 py-3">
                            Name
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Type
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Location
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Model
                        </th>
                        <th scope="col" className="px-6 py-3">
                            IP Address
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Power Source
                        </th>
                        <th scope="col" className="px-6 py-3">
                          
                        </th>
                        <th scope="col" className="px-6 py-3">
                           
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {displayedDevices.map((device) => (
                        <tr key={device.device_id} className="dashboard-text bg-white border-b dark:bg-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-300">
                            {/* <td className="w-4 p-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </td> */}
                            <td className="px-6 py-4">{device.device_name}</td>
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
                            <td className="px-6 py-4">{device.device_type}</td>
                            <td className="px-6 py-4">{device.location_name}</td>
                            <td className="px-6 py-4">{device.model}</td>
                            <td className="px-6 py-4">{device.ip_address}</td>
                            <td className="px-6 py-4">{device.power_source_type}</td>
                            {/* <td className="px-6 py-4">
                                <Link href={`/viewCustomer/${customer.customer_id}`}>
                                    <div className="flex items-center text-blue-600 dark:text-blue-500 hover:underline">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M19 10c0 3.682-2.914 6-7 6s-7-2.318-7-6 2.914-6 7-6 7 2.318 7 6zm-7 4a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </Link>
                            </td> */}
                            <td className="px-6 py-4">
                                <Link href={`/editDevice/${device.device_id}`}>
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
                                        setDeviceToDelete(device.device_id);
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
                    ))}
                </tbody>
            </table>
            <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-900">
                <span className="text-sm text-gray-700 dark:text-gray-400">
                    Showing {startIndex + 1} to {Math.min(startIndex + packagesPerPage, filteredDevices.length)} of {filteredDevices.length} Devices
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
                    <h2 className="text-lg font-semibold text-gray-800">Are you sure you want to delete this device?</h2>
                    <div className="flex justify-end mt-4">
                    <button
                        onClick={handleDeleteDevice} // Call the delete function when 'Yes' button is clicked
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
