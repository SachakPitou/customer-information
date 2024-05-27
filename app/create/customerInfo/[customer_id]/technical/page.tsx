"use client"
import { useParams } from 'next/navigation';
import TechnicalForm from '@/app/component/technicalForm';

export default function TechnicalPage() {
  const { customer_id } = useParams();
    console.log("customer id: ", customer_id); 
  return customer_id ? <TechnicalForm customerId={ customer_id } /> : <div>Loading...</div>;
}