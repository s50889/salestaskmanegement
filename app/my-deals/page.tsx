'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layouts/MainLayout';
import { getDeals, getCustomers, getSalesReps, getDepartments } from '@/lib/supabase/api';
import { getUser } from '@/lib/supabase/client';
import { Deal, Customer, SalesRep, Department } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function MyDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentSalesRepId, setCurrentSalesRepId] = useState<string | null>(null);

  // ステータスの日本語表示マッピング
  const statusMapping: Record<string, { text: string, bgColor: string, textColor: string }> = {
    negotiation: { text: '商談中', bgColor: 'bg-amber-100', textColor: 'text-amber-800' },
    proposal: { text: '提案中', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' },
    quotation: { text: '見積提出', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    final_negotiation: { text: '最終交渉', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    won: { text: '受注', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    lost: { text: '失注', bgColor: 'bg-red-100', textColor: 'text-red-800' },
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
        
        setCurrentUserId(user.id);
        
        // 案件、顧客、営業担当者、部署のデータを取得
        const [dealsData, customersData, salesRepsData, departmentsData] = await Promise.all([
          getDeals(),
          getCustomers(),
          getSalesReps(),
          getDepartments()
        ]);
        
        // 現在のユーザーの営業担当者IDを取得
        const currentSalesRep = salesRepsData.find(rep => rep.user_id === user.id);
        if (currentSalesRep) {
          setCurrentSalesRepId(currentSalesRep.id);
        }
        
        setDeals(dealsData);
        setCustomers(customersData);
        setSalesReps(salesRepsData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  // 顧客名を取得する関数
  const getCustomerName = (deal: Deal) => {
    return deal.customer?.name || '不明';
  };

  // 営業担当者名を取得する関数
  const getSalesRepName = (deal: Deal) => {
    return deal.sales_rep?.name || '不明';
  };

  // 現在のユーザーの案件のみをフィルタリング
  const filteredDeals = deals.filter(deal => {
    // 現在のユーザーの案件のみを表示
    if (!currentSalesRepId || deal.sales_rep_id !== currentSalesRepId) {
      return false;
    }
    
    const customerName = deal.customer?.name || '';
    const matchesSearch = 
      searchTerm === '' || 
      deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || deal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">個人案件一覧</h1>
          <Link 
            href="/deals/new" 
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            新規案件作成
          </Link>
        </div>
        
        {/* 検索・フィルターエリア */}
        <div className="flex flex-wrap gap-4 p-4 rounded-lg border bg-card shadow-sm">
          <div className="space-y-1">
            <label className="text-sm font-medium">検索</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="案件名・顧客名で検索"
              className="px-3 py-1.5 border rounded-md bg-background text-sm w-64"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium">ステータス</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-md bg-background text-sm"
            >
              <option value="">すべて</option>
              {Object.entries(statusMapping).map(([key, { text }]) => (
                <option key={key} value={key}>{text}</option>
              ))}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">データを読み込み中...</p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">表示する案件がありません</p>
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
                    <th className="px-4 py-3 text-right text-sm font-medium">金額</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">更新日</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((deal) => {
                    const status = statusMapping[deal.status] || { text: '不明', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
                    
                    return (
                      <tr key={deal.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm">
                          <Link href={`/deals/${deal.id}`} className="text-primary hover:underline">
                            {deal.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm">{getCustomerName(deal)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-block rounded-full px-2 py-1 text-xs ${status.bgColor} ${status.textColor}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(Number(deal.amount))}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatDate(deal.updated_at)}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <div className="flex justify-center space-x-2">
                            <Link 
                              href={`/deals/${deal.id}`}
                              className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
                            >
                              詳細
                            </Link>
                            <Link 
                              href={`/deals/${deal.id}/edit`}
                              className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700 hover:bg-amber-100"
                            >
                              編集
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
