"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/navigation';
import SideBar from '../component/SideBar';
import PopUpModal from '../component/popUpmodal';
export default function CreatePop() {
  const router = useRouter();
  const [popName, setPopName] = useState('');
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [insertPopId, setInsertedPopId] = useState('');
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
  };
  useEffect(() => {
    if (insertPopId || error) {
      setIsModalOpen(true);
    }
  }, [insertPopId, error]);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { data, error } = await supabase.from('Location').select('*');
        if (error) throw new Error(error.message);
        setLocations(data);
      } catch (error) {
        console.error('Error fetching Location:', error.message);
        setError(error.message);
      }
    };
    fetchLocation();
  }, []);

  const handleAddPop = async (e) => {
    e.preventDefault();
    try {
      const { data: maxPopIdData, error: maxPopIdError } = await supabase
        .from('POP')
        .select('pop_id')
        .order('pop_id', { ascending: false })
        .limit(1);
      if (maxPopIdError) {
        throw new Error(maxPopIdError.message);
      }

      const newPopId = maxPopIdData.length > 0 ? maxPopIdData[0].pop_id + 1 : 1;
  
      // Insert the new package with the calculated package_id
      const { data, error: insertError } = await supabase.from('POP').insert([
        {
          pop_id: newPopId,
          pop_name: popName,
          location_id: parseInt(selectedLocationId),
        },
      ]);
      if (insertError) throw new Error(insertError.message);
  
      setInsertedPopId(newPopId);
      setPopName('');
      setSelectedLocationId('');
    } catch (error) {
      setError(error.message);
    }
  };
  return (
    <div className="flex flex-col w-full items-center djustify-center min-h-screen dark:bg-gray-200">
      <div className="font-raleway-black w-full max-w-4xl p-5">
        <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
          <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <span>Create New Pop: </span>
        <form onSubmit={handleAddPop} className="flex flex-wrap justify-between mt-10">
          <div className="w-full lg:w-1/2 p-2">
            <label htmlFor="packageName" className="block mb-2">Pop Name:</label>
            <input
              type="text"
              id="packageName"
              placeholder="Enter pop name"
              value={popName}
              onChange={(e) => setPopName(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
          </div>
          <div className="w-full lg:w-1/2 p-2">
            <label htmlFor="Location" className="block mb-2">Location:</label>
            <select
              id="Location"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            >
              <option value="">Select Location...</option>
              {locations.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.location_name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full p-2 text-center">
            <button
              type="submit"
              className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600"
            >
              Add Pop
            </button>
          </div>
        </form>
        <PopUpModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={insertPopId ? 'Success' : 'Error'}
        content={
          <>
            {insertPopId && (
              <p className="text-center text-green-700 mt-4">
                Pop created successfully with ID: {insertPopId}
              </p>
            )}
            {error && (
              <p className="text-center text-red-700 mt-4">Error creating pop: {error}</p>
            )}
          </>
        }
      />
      </div>
    </div>
  );
}

