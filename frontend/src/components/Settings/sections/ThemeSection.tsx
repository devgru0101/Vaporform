import React from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { updateTheme } from '@/store/settings';
import { setTheme, setFontSize, setFontFamily, setPrimaryColor } from '@/store/ui';

export const ThemeSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector(state => state.settings);

  const handleThemeChange = (field: keyof typeof theme, value: any) => {
    dispatch(updateTheme({ [field]: value }));
    
    // Sync with UI state for immediate visual feedback
    if (field === 'theme') {
      dispatch(setTheme(value));
    } else if (field === 'fontSize') {
      dispatch(setFontSize(value));
    } else if (field === 'fontFamily') {
      dispatch(setFontFamily(value));
    } else if (field === 'primaryColor') {
      dispatch(setPrimaryColor(value));
    }
  };

  const predefinedColors = [
    { name: 'Brutalist Tan', value: '#CAC4B7' },
    { name: 'Bright Tan', value: '#F6EEE3' },
    { name: 'Electric Blue', value: '#2B00FF' },
    { name: 'Neon Green', value: '#E1FF00' },
    { name: 'Warning Orange', value: '#FF4200' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Pink', value: '#EC4899' },
  ];

  return (
    <div className="vf-settings-section">
      <div className="vf-settings-section-header">
        <h2 className="vf-settings-section-title">Appearance</h2>
        <p className="vf-settings-section-description">
          Customize the visual appearance and theme of your workspace
        </p>
      </div>

      <div className="vf-settings-section-content">
        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Theme</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Color Scheme</label>
                <span className="vf-settings-field-description">
                  Choose between dark, light, or auto (follows system preference)
                </span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={theme.theme}
                  onChange={(e) => handleThemeChange('theme', e.target.value)}
                  className="vf-settings-select"
                >
                  <option value="dark">Dark Theme</option>
                  <option value="light">Light Theme</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Primary Color</label>
                <span className="vf-settings-field-description">
                  Main accent color used throughout the interface
                </span>
              </div>
              <div className="vf-settings-field-control">
                <div style={{ display: 'flex', gap: 'var(--vf-space-2)', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                    style={{
                      width: '40px',
                      height: '32px',
                      border: '1px solid var(--vf-surface-border)',
                      background: 'transparent',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                    placeholder="#CAC4B7"
                    className="vf-settings-input"
                    style={{ width: '120px' }}
                  />
                </div>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Quick Colors</label>
                <span className="vf-settings-field-description">
                  Choose from predefined color palettes
                </span>
              </div>
              <div className="vf-settings-field-control">
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 'var(--vf-space-2)',
                  width: '200px'
                }}>
                  {predefinedColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleThemeChange('primaryColor', color.value)}
                      title={color.name}
                      style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: color.value,
                        border: theme.primaryColor === color.value 
                          ? '2px solid var(--vf-text-primary)' 
                          : '1px solid var(--vf-surface-border)',
                        cursor: 'pointer',
                        transition: 'all var(--vf-transition-fast)'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Accent Color</label>
                <span className="vf-settings-field-description">
                  Secondary accent color for highlights and active states
                </span>
              </div>
              <div className="vf-settings-field-control">
                <div style={{ display: 'flex', gap: 'var(--vf-space-2)', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                    style={{
                      width: '40px',
                      height: '32px',
                      border: '1px solid var(--vf-surface-border)',
                      background: 'transparent',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={theme.accentColor}
                    onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                    placeholder="#F6EEE3"
                    className="vf-settings-input"
                    style={{ width: '120px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Typography</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Font Family</label>
                <span className="vf-settings-field-description">
                  Primary font family for the user interface
                </span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={theme.fontFamily}
                  onChange={(e) => handleThemeChange('fontFamily', e.target.value)}
                  className="vf-settings-select"
                >
                  <option value="Inter, system-ui, sans-serif">Inter (Default)</option>
                  <option value="Space Grotesk, Inter, sans-serif">Space Grotesk</option>
                  <option value="JetBrains Mono, monospace">JetBrains Mono</option>
                  <option value="Fira Code, monospace">Fira Code</option>
                  <option value="Source Code Pro, monospace">Source Code Pro</option>
                  <option value="system-ui, sans-serif">System UI</option>
                  <option value="-apple-system, BlinkMacSystemFont, sans-serif">System (Apple)</option>
                  <option value="'Segoe UI', Tahoma, Geneva, sans-serif">Segoe UI</option>
                </select>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Font Size</label>
                <span className="vf-settings-field-description">
                  Base font size in pixels (affects all UI text)
                </span>
              </div>
              <div className="vf-settings-field-control">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--vf-space-3)' }}>
                  <input
                    type="range"
                    min="10"
                    max="20"
                    step="1"
                    value={theme.fontSize}
                    onChange={(e) => handleThemeChange('fontSize', parseInt(e.target.value))}
                    className="vf-settings-range"
                  />
                  <span style={{ 
                    color: 'var(--vf-text-primary)', 
                    fontFamily: 'var(--vf-font-mono)',
                    minWidth: '40px'
                  }}>
                    {theme.fontSize}px
                  </span>
                </div>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Line Height</label>
                <span className="vf-settings-field-description">
                  Spacing between lines of text
                </span>
              </div>
              <div className="vf-settings-field-control">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--vf-space-3)' }}>
                  <input
                    type="range"
                    min="1.2"
                    max="2.0"
                    step="0.1"
                    value={theme.lineHeight}
                    onChange={(e) => handleThemeChange('lineHeight', parseFloat(e.target.value))}
                    className="vf-settings-range"
                  />
                  <span style={{ 
                    color: 'var(--vf-text-primary)', 
                    fontFamily: 'var(--vf-font-mono)',
                    minWidth: '40px'
                  }}>
                    {theme.lineHeight}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Interface</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Icon Size</label>
                <span className="vf-settings-field-description">
                  Size of icons throughout the interface
                </span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={theme.iconSize}
                  onChange={(e) => handleThemeChange('iconSize', e.target.value)}
                  className="vf-settings-select"
                >
                  <option value="small">Small (12px)</option>
                  <option value="medium">Medium (14px)</option>
                  <option value="large">Large (18px)</option>
                </select>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Compact Mode</label>
                <span className="vf-settings-field-description">
                  Reduce spacing and padding for a more compact interface
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={theme.compactMode}
                  onChange={(e) => handleThemeChange('compactMode', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Animations</label>
                <span className="vf-settings-field-description">
                  Enable smooth transitions and animations
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={theme.animations}
                  onChange={(e) => handleThemeChange('animations', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Preview</h3>
          <div className="vf-settings-group-content">
            <div style={{
              padding: 'var(--vf-space-4)',
              border: '1px solid var(--vf-surface-border)',
              background: 'var(--vf-bg-secondary)',
              fontFamily: theme.fontFamily,
              fontSize: `${theme.fontSize}px`,
              lineHeight: theme.lineHeight
            }}>
              <div style={{ 
                color: theme.primaryColor, 
                fontWeight: 'bold',
                marginBottom: 'var(--vf-space-2)'
              }}>
                Theme Preview
              </div>
              <div style={{ color: 'var(--vf-text-primary)', marginBottom: 'var(--vf-space-2)' }}>
                This is how your primary text will appear with the selected font and size.
              </div>
              <div style={{ color: 'var(--vf-text-secondary)', marginBottom: 'var(--vf-space-2)' }}>
                Secondary text appears in a lighter shade for hierarchy.
              </div>
              <div style={{ color: 'var(--vf-text-muted)' }}>
                Muted text is used for labels and descriptions.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};