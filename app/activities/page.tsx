'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import { getActivities, getCustomers, getDeals, getSalesReps } from '@/lib/supabase/api';
import { getUser } from '@/lib/supabase/client';
import { Activity, Customer, Deal, SalesRep } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('');
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
        
        // 活動ログ、顧客、案件、営業担当者のデータを取得
        const [activitiesData, customersData, dealsData, salesRepsData] = await Promise.all([
          getActivities(),
          getCustomers(),
          getDeals(),
          getSalesReps()
        ]);
        
        setActivities(activitiesData);
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

  // 顧客名を取得する関数
  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : '不明';
  };

  // 案件名を取得する関数
  const getDealName = (dealId: string | null) => {
    if (!dealId) return '-';
    const deal = deals.find(d => d.id === dealId);
    return deal ? deal.name : '不明';
  };

  // 案件情報を取得する関数
  const getDeal = (dealId: string | null) => {
    if (!dealId) return null;
    return deals.find(d => d.id === dealId) || null;
  };

  // 営業担当者名を取得する関数
  const getSalesRepName = (salesRepId: string) => {
    const salesRep = salesReps.find(rep => rep.id === salesRepId);
    return salesRep ? salesRep.name : '不明';
  };

  // フィルタリングされた活動リストを取得
  const filteredActivities = activities.filter(activity => {
    const customerName = getCustomerName(activity.customer_id);
    const dealName = getDealName(activity.deal_id);
    const matchesSearch = 
      searchTerm === '' || 
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dealName !== '-' && dealName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    
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
          <h1 className="text-3xl font-bold">活動ログ</h1>
          <button 
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            onClick={handleAddActivity}
          >
            活動を記録
          </button>
        </div>
        
        {/* 検索フィルター */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <input
              type="text"
              placeholder="顧客名、案件名、活動内容で検索..."
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
              <option value="visit">訪問</option>
              <option value="phone">電話</option>
              <option value="email">メール</option>
              <option value="web_meeting">Web会議</option>
              <option value="other">その他</option>
            </select>
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
          </div>
        </div>
        
        {/* 活動ログ一覧 */}
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">日付</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">顧客名</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">案件名</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">金額</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">粗利</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">活動種別</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">活動内容</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">担当者</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length > 0 ? (
                  filteredActivities.map(activity => {
                    const deal = getDeal(activity.deal_id);
                    return (
                      <tr key={activity.id} className="border-b">
                        <td className="px-4 py-3 text-sm">{formatDate(activity.date)}</td>
                        <td className="px-4 py-3 text-sm">{getCustomerName(activity.customer_id)}</td>
                        <td className="px-4 py-3 text-sm">{getDealName(activity.deal_id)}</td>
                        <td className="px-4 py-3 text-sm">
                          {deal ? formatCurrency(deal.amount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {deal && deal.gross_profit ? formatCurrency(deal.gross_profit) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`rounded-full ${activityTypeMapping[activity.activity_type]?.bgColor || 'bg-gray-100'} px-2 py-1 text-xs font-medium ${activityTypeMapping[activity.activity_type]?.textColor || 'text-gray-800'}`}>
                            {activityTypeMapping[activity.activity_type]?.text || activity.activity_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {activity.description.length > 30
                            ? `${activity.description.substring(0, 30)}...`
                            : activity.description}
                        </td>
                        <td className="px-4 py-3 text-sm">{getSalesRepName(activity.sales_rep_id)}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button 
                              className="text-sm text-primary"
                              onClick={() => handleViewDetails(activity.id)}
                            >
                              詳細
                            </button>
                            <button 
                              className="text-sm text-primary"
                              onClick={() => handleEditActivity(activity.id)}
                            >
                              編集
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      活動ログデータがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* ページネーション（実装は省略） */}
        {filteredActivities.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              全 {filteredActivities.length} 件を表示
            </p>
            {/* ページネーションは将来的に実装 */}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
