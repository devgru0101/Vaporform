import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { uiSlice } from '@/store/ui';
import { AiChatPanel } from '@/components/AiChat';
import { ProjectPreview } from '@/components/ProjectPreview';
import { CloseIcon, MinimizeIcon } from '@/components/ui/Icons';

const SidebarContainer = styled.div<{ 
  width: number; 
  theme: string;
  isMinimized: boolean;
}>`
  position: fixed;
  right: 0;
  top: 35px; /* Header height */
  bottom: 22px; /* Status bar height */
  width: ${props => props.isMinimized ? 0 : props.width}px;
  background-color: ${props => props.theme === 'dark' ? '#252526' : '#f8f8f8'};
  border-left: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.2s ease;
  z-index: 90;
`;

const TabBar = styled.div<{ theme: string }>`
  height: 35px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  background-color: ${props => props.theme === 'dark' ? '#2d2d30' : '#f3f3f3'};
`;

const Tab = styled.button<{ 
  isActive: boolean; 
  theme: string;
}>`
  height: 35px;
  padding: 0 12px;
  border: none;
  background: ${props => props.isActive 
    ? (props.theme === 'dark' ? '#252526' : '#f8f8f8')
    : 'transparent'
  };
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#333333'};
  font-size: 12px;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.isActive 
    ? (props.theme === 'dark' ? '#007acc' : '#0277bd')
    : 'transparent'
  };
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#2a2d2e' : '#e8e8e8'};
  }
`;

const SidebarActions = styled.div`
  margin-left: auto;
  display: flex;
  gap: 4px;
  padding: 0 8px;
`;

const SidebarButton = styled.button<{ theme: string }>`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 3px;
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#666666'};
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#3e3e42' : '#e8e8e8'};
    color: ${props => props.theme === 'dark' ? '#ffffff' : '#000000'};
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ResizeHandle = styled.div<{ theme: string }>`
  position: absolute;
  left: -4px;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: col-resize;
  background: transparent;
  z-index: 1000;
  
  &:hover {
    background: ${props => props.theme === 'dark' ? '#007acc' : '#0277bd'};
    width: 2px;
    left: -1px;
  }
`;

type RightPanelTab = 'aiChat' | 'projectPreview';

export const RightSidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme, layout, panels } = useAppSelector(state => state.ui);
  const [activeTab, setActiveTab] = useState<RightPanelTab>('aiChat');
  const [isResizing, setIsResizing] = useState(false);

  const handleMinimize = () => {
    dispatch(uiSlice.actions.updatePanelDimensions({
      panel: 'rightSidebar',
      dimensions: { isMinimized: !layout.rightSidebar.isMinimized }
    }));
  };

  const handleClose = () => {
    dispatch(uiSlice.actions.updatePanelDimensions({
      panel: 'rightSidebar',
      dimensions: { isVisible: false }
    }));
  };

  const handleTabChange = (tab: RightPanelTab) => {
    setActiveTab(tab);
    // Enable the corresponding panel
    dispatch(uiSlice.actions.showPanel(tab));
  };

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 250;
      const maxWidth = 800;
      
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      dispatch(uiSlice.actions.updatePanelDimensions({
        panel: 'rightSidebar',
        dimensions: { width: clampedWidth }
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'aiChat':
        return <AiChatPanel />;
      case 'projectPreview':
        return <ProjectPreview />;
      default:
        return <AiChatPanel />;
    }
  };

  // Determine active tab based on panels state
  React.useEffect(() => {
    if (panels.aiChat) {
      setActiveTab('aiChat');
    } else if (panels.projectPreview) {
      setActiveTab('projectPreview');
    }
  }, [panels.aiChat, panels.projectPreview]);

  return (
    <SidebarContainer
      width={layout.rightSidebar.width}
      theme={theme}
      isMinimized={layout.rightSidebar.isMinimized}
      className="right-sidebar"
    >
      <ResizeHandle 
        theme={theme} 
        onMouseDown={handleMouseDown}
        style={{ cursor: isResizing ? 'col-resize' : 'default' }}
      />
      
      <TabBar theme={theme}>
        <Tab
          isActive={activeTab === 'aiChat'}
          theme={theme}
          onClick={() => handleTabChange('aiChat')}
        >
          AI Chat
        </Tab>
        <Tab
          isActive={activeTab === 'projectPreview'}
          theme={theme}
          onClick={() => handleTabChange('projectPreview')}
        >
          Preview
        </Tab>
        
        <SidebarActions>
          <SidebarButton
            theme={theme}
            onClick={handleMinimize}
            title={layout.rightSidebar.isMinimized ? 'Restore' : 'Minimize'}
          >
            <MinimizeIcon size={14} />
          </SidebarButton>
          <SidebarButton
            theme={theme}
            onClick={handleClose}
            title="Close Sidebar"
          >
            <CloseIcon size={14} />
          </SidebarButton>
        </SidebarActions>
      </TabBar>

      <SidebarContent>
        {renderTabContent()}
      </SidebarContent>
    </SidebarContainer>
  );
};