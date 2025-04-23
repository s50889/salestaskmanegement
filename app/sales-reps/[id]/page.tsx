'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layouts/MainLayout';
import { getUser } from '@/lib/supabase/client';
import { getSalesReps, getSalesRepPerformance, getSalesRepActivities, getSalesRepDeals } from '@/lib/supabase/api';
import { SalesRepPerformance, Activity, Deal } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function SalesRepDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [salesRep, setSalesRep] = useState<SalesRepPerformance | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeTab, setActiveTab] = useState<'activities' | 'deals'>('deals');
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
        
        // 表示対象の営業担当者が自分自身、または管理者/マネージャーの場合のみアクセス許可
        if (currentRep?.id === id || currentRep?.role === 'admin' || currentRep?.role === 'manager') {
          // 営業担当者のパフォーマンスデータを取得
          const performance = await getSalesRepPerformance(id);
          
          if (performance && !Array.isArray(performance)) {
            setSalesRep(performance);
            
            // 営業担当者の活動ログを取得
            const activitiesData = await getSalesRepActivities(id);
            setActivities(activitiesData);
            
            // 営業担当者の案件一覧を取得
            const dealsData = await getSalesRepDeals(id);
            setDeals(dealsData);
          } else {
            setError('営業担当者情報の取得に失敗しました');
          }
        } else {
          setError('この情報にアクセスする権限がありません');
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError('データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, router]);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">営業担当者詳細</h1>
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
          <h1 className="text-3xl font-bold">営業担当者詳細</h1>
          <div className="rounded-lg border bg-destructive/10 p-6 shadow-sm">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!salesRep) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">営業担当者詳細</h1>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">営業担当者情報が見つかりませんでした</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{salesRep.name}の詳細</h1>
          <Link 
            href="/sales-reps" 
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            一覧に戻る
          </Link>
        </div>
        
        {/* 担当者情報カード */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{salesRep.name}</h2>
              <p className="text-muted-foreground">{salesRep.email}</p>
              <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {salesRep.role === 'admin' ? '管理者' : salesRep.role === 'manager' ? 'マネージャー' : '営業担当'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">活動数</p>
              <p className="text-xl font-bold">{salesRep.activities} 件</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* 商談中の情報 */}
            <div className="rounded-md bg-primary/10 p-3 space-y-2">
              <h3 className="text-sm font-medium border-b pb-1 mb-2">商談中</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">件数</p>
                  <p className="text-sm font-medium">{salesRep.inProgressDeals}件</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">金額</p>
                  <p className="text-sm font-medium">{formatCurrency(salesRep.inProgressAmount)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">粗利</p>
                  <p className="text-sm font-medium">{formatCurrency(salesRep.inProgressProfit)}</p>
                </div>
              </div>
            </div>
            
            {/* 受注済みの情報 */}
            <div className="rounded-md bg-green-100 p-3 space-y-2">
              <h3 className="text-sm font-medium border-b pb-1 mb-2">受注済</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">件数</p>
                  <p className="text-sm font-medium">{salesRep.wonDeals}件</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">金額</p>
                  <p className="text-sm font-medium">{formatCurrency(salesRep.wonAmount)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">粗利</p>
                  <p className="text-sm font-medium">{formatCurrency(salesRep.totalProfit)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* タブナビゲーション */}
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('deals')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'deals'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              案件一覧
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'activities'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              活動ログ
            </button>
          </nav>
        </div>
        
        {/* 案件一覧セクション */}
        {activeTab === 'deals' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">案件一覧</h2>
            
            {deals.length === 0 ? (
              <div className="rounded-lg border bg-card p-6 text-center">
                <p className="text-muted-foreground">案件がありません</p>
              </div>
            ) : (
              <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">案件名</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">顧客</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">ステータス</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">金額</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">粗利</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">作成日</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deals.map((deal) => (
                        <tr key={deal.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm font-medium">{deal.name}</td>
                          <td className="px-4 py-3 text-sm">{deal.customer?.name || '不明'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                              deal.status === 'lost' ? 'bg-red-100 text-red-800' :
                              deal.status === 'negotiation' || deal.status === 'quotation' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {deal.status === 'won' ? '受注' :
                               deal.status === 'lost' ? '失注' :
                               deal.status === 'negotiation' ? '商談中' : 
                               deal.status === 'quotation' ? '見積提出' :
                               deal.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{formatCurrency(Number(deal.amount))}</td>
                          <td className="px-4 py-3 text-sm">{formatCurrency(Number(deal.gross_profit))}</td>
                          <td className="px-4 py-3 text-sm">{formatDate(deal.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 活動ログセクション */}
        {activeTab === 'activities' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">活動ログ</h2>
            
            {activities.length === 0 ? (
              <div className="rounded-lg border bg-card p-6 text-center">
                <p className="text-muted-foreground">活動記録がありません</p>
              </div>
            ) : (
              <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">日時</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">タイプ</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">顧客</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">内容</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">案件</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((activity) => (
                        <tr key={activity.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm">{formatDate(activity.created_at)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                              activity.activity_type === 'phone' ? 'bg-amber-100 text-amber-800' :
                              activity.activity_type === 'visit' ? 'bg-blue-100 text-blue-800' :
                              activity.activity_type === 'email' ? 'bg-green-100 text-green-800' :
                              activity.activity_type === 'web_meeting' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.activity_type === 'phone' ? '電話' :
                               activity.activity_type === 'visit' ? '訪問' :
                               activity.activity_type === 'email' ? 'メール' : 
                               activity.activity_type === 'web_meeting' ? 'Web会議' :
                               activity.activity_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{activity.customer?.name || '不明'}</td>
                          <td className="px-4 py-3 text-sm max-w-xs truncate">{activity.description}</td>
                          <td className="px-4 py-3 text-sm">{activity.deal?.name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
