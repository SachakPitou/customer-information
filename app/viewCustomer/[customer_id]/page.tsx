"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import LoadingSpinner from '@/app/component/LoadingSpinner';
import PDFPreviewModal from '@/app/component/PDFPreviewModal';
import { 
  Eye as EyeIcon, 
  MapPin as LocationIcon, 
  Phone as PhoneIcon, 
  Package as PackageIcon, 
  Calendar as CalendarIcon,
  ArrowLeft as BackIcon,
  FileText as FileIcon,
  Network as NetworkIcon,
  Server as ServerIcon,
  Database as DatabaseIcon
} from 'lucide-react';

type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'REACTIVE' | 'TERMINATE' | '';

type Customer = {
    customer_name: string;
    cid: string;
    phone_number: string;
    address: string;
    activation_date: string;
    status_type: CustomerStatus;
    active_timestamp: string | null;
    inactive_timestamp: string | null;
    reactive_timestamp: string | null;
    terminate_timestamp: string | null;
    longtitude: number;
    langtitude: number;
    VLan: number;
    description: string;
    ACL: number;
    ip_address: number;
    capacity_bandwidth: string;
    switch_port: number;
    port_type: number;
    port: number;
    service_port: number;
    camera_ip: number;
    onu_id: number;
    ONU_mac_address: string;
    ont_id: number;
    customer_id: string;
    package_id: string;
    device_id: string;
    service_id: string;
    location_id: string;
    interface_id: string;
    device_type_id: number;
    package_name: string;
    device_name: string;
    service_name: string;
    location_name: string;
    interface_info: string;
    device_type: string;
    router_name: string;
    frame: number;
    slot: number;
    serial_number: string;
    start_date: string | null;
    end_date: string | null;
    sale_name: string;
    pdfUrl?: string | null;
    ip_type: string;
    survey_id: string;
    subnet: string;
    service_type: string;
};
  
type EditHistory = {
    timestamp: any;
    id: number;
    customer_id: string;
    field_changed: string;
    old_value: string;
    new_value: string;
    change_date: string;
    changeDescription: string;
};
interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
  bold?: boolean;
}
export default function ViewCustomer() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [editHistories, setEditHistories] = useState<Record<string, EditHistory[]>>({});
    const [editHistoryVisible, setEditHistoryVisible] = useState<Record<string, boolean>>({});
    const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
    const router = useRouter();
    const params = useParams();
    const customer_id = params.customer_id as string;
    
    const formatDate = (date: string | null): string => {
      if (!date) return 'N/A';
      try {
        return format(parseISO(date), 'MMM dd, yyyy');
      } catch {
        return 'Invalid Date';
      }
    };
    const handleClosePdfPreview = () => {
        setSelectedPdfUrl(null);
    };
    const fetchPdfContent = async (customerId: string) => {
      try {
        const { data: pdfData, error } = await supabase
          .from('Customer')
          .select('network_diagram_url')
          .eq('customer_id', customerId)
          .single();
    
        if (error) {
          console.error('Error fetching PDF URL:', error);
          return null;
        }
    
        return pdfData.network_diagram_url || null;
      } catch (error) {
        console.error('Unexpected error fetching PDF URL:', error);
        return null;
      }
    };
    const handlePreviewPdf = (customerId: string) => {
      const pdfUrl = customers.find(c => c.customer_id === customerId)?.pdfUrl;
      if (pdfUrl) {
          setSelectedPdfUrl(pdfUrl);
      } else {
          alert(`No network diagram found for customer ${customerId}`);
      }
    };
    
    const handleDownloadPdf = async (customerId: string) => {
      const pdfUrl = customers.find(c => c.customer_id === customerId)?.pdfUrl;
      
      if (pdfUrl) {
        window.open(pdfUrl, '_blank');
      } else {
        alert(`No network diagram found for customer ${customerId}`);
      }
    };
    useEffect(() => {
      async function fetchCustomers() {
        try {
          if (!customer_id) return;
      
          const { data: customersData, error: customerError } = await supabase
            .from('Customer')
            .select('*')
            .eq('customer_id', customer_id);
      
          if (customerError) throw customerError;
          
            
            const { data: customerRouterData, error: customerRouterError } = await supabase
              .from('customerrouter')
              .select('customer_id, router_device_id')
              .in('customer_id', customersData.map(c => c.customer_id));
    
            if (customerRouterError) throw customerRouterError;
    
            const routerDeviceIds = customerRouterData.map(cr => cr.router_device_id);
    
            const { data: routerDevicesData, error: routerDevicesError } = await supabase
              .from('Device')
              .select('device_id, device_name')
              .in('device_id', routerDeviceIds);
    
            if (routerDevicesError) throw routerDevicesError;
    
            const packageIds = customersData.map((customer) => customer.package_id);
            const deviceIds = customersData.map((customer) => customer.device_id);
            const serviceIds = customersData.map((customer) => customer.service_id);
            const locationIds = customersData.map((customer) => customer.location_id);
            const interfaceIds = customersData.map((customer) => customer.interface_id);
            const deviceTypeIds = customersData.map((customer) => customer.device_type_id);
    
            const [packagesData, devicesData, servicesData, locationsData, interfacesData, deviceTypesData, portDevicesData, statusHistoryData] = await Promise.all([
              supabase.from('Package').select('package_id, package_name').in('package_id', packageIds),
              supabase.from('Device').select('device_id, device_name').in('device_id', deviceIds),
              supabase.from('Service').select('service_id, service_name').in('service_id', serviceIds),
              supabase.from('Location').select('location_id, location_name').in('location_id', locationIds),
              supabase.from('Interface').select('interface_id, interface_name').in('interface_id', interfaceIds),
              supabase.from('Device Type').select('device_type_id, device_type').in('device_type_id', deviceTypeIds),
              supabase.from('PortDevice').select('*').in('interface_id', interfaceIds),
              supabase.from('statushistory').select('customer_id, start_date, end_date').in('customer_id', customersData.map(c => c.customer_id))
            ]);
          
            const routerDeviceMap = Object.fromEntries(routerDevicesData.map(dev => [dev.device_id, dev.device_name]));
            const packageMap = Object.fromEntries(packagesData.data?.map(pkg => [pkg.package_id, pkg.package_name]) ?? []);
            const deviceMap = Object.fromEntries(devicesData.data?.map(dev => [dev.device_id, dev.device_name]) ?? []);
            const serviceMap = Object.fromEntries(servicesData.data?.map(srv => [srv.service_id, srv.service_name]) ?? []);
            const locationMap = Object.fromEntries(locationsData.data?.map(loc => [loc.location_id, loc.location_name]) ?? []);
            const deviceTypeMap = Object.fromEntries(deviceTypesData.data?.map(dvct => [dvct.device_type_id, dvct.device_type]) ?? []);
            const interfaceMap = Object.fromEntries(interfacesData.data?.map(inte => [
              inte.interface_id,
              {
                interface_name: inte.interface_name,
                port_number: portDevicesData.data?.find(pd => pd.interface_id === inte.interface_id)?.port_number
              }
            ]) ?? []);
            const statusHistoryMap = Object.fromEntries(
              statusHistoryData.data?.map(sh => [sh.customer_id, { start_date: sh.start_date, end_date: sh.end_date }]) ?? []
            );
            
            const customersWithDetails = customersData.map(customer => {
              const customerRouter = customerRouterData.find(cr => cr.customer_id === customer.customer_id);
              const routerDeviceId = customerRouter ? customerRouter.router_device_id : null;
              const statusHistory = statusHistoryMap[customer.customer_id] || { start_date: null, end_date: null };
              return {
                ...customer,
                package_name: packageMap[customer.package_id] || 'Unknown Package',
                device_name: deviceMap[customer.device_id] || 'Unknown Device',
                service_name: serviceMap[customer.service_id] || 'Unknown Service',
                location_name: locationMap[customer.location_id] || 'Unknown Location',
                interface_info: interfaceMap[customer.interface_id]
                  ? `Port Number ${interfaceMap[customer.interface_id].port_number} = ${interfaceMap[customer.interface_id].interface_name}`
                  : 'Unknown Interface',
                device_type: deviceTypeMap[customer.device_type_id] || 'Unknown Device Type',
                router_name: routerDeviceId ? routerDeviceMap[routerDeviceId] || 'Unknown Router' : 'No Router Assigned',
                start_date: statusHistory.start_date,
                end_date: statusHistory.end_date,
                
              };
            });
    
            const customersWithDetailsAndPdf = await Promise.all(customersWithDetails.map(async (customer) => {
              try {
                const pdfUrl = await fetchPdfContent(customer.customer_id);
                return {
                  ...customer,
                  pdfUrl: pdfUrl
                };
              } catch (error) {
                console.error(`Error fetching PDF for customer ${customer.customer_id}:`, error);
                return {
                  ...customer,
                  pdfUrl: null
                };
              }
            }));
        
            setCustomers(customersWithDetailsAndPdf);
          } catch (error) {
            console.error('Error fetching data:', (error as Error).message);
          }
        }
      
        fetchCustomers();
      }, [customer_id, supabase]);
      const InfoCard: React.FC<InfoCardProps> = ({ title, children, icon: Icon, className = '' }) => (
        <div className={`bg-white shadow-md rounded-lg p-6 space-y-4 ${className}`}>
          <div className="flex items-center space-x-3 border-b pb-3">
            {Icon && <Icon className="w-6 h-6 text-red-500" />}
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
          <div className="space-y-2">{children}</div>
        </div>
      );
  
      const InfoRow: React.FC<InfoRowProps> = ({ label, value, bold = false }) => (
        <div className="flex justify-between">
          <span className="text-gray-600">{label}</span>
          <span className={`${bold ? 'font-semibold text-gray-900' : 'text-gray-800'} text-right`}>
            {value ?? 'N/A'}
          </span>
        </div>
      );

    if (customers.length === 0) {
        return <LoadingSpinner />;
    }

    const customer = customers[0];

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="container mx-auto">
                {/* Header */}
                <div className="flex items-center mb-8">
                    <button 
                        onClick={() => router.back()} 
                        className="mr-4 text-gray-600 hover:text-red-600 transition-colors"
                    >
                        <BackIcon className="w-8 h-8" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Customer Details: {customer.customer_name}
                    </h1>
                </div>

                {/* Main Content Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Customer Information */}
                    <InfoCard title="Personal Information" icon={PhoneIcon}>
                        <InfoRow label="Customer ID" value={customer.cid} bold />
                        <InfoRow label="Phone Number" value={customer.phone_number} />
                        <InfoRow label="Address" value={customer.address} />
                        <InfoRow label="IP Type" value={customer.ip_type} />
                        <InfoRow label="Package" value={customer.package_name} />
                        <InfoRow label="Service" value={customer.service_name} />
                        <InfoRow label="Location" value={customer.location_name} />
                        <InfoRow label="Activation Date" value={formatDate(customer.activation_date)} />
                        <InfoRow label="Status" value={customer.status_type} />
                        <InfoRow label="Sale Name" value={customer.sale_name} />
                        <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Start Date</p>
                                <p className="text-base text-gray-800">{formatDate(customer.start_date)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">End Date</p>
                                <p className="text-base text-gray-800">{formatDate(customer.end_date)}</p>
                            </div>
                        </div>
                    </InfoCard>

                    {/* Service Information */}
                    <InfoCard title="Service Details" icon={ServerIcon}>
                        <InfoRow label="Router Name" value={customer.router_name} bold />
                        <InfoRow label="Device Name" value={customer.device_name} />
                        <InfoRow label="Device Type" value={customer.device_type} />
                        <InfoRow label="Longitude" value={customer.longtitude} />
                        <InfoRow label="Latitude" value={customer.langtitude} />
                        {customer.device_type_id !== 3 && (
                            <InfoRow label="Interface Name" value={customer.interface_info} />
                        )}
                        <InfoRow label="VLAN" value={customer.VLan} />
                        <InfoRow label="Description" value={customer.description} />
                        <InfoRow label="IP Address" value={customer.ip_address} />
                        <InfoRow label="Subnet" value={customer.subnet} />
                        <InfoRow label="Capacity Bandwidth" value={customer.capacity_bandwidth} />
                        
                        <InfoRow label="Service Type" value={customer.service_type} />
                        
                        {/* Conditional Rendering for Device-Specific Information */}
                        

                        {(customer.device_type_id === 1 || customer.device_type_id === 2) && (
                            <>
                                <InfoRow label="Switch Port" value={customer.switch_port} />
                                <InfoRow label="Port Type" value={customer.port_type} />
                                {/* <InfoRow label="Service Port" value={customer.service_port} />
                                <InfoRow label="Camera IP" value={customer.camera_ip} /> */}
                                <InfoRow label="ACL" value={customer.ACL} />
                            </>
                        )}

                        {customer.device_type_id === 3 && (
                            <>

                                <InfoRow label="Frame" value={customer.frame} />
                                <InfoRow label="Slot" value={customer.slot} />
                                <InfoRow label="Port" value={customer.port} />
                                <InfoRow label="Service Port" value={customer.service_port} />
                                <InfoRow label="ONU MAC Address" value={customer.ONU_mac_address} />
                                <InfoRow label="ONT ID" value={customer.ont_id} />
                                <InfoRow label="Serial Number" value={customer.serial_number} />
                                <InfoRow label="Survey ID" value={customer.survey_id} />
                            </>
                        )}
                    </InfoCard>

                    {/* Network and Additional Information */}
                    <div className="space-y-8">
                      <InfoCard title="Network Diagram" icon={FileIcon} className="bg-blue-50/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileIcon className="w-5 h-5 text-red-500" />
                            <span className="text-gray-700">Network Diagram</span>
                          </div>
                          {customer.pdfUrl ? (
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => {
                                  // Add type guard to ensure non-null value
                                  const pdfUrl = customer.pdfUrl;
                                  if (pdfUrl) {
                                    setSelectedPdfUrl(pdfUrl);
                                  }
                                }}
                                className="px-3 py-1 bg-blue-100 text-red-600 rounded-full hover:bg-blue-200 transition-colors flex items-center space-x-1"
                              >
                                <EyeIcon className="w-4 h-4" />
                                <span>Preview</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-500 italic">No diagram available</span>
                          )}
                        </div>
                      </InfoCard>
                    </div>
                  </div>
                </div>

            {/* PDF Preview Modal */}
            {selectedPdfUrl && (
                <PDFPreviewModal 
                    pdfUrl={selectedPdfUrl} 
                    onClose={() => setSelectedPdfUrl(null)} 
                />
            )}
        </div>
    );
}
// const handleFetchHistory = async (customerId: string) => {
//   try {
//     const { data: historyData, error: historyError } = await supabase
//       .from('CustomerHistory')
//       .select('*')
//       .eq('customer_id', customerId);

//     if (historyError) throw historyError;

//     const locationIds = historyData.flatMap(history =>
//       history.field_changed === 'location_id' ? [history.old_value, history.new_value] : []
//     );
//     const oltIds = historyData.flatMap(history =>
//       history.field_changed === 'olt_id' ? [history.old_value, history.new_value] : []
//     );
//     const deviceIds = historyData.flatMap(history =>
//       history.field_changed === 'device_id' ? [history.old_value, history.new_value] : []
//     );
//     const serviceIds = historyData.flatMap(history =>
//       history.field_changed === 'service_id' ? [history.old_value, history.new_value] : []
//     );
//     const packageIds = historyData.flatMap(history =>
//       history.field_changed === 'package_id' ? [history.old_value, history.new_value] : []
//     );
//     const interfaceIds = historyData.flatMap(history =>
//       history.field_changed === 'interface_id' ? [history.old_value, history.new_value] : []
//     );

//     const [locationsData, oltsData, devicesData, servicesData, packagesData, interfacesData] = await Promise.all([
//       supabase.from('Location').select('location_id, location_name').in('location_id', locationIds),
//       supabase.from('OLT').select('olt_id, olt_name').in('olt_id', oltIds),
//       supabase.from('Device').select('device_id, device_name').in('device_id', deviceIds),
//       supabase.from('Service').select('service_id, service_name').in('service_id', serviceIds),
//       supabase.from('Package').select('package_id, package_name').in('package_id', packageIds),
//       supabase.from('Interface').select('interface_id, interface_name').in('interface_id', interfaceIds),
//     ]);

//     const locationMap = Object.fromEntries(locationsData.data?.map(loc => [loc.location_id, loc.location_name]) ?? []);
//     const oltMap = Object.fromEntries(oltsData.data?.map(olt => [olt.olt_id, olt.olt_name]) ?? []);
//     const deviceMap = Object.fromEntries(devicesData.data?.map(dev => [dev.device_id, dev.device_name]) ?? []);
//     const serviceMap = Object.fromEntries(servicesData.data?.map(srv => [srv.service_id, srv.service_name]) ?? []);
//     const packageMap = Object.fromEntries(packagesData.data?.map(pkg => [pkg.package_id, pkg.package_name]) ?? []);
//     const interfaceMap = Object.fromEntries(interfacesData.data?.map(inte => [inte.interface_id, inte.interface_name]) ?? []);

//     const historyWithDetails = historyData.map(history => {
//       let changeDescription: string;

//       switch (history.field_changed) {
//         case 'location_id':
//           const oldLocationName = locationMap[history.old_value] || 'Unknown Location';
//           const newLocationName = locationMap[history.new_value] || 'Unknown Location';
//           changeDescription = `Location changed from "${oldLocationName}" to "${newLocationName}"`;
//           break;
//         case 'olt_id':
//           const oldOltName = oltMap[history.old_value] || 'Unknown OLT';
//           const newOltName = oltMap[history.new_value] || 'Unknown OLT';
//           changeDescription = `OLT changed from "${oldOltName}" to "${newOltName}"`;
//           break;
//         case 'device_id':
//           const oldDeviceName = deviceMap[history.old_value] || 'Unknown Device';
//           const newDeviceName = deviceMap[history.new_value] || 'Unknown Device';
//           changeDescription = `Device changed from "${oldDeviceName}" to "${newDeviceName}"`;
//           break;
//         case 'service_id':
//           const oldServiceName = serviceMap[history.old_value] || 'Unknown Service';
//           const newServiceName = serviceMap[history.new_value] || 'Unknown Service';
//           changeDescription = `Service changed from "${oldServiceName}" to "${newServiceName}"`;
//           break;
//         case 'package_id':
//           const oldPackageName = packageMap[history.old_value] || 'Unknown Package';
//           const newPackageName = packageMap[history.new_value] || 'Unknown Package';
//           changeDescription = `Package changed from "${oldPackageName}" to "${newPackageName}"`;
//           break;
//         case 'interface_id':
//           const oldInterfaceName = interfaceMap[history.old_value] || 'Unknown Interface';
//           const newInterfaceName = interfaceMap[history.new_value] || 'Unknown Interface';
//           changeDescription = `Interface changed from "${oldInterfaceName}" to "${newInterfaceName}"`;
//           break;
//         case 'isActive':
//           const oldStatusName = history.old_value === "true" ? "Active" : "Inactive";
//           const newStatusName = history.new_value === "true" ? "Active" : "Inactive";
//           changeDescription = `Status changed from "${oldStatusName}" to "${newStatusName}"`;
//           break;
//         default:
//           changeDescription = `${history.field_changed} changed from "${history.old_value}" to "${history.new_value}"`;
//       }

//       return {
//         ...history,
//         changeDescription,
//       };
//     });

//     setEditHistories((prevHistories) => ({
//       ...prevHistories,
//       [customerId]: historyWithDetails,
//     }));

//     setEditHistoryVisible((prevVisible) => ({
//       ...prevVisible,
//       [customerId]: !prevVisible[customerId],
//     }));
//   } catch (error) {
//     console.error('Error fetching edit history:', (error as Error).message);
//   }
// };
