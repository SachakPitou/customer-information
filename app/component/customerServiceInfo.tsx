"use client";
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';
import React, { useEffect, useState } from 'react';

// Define types for your data structures
type Customer = {
  status_type: string | null;
  customer_id: string;
  customer_name: string;
  phone_number: string;
  cid: string;
  address: string;
  longtitude: string;
  langtitude: string;
  activation_date: string;
  isActive: boolean;
  service_id: string;
  package_id: string;
  location_id: string;
  status: string;
  active_timestamp?: string;
  inactive_timestamp?: string;
  reactive_timestamp?: string;
  terminate_timestamp?: string;
};
type StatusHistory = {
  id: number;
  customer_id: string;
  status_type: string;
  start_date: string;
  end_date: string | null;
};
type Service = {
  service_id: string;
  service_name: string;
};

type Package = {
  package_id: string;
  package_name: string;
};

type Location = {
  location_id: string;
  location_name: string;
};

// Define props for the component
interface CustomerServiceInfoFormProps {
  customerId: string;
}

export default function CustomerServiceInfoForm({ customerId }: CustomerServiceInfoFormProps) {
  const [customer, setCustomer] = useState<Customer>({
    customer_id: '',
    customer_name: '',
    phone_number: '',
    cid: '',
    address: '',
    longtitude: '',
    langtitude: '',
    activation_date: '',
    isActive: true,
    service_id: '',
    package_id: '',
    location_id: '',
    status: '',
    status_type: '',
    active_timestamp: '',
    inactive_timestamp: '',
    reactive_timestamp: '',
    terminate_timestamp: '',

  });
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data, error } = await supabase.from('Service').select('*');
        if (error) throw new Error(error.message);
        setServices(data || []);
      } catch (error) {
        console.error('Error fetching service:', error instanceof Error ? error.message : String(error));
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    };

    const fetchPackage = async () => {
      try {
        const { data, error } = await supabase.from('Package').select('*');
        if (error) throw new Error(error.message);
        setPackages(data || []);
      } catch (error) {
        console.error('Error fetching package:', error instanceof Error ? error.message : String(error));
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    };

    const fetchLocation = async () => {
      try {
        const { data, error } = await supabase.from('Location').select('*');
        if (error) throw new Error(error.message);
        setLocations(data || []);
      } catch (error) {
        console.error('Error fetching location:', error instanceof Error ? error.message : String(error));
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    };

    const fetchCustomer = async () => {
      try {
        const { data, error } = await supabase
          .from('Customer')
          .select('*')
          .eq('customer_id', customerId)
          .single();

        if (error) throw error;

        setCustomer(data || {} as Customer);
      } catch (error) {
        console.error('Error fetching customer data:', error instanceof Error ? error.message : String(error));
      }
    };
    const fetchStatusHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('statushistory')
          .select('*')
          .eq('customer_id', customerId)
          .order('start_date', { ascending: false });

        if (error) throw error;

        setStatusHistory(data || []);
      } catch (error) {
        console.error('Error fetching status history:', error instanceof Error ? error.message : String(error));
      }
    };
    if (customerId) {
      fetchCustomer();
      fetchPackage();
      fetchService();
      fetchLocation();
      fetchStatusHistory();
    }
  }, [customerId]);
  const getCurrentStatusDates = () => {
    const currentStatus = statusHistory.find(status => status.status_type === customer.status_type);
    return currentStatus ? {
      start_date: currentStatus.start_date,
      end_date: currentStatus.end_date
    } : null;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`${customerId}/technical/`);
  };

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
        <span>New Customer: </span>
        <form onSubmit={handleSubmit} className="flex flex-wrap justify-between mt-10">
          <div className="w-full lg:w-1/2 p-2">
            <div>
              <label className="block">Customer Name:</label>
              <input
                type="text"
                value={customer.customer_name}
                readOnly={true}
                className="block w-full border rounded p-2 mb-2"
              />
            </div>
            <div>
              <label className="block">Phone Number:</label>
              <input
                type="text"
                value={customer.phone_number}
                readOnly={true}
                className="block w-full border rounded p-2 mb-2"
              />
            </div>
            <div>
              <label className="block">CID:</label>
              <input
                type="text"
                value={customer.cid}
                readOnly={true}
                className="block w-full border rounded p-2 mb-2"
              />
            </div>
            <div>
              <label className="block">Address:</label>
              <input
                type="text"
                value={customer.address}
                readOnly={true}
                className="block w-full border rounded p-2 mb-2"
              />
            </div>
            <div>
              <label htmlFor="serviceName" className="block">
                Location Name:
              </label>
              <select
                id="locationName"
                value={customer.location_id}
                disabled
                className="font-raleway-black w-full p-2 border mb-3"
              >
                {/* Render options based on fetched services */}
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
              value={customer.service_id}
              disabled
              className="font-raleway-black w-full p-2 border mb-3"
            >
              {/* Render options based on fetched services */}
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
              value={customer.package_id}
              disabled
              className="font-raleway-black w-full p-2 border mb-3"
            >
              {/* Render options based on fetched packages */}
              {packages.map((pkg) => (
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
              value={customer.status_type || ''}
              disabled
              className="font-raleway-black w-full p-2 border mb-3"
            >
              <option value="">Select Status...</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="REACTIVE">Reactive</option>
              <option value="TERMINATE">Terminate</option>
            </select>
            {customer.status_type && (
              <>
                <label htmlFor="statusStartDate" className="block">
                  Status Start Date:
                </label>
                <input
                  type="text"
                  id="statusStartDate"
                  value={formatDate(getCurrentStatusDates()?.start_date || null)}
                  disabled
                  className="font-raleway-black w-full p-2 border mb-3"
                />
                <label htmlFor="statusEndDate" className="block">
                  Status End Date:
                </label>
                <input
                  type="text"
                  id="statusEndDate"
                  value={getCurrentStatusDates()?.end_date ? formatDate(getCurrentStatusDates()?.end_date || null) : 'Current'}
                  disabled
                  className="font-raleway-black w-full p-2 border mb-3"
                />
              </>
            )}
          </div>
          <div className="w-full p-2 text-center">
            <button
              type="submit"
              className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600"
              // Disable the button to prevent form submission
            >
              Technical Info
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
}