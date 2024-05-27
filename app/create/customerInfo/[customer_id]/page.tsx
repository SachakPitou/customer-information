"use client"
import { useParams } from 'next/navigation';
import CustomerServiceInfoForm from '@/app/component/customerServiceInfo';

export default function CustomerInfoPage() {
  const { customer_id } = useParams();

  return customer_id ? <CustomerServiceInfoForm customerId={ customer_id } /> : <div>Loading...</div>;
}