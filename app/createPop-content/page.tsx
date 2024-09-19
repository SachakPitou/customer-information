"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/navigation';
import PopUpModal from '../component/popUpmodal';

export default function CreatePop() {
  const router = useRouter();
  const [popName, setPopName] = useState<string>('');
  const [locations, setLocations] = useState<Array<{ location_id: number, location_name: string }>>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [insertPopId, setInsertedPopId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

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
        setLocations(data || []);
      } catch (error: any) {
        console.error('Error fetching Location:', error.message);
        setError(error.message);
      }
    };
    fetchLocation();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
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

  const handleAddPop = async (e: React.FormEvent<HTMLFormElement>) => {
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

      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // Insert the new POP with the calculated pop_id and image_url
      const { error: insertError } = await supabase.from('POP').insert([
        {
          pop_id: newPopId,
          pop_name: popName,
          location_id: parseInt(selectedLocationId, 10),
          image_url: imageUrl,
        },
      ]);
      if (insertError) throw new Error(insertError.message);

      setInsertedPopId(newPopId);
      setPopName('');
      setSelectedLocationId('');
      setImageFile(null);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col w-full items-center justify-center min-h-screen dark:bg-gray-200">
      <div className="font-raleway-black w-full max-w-4xl p-5">
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18"
            />
          </svg>
        </button>
        <span>Create New Pop: </span>
        <form onSubmit={handleAddPop} className="flex flex-wrap justify-between mt-10">
          <div className="w-full lg:w-1/2 p-2">
            <label htmlFor="popName" className="block mb-2">Pop Name:</label>
            <input
              type="text"
              id="popName"
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
                <option key={loc.location_id} value={loc.location_id.toString()}>
                  {loc.location_name}
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
