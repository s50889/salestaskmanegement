'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getActivityById, getCustomers, getDeals, getSalesReps } from '@/lib/supabase/api';
import { getUser } from '@/lib/supabase/client';
import MainLayout from '@/components/layouts/MainLayout';
import ActivityForm from '@/components/forms/ActivityForm';
import { Activity, Customer, Deal, SalesRep } from '@/types';
import Link from 'next/link';

export default function EditActivityPage() {
  const router = useRouter();
  const params = useParams();
  const activityId = params.id as string;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // 活動ログデータ、顧客、案件、営業担当者のデータを取得
        const [activityData, customersData, dealsData, salesRepsData] = await Promise.all([
          getActivityById(activityId),
          getCustomers(),
          getDeals(),
          getSalesReps()
        ]);
        
        // 活動ログが見つからない場合はエラー
        if (!activityData) {
          setError('活動ログが見つかりません');
          setLoading(false);
          return;
        }
        
        setActivity(activityData);
        setCustomers(customersData);
        setDeals(dealsData);
        setSalesReps(salesRepsData);
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError('データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    if (activityId) {
      fetchData();
    }
  }, [activityId, router]);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">活動編集</h1>
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-muted-foreground">データ読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !activity) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">活動編集</h1>
          <div className="rounded-lg border bg-destructive/10 p-6 text-center">
            <p className="text-destructive">{error || '活動ログが見つかりません'}</p>
            <Link href="/activities" className="mt-4 inline-block text-primary hover:underline">
              活動ログ一覧に戻る
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">活動編集</h1>
          <Link
            href={`/activities/${activity.id}`}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            詳細に戻る
          </Link>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <ActivityForm
            activity={activity}
            customers={customers}
            deals={deals}
            salesReps={salesReps}
          />
        </div>
      </div>
    </MainLayout>
  );
}
