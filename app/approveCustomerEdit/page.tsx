"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';

export default function ApproveCustomerEdits() {
    const [customerEdits, setCustomerEdits] = useState([]);
    const [editHistory, setEditHistory] = useState([]);
    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customerEditsResponse, editHistoryResponse, packagesResponse, servicesResponse] = await Promise.all([
                    supabase.from('Customer Edit').select('*').eq('approved', false),
                    supabase.from('CustomerHistory').select('*'),
                    supabase.from('Package').select('*'),
                    supabase.from('Service').select('*')
                ]);

                const customerEditsData = customerEditsResponse.data;
                const editHistoryData = editHistoryResponse.data;
                const packagesData = packagesResponse.data;
                const servicesData = servicesResponse.data;

                // Fetch corresponding Customer data for each edit
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
                
                setCustomerEdits(resolvedCustomerData);
                setEditHistory(editHistoryData);
                setPackages(packagesData);
                setServices(servicesData);
            } catch (error) {
                console.error('Error fetching data:', error.message);
                setError(error.message);
            }
        };
    
        fetchData(); // Call the function to fetch data on mount
    }, []); // Empty dependency array ensures this runs only once on mount

    const approveEdit = async (editId, customerId) => {
        try {
            const { data: editData, error: fetchError } = await supabase
                .from('Customer Edit')
                .select('*')
                .eq('edit_id', editId)
                .single();

            if (fetchError) throw new Error(fetchError.message);

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
                    longtitude: editData.longtitude,
                    langtitude: editData.langtitude,
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

            // Fetch and update edit history related to this customer edit
            const { data: fetchedHistory, error: historyError } = await supabase
                .from('CustomerHistory')
                .select('*')
                .eq('customer_id', customerId)
                .order('timestamp', { ascending: false });

            if (historyError) throw new Error(historyError.message);

            setEditHistory(fetchedHistory);

            // Filter out the approved edit from the customerEdits state
            setCustomerEdits(customerEdits.filter(edit => edit.edit_id !== editId));
            console.log('Customer edit approved and updated successfully');
        } catch (error) {
            console.error('Error approving customer edit:', error.message);
            setError(error.message);
        }
    };

    // Render function for displaying changes
    const renderChanges = (edit) => {
        const customerData = edit.customerData;
        const getPackageName = (packageId) => {
            const pkg = packages.find(p => p.package_id === packageId);
            return pkg ? pkg.package_name : 'Unknown';
        };
        const getServiceName = (serviceId) => {
            const svc = services.find(s => s.service_id === serviceId);
            return svc ? svc.service_name : 'Unknown';
        };

        const changes = [
            { label: 'Customer Name', old: customerData.customer_name, new: edit.customer_name },
            { label: 'Phone Number', old: customerData.phone_number, new: edit.phone_number },
            { label: 'CID', old: customerData.cid, new: edit.cid },
            { label: 'Address', old: customerData.address, new: edit.address },
            { label: 'Longitude', old: customerData.longtitude, new: edit.longtitude },
            { label: 'Latitude', old: customerData.langtitude, new: edit.langtitude },
            { label: 'Activation Date', old: customerData.activation_date, new: edit.activation_date },
            { label: 'Service', old: getServiceName(customerData.service_id), new: getServiceName(edit.service_id) },
            { label: 'Package', old: getPackageName(customerData.package_id), new: getPackageName(edit.package_id) },
            { label: 'Status', old: customerData.isActive ? "Active" : "Inactive", new: edit.isActive ? "Active" : "Inactive" },
        ];

        return (
            <tr key={edit.edit_id} className="dashboard-text bg-white border-b dark:bg-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-300">
                <td className="px-6 py-4">
                    {changes.map((change, index) => (
                        <div key={index}>
                            <strong>{change.label}:</strong> <br />
                            <span className="text-red-500">Old: {change.old}</span> <br />
                            <span className="text-green-500">New: {change.new}</span>
                        </div>
                    ))}
                </td>
                <td className="px-6 py-4">
                    <button onClick={() => approveEdit(edit.edit_id, edit.customer_id)} className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600">Approve</button>
                </td>
            </tr>
        );
    };

    // Filter edit history records that match customer edits awaiting approval
    const historyToApprove = editHistory.filter(historyRecord =>
        customerEdits.some(edit => edit.edit_id === historyRecord.edit_id)
    );

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
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="title-dashboard text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-300 dark:text-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">Changes</th>
                        <th scope="col" className="px-6 py-3">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {customerEdits.map((edit) => renderChanges(edit))}
                </tbody>
            </table>

            {/* Display Edit History Needing Approval */}
            {/* <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4">Edit History Needing Approval</h2>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {historyToApprove.map((historyRecord, index) => (
                        <li key={index} className="py-2">
                            <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-semibold">{historyRecord.field_changed}: </span>
                                {`Changed from "${historyRecord.old_value}" to "${historyRecord.new_value}" on ${new Date(historyRecord.timestamp).toLocaleString()}`}
                            </p>
                        </li>
                    ))}
                </ul>
            </div> */}

            {error && <p className="text-red-500">{error}</p>}
        </div>
    );
}
