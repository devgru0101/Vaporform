import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PanelDimensions {
  width: number;
  height: number;
  isVisible: boolean;
  isMinimized: boolean;
}

interface UiState {
  theme: 'dark' | 'light' | 'auto';
  primaryColor: string;
  fontSize: number;
  fontFamily: string;
  layout: {
    leftSidebar: PanelDimensions;
    rightSidebar: PanelDimensions;
    bottomPanel: PanelDimensions;
    headerHeight: number;
    statusBarHeight: number;
  };
  panels: {
    fileExplorer: boolean;
    aiChat: boolean;
    projectPreview: boolean;
    terminal: boolean;
    problems: boolean;
    output: boolean;
    debugConsole: boolean;
    search: boolean;
    sourceControl: boolean;
    extensions: boolean;
  };
  modals: {
    settings: boolean;
    commandPalette: boolean;
    quickOpen: boolean;
    createFile: boolean;
    createFolder: boolean;
    renameFile: boolean;
    deleteConfirm: boolean;
    projectSettings: boolean;
    containerSettings: boolean;
    about: boolean;
  };
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    duration?: number;
    actions?: Array<{
      label: string;
      action: string;
    }>;
  }>;
  statusBar: {
    leftItems: Array<{
      id: string;
      text: string;
      tooltip?: string;
      priority: number;
    }>;
    rightItems: Array<{
      id: string;
      text: string;
      tooltip?: string;
      priority: number;
    }>;
  };
  breadcrumbs: Array<{
    label: string;
    path: string;
  }>;
  isFullscreen: boolean;
  isZenMode: boolean;
  sidebarPosition: 'left' | 'right';
  panelPosition: 'bottom' | 'right';
  activityBarVisible: boolean;
  commandPaletteQuery: string;
  quickOpenQuery: string;
  recentCommands: string[];
  shortcuts: Record<string, string>;
}

const initialState: UiState = {
  theme: 'dark',
  primaryColor: '#007acc',
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", consolas, monospace',
  layout: {
    leftSidebar: { width: 300, height: 0, isVisible: true, isMinimized: false },
    rightSidebar: { width: 400, height: 0, isVisible: true, isMinimized: false },
    bottomPanel: { width: 0, height: 200, isVisible: false, isMinimized: false },
    headerHeight: 35,
    statusBarHeight: 22,
  },
  panels: {
    fileExplorer: true,
    aiChat: true,
    projectPreview: true,
    terminal: false,
    problems: false,
    output: false,
    debugConsole: false,
    search: false,
    sourceControl: false,
    extensions: false,
  },
  modals: {
    settings: false,
    commandPalette: false,
    quickOpen: false,
    createFile: false,
    createFolder: false,
    renameFile: false,
    deleteConfirm: false,
    projectSettings: false,
    containerSettings: false,
    about: false,
  },
  notifications: [],
  statusBar: {
    leftItems: [],
    rightItems: [],
  },
  breadcrumbs: [],
  isFullscreen: false,
  isZenMode: false,
  sidebarPosition: 'left',
  panelPosition: 'bottom',
  activityBarVisible: true,
  commandPaletteQuery: '',
  quickOpenQuery: '',
  recentCommands: [],
  shortcuts: {
    'ctrl+p': 'quickOpen',
    'ctrl+shift+p': 'commandPalette',
    'ctrl+b': 'toggleSidebar',
    'ctrl+j': 'togglePanel',
    'ctrl+shift+e': 'showFileExplorer',
    'ctrl+shift+f': 'showSearch',
    'ctrl+shift+g': 'showSourceControl',
    'ctrl+shift+x': 'showExtensions',
    'ctrl+shift+y': 'showDebugConsole',
    'ctrl+shift+u': 'showOutput',
    'ctrl+shift+m': 'showProblems',
    'ctrl+`': 'showTerminal',
    'f11': 'toggleFullscreen',
    'ctrl+k z': 'toggleZenMode',
  },
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<typeof initialState.theme>) => {
      state.theme = action.payload;
    },
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.primaryColor = action.payload;
    },
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = Math.max(8, Math.min(72, action.payload));
    },
    setFontFamily: (state, action: PayloadAction<string>) => {
      state.fontFamily = action.payload;
    },
    updatePanelDimensions: (state, action: PayloadAction<{ panel: keyof typeof initialState.layout; dimensions: Partial<PanelDimensions> }>) => {
      const { panel, dimensions } = action.payload;
      if (panel in state.layout && typeof state.layout[panel] === 'object') {
        Object.assign(state.layout[panel], dimensions);
      }
    },
    togglePanel: (state, action: PayloadAction<keyof typeof initialState.panels>) => {
      state.panels[action.payload] = !state.panels[action.payload];
    },
    showPanel: (state, action: PayloadAction<keyof typeof initialState.panels>) => {
      state.panels[action.payload] = true;
    },
    hidePanel: (state, action: PayloadAction<keyof typeof initialState.panels>) => {
      state.panels[action.payload] = false;
    },
    openModal: (state, action: PayloadAction<keyof typeof initialState.modals>) => {
      // Close all other modals first
      Object.keys(state.modals).forEach(key => {
        state.modals[key as keyof typeof state.modals] = false;
      });
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof typeof initialState.modals>) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key as keyof typeof state.modals] = false;
      });
    },
    addNotification: (state, action: PayloadAction<Omit<typeof initialState.notifications[0], 'id' | 'timestamp'>>) => {
      const notification = {
        ...action.payload,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    updateStatusBarItem: (state, action: PayloadAction<{ side: 'left' | 'right'; item: typeof initialState.statusBar.leftItems[0] }>) => {
      const items = action.payload.side === 'left' ? state.statusBar.leftItems : state.statusBar.rightItems;
      const existingIndex = items.findIndex(item => item.id === action.payload.item.id);
      
      if (existingIndex !== -1) {
        items[existingIndex] = action.payload.item;
      } else {
        items.push(action.payload.item);
        items.sort((a, b) => b.priority - a.priority);
      }
    },
    removeStatusBarItem: (state, action: PayloadAction<{ side: 'left' | 'right'; id: string }>) => {
      const items = action.payload.side === 'left' ? state.statusBar.leftItems : state.statusBar.rightItems;
      const index = items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        items.splice(index, 1);
      }
    },
    setBreadcrumbs: (state, action: PayloadAction<typeof initialState.breadcrumbs>) => {
      state.breadcrumbs = action.payload;
    },
    toggleFullscreen: (state) => {
      state.isFullscreen = !state.isFullscreen;
    },
    toggleZenMode: (state) => {
      state.isZenMode = !state.isZenMode;
      if (state.isZenMode) {
        state.activityBarVisible = false;
        state.layout.leftSidebar.isVisible = false;
        state.layout.rightSidebar.isVisible = false;
        state.layout.bottomPanel.isVisible = false;
      }
    },
    setSidebarPosition: (state, action: PayloadAction<typeof initialState.sidebarPosition>) => {
      state.sidebarPosition = action.payload;
    },
    setPanelPosition: (state, action: PayloadAction<typeof initialState.panelPosition>) => {
      state.panelPosition = action.payload;
    },
    toggleActivityBar: (state) => {
      state.activityBarVisible = !state.activityBarVisible;
    },
    setCommandPaletteQuery: (state, action: PayloadAction<string>) => {
      state.commandPaletteQuery = action.payload;
    },
    setQuickOpenQuery: (state, action: PayloadAction<string>) => {
      state.quickOpenQuery = action.payload;
    },
    addRecentCommand: (state, action: PayloadAction<string>) => {
      state.recentCommands = [
        action.payload,
        ...state.recentCommands.filter(cmd => cmd !== action.payload),
      ].slice(0, 10);
    },
    updateShortcuts: (state, action: PayloadAction<Record<string, string>>) => {
      state.shortcuts = { ...state.shortcuts, ...action.payload };
    },
    resetLayout: (state) => {
      state.layout = initialState.layout;
      state.panels = initialState.panels;
      state.isZenMode = false;
      state.isFullscreen = false;
      state.activityBarVisible = true;
    },
  },
});

export const {
  setTheme,
  setPrimaryColor,
  setFontSize,
  setFontFamily,
  updatePanelDimensions,
  togglePanel,
  showPanel,
  hidePanel,
  openModal,
  closeModal,
  closeAllModals,
  addNotification,
  removeNotification,
  clearNotifications,
  updateStatusBarItem,
  removeStatusBarItem,
  setBreadcrumbs,
  toggleFullscreen,
  toggleZenMode,
  setSidebarPosition,
  setPanelPosition,
  toggleActivityBar,
  setCommandPaletteQuery,
  setQuickOpenQuery,
  addRecentCommand,
  updateShortcuts,
  resetLayout,
} = uiSlice.actions;