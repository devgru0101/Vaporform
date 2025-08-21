import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FileNode } from '@shared/types';

interface FileSystemState {
  tree: FileNode | null;
  expandedFolders: Set<string>;
  selectedFile: string | null;
  clipboardFiles: string[];
  clipboardAction: 'copy' | 'cut' | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  searchResults: FileNode[];
  isSearching: boolean;
  fileHistory: string[];
  maxHistorySize: number;
  viewMode: 'tree' | 'flat';
  sortBy: 'name' | 'type' | 'size' | 'modified';
  sortOrder: 'asc' | 'desc';
  showHiddenFiles: boolean;
  fileFilters: string[];
}

const initialState: FileSystemState = {
  tree: null,
  expandedFolders: new Set(),
  selectedFile: null,
  clipboardFiles: [],
  clipboardAction: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  fileHistory: [],
  maxHistorySize: 50,
  viewMode: 'tree',
  sortBy: 'name',
  sortOrder: 'asc',
  showHiddenFiles: false,
  fileFilters: [],
};

export const fileSystemSlice = createSlice({
  name: 'fileSystem',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setFileTree: (state, action: PayloadAction<FileNode>) => {
      state.tree = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    updateFileNode: (state, action: PayloadAction<{ path: string; updates: Partial<FileNode> }>) => {
      if (!state.tree) return;
      
      const updateNode = (node: FileNode): FileNode => {
        if (node.path === action.payload.path) {
          return { ...node, ...action.payload.updates };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(updateNode),
          };
        }
        return node;
      };
      
      state.tree = updateNode(state.tree);
    },
    addFileNode: (state, action: PayloadAction<{ parentPath: string; node: FileNode }>) => {
      if (!state.tree) return;
      
      const addNode = (node: FileNode): FileNode => {
        if (node.path === action.payload.parentPath && node.children) {
          const newChildren = [...node.children, action.payload.node];
          return {
            ...node,
            children: newChildren.sort((a, b) => {
              // Folders first, then files, then by name
              if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
              }
              return a.name.localeCompare(b.name);
            }),
          };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(addNode),
          };
        }
        return node;
      };
      
      state.tree = addNode(state.tree);
    },
    removeFileNode: (state, action: PayloadAction<string>) => {
      if (!state.tree) return;
      
      const removeNode = (node: FileNode): FileNode | null => {
        if (node.path === action.payload.path) {
          return null;
        }
        if (node.children) {
          const filteredChildren = node.children
            .map(removeNode)
            .filter((child): child is FileNode => child !== null);
          return { ...node, children: filteredChildren };
        }
        return node;
      };
      
      const result = removeNode(state.tree);
      if (result) {
        state.tree = result;
      }
    },
    toggleFolder: (state, action: PayloadAction<string>) => {
      const path = action.payload;
      const newSet = new Set(state.expandedFolders);
      
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      
      state.expandedFolders = newSet;
    },
    expandFolder: (state, action: PayloadAction<string>) => {
      state.expandedFolders = new Set([...state.expandedFolders, action.payload]);
    },
    collapseFolder: (state, action: PayloadAction<string>) => {
      const newSet = new Set(state.expandedFolders);
      newSet.delete(action.payload);
      state.expandedFolders = newSet;
    },
    collapseAllFolders: (state) => {
      state.expandedFolders = new Set();
    },
    setSelectedFile: (state, action: PayloadAction<string | null>) => {
      if (action.payload && action.payload !== state.selectedFile) {
        // Add to history
        state.fileHistory = [
          action.payload,
          ...state.fileHistory.filter(path => path !== action.payload),
        ].slice(0, state.maxHistorySize);
      }
      state.selectedFile = action.payload;
    },
    copyFiles: (state, action: PayloadAction<string[]>) => {
      state.clipboardFiles = action.payload;
      state.clipboardAction = 'copy';
    },
    cutFiles: (state, action: PayloadAction<string[]>) => {
      state.clipboardFiles = action.payload;
      state.clipboardAction = 'cut';
    },
    clearClipboard: (state) => {
      state.clipboardFiles = [];
      state.clipboardAction = null;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSearchResults: (state, action: PayloadAction<FileNode[]>) => {
      state.searchResults = action.payload;
      state.isSearching = false;
    },
    setSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.isSearching = false;
    },
    setViewMode: (state, action: PayloadAction<typeof initialState.viewMode>) => {
      state.viewMode = action.payload;
    },
    setSorting: (state, action: PayloadAction<{ sortBy: typeof initialState.sortBy; sortOrder: typeof initialState.sortOrder }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    toggleHiddenFiles: (state) => {
      state.showHiddenFiles = !state.showHiddenFiles;
    },
    setFileFilters: (state, action: PayloadAction<string[]>) => {
      state.fileFilters = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isSearching = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetFileSystem: (state) => {
      state.tree = null;
      state.expandedFolders = new Set();
      state.selectedFile = null;
      state.clipboardFiles = [];
      state.clipboardAction = null;
      state.searchQuery = '';
      state.searchResults = [];
      state.isSearching = false;
      state.error = null;
      state.isLoading = false;
    },
  },
});

export const {
  setLoading,
  setFileTree,
  updateFileNode,
  addFileNode,
  removeFileNode,
  toggleFolder,
  expandFolder,
  collapseFolder,
  collapseAllFolders,
  setSelectedFile,
  copyFiles,
  cutFiles,
  clearClipboard,
  setSearchQuery,
  setSearchResults,
  setSearching,
  clearSearch,
  setViewMode,
  setSorting,
  toggleHiddenFiles,
  setFileFilters,
  setError,
  clearError,
  resetFileSystem,
} = fileSystemSlice.actions;