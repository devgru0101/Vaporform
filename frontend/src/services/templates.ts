import { apiClient } from './api';
import type { Template } from './types';

// Templates service for managing project templates
export const templatesAPI = {
  // Get all available templates
  getTemplates: async (params?: {
    category?: string;
    complexity?: number;
    framework?: string;
    language?: string;
    limit?: number;
  }): Promise<{ templates: Template[] }> => {
    return apiClient.get<{ templates: Template[] }>('/templates', params);
  },

  // Get a specific template by ID
  getTemplate: async (templateId: string): Promise<Template> => {
    return apiClient.get<Template>(`/templates/${templateId}`);
  },

  // Get templates filtered by category
  getTemplatesByCategory: async (category: string): Promise<{ templates: Template[] }> => {
    return apiClient.get<{ templates: Template[] }>(`/templates/category/${category}`);
  },

  // Get popular templates
  getPopularTemplates: async (limit: number = 10): Promise<{ templates: Template[] }> => {
    return apiClient.get<{ templates: Template[] }>('/templates/popular', { limit });
  },

  // Get recommended templates based on project requirements
  getRecommendedTemplates: async (requirements: {
    projectType?: string;
    complexity?: number;
    techStack?: string[];
    features?: string[];
  }): Promise<{ templates: Template[] }> => {
    return apiClient.post<{ templates: Template[] }>('/templates/recommend', requirements);
  },

  // Get template preview/demo
  getTemplatePreview: async (templateId: string): Promise<{
    preview: string;
    demoUrl?: string;
    screenshots?: string[];
  }> => {
    return apiClient.get(`/templates/${templateId}/preview`);
  },

  // Validate template compatibility
  validateCompatibility: async (templateId: string, requirements: any): Promise<{
    compatible: boolean;
    issues: string[];
    suggestions: string[];
  }> => {
    return apiClient.post(`/templates/${templateId}/validate`, requirements);
  },

  // Get template dependencies
  getTemplateDependencies: async (templateId: string): Promise<{
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    peerDependencies?: Record<string, string>;
  }> => {
    return apiClient.get(`/templates/${templateId}/dependencies`);
  },

  // Search templates
  searchTemplates: async (query: string, filters?: {
    category?: string;
    complexity?: number;
    tags?: string[];
  }): Promise<{ templates: Template[]; total: number }> => {
    const params = { q: query, ...filters };
    return apiClient.get<{ templates: Template[]; total: number }>('/templates/search', params);
  }
};

export default templatesAPI;