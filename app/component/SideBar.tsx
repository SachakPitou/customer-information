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
                                        <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" fill="currentColor"/>
                                            <path d="M17 13C18.6569 13 20 11.6569 20 10C20 8.34315 18.6569 7 17 7C15.3431 7 14 8.34315 14 10C14 11.6569 15.3431 13 17 13Z" fill="currentColor"/>
                                            <path d="M16.0545 15.4545C15.8702 15.4285 15.6824 15.4136 15.4913 15.4104C14.9762 15.4006 14.4657 15.4725 13.9807 15.6234C13.4957 15.7742 13.0434 16.0014 12.6436 16.2945C11.6001 17.0491 10.3245 17.4428 9.0164 17.4227C7.70832 17.4026 6.44481 16.9697 5.42576 16.1826C4.40671 15.3956 3.68177 14.2931 3.35263 13.0408C2.67763 13.1772 2.05845 13.4881 1.55举 13.9409C0.557842 14.9208 0 16.2711 0 17.6818V19.6364C0 20.1658 0.210714 20.6736 0.585786 21.0487C0.960859 21.4238 1.46857 21.6345 2 21.6345H16C16.5314 21.6345 17.0391 21.4238 17.4142 21.0487C17.7893 20.6736 18 20.1658 18 19.6364V17.6818C18 16.2711 17.4422 14.9208 16.4454 13.9409C16.3399 13.8379 16.2251 13.7424 16.0545 13.6545V15.4545Z" fill="currentColor"/>
                                        </svg>
                                        <span className="flex-1 ms-3 whitespace-nowrap">Customers</span>
                                        <span className="inline-flex items-center justify-center px-2 ms-3 text-sm font-medium text-gray-800 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">{customerCount}</span>
                                    </a>
                                </li>
                                {userType !== "customer_service" && (
                                    <li>
                                        <button onClick={toggleDropdown} className="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700" aria-expanded={isOpen1} aria-controls="dropdown-example">
                                        <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 4H4C2.89543 4 2 4.89543 2 6V16C2 17.1046 2.89543 18 4 18H20C21.1046 18 22 17.1046 22 16V6C22 4.89543 21.1046 4 20 4Z" fill="currentColor"/>
                                            <path d="M8 21H16M12 18V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
                                        <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
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
                                        <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M16 4H8V2H16V4ZM16 7H8C6.89543 7 6 7.89543 6 9V20C6 21.1046 6.89543 22 8 22H16C17.1046 22 18 21.1046 18 20V9C18 7.89543 17.1046 7 16 7ZM13 17H11V14H8L12 8L16 14H13V17Z" fill="currentColor"/>
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
                                        <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17 16L21 12L17 8M7 8L3 12L7 16M15 4L9 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                                        <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 3H4C2.89543 3 2 3.89543 2 5V9C2 10.1046 2.89543 11 4 11H20C21.1046 11 22 10.1046 22 9V5C22 3.89543 21.1046 3 20 3Z" fill="currentColor"/>
                                            <path d="M20 13H4C2.89543 13 2 13.8954 2 15V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V15C22 13.8954 21.1046 13 20 13Z" fill="currentColor"/>
                                            <circle cx="6" cy="7" r="1" fill="white"/>
                                            <circle cx="6" cy="17" r="1" fill="white"/>
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
