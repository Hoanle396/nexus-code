import api from '@/lib/api';

export interface Project {
  id: string;
  name: string;
  type: 'github' | 'gitlab';
  repositoryUrl: string;
  businessContext?: string;
  reviewRules?: Record<string, any>;
  autoReview: boolean;
  isActive: boolean;
  discordChannelId?: string;
  teamId: string;
  team?: {
    id: string;
    name: string;
    plan: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  name: string;
  type: 'github' | 'gitlab';
  repositoryUrl: string;
  teamId: string;
  businessContext?: string;
  reviewRules?: Record<string, any>;
  autoReview?: boolean;
  discordChannelId?: string;
}

export interface UpdateProjectData {
  name?: string;
  businessContext?: string;
  reviewRules?: Record<string, any>;
  autoReview?: boolean;
  isActive?: boolean;
  discordChannelId?: string;
}

export const projectService = {
  getAll: async (teamId?: string): Promise<Project[]> => {
    const params = teamId ? { teamId } : {};
    const response = await api.get('/projects', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  create: async (data: CreateProjectData): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProjectData): Promise<Project> => {
    const response = await api.patch(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};
