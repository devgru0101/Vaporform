import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { authSlice } from '@/store/auth';
import type { User } from '@shared/types';
import './UserMenu.css';

export interface UserMenuProps {
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSettings = () => {
    setIsOpen(false);
    navigate('/settings');
  };

  const handleLogout = () => {
    setIsOpen(false);
    dispatch(authSlice.actions.logout());
    navigate('/');
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`vf-user-menu ${className}`}>
      <button
        ref={buttonRef}
        className="vf-user-menu-trigger"
        onClick={handleToggleDropdown}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="User account menu"
      >
        <div className="vf-user-avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="vf-user-avatar-image" />
          ) : (
            <span className="vf-user-avatar-initials">
              {getInitials(user?.name || 'User')}
            </span>
          )}
        </div>
        <span className="vf-user-name">
          {user?.name || 'User'}
        </span>
        <svg
          className={`vf-user-menu-chevron ${isOpen ? 'open' : ''}`}
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="vf-user-menu-dropdown"
          role="menu"
          aria-labelledby="user-menu-button"
        >
          <div className="vf-user-menu-header">
            <div className="vf-user-info-expanded">
              <div className="vf-user-name-large">{user?.name || 'User'}</div>
              <div className="vf-user-email">{user?.email || ''}</div>
            </div>
          </div>

          <div className="vf-user-menu-divider" />

          <div className="vf-user-menu-items">
            <button
              className="vf-user-menu-item"
              onClick={handleSettings}
              role="menuitem"
            >
              <svg className="vf-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M20.46 20.46l-4.24-4.24M1.54 20.46l4.24-4.24"/>
              </svg>
              Settings
            </button>

            <button
              className="vf-user-menu-item vf-user-menu-item-danger"
              onClick={handleLogout}
              role="menuitem"
            >
              <svg className="vf-icon" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};