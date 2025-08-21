import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { Layout } from '@/components/Layout';
import { AuthPage } from '@/pages/AuthPage';
import { WorkspacePage } from '@/pages/WorkspacePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { WizardPage } from '@/pages/WizardPage';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { authSlice, restoreSession } from '@/store/auth';
import { useAuthService } from '@/services/auth';
import { ThemeProvider } from '@/components/ThemeProvider';

export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);
  const authService = useAuthService();

  // Initialize authentication on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        // First try to restore from localStorage
        const result = await dispatch(restoreSession()).unwrap();
        
        // If restore succeeds, validate the token with the backend
        if (result.token) {
          const user = await authService.validateToken(result.token);
          if (!user) {
            // Token is invalid, clear session
            dispatch(authSlice.actions.logout());
          }
        }
      } catch (error) {
        // No stored session or restoration failed
        dispatch(authSlice.actions.setLoading(false));
      }
    };

    initAuth();
  }, [dispatch, authService]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div className="app">
          {!isAuthenticated ? (
            <Routes>
              <Route path="*" element={<AuthPage />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<Layout />} />
              <Route path="/workspace" element={<Layout />} />
              <Route path="/workspace/:projectId" element={<Layout />} />
              <Route path="/wizard" element={<WizardPage />} />
              <Route path="/wizard/:step" element={<WizardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Layout />} />
            </Routes>
          )}
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
};