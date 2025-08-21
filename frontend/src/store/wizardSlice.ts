import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface WizardStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  data?: any;
  validation?: {
    isValid: boolean;
    errors: string[];
  };
}

export interface ProjectRequirements {
  name: string;
  description: string;
  features: string[];
  userType: 'beginner' | 'intermediate' | 'advanced';
  timeline: 'quick' | 'standard' | 'comprehensive';
  scalability: 'small' | 'medium' | 'large' | 'enterprise';
  budget: 'minimal' | 'standard' | 'premium';
  customFeatures: string[];
}

export interface ProjectAnalysis {
  requirements: ProjectRequirements;
  recommendations: {
    frontend: {
      framework: string;
      reasoning: string;
      alternatives: string[];
      complexity: number;
      learningCurve: number;
    };
    backend: {
      framework: string;
      language: string;
      reasoning: string;
      alternatives: string[];
      complexity: number;
      learningCurve: number;
    };
    database: {
      type: string;
      specific: string;
      reasoning: string;
      alternatives: string[];
      complexity: number;
    };
    integrations: {
      name: string;
      purpose: string;
      priority: 'essential' | 'recommended' | 'optional';
      complexity: number;
    }[];
    deployment: {
      platform: string;
      reasoning: string;
      alternatives: string[];
      complexity: number;
      cost: string;
    };
  };
  architecture: {
    name: string;
    description: string;
    pros: string[];
    cons: string[];
    complexity: number;
    suitability: number;
    reasoning: string;
  }[];
  security: {
    authentication: {
      method: string;
      reasoning: string;
      implementation: string[];
    };
    authorization: {
      strategy: string;
      roles: string[];
      permissions: string[];
    };
    dataProtection: {
      encryption: string[];
      compliance: string[];
      privacy: string[];
    };
    apiSecurity: {
      rateLimit: boolean;
      cors: boolean;
      validation: string[];
    };
  };
  performance: {
    caching: {
      strategy: string;
      tools: string[];
      reasoning: string;
    };
    optimization: {
      frontend: string[];
      backend: string[];
      database: string[];
    };
    monitoring: {
      tools: string[];
      metrics: string[];
      alerting: string[];
    };
    scaling: {
      horizontal: boolean;
      vertical: boolean;
      strategies: string[];
    };
  };
  estimatedComplexity: number;
  estimatedTimeline: string;
  riskFactors: string[];
  successFactors: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: number;
  techStack: {
    frontend: string;
    backend: string;
    database: string;
  };
  features: string[];
  variables: {
    name: string;
    type: 'string' | 'boolean' | 'number' | 'select' | 'multiselect';
    description: string;
    required: boolean;
    default?: any;
    options?: string[];
  }[];
  prerequisites: string[];
}

export interface DeploymentConfig {
  platform: string;
  environment: 'development' | 'staging' | 'production';
  containerized: boolean;
  monitoring: boolean;
  backup: boolean;
  ssl: boolean;
  customDomain?: string;
  environmentVariables: Record<string, string>;
}

export interface WizardSession {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  currentStep: number;
  steps: WizardStep[];
  projectData: {
    name?: string;
    description?: string;
    analysis?: ProjectAnalysis;
    selectedTemplate?: string;
    customizations?: Record<string, any>;
    integrations?: string[];
    deploymentConfig?: DeploymentConfig;
  };
  status: 'active' | 'completed' | 'abandoned';
}

interface WizardState {
  // Session management
  sessionId: string | null;
  session: WizardSession | null;
  
  // Navigation
  currentStep: number;
  steps: WizardStep[];
  
  // Step data
  projectRequirements: Partial<ProjectRequirements>;
  projectAnalysis: ProjectAnalysis | null;
  selectedTemplate: Template | null;
  templateConfiguration: Record<string, any>;
  selectedIntegrations: string[];
  integrationConfigurations: Record<string, any>;
  deploymentConfig: DeploymentConfig;
  
  // Templates
  availableTemplates: Template[];
  
  // UI state
  isAnalyzing: boolean;
  isGeneratingPreview: boolean;
  isDeploying: boolean;
  isLoadingTemplates: boolean;
  
  // Preview data
  projectStructure: Record<string, string> | null;
  deploymentInstructions: string[];
  resourceEstimate: {
    cpu: string;
    memory: string;
    storage: string;
    bandwidth: string;
    cost: string;
  };
  
  // Error handling
  error: string | null;
  
  // Local storage
  autoSave: boolean;
  lastSaved: string | null;
}

const initialSteps: WizardStep[] = [
  {
    id: 'project-description',
    name: 'Project Description',
    description: 'Describe your project and requirements',
    completed: false,
  },
  {
    id: 'technology-selection',
    name: 'Technology Selection',
    description: 'Choose your technology stack',
    completed: false,
  },
  {
    id: 'template-configuration',
    name: 'Template Configuration',
    description: 'Customize your project template',
    completed: false,
  },
  {
    id: 'integration-setup',
    name: 'Integration Setup',
    description: 'Configure third-party integrations',
    completed: false,
  },
  {
    id: 'preview-deployment',
    name: 'Preview & Deployment',
    description: 'Review and deploy your project',
    completed: false,
  },
];

const initialState: WizardState = {
  sessionId: null,
  session: null,
  currentStep: 0,
  steps: initialSteps,
  projectRequirements: {},
  projectAnalysis: null,
  selectedTemplate: null,
  templateConfiguration: {},
  selectedIntegrations: [],
  integrationConfigurations: {},
  deploymentConfig: {
    platform: '',
    environment: 'development',
    containerized: true,
    monitoring: false,
    backup: false,
    ssl: true,
    environmentVariables: {}
  },
  availableTemplates: [],
  isAnalyzing: false,
  isGeneratingPreview: false,
  isDeploying: false,
  isLoadingTemplates: false,
  projectStructure: null,
  deploymentInstructions: [],
  resourceEstimate: {
    cpu: '0.5 vCPU',
    memory: '1 GB',
    storage: '10 GB',
    bandwidth: '100 GB',
    cost: '$5-20/month'
  },
  error: null,
  autoSave: true,
  lastSaved: null,
};

// API Configuration
const API_BASE_URL = 'http://192.168.1.235:4001';

// Async thunks
export const createWizardSession = createAsyncThunk(
  'wizard/createSession',
  async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/wizard/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to create wizard session: ${response.statusText}`);
    }
    return response.json();
  }
);

export const analyzeProject = createAsyncThunk(
  'wizard/analyzeProject',
  async (requirements: Partial<ProjectRequirements>) => {
    const response = await fetch(`${API_BASE_URL}/wizard/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: requirements.description,
        preferences: requirements,
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to analyze project: ${response.statusText}`);
    }
    return response.json();
  }
);

export const updateWizardStep = createAsyncThunk(
  'wizard/updateStep',
  async ({
    sessionId,
    stepId,
    data,
  }: {
    sessionId: string;
    stepId: string;
    data: any;
  }) => {
    const response = await fetch(`${API_BASE_URL}/wizard/session/${sessionId}/step/${stepId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update wizard step: ${response.statusText}`);
    }
    return response.json();
  }
);

export const generatePreview = createAsyncThunk(
  'wizard/generatePreview',
  async ({
    sessionId,
    stepId,
  }: {
    sessionId: string;
    stepId: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/wizard/session/${sessionId}/preview/${stepId}`);
    if (!response.ok) {
      throw new Error(`Failed to generate preview: ${response.statusText}`);
    }
    return response.json();
  }
);

export const completeWizard = createAsyncThunk(
  'wizard/complete',
  async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/wizard/session/${sessionId}/complete`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to complete wizard: ${response.statusText}`);
    }
    return response.json();
  }
);

export const getTemplates = createAsyncThunk(
  'wizard/getTemplates',
  async () => {
    const response = await fetch(`${API_BASE_URL}/wizard/templates`);
    if (!response.ok) {
      throw new Error(`Failed to get templates: ${response.statusText}`);
    }
    return response.json();
  }
);

export const getWizardSession = createAsyncThunk(
  'wizard/getSession',
  async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/wizard/session/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Failed to get wizard session: ${response.statusText}`);
    }
    return response.json();
  }
);

// Slice
const wizardSlice = createSlice({
  name: 'wizard',
  initialState,
  reducers: {
    // Navigation
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    nextStep: (state) => {
      if (state.currentStep < state.steps.length - 1) {
        state.currentStep += 1;
      }
    },
    previousStep: (state) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1;
      }
    },
    
    // Step management
    updateStepData: (state, action: PayloadAction<{ stepId: string; data: any }>) => {
      const { stepId, data } = action.payload;
      const step = state.steps.find(s => s.id === stepId);
      if (step) {
        step.data = data;
      }
    },
    
    setStepValidation: (state, action: PayloadAction<{
      stepId: string;
      validation: { isValid: boolean; errors: string[] };
    }>) => {
      const { stepId, validation } = action.payload;
      const step = state.steps.find(s => s.id === stepId);
      if (step) {
        step.validation = validation;
        step.completed = validation.isValid;
      }
    },
    
    // Project data updates
    updateProjectRequirements: (state, action: PayloadAction<Partial<ProjectRequirements>>) => {
      state.projectRequirements = {
        ...state.projectRequirements,
        ...action.payload,
      };
    },
    
    selectTemplate: (state, action: PayloadAction<Template>) => {
      state.selectedTemplate = action.payload;
      state.templateConfiguration = {};
    },
    
    updateTemplateConfiguration: (state, action: PayloadAction<Record<string, any>>) => {
      state.templateConfiguration = {
        ...state.templateConfiguration,
        ...action.payload,
      };
    },
    
    updateSelectedIntegrations: (state, action: PayloadAction<string[]>) => {
      state.selectedIntegrations = action.payload;
    },
    
    updateIntegrationConfiguration: (state, action: PayloadAction<{
      integrationId: string;
      configuration: any;
    }>) => {
      const { integrationId, configuration } = action.payload;
      state.integrationConfigurations[integrationId] = configuration;
    },
    
    updateDeploymentConfig: (state, action: PayloadAction<Partial<DeploymentConfig>>) => {
      state.deploymentConfig = {
        ...state.deploymentConfig,
        ...action.payload,
      };
    },
    
    // UI state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Local storage
    saveToLocalStorage: (state) => {
      if (state.autoSave) {
        const saveData = {
          currentStep: state.currentStep,
          projectRequirements: state.projectRequirements,
          selectedTemplate: state.selectedTemplate,
          templateConfiguration: state.templateConfiguration,
          selectedIntegrations: state.selectedIntegrations,
          integrationConfigurations: state.integrationConfigurations,
          deploymentConfig: state.deploymentConfig,
        };
        localStorage.setItem('vaporform-wizard', JSON.stringify(saveData));
        state.lastSaved = new Date().toISOString();
      }
    },
    
    loadFromLocalStorage: (state) => {
      const savedData = localStorage.getItem('vaporform-wizard');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          state.currentStep = parsedData.currentStep || 0;
          state.projectRequirements = parsedData.projectRequirements || {};
          state.selectedTemplate = parsedData.selectedTemplate || null;
          state.templateConfiguration = parsedData.templateConfiguration || {};
          state.selectedIntegrations = parsedData.selectedIntegrations || [];
          state.integrationConfigurations = parsedData.integrationConfigurations || {};
          state.deploymentConfig = parsedData.deploymentConfig || state.deploymentConfig;
        } catch (error) {
          console.error('Error loading wizard data from localStorage:', error);
        }
      }
    },
    
    clearLocalStorage: (state) => {
      localStorage.removeItem('vaporform-wizard');
      state.lastSaved = null;
    },
    
    // Reset wizard
    resetWizard: () => initialState,
  },
  
  extraReducers: (builder) => {
    // Create session
    builder.addCase(createWizardSession.fulfilled, (state, action) => {
      state.session = action.payload;
      state.sessionId = action.payload.id;
    });
    
    // Analyze project
    builder.addCase(analyzeProject.pending, (state) => {
      state.isAnalyzing = true;
      state.error = null;
    });
    builder.addCase(analyzeProject.fulfilled, (state, action) => {
      state.isAnalyzing = false;
      state.projectAnalysis = action.payload;
      
      // Auto-advance to next step
      if (state.currentStep === 0) {
        state.currentStep = 1;
      }
      
      // Mark first step as completed
      const firstStep = state.steps.find(s => s.id === 'project-description');
      if (firstStep) {
        firstStep.completed = true;
      }
    });
    builder.addCase(analyzeProject.rejected, (state, action) => {
      state.isAnalyzing = false;
      state.error = action.error.message || 'Failed to analyze project';
    });
    
    // Update step
    builder.addCase(updateWizardStep.fulfilled, (state, action) => {
      state.session = action.payload;
      if (action.payload.currentStep !== undefined) {
        state.currentStep = action.payload.currentStep;
      }
    });
    
    // Generate preview
    builder.addCase(generatePreview.pending, (state) => {
      state.isGeneratingPreview = true;
      state.error = null;
    });
    builder.addCase(generatePreview.fulfilled, (state, action) => {
      state.isGeneratingPreview = false;
      state.projectStructure = action.payload.projectStructure;
      state.resourceEstimate = action.payload.estimations || state.resourceEstimate;
    });
    builder.addCase(generatePreview.rejected, (state, action) => {
      state.isGeneratingPreview = false;
      state.error = action.error.message || 'Failed to generate preview';
    });
    
    // Complete wizard
    builder.addCase(completeWizard.pending, (state) => {
      state.isDeploying = true;
      state.error = null;
    });
    builder.addCase(completeWizard.fulfilled, (state, action) => {
      state.isDeploying = false;
      state.projectStructure = action.payload.projectFiles;
      state.deploymentInstructions = action.payload.deploymentInstructions;
      
      // Mark all steps as completed
      state.steps.forEach(step => {
        step.completed = true;
      });
      
      // Update session status
      if (state.session) {
        state.session.status = 'completed';
      }
    });
    builder.addCase(completeWizard.rejected, (state, action) => {
      state.isDeploying = false;
      state.error = action.error.message || 'Failed to complete wizard';
    });
    
    // Get templates
    builder.addCase(getTemplates.pending, (state) => {
      state.isLoadingTemplates = true;
      state.error = null;
    });
    builder.addCase(getTemplates.fulfilled, (state, action) => {
      state.isLoadingTemplates = false;
      state.availableTemplates = action.payload.templates;
    });
    builder.addCase(getTemplates.rejected, (state, action) => {
      state.isLoadingTemplates = false;
      state.error = action.error.message || 'Failed to load templates';
    });
    
    // Get wizard session
    builder.addCase(getWizardSession.fulfilled, (state, action) => {
      state.session = action.payload;
      state.sessionId = action.payload.id;
      state.currentStep = action.payload.currentStep;
      state.steps = action.payload.steps;
      if (action.payload.projectData) {
        state.projectRequirements = action.payload.projectData;
        if (action.payload.projectData.analysis) {
          state.projectAnalysis = action.payload.projectData.analysis;
        }
        if (action.payload.projectData.selectedTemplate) {
          // Find the selected template from available templates
          const template = state.availableTemplates.find(t => t.id === action.payload.projectData.selectedTemplate);
          if (template) {
            state.selectedTemplate = template;
          }
        }
        if (action.payload.projectData.customizations) {
          state.templateConfiguration = action.payload.projectData.customizations;
        }
        if (action.payload.projectData.integrations) {
          state.selectedIntegrations = action.payload.projectData.integrations;
        }
        if (action.payload.projectData.deploymentConfig) {
          state.deploymentConfig = action.payload.projectData.deploymentConfig;
        }
      }
    });
    builder.addCase(getWizardSession.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to load wizard session';
    });
  },
});

export const {
  setCurrentStep,
  nextStep,
  previousStep,
  updateStepData,
  setStepValidation,
  updateProjectRequirements,
  selectTemplate,
  updateTemplateConfiguration,
  updateSelectedIntegrations,
  updateIntegrationConfiguration,
  updateDeploymentConfig,
  setError,
  clearError,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  resetWizard,
} = wizardSlice.actions;

export default wizardSlice.reducer;
export { wizardSlice };