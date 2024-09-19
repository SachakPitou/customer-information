"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';

export default function ApproveCustomerEdits() {
    const [customerEdits, setCustomerEdits] = useState([]);
    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customerEditsResponse, packagesResponse, servicesResponse] = await Promise.all([
                    supabase.from('Customer Edit').select('*').eq('approved', false),
                    supabase.from('Package').select('*'),
                    supabase.from('Service').select('*')
                ]);

                const customerEditsData = customerEditsResponse.data;
                const packagesData = packagesResponse.data;
                const servicesData = servicesResponse.data;

                const customerFetchPromises = customerEditsData.map(async (edit) => {
                    const { data: customerData, error: fetchError } = await supabase
                        .from('Customer')
                        .select('*')
                        .eq('customer_id', edit.customer_id)
                        .single();
                    
                    if (fetchError) throw new Error(fetchError.message);

                    return { ...edit, customerData };
                });

                const resolvedCustomerData = await Promise.all(customerFetchPromises);
                
                console.log('Resolved Customer Data:', resolvedCustomerData); // Debug log
                
                setCustomerEdits(resolvedCustomerData);
                setPackages(packagesData);
                setServices(servicesData);
            } catch (error) {
                console.error('Error fetching data:', error.message);
                setError(error.message);
            }
        };
    
        fetchData();
    }, []);

    const approveEdit = async (editId, customerId) => {
        try {
            // Fetch the edit data
            const { data: editData, error: fetchError } = await supabase
                .from('Customer Edit')
                .select('*')
                .eq('edit_id', editId)
                .single();
    
            if (fetchError) throw new Error(fetchError.message);
    
            // Fetch the current customer data
            const currentCustomerDataResponse = await supabase
                .from('Customer')
                .select('*')
                .eq('customer_id', customerId)
                .single();
    
            if (currentCustomerDataResponse.error) {
                throw new Error(currentCustomerDataResponse.error.message);
            }
    
            const currentCustomerData = currentCustomerDataResponse.data;
    
            // Update Customer table with the edit data
            const { error } = await supabase
                .from('Customer')
                .update({
                    customer_name: editData.customer_name,
                    phone_number: editData.phone_number,
                    cid: editData.cid,
                    address: editData.address,
                    activation_date: editData.activation_date,
                    service_id: editData.service_id,
                    package_id: editData.package_id,
                    isActive: editData.isActive,
                })
                .eq('customer_id', customerId);
    
            if (error) throw new Error(error.message);
    
            // Update Customer Edit table to mark the edit as approved
            const { error: updateError } = await supabase
                .from('Customer Edit')
                .update({ approved: true })
                .eq('edit_id', editId);
    
            if (updateError) throw new Error(updateError.message);
    
            // Filter out the approved edit from the customerEdits state
            setCustomerEdits(customerEdits.filter(edit => edit.edit_id !== editId));
            console.log('Customer edit approved and updated successfully');
    
        } catch (error) {
            console.error('Error approving customer edit:', error.message);
            setError(error.message);
        }
    };

    const getPackageName = (packageId) => {
        const pkg = packages.find(p => p.package_id === packageId);
        return pkg ? pkg.package_name : 'Unknown';
    };

    const getServiceName = (serviceId) => {
        const svc = services.find(s => s.service_id === serviceId);
        return svc ? svc.service_name : 'Unknown';
    };

    const formatDate = (dateString) => {
        console.log('Input dateString:', dateString);
        if (!dateString) return 'N/A';
        
        // Create a date object in UTC
        const date = new Date(dateString);
        console.log('Parsed date object:', date);
        if (isNaN(date.getTime())) return 'Invalid Date';
        
        // Adjust for Cambodia time (UTC+7)
        const cambodiaOffset = 7 * 60 * 60 * 1000; // UTC+7 in milliseconds
        const cambodiaTime = new Date(date.getTime() + cambodiaOffset);
        
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true,
            timeZone: 'Asia/Phnom_Penh'
        };
        
        const formattedDate = cambodiaTime.toLocaleString('en-US', options);
        console.log('Formatted date:', formattedDate);
        return formattedDate;
    };
    
    
    const renderChanges = (edit) => {
        const customerData = edit.customerData;
        const changes = [
            { field: 'Customer Name', old: customerData.customer_name, new: edit.customer_name },
            { field: 'Phone Number', old: customerData.phone_number, new: edit.phone_number },
            { field: 'CID', old: customerData.cid, new: edit.cid },
            { field: 'Address', old: customerData.address, new: edit.address },
            { field: 'Activation Date', old: customerData.activation_date, new: edit.activation_date },
            { field: 'Service', old: getServiceName(customerData.service_id), new: getServiceName(edit.service_id) },
            { field: 'Package', old: getPackageName(customerData.package_id), new: getPackageName(edit.package_id) },
            { field: 'Status', old: customerData.isActive ? "Active" : "Inactive", new: edit.isActive ? "Active" : "Inactive" },
        ];
    
        const changedFields = changes.filter(change => 
            change.old !== change.new && 
            (change.old !== null || change.new !== null) && 
            (change.old !== undefined || change.new !== undefined)
        );
    
        return changedFields.map((change, index) => (
            <tr key={`${edit.edit_id}-${index}`} className="bg-white border-b dark:bg-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-300">
                <td className="px-6 py-4">{edit.customer_name || customerData.customer_name}</td>
                <td className="px-6 py-4">{change.field}</td>
                <td className="px-6 py-4">{change.old !== null && change.old !== undefined ? change.old : 'N/A'}</td>
                <td className="px-6 py-4">{change.new !== null && change.new !== undefined ? change.new : 'N/A'}</td>
                <td className="px-6 py-4">{formatDate(edit.created_at)}</td>
                <td className="px-6 py-4">
                    <button onClick={() => approveEdit(edit.edit_id, edit.customer_id)} className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600">Approve</button>
                </td>
            </tr>
        ));
    };

    return (
        <div className="relative overflow-x-auto shadow-md">
            <div className="font-raleway-black w-full max-w-4xl p-5">
                {error && <p className="text-red-500">{error}</p>}
                <button onClick={() => router.back()} type="button" className="flex-shrink-0 w-8 h-8 mr-8 px-2 py-1 text-sm text-gray-700 transition-colors duration-200 gap-x-2 sm:w-auto dark:hover:bg-red-700 dark:bg-red-500 hover:bg-red-100 dark:text-red-200 dark:border-red-700">
                    <svg className="w-5 h-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                    </svg>
                </button>
                <span>Approve Customer Edits</span>
            </div>
            <table className="w-full text-sm text-left rtl:text-right text-black dark:text-black">
                <thead className="title-dashboard text-xs text-black uppercase bg-gray-50 dark:bg-gray-300 dark:text-black">
                    <tr>
                        <th scope="col" className="px-6 py-3">Name</th>
                        <th scope="col" className="px-6 py-3">Field</th>
                        <th scope="col" className="px-6 py-3">Old Value</th>
                        <th scope="col" className="px-6 py-3">New Value</th>
                        <th scope="col" className="px-6 py-3">Change Date</th>
                        <th scope="col" className="px-6 py-3">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {customerEdits.map((edit) => renderChanges(edit))}
                </tbody>
            </table>
            {error && <p className="text-red-500">{error}</p>}
        </div>
    );
}
