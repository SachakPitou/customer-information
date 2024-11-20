"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import LoadingSpinner from '@/app/component/LoadingSpinner';

type Device = {
    device_id: string;
    device_name: string;
    image_url: string;
    device_type_id: number;
};

type Interface = {
    port_number: number;
    interface_id?: string;
    device_id: string;
    interface_name: string;
    description?: string | null;
    port_type?: string | null;
    link_mode?: string | null;
    capacity?: string | null;
    link_protocol?: string | null;
};

type PortDevice = {
    device_id: string;
    interface_id: string;
    port_number: number;
};
type DeviceType = {
    device_type_id: number;
    device_type: string;
    // Add any other fields that exist in your Device Type table
};
// For the frontend, we'll use a combined type
type InterfaceWithPort = Interface & {
    port_number: number;
};

export default function ViewDevice() {
    const [device, setDevice] = useState<Device | null>(null);
    const [deviceType, setDeviceType] = useState<DeviceType | null>(null);
    const [interfaces, setInterfaces] = useState<Interface[]>([]);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const [deviceImage, setDeviceImage] = useState<string | null>(null);
    const [newDeviceImage, setNewDeviceImage] = useState<File | null>(null);
    const params = useParams();
    const device_id = params.device_id as string;


    const fetchDeviceAndInterfaces = async () => {
        try {
            if (!device_id) return;
    
            // Fetch device data
            const { data: deviceData, error: deviceError } = await supabase
                .from('Device')
                .select('*')
                .eq('device_id', device_id)
                .single();
    
            if (deviceError) throw deviceError;
            setDevice(deviceData);
    
            // Fetch device type
            const { data: deviceTypeData, error: deviceTypeError } = await supabase
                .from('Device Type')
                .select('*')
                .eq('device_type_id', deviceData.device_type_id)
                .single();
    
            if (deviceTypeError) throw deviceTypeError;
            setDeviceType(deviceTypeData);
    
            // Fetch interfaces with port numbers
            const { data: interfacesData, error: interfacesError } = await supabase
                .from('Interface')
                .select(`
                    *,
                    PortDevice(port_number)
                `)
                .eq('device_id', device_id);
    
            if (interfacesError) throw interfacesError;
    
            // Transform the data to correctly handle the nested PortDevice array
            const transformedInterfaces = interfacesData.map(iface => {
                const portDevice = Array.isArray(iface.PortDevice) ? iface.PortDevice[0] : null;
                return {
                    ...iface,
                    port_number: portDevice ? portDevice.port_number : undefined,
                    PortDevice: undefined // Remove the nested PortDevice array
                };
            });
    
            // Sort interfaces by port number
            const sortedInterfaces = transformedInterfaces.sort((a, b) => 
                (a.port_number || 0) - (b.port_number || 0)
            );
    
            console.log('Transformed interfaces:', sortedInterfaces); // For debugging
            setInterfaces(sortedInterfaces);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error instanceof Error ? error.message : String(error));
        }
    };

    useEffect(() => {
        fetchDeviceAndInterfaces();
    }, [device_id]);

    const handleInterfaceChange = (index: number, field: keyof Interface, value: string) => {
        const newInterfaces = [...interfaces];
        newInterfaces[index] = {
            ...newInterfaces[index],
            [field]: value
        };
        setInterfaces(newInterfaces);
    };

    const handleAddInterface = () => {
        const nextPortNumber = interfaces.length > 0 
            ? Math.max(...interfaces.map(i => i.port_number || 0)) + 1 
            : 1;
    
        if (!device || !device.device_id) {
            alert('Device information is missing. Please refresh the page and try again.');
            return;
        }
    
        let newInterface: Interface = {
            device_id: device.device_id,
            interface_name: `Port ${nextPortNumber}`, // Provide a default name
            port_number: nextPortNumber,
        };
    
        // Add additional fields based on device type
        if (deviceType) {
            switch (deviceType.device_type_id) {
                case 3: // OLT
                    newInterface = {
                        ...newInterface,
                        description: '',
                        port_type: '',
                        link_mode: '',
                        capacity: '',
                    };
                    break;
                case 1: // Router
                    newInterface = {
                        ...newInterface,
                        capacity: '',
                        link_protocol: '',
                    };
                    break;
                // Add cases for other device types if needed
            }
        }
    
        setInterfaces([...interfaces, newInterface]);
    };

    const handleSave = async () => {
        if (!device || !device.device_id) {
            alert('Device information is missing. Please refresh the page and try again.');
            return;
        }
    
        try {
            let imageUrl = device.image_url;

            if (newDeviceImage) {
                const filePath = `images/${Date.now()}-${device.device_name}`;
                const { error: uploadError, data } = await supabase.storage
                    .from('Device Image')
                    .upload(filePath, newDeviceImage);
            
                if (uploadError) throw uploadError;
            
                if (data) {
                    const { data: urlData } = supabase.storage
                        .from('Device Image')
                        .getPublicUrl(data.path);
                
                    if (urlData) {
                        imageUrl = urlData.publicUrl;
                    }
                }
            }

            // Update device with new image URL
            const { error: deviceUpdateError } = await supabase
                .from('Device')
                .update({ image_url: imageUrl })
                .eq('device_id', device.device_id);

            if (deviceUpdateError) throw deviceUpdateError;
            
            for (let iface of interfaces) {
                // Prepare interface data
                const interfaceData: Partial<Interface> = {
                    device_id: device.device_id,
                    interface_name: iface.interface_name || `Interface ${iface.port_number}`,
                };
    
                // Add type-specific fields
                if (deviceType) {
                    if (deviceType.device_type_id === 3) { // OLT
                        interfaceData.description = iface.description || undefined;
                        interfaceData.port_type = iface.port_type || undefined;
                        interfaceData.link_mode = iface.link_mode || undefined;
                        interfaceData.capacity = iface.capacity || undefined;
                    } else if (deviceType.device_type_id === 1) { // Router
                        interfaceData.capacity = iface.capacity || undefined;
                        interfaceData.link_protocol = iface.link_protocol || undefined;
                    }
                }
    
                let interfaceResult;
                if (iface.interface_id) {
                    // Update existing interface
                    interfaceResult = await supabase
                        .from('Interface')
                        .update(interfaceData)
                        .eq('interface_id', iface.interface_id);
                    
                    // Update port number in PortDevice
                    const portDeviceUpdateResult = await supabase
                        .from('PortDevice')
                        .update({ port_number: iface.port_number })
                        .eq('interface_id', iface.interface_id)
                        .eq('device_id', device.device_id);
    
                    if (portDeviceUpdateResult.error) throw portDeviceUpdateResult.error;
                } else {
                    // Insert new interface
                    interfaceResult = await supabase
                        .from('Interface')
                        .insert(interfaceData)
                        .select()
                        .single();
    
                    if (interfaceResult.error) throw interfaceResult.error;
                    if (!interfaceResult.data) throw new Error('No data returned from interface insert');
    
                    // Insert into PortDevice
                    const portDeviceInsertResult = await supabase
                        .from('PortDevice')
                        .insert({
                            device_id: device.device_id,
                            interface_id: interfaceResult.data.interface_id,
                            port_number: iface.port_number
                        });
    
                    if (portDeviceInsertResult.error) throw portDeviceInsertResult.error;
                }
    
                if (interfaceResult.error) throw interfaceResult.error;
            }
    
            alert('Device and interfaces updated successfully!');
            fetchDeviceAndInterfaces();
        } catch (error) {
            console.error('Error updating device and interfaces:', error);
            alert('Failed to update device and interfaces. Check console for details.');
        }
    };
    const handleDeleteInterface = async (index: number) => {
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
                if (iface.interface_id && device) {
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
            console.error('Error deleting interface:', error);
            alert('Failed to delete interface. Check console for details.');
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewDeviceImage(file);
            setDeviceImage(URL.createObjectURL(file)); // Preview the new image
        }
    };


    const renderInterfaceFields = (iface: Interface, index: number) => {
        const renderInterfaceNameInput = () => (
            <label>
                Interface Name:
                <input
                    type="text"
                    value={iface.interface_name}
                    onChange={(e) => handleInterfaceChange(index, 'interface_name', e.target.value)}
                    className="block w-full p-2 border rounded"
                    placeholder="Enter interface name"
                />
            </label>
        );
    
        if (!deviceType) return null;

        switch (deviceType.device_type_id) {
            case 2: // Switch
                return (
                    <>  
                        {/* <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold">Port {iface.port_number}</h4>
                            <span className="text-sm text-gray-500">#{iface.port_number}</span>
                        </div> */}
                        {renderInterfaceNameInput()}
                    </>
                );
            case 3: // OLT
                return (
                    <>  
                        {/* <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold">Port {iface.port_number}</h4>
                            <span className="text-sm text-gray-500">#{iface.port_number}</span>
                        </div> */}
                        {renderInterfaceNameInput()}
                        <label>
                            Description:
                            <input
                                type="text"
                                value={iface.description || ""}
                                onChange={(e) => handleInterfaceChange(index, 'description', e.target.value)}
                                className="block w-full mt-1 p-2 border rounded"
                            />
                        </label>
                        <label>
                            Port Type:
                            <input
                                type="text"
                                value={iface.port_type || ""}
                                onChange={(e) => handleInterfaceChange(index, 'port_type', e.target.value)}
                                className="block w-full mt-1 p-2 border rounded"
                            />
                        </label>
                        <label>
                            Link Mode:
                            <input
                                type="text"
                                value={iface.link_mode || ""} 
                                onChange={(e) => handleInterfaceChange(index, 'link_mode', e.target.value)}
                                className="block w-full mt-1 p-2 border rounded"
                            />
                        </label>
                        <label>
                            Capacity:
                            <input
                                type="text"
                                value={iface.capacity || ""}
                                onChange={(e) => handleInterfaceChange(index, 'capacity', e.target.value)}
                                className="block w-full mt-1 p-2 border rounded"
                            />
                        </label>
                    </>
                );
            case 1: // Router
                return (
                    <>
                        {/* <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold">Port {iface.port_number}</h4>
                            <span className="text-sm text-gray-500">#{iface.port_number}</span>
                        </div> */}
                        {renderInterfaceNameInput()}
                        <label>
                            Capacity:
                            <input
                                type="text"
                                value={iface.capacity || ""}
                                onChange={(e) => handleInterfaceChange(index, 'capacity', e.target.value)}
                                className="block w-full mt-1 p-2 border rounded"
                            />
                        </label>
                        <label>
                            Link Protocol:
                            <input
                                type="text"
                                value={iface.link_protocol || ""}
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
        return <LoadingSpinner />;
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
                    <h3 className="text-xl font-semibold mb-2">Device Image</h3>
                    {device && device.image_url && (
                        <img
                            src={device.image_url}
                            alt="Device"
                            className="mt-2 max-w-xs h-auto mb-4"
                            onError={(e) => {
                                console.error("Error loading image:", e);
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    )}
                    <input 
                        type="file" 
                        accept="image/*"  // Note: Fixed the accept attribute
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
                                <p className="mt-2">Interface Name: {iface.interface_name}</p>
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