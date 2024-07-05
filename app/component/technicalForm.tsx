"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';
import PopUpModal from './popUpmodal';

export default function TechnicalForm({ customerId }) {
  const [customerData, setCustomerData] = useState(null);
  const [onuMacAddress, setOnuMacAddress] = useState('');
  const [slots, setSlot] = useState('');
  const [ports, setPorts] = useState('');
  const [servicePort, setServicePort] = useState('');
  const [onuID, setOnuID] = useState('');
  const [cameraIP, setCameraIP] = useState('');
  const [switchPort, setSwitchPort] = useState('');
  const [description, setDescription] = useState('');
  const [portType, setPortType] = useState('');
  const [ACL, setACL] = useState('');
  const [vLan, setVLan] = useState('');
  const [ipAddress, setIPAddress] = useState('');
  const [locations, setLocations] = useState([]);
  const [OLTs, setOLTs] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [activationDate, setActivationDate] = useState('');
  const [interfaces, setInterfaces] = useState([]);
  const [selectedInterfaceId, setSelectedInterfaceId] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState('');
  const [selectedOLTId, setSelectedOLTId] = useState('');
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

    // const fetchOLT = async () => {
    //   try {
    //     const { data, error } = await supabase.from('OLT').select('*');
    //     if (error) throw new Error(error.message);
    //     setOLTs(data);
    //   } catch (error) {
    //     console.error('Error fetching OLTs:', error.message);
    //     setError(error.message);
    //   }
    // };

    const fetchDeviceType = async () => {
      try {
        const { data, error } = await supabase.from('Device Type').select('*');
        if (error) throw new Error(error.message);
        setDeviceTypes(data);
      } catch (error) {
        console.error('Error fetching Device Types:', error.message);
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

        if (error) {
          throw new Error(error.message);
        }

        setCustomerData(data);
      } catch (error) {
        console.error('Error fetching customer data:', error.message);
      }
    };

    if (customerId) {
      fetchCustomerData();
    }
    fetchInterface();
    fetchLocation();
    fetchDevice();
    fetchDeviceType();
  }, [customerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error: updateError } = await supabase
        .from('Customer')
        .update({
          status: 'Completed',
          ONU_mac_address: onuMacAddress || null,
          slot: slots || null,
          port: ports || null,
          service_port: servicePort || null,
          onu_id: onuID || null,
          ip_address: ipAddress || null,
          camera_ip: cameraIP || null,
          switch_port: switchPort || null,
          description: description || null,
          port_type: portType || null,
          ACL: ACL || null,
          VLan: vLan || null,
          device_id: parseInt(selectedDeviceId, 10),
          location_id: parseInt(selectedLocationId, 10),
          // olt_id: parseInt(selectedOLTId, 10),
          device_type_id: parseInt(selectedDeviceTypeId, 10),
          interface_id: parseInt(selectedInterfaceId, 10),
        })
        .eq('customer_id', customerId); // Assuming customerId is a UUID string

      if (updateError) throw new Error(updateError.message);
      setInsertedCustomerId(customerId); // Assuming customerId is set correctly
      router.push('/');
    } catch (error) {
      setError(error.message);
    }
  };

  const filteredDevices = devices.filter(device => device.device_type_id === parseInt(selectedDeviceTypeId, 10));
  const filteredInterfaces = interfaces.filter((inf) => inf.device_id === parseInt(selectedDeviceId, 10));

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
              <label htmlFor="deviceType" className="block mb-2 mt-4">Select Device Type:</label>
              <select
                id="deviceType"
                value={selectedDeviceTypeId}
                onChange={(e) => setSelectedDeviceTypeId(e.target.value)}
                required
                className="font-raleway-black w-full p-2 border mb-2"
              >
                <option value="">Select Device Type...</option>
                {deviceTypes.map((dvct) => (
                  <option key={dvct.device_type_id} value={dvct.device_type_id}>
                    {dvct.device_type}
                  </option>
                ))}
              </select>
              {selectedDeviceTypeId === '1' || selectedDeviceTypeId === '2' ? (
                <> {/* Router or Switch */}
                    <div>
                      <label>Switch Port:</label>
                      <input type="text" value={switchPort} onChange={e => setSwitchPort(e.target.value)} className="block w-full border rounded p-2" />
                    </div>
                    <div>
                      <label>Description:</label>
                      <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="block w-full border rounded p-2" />
                    </div>
                    <div>
                      <label>Port Type:</label>
                      <input type="text" value={portType} onChange={e => setPortType(e.target.value)} className="block w-full border rounded p-2" />
                    </div>
                </>
              ) : selectedDeviceTypeId === '3' ? ( // OLT
                <>
                  <div>
                    <label>ONU MAC Address:</label>
                    <input type="text" value={onuMacAddress} onChange={e => setOnuMacAddress(e.target.value)} className="block w-full border rounded p-2" />
                  </div>
                  <div>
                    <label>Slot:</label>
                    <input type="text" value={slots} onChange={e => setSlot(e.target.value)} className="block w-full border rounded p-2" />
                  </div>
                  <div>
                    <label>Port Uplink</label>
                    <input type="text" value={ports} onChange={e => setPorts(e.target.value)} className="block w-full border rounded p-2" />
                  </div>
                  <div>
                    <label>Service Port:</label>
                    <input type="text" value={servicePort} onChange={e => setServicePort(e.target.value)} className="block w-full border rounded p-2" />
                  </div>
                </>
              ) : null}
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
            <div className="w-full lg:w-1/2 p-2">
              <label htmlFor="deviceName" className="block mt-6">Device Name:</label>
                <select
                  id="deviceName"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  required
                  className="font-raleway-black w-full p-2 border mb-4"
                >
                  <option value="">Select Device...</option>
                  {filteredDevices.map((dvc) => (
                    <option key={dvc.device_id} value={dvc.device_id}>
                      {dvc.device_name}
                    </option>
                  ))}
                </select>
                <label htmlFor="interfaceName" className="block">Interface Name:</label>
                  <select
                    id="interfaceName"
                    value={selectedInterfaceId}
                    onChange={(e) => setSelectedInterfaceId(e.target.value)}
                    required
                    className="font-raleway-black w-full p-2 border mb-2"
                  >
                    <option value="">Select Interface...</option>
                    {filteredInterfaces.map((inf) => (
                      <option key={inf.interface_id} value={inf.interface_id}>
                        Port {inf.portDevice.port_number}: {inf.interface_name}
                      </option>
                    ))}
                  </select>
            {selectedDeviceTypeId === '1' || selectedDeviceTypeId === '2' ? (
                <> {/* Router or Switch */}
                    <div>
                      <label>ACL:</label>
                      <input type="text" value={ACL} onChange={e => setACL(e.target.value)} className="block w-full border rounded p-2" />
                    </div>
                    <div>
                      <label>IP Address:</label>
                      <input type="text" value={ipAddress} onChange={e => setIPAddress(e.target.value)} className="block w-full border rounded p-2" />
                    </div>
                </>
              ) : selectedDeviceTypeId === '3' ? ( // OLT
                <>
                  <div>
                    <label>ONU ID:</label>
                    <input type="text" value={onuID} onChange={e => setOnuID(e.target.value)} className="block w-full border rounded p-2" />
                  </div>
                  <div>
                    <label>Camera IP:</label>
                    <input type="text" value={cameraIP} onChange={e => setCameraIP(e.target.value)} className="block w-full border rounded p-2" />
                  </div>
                </>
              ) : null}
              <div>
                <label>VLAN:</label>
                <input type="text" value={vLan} onChange={e => setVLan(e.target.value)} className="block w-full border rounded p-2" />
              </div>
            </div>
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
                  Customer is added successfully with ID: {insertCustomerId}
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
