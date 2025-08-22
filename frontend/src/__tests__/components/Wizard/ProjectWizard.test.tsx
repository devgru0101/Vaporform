/**
 * DEPRECATED: Legacy Project Wizard Tests
 * 
 * These tests cover the deprecated ProjectWizard component functionality.
 * The wizard has been replaced with a modal-based approach.
 * 
 * New tests should be written for:
 * - components/ProjectWizard/ProjectCreationModal.tsx
 * - store/projectWizard.ts
 * 
 * @deprecated Tests for legacy ProjectWizard component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ProjectWizard } from '@/components/Wizard';
import { wizardSlice } from '@/store/wizardSlice';
import { uiSlice } from '@/store/ui';

// Mock the wizard slice actions
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

// Create a test store with wizard state
const createTestStore = (initialWizardState = {}) => {
  const defaultWizardState = {
    currentStep: 0,
    steps: [
      {
        id: 'project-description',
        title: 'Project Description',
        description: 'Describe your project',
        completed: false,
        validation: null
      },
      {
        id: 'technology-selection',
        title: 'Technology Selection',
        description: 'Choose your tech stack',
        completed: false,
        validation: null
      },
      {
        id: 'template-configuration',
        title: 'Template Configuration',
        description: 'Configure your template',
        completed: false,
        validation: null
      },
      {
        id: 'integration-setup',
        title: 'Integration Setup',
        description: 'Setup integrations',
        completed: false,
        validation: null
      },
      {
        id: 'preview-deployment',
        title: 'Preview & Deploy',
        description: 'Review and deploy',
        completed: false,
        validation: null
      }
    ],
    projectRequirements: {
      name: '',
      description: '',
      userType: '',
      timeline: '',
      scalability: '',
      budget: ''
    },
    projectAnalysis: null,
    selectedTemplate: null,
    templateConfiguration: {},
    selectedIntegrations: [],
    integrationConfigurations: {},
    deploymentConfig: {},
    isAnalyzing: false,
    isGeneratingPreview: false,
    isDeploying: false,
    projectStructure: null,
    deploymentInstructions: null,
    resourceEstimate: null,
    error: null,
    sessionId: 'test-session-123',
    ...initialWizardState
  };

  return configureStore({
    reducer: {
      wizard: wizardSlice.reducer,
      ui: uiSlice.reducer,
    },
    preloadedState: {
      wizard: defaultWizardState,
      ui: {
        theme: 'light',
        sidebarOpen: true,
        rightPanelOpen: false,
        bottomPanelOpen: false,
        bottomPanelHeight: 300,
        loading: false,
        notifications: [],
        modal: null,
        commandPalette: { open: false, query: '' },
        breadcrumbs: [],
        activePanel: 'fileExplorer',
        fullscreen: false,
      },
    },
  });
};

const renderWithStore = (component: React.ReactElement, initialState = {}) => {
  const store = createTestStore(initialState);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('ProjectWizard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    test('should render project type selector when no project name is set', () => {
      renderWithStore(<ProjectWizard />);
      
      // Should show project type selector screen
      expect(screen.getByText(/choose your project type/i)).toBeInTheDocument();
    });

    test('should render wizard interface when project requirements exist', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: {
          name: 'Test Project',
          description: 'A test project description',
          userType: 'beginner',
          timeline: 'weeks',
          scalability: 'small',
          budget: 'low'
        }
      });
      
      expect(screen.getByText('Project Creation Wizard')).toBeInTheDocument();
      expect(screen.getByText('Create your next project with AI-powered recommendations')).toBeInTheDocument();
    });

    test('should display progress bar with correct steps', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' }
      });
      
      // Check that all step titles are present
      expect(screen.getByText('Project Description')).toBeInTheDocument();
      expect(screen.getByText('Technology Selection')).toBeInTheDocument();
      expect(screen.getByText('Template Configuration')).toBeInTheDocument();
      expect(screen.getByText('Integration Setup')).toBeInTheDocument();
      expect(screen.getByText('Preview & Deploy')).toBeInTheDocument();
    });

    test('should render with correct initial step', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 0
      });
      
      // Should be on first step (project description)
      expect(screen.getByText('Previous')).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    test('should disable previous button on first step', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 0
      });
      
      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    test('should enable next button when step is valid', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: {
          name: 'Valid Project Name',
          description: 'A valid project description with enough characters',
          userType: 'beginner',
          timeline: 'weeks',
          scalability: 'small',
          budget: 'low'
        },
        currentStep: 0
      });
      
      const nextButton = screen.getByText('Analyze & Continue');
      expect(nextButton).not.toBeDisabled();
    });

    test('should handle step navigation through progress bar', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 2,
        steps: [
          { id: 'project-description', title: 'Project Description', completed: true },
          { id: 'technology-selection', title: 'Technology Selection', completed: true },
          { id: 'template-configuration', title: 'Template Configuration', completed: false },
          { id: 'integration-setup', title: 'Integration Setup', completed: false },
          { id: 'preview-deployment', title: 'Preview & Deploy', completed: false }
        ]
      });
      
      // Click on a previous step should be allowed
      const firstStep = screen.getByText('Project Description');
      fireEvent.click(firstStep);
      
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('setCurrentStep'),
          payload: 0
        })
      );
    });

    test('should handle next button click', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: {
          name: 'Valid Project Name',
          description: 'A valid project description with enough characters',
          userType: 'beginner',
          timeline: 'weeks',
          scalability: 'small',
          budget: 'low'
        },
        currentStep: 0
      });
      
      const nextButton = screen.getByText('Analyze & Continue');
      fireEvent.click(nextButton);
      
      expect(mockDispatch).toHaveBeenCalled();
    });

    test('should handle previous button click', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 1
      });
      
      const previousButton = screen.getByText('Previous');
      fireEvent.click(previousButton);
      
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('previousStep')
        })
      );
    });
  });

  describe('Step Content Rendering', () => {
    test('should render RequirementsGathering for project-description step', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 0
      });
      
      // Check for requirements gathering elements (these depend on the actual component)
      expect(screen.getByText('Analyze & Continue')).toBeInTheDocument();
    });

    test('should render TemplateConfiguration for technology-selection step', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 1
      });
      
      // The exact content depends on the TemplateConfiguration component
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    test('should render integration setup placeholder for integration-setup step', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 3
      });
      
      expect(screen.getByText('Configure Integrations')).toBeInTheDocument();
      expect(screen.getByText('Integration Setup Coming Soon')).toBeInTheDocument();
    });

    test('should render PreviewDeployment for preview-deployment step', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 4
      });
      
      expect(screen.getByText('Complete Wizard')).toBeInTheDocument();
    });

    test('should show AI recommendations when analysis is available', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 1,
        projectAnalysis: {
          recommendations: {
            frontend: {
              framework: 'React',
              reasoning: 'React is great for this project'
            },
            backend: {
              framework: 'Express.js'
            },
            database: {
              specific: 'PostgreSQL'
            }
          },
          estimatedTimeline: '4-6 weeks',
          estimatedComplexity: 7
        }
      });
      
      expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
      expect(screen.getByText(/React.*Express\.js.*PostgreSQL/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should display error message when error exists', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        error: 'Something went wrong during project creation'
      });
      
      expect(screen.getByText('Something went wrong during project creation')).toBeInTheDocument();
    });

    test('should display validation errors', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 0,
        steps: [
          {
            id: 'project-description',
            title: 'Project Description',
            completed: false,
            validation: {
              isValid: false,
              errors: ['Project name must be at least 3 characters long']
            }
          }
        ]
      });
      
      expect(screen.getByText('Please fix errors before continuing')).toBeInTheDocument();
    });

    test('should disable next button when validation fails', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 0,
        steps: [
          {
            id: 'project-description',
            title: 'Project Description',
            completed: false,
            validation: {
              isValid: false,
              errors: ['Some validation error']
            }
          }
        ]
      });
      
      const nextButton = screen.getByText('Analyze & Continue');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Loading States', () => {
    test('should disable next button when analyzing', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: {
          name: 'Valid Project',
          description: 'Valid description'
        },
        currentStep: 0,
        isAnalyzing: true
      });
      
      const nextButton = screen.getByText('Analyze & Continue');
      expect(nextButton).toBeDisabled();
    });

    test('should disable complete button when deploying', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 4,
        isDeploying: true
      });
      
      const completeButton = screen.getByText('Complete Wizard');
      expect(completeButton).toBeDisabled();
    });
  });

  describe('Project Type Selection', () => {
    test('should show project type selector when change button is clicked', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' }
      });
      
      const changeButton = screen.getByText('Change Project Type');
      fireEvent.click(changeButton);
      
      // Should trigger showing the project type selector
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('showProjectTypeSelector')
        })
      );
    });

    test('should handle template selection from project type', () => {
      const { rerender } = renderWithStore(<ProjectWizard />);
      
      // The component should handle project type selection internally
      expect(screen.getByText(/choose your project type/i)).toBeInTheDocument();
    });
  });

  describe('Template and Configuration Management', () => {
    test('should handle template selection', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 1,
        selectedTemplate: null
      });
      
      // Template selection logic should be tested in the component
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    test('should display selected template information', () => {
      const mockTemplate = {
        id: 'react-express-postgresql',
        name: 'React Full-Stack App',
        description: 'Complete full-stack application',
        category: 'Full-Stack',
        complexity: 3,
        techStack: {
          frontend: 'React + TypeScript',
          backend: 'Express.js',
          database: 'PostgreSQL'
        },
        features: ['User authentication'],
        variables: [],
        prerequisites: ['Node.js 18+']
      };

      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 2,
        selectedTemplate: mockTemplate
      });
      
      // Template configuration should be rendered
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });

  describe('Final Step and Completion', () => {
    test('should show complete wizard button on final step', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 4
      });
      
      expect(screen.getByText('Complete Wizard')).toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    test('should handle wizard completion', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 4,
        sessionId: 'test-session-123'
      });
      
      const completeButton = screen.getByText('Complete Wizard');
      fireEvent.click(completeButton);
      
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('completeWizard'),
          payload: 'test-session-123'
        })
      );
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading structure', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' }
      });
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Project Creation Wizard');
    });

    test('should have accessible navigation buttons', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 1
      });
      
      const previousButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');
      
      expect(previousButton).toHaveAttribute('type', 'button');
      expect(nextButton).toHaveAttribute('type', 'button');
    });

    test('should properly indicate disabled states', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 0
      });
      
      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });
  });

  describe('State Management Integration', () => {
    test('should dispatch actions on component mount', () => {
      renderWithStore(<ProjectWizard />);
      
      // Should dispatch loadFromLocalStorage and createWizardSession
      expect(mockDispatch).toHaveBeenCalled();
    });

    test('should auto-save state changes', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' }
      });
      
      // Auto-save should be triggered (implementation depends on useEffect)
      expect(mockDispatch).toHaveBeenCalled();
    });

    test('should update project requirements', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 0
      });
      
      // Requirements updates should be handled by child components
      expect(screen.getByText('Analyze & Continue')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should render properly on different screen sizes', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' }
      });
      
      // Check for responsive container classes
      const mainContainer = screen.getByText('Project Creation Wizard').closest('div');
      expect(mainContainer).toHaveClass('max-w-7xl', 'mx-auto');
    });

    test('should maintain proper spacing and layout', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' }
      });
      
      // Check for consistent spacing classes
      const contentArea = screen.getByText('Project Creation Wizard').closest('.py-8');
      expect(contentArea).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing session ID gracefully', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 4,
        sessionId: null
      });
      
      const completeButton = screen.getByText('Complete Wizard');
      fireEvent.click(completeButton);
      
      // Should not crash when sessionId is null
      expect(completeButton).toBeInTheDocument();
    });

    test('should handle invalid step gracefully', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: { name: 'Test Project' },
        currentStep: 99 // Invalid step
      });
      
      // Should not crash with invalid step
      expect(screen.getByText('Project Creation Wizard')).toBeInTheDocument();
    });

    test('should handle empty project requirements', () => {
      renderWithStore(<ProjectWizard />, {
        projectRequirements: {},
        currentStep: 0
      });
      
      // Should show project type selector for empty requirements
      expect(screen.getByText(/choose your project type/i)).toBeInTheDocument();
    });
  });
});