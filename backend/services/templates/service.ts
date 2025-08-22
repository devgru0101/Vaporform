import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import log from "encore.dev/log";

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
  framework?: string;
  language?: string;
  limit?: number;
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
  async ({ category, complexity, framework, language, limit }: GetTemplatesRequest): Promise<{ templates: Template[] }> => {
    log.info("Getting templates", { category, complexity, framework, language, limit });

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

      if (framework || language) {
        const techFilter = framework || language;
        query += ` AND (tech_stack->>'frontend' = $${paramIndex++} OR tech_stack->>'backend' = $${paramIndex++})`;
        params.push(techFilter, techFilter);
      }

      query += ` ORDER BY popularity DESC, complexity ASC`;

      if (limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(limit);
      }

      // For now, use simple query without parameters since Encore.ts SQL parameters work differently
      const rows = await db.queryAll`SELECT * FROM templates WHERE is_active = true ORDER BY popularity DESC, complexity ASC`;
      
      let templates = rows.map(row => parseTemplateRow(row));

      // Apply client-side filtering for now
      if (category) {
        templates = templates.filter(t => t.category === category);
      }
      if (complexity) {
        templates = templates.filter(t => t.complexity <= complexity);
      }
      if (framework || language) {
        const techFilter = framework || language;
        templates = templates.filter(t => 
          t.techStack.frontend === techFilter || 
          t.techStack.backend === techFilter
        );
      }
      if (limit) {
        templates = templates.slice(0, limit);
      }

      log.info("Templates retrieved", { count: templates.length });

      return { templates };
    } catch (error) {
      log.error("Failed to get templates", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve templates");
    }
  }
);

// Get detailed template information
export const getTemplate = api(
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

// Get templates by category
export const getTemplatesByCategory = api(
  { method: "GET", path: "/templates/category/:category", expose: true },
  async ({ category }: { category: string }): Promise<{ templates: Template[] }> => {
    log.info("Getting templates by category", { category });

    try {
      const rows = await db.queryAll`
        SELECT * FROM templates 
        WHERE is_active = true AND category = ${category}
        ORDER BY popularity DESC, complexity ASC
      `;

      const templates = rows.map(row => parseTemplateRow(row));

      return { templates };
    } catch (error) {
      log.error("Failed to get templates by category", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve templates by category");
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

// Get recommended templates based on project requirements
export const getRecommendedTemplates = api(
  { method: "POST", path: "/templates/recommend", expose: true },
  async (requirements: {
    projectType?: string;
    complexity?: number;
    techStack?: string[];
    features?: string[];
  }): Promise<{ templates: Template[] }> => {
    log.info("Getting recommended templates", { requirements });

    try {
      // Get all active templates
      const rows = await db.queryAll`
        SELECT * FROM templates 
        WHERE is_active = true 
        ORDER BY popularity DESC
      `;

      let templates = rows.map(row => parseTemplateRow(row));

      // Apply recommendation logic
      if (requirements.complexity) {
        templates = templates.filter(t => Math.abs(t.complexity - requirements.complexity!) <= 2);
      }

      if (requirements.techStack && requirements.techStack.length > 0) {
        templates = templates.filter(t => 
          requirements.techStack!.some(tech => 
            t.techStack.frontend.includes(tech) || 
            t.techStack.backend.includes(tech)
          )
        );
      }

      if (requirements.features && requirements.features.length > 0) {
        templates = templates.filter(t => 
          requirements.features!.some(feature => 
            t.features.some(tFeature => 
              tFeature.toLowerCase().includes(feature.toLowerCase())
            )
          )
        );
      }

      // Limit to top 5 recommendations
      templates = templates.slice(0, 5);

      return { templates };
    } catch (error) {
      log.error("Failed to get recommended templates", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve recommended templates");
    }
  }
);

// Get template preview/demo
export const getTemplatePreview = api(
  { method: "GET", path: "/templates/:templateId/preview", expose: true },
  async ({ templateId }: { templateId: string }): Promise<{
    preview: string;
    demoUrl?: string;
    screenshots?: string[];
  }> => {
    log.info("Getting template preview", { templateId });

    try {
      const template = await getTemplate({ id: templateId });
      
      const preview = `# ${template.name} Preview

${template.description}

## Tech Stack
- Frontend: ${template.techStack.frontend}
- Backend: ${template.techStack.backend}
- Database: ${template.techStack.database}

## Features
${template.features.map(f => `- ${f}`).join('\n')}

## Estimated Setup Time
${template.estimatedSetupTime}

## Complexity Level
${template.complexity}/10
`;

      return {
        preview,
        demoUrl: `https://demo.vaporform.com/${templateId}`,
        screenshots: [
          `https://assets.vaporform.com/templates/${templateId}/screenshot1.png`,
          `https://assets.vaporform.com/templates/${templateId}/screenshot2.png`
        ]
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      log.error("Failed to get template preview", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve template preview");
    }
  }
);

interface ValidateCompatibilityRequest {
  templateId: string;
  complexity?: number;
  features?: string[];
}

// Validate template compatibility
export const validateCompatibility = api(
  { method: "POST", path: "/templates/:templateId/validate", expose: true },
  async (req: ValidateCompatibilityRequest): Promise<{
    compatible: boolean;
    issues: string[];
    suggestions: string[];
  }> => {
    const { templateId, complexity, features } = req;
    const requirements = { complexity, features };
    log.info("Validating template compatibility", { templateId });

    try {
      const template = await getTemplate({ id: templateId });
      
      const issues: string[] = [];
      const suggestions: string[] = [];

      // Perform basic compatibility checks
      if (requirements.complexity && requirements.complexity > template.complexity + 2) {
        issues.push("Project complexity may exceed template capabilities");
        suggestions.push("Consider a more advanced template or break down the project");
      }

      if (requirements.features) {
        const unsupportedFeatures = requirements.features.filter((feature: string) => 
          !template.features.some(tFeature => 
            tFeature.toLowerCase().includes(feature.toLowerCase())
          )
        );
        
        if (unsupportedFeatures.length > 0) {
          issues.push(`Template doesn't directly support: ${unsupportedFeatures.join(', ')}`);
          suggestions.push("You may need to implement these features manually");
        }
      }

      const compatible = issues.length === 0;

      return {
        compatible,
        issues,
        suggestions
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      log.error("Failed to validate template compatibility", { error: (error as Error).message });
      throw APIError.internal("Failed to validate compatibility");
    }
  }
);

// Get template dependencies
export const getTemplateDependencies = api(
  { method: "GET", path: "/templates/:templateId/dependencies", expose: true },
  async ({ templateId }: { templateId: string }): Promise<{
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    peerDependencies?: Record<string, string>;
  }> => {
    log.info("Getting template dependencies", { templateId });

    try {
      const template = await getTemplate({ id: templateId });

      return {
        dependencies: template.dependencies,
        devDependencies: template.devDependencies,
        peerDependencies: {} // Could be added to template schema later
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      log.error("Failed to get template dependencies", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve dependencies");
    }
  }
);

// Search templates
export const searchTemplates = api(
  { method: "GET", path: "/templates/search", expose: true },
  async ({ q, category, complexity, tags }: { 
    q: string; 
    category?: string;
    complexity?: number;
    tags?: string[];
  }): Promise<{ templates: Template[]; total: number }> => {
    log.info("Searching templates", { query: q, category, complexity, tags });

    try {
      // Get all templates and filter client-side for now
      const rows = await db.queryAll`
        SELECT * FROM templates 
        WHERE is_active = true 
        ORDER BY popularity DESC
      `;

      let templates = rows.map(row => parseTemplateRow(row));

      // Apply search filters
      if (q) {
        const query = q.toLowerCase();
        templates = templates.filter(t => 
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.features.some(f => f.toLowerCase().includes(query)) ||
          t.techStack.frontend.toLowerCase().includes(query) ||
          t.techStack.backend.toLowerCase().includes(query)
        );
      }

      if (category) {
        templates = templates.filter(t => t.category === category);
      }

      if (complexity) {
        templates = templates.filter(t => t.complexity <= complexity);
      }

      if (tags && tags.length > 0) {
        templates = templates.filter(t => 
          tags.some(tag => 
            t.features.some(f => f.toLowerCase().includes(tag.toLowerCase()))
          )
        );
      }

      return {
        templates,
        total: templates.length
      };
    } catch (error) {
      log.error("Template search failed", { error: (error as Error).message });
      throw APIError.internal("Failed to search templates");
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