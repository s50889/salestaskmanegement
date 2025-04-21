'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layouts/MainLayout';
import { getUser } from '@/lib/supabase/client';
import { getSalesReps, getSalesRepPerformance } from '@/lib/supabase/api';
import { SalesRepPerformance } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type ChartData = {
  name: string;
  受注金額: number;
  商談中金額: number;
  受注粗利: number;
  商談中粗利: number;
};

export default function CompareRepsPage() {
  const router = useRouter();
  const [salesReps, setSalesReps] = useState<SalesRepPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        
        // 現在のユーザーが管理者かどうかを確認
        const currentRep = reps.find(rep => rep.user_id === user.id);
        setIsAdmin(currentRep?.role === 'admin' || currentRep?.role === 'manager');
        
        if (currentRep?.role === 'admin' || currentRep?.role === 'manager') {
          // 管理者またはマネージャーの場合、全営業担当者のパフォーマンスを取得
          const performanceData = await getSalesRepPerformance();
          if (performanceData && Array.isArray(performanceData)) {
            // 名前でソート
            const sortedData = [...performanceData].sort((a, b) => a.name.localeCompare(b.name));
            setSalesReps(sortedData as SalesRepPerformance[]);
          } else {
            setSalesReps([]);
          }
        } else {
          // 一般営業担当者の場合、アクセス権限がないことを表示
          setError('この機能を使用する権限がありません');
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

  // グラフ用のデータを準備
  const prepareChartData = (): ChartData[] => {
    return salesReps.map(rep => ({
      name: rep.name,
      受注金額: rep.wonAmount,
      商談中金額: rep.inProgressAmount,
      受注粗利: rep.totalProfit,
      商談中粗利: rep.inProgressProfit
    }));
  };

  // 金額表示用のフォーマッター
  const formatYAxis = (value: number): string => {
    if (value >= 1000000) {
      return `${Math.round(value / 1000000)}M`;
    } else if (value >= 1000) {
      return `${Math.round(value / 1000)}K`;
    }
    return String(value);
  };

  // ツールチップのカスタマイズ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-bold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">営業担当者比較</h1>
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
          <h1 className="text-3xl font-bold">営業担当者比較</h1>
          <div className="rounded-lg border bg-destructive/10 p-6 shadow-sm">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const chartData = prepareChartData();

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">営業担当者比較</h1>
        <div className="flex items-center justify-between">
          <div></div>
          <div className="flex gap-2">
            <Link 
              href="/sales-reps" 
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              一覧表示
            </Link>
          </div>
        </div>
        
        {salesReps.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">表示するデータがありません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 金額グラフ */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">金額比較</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis 
                      tickFormatter={formatYAxis}
                      width={80}
                      label={{ value: '金額 (円)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="受注金額" fill="#4f46e5" name="受注金額" stackId="a" barSize={30} />
                    <Bar dataKey="商談中金額" fill="#8884d8" name="商談中金額" stackId="b" barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* 粗利グラフ */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">粗利比較</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis 
                      tickFormatter={formatYAxis}
                      width={80}
                      label={{ value: '粗利 (円)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="受注粗利" fill="#16a34a" name="受注粗利" stackId="a" barSize={30} />
                    <Bar dataKey="商談中粗利" fill="#84d888" name="商談中粗利" stackId="b" barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
