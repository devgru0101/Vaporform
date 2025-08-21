import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { editorSlice } from '@/store/editor';
import './MainArea.css';

interface MainAreaProps {
  // Main area is self-contained and handles its own content
}

export const MainArea: React.FC<MainAreaProps> = () => {
  const dispatch = useAppDispatch();
  const [activeView, setActiveView] = useState<'ide' | 'preview'>('ide');
  
  // Get tabs and active tab from Redux store
  const { tabs, activeTabId } = useAppSelector(state => state.editor);
  const activeTab = tabs.find(tab => tab.isActive);

  const handleViewToggle = (view: 'ide' | 'preview') => {
    setActiveView(view);
  };

  const handleTabClick = (tabId: string) => {
    dispatch(editorSlice.actions.switchTab(tabId));
  };

  const handleTabClose = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(editorSlice.actions.closeTab(tabId));
  };

  const renderCodeEditor = () => {
    if (!activeTab) {
      return (
        <div className="vf-welcome-screen">
          <div className="vf-welcome-content">
            <h2 className="vf-text-xl vf-text-primary">VAPORFORM IDE</h2>
            <p className="vf-text-muted">Open a file to start coding</p>
          </div>
        </div>
      );
    }

    const lines = activeTab.content.split('\n');
    return (
      <div className="vf-code-editor">
        {lines.map((line, index) => (
          <div key={index} className="vf-code-line">
            <span className="vf-line-number">{index + 1}</span>
            <span className="vf-code-content">{line || ' '}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="vf-main-content">
      {/* Sub Header with View Toggle */}
      <div className="vf-content-header">
        <div className="vf-view-toggle">
          <button 
            className={`vf-view-btn ${activeView === 'ide' ? 'active' : ''}`}
            onClick={() => handleViewToggle('ide')}
          >
            IDE
          </button>
          <button 
            className={`vf-view-btn ${activeView === 'preview' ? 'active' : ''}`}
            onClick={() => handleViewToggle('preview')}
          >
            PREVIEW
          </button>
        </div>
        
        <div className="vf-file-tabs">
          {tabs.map(tab => (
            <div 
              key={tab.id}
              className={`vf-file-tab ${tab.isActive ? 'active' : ''} ${tab.isDirty ? 'dirty' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <span className="vf-tab-name">{tab.fileName}</span>
              {tab.isDirty && <span className="vf-tab-dirty-indicator">●</span>}
              <span 
                className="vf-tab-close"
                onClick={(e) => handleTabClose(tab.id, e)}
              >
                <svg className="vf-icon vf-icon-sm" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Editor Area */}
      <div className="vf-editor-area">
        {activeView === 'ide' ? renderCodeEditor() : (
          <div className="vf-preview-area">
            <div className="vf-text-muted">Preview content will appear here</div>
          </div>
        )}
      </div>
    </main>
  );
};