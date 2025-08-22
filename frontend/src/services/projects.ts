import { apiClient } from './api';
import type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest,
  APIResponse 
} from './types';

// Projects service for managing projects
export const projectAPI = {
  // Get all projects for the authenticated user
  getProjects: async (): Promise<{ projects: Project[] }> => {
    return apiClient.get<{ projects: Project[] }>('/projects');
  },

  // Get a specific project by ID
  getProject: async (id: string): Promise<Project> => {
    return apiClient.get<Project>(`/projects/${id}`);
  },

  // Create a new project
  createProject: async (projectData: CreateProjectRequest): Promise<Project> => {
    return apiClient.post<Project>('/projects', projectData);
  },

  // Update an existing project
  updateProject: async (id: string, updates: UpdateProjectRequest): Promise<Project> => {
    return apiClient.put<Project>(`/projects/${id}`, updates);
  },

  // Delete a project
  deleteProject: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/projects/${id}`);
  },

  // Get project files (if supported)
  getProjectFiles: async (id: string): Promise<{ files: string[] }> => {
    return apiClient.get<{ files: string[] }>(`/projects/${id}/files`);
  },

  // Create project from wizard (special endpoint)
  createWizardProject: async (projectData: any): Promise<Project> => {
    return apiClient.post<Project>('/projects/wizard', projectData);
  },

  // Update project with wizard data
  updateWizardProject: async (id: string, updates: any): Promise<Project> => {
    return apiClient.put<Project>(`/projects/wizard/${id}`, updates);
  }
};

export default projectAPI;