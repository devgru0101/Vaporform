import React from 'react';

interface TooltipProps {
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  side = 'top', 
  delay = 0, 
  children 
}) => {
  // TODO: Implement tooltip component
  return <div title={content}>{children}</div>;
};