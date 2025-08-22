import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { 
  LinkIcon, 
  CheckIcon, 
  LockIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  CloudIcon,
  SparklesIcon,
  CogIcon
} from '../../ui/Icons';
import { Input } from '../../ui/Input';
import { updateProjectData } from '../../../store/projectWizard';

interface IntegrationsStepProps {
  className?: string;
}

const INTEGRATION_CATEGORIES = [
  {
    id: 'authentication',
    name: 'Authentication',
    icon: LockIcon,
    description: 'User authentication and authorization',
    integrations: [
      {
        id: 'auth0',
        name: 'Auth0',
        description: 'Complete authentication platform',
        category: 'authentication',
        popularity: 'high',
        pricing: 'Free tier available',
        setupTime: '15 minutes',
        features: ['Social login', 'MFA', 'User management', 'SSO'],
        config: {
          domain: '',
          clientId: '',
          clientSecret: ''
        }
      },
      {
        id: 'supabase-auth',
        name: 'Supabase Auth',
        description: 'Open source Firebase alternative',
        category: 'authentication',
        popularity: 'medium',
        pricing: 'Free tier available',
        setupTime: '10 minutes',
        features: ['Email auth', 'Social login', 'Row-level security', 'Real-time'],
        config: {
          url: '',
          anonKey: ''
        }
      },
      {
        id: 'firebase-auth',
        name: 'Firebase Auth',
        description: 'Google\'s authentication service',
        category: 'authentication',
        popularity: 'high',
        pricing: 'Free tier available',
        setupTime: '20 minutes',
        features: ['Social login', 'Phone auth', 'Anonymous auth', 'Custom claims'],
        config: {
          apiKey: '',
          authDomain: '',
          projectId: ''
        }
      }
    ]
  },
  {
    id: 'payments',
    name: 'Payments',
    icon: CurrencyDollarIcon,
    description: 'Payment processing and billing',
    integrations: [
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Complete payments platform',
        category: 'payments',
        popularity: 'high',
        pricing: '2.9% + 30¢ per transaction',
        setupTime: '30 minutes',
        features: ['Credit cards', 'Subscriptions', 'Invoicing', 'Multi-party payments'],
        config: {
          publishableKey: '',
          secretKey: '',
          webhookSecret: ''
        }
      },
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Global payment processor',
        category: 'payments',
        popularity: 'medium',
        pricing: '2.9% + 30¢ per transaction',
        setupTime: '25 minutes',
        features: ['PayPal checkout', 'Credit cards', 'Buy now pay later', 'Recurring payments'],
        config: {
          clientId: '',
          clientSecret: ''
        }
      }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: ChartBarIcon,
    description: 'User analytics and tracking',
    integrations: [
      {
        id: 'google-analytics',
        name: 'Google Analytics',
        description: 'Web analytics service',
        category: 'analytics',
        popularity: 'high',
        pricing: 'Free',
        setupTime: '10 minutes',
        features: ['Page views', 'User behavior', 'Conversion tracking', 'Custom events'],
        config: {
          measurementId: ''
        }
      },
      {
        id: 'mixpanel',
        name: 'Mixpanel',
        description: 'Product analytics platform',
        category: 'analytics',
        popularity: 'medium',
        pricing: 'Free tier available',
        setupTime: '15 minutes',
        features: ['Event tracking', 'Funnel analysis', 'Cohort analysis', 'A/B testing'],
        config: {
          projectToken: ''
        }
      },
      {
        id: 'posthog',
        name: 'PostHog',
        description: 'Open source product analytics',
        category: 'analytics',
        popularity: 'medium',
        pricing: 'Free tier available',
        setupTime: '10 minutes',
        features: ['Event tracking', 'Session recording', 'Feature flags', 'Heatmaps'],
        config: {
          apiKey: '',
          host: ''
        }
      }
    ]
  },
  {
    id: 'storage',
    name: 'Storage & CDN',
    icon: CloudIcon,
    description: 'File storage and content delivery',
    integrations: [
      {
        id: 'aws-s3',
        name: 'AWS S3',
        description: 'Amazon cloud storage',
        category: 'storage',
        popularity: 'high',
        pricing: 'Pay as you use',
        setupTime: '20 minutes',
        features: ['Object storage', 'CDN integration', 'Backup', 'Data archiving'],
        config: {
          accessKeyId: '',
          secretAccessKey: '',
          bucketName: '',
          region: ''
        }
      },
      {
        id: 'cloudinary',
        name: 'Cloudinary',
        description: 'Image and video management',
        category: 'storage',
        popularity: 'medium',
        pricing: 'Free tier available',
        setupTime: '15 minutes',
        features: ['Image optimization', 'Video transcoding', 'CDN', 'Transformations'],
        config: {
          cloudName: '',
          apiKey: '',
          apiSecret: ''
        }
      }
    ]
  },
  {
    id: 'ai',
    name: 'AI Services',
    icon: SparklesIcon,
    description: 'Artificial intelligence and machine learning',
    integrations: [
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT and AI models',
        category: 'ai',
        popularity: 'high',
        pricing: 'Pay per token',
        setupTime: '10 minutes',
        features: ['Text generation', 'Code completion', 'Image generation', 'Embeddings'],
        config: {
          apiKey: ''
        }
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Claude AI assistant',
        category: 'ai',
        popularity: 'medium',
        pricing: 'Pay per token',
        setupTime: '10 minutes',
        features: ['Text analysis', 'Code assistance', 'Conversation', 'Reasoning'],
        config: {
          apiKey: ''
        }
      }
    ]
  }
];

export const IntegrationsStep: React.FC<IntegrationsStepProps> = ({ className }) => {
  const dispatch = useDispatch();
  const { projectData } = useSelector((state: RootState) => state.projectWizard);

  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(
    projectData.selectedIntegrations || []
  );
  const [integrationConfigs, setIntegrationConfigs] = useState<Record<string, any>>(
    projectData.integrationConfigs || {}
  );
  const [activeConfig, setActiveConfig] = useState<string | null>(null);

  // Update Redux state when selections change
  useEffect(() => {
    dispatch(updateProjectData({
      selectedIntegrations,
      integrationConfigs
    }));
  }, [selectedIntegrations, integrationConfigs, dispatch]);

  const handleIntegrationToggle = (integrationId: string) => {
    if (selectedIntegrations.includes(integrationId)) {
      setSelectedIntegrations(prev => prev.filter(id => id !== integrationId));
      setIntegrationConfigs(prev => {
        const newConfigs = { ...prev };
        delete newConfigs[integrationId];
        return newConfigs;
      });
      if (activeConfig === integrationId) {
        setActiveConfig(null);
      }
    } else {
      setSelectedIntegrations(prev => [...prev, integrationId]);
      setActiveConfig(integrationId);
    }
  };

  const handleConfigChange = (integrationId: string, field: string, value: string) => {
    setIntegrationConfigs(prev => ({
      ...prev,
      [integrationId]: {
        ...prev[integrationId],
        [field]: value
      }
    }));
  };

  const getIntegrationData = (integrationId: string) => {
    for (const category of INTEGRATION_CATEGORIES) {
      const integration = category.integrations.find(i => i.id === integrationId);
      if (integration) return integration;
    }
    return null;
  };

  const hasSelectedIntegrations = selectedIntegrations.length > 0;

  return (
    <div className={`integrations-step ${className || ''}`}>
      <div className="integrations-header">
        <h2>Configure Integrations</h2>
        <p>Add third-party services to enhance your application's capabilities</p>
      </div>

      <div className="integrations-content">
        <div className="integrations-grid">
          {INTEGRATION_CATEGORIES.map(category => (
            <div key={category.id} className="integration-category">
              <div className="category-header">
                <category.icon size={20} />
                <div className="category-info">
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                </div>
              </div>

              <div className="integrations-list">
                {category.integrations.map(integration => {
                  const isSelected = selectedIntegrations.includes(integration.id);
                  const isConfiguring = activeConfig === integration.id;

                  return (
                    <div key={integration.id} className="integration-card">
                      <div 
                        className={`integration-main ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleIntegrationToggle(integration.id)}
                      >
                        <div className="integration-header">
                          <div className="integration-info">
                            <h4>{integration.name}</h4>
                            <p>{integration.description}</p>
                          </div>
                          <div className="integration-status">
                            {isSelected && <CheckIcon size={20} className="selected-icon" />}
                          </div>
                        </div>

                        <div className="integration-meta">
                          <div className="meta-row">
                            <span className="meta-label">Popularity:</span>
                            <span className={`popularity-badge ${integration.popularity}`}>
                              {integration.popularity}
                            </span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-label">Pricing:</span>
                            <span className="meta-value">{integration.pricing}</span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-label">Setup:</span>
                            <span className="meta-value">{integration.setupTime}</span>
                          </div>
                        </div>

                        <div className="integration-features">
                          <h5>Features</h5>
                          <div className="features-list">
                            {integration.features.map((feature, index) => (
                              <span key={index} className="feature-tag">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="integration-config">
                          <div className="config-header">
                            <CogIcon size={16} />
                            <span>Configuration</span>
                            <button
                              className="config-toggle"
                              onClick={() => setActiveConfig(isConfiguring ? null : integration.id)}
                            >
                              {isConfiguring ? 'Hide' : 'Configure'}
                            </button>
                          </div>

                          {isConfiguring && (
                            <div className="config-form">
                              {Object.entries(integration.config).map(([field, defaultValue]) => (
                                <div key={field} className="config-field">
                                  <label htmlFor={`${integration.id}-${field}`}>
                                    {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                  </label>
                                  <Input
                                    id={`${integration.id}-${field}`}
                                    type={field.toLowerCase().includes('secret') || field.toLowerCase().includes('key') ? 'password' : 'text'}
                                    placeholder={`Enter ${field}...`}
                                    value={integrationConfigs[integration.id]?.[field] || ''}
                                    onChange={(e) => handleConfigChange(integration.id, field, e.target.value)}
                                    className="config-input"
                                  />
                                </div>
                              ))}
                              <div className="config-note">
                                <p>
                                  These values will be stored securely as environment variables. 
                                  You can update them later in your project settings.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Integrations Summary */}
        {hasSelectedIntegrations && (
          <div className="selected-summary">
            <h3>Selected Integrations ({selectedIntegrations.length})</h3>
            <div className="summary-grid">
              {selectedIntegrations.map(integrationId => {
                const integration = getIntegrationData(integrationId);
                if (!integration) return null;

                const isConfigured = integrationConfigs[integrationId] && 
                  Object.values(integrationConfigs[integrationId]).some(value => value);

                return (
                  <div key={integrationId} className="summary-card">
                    <div className="summary-header">
                      <h4>{integration.name}</h4>
                      <div className={`config-status ${isConfigured ? 'configured' : 'pending'}`}>
                        {isConfigured ? 'Configured' : 'Not Configured'}
                      </div>
                    </div>
                    <p>{integration.description}</p>
                    <button
                      className="configure-btn"
                      onClick={() => setActiveConfig(
                        activeConfig === integrationId ? null : integrationId
                      )}
                    >
                      {activeConfig === integrationId ? 'Hide Config' : 'Configure'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasSelectedIntegrations && (
          <div className="empty-state">
            <LinkIcon size={48} />
            <h3>No Integrations Selected</h3>
            <p>
              Integrations are optional but can greatly enhance your application's capabilities. 
              You can always add them later after your project is generated.
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .integrations-step {
          max-width: 1200px;
          margin: 0 auto;
        }

        .integrations-header {
          text-align: center;
          margin-bottom: var(--vf-space-8);
        }

        .integrations-header h2 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-2xl);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-2) 0;
          text-transform: uppercase;
        }

        .integrations-header p {
          font-size: var(--vf-text-base);
          color: var(--vf-text-muted);
          margin: 0;
        }

        .integrations-content {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-8);
        }

        .integrations-grid {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-6);
        }

        .integration-category {
          background: var(--vf-bg-secondary);
          border: 1px solid var(--vf-surface-border);
          padding: var(--vf-space-4);
        }

        .category-header {
          display: flex;
          align-items: center;
          gap: var(--vf-space-3);
          margin-bottom: var(--vf-space-4);
          padding-bottom: var(--vf-space-3);
          border-bottom: 1px solid var(--vf-surface-border);
        }

        .category-info h3 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-lg);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0;
          text-transform: uppercase;
        }

        .category-info p {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-muted);
          margin: var(--vf-space-1) 0 0 0;
        }

        .integrations-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: var(--vf-space-4);
        }

        .integration-card {
          background: var(--vf-bg-tertiary);
          border: 2px solid var(--vf-surface-border);
          transition: all var(--vf-transition-fast);
        }

        .integration-main {
          padding: var(--vf-space-4);
          cursor: pointer;
          transition: all var(--vf-transition-fast);
        }

        .integration-main:hover {
          background: var(--vf-bg-elevated);
        }

        .integration-main.selected {
          background: var(--vf-bg-secondary);
          border-color: var(--vf-accent-primary);
        }

        .integration-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--vf-space-3);
        }

        .integration-info h4 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-base);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-1) 0;
        }

        .integration-info p {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-secondary);
          margin: 0;
          line-height: 1.4;
        }

        .selected-icon {
          color: var(--vf-accent-primary);
        }

        .integration-meta {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-1);
          margin-bottom: var(--vf-space-3);
        }

        .meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .meta-label {
          font-size: var(--vf-text-xs);
          color: var(--vf-text-muted);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
        }

        .popularity-badge {
          padding: var(--vf-space-1) var(--vf-space-2);
          font-size: var(--vf-text-xs);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
        }

        .popularity-badge.high {
          background: var(--vf-accent-success);
          color: var(--vf-bg-primary);
        }

        .popularity-badge.medium {
          background: var(--vf-accent-primary);
          color: var(--vf-bg-primary);
        }

        .popularity-badge.low {
          background: var(--vf-text-muted);
          color: var(--vf-bg-primary);
        }

        .meta-value {
          font-size: var(--vf-text-xs);
          color: var(--vf-text-secondary);
          font-family: var(--vf-font-mono);
        }

        .integration-features h5 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-xs);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-2) 0;
          text-transform: uppercase;
        }

        .features-list {
          display: flex;
          flex-wrap: wrap;
          gap: var(--vf-space-1);
        }

        .feature-tag {
          background: var(--vf-bg-primary);
          border: 1px solid var(--vf-surface-border);
          color: var(--vf-text-muted);
          padding: var(--vf-space-1) var(--vf-space-2);
          font-size: var(--vf-text-xs);
          font-weight: var(--vf-weight-medium);
        }

        .integration-config {
          border-top: 1px solid var(--vf-surface-border);
          background: var(--vf-bg-primary);
        }

        .config-header {
          display: flex;
          align-items: center;
          gap: var(--vf-space-2);
          padding: var(--vf-space-3) var(--vf-space-4);
          border-bottom: 1px solid var(--vf-surface-border);
        }

        .config-header span {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-sm);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          text-transform: uppercase;
          flex: 1;
        }

        .config-toggle {
          background: transparent;
          border: 1px solid var(--vf-accent-primary);
          color: var(--vf-accent-primary);
          padding: var(--vf-space-1) var(--vf-space-2);
          font-size: var(--vf-text-xs);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
          cursor: pointer;
          transition: all var(--vf-transition-fast);
        }

        .config-toggle:hover {
          background: var(--vf-accent-primary);
          color: var(--vf-bg-primary);
        }

        .config-form {
          padding: var(--vf-space-4);
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-3);
        }

        .config-field {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-1);
        }

        .config-field label {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-xs);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-secondary);
          text-transform: uppercase;
        }

        .config-input {
          background: var(--vf-bg-tertiary);
          border: 1px solid var(--vf-surface-border);
          color: var(--vf-text-primary);
          padding: var(--vf-space-2) var(--vf-space-3);
          font-family: var(--vf-font-mono);
          font-size: var(--vf-text-sm);
          transition: border-color var(--vf-transition-fast);
        }

        .config-input:focus {
          outline: none;
          border-color: var(--vf-accent-primary);
        }

        .config-note {
          background: var(--vf-bg-secondary);
          border: 1px solid var(--vf-surface-border);
          padding: var(--vf-space-3);
          margin-top: var(--vf-space-2);
        }

        .config-note p {
          font-size: var(--vf-text-xs);
          color: var(--vf-text-muted);
          margin: 0;
          line-height: 1.4;
        }

        .selected-summary {
          background: var(--vf-bg-secondary);
          border: 2px solid var(--vf-accent-primary);
          padding: var(--vf-space-4);
        }

        .selected-summary h3 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-lg);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-4) 0;
          text-transform: uppercase;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--vf-space-3);
        }

        .summary-card {
          background: var(--vf-bg-tertiary);
          border: 1px solid var(--vf-surface-border);
          padding: var(--vf-space-3);
        }

        .summary-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--vf-space-2);
        }

        .summary-header h4 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-sm);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0;
        }

        .config-status {
          padding: var(--vf-space-1) var(--vf-space-2);
          font-size: var(--vf-text-xs);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
        }

        .config-status.configured {
          background: var(--vf-accent-success);
          color: var(--vf-bg-primary);
        }

        .config-status.pending {
          background: var(--vf-accent-danger);
          color: var(--vf-text-primary);
        }

        .summary-card p {
          font-size: var(--vf-text-xs);
          color: var(--vf-text-secondary);
          margin: 0 0 var(--vf-space-2) 0;
          line-height: 1.4;
        }

        .configure-btn {
          background: transparent;
          border: 1px solid var(--vf-accent-primary);
          color: var(--vf-accent-primary);
          padding: var(--vf-space-1) var(--vf-space-2);
          font-size: var(--vf-text-xs);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
          cursor: pointer;
          transition: all var(--vf-transition-fast);
          width: 100%;
        }

        .configure-btn:hover {
          background: var(--vf-accent-primary);
          color: var(--vf-bg-primary);
        }

        .empty-state {
          text-align: center;
          padding: var(--vf-space-12) var(--vf-space-4);
          color: var(--vf-text-muted);
        }

        .empty-state h3 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-lg);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-secondary);
          margin: var(--vf-space-4) 0 var(--vf-space-2) 0;
          text-transform: uppercase;
        }

        .empty-state p {
          font-size: var(--vf-text-base);
          line-height: 1.5;
          max-width: 500px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .integrations-list {
            grid-template-columns: 1fr;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .meta-row {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--vf-space-1);
          }

          .config-header {
            flex-direction: column;
            align-items: stretch;
            gap: var(--vf-space-2);
          }
        }
      `}</style>
    </div>
  );
};

export default IntegrationsStep;