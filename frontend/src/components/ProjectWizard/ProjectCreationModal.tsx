import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { CloseIcon, CheckIcon, ArrowRightIcon, ArrowLeftIcon } from '../ui/Icons';
import { ProjectVisionStep } from './steps/ProjectVisionStep';
import { TechStackStep } from './steps/TechStackStep';
import { IntegrationsStep } from './steps/IntegrationsStep';
import { ReviewStep } from './steps/ReviewStep';
import {
  nextStep,
  previousStep,
  setCurrentStep,
  resetWizard,
  validateCurrentStep,
  generateProject,
  createWizardSession,
  loadTemplates,
  loadIntegrations,
  stopProgressTracking,
  clearAllErrors
} from '../../store/projectWizard';
import './ProjectCreationModal.css';

interface ProjectCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (projectData: any) => void;
}

const STEPS = [
  {
    id: 'vision',
    title: 'Project Vision',
    description: 'Define your project goals and requirements'
  },
  {
    id: 'tech-stack',
    title: 'Tech Stack',
    description: 'Choose your technology foundation'
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Add third-party services'
  },
  {
    id: 'review',
    title: 'Review & Generate',
    description: 'Review and create your project'
  }
];

export const ProjectCreationModal: React.FC<ProjectCreationModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const dispatch = useDispatch();
  const {
    currentStep,
    projectData,
    isGenerating,
    isLoadingSession,
    isLoadingTemplates,
    isLoadingIntegrations,
    validation,
    error,
    apiErrors,
    generationProgress,
    sessionId,
    availableTemplates,
    availableIntegrations
  } = useSelector((state: RootState) => state.projectWizard);
  
  const { user } = useSelector((state: RootState) => state.auth);

  const [isClosing, setIsClosing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize wizard when modal opens
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      const initializeWizard = async () => {
        try {
          // Clear any previous errors
          dispatch(clearAllErrors());
          
          // Get current user ID from auth state
          const userId = user?.id;
          
          if (!userId) {
            console.error('No user ID available - user may not be logged in');
            return;
          }
          
          // Create a new wizard session
          await dispatch(createWizardSession(userId));
          
          // Load initial data for templates and integrations
          await Promise.all([
            dispatch(loadTemplates()),
            dispatch(loadIntegrations())
          ]);
          
          setHasInitialized(true);
        } catch (error) {
          console.error('Failed to initialize wizard:', error);
        }
      };
      
      initializeWizard();
    }
  }, [isOpen, hasInitialized, dispatch]);

  // Handle modal close
  const handleClose = () => {
    if (isGenerating) return; // Prevent closing during generation
    
    setIsClosing(true);
    
    // Stop progress tracking if active
    dispatch(stopProgressTracking());
    
    setTimeout(() => {
      dispatch(resetWizard());
      setIsClosing(false);
      setHasInitialized(false);
      onClose();
    }, 300);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isOpen]);

  // Handle navigation
  const handleNext = () => {
    dispatch(validateCurrentStep());
    if (validation.isValid) {
      dispatch(nextStep());
    }
  };

  const handlePrevious = () => {
    dispatch(previousStep());
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow navigation to previous steps or current step
    if (stepIndex <= currentStep) {
      dispatch(setCurrentStep(stepIndex));
    }
  };

  const handleComplete = async () => {
    dispatch(validateCurrentStep());
    if (validation.isValid) {
      try {
        // Start project generation with real API
        const options = {
          includeTests: true,
          includeDocs: true,
          includeExamples: false,
          optimizeForProduction: false
        };
        
        await dispatch(generateProject(options));
        
        // The completion will be handled by progress tracking
        // which will call onComplete when generation finishes
      } catch (error) {
        console.error('Failed to start project generation:', error);
      }
    }
  };

  // Handle generation completion
  useEffect(() => {
    if (projectData.status === 'completed' && onComplete) {
      onComplete(projectData);
      // Don't auto-close so user can see the result and download
    }
  }, [projectData.status, onComplete, projectData]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <ProjectVisionStep />;
      case 1:
        return <TechStackStep />;
      case 2:
        return <IntegrationsStep />;
      case 3:
        return <ReviewStep onGenerate={handleComplete} />;
      default:
        return <ProjectVisionStep />;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`project-modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`project-modal ${isClosing ? 'closing' : ''}`}>
        {/* Header */}
        <div className="project-modal-header">
          <div className="project-modal-title">
            <h1>Create New Project</h1>
            <p>Build your next application with AI-powered assistance</p>
          </div>
          
          <button 
            className="project-modal-close"
            onClick={handleClose}
            disabled={isGenerating}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="project-modal-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="progress-steps">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                className={`progress-step ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'current' : ''}`}
                onClick={() => handleStepClick(index)}
                disabled={index > currentStep}
              >
                <div className="step-indicator">
                  {index < currentStep ? (
                    <CheckIcon size={12} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="step-info">
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="project-modal-content">
          <div className="step-content">
            {renderStepContent()}
          </div>
        </div>

        {/* Loading States */}
        {(isLoadingSession || isLoadingTemplates || isLoadingIntegrations) && (
          <div className="project-modal-loading">
            <div className="loading-spinner" />
            <span>
              {isLoadingSession && 'Initializing session...'}
              {isLoadingTemplates && 'Loading templates...'}
              {isLoadingIntegrations && 'Loading integrations...'}
            </span>
          </div>
        )}

        {/* Generation Progress */}
        {isGenerating && generationProgress && (
          <div className="project-modal-progress-detail">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${generationProgress.progress}%` }}
              />
            </div>
            <div className="progress-info">
              <span className="progress-status">{generationProgress.status}</span>
              <span className="progress-message">{generationProgress.message}</span>
              <span className="progress-percentage">{generationProgress.progress}%</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="project-modal-error">
            <span>{error}</span>
          </div>
        )}

        {/* API Errors */}
        {Object.keys(apiErrors).length > 0 && (
          <div className="project-modal-api-errors">
            {Object.entries(apiErrors).map(([key, errorMsg]) => (
              <div key={key} className="api-error">
                <strong>{key}:</strong> {errorMsg}
              </div>
            ))}
          </div>
        )}

        {/* Validation Errors */}
        {!validation.isValid && validation.errors.length > 0 && (
          <div className="project-modal-validation">
            <h4>Please fix the following issues:</h4>
            <ul>
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Validation Warnings */}
        {validation.warnings && validation.warnings.length > 0 && (
          <div className="project-modal-warnings">
            <h4>Recommendations:</h4>
            <ul>
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="project-modal-footer">
          <div className="footer-actions">
            <button
              className="btn-secondary"
              onClick={handlePrevious}
              disabled={
                currentStep === 0 || 
                isGenerating || 
                isLoadingSession || 
                isLoadingTemplates || 
                isLoadingIntegrations
              }
            >
              <ArrowLeftIcon size={16} />
              Previous
            </button>

            <div className="footer-spacer" />

            {currentStep < STEPS.length - 1 ? (
              <button
                className="btn-primary"
                onClick={handleNext}
                disabled={
                  !validation.isValid || 
                  isGenerating || 
                  isLoadingSession || 
                  isLoadingTemplates || 
                  isLoadingIntegrations
                }
              >
                Next
                <ArrowRightIcon size={16} />
              </button>
            ) : (
              <button
                className="btn-success"
                onClick={handleComplete}
                disabled={
                  !validation.isValid || 
                  isGenerating || 
                  isLoadingSession || 
                  isLoadingTemplates || 
                  isLoadingIntegrations
                }
              >
                {isGenerating ? (
                  generationProgress ? 
                    `${generationProgress.status}... ${generationProgress.progress}%` : 
                    'Generating...'
                ) : 'Generate Project'}
                {!isGenerating && <CheckIcon size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreationModal;