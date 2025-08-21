import React from 'react';
import styled from '@emotion/styled';
import { useAppSelector } from '@/hooks/redux';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const StyledButton = styled.button<{
  variant: ButtonVariant;
  size: ButtonSize;
  theme: string;
  fullWidth?: boolean;
  disabled?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-family: inherit;
  font-weight: 500;
  transition: all 0.2s;
  text-decoration: none;
  user-select: none;
  white-space: nowrap;
  outline: none;
  position: relative;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  
  &:focus-visible {
    outline: 2px solid ${props => props.theme === 'dark' ? '#4a9eff' : '#2196f3'};
    outline-offset: 2px;
  }

  ${props => {
    const { variant, size, theme } = props;
    
    // Size styles
    const sizeStyles = {
      xs: 'padding: 4px 8px; font-size: 11px; min-height: 20px;',
      sm: 'padding: 6px 12px; font-size: 12px; min-height: 28px;',
      md: 'padding: 8px 16px; font-size: 14px; min-height: 32px;',
      lg: 'padding: 12px 20px; font-size: 16px; min-height: 40px;',
    };
    
    // Variant styles
    const variantStyles = {
      primary: theme === 'dark' ? `
        background-color: #0e639c;
        color: #ffffff;
        &:hover:not(:disabled) {
          background-color: #1177bb;
        }
        &:active:not(:disabled) {
          background-color: #0d5a8a;
        }
      ` : `
        background-color: #1976d2;
        color: #ffffff;
        &:hover:not(:disabled) {
          background-color: #1565c0;
        }
        &:active:not(:disabled) {
          background-color: #0d47a1;
        }
      `,
      
      secondary: theme === 'dark' ? `
        background-color: #3e3e42;
        color: #cccccc;
        border: 1px solid #5e5e5e;
        &:hover:not(:disabled) {
          background-color: #4e4e52;
        }
        &:active:not(:disabled) {
          background-color: #2e2e32;
        }
      ` : `
        background-color: #f5f5f5;
        color: #333333;
        border: 1px solid #d0d0d0;
        &:hover:not(:disabled) {
          background-color: #e8e8e8;
        }
        &:active:not(:disabled) {
          background-color: #dcdcdc;
        }
      `,
      
      ghost: theme === 'dark' ? `
        background-color: transparent;
        color: #cccccc;
        &:hover:not(:disabled) {
          background-color: #3e3e42;
        }
        &:active:not(:disabled) {
          background-color: #2e2e32;
        }
      ` : `
        background-color: transparent;
        color: #666666;
        &:hover:not(:disabled) {
          background-color: #f0f0f0;
        }
        &:active:not(:disabled) {
          background-color: #e0e0e0;
        }
      `,
      
      danger: theme === 'dark' ? `
        background-color: #c62828;
        color: #ffffff;
        &:hover:not(:disabled) {
          background-color: #d32f2f;
        }
        &:active:not(:disabled) {
          background-color: #b71c1c;
        }
      ` : `
        background-color: #f44336;
        color: #ffffff;
        &:hover:not(:disabled) {
          background-color: #e53935;
        }
        &:active:not(:disabled) {
          background-color: #c62828;
        }
      `
    };
    
    return sizeStyles[size] + variantStyles[variant];
  }}
`;

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  onClick,
  ...props
}) => {
  const { theme } = useAppSelector(state => state.ui);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    onClick?.(e);
  };

  return (
    <StyledButton
      variant={variant}
      size={size}
      theme={theme}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size={size} />
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </StyledButton>
  );
};

const SpinnerContainer = styled.div<{ size: ButtonSize }>`
  width: ${props => {
    switch (props.size) {
      case 'xs': return '12px';
      case 'sm': return '14px';
      case 'md': return '16px';
      case 'lg': return '20px';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'xs': return '12px';
      case 'sm': return '14px';
      case 'md': return '16px';
      case 'lg': return '20px';
    }
  }};
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingSpinner: React.FC<{ size: ButtonSize }> = ({ size }) => (
  <SpinnerContainer size={size} />
);