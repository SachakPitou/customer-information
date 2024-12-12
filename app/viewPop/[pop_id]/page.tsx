"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  ChevronLeft, 
  Server, 
  MapPin 
} from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/app/component/LoadingSpinner';

type Rack = {
    rack_id: string;
    rack_name: string;
    location_id: string;
    pop_id: string;
    image_url: string;
    location_name: string;
};

export default function ViewPOP() {
    const [racks, setRacks] = useState<Rack[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRack, setSelectedRack] = useState<Rack | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const pop_id = params.pop_id as string;

    useEffect(() => {
        async function fetchRacks() {
            try {
                if (!pop_id) return;
                setIsLoading(true);

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
                    locationsData.map((loc) => [loc.location_id, loc.location_name])
                );

                const racksWithDetails: Rack[] = racksData.map((rack: Rack) => ({
                    ...rack,
                    location_name: locationMap[rack.location_id] || 'Unknown Location',
                }));

                setRacks(racksWithDetails);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error instanceof Error ? error.message : String(error));
                setIsLoading(false);
            }
        }

        fetchRacks();
    }, [pop_id]);

    const handleRackClick = (rack_id: string) => {
        router.push(`/viewRack/${rack_id}`);
    };

    const openDeleteModal = (rack: Rack, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedRack(rack);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteRack = async () => {
        if (!selectedRack) return;

        try {
            const { error } = await supabase
                .from('Rack')
                .delete()
                .eq('rack_id', selectedRack.rack_id);

            if (error) throw error;

            setRacks(racks.filter(rack => rack.rack_id !== selectedRack.rack_id));
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Error deleting rack:', error);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center mb-8">
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="mr-4"
                    onClick={() => router.back()}
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold flex items-center">
                    <Server className="mr-3 text-red-600" />
                    Racks in Point of Presence (POP)
                </h1>
            </div>

            {racks.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                    No racks found for this POP.
                </div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                >
                    {racks.map((rack) => (
                        <motion.div 
                            key={rack.rack_id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Card 
                                className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                                onClick={() => handleRackClick(rack.rack_id)}
                            >
                                <div className="relative">
                                    <img 
                                        src={rack.image_url} 
                                        alt={rack.rack_name} 
                                        className="w-full h-48 object-cover rounded-t-lg"
                                    />
                                    <Button 
                                        size="icon" 
                                        variant="destructive" 
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => openDeleteModal(rack, e)}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                                <CardContent className="p-4">
                                    <h3 className="text-lg font-semibold mb-2">{rack.rack_name}</h3>
                                    <div className="flex items-center text-sm text-gray-600 mb-1">
                                        <MapPin className="mr-2 h-4 w-4 text-red-500" />
                                        {rack.location_name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        POP ID: {rack.pop_id}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}

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