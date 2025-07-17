"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import StatusChangeFilter from '../component/statusChangeFilter';
import LoadingSpinner from '../component/LoadingSpinner';
import LocationChangeFilter from '../component/LocationChangeFilter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'react-hot-toast';
import { debounce } from 'lodash';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Download, Home, Search, Eye, Edit, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Customer {
  location_id: number;
  ONU_mac_address: string;
  customer_id: string;
  customer_name: string;
  phone_number: string;
  cid: string;
  contract_id: string;
  package_name: string;
  service_port?: number;
  status_type: string;
  active_timestamp?: string;
  inactive_timestamp?: string;
  reactive_timestamp?: string;
  terminate_timestamp?: string;
  isActive: boolean;
  rowNumber: number;
  device_name: string;
  interface_name: string;
  olt_name: string;
  status: string;
  slot?: string;
  port?: string;
  onu_id?: string;
  ip_address?: string;
  package_id: string;
  device_id: string;
  olt_id: string;
  interface_id: string;
  ACL: string;
  switch_port: string;
  port_type: string;
  ont_id: string;
  serial_number: string;
  frame: number;
  statusHistory: Array<{
    status_type: string;
    start_date: string;
    end_date: string | null;
  }>;
}

interface StatusChangeFilterParams {
  startDate: string;
  endDate: string;
  statusType: string;
}

const Dashboard = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [userType, setUserType] = useState('');
  const [editHistories, setEditHistories] = useState<Record<string, any[]>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [customerCount, setCustomerCount] = useState(0);
  const [pendingEditCount, setPendingEditCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusChangeFilter, setStatusChangeFilter] = useState<StatusChangeFilterParams>({
    startDate: '',
    endDate: '',
    statusType: 'ALL',
  });

  const router = useRouter();
  const packagesPerPage = 20;

  // Debounced search handler
  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchValue(value), 300),
    []
  );

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        { data: customersData, error: customersError },
        { data: packageData, error: packageError },
        { data: deviceData, error: deviceError },
        { data: interfaceData, error: interfaceError },
        { data: statusData, error: statusError },
        { data: statusHistoryData, error: historyError },
      ] = await Promise.all([
        supabase.from('Customer').select('*').limit(10000),
        supabase.from('Package').select('package_id, package_name'),
        supabase.from('Device').select('device_id, device_name'),
        supabase.from('Interface').select('interface_id, interface_name'),
        supabase.from('Customer').select('customer_id, status').eq('status', 'Completed'),
        supabase.from('statushistory').select('*'),
      ]);

      if (customersError || packageError || deviceError || interfaceError || statusError || historyError) {
        throw new Error('Failed to fetch data');
      }

      const packageMap = new Map(packageData?.map(p => [p.package_id, p.package_name]));
      const deviceMap = new Map(deviceData?.map(d => [d.device_id, d.device_name]));
      const interfaceMap = new Map(interfaceData?.map(i => [i.interface_id, i.interface_name]));
      const statusMap = new Map(statusData?.map(s => [s.customer_id, s.status]));
      const statusHistoryMap = new Map();

      statusHistoryData?.forEach(history => {
        if (!statusHistoryMap.has(history.customer_id)) {
          statusHistoryMap.set(history.customer_id, []);
        }
        statusHistoryMap.get(history.customer_id).push(history);
      });

      const processedCustomers = customersData?.map((customer, index) => ({
        ...customer,
        rowNumber: index + 1,
        package_name: packageMap.get(customer.package_id) || 'Unknown Package',
        device_name: deviceMap.get(customer.device_id) || 'Unknown Device',
        interface_name: interfaceMap.get(customer.interface_id) || 'Unknown Interface',
        status: statusMap.get(customer.customer_id),
        statusHistory: statusHistoryMap.get(customer.customer_id) || [],
      }));

      setCustomers(processedCustomers || []);
      setCustomerCount(statusData?.length || 0);
      setPendingEditCount((customersData?.length || 0) - (statusData?.length || 0));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user type
  const fetchUserType = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      if (error) throw new Error('Failed to fetch session');

      const session = data.session;
      if (session) {
        const userId = session.user.id;
        const { data: userData, error: userError } = await supabase
          .from('userAccount')
          .select('user_type')
          .eq('id', userId)
          .single();

        if (userError) throw userError;
        setUserType(userData.user_type);
      }
    } catch (error) {
      console.error('Error fetching user type:', error);
      toast.error('Failed to load user type.');
    }
  }, []);

  // Fetch counts
  const fetchCounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const [customerData, pendingEditData] = await Promise.all([
        supabase.from('Customer').select('customer_id').eq('status', 'Completed'),
        supabase.from('Customer').select('customer_id').eq('status', 'Pending Technical Review'),
      ]);

      if (customerData.error || pendingEditData.error) throw new Error('Failed to fetch counts');

      setCustomerCount(customerData.data?.length || 0);
      setPendingEditCount(pendingEditData.data?.length || 0);
    } catch (error) {
      console.error('Error fetching counts:', error);
      toast.error('Failed to load counts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    fetchAllData();
    fetchUserType();
  }, [fetchCounts, fetchAllData, fetchUserType]);

  // Filter customers
  // Filter customers
const filteredCustomers = useMemo(() => {
  return customers.filter(customer => {
    if (customer.status !== 'Completed') return false;
    if (selectedLocation !== null && customer.location_id !== selectedLocation) return false;

    const searchTerm = searchValue.toLowerCase();
    let statusChangeFilterPass = true;

    if (statusChangeFilter.startDate && statusChangeFilter.endDate) {
      const filterStartDate = new Date(statusChangeFilter.startDate);
      const filterEndDate = new Date(statusChangeFilter.endDate);
      filterStartDate.setHours(0, 0, 0, 0);
      filterEndDate.setHours(23, 59, 59, 999);

      if (Array.isArray(customer.statusHistory) && customer.statusHistory.length > 0) {
        const relevantStatus = customer.statusHistory.find(status => {
          const statusStartDate = new Date(status.start_date);
          const statusEndDate = status.end_date ? new Date(status.end_date) : new Date();
          return statusStartDate <= filterEndDate && statusEndDate >= filterStartDate;
        });

        if (relevantStatus) {
          statusChangeFilterPass = statusChangeFilter.statusType === 'ALL' || relevantStatus.status_type === statusChangeFilter.statusType;
        } else {
          statusChangeFilterPass = false;
        }
      } else {
        statusChangeFilterPass = false;
      }
    } else if (statusChangeFilter.statusType !== 'ALL') {
      const latestStatus = customer.statusHistory.length > 0
        ? customer.statusHistory[customer.statusHistory.length - 1].status_type
        : customer.status_type;
      statusChangeFilterPass = latestStatus === statusChangeFilter.statusType;
    }

    if (searchValue === '') return statusChangeFilterPass;

    let isMatchingSearch = false;
    if (searchField === 'all') {
      isMatchingSearch = (
        customer.customer_name?.toLowerCase().includes(searchTerm) ||
        customer.phone_number?.toLowerCase().includes(searchTerm) ||
        customer.cid?.toLowerCase().includes(searchTerm) ||
        customer.contract_id?.toLowerCase().includes(searchTerm) ||
        customer.package_name?.toLowerCase().includes(searchTerm)
      );
    } else if (searchField === 'name') {
      isMatchingSearch = customer.customer_name?.toLowerCase().includes(searchTerm);
    } else if (searchField === 'phone_number') {
      isMatchingSearch = customer.phone_number?.toString().includes(searchTerm);
    } else if (searchField === 'cid') {
      isMatchingSearch = customer.cid?.toString().toLowerCase().startsWith(searchTerm);
    } else if (searchField === 'contract_id') {
      isMatchingSearch = customer.contract_id?.toString().toLowerCase().startsWith(searchTerm);
    } else if (searchField === 'internet_package') {
      isMatchingSearch = customer.package_name?.toString().toLowerCase().startsWith(searchTerm);
    }

    return isMatchingSearch && statusChangeFilterPass;
  });
}, [customers, searchValue, searchField, selectedLocation, statusChangeFilter]);

  // Download Excel
  const downloadExcel = useCallback(() => {
    const excelData = filteredCustomers.map(customer => {
      const latestStatus = customer.statusHistory.length > 0
        ? [...customer.statusHistory].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0]
        : { status_type: customer.status_type || 'Unknown', start_date: customer.active_timestamp || '', end_date: null };

      const formatDateForCambodia = (dateStr: string | number | Date) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      };

      return {
        'No.': customer.rowNumber,
        'Name': customer.customer_name,
        'Phone Number': customer.phone_number,
        'CID': customer.cid,
        'Contract ID': customer.contract_id,
        'Internet Package': customer.package_name,
        'Slot': customer.slot,
        'Port': customer.port,
        'Frame': customer.frame,
        'Service Port': customer.service_port,
        'ONT ID': customer.ont_id,
        'ACL': customer.ACL,
        'Switch Port': customer.switch_port,
        'Port Type': customer.port_type,
        'ONU MAC Address': customer.ONU_mac_address,
        'Serial Number': customer.serial_number,
        'IP Address': customer.ip_address,
        'Interface': customer.interface_name,
        'Device': customer.device_name,
        'Status': latestStatus.status_type,
        'Status Start Date': formatDateForCambodia(latestStatus.start_date),
        'Status End Date': latestStatus.end_date ? formatDateForCambodia(latestStatus.end_date) : 'Current',
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const formattedDateTime = new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' }).replace(/[/:\s]/g, '-');
    saveAs(data, `customer_dashboard_${formattedDateTime}.xlsx`);
  }, [filteredCustomers]);

  // Handle delete customer
  const handleDeleteCustomer = useCallback(async () => {
    if (!customerToDelete) return;
    try {
      await supabase.from('Customer').delete().eq('customer_id', customerToDelete);
      setCustomers(prev => prev.filter(customer => customer.customer_id !== customerToDelete));
      toast.success('Customer deleted successfully');
      setShowModal(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer.');
    }
  }, [customerToDelete]);

  // Handle fetch history
  const handleFetchHistory = useCallback(async (customerId: string) => {
    if (editHistories[customerId]) {
      setExpandedRows(prev => ({ ...prev, [customerId]: !prev[customerId] }));
      return;
    }

    try {
      const [
        { data: historyData },
        { data: userData },
      ] = await Promise.all([
        supabase.from('CustomerHistory').select('*').eq('customer_id', customerId),
        supabase.from('userAccount').select('id, user_name'),
      ]);

      if (!historyData) return;

      const userMap = new Map(userData?.map(user => [user.id, user.user_name]) || []);
      const processedHistory = historyData.map(history => {
        const formattedDate = new Date(history.timestamp.replace(',', '')).toLocaleString('en-GB', {
          timeZone: 'Asia/Phnom_Penh',
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        const userName = userMap.get(history.editedBy) || 'Unknown User';
        return {
          ...history,
          formattedDate,
          editedBy: userName,
          displayString: `${formattedDate} edited by ${userName}`,
          changeDescription: `${history.field_changed} changed from "${history.old_value}" to "${history.new_value}"`,
        };
      });

      setEditHistories(prev => ({ ...prev, [customerId]: processedHistory }));
      setExpandedRows(prev => ({ ...prev, [customerId]: true }));
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to fetch edit history.');
    }
  }, [editHistories]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / packagesPerPage);
  const startIndex = (currentPage - 1) * packagesPerPage;
  const displayedCustomers = filteredCustomers.slice(startIndex, startIndex + packagesPerPage);

  if (isLoading || customers.length === 0 || (customers.length - pendingEditCount) !== customerCount) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-white dark:bg-gray-800 shadow-sm rounded-t-lg">
          <div className="flex items-center gap-4">
            <img src="/img/matinternet.png" alt="MAT Logo" className="h-12 w-auto" />
            <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">Customer Dashboard</CardTitle>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => router.back()}
                      aria-label="Go back"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Return to previous page</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => router.push('/')}
                      aria-label="Go to home"
                    >
                      <Home className="w-5 h-5" />
                      Home
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Go to homepage</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={downloadExcel}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    aria-label="Download customer data as Excel"
                  >
                    <Download className="w-5 h-5" />
                    Export to Excel
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export customer data to Excel</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <LocationChangeFilter onLocationChange={setSelectedLocation} />
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-col md:flex-row gap-4 pt-6">
          <StatusChangeFilter onFilter={setStatusChangeFilter} />
          <Select
            value={searchField}
            onValueChange={setSearchField}
            aria-label="Select search field"
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Fields" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fields</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="phone_number">Phone Number</SelectItem>
              <SelectItem value="cid">CID</SelectItem>
              <SelectItem value="contract_id">Contract ID</SelectItem>
              <SelectItem value="internet_package">Internet Package</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Search customers..."
              value={searchValue}
              onChange={e => debouncedSearch(e.target.value)}
              className="pl-10"
              aria-label="Search customers"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>History</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>CID</TableHead>
                  <TableHead>Contract ID</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedCustomers.map(customer => (
                  <React.Fragment key={customer.customer_id}>
                    <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>{customer.rowNumber}</TableCell>
                      <TableCell>{customer.customer_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="default"
                          className={`${
                            customer.status_type === 'ACTIVE' ? 'bg-green-500' :
                            customer.status_type === 'REACTIVE' ? 'bg-blue-500' :
                            customer.status_type === 'INACTIVE' ? 'bg-yellow-500' :
                            customer.status_type === 'TERMINATE' ? 'bg-red-500' :
                            'bg-gray-500'
                          } text-white`}
                        >
                          {customer.status_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFetchHistory(customer.customer_id)}
                          aria-label={expandedRows[customer.customer_id] ? 'Hide history' : 'Show history'}
                        >
                          {expandedRows[customer.customer_id] ? 'Hide' : 'Show'}
                        </Button>
                      </TableCell>
                      <TableCell>{customer.phone_number}</TableCell>
                      <TableCell>{customer.cid}</TableCell>
                      <TableCell>{customer.contract_id}</TableCell>
                      <TableCell>{customer.package_name}</TableCell>
                      <TableCell>{customer.ip_address || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={`/viewCustomer/${customer.customer_id}`}>
                                  <Button variant="ghost" size="icon" aria-label="View customer">
                                    <Eye className="h-5 w-5" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>View customer details</TooltipContent>
                            </Tooltip>
                            {userType !== 'technical' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/editCustomerService/${customer.customer_id}`}>
                                    <Button variant="ghost" size="icon" aria-label="Edit customer service">
                                      <Edit className="h-5 w-5" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>Edit customer service</TooltipContent>
                              </Tooltip>
                            )}
                            {userType !== 'customer_service' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/editCustomer/${customer.customer_id}`}>
                                    <Button variant="ghost" size="icon" aria-label="Edit customer">
                                      <Edit className="h-5 w-5" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>Edit customer details</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => {
                                    setShowModal(true);
                                    setCustomerToDelete(customer.customer_id);
                                  }}
                                  aria-label="Delete customer"
                                >
                                  <Trash className="h-5 w-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete customer</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows[customer.customer_id] && (
                      <TableRow className="bg-gray-100 dark:bg-gray-800">
                        <TableCell colSpan={10} className="py-4">
                          {editHistories[customer.customer_id]?.length > 0 ? (
                            <div className="space-y-2">
                              {editHistories[customer.customer_id].map(history => (
                                <div key={history.id} className="p-2 border-b border-gray-200 dark:border-gray-700">
                                  <p className="font-medium">{history.displayString}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{history.changeDescription}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">No edit history available.</p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {startIndex + 1} to {Math.min(startIndex + packagesPerPage, filteredCustomers.length)} of {filteredCustomers.length} Customers
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => prev - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + Math.max(1, currentPage - 2);
            if (page > totalPages) return null;
            return (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                aria-label={`Page ${page}`}
              >
                {page}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 dark:text-gray-400">Are you sure you want to delete this customer? This action cannot be undone.</p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;