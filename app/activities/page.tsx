'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import { getActivities, getSalesReps } from '@/lib/supabase/api';
import { getUser } from '@/lib/supabase/client';
import { Activity, SalesRep } from '@/types';
import { formatDate } from '@/lib/utils';

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserID, setCurrentUserID] = useState<string | null>(null);
  const [viewAllActivities, setViewAllActivities] = useState(false);
  const [salesRepFilter, setSalesRepFilter] = useState('');

  // 活動種別の日本語表示マッピング
  const activityTypeMapping: Record<string, { text: string, bgColor: string, textColor: string }> = {
    visit: { text: '訪問', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    phone: { text: '電話', bgColor: 'bg-amber-100', textColor: 'text-amber-800' },
    email: { text: 'メール', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    web_meeting: { text: 'Web会議', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    other: { text: 'その他', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  };

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
        
        // 現在のユーザーIDを保存
        setCurrentUserID(user.id);
        
        // 営業担当者データを取得
        const salesRepsData = await getSalesReps();
        setSalesReps(salesRepsData);
        
        // 現在のユーザーが管理者かどうかを確認
        const currentUserSalesRep = salesRepsData.find(rep => rep.user_id === user.id);
        const userIsAdmin = currentUserSalesRep?.role === 'admin' || currentUserSalesRep?.role === 'manager';
        setIsAdmin(userIsAdmin);
        
        // 活動ログを取得（管理者が全ユーザー表示モードの場合はすべての活動を取得）
        const activitiesData = await getActivities(userIsAdmin && viewAllActivities);
        
        setActivities(activitiesData);
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router, viewAllActivities]);

  // 管理者が全ユーザー表示モードを切り替える関数
  const toggleViewAllActivities = async () => {
    setLoading(true);
    setViewAllActivities(!viewAllActivities);
  };

  // フィルタリングされた活動リストを取得
  const filteredActivities = activities.filter(activity => {
    const customerName = activity.customers?.name || '不明';
    const dealName = activity.deals?.name || '-';
    const salesRepName = activity.sales_reps?.name || '不明';
    
    const matchesSearch = 
      searchTerm === '' || 
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dealName !== '-' && dealName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salesRepName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActivityType = activityTypeFilter === '' || activity.activity_type === activityTypeFilter;
    const matchesSalesRep = salesRepFilter === '' || activity.sales_rep_id === salesRepFilter;
    
    return matchesSearch && matchesActivityType && matchesSalesRep;
  });

  // 活動記録ページへ移動
  const handleAddActivity = () => {
    router.push('/activities/new');
  };

  // 活動詳細ページへ移動
  const handleViewDetails = (id: string) => {
    router.push(`/activities/${id}`);
  };

  // 活動編集ページへ移動
  const handleEditActivity = (id: string) => {
    router.push(`/activities/${id}/edit`);
  };

  // 案件詳細ページへ移動する関数
  const navigateToDeal = (dealId?: string | null) => {
    if (dealId) {
      router.push(`/deals/${dealId}`);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">活動ログ</h1>
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
          <div>
            <h1 className="text-3xl font-bold">活動ログ</h1>
            {isAdmin && viewAllActivities && (
              <p className="text-sm text-muted-foreground mt-1">管理者権限ですべてのユーザーの活動を閲覧しています</p>
            )}
          </div>
          <button 
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            onClick={handleAddActivity}
          >
            活動を記録
          </button>
        </div>
        
        {/* 管理者向け表示切替 */}
        {isAdmin && (
          <div className="mb-4 flex items-center justify-end">
            <button
              onClick={toggleViewAllActivities}
              className="text-sm rounded-md bg-secondary px-3 py-1 text-secondary-foreground hover:bg-secondary/90"
            >
              {viewAllActivities ? '自分の活動のみ表示' : '全ユーザーの活動を表示'}
            </button>
          </div>
        )}
        
        {/* 検索フィルター */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <input
              type="text"
              placeholder="顧客名、案件名、活動内容、担当者名で検索..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              value={activityTypeFilter}
              onChange={(e) => setActivityTypeFilter(e.target.value)}
            >
              <option value="">活動種別: すべて</option>
              {Object.entries(activityTypeMapping).map(([type, { text }]) => (
                <option key={type} value={type}>
                  {text}
                </option>
              ))}
            </select>
            {isAdmin && viewAllActivities && (
              <select 
                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                value={salesRepFilter}
                onChange={(e) => setSalesRepFilter(e.target.value)}
              >
                <option value="">担当者: すべて</option>
                {salesReps.map(rep => (
                  <option key={rep.id} value={rep.id}>{rep.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        {/* 活動ログ一覧 */}
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">日付</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">顧客名</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">案件</th>
                  {isAdmin && viewAllActivities && (
                    <th className="px-4 py-3 text-left text-sm font-medium">担当者</th>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-medium">活動内容</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">活動種別</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity) => (
                    <tr key={activity.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">{formatDate(activity.date || activity.created_at)}</td>
                      <td className="px-4 py-3 text-sm font-medium">{activity.customers?.name || '不明'}</td>
                      <td className="px-4 py-3 text-sm">
                        {activity.deal_id ? (
                          <button
                            className="hover:underline focus:outline-none"
                            onClick={() => navigateToDeal(activity.deal_id)}
                          >
                            {activity.deals?.name || '不明'}
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>
                      {isAdmin && viewAllActivities && (
                        <td className="px-4 py-3 text-sm">
                          {activity.sales_reps?.name || '不明'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm max-w-xs truncate">{activity.description}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                          activityTypeMapping[activity.activity_type]?.bgColor || 'bg-gray-100'
                        } ${
                          activityTypeMapping[activity.activity_type]?.textColor || 'text-gray-800'
                        }`}>
                          {activity.activity_type_ja || activityTypeMapping[activity.activity_type]?.text || activity.activity_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <button
                          className="text-blue-600 hover:underline focus:outline-none"
                          onClick={() => handleViewDetails(activity.id)}
                        >
                          詳細
                        </button>
                        <button
                          className="text-amber-600 hover:underline focus:outline-none"
                          onClick={() => handleEditActivity(activity.id)}
                        >
                          編集
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin && viewAllActivities ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">
                      条件に一致する活動記録はありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
