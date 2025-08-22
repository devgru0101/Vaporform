import React from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { updateEditor } from '@/store/settings';

export const EditorSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { editor } = useAppSelector(state => state.settings);

  const handleEditorChange = (field: keyof typeof editor, value: any) => {
    dispatch(updateEditor({ [field]: value }));
  };

  return (
    <div className="vf-settings-section">
      <div className="vf-settings-section-header">
        <h2 className="vf-settings-section-title">Editor</h2>
        <p className="vf-settings-section-description">
          Configure code editor behavior, appearance, and features
        </p>
      </div>

      <div className="vf-settings-section-content">
        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Typography</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Font Family</label>
                <span className="vf-settings-field-description">
                  Monospace font for code editing
                </span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={editor.fontFamily}
                  onChange={(e) => handleEditorChange('fontFamily', e.target.value)}
                  className="vf-settings-select"
                >
                  <option value="JetBrains Mono, Fira Code, monospace">JetBrains Mono</option>
                  <option value="Fira Code, monospace">Fira Code</option>
                  <option value="Source Code Pro, monospace">Source Code Pro</option>
                  <option value="Monaco, Menlo, 'Ubuntu Mono', consolas, monospace">Monaco</option>
                  <option value="'Cascadia Code', monospace">Cascadia Code</option>
                  <option value="'SF Mono', Monaco, monospace">SF Mono</option>
                  <option value="Consolas, 'Courier New', monospace">Consolas</option>
                  <option value="monospace">System Monospace</option>
                </select>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Font Size</label>
                <span className="vf-settings-field-description">
                  Editor font size in pixels
                </span>
              </div>
              <div className="vf-settings-field-control">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--vf-space-3)' }}>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    step="1"
                    value={editor.fontSize}
                    onChange={(e) => handleEditorChange('fontSize', parseInt(e.target.value))}
                    className="vf-settings-range"
                  />
                  <span style={{ 
                    color: 'var(--vf-text-primary)', 
                    fontFamily: 'var(--vf-font-mono)',
                    minWidth: '40px'
                  }}>
                    {editor.fontSize}px
                  </span>
                </div>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Line Height</label>
                <span className="vf-settings-field-description">
                  Spacing between lines in the editor
                </span>
              </div>
              <div className="vf-settings-field-control">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--vf-space-3)' }}>
                  <input
                    type="range"
                    min="1.2"
                    max="2.0"
                    step="0.1"
                    value={editor.lineHeight}
                    onChange={(e) => handleEditorChange('lineHeight', parseFloat(e.target.value))}
                    className="vf-settings-range"
                  />
                  <span style={{ 
                    color: 'var(--vf-text-primary)', 
                    fontFamily: 'var(--vf-font-mono)',
                    minWidth: '40px'
                  }}>
                    {editor.lineHeight}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Indentation</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Tab Size</label>
                <span className="vf-settings-field-description">
                  Number of spaces per tab or indent level
                </span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={editor.tabSize}
                  onChange={(e) => handleEditorChange('tabSize', parseInt(e.target.value))}
                  className="vf-settings-select"
                >
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                  <option value={8}>8 spaces</option>
                </select>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Indent Type</label>
                <span className="vf-settings-field-description">
                  Use spaces or tab characters for indentation
                </span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={editor.indentType}
                  onChange={(e) => handleEditorChange('indentType', e.target.value)}
                  className="vf-settings-select"
                >
                  <option value="spaces">Spaces</option>
                  <option value="tabs">Tabs</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Display</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Word Wrap</label>
                <span className="vf-settings-field-description">
                  How long lines are handled in the editor
                </span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={editor.wordWrap}
                  onChange={(e) => handleEditorChange('wordWrap', e.target.value)}
                  className="vf-settings-select"
                >
                  <option value="off">Off</option>
                  <option value="on">On</option>
                  <option value="bounded">Bounded</option>
                </select>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Line Numbers</label>
                <span className="vf-settings-field-description">
                  Show line numbers in the editor gutter
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={editor.lineNumbers}
                  onChange={(e) => handleEditorChange('lineNumbers', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Minimap</label>
                <span className="vf-settings-field-description">
                  Show code overview minimap on the right side
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={editor.minimap}
                  onChange={(e) => handleEditorChange('minimap', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Render Whitespace</label>
                <span className="vf-settings-field-description">
                  Show whitespace characters (spaces, tabs)
                </span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={editor.renderWhitespace}
                  onChange={(e) => handleEditorChange('renderWhitespace', e.target.value)}
                  className="vf-settings-select"
                >
                  <option value="none">None</option>
                  <option value="boundary">Boundary</option>
                  <option value="selection">Selection</option>
                  <option value="all">All</option>
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
                <label className="vf-settings-field-label">Auto Save</label>
                <span className="vf-settings-field-description">
                  Automatically save files when conditions are met
                </span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={editor.autoSave}
                  onChange={(e) => handleEditorChange('autoSave', e.target.value)}
                  className="vf-settings-select"
                >
                  <option value="off">Off</option>
                  <option value="afterDelay">After Delay</option>
                  <option value="onFocusChange">On Focus Change</option>
                  <option value="onWindowChange">On Window Change</option>
                </select>
              </div>
            </div>

            {editor.autoSave === 'afterDelay' && (
              <div className="vf-settings-field-row">
                <div className="vf-settings-field-info">
                  <label className="vf-settings-field-label">Auto Save Delay</label>
                  <span className="vf-settings-field-description">
                    Delay in milliseconds before auto-saving
                  </span>
                </div>
                <div className="vf-settings-field-control">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--vf-space-3)' }}>
                    <input
                      type="range"
                      min="500"
                      max="5000"
                      step="500"
                      value={editor.autoSaveDelay}
                      onChange={(e) => handleEditorChange('autoSaveDelay', parseInt(e.target.value))}
                      className="vf-settings-range"
                    />
                    <span style={{ 
                      color: 'var(--vf-text-primary)', 
                      fontFamily: 'var(--vf-font-mono)',
                      minWidth: '60px'
                    }}>
                      {editor.autoSaveDelay}ms
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Bracket Matching</label>
                <span className="vf-settings-field-description">
                  Highlight matching brackets and parentheses
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={editor.bracketMatching}
                  onChange={(e) => handleEditorChange('bracketMatching', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Code Folding</label>
                <span className="vf-settings-field-description">
                  Allow collapsing code blocks and functions
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={editor.folding}
                  onChange={(e) => handleEditorChange('folding', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Highlight Current Line</label>
                <span className="vf-settings-field-description">
                  Highlight the line where the cursor is positioned
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={editor.highlightCurrentLine}
                  onChange={(e) => handleEditorChange('highlightCurrentLine', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Smooth Scrolling</label>
                <span className="vf-settings-field-description">
                  Enable smooth scrolling animation
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={editor.smoothScrolling}
                  onChange={(e) => handleEditorChange('smoothScrolling', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Mouse Wheel Zoom</label>
                <span className="vf-settings-field-description">
                  Allow zooming editor with Ctrl + mouse wheel
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={editor.mouseWheelZoom}
                  onChange={(e) => handleEditorChange('mouseWheelZoom', e.target.checked)}
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
              fontFamily: editor.fontFamily,
              fontSize: `${editor.fontSize}px`,
              lineHeight: editor.lineHeight,
              background: 'var(--vf-bg-secondary)',
              border: '1px solid var(--vf-surface-border)',
              padding: 'var(--vf-space-4)',
              color: 'var(--vf-text-primary)',
              whiteSpace: 'pre'
            }}>
{`function example() {
  const message = "Hello, World!";
  console.log(message);
  
  return {
    status: "success",
    data: message
  };
}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};