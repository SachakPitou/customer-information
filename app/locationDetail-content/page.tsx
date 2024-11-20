"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SideBar from '../component/SideBar';
import LoadingSpinner from '../component/LoadingSpinner';


// const ACTIVE = 'active';
// const INACTIVE = 'inactive';
interface Location {
    location_id: number;
    location_name: string;
    // Add other properties as needed
  }
  
  export default function LocationDetail() {
      const [locations, setLocations] = useState<Location[]>([]);
      const [statusFilter, setStatusFilter] = useState<string>('');
      const [showModal, setShowModal] = useState<boolean>(false); 
      const [locationToDelete, setLocationToDelete] = useState<number | null>(null);
      const [searchValue, setSearchValue] = useState<string>('');
      const [searchField, setSearchField] = useState<string>('all');
      const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
      const [serviceFilter, setServiceFilter] = useState<string>("");
      const [currentPage, setCurrentPage] = useState<number>(1);
      const locationsPerPage = 15;
      
      const toggleDropdown = () => {
          setDropdownOpen(!dropdownOpen);
      };
  
      const handleServiceFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
          setServiceFilter(event.target.value);
      };
  
      const router = useRouter();
  
      const handleDeleteLocation = async () => {
          try {
              if (!locationToDelete) return;
  
              await supabase.from("Location")
                  .delete()
                  .eq("location_id", locationToDelete);
          
              setLocations(prevLocations => prevLocations.filter(loc => loc.location_id !== locationToDelete));
          
              console.log(`Location with ID ${locationToDelete} deleted successfully`);
          
              setShowModal(false);
          } catch (error) {
              console.error('Error deleting location:', (error as Error).message);
          }
      };
      
      useEffect(() => {
          async function fetchLocations() {
              try {
                  const { data: locationsData, error } = await supabase
                      .from('Location')
                      .select('*');
          
                  if (error) {
                      throw error;
                  }
  
                  setLocations(locationsData || []);
  
              } catch (error) {
                  console.error('Error fetching data:', (error as Error).message);
              }
          }
          fetchLocations();
      }, [locationToDelete, showModal]);
  
      console.log("Filtering locations...");
      const filteredLocations = locations.filter((loc) => {
          const searchTerm = searchValue.toLowerCase();
      
          if (searchValue === '') {
              return true;
          }
      
          const isMatchingSearch = loc.location_name.toLowerCase().includes(searchTerm);
          
          return isMatchingSearch;
      });
      
      console.log("Filtered locations:", filteredLocations);
      
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
  
      const totalPages = Math.ceil(filteredLocations.length / locationsPerPage);
      const startIndex = (currentPage - 1) * locationsPerPage;
      const displayedLocations = filteredLocations.slice(startIndex, startIndex + locationsPerPage);
  
      if (locations.length === 0) {
        return <LoadingSpinner />
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
                {/* <div className='mr-5'>
                    <button
                        id="dropdownServiceButton"
                        data-dropdown-toggle="dropdownService"
                        className="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
                        type="button"
                        onClick={toggleDropdown}
                    >
                        Service Type
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
                                            name="service-filter"
                                            checked={serviceFilter === ""}
                                            onChange={handleServiceFilterChange}
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
                                            value="Shared Internet Access (SIA)"
                                            name="service-filter"
                                            checked={serviceFilter === "Shared Internet Access (SIA)"}
                                            onChange={handleServiceFilterChange}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <label
                                            htmlFor="filter-service-example-2"
                                            className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                        >
                                            Shared Internet Access
                                        </label>
                                    </div>
                                </li>
                                <li>
                                    <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                        <input
                                            type="radio"
                                            value="Dedicated Internet Access (DIA)"
                                            name="service-filter"
                                            checked={serviceFilter === "Dedicated Internet Access (DIA)"}
                                            onChange={handleServiceFilterChange}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <label
                                            htmlFor="filter-service-example-3"
                                            className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                        >
                                            Dedicated Internet Access
                                        </label>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    )}
                </div> */}
                    <select 
                        value={searchField} 
                        onChange={handleSearchFieldChange} 
                        className="mr-5 p-2 text-sm text-gray-900 border border-gray-300 rounded-lg w-30 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-50"
                    >
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
                            placeholder="Search for location" 
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
                            Location Name
                        </th>
                        <th scope="col" className="px-6 py-3">
                           
                        </th>
                        {/* <th scope="col" className="px-6 py-3">
                          
                        </th>
                        <th scope="col" className="px-6 py-3">
                           
                        </th> */}
                    </tr>
                </thead>
                <tbody>
                    {displayedLocations.map((loc)=> (
                        <tr key={loc.location_id} className="dashboard-text bg-white border-b dark:bg-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-300">
            
                            <td className="px-6 py-4">{loc.location_name}</td> {/* Changed from pkg.service_name */}
                            {/* <td className="px-6 py-4">{pkg.service_name}</td> */}
                            {/* <td className="px-6 py-4">
                                <Link href={`/viewCustomer/${loc.location_id}`}>
                                    <div className="flex items-center text-blue-600 dark:text-blue-500 hover:underline">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M19 10c0 3.682-2.914 6-7 6s-7-2.318-7-6 2.914-6 7-6 7 2.318 7 6zm-7 4a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                                        </svg>
  
                                    </div>
                                </Link>
                            </td>
                            <td className="px-6 py-4">
                                <Link href={`/editPackage/${loc.location_id}`}>
                                    <div className="flex items-center text-blue-600 dark:text-blue-500 hover:underline">
                                        <svg className="feather feather-edit" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>

                                    </div>
                                </Link>
                            </td> */}
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => {
                                        setShowModal(true);
                                        setLocationToDelete(loc.location_id);
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
                    Showing {startIndex + 1} to {Math.min(startIndex + locationsPerPage, filteredLocations.length)} of {filteredLocations.length} Locations
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
                    <h2 className="text-lg font-semibold text-gray-800">Are you sure you want to delete this package?</h2>
                    <div className="flex justify-end mt-4">
                    <button
                        onClick={handleDeleteLocation} // Call the delete function when 'Yes' button is clicked
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
