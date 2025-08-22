import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import log from "encore.dev/log";

// Import service definition
import "./encore.service";

// Database setup for integration management
const db = new SQLDatabase("integrations", {
  migrations: "./migrations",
});

// Integration Data interfaces matching frontend wizard
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

// Integration Provider information
export interface IntegrationProvider {
  id: string;
  name: string;
  type: string; // 'auth', 'payments', 'analytics', etc.
  description: string;
  logoUrl?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  setupTime: string;
  pricing: {
    model: 'free' | 'freemium' | 'paid';
    description: string;
    startingPrice?: string;
  };
  features: string[];
  requirements: string[];
  documentation: {
    setupGuide: string;
    apiDocs: string;
    examples: string[];
  };
  configuration: {
    fields: ConfigField[];
    environmentVariables: string[];
    webhookRequired: boolean;
  };
  compatibility: {
    templates: string[];
    frameworks: string[];
    platforms: string[];
  };
  isActive: boolean;
  popularity: number;
}

export interface ConfigField {
  name: string;
  type: 'text' | 'password' | 'select' | 'boolean' | 'url' | 'email';
  label: string;
  description: string;
  required: boolean;
  placeholder?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  options?: string[];
  defaultValue?: any;
  sensitive: boolean; // For API keys, secrets, etc.
}

// Integration Configuration
export interface IntegrationConfig {
  id: string;
  projectId?: string;
  userId?: string;
  integrationType: string;
  provider: string;
  configuration: Record<string, any>;
  environmentVariables: Record<string, string>;
  webhookUrl?: string;
  status: 'configured' | 'active' | 'error' | 'disabled';
  lastTested?: Date;
  testResults?: {
    success: boolean;
    message: string;
    details?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response interfaces
interface ValidateIntegrationRequest {
  integrationType: string;
  provider: string;
  configuration: Record<string, any>;
  templateId?: string;
}

interface ConfigureIntegrationRequest {
  projectId?: string;
  userId?: string;
  integrationType: string;
  provider: string;
  configuration: Record<string, any>;
}

interface TestConnectionRequest {
  configurationId: string;
}

interface GetProvidersRequest {
  type?: string;
  category?: string;
  difficulty?: string;
  compatibility?: string;
}

// Get all available integration providers
export const getProviders = api(
  { method: "GET", path: "/integrations/providers", expose: true },
  async ({ type, category, difficulty, compatibility }: GetProvidersRequest): Promise<{ 
    providers: IntegrationProvider[] 
  }> => {
    log.info("Getting integration providers", { type, category, difficulty });

    try {
      // Build query with proper template literal for Encore.ts - use a single query with conditional logic
      let rows;
      
      if (type && category && difficulty && compatibility) {
        rows = await db.queryAll`
          SELECT * FROM integration_providers 
          WHERE is_active = true 
          AND type = ${type}
          AND category = ${category}
          AND difficulty = ${difficulty}
          AND (compatibility->>'templates')::jsonb ? ${compatibility}
          ORDER BY popularity DESC, difficulty ASC
        `;
      } else if (type && category && difficulty) {
        rows = await db.queryAll`
          SELECT * FROM integration_providers 
          WHERE is_active = true 
          AND type = ${type}
          AND category = ${category}
          AND difficulty = ${difficulty}
          ORDER BY popularity DESC, difficulty ASC
        `;
      } else if (type && category) {
        rows = await db.queryAll`
          SELECT * FROM integration_providers 
          WHERE is_active = true 
          AND type = ${type}
          AND category = ${category}
          ORDER BY popularity DESC, difficulty ASC
        `;
      } else if (type) {
        rows = await db.queryAll`
          SELECT * FROM integration_providers 
          WHERE is_active = true 
          AND type = ${type}
          ORDER BY popularity DESC, difficulty ASC
        `;
      } else {
        rows = await db.queryAll`
          SELECT * FROM integration_providers 
          WHERE is_active = true 
          ORDER BY popularity DESC, difficulty ASC
        `;
      }
      const providers = rows.map(row => parseProviderRow(row));

      log.info("Integration providers retrieved", { count: providers.length });

      return { providers };
    } catch (error) {
      log.error("Failed to get integration providers", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve integration providers");
    }
  }
);

// Get specific integration provider details
export const getProviderDetails = api(
  { method: "GET", path: "/integrations/providers/:providerId", expose: true },
  async ({ providerId }: { providerId: string }): Promise<IntegrationProvider> => {
    log.info("Getting provider details", { providerId });

    try {
      const row = await db.queryRow`
        SELECT * FROM integration_providers 
        WHERE id = ${providerId} AND is_active = true
      `;

      if (!row) {
        throw APIError.notFound("Integration provider not found");
      }

      const provider = parseProviderRow(row);

      // Increment popularity counter
      await db.exec`
        UPDATE integration_providers SET popularity = popularity + 1 WHERE id = ${providerId}
      `;

      return provider;
    } catch (error) {
      if (error instanceof APIError) throw error;
      log.error("Failed to get provider details", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve provider details");
    }
  }
);

// Validate integration configuration
export const validateIntegration = api(
  { method: "POST", path: "/integrations/validate", expose: true },
  async ({ integrationType, provider, configuration, templateId }: ValidateIntegrationRequest): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  }> => {
    log.info("Validating integration", { integrationType, provider, templateId });

    try {
      const errors: string[] = [];
      const warnings: string[] = [];
      const recommendations: string[] = [];

      // Get provider details for validation
      const providerDetails = await getProviderDetails({ providerId: provider });

      // Validate required configuration fields
      providerDetails.configuration.fields.forEach(field => {
        if (field.required && !configuration[field.name]) {
          errors.push(`Required field '${field.label}' is missing`);
        }

        const value = configuration[field.name];
        if (value !== undefined) {
          // Type validation
          if (!validateFieldType(value, field.type)) {
            errors.push(`Field '${field.label}' has invalid type`);
          }

          // Pattern validation
          if (field.validation?.pattern) {
            const regex = new RegExp(field.validation.pattern);
            if (typeof value === 'string' && !regex.test(value)) {
              errors.push(`Field '${field.label}' does not match required pattern`);
            }
          }

          // Length validation
          if (field.validation?.minLength && value.length < field.validation.minLength) {
            errors.push(`Field '${field.label}' is too short`);
          }
          if (field.validation?.maxLength && value.length > field.validation.maxLength) {
            errors.push(`Field '${field.label}' is too long`);
          }
        }
      });

      // Template compatibility check
      if (templateId && !providerDetails.compatibility.templates.includes(templateId)) {
        warnings.push(`This integration may require additional configuration for the selected template`);
      }

      // Generate recommendations
      if (providerDetails.configuration.webhookRequired) {
        recommendations.push('Configure webhook URL for real-time notifications');
      }

      if (providerDetails.requirements.length > 0) {
        recommendations.push(`Ensure requirements are met: ${providerDetails.requirements.join(', ')}`);
      }

      const isValid = errors.length === 0;

      log.info("Integration validation completed", { 
        integrationType, 
        provider, 
        isValid, 
        errorsCount: errors.length 
      });

      return {
        isValid,
        errors,
        warnings,
        recommendations
      };
    } catch (error) {
      log.error("Integration validation failed", { error: (error as Error).message });
      throw APIError.internal("Failed to validate integration");
    }
  }
);

// Configure integration for a project
export const configureIntegration = api(
  { method: "POST", path: "/integrations/configure", expose: true },
  async ({ projectId, userId, integrationType, provider, configuration }: ConfigureIntegrationRequest): Promise<IntegrationConfig> => {
    log.info("Configuring integration", { projectId, userId, integrationType, provider });

    try {
      // Validate configuration first
      const validation = await validateIntegration({ 
        integrationType, 
        provider, 
        configuration 
      });

      if (!validation.isValid) {
        throw APIError.invalidArgument(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      const configId = `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Get provider details for environment variables
      const providerDetails = await getProviderDetails({ providerId: provider });
      const environmentVariables = generateEnvironmentVariables(providerDetails, configuration);

      const integrationConfig: IntegrationConfig = {
        id: configId,
        projectId,
        userId,
        integrationType,
        provider,
        configuration,
        environmentVariables,
        status: 'configured',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await storeIntegrationConfig(integrationConfig);

      log.info("Integration configured successfully", { configId, integrationType, provider });

      return integrationConfig;
    } catch (error) {
      if (error instanceof APIError) throw error;
      log.error("Integration configuration failed", { error: (error as Error).message });
      throw APIError.internal("Failed to configure integration");
    }
  }
);

// Test integration connection
export const testConnection = api(
  { method: "POST", path: "/integrations/test", expose: true },
  async ({ configurationId }: TestConnectionRequest): Promise<{
    success: boolean;
    message: string;
    details?: Record<string, any>;
  }> => {
    log.info("Testing integration connection", { configurationId });

    try {
      const config = await getIntegrationConfig(configurationId);
      if (!config) {
        throw APIError.notFound("Integration configuration not found");
      }

      // Perform connection test based on integration type
      const testResult = await performConnectionTest(config);

      // Update configuration with test results
      await db.exec`
        UPDATE integration_configurations 
        SET 
          last_tested = ${new Date()},
          test_results = ${JSON.stringify(testResult)},
          status = ${testResult.success ? 'active' : 'error'},
          updated_at = ${new Date()}
        WHERE id = ${configurationId}
      `;

      log.info("Integration connection test completed", { 
        configurationId, 
        success: testResult.success 
      });

      return testResult;
    } catch (error) {
      if (error instanceof APIError) throw error;
      log.error("Integration connection test failed", { error: (error as Error).message });
      throw APIError.internal("Failed to test integration connection");
    }
  }
);

// Get integration configurations for a project
export const getProjectIntegrations = api(
  { method: "GET", path: "/integrations/project/:projectId", expose: true },
  async ({ projectId }: { projectId: string }): Promise<{ integrations: IntegrationConfig[] }> => {
    log.info("Getting project integrations", { projectId });

    try {
      const rows = await db.queryAll`
        SELECT * FROM integration_configurations 
        WHERE project_id = ${projectId} 
        ORDER BY created_at DESC
      `;

      const integrations = rows.map(row => parseConfigRow(row));

      return { integrations };
    } catch (error) {
      log.error("Failed to get project integrations", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve project integrations");
    }
  }
);

// Get integration categories
export const getCategories = api(
  { method: "GET", path: "/integrations/categories", expose: true },
  async (): Promise<{ categories: { name: string; count: number; description: string }[] }> => {
    log.info("Getting integration categories");

    try {
      const rows = await db.queryAll`
        SELECT category, COUNT(*) as count
        FROM integration_providers 
        WHERE is_active = true 
        GROUP BY category 
        ORDER BY count DESC
      `;

      const categoryDescriptions: Record<string, string> = {
        'authentication': 'User authentication and authorization services',
        'payments': 'Payment processing and billing solutions',
        'analytics': 'Analytics and tracking services',
        'storage': 'File and data storage solutions',
        'communication': 'Email, SMS, and messaging services',
        'ai': 'AI and machine learning services',
        'social': 'Social media and sharing integrations',
        'productivity': 'Productivity and workflow tools',
        'monitoring': 'Application monitoring and logging'
      };

      const categories = rows.map(row => ({
        name: row.category,
        count: parseInt(row.count),
        description: categoryDescriptions[row.category] || 'Custom integration category'
      }));

      return { categories };
    } catch (error) {
      log.error("Failed to get integration categories", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve categories");
    }
  }
);

// Helper Functions

function parseProviderRow(row: any): IntegrationProvider {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    logoUrl: row.logo_url,
    category: row.category,
    difficulty: row.difficulty,
    setupTime: row.setup_time,
    pricing: JSON.parse(row.pricing),
    features: JSON.parse(row.features),
    requirements: JSON.parse(row.requirements),
    documentation: JSON.parse(row.documentation),
    configuration: JSON.parse(row.configuration),
    compatibility: JSON.parse(row.compatibility),
    isActive: row.is_active,
    popularity: row.popularity
  };
}

function parseConfigRow(row: any): IntegrationConfig {
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    integrationType: row.integration_type,
    provider: row.provider,
    configuration: JSON.parse(row.configuration),
    environmentVariables: JSON.parse(row.environment_variables),
    webhookUrl: row.webhook_url,
    status: row.status,
    lastTested: row.last_tested,
    testResults: row.test_results ? JSON.parse(row.test_results) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function validateFieldType(value: any, type: string): boolean {
  switch (type) {
    case 'text':
    case 'password':
    case 'url':
    case 'email':
      return typeof value === 'string';
    case 'boolean':
      return typeof value === 'boolean';
    case 'select':
      return typeof value === 'string';
    default:
      return true;
  }
}

function generateEnvironmentVariables(provider: IntegrationProvider, configuration: Record<string, any>): Record<string, string> {
  const envVars: Record<string, string> = {};
  
  // Generate environment variable names based on provider and configuration
  provider.configuration.fields.forEach(field => {
    if (field.sensitive && configuration[field.name]) {
      const envVarName = `${provider.name.toUpperCase().replace(/\s+/g, '_')}_${field.name.toUpperCase()}`;
      envVars[envVarName] = configuration[field.name];
    }
  });

  // Add standard environment variables
  provider.configuration.environmentVariables.forEach(envVar => {
    if (!envVars[envVar]) {
      envVars[envVar] = `TODO: Configure ${envVar}`;
    }
  });

  return envVars;
}

async function performConnectionTest(config: IntegrationConfig): Promise<{
  success: boolean;
  message: string;
  details?: Record<string, any>;
}> {
  // Mock connection test implementation
  // In a real implementation, this would make actual API calls to test the integration
  
  try {
    switch (config.integrationType) {
      case 'auth':
        return await testAuthIntegration(config);
      case 'payments':
        return await testPaymentIntegration(config);
      case 'analytics':
        return await testAnalyticsIntegration(config);
      case 'storage':
        return await testStorageIntegration(config);
      default:
        return {
          success: true,
          message: 'Integration configuration appears valid',
          details: { testType: 'configuration_validation' }
        };
    }
  } catch (error) {
    return {
      success: false,
      message: `Connection test failed: ${(error as Error).message}`,
      details: { error: (error as Error).message }
    };
  }
}

async function testAuthIntegration(config: IntegrationConfig): Promise<any> {
  // Mock auth integration test
  const hasApiKey = config.configuration.apiKey || config.configuration.clientId;
  return {
    success: !!hasApiKey,
    message: hasApiKey ? 'Authentication configuration valid' : 'Missing API credentials',
    details: { provider: config.provider, hasCredentials: !!hasApiKey }
  };
}

async function testPaymentIntegration(config: IntegrationConfig): Promise<any> {
  // Mock payment integration test
  const hasKeys = config.configuration.publicKey && config.configuration.secretKey;
  return {
    success: !!hasKeys,
    message: hasKeys ? 'Payment provider keys configured' : 'Missing payment provider keys',
    details: { provider: config.provider, hasKeys: !!hasKeys }
  };
}

async function testAnalyticsIntegration(config: IntegrationConfig): Promise<any> {
  // Mock analytics integration test
  const hasTrackingId = config.configuration.trackingId || config.configuration.measurementId;
  return {
    success: !!hasTrackingId,
    message: hasTrackingId ? 'Analytics tracking configured' : 'Missing tracking ID',
    details: { provider: config.provider, hasTrackingId: !!hasTrackingId }
  };
}

async function testStorageIntegration(config: IntegrationConfig): Promise<any> {
  // Mock storage integration test
  const hasBucket = config.configuration.bucketName || config.configuration.containerName;
  return {
    success: !!hasBucket,
    message: hasBucket ? 'Storage configuration valid' : 'Missing storage configuration',
    details: { provider: config.provider, hasStorageConfig: !!hasBucket }
  };
}

async function getIntegrationConfig(configId: string): Promise<IntegrationConfig | null> {
  const row = await db.queryRow`
    SELECT * FROM integration_configurations WHERE id = ${configId}
  `;
  
  return row ? parseConfigRow(row) : null;
}

async function storeIntegrationConfig(config: IntegrationConfig): Promise<void> {
  await db.exec`
    INSERT INTO integration_configurations (
      id, project_id, user_id, integration_type, provider,
      configuration, environment_variables, webhook_url,
      status, created_at, updated_at
    ) VALUES (
      ${config.id}, ${config.projectId}, ${config.userId},
      ${config.integrationType}, ${config.provider},
      ${JSON.stringify(config.configuration)},
      ${JSON.stringify(config.environmentVariables)},
      ${config.webhookUrl}, ${config.status},
      ${config.createdAt}, ${config.updatedAt}
    )
  `;
}

// Initialize default integration providers
async function initializeDefaultProviders(): Promise<void> {
  try {
    const existingCount = await db.queryRow`SELECT COUNT(*) as count FROM integration_providers`;
    
    if (!existingCount || parseInt(existingCount.count) === 0) {
      log.info("Initializing default integration providers");
      
      const defaultProviders = getDefaultProviders();
      for (const provider of defaultProviders) {
        await storeProvider(provider);
      }
      
      log.info("Default integration providers initialized", { count: defaultProviders.length });
    }
  } catch (error) {
    log.error("Failed to initialize default providers", { error: (error as Error).message });
  }
}

async function storeProvider(provider: IntegrationProvider): Promise<void> {
  await db.exec`
    INSERT INTO integration_providers (
      id, name, type, description, logo_url, category,
      difficulty, setup_time, pricing, features, requirements,
      documentation, configuration, compatibility, is_active, popularity
    ) VALUES (
      ${provider.id}, ${provider.name}, ${provider.type}, ${provider.description},
      ${provider.logoUrl}, ${provider.category}, ${provider.difficulty},
      ${provider.setupTime}, ${JSON.stringify(provider.pricing)},
      ${JSON.stringify(provider.features)}, ${JSON.stringify(provider.requirements)},
      ${JSON.stringify(provider.documentation)}, ${JSON.stringify(provider.configuration)},
      ${JSON.stringify(provider.compatibility)}, ${provider.isActive}, ${provider.popularity}
    )
  `;
}

function getDefaultProviders(): IntegrationProvider[] {
  return [
    {
      id: 'auth0',
      name: 'Auth0',
      type: 'auth',
      description: 'Complete authentication and authorization platform',
      logoUrl: 'https://cdn.auth0.com/styleguide/components/1.0.8/media/logos/img/badge.png',
      category: 'authentication',
      difficulty: 'easy',
      setupTime: '15-30 minutes',
      pricing: {
        model: 'freemium',
        description: 'Free for up to 7,000 active users',
        startingPrice: '$23/month'
      },
      features: ['Social logins', 'Multi-factor authentication', 'User management', 'SSO'],
      requirements: ['Auth0 account', 'Application registration'],
      documentation: {
        setupGuide: 'https://auth0.com/docs/quickstart',
        apiDocs: 'https://auth0.com/docs/api',
        examples: ['React integration', 'Node.js backend']
      },
      configuration: {
        fields: [
          {
            name: 'domain',
            type: 'text',
            label: 'Auth0 Domain',
            description: 'Your Auth0 domain (e.g., your-app.auth0.com)',
            required: true,
            placeholder: 'your-app.auth0.com',
            sensitive: false
          },
          {
            name: 'clientId',
            type: 'text',
            label: 'Client ID',
            description: 'Auth0 application client ID',
            required: true,
            sensitive: true
          },
          {
            name: 'clientSecret',
            type: 'password',
            label: 'Client Secret',
            description: 'Auth0 application client secret',
            required: true,
            sensitive: true
          }
        ],
        environmentVariables: ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET'],
        webhookRequired: false
      },
      compatibility: {
        templates: ['encore-react-ts', 'react-spa', 'node-api'],
        frameworks: ['React', 'Vue', 'Angular', 'Node.js'],
        platforms: ['Web', 'Mobile']
      },
      isActive: true,
      popularity: 95
    },
    {
      id: 'stripe',
      name: 'Stripe',
      type: 'payments',
      description: 'Complete payment processing platform',
      logoUrl: 'https://stripe.com/img/v3/home/twitter.png',
      category: 'payments',
      difficulty: 'medium',
      setupTime: '30-60 minutes',
      pricing: {
        model: 'paid',
        description: '2.9% + 30¢ per transaction',
        startingPrice: 'Pay per transaction'
      },
      features: ['Credit card processing', 'Subscriptions', 'Marketplace payments', 'International'],
      requirements: ['Stripe account', 'Business verification'],
      documentation: {
        setupGuide: 'https://stripe.com/docs/development',
        apiDocs: 'https://stripe.com/docs/api',
        examples: ['React checkout', 'Subscription billing']
      },
      configuration: {
        fields: [
          {
            name: 'publicKey',
            type: 'text',
            label: 'Publishable Key',
            description: 'Stripe publishable key for client-side',
            required: true,
            sensitive: false
          },
          {
            name: 'secretKey',
            type: 'password',
            label: 'Secret Key',
            description: 'Stripe secret key for server-side',
            required: true,
            sensitive: true
          },
          {
            name: 'webhookSecret',
            type: 'password',
            label: 'Webhook Secret',
            description: 'Webhook endpoint secret for verification',
            required: false,
            sensitive: true
          }
        ],
        environmentVariables: ['STRIPE_PUBLIC_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
        webhookRequired: true
      },
      compatibility: {
        templates: ['encore-react-ts', 'node-api'],
        frameworks: ['React', 'Vue', 'Angular', 'Node.js'],
        platforms: ['Web', 'Mobile']
      },
      isActive: true,
      popularity: 90
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      type: 'analytics',
      description: 'Web analytics and reporting platform',
      logoUrl: 'https://www.google.com/analytics/static/images/analytics-logo.png',
      category: 'analytics',
      difficulty: 'easy',
      setupTime: '10-20 minutes',
      pricing: {
        model: 'free',
        description: 'Free with usage limits'
      },
      features: ['Page views', 'User behavior', 'Conversion tracking', 'Real-time analytics'],
      requirements: ['Google Analytics account', 'Property setup'],
      documentation: {
        setupGuide: 'https://developers.google.com/analytics/devguides/collection/ga4',
        apiDocs: 'https://developers.google.com/analytics',
        examples: ['React integration', 'Custom events']
      },
      configuration: {
        fields: [
          {
            name: 'measurementId',
            type: 'text',
            label: 'Measurement ID',
            description: 'Google Analytics 4 measurement ID (G-XXXXXXXXXX)',
            required: true,
            placeholder: 'G-XXXXXXXXXX',
            sensitive: false
          }
        ],
        environmentVariables: ['GA_MEASUREMENT_ID'],
        webhookRequired: false
      },
      compatibility: {
        templates: ['encore-react-ts', 'react-spa'],
        frameworks: ['React', 'Vue', 'Angular'],
        platforms: ['Web']
      },
      isActive: true,
      popularity: 85
    }
  ];
}

// Initialize providers when service starts
initializeDefaultProviders();