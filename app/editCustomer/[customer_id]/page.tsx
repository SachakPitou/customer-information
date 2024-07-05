"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import PopUpModal from '@/app/component/popUpmodal';

export default function Page() {
    const router = useRouter();
    const [userType, setUserType] = useState('');
    const [session, setSession] = useState('null');
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
        interface_id: '',
        device_type_id: '',
        olt_id: '',
        isActive: '',
        description: '',
        ACL: '',
        VLan: '',
        port_type: '',
        switch_port: '',
    });
    const [services, setServices] = useState([]);
    const [packages, setPackages] = useState([]);
    const [locations, setLocations] = useState([]);
    const [devices, setDevices] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [interfaces, setInterfaces] = useState([]);
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
        const fetchDeviceType = async () => {
          try {
              const { data, error } = await supabase.from('Device Type').select('*');
              if (error) throw new Error(error.message);
              setDeviceTypes(data);
          } catch (error) {
              console.error('Error fetching device types:', error.message);
              setError(error.message);
          }
        };
        const fetchInterface = async () => {
          try {
            const { data: interfaceData, error: interfaceError } = await supabase.from('Interface').select('*');
            if (interfaceError) throw new Error(interfaceError.message);
    
            const { data: portDeviceData, error: portDeviceError } = await supabase.from('PortDevice').select('*');
            if (portDeviceError) throw new Error(portDeviceError.message);
    
            // Joining Interface data with PortDevice data based on interface_id
            const combinedData = interfaceData.map(interfaceItem => {
              const portDeviceItem = portDeviceData.find(pd => pd.interface_id === interfaceItem.interface_id);
              return {
                ...interfaceItem,
                portDevice: portDeviceItem
              };
            });
    
            setInterfaces(combinedData);
          } catch (error) {
            console.error('Error fetching interfaces:', error.message);
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
        const fetchUserType = async () => {
            try {
                const supabase = createClient();
                const { data, error } = await supabase.auth.getSession(); // Get session data

                if (error) {
                    console.error('Error fetching session:', error.message);
                    return;
                }

                const session = data.session;
                setSession(session); // Set session state

                if (session) {
                    const userId = session.user.id; // Extract user ID from session
                    const { data: userData, error: userError } = await supabase
                        .from('userAccount')
                        .select('user_type')
                        .eq("id", userId)
                        .single();

                    if (userError) {
                        throw userError;
                    }

                    if (userData) {
                        setUserType(userData.user_type); // Set user type state
                    }
                }
            } catch (error) {
                console.error('Error fetching user type:', error.message);
            }
        };

        fetchCustomer();
        fetchDevice();
        fetchLocation();
        fetchPackage();
        fetchService();
        fetchOLT();
        fetchUserType();
        fetchInterface();
        fetchDeviceType();
    }, [customer_id]);
    
    const handleEditCustomer = async (e) => {
        e.preventDefault();
        try {
            // Fetch the current customer data to capture the old values
            const { data: currentCustomerData, error: fetchError } = await supabase
                .from('Customer')
                .select('*')
                .eq('customer_id', customer_id)
                .single();

            if (fetchError) throw new Error(fetchError.message);

            // Create a list of fields to check for changes
            const fieldsToCheck = [
                'customer_name', 'phone_number', 'cid', 'address', 'longtitude', 'langtitude',
                'ONU_mac_address', 'slot', 'port', 'service_port', 'onu_id', 'camera_ip',
                'ip_address', 'activation_date', 'device_id', 'service_id', 'package_id',
                'location_id', 'olt_id', 'isActive', 'interface_id', 'switch_port', 'port_type',
                'ACL', 'VLan', 'description',
            ];

            // Check for changes and prepare history records
            const historyRecords = fieldsToCheck.map(field => {
                if (currentCustomerData[field] !== customer[field]) {
                    return {
                        customer_id: customer.customer_id,
                        field_changed: field,
                        old_value: currentCustomerData[field],
                        new_value: customer[field],
                        timestamp: new Date()
                    };
                }
                return null;
            }).filter(record => record !== null); // Remove null values

            // Insert the change records into CustomerHistory
            if (historyRecords.length > 0) {
                const { error: historyError } = await supabase
                    .from('CustomerHistory')
                    .insert(historyRecords);
                if (historyError) throw new Error(historyError.message);
            }

            // Update the customer data in the Customer table
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
                    isActive: customer.isActive,
                    activation_date: customer.activation_date,
                    switch_port: customer.switch_port,
                    port_type: customer.port_type,
                    ACL: customer.ACL,
                    VLan: customer.VLan,
                    description: customer.description,
                    device_id: customer.device_id ? parseInt(customer.device_id) : null,
                    service_id: customer.service_id ? parseInt(customer.service_id) : null,
                    package_id: customer.package_id ? parseInt(customer.package_id) : null,
                    location_id: customer.location_id ? parseInt(customer.location_id) : null,
                    interface_id: customer.interface_id ? parseInt(customer.interface_id) : null,
                    olt_id: customer.olt_id ? parseInt(customer.olt_id) : null,
                })
                .eq('customer_id', customer_id);
            if (error) throw new Error(error.message);

            setIsModalOpen(true);
            console.log('Customer updated successfully');
        } catch (error) {
            console.error('Error updating customer:', error.message);
            setError(error.message);
        }
    };
    const handleDeviceChange = async (deviceId) => {
      try {
        // Fetch device details based on deviceId from your 'Device' table
        const { data: device, error } = await supabase
          .from('Device')
          .select('device_type_id')
          .eq('device_id', deviceId)
          .single(); // Assuming device_id uniquely identifies a device

        if (error) {
          throw new Error(error.message);
        }

        setCustomer(prevCustomer => ({
          ...prevCustomer,
          device_id: deviceId,
          device_type_id: device.device_type_id // Assuming device_type_id is fetched from Device table
          // Update other fields as needed
        }));
      } catch (error) {
        console.error('Error fetching device details:', error.message);
      }
    };



  const filteredInterfaces = interfaces.filter((inf) => inf.device_id === parseInt(customer.device_id, 10));
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
          {userType !== "technical" && (
            <><div className="w-full lg:w-1/2 p-2">
              <label htmlFor="customerName" className="block mb-2">Customer Name:</label>
              <input
                type="text"
                id="customerName"
                placeholder="Enter customer name"
                value={customer.customer_name}
                onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })}
                required
                className="font-raleway-black w-full p-2 border" />
              <label htmlFor="phoneNumber" className="block mb-2 mt-4">Phone Number:</label>
              <input
                type="text"
                id="phoneNumber"
                placeholder="Enter Phone Number"
                value={customer.phone_number}
                onChange={(e) => setCustomer({ ...customer, phone_number: e.target.value })}
                required
                className="font-raleway-black w-full p-2 border" />
              <label htmlFor="CID" className="block mb-2">CID:</label>
              <input
                type="text"
                id="CID"
                placeholder="Enter CID"
                value={customer.cid}
                onChange={(e) => setCustomer({ ...customer, cid: e.target.value })}
                required
                className="font-raleway-black w-full p-2 border" />
              <label htmlFor="activationDate" className="block mb-2 mt-4">Activation Date:</label>
              <input
                type="date"
                id="activationDate"
                value={customer.activation_date}
                onChange={(e) => setCustomer({ ...customer, activation_date: e.target.value })}
                required
                className="font-raleway-black w-full p-2 border" />
            </div><div className="w-full lg:w-1/2 p-2">
                <label htmlFor="packageName" className="block mb-2">Package Name:</label>
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
                <label htmlFor="Address" className="block mb-2 mt-4">Address:</label>
                <input
                  type="text"
                  id="Address"
                  placeholder="Enter Address"
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  required
                  className="font-raleway-black w-full p-2 border" />
                <label htmlFor="serviceName" className="block mb-2 mt-2">Service Name:</label>
                <select
                  id="serviceName"
                  value={customer.service_id}
                  onChange={(e) => setCustomer({ ...customer, service_id: e.target.value })}
                  required
                  className="font-raleway-black w-full p-2 border mb-2"
                >
                  <option value="">Select Service...</option>
                  {services.map((service) => (
                    <option key={service.service_id} value={service.service_id}>
                      {service.service_name}
                    </option>
                  ))}
                </select>
                <label htmlFor="status" className="block mt-4">
                  Status:
                </label>
                <select
                  id="isActive"
                  value={customer.isActive ? 'true' : 'false'}
                  onChange={(e) => setCustomer({ ...customer, isActive: e.target.value === 'true' })}
                  className="font-raleway-black w-full p-2 border mb-3"
                >
                  <option value="">Select Status...</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div></>
          )}
          {userType !== "customer_service" && (
            <>
              <div className="w-full lg:w-1/2 p-2">
                {/* Conditional Fields based on device_type_id */}
                

                

                {/* Location Name */}
                <label htmlFor="langtitudes" className="block mb-2 mt-4">Langtitude:</label>
                <input
                  type="text"
                  id="langtitudes"
                  placeholder="Enter Langtitude"
                  value={customer.langtitude}
                  onChange={(e) => setCustomer({ ...customer, langtitude: e.target.value })}
                  required
                  className="font-raleway-black w-full p-2 border"
                />

                {/* Longtitude */}
                <label htmlFor="longtitudes" className="block mb-2 mt-4">Longtitude:</label>
                <input
                  type="text"
                  id="longtitudes"
                  placeholder="Enter Longtitude"
                  value={customer.longtitude}
                  onChange={(e) => setCustomer({ ...customer, longtitude: e.target.value })}
                  required
                  className="font-raleway-black w-full p-2 border"
                />
                {(customer.device_type_id === 1 || customer.device_type_id === 2) && (
                  <>
                    {/* Switch Port */}
                    <label htmlFor="switchPort" className="block mb-2 mt-4">Switch Port:</label>
                    <input
                      type="text"
                      id="switchPort"
                      placeholder="Enter Switch Port"
                      value={customer.switch_port}
                      onChange={(e) => setCustomer({ ...customer, switch_port: e.target.value })}
                      required
                      className="font-raleway-black w-full p-2 border"
                    />

                    {/* Port Type */}
                    <label htmlFor="portType" className="block mb-2 mt-4">Port Type:</label>
                    <input
                      type="text"
                      id="portType"
                      placeholder="Enter Port Type"
                      value={customer.port_type}
                      onChange={(e) => setCustomer({ ...customer, port_type: e.target.value })}
                      required
                      className="font-raleway-black w-full p-2 border"
                    />

                    {/* Description */}
                    <label htmlFor="description" className="block mb-2 mt-4">Description:</label>
                    <input
                      type="text"
                      id="description"
                      placeholder="Enter Description"
                      value={customer.description}
                      onChange={(e) => setCustomer({ ...customer, description: e.target.value })}
                      required
                      className="font-raleway-black w-full p-2 border"
                    />
                    
                    {/* ACL */}
                  </>
                )}
                {customer.device_type_id === 3 && (
                  <>
                    {/* Port */}
                    <label htmlFor="port" className="block mb-2 mt-4">Port:</label>
                    <input
                      type="text"
                      id="port"
                      placeholder="Enter Port"
                      value={customer.port}
                      onChange={(e) => setCustomer({ ...customer, port: e.target.value })}
                      required
                      className="font-raleway-black w-full p-2 border"
                    />

                    {/* Slot */}
                    <label htmlFor="slot" className="block mb-2 mt-4">Slot:</label>
                    <input
                      type="text"
                      id="slot"
                      placeholder="Enter Slot"
                      value={customer.slot}
                      onChange={(e) => setCustomer({ ...customer, slot: e.target.value })}
                      required
                      className="font-raleway-black w-full p-2 border"
                    />

                    {/* Service Port */}
                    <label htmlFor="servicePort" className="block mb-2 mt-4">Service Port:</label>
                    <input
                      type="text"
                      id="servicePort"
                      placeholder="Enter Service Port"
                      value={customer.service_port}
                      onChange={(e) => setCustomer({ ...customer, service_port: e.target.value })}
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
                    {/* ONU Mac Address */}
                  </>
                )}
              </div>

              <div className="w-full lg:w-1/2 p-2">
                {/* Langtitude */}
                <label htmlFor="locationName" className="block mb-2 mt-4">Location Name:</label>
                <select
                  id="locationName"
                  value={customer.location_id}
                  onChange={(e) => setCustomer({ ...customer, location_id: e.target.value })}
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
                <label htmlFor="deviceName" className="block mb-2 mt-4">Device Name:</label>
                <select
                  id="deviceName"
                  value={customer.device_id}
                  onChange={(e) => handleDeviceChange(e.target.value)}
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
                <label htmlFor="interfaceName" className="block mb-2 mt-4">Interface Name:</label>
                <select
                  id="interfaceName"
                  value={customer.interface_id}
                  onChange={(e) => setCustomer({ ...customer, interface_id: e.target.value })}
                  required
                  className="font-raleway-black w-full p-2 border"
                >
                  <option value="">Select Interface...</option>
                  {filteredInterfaces.map((inf) => (
                      <option key={inf.interface_id} value={inf.interface_id}>
                        Port {inf.portDevice.port_number}: {inf.interface_name}
                      </option>
                  ))}
                </select>
                <label htmlFor="VLan" className="block mb-2 mt-4">VLan:</label>
                    <input
                      type="text"
                      id="VLan"
                      placeholder="Enter VLan"
                      value={customer.VLan}
                      onChange={(e) => setCustomer({ ...customer, VLan: e.target.value })}
                      className="font-raleway-black w-full p-2 border"
                    />
                {customer.device_type_id === 3 && (
                  <>
   
                    {/* ONU Mac Address */}
                    <label htmlFor="onuMacAddress" className="block mb-2 mt-4">ONU Mac Address:</label>
                    <input
                      type="text"
                      id="onuMacAddress"
                      placeholder="Enter ONU Mac Address"
                      value={customer.ONU_mac_address}
                      onChange={(e) => setCustomer({ ...customer, ONU_mac_address: e.target.value })}
                      required
                      className="font-raleway-black w-full p-2 border"
                    />

                    {/* ONU ID */}
                    <label htmlFor="onuID" className="block mb-2 mt-4">ONU ID:</label>
                    <input
                      type="text"
                      id="onuID"
                      placeholder="Enter ONU ID"
                      value={customer.onu_id}
                      onChange={(e) => setCustomer({ ...customer, onu_id: e.target.value })}
                      required
                      className="font-raleway-black w-full p-2 border"
                    />

                    {/* Camera IP */}
                  </>
                )}
                {(customer.device_type_id === 1 || customer.device_type_id === 2) && (
                  <>
                    {/* ACL */}
                    <label htmlFor="ACL" className="block mb-2 mt-4">ACL:</label>
                    <input
                      type="text"
                      id="ACL"
                      placeholder="Enter ACL"
                      value={customer.ACL}
                      onChange={(e) => setCustomer({ ...customer, ACL: e.target.value })}
                      required
                      className="font-raleway-black w-full p-2 border"
                    />
                    <label htmlFor="ipAddress" className="block mb-2 mt-4">IP Address:</label>
                    <input
                      type="text"
                      id="ipAddress"
                      placeholder="Enter ip address"
                      value={customer.ip_address}
                      onChange={(e) => setCustomer({ ...customer, ip_address: e.target.value })}
                      className="font-raleway-black w-full p-2 border"
                    />
                    {/* VLan */}
                  </>
                )}
              </div>
            </>
          )}

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
