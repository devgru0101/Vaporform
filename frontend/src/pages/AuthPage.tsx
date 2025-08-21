import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { authSlice } from '@/store/auth';
import { useAuthService } from '@/services/auth';
import { VaporformLogo } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

const AuthContainer = styled.div`
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d30 100%);
`;

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: #cccccc;
`;

const RightPanel = styled.div`
  width: 480px;
  background-color: #252526;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  border-left: 1px solid #3e3e42;
`;

const Logo = styled.div`
  color: #007acc;
  margin-bottom: 32px;
`;

const BrandTitle = styled.h1`
  font-size: 48px;
  font-weight: 300;
  margin: 0 0 16px 0;
  color: #ffffff;
`;

const BrandSubtitle = styled.p`
  font-size: 20px;
  margin: 0 0 40px 0;
  color: #a0a0a0;
  text-align: center;
  line-height: 1.4;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  
  li {
    margin: 12px 0;
    padding-left: 24px;
    position: relative;
    
    &::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #007acc;
      font-weight: bold;
    }
  }
`;

const AuthForm = styled.form`
  width: 100%;
  max-width: 320px;
`;

const FormTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #ffffff;
  text-align: center;
`;

const FormSubtitle = styled.p`
  font-size: 14px;
  margin: 0 0 32px 0;
  color: #a0a0a0;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #cccccc;
`;

const Input = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  background-color: #1e1e1e;
  color: #cccccc;
  font-size: 14px;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #007acc;
  }
  
  &::placeholder {
    color: #6c6c6c;
  }
`;

const SubmitButton = styled(Button)`
  width: 100%;
  margin-bottom: 16px;
`;

const SwitchMode = styled.div`
  text-align: center;
  font-size: 14px;
  color: #a0a0a0;
  
  button {
    background: none;
    border: none;
    color: #007acc;
    cursor: pointer;
    text-decoration: underline;
    font-size: inherit;
    
    &:hover {
      color: #4a9eff;
    }
  }
`;

const ErrorMessage = styled.div`
  background-color: #f44336;
  color: white;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
`;

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
      localStorage.setItem('vaporform_token', result.token);
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
    <AuthContainer>
      <LeftPanel>
        <Logo>
          <VaporformLogo size={80} />
        </Logo>
        <BrandTitle>Vaporform</BrandTitle>
        <BrandSubtitle>
          The AI-powered development environment<br />
          that brings your ideas to life
        </BrandSubtitle>
        
        <FeatureList>
          <li>AI-powered code assistance with Claude</li>
          <li>Real-time collaborative editing</li>
          <li>Integrated container management</li>
          <li>Virtual file system with version control</li>
          <li>Live project preview and monitoring</li>
          <li>Comprehensive development tools</li>
        </FeatureList>
      </LeftPanel>
      
      <RightPanel>
        <AuthForm onSubmit={handleSubmit}>
          <FormTitle>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </FormTitle>
          <FormSubtitle>
            {mode === 'login' 
              ? 'Sign in to your Vaporform account'
              : 'Join the future of development'
            }
          </FormSubtitle>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          {mode === 'register' && (
            <FormGroup>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
          )}
          
          <FormGroup>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </FormGroup>
          
          <SubmitButton
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </SubmitButton>
          
          <SwitchMode>
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button type="button" onClick={toggleMode}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={toggleMode}>
                  Sign in
                </button>
              </>
            )}
          </SwitchMode>
        </AuthForm>
      </RightPanel>
    </AuthContainer>
  );
};