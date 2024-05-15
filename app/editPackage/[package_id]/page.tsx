"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SideBar from '@/app/component/SideBar';
import EditPackage from '@/app/editPackage-content/[package_id]/page';


// const ACTIVE = 'active';
// const INACTIVE = 'inactive';
export default function Page() {
    
    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg flex">
            <SideBar/>
            <EditPackage/>
        </div>
    );
}
