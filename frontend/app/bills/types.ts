export interface Bill {
  id?: number
  apt_id: string
  owner: string
  electric: number
  water: number
  service: number
  vehicles: number
  pre_debt: number
  total: number
  period?: string
  paid?: boolean
  paid_at?: string
  status?: 'unpaid' | 'partial' | 'paid' | 'overdue'
  due_date?: string
  payment_method?: string
  notes?: string
  late_fee?: number
  discount?: number
  service_details?: any
  created_at?: string
  updated_at?: string
  last_reminder_sent?: string
  reminder_count?: number
}

export interface BillAnalytics {
  period: string
  total_bills: number
  paid_bills: number
  overdue_bills: number
  total_amount: number
  paid_amount: number
  overdue_amount: number
  avg_bill_amount: number
  total_late_fees: number
  total_discounts: number
}

export interface PaymentStats {
  total_bills: number
  paid_bills: number
  unpaid_bills: number
  overdue_bills: number
  total_amount: number
  paid_amount: number
  unpaid_amount: number
  overdue_amount: number
  payment_rate: number
}

export interface BillHistory {
  period: string
  total: number
  paid: boolean
  status: string
  due_date: string
  paid_at?: string
  late_fee: number
  discount: number
}
