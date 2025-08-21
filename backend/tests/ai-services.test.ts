// Additional mocks for specific tests
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue('Mock file content for testing'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
  readdir: jest.fn().mockResolvedValue(['file1.js', 'file2.ts']),
  stat: jest.fn().mockResolvedValue({ isDirectory: () => false, isFile: () => true }),
}));

jest.mock('child_process', () => ({
  exec: jest.fn().mockImplementation((command, callback) => {
    if (callback) {
      callback(null, { stdout: 'mock command output', stderr: '' });
    }
  })
}));

describe('AI Services Integration', () => {
  const mockAuth = {
    userID: 'test-user-123',
    email: 'test@example.com',
    roles: ['user']
  };

  const mockAPICallMeta = {
    auth: mockAuth,
    requestId: 'test-request-123',
    timestamp: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Core AI Service', () => {
    test('should generate code successfully', async () => {
      // Dynamic import to avoid Jest module hoisting issues
      const { generateCode } = await import('../src/services/ai');
      
      const request = {
        prompt: 'Create a React component for a todo list',
        language: 'typescript',
        framework: 'react',
        context: 'Building a todo application',
      };

      const result = await generateCode(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.result).toContain('Mocked AI response');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });

    test('should review code successfully', async () => {
      const { reviewCode } = await import('../src/services/ai');
      
      const request = {
        code: 'function test() { return true; }',
        language: 'javascript',
        focus: ['security', 'performance'] as any,
      };

      const result = await reviewCode(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.result).toContain('Mocked AI response');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should debug code successfully', async () => {
      const { debugCode } = await import('../src/services/ai');
      
      const request = {
        code: 'const result = someFunction();',
        error: 'ReferenceError: someFunction is not defined',
        language: 'javascript',
        context: 'Trying to call an undefined function',
      };

      const result = await debugCode(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.result).toContain('Mocked AI response');
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    test('should generate tests successfully', async () => {
      const { generateTests } = await import('../src/services/ai');
      
      const request = {
        code: 'function add(a, b) { return a + b; }',
        language: 'javascript',
        testType: 'unit' as any,
        framework: 'jest',
      };

      const result = await generateTests(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.result).toContain('Mocked AI response');
    });
  });

  describe('Project Analysis', () => {
    test('should analyze project structure', async () => {
      const { analyzeProject } = await import('../src/services/ai');
      
      const request = {
        projectPath: '/test/project',
        analysisType: 'all' as any,
        includeRecommendations: true,
      };

      const result = await analyzeProject(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.result).toContain('Mocked AI response');
      expect(result.analysis).toBeDefined();
      expect(result.suggestions).toBeInstanceOf(Array);
    });
  });

  describe('Code Analysis', () => {
    test('should analyze code in real-time', async () => {
      const { analyzeCodeRealTime } = await import('../src/services/code-analysis');
      
      const request = {
        code: 'function test() { console.log("test"); }',
        filePath: '/src/test.js',
        language: 'javascript',
        analysisType: 'all' as any,
        realTime: true,
        includeAutoFix: true,
      };

      const result = await analyzeCodeRealTime(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.metrics).toBeDefined();
    });
  });

  describe('Project Generation', () => {
    test('should generate a complete project', async () => {
      const { generateProject } = await import('../src/services/project-generator');
      
      const request = {
        name: 'test-app',
        description: 'A test application for demonstration',
        type: 'web' as any,
        complexity: 'moderate' as any,
        includeAuth: true,
        includeDatabase: true,
        includeTesting: true,
        includeDocker: true,
      };

      const result = await generateProject(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.structure).toBeDefined();
      expect(result.files).toBeInstanceOf(Array);
      expect(result.commands).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('Security Validation', () => {
    test('should validate content security', async () => {
      const { validateSecurity } = await import('../src/services/ai-security');
      
      const request = {
        content: 'const apiKey = "safe-test-content";',
        contentType: 'code' as any,
        fileName: 'test.js',
        userId: 'test-user',
        sessionId: 'test-session',
      };

      const result = await validateSecurity(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      expect(result.risks).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });

    test('should check rate limits', async () => {
      const { checkRateLimit } = await import('../src/services/ai-security');
      
      const request = {
        userId: 'test-user',
        endpoint: 'code_generation',
        tokenCount: 100,
      };

      const result = await checkRateLimit(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(typeof result.allowed).toBe('boolean');
      expect(result.limits).toBeDefined();
      expect(result.usage).toBeDefined();
    });
  });

  describe('Workflow Integration', () => {
    test('should generate commit messages', async () => {
      const { generateCommitMessage } = await import('../src/services/ai-workflow');
      
      const request = {
        changes: [
          {
            filePath: '/src/component.tsx',
            changeType: 'modified' as any,
            diff: '+ const newFeature = true;',
          }
        ],
        commitType: 'feat' as any,
        scope: 'ui',
        includeDescription: true,
        conventional: true,
      };

      const result = await generateCommitMessage(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.commitMessage).toBeDefined();
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.bestPractices).toBeInstanceOf(Array);
    });
  });

  describe('Integration Health Check', () => {
    test('should perform health check', async () => {
      const { healthCheck } = await import('../src/services/ai-integration');
      
      const result = await healthCheck({}, { auth: undefined } as any);

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(result.status);
      expect(result.services).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.version).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    test('should handle complete development workflow', async () => {
      console.log('Testing complete development workflow...');

      // 1. Generate project structure
      const { generateProject } = await import('../src/services/project-generator');
      const projectRequest = {
        name: 'integration-test-app',
        description: 'Integration test application',
        type: 'web' as any,
        complexity: 'simple' as any,
        includeAuth: false,
        includeDatabase: false,
        includeTesting: true,
        includeDocker: false,
      };

      const projectResult = await generateProject(projectRequest, mockAPICallMeta);
      expect(projectResult.files.length).toBeGreaterThan(0);

      // 2. Generate code for a component
      const { generateCode } = await import('../src/services/ai');
      const codeRequest = {
        prompt: 'Create a React button component',
        language: 'typescript',
        framework: 'react',
      };

      const codeResult = await generateCode(codeRequest, mockAPICallMeta);
      expect(codeResult.result).toBeDefined();

      // 3. Generate commit message for changes
      const { generateCommitMessage } = await import('../src/services/ai-workflow');
      const commitRequest = {
        changes: [
          {
            filePath: '/src/components/Button.tsx',
            changeType: 'added' as any,
            diff: '+ export const Button = () => { ... };',
          }
        ],
        commitType: 'feat' as any,
        includeDescription: true,
        conventional: true,
      };

      const commitResult = await generateCommitMessage(commitRequest, mockAPICallMeta);
      expect(commitResult.commitMessage).toBeDefined();

      console.log('✅ Complete development workflow test passed');
    });
  });

  describe('Error Handling', () => {
    test('should handle API failures gracefully', async () => {
      // Import the service first
      const { generateCode } = await import('../src/services/ai');
      
      // Mock the Anthropic SDK to fail
      const mockAnthropicInstance = {
        messages: {
          create: jest.fn().mockRejectedValue(new Error('Simulated API failure'))
        }
      };
      
      // Override the import
      const AnthropicMock = require('@anthropic-ai/sdk');
      AnthropicMock.default.mockImplementationOnce(() => mockAnthropicInstance);

      const request = {
        prompt: 'Test prompt that should fail',
        language: 'javascript',
      };

      await expect(generateCode(request, mockAPICallMeta)).rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should handle concurrent requests efficiently', async () => {
      const { generateCode } = await import('../src/services/ai');
      
      const concurrentRequests = Array(3).fill(null).map((_, index) => ({
        prompt: `Concurrent request ${index}`,
        language: 'javascript',
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        concurrentRequests.map(req => generateCode(req, mockAPICallMeta))
      );
      const endTime = Date.now();

      expect(results).toHaveLength(3);
      expect(results.every(r => r.result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should be reasonably fast
    });
  });
});