import React from 'react';
import styled from '@emotion/styled';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { uiSlice } from '@/store/ui';
import { FileExplorer } from '@/components/FileExplorer';
import { Search } from '@/components/Search';
import { SourceControl } from '@/components/SourceControl';
import { Extensions } from '@/components/Extensions';
import { CloseIcon, MinimizeIcon } from '@/components/ui/Icons';

const SidebarContainer = styled.div<{ 
  width: number; 
  theme: string;
  isMinimized: boolean;
}>`
  position: fixed;
  left: 48px; /* Activity bar width */
  top: 35px; /* Header height */
  bottom: 22px; /* Status bar height */
  width: ${props => props.isMinimized ? 0 : props.width}px;
  background-color: ${props => props.theme === 'dark' ? '#252526' : '#f8f8f8'};
  border-right: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.2s ease;
  z-index: 90;
`;

const SidebarHeader = styled.div<{ theme: string }>`
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#333333'};
`;

const SidebarTitle = styled.div`
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
`;

const SidebarActions = styled.div`
  display: flex;
  gap: 4px;
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

export const LeftSidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme, layout, panels } = useAppSelector(state => state.ui);

  const handleMinimize = () => {
    dispatch(uiSlice.actions.updatePanelDimensions({
      panel: 'leftSidebar',
      dimensions: { isMinimized: !layout.leftSidebar.isMinimized }
    }));
  };

  const handleClose = () => {
    dispatch(uiSlice.actions.updatePanelDimensions({
      panel: 'leftSidebar',
      dimensions: { isVisible: false }
    }));
  };

  const getActivePanel = () => {
    if (panels.fileExplorer) return 'fileExplorer';
    if (panels.search) return 'search';
    if (panels.sourceControl) return 'sourceControl';
    if (panels.extensions) return 'extensions';
    return 'fileExplorer'; // Default
  };

  const getPanelTitle = (panel: string) => {
    switch (panel) {
      case 'fileExplorer': return 'Explorer';
      case 'search': return 'Search';
      case 'sourceControl': return 'Source Control';
      case 'extensions': return 'Extensions';
      default: return 'Explorer';
    }
  };

  const renderPanelContent = (panel: string) => {
    switch (panel) {
      case 'fileExplorer':
        return <FileExplorer />;
      case 'search':
        return <Search />;
      case 'sourceControl':
        return <SourceControl />;
      case 'extensions':
        return <Extensions />;
      default:
        return <FileExplorer />;
    }
  };

  const activePanel = getActivePanel();

  return (
    <SidebarContainer
      width={layout.leftSidebar.width}
      theme={theme}
      isMinimized={layout.leftSidebar.isMinimized}
      className="left-sidebar"
    >
      <SidebarHeader theme={theme}>
        <SidebarTitle>{getPanelTitle(activePanel)}</SidebarTitle>
        <SidebarActions>
          <SidebarButton
            theme={theme}
            onClick={handleMinimize}
            title={layout.leftSidebar.isMinimized ? 'Restore' : 'Minimize'}
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
      </SidebarHeader>

      <SidebarContent>
        {renderPanelContent(activePanel)}
      </SidebarContent>
    </SidebarContainer>
  );
};