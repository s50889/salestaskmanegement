'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getDealById, getCustomerById, getSalesRepById, getActivities } from '@/lib/supabase/api';
import MainLayout from '@/components/layouts/MainLayout';
import { Deal, Customer, SalesRep, Activity } from '@/types';

export default function DealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = params.id as string;
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [dealActivities, setDealActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ステータスの日本語表記
  const statusText: Record<string, string> = {
    negotiation: '商談中',
    proposal: '提案中',
    quotation: '見積提出',
    final_negotiation: '最終交渉',
    won: '受注',
    lost: '失注'
  };
  
  // ステータスに応じたバッジのスタイル
  const statusBadgeStyle: Record<string, string> = {
    negotiation: 'bg-amber-100 text-amber-800',
    proposal: 'bg-indigo-100 text-indigo-800',
    quotation: 'bg-blue-100 text-blue-800',
    final_negotiation: 'bg-purple-100 text-purple-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // 案件データを取得
        const dealData = await getDealById(dealId);
        
        // 案件が見つからない場合はエラー
        if (!dealData) {
          setError('案件が見つかりません');
          setLoading(false);
          return;
        }
        
        setDeal(dealData);
        
        // 顧客、担当者、活動ログのデータを取得
        const [customerData, salesRepData, allActivities] = await Promise.all([
          getCustomerById(dealData.customer_id),
          getSalesRepById(dealData.sales_rep_id),
          getActivities()
        ]);
        
        setCustomer(customerData);
        setSalesRep(salesRepData);
        
        // この案件に関連する活動をフィルタリング
        const filteredActivities = allActivities.filter(activity => activity.deal_id === dealData.id);
        setDealActivities(filteredActivities);
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
          <h1 className="text-3xl font-bold">案件詳細</h1>
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
          <h1 className="text-3xl font-bold">案件詳細</h1>
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
          <h1 className="text-3xl font-bold">案件詳細</h1>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{deal.name}</h1>
            <div className="mt-2">
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeStyle[deal.status] || ''}`}>
                {statusText[deal.status] || deal.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/deals/${deal.id}/edit`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              編集
            </Link>
            <Link
              href="/deals"
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              一覧に戻る
            </Link>
          </div>
        </div>
        
        {/* 案件情報 */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-medium">基本情報</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">顧客</div>
                <div className="col-span-2">
                  {customer ? (
                    <Link href={`/customers/${customer.id}`} className="text-primary hover:underline">
                      {customer.name}
                    </Link>
                  ) : '-'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">金額</div>
                <div className="col-span-2">{deal.amount.toLocaleString('ja-JP')} 円</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">粗利</div>
                <div className="col-span-2">{deal.gross_profit ? `${deal.gross_profit.toLocaleString('ja-JP')} 円` : '-'}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">担当者</div>
                <div className="col-span-2">{salesRep?.name || '-'}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">予定成約日</div>
                <div className="col-span-2">
                  {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString('ja-JP') : '-'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">登録日</div>
                <div className="col-span-2">{new Date(deal.created_at).toLocaleDateString('ja-JP')}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">最終更新日</div>
                <div className="col-span-2">{new Date(deal.updated_at).toLocaleDateString('ja-JP')}</div>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-medium">詳細</h2>
            <div className="rounded-md bg-muted/50 p-4">
              {deal.description ? (
                <p className="whitespace-pre-wrap">{deal.description}</p>
              ) : (
                <p className="text-muted-foreground">詳細情報がありません</p>
              )}
            </div>
          </div>
        </div>
        
        {/* 活動ログ */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-medium">活動ログ</h2>
            <Link
              href={`/activities/new?deal_id=${deal.id}&customer_id=${deal.customer_id}`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              活動を記録
            </Link>
          </div>
          
          {dealActivities.length > 0 ? (
            <div className="space-y-4">
              {dealActivities.map(activity => {
                // 活動種別の日本語表記
                const activityTypeText: Record<string, string> = {
                  call: '電話',
                  meeting: '会議',
                  email: 'メール',
                  other: 'その他'
                };
                
                // 活動種別に応じたバッジのスタイル
                const activityBadgeStyle: Record<string, string> = {
                  call: 'bg-amber-100 text-amber-800',
                  meeting: 'bg-blue-100 text-blue-800',
                  email: 'bg-green-100 text-green-800',
                  other: 'bg-gray-100 text-gray-800'
                };
                
                return (
                  <div key={activity.id} className="rounded-md border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${activityBadgeStyle[activity.type] || ''}`}>
                          {activityTypeText[activity.type] || activity.type}
                        </span>
                        <span className="font-medium">
                          {new Date(activity.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <Link
                        href={`/activities/${activity.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        詳細
                      </Link>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{activity.description}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md bg-muted p-4 text-center text-sm text-muted-foreground">
              この案件に関連する活動はまだありません
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
