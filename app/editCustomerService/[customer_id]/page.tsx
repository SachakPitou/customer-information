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
    activation_date: string;
    service_id: string;
    package_id: string;
    isActive: string;
}

interface ServiceData {
    service_id: number;
    service_name: string;
    // Add other service properties if needed
}

interface PackageData {
    package_id: number;
    service_id: number;
    package_name: string;
    // Add other package properties if needed
}

export default function Page() {
    const router = useRouter();
    const [userType, setUserType] = useState<string>('');
    const [session, setSession] = useState<any>(null); // Adjust type based on your session structure
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
    });
    const [services, setServices] = useState<ServiceData[]>([]);
    const [packages, setPackages] = useState<PackageData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { customer_id } = useParams<{ customer_id: string }>();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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
        fetchPackage();
        fetchService();
        fetchUserType();
    }, [customer_id]);

    const handleEditCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data: currentCustomerData, error: fetchError } = await supabase
                .from('Customer')
                .select('*')
                .eq('customer_id', customer_id)
                .single();

            if (fetchError) throw new Error(fetchError.message);

            const fieldsToCheck: (keyof CustomerData)[] = [
                'customer_name', 'phone_number', 'cid', 'address', 'longtitude', 'langtitude',
                'activation_date', 'service_id', 'package_id', 'isActive'
            ];

            const historyRecords = fieldsToCheck.map(field => {
                if (currentCustomerData[field] !== customer[field]) {
                    return {
                        customer_id: customer_id, // Use customer_id from params
                        field_changed: field,
                        old_value: currentCustomerData[field],
                        new_value: customer[field],
                        timestamp: new Date()
                    };
                }
                return null;
            }).filter(record => record !== null);

            if (historyRecords.length > 0) {
                const { error: historyError } = await supabase
                    .from('CustomerHistory')
                    .insert(historyRecords as any[]); // Use `any[]` for dynamic records
                if (historyError) throw new Error(historyError.message);
            }

            // Update the Customer table directly
            const { error: updateError } = await supabase
                .from('Customer')
                .update({
                    isActive: customer.isActive
                })
                .eq('customer_id', customer_id);

            if (updateError) throw new Error(updateError.message);

            setIsModalOpen(true);
            console.log('Customer updated successfully');
        } catch (error) {
            console.error('Error updating customer:', (error as Error).message);
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
                <form onSubmit={handleEditCustomer} className="flex flex-wrap justify-between mt-10">
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
                            <label htmlFor="CID" className="block mb-2">CID:</label>
                            <input
                                type="text"
                                id="CID"
                                value={customer.cid}
                                readOnly
                                className="w-full p-2 border rounded bg-gray-100" 
                            />
                        </div>
                        <div className="w-full md:w-1/2 px-2 mb-4">
                            <label htmlFor="serviceName" className="block mb-2">Service Name:</label>
                            <input
                                type="text"
                                id="serviceName"
                                value={services.find(service => service.service_id === parseInt(customer.service_id, 10))?.service_name || ''}
                                readOnly
                                className="w-full p-2 border rounded bg-gray-100"
                            />
                        </div>

                        <div className="w-full md:w-1/2 px-2 mb-4">
                            <label htmlFor="activationDate" className="block mb-2">Activation Date:</label>
                            <input
                                type="text"
                                id="activationDate"
                                value={customer.activation_date}
                                readOnly
                                className="w-full p-2 border rounded bg-gray-100" 
                            />
                        </div>
                        {/* <div className="w-full md:w-1/2 px-2 mb-4">
                            <label htmlFor="status" className="block mb-2">Status:</label>
                            <select
                                id="isActive"
                                value={customer.isActive ? 'true' : 'false'}
                                onChange={(e) => setCustomer({ ...customer, isActive: e.target.value === 'true' })}
                                className="w-full p-2 border rounded"
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div> */}
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
                            Customer with ID: {customer_id} status update.
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