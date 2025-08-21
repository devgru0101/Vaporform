import React from 'react';
import styled from '@emotion/styled';
import { useAppSelector } from '@/hooks/redux';

const ExtensionsContainer = styled.div<{ theme: string }>`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme === 'dark' ? '#252526' : '#f8f8f8'};
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#333333'};
`;

const ExtensionsContent = styled.div`
  flex: 1;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #999;
  font-size: 14px;
`;

export const Extensions: React.FC = () => {
  const { theme } = useAppSelector(state => state.ui);

  return (
    <ExtensionsContainer theme={theme}>
      <ExtensionsContent>
        Extensions
        <br />
        <small>Coming soon...</small>
      </ExtensionsContent>
    </ExtensionsContainer>
  );
};