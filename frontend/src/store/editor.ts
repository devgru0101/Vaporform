import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { editor } from 'monaco-editor';
import type { FileNode } from '@shared/types';

interface EditorTab {
  id: string;
  filePath: string;
  fileName: string;
  content: string;
  isDirty: boolean;
  isActive: boolean;
  language: string;
  cursorPosition?: { line: number; column: number };
  scrollPosition?: { top: number; left: number };
}

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
  editorInstance: editor.IStandaloneCodeEditor | null;
  theme: 'dark' | 'light';
  fontSize: number;
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  autoSave: boolean;
  autoSaveDelay: number;
  searchText: string;
  isSearchVisible: boolean;
  isReplaceVisible: boolean;
  searchResults: Array<{ line: number; column: number; length: number }>;
  currentSearchIndex: number;
}

const initialState: EditorState = {
  tabs: [],
  activeTabId: null,
  editorInstance: null,
  theme: 'dark',
  fontSize: 14,
  wordWrap: 'on',
  minimap: true,
  lineNumbers: 'on',
  autoSave: true,
  autoSaveDelay: 2000,
  searchText: '',
  isSearchVisible: false,
  isReplaceVisible: false,
  searchResults: [],
  currentSearchIndex: 0,
};

export const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setEditorInstance: (state, action: PayloadAction<editor.IStandaloneCodeEditor | null>) => {
      state.editorInstance = action.payload;
    },
    openTab: (state, action: PayloadAction<{ file: FileNode; content: string }>) => {
      const { file, content } = action.payload;
      const existingTab = state.tabs.find(tab => tab.filePath === file.path);
      
      if (existingTab) {
        // Switch to existing tab
        state.tabs.forEach(tab => {
          tab.isActive = tab.id === existingTab.id;
        });
        state.activeTabId = existingTab.id;
      } else {
        // Create new tab
        const newTab: EditorTab = {
          id: `tab-${Date.now()}-${Math.random()}`,
          filePath: file.path,
          fileName: file.name,
          content,
          isDirty: false,
          isActive: true,
          language: getLanguageFromFileName(file.name),
        };
        
        // Deactivate all other tabs
        state.tabs.forEach(tab => {
          tab.isActive = false;
        });
        
        state.tabs.push(newTab);
        state.activeTabId = newTab.id;
      }
    },
    closeTab: (state, action: PayloadAction<string>) => {
      const tabIndex = state.tabs.findIndex(tab => tab.id === action.payload);
      if (tabIndex === -1) return;
      
      const closingTab = state.tabs[tabIndex];
      state.tabs.splice(tabIndex, 1);
      
      if (closingTab.isActive && state.tabs.length > 0) {
        // Activate the next tab or the previous one if it was the last
        const nextTab = state.tabs[Math.min(tabIndex, state.tabs.length - 1)];
        nextTab.isActive = true;
        state.activeTabId = nextTab.id;
      } else if (state.tabs.length === 0) {
        state.activeTabId = null;
      }
    },
    switchTab: (state, action: PayloadAction<string>) => {
      state.tabs.forEach(tab => {
        tab.isActive = tab.id === action.payload;
      });
      state.activeTabId = action.payload;
    },
    updateTabContent: (state, action: PayloadAction<{ tabId: string; content: string; isDirty?: boolean }>) => {
      const tab = state.tabs.find(tab => tab.id === action.payload.tabId);
      if (tab) {
        tab.content = action.payload.content;
        tab.isDirty = action.payload.isDirty ?? true;
      }
    },
    saveTab: (state, action: PayloadAction<string>) => {
      const tab = state.tabs.find(tab => tab.id === action.payload);
      if (tab) {
        tab.isDirty = false;
      }
    },
    updateTabPosition: (state, action: PayloadAction<{ tabId: string; cursorPosition?: { line: number; column: number }; scrollPosition?: { top: number; left: number } }>) => {
      const tab = state.tabs.find(tab => tab.id === action.payload.tabId);
      if (tab) {
        if (action.payload.cursorPosition) {
          tab.cursorPosition = action.payload.cursorPosition;
        }
        if (action.payload.scrollPosition) {
          tab.scrollPosition = action.payload.scrollPosition;
        }
      }
    },
    setTheme: (state, action: PayloadAction<'dark' | 'light'>) => {
      state.theme = action.payload;
    },
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = Math.max(8, Math.min(72, action.payload));
    },
    setWordWrap: (state, action: PayloadAction<typeof initialState.wordWrap>) => {
      state.wordWrap = action.payload;
    },
    toggleMinimap: (state) => {
      state.minimap = !state.minimap;
    },
    setLineNumbers: (state, action: PayloadAction<typeof initialState.lineNumbers>) => {
      state.lineNumbers = action.payload;
    },
    setAutoSave: (state, action: PayloadAction<boolean>) => {
      state.autoSave = action.payload;
    },
    setAutoSaveDelay: (state, action: PayloadAction<number>) => {
      state.autoSaveDelay = Math.max(500, Math.min(10000, action.payload));
    },
    setSearchText: (state, action: PayloadAction<string>) => {
      state.searchText = action.payload;
    },
    showSearch: (state, action: PayloadAction<boolean>) => {
      state.isSearchVisible = action.payload;
      if (!action.payload) {
        state.isReplaceVisible = false;
        state.searchResults = [];
        state.currentSearchIndex = 0;
      }
    },
    showReplace: (state, action: PayloadAction<boolean>) => {
      state.isReplaceVisible = action.payload;
      if (action.payload) {
        state.isSearchVisible = true;
      }
    },
    setSearchResults: (state, action: PayloadAction<Array<{ line: number; column: number; length: number }>>) => {
      state.searchResults = action.payload;
      state.currentSearchIndex = 0;
    },
    nextSearchResult: (state) => {
      if (state.searchResults.length > 0) {
        state.currentSearchIndex = (state.currentSearchIndex + 1) % state.searchResults.length;
      }
    },
    previousSearchResult: (state) => {
      if (state.searchResults.length > 0) {
        state.currentSearchIndex = state.currentSearchIndex === 0 
          ? state.searchResults.length - 1 
          : state.currentSearchIndex - 1;
      }
    },
    closeAllTabs: (state) => {
      state.tabs = [];
      state.activeTabId = null;
    },
    closeAllTabsExceptActive: (state) => {
      const activeTab = state.tabs.find(tab => tab.isActive);
      if (activeTab) {
        state.tabs = [activeTab];
      }
    },
  },
});

function getLanguageFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    fish: 'shell',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    env: 'plaintext',
    gitignore: 'plaintext',
    txt: 'plaintext',
  };
  
  return languageMap[extension || ''] || 'plaintext';
}

export const {
  setEditorInstance,
  openTab,
  closeTab,
  switchTab,
  updateTabContent,
  saveTab,
  updateTabPosition,
  setTheme,
  setFontSize,
  setWordWrap,
  toggleMinimap,
  setLineNumbers,
  setAutoSave,
  setAutoSaveDelay,
  setSearchText,
  showSearch,
  showReplace,
  setSearchResults,
  nextSearchResult,
  previousSearchResult,
  closeAllTabs,
  closeAllTabsExceptActive,
} = editorSlice.actions;