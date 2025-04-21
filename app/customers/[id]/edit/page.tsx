import { getCustomerById, getSalesReps } from '@/lib/supabase/api';
import MainLayout from '@/components/layouts/MainLayout';
import CustomerForm from '@/components/forms/CustomerForm';
import { notFound } from 'next/navigation';

type Props = {
  params: {
    id: string;
  };
};

export default async function EditCustomerPage({ params }: Props) {
  // 顧客データと営業担当者のデータを取得
  const [customer, salesReps] = await Promise.all([
    getCustomerById(params.id),
    getSalesReps()
  ]);
  
  // 顧客が見つからない場合は404ページを表示
  if (!customer) {
    notFound();
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">顧客編集: {customer.name}</h1>
        <div className="rounded-lg border bg-card p-6">
          <CustomerForm customer={customer} salesReps={salesReps} />
        </div>
      </div>
    </MainLayout>
  );
}
