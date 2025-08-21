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
import { authSlice } from '@/store/auth';
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
        const token = localStorage.getItem('vaporform_token');
        if (token) {
          dispatch(authSlice.actions.setLoading(true));
          const user = await authService.validateToken(token);
          if (user) {
            dispatch(authSlice.actions.loginSuccess({ user, token }));
          } else {
            localStorage.removeItem('vaporform_token');
            dispatch(authSlice.actions.logout());
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        localStorage.removeItem('vaporform_token');
        dispatch(authSlice.actions.logout());
      } finally {
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
            <Layout>
              <Routes>
                <Route path="/" element={<WorkspacePage />} />
                <Route path="/workspace" element={<WorkspacePage />} />
                <Route path="/workspace/:projectId" element={<WorkspacePage />} />
                <Route path="/wizard" element={<WizardPage />} />
                <Route path="/wizard/:step" element={<WizardPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<WorkspacePage />} />
              </Routes>
            </Layout>
          )}
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
};