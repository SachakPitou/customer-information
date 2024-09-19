"use client"
import React, { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import PopUpModal from '@/app/component/popUpmodal';

interface Location {
  location_id: number;
  location_name: string;
  // Add other relevant fields if necessary
}

interface POP {
  pop_id: number;
  pop_name: string;
  location_id: number;
  image_url?: string;
}

export default function EditPOP() {
  const router = useRouter();
  const [pop, setPOP] = useState<POP | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { pop_id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const closeModal = () => {
    setIsModalOpen(false);
    console.log('Modal Closed');
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
        console.error('Error fetching pop:', (error as Error).message);
        setError((error as Error).message);
      }
    };

    const fetchLocation = async () => {
      try {
        const { data, error } = await supabase.from('Location').select('*');
        if (error) throw new Error(error.message);
        setLocations(data);
      } catch (error) {
        console.error('Error fetching locations:', (error as Error).message);
        setError((error as Error).message);
      }
    };

    if (pop_id) {
      fetchPOP();
    }
    fetchLocation();
  }, [pop_id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `pop_images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('POP Image')
      .upload(filePath, imageFile);

    if (uploadError) {
      throw new Error('Error uploading image');
    }

    const { data: publicURL } = supabase.storage
      .from('POP Image')
      .getPublicUrl(filePath);

    return publicURL.publicUrl;
  };

  const handleEditPOP = async (e: FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl: string = pop?.image_url || '';
      if (imageFile) {
        imageUrl = await uploadImage() || '';
      }

      if (pop) {
        const { error } = await supabase
          .from('POP')
          .update({
            pop_name: pop.pop_name,
            location_id: pop.location_id,
            image_url: imageUrl,
          })
          .eq('pop_id', pop.pop_id);

        if (error) throw new Error(error.message);
        setIsModalOpen(true);
        router.push('/popDetail');
        console.log('POP updated successfully');
      }
    } catch (error) {
      console.error('Error updating POP:', (error as Error).message);
      setError((error as Error).message);
    }
  };

  return (
    <div className="w-full flex items-center justify-center dark:bg-gray-200 min-h-screen">
      <div className="font-raleway-black w-full max-w-4xl p-5">
        <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
          <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <span>Edit POP Information: </span>
        <form onSubmit={handleEditPOP} className="flex flex-wrap justify-between mt-10">
        <div className="w-full lg:w-1/2 p-2">
            <label htmlFor="popName" className="block mb-2">POP Name:</label>
            <input
              type="text"
              id="popName"
              placeholder="Enter pop name"
              value={pop?.pop_name || ''}
              onChange={(e) => {
                if (pop) {
                  setPOP({ ...pop, pop_name: e.target.value });
                }
              }}
              required
              className="font-raleway-black w-full p-2 border"
            />
          </div>
          <div className="w-full lg:w-1/2 p-2">
            <label htmlFor="locationName" className="block mb-2">Location Name:</label>
            <select
              id="locationName"
              value={pop?.location_id || ''}
              onChange={(e) => setPOP({ ...pop!, location_id: parseInt(e.target.value, 10) })}
              required
              className="font-raleway-black w-full p-2 border"
            >
              <option value="">Select Location...</option>
              {locations.map((location) => (
                <option key={location.location_id} value={location.location_id}>
                  {location.location_name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full p-2">
            <label htmlFor="imageUpload" className="block mb-2">Upload Image:</label>
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              onChange={handleImageChange}
              className="font-raleway-black w-full p-2 border"
            />
          </div>
          {pop?.image_url && (
            <div className="w-full p-2">
              <p>Current Image:</p>
              <img src={pop.image_url} alt="Current POP" className="max-w-xs mt-2" />
            </div>
          )}
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
                <p className="text-center text-red-700 mt-4">Error updating POP: {error}</p>
              )}
            </>
          }
        />
      </div>
    </div>
  );
}