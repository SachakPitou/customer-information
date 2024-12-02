"use client";
import React, { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import LoadingSpinner from '@/app/component/LoadingSpinner';
import { v4 as uuidv4 } from 'uuid';

interface Rack {
    rack_id: string;
    rack_name: string;
    location_id: number;
    pop_id: number;
    ups_id: number;
    rack_type: string;
    rack_brand: string;
    dimension: string;
    numberOfU: number;
    image_url?: string;
    location_name: string;
    pop_name: string;
    ups_name: string;
}

interface DeviceData {
    device_id: number;
    device_name: string;
}

interface Device {
    rack_device_id: number;
    u_position: number;
    device_id: number | null;
    device_name: string;
}

interface Location {
    location_id: number;
    location_name: string;
}

interface POP {
    pop_id: number;
    pop_name: string;
    location_id: number;
}

interface UPS {
    ups_id: number;
    ups_name: string;
}

export default function ViewRack() {
    const [rack, setRack] = useState<Rack | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [allDevices, setAllDevices] = useState<DeviceData[]>([]);
    const [allLocations, setAllLocations] = useState<Location[]>([]);
    const [allPops, setAllPops] = useState<POP[]>([]);
    const [allUPSs, setAllUPSs] = useState<UPS[]>([]);
    const [filteredPops, setFilteredPops] = useState<POP[]>([]);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editedValue, setEditedValue] = useState<string>('');
    const [editedPop, setEditedPop] = useState<string>('');
    const [editedUps, setEditedUps] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const router = useRouter();
    const params = useParams();
    const rack_id = params.rack_id as string;
    const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type and size
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            const maxSize = 5 * 1024 * 1024; // 5MB

            if (!validTypes.includes(file.type)) {
                alert('Invalid file type. Please upload a JPEG, PNG, or GIF.');
                return;
            }

            if (file.size > maxSize) {
                alert('File is too large. Maximum size is 5MB.');
                return;
            }

            setImageFile(file);
            
            // Create a preview of the image
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImageToStorage = async (): Promise<string | null> => {
        if (!imageFile || !rack) return null;

        try {
            // Generate a unique filename
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${rack.rack_id}_${uuidv4()}.${fileExt}`;
            const filePath = `images/${fileName}`;

            // Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('Rack Image')
                .upload(filePath, imageFile);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                alert('Failed to upload image');
                return null;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('Rack Image')
                .getPublicUrl(filePath);

            return urlData?.publicUrl || null;
        } catch (error) {
            console.error('Error in image upload:', error);
            alert('An error occurred while uploading the image');
            return null;
        }
    };

    const handleSaveImage = async () => {
        if (!imageFile) return;

        try {
            // Upload image and get URL
            const imageUrl = await uploadImageToStorage();

            if (imageUrl) {
                // Update rack with new image URL
                const { error } = await supabase
                    .from('Rack')
                    .update({ image_url: imageUrl })
                    .eq('rack_id', rack_id);

                if (error) throw error;

                // Update local state
                setRack(prev => prev ? { ...prev, image_url: imageUrl } : null);
                
                // Reset image states
                setImageFile(null);
                setImagePreview(null);
                setEditingField(null);
            }
        } catch (error) {
            console.error('Error saving image:', error);
            alert('Failed to save image');
        }
    };
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
                const upsId = rackData.ups_id;

                const [popData, locationData, upsData] = await Promise.all([
                    supabase.from('POP').select('pop_id, pop_name').eq('pop_id', popId).single(),
                    supabase.from('Location').select('location_id, location_name').eq('location_id', locationId).single(),
                    supabase.from('UPS').select('ups_id, ups_name').eq('ups_id', upsId).single(),
                ]);
    
                setRack({
                    ...rackData,
                    location_name: locationData.data?.location_name || 'Unknown Location',
                    pop_name: popData.data?.pop_name || 'Unknown POP',
                    ups_name: upsData.data?.ups_name || 'Unknown UPS',
                });

                const { data: deviceLocationsData, error: devicesError } = await supabase
                    .from('Rack Device')
                    .select('rack_device_id, u_position, device_id')
                    .eq('rack_id', rack_id);
    
                if (devicesError) throw devicesError;
    
                const validDeviceIds = deviceLocationsData
                    .filter(device => device.device_id !== null)
                    .map(device => device.device_id);
    
                let deviceMap: Record<number, string> = {};
    
                if (validDeviceIds.length > 0) {
                    const { data: devicesData, error: devicesDataError } = await supabase
                        .from('Device')
                        .select('device_id, device_name')
                        .in('device_id', validDeviceIds);
    
                    if (devicesDataError) throw devicesDataError;
    
                    deviceMap = devicesData.reduce((acc: Record<number, string>, device) => {
                        acc[device.device_id] = device.device_name;
                        return acc;
                    }, {});
                }
    
                const updatedDevicesData = deviceLocationsData.map(device => ({
                    ...device,
                    device_name: device.device_id ? deviceMap[device.device_id] || 'Unknown Device' : 'Empty'
                }));
    
                setDevices(updatedDevicesData);

                const [allDevicesData, allLocationsData, allPopsData, allUPSsData] = await Promise.all([
                    supabase.from('Device').select('device_id, device_name'),
                    supabase.from('Location').select('location_id, location_name'),
                    supabase.from('POP').select('pop_id, pop_name, location_id'),
                    supabase.from('UPS').select('ups_id, ups_name'),
                ]);

                setAllDevices(allDevicesData.data || []);
                setAllLocations(allLocationsData.data || []);
                setAllPops(allPopsData.data || []);
                setAllUPSs(allUPSsData.data || []);

            } catch (error) {
                console.error('Error fetching data:', (error as Error).message);
            } finally {
                setLoading(false);
            }
        }
    
        fetchRack();
    }, [rack_id]);
        
    const handleEditField = (field: string) => {
        setEditingField(field);
        if (field === 'location_name') {
            setEditedValue(rack?.location_id.toString() || '');
        } else if (field === 'pop_name') {
            setEditedValue(rack?.pop_id.toString() || '');
        } else if (field === 'ups_name') {
            setEditedUps(rack?.ups_id.toString() || '');
        } else {
            setEditedValue(rack?.[field as keyof Rack]?.toString() || '');
        }
    };

    const handleLocationChange = (selectedLocationId: string) => {
        setEditedValue(selectedLocationId);
        const popsInLocation = allPops.filter(pop => pop.location_id === parseInt(selectedLocationId));
        setFilteredPops(popsInLocation);
        setEditedPop('');
    };

    const handleSaveField = async () => {
        try {
            let updateData: Record<string, string | number> = {};
            if (editingField === 'location_name') {
                updateData = { location_id: parseInt(editedValue) };
                if (editedPop) {
                    updateData.pop_id = parseInt(editedPop);
                }
            } else if (editingField === 'pop_name') {
                updateData = { pop_id: parseInt(editedPop) };
            } else if (editingField === 'ups_name') {
                updateData = { ups_id: parseInt(editedUps) };
            } else if (editingField) {
                updateData = { [editingField]: editedValue };
            }
    
            const { error } = await supabase
                .from('Rack')
                .update(updateData)
                .eq('rack_id', rack_id);
    
            if (error) throw error;
    
            const { data: updatedRackData, error: rackError } = await supabase
                .from('Rack')
                .select('*')
                .eq('rack_id', rack_id)
                .single();
            if (rackError) throw rackError;
    
            if (rack && updatedRackData) {
                setRack({
                    ...rack,
                    ...updatedRackData,
                    location_name: allLocations.find(location => location.location_id === updatedRackData.location_id)?.location_name || 'Unknown Location',
                    pop_name: allPops.find(pop => pop.pop_id === updatedRackData.pop_id)?.pop_name || 'Unknown POP',
                    ups_name: allUPSs.find(ups => ups.ups_id === updatedRackData.ups_id)?.ups_name || 'Unknown UPS'
                });
            }
    
            setEditingField(null);
        } catch (error) {
            console.error('Error updating rack information:', (error as Error).message);
        }
    };

    // Pre-process devices to create a map from u_position to device
    const deviceMap = devices.reduce((acc: Record<number, string>, device) => {
        acc[device.u_position] = device.device_name;
        return acc;
    }, {});

    if (loading) {
        return <LoadingSpinner />;
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
                                        <span>{rack?.rack_name}</span>
                                        <button
                                            className="ml-2 bg-red-500 text-white px-2 py-1 rounded-md"
                                            onClick={() => handleEditField('rack_name')}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>
                            {rack?.image_url && (
                                <div className="flex flex-col mt-4">
                                    <span className="font-semibold mr-2">Rack Image:</span>
                                    {editingField === 'image_url' ? (
                                        <div className="flex flex-col items-start">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/gif"
                                                onChange={handleImageUpload}
                                                className="mb-2"
                                            />
                                            {imagePreview && (
                                                <img 
                                                    src={imagePreview} 
                                                    alt="Preview" 
                                                    className="w-32 h-32 object-cover mb-2"
                                                />
                                            )}
                                            {imageFile && (
                                                <button
                                                    className="bg-green-500 text-white px-2 py-1 rounded-md"
                                                    onClick={handleSaveImage}
                                                >
                                                    Save Image
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <img 
                                                src={rack.image_url} 
                                                alt="Rack" 
                                                className="w-32 h-32 object-cover mr-2"
                                            />
                                            <button
                                                className="ml-2 bg-red-500 text-white px-2 py-1 rounded-md"
                                                onClick={() => setEditingField('image_url')}
                                            >
                                                Upload New Image
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
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
                                        <span>{rack?.location_name}</span>
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
                                        <span>{rack?.pop_name}</span>
                                        <button
                                            className="ml-2 bg-red-500 text-white px-2 py-1 rounded-md"
                                            onClick={() => handleEditField('pop_name')}
                                            disabled={!rack?.location_id}  // Disable if no location is set
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
                                            <span>{rack?.rack_type}</span>
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
                                            <span>{rack?.rack_brand}</span>
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
                                            <span>{rack?.dimension}</span>
                                            <button
                                                className="ml-2 bg-red-500 text-white px-2 py-1 rounded-md"
                                                onClick={() => handleEditField('dimension')}
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col mt-4">
                                    <span className="font-semibold mr-2">UPS Name:</span>
                                    {editingField === 'ups_name' ? (
                                        <div className="flex items-center">
                                            <select
                                                className="border border-gray-300 p-1 rounded-md mr-2"
                                                value={editedUps}
                                                onChange={(e) => setEditedUps(e.target.value)}
                                            >
                                                <option value="">Select UPS</option>
                                                {allUPSs.map(ups => (
                                                    <option key={ups.ups_id} value={ups.ups_id}>
                                                        {ups.ups_name}
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
                                            <span>{rack?.ups_name}</span>
                                            <button
                                                className="ml-2 bg-red-500 text-white px-2 py-1 rounded-md"
                                                onClick={() => handleEditField('ups_name')}
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
                    {[...Array(rack?.numberOfU)].map((_, index) => {
                        const deviceName = deviceMap[index + 1] || 'Empty';

                        return (
                            <tr key={index} className="bg-white border-b dark:bg-gray-300 dark:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-400">
                                <td className="px-6 py-4">{index + 1}</td>
                                <td className="px-6 py-4">
                                    {deviceName}
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