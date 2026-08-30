import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

export const billsEnhancedAPI = {
  // Analytics
  getBillAnalytics: async () => {
    return apiRequest<any>('/bills/analytics');
  },

  getPaymentStats: async (period?: string) => {
    const query = period ? `?period=${period}` : '';
    return apiRequest<any>(`/bills/payment-stats${query}`);
  },

  getApartmentBillHistory: async (aptId: string) => {
    return apiRequest<any>(`/bills/apartment-history/${aptId}`);
  },

  getOverdueBills: async () => {
    return apiRequest<any>('/bills/overdue');
  },

  // Actions
  markBillAsPaid: async (aptId: string, period: string, paymentMethod?: string) => {
    return apiRequest<any>('/bills/mark-paid', {
      method: 'PATCH',
      body: JSON.stringify({ apt_id: aptId, period, payment_method: paymentMethod }),
    });
  },

  addLateFee: async (aptId: string, period: string, lateFee: number) => {
    return apiRequest<any>('/bills/add-late-fee', {
      method: 'PATCH',
      body: JSON.stringify({ apt_id: aptId, period, late_fee: lateFee }),
    });
  },

  applyDiscount: async (aptId: string, period: string, discount: number) => {
    return apiRequest<any>('/bills/apply-discount', {
      method: 'PATCH',
      body: JSON.stringify({ apt_id: aptId, period, discount }),
    });
  },

  sendReminder: async (aptId: string, period: string) => {
    return apiRequest<any>('/bills/send-reminder', {
      method: 'POST',
      body: JSON.stringify({ apt_id: aptId, period }),
    });
  },

  updateBillStatus: async (aptId: string, period: string, status: string) => {
    return apiRequest<any>('/bills/update-status', {
      method: 'PATCH',
      body: JSON.stringify({ apt_id: aptId, period, status }),
    });
  },
};
