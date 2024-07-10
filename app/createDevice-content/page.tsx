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
    const [numberOfPorts, setNumberOfPorts] = useState(1);
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
    const [allDevices, setAllDevices] = useState([]);
    const [assignedDevices, setAssignedDevices] = useState([]);
    const [portAttributes, setPortAttributes] = useState([]);

    const closeModal = () => {
        setIsModalOpen(false);
    };
    const handleDeviceTypeChange = (e) => {
        const deviceTypeId = e.target.value;
        setSelectedDeviceTypeId(deviceTypeId);
        setupPortAttributes(deviceTypeId, numberOfPorts);
    };
    
    const handleNumberOfPortsChange = (e) => {
        const value = e.target.value;
        if (value === '' || value === null) {
            setNumberOfPorts('');
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

    const setupPortAttributes = (deviceTypeId, portCount) => {
        const selectedDeviceType = deviceTypes.find(type => type.device_type_id === parseInt(deviceTypeId));
        if (!selectedDeviceType) return;
    
        portCount = Math.max(1, portCount || 1); // Ensure portCount is at least 1
    
        let attributes = [];
        switch(selectedDeviceType.device_type.toLowerCase()) {
            case 'switch':
                attributes = Array(portCount).fill().map(() => ({
                    interface_name: null,
                }));
                break;
            case 'olt':
                attributes = Array(portCount).fill().map(() => ({
                    interface_name: null,
                    description: null,
                    port_type: null,
                    link_mode: null,
                    capacity: null,
                }));
                break;
            case 'router':
                attributes = Array(portCount).fill().map(() => ({
                    interface_name: null,
                    capacity: null,
                    link_protocol: null,
                }));
                break;
            default:
                attributes = Array(portCount).fill().map(() => ({}));
        }
        setPortAttributes(attributes);
    };

    useEffect(() => {
        const fetchUserType = async () => {
            try {
                const supabase = createClient();
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
                console.error('Error fetching user type:', error.message);
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
                    console.error('Error fetching POPs:', error.message);
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

    useEffect(() => {
        if (selectedDeviceTypeId) {
            setupPortAttributes(selectedDeviceTypeId, numberOfPorts);
        }
    }, [selectedDeviceTypeId, numberOfPorts]);

    const handlePortChange = (index, field, value) => {
    const updatedPorts = [...portAttributes];
    updatedPorts[index][field] = value === '' ? null : value;
    setPortAttributes(updatedPorts);
};

    const handleAddDevice = async (e) => {
        e.preventDefault();
        try {
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

            const interfaces = portAttributes.map((port) => ({
                device_id: parseInt(deviceId),
                ...port,
            }));

            const { data: interfaceData, error: interfaceError } = await supabase
                .from('Interface')
                .insert(interfaces)
                .select();

            if (interfaceError) {
                throw new Error(interfaceError.message);
            }

            const portDevices = portAttributes.map((port, index) => ({
                port_number: index + 1,
                device_id: parseInt(deviceId),
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

            resetFormFields();

        } catch (error) {
            setError(error.message);
            setIsModalOpen(true);
        }
    };

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
        setPortAttributes([]);
    };
    const formatAttributeName = (attr) => {
        return attr
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
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
                            onChange={handleDeviceTypeChange}
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
                            min="1"
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
                        <label htmlFor="ipAddress" className="block mb-2 mt-4">IP Management:</label>
                        <input
                            type="text"
                            id="ipAddress"
                            placeholder="Enter IP Management"
                            value={ipAddress}
                            onChange={(e) => setIPAddress(e.target.value)}
                            required
                            className="font-raleway-black w-full p-2 border"
                        />
                        {portAttributes.map((port, index) => (
                            <div key={index} className="mt-4">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold">Port {index + 1}</span>
                                </div>
                                {Object.keys(port).map(attr => (
                                    <div key={attr}>
                                        <label 
                                            htmlFor={`${attr}${index}`} 
                                            className="block mb-2 mt-4 font-semibold"
                                        >
                                            {formatAttributeName(attr)}:
                                        </label>
                                        <input
                                            type="text"
                                            id={`${attr}${index} `}
                                            placeholder={`Enter ${formatAttributeName(attr)}`}
                                            value={port[attr] || ''}
                                            onChange={(e) => handlePortChange(index, attr, e.target.value)}
                                            className="font-raleway-black w-full p-2 border"
                                        />
                                    </div>
                                ))}
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
