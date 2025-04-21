"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Customer, SalesRep } from '@/types';
import { createCustomer, updateCustomer } from '@/lib/supabase/api';
import { getUser } from '@/lib/supabase/client';

type CustomerFormProps = {
  customer?: Customer;
  salesReps: SalesRep[];
  defaultSalesRepId?: string;
  onSuccess?: () => void;
};

export default function CustomerForm({ customer, salesReps, defaultSalesRepId, onSuccess }: CustomerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    sales_rep_id: defaultSalesRepId || '',
  });

  useEffect(() => {
    // 現在のユーザーIDを取得
    const fetchCurrentUser = async () => {
      const user = await getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // 編集モードの場合、既存の顧客データをフォームに設定
    if (customer) {
      setFormData({
        name: customer.name,
        sales_rep_id: customer.sales_rep_id,
      });
    } else if (defaultSalesRepId) {
      // 新規作成でデフォルトの営業担当者IDが指定されている場合
      setFormData(prev => ({
        ...prev,
        sales_rep_id: defaultSalesRepId
      }));
    }
  }, [customer, defaultSalesRepId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 営業担当者IDが空の場合は、現在のユーザーを使用して新しい営業担当者を作成する処理を追加することもできます
      // ここでは簡単のため、エラーメッセージを表示します
      if (!formData.sales_rep_id && !formData.sales_rep_id.trim()) {
        throw new Error('担当者を選択してください');
      }

      if (customer) {
        // 既存顧客の更新
        const updated = await updateCustomer(customer.id, formData);
        if (!updated) {
          throw new Error('顧客情報の更新に失敗しました');
        }
      } else {
        // 新規顧客の作成
        const created = await createCustomer(formData);
        if (!created) {
          throw new Error('顧客情報の登録に失敗しました');
        }
      }

      // 成功時の処理
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/customers');
      }
      router.refresh();
    } catch (error: any) {
      setError(error.message || '保存中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            会社名 <span className="text-destructive">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="sales_rep_id" className="text-sm font-medium">
            担当者 <span className="text-destructive">*</span>
          </label>
          {salesReps.length > 0 ? (
            <select
              id="sales_rep_id"
              name="sales_rep_id"
              value={formData.sales_rep_id}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">選択してください</option>
              {salesReps.map(rep => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
              営業担当者データが登録されていません。先に「営業担当者データ作成」ページで担当者データを作成してください。
              <button
                type="button"
                onClick={() => router.push('/test-db-setup')}
                className="mt-2 rounded-md bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-200"
              >
                営業担当者データ作成ページへ
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={loading || salesReps.length === 0}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? '保存中...' : customer ? '更新する' : '登録する'}
        </button>
      </div>
    </form>
  );
}
