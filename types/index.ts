export type Customer = {
  id: string;
  name: string;
  industry?: string;
  phone?: string;
  email?: string;
  address?: string;
  sales_rep_id: string;
  created_at: string;
  updated_at: string;
}

export type Department = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type Deal = {
  id: string;
  name: string;
  customer_id: string;
  status: 'negotiation' | 'proposal' | 'quotation' | 'won' | 'lost';
  amount: number;
  gross_profit: number;
  description: string;
  sales_rep_id: string;
  expected_close_date: string | null;
  // 古いフィールド（廃止予定）
  is_machinery?: boolean;
  is_construction?: boolean;
  // 新しいフィールド
  category: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  sales_rep?: SalesRep;
}

export type Activity = {
  id: string;
  description: string;
  customer_id: string;
  deal_id?: string;
  sales_rep_id: string;
  activity_type: string;
  date: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  deal?: Deal;
}

export type SalesRep = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'sales_rep' | 'manager' | 'admin';
  department_id?: string;
  created_at: string;
  updated_at: string;
  department?: Department;
}

export type CustomerWithDetails = Customer & {
  salesRep: SalesRep;
  deals: Deal[];
}

export type DealWithDetails = Deal & {
  customer: Customer;
  salesRep: SalesRep;
  activities: Activity[];
}

export type ActivityWithDetails = Activity & {
  customer: Customer;
  deal: Deal | null;
  salesRep: SalesRep;
}

// 営業担当者のパフォーマンスデータの型
export type SalesRepPerformance = {
  salesRepId: string;
  name: string;
  email: string;
  role: string;
  department_id?: string;  // 部署ID
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  inProgressDeals: number;
  wonAmount: number;
  inProgressAmount: number;
  totalProfit: number;
  inProgressProfit: number;
  activities: number;
  // 工事関連の実績
  constructionWonDeals?: number;
  constructionWonAmount?: number;
  constructionProfit?: number;
  // 機械工具関連の実績
  machineryWonDeals?: number;
  machineryWonAmount?: number;
  machineryProfit?: number;
  // 商談中の工事関連の実績
  constructionInProgressDeals?: number;
  constructionInProgressAmount?: number;
  constructionInProgressProfit?: number;
  // 商談中の機械工具関連の実績
  machineryInProgressDeals?: number;
  machineryInProgressAmount?: number;
  machineryInProgressProfit?: number;
};

// 部署のパフォーマンスデータの型
export type DepartmentPerformance = {
  departmentId: string;
  name: string;
  memberCount: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  inProgressDeals: number;
  wonAmount: number;
  inProgressAmount: number;
  totalProfit: number;
  inProgressProfit: number;
  activities: number;
};

// 部署グループの型
export type DepartmentGroup = {
  id: string;
  department_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// 営業担当者とグループの関連付けの型
export type SalesRepGroup = {
  id: string;
  sales_rep_id: string;
  department_group_id: string;
  created_at: string;
  updated_at: string;
}

// グループ情報を含む営業担当者の型
export type SalesRepWithGroup = SalesRep & {
  group?: DepartmentGroup;
}
