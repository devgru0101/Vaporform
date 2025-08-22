import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { Topic, Subscription } from "encore.dev/pubsub";
import log from "encore.dev/log";

// Import service definition
import "./encore.service";

// Import interfaces from other microservices
import type { ProjectVisionData, TechStackData, IntegrationData } from "../wizard/wizard-enhanced";
import type { Template } from "../templates/templates";
import type { IntegrationConfig } from "../integrations/integrations";

// Database setup for project generation tracking
const db = new SQLDatabase("projectgeneration", {
  migrations: "./migrations",
});

// PubSub Topics for generation progress tracking
export interface GenerationProgressEvent {
  generationId: string;
  projectName: string;
  status: 'started' | 'analyzing' | 'templating' | 'integrating' | 'generating' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export const generationProgress = new Topic<GenerationProgressEvent>("generation-progress", {
  deliveryGuarantee: "at-least-once",
});

// Complete Project Creation Request interface
export interface ProjectCreationRequest {
  vision: ProjectVisionData;
  techStack: TechStackData;
  integrations: IntegrationData;
  userId: string;
  sessionId?: string;
}

// Generated Project interface
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

export interface ProjectStructure {
  directories: string[];
  files: FileMetadata[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  environmentVariables: Record<string, string>;
}

export interface FileMetadata {
  path: string;
  type: 'file' | 'directory';
  size: number;
  description: string;
  category: 'config' | 'source' | 'asset' | 'documentation' | 'test';
}

// Request/Response interfaces
interface GenerateProjectRequest {
  projectName: string;
  projectDescription: string;
  templateId: string;
  userId: string;
  sessionId?: string;
  includeTests?: boolean;
  includeDocs?: boolean;
  includeExamples?: boolean;
  optimizeForProduction?: boolean;
}

interface GetGenerationStatusRequest {
  generationId: string;
}

interface GetUserGenerationsRequest {
  userId: string;
  limit?: number;
  status?: string;
}

// Main project generation endpoint
export const generateProject = api(
  { method: "POST", path: "/projectgeneration/generate", expose: true },
  async (req: GenerateProjectRequest): Promise<{
    generationId: string;
    estimatedTime: string;
    status: string;
  }> => {
    const { 
      projectName,
      projectDescription,
      templateId,
      userId,
      sessionId,
      includeTests = true, 
      includeDocs = true, 
      includeExamples = false, 
      optimizeForProduction = false 
    } = req;
    
    log.info("Starting project generation", { 
      projectName, 
      userId 
    });

    try {
      const generationId = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Publish initial progress event
      await generationProgress.publish({
        generationId,
        projectName,
        status: 'started',
        progress: 0,
        message: 'Initializing project generation',
        timestamp: new Date()
      });

      // Start async generation process (simplified for now)
      generateProjectAsyncSimple(generationId, projectName, templateId, userId);

      const estimatedTime = "5-10 minutes";

      return {
        generationId,
        estimatedTime,
        status: 'started'
      };
    } catch (error) {
      log.error("Project generation failed to start", { error: (error as Error).message });
      throw APIError.internal("Failed to start project generation");
    }
  }
);

// Get generation status
export const getGenerationStatus = api(
  { method: "GET", path: "/projectgeneration/status/:generationId", expose: true },
  async ({ generationId }: GetGenerationStatusRequest): Promise<{
    generationId: string;
    status: string;
    progress: number;
    message: string;
    result?: GeneratedProject;
    error?: string;
  }> => {
    log.info("Getting generation status", { generationId });

    try {
      const row = await db.queryRow`
        SELECT * FROM project_generations WHERE id = ${generationId}
      `;

      if (!row) {
        throw APIError.notFound("Generation not found");
      }

      const result = row.result ? JSON.parse(row.result) : undefined;

      return {
        generationId: row.id,
        status: row.status,
        progress: row.progress,
        message: row.message || 'Processing...',
        result,
        error: row.error_message
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      log.error("Failed to get generation status", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve generation status");
    }
  }
);

// Get user's project generations
export const getUserGenerations = api(
  { method: "GET", path: "/projectgeneration/user/:userId", expose: true },
  async ({ userId, limit = 20, status }: GetUserGenerationsRequest): Promise<{
    generations: Array<{
      id: string;
      projectName: string;
      status: string;
      progress: number;
      createdAt: Date;
      completedAt?: Date;
    }>;
  }> => {
    log.info("Getting user generations", { userId, limit, status });

    try {
      let queryBase = `
        SELECT id, project_name, status, progress, created_at, completed_at
        FROM project_generations 
        WHERE user_id = ${userId}
      `;

      const rows = status 
        ? await db.queryAll`
            SELECT id, project_name, status, progress, created_at, completed_at
            FROM project_generations 
            WHERE user_id = ${userId} AND status = ${status}
            ORDER BY created_at DESC 
            LIMIT ${limit}
          `
        : await db.queryAll`
            SELECT id, project_name, status, progress, created_at, completed_at
            FROM project_generations 
            WHERE user_id = ${userId}
            ORDER BY created_at DESC 
            LIMIT ${limit}
          `;

      const generations = rows.map(row => ({
        id: row.id,
        projectName: row.project_name,
        status: row.status,
        progress: row.progress,
        createdAt: row.created_at,
        completedAt: row.completed_at
      }));

      return { generations };
    } catch (error) {
      log.error("Failed to get user generations", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve user generations");
    }
  }
);

// Download generated project
export const downloadProject = api(
  { method: "GET", path: "/projectgeneration/download/:generationId", expose: true },
  async ({ generationId }: { generationId: string }): Promise<{
    downloadUrl: string;
    expiresAt: Date;
    files: Record<string, string>;
  }> => {
    log.info("Downloading generated project", { generationId });

    try {
      const row = await db.queryRow`
        SELECT * FROM project_generations 
        WHERE id = ${generationId} AND status = 'completed'
      `;

      if (!row) {
        throw APIError.notFound("Generated project not found or not completed");
      }

      const result = JSON.parse(row.result) as GeneratedProject;
      
      // In a real implementation, this would generate a temporary download URL
      const downloadUrl = `https://api.vaporform.com/downloads/${generationId}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      return {
        downloadUrl,
        expiresAt,
        files: result.files
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      log.error("Failed to download project", { error: (error as Error).message });
      throw APIError.internal("Failed to download project");
    }
  }
);

// Async project generation function
async function generateProjectAsync(
  generationId: string, 
  projectData: ProjectCreationRequest, 
  options: any
): Promise<void> {
  try {
    // Store initial generation record
    await storeGenerationRecord(generationId, projectData, 'started', 0);

    // Step 1: Analyze project requirements (10%)
    await updateProgress(generationId, 'analyzing', 10, 'Analyzing project requirements');
    const analysis = await analyzeProjectRequirements(projectData);

    // Step 2: Load and validate template (20%)
    await updateProgress(generationId, 'templating', 20, 'Loading project template');
    const template = await loadTemplate(projectData.techStack.selectedTemplate);

    // Step 3: Configure integrations (40%)
    await updateProgress(generationId, 'integrating', 40, 'Configuring integrations');
    const integrationConfigs = await configureIntegrations(projectData.integrations, template);

    // Step 4: Generate project files (80%)
    await updateProgress(generationId, 'generating', 80, 'Generating project files');
    const generatedProject = await generateProjectFiles(
      generationId, 
      projectData, 
      template, 
      integrationConfigs, 
      options
    );

    // Step 5: Finalize and store (100%)
    await updateProgress(generationId, 'completed', 100, 'Project generation completed');
    await storeGenerationResult(generationId, generatedProject);

    log.info("Project generation completed successfully", { 
      generationId, 
      projectName: projectData.vision.name 
    });

  } catch (error) {
    log.error("Project generation failed", { 
      generationId, 
      error: (error as Error).message 
    });
    
    await updateProgress(generationId, 'error', 0, `Generation failed: ${(error as Error).message}`);
    await storeGenerationError(generationId, (error as Error).message);
  }
}

async function updateProgress(
  generationId: string, 
  status: string, 
  progress: number, 
  message: string
): Promise<void> {
  // Update database record
  await db.exec`
    UPDATE project_generations 
    SET status = ${status}, progress = ${progress}, message = ${message}, updated_at = ${new Date()}
    WHERE id = ${generationId}
  `;

  // Publish progress event
  await generationProgress.publish({
    generationId,
    projectName: '', // Would need to fetch from DB or pass along
    status: status as any,
    progress,
    message,
    timestamp: new Date()
  });
}

async function analyzeProjectRequirements(projectData: ProjectCreationRequest): Promise<any> {
  // Simulate analysis time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    complexity: calculateProjectComplexity(projectData),
    requiredFeatures: extractRequiredFeatures(projectData),
    estimatedFiles: estimateFileCount(projectData)
  };
}

async function loadTemplate(templateId: string): Promise<Template> {
  // In a real implementation, this would call the templates microservice
  // For now, return a mock template
  return {
    id: templateId,
    name: 'Mock Template',
    description: 'Mock template for testing',
    category: 'fullstack',
    version: '1.0.0',
    complexity: 3,
    techStack: {
      frontend: 'React',
      backend: 'Encore.ts',
      database: 'PostgreSQL'
    },
    features: ['TypeScript', 'React', 'Authentication'],
    supportedIntegrations: ['auth', 'payments', 'analytics'],
    variables: [],
    prerequisites: ['Node.js'],
    fileStructure: {},
    configFiles: {},
    dependencies: {},
    devDependencies: {},
    estimatedSetupTime: '15 minutes',
    maintenanceLevel: 'low',
    popularity: 100,
    lastUpdated: new Date(),
    isActive: true
  };
}

async function configureIntegrations(integrations: IntegrationData, template: Template): Promise<IntegrationConfig[]> {
  const configs: IntegrationConfig[] = [];
  
  for (const [type, integration] of Object.entries(integrations)) {
    if (integration.enabled && integration.provider) {
      // Simulate integration configuration
      configs.push({
        id: `config-${type}-${Date.now()}`,
        integrationType: type,
        provider: integration.provider,
        configuration: integration.config || {},
        environmentVariables: {},
        status: 'configured',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
  
  return configs;
}

async function generateProjectFiles(
  generationId: string,
  projectData: ProjectCreationRequest,
  template: Template,
  integrationConfigs: IntegrationConfig[],
  options: any
): Promise<GeneratedProject> {
  
  const files: Record<string, string> = {};
  
  // Generate package.json
  files['package.json'] = generatePackageJson(projectData, template, integrationConfigs);
  
  // Generate main application files
  if (template.techStack.backend === 'Encore.ts') {
    files['backend/main.ts'] = generateEncoreMain(projectData);
    files['backend/auth/auth.ts'] = generateAuthService(projectData, integrationConfigs);
    files['backend/api/api.ts'] = generateApiService(projectData);
  }
  
  if (template.techStack.frontend === 'React') {
    files['frontend/src/App.tsx'] = generateReactApp(projectData);
    files['frontend/src/components/Layout.tsx'] = generateLayoutComponent(projectData);
    files['frontend/src/index.tsx'] = generateReactIndex(projectData);
  }
  
  // Generate configuration files
  files['encore.app'] = generateEncoreConfig(projectData);
  files['tsconfig.json'] = generateTsConfig(template);
  files['README.md'] = generateReadme(projectData, template, integrationConfigs);
  files['.env.example'] = generateEnvExample(integrationConfigs);
  files['.gitignore'] = generateGitignore(template);
  
  // Generate integration-specific files
  integrationConfigs.forEach(config => {
    const integrationFiles = generateIntegrationFiles(config, template);
    Object.assign(files, integrationFiles);
  });
  
  // Generate tests if requested
  if (options.includeTests !== false) {
    files['tests/example.test.ts'] = generateExampleTest(projectData);
  }
  
  // Generate documentation if requested
  if (options.includeDocs !== false) {
    files['docs/API.md'] = generateApiDocs(projectData);
    files['docs/DEPLOYMENT.md'] = generateDeploymentDocs(template);
  }
  
  const structure = generateProjectStructure(files, template, integrationConfigs);
  const deploymentInstructions = generateDeploymentInstructions(template, integrationConfigs);
  const nextSteps = generateNextSteps(template, integrationConfigs);
  
  return {
    id: generationId,
    name: projectData.vision.name,
    description: projectData.vision.description,
    userId: projectData.userId,
    sessionId: projectData.sessionId,
    template: {
      id: template.id,
      name: template.name,
      version: template.version
    },
    structure,
    files,
    integrations: integrationConfigs.map(c => c.integrationType),
    deploymentInstructions,
    nextSteps,
    estimatedSetupTime: template.estimatedSetupTime,
    status: 'completed',
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  };
}

// File generation functions
function generatePackageJson(
  projectData: ProjectCreationRequest, 
  template: Template, 
  integrations: IntegrationConfig[]
): string {
  const packageConfig = {
    name: projectData.vision.name.toLowerCase().replace(/\s+/g, '-'),
    version: '0.1.0',
    description: projectData.vision.description,
    scripts: {
      dev: 'encore run',
      build: 'encore build',
      test: 'vitest',
      'type-check': 'tsc --noEmit'
    },
    dependencies: {
      'encore.dev': '^1.49.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      ...generateIntegrationDependencies(integrations)
    },
    devDependencies: {
      'typescript': '^5.0.0',
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0',
      'vitest': '^1.0.0'
    }
  };
  
  return JSON.stringify(packageConfig, null, 2);
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

function generateAuthService(projectData: ProjectCreationRequest, integrations: IntegrationConfig[]): string {
  const authIntegration = integrations.find(i => i.integrationType === 'auth');
  
  if (!authIntegration) {
    return '// Authentication service not configured';
  }
  
  return `import { api, APIError } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { Header } from "encore.dev/api";

// ${projectData.vision.name} Authentication Service
// Provider: ${authIntegration.provider}

interface AuthParams {
  authorization: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  email: string;
}

export const auth = authHandler<AuthParams, AuthData>(
  async ({ authorization }) => {
    const token = authorization?.replace("Bearer ", "");
    
    if (!token) {
      throw APIError.unauthenticated("Missing token");
    }
    
    // TODO: Implement ${authIntegration.provider} token validation
    
    return { userID: "user-id", email: "user@example.com" };
  }
);

export const login = api(
  { method: "POST", path: "/auth/login", expose: true },
  async (req: { email: string; password: string }) => {
    // TODO: Implement login logic with ${authIntegration.provider}
    throw new Error("Login not implemented");
  }
);
`;
}

function generateApiService(projectData: ProjectCreationRequest): string {
  return `import { api } from "encore.dev/api";

// ${projectData.vision.name} API Service

export const hello = api(
  { method: "GET", path: "/api/hello", expose: true },
  async (): Promise<{ message: string }> => {
    return { message: "Hello from ${projectData.vision.name}!" };
  }
);

export const health = api(
  { method: "GET", path: "/api/health", expose: true },
  async (): Promise<{ status: string; timestamp: Date }> => {
    return { 
      status: "healthy", 
      timestamp: new Date() 
    };
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

function generateReactIndex(projectData: ProjectCreationRequest): string {
  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
}

function generateEncoreConfig(projectData: ProjectCreationRequest): string {
  return JSON.stringify({
    id: projectData.vision.name.toLowerCase().replace(/\s+/g, '-'),
    lang: 'ts'
  }, null, 2);
}

function generateTsConfig(template: Template): string {
  return JSON.stringify({
    compilerOptions: {
      target: "ES2020",
      module: "commonjs",
      lib: ["ES2020"],
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      declaration: true,
      outDir: "./dist"
    },
    include: ["**/*.ts", "**/*.tsx"],
    exclude: ["node_modules", "dist"]
  }, null, 2);
}

function generateReadme(
  projectData: ProjectCreationRequest, 
  template: Template, 
  integrations: IntegrationConfig[]
): string {
  const enabledIntegrations = integrations.map(i => `${i.integrationType} (${i.provider})`);
  
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

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

3. Start development server:
   \`\`\`bash
   ${projectData.techStack.packageManager === 'npm' ? 'npm run dev' : 'yarn dev'}
   \`\`\`

4. Open [http://localhost:4000](http://localhost:4000) to view the application.

## Environment Variables

Create a \`.env\` file with the following variables:

\`\`\`env
# Add your environment variables here
${integrations.map(i => Object.keys(i.environmentVariables).map(key => `${key}=your_value_here`).join('\n')).join('\n')}
\`\`\`

## Deployment

This project is configured for deployment on ${template.techStack.hosting || 'Encore Cloud'}.

## Generated by Vaporform

This project was generated using Vaporform's AI-powered project wizard.
`;
}

function generateEnvExample(integrations: IntegrationConfig[]): string {
  const envVars: string[] = [];
  
  integrations.forEach(integration => {
    envVars.push(`# ${integration.integrationType.toUpperCase()} Configuration`);
    Object.keys(integration.environmentVariables).forEach(key => {
      envVars.push(`${key}=`);
    });
    envVars.push('');
  });
  
  return envVars.join('\n');
}

function generateGitignore(template: Template): string {
  return `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Encore specific
encore.gen/
`;
}

function generateExampleTest(projectData: ProjectCreationRequest): string {
  return `import { describe, it, expect } from 'vitest';

describe('${projectData.vision.name}', () => {
  it('should have a valid project structure', () => {
    expect(true).toBe(true);
  });
  
  it('should load configuration correctly', () => {
    // Add your tests here
    expect(true).toBe(true);
  });
});
`;
}

function generateApiDocs(projectData: ProjectCreationRequest): string {
  return `# ${projectData.vision.name} API Documentation

## Overview

This document describes the API endpoints for ${projectData.vision.name}.

## Authentication

All authenticated endpoints require a valid JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <token>
\`\`\`

## Endpoints

### Health Check

\`GET /api/health\`

Returns the health status of the API.

**Response:**
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`

### Hello

\`GET /api/hello\`

Returns a greeting message.

**Response:**
\`\`\`json
{
  "message": "Hello from ${projectData.vision.name}!"
}
\`\`\`

## Error Handling

All endpoints return errors in the following format:

\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
\`\`\`
`;
}

function generateDeploymentDocs(template: Template): string {
  return `# Deployment Guide

## Prerequisites

- Node.js 18 or later
- ${template.techStack.database || 'PostgreSQL'} database
- Encore CLI installed

## Environment Setup

1. Create production environment variables
2. Configure database connection
3. Set up any required third-party services

## Deployment Steps

### Encore Cloud (Recommended)

1. Install Encore CLI:
   \`\`\`bash
   npm install -g @encore/cli
   \`\`\`

2. Login to Encore:
   \`\`\`bash
   encore auth login
   \`\`\`

3. Create Encore app:
   \`\`\`bash
   encore app create
   \`\`\`

4. Deploy:
   \`\`\`bash
   git push encore
   \`\`\`

### Docker Deployment

1. Build Docker image:
   \`\`\`bash
   encore build docker myapp:latest
   \`\`\`

2. Run container:
   \`\`\`bash
   docker run -p 4000:4000 myapp:latest
   \`\`\`

## Post-Deployment

1. Run database migrations
2. Test all endpoints
3. Set up monitoring and logging
4. Configure backup procedures
`;
}

// Helper functions
function calculateEstimatedTime(projectData: ProjectCreationRequest): string {
  const baseTime = 30; // seconds
  const complexityMultiplier = calculateProjectComplexity(projectData) * 10;
  const integrationTime = Object.values(projectData.integrations).filter(i => i.enabled).length * 5;
  
  const totalSeconds = baseTime + complexityMultiplier + integrationTime;
  
  if (totalSeconds < 60) return `${totalSeconds} seconds`;
  if (totalSeconds < 3600) return `${Math.ceil(totalSeconds / 60)} minutes`;
  return `${Math.ceil(totalSeconds / 3600)} hours`;
}

function calculateProjectComplexity(projectData: ProjectCreationRequest): number {
  let complexity = 1;
  
  complexity += projectData.vision.description.length / 100;
  complexity += projectData.vision.coreFeatures.length / 150;
  complexity += projectData.vision.projectGoals.length;
  complexity += Object.values(projectData.integrations).filter(i => i.enabled).length;
  
  return Math.min(10, Math.max(1, Math.round(complexity)));
}

function extractRequiredFeatures(projectData: ProjectCreationRequest): string[] {
  const features: string[] = [];
  
  // Extract from integrations
  Object.entries(projectData.integrations).forEach(([type, integration]) => {
    if (integration.enabled) {
      features.push(type);
    }
  });
  
  return features;
}

function estimateFileCount(projectData: ProjectCreationRequest): number {
  let fileCount = 10; // Base files
  
  fileCount += Object.values(projectData.integrations).filter(i => i.enabled).length * 2;
  fileCount += calculateProjectComplexity(projectData) * 3;
  
  return fileCount;
}

function generateProjectStructure(
  files: Record<string, string>, 
  template: Template, 
  integrations: IntegrationConfig[]
): ProjectStructure {
  const directories = Array.from(new Set(
    Object.keys(files)
      .map(path => path.split('/').slice(0, -1).join('/'))
      .filter(dir => dir.length > 0)
  ));

  const fileMetadata: FileMetadata[] = Object.keys(files).map(path => ({
    path,
    type: 'file' as const,
    size: files[path].length,
    description: getFileDescription(path),
    category: getFileCategory(path)
  }));

  return {
    directories,
    files: fileMetadata,
    dependencies: JSON.parse(generatePackageJson({} as any, template, integrations)).dependencies || {},
    devDependencies: JSON.parse(generatePackageJson({} as any, template, integrations)).devDependencies || {},
    scripts: {
      dev: 'encore run',
      build: 'encore build',
      test: 'vitest'
    },
    environmentVariables: integrations.reduce((vars, integration) => ({
      ...vars,
      ...integration.environmentVariables
    }), {})
  };
}

function getFileDescription(path: string): string {
  const fileName = path.split('/').pop() || '';
  
  if (fileName === 'package.json') return 'Project dependencies and scripts';
  if (fileName === 'README.md') return 'Project documentation';
  if (fileName === 'tsconfig.json') return 'TypeScript configuration';
  if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'TypeScript source file';
  if (fileName.endsWith('.test.ts')) return 'Test file';
  if (fileName === '.env.example') return 'Environment variables template';
  if (fileName === '.gitignore') return 'Git ignore rules';
  
  return 'Project file';
}

function getFileCategory(path: string): 'config' | 'source' | 'asset' | 'documentation' | 'test' {
  if (path.includes('test') || path.endsWith('.test.ts')) return 'test';
  if (path.endsWith('.md') || path.startsWith('docs/')) return 'documentation';
  if (path.endsWith('.json') || path.endsWith('.js') || path.endsWith('.env')) return 'config';
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'source';
  return 'asset';
}

function generateIntegrationDependencies(integrations: IntegrationConfig[]): Record<string, string> {
  const dependencies: Record<string, string> = {};
  
  integrations.forEach(integration => {
    switch (integration.integrationType) {
      case 'auth':
        if (integration.provider === 'auth0') {
          dependencies['@auth0/nextjs-auth0'] = '^3.0.0';
        }
        break;
      case 'payments':
        if (integration.provider === 'stripe') {
          dependencies['stripe'] = '^12.0.0';
        }
        break;
      case 'analytics':
        if (integration.provider === 'google-analytics') {
          dependencies['gtag'] = '^1.0.0';
        }
        break;
    }
  });
  
  return dependencies;
}

function generateIntegrationFiles(config: IntegrationConfig, template: Template): Record<string, string> {
  const files: Record<string, string> = {};
  
  switch (config.integrationType) {
    case 'auth':
      files[`lib/${config.provider}.ts`] = generateAuthIntegrationFile(config);
      break;
    case 'payments':
      files[`lib/${config.provider}.ts`] = generatePaymentIntegrationFile(config);
      break;
    case 'analytics':
      files[`lib/analytics.ts`] = generateAnalyticsIntegrationFile(config);
      break;
  }
  
  return files;
}

function generateAuthIntegrationFile(config: IntegrationConfig): string {
  return `// ${config.provider} authentication integration
// Generated by Vaporform

export const authConfig = {
  provider: '${config.provider}',
  // TODO: Configure ${config.provider} settings
};

export async function authenticateUser(credentials: any) {
  // TODO: Implement ${config.provider} authentication
  throw new Error('Authentication not implemented');
}
`;
}

function generatePaymentIntegrationFile(config: IntegrationConfig): string {
  return `// ${config.provider} payment integration
// Generated by Vaporform

export const paymentConfig = {
  provider: '${config.provider}',
  // TODO: Configure ${config.provider} settings
};

export async function processPayment(amount: number, currency: string = 'usd') {
  // TODO: Implement ${config.provider} payment processing
  throw new Error('Payment processing not implemented');
}
`;
}

function generateAnalyticsIntegrationFile(config: IntegrationConfig): string {
  return `// ${config.provider} analytics integration
// Generated by Vaporform

export const analyticsConfig = {
  provider: '${config.provider}',
  // TODO: Configure ${config.provider} settings
};

export function trackEvent(event: string, properties?: Record<string, any>) {
  // TODO: Implement ${config.provider} event tracking
  console.log('Event tracked:', event, properties);
}
`;
}

function generateDeploymentInstructions(template: Template, integrations: IntegrationConfig[]): string[] {
  const instructions = [
    'Install dependencies: npm install',
    'Set up environment variables from .env.example',
    'Run tests: npm test',
    'Build production version: npm run build'
  ];
  
  if (template.techStack.backend === 'Encore.ts') {
    instructions.push('Deploy with Encore: git push encore');
  } else {
    instructions.push('Deploy to your hosting platform');
  }
  
  integrations.forEach(integration => {
    instructions.push(`Configure ${integration.integrationType} integration in production`);
  });
  
  instructions.push(
    'Set up monitoring and logging',
    'Test all functionality in production',
    'Set up backup and recovery procedures'
  );
  
  return instructions;
}

function generateNextSteps(template: Template, integrations: IntegrationConfig[]): string[] {
  const steps = [
    'Review and customize the generated code',
    'Configure environment variables',
    'Set up your development database',
    'Implement core business logic',
    'Add comprehensive tests',
    'Set up CI/CD pipeline'
  ];
  
  integrations.forEach(integration => {
    steps.push(`Complete ${integration.integrationType} integration setup`);
  });
  
  steps.push(
    'Optimize for production',
    'Deploy to staging environment',
    'Conduct user testing',
    'Deploy to production'
  );
  
  return steps;
}

async function storeGenerationRecord(
  generationId: string, 
  projectData: ProjectCreationRequest, 
  status: string, 
  progress: number
): Promise<void> {
  await db.exec`
    INSERT INTO project_generations (
      id, user_id, session_id, project_name, project_data,
      status, progress, created_at, updated_at
    ) VALUES (
      ${generationId}, ${projectData.userId}, ${projectData.sessionId},
      ${projectData.vision.name}, ${JSON.stringify(projectData)},
      ${status}, ${progress}, ${new Date()}, ${new Date()}
    )
  `;
}

async function storeGenerationResult(generationId: string, result: GeneratedProject): Promise<void> {
  await db.exec`
    UPDATE project_generations 
    SET 
      result = ${JSON.stringify(result)},
      completed_at = ${new Date()},
      updated_at = ${new Date()}
    WHERE id = ${generationId}
  `;
}

async function storeGenerationError(generationId: string, error: string): Promise<void> {
  await db.exec`
    UPDATE project_generations 
    SET 
      error_message = ${error},
      updated_at = ${new Date()}
    WHERE id = ${generationId}
  `;
}

// Simplified async generation function
async function generateProjectAsyncSimple(
  generationId: string,
  projectName: string,
  templateId: string,
  userId: string
) {
  try {
    // Simulate project generation steps
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await generationProgress.publish({
      generationId,
      projectName,
      status: 'generating',
      progress: 50,
      message: 'Generating project files',
      timestamp: new Date()
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await generationProgress.publish({
      generationId,
      projectName,
      status: 'completed',
      progress: 100,
      message: 'Project generation completed',
      timestamp: new Date()
    });
    
    // Save to database
    await db.exec`
      INSERT INTO generations (generation_id, project_name, template_id, user_id, status, progress, created_at, updated_at)
      VALUES (${generationId}, ${projectName}, ${templateId}, ${userId}, 'completed', 100, NOW(), NOW())
    `;
    
  } catch (error) {
    log.error("Project generation failed", { generationId, error });
    await generationProgress.publish({
      generationId,
      projectName,
      status: 'error',
      progress: 0,
      message: 'Project generation failed',
      timestamp: new Date()
    });
  }
}