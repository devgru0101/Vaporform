import React from 'react';
import styled from '@emotion/styled';
import { useAppSelector } from '@/hooks/redux';

const SearchContainer = styled.div<{ theme: string }>`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme === 'dark' ? '#252526' : '#f8f8f8'};
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#333333'};
`;

const SearchContent = styled.div`
  flex: 1;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #999;
  font-size: 14px;
`;

export const Search: React.FC = () => {
  const { theme } = useAppSelector(state => state.ui);

  return (
    <SearchContainer theme={theme}>
      <SearchContent>
        Search
        <br />
        <small>Coming soon...</small>
      </SearchContent>
    </SearchContainer>
  );
};