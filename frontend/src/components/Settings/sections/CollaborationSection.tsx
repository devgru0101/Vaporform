import React from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { updateCollaboration } from '@/store/settings';

export const CollaborationSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { collaboration } = useAppSelector(state => state.settings);

  const handleChange = (field: keyof typeof collaboration, value: any) => {
    dispatch(updateCollaboration({ [field]: value }));
  };

  return (
    <div className="vf-settings-section">
      <div className="vf-settings-section-header">
        <h2 className="vf-settings-section-title">Collaboration</h2>
        <p className="vf-settings-section-description">
          Configure real-time collaboration features and team settings
        </p>
      </div>

      <div className="vf-settings-section-content">
        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Real-time Features</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Real-time Collaboration</label>
                <span className="vf-settings-field-description">Enable live collaborative editing</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={collaboration.realTimeCollaboration}
                  onChange={(e) => handleChange('realTimeCollaboration', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Presence Indicators</label>
                <span className="vf-settings-field-description">Show who's online and active</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={collaboration.showPresenceIndicators}
                  onChange={(e) => handleChange('showPresenceIndicators', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Show Cursors</label>
                <span className="vf-settings-field-description">Display other users' cursors in real-time</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={collaboration.showCursors}
                  onChange={(e) => handleChange('showCursors', e.target.checked)}
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
                <label className="vf-settings-field-label">Notify on Join</label>
                <span className="vf-settings-field-description">Alert when users join the session</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={collaboration.notifyOnJoin}
                  onChange={(e) => handleChange('notifyOnJoin', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Notify on Leave</label>
                <span className="vf-settings-field-description">Alert when users leave the session</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={collaboration.notifyOnLeave}
                  onChange={(e) => handleChange('notifyOnLeave', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Notify on Edit</label>
                <span className="vf-settings-field-description">Alert when files are modified by others</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={collaboration.notifyOnEdit}
                  onChange={(e) => handleChange('notifyOnEdit', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Permissions</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Default Share Permissions</label>
                <span className="vf-settings-field-description">Default permission level for new collaborators</span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={collaboration.sharePermissions}
                  onChange={(e) => handleChange('sharePermissions', e.target.value)}
                  className="vf-settings-select"
                >
                  <option value="read">Read Only</option>
                  <option value="write">Read & Write</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Allow Guests</label>
                <span className="vf-settings-field-description">Allow unauthenticated users to join</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={collaboration.allowGuests}
                  onChange={(e) => handleChange('allowGuests', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Require Authentication</label>
                <span className="vf-settings-field-description">Require login for all collaborators</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={collaboration.requireAuthentication}
                  onChange={(e) => handleChange('requireAuthentication', e.target.checked)}
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