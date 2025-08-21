import React from 'react';
import styled from '@emotion/styled';
import { useAppSelector } from '@/hooks/redux';

const SourceControlContainer = styled.div<{ theme: string }>`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme === 'dark' ? '#252526' : '#f8f8f8'};
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#333333'};
`;

const SourceControlContent = styled.div`
  flex: 1;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #999;
  font-size: 14px;
`;

export const SourceControl: React.FC = () => {
  const { theme } = useAppSelector(state => state.ui);

  return (
    <SourceControlContainer theme={theme}>
      <SourceControlContent>
        Source Control
        <br />
        <small>Coming soon...</small>
      </SourceControlContent>
    </SourceControlContainer>
  );
};