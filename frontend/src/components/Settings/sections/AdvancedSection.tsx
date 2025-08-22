import React from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { updateAdvanced, resetAllSettings } from '@/store/settings';
import { Button } from '@/components/ui/Button';

export const AdvancedSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { advanced } = useAppSelector(state => state.settings);

  const handleChange = (field: keyof typeof advanced, value: any) => {
    dispatch(updateAdvanced({ [field]: value }));
  };

  const handleResetSettings = () => {
    if (window.confirm('This will reset ALL settings to their default values. Are you sure?')) {
      dispatch(resetAllSettings());
    }
  };

  const handleExportSettings = () => {
    // Get settings from Redux store - we'll need to access the state differently
    const { userProfile, theme, editor, ai, collaboration, devEnvironment, terminal, security, performance, integrations, notifications } = useAppSelector(state => state.settings);
    
    const settingsToExport = {
      userProfile,
      theme,
      editor,
      ai,
      collaboration,
      devEnvironment,
      terminal,
      security,
      performance,
      integrations,
      notifications,
      advanced,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(settingsToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vaporform-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="vf-settings-section">
      <div className="vf-settings-section-header">
        <h2 className="vf-settings-section-title">Advanced</h2>
        <p className="vf-settings-section-description">
          Advanced settings, debugging tools, and experimental features
        </p>
      </div>

      <div className="vf-settings-section-content">
        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Debug</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Debug Mode</label>
                <span className="vf-settings-field-description">Enable debug logging and tools</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={advanced.debugMode}
                  onChange={(e) => handleChange('debugMode', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Verbose Logging</label>
                <span className="vf-settings-field-description">Detailed console logging</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={advanced.verboseLogging}
                  onChange={(e) => handleChange('verboseLogging', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Developer Mode</label>
                <span className="vf-settings-field-description">Enable developer tools and features</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={advanced.developerMode}
                  onChange={(e) => handleChange('developerMode', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Experimental</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Experimental Features</label>
                <span className="vf-settings-field-description">Enable experimental and beta features</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={advanced.experimentalFeatures}
                  onChange={(e) => handleChange('experimentalFeatures', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Beta Testing</label>
                <span className="vf-settings-field-description">Opt-in to beta testing program</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={advanced.betaTesting}
                  onChange={(e) => handleChange('betaTesting', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">API Configuration</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">API Rate Limit</label>
                <span className="vf-settings-field-description">Requests per minute limit</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="number"
                  value={advanced.apiRateLimit}
                  onChange={(e) => handleChange('apiRateLimit', parseInt(e.target.value))}
                  min="10"
                  max="1000"
                  className="vf-settings-input"
                  style={{ width: '120px' }}
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Max Concurrent Requests</label>
                <span className="vf-settings-field-description">Maximum simultaneous API requests</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="number"
                  value={advanced.maxConcurrentRequests}
                  onChange={(e) => handleChange('maxConcurrentRequests', parseInt(e.target.value))}
                  min="1"
                  max="50"
                  className="vf-settings-input"
                  style={{ width: '120px' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Customization</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field">
              <label className="vf-settings-field-label">Custom CSS</label>
              <span className="vf-settings-field-description">Additional CSS rules to apply</span>
              <textarea
                value={advanced.customCSS}
                onChange={(e) => handleChange('customCSS', e.target.value)}
                placeholder="/* Add your custom CSS here */"
                rows={6}
                style={{
                  width: '100%',
                  marginTop: 'var(--vf-space-2)',
                  padding: 'var(--vf-space-3)',
                  background: 'var(--vf-bg-primary)',
                  border: '1px solid var(--vf-surface-border)',
                  color: 'var(--vf-text-primary)',
                  fontFamily: 'var(--vf-font-mono)',
                  fontSize: 'var(--vf-text-sm)',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Settings Management</h3>
          <div className="vf-settings-group-content">
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--vf-space-3)',
              padding: 'var(--vf-space-4)',
              background: 'var(--vf-bg-secondary)',
              border: '1px solid var(--vf-surface-border)'
            }}>
              <Button
                variant="secondary"
                onClick={handleExportSettings}
              >
                Export Settings
              </Button>
              
              <Button
                variant="danger"
                onClick={handleResetSettings}
              >
                Reset All Settings
              </Button>
            </div>
            
            <div style={{
              marginTop: 'var(--vf-space-3)',
              padding: 'var(--vf-space-3)',
              background: 'rgba(255, 66, 0, 0.1)',
              border: '1px solid var(--vf-accent-danger)',
              fontSize: 'var(--vf-text-xs)',
              color: 'var(--vf-text-muted)'
            }}>
              <strong>Warning:</strong> Resetting will permanently delete all your custom settings and preferences. 
              This action cannot be undone. Export your settings first if you want to keep a backup.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};