
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { CrudButton } from '../CRUDbutton';
import PendingRequests from '@/app/pendingRequest/page';
import LoadingSpinner from '@/app/component/LoadingSpinner';


interface HeroProps {
  loading?: boolean;
}

export const Hero = ({ loading = false }: HeroProps) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
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