"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function   
 ProtectedPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getCookie('auth_token');
    const expiration = getCookie('auth_expiration');

    if (token && expiration) {
      const now = new Date().getTime();
      if (now < expiration) {
        setIsLoggedIn(true);
      } else {
        // Session expired, redirect to login
        router.push('/login');
      }
    } else {
      // No token or expired, redirect to login
      router.push('/login');
    }
  }, []);

  // ... rest of your component
}

export default ProtectedPage;