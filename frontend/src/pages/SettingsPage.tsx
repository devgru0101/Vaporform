import React from 'react';
import styled from '@emotion/styled';
import { useAppSelector } from '@/hooks/redux';

const SettingsContainer = styled.div<{ theme: string }>`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#333333'};
`;

const SettingsContent = styled.div`
  flex: 1;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #999;
  font-size: 18px;
`;

export const SettingsPage: React.FC = () => {
  const { theme } = useAppSelector(state => state.ui);

  return (
    <SettingsContainer theme={theme}>
      <SettingsContent>
        Settings Page
        <br />
        <small>Coming soon...</small>
      </SettingsContent>
    </SettingsContainer>
  );
};