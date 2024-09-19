"use client";
import { useParams } from 'next/navigation';
import TechnicalForm from '@/app/component/technicalForm';

export default function TechnicalPage() {
  // Ensure the customer_id is typed correctly
  const { customer_id } = useParams() as { customer_id: string };

  console.log("customer id: ", customer_id); 

  return customer_id ? (
    <TechnicalForm customerId={customer_id} />
  ) : (
    <div>Loading...</div>
  );
}
