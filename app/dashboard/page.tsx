"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SideBar from '../component/SideBar';
import Dashboard from '../dashboard-content/page';
import Layout from '../component/layout';


// const ACTIVE = 'active';
// const INACTIVE = 'inactive';
export default function Page() {
    
    return (
        <div className="relative overflow-x-auto shadow-md flex">
            {/* <Layout> */}
            <SideBar/>
            <Dashboard/>
            {/* </Layout> */}
        </div>
    );
}
