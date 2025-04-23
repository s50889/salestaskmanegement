'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import DealAmountChart from '@/components/dashboard/DealAmountChart';
import { getDashboardStats, getActivityTypeCounts, getRecentActivities, getSalesReps, getDealAmountStats, getDepartments } from '@/lib/supabase/api';
import { getUser } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { Department } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [activityCounts, setActivityCounts] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentSalesRepId, setCurrentSalesRepId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'personal' | 'department'>('all');
  const [dealAmountStats, setDealAmountStats] = useState<any>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);

  // 初期データのロード
  useEffect(() => {
    async function initializeDashboard() {
      try {
        setLoading(true);
        
        // ユーザー情報の取得
        const user = await getUser();
        if (!user) {
          // 未ログインの場合はログインページにリダイレクト
          router.push('/');
          return;
        }
        
        // 営業担当者の情報を取得して、現在のユーザーの営業担当者IDとロールを取得
        const reps = await getSalesReps();
        const currentRep = reps.find(rep => rep.user_id === user.id);
        
        if (!currentRep) {
          console.error('営業担当者情報が見つかりません');
          return;
        }
        
        // 現在のユーザーの営業担当者IDを保存
        setCurrentSalesRepId(currentRep.id);
        
        // マネージャー権限かどうかを確認
        const isAdminOrManager = currentRep.role === 'admin' || currentRep.role === 'manager';
        setIsAdmin(isAdminOrManager);

        // 部署データを取得
        if (isAdminOrManager) {
          const departmentsData = await getDepartments();
          setDepartments(departmentsData);
          // 現在のユーザーの部署IDをデフォルト選択
          if (currentRep.department_id) {
            setSelectedDepartmentId(currentRep.department_id);
          }
        }
      } catch (error) {
        console.error('初期化エラー:', error);
      } finally {
        setLoading(false);
      }
    }

    initializeDashboard();
  }, [router]);

  // データ取得処理
  useEffect(() => {
    // 初期化完了後のみデータを取得する
    if (currentSalesRepId !== null) {
      const fetchData = async () => {
        try {
          console.log(`データ取得開始: モード=${viewMode}, 部署ID=${selectedDepartmentId}`);
          setLoading(true);
          
          // 表示モードと権限に基づいて、データ取得時の営業担当者IDと部署IDを決定
          let salesRepIdFilter: string | undefined = undefined;
          let departmentIdFilter: string | undefined = undefined;
          
          if (viewMode === 'personal' && currentSalesRepId) {
            salesRepIdFilter = currentSalesRepId;
            departmentIdFilter = undefined;
          } else if (viewMode === 'department' && selectedDepartmentId) {
            salesRepIdFilter = undefined;
            departmentIdFilter = selectedDepartmentId;
          } else {
            salesRepIdFilter = undefined;
            departmentIdFilter = undefined;
          }
          
          console.log(`フィルタ: 営業担当者ID=${salesRepIdFilter}, 部署ID=${departmentIdFilter}`);
          
          // 各種データの取得を並列実行
          const [
            dashboardStats, 
            activityTypeData, 
            recentActivitiesData, 
            dealAmountStatsData
          ] = await Promise.all([
            getDashboardStats(salesRepIdFilter, departmentIdFilter),
            getActivityTypeCounts(departmentIdFilter),
            getRecentActivities(3, departmentIdFilter),
            getDealAmountStats(salesRepIdFilter, departmentIdFilter)
          ]);
          
          // 取得したデータを状態に設定
          setStats(dashboardStats);
          setActivityCounts(activityTypeData);
          setRecentActivities(recentActivitiesData);
          setDealAmountStats(dealAmountStatsData);
          
          console.log('データ取得完了', dashboardStats);
        } catch (error) {
          console.error('データ取得エラー:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [currentSalesRepId, viewMode, selectedDepartmentId]);

  // ダッシュボードデータを取得する関数（メソッド参照用に保存）
  const fetchDashboardData = async () => {
    try {
      console.log(`データ取得開始: モード=${viewMode}, 部署ID=${selectedDepartmentId}`);
      setLoading(true);
      
      // 表示モードと権限に基づいて、データ取得時の営業担当者IDと部署IDを決定
      let salesRepIdFilter: string | undefined = undefined;
      let departmentIdFilter: string | undefined = undefined;
      
      if (viewMode === 'personal' && currentSalesRepId) {
        salesRepIdFilter = currentSalesRepId;
        departmentIdFilter = undefined;
      } else if (viewMode === 'department' && selectedDepartmentId) {
        salesRepIdFilter = undefined;
        departmentIdFilter = selectedDepartmentId;
      } else {
        salesRepIdFilter = undefined;
        departmentIdFilter = undefined;
      }
      
      console.log(`フィルタ: 営業担当者ID=${salesRepIdFilter}, 部署ID=${departmentIdFilter}`);
      
      // 各種データの取得を並列実行
      const [
        dashboardStats, 
        activityTypeData, 
        recentActivitiesData, 
        dealAmountStatsData
      ] = await Promise.all([
        getDashboardStats(salesRepIdFilter, departmentIdFilter),
        getActivityTypeCounts(departmentIdFilter),
        getRecentActivities(3, departmentIdFilter),
        getDealAmountStats(salesRepIdFilter, departmentIdFilter)
      ]);
      
      // 取得したデータを状態に設定
      setStats(dashboardStats);
      setActivityCounts(activityTypeData);
      setRecentActivities(recentActivitiesData);
      setDealAmountStats(dealAmountStatsData);
      
      console.log('データ取得完了', dashboardStats);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // ステータスごとの案件数を取得
  const getStatusCount = (status: string) => {
    if (!stats || !stats.dealStatusCounts) return 0;
    
    // ステータスのマッピング
    const statusMapping: Record<string, string[]> = {
      'in_progress': ['negotiation', 'proposal', 'quotation', 'final_negotiation'],
      'won': ['won'],
      'lost': ['lost'],
      'on_hold': [] // 現在は使用していないが、将来的に追加する可能性がある
    };
    
    // 指定されたステータスグループに含まれるステータスの合計を計算
    if (statusMapping[status]) {
      return statusMapping[status].reduce((total, currentStatus) => {
        const statusItem = stats.dealStatusCounts.find((item: any) => item.status === currentStatus);
        return total + (statusItem ? statusItem.count : 0);
      }, 0);
    }
    
    // マッピングがない場合は直接検索
    const statusItem = stats.dealStatusCounts.find((item: any) => item.status === status);
    return statusItem ? statusItem.count : 0;
  };

  // 活動タイプごとの件数を取得
  const getActivityTypeCount = (type: string) => {
    if (!activityCounts) return 0;
    const activityItem = activityCounts.find((item: any) => item.type === type);
    return activityItem ? activityItem.count : 0;
  };

  // 活動タイプに応じたアイコンのスタイルを取得
  const getActivityTypeStyle = (type: string) => {
    const styles: Record<string, { bg: string, color: string }> = {
      'visit': { bg: 'bg-blue-100', color: 'bg-blue-500' },
      'phone': { bg: 'bg-amber-100', color: 'bg-amber-500' },
      'email': { bg: 'bg-green-100', color: 'bg-green-500' },
      'web_meeting': { bg: 'bg-purple-100', color: 'bg-purple-500' },
      'other': { bg: 'bg-gray-100', color: 'bg-gray-500' }
    };
    return styles[type] || styles.other;
  };

  // 活動タイプの日本語表示を取得
  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'visit': '訪問',
      'phone': '電話',
      'email': 'メール',
      'web_meeting': 'Web会議',
      'other': 'その他'
    };
    return labels[type] || type;
  };

  // 表示モードを変更するハンドラ
  const handleViewModeChange = (mode: 'all' | 'personal' | 'department') => {
    setViewMode(mode);
  };

  // 部署を選択するハンドラ
  const handleDepartmentChange = (departmentId: string | null) => {
    console.log(`部署選択: ${departmentId}`);
    setSelectedDepartmentId(departmentId);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          
          {isAdmin && (
            <div className="flex items-center space-x-4">
              <div className="flex border rounded-md overflow-hidden">
                <button
                  onClick={() => handleViewModeChange('all')}
                  className={`px-4 py-2 text-sm ${viewMode === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
                >
                  全体データ
                </button>
                <button
                  onClick={() => handleViewModeChange('personal')}
                  className={`px-4 py-2 text-sm ${viewMode === 'personal' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
                >
                  自分のデータのみ
                </button>
                <button
                  onClick={() => handleViewModeChange('department')}
                  className={`px-4 py-2 text-sm ${viewMode === 'department' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
                >
                  部署データ
                </button>
              </div>
              
              {viewMode === 'department' && (
                <select
                  value={selectedDepartmentId || ''}
                  onChange={(e) => handleDepartmentChange(e.target.value || null)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">全部署</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
        
        {loading && (
          <div className="text-center py-10">
            <p className="text-lg">データを読み込み中...</p>
          </div>
        )}
        
        {!loading && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* 案件サマリーカード */}
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-lg font-medium">案件サマリー</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1 rounded-md bg-primary/10 p-2">
                    <p className="text-sm text-muted-foreground">進行中</p>
                    <p className="text-2xl font-bold">{getStatusCount('in_progress')}</p>
                  </div>
                  <div className="space-y-1 rounded-md bg-green-100 p-2">
                    <p className="text-sm text-muted-foreground">受注</p>
                    <p className="text-2xl font-bold">{getStatusCount('won')}</p>
                  </div>
                  <div className="space-y-1 rounded-md bg-red-100 p-2">
                    <p className="text-sm text-muted-foreground">失注</p>
                    <p className="text-2xl font-bold">{getStatusCount('lost')}</p>
                  </div>
                  <div className="space-y-1 rounded-md bg-amber-100 p-2">
                    <p className="text-sm text-muted-foreground">保留中</p>
                    <p className="text-2xl font-bold">{getStatusCount('on_hold')}</p>
                  </div>
                </div>
              </div>
              
              {/* 活動サマリーカード */}
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-lg font-medium">活動サマリー</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 rounded-md bg-blue-100 p-2">
                      <p className="text-sm text-muted-foreground">訪問</p>
                      <p className="text-2xl font-bold">{getActivityTypeCount('visit')}</p>
                    </div>
                    <div className="space-y-1 rounded-md bg-amber-100 p-2">
                      <p className="text-sm text-muted-foreground">電話</p>
                      <p className="text-2xl font-bold">{getActivityTypeCount('phone')}</p>
                    </div>
                    <div className="space-y-1 rounded-md bg-green-100 p-2">
                      <p className="text-sm text-muted-foreground">メール</p>
                      <p className="text-2xl font-bold">{getActivityTypeCount('email')}</p>
                    </div>
                    <div className="space-y-1 rounded-md bg-purple-100 p-2">
                      <p className="text-sm text-muted-foreground">Web会議</p>
                      <p className="text-2xl font-bold">{getActivityTypeCount('web_meeting')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* グリッドの3カラム目の空きスペース */}
              <div className="hidden lg:block"></div>
            </div>
            
            {/* 案件金額グラフ */}
            <DealAmountChart dealAmountStats={dealAmountStats} />
            
            {/* 最近の活動 */}
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="mb-3 text-lg font-medium">最近の活動</h3>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity: any, index) => {
                    const style = getActivityTypeStyle(activity.activity_type);
                    return (
                      <div key={activity.id} className={`flex items-start gap-3 ${index < recentActivities.length - 1 ? 'border-b pb-3' : ''}`}>
                        <div className={`rounded-full ${style.bg} p-2`}>
                          <span className={`block h-2 w-2 rounded-full ${style.color}`}></span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {activity.customers?.name || '不明な顧客'}{' '}
                            {getActivityTypeLabel(activity.activity_type)}
                          </p>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(activity.date)} - {activity.sales_reps?.name || '不明な担当者'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">最近の活動はありません</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
