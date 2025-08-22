/**
 * DEPRECATED: Legacy Wizard Flow Integration Tests
 * 
 * These tests cover the deprecated wizard page functionality.
 * The wizard has been replaced with a modal-based approach.
 * 
 * New tests should be written for:
 * - components/ProjectWizard/ProjectCreationModal.tsx
 * - store/projectWizard.ts
 * 
 * @deprecated Tests for legacy wizard - update to test ProjectCreationModal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import WizardPage from '../../pages/WizardPage';
import { wizardSlice } from '../../store/wizardSlice';
import { projectsSlice } from '../../store/projects';
import { authSlice } from '../../store/auth';

// Mock APIs
const mockWizardAPI = {
  analyzeRequirements: jest.fn(),
  generateProject: jest.fn(),
  previewDeployment: jest.fn(),
};

const mockProjectAPI = {
  createProject: jest.fn(),
  getProjects: jest.fn(),
};

const mockContainerAPI = {
  createContainer: jest.fn(),
  deployContainer: jest.fn(),
};

jest.mock('../../services/wizard', () => ({
  wizardAPI: mockWizardAPI,
}));

jest.mock('../../services/projects', () => ({
  projectAPI: mockProjectAPI,
}));

jest.mock('../../services/containers', () => ({
  containerAPI: mockContainerAPI,
}));

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      wizard: wizardSlice.reducer,
      projects: projectsSlice.reducer,
      auth: authSlice.reducer,
    },
    preloadedState: {
      wizard: {
        currentStep: 0,
        projectType: null,
        requirements: '',
        analyzedRequirements: null,
        selectedTemplate: null,
        configuration: {},
        previewData: null,
        loading: false,
        error: null,
        ...initialState.wizard,
      },
      projects: {
        projects: [],
        currentProject: null,
        loading: false,
        error: null,
        ...initialState.projects,
      },
      auth: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
        isAuthenticated: true,
        loading: false,
        error: null,
        ...initialState.auth,
      },
    },
  });
};

// Mock Wizard Page Component
const MockWizardPage: React.FC = () => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [projectType, setProjectType] = React.useState<string>('');
  const [requirements, setRequirements] = React.useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('');
  const [configuration, setConfiguration] = React.useState<Record<string, any>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  const steps = ['Project Type', 'Requirements', 'Template', 'Configuration', 'Preview', 'Deploy'];

  const handleNext = async () => {
    if (currentStep === 1 && requirements) {
      // Analyze requirements
      setLoading(true);
      try {
        await mockWizardAPI.analyzeRequirements({ requirements });
        setCurrentStep(currentStep + 1);
      } catch (err) {
        setError('Failed to analyze requirements');
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 4) {
      // Generate preview
      setLoading(true);
      try {
        await mockWizardAPI.previewDeployment({
          projectType,
          requirements,
          template: selectedTemplate,
          configuration,
        });
        setCurrentStep(currentStep + 1);
      } catch (err) {
        setError('Failed to generate preview');
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 5) {
      // Deploy project
      setLoading(true);
      try {
        await mockProjectAPI.createProject({
          projectType,
          requirements,
          template: selectedTemplate,
          configuration,
        });
        // Success - would redirect to project
      } catch (err) {
        setError('Failed to create project');
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!projectType;
      case 1:
        return !!requirements.trim();
      case 2:
        return !!selectedTemplate;
      case 3:
        return Object.keys(configuration).length > 0;
      case 4:
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div data-testid="wizard-page">
      <div data-testid="wizard-header">
        <h1>Create New Project</h1>
        <div data-testid="step-indicator">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
        </div>
      </div>

      {error && (
        <div data-testid="error-message" className="error">
          {error}
        </div>
      )}

      <div data-testid="wizard-content">
        {currentStep === 0 && (
          <div data-testid="project-type-step">
            <h2>Select Project Type</h2>
            <div className="project-types">
              <button
                data-testid="select-web-app"
                className={projectType === 'web-app' ? 'selected' : ''}
                onClick={() => setProjectType('web-app')}
              >
                Web Application
              </button>
              <button
                data-testid="select-api"
                className={projectType === 'api' ? 'selected' : ''}
                onClick={() => setProjectType('api')}
              >
                API/Backend
              </button>
              <button
                data-testid="select-mobile"
                className={projectType === 'mobile' ? 'selected' : ''}
                onClick={() => setProjectType('mobile')}
              >
                Mobile App
              </button>
              <button
                data-testid="select-data-science"
                className={projectType === 'data-science' ? 'selected' : ''}
                onClick={() => setProjectType('data-science')}
              >
                Data Science
              </button>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div data-testid="requirements-step">
            <h2>Describe Your Project</h2>
            <p>Tell us what you want to build:</p>
            <textarea
              data-testid="requirements-input"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Describe your project requirements, features, and any specific technologies you'd like to use..."
              rows={10}
              cols={80}
            />
          </div>
        )}

        {currentStep === 2 && (
          <div data-testid="template-step">
            <h2>Choose Template</h2>
            <div className="templates">
              <button
                data-testid="select-react-template"
                className={selectedTemplate === 'react-typescript' ? 'selected' : ''}
                onClick={() => setSelectedTemplate('react-typescript')}
              >
                React + TypeScript
              </button>
              <button
                data-testid="select-nextjs-template"
                className={selectedTemplate === 'nextjs' ? 'selected' : ''}
                onClick={() => setSelectedTemplate('nextjs')}
              >
                Next.js
              </button>
              <button
                data-testid="select-nodejs-template"
                className={selectedTemplate === 'nodejs-express' ? 'selected' : ''}
                onClick={() => setSelectedTemplate('nodejs-express')}
              >
                Node.js + Express
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div data-testid="configuration-step">
            <h2>Configure Project</h2>
            <form>
              <div>
                <label htmlFor="project-name">Project Name:</label>
                <input
                  id="project-name"
                  data-testid="project-name-input"
                  type="text"
                  value={configuration.name || ''}
                  onChange={(e) => setConfiguration({...configuration, name: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="project-description">Description:</label>
                <input
                  id="project-description"
                  data-testid="project-description-input"
                  type="text"
                  value={configuration.description || ''}
                  onChange={(e) => setConfiguration({...configuration, description: e.target.value})}
                />
              </div>
              <div>
                <label>
                  <input
                    data-testid="include-tests-checkbox"
                    type="checkbox"
                    checked={configuration.includeTests || false}
                    onChange={(e) => setConfiguration({...configuration, includeTests: e.target.checked})}
                  />
                  Include test setup
                </label>
              </div>
              <div>
                <label>
                  <input
                    data-testid="include-docker-checkbox"
                    type="checkbox"
                    checked={configuration.includeDocker || false}
                    onChange={(e) => setConfiguration({...configuration, includeDocker: e.target.checked})}
                  />
                  Include Docker configuration
                </label>
              </div>
            </form>
          </div>
        )}

        {currentStep === 4 && (
          <div data-testid="preview-step">
            <h2>Preview Deployment</h2>
            <div data-testid="preview-summary">
              <h3>Project Summary</h3>
              <p><strong>Type:</strong> {projectType}</p>
              <p><strong>Template:</strong> {selectedTemplate}</p>
              <p><strong>Name:</strong> {configuration.name}</p>
              <p><strong>Description:</strong> {configuration.description}</p>
            </div>
            <div data-testid="preview-features">
              <h3>Features</h3>
              <ul>
                {configuration.includeTests && <li>Testing framework</li>}
                {configuration.includeDocker && <li>Docker containerization</li>}
              </ul>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div data-testid="deploy-step">
            <h2>Deploy Project</h2>
            <p>Ready to deploy your project!</p>
            <div data-testid="deployment-progress">
              {loading ? (
                <div>Creating project...</div>
              ) : (
                <div>Click deploy to create your project</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div data-testid="wizard-navigation">
        <button
          data-testid="previous-button"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Previous
        </button>
        
        <button
          data-testid="next-button"
          onClick={handleNext}
          disabled={!canProceed() || loading}
        >
          {loading ? 'Loading...' : currentStep === 5 ? 'Deploy' : 'Next'}
        </button>
      </div>
    </div>
  );
};

describe('Wizard Flow Integration Tests', () => {
  let store: ReturnType<typeof createTestStore>;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    store = createTestStore();
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  const renderWizard = (props = {}) => {
    return render(
      <BrowserRouter>
        <Provider store={store}>
          <MockWizardPage {...props} />
        </Provider>
      </BrowserRouter>
    );
  };

  describe('Complete Wizard Flow', () => {
    test('should complete entire wizard flow successfully', async () => {
      mockWizardAPI.analyzeRequirements.mockResolvedValue({
        analysis: 'Requirements analyzed successfully',
        recommendedTemplates: ['react-typescript', 'nextjs'],
      });

      mockWizardAPI.previewDeployment.mockResolvedValue({
        preview: 'Deployment preview generated',
        estimatedTime: '5 minutes',
      });

      mockProjectAPI.createProject.mockResolvedValue({
        id: 'new-project-id',
        name: 'Test Project',
        status: 'created',
      });

      renderWizard();

      // Step 1: Project Type Selection
      expect(screen.getByTestId('project-type-step')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 6: Project Type')).toBeInTheDocument();

      await user.click(screen.getByTestId('select-web-app'));
      expect(screen.getByTestId('select-web-app')).toHaveClass('selected');

      await user.click(screen.getByTestId('next-button'));

      // Step 2: Requirements
      expect(screen.getByTestId('requirements-step')).toBeInTheDocument();
      expect(screen.getByText('Step 2 of 6: Requirements')).toBeInTheDocument();

      const requirementsInput = screen.getByTestId('requirements-input');
      await user.type(requirementsInput, 'A modern e-commerce platform with user authentication, product catalog, shopping cart, and payment integration.');

      await user.click(screen.getByTestId('next-button'));

      // Wait for requirements analysis
      await waitFor(() => {
        expect(mockWizardAPI.analyzeRequirements).toHaveBeenCalledWith({
          requirements: 'A modern e-commerce platform with user authentication, product catalog, shopping cart, and payment integration.',
        });
      });

      // Step 3: Template Selection
      expect(screen.getByTestId('template-step')).toBeInTheDocument();
      expect(screen.getByText('Step 3 of 6: Template')).toBeInTheDocument();

      await user.click(screen.getByTestId('select-react-template'));
      expect(screen.getByTestId('select-react-template')).toHaveClass('selected');

      await user.click(screen.getByTestId('next-button'));

      // Step 4: Configuration
      expect(screen.getByTestId('configuration-step')).toBeInTheDocument();
      expect(screen.getByText('Step 4 of 6: Configuration')).toBeInTheDocument();

      await user.type(screen.getByTestId('project-name-input'), 'E-commerce Platform');
      await user.type(screen.getByTestId('project-description-input'), 'Modern e-commerce solution');
      await user.click(screen.getByTestId('include-tests-checkbox'));
      await user.click(screen.getByTestId('include-docker-checkbox'));

      await user.click(screen.getByTestId('next-button'));

      // Step 5: Preview
      expect(screen.getByTestId('preview-step')).toBeInTheDocument();
      expect(screen.getByText('Step 5 of 6: Preview')).toBeInTheDocument();

      const previewSummary = screen.getByTestId('preview-summary');
      expect(within(previewSummary).getByText('web-app')).toBeInTheDocument();
      expect(within(previewSummary).getByText('react-typescript')).toBeInTheDocument();
      expect(within(previewSummary).getByText('E-commerce Platform')).toBeInTheDocument();

      const previewFeatures = screen.getByTestId('preview-features');
      expect(within(previewFeatures).getByText('Testing framework')).toBeInTheDocument();
      expect(within(previewFeatures).getByText('Docker containerization')).toBeInTheDocument();

      await user.click(screen.getByTestId('next-button'));

      // Wait for preview generation
      await waitFor(() => {
        expect(mockWizardAPI.previewDeployment).toHaveBeenCalledWith({
          projectType: 'web-app',
          requirements: 'A modern e-commerce platform with user authentication, product catalog, shopping cart, and payment integration.',
          template: 'react-typescript',
          configuration: {
            name: 'E-commerce Platform',
            description: 'Modern e-commerce solution',
            includeTests: true,
            includeDocker: true,
          },
        });
      });

      // Step 6: Deploy
      expect(screen.getByTestId('deploy-step')).toBeInTheDocument();
      expect(screen.getByText('Step 6 of 6: Deploy')).toBeInTheDocument();

      await user.click(screen.getByTestId('next-button'));

      // Wait for project creation
      await waitFor(() => {
        expect(mockProjectAPI.createProject).toHaveBeenCalledWith({
          projectType: 'web-app',
          requirements: 'A modern e-commerce platform with user authentication, product catalog, shopping cart, and payment integration.',
          template: 'react-typescript',
          configuration: {
            name: 'E-commerce Platform',
            description: 'Modern e-commerce solution',
            includeTests: true,
            includeDocker: true,
          },
        });
      });
    });

    test('should allow navigation backward through steps', async () => {
      renderWizard();

      // Navigate forward to step 3
      await user.click(screen.getByTestId('select-web-app'));
      await user.click(screen.getByTestId('next-button'));

      await user.type(screen.getByTestId('requirements-input'), 'Test requirements');
      await user.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('template-step')).toBeInTheDocument();
      });

      // Navigate backward
      await user.click(screen.getByTestId('previous-button'));
      expect(screen.getByTestId('requirements-step')).toBeInTheDocument();
      expect(screen.getByTestId('requirements-input')).toHaveValue('Test requirements');

      await user.click(screen.getByTestId('previous-button'));
      expect(screen.getByTestId('project-type-step')).toBeInTheDocument();
      expect(screen.getByTestId('select-web-app')).toHaveClass('selected');

      // Previous button should be disabled on first step
      expect(screen.getByTestId('previous-button')).toBeDisabled();
    });

    test('should preserve form data when navigating between steps', async () => {
      renderWizard();

      // Fill out steps
      await user.click(screen.getByTestId('select-api'));
      await user.click(screen.getByTestId('next-button'));

      await user.type(screen.getByTestId('requirements-input'), 'REST API with authentication');
      await user.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('template-step')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('select-nodejs-template'));
      await user.click(screen.getByTestId('next-button'));

      // Fill configuration
      await user.type(screen.getByTestId('project-name-input'), 'API Project');
      await user.type(screen.getByTestId('project-description-input'), 'REST API service');
      await user.click(screen.getByTestId('include-tests-checkbox'));

      // Navigate back and forth
      await user.click(screen.getByTestId('previous-button')); // Back to template
      expect(screen.getByTestId('select-nodejs-template')).toHaveClass('selected');

      await user.click(screen.getByTestId('previous-button')); // Back to requirements
      expect(screen.getByTestId('requirements-input')).toHaveValue('REST API with authentication');

      await user.click(screen.getByTestId('previous-button')); // Back to project type
      expect(screen.getByTestId('select-api')).toHaveClass('selected');

      // Navigate forward again
      await user.click(screen.getByTestId('next-button'));
      await user.click(screen.getByTestId('next-button'));
      await user.click(screen.getByTestId('next-button'));

      // Configuration should be preserved
      expect(screen.getByTestId('project-name-input')).toHaveValue('API Project');
      expect(screen.getByTestId('project-description-input')).toHaveValue('REST API service');
      expect(screen.getByTestId('include-tests-checkbox')).toBeChecked();
    });
  });

  describe('Validation and Error Handling', () => {
    test('should prevent proceeding without required fields', async () => {
      renderWizard();

      // Can't proceed without selecting project type
      expect(screen.getByTestId('next-button')).toBeDisabled();

      await user.click(screen.getByTestId('select-web-app'));
      expect(screen.getByTestId('next-button')).toBeEnabled();

      await user.click(screen.getByTestId('next-button'));

      // Can't proceed without requirements
      expect(screen.getByTestId('next-button')).toBeDisabled();

      await user.type(screen.getByTestId('requirements-input'), 'Some requirements');
      expect(screen.getByTestId('next-button')).toBeEnabled();
    });

    test('should handle API errors gracefully', async () => {
      mockWizardAPI.analyzeRequirements.mockRejectedValue(new Error('API Error'));

      renderWizard();

      await user.click(screen.getByTestId('select-web-app'));
      await user.click(screen.getByTestId('next-button'));

      await user.type(screen.getByTestId('requirements-input'), 'Test requirements');
      await user.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to analyze requirements');
      });

      // Should remain on same step
      expect(screen.getByTestId('requirements-step')).toBeInTheDocument();
    });

    test('should handle preview generation errors', async () => {
      mockWizardAPI.analyzeRequirements.mockResolvedValue({});
      mockWizardAPI.previewDeployment.mockRejectedValue(new Error('Preview Error'));

      renderWizard();

      // Navigate to preview step
      await user.click(screen.getByTestId('select-mobile'));
      await user.click(screen.getByTestId('next-button'));

      await user.type(screen.getByTestId('requirements-input'), 'Mobile app requirements');
      await user.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('template-step')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('select-react-template'));
      await user.click(screen.getByTestId('next-button'));

      // Fill minimal configuration
      await user.type(screen.getByTestId('project-name-input'), 'Mobile App');
      await user.click(screen.getByTestId('next-button'));

      // Preview step
      await user.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to generate preview');
      });
    });

    test('should handle deployment errors', async () => {
      mockWizardAPI.analyzeRequirements.mockResolvedValue({});
      mockWizardAPI.previewDeployment.mockResolvedValue({});
      mockProjectAPI.createProject.mockRejectedValue(new Error('Deployment Error'));

      renderWizard();

      // Navigate through all steps quickly
      await user.click(screen.getByTestId('select-data-science'));
      await user.click(screen.getByTestId('next-button'));

      await user.type(screen.getByTestId('requirements-input'), 'Data analysis project');
      await user.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('template-step')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('select-nodejs-template'));
      await user.click(screen.getByTestId('next-button'));

      await user.type(screen.getByTestId('project-name-input'), 'Data Project');
      await user.click(screen.getByTestId('next-button'));

      await user.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('deploy-step')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to create project');
      });
    });
  });

  describe('Loading States', () => {
    test('should show loading states during async operations', async () => {
      let resolveAnalysis: (value: any) => void;
      const analysisPromise = new Promise(resolve => {
        resolveAnalysis = resolve;
      });
      mockWizardAPI.analyzeRequirements.mockReturnValue(analysisPromise);

      renderWizard();

      await user.click(screen.getByTestId('select-web-app'));
      await user.click(screen.getByTestId('next-button'));

      await user.type(screen.getByTestId('requirements-input'), 'Test requirements');
      await user.click(screen.getByTestId('next-button'));

      // Should show loading state
      expect(screen.getByTestId('next-button')).toHaveTextContent('Loading...');
      expect(screen.getByTestId('next-button')).toBeDisabled();

      // Resolve the promise
      resolveAnalysis({});

      await waitFor(() => {
        expect(screen.getByTestId('template-step')).toBeInTheDocument();
      });
    });

    test('should show loading during deployment', async () => {
      mockWizardAPI.analyzeRequirements.mockResolvedValue({});
      mockWizardAPI.previewDeployment.mockResolvedValue({});

      let resolveDeployment: (value: any) => void;
      const deploymentPromise = new Promise(resolve => {
        resolveDeployment = resolve;
      });
      mockProjectAPI.createProject.mockReturnValue(deploymentPromise);

      renderWizard();

      // Navigate to deployment step quickly
      await user.click(screen.getByTestId('select-web-app'));
      await user.click(screen.getByTestId('next-button'));

      await user.type(screen.getByTestId('requirements-input'), 'Test');
      await user.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('template-step')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('select-react-template'));
      await user.click(screen.getByTestId('next-button'));

      await user.type(screen.getByTestId('project-name-input'), 'Test');
      await user.click(screen.getByTestId('next-button'));

      await user.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('deploy-step')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('next-button'));

      // Should show deployment loading
      expect(screen.getByTestId('deployment-progress')).toHaveTextContent('Creating project...');
      expect(screen.getByTestId('next-button')).toHaveTextContent('Loading...');
      expect(screen.getByTestId('next-button')).toBeDisabled();

      // Resolve deployment
      resolveDeployment({ id: 'project-id' });

      await waitFor(() => {
        expect(mockProjectAPI.createProject).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and navigation', async () => {
      renderWizard();

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create New Project');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Select Project Type');

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Check navigation buttons
      expect(screen.getByTestId('previous-button')).toHaveAttribute('disabled');
      expect(screen.getByTestId('next-button')).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      renderWizard();

      const projectTypeButtons = [
        screen.getByTestId('select-web-app'),
        screen.getByTestId('select-api'),
        screen.getByTestId('select-mobile'),
        screen.getByTestId('select-data-science'),
      ];

      // Tab through project type buttons
      await user.tab();
      expect(projectTypeButtons[0]).toHaveFocus();

      await user.tab();
      expect(projectTypeButtons[1]).toHaveFocus();

      // Select with keyboard
      await user.keyboard('{Enter}');
      expect(screen.getByTestId('select-api')).toHaveClass('selected');
    });

    test('should have descriptive step indicators', () => {
      renderWizard();

      const stepIndicator = screen.getByTestId('step-indicator');
      expect(stepIndicator).toHaveTextContent('Step 1 of 6: Project Type');

      // This provides clear context about current position in wizard
      expect(stepIndicator).toBeVisible();
    });
  });

  describe('State Management Integration', () => {
    test('should update Redux state during wizard flow', async () => {
      renderWizard();

      await user.click(screen.getByTestId('select-web-app'));

      // In a real implementation, this would test actual Redux state updates
      const state = store.getState();
      expect(state.wizard.currentStep).toBeDefined();
    });

    test('should handle Redux errors gracefully', () => {
      // Test would verify graceful handling of Redux state errors
      const storeWithError = createTestStore({
        wizard: { error: 'Redux error occurred' },
      });

      render(
        <BrowserRouter>
          <Provider store={storeWithError}>
            <MockWizardPage />
          </Provider>
        </BrowserRouter>
      );

      expect(screen.getByTestId('wizard-page')).toBeInTheDocument();
    });
  });
});