'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getDealById, getCustomers, getSalesReps } from '@/lib/supabase/api';
import MainLayout from '@/components/layouts/MainLayout';
import DealForm from '@/components/forms/DealForm';
import { Deal, Customer, SalesRep } from '@/types';

export default function EditDealPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = params.id as string;
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // 案件データ、顧客、営業担当者のデータを取得
        const [dealData, customersData, salesRepsData] = await Promise.all([
          getDealById(dealId),
          getCustomers(),
          getSalesReps()
        ]);
        
        // 案件が見つからない場合はエラー
        if (!dealData) {
          setError('案件が見つかりません');
          setLoading(false);
          return;
        }
        
        setDeal(dealData);
        setCustomers(customersData);
        setSalesReps(salesRepsData);
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError('データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    if (dealId) {
      fetchData();
    }
  }, [dealId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">案件編集</h1>
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-muted-foreground">データ読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">案件編集</h1>
          <div className="rounded-lg border bg-destructive/10 p-6 text-center">
            <p className="text-destructive">{error}</p>
            <div className="mt-4">
              <Link
                href="/deals"
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                案件一覧に戻る
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!deal) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">案件編集</h1>
          <div className="rounded-lg border bg-destructive/10 p-6 text-center">
            <p className="text-destructive">案件が見つかりません</p>
            <div className="mt-4">
              <Link
                href="/deals"
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                案件一覧に戻る
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">案件編集: {deal.name}</h1>
        <div className="rounded-lg border bg-card p-6">
          <DealForm deal={deal} customers={customers} salesReps={salesReps} />
        </div>
      </div>
    </MainLayout>
  );
}
