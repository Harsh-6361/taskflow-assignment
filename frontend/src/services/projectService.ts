import api from './api';
import type { Project, ProjectMember, MemberRole } from '../types';

export const projectService = {
  getAllProjects: async (): Promise<Project[]> => {
    const response = await api.get<Project[]>('/projects');
    return response.data;
  },

  getProjectById: async (id: string): Promise<Project> => {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  createProject: async (name: string, description?: string): Promise<Project> => {
    const response = await api.post<Project>('/projects', { name, description });
    return response.data;
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<Project> => {
    const response = await api.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/projects/${id}`);
    return response.data;
  },

  // Team Management
  getProjectMembers: async (id: string): Promise<ProjectMember[]> => {
    const response = await api.get<ProjectMember[]>(`/projects/${id}/members`);
    return response.data;
  },

  addProjectMember: async (id: string, email: string, role?: MemberRole): Promise<ProjectMember> => {
    const response = await api.post<ProjectMember>(`/projects/${id}/members`, { email, role });
    return response.data;
  },

  removeProjectMember: async (id: string, userId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/projects/${id}/members/${userId}`);
    return response.data;
  },

  updateMemberRole: async (id: string, userId: string, role: MemberRole): Promise<ProjectMember> => {
    const response = await api.patch<ProjectMember>(`/projects/${id}/members/${userId}/role`, { role });
    return response.data;
  },

  // Project Stats
  getProjectStats: async (id: string): Promise<any> => {
    const response = await api.get(`/dashboard/projects/${id}/stats`);
    return response.data;
  }
};
