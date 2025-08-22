import React, { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { closeModal } from '@/store/ui';
import { 
  updateUserProfile, 
  updateTheme, 
  updateEditor, 
  updateAi, 
  updateCollaboration, 
  updateDevEnvironment, 
  updateTerminal, 
  updateSecurity, 
  updatePerformance, 
  updateIntegrations, 
  updateNotifications, 
  updateAdvanced,
  resetAllSettings,
  saveSettingsStart,
  saveSettingsSuccess,
  saveSettingsFailure,
  clearError
} from '@/store/settings';
import { Button } from '@/components/ui/Button';
import { 
  UserIcon, 
  PaletteIcon, 
  CodeIcon, 
  RobotIcon, 
  TeamIcon, 
  SettingsIcon, 
  TerminalIcon, 
  LockIcon, 
  SpeedIcon, 
  LinkIcon, 
  NotificationIcon, 
  ToolsIcon,
  CloseIcon
} from '@/components/ui/Icons';
import { UserProfileSection } from './sections/UserProfileSection';
import { ThemeSection } from './sections/ThemeSection';
import { EditorSection } from './sections/EditorSection';
import { AiSection } from './sections/AiSection';
import { CollaborationSection } from './sections/CollaborationSection';
import { DevEnvironmentSection } from './sections/DevEnvironmentSection';
import { TerminalSection } from './sections/TerminalSection';
import { SecuritySection } from './sections/SecuritySection';
import { PerformanceSection } from './sections/PerformanceSection';
import { IntegrationsSection } from './sections/IntegrationsSection';
import { NotificationsSection } from './sections/NotificationsSection';
import { AdvancedSection } from './sections/AdvancedSection';
import './SettingsModal.css';

type SettingsCategory = 
  | 'userProfile' 
  | 'theme' 
  | 'editor' 
  | 'ai' 
  | 'collaboration' 
  | 'devEnvironment' 
  | 'terminal' 
  | 'security' 
  | 'performance' 
  | 'integrations' 
  | 'notifications' 
  | 'advanced';

interface SettingsCategoryInfo {
  id: SettingsCategory;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}

const SETTINGS_CATEGORIES: SettingsCategoryInfo[] = [
  {
    id: 'userProfile',
    label: 'User Profile',
    icon: UserIcon,
    description: 'Personal information and preferences'
  },
  {
    id: 'theme',
    label: 'Appearance',
    icon: PaletteIcon,
    description: 'Theme and visual customization'
  },
  {
    id: 'editor',
    label: 'Editor',
    icon: CodeIcon,
    description: 'Code editor settings and preferences'
  },
  {
    id: 'ai',
    label: 'AI Assistant',
    icon: RobotIcon,
    description: 'AI model configuration and behavior'
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    icon: TeamIcon,
    description: 'Real-time collaboration settings'
  },
  {
    id: 'devEnvironment',
    label: 'Development',
    icon: SettingsIcon,
    description: 'Build and development environment'
  },
  {
    id: 'terminal',
    label: 'Terminal',
    icon: TerminalIcon,
    description: 'Terminal preferences and behavior'
  },
  {
    id: 'security',
    label: 'Security',
    icon: LockIcon,
    description: 'Authentication and privacy settings'
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: SpeedIcon,
    description: 'Cache and optimization settings'
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: LinkIcon,
    description: 'Third-party services and APIs'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: NotificationIcon,
    description: 'Alert and notification preferences'
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: ToolsIcon,
    description: 'Debug and experimental features'
  }
];

export const SettingsModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { modals } = useAppSelector(state => state.ui);
  const settings = useAppSelector(state => state.settings);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('userProfile');
  const [searchQuery, setSearchQuery] = useState('');

  const isOpen = modals.settings;

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Filter categories based on search query
  const filteredCategories = SETTINGS_CATEGORIES.filter(category =>
    category.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClose = useCallback(() => {
    if (settings.hasUnsavedChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!confirmClose) return;
    }
    dispatch(closeModal('settings'));
  }, [dispatch, settings.hasUnsavedChanges]);

  const handleSave = useCallback(async () => {
    try {
      dispatch(saveSettingsStart());
      
      // Here you would typically make an API call to save settings
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage as fallback
      try {
        const settingsToSave = {
          userProfile: settings.userProfile,
          theme: settings.theme,
          editor: settings.editor,
          ai: settings.ai,
          collaboration: settings.collaboration,
          devEnvironment: settings.devEnvironment,
          terminal: settings.terminal,
          security: settings.security,
          performance: settings.performance,
          integrations: settings.integrations,
          notifications: settings.notifications,
          advanced: settings.advanced
        };
        localStorage.setItem('vaporform_settings', JSON.stringify(settingsToSave));
      } catch (error) {
        console.warn('Failed to save settings to localStorage:', error);
      }
      
      dispatch(saveSettingsSuccess());
    } catch (error) {
      dispatch(saveSettingsFailure('Failed to save settings. Please try again.'));
    }
  }, [dispatch, settings]);

  const handleReset = useCallback(() => {
    const confirmReset = window.confirm(
      'This will reset all settings to their default values. Are you sure you want to continue?'
    );
    if (confirmReset) {
      dispatch(resetAllSettings());
    }
  }, [dispatch]);

  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  const renderSettingsContent = () => {
    switch (activeCategory) {
      case 'userProfile':
        return <UserProfileSection />;
      case 'theme':
        return <ThemeSection />;
      case 'editor':
        return <EditorSection />;
      case 'ai':
        return <AiSection />;
      case 'collaboration':
        return <CollaborationSection />;
      case 'devEnvironment':
        return <DevEnvironmentSection />;
      case 'terminal':
        return <TerminalSection />;
      case 'security':
        return <SecuritySection />;
      case 'performance':
        return <PerformanceSection />;
      case 'integrations':
        return <IntegrationsSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'advanced':
        return <AdvancedSection />;
      default:
        return <div className="vf-settings-error">Category not found</div>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="vf-settings-overlay" onClick={handleBackdropClick}>
      <div className="vf-settings-modal" role="dialog" aria-labelledby="settings-title" aria-modal="true">
        {/* Header */}
        <div className="vf-settings-header">
          <div className="vf-settings-title-section">
            <h1 id="settings-title" className="vf-settings-title">
              SETTINGS
            </h1>
            <p className="vf-settings-subtitle">
              Configure your Vaporform experience
            </p>
          </div>
          
          <div className="vf-settings-header-actions">
            {settings.hasUnsavedChanges && (
              <span className="vf-settings-unsaved-indicator">
                UNSAVED CHANGES
              </span>
            )}
            <Button
              variant="ghost"
              onClick={handleClose}
              aria-label="Close settings"
              className="vf-settings-close-btn"
            >
              <CloseIcon size={18} />
            </Button>
          </div>
        </div>

        <div className="vf-settings-content">
          {/* Sidebar */}
          <div className="vf-settings-sidebar">
            <div className="vf-settings-search">
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="vf-settings-search-input"
                aria-label="Search settings"
              />
            </div>

            <nav className="vf-settings-nav" role="navigation" aria-label="Settings categories">
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`vf-settings-nav-item ${
                    activeCategory === category.id ? 'active' : ''
                  }`}
                  aria-current={activeCategory === category.id ? 'page' : undefined}
                >
                  <span className="vf-settings-nav-icon">
                    <category.icon size={20} />
                  </span>
                  <div className="vf-settings-nav-content">
                    <span className="vf-settings-nav-label">{category.label}</span>
                    <span className="vf-settings-nav-description">{category.description}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="vf-settings-main">
            <div className="vf-settings-section-content">
              {settings.error && (
                <div className="vf-settings-error-banner">
                  <span className="vf-settings-error-text">{settings.error}</span>
                  <Button
                    variant="ghost"
                    onClick={() => dispatch(clearError())}
                    className="vf-settings-error-close"
                  >
                    <CloseIcon size={16} />
                  </Button>
                </div>
              )}
              
              {renderSettingsContent()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="vf-settings-footer">
          <div className="vf-settings-footer-info">
            {settings.lastSaved && (
              <span className="vf-settings-last-saved">
                Last saved: {new Date(settings.lastSaved).toLocaleString()}
              </span>
            )}
          </div>
          
          <div className="vf-settings-footer-actions">
            <Button
              variant="ghost"
              onClick={handleReset}
              disabled={settings.isLoading}
            >
              RESET TO DEFAULTS
            </Button>
            
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={settings.isLoading}
            >
              CANCEL
            </Button>
            
            <Button
              variant="primary"
              onClick={handleSave}
              loading={settings.isLoading}
              disabled={!settings.hasUnsavedChanges}
            >
              SAVE CHANGES
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};