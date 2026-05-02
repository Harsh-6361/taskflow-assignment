import api from './api';
import type { Task } from '../types';

export interface DashboardStats {
  totalTasks: number;
  statusCounts: Record<string, number>;
  overdueCount: number;
  completionPercentage: number;
  dueThisWeekCount: number;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  getMyTasks: async (): Promise<Record<string, Task[]>> => {
    const response = await api.get<Record<string, Task[]>>('/dashboard/my-tasks');
    return response.data;
  },

  getOverdueTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/dashboard/overdue');
    return response.data;
  },

  getAdminStats: async (): Promise<any> => {
    const response = await api.get<any>('/dashboard/admin/stats');
    return response.data;
  },

  getHealth: async (): Promise<{ status: string; message: string; timestamp: string }> => {
    const response = await api.get<{ status: string; message: string; timestamp: string }>('/../health');
    // Using /../health because the base is /api, and health is at root /health
    // Alternatively, I can just use axios directly or fix the baseURL logic.
    // Let's use /../health assuming the baseURL is http://localhost:5000/api
    return response.data;
  }
};
