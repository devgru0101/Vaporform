import React from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { updateNotifications } from '@/store/settings';

export const NotificationsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector(state => state.settings);

  const handleChange = (field: keyof typeof notifications, value: any) => {
    dispatch(updateNotifications({ [field]: value }));
  };

  return (
    <div className="vf-settings-section">
      <div className="vf-settings-section-header">
        <h2 className="vf-settings-section-title">Notifications</h2>
        <p className="vf-settings-section-description">
          Configure notification preferences and alert settings
        </p>
      </div>

      <div className="vf-settings-section-content">
        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">General</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Enable Notifications</label>
                <span className="vf-settings-field-description">Master toggle for all notifications</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={notifications.enableNotifications}
                  onChange={(e) => handleChange('enableNotifications', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Sound Enabled</label>
                <span className="vf-settings-field-description">Play sound for notifications</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={notifications.soundEnabled}
                  onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Notification Duration</label>
                <span className="vf-settings-field-description">How long notifications stay visible (seconds)</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={notifications.notificationDuration}
                  onChange={(e) => handleChange('notificationDuration', parseInt(e.target.value))}
                  className="vf-settings-range"
                />
                <span style={{ marginLeft: 'var(--vf-space-2)' }}>{notifications.notificationDuration}s</span>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Position</label>
                <span className="vf-settings-field-description">Where notifications appear on screen</span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={notifications.notificationPosition}
                  onChange={(e) => handleChange('notificationPosition', e.target.value)}
                  className="vf-settings-select"
                >
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Types</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Build Notifications</label>
                <span className="vf-settings-field-description">Notify on build completion</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={notifications.buildNotifications}
                  onChange={(e) => handleChange('buildNotifications', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Error Notifications</label>
                <span className="vf-settings-field-description">Notify on errors and failures</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={notifications.errorNotifications}
                  onChange={(e) => handleChange('errorNotifications', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Collaboration Notifications</label>
                <span className="vf-settings-field-description">Notify on collaboration events</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={notifications.collaborationNotifications}
                  onChange={(e) => handleChange('collaborationNotifications', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">System Notifications</label>
                <span className="vf-settings-field-description">Notify on system updates</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={notifications.systemNotifications}
                  onChange={(e) => handleChange('systemNotifications', e.target.checked)}
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