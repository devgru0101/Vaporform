import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { updateDevEnvironment } from '@/store/settings';
import { ExternalLinkIcon, ExpandIcon } from '@/components/ui/Icons';

export const DevEnvironmentSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { devEnvironment } = useAppSelector(state => state.settings);
  const [showEncoreDashboard, setShowEncoreDashboard] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState('');

  const handleChange = (field: keyof typeof devEnvironment, value: any) => {
    dispatch(updateDevEnvironment({ [field]: value }));
  };

  // Determine the correct dashboard URL based on the current window location
  React.useEffect(() => {
    const currentHost = window.location.hostname;
    // Use proxied URL for network access, localhost for local access
    const url = currentHost === 'localhost' || currentHost === '127.0.0.1' 
      ? 'http://localhost:9400/uvfk4'
      : 'http://192.168.1.235:9401/uvfk4';
    setDashboardUrl(url);
  }, []);

  const openEncoreDashboard = () => {
    window.open(dashboardUrl, '_blank');
  };

  const toggleEncoreDashboard = () => {
    setShowEncoreDashboard(!showEncoreDashboard);
  };

  return (
    <div className="vf-settings-section">
      <div className="vf-settings-section-header">
        <h2 className="vf-settings-section-title">Development Environment</h2>
        <p className="vf-settings-section-description">
          Configure build settings, automation, and development tools
        </p>
      </div>

      <div className="vf-settings-section-content">
        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Build Settings</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Auto Build</label>
                <span className="vf-settings-field-description">Automatically build project on changes</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={devEnvironment.autoBuild}
                  onChange={(e) => handleChange('autoBuild', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Build on Save</label>
                <span className="vf-settings-field-description">Trigger build when saving files</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={devEnvironment.buildOnSave}
                  onChange={(e) => handleChange('buildOnSave', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Parallel Builds</label>
                <span className="vf-settings-field-description">Enable parallel build processes</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={devEnvironment.parallelBuilds}
                  onChange={(e) => handleChange('parallelBuilds', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Build Timeout</label>
                <span className="vf-settings-field-description">Maximum build time in seconds</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="number"
                  value={devEnvironment.buildTimeout}
                  onChange={(e) => handleChange('buildTimeout', parseInt(e.target.value))}
                  min="60"
                  max="3600"
                  className="vf-settings-input"
                  style={{ width: '120px' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Live Reload</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Hot Reload</label>
                <span className="vf-settings-field-description">Update code without full page refresh</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={devEnvironment.hotReload}
                  onChange={(e) => handleChange('hotReload', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Live Reload</label>
                <span className="vf-settings-field-description">Refresh browser on file changes</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={devEnvironment.liveReload}
                  onChange={(e) => handleChange('liveReload', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Watch Mode</label>
                <span className="vf-settings-field-description">Monitor files for changes</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={devEnvironment.watchMode}
                  onChange={(e) => handleChange('watchMode', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Output Settings</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Source Maps</label>
                <span className="vf-settings-field-description">Generate source maps for debugging</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={devEnvironment.sourceMaps}
                  onChange={(e) => handleChange('sourceMaps', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Minify Output</label>
                <span className="vf-settings-field-description">Compress output files</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={devEnvironment.minifyOutput}
                  onChange={(e) => handleChange('minifyOutput', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Encore Dashboard</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Backend Dashboard</label>
                <span className="vf-settings-field-description">Access Encore.ts development dashboard for API monitoring and database management</span>
              </div>
              <div className="vf-settings-field-control">
                <div className="vf-settings-button-group">
                  <button
                    type="button"
                    onClick={openEncoreDashboard}
                    className="vf-settings-action-btn"
                    title="Open in new tab"
                  >
                    <ExternalLinkIcon size={16} />
                    Open Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={toggleEncoreDashboard}
                    className="vf-settings-action-btn secondary"
                    title="Toggle embedded view"
                  >
                    <ExpandIcon size={16} />
                    {showEncoreDashboard ? 'Hide' : 'Show'} Embedded
                  </button>
                </div>
              </div>
            </div>

            {showEncoreDashboard && (
              <div className="vf-settings-field-row">
                <div className="vf-settings-iframe-container">
                  <div className="vf-settings-iframe-notice">
                    <h4>Encore Development Dashboard</h4>
                    <p>
                      <strong>Vaporform Backend</strong> - Local development dashboard (App ID: uvfk4)
                    </p>
                    <p>
                      {window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? (
                        <>✅ Network access enabled via proxy: <code>192.168.1.235:9401/uvfk4</code></>
                      ) : (
                        <>✅ Local access: <code>localhost:9400/uvfk4</code></>
                      )}
                    </p>
                    <div className="vf-settings-dashboard-options">
                      <button
                        type="button"
                        onClick={() => window.open(dashboardUrl, '_blank')}
                        className="vf-settings-action-btn"
                      >
                        <ExternalLinkIcon size={16} />
                        Open Dashboard
                      </button>
                      {window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
                        <a 
                          href="http://localhost:9400/uvfk4" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="vf-settings-action-btn secondary"
                        >
                          <ExternalLinkIcon size={16} />
                          Direct Local Access
                        </a>
                      )}
                    </div>
                    <div className="vf-settings-dashboard-features">
                      <strong>Available Features:</strong>
                      <ul>
                        <li>API Explorer - Test project creation endpoints</li>
                        <li>Database Viewer - PostgreSQL tables and data</li>
                        <li>Service Monitoring - Microservice health</li>
                        <li>Request Tracing - Real-time API debugging</li>
                        <li>Live Logs - Backend service logs</li>
                      </ul>
                    </div>

                    {/* Iframe option for network access via proxy */}
                    {window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
                      <div className="vf-settings-iframe-wrapper">
                        <h5>Embedded Dashboard (via Proxy)</h5>
                        <iframe
                          src={dashboardUrl}
                          className="vf-settings-dashboard-iframe"
                          title="Encore Development Dashboard"
                          style={{
                            width: '100%',
                            height: '600px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            backgroundColor: '#fff'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <span className="vf-settings-field-description">
                  <strong>Dashboard Features:</strong> API explorer, database viewer, service monitoring, request tracing, and real-time logs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};