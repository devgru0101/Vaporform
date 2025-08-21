import { api, APIError } from "encore.dev/api";
import log from "encore.dev/log";
import { AuthData } from "../auth/auth";

// Import service definition
import "./encore.service";

// Wizard interfaces
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

export interface ProjectRequirements {
  name: string;
  description: string;
  features: string[];
  userType: 'beginner' | 'intermediate' | 'advanced';
  timeline: 'quick' | 'standard' | 'comprehensive';
  scalability: 'small' | 'medium' | 'large' | 'enterprise';
  budget: 'minimal' | 'standard' | 'premium';
  customFeatures: string[];
}

export interface ProjectAnalysis {
  requirements: ProjectRequirements;
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
  architecture: {
    name: string;
    description: string;
    pros: string[];
    cons: string[];
    complexity: number;
    suitability: number;
    reasoning: string;
  }[];
  security: {
    authentication: {
      method: string;
      reasoning: string;
      implementation: string[];
    };
    authorization: {
      strategy: string;
      roles: string[];
      permissions: string[];
    };
    dataProtection: {
      encryption: string[];
      compliance: string[];
      privacy: string[];
    };
    apiSecurity: {
      rateLimit: boolean;
      cors: boolean;
      validation: string[];
    };
  };
  performance: {
    caching: {
      strategy: string;
      tools: string[];
      reasoning: string;
    };
    optimization: {
      frontend: string[];
      backend: string[];
      database: string[];
    };
    monitoring: {
      tools: string[];
      metrics: string[];
      alerting: string[];
    };
    scaling: {
      horizontal: boolean;
      vertical: boolean;
      strategies: string[];
    };
  };
  estimatedComplexity: number;
  estimatedTimeline: string;
  riskFactors: string[];
  successFactors: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: number;
  techStack: {
    frontend: string;
    backend: string;
    database: string;
  };
  features: string[];
  variables: {
    name: string;
    type: 'string' | 'boolean' | 'number' | 'select' | 'multiselect';
    description: string;
    required: boolean;
    default?: any;
    options?: string[];
  }[];
  prerequisites: string[];
}

export interface DeploymentConfig {
  platform: string;
  environment: 'development' | 'staging' | 'production';
  containerized: boolean;
  monitoring: boolean;
  backup: boolean;
  ssl: boolean;
  customDomain?: string;
  environmentVariables: Record<string, string>;
}

export interface WizardSession {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  currentStep: number;
  steps: WizardStep[];
  projectData: {
    name?: string;
    description?: string;
    analysis?: ProjectAnalysis;
    selectedTemplate?: string;
    customizations?: Record<string, any>;
    integrations?: string[];
    deploymentConfig?: DeploymentConfig;
  };
  status: 'active' | 'completed' | 'abandoned';
}

// Request/Response interfaces
interface CreateSessionRequest {
  userId: string;
}

interface AnalyzeProjectRequest {
  description?: string;
  preferences?: Partial<ProjectRequirements>;
}

interface UpdateStepRequest {
  data: any;
}

interface GeneratePreviewResponse {
  projectStructure: Record<string, string>;
  estimations: {
    cpu: string;
    memory: string;
    storage: string;
    bandwidth: string;
    cost: string;
  };
}

interface CompleteWizardResponse {
  projectFiles: Record<string, string>;
  deploymentInstructions: string[];
}

// Mock storage for wizard sessions
const wizardSessions: Map<string, WizardSession> = new Map();

// Default steps for wizard
const defaultSteps: WizardStep[] = [
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

// Mock project templates
const mockTemplates: Template[] = [
  {
    id: 'react-ts',
    name: 'React TypeScript App',
    description: 'Modern React application with TypeScript',
    category: 'web',
    complexity: 3,
    techStack: {
      frontend: 'React',
      backend: 'Node.js',
      database: 'PostgreSQL',
    },
    features: ['TypeScript', 'React Router', 'State Management', 'Testing'],
    variables: [
      {
        name: 'appName',
        type: 'string',
        description: 'Application name',
        required: true,
        default: 'My React App'
      },
      {
        name: 'useRedux',
        type: 'boolean',
        description: 'Use Redux for state management',
        required: false,
        default: true
      }
    ],
    prerequisites: ['Node.js', 'npm/yarn']
  },
  {
    id: 'vue-ts',
    name: 'Vue TypeScript App',
    description: 'Vue.js application with TypeScript',
    category: 'web',
    complexity: 2,
    techStack: {
      frontend: 'Vue',
      backend: 'Node.js',
      database: 'PostgreSQL',
    },
    features: ['TypeScript', 'Vue Router', 'Vuex', 'Testing'],
    variables: [
      {
        name: 'appName',
        type: 'string',
        description: 'Application name',
        required: true,
        default: 'My Vue App'
      }
    ],
    prerequisites: ['Node.js', 'npm/yarn']
  },
  {
    id: 'node-api',
    name: 'Node.js API',
    description: 'RESTful API with Express.js',
    category: 'api',
    complexity: 2,
    techStack: {
      frontend: 'None',
      backend: 'Node.js',
      database: 'PostgreSQL',
    },
    features: ['Express.js', 'TypeScript', 'Authentication', 'Database ORM'],
    variables: [
      {
        name: 'apiName',
        type: 'string',
        description: 'API name',
        required: true,
        default: 'My API'
      }
    ],
    prerequisites: ['Node.js', 'npm/yarn', 'Database']
  }
];

// Create wizard session
export const createSession = api(
  { method: "POST", path: "/wizard/session", expose: true },
  async ({ userId }: CreateSessionRequest): Promise<WizardSession> => {
    log.info("Create wizard session request", { userId });

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newSession: WizardSession = {
      id: sessionId,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentStep: 0,
      steps: [...defaultSteps],
      projectData: {},
      status: 'active',
    };

    wizardSessions.set(sessionId, newSession);

    log.info("Wizard session created", { sessionId, userId });

    return newSession;
  }
);

// Get wizard session
export const getSession = api(
  { method: "GET", path: "/wizard/session/:id", expose: true },
  async ({ id }: { id: string }): Promise<WizardSession> => {
    log.info("Get wizard session request", { sessionId: id });

    const session = wizardSessions.get(id);
    if (!session) {
      throw APIError.notFound("Wizard session not found");
    }

    return session;
  }
);

// Update wizard session
export const updateSession = api(
  { method: "PUT", path: "/wizard/session/:id", expose: true },
  async ({ id, ...updates }: { id: string } & Partial<WizardSession>): Promise<WizardSession> => {
    log.info("Update wizard session request", { sessionId: id });

    const session = wizardSessions.get(id);
    if (!session) {
      throw APIError.notFound("Wizard session not found");
    }

    const updatedSession: WizardSession = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    wizardSessions.set(id, updatedSession);

    log.info("Wizard session updated", { sessionId: id });

    return updatedSession;
  }
);

// Analyze project requirements
export const analyze = api(
  { method: "POST", path: "/wizard/analyze", expose: true },
  async ({ description, preferences }: AnalyzeProjectRequest): Promise<ProjectAnalysis> => {
    log.info("Analyze project request", { description, preferences });

    // Mock AI-powered analysis
    const mockAnalysis: ProjectAnalysis = {
      requirements: {
        name: preferences?.name || 'Untitled Project',
        description: description || 'No description provided',
        features: preferences?.features || ['Basic functionality'],
        userType: preferences?.userType || 'intermediate',
        timeline: preferences?.timeline || 'standard',
        scalability: preferences?.scalability || 'medium',
        budget: preferences?.budget || 'standard',
        customFeatures: preferences?.customFeatures || [],
      },
      recommendations: {
        frontend: {
          framework: 'React',
          reasoning: 'Popular, mature ecosystem, good for rapid development',
          alternatives: ['Vue.js', 'Angular', 'Svelte'],
          complexity: 3,
          learningCurve: 3,
        },
        backend: {
          framework: 'Node.js',
          language: 'TypeScript',
          reasoning: 'Fast development, JavaScript ecosystem, good performance',
          alternatives: ['Python Django', 'Java Spring', 'Go'],
          complexity: 2,
          learningCurve: 2,
        },
        database: {
          type: 'SQL',
          specific: 'PostgreSQL',
          reasoning: 'Reliable, ACID compliant, good for structured data',
          alternatives: ['MySQL', 'MongoDB', 'SQLite'],
          complexity: 2,
        },
        integrations: [
          {
            name: 'Authentication',
            purpose: 'User authentication and authorization',
            priority: 'essential',
            complexity: 3,
          },
          {
            name: 'Payment Processing',
            purpose: 'Handle payments and billing',
            priority: 'recommended',
            complexity: 4,
          }
        ],
        deployment: {
          platform: 'Vercel',
          reasoning: 'Easy deployment, good for React apps, built-in CI/CD',
          alternatives: ['AWS', 'Netlify', 'Heroku'],
          complexity: 2,
          cost: 'Free tier available',
        },
      },
      architecture: [
        {
          name: 'Monolithic',
          description: 'Single application with all components together',
          pros: ['Simple to develop', 'Easy to test', 'Simple deployment'],
          cons: ['Hard to scale specific parts', 'Technology lock-in'],
          complexity: 2,
          suitability: 8,
          reasoning: 'Good for MVP and small to medium applications',
        },
        {
          name: 'Microservices',
          description: 'Multiple independent services',
          pros: ['Scalable', 'Technology flexibility', 'Fault isolation'],
          cons: ['Complex deployment', 'Network latency', 'Data consistency'],
          complexity: 5,
          suitability: 4,
          reasoning: 'Better for large, complex applications with multiple teams',
        }
      ],
      security: {
        authentication: {
          method: 'JWT',
          reasoning: 'Stateless, scalable, widely supported',
          implementation: ['Login/Register', 'Token management', 'Refresh tokens'],
        },
        authorization: {
          strategy: 'RBAC',
          roles: ['user', 'admin'],
          permissions: ['read', 'write', 'delete'],
        },
        dataProtection: {
          encryption: ['HTTPS', 'Password hashing', 'Database encryption'],
          compliance: ['GDPR', 'CCPA'],
          privacy: ['Data anonymization', 'Right to deletion'],
        },
        apiSecurity: {
          rateLimit: true,
          cors: true,
          validation: ['Input sanitization', 'Schema validation'],
        },
      },
      performance: {
        caching: {
          strategy: 'Multi-layer',
          tools: ['Redis', 'CDN', 'Browser cache'],
          reasoning: 'Reduces database load and improves response times',
        },
        optimization: {
          frontend: ['Code splitting', 'Image optimization', 'Minification'],
          backend: ['Database indexing', 'Query optimization', 'Connection pooling'],
          database: ['Proper indexing', 'Query optimization', 'Connection pooling'],
        },
        monitoring: {
          tools: ['Application monitoring', 'Error tracking', 'Performance metrics'],
          metrics: ['Response time', 'Error rate', 'User satisfaction'],
          alerting: ['Error thresholds', 'Performance degradation'],
        },
        scaling: {
          horizontal: true,
          vertical: true,
          strategies: ['Load balancing', 'Auto-scaling', 'CDN'],
        },
      },
      estimatedComplexity: 6,
      estimatedTimeline: '4-6 weeks',
      riskFactors: [
        'Third-party API dependencies',
        'Complex business logic',
        'Performance requirements',
      ],
      successFactors: [
        'Clear requirements',
        'Good testing strategy',
        'Proper deployment pipeline',
      ],
    };

    log.info("Project analysis completed", { description });

    return mockAnalysis;
  }
);

// Update wizard step
export const updateStep = api(
  { method: "PUT", path: "/wizard/session/:sessionId/step/:stepId", expose: true },
  async ({
    sessionId,
    stepId,
    data,
  }: {
    sessionId: string;
    stepId: string;
  } & UpdateStepRequest): Promise<WizardSession> => {
    log.info("Update wizard step request", { sessionId, stepId });

    const session = wizardSessions.get(sessionId);
    if (!session) {
      throw APIError.notFound("Wizard session not found");
    }

    const step = session.steps.find(s => s.id === stepId);
    if (!step) {
      throw APIError.notFound("Wizard step not found");
    }

    step.data = data;
    step.completed = true;

    session.updatedAt = new Date().toISOString();
    wizardSessions.set(sessionId, session);

    log.info("Wizard step updated", { sessionId, stepId });

    return session;
  }
);

// Generate preview
export const generatePreview = api(
  { method: "GET", path: "/wizard/session/:sessionId/preview/:stepId", expose: true },
  async ({
    sessionId,
    stepId,
  }: {
    sessionId: string;
    stepId: string;
  }): Promise<GeneratePreviewResponse> => {
    log.info("Generate preview request", { sessionId, stepId });

    const session = wizardSessions.get(sessionId);
    if (!session) {
      throw APIError.notFound("Wizard session not found");
    }

    // Mock project structure generation
    const mockProjectStructure = {
      "package.json": JSON.stringify({
        name: session.projectData.name || "my-project",
        version: "1.0.0",
        scripts: {
          start: "react-scripts start",
          build: "react-scripts build",
          test: "react-scripts test",
        },
        dependencies: {
          react: "^18.0.0",
          "react-dom": "^18.0.0",
          typescript: "^4.9.0",
        }
      }, null, 2),
      "src/App.tsx": `import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Welcome to ${session.projectData.name || 'My Project'}</h1>
      <p>${session.projectData.description || 'A new project created with Vaporform'}</p>
    </div>
  );
}

export default App;`,
      "src/index.tsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);`,
      "README.md": `# ${session.projectData.name || 'My Project'}

${session.projectData.description || 'A new project created with Vaporform'}

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`
`,
    };

    const mockEstimations = {
      cpu: "0.5 vCPU",
      memory: "1 GB",
      storage: "10 GB",
      bandwidth: "100 GB/month",
      cost: "$10-25/month",
    };

    log.info("Preview generated", { sessionId, stepId });

    return {
      projectStructure: mockProjectStructure,
      estimations: mockEstimations,
    };
  }
);

// Complete wizard
export const complete = api(
  { method: "POST", path: "/wizard/session/:sessionId/complete", expose: true },
  async ({ sessionId }: { sessionId: string }): Promise<CompleteWizardResponse> => {
    log.info("Complete wizard request", { sessionId });

    const session = wizardSessions.get(sessionId);
    if (!session) {
      throw APIError.notFound("Wizard session not found");
    }

    // Mark all steps as completed
    session.steps.forEach(step => {
      step.completed = true;
    });

    session.status = 'completed';
    session.updatedAt = new Date().toISOString();
    wizardSessions.set(sessionId, session);

    // Mock project files generation
    const projectFiles = {
      "package.json": JSON.stringify({
        name: session.projectData.name || "my-project",
        version: "1.0.0",
        scripts: {
          start: "react-scripts start",
          build: "react-scripts build",
          test: "react-scripts test",
          eject: "react-scripts eject"
        },
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          "react-scripts": "5.0.1",
          typescript: "^4.9.5",
          "@types/react": "^18.0.28",
          "@types/react-dom": "^18.0.11"
        }
      }, null, 2),
      "public/index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${session.projectData.name || 'My Project'}</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
      "src/App.tsx": `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>${session.projectData.name || 'My Project'}</h1>
        <p>${session.projectData.description || 'Welcome to your new application!'}</p>
        <p>Built with React and TypeScript</p>
      </header>
    </div>
  );
}

export default App;`,
      "src/index.tsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      "src/App.css": `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
}`,
      "src/index.css": `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`,
      "tsconfig.json": JSON.stringify({
        compilerOptions: {
          target: "es5",
          lib: ["dom", "dom.iterable", "es6"],
          allowJs: true,
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          noFallthroughCasesInSwitch: true,
          module: "esnext",
          moduleResolution: "node",
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx"
        },
        include: ["src"]
      }, null, 2),
      ".gitignore": `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*`,
      "README.md": `# ${session.projectData.name || 'My Project'}

${session.projectData.description || 'A new React application created with Vaporform'}

## Getting Started

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

In the project directory, you can run:

#### \`npm start\`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

#### \`npm test\`

Launches the test runner in the interactive watch mode.

#### \`npm run build\`

Builds the app for production to the \`build\` folder.

#### \`npm run eject\`

**Note: this is a one-way operation. Once you \`eject\`, you can't go back!**

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
`
    };

    const deploymentInstructions = [
      "1. Install dependencies: npm install",
      "2. Run tests: npm test",
      "3. Build production version: npm run build",
      "4. Deploy build folder to your hosting platform",
      "5. Set up environment variables if needed",
      "6. Configure domain and SSL certificate",
      "7. Set up monitoring and analytics",
      "8. Test the deployed application"
    ];

    log.info("Wizard completed", { sessionId });

    return {
      projectFiles,
      deploymentInstructions,
    };
  }
);

// Get available templates
export const getTemplates = api(
  { method: "GET", path: "/wizard/templates", expose: true },
  async (): Promise<{ templates: Template[] }> => {
    log.info("Get templates request");

    return { templates: mockTemplates };
  }
);