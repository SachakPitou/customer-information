"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SideBar from '../component/SideBar';
import DeviceDetail from '../deviceDetail-content/page';

export default function Page() {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true); // Initial state

  // Optional: Sync with localStorage if SideBar persists state there
  useEffect(() => {
    const storedState = localStorage.getItem('sidebarOpen');
    if (storedState) setIsSidebarOpen(JSON.parse(storedState));
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar with callback to update state */}
      <SideBar isOpen={isSidebarOpen} onToggle={setIsSidebarOpen} />

      {/* Main Content Area */}
      <main
        className={`flex-1 p-4 transition-all duration-300 overflow-y-auto ${
          isSidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        <DeviceDetail />
      </main>
    </div>
  );
}
