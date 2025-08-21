import React from 'react';
import { Header } from './Header';
import { ActivityBar } from './ActivityBar';
import { AiAssistant } from './AiAssistant';
import { FileExplorer } from '../FileExplorer';
import { MainArea } from './MainArea';
import { StatusBar } from './StatusBar';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { Modals } from './Modals';
import './Layout.css';

export const Layout: React.FC = () => {
  return (
    <div className="vf-app-container">
      <KeyboardShortcuts />
      
      {/* Top Navigation Bar */}
      <Header />
      
      {/* Left App Sidebar - Column 1 */}
      <ActivityBar />
      
      {/* AI Assistant Panel - Column 2 (LEFT SIDE) */}
      <AiAssistant />
      
      {/* File Explorer - Column 3 */}
      <FileExplorer />
      
      {/* Main Content Area - Column 4 */}
      <MainArea />
      
      {/* Status Bar */}
      <StatusBar />
      
      {/* Modals */}
      <Modals />
    </div>
  );
};