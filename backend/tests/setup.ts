// Test setup and configuration
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://postgres:test@localhost:5432/vaporform_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

// Global test setup
beforeAll(async () => {
  console.log('🧪 Starting test suite...');
  
  // Setup test database connection
  // Initialize test data
  // Start test services if needed
});

// Global test teardown
afterAll(async () => {
  console.log('🧪 Test suite completed');
  
  // Close database connections
  // Clean up test data
  // Stop test services
});

// Setup before each test
beforeEach(async () => {
  // Reset test state
  // Clear caches
});

// Cleanup after each test
afterEach(async () => {
  // Clean up test artifacts
  // Reset mocks
});

// Mock external dependencies
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Mocked AI response' }],
        }),
      },
    })),
  };
});

// Mock Encore.ts modules
jest.mock('encore.dev/log', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('encore.dev/api', () => ({
  api: jest.fn((config, handler) => handler),
  APICallMeta: jest.fn(),
}));

jest.mock('encore.dev/auth', () => ({
  authHandler: jest.fn((handler) => handler),
}));

// Test utilities
export const testUtils = {
  // Create test user
  createTestUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
    createdAt: new Date(),
  }),
  
  // Create test project
  createTestProject: () => ({
    id: 'test-project-id',
    name: 'Test Project',
    description: 'A test project',
    type: 'web' as const,
    status: 'active' as const,
    owner: 'test-user-id',
    collaborators: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    config: {
      language: 'typescript',
      dependencies: [],
      environment: {},
      aiFeatures: {
        codeGeneration: true,
        codeReview: true,
        debugging: true,
        testing: true,
      },
    },
  }),
  
  // Create mock API request
  createMockRequest: (auth?: any) => ({
    auth,
  }),
  
  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};