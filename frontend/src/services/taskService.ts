import api from './api';
import type { Task, TaskStatus, Priority } from '../types';

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  assignedToId?: string;
  priority?: Priority;
  overdue?: boolean;
}

export const taskService = {
  getAllTasks: async (filters: TaskFilters = {}): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters.projectId) params.append('projectId', filters.projectId);
    if (filters.status) params.append('status', filters.status);
    if (filters.assignedToId) params.append('assignedToId', filters.assignedToId);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.overdue) params.append('overdue', 'true');

    const response = await api.get<Task[]>(`/tasks?${params.toString()}`);
    return response.data;
  },

  getTaskById: async (id: string): Promise<Task> => {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (data: {
    title: string;
    description?: string;
    projectId: string;
    assignedToId?: string;
    priority?: Priority;
    dueDate?: string;
  }): Promise<Task> => {
    const response = await api.post<Task>('/tasks', data);
    return response.data;
  },

  updateTask: async (id: string, data: Partial<Task>): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  updateTaskStatus: async (id: string, status: TaskStatus): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${id}/status`, { status });
    return response.data;
  },

  assignTask: async (id: string, assignedToId: string | null): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${id}/assign`, { assignedToId });
    return response.data;
  },

  deleteTask: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/tasks/${id}`);
    return response.data;
  },
};
