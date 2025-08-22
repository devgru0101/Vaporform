import { Middleware } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';
import { collaborationSlice } from '../collaboration';
import { containerSlice } from '../containers';
import { fileSystemSlice } from '../fileSystem';
import { aiSlice } from '../ai';
import { uiSlice } from '../ui';
import type { RootState } from '../index';
import { API_BASE_ALT, isProduction, getEnvVar } from '../../config/environment';

const WS_BASE = API_BASE_ALT;

// WebSocket feature flag - disable in development until backend WebSocket server is implemented
const ENABLE_WEBSOCKET = isProduction && getEnvVar('REACT_APP_ENABLE_WEBSOCKET') === 'true';

interface WebSocketState {
  socket: Socket | null;
  isConnected: boolean;
  reconnectAttempts: number;
  maxRetries: number;
  retryBackoff: number;
}

const wsState: WebSocketState = {
  socket: null,
  isConnected: false,
  reconnectAttempts: 0,
  maxRetries: 3,
  retryBackoff: 1000
};

export const websocketMiddleware: Middleware<{}, RootState> = store => next => action => {
  const result = next(action);
  const state = store.getState();

  // Initialize WebSocket connection when user logs in (only if enabled)
  if (action.type === 'auth/loginSuccess' && ENABLE_WEBSOCKET) {
    const token = action.payload.token;
    initializeWebSocket(token, store);
  } else if (action.type === 'auth/loginSuccess' && !ENABLE_WEBSOCKET) {
    // Show status that WebSocket is disabled in development
    store.dispatch(uiSlice.actions.updateStatusBarItem({
      side: 'right',
      item: {
        id: 'ws-status',
        text: 'Offline Mode',
        tooltip: 'WebSocket disabled in development',
        priority: 10
      }
    }));
  }

  // Close WebSocket connection when user logs out
  if (action.type === 'auth/logout') {
    closeWebSocket();
  }

  // Handle project changes (only if WebSocket is enabled and connected)
  if (action.type === 'projects/setCurrentProject' && ENABLE_WEBSOCKET) {
    const project = action.payload;
    if (wsState.socket && wsState.isConnected && project) {
      wsState.socket.emit('join-project', { projectId: project.id });
    }
  }

  return result;
};

function initializeWebSocket(token: string, store: any) {
  if (wsState.socket) {
    wsState.socket.disconnect();
  }

  // Reset connection state
  wsState.reconnectAttempts = 0;

  wsState.socket = io(WS_BASE, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: wsState.maxRetries,
    reconnectionDelay: wsState.retryBackoff,
    reconnectionDelayMax: wsState.retryBackoff * 5,
    timeout: 5000, // 5 second connection timeout
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
    wsState.reconnectAttempts++;
    
    // Only log errors in development mode for debugging
    if (!isProduction) {
      console.warn(`WebSocket connection attempt ${wsState.reconnectAttempts}/${wsState.maxRetries} failed:`, error.message);
    }
    
    // Update status bar to show connection issues
    store.dispatch(uiSlice.actions.updateStatusBarItem({
      side: 'right',
      item: {
        id: 'ws-status',
        text: `Connecting... (${wsState.reconnectAttempts}/${wsState.maxRetries})`,
        tooltip: 'Attempting to connect to real-time server',
        priority: 10
      }
    }));
    
    // After max retries, show notification and stop trying
    if (wsState.reconnectAttempts >= wsState.maxRetries) {
      store.dispatch(uiSlice.actions.updateStatusBarItem({
        side: 'right',
        item: {
          id: 'ws-status',
          text: 'Offline Mode',
          tooltip: 'Real-time features unavailable - server not reachable',
          priority: 10
        }
      }));
      
      store.dispatch(uiSlice.actions.addNotification({
        type: 'warning',
        title: 'Real-time Features Unavailable',
        message: 'Working in offline mode. Some collaborative features may be limited.',
        duration: 5000
      }));
      
      // Disconnect to prevent further attempts
      if (wsState.socket) {
        wsState.socket.disconnect();
        wsState.socket = null;
      }
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
  if (ENABLE_WEBSOCKET && wsState.socket && wsState.isConnected) {
    wsState.socket.emit('cursor-update', data);
  }
};

export const emitSelectionUpdate = (data: { file: string; selection: any }) => {
  if (ENABLE_WEBSOCKET && wsState.socket && wsState.isConnected) {
    wsState.socket.emit('selection-update', data);
  }
};

export const emitOperation = (data: { operation: any; file: string }) => {
  if (ENABLE_WEBSOCKET && wsState.socket && wsState.isConnected) {
    wsState.socket.emit('operation', data);
  }
};

export const emitChatMessage = (data: { message: string; type?: string }) => {
  if (ENABLE_WEBSOCKET && wsState.socket && wsState.isConnected) {
    wsState.socket.emit('chat-message', data);
  }
};

export const joinProject = (projectId: string) => {
  if (ENABLE_WEBSOCKET && wsState.socket && wsState.isConnected) {
    wsState.socket.emit('join-project', { projectId });
  }
};

export const leaveProject = (projectId: string) => {
  if (ENABLE_WEBSOCKET && wsState.socket && wsState.isConnected) {
    wsState.socket.emit('leave-project', { projectId });
  }
};

export const getWebSocketStatus = () => ({
  isConnected: wsState.isConnected,
  reconnectAttempts: wsState.reconnectAttempts,
  isEnabled: ENABLE_WEBSOCKET
});