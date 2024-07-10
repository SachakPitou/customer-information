"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import PopUpModal from '@/app/component/popUpmodal';

export default function Page() {
    const router = useRouter();
    const [userType, setUserType] = useState('');
    const [session, setSession] = useState(null);
    const [customer, setCustomer] = useState({
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
    const [services, setServices] = useState([]);
    const [packages, setPackages] = useState([]);
    const [error, setError] = useState(null);
    const { customer_id } = useParams();
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                setCustomer(customerData);
            } catch (error) {
                console.error('Error fetching customer:', error.message);
                setError(error.message);
            }
        };
        const fetchService = async () => {
            try {
                const { data, error } = await supabase.from('Service').select('*');
                if (error) throw new Error(error.message);
                setServices(data);
            } catch (error) {
                console.error('Error fetching services:', error.message);
                setError(error.message);
            }
        };

        const fetchPackage = async () => {
            try {
                const { data, error } = await supabase.from('Package').select('*');
                if (error) throw new Error(error.message);
                setPackages(data);
            } catch (error) {
                console.error('Error fetching packages:', error.message);
                setError(error.message);
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
                console.error('Error fetching user type:', error.message);
            }
        };

        fetchCustomer();
        fetchPackage();
        fetchService();
        fetchUserType();
    }, [customer_id]);

    const handleEditCustomer = async (e) => {
        e.preventDefault();
        try {
            const { data: currentCustomerData, error: fetchError } = await supabase
                .from('Customer')
                .select('*')
                .eq('customer_id', customer_id)
                .single();

            if (fetchError) throw new Error(fetchError.message);

            const fieldsToCheck = [
                'customer_name', 'phone_number', 'cid', 'address', 'longtitude', 'langtitude',
                'activation_date', 'service_id', 'package_id', 'isActive'
            ];

            const historyRecords = fieldsToCheck.map(field => {
                if (currentCustomerData[field] !== customer[field]) {
                    return {
                        customer_id: customer.customer_id,
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
                    .insert(historyRecords);
                if (historyError) throw new Error(historyError.message);
            }

            const { error } = await supabase
                .from('Customer Edit')
                .insert([{
                    customer_id: customer_id,
                    customer_name: customer.customer_name,
                    phone_number: customer.phone_number,
                    cid: customer.cid,
                    address: customer.address,
                    longtitude: customer.longtitude,
                    langtitude: customer.langtitude,
                    activation_date: customer.activation_date,
                    service_id: customer.service_id,
                    package_id: customer.package_id,
                    isActive: customer.isActive,
                    approved: false
                }]);
            if (error) throw new Error(error.message);

            setIsModalOpen(true);
            router.push('/dashboard');
            console.log('Customer edit saved successfully');
        } catch (error) {
            console.error('Error saving customer edit:', error.message);
            setError(error.message);
        }
    };
    const filteredPackages = packages.filter((pkg) => pkg.service_id === parseInt(customer.service_id, 10));

    return (
        <div className="flex flex-col items-center justify-center min-h-screen dark:bg-gray-200">
            <div className="font-raleway-black w-full max-w-4xl p-5">
            <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
                <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                </svg>
            </button>
            <span>Edit Customer Information: </span>
            <form onSubmit={handleEditCustomer} className="flex flex-wrap justify-between mt-10">
            <div className="flex flex-wrap -mx-2">
                    <div className="w-full md:w-1/2 px-2 mb-4">
                        <label htmlFor="customerName" className="block mb-2">Customer Name:</label>
                        <input
                            type="text"
                            id="customerName"
                            placeholder="Enter customer name"
                            value={customer.customer_name}
                            onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })}
                            required
                            className="w-full p-2 border rounded" 
                        />
                    </div>
                    <div className="w-full md:w-1/2 px-2 mb-4">
                        <label htmlFor="packageName" className="block mb-2">Package Name:</label>
                        <select
                            id="packageName"
                            value={customer.package_id}
                            onChange={(e) => setCustomer({ ...customer, package_id: e.target.value })}
                            required
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select Package...</option>
                            {filteredPackages.map((pkg) => (
                                <option key={pkg.package_id} value={pkg.package_id}>
                                    {pkg.package_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-1/2 px-2 mb-4">
                        <label htmlFor="phoneNumber" className="block mb-2">Phone Number:</label>
                        <input
                            type="text"
                            id="phoneNumber"
                            placeholder="Enter Phone Number"
                            value={customer.phone_number}
                            onChange={(e) => setCustomer({ ...customer, phone_number: e.target.value })}
                            required
                            className="w-full p-2 border rounded" 
                        />
                    </div>
                    <div className="w-full md:w-1/2 px-2 mb-4">
                        <label htmlFor="Address" className="block mb-2">Address:</label>
                        <input
                            type="text"
                            id="Address"
                            placeholder="Enter Address"
                            value={customer.address}
                            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                            required
                            className="w-full p-2 border rounded" 
                        />
                    </div>
                    <div className="w-full md:w-1/2 px-2 mb-4">
                        <label htmlFor="CID" className="block mb-2">CID:</label>
                        <input
                            type="text"
                            id="CID"
                            placeholder="Enter CID"
                            value={customer.cid}
                            onChange={(e) => setCustomer({ ...customer, cid: e.target.value })}
                            required
                            className="w-full p-2 border rounded" 
                        />
                    </div>
                    <div className="w-full md:w-1/2 px-2 mb-4">
                        <label htmlFor="serviceName" className="block mb-2">Service Name:</label>
                        <select
                            id="serviceName"
                            value={customer.service_id}
                            onChange={(e) => {
                                const newServiceId = e.target.value;
                                setCustomer(prevCustomer => ({
                                    ...prevCustomer,
                                    service_id: newServiceId,
                                    package_id: ''
                                }));
                            }}
                            required
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select Service...</option>
                            {services.map((service) => (
                                <option key={service.service_id} value={service.service_id}>
                                    {service.service_name} (ID: {service.service_id})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-1/2 px-2 mb-4">
                        <label htmlFor="activationDate" className="block mb-2">Activation Date:</label>
                        <input
                            type="date"
                            id="activationDate"
                            value={customer.activation_date}
                            onChange={(e) => setCustomer({ ...customer, activation_date: e.target.value })}
                            required
                            className="w-full p-2 border rounded" 
                        />
                    </div>
                    <div className="w-full md:w-1/2 px-2 mb-4">
                        <label htmlFor="status" className="block mb-2">Status:</label>
                        <select
                            id="isActive"
                            value={customer.isActive ? 'true' : 'false'}
                            onChange={(e) => setCustomer({ ...customer, isActive: e.target.value === 'true' })}
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select Status...</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                </div>
                <div className="w-full p-2 text-center">
                    <button
                    type="submit"
                    className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600"
                    >
                    Submit for Approval
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
                        Customer with ID: {customer_id} getting updated and awaited approval.
                        </p>
                    )}
                    {error && (
                        <p className="text-center text-red-700 mt-4">Error updating customer: {error}</p>
                    )}
                    </>
                }
            />
            </div>
        </div>
    );
}