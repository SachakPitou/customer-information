"use client";
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import React, { useState, useEffect } from 'react';
import PopUpModal from './popUpmodal';

export default function CustomerServiceForm() {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [CID, setCID] = useState('');
  const [Address, setAddress] = useState('');
  const [longtitudes, setLongtitudes] = useState('');
  const [langtitudes, setLangtitudes] = useState('');
  const [activationDate, setActivationDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();
  const [insertCustomerId, setInsertedCustomerId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
  };
  useEffect(() => {
    if (insertCustomerId || error) {
      setIsModalOpen(true);
    }
  }, [insertCustomerId, error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const customerId = uuidv4();
      const { data, error: insertError } = await supabase.from('Customer').insert([{
        customer_id: customerId,
        customer_name: customerName,
        phone_number: phoneNumber,
        cid: CID,
        address: Address,
        // longtitude: longtitudes,
        // langtitude: langtitudes,
        activation_date: activationDate, 
        service_id: parseInt(selectedServiceId),
        package_id: parseInt(selectedPackageId),
        isActive: isActive,
        status: 'Pending Technical Review' 
      }]);
      if (insertError) throw new Error(insertError.message);
      setInsertedCustomerId(customerId);
      router.push(`/dashboard`);
    } catch (error) {
      setError(error.message);
    }
  };
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
    fetchPackage();
    fetchService();
  }, []);
  const filteredPackagesByService = packages.filter(pkg => pkg.service_id === parseInt(selectedServiceId));
return (
    <div className="flex flex-col items-center justify-center min-h-screen dark:bg-gray-200">
        <div className="font-raleway-black w-full max-w-4xl p-5">
            {error && <p className="text-red-500">{error}</p>}
            <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
                <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                </svg>
                </button>
                <span>Create New Customer: </span>
      <form onSubmit={handleSubmit} className="flex flex-wrap justify-between mt-10">
      <div className="w-full lg:w-1/2 p-2">
        <div>
          <label className="block">Customer Name:</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="block w-full border rounded p-2 mb-2"
          />
        </div>
        <div>
          <label className="block">Phone Number:</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="block w-full border rounded p-2 mb-2"
          />
        </div>
        <div>
          <label className="block">CID:</label>
          <input
            type="text"
            value={CID}
            onChange={(e) => setCID(e.target.value)}
            className="block w-full border rounded p-2 mb-2"
          />
        </div>
        <div>
          <label className="block">Address:</label>
          <input
            type="text"
            value={Address}
            onChange={(e) => setAddress(e.target.value)}
            className="block w-full border rounded p-2 mb-2"
          />
        </div>
        
        </div>
        <div className="w-full lg:w-1/2 p-2">
        {/* <div>
          <label className="block">Longtitude:</label>
          <input
            type="text"
            value={longtitudes}
            onChange={(e) => setLongtitudes(e.target.value)}
            className="block w-full border rounded p-2 mb-2"
          />
        </div>
        <div>
          <label className="block">Langtitude:</label>
          <input
            type="text"
            value={langtitudes}
            onChange={(e) => setLangtitudes(e.target.value)}
            className="block w-full border rounded p-2 mb-2"
          />
        </div> */}
        <label htmlFor="serviceName" className="block">
          Service Name:
        </label>
        <select
          id="serviceName"
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
          required
          className="font-raleway-black w-full p-2 border mb-3"
        >
          <option value="">Select Service...</option>
          {services.map((service) => (
            <option key={service.service_id} value={service.service_id}>
              {service.service_name}
            </option>
          ))}
        </select>
        <label htmlFor="packageName" className="block">
          Package Name:
        </label>
        <select
          id="packageName"
          value={selectedPackageId}
          onChange={(e) => setSelectedPackageId(e.target.value)}
          required
          className="font-raleway-black w-full p-2 border mb-3"
        >
          <option value="">Select Package...</option>
          {/* Render options based on filtered packages */}
          {filteredPackagesByService.map((pkg) => (
            <option key={pkg.package_id} value={pkg.package_id}>
              {pkg.package_name}
            </option>
          ))}
        </select>
        <label htmlFor="status" className="block">
            Status:
            </label>
                <select
                id="status"
                value={isActive}
                onChange={(e) => setIsActive(e.target.value === 'true')}
                required
                className="font-raleway-black w-full p-2 border mb-3"
                >
                <option value="">Select Status...</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
            </select>
            <label htmlFor="activationDate" className="block">Activation Date:</label>
            <input
              type="date"
              id="activationDate"
              value={activationDate}
              onChange={(e) => setActivationDate(e.target.value)}
              required
              className="font-raleway-black w-full p-2 border mb-2"
            />
        </div>
        <div className="w-full p-2 text-center">
            <button
              type="submit"
              className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600"
            >
              Add Customer
            </button>
            </div>
      </form>
      <PopUpModal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={insertCustomerId ? 'Success' : 'Error'}
          content={
            <>
              {insertCustomerId && (
                <p className="text-center text-green-700 mt-4">
                  Customer is added to pending successfully with ID: {insertCustomerId}
                </p>
              )}
              {error && (
                <p className="text-center text-red-700 mt-4">Error adding customer: {error}</p>
              )}
            </>
          }
        />
      </div>
    </div>
  );
}