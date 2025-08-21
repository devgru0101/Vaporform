import { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../index';

const STORAGE_KEY = 'vaporform_app_state';

interface StorableState {
  ui: {
    theme: string;
    fontSize: number;
    fontFamily: string;
    layout: any;
    panels: any;
    shortcuts: any;
  };
  editor: {
    theme: string;
    fontSize: number;
    wordWrap: string;
    minimap: boolean;
    lineNumbers: string;
    autoSave: boolean;
    autoSaveDelay: number;
  };
  ai: {
    settings: any;
    conversations: any[];
  };
}

export const localStorageMiddleware: Middleware<{}, RootState> = store => next => action => {
  const result = next(action);
  
  // Actions that should trigger persistence
  const persistActions = [
    'ui/setTheme',
    'ui/setFontSize',
    'ui/setFontFamily',
    'ui/updatePanelDimensions',
    'ui/togglePanel',
    'ui/updateShortcuts',
    'editor/setTheme',
    'editor/setFontSize',
    'editor/setWordWrap',
    'editor/toggleMinimap',
    'editor/setLineNumbers',
    'editor/setAutoSave',
    'editor/setAutoSaveDelay',
    'ai/updateSettings',
    'ai/createConversation',
    'ai/updateConversation',
    'ai/deleteConversation',
    'auth/updateUser',
  ];

  if (persistActions.some(actionType => action.type.startsWith(actionType))) {
    const state = store.getState();
    
    try {
      const storableState: StorableState = {
        ui: {
          theme: state.ui.theme,
          fontSize: state.ui.fontSize,
          fontFamily: state.ui.fontFamily,
          layout: state.ui.layout,
          panels: state.ui.panels,
          shortcuts: state.ui.shortcuts,
        },
        editor: {
          theme: state.editor.theme,
          fontSize: state.editor.fontSize,
          wordWrap: state.editor.wordWrap,
          minimap: state.editor.minimap,
          lineNumbers: state.editor.lineNumbers,
          autoSave: state.editor.autoSave,
          autoSaveDelay: state.editor.autoSaveDelay,
        },
        ai: {
          settings: state.ai.settings,
          conversations: state.ai.conversations,
        },
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storableState));
    } catch (error) {
      console.warn('Failed to persist state to localStorage:', error);
    }
  }

  return result;
};

export const loadStoredState = (): Partial<RootState> | undefined => {
  try {
    const storedState = localStorage.getItem(STORAGE_KEY);
    if (!storedState) return undefined;

    const parsed: StorableState = JSON.parse(storedState);
    
    return {
      ui: {
        ...parsed.ui,
        // Reset modals and notifications on load
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
        breadcrumbs: [],
        isFullscreen: false,
        isZenMode: false,
        commandPaletteQuery: '',
        quickOpenQuery: '',
      } as any,
      editor: parsed.editor as any,
      ai: {
        ...parsed.ai,
        // Reset runtime state
        activeConversationId: parsed.ai.conversations.length > 0 ? parsed.ai.conversations[0].id : null,
        isLoading: false,
        isStreaming: false,
        error: null,
        suggestions: [],
        contextFiles: [],
      } as any,
    };
  } catch (error) {
    console.warn('Failed to load stored state from localStorage:', error);
    return undefined;
  }
};

export const clearStoredState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear stored state:', error);
  }
};