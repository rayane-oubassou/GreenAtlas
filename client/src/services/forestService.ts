import api from './api';
import { ForestData, ForestSummary, WeatherData, FireRiskLevel } from '../types';

interface ForestResponse {
  success: boolean;
  data: ForestData[];
  summary: ForestSummary[];
}

interface ForestLiveResponse {
  success: boolean;
  data: {
    forestData: ForestData[];
    liveWeather: WeatherData;
    liveFireRisk: FireRiskLevel;
  };
}

export const forestService = {
  async getAll(): Promise<ForestResponse> {
    const { data } = await api.get<ForestResponse>('/forest');
    return data;
  },

  async getLive(): Promise<ForestLiveResponse> {
    const { data } = await api.get<ForestLiveResponse>('/forest/live');
    return data;
  },

  async add(payload: {
    healthIndex: number;
    location: string;
    area: number;
    temperature: number;
    humidity: number;
    windSpeed: number;
    notes?: string;
  }): Promise<{ data: ForestData }> {
    const { data } = await api.post<{ success: boolean; data: ForestData }>('/forest', payload);
    return data;
  },
};
