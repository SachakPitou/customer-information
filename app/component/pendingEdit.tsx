// "use client";
// import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient';

// export default function ReviewChangeRequests() {
//     const [changeRequests, setChangeRequests] = useState([]);

//     useEffect(() => {
//         const fetchChangeRequests = async () => {
//             try {
//                 const { data, error } = await supabase
//                     .from('CustomerChangeRequests')
//                     .select('*')
//                     .eq('status', 'pending');
//                 if (error) throw new Error(error.message);
//                 setChangeRequests(data);
//             } catch (error) {
//                 console.error('Error fetching change requests:', error.message);
//             }
//         };

//         fetchChangeRequests();
//     }, []);

//     const handleApprove = async (request) => {
//         try {
//             const { error: updateError } = await supabase
//                 .from('Customer')
//                 .update({ [request.field_changed]: request.new_value })
//                 .eq('customer_id', request.customer_id);
//             if (updateError) throw new Error(updateError.message);

//             const { error: requestError } = await supabase
//                 .from('CustomerChangeRequests')
//                 .update({ status: 'approved', approved_by: session.user.id, approved_at: new Date() })
//                 .eq('request_id', request.request_id);
//             if (requestError) throw new Error(requestError.message);

//             setChangeRequests(changeRequests.filter(cr => cr.request_id !== request.request_id));
//         } catch (error) {
//             console.error('Error approving change request:', error.message);
//         }
//     };

//     const handleReject = async (request) => {
//         try {
//             const { error } = await supabase
//                 .from('CustomerChangeRequests')
//                 .update({ status: 'rejected', approved_by: session.user.id, approved_at: new Date() })
//                 .eq('request_id', request.request_id);
//             if (error) throw new Error(error.message);

//             setChangeRequests(changeRequests.filter(cr => cr.request_id !== request.request_id));
//         } catch (error) {
//             console.error('Error rejecting change request:', error.message);
//         }
//     };

//     return (
//         <div>
//             <h2>Pending Customer Change Requests</h2>
//             {changeRequests.length === 0 ? (
//                 <p>No pending requests</p>
//             ) : (
//                 <ul>
//                     {changeRequests.map(request => (
//                         <li key={request.request_id}>
//                             <p>{request.field_changed}: {request.old_value} → {request.new_value}</p>
//                             <button onClick={() => handleApprove(request)}>Approve</button>
//                             <button onClick={() => handleReject(request)}>Reject</button>
//                         </li>
//                     ))}
//                 </ul>
//             )}
//         </div>
//     );
// }
