
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { CrudButton } from './CRUDbutton';
import PendingRequests from '@/app/pendingRequest/page';

export const Hero = () => {
  // const router = useRouter();
  // const [session, setSession] = useState(null);
  // const [userType, setUserType] = useState('');

  // useEffect(() => {
  //   const fetchUserType = async () => {
  //     try {
  //       const supabase = createClient();
  //       const { data, error } = await supabase.auth.getSession(); // Get session data

  //       if (error) {
  //         console.error('Error fetching session:', error.message);
  //         return;
  //       }

  //       const session = data.session;
  //       setSession(session); // Set session state

  //       if (session) {
  //         const userId = session.user.id; // Extract user ID from session
  //         const { data: userData, error: userError } = await supabase
  //           .from('userAccount')
  //           .select('user_type')
  //           .eq("id", userId)
  //           .single();

  //         if (userError) {
  //           throw userError;
  //         }

  //         if (userData) {
  //           setUserType(userData.user_type); // Set user type state
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error fetching user type:', error.message);
  //     }
  //   };

  //   fetchUserType();
  // }, []);

  return (
    <div>
      {/* <Layout> */}
      <div className="relative isolate px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-black-100 sm:text-6xl">
              Customer Information
            </h1>
            <p className="mt-6 text-lg leading-8 text-black-300">
              Data contained all the MAT customer information.
            </p>
           
            <CrudButton />
  
          </div>
        </div>
      </div>
    </div>
  );
};
