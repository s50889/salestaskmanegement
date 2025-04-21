'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getActivityById, getCustomerById, getDealById, getSalesRepById, getActivitiesByCustomerId, getActivitiesByDealId } from '@/lib/supabase/api';
import { getUser } from '@/lib/supabase/client';
import MainLayout from '@/components/layouts/MainLayout';
import { Activity, Customer, Deal, SalesRep } from '@/types';

export default function ActivityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const activityId = params.id as string;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [relatedActivities, setRelatedActivities] = useState<Activity[]>([]);
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

        // 活動ログデータを取得
        const activityData = await getActivityById(activityId);
        
        // 活動ログが見つからない場合はエラー
        if (!activityData) {
          setError('活動ログが見つかりません');
          setLoading(false);
          return;
        }
        
        setActivity(activityData);
        
        // 顧客、担当者のデータを取得
        const [customerData, salesRepData] = await Promise.all([
          getCustomerById(activityData.customer_id),
          getSalesRepById(activityData.sales_rep_id)
        ]);
        
        setCustomer(customerData);
        setSalesRep(salesRepData);
        
        // 案件IDがある場合のみ案件データを取得
        let dealData = null;
        if (activityData.deal_id) {
          dealData = await getDealById(activityData.deal_id);
          setDeal(dealData);
        }

        // 関連する活動を取得
        let relatedActivitiesData: Activity[] = [];
        
        // 案件に関連する活動を取得
        if (activityData.deal_id) {
          relatedActivitiesData = await getActivitiesByDealId(activityData.deal_id);
        } 
        // 案件がない場合は顧客に関連する活動を取得
        else {
          relatedActivitiesData = await getActivitiesByCustomerId(activityData.customer_id);
        }
        
        // 現在の活動を除外
        relatedActivitiesData = relatedActivitiesData.filter(a => a.id !== activityData.id);
        
        setRelatedActivities(relatedActivitiesData);
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
          <h1 className="text-3xl font-bold">活動詳細</h1>
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
          <h1 className="text-3xl font-bold">活動詳細</h1>
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

  // 活動種別の日本語表記
  const activityTypeText = {
    visit: '訪問',
    phone: '電話',
    email: 'メール',
    web_meeting: 'Web会議',
    other: 'その他'
  }[activity.activity_type];
  
  // 活動種別に応じたバッジのスタイル
  const activityBadgeStyle = {
    visit: 'bg-blue-100 text-blue-800',
    phone: 'bg-amber-100 text-amber-800',
    email: 'bg-green-100 text-green-800',
    web_meeting: 'bg-purple-100 text-purple-800',
    other: 'bg-gray-100 text-gray-800'
  }[activity.activity_type];

  // 活動種別のマッピング関数
  const getActivityTypeInfo = (type: string) => {
    const mapping = {
      visit: { text: '訪問', style: 'bg-blue-100 text-blue-800' },
      phone: { text: '電話', style: 'bg-amber-100 text-amber-800' },
      email: { text: 'メール', style: 'bg-green-100 text-green-800' },
      web_meeting: { text: 'Web会議', style: 'bg-purple-100 text-purple-800' },
      other: { text: 'その他', style: 'bg-gray-100 text-gray-800' }
    };
    return mapping[type as keyof typeof mapping] || { text: type, style: 'bg-gray-100 text-gray-800' };
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">活動詳細</h1>
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${activityBadgeStyle}`}>
              {activityTypeText}
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/activities/${activity.id}/edit`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              編集
            </Link>
            <Link
              href="/activities"
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              一覧に戻る
            </Link>
          </div>
        </div>
        
        {/* 活動ログ情報 */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-medium">基本情報</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">日付</div>
                <div className="col-span-2">{new Date(activity.date).toLocaleDateString('ja-JP')}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">活動種別</div>
                <div className="col-span-2">{activityTypeText}</div>
              </div>
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
                <div className="text-sm font-medium text-muted-foreground">案件</div>
                <div className="col-span-2">
                  {deal ? (
                    <Link href={`/deals/${deal.id}`} className="text-primary hover:underline">
                      {deal.name}
                    </Link>
                  ) : '-'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">担当者</div>
                <div className="col-span-2">{salesRep?.name || '-'}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">記録日時</div>
                <div className="col-span-2">
                  {new Date(activity.created_at).toLocaleString('ja-JP')}
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-medium">活動内容</h2>
            <div className="rounded-md bg-muted/50 p-4">
              <p className="whitespace-pre-wrap">{activity.description}</p>
            </div>
          </div>
        </div>
        
        {/* 関連情報 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* 同一案件の新規活動記録 */}
          {deal && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-xl font-medium">同一案件の活動記録</h2>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  「{deal.name}」案件に対する新しい活動を記録します。活動種別を選択してください。
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/activities/new?customer_id=${activity.customer_id}&deal_id=${deal.id}&activity_type=visit`}
                    className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-center text-sm font-medium text-blue-800 hover:bg-blue-100"
                  >
                    訪問
                  </Link>
                  <Link
                    href={`/activities/new?customer_id=${activity.customer_id}&deal_id=${deal.id}&activity_type=phone`}
                    className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm font-medium text-amber-800 hover:bg-amber-100"
                  >
                    電話
                  </Link>
                  <Link
                    href={`/activities/new?customer_id=${activity.customer_id}&deal_id=${deal.id}&activity_type=email`}
                    className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-center text-sm font-medium text-green-800 hover:bg-green-100"
                  >
                    メール
                  </Link>
                  <Link
                    href={`/activities/new?customer_id=${activity.customer_id}&deal_id=${deal.id}&activity_type=web_meeting`}
                    className="rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-center text-sm font-medium text-purple-800 hover:bg-purple-100"
                  >
                    Web会議
                  </Link>
                </div>
                <Link
                  href={`/activities/new?customer_id=${activity.customer_id}&deal_id=${deal.id}&activity_type=other`}
                  className="block rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm font-medium text-gray-800 hover:bg-gray-100"
                >
                  その他
                </Link>
              </div>
            </div>
          )}

          {/* 関連する活動の時系列表示 */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-medium">
              {deal ? '同じ案件の活動履歴' : '同じ顧客の活動履歴'}
            </h2>
            {relatedActivities.length > 0 ? (
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-4 top-0 h-full w-0.5 bg-muted"></div>
                  <ul className="space-y-4">
                    {relatedActivities.map((relatedActivity) => {
                      const typeInfo = getActivityTypeInfo(relatedActivity.activity_type);
                      return (
                        <li key={relatedActivity.id} className="relative pl-10">
                          <div className="absolute left-0 top-1.5 h-7 w-7 rounded-full border bg-background flex items-center justify-center">
                            <div className={`h-3 w-3 rounded-full ${typeInfo.style.split(' ')[0]}`}></div>
                          </div>
                          <div className="rounded-md border p-3">
                            <div className="mb-1 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.style}`}>
                                  {typeInfo.text}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(relatedActivity.date).toLocaleDateString('ja-JP')}
                                </span>
                              </div>
                              <Link
                                href={`/activities/${relatedActivity.id}`}
                                className="text-xs text-primary hover:underline"
                              >
                                詳細
                              </Link>
                            </div>
                            <p className="text-sm line-clamp-2">
                              {relatedActivity.description}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                {relatedActivities.length > 5 && (
                  <div className="text-center">
                    <Link
                      href={deal ? `/activities?deal_id=${deal.id}` : `/activities?customer_id=${customer?.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      すべての活動を表示
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">関連する活動はありません</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
