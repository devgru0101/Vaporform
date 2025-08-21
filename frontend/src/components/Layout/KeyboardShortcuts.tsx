import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { uiSlice } from '@/store/ui';

export const KeyboardShortcuts: React.FC = () => {
  const dispatch = useAppDispatch();
  const { shortcuts } = useAppSelector(state => state.ui);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = [
        event.ctrlKey && 'ctrl',
        event.metaKey && 'cmd',
        event.shiftKey && 'shift',
        event.altKey && 'alt',
        event.key.toLowerCase()
      ].filter(Boolean).join('+');

      const action = shortcuts[key];
      
      if (action) {
        event.preventDefault();
        
        switch (action) {
          case 'commandPalette':
            dispatch(uiSlice.actions.openModal('commandPalette'));
            break;
          case 'quickOpen':
            dispatch(uiSlice.actions.openModal('quickOpen'));
            break;
          case 'toggleSidebar':
            dispatch(uiSlice.actions.updatePanelDimensions({
              panel: 'leftSidebar',
              dimensions: { isVisible: false }
            }));
            break;
          case 'togglePanel':
            dispatch(uiSlice.actions.updatePanelDimensions({
              panel: 'bottomPanel',
              dimensions: { isVisible: false }
            }));
            break;
          case 'toggleFullscreen':
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              document.documentElement.requestFullscreen();
            }
            break;
          case 'toggleZenMode':
            dispatch(uiSlice.actions.toggleZenMode());
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, shortcuts]);

  return null;
};