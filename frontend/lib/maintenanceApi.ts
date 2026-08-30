import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/* =======================
   Types
======================= */

export interface MaintenanceRequest {
  id: string;
  apt_id: string;
  resident_name: string;
  phone?: string;
  issue_description: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  confirmed_at?: string;
  completed_at?: string;
  estimated_cost?: number;
  actual_cost?: number;
  notes?: string;
  assigned_to?: string;
  period?: string;
  created_by: string;
  updated_at: string;
}

export interface MaintenanceStats {
  total: number;
  pending: number;
  confirmed: number;
  in_progress: number;
  completed: number;
  total_estimated_cost: number;
  total_actual_cost: number;
}

export interface CreateMaintenanceRequest {
  apt_id: string;
  resident_name: string;
  phone?: string;
  issue_description: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateMaintenanceRequest {
  issue_description?: string;
  priority?: 'low' | 'medium' | 'high';
  phone?: string;
  status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  estimated_cost?: number;
  actual_cost?: number;
  notes?: string;
  assigned_to?: string;
}

export interface ConfirmMaintenanceRequest {
  estimated_cost?: number;
  notes?: string;
  assigned_to?: string;
}

export interface CompleteMaintenanceRequest {
  actual_cost?: number;
  notes?: string;
}

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
   Maintenance API Functions
======================= */

/**
 * Get all maintenance requests (filtered by role)
 */
export async function getAllMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  const response = await apiRequest<{
    success: boolean;
    data: MaintenanceRequest[];
    count: number;
  }>('/maintenance');
  return response.data;
}

/**
 * Get single maintenance request by ID
 */
export async function getMaintenanceRequestById(id: string): Promise<MaintenanceRequest> {
  const response = await apiRequest<{
    success: boolean;
    data: MaintenanceRequest;
  }>(`/maintenance/${id}`);
  return response.data;
}

/**
 * Create new maintenance request
 */
export async function createMaintenanceRequest(
  data: CreateMaintenanceRequest
): Promise<MaintenanceRequest> {
  const response = await apiRequest<{
    success: boolean;
    data: MaintenanceRequest;
    message: string;
  }>('/maintenance', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Update maintenance request
 */
export async function updateMaintenanceRequest(
  id: string,
  data: UpdateMaintenanceRequest
): Promise<MaintenanceRequest> {
  const response = await apiRequest<{
    success: boolean;
    data: MaintenanceRequest;
    message: string;
  }>(`/maintenance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Confirm maintenance request (admin/manager only)
 */
export async function confirmMaintenanceRequest(
  id: string,
  data: ConfirmMaintenanceRequest
): Promise<MaintenanceRequest> {
  const response = await apiRequest<{
    success: boolean;
    data: MaintenanceRequest;
    message: string;
  }>(`/maintenance/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Complete maintenance request (admin/manager only)
 */
export async function completeMaintenanceRequest(
  id: string,
  data: CompleteMaintenanceRequest
): Promise<MaintenanceRequest> {
  const response = await apiRequest<{
    success: boolean;
    data: MaintenanceRequest;
    message: string;
    revenue_updated: boolean;
  }>(`/maintenance/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Delete maintenance request (admin only)
 */
export async function deleteMaintenanceRequest(id: string): Promise<void> {
  await apiRequest<{
    success: boolean;
    message: string;
  }>(`/maintenance/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get maintenance statistics
 */
export async function getMaintenanceStatistics(): Promise<MaintenanceStats> {
  const response = await apiRequest<{
    success: boolean;
    data: MaintenanceStats;
  }>('/maintenance/stats/summary');
  return response.data;
}

/* =======================
   Helper Functions
======================= */

/**
 * Format cost to Vietnamese currency
 */
export function formatCost(cost?: number): string {
  if (!cost) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(cost);
}

/**
 * Get status label in Vietnamese
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    in_progress: 'Đang xử lý',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };
  return labels[status] || status;
}

/**
 * Get priority label in Vietnamese
 */
export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
  };
  return labels[priority] || priority;
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get priority color class
 */
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-orange-100 text-orange-800',
    high: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}
