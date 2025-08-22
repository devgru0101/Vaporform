import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from './auth';
import { projectsSlice } from './projects';
import { editorSlice } from './editor';
import { collaborationSlice } from './collaboration';
import { containerSlice } from './containers';
import { fileSystemSlice } from './fileSystem';
import { aiSlice } from './ai';
import { uiSlice } from './ui';
import { settingsSlice } from './settings';
import wizardReducer from './wizardSlice'; // DEPRECATED: Use projectWizard instead
import projectWizardReducer from './projectWizard';
import { websocketMiddleware } from './middleware/websocket';
import { localStorageMiddleware } from './middleware/localStorage';
import { isDevelopment } from '../config/environment';

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    projects: projectsSlice.reducer,
    editor: editorSlice.reducer,
    collaboration: collaborationSlice.reducer,
    containers: containerSlice.reducer,
    fileSystem: fileSystemSlice.reducer,
    ai: aiSlice.reducer,
    ui: uiSlice.reducer,
    settings: settingsSlice.reducer,
    wizard: wizardReducer, // DEPRECATED: Legacy wizard state, will be removed
    projectWizard: projectWizardReducer, // NEW: Modern modal-based wizard state
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'editor/setEditorInstance',
          'collaboration/addUser',
          'collaboration/updateUser',
          'websocket/messageReceived',
        ],
        ignoredPaths: [
          'editor.editorInstance',
          'collaboration.users',
          'websocket.connection',
        ],
      },
    })
      .concat(websocketMiddleware)
      .concat(localStorageMiddleware),
  devTools: isDevelopment,
});

export type RootState = ReturnType<typeof store.getState>;
export { store };
export type AppDispatch = typeof store.dispatch;

// Export all actions for easy access
export { authSlice } from './auth';
export { projectsSlice } from './projects';
export { editorSlice } from './editor';
export { collaborationSlice } from './collaboration';
export { containerSlice } from './containers';
export { fileSystemSlice } from './fileSystem';
export { aiSlice } from './ai';
export { uiSlice } from './ui';
export { settingsSlice } from './settings';