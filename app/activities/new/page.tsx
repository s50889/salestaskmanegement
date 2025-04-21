'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCustomers, getDeals, getSalesReps } from '@/lib/supabase/api';
import { getUser } from '@/lib/supabase/client';
import MainLayout from '@/components/layouts/MainLayout';
import ActivityForm from '@/components/forms/ActivityForm';
import { Customer, Deal, SalesRep } from '@/types';
import Link from 'next/link';

export default function NewActivityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState<{
    customer_id?: string;
    deal_id?: string;
    activity_type?: string;
  }>({});

  useEffect(() => {
    // URLパラメータから初期値を取得
    const customerId = searchParams.get('customer_id');
    const dealId = searchParams.get('deal_id');
    const activityType = searchParams.get('activity_type');

    if (customerId || dealId || activityType) {
      const values: {
        customer_id?: string;
        deal_id?: string;
        activity_type?: string;
      } = {};
      
      if (customerId) values.customer_id = customerId;
      if (dealId) values.deal_id = dealId;
      if (activityType) values.activity_type = activityType;
      
      setInitialValues(values);
    }
  }, [searchParams]);

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
        
        // 顧客、案件、営業担当者のデータを取得
        const [customersData, dealsData, salesRepsData] = await Promise.all([
          getCustomers(),
          getDeals(),
          getSalesReps()
        ]);
        
        setCustomers(customersData);
        setDeals(dealsData);
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
          <h1 className="text-3xl font-bold">活動記録</h1>
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">活動記録</h1>
          <Link
            href="/activities"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            一覧に戻る
          </Link>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <ActivityForm
            customers={customers}
            deals={deals}
            salesReps={salesReps}
            initialValues={initialValues}
          />
        </div>
      </div>
    </MainLayout>
  );
}
