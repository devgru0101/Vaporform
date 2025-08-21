import React from 'react';
import styled, { keyframes } from '@emotion/styled';
import { VaporformLogo } from './Icons';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background-color: #1e1e1e;
  color: #cccccc;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #404040;
  border-top: 3px solid #007acc;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 24px;
`;

const LoadingLogo = styled.div`
  color: #007acc;
  margin-bottom: 20px;
`;

const LoadingText = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const LoadingSubtext = styled.div`
  font-size: 14px;
  opacity: 0.7;
  text-align: center;
  max-width: 300px;
`;

interface LoadingScreenProps {
  message?: string;
  subtext?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading Vaporform...',
  subtext = 'Initializing your AI-powered development environment'
}) => {
  return (
    <LoadingContainer>
      <LoadingLogo>
        <VaporformLogo size={48} />
      </LoadingLogo>
      <LoadingSpinner />
      <LoadingText>{message}</LoadingText>
      <LoadingSubtext>{subtext}</LoadingSubtext>
    </LoadingContainer>
  );
};