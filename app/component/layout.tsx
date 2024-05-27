
// "use client";
// import { useEffect, useState } from 'react';
// import { redirect, useRouter } from 'next/navigation';
// import { createClient } from '@/utils/supabase/client';
// import SideBar from './SideBar';


// const Layout = ({ children }) => {
//   const [authenticated, setAuthenticated] = useState(false);
//   const router = useRouter();
//   const [session, setSession] = useState(null);

//   useEffect(() => {
    
//     const checkAuthentication = async () => {
//     const supabase = createClient();
//       try {
//         const { data, error } = await supabase.auth.getSession();
//         console.log('Session data:', data); // Debugging session data

//         const session = data.session;
//         setSession(session);
//         if (!session) {
//           return redirect('/login');
//         } else {
//           // If user is authenticated, set authenticated state to true
//           setAuthenticated(true);
//           console.log('User email:', session.user.email);
//           console.log('User ID:', session.user.id);
//         }
//       } catch (error) {
//         console.error('Error checking authentication:', error.message);
//       }
//     };
  
//     // Call the function to check authentication status
//     checkAuthentication();
//   }, []);
  

//   return authenticated ? (
//     <div className="relative overflow-x-auto shadow-md flex">
//       <SideBar />
//       <div>{children}</div>
//     </div>
//   ) : null;
// };

// export default Layout;