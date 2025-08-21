import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { authSlice } from '@/store/auth';
import { useAuthService } from '@/services/auth';
import { VaporformLogo } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import './AuthPage.css';

export const AuthPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const authService = useAuthService();
  const { isLoading, error } = useAppSelector(state => state.auth);
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  if (isLoading) {
    return <LoadingScreen message="Authenticating..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    dispatch(authSlice.actions.loginStart());
    
    try {
      let result;
      if (mode === 'login') {
        result = await authService.login({
          email: formData.email,
          password: formData.password
        });
      } else {
        result = await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
      }
      
      dispatch(authSlice.actions.loginSuccess(result));
    } catch (error) {
      dispatch(authSlice.actions.loginFailure(
        error instanceof Error ? error.message : 'Authentication failed'
      ));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    dispatch(authSlice.actions.clearError());
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div className="vf-auth-container">
      <div className="vf-auth-left-panel">
        <div className="vf-auth-logo">
          <VaporformLogo size={80} />
        </div>
        <h1 className="vf-auth-brand-title">VAPORFORM</h1>
        <p className="vf-auth-brand-subtitle">
          AI-POWERED DEVELOPMENT ENVIRONMENT<br />
          THAT BRINGS YOUR IDEAS TO LIFE
        </p>
        
        <ul className="vf-auth-feature-list">
          <li>AI-POWERED CODE ASSISTANCE WITH CLAUDE</li>
          <li>REAL-TIME COLLABORATIVE EDITING</li>
          <li>INTEGRATED CONTAINER MANAGEMENT</li>
          <li>VIRTUAL FILE SYSTEM WITH VERSION CONTROL</li>
          <li>LIVE PROJECT PREVIEW AND MONITORING</li>
          <li>COMPREHENSIVE DEVELOPMENT TOOLS</li>
        </ul>
      </div>
      
      <div className="vf-auth-right-panel">
        <form className="vf-auth-form" onSubmit={handleSubmit}>
          <h2 className="vf-auth-form-title">
            {mode === 'login' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
          </h2>
          <p className="vf-auth-form-subtitle">
            {mode === 'login' 
              ? 'SIGN IN TO YOUR VAPORFORM ACCOUNT'
              : 'JOIN THE FUTURE OF DEVELOPMENT'
            }
          </p>
          
          {error && (
            <div className="vf-auth-error">
              {error}
            </div>
          )}
          
          {mode === 'register' && (
            <div className="vf-auth-form-group">
              <label htmlFor="name" className="vf-auth-label">FULL NAME</label>
              <input
                id="name"
                name="name"
                type="text"
                className="vf-input"
                placeholder="ENTER YOUR FULL NAME"
                value={formData.name}
                onChange={handleInputChange}
                autoComplete="name"
                required
              />
            </div>
          )}
          
          <div className="vf-auth-form-group">
            <label htmlFor="email" className="vf-auth-label">EMAIL ADDRESS</label>
            <input
              id="email"
              name="email"
              type="email"
              className="vf-input"
              placeholder="ENTER YOUR EMAIL"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
              required
            />
          </div>
          
          <div className="vf-auth-form-group">
            <label htmlFor="password" className="vf-auth-label">PASSWORD</label>
            <input
              id="password"
              name="password"
              type="password"
              className="vf-input"
              placeholder="ENTER YOUR PASSWORD"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </div>
          
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            className="vf-auth-submit-btn"
          >
            {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </Button>
          
          <div className="vf-auth-switch">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button type="button" onClick={toggleMode} className="vf-auth-switch-btn">
                  SIGN UP
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={toggleMode} className="vf-auth-switch-btn">
                  SIGN IN
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};