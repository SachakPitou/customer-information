"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';
import PopUpModal from './popUpmodal';

interface TechnicalFormProps {
  customerId: string;
}

export default function TechnicalForm({ customerId }: TechnicalFormProps) {
  const [step, setStep] = useState<number>(1);
  const [customerData, setCustomerData] = useState<any>(null);
  const [onuMacAddress, setOnuMacAddress] = useState<string>('');
  const [slots, setSlot] = useState<string>('');
  const [ports, setPorts] = useState<string>('');
  const [servicePort, setServicePort] = useState<string>('');
  const [onuID, setOnuID] = useState<string>('');
  const [cameraIP, setCameraIP] = useState<string>('');
  const [switchPort, setSwitchPort] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [longtitude, setLongtitudes] = useState<string>('');
  const [langtitude, setLangtitudes] = useState<string>('');
  const [capacityBandwidth, setCapacityBandwidth] = useState<string>('');
  const [portType, setPortType] = useState<string>('');
  const [ACL, setACL] = useState<string>('');
  const [vLan, setVLan] = useState<string>('');
  const [ipAddress, setIPAddress] = useState<string>('');
  const [locations, setLocations] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [interfaces, setInterfaces] = useState<any[]>([]);
  const [selectedInterfaceId, setSelectedInterfaceId] = useState<string>('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState<string>('');
  const [frame, setFrame] = useState<string>('');
  const [ontId, setOntId] = useState<string>('');
  const [saleName, setSaleName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [insertCustomerId, setInsertedCustomerId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [cid, setCid] = useState<string>('');
  const [routers, setRouters] = useState<any[]>([]);
  const [selectedRouterId, setSelectedRouterId] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [packageId, setPackageId] = useState<string>('');
  const [serviceName, setServiceName] = useState<string>('');
  const [packageName, setPackageName] = useState<string>('');
  const [registeredDate, setRegisteredDate] = useState<string>('');
  const [subnet, setSubnet] = useState<string>('');

  const router = useRouter();

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (insertCustomerId || error) {
      setIsModalOpen(true);
    }
  }, [insertCustomerId, error]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: routerData, error: routerError } = await supabase
          .from('Device')
          .select('*')
          .eq('device_type_id', 1);
        if (routerError) throw new Error(routerError.message);
        setRouters(routerData || []);

        const { data: locationData, error: locationError } = await supabase.from('Location').select('*');
        if (locationError) throw new Error(locationError.message);
        setLocations(locationData || []);

        const { data: interfaceData, error: interfaceError } = await supabase.from('Interface').select('*');
        if (interfaceError) throw new Error(interfaceError.message);

        const { data: portDeviceData, error: portDeviceError } = await supabase.from('PortDevice').select('*');
        if (portDeviceError) throw new Error(portDeviceError.message);

        const combinedData = interfaceData?.map(interfaceItem => {
          const portDeviceItem = portDeviceData?.find(pd => pd.interface_id === interfaceItem.interface_id);
          return {
            ...interfaceItem,
            portDevice: portDeviceItem
          };
        }) || [];

        setInterfaces(combinedData);

        const { data: deviceData, error: deviceError } = await supabase
          .from('Device')
          .select('*')
          .neq('device_type_id', 1);
        if (deviceError) throw new Error(deviceError.message);
        setDevices(deviceData || []);

        const { data: deviceTypeData, error: deviceTypeError } = await supabase
          .from('Device Type')
          .select('*')
          .neq('device_type_id', 1);
        if (deviceTypeError) throw new Error(deviceTypeError.message);
        setDeviceTypes(deviceTypeData || []);

        if (customerId) {
          const { data: customerData, error: customerError } = await supabase
            .from('Customer')
            .select('customer_name, cid, service_id, package_id')
            .eq('customer_id', customerId)
            .single();
        
          if (customerError) throw new Error(customerError.message);
          setCustomerData(customerData);
          setCustomerName(customerData?.customer_name || '');
          setCid(customerData?.cid || '');
          setServiceId(customerData?.service_id || '');
          setPackageId(customerData?.package_id || '');

          if (customerData?.service_id) {
            const { data: serviceData, error: serviceError } = await supabase
              .from('Service')
              .select('service_name')
              .eq('service_id', customerData.service_id)
              .single();

            if (serviceError) throw new Error(serviceError.message);
            setServiceName(serviceData?.service_name || '');
          }

          if (customerData?.package_id) {
            const { data: packageData, error: packageError } = await supabase
              .from('Package')
              .select('package_name')
              .eq('package_id', customerData.package_id)
              .single();

            if (packageError) throw new Error(packageError.message);
            setPackageName(packageData?.package_name || '');
            setCapacityBandwidth(packageData?.package_name || '');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : String(error));
      }
    };

    fetchData();
  }, [customerId]);

  const handleRouterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const routerId = e.target.value;
    setSelectedRouterId(routerId);
    const selectedRouter = routers.find(r => r.device_id === parseInt(routerId, 10));
    setDescription(selectedRouter?.description || '');
    setIPAddress(selectedRouter?.ip_address || '');
    setVLan(selectedRouter?.vlan || '');
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentDate = new Date().toISOString();
      const { data: customerData, error: customerError } = await supabase
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
          frame: frame || null,
          ont_id: ontId || null,
          sale_name: saleName || null,
          longtitude: longtitude || null,
          langtitude: langtitude || null,
          capacity_bandwidth: capacityBandwidth,
          device_id: parseInt(selectedDeviceId, 10),
          location_id: parseInt(selectedLocationId, 10),
          device_type_id: parseInt(selectedDeviceTypeId, 10),
          interface_id: parseInt(selectedInterfaceId, 10),
          service_id: parseInt(serviceId, 10),
          package_id: parseInt(packageId, 10),
          registered_date: currentDate,
          subnet: subnet || null,
        })
        .eq('customer_id', customerId);
  
      if (customerError) throw new Error(customerError.message);
  
      const { data: routerData, error: routerError } = await supabase
        .from('customerrouter')
        .upsert({
          customer_id: customerId,
          router_device_id: parseInt(selectedRouterId, 10),
        }, {
          onConflict: 'customer_id'
        });
  
      if (routerError) throw new Error(routerError.message);
        
      setRegisteredDate(currentDate);
      setInsertedCustomerId(customerId);
      router.push('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  };
  
  const filteredDevices = devices.filter(device => device.device_type_id === parseInt(selectedDeviceTypeId, 10));
  const filteredInterfaces = interfaces.filter((inf) => inf.device_id === parseInt(selectedDeviceId, 10));

  if (!customerData && customerId) {
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
        <span>New Customer: </span>
        
        {step === 1 && (
          <form onSubmit={handleContinue} className="mt-10">
            <div className="flex">
              <div className="w-1/2 pr-4 space-y-4">
                <div className='mb-4'>
                  <label className="block">Customer Name:</label>
                  <input
                    type="text"
                    value={customerName}
                    readOnly={true}
                    className="block w-full border rounded p-2 mb-2 bg-gray-100"
                  />
                </div>
                <div className='mb-4'>
                  <label className="block">CID:</label>
                  <input
                    type="text"
                    value={cid}
                    readOnly={true}
                    className="block w-full border rounded p-2 mb-2 bg-gray-100"
                  />
                </div>
                <div className='mb-4'>
                  <label className="block">Service:</label>
                  <input
                    type="text"
                    value={serviceName}
                    readOnly={true}
                    className="block w-full border rounded p-2 mb-2 bg-gray-100"
                  />
                </div>
                <div className='mb-4'>
                  <label className="block">Package:</label>
                  <input
                    type="text"
                    value={packageName}
                    readOnly={true}
                    className="block w-full border rounded p-2 mb-2 bg-gray-100"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="routerName" className="block mb-2">Select Router:</label>
                  <select
                    id="routerName"
                    value={selectedRouterId}
                    onChange={handleRouterChange}
                    required
                    className="font-raleway-black w-full p-2 border"
                  >
                    <option value="">Select Router...</option>
                    {routers.map((router) => (
                      <option key={router.device_id} value={router.device_id}>
                        {router.device_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="w-1/2 pl-4 space-y-4">
                <div className="mb-4">
                  <label className="block mb-2">Description:</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border" />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">IP Address:</label>
                  <input 
                    type="text" 
                    value={ipAddress} 
                    onChange={e => setIPAddress(e.target.value)} 
                    className="w-full p-2 border" 
                  />
                </div>
                {ipAddress && (
                  <div className="mb-4">
                    <label className="block mb-2">Subnet:</label>
                    <input 
                      type="text" 
                      value={subnet} 
                      onChange={e => setSubnet(e.target.value)} 
                      className="w-full p-2 border" 
                    />
                  </div>
                  )}
                <div className="mb-4">
                  <label className="block mb-2">VLAN:</label>
                  <input 
                    type="text" 
                    value={vLan} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      if (value === '' || (value.length <= 4 && /^\d+$/.test(value))) {
                        setVLan(value);
                      }
                    }} 
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      if (value.length !== 4) {
                        setVLan('');
                      }
                    }}
                    placeholder="Enter 4-digit VLAN"
                    maxLength={4}
                    className="w-full p-2 border" 
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Capacity Bandwidth:</label>
                  <input 
                    type="text" 
                    value={capacityBandwidth} 
                    readOnly 
                    className="w-full p-2 border bg-gray-100" 
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-10">
              <button type="submit" className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600">
                Continue
              </button>
            </div>
          </form>
        )}
        
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-wrap">
              <div className="w-full lg:w-1/2 p-2">
                <div className="mb-4">
                  <label htmlFor="deviceType" className="block mb-2">Select Device Type:</label>
                  <select
                    id="deviceType"
                    value={selectedDeviceTypeId}
                    onChange={(e) => setSelectedDeviceTypeId(e.target.value)}
                    required
                    className="font-raleway-black w-full p-2 border"
                  >
                    <option value="">Select Device Type...</option>
                    {deviceTypes.map((dvct) => (
                      <option key={dvct.device_type_id} value={dvct.device_type_id}>
                        {dvct.device_type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="deviceName" className="block mb-2">Device Name:</label>
                  <select
                    id="deviceName"
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    required
                    className="font-raleway-black w-full p-2 border"
                  >
                    <option value="">Select Device...</option>
                    {filteredDevices.map((dvc) => (
                      <option key={dvc.device_id} value={dvc.device_id}>
                        {dvc.device_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Longtitude:</label>
                  <input type="text" value={longtitude} onChange={e => setLongtitudes(e.target.value)} className="w-full p-2 border" />
                </div>
                {selectedDeviceTypeId === '3' && ( // Assuming 3 is for OLT
                  <>
                    <div className="mb-4">
                      <label className="block mb-2">Frame:</label>
                      <input type="text" value={frame} onChange={e => setFrame(e.target.value)} className="w-full p-2 border" />
                    </div>
                    <div className="mb-4">
                      <label className="block mb-2">Slot:</label>
                      <input type="text" value={slots} onChange={e => setSlot(e.target.value)} className="w-full p-2 border" />
                    </div>
                    <div className="mb-4">
                      <label className="block mb-2">Port:</label>
                      <input type="text" value={ports} onChange={e => setPorts(e.target.value)} className="w-full p-2 border" />
                    </div>
                    <div className="mb-4">
                      <label className="block mb-2">ONT ID:</label>
                      <input type="text" value={ontId} onChange={e => setOntId(e.target.value)} className="w-full p-2 border" />
                    </div>
                  </>
                )}
                {selectedDeviceTypeId === '2' && ( // Assuming 3 is for OLT
                  <>
                    <div className="mb-4">
                      <label className="block mb-2">ACL:</label>
                      <input type="text" value={ACL} onChange={e => setACL(e.target.value)} className="w-full p-2 border" />
                    </div>
                    {/* <div className="mb-4">
                      <label className="block mb-2">VLan:</label>
                      <input type="text" value={vLan} onChange={e => setVLan(e.target.value)} className="w-full p-2 border" />
                    </div> */}
                    <div className="mb-4">
                      <label className="block mb-2">Service Port:</label>
                      <input type="text" value={servicePort} onChange={e => setServicePort(e.target.value)} className="w-full p-2 border" />
                    </div>
                    <div className="mb-4">
                      <label className="block mb-2">Camera IP:</label>
                      <input type="text" value={cameraIP} onChange={e => setCameraIP(e.target.value)} className="w-full p-2 border" />
                    </div>
                    <div className="mb-4">
                      <label className="block mb-2">Switch Port:</label>
                      <input type="text" value={switchPort} onChange={e => setSwitchPort(e.target.value)} className="w-full p-2 border" />
                    </div>
                    <div className="mb-4">
                      <label className="block mb-2">Port Type:</label>
                      <input type="text" value={portType} onChange={e => setPortType(e.target.value)} className="w-full p-2 border" />
                    </div>
                  </>
                )}
              </div>

              <div className="w-full lg:w-1/2 p-2">
                <div className="mb-4">
                  <label htmlFor="locationName" className="block mb-2">Location Name:</label>
                  <select
                    id="locationName"
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
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Langtitude:</label>
                  <input type="text" value={langtitude} onChange={e => setLangtitudes(e.target.value)} className="w-full p-2 border" />
                </div>
                <div className="mb-4">
                  <label htmlFor="saleName" className="block mb-2">Sale Name:</label>
                  <input type="text" value={saleName} onChange={e => setSaleName(e.target.value)} className="w-full p-2 border" />
                </div>
                {selectedDeviceTypeId === '2' && (
                <div className="mb-4">
                  <label htmlFor="interfaceName" className="block mb-2">Interface Name:</label>
                  <select
                    id="interfaceName"
                    value={selectedInterfaceId}
                    onChange={(e) => setSelectedInterfaceId(e.target.value)}
                    required
                    className="font-raleway-black w-full p-2 border"
                  >
                    <option value="">Select Interface...</option>
                    {filteredInterfaces.map((inf) => (
                      <option key={inf.interface_id} value={inf.interface_id}>
                        {inf.interface_name}
                      </option>
                    ))}
                  </select>
                </div>
                )}
              </div>
            </div>
            <div className="w-full p-2 text-center">
              <button type="button" onClick={handleBack} className="px-4 py-2 mt-4 text-white bg-gray-500 rounded hover:bg-gray-600 mr-2">
                Back
              </button>
              <button type="submit" className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600">
                Add Customer
              </button>
            </div>
          </form>
        )}
        
        <PopUpModal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={insertCustomerId ? 'Success' : 'Error'}
          content={
            <>
              {insertCustomerId && (
                <>
                  <p className="text-center text-green-700 mt-4">
                    Customer is added successfully with ID: {insertCustomerId}
                  </p>
                  <p className="text-center text-green-700 mt-2">
                    Registered Date: {new Date(registeredDate).toLocaleString()}
                  </p>
                </>
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