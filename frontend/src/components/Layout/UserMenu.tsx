import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { authSlice } from '@/store/auth';
import { useAuthService } from '@/services/auth';
import type { User } from '@shared/types';

const UserMenuContainer = styled.div`
  position: relative;
`;

const UserButton = styled.button<{ theme: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#666666'};
  font-size: 14px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#3e3e42' : '#e8e8e8'};
  }
`;

const Avatar = styled.div<{ theme: string }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${props => props.theme === 'dark' ? '#007acc' : '#1976d2'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
`;

const UserName = styled.span`
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Dropdown = styled.div<{ theme: string; isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 200px;
  background-color: ${props => props.theme === 'dark' ? '#2d2d30' : '#ffffff'};
  border: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e0e0e0'};
  border-radius: 6px;
  box-shadow: ${props => props.theme === 'dark' 
    ? '0 4px 12px rgba(0, 0, 0, 0.4)'
    : '0 4px 12px rgba(0, 0, 0, 0.15)'
  };
  padding: 8px 0;
  margin-top: 4px;
  z-index: 1000;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.isOpen ? 'translateY(0)' : 'translateY(-4px)'};
  transition: all 0.2s ease;
`;

const DropdownItem = styled.button<{ theme: string }>`
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#333333'};
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#3e3e42' : '#f0f0f0'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DropdownSeparator = styled.div<{ theme: string }>`
  height: 1px;
  background-color: ${props => props.theme === 'dark' ? '#3e3e42' : '#e0e0e0'};
  margin: 4px 0;
`;

const UserInfo = styled.div<{ theme: string }>`
  padding: 8px 16px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e0e0e0'};
  margin-bottom: 4px;
`;

const UserInfoName = styled.div<{ theme: string }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#000000'};
  margin-bottom: 2px;
`;

const UserInfoEmail = styled.div<{ theme: string }>`
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#a0a0a0' : '#666666'};
`;

interface UserMenuProps {
  user: User | null;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const dispatch = useAppDispatch();
  const authService = useAuthService();
  const { theme } = useAppSelector(state => state.ui);
  
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem('vaporform_token');
    if (token) {
      await authService.logout(token);
      localStorage.removeItem('vaporform_token');
    }
    dispatch(authSlice.actions.logout());
    setIsOpen(false);
  };

  const handleSettings = () => {
    // TODO: Navigate to settings
    console.log('Open settings');
    setIsOpen(false);
  };

  const handleProfile = () => {
    // TODO: Navigate to profile
    console.log('Open profile');
    setIsOpen(false);
  };

  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <UserMenuContainer ref={menuRef}>
      <UserButton
        theme={theme}
        onClick={() => setIsOpen(!isOpen)}
        title={`${user.name} (${user.email})`}
      >
        <Avatar theme={theme}>
          {getInitials(user.name)}
        </Avatar>
        <UserName>{user.name}</UserName>
      </UserButton>

      <Dropdown theme={theme} isOpen={isOpen}>
        <UserInfo theme={theme}>
          <UserInfoName theme={theme}>{user.name}</UserInfoName>
          <UserInfoEmail theme={theme}>{user.email}</UserInfoEmail>
        </UserInfo>

        <DropdownItem theme={theme} onClick={handleProfile}>
          Profile
        </DropdownItem>
        
        <DropdownItem theme={theme} onClick={handleSettings}>
          Settings
        </DropdownItem>
        
        <DropdownSeparator theme={theme} />
        
        <DropdownItem theme={theme} onClick={handleLogout}>
          Sign Out
        </DropdownItem>
      </Dropdown>
    </UserMenuContainer>
  );
};