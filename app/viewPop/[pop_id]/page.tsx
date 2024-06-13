"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function viewPOP() {
    const [racks, setRacks] = useState([]);
    const router = useRouter();
    const { pop_id } = useParams();

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

                const locationMap = Object.fromEntries(locationsData.map(loc => [loc.location_id, loc.location_name]));

                const racksWithDetails = racksData.map(rack => ({
                    ...rack,
                    location_name: locationMap[rack.location_id] || 'Unknown Location',
                }));

                setRacks(racksWithDetails);
            } catch (error) {
                console.error('Error fetching data:', error.message);
            }
        }

        fetchRacks();
    }, [pop_id]);

    const handleRackClick = (rack_id) => {
        router.push(`/viewRack/${rack_id}`);
    };

    if (racks.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <div className="relative overflow-x-auto shadow-md">
            <div className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800 flex items-center">
                <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 ml-1 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700">
                    <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                    </svg>
                </button>
                <span>Racks in POP:</span>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {racks.map((rack) => (
                    <div 
                        key={rack.rack_id} 
                        className="bg-white border rounded-lg shadow-md p-4 dark:bg-gray-300 dark:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-400 cursor-pointer"
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
                    </div>
                ))}
            </div>
        </div>
    );
}
