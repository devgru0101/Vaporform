import React from 'react';
import { CheckIcon, ExclamationTriangleIcon } from '../ui/Icons';

interface WizardStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  validation?: {
    isValid: boolean;
    errors: string[];
  };
}

interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
  allowNavigation?: boolean;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({
  steps,
  currentStep,
  onStepClick,
  allowNavigation = true
}) => {
  const getStepStatus = (stepIndex: number) => {
    const step = steps[stepIndex];
    
    if (stepIndex < currentStep) {
      return step.completed ? 'completed' : 'error';
    } else if (stepIndex === currentStep) {
      return 'current';
    } else {
      return 'upcoming';
    }
  };

  const getStepIcon = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    const step = steps[stepIndex];
    
    switch (status) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <CheckIcon className="w-4 h-4 text-white" />
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-4 h-4 text-white" />
          </div>
        );
      case 'current':
        return (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">{stepIndex + 1}</span>
          </div>
        );
      case 'upcoming':
        return (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">{stepIndex + 1}</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getStepClasses = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    const baseClasses = "flex flex-col items-center text-center space-y-2 px-4 py-2 rounded-lg transition-colors";
    
    if (allowNavigation && (status === 'completed' || status === 'current')) {
      baseClasses += " cursor-pointer hover:bg-gray-50";
    }

    switch (status) {
      case 'completed':
        return `${baseClasses} text-green-700`;
      case 'error':
        return `${baseClasses} text-red-700`;
      case 'current':
        return `${baseClasses} text-blue-700 bg-blue-50`;
      case 'upcoming':
        return `${baseClasses} text-gray-500`;
      default:
        return baseClasses;
    }
  };

  const getConnectorClasses = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    const nextStatus = stepIndex < steps.length - 1 ? getStepStatus(stepIndex + 1) : 'upcoming';
    
    if (status === 'completed' && (nextStatus === 'completed' || nextStatus === 'current')) {
      return "bg-green-600";
    } else if (status === 'current' || status === 'completed') {
      return "bg-blue-600";
    } else {
      return "bg-gray-300";
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (!allowNavigation) return;
    
    const status = getStepStatus(stepIndex);
    if (status === 'completed' || status === 'current') {
      onStepClick(stepIndex);
    }
  };

  return (
    <div className="w-full">
      {/* Desktop Progress Bar */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={getStepClasses(index)}
                onClick={() => handleStepClick(index)}
              >
                {getStepIcon(index)}
                <div className="max-w-32">
                  <h4 className="text-sm font-medium">{step.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  {step.validation && !step.validation.isValid && (
                    <div className="text-xs text-red-600 mt-1">
                      {step.validation.errors.length} error{step.validation.errors.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-px mx-4">
                  <div className={`h-full ${getConnectorClasses(index)}`} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Mobile Progress Bar */}
      <div className="block md:hidden">
        <div className="space-y-4">
          {/* Current step indicator */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Step {currentStep + 1} of {steps.length}
            </h3>
            <p className="text-sm text-gray-600">
              {steps[currentStep]?.name}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center space-x-2">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              return (
                <button
                  key={step.id}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    status === 'completed' ? 'bg-green-600' :
                    status === 'error' ? 'bg-red-600' :
                    status === 'current' ? 'bg-blue-600' :
                    'bg-gray-300'
                  }`}
                  onClick={() => handleStepClick(index)}
                  disabled={!allowNavigation || (status !== 'completed' && status !== 'current')}
                />
              );
            })}
          </div>

          {/* Step details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">
              {steps[currentStep]?.name}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {steps[currentStep]?.description}
            </p>
            {steps[currentStep]?.validation && !steps[currentStep]?.validation?.isValid && (
              <div className="mt-2">
                <p className="text-sm text-red-600 font-medium">
                  Please fix the following errors:
                </p>
                <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                  {steps[currentStep]?.validation?.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(((currentStep) / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};