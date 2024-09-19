"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function ViewDevice() {
    const [device, setDevice] = useState(null);
    const [deviceType, setDeviceType] = useState(null);
    const [interfaces, setInterfaces] = useState([]);
    const [error, setError] = useState(null);
    const router = useRouter();
    const [deviceImage, setDeviceImage] = useState(null);
    const [newDeviceImage, setNewDeviceImage] = useState(null);
    const { device_id } = useParams();

    const fetchDeviceAndInterfaces = async () => {
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
            setDeviceImage(deviceData.image_url);

            // Fetch the device type
            const { data: deviceTypeData, error: deviceTypeError } = await supabase
                .from('Device Type')
                .select('*')
                .eq('device_type_id', deviceData.device_type_id)
                .single();

            if (deviceTypeError) throw deviceTypeError;

            setDeviceType(deviceTypeData);

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
    };

    useEffect(() => {
        fetchDeviceAndInterfaces();
    }, [device_id]);

    const handleInterfaceChange = (index, field, value) => {
        const newInterfaces = [...interfaces];
        if (field === 'interface_name') {
            // Only allow numbers
            const sanitizedValue = value.replace(/[^0-9]/g, '');
            newInterfaces[index] = {
                ...newInterfaces[index],
                [field]: sanitizedValue
            };
        } else {
            newInterfaces[index] = {
                ...newInterfaces[index],
                [field]: value
            };
        }
        setInterfaces(newInterfaces);
    };
    const handleAddInterface = () => {
        const nextPortNumber = interfaces.length > 0 ? interfaces[interfaces.length - 1].port_number + 1 : 1;
        let newInterface = {
            interface_name: '',
            port_number: nextPortNumber,
        };

        // Add additional fields based on device type
        if (deviceType.device_type_id === 3) { // OLT
            newInterface = {
                ...newInterface,
                description: '',
                port_type: '',
                link_mode: '',
                capacity: '',
            };
        } else if (deviceType.device_type_id === 1) { // Router
            newInterface = {
                ...newInterface,
                capacity: '',
                link_protocol: '',
            };
        }

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
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        setNewDeviceImage(file);
    };
    const handleSave = async () => {
        if (!device || !device.device_id) {
            alert('Device information is missing. Please refresh the page and try again.');
            return;
        }
    
        try {
            for (let iface of interfaces) {
            let imageUrl = device.image_url;

            if (newDeviceImage) {
                const filePath = `images/${Date.now()}-${device.device_name}`;
                const { error: uploadError } = await supabase.storage
                    .from('Device Image')
                    .upload(filePath, newDeviceImage);

                if (uploadError) throw uploadError;

                const { data: urlData, error: urlError } = await supabase.storage
                    .from('Device Image')
                    .getPublicUrl(filePath);

                if (urlError) throw urlError;

                imageUrl = urlData.publicUrl;
            }

            // Update device with new image URL
            const { error: deviceUpdateError } = await supabase
                .from('Device')
                .update({ image_url: imageUrl })
                .eq('device_id', device.device_id);

            if (deviceUpdateError) throw deviceUpdateError;
                const interfaceData = {
                    device_id: device.device_id,
                    interface_name: iface.interface_name,
                };
    
                // Add fields based on device type
                if (deviceType.device_type_id === 3) { // OLT
                    interfaceData.description = iface.description;
                    interfaceData.port_type = iface.port_type;
                    interfaceData.link_mode = iface.link_mode;
                    interfaceData.capacity = iface.capacity;
                } else if (deviceType.device_type_id === 1) { // Router
                    interfaceData.capacity = iface.capacity;
                    interfaceData.link_protocol = iface.link_protocol;
                }
    
                let result;
                if (iface.interface_id) {
                    // Update existing interface
                    result = await supabase
                        .from('Interface')
                        .update(interfaceData)
                        .eq('interface_id', iface.interface_id);
                } else {
                    // Insert new interface
                    result = await supabase
                        .from('Interface')
                        .insert(interfaceData)
                        .select();
                }
    
                if (result.error) throw result.error;
    
                // If this is a new interface, we need to add it to the PortDevice table
                if (!iface.interface_id && result.data && result.data[0]) {
                    const newInterfaceId = result.data[0].interface_id;
                    const portDeviceResult = await supabase
                        .from('PortDevice')
                        .insert({
                            device_id: device.device_id,
                            interface_id: newInterfaceId,
                            port_number: iface.port_number,
                        });
    
                    if (portDeviceResult.error) throw portDeviceResult.error;
                } else if (iface.interface_id) {
                    // Update port number in PortDevice if needed
                    const portDeviceResult = await supabase
                        .from('PortDevice')
                        .update({ port_number: iface.port_number })
                        .eq('interface_id', iface.interface_id)
                        .eq('device_id', device.device_id);
    
                    if (portDeviceResult.error) throw portDeviceResult.error;
                }
            }
    
            alert('Device and interfaces updated successfully!');
            setDeviceImage(imageUrl);
            setNewDeviceImage(null);
            fetchDeviceAndInterfaces();
        } catch (error) {
            console.error('Error updating device and interfaces:', error);
            alert('Failed to update device and interfaces. Check console for details.');
        }
    };

    const renderInterfaceFields = (iface, index) => {
        const interfacePrefix = "Gigabit 0/0/";
        const renderInterfaceNameInput = () => (
            <label>
                Interface Name:
                <div className="flex">
                    <span className="bg-gray-100 border border-r-0 rounded-l px-2 py-2 text-gray-500">
                        {interfacePrefix}
                    </span>
                    <input
                        type="text"
                        value={iface.interface_name}
                        onChange={(e) => handleInterfaceChange(index, 'interface_name', e.target.value)}
                        className="block w-full p-2 border rounded-r"
                        placeholder=""
                    />
                </div>
                <p className="mt-1 text-sm text-gray-600">Full Interface Name: {interfacePrefix}{iface.interface_name}</p>
            </label>
        );
    
        switch (deviceType.device_type_id) {
            case 2: // Switch
                return (
                    <>
                        {renderInterfaceNameInput()}
                    </>
                );
            case 3: // OLT
                return (
                    <>
                        {renderInterfaceNameInput()}
                        <label>
                            Description:
                            <input
                                type="text"
                                value={iface.description}
                                onChange={(e) => handleInterfaceChange(index, 'description', e.target.value)}
                                className="block w-full mt-1 p-2 border rounded"
                            />
                        </label>
                        <label>
                            Port Type:
                            <input
                                type="text"
                                value={iface.port_type}
                                onChange={(e) => handleInterfaceChange(index, 'port_type', e.target.value)}
                                className="block w-full mt-1 p-2 border rounded"
                            />
                        </label>
                        <label>
                            Link Mode:
                            <input
                                type="text"
                                value={iface.link_mode}
                                onChange={(e) => handleInterfaceChange(index, 'link_mode', e.target.value)}
                                className="block w-full mt-1 p-2 border rounded"
                            />
                        </label>
                        <label>
                            Capacity:
                            <input
                                type="text"
                                value={iface.capacity}
                                onChange={(e) => handleInterfaceChange(index, 'capacity', e.target.value)}
                                className="block w-full mt-1 p-2 border rounded"
                            />
                        </label>
                    </>
                );
            case 1: // Router
                return (
                    <>
                        {renderInterfaceNameInput()}
                        <label>
                            Capacity:
                            <input
                                type="text"
                                value={iface.capacity}
                                onChange={(e) => handleInterfaceChange(index, 'capacity', e.target.value)}
                                className="block w-full mt-1 p-2 border rounded"
                            />
                        </label>
                        <label>
                            Link Protocol:
                            <input
                                type="text"
                                value={iface.link_protocol}
                                onChange={(e) => handleInterfaceChange(index, 'link_protocol', e.target.value)}
                                className="block w-full mt-1 p-2 border rounded"
                            />
                        </label>
                    </>
                );
            default:
                return null;
        }
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!device || !deviceType) {
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
                <span>Device Details: {device.device_name}</span>
            </div>
            
            <div className="p-5">
                <div className="mt-6">
                    {/* <h3 className="text-xl font-semibold mb-2">Device Image</h3> */}
                    {deviceImage && (
                        <img
                            src={deviceImage}
                            alt="Device"
                            className="mt-2 max-w-50 h-50 mb-4"
                        />
                    )}
                    {newDeviceImage && (
                        <img
                            src={URL.createObjectURL(newDeviceImage)}
                            alt="New device preview"
                            className="mt-2 max-w-full h-auto mb-4"
                        />
                    )}
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="mb-4"
                    />
                </div>

                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-2">Ports</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {interfaces.map((iface, index) => (
                            <div key={index} className="bg-white border rounded-lg shadow-md p-4 dark:bg-gray-300 dark:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-400">
                                <h4 className="text-lg font-semibold">Port {iface.port_number}</h4>
                                {renderInterfaceFields(iface, index)}
                                <p className="mt-2">Full Interface Name: Gigabit 0/0/{iface.interface_name}</p>
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