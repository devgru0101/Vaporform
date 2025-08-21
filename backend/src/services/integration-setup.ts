import { api } from 'encore.dev/api';
import { ProjectFiles } from './project-templates';

export interface IntegrationConfig {
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  apiKeys?: Record<string, string>;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'auth' | 'payment' | 'email' | 'storage' | 'analytics' | 'database' | 'deployment' | 'monitoring';
  complexity: number;
  pricing: 'free' | 'freemium' | 'paid';
  documentation: string;
  setupSteps: string[];
  configFields: {
    name: string;
    type: 'string' | 'boolean' | 'number' | 'select' | 'secret';
    description: string;
    required: boolean;
    default?: any;
    options?: string[];
  }[];
  dependencies: string[];
  codeSnippets: {
    frontend?: string;
    backend?: string;
    config?: string;
    types?: string;
  };
  envVariables: string[];
}

class IntegrationSetupService {
  private readonly integrations: Map<string, Integration> = new Map();

  constructor() {
    this.initializeIntegrations();
  }

  private initializeIntegrations(): void {
    // Authentication Integrations
    this.addIntegration({
      id: 'auth0',
      name: 'Auth0',
      description: 'Complete authentication and authorization platform',
      category: 'auth',
      complexity: 2,
      pricing: 'freemium',
      documentation: 'https://auth0.com/docs',
      setupSteps: [
        'Create Auth0 application',
        'Configure callback URLs',
        'Set up social connections',
        'Configure JWT settings',
        'Test authentication flow',
      ],
      configFields: [
        {
          name: 'domain',
          type: 'string',
          description: 'Auth0 domain',
          required: true,
        },
        {
          name: 'clientId',
          type: 'secret',
          description: 'Auth0 client ID',
          required: true,
        },
        {
          name: 'clientSecret',
          type: 'secret',
          description: 'Auth0 client secret',
          required: true,
        },
        {
          name: 'scope',
          type: 'string',
          description: 'OAuth scope',
          required: false,
          default: 'openid profile email',
        },
      ],
      dependencies: ['@auth0/auth0-react', '@auth0/nextjs-auth0'],
      codeSnippets: {
        frontend: `import { Auth0Provider } from '@auth0/auth0-react';

function App() {
  return (
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      redirectUri={window.location.origin}
    >
      <AppContent />
    </Auth0Provider>
  );
}`,
        backend: `import { auth } from 'express-oauth-server';

app.use('/api/protected', auth.authenticate(), (req, res) => {
  res.json({ user: req.user });
});`,
        config: `AUTH0_DOMAIN={{domain}}
AUTH0_CLIENT_ID={{clientId}}
AUTH0_CLIENT_SECRET={{clientSecret}}
AUTH0_SCOPE={{scope}}`,
      },
      envVariables: ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'AUTH0_SCOPE'],
    });

    this.addIntegration({
      id: 'firebase-auth',
      name: 'Firebase Authentication',
      description: 'Google Firebase authentication service',
      category: 'auth',
      complexity: 2,
      pricing: 'freemium',
      documentation: 'https://firebase.google.com/docs/auth',
      setupSteps: [
        'Create Firebase project',
        'Enable Authentication',
        'Configure sign-in methods',
        'Download service account key',
        'Initialize Firebase SDK',
      ],
      configFields: [
        {
          name: 'apiKey',
          type: 'secret',
          description: 'Firebase API key',
          required: true,
        },
        {
          name: 'authDomain',
          type: 'string',
          description: 'Firebase auth domain',
          required: true,
        },
        {
          name: 'projectId',
          type: 'string',
          description: 'Firebase project ID',
          required: true,
        },
      ],
      dependencies: ['firebase', 'firebase-admin'],
      codeSnippets: {
        frontend: `import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);`,
        backend: `import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const verifyToken = async (token: string) => {
  return await admin.auth().verifyIdToken(token);
};`,
      },
      envVariables: ['FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN', 'FIREBASE_PROJECT_ID'],
    });

    // Payment Integrations
    this.addIntegration({
      id: 'stripe',
      name: 'Stripe',
      description: 'Complete payment processing platform',
      category: 'payment',
      complexity: 3,
      pricing: 'paid',
      documentation: 'https://stripe.com/docs',
      setupSteps: [
        'Create Stripe account',
        'Get API keys',
        'Set up webhooks',
        'Configure payment methods',
        'Test with test keys',
      ],
      configFields: [
        {
          name: 'publishableKey',
          type: 'secret',
          description: 'Stripe publishable key',
          required: true,
        },
        {
          name: 'secretKey',
          type: 'secret',
          description: 'Stripe secret key',
          required: true,
        },
        {
          name: 'webhookSecret',
          type: 'secret',
          description: 'Webhook endpoint secret',
          required: false,
        },
        {
          name: 'currency',
          type: 'select',
          description: 'Default currency',
          required: true,
          default: 'usd',
          options: ['usd', 'eur', 'gbp', 'cad', 'aud'],
        },
      ],
      dependencies: ['stripe', '@stripe/stripe-js', '@stripe/react-stripe-js'],
      codeSnippets: {
        frontend: `import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function App() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}`,
        backend: `import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

app.post('/api/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: '{{currency}}',
  });
  
  res.json({ clientSecret: paymentIntent.client_secret });
});`,
      },
      envVariables: ['STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    });

    // Email Service Integrations
    this.addIntegration({
      id: 'sendgrid',
      name: 'SendGrid',
      description: 'Email delivery service',
      category: 'email',
      complexity: 2,
      pricing: 'freemium',
      documentation: 'https://docs.sendgrid.com',
      setupSteps: [
        'Create SendGrid account',
        'Verify sender identity',
        'Generate API key',
        'Configure domain authentication',
        'Test email sending',
      ],
      configFields: [
        {
          name: 'apiKey',
          type: 'secret',
          description: 'SendGrid API key',
          required: true,
        },
        {
          name: 'fromEmail',
          type: 'string',
          description: 'Default sender email',
          required: true,
        },
        {
          name: 'fromName',
          type: 'string',
          description: 'Default sender name',
          required: false,
        },
      ],
      dependencies: ['@sendgrid/mail'],
      codeSnippets: {
        backend: `import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async (to: string, subject: string, content: string) => {
  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME || 'Your App',
    },
    subject,
    html: content,
  };
  
  await sgMail.send(msg);
};`,
      },
      envVariables: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL', 'SENDGRID_FROM_NAME'],
    });

    // Cloud Storage Integrations
    this.addIntegration({
      id: 'aws-s3',
      name: 'AWS S3',
      description: 'Amazon S3 cloud storage',
      category: 'storage',
      complexity: 3,
      pricing: 'paid',
      documentation: 'https://docs.aws.amazon.com/s3/',
      setupSteps: [
        'Create AWS account',
        'Create S3 bucket',
        'Set up IAM user with S3 permissions',
        'Configure CORS policy',
        'Test file upload/download',
      ],
      configFields: [
        {
          name: 'accessKeyId',
          type: 'secret',
          description: 'AWS access key ID',
          required: true,
        },
        {
          name: 'secretAccessKey',
          type: 'secret',
          description: 'AWS secret access key',
          required: true,
        },
        {
          name: 'region',
          type: 'select',
          description: 'AWS region',
          required: true,
          default: 'us-east-1',
          options: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
        },
        {
          name: 'bucketName',
          type: 'string',
          description: 'S3 bucket name',
          required: true,
        },
      ],
      dependencies: ['aws-sdk', '@aws-sdk/client-s3'],
      codeSnippets: {
        backend: `import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadFile = async (key: string, body: Buffer, contentType: string) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  
  return await s3Client.send(command);
};`,
      },
      envVariables: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_BUCKET_NAME'],
    });

    // Analytics Integrations
    this.addIntegration({
      id: 'google-analytics',
      name: 'Google Analytics',
      description: 'Web analytics service',
      category: 'analytics',
      complexity: 1,
      pricing: 'free',
      documentation: 'https://developers.google.com/analytics',
      setupSteps: [
        'Create Google Analytics account',
        'Set up property',
        'Get tracking ID',
        'Install tracking code',
        'Verify tracking',
      ],
      configFields: [
        {
          name: 'trackingId',
          type: 'string',
          description: 'Google Analytics tracking ID',
          required: true,
        },
        {
          name: 'enableDebugging',
          type: 'boolean',
          description: 'Enable debug mode',
          required: false,
          default: false,
        },
      ],
      dependencies: ['gtag'],
      codeSnippets: {
        frontend: `import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: any;
  }
}

export const useGoogleAnalytics = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = \`https://www.googletagmanager.com/gtag/js?id=\${process.env.REACT_APP_GA_TRACKING_ID}\`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', process.env.REACT_APP_GA_TRACKING_ID);
  }, []);
};`,
      },
      envVariables: ['GA_TRACKING_ID'],
    });

    // Database Integrations
    this.addIntegration({
      id: 'supabase',
      name: 'Supabase',
      description: 'Open source Firebase alternative',
      category: 'database',
      complexity: 2,
      pricing: 'freemium',
      documentation: 'https://supabase.com/docs',
      setupSteps: [
        'Create Supabase project',
        'Set up database schema',
        'Configure authentication',
        'Generate API keys',
        'Set up row level security',
      ],
      configFields: [
        {
          name: 'url',
          type: 'string',
          description: 'Supabase project URL',
          required: true,
        },
        {
          name: 'anonKey',
          type: 'secret',
          description: 'Supabase anon key',
          required: true,
        },
        {
          name: 'serviceRoleKey',
          type: 'secret',
          description: 'Supabase service role key',
          required: false,
        },
      ],
      dependencies: ['@supabase/supabase-js'],
      codeSnippets: {
        frontend: `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);`,
        backend: `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);`,
      },
      envVariables: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    });

    // Monitoring Integrations
    this.addIntegration({
      id: 'sentry',
      name: 'Sentry',
      description: 'Error tracking and performance monitoring',
      category: 'monitoring',
      complexity: 2,
      pricing: 'freemium',
      documentation: 'https://docs.sentry.io',
      setupSteps: [
        'Create Sentry account',
        'Create new project',
        'Get DSN key',
        'Install SDK',
        'Configure error reporting',
      ],
      configFields: [
        {
          name: 'dsn',
          type: 'secret',
          description: 'Sentry DSN',
          required: true,
        },
        {
          name: 'environment',
          type: 'select',
          description: 'Environment',
          required: true,
          default: 'production',
          options: ['development', 'staging', 'production'],
        },
        {
          name: 'tracesSampleRate',
          type: 'number',
          description: 'Performance monitoring sample rate',
          required: false,
          default: 0.1,
        },
      ],
      dependencies: ['@sentry/react', '@sentry/node'],
      codeSnippets: {
        frontend: `import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: {{tracesSampleRate}},
});

export default Sentry.withErrorBoundary(App, {
  fallback: ErrorFallback,
});`,
        backend: `import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: {{tracesSampleRate}},
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());`,
      },
      envVariables: ['SENTRY_DSN'],
    });
  }

  private addIntegration(integration: Integration): void {
    this.integrations.set(integration.id, integration);
  }

  async getIntegration(integrationId: string): Promise<Integration | null> {
    return this.integrations.get(integrationId) || null;
  }

  async getAllIntegrations(): Promise<Integration[]> {
    return Array.from(this.integrations.values());
  }

  async getIntegrationsByCategory(category: string): Promise<Integration[]> {
    return Array.from(this.integrations.values())
      .filter(integration => integration.category === category);
  }

  async generateIntegrationFiles(
    integrationIds: string[],
    configurations: Record<string, any>,
  ): Promise<ProjectFiles> {
    const files: ProjectFiles = {};

    for (const integrationId of integrationIds) {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        continue;
      }

      const config = configurations[integrationId] || {};

      // Generate environment variables file
      const envContent = this.generateEnvContent(integration, config);
      if (envContent) {
        files[`.env.${integrationId}`] = envContent;
      }

      // Generate configuration files
      if (integration.codeSnippets.config) {
        files[`config/${integrationId}.ts`] = this.processTemplate(
          integration.codeSnippets.config,
          config,
        );
      }

      // Generate service files
      if (integration.codeSnippets.backend) {
        files[`src/services/${integrationId}.ts`] = this.processTemplate(
          integration.codeSnippets.backend,
          config,
        );
      }

      // Generate frontend hooks/components
      if (integration.codeSnippets.frontend) {
        files[`src/hooks/use${this.capitalize(integrationId)}.ts`] = this.processTemplate(
          integration.codeSnippets.frontend,
          config,
        );
      }

      // Generate TypeScript types
      if (integration.codeSnippets.types) {
        files[`src/types/${integrationId}.ts`] = this.processTemplate(
          integration.codeSnippets.types,
          config,
        );
      }

      // Generate documentation
      files[`docs/integrations/${integrationId}.md`] = this.generateIntegrationDocs(integration, config);
    }

    // Generate main integrations index file
    files['src/integrations/index.ts'] = this.generateIntegrationsIndex(integrationIds);

    return files;
  }

  private generateEnvContent(integration: Integration, config: Record<string, any>): string {
    const envLines: string[] = [];
    
    envLines.push(`# ${integration.name} Configuration`);
    envLines.push(`# ${integration.description}`);
    envLines.push('');

    for (const envVar of integration.envVariables) {
      const configField = integration.configFields.find(field => 
        envVar.toLowerCase().includes(field.name.toLowerCase()),
      );
      
      if (configField) {
        const value = config[configField.name] || configField.default || '';
        envLines.push(`${envVar}=${value}`);
      } else {
        envLines.push(`${envVar}=`);
      }
    }

    return envLines.join('\n');
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;

    // Replace template variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, String(value));
    }

    return processed;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private generateIntegrationDocs(integration: Integration, config: Record<string, any>): string {
    return `# ${integration.name} Integration

${integration.description}

## Setup Steps

${integration.setupSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## Configuration

${integration.configFields.map(field => 
    `- **${field.name}** (${field.type}): ${field.description}${field.required ? ' *Required*' : ''}`,
  ).join('\n')}

## Environment Variables

${integration.envVariables.map(envVar => `- \`${envVar}\``).join('\n')}

## Dependencies

${integration.dependencies.map(dep => `- \`${dep}\``).join('\n')}

## Documentation

For more information, visit: ${integration.documentation}

## Complexity: ${integration.complexity}/5
## Pricing: ${integration.pricing}
`;
  }

  private generateIntegrationsIndex(integrationIds: string[]): string {
    const imports = integrationIds.map(id => 
      `export * from './${id}';`,
    ).join('\n');

    return `// Auto-generated integrations index
${imports}

export const enabledIntegrations = [
${integrationIds.map(id => `  '${id}'`).join(',\n')}
];
`;
  }

  async validateIntegrationConfig(
    integrationId: string, 
    config: Record<string, any>,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const integration = await this.getIntegration(integrationId);
    if (!integration) {
      return { isValid: false, errors: ['Integration not found'] };
    }

    const errors: string[] = [];

    for (const field of integration.configFields) {
      if (field.required && (!config[field.name] || config[field.name] === '')) {
        errors.push(`${field.name} is required`);
        continue;
      }

      const value = config[field.name];
      if (value !== undefined && value !== '') {
        // Type validation
        switch (field.type) {
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`${field.name} must be a number`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`${field.name} must be a boolean`);
            }
            break;
          case 'select':
            if (field.options && !field.options.includes(value)) {
              errors.push(`${field.name} must be one of: ${field.options.join(', ')}`);
            }
            break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async getIntegrationEstimation(integrationIds: string[]): Promise<{
    totalComplexity: number;
    estimatedSetupTime: string;
    monthlyCosting: string;
    dependencies: string[];
  }> {
    const integrations = await Promise.all(
      integrationIds.map(id => this.getIntegration(id)),
    );

    const validIntegrations = integrations.filter(Boolean) as Integration[];

    const totalComplexity = validIntegrations.reduce((sum, integration) => 
      sum + integration.complexity, 0,
    );

    const dependencies = Array.from(new Set(
      validIntegrations.flatMap(integration => integration.dependencies),
    ));

    // Estimate setup time based on complexity
    const estimatedHours = validIntegrations.reduce((sum, integration) => 
      sum + (integration.complexity * 2), 0,
    );

    let estimatedSetupTime: string;
    if (estimatedHours <= 4) {
      estimatedSetupTime = '2-4 hours';
    } else if (estimatedHours <= 8) {
      estimatedSetupTime = '4-8 hours';
    } else if (estimatedHours <= 16) {
      estimatedSetupTime = '1-2 days';
    } else {
      estimatedSetupTime = '3+ days';
    }

    // Estimate monthly costs
    const paidServices = validIntegrations.filter(i => i.pricing === 'paid').length;
    const freemiumServices = validIntegrations.filter(i => i.pricing === 'freemium').length;

    let monthlyCosting: string;
    if (paidServices === 0 && freemiumServices === 0) {
      monthlyCosting = 'Free';
    } else if (paidServices === 0) {
      monthlyCosting = 'Free - $50/month';
    } else if (paidServices <= 2) {
      monthlyCosting = '$50 - $200/month';
    } else {
      monthlyCosting = '$200+/month';
    }

    return {
      totalComplexity,
      estimatedSetupTime,
      monthlyCosting,
      dependencies,
    };
  }
}

export const integrationSetup = new IntegrationSetupService();

// API endpoints
export const getAllIntegrations = api(
  { method: 'GET', path: '/integrations' },
  async (): Promise<Integration[]> => {
    return await integrationSetup.getAllIntegrations();
  },
);

export const getIntegration = api(
  { method: 'GET', path: '/integrations/:integrationId' },
  async ({ integrationId }: { integrationId: string }): Promise<Integration | null> => {
    return await integrationSetup.getIntegration(integrationId);
  },
);

export const getIntegrationsByCategory = api(
  { method: 'GET', path: '/integrations/category/:category' },
  async ({ category }: { category: string }): Promise<Integration[]> => {
    return await integrationSetup.getIntegrationsByCategory(category);
  },
);

export const validateIntegrationConfig = api(
  { method: 'POST', path: '/integrations/:integrationId/validate' },
  async ({ 
    integrationId, 
    config, 
  }: { 
    integrationId: string; 
    config: Record<string, any> 
  }) => {
    return await integrationSetup.validateIntegrationConfig(integrationId, config);
  },
);

export const getIntegrationEstimation = api(
  { method: 'POST', path: '/integrations/estimate' },
  async ({ integrationIds }: { integrationIds: string[] }) => {
    return await integrationSetup.getIntegrationEstimation(integrationIds);
  },
);

export const generateIntegrationFiles = api(
  { method: 'POST', path: '/integrations/generate' },
  async ({ 
    integrationIds, 
    configurations, 
  }: { 
    integrationIds: string[]; 
    configurations: Record<string, any> 
  }): Promise<ProjectFiles> => {
    return await integrationSetup.generateIntegrationFiles(integrationIds, configurations);
  },
);