'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import DealAmountChart from '@/components/dashboard/DealAmountChart';
import { getDashboardStats, getActivityTypeCounts, getRecentActivities } from '@/lib/supabase/api';
import { getUser } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [activityCounts, setActivityCounts] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
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
        
        // ダッシュボードデータの取得
        const [dashboardStats, activityTypeData, recentActivitiesData] = await Promise.all([
          getDashboardStats(),
          getActivityTypeCounts(),
          getRecentActivities(3)
        ]);
        
        setStats(dashboardStats);
        setActivityCounts(activityTypeData);
        setRecentActivities(recentActivitiesData);
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  // ステータスごとの案件数を取得
  const getStatusCount = (status: string) => {
    if (!stats || !stats.dealStatusCounts) return 0;
    
    // ステータスのマッピング
    const statusMapping: Record<string, string[]> = {
      'in_progress': ['negotiation', 'proposal', 'quotation', 'final_negotiation'],
      'won': ['won'],
      'lost': ['lost'],
      'on_hold': [] // 現在は使用していないが、将来的に追加する可能性がある
    };
    
    // 指定されたステータスグループに含まれるステータスの合計を計算
    if (statusMapping[status]) {
      return statusMapping[status].reduce((total, currentStatus) => {
        const statusItem = stats.dealStatusCounts.find((item: any) => item.status === currentStatus);
        return total + (statusItem ? statusItem.count : 0);
      }, 0);
    }
    
    // マッピングがない場合は直接検索
    const statusItem = stats.dealStatusCounts.find((item: any) => item.status === status);
    return statusItem ? statusItem.count : 0;
  };

  // 活動タイプごとの件数を取得
  const getActivityTypeCount = (type: string) => {
    if (!activityCounts) return 0;
    const activityItem = activityCounts.find((item: any) => item.type === type);
    return activityItem ? activityItem.count : 0;
  };

  // 活動タイプに応じたアイコンのスタイルを取得
  const getActivityTypeStyle = (type: string) => {
    const styles: Record<string, { bg: string, color: string }> = {
      'visit': { bg: 'bg-blue-100', color: 'bg-blue-500' },
      'phone': { bg: 'bg-amber-100', color: 'bg-amber-500' },
      'email': { bg: 'bg-green-100', color: 'bg-green-500' },
      'web_meeting': { bg: 'bg-purple-100', color: 'bg-purple-500' },
      'other': { bg: 'bg-gray-100', color: 'bg-gray-500' }
    };
    return styles[type] || styles.other;
  };

  // 活動タイプの日本語表示を取得
  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'visit': '訪問',
      'phone': '電話',
      'email': 'メール',
      'web_meeting': 'Web会議',
      'other': 'その他'
    };
    return labels[type] || type;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* 案件サマリーカード */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-medium">案件サマリー</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 rounded-md bg-primary/10 p-2">
                <p className="text-sm text-muted-foreground">進行中</p>
                <p className="text-2xl font-bold">{loading ? '...' : getStatusCount('in_progress')}</p>
              </div>
              <div className="space-y-1 rounded-md bg-green-100 p-2">
                <p className="text-sm text-muted-foreground">受注</p>
                <p className="text-2xl font-bold">{loading ? '...' : getStatusCount('won')}</p>
              </div>
              <div className="space-y-1 rounded-md bg-red-100 p-2">
                <p className="text-sm text-muted-foreground">失注</p>
                <p className="text-2xl font-bold">{loading ? '...' : getStatusCount('lost')}</p>
              </div>
              <div className="space-y-1 rounded-md bg-amber-100 p-2">
                <p className="text-sm text-muted-foreground">保留中</p>
                <p className="text-2xl font-bold">{loading ? '...' : getStatusCount('on_hold')}</p>
              </div>
            </div>
          </div>
          
          {/* 顧客サマリーカード */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-medium">顧客サマリー</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <p className="text-sm">総顧客数</p>
                <p className="font-medium">{loading ? '...' : stats?.customerCount || 0} 社</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm">商談中顧客</p>
                <p className="font-medium">{loading ? '...' : stats?.activeCustomerCount || 0} 社</p>
              </div>
            </div>
          </div>
          
          {/* 活動サマリーカード */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-medium">活動サマリー</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 rounded-md bg-blue-100 p-2">
                  <p className="text-sm text-muted-foreground">訪問</p>
                  <p className="text-2xl font-bold">{loading ? '...' : getActivityTypeCount('visit')}</p>
                </div>
                <div className="space-y-1 rounded-md bg-amber-100 p-2">
                  <p className="text-sm text-muted-foreground">電話</p>
                  <p className="text-2xl font-bold">{loading ? '...' : getActivityTypeCount('phone')}</p>
                </div>
                <div className="space-y-1 rounded-md bg-green-100 p-2">
                  <p className="text-sm text-muted-foreground">メール</p>
                  <p className="text-2xl font-bold">{loading ? '...' : getActivityTypeCount('email')}</p>
                </div>
                <div className="space-y-1 rounded-md bg-purple-100 p-2">
                  <p className="text-sm text-muted-foreground">Web会議</p>
                  <p className="text-2xl font-bold">{loading ? '...' : getActivityTypeCount('web_meeting')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 案件金額グラフ */}
        <DealAmountChart />
        
        {/* 最近の活動 */}
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-medium">最近の活動</h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">データを読み込み中...</p>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity: any, index) => {
                const style = getActivityTypeStyle(activity.activity_type);
                return (
                  <div key={activity.id} className={`flex items-start gap-3 ${index < recentActivities.length - 1 ? 'border-b pb-3' : ''}`}>
                    <div className={`rounded-full ${style.bg} p-2`}>
                      <span className={`block h-2 w-2 rounded-full ${style.color}`}></span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {activity.customers?.name || '不明な顧客'}{' '}
                        {getActivityTypeLabel(activity.activity_type)}
                      </p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(activity.date)} - {activity.sales_reps?.name || '不明な担当者'}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">最近の活動はありません</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
