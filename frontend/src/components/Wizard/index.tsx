import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { WizardProgress } from './WizardProgress';
import { ProjectTypeSelector } from './ProjectTypeSelector';
import { RequirementsGathering } from './RequirementsGathering';
import { TemplateConfiguration } from './TemplateConfiguration';
import { PreviewDeployment } from './PreviewDeployment';
import { 
  setCurrentStep,
  nextStep,
  previousStep,
  updateProjectRequirements,
  selectTemplate,
  updateTemplateConfiguration,
  updateSelectedIntegrations,
  updateIntegrationConfiguration,
  updateDeploymentConfig,
  analyzeProject,
  generatePreview,
  completeWizard,
  createWizardSession,
  saveToLocalStorage,
  loadFromLocalStorage,
  setStepValidation,
} from '../../store/wizardSlice';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '../ui/Icons';

// Mock templates data
const mockTemplates = [
  {
    id: 'react-express-postgresql',
    name: 'React Full-Stack App',
    description: 'Complete full-stack application with React frontend, Express.js backend, and PostgreSQL database',
    category: 'Full-Stack',
    complexity: 3,
    techStack: {
      frontend: 'React + TypeScript',
      backend: 'Express.js',
      database: 'PostgreSQL'
    },
    features: [
      'User authentication',
      'CRUD operations',
      'Responsive design',
      'API documentation',
      'Database migrations',
      'TypeScript support'
    ],
    variables: [
      {
        name: 'projectName',
        type: 'string' as const,
        description: 'Project name (used for package.json and folder names)',
        required: true
      },
      {
        name: 'description',
        type: 'string' as const,
        description: 'Project description',
        required: true
      },
      {
        name: 'authProvider',
        type: 'select' as const,
        description: 'Authentication provider',
        options: ['local', 'auth0', 'firebase', 'supabase'],
        default: 'local',
        required: true
      },
      {
        name: 'includeAdmin',
        type: 'boolean' as const,
        description: 'Include admin dashboard',
        default: false,
        required: false
      }
    ],
    prerequisites: ['Node.js 18+', 'PostgreSQL 14+', 'Docker']
  }
];

export const ProjectWizard: React.FC = () => {
  const dispatch = useDispatch();
  const {
    currentStep,
    steps,
    projectRequirements,
    projectAnalysis,
    selectedTemplate,
    templateConfiguration,
    selectedIntegrations,
    integrationConfigurations,
    deploymentConfig,
    isAnalyzing,
    isGeneratingPreview,
    isDeploying,
    projectStructure,
    deploymentInstructions,
    resourceEstimate,
    error,
    sessionId,
  } = useSelector((state: RootState) => state.wizard);

  const [showProjectTypeSelector, setShowProjectTypeSelector] = useState(false);

  // Load saved wizard state on mount
  useEffect(() => {
    dispatch(loadFromLocalStorage());
    
    // Create a new wizard session
    dispatch(createWizardSession('user-123')); // In real app, get from auth
  }, [dispatch]);

  // Auto-save on state changes
  useEffect(() => {
    dispatch(saveToLocalStorage());
  }, [
    currentStep,
    projectRequirements,
    selectedTemplate,
    templateConfiguration,
    selectedIntegrations,
    integrationConfigurations,
    deploymentConfig,
    dispatch
  ]);

  // Validation for each step
  const validateCurrentStep = () => {
    const step = steps[currentStep];
    let validation = { isValid: true, errors: [] as string[] };

    switch (step.id) {
      case 'project-description':
        if (!projectRequirements.name || projectRequirements.name.trim().length < 3) {
          validation.errors.push('Project name must be at least 3 characters long');
        }
        if (!projectRequirements.description || projectRequirements.description.trim().length < 10) {
          validation.errors.push('Project description must be at least 10 characters long');
        }
        if (!projectRequirements.userType) {
          validation.errors.push('Please select your experience level');
        }
        if (!projectRequirements.timeline) {
          validation.errors.push('Please select a development timeline');
        }
        if (!projectRequirements.scalability) {
          validation.errors.push('Please select expected scale');
        }
        if (!projectRequirements.budget) {
          validation.errors.push('Please select a budget range');
        }
        break;

      case 'technology-selection':
        if (!selectedTemplate) {
          validation.errors.push('Please select a template');
        }
        break;

      case 'template-configuration':
        if (selectedTemplate) {
          selectedTemplate.variables.forEach(variable => {
            const value = templateConfiguration[variable.name];
            if (variable.required && (!value || value === '')) {
              validation.errors.push(`${variable.name} is required`);
            }
          });
        }
        break;

      case 'integration-setup':
        // Integrations are optional, so always valid
        break;

      case 'preview-deployment':
        if (!deploymentConfig.platform) {
          validation.errors.push('Please select a deployment platform');
        }
        break;
    }

    validation.isValid = validation.errors.length === 0;
    
    dispatch(setStepValidation({
      stepId: step.id,
      validation
    }));

    return validation.isValid;
  };

  // Handle project type selection from the initial screen
  const handleProjectTypeSelect = (typeId: string) => {
    if (typeId === 'custom') {
      setShowProjectTypeSelector(false);
      return;
    }

    const template = mockTemplates.find(t => t.id === typeId);
    if (template) {
      dispatch(selectTemplate(template));
      dispatch(updateProjectRequirements({
        name: template.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
        description: template.description
      }));
      setShowProjectTypeSelector(false);
      dispatch(setCurrentStep(1)); // Skip to template configuration
    }
  };

  // Handle navigation
  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep || steps[stepIndex].completed) {
      dispatch(setCurrentStep(stepIndex));
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep === 0 && !projectAnalysis) {
        // Trigger analysis on first step
        dispatch(analyzeProject(projectRequirements));
      } else {
        dispatch(nextStep());
      }
    }
  };

  const handlePrevious = () => {
    dispatch(previousStep());
  };

  // Handle project analysis
  const handleAnalyze = () => {
    if (validateCurrentStep()) {
      dispatch(analyzeProject(projectRequirements));
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = mockTemplates.find(t => t.id === templateId);
    if (template) {
      dispatch(selectTemplate(template));
    }
  };

  // Handle preview generation
  const handlePreview = () => {
    if (sessionId) {
      dispatch(generatePreview({
        sessionId,
        stepId: steps[currentStep].id
      }));
    }
  };

  // Handle final deployment
  const handleDeploy = () => {
    if (sessionId) {
      dispatch(completeWizard(sessionId));
    }
  };

  // Render step content
  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'project-description':
        return (
          <RequirementsGathering
            requirements={projectRequirements}
            onRequirementsChange={(reqs) => dispatch(updateProjectRequirements(reqs))}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            aiSuggestions={projectAnalysis ? [] : [
              'Consider adding user authentication for personalized experiences',
              'Include responsive design for mobile compatibility',
              'Add analytics to track user behavior and improve the application'
            ]}
          />
        );

      case 'technology-selection':
        return (
          <div className="space-y-8">
            {projectAnalysis && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <SparklesIcon className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        AI Recommendations
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-blue-800">Recommended Stack:</h4>
                          <p className="text-blue-700">
                            Frontend: {projectAnalysis.recommendations.frontend.framework} •
                            Backend: {projectAnalysis.recommendations.backend.framework} •
                            Database: {projectAnalysis.recommendations.database.specific}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-800">Reasoning:</h4>
                          <p className="text-blue-700">
                            {projectAnalysis.recommendations.frontend.reasoning}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-800">Estimated Timeline:</h4>
                          <p className="text-blue-700">
                            {projectAnalysis.estimatedTimeline} (Complexity: {projectAnalysis.estimatedComplexity}/10)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <TemplateConfiguration
              selectedTemplate={selectedTemplate}
              templates={mockTemplates}
              onTemplateSelect={handleTemplateSelect}
              configuration={templateConfiguration}
              onConfigurationChange={(config) => dispatch(updateTemplateConfiguration(config))}
              projectStructure={projectStructure}
              onPreview={handlePreview}
              isGeneratingPreview={isGeneratingPreview}
            />
          </div>
        );

      case 'template-configuration':
        return (
          <TemplateConfiguration
            selectedTemplate={selectedTemplate}
            templates={mockTemplates}
            onTemplateSelect={handleTemplateSelect}
            configuration={templateConfiguration}
            onConfigurationChange={(config) => dispatch(updateTemplateConfiguration(config))}
            projectStructure={projectStructure}
            onPreview={handlePreview}
            isGeneratingPreview={isGeneratingPreview}
          />
        );

      case 'integration-setup':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Configure Integrations
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Add third-party services and integrations to enhance your application.
                All integrations are optional and can be added later.
              </p>
            </div>
            
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckIcon className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Integration Setup Coming Soon
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    The integration configuration interface will be available in the next update.
                    For now, you can proceed to review and deploy your project.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'preview-deployment':
        return (
          <PreviewDeployment
            projectStructure={projectStructure || {}}
            deploymentConfig={deploymentConfig}
            onDeploymentConfigChange={(config) => dispatch(updateDeploymentConfig(config))}
            resourceEstimate={resourceEstimate}
            onDeploy={handleDeploy}
            isDeploying={isDeploying}
            deploymentInstructions={deploymentInstructions}
          />
        );

      default:
        return <div>Step not implemented</div>;
    }
  };

  // Show project type selector initially
  if (showProjectTypeSelector || (currentStep === 0 && !projectRequirements.name)) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProjectTypeSelector
            onTypeSelect={handleProjectTypeSelect}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Project Creation Wizard
                </h1>
                <p className="text-gray-600 mt-1">
                  Create your next project with AI-powered recommendations
                </p>
              </div>
              
              <Button
                variant="ghost"
                onClick={() => setShowProjectTypeSelector(true)}
              >
                Change Project Type
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <WizardProgress
                steps={steps}
                currentStep={currentStep}
                onStepClick={handleStepClick}
                allowNavigation={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-4">
              {steps[currentStep]?.validation && !steps[currentStep]?.validation?.isValid && (
                <div className="flex items-center space-x-2 text-red-600">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  <span className="text-sm">
                    Please fix errors before continuing
                  </span>
                </div>
              )}

              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (steps[currentStep]?.validation && !steps[currentStep]?.validation?.isValid) ||
                    isAnalyzing
                  }
                  className="flex items-center space-x-2"
                >
                  <span>
                    {currentStep === 0 && !projectAnalysis ? 'Analyze & Continue' : 'Next'}
                  </span>
                  <ArrowRightIcon className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleDeploy}
                  disabled={
                    (steps[currentStep]?.validation && !steps[currentStep]?.validation?.isValid) ||
                    isDeploying
                  }
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>Complete Wizard</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectWizard;