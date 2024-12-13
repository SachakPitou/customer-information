"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import PopUpModal from '@/app/component/popUpmodal';

interface CustomerData {
    customer_name: string;
    phone_number: string;
    cid: string;
    address: string;
    longtitude: string;
    langtitude: string;
    ip_type: string;
    activation_date: string;
    service_id: string;
    package_id: string;
    isActive: string;
    status_type?: string;
}

interface ServiceData {
    service_id: number;
    service_name: string;
}

interface PackageData {
    package_id: number;
    service_id: number;
    package_name: string;
}

interface StatusHistoryData {
    status_type: string;
    start_date: string;
    end_date?: string | null;
}

export default function Page() {
    const router = useRouter();
    const [userType, setUserType] = useState<string>('');
    const [session, setSession] = useState<any>(null);
    const [customer, setCustomer] = useState<CustomerData>({
        customer_name: '',
        phone_number: '',
        cid: '',
        address: '',
        longtitude: '',
        langtitude: '',
        activation_date: '',
        service_id: '',
        package_id: '',
        isActive: '',
        ip_type: '',
    });
    const [services, setServices] = useState<ServiceData[]>([]);
    const [packages, setPackages] = useState<PackageData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { customer_id } = useParams<{ customer_id: string }>();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [statusHistory, setStatusHistory] = useState<StatusHistoryData>({
        status_type: '',
        start_date: '',
        end_date: null
    });

    const closeModal = () => {
        setIsModalOpen(false);
        console.log('Modal Closed');
    };

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const { data: customerData, error } = await supabase
                    .from('Customer')
                    .select('*')
                    .eq('customer_id', customer_id)
                    .single();
                if (error) throw new Error(error.message);
                setCustomer(customerData as CustomerData);
            } catch (error) {
                console.error('Error fetching customer:', (error as Error).message);
                setError((error as Error).message);
            }
        };

        const fetchStatusHistory = async () => {
            try {
                const { data: statusData, error } = await supabase
                    .from('statushistory')
                    .select('*')
                    .eq('customer_id', customer_id)
                    .order('start_date', { ascending: false })
                    .limit(1)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    throw new Error(error.message);
                }

                if (statusData) {
                    setStatusHistory({
                        status_type: statusData.status_type,
                        start_date: statusData.start_date,
                        end_date: statusData.end_date
                    });
                }
            } catch (error) {
                console.error('Error fetching status history:', (error as Error).message);
            }
        };

        const fetchService = async () => {
            try {
                const { data, error } = await supabase.from('Service').select('*');
                if (error) throw new Error(error.message);
                setServices(data as ServiceData[]);
            } catch (error) {
                console.error('Error fetching services:', (error as Error).message);
                setError((error as Error).message);
            }
        };

        const fetchPackage = async () => {
            try {
                const { data, error } = await supabase.from('Package').select('*');
                if (error) throw new Error(error.message);
                setPackages(data as PackageData[]);
            } catch (error) {
                console.error('Error fetching packages:', (error as Error).message);
                setError((error as Error).message);
            }
        };

        const fetchUserType = async () => {
            try {
                const supabase = createClient();
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error fetching session:', error.message);
                    return;
                }

                const session = data.session;
                setSession(session);

                if (session) {
                    const userId = session.user.id;
                    const { data: userData, error: userError } = await supabase
                        .from('userAccount')
                        .select('user_type')
                        .eq("id", userId)
                        .single();

                    if (userError) {
                        throw userError;
                    }

                    if (userData) {
                        setUserType(userData.user_type);
                    }
                }
            } catch (error) {
                console.error('Error fetching user type:', (error as Error).message);
            }
        };

        fetchCustomer();
        fetchStatusHistory();
        fetchPackage();
        fetchService();
        fetchUserType();
    }, [customer_id]);

    const handleStatusTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatusType = e.target.value;
        setStatusHistory(prev => ({
            ...prev,
            status_type: newStatusType,
            start_date: new Date().toISOString().slice(0, 16), // Current datetime
        }));
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStatusHistory(prev => ({
            ...prev,
            start_date: e.target.value
        }));
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStatusHistory(prev => ({
            ...prev,
            end_date: e.target.value || null
        }));
    };

    const handleEditCustomerStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Validate required fields
            if (!statusHistory.status_type) {
                setError('Please select a status type');
                return;
            }

            // Insert new status history record
            const { error: insertError } = await supabase
                .from('statushistory')
                .insert({
                    customer_id: customer_id,
                    status_type: statusHistory.status_type,
                    start_date: statusHistory.start_date,
                    end_date: statusHistory.end_date || null
                });

            if (insertError) throw new Error(insertError.message);

            // Update Customer table with the latest status type
            const { error: updateError } = await supabase
                .from('Customer')
                .update({ status_type: statusHistory.status_type })
                .eq('customer_id', customer_id);

            if (updateError) throw new Error(updateError.message);

            setIsModalOpen(true);
            console.log('Customer status updated successfully');
        } catch (error) {
            console.error('Error updating customer status:', (error as Error).message);
            setError((error as Error).message);
        }
    };

    const filteredPackages = packages.filter((pkg) => pkg.service_id === parseInt(customer.service_id, 10));

    return (
        <div className="flex flex-col items-center justify-center min-h-screen dark:bg-gray-200">
            <div className="font-raleway-black w-full max-w-4xl p-5">
                <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
                    <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                    </svg>
                </button>
                <span>Customer Information: </span>
                <form onSubmit={handleEditCustomerStatus} className="flex flex-wrap justify-between mt-10">
                    <div className="flex flex-wrap -mx-2">
                        <div className="w-full md:w-1/2 px-2 mb-4">
                            <label htmlFor="customerName" className="block mb-2">Customer Name:</label>
                            <input
                                type="text"
                                id="customerName"
                                value={customer.customer_name}
                                readOnly
                                className="w-full p-2 border rounded bg-gray-100" 
                            />
                        </div>
                        <div className="w-full md:w-1/2 px-2 mb-4">
                            <label htmlFor="packageName" className="block mb-2">Package Name:</label>
                            <input
                                type="text"
                                id="packageName"
                                value={filteredPackages.find(pkg => pkg.package_id === parseInt(customer.package_id, 10))?.package_name || ''}
                                readOnly
                                className="w-full p-2 border rounded bg-gray-100"
                            />
                        </div>

                        <div className="w-full md:w-1/2 px-2 mb-4">
                            <label htmlFor="phoneNumber" className="block mb-2">Phone Number:</label>
                            <input
                                type="text"
                                id="phoneNumber"
                                value={customer.phone_number}
                                readOnly
                                className="w-full p-2 border rounded bg-gray-100" 
                            />
                        </div>
                        <div className="w-full md:w-1/2 px-2 mb-4">
                            <label htmlFor="Address" className="block mb-2">Address:</label>
                            <input
                                type="text"
                                id="Address"
                                value={customer.address}
                                readOnly
                                className="w-full p-2 border rounded bg-gray-100" 
                            />
                        </div>
                        <div className="w-full md:w-1/2 px-2 mb-4">
                            <label htmlFor="Address" className="block mb-2">IP Type:</label>
                            <input
                                type="text"
                                id="ipType"
                                value={customer.ip_type}
                                className="w-full p-2 border rounded bg-gray-100" 
                            />
                        </div>

                        <div className="w-full md:w-1/2 px-2 mb-4">
                            <label htmlFor="statusType" className="block mb-2">Status Type:</label>
                            <select
                                id="statusType"
                                value={statusHistory.status_type || ''}
                                onChange={handleStatusTypeChange}
                                className="w-full p-2 border rounded"
                                required
                            >
                                <option value="">Select Status...</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="REACTIVE">Reactive</option>
                                <option value="TERMINATE">Terminate</option>
                            </select>
                        </div>

                        {statusHistory.status_type && (
                            <>
                                <div className='w-full md:w-1/2 px-2 mb-4'>
                                    <label htmlFor="statusStartDate" className="block mb-2">
                                        Status Start Date:
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="statusStartDate"
                                        value={statusHistory.start_date || ''}
                                        onChange={handleStartDateChange}
                                        required
                                        className="font-raleway-black w-full p-2 border mb-3"
                                    />
                                </div>
                                <div className='w-full md:w-1/2 px-2 mb-4'>
                                    <label htmlFor="statusEndDate" className="block mb-2">
                                        Status End Date:
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="statusEndDate"
                                        value={statusHistory.end_date || ''}
                                        onChange={handleEndDateChange}
                                        className="font-raleway-black w-full p-2 border mb-3"
                                    />
                                </div>
                                <div className="w-full px-2 mb-4 flex items-center">
                                    <input
                                        type="checkbox"
                                        id="noEndDate"
                                        checked={!statusHistory.end_date}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setStatusHistory(prev => ({ ...prev, end_date: null }));
                                            } else {
                                                // Set end date to a day from start date if not checked
                                                const startDate = new Date(statusHistory.start_date);
                                                startDate.setDate(startDate.getDate() + 1);
                                                setStatusHistory(prev => ({ 
                                                    ...prev, 
                                                    end_date: startDate.toISOString().slice(0, 16) 
                                                }));
                                            }
                                        }}
                                        className="mr-2"
                                    />
                                    <label htmlFor="noEndDate">No End Date</label>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="w-full p-2 text-center">
                        <button
                            type="submit"
                            className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600"
                        >
                            Submit
                        </button>
                    </div>
                </form>
                <PopUpModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    title={customer_id ? 'Success' : 'Error'}
                    content={
                        <>
                            {customer_id && (
                                <p className="text-center text-green-700 mt-4">
                                    Customer with ID: {customer_id} status update successful.
                                </p>
                            )}
                            {error && (
                                <p className="text-center text-red-700 mt-4">Error updating customer status: {error}</p>
                            )}
                        </>
                    }
                />
            </div>
        </div>
    );
}