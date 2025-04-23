'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layouts/MainLayout';
import { getDepartmentPerformance } from '@/lib/supabase/api';
import { DepartmentPerformance } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function DepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 部署パフォーマンスデータを取得
        const departmentData = await getDepartmentPerformance();
        setDepartments(departmentData);
      } catch (error) {
        console.error('部署データ取得エラー:', error);
        setError('データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // 部署の詳細ページへ移動（将来的に実装）
  const handleViewDepartmentDetails = (departmentId: string) => {
    router.push(`/departments/${departmentId}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">部署別案件状況</h1>
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
          <h1 className="text-3xl font-bold">部署別案件状況</h1>
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
          <h1 className="text-3xl font-bold">部署別案件状況</h1>
          <div className="flex gap-2">
            <Link 
              href="/departments/compare" 
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              グラフ比較
            </Link>
          </div>
        </div>
        
        {departments.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">表示するデータがありません</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((dept) => (
              <div 
                key={dept.departmentId} 
                className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewDepartmentDetails(dept.departmentId)}
              >
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">{dept.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {dept.memberCount}名の担当者
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-muted/30 p-2">
                      <p className="text-xs text-muted-foreground">案件数</p>
                      <p className="text-lg font-bold">{dept.totalDeals}</p>
                    </div>
                    <div className="rounded-md bg-green-100 p-2">
                      <p className="text-xs text-muted-foreground">受注</p>
                      <p className="text-lg font-bold">{dept.wonDeals}</p>
                    </div>
                    <div className="rounded-md bg-red-100 p-2">
                      <p className="text-xs text-muted-foreground">失注</p>
                      <p className="text-lg font-bold">{dept.lostDeals}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* 商談中の情報 */}
                    <div className="rounded-md bg-primary/10 p-3 space-y-2">
                      <h3 className="text-sm font-medium border-b pb-1 mb-2">商談中</h3>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">件数</p>
                          <p className="text-sm font-medium">{dept.inProgressDeals}件</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">金額</p>
                          <p className="text-sm font-medium">{formatCurrency(dept.inProgressAmount)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">粗利</p>
                          <p className="text-sm font-medium">{formatCurrency(dept.inProgressProfit)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* 受注済みの情報 */}
                    <div className="rounded-md bg-green-100 p-3 space-y-2">
                      <h3 className="text-sm font-medium border-b pb-1 mb-2">受注済</h3>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">件数</p>
                          <p className="text-sm font-medium">{dept.wonDeals}件</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">金額</p>
                          <p className="text-sm font-medium">{formatCurrency(dept.wonAmount)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">粗利</p>
                          <p className="text-sm font-medium">{formatCurrency(dept.totalProfit)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t pt-2">
                    <p className="text-sm">活動数</p>
                    <p className="font-medium">{dept.activities} 件</p>
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
