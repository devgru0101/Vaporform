import React from 'react';
import styled from '@emotion/styled';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { uiSlice } from '@/store/ui';
import { VaporformLogo } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

const WelcomeContainer = styled.div<{ theme: string }>`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#333333'};
  text-align: center;
  padding: 40px;
`;

const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
`;

const LogoIcon = styled.div<{ theme: string }>`
  margin-bottom: 20px;
  color: ${props => props.theme === 'dark' ? '#007acc' : '#1976d2'};
`;

const WelcomeTitle = styled.h1<{ theme: string }>`
  font-size: 32px;
  font-weight: 300;
  margin: 0 0 12px 0;
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#000000'};
`;

const WelcomeSubtitle = styled.p<{ theme: string }>`
  font-size: 16px;
  margin: 0 0 40px 0;
  color: ${props => props.theme === 'dark' ? '#a0a0a0' : '#666666'};
  line-height: 1.5;
  max-width: 600px;
`;

const ActionsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  margin-bottom: 40px;
`;

const ActionButton = styled(Button)`
  min-width: 200px;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  max-width: 800px;
  width: 100%;
  margin-top: 40px;
`;

const FeatureCard = styled.div<{ theme: string }>`
  padding: 20px;
  border-radius: 8px;
  background-color: ${props => props.theme === 'dark' ? '#252526' : '#f8f9fa'};
  border: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e9ecef'};
  text-align: left;
`;

const FeatureIcon = styled.div`
  font-size: 24px;
  margin-bottom: 12px;
`;

const FeatureTitle = styled.h3<{ theme: string }>`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#000000'};
`;

const FeatureDescription = styled.p<{ theme: string }>`
  font-size: 14px;
  margin: 0;
  color: ${props => props.theme === 'dark' ? '#a0a0a0' : '#666666'};
  line-height: 1.4;
`;

const KeyboardShortcuts = styled.div<{ theme: string }>`
  margin-top: 40px;
  padding: 20px;
  border-radius: 8px;
  background-color: ${props => props.theme === 'dark' ? '#252526' : '#f8f9fa'};
  border: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e9ecef'};
  max-width: 400px;
  width: 100%;
`;

const ShortcutsTitle = styled.h4<{ theme: string }>`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#000000'};
  text-align: center;
`;

const ShortcutItem = styled.div<{ theme: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
  color: ${props => props.theme === 'dark' ? '#a0a0a0' : '#666666'};
  
  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e9ecef'};
  }
`;

const ShortcutKey = styled.kbd<{ theme: string }>`
  background-color: ${props => props.theme === 'dark' ? '#3e3e42' : '#e9ecef'};
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#333333'};
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-family: monospace;
`;

export const WelcomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector(state => state.ui);

  const handleCreateProject = () => {
    dispatch(uiSlice.actions.openModal('projectSettings'));
  };

  const handleOpenFile = () => {
    dispatch(uiSlice.actions.openModal('quickOpen'));
  };

  const handleShowCommandPalette = () => {
    dispatch(uiSlice.actions.openModal('commandPalette'));
  };

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Development',
      description: 'Get intelligent code suggestions, explanations, and assistance from Claude AI integrated directly into your workflow.'
    },
    {
      icon: '🔄',
      title: 'Real-Time Collaboration',
      description: 'Work together with your team in real-time with operational transforms, live cursors, and instant synchronization.'
    },
    {
      icon: '🐳',
      title: 'Container Management',
      description: 'Manage Docker containers, monitor performance, view logs, and control your development environment.'
    },
    {
      icon: '📁',
      title: 'Virtual File System',
      description: 'Navigate and edit files with a powerful virtual file system that supports version control and sharing.'
    }
  ];

  const shortcuts = [
    { action: 'Command Palette', key: 'Ctrl+Shift+P' },
    { action: 'Quick Open', key: 'Ctrl+P' },
    { action: 'Toggle Sidebar', key: 'Ctrl+B' },
    { action: 'New File', key: 'Ctrl+N' },
    { action: 'Save File', key: 'Ctrl+S' },
    { action: 'Find', key: 'Ctrl+F' },
  ];

  return (
    <WelcomeContainer theme={theme}>
      <LogoSection>
        <LogoIcon theme={theme}>
          <VaporformLogo size={64} />
        </LogoIcon>
        <WelcomeTitle theme={theme}>Welcome to Vaporform</WelcomeTitle>
        <WelcomeSubtitle theme={theme}>
          The AI-powered development environment that brings your ideas to life with 
          intelligent assistance, real-time collaboration, and seamless container management.
        </WelcomeSubtitle>
      </LogoSection>

      <ActionsSection>
        <ActionButton
          variant="primary"
          size="lg"
          onClick={handleCreateProject}
        >
          Create New Project
        </ActionButton>
        <ActionButton
          variant="secondary"
          size="md"
          onClick={handleOpenFile}
        >
          Open File
        </ActionButton>
      </ActionsSection>

      <FeaturesGrid>
        {features.map((feature, index) => (
          <FeatureCard key={index} theme={theme}>
            <FeatureIcon>{feature.icon}</FeatureIcon>
            <FeatureTitle theme={theme}>{feature.title}</FeatureTitle>
            <FeatureDescription theme={theme}>
              {feature.description}
            </FeatureDescription>
          </FeatureCard>
        ))}
      </FeaturesGrid>

      <KeyboardShortcuts theme={theme}>
        <ShortcutsTitle theme={theme}>Keyboard Shortcuts</ShortcutsTitle>
        {shortcuts.map((shortcut, index) => (
          <ShortcutItem key={index} theme={theme}>
            <span>{shortcut.action}</span>
            <ShortcutKey theme={theme}>{shortcut.key}</ShortcutKey>
          </ShortcutItem>
        ))}
      </KeyboardShortcuts>
    </WelcomeContainer>
  );
};