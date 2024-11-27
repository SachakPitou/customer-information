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
            const { data: customerData, error: customerError } = await supabase
              .from('Customer')
              .select('customer_name')
              .eq('customer_id', notification.related_id)
              .single();

            if (customerError) {
              console.error('Error fetching customer name:', customerError);
              return { ...notification, customer_name: 'Unknown' };
            }

            return { ...notification, customer_name: customerData?.customer_name || 'Unknown' };
          })
        );

        setNotifications(notificationsWithCustomerNames);
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
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        },
        (payload) => {
        // Only add the notification if it's unread
        if (payload.new.is_read === false) {
            setNotifications((prev) => [payload.new, ...prev]);
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
  const markNotificationAsRead = async (id: number) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      // Optimistically update local state
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    } catch (err) {
      console.error('Unexpected error marking notification:', err);
    }
  };

  return {
    notifications,
    markNotificationAsRead,
    error,
  };
}

export function NotificationBell() {
  const { notifications, markNotificationAsRead, error } = useCustomerNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleNotificationDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
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
                <div className="text-sm text-gray-500">{notification.created_at}</div>
                <p>{notification.message}</p>
              </div>
              <button
                onClick={() => {
                  markNotificationAsRead(notification.id);
                  setIsDropdownOpen(false);
                }}
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
