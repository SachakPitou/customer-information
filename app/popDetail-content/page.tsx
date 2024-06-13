"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SideBar from '../component/SideBar';


// const ACTIVE = 'active';
// const INACTIVE = 'inactive';
export default function PopDetail() {
    const [pops, setPops] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false); 
    const [popToDelete, setPopToDelete] = useState(null);
    const [searchValue, setSearchValue] = useState('');
    const [searchField, setSearchField] = useState('all');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [locationFilter, setLocationFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const popsPerPage = 15;
    
    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleLocationFilterChange = (event) => {
        setLocationFilter(event.target.value);
    };

    const router = useRouter();

    const handleDeletePop = async () => {
        try {
            if (!popToDelete) return;

            // Delete the package from the database
            await supabase.from("POP")
                .delete()
                .eq("pop_id", popToDelete);
        
            // Update the state to remove the deleted package
            setPops(prevPops => prevPops.filter(pop => pop.pop_id !== popToDelete));
        
            // Log success message
            console.log(`Pop with ID ${popToDelete} deleted successfully`);
        
            // Close the modal after successful deletion
            setShowModal(false);
        } catch (error) {
            console.error('Error deleting pop:', error.message);
        }
    };
    

    useEffect(() => {
        async function fetchPops() {
            try {
                const { data: popsData, error } = await supabase
                    .from('POP')
                    .select('*');
        
                if (error) {
                    throw error;
                }
                const locationIds = popsData.map(pop => pop.pop_id);

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
                locationsData.forEach(loc => {
                    locationMap[loc.location_id] = loc.location_name;
                });

                // Combine package data with service names
                const popsWithLocations = popsData.map(pop => ({
                    ...pop,
                    location_name: locationMap[pop.location_id] || 'Unknown Pop',
                }));

                // Update the state with packages including service names
                setPops(popsWithLocations);

            } catch (error) {
                console.error('Error fetching data:', error.message);
            }
        }
        fetchPops();
    }, [popToDelete, showModal]);

        console.log("Filtering packages...");
        const filteredPops = pops.filter((pop) => {
            const searchTerm = searchValue.toLowerCase(); // Convert search term to lowercase
            
            const locationMatch =
            locationFilter === '' || pop.location_name.toLowerCase() === locationFilter.toLowerCase(); 

            if (searchValue === '' && locationMatch ) {
                return true; // No search term, return all packages
            }
        
            let isMatchingSearch = false; // Initialize the flag
        
            // Search filter
            if (searchField === 'all') {
                isMatchingSearch = (
                    pop.pop_name.toLowerCase().includes(searchTerm) ||
                    pop.location_name.toLowerCase().includes(searchTerm)
                );
            } else if (searchField === 'pop_name') {
                // Adjusted from 'device.device_name' to 'pkg.package_name'
                isMatchingSearch =  (pop.pop_name.toLowerCase().includes(searchTerm));
            } else if (searchField === 'location_name') {
                // Adjusted from 'device.model' to 'pkg.model'
                isMatchingSearch = (pop.location_name.toLowerCase().includes(searchTerm));
            }
        
            return isMatchingSearch && locationMatch; // Return true if search matches
        });
        
        console.log("Filtered pops:", filteredPops);
        
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
        
        const handleSearchFieldChange = (event) => {
            setSearchField(event.target.value);
        };

        const handlePageChange = (pageNumber) => {
            setCurrentPage(pageNumber);
        };
    
        // Calculate the packages to be displayed on the current page
        const totalPages = Math.ceil(filteredPops.length / popsPerPage);
        const startIndex = (currentPage - 1) * popsPerPage;
        const displayedPops = filteredPops.slice(startIndex, startIndex + popsPerPage);

        
        if (pops.length === 0) {
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
                        id="dropdownServiceButton"
                        data-dropdown-toggle="dropdownService"
                        className="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
                        type="button"
                        onClick={toggleDropdown}
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
                    {dropdownOpen && (
                        <div
                            id="dropdownService"
                            className="z-10 absolute top-full left-0 mt-1 w-48 bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600"
                            data-popper-reference-hidden=""
                            data-popper-escaped=""
                            data-popper-placement="top"
                        >
                            <ul
                                className="p-3 space-y-1 text-sm text-gray-700 dark:text-gray-200"
                                aria-labelledby="dropdownServiceButton"
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
                                            htmlFor="filter-service-example-1"
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
                                            value="PoiPet"
                                            name="location-filter"
                                            checked={locationFilter === "PoiPet"}
                                            onChange={handleLocationFilterChange}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <label
                                            htmlFor="filter-service-example-2"
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
                                            htmlFor="filter-service-example-3"
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
                                            htmlFor="filter-service-example-3"
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
                                            htmlFor="filter-service-example-3"
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
                    <select 
                        value={searchField} 
                        onChange={handleSearchFieldChange} 
                        className="mr-5 p-2 text-sm text-gray-900 border border-gray-300 rounded-lg w-30 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-50" // Updated styling
                    >
                        <option value="all">All Fields</option>
                        <option value="pop_name">Pop Name</option>
                        <option value="location_name">Location Name</option>
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
                            Pop Name
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Location Name
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
                    {displayedPops.map((pop)=> (
                        <tr key={pop.pop_id} className="dashboard-text bg-white border-b dark:bg-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-300">
            
                            <td className="px-6 py-4">{pop.pop_name}</td> {/* Changed from pkg.service_name */}
                            <td className="px-6 py-4">{pop.location_name}</td>
                            <td className="px-6 py-4">
                                <Link href={`/viewPop/${pop.pop_id}`}>
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
                                <Link href={`/editPOP/${pop.pop_id}`}>
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
                                        setPopToDelete(pop.pop_id);
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
                    Showing {startIndex + 1} to {Math.min(startIndex + popsPerPage, filteredPops.length)} of {filteredPops.length} Pops
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
            {/* {totalPages > 1 && (
                <div className="flex justify-center my-4">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 mx-1 border rounded ${currentPage === 1 ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}
                    >
                        Previous
                    </button>
                    {[...Array(totalPages)].map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handlePageChange(index + 1)}
                            className={`px-4 py-2 mx-1 border rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 mx-1 border rounded ${currentPage === totalPages ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}
                    >
                        Next
                    </button>
                </div>
            )} */}
            {showModal && (
                <div className="fixed top-0 left-0 z-50 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
                    <h2 className="text-lg font-semibold text-gray-800">Are you sure you want to delete this pop?</h2>
                    <div className="flex justify-end mt-4">
                    <button
                        onClick={handleDeletePop} // Call the delete function when 'Yes' button is clicked
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
