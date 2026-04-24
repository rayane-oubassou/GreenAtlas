import api from './api';
import { User } from '../types';

export const userService = {
  async getAll(): Promise<{ data: User[]; total: number }> {
    const { data } = await api.get<{ success: boolean; data: User[]; total: number }>('/users');
    return data;
  },

  async update(id: string, updates: Partial<User>): Promise<{ data: User }> {
    const { data } = await api.put<{ success: boolean; data: User }>(`/users/${id}`, updates);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
