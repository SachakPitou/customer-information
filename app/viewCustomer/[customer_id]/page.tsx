"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function viewCustomer() {
    const [customers, setCustomers] = useState([]);
    const [editHistories, setEditHistories] = useState({});
    const [editHistoryVisible, setEditHistoryVisible] = useState({});
    const router = useRouter();
    const { customer_id } = useParams();

    useEffect(() => {
        async function fetchCustomers() {
            try {
                if (!customer_id) return;

                const { data: customersData, error: customerError } = await supabase
                    .from('Customer')
                    .select('*')
                    .eq('customer_id', customer_id);

                if (customerError) throw customerError;
                
                const packageIds = customersData.map((customer) => customer.package_id);
                const deviceIds = customersData.map((customer) => customer.device_id);
                const serviceIds = customersData.map((customer) => customer.service_id);
                const locationIds = customersData.map((customer) => customer.location_id);
                const interfaceIds = customersData.map((customer) => customer.interface_id);
                const deviceTypeIds = customersData.map((customer) => customer.device_type_id);
                // const oltIds = customersData.map((customer) => customer.olt_id);

                const [packagesData, devicesData, servicesData, locationsData, interfacesData, deviceTypesData, portDevicesData] = await Promise.all([
                    supabase.from('Package').select('package_id, package_name').in('package_id', packageIds),
                    supabase.from('Device').select('device_id, device_name').in('device_id', deviceIds),
                    supabase.from('Service').select('service_id, service_name').in('service_id', serviceIds),
                    supabase.from('Location').select('location_id, location_name').in('location_id', locationIds),
                    // supabase.from('OLT').select('olt_id, olt_name').in('olt_id', oltIds),
                    supabase.from('Interface').select('interface_id, interface_name').in('interface_id', interfaceIds),
                    supabase.from('Device Type').select('device_type_id, device_type').in('device_type_id', deviceTypeIds),
                    supabase.from('PortDevice').select('*').in('interface_id', interfaceIds),
                ]);

                const packageMap = Object.fromEntries(packagesData.data.map(pkg => [pkg.package_id, pkg.package_name]));
                const deviceMap = Object.fromEntries(devicesData.data.map(dev => [dev.device_id, dev.device_name]));
                const serviceMap = Object.fromEntries(servicesData.data.map(srv => [srv.service_id, srv.service_name]));
                const locationMap = Object.fromEntries(locationsData.data.map(loc => [loc.location_id, loc.location_name]));
                const deviceTypeMap = Object.fromEntries(deviceTypesData.data.map(dvct => [dvct.device_type_id, dvct.device_type]));
                const interfaceMap = Object.fromEntries(interfacesData.data.map(inte => [
                    inte.interface_id, 
                    {
                        interface_name: inte.interface_name,
                        port_number: portDevicesData.data.find(pd => pd.interface_id === inte.interface_id)?.port_number
                    }
                ]));
                // const oltMap = Object.fromEntries(oltsData.data.map(olt => [olt.olt_id, olt.olt_name]));

                const customersWithDetails = customersData.map(customer => ({
                    ...customer,
                    package_name: packageMap[customer.package_id] || 'Unknown Package',
                    device_name: deviceMap[customer.device_id] || 'Unknown Device',
                    service_name: serviceMap[customer.service_id] || 'Unknown Service',
                    location_name: locationMap[customer.location_id] || 'Unknown Location',
                    interface_info: interfaceMap[customer.interface_id] 
                    ? `Port Number ${interfaceMap[customer.interface_id].port_number} = ${interfaceMap[customer.interface_id].interface_name}` 
                    : 'Unknown Interface',
                    device_type: deviceTypeMap[customer.device_type_id] || 'Unknown Device Type',
                    // olt_name: oltMap[customer.olt_id] || 'Unknown OLT',
                }));

                setCustomers(customersWithDetails);
            } catch (error) {
                console.error('Error fetching data:', error.message);
            }
        }

        fetchCustomers();
    }, [customer_id]);

    const handleFetchHistory = async (customerId) => {
        try {
            const { data: historyData, error: historyError } = await supabase
                .from('CustomerHistory')
                .select('*')
                .eq('customer_id', customerId);
    
            if (historyError) throw historyError;
    
            // Collect all the IDs that need to be fetched
            const locationIds = historyData.flatMap(history => 
                history.field_changed === 'location_id' ? [history.old_value, history.new_value] : []
            );
            const oltIds = historyData.flatMap(history => 
                history.field_changed === 'olt_id' ? [history.old_value, history.new_value] : []
            );
            const deviceIds = historyData.flatMap(history => 
                history.field_changed === 'device_id' ? [history.old_value, history.new_value] : []
            );
            const serviceIds = historyData.flatMap(history => 
                history.field_changed === 'service_id' ? [history.old_value, history.new_value] : []
            );
            const packageIds = historyData.flatMap(history => 
                history.field_changed === 'package_id' ? [history.old_value, history.new_value] : []
            );
            const interfaceIds = historyData.flatMap(history => 
                history.field_changed === 'interface_id' ? [history.old_value, history.new_value] : []
            );
    
            // Fetch details for all relevant entities
            const [locationsData, oltsData, devicesData, servicesData, packagesData, interfacesData] = await Promise.all([
                supabase.from('Location').select('location_id, location_name').in('location_id', locationIds),
                supabase.from('OLT').select('olt_id, olt_name').in('olt_id', oltIds),
                supabase.from('Device').select('device_id, device_name').in('device_id', deviceIds),
                supabase.from('Service').select('service_id, service_name').in('service_id', serviceIds),
                supabase.from('Package').select('package_id, package_name').in('package_id', packageIds),
                supabase.from('Interface').select('interface_id, interface_name').in('interface_id', interfaceIds),
            ]);
    
            // Create maps for easy lookup
            const locationMap = Object.fromEntries(locationsData.data.map(loc => [loc.location_id, loc.location_name]));
            const oltMap = Object.fromEntries(oltsData.data.map(olt => [olt.olt_id, olt.olt_name]));
            const deviceMap = Object.fromEntries(devicesData.data.map(dev => [dev.device_id, dev.device_name]));
            const serviceMap = Object.fromEntries(servicesData.data.map(srv => [srv.service_id, srv.service_name]));
            const packageMap = Object.fromEntries(packagesData.data.map(pkg => [pkg.package_id, pkg.package_name]));
            const interfaceMap = Object.fromEntries(interfacesData.data.map(inte => [inte.interface_id, inte.interface_name]));
    
            const historyWithDetails = historyData.map(history => {
                let changeDescription;
    
                // Generate change descriptions based on the field changed
                if (history.field_changed === 'location_id') {
                    const oldLocationName = locationMap[history.old_value] || 'Unknown Location';
                    const newLocationName = locationMap[history.new_value] || 'Unknown Location';
                    changeDescription = `Location changed from "${oldLocationName}" to "${newLocationName}"`;
                } else if (history.field_changed === 'olt_id') {
                    const oldOltName = oltMap[history.old_value] || 'Unknown OLT';
                    const newOltName = oltMap[history.new_value] || 'Unknown OLT';
                    changeDescription = `OLT changed from "${oldOltName}" to "${newOltName}"`;
                } else if (history.field_changed === 'device_id') {
                    const oldDeviceName = deviceMap[history.old_value] || 'Unknown Device';
                    const newDeviceName = deviceMap[history.new_value] || 'Unknown Device';
                    changeDescription = `Device changed from "${oldDeviceName}" to "${newDeviceName}"`;
                } else if (history.field_changed === 'service_id') {
                    const oldServiceName = serviceMap[history.old_value] || 'Unknown Service';
                    const newServiceName = serviceMap[history.new_value] || 'Unknown Service';
                    changeDescription = `Service changed from "${oldServiceName}" to "${newServiceName}"`;
                } else if (history.field_changed === 'package_id') {
                    const oldPackageName = packageMap[history.old_value] || 'Unknown Package';
                    const newPackageName = packageMap[history.new_value] || 'Unknown Package';
                    changeDescription = `Package changed from "${oldPackageName}" to "${newPackageName}"`;
                } else if (history.field_changed === 'interface_id') {
                    const oldInterfaceName = interfaceMap[history.old_value] || 'Unknown Interface';
                    const newInterfaceName = interfaceMap[history.new_value] || 'Unknown Interface';
                    changeDescription = `Interface changed from "${oldInterfaceName}" to "${newInterfaceName}"`;
                } else if (history.field_changed === 'isActive') {
                    const oldStatusName = history.old_value === "true" ? "Active" : "Inactive";
                    const newStatusName = history.new_value === "true" ? "Active" : "Inactive";
                    changeDescription = `Status changed from "${oldStatusName}" to "${newStatusName}"`;
                } else {
                    changeDescription = `${history.field_changed} changed from "${history.old_value}" to "${history.new_value}"`;
                }
    
                return {
                    ...history,
                    changeDescription,
                };
            });
    
            setEditHistories((prevHistories) => ({
                ...prevHistories,
                [customerId]: historyWithDetails,
            }));
    
            setEditHistoryVisible((prevVisible) => ({
                ...prevVisible,
                [customerId]: !prevVisible[customerId],
            }));
        } catch (error) {
            console.error('Error fetching edit history:', error.message);
        }
    };
    
    
    

    if (customers.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <div className="relative overflow-x-auto shadow-md">
            <div className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800 flex items-center">
                <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 ml-1 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700">
                    <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                    </svg>
                </button>
                <span>Customer Information List:</span>
            </div>
            <table className="w-full text-sm text-left rtl:text-right text-black-500 dark:text-black-400">
                <thead className="text-xs text-white uppercase bg-gray-50 dark:bg-gray-700 dark:text-white">
                    <tr>
                        <th scope="col" className="px-6 py-3">
                            Customer Information
                        </th>
                        <th scope="col" className="px-6 py-3">
                            {/* Add column header if needed */}
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Edit History
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((customer) => (
                        <tr key={customer.customer_id} className="view-customer bg-white border-b dark:bg-gray-300 dark:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-400">
                            <td className="px-6 py-4">
                                <div>
                                    <div className="flex mb-2 mt-5">
                                        <span className="username">{customer.customer_name}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2 dark:bg-gray-400 dark:hover:bg-gray-200 mr-2 mb-5 px-3 py-3">
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
                                <div className="flex mb-2 dark:bg-gray-400 dark:hover:bg-gray-200 mr-2 mb-5 px-3 py-3">
                                    <span className="secondary-title">SERVICE INFORMATION:</span>
                                </div>
                                <br />
                                <div className="flex mb-2">
                                    <span className="font-semibold mr-2 w-40">Device Name</span>
                                    <span>: {customer.device_name}</span>
                                </div>
                                <br />
                                <div className="flex mb-2">
                                    <span className="font-semibold mr-2 w-40">Device Type</span>
                                    <span>: {customer.device_type}</span>
                                </div>
                                <br />
                                {customer.device_type_id !== 3 && (
                                    <>
                                        <div className="flex mb-2">
                                            <span className="font-semibold mr-2 w-40">Interface Name:</span>
                                            <span>: {customer.interface_info}</span>
                                        </div>
                                        <br />
                                    </>
                                )}
                                
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
                                    <span className="font-semibold mr-2 w-40">VLAN</span>
                                    <span>: {customer.VLan}</span>
                                </div>
                                <br />
                                {customer.device_type_id === 1 || customer.device_type_id === 2 ? (
                                    <>
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Switch Port</span>
                                        <span>: {customer.switch_port}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Description</span>
                                        <span>: {customer.description}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Port Type</span>
                                        <span>: {customer.port_type}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">ACL</span>
                                        <span>: {customer.ACL}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">IP Address</span>
                                        <span>: {customer.ip_address}</span>
                                    </div>
                                    <br />
                                    </>
                                ) : customer.device_type_id === 3 ? (
                                    <>
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">Frame</span>
                                        <span>: {customer.frame}</span>
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
                                        <span className="font-semibold mr-2 w-40">ONU ID</span>
                                        <span>: {customer.onu_id}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">ONU MAC Address</span>
                                        <span>: {customer.ONU_mac_address}</span>
                                    </div>
                                    <br />
                                    <div className="flex mb-2">
                                        <span className="font-semibold mr-2 w-40">ONT ID</span>
                                        <span>: {customer.ont_id}</span>
                                    </div>
                                    </>
                                ) : null}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => handleFetchHistory(customer.customer_id)}
                                    className="px-4 py-2 bg-red-700 text-white rounded"
                                >
                                    View Edit History
                                </button>
                                {editHistoryVisible[customer.customer_id] && (
                                    <div className="mt-4">
                                        {editHistories[customer.customer_id]?.map((history) => (
                                            <div key={history.id} className="p-2 border-b border-white">
                                                <div>
                                                   <strong>Edit Date:</strong> {new Date(history.timestamp.replace(',', '')).toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}
                                                </div>
                                                <div>
                                                    <strong>Changes:</strong> {history.changeDescription}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
