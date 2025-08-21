import { api } from 'encore.dev/api';
import { projectAnalyzer, ProjectAnalysis } from './project-analyzer';
import { projectTemplates, TemplateConfig, ProjectFiles } from './project-templates';
import { projectScaffolding } from './project-scaffolding';
import { integrationSetup } from './integration-setup';

export interface WizardStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  data?: any;
  validation?: {
    isValid: boolean;
    errors: string[];
  };
}

export interface WizardSession {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  currentStep: number;
  steps: WizardStep[];
  projectData: {
    name?: string;
    description?: string;
    analysis?: ProjectAnalysis;
    selectedTemplate?: string;
    customizations?: Record<string, any>;
    integrations?: string[];
    deploymentConfig?: any;
  };
  status: 'active' | 'completed' | 'abandoned';
}

export interface WizardStepData {
  // Step 1: Project Description
  projectDescription?: {
    name: string;
    description: string;
    requirements: string[];
    userType: 'beginner' | 'intermediate' | 'advanced';
    timeline: 'quick' | 'standard' | 'comprehensive';
    scalability: 'small' | 'medium' | 'large' | 'enterprise';
    budget: 'minimal' | 'standard' | 'premium';
  };

  // Step 2: Technology Selection
  technologySelection?: {
    analysis: ProjectAnalysis;
    selectedStack: {
      frontend: string;
      backend: string;
      database: string;
      deployment: string;
    };
    customizations: Record<string, any>;
  };

  // Step 3: Template Configuration
  templateConfiguration?: {
    selectedTemplate: string;
    customizations: Record<string, any>;
    additionalFeatures: string[];
    structure: ProjectFiles;
  };

  // Step 4: Integration Setup
  integrationSetup?: {
    selectedIntegrations: string[];
    configurations: Record<string, any>;
    apiKeys: Record<string, string>;
  };

  // Step 5: Preview & Deployment
  previewDeployment?: {
    projectStructure: ProjectFiles;
    deploymentConfig: any;
    containerConfig: any;
    estimatedCost: string;
    timeline: string;
  };
}

class ProjectWizardService {
  private readonly sessions = new Map<string, WizardSession>();

  async createWizardSession(userId: string): Promise<WizardSession> {
    const sessionId = this.generateSessionId();
    
    const session: WizardSession = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentStep: 0,
      steps: this.initializeSteps(),
      projectData: {},
      status: 'active',
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async getWizardSession(sessionId: string): Promise<WizardSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async updateWizardStep(
    sessionId: string, 
    stepId: string, 
    data: any,
  ): Promise<WizardSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Wizard session not found');
    }

    const step = session.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error('Wizard step not found');
    }

    // Validate step data
    const validation = await this.validateStepData(stepId, data);
    step.validation = validation;
    step.data = data;
    step.completed = validation.isValid;

    // Update project data based on step
    await this.updateProjectData(session, stepId, data);

    // Auto-advance to next step if current step is valid
    if (validation.isValid && session.currentStep === session.steps.findIndex(s => s.id === stepId)) {
      session.currentStep = Math.min(session.currentStep + 1, session.steps.length - 1);
    }

    session.updatedAt = new Date();
    this.sessions.set(sessionId, session);

    return session;
  }

  async completeWizard(sessionId: string): Promise<{
    projectFiles: ProjectFiles;
    containerConfig: any;
    deploymentInstructions: string[];
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Wizard session not found');
    }

    // Validate all steps are completed
    const incompleteSteps = session.steps.filter(step => !step.completed);
    if (incompleteSteps.length > 0) {
      throw new Error(`Incomplete steps: ${incompleteSteps.map(s => s.name).join(', ')}`);
    }

    try {
      // Generate project files
      const projectFiles = await this.generateProjectFiles(session);
      
      // Generate container configuration
      const containerConfig = await this.generateContainerConfig(session);
      
      // Generate deployment instructions
      const deploymentInstructions = await this.generateDeploymentInstructions(session);

      session.status = 'completed';
      session.updatedAt = new Date();
      this.sessions.set(sessionId, session);

      return {
        projectFiles,
        containerConfig,
        deploymentInstructions,
      };
    } catch (error) {
      console.error('Error completing wizard:', error);
      throw new Error('Failed to complete wizard');
    }
  }

  private initializeSteps(): WizardStep[] {
    return [
      {
        id: 'project-description',
        name: 'Project Description',
        description: 'Describe your project and requirements',
        completed: false,
      },
      {
        id: 'technology-selection',
        name: 'Technology Selection',
        description: 'Choose your technology stack',
        completed: false,
      },
      {
        id: 'template-configuration',
        name: 'Template Configuration',
        description: 'Customize your project template',
        completed: false,
      },
      {
        id: 'integration-setup',
        name: 'Integration Setup',
        description: 'Configure third-party integrations',
        completed: false,
      },
      {
        id: 'preview-deployment',
        name: 'Preview & Deployment',
        description: 'Review and deploy your project',
        completed: false,
      },
    ];
  }

  private async validateStepData(stepId: string, data: any): Promise<{ isValid: boolean; errors: string[] }> {
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
        break;

      case 'technology-selection':
        if (!data.selectedStack) {
          errors.push('Technology stack must be selected');
        } else {
          if (!data.selectedStack.frontend) {
            errors.push('Frontend framework must be selected');
          }
          if (!data.selectedStack.backend) {
            errors.push('Backend framework must be selected');
          }
          if (!data.selectedStack.database) {
            errors.push('Database must be selected');
          }
        }
        break;

      case 'template-configuration':
        if (!data.selectedTemplate) {
          errors.push('Template must be selected');
        }
        break;

      case 'integration-setup':
        // Integrations are optional, just validate configurations if provided
        if (data.selectedIntegrations && data.selectedIntegrations.length > 0) {
          for (const integration of data.selectedIntegrations) {
            if (!data.configurations?.[integration]) {
              errors.push(`Configuration required for ${integration}`);
            }
          }
        }
        break;

      case 'preview-deployment':
        if (!data.deploymentConfig) {
          errors.push('Deployment configuration must be provided');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async updateProjectData(session: WizardSession, stepId: string, data: any): Promise<void> {
    switch (stepId) {
      case 'project-description':
        session.projectData.name = data.name;
        session.projectData.description = data.description;
        
        // Analyze project requirements
        const analysis = await projectAnalyzer.analyzeProjectRequirements(data.description, {
          userType: data.userType,
          timeline: data.timeline,
          scalability: data.scalability,
          budget: data.budget,
          features: data.requirements || [],
        });
        session.projectData.analysis = analysis;
        break;

      case 'technology-selection':
        session.projectData.selectedTemplate = this.generateTemplateId(data.selectedStack);
        session.projectData.customizations = data.customizations;
        break;

      case 'template-configuration':
        session.projectData.selectedTemplate = data.selectedTemplate;
        session.projectData.customizations = {
          ...session.projectData.customizations,
          ...data.customizations,
        };
        break;

      case 'integration-setup':
        session.projectData.integrations = data.selectedIntegrations;
        session.projectData.customizations = {
          ...session.projectData.customizations,
          integrations: data.configurations,
        };
        break;

      case 'preview-deployment':
        session.projectData.deploymentConfig = data.deploymentConfig;
        break;
    }
  }

  private generateTemplateId(stack: any): string {
    return `${stack.frontend}-${stack.backend}-${stack.database}`;
  }

  private async generateProjectFiles(session: WizardSession): Promise<ProjectFiles> {
    if (!session.projectData.selectedTemplate) {
      throw new Error('No template selected');
    }

    // Get template configuration
    const templateConfig: TemplateConfig = {
      templateId: session.projectData.selectedTemplate,
      projectName: session.projectData.name || 'my-project',
      variables: {
        projectName: session.projectData.name || 'my-project',
        description: session.projectData.description || '',
        ...session.projectData.customizations,
      },
    };

    // Generate base project files from template
    const projectFiles = await projectTemplates.generateProjectFromTemplate(templateConfig);

    // Add integration-specific files
    if (session.projectData.integrations) {
      const integrationFiles = await integrationSetup.generateIntegrationFiles(
        session.projectData.integrations,
        session.projectData.customizations?.integrations || {},
      );

      // Merge integration files
      for (const [path, content] of Object.entries(integrationFiles)) {
        projectFiles[path] = content;
      }
    }

    // Apply scaffolding enhancements
    const enhancedFiles = await projectScaffolding.enhanceProjectFiles(
      projectFiles,
      session.projectData.analysis?.recommendations || {} as any,
    );

    return enhancedFiles;
  }

  private async generateContainerConfig(session: WizardSession): Promise<any> {
    const {analysis} = session.projectData;
    if (!analysis) {
      throw new Error('Project analysis not available');
    }

    const { frontend, backend, database } = analysis.recommendations;

    return {
      version: '3.8',
      services: {
        frontend: {
          build: './frontend',
          ports: ['3000:3000'],
          environment: {
            NODE_ENV: 'development',
            REACT_APP_API_URL: 'http://localhost:8000',
          },
          volumes: ['./frontend:/app', '/app/node_modules'],
          depends_on: ['backend'],
        },
        backend: {
          build: './backend',
          ports: ['8000:8000'],
          environment: {
            NODE_ENV: 'development',
            DATABASE_URL: this.getDatabaseUrl(database.specific),
          },
          volumes: ['./backend:/app', '/app/node_modules'],
          depends_on: database.specific === 'postgresql' ? ['postgres'] : 
            database.specific === 'mongodb' ? ['mongo'] : [],
        },
        ...(database.specific === 'postgresql' && {
          postgres: {
            image: 'postgres:15',
            environment: {
              POSTGRES_DB: session.projectData.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'myapp',
              POSTGRES_USER: 'postgres',
              POSTGRES_PASSWORD: 'password',
            },
            ports: ['5432:5432'],
            volumes: ['postgres_data:/var/lib/postgresql/data'],
          },
        }),
        ...(database.specific === 'mongodb' && {
          mongo: {
            image: 'mongo:7',
            environment: {
              MONGO_INITDB_DATABASE: session.projectData.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'myapp',
            },
            ports: ['27017:27017'],
            volumes: ['mongo_data:/data/db'],
          },
        }),
        ...(database.specific === 'redis' && {
          redis: {
            image: 'redis:7-alpine',
            ports: ['6379:6379'],
            volumes: ['redis_data:/data'],
          },
        }),
      },
      volumes: {
        ...(database.specific === 'postgresql' && { postgres_data: {} }),
        ...(database.specific === 'mongodb' && { mongo_data: {} }),
        ...(database.specific === 'redis' && { redis_data: {} }),
      },
    };
  }

  private getDatabaseUrl(database: string): string {
    switch (database) {
      case 'postgresql':
        return 'postgresql://postgres:password@postgres:5432/myapp';
      case 'mongodb':
        return 'mongodb://mongo:27017/myapp';
      case 'mysql':
        return 'mysql://root:password@mysql:3306/myapp';
      default:
        return '';
    }
  }

  private async generateDeploymentInstructions(session: WizardSession): Promise<string[]> {
    const {analysis} = session.projectData;
    const deploymentPlatform = analysis?.recommendations.deployment.platform || 'vercel';
    
    const instructions: string[] = [
      '# Deployment Instructions',
      '',
      '## Prerequisites',
      '- Docker and Docker Compose installed',
      '- Git repository initialized',
      '- Environment variables configured',
    ];

    if (deploymentPlatform.includes('vercel') || deploymentPlatform.includes('netlify')) {
      instructions.push(
        '',
        '## Frontend Deployment (Vercel/Netlify)',
        '1. Connect your Git repository',
        '2. Configure build settings:',
        '   - Build command: `npm run build`',
        '   - Output directory: `dist` or `build`',
        '3. Set environment variables',
        '4. Deploy!',
      );
    }

    if (deploymentPlatform.includes('railway') || deploymentPlatform.includes('heroku')) {
      instructions.push(
        '',
        '## Backend Deployment (Railway/Heroku)',
        '1. Create new project/app',
        '2. Connect your Git repository',
        '3. Configure environment variables',
        '4. Add database service if needed',
        '5. Deploy from main branch',
      );
    }

    if (deploymentPlatform.includes('aws') || deploymentPlatform.includes('azure')) {
      instructions.push(
        '',
        '## Cloud Deployment (AWS/Azure)',
        '1. Set up container registry',
        '2. Build and push Docker images',
        '3. Configure load balancer',
        '4. Set up database service',
        '5. Configure CI/CD pipeline',
      );
    }

    instructions.push(
      '',
      '## Local Development',
      '1. Clone the repository',
      '2. Copy `.env.example` to `.env`',
      '3. Run `docker-compose up -d`',
      '4. Access the application at http://localhost:3000',
    );

    return instructions;
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async getWizardPreview(sessionId: string, stepId: string): Promise<{
    projectStructure: Record<string, string>;
    configPreview: any;
    estimations: {
      complexity: number;
      timeline: string;
      cost: string;
    };
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Wizard session not found');
    }

    const projectStructure: Record<string, string> = {};
    let configPreview: any = {};
    let estimations = {
      complexity: 5,
      timeline: '2 weeks',
      cost: '$50-200/month',
    };

    // Generate preview based on current step and data
    if (session.projectData.analysis) {
      const { recommendations } = session.projectData.analysis;
      
      // Create basic project structure preview
      projectStructure['/'] = 'Project Root';
      projectStructure['/frontend/'] = `${recommendations.frontend.framework} Application`;
      projectStructure['/frontend/src/'] = 'Source Code';
      projectStructure['/frontend/public/'] = 'Static Assets';
      projectStructure['/backend/'] = `${recommendations.backend.framework} API`;
      projectStructure['/backend/src/'] = 'API Source Code';
      projectStructure['/backend/tests/'] = 'Test Files';
      projectStructure['/docker-compose.yml'] = 'Container Configuration';
      projectStructure['/README.md'] = 'Project Documentation';

      // Add database-specific structure
      if (recommendations.database.specific === 'postgresql') {
        projectStructure['/backend/migrations/'] = 'Database Migrations';
        projectStructure['/backend/seeds/'] = 'Database Seeds';
      }

      // Add integration-specific files
      if (session.projectData.integrations) {
        session.projectData.integrations.forEach(integration => {
          projectStructure[`/backend/integrations/${integration}/`] = `${integration} Integration`;
        });
      }

      // Generate config preview
      configPreview = {
        frontend: {
          framework: recommendations.frontend.framework,
          port: 3000,
          buildTool: recommendations.frontend.framework === 'vue' ? 'vite' : 'webpack',
        },
        backend: {
          framework: recommendations.backend.framework,
          language: recommendations.backend.language,
          port: 8000,
        },
        database: {
          type: recommendations.database.specific,
          port: recommendations.database.specific === 'postgresql' ? 5432 : 
            recommendations.database.specific === 'mongodb' ? 27017 : 6379,
        },
      };

      // Update estimations from analysis
      estimations = {
        complexity: session.projectData.analysis.estimatedComplexity,
        timeline: session.projectData.analysis.estimatedTimeline,
        cost: recommendations.deployment.cost,
      };
    }

    return {
      projectStructure,
      configPreview,
      estimations,
    };
  }
}

export const projectWizard = new ProjectWizardService();

// API endpoints
export const createWizardSession = api(
  { method: 'POST', path: '/wizard/session' },
  async ({ userId }: { userId: string }): Promise<WizardSession> => {
    return await projectWizard.createWizardSession(userId);
  },
);

export const getWizardSession = api(
  { method: 'GET', path: '/wizard/session/:sessionId' },
  async ({ sessionId }: { sessionId: string }): Promise<WizardSession | null> => {
    return await projectWizard.getWizardSession(sessionId);
  },
);

export const updateWizardStep = api(
  { method: 'PUT', path: '/wizard/session/:sessionId/step/:stepId' },
  async ({ 
    sessionId, 
    stepId, 
    data, 
  }: { 
    sessionId: string; 
    stepId: string; 
    data: any 
  }): Promise<WizardSession> => {
    return await projectWizard.updateWizardStep(sessionId, stepId, data);
  },
);

export const getWizardPreview = api(
  { method: 'GET', path: '/wizard/session/:sessionId/preview/:stepId' },
  async ({ sessionId, stepId }: { sessionId: string; stepId: string }) => {
    return await projectWizard.getWizardPreview(sessionId, stepId);
  },
);

export const completeWizard = api(
  { method: 'POST', path: '/wizard/session/:sessionId/complete' },
  async ({ sessionId }: { sessionId: string }) => {
    return await projectWizard.completeWizard(sessionId);
  },
);