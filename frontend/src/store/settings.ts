import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// User Profile Settings
interface UserProfileSettings {
  displayName: string;
  email: string;
  avatar: string;
  timezone: string;
  language: string;
}

// Theme & Appearance Settings
interface ThemeSettings {
  theme: 'dark' | 'light' | 'auto';
  primaryColor: string;
  accentColor: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  iconSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animations: boolean;
}

// Editor Settings
interface EditorSettings {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  tabSize: number;
  indentType: 'spaces' | 'tabs';
  wordWrap: 'off' | 'on' | 'bounded';
  lineNumbers: boolean;
  minimap: boolean;
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'all';
  autoSave: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange';
  autoSaveDelay: number;
  bracketMatching: boolean;
  folding: boolean;
  highlightActiveLineGutter: boolean;
  highlightCurrentLine: boolean;
  renderControlCharacters: boolean;
  smoothScrolling: boolean;
  mouseWheelZoom: boolean;
}

// AI Assistant Configuration
interface AiSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  autoSuggestions: boolean;
  contextSensitive: boolean;
  codeGeneration: boolean;
  documentationGeneration: boolean;
  testGeneration: boolean;
  conversationHistory: boolean;
  streamingResponse: boolean;
  maxConversations: number;
}

// Collaboration Settings
interface CollaborationSettings {
  realTimeCollaboration: boolean;
  showPresenceIndicators: boolean;
  showCursors: boolean;
  notifyOnJoin: boolean;
  notifyOnLeave: boolean;
  notifyOnEdit: boolean;
  sharePermissions: 'read' | 'write' | 'admin';
  allowGuests: boolean;
  requireAuthentication: boolean;
}

// Development Environment Settings
interface DevEnvironmentSettings {
  autoBuild: boolean;
  buildOnSave: boolean;
  hotReload: boolean;
  liveReload: boolean;
  sourceMaps: boolean;
  minifyOutput: boolean;
  watchMode: boolean;
  parallelBuilds: boolean;
  buildTimeout: number;
  maxBuildRetries: number;
}

// Terminal Preferences
interface TerminalSettings {
  defaultShell: string;
  fontSize: number;
  fontFamily: string;
  cursorStyle: 'block' | 'line' | 'underline';
  cursorBlink: boolean;
  scrollback: number;
  closeOnExit: boolean;
  confirmOnKill: boolean;
  bellSound: boolean;
  rightClickSelect: boolean;
}

// Security & Privacy Settings
interface SecuritySettings {
  sessionTimeout: number; // in minutes
  twoFactorAuth: boolean;
  biometricAuth: boolean;
  rememberMe: boolean;
  autoLock: boolean;
  autoLockDelay: number; // in minutes
  encryptLocalData: boolean;
  clearHistoryOnLogout: boolean;
  allowTelemetry: boolean;
  shareUsageData: boolean;
  logSecurityEvents: boolean;
}

// Performance Settings
interface PerformanceSettings {
  enableCache: boolean;
  cacheSize: number; // in MB
  preloadFiles: boolean;
  lazyLoadComponents: boolean;
  enableVirtualization: boolean;
  backgroundProcessing: boolean;
  maxMemoryUsage: number; // in MB
  enableCompression: boolean;
  networkOptimization: boolean;
  debounceDelay: number; // in ms
}

// Integration Settings
interface IntegrationSettings {
  githubIntegration: boolean;
  githubToken: string;
  dockerIntegration: boolean;
  kubernetesIntegration: boolean;
  webhookUrl: string;
  slackNotifications: boolean;
  emailNotifications: boolean;
  customApiEndpoints: string[];
  thirdPartyServices: Record<string, boolean>;
}

// Notification Settings
interface NotificationSettings {
  enableNotifications: boolean;
  buildNotifications: boolean;
  errorNotifications: boolean;
  collaborationNotifications: boolean;
  systemNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  notificationDuration: number; // in seconds
  notificationPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// Advanced Settings
interface AdvancedSettings {
  debugMode: boolean;
  verboseLogging: boolean;
  experimentalFeatures: boolean;
  betaTesting: boolean;
  developerMode: boolean;
  featureFlags: Record<string, boolean>;
  customCSS: string;
  customJS: string;
  apiRateLimit: number;
  maxConcurrentRequests: number;
}

// Main Settings State
interface SettingsState {
  userProfile: UserProfileSettings;
  theme: ThemeSettings;
  editor: EditorSettings;
  ai: AiSettings;
  collaboration: CollaborationSettings;
  devEnvironment: DevEnvironmentSettings;
  terminal: TerminalSettings;
  security: SecuritySettings;
  performance: PerformanceSettings;
  integrations: IntegrationSettings;
  notifications: NotificationSettings;
  advanced: AdvancedSettings;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  lastSaved: string | null;
}

const initialState: SettingsState = {
  userProfile: {
    displayName: '',
    email: '',
    avatar: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en',
  },
  theme: {
    theme: 'dark',
    primaryColor: '#CAC4B7',
    accentColor: '#F6EEE3',
    fontSize: 13,
    fontFamily: 'Inter, system-ui, sans-serif',
    lineHeight: 1.5,
    iconSize: 'medium',
    compactMode: false,
    animations: true,
  },
  editor: {
    fontFamily: 'JetBrains Mono, Fira Code, monospace',
    fontSize: 14,
    lineHeight: 1.5,
    tabSize: 2,
    indentType: 'spaces',
    wordWrap: 'off',
    lineNumbers: true,
    minimap: true,
    renderWhitespace: 'boundary',
    autoSave: 'afterDelay',
    autoSaveDelay: 1000,
    bracketMatching: true,
    folding: true,
    highlightActiveLineGutter: true,
    highlightCurrentLine: true,
    renderControlCharacters: false,
    smoothScrolling: true,
    mouseWheelZoom: true,
  },
  ai: {
    model: 'claude-3-sonnet',
    temperature: 0.7,
    maxTokens: 4096,
    contextWindow: 200000,
    autoSuggestions: true,
    contextSensitive: true,
    codeGeneration: true,
    documentationGeneration: true,
    testGeneration: true,
    conversationHistory: true,
    streamingResponse: true,
    maxConversations: 50,
  },
  collaboration: {
    realTimeCollaboration: true,
    showPresenceIndicators: true,
    showCursors: true,
    notifyOnJoin: true,
    notifyOnLeave: false,
    notifyOnEdit: false,
    sharePermissions: 'write',
    allowGuests: false,
    requireAuthentication: true,
  },
  devEnvironment: {
    autoBuild: true,
    buildOnSave: false,
    hotReload: true,
    liveReload: true,
    sourceMaps: true,
    minifyOutput: false,
    watchMode: true,
    parallelBuilds: true,
    buildTimeout: 300,
    maxBuildRetries: 3,
  },
  terminal: {
    defaultShell: '/bin/bash',
    fontSize: 12,
    fontFamily: 'JetBrains Mono, monospace',
    cursorStyle: 'block',
    cursorBlink: true,
    scrollback: 1000,
    closeOnExit: false,
    confirmOnKill: true,
    bellSound: false,
    rightClickSelect: true,
  },
  security: {
    sessionTimeout: 480, // 8 hours
    twoFactorAuth: false,
    biometricAuth: false,
    rememberMe: true,
    autoLock: false,
    autoLockDelay: 30,
    encryptLocalData: true,
    clearHistoryOnLogout: false,
    allowTelemetry: true,
    shareUsageData: false,
    logSecurityEvents: true,
  },
  performance: {
    enableCache: true,
    cacheSize: 100,
    preloadFiles: true,
    lazyLoadComponents: true,
    enableVirtualization: true,
    backgroundProcessing: true,
    maxMemoryUsage: 512,
    enableCompression: true,
    networkOptimization: true,
    debounceDelay: 300,
  },
  integrations: {
    githubIntegration: false,
    githubToken: '',
    dockerIntegration: true,
    kubernetesIntegration: false,
    webhookUrl: '',
    slackNotifications: false,
    emailNotifications: false,
    customApiEndpoints: [],
    thirdPartyServices: {},
  },
  notifications: {
    enableNotifications: true,
    buildNotifications: true,
    errorNotifications: true,
    collaborationNotifications: true,
    systemNotifications: true,
    emailNotifications: false,
    pushNotifications: false,
    soundEnabled: false,
    notificationDuration: 5,
    notificationPosition: 'top-right',
  },
  advanced: {
    debugMode: false,
    verboseLogging: false,
    experimentalFeatures: false,
    betaTesting: false,
    developerMode: false,
    featureFlags: {},
    customCSS: '',
    customJS: '',
    apiRateLimit: 100,
    maxConcurrentRequests: 10,
  },
  isLoading: false,
  error: null,
  hasUnsavedChanges: false,
  lastSaved: null,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // User Profile Settings
    updateUserProfile: (state, action: PayloadAction<Partial<UserProfileSettings>>) => {
      state.userProfile = { ...state.userProfile, ...action.payload };
      state.hasUnsavedChanges = true;
    },

    // Theme Settings
    updateTheme: (state, action: PayloadAction<Partial<ThemeSettings>>) => {
      state.theme = { ...state.theme, ...action.payload };
      state.hasUnsavedChanges = true;
    },

    // Editor Settings
    updateEditor: (state, action: PayloadAction<Partial<EditorSettings>>) => {
      state.editor = { ...state.editor, ...action.payload };
      state.hasUnsavedChanges = true;
    },

    // AI Settings
    updateAi: (state, action: PayloadAction<Partial<AiSettings>>) => {
      state.ai = { ...state.ai, ...action.payload };
      state.hasUnsavedChanges = true;
    },

    // Collaboration Settings
    updateCollaboration: (state, action: PayloadAction<Partial<CollaborationSettings>>) => {
      state.collaboration = { ...state.collaboration, ...action.payload };
      state.hasUnsavedChanges = true;
    },

    // Development Environment Settings
    updateDevEnvironment: (state, action: PayloadAction<Partial<DevEnvironmentSettings>>) => {
      state.devEnvironment = { ...state.devEnvironment, ...action.payload };
      state.hasUnsavedChanges = true;
    },

    // Terminal Settings
    updateTerminal: (state, action: PayloadAction<Partial<TerminalSettings>>) => {
      state.terminal = { ...state.terminal, ...action.payload };
      state.hasUnsavedChanges = true;
    },

    // Security Settings
    updateSecurity: (state, action: PayloadAction<Partial<SecuritySettings>>) => {
      state.security = { ...state.security, ...action.payload };
      state.hasUnsavedChanges = true;
    },

    // Performance Settings
    updatePerformance: (state, action: PayloadAction<Partial<PerformanceSettings>>) => {
      state.performance = { ...state.performance, ...action.payload };
      state.hasUnsavedChanges = true;
    },

    // Integration Settings
    updateIntegrations: (state, action: PayloadAction<Partial<IntegrationSettings>>) => {
      state.integrations = { ...state.integrations, ...action.payload };
      state.hasUnsavedChanges = true;
    },

    // Notification Settings
    updateNotifications: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
      state.hasUnsavedChanges = true;
    },

    // Advanced Settings
    updateAdvanced: (state, action: PayloadAction<Partial<AdvancedSettings>>) => {
      state.advanced = { ...state.advanced, ...action.payload };
      state.hasUnsavedChanges = true;
    },

    // Bulk update for specific section
    updateSection: (state, action: PayloadAction<{ section: keyof Omit<SettingsState, 'isLoading' | 'error' | 'hasUnsavedChanges' | 'lastSaved'>; data: any }>) => {
      const { section, data } = action.payload;
      state[section] = { ...state[section], ...data };
      state.hasUnsavedChanges = true;
    },

    // Reset specific section to defaults
    resetSection: (state, action: PayloadAction<keyof Omit<SettingsState, 'isLoading' | 'error' | 'hasUnsavedChanges' | 'lastSaved'>>) => {
      const section = action.payload;
      state[section] = initialState[section];
      state.hasUnsavedChanges = true;
    },

    // Reset all settings to defaults
    resetAllSettings: (state) => {
      Object.keys(initialState).forEach(key => {
        if (key !== 'isLoading' && key !== 'error' && key !== 'hasUnsavedChanges' && key !== 'lastSaved') {
          (state as any)[key] = (initialState as any)[key];
        }
      });
      state.hasUnsavedChanges = true;
    },

    // Save settings
    saveSettingsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    saveSettingsSuccess: (state) => {
      state.isLoading = false;
      state.hasUnsavedChanges = false;
      state.lastSaved = new Date().toISOString();
      state.error = null;
    },

    saveSettingsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Load settings
    loadSettingsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    loadSettingsSuccess: (state, action: PayloadAction<Partial<SettingsState>>) => {
      Object.assign(state, action.payload);
      state.isLoading = false;
      state.hasUnsavedChanges = false;
      state.error = null;
    },

    loadSettingsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Mark as saved (for auto-save)
    markAsSaved: (state) => {
      state.hasUnsavedChanges = false;
      state.lastSaved = new Date().toISOString();
    },

    // Apply theme to UI state
    applyThemeToUI: (state) => {
      // This will be handled by middleware to sync with UI slice
    },
  },
});

export const {
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
  updateSection,
  resetSection,
  resetAllSettings,
  saveSettingsStart,
  saveSettingsSuccess,
  saveSettingsFailure,
  loadSettingsStart,
  loadSettingsSuccess,
  loadSettingsFailure,
  clearError,
  markAsSaved,
  applyThemeToUI,
} = settingsSlice.actions;

export default settingsSlice.reducer;

// Export types for components
export type {
  SettingsState,
  UserProfileSettings,
  ThemeSettings,
  EditorSettings,
  AiSettings,
  CollaborationSettings,
  DevEnvironmentSettings,
  TerminalSettings,
  SecuritySettings,
  PerformanceSettings,
  IntegrationSettings,
  NotificationSettings,
  AdvancedSettings,
};