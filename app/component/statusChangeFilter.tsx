import React, { useState, ChangeEvent } from 'react';

interface FilterParams {
  startDate: string;
  endDate: string;
  statusType: string;
}

interface StatusChangeFilterProps {
  onFilter: (params: FilterParams) => void;
}

const StatusChangeFilter: React.FC<StatusChangeFilterProps> = ({ onFilter }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusType, setStatusType] = useState<string>('ALL');

  const handleFilter = () => {
    onFilter({ startDate, endDate, statusType });
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="date"
        value={startDate}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
        className="border rounded p-1 text-sm"
      />
      <input
        type="date"
        value={endDate}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
        className="border rounded p-1 text-sm"
      />
      <select
        value={statusType}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusType(e.target.value)}
        className="border rounded p-1 text-sm"
      >
        <option value="ALL">All Statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
        <option value="REACTIVE">Reactive</option>
        <option value="TERMINATE">Terminate</option>
      </select>
      <button
        onClick={handleFilter}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
      >
        Apply Filter
      </button>
    </div>
  );
};

export default StatusChangeFilter;