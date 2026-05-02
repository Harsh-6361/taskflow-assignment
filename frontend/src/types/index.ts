export type Role = 'ADMIN' | 'TEAM_LEADER' | 'MEMBER';
export type MemberRole = 'ADMIN' | 'TEAM_LEADER' | 'MEMBER';
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  _count?: {
    ownedProjects?: number;
    assignedTasks?: number;
  };
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  user?: Partial<User>;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    projectMembers: number;
  };
  projectMembers?: ProjectMember[];
  taskStats?: Record<string, number>;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  assignedToId: string | null;
  createdById: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  assignedTo?: Partial<User>;
  createdBy?: Partial<User>;
}

export interface AuthResponse {
  user: User;
  token: string;
}
