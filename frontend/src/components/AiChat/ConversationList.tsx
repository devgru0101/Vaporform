import React from 'react';
import styled from '@emotion/styled';
import { useAppSelector } from '@/hooks/redux';

const ConversationContainer = styled.div<{ theme: string }>`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#333333'};
`;

const ConversationContent = styled.div`
  flex: 1;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #999;
  font-size: 14px;
`;

export const ConversationList: React.FC = () => {
  const { theme } = useAppSelector(state => state.ui);

  return (
    <ConversationContainer theme={theme}>
      <ConversationContent>
        Conversation History
        <br />
        <small>Coming soon...</small>
      </ConversationContent>
    </ConversationContainer>
  );
};