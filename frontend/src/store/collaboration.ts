import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@shared/types';

interface CollaborationUser extends User {
  isOnline: boolean;
  lastSeen: Date;
  currentFile?: string;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  color: string;
}

interface CollaborationState {
  users: Record<string, CollaborationUser>;
  isConnected: boolean;
  roomId: string | null;
  operationalTransforms: Array<{
    id: string;
    userId: string;
    operation: any;
    timestamp: number;
    applied: boolean;
  }>;
  pendingOperations: Array<{
    id: string;
    operation: any;
    timestamp: number;
  }>;
  chatMessages: Array<{
    id: string;
    userId: string;
    message: string;
    timestamp: Date;
    type: 'text' | 'system' | 'code';
  }>;
  isChatOpen: boolean;
  unreadChatCount: number;
}

const initialState: CollaborationState = {
  users: {},
  isConnected: false,
  roomId: null,
  operationalTransforms: [],
  pendingOperations: [],
  chatMessages: [],
  isChatOpen: false,
  unreadChatCount: 0,
};

const USER_COLORS = [
  '#007acc', '#d73a49', '#28a745', '#ffc107', '#e83e8c',
  '#6f42c1', '#fd7e14', '#20c997', '#6610f2', '#17a2b8'
];

export const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setRoomId: (state, action: PayloadAction<string | null>) => {
      state.roomId = action.payload;
    },
    addUser: (state, action: PayloadAction<User>) => {
      const existingUser = state.users[action.payload.id];
      const colorIndex = Object.keys(state.users).length % USER_COLORS.length;
      
      state.users[action.payload.id] = {
        ...action.payload,
        isOnline: true,
        lastSeen: new Date(),
        color: existingUser?.color || USER_COLORS[colorIndex],
      };
    },
    removeUser: (state, action: PayloadAction<string>) => {
      delete state.users[action.payload];
    },
    updateUser: (state, action: PayloadAction<{ userId: string; updates: Partial<CollaborationUser> }>) => {
      const user = state.users[action.payload.userId];
      if (user) {
        state.users[action.payload.userId] = { ...user, ...action.payload.updates };
      }
    },
    updateUserCursor: (state, action: PayloadAction<{ userId: string; cursor: { line: number; column: number }; file?: string }>) => {
      const user = state.users[action.payload.userId];
      if (user) {
        user.cursor = action.payload.cursor;
        if (action.payload.file) {
          user.currentFile = action.payload.file;
        }
      }
    },
    updateUserSelection: (state, action: PayloadAction<{ userId: string; selection: { startLine: number; startColumn: number; endLine: number; endColumn: number } }>) => {
      const user = state.users[action.payload.userId];
      if (user) {
        user.selection = action.payload.selection;
      }
    },
    setUserOffline: (state, action: PayloadAction<string>) => {
      const user = state.users[action.payload];
      if (user) {
        user.isOnline = false;
        user.lastSeen = new Date();
      }
    },
    addOperationalTransform: (state, action: PayloadAction<{ id: string; userId: string; operation: any; timestamp: number }>) => {
      state.operationalTransforms.push({
        ...action.payload,
        applied: false,
      });
    },
    markOperationApplied: (state, action: PayloadAction<string>) => {
      const operation = state.operationalTransforms.find(op => op.id === action.payload);
      if (operation) {
        operation.applied = true;
      }
    },
    addPendingOperation: (state, action: PayloadAction<{ id: string; operation: any }>) => {
      state.pendingOperations.push({
        ...action.payload,
        timestamp: Date.now(),
      });
    },
    removePendingOperation: (state, action: PayloadAction<string>) => {
      state.pendingOperations = state.pendingOperations.filter(op => op.id !== action.payload);
    },
    addChatMessage: (state, action: PayloadAction<{ id: string; userId: string; message: string; type?: 'text' | 'system' | 'code' }>) => {
      state.chatMessages.push({
        ...action.payload,
        type: action.payload.type || 'text',
        timestamp: new Date(),
      });
      
      if (!state.isChatOpen) {
        state.unreadChatCount += 1;
      }
    },
    setChatOpen: (state, action: PayloadAction<boolean>) => {
      state.isChatOpen = action.payload;
      if (action.payload) {
        state.unreadChatCount = 0;
      }
    },
    clearChatMessages: (state) => {
      state.chatMessages = [];
      state.unreadChatCount = 0;
    },
    clearOperationalTransforms: (state) => {
      state.operationalTransforms = [];
    },
    clearPendingOperations: (state) => {
      state.pendingOperations = [];
    },
    resetCollaboration: (state) => {
      state.users = {};
      state.isConnected = false;
      state.roomId = null;
      state.operationalTransforms = [];
      state.pendingOperations = [];
      state.chatMessages = [];
      state.isChatOpen = false;
      state.unreadChatCount = 0;
    },
  },
});

export const {
  setConnected,
  setRoomId,
  addUser,
  removeUser,
  updateUser,
  updateUserCursor,
  updateUserSelection,
  setUserOffline,
  addOperationalTransform,
  markOperationApplied,
  addPendingOperation,
  removePendingOperation,
  addChatMessage,
  setChatOpen,
  clearChatMessages,
  clearOperationalTransforms,
  clearPendingOperations,
  resetCollaboration,
} = collaborationSlice.actions;