"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import PopUpModal from '@/app/component/popUpmodal';

export default function EditPackage() {
  const router = useRouter();
  const [packages, setPackages] = useState({
    package_name: '',
    service_id: '',
  });
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const { package_id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
    console.log('Modal Closed'); // Add console log to check if modal is being closed
  };

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const { data: packageData, error } = await supabase
          .from('Package')
          .select('*')
          .eq('package_id', package_id)
          .single();
        if (error) throw new Error(error.message);
        setPackages(packageData);
      } catch (error) {
        console.error('Error fetching package:', error.message);
        setError(error.message);
      }
    };

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

    fetchPackage();
    fetchService();
  }, [package_id]);

  const handleEditPackage = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('Package')
        .update({
            package_name: packages.package_name,
            service_id: parseInt(packages.service_id),
        })
        .eq('package_id', package_id);
      if (error) throw new Error(error.message);
      setIsModalOpen(true);
  
      console.log('Service updated successfully');
      // Optionally, you can navigate to a different page or show a success message
    } catch (error) {
      console.error('Error updating service:', error.message);
      setError(error.message);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen dark:bg-gray">
      <div className="font-raleway-black w-full max-w-4xl p-5">
        <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
          <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <span>Edit Package Information: </span>
        <form onSubmit={handleEditPackage} className="flex flex-wrap justify-between mt-10">
          <div className="w-full lg:w-1/2 p-2">
            {/* Customer Name */}
            <label htmlFor="packageName" className="block mb-2">Package Name:</label>
            <input
              type="text"
              id="packageName"
              placeholder="Enter package name"
              value={packages.package_name}
              onChange={(e) => setPackages({ ...packages, package_name: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
          </div>
          <div className="w-full lg:w-1/2 p-2">
            <label htmlFor="services" className="block mb-2">Service:</label>
            <select
              id="services"
              value={packages.service_id}
              onChange={(e) => setPackages({ ...packages, service_id: e.target.value })}
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
              Update Package
            </button>
          </div>
        </form>
        <PopUpModal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={package_id ? 'Success' : 'Error'}
          content={
            <>
              {package_id && (
                <p className="text-center text-green-700 mt-4">
                  Package updated successfully with ID: {package_id}
                </p>
              )}
              {error && (
                <p className="text-center text-red-700 mt-4">Error updating package: {error}</p>
              )}
            </>
          }
        />
      </div>
    </div>
  );
  
}
