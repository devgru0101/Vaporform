import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { uiSlice } from '@/store/ui';
import { 
  FileExplorerIcon, 
  SearchIcon, 
  SourceControlIcon, 
  DebugIcon,
  ExtensionsIcon,
  SettingsIcon,
  AiChatIcon,
  SparklesIcon
} from '@/components/ui/Icons';
import { Tooltip } from '@/components/ui/Tooltip';

const ActivityBarContainer = styled.div<{ theme: string }>`
  position: fixed;
  left: 0;
  top: 35px; /* Header height */
  bottom: 22px; /* Status bar height */
  width: 48px;
  background-color: ${props => props.theme === 'dark' ? '#333333' : '#f0f0f0'};
  border-right: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  display: flex;
  flex-direction: column;
  z-index: 100;
`;

const ActivityBarItem = styled.button<{ 
  isActive: boolean; 
  theme: string;
}>`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#666666'};
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#3e3e42' : '#e8e8e8'};
    color: ${props => props.theme === 'dark' ? '#ffffff' : '#000000'};
  }
  
  ${props => props.isActive && `
    background-color: ${props.theme === 'dark' ? '#094771' : '#e1f5fe'};
    color: ${props.theme === 'dark' ? '#ffffff' : '#0277bd'};
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 2px;
      background-color: ${props.theme === 'dark' ? '#007acc' : '#0277bd'};
    }
  `}
`;

const BadgeContainer = styled.div`
  position: relative;
`;

const Badge = styled.span<{ theme: string }>`
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #ff4444;
  color: white;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
`;

const Spacer = styled.div`
  flex: 1;
`;

interface ActivityBarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badge?: number;
  onClick: () => void;
}

const ActivityItem: React.FC<ActivityBarItemProps> = ({
  icon,
  label,
  isActive,
  badge,
  onClick
}) => {
  const { theme } = useAppSelector(state => state.ui);

  return (
    <Tooltip content={label} side="right" delay={500}>
      <ActivityBarItem
        isActive={isActive}
        theme={theme}
        onClick={onClick}
        title={label}
      >
        <BadgeContainer>
          {icon}
          {badge !== undefined && badge > 0 && (
            <Badge theme={theme}>{badge > 99 ? '99+' : badge}</Badge>
          )}
        </BadgeContainer>
      </ActivityBarItem>
    </Tooltip>
  );
};

export const ActivityBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, panels } = useAppSelector(state => state.ui);
  const { unreadChatCount } = useAppSelector(state => state.collaboration);
  const { searchResults } = useAppSelector(state => state.fileSystem);

  const handlePanelToggle = (panel: keyof typeof panels) => {
    dispatch(uiSlice.actions.togglePanel(panel));
    
    // Ensure sidebar is visible when toggling panels
    if (panel === 'fileExplorer' || panel === 'search' || panel === 'sourceControl' || panel === 'extensions') {
      dispatch(uiSlice.actions.updatePanelDimensions({
        panel: 'leftSidebar',
        dimensions: { isVisible: true }
      }));
    }
    
    if (panel === 'aiChat' || panel === 'projectPreview') {
      dispatch(uiSlice.actions.updatePanelDimensions({
        panel: 'rightSidebar',
        dimensions: { isVisible: true }
      }));
    }
    
    if (panel === 'terminal' || panel === 'problems' || panel === 'output' || panel === 'debugConsole') {
      dispatch(uiSlice.actions.updatePanelDimensions({
        panel: 'bottomPanel',
        dimensions: { isVisible: true }
      }));
    }
  };

  const handleSettings = () => {
    dispatch(uiSlice.actions.openModal('settings'));
  };

  const handleWizard = () => {
    navigate('/wizard');
  };

  return (
    <ActivityBarContainer theme={theme} className="activity-bar">
      <ActivityItem
        icon={<FileExplorerIcon size={24} />}
        label="File Explorer"
        isActive={panels.fileExplorer}
        onClick={() => handlePanelToggle('fileExplorer')}
      />
      
      <ActivityItem
        icon={<SearchIcon size={24} />}
        label="Search"
        isActive={panels.search}
        badge={searchResults.length}
        onClick={() => handlePanelToggle('search')}
      />
      
      <ActivityItem
        icon={<SourceControlIcon size={24} />}
        label="Source Control"
        isActive={panels.sourceControl}
        onClick={() => handlePanelToggle('sourceControl')}
      />
      
      <ActivityItem
        icon={<DebugIcon size={24} />}
        label="Debug Console"
        isActive={panels.debugConsole}
        onClick={() => handlePanelToggle('debugConsole')}
      />
      
      <ActivityItem
        icon={<ExtensionsIcon size={24} />}
        label="Extensions"
        isActive={panels.extensions}
        onClick={() => handlePanelToggle('extensions')}
      />
      
      <ActivityItem
        icon={<AiChatIcon size={24} />}
        label="AI Chat"
        isActive={panels.aiChat}
        badge={unreadChatCount}
        onClick={() => handlePanelToggle('aiChat')}
      />
      
      <ActivityItem
        icon={<SparklesIcon size={24} />}
        label="Project Wizard"
        isActive={location.pathname.startsWith('/wizard')}
        onClick={handleWizard}
      />
      
      <Spacer />
      
      <ActivityItem
        icon={<SettingsIcon size={24} />}
        label="Settings"
        isActive={false}
        onClick={handleSettings}
      />
    </ActivityBarContainer>
  );
};