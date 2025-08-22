import React from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { updateTerminal } from '@/store/settings';

export const TerminalSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { terminal } = useAppSelector(state => state.settings);

  const handleChange = (field: keyof typeof terminal, value: any) => {
    dispatch(updateTerminal({ [field]: value }));
  };

  return (
    <div className="vf-settings-section">
      <div className="vf-settings-section-header">
        <h2 className="vf-settings-section-title">Terminal</h2>
        <p className="vf-settings-section-description">
          Configure terminal appearance and behavior
        </p>
      </div>

      <div className="vf-settings-section-content">
        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Appearance</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Font Family</label>
                <span className="vf-settings-field-description">Monospace font for terminal</span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={terminal.fontFamily}
                  onChange={(e) => handleChange('fontFamily', e.target.value)}
                  className="vf-settings-select"
                >
                  <option value="JetBrains Mono, monospace">JetBrains Mono</option>
                  <option value="Fira Code, monospace">Fira Code</option>
                  <option value="Monaco, monospace">Monaco</option>
                  <option value="Consolas, monospace">Consolas</option>
                </select>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Font Size</label>
                <span className="vf-settings-field-description">Terminal font size</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="range"
                  min="8"
                  max="20"
                  value={terminal.fontSize}
                  onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                  className="vf-settings-range"
                />
                <span style={{ marginLeft: 'var(--vf-space-2)' }}>{terminal.fontSize}px</span>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Cursor Style</label>
                <span className="vf-settings-field-description">Terminal cursor appearance</span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={terminal.cursorStyle}
                  onChange={(e) => handleChange('cursorStyle', e.target.value)}
                  className="vf-settings-select"
                >
                  <option value="block">Block</option>
                  <option value="line">Line</option>
                  <option value="underline">Underline</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Behavior</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Default Shell</label>
                <span className="vf-settings-field-description">Default shell to use</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="text"
                  value={terminal.defaultShell}
                  onChange={(e) => handleChange('defaultShell', e.target.value)}
                  className="vf-settings-input"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Cursor Blink</label>
                <span className="vf-settings-field-description">Enable cursor blinking</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={terminal.cursorBlink}
                  onChange={(e) => handleChange('cursorBlink', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Scrollback</label>
                <span className="vf-settings-field-description">Number of lines to keep in history</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="number"
                  value={terminal.scrollback}
                  onChange={(e) => handleChange('scrollback', parseInt(e.target.value))}
                  min="100"
                  max="10000"
                  className="vf-settings-input"
                  style={{ width: '120px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};