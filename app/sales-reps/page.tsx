'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layouts/MainLayout';
import { getUser } from '@/lib/supabase/client';
import { getSalesReps, getSalesRepPerformance, getDepartments, getDepartmentGroups, getSalesRepGroup } from '@/lib/supabase/api';
import { SalesRep, SalesRepPerformance, Department, DepartmentGroup, SalesRepGroup } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function SalesRepsPage() {
  const router = useRouter();
  const [salesReps, setSalesReps] = useState<SalesRepPerformance[]>([]);
  const [filteredReps, setFilteredReps] = useState<SalesRepPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<SalesRepPerformance | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'personal'>('all');
  const [error, setError] = useState<string | null>(null);
  
  // 絞り込み用のステート
  const [nameFilter, setNameFilter] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  // グループ絞り込み用のステート
  const [departmentGroups, setDepartmentGroups] = useState<DepartmentGroup[]>([]);
  const [groupFilter, setGroupFilter] = useState('');
  const [salesRepGroups, setSalesRepGroups] = useState<Record<string, string>>({});

  // 第一営業部のID
  const FIRST_DEPARTMENT_ID = 'cc22f892-b2e1-425d-8472-385bacbc9da8';

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
        
        // 部署一覧を取得
        const departmentsData = await getDepartments();
        setDepartments(departmentsData);
        
        // 現在のユーザーが管理者かどうかを確認
        const currentRep = reps.find(rep => rep.user_id === user.id);
        const isAdminOrManager = currentRep?.role === 'admin' || currentRep?.role === 'manager';
        setIsAdmin(isAdminOrManager);
        
        if (isAdminOrManager) {
          // 管理者またはマネージャーの場合、全営業担当者のパフォーマンスを取得
          const performanceData = await getSalesRepPerformance();
          
          // マネージャー自身のデータを保存
          if (currentRep) {
            const myPerformance = await getSalesRepPerformance(currentRep.id);
            if (myPerformance && !Array.isArray(myPerformance)) {
              setCurrentUserData(myPerformance as SalesRepPerformance);
            }
          }
          
          if (performanceData && Array.isArray(performanceData)) {
            const data = performanceData as SalesRepPerformance[];
            setSalesReps(data);
            setFilteredReps(data);
          } else {
            setSalesReps([]);
            setFilteredReps([]);
          }
        } else {
          // 一般営業担当者の場合、自分のデータのみ取得
          const myPerformance = await getSalesRepPerformance(currentRep?.id);
          if (myPerformance && !Array.isArray(myPerformance)) {
            const data = [myPerformance as SalesRepPerformance];
            setSalesReps(data);
            setFilteredReps(data);
            setCurrentUserData(myPerformance as SalesRepPerformance);
          } else {
            setSalesReps([]);
            setFilteredReps([]);
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
  
  // 部署フィルターが変更されたときにグループ一覧を取得
  useEffect(() => {
    async function fetchDepartmentGroups() {
      if (departmentFilter === FIRST_DEPARTMENT_ID) {
        try {
          const groups = await getDepartmentGroups(FIRST_DEPARTMENT_ID);
          setDepartmentGroups(groups);
          
          // 第一営業部が選択された場合、営業担当者のグループ情報を再取得
          const groupsMap: Record<string, string> = {};
          
          // 絞り込まれた営業担当者に対してグループ情報を取得
          for (const rep of salesReps.filter(rep => rep.department_id === FIRST_DEPARTMENT_ID)) {
            const groupInfo = await getSalesRepGroup(rep.salesRepId);
            if (groupInfo) {
              groupsMap[rep.salesRepId] = groupInfo.department_group_id;
              console.log(`営業担当者 ${rep.name} (${rep.salesRepId}) のグループID: ${groupInfo.department_group_id}`);
            }
          }
          
          console.log('営業担当者グループマッピング:', groupsMap);
          setSalesRepGroups(groupsMap);
        } catch (error) {
          console.error('グループデータ取得エラー:', error);
          setDepartmentGroups([]);
        }
      } else {
        setDepartmentGroups([]);
        setGroupFilter('');
      }
    }
    
    fetchDepartmentGroups();
  }, [departmentFilter, salesReps]);

  // 絞り込み処理を行う関数
  useEffect(() => {
    // まず、表示モードに基づいてベースとなるデータを選択
    let baseData: SalesRepPerformance[] = [];
    
    if (viewMode === 'all' || !currentUserData) {
      baseData = [...salesReps];
    } else {
      // 個人表示モードの場合は自分のデータのみ
      baseData = currentUserData ? [currentUserData] : [];
    }
    
    // 名前で絞り込み
    let result = baseData;
    if (nameFilter) {
      result = result.filter(rep => 
        rep.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }
    
    // 部署で絞り込み
    if (departmentFilter) {
      result = result.filter(rep => rep.department_id === departmentFilter);
      console.log(`部署フィルター適用後: ${result.length}件`);
      console.log('部署フィルター適用後の営業担当者:', result.map(rep => rep.name));
      
      // 第一営業部かつグループフィルターが指定されている場合
      if (departmentFilter === FIRST_DEPARTMENT_ID && groupFilter) {
        console.log(`グループフィルター: ${groupFilter}`);
        console.log('営業担当者グループマッピング:', salesRepGroups);
        
        result = result.filter(rep => {
          const hasGroup = rep.salesRepId in salesRepGroups;
          const isMatchingGroup = salesRepGroups[rep.salesRepId] === groupFilter;
          
          console.log(`営業担当者 ${rep.name} (${rep.salesRepId}): グループあり=${hasGroup}, グループ一致=${isMatchingGroup}`);
          
          return isMatchingGroup;
        });
        console.log(`グループフィルター適用後: ${result.length}件`);
        console.log('グループフィルター適用後の営業担当者:', result.map(rep => rep.name));
      }
    }
    
    setFilteredReps(result);
  }, [nameFilter, departmentFilter, groupFilter, salesReps, viewMode, currentUserData, salesRepGroups]);

  // フィルターをリセットする
  const resetFilters = () => {
    setNameFilter('');
    setDepartmentFilter('');
    setGroupFilter('');
  };

  // 営業担当者の詳細ページへのリンク
  const handleViewDetails = (salesRepId: string) => {
    router.push(`/sales-reps/${salesRepId}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">担当者別案件状況
          </h1>
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
          <h1 className="text-3xl font-bold">担当者別案件状況</h1>
          <div className="flex gap-2">
            {isAdmin && (
              <Link 
                href="/sales-reps/compare" 
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                グラフ比較
              </Link>
            )}
          </div>
        </div>
        
        {/* マネージャー向けの表示切替タブ */}
        {isAdmin && currentUserData && (
          <div className="flex border-b">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 font-medium text-sm border-b-2 ${
                viewMode === 'all' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              全営業担当表示
            </button>
            <button
              onClick={() => setViewMode('personal')}
              className={`px-4 py-2 font-medium text-sm border-b-2 ${
                viewMode === 'personal' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              自分の実績のみ表示
            </button>
          </div>
        )}
        
        {/* 絞り込みフォーム */}
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">絞り込み検索</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="nameFilter" className="block text-sm font-medium mb-1">
                名前で検索
              </label>
              <input
                id="nameFilter"
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="営業担当者名を入力"
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="departmentFilter" className="block text-sm font-medium mb-1">
                部署で絞り込み
              </label>
              <select
                id="departmentFilter"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full rounded-md border p-2 text-sm"
              >
                <option value="">すべての部署</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            
            {departmentFilter === FIRST_DEPARTMENT_ID && (
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="groupFilter" className="block text-sm font-medium mb-1">
                  グループで絞り込み
                </label>
                <select
                  id="groupFilter"
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="w-full rounded-md border p-2 text-sm"
                >
                  <option value="">すべてのグループ</option>
                  {departmentGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="rounded-md bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80"
              >
                リセット
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            検索結果: {filteredReps.length} 件
            {viewMode === 'personal' && isAdmin && (
              <span className="ml-2 font-medium text-primary">※ 自分の実績のみ表示中</span>
            )}
          </div>
        </div>
        
        {filteredReps.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">表示するデータがありません</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReps.map(rep => (
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
