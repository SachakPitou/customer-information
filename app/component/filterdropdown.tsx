import React, { useMemo } from 'react';

interface Device {
    location_name: string;
    power_source_type_1: string;
    power_source_type_2: string;
    rack_name: string;
    pop_name: string;
    status: string;
}

interface Filters {
    location: string;
    powerSource: string;
    rack: string;
    pop: string;
    status: string;  // Added status to filters
}

interface FilterDropdownProps {
    label: string;
    isOpen: boolean;
    toggleFn: () => void;
    filterValue: string;
    handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    options: string[];
}

const FilterDropdowns: React.FC<{ devices: Device[], filters: Filters, setFilters: React.Dispatch<React.SetStateAction<Filters>> }> = ({ devices, filters, setFilters }) => {
    // Create dropdown states
    const [locationDropdownOpen, setLocationDropdownOpen] = React.useState(false);
    const [powerSourceDropdownOpen, setPowerSourceDropdownOpen] = React.useState(false);
    const [rackDropdownOpen, setRackDropdownOpen] = React.useState(false);
    const [popDropdownOpen, setPopDropdownOpen] = React.useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = React.useState(false);  // Added status dropdown state
    const closeAllDropdowns = () => {
        setLocationDropdownOpen(false);
        setPowerSourceDropdownOpen(false);
        setRackDropdownOpen(false);
        setPopDropdownOpen(false);
        setStatusDropdownOpen(false);
    };

    // Handle clicks outside dropdowns
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.filter-dropdown')) {
                closeAllDropdowns();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Toggle functions - modified to handle proper toggling
    

    // Get unique values for each filter type
    const uniqueValues = useMemo(() => {
        // All locations are always available
        const locations = Array.from(new Set(devices.map(device => device.location_name)))
            .filter(Boolean)
            .sort();

        // Filter POPs based on selected location
        const pops = Array.from(new Set(devices
            .filter(device => !filters.location || device.location_name === filters.location)
            .map(device => device.pop_name)))
            .filter(Boolean)
            .sort();

        // Filter racks based on selected location and POP
        const racks = Array.from(new Set(devices
            .filter(device => 
                (!filters.location || device.location_name === filters.location) &&
                (!filters.pop || device.pop_name === filters.pop)
            )
            .map(device => device.rack_name)))
            .filter(Boolean)
            .sort();

        // Filter power sources based on selected location, POP, and rack
        const powerSources = Array.from(new Set(devices
            .filter(device => 
                (!filters.location || device.location_name === filters.location) &&
                (!filters.pop || device.pop_name === filters.pop) &&
                (!filters.rack || device.rack_name === filters.rack)
            )
            .flatMap(device => [device.power_source_type_1, device.power_source_type_2])))
            .filter(Boolean)
            .sort();

        // Get all unique statuses
        const statuses = Array.from(new Set(devices
            .filter(device =>
                (!filters.location || device.location_name === filters.location) &&
                (!filters.pop || device.pop_name === filters.pop) &&
                (!filters.rack || device.rack_name === filters.rack) &&
                (!filters.powerSource || 
                    device.power_source_type_1 === filters.powerSource || 
                    device.power_source_type_2 === filters.powerSource)
            )
            .map(device => device.status)))
            .filter(Boolean)
            .sort();

        return { locations, pops, racks, powerSources, statuses };
    }, [devices, filters.location, filters.pop, filters.rack, filters.powerSource]);

    // Toggle functions
    const toggleDropdown = (setter: React.Dispatch<React.SetStateAction<boolean>>) => () => {
        setLocationDropdownOpen(false);
        setPowerSourceDropdownOpen(false);
        setRackDropdownOpen(false);
        setPopDropdownOpen(false);
        setStatusDropdownOpen(false);  // Added status dropdown reset
        setter(prev => !prev);
    };

    // Handle filter changes with reset of dependent filters
    const handleFilterChange = (filterType: keyof typeof filters) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        
        setFilters(prev => {
            const updates: Partial<typeof filters> = {
                [filterType]: newValue
            };
            
            // Reset dependent filters when parent filter changes
            switch (filterType) {
                case 'location':
                    // When location changes, reset all dependent filters
                    updates.pop = '';
                    updates.rack = '';
                    updates.powerSource = '';
                    updates.status = '';
                    break;
                case 'pop':
                    // When POP changes, reset dependent filters
                    updates.rack = '';
                    updates.powerSource = '';
                    updates.status = '';
                    break;
                case 'rack':
                    // When rack changes, reset power source and status
                    updates.powerSource = '';
                    updates.status = '';
                    break;
                case 'powerSource':
                    // When power source changes, reset status
                    updates.status = '';
                    break;
            }
            
            return { ...prev, ...updates };
        });
    };

    // Generic dropdown component
    const FilterDropdown: React.FC<FilterDropdownProps> = ({ 
        label, 
        isOpen, 
        toggleFn, 
        filterValue, 
        handleChange, 
        options 
    }) => (
        <div className="filter-dropdown mr-5 relative">
            <button
                className="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
                type="button"
                onClick={(e) => {
                    e.stopPropagation(); // Prevent event from bubbling up
                    toggleFn();
                }}
            >
                {label}
                <svg
                    className="w-2.5 h-2.5 ms-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                >
                    <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m1 1 4 4 4-4"
                    />
                </svg>
            </button>
            {isOpen && (
                <div 
                    className="z-10 absolute top-full left-0 mt-1 w-48 bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600"
                    onClick={(e) => e.stopPropagation()} // Prevent clicks inside dropdown from closing it
                >
                    <ul className="p-3 space-y-1 text-sm text-gray-700 dark:text-gray-200">
                        <li>
                            <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                <input
                                    type="radio"
                                    value=""
                                    checked={filterValue === ""}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <label className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300">
                                    All
                                </label>
                            </div>
                        </li>
                        {options.map((option, index) => (
                            <li key={index}>
                                <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <input
                                        type="radio"
                                        value={option}
                                        checked={filterValue === option}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300">
                                        {option}
                                    </label>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
    return (
        <div className="flex flex-wrap gap-2">
            <FilterDropdown
                label="Location"
                isOpen={locationDropdownOpen}
                toggleFn={toggleDropdown(setLocationDropdownOpen)}
                filterValue={filters.location}
                handleChange={handleFilterChange('location')}
                options={uniqueValues.locations}
            />
            <FilterDropdown
                label="POP"
                isOpen={popDropdownOpen}
                toggleFn={toggleDropdown(setPopDropdownOpen)}
                filterValue={filters.pop}
                handleChange={handleFilterChange('pop')}
                options={uniqueValues.pops}
            />
            <FilterDropdown
                label="Rack"
                isOpen={rackDropdownOpen}
                toggleFn={toggleDropdown(setRackDropdownOpen)}
                filterValue={filters.rack}
                handleChange={handleFilterChange('rack')}
                options={uniqueValues.racks}
            />
            <FilterDropdown
                label="Power Source"
                isOpen={powerSourceDropdownOpen}
                toggleFn={toggleDropdown(setPowerSourceDropdownOpen)}
                filterValue={filters.powerSource}
                handleChange={handleFilterChange('powerSource')}
                options={uniqueValues.powerSources}
            />
            <FilterDropdown
                label="Status"
                isOpen={statusDropdownOpen}
                toggleFn={toggleDropdown(setStatusDropdownOpen)}
                filterValue={filters.status}
                handleChange={handleFilterChange('status')}
                options={uniqueValues.statuses}
            />
        </div>
    );
};

export default FilterDropdowns;