"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Deal, Customer, SalesRep } from '@/types';
import { createDeal, updateDeal } from '@/lib/supabase/api';

type DealFormProps = {
  deal?: Deal;
  customers: Customer[];
  salesReps: SalesRep[];
  currentSalesRep?: SalesRep | null;
  onSuccess?: () => void;
};

export default function DealForm({ deal, customers, salesReps, currentSalesRep, onSuccess }: DealFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 顧客検索関連の状態
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    customer_id: '',
    amount: 0,
    gross_profit: 0,
    status: 'negotiation' as Deal['status'],
    description: '',
    sales_rep_id: '',
    expected_close_date: null as string | null,
  });

  // 金額のフォーマット関数
  const formatAmountForDisplay = (amount: number): string => {
    return amount.toLocaleString('ja-JP');
  };

  // 表示用の金額状態
  const [displayAmount, setDisplayAmount] = useState('');
  const [displayGrossProfit, setDisplayGrossProfit] = useState('');

  useEffect(() => {
    // 編集モードの場合、既存の案件データをフォームに設定
    if (deal) {
      setFormData({
        name: deal.name,
        customer_id: deal.customer_id,
        amount: Number(deal.amount),
        gross_profit: Number(deal.gross_profit || 0),
        status: deal.status,
        description: deal.description,
        sales_rep_id: deal.sales_rep_id,
        expected_close_date: deal.expected_close_date,
      });
      
      // 金額を表示用にフォーマット
      setDisplayAmount(formatAmountForDisplay(Number(deal.amount)));
      setDisplayGrossProfit(formatAmountForDisplay(Number(deal.gross_profit || 0)));
      
      // 選択されている顧客を設定
      const customer = customers.find(c => c.id === deal.customer_id);
      if (customer) {
        setSelectedCustomer(customer);
        setCustomerSearchTerm(customer.name);
      }
    } else if (currentSalesRep) {
      // 新規作成モードで、ログインユーザーの営業担当者情報がある場合
      setFormData(prev => ({
        ...prev,
        sales_rep_id: currentSalesRep.id
      }));
    }
  }, [deal, customers, currentSalesRep]);

  // 顧客検索ドロップダウンの外側をクリックした時に閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 検索条件に一致する顧客のフィルタリング
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      // 何もしない（金額は別のハンドラで処理）
    } else if (name === 'status') {
      // statusフィールドの型をDeal['status']に変換
      setFormData(prev => ({ ...prev, [name]: value as Deal['status'] }));
    } else if (name === 'expected_close_date') {
      setFormData(prev => ({ ...prev, [name]: value as string | null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // 金額入力の処理
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 入力から数字以外の文字を削除
    const inputValue = e.target.value.replace(/[^\d]/g, '');
    
    // 数値に変換
    const numericValue = inputValue ? parseInt(inputValue, 10) : 0;
    
    // フォームデータを更新
    setFormData(prev => ({ ...prev, amount: numericValue }));
    
    // 表示用の金額を更新
    setDisplayAmount(inputValue ? formatAmountForDisplay(numericValue) : '');
  };

  // 粗利入力の処理
  const handleGrossProfitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 入力から数字以外の文字を削除
    const inputValue = e.target.value.replace(/[^\d]/g, '');
    
    // 数値に変換
    const numericValue = inputValue ? parseInt(inputValue, 10) : 0;
    
    // フォームデータを更新
    setFormData(prev => ({ ...prev, gross_profit: numericValue }));
    
    // 表示用の粗利を更新
    setDisplayGrossProfit(inputValue ? formatAmountForDisplay(numericValue) : '');
  };

  // 顧客検索入力の処理
  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerSearchTerm(e.target.value);
    setShowCustomerDropdown(true);
    // 検索語が空になった場合は選択をクリア
    if (e.target.value === '') {
      setSelectedCustomer(null);
      setFormData(prev => ({ ...prev, customer_id: '' }));
    }
  };

  // 顧客選択の処理
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.name);
    setFormData(prev => ({ ...prev, customer_id: customer.id }));
    setShowCustomerDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (deal) {
        // 既存案件の更新
        await updateDeal(deal.id, formData);
      } else {
        // 新規案件の作成
        await createDeal(formData);
      }

      // 成功時の処理
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/deals');
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
            案件名 <span className="text-destructive">*</span>
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

        <div className="space-y-2 relative" ref={customerDropdownRef}>
          <label htmlFor="customer_search" className="text-sm font-medium">
            顧客 <span className="text-destructive">*</span>
          </label>
          <input
            id="customer_search"
            type="text"
            value={customerSearchTerm}
            onChange={handleCustomerSearchChange}
            onFocus={() => setShowCustomerDropdown(true)}
            placeholder="顧客名を入力して検索..."
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="hidden"
            name="customer_id"
            value={formData.customer_id}
            required
          />
          
          {showCustomerDropdown && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-background shadow-lg max-h-60 overflow-auto">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-muted"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    {customer.name}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {customerSearchTerm ? '該当する顧客がありません' : '顧客名を入力してください'}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="amount" className="text-sm font-medium">
            金額 (円)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              ¥
            </span>
            <input
              id="amount"
              name="amount"
              type="text"
              value={displayAmount}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full rounded-md border border-input bg-background pl-7 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="gross_profit" className="text-sm font-medium">
            粗利 (円)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              ¥
            </span>
            <input
              id="gross_profit"
              name="gross_profit"
              type="text"
              value={displayGrossProfit}
              onChange={handleGrossProfitChange}
              placeholder="0"
              className="w-full rounded-md border border-input bg-background pl-7 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            ステータス <span className="text-destructive">*</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="negotiation">商談中</option>
            <option value="quotation">見積提出</option>
            <option value="won">受注</option>
            <option value="lost">失注</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="expected_close_date" className="text-sm font-medium">
            予想決着日
          </label>
          <input
            id="expected_close_date"
            name="expected_close_date"
            type="date"
            value={formData.expected_close_date ?? ''}
            onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {!currentSalesRep ? (
          <div className="space-y-2">
            <label htmlFor="sales_rep_id" className="text-sm font-medium">
              担当者 <span className="text-destructive">*</span>
            </label>
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
          </div>
        ) : (
          <div className="space-y-2">
            <label htmlFor="sales_rep_name" className="text-sm font-medium">
              担当者
            </label>
            <input
              id="sales_rep_name"
              type="text"
              value={currentSalesRep.name}
              readOnly
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50"
            />
            <input
              type="hidden"
              name="sales_rep_id"
              value={formData.sales_rep_id}
            />
          </div>
        )}
      </div>

      <div className="space-y-2 md:col-span-2">
        <label htmlFor="description" className="text-sm font-medium">
          案件詳細
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium"
          disabled={loading}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          disabled={loading}
        >
          {loading ? '保存中...' : deal ? '更新する' : '登録する'}
        </button>
      </div>
    </form>
  );
}
