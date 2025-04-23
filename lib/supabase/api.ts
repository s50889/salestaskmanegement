import { supabase } from './client';
import { Customer, Deal, Activity, SalesRep, SalesRepPerformance, Department, DepartmentPerformance } from '@/types';

// 顧客関連の関数
export const getCustomers = async (getAllForAdmin = false): Promise<Customer[]> => {
  try {
    // セッション情報を取得
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      return [];
    }
    
    const currentUserId = sessionData.session.user.id;
    
    // 現在のユーザーに関連する営業担当者情報を取得
    const { data: salesRepData, error: salesRepError } = await supabase
      .from('sales_reps')
      .select('*')
      .eq('user_id', currentUserId)
      .single();
    
    if (salesRepError) {
      console.error('営業担当者情報の取得に失敗:', salesRepError);
      return [];
    }
    
    // 管理者かマネージャーの場合、getAllForAdminがtrueなら全ての顧客を返す
    const isAdminOrManager = salesRepData.role === 'admin' || salesRepData.role === 'manager';
    
    let query = supabase.from('customers').select('*');
    
    // 管理者でない場合、または管理者でもgetAllForAdminがfalseの場合は、
    // 自分が担当していてる顧客のみを返す
    if (!isAdminOrManager || !getAllForAdmin) {
      query = query.eq('sales_rep_id', salesRepData.id);
    }
    
    const { data, error, status } = await query.order('name');
    
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
    .select(`
      *,
      customer:customer_id(*),
      sales_rep:sales_rep_id(*)
    `)
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
export const getActivities = async (getAllForAdmin = false): Promise<Activity[]> => {
  try {
    // セッション情報を取得
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      return [];
    }
    
    const currentUserId = sessionData.session.user.id;
    
    // 現在のユーザーに関連する営業担当者情報を取得
    const { data: salesRepData, error: salesRepError } = await supabase
      .from('sales_reps')
      .select('*')
      .eq('user_id', currentUserId)
      .single();
    
    if (salesRepError) {
      console.error('営業担当者情報の取得に失敗:', salesRepError);
      return [];
    }
    
    // 管理者かマネージャーの場合、getAllForAdminがtrueなら全活動を取得
    const isAdminOrManager = salesRepData.role === 'admin' || salesRepData.role === 'manager';
    
    // 詳細情報付きで活動を取得するクエリを構築
    let query = supabase
      .from('activities')
      .select(`
        *,
        customers (
          id,
          name
        ),
        sales_reps (
          id, 
          name,
          email
        ),
        deals (
          id,
          name,
          status
        )
      `);
    
    // 管理者でない場合、または管理者でもgetAllForAdminがfalseの場合は、
    // 自分が担当していてる活動のみを返す
    if (!isAdminOrManager || !getAllForAdmin) {
      query = query.eq('sales_rep_id', salesRepData.id);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) {
      console.error('活動ログの取得に失敗:', error);
      return [];
    }
    
    // 活動タイプを日本語に変換
    const result = data?.map(activity => ({
      ...activity,
      activity_type_ja: getActivityTypeLabel(activity.activity_type)
    })) || [];
    
    return result;
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
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
export const getActivityTypeCounts = async (departmentId?: string): Promise<{ type: string; count: number }[] | null> => {
  console.log(`getActivityTypeCounts 呼び出し: departmentId=${departmentId}`);
  
  try {
    // 部署に営業担当者がいるかチェック
    if (departmentId) {
      const { data: salesReps } = await supabase
        .from('sales_reps')
        .select('id')
        .eq('department_id', departmentId);
      
      if (!salesReps || salesReps.length === 0) {
        console.log(`部署 ${departmentId} に営業担当者がいません。空の活動タイプカウントを返します。`);
        // すべての活動タイプのカウントを0で返す
        return [
          { type: 'visit', count: 0 },
          { type: 'phone', count: 0 },
          { type: 'email', count: 0 },
          { type: 'web_meeting', count: 0 },
          { type: 'other', count: 0 }
        ];
      }
    }
    
    let query = supabase.from('activities').select('activity_type');
    
    // 部署でフィルター
    if (departmentId) {
      // 部署に所属する営業担当者のIDを取得
      const { data: salesReps } = await supabase
        .from('sales_reps')
        .select('id')
        .eq('department_id', departmentId);
      
      if (salesReps && salesReps.length > 0) {
        const salesRepIds = salesReps.map(rep => rep.id);
        query = query.in('sales_rep_id', salesRepIds);
      }
    }
    
    const { data, error } = await query;
    
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
export const getRecentActivities = async (limit = 3, departmentId?: string): Promise<Activity[]> => {
  console.log(`getRecentActivities 呼び出し: limit=${limit}, departmentId=${departmentId}`);
  
  try {
    // 部署に営業担当者がいるかチェック
    if (departmentId) {
      const { data: salesReps } = await supabase
        .from('sales_reps')
        .select('id')
        .eq('department_id', departmentId);
      
      if (!salesReps || salesReps.length === 0) {
        console.log(`部署 ${departmentId} に営業担当者がいません。空の活動リストを返します。`);
        return []; // 空の配列を返す
      }
    }
    
    let query = supabase
      .from('activities')
      .select(`
        *,
        customers (name),
        sales_reps (name)
      `)
      .order('date', { ascending: false })
      .limit(limit);
    
    // 部署でフィルター
    if (departmentId) {
      // 部署に所属する営業担当者のIDを取得
      const { data: salesReps } = await supabase
        .from('sales_reps')
        .select('id')
        .eq('department_id', departmentId);
      
      if (salesReps && salesReps.length > 0) {
        const salesRepIds = salesReps.map(rep => rep.id);
        query = query.in('sales_rep_id', salesRepIds);
      }
    }
    
    const { data, error } = await query;
    
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
      const inProgressDeals = dealsData.filter(deal => deal.status === 'negotiation' || deal.status === 'quotation').length;
      
      const wonAmount = dealsData
        .filter(deal => deal.status === 'won')
        .reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
      
      const inProgressAmount = dealsData
        .filter(deal => deal.status === 'negotiation' || deal.status === 'quotation')
        .reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
      
      const totalProfit = dealsData
        .filter(deal => deal.status === 'won')
        .reduce((sum, deal) => sum + (Number(deal.gross_profit) || 0), 0);
      
      const inProgressProfit = dealsData
        .filter(deal => deal.status === 'negotiation' || deal.status === 'quotation')
        .reduce((sum, deal) => sum + (Number(deal.gross_profit) || 0), 0);
      
      const activities = activitiesData.length;
      
      return {
        salesRepId: repData.id,
        name: repData.name,
        email: repData.email,
        role: repData.role,
        department_id: repData.department_id,
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
          const inProgressDeals = dealsData.filter(deal => deal.status === 'negotiation' || deal.status === 'quotation').length;
          
          const wonAmount = dealsData
            .filter(deal => deal.status === 'won')
            .reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
          
          const inProgressAmount = dealsData
            .filter(deal => deal.status === 'negotiation' || deal.status === 'quotation')
            .reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
          
          const totalProfit = dealsData
            .filter(deal => deal.status === 'won')
            .reduce((sum, deal) => sum + (Number(deal.gross_profit) || 0), 0);
          
          const inProgressProfit = dealsData
            .filter(deal => deal.status === 'negotiation' || deal.status === 'quotation')
            .reduce((sum, deal) => sum + (Number(deal.gross_profit) || 0), 0);
          
          const activities = activitiesData.length;
          
          return {
            salesRepId: rep.id,
            name: rep.name,
            email: rep.email,
            role: rep.role,
            department_id: rep.department_id,
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
export const getDashboardStats = async (salesRepId?: string, departmentId?: string) => {
  console.log(`getDashboardStats 呼び出し: salesRepId=${salesRepId}, departmentId=${departmentId}`);
  
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
  
  // 部署に営業担当者がいるかチェック
  if (departmentId) {
    const { data: salesReps } = await supabase
      .from('sales_reps')
      .select('id')
      .eq('department_id', departmentId);
    
    if (!salesReps || salesReps.length === 0) {
      console.log(`部署 ${departmentId} に営業担当者がいません。空のデータを返します。`);
      return result; // 空のデータを返す
    }
  }
  
  try {
    // 案件のステータス別集計のクエリを構築
    let query = supabase.from('deals').select('status, amount');
    
    // 営業担当者でフィルター
    if (salesRepId) {
      query = query.eq('sales_rep_id', salesRepId);
    }
    
    // 部署でフィルター
    if (departmentId) {
      // 部署に所属する営業担当者のIDを取得
      const { data: salesReps } = await supabase
        .from('sales_reps')
        .select('id')
        .eq('department_id', departmentId);
      
      if (salesReps && salesReps.length > 0) {
        const salesRepIds = salesReps.map(rep => rep.id);
        query = query.in('sales_rep_id', salesRepIds);
      }
    }
    
    // クエリを実行
    const { data: dealStatusData } = await query;
    
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
export const getDealAmountStats = async (salesRepId?: string, departmentId?: string) => {
  console.log(`getDealAmountStats 呼び出し: salesRepId=${salesRepId}, departmentId=${departmentId}`);
  
  // 進行中の案件用のデータ
  let inProgressDeals: { amount: number; gross_profit: number }[] = [];
  
  // 進行中の案件の合計金額と粗利を取得
  try {
    // クエリを構築
    let query = supabase
      .from('deals')
      .select('amount, gross_profit')
      .neq('status', 'won')
      .neq('status', 'lost');
    
    // 営業担当者でフィルター
    if (salesRepId) {
      query = query.eq('sales_rep_id', salesRepId);
    }
    
    // 部署でフィルター
    if (departmentId) {
      // 部署に所属する営業担当者のIDを取得
      const { data: salesReps } = await supabase
        .from('sales_reps')
        .select('id')
        .eq('department_id', departmentId);
      
      if (salesReps && salesReps.length > 0) {
        const salesRepIds = salesReps.map(rep => rep.id);
        query = query.in('sales_rep_id', salesRepIds);
      } else {
        // 部署に営業担当者がいない場合は空の結果を返す
        console.log(`部署 ${departmentId} に営業担当者がいません`);
        inProgressDeals = [];
        // 早期リターン
        return {
          inProgress: { total: 0, profitTotal: 0, count: 0 },
          won: { total: 0, profitTotal: 0, count: 0 },
          monthlyData: []
        };
      }
    }
    
    // クエリを実行
    const { data, error } = await query;
    
    if (!error && data) {
      inProgressDeals = data;
    }
  } catch (e) {
    console.log('進行中の案件データの取得に失敗しました', e);
  }
  
  // 受注済み案件用のデータ
  let wonDeals: { amount: number; gross_profit: number; updated_at: string | null }[] = [];
  
  // 受注済み案件の合計金額と粗利を取得
  try {
    // クエリを構築
    let query = supabase
      .from('deals')
      .select('amount, gross_profit, updated_at')
      .eq('status', 'won');
      
    // 営業担当者でフィルター
    if (salesRepId) {
      query = query.eq('sales_rep_id', salesRepId);
    }
    
    // 部署でフィルター
    if (departmentId) {
      // 部署に所属する営業担当者のIDを取得
      const { data: salesReps } = await supabase
        .from('sales_reps')
        .select('id')
        .eq('department_id', departmentId);
      
      if (salesReps && salesReps.length > 0) {
        const salesRepIds = salesReps.map(rep => rep.id);
        query = query.in('sales_rep_id', salesRepIds);
      } else {
        // 部署に営業担当者がいない場合は空の結果を返す
        wonDeals = [];
        // ここでは早期リターンしない（上でリターンしている場合があるため）
      }
    }
    
    // クエリを実行
    const { data, error } = await query;
    
    if (!error && data) {
      wonDeals = data;
    }
  } catch (e) {
    console.log('受注済み案件データの取得に失敗しました', e);
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

// 部署関連の関数
export const getDepartments = async (): Promise<Department[]> => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('部署データの取得に失敗しました:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('部署データ取得エラー:', error);
    return [];
  }
};

export const getDepartmentById = async (id: string): Promise<Department | null> => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`部署IDが ${id} のデータ取得に失敗しました:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`部署IDが ${id} のデータ取得エラー:`, error);
    return null;
  }
};

export const getSalesRepsByDepartment = async (departmentId: string): Promise<SalesRep[]> => {
  try {
    const { data, error } = await supabase
      .from('sales_reps')
      .select('*')
      .eq('department_id', departmentId);
    
    if (error) {
      console.error('部署別営業担当者データの取得に失敗しました:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('部署別営業担当者データ取得エラー:', error);
    return [];
  }
};

// 部署のパフォーマンスデータを取得する関数
export const getDepartmentPerformance = async (): Promise<DepartmentPerformance[]> => {
  try {
    // 部署データを取得
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*');
    
    if (deptError || !departments) {
      console.error('部署データの取得に失敗しました:', deptError);
      return [];
    }
    
    // 各部署のパフォーマンスデータを取得
    const performanceData: DepartmentPerformance[] = await Promise.all(
      departments.map(async (dept) => {
        // 部署に所属する営業担当者を取得
        const { data: salesReps, error: repError } = await supabase
          .from('sales_reps')
          .select('id')
          .eq('department_id', dept.id);
        
        if (repError || !salesReps || salesReps.length === 0) {
          // 部署に所属する営業担当者がいない場合は空のデータを返す
          return {
            departmentId: dept.id,
            name: dept.name,
            memberCount: 0,
            totalDeals: 0,
            wonDeals: 0,
            lostDeals: 0,
            inProgressDeals: 0,
            wonAmount: 0,
            inProgressAmount: 0,
            totalProfit: 0,
            inProgressProfit: 0,
            activities: 0
          };
        }
        
        // 営業担当者のIDリスト
        const salesRepIds = salesReps.map(rep => rep.id);
        
        // 部署の案件データを取得
        const { data: deals, error: dealError } = await supabase
          .from('deals')
          .select('id, status, amount, gross_profit')
          .in('sales_rep_id', salesRepIds);
        
        // 部署の活動データを取得
        const { data: activities, error: activityError } = await supabase
          .from('activities')
          .select('id')
          .in('sales_rep_id', salesRepIds);
        
        if (dealError || !deals) {
          console.error('部署の案件データ取得に失敗しました:', dealError);
        }
        
        if (activityError || !activities) {
          console.error('部署の活動データ取得に失敗しました:', activityError);
        }
        
        // パフォーマンスデータを集計
        const dealsData = deals || [];
        const activitiesData = activities || [];
        
        const totalDeals = dealsData.length;
        const wonDeals = dealsData.filter(deal => deal.status === 'won').length;
        const lostDeals = dealsData.filter(deal => deal.status === 'lost').length;
        const inProgressDeals = dealsData.filter(deal => deal.status === 'negotiation' || deal.status === 'quotation').length;
        
        const wonAmount = dealsData
          .filter(deal => deal.status === 'won')
          .reduce((sum, deal) => sum + Number(deal.amount), 0);
        
        const inProgressAmount = dealsData
          .filter(deal => deal.status === 'negotiation' || deal.status === 'quotation')
          .reduce((sum, deal) => sum + Number(deal.amount), 0);
        
        const totalProfit = dealsData
          .filter(deal => deal.status === 'won')
          .reduce((sum, deal) => sum + Number(deal.gross_profit || 0), 0);
        
        const inProgressProfit = dealsData
          .filter(deal => deal.status === 'negotiation' || deal.status === 'quotation')
          .reduce((sum, deal) => sum + Number(deal.gross_profit || 0), 0);
        
        return {
          departmentId: dept.id,
          name: dept.name,
          memberCount: salesReps.length,
          totalDeals,
          wonDeals,
          lostDeals,
          inProgressDeals,
          wonAmount,
          inProgressAmount,
          totalProfit,
          inProgressProfit,
          activities: activitiesData.length
        };
      })
    );
    
    return performanceData;
  } catch (error) {
    console.error('部署パフォーマンスデータ取得エラー:', error);
    return [];
  }
};

// 営業担当者の部署を更新する関数
export const updateSalesRepDepartment = async (salesRepId: string, departmentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('sales_reps')
      .update({ department_id: departmentId })
      .eq('id', salesRepId);
    
    if (error) {
      console.error('営業担当者の部署更新に失敗しました:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('営業担当者の部署更新エラー:', error);
    return false;
  }
};

// ユーザー管理関連の関数
export const deleteUser = async (salesRepId: string): Promise<boolean> => {
  try {
    // SQLファンクションを実行してユーザーとその関連データをすべて削除
    const { data, error } = await supabase.rpc('delete_sales_rep', {
      sales_rep_id: salesRepId
    });
    
    if (error) {
      console.error('ユーザー削除エラー:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    return false;
  }
};

// 営業担当者の詳細情報（部署情報含む）を取得
export const getSalesRepWithDepartment = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('sales_reps')
      .select('*, departments(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('営業担当者データ取得エラー:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('営業担当者データ取得エラー:', error);
    return null;
  }
};

// ユーザーIDから営業担当者情報を取得する関数
export const getSalesRepByUserId = async (userId: string): Promise<SalesRep | null> => {
  try {
    const { data, error } = await supabase
      .from('sales_reps')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error(`ユーザーID ${userId} の営業担当者情報取得に失敗:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`ユーザーID ${userId} の営業担当者情報取得エラー:`, error);
    return null;
  }
};

// 全活動ログを詳細情報付きで取得する関数（管理者用）
export const getAllActivitiesWithDetails = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        customers (
          id,
          name
        ),
        sales_reps (
          id, 
          name,
          email
        ),
        deals (
          id,
          name,
          status
        )
      `)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('全活動ログの取得に失敗しました:', error);
      return [];
    }
    
    // 活動タイプを日本語に変換
    const result = data?.map(activity => ({
      ...activity,
      activity_type_ja: getActivityTypeLabel(activity.activity_type)
    })) || [];
    
    return result;
  } catch (e) {
    console.error('活動ログ取得中にエラーが発生しました:', e);
    return [];
  }
};

// 活動タイプの日本語表示を取得する関数
export const getActivityTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'visit': '訪問',
    'phone': '電話',
    'email': 'メール',
    'web_meeting': 'Web会議',
    'other': 'その他'
  };
  return labels[type] || type;
};
