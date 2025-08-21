import React, { useState } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { uiSlice } from '@/store/ui';
import './ActivityBar.css';

export const ActivityBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const [activeIcon, setActiveIcon] = useState<string>('explorer');

  const handleIconClick = (iconName: string, action: () => void) => {
    setActiveIcon(iconName);
    action();
  };

  const handleExplorer = () => {
    // Toggle file explorer visibility
    dispatch(uiSlice.actions.togglePanel('fileExplorer'));
  };

  const handleSearch = () => {
    dispatch(uiSlice.actions.openModal('globalSearch'));
  };

  const handleSourceControl = () => {
    dispatch(uiSlice.actions.togglePanel('sourceControl'));
  };

  const handleDebug = () => {
    dispatch(uiSlice.actions.togglePanel('debug'));
  };

  const handleExtensions = () => {
    dispatch(uiSlice.actions.togglePanel('extensions'));
  };

  const handleSettings = () => {
    dispatch(uiSlice.actions.openModal('settings'));
  };

  return (
    <aside className="vf-app-sidebar">
      <div 
        className={`vf-app-icon ${activeIcon === 'explorer' ? 'active' : ''}`} 
        title="Explorer"
        onClick={() => handleIconClick('explorer', handleExplorer)}
      >
        <svg className="vf-icon" viewBox="0 0 24 24">
          <path d="M3 3v18h18V3H3zm16 2v2H5V5h14zm0 4v10H5V9h14z"/>
          <path d="M7 11h2v2H7zm4 0h6v2h-6zm-4 4h2v2H7zm4 0h6v2h-6z"/>
        </svg>
      </div>
      
      <div 
        className={`vf-app-icon ${activeIcon === 'search' ? 'active' : ''}`} 
        title="Search"
        onClick={() => handleIconClick('search', handleSearch)}
      >
        <svg className="vf-icon" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
      
      <div 
        className={`vf-app-icon ${activeIcon === 'source-control' ? 'active' : ''}`} 
        title="Source Control"
        onClick={() => handleIconClick('source-control', handleSourceControl)}
      >
        <svg className="vf-icon" viewBox="0 0 24 24">
          <path d="M9 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 9.5a3 3 0 1 0 6 0 3 3 0 0 0-6 0zm14 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0zM9 13V9.5m6 0V16a3 3 0 0 0 3 3"/>
        </svg>
      </div>
      
      <div 
        className={`vf-app-icon ${activeIcon === 'debug' ? 'active' : ''}`} 
        title="Run and Debug"
        onClick={() => handleIconClick('debug', handleDebug)}
      >
        <svg className="vf-icon" viewBox="0 0 24 24">
          <path d="m5 12 14 0"/>
          <path d="m5 12 6 6"/>
          <path d="m5 12 6-6"/>
          <circle cx="19" cy="12" r="2"/>
        </svg>
      </div>
      
      <div 
        className={`vf-app-icon ${activeIcon === 'extensions' ? 'active' : ''}`} 
        title="Extensions"
        onClick={() => handleIconClick('extensions', handleExtensions)}
      >
        <svg className="vf-icon" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      </div>
      
      <div 
        className={`vf-app-icon ${activeIcon === 'settings' ? 'active' : ''}`} 
        title="Settings" 
        style={{ marginTop: 'auto' }}
        onClick={() => handleIconClick('settings', handleSettings)}
      >
        <svg className="vf-icon" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M20.46 20.46l-4.24-4.24M1.54 20.46l4.24-4.24"/>
        </svg>
      </div>
    </aside>
  );
};