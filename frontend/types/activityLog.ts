// Activity Log Types

export interface ActivityLog {
  id: string;
  user_id: string | null;
  username: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  status: 'success' | 'failure' | 'warning';
  created_at: string;
}

export interface ActivityLogFilters {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  resourceType?: string;
  status?: 'success' | 'failure' | 'warning';
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ActivityLogResponse {
  logs: ActivityLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ActivityStats {
  total: number;
  byAction: Record<string, number>;
  byResourceType: Record<string, number>;
  byStatus: {
    success: number;
    failure: number;
    warning: number;
  };
  recentActivity: ActivityLog[];
}

// Common action types for type safety
export type ActivityAction = 
  // Authentication
  | 'login'
  | 'logout'
  | 'register'
  | 'password_change'
  | 'password_reset'
  // User Management
  | 'user_create'
  | 'user_update'
  | 'user_delete'
  | 'user_view'
  | 'role_change'
  // Apartment Management
  | 'apartment_create'
  | 'apartment_update'
  | 'apartment_delete'
  | 'apartment_view'
  // Bills
  | 'bill_create'
  | 'bill_update'
  | 'bill_delete'
  | 'bill_view'
  | 'bill_pay'
  // Vehicles
  | 'vehicle_create'
  | 'vehicle_update'
  | 'vehicle_delete'
  | 'vehicle_view'
  | 'vehicle_request'
  // Visitors
  | 'visitor_create'
  | 'visitor_update'
  | 'visitor_delete'
  | 'visitor_view'
  | 'visitor_checkin'
  | 'visitor_checkout'
  // Access Cards
  | 'card_create'
  | 'card_update'
  | 'card_delete'
  | 'card_view'
  | 'card_activate'
  | 'card_deactivate'
  // Payments
  | 'payment_create'
  | 'payment_update'
  | 'payment_view'
  | 'payment_approve'
  | 'payment_reject';

export type ResourceType = 
  | 'users'
  | 'apartments'
  | 'bills'
  | 'vehicles'
  | 'visitors'
  | 'access-cards'
  | 'payments'
  | 'maintenance'
  | 'building';
