"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import PopUpModal from './popUpmodal';

interface CustomerData {
  customer_id: string;
  customer_name: string;
  phone_number: string;
  cid: string;
  contract_id: string;
  address: string;
  activation_date: string;
  service_id: number;
  package_id: number;
  location_id: number;
  status_type: string | null;
  status: string;
  sale_name: string;
  ip_type: string;
  active_timestamp?: string;
  inactive_timestamp?: string;
  reactive_timestamp?: string;
  terminate_timestamp?: string;
}

interface Service {
  service_id: number;
  service_name: string;
}

interface Package {
  package_id: number;
  package_name: string;
  service_id: number;
}

interface Location {
  location_id: number;
  location_name: string;
}

export default function CustomerServiceForm() {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [CID, setCID] = useState('');
  const [contractID, setContractID] = useState('');
  const [Address, setAddress] = useState('');
  const [ipType, setipType] = useState('');
  const [activationDate, setActivationDate] = useState('');
  const [salesName, setsalesName] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [insertCustomerId, setInsertedCustomerId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusType, setStatusType] = useState<string | null>(null);
  const [statusTimestamp, setStatusTimestamp] = useState<string>('');
  const [statusStartDate, setStatusStartDate] = useState('');
  const [statusEndDate, setStatusEndDate] = useState('');
  const [statusHistory, setStatusHistory] = useState<Array<{
    status_type: string;
    start_date: string;
    end_date: string;
  }>>([]);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (insertCustomerId || error) {
      setIsModalOpen(true);
    }
  }, [insertCustomerId, error]);

  const handleStatusTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatusType = e.target.value;
    setStatusType(newStatusType);
    setStatusStartDate('');
    setStatusEndDate('');
  };
  const handleRemoveStatus = (index: number) => {
    setStatusHistory(statusHistory.filter((_, i) => i !== index));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customerId = uuidv4();
      const customerData: Partial<CustomerData> = {
        customer_id: customerId,
        customer_name: customerName,
        phone_number: phoneNumber,
        cid: CID,
        contract_id: contractID,
        address: Address,
        activation_date: activationDate,
        ip_type: ipType,
        service_id: parseInt(selectedServiceId),
        package_id: parseInt(selectedPackageId),
        location_id: parseInt(selectedLocationId),
        status_type: statusType,
        sale_name: salesName,
        status: 'Pending Technical Review',
      };

      // Add timestamp fields only if they have a value
      if (statusType === 'ACTIVE' && statusTimestamp) customerData.active_timestamp = statusTimestamp;
      if (statusType === 'INACTIVE' && statusTimestamp) customerData.inactive_timestamp = statusTimestamp;
      if (statusType === 'REACTIVE' && statusTimestamp) customerData.reactive_timestamp = statusTimestamp;
      if (statusType === 'TERMINATE' && statusTimestamp) customerData.terminate_timestamp = statusTimestamp;

      // Insert into Customer table
      const { data: customerInsertData, error: customerInsertError } = await supabase
        .from('Customer')
        .insert([customerData]);

      if (customerInsertError) throw new Error(customerInsertError.message);

      // Insert into StatusHistory table only if both status_type and start_date are provided
      if (statusType && statusStartDate) {
        const statusHistoryData = {
          customer_id: customerId,
          status_type: statusType,
          start_date: statusStartDate,
          end_date: statusEndDate || null
        };

        const { data: statusHistoryInsertData, error: statusHistoryInsertError } = await supabase
          .from('statushistory')
          .insert([statusHistoryData]);

        if (statusHistoryInsertError) throw new Error(statusHistoryInsertError.message);
      }

      setInsertedCustomerId(customerId);
      router.push(`/dashboard`);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred.");
      }
    }
  };

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data, error } = await supabase
          .from('Service')
          .select('*');
        if (error) throw new Error(error.message);
        setServices(data as Service[] || []);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred.");
        }
      }
    };

    const fetchPackage = async () => {
      try {
        const { data, error } = await supabase
          .from('Package')
          .select('*');
        if (error) throw new Error(error.message);
        setPackages(data as Package[] || []);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred.");
        }
      }
    };

    const fetchLocation = async () => {
      try {
        const { data, error } = await supabase
          .from('Location')
          .select('*');
        if (error) throw new Error(error.message);
        setLocations(data as Location[] || []);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred.");
        }
      }
    };

    fetchService();
    fetchPackage();
    fetchLocation();
  }, []);

  const filteredPackagesByService = packages.filter(pkg => pkg.service_id === parseInt(selectedServiceId));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen dark:bg-gray-200">
      <div className="font-raleway-black w-full max-w-4xl p-5">
        {error && <p className="text-red-500">{error}</p>}
        <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
          <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
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
              <label className="block">Contract ID:</label>
              <input
                type="text"
                value={contractID}
                onChange={(e) => setContractID(e.target.value)}
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
            <div>
              <label className="block">IP Type:</label>
              <input
                type="text"
                value={ipType}
                onChange={(e) => setipType(e.target.value)}
                className="block w-full border rounded p-2 mb-2"
              />
            </div>
            <div>
              <label htmlFor="locationName" className="block mb-2">Location Name:</label>
              <select
                id="locationName"
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
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
          </div>
          <div className="w-full lg:w-1/2 p-2">
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
              {filteredPackagesByService.map((pkg) => (
                <option key={pkg.package_id} value={pkg.package_id}>
                  {pkg.package_name}
                </option>
              ))}
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
            <label htmlFor="statusType" className="block mb-1">
                Status Type:
              </label>
              <select
                id="statusType"
                value={statusType || ''}
                onChange={handleStatusTypeChange}
                required
                className="font-raleway-black w-full p-2 border mb-2"
              >
                <option value="">Select Status Type...</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="REACTIVE">Reactive</option>
                <option value="TERMINATE">Terminate</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              {statusType && (
                <>
                  <div>
                    <label htmlFor="statusStartDate" className="block mb-1">
                      Start Date:
                    </label>
                    <input
                      type="datetime-local"
                      id="statusStartDate"
                      value={statusStartDate}
                      onChange={(e) => setStatusStartDate(e.target.value)}
                      required
                      className="font-raleway-black w-full p-2 border mb-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="statusEndDate" className="block mb-1">
                      End Date (optional):
                    </label>
                    <input
                      type="datetime-local"
                      id="statusEndDate"
                      value={statusEndDate}
                      onChange={(e) => setStatusEndDate(e.target.value)}
                      className="font-raleway-black w-full p-2 border mb-2"
                    />
                  </div>
                </>
              )}
              {/* <div>
                <label className="block">Sale Name:</label>
                <input
                  type="text"
                  value={salesName}
                  onChange={(e) => setsalesName(e.target.value)}
                  className="block w-full border rounded p-2 mb-2"
                />
            </div> */}
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