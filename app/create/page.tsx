"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [OLTs, setOLTs] = useState([]);
  const [CID, setCID] = useState('');
  const [Address, setAddress] = useState('');
  const [longtitudes, setLongtitudes] = useState('');
  const [langtitudes, setLangtitudes] = useState('');
  const [onuMacAddress, setonuMacAddress] = useState('');
  const [slots, setSlot] = useState('');
  const [ports, setPorts] = useState('');
  const [servicePort, setServicePort] = useState('');
  const [onuID, setOnuID] = useState('');
  const [cameraIP, setCameraIP] = useState('');
  const [ipAddress, setIPAddress] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedOLTId, setSelectedOLTId] = useState('');
  const [insertedCustomerId, setInsertedCustomerId] = useState('');
  const [activationDate, setActivationDate] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data, error } = await supabase.from('Service').select('*');
        if (error) throw new Error(error.message);
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error.message);
        setError(error.message);
      }
    };
    const fetchPackage = async () => {
      try {
        const { data, error } = await supabase.from('Package').select('*');
        if (error) throw new Error(error.message);
        setPackages(data);
      } catch (error) {
        console.error('Error fetching packages:', error.message);
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
    fetchDevice();
    fetchLocation();
    fetchPackage();
    fetchService();
    fetchOLT();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      const customerId = uuidv4();
      const { data, error: insertError } = await supabase.from('Customer').insert([{
        customer_id: customerId,
        customer_name: customerName,
        phone_number: phoneNumber,
        cid: CID,
        address: Address,
        longtitude: longtitudes,
        langtitude: langtitudes,
        ONU_mac_address: onuMacAddress,
        slot: slots,
        port: ports,
        service_port: servicePort,
        onu_id: onuID,
        ip_address: ipAddress,
        camera_ip: cameraIP,
        activation_date: activationDate, 
        device_id: parseInt(selectedDeviceId),
        service_id: parseInt(selectedServiceId),
        package_id: parseInt(selectedPackageId),
        location_id: parseInt(selectedLocationId),
        olt_id: parseInt(selectedOLTId),
      }]);
      if (insertError) throw new Error(insertError.message);

      setInsertedCustomerId(customerId);
      setCustomerName('');
      setPhoneNumber('');
      setCID('');
      setAddress('');
      setLongtitudes('');
      setLangtitudes('');
      setonuMacAddress('');
      setSlot('');
      setPorts('');
      setServicePort('');
      setOnuID('');
      setCameraIP('');
      setIPAddress('');
      setActivationDate('');
      setSelectedDeviceId('');
      setSelectedServiceId('');
      setSelectedPackageId('');
      setSelectedLocationId('');
      setSelectedOLTId('');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen dark:bg-gray-800">
      <div className="font-raleway-white w-full max-w-4xl p-5">
        <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700">
          <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <span>Create New Customer: </span>
        <form onSubmit={handleAddCustomer} className="flex flex-wrap justify-between mt-10">
          <div className="w-full lg:w-1/2 p-2">
            <label htmlFor="customerName" className="block mb-2">Customer Name:</label>
            <input
              type="text"
              id="customerName"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="phoneNumber" className="block mb-2 mt-4">Phone Number:</label>
            <input
              type="text"
              id="phoneNumber"
              placeholder="Enter Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="packageName" className="block mb-2 mt-4">Package Name:</label>
            <select
              id="packageName"
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            >
              <option value="">Select Package...</option>
              {packages.map((pkg) => (
                <option key={pkg.package_id} value={pkg.package_id}>
                  {pkg.package_name}
                </option>
              ))}
            </select>
            <label htmlFor="Address" className="block mb-2 mt-4">Address:</label>
            <input
              type="text"
              id="Address"
              placeholder="Enter Address"
              value={Address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="langtitudes" className="block mb-2 mt-4">Langtitude:</label>
            <input
              type="float"
              id="langtitudes"
              placeholder="Enter Langtitude"
              value={langtitudes}
              onChange={(e) => setLangtitudes(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="slots" className="block mb-2 mt-4">Slot:</label>
            <input
              type="int"
              id="slots"
              placeholder="Enter Slot"
              value={slots}
              onChange={(e) => setSlot(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="servicePort" className="block mb-2 mt-4">Service Port:</label>
            <input
              type="int"
              id="servicePort"
              placeholder="Enter Service Port"
              value={servicePort}
              onChange={(e) => setServicePort(e.target.value)}
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
            <label htmlFor="deviceName" className="block mb-2 mt-4">Device Name:</label>
            <select
              id="deviceName"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            >
              <option value="">Select Device...</option>
              {devices.map((dvc) => (
                <option key={dvc.device_id} value={dvc.device_id}>
                  {dvc.device_name}
                </option>
              ))}
            </select>
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
            <label htmlFor="CID" className="block mb-2">CID:</label>
            <input
              type="text"
              id="CID"
              placeholder="Enter CID"
              value={CID}
              onChange={(e) => setCID(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="serviceName" className="block mb-2 mt-4">Service Name:</label>
            <select
              id="serviceName"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            >
              <option value="">Select Service...</option>
              {services.map((service) => (
                <option key={service.service_id} value={service.service_id}>
                  {service.service_name}
                </option>
              ))}
            </select>
            <label htmlFor="locationName" className="block mb-2 mt-4">Location Name:</label>
            <select
              id="locationNamee"
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
            <label htmlFor="longtitudes" className="block mb-2 mt-4">Longtitude:</label>
            <input
              type="float"
              id="longtitudes"
              placeholder="Enter Longtitude"
              value={longtitudes}
              onChange={(e) => setLongtitudes(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="onuMacAddress" className="block mb-2 mt-4">ONU Mac Address:</label>
            <input
              type="float"
              id="onuMacAddress"
              placeholder="Enter ONU Mac Address"
              value={onuMacAddress}
              onChange={(e) => setonuMacAddress(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="ports" className="block mb-2 mt-4">Port:</label>
            <input
              type="int"
              id="ports"
              placeholder="Enter Port"
              value={ports}
              onChange={(e) => setPorts(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="onuID" className="block mb-2 mt-4">ONU ID:</label>
            <input
              type="int"
              id="onuID"
              placeholder="Enter ONU ID"
              value={onuID}
              onChange={(e) => setOnuID(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="cameraIP" className="block mb-2 mt-4">Camera IP:</label>
            <input
              type="text"
              id="cameraIP"
              placeholder="Enter Camera IP"
              value={cameraIP}
              onChange={(e) => setCameraIP(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="activationDate" className="block mb-2 mt-4">Activation Date:</label>
            <input
              type="date"
              id="activationDate"
              value={activationDate}
              onChange={(e) => setActivationDate(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border"
            />
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
        {insertedCustomerId && (
          <p className="text-center text-green-700 mt-4">
            Customer added successfully with ID: {insertedCustomerId}
          </p>
        )}
        {error && (
          <p className="text-center text-red-700 mt-4">Error adding customer: {error}</p>
        )}
      </div>
    </div>
  );
}
function setOLTs(data: any[]) {
  throw new Error('Function not implemented.');
}

