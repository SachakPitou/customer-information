"use client";
import React, { useEffect, useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import SideBar from '../component/SideBar';
import PopUpModal from '../component/popUpmodal';
import { createClient } from '@/utils/supabase/client';

// Define types for your data structures
type UserType = string;
type Session = any; // Replace 'any' with the actual type from Supabase
type DeviceType = {
  device_type_id: number;
  device_type: string;
  // Add other properties as needed
};
type Location = {
  location_id: number;
  location_name: string;
  // Add other properties as needed
};
type POP = {
  pop_id: number;
  pop_name: string;
  // Add other properties as needed
};
type Rack = {
  rack_id: number;
  rack_name: string;
  numberOfU?: number;
  // Add other properties as needed
};
type PowerSource = {
  power_source_id: number;
  power_source_type: string;
  // Add other properties as needed
};
type UPS = {
  ups_id: number;
  ups_name: string;
  // Add other properties as needed
};
type PortAttribute = {
  interface_name: string | null;
  description?: string | null;
  port_type?: string | null;
  link_mode?: string | null;
  capacity?: string | null;
  link_protocol?: string | null;
};
type UPosition = {
  position: number;
  available: boolean;
  deviceName?: string;
};

export default function CreateDevice() {
    const router = useRouter();
    const [userType, setUserType] = useState<UserType>('');
    const [session, setSession] = useState<Session | null>(null);
    const [deviceName, setDeviceName] = useState('');
    const [model, setModel] = useState('');
    const [status, setStatus] = useState('default');
    const [deviceType, setDeviceType] = useState('');
    const [description, setDescription] = useState('');
    const [addDate, setAddDate] = useState('');
    const [deployedBy, setDeployedBy] = useState('');
    const [ipAddress, setIPAddress] = useState('');
    const [macAddress, setMACAddress] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [numberOfPorts, setNumberOfPorts] = useState(1);
    const [selectedLocationId, setSelectedLocationId] = useState('');
    const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
    const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState('');
    const [selectedPOPId, setSelectedPOPId] = useState('');
    const [selectedRackId, setSelectedRackId] = useState('');
    const [uPosition, setUPosition] = useState('');
    const [powerSources, setPowerSources] = useState<PowerSource[]>([]);
    const [UPSs, setUPSs] = useState<UPS[]>([]);
    const [selectedUPSIds, setSelectedUPSIds] = useState<string[]>(['', '']);
    const [locations, setLocations] = useState<Location[]>([]);
    const [racks, setRacks] = useState<Rack[]>([]);
    const [POPs, setPOPs] = useState<POP[]>([]);
    const [selectedPowerSourceIds, setSelectedPowerSourceIds] = useState<string[]>(['', '']);
    const [selectedUPSId, setSelectedUPSId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [insertDeviceId, setInsertedDeviceId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [allDevices, setAllDevices] = useState<any[]>([]);
    const [assignedDevices, setAssignedDevices] = useState<number[]>([]);
    const [portAttributes, setPortAttributes] = useState<PortAttribute[]>([]);
    const [numberOfPowerSources, setNumberOfPowerSources] = useState(1);
    const [image, setImage] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState('');
    const [deviceImage, setDeviceImage] = useState<File | null>(null);
    const [interfacePrefix, setInterfacePrefix] = useState<{[key: number]: string}>({});
    const [interfaceError, setInterfaceError] = useState('');
    const [availableUPositions, setAvailableUPositions] = useState<number[]>([]);
    const [allUPositions, setAllUPositions] = useState<UPosition[]>([]);

    const supabase: SupabaseClient = createClient();

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleDeviceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const deviceTypeId = e.target.value;
        setSelectedDeviceTypeId(deviceTypeId);
        setupPortAttributes(deviceTypeId, numberOfPorts);
    };

    const handleNumberOfPowerSourcesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setNumberOfPowerSources(parseInt(e.target.value));
        setSelectedPowerSourceIds(['', '']); // Reset selections when changing number of sources
    };
    

    

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setDeviceImage(e.target.files[0]);
        }
    };
    const handleNumberOfPortsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || value === null) {
            setNumberOfPorts(0);
            setPortAttributes([]);
        } else {
            const count = parseInt(value);
            if (!isNaN(count) && count > 0) {
                setNumberOfPorts(count);
                if (selectedDeviceTypeId) {
                    setupPortAttributes(selectedDeviceTypeId, count);
                }
            }
        }
    };
    const setupPortAttributes = (deviceTypeId: string, portCount: number) => {
        const selectedDeviceType = deviceTypes.find(type => type.device_type_id === Number(deviceTypeId));
    
        if (!selectedDeviceType) return;
    
        // Ensure portCount is at least 1
        portCount = Math.max(1, portCount || 1);
    
        let attributes: PortAttribute[] = [];
    
        switch (selectedDeviceType.device_type_id) {
            case 2: // Switch
                attributes = Array(portCount).fill(null).map(() => ({
                    interface_name: null,
                }));
                break;
            case 3: // OLT
                attributes = Array(portCount).fill(null).map(() => ({
                    interface_name: null,
                    description: null,
                    port_type: null,
                    link_mode: null,
                    capacity: null,
                }));
                break;
            case 1: // Router
                attributes = Array(portCount).fill(null).map(() => ({
                    interface_name: null,
                    capacity: null,
                    link_protocol: null,
                }));
                break;
            default:
                attributes = Array(portCount).fill(null).map(() => ({
                    interface_name: null,
                }));
        }
    
        setPortAttributes(attributes);
    };
    const handlePortChange = (index: number, field: string, value: string) => {
        const updatedPorts = [...portAttributes];
        const currentPrefix = interfacePrefix[index] || '';
    
        if (field === 'interface_name') {
            // Convert single-digit input to zero-padded for interfaces 11-99 with any prefix
            const normalizePrefixNumber = (prefix: string) => {
                const match = prefix.match(/(\D*)(\d+)/);
                return match ? parseInt(match[2]) : 0;
            };
    
            const prefixNumber = normalizePrefixNumber(currentPrefix);
            const normalizedValue = 
                (prefixNumber >= 11 && value.length === 1) 
                    ? `0${value}` 
                    : value;
    
            const fullInterfaceName = `${currentPrefix}${normalizedValue}`;
            const isUnique = !updatedPorts.some((port, i) =>
                i !== index && 
                `${interfacePrefix[i] || ''}${port.interface_name}` === fullInterfaceName
            );
    
            if (isUnique) {
                updatedPorts[index][field as keyof PortAttribute] = normalizedValue;
                setInterfaceError('');
            } else {
                setInterfaceError(`Interface name '${fullInterfaceName}' is already in use`);
                return;
            }
        } else {
            updatedPorts[index][field as keyof PortAttribute] = value === '' ? null : value;
        }
        setPortAttributes(updatedPorts);
    };

    const handlePowerSourceChange = (index: number, value: string) => {
        const newSelectedPowerSourceIds = [...selectedPowerSourceIds];
        newSelectedPowerSourceIds[index] = value;
        setSelectedPowerSourceIds(newSelectedPowerSourceIds);
    };
    
    const handlePrefixChange = (value: string) => {
        setInterfacePrefix(value);
        // Update all existing interface names with the new prefix
        const updatedPorts = portAttributes.map(port => ({
            ...port,
            interface_name: port.interface_name ?
                value + port.interface_name.replace(/^.*?(?=\d)/, '') :
                null
        }));
        setPortAttributes(updatedPorts);
    };
    const renderPortAttributes = (port: PortAttribute, index: number) => {
        const renderAdditionalFields = () => {
            switch (Number(selectedDeviceTypeId)) {
                case 3: // OLT
                    return (
                        <>
                            <div className="mt-4">
                                <label htmlFor={`description${index}`} className="block mb-2 font-semibold">Description:</label>
                                <input
                                    type="text"
                                    id={`description${index}`}
                                    value={port.description || ''}
                                    onChange={(e) => handlePortChange(index, 'description', e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div className="mt-4">
                                <label htmlFor={`port_type${index}`} className="block mb-2 font-semibold">Port Type:</label>
                                <select
                                    id={`port_type${index}`}
                                    value={port.port_type || ''}
                                    onChange={(e) => handlePortChange(index, 'port_type', e.target.value)}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="">Select Port Type</option>
                                    <option value="uplink">Uplink</option>
                                    <option value="downlink">Downlink</option>
                                </select>
                            </div>
                            <div className="mt-4">
                                <label htmlFor={`link_mode${index}`} className="block mb-2 font-semibold">Link Mode:</label>
                                <input
                                    type="text"
                                    id={`link_mode${index}`}
                                    value={port.link_mode || ''}
                                    onChange={(e) => handlePortChange(index, 'link_mode', e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div className="mt-4">
                                <label htmlFor={`capacity${index}`} className="block mb-2 font-semibold">Capacity:</label>
                                <input
                                    type="text"
                                    id={`capacity${index}`}
                                    value={port.capacity || ''}
                                    onChange={(e) => handlePortChange(index, 'capacity', e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </>
                    );
    
                case 1: // Router
                    return (
                        <>
                            <div className="mt-4">
                                <label htmlFor={`capacity${index}`} className="block mb-2 font-semibold">Capacity:</label>
                                <input
                                    type="text"
                                    id={`capacity${index}`}
                                    value={port.capacity || ''}
                                    onChange={(e) => handlePortChange(index, 'capacity', e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div className="mt-4">
                                <label htmlFor={`link_protocol${index}`} className="block mb-2 font-semibold">Link Protocol:</label>
                                <input
                                    type="text"
                                    id={`link_protocol${index}`}
                                    value={port.link_protocol || ''}
                                    onChange={(e) => handlePortChange(index, 'link_protocol', e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </>
                    );
    
                default: // Switch or default case
                    return null;
            }
        };
    
        return (
            <div key={index} className="border p-4 rounded">
                <h3 className="font-bold mb-2">Port {index + 1}</h3>
    
                {/* Interface Prefix Dropdown */}
                <div className="mb-4">
                    <label htmlFor={`interface_prefix_${index}`} className="block mb-2 font-semibold">
                        Interface Prefix:
                    </label>
                    <select
                        id={`interface_prefix_${index}`}
                        value={interfacePrefix[index] || ''}
                        onChange={(e) => {
                            const newPrefixes = { ...interfacePrefix, [index]: e.target.value };
                            setInterfacePrefix(newPrefixes);
    
                            // Update port attributes with new prefix
                            const updatedPorts = [...portAttributes];
                            handlePortChange(index, 'interface_name', updatedPorts[index].interface_name || '');
                        }}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">Select Prefix</option>
                        {Number(selectedDeviceTypeId) === 1 
                            ? prefixOptions.router.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))
                            : prefixOptions.switch.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))
                        }
                    </select>
                </div>
    
                {/* Interface Name Field */}
                <div>
                    <label htmlFor={`interface_name${index}`} className="block mb-2 font-semibold">Interface Name:</label>
                    <div className="flex">
                        <input
                            type="text"
                            id={`interface_prefix_display${index}`}
                            value={interfacePrefix[index] || ''}
                            className="w-1/2 p-2 border rounded-l bg-gray-100"
                            readOnly
                        />
                        <input
                            type="text"
                            value={port.interface_name?.replace(interfacePrefix[index] || '', '') || ''}
                            onChange={(e) => handlePortChange(index, 'interface_name', e.target.value)}
                            placeholder="Enter number"
                            className="w-1/2 p-2 border rounded-r"
                        />
                    </div>
                    {interfaceError && <p className="text-red-500 text-sm mt-1">{interfaceError}</p>}
                </div>
    
                {/* Additional Device-Specific Fields */}
                {renderAdditionalFields()}
            </div>
        );
    };
    
    // Prefix Options
    const prefixOptions = {
        switch: [
            { label: 'GigabitEthernet0/0/*', value: 'GigabitEthernet0/0/*' },
            { label: 'XGigabitEthernet0/0/*', value: 'XGigabitEthernet0/0/*' },
            { label: 'XGigabitEthernet1/0/*', value: 'XGigabitEthernet1/0/*' },
            { label: '40GE0/0/*', value: '40GE0/0/*' },
            { label: '40GE1/0/*', value: '40GE1/0/*' }
        ],
        router: [
            { label: 'ether', value: 'ether' },
            { label: 'sfp-sfpplus', value: 'sfp-sfpplus' }
        ]
    };
    useEffect(() => {
        const fetchUserType = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error fetching session:', error.message);
                    return;
                }
    
                const session = data.session;
                setSession(session);
    
                if (session) {
                    const userId = session.user.id;
                    const { data: userData, error: userError } = await supabase
                        .from('userAccount')
                        .select('user_type') 
                        .eq("id", userId)
                        .single();
    
                    if (userError) {
                        throw userError;
                    }
    
                    if (userData) {
                        setUserType(userData.user_type);
                    }
                }
            } catch (error) {
                console.error('Error fetching user type:', error instanceof Error ? error.message : String(error));
            }
        };

        const fetchData = async () => {
            try {
                const { data: allDevicesData, error: allDevicesError } = await supabase.from('Device').select('*');
                if (allDevicesError) throw new Error(allDevicesError.message);
                setAllDevices(allDevicesData);

                const { data: assignedDevicesData, error: assignedDevicesError } = await supabase
                    .from('Rack Device')
                    .select('device_id')
                if (assignedDevicesError) throw new Error(assignedDevicesError.message);
                setAssignedDevices(assignedDevicesData.map(device => device.device_id));

                const { data: locationsData, error: locationsError } = await supabase.from('Location').select('*');
                if (locationsError) throw new Error(locationsError.message);
                setLocations(locationsData);

                const { data: powerSourcesData, error: powerSourcesError } = await supabase.from('Power Source').select('*');
                if (powerSourcesError) throw new Error(powerSourcesError.message);
                setPowerSources(powerSourcesData);

                const { data: UPSsData, error: UPSsError } = await supabase.from('UPS').select('*');
                if (UPSsError) throw new Error(UPSsError.message);
                setUPSs(UPSsData);

                const { data: deviceTypesData, error: deviceTypesError } = await supabase.from('Device Type').select('*');
                if (deviceTypesError) throw new Error(deviceTypesError.message);
                setDeviceTypes(deviceTypesData);
            } catch (error) {
                console.error('Error fetching data:', error instanceof Error ? error.message : String(error));
                setError(error instanceof Error ? error.message : String(error));
            }
        };

        fetchUserType();
        fetchData();
    }, []);

    useEffect(() => {
        const fetchPOPs = async () => {
            if (selectedLocationId) {
                try {
                    const { data: popsData, error: popsError } = await supabase
                        .from('POP')
                        .select('*')
                        .eq('location_id', selectedLocationId);
                    if (popsError) throw new Error(popsError.message);
                    setPOPs(popsData);
                } catch (error) {
                    console.error('Error fetching POPs:', error instanceof Error ? error.message : String(error));
                }
            }
        };
        const fetchRacks = async () => {
            if (selectedPOPId) {
                try {
                    const { data: racksData, error: racksError } = await supabase
                        .from('Rack')
                        .select('*')
                        .eq('pop_id', selectedPOPId);
                    if (racksError) throw new Error(racksError.message);
                    setRacks(racksData);
                } catch (error) {
                    console.error('Error fetching racks:', error instanceof Error ? error.message : String(error));
                }
            }
        };
        const fetchRackDetails = async () => {
            if (selectedRackId) {
                try {
                    console.log("Fetching rack details for rack ID:", selectedRackId);

                    // Fetch rack details
                    const { data: rackData, error: rackError } = await supabase
                        .from('Rack')
                        .select('*')
                        .eq('rack_id', selectedRackId)
                        .single();

                    if (rackError) throw new Error(rackError.message);
                    console.log("Rack data:", rackData);

                    if (rackData.numberOfU === undefined || rackData.numberOfU === null) {
                        throw new Error('Number of U is not defined for this rack');
                    }

                    // Fetch devices in this rack
                    const { data: rackDevices, error: devicesError } = await supabase
                        .from('Rack Device')
                        .select('u_position, device_id')
                        .eq('rack_id', selectedRackId);

                    if (devicesError) throw new Error(devicesError.message);
                    console.log("Rack devices:", rackDevices);

                    // Fetch device names for occupied positions
                    const deviceIds = rackDevices.map(device => device.device_id);
                    const { data: deviceNames, error: deviceNamesError } = await supabase
                        .from('Device')
                        .select('device_id, device_name')
                        .in('device_id', deviceIds);

                    if (deviceNamesError) throw new Error(deviceNamesError.message);

                    // Create a map of device_id to device_name
                    const deviceNameMap = Object.fromEntries(deviceNames.map(device => [device.device_id, device.device_name]));

                    // Prepare all U positions
                    const totalU = rackData.numberOfU;
                    const allPositions: UPosition[] = [];
                    for (let i = 1; i <= totalU; i++) {
                        const occupyingDevice = rackDevices.find(device => device.u_position === i);
                        if (occupyingDevice) {
                            allPositions.push({
                                position: i,
                                available: false,
                                deviceName: deviceNameMap[occupyingDevice.device_id] || 'Unknown Device'
                            });
                        } else {
                            allPositions.push({ position: i, available: true });
                        }
                    }

                    console.log("All positions:", allPositions);
                    setAllUPositions(allPositions);
                    setAvailableUPositions(allPositions.filter(pos => pos.available).map(pos => pos.position));
                } catch (error) {
                    console.error('Error fetching rack details:', error instanceof Error ? error.message : String(error));
                    setError(error instanceof Error ? error.message : String(error));
                    setAllUPositions([]);
                    setAvailableUPositions([]);
                }
            }
        };
        
        fetchRackDetails();
        fetchPOPs();
        fetchRacks();
    }, [selectedLocationId, selectedPOPId, selectedRackId, deviceTypes]);

    useEffect(() => {
        if (selectedDeviceTypeId) {
            setupPortAttributes(selectedDeviceTypeId, numberOfPorts);
        }
    }, [selectedDeviceTypeId, numberOfPorts]);

    
    const handleAddDevice = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const { data: maxDeviceIdData, error: maxDeviceIdError } = await supabase
                .from('Device')
                .select('device_id')
                .order('device_id', { ascending: false })
                .limit(1);
            if (maxDeviceIdError) {
                throw new Error(maxDeviceIdError.message);
            }

            const newDeviceId = maxDeviceIdData.length > 0 ? maxDeviceIdData[0].device_id + 1 : 1;

            let imageUrl = null;
            if (deviceImage) {
                try {
                    const filePath = `images/${Date.now()}-${deviceName}`;
                    const { error: uploadError } = await supabase.storage.from('Device Image').upload(filePath, deviceImage);

                    if (uploadError) {
                        throw new Error(uploadError.message);
                    }

                    const { data } = supabase.storage.from('Device Image').getPublicUrl(filePath);

                    if (data) {
                        imageUrl = data.publicUrl;
                    } else {
                        throw new Error('Failed to get public URL for uploaded image');
                    }
                } catch (error) {
                    console.error('Error uploading image:', error instanceof Error ? error.message : String(error));
                    setError(error instanceof Error ? error.message : String(error));
                    return;
                }
            }
            const { data: deviceData, error: deviceError } = await supabase
                .from('Device')
                .insert([
                    {
                        device_id: newDeviceId,
                        device_name: deviceName,
                        model: model,
                        device_type_id: parseInt(selectedDeviceTypeId),
                        description: description,
                        deployedBy: deployedBy,
                        ip_address: ipAddress,
                        mac_address: macAddress,
                        serial_number: serialNumber,
                        rack_id: parseInt(selectedRackId),
                        power_source_id_1: selectedPowerSourceIds[0] ? parseInt(selectedPowerSourceIds[0]) : null,
                        power_source_id_2: selectedPowerSourceIds[1] ? parseInt(selectedPowerSourceIds[1]) : null,
                        location_id: parseInt(selectedLocationId),
                        ups_id: selectedPowerSourceIds[0] ? parseInt(selectedUPSIds[0]) : null,
                        ups_id_2: selectedPowerSourceIds[1] ? parseInt(selectedUPSIds[1]) : null,
                        status: status,
                        image_url: imageUrl,
                        add_date: addDate,
                    },
                ])
                .select();

            if (deviceError) {
                throw new Error(deviceError.message);
            }

            const deviceId = deviceData[0].device_id;

            const interfaces = portAttributes.map((port, index) => {
                // Find the selected prefix option
                const selectedPrefixOption = 
                    Number(selectedDeviceTypeId) === 1 
                        ? prefixOptions.router.find(option => option.value === interfacePrefix[index])
                        : prefixOptions.switch.find(option => option.value === interfacePrefix[index]);
    
                return {
                    device_id: parseInt(deviceId.toString()),
                    interface_name: `${selectedPrefixOption?.value || ''}${port.interface_name || (index + 1)}`, // Full interface name
                    description: port.description,
                    port_type: port.port_type 
                        ? (port.port_type === 'uplink' ? 'Uplink' : 'Downlink') 
                        : null,
                    link_mode: port.link_mode,
                    capacity: port.capacity,
                    link_protocol: port.link_protocol,
                };
            });
    
            const { data: interfaceData, error: interfaceError } = await supabase
                .from('Interface')
                .insert(interfaces)
                .select();
    
            if (interfaceError) {
                throw new Error(interfaceError.message);
            }
    

            const portDevices = portAttributes.map((port, index) => ({
                port_number: index + 1,
                device_id: parseInt(deviceId.toString()),
                interface_id: interfaceData[index].interface_id,
            }));

            const { error: portDeviceError } = await supabase
                .from('PortDevice')
                .insert(portDevices);

            if (portDeviceError) {
                throw new Error(portDeviceError.message);
            }

            const { error: rackDeviceError } = await supabase
                .from('Rack Device')
                .insert([
                    {
                        device_id: parseInt(deviceId.toString()),
                        rack_id: parseInt(selectedRackId),
                        u_position: parseInt(uPosition),
                    },
                ]);

            if (rackDeviceError) {
                throw new Error(rackDeviceError.message);
            }

            setInsertedDeviceId(deviceId.toString());
            setIsModalOpen(true);

            resetFormFields();

        } catch (error) {
            setError(error instanceof Error ? error.message : String(error));
            setIsModalOpen(true);
        }
    };

    const resetFormFields = () => {
        setDeviceName('');
        setModel('');
        setDeviceType('');
        setDescription('');
        setDeployedBy('');
        setIPAddress('');
        setMACAddress('');
        setSerialNumber('');
        setAddDate('');
        setSelectedPowerSourceIds(['', '']);
        setNumberOfPowerSources(1);
        setSelectedLocationId('');
        setSelectedRackId('');
        setUPosition('');
        setSelectedUPSIds(['', '']);
        setSelectedDeviceTypeId('');
        setNumberOfPorts(1);
        setPortAttributes([]);
        setStatus('default');
    };
    

    const formatAttributeName = (attr: string) => {
        return attr
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Filter available devices based on assignedDevices state
    const availableDevices = allDevices.filter(dev => !assignedDevices.includes(dev.device_id));

    return (
        <div className="flex flex-col w-full items-center justify-center min-h-screen dark:bg-gray-200">
            <div className="font-raleway-black w-full max-w-6xl p-5">
                <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mb-4 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
                    <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                    </svg>
                </button>
                <h2 className="text-2xl font-bold mb-6 text-center">Create New Device</h2>
                <form onSubmit={handleAddDevice} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="deviceName" className="block mb-2 font-semibold">Device Name:</label>
                            <input
                                type="text"
                                id="deviceName"
                                placeholder="Enter device name"
                                value={deviceName}
                                onChange={(e) => setDeviceName(e.target.value)}
                                required
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label htmlFor="model" className="block mb-2 font-semibold">Model:</label>
                            <input
                                type="text"
                                id="model"
                                placeholder="Enter model"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                required
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label htmlFor="deviceType" className="block mb-2 font-semibold">Device Type:</label>
                            <select
                                id="deviceType"
                                value={selectedDeviceTypeId}
                                onChange={handleDeviceTypeChange}
                                required
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Select Device Type...</option>
                                {deviceTypes.map((dvct) => (
                                    <option key={dvct.device_type_id} value={dvct.device_type_id}>
                                        {dvct.device_type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="description" className="block mb-2 font-semibold">Description:</label>
                            <input
                                type="text"
                                id="description"
                                placeholder="Enter description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label htmlFor="deployedBy" className="block mb-2 font-semibold">Deployed By:</label>
                            <input
                                type="text"
                                id="deployedBy"
                                placeholder="Who Deployed"
                                value={deployedBy}
                                onChange={(e) => setDeployedBy(e.target.value)}
                                required
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label htmlFor="status" className="block mb-2 font-semibold">Status:</label>
                            <select
                                id="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                required
                                className="w-full p-2 border rounded"
                            >
                                <option value="default">Default</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="deviceImage" className="block mb-2 font-semibold">Device Image:</label>
                            <input
                                type="file"
                                id="deviceImage"
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="w-full p-2 border rounded"
                            />
                            {deviceImage && (
                                <img
                                    src={URL.createObjectURL(deviceImage)}
                                    alt="Device preview"
                                    className="mt-2 max-w-full h-auto"
                                />
                            )}
                        </div>
                        <div>
                            <label htmlFor="numberOfPorts" className="block mb-2 font-semibold">Number of Ports:</label>
                            <input
                                type="number"
                                id="numberOfPorts"
                                placeholder="Enter number of ports"
                                value={numberOfPorts}
                                onChange={handleNumberOfPortsChange}
                                min="1"
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="numberOfPowerSources" className="block mb-2 font-semibold">Number of Power Sources:</label>
                            <select
                                id="numberOfPowerSources"
                                value={numberOfPowerSources}
                                onChange={handleNumberOfPowerSourcesChange}
                                className="w-full p-2 border rounded"
                            >
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                            </select>
                        </div>
                        {[...Array(numberOfPowerSources)].map((_, index) => (
                            <div key={index}>
                                <label htmlFor={`powerSource${index + 1}`} className="block mb-2 font-semibold">Power Source {index + 1}:</label>
                                <select
                                    id={`powerSource${index + 1}`}
                                    value={selectedPowerSourceIds[index]}
                                    onChange={(e) => handlePowerSourceChange(index, e.target.value)}
                                    required
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="">Select Power Source...</option>
                                    {powerSources.map((PWS) => (
                                        <option key={PWS.power_source_id} value={PWS.power_source_id}>
                                            {PWS.power_source_type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                        {selectedPowerSourceIds.filter(id => id !== "").length > 0 && (
                        <div>
                            {[...Array(selectedPowerSourceIds.filter(id => id !== "").length)].map((_, index) => (
                                <div key={index} className="mt-4">
                                    <label htmlFor={`upsName${index}`} className="block mb-2 font-semibold">
                                        UPS Name for Power Source {index + 1}:
                                    </label>
                                    <select
                                        id={`upsName${index}`}
                                        value={selectedUPSIds[index]}
                                        onChange={(e) => {
                                            const newUPSIds = [...selectedUPSIds];
                                            newUPSIds[index] = e.target.value;
                                            setSelectedUPSIds(newUPSIds);
                                        }}
                                        required
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="">Select UPS...</option>
                                        {UPSs.map((ups) => (
                                            <option key={ups.ups_id} value={ups.ups_id}>
                                                {ups.ups_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}
                        <div>
                            <label htmlFor="macAddress" className="block mb-2 font-semibold">MAC Address:</label>
                            <input
                                type="text"
                                id="macAddress"
                                placeholder="Enter MAC Address"
                                value={macAddress}
                                onChange={(e) => setMACAddress(e.target.value)}
                                required
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label htmlFor="serialNumber" className="block mb-2 font-semibold">Serial Number:</label>
                            <input
                                type="text"
                                id="serialNumber"
                                placeholder="Enter Serial Number"
                                value={serialNumber}
                                onChange={(e) => setSerialNumber(e.target.value)}
                                required
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label htmlFor="addDate" className="block mb-2 font-semibold">Device Add Date:</label>
                            <input
                                type="date"
                                id="addDate"
                                value={addDate}
                                onChange={(e) => setAddDate(e.target.value)}
                                required
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label htmlFor="locationName" className="block mb-2 font-semibold">Location:</label>
                            <select
                                id="locationName"
                                value={selectedLocationId}
                                onChange={(e) => setSelectedLocationId(e.target.value)}
                                required
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Select Location...</option>
                                {locations.map((location) => (
                                    <option key={location.location_id} value={location.location_id}>
                                        {location.location_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="popName" className="block mb-2 font-semibold">POP:</label>
                            <select
                                id="popName"
                                value={selectedPOPId}
                                onChange={(e) => setSelectedPOPId(e.target.value)}
                                required
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Select POP...</option>
                                {POPs.map((pop) => (
                                    <option key={pop.pop_id} value={pop.pop_id}>
                                        {pop.pop_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="rackName" className="block mb-2 font-semibold">Rack:</label>
                            <select
                                id="rackName"
                                value={selectedRackId}
                                onChange={(e) => setSelectedRackId(e.target.value)}
                                required
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Select Rack...</option>
                                {racks.map((rack) => (
                                    <option key={rack.rack_id} value={rack.rack_id}>
                                        {rack.rack_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="uPosition" className="block mb-2 font-semibold">U Position:</label>
                            <select
                                id="uPosition"
                                value={uPosition}
                                onChange={(e) => setUPosition(e.target.value)}
                                required
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Select U Position...</option>
                                {allUPositions.map((position) => (
                                    <option 
                                        key={position.position} 
                                        value={position.position}
                                        disabled={!position.available}
                                    >
                                        {position.available 
                                            ? `U Position ${position.position}`
                                            : `U Position ${position.position}: Unavailable: ${position.deviceName}`
                                        }
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="ipAddress" className="block mb-2 font-semibold">IP Management:</label>
                            <input
                                type="text"
                                id="ipAddress"
                                placeholder="Enter IP Management"
                                value={ipAddress}
                                onChange={(e) => setIPAddress(e.target.value)}
                                required
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        {portAttributes.map((port, index) => (
                            <div key={index} className="mb-4">
                                <label htmlFor={`interface_prefix_${index}`} className="block mb-2 font-semibold">
                                    Interface Prefix for Port {index + 1}:
                                </label>
                                <input
                                    type="text"
                                    id={`interface_prefix_${index}`}
                                    value={interfacePrefix[index] || ''}
                                    onChange={(e) => {
                                        const newPrefixes = { ...interfacePrefix, [index]: e.target.value };
                                        setInterfacePrefix(newPrefixes);

                                        // Update port attributes with new prefix
                                        const updatedPorts = [...portAttributes];
                                        handlePortChange(index, 'interface_name', updatedPorts[index].interface_name || '');
                                    }}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        ))}

                        {portAttributes.map((port, index) => renderPortAttributes(port, index))}
                    </div>
                    <div className="col-span-1 md:col-span-2 text-center">
                        <button
                            type="submit"
                            className="px-6 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600 transition duration-300"
                        >
                            Add Device
                        </button>
                    </div>
                </form>
                <PopUpModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    title={insertDeviceId ? 'Success' : 'Error'}
                    content={
                        <>
                            {insertDeviceId && (
                                <p className="text-center text-green-700 mt-4">
                                    Device created successfully with ID: {insertDeviceId}
                                </p>
                            )}
                            {error && (
                                <p className="text-center text-red-700 mt-4">
                                    Error: {error}
                                </p>
                            )}
                        </>
                    }
                />
            </div>
        </div>
    );
}
