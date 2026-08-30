import { ActivityLog, ActivityLogFilters, ActivityLogResponse, ActivityStats } from "@/types/activityLog";
import { supabase } from "@/lib/supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Get authentication headers with token from Supabase
 */
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || null;
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

/**
 * Get all activity logs (Admin/Manager only)
 */
export const getActivityLogs = async (
  filters: ActivityLogFilters = {}
): Promise<ActivityLogResponse> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value.toString());
    }
  });

  const response = await fetch(
    `${API_BASE_URL}/activity-logs?${queryParams.toString()}`,
    {
      method: "GET",
      headers: await getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch activity logs (${response.status})`);
  }

  return response.json();
};

/**
 * Get current user's activity logs
 */
export const getMyActivityLogs = async (
  filters: Omit<ActivityLogFilters, 'userId'> = {}
): Promise<ActivityLogResponse> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value.toString());
    }
  });

  const response = await fetch(
    `${API_BASE_URL}/activity-logs/me?${queryParams.toString()}`,
    {
      method: "GET",
      headers: await getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch your activity logs (${response.status})`);
  }

  return response.json();
};

/**
 * Get activity log by ID
 */
export const getActivityLogById = async (id: string): Promise<ActivityLog> => {
  const response = await fetch(
    `${API_BASE_URL}/activity-logs/${id}`,
    {
      method: "GET",
      headers: await getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch activity log");
  }

  return response.json();
};

/**
 * Get activity statistics (Admin/Manager only)
 */
export const getActivityStats = async (
  startDate?: string,
  endDate?: string
): Promise<ActivityStats> => {
  const queryParams = new URLSearchParams();
  
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);

  const response = await fetch(
    `${API_BASE_URL}/activity-logs/stats?${queryParams.toString()}`,
    {
      method: "GET",
      headers: await getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch activity statistics");
  }

  return response.json();
};

/**
 * Create a new activity log entry
 */
export const createActivityLog = async (logData: {
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: any;
  status?: string;
}): Promise<ActivityLog> => {
  const response = await fetch(`${API_BASE_URL}/activity-logs`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(logData),
  });

  if (!response.ok) {
    throw new Error("Failed to create activity log");
  }

  return response.json();
};

/**
 * Delete old activity logs (Admin only)
 */
export const cleanupOldActivityLogs = async (
  daysToKeep: number = 90
): Promise<{ message: string; deletedCount: number }> => {
  const response = await fetch(
    `${API_BASE_URL}/activity-logs/cleanup?daysToKeep=${daysToKeep}`,
    {
      method: "DELETE",
      headers: await getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to cleanup old activity logs");
  }

  return response.json();
};
