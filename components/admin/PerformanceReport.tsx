"use client";

import React, { useState } from 'react';
import { getSalesPerformance } from '@/lib/supabase/adminApi';

type Period = 'week' | 'month' | 'quarter' | 'year';

export default function PerformanceReport({ initialData }: any) {
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(initialData);
  
  // 期間変更時のデータ更新
  const handlePeriodChange = async (newPeriod: Period) => {
    setPeriod(newPeriod);
    setLoading(true);
    
    try {
      const data = await getSalesPerformance(newPeriod);
      setReportData(data);
    } catch (error) {
      console.error('実績データの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 金額のフォーマット
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };
  
  if (!reportData) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border">
        <p className="text-muted-foreground">データがありません</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">営業実績レポート</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handlePeriodChange('week')}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              period === 'week'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            直近1週間
          </button>
          <button
            onClick={() => handlePeriodChange('month')}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              period === 'month'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            1ヶ月間
          </button>
          <button
            onClick={() => handlePeriodChange('quarter')}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              period === 'quarter'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            四半期
          </button>
          <button
            onClick={() => handlePeriodChange('year')}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              period === 'year'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            1年間
          </button>
        </div>
      </div>
      
      <div className="rounded-md border">
        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">データ読み込み中...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">担当者名</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">受注件数</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">受注金額</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">進行中案件</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">合計活動数</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">訪問</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">電話</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">メール</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Web会議</th>
                </tr>
              </thead>
              <tbody>
                {reportData.performance_data.map((item: any) => (
                  <tr key={item.sales_rep.id} className="border-b">
                    <td className="px-4 py-3 font-medium">{item.sales_rep.name}</td>
                    <td className="px-4 py-3 text-center">{item.deals_won}</td>
                    <td className="px-4 py-3 text-right">{formatAmount(item.total_amount)}</td>
                    <td className="px-4 py-3 text-center">{item.deals_active}</td>
                    <td className="px-4 py-3 text-center">{item.activities.total}</td>
                    <td className="px-4 py-3 text-center">{item.activities.visit}</td>
                    <td className="px-4 py-3 text-center">{item.activities.phone}</td>
                    <td className="px-4 py-3 text-center">{item.activities.email}</td>
                    <td className="px-4 py-3 text-center">{item.activities.web_meeting}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30">
                <tr>
                  <td className="px-4 py-3 font-medium">合計</td>
                  <td className="px-4 py-3 text-center">
                    {reportData.performance_data.reduce((sum: number, item: any) => sum + item.deals_won, 0)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatAmount(
                      reportData.performance_data.reduce((sum: number, item: any) => sum + item.total_amount, 0)
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {reportData.performance_data.reduce((sum: number, item: any) => sum + item.deals_active, 0)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {reportData.performance_data.reduce((sum: number, item: any) => sum + item.activities.total, 0)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {reportData.performance_data.reduce((sum: number, item: any) => sum + item.activities.visit, 0)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {reportData.performance_data.reduce((sum: number, item: any) => sum + item.activities.phone, 0)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {reportData.performance_data.reduce((sum: number, item: any) => sum + item.activities.email, 0)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {reportData.performance_data.reduce((sum: number, item: any) => sum + item.activities.web_meeting, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
      
      <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
        <p>
          期間：
          {new Date(reportData.start_date).toLocaleDateString('ja-JP')} 〜{' '}
          {new Date(reportData.end_date).toLocaleDateString('ja-JP')}
        </p>
      </div>
    </div>
  );
}
