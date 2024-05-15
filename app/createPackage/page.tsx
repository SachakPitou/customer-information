"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import SideBar from '../component/SideBar';
import CreatePackage from '../createPackage-content/page';
export default function Page() {
  return (
    <div className="relative overflow-x-auto w-full shadow-md sm:rounded-lg flex">
      <SideBar/>
      <CreatePackage/>
    </div>
  );
}


