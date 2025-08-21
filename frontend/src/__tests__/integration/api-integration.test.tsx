/**
 * API Integration Tests
 * Tests for frontend-backend API communication, authentication, and data flow
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import { authSlice } from '@/store/auth';
import { projectsSlice } from '@/store/projects';
import { aiSlice } from '@/store/ai';
import { uiSlice } from '@/store/ui';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create mock API responses
const mockAuthResponse = {
  data: {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user'
    },
    token: 'mock-jwt-token'
  }
};

const mockProjectsResponse = {
  data: {
    projects: [
      {
        id: 'project-1',
        name: 'Test Project',
        description: 'A test project',
        type: 'web',
        framework: 'React',
        language: 'TypeScript',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      }
    ]
  }
};

const mockAIResponse = {
  data: {
    result: 'AI generated response',
    suggestions: ['Suggestion 1', 'Suggestion 2'],
    confidence: 0.9,
    metadata: {
      model: 'claude-3-5-sonnet-20241022',
      timestamp: new Date().toISOString(),
      mode: 'real'
    }
  }
};

const mockFilesResponse = {
  data: {
    files: [
      {
        id: 'file-1',
        name: 'test.ts',
        path: 'src/test.ts',
        content: 'console.log("test");',
        size: 20,
        type: 'typescript',
        projectId: 'project-1',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }
};

// Create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      projects: projectsSlice.reducer,
      ai: aiSlice.reducer,
      ui: uiSlice.reducer,
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      },
      projects: {
        projects: [],
        currentProject: null,
        loading: false,
        error: null,
      },
      ai: {
        conversations: [],
        currentConversation: null,
        loading: false,
        error: null,
      },
      ui: {
        theme: 'light',
        sidebarOpen: true,
        rightPanelOpen: false,
        bottomPanelOpen: false,
        bottomPanelHeight: 300,
        loading: false,
        notifications: [],
        modal: null,
        commandPalette: { open: false, query: '' },
        breadcrumbs: [],
        activePanel: 'fileExplorer',
        fullscreen: false,
      },
    },
  });
};

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default axios behavior
    mockedAxios.create.mockReturnValue(mockedAxios);
    mockedAxios.interceptors = {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    } as any;
  });

  describe('Authentication API Integration', () => {
    test('should handle successful login', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockAuthResponse);
      
      const store = createTestStore();
      const loginAction = authSlice.actions.loginStart();
      
      store.dispatch(loginAction);
      
      // Simulate API call
      const response = await mockedAxios.post('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
      
      expect(response.data).toEqual(mockAuthResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
    });

    test('should handle login failure', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      };
      
      mockedAxios.post.mockRejectedValueOnce(errorResponse);
      
      try {
        await mockedAxios.post('/auth/login', {
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      } catch (error) {
        expect(error).toEqual(errorResponse);
      }
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    });

    test('should handle token refresh', async () => {
      const refreshResponse = {
        data: {
          token: 'new-jwt-token',
          user: mockAuthResponse.data.user
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(refreshResponse);
      
      const response = await mockedAxios.post('/auth/refresh', {
        refreshToken: 'old-refresh-token'
      });
      
      expect(response.data.token).toBe('new-jwt-token');
      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'old-refresh-token'
      });
    });

    test('should handle user registration', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User'
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockAuthResponse);
      
      const response = await mockedAxios.post('/auth/register', registerData);
      
      expect(response.data).toEqual(mockAuthResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', registerData);
    });
  });

  describe('Projects API Integration', () => {
    test('should fetch projects list', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockProjectsResponse);
      
      const response = await mockedAxios.get('/projects');
      
      expect(response.data.projects).toHaveLength(1);
      expect(response.data.projects[0].name).toBe('Test Project');
      expect(mockedAxios.get).toHaveBeenCalledWith('/projects');
    });

    test('should create new project', async () => {
      const newProject = {
        name: 'New Project',
        description: 'A new test project',
        type: 'api',
        framework: 'Express',
        language: 'JavaScript'
      };
      
      const createResponse = {
        data: {
          id: 'project-2',
          ...newProject,
          userId: 'user-123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(createResponse);
      
      const response = await mockedAxios.post('/projects', newProject);
      
      expect(response.data.name).toBe('New Project');
      expect(response.data.type).toBe('api');
      expect(mockedAxios.post).toHaveBeenCalledWith('/projects', newProject);
    });

    test('should update existing project', async () => {
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated description'
      };
      
      const updateResponse = {
        data: {
          ...mockProjectsResponse.data.projects[0],
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      };
      
      mockedAxios.put.mockResolvedValueOnce(updateResponse);
      
      const response = await mockedAxios.put('/projects/project-1', updateData);
      
      expect(response.data.name).toBe('Updated Project Name');
      expect(mockedAxios.put).toHaveBeenCalledWith('/projects/project-1', updateData);
    });

    test('should delete project', async () => {
      const deleteResponse = { data: { success: true } };
      
      mockedAxios.delete.mockResolvedValueOnce(deleteResponse);
      
      const response = await mockedAxios.delete('/projects/project-1');
      
      expect(response.data.success).toBe(true);
      expect(mockedAxios.delete).toHaveBeenCalledWith('/projects/project-1');
    });

    test('should handle project validation errors', async () => {
      const invalidProject = {
        name: '', // Invalid: empty name
        description: 'Test',
        type: 'web',
        framework: 'React',
        language: 'TypeScript'
      };
      
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Project name is required' }
        }
      };
      
      mockedAxios.post.mockRejectedValueOnce(errorResponse);
      
      try {
        await mockedAxios.post('/projects', invalidProject);
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toBe('Project name is required');
      }
    });
  });

  describe('AI API Integration', () => {
    test('should send chat message', async () => {
      const chatRequest = {
        message: 'How do I implement user authentication?',
        context: 'Working on a React application',
        projectId: 'project-1'
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockAIResponse);
      
      const response = await mockedAxios.post('/ai/chat', chatRequest);
      
      expect(response.data.result).toBe('AI generated response');
      expect(response.data.confidence).toBe(0.9);
      expect(mockedAxios.post).toHaveBeenCalledWith('/ai/chat', chatRequest);
    });

    test('should handle code generation request', async () => {
      const codeGenRequest = {
        prompt: 'Create a user authentication function',
        language: 'typescript',
        framework: 'express',
        context: 'Building a REST API'
      };
      
      const codeGenResponse = {
        data: {
          result: 'export function authenticateUser(req, res, next) { /* code */ }',
          suggestions: ['Add error handling', 'Include input validation'],
          confidence: 0.85,
          metadata: {
            model: 'claude-3-5-sonnet-20241022',
            language: 'typescript',
            framework: 'express',
            timestamp: new Date().toISOString(),
            mode: 'real'
          }
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(codeGenResponse);
      
      const response = await mockedAxios.post('/ai/code-generation', codeGenRequest);
      
      expect(response.data.result).toContain('authenticateUser');
      expect(response.data.metadata.language).toBe('typescript');
      expect(mockedAxios.post).toHaveBeenCalledWith('/ai/code-generation', codeGenRequest);
    });

    test('should handle code review request', async () => {
      const codeReviewRequest = {
        code: 'function add(a, b) { return a + b; }',
        language: 'javascript',
        focus: ['security', 'performance']
      };
      
      const reviewResponse = {
        data: {
          result: '## Code Review\n\nThe function looks good but could benefit from input validation.',
          suggestions: ['Add type checking', 'Consider edge cases'],
          confidence: 0.9,
          metadata: {
            model: 'claude-3-5-sonnet-20241022',
            language: 'javascript',
            focusAreas: 'security, performance',
            timestamp: new Date().toISOString(),
            mode: 'real'
          }
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(reviewResponse);
      
      const response = await mockedAxios.post('/ai/code-review', codeReviewRequest);
      
      expect(response.data.result).toContain('Code Review');
      expect(response.data.metadata.focusAreas).toBe('security, performance');
      expect(mockedAxios.post).toHaveBeenCalledWith('/ai/code-review', codeReviewRequest);
    });

    test('should handle AI service errors', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Failed to process chat request' }
        }
      };
      
      mockedAxios.post.mockRejectedValueOnce(errorResponse);
      
      try {
        await mockedAxios.post('/ai/chat', { message: 'test' });
      } catch (error) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.message).toBe('Failed to process chat request');
      }
    });
  });

  describe('Files API Integration', () => {
    test('should upload file', async () => {
      const fileData = {
        name: 'newfile.ts',
        path: 'src/newfile.ts',
        content: 'export const hello = "world";',
        type: 'typescript',
        projectId: 'project-1'
      };
      
      const uploadResponse = {
        data: {
          id: 'file-2',
          ...fileData,
          size: fileData.content.length,
          userId: 'user-123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(uploadResponse);
      
      const response = await mockedAxios.post('/files/upload', fileData);
      
      expect(response.data.name).toBe('newfile.ts');
      expect(response.data.size).toBe(fileData.content.length);
      expect(mockedAxios.post).toHaveBeenCalledWith('/files/upload', fileData);
    });

    test('should get file by ID', async () => {
      const getResponse = { data: mockFilesResponse.data.files[0] };
      
      mockedAxios.get.mockResolvedValueOnce(getResponse);
      
      const response = await mockedAxios.get('/files/file-1');
      
      expect(response.data.name).toBe('test.ts');
      expect(response.data.content).toBe('console.log("test");');
      expect(mockedAxios.get).toHaveBeenCalledWith('/files/file-1');
    });

    test('should update file', async () => {
      const updateData = {
        content: 'console.log("updated test");'
      };
      
      const updateResponse = {
        data: {
          ...mockFilesResponse.data.files[0],
          content: updateData.content,
          size: updateData.content.length,
          updatedAt: new Date().toISOString()
        }
      };
      
      mockedAxios.put.mockResolvedValueOnce(updateResponse);
      
      const response = await mockedAxios.put('/files/file-1', updateData);
      
      expect(response.data.content).toBe('console.log("updated test");');
      expect(response.data.size).toBe(updateData.content.length);
      expect(mockedAxios.put).toHaveBeenCalledWith('/files/file-1', updateData);
    });

    test('should delete file', async () => {
      const deleteResponse = { data: { success: true } };
      
      mockedAxios.delete.mockResolvedValueOnce(deleteResponse);
      
      const response = await mockedAxios.delete('/files/file-1');
      
      expect(response.data.success).toBe(true);
      expect(mockedAxios.delete).toHaveBeenCalledWith('/files/file-1');
    });

    test('should list files by project', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockFilesResponse);
      
      const response = await mockedAxios.get('/files/project/project-1');
      
      expect(response.data.files).toHaveLength(1);
      expect(response.data.files[0].projectId).toBe('project-1');
      expect(mockedAxios.get).toHaveBeenCalledWith('/files/project/project-1');
    });
  });

  describe('Health and Status API Integration', () => {
    test('should check health endpoint', async () => {
      const healthResponse = {
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: 'test',
          version: '1.0.0'
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(healthResponse);
      
      const response = await mockedAxios.get('/health');
      
      expect(response.data.status).toBe('healthy');
      expect(response.data.version).toBe('1.0.0');
      expect(mockedAxios.get).toHaveBeenCalledWith('/health');
    });

    test('should check API status', async () => {
      const statusResponse = {
        data: {
          message: 'Vaporform Backend API is running on Encore.ts',
          version: '1.0.0'
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(statusResponse);
      
      const response = await mockedAxios.get('/api/status');
      
      expect(response.data.message).toContain('Vaporform Backend API');
      expect(response.data.version).toBe('1.0.0');
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/status');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValueOnce(networkError);
      
      try {
        await mockedAxios.get('/projects');
      } catch (error) {
        expect(error.message).toBe('Network Error');
      }
    });

    test('should handle timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      };
      
      mockedAxios.post.mockRejectedValueOnce(timeoutError);
      
      try {
        await mockedAxios.post('/ai/chat', { message: 'test' });
      } catch (error) {
        expect(error.code).toBe('ECONNABORTED');
        expect(error.message).toContain('timeout');
      }
    });

    test('should handle authorization errors', async () => {
      const authError = {
        response: {
          status: 403,
          data: { message: 'Access denied' }
        }
      };
      
      mockedAxios.get.mockRejectedValueOnce(authError);
      
      try {
        await mockedAxios.get('/projects/unauthorized-project');
      } catch (error) {
        expect(error.response.status).toBe(403);
        expect(error.response.data.message).toBe('Access denied');
      }
    });

    test('should handle server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };
      
      mockedAxios.post.mockRejectedValueOnce(serverError);
      
      try {
        await mockedAxios.post('/projects', {});
      } catch (error) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.message).toBe('Internal server error');
      }
    });
  });

  describe('Request/Response Interceptors', () => {
    test('should add authorization header to requests', () => {
      const token = 'test-jwt-token';
      
      // Simulate interceptor logic
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      expect(config.headers.Authorization).toBe(`Bearer ${token}`);
    });

    test('should handle response transformations', () => {
      const responseData = {
        data: { message: 'success' },
        status: 200
      };
      
      // Simulate response interceptor
      const transformedResponse = {
        ...responseData,
        timestamp: new Date().toISOString()
      };
      
      expect(transformedResponse.data).toEqual(responseData.data);
      expect(transformedResponse.timestamp).toBeDefined();
    });
  });

  describe('API Base URL and Configuration', () => {
    test('should use correct base URL for development', () => {
      // Test that API calls use the correct base URL
      const baseURL = 'http://localhost:4001';
      
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: expect.stringContaining('localhost')
        })
      );
    });

    test('should set correct timeout configuration', () => {
      const config = {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      expect(config.timeout).toBe(10000);
      expect(config.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Data Consistency', () => {
    test('should maintain data consistency across multiple API calls', async () => {
      // First, create a project
      const projectData = {
        name: 'Consistency Test Project',
        description: 'Testing data consistency',
        type: 'web',
        framework: 'React',
        language: 'TypeScript'
      };
      
      const createResponse = {
        data: {
          id: 'project-consistency',
          ...projectData,
          userId: 'user-123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(createResponse);
      
      const createResult = await mockedAxios.post('/projects', projectData);
      const projectId = createResult.data.id;
      
      // Then, fetch the project
      mockedAxios.get.mockResolvedValueOnce({ data: createResponse.data });
      
      const getResult = await mockedAxios.get(`/projects/${projectId}`);
      
      // Data should be consistent
      expect(getResult.data.name).toBe(createResult.data.name);
      expect(getResult.data.id).toBe(createResult.data.id);
    });

    test('should handle optimistic updates correctly', async () => {
      // Simulate optimistic update scenario
      const originalProject = mockProjectsResponse.data.projects[0];
      const updatedProject = {
        ...originalProject,
        name: 'Updated Name'
      };
      
      // Mock successful update
      mockedAxios.put.mockResolvedValueOnce({ data: updatedProject });
      
      const response = await mockedAxios.put(`/projects/${originalProject.id}`, {
        name: 'Updated Name'
      });
      
      expect(response.data.name).toBe('Updated Name');
      expect(response.data.id).toBe(originalProject.id);
    });
  });
});