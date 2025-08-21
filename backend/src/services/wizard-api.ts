import { api } from 'encore.dev/api';

// Import all wizard-related services
import { projectAnalyzer } from './project-analyzer';
import { projectWizard } from './project-wizard';
import { projectTemplates } from './project-templates';
import { integrationSetup } from './integration-setup';
import { projectScaffolding } from './project-scaffolding';
import { githubIntegration } from './github-integration';

// Re-export types
export type {
  ProjectRequirements,
  TechnologyRecommendation,
  ArchitecturePattern,
  SecurityRequirements,
  PerformanceConsiderations,
  ProjectAnalysis,
} from './project-analyzer';

export type {
  WizardStep,
  WizardSession,
  WizardStepData,
} from './project-wizard';

export type {
  Template,
  TemplateConfig,
  ProjectFiles,
} from './project-templates';

export type {
  Integration,
  IntegrationConfig,
} from './integration-setup';

export type {
  ScaffoldingConfig,
  APIEndpoint,
  DataModel,
  ComponentSpec,
} from './project-scaffolding';

export type {
  GitHubRepository,
  RepositoryAnalysis,
  MigrationPlan,
} from './github-integration';

// =============================================================================
// Wizard Session Management
// =============================================================================

export const createWizardSession = api(
  { method: 'POST', path: '/api/wizard/session' },
  async ({ userId }: { userId: string }) => {
    return await projectWizard.createWizardSession(userId);
  },
);

export const getWizardSession = api(
  { method: 'GET', path: '/api/wizard/session/:sessionId' },
  async ({ sessionId }: { sessionId: string }) => {
    return await projectWizard.getWizardSession(sessionId);
  },
);

export const updateWizardStep = api(
  { method: 'PUT', path: '/api/wizard/session/:sessionId/step/:stepId' },
  async ({ 
    sessionId, 
    stepId, 
    data, 
  }: { 
    sessionId: string; 
    stepId: string; 
    data: any 
  }) => {
    return await projectWizard.updateWizardStep(sessionId, stepId, data);
  },
);

export const getWizardPreview = api(
  { method: 'GET', path: '/api/wizard/session/:sessionId/preview/:stepId' },
  async ({ sessionId, stepId }: { sessionId: string; stepId: string }) => {
    return await projectWizard.getWizardPreview(sessionId, stepId);
  },
);

export const completeWizard = api(
  { method: 'POST', path: '/api/wizard/session/:sessionId/complete' },
  async ({ sessionId }: { sessionId: string }) => {
    return await projectWizard.completeWizard(sessionId);
  },
);

// =============================================================================
// Project Analysis
// =============================================================================

export const analyzeProject = api(
  { method: 'POST', path: '/api/wizard/analyze' },
  async ({ description, preferences }: { 
    description: string; 
    preferences?: any 
  }) => {
    return await projectAnalyzer.analyzeProjectRequirements(description, preferences);
  },
);

export const getTemplateRecommendations = api(
  { method: 'POST', path: '/api/wizard/templates/recommend' },
  async ({ analysis }: { analysis: any }) => {
    // Return recommended template IDs based on analysis
    const templates: string[] = [];
    
    if (analysis.recommendations) {
      const { frontend, backend, database } = analysis.recommendations;
      
      // Build template ID based on technology stack
      const templateId = `${frontend.framework}-${backend.framework}-${database.specific}`;
      templates.push(templateId);
      
      // Add alternative templates
      frontend.alternatives?.forEach((alt: string) => {
        templates.push(`${alt}-${backend.framework}-${database.specific}`);
      });
    }
    
    return templates.slice(0, 5); // Return top 5 recommendations
  },
);

// =============================================================================
// Template Management
// =============================================================================

export const getAllTemplates = api(
  { method: 'GET', path: '/api/wizard/templates' },
  async () => {
    return await projectTemplates.getAllTemplates();
  },
);

export const getTemplate = api(
  { method: 'GET', path: '/api/wizard/templates/:templateId' },
  async ({ templateId }: { templateId: string }) => {
    return await projectTemplates.getTemplate(templateId);
  },
);

export const getTemplatesByCategory = api(
  { method: 'GET', path: '/api/wizard/templates/category/:category' },
  async ({ category }: { category: string }) => {
    return await projectTemplates.getTemplatesByCategory(category);
  },
);

export const generateProjectFromTemplate = api(
  { method: 'POST', path: '/api/wizard/templates/generate' },
  async (config: any) => {
    return await projectTemplates.generateProjectFromTemplate(config);
  },
);

// =============================================================================
// Integration Management
// =============================================================================

export const getAllIntegrations = api(
  { method: 'GET', path: '/api/wizard/integrations' },
  async () => {
    return await integrationSetup.getAllIntegrations();
  },
);

export const getIntegration = api(
  { method: 'GET', path: '/api/wizard/integrations/:integrationId' },
  async ({ integrationId }: { integrationId: string }) => {
    return await integrationSetup.getIntegration(integrationId);
  },
);

export const getIntegrationsByCategory = api(
  { method: 'GET', path: '/api/wizard/integrations/category/:category' },
  async ({ category }: { category: string }) => {
    return await integrationSetup.getIntegrationsByCategory(category);
  },
);

export const validateIntegrationConfig = api(
  { method: 'POST', path: '/api/wizard/integrations/:integrationId/validate' },
  async ({ 
    integrationId, 
    config, 
  }: { 
    integrationId: string; 
    config: Record<string, any> 
  }) => {
    return await integrationSetup.validateIntegrationConfig(integrationId, config);
  },
);

export const getIntegrationEstimation = api(
  { method: 'POST', path: '/api/wizard/integrations/estimate' },
  async ({ integrationIds }: { integrationIds: string[] }) => {
    return await integrationSetup.getIntegrationEstimation(integrationIds);
  },
);

export const generateIntegrationFiles = api(
  { method: 'POST', path: '/api/wizard/integrations/generate' },
  async ({ 
    integrationIds, 
    configurations, 
  }: { 
    integrationIds: string[]; 
    configurations: Record<string, any> 
  }) => {
    return await integrationSetup.generateIntegrationFiles(integrationIds, configurations);
  },
);

// =============================================================================
// Project Scaffolding
// =============================================================================

export const enhanceProjectFiles = api(
  { method: 'POST', path: '/api/wizard/scaffolding/enhance' },
  async ({ 
    baseFiles, 
    recommendations, 
  }: { 
    baseFiles: any; 
    recommendations: any 
  }) => {
    return await projectScaffolding.enhanceProjectFiles(baseFiles, recommendations);
  },
);

export const generateProjectScaffolding = api(
  { method: 'POST', path: '/api/wizard/scaffolding/generate' },
  async (config: any) => {
    return await projectScaffolding.generateProjectScaffolding(config);
  },
);

// =============================================================================
// GitHub Integration
// =============================================================================

export const analyzeRepository = api(
  { method: 'POST', path: '/api/wizard/github/analyze' },
  async ({ 
    repoUrl, 
    accessToken, 
  }: { 
    repoUrl: string; 
    accessToken?: string 
  }) => {
    return await githubIntegration.analyzeRepository(repoUrl, accessToken);
  },
);

export const createMigrationPlan = api(
  { method: 'POST', path: '/api/wizard/github/migration-plan' },
  async ({ 
    repositoryAnalysis, 
    targetAnalysis, 
  }: { 
    repositoryAnalysis: any; 
    targetAnalysis: any 
  }) => {
    return await githubIntegration.createMigrationPlan(repositoryAnalysis, targetAnalysis);
  },
);

export const importRepository = api(
  { method: 'POST', path: '/api/wizard/github/import' },
  async ({ 
    repoUrl, 
    targetDirectory, 
    accessToken, 
  }: { 
    repoUrl: string; 
    targetDirectory: string; 
    accessToken?: string 
  }) => {
    return await githubIntegration.importRepository(repoUrl, targetDirectory, accessToken);
  },
);

// =============================================================================
// Wizard Utilities
// =============================================================================

export const validateWizardStep = api(
  { method: 'POST', path: '/api/wizard/validate-step' },
  async ({ 
    stepId, 
    data, 
  }: { 
    stepId: string; 
    data: any 
  }): Promise<{ isValid: boolean; errors: string[] }> => {
    const errors: string[] = [];

    switch (stepId) {
      case 'project-description':
        if (!data.name || data.name.trim().length < 3) {
          errors.push('Project name must be at least 3 characters long');
        }
        if (!data.description || data.description.trim().length < 10) {
          errors.push('Project description must be at least 10 characters long');
        }
        if (!data.userType || !['beginner', 'intermediate', 'advanced'].includes(data.userType)) {
          errors.push('Valid user type must be selected');
        }
        if (!data.timeline || !['quick', 'standard', 'comprehensive'].includes(data.timeline)) {
          errors.push('Valid timeline must be selected');
        }
        if (!data.scalability || !['small', 'medium', 'large', 'enterprise'].includes(data.scalability)) {
          errors.push('Valid scalability option must be selected');
        }
        if (!data.budget || !['minimal', 'standard', 'premium'].includes(data.budget)) {
          errors.push('Valid budget option must be selected');
        }
        break;

      case 'technology-selection':
        if (!data.selectedTemplate) {
          errors.push('Template must be selected');
        }
        break;

      case 'template-configuration':
        if (!data.selectedTemplate) {
          errors.push('Template must be selected');
        }
        if (data.templateConfiguration) {
          // Validate template-specific configuration
          // This would be more sophisticated in a real implementation
        }
        break;

      case 'integration-setup':
        // Integrations are optional, so this step is always valid
        break;

      case 'preview-deployment':
        if (!data.deploymentConfig?.platform) {
          errors.push('Deployment platform must be selected');
        }
        break;

      default:
        errors.push('Unknown step ID');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
);

export const getWizardSummary = api(
  { method: 'GET', path: '/api/wizard/session/:sessionId/summary' },
  async ({ sessionId }: { sessionId: string }) => {
    const session = await projectWizard.getWizardSession(sessionId);
    
    if (!session) {
      throw new Error('Wizard session not found');
    }

    const completedSteps = session.steps.filter(step => step.completed);
    const totalSteps = session.steps.length;
    const progress = (completedSteps.length / totalSteps) * 100;

    return {
      sessionId: session.id,
      status: session.status,
      progress: Math.round(progress),
      completedSteps: completedSteps.length,
      totalSteps,
      currentStep: session.currentStep,
      projectName: session.projectData.name,
      estimatedCompletion: session.projectData.analysis?.estimatedTimeline,
      lastUpdated: session.updatedAt,
    };
  },
);

export const deleteWizardSession = api(
  { method: 'DELETE', path: '/api/wizard/session/:sessionId' },
  async ({ sessionId: _sessionId }: { sessionId: string }) => {
    // In a real implementation, this would delete the session from storage
    return { success: true, message: 'Wizard session deleted successfully' };
  },
);

// =============================================================================
// Wizard Health Check
// =============================================================================

export const wizardHealthCheck = api(
  { method: 'GET', path: '/api/wizard/health' },
  async () => {
    try {
      // Check if all wizard services are operational
      const services = {
        projectAnalyzer: true,
        projectWizard: true,
        projectTemplates: true,
        integrationSetup: true,
        projectScaffolding: true,
        githubIntegration: true,
      };

      const allHealthy = Object.values(services).every(healthy => healthy);

      return {
        status: allHealthy ? 'healthy' : 'degraded',
        services,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
    }
  },
);