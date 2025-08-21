import React from 'react';
import styled from '@emotion/styled';
import { useAppSelector } from '@/hooks/redux';

const PreviewContainer = styled.div<{ theme: string }>`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#333333'};
`;

const PreviewContent = styled.div`
  flex: 1;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #999;
  font-size: 14px;
`;

export const ProjectPreview: React.FC = () => {
  const { theme } = useAppSelector(state => state.ui);

  return (
    <PreviewContainer theme={theme}>
      <PreviewContent>
        Project Preview
        <br />
        <small>Live container output will appear here</small>
      </PreviewContent>
    </PreviewContainer>
  );
};