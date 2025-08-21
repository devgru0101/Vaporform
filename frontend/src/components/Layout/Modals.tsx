import React from 'react';
import { useAppSelector } from '@/hooks/redux';

// Placeholder for modals component
export const Modals: React.FC = () => {
  const { modals } = useAppSelector(state => state.ui);
  
  // TODO: Implement modals (settings, command palette, etc.)
  return null;
};