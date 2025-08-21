import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div
    className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`p-6 pb-4 ${className}`}>
    {children}
  </div>
);

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`}>
    {children}
  </p>
);