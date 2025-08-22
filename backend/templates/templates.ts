import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import log from "encore.dev/log";

// Import service definition
import "./encore.service";

// Database setup for template management
const db = new SQLDatabase("templates", {
  migrations: "./migrations",
});

// Enhanced Template interface for comprehensive project wizard
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
  variables: TemplateVariable[];
  prerequisites: string[];
  fileStructure: Record<string, string>;
  configFiles: Record<string, any>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  estimatedSetupTime: string;
  maintenanceLevel: 'low' | 'medium' | 'high';
  popularity: number;
  lastUpdated: Date;
  createdBy?: string;
  isActive: boolean;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'select' | 'multiselect';
  description: string;
  required: boolean;
  default?: any;
  options?: string[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}

// Template Customization interface
export interface TemplateCustomization {
  templateId: string;
  variables: Record<string, any>;
  selectedFeatures: string[];
  customizations: {
    styling?: Record<string, any>;
    functionality?: Record<string, any>;
    integrations?: Record<string, any>;
  };
}

// Request/Response interfaces
interface GetTemplatesRequest {
  category?: string;
  complexity?: number;
  techStack?: string;
  search?: string;
}

interface ValidateTemplateRequest {
  templateId: string;
  customization: TemplateCustomization;
}

interface CreateTemplateRequest {
  template: Omit<Template, 'id' | 'lastUpdated' | 'popularity'>;
}

// Get all templates with optional filtering
export const getTemplates = api(
  { method: "GET", path: "/templates", expose: true },
  async ({ category, complexity, techStack, search }: GetTemplatesRequest): Promise<{ templates: Template[] }> => {
    log.info("Getting templates", { category, complexity, techStack, search });

    try {
      let query = `SELECT * FROM templates WHERE is_active = true`;
      const params: any[] = [];
      let paramIndex = 1;

      if (category) {
        query += ` AND category = $${paramIndex++}`;
        params.push(category);
      }

      if (complexity) {
        query += ` AND complexity <= $${paramIndex++}`;
        params.push(complexity);
      }

      if (techStack) {
        query += ` AND (tech_stack->>'frontend' = $${paramIndex++} OR tech_stack->>'backend' = $${paramIndex++})`;
        params.push(techStack, techStack);
      }

      if (search) {
        query += ` AND (name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++})`;
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY popularity DESC, complexity ASC`;

      const rows = await db.queryAll`SELECT * FROM templates WHERE is_active = true ORDER BY popularity DESC, complexity ASC`;
      
      const templates = rows.map(row => parseTemplateRow(row));

      log.info("Templates retrieved", { count: templates.length });

      return { templates };
    } catch (error) {
      log.error("Failed to get templates", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve templates");
    }
  }
);

// Get detailed template information
export const getTemplateDetails = api(
  { method: "GET", path: "/templates/:id", expose: true },
  async ({ id }: { id: string }): Promise<Template> => {
    log.info("Getting template details", { templateId: id });

    try {
      const row = await db.queryRow`
        SELECT * FROM templates WHERE id = ${id} AND is_active = true
      `;

      if (!row) {
        throw APIError.notFound("Template not found");
      }

      const template = parseTemplateRow(row);

      // Increment popularity counter
      await db.exec`
        UPDATE templates SET popularity = popularity + 1 WHERE id = ${id}
      `;

      log.info("Template details retrieved", { templateId: id });

      return template;
    } catch (error) {
      if (error instanceof APIError) throw error;
      log.error("Failed to get template details", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve template details");
    }
  }
);

// Validate template configuration and customization
export const validateTemplate = api(
  { method: "POST", path: "/templates/validate", expose: true },
  async ({ templateId, customization }: ValidateTemplateRequest): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    missingRequirements: string[];
  }> => {
    log.info("Validating template configuration", { templateId });

    try {
      const template = await getTemplateDetails({ id: templateId });
      
      const errors: string[] = [];
      const warnings: string[] = [];
      const missingRequirements: string[] = [];

      // Validate required variables
      template.variables.forEach(variable => {
        if (variable.required && !customization.variables[variable.name]) {
          errors.push(`Required variable '${variable.name}' is missing`);
        }

        const value = customization.variables[variable.name];
        if (value !== undefined) {
          // Type validation
          if (!validateVariableType(value, variable.type)) {
            errors.push(`Variable '${variable.name}' has invalid type`);
          }

          // Pattern validation
          if (variable.validation?.pattern && typeof value === 'string') {
            const regex = new RegExp(variable.validation.pattern);
            if (!regex.test(value)) {
              errors.push(`Variable '${variable.name}' does not match required pattern`);
            }
          }

          // Range validation
          if (variable.validation?.min !== undefined && value < variable.validation.min) {
            errors.push(`Variable '${variable.name}' is below minimum value`);
          }
          if (variable.validation?.max !== undefined && value > variable.validation.max) {
            errors.push(`Variable '${variable.name}' exceeds maximum value`);
          }
        }
      });

      // Validate selected features
      customization.selectedFeatures.forEach(feature => {
        if (!template.features.includes(feature)) {
          warnings.push(`Feature '${feature}' is not available in this template`);
        }
      });

      // Check prerequisites
      template.prerequisites.forEach(prerequisite => {
        // This would typically check against system capabilities
        // For now, we'll add to warnings
        warnings.push(`Ensure prerequisite '${prerequisite}' is available`);
      });

      const isValid = errors.length === 0;

      log.info("Template validation completed", { templateId, isValid, errorsCount: errors.length });

      return {
        isValid,
        errors,
        warnings,
        missingRequirements
      };
    } catch (error) {
      log.error("Template validation failed", { error: (error as Error).message });
      throw APIError.internal("Failed to validate template");
    }
  }
);

// Get template categories
export const getCategories = api(
  { method: "GET", path: "/templates/categories", expose: true },
  async (): Promise<{ categories: { name: string; count: number; description: string }[] }> => {
    log.info("Getting template categories");

    try {
      const rows = await db.queryAll`
        SELECT category, COUNT(*) as count
        FROM templates 
        WHERE is_active = true 
        GROUP BY category 
        ORDER BY count DESC
      `;

      const categoryDescriptions: Record<string, string> = {
        'fullstack': 'Complete full-stack applications with frontend and backend',
        'frontend': 'Frontend-only applications and SPAs',
        'backend': 'Backend services and APIs',
        'mobile': 'Mobile applications and React Native',
        'api': 'RESTful APIs and microservices',
        'ai': 'AI/ML powered applications',
        'ecommerce': 'E-commerce platforms and stores',
        'social': 'Social platforms and community apps',
        'analytics': 'Analytics dashboards and reporting tools',
        'cms': 'Content management systems'
      };

      const categories = rows.map(row => ({
        name: row.category,
        count: parseInt(row.count),
        description: categoryDescriptions[row.category] || 'Custom template category'
      }));

      return { categories };
    } catch (error) {
      log.error("Failed to get categories", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve categories");
    }
  }
);

// Search templates
export const searchTemplates = api(
  { method: "GET", path: "/templates/search", expose: true },
  async ({ q, filters }: { q: string; filters?: Record<string, any> }): Promise<{ 
    templates: Template[]; 
    totalCount: number;
    suggestions: string[];
  }> => {
    log.info("Searching templates", { query: q, filters });

    try {
      // Search templates by name, description, features, and tech stack
      const templates = await db.queryAll`
        SELECT *, 
               ts_rank(search_vector, plainto_tsquery(${q})) as rank
        FROM templates 
        WHERE is_active = true 
        AND search_vector @@ plainto_tsquery(${q})
        ORDER BY rank DESC, popularity DESC
        LIMIT 50
      `;

      const parsedTemplates = templates.map(row => parseTemplateRow(row));
      
      // Generate search suggestions based on popular terms
      const suggestions = await generateSearchSuggestions(q);

      log.info("Template search completed", { query: q, resultsCount: parsedTemplates.length });

      return {
        templates: parsedTemplates,
        totalCount: parsedTemplates.length,
        suggestions
      };
    } catch (error) {
      log.error("Template search failed", { error: (error as Error).message });
      throw APIError.internal("Failed to search templates");
    }
  }
);

// Create new template (admin functionality)
export const createTemplate = api(
  { method: "POST", path: "/templates", auth: true, expose: true },
  async (req: CreateTemplateRequest): Promise<Template> => {
    log.info("Creating new template", { templateName: req.template.name });

    try {
      const templateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const template: Template = {
        ...req.template,
        id: templateId,
        lastUpdated: new Date(),
        popularity: 0,
        isActive: true
      };

      await storeTemplate(template);

      log.info("Template created successfully", { templateId });

      return template;
    } catch (error) {
      log.error("Template creation failed", { error: (error as Error).message });
      throw APIError.internal("Failed to create template");
    }
  }
);

// Get popular templates
export const getPopularTemplates = api(
  { method: "GET", path: "/templates/popular", expose: true },
  async ({ limit = 10 }: { limit?: number }): Promise<{ templates: Template[] }> => {
    log.info("Getting popular templates", { limit });

    try {
      const rows = await db.queryAll`
        SELECT * FROM templates 
        WHERE is_active = true 
        ORDER BY popularity DESC, last_updated DESC 
        LIMIT ${limit}
      `;

      const templates = rows.map(row => parseTemplateRow(row));

      return { templates };
    } catch (error) {
      log.error("Failed to get popular templates", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve popular templates");
    }
  }
);

// Helper Functions

function parseTemplateRow(row: any): Template {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    version: row.version,
    complexity: row.complexity,
    techStack: JSON.parse(row.tech_stack),
    features: JSON.parse(row.features),
    supportedIntegrations: JSON.parse(row.supported_integrations),
    variables: JSON.parse(row.variables),
    prerequisites: JSON.parse(row.prerequisites),
    fileStructure: JSON.parse(row.file_structure),
    configFiles: JSON.parse(row.config_files),
    dependencies: JSON.parse(row.dependencies),
    devDependencies: JSON.parse(row.dev_dependencies),
    estimatedSetupTime: row.estimated_setup_time,
    maintenanceLevel: row.maintenance_level,
    popularity: row.popularity,
    lastUpdated: row.last_updated,
    createdBy: row.created_by,
    isActive: row.is_active
  };
}

function validateVariableType(value: any, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'boolean':
      return typeof value === 'boolean';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'select':
    case 'multiselect':
      return Array.isArray(value) ? value.every(v => typeof v === 'string') : typeof value === 'string';
    default:
      return true;
  }
}

async function generateSearchSuggestions(query: string): Promise<string[]> {
  // Generate search suggestions based on popular templates and features
  const suggestions = [
    'React TypeScript',
    'Vue.js',
    'Node.js API',
    'E-commerce',
    'Dashboard',
    'Mobile App',
    'AI/ML',
    'Real-time Chat',
    'Authentication',
    'Payment Integration'
  ];

  return suggestions.filter(suggestion => 
    suggestion.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);
}

async function storeTemplate(template: Template): Promise<void> {
  await db.exec`
    INSERT INTO templates (
      id, name, description, category, version, complexity,
      tech_stack, features, supported_integrations, variables,
      prerequisites, file_structure, config_files, dependencies,
      dev_dependencies, estimated_setup_time, maintenance_level,
      popularity, last_updated, created_by, is_active, search_vector
    ) VALUES (
      ${template.id}, ${template.name}, ${template.description}, 
      ${template.category}, ${template.version}, ${template.complexity},
      ${JSON.stringify(template.techStack)}, ${JSON.stringify(template.features)},
      ${JSON.stringify(template.supportedIntegrations)}, ${JSON.stringify(template.variables)},
      ${JSON.stringify(template.prerequisites)}, ${JSON.stringify(template.fileStructure)},
      ${JSON.stringify(template.configFiles)}, ${JSON.stringify(template.dependencies)},
      ${JSON.stringify(template.devDependencies)}, ${template.estimatedSetupTime},
      ${template.maintenanceLevel}, ${template.popularity}, ${template.lastUpdated},
      ${template.createdBy}, ${template.isActive},
      to_tsvector('english', ${template.name + ' ' + template.description + ' ' + template.features.join(' ')})
    )
  `;
}

// Initialize default templates on service startup
async function initializeDefaultTemplates(): Promise<void> {
  try {
    const existingCount = await db.queryRow`SELECT COUNT(*) as count FROM templates`;
    
    if (existingCount && parseInt(existingCount.count) === 0) {
      log.info("Initializing default templates");
      
      const defaultTemplates = getDefaultTemplates();
      for (const template of defaultTemplates) {
        await storeTemplate(template);
      }
      
      log.info("Default templates initialized", { count: defaultTemplates.length });
    }
  } catch (error) {
    log.error("Failed to initialize default templates", { error: (error as Error).message });
  }
}

function getDefaultTemplates(): Template[] {
  return [
    {
      id: 'encore-react-ts',
      name: 'Encore.ts + React',
      description: 'Full-stack TypeScript application with Encore.ts backend and React frontend',
      category: 'fullstack',
      version: '1.0.0',
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
          default: 'My Encore App',
          validation: { pattern: '^[a-zA-Z0-9-_]+$' }
        },
        {
          name: 'useAuth',
          type: 'boolean',
          description: 'Include authentication system',
          required: false,
          default: true
        },
        {
          name: 'uiFramework',
          type: 'select',
          description: 'UI styling framework',
          required: true,
          default: 'tailwind',
          options: ['tailwind', 'mui', 'chakra', 'antd']
        }
      ],
      prerequisites: ['Node.js 18+', 'Encore CLI'],
      fileStructure: {
        'backend/main.ts': 'Encore.ts main entry point',
        'backend/auth/auth.ts': 'Authentication service',
        'backend/api/api.ts': 'API endpoints',
        'frontend/src/App.tsx': 'React application',
        'frontend/src/components/': 'React components',
        'package.json': 'Project dependencies'
      },
      configFiles: {
        'encore.app': '{"id": "{{appName}}", "lang": "ts"}',
        'tsconfig.json': '{"compilerOptions": {"target": "ES2020", "module": "commonjs", "strict": true}}',
        'tailwind.config.js': 'module.exports = {content: ["./src/**/*.{js,jsx,ts,tsx}"], theme: {extend: {}}, plugins: []}'
      },
      dependencies: {
        'encore.dev': '^1.49.0',
        'react': '^18.2.0',
        'react-dom': '^18.2.0'
      },
      devDependencies: {
        'typescript': '^5.0.0',
        '@types/react': '^18.0.0',
        '@types/react-dom': '^18.0.0'
      },
      estimatedSetupTime: '15-30 minutes',
      maintenanceLevel: 'low',
      popularity: 100,
      lastUpdated: new Date(),
      createdBy: 'system',
      isActive: true
    },
    {
      id: 'react-spa',
      name: 'React SPA',
      description: 'Single Page Application with React, TypeScript, and modern tooling',
      category: 'frontend',
      version: '1.0.0',
      complexity: 2,
      techStack: {
        frontend: 'React',
        backend: 'None',
        database: 'None',
        hosting: 'Vercel/Netlify'
      },
      features: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'React Router', 'Testing Setup'],
      supportedIntegrations: ['analytics', 'auth', 'storage'],
      variables: [
        {
          name: 'appName',
          type: 'string',
          description: 'Application name',
          required: true,
          default: 'My React SPA'
        },
        {
          name: 'routing',
          type: 'boolean',
          description: 'Include React Router',
          required: false,
          default: true
        }
      ],
      prerequisites: ['Node.js 18+'],
      fileStructure: {
        'src/App.tsx': 'Main React component',
        'src/components/': 'React components',
        'src/pages/': 'Page components',
        'package.json': 'Dependencies',
        'index.html': 'HTML entry point'
      },
      configFiles: {
        'vite.config.ts': 'Vite configuration',
        'tsconfig.json': 'TypeScript configuration',
        'tailwind.config.js': 'Tailwind CSS configuration'
      },
      dependencies: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'react-router-dom': '^6.8.0'
      },
      devDependencies: {
        'vite': '^4.0.0',
        'typescript': '^5.0.0',
        '@vitejs/plugin-react': '^3.0.0'
      },
      estimatedSetupTime: '10-15 minutes',
      maintenanceLevel: 'low',
      popularity: 85,
      lastUpdated: new Date(),
      createdBy: 'system',
      isActive: true
    },
    {
      id: 'node-api',
      name: 'Node.js API',
      description: 'RESTful API with Express.js, TypeScript, and PostgreSQL',
      category: 'backend',
      version: '1.0.0',
      complexity: 3,
      techStack: {
        frontend: 'None',
        backend: 'Node.js',
        database: 'PostgreSQL',
        hosting: 'Railway/Render'
      },
      features: ['Express.js', 'TypeScript', 'PostgreSQL', 'Authentication', 'API Documentation', 'Testing'],
      supportedIntegrations: ['auth', 'payments', 'analytics', 'storage'],
      variables: [
        {
          name: 'apiName',
          type: 'string',
          description: 'API name',
          required: true,
          default: 'My API'
        },
        {
          name: 'authMethod',
          type: 'select',
          description: 'Authentication method',
          required: true,
          default: 'jwt',
          options: ['jwt', 'session', 'oauth']
        }
      ],
      prerequisites: ['Node.js 18+', 'PostgreSQL'],
      fileStructure: {
        'src/app.ts': 'Express application setup',
        'src/routes/': 'API route handlers',
        'src/models/': 'Database models',
        'src/middleware/': 'Express middleware',
        'package.json': 'Dependencies'
      },
      configFiles: {
        'tsconfig.json': 'TypeScript configuration',
        'package.json': 'Node.js package configuration'
      },
      dependencies: {
        'express': '^4.18.0',
        'pg': '^8.8.0',
        'jsonwebtoken': '^9.0.0'
      },
      devDependencies: {
        'typescript': '^5.0.0',
        '@types/express': '^4.17.0',
        '@types/node': '^20.0.0'
      },
      estimatedSetupTime: '20-30 minutes',
      maintenanceLevel: 'medium',
      popularity: 75,
      lastUpdated: new Date(),
      createdBy: 'system',
      isActive: true
    }
  ];
}

// Initialize templates when service starts
initializeDefaultTemplates();