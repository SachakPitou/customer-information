"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import LoadingSpinner from '@/app/component/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Rack = {
    rack_id: string;
    rack_name: string;
    location_id: string;
    pop_id: string;
    image_url: string;
    location_name: string;
};

type Location = {
    location_id: string;
    location_name: string;
};

export default function ViewPOP() {
    const [racks, setRacks] = useState<Rack[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRack, setSelectedRack] = useState<Rack | null>(null);
    const router = useRouter();
    const params = useParams();
    const pop_id = params.pop_id as string;

    useEffect(() => {
        async function fetchRacks() {
            try {
                if (!pop_id) return;

                const { data: racksData, error: racksError } = await supabase
                    .from('Rack')
                    .select('*')
                    .eq('pop_id', pop_id);

                if (racksError) throw racksError;

                const locationIds = racksData.map((rack) => rack.location_id);

                const { data: locationsData, error: locationsError } = await supabase
                    .from('Location')
                    .select('location_id, location_name')
                    .in('location_id', locationIds);

                if (locationsError) throw locationsError;

                const locationMap: { [key: string]: string } = Object.fromEntries(
                    locationsData.map((loc: Location) => [loc.location_id, loc.location_name])
                );

                const racksWithDetails: Rack[] = racksData.map((rack: Rack) => ({
                    ...rack,
                    location_name: locationMap[rack.location_id] || 'Unknown Location',
                }));

                setRacks(racksWithDetails);
            } catch (error) {
                console.error('Error fetching data:', error instanceof Error ? error.message : String(error));
            }
        }

        fetchRacks();
    }, [pop_id]);

    const handleRackClick = (rack_id: string) => {
        router.push(`/viewRack/${rack_id}`);
    };

    const openDeleteModal = (rack: Rack, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering rack view
        setSelectedRack(rack);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteRack = async () => {
        if (!selectedRack) return;

        try {
            // Delete the rack from the Rack table
            const { error } = await supabase
                .from('Rack')
                .delete()
                .eq('rack_id', selectedRack.rack_id);

            if (error) throw error;

            // Remove the deleted rack from the state
            setRacks(racks.filter(rack => rack.rack_id !== selectedRack.rack_id));
            
            // Close the modal
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Error deleting rack:', error);
            // Optionally, show an error toast or alert
        }
    };

    if (racks.length === 0) {
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
                <span>Racks in POP:</span>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {racks.map((rack) => (
                    <div 
                        key={rack.rack_id} 
                        className="relative bg-white border rounded-lg shadow-md p-4 dark:bg-gray-300 dark:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-400 cursor-pointer"
                        onClick={() => handleRackClick(rack.rack_id)}
                    >
                        <div className="flex flex-col items-center">
                            <img 
                                src={rack.image_url} 
                                alt={rack.rack_name} 
                                className="w-full h-40 object-cover rounded-lg mb-4"
                            />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold mb-2">{rack.rack_name}</h3>
                                <p className="text-gray-700 dark:text-gray-600">Location: {rack.location_name}</p>
                                <p className="text-gray-700 dark:text-gray-600">POP ID: {rack.pop_id}</p>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => openDeleteModal(rack, e)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                            title="Delete Rack"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Rack</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the rack "{selectedRack?.rack_name}"? 
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDeleteRack}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}