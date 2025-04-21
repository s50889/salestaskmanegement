'use client';

import { useEffect, useState } from 'react';
import { getSalesReps, updateSalesRepByUserId } from '@/lib/supabase/api';
import MainLayout from '@/components/layouts/MainLayout';
import CustomerForm from '@/components/forms/CustomerForm';
import { getUser, supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { SalesRep } from '@/types';

export default function NewCustomerPage() {
  const router = useRouter();
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [defaultSalesRepId, setDefaultSalesRepId] = useState<string | undefined>(undefined);
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
        
        // 営業担当者のデータを取得
        const salesRepsData = await getSalesReps();
        
        // 自分自身の営業担当者情報を探す
        const currentSalesRep = salesRepsData.find(rep => rep.user_id === user.id);
        
        // ユーザーメタデータから名前を取得
        const { data: userData } = await supabase.auth.getUser();
        const userName = userData?.user?.user_metadata?.name || 
                         userData?.user?.user_metadata?.full_name || 
                         user.email?.split('@')[0] || 
                         '担当者';
        
        // 営業担当者データの名前が異なる場合は更新
        if (currentSalesRep && currentSalesRep.name !== userName && userName !== '担当者') {
          console.log('営業担当者名を更新します:', userName);
          const updatedSalesRep = await updateSalesRepByUserId(user.id, { name: userName });
          if (updatedSalesRep) {
            // 更新成功した場合、データを更新
            const updatedSalesRepsData = salesRepsData.map(rep => 
              rep.id === updatedSalesRep.id ? updatedSalesRep : rep
            );
            setSalesReps(updatedSalesRepsData);
            setDefaultSalesRepId(updatedSalesRep.id);
          } else {
            // 更新失敗した場合は元のデータを使用
            setSalesReps(salesRepsData);
            setDefaultSalesRepId(currentSalesRep?.id);
          }
        } else {
          // 更新不要な場合は元のデータを使用
          setSalesReps(salesRepsData);
          setDefaultSalesRepId(currentSalesRep?.id);
        }
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
          <h1 className="text-3xl font-bold">顧客登録</h1>
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
        <h1 className="text-3xl font-bold">顧客登録</h1>
        <div className="rounded-lg border bg-card p-6">
          <CustomerForm 
            salesReps={salesReps} 
            defaultSalesRepId={defaultSalesRepId}
          />
        </div>
      </div>
    </MainLayout>
  );
}
