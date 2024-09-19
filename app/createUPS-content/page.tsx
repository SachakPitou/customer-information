"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/navigation';
import PopUpModal from '../component/popUpmodal';

export default function CreateUPS() {
  const router = useRouter();
  const [upsName, setUPSName] = useState('');
  const [upsType, setUPSType] = useState('');
  const [upsBrand, setUPSBrand] = useState('');
  const [capacity, setCapacity] = useState('');
  const [vendor, setVendor] = useState('');
  const [insertUPSId, setInsertedUPSId] = useState('');
  const [error, setError] = useState<string | null>(null); // Specify type for error state
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (insertUPSId || error) {
      setIsModalOpen(true);
    }
  }, [insertUPSId, error]);

  const handleAddUPS = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Get the maximum ups_id from the database
      const { data: maxUPSIdData, error: maxUPSIdError } = await supabase
        .from('UPS')
        .select('ups_id')
        .order('ups_id', { ascending: false })
        .limit(1);

      if (maxUPSIdError) {
        throw new Error(maxUPSIdError.message);
      }

      // Determine the new UPS ID
      const newUPSId = maxUPSIdData.length > 0 ? maxUPSIdData[0].ups_id + 1 : 1;

      // Insert the new UPS
      const { data, error: insertError } = await supabase.from('UPS').insert([
        {
          ups_id: newUPSId,
          ups_name: upsName,
          ups_type: upsType,
          ups_brand: upsBrand,
          capacity: capacity,
          vendor: vendor,
        },
      ]);

      if (insertError) throw new Error(insertError.message);

      setInsertedUPSId(newUPSId);
      // Clear form fields
      setUPSName('');
      setUPSType('');
      setUPSBrand('');
      setCapacity('');
      setVendor('');
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
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
        <span>Create New UPS: </span>
        <form onSubmit={handleAddUPS} className="flex flex-wrap justify-between mt-10">
          <div className="w-full lg:w-1/2 p-2">
            <label htmlFor="packageName" className="block mb-2">UPS Name:</label>
            <input
              type="text"
              id="packageName"
              placeholder="Enter UPS Name"
              value={upsName}
              onChange={(e) => setUPSName(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border mb-2"
            />
            <label htmlFor="packageName" className="block mb-2">UPS Brand:</label>
            <input
              type="text"
              id="packageName"
              placeholder="Enter UPS Brand"
              value={upsBrand}
              onChange={(e) => setUPSBrand(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border mb-2"
            />
            <label htmlFor="packageName" className="block mb-2">Vendor:</label>
            <input
              type="text"
              id="packageName"
              placeholder="Enter Vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
          </div>
          <div className="w-full lg:w-1/2 p-2">
          <label htmlFor="packageName" className="block mb-2">UPS Type:</label>
            <input
              type="text"
              id="packageName"
              placeholder="Enter UPS Type"
              value={upsType}
              onChange={(e) => setUPSType(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border mb-2"
            />
            <label htmlFor="packageName" className="block mb-2">Capacity:</label>
            <input
              type="text"
              id="packageName"
              placeholder="Enter Capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
            {/* <label htmlFor="Service" className="block mb-2">UPS Serviced:</label>
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
            </select> */}
          </div>
          <div className="w-full p-2 text-center">
            <button
              type="submit"
              className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600"
            >
              Add UPS
            </button>
          </div>
        </form>
        <PopUpModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={insertUPSId ? 'Success' : 'Error'}
        content={
          <>
            {insertUPSId && (
              <p className="text-center text-green-700 mt-4">
                UPS created successfully with ID: {insertUPSId}
              </p>
            )}
            {error && (
              <p className="text-center text-red-700 mt-4">Error creating UPS: {error}</p>
            )}
          </>
        }
      />
      </div>
    </div>
  );
}

