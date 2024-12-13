import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface LocationChangeFilterProps {
  onLocationChange: (locationId: number | null) => void;
}

const LocationChangeFilter: React.FC<LocationChangeFilterProps> = ({ onLocationChange }) => {
  const [locations, setLocations] = useState<{ location_id: number; location_name: string }[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('Location')
          .select('location_id, location_name')
          .order('location_name', { ascending: true });

        if (error) {
          console.error('Error fetching locations:', error);
          return;
        }

        setLocations(data || []);
      } catch (error) {
        console.error('Error in location fetch:', error);
      }
    };

    fetchLocations();
  }, []);

  const handleLocationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const locationId = event.target.value === '' ? null : parseInt(event.target.value, 10);
    setSelectedLocation(locationId);
    onLocationChange(locationId);
  };

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="location-filter" className="text-sm font-medium text-gray-700">
        Location:
      </label>
      <select
        id="location-filter"
        value={selectedLocation || ''}
        onChange={handleLocationChange}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option value="">All Locations</option>
        {locations.map((location) => (
          <option key={location.location_id} value={location.location_id}>
            {location.location_name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LocationChangeFilter;