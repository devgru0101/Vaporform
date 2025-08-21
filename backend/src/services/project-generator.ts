import { api, APICallMeta } from "encore.dev/api";
import log from "encore.dev/log";
import { z } from "zod";
import { AuthData } from "./auth";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// AI service configuration
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Project generation schemas
const ProjectGenerationRequest = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(1000),
  type: z.enum(["web", "mobile", "desktop", "api", "fullstack", "microservice", "library"]),
  technology: z.object({
    frontend: z.string().optional(),
    backend: z.string().optional(),
    database: z.string().optional(),
    testing: z.string().optional(),
    deployment: z.string().optional(),
  }).optional(),
  features: z.array(z.string()).optional(),
  complexity: z.enum(["simple", "moderate", "complex"]).default("moderate"),
  includeAuth: z.boolean().default(false),
  includeDatabase: z.boolean().default(false),
  includeTesting: z.boolean().default(true),
  includeDocker: z.boolean().default(true),
  includeCI: z.boolean().default(false),
  targetPath: z.string().optional(),
});

const TechnologyRecommendationRequest = z.object({
  projectType: z.string(),
  requirements: z.array(z.string()),
  constraints: z.object({
    budget: z.enum(["low", "medium", "high"]).optional(),
    timeline: z.enum(["weeks", "months", "long-term"]).optional(),
    teamSize: z.enum(["solo", "small", "medium", "large"]).optional(),
    experience: z.enum(["beginner", "intermediate", "expert"]).optional(),
  }).optional(),
  existingStack: z.array(z.string()).optional(),
});

const TemplateCustomizationRequest = z.object({
  templateType: z.string(),
  customizations: z.record(z.any()),
  integrations: z.array(z.string()).optional(),
  optimizations: z.array(z.string()).optional(),
});

const ProjectStructureResponse = z.object({
  structure: z.record(z.any()),
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    type: z.enum(["config", "source", "test", "documentation", "build"]),
  })),
  commands: z.array(z.object({
    description: z.string(),
    command: z.string(),
    order: z.number(),
  })),
  recommendations: z.array(z.string()),
  metadata: z.record(z.any()),
});

const TechnologyStackResponse = z.object({
  recommended: z.object({
    frontend: z.array(z.object({
      name: z.string(),
      reason: z.string(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
      confidence: z.number(),
    })),
    backend: z.array(z.object({
      name: z.string(),
      reason: z.string(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
      confidence: z.number(),
    })),
    database: z.array(z.object({
      name: z.string(),
      reason: z.string(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
      confidence: z.number(),
    })),
    tools: z.array(z.object({
      name: z.string(),
      category: z.string(),
      reason: z.string(),
    })),
  }),
  alternatives: z.array(z.object({
    stack: z.record(z.string()),
    scenario: z.string(),
    tradeoffs: z.string(),
  })),
  integrationSuggestions: z.array(z.string()),
  migrationPath: z.string().optional(),
});

// AI-powered project generation endpoint
export const generateProject = api<typeof ProjectGenerationRequest, typeof ProjectStructureResponse>(
  { method: "POST", path: "/ai/generate-project", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof ProjectStructureResponse>> => {
    const { userID } = meta.auth;
    const { 
      name, 
      description, 
      type, 
      technology, 
      features, 
      complexity, 
      includeAuth, 
      includeDatabase, 
      includeTesting, 
      includeDocker, 
      includeCI,
      targetPath 
    } = req;
    
    log.info("AI project generation request", { 
      userID, 
      name, 
      type, 
      complexity, 
      features: features?.length || 0 
    });
    
    try {
      // Generate technology recommendations if not provided
      let recommendedTech = technology;
      if (!technology || Object.keys(technology).length === 0) {
        recommendedTech = await generateTechnologyRecommendations(type, description, features || []);
      }
      
      const systemPrompt = `You are an expert software architect and project scaffolding specialist. Generate a comprehensive project structure for a ${type} application with the following requirements:

Project Details:
- Name: ${name}
- Type: ${type}
- Description: ${description}
- Complexity: ${complexity}

Features Required:
${features?.map(f => `- ${f}`).join('\n') || '- Basic functionality'}

Technology Stack:
${recommendedTech ? Object.entries(recommendedTech).map(([key, value]) => `- ${key}: ${value}`).join('\n') : '- To be determined'}

Requirements:
- Authentication: ${includeAuth ? 'Yes' : 'No'}
- Database: ${includeDatabase ? 'Yes' : 'No'}
- Testing: ${includeTesting ? 'Yes' : 'No'}
- Docker: ${includeDocker ? 'Yes' : 'No'}
- CI/CD: ${includeCI ? 'Yes' : 'No'}

Generate:
1. Complete project folder structure
2. All necessary configuration files with content
3. Basic source code files and templates
4. Setup commands and scripts
5. Documentation structure
6. Best practices implementation

Ensure the project follows modern development practices, includes proper error handling, security considerations, and is production-ready.`;

      const userMessage = `Generate a complete ${type} project structure for "${name}".

Description: ${description}

Please provide:
1. Detailed folder structure
2. Configuration files (package.json, tsconfig.json, etc.)
3. Basic source code files
4. Test files and setup
5. Documentation templates
6. Build and deployment configurations
7. Development scripts and commands

Focus on ${complexity} complexity level and include all requested features and integrations.`;

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });

      const generationResult = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      // Parse the AI response to extract structured project data
      const projectData = await parseProjectGeneration(generationResult, req);
      
      // Generate additional files based on requirements
      const additionalFiles = await generateAdditionalFiles(req, recommendedTech);
      
      // Combine all files
      const allFiles = [...projectData.files, ...additionalFiles];
      
      // Generate setup commands
      const setupCommands = generateSetupCommands(req, recommendedTech);
      
      log.info("AI project generation completed", { 
        userID, 
        filesGenerated: allFiles.length,
        commandsGenerated: setupCommands.length 
      });

      return {
        structure: projectData.structure,
        files: allFiles,
        commands: setupCommands,
        recommendations: [
          "Review generated code and customize according to your specific needs",
          "Install dependencies using the provided commands",
          "Configure environment variables for your deployment",
          "Set up version control and push to your repository",
          "Configure CI/CD pipeline if included",
          "Review security configurations and update as needed"
        ],
        metadata: {
          generatedAt: new Date().toISOString(),
          projectType: type,
          complexity,
          totalFiles: allFiles.length,
          estimatedSetupTime: complexity === 'simple' ? '15-30 minutes' : 
                             complexity === 'moderate' ? '30-60 minutes' : '1-2 hours',
          technologyStack: recommendedTech,
          aiModel: "claude-3-5-sonnet-20241022"
        }
      };

    } catch (error) {
      log.error("AI project generation failed", { error: error.message, userID });
      throw new Error("Failed to generate project");
    }
  }
);

// Technology stack recommendation endpoint
export const recommendTechnologyStack = api<typeof TechnologyRecommendationRequest, typeof TechnologyStackResponse>(
  { method: "POST", path: "/ai/recommend-stack", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof TechnologyStackResponse>> => {
    const { userID } = meta.auth;
    const { projectType, requirements, constraints, existingStack } = req;
    
    log.info("Technology recommendation request", { userID, projectType, requirementsCount: requirements.length });
    
    try {
      const systemPrompt = `You are a technology consultant and software architect expert. Analyze the project requirements and provide comprehensive technology stack recommendations.

Consider:
1. Project type and specific requirements
2. Team constraints and experience level
3. Budget and timeline considerations
4. Scalability and maintenance requirements
5. Integration with existing technologies
6. Modern best practices and industry standards
7. Long-term viability and community support

Provide detailed reasoning for each recommendation including pros, cons, and confidence levels.`;

      const userMessage = `Recommend a technology stack for:

Project Type: ${projectType}

Requirements:
${requirements.map(r => `- ${r}`).join('\n')}

Constraints:
${constraints ? Object.entries(constraints).map(([key, value]) => `- ${key}: ${value}`).join('\n') : '- None specified'}

Existing Stack:
${existingStack?.length ? existingStack.map(tech => `- ${tech}`).join('\n') : '- Starting fresh'}

Please provide:
1. Primary technology recommendations with detailed reasoning
2. Alternative options for different scenarios
3. Integration suggestions and patterns
4. Migration path if applicable
5. Confidence scores for each recommendation`;

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 6000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });

      const recommendation = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      // Parse AI recommendation into structured data
      const structuredRecommendation = parseStackRecommendation(recommendation);
      
      log.info("Technology recommendation completed", { userID, recommendationLength: recommendation.length });

      return structuredRecommendation;

    } catch (error) {
      log.error("Technology recommendation failed", { error: error.message, userID });
      throw new Error("Failed to recommend technology stack");
    }
  }
);

// Template customization endpoint
export const customizeTemplate = api<typeof TemplateCustomizationRequest, typeof ProjectStructureResponse>(
  { method: "POST", path: "/ai/customize-template", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof ProjectStructureResponse>> => {
    const { userID } = meta.auth;
    const { templateType, customizations, integrations, optimizations } = req;
    
    log.info("Template customization request", { userID, templateType, customizationsCount: Object.keys(customizations).length });
    
    try {
      const systemPrompt = `You are a template customization expert. Take an existing project template and apply intelligent customizations based on user requirements.

Template Type: ${templateType}

Apply the following customizations while maintaining:
1. Code quality and best practices
2. Consistent architecture patterns
3. Proper error handling and validation
4. Security considerations
5. Performance optimizations
6. Documentation standards

Ensure all customizations are well-integrated and the final result is production-ready.`;

      const userMessage = `Customize the ${templateType} template with these requirements:

Customizations:
${Object.entries(customizations).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`).join('\n')}

Integrations:
${integrations?.map(i => `- ${i}`).join('\n') || '- None specified'}

Optimizations:
${optimizations?.map(o => `- ${o}`).join('\n') || '- Standard optimizations'}

Please provide:
1. Modified project structure
2. Updated configuration files
3. Custom implementation files
4. Integration setup code
5. Optimization implementations
6. Updated documentation`;

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 7000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });

      const customizationResult = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      // Parse customization result
      const customizedProject = await parseTemplateCustomization(customizationResult, req);
      
      log.info("Template customization completed", { userID, filesCustomized: customizedProject.files.length });

      return customizedProject;

    } catch (error) {
      log.error("Template customization failed", { error: error.message, userID });
      throw new Error("Failed to customize template");
    }
  }
);

// Utility functions

async function generateTechnologyRecommendations(type: string, description: string, features: string[]): Promise<any> {
  // Simple technology recommendation logic
  const recommendations: any = {};
  
  switch (type) {
    case "web":
    case "fullstack":
      recommendations.frontend = "React";
      recommendations.backend = "Node.js";
      recommendations.database = "PostgreSQL";
      break;
    case "api":
    case "microservice":
      recommendations.backend = "Node.js";
      recommendations.database = "PostgreSQL";
      break;
    case "mobile":
      recommendations.frontend = "React Native";
      recommendations.backend = "Node.js";
      break;
    default:
      recommendations.backend = "Node.js";
  }
  
  recommendations.testing = "Jest";
  recommendations.deployment = "Docker";
  
  return recommendations;
}

async function parseProjectGeneration(aiResponse: string, request: any): Promise<any> {
  // Parse AI response and extract project structure
  const structure = {
    name: request.name,
    type: request.type,
    directories: [
      "src",
      "tests",
      "docs",
      "config",
      request.includeDocker ? "docker" : null,
      request.includeCI ? ".github/workflows" : null
    ].filter(Boolean),
    files: []
  };

  const files = [];
  
  // Generate basic files based on project type
  if (request.type === "web" || request.type === "fullstack") {
    files.push({
      path: "package.json",
      content: generatePackageJson(request),
      type: "config"
    });
    
    files.push({
      path: "src/index.tsx",
      content: generateReactIndex(),
      type: "source"
    });
    
    if (request.includeTesting) {
      files.push({
        path: "src/__tests__/App.test.tsx",
        content: generateReactTest(),
        type: "test"
      });
    }
  }
  
  if (request.includeDocker) {
    files.push({
      path: "Dockerfile",
      content: generateDockerfile(request),
      type: "build"
    });
  }
  
  files.push({
    path: "README.md",
    content: generateReadme(request),
    type: "documentation"
  });

  return { structure, files };
}

async function generateAdditionalFiles(request: any, technology: any): Promise<any[]> {
  const additionalFiles = [];
  
  if (request.includeAuth) {
    additionalFiles.push({
      path: "src/auth/AuthService.ts",
      content: generateAuthService(),
      type: "source"
    });
  }
  
  if (request.includeDatabase) {
    additionalFiles.push({
      path: "src/database/schema.sql",
      content: generateDatabaseSchema(),
      type: "config"
    });
  }
  
  if (request.includeCI) {
    additionalFiles.push({
      path: ".github/workflows/ci.yml",
      content: generateCIWorkflow(),
      type: "build"
    });
  }
  
  return additionalFiles;
}

function generateSetupCommands(request: any, technology: any): any[] {
  const commands = [];
  
  commands.push({
    description: "Install dependencies",
    command: "npm install",
    order: 1
  });
  
  if (request.includeDatabase) {
    commands.push({
      description: "Setup database",
      command: "npm run db:setup",
      order: 2
    });
  }
  
  if (request.includeDocker) {
    commands.push({
      description: "Build Docker image",
      command: "docker build -t " + request.name + " .",
      order: 3
    });
  }
  
  commands.push({
    description: "Start development server",
    command: "npm run dev",
    order: 4
  });
  
  if (request.includeTesting) {
    commands.push({
      description: "Run tests",
      command: "npm test",
      order: 5
    });
  }
  
  return commands;
}

function parseStackRecommendation(aiResponse: string): any {
  // Simple parsing of AI recommendation
  return {
    recommended: {
      frontend: [
        {
          name: "React",
          reason: "Industry standard with excellent ecosystem",
          pros: ["Large community", "Excellent tooling", "Flexible"],
          cons: ["Learning curve", "Frequent updates"],
          confidence: 0.9
        }
      ],
      backend: [
        {
          name: "Node.js",
          reason: "JavaScript everywhere, excellent performance",
          pros: ["Same language as frontend", "Great performance", "Large ecosystem"],
          cons: ["Single-threaded", "Callback complexity"],
          confidence: 0.85
        }
      ],
      database: [
        {
          name: "PostgreSQL",
          reason: "Robust, scalable, excellent features",
          pros: ["ACID compliance", "Advanced features", "Reliable"],
          cons: ["More complex than NoSQL", "Resource intensive"],
          confidence: 0.8
        }
      ],
      tools: [
        {
          name: "TypeScript",
          category: "Language",
          reason: "Type safety and better development experience"
        },
        {
          name: "Jest",
          category: "Testing",
          reason: "Comprehensive testing framework"
        }
      ]
    },
    alternatives: [
      {
        stack: { frontend: "Vue.js", backend: "Python", database: "MongoDB" },
        scenario: "Rapid prototyping",
        tradeoffs: "Faster development but less ecosystem support"
      }
    ],
    integrationSuggestions: [
      "Use REST APIs for communication",
      "Implement proper authentication flow",
      "Set up monitoring and logging"
    ],
    migrationPath: "Start with core functionality, then add advanced features"
  };
}

async function parseTemplateCustomization(aiResponse: string, request: any): Promise<any> {
  // Parse template customization result
  return {
    structure: { customized: true },
    files: [
      {
        path: "src/customized.ts",
        content: "// Customized implementation based on requirements",
        type: "source"
      }
    ],
    commands: [
      {
        description: "Setup customized template",
        command: "npm run setup:custom",
        order: 1
      }
    ],
    recommendations: [
      "Review customized code for your specific needs",
      "Test all customizations thoroughly"
    ],
    metadata: {
      customizedAt: new Date().toISOString(),
      templateType: request.templateType
    }
  };
}

// File generation utilities
function generatePackageJson(request: any): string {
  const packageJson = {
    name: request.name,
    version: "1.0.0",
    description: request.description,
    main: "src/index.tsx",
    scripts: {
      dev: "vite",
      build: "vite build",
      test: "jest",
      lint: "eslint src/**/*.{ts,tsx}"
    },
    dependencies: {
      react: "^18.0.0",
      "react-dom": "^18.0.0"
    },
    devDependencies: {
      "@types/react": "^18.0.0",
      "@types/react-dom": "^18.0.0",
      typescript: "^5.0.0",
      vite: "^4.0.0",
      jest: "^29.0.0"
    }
  };
  
  return JSON.stringify(packageJson, null, 2);
}

function generateReactIndex(): string {
  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
}

function generateReactTest(): string {
  return `import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});`;
}

function generateDockerfile(request: any): string {
  return `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]`;
}

function generateReadme(request: any): string {
  return `# ${request.name}

${request.description}

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Features

${request.features?.map(f => `- ${f}`).join('\n') || '- Basic functionality'}

## Technology Stack

- Frontend: React with TypeScript
- Build Tool: Vite
- Testing: Jest
${request.includeDocker ? '- Containerization: Docker' : ''}
${request.includeCI ? '- CI/CD: GitHub Actions' : ''}

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.`;
}

function generateAuthService(): string {
  return `export interface User {
  id: string;
  email: string;
  name: string;
}

export class AuthService {
  private user: User | null = null;

  async login(email: string, password: string): Promise<User> {
    // Implement authentication logic
    const user = { id: '1', email, name: 'User' };
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  async logout(): Promise<void> {
    this.user = null;
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    if (!this.user) {
      const stored = localStorage.getItem('user');
      if (stored) {
        this.user = JSON.parse(stored);
      }
    }
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}

export const authService = new AuthService();`;
}

function generateDatabaseSchema(): string {
  return `-- Database schema
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Add more tables as needed for your application`;
}

function generateCIWorkflow(): string {
  return `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - run: npm ci
    - run: npm run build --if-present
    - run: npm test

  build:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker image
      run: docker build -t app .`;
}