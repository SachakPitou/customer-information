"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SideBar from '../component/SideBar';
import FilterDropdowns from '../component/filterdropdown';
import LoadingSpinner from '../component/LoadingSpinner';

interface Device {
  device_id: string;
  device_name: string;
  device_type: string;
  model: string;
  ip_address: string;
  ups_name_1: string;
  ups_name_2: string;
  power_source_type_1: string;
  power_source_type_2: string;
  location_name: string;
  rack_name: string;
  pop_name: string;
  status: 'active' | 'inactive' | string;
  deployedBy: string;
  add_date: string;
}

export default function DeviceDetail() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false); 
    const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchField, setSearchField] = useState('all');
    const [locationFilter, setLocationFilter] = useState<string>('');
    const [locationDropdownOpen, setLocationDropdownOpen] = useState<boolean>(false);
    const [powersourceFilter, setPowerSourceFilter] = useState<string>('');
    const [powersourceDropdownOpen, setPowerSourceDropdownOpen] = useState<boolean>(false); 
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
            // Type-checking the unknown error
            if (error instanceof Error) {
                console.error('Error fetching devices:', error.message);
            } else {
                console.error('Unexpected error:', error);
            }
        }
    };
    

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const { data: devicesData, error: deviceError } = await supabase
                    .from('Device')
                    .select('*');
                
                if (deviceError) throw deviceError;
    
                const devicePromises = devicesData.map(async (device) => {
                    const [powerSource1Data, powerSource2Data] = await Promise.all([
                        supabase
                            .from('Power Source')
                            .select('power_source_type')
                            .eq('power_source_id', device.power_source_id_1)
                            .single(),
                        supabase
                            .from('Power Source')
                            .select('power_source_type')
                            .eq('power_source_id', device.power_source_id_2)
                            .single()
                    ]);

                    const { data: deviceTypeData } = await supabase
                        .from('Device Type')
                        .select('device_type')
                        .eq('device_type_id', device.device_type_id)
                        .single();                       
    
                    const { data: locationData } = await supabase
                        .from('Location')
                        .select('location_name')
                        .eq('location_id', device.location_id)
                        .single();
    
                    const { data: upsData } = await supabase
                        .from('UPS')
                        .select('ups_name')
                        .eq('ups_id', device.ups_id)
                        .single();
                        const { data: upsData2 } = await supabase
                        .from('UPS')
                        .select('ups_name')
                        .eq('ups_id', device.ups_id_2)
                        .single();
                    // Fetch rack information by joining RackDevice and Rack tables
                    const { data: rackDeviceData } = await supabase
                        .from('Rack Device')
                        .select('rack_id')
                        .eq('device_id', device.device_id)
                        .single();

                    let rackData = null;
                    let popData = null;

                    // Check both direct rack_id in Device and Rack Device table
                    const rackId = device.rack_id || rackDeviceData?.rack_id;

                    if (rackId) {
                        const { data: rackDetailsData } = await supabase
                            .from('Rack')
                            .select('rack_name, pop_id')
                            .eq('rack_id', rackId)
                            .single();

                        rackData = rackDetailsData;

                        if (rackDetailsData?.pop_id) {
                            const { data: popDetailsData } = await supabase
                                .from('POP')
                                .select('pop_name')
                                .eq('pop_id', rackDetailsData.pop_id)
                                .single();

                            popData = popDetailsData;
                        }
                    }
    
                    return {
                        ...device,
                        power_source_type_1: powerSource1Data?.data?.power_source_type || 'N/A',
                        power_source_type_2: powerSource2Data?.data?.power_source_type || 'N/A',
                        location_name: locationData?.location_name || 'Unknown Location',
                        ups_name_1: upsData?.ups_name || 'Unknown UPS',
                        ups_name_2: upsData2?.ups_name || 'Unknown UPS',
                        device_type: deviceTypeData?.device_type || 'Unknown Device Type',
                        rack_name: rackData?.rack_name || 'Unknown Rack',
                        pop_name: popData?.pop_name || 'Unknown Pop'
                    };
                });
    
                const devicesWithDetails = await Promise.all(devicePromises);
                setDevices(devicesWithDetails);
            } catch (error) {
                // Type-checking the unknown error
                if (error instanceof Error) {
                    console.error('Error fetching devices:', error.message);
                } else {
                    console.error('Unexpected error:', error);
                }
            }
        };
    
        fetchDevices();
    }, [deviceToDelete, showModal]);
    const [filters, setFilters] = useState({
        location: "",
        powerSource: "",
        rack: "",
        pop: "",
        status: "",
    });
    const filteredDevices = devices.filter((device) => {
        const searchTerm = searchValue.toLowerCase();
    
        // Filter matches
        const locationMatch = !filters.location || 
            device.location_name.toLowerCase() === filters.location.toLowerCase();
    
        const powerSourceMatch = !filters.powerSource || 
            device.power_source_type_1.toLowerCase() === filters.powerSource.toLowerCase() ||
            device.power_source_type_2.toLowerCase() === filters.powerSource.toLowerCase();
    
        const rackMatch = !filters.rack || 
            device.rack_name.toLowerCase().includes(filters.rack.toLowerCase());
    
        const popMatch = !filters.pop || 
            device.pop_name.toLowerCase() === filters.pop.toLowerCase();
            
        const statusMatch = !filters.status || 
            device.status.toLowerCase() === filters.status.toLowerCase();
    
        // If no search value, return just the filter matches
        if (searchValue === '') {
            return locationMatch && powerSourceMatch && rackMatch && popMatch && statusMatch;
        }
    
        // Search field matching logic
        let isMatchingSearch = false;
    
        if (searchField === 'all') {
            isMatchingSearch = (
                device.device_name.toLowerCase().includes(searchTerm) ||
                device.device_type.toLowerCase().includes(searchTerm) ||
                device.model.toLowerCase().includes(searchTerm) ||
                device.ip_address.toLowerCase().includes(searchTerm) ||
                device.ups_name_1.toLowerCase().includes(searchTerm) ||
                device.ups_name_2.toLowerCase().includes(searchTerm)
            );
        } else if (searchField === 'device_name') {
            isMatchingSearch = device.device_name.toLowerCase().includes(searchTerm);
        } else if (searchField === 'model') {
            const modelString = device.model?.toString() || '';
            const lowerModelString = modelString.toLowerCase();
            isMatchingSearch = lowerModelString.includes(searchTerm);
        } else if (searchField === 'device_type') {
            isMatchingSearch = device.device_type.toLowerCase().includes(searchTerm);
        } else if (searchField === 'ip_address') {
            const ipAddressString = device.ip_address?.toString() || '';
            isMatchingSearch = ipAddressString.includes(searchTerm);
        } else if (searchField === 'ups') {
            const upsString = device.ups_name_1?.toString() || '';
            isMatchingSearch = upsString.toLowerCase().includes(searchTerm);
        }
    
        // Return true only if all conditions are met
        return locationMatch && powerSourceMatch && rackMatch && popMatch && statusMatch && isMatchingSearch;
    });
    
    const handleSearch = () => {
        console.log("Search value:", searchValue);
    };
    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value);
    };

    const handleSearchInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };
    const handleSearchFieldChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSearchField(event.target.value);
    };

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };
    const calculateDeviceDuration = (addDate: string) => {
        const currentDate = new Date();
        const deviceAddDate = new Date(addDate);
        const durationInMs = currentDate.getTime() - deviceAddDate.getTime();
        const durationInDays = Math.floor(durationInMs / (1000 * 60 * 60 * 24));
        return durationInDays;
    };
    const totalPages = Math.ceil(filteredDevices.length / packagesPerPage);
    const startIndex = (currentPage - 1) * packagesPerPage;
    const displayedDevices = filteredDevices.slice(startIndex, startIndex + packagesPerPage);

    if (devices.length === 0) {
        return <LoadingSpinner />;
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
                <div className="relative flex items-center mr-5">
                <div className='mr-5'>
                    <FilterDropdowns 
                        devices={devices} 
                        filters={filters} 
                        setFilters={setFilters} 
                    />
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
                        <option value="ip_address">IP Management</option>
                        <option value="ups">UPS</option>
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
            </div>
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="title-dashboard text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-300 dark:text-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">
                            No.
                        </th>
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
                            POP
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Rack
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Model
                        </th>
                        <th scope="col" className="px-6 py-3">
                            IP Management
                        </th>
                        <th scope="col" className="px-6 py-3">
                            PWS 1
                        </th>
                        <th scope="col" className="px-6 py-3">
                            PWS 2
                        </th>
                        <th scope="col" className="px-6 py-3">
                            UPS 1 
                        </th>
                        <th scope="col" className="px-6 py-3">
                            UPS 2 
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Status
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Duration
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Deploy By
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
                    {displayedDevices.map((device, index) => (
                        <tr key={device.device_id} className="dashboard-text bg-white border-b dark:bg-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-300">
                            <td className="px-6 py-4">{startIndex + index + 1}</td>
                            <td className="px-6 py-4">{device.device_name}</td>
                            <td className="px-6 py-4">{device.device_type}</td>
                            <td className="px-6 py-4">{device.location_name}</td>
                            <td className="px-6 py-4">{device.pop_name}</td>
                            <td className="px-6 py-4">{device.rack_name}</td>
                            <td className="px-6 py-4">{device.model}</td>
                            <td className="px-6 py-4">{device.ip_address}</td>
                            <td className="px-6 py-4">{device.power_source_type_1}</td>
                            <td className="px-6 py-4">{device.power_source_type_2}</td>
                            <td className="px-6 py-4">{device.ups_name_1}</td>
                            <td className="px-6 py-4">{device.ups_name_2}</td>
                            
                            <td className="px-6 py-4">
                                <span
                                    className={`px-3 py-1 rounded-lg font-medium ${
                                    device.status === 'active'
                                        ? 'bg-green-500 text-white'
                                        : device.status === 'inactive'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-400 text-white'
                                    }`}
                                >
                                    {device.status}
                                </span>
                            </td>
                            <td className="px-6 py-4">{calculateDeviceDuration(device.add_date)} days</td>
                            <td className="px-6 py-4">{device.deployedBy}</td>
                            <td className="px-6 py-4">
                                <Link href={`/viewDevice/${device.device_id}`}>
                                    <div className="flex items-center text-blue-600 dark:text-blue-500 hover:underline">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M19 10c0 3.682-2.914 6-7 6s-7-2.318-7-6 2.914-6 7-6 7 2.318 7 6zm-7 4a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </Link>
                            </td>
                            <td className="px-6 py-4">
                                <Link href={`/editDevice/${device.device_id}`}>
                                    <div className="flex items-center text-blue-600 dark:text-blue-500 hover:underline">
                                        <svg className="feather feather-edit" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
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
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
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
