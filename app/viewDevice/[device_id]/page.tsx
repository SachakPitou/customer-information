"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import LoadingSpinner from '@/app/component/LoadingSpinner';
import PopUpModal from '@/app/component/popUpmodal';
import { 
    ChevronLeft, 
    Camera, 
    Plus, 
    Save, 
    Trash2 
} from 'lucide-react';

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [updateMessage, setUpdateMessage] = useState<{ success?: string; error?: string } | null>(null);
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
            setUpdateMessage({ error: 'Device information is missing. Please refresh the page and try again.' });
            setIsModalOpen(true);
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
    
            setUpdateMessage({ success: `Device ${device.device_name} updated successfully!` });
            setIsModalOpen(true);
            fetchDeviceAndInterfaces();
        } catch (error) {
            console.error('Error updating device and interfaces:', error);
            setUpdateMessage({ error: 'Failed to update device and interfaces. Please try again.' });
            setIsModalOpen(true);
        }
    };
    const closeModal = () => {
        setIsModalOpen(false);
        setUpdateMessage(null);
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
        <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
            <div className="bg-white shadow-xl rounded-xl overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-red-500 to-purple-600 text-white p-6 flex items-center">
                    <button 
                        onClick={() => router.back()} 
                        className="hover:bg-red-600/30 rounded-full p-2 transition-colors mr-4"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-2xl font-bold flex-grow">
                        {device?.device_name || 'Device Details'}
                    </h1>
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                        {deviceType?.device_type || 'Unknown Type'}
                    </span>
                </div>

                {/* Content Grid */}
                <div className="grid md:grid-cols-2 gap-8 p-8">
                    {/* Device Image Section */}
                    <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center">
                        <h3 className="text-xl font-semibold mb-4 text-gray-700">Device Image</h3>
                        {device?.image_url ? (
                            <img
                                src={device.image_url}
                                alt="Device"
                                className="max-w-full h-64 object-cover rounded-lg shadow-md mb-4"
                            />
                        ) : (
                            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Camera className="h-12 w-12 text-gray-400" />
                            </div>
                        )}
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload} 
                            className="mt-4 w-full text-sm text-gray-500 
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-red-50 file:text-red-700
                            hover:file:bg-red-100"
                        />
                    </div>

                    {/* Ports Section */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-700">Ports</h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleAddInterface}
                                    className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
                                    title="Add Port"
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                    title="Save Changes"
                                >
                                    <Save className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {interfaces.map((iface, index) => (
                                <div 
                                    key={index} 
                                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-lg font-medium text-gray-800">
                                            Port {iface.port_number}
                                        </h4>
                                        <button
                                            onClick={() => handleDeleteInterface(index)}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                            title="Delete Port"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                    
                                    {renderInterfaceFields(iface, index)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <PopUpModal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={updateMessage?.success ? 'Success' : 'Error'}
                content={
                    <>
                        {updateMessage?.success && (
                            <p className="text-center text-green-700 mt-4">
                                {updateMessage.success}
                            </p>
                        )}
                        {updateMessage?.error && (
                            <p className="text-center text-red-700 mt-4">
                                {updateMessage.error}
                            </p>
                        )}
                    </>
                }
            />
        </div>
    );
}