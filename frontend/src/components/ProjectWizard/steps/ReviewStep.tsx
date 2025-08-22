import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { 
  CheckIcon, 
  RocketIcon, 
  ClockIcon,
  CodeIcon,
  ServerIcon,
  DatabaseIcon,
  CloudIcon,
  LinkIcon,
  SparklesIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '../../ui/Icons';

interface ReviewStepProps {
  onGenerate: () => void;
  className?: string;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ onGenerate, className }) => {
  const { projectData, isGenerating } = useSelector((state: RootState) => state.projectWizard);

  const selectedTemplate = projectData.selectedTemplate || 'encore-react';
  const hasIntegrations = projectData.selectedIntegrations?.length > 0;

  const getTemplateInfo = () => {
    const templates = {
      'encore-react': {
        name: 'Encore.ts + React',
        stack: {
          backend: 'Encore.ts',
          frontend: 'React + TypeScript',
          database: 'PostgreSQL',
          hosting: 'Encore Cloud'
        },
        estimatedTime: '15 minutes'
      },
      'encore-solid': {
        name: 'Encore.ts + Solid.js',
        stack: {
          backend: 'Encore.ts',
          frontend: 'Solid.js + TypeScript',
          database: 'PostgreSQL',
          hosting: 'Encore Cloud'
        },
        estimatedTime: '20 minutes'
      },
      'encore-vue': {
        name: 'Encore.go + Vue 3',
        stack: {
          backend: 'Encore.go',
          frontend: 'Vue 3 + TypeScript',
          database: 'PostgreSQL',
          hosting: 'Encore Cloud'
        },
        estimatedTime: '25 minutes'
      },
      'custom': {
        name: 'Custom Configuration',
        stack: projectData.customTechStack || {
          backend: 'Not specified',
          frontend: 'Not specified',
          database: 'Not specified',
          hosting: 'Not specified'
        },
        estimatedTime: 'Variable'
      }
    };

    return templates[selectedTemplate] || templates['encore-react'];
  };

  const templateInfo = getTemplateInfo();

  return (
    <div className={`review-step ${className || ''}`}>
      <div className="review-header">
        <h2>Review & Generate Project</h2>
        <p>Review your project configuration and generate your application</p>
      </div>

      <div className="review-content">
        {/* Project Overview */}
        <div className="review-section">
          <div className="section-header">
            <DocumentTextIcon size={20} />
            <h3>Project Overview</h3>
          </div>
          
          <div className="overview-grid">
            <div className="overview-card">
              <h4>Project Name</h4>
              <p>{projectData.projectName || 'Unnamed Project'}</p>
            </div>
            
            <div className="overview-card">
              <h4>Description</h4>
              <p>{projectData.description || 'No description provided'}</p>
            </div>
            
            {projectData.targetAudience && (
              <div className="overview-card">
                <h4>Target Audience</h4>
                <p>{projectData.targetAudience}</p>
              </div>
            )}
            
            <div className="overview-card">
              <h4>Core Features</h4>
              <div className="features-text">
                {projectData.coreFeatures ? (
                  <pre>{projectData.coreFeatures}</pre>
                ) : (
                  <p>No features specified</p>
                )}
              </div>
            </div>
          </div>

          {projectData.projectGoals && projectData.projectGoals.length > 0 && (
            <div className="goals-section">
              <h4>Project Goals</h4>
              <div className="goals-list">
                {projectData.projectGoals.map((goal, index) => (
                  <div key={index} className="goal-item">
                    <CheckIcon size={14} />
                    <span>{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {projectData.inspirationApps && projectData.inspirationApps.length > 0 && (
            <div className="inspiration-section">
              <h4>Inspiration Apps</h4>
              <div className="inspiration-tags">
                {projectData.inspirationApps.map((app, index) => (
                  <div key={index} className="inspiration-tag">
                    <SparklesIcon size={12} />
                    <span>{app}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tech Stack */}
        <div className="review-section">
          <div className="section-header">
            <CodeIcon size={20} />
            <h3>Technology Stack</h3>
          </div>
          
          <div className="tech-stack-review">
            <div className="template-info">
              <h4>{templateInfo.name}</h4>
              <div className="stack-grid">
                <div className="stack-item">
                  <ServerIcon size={16} />
                  <div className="stack-details">
                    <span className="stack-label">Backend</span>
                    <span className="stack-value">{templateInfo.stack.backend}</span>
                  </div>
                </div>
                
                <div className="stack-item">
                  <CodeIcon size={16} />
                  <div className="stack-details">
                    <span className="stack-label">Frontend</span>
                    <span className="stack-value">{templateInfo.stack.frontend}</span>
                  </div>
                </div>
                
                <div className="stack-item">
                  <DatabaseIcon size={16} />
                  <div className="stack-details">
                    <span className="stack-label">Database</span>
                    <span className="stack-value">{templateInfo.stack.database}</span>
                  </div>
                </div>
                
                <div className="stack-item">
                  <CloudIcon size={16} />
                  <div className="stack-details">
                    <span className="stack-label">Hosting</span>
                    <span className="stack-value">{templateInfo.stack.hosting}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="setup-time">
              <ClockIcon size={16} />
              <span>Estimated setup time: {templateInfo.estimatedTime}</span>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="review-section">
          <div className="section-header">
            <LinkIcon size={20} />
            <h3>Integrations</h3>
          </div>
          
          {hasIntegrations ? (
            <div className="integrations-review">
              <div className="integrations-count">
                <span>{projectData.selectedIntegrations.length} integration{projectData.selectedIntegrations.length !== 1 ? 's' : ''} selected</span>
              </div>
              
              <div className="integrations-list">
                {projectData.selectedIntegrations.map((integrationId, index) => {
                  const isConfigured = projectData.integrationConfigs?.[integrationId] && 
                    Object.values(projectData.integrationConfigs[integrationId]).some(value => value);
                  
                  return (
                    <div key={index} className="integration-item">
                      <div className="integration-name">
                        {integrationId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className={`integration-status ${isConfigured ? 'configured' : 'pending'}`}>
                        {isConfigured ? (
                          <>
                            <CheckIcon size={12} />
                            Configured
                          </>
                        ) : (
                          'Not Configured'
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="integration-note">
                <p>
                  Integrations that are not configured will be set up with placeholder values. 
                  You can complete the configuration after your project is generated.
                </p>
              </div>
            </div>
          ) : (
            <div className="no-integrations">
              <p>No integrations selected. You can add them later to your project.</p>
            </div>
          )}
        </div>

        {/* Generation Summary */}
        <div className="review-section generation-summary">
          <div className="section-header">
            <RocketIcon size={20} />
            <h3>What Will Be Generated</h3>
          </div>
          
          <div className="generation-content">
            <div className="generation-grid">
              <div className="generation-item">
                <CheckIcon size={16} />
                <div className="generation-details">
                  <h4>Project Structure</h4>
                  <p>Complete folder structure with best practices</p>
                </div>
              </div>
              
              <div className="generation-item">
                <CheckIcon size={16} />
                <div className="generation-details">
                  <h4>Backend Setup</h4>
                  <p>API endpoints, database schemas, and configuration</p>
                </div>
              </div>
              
              <div className="generation-item">
                <CheckIcon size={16} />
                <div className="generation-details">
                  <h4>Frontend Application</h4>
                  <p>UI components, routing, and state management</p>
                </div>
              </div>
              
              <div className="generation-item">
                <CheckIcon size={16} />
                <div className="generation-details">
                  <h4>Development Environment</h4>
                  <p>Docker setup, scripts, and development tools</p>
                </div>
              </div>
              
              <div className="generation-item">
                <CheckIcon size={16} />
                <div className="generation-details">
                  <h4>Documentation</h4>
                  <p>README, API documentation, and setup guides</p>
                </div>
              </div>
              
              <div className="generation-item">
                <CheckIcon size={16} />
                <div className="generation-details">
                  <h4>Deployment Configuration</h4>
                  <p>Production-ready deployment setup</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="generate-section">
          <button
            className="generate-button"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="loading-spinner" />
                Generating Project...
              </>
            ) : (
              <>
                <RocketIcon size={20} />
                Generate My Project
              </>
            )}
          </button>
          
          <div className="generate-note">
            <p>
              This will create a complete, production-ready project based on your specifications. 
              The generation process typically takes 1-2 minutes.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .review-step {
          max-width: 1000px;
          margin: 0 auto;
        }

        .review-header {
          text-align: center;
          margin-bottom: var(--vf-space-8);
        }

        .review-header h2 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-2xl);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-2) 0;
          text-transform: uppercase;
        }

        .review-header p {
          font-size: var(--vf-text-base);
          color: var(--vf-text-muted);
          margin: 0;
        }

        .review-content {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-6);
        }

        .review-section {
          background: var(--vf-bg-secondary);
          border: 2px solid var(--vf-surface-border);
          padding: var(--vf-space-4);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: var(--vf-space-2);
          margin-bottom: var(--vf-space-4);
          padding-bottom: var(--vf-space-3);
          border-bottom: 1px solid var(--vf-surface-border);
        }

        .section-header h3 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-lg);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0;
          text-transform: uppercase;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--vf-space-4);
          margin-bottom: var(--vf-space-4);
        }

        .overview-card {
          background: var(--vf-bg-tertiary);
          border: 1px solid var(--vf-surface-border);
          padding: var(--vf-space-3);
        }

        .overview-card h4 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-sm);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-accent-primary);
          margin: 0 0 var(--vf-space-2) 0;
          text-transform: uppercase;
        }

        .overview-card p {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-secondary);
          margin: 0;
          line-height: 1.4;
        }

        .features-text pre {
          font-family: var(--vf-font-body);
          font-size: var(--vf-text-sm);
          color: var(--vf-text-secondary);
          white-space: pre-wrap;
          margin: 0;
          line-height: 1.4;
        }

        .goals-section,
        .inspiration-section {
          margin-top: var(--vf-space-4);
        }

        .goals-section h4,
        .inspiration-section h4 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-sm);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-accent-primary);
          margin: 0 0 var(--vf-space-3) 0;
          text-transform: uppercase;
        }

        .goals-list {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-2);
        }

        .goal-item {
          display: flex;
          align-items: center;
          gap: var(--vf-space-2);
          font-size: var(--vf-text-sm);
          color: var(--vf-text-secondary);
        }

        .inspiration-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--vf-space-2);
        }

        .inspiration-tag {
          background: var(--vf-accent-primary);
          color: var(--vf-bg-primary);
          padding: var(--vf-space-1) var(--vf-space-2);
          font-size: var(--vf-text-xs);
          font-weight: var(--vf-weight-bold);
          display: flex;
          align-items: center;
          gap: var(--vf-space-1);
        }

        .tech-stack-review {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-4);
        }

        .template-info h4 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-base);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-3) 0;
        }

        .stack-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--vf-space-3);
          margin-bottom: var(--vf-space-3);
        }

        .stack-item {
          background: var(--vf-bg-tertiary);
          border: 1px solid var(--vf-surface-border);
          padding: var(--vf-space-3);
          display: flex;
          align-items: center;
          gap: var(--vf-space-2);
        }

        .stack-details {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-1);
        }

        .stack-label {
          font-size: var(--vf-text-xs);
          color: var(--vf-text-muted);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
        }

        .stack-value {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-secondary);
          font-family: var(--vf-font-mono);
        }

        .setup-time {
          display: flex;
          align-items: center;
          gap: var(--vf-space-2);
          font-size: var(--vf-text-sm);
          color: var(--vf-text-secondary);
          background: var(--vf-bg-tertiary);
          border: 1px solid var(--vf-surface-border);
          padding: var(--vf-space-3);
        }

        .integrations-review {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-3);
        }

        .integrations-count {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-sm);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-accent-primary);
          text-transform: uppercase;
        }

        .integrations-list {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-2);
        }

        .integration-item {
          background: var(--vf-bg-tertiary);
          border: 1px solid var(--vf-surface-border);
          padding: var(--vf-space-3);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .integration-name {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-secondary);
          font-weight: var(--vf-weight-medium);
        }

        .integration-status {
          display: flex;
          align-items: center;
          gap: var(--vf-space-1);
          padding: var(--vf-space-1) var(--vf-space-2);
          font-size: var(--vf-text-xs);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
        }

        .integration-status.configured {
          background: var(--vf-accent-success);
          color: var(--vf-bg-primary);
        }

        .integration-status.pending {
          background: var(--vf-accent-danger);
          color: var(--vf-text-primary);
        }

        .integration-note,
        .no-integrations {
          background: var(--vf-bg-tertiary);
          border: 1px solid var(--vf-surface-border);
          padding: var(--vf-space-3);
        }

        .integration-note p,
        .no-integrations p {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-muted);
          margin: 0;
          line-height: 1.4;
        }

        .generation-summary {
          border-color: var(--vf-accent-primary);
        }

        .generation-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--vf-space-4);
        }

        .generation-item {
          display: flex;
          align-items: flex-start;
          gap: var(--vf-space-2);
          padding: var(--vf-space-3);
          background: var(--vf-bg-tertiary);
          border: 1px solid var(--vf-surface-border);
        }

        .generation-details h4 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-sm);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-1) 0;
        }

        .generation-details p {
          font-size: var(--vf-text-xs);
          color: var(--vf-text-muted);
          margin: 0;
          line-height: 1.4;
        }

        .generate-section {
          text-align: center;
          padding: var(--vf-space-6);
        }

        .generate-button {
          background: var(--vf-accent-success);
          color: var(--vf-bg-primary);
          border: 3px solid var(--vf-accent-success);
          padding: var(--vf-space-4) var(--vf-space-8);
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-base);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all var(--vf-transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--vf-space-2);
          margin: 0 auto var(--vf-space-4) auto;
          min-width: 250px;
        }

        .generate-button:hover:not(:disabled) {
          background: var(--vf-bg-primary);
          color: var(--vf-accent-success);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(225, 255, 0, 0.3);
        }

        .generate-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .generate-note {
          max-width: 500px;
          margin: 0 auto;
        }

        .generate-note p {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-muted);
          line-height: 1.5;
          margin: 0;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .overview-grid {
            grid-template-columns: 1fr;
          }

          .stack-grid {
            grid-template-columns: 1fr;
          }

          .generation-grid {
            grid-template-columns: 1fr;
          }

          .generate-button {
            width: 100%;
          }

          .inspiration-tags {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default ReviewStep;