import React from 'react';
import styled from '@emotion/styled';
import { useAppSelector } from '@/hooks/redux';

const StatusBarContainer = styled.div<{ theme: string; height: number }>`
  height: ${props => props.height}px;
  background-color: ${props => props.theme === 'dark' ? '#007acc' : '#0277bd'};
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 12px;
  flex-shrink: 0;
  z-index: 1000;
`;

const LeftItems = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const RightItems = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatusItem = styled.div`
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

export const StatusBar: React.FC = () => {
  const { theme, layout, statusBar } = useAppSelector(state => state.ui);
  const { isConnected } = useAppSelector(state => state.collaboration);
  const { currentProject } = useAppSelector(state => state.projects);

  return (
    <StatusBarContainer theme={theme} height={layout.statusBarHeight}>
      <LeftItems>
        {statusBar.leftItems
          .sort((a, b) => b.priority - a.priority)
          .map(item => (
            <StatusItem key={item.id} title={item.tooltip}>
              {item.text}
            </StatusItem>
          ))}
        
        {currentProject && (
          <StatusItem>
            📁 {currentProject.name}
          </StatusItem>
        )}
      </LeftItems>

      <RightItems>
        {statusBar.rightItems
          .sort((a, b) => b.priority - a.priority)
          .map(item => (
            <StatusItem key={item.id} title={item.tooltip}>
              {item.text}
            </StatusItem>
          ))}
        
        <StatusItem>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </StatusItem>
        
        <StatusItem>
          Vaporform
        </StatusItem>
      </RightItems>
    </StatusBarContainer>
  );
};