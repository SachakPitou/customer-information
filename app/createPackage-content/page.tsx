"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/navigation';
import SideBar from '../component/SideBar';
export default function CreatePackage() {
  const router = useRouter();
  const [packageName, setPackageName] = useState('');
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [insertPackageId, setInsertedPackageId] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data, error } = await supabase.from('Service').select('*');
        if (error) throw new Error(error.message);
        setServices(data);
      } catch (error) {
        console.error('Error fetching Service:', error.message);
        setError(error.message);
      }
    };
    fetchService();
  }, []);

  const handleAddPackage = async (e) => {
    e.preventDefault();
    try {
      // Get the maximum package_id from the database
      const { data: maxPackageIdData, error: maxPackageIdError } = await supabase
        .from('Package')
        .select('package_id')
        .order('package_id', { ascending: false })
        .limit(1)
        .single();
  
      if (maxPackageIdError) {
        throw new Error(maxPackageIdError.message);
      }
  
      // Calculate the new package_id by incrementing the maximum package_id by 1
      const newPackageId = maxPackageIdData ? maxPackageIdData.package_id + 1 : 1;
  
      // Insert the new package with the calculated package_id
      const { data, error: insertError } = await supabase.from('Package').insert([
        {
          package_id: newPackageId,
          package_name: packageName,
          service_id: parseInt(selectedServiceId),
        },
      ]);
      if (insertError) throw new Error(insertError.message);
  
      setInsertedPackageId(newPackageId);
      setPackageName('');
      setSelectedServiceId('');
    } catch (error) {
      setError(error.message);
    }
  };
  return (
    <div className="flex flex-col w-full items-center justify-center min-h-screen dark:bg-gray-200">
      <div className="font-raleway-black w-full max-w-4xl p-5">
        <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
          <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <span>Create New Device: </span>
        <form onSubmit={handleAddPackage} className="flex flex-wrap justify-between mt-10">
          <div className="w-full lg:w-1/2 p-2">
            <label htmlFor="packageName" className="block mb-2">Package Name:</label>
            <input
              type="text"
              id="packageName"
              placeholder="Enter package name"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
          </div>
          <div className="w-full lg:w-1/2 p-2">
            <label htmlFor="Service" className="block mb-2">Service:</label>
            <select
              id="Service"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            >
              <option value="">Select Service...</option>
              {services.map((svc) => (
                <option key={svc.service_id} value={svc.service_id}>
                  {svc.service_name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full p-2 text-center">
            <button
              type="submit"
              className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600"
            >
              Add Service
            </button>
          </div>
        </form>
        {insertPackageId && (
          <p className="text-center text-green-700 mt-4">
            Package added successfully with ID: {insertPackageId}
          </p>
        )}
        {error && (
          <p className="text-center text-red-700 mt-4">Error adding package: {error}</p>
        )}
      </div>
    </div>
  );
}

