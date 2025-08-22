import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  wizardAPI, 
  projectAnalysisAPI, 
  templatesAPI, 
  integrationsAPI,
  projectGenerationAPI,
  ProjectGenerationTracker,
  handleAPIError
} from '../services';
import type { 
  ProjectVisionData,
  TechStackData,
  IntegrationData,
  WizardSession,
  ProjectAnalysis,
  Template,
  IntegrationProvider,
  GenerationProgressEvent
} from '../services/types';

// Types
export interface ProjectWizardState {
  // Navigation
  currentStep: number;
  totalSteps: number;
  
  // Session Management
  sessionId: string | null;
  session: WizardSession | null;
  
  // Project Data (structured to match backend APIs)
  projectData: {
    // Step 1 - Project Vision
    vision: ProjectVisionData;
    
    // Step 2 - Tech Stack
    techStack: TechStackData;
    
    // Step 3 - Integrations
    integrations: IntegrationData;
    
    // Generation metadata
    status: 'draft' | 'analyzing' | 'generating' | 'completed' | 'error';
    generationId?: string;
  };
  
  // Analysis Results
  analysis: ProjectAnalysis | null;
  
  // Available Options
  availableTemplates: Template[];
  recommendedTemplates: Template[];
  availableIntegrations: IntegrationProvider[];
  integrationsByType: Record<string, IntegrationProvider[]>;
  
  // Generation Progress
  generationProgress: {
    progress: number;
    status: string;
    message: string;
    details?: any;
  } | null;
  progressTracker: ProjectGenerationTracker | null;
  
  // Validation
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  
  // Loading States
  isLoadingSession: boolean;
  isAnalyzing: boolean;
  isLoadingTemplates: boolean;
  isLoadingIntegrations: boolean;
  isGenerating: boolean;
  isValidating: boolean;
  
  // Error States
  error: string | null;
  apiErrors: Record<string, string>;
}

const initialState: ProjectWizardState = {
  currentStep: 0,
  totalSteps: 4,
  
  sessionId: null,
  session: null,
  
  projectData: {
    vision: {
      name: '',
      description: '',
      coreFeatures: '',
      targetAudience: '',
      projectGoals: [],
      inspirationApps: []
    },
    techStack: {
      selectedTemplate: '',
      databaseType: 'PostgreSQL',
      stylingFramework: 'Tailwind CSS',
      testingFramework: 'Vitest',
      packageManager: 'npm',
      additionalFeatures: []
    },
    integrations: {},
    status: 'draft'
  },
  
  analysis: null,
  
  availableTemplates: [],
  recommendedTemplates: [],
  availableIntegrations: [],
  integrationsByType: {},
  
  generationProgress: null,
  progressTracker: null,
  
  validation: {
    isValid: false,
    errors: [],
    warnings: []
  },
  
  isLoadingSession: false,
  isAnalyzing: false,
  isLoadingTemplates: false,
  isLoadingIntegrations: false,
  isGenerating: false,
  isValidating: false,
  
  error: null,
  apiErrors: {}
};

// Session Management
export const createWizardSession = createAsyncThunk(
  'projectWizard/createSession',
  async (userId: string, { rejectWithValue }) => {
    try {
      const session = await wizardAPI.createSession(userId);
      return session;
    } catch (error) {
      const apiError = handleAPIError(error);
      return rejectWithValue(apiError.message);
    }
  }
);

export const loadWizardSession = createAsyncThunk(
  'projectWizard/loadSession',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const session = await wizardAPI.getSession(sessionId);
      return session;
    } catch (error) {
      const apiError = handleAPIError(error);
      return rejectWithValue(apiError.message);
    }
  }
);

// Step 1: Project Vision Analysis
export const analyzeProjectVision = createAsyncThunk(
  'projectWizard/analyzeVision',
  async (visionData: ProjectVisionData, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { projectWizard: ProjectWizardState };
      const userId = 'user-123'; // TODO: Get from auth state
      
      const analysis = await wizardAPI.analyzeVision(visionData, userId);
      return analysis;
    } catch (error) {
      const apiError = handleAPIError(error);
      return rejectWithValue(apiError.message);
    }
  }
);

// Step 2: Load Templates
export const loadTemplates = createAsyncThunk(
  'projectWizard/loadTemplates',
  async (filters?: any, { rejectWithValue }) => {
    try {
      const templates = await wizardAPI.getTemplates(filters);
      return templates;
    } catch (error) {
      const apiError = handleAPIError(error);
      return rejectWithValue(apiError.message);
    }
  }
);

export const getRecommendedTemplates = createAsyncThunk(
  'projectWizard/getRecommendedTemplates',
  async (requirements: any, { rejectWithValue }) => {
    try {
      const templates = await wizardAPI.getRecommendedTemplates(requirements);
      return templates;
    } catch (error) {
      const apiError = handleAPIError(error);
      return rejectWithValue(apiError.message);
    }
  }
);

// Step 3: Load Integrations
export const loadIntegrations = createAsyncThunk(
  'projectWizard/loadIntegrations',
  async (filters?: any, { rejectWithValue }) => {
    try {
      const integrations = await wizardAPI.getIntegrationProviders(filters);
      return integrations;
    } catch (error) {
      const apiError = handleAPIError(error);
      return rejectWithValue(apiError.message);
    }
  }
);

export const loadIntegrationsByType = createAsyncThunk(
  'projectWizard/loadIntegrationsByType',
  async (type: string, { rejectWithValue }) => {
    try {
      const integrations = await wizardAPI.getProvidersByType(type);
      return { type, providers: integrations.providers };
    } catch (error) {
      const apiError = handleAPIError(error);
      return rejectWithValue(apiError.message);
    }
  }
);

// Step 4: Project Generation
export const generateProject = createAsyncThunk(
  'projectWizard/generateProject',
  async (
    options?: { includeTests?: boolean; includeDocs?: boolean; includeExamples?: boolean },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const state = getState() as { projectWizard: ProjectWizardState };
      const { projectData } = state.projectWizard;
      const userId = 'user-123'; // TODO: Get from auth state
      
      const generationResult = await wizardAPI.generateProject(
        projectData.vision,
        projectData.techStack,
        projectData.integrations,
        userId,
        state.projectWizard.sessionId || undefined,
        options
      );
      
      // Start progress tracking
      if (generationResult.generationId) {
        dispatch(startProgressTracking(generationResult.generationId));
      }
      
      return generationResult;
    } catch (error) {
      const apiError = handleAPIError(error);
      return rejectWithValue(apiError.message);
    }
  }
);

// Progress Tracking
export const startProgressTracking = createAsyncThunk(
  'projectWizard/startProgressTracking',
  async (generationId: string, { dispatch, rejectWithValue }) => {
    try {
      const tracker = wizardAPI.createProgressTracker(generationId);
      
      tracker.startTracking(
        (progress: GenerationProgressEvent) => {
          dispatch(updateGenerationProgress({
            progress: progress.progress,
            status: progress.status,
            message: progress.message,
            details: progress.details
          }));
          
          // If generation is complete, fetch the final result
          if (progress.status === 'completed') {
            dispatch(fetchGenerationResult(generationId));
          }
        },
        (error: Error) => {
          dispatch(setError(error.message));
        }
      );
      
      return tracker;
    } catch (error) {
      const apiError = handleAPIError(error);
      return rejectWithValue(apiError.message);
    }
  }
);

export const fetchGenerationResult = createAsyncThunk(
  'projectWizard/fetchGenerationResult',
  async (generationId: string, { rejectWithValue }) => {
    try {
      const result = await wizardAPI.getGenerationStatus(generationId);
      return result;
    } catch (error) {
      const apiError = handleAPIError(error);
      return rejectWithValue(apiError.message);
    }
  }
);

// Validation
export const validateProject = createAsyncThunk(
  'projectWizard/validateProject',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { projectWizard: ProjectWizardState };
      const { projectData } = state.projectWizard;
      
      const validation = await wizardAPI.validateProject(projectData);
      return validation;
    } catch (error) {
      const apiError = handleAPIError(error);
      return rejectWithValue(apiError.message);
    }
  }
);

// Slice
const projectWizardSlice = createSlice({
  name: 'projectWizard',
  initialState,
  reducers: {
    // Navigation
    nextStep: (state) => {
      if (state.currentStep < state.totalSteps - 1) {
        state.currentStep += 1;
      }
    },
    
    previousStep: (state) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1;
      }
    },
    
    setCurrentStep: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < state.totalSteps) {
        state.currentStep = action.payload;
      }
    },
    
    // Project Data
    updateProjectData: (state, action: PayloadAction<Partial<typeof state.projectData>>) => {
      state.projectData = {
        ...state.projectData,
        ...action.payload
      };
      
      // Auto-validate when data changes
      state.validation = validateStep(state.currentStep, state.projectData);
    },
    
    // Validation
    validateCurrentStep: (state) => {
      state.validation = validateStep(state.currentStep, state.projectData);
    },
    
    setValidation: (state, action: PayloadAction<{ isValid: boolean; errors: string[] }>) => {
      state.validation = action.payload;
    },
    
    // UI State
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    setGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload;
    },
    
    // Reset
    resetWizard: () => initialState,
    
    // Session
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    }
  },
  
  extraReducers: (builder) => {
    // Analyze Project Vision
    builder.addCase(analyzeProjectVision.pending, (state) => {
      state.isAnalyzing = true;
      state.error = null;
    });
    
    builder.addCase(analyzeProjectVision.fulfilled, (state, action) => {
      state.isAnalyzing = false;
      state.aiSuggestions = action.payload;
      
      // Update project type if detected
      if (action.payload.projectType) {
        state.projectData.projectType = action.payload.projectType;
      }
    });
    
    builder.addCase(analyzeProjectVision.rejected, (state, action) => {
      state.isAnalyzing = false;
      state.error = action.error.message || 'Failed to analyze project vision';
    });
    
    // Analyze Tech Stack
    builder.addCase(analyzeTechStack.pending, (state) => {
      state.isAnalyzing = true;
      state.error = null;
    });
    
    builder.addCase(analyzeTechStack.fulfilled, (state, action) => {
      state.isAnalyzing = false;
      state.aiRecommendations = action.payload;
    });
    
    builder.addCase(analyzeTechStack.rejected, (state, action) => {
      state.isAnalyzing = false;
      state.error = action.error.message || 'Failed to analyze tech stack';
    });
  }
});

// Validation helper function
function validateStep(step: number, projectData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  switch (step) {
    case 0: // Project Vision
      if (!projectData.projectName || projectData.projectName.trim().length < 3) {
        errors.push('Project name must be at least 3 characters long');
      }
      
      if (!projectData.description || projectData.description.trim().length < 10) {
        errors.push('Project description must be at least 10 characters long');
      }
      
      if (!projectData.coreFeatures || projectData.coreFeatures.trim().length < 20) {
        errors.push('Core features must be described in at least 20 characters');
      }
      break;
      
    case 1: // Tech Stack
      if (!projectData.selectedTemplate) {
        errors.push('Please select a tech stack template');
      }
      
      if (projectData.selectedTemplate === 'custom') {
        const { customTechStack } = projectData;
        if (!customTechStack?.backend) errors.push('Backend technology is required for custom stack');
        if (!customTechStack?.frontend) errors.push('Frontend technology is required for custom stack');
        if (!customTechStack?.database) errors.push('Database technology is required for custom stack');
        if (!customTechStack?.hosting) errors.push('Hosting platform is required for custom stack');
      }
      break;
      
    case 2: // Integrations
      // Integrations are optional, so always valid
      break;
      
    case 3: // Review
      // Final validation - check if we have minimum required data
      if (!projectData.projectName || !projectData.description || !projectData.selectedTemplate) {
        errors.push('Please complete all required steps before generating');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Action creators
export const {
  nextStep,
  previousStep,
  setCurrentStep,
  updateProjectData,
  validateCurrentStep,
  setValidation,
  setError,
  clearError,
  setGenerating,
  resetWizard,
  setSessionId
} = projectWizardSlice.actions;

// Selectors
export const selectCurrentStep = (state: { projectWizard: ProjectWizardState }) => 
  state.projectWizard.currentStep;

export const selectProjectData = (state: { projectWizard: ProjectWizardState }) => 
  state.projectWizard.projectData;

export const selectValidation = (state: { projectWizard: ProjectWizardState }) => 
  state.projectWizard.validation;

export const selectIsAnalyzing = (state: { projectWizard: ProjectWizardState }) => 
  state.projectWizard.isAnalyzing;

export const selectIsGenerating = (state: { projectWizard: ProjectWizardState }) => 
  state.projectWizard.isGenerating;

export const selectAiSuggestions = (state: { projectWizard: ProjectWizardState }) => 
  state.projectWizard.aiSuggestions;

export const selectAiRecommendations = (state: { projectWizard: ProjectWizardState }) => 
  state.projectWizard.aiRecommendations;

export const selectError = (state: { projectWizard: ProjectWizardState }) => 
  state.projectWizard.error;

export default projectWizardSlice.reducer;