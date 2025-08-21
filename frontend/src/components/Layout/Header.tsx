import React from 'react';
import styled from '@emotion/styled';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { uiSlice } from '@/store/ui';
import { VaporformLogo } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from './Breadcrumbs';
import { UserMenu } from './UserMenu';

const HeaderContainer = styled.header<{ height: number; theme: string }>`
  display: flex;
  align-items: center;
  height: ${props => props.height}px;
  background-color: ${props => props.theme === 'dark' ? '#2d2d30' : '#f3f3f3'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  padding: 0 12px;
  flex-shrink: 0;
  user-select: none;
  -webkit-app-region: drag;
  z-index: 1000;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 24px;
  -webkit-app-region: no-drag;
`;

const LogoText = styled.span<{ theme: string }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#000000'};
`;

const NavigationButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-right: 24px;
  -webkit-app-region: no-drag;
`;

const CenterSection = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-app-region: no-drag;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  -webkit-app-region: no-drag;
`;

const ConnectionStatus = styled.div<{ isConnected: boolean; theme: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#666666'};
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => props.isConnected ? '#4CAF50' : '#f44336'};
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: 4px;
`;

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme, layout, breadcrumbs } = useAppSelector(state => state.ui);
  const { currentProject } = useAppSelector(state => state.projects);
  const { isConnected } = useAppSelector(state => state.collaboration);
  const { user } = useAppSelector(state => state.auth);

  const handleProjectTerminal = () => {
    dispatch(uiSlice.actions.showPanel('terminal'));
    dispatch(uiSlice.actions.updatePanelDimensions({
      panel: 'bottomPanel',
      dimensions: { isVisible: true }
    }));
  };

  const handleInfrastructure = () => {
    dispatch(uiSlice.actions.openModal('containerSettings'));
  };

  const handleEncoreDashboard = () => {
    // Open Encore.ts dashboard in new tab
    window.open('http://localhost:4000/encore/dashboard', '_blank');
  };

  const handleCommandPalette = () => {
    dispatch(uiSlice.actions.openModal('commandPalette'));
  };

  return (
    <HeaderContainer height={layout.headerHeight} theme={theme}>
      {/* Logo Section */}
      <LogoSection>
        <VaporformLogo size={20} />
        <LogoText theme={theme}>Vaporform</LogoText>
      </LogoSection>

      {/* Navigation Buttons */}
      <NavigationButtons>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleProjectTerminal}
          title="Project Terminal"
        >
          Terminal
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleInfrastructure}
          title="Infrastructure Management"
        >
          Infrastructure
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEncoreDashboard}
          title="Encore Dashboard"
        >
          Encore Dashboard
        </Button>
      </NavigationButtons>

      {/* Center Section - Breadcrumbs */}
      <CenterSection>
        <Breadcrumbs items={breadcrumbs} />
      </CenterSection>

      {/* Right Section */}
      <RightSection>
        {/* Quick Actions */}
        <QuickActions>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCommandPalette}
            title="Command Palette (Ctrl+Shift+P)"
          >
            ⌘
          </Button>
        </QuickActions>

        {/* Connection Status */}
        <ConnectionStatus isConnected={isConnected} theme={theme}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </ConnectionStatus>

        {/* Project Info */}
        {currentProject && (
          <div style={{ 
            fontSize: '12px', 
            color: theme === 'dark' ? '#cccccc' : '#666666',
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {currentProject.name}
          </div>
        )}

        {/* User Menu */}
        <UserMenu user={user} />
      </RightSection>
    </HeaderContainer>
  );
};