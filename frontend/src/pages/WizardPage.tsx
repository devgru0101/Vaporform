/*
 * DEPRECATED: This file is deprecated and will be removed in a future version.
 * 
 * The wizard functionality has been moved to a modal-based approach using:
 * - components/ProjectWizard/ProjectCreationModal.tsx (new modern wizard)
 * - components/Layout/Modals.tsx (modal management)
 * 
 * Routes to this page have been removed from App.tsx.
 * Use the modal approach instead via the UI state management.
 * 
 * @deprecated Use ProjectCreationModal component instead
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectWizard from '../components/Wizard';
import { ProjectCreationModal } from '../components/ProjectWizard/ProjectCreationModal';
import { Button } from '../components/ui/Button';
import { RocketIcon } from '../components/ui/Icons';

export const WizardPage: React.FC = () => {
  const [showNewModal, setShowNewModal] = useState(false);
  const navigate = useNavigate();

  const handleNewProjectComplete = (projectData: any) => {
    console.log('New project generated:', projectData);
    // Navigate to the workspace or show success message
    navigate('/workspace');
  };

  return (
    <div className="wizard-page">
      <div className="wizard-header">
        <h1>Create Your Project</h1>
        <p>Choose how you'd like to create your new project</p>
        
        <div className="wizard-options">
          <Button
            onClick={() => setShowNewModal(true)}
            className="wizard-option-btn primary"
          >
            <RocketIcon size={20} />
            <div className="option-content">
              <span className="option-title">AI-Powered Creation</span>
              <span className="option-description">
                New enhanced wizard with AI assistance and step-by-step guidance
              </span>
            </div>
          </Button>
          
          <div className="divider">
            <span>or</span>
          </div>
          
          <div className="legacy-option">
            <h3>Use Classic Wizard</h3>
            <p>Continue with the original project creation experience</p>
          </div>
        </div>
      </div>
      
      {!showNewModal && <ProjectWizard />}
      
      <ProjectCreationModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onComplete={handleNewProjectComplete}
      />

      <style jsx>{`
        .wizard-page {
          min-height: 100vh;
          background: var(--vf-bg-primary);
        }

        .wizard-header {
          background: var(--vf-bg-secondary);
          border-bottom: 2px solid var(--vf-surface-border);
          padding: var(--vf-space-8) var(--vf-space-4);
          text-align: center;
        }

        .wizard-header h1 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-2xl);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-2) 0;
          text-transform: uppercase;
        }

        .wizard-header p {
          font-size: var(--vf-text-base);
          color: var(--vf-text-muted);
          margin: 0 0 var(--vf-space-6) 0;
        }

        .wizard-options {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-4);
        }

        .wizard-option-btn {
          background: var(--vf-bg-tertiary);
          border: 2px solid var(--vf-accent-primary);
          color: var(--vf-text-primary);
          padding: var(--vf-space-4);
          cursor: pointer;
          transition: all var(--vf-transition-fast);
          display: flex;
          align-items: center;
          gap: var(--vf-space-3);
          text-align: left;
          width: 100%;
          min-height: 80px;
        }

        .wizard-option-btn:hover {
          background: var(--vf-accent-primary);
          color: var(--vf-bg-primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(202, 196, 183, 0.3);
        }

        .option-content {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-1);
        }

        .option-title {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-base);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
        }

        .option-description {
          font-size: var(--vf-text-sm);
          opacity: 0.8;
          line-height: 1.4;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: var(--vf-space-3);
          margin: var(--vf-space-2) 0;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--vf-surface-border);
        }

        .divider span {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-muted);
          text-transform: uppercase;
          font-weight: var(--vf-weight-bold);
        }

        .legacy-option {
          background: var(--vf-bg-tertiary);
          border: 1px solid var(--vf-surface-border);
          padding: var(--vf-space-4);
          text-align: center;
        }

        .legacy-option h3 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-base);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-secondary);
          margin: 0 0 var(--vf-space-2) 0;
          text-transform: uppercase;
        }

        .legacy-option p {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-muted);
          margin: 0;
        }

        @media (max-width: 768px) {
          .wizard-header {
            padding: var(--vf-space-6) var(--vf-space-4);
          }

          .wizard-header h1 {
            font-size: var(--vf-text-xl);
          }

          .wizard-option-btn {
            flex-direction: column;
            text-align: center;
            gap: var(--vf-space-2);
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
};