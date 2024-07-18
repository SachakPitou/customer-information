"use client";
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../supabaseClient';
import React , { useEffect, useState } from 'react';

export default function CustomerServiceInfoForm({ customerId }) {
  const [customer, setCustomer] = useState({
    customer_name: '',
    phone_number: '',
    cid: '',
    address: '',
    longtitude: '',
    langtitude: '',
    activation_date: '',
    isActive: true,
    service_id: '',
    package_id: '',
    status: '',
  });
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState(null);
//   const { customer_id } = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchService = async () => {
        try {
          const { data, error } = await supabase.from('Service').select('*');
          if (error) throw new Error(error.message);
          setServices(data);
        } catch (error) {
          console.error('Error fetching service:', error.message);
          setError(error.message);
        }
      }
      const fetchPackage = async () => {
        try {
          const { data, error } = await supabase.from('Package').select('*');
          if (error) throw new Error(error.message);
          setPackages(data);
        } catch (error) {
          console.error('Error fetching package:', error.message);
          setError(error.message);
        }
      }
      const fetchCustomer = async () => {
        try {
          const { data, error } = await supabase
            .from('Customer')
            .select('*')
            .eq('customer_id', customerId)
            .single();
  
          if (error) throw error;
  
          setCustomer(data);
        } catch (error) {
          console.error('Error fetching customer data:', error.message);
        }
      };
  
      if (customerId) {
        fetchCustomer();
        fetchPackage();
        fetchService();
      }
    }, [customerId]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    router.push(`${customerId}/technical/`);
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen dark:bg-gray-200">
      <div className="font-raleway-black w-full max-w-4xl p-5">
        {error && <p className="text-red-500">{error}</p>}
        <button
          onClick={() => router.back()}
          type="button"
          className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700"
        >
          <svg
            className="w-5 h-5 rtl:rotate-180"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <span>Create New Customer: </span>
        <form onSubmit={handleSubmit} className="flex flex-wrap justify-between mt-10">
          <div className="w-full lg:w-1/2 p-2">
            <div>
              <label className="block">Customer Name:</label>
              <input
                type="text"
                value={customer.customer_name}
                readOnly={true}
                className="block w-full border rounded p-2 mb-2"
              />
            </div>
            <div>
              <label className="block">Phone Number:</label>
              <input
                type="text"
                value={customer.phone_number}
                readOnly={true}
                className="block w-full border rounded p-2 mb-2"
              />
            </div>
            <div>
              <label className="block">CID:</label>
              <input
                type="text"
                value={customer.cid}
                readOnly={true}
                className="block w-full border rounded p-2 mb-2"
              />
            </div>
            <div>
              <label className="block">Address:</label>
              <input
                type="text"
                value={customer.address}
                readOnly={true}
                className="block w-full border rounded p-2 mb-2"
              />
            </div>
          </div>
          <div className="w-full lg:w-1/2 p-2">
            {/* <div>
              <label className="block">Longitude:</label>
              <input
                type="text"
                value={customer.longtitude}
                readOnly={true}
                className="block w-full border rounded p-2 mb-2"
              />
            </div>
            <div>
              <label className="block">Latitude:</label>
              <input
                type="text"
                value={customer.langtitude}
                readOnly={true}
                className="block w-full border rounded p-2 mb-2"
              />
            </div> */}
            <label htmlFor="serviceName" className="block">
              Service Name:
            </label>
            <select
              id="serviceName"
              value={customer.service_id}
              disabled
              className="font-raleway-black w-full p-2 border mb-3"
            >
              {/* Render options based on fetched services */}
              {services.map((service) => (
                <option key={service.service_id} value={service.service_id}>
                  {service.service_name}
                </option>
              ))}
            </select>
            <label htmlFor="packageName" className="block">
              Package Name:
            </label>
            <select
              id="packageName"
              value={customer.package_id}
              disabled
              className="font-raleway-black w-full p-2 border mb-3"
            >
              {/* Render options based on fetched packages */}
              {packages.map((pkg) => (
                <option key={pkg.package_id} value={pkg.package_id}>
                  {pkg.package_name}
                </option>
              ))}
            </select>
            <label htmlFor="status" className="block">
              Status:
            </label>
            <select
              id="status"
              value={customer.isActive ? 'true' : 'false'}
              disabled
              className="font-raleway-black w-full p-2 border mb-3"
            >
              <option value="">Select Status...</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <label htmlFor="activationDate" className="block">Activation Date:</label>
            <input
              type="date"
              id="activationDate"
              value={customer.activation_date}
              readOnly={true}
              required
              className="font-raleway-black w-full p-2 border mb-2"
            />
          </div>
          <div className="w-full p-2 text-center">
            <button
              type="submit"
              className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600"
              // Disable the button to prevent form submission
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
}