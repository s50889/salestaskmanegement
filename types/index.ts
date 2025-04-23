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
  amount: string | number;
  status: 'won' | 'lost' | 'negotiation' | 'quotation';
  description: string;
  sales_rep_id: string;
  expected_close_date: string | null;
  created_at: string;
  updated_at: string;
  gross_profit: string | number;
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
