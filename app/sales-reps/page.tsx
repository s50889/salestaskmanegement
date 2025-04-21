'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layouts/MainLayout';
import { getUser } from '@/lib/supabase/client';
import { getSalesReps, getSalesRepPerformance } from '@/lib/supabase/api';
import { SalesRep, SalesRepPerformance } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function SalesRepsPage() {
  const router = useRouter();
  const [salesReps, setSalesReps] = useState<SalesRepPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
        
        // 営業担当者の一覧を取得
        const reps = await getSalesReps();
        
        // 現在のユーザーが管理者かどうかを確認
        const currentRep = reps.find(rep => rep.user_id === user.id);
        setIsAdmin(currentRep?.role === 'admin' || currentRep?.role === 'manager');
        
        if (currentRep?.role === 'admin' || currentRep?.role === 'manager') {
          // 管理者またはマネージャーの場合、全営業担当者のパフォーマンスを取得
          const performanceData = await getSalesRepPerformance();
          if (performanceData && Array.isArray(performanceData)) {
            setSalesReps(performanceData as SalesRepPerformance[]);
          } else {
            setSalesReps([]);
          }
        } else {
          // 一般営業担当者の場合、自分のデータのみ取得
          const myPerformance = await getSalesRepPerformance(currentRep?.id);
          if (myPerformance && !Array.isArray(myPerformance)) {
            setSalesReps([myPerformance as SalesRepPerformance]);
          } else {
            setSalesReps([]);
          }
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError('データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  // 営業担当者の詳細ページへのリンク
  const handleViewDetails = (salesRepId: string) => {
    router.push(`/sales-reps/${salesRepId}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">営業案件一覧表</h1>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">データを読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">営業案件一覧表</h1>
          <div className="rounded-lg border bg-destructive/10 p-6 shadow-sm">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">営業案件一覧表</h1>
          {isAdmin && (
            <div className="flex gap-2">
              <Link 
                href="/sales-reps/compare" 
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                グラフ比較
              </Link>
            </div>
          )}
        </div>
        
        {salesReps.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">表示するデータがありません</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {salesReps.map(rep => (
              <div 
                key={rep.salesRepId} 
                className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewDetails(rep.salesRepId)}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{rep.name}</h2>
                    <p className="text-sm text-muted-foreground">{rep.email}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {rep.role === 'admin' ? '管理者' : rep.role === 'manager' ? 'マネージャー' : '営業担当'}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-muted/30 p-2">
                      <p className="text-xs text-muted-foreground">案件数</p>
                      <p className="text-lg font-bold">{rep.totalDeals}</p>
                    </div>
                    <div className="rounded-md bg-green-100 p-2">
                      <p className="text-xs text-muted-foreground">受注</p>
                      <p className="text-lg font-bold">{rep.wonDeals}</p>
                    </div>
                    <div className="rounded-md bg-red-100 p-2">
                      <p className="text-xs text-muted-foreground">失注</p>
                      <p className="text-lg font-bold">{rep.lostDeals}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* 商談中の情報 */}
                    <div className="rounded-md bg-primary/10 p-3 space-y-2">
                      <h3 className="text-sm font-medium border-b pb-1 mb-2">商談中</h3>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">件数</p>
                          <p className="text-sm font-medium">{rep.inProgressDeals}件</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">金額</p>
                          <p className="text-sm font-medium">{formatCurrency(rep.inProgressAmount)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">粗利</p>
                          <p className="text-sm font-medium">{formatCurrency(rep.inProgressProfit)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* 受注済みの情報 */}
                    <div className="rounded-md bg-green-100 p-3 space-y-2">
                      <h3 className="text-sm font-medium border-b pb-1 mb-2">受注済</h3>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">件数</p>
                          <p className="text-sm font-medium">{rep.wonDeals}件</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">金額</p>
                          <p className="text-sm font-medium">{formatCurrency(rep.wonAmount)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">粗利</p>
                          <p className="text-sm font-medium">{formatCurrency(rep.totalProfit)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t pt-2">
                    <p className="text-sm">活動数</p>
                    <p className="font-medium">{rep.activities} 件</p>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(rep.salesRepId);
                      }}
                      className="text-sm text-primary hover:underline flex items-center"
                    >
                      <span>活動ログを見る</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
