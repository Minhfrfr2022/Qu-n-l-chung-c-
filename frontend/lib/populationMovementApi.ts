import { getAuthToken } from './api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface PopulationMovement {
  id: string;
  resident_id: string;
  apt_id: string;
  movement_type: 'temporary_absence' | 'temporary_residency' | 'permanent_move' | string;
  reason?: string;
  start_date: string;
  end_date?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  requested_by?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  resident?: {
    id: string;
    full_name: string;
    phone?: string;
    cccd?: string;
    apt_id: string;
  };
}

export const populationMovementAPI = {
  // Create new movement
  create: async (data: Omit<PopulationMovement, 'id' | 'created_at' | 'updated_at'>): Promise<PopulationMovement> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/population-movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  // Get movements by apartment
  listByApartment: async (aptId: string, status?: string): Promise<PopulationMovement[]> => {
    const token = await getAuthToken();
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const response = await fetch(
      `${API_BASE_URL}/population-movements/apartment/${aptId}?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  // Get movements by resident
  listByResident: async (residentId: string): Promise<PopulationMovement[]> => {
    const token = await getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/population-movements/resident/${residentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  // Get single movement
  getById: async (id: string): Promise<PopulationMovement> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/population-movements/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  // Update movement status
  updateStatus: async (id: string, status: 'approved' | 'rejected', approvedBy?: string): Promise<PopulationMovement> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/population-movements/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, approved_by: approvedBy }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  // Delete movement
  delete: async (id: string): Promise<void> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/population-movements/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
  },

  // Get pending movements (admin)
  getPending: async (): Promise<PopulationMovement[]> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/population-movements/pending`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  // Get movements by status or all (admin)
  getByStatus: async (status?: 'pending' | 'approved' | 'rejected' | 'all'): Promise<PopulationMovement[]> => {
    const token = await getAuthToken();
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.append('status', status);
    }
    
    const response = await fetch(`${API_BASE_URL}/population-movements?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },
};

export const movementTypeLabels: Record<string, string> = {
  'temporary_absence': 'Tạm vắng',
  'temporary_residency': 'Tạm trú',
  'permanent_move': 'Chuyển hộ khẩu',
  'visit': 'Thăm viếng',
  'other': 'Khác'
};

export const statusLabels: Record<string, string> = {
  'pending': 'Chờ duyệt',
  'approved': 'Đã duyệt',
  'rejected': 'Từ chối'
};
