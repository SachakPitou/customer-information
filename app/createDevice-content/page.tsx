"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/navigation';
import SideBar from '../component/SideBar';
import PopUpModal from '../component/popUpmodal';
import { createClient } from '@/utils/supabase/client';

export default function CreateDevice() {
    const router = useRouter();
    const [userType, setUserType] = useState('');
    const [session, setSession] = useState(null);
    const [deviceName, setDeviceName] = useState('');
    const [model, setModel] = useState('');
    const [deviceType, setDeviceType] = useState('');
    const [description, setDescription] = useState('');
    const [ipAddress, setIPAddress] = useState('');
    const [macAddress, setMACAddress] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [numberOfPorts, setNumberOfPorts] = useState(1); // Default to 1 port
    const [ports, setPorts] = useState([]);
    const [locations, setLocations] = useState([]);
    const [racks, setRacks] = useState([]);
    const [selectedLocationId, setSelectedLocationId] = useState('');
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState('');
    const [POPs, setPOPs] = useState([]);
    const [selectedPOPId, setSelectedPOPId] = useState('');
    const [selectedRackId, setSelectedRackId] = useState('');
    const [uPosition, setUPosition] = useState('');
    const [powerSources, setPowerSources] = useState([]);
    const [UPSs, setUPSs] = useState([]);
    const [selectedPowerSourceId, setSelectedPowerSourceId] = useState('');
    const [selectedUPSId, setSelectedUPSId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [insertDeviceId, setInsertedDeviceId] = useState('');
    const [error, setError] = useState(null);
    const [allDevices, setAllDevices] = useState([]); // State to store all devices
    const [assignedDevices, setAssignedDevices] = useState([]); // State to store assigned devices

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleNumberOfPortsChange = (e) => {
        const count = parseInt(e.target.value);
        setNumberOfPorts(count);
        // Reset ports array when the number of ports changes
        setPorts(Array.from({ length: count }, (_, index) => ({
            port_number: index + 1,
            interfaceName: '',
            ipAddress: '',
            description: '',
        })));
    };

    useEffect(() => {
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

        const fetchData = async () => {
            try {
                // Fetch all devices
                const { data: allDevicesData, error: allDevicesError } = await supabase.from('Device').select('*');
                if (allDevicesError) throw new Error(allDevicesError.message);
                setAllDevices(allDevicesData);

                // Fetch devices already assigned to any rack
                const { data: assignedDevicesData, error: assignedDevicesError } = await supabase
                    .from('Rack Device')
                    .select('device_id')
                if (assignedDevicesError) throw new Error(assignedDevicesError.message);
                setAssignedDevices(assignedDevicesData.map(device => device.device_id));

                // Fetch locations
                const { data: locationsData, error: locationsError } = await supabase.from('Location').select('*');
                if (locationsError) throw new Error(locationsError.message);
                setLocations(locationsData);

                // Fetch power sources
                const { data: powerSourcesData, error: powerSourcesError } = await supabase.from('Power Source').select('*');
                if (powerSourcesError) throw new Error(powerSourcesError.message);
                setPowerSources(powerSourcesData);

                // Fetch UPSs
                const { data: UPSsData, error: UPSsError } = await supabase.from('UPS').select('*');
                if (UPSsError) throw new Error(UPSsError.message);
                setUPSs(UPSsData);

                const { data: deviceTypesData, error: deviceTypesError } = await supabase.from('Device Type').select('*');
                if (deviceTypesError) throw new Error(deviceTypesError.message);
                setDeviceTypes(deviceTypesData);
            } catch (error) {
                console.error('Error fetching data:', error.message);
                setError(error.message);
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
                    console.error('Error fetching racks:', error.message);
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
                    console.error('Error fetching racks:', error.message);
                }
            }
        };

        fetchPOPs();
        fetchRacks();
    }, [selectedLocationId, selectedPOPId]);

    const handlePortChange = (index, field, value) => {
        const updatedPorts = [...ports];
        updatedPorts[index][field] = value;
        setPorts(updatedPorts);
    };

    const handleAddDevice = async (e) => {
    e.preventDefault();
    try {
        // Insert the device
        const { data: deviceData, error: deviceError } = await supabase
            .from('Device')
            .insert([
                {
                    device_name: deviceName,
                    model: model,
                    device_type_id: parseInt(selectedDeviceTypeId),
                    description: description,
                    ip_address: ipAddress,
                    mac_address: macAddress,
                    serial_number: serialNumber,
                    rack_id: parseInt(selectedRackId),
                    power_source_id: parseInt(selectedPowerSourceId),
                    location_id: parseInt(selectedLocationId),
                    ups_id: parseInt(selectedUPSId),
                },
            ])
            .select();

        if (deviceError) {
            throw new Error(deviceError.message);
        }

        const deviceId = deviceData[0].device_id;

        // Prepare interfaces to insert
        const interfaces = ports.map((port) => ({
            device_id: parseInt(deviceId),
            interface_name: port.interfaceName,
            ip_address: port.ipAddress,
            description: port.description,
        }));

        // Insert interfaces in bulk
        const { data: interfaceData, error: interfaceError } = await supabase
            .from('Interface')
            .insert(interfaces)
            .select();

        if (interfaceError) {
            throw new Error(interfaceError.message);
        }

        // Prepare port-device relationships to insert
        const portDevices = ports.map((port, index) => ({
            port_number: port.port_number,
            device_id: parseInt(deviceId),
            interface_id: interfaceData[index].interface_id, // Ensure interface_id is populated correctly
        }));

        // Insert port-device relationships in bulk
        const { error: portDeviceError } = await supabase
            .from('PortDevice')
            .insert(portDevices);

        if (portDeviceError) {
            throw new Error(portDeviceError.message);
        }

        // Assign device to rack
        const { error: rackDeviceError } = await supabase
            .from('Rack Device')
            .insert([
                {
                    device_id: parseInt(deviceId),
                    rack_id: parseInt(selectedRackId),
                    u_position: parseInt(uPosition),
                },
            ]);

        if (rackDeviceError) {
            throw new Error(rackDeviceError.message);
        }

        setInsertedDeviceId(deviceId);
        setIsModalOpen(true);

        // Clear form fields
        resetFormFields();

    } catch (error) {
        setError(error.message);
        setIsModalOpen(true);
    }
};

// Helper function to reset form fields
const resetFormFields = () => {
    setDeviceName('');
    setModel('');
    setDeviceType('');
    setDescription('');
    setMACAddress('');
    setSerialNumber('');
    setSelectedPowerSourceId('');
    setSelectedLocationId('');
    setSelectedRackId('');
    setUPosition('');
    setSelectedUPSId('');
    setSelectedDeviceTypeId('');
    setNumberOfPorts(1);
    setPorts([]);
};


    // Filter available devices based on assignedDevices state
    const availableDevices = allDevices.filter(dev => !assignedDevices.includes(dev.device_id));

    return (
        <div className="flex flex-col w-full items-center justify-center min-h-screen dark:bg-gray-200">
            <div className="font-raleway-black w-full max-w-4xl p-5">
                <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
                    <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                    </svg>
                </button>
                <span>Create New Device:</span>
                <form onSubmit={handleAddDevice} className="flex flex-wrap justify-between mt-10">
                    <div className="w-full lg:w-1/2 p-2">
                        <label htmlFor="deviceName" className="block mb-2">Device Name:</label>
                        <input
                            type="text"
                            id="deviceName"
                            placeholder="Enter device name"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            required
                            className="font-raleway-black w-full p-2 border"
                        />
                        <label htmlFor="model" className="block mb-2 mt-4">Model:</label>
                        <input
                            type="text"
                            id="model"
                            placeholder="Enter model"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            required
                            className="font-raleway-black w-full p-2 border"
                        />
                        <label htmlFor="deviceType" className="block mb-2 mt-4">Device Type:</label>
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
                        <label htmlFor="description" className="block mb-2 mt-4">Description:</label>
                        <input
                            type="text"
                            id="description"
                            placeholder="Enter description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="font-raleway-black w-full p-2 border"
                        />
                        <label htmlFor="numberOfPorts" className="block mb-2 mt-4">Number of Ports:</label>
                        <input
                            type="number"
                            id="numberOfPorts"
                            placeholder="Enter number of ports"
                            value={numberOfPorts}
                            onChange={handleNumberOfPortsChange}
                            required
                            className="font-raleway-black w-full p-2 border"
                        />
                    </div>
                    <div className="w-full lg:w-1/2 p-2">
                        <label htmlFor="upsName" className="block mb-2">UPS Name:</label>
                        <select
                            id="upsName"
                            value={selectedUPSId}
                            onChange={(e) => setSelectedUPSId(e.target.value)}
                            required
                            className="font-raleway-black w-full p-2 border"
                        >
                            <option value="">Select UPS...</option>
                            {UPSs.map((ups) => (
                                <option key={ups.ups_id} value={ups.ups_id}>
                                    {ups.ups_name}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="powerSource" className="block mb-2 mt-4">Power Source:</label>
                        <select
                            id="powerSource"
                            value={selectedPowerSourceId}
                            onChange={(e) => setSelectedPowerSourceId(e.target.value)}
                            required
                            className="font-raleway-black w-full p-2 border"
                        >
                            <option value="">Select Power Source...</option>
                            {powerSources.map((PWS) => (
                                <option key={PWS.power_source_id} value={PWS.power_source_id}>
                                    {PWS.power_source_type}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="macAddress" className="block mb-2 mt-4">MAC Address:</label>
                        <input
                            type="text"
                            id="macAddress"
                            placeholder="Enter MAC Address"
                            value={macAddress}
                            onChange={(e) => setMACAddress(e.target.value)}
                            required
                            className="font-raleway-black w-full p-2 border"
                        />
                        <label htmlFor="serialNumber" className="block mb-2 mt-4">Serial Number:</label>
                        <input
                            type="text"
                            id="serialNumber"
                            placeholder="Enter Serial Number"
                            value={serialNumber}
                            onChange={(e) => setSerialNumber(e.target.value)}
                            required
                            className="font-raleway-black w-full p-2 border"
                        />
                        <label htmlFor="locationName" className="block mb-2 mt-4">Location:</label>
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
                        <label htmlFor="popName" className="block mb-2 mt-4">POP:</label>
                        <select
                            id="popName"
                            value={selectedPOPId}
                            onChange={(e) => setSelectedPOPId(e.target.value)}
                            required
                            className="font-raleway-black w-full p-2 border"
                        >
                            <option value="">Select POP...</option>
                            {POPs.map((pop) => (
                                <option key={pop.pop_id} value={pop.pop_id}>
                                    {pop.pop_name}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="rackName" className="block mb-2 mt-4">Rack:</label>
                        <select
                            id="rackName"
                            value={selectedRackId}
                            onChange={(e) => setSelectedRackId(e.target.value)}
                            required
                            className="font-raleway-black w-full p-2 border"
                        >
                            <option value="">Select Rack...</option>
                            {racks.map((rack) => (
                                <option key={rack.rack_id} value={rack.rack_id}>
                                    {rack.rack_name}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="uPosition" className="block mb-2 mt-4">U Position:</label>
                        <input
                            type="number"
                            id="uPosition"
                            placeholder="Enter U Position"
                            value={uPosition}
                            onChange={(e) => setUPosition(e.target.value)}
                            required
                            className="font-raleway-black w-full p-2 border"
                        />
                        <label htmlFor="ipAddress" className="block mb-2 mt-4">IP Address:</label>
                        <input
                            type="text"
                            id="ipAddress"
                            placeholder="Enter IP Address"
                            value={ipAddress}
                            onChange={(e) => setIPAddress(e.target.value)}
                            required
                            className="font-raleway-black w-full p-2 border"
                        />
                        {ports.map((port, index) => (
                            <div key={index} className="mt-4">
                                <div className="flex justify-between mb-2">
                                    <span>Port {index + 1}</span>
                                </div>
                                <label htmlFor={`interfaceName${index}`} className="block mb-2">Interface Name:</label>
                                <input
                                    type="text"
                                    id={`interfaceName${index}`}
                                    placeholder="Enter interface name"
                                    value={port.interfaceName}
                                    onChange={(e) => handlePortChange(index, 'interfaceName', e.target.value)}
                                    className="font-raleway-black w-full p-2 border"
                                />
                                <label htmlFor={`ipAddress${index}`} className="block mb-2 mt-4">IP Address:</label>
                                <input
                                    type="text"
                                    id={`ipAddress${index}`}
                                    placeholder="Enter IP address"
                                    value={port.ipAddress}
                                    onChange={(e) => handlePortChange(index, 'ipAddress', e.target.value)}
                                    className="font-raleway-black w-full p-2 border"
                                />
                                <label htmlFor={`description${index}`} className="block mb-2 mt-4">Description:</label>
                                <input
                                    type="text"
                                    id={`description${index}`}
                                    placeholder="Enter description"
                                    value={port.description}
                                    onChange={(e) => handlePortChange(index, 'description', e.target.value)}
                                    className="font-raleway-black w-full p-2 border"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="w-full p-2 text-center">
                        <button
                            type="submit"
                            className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600"
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
