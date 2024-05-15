"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import PopupModal from '@/app/component/popUpModal';

export default function EditDevice() {
  const router = useRouter();
  const [device, setDevice] = useState({
    device_name: '',
    device_type: '',
    model: '',
    ip_address: '',
    location_id: '',
    power_source_id: '',
  });
  const [locations, setLocations] = useState([]);
  const [powersources, setPowerSources] = useState([]);
  const [error, setError] = useState(null);
  const { device_id } = useParams();
  

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const { data: deviceData, error } = await supabase
          .from('Device')
          .select('*')
          .eq('device_id', device_id)
          .single();
        if (error) throw new Error(error.message);
        setDevice(deviceData);
      } catch (error) {
        console.error('Error fetching device:', error.message);
        setError(error.message);
      }
    };

    const fetchPowerSource = async () => {
      try {
        const { data, error } = await supabase.from('Power Source').select('*');
        if (error) throw new Error(error.message);
        setPowerSources(data);
      } catch (error) {
        console.error('Error fetching power sources:', error.message);
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

    fetchDevice();
    fetchLocation();
    fetchPowerSource();
  }, [device_id]);

  const handleEditDevice = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('Device')
        .update({
            device_name: device.device_name,
            model: device.model,
            device_type: device.device_type,
            ip_address: device.ip_address,
            location_id: parseInt(device.location_id),
            power_source_id: parseInt(device.power_source_id),
        })
        .eq('device_id', device_id);
      if (error) throw new Error(error.message);
  
      console.log('Device updated successfully');
      // Optionally, you can navigate to a different page or show a success message
    } catch (error) {
      console.error('Error updating device:', error.message);
      setError(error.message);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen dark:bg-gray-200">
      <div className="font-raleway-black w-full max-w-4xl p-5">
        <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
          <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <span>Edit Device Information: </span>
        <form onSubmit={handleEditDevice} className="flex flex-wrap justify-between mt-10">
          <div className="w-full lg:w-1/2 p-2">
            {/* Customer Name */}
            <label htmlFor="deviceName" className="block mb-2">Device Name:</label>
            <input
              type="text"
              id="deviceName"
              placeholder="Enter device name"
              value={device.device_name}
              onChange={(e) => setDevice({ ...device, device_name: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            {/* Phone Number */}
            <label htmlFor="ipAddress" className="block mb-2 mt-4">IP Address:</label>
            <input
              type="text"
              id="ipAddress"
              placeholder="Enter IP Address"
              value={device.ip_address}
              onChange={(e) => setDevice({ ...device, ip_address: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="deviceType" className="block mb-2 mt-4">Device Type:</label>
            <input
              type="text"
              id="deviceType"
              placeholder="Enter Device Type"
              value={device.device_type}
              onChange={(e) => setDevice({ ...device, device_type: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            {/* Langtitude */}
          </div>
          <div className="w-full lg:w-1/2 p-2">
            {/* CID */}
            <label htmlFor="model" className="block mb-2">Model:</label>
            <input
              type="text"
              id="model"
              placeholder="Enter Model"
              value={device.model}
              onChange={(e) => setDevice({ ...device, model: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            {/* Service Name */}
            <label htmlFor="powersourceType" className="block mb-2 mt-4">Power Source Type:</label>
            <select
              id="powersourceType"
              value={device.power_source_id}
              onChange={(e) => setDevice({ ...device, power_source_id: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            >
              <option value="">Select Power Source...</option>
              {powersources.map((PWS) => (
                <option key={PWS.power_source_id} value={PWS.power_source_id}>
                  {PWS.power_source_type}
                </option>
              ))}
            </select>
            {/* Location Name */}
            <label htmlFor="locationName" className="block mb-2 mt-4">Location Name:</label>
            <select
              id="locationName"
              value={device.location_id}
              onChange={(e) => setDevice({ ...device, location_id: e.target.value })}
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
              Update Device
            </button>
          </div>
        </form>
        {device_id && (
          <p className="text-center text-green-700 mt-4">
            Device updated successfully with ID: {device_id}
          </p>
        )}
        {error && (
          <p className="text-center text-red-700 mt-4">Error updating device: {error}</p>
        )}
      </div>
    </div>
  );
  
}
