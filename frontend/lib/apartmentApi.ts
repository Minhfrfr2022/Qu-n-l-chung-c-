import { apiRequest } from './api';

/* =======================
   Types
======================= */

export type ApartmentStatus = 'occupied' | 'vacant' | 'rented';

export interface Apartment {
  apt_id: string;
  floor?: number;
  area?: number;
  owner_name: string;
  owner_phone?: string;
  owner_email?: string;
  status?: ApartmentStatus;
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

/* =======================
   Apartment API
======================= */

export const apartmentAPI = {
  /** GET /api/apartments */
  getAll: async (params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.append('page', params.page.toString());
    if (params?.page_size) qs.append('page_size', params.page_size.toString());

    const res = await apiRequest<any>(`/apartments${qs.toString() ? `?${qs}` : ''}`);
    const payload = res.result || res;

    const data: Apartment[] = payload.data || [];
    const p = payload.pagination || {};

    const pagination: Pagination = {
      page: p.current_page ?? p.page ?? 1,
      page_size: p.page_size ?? 10,
      total: p.total_docs ?? p.total ?? 0,
      total_pages: p.total_pages ?? 0,
    };

    return { data, pagination };
  },

  /** GET /api/apartments/search */
  search: async (params: { q: string; page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    qs.append('q', params.q);
    if (params.page) qs.append('page', params.page.toString());
    if (params.page_size) qs.append('page_size', params.page_size.toString());

    const res = await apiRequest<any>(`/apartments/search?${qs}`);
    const payload = res.result || res;
    const data: Apartment[] = payload.data || [];
    const p = payload.pagination || {};

    const pagination: Pagination = {
      page: p.current_page ?? p.page ?? 1,
      page_size: p.page_size ?? 10,
      total: p.total_docs ?? p.total ?? 0,
      total_pages: p.total_pages ?? 0,
    };

    return { data, pagination };
  },

  /** GET /api/apartments/:apt_id */
  getById: async (aptId: string) => {
    const res = await apiRequest<any>(`/apartments/${aptId}`);
    // backend returns { success, message, data }
    return { data: res.data ?? res.result?.data };
  },

  /** POST /api/apartments */
  create: async (data: Apartment) => {
    return apiRequest<any>('/apartments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** PUT /api/apartments/:apt_id */
  update: async (aptId: string, data: Partial<Apartment>) => {
    return apiRequest<any>(`/apartments/${aptId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /** DELETE /api/apartments/:apt_id */
  delete: async (aptId: string) => {
    return apiRequest<any>(`/apartments/${aptId}`, {
      method: 'DELETE',
    });
  },
};
