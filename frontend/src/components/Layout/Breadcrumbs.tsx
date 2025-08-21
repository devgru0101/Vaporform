import React from 'react';
import styled from '@emotion/styled';
import { useAppSelector } from '@/hooks/redux';
import { ChevronRightIcon } from '@/components/ui/Icons';

const BreadcrumbsContainer = styled.nav<{ theme: string }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#a0a0a0' : '#666666'};
  max-width: 400px;
  overflow: hidden;
`;

const BreadcrumbItem = styled.button<{ theme: string; isLast: boolean }>`
  background: none;
  border: none;
  cursor: ${props => props.isLast ? 'default' : 'pointer'};
  color: ${props => props.isLast 
    ? (props.theme === 'dark' ? '#ffffff' : '#000000')
    : (props.theme === 'dark' ? '#a0a0a0' : '#666666')
  };
  font-size: inherit;
  padding: 4px 6px;
  border-radius: 3px;
  transition: background-color 0.2s;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 120px;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme === 'dark' ? '#3e3e42' : '#e8e8e8'};
  }
`;

const Separator = styled.div<{ theme: string }>`
  color: ${props => props.theme === 'dark' ? '#6c6c6c' : '#999999'};
  display: flex;
  align-items: center;
`;

interface BreadcrumbsProps {
  items: Array<{
    label: string;
    path: string;
  }>;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const { theme } = useAppSelector(state => state.ui);

  if (items.length === 0) {
    return null;
  }

  const handleItemClick = (path: string, isLast: boolean) => {
    if (isLast) return;
    
    // TODO: Navigate to the path
    console.log('Navigate to:', path);
  };

  return (
    <BreadcrumbsContainer theme={theme}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={item.path}>
            <BreadcrumbItem
              theme={theme}
              isLast={isLast}
              onClick={() => handleItemClick(item.path, isLast)}
              title={item.label}
            >
              {item.label}
            </BreadcrumbItem>
            
            {!isLast && (
              <Separator theme={theme}>
                <ChevronRightIcon size={12} />
              </Separator>
            )}
          </React.Fragment>
        );
      })}
    </BreadcrumbsContainer>
  );
};