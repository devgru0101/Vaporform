import React from 'react';
import { useAppSelector } from '@/hooks/redux';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme } = useAppSelector(state => state.ui);

  // Apply theme class to document
  React.useEffect(() => {
    document.documentElement.className = `${theme}-theme`;
  }, [theme]);

  return <>{children}</>;
};