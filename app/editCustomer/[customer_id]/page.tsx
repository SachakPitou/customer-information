"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import PopUpModal from '@/app/component/popUpmodal';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { Session } from '@supabase/supabase-js';
import LoadingSpinner from '@/app/component/LoadingSpinner';
import PDFUpload from '@/app/component/PDFUpload';

type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'REACTIVE' | 'TERMINATE' | '';
interface CustomerData {
  customer_id: string;
  customer_name: string;
  phone_number: string;
  cid: string;
  contract_id: string;
  address: string;
  longtitude: string | null;
  langtitude: string | null;
  ONU_mac_address: string;
  slot: number | null;
  port: number | null;
  service_port: number | null;
  onu_id: number | null;
  camera_ip: string;
  ip_address: string;
  activation_date: string;
  device_id: number | null;
  service_id: number;
  package_id: number;
  location_id: number;
  interface_id: number | null;
  device_type_id: number | null;
  isActive: boolean;
  description: string | null;
  ACL: string | null;
  VLan: string;
  frame: number | null;
  ont_id: number | null;
  port_type: string;
  switch_port: number | null;
  serial_number: string;
  router_device_id: number | null;
  capacity_bandwidth: string;
  subnet: string;
  survey_id: string;
  sale_name: string;
  service_type: string;
  [key: string]: any;
}
type StatusHistory = {
  id: number;
  customer_id: string;
  status_type: string;
  start_date: string;
  end_date: string;
};
interface ServiceData {
  service_id: number;
  service_name: string;
}
interface PackageData {
  package_id: number;
  service_id: number;
  package_name: string;
}
interface LocationData {
  location_id: number;
  location_name: string;
}
interface DeviceData {
  device_id: number;
  device_type_id: number;
  device_name: string;
  [key: string]: any;
}
interface DeviceTypeData {
  device_type_id: number;
}
interface InterfaceData {
  interface_id: number;
  interface_name: string;
  device_id: number;
  portDevice?: PortDeviceData;
}
interface PortDeviceData {
  interface_id: number;
  interface_name: string;
  port_number: number;
}
interface CustomerRouter {
  router_device_id: number | null;
  Device: {
    device_name: string;
  };
}
interface UserData {
  user_type: string;
}

export default function Page() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerData>({
    customer_id: '',
    customer_name: '',
    phone_number: '',
    cid: '',
    contract_id: '',
    address: '',
    longtitude: null,
    langtitude: null,
    ONU_mac_address: '',
    slot: null,
    port: null,
    service_port: null,
    onu_id: null,
    camera_ip: '',
    ip_address: '',
    activation_date: '',
    device_id: null,
    service_id: 0,
    package_id: 0,
    location_id: 0,
    interface_id: null,
    device_type_id: null,
    isActive: false,
    description: '',
    ACL: '',
    VLan: '',
    frame: null,
    ont_id: null,
    port_type: '',
    switch_port: null,
    router_device_id: null,
    router_name: '',
    capacity_bandwidth: '',
    subnet: '',
    survey_id: '',
    serial_number: '',
    sale_name: '',
    service_type: '',
  });
  const [services, setServices] = useState<ServiceData[]>([]);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [routers, setRouters] = useState<DeviceData[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeData[]>([]);
  const [interfaces, setInterfaces] = useState<InterfaceData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { customer_id } = useParams<{ customer_id: string }>();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [statusTimestamp, setStatusTimestamp] = useState('');
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRoutersLoading, setIsRoutersLoading] = useState<boolean>(true);
  const [statusDates, setStatusDates] = useState({
    start_date: '',
    end_date: '',
  });

  const closeModal = () => {
    setIsModalOpen(false);
    console.log('Modal Closed');
  };

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setIsLoading(true);
        const { data: customerRouter, error: routerError } = await supabase
          .from('customerrouter')
          .select(`
            router_device_id,
            Device:router_device_id (
              device_name
            )
          `)
          .eq('customer_id', customer_id)
          .single();

        if (routerError) throw routerError;

        const { data: customerData, error: customerError } = await supabase
          .from('Customer')
          .select('*')
          .eq('customer_id', customer_id)
          .single();

        if (customerError) throw customerError;

        const transformedRouterData: CustomerRouter = {
          router_device_id: customerRouter?.router_device_id ?? null,
          Device: {
            device_name: customerRouter?.Device?.[0]?.device_name ?? '',
          },
        };

        setCustomer({
          ...customerData,
          router_device_id: transformedRouterData.router_device_id,
          router_name: transformedRouterData.Device.device_name,
        });
      } catch (error) {
        console.error('Error fetching customer data:', error instanceof Error ? error.message : String(error));
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRouters = async () => {
      try {
        setIsRoutersLoading(true);
        const { data, error } = await supabase
          .from('Device')
          .select('*')
          .eq('device_type_id', 1)
          .order('device_name');

        if (error) throw error;
        const routerData = data || [];
        setRouters(routerData as DeviceData[]);
        console.log('Routers fetched:', {
          routerCount: routerData.length,
          firstRouter: routerData[0],
        });
      } catch (error) {
        console.error('Error fetching routers:', (error as Error).message);
        setError((error as Error).message);
        setRouters([]);
      } finally {
        setIsRoutersLoading(false);
      }
    };

    const fetchService = async () => {
      try {
        const { data, error } = await supabase.from('Service').select('*');
        if (error) throw error;
        setServices(data as ServiceData[]);
      } catch (error) {
        console.error('Error fetching services:', (error as Error).message);
        setError((error as Error).message);
      }
    };

    const fetchPackage = async () => {
      try {
        const { data, error } = await supabase.from('Package').select('*');
        if (error) throw error;
        setPackages(data as PackageData[]);
      } catch (error) {
        console.error('Error fetching packages:', (error as Error).message);
        setError((error as Error).message);
      }
    };

    const fetchLocation = async () => {
      try {
        const { data, error } = await supabase.from('Location').select('*');
        if (error) throw error;
        setLocations(data as LocationData[]);
      } catch (error) {
        console.error('Error fetching locations:', (error as Error).message);
        setError((error as Error).message);
      }
    };

    const fetchDevice = async () => {
      try {
        const { data, error } = await supabase
          .from('Device')
          .select('*')
          .in('device_type_id', [2, 3]);
        if (error) throw error;
        setDevices(data as DeviceData[]);
      } catch (error) {
        console.error('Error fetching devices:', (error as Error).message);
        setError((error as Error).message);
      }
    };

    const fetchDeviceType = async () => {
      try {
        const { data, error } = await supabase.from('Device Type').select('*');
        if (error) throw error;
        setDeviceTypes(data as DeviceTypeData[]);
      } catch (error) {
        console.error('Error fetching device types:', (error as Error).message);
        setError((error as Error).message);
      }
    };

    const fetchInterface = async () => {
      try {
        const { data: interfaceData, error: interfaceError } = await supabase.from('Interface').select('*');
        if (interfaceError) throw interfaceError;

        const { data: portDeviceData, error: portDeviceError } = await supabase.from('PortDevice').select('*');
        if (portDeviceError) throw portDeviceError;

        const combinedData = (interfaceData as InterfaceData[]).map(interfaceItem => {
          const portDeviceItem = (portDeviceData as PortDeviceData[]).find(pd => pd.interface_id === interfaceItem.interface_id);
          return {
            ...interfaceItem,
            portDevice: portDeviceItem,
          };
        });

        setInterfaces(combinedData);
      } catch (error) {
        console.error('Error fetching interfaces:', (error as Error).message);
        setError((error as Error).message);
      }
    };

    const fetchStatusHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('statushistory')
          .select('*')
          .eq('customer_id', customer_id)
          .order('start_date', { ascending: false });

        if (error) throw error;

        setStatusHistory(data || []);

        if (data && data.length > 0) {
          const mostRecentStatus = data[0];
          setStatusDates({
            start_date: mostRecentStatus.start_date || '',
            end_date: mostRecentStatus.end_date || '',
          });
        }
      } catch (error) {
        console.error('Error fetching status history:', error instanceof Error ? error.message : String(error));
      }
    };

    const fetchUserType = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error fetching session:', error.message);
          return;
        }

        const session = data.session;
        setSession(session);

        if (session) {
          const userId = session.user.id;
          const { data: userData, error: userError } = await supabase
            .from('userAccount')
            .select('user_type')
            .eq('id', userId)
            .single();

          if (userError) throw userError;

          if (userData) {
            setUserType((userData as UserData).user_type);
          }
        }
      } catch (error) {
        console.error('Error fetching user type:', (error as Error).message);
      }
    };

    fetchCustomerData();
    fetchDevice();
    fetchLocation();
    fetchPackage();
    fetchService();
    fetchUserType();
    fetchInterface();
    fetchDeviceType();
    fetchRouters();
    fetchStatusHistory();
  }, [customer_id]);

  const handleRouterChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRouterId = e.target.value;

    console.log('Router Change Debug:', {
      newRouterId,
      isNewRouterIdPresent: !!newRouterId,
      newRouterIdType: typeof newRouterId,
      convertedRouterId: newRouterId ? Number(newRouterId) : null,
    });

    try {
      const routerDeviceId = newRouterId ? Number(newRouterId) : null;

      console.log('Router Device ID:', {
        routerDeviceId,
        routerDeviceIdType: typeof routerDeviceId,
      });

      const { error: upsertError } = await supabase
        .from('customerrouter')
        .upsert(
          {
            customer_id: customer_id,
            router_device_id: routerDeviceId,
          },
          {
            onConflict: 'customer_id',
          }
        );

      if (upsertError) {
        console.error('Router upsert error:', upsertError);
        return;
      }

      setCustomer(prev => {
        console.log('Previous Customer State:', prev);
        const updatedCustomer = {
          ...prev,
          router_device_id: routerDeviceId,
          router_name: routers.find(r => r.device_id === routerDeviceId)?.device_name || '',
        };
        console.log('Updated Customer State:', updatedCustomer);
        return updatedCustomer;
      });
    } catch (error) {
      console.error('Router change error:', error);
    }
  };

  const updateStatusTimestamp = (status: CustomerStatus, customerData: CustomerData) => {
    const timestampField = `${status.toLowerCase()}_timestamp` as keyof CustomerData;
    const timestamp = customerData[timestampField] || '';
    setStatusTimestamp(typeof timestamp === 'string' ? timestamp.slice(0, 16) : '');
  };

  const handleDeviceChange = async (deviceId: string) => {
    try {
      if (!deviceId) {
        setCustomer(prevCustomer => ({
          ...prevCustomer,
          device_id: null,
          device_type_id: null,
          interface_id: null,
          switch_port: null,
          port_type: '',
          service_port: null,
          camera_ip: '',
          port: null,
          slot: null,
          frame: null,
          ONU_mac_address: '',
          onu_id: null,
          ont_id: null,
          serial_number: '',
        }));
        return;
      }

      const { data: device, error: deviceError } = await supabase
        .from('Device')
        .select('device_id, device_type_id, device_name')
        .eq('device_id', deviceId)
        .single();

      if (deviceError) throw deviceError;

      const { data: interfaceData, error: interfaceError } = await supabase
        .from('Interface')
        .select('interface_id')
        .eq('device_id', deviceId)
        .single();

      if (interfaceError && interfaceError.code !== 'PGRST116') {
        throw interfaceError;
      }

      setCustomer(prevCustomer => ({
        ...prevCustomer,
        device_id: device?.device_id ? Number(device.device_id) : null,
        device_type_id: device?.device_type_id ? Number(device.device_type_id) : null,
        interface_id: interfaceData?.interface_id ? Number(interfaceData.interface_id) : null,
        switch_port: null,
        port_type: '',
        service_port: null,
        camera_ip: '',
        port: null,
        slot: null,
        frame: null,
        ONU_mac_address: '',
        onu_id: null,
        ont_id: null,
        serial_number: '',
      }));
    } catch (error) {
      console.error('Error updating device details:', error instanceof Error ? error.message : String(error));
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      let editorUuid: string | null = null;
      if (sessionError) {
        console.warn('Unable to fetch auth session:', sessionError.message);
      } else if (session) {
        editorUuid = session.user.id;
      } else {
        console.warn('No active session found');
      }

      const { data: currentCustomerData, error: fetchError } = await supabase
        .from('Customer')
        .select('*')
        .eq('customer_id', customer_id)
        .single();

      if (fetchError) throw fetchError;

      const fieldsToCheck = [
        'customer_name',
        'phone_number',
        'cid',
        'contract_id',
        'address',
        'longtitude',
        'langtitude',
        'ONU_mac_address',
        'slot',
        'port',
        'service_port',
        'onu_id',
        'camera_ip',
        'ip_address',
        'activation_date',
        'device_id',
        'service_id',
        'package_id',
        'location_id',
        'isActive',
        'interface_id',
        'switch_port',
        'port_type',
        'ACL',
        'VLan',
        'description',
        'frame',
        'ont_id',
        'capacity_bandwidth',
        'status_type',
        'subnet',
        'sale_name',
        'serial_number',
        'survey_id',
        'service_type',
      ];

      const historyRecords = fieldsToCheck
        .map(field => {
          if (currentCustomerData[field] !== customer[field]) {
            return {
              customer_id: customer.customer_id,
              field_changed: field,
              old_value: currentCustomerData[field],
              new_value: customer[field],
              timestamp: new Date(),
              editedBy: editorUuid,
            };
          }
          return null;
        })
        .filter((record): record is NonNullable<typeof record> => record !== null);

      if (historyRecords.length > 0) {
        const { error: historyError } = await supabase.from('CustomerHistory').insert(historyRecords);
        if (historyError) throw historyError;
      }

      const { data: existingStatusHistory, error: fetchStatusError } = await supabase
        .from('statushistory')
        .select('*')
        .eq('customer_id', customer_id)
        .order('start_date', { ascending: false })
        .limit(1);

      if (fetchStatusError) {
        console.error('Error fetching existing status history:', fetchStatusError);
        throw fetchStatusError;
      }

      console.log('Existing status history:', existingStatusHistory);

      if (existingStatusHistory && existingStatusHistory.length > 0) {
        const currentStatusHistory = existingStatusHistory[0];

        if (
          currentStatusHistory.status_type !== customer.status_type ||
          currentStatusHistory.start_date !== statusDates.start_date ||
          currentStatusHistory.end_date !== statusDates.end_date
        ) {
          console.log('Status or dates have changed. Creating new record');

          const newStatusHistory: any = {
            customer_id: customer_id,
            status_type: customer.status_type || 'INACTIVE', // Default to INACTIVE if not set
            start_date: statusDates.start_date || null,
          };

          if (statusDates.end_date) {
            newStatusHistory.end_date = statusDates.end_date;
          }

          console.log('New status history data:', newStatusHistory);

          const { data: insertedData, error: insertStatusError } = await supabase
            .from('statushistory')
            .insert([newStatusHistory])
            .select();

          if (insertStatusError) {
            console.error('Error inserting new status history:', insertStatusError);
            throw insertStatusError;
          }

          console.log('Inserted status history data:', insertedData);
        } else {
          console.log('No changes in status history. Skipping update.');
        }
      } else {
        console.log('No existing status history. Inserting new record');

        const newStatusHistory: any = {
          customer_id: customer_id,
          status_type: customer.status_type || 'INACTIVE',
          start_date: statusDates.start_date || null,
        };

        if (statusDates.end_date) {
          newStatusHistory.end_date = statusDates.end_date;
        }

        console.log('New status history data:', newStatusHistory);

        const { data: insertedData, error: insertStatusError } = await supabase
          .from('statushistory')
          .insert([newStatusHistory])
          .select();

        if (insertStatusError) {
          console.error('Error inserting new status history:', insertStatusError);
          throw insertStatusError;
        }

        console.log('Inserted status history data:', insertedData);
      }

      console.log('Potentially Problematic Fields:', {
        router_device_id: customer.router_device_id,
        device_id: customer.device_id,
        device_type_id: customer.device_type_id,
        service_id: customer.service_id,
        package_id: customer.package_id,
        location_id: customer.location_id,
        interface_id: customer.interface_id,
      });

      const safeNumberConvert = (value: any): number | null => {
        if (value === undefined || value === null || value === '') {
          return null;
        }
        const numValue = Number(value);
        return !isNaN(numValue) && numValue !== 0 ? numValue : null;
      };

      const updateData = {
        ...customer,
        router_device_id: safeNumberConvert(customer.router_device_id),
        device_id: safeNumberConvert(customer.device_id),
        device_type_id: safeNumberConvert(customer.device_type_id),
        service_id: safeNumberConvert(customer.service_id) ?? 0,
        package_id: safeNumberConvert(customer.package_id) ?? 0,
        location_id: safeNumberConvert(customer.location_id) ?? 0,
        interface_id: safeNumberConvert(customer.interface_id),
      };

      console.log('Converted Update Data:', updateData);

      const { error } = await supabase
        .from('Customer')
        .update({
          device_id: updateData.device_id,
          device_type_id: updateData.device_type_id,
          service_id: updateData.service_id,
          package_id: updateData.package_id,
          location_id: updateData.location_id,
          interface_id: updateData.interface_id,
          customer_name: customer.customer_name,
          phone_number: customer.phone_number,
          cid: customer.cid,
          contract_id: customer.contract_id,
          address: customer.address,
          longtitude: customer.longtitude ? String(customer.longtitude) : null,
          langtitude: customer.langtitude ? String(customer.langtitude) : null,
          ONU_mac_address: customer.ONU_mac_address,
          slot: customer.slot,
          port: customer.port,
          service_port: customer.service_port,
          onu_id: customer.onu_id,
          camera_ip: customer.camera_ip,
          ip_address: customer.ip_address,
          survey_id: customer.survey_id,
          activation_date: customer.activation_date,
          switch_port: customer.switch_port,
          port_type: customer.port_type,
          ACL: customer.ACL ? String(customer.ACL) : null,
          VLan: customer.VLan,
          frame: customer.frame,
          ont_id: customer.ont_id,
          serial_number: customer.serial_number,
          subnet: customer.subnet,
          description: customer.description ? String(customer.description) : null,
          sale_name: customer.sale_name,
          service_type: customer.service_type,
        })
        .eq('customer_id', customer_id);

      if (error) throw new Error(error.message);

      const { data: routerUpsertData, error: routerError } = await supabase
        .from('customerrouter')
        .upsert(
          {
            customer_id: customer_id,
            router_device_id: updateData.router_device_id,
          },
          {
            onConflict: 'customer_id',
          }
        );

      console.log('Router upsert data:', routerUpsertData);
      console.log('Router upsert error:', routerError);

      if (routerError) throw new Error(routerError.message);

      router.push('/dashboard');
      setIsModalOpen(true);
      console.log('Customer updated successfully');
    } catch (error) {
      console.error('Error updating customer:', (error as Error).message);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  const filteredPackages = packages.filter(pkg => pkg.service_id === customer.service_id);
  const filteredInterfaces = interfaces.filter(inf => inf.device_id === customer.device_id);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isRoutersLoading || !routers || routers.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen dark:bg-gray-200">
      <div className="font-raleway-black w-full max-w-4xl p-5">
        <button
          onClick={() => router.back()}
          type="button"
          className="flex-shrink-0 w-8 h-8 mb-4 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700"
        >
          <svg
            className="w-5 h-5 rtl:rotate-180"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">Edit Customer Information</h2>
        <form onSubmit={handleEditCustomer} className="flex flex-wrap -mx-2">
          {userType !== 'technical' && (
            <>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="customerName" className="block mb-2">
                  Customer Name:
                </label>
                <input
                  type="text"
                  id="customerName"
                  placeholder="Enter customer name"
                  value={customer.customer_name}
                  onChange={e => setCustomer({ ...customer, customer_name: e.target.value })}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="phoneNumber" className="block mb-2">
                  Phone Number:
                </label>
                <input
                  type="text"
                  id="phoneNumber"
                  placeholder="Enter Phone Number"
                  value={customer.phone_number}
                  onChange={e => setCustomer({ ...customer, phone_number: e.target.value })}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="CID" className="block mb-2">
                  CID:
                </label>
                <input
                  type="text"
                  id="CID"
                  placeholder="Enter CID"
                  value={customer.cid}
                  onChange={e => setCustomer({ ...customer, cid: e.target.value })}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="contractID" className="block mb-2">
                  Contract ID:
                </label>
                <input
                  type="text"
                  id="contractID"
                  placeholder="Enter Contract ID"
                  value={customer.contract_id}
                  onChange={e => setCustomer({ ...customer, contract_id: e.target.value })}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="activationDate" className="block mb-2">
                  Activation Date:
                </label>
                <input
                  type="date"
                  id="activationDate"
                  value={customer.activation_date}
                  onChange={e => setCustomer({ ...customer, activation_date: e.target.value })}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="packageName" className="block mb-2">
                  Package Name:
                </label>
                <select
                  id="packageName"
                  value={customer.package_id}
                  onChange={e =>
                    setCustomer({
                      ...customer,
                      package_id: e.target.value ? Number(e.target.value) : 0,
                    })
                  }
                  className="w-full p-2 border rounded"
                  key={customer.service_id}
                >
                  <option value="">N/A</option>
                  {filteredPackages.map(pkg => (
                    <option key={pkg.package_id} value={pkg.package_id}>
                      {pkg.package_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="Address" className="block mb-2">
                  Address:
                </label>
                <input
                  type="text"
                  id="Address"
                  placeholder="Enter Address"
                  value={customer.address}
                  onChange={e => setCustomer({ ...customer, address: e.target.value })}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="serviceName" className="block mb-2">
                  Service Name:
                </label>
                <select
                  id="serviceName"
                  value={customer.service_id}
                  onChange={e => {
                    const newServiceId = e.target.value ? Number(e.target.value) : 0;
                    console.log('New service_id selected:', newServiceId);
                    setCustomer(prevCustomer => ({
                      ...prevCustomer,
                      service_id: newServiceId,
                      package_id: 0, // Reset package_id when service changes
                    }));
                  }}
                  className="w-full p-2 border rounded"
                >
                  <option value="">N/A</option>
                  {services.map(service => (
                    <option key={service.service_id} value={service.service_id}>
                      {service.service_name} (ID: {service.service_id})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          {userType !== 'customer_service' && (
            <>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="langtitudes" className="block mb-2">
                  Latitude:
                </label>
                <input
                  type="text"
                  id="langtitudes"
                  placeholder="Enter Latitude"
                  value={customer.langtitude || ''}
                  onChange={e => setCustomer({ ...customer, langtitude: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="longtitudes" className="block mb-2">
                  Longitude:
                </label>
                <input
                  type="text"
                  id="longtitudes"
                  placeholder="Enter Longitude"
                  value={customer.longtitude || ''}
                  onChange={e => setCustomer({ ...customer, longtitude: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="locationName" className="block mb-2">
                  Location Name:
                </label>
                <select
                  id="locationName"
                  value={customer.location_id}
                  onChange={e =>
                    setCustomer({
                      ...customer,
                      location_id: e.target.value ? Number(e.target.value) : 0,
                    })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="">N/A</option>
                  {locations.map(location => (
                    <option key={location.location_id} value={location.location_id}>
                      {location.location_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <h3 className="text-lg font-semibold mb-2">Network Diagrams</h3>
                <PDFUpload
                  customerId={customer_id}
                  onPDFUploaded={url => {
                    console.log('PDF uploaded:', url);
                  }}
                />
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="router" className="block mb-2">
                  Router:
                </label>
                {error && <div className="p-2 mb-2 bg-red-100 text-red-800 rounded">{error}</div>}
                {isRoutersLoading ? (
                  <div className="p-2">Loading routers...</div>
                ) : !routers.length ? (
                  <div className="p-2 bg-yellow-100 text-yellow-800 rounded">No routers available. Please contact support.</div>
                ) : (
                  <select
                    id="router"
                    value={customer?.router_device_id ?? ''}
                    onChange={handleRouterChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">N/A</option>
                    {routers.map(router => (
                      <option key={router.device_id} value={router.device_id}>
                        {router.device_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="deviceName" className="block mb-2">
                  Device Name:
                </label>
                <select
                  id="deviceName"
                  value={customer.device_id ?? ''}
                  onChange={e => handleDeviceChange(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">N/A</option>
                  {devices.map(dvc => (
                    <option key={dvc.device_id} value={dvc.device_id}>
                      {dvc.device_name}
                    </option>
                  ))}
                </select>
              </div>
              {customer.device_type_id !== 3 && (
                <div className="w-full md:w-1/2 px-2 mb-4">
                  <label htmlFor="interfaceName" className="block mb-2">
                    Interface Name:
                  </label>
                  <select
                    id="interfaceName"
                    value={customer.interface_id ?? ''}
                    onChange={e =>
                      setCustomer({
                        ...customer,
                        interface_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value="">N/A</option>
                    {filteredInterfaces.map(inf => (
                      <option key={inf.interface_id} value={inf.interface_id}>
                        Port {inf.portDevice?.port_number ?? 'N/A'}: {inf.interface_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="VLan" className="block mb-2">
                  VLAN:
                </label>
                <input
                  type="text"
                  id="VLan"
                  placeholder="Enter VLAN"
                  value={customer.VLan}
                  onChange={e => setCustomer({ ...customer, VLan: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="ipAddress" className="block mb-2">
                  IP Address:
                </label>
                <input
                  type="text"
                  id="ipAddress"
                  placeholder="Enter IP address"
                  value={customer.ip_address}
                  onChange={e => setCustomer({ ...customer, ip_address: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              {customer.ip_address && (
                <div className="w-full md:w-1/2 px-2 mb-4">
                  <label htmlFor="subnet" className="block mb-2">
                    Subnet:
                  </label>
                  <select
                    id="subnet"
                    value={customer.subnet}
                    onChange={e => setCustomer({ ...customer, subnet: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">N/A</option>
                    <option value="255.255.255.0">255.255.255.0</option>
                    <option value="255.255.255.128">255.255.255.128</option>
                    <option value="255.255.255.192">255.255.255.192</option>
                    <option value="255.255.255.224">255.255.255.224</option>
                    <option value="255.255.255.240">255.255.255.240</option>
                    <option value="255.255.255.248">255.255.255.248</option>
                    <option value="255.255.255.252">255.255.255.252</option>
                  </select>
                </div>
              )}
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="serviceType" className="block mb-2">
                  Service Type:
                </label>
                <select
                  id="serviceType"
                  value={customer.service_type}
                  onChange={e => setCustomer({ ...customer, service_type: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">N/A</option>
                  <option value="PPPoE">PPPoE</option>
                  <option value="Static">Static</option>
                </select>
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="description" className="block mb-2">
                  Description:
                </label>
                <input
                  type="text"
                  id="description"
                  placeholder="Enter Description"
                  value={customer.description || ''}
                  onChange={e => setCustomer({ ...customer, description: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="capacityBandwidth" className="block mb-2">
                  Capacity Bandwidth:
                </label>
                <input
                  type="text"
                  id="capacityBandwidth"
                  placeholder="Enter Capacity Bandwidth"
                  value={customer.capacity_bandwidth}
                  onChange={e => setCustomer({ ...customer, capacity_bandwidth: e.target.value })}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-full md:w-1/2 px-2 mb-4">
                <label htmlFor="saleName" className="block mb-2">
                  Sale Name:
                </label>
                <input
                  type="text"
                  id="saleName"
                  placeholder="Enter Sale Name"
                  value={customer.sale_name}
                  onChange={e => setCustomer({ ...customer, sale_name: e.target.value })}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>
              {(customer.device_type_id === 1 || customer.device_type_id === 2) && (
                <>
                  <div className="w-full md:w-1/2 px-2 mb-4">
                    <label htmlFor="switchPort" className="block mb-2">
                      Switch Port:
                    </label>
                    <input
                      type="text"
                      id="switchPort"
                      placeholder="Enter Switch Port"
                      value={customer.switch_port ?? ''}
                      onChange={e => setCustomer({ ...customer, switch_port: e.target.value ? Number(e.target.value) : null })}
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="w-full md:w-1/2 px-2 mb-4">
                    <label htmlFor="portType" className="block mb-2">
                      Port Type:
                    </label>
                    <input
                      type="text"
                      id="portType"
                      placeholder="Enter Port Type"
                      value={customer.port_type}
                      onChange={e => setCustomer({ ...customer, port_type: e.target.value })}
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="w-full md:w-1/2 px-2 mb-4">
                    <label htmlFor="ACL" className="block mb-2">
                      ACL:
                    </label>
                    <input
                      type="text"
                      id="ACL"
                      placeholder="Enter ACL"
                      value={customer.ACL || ''}
                      onChange={e => setCustomer({ ...customer, ACL: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </>
              )}
              {customer.device_type_id === 3 && (
                <>
                  <div className="w-full md:w-1/2 px-2 mb-4">
                    <label htmlFor="port" className="block mb-2">
                      Port:
                    </label>
                    <input
                      type="text"
                      id="port"
                      placeholder="Enter Port"
                      value={customer.port ?? ''}
                      onChange={e => setCustomer({ ...customer, port: e.target.value ? Number(e.target.value) : null })}
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="w-full md:w-1/2 px-2 mb-4">
                    <label htmlFor="slot" className="block mb-2">
                      Slot:
                    </label>
                    <input
                      type="text"
                      id="slot"
                      placeholder="Enter Slot"
                      value={customer.slot ?? ''}
                      onChange={e => setCustomer({ ...customer, slot: e.target.value ? Number(e.target.value) : null })}
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="w-full md:w-1/2 px-2 mb-4">
                    <label htmlFor="frame" className="block mb-2">
                      Frame:
                    </label>
                    <input
                      type="text"
                      id="frame"
                      placeholder="Enter Frame"
                      value={customer.frame ?? ''}
                      onChange={e => setCustomer({ ...customer, frame: e.target.value ? Number(e.target.value) : null })}
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="w-full md:w-1/2 px-2 mb-4">
                    <label htmlFor="onuMacAddress" className="block mb-2">
                      ONU Mac Address:
                    </label>
                    <input
                      type="text"
                      id="onuMacAddress"
                      placeholder="Enter ONU Mac Address"
                      value={customer.ONU_mac_address}
                      onChange={e => setCustomer({ ...customer, ONU_mac_address: e.target.value })}
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="w-full md:w-1/2 px-2 mb-4">
                    <label htmlFor="servicePort" className="block mb-2">
                      Service Port:
                    </label>
                    <input
                      type="text"
                      id="servicePort"
                      placeholder="Enter Service Port"
                      value={customer.service_port ?? ''}
                      onChange={e => setCustomer({ ...customer, service_port: e.target.value ? Number(e.target.value) : null })}
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="w-full md:w-1/2 px-2 mb-4">
                    <label htmlFor="ontId" className="block mb-2">
                      ONT ID:
                    </label>
                    <input
                      type="text"
                      id="ontId"
                      placeholder="Enter ONT ID"
                      value={customer.ont_id ?? ''}
                      onChange={e => setCustomer({ ...customer, ont_id: e.target.value ? Number(e.target.value) : null })}
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="w-full md:w-1/2 px-2 mb-4">
                    <label htmlFor="serialNumber" className="block mb-2">
                      Serial Number:
                    </label>
                    <input
                      type="text"
                      id="serialNumber"
                      placeholder="Enter Serial Number"
                      value={customer.serial_number}
                      onChange={e => setCustomer({ ...customer, serial_number: e.target.value })}
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="w-full md:w-1/2 px-2 mb-4">
                    <label htmlFor="cameraIP" className="block mb-2">
                      Camera IP:
                    </label>
                    <input
                      type="text"
                      id="cameraIP"
                      placeholder="Enter Camera IP"
                      value={customer.camera_ip}
                      onChange={e => setCustomer({ ...customer, camera_ip: e.target.value })}
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="w-full md:w-1/2 px-2 mb-4">
                    <label htmlFor="surveyId" className="block mb-2">
                      Survey ID:
                    </label>
                    <input
                      type="text"
                      id="surveyId"
                      placeholder="Enter Survey ID"
                      value={customer.survey_id ?? ''}
                      onChange={e => setCustomer({ ...customer, survey_id: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </>
              )}
              <br />
            </>
          )}
          <div className="w-full p-2 text-center">
            <button type="submit" className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600">
              Update Customer
            </button>
          </div>
        </form>
        <PopUpModal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={customer_id ? 'Success' : 'Error'}
          content={
            <>
              {customer_id && <p className="text-center text-green-700 mt-4">Customer updated successfully with ID: {customer_id}</p>}
              {error && <p className="text-center text-red-700 mt-4">Error updating customer: {error}</p>}
            </>
          }
        />
      </div>
    </div>
  );
}

 // const handleStatusTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    //   const newStatusType = e.target.value as CustomerStatus;
    //   setCustomer(prevCustomer => {
    //     const updatedCustomer = { ...prevCustomer, status_type: newStatusType };
    //     updateStatusTimestamp(newStatusType, updatedCustomer);
    //     return updatedCustomer;
    //   });
    
    //   // Find the most recent status history for the new status type
    //   const relevantHistory = statusHistory.find(item => item.status_type === newStatusType);
    //   if (relevantHistory) {
    //     setStatusDates({
    //       start_date: relevantHistory.start_date,
    //       end_date: relevantHistory.end_date || new Date().toISOString().split('T')[0] // Set to current date if null
    //     });
    //   } else {
    //     // If no history found, set start date to today and end date to a future date (e.g., one year from now)
    //     const today = new Date();
    //     const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    //     setStatusDates({
    //       start_date: today.toISOString().split('T')[0],
    //       end_date: oneYearFromNow.toISOString().split('T')[0]
    //     });
    //   }
    // };
    
    // const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //   const newStartDate = e.target.value;
    //   setStatusDates(prevDates => ({ ...prevDates, start_date: newStartDate }));
    // };
    
    // const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //   const newEndDate = e.target.value;
    //   setStatusDates(prevDates => ({ ...prevDates, end_date: newEndDate }));
    // };

    // const handleNoEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //   if (e.target.checked) {
    //     setStatusDates(prevDates => ({ ...prevDates, end_date: '' }));
    //   } else {
    //     const today = new Date().toISOString().split('T')[0];
    //     setStatusDates(prevDates => ({ ...prevDates, end_date: today }));
    //   }
    // };
    // const formatDate = (dateString: string | null): string => {
    //   if (!dateString) return 'N/A';
    //   return new Date(dateString).toLocaleString();
    // };