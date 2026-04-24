import api from './api';
import { Notification } from '../types';

interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  unreadCount: number;
}

export const notificationService = {
  async getAll(): Promise<NotificationsResponse> {
    const { data } = await api.get<NotificationsResponse>('/notifications');
    return data;
  },

  async markAsRead(id: string): Promise<void> {
    await api.put(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all');
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
};
