"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Customer, Deal, SalesRep } from '@/types';
import { createActivity, updateActivity } from '@/lib/supabase/api';
import { getUser } from '@/lib/supabase/client';

type ActivityFormProps = {
  activity?: Activity;
  customers: Customer[];
  deals: Deal[];
  salesReps: SalesRep[];
  onSuccess?: () => void;
  initialValues?: {
    customer_id?: string;
    deal_id?: string;
    activity_type?: string;
  };
};

export default function ActivityForm({ 
  activity, 
  customers, 
  deals, 
  salesReps, 
  onSuccess,
  initialValues 
}: ActivityFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSalesRepId, setCurrentSalesRepId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    deal_id: '',
    activity_type: 'visit' as Activity['activity_type'],
    description: '',
    sales_rep_id: '',
    date: new Date().toISOString().split('T')[0] // 今日の日付をデフォルト値に
  });

  // 選択された顧客に関連する案件のリスト
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);

  // ログインユーザーの営業担当者IDを取得
  useEffect(() => {
    async function getCurrentSalesRep() {
      try {
        const user = await getUser();
        if (!user) return;
        
        const currentRep = salesReps.find(rep => rep.user_id === user.id);
        if (currentRep) {
          setCurrentSalesRepId(currentRep.id);
          // フォームデータに自動的に営業担当者IDをセット
          setFormData(prev => ({ ...prev, sales_rep_id: currentRep.id }));
        }
      } catch (error) {
        console.error('営業担当者情報の取得に失敗:', error);
      }
    }
    
    getCurrentSalesRep();
  }, [salesReps]);

  useEffect(() => {
    // 編集モードの場合、既存の活動データをフォームに設定
    if (activity) {
      setFormData({
        customer_id: activity.customer_id,
        deal_id: activity.deal_id || '',
        activity_type: activity.activity_type,
        description: activity.description,
        sales_rep_id: activity.sales_rep_id,
        date: activity.date.split('T')[0] // ISOフォーマットから日付部分だけを取得
      });
    } 
    // URLパラメータから初期値が渡された場合
    else if (initialValues) {
      setFormData(prevData => ({
        ...prevData,
        ...(initialValues.customer_id && { customer_id: initialValues.customer_id }),
        ...(initialValues.deal_id && { deal_id: initialValues.deal_id }),
        ...(initialValues.activity_type && { 
          activity_type: initialValues.activity_type as Activity['activity_type'] 
        })
      }));
    }
  }, [activity, initialValues]);

  // 顧客が選択されたときに、その顧客に関連する案件をフィルタリング
  useEffect(() => {
    if (formData.customer_id) {
      const customerDeals = deals.filter(deal => deal.customer_id === formData.customer_id);
      setFilteredDeals(customerDeals);
      
      // 選択されている案件が、フィルタリングされた案件リストに含まれていない場合、選択をクリア
      if (formData.deal_id && !customerDeals.some(deal => deal.id === formData.deal_id)) {
        setFormData(prev => ({ ...prev, deal_id: '' }));
      }
    } else {
      setFilteredDeals([]);
      setFormData(prev => ({ ...prev, deal_id: '' }));
    }
  }, [formData.customer_id, deals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'activity_type') {
      // activity_typeフィールドの型をActivity['activity_type']に変換
      setFormData(prev => ({ ...prev, [name]: value as Activity['activity_type'] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // deal_idが空文字の場合はundefinedに変換（nullではなく）
      const activityData = {
        ...formData,
        deal_id: formData.deal_id || undefined
      };

      if (activity) {
        // 既存活動の更新
        await updateActivity(activity.id, activityData);
      } else {
        // 新規活動の作成
        await createActivity(activityData);
      }

      // 成功時の処理
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/activities');
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
          <label htmlFor="date" className="text-sm font-medium">
            日付 <span className="text-destructive">*</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="activity_type" className="text-sm font-medium">
            活動種別 <span className="text-destructive">*</span>
          </label>
          <select
            id="activity_type"
            name="activity_type"
            value={formData.activity_type}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="visit">訪問</option>
            <option value="phone">電話</option>
            <option value="email">メール</option>
            <option value="web_meeting">Web会議</option>
            <option value="other">その他</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="customer_id" className="text-sm font-medium">
            顧客 <span className="text-destructive">*</span>
          </label>
          <select
            id="customer_id"
            name="customer_id"
            value={formData.customer_id}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">選択してください</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="deal_id" className="text-sm font-medium">
            案件
          </label>
          <select
            id="deal_id"
            name="deal_id"
            value={formData.deal_id}
            onChange={handleChange}
            disabled={!formData.customer_id || filteredDeals.length === 0}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">選択してください</option>
            {filteredDeals.map(deal => (
              <option key={deal.id} value={deal.id}>
                {deal.name}
              </option>
            ))}
          </select>
          {formData.customer_id && filteredDeals.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              この顧客に関連する案件はありません
            </p>
          )}
        </div>

        {/* 担当者入力フィールドを削除して、代わりに現在の担当者名を表示 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            担当者
          </label>
          <div className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
            {currentSalesRepId ? 
              salesReps.find(rep => rep.id === currentSalesRepId)?.name || '不明' 
              : '読み込み中...'}
            <input 
              type="hidden" 
              name="sales_rep_id" 
              value={formData.sales_rep_id} 
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="description" className="text-sm font-medium">
            活動内容 <span className="text-destructive">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="活動の詳細を入力してください"
          />
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
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? '保存中...' : activity ? '更新' : '登録'}
        </button>
      </div>
    </form>
  );
}
