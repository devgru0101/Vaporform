import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { uiSlice } from '@/store/ui';
import { UserMenu } from './UserMenu';
import './Header.css';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'terminal' | 'infrastructure' | 'encore'>('terminal');

  const handleTabClick = (tab: 'terminal' | 'infrastructure' | 'encore') => {
    setActiveTab(tab);
    
    switch (tab) {
      case 'terminal':
        dispatch(uiSlice.actions.showPanel('terminal'));
        break;
      case 'infrastructure':
        dispatch(uiSlice.actions.openModal('containerSettings'));
        break;
      case 'encore':
        window.open('http://192.168.1.235:4001/encore/dashboard', '_blank');
        break;
    }
  };

  const handleSettings = () => {
    dispatch(uiSlice.actions.openModal('settings'));
  };

  return (
    <nav className="vf-top-nav">
      <div className="vf-nav-brand">
        <svg className="vf-icon vf-icon-lg" viewBox="0 0 24 24">
          <path d="M13 2L3 14l9 9L22 11z" strokeLinejoin="round"/>
        </svg>
        VAPORFORM
      </div>
      
      <div className="vf-nav-tabs">
        <button 
          className={`vf-nav-tab ${activeTab === 'terminal' ? 'active' : ''}`}
          onClick={() => handleTabClick('terminal')}
        >
          Terminal
        </button>
        <button 
          className={`vf-nav-tab ${activeTab === 'infrastructure' ? 'active' : ''}`}
          onClick={() => handleTabClick('infrastructure')}
        >
          Infrastructure
        </button>
        <button 
          className={`vf-nav-tab ${activeTab === 'encore' ? 'active' : ''}`}
          onClick={() => handleTabClick('encore')}
        >
          Encore Dashboard
        </button>
      </div>
      
      <div className="vf-nav-actions">
        <button className="vf-btn vf-btn-ghost" onClick={handleSettings}>
          <svg className="vf-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M20.46 20.46l-4.24-4.24M1.54 20.46l4.24-4.24"/>
          </svg>
        </button>
        
        <UserMenu />
      </div>
    </nav>
  );
};