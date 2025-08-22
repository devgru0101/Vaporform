import React from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { updateUserProfile } from '@/store/settings';

export const UserProfileSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { userProfile } = useAppSelector(state => state.settings);
  const { user } = useAppSelector(state => state.auth);

  const handleInputChange = (field: keyof typeof userProfile, value: string) => {
    dispatch(updateUserProfile({ [field]: value }));
  };

  return (
    <div className="vf-settings-section">
      <div className="vf-settings-section-header">
        <h2 className="vf-settings-section-title">User Profile</h2>
        <p className="vf-settings-section-description">
          Manage your personal information and account preferences
        </p>
      </div>

      <div className="vf-settings-section-content">
        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Basic Information</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Display Name</label>
                <span className="vf-settings-field-description">
                  The name that appears in your profile and to other users
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="text"
                  value={userProfile.displayName || user?.name || ''}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="Enter your display name"
                  className="vf-settings-input"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Email Address</label>
                <span className="vf-settings-field-description">
                  Your primary email address for notifications and account recovery
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="email"
                  value={userProfile.email || user?.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  className="vf-settings-input"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Avatar URL</label>
                <span className="vf-settings-field-description">
                  URL to your profile picture (leave empty to use default)
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="url"
                  value={userProfile.avatar}
                  onChange={(e) => handleInputChange('avatar', e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="vf-settings-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Preferences</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Timezone</label>
                <span className="vf-settings-field-description">
                  Your local timezone for accurate timestamps and scheduling
                </span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={userProfile.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="vf-settings-select"
                >
                  <optgroup label="Popular Timezones">
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/Denver">Mountain Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Paris">Central European Time</option>
                    <option value="Europe/Berlin">Berlin</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Asia/Shanghai">Shanghai</option>
                    <option value="Asia/Kolkata">India Standard Time</option>
                    <option value="Australia/Sydney">Sydney</option>
                  </optgroup>
                  <optgroup label="Americas">
                    <option value="America/Toronto">Toronto</option>
                    <option value="America/Vancouver">Vancouver</option>
                    <option value="America/Mexico_City">Mexico City</option>
                    <option value="America/Sao_Paulo">São Paulo</option>
                    <option value="America/Buenos_Aires">Buenos Aires</option>
                  </optgroup>
                  <optgroup label="Europe">
                    <option value="Europe/Dublin">Dublin</option>
                    <option value="Europe/Amsterdam">Amsterdam</option>
                    <option value="Europe/Stockholm">Stockholm</option>
                    <option value="Europe/Moscow">Moscow</option>
                  </optgroup>
                  <optgroup label="Asia Pacific">
                    <option value="Asia/Hong_Kong">Hong Kong</option>
                    <option value="Asia/Singapore">Singapore</option>
                    <option value="Asia/Seoul">Seoul</option>
                    <option value="Australia/Melbourne">Melbourne</option>
                    <option value="Pacific/Auckland">Auckland</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Language</label>
                <span className="vf-settings-field-description">
                  Interface language for the application
                </span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={userProfile.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="vf-settings-select"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Português</option>
                  <option value="ru">Русский</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {userProfile.avatar && (
          <div className="vf-settings-group">
            <h3 className="vf-settings-group-title">Avatar Preview</h3>
            <div className="vf-settings-group-content">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--vf-space-4)',
                padding: 'var(--vf-space-4)',
                border: '1px solid var(--vf-surface-border)',
                background: 'var(--vf-bg-secondary)'
              }}>
                <img
                  src={userProfile.avatar}
                  alt="Avatar preview"
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    border: '2px solid var(--vf-surface-border)',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div>
                  <div style={{ 
                    color: 'var(--vf-text-primary)', 
                    fontWeight: 'var(--vf-weight-semibold)',
                    marginBottom: 'var(--vf-space-1)'
                  }}>
                    {userProfile.displayName || user?.name || 'User'}
                  </div>
                  <div style={{ 
                    color: 'var(--vf-text-muted)', 
                    fontSize: 'var(--vf-text-sm)'
                  }}>
                    {userProfile.email || user?.email || 'user@example.com'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};