import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { uiSlice } from '@/store/ui';
import { Header } from './Header';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { MainArea } from './MainArea';
import { StatusBar } from './StatusBar';
import { ActivityBar } from './ActivityBar';
import { BottomPanel } from './BottomPanel';
import { Modals } from './Modals';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { ResizePanels } from './ResizePanels';

const LayoutContainer = styled.div<{ 
  theme: string; 
  isZenMode: boolean; 
  isFullscreen: boolean;
}>`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#333333'};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  font-size: ${props => `${props.fontSize || 14}px`};
  overflow: hidden;
  
  ${props => props.isFullscreen && `
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
  `}
  
  ${props => props.isZenMode && `
    .activity-bar,
    .left-sidebar,
    .right-sidebar,
    .bottom-panel {
      display: none !important;
    }
  `}
`;

const MainContent = styled.div<{ 
  activityBarVisible: boolean; 
  leftSidebarVisible: boolean;
  leftSidebarWidth: number;
  rightSidebarVisible: boolean;
  rightSidebarWidth: number;
  bottomPanelVisible: boolean;
  bottomPanelHeight: number;
}>`
  display: flex;
  flex: 1;
  overflow: hidden;
  
  .main-area {
    flex: 1;
    margin-left: ${props => {
      let margin = 0;
      if (props.activityBarVisible) margin += 48;
      if (props.leftSidebarVisible) margin += props.leftSidebarWidth;
      return `${margin}px`;
    }};
    margin-right: ${props => props.rightSidebarVisible ? `${props.rightSidebarWidth}px` : '0'};
    margin-bottom: ${props => props.bottomPanelVisible ? `${props.bottomPanelHeight}px` : '0'};
  }
`;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    theme, 
    fontSize,
    layout,
    isZenMode, 
    isFullscreen, 
    activityBarVisible,
    panels 
  } = useAppSelector(state => state.ui);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement !== null;
      if (isCurrentlyFullscreen !== isFullscreen) {
        dispatch(uiSlice.actions.toggleFullscreen());
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen, dispatch]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        
        // Update panel dimensions based on window size
        dispatch(uiSlice.actions.updatePanelDimensions({
          panel: 'leftSidebar',
          dimensions: { height: clientHeight - layout.headerHeight - layout.statusBarHeight }
        }));
        
        dispatch(uiSlice.actions.updatePanelDimensions({
          panel: 'rightSidebar',
          dimensions: { height: clientHeight - layout.headerHeight - layout.statusBarHeight }
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch, layout.headerHeight, layout.statusBarHeight]);

  return (
    <LayoutContainer
      ref={containerRef}
      theme={theme}
      fontSize={fontSize}
      isZenMode={isZenMode}
      isFullscreen={isFullscreen}
    >
      <KeyboardShortcuts />
      
      {/* Header */}
      <Header />
      
      {/* Main Content Area */}
      <MainContent
        activityBarVisible={activityBarVisible}
        leftSidebarVisible={layout.leftSidebar.isVisible}
        leftSidebarWidth={layout.leftSidebar.width}
        rightSidebarVisible={layout.rightSidebar.isVisible}
        rightSidebarWidth={layout.rightSidebar.width}
        bottomPanelVisible={layout.bottomPanel.isVisible}
        bottomPanelHeight={layout.bottomPanel.height}
      >
        {/* Activity Bar */}
        {activityBarVisible && <ActivityBar />}
        
        {/* Left Sidebar */}
        {layout.leftSidebar.isVisible && <LeftSidebar />}
        
        {/* Main Editor Area */}
        <MainArea className="main-area">
          {children}
        </MainArea>
        
        {/* Right Sidebar */}
        {layout.rightSidebar.isVisible && <RightSidebar />}
        
        {/* Bottom Panel */}
        {layout.bottomPanel.isVisible && <BottomPanel />}
      </MainContent>
      
      {/* Status Bar */}
      <StatusBar />
      
      {/* Resize Handles */}
      <ResizePanels />
      
      {/* Modals */}
      <Modals />
    </LayoutContainer>
  );
};