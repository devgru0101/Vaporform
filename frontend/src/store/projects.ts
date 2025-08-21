import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Project, ProjectSettings } from '@shared/types';

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filter: 'all' | 'owned' | 'shared' | 'recent';
  sortBy: 'name' | 'created' | 'modified' | 'size';
  sortOrder: 'asc' | 'desc';
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  filter: 'all',
  sortBy: 'modified',
  sortOrder: 'desc',
};

export const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.projects.unshift(action.payload);
    },
    updateProject: (state, action: PayloadAction<{ id: string; updates: Partial<Project> }>) => {
      const index = state.projects.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...action.payload.updates };
      }
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = { ...state.currentProject, ...action.payload.updates };
      }
    },
    removeProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(p => p.id !== action.payload);
      if (state.currentProject?.id === action.payload) {
        state.currentProject = null;
      }
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    updateProjectSettings: (state, action: PayloadAction<{ id: string; settings: Partial<ProjectSettings> }>) => {
      const project = state.projects.find(p => p.id === action.payload.id);
      if (project) {
        project.settings = { ...project.settings, ...action.payload.settings };
      }
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject.settings = { ...state.currentProject.settings, ...action.payload.settings };
      }
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilter: (state, action: PayloadAction<typeof initialState.filter>) => {
      state.filter = action.payload;
    },
    setSorting: (state, action: PayloadAction<{ sortBy: typeof initialState.sortBy; sortOrder: typeof initialState.sortOrder }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setProjects,
  addProject,
  updateProject,
  removeProject,
  setCurrentProject,
  updateProjectSettings,
  setSearchQuery,
  setFilter,
  setSorting,
  setError,
  clearError,
} = projectsSlice.actions;