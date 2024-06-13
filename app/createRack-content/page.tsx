"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/navigation';
import SideBar from '../component/SideBar';
import PopUpModal from '../component/popUpmodal';

export default function CreateRack() {
  const router = useRouter();
  const [rackName, setRackName] = useState('');
  const [rackType, setRackType] = useState('');
  const [rackBrand, setRackBrand] = useState('');
  const [dimension, setDimension] = useState('');
  const [numberofu, setNumberOfU] = useState('');
  const [numberOfUs, setNumberOfUs] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedDevicesId, setSelectedDevicesId] = useState(Array.from({ length: numberOfUs || 0 }, () => ''));
  const [pops, setPops] = useState([]);
  const [selectedPopId, setSelectedPopId] = useState('');
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [insertedRackId, setInsertedRackId] = useState('');
  const [error, setError] = useState(null);
  const [rackImage, setRackImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const { data, error } = await supabase.from('Device').select('*');
        if (error) throw new Error(error.message);
        setDevices(data);
      } catch (error) {
        console.error('Error fetching devices:', error.message);
        setError(error.message);
      }
    };
    fetchDevices();
  }, []);
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase.from('Location').select('*');
        if (error) throw new Error(error.message);
        setLocations(data);
      } catch (error) {
        console.error('Error fetching locations:', error.message);
        setError(error.message);
      }
    };
    fetchLocations();
  }, []);
  useEffect(() => {
    const fetchPOPs = async () => {
      try {
        const { data, error } = await supabase.from('POP').select('*');
        if (error) throw new Error(error.message);
        setPops(data);
      } catch (error) {
        console.error('Error fetching pops:', error.message);
        setError(error.message);
      }
    };
    fetchPOPs();
  }, []);
  const handleAddRack = async (e) => {
    e.preventDefault();
    try {
      const { data: maxRackIdData, error: maxRackIdError } = await supabase
        .from('Rack')
        .select('rack_id')
        .order('rack_id', { ascending: false })
        .limit(1);
      if (maxRackIdError) {
        throw new Error(maxRackIdError.message);
      }

      const newRackId = maxRackIdData.length > 0 ? maxRackIdData[0].rack_id + 1 : 1;
      let imageUrl = null;
      if (rackImage) {
        try {
          const filePath = `images/${Date.now()}-${rackName}`;
          const { error: uploadError } = await supabase.storage.from('Rack Image').upload(filePath, rackImage);
      
          if (uploadError) {
            throw new Error(uploadError.message);
          }
      
          const { data: urlData, error: urlError } = await supabase.storage.from('Rack Image').getPublicUrl(filePath);
      
          if (urlError) {
            throw new Error(urlError.message);
          }
      
          imageUrl = urlData.publicUrl;
        } catch (error) {
          console.error('Error uploading image:', error.message);
          setError(error.message);
          return;
        }
      }
      const { data: rackData, error: insertError } = await supabase.from('Rack').insert([
        {
          rack_id: newRackId,
          rack_name: rackName,
          rack_type: rackType,
          rack_brand: rackBrand,
          dimension: dimension,
          image_url: imageUrl,
          numberOfU: numberOfUs,
          pop_id: parseInt(selectedPopId), 
          location_id: parseInt(selectedLocationId),
        },
      ]);
      if (insertError) throw new Error(insertError.message);
      // Insert devices for the rack
      const deviceInsertPromises = selectedDevicesId.map(async (deviceId, index) => {
        if (deviceId !== '') {
          await supabase.from('Rack Device').insert([
            {
              rack_id: newRackId,
              u_position: index + 1, // Calculate U position based on index
              device_id: parseInt(deviceId),
            },
          ]);
        }
      });
      await Promise.all(deviceInsertPromises);
      setInsertedRackId(newRackId);
      setRackName('');
      setRackType('');
      setRackBrand('');
      setDimension('');
      setRackImage(null); 
      setSelectedDevicesId(Array.from({ length: numberOfUs || 0 }, () => ''));
      setSelectedPopId('');
      setSelectedLocationId('');
    } catch (error) {
      setError(error.message);
    }
  };
  

  const handleDeviceSelectionChange = (index, deviceId) => {
    const updatedSelectedDevices = [...selectedDevicesId];
    updatedSelectedDevices[index] = deviceId;
    setSelectedDevicesId(updatedSelectedDevices);
  };
  const handleImageUpload = (e) => {
    setRackImage(e.target.files[0]);
  };
  const filteredPOPsByLocation = pops.filter(pop => pop.location_id === parseInt(selectedLocationId));
  return (
    <div className="flex flex-col w-full items-center justify-center min-h-screen dark:bg-gray-200">
      <div className="font-raleway-black w-full max-w-4xl p-5">
        <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
          <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <span>Create New Rack: </span>
        <form onSubmit={handleAddRack} className="flex flex-wrap justify-between mt-10">
          <div className="w-full lg:w-1/2 p-2">
            <label htmlFor="packageName" className="block mb-2">Rack Name:</label>
            <input
              type="text"
              id="packageName"
              placeholder="Enter Rack Name"
              value={rackName}
              onChange={(e) => setRackName(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border mb-2"
            />
            <label htmlFor="packageName" className="block mb-2">Rack Brand:</label>
            <input
              type="text"
              id="packageName"
              placeholder="Enter Rack Brand"
              value={rackBrand}
              onChange={(e) => setRackBrand(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border mb-2"
            />
            <label htmlFor="Location" className="block mb-2">Location:</label>
            <select
              id="Location"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border mb-2"
            >
              <option value="">Select Location...</option>
              {locations.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.location_name}
                </option>
              ))}
            </select>
            <label htmlFor="POP" className="block mb-2">POP:</label>
            <select
              id="POP"
              value={selectedPopId}
              onChange={(e) => setSelectedPopId(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border mb-2"
            >
              <option value="">Select POP...</option>
              {filteredPOPsByLocation.map((pop) => (
                <option key={pop.pop_id} value={pop.pop_id}>
                  {pop.pop_name}
                </option>
              ))}
            </select>
            {/* <label htmlFor="packageName" className="block mb-2">Vendor:</label>
            <input
              type="text"
              id="packageName"
              placeholder="Enter Vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            /> */}
            <label htmlFor="rackImage" className="block mb-2">Rack Image:</label>
            <input
              type="file"
              id="rackImage"
              onChange={handleImageUpload}
              required
              className="font-raleway-black w-full p-2 border mb-2"
            />
          </div>
          <div className="w-full lg:w-1/2 p-2">
            <label htmlFor="packageName" className="block mb-2">Rack Type:</label>
            <input
              type="text"
              id="packageName"
              placeholder="Enter Rack Type"
              value={rackType}
              onChange={(e) => setRackType(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border mb-2"
            />
            <label htmlFor="packageName" className="block mb-2">Dimension:</label>
            <input
              type="text"
              id="packageName"
              placeholder="Enter Dimension (height x width x depth)"
              value={dimension}
              onChange={(e) => setDimension(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border mb-2"
            />
            <label htmlFor="numberOfUs" className="block mb-2">Number of U spaces:</label>
            <input
              type="number"
              id="numberOfUs"
              value={numberOfUs}
              onChange={(e) => setNumberOfUs(parseInt(e.target.value))}
              required
              className="font-raleway-black w-full p-2 border mb-2"
            />
            {Array.from({ length: Math.max(0, numberOfUs || 0) }).map((_, index) => (
              <div key={index}>
                <label htmlFor={`device-${index}`} className="block mb-2">{`Device for U space ${index + 1}`}</label>
                <select
                  id={`device-${index}`}
                  value={selectedDevicesId[index]}
                  onChange={(e) => handleDeviceSelectionChange(index, e.target.value)}
                  className="font-raleway-black w-full p-2 border mb-2"
                >
                  <option value="">Select Device...</option>
                  {devices.map(device => (
                    <option key={device.device_id} value={device.device_id}>
                      {device.device_name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="w-full p-2 text-center">
            <button
              type="submit"
              className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600"
            >
              Add Rack
            </button>
          </div>
        </form>
        <PopUpModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={insertedRackId ? 'Success' : 'Error'}
        content={
          <>
            {insertedRackId && (
              <p className="text-center text-green-700 mt-4">
                Rack created successfully with ID: {insertedRackId}
              </p>
            )}
            {error && (
              <p className="text-center text-red-700 mt-4">Error creating Rack: {error}</p>
            )}
          </>
        }
      />
      </div>
    </div>
  );
}

