'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layouts/MainLayout';
import { getCustomers, getSalesReps } from '@/lib/supabase/api';
import { Customer, SalesRep } from '@/types';

// 顧客一覧を表示するコンポーネント
function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [customersData, salesRepsData] = await Promise.all([
          getCustomers(),
          getSalesReps()
        ]);
        setCustomers(customersData);
        setSalesReps(salesRepsData);
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // 営業担当者IDから名前を取得する関数
  const getSalesRepName = (id: string) => {
    const rep = salesReps.find(rep => rep.id === id);
    return rep ? rep.name : '-';
  };

  if (loading) {
    return (
      <div className="rounded-lg border p-4 text-center">
        <p className="text-muted-foreground">データ読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      {customers.length === 0 ? (
        <div className="rounded-md bg-muted p-8 text-center">
          <p className="text-muted-foreground">登録されている顧客はありません</p>
          <Link
            href="/customers/new"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            顧客を追加
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">会社名</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">担当者</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b">
                    <td className="px-4 py-3 text-sm">{customer.name}</td>
                    <td className="px-4 py-3 text-sm">{getSalesRepName(customer.sales_rep_id)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <Link href={`/customers/${customer.id}`} className="text-sm text-primary">
                          詳細
                        </Link>
                        <Link href={`/customers/${customer.id}/edit`} className="text-sm text-primary">
                          編集
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// 顧客管理ページ本体
export default function CustomersPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">顧客管理</h1>
          <Link
            href="/customers/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            顧客を追加
          </Link>
        </div>
        
        {/* 検索フィルター */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <input
              type="text"
              placeholder="会社名で検索..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            />
          </div>
        </div>
        
        {/* 顧客一覧 */}
        <CustomersList />
      </div>
    </MainLayout>
  );
}
