import { api } from 'encore.dev/api';
import { ProjectFiles } from './project-templates';
import { TechnologyRecommendation } from './project-analyzer';
import { ai } from './ai';

export interface ScaffoldingConfig {
  projectName: string;
  framework: string;
  features: string[];
  apiEndpoints: APIEndpoint[];
  dataModels: DataModel[];
  components: ComponentSpec[];
  testStrategy: 'unit' | 'integration' | 'e2e' | 'all';
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  requestBody?: {
    type: string;
    properties: Record<string, any>;
  };
  responseBody?: {
    type: string;
    properties: Record<string, any>;
  };
  authentication?: boolean;
  rateLimit?: boolean;
}

export interface DataModel {
  name: string;
  fields: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
    required: boolean;
    unique?: boolean;
    default?: any;
    validation?: string[];
  }[];
  relationships?: {
    type: 'oneToOne' | 'oneToMany' | 'manyToMany';
    target: string;
    foreignKey?: string;
  }[];
}

export interface ComponentSpec {
  name: string;
  type: 'page' | 'component' | 'layout' | 'hook' | 'service';
  props?: {
    name: string;
    type: string;
    required: boolean;
    default?: any;
  }[];
  dependencies?: string[];
  features?: string[];
}

class ProjectScaffoldingService {
  async enhanceProjectFiles(
    baseFiles: ProjectFiles,
    recommendations: TechnologyRecommendation,
  ): Promise<ProjectFiles> {
    const enhancedFiles = { ...baseFiles };

    // Add best practices files
    enhancedFiles['src/utils/constants.ts'] = this.generateConstantsFile();
    enhancedFiles['src/utils/helpers.ts'] = this.generateHelpersFile(recommendations.frontend.framework);
    enhancedFiles['src/types/index.ts'] = this.generateTypesFile();
    
    // Add error handling
    enhancedFiles['src/utils/errorHandler.ts'] = this.generateErrorHandlerFile(recommendations.frontend.framework);
    
    // Add API client
    enhancedFiles['src/services/api.ts'] = this.generateAPIClientFile(recommendations.frontend.framework);
    
    // Add configuration files
    enhancedFiles['.gitignore'] = this.generateGitignoreFile();
    enhancedFiles['.env.example'] = this.generateEnvExampleFile();
    enhancedFiles['tsconfig.json'] = this.generateTSConfigFile();
    
    // Add linting and formatting
    enhancedFiles['.eslintrc.js'] = this.generateESLintConfig(recommendations.frontend.framework);
    enhancedFiles['.prettierrc'] = this.generatePrettierConfig();
    
    // Add testing setup
    enhancedFiles['jest.config.js'] = this.generateJestConfig(recommendations.frontend.framework);
    enhancedFiles['src/setupTests.ts'] = this.generateSetupTestsFile(recommendations.frontend.framework);

    return enhancedFiles;
  }

  async generateProjectScaffolding(config: ScaffoldingConfig): Promise<ProjectFiles> {
    const files: ProjectFiles = {};

    // Generate API endpoints
    if (config.apiEndpoints.length > 0) {
      const apiFiles = await this.generateAPIFiles(config.framework, config.apiEndpoints);
      Object.assign(files, apiFiles);
    }

    // Generate data models
    if (config.dataModels.length > 0) {
      const modelFiles = await this.generateModelFiles(config.framework, config.dataModels);
      Object.assign(files, modelFiles);
    }

    // Generate components
    if (config.components.length > 0) {
      const componentFiles = await this.generateComponentFiles(config.framework, config.components);
      Object.assign(files, componentFiles);
    }

    // Generate tests
    if (config.testStrategy !== undefined) {
      const testFiles = await this.generateTestFiles(config);
      Object.assign(files, testFiles);
    }

    return files;
  }

  private async generateAPIFiles(framework: string, endpoints: APIEndpoint[]): Promise<ProjectFiles> {
    const files: ProjectFiles = {};

    if (framework === 'express' || framework === 'fastify') {
      // Generate routes
      for (const endpoint of endpoints) {
        const routeFile = this.generateExpressRoute(endpoint);
        const routeName = endpoint.path.split('/').pop() || 'index';
        files[`src/routes/${routeName}.ts`] = routeFile;
      }

      // Generate route index
      files['src/routes/index.ts'] = this.generateRouteIndex(endpoints);

      // Generate middleware
      files['src/middleware/validation.ts'] = this.generateValidationMiddleware();
      files['src/middleware/auth.ts'] = this.generateAuthMiddleware();
      files['src/middleware/rateLimit.ts'] = this.generateRateLimitMiddleware();

    } else if (framework === 'nestjs') {
      // Generate NestJS controllers and services
      for (const endpoint of endpoints) {
        const controllerFile = this.generateNestJSController(endpoint);
        const serviceFile = this.generateNestJSService(endpoint);
        const moduleName = endpoint.path.split('/')[1] || 'app';
        
        files[`src/${moduleName}/${moduleName}.controller.ts`] = controllerFile;
        files[`src/${moduleName}/${moduleName}.service.ts`] = serviceFile;
        files[`src/${moduleName}/${moduleName}.module.ts`] = this.generateNestJSModule(moduleName);
      }

    } else if (framework === 'fastapi') {
      // Generate FastAPI routes
      for (const endpoint of endpoints) {
        const routeFile = this.generateFastAPIRoute(endpoint);
        const routeName = endpoint.path.split('/').pop() || 'index';
        files[`app/routers/${routeName}.py`] = routeFile;
      }

      files['app/main.py'] = this.generateFastAPIMain(endpoints);
    }

    return files;
  }

  private async generateModelFiles(framework: string, models: DataModel[]): Promise<ProjectFiles> {
    const files: ProjectFiles = {};

    for (const model of models) {
      if (framework === 'express' || framework === 'nestjs') {
        // TypeScript models
        files[`src/models/${model.name}.ts`] = this.generateTypeScriptModel(model);
        
        // Database schema (for TypeORM)
        files[`src/entities/${model.name}.entity.ts`] = this.generateTypeORMEntity(model);
        
        // Validation schemas (Joi/Yup)
        files[`src/schemas/${model.name}.schema.ts`] = this.generateValidationSchema(model);

      } else if (framework === 'fastapi') {
        // Pydantic models
        files[`app/models/${model.name.toLowerCase()}.py`] = this.generatePydanticModel(model);
        
        // SQLAlchemy models
        files[`app/database/models/${model.name.toLowerCase()}.py`] = this.generateSQLAlchemyModel(model);
      }
    }

    return files;
  }

  private async generateComponentFiles(framework: string, components: ComponentSpec[]): Promise<ProjectFiles> {
    const files: ProjectFiles = {};

    for (const component of components) {
      if (framework === 'react') {
        files[`src/components/${component.name}/${component.name}.tsx`] = 
          await this.generateReactComponent(component);
        
        if (component.type === 'page') {
          files[`src/pages/${component.name}.tsx`] = 
            await this.generateReactPage(component);
        }
        
        if (component.type === 'hook') {
          files[`src/hooks/use${component.name}.ts`] = 
            await this.generateReactHook(component);
        }

      } else if (framework === 'vue') {
        files[`src/components/${component.name}.vue`] = 
          await this.generateVueComponent(component);
        
        if (component.type === 'page') {
          files[`src/views/${component.name}.vue`] = 
            await this.generateVuePage(component);
        }

      } else if (framework === 'angular') {
        files[`src/app/${component.name}/${component.name}.component.ts`] = 
          await this.generateAngularComponent(component);
        files[`src/app/${component.name}/${component.name}.component.html`] = 
          await this.generateAngularTemplate(component);
        files[`src/app/${component.name}/${component.name}.component.scss`] = 
          await this.generateAngularStyles(component);
      }
    }

    return files;
  }

  private async generateTestFiles(config: ScaffoldingConfig): Promise<ProjectFiles> {
    const files: ProjectFiles = {};

    if (config.testStrategy === 'unit' || config.testStrategy === 'all') {
      // Generate unit tests for components
      for (const component of config.components) {
        files[`src/components/${component.name}/${component.name}.test.tsx`] = 
          await this.generateComponentTest(config.framework, component);
      }

      // Generate unit tests for API endpoints
      for (const endpoint of config.apiEndpoints) {
        const testName = endpoint.path.split('/').pop() || 'index';
        files[`src/routes/${testName}.test.ts`] = 
          await this.generateAPITest(config.framework, endpoint);
      }
    }

    if (config.testStrategy === 'integration' || config.testStrategy === 'all') {
      files['tests/integration/api.test.ts'] = 
        await this.generateIntegrationTests(config.framework, config.apiEndpoints);
    }

    if (config.testStrategy === 'e2e' || config.testStrategy === 'all') {
      files['tests/e2e/user-flow.test.ts'] = 
        await this.generateE2ETests(config.framework, config.features);
    }

    return files;
  }

  // Express route generation
  private generateExpressRoute(endpoint: APIEndpoint): string {
    const methodName = endpoint.method.toLowerCase();
    const routeName = endpoint.path.split('/').pop() || 'index';

    return `import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
${endpoint.authentication ? "import { authenticate } from '../middleware/auth';" : ''}
${endpoint.rateLimit ? "import { rateLimit } from '../middleware/rateLimit';" : ''}

const router = Router();

/**
 * ${endpoint.description}
 * ${endpoint.method} ${endpoint.path}
 */
router.${methodName}('${endpoint.path}',
  ${endpoint.authentication ? 'authenticate,' : ''}
  ${endpoint.rateLimit ? 'rateLimit,' : ''}
  ${endpoint.requestBody ? this.generateExpressValidation(endpoint.requestBody) : ''}
  async (req: Request, res: Response) => {
    try {
      ${endpoint.requestBody ? `
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      ` : ''}
      
      // TODO: Implement business logic
      const result = {};
      
      res.json(result);
    } catch (error) {
      console.error('Error in ${routeName}:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;`;
  }

  private generateExpressValidation(requestBody: any): string {
    const validations = Object.entries(requestBody.properties || {})
      .map(([key, schema]: [string, any]) => {
        let validation = `body('${key}')`;
        
        if (schema.type === 'string') {
          validation += '.isString()';
        } else if (schema.type === 'number') {
          validation += '.isNumeric()';
        } else if (schema.type === 'email') {
          validation += '.isEmail()';
        }
        
        if (schema.required) {
          validation += '.notEmpty()';
        }
        
        return validation;
      })
      .join(',\n  ');

    return `[\n  ${validations}\n],`;
  }

  // React component generation
  private async generateReactComponent(component: ComponentSpec): Promise<string> {
    const propsInterface = component.props?.length ? 
      this.generatePropsInterface(component.props) : '';

    const props = component.props?.length ? 
      `{ ${component.props.map(p => p.name).join(', ')} }: ${component.name}Props` : '';

    return `import React from 'react';
${component.dependencies?.map(dep => `import ${dep} from '${dep}';`).join('\n') || ''}

${propsInterface}

const ${component.name}: React.FC${component.props?.length ? `<${component.name}Props>` : ''} = (${props}) => {
  return (
    <div className="${component.name.toLowerCase()}">
      <h2>${component.name}</h2>
      {/* TODO: Implement component logic */}
    </div>
  );
};

export default ${component.name};`;
  }

  private generatePropsInterface(props: any[]): string {
    const propsStr = props.map(prop => 
      `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};`,
    ).join('\n');

    return `interface ${props[0]?.name || 'Component'}Props {
${propsStr}
}

`;
  }

  // Database model generation
  private generateTypeORMEntity(model: DataModel): string {
    const imports = ['Entity', 'PrimaryGeneratedColumn', 'Column', 'CreateDateColumn', 'UpdateDateColumn'];
    
    if (model.relationships?.length) {
      imports.push('OneToOne', 'OneToMany', 'ManyToOne', 'ManyToMany', 'JoinColumn');
    }

    const columns = model.fields.map(field => {
      let columnDef = `  @Column({ type: '${this.mapTypeToSQL(field.type)}'`;
      
      if (!field.required) {
        columnDef += ', nullable: true';
      }
      if (field.unique) {
        columnDef += ', unique: true';
      }
      if (field.default !== undefined) {
        columnDef += `, default: ${JSON.stringify(field.default)}`;
      }
      
      columnDef += ' })';
      
      return `${columnDef}\n  ${field.name}: ${this.mapTypeToTypeScript(field.type)};`;
    }).join('\n\n');

    const relationships = model.relationships?.map(rel => {
      const decorator = `@${rel.type}(() => ${rel.target}${rel.foreignKey ? `, { foreignKey: '${rel.foreignKey}' }` : ''})`;
      return `  ${decorator}\n  ${rel.target.toLowerCase()}: ${rel.target};`;
    }).join('\n\n') || '';

    return `import { ${imports.join(', ')} } from 'typeorm';

@Entity()
export class ${model.name} {
  @PrimaryGeneratedColumn()
  id: number;

${columns}

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

${relationships}
}`;
  }

  private mapTypeToSQL(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'varchar',
      number: 'int',
      boolean: 'boolean',
      date: 'timestamp',
      object: 'json',
      array: 'json',
    };
    return typeMap[type] || 'varchar';
  }

  private mapTypeToTypeScript(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      number: 'number',
      boolean: 'boolean',
      date: 'Date',
      object: 'object',
      array: 'any[]',
    };
    return typeMap[type] || 'string';
  }

  // Utility file generators
  private generateConstantsFile(): string {
    return `// Application constants
export const APP_NAME = process.env.REACT_APP_NAME || 'My App';
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export const VERSION = process.env.REACT_APP_VERSION || '1.0.0';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
  },
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE: '/api/users/update',
  },
} as const;

// UI constants
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const;

export const COLORS = {
  PRIMARY: '#3B82F6',
  SECONDARY: '#6B7280',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
} as const;`;
  }

  private generateHelpersFile(framework: string): string {
    return `// Utility helper functions

/**
 * Format currency value
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Sleep function
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};`;
  }

  private generateTypesFile(): string {
    return `// Common TypeScript types

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}`;
  }

  private generateAPIClientFile(framework: string): string {
    return `import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_URL } from './constants';
import { ApiResponse, ApiError } from '../types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = \`Bearer \${token}\`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message,
          code: error.response?.data?.code,
          status: error.response?.status,
        };

        // Handle 401 unauthorized
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }

        return Promise.reject(apiError);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.delete(url, config);
  }
}

export const apiClient = new ApiClient();
export default apiClient;`;
  }

  private generateGitignoreFile(): string {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
build/
dist/
*.tgz

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDEs
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

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# Database
*.sqlite
*.db

# Cache
.cache/
.parcel-cache/

# Docker
.docker/
.dockerignore

# Temporary files
tmp/
temp/`;
  }

  private generateEnvExampleFile(): string {
    return `# Application
APP_NAME=My App
NODE_ENV=development
PORT=8000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/myapp

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Email (if using email service)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourapp.com

# File uploads (if using cloud storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket-name

# Redis (if using caching)
REDIS_URL=redis://localhost:6379

# Monitoring (if using error tracking)
SENTRY_DSN=your-sentry-dsn`;
  }

  private generateTSConfigFile(): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'es2018',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        noFallthroughCasesInSwitch: true,
        module: 'esnext',
        moduleResolution: 'node',
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        baseUrl: 'src',
        paths: {
          '@/*': ['*'],
          '@/components/*': ['components/*'],
          '@/utils/*': ['utils/*'],
          '@/types/*': ['types/*'],
          '@/services/*': ['services/*'],
        },
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'build', 'dist'],
    }, null, 2);
  }

  private generateESLintConfig(framework: string): string {
    return `module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    ${framework === 'react' ? "'plugin:react/recommended'," : ''}
    ${framework === 'react' ? "'plugin:react-hooks/recommended'," : ''}
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ${framework === 'react' ? 'ecmaFeatures: { jsx: true },' : ''}
  },
  plugins: [
    '@typescript-eslint',
    ${framework === 'react' ? "'react'," : ''}
    ${framework === 'react' ? "'react-hooks'," : ''}
  ],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    ${framework === 'react' ? "'react/react-in-jsx-scope': 'off'," : ''}
    ${framework === 'react' ? "'react/prop-types': 'off'," : ''}
  },
  ${framework === 'react' ? "settings: { react: { version: 'detect' } }," : ''}
};`;
  }

  private generatePrettierConfig(): string {
    return JSON.stringify({
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
    }, null, 2);
  }

  private generateJestConfig(framework: string): string {
    if (framework === 'react') {
      return `module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/setupTests.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};`;
    }

    return `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts}',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};`;
  }

  private generateSetupTestsFile(framework: string): string {
    if (framework === 'react') {
      return `import '@testing-library/jest-dom';

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://localhost:8000';

// Mock modules that might cause issues in tests
jest.mock('axios');

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});`;
    }

    return `// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';`;
  }

  // Additional helper methods for generating other file types
  private generateRouteIndex(endpoints: APIEndpoint[]): string {
    const routes = endpoints.map(endpoint => {
      const routeName = endpoint.path.split('/').pop() || 'index';
      return `import ${routeName}Routes from './${routeName}';`;
    }).join('\n');

    const routeRegistrations = endpoints.map(endpoint => {
      const routeName = endpoint.path.split('/').pop() || 'index';
      return `  app.use('${endpoint.path}', ${routeName}Routes);`;
    }).join('\n');

    return `import { Application } from 'express';
${routes}

export const registerRoutes = (app: Application): void => {
${routeRegistrations}
};`;
  }

  private generateValidationMiddleware(): string {
    return `import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};`;
  }

  private generateAuthMiddleware(): string {
    return `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid access token',
    });
  }
};`;
  }

  private generateRateLimitMiddleware(): string {
    return `import rateLimit from 'express-rate-limit';

export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Predefined rate limiters
export const generalRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 requests per 15 minutes for auth
export const apiRateLimit = createRateLimit(60 * 1000, 60); // 60 requests per minute`;
  }

  // Test generation methods
  private async generateComponentTest(framework: string, component: ComponentSpec): Promise<string> {
    if (framework === 'react') {
      return `import React from 'react';
import { render, screen } from '@testing-library/react';
import ${component.name} from './${component.name}';

describe('${component.name}', () => {
  it('renders without crashing', () => {
    render(<${component.name} />);
    expect(screen.getByText('${component.name}')).toBeInTheDocument();
  });

  ${component.props?.map(prop => `
  it('renders with ${prop.name} prop', () => {
    const test${prop.name} = 'test value';
    render(<${component.name} ${prop.name}={test${prop.name}} />);
    // Add assertions based on prop usage
  });`).join('') || ''}
});`;
    }

    return `// Add tests for ${component.name}`;
  }

  private async generateAPITest(framework: string, endpoint: APIEndpoint): Promise<string> {
    const testName = endpoint.path.split('/').pop() || 'index';
    
    return `import request from 'supertest';
import app from '../app';

describe('${endpoint.method} ${endpoint.path}', () => {
  it('should ${endpoint.description.toLowerCase()}', async () => {
    const response = await request(app)
      .${endpoint.method.toLowerCase()}('${endpoint.path}')
      ${endpoint.requestBody ? `.send(${JSON.stringify(endpoint.requestBody.properties, null, 2)})` : ''}
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    ${endpoint.responseBody ? 'expect(response.body).toHaveProperty(\'data\');' : ''}
  });

  ${endpoint.authentication ? `
  it('should require authentication', async () => {
    await request(app)
      .${endpoint.method.toLowerCase()}('${endpoint.path}')
      .expect(401);
  });` : ''}

  ${endpoint.requestBody ? `
  it('should validate request body', async () => {
    const response = await request(app)
      .${endpoint.method.toLowerCase()}('${endpoint.path}')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('errors');
  });` : ''}
});`;
  }

  private async generateIntegrationTests(framework: string, endpoints: APIEndpoint[]): Promise<string> {
    return `import request from 'supertest';
import app from '../../src/app';

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database or mock services
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('Authentication flow', () => {
    it('should complete full authentication flow', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        })
        .expect(201);

      // Login user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');

      // Access protected route
      await request(app)
        .get('/api/protected')
        .set('Authorization', \`Bearer \${loginResponse.body.token}\`)
        .expect(200);
    });
  });

  ${endpoints.map(endpoint => `
  describe('${endpoint.method} ${endpoint.path}', () => {
    it('should work in integration context', async () => {
      // TODO: Add integration test for ${endpoint.description}
    });
  });`).join('')}
});`;
  }

  private async generateE2ETests(framework: string, features: string[]): Promise<string> {
    return `import { test, expect } from '@playwright/test';

test.describe('User Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete main user journey', async ({ page }) => {
    // Navigate to homepage
    await expect(page.locator('h1')).toContainText('Welcome');

    ${features.includes('authentication') ? `
    // Test authentication
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    ` : ''}

    ${features.includes('user-profile') ? `
    // Test profile update
    await page.click('text=Profile');
    await page.fill('input[name="name"]', 'Updated Name');
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Profile updated')).toBeVisible();
    ` : ''}
  });

  ${features.map(feature => `
  test('should handle ${feature} feature', async ({ page }) => {
    // TODO: Add E2E test for ${feature}
  });`).join('')}
});`;
  }

  // Placeholder methods for other frameworks
  private generateNestJSController(endpoint: APIEndpoint): string {
    return `// NestJS Controller for ${endpoint.path}`;
  }

  private generateNestJSService(endpoint: APIEndpoint): string {
    return `// NestJS Service for ${endpoint.path}`;
  }

  private generateNestJSModule(moduleName: string): string {
    return `// NestJS Module for ${moduleName}`;
  }

  private generateFastAPIRoute(endpoint: APIEndpoint): string {
    return `# FastAPI Route for ${endpoint.path}`;
  }

  private generateFastAPIMain(endpoints: APIEndpoint[]): string {
    return '# FastAPI Main application';
  }

  private generatePydanticModel(model: DataModel): string {
    return `# Pydantic model for ${model.name}`;
  }

  private generateSQLAlchemyModel(model: DataModel): string {
    return `# SQLAlchemy model for ${model.name}`;
  }

  private generateValidationSchema(model: DataModel): string {
    return `// Validation schema for ${model.name}`;
  }

  private async generateReactPage(component: ComponentSpec): Promise<string> {
    return `// React page component for ${component.name}`;
  }

  private async generateReactHook(component: ComponentSpec): Promise<string> {
    return `// React hook for ${component.name}`;
  }

  private async generateVueComponent(component: ComponentSpec): Promise<string> {
    return `<!-- Vue component for ${component.name} -->`;
  }

  private async generateVuePage(component: ComponentSpec): Promise<string> {
    return `<!-- Vue page for ${component.name} -->`;
  }

  private async generateAngularComponent(component: ComponentSpec): Promise<string> {
    return `// Angular component for ${component.name}`;
  }

  private async generateAngularTemplate(component: ComponentSpec): Promise<string> {
    return `<!-- Angular template for ${component.name} -->`;
  }

  private async generateAngularStyles(component: ComponentSpec): Promise<string> {
    return `// Angular styles for ${component.name}`;
  }

  private generateErrorHandlerFile(framework: string): string {
    if (framework === 'react') {
      return `import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export const handleApiError = (error: any): string => {
  if (error.response) {
    return error.response.data?.message || 'Server error occurred';
  } else if (error.request) {
    return 'Network error - please check your connection';
  } else {
    return error.message || 'An unexpected error occurred';
  }
};`;
    }

    return `// Error handling utilities
export const handleError = (error: any): string => {
  console.error('Error:', error);
  return error.message || 'An unexpected error occurred';
};`;
  }
}

export const projectScaffolding = new ProjectScaffoldingService();

// API endpoints
export const enhanceProjectFiles = api(
  { method: 'POST', path: '/scaffolding/enhance' },
  async ({ 
    baseFiles, 
    recommendations, 
  }: { 
    baseFiles: ProjectFiles; 
    recommendations: TechnologyRecommendation 
  }): Promise<ProjectFiles> => {
    return await projectScaffolding.enhanceProjectFiles(baseFiles, recommendations);
  },
);

export const generateProjectScaffolding = api(
  { method: 'POST', path: '/scaffolding/generate' },
  async (config: ScaffoldingConfig): Promise<ProjectFiles> => {
    return await projectScaffolding.generateProjectScaffolding(config);
  },
);