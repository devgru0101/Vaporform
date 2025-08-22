// Type definitions for API responses and requests

// Project Analysis Types
export interface ProjectVisionData {
  name: string;
  description: string;
  coreFeatures: string;
  targetAudience: string;
  projectGoals: string[];
  inspirationApps?: string[];
}

export interface TechStackData {
  selectedTemplate: string;
  databaseType: string;
  stylingFramework: string;
  testingFramework: string;
  packageManager: string;
  additionalFeatures: string[];
  performanceRequirements?: string;
  scalabilityRequirements?: string;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  features: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  difficulty: 'easy' | 'medium' | 'hard';
  pricing: string;
  documentation: string;
  setupTime: string;
  popularity: number;
  compatibility: {
    templates: string[];
    frameworks: string[];
  };
  apiDocumentation?: string;
  supportLevel: string;
  isActive: boolean;
  logo?: string;
  tags: string[];
}

export interface IntegrationConfig {
  enabled: boolean;
  provider?: string;
  config?: Record<string, any>;
}

export interface IntegrationData {
  [key: string]: IntegrationConfig;
}

// Template Types
export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  complexity: number;
  techStack: {
    frontend: string;
    backend: string;
    database: string;
    hosting?: string;
  };
  features: string[];
  supportedIntegrations: string[];
  variables: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    defaultValue?: any;
  }>;
  prerequisites: string[];
  fileStructure: Record<string, any>;
  configFiles: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  estimatedSetupTime: string;
  maintenanceLevel: 'low' | 'medium' | 'high';
  popularity: number;
  lastUpdated: Date;
  isActive: boolean;
}

// Project Generation Types
export interface ProjectCreationRequest {
  vision: ProjectVisionData;
  techStack: TechStackData;
  integrations: IntegrationData;
  userId: string;
  sessionId?: string;
}

export interface GenerationProgressEvent {
  generationId: string;
  projectName: string;
  status: 'started' | 'analyzing' | 'templating' | 'integrating' | 'generating' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface FileMetadata {
  path: string;
  type: 'file' | 'directory';
  size: number;
  description: string;
  category: 'config' | 'source' | 'asset' | 'documentation' | 'test';
}

export interface ProjectStructure {
  directories: string[];
  files: FileMetadata[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  environmentVariables: Record<string, string>;
}

export interface GeneratedProject {
  id: string;
  name: string;
  description: string;
  userId: string;
  sessionId?: string;
  template: {
    id: string;
    name: string;
    version: string;
  };
  structure: ProjectStructure;
  files: Record<string, string>;
  integrations: string[];
  deploymentInstructions: string[];
  nextSteps: string[];
  estimatedSetupTime: string;
  status: 'generating' | 'completed' | 'error';
  generatedAt: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

// Project Analysis Types
export interface ProjectAnalysis {
  id: string;
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
      scalability: number;
    };
    database: {
      type: string;
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
  createdAt: Date;
  userId?: string;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description: string;
  type: "web" | "mobile" | "api" | "library";
  framework: string;
  language: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "archived" | "template";
}

// API Response Types
export interface APIResponse<T> {
  data?: T;
  success: boolean;
  error?: string;
  message?: string;
}

// Wizard Session Types
export interface WizardSession {
  id: string;
  userId: string;
  currentStep: number;
  data: {
    vision?: ProjectVisionData;
    techStack?: TechStackData;
    integrations?: IntegrationData;
  };
  analysis?: ProjectAnalysis;
  templates?: Template[];
  generationId?: string;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

// Error Types
export interface APIErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
}

// Progress Tracking Types
export interface ProgressUpdate {
  id: string;
  step: string;
  progress: number;
  message: string;
  timestamp: Date;
}

// Request Types for API endpoints
export interface CreateProjectRequest {
  name: string;
  description?: string;
  type: "web" | "mobile" | "api" | "library";
  framework: string;
  language: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  type?: "web" | "mobile" | "api" | "library";
  framework?: string;
  language?: string;
  status?: "active" | "archived" | "template";
}

export interface AnalyzeVisionRequest {
  vision: ProjectVisionData;
  userId: string;
}

export interface RecommendStackRequest {
  vision: ProjectVisionData;
  analysis: ProjectAnalysis;
  userId: string;
}

export interface GetProvidersRequest {
  type?: string;
  category?: string;
  difficulty?: string;
  compatibility?: string;
}

// File operations
export interface FileOperationResponse {
  success: boolean;
  path?: string;
  content?: string;
  error?: string;
}

// Authentication Types
export interface AuthData {
  userID: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}