'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCustomers, getSalesReps } from '@/lib/supabase/api';
import { getUser } from '@/lib/supabase/client';
import MainLayout from '@/components/layouts/MainLayout';
import DealForm from '@/components/forms/DealForm';
import { Customer, SalesRep } from '@/types';

export default function NewDealPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // ユーザー情報の取得
        const user = await getUser();
        if (!user) {
          // 未ログインの場合はログインページにリダイレクト
          router.push('/');
          return;
        }
        
        // 顧客と営業担当者のデータを取得
        const [customersData, salesRepsData] = await Promise.all([
          getCustomers(),
          getSalesReps()
        ]);
        
        setCustomers(customersData);
        setSalesReps(salesRepsData);
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);
  
  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">案件登録</h1>
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-muted-foreground">データ読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">案件登録</h1>
        <div className="rounded-lg border bg-card p-6">
          <DealForm customers={customers} salesReps={salesReps} />
        </div>
      </div>
    </MainLayout>
  );
}
