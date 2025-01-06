"use client";
import { useParams } from 'next/navigation';
import CustomerServiceInfoForm from '@/app/component/customerServiceInfo';
import LoadingSpinner from '@/app/component/LoadingSpinner';

export default function CustomerInfoPage() {
  // Ensure the customer_id is typed correctly
  const { customer_id } = useParams() as { customer_id: string };

  return customer_id ? (
    <CustomerServiceInfoForm customerId={customer_id} />
  ) : (
    <LoadingSpinner />
  );
}
