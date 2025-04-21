'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { getDealAmountStats } from '@/lib/supabase/api';
import { formatCurrency } from '@/lib/utils';

// 色の定義
const COLORS = {
  inProgress: '#3b82f6', // blue-500
  won: '#10b981', // emerald-500
  profit: '#8b5cf6' // violet-500
};

type DealAmountStats = {
  inProgress: {
    total: number;
    profitTotal: number;
    count: number;
  };
  won: {
    total: number;
    profitTotal: number;
    count: number;
  };
  monthlyData: {
    month: string;
    amount: number;
    profit: number;
    count: number;
  }[];
};

export default function DealAmountChart() {
  const [stats, setStats] = useState<DealAmountStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'inProgress' | 'won'>('inProgress');

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getDealAmountStats();
        if (data) {
          setStats(data);
        } else {
          setError('データの取得に失敗しました');
        }
      } catch (error) {
        console.error('Error fetching deal stats:', error);
        setError('エラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // データを更新する関数
  const handleRefreshData = async () => {
    setLoading(true);
    try {
      const data = await getDealAmountStats();
      if (data) {
        setStats(data);
      } else {
        setError('データの取得に失敗しました');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">データ読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-destructive/10 p-6 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">データがありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">案件金額サマリー</h3>
          <div className="flex gap-2">
            <button
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                viewMode === 'inProgress' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setViewMode('inProgress')}
            >
              商談中案件
            </button>
            <button
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                viewMode === 'won' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setViewMode('won')}
            >
              受注案件
            </button>
            <button
              className="rounded-md border border-input bg-background px-3 py-1 text-xs font-medium hover:bg-muted"
              onClick={handleRefreshData}
            >
              データ更新
            </button>
          </div>
        </div>
      </div>
      
      {/* サマリーカード */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-muted/30 p-4">
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            {viewMode === 'inProgress' ? '商談中（金額）' : '受注済（金額）'}
          </h4>
          <p className="text-2xl font-bold text-blue-500">
            {formatCurrency(viewMode === 'inProgress' ? stats.inProgress.total : stats.won.total)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {viewMode === 'inProgress' ? stats.inProgress.count : stats.won.count}件
          </p>
        </div>
        
        <div className="rounded-lg border bg-muted/30 p-4">
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            {viewMode === 'inProgress' ? '商談中（粗利）' : '受注済（粗利）'}
          </h4>
          <p className="text-2xl font-bold text-emerald-500">
            {formatCurrency(viewMode === 'inProgress' ? stats.inProgress.profitTotal : stats.won.profitTotal)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {viewMode === 'inProgress' ? stats.inProgress.count : stats.won.count}件
          </p>
        </div>
      </div>
      
      {/* グラフ */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[
              {
                name: '金額',
                value: viewMode === 'inProgress' ? stats.inProgress.total : stats.won.total,
                fill: COLORS.inProgress
              },
              {
                name: '粗利',
                value: viewMode === 'inProgress' ? stats.inProgress.profitTotal : stats.won.profitTotal,
                fill: COLORS.profit
              }
            ]}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Bar
              dataKey="value"
              name={viewMode === 'inProgress' ? '商談中' : '受注済'}
              fill={viewMode === 'inProgress' ? COLORS.inProgress : COLORS.won}
              barSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
