import { apiClient } from './api';
import type { 
  IntegrationProvider, 
  IntegrationConfig,
  GetProvidersRequest 
} from './types';

// Integrations service for managing third-party integrations
export const integrationsAPI = {
  // Get all available integration providers
  getProviders: async (params?: GetProvidersRequest): Promise<{ providers: IntegrationProvider[] }> => {
    return apiClient.get<{ providers: IntegrationProvider[] }>('/integrations/providers', params);
  },

  // Get specific integration provider details
  getProviderDetails: async (providerId: string): Promise<IntegrationProvider> => {
    return apiClient.get<IntegrationProvider>(`/integrations/providers/${providerId}`);
  },

  // Get providers by type (auth, payments, analytics, etc.)
  getProvidersByType: async (type: string): Promise<{ providers: IntegrationProvider[] }> => {
    return apiClient.get<{ providers: IntegrationProvider[] }>(`/integrations/providers/type/${type}`);
  },

  // Get providers by category
  getProvidersByCategory: async (category: string): Promise<{ providers: IntegrationProvider[] }> => {
    return apiClient.get<{ providers: IntegrationProvider[] }>(`/integrations/providers/category/${category}`);
  },

  // Create integration configuration
  createConfiguration: async (config: {
    projectId: string;
    integrationType: string;
    provider: string;
    configuration: Record<string, any>;
    environmentVariables?: Record<string, string>;
  }): Promise<IntegrationConfig> => {
    return apiClient.post<IntegrationConfig>('/integrations/configurations', config);
  },

  // Get integration configurations for a project
  getProjectConfigurations: async (projectId: string): Promise<{ configurations: IntegrationConfig[] }> => {
    return apiClient.get<{ configurations: IntegrationConfig[] }>(`/integrations/configurations/project/${projectId}`);
  },

  // Update integration configuration
  updateConfiguration: async (configId: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig> => {
    return apiClient.put<IntegrationConfig>(`/integrations/configurations/${configId}`, updates);
  },

  // Delete integration configuration
  deleteConfiguration: async (configId: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/integrations/configurations/${configId}`);
  },

  // Test integration connection
  testConnection: async (configId: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> => {
    return apiClient.post<{
      success: boolean;
      message: string;
      details?: any;
    }>(`/integrations/configurations/${configId}/test`);
  },

  // Validate integration setup
  validateIntegration: async (config: {
    integrationType: string;
    provider: string;
    configuration: Record<string, any>;
  }): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> => {
    return apiClient.post<{
      valid: boolean;
      errors: string[];
      warnings: string[];
    }>('/integrations/validate', config);
  },

  // Get integration setup guide
  getSetupGuide: async (providerId: string): Promise<{
    steps: Array<{
      title: string;
      description: string;
      code?: string;
      links?: string[];
    }>;
    prerequisites: string[];
    troubleshooting: Array<{
      issue: string;
      solution: string;
    }>;
  }> => {
    return apiClient.get(`/integrations/providers/${providerId}/setup-guide`);
  },

  // Search integration providers
  searchProviders: async (query: string, filters?: {
    type?: string;
    category?: string;
    difficulty?: string;
  }): Promise<{ providers: IntegrationProvider[]; total: number }> => {
    const params = { q: query, ...filters };
    return apiClient.get<{ providers: IntegrationProvider[]; total: number }>('/integrations/providers/search', params);
  },

  // Get popular integrations
  getPopularIntegrations: async (limit: number = 10): Promise<{ providers: IntegrationProvider[] }> => {
    return apiClient.get<{ providers: IntegrationProvider[] }>('/integrations/providers/popular', { limit });
  },

  // Get integration compatibility
  checkCompatibility: async (templateId: string, providerId: string): Promise<{
    compatible: boolean;
    conflicts: string[];
    recommendations: string[];
  }> => {
    return apiClient.get<{
      compatible: boolean;
      conflicts: string[];
      recommendations: string[];
    }>(`/integrations/compatibility/${templateId}/${providerId}`);
  }
};

export default integrationsAPI;