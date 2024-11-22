"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';
import LoadingSpinner from '../component/LoadingSpinner';

interface Customer {
  customer_id: number;
  customer_name: string;
  cid: string;
  phone_number: string;
  activation_date: string;
  address: string;
  Package: {
    package_name: string;
  };
  Service: {
    service_name: string;
  };
}

export default function PendingConfirmCustomer() {
  const [pendingCustomers, setPendingCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPendingCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('Customer')
          .select(`
            *,
            Package:package_id (package_name),
            Service:service_id (service_name)
          `)
          .eq('status', 'Pending Technical Review');

        if (error) throw error;

        setPendingCustomers(data || []);
      } catch (error) {
        setError((error as Error).message);
      }
    };

    fetchPendingCustomers();
  }, []);

  const handleEdit = (customerId: number) => {
    router.push(`/editConfirmCustomer/${customerId}`);
  };

  const handleConfirm = async (customerId: number) => {
    try {
      const { error } = await supabase
        .from('Customer')
        .update({ status: 'Pending Technical Review' })
        .eq('customer_id', customerId);

      if (error) throw error;

      // Refresh the list after confirming
      const updatedCustomers = pendingCustomers.filter(customer => customer.customer_id !== customerId);
      setPendingCustomers(updatedCustomers);
    } catch (error) {
      setError((error as Error).message);
    }
  };
  if (pendingCustomers.length === 0 && !error) {
    return <LoadingSpinner />;
  }
  return (
    <div className="relative overflow-x-auto shadow-md">
      <div className="font-raleway-black w-full max-w-4xl p-5">
        {error && <p className="text-red-500">{error}</p>}
        <button onClick={() => router.back()} className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
          <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <span>Pending Customer Confirmations: </span>
      </div>
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="title-dashboard text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-300 dark:text-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3">Customer Name</th>
            <th scope="col" className="px-6 py-3">CID</th>
            <th scope="col" className="px-6 py-3">Phone Number</th>
            <th scope="col" className="px-6 py-3">Package Name</th>
            <th scope="col" className="px-6 py-3">Service Name</th>
            <th scope="col" className="px-6 py-3">Activation Date</th>
            <th scope="col" className="px-6 py-3">Address</th>
            <th scope="col" className="px-6 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {pendingCustomers.map((customer) => (
            <tr key={customer.customer_id} className="dashboard-text bg-white border-b dark:bg-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-300">
              <td className="px-6 py-4">{customer.customer_name}</td>
              <td className="px-6 py-4">{customer.cid}</td>
              <td className="px-6 py-4">{customer.phone_number}</td>
              <td className="px-6 py-4">{customer.Package.package_name}</td>
              <td className="px-6 py-4">{customer.Service.service_name}</td>
              <td className="px-6 py-4">{customer.activation_date}</td>
              <td className="px-6 py-4">{customer.address}</td>
              <td className="px-6 py-4">
                <button onClick={() => handleEdit(customer.customer_id)} className="mr-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Edit</button>
                {/* <button onClick={() => handleConfirm(customer.customer_id)} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Confirm</button> */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}