"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { createClient } from '@/utils/supabase/client';
import { Session } from '@supabase/supabase-js';

export default function SideBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isOpen1, setIsOpen1] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const [isOpen3, setIsOpen3] = useState(false);
    const [isOpen4, setIsOpen4] = useState(false);
    const [isOpen5, setIsOpen5] = useState(false);
    const [isOpen6, setIsOpen6] = useState(false);
    const [isOpen7, setIsOpen7] = useState(false);
    const [customerCount, setCustomerCount] = useState(0);
    const [pendingEditCount, setPendingEditCount] = useState(0);
    const [userType, setUserType] = useState<string | null>(null);
    const [session, setSession] = useState<Session | null>(null);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };
    const toggleDropdown = () => {
        setIsOpen1(!isOpen1);
    };
    const toggleDropdown2 = () => {
        setIsOpen2(!isOpen2);
    };
    const toggleDropdown3 = () => {
        setIsOpen3(!isOpen3);
    };
    const toggleDropdown4 = () => {
        setIsOpen4(!isOpen4);
    };
    const toggleDropdown5 = () => {
        setIsOpen5(!isOpen5);
    };
    const toggleDropdown6 = () => {
        setIsOpen6(!isOpen6);
    };
    const toggleDropdown7 = () => {
        setIsOpen7(!isOpen7);
    };
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const supabase = createClient();
                const { data, error } = await supabase.auth.getSession();
    
                if (error) {
                    throw error;
                }
    
                const session = data.session;
                setSession(session);
    
                if (!session) {
                    return;
                }
    
                const [customerData, pendingEditData, userData] = await Promise.all([
                    supabase
                        .from('Customer')
                        .select('customer_id')
                        .eq('status', 'Completed'),
                    supabase
                        .from('Customer')
                        .select('customer_id')
                        .eq('status', 'Pending Technical Review'),
                    supabase
                        .from('userAccount')
                        .select('user_type')
                        .eq("id", session.user.id)
                        .single()
                ]);
    
                if (customerData.error) throw customerData.error;
                if (pendingEditData.error) throw pendingEditData.error;
                if (userData.error) throw userData.error;
    
                setCustomerCount(customerData.data ? customerData.data.length : 0);
                setPendingEditCount(pendingEditData.data ? pendingEditData.data.length : 0);
                setUserType(userData.data?.user_type || null);
    
            } catch (error) {
                console.error('Error fetching data:', error instanceof Error ? error.message : String(error));
            }
        };
    
        fetchData();
    }, []);

    console.log('User type state:', userType);
    console.log('Session state:', session);

    return (
        <div>
            <div
                id="drawer-navigation"
                className={`flex top-0 left-0 z-40 p-6 overflow-y-auto transition-transform !bg-gray-200 dark:!bg-gray-800`}
                style={{ width: isOpen ? 'auto' : '64px', height: '100%' }}
                tabIndex={-1}
                aria-labelledby="drawer-navigation-label"
            >
                <div className={`overflow-hidden transition-width ${isOpen ? 'w-full' : 'w-0'}`}>
                    <button onClick={toggleSidebar} className="fixed top-4 left-4 z-50 p-2 dark:bg-gray-900 text-gray-800 rounded-md">
                        <svg className="w-6 h-6" fill="none" stroke="black" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            {isOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            )}
                        </svg>
                    </button>
                    <br />
                    <br />
                    <div className="py-4 overflow-y-auto">
                        {session ? ( // Conditional rendering based on session state
                            <ul className="space-y-2 font-medium">
                                <li>
                                    <a href="/dashboard" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                                        <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                                            <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                                        </svg>
                                        <span className="flex-1 ms-3 whitespace-nowrap">Customers</span>
                                        <span className="inline-flex items-center justify-center px-2 ms-3 text-sm font-medium text-gray-800 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">{customerCount}</span>
                                    </a>
                                </li>
                                {/* {userType !== "customer_service" && (
                                <li>
                                    <a href="/approveCustomerEdit" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                                        <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                                            <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                                        </svg>
                                        <span className="flex-1 ms-3 whitespace-nowrap">Pending Edits</span>
                                        <span className="inline-flex items-center justify-center px-2 ms-3 text-sm font-medium text-gray-800 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">{pendingEditCount}</span>
                                    </a>
                                </li>
                                )} */}
                                {userType !== "customer_service" && (
                                    <li>
                                        <button onClick={toggleDropdown} className="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700" aria-expanded={isOpen1} aria-controls="dropdown-example">
                                            <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 21">
                                                <path d="M15 12a1 1 0 0 0 .962-.726l2-7A1 1 0 0 0 17 3H3.77L3.175.745A1 1 0 0 0 2.208 0H1a1 1 0 0 0 0 2h.438l.6 2.255v.019l2 7 .746 2.986A3 3 0 1 0 9 17a2.966 2.966 0 0 0-.184-1h2.368c-.118.32-.18.659-.184 1a3 3 0 1 0 3-3H6.78l-.5-2H15Z" />
                                            </svg>
                                            <span className="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">Devices</span>
                                            <svg className={`w-3 h-3 transition-transform ${isOpen1 ? 'rotate-180' : ''}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                            </svg>
                                        </button>
                                        <ul id="dropdown-example" className={`py-2 space-y-2 ${isOpen1 ? 'block' : 'hidden'}`}>
                                            <li>
                                                <a href="/createDevice" className="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Create</a>
                                            </li>
                                            <li>
                                                <a href="/deviceDetail" className="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Details</a>
                                            </li>
                                        </ul>
                                    </li>
                                )}
                                {userType !== "technical" && (
                                <li>
                                    <a href="/pendingCreateCustomer" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                                        <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                                            <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                                        </svg>
                                        <span className="flex-1 ms-3 whitespace-nowrap">Submit Customers</span>
                                        <span className="inline-flex items-center justify-center px-2 ms-3 text-sm font-medium text-gray-800 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">{pendingEditCount}</span>
                                    </a>
                                </li>
                                )}
                                {userType !== "technical" && (
                                <li>
                                    <button onClick={toggleDropdown2} className="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700" aria-expanded={isOpen2} aria-controls="dropdown-example">
                                        <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M17.27 8.14A8 8 0 1 0 10 18v-2.93a5.07 5.07 0 1 1 3.74-3.84H17a2.56 2.56 0 0 1 0 5.12h-3.23A8 8 0 0 0 17.27 8.14Z" />
                                        </svg>
                                        <span className="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">Package</span>
                                        <svg className={`w-3 h-3 transition-transform ${isOpen2 ? 'rotate-180' : ''}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                        </svg>
                                    </button>
                                    <ul id="dropdown-example" className={`py-2 space-y-2 ${isOpen2 ? 'block' : 'hidden'}`}>
                                        <li>
                                            <a href="/createPackage" className="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Create</a>
                                        </li>
                                        <li>
                                            <a href="/packDetail" className="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Details</a>
                                        </li>
                                    </ul>
                                </li>
                                )}
                                {userType !== "customer_service" && (
                                <li>
                                    <button onClick={toggleDropdown6} className="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700" aria-expanded={isOpen2} aria-controls="dropdown-example">
                                        <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M17.27 8.14A8 8 0 1 0 10 18v-2.93a5.07 5.07 0 1 1 3.74-3.84H17a2.56 2.56 0 0 1 0 5.12h-3.23A8 8 0 0 0 17.27 8.14Z" />
                                        </svg>
                                        <span className="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">Location</span>
                                        <svg className={`w-3 h-3 transition-transform ${isOpen6 ? 'rotate-180' : ''}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                        </svg>
                                    </button>
                                    <ul id="dropdown-example" className={`py-2 space-y-2 ${isOpen6 ? 'block' : 'hidden'}`}>
                                        <li>
                                            <a href="/createLocation" className="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Create</a>
                                        </li>
                                        <li>
                                            <a href="/locationDetail" className="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Details</a>
                                        </li>
                                    </ul>
                                </li>
                                )}
                                {userType !== "customer_service" && (
                                <li>
                                    <button onClick={toggleDropdown3} className="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700" aria-expanded={isOpen2} aria-controls="dropdown-example">
                                        <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M17.27 8.14A8 8 0 1 0 10 18v-2.93a5.07 5.07 0 1 1 3.74-3.84H17a2.56 2.56 0 0 1 0 5.12h-3.23A8 8 0 0 0 17.27 8.14Z" />
                                        </svg>
                                        <span className="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">UPS</span>
                                        <svg className={`w-3 h-3 transition-transform ${isOpen3 ? 'rotate-180' : ''}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                        </svg>
                                    </button>
                                    <ul id="dropdown-example" className={`py-2 space-y-2 ${isOpen3 ? 'block' : 'hidden'}`}>
                                        <li>
                                            <a href="/createUPS" className="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Create</a>
                                        </li>
                                        <li>
                                            <a href="/upsDetail" className="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Details</a>
                                        </li>
                                    </ul>
                                </li>
                                )}
                                {userType !== "customer_service" && (
                                <li>
                                    <button onClick={toggleDropdown4} className="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700" aria-expanded={isOpen2} aria-controls="dropdown-example">
                                        <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M17.27 8.14A8 8 0 1 0 10 18v-2.93a5.07 5.07 0 1 1 3.74-3.84H17a2.56 2.56 0 0 1 0 5.12h-3.23A8 8 0 0 0 17.27 8.14Z" />
                                        </svg>
                                        <span className="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">POP</span>
                                        <svg className={`w-3 h-3 transition-transform ${isOpen4 ? 'rotate-180' : ''}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                        </svg>
                                    </button>
                                    <ul id="dropdown-example" className={`py-2 space-y-2 ${isOpen4 ? 'block' : 'hidden'}`}>
                                        <li>
                                            <a href="/createPop" className="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Create</a>
                                        </li>
                                        <li>
                                            <a href="/popDetail" className="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Details</a>
                                        </li>
                                    </ul>
                                </li>
                                )}
                                {userType !== "customer_service" && (
                                <li>
                                    <button onClick={toggleDropdown5} className="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700" aria-expanded={isOpen2} aria-controls="dropdown-example">
                                        <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M17.27 8.14A8 8 0 1 0 10 18v-2.93a5.07 5.07 0 1 1 3.74-3.84H17a2.56 2.56 0 0 1 0 5.12h-3.23A8 8 0 0 0 17.27 8.14Z" />
                                        </svg>
                                        <span className="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">Rack</span>
                                        <svg className={`w-3 h-3 transition-transform ${isOpen5 ? 'rotate-180' : ''}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                        </svg>
                                    </button>
                                    <ul id="dropdown-example" className={`py-2 space-y-2 ${isOpen5 ? 'block' : 'hidden'}`}>
                                        <li>
                                            <a href="/createRack" className="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Create</a>
                                        </li>
                                        {/* <li>
                                            <a href="/packDetail" className="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Details</a>
                                        </li> */}
                                    </ul>
                                </li>
                                )}
                            </ul>
                        ) : (
                            <p className='text-white'>No active session found.</p> // Message when no session is active
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
