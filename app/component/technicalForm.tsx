"use client";// TechnicalForm.js""
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';

export default function TechnicalForm({ customerId }) {
    const [customerData, setCustomerData] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [onuMacAddress, setOnuMacAddress] = useState('');
  const [slots, setSlot] = useState('');
  const [ports, setPorts] = useState('');
  const [servicePort, setServicePort] = useState('');
  const [onuID, setOnuID] = useState('');
  const [cameraIP, setCameraIP] = useState('');
  const [ipAddress, setIPAddress] = useState('');
  const [locations, setLocations] = useState([]);
  const [OLTs, setOLTs] = useState([]);
  const [devices, setDevices] = useState([]);
  const [activationDate, setActivationDate] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedOLTId, setSelectedOLTId] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
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
    const fetchDevice = async () => {
        try {
          const { data, error } = await supabase.from('Device').select('*');
          if (error) throw new Error(error.message);
          setDevices(data);
        } catch (error) {
          console.error('Error fetching devices:', error.message);
          setError(error.message);
        }
      };
      const fetchOLT = async () => {
        try {
          const { data, error } = await supabase.from('OLT').select('*');
          if (error) throw new Error(error.message);
          setOLTs(data);
        } catch (error) {
          console.error('Error fetching OLTs:', error.message);
          setError(error.message);
        }
      };
  
    const fetchCustomerData = async () => {
      try {
        const { data, error } = await supabase
          .from('Customer')
          .select('*')
          .eq('customer_id', customerId)
          .single();

        if (error) throw error;

        setCustomerData(data);
      } catch (error) {
        console.error('Error fetching customer data:', error.message);
      }
    };

    if (customerId) {
      fetchCustomerData();
    }
    fetchLocation();
    fetchDevice();
    fetchOLT();
  }, [customerId]);

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error: updateError } = await supabase
        .from('Customer')
        .update({
          ONU_mac_address: onuMacAddress,
          slot: slots,
          port: ports,
          service_port: servicePort,
          onu_id: onuID,
          ip_address: ipAddress,
          camera_ip: cameraIP,
          device_id: parseInt(selectedDeviceId),
          location_id: parseInt(selectedLocationId),
          olt_id: parseInt(selectedOLTId),
          status: 'Completed'
        })
        .eq('customer_id', customerId);
      if (updateError) throw new Error(updateError.message);

      router.push('/');
    } catch (error) {
      setError(error.message);
    }
  };

  if (!customerData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen dark:bg-gray-200">
      <div className="font-raleway-black w-full max-w-4xl p-5">
        {error && <p className="text-red-500">{error}</p>}
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
            <path d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <span>Create New Customer: </span>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap justify-between">
            <div className="w-full lg:w-1/2 p-2">
              <div>
                <label>ONU MAC Address:</label>
                <input type="text" value={onuMacAddress} onChange={e => setOnuMacAddress(e.target.value)} className="block w-full border rounded p-2" />
              </div>
              <div>
                <label>Slot:</label>
                <input type="text" value={slots} onChange={e => setSlot(e.target.value)} className="block w-full border rounded p-2" />
              </div>
              <div>
                <label>Port:</label>
                <input type="text" value={ports} onChange={e => setPorts(e.target.value)} className="block w-full border rounded p-2" />
              </div>
              <div>
                <label>Service Port:</label>
                <input type="text" value={servicePort} onChange={e => setServicePort(e.target.value)} className="block w-full border rounded p-2" />
              </div>
              <label htmlFor="OLTName" className="block mb-2 mt-4">Select OLT:</label>
                <select
                id="OLTName"
                value={selectedOLTId}
                onChange={(e) => setSelectedOLTId(e.target.value)}
                required
                className="font-raleway-black w-full p-2 border"
                >
                <option value="">Select OLT...</option>
                {OLTs.map((olt) => (
                    <option key={olt.olt_id} value={olt.olt_id}>
                    {olt.olt_name}
                    </option>
                ))}
                </select>
            </div>
            <div className="w-full lg:w-1/2 p-2">
              <div>
                <label>ONU ID:</label>
                <input type="text" value={onuID} onChange={e => setOnuID(e.target.value)} className="block w-full border rounded p-2" />
              </div>
              <div>
                <label>Camera IP:</label>
                <input type="text" value={cameraIP} onChange={e => setCameraIP(e.target.value)} className="block w-full border rounded p-2" />
              </div>
              <div>
                <label>IP Address:</label>
                <input type="text" value={ipAddress} onChange={e => setIPAddress(e.target.value)} className="block w-full border rounded p-2" />
              </div>
              <label htmlFor="deviceName" className="block">Device Name:</label>
                <select
                id="deviceName"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                required
                className="font-raleway-black w-full p-2 border mb-4"
                >
                <option value="">Select Device...</option>
                {devices.map((dvc) => (
                    <option key={dvc.device_id} value={dvc.device_id}>
                    {dvc.device_name}
                    </option>
                ))}
                </select>
                <label htmlFor="locationName" className="block mb-2">Location Name:</label>
                <select
                id="locationNamee"
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                required
                className="font-raleway-black w-full p-2 border mb-2"
                >
                <option value="">Select Location...</option>
                {locations.map((location_location) => (
                    <option key={location_location.location_id} value={location_location.location_id}>
                    {location_location.location_name}
                    </option>
                ))}
                </select>
            </div>
          </div>
          {/* Add dropdowns for selecting device, service, package, location, OLT */}
          <div className="w-full p-2 text-center">
            <button
              type="submit"
              className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600"
            >
              Add Customer
            </button>
            </div>
        </form>
      </div>
    </div>
  );
}
  
  
  
  
  
  
  