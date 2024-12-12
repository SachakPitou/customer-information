"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Home, 
  Filter, 
  Search, 
  MapPin, 
  Edit, 
  Trash2, 
  Eye 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import LoadingSpinner from '../component/LoadingSpinner';

interface Pop {
  image_url: string;
  pop_id: number;
  pop_name: string;
  location_id: number;
  location_name: string;
}

export default function PopDetail() {
    const [pops, setPops] = useState<Pop[]>([]);
    const [filteredPops, setFilteredPops] = useState<Pop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchValue, setSearchValue] = useState('');
    const [searchField, setSearchField] = useState('all');
    const [locationFilter, setLocationFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [popToDelete, setPopToDelete] = useState<number | null>(null);
    const [locations, setLocations] = useState<string[]>([]);

    const router = useRouter();
    const popsPerPage = 12;

    useEffect(() => {
        async function fetchLocations() {
            try {
                const { data, error } = await supabase
                    .from('Location')
                    .select('location_name')
                    .order('location_name');

                if (error) throw error;

                // Extract location names and add 'All Locations'
                const locationNames = data.map(loc => loc.location_name);
                setLocations(['All', ...locationNames]);
            } catch (error) {
                console.error('Error fetching locations:', error);
            }
        }

        async function fetchPops() {
            try {
                setIsLoading(true);
                const { data: popsData, error } = await supabase.from('POP').select('*');
        
                if (error) throw error;

                const locationIds = popsData.map(pop => pop.location_id);

                const { data: locationsData, error: locationError } = await supabase
                    .from('Location')
                    .select('location_id, location_name')
                    .in('location_id', locationIds);

                if (locationError) throw locationError;

                const locationMap: {[key: number]: string} = Object.fromEntries(
                    locationsData.map(loc => [loc.location_id, loc.location_name])
                );

                const popsWithLocations = popsData.map(pop => ({
                    ...pop,
                    location_name: locationMap[pop.location_id] || 'Unknown Location',
                }));

                setPops(popsWithLocations);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setIsLoading(false);
            }
        }

        fetchLocations();
        fetchPops();
    }, []);

    useEffect(() => {
        // Filter pops whenever search or filter changes
        const filtered = pops.filter((pop) => {
            const searchTerm = searchValue.toLowerCase();
            const locationMatch = !locationFilter || 
                locationFilter === 'All' || 
                pop.location_name.toLowerCase() === locationFilter.toLowerCase();

            if (searchValue === '') return locationMatch;

            let isMatchingSearch = false;
            if (searchField === 'all') {
                isMatchingSearch = 
                    pop.pop_name.toLowerCase().includes(searchTerm) ||
                    pop.location_name.toLowerCase().includes(searchTerm);
            } else if (searchField === 'pop_name') {
                isMatchingSearch = pop.pop_name.toLowerCase().includes(searchTerm);
            } else if (searchField === 'location_name') {
                isMatchingSearch = pop.location_name.toLowerCase().includes(searchTerm);
            }

            return isMatchingSearch && locationMatch;
        });

        setFilteredPops(filtered);
        setCurrentPage(1);
    }, [pops, searchValue, searchField, locationFilter]);

    const handleDeletePop = async () => {
        try {
            if (!popToDelete) return;

            await supabase.from("POP").delete().eq("pop_id", popToDelete);
        
            setPops(prevPops => prevPops.filter(pop => pop.pop_id !== popToDelete));
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Error deleting pop:', error);
        }
    };

    const totalPages = Math.ceil(filteredPops.length / popsPerPage);
    const startIndex = (currentPage - 1) * popsPerPage;
    const displayedPops = filteredPops.slice(startIndex, startIndex + popsPerPage);

    if (isLoading) {
        return (
            <LoadingSpinner/>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-4">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => router.push('/')}
                    >
                        <Home className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">Points of Presence (POP)</h1>
                </div>
            </div>

            {/* Filters */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-4">
                    {/* Location Filter */}
                    <Select 
                        value={locationFilter || 'All'} 
                        onValueChange={setLocationFilter}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Location">
                                {locationFilter || "All Locations"}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {locations.map(location => (
                                <SelectItem 
                                    key={location} 
                                    value={location}
                                >
                                    {location}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {/* Search Field Select */}
                    <Select 
                        value={searchField} 
                        onValueChange={setSearchField}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Search In">
                                {searchField === 'all' ? 'All Fields' : 
                                 searchField === 'pop_name' ? 'POP Name' : 'Location Name'}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Fields</SelectItem>
                            <SelectItem value="pop_name">POP Name</SelectItem>
                            <SelectItem value="location_name">Location Name</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Search Input */}
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input 
                        type="text"
                        placeholder="Search POPs"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* POP Grid */}
            {filteredPops.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    No POPs found matching your search criteria.
                </div>
            ) : (
                <motion.div 
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                >
                    <AnimatePresence>
                        {displayedPops.map((pop) => (
                            <motion.div
                                key={pop.pop_id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white border rounded-lg shadow-md overflow-hidden group"
                            >
                                <div className="relative">
                                    <img 
                                        src={pop.image_url || "/api/placeholder/300/200"} 
                                        alt={pop.pop_name} 
                                        className="w-full h-48 object-cover group-hover:brightness-75 transition-all"
                                    />
                                    <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            size="icon" 
                                            variant="destructive"
                                            onClick={() => {
                                                setPopToDelete(pop.pop_id);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            title="Delete POP"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold mb-2">{pop.pop_name}</h3>
                                    <div className="flex items-center text-sm text-gray-600 mb-4">
                                        <MapPin className="mr-2 h-4 w-4 text-red-500" />
                                        {pop.location_name}
                                    </div>
                                    <div className="flex justify-between">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => router.push(`/viewPop/${pop.pop_id}`)}
                                        >
                                            <Eye className="mr-2 h-4 w-4" /> View
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => router.push(`/editPOP/${pop.pop_id}`)}
                                        >
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Pagination */}
            {filteredPops.length > popsPerPage && (
                <div className="flex justify-between items-center mt-8">
                    <span className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(startIndex + popsPerPage, filteredPops.length)} of {filteredPops.length} POPs
                    </span>
                    <div className="flex space-x-2">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <Button
                                key={i + 1}
                                variant={currentPage === i + 1 ? 'default' : 'outline'}
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete POP</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this Point of Presence? 
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
                            onClick={handleDeletePop}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}