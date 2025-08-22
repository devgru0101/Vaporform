import React from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { updateSecurity } from '@/store/settings';

export const SecuritySection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { security } = useAppSelector(state => state.settings);

  const handleChange = (field: keyof typeof security, value: any) => {
    dispatch(updateSecurity({ [field]: value }));
  };

  return (
    <div className="vf-settings-section">
      <div className="vf-settings-section-header">
        <h2 className="vf-settings-section-title">Security & Privacy</h2>
        <p className="vf-settings-section-description">
          Configure authentication, privacy, and security settings
        </p>
      </div>

      <div className="vf-settings-section-content">
        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Authentication</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Session Timeout</label>
                <span className="vf-settings-field-description">Auto logout after inactivity (minutes)</span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={security.sessionTimeout}
                  onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                  className="vf-settings-select"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={240}>4 hours</option>
                  <option value={480}>8 hours</option>
                  <option value={1440}>24 hours</option>
                </select>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Two-Factor Authentication</label>
                <span className="vf-settings-field-description">Require 2FA for login</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={security.twoFactorAuth}
                  onChange={(e) => handleChange('twoFactorAuth', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Remember Me</label>
                <span className="vf-settings-field-description">Keep me logged in</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={security.rememberMe}
                  onChange={(e) => handleChange('rememberMe', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Privacy</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Encrypt Local Data</label>
                <span className="vf-settings-field-description">Encrypt data stored locally</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={security.encryptLocalData}
                  onChange={(e) => handleChange('encryptLocalData', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Allow Telemetry</label>
                <span className="vf-settings-field-description">Share anonymous usage data</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={security.allowTelemetry}
                  onChange={(e) => handleChange('allowTelemetry', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Clear History on Logout</label>
                <span className="vf-settings-field-description">Remove history when logging out</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={security.clearHistoryOnLogout}
                  onChange={(e) => handleChange('clearHistoryOnLogout', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};