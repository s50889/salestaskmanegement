'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import { getUser } from '@/lib/supabase/client';
import { getSalesReps, getSalesRepPerformance, getDepartments } from '@/lib/supabase/api';
import { SalesRepPerformance, Department } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// グラフの色設定
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#FF6B6B', '#C9CBA3', '#87BFFF', '#FFE156', '#DC8686', '#46CDCF', '#6B7AA1', '#725AC1', '#727D71'];

type ChartData = {
  name: string;
  受注金額: number;
  商談中金額: number;
  受注粗利: number;
  商談中粗利: number;
  受注件数: number;
  商談中件数: number;
};

type CompareMetric = '受注' | '商談中';

export default function PerformancePage() {
  const router = useRouter();
  const [salesReps, setSalesReps] = useState<SalesRepPerformance[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareMetric, setCompareMetric] = useState<CompareMetric>('受注');

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
        setIsAdmin(currentRep?.role === 'admin' || currentRep?.role === 'manager');
        
        if (currentRep?.role === 'admin' || currentRep?.role === 'manager') {
          // 管理者またはマネージャーの場合、全営業担当者のパフォーマンスを取得
          const performanceData = await getSalesRepPerformance();
          if (performanceData && Array.isArray(performanceData)) {
            // 金額順にソート
            const sortedData = [...performanceData].sort((a, b) => {
              const sortKey = compareMetric === '受注' ? 'wonAmount' : 
                             compareMetric === '商談中' ? 'inProgressAmount' : 'wonDeals';
              const valueA = a[sortKey as keyof SalesRepPerformance] as number;
              const valueB = b[sortKey as keyof SalesRepPerformance] as number;
              return valueB - valueA; // 降順ソート
            });
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
  }, [router, compareMetric]);

  // 部署でフィルタリングされたデータを取得
  const getFilteredSalesReps = () => {
    if (selectedDepartment === 'all') {
      return salesReps;
    }
    
    return salesReps.filter(rep => rep.department_id === selectedDepartment);
  };

  // グラフ用のデータを準備
  const prepareChartData = (): ChartData[] => {
    let data = getFilteredSalesReps().map(rep => ({
      name: rep.name,
      受注金額: rep.wonAmount,
      商談中金額: rep.inProgressAmount,
      受注粗利: rep.totalProfit,
      商談中粗利: rep.inProgressProfit,
      受注件数: rep.wonDeals,
      商談中件数: rep.inProgressDeals
    }));

    return data;
  };

  // 金額表示用のフォーマッター
  const formatYAxis = (value: number): string => {
    if (value >= 1000000) {
      return `${Math.round(value / 1000000)}百万`;
    } else if (value >= 1000) {
      return `${Math.round(value / 1000)}千`;
    }
    return String(value);
  };

  // カスタムツールチップの実装
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

  // 現在の比較指標に応じたデータキーを取得
  const getDataKeys = () => {
    switch (compareMetric) {
      case '受注':
        return { 
          金額: '受注金額', 
          粗利: '受注粗利' 
        };
      case '商談中':
        return { 
          金額: '商談中金額', 
          粗利: '商談中粗利' 
        };
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">営業成績一覧</h1>
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
          <h1 className="text-3xl font-bold">営業成績一覧</h1>
          <div className="rounded-lg border bg-destructive/10 p-6 shadow-sm">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const chartData = prepareChartData();
  const { 金額, 粗利 } = getDataKeys();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">営業成績一覧</h1>
        </div>
        
        {/* コントロールパネル */}
        <div className="flex flex-wrap gap-4 p-4 rounded-lg border bg-card shadow-sm">
          <div className="space-y-1">
            <label className="text-sm font-medium">表示指標</label>
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setCompareMetric('受注')}
                className={`px-3 py-1.5 text-sm ${compareMetric === '受注' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
              >
                受注
              </button>
              <button
                onClick={() => setCompareMetric('商談中')}
                className={`px-3 py-1.5 text-sm ${compareMetric === '商談中' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
              >
                商談中
              </button>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium">部署選択</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-1.5 border rounded-md bg-background text-sm"
            >
              <option value="all">全ての部署</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {getFilteredSalesReps().length === 0 ? (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">表示するデータがありません</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">
                {selectedDepartment !== 'all' ? 
                  `${departments.find(d => d.id === selectedDepartment)?.name || ''} - ` : ''}
                {compareMetric === '受注' ? '受注状況比較' : '商談中状況比較'}
              </h2>
              <div className="h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 30, bottom: 100 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number"
                      tickFormatter={formatYAxis}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category"
                      width={120}
                      tick={{ fontSize: 14 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey={金額} fill="#0088FE" name={金額} barSize={20} />
                    <Bar dataKey={粗利} fill="#82ca9d" name={粗利} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* 担当者一覧テーブル */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">パフォーマンスデータ一覧</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-2 text-left border" rowSpan={2}>担当者名</th>
                      <th className="px-4 py-2 text-center border bg-blue-100" colSpan={2}>受注</th>
                      <th className="px-4 py-2 text-center border bg-green-100" colSpan={2}>商談中</th>
                      <th className="px-4 py-2 text-center border bg-amber-100" colSpan={2}>件数</th>
                    </tr>
                    <tr className="bg-muted/30">
                      <th className="px-4 py-2 text-right border bg-blue-50">金額</th>
                      <th className="px-4 py-2 text-right border bg-blue-50">粗利</th>
                      <th className="px-4 py-2 text-right border bg-green-50">金額</th>
                      <th className="px-4 py-2 text-right border bg-green-50">粗利</th>
                      <th className="px-4 py-2 text-right border bg-amber-50">受注</th>
                      <th className="px-4 py-2 text-right border bg-amber-50">商談中</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((rep, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <td className="px-4 py-2 border font-medium">{rep.name}</td>
                        <td className="px-4 py-2 text-right border bg-blue-50/50">{formatCurrency(rep.受注金額)}</td>
                        <td className="px-4 py-2 text-right border bg-blue-50/50">{formatCurrency(rep.受注粗利)}</td>
                        <td className="px-4 py-2 text-right border bg-green-50/50">{formatCurrency(rep.商談中金額)}</td>
                        <td className="px-4 py-2 text-right border bg-green-50/50">{formatCurrency(rep.商談中粗利)}</td>
                        <td className="px-4 py-2 text-right border bg-amber-50/50">{rep.受注件数}</td>
                        <td className="px-4 py-2 text-right border bg-amber-50/50">{rep.商談中件数}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
