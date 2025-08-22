import React from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { updateIntegrations } from '@/store/settings';

export const IntegrationsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { integrations } = useAppSelector(state => state.settings);

  const handleChange = (field: keyof typeof integrations, value: any) => {
    dispatch(updateIntegrations({ [field]: value }));
  };

  return (
    <div className="vf-settings-section">
      <div className="vf-settings-section-header">
        <h2 className="vf-settings-section-title">Integrations</h2>
        <p className="vf-settings-section-description">
          Connect with external services and APIs
        </p>
      </div>

      <div className="vf-settings-section-content">
        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Version Control</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">GitHub Integration</label>
                <span className="vf-settings-field-description">Connect to GitHub repositories</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={integrations.githubIntegration}
                  onChange={(e) => handleChange('githubIntegration', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            {integrations.githubIntegration && (
              <div className="vf-settings-field-row">
                <div className="vf-settings-field-info">
                  <label className="vf-settings-field-label">GitHub Token</label>
                  <span className="vf-settings-field-description">Personal access token for GitHub API</span>
                </div>
                <div className="vf-settings-field-control">
                  <input
                    type="password"
                    value={integrations.githubToken}
                    onChange={(e) => handleChange('githubToken', e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="vf-settings-input"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Container Platforms</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Docker Integration</label>
                <span className="vf-settings-field-description">Enable Docker container support</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={integrations.dockerIntegration}
                  onChange={(e) => handleChange('dockerIntegration', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Kubernetes Integration</label>
                <span className="vf-settings-field-description">Connect to Kubernetes clusters</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={integrations.kubernetesIntegration}
                  onChange={(e) => handleChange('kubernetesIntegration', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Notifications</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Slack Notifications</label>
                <span className="vf-settings-field-description">Send build notifications to Slack</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={integrations.slackNotifications}
                  onChange={(e) => handleChange('slackNotifications', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Email Notifications</label>
                <span className="vf-settings-field-description">Send email notifications</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={integrations.emailNotifications}
                  onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Webhook URL</label>
                <span className="vf-settings-field-description">Custom webhook for notifications</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="url"
                  value={integrations.webhookUrl}
                  onChange={(e) => handleChange('webhookUrl', e.target.value)}
                  placeholder="https://hooks.example.com/webhook"
                  className="vf-settings-input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};