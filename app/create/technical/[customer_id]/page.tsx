"use client";
import { useParams } from 'next/navigation';
import TechnicalForm from '@/app/component/technicalForm';
import LoadingSpinner from '@/app/component/LoadingSpinner';

export default function TechnicalPage() {
  // Ensure the customer_id is typed correctly
  const { customer_id } = useParams() as { customer_id: string };

  return customer_id ? (
    <TechnicalForm customerId={customer_id} />
  ) : (
    <LoadingSpinner />
  );
}
