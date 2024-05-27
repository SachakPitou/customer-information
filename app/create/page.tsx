"use client"
import { useEffect, useState } from 'react';
import CustomerServiceForm from "../component/customerService";
import { createClient } from '@/utils/supabase/client';
import PendingRequests from '../pendingRequest/page';

export default function CreatePage() {
  const [userType, setUserType] = useState('');

  useEffect(() => {
    const fetchUserType = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getSession(); // Get session data

        if (error) {
          console.error('Error fetching session:', error.message);
          return;
        }

        const session = data.session;
        // No need to set session state here

        if (session) {
          const userId = session.user.id; // Extract user ID from session
          const { data: userData, error: userError } = await supabase
            .from('userAccount')
            .select('user_type') 
            .eq("id", userId)
            .single();

          if (userError) {
            throw userError;
          }

          if (userData) {
            setUserType(userData.user_type); // Set user type state
          }
        }
      } catch (error) {
        console.error('Error fetching user type:', error.message);
      }
    };

    fetchUserType();
  }, []);

  // Render CustomerServiceForm based on user type
  return (
    <div>
      {userType === 'customer_service' && <CustomerServiceForm />}
      {userType === 'technical' && <PendingRequests />}
    </div>
  );
}