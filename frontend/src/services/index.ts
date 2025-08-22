// Export all API services and utilities
export { apiClient, APIError, handleAPIError } from './api';
export { projectAPI } from './projects';
export { projectAnalysisAPI } from './projectAnalysis';
export { templatesAPI } from './templates';
export { integrationsAPI } from './integrations';
export { projectGenerationAPI, ProjectGenerationTracker, ProjectGenerationWebSocketTracker } from './projectGeneration';
export { wizardAPI } from './wizard';

// Export all types
export * from './types';

// Note: Services are available directly as projectAPI, templatesAPI, etc.

// Service configuration
import { API_BASE_URL, WS_URL, TIMEOUT, RETRY_ATTEMPTS, RETRY_DELAY } from '../config/environment';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  wsURL: WS_URL,
  timeout: TIMEOUT,
  retryAttempts: RETRY_ATTEMPTS,
  retryDelay: RETRY_DELAY,
};

// Service status checker
export const checkServiceStatus = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  services: Record<string, boolean>;
  timestamp: Date;
}> => {
  const services = {
    projects: false,
    wizard: false,
    templates: false,
    integrations: false,
    projectAnalysis: false,
    projectGeneration: false,
  };

  try {
    // Test each service endpoint
    const healthChecks = await Promise.allSettled([
      apiClient.get('/health'),
      apiClient.get('/projects'),
      apiClient.get('/wizard/health'),
      apiClient.get('/templates'),
      apiClient.get('/integrations/providers'),
      apiClient.get('/projectanalysis/health'),
      apiClient.get('/projectgeneration/health'),
    ]);

    // Update service status based on results
    services.projects = healthChecks[1].status === 'fulfilled';
    services.wizard = healthChecks[2].status === 'fulfilled';
    services.templates = healthChecks[3].status === 'fulfilled';
    services.integrations = healthChecks[4].status === 'fulfilled';
    services.projectAnalysis = healthChecks[5].status === 'fulfilled';
    services.projectGeneration = healthChecks[6].status === 'fulfilled';

    const allHealthy = Object.values(services).every(status => status);

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      services,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Service health check failed:', error);
    return {
      status: 'unhealthy',
      services,
      timestamp: new Date(),
    };
  }
};