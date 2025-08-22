import React from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { uiSlice } from '@/store/ui';
import { SettingsModal } from '@/components/Settings/SettingsModal';
import { ProjectCreationModal } from '@/components/ProjectWizard/ProjectCreationModal';

export const Modals: React.FC = () => {
  const { modals } = useAppSelector(state => state.ui);
  const dispatch = useAppDispatch();

  const handleCloseProjectCreationModal = () => {
    dispatch(uiSlice.actions.closeModal('projectCreationModal'));
  };

  const handleProjectCreationComplete = (projectData: any) => {
    // Handle project creation completion
    console.log('Project created:', projectData);
    // Optionally close the modal automatically or redirect
    // dispatch(uiSlice.actions.closeModal('projectCreationModal'));
  };
  
  return (
    <>
      {modals.settings && <SettingsModal />}
      {modals.projectCreationModal && (
        <ProjectCreationModal 
          isOpen={modals.projectCreationModal}
          onClose={handleCloseProjectCreationModal}
          onComplete={handleProjectCreationComplete}
        />
      )}
      {/* TODO: Add other modals (command palette, quick open, etc.) */}
    </>
  );
};