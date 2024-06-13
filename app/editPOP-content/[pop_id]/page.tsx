"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import PopUpModal from '@/app/component/popUpmodal';

export default function EditPOP() {
  const router = useRouter();
  const [pop, setPOP] = useState({
    pop_name: '',
    location_id: '',
  });
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(null);
  const { pop_id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
    console.log('Modal Closed'); // Add console log to check if modal is being closed
  };

  useEffect(() => {
    const fetchPOP = async () => {
      try {
        const { data: popData, error } = await supabase
          .from('POP')
          .select('*')
          .eq('pop_id', pop_id)
          .single();
        if (error) throw new Error(error.message);
        setPOP(popData);
      } catch (error) {
        console.error('Error fetching pop:', error.message);
        setError(error.message);
      }
    };

    const fetchLocation = async () => {
      try {
        const { data, error } = await supabase.from('Location').select('*');
        if (error) throw new Error(error.message);
        setLocations(data);
      } catch (error) {
        console.error('Error fetching locations:', error.message);
        setError(error.message);
      }
    };
    fetchPOP();
    fetchLocation();
  }, [pop_id]);

  const handleEditPOP = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('POP')
        .update({
            pop_name: pop.pop_name,
            location_id: parseInt(pop.location_id),
        })
        .eq('pop_id', pop_id);
      if (error) throw new Error(error.message);
      setIsModalOpen(true);
  
      console.log('POP updated successfully');
      // Optionally, you can navigate to a different page or show a success message
    } catch (error) {
      console.error('Error updating device:', error.message);
      setError(error.message);
    }
  };

  return (
    <div className="w-full flex items-center justify-center dark:bg-gray-200 min-h-screen">
      <div className="font-raleway-black w-full max-w-4xl p-5">
        <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
          <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <span>Edit POP Information: </span>
        <form onSubmit={handleEditPOP} className="flex flex-wrap justify-between mt-10">
          <div className="w-full lg:w-1/2 p-2">
            {/* Customer Name */}
            <label htmlFor="popName" className="block mb-2">POP Name:</label>
            <input
              type="text"
              id="popName"
              placeholder="Enter pop name"
              value={pop.pop_name}
              onChange={(e) => setPOP({ ...pop, pop_name: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            {/* Phone Number */}
          </div>
          <div className="w-full lg:w-1/2 p-2">
            {/* CID */}
            {/* Location Name */}
            <label htmlFor="locationName" className="block mb-2">Location Name:</label>
            <select
              id="locationName"
              value={pop.location_id}
              onChange={(e) => setPOP({ ...pop, location_id: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            >
              <option value="">Select Location...</option>
              {locations.map((location_location) => (
                <option key={location_location.location_id} value={location_location.location_id}>
                  {location_location.location_name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full p-2 text-center">
            <button
              type="submit"
              className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600"
            >
              Update POP
            </button>
          </div>
        </form>
        <PopUpModal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={pop_id ? 'Success' : 'Error'}
          content={
            <>
              {pop_id && (
                <p className="text-center text-green-700 mt-4">
                  POP updated successfully with ID: {pop_id}
                </p>
              )}
              {error && (
                <p className="text-center text-red-700 mt-4">Error updating pop: {error}</p>
              )}
            </>
          }
        />
      </div>
    </div>
  );
  
}
