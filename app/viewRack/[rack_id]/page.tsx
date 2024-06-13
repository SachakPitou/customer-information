"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';

export default function ViewRack() {
    const [rack, setRack] = useState(null);
    const [devices, setDevices] = useState([]);
    const [allDevices, setAllDevices] = useState([]);
    const [allLocations, setAllLocations] = useState([]);
    const [allPops, setAllPops] = useState([]);
    const [filteredPops, setFilteredPops] = useState([]);
    const [editingField, setEditingField] = useState(null);
    const [editedValue, setEditedValue] = useState('');
    const [editedPop, setEditedPop] = useState('');
    const router = useRouter();
    const { rack_id } = useParams();

    useEffect(() => {
        async function fetchRack() {
            try {
                if (!rack_id) return;

                const { data: rackData, error: rackError } = await supabase
                    .from('Rack')
                    .select('*')
                    .eq('rack_id', rack_id)
                    .single();

                if (rackError) throw rackError;

                const locationId = rackData.location_id;
                const popId = rackData.pop_id;

                const [popData, locationData] = await Promise.all([
                    supabase.from('POP').select('pop_id, pop_name').eq('pop_id', popId).single(),
                    supabase.from('Location').select('location_id, location_name').eq('location_id', locationId).single(),
                ]);

                setRack({
                    ...rackData,
                    location_name: locationData.data.location_name || 'Unknown Location',
                    pop_name: popData.data.pop_name || 'Unknown POP',
                });

                const { data: deviceLocationsData, error: devicesError } = await supabase
                    .from('Rack Device')
                    .select('rack_device_id, u_position, device_id')
                    .eq('rack_id', rack_id);

                if (devicesError) throw devicesError;

                const validDeviceIds = deviceLocationsData
                    .filter(device => device.device_id !== null)
                    .map(device => device.device_id);

                let deviceMap = {};

                if (validDeviceIds.length > 0) {
                    const { data: devicesData, error: devicesDataError } = await supabase
                        .from('Device')
                        .select('device_id, device_name')
                        .in('device_id', validDeviceIds);

                    if (devicesDataError) throw devicesDataError;

                    deviceMap = devicesData.reduce((acc, device) => {
                        acc[device.device_id] = device.device_name;
                        return acc;
                    }, {});
                }

                const updatedDevicesData = deviceLocationsData.map(device => ({
                    ...device,
                    device_name: device.device_id ? deviceMap[device.device_id] || 'Unknown Device' : 'Unknown Device'
                }));

                setDevices(updatedDevicesData);

                // Fetch all devices for dropdowns
                const { data: allDevicesData, error: allDevicesError } = await supabase
                    .from('Device')
                    .select('device_id, device_name');

                if (allDevicesError) throw allDevicesError;

                setAllDevices(allDevicesData);

                // Fetch all locations
                const { data: allLocationsData, error: allLocationsError } = await supabase
                    .from('Location')
                    .select('location_id, location_name');

                if (allLocationsError) throw allLocationsError;

                setAllLocations(allLocationsData);

                // Fetch all POPs
                const { data: allPopsData, error: allPopsError } = await supabase
                    .from('POP')
                    .select('pop_id, pop_name, location_id');

                if (allPopsError) throw allPopsError;

                setAllPops(allPopsData);

            } catch (error) {
                console.error('Error fetching data:', error.message);
            }
        }

        fetchRack();
    }, [rack_id]);

    const handleDeviceChange = async (rackDeviceId, newDeviceId, uPosition) => {
        try {
            // Check if the device is already assigned to another rack position
            const isDeviceAlreadyAssigned = devices.some(device => device.device_id === newDeviceId);
    
            if (isDeviceAlreadyAssigned) {
                alert('This device is already assigned to another position in the rack.');
                return;
            }
    
            if (rackDeviceId) {
                const { error } = await supabase
                    .from('Rack Device')
                    .update({ device_id: newDeviceId })
                    .eq('rack_device_id', rackDeviceId);
    
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('Rack Device')
                    .insert({ rack_id, u_position: uPosition, device_id: newDeviceId });
    
                if (error) throw error;
            }
    
            // Refresh devices after update
            const { data: deviceLocationsData, error: devicesError } = await supabase
                .from('Rack Device')
                .select('rack_device_id, u_position, device_id')
                .eq('rack_id', rack_id);
    
            if (devicesError) throw devicesError;
    
            const validDeviceIds = deviceLocationsData
                .filter(device => device.device_id !== null)
                .map(device => device.device_id);
    
            let deviceMap = {};
    
            if (validDeviceIds.length > 0) {
                const { data: devicesData, error: devicesDataError } = await supabase
                    .from('Device')
                    .select('device_id, device_name')
                    .in('device_id', validDeviceIds);
    
                if (devicesDataError) throw devicesDataError;
    
                deviceMap = devicesData.reduce((acc, device) => {
                    acc[device.device_id] = device.device_name;
                    return acc;
                }, {});
            }
    
            const updatedDevicesData = deviceLocationsData.map(device => ({
                ...device,
                device_name: device.device_id ? deviceMap[device.device_id] || 'Unknown Device' : 'Unknown Device'
            }));
    
            setDevices(updatedDevicesData);
    
        } catch (error) {
            console.error('Error updating device:', error.message);
        }
    };
    
    const handleEditField = (field) => {
        setEditingField(field);
        if (field === 'location_name') {
            // Set editedValue to the current location_id
            setEditedValue(rack.location_id);
        } else if (field === 'pop_name') {
            // Set editedValue to the current pop_id
            setEditedValue(rack.pop_id);
        } else {
            setEditedValue(rack[field]);
        }
    };

    const handleLocationChange = (selectedLocationId) => {
        setEditedValue(selectedLocationId);
        // Filter pops based on the selected location_id
        const popsInLocation = allPops.filter(pop => pop.location_id === parseInt(selectedLocationId));

        setFilteredPops(popsInLocation);
        // Reset pop selection
        setEditedPop('');
    };

    const handleSaveField = async () => {
        try {
            let updateData = {};
            if (editingField === 'location_name') {
                updateData = { location_id: editedValue };
                // Reset the pop field if location changes
                if (editedPop) {
                    updateData.pop_id = editedPop;
                }
            } else if (editingField === 'pop_name') {
                updateData = { pop_id: editedPop };
            } else {
                updateData = { [editingField]: editedValue };
            }

            const { error } = await supabase
                .from('Rack')
                .update(updateData)
                .eq('rack_id', rack_id);

            if (error) throw error;

            // Fetch updated rack data
            const { data: updatedRackData, error: rackError } = await supabase
                .from('Rack')
                .select('*')
                .eq('rack_id', rack_id)
                .single();
            if (rackError) throw rackError;

            setRack({
                ...rack,
                ...updatedRackData,
                location_name: allLocations.find(location => location.location_id === updatedRackData.location_id).location_name,
                pop_name: allPops.find(pop => pop.pop_id === updatedRackData.pop_id).pop_name
            });

            setEditingField(null);
        } catch (error) {
            console.error('Error updating rack information:', error.message);
        }
    };


    if (!rack) {
        return <div>Loading...</div>;
    }

    return (
        <div className="relative overflow-x-auto shadow-md">
            <div className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800 flex items-center">
                <button
                    onClick={() => router.back()}
                    type="button"
                    className="flex-shrink-0 w-8 h-8 ml-1 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700"
                >
                    <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                    </svg>
                </button>
                <span>Rack Information</span>
            </div>
            <table className="w-full text-sm text-left rtl:text-right text-black-500 dark:text-black-400">
                <thead className="text-xs text-white uppercase bg-gray-50 dark:bg-gray-700 dark:text-white">
                    <tr>
                        <th scope="col" className="px-6 py-3">Rack Details</th>
                        <th scope="col" className="px-6 py-3">Additional Information</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="bg-white border-b dark:bg-gray-300 dark:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-400">
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="font-semibold mr-2">Rack Name:</span>
                                {editingField === 'rack_name' ? (
                                    <div className="flex items-center">
                                        <input
                                            type="text"
                                            className="border border-gray-300 p-1 rounded-md mr-2"
                                            value={editedValue}
                                            onChange={(e) => setEditedValue(e.target.value)}
                                        />
                                        <button
                                            className="bg-red-500 text-white px-2 py-1 rounded-md"
                                            onClick={handleSaveField}
                                        >
                                            Save
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <span>{rack.rack_name}</span>
                                        <button
                                            className="ml-2 bg-red-500 text-white px-2 py-1 rounded-md"
                                            onClick={() => handleEditField('rack_name')}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col mt-4">
                                <span className="font-semibold mr-2">Location:</span>
                                {editingField === 'location_name' ? (
                                    <div className="flex items-center">
                                        <select
                                            className="border border-gray-300 p-1 rounded-md mr-2"
                                            value={editedValue} 
                                            onChange={(e) => handleLocationChange(e.target.value)}
                                        >
                                            {allLocations.map(location => (
                                                <option key={location.location_id} value={location.location_id}>
                                                    {location.location_name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            className="bg-red-500 text-white px-2 py-1 rounded-md"
                                            onClick={handleSaveField}
                                        >
                                            Save
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <span>{rack.location_name}</span>
                                        <button
                                            className="ml-2 bg-red-500 text-white px-2 py-1 rounded-md"
                                            onClick={() => handleEditField('location_name')}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col mt-4">
                                <span className="font-semibold mr-2">POP Name:</span>
                                {editingField === 'pop_name' ? (
                                    <div className="flex items-center">
                                        <select
                                            className="border border-gray-300 p-1 rounded-md mr-2"
                                            value={editedPop}
                                            onChange={(e) => setEditedPop(e.target.value)}
                                            disabled={!editedValue}  // Disable until a location is selected
                                        >
                                            <option value="">Select POP</option>
                                            {filteredPops.map(pop => (
                                                <option key={pop.pop_id} value={pop.pop_id}>
                                                    {pop.pop_name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            className="bg-red-500 text-white px-2 py-1 rounded-md"
                                            onClick={handleSaveField}
                                        >
                                            Save
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <span>{rack.pop_name}</span>
                                        <button
                                            className="ml-2 bg-red-500 text-white px-2 py-1 rounded-md"
                                            onClick={() => handleEditField('pop_name')}
                                            disabled={!rack.location_id}  // Disable if no location is set
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>

                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                {/* <span className="font-semibold mr-2">Additional Information:</span> */}
                                <div className="flex flex-col mt-4">
                                    <span className="font-semibold mr-2">Rack Type:</span>
                                    {editingField === 'rack_type' ? (
                                        <div className="flex items-center">
                                            <input
                                                type="text"
                                                className="border border-gray-300 p-1 rounded-md mr-2"
                                                value={editedValue}
                                                onChange={(e) => setEditedValue(e.target.value)}
                                            />
                                            <button
                                                className="bg-red-500 text-white px-2 py-1 rounded-md"
                                                onClick={handleSaveField}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <span>{rack.rack_type}</span>
                                            <button
                                                className="ml-2 bg-red-500 text-white px-2 py-1 rounded-md"
                                                onClick={() => handleEditField('rack_type')}
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col mt-4">
                                    <span className="font-semibold mr-2">Rack Brand:</span>
                                    {editingField === 'rack_brand' ? (
                                        <div className="flex items-center">
                                            <input
                                                type="text"
                                                className="border border-gray-300 p-1 rounded-md mr-2"
                                                value={editedValue}
                                                onChange={(e) => setEditedValue(e.target.value)}
                                            />
                                            <button
                                                className="bg-red-500 text-white px-2 py-1 rounded-md"
                                                onClick={handleSaveField}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <span>{rack.rack_brand}</span>
                                            <button
                                                className="ml-2 bg-red-500 text-white px-2 py-1 rounded-md"
                                                onClick={() => handleEditField('rack_brand')}
                                            >
                                            Edit
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col mt-4">
                                    <span className="font-semibold mr-2">Dimension:</span>
                                    {editingField === 'dimension' ? (
                                        <div className="flex items-center">
                                            <input
                                                type="text"
                                                className="border border-gray-300 p-1 rounded-md mr-2"
                                                value={editedValue}
                                                onChange={(e) => setEditedValue(e.target.value)}
                                            />
                                            <button
                                                className="bg-red-500 text-white px-2 py-1 rounded-md"
                                                onClick={handleSaveField}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <span>{rack.dimension}</span>
                                            <button
                                                className="ml-2 bg-red-500 text-white px-2 py-1 rounded-md"
                                                onClick={() => handleEditField('dimension')}
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
    
            {/* Rack Devices Table */}
            <div className="mt-6">
                <div className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                    <span>Rack Devices</span>
                </div>
                <table className="w-full text-sm text-left rtl:text-right text-black-500 dark:text-black-400">
                    <thead className="text-xs text-white uppercase bg-gray-50 dark:bg-gray-700 dark:text-white">
                        <tr>
                            <th scope="col" className="px-6 py-3">U Position</th>
                            <th scope="col" className="px-6 py-3">Device Name</th>
                        </tr>
                    </thead>
                    <tbody>
                    {[...Array(rack.numberOfU)].map((_, index) => {
                        const device = devices.find((d) => d.u_position === index + 1);

                        // Filter out already selected devices
                        const availableDevices = allDevices.filter((dev) => 
                            !devices.some((d) => d.device_id === dev.device_id) || dev.device_id === (device ? device.device_id : null)
                        );

                        return (
                            <tr key={index} className="bg-white border-b dark:bg-gray-300 dark:border-gray-300 hover:bg-gray-50 dark:hover:bggray-400">
                                <td className="px-6 py-4">{index + 1}</td>
                                <td className="px-6 py-4">
                                    <select
                                        value={device ? device.device_id : ''}
                                        onChange={(e) => handleDeviceChange(device ? device.rack_device_id : null, e.target.value, index + 1)}
                                    >
                                        <option value="">Select a device</option>
                                        {availableDevices.map((dev) => (
                                            <option key={dev.device_id} value={dev.device_id}>{dev.device_name}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}