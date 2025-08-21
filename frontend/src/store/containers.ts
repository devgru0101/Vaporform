import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ContainerInfo, ContainerStats, ContainerLog } from '@shared/types';

interface ContainersState {
  containers: Record<string, ContainerInfo>;
  stats: Record<string, ContainerStats>;
  logs: Record<string, ContainerLog[]>;
  isLoading: boolean;
  error: string | null;
  selectedContainerId: string | null;
  logsFilter: 'all' | 'stdout' | 'stderr';
  logsSearch: string;
  autoRefreshStats: boolean;
  autoRefreshInterval: number;
}

const initialState: ContainersState = {
  containers: {},
  stats: {},
  logs: {},
  isLoading: false,
  error: null,
  selectedContainerId: null,
  logsFilter: 'all',
  logsSearch: '',
  autoRefreshStats: true,
  autoRefreshInterval: 5000,
};

export const containerSlice = createSlice({
  name: 'containers',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setContainers: (state, action: PayloadAction<ContainerInfo[]>) => {
      const newContainers: Record<string, ContainerInfo> = {};
      action.payload.forEach(container => {
        newContainers[container.id] = container;
      });
      state.containers = newContainers;
      state.isLoading = false;
      state.error = null;
    },
    updateContainer: (state, action: PayloadAction<ContainerInfo>) => {
      state.containers[action.payload.id] = action.payload;
    },
    removeContainer: (state, action: PayloadAction<string>) => {
      delete state.containers[action.payload];
      delete state.stats[action.payload];
      delete state.logs[action.payload];
      
      if (state.selectedContainerId === action.payload) {
        state.selectedContainerId = null;
      }
    },
    setContainerStats: (state, action: PayloadAction<{ containerId: string; stats: ContainerStats }>) => {
      state.stats[action.payload.containerId] = action.payload.stats;
    },
    updateContainerStatus: (state, action: PayloadAction<{ containerId: string; status: string; health?: string }>) => {
      const container = state.containers[action.payload.containerId];
      if (container) {
        container.status = action.payload.status;
        if (action.payload.health !== undefined) {
          container.health = action.payload.health;
        }
      }
    },
    addContainerLog: (state, action: PayloadAction<{ containerId: string; log: ContainerLog }>) => {
      const { containerId, log } = action.payload;
      
      if (!state.logs[containerId]) {
        state.logs[containerId] = [];
      }
      
      state.logs[containerId].push(log);
      
      // Keep only the last 1000 log entries to prevent memory issues
      if (state.logs[containerId].length > 1000) {
        state.logs[containerId] = state.logs[containerId].slice(-1000);
      }
    },
    setContainerLogs: (state, action: PayloadAction<{ containerId: string; logs: ContainerLog[] }>) => {
      state.logs[action.payload.containerId] = action.payload.logs;
    },
    clearContainerLogs: (state, action: PayloadAction<string>) => {
      state.logs[action.payload] = [];
    },
    setSelectedContainer: (state, action: PayloadAction<string | null>) => {
      state.selectedContainerId = action.payload;
    },
    setLogsFilter: (state, action: PayloadAction<typeof initialState.logsFilter>) => {
      state.logsFilter = action.payload;
    },
    setLogsSearch: (state, action: PayloadAction<string>) => {
      state.logsSearch = action.payload;
    },
    setAutoRefreshStats: (state, action: PayloadAction<boolean>) => {
      state.autoRefreshStats = action.payload;
    },
    setAutoRefreshInterval: (state, action: PayloadAction<number>) => {
      state.autoRefreshInterval = Math.max(1000, Math.min(60000, action.payload));
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetContainers: (state) => {
      state.containers = {};
      state.stats = {};
      state.logs = {};
      state.selectedContainerId = null;
      state.error = null;
      state.isLoading = false;
    },
  },
});

export const {
  setLoading,
  setContainers,
  updateContainer,
  removeContainer,
  setContainerStats,
  updateContainerStatus,
  addContainerLog,
  setContainerLogs,
  clearContainerLogs,
  setSelectedContainer,
  setLogsFilter,
  setLogsSearch,
  setAutoRefreshStats,
  setAutoRefreshInterval,
  setError,
  clearError,
  resetContainers,
} = containerSlice.actions;