'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layouts/MainLayout';
import { getCustomers, getSalesReps, updateCustomer } from '@/lib/supabase/api';
import { Customer, SalesRep } from '@/types';
import { getUser } from '@/lib/supabase/client';

// 顧客一覧を表示するコンポーネント
function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Customer>>({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewAllCustomers, setViewAllCustomers] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // ユーザー情報の取得
        const user = await getUser();
        if (!user) {
          return;
        }

        // 営業担当者データを取得
        const salesRepsData = await getSalesReps();
        setSalesReps(salesRepsData);
        
        // ログインユーザーの営業担当者情報を確認
        const currentUserSalesRep = salesRepsData.find(rep => rep.user_id === user.id);
        const userIsAdmin = currentUserSalesRep?.role === 'admin' || currentUserSalesRep?.role === 'manager';
        setIsAdmin(userIsAdmin);
        
        // 顧客データを取得（デフォルトでは自分が担当する顧客のみ）
        const customersData = await getCustomers(viewAllCustomers);
        setCustomers(customersData);
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [viewAllCustomers]);

  // 管理者が全顧客表示モードを切り替える関数
  const toggleViewAllCustomers = async () => {
    setLoading(true);
    setViewAllCustomers(!viewAllCustomers);
  };

  // 営業担当者IDから名前を取得する関数
  const getSalesRepName = (id: string) => {
    const rep = salesReps.find(rep => rep.id === id);
    return rep ? rep.name : '-';
  };

  // 編集モードを開始する関数
  const handleStartEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setEditFormData({
      name: customer.name,
      sales_rep_id: customer.sales_rep_id
    });
    // 更新結果メッセージをクリア
    setUpdateSuccess(null);
    setUpdateError(null);
  };

  // 編集モードをキャンセルする関数
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  // フォームの入力値を更新する関数
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 顧客データを更新する関数
  const handleUpdateCustomer = async (id: string) => {
    try {
      setUpdateLoading(true);
      setUpdateError(null);
      
      const updatedCustomer = await updateCustomer(id, editFormData);
      
      if (updatedCustomer) {
        // 顧客リストを更新
        setCustomers(prev => 
          prev.map(customer => 
            customer.id === id ? { ...customer, ...updatedCustomer } : customer
          )
        );
        
        // 編集モードを終了
        setEditingId(null);
        setEditFormData({});
        
        // 成功メッセージを表示
        setUpdateSuccess('顧客情報を更新しました');
        setTimeout(() => setUpdateSuccess(null), 3000);
      } else {
        setUpdateError('顧客情報の更新に失敗しました');
      }
    } catch (error) {
      console.error('顧客更新エラー:', error);
      setUpdateError('更新処理中にエラーが発生しました');
    } finally {
      setUpdateLoading(false);
    }
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
      {updateSuccess && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-green-800 border border-green-200">
          {updateSuccess}
        </div>
      )}
      
      {updateError && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-red-800 border border-red-200">
          {updateError}
        </div>
      )}
      
      {/* 管理者向け表示切替 */}
      {isAdmin && (
        <div className="mb-4 flex items-center justify-end">
          <button
            onClick={toggleViewAllCustomers}
            className="text-sm rounded-md bg-secondary px-3 py-1 text-secondary-foreground hover:bg-secondary/90"
          >
            {viewAllCustomers ? '担当顧客のみ表示' : '全顧客を表示'}
          </button>
        </div>
      )}
      
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
                    {editingId === customer.id ? (
                      // 編集モード
                      <>
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name || ''}
                            onChange={handleInputChange}
                            className="w-full rounded-md border px-3 py-1 text-sm"
                            placeholder="会社名"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            name="sales_rep_id"
                            value={editFormData.sales_rep_id || ''}
                            onChange={handleInputChange}
                            className="w-full rounded-md border px-3 py-1 text-sm"
                          >
                            {salesReps.map(rep => (
                              <option key={rep.id} value={rep.id}>
                                {rep.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateCustomer(customer.id)}
                              disabled={updateLoading}
                              className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              {updateLoading ? '更新中...' : '保存'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-secondary/90"
                            >
                              キャンセル
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // 表示モード
                      <>
                        <td className="px-4 py-3 text-sm">{customer.name}</td>
                        <td className="px-4 py-3 text-sm">{getSalesRepName(customer.sales_rep_id)}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleStartEdit(customer)}
                              className="text-sm text-primary hover:underline"
                            >
                              編集
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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
            新規顧客追加
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
