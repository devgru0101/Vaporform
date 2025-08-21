import React from 'react';
import { useAppSelector } from '@/hooks/redux';
import './StatusBar.css';

export const StatusBar: React.FC = () => {
  const { isConnected } = useAppSelector(state => state.collaboration);
  const { tabs, activeTabId } = useAppSelector(state => state.editor);
  const { selectedFile } = useAppSelector(state => state.fileSystem);
  const { error: authError } = useAppSelector(state => state.auth);
  const { error: aiError } = useAppSelector(state => state.ai);
  
  // Get active tab info
  const activeTab = tabs.find(tab => tab.isActive);
  const fileExtension = activeTab?.fileName.split('.').pop()?.toLowerCase();
  
  // Get language display name
  const getLanguageDisplayName = (ext?: string): string => {
    const languageMap: Record<string, string> = {
      js: 'JavaScript',
      jsx: 'JavaScript React',
      ts: 'TypeScript',
      tsx: 'TypeScript React',
      py: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      cs: 'C#',
      php: 'PHP',
      rb: 'Ruby',
      go: 'Go',
      rs: 'Rust',
      swift: 'Swift',
      kt: 'Kotlin',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      sass: 'Sass',
      json: 'JSON',
      xml: 'XML',
      yaml: 'YAML',
      yml: 'YAML',
      md: 'Markdown',
      sql: 'SQL',
      sh: 'Shell',
      dockerfile: 'Docker',
    };
    return languageMap[ext || ''] || 'Plain Text';
  };

  // Count problems (errors from various slices)
  const problemCount = [authError, aiError].filter(Boolean).length;

  // Get cursor position from active tab (fallback to default)
  const cursorPosition = activeTab?.cursorPosition || { line: 1, column: 1 };

  return (
    <footer className="vf-status-bar">
      {/* Connection Status */}
      <div className="vf-status-item">
        <span className={`vf-status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
        {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
      </div>
      
      {/* File Encoding */}
      <div className="vf-status-item">UTF-8</div>
      
      {/* Language Mode */}
      <div className="vf-status-item">
        {activeTab ? getLanguageDisplayName(fileExtension) : 'NO FILE'}
      </div>
      
      {/* Cursor Position */}
      <div className="vf-status-item">
        LN {cursorPosition.line}, COL {cursorPosition.column}
      </div>
      
      {/* Problems Count */}
      <div className="vf-status-item" style={{ marginLeft: 'auto' }}>
        <span className={`vf-status-indicator ${problemCount > 0 ? 'warning' : 'success'}`}></span>
        {problemCount} PROBLEM{problemCount !== 1 ? 'S' : ''}
      </div>
      
      {/* Git Branch */}
      <div className="vf-status-item">
        <svg className="vf-icon vf-icon-sm" viewBox="0 0 24 24">
          <path d="M9 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 9.5a3 3 0 1 0 6 0 3 3 0 0 0-6 0zm14 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0zM9 13V9.5m6 0V16a3 3 0 0 0 3 3"/>
        </svg>
        MAIN
      </div>
    </footer>
  );
};