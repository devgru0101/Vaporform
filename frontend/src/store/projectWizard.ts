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

// Local validation helper
const validateStep = (step: number, projectData: any): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (step) {
    case 0: // Project Vision
      if (!projectData.vision.name.trim()) {
        errors.push('Project name is required');
      }
      if (!projectData.vision.description.trim()) {
        errors.push('Project description is required');
      }
      if (!projectData.vision.coreFeatures.trim()) {
        errors.push('Core features description is required');
      }
      if (!projectData.vision.targetAudience.trim()) {
        warnings.push('Target audience helps us provide better recommendations');
      }
      break;

    case 1: // Tech Stack
      if (!projectData.techStack.selectedTemplate) {
        errors.push('Please select a template');
      }
      break;

    case 2: // Integrations
      // Integrations are optional, but provide warnings for common ones
      const hasAuth = Object.keys(projectData.integrations).some(key => 
        key.includes('auth') && projectData.integrations[key].enabled
      );
      if (!hasAuth && projectData.vision.targetAudience.toLowerCase().includes('user')) {
        warnings.push('Consider adding authentication for user-focused applications');
      }
      break;

    case 3: // Review
      // Final validation before generation
      if (!projectData.vision.name.trim() || !projectData.vision.description.trim()) {
        errors.push('Project vision is incomplete');
      }
      if (!projectData.techStack.selectedTemplate) {
        errors.push('Tech stack is incomplete');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

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
    
    // Project Data Updates
    updateVision: (state, action: PayloadAction<Partial<ProjectVisionData>>) => {
      state.projectData.vision = {
        ...state.projectData.vision,
        ...action.payload
      };
      state.validation = validateStep(state.currentStep, state.projectData);
    },
    
    updateTechStack: (state, action: PayloadAction<Partial<TechStackData>>) => {
      state.projectData.techStack = {
        ...state.projectData.techStack,
        ...action.payload
      };
      state.validation = validateStep(state.currentStep, state.projectData);
    },
    
    updateIntegrations: (state, action: PayloadAction<Partial<IntegrationData>>) => {
      state.projectData.integrations = {
        ...state.projectData.integrations,
        ...action.payload
      };
      state.validation = validateStep(state.currentStep, state.projectData);
    },
    
    updateProjectData: (state, action: PayloadAction<Partial<typeof state.projectData>>) => {
      state.projectData = {
        ...state.projectData,
        ...action.payload
      };
      state.validation = validateStep(state.currentStep, state.projectData);
    },
    
    // Generation Progress
    updateGenerationProgress: (state, action: PayloadAction<{
      progress: number;
      status: string;
      message: string;
      details?: any;
    }>) => {
      state.generationProgress = action.payload;
      
      // Update project data status based on generation status
      if (action.payload.status === 'completed') {
        state.projectData.status = 'completed';
        state.isGenerating = false;
      } else if (action.payload.status === 'error') {
        state.projectData.status = 'error';
        state.isGenerating = false;
      } else {
        state.projectData.status = 'generating';
      }
    },
    
    // Validation
    validateCurrentStep: (state) => {
      state.validation = validateStep(state.currentStep, state.projectData);
    },
    
    setValidation: (state, action: PayloadAction<{ isValid: boolean; errors: string[]; warnings?: string[] }>) => {
      state.validation = {
        isValid: action.payload.isValid,
        errors: action.payload.errors,
        warnings: action.payload.warnings || []
      };
    },
    
    // Error Management
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    setApiError: (state, action: PayloadAction<{ key: string; error: string }>) => {
      state.apiErrors[action.payload.key] = action.payload.error;
    },
    
    clearApiError: (state, action: PayloadAction<string>) => {
      delete state.apiErrors[action.payload];
    },
    
    clearAllErrors: (state) => {
      state.error = null;
      state.apiErrors = {};
    },
    
    // Progress Tracker Management
    setProgressTracker: (state, action: PayloadAction<ProjectGenerationTracker | null>) => {
      state.progressTracker = action.payload;
    },
    
    stopProgressTracking: (state) => {
      if (state.progressTracker) {
        state.progressTracker.stopTracking();
        state.progressTracker = null;
      }
    },
    
    // Session Management
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },
    
    clearSession: (state) => {
      state.sessionId = null;
      state.session = null;
    },
    
    // Reset
    resetWizard: () => initialState
  },
  
  extraReducers: (builder) => {
    // Session Management
    builder
      .addCase(createWizardSession.pending, (state) => {
        state.isLoadingSession = true;
        state.error = null;
      })
      .addCase(createWizardSession.fulfilled, (state, action) => {
        state.isLoadingSession = false;
        state.session = action.payload;
        state.sessionId = action.payload.id;
      })
      .addCase(createWizardSession.rejected, (state, action) => {
        state.isLoadingSession = false;
        state.error = action.payload as string || 'Failed to create session';
      });

    builder
      .addCase(loadWizardSession.pending, (state) => {
        state.isLoadingSession = true;
        state.error = null;
      })
      .addCase(loadWizardSession.fulfilled, (state, action) => {
        state.isLoadingSession = false;
        state.session = action.payload;
        state.sessionId = action.payload.id;
        
        // Restore project data from session
        if (action.payload.data) {
          if (action.payload.data.vision) {
            state.projectData.vision = action.payload.data.vision;
          }
          if (action.payload.data.techStack) {
            state.projectData.techStack = action.payload.data.techStack;
          }
          if (action.payload.data.integrations) {
            state.projectData.integrations = action.payload.data.integrations;
          }
        }
        
        // Restore analysis if available
        if (action.payload.analysis) {
          state.analysis = action.payload.analysis;
        }
      })
      .addCase(loadWizardSession.rejected, (state, action) => {
        state.isLoadingSession = false;
        state.error = action.payload as string || 'Failed to load session';
      });

    // Project Vision Analysis
    builder
      .addCase(analyzeProjectVision.pending, (state) => {
        state.isAnalyzing = true;
        state.error = null;
      })
      .addCase(analyzeProjectVision.fulfilled, (state, action) => {
        state.isAnalyzing = false;
        state.analysis = action.payload;
      })
      .addCase(analyzeProjectVision.rejected, (state, action) => {
        state.isAnalyzing = false;
        state.error = action.payload as string || 'Failed to analyze project vision';
      });

    // Templates
    builder
      .addCase(loadTemplates.pending, (state) => {
        state.isLoadingTemplates = true;
        delete state.apiErrors.templates;
      })
      .addCase(loadTemplates.fulfilled, (state, action) => {
        state.isLoadingTemplates = false;
        state.availableTemplates = action.payload.templates;
      })
      .addCase(loadTemplates.rejected, (state, action) => {
        state.isLoadingTemplates = false;
        state.apiErrors.templates = action.payload as string || 'Failed to load templates';
      });

    builder
      .addCase(getRecommendedTemplates.pending, (state) => {
        state.isLoadingTemplates = true;
      })
      .addCase(getRecommendedTemplates.fulfilled, (state, action) => {
        state.isLoadingTemplates = false;
        state.recommendedTemplates = action.payload.templates;
      })
      .addCase(getRecommendedTemplates.rejected, (state, action) => {
        state.isLoadingTemplates = false;
        state.apiErrors.recommendedTemplates = action.payload as string || 'Failed to get recommended templates';
      });

    // Integrations
    builder
      .addCase(loadIntegrations.pending, (state) => {
        state.isLoadingIntegrations = true;
        delete state.apiErrors.integrations;
      })
      .addCase(loadIntegrations.fulfilled, (state, action) => {
        state.isLoadingIntegrations = false;
        state.availableIntegrations = action.payload.providers;
      })
      .addCase(loadIntegrations.rejected, (state, action) => {
        state.isLoadingIntegrations = false;
        state.apiErrors.integrations = action.payload as string || 'Failed to load integrations';
      });

    builder
      .addCase(loadIntegrationsByType.pending, (state) => {
        state.isLoadingIntegrations = true;
      })
      .addCase(loadIntegrationsByType.fulfilled, (state, action) => {
        state.isLoadingIntegrations = false;
        state.integrationsByType[action.payload.type] = action.payload.providers;
      })
      .addCase(loadIntegrationsByType.rejected, (state, action) => {
        state.isLoadingIntegrations = false;
        state.apiErrors.integrationsByType = action.payload as string || 'Failed to load integrations by type';
      });

    // Project Generation
    builder
      .addCase(generateProject.pending, (state) => {
        state.isGenerating = true;
        state.projectData.status = 'generating';
        state.error = null;
        state.generationProgress = {
          progress: 0,
          status: 'started',
          message: 'Starting project generation...'
        };
      })
      .addCase(generateProject.fulfilled, (state, action) => {
        state.projectData.generationId = action.payload.generationId;
        // Note: isGenerating will be set to false when progress tracking completes
      })
      .addCase(generateProject.rejected, (state, action) => {
        state.isGenerating = false;
        state.projectData.status = 'error';
        state.error = action.payload as string || 'Failed to generate project';
      });

    // Progress Tracking
    builder
      .addCase(startProgressTracking.fulfilled, (state, action) => {
        state.progressTracker = action.payload;
      })
      .addCase(startProgressTracking.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to start progress tracking';
      });

    builder
      .addCase(fetchGenerationResult.fulfilled, (state, action) => {
        if (action.payload.status === 'completed' && action.payload.result) {
          state.projectData.status = 'completed';
          state.isGenerating = false;
          
          // Store generation result for download
          state.generationProgress = {
            progress: 100,
            status: 'completed',
            message: 'Project generation completed successfully!'
          };
        }
      });

    // Validation
    builder
      .addCase(validateProject.pending, (state) => {
        state.isValidating = true;
      })
      .addCase(validateProject.fulfilled, (state, action) => {
        state.isValidating = false;
        state.validation = {
          isValid: action.payload.valid,
          errors: action.payload.errors,
          warnings: []
        };
      })
      .addCase(validateProject.rejected, (state, action) => {
        state.isValidating = false;
        state.error = action.payload as string || 'Failed to validate project';
      });
  }
});

export const {
  nextStep,
  previousStep,
  setCurrentStep,
  updateVision,
  updateTechStack,
  updateIntegrations,
  updateProjectData,
  updateGenerationProgress,
  validateCurrentStep,
  setValidation,
  setError,
  clearError,
  setApiError,
  clearApiError,
  clearAllErrors,
  setProgressTracker,
  stopProgressTracking,
  setSessionId,
  clearSession,
  resetWizard
} = projectWizardSlice.actions;

export default projectWizardSlice.reducer;