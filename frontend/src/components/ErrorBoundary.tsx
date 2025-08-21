import React, { Component, ReactNode } from 'react';
import styled from '@emotion/styled';
import { VaporformLogo } from './ui/Icons';
import { Button } from './ui/Button';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background-color: #1e1e1e;
  color: #cccccc;
  padding: 40px;
  text-align: center;
`;

const ErrorIcon = styled.div`
  color: #f44336;
  margin-bottom: 24px;
`;

const ErrorTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #ffffff;
`;

const ErrorMessage = styled.p`
  font-size: 16px;
  line-height: 1.5;
  margin: 0 0 24px 0;
  max-width: 600px;
  opacity: 0.9;
`;

const ErrorDetails = styled.details`
  margin: 20px 0;
  max-width: 800px;
  text-align: left;
`;

const ErrorSummary = styled.summary`
  cursor: pointer;
  font-weight: 600;
  padding: 8px;
  background-color: #252526;
  border-radius: 4px;
  margin-bottom: 8px;
  
  &:hover {
    background-color: #2d2d30;
  }
`;

const ErrorStack = styled.pre`
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 16px;
  font-size: 12px;
  overflow: auto;
  max-height: 300px;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send error to logging service
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorContainer>
          <ErrorIcon>
            <VaporformLogo size={48} />
          </ErrorIcon>
          
          <ErrorTitle>Something went wrong</ErrorTitle>
          
          <ErrorMessage>
            We're sorry, but something unexpected happened. The application has encountered 
            an error and needs to be restarted.
          </ErrorMessage>

          {this.state.error && (
            <ErrorDetails>
              <ErrorSummary>Error Details</ErrorSummary>
              <ErrorStack>
                <strong>Error:</strong> {this.state.error.toString()}
                {this.state.errorInfo && (
                  <>
                    <br />
                    <br />
                    <strong>Component Stack:</strong>
                    {this.state.errorInfo.componentStack}
                  </>
                )}
                {this.state.error.stack && (
                  <>
                    <br />
                    <br />
                    <strong>Stack Trace:</strong>
                    <br />
                    {this.state.error.stack}
                  </>
                )}
              </ErrorStack>
            </ErrorDetails>
          )}

          <ErrorActions>
            <Button
              variant="primary"
              onClick={this.handleReload}
            >
              Reload Application
            </Button>
            <Button
              variant="secondary"
              onClick={this.handleReset}
            >
              Try Again
            </Button>
          </ErrorActions>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}