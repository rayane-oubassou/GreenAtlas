import api from './api';
import { LeaderboardData, ApiResponse } from '../types';

export const leaderboardService = {
  get: async (period: 'alltime' | 'monthly' = 'alltime'): Promise<ApiResponse<LeaderboardData>> => {
    const res = await api.get(`/leaderboard?period=${period}`);
    return res.data;
  },
};
