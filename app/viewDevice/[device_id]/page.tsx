"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function ViewDevice() {
    const [device, setDevice] = useState(null);
    const [interfaces, setInterfaces] = useState([]);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { device_id } = useParams(); // Assuming you're using device_id in the URL

    useEffect(() => {
        async function fetchDeviceAndInterfaces() {
            try {
                if (!device_id) return;

                // Fetch the device data
                const { data: deviceData, error: deviceError } = await supabase
                    .from('Device')
                    .select('*')
                    .eq('device_id', device_id)
                    .single();

                if (deviceError) throw deviceError;

                setDevice(deviceData);

                // Fetch all interfaces associated with the device
                const { data: portDevicesData, error: portDevicesError } = await supabase
                    .from('PortDevice')
                    .select('interface_id, port_number')
                    .eq('device_id', device_id);

                if (portDevicesError) throw portDevicesError;

                const interfaceIds = portDevicesData.map(pd => pd.interface_id);

                // Fetch interfaces details using the interface_ids
                const { data: interfacesData, error: interfacesError } = await supabase
                    .from('Interface')
                    .select('*')
                    .in('interface_id', interfaceIds);

                if (interfacesError) throw interfacesError;

                // Map interfaces to include port_number from PortDevice
                const interfacesWithPortNumbers = interfacesData.map(iface => {
                    const portDeviceEntry = portDevicesData.find(pd => pd.interface_id === iface.interface_id);
                    return {
                        ...iface,
                        port_number: portDeviceEntry ? portDeviceEntry.port_number : null,
                    };
                });

                setInterfaces(interfacesWithPortNumbers);
            } catch (error) {
                console.error('Error fetching data:', error.message);
                setError(error.message);
            }
        }

        fetchDeviceAndInterfaces();
    }, [device_id]);

    const handleInterfaceChange = (index, field, value) => {
        const newInterfaces = [...interfaces];
        newInterfaces[index] = {
            ...newInterfaces[index],
            [field]: value
        };
        setInterfaces(newInterfaces);
    };

    const handleAddInterface = () => {
        // Adding a new interface with default values
        const nextPortNumber = interfaces.length > 0 ? interfaces[interfaces.length - 1].port_number + 1 : 1;
        const newInterface = {
            interface_name: '',
            ip_address: '',
            description: '',
            port_number: nextPortNumber,
        };
        setInterfaces([...interfaces, newInterface]);
    };

    const handleDeleteInterface = async (index) => {
        try {
            const ifaceToDelete = interfaces[index];
    
            if (ifaceToDelete.interface_id) {
                // Delete associated entries in the PortDevice table
                const { error: portDeviceDeleteError } = await supabase
                    .from('PortDevice')
                    .delete()
                    .eq('interface_id', ifaceToDelete.interface_id);
    
                if (portDeviceDeleteError) throw portDeviceDeleteError;
    
                // Delete interface from the Interface table
                const { error: interfaceDeleteError } = await supabase
                    .from('Interface')
                    .delete()
                    .eq('interface_id', ifaceToDelete.interface_id);
    
                if (interfaceDeleteError) throw interfaceDeleteError;
            }
    
            // Remove the interface from state immutably
            const newInterfaces = interfaces.filter((_, i) => i !== index);
    
            // Decrement port numbers for interfaces with higher port numbers
            const updatedInterfaces = newInterfaces.map(iface => {
                if (iface.port_number > ifaceToDelete.port_number) {
                    return {
                        ...iface,
                        port_number: iface.port_number - 1
                    };
                }
                return iface;
            });
    
            // Update port numbers in the PortDevice table
            for (let iface of updatedInterfaces) {
                if (iface.interface_id) {
                    const { error: portDeviceUpdateError } = await supabase
                        .from('PortDevice')
                        .update({ port_number: iface.port_number })
                        .eq('interface_id', iface.interface_id)
                        .eq('device_id', device.device_id);
    
                    if (portDeviceUpdateError) throw portDeviceUpdateError;
                }
            }
    
            setInterfaces(updatedInterfaces);
        } catch (error) {
            console.error('Error deleting interface:', error.message);
            alert('Failed to delete interface. Check console for details.');
        }
    };
    

    const handleSave = async () => {
        if (!device || !device.device_id) {
            alert('Device information is missing. Please refresh the page and try again.');
            return;
        }
    
        try {
            for (let iface of interfaces) {
                if (iface.interface_id === undefined) {
                    // Insert new interface with device_id
                    const { data: newInterfaceData, error: insertError } = await supabase
                        .from('Interface')
                        .insert({
                            device_id: device.device_id, // Include device_id here
                            interface_name: iface.interface_name,
                            ip_address: iface.ip_address,
                            description: iface.description,
                        })
                        .select('*') // Ensure we get the inserted row back
                        .single();
    
                    if (insertError) throw insertError;
    
                    // Log the newly inserted interface data for debugging
                    console.log('New Interface Data:', newInterfaceData);
    
                    // Ensure the interface_id is present
                    if (newInterfaceData && newInterfaceData.interface_id) {
                        iface.interface_id = newInterfaceData.interface_id;
    
                        // Insert into PortDevice table to associate the port number with the interface
                        const { error: portDeviceError } = await supabase
                            .from('PortDevice')
                            .insert({
                                device_id: device.device_id,
                                interface_id: newInterfaceData.interface_id,
                                port_number: iface.port_number,
                            });
    
                        if (portDeviceError) throw portDeviceError;
                    } else {
                        throw new Error('Inserted interface data is null or missing interface_id');
                    }
                } else {
                    // Update existing interface
                    const updateObject = {};
                    if (iface.interface_name !== null) updateObject.interface_name = iface.interface_name;
                    if (iface.ip_address !== null) updateObject.ip_address = iface.ip_address;
                    if (iface.description !== null) updateObject.description = iface.description;
    
                    if (Object.keys(updateObject).length > 0) {
                        const { error: updateError } = await supabase
                            .from('Interface')
                            .update(updateObject)
                            .eq('interface_id', iface.interface_id);
    
                        if (updateError) throw updateError;
                    }
    
                    // Update port number in PortDevice if needed
                    const { error: portDeviceUpdateError } = await supabase
                        .from('PortDevice')
                        .update({ port_number: iface.port_number })
                        .eq('interface_id', iface.interface_id)
                        .eq('device_id', device.device_id);
    
                    if (portDeviceUpdateError) throw portDeviceUpdateError;
                }
            }
            alert('Interfaces updated successfully!');
        } catch (error) {
            console.error('Error updating interfaces:', error);
            alert('Failed to update interfaces. Check console for details.');
        }
    };
    
    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!device) {
        return <div>Loading...</div>;
    }

    return (
        <div className="relative overflow-x-auto shadow-md">
            <div className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800 flex items-center">
                <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 ml-1 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700">
                    <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                    </svg>
                </button>
                <span>Device Details:</span>
            </div>
            <div className="p-5">
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-2">Ports</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {interfaces.map((iface, index) => (
                            <div key={index} className="bg-white border rounded-lg shadow-md p-4 dark:bg-gray-300 dark:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-400">
                                <h4 className="text-lg font-semibold">Port {iface.port_number}</h4>
                                <label>
                                    Interface Name:
                                    <input
                                        type="text"
                                        value={iface.interface_name}
                                        onChange={(e) => handleInterfaceChange(index, 'interface_name', e.target.value)}
                                        className="block w-full mt-1 p-2 border rounded"
                                    />
                                </label>
                                <label>
                                    IP Address:
                                    <input
                                        type="text"
                                        value={iface.ip_address}
                                        onChange={(e) => handleInterfaceChange(index, 'ip_address', e.target.value)}
                                        className="block w-full mt-1 p-2 border rounded"
                                    />
                                </label>
                                <label>
                                    Description:
                                    <input
                                        type="text"
                                        value={iface.description}
                                        onChange={(e) => handleInterfaceChange(index, 'description', e.target.value)}
                                        className="block w-full mt-1 p-2 border rounded"
                                    />
                                </label>
                                <button
                                    onClick={() => handleDeleteInterface(index)}
                                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleAddInterface}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Add Port
                    </button>
                    <button
                        onClick={handleSave}
                        className="mt-4 ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
