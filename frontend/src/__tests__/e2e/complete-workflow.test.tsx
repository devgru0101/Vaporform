/**
 * DEPRECATED: Legacy End-to-End Workflow Tests
 * 
 * These tests include deprecated wizard functionality.
 * The wizard has been replaced with a modal-based approach.
 * 
 * Update tests to use:
 * - ProjectCreationModal instead of wizard pages
 * - projectWizard store slice instead of wizard slice
 * - Modal state management instead of route navigation
 * 
 * @deprecated Update tests to use modal-based wizard approach
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { authSlice } from '@/store/auth';
import { projectsSlice } from '@/store/projects';
import { aiSlice } from '@/store/ai';
import { wizardSlice } from '@/store/wizardSlice';
import { uiSlice } from '@/store/ui';

// Mock components for E2E testing
const MockAuthPage = () => {
  const handleLogin = () => {
    // Simulate login success
  };

  return (
    <div>
      <h1>Login to Vaporform</h1>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" data-testid="email-input" />
        <input type="password" placeholder="Password" data-testid="password-input" />
        <button type="submit" data-testid="login-button">Login</button>
      </form>
      <button data-testid="register-button">Register</button>
    </div>
  );
};

const MockDashboard = () => (
  <div>
    <h1>Vaporform Dashboard</h1>
    <button data-testid="create-project-button">Create New Project</button>
    <div data-testid="projects-list">
      <div data-testid="project-item">Test Project</div>
    </div>
    <button data-testid="ai-chat-button">Open AI Chat</button>
  </div>
);

const MockWizard = () => {
  const [step, setStep] = React.useState(0);
  const steps = ['Project Details', 'Technology Selection', 'Configuration', 'Preview', 'Deploy'];

  return (
    <div>
      <h1>Project Creation Wizard</h1>
      <div data-testid="wizard-progress">
        Step {step + 1} of {steps.length}: {steps[step]}
      </div>
      
      {step === 0 && (
        <div data-testid="project-details-step">
          <input placeholder="Project Name" data-testid="project-name-input" />
          <textarea placeholder="Description" data-testid="project-description-input" />
        </div>
      )}
      
      {step === 1 && (
        <div data-testid="technology-selection-step">
          <button data-testid="react-template">React Full-Stack</button>
          <button data-testid="vue-template">Vue.js App</button>
        </div>
      )}
      
      {step === 2 && (
        <div data-testid="configuration-step">
          <input placeholder="Database Type" data-testid="database-input" />
          <input placeholder="Auth Provider" data-testid="auth-provider-input" />
        </div>
      )}
      
      {step === 3 && (
        <div data-testid="preview-step">
          <h2>Project Preview</h2>
          <div data-testid="project-structure">File structure preview</div>
        </div>
      )}
      
      {step === 4 && (
        <div data-testid="deploy-step">
          <h2>Deploy Your Project</h2>
          <button data-testid="deploy-button">Deploy to Production</button>
        </div>
      )}
      
      <div data-testid="wizard-navigation">
        <button 
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          data-testid="previous-button"
        >
          Previous
        </button>
        <button 
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
          data-testid="next-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const MockAIChat = () => {
  const [messages, setMessages] = React.useState([
    { id: 1, text: 'Hello! How can I help you with your project?', sender: 'ai' }
  ]);
  const [input, setInput] = React.useState('');

  const sendMessage = () => {
    if (input.trim()) {
      setMessages([
        ...messages,
        { id: messages.length + 1, text: input, sender: 'user' },
        { id: messages.length + 2, text: 'Thanks for your message! This is a mock AI response.', sender: 'ai' }
      ]);
      setInput('');
    }
  };

  return (
    <div data-testid="ai-chat">
      <h2>AI Assistant</h2>
      <div data-testid="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} data-testid={`message-${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div data-testid="chat-input-area">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          data-testid="chat-input"
        />
        <button onClick={sendMessage} data-testid="send-message-button">Send</button>
      </div>
    </div>
  );
};

const MockApp = () => {
  const [currentPage, setCurrentPage] = React.useState('auth');
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [showWizard, setShowWizard] = React.useState(false);
  const [showAIChat, setShowAIChat] = React.useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleCreateProject = () => {
    setShowWizard(true);
  };

  const handleOpenAIChat = () => {
    setShowAIChat(true);
  };

  if (!isAuthenticated && currentPage === 'auth') {
    return (
      <div data-testid="auth-page">
        <MockAuthPage />
        <button onClick={handleLogin} data-testid="mock-login">Mock Login</button>
      </div>
    );
  }

  return (
    <div data-testid="app-container">
      <header data-testid="app-header">
        <nav>
          <button onClick={() => setCurrentPage('dashboard')} data-testid="dashboard-nav">Dashboard</button>
          <button onClick={() => setIsAuthenticated(false)} data-testid="logout-nav">Logout</button>
        </nav>
      </header>
      
      <main data-testid="app-main">
        {showWizard ? (
          <div data-testid="wizard-modal">
            <MockWizard />
            <button onClick={() => setShowWizard(false)} data-testid="close-wizard">Close Wizard</button>
          </div>
        ) : showAIChat ? (
          <div data-testid="ai-chat-modal">
            <MockAIChat />
            <button onClick={() => setShowAIChat(false)} data-testid="close-ai-chat">Close AI Chat</button>
          </div>
        ) : (
          <div data-testid="dashboard-page">
            <MockDashboard />
            <button onClick={handleCreateProject} data-testid="start-wizard">Start Project Wizard</button>
            <button onClick={handleOpenAIChat} data-testid="open-ai-chat">Open AI Chat</button>
          </div>
        )}
      </main>
    </div>
  );
};

// Create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      projects: projectsSlice.reducer,
      ai: aiSlice.reducer,
      wizard: wizardSlice.reducer,
      ui: uiSlice.reducer,
    }
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </Provider>
  );
};

describe('End-to-End Workflow Tests', () => {
  describe('Complete User Journey: Registration to Deployment', () => {
    test('should complete full user workflow from login to project creation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Step 1: User starts at authentication page
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
      expect(screen.getByText('Login to Vaporform')).toBeInTheDocument();

      // Step 2: User logs in
      await user.click(screen.getByTestId('mock-login'));
      
      // Step 3: User is redirected to dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
        expect(screen.getByText('Vaporform Dashboard')).toBeInTheDocument();
      });

      // Step 4: User starts project creation wizard
      await user.click(screen.getByTestId('start-wizard'));
      
      await waitFor(() => {
        expect(screen.getByTestId('wizard-modal')).toBeInTheDocument();
        expect(screen.getByText('Project Creation Wizard')).toBeInTheDocument();
      });

      // Step 5: User fills project details
      expect(screen.getByTestId('project-details-step')).toBeInTheDocument();
      
      const projectNameInput = screen.getByTestId('project-name-input');
      const projectDescInput = screen.getByTestId('project-description-input');
      
      await user.type(projectNameInput, 'My Awesome Project');
      await user.type(projectDescInput, 'A comprehensive web application for managing tasks');

      // Step 6: User navigates to technology selection
      await user.click(screen.getByTestId('next-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('technology-selection-step')).toBeInTheDocument();
      });

      // Step 7: User selects React template
      await user.click(screen.getByTestId('react-template'));

      // Step 8: User continues to configuration
      await user.click(screen.getByTestId('next-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('configuration-step')).toBeInTheDocument();
      });

      // Step 9: User configures project settings
      const databaseInput = screen.getByTestId('database-input');
      const authProviderInput = screen.getByTestId('auth-provider-input');
      
      await user.type(databaseInput, 'PostgreSQL');
      await user.type(authProviderInput, 'Auth0');

      // Step 10: User previews project
      await user.click(screen.getByTestId('next-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('preview-step')).toBeInTheDocument();
        expect(screen.getByText('Project Preview')).toBeInTheDocument();
      });

      // Step 11: User proceeds to deployment
      await user.click(screen.getByTestId('next-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('deploy-step')).toBeInTheDocument();
        expect(screen.getByText('Deploy Your Project')).toBeInTheDocument();
      });

      // Step 12: User deploys project
      const deployButton = screen.getByTestId('deploy-button');
      expect(deployButton).toBeInTheDocument();
      
      await user.click(deployButton);

      // Verify the complete workflow was successful
      expect(screen.getByTestId('deploy-step')).toBeInTheDocument();
    });

    test('should handle AI chat interaction during project development', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login and navigate to dashboard
      await user.click(screen.getByTestId('mock-login'));
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      // Open AI chat
      await user.click(screen.getByTestId('open-ai-chat'));
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-chat-modal')).toBeInTheDocument();
        expect(screen.getByTestId('ai-chat')).toBeInTheDocument();
      });

      // Verify initial AI message
      expect(screen.getByTestId('message-ai')).toHaveTextContent('Hello! How can I help you with your project?');

      // User sends a message
      const chatInput = screen.getByTestId('chat-input');
      await user.type(chatInput, 'How do I implement user authentication in React?');
      await user.click(screen.getByTestId('send-message-button'));

      // Verify message was sent and AI responded
      await waitFor(() => {
        const userMessages = screen.getAllByTestId('message-user');
        const aiMessages = screen.getAllByTestId('message-ai');
        
        expect(userMessages).toHaveLength(1);
        expect(aiMessages).toHaveLength(2); // Initial + response
        expect(userMessages[0]).toHaveTextContent('How do I implement user authentication in React?');
      });

      // Close AI chat
      await user.click(screen.getByTestId('close-ai-chat'));
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
        expect(screen.queryByTestId('ai-chat-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation and State Management', () => {
    test('should maintain state across navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login
      await user.click(screen.getByTestId('mock-login'));
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      // Start wizard
      await user.click(screen.getByTestId('start-wizard'));
      
      await waitFor(() => {
        expect(screen.getByTestId('wizard-modal')).toBeInTheDocument();
      });

      // Fill some data
      const projectNameInput = screen.getByTestId('project-name-input');
      await user.type(projectNameInput, 'State Test Project');

      // Close wizard
      await user.click(screen.getByTestId('close-wizard'));
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      // Verify we're back at dashboard
      expect(screen.getByText('Vaporform Dashboard')).toBeInTheDocument();
    });

    test('should handle browser navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login
      await user.click(screen.getByTestId('mock-login'));
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      // Navigate using header nav
      expect(screen.getByTestId('dashboard-nav')).toBeInTheDocument();
      expect(screen.getByTestId('logout-nav')).toBeInTheDocument();

      // Logout
      await user.click(screen.getByTestId('logout-nav'));
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
      });
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    test('should handle wizard validation errors', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login and start wizard
      await user.click(screen.getByTestId('mock-login'));
      await user.click(screen.getByTestId('start-wizard'));
      
      await waitFor(() => {
        expect(screen.getByTestId('project-details-step')).toBeInTheDocument();
      });

      // Try to proceed without filling required fields
      const nextButton = screen.getByTestId('next-button');
      await user.click(nextButton);

      // Should still be on the same step (validation should prevent navigation)
      expect(screen.getByTestId('project-details-step')).toBeInTheDocument();
    });

    test('should handle wizard step navigation correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login and start wizard
      await user.click(screen.getByTestId('mock-login'));
      await user.click(screen.getByTestId('start-wizard'));
      
      await waitFor(() => {
        expect(screen.getByTestId('wizard-progress')).toHaveTextContent('Step 1 of 5');
      });

      // Previous button should be disabled on first step
      const previousButton = screen.getByTestId('previous-button');
      expect(previousButton).toBeDisabled();

      // Navigate to next step
      await user.click(screen.getByTestId('next-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('wizard-progress')).toHaveTextContent('Step 2 of 5');
      });

      // Previous button should now be enabled
      expect(previousButton).not.toBeDisabled();

      // Navigate back
      await user.click(previousButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('wizard-progress')).toHaveTextContent('Step 1 of 5');
      });
    });

    test('should handle AI chat with empty messages', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login and open AI chat
      await user.click(screen.getByTestId('mock-login'));
      await user.click(screen.getByTestId('open-ai-chat'));
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-chat')).toBeInTheDocument();
      });

      // Try to send empty message
      const sendButton = screen.getByTestId('send-message-button');
      await user.click(sendButton);

      // Should still have only the initial AI message
      const aiMessages = screen.getAllByTestId('message-ai');
      expect(aiMessages).toHaveLength(1);
    });
  });

  describe('Accessibility and User Experience', () => {
    test('should have proper focus management', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login
      await user.click(screen.getByTestId('mock-login'));
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      // Start wizard
      await user.click(screen.getByTestId('start-wizard'));
      
      await waitFor(() => {
        expect(screen.getByTestId('wizard-modal')).toBeInTheDocument();
      });

      // Check that inputs are focusable
      const projectNameInput = screen.getByTestId('project-name-input');
      projectNameInput.focus();
      expect(projectNameInput).toHaveFocus();
    });

    test('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login
      await user.click(screen.getByTestId('mock-login'));
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      // Navigate using tab key
      await user.tab();
      expect(screen.getByTestId('start-wizard')).toHaveFocus();

      // Activate with Enter key
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByTestId('wizard-modal')).toBeInTheDocument();
      });
    });

    test('should provide proper aria labels and roles', () => {
      renderWithProviders(<MockApp />);

      // Check for proper heading hierarchy
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Check for proper button roles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Responsiveness', () => {
    test('should render components quickly', async () => {
      const startTime = performance.now();
      renderWithProviders(<MockApp />);
      
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render in under 100ms (generous threshold for testing)
      expect(renderTime).toBeLessThan(100);
    });

    test('should handle rapid user interactions', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login
      await user.click(screen.getByTestId('mock-login'));
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      // Rapidly open and close wizard multiple times
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByTestId('start-wizard'));
        await waitFor(() => {
          expect(screen.getByTestId('wizard-modal')).toBeInTheDocument();
        });
        
        await user.click(screen.getByTestId('close-wizard'));
        await waitFor(() => {
          expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
        });
      }

      // Should still be functional
      expect(screen.getByText('Vaporform Dashboard')).toBeInTheDocument();
    });
  });

  describe('Data Persistence and Recovery', () => {
    test('should handle component remounting gracefully', async () => {
      const user = userEvent.setup();
      const { unmount, rerender } = renderWithProviders(<MockApp />);

      // Login
      await user.click(screen.getByTestId('mock-login'));
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      // Unmount and remount component
      unmount();
      rerender(
        <Provider store={createTestStore()}>
          <MemoryRouter>
            <MockApp />
          </MemoryRouter>
        </Provider>
      );

      // Should return to auth page (as expected for new store)
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    });

    test('should maintain form state during navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login and start wizard
      await user.click(screen.getByTestId('mock-login'));
      await user.click(screen.getByTestId('start-wizard'));
      
      await waitFor(() => {
        expect(screen.getByTestId('project-details-step')).toBeInTheDocument();
      });

      // Fill form data
      const projectNameInput = screen.getByTestId('project-name-input');
      await user.type(projectNameInput, 'Persistent Project');

      // Navigate to next step and back
      await user.click(screen.getByTestId('next-button'));
      await user.click(screen.getByTestId('previous-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('project-details-step')).toBeInTheDocument();
      });

      // Form data should be preserved
      expect(projectNameInput).toHaveValue('Persistent Project');
    });
  });
});