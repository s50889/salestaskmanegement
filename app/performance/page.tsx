'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import { getUser } from '@/lib/supabase/client';
import { getSalesReps, getSalesRepPerformance, getDepartments, getDepartmentGroups, getSalesRepGroup } from '@/lib/supabase/api';
import { SalesRepPerformance, Department, DepartmentGroup } from '@/types';
import { formatCurrency } from '@/lib/utils';

// グラフの色設定
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#FF6B6B', '#C9CBA3', '#87BFFF', '#FFE156', '#DC8686', '#46CDCF', '#6B7AA1', '#725AC1', '#727D71'];

// 第一営業部のID
const FIRST_DEPARTMENT_ID = 'cc22f892-b2e1-425d-8472-385bacbc9da8';

// グラフデータの型定義
type ChartData = {
  name: string;
  total: number;
  totalProfit: number;
  machinery: number;
  machineryProfit: number;
  construction: number;
  constructionProfit: number;
};

// 受注タブ用のデータを準備
type WonChartData = {
  name: string;
  wonTotal: number; // 受注合計金額
  wonProfit: number; // 受注合計粗利
  wonMachinery: number; // 機械工具受注金額
  wonMachineryProfit: number; // 機械工具受注粗利
  wonConstruction: number; // 工事受注金額
  wonConstructionProfit: number; // 工事受注粗利
};

// 商談中タブ用のデータを準備
type InProgressChartData = {
  name: string;
  inProgressTotal: number; // 商談中合計金額
  inProgressProfit: number; // 商談中合計粗利
  inProgressMachinery: number; // 商談中機械工具金額
  inProgressMachineryProfit: number; // 商談中機械工具粗利
  inProgressConstruction: number; // 商談中工事金額
  inProgressConstructionProfit: number; // 商談中工事粗利
};

// グループID情報を含む拡張された営業担当者パフォーマンス型
interface SalesRepPerformanceWithGroup extends SalesRepPerformance {
  groupId: string | null;
}

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
  const [departmentGroups, setDepartmentGroups] = useState<DepartmentGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [salesRepGroups, setSalesRepGroups] = useState<SalesRepPerformanceWithGroup[]>([]);
  const [chartData, setChartData] = useState<WonChartData[] | InProgressChartData[]>([]);

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
        
        // 部署グループ一覧を取得
        const departmentGroupsData = await getDepartmentGroups();
        setDepartmentGroups(departmentGroupsData);
        
        // 現在のユーザーが管理者かどうかを確認
        const currentRep = reps.find(rep => rep.user_id === user.id);
        setIsAdmin(currentRep?.role === 'admin' || currentRep?.role === 'manager');
        
        if (currentRep?.role === 'admin' || currentRep?.role === 'manager') {
          // 管理者またはマネージャーの場合、全営業担当者のパフォーマンスを取得
          const performanceData = await getSalesRepPerformance();
          console.log('API取得データ:', performanceData);
          
          if (performanceData && Array.isArray(performanceData)) {
            // データの詳細をログ出力
            performanceData.forEach(rep => {
              console.log(`営業担当者: ${rep.name}, 機械工具案件数: ${rep.machineryWonDeals}, 工事案件数: ${rep.constructionWonDeals}`);
            });
            
            // 金額順にソート
            const sortedData = [...performanceData].sort((a, b) => {
              const sortKey = compareMetric === '受注' ? 'wonAmount' : 
                             compareMetric === '商談中' ? 'inProgressAmount' : 'wonDeals';
              const valueA = a[sortKey as keyof SalesRepPerformance] as number;
              const valueB = b[sortKey as keyof SalesRepPerformance] as number;
              return valueB - valueA; // 降順ソート
            });
            
            // デバッグ用：営業担当者の実績データを確認
            console.log('営業担当者の実績データ:', performanceData);
            console.log('機械工具・工事データ例:', performanceData.length > 0 ? {
              name: performanceData[0].name,
              machineryWonDeals: performanceData[0].machineryWonDeals,
              constructionWonDeals: performanceData[0].constructionWonDeals
            } : 'データなし');
            
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

  // 営業担当者のグループデータを取得
  useEffect(() => {
    async function fetchGroupData() {
      try {
        if (selectedDepartment === FIRST_DEPARTMENT_ID) {
          // 第一営業部のグループ一覧を取得
          const groupsData = await getDepartmentGroups(FIRST_DEPARTMENT_ID);
          setDepartmentGroups(groupsData);
          
          // 営業担当者のグループ割り当て情報を取得
          const repsWithGroups = await Promise.all(
            salesReps
              .filter(rep => rep.department_id === FIRST_DEPARTMENT_ID)
              .map(async (rep) => {
                const groupInfo = await getSalesRepGroup(rep.salesRepId);
                return {
                  ...rep,
                  groupId: groupInfo ? groupInfo.department_group_id : null
                };
              })
          );
          
          setSalesRepGroups(repsWithGroups);
        } else {
          setDepartmentGroups([]);
          setSelectedGroup('all');
        }
      } catch (error) {
        console.error('グループデータ取得エラー:', error);
      }
    }
    
    fetchGroupData();
  }, [selectedDepartment, salesReps]);

  // 部署でフィルタリングされたデータを取得
  const getFilteredSalesReps = () => {
    let filteredReps = salesReps;
    
    // 部署フィルター
    if (selectedDepartment !== 'all') {
      filteredReps = filteredReps.filter(rep => rep.department_id === selectedDepartment);
    }
    
    // 第一営業部かつグループフィルターが選択されている場合
    if (selectedDepartment === FIRST_DEPARTMENT_ID && selectedGroup !== 'all') {
      // 営業担当者とグループの紐付け情報を使用してフィルタリング
      const repIdsInGroup = salesRepGroups
        .filter(rep => rep.groupId === selectedGroup)
        .map(rep => rep.salesRepId);
      
      filteredReps = filteredReps.filter(rep => repIdsInGroup.includes(rep.salesRepId));
    }
    
    return filteredReps;
  };

  // 種別サマリーの表示コンポーネント
  const CategorySummary = ({ salesReps }: { salesReps: SalesRepPerformance[] }) => {
    const summary = calculateCategorySummary(salesReps);
    
    if (!summary) return null;
    
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-bold mb-3">種別別集計</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 合計の集計 */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="font-bold text-gray-700 mb-2">合計</h4>
            <div className="grid grid-cols-2 gap-2">
              {compareMetric === '受注' ? (
                <>
                  <div>
                    <p className="text-gray-600">受注件数:</p>
                    <p className="font-bold">{summary.totalWonDeals}件</p>
                  </div>
                  <div>
                    <p className="text-gray-600">受注金額:</p>
                    <p className="font-bold">{summary.totalWonAmount.toLocaleString()}円</p>
                  </div>
                  <div>
                    <p className="text-gray-600">粗利益:</p>
                    <p className="font-bold">{summary.totalProfit.toLocaleString()}円</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-gray-600">商談中件数:</p>
                    <p className="font-bold">{summary.totalInProgressDeals}件</p>
                  </div>
                  <div>
                    <p className="text-gray-600">商談中金額:</p>
                    <p className="font-bold">{summary.totalInProgressAmount.toLocaleString()}円</p>
                  </div>
                  <div>
                    <p className="text-gray-600">粗利益(推定):</p>
                    <p className="font-bold">{summary.totalInProgressProfit.toLocaleString()}円</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 工事の集計 */}
          <div className="border rounded-lg p-3">
            <h4 className="font-bold text-green-600 mb-2">工事</h4>
            <div className="grid grid-cols-2 gap-2">
              {compareMetric === '受注' ? (
                <>
                  <div>
                    <p className="text-gray-600">受注件数:</p>
                    <p className="font-bold">{summary.constructionWonDeals}件</p>
                  </div>
                  <div>
                    <p className="text-gray-600">受注金額:</p>
                    <p className="font-bold">{summary.constructionWonAmount.toLocaleString()}円</p>
                  </div>
                  <div>
                    <p className="text-gray-600">粗利益:</p>
                    <p className="font-bold">{summary.constructionProfit.toLocaleString()}円</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-gray-600">商談中件数:</p>
                    <p className="font-bold">{summary.constructionInProgressDeals}件</p>
                  </div>
                  <div>
                    <p className="text-gray-600">商談中金額:</p>
                    <p className="font-bold">{summary.constructionInProgressAmount.toLocaleString()}円</p>
                  </div>
                  <div>
                    <p className="text-gray-600">粗利益(推定):</p>
                    <p className="font-bold">{summary.constructionInProgressProfit.toLocaleString()}円</p>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* 機械工具の集計 */}
          <div className="border rounded-lg p-3">
            <h4 className="font-bold text-blue-600 mb-2">機械工具</h4>
            <div className="grid grid-cols-2 gap-2">
              {compareMetric === '受注' ? (
                <>
                  <div>
                    <p className="text-gray-600">受注件数:</p>
                    <p className="font-bold">{summary.machineryWonDeals}件</p>
                  </div>
                  <div>
                    <p className="text-gray-600">受注金額:</p>
                    <p className="font-bold">{summary.machineryWonAmount.toLocaleString()}円</p>
                  </div>
                  <div>
                    <p className="text-gray-600">粗利益:</p>
                    <p className="font-bold">{summary.machineryProfit.toLocaleString()}円</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-gray-600">商談中件数:</p>
                    <p className="font-bold">{summary.machineryInProgressDeals}件</p>
                  </div>
                  <div>
                    <p className="text-gray-600">商談中金額:</p>
                    <p className="font-bold">{summary.machineryInProgressAmount.toLocaleString()}円</p>
                  </div>
                  <div>
                    <p className="text-gray-600">粗利益(推定):</p>
                    <p className="font-bold">{summary.machineryInProgressProfit.toLocaleString()}円</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 種別サマリーの計算
  const calculateCategorySummary = (reps: SalesRepPerformance[]) => {
    if (!reps || reps.length === 0) return null;
    
    const summary = {
      // 機械工具
      machineryWonDeals: 0,
      machineryWonAmount: 0,
      machineryProfit: 0,
      machineryInProgressDeals: 0,
      machineryInProgressAmount: 0,
      machineryInProgressProfit: 0,
      // 工事
      constructionWonDeals: 0,
      constructionWonAmount: 0,
      constructionProfit: 0,
      constructionInProgressDeals: 0,
      constructionInProgressAmount: 0,
      constructionInProgressProfit: 0,
      // 全体
      totalWonDeals: 0,
      totalWonAmount: 0,
      totalProfit: 0,
      totalInProgressDeals: 0,
      totalInProgressAmount: 0,
      totalInProgressProfit: 0,
    };
    
    // 各営業担当者のデータを集計
    reps.forEach(rep => {
      // 受注済みデータ
      summary.machineryWonDeals += Number(rep.machineryWonDeals || 0);
      summary.machineryWonAmount += Number(rep.machineryWonAmount || 0);
      summary.machineryProfit += Number(rep.machineryProfit || 0);
      
      summary.constructionWonDeals += Number(rep.constructionWonDeals || 0);
      summary.constructionWonAmount += Number(rep.constructionWonAmount || 0);
      summary.constructionProfit += Number(rep.constructionProfit || 0);
      
      summary.totalWonDeals += Number(rep.wonDeals || 0);
      summary.totalWonAmount += Number(rep.wonAmount || 0);
      summary.totalProfit += Number(rep.totalProfit || 0);
      
      // 商談中データ
      summary.totalInProgressDeals += Number(rep.inProgressDeals || 0);
      summary.totalInProgressAmount += Number(rep.inProgressAmount || 0);
      summary.totalInProgressProfit += Number(rep.inProgressProfit || 0);
      
      // カテゴリ別の商談中データを集計
      summary.machineryInProgressDeals += Number(rep.machineryInProgressDeals || 0);
      summary.machineryInProgressAmount += Number(rep.machineryInProgressAmount || 0);
      summary.machineryInProgressProfit += Number(rep.machineryInProgressProfit || 0);
      summary.constructionInProgressDeals += Number(rep.constructionInProgressDeals || 0);
      summary.constructionInProgressAmount += Number(rep.constructionInProgressAmount || 0);
      summary.constructionInProgressProfit += Number(rep.constructionInProgressProfit || 0);
    });
    
    return summary;
  };

  // 受注タブ用データを準備
  const prepareWonChartData = (): WonChartData[] => {
    let data = getFilteredSalesReps().map(rep => {
      return {
        name: rep.name,
        wonTotal: Number(rep.wonAmount) || 0,
        wonProfit: Number(rep.totalProfit) || 0,
        wonMachinery: Number(rep.machineryWonAmount) || 0,
        wonMachineryProfit: Number(rep.machineryProfit) || 0,
        wonConstruction: Number(rep.constructionWonAmount) || 0,
        wonConstructionProfit: Number(rep.constructionProfit) || 0
      };
    });
    
    // 金額の降順でソート
    return data.sort((a, b) => b.wonTotal - a.wonTotal);
  };
  
  // 商談中タブ用データを準備
  const prepareInProgressChartData = (): InProgressChartData[] => {
    try {
      // 全てのデータが有効であることを確認
      let data = getFilteredSalesReps()
        .filter(rep => rep && rep.name) // 名前が存在するデータのみを処理
        .map(rep => {
          // 確実に数値型になるよう処理し、無効な値を0にする
          const inProgressTotal = rep.inProgressAmount ? parseFloat(rep.inProgressAmount.toString()) : 0;
          const inProgressProfit = rep.inProgressProfit ? parseFloat(rep.inProgressProfit.toString()) : 0;
          const inProgressMachinery = rep.machineryInProgressAmount ? parseFloat(rep.machineryInProgressAmount.toString()) : 0;
          const inProgressMachineryProfit = rep.machineryInProgressProfit ? parseFloat(rep.machineryInProgressProfit.toString()) : 0;
          const inProgressConstruction = rep.constructionInProgressAmount ? parseFloat(rep.constructionInProgressAmount.toString()) : 0;
          const inProgressConstructionProfit = rep.constructionInProgressProfit ? parseFloat(rep.constructionInProgressProfit.toString()) : 0;
          
          // NaNのチェックと置換
          const validateNumber = (val: number): number => isNaN(val) ? 0 : val;

          const repData = {
            name: rep.name,
            inProgressTotal: validateNumber(inProgressTotal),
            inProgressProfit: validateNumber(inProgressProfit),
            inProgressMachinery: validateNumber(inProgressMachinery),
            inProgressMachineryProfit: validateNumber(inProgressMachineryProfit),
            inProgressConstruction: validateNumber(inProgressConstruction),
            inProgressConstructionProfit: validateNumber(inProgressConstructionProfit),
          };
          
          return repData;
        });
      
      // 空配列の場合はダミーデータを提供（グラフエラー回避用）
      if (data.length === 0) {
        return [{
          name: 'データなし',
          inProgressTotal: 0,
          inProgressProfit: 0,
          inProgressMachinery: 0,
          inProgressMachineryProfit: 0,
          inProgressConstruction: 0,
          inProgressConstructionProfit: 0,
        }];
      }
      
      // 金額の降順でソート
      return data.sort((a, b) => b.inProgressTotal - a.inProgressTotal);
    } catch (error) {
      console.error('商談中データの準備中にエラー:', error);
      return [{
        name: 'エラー',
        inProgressTotal: 0,
        inProgressProfit: 0,
        inProgressMachinery: 0,
        inProgressMachineryProfit: 0,
        inProgressConstruction: 0,
        inProgressConstructionProfit: 0,
      }];
    }
  };

  useEffect(() => {
    // 表示指標が変わったときにチャートデータを更新
    const newChartData = compareMetric === '受注' ? prepareWonChartData() : prepareInProgressChartData();
    console.log('チャートデータ更新:', compareMetric, newChartData.slice(0, 3));
    // データ構造の詳細をログ出力
    if (newChartData.length > 0) {
      console.log('データ構造詳細:', JSON.stringify(newChartData[0]));
    }
    setChartData(newChartData);
  }, [compareMetric, selectedDepartment, selectedGroup]);

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
      const data = payload[0].payload;
      
      if (compareMetric === '受注') {
        return (
          <div className="bg-white p-3 border rounded shadow">
            <p className="font-bold">{label}</p>
            <p className="text-blue-600">受注合計: {formatCurrency(data.wonTotal)}円</p>
            <p className="text-blue-600">粗利合計: {formatCurrency(data.wonProfit)}円</p>
            <p className="text-green-600">機械工具金額: {formatCurrency(data.wonMachinery)}円</p>
            <p className="text-green-600">機械工具粗利: {formatCurrency(data.wonMachineryProfit)}円</p>
            <p className="text-yellow-600">工事金額: {formatCurrency(data.wonConstruction)}円</p>
            <p className="text-yellow-600">工事粗利: {formatCurrency(data.wonConstructionProfit)}円</p>
          </div>
        );
      } else {
        return (
          <div className="bg-white p-3 border rounded shadow">
            <p className="font-bold">{label}</p>
            <p className="text-blue-600">商談中合計: {formatCurrency(data.inProgressTotal)}円</p>
            <p className="text-blue-600">商談中粗利合計: {formatCurrency(data.inProgressProfit)}円</p>
            <p className="text-green-600">機械工具金額: {formatCurrency(data.inProgressMachinery)}円</p>
            <p className="text-green-600">機械工具粗利: {formatCurrency(data.inProgressMachineryProfit)}円</p>
            <p className="text-yellow-600">工事金額: {formatCurrency(data.inProgressConstruction)}円</p>
            <p className="text-yellow-600">工事粗利: {formatCurrency(data.inProgressConstructionProfit)}円</p>
          </div>
        );
      }
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

  const { 金額, 粗利 } = getDataKeys();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">営業成績一覧</h1>
          <a 
            href="/sales-chart" 
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            グラフで見る
          </a>
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
          
          {selectedDepartment === FIRST_DEPARTMENT_ID && (
            <div className="space-y-1">
              <label className="text-sm font-medium">部署グループ選択</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-3 py-1.5 border rounded-md bg-background text-sm"
              >
                <option value="all">全ての部署グループ</option>
                {departmentGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {getFilteredSalesReps().length === 0 ? (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">表示するデータがありません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 担当者一覧テーブル */}
            <div className="p-4">
              <div className="rounded-lg border bg-card p-6 shadow-sm mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    パフォーマンスデータ一覧
                    {compareMetric === '受注' && <span className="ml-2 text-blue-600">（受注状況）</span>}
                    {compareMetric === '商談中' && <span className="ml-2 text-green-600">（商談状況）</span>}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-center border bg-purple-50">順位</th>
                        <th className="px-4 py-2 border">名前</th>
                        {compareMetric === '受注' ? (
                          <>
                            <th className="px-4 py-2 text-right border bg-blue-50">受注金額</th>
                            <th className="px-4 py-2 text-right border bg-blue-100">粗利金額</th>
                            <th className="px-4 py-2 text-right border bg-yellow-50">工事金額</th>
                            <th className="px-4 py-2 text-right border bg-yellow-100">工事粗利</th>
                            <th className="px-4 py-2 text-right border bg-green-50">機械工具金額</th>
                            <th className="px-4 py-2 text-right border bg-green-100">機械工具粗利</th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-2 text-right border bg-blue-50">商談中金額合計</th>
                            <th className="px-4 py-2 text-right border bg-blue-100">商談中粗利合計</th>
                            <th className="px-4 py-2 text-right border bg-yellow-50">工事金額</th>
                            <th className="px-4 py-2 text-right border bg-yellow-100">工事粗利</th>
                            <th className="px-4 py-2 text-right border bg-green-50">機械工具金額</th>
                            <th className="px-4 py-2 text-right border bg-green-100">機械工具粗利</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {compareMetric === '受注' ? (
                        // 受注タブのデータ表示
                        prepareWonChartData().map((rep, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                            <td className="px-4 py-2 text-center border bg-purple-50/50 font-bold">{index + 1}</td>
                            <td className="px-4 py-2 border font-medium">{rep.name}</td>
                            <td className="px-4 py-2 text-right border bg-blue-50/50">
                              {formatCurrency(rep.wonTotal)}
                            </td>
                            <td className="px-4 py-2 text-right border bg-blue-100/50">
                              {formatCurrency(rep.wonProfit)}
                            </td>
                            <td className="px-4 py-2 text-right border bg-yellow-50/50">
                              {formatCurrency(rep.wonConstruction)}
                            </td>
                            <td className="px-4 py-2 text-right border bg-yellow-100/50">
                              {formatCurrency(rep.wonConstructionProfit)}
                            </td>
                            <td className="px-4 py-2 text-right border bg-green-50/50">
                              {formatCurrency(rep.wonMachinery)}
                            </td>
                            <td className="px-4 py-2 text-right border bg-green-100/50">
                              {formatCurrency(rep.wonMachineryProfit)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        // 商談中タブのデータ表示
                        prepareInProgressChartData().map((rep, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                            <td className="px-4 py-2 text-center border bg-purple-50/50 font-bold">{index + 1}</td>
                            <td className="px-4 py-2 border font-medium">{rep.name}</td>
                            <td className="px-4 py-2 text-right border bg-blue-50/50">
                              {formatCurrency(rep.inProgressTotal)}
                            </td>
                            <td className="px-4 py-2 text-right border bg-blue-100/50">
                              {formatCurrency(rep.inProgressProfit)}
                            </td>
                            <td className="px-4 py-2 text-right border bg-yellow-50/50">
                              {formatCurrency(rep.inProgressConstruction)}
                            </td>
                            <td className="px-4 py-2 text-right border bg-yellow-100/50">
                              {formatCurrency(rep.inProgressConstructionProfit)}
                            </td>
                            <td className="px-4 py-2 text-right border bg-green-50/50">
                              {formatCurrency(rep.inProgressMachinery)}
                            </td>
                            <td className="px-4 py-2 text-right border bg-green-100/50">
                              {formatCurrency(rep.inProgressMachineryProfit)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <CategorySummary salesReps={getFilteredSalesReps()} />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
