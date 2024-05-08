"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
interface OLT {
    olt_id: number;
    olt_name: string;
}
export default function viewCustomer() {
    const [customers, setCustomers] = useState([]);
    const router = useRouter();
    const { customer_id } = useParams();

    useEffect(() => {
        async function fetchCustomers() {
            try {
                console.log('Fetching customers...');
                if (!customer_id) {
                    console.log('No customer_id parameter found in the query.');
                    return;
                }
        
                const { data: customersData, error } = await supabase
                    .from('Customer')
                    .select('*')
                    .eq('customer_id', customer_id)
        
                if (error) {
                    throw error;
                }
                const packageIds = customersData.map((customer) => customer.package_id);

                // Fetch package names based on package_ids
                const { data: packagesData, error: packageError } = await supabase
                    .from('Package')
                    .select('package_id, package_name')
                    .in('package_id', packageIds);

                if (packageError) {
                    throw packageError;
                }

                // Map package_ids to package_names
                const packageMap = {};
                packagesData.forEach((pkg) => {
                    packageMap[pkg.package_id] = pkg.package_name;
                });

                // Combine customer data with package_names
                const customersWithPackages = customersData.map((customer) => ({
                    ...customer,
                    package_name: packageMap[customer.package_id] || 'Unknown Package',
                }));

                // Update the state with customers including package names
                setCustomers(customersWithPackages);

                const deviceIds = customersData.map((customer) => customer.device_id);

                // Fetch device names based on device_ids
                const { data: devicesData, error: deviceError } = await supabase
                    .from('Device')
                    .select('device_id, device_name')
                    .in('device_id', deviceIds);

                if (deviceError) {
                    throw deviceError;
                }

                // Map device_ids to device_names
                const deviceMap = {};
                devicesData.forEach((dvc) => {
                    deviceMap[dvc.device_id] = dvc.device_name;
                });

                // Update the state with customers including device names
                const customersWithDevices = customersWithPackages.map((customer) => ({
                    ...customer,
                    device_name: deviceMap[customer.device_id] || 'Unknown Device',
                }));

                setCustomers(customersWithDevices);
                
                const serviceIds = customersData.map((customer) => customer.service_id);

                // Fetch service names based on service_ids
                const { data: servicesData, error: serviceError } = await supabase
                    .from('Service')
                    .select('service_id, service_name')
                    .in('service_id', serviceIds);

                if (serviceError) {
                    throw serviceError;
                }

                // Map service_ids to service_names
                const serviceMap = {};
                servicesData.forEach((service) => {
                    serviceMap[service.service_id] = service.service_name;
                });

                // Update the state with customers including service names
                const customersWithServices = customersWithDevices.map((customer) => ({
                    ...customer,
                    service_name: serviceMap[customer.service_id] || 'Unknown Service',
                }));

                setCustomers(customersWithServices);

                const locationIds = customersData.map((customer) => customer.location_id);

                // Fetch service names based on service_ids
                const { data: locationsData, error: locationError } = await supabase
                    .from('Location')
                    .select('location_id, location_name')
                    .in('location_id', locationIds);

                if (locationError) {
                    throw locationError;
                }

                // Map service_ids to service_names
                const locationMap = {};
                locationsData.forEach((location) => {
                    locationMap[location.location_id] = location.location_name;
                });

                // Update the state with customers including service names
                const customersWithLocations = customersWithServices.map((customer) => ({
                    ...customer,
                    location_name: locationMap[customer.location_id] || 'Unknown Service',
                }));

                setCustomers(customersWithLocations);

                const oltIds = customersData.map((customer) => customer.olt_id);

                // Fetch device names based on device_ids
                const { data: oltsData, error: oltError } = await supabase
                    .from<OLT>('OLT')
                    .select('olt_id, olt_name')
                    .in('olt_id', oltIds);

                if (oltError) {
                    throw oltError;
                }

                // Map device_ids to device_names
                const oltMap: Record<number, string> = {};
                oltsData.forEach((olt) => {
                    oltMap[olt.olt_id] = olt.olt_name;
                });

                // Update the state with customers including device names
                const customersWithOLTs = customersWithLocations.map((customer) => ({
                    ...customer,
                    olt_name: oltMap[customer.olt_id] || 'Unknown Device',
                }));
                setCustomers(customersWithOLTs); 

            } catch (error) {
                console.error('Error fetching data:', error.message);
            }
        }
      
        fetchCustomers();
    }, [customer_id]);

    if (customers.length === 0) {
        return <div>Loading...</div>;
    }
    
    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <div className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800 flex items-center">
                <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 ml-1 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700">
                    <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                    </svg>
                </button>
                <span>Customer Information List:</span>
            </div>
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">
                            Customer Information
                        </th>
                        <th scope="col" className="px-6 py-3">
                            {/* Add column header if needed */}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((customer) => (
                        <tr key={customer.customer_id} className="view-customer bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="px-6 py-4">
                                <div>
                                    <div className="flex mb-2 mt-5">
                                        <span className="username">{customer.customer_name}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2 dark:bg-gray-700 mr-2 mb-5 px-3 py-3">
                                        <span className="secondary-title">BASIC INFORMATION:</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">CID</span>
                                        <span>: {customer.cid}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Phone Number</span>
                                        <span>: {customer.phone_number}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Address</span>
                                        <span>: {customer.address}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Package</span>
                                        <span>: {customer.package_name}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Service</span>
                                        <span>: {customer.service_name}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Location</span>
                                        <span>: {customer.location_name}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Activation Date</span>
                                        <span>: {customer.activation_date}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Status</span>
                                        <span>: {customer.isActive ? 'Active' : 'Inactive'}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div>
                                    <div className="flex mb-2 dark:bg-gray-700 mr-2 mb-5 px-3 py-3">
                                        <span className="secondary-title">SERVICE INFORMATION:</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Longtitude</span>
                                        <span>: {customer.longtitude}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Latitude</span>
                                        <span>: {customer.langtitude}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Slot</span>
                                        <span>: {customer.slot}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Port</span>
                                        <span>: {customer.port}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">IP Address</span>
                                        <span>: {customer.ip_address}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">ONU ID</span>
                                        <span>: {customer.onu_id}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Service Port</span>
                                        <span>: {customer.service_port}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Camera IP</span>
                                        <span>: {customer.camera_ip}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Device name</span>
                                        <span>: {customer.device_name}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">OLT</span>
                                        <span>: {customer.olt_name}</span>
                                    </div>
                                    <br />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
