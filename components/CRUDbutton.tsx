import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import React from 'react';
import { AuthButtons } from './AuthButtons';

export const CrudButton = async () => {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return <AuthButtons/>;
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-x-6">
      <Link
        href="/create"
        className="rounded-md border border-red-500 bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Create
      </Link>
      <Link
        href="/dashboard"
        className="text-sm font-semibold leading-6 text-black-200 rounded-md border border-red-500 py-2 px-6 hover:border-red-300"
      >
        Dashboard
      </Link>
    </div>
  );
};