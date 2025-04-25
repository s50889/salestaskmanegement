'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import { getDeals, getCustomers, getSalesReps, getDepartments } from '@/lib/supabase/api';
import { getUser } from '@/lib/supabase/client';
import { Deal, Customer, SalesRep, Department } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [salesRepFilter, setSalesRepFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  // ページネーション用の状態
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 1ページあたり12件表示

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
        
        // 案件、顧客、営業担当者、部署のデータを取得
        const [dealsData, customersData, salesRepsData, departmentsData] = await Promise.all([
          getDeals(),
          getCustomers(),
          getSalesReps(),
          getDepartments()
        ]);
        
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

  // フィルタリングされた案件リストを取得
  const filteredDeals = deals.filter(deal => {
    const customerName = deal.customer?.name || '';
    const salesRepName = getSalesRepName(deal);
    
    const matchesSearch = 
      searchTerm === '' || 
      deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter;
    
    // 種別フィルタリング
    const matchesCategory = categoryFilter === 'all' || deal.category === categoryFilter;
    
    const matchesSalesRep = salesRepFilter === '' || deal.sales_rep_id === salesRepFilter;
    
    // 部署フィルター: 部署が選択されている場合は、その部署に所属する営業担当者の案件のみを表示
    const matchesDepartment = departmentFilter === '' || 
      (salesReps.find(rep => rep.id === deal.sales_rep_id)?.department_id === departmentFilter);
    
    return matchesSearch && matchesStatus && matchesCategory && matchesSalesRep && matchesDepartment;
  });

  // 案件追加ページへ移動
  const handleAddDeal = () => {
    router.push('/deals/new');
  };

  // 案件詳細ページへ移動
  const handleViewDetails = (id: string) => {
    router.push(`/deals/${id}`);
  };

  // 案件編集ページへ移動
  const handleEditDeal = (id: string) => {
    router.push(`/deals/${id}/edit`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">案件管理</h1>
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-muted-foreground">データ読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ページネーション
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedDeals = filteredDeals.slice(indexOfFirstItem, indexOfLastItem);

  // ページネーションのページ数を計算
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredDeals.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">案件管理</h1>
          <button 
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            onClick={handleAddDeal}
          >
            案件を追加
          </button>
        </div>
        
        {/* 検索フィルター */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <input
              type="text"
              placeholder="案件名、顧客名で検索..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">ステータス: すべて</option>
              <option value="negotiation">商談中</option>
              <option value="proposal">提案中</option>
              <option value="quotation">見積提出</option>
              <option value="final_negotiation">最終交渉</option>
              <option value="won">受注</option>
              <option value="lost">失注</option>
            </select>
            <select 
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">種別: すべて</option>
              <option value="機械工具">機械工具</option>
              <option value="工事">工事</option>
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
            <select 
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">部署: すべて</option>
              {departments.map(department => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 案件一覧 */}
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">案件名</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">顧客</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">担当者</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">ステータス</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">金額</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">種別</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDeals.length > 0 ? (
                  paginatedDeals.map(deal => (
                    <tr key={deal.id} className="border-b">
                      <td className="px-4 py-3 text-sm">{deal.name}</td>
                      <td className="px-4 py-3 text-sm">{getCustomerName(deal)}</td>
                      <td className="px-4 py-3 text-sm">{getSalesRepName(deal)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`rounded-full ${statusMapping[deal.status]?.bgColor || 'bg-gray-100'} px-2 py-1 text-xs font-medium ${statusMapping[deal.status]?.textColor || 'text-gray-800'}`}>
                          {statusMapping[deal.status]?.text || deal.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(Number(deal.amount))}</td>
                      <td className="px-4 py-3 text-sm text-center">{deal.category}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button 
                            className="text-sm text-primary"
                            onClick={() => handleViewDetails(deal.id)}
                          >
                            詳細
                          </button>
                          <button 
                            className="text-sm text-primary"
                            onClick={() => handleEditDeal(deal.id)}
                          >
                            編集
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      案件データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* ページネーション */}
        {filteredDeals.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              全 {filteredDeals.length} 件中 {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredDeals.length)} 件を表示
            </p>
            <div className="flex gap-1">
              {/* 前のページへ */}
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  currentPage === 1 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                前へ
              </button>
              
              {/* ページ番号 */}
              {pageNumbers.map(number => (
                <button 
                  key={number} 
                  onClick={() => setCurrentPage(number)}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    currentPage === number 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {number}
                </button>
              ))}
              
              {/* 次のページへ */}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageNumbers.length))}
                disabled={currentPage === pageNumbers.length}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  currentPage === pageNumbers.length 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                次へ
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
