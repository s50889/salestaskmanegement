import { supabase } from './client';
import { SalesRep } from '@/types';

// 営業担当者一覧を取得する関数
export const getAllSalesReps = async (): Promise<SalesRep[]> => {
  const { data, error } = await supabase
    .from('sales_reps')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching sales reps:', error);
    return [];
  }
  
  return data || [];
};

// 各営業担当者の実績情報を取得する関数
export const getSalesPerformance = async (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
  // 期間に基づいて日付範囲を計算
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  const startDateStr = startDate.toISOString();
  
  // 販売実績：各営業担当者の受注案件と合計金額
  const { data: salesData, error: salesError } = await supabase
    .from('deals')
    .select(`
      sales_rep_id,
      amount,
      status,
      created_at,
      updated_at
    `)
    .gte('updated_at', startDateStr);
  
  if (salesError) {
    console.error('Error fetching sales performance:', salesError);
    return null;
  }
  
  // 活動実績：各営業担当者の活動数
  const { data: activityData, error: activityError } = await supabase
    .from('activities')
    .select(`
      sales_rep_id,
      activity_type,
      date
    `)
    .gte('date', startDateStr);
  
  if (activityError) {
    console.error('Error fetching activity data:', activityError);
    return null;
  }
  
  // 営業担当者の情報を取得
  const { data: salesReps, error: salesRepsError } = await supabase
    .from('sales_reps')
    .select('*');
  
  if (salesRepsError) {
    console.error('Error fetching sales reps:', salesRepsError);
    return null;
  }
  
  // 営業担当者ごとの実績データを集計
  const performanceByRep = salesReps.map(rep => {
    // 担当者の案件データをフィルタリング
    const repDeals = salesData.filter(deal => deal.sales_rep_id === rep.id);
    
    // 受注案件のみをフィルタリング
    const wonDeals = repDeals.filter(deal => deal.status === 'won');
    
    // 合計受注金額を計算
    const totalAmount = wonDeals.reduce((sum, deal) => sum + deal.amount, 0);
    
    // 進行中の案件数
    const activeDealsCount = repDeals.filter(deal => 
      !['won', 'lost'].includes(deal.status)
    ).length;
    
    // 担当者の活動データをフィルタリング
    const repActivities = activityData.filter(activity => activity.sales_rep_id === rep.id);
    
    // 活動タイプごとの数をカウント
    const activityCounts = {
      visit: repActivities.filter(a => a.activity_type === 'visit').length,
      phone: repActivities.filter(a => a.activity_type === 'phone').length,
      email: repActivities.filter(a => a.activity_type === 'email').length,
      web_meeting: repActivities.filter(a => a.activity_type === 'web_meeting').length,
      other: repActivities.filter(a => a.activity_type === 'other').length,
      total: repActivities.length
    };
    
    return {
      sales_rep: rep,
      deals_total: repDeals.length,
      deals_won: wonDeals.length,
      deals_active: activeDealsCount,
      total_amount: totalAmount,
      activities: activityCounts
    };
  });
  
  return {
    period,
    start_date: startDateStr,
    end_date: now.toISOString(),
    performance_data: performanceByRep
  };
};

// 管理者権限を確認する関数
export const checkAdminAccess = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }
  
  // ユーザーのロールを確認
  const { data, error } = await supabase
    .from('sales_reps')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (error || !data) {
    return false;
  }
  
  // adminまたはmanagerロールを持つユーザーのみアクセス可能
  return ['admin', 'manager'].includes(data.role);
};
