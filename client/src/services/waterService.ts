import api from './api';
import { WaterData, WaterSummary } from '../types';

interface WaterResponse {
  success: boolean;
  data: WaterData[];
  summary: WaterSummary[];
}

export const waterService = {
  async getAll(location?: string): Promise<WaterResponse> {
    const { data } = await api.get<WaterResponse>('/water', {
      params: location ? { location } : {},
    });
    return data;
  },

  async getTrends(): Promise<{ data: Array<{ _id: { source: string; year: number; month: number; day: number }; avgLevel: number; date: string }> }> {
    const { data } = await api.get('/water/trends');
    return data;
  },

  async add(payload: { level: number; location: string; source: string; notes?: string }): Promise<{ data: WaterData }> {
    const { data } = await api.post<{ success: boolean; data: WaterData }>('/water', payload);
    return data;
  },
};
