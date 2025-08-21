import React from 'react';
import styled from '@emotion/styled';
import { useAppSelector } from '@/hooks/redux';

const PanelContainer = styled.div<{ theme: string; height: number }>`
  position: fixed;
  bottom: 22px; /* Status bar height */
  left: 48px; /* Activity bar width */
  right: 0;
  height: ${props => props.height}px;
  background-color: ${props => props.theme === 'dark' ? '#252526' : '#f8f8f8'};
  border-top: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  display: flex;
  flex-direction: column;
  z-index: 80;
`;

const PanelContent = styled.div`
  flex: 1;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #999;
  font-size: 14px;
`;

export const BottomPanel: React.FC = () => {
  const { theme, layout } = useAppSelector(state => state.ui);

  return (
    <PanelContainer theme={theme} height={layout.bottomPanel.height} className="bottom-panel">
      <PanelContent>
        Terminal / Output Panel
        <br />
        <small>Coming soon...</small>
      </PanelContent>
    </PanelContainer>
  );
};