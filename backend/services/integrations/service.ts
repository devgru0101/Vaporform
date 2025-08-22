import { api } from "encore.dev/api";
import { db } from "../../utils/database";

// Interfaces
interface Integration {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  provider: string;
  version: string;
  status: 'active' | 'deprecated' | 'beta';
  
  // Auth & Credentials
  authType: 'api_key' | 'oauth2' | 'webhook' | 'none';
  requiredCredentials: string[];
  optionalCredentials: string[];
  
  // Documentation
  setupInstructions?: string;
  documentationUrl?: string;
  supportUrl?: string;
  webhookUrl?: string;
  
  // Capabilities
  supportedEvents: string[];
  supportedActions: string[];
  features: string[];
  
  // Configuration
  configSchema: Record<string, any>;
  defaultConfig: Record<string, any>;
  
  // Compatibility
  supportedFrameworks: string[];
  minFrameworkVersion?: string;
  
  // Pricing
  pricingModel: 'free' | 'freemium' | 'paid' | 'enterprise';
  rateLimits: Record<string, any>;
  
  // Metadata
  iconUrl?: string;
  homepageUrl?: string;
  popularity: number;
  installCount: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  
  // Discovery
  tags: string[];
  
  // Flags
  isOfficial: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  requiresApproval: boolean;
  
  // Relationships
  createdBy?: string;
  maintainedBy?: string;
}

interface UserIntegration {
  id: string;
  userId: string;
  integrationId: string;
  projectId?: string;
  
  // Configuration
  config: Record<string, any>;
  credentials: Record<string, any>; // Should be encrypted in production
  
  // State
  status: 'active' | 'inactive' | 'error' | 'pending';
  lastSync?: string;
  errorMessage?: string;
  syncCount: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
}

interface IntegrationEvent {
  id: string;
  userIntegrationId: string;
  eventType: string;
  eventData: Record<string, any>;
  
  // Processing
  status: 'pending' | 'processed' | 'failed' | 'retrying';
  processedAt?: string;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  
  // Metadata
  source?: string; // 'webhook', 'sync', 'manual'
  externalId?: string;
  
  createdAt: string;
}

// Request/Response interfaces
interface ListIntegrationsRequest {
  category?: string;
  provider?: string;
  status?: string;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

interface InstallIntegrationRequest {
  integrationId: string;
  userId: string;
  projectId?: string;
  config?: Record<string, any>;
  credentials?: Record<string, any>;
}

interface UpdateUserIntegrationRequest {
  id: string;
  config?: Record<string, any>;
  credentials?: Record<string, any>;
  status?: 'active' | 'inactive' | 'error' | 'pending';
}

interface CreateWebhookEventRequest {
  userIntegrationId: string;
  eventType: string;
  eventData: Record<string, any>;
  source?: string;
  externalId?: string;
}

// API Endpoints

export const listIntegrations = api(
  { method: "GET", path: "/integrations" },
  async (req: ListIntegrationsRequest): Promise<{ integrations: Integration[]; total: number }> => {
    // Mock data for development
    const mockIntegrations: Integration[] = [
      {
        id: 'stripe-payments',
        name: 'stripe',
        displayName: 'Stripe',
        description: 'Accept payments online with Stripe\'s powerful payment processing platform',
        category: 'payments',
        provider: 'stripe',
        version: '2.0.0',
        status: 'active',
        
        authType: 'api_key',
        requiredCredentials: ['api_key', 'secret_key'],
        optionalCredentials: ['webhook_secret'],
        
        setupInstructions: '1. Create a Stripe account\n2. Get your API keys from the dashboard\n3. Configure webhook endpoints',
        documentationUrl: 'https://stripe.com/docs',
        supportUrl: 'https://support.stripe.com',
        webhookUrl: 'https://api.vaporform.com/webhooks/stripe',
        
        supportedEvents: ['payment.succeeded', 'payment.failed', 'subscription.created', 'subscription.cancelled'],
        supportedActions: ['create_payment_intent', 'create_customer', 'create_subscription'],
        features: ['One-time payments', 'Subscriptions', 'Webhooks', 'Customer management'],
        
        configSchema: {
          currency: { type: 'string', default: 'usd', enum: ['usd', 'eur', 'gbp'] },
          capture_method: { type: 'string', default: 'automatic', enum: ['automatic', 'manual'] }
        },
        defaultConfig: {
          currency: 'usd',
          capture_method: 'automatic'
        },
        
        supportedFrameworks: ['react', 'vue', 'angular', 'node'],
        minFrameworkVersion: '16.0.0',
        
        pricingModel: 'freemium',
        rateLimits: {
          requests_per_second: 100,
          requests_per_hour: 10000
        },
        
        iconUrl: 'https://cdn.vaporform.com/integrations/stripe.svg',
        homepageUrl: 'https://stripe.com',
        popularity: 1500,
        installCount: 25000,
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        
        tags: ['payments', 'billing', 'subscriptions', 'e-commerce'],
        
        isOfficial: true,
        isFeatured: true,
        isVerified: true,
        requiresApproval: false,
        
        createdBy: 'vaporform-team',
        maintainedBy: 'vaporform-team'
      },
      {
        id: 'auth0-authentication',
        name: 'auth0',
        displayName: 'Auth0',
        description: 'Secure authentication and authorization platform with social logins and SSO',
        category: 'authentication',
        provider: 'auth0',
        version: '1.8.0',
        status: 'active',
        
        authType: 'oauth2',
        requiredCredentials: ['client_id', 'client_secret', 'domain'],
        optionalCredentials: ['audience'],
        
        setupInstructions: '1. Create Auth0 account\n2. Set up application\n3. Configure callback URLs',
        documentationUrl: 'https://auth0.com/docs',
        supportUrl: 'https://support.auth0.com',
        
        supportedEvents: ['user.login', 'user.signup', 'user.logout', 'user.profile.updated'],
        supportedActions: ['authenticate', 'get_profile', 'update_profile', 'logout'],
        features: ['Social logins', 'SSO', 'MFA', 'User management', 'JWT tokens'],
        
        configSchema: {
          redirect_uri: { type: 'string', required: true },
          scope: { type: 'string', default: 'openid profile email' },
          response_type: { type: 'string', default: 'code' }
        },
        defaultConfig: {
          scope: 'openid profile email',
          response_type: 'code'
        },
        
        supportedFrameworks: ['react', 'vue', 'angular', 'node', 'express'],
        minFrameworkVersion: '16.0.0',
        
        pricingModel: 'freemium',
        rateLimits: {
          requests_per_second: 50,
          requests_per_hour: 7500
        },
        
        iconUrl: 'https://cdn.vaporform.com/integrations/auth0.svg',
        homepageUrl: 'https://auth0.com',
        popularity: 1200,
        installCount: 18000,
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        
        tags: ['authentication', 'authorization', 'sso', 'oauth', 'security'],
        
        isOfficial: true,
        isFeatured: true,
        isVerified: true,
        requiresApproval: false,
        
        createdBy: 'vaporform-team',
        maintainedBy: 'vaporform-team'
      },
      {
        id: 'sendgrid-email',
        name: 'sendgrid',
        displayName: 'SendGrid',
        description: 'Reliable email delivery service with analytics and templates',
        category: 'communication',
        provider: 'sendgrid',
        version: '1.5.0',
        status: 'active',
        
        authType: 'api_key',
        requiredCredentials: ['api_key'],
        optionalCredentials: ['from_email', 'from_name'],
        
        setupInstructions: '1. Create SendGrid account\n2. Generate API key\n3. Verify sender identity',
        documentationUrl: 'https://docs.sendgrid.com',
        supportUrl: 'https://support.sendgrid.com',
        webhookUrl: 'https://api.vaporform.com/webhooks/sendgrid',
        
        supportedEvents: ['email.delivered', 'email.opened', 'email.clicked', 'email.bounced'],
        supportedActions: ['send_email', 'send_template_email', 'add_contact', 'create_template'],
        features: ['Email sending', 'Templates', 'Analytics', 'Contact management'],
        
        configSchema: {
          from_email: { type: 'string', required: true },
          from_name: { type: 'string', default: 'Your App' },
          reply_to: { type: 'string' }
        },
        defaultConfig: {
          from_name: 'Your App'
        },
        
        supportedFrameworks: ['node', 'react', 'vue', 'python'],
        
        pricingModel: 'freemium',
        rateLimits: {
          emails_per_day: 100,
          emails_per_month: 12000
        },
        
        iconUrl: 'https://cdn.vaporform.com/integrations/sendgrid.svg',
        homepageUrl: 'https://sendgrid.com',
        popularity: 800,
        installCount: 12000,
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        
        tags: ['email', 'communication', 'templates', 'analytics'],
        
        isOfficial: true,
        isFeatured: true,
        isVerified: true,
        requiresApproval: false,
        
        createdBy: 'vaporform-team',
        maintainedBy: 'vaporform-team'
      },
      {
        id: 'google-analytics',
        name: 'google-analytics',
        displayName: 'Google Analytics',
        description: 'Track website traffic and user behavior with Google Analytics',
        category: 'analytics',
        provider: 'google',
        version: '4.0.0',
        status: 'active',
        
        authType: 'api_key',
        requiredCredentials: ['tracking_id'],
        optionalCredentials: ['measurement_id', 'api_secret'],
        
        setupInstructions: '1. Create Google Analytics account\n2. Set up property\n3. Get tracking ID',
        documentationUrl: 'https://developers.google.com/analytics',
        supportUrl: 'https://support.google.com/analytics',
        
        supportedEvents: ['page_view', 'custom_event', 'conversion', 'purchase'],
        supportedActions: ['track_event', 'track_page_view', 'track_conversion'],
        features: ['Page tracking', 'Event tracking', 'E-commerce tracking', 'Custom dimensions'],
        
        configSchema: {
          tracking_id: { type: 'string', required: true },
          send_page_view: { type: 'boolean', default: true },
          anonymize_ip: { type: 'boolean', default: true }
        },
        defaultConfig: {
          send_page_view: true,
          anonymize_ip: true
        },
        
        supportedFrameworks: ['react', 'vue', 'angular', 'html'],
        
        pricingModel: 'free',
        rateLimits: {
          hits_per_session: 500,
          hits_per_month: 10000000
        },
        
        iconUrl: 'https://cdn.vaporform.com/integrations/google-analytics.svg',
        homepageUrl: 'https://analytics.google.com',
        popularity: 2000,
        installCount: 50000,
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        
        tags: ['analytics', 'tracking', 'google', 'metrics'],
        
        isOfficial: true,
        isFeatured: true,
        isVerified: true,
        requiresApproval: false,
        
        createdBy: 'vaporform-team',
        maintainedBy: 'vaporform-team'
      }
    ];

    // Apply filtering
    let filteredIntegrations = mockIntegrations;

    if (req.category) {
      filteredIntegrations = filteredIntegrations.filter(i => i.category === req.category);
    }

    if (req.provider) {
      filteredIntegrations = filteredIntegrations.filter(i => i.provider === req.provider);
    }

    if (req.status) {
      filteredIntegrations = filteredIntegrations.filter(i => i.status === req.status);
    }

    if (req.featured) {
      filteredIntegrations = filteredIntegrations.filter(i => i.isFeatured);
    }

    if (req.search) {
      const searchLower = req.search.toLowerCase();
      filteredIntegrations = filteredIntegrations.filter(i =>
        i.name.toLowerCase().includes(searchLower) ||
        i.displayName.toLowerCase().includes(searchLower) ||
        i.description.toLowerCase().includes(searchLower) ||
        i.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    const offset = req.offset || 0;
    const limit = req.limit || 20;
    const paginatedIntegrations = filteredIntegrations.slice(offset, offset + limit);

    return {
      integrations: paginatedIntegrations,
      total: filteredIntegrations.length
    };
  }
);

export const getIntegration = api(
  { method: "GET", path: "/integrations/:id" },
  async ({ id }: { id: string }): Promise<Integration> => {
    const result = await listIntegrations({});
    const integration = result.integrations.find(i => i.id === id);
    
    if (!integration) {
      throw new Error("Integration not found");
    }

    return integration;
  }
);

export const getIntegrationCategories = api(
  { method: "GET", path: "/integrations/categories" },
  async (): Promise<{ categories: Array<{ name: string; count: number; description: string }> }> => {
    return {
      categories: [
        {
          name: 'payments',
          count: 15,
          description: 'Payment processing and billing solutions'
        },
        {
          name: 'authentication',
          count: 12,
          description: 'User authentication and authorization services'
        },
        {
          name: 'communication',
          count: 18,
          description: 'Email, SMS, and messaging services'
        },
        {
          name: 'analytics',
          count: 22,
          description: 'Analytics and tracking solutions'
        },
        {
          name: 'storage',
          count: 8,
          description: 'File and data storage services'
        },
        {
          name: 'ai',
          count: 25,
          description: 'AI and machine learning APIs'
        },
        {
          name: 'social',
          count: 10,
          description: 'Social media and sharing integrations'
        },
        {
          name: 'productivity',
          count: 14,
          description: 'Productivity and workflow tools'
        }
      ]
    };
  }
);

export const installIntegration = api(
  { method: "POST", path: "/integrations/:id/install" },
  async ({ id, ...req }: { id: string } & InstallIntegrationRequest): Promise<UserIntegration> => {
    const userIntegrationId = "user-integration-" + Date.now();
    const now = new Date().toISOString();

    const userIntegration: UserIntegration = {
      id: userIntegrationId,
      userId: req.userId,
      integrationId: id,
      projectId: req.projectId,
      config: req.config || {},
      credentials: req.credentials || {},
      status: 'pending',
      syncCount: 0,
      createdAt: now,
      updatedAt: now
    };

    // In production, this would be stored in the database
    return userIntegration;
  }
);

export const getUserIntegrations = api(
  { method: "GET", path: "/integrations/user/:userId/list" },
  async ({ userId, projectId }: { userId: string; projectId?: string }): Promise<{ userIntegrations: UserIntegration[] }> => {
    // Mock user integrations
    const mockUserIntegrations: UserIntegration[] = [
      {
        id: 'user-stripe-1',
        userId,
        integrationId: 'stripe-payments',
        projectId: projectId || 'project-1',
        config: { currency: 'usd' },
        credentials: { api_key: '***' }, // Masked for security
        status: 'active',
        syncCount: 45,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activatedAt: new Date().toISOString()
      }
    ];

    let filteredIntegrations = mockUserIntegrations.filter(ui => ui.userId === userId);

    if (projectId) {
      filteredIntegrations = filteredIntegrations.filter(ui => ui.projectId === projectId);
    }

    return { userIntegrations: filteredIntegrations };
  }
);

export const updateUserIntegration = api(
  { method: "PUT", path: "/integrations/user/:id" },
  async ({ id, ...req }: { id: string } & UpdateUserIntegrationRequest): Promise<UserIntegration> => {
    // In production, this would update the database record
    const updated: UserIntegration = {
      id,
      userId: 'user-1',
      integrationId: 'stripe-payments',
      config: req.config || {},
      credentials: req.credentials || {},
      status: req.status || 'active',
      syncCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return updated;
  }
);

export const deleteUserIntegration = api(
  { method: "DELETE", path: "/integrations/user/:id" },
  async ({ id }: { id: string }): Promise<{ success: boolean }> => {
    // In production, this would soft delete or remove the user integration
    return { success: true };
  }
);

export const testIntegration = api(
  { method: "POST", path: "/integrations/:id/test" },
  async ({ id, credentials, config }: { id: string; credentials: Record<string, any>; config?: Record<string, any> }): Promise<{
    success: boolean;
    message: string;
    details?: Record<string, any>;
  }> => {
    // Mock integration test
    const integration = await getIntegration({ id });
    
    // Simulate validation
    const requiredKeys = integration.requiredCredentials;
    const missingKeys = requiredKeys.filter(key => !credentials[key]);
    
    if (missingKeys.length > 0) {
      return {
        success: false,
        message: `Missing required credentials: ${missingKeys.join(', ')}`
      };
    }

    return {
      success: true,
      message: 'Integration test successful',
      details: {
        testedAt: new Date().toISOString(),
        version: integration.version
      }
    };
  }
);

export const createWebhookEvent = api(
  { method: "POST", path: "/integrations/webhook" },
  async (req: CreateWebhookEventRequest): Promise<IntegrationEvent> => {
    const eventId = "event-" + Date.now();
    const now = new Date().toISOString();

    const event: IntegrationEvent = {
      id: eventId,
      userIntegrationId: req.userIntegrationId,
      eventType: req.eventType,
      eventData: req.eventData,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      source: req.source || 'webhook',
      externalId: req.externalId,
      createdAt: now
    };

    // In production, this would be stored in the database and processed asynchronously
    return event;
  }
);

export const getIntegrationEvents = api(
  { method: "GET", path: "/integrations/user/:userIntegrationId/events" },
  async ({ userIntegrationId, limit, offset }: { userIntegrationId: string; limit?: number; offset?: number }): Promise<{
    events: IntegrationEvent[];
    total: number;
  }> => {
    // Mock events
    const mockEvents: IntegrationEvent[] = [
      {
        id: 'event-1',
        userIntegrationId,
        eventType: 'payment.succeeded',
        eventData: { amount: 2000, currency: 'usd', customer: 'cus_123' },
        status: 'processed',
        retryCount: 0,
        maxRetries: 3,
        source: 'webhook',
        externalId: 'pi_123',
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      }
    ];

    const limitValue = limit || 50;
    const offsetValue = offset || 0;
    const paginatedEvents = mockEvents.slice(offsetValue, offsetValue + limitValue);

    return {
      events: paginatedEvents,
      total: mockEvents.length
    };
  }
);

export const getFeaturedIntegrations = api(
  { method: "GET", path: "/integrations/featured" },
  async ({ limit }: { limit?: number }): Promise<{ integrations: Integration[] }> => {
    const result = await listIntegrations({ featured: true, limit: limit || 10 });
    return { integrations: result.integrations };
  }
);

export const searchIntegrations = api(
  { method: "GET", path: "/integrations/search" },
  async ({ query, category, limit }: { query: string; category?: string; limit?: number }): Promise<{
    integrations: Integration[];
    total: number;
  }> => {
    const result = await listIntegrations({
      search: query,
      category,
      limit: limit || 20
    });
    
    return {
      integrations: result.integrations,
      total: result.total
    };
  }
);

// Frontend Compatibility Endpoints
export const getProviders = api(
  { method: "GET", path: "/integrations/providers" },
  async (req: ListIntegrationsRequest): Promise<{ providers: Integration[] }> => {
    const result = await listIntegrations(req);
    return { providers: result.integrations };
  }
);

export const getProviderDetails = api(
  { method: "GET", path: "/integrations/providers/:id" },
  async ({ id }: { id: string }): Promise<Integration> => {
    return await getIntegration({ id });
  }
);

export const getProvidersByType = api(
  { method: "GET", path: "/integrations/providers/type/:type" },
  async ({ type }: { type: string }): Promise<{ providers: Integration[] }> => {
    const result = await listIntegrations({ category: type });
    return { providers: result.integrations };
  }
);

export const getProvidersByCategory = api(
  { method: "GET", path: "/integrations/providers/category/:category" },
  async ({ category }: { category: string }): Promise<{ providers: Integration[] }> => {
    const result = await listIntegrations({ category });
    return { providers: result.integrations };
  }
);

export const searchProviders = api(
  { method: "GET", path: "/integrations/providers/search" },
  async ({ q, category, limit }: { q: string; category?: string; limit?: number }): Promise<{
    providers: Integration[];
    total: number;
  }> => {
    const result = await listIntegrations({
      search: q,
      category,
      limit: limit || 20
    });
    
    return {
      providers: result.integrations,
      total: result.total
    };
  }
);

export const getPopularProviders = api(
  { method: "GET", path: "/integrations/providers/popular" },
  async ({ limit }: { limit?: number }): Promise<{ providers: Integration[] }> => {
    const result = await getFeaturedIntegrations({ limit: limit || 10 });
    return { providers: result.integrations };
  }
);