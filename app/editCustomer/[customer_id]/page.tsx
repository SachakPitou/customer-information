"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import PopUpModal from '@/app/component/popUpmodal';

export default function Page() {
  const router = useRouter();
  const [customer, setCustomer] = useState({
    customer_name: '',
    phone_number: '',
    cid: '',
    address: '',
    longtitude: '',
    langtitude: '',
    ONU_mac_address: '',
    slot: '',
    port: '',
    service_port: '',
    onu_id: '',
    camera_ip: '',
    ip_address: '',
    activation_date: '',
    device_id: '',
    service_id: '',
    package_id: '',
    location_id: '',
    olt_id: '',
  });
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [devices, setDevices] = useState([]);
  const [OLTs, setOLTs] = useState([]);
  const [error, setError] = useState(null);
  const { customer_id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
    console.log('Modal Closed'); // Add console log to check if modal is being closed
  };
 

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const { data: customerData, error } = await supabase
          .from('Customer')
          .select('*')
          .eq('customer_id', customer_id)
          .single();
        if (error) throw new Error(error.message);
        setCustomer(customerData);
      } catch (error) {
        console.error('Error fetching customer:', error.message);
        setError(error.message);
      }
    };

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

    fetchCustomer();
    fetchDevice();
    fetchLocation();
    fetchPackage();
    fetchService();
    fetchOLT();
  }, [customer_id]);
  
  const handleEditCustomer = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('Customer')
        .update({
          customer_name: customer.customer_name,
          phone_number: customer.phone_number,
          cid: customer.cid,
          address: customer.address,
          longtitude: customer.longtitude,
          langtitude: customer.langtitude,
          ONU_mac_address: customer.ONU_mac_address,
          slot: customer.slot,
          port: customer.port,
          service_port: customer.service_port,
          onu_id: customer.onu_id,
          camera_ip: customer.camera_ip,
          ip_address: customer.ip_address,
          activation_date: customer.activation_date,
          device_id: parseInt(customer.device_id),
          service_id: parseInt(customer.service_id),
          package_id: parseInt(customer.package_id),
          location_id: parseInt(customer.location_id),
          olt_id: parseInt(customer.olt_id),
        })
        .eq('customer_id', customer_id);
      if (error) throw new Error(error.message);
      setIsModalOpen(true);
      console.log('Customer updated successfully');
      // Optionally, you can navigate to a different page or show a success message
    } catch (error) {
      console.error('Error updating customer:', error.message);
      setError(error.message);
    }
  };


  // const filteredPackagesByService = packages.filter(pkg => pkg.service_id === parseInt(selectedServiceId));
  return (
    <div className="flex flex-col items-center justify-center min-h-screen dark:bg-gray-200">
      <div className="font-raleway-black w-full max-w-4xl p-5">
        <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
          <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <span>Edit Customer Information: </span>
        <form onSubmit={handleEditCustomer} className="flex flex-wrap justify-between mt-10">
          <div className="w-full lg:w-1/3 p-2">
            {/* Customer Name */}
            <label htmlFor="customerName" className="block mb-2">Customer Name:</label>
            <input
              type="text"
              id="customerName"
              placeholder="Enter customer name"
              value={customer.customer_name}
              onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            {/* Phone Number */}
            <label htmlFor="phoneNumber" className="block mb-2 mt-4">Phone Number:</label>
            <input
              type="text"
              id="phoneNumber"
              placeholder="Enter Phone Number"
              value={customer.phone_number}
              onChange={(e) => setCustomer({ ...customer, phone_number: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            {/* Package Name */}
            <label htmlFor="packageName" className="block mb-2 mt-4">Package Name:</label>
            <select
              id="packageName"
              value={customer.package_id}
              onChange={(e) => setCustomer({ ...customer, package_id: e.target.value })}
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
            {/* Address */}
            <label htmlFor="Address" className="block mb-2 mt-4">Address:</label>
            <input
              type="text"
              id="Address"
              placeholder="Enter Address"
              value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="onuMacAddress" className="block mb-2 mt-4">ONU Mac Address:</label>
            <input
              type="float"
              id="onuMacAddress"
              placeholder="Enter ONU Mac Address"
              value={customer.ONU_mac_address}
              onChange={(e) => setCustomer({ ...customer, ONU_mac_address: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="onuID" className="block mb-2 mt-4">ONU ID:</label>
            <input
              type="int"
              id="onuID"
              placeholder="Enter ONU ID"
              value={customer.onu_id}
              onChange={(e) => setCustomer({ ...customer, onu_id: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            <label htmlFor="activationDate" className="block mb-2 mt-4">Activation Date:</label>
            <input
              type="date"
              id="activationDate"
              value={customer.activation_date}
              onChange={(e) => setCustomer({ ...customer, activation_date: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
          </div>
          <div className="w-full lg:w-1/3 p-2">
            {/* CID */}
            <label htmlFor="CID" className="block mb-2">CID:</label>
            <input
              type="text"
              id="CID"
              placeholder="Enter CID"
              value={customer.cid}
              onChange={(e) => setCustomer({ ...customer, cid: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            {/* Service Name */}
            <label htmlFor="serviceName" className="block mb-2 mt-4">Service Name:</label>
            <select
              id="serviceName"
              value={customer.service_id}
              onChange={(e) => setCustomer({ ...customer, service_id: e.target.value })}
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
            {/* Location Name */}
            <label htmlFor="locationName" className="block mb-2 mt-4">Location Name:</label>
            <select
              id="locationName"
              value={customer.location_id}
              onChange={(e) => setCustomer({ ...customer, location_id: e.target.value })}
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
            {/* Longtitude */}
            <label htmlFor="longtitudes" className="block mb-2 mt-4">Longtitude:</label>
            <input
              type="float"
              id="longtitudes"
              placeholder="Enter Longtitude"
              value={customer.longtitude}
              onChange={(e) => setCustomer({ ...customer, longtitude: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
             <label htmlFor="ports" className="block mb-2 mt-4">Port:</label>
            <input
              type="int"
              id="ports"
              placeholder="Enter Port"
              value={customer.port}
              onChange={(e) => setCustomer({ ...customer, port: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
             <label htmlFor="cameraIP" className="block mb-2 mt-4">Camera IP:</label>
            <input
              type="text"
              id="cameraIP"
              placeholder="Enter Camera IP"
              value={customer.camera_ip}
              onChange={(e) => setCustomer({ ...customer, camera_ip: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
          </div>
          <div className="w-full lg:w-1/3 p-2">
            {/* Langtitude */}
            <label htmlFor="langtitudes" className="block mb-2">Langtitude:</label>
            <input
              type="float"
              id="langtitudes"
              placeholder="Enter Langtitude"
              value={customer.langtitude}
              onChange={(e) => setCustomer({ ...customer, langtitude: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            {/* Slot */}
            <label htmlFor="slots" className="block mb-2 mt-4">Slot:</label>
            <input
              type="int"
              id="slots"
              placeholder="Enter Slot"
              value={customer.slot}
              onChange={(e) => setCustomer({ ...customer, slot: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            {/* Service Port */}
            <label htmlFor="servicePort" className="block mb-2 mt-4">Service Port:</label>
            <input
              type="int"
              id="servicePort"
              placeholder="Enter Service Port"
              value={customer.service_port}
              onChange={(e) => setCustomer({ ...customer, service_port: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            {/* IP Address */}
            <label htmlFor="ipAddress" className="block mb-2 mt-4">IP Address:</label>
            <input
              type="text"
              id="ipAddress"
              placeholder="Enter IP Address"
              value={customer.ip_address}
              onChange={(e) => setCustomer({ ...customer, ip_address: e.target.value })}
              required
              className="font-raleway-black w-full p-2 border"
            />
            {/* Device Name */}
            <label htmlFor="deviceName" className="block mb-2 mt-4">Device Name:</label>
            <select
              id="deviceName"
              value={customer.device_id}
              onChange={(e) => setCustomer({ ...customer, device_id: e.target.value })}
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
            <label htmlFor="oltName" className="block mb-2 mt-4">OLT Name:</label>
            <select
              id="oltName"
              value={customer.olt_id}
              onChange={(e) => setCustomer({ ...customer, olt_id: e.target.value })}
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
            {/* ONU Mac Address */}
            
            {/* Port */}
           
            {/* ONU ID */}
            
            {/* Camera IP */}
           
            {/* Activation Date */}
            
          <div className="w-full p-2 text-center">
            <button
              type="submit"
              className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600"
            >
              Update Customer
            </button>
          </div>
        </form>
        <PopUpModal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={customer_id ? 'Success' : 'Error'}
          content={
            <>
              {customer_id && (
                <p className="text-center text-green-700 mt-4">
                  Customer updated successfully with ID: {customer_id}
                </p>
              )}
              {error && (
                <p className="text-center text-red-700 mt-4">Error updating customer: {error}</p>
              )}
            </>
          }
        />
      </div>
    </div>
  );
  
}
