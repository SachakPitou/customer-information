"use client";
import React, { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import LoadingSpinner from '@/app/component/LoadingSpinner';
import { v4 as uuidv4 } from 'uuid';
import { 
    ChevronLeft, 
    Edit2, 
    Save, 
    Upload, 
    MapPin, 
    Server, 
    Package, 
    TrendingUp, 
    ImagePlus,
    XCircle 
} from 'lucide-react';

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
            const popsInLocation = allPops.filter(pop => 
                pop.location_id === rack?.location_id
            );
            setFilteredPops(popsInLocation);
            setEditedPop('');
        } else if (field === 'pop_name') {
            setEditedPop(rack?.pop_id.toString() || '');
        } else if (field === 'ups_name') {
            setEditedUps(rack?.ups_id.toString() || '');
        } else {
            setEditedValue(rack?.[field as keyof Rack]?.toString() || '');
        }
    };

    const handleLocationChange = (selectedLocationId: string) => {
        setEditedValue(selectedLocationId);
        const popsInLocation = allPops.filter(pop => 
            pop.location_id === parseInt(selectedLocationId)
        );
        setFilteredPops(popsInLocation);
        setEditedPop('');
    };

    const handleSaveField = async () => {
        try {
            if (!editingField) return;

            let updateData: Record<string, string | number> = {};
            
            switch (editingField) {
                case 'location_name':
                    if (!editedValue) {
                        alert('Please select a location');
                        return;
                    }
                    updateData = { 
                        location_id: parseInt(editedValue),
                        // If a new POP is selected, update that too
                        ...(editedPop && { pop_id: parseInt(editedPop) })
                    };
                    break;
                
                case 'pop_name':
                    if (!editedPop) {
                        alert('Please select a POP');
                        return;
                    }
                    updateData = { pop_id: parseInt(editedPop) };
                    break;
                
                case 'ups_name':
                    if (!editedUps) {
                        alert('Please select a UPS');
                        return;
                    }
                    updateData = { ups_id: parseInt(editedUps) };
                    break;
                
                default:
                    if (!editedValue.trim()) {
                        alert('Field cannot be empty');
                        return;
                    }
                    updateData = { [editingField]: editedValue };
            }

            const { error } = await supabase
                .from('Rack')
                .update(updateData)
                .eq('rack_id', rack_id);

            if (error) throw error;

            // Refetch the updated rack data to ensure consistency
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
            alert('Failed to update rack information');
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
        
        <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
            {editingField === 'location_name' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-xl font-semibold mb-4">Edit Location</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Location</label>
                            <select
                                value={editedValue}
                                onChange={(e) => handleLocationChange(e.target.value)}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="">Select Location</option>
                                {allLocations.map((location) => (
                                    <option 
                                        key={location.location_id} 
                                        value={location.location_id.toString()}
                                    >
                                        {location.location_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {editedValue && (
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Point of Presence</label>
                                <select
                                    value={editedPop}
                                    onChange={(e) => setEditedPop(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">Select POP</option>
                                    {filteredPops.map((pop) => (
                                        <option 
                                            key={pop.pop_id} 
                                            value={pop.pop_id.toString()}
                                        >
                                            {pop.pop_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={() => setEditingField(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveField}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingField === 'pop_name' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-xl font-semibold mb-4">Edit Point of Presence</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Point of Presence</label>
                            <select
                                value={editedPop}
                                onChange={(e) => setEditedPop(e.target.value)}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="">Select POP</option>
                                {allPops.map((pop) => (
                                    <option 
                                        key={pop.pop_id} 
                                        value={pop.pop_id.toString()}
                                    >
                                        {pop.pop_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={() => setEditingField(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveField}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingField === 'ups_name' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-xl font-semibold mb-4">Edit UPS</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">UPS</label>
                            <select
                                value={editedUps}
                                onChange={(e) => setEditedUps(e.target.value)}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="">Select UPS</option>
                                {allUPSs.map((ups) => (
                                    <option 
                                        key={ups.ups_id} 
                                        value={ups.ups_id.toString()}
                                    >
                                        {ups.ups_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={() => setEditingField(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveField}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingField === 'rack_type' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-xl font-semibold mb-4">Edit Rack Type</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Rack Type</label>
                            <input
                                type="text"
                                value={editedValue}
                                onChange={(e) => setEditedValue(e.target.value)}
                                className="w-full p-2 border rounded-md"
                                placeholder="Enter Rack Type"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={() => setEditingField(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveField}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingField === 'rack_brand' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-xl font-semibold mb-4">Edit Rack Brand</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Rack Brand</label>
                            <input
                                type="text"
                                value={editedValue}
                                onChange={(e) => setEditedValue(e.target.value)}
                                className="w-full p-2 border rounded-md"
                                placeholder="Enter Rack brand"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={() => setEditingField(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveField}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingField === 'dimension' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-xl font-semibold mb-4">Edit Rack Dimension</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Rack Dimension</label>
                            <input
                                type="text"
                                value={editedValue}
                                onChange={(e) => setEditedValue(e.target.value)}
                                className="w-full p-2 border rounded-md"
                                placeholder="e.g., 42U, 45U, 48U"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={() => setEditingField(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveField}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingField === 'image_url' && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
                    onClick={(e) => {
                        // Check if the click is directly on the overlay (not on the modal content)
                        if (e.target === e.currentTarget) {
                            setImagePreview(null);
                            setImageFile(null);
                            setEditingField(null);
                        }
                    }}
                >
                    <div 
                        className="bg-white p-6 rounded-lg shadow-xl w-96"
                        // Prevent clicks on the modal from triggering the overlay click handler
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-semibold mb-4">Upload Rack Image</h2>
                        <div className="mb-4">
                            <input 
                                type="file" 
                                accept="image/jpeg,image/png,image/gif"
                                onChange={handleImageUpload}
                                className="w-full p-2 border rounded-md"
                            />
                            {imagePreview && (
                                <div className="mt-4 flex flex-col items-center">
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        className="w-48 h-48 object-cover rounded-lg mb-4"
                                    />
                                    <button 
                                        onClick={handleSaveImage}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Confirm Upload
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setImagePreview(null);
                                            setImageFile(null);
                                            setEditingField(null);
                                        }}
                                        className="mt-2 text-red-600 hover:text-red-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-indigo-700 text-white p-6 flex items-center space-x-4">
                    <button 
                        onClick={() => router.back()} 
                        className="hover:bg-red-700 p-2 rounded-full transition-colors"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-2xl font-bold">Rack Details: {rack?.rack_name}</h1>
                </div>

                {/* Main Content Grid */}
                <div className="grid md:grid-cols-2 gap-8 p-8">
                    {/* Left Column - Rack Details */}
                    <div className="space-y-6">
                        <div className="bg-gray-100 rounded-lg p-6 shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                                    <MapPin className="mr-2 text-red-600" />
                                    Location & POP
                                </h2>
                            </div>

                            {/* Location */}
                            <div className="mb-4 flex justify-between items-center">
                                <div>
                                    <span className="text-gray-600">Location</span>
                                    <p className="font-medium text-gray-900">{rack?.location_name}</p>
                                </div>
                                <button 
                                    onClick={() => handleEditField('location_name')}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                    <Edit2 className="h-5 w-5" />
                                </button>
                            </div>

                            {/* POP */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-gray-600">Point of Presence</span>
                                    <p className="font-medium text-gray-900">{rack?.pop_name}</p>
                                </div>
                                {/* <button 
                                    onClick={() => handleEditField('pop_name')}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                    <Edit2 className="h-5 w-5" />
                                </button> */}
                            </div>
                        </div>

                        {/* Rack Image */}
                        <div className="bg-gray-100 rounded-lg p-6 shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                                    <ImagePlus className="mr-2 text-red-600" />
                                    Rack Image
                                </h2>
                            </div>
                            {rack?.image_url ? (
                                <div className="flex flex-col items-center">
                                    <img 
                                        src={rack.image_url} 
                                        alt="Rack" 
                                        className="w-64 h-64 object-cover rounded-lg mb-4 shadow-md"
                                    />
                                    <button 
                                        onClick={() => setEditingField('image_url')}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Change Image
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-gray-500 mb-4">No image uploaded</p>
                                    <button 
                                        onClick={() => setEditingField('image_url')}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Upload Image
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Additional Details */}
                    <div className="space-y-6">
                        <div className="bg-gray-100 rounded-lg p-6 shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                                    <Server className="mr-2 text-red-600" />
                                    Rack Specifications
                                </h2>
                            </div>

                            {/* Rack Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Rack Type', field: 'rack_type', icon: Package },
                                    { label: 'Rack Brand', field: 'rack_brand', icon: TrendingUp },
                                    { label: 'Dimension', field: 'dimension', icon: Server },
                                    { label: 'UPS Name', field: 'ups_name', icon: Package }
                                ].map(({ label, field, icon: Icon }) => (
                                    <div key={field} className="bg-white rounded-lg p-3 shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-xs text-gray-500">{label}</span>
                                                <p className="font-medium text-gray-900">
                                                    {rack?.[field as keyof Rack] || 'Not Set'}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => handleEditField(field)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Devices Section */}
                        <div className="bg-gray-100 rounded-lg p-6 shadow-md">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <Server className="mr-2 text-red-600" />
                                Rack Devices
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-red-100 text-red-800">
                                            <th className="p-3 text-left">U Position</th>
                                            <th className="p-3 text-left">Device</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...Array(rack?.numberOfU)].map((_, index) => {
                                            const deviceName = deviceMap[index + 1] || 'Empty';
                                            return (
                                                <tr 
                                                    key={index} 
                                                    className="border-b last:border-b-0 hover:bg-red-50 transition-colors"
                                                >
                                                    <td className="p-3">{index + 1}</td>
                                                    <td className="p-3">{deviceName}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}