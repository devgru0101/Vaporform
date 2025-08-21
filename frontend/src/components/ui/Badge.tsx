import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
  onClick?: () => void;
}

const badgeVariants = {
  default: 'bg-blue-600 text-white',
  secondary: 'bg-gray-100 text-gray-800',
  outline: 'border border-gray-300 text-gray-700 bg-white',
  destructive: 'bg-red-600 text-white'
};

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  className = '',
  onClick 
}) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeVariants[variant]} ${className} ${
      onClick ? 'cursor-pointer hover:opacity-80' : ''
    }`}
    onClick={onClick}
  >
    {children}
  </span>
);