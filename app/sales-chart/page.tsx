'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import { getUser } from '@/lib/supabase/client';
import { getSalesReps, getSalesRepPerformance, getDepartments } from '@/lib/supabase/api';
import { SalesRepPerformance, Department } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, TooltipProps
} from 'recharts';

// グラフの色設定
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#FF6B6B', '#C9CBA3', '#87BFFF', '#FFE156', '#DC8686', '#46CDCF', '#6B7AA1', '#725AC1', '#727D71'];

// グラフタイプの定義
type ChartType = '棒グラフ' | '円グラフ';
type MetricType = '受注金額' | '商談中金額' | '受注粗利益' | '商談中粗利益';
type CategoryType = '全て' | '機械工具' | '工事';

export default function SalesChartPage() {
  const router = useRouter();
  const [salesReps, setSalesReps] = useState<SalesRepPerformance[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('棒グラフ');
  const [metricType, setMetricType] = useState<MetricType>('受注金額');
  const [categoryType, setCategoryType] = useState<CategoryType>('全て');
  const [timeRange, setTimeRange] = useState<string>('全期間');

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
              const valueA = getMetricValue(a, metricType, categoryType);
              const valueB = getMetricValue(b, metricType, categoryType);
              return valueB - valueA; // 降順ソート
            });
            
            setSalesReps(sortedData);
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
  }, [router, metricType, categoryType]);

  // 部署でフィルタリングされたデータを取得
  const getFilteredSalesReps = () => {
    if (selectedDepartment !== 'all') {
      return salesReps.filter(rep => rep.department_id === selectedDepartment);
    }
    return salesReps;
  };

  // メトリクスと種別に基づいて値を取得する関数
  const getMetricValue = (rep: SalesRepPerformance, metric: MetricType, category: CategoryType): number => {
    switch (metric) {
      case '受注金額':
        return category === '機械工具' ? Number(rep.machineryWonAmount || 0) :
               category === '工事' ? Number(rep.constructionWonAmount || 0) :
               Number(rep.wonAmount || 0);
      case '商談中金額':
        return category === '機械工具' ? Number(rep.machineryInProgressAmount || 0) :
               category === '工事' ? Number(rep.constructionInProgressAmount || 0) :
               Number(rep.inProgressAmount || 0);
      case '受注粗利益':
        return category === '機械工具' ? Number(rep.machineryProfit || 0) :
               category === '工事' ? Number(rep.constructionProfit || 0) :
               Number(rep.totalProfit || 0);
      case '商談中粗利益':
        return category === '機械工具' ? Number(rep.machineryInProgressProfit || 0) :
               category === '工事' ? Number(rep.constructionInProgressProfit || 0) :
               Number(rep.inProgressProfit || 0);
      default:
        return 0;
    }
  };

  // チャートデータの準備
  const prepareChartData = () => {
    const filteredReps = getFilteredSalesReps();
    // 上位10人に制限
    return filteredReps.slice(0, 10).map(rep => ({
      name: rep.name,
      value: getMetricValue(rep, metricType, categoryType)
    }));
  };

  // カスタムツールチップの実装
  const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-bold">{payload[0].payload.name}</p>
          <p className="text-blue-600">{metricType}: {formatCurrency(payload[0].value)}円</p>
        </div>
      );
    }
    return null;
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

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">営業成績グラフ</h1>
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
          <h1 className="text-3xl font-bold">営業成績グラフ</h1>
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">営業成績グラフ</h1>
          <a 
            href="/performance" 
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            一覧表で見る
          </a>
        </div>
        
        {/* コントロールパネル */}
        <div className="flex flex-wrap gap-4 p-4 rounded-lg border bg-card shadow-sm">
          <div className="space-y-1">
            <label className="text-sm font-medium">グラフタイプ</label>
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setChartType('棒グラフ')}
                className={`px-3 py-1.5 text-sm ${chartType === '棒グラフ' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
              >
                棒グラフ
              </button>
              <button
                onClick={() => setChartType('円グラフ')}
                className={`px-3 py-1.5 text-sm ${chartType === '円グラフ' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
              >
                円グラフ
              </button>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium">メトリクス</label>
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setMetricType('受注金額')}
                className={`px-3 py-1.5 text-sm ${metricType === '受注金額' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
              >
                受注金額
              </button>
              <button
                onClick={() => setMetricType('商談中金額')}
                className={`px-3 py-1.5 text-sm ${metricType === '商談中金額' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
              >
                商談中金額
              </button>
              <button
                onClick={() => setMetricType('受注粗利益')}
                className={`px-3 py-1.5 text-sm ${metricType === '受注粗利益' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
              >
                受注粗利益
              </button>
              <button
                onClick={() => setMetricType('商談中粗利益')}
                className={`px-3 py-1.5 text-sm ${metricType === '商談中粗利益' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
              >
                商談中粗利益
              </button>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium">種別</label>
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setCategoryType('全て')}
                className={`px-3 py-1.5 text-sm ${categoryType === '全て' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
              >
                全て
              </button>
              <button
                onClick={() => setCategoryType('工事')}
                className={`px-3 py-1.5 text-sm ${categoryType === '工事' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
              >
                工事
              </button>
              <button
                onClick={() => setCategoryType('機械工具')}
                className={`px-3 py-1.5 text-sm ${categoryType === '機械工具' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
              >
                機械工具
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
                {categoryType === '全て' ? '' : `${categoryType}の`}{metricType}ランキング
                {selectedDepartment !== 'all' && ` - ${departments.find(d => d.id === selectedDepartment)?.name || ''}`}
              </h2>
              <div className="h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === '棒グラフ' && (
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 60, bottom: 100 }}
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
                        tick={{ fontSize: 12 }}
                        width={100}
                      />
                      <Tooltip formatter={(value: number) => formatCurrency(value) + '円'} />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        name={metricType} 
                        fill={COLORS[0]}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  )}
                  
                  {chartType === '円グラフ' && (
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
