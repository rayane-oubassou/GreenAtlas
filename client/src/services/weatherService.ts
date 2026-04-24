import api from './api';
import { WeatherData, EnvironmentData } from '../types';

export const weatherService = {
  async getWeather(): Promise<{ data: WeatherData }> {
    const { data } = await api.get<{ success: boolean; data: WeatherData }>('/weather');
    return data;
  },

  async getEnvironmentData(): Promise<{ data: EnvironmentData }> {
    const { data } = await api.get<{ success: boolean; data: EnvironmentData }>('/environment');
    return data;
  },
};
