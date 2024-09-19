"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SideBar from '../component/SideBar';

interface Pop {
  image_url: string;
  pop_id: number;
  pop_name: string;
  location_id: number;
  location_name: string;
}

export default function PopDetail() {
    const [pops, setPops] = useState<Pop[]>([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [popToDelete, setPopToDelete] = useState<number | null>(null);
    const [searchValue, setSearchValue] = useState('');
    const [searchField, setSearchField] = useState('all');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [locationFilter, setLocationFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const popsPerPage = 15;
    
    const router = useRouter();

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleLocationFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocationFilter(event.target.value);
    };

    const handleDeletePop = async () => {
        try {
            if (!popToDelete) return;

            await supabase.from("POP")
                .delete()
                .eq("pop_id", popToDelete);
        
            setPops(prevPops => prevPops.filter(pop => pop.pop_id !== popToDelete));
            console.log(`Pop with ID ${popToDelete} deleted successfully`);
            setShowModal(false);
        } catch (error) {
            console.error('Error deleting pop:', (error as Error).message);
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
                const locationIds = popsData.map(pop => pop.location_id);

                const { data: locationsData, error: locationError } = await supabase
                    .from('Location')
                    .select('location_id, location_name')
                    .in('location_id', locationIds);

                if (locationError) {
                    throw locationError;
                }

                const locationMap: {[key: number]: string} = {};
                locationsData.forEach(loc => {
                    locationMap[loc.location_id] = loc.location_name;
                });

                const popsWithLocations = popsData.map(pop => ({
                    ...pop,
                    location_name: locationMap[pop.location_id] || 'Unknown Pop',
                }));

                setPops(popsWithLocations);

            } catch (error) {
                console.error('Error fetching data:', (error as Error).message);
            }
        }
        fetchPops();
    }, [popToDelete, showModal]);

    const filteredPops = pops.filter((pop) => {
        const searchTerm = searchValue.toLowerCase();
        
        const locationMatch =
        locationFilter === '' || pop.location_name.toLowerCase() === locationFilter.toLowerCase(); 

        if (searchValue === '' && locationMatch ) {
            return true;
        }
    
        let isMatchingSearch = false;
    
        if (searchField === 'all') {
            isMatchingSearch = (
                pop.pop_name.toLowerCase().includes(searchTerm) ||
                pop.location_name.toLowerCase().includes(searchTerm)
            );
        } else if (searchField === 'pop_name') {
            isMatchingSearch = pop.pop_name.toLowerCase().includes(searchTerm);
        } else if (searchField === 'location_name') {
            isMatchingSearch = pop.location_name.toLowerCase().includes(searchTerm);
        }
    
        return isMatchingSearch && locationMatch;
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
                {/* <thead className="title-dashboard text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-300 dark:text-gray-700">
                    <tr>
                
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
                </thead> */}
                <tbody>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                    {displayedPops.map((pop) => (
                        <div key={pop.pop_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <img 
                                src={pop.image_url || "/api/placeholder/300/200"} 
                                alt={pop.pop_name} 
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-4">
                                <h3 className="text-lg font-semibold">{pop.pop_name}</h3>
                                <p className="text-sm text-gray-600">{pop.location_name}</p>
                                <div className="mt-4 flex justify-between">
                                    <Link href={`/viewPop/${pop.pop_id}`}>
                                        <span className="text-blue-600 hover:underline">View</span>
                                    </Link>
                                    <Link href={`/editPOP/${pop.pop_id}`}>
                                        <span className="text-green-600 hover:underline">Edit</span>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setShowModal(true);
                                            setPopToDelete(pop.pop_id);
                                        }}
                                        className="text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
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
