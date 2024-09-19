"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';

interface Customer {
  customer_id: number;
  customer_name: string;
  phone_number: string;
  activation_date: string;
}

export default function PendingRequests() {
  const [pendingRequests, setPendingRequests] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        // Fetch customer records with status "Pending Technical Review"
        const { data, error } = await supabase
          .from('Customer')
          .select('*')
          .eq('status', 'Pending Technical Review');

        if (error) throw error;

        setPendingRequests(data || []);
      } catch (error) {
        setError((error as Error).message);
      }
    };

    fetchPendingRequests();
  }, []);

  return (
    <div className="relative overflow-x-auto shadow-md">
      <div className="font-raleway-black w-full max-w-4xl p-5">
        {error && <p className="text-red-500">{error}</p>}
        <button 
          onClick={() => router.back()} 
          type="button" 
          className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700"
        >
          <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <span>Create New Customer: </span>
      </div>
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="title-dashboard text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-300 dark:text-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3">Customer Name</th>
            <th scope="col" className="px-6 py-3">Phone Number</th>
            <th scope="col" className="px-6 py-3">Date of Activation</th>
            <th scope="col" className="px-6 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {pendingRequests.map((customer) => (
            <tr key={customer.customer_id} className="dashboard-text bg-white border-b dark:bg-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-300">
              <td className="px-6 py-4">{customer.customer_name}</td>
              <td className="px-6 py-4">{customer.phone_number}</td>
              <td className="px-6 py-4">{customer.activation_date}</td>
              <td className="px-6 py-4">
                <button 
                  onClick={() => router.push(`/create/customerInfo/${customer.customer_id}`)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Customer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}