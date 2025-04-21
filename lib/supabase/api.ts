import { supabase } from './client';
import { Customer, Deal, Activity, SalesRep, SalesRepPerformance } from '@/types';

// 顧客関連の関数
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    // セッション情報を取得
    const { data: sessionData } = await supabase.auth.getSession();
    
    // 認証チェックを削除（すべてのユーザーがアクセスできるように）
    
    // 顧客データを取得
    const { data, error, status } = await supabase
      .from('customers')
      .select('*')
      .order('name');
    
    console.log('顧客データ取得ステータス:', status);
    
    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Caught error fetching customers:', error);
    // 開発環境でのデバッグ用
    if (process.env.NODE_ENV === 'development') {
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Auth status:', await supabase.auth.getSession());
    }
    // エラーが発生した場合は空の配列を返す
    return [];
  }
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching customer with id ${id}:`, error);
    return null;
  }
  
  return data;
};

export const createCustomer = async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .insert([customer])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating customer:', error);
    return null;
  }
  
  return data;
};

export const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating customer with id ${id}:`, error);
    return null;
  }
  
  return data;
};

export const deleteCustomer = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting customer with id ${id}:`, error);
    return false;
  }
  
  return true;
};

// 案件関連の関数
export const getDeals = async (): Promise<Deal[]> => {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching deals:', error);
    return [];
  }
  
  return data || [];
};

export const getDealById = async (id: string): Promise<Deal | null> => {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        customer:customer_id(*),
        sales_rep:sales_rep_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching deal with id ${id}:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching deal with id ${id}:`, error);
    return null;
  }
};

export const createDeal = async (deal: Omit<Deal, 'id' | 'created_at' | 'updated_at'>): Promise<Deal | null> => {
  const { data, error } = await supabase
    .from('deals')
    .insert([deal])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating deal:', error);
    return null;
  }
  
  return data;
};

export const updateDeal = async (id: string, updates: Partial<Deal>): Promise<Deal | null> => {
  const { data, error } = await supabase
    .from('deals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating deal with id ${id}:`, error);
    return null;
  }
  
  return data;
};

export const deleteDeal = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting deal with id ${id}:`, error);
    return false;
  }
  
  return true;
};

// 活動ログ関連の関数
export const getActivities = async (): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
  
  return data || [];
};

export const getActivitiesByCustomerId = async (customerId: string): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('customer_id', customerId)
    .order('date', { ascending: false });
  
  if (error) {
    console.error(`Error fetching activities for customer ${customerId}:`, error);
    return [];
  }
  
  return data || [];
};

export const getActivitiesByDealId = async (dealId: string): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('deal_id', dealId)
    .order('date', { ascending: false });
  
  if (error) {
    console.error(`Error fetching activities for deal ${dealId}:`, error);
    return [];
  }
  
  return data || [];
};

export const getActivityById = async (id: string): Promise<Activity | null> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching activity with id ${id}:`, error);
    return null;
  }
  
  return data;
};

export const createActivity = async (activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity | null> => {
  const { data, error } = await supabase
    .from('activities')
    .insert([activity])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating activity:', error);
    return null;
  }
  
  return data;
};

export const updateActivity = async (id: string, updates: Partial<Activity>): Promise<Activity | null> => {
  const { data, error } = await supabase
    .from('activities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating activity with id ${id}:`, error);
    return null;
  }
  
  return data;
};

export const deleteActivity = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting activity with id ${id}:`, error);
    return false;
  }
  
  return true;
};

// 活動タイプごとの集計を取得
export const getActivityTypeCounts = async () => {
  try {
    // 活動の集計を取得
    const { data, error } = await supabase
      .from('activities')
      .select('activity_type');
    
    if (error) {
      console.error('Error fetching activity types:', error);
      return null;
    }
    
    // 活動タイプごとにカウント
    const activityCounts = data ? 
      Object.entries(
        data.reduce((acc: Record<string, number>, activity) => {
          acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
          return acc;
        }, {})
      ).map(([type, count]) => ({ type, count })) : [];
    
    return activityCounts;
  } catch (error) {
    console.error('Error in getActivityTypeCounts:', error);
    return null;
  }
};

// 最近の活動を取得
export const getRecentActivities = async (limit = 3) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        customers (name),
        sales_reps (name)
      `)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getRecentActivities:', error);
    return [];
  }
};

// 営業担当者関連の関数
export const getSalesReps = async (): Promise<SalesRep[]> => {
  try {
    // セッション情報を取得
    const { data: sessionData } = await supabase.auth.getSession();
    
    // セッションチェックを削除（すべてのユーザーがアクセスできるように）
    const { data, error } = await supabase
      .from('sales_reps')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching sales reps:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Caught error fetching sales reps:', error);
    return [];
  }
};

export const getSalesRepById = async (id: string): Promise<SalesRep | null> => {
  const { data, error } = await supabase
    .from('sales_reps')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching sales rep with id ${id}:`, error);
    return null;
  }
  
  return data;
};

export const updateSalesRep = async (id: string, updates: Partial<SalesRep>): Promise<SalesRep | null> => {
  const { data, error } = await supabase
    .from('sales_reps')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating sales rep with id ${id}:`, error);
    return null;
  }
  
  return data;
};

export const updateSalesRepByUserId = async (userId: string, updates: Partial<SalesRep>): Promise<SalesRep | null> => {
  // まず、ユーザーIDに対応する営業担当者レコードを検索
  const { data: salesRep, error: findError } = await supabase
    .from('sales_reps')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (findError) {
    console.error(`Error finding sales rep with user_id ${userId}:`, findError);
    return null;
  }
  
  if (!salesRep) {
    console.error(`No sales rep found with user_id ${userId}`);
    return null;
  }
  
  // 見つかったレコードを更新
  const { data, error } = await supabase
    .from('sales_reps')
    .update(updates)
    .eq('id', salesRep.id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating sales rep with id ${salesRep.id}:`, error);
    return null;
  }
  
  return data;
};

// 営業担当者の権限を更新する関数
export const updateSalesRepRole = async (salesRepId: string, newRole: 'sales_rep' | 'manager' | 'admin'): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('sales_reps')
      .update({ role: newRole })
      .eq('id', salesRepId);
    
    if (error) {
      console.error('Error updating sales rep role:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateSalesRepRole:', error);
    return false;
  }
};

// 営業担当者のパフォーマンスデータを取得する関数
export const getSalesRepPerformance = async (salesRepId?: string): Promise<SalesRepPerformance[] | SalesRepPerformance | null> => {
  try {
    console.log('getSalesRepPerformance 呼び出し開始', salesRepId ? `ID: ${salesRepId}` : '全件取得');
    
    // 特定の営業担当者のみを取得する場合
    if (salesRepId) {
      // 営業担当者の基本情報を取得
      const { data: repData, error: repError } = await supabase
        .from('sales_reps')
        .select('*')
        .eq('id', salesRepId)
        .single();
      
      if (repError || !repData) {
        console.error('営業担当者の取得に失敗しました', repError);
        return null;
      }
      
      console.log('営業担当者情報:', repData);
      
      // 案件データの取得
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('id, status, amount, gross_profit')
        .eq('sales_rep_id', salesRepId);
      
      if (dealsError) {
        console.error('案件データの取得に失敗しました', dealsError);
        return null;
      }
      
      console.log('取得した案件データ:', dealsData);
      
      // 活動データの取得
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('id')
        .eq('sales_rep_id', salesRepId);
      
      if (activitiesError) {
        console.error('活動データの取得に失敗しました', activitiesError);
        return null;
      }
      
      // パフォーマンスデータの集計
      const totalDeals = dealsData.length;
      const wonDeals = dealsData.filter(deal => deal.status === 'won').length;
      const lostDeals = dealsData.filter(deal => deal.status === 'lost').length;
      const inProgressDeals = dealsData.filter(deal => deal.status === 'negotiation' || deal.status === 'in_progress').length;
      
      const wonAmount = dealsData
        .filter(deal => deal.status === 'won')
        .reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
      
      const inProgressAmount = dealsData
        .filter(deal => deal.status === 'negotiation' || deal.status === 'in_progress')
        .reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
      
      const totalProfit = dealsData
        .filter(deal => deal.status === 'won')
        .reduce((sum, deal) => sum + (Number(deal.gross_profit) || 0), 0);
      
      const inProgressProfit = dealsData
        .filter(deal => deal.status === 'negotiation' || deal.status === 'in_progress')
        .reduce((sum, deal) => sum + (Number(deal.gross_profit) || 0), 0);
      
      const activities = activitiesData.length;
      
      return {
        salesRepId: repData.id,
        name: repData.name,
        email: repData.email,
        role: repData.role,
        totalDeals,
        wonDeals,
        lostDeals,
        inProgressDeals,
        wonAmount,
        inProgressAmount,
        totalProfit,
        inProgressProfit,
        activities
      };
    } 
    // 全営業担当者のデータを取得する場合
    else {
      // 全営業担当者の基本情報を取得
      const { data: repsData, error: repsError } = await supabase
        .from('sales_reps')
        .select('*');
      
      if (repsError || !repsData) {
        console.log('営業担当者の取得に失敗しました');
        return [];
      }
      
      // 各営業担当者のパフォーマンスデータを取得
      const performanceData = await Promise.all(
        repsData.map(async (rep) => {
          // 案件データの取得
          const { data: dealsData, error: dealsError } = await supabase
            .from('deals')
            .select('id, status, amount, gross_profit')
            .eq('sales_rep_id', rep.id);
          
          if (dealsError) {
            console.log(`${rep.name}の案件データの取得に失敗しました`);
            return null;
          }
          
          // 活動データの取得
          const { data: activitiesData, error: activitiesError } = await supabase
            .from('activities')
            .select('id')
            .eq('sales_rep_id', rep.id);
          
          if (activitiesError) {
            console.log(`${rep.name}の活動データの取得に失敗しました`);
            return null;
          }
          
          // パフォーマンスデータの集計
          const totalDeals = dealsData.length;
          const wonDeals = dealsData.filter(deal => deal.status === 'won').length;
          const lostDeals = dealsData.filter(deal => deal.status === 'lost').length;
          const inProgressDeals = dealsData.filter(deal => deal.status === 'negotiation' || deal.status === 'in_progress').length;
          
          const wonAmount = dealsData
            .filter(deal => deal.status === 'won')
            .reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
          
          const inProgressAmount = dealsData
            .filter(deal => deal.status === 'negotiation' || deal.status === 'in_progress')
            .reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
          
          const totalProfit = dealsData
            .filter(deal => deal.status === 'won')
            .reduce((sum, deal) => sum + (Number(deal.gross_profit) || 0), 0);
          
          const inProgressProfit = dealsData
            .filter(deal => deal.status === 'negotiation' || deal.status === 'in_progress')
            .reduce((sum, deal) => sum + (Number(deal.gross_profit) || 0), 0);
          
          const activities = activitiesData.length;
          
          return {
            salesRepId: rep.id,
            name: rep.name,
            email: rep.email,
            role: rep.role,
            totalDeals,
            wonDeals,
            lostDeals,
            inProgressDeals,
            wonAmount,
            inProgressAmount,
            totalProfit,
            inProgressProfit,
            activities
          };
        })
      );
      
      // nullを除外して返す
      return performanceData.filter(data => data !== null);
    }
  } catch (error) {
    console.error('Error in getSalesRepPerformance:', error);
    return salesRepId ? null : [];
  }
};

// ダッシュボード用の集計関数
export const getDashboardStats = async () => {
  // 結果を格納するオブジェクト
  const result: {
    dealStatusCounts: { status: string; count: number }[];
    dealAmounts: { status: string; sum: number }[];
    customerCount: number;
    activeCustomerCount: number;
  } = {
    dealStatusCounts: [],
    dealAmounts: [],
    customerCount: 0,
    activeCustomerCount: 0
  };
  
  try {
    // 案件のステータス別集計
    const { data: dealStatusData } = await supabase
      .from('deals')
      .select('status');
    
    // ステータス別にカウント
    if (dealStatusData) {
      result.dealStatusCounts = Object.entries(
        dealStatusData.reduce((acc: Record<string, number>, deal) => {
          acc[deal.status] = (acc[deal.status] || 0) + 1;
          return acc;
        }, {})
      ).map(([status, count]) => ({ status, count }));
    }
  } catch (e) {
    console.log('案件ステータスの取得に失敗しました');
  }
  
  try {
    // 案件の総額集計
    const { data: dealAmountData } = await supabase
      .from('deals')
      .select('status, amount');
    
    // ステータス別に金額を集計
    if (dealAmountData) {
      result.dealAmounts = Object.entries(
        dealAmountData.reduce((acc: Record<string, number>, deal) => {
          acc[deal.status] = (acc[deal.status] || 0) + (Number(deal.amount) || 0);
          return acc;
        }, {})
      ).map(([status, sum]) => ({ status, sum }));
    }
  } catch (e) {
    console.log('案件金額の取得に失敗しました');
  }
  
  try {
    // 顧客数の集計
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (count !== null) {
      result.customerCount = count;
    }
  } catch (e) {
    console.log('顧客数の取得に失敗しました');
  }
  
  try {
    // 商談中の顧客数
    const { data: activeCustomers } = await supabase
      .from('deals')
      .select('customer_id')
      .neq('status', 'won')
      .neq('status', 'lost');
    
    if (activeCustomers) {
      // 重複を除いた商談中の顧客ID
      const activeCustomerIds = [...new Set(activeCustomers.map(deal => deal.customer_id))];
      result.activeCustomerCount = activeCustomerIds.length;
    }
  } catch (e) {
    console.log('商談中顧客数の取得に失敗しました');
  }
  
  return result;
};

// 案件金額の統計情報を取得
export const getDealAmountStats = async () => {
  // 進行中の案件用のデータ
  let inProgressDeals: { amount: number; gross_profit: number }[] = [];
  
  // 進行中の案件の合計金額と粗利を取得
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('amount, gross_profit')
      .neq('status', 'won')
      .neq('status', 'lost');
    
    if (!error && data) {
      inProgressDeals = data;
    }
  } catch (e) {
    console.log('進行中の案件データの取得に失敗しました');
  }
  
  // 受注済み案件用のデータ
  let wonDeals: { amount: number; gross_profit: number; updated_at: string | null }[] = [];
  
  // 受注済み案件の合計金額と粗利を取得
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('amount, gross_profit, updated_at')
      .eq('status', 'won');
    
    if (!error && data) {
      wonDeals = data;
    }
  } catch (e) {
    console.log('受注済み案件データの取得に失敗しました');
  }
  
  // 月別データの集計
  const monthlyData: Record<string, { amount: number; profit: number; count: number }> = {};
  
  // 現在の月を含む最近の6ヶ月分のエントリを作成
  const today = new Date();
  for (let i = 0; i < 6; i++) {
    const date = new Date(today);
    date.setMonth(today.getMonth() - i);
    const monthKey = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = { amount: 0, profit: 0, count: 0 };
  }
  
  // 受注済み案件を月別に集計
  wonDeals.forEach(deal => {
    if (!deal.updated_at) return;
    
    const date = new Date(deal.updated_at);
    const monthKey = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { amount: 0, profit: 0, count: 0 };
    }
    
    monthlyData[monthKey].amount += Number(deal.amount) || 0;
    monthlyData[monthKey].profit += Number(deal.gross_profit) || 0;
    monthlyData[monthKey].count += 1;
  });
  
  // 月別データを配列に変換
  const monthlyDataArray = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      amount: data.amount,
      profit: data.profit,
      count: data.count
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  // 進行中の案件の合計を計算
  const inProgressTotal = inProgressDeals.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
  const inProgressProfitTotal = inProgressDeals.reduce((sum, deal) => sum + (Number(deal.gross_profit) || 0), 0);
  
  // 受注済み案件の合計を計算
  const wonTotal = wonDeals.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
  const wonProfitTotal = wonDeals.reduce((sum, deal) => sum + (Number(deal.gross_profit) || 0), 0);
  
  return {
    inProgress: {
      total: inProgressTotal,
      profitTotal: inProgressProfitTotal,
      count: inProgressDeals.length
    },
    won: {
      total: wonTotal,
      profitTotal: wonProfitTotal,
      count: wonDeals.length
    },
    monthlyData: monthlyDataArray
  };
};

// 月名を取得する関数
function getMonthName(month: number): string {
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return monthNames[month - 1];
}

// 特定の営業担当者の活動ログを取得する関数
export const getSalesRepActivities = async (salesRepId: string): Promise<Activity[]> => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        customer:customer_id(*),
        deal:deal_id(*)
      `)
      .eq('sales_rep_id', salesRepId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('活動ログ取得エラー:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getSalesRepActivities:', error);
    return [];
  }
};

// 特定の営業担当者の案件を取得する関数
export const getSalesRepDeals = async (salesRepId: string): Promise<Deal[]> => {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        customer:customer_id(*)
      `)
      .eq('sales_rep_id', salesRepId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('案件取得エラー:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getSalesRepDeals:', error);
    return [];
  }
};
