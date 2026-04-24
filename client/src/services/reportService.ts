import api from './api';
import { Report, ReportStats } from '../types';

interface ReportsResponse {
  success: boolean;
  data: Report[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface ReportFilters {
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const reportService = {
  async getAll(params?: ReportFilters): Promise<ReportsResponse> {
    const { data } = await api.get<ReportsResponse>('/reports', { params });
    return data;
  },

  async getById(id: string): Promise<{ data: Report }> {
    const { data } = await api.get<{ success: boolean; data: Report }>(`/reports/${id}`);
    return data;
  },

  async create(formData: FormData): Promise<{ data: Report }> {
    const { data } = await api.post<{ success: boolean; data: Report }>('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async update(id: string, updates: Partial<Report>): Promise<{ data: Report }> {
    const { data } = await api.put<{ success: boolean; data: Report }>(`/reports/${id}`, updates);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/reports/${id}`);
  },

  async getStats(): Promise<{ data: ReportStats }> {
    const { data } = await api.get<{ success: boolean; data: ReportStats }>('/reports/stats');
    return data;
  },
};
