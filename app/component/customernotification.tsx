"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

function useCustomerNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Fetch existing notifications
    const fetchNotifications = async () => {
      try {
        const { data: notificationsData, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching notifications:', error);
          setError(error.message);
          return;
        }

        // Fetch customer names for each notification based on related_id
        const notificationsWithCustomerNames = await Promise.all(
          notificationsData.map(async (notification) => {
            try {
              console.log('Fetching customer for related_id:', notification.related_id);
              
              const { data: customerData, error: customerError } = await supabase
                .from('Customer')
                .select('customer_name')
                .eq('customer_id', notification.related_id)
                .single();

              console.log('Customer Data:', customerData);
              console.log('Customer Error:', customerError);

              if (customerError) {
                console.error('Error fetching customer name:', customerError);
                return { 
                  ...notification, 
                  customer_name: 'Unknown',
                  fetch_error: customerError.message 
                };
              }

              return { 
                ...notification, 
                customer_name: customerData?.customer_name || 'Unknown' 
              };
            } catch (catchError) {
              console.error('Unexpected error fetching customer:', catchError);
              return { 
                ...notification, 
                customer_name: 'Unknown',
                fetch_error: String(catchError) 
              };
            }
          })
        );

        // Deduplicate notifications
        const uniqueNotifications = Array.from(
          new Map(
            notificationsWithCustomerNames.map(notification => [
              `${notification.related_id}-${notification.message}-${notification.created_at}`, 
              notification
            ])
          ).values()
        );

        setNotifications(uniqueNotifications);
      } catch (err) {
        console.error('Unexpected error in notifications:', err);
        setError('Failed to fetch notifications');
      }
    };

    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: '*', // Listen to all events (INSERT, UPDATE, etc.)
      schema: 'public',
      table: 'notifications',
    },
    (payload) => {
      console.log('Notification payload:', payload);

      // Handle different event types
      switch(payload.eventType) {
        case 'INSERT':
          if (payload.new.is_read === false) {
            setNotifications((prev) => {
              const isDuplicate = prev.some(
                notification => 
                  notification.related_id === payload.new.related_id && 
                  notification.message === payload.new.message && 
                  notification.created_at === payload.new.created_at
              );

              return isDuplicate 
                ? prev 
                : [payload.new, ...prev];
            });
          }
          break;
        
        // Optionally handle other event types if needed
        case 'UPDATE':
          // Handle updates if necessary
          break;
      }
    }
  )
  .subscribe();
    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Method to mark notification as read
  const markNotificationsAsRead = async (notification: any) => {
    try {
      // Find all notifications with the same related_id, message, and created_at
      const notificationIdsToUpdate = notifications
        .filter(
          (n) =>
            n.related_id === notification.related_id &&
            n.message === notification.message &&
            n.created_at === notification.created_at
        )
        .map((n) => n.id);

      // Update all matching notifications to be read
      await Promise.all(
        notificationIdsToUpdate.map(async (id) => {
          const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

          if (error) {
            console.error('Error marking notification as read:', error);
          }
        })
      );

      // Optimistically update local state
      setNotifications((prev) =>
        prev.filter((n) => !notificationIdsToUpdate.includes(n.id))
      );
    } catch (err) {
      console.error('Unexpected error marking notification:', err);
    }
  };

  return {
    notifications,
    markNotificationsAsRead,
    error,
  };
}



export function NotificationBell() {
  const { notifications, markNotificationsAsRead, error } = useCustomerNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleNotificationDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  const handleDismiss = (notification: any) => {
    markNotificationsAsRead(notification);
    setIsDropdownOpen(false);
  };

  // Format date to dd/mm/yy
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  if (error) {
    console.error('Notification error:', error);
    return null;
  }

  return (
    <div className="relative">
      <button
        className="relative cursor-pointer"
        onClick={toggleNotificationDropdown}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>
      {isDropdownOpen && notifications.length > 0 && (
        <div className="absolute right-8 mt-2 w-128 bg-white border rounded shadow-lg z-50">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-4 border-b flex justify-between items-center"
            >
              <div>
                <span><strong>{notification.customer_name}</strong></span>
                <div className="text-sm text-gray-500">
                  {formatDate(notification.created_at)}
                </div>
                <p>{notification.message}</p>
              </div>
              <button
                onClick={() => handleDismiss(notification)}
                className="text-sm text-gray-500 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;