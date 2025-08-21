import React from 'react';
import styled from '@emotion/styled';
import { useAppSelector } from '@/hooks/redux';
import { MonacoEditor } from '@/components/Editor/MonacoEditor';
import { EditorTabs } from '@/components/Editor/EditorTabs';
import { WelcomeScreen } from '@/components/Editor/WelcomeScreen';

const MainContainer = styled.div<{ theme: string }>`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
  overflow: hidden;
`;

const TabsContainer = styled.div<{ theme: string }>`
  height: 35px;
  background-color: ${props => props.theme === 'dark' ? '#2d2d30' : '#f3f3f3'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  flex-shrink: 0;
`;

const EditorContainer = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`;

interface MainAreaProps {
  className?: string;
  children?: React.ReactNode;
}

export const MainArea: React.FC<MainAreaProps> = ({ className, children }) => {
  const { theme } = useAppSelector(state => state.ui);
  const { tabs, activeTabId } = useAppSelector(state => state.editor);
  
  const hasOpenTabs = tabs.length > 0;

  return (
    <MainContainer theme={theme} className={className}>
      {/* Editor Tabs */}
      {hasOpenTabs && (
        <TabsContainer theme={theme}>
          <EditorTabs />
        </TabsContainer>
      )}

      {/* Editor Area */}
      <EditorContainer>
        {hasOpenTabs && activeTabId ? (
          <MonacoEditor />
        ) : (
          <WelcomeScreen />
        )}
        {children}
      </EditorContainer>
    </MainContainer>
  );
};