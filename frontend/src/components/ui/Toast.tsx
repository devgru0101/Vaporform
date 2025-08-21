import React from 'react';

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  // TODO: Implement toast notification system
  return <>{children}</>;
};