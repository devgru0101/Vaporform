import { Middleware } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';
import { collaborationSlice } from '../collaboration';
import { containerSlice } from '../containers';
import { fileSystemSlice } from '../fileSystem';
import { aiSlice } from '../ai';
import { uiSlice } from '../ui';
import type { RootState } from '../index';

const WS_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000';

interface WebSocketState {
  socket: Socket | null;
  isConnected: boolean;
  reconnectAttempts: number;
}

const wsState: WebSocketState = {
  socket: null,
  isConnected: false,
  reconnectAttempts: 0
};

export const websocketMiddleware: Middleware<{}, RootState> = store => next => action => {
  const result = next(action);
  const state = store.getState();

  // Initialize WebSocket connection when user logs in
  if (action.type === 'auth/loginSuccess') {
    const token = action.payload.token;
    initializeWebSocket(token, store);
  }

  // Close WebSocket connection when user logs out
  if (action.type === 'auth/logout') {
    closeWebSocket();
  }

  // Handle project changes
  if (action.type === 'projects/setCurrentProject') {
    const project = action.payload;
    if (wsState.socket && project) {
      wsState.socket.emit('join-project', { projectId: project.id });
    }
  }

  return result;
};

function initializeWebSocket(token: string, store: any) {
  if (wsState.socket) {
    wsState.socket.disconnect();
  }

  wsState.socket = io(WS_BASE, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  // Connection events
  wsState.socket.on('connect', () => {
    wsState.isConnected = true;
    wsState.reconnectAttempts = 0;
    store.dispatch(collaborationSlice.actions.setConnected(true));
    store.dispatch(uiSlice.actions.updateStatusBarItem({
      side: 'right',
      item: {
        id: 'ws-status',
        text: 'Connected',
        priority: 10
      }
    }));
  });

  wsState.socket.on('disconnect', () => {
    wsState.isConnected = false;
    store.dispatch(collaborationSlice.actions.setConnected(false));
    store.dispatch(uiSlice.actions.updateStatusBarItem({
      side: 'right',
      item: {
        id: 'ws-status',
        text: 'Disconnected',
        priority: 10
      }
    }));
  });

  wsState.socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
    wsState.reconnectAttempts++;
    
    if (wsState.reconnectAttempts >= 5) {
      store.dispatch(uiSlice.actions.addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: 'Unable to connect to the server. Please check your connection.',
        duration: 5000
      }));
    }
  });

  // Collaboration events
  wsState.socket.on('user-joined', (data) => {
    store.dispatch(collaborationSlice.actions.addUser(data.user));
    store.dispatch(uiSlice.actions.addNotification({
      type: 'info',
      title: 'User Joined',
      message: `${data.user.name} joined the project`,
      duration: 3000
    }));
  });

  wsState.socket.on('user-left', (data) => {
    store.dispatch(collaborationSlice.actions.removeUser(data.userId));
    const state = store.getState();
    const user = state.collaboration.users[data.userId];
    if (user) {
      store.dispatch(uiSlice.actions.addNotification({
        type: 'info',
        title: 'User Left',
        message: `${user.name} left the project`,
        duration: 3000
      }));
    }
  });

  wsState.socket.on('cursor-update', (data) => {
    store.dispatch(collaborationSlice.actions.updateUserCursor({
      userId: data.userId,
      cursor: data.cursor,
      file: data.file
    }));
  });

  wsState.socket.on('selection-update', (data) => {
    store.dispatch(collaborationSlice.actions.updateUserSelection({
      userId: data.userId,
      selection: data.selection
    }));
  });

  wsState.socket.on('operation-applied', (data) => {
    store.dispatch(collaborationSlice.actions.addOperationalTransform({
      id: data.id,
      userId: data.userId,
      operation: data.operation,
      timestamp: data.timestamp
    }));
  });

  wsState.socket.on('chat-message', (data) => {
    store.dispatch(collaborationSlice.actions.addChatMessage({
      id: data.id,
      userId: data.userId,
      message: data.message,
      type: data.type
    }));
  });

  // File system events
  wsState.socket.on('file-changed', (data) => {
    store.dispatch(fileSystemSlice.actions.updateFileNode({
      path: data.path,
      updates: data.updates
    }));
  });

  wsState.socket.on('file-created', (data) => {
    store.dispatch(fileSystemSlice.actions.addFileNode({
      parentPath: data.parentPath,
      node: data.node
    }));
  });

  wsState.socket.on('file-deleted', (data) => {
    store.dispatch(fileSystemSlice.actions.removeFileNode(data.path));
  });

  // Container events
  wsState.socket.on('container-status-changed', (data) => {
    store.dispatch(containerSlice.actions.updateContainerStatus({
      containerId: data.containerId,
      status: data.status,
      health: data.health
    }));
  });

  wsState.socket.on('container-log', (data) => {
    store.dispatch(containerSlice.actions.addContainerLog({
      containerId: data.containerId,
      log: data.log
    }));
  });

  wsState.socket.on('container-stats', (data) => {
    store.dispatch(containerSlice.actions.setContainerStats({
      containerId: data.containerId,
      stats: data.stats
    }));
  });

  // AI events
  wsState.socket.on('ai-suggestion', (data) => {
    store.dispatch(aiSlice.actions.addSuggestion(data.suggestion));
  });

  // Error handling
  wsState.socket.on('error', (data) => {
    console.error('WebSocket error:', data);
    store.dispatch(uiSlice.actions.addNotification({
      type: 'error',
      title: 'Server Error',
      message: data.message || 'An error occurred',
      duration: 5000
    }));
  });
}

function closeWebSocket() {
  if (wsState.socket) {
    wsState.socket.disconnect();
    wsState.socket = null;
  }
  wsState.isConnected = false;
  wsState.reconnectAttempts = 0;
}

// Export functions for components to use
export const emitCursorUpdate = (data: { file: string; cursor: { line: number; column: number } }) => {
  if (wsState.socket && wsState.isConnected) {
    wsState.socket.emit('cursor-update', data);
  }
};

export const emitSelectionUpdate = (data: { file: string; selection: any }) => {
  if (wsState.socket && wsState.isConnected) {
    wsState.socket.emit('selection-update', data);
  }
};

export const emitOperation = (data: { operation: any; file: string }) => {
  if (wsState.socket && wsState.isConnected) {
    wsState.socket.emit('operation', data);
  }
};

export const emitChatMessage = (data: { message: string; type?: string }) => {
  if (wsState.socket && wsState.isConnected) {
    wsState.socket.emit('chat-message', data);
  }
};

export const joinProject = (projectId: string) => {
  if (wsState.socket && wsState.isConnected) {
    wsState.socket.emit('join-project', { projectId });
  }
};

export const leaveProject = (projectId: string) => {
  if (wsState.socket && wsState.isConnected) {
    wsState.socket.emit('leave-project', { projectId });
  }
};

export const getWebSocketStatus = () => ({
  isConnected: wsState.isConnected,
  reconnectAttempts: wsState.reconnectAttempts
});