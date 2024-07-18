"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import PopUpModal from '@/app/component/popUpmodal';

export default function EditDevice() {
  const router = useRouter();
  const { device_id } = useParams();
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [device, setDevice] = useState({
    device_name: '',
    device_type_id: '',
    model: '',
    ip_address: '',
    location_id: '',
    pop_id: '',
    rack_id: '',
    power_source_id: '',
    mac_address: '',
    serial_number: '',
    description: '',
    u_position: '',
  });

  const [locations, setLocations] = useState([]);
  const [POPs, setPOPs] = useState([]);
  const [racks, setRacks] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [powerSources, setPowerSources] = useState([]);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch device data
        const { data: deviceData, error: deviceError } = await supabase
          .from('Device')
          .select('*')
          .eq('device_id', device_id)
          .single();

        if (deviceError) throw new Error(deviceError.message);
        setDevice(deviceData);

        // Fetch locations
        const { data: locationsData, error: locationsError } = await supabase.from('Location').select('*');
        if (locationsError) throw new Error(locationsError.message);
        setLocations(locationsData);

        // Fetch device types
        const { data: deviceTypesData, error: deviceTypesError } = await supabase.from('Device Type').select('*');
        if (deviceTypesError) throw new Error(deviceTypesError.message);
        setDeviceTypes(deviceTypesData);

        // Fetch power sources
        const { data: powerSourcesData, error: powerSourcesError } = await supabase.from('Power Source').select('*');
        if (powerSourcesError) throw new Error(powerSourcesError.message);
        setPowerSources(powerSourcesData);

        // Fetch related data based on device properties
        if (deviceData.rack_id) {
          await fetchRackData(deviceData.rack_id, deviceData.device_id);
        } else if (deviceData.location_id) {
          await fetchPOPs(deviceData.location_id);
          if (deviceData.pop_id) {
            await fetchRacks(deviceData.pop_id);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error.message);
        setError(error.message);
      }
    };

    fetchData();
  }, [device_id]);

  const fetchRackData = async (rack_id, device_id) => {
    try {
      // Fetch rack data
      const { data: rackData, error: rackError } = await supabase
        .from('Rack')
        .select('pop_id, location_id')
        .eq('rack_id', rack_id)
        .single();

      if (rackError) throw new Error(rackError.message);
      setDevice(prevDevice => ({
        ...prevDevice,
        location_id: rackData.location_id,
        pop_id: rackData.pop_id
      }));

      // Fetch POPs based on location_id from rack data
      await fetchPOPs(rackData.location_id);

      // Fetch racks based on pop_id from rack data
      await fetchRacks(rackData.pop_id);

      // Fetch u_position from Rack Device table
      const { data: rackDeviceData, error: rackDeviceError } = await supabase
        .from('Rack Device')
        .select('u_position')
        .eq('rack_id', rack_id)
        .eq('device_id', device_id)
        .single();

      if (rackDeviceError) throw new Error(rackDeviceError.message);
      setDevice(prevDevice => ({
        ...prevDevice,
        u_position: rackDeviceData.u_position
      }));
    } catch (error) {
      console.error('Error fetching rack data:', error.message);
      setError(error.message);
    }
  };

  const fetchPOPs = async (location_id) => {
    try {
      const { data: popsData, error: popsError } = await supabase
        .from('POP')
        .select('*')
        .eq('location_id', location_id);
      if (popsError) throw new Error(popsError.message);
      setPOPs(popsData);
    } catch (error) {
      console.error('Error fetching POPs:', error.message);
    }
  };

  const fetchRacks = async (pop_id) => {
    try {
      const { data: racksData, error: racksError } = await supabase
        .from('Rack')
        .select('*')
        .eq('pop_id', pop_id);
      if (racksError) throw new Error(racksError.message);
      setRacks(racksData);
    } catch (error) {
      console.error('Error fetching racks:', error.message);
    }
  };

  useEffect(() => {
    if (device.location_id) {
      fetchPOPs(device.location_id);
    }
  }, [device.location_id]);

  useEffect(() => {
    if (device.pop_id) {
      fetchRacks(device.pop_id);
    }
  }, [device.pop_id]);

  const handleEditDevice = async (e) => {
    e.preventDefault();
    try {
      // Update the Device table
      const { error: deviceError } = await supabase
        .from('Device')
        .update({
          device_name: device.device_name,
          model: device.model,
          device_type_id: parseInt(device.device_type_id),
          ip_address: device.ip_address,
          location_id: parseInt(device.location_id),
          pop_id: parseInt(device.pop_id),
          rack_id: parseInt(device.rack_id),
          power_source_id: parseInt(device.power_source_id),
        })
        .eq('device_id', device_id);
  
      if (deviceError) throw new Error(deviceError.message);
  
      // Update the Rack Device table if rack_id exists
      if (device.rack_id) {
        const { error: rackDeviceError } = await supabase
          .from('Rack Device')
          .update({
            u_position: device.u_position,
            rack_id: device.rack_id
          })
          .eq('device_id', device_id);
  
        if (rackDeviceError) throw new Error(rackDeviceError.message);
      }
  
      setIsModalOpen(true);
      router.push('/deviceDetail')
      console.log('Device and Rack Device updated successfully');
    } catch (error) {
      console.error('Error updating device:', error.message);
      setError(error.message);
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
        <span>Edit Device Information: </span>
        <form onSubmit={handleEditDevice} className="flex flex-wrap justify-between mt-10">
          <div className="w-full lg:w-1/2 p-2">
            {/* Device Name */}
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
            {/* IP Address */}
            <label htmlFor="ipAddress" className="block mb-2 mt-4">IP Management:</label>
            <input
              type="text"
              id="ipAddress"
              placeholder="Enter IP Management"
              value={device.ip_address}
              onChange={(e) => setDevice({ ...device, ip_address: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            {/* Device Type */}
            <label htmlFor="deviceType" className="block mb-2 mt-4">Device Type:</label>
            <select
              id="deviceType"
              value={device.device_type_id}
              onChange={(e) => setDevice({ ...device, device_type_id: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            >
              <option value="">Select Device Type...</option>
              {deviceTypes.map((dvct) => (
                <option key={dvct.device_type_id} value={dvct.device_type_id}>
                  {dvct.device_type}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full lg:w-1/2 p-2">
            {/* Model */}
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
            {/* Power Source Type */}
            <label htmlFor="powersourceType" className="block mb-2 mt-4">Power Source Type:</label>
            <select
              id="powersourceType"
              value={device.power_source_id}
              onChange={(e) => setDevice({ ...device, power_source_id: e.target.value })}
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

            {/* POP Name */}
            <label htmlFor="popName" className="block mb-2 mt-4">POP Name:</label>
            <select
              id="popName"
              value={device.pop_id}
              onChange={(e) => setDevice({ ...device, pop_id: e.target.value })}
              required
              disabled={!device.location_id}
              className="font-raleway-black w-full p-2 border"
            >
              <option value="">Select POP...</option>
              {POPs.map((pop) => (
                <option key={pop.pop_id} value={pop.pop_id}>
                  {pop.pop_name}
                </option>
              ))}
            </select>

            {/* Rack Name */}
            <label htmlFor="rackName" className="block mb-2 mt-4">Rack Name:</label>
            <select
              id="rackName"
              value={device.rack_id}
              onChange={(e) => setDevice({ ...device, rack_id: e.target.value })}
              required
              disabled={!device.pop_id}
              className="font-raleway-black w-full p-2 border"
            >
              <option value="">Select Rack...</option>
              {racks.map((rack) => (
                <option key={rack.rack_id} value={rack.rack_id}>
                  {rack.rack_name}
                </option>
              ))}
            </select>
            {/* U Position */}
            <label htmlFor="uPosition" className="block mb-2 mt-4">U Position:</label>
            <input
              type="text"
              id="uPosition"
              placeholder="Enter U Position"
              value={device.u_position}
              onChange={(e) => setDevice({ ...device, u_position: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
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
        <PopUpModal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={device_id ? 'Success' : 'Error'}
          content={
            <>
              {device_id && (
                <p className="text-center text-green-700 mt-4">
                  Device updated successfully with ID: {device_id}
                </p>
              )}
              {error && (
                <p className="text-center text-red-700 mt-4">Error updating device: {error}</p>
              )}
            </>
          }
        />
      </div>
    </div>
  );
}