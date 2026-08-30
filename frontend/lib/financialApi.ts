import { supabase } from './supabase';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/* =======================
   Helpers
======================= */

async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  if (!token) throw new Error('No authentication token available');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

/* =======================
   Types
======================= */

export interface IncomeByApartment {
  apt_id: string;
  owner_name?: string;
  total_paid: number;
}

export interface IncomeByFloor {
  floor: number | null;
  total_paid: number;
}

export interface FinancialByFloor {
  floor: number | null;
  display: string;
  total_paid: number;
  total_due_current: number;
  current_pre_debt: number;
  collection_rate: string;
}

export interface ApartmentFinancialSummary {
  apt_id: string;
  new_charges_current: number;
  pre_debt: number;
  total_due_current: number;
  total_paid_all_time: number;
  current_remaining_debt: number;
  payments: any[];
}

export interface BuildingFinancialSummary {
  total_income: number;
  total_due_current: number;
  total_pre_debt: number;
  apartments_in_debt: number;
  total_apartments: number;
  debt_ratio: string;
}

export interface IncomeByPeriod {
  period: string;
  total_income: number;
  total_charges?: number;
  total_debt?: number;
  payment_count: number;
  bill_count?: number;
}

export interface FeeBreakdown {
  electric: number;
  water: number;
  service: number;
  vehicles: number;
  total: number;
}

export interface PeriodComparison {
  period1: PeriodSummary;
  period2: PeriodSummary;
  comparison: {
    income_change: number;
    income_change_percent: string;
    charges_change: number;
    debt_change: number;
  };
}

export interface PeriodSummary {
  period: string;
  total_income: number;
  total_charges: number;
  total_debt: number;
  collection_rate: string;
  bill_count: number;
  payment_count: number;
}

export interface CollectionRate {
  period: string;
  collection_rate: number;
  total_income: number;
  total_charges: number;
}

// Module 3.1: Quản lý doanh thu
export interface RevenueGrowth {
  period: string;
  total_income: number;
  growth_rate: number;
  previous_income: number;
}

export interface RevenueByFeeType {
  period?: string;
  total_revenue: number;
  breakdown: {
    type: string;
    name: string;
    total: number;
    percentage: number;
    apartment_count: number;
  }[];
  details: any;
}

export interface RevenueByFloorOrArea {
  period?: string;
  group_by: string;
  total_revenue: number;
  groups: {
    group: string | number;
    total_revenue: number;
    electric: number;
    water: number;
    service: number;
    vehicles: number;
    apartment_count: number;
    percentage: number;
    average_per_apartment: number;
  }[];
}

// Module 3.2: Kiểm soát nợ đọng
export interface UnpaidApartment {
  apt_id: string;
  period: string;
  owner_name: string;
  floor: number;
  area?: string;
  phone?: string;
  total_bill: number;
  paid_amount: number;
  unpaid_amount: number;
  pre_debt: number;
  electric: number;
  water: number;
  service: number;
  vehicles: number;
  payment_status: string;
}

export interface TotalOutstandingDebt {
  total_outstanding_debt: number;
  total_pre_debt: number;
  apartments_with_debt: number;
  debt_by_period: {
    period: string;
    total_debt: number;
    apartment_count: number;
  }[];
}

export interface DebtPaymentHistory {
  apt_id: string;
  current_debt: number;
  history: {
    period: string;
    billed: number;
    pre_debt: number;
    paid: number;
    balance: number;
    payment_count: number;
    payments: any[];
    status: string;
  }[];
}

// Module 3.3: Báo cáo quyết toán
export interface SettlementReport {
  period: string;
  generated_at: string;
  summary: PeriodSummary & {
    fee_breakdown: FeeBreakdown;
  };
  by_floor: FinancialByFloor[];
  apartments: {
    apt_id: string;
    owner_name: string;
    floor: number;
    phone?: string;
    electric: number;
    water: number;
    service: number;
    vehicles: number;
    pre_debt: number;
    total_bill: number;
    total_paid: number;
    balance: number;
    status: string;
  }[];
  statistics: {
    total_apartments: number;
    paid_apartments: number;
    partial_paid: number;
    unpaid_apartments: number;
    total_outstanding: number;
  };
}

/* =======================
   Financial API
======================= */

export const financialAPI = {
  /** GET /api/payments/income-by-apartment */
  getIncomeByApartment: async (params?: {
    page?: number;
    page_size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.append('page', params.page.toString());
    if (params?.page_size)
      qs.append('page_size', params.page_size.toString());

    return apiRequest<{
      data: IncomeByApartment[];
    }>(`/payments/income-by-apartment${qs.toString() ? `?${qs}` : ''}`);
  },

  /** GET /api/payments/income-by-floor */
  getIncomeByFloor: async () => {
    return apiRequest<{
      data: IncomeByFloor[];
    }>('/payments/income-by-floor');
  },

  /** GET /api/payments/financial-by-floor */
  getFinancialByFloor: async () => {
    return apiRequest<{
      data: FinancialByFloor[];
    }>('/payments/financial-by-floor');
  },

  /** GET /api/payments/debt-apartments */
  getApartmentsInDebt: async (params?: {
    page?: number;
    page_size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.append('page', params.page.toString());
    if (params?.page_size)
      qs.append('page_size', params.page_size.toString());

    return apiRequest<{
      data: ApartmentFinancialSummary[];
    }>(`/payments/debt-apartments${qs.toString() ? `?${qs}` : ''}`);
  },

  /** GET /api/payments/apartments/:apt_id/financial-summary */
  getApartmentFinancialSummary: async (aptId: string) => {
    return apiRequest<{
      data: ApartmentFinancialSummary;
    }>(`/payments/apartments/${aptId}/financial-summary`);
  },

  /** GET /api/payments/building-summary */
  getBuildingFinancialSummary: async () => {
    return apiRequest<{
      data: BuildingFinancialSummary;
    }>('/payments/building-summary');
  },

  /** GET /api/payments/income-by-period */
  getIncomeByPeriod: async (startPeriod: string, endPeriod: string) => {
    return apiRequest<{
      data: IncomeByPeriod[];
    }>(`/payments/income-by-period?start_period=${startPeriod}&end_period=${endPeriod}`);
  },

  /** GET /api/payments/fee-breakdown */
  getFeeBreakdown: async (period?: string) => {
    const url = period 
      ? `/payments/fee-breakdown?period=${period}`
      : '/payments/fee-breakdown';
    return apiRequest<{
      data: FeeBreakdown;
    }>(url);
  },

  /** GET /api/payments/compare-periods */
  comparePeriodsFinancial: async (period1: string, period2: string) => {
    return apiRequest<{
      data: PeriodComparison;
    }>(`/payments/compare-periods?period1=${period1}&period2=${period2}`);
  },

  /** GET /api/payments/collection-rate */
  getCollectionRateByPeriod: async (startPeriod: string, endPeriod: string) => {
    return apiRequest<{
      data: CollectionRate[];
    }>(`/payments/collection-rate?start_period=${startPeriod}&end_period=${endPeriod}`);
  },

  /** GET /api/payments/period-summary/:period */
  getPeriodSummary: async (period: string) => {
    return apiRequest<{
      data: PeriodSummary;
    }>(`/payments/period-summary/${period}`);
  },

  // ==== MODULE 3.1: QUẢN LÝ DOANH THU ====

  /** GET /api/payments/revenue/growth */
  getRevenueGrowth: async (startPeriod: string, endPeriod: string) => {
    return apiRequest<{
      data: RevenueGrowth[];
    }>(`/payments/revenue/growth?start_period=${startPeriod}&end_period=${endPeriod}`);
  },

  /** GET /api/payments/revenue/by-fee-type */
  getRevenueByFeeType: async (period?: string) => {
    const url = period
      ? `/payments/revenue/by-fee-type?period=${period}`
      : '/payments/revenue/by-fee-type';
    return apiRequest<{
      data: RevenueByFeeType;
    }>(url);
  },

  /** GET /api/payments/revenue/by-floor-area */
  getRevenueByFloorOrArea: async (period?: string, groupBy: 'floor' | 'area' = 'floor') => {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    params.append('group_by', groupBy);
    
    return apiRequest<{
      data: RevenueByFloorOrArea;
    }>(`/payments/revenue/by-floor-area?${params.toString()}`);
  },

  // ==== MODULE 3.2: KIỂM SOÁT NỢ ĐỌNG ====

  /** GET /api/payments/debt/unpaid-apartments */
  getUnpaidApartments: async (filters?: {
    period?: string;
    floor?: number;
    min_debt?: number;
    max_debt?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    offset?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.floor) params.append('floor', filters.floor.toString());
    if (filters?.min_debt !== undefined) params.append('min_debt', filters.min_debt.toString());
    if (filters?.max_debt !== undefined) params.append('max_debt', filters.max_debt.toString());
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);
    if (filters?.offset !== undefined) params.append('offset', filters.offset.toString());
    if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());

    return apiRequest<{
      data: UnpaidApartment[];
      total: number;
      summary: {
        total_unpaid_apartments: number;
        total_unpaid_amount: number;
        total_pre_debt: number;
      };
    }>(`/payments/debt/unpaid-apartments?${params.toString()}`);
  },

  /** GET /api/payments/debt/total-outstanding */
  getTotalOutstandingDebt: async () => {
    return apiRequest<{
      data: TotalOutstandingDebt;
    }>('/payments/debt/total-outstanding');
  },

  /** GET /api/payments/debt/payment-history/:apt_id */
  getDebtPaymentHistory: async (aptId: string) => {
    return apiRequest<{
      data: DebtPaymentHistory;
    }>(`/payments/debt/payment-history/${aptId}`);
  },

  // ==== MODULE 3.3: BÁO CÁO QUYẾT TOÁN ====

  /** GET /api/payments/settlement/:period */
  getMonthlySettlementReport: async (period: string) => {
    return apiRequest<{
      data: SettlementReport;
    }>(`/payments/settlement/${period}`);
  },
};
