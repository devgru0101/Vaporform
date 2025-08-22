import { apiClient } from './api';
import projectAnalysisAPI from './projectAnalysis';
import templatesAPI from './templates';
import integrationsAPI from './integrations';
import projectGenerationAPI, { ProjectGenerationTracker } from './projectGeneration';
import type { 
  WizardSession,
  ProjectVisionData,
  TechStackData,
  IntegrationData,
  ProjectCreationRequest,
  Template,
  IntegrationProvider
} from './types';

// Enhanced Wizard service that integrates with all backend microservices
export const wizardAPI = {
  // Session Management
  createSession: async (userId: string): Promise<WizardSession> => {
    return apiClient.post<WizardSession>('/projectwizard/session', { userId });
  },

  getSession: async (sessionId: string): Promise<WizardSession> => {
    return apiClient.get<WizardSession>(`/projectwizard/session/${sessionId}`);
  },

  updateSession: async (sessionId: string, updates: Partial<WizardSession>): Promise<WizardSession> => {
    return apiClient.put<WizardSession>(`/projectwizard/session/${sessionId}`, updates);
  },

  updateStep: async (sessionId: string, stepId: string, data: any): Promise<WizardSession> => {
    return apiClient.put<WizardSession>(`/projectwizard/session/${sessionId}/step/${stepId}`, { data });
  },

  // Step 1: Project Vision Analysis
  analyzeVision: async (vision: ProjectVisionData, userId: string) => {
    return projectAnalysisAPI.analyzeVision(vision, userId);
  },

  // Step 2: Tech Stack & Templates
  getTemplates: async (filters?: any): Promise<{ templates: Template[] }> => {
    return templatesAPI.getTemplates(filters);
  },

  getRecommendedTemplates: async (requirements: any): Promise<{ templates: Template[] }> => {
    return templatesAPI.getRecommendedTemplates(requirements);
  },

  getTemplate: async (templateId: string): Promise<Template> => {
    return templatesAPI.getTemplate(templateId);
  },

  // Step 3: Integrations
  getIntegrationProviders: async (filters?: any): Promise<{ providers: IntegrationProvider[] }> => {
    return integrationsAPI.getProviders(filters);
  },

  getProvidersByType: async (type: string): Promise<{ providers: IntegrationProvider[] }> => {
    return integrationsAPI.getProvidersByType(type);
  },

  validateIntegration: async (config: any) => {
    return integrationsAPI.validateIntegration(config);
  },

  // Step 4: Project Generation
  generateProject: async (
    vision: ProjectVisionData,
    techStack: TechStackData,
    integrations: IntegrationData,
    userId: string,
    sessionId?: string,
    options?: any
  ) => {
    const projectData: ProjectCreationRequest = {
      vision,
      techStack,
      integrations,
      userId,
      sessionId
    };

    return projectGenerationAPI.generateProject(projectData, options);
  },

  // Progress tracking
  createProgressTracker: (generationId: string): ProjectGenerationTracker => {
    return new ProjectGenerationTracker(generationId);
  },

  getGenerationStatus: async (generationId: string) => {
    return projectGenerationAPI.getGenerationStatus(generationId);
  },

  downloadProject: async (generationId: string) => {
    return projectGenerationAPI.downloadProject(generationId);
  },

  // Preview & Validation
  generatePreview: async (sessionId: string, stepId: string): Promise<any> => {
    return apiClient.get(`/projectwizard/session/${sessionId}/preview/${stepId}`);
  },

  validateProject: async (projectData: any): Promise<{ valid: boolean; errors: string[] }> => {
    return apiClient.post<{ valid: boolean; errors: string[] }>('/projectwizard/validate', projectData);
  },

  // Completion
  completeWizard: async (sessionId: string): Promise<{
    success: boolean;
    projectId?: string;
    generationId?: string;
  }> => {
    return apiClient.post<{
      success: boolean;
      projectId?: string;
      generationId?: string;
    }>(`/projectwizard/session/${sessionId}/complete`);
  },

  // Additional utilities
  estimateProjectComplexity: async (vision: ProjectVisionData) => {
    return projectAnalysisAPI.estimateComplexity(vision);
  },

  getSetupGuide: async (providerId: string) => {
    return integrationsAPI.getSetupGuide(providerId);
  },

  checkTemplateCompatibility: async (templateId: string, providerId: string) => {
    return integrationsAPI.checkCompatibility(templateId, providerId);
  },

  // Enhanced features
  saveProgress: async (sessionId: string, stepData: any): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(`/projectwizard/session/${sessionId}/save`, stepData);
  },

  restoreProgress: async (sessionId: string): Promise<WizardSession> => {
    return apiClient.get<WizardSession>(`/projectwizard/session/${sessionId}/restore`);
  },

  getUserSessions: async (userId: string): Promise<{ sessions: WizardSession[] }> => {
    return apiClient.get<{ sessions: WizardSession[] }>(`/projectwizard/sessions/user/${userId}`);
  },

  deleteSession: async (sessionId: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/projectwizard/session/${sessionId}`);
  }
};

export default wizardAPI;