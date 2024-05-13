"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import SideBar from '../component/SideBar';
export default function CreateDevice() {
  const router = useRouter();
  const [deviceName, setDeviceName] = useState('');
  const [model, setModel] = useState('');
  const [ipAddress, setIPAddress] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [locations, setLocations] = useState([]);
  const [powerSources, setPowerSources] = useState([]);
  const [selectedPowerSourceId, setSelectedPowerSourceId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [insertDeviceId, setInsertedDeviceId] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPowerSource = async () => {
      try {
        const { data, error } = await supabase.from('Power Source').select('*');
        if (error) throw new Error(error.message);
        setPowerSources(data);
      } catch (error) {
        console.error('Error fetching Power Source:', error.message);
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
    
    
    fetchPowerSource();
    fetchLocation();
  }, []);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    try {
        // Get the maximum device_id from the database
        const { data: maxDeviceIdData, error: maxDeviceIdError } = await supabase
            .from('Device')
            .select('device_id', { count: 'max' })
            .single();
        
        if (maxDeviceIdError) throw new Error(maxDeviceIdError.message);

        // Calculate the new device_id by incrementing the maximum device_id by 1
        const newDeviceId = maxDeviceIdData.device_id + 1;

        // Insert the new device with the calculated device_id
        const { data, error: insertError } = await supabase.from('Device').insert([
            {
                device_id: newDeviceId,
                device_name: deviceName,
                model: model,
                ip_address: ipAddress,
                device_type: deviceType,
                power_source_id: parseInt(selectedPowerSourceId),
                location_id: parseInt(selectedLocationId),
            },
        ]);
        if (insertError) throw new Error(insertError.message);

        setInsertedDeviceId(newDeviceId);
        setDeviceName('');
        setModel('');
        setIPAddress('');
        setDeviceType('');
        setSelectedPowerSourceId('');
        setSelectedLocationId('');
    } catch (error) {
        setError(error.message);
    }
};

  return (
    <div className="flex flex-col w-full items-center justify-center min-h-screen dark:bg-gray-800">
      <div className="font-raleway-white w-full max-w-4xl p-5">
        <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700">
          <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <span>Create New Device: </span>
        <form onSubmit={handleAddDevice} className="flex flex-wrap justify-between mt-10">
          <div className="w-full lg:w-1/2 p-2">
            <label htmlFor="deviceName" className="block mb-2">Device Name:</label>
            <input
              type="text"
              id="deviceName"
              placeholder="Enter device name"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="ipAddress" className="block mb-2 mt-4">IP Address:</label>
            <input
              type="text"
              id="ipAddress"
              placeholder="Enter IP Address"
              value={ipAddress}
              onChange={(e) => setIPAddress(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="deviceType" className="block mb-2 mt-4">Device Type:</label>
            <input
              type="text"
              id="deviceType"
              placeholder="Enter Device Type"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
          </div>
          <div className="w-full lg:w-1/2 p-2">
            <label htmlFor="Model" className="block mb-2">Model:</label>
            <input
              type="text"
              id="Model"
              placeholder="Enter Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="powerSource" className="block mb-2 mt-4">Power Source:</label>
            <select
              id="powerSource"
              value={selectedPowerSourceId}
              onChange={(e) => setSelectedPowerSourceId(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            >
              <option value="">Select Power Source...</option>
              {powerSources.map((PWS) => (
                <option key={PWS.power_source_id} value={PWS.power_source_id}>
                  {PWS.power_source_type}
                </option>
              ))}
            </select>
            <label htmlFor="locationName" className="block mb-2 mt-4">Location Name:</label>
            <select
              id="locationName"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
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
              className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
            >
              Add Customer
            </button>
          </div>
        </form>
        {insertDeviceId && (
          <p className="text-center text-green-700 mt-4">
            Device added successfully with ID: {insertDeviceId}
          </p>
        )}
        {error && (
          <p className="text-center text-red-700 mt-4">Error adding device: {error}</p>
        )}
      </div>
    </div>
  );
}

