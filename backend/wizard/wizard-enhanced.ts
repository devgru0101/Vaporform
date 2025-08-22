import { api, APIError } from "encore.dev/api";
import log from "encore.dev/log";
import { AuthData } from "../auth/auth";

// Import service definition
import "./encore.service";

// Enhanced Wizard interfaces for 4-step project creation
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

// Project Vision Data (Step 1)
export interface ProjectVisionData {
  name: string;
  description: string;
  coreFeatures: string;
  targetAudience: string;
  inspirationApps: string[];
  projectGoals: string[];
  projectType?: string;
}

// Tech Stack Data (Step 2)
export interface TechStackData {
  selectedTemplate: string;
  databaseType: string;
  stylingFramework: string;
  testingFramework: string;
  packageManager: string;
  customTechStack?: {
    backend: string;
    frontend: string;
    database: string;
    hosting: string;
  };
}

// Integration Data (Step 3)
export interface IntegrationData {
  auth: {
    enabled: boolean;
    provider?: string;
    config?: Record<string, any>;
  };
  payments: {
    enabled: boolean;
    provider?: string;
    config?: Record<string, any>;
  };
  analytics: {
    enabled: boolean;
    provider?: string;
    config?: Record<string, any>;
  };
  storage: {
    enabled: boolean;
    provider?: string;
    config?: Record<string, any>;
  };
  ai: {
    enabled: boolean;
    provider?: string;
    config?: Record<string, any>;
  };
  [key: string]: {
    enabled: boolean;
    provider?: string;
    config?: Record<string, any>;
  };
}

// Complete Project Creation Request (Step 4)
export interface ProjectCreationRequest {
  vision: ProjectVisionData;
  techStack: TechStackData;
  integrations: IntegrationData;
  userId: string;
}

// Enhanced Template interface
export interface EnhancedTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: number;
  techStack: {
    frontend: string;
    backend: string;
    database: string;
    hosting?: string;
  };
  features: string[];
  supportedIntegrations: string[];
  variables: {
    name: string;
    type: 'string' | 'boolean' | 'number' | 'select' | 'multiselect';
    description: string;
    required: boolean;
    default?: any;
    options?: string[];
  }[];
  prerequisites: string[];
  fileStructure: Record<string, string>;
  configFiles: {
    [key: string]: any;
  };
}

// AI Analysis interface
export interface ProjectAnalysis {
  requirements: {
    name: string;
    description: string;
    features: string[];
    userType: 'beginner' | 'intermediate' | 'advanced';
    timeline: 'quick' | 'standard' | 'comprehensive';
    scalability: 'small' | 'medium' | 'large' | 'enterprise';
    budget: 'minimal' | 'standard' | 'premium';
    customFeatures: string[];
    targetAudience?: string;
    projectGoals?: string[];
    inspirationApps?: string[];
  };
  recommendations: {
    frontend: {
      framework: string;
      reasoning: string;
      alternatives: string[];
      complexity: number;
      learningCurve: number;
    };
    backend: {
      framework: string;
      language: string;
      reasoning: string;
      alternatives: string[];
      complexity: number;
      learningCurve: number;
    };
    database: {
      type: string;
      specific: string;
      reasoning: string;
      alternatives: string[];
      complexity: number;
    };
    integrations: {
      name: string;
      purpose: string;
      priority: 'essential' | 'recommended' | 'optional';
      complexity: number;
    }[];
    deployment: {
      platform: string;
      reasoning: string;
      alternatives: string[];
      complexity: number;
      cost: string;
    };
  };
  estimatedComplexity: number;
  estimatedTimeline: string;
  riskFactors: string[];
  successFactors: string[];
}

// Request/Response interfaces
interface AnalyzeVisionRequest {
  vision: ProjectVisionData;
}

interface RecommendStackRequest {
  vision: ProjectVisionData;
  analysis?: ProjectAnalysis;
}

interface ValidateIntegrationsRequest {
  selectedTemplate: string;
  selectedIntegrations: string[];
}

interface CreateProjectRequest {
  projectName: string;
  projectDescription: string;
  selectedTemplate: string;
  userId: string;
}

// Enhanced project templates for comprehensive wizard
const projectTemplates: EnhancedTemplate[] = [
  {
    id: 'encore-react',
    name: 'Encore.ts + React',
    description: 'Full-stack TypeScript application with Encore.ts backend and React frontend',
    category: 'fullstack',
    complexity: 3,
    techStack: {
      frontend: 'React',
      backend: 'Encore.ts',
      database: 'PostgreSQL',
      hosting: 'Encore Cloud'
    },
    features: ['TypeScript', 'React Router', 'Tailwind CSS', 'Authentication', 'Real-time APIs', 'Auto-deployment'],
    supportedIntegrations: ['auth', 'payments', 'analytics', 'storage', 'ai'],
    variables: [
      {
        name: 'appName',
        type: 'string',
        description: 'Application name',
        required: true,
        default: 'My Encore App'
      },
      {
        name: 'useAuth',
        type: 'boolean',
        description: 'Include authentication system',
        required: false,
        default: true
      }
    ],
    prerequisites: ['Node.js', 'Encore CLI'],
    fileStructure: {
      'backend/main.ts': 'Encore.ts main entry point',
      'backend/auth/auth.ts': 'Authentication service',
      'backend/api/api.ts': 'API endpoints',
      'frontend/src/App.tsx': 'React application',
      'frontend/src/components/': 'React components',
      'package.json': 'Project dependencies'
    },
    configFiles: {
      'encore.app': 'Encore application configuration',
      'tsconfig.json': 'TypeScript configuration',
      'tailwind.config.js': 'Tailwind CSS configuration'
    }
  },
  {
    id: 'encore-go',
    name: 'Encore.go + React',
    description: 'High-performance application with Encore.go backend and React frontend',
    category: 'fullstack',
    complexity: 4,
    techStack: {
      frontend: 'React',
      backend: 'Encore.go',
      database: 'PostgreSQL',
      hosting: 'Encore Cloud'
    },
    features: ['Go performance', 'React frontend', 'gRPC APIs', 'Distributed tracing', 'Auto-scaling'],
    supportedIntegrations: ['auth', 'payments', 'analytics', 'storage'],
    variables: [
      {
        name: 'appName',
        type: 'string',
        description: 'Application name',
        required: true,
        default: 'My Go App'
      }
    ],
    prerequisites: ['Go', 'Node.js', 'Encore CLI'],
    fileStructure: {
      'backend/main.go': 'Go main entry point',
      'backend/auth/auth.go': 'Authentication service',
      'backend/api/api.go': 'API endpoints',
      'frontend/src/App.tsx': 'React application'
    },
    configFiles: {
      'encore.app': 'Encore application configuration',
      'go.mod': 'Go module dependencies'
    }
  },
  {
    id: 'hybrid-stack',
    name: 'Hybrid Full-Stack',
    description: 'Flexible stack supporting multiple frameworks and databases',
    category: 'fullstack',
    complexity: 4,
    techStack: {
      frontend: 'Configurable',
      backend: 'Configurable',
      database: 'Configurable',
      hosting: 'Configurable'
    },
    features: ['Multiple framework support', 'Database flexibility', 'Custom configurations'],
    supportedIntegrations: ['auth', 'payments', 'analytics', 'storage', 'ai'],
    variables: [
      {
        name: 'frontendFramework',
        type: 'select',
        description: 'Frontend framework',
        required: true,
        options: ['React', 'Vue', 'Angular', 'Svelte']
      },
      {
        name: 'backendFramework',
        type: 'select',
        description: 'Backend framework',
        required: true,
        options: ['Encore.ts', 'Node.js', 'Python', 'Go', 'Java']
      }
    ],
    prerequisites: ['Node.js'],
    fileStructure: {},
    configFiles: {}
  },
  {
    id: 'react-spa',
    name: 'React SPA',
    description: 'Single Page Application with React and modern tooling',
    category: 'frontend',
    complexity: 2,
    techStack: {
      frontend: 'React',
      backend: 'None',
      database: 'None',
      hosting: 'Vercel/Netlify'
    },
    features: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Testing'],
    supportedIntegrations: ['analytics', 'auth'],
    variables: [
      {
        name: 'appName',
        type: 'string',
        description: 'Application name',
        required: true,
        default: 'My React SPA'
      }
    ],
    prerequisites: ['Node.js'],
    fileStructure: {
      'src/App.tsx': 'Main React component',
      'src/components/': 'React components',
      'package.json': 'Dependencies'
    },
    configFiles: {
      'vite.config.ts': 'Vite configuration',
      'tsconfig.json': 'TypeScript configuration'
    }
  }
];

// Analyze project vision (Step 1)
export const analyzeVision = api(
  { method: "POST", path: "/api/projects/analyze-vision", expose: true },
  async ({ vision }: AnalyzeVisionRequest): Promise<ProjectAnalysis> => {
    log.info("Analyze project vision request", { projectName: vision.name });

    // Enhanced AI-powered analysis based on project vision
    const complexityScore = calculateComplexity(vision);
    const projectType = detectProjectType(vision);
    
    const analysis: ProjectAnalysis = {
      requirements: {
        name: vision.name,
        description: vision.description,
        features: [vision.coreFeatures],
        userType: complexityScore < 4 ? 'beginner' : complexityScore < 7 ? 'intermediate' : 'advanced',
        timeline: complexityScore < 4 ? 'quick' : complexityScore < 7 ? 'standard' : 'comprehensive',
        scalability: determineScalability(vision),
        budget: 'standard',
        customFeatures: [],
        targetAudience: vision.targetAudience,
        projectGoals: vision.projectGoals,
        inspirationApps: vision.inspirationApps
      },
      recommendations: generateRecommendations(vision, projectType, complexityScore),
      estimatedComplexity: complexityScore,
      estimatedTimeline: estimateTimeline(complexityScore),
      riskFactors: identifyRiskFactors(vision),
      successFactors: identifySuccessFactors(vision)
    };

    log.info("Project vision analysis completed", { projectType, complexity: complexityScore });

    return analysis;
  }
);

// Recommend tech stack (Step 2)
export const recommendStack = api(
  { method: "POST", path: "/api/projects/recommend-stack", expose: true },
  async ({ vision, analysis }: RecommendStackRequest): Promise<{ recommendations: any[] }> => {
    log.info("Recommend tech stack request", { projectName: vision.name });

    const recommendations = projectTemplates.map(template => {
      const suitabilityScore = calculateTemplateSuitability(template, vision, analysis);
      
      return {
        template,
        suitabilityScore,
        reasoning: generateSuitabilityReasoning(template, vision, suitabilityScore),
        pros: getTemplatePros(template, vision),
        cons: getTemplateCons(template, vision),
        estimatedEffort: estimateImplementationEffort(template, vision)
      };
    }).sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    log.info("Tech stack recommendations generated", { recommendationsCount: recommendations.length });

    return { recommendations };
  }
);

// Validate integrations (Step 3)
export const validateIntegrations = api(
  { method: "POST", path: "/api/integrations/validate", expose: true },
  async (req: ValidateIntegrationsRequest): Promise<{ 
    validation: { isValid: boolean; errors: string[]; warnings: string[] }
  }> => {
    const { selectedTemplate, selectedIntegrations } = req;
    log.info("Validate integrations request", { selectedTemplate });

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate each enabled integration
    Object.entries(integrations).forEach(([key, integration]) => {
      if (integration.enabled) {
        const validationResult = validateIntegration(key, integration, techStack);
        errors.push(...validationResult.errors);
        warnings.push(...validationResult.warnings);
      }
    });

    // Check template compatibility
    const template = projectTemplates.find(t => t.id === techStack.selectedTemplate);
    if (template) {
      Object.keys(integrations).forEach(integrationType => {
        if (integrations[integrationType].enabled && !template.supportedIntegrations.includes(integrationType)) {
          warnings.push(`${integrationType} integration may require additional configuration with ${template.name}`);
        }
      });
    }

    const validation = {
      isValid: errors.length === 0,
      errors,
      warnings
    };

    log.info("Integration validation completed", { isValid: validation.isValid, errorsCount: errors.length });

    return { validation };
  }
);

// Get available templates
export const getEnhancedTemplates = api(
  { method: "GET", path: "/api/templates", expose: true },
  async (): Promise<{ templates: EnhancedTemplate[] }> => {
    log.info("Get enhanced templates request");

    return { templates: projectTemplates };
  }
);

// Create complete project (Step 4)
export const createProject = api(
  { method: "POST", path: "/api/projects/create", expose: true },
  async (req: CreateProjectRequest): Promise<{
    projectId: string;
    files: Record<string, string>;
    deploymentInstructions: string[];
    nextSteps: string[];
  }> => {
    const { projectName, projectDescription, selectedTemplate, userId } = req;
    log.info("Create project request", { projectName });

    const projectId = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate project files based on template and configurations
    const template = projectTemplates.find(t => t.id === projectData.techStack.selectedTemplate);
    if (!template) {
      throw APIError.invalidArgument(`Template ${projectData.techStack.selectedTemplate} not found`);
    }

    const files = await generateProjectFiles(template, projectData);
    const deploymentInstructions = generateDeploymentInstructions(template, projectData);
    const nextSteps = generateNextSteps(template, projectData);

    // Store project in database (mock for now)
    const newProject = {
      id: projectId,
      name: projectData.vision.name,
      description: projectData.vision.description,
      template: projectData.techStack.selectedTemplate,
      integrations: Object.keys(projectData.integrations).filter(key => projectData.integrations[key].enabled),
      userId: projectData.userId,
      createdAt: new Date(),
      files
    };

    log.info("Project created successfully", { projectId, filesCount: Object.keys(files).length });

    return {
      projectId,
      files,
      deploymentInstructions,
      nextSteps
    };
  }
);

// Generate project files and return as downloadable content
export const generateProject = api(
  { method: "POST", path: "/api/projects/generate", expose: true },
  async ({ projectData }: CreateProjectRequest): Promise<{
    projectId: string;
    projectStructure: Record<string, string>;
    downloadUrl?: string;
    status: 'generated' | 'error';
  }> => {
    log.info("Generate project request", { projectName: projectData.vision.name });

    try {
      const projectId = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const template = projectTemplates.find(t => t.id === projectData.techStack.selectedTemplate);
      if (!template) {
        throw APIError.invalidArgument(`Template ${projectData.techStack.selectedTemplate} not found`);
      }

      const projectStructure = await generateProjectFiles(template, projectData);

      log.info("Project generation completed", { projectId, filesCount: Object.keys(projectStructure).length });

      return {
        projectId,
        projectStructure,
        status: 'generated'
      };
    } catch (error) {
      log.error("Project generation failed", { error: (error as Error).message });
      throw APIError.internal("Failed to generate project");
    }
  }
);

// Helper functions for AI analysis
function calculateComplexity(vision: ProjectVisionData): number {
  let score = 0;
  
  // Base complexity from description length and features
  score += Math.min(3, vision.description.length / 100);
  score += Math.min(3, vision.coreFeatures.length / 150);
  
  // Complexity indicators in text
  const complexityKeywords = ['real-time', 'scalable', 'microservices', 'ai', 'machine learning', 'analytics', 'payment', 'multi-tenant'];
  const description = (vision.description + ' ' + vision.coreFeatures).toLowerCase();
  complexityKeywords.forEach(keyword => {
    if (description.includes(keyword)) score += 1;
  });
  
  // Goals and inspiration apps
  score += Math.min(2, vision.projectGoals.length / 2);
  score += Math.min(2, vision.inspirationApps.length / 2);
  
  return Math.min(10, Math.max(1, Math.round(score)));
}

function detectProjectType(vision: ProjectVisionData): string {
  const content = (vision.description + ' ' + vision.coreFeatures).toLowerCase();
  
  if (content.includes('e-commerce') || content.includes('shop') || content.includes('marketplace')) {
    return 'E-commerce Platform';
  }
  if (content.includes('social') || content.includes('community') || content.includes('chat')) {
    return 'Social Platform';
  }
  if (content.includes('dashboard') || content.includes('analytics') || content.includes('metrics')) {
    return 'Analytics Dashboard';
  }
  if (content.includes('blog') || content.includes('cms') || content.includes('content')) {
    return 'Content Management';
  }
  if (content.includes('api') || content.includes('service') || content.includes('backend')) {
    return 'API Service';
  }
  
  return 'Web Application';
}

function determineScalability(vision: ProjectVisionData): 'small' | 'medium' | 'large' | 'enterprise' {
  const content = (vision.description + ' ' + vision.coreFeatures + ' ' + vision.targetAudience).toLowerCase();
  
  if (content.includes('enterprise') || content.includes('million') || content.includes('global')) {
    return 'enterprise';
  }
  if (content.includes('thousand') || content.includes('scale') || content.includes('growth')) {
    return 'large';
  }
  if (content.includes('hundreds') || content.includes('local') || content.includes('regional')) {
    return 'medium';
  }
  
  return 'small';
}

function generateRecommendations(vision: ProjectVisionData, projectType: string, complexity: number) {
  // Generate contextual recommendations based on project analysis
  return {
    frontend: {
      framework: complexity > 6 ? 'React' : 'React',
      reasoning: 'React provides excellent scalability and ecosystem support for complex applications',
      alternatives: ['Vue.js', 'Angular', 'Svelte'],
      complexity: complexity > 6 ? 4 : 3,
      learningCurve: 3
    },
    backend: {
      framework: 'Encore.ts',
      language: 'TypeScript',
      reasoning: 'Encore.ts provides type-safe APIs, automatic deployment, and excellent developer experience',
      alternatives: ['Node.js + Express', 'Python + FastAPI', 'Go'],
      complexity: 3,
      learningCurve: 2
    },
    database: {
      type: 'SQL',
      specific: complexity > 7 ? 'PostgreSQL + Redis' : 'PostgreSQL',
      reasoning: 'PostgreSQL offers reliability and scalability, Redis for caching if needed',
      alternatives: ['MySQL', 'MongoDB', 'SQLite'],
      complexity: complexity > 7 ? 4 : 3
    },
    integrations: generateIntegrationRecommendations(vision, projectType),
    deployment: {
      platform: 'Encore Cloud',
      reasoning: 'Automatic deployment, monitoring, and scaling built-in',
      alternatives: ['Vercel', 'AWS', 'Google Cloud'],
      complexity: 2,
      cost: 'Free tier available'
    }
  };
}

function generateIntegrationRecommendations(vision: ProjectVisionData, projectType: string) {
  const recommendations = [];
  
  // Always recommend auth for user-facing apps
  recommendations.push({
    name: 'Authentication',
    purpose: 'User authentication and authorization',
    priority: 'essential' as const,
    complexity: 3
  });
  
  // E-commerce specific
  if (projectType === 'E-commerce Platform') {
    recommendations.push({
      name: 'Payment Processing',
      purpose: 'Handle payments and billing',
      priority: 'essential' as const,
      complexity: 4
    });
  }
  
  // Analytics for all projects
  recommendations.push({
    name: 'Analytics',
    purpose: 'Track user behavior and application metrics',
    priority: 'recommended' as const,
    complexity: 2
  });
  
  return recommendations;
}

function estimateTimeline(complexity: number): string {
  if (complexity <= 3) return '2-4 weeks';
  if (complexity <= 6) return '4-8 weeks';
  if (complexity <= 8) return '8-16 weeks';
  return '16+ weeks';
}

function identifyRiskFactors(vision: ProjectVisionData): string[] {
  const risks = [];
  const content = (vision.description + ' ' + vision.coreFeatures).toLowerCase();
  
  if (content.includes('real-time')) risks.push('Real-time functionality complexity');
  if (content.includes('payment')) risks.push('Payment processing compliance');
  if (content.includes('scale') || content.includes('million')) risks.push('Scalability requirements');
  if (content.includes('ai') || content.includes('machine learning')) risks.push('AI/ML integration complexity');
  if (vision.inspirationApps.length > 3) risks.push('Feature scope creep from multiple inspirations');
  
  risks.push('Third-party service dependencies', 'User adoption challenges');
  
  return risks;
}

function identifySuccessFactors(vision: ProjectVisionData): string[] {
  return [
    'Clear project vision and requirements',
    'Iterative development approach',
    'Comprehensive testing strategy',
    'User feedback integration',
    'Performance monitoring',
    'Security best practices',
    'Proper documentation'
  ];
}

function calculateTemplateSuitability(template: EnhancedTemplate, vision: ProjectVisionData, analysis?: ProjectAnalysis): number {
  let score = 5; // Base score
  
  // Project type matching
  const projectType = detectProjectType(vision);
  if (template.category === 'fullstack' && projectType !== 'API Service') score += 2;
  if (template.category === 'frontend' && projectType === 'API Service') score -= 2;
  
  // Complexity matching
  const complexity = analysis?.estimatedComplexity || calculateComplexity(vision);
  const complexityDiff = Math.abs(template.complexity - complexity);
  score -= complexityDiff * 0.5;
  
  // Feature matching
  const content = (vision.description + ' ' + vision.coreFeatures).toLowerCase();
  template.features.forEach(feature => {
    if (content.includes(feature.toLowerCase())) score += 0.5;
  });
  
  return Math.max(0, Math.min(10, score));
}

function generateSuitabilityReasoning(template: EnhancedTemplate, vision: ProjectVisionData, score: number): string {
  if (score >= 8) return `Excellent match: ${template.name} aligns perfectly with your project requirements and complexity.`;
  if (score >= 6) return `Good match: ${template.name} provides most features needed with minimal customization.`;
  if (score >= 4) return `Moderate match: ${template.name} can work but may require significant customization.`;
  return `Limited match: ${template.name} may not be the best fit for your project requirements.`;
}

function getTemplatePros(template: EnhancedTemplate, vision: ProjectVisionData): string[] {
  const pros = [`Includes ${template.features.join(', ')}`];
  
  if (template.techStack.backend === 'Encore.ts') {
    pros.push('Type-safe APIs', 'Automatic deployment', 'Built-in monitoring');
  }
  
  if (template.complexity <= 3) {
    pros.push('Quick to develop', 'Easy to maintain');
  }
  
  return pros;
}

function getTemplateCons(template: EnhancedTemplate, vision: ProjectVisionData): string[] {
  const cons = [];
  
  if (template.complexity > 5) {
    cons.push('Higher learning curve', 'More complex setup');
  }
  
  if (template.techStack.backend === 'Encore.go') {
    cons.push('Requires Go knowledge');
  }
  
  if (template.id === 'hybrid-stack') {
    cons.push('Requires more configuration decisions');
  }
  
  return cons.length > 0 ? cons : ['Minimal drawbacks for your use case'];
}

function estimateImplementationEffort(template: EnhancedTemplate, vision: ProjectVisionData): string {
  const complexity = calculateComplexity(vision);
  const templateComplexity = template.complexity;
  
  const totalComplexity = (complexity + templateComplexity) / 2;
  
  if (totalComplexity <= 3) return 'Low (1-2 weeks)';
  if (totalComplexity <= 6) return 'Medium (2-6 weeks)';
  if (totalComplexity <= 8) return 'High (6-12 weeks)';
  return 'Very High (12+ weeks)';
}

function validateIntegration(type: string, integration: any, techStack: TechStackData): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!integration.provider) {
    errors.push(`${type} integration requires a provider selection`);
  }
  
  // Specific validation for each integration type
  switch (type) {
    case 'auth':
      if (integration.provider === 'custom' && !integration.config?.strategy) {
        errors.push('Custom auth integration requires authentication strategy');
      }
      break;
      
    case 'payments':
      if (!integration.config?.publicKey || !integration.config?.secretKey) {
        warnings.push('Payment integration will require API keys configuration');
      }
      break;
      
    case 'analytics':
      if (!integration.config?.trackingId) {
        warnings.push('Analytics integration will require tracking ID configuration');
      }
      break;
  }
  
  return { errors, warnings };
}

async function generateProjectFiles(template: EnhancedTemplate, projectData: ProjectCreationRequest): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  
  // Generate package.json
  files['package.json'] = generatePackageJson(template, projectData);
  
  // Generate main application files based on template
  if (template.id === 'encore-react') {
    files['backend/main.ts'] = generateEncoreMain(projectData);
    files['backend/auth/auth.ts'] = generateAuthService(projectData);
    files['frontend/src/App.tsx'] = generateReactApp(projectData);
    files['frontend/src/components/Layout.tsx'] = generateLayoutComponent(projectData);
  }
  
  // Generate configuration files
  Object.entries(template.configFiles).forEach(([filename, description]) => {
    files[filename] = generateConfigFile(filename, template, projectData);
  });
  
  // Generate integration-specific files
  Object.entries(projectData.integrations).forEach(([integrationType, integration]) => {
    if (integration.enabled && integration.provider) {
      const integrationFiles = generateIntegrationFiles(integrationType, integration, template);
      Object.assign(files, integrationFiles);
    }
  });
  
  // Generate README
  files['README.md'] = generateReadme(template, projectData);
  
  return files;
}

function generatePackageJson(template: EnhancedTemplate, projectData: ProjectCreationRequest): string {
  const packageConfig = {
    name: projectData.vision.name.toLowerCase().replace(/\s+/g, '-'),
    version: '0.1.0',
    description: projectData.vision.description,
    scripts: {
      dev: template.id.includes('encore') ? 'encore run' : 'npm start',
      build: template.id.includes('encore') ? 'encore build' : 'npm run build',
      test: projectData.techStack.testingFramework === 'vitest' ? 'vitest' : 'jest'
    },
    dependencies: generateDependencies(template, projectData),
    devDependencies: generateDevDependencies(template, projectData)
  };
  
  return JSON.stringify(packageConfig, null, 2);
}

function generateDependencies(template: EnhancedTemplate, projectData: ProjectCreationRequest): Record<string, string> {
  const deps: Record<string, string> = {};
  
  if (template.techStack.backend === 'Encore.ts') {
    deps['encore.dev'] = '^1.49.0';
  }
  
  if (template.techStack.frontend === 'React') {
    deps['react'] = '^18.2.0';
    deps['react-dom'] = '^18.2.0';
  }
  
  if (projectData.techStack.stylingFramework === 'tailwind') {
    deps['tailwindcss'] = '^3.3.0';
  }
  
  // Add integration dependencies
  Object.entries(projectData.integrations).forEach(([type, integration]) => {
    if (integration.enabled) {
      switch (type) {
        case 'auth':
          if (integration.provider === 'supabase') deps['@supabase/supabase-js'] = '^2.0.0';
          break;
        case 'payments':
          if (integration.provider === 'stripe') deps['stripe'] = '^12.0.0';
          break;
      }
    }
  });
  
  return deps;
}

function generateDevDependencies(template: EnhancedTemplate, projectData: ProjectCreationRequest): Record<string, string> {
  const devDeps: Record<string, string> = {};
  
  devDeps['typescript'] = '^5.0.0';
  devDeps['@types/node'] = '^20.0.0';
  
  if (projectData.techStack.testingFramework === 'vitest') {
    devDeps['vitest'] = '^1.0.0';
  } else {
    devDeps['jest'] = '^29.0.0';
  }
  
  return devDeps;
}

function generateEncoreMain(projectData: ProjectCreationRequest): string {
  return `// ${projectData.vision.name} - Main Entry Point
// Generated by Vaporform

import "./auth/auth";
import "./api/api";

// Application configuration
export const config = {
  name: "${projectData.vision.name}",
  description: "${projectData.vision.description}"
};
`;
}

function generateAuthService(projectData: ProjectCreationRequest): string {
  const authIntegration = projectData.integrations.auth;
  
  if (!authIntegration.enabled) {
    return '// Authentication service disabled';
  }
  
  return `import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";

// ${projectData.vision.name} Authentication Service
// Provider: ${authIntegration.provider}

export interface User {
  id: string;
  email: string;
  name: string;
}

export const login = api(
  { method: "POST", path: "/auth/login", expose: true },
  async (req: { email: string; password: string }): Promise<{ token: string; user: User }> => {
    // TODO: Implement authentication logic
    throw new Error("Authentication not implemented");
  }
);

export const register = api(
  { method: "POST", path: "/auth/register", expose: true },
  async (req: { email: string; password: string; name: string }): Promise<{ user: User }> => {
    // TODO: Implement registration logic
    throw new Error("Registration not implemented");
  }
);
`;
}

function generateReactApp(projectData: ProjectCreationRequest): string {
  return `import React from 'react';
import Layout from './components/Layout';

function App() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Welcome to ${projectData.vision.name}
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              ${projectData.vision.description}
            </p>
            <div className="mt-8">
              <p className="text-lg text-gray-500">
                Core Features: ${projectData.vision.coreFeatures}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;
`;
}

function generateLayoutComponent(projectData: ProjectCreationRequest): string {
  return `import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">${projectData.vision.name}</h1>
            </div>
            <nav className="flex items-center space-x-4">
              {/* Navigation items */}
            </nav>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export default Layout;
`;
}

function generateConfigFile(filename: string, template: EnhancedTemplate, projectData: ProjectCreationRequest): string {
  switch (filename) {
    case 'encore.app':
      return `{
  "id": "${projectData.vision.name.toLowerCase().replace(/\s+/g, '-')}",
  "lang": "ts"
}`;
      
    case 'tsconfig.json':
      return JSON.stringify({
        compilerOptions: {
          target: "ES2020",
          module: "commonjs",
          lib: ["ES2020"],
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        },
        include: ["**/*.ts"],
        exclude: ["node_modules"]
      }, null, 2);
      
    case 'tailwind.config.js':
      if (projectData.techStack.stylingFramework === 'tailwind') {
        return `module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;
      }
      return '';
      
    default:
      return `// ${filename} configuration file\n// Generated by Vaporform\n`;
  }
}

function generateIntegrationFiles(type: string, integration: any, template: EnhancedTemplate): Record<string, string> {
  const files: Record<string, string> = {};
  
  switch (type) {
    case 'auth':
      if (integration.provider === 'supabase') {
        files['lib/supabase.ts'] = `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`;
      }
      break;
      
    case 'payments':
      if (integration.provider === 'stripe') {
        files['lib/stripe.ts'] = `import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});
`;
      }
      break;
  }
  
  return files;
}

function generateReadme(template: EnhancedTemplate, projectData: ProjectCreationRequest): string {
  const enabledIntegrations = Object.entries(projectData.integrations)
    .filter(([_, integration]) => integration.enabled)
    .map(([type, integration]) => `${type} (${integration.provider})`);
    
  return `# ${projectData.vision.name}

${projectData.vision.description}

## Overview

**Target Audience:** ${projectData.vision.targetAudience}

**Core Features:**
${projectData.vision.coreFeatures}

**Project Goals:**
${projectData.vision.projectGoals.map(goal => `- ${goal}`).join('\n')}

## Tech Stack

- **Template:** ${template.name}
- **Frontend:** ${template.techStack.frontend}
- **Backend:** ${template.techStack.backend}
- **Database:** ${projectData.techStack.databaseType}
- **Styling:** ${projectData.techStack.stylingFramework}
- **Testing:** ${projectData.techStack.testingFramework}
- **Package Manager:** ${projectData.techStack.packageManager}

## Integrations

${enabledIntegrations.length > 0 ? enabledIntegrations.map(integration => `- ${integration}`).join('\n') : 'No integrations configured'}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   ${projectData.techStack.packageManager} install
   \`\`\`

2. Start development server:
   \`\`\`bash
   ${projectData.techStack.packageManager === 'npm' ? 'npm run dev' : 'yarn dev'}
   \`\`\`

3. Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

Create a \`.env.local\` file with the following variables:

\`\`\`env
# Add your environment variables here
${enabledIntegrations.map(integration => `# ${integration.toUpperCase()}_API_KEY=your_api_key_here`).join('\n')}
\`\`\`

## Deployment

${template.techStack.hosting ? `This project is configured for deployment on ${template.techStack.hosting}.` : 'Configure your preferred hosting platform.'}

## Generated by Vaporform

This project was generated using Vaporform's AI-powered project wizard.
`;
}

function generateDeploymentInstructions(template: EnhancedTemplate, projectData: ProjectCreationRequest): string[] {
  const instructions = [];
  
  if (template.id.includes('encore')) {
    instructions.push(
      '1. Install Encore CLI: npm install -g @encore/cli',
      '2. Login to Encore: encore auth login',
      '3. Create Encore app: encore app create',
      '4. Deploy: encore deploy'
    );
  } else {
    instructions.push(
      '1. Build the application: npm run build',
      '2. Configure environment variables',
      '3. Deploy to your chosen platform',
      '4. Set up domain and SSL certificate'
    );
  }
  
  // Add integration-specific deployment steps
  Object.entries(projectData.integrations).forEach(([type, integration]) => {
    if (integration.enabled) {
      instructions.push(`5. Configure ${type} integration in production`);
    }
  });
  
  instructions.push(
    '6. Set up monitoring and logging',
    '7. Test all functionality in production',
    '8. Set up backup and recovery procedures'
  );
  
  return instructions;
}

function generateNextSteps(template: EnhancedTemplate, projectData: ProjectCreationRequest): string[] {
  const steps = [
    'Review and customize the generated code',
    'Configure environment variables',
    'Set up your development database',
    'Implement core business logic',
    'Add comprehensive tests',
    'Set up CI/CD pipeline'
  ];
  
  // Add integration-specific next steps
  Object.entries(projectData.integrations).forEach(([type, integration]) => {
    if (integration.enabled) {
      switch (type) {
        case 'auth':
          steps.push(`Configure ${integration.provider} authentication`);
          break;
        case 'payments':
          steps.push(`Set up ${integration.provider} payment processing`);
          break;
        case 'analytics':
          steps.push(`Configure ${integration.provider} analytics tracking`);
          break;
      }
    }
  });
  
  steps.push(
    'Optimize for production',
    'Deploy to staging environment',
    'Conduct user testing',
    'Deploy to production'
  );
  
  return steps;
}