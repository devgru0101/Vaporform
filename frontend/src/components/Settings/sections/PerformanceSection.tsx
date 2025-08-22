import React from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { updatePerformance } from '@/store/settings';

export const PerformanceSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { performance } = useAppSelector(state => state.settings);

  const handleChange = (field: keyof typeof performance, value: any) => {
    dispatch(updatePerformance({ [field]: value }));
  };

  return (
    <div className="vf-settings-section">
      <div className="vf-settings-section-header">
        <h2 className="vf-settings-section-title">Performance</h2>
        <p className="vf-settings-section-description">
          Optimize application performance and resource usage
        </p>
      </div>

      <div className="vf-settings-section-content">
        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Caching</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Enable Cache</label>
                <span className="vf-settings-field-description">Cache files and resources</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={performance.enableCache}
                  onChange={(e) => handleChange('enableCache', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Cache Size</label>
                <span className="vf-settings-field-description">Maximum cache size in MB</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="50"
                  value={performance.cacheSize}
                  onChange={(e) => handleChange('cacheSize', parseInt(e.target.value))}
                  className="vf-settings-range"
                />
                <span style={{ marginLeft: 'var(--vf-space-2)' }}>{performance.cacheSize}MB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Optimization</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Preload Files</label>
                <span className="vf-settings-field-description">Preload commonly used files</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={performance.preloadFiles}
                  onChange={(e) => handleChange('preloadFiles', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Lazy Load Components</label>
                <span className="vf-settings-field-description">Load components on demand</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={performance.lazyLoadComponents}
                  onChange={(e) => handleChange('lazyLoadComponents', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Enable Compression</label>
                <span className="vf-settings-field-description">Compress network requests</span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={performance.enableCompression}
                  onChange={(e) => handleChange('enableCompression', e.target.checked)}
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