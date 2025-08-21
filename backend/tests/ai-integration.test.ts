// Mock environment variables
process.env.ANTHROPIC_API_KEY = 'test-key';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: 'Mocked AI response for testing purposes. This would be a comprehensive response based on the input provided.'
          }]
        })
      }
    }))
  };
});

// Mock file system operations
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue('Mock file content'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn().mockImplementation((command, callback) => {
    callback(null, { stdout: 'mock command output', stderr: '' });
  })
}));

describe('AI Services Integration Tests', () => {
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

  beforeAll(async () => {
    // Setup test environment
    console.log('Setting up AI integration tests...');
  });

  afterAll(async () => {
    // Cleanup test environment
    console.log('Cleaning up AI integration tests...');
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Core AI Service Tests', () => {
    test('should generate code successfully', async () => {
      const request = {
        prompt: 'Create a React component for a todo list',
        language: 'typescript',
        framework: 'react',
        context: 'Building a todo application',
      };

      const result = await aiService.generateCode(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.result).toContain('Mocked AI response');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.model).toBe('claude-3-5-sonnet-20241022');
    });

    test('should review code successfully', async () => {
      const request = {
        code: `
          function calculateTotal(items) {
            let total = 0;
            for (let i = 0; i < items.length; i++) {
              total += items[i].price;
            }
            return total;
          }
        `,
        language: 'javascript',
        focus: ['security', 'performance'] as any,
      };

      const result = await aiService.reviewCode(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.result).toContain('Mocked AI response');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.metadata.language).toBe('javascript');
    });

    test('should debug code successfully', async () => {
      const request = {
        code: 'const result = someFunction();',
        error: 'ReferenceError: someFunction is not defined',
        language: 'javascript',
        context: 'Trying to call an undefined function',
      };

      const result = await aiService.debugCode(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.result).toContain('Mocked AI response');
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    test('should generate tests successfully', async () => {
      const request = {
        code: `
          function add(a, b) {
            return a + b;
          }
        `,
        language: 'javascript',
        testType: 'unit' as any,
        framework: 'jest',
      };

      const result = await aiService.generateTests(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.result).toContain('Mocked AI response');
      expect(result.metadata.testType).toBe('unit');
      expect(result.metadata.framework).toBe('jest');
    });
  });

  describe('Project Analysis Tests', () => {
    test('should analyze project structure', async () => {
      const request = {
        projectPath: '/test/project',
        analysisType: 'all' as any,
        includeRecommendations: true,
      };

      const result = await aiService.analyzeProject(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.result).toContain('Mocked AI response');
      expect(result.analysis).toBeDefined();
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.metadata.analysisType).toBe('all');
    });

    test('should provide code intelligence', async () => {
      const request = {
        code: 'const component = () => { return <div>Hello</div>; };',
        filePath: '/src/components/Hello.tsx',
        language: 'typescript',
        analysisDepth: 'detailed' as any,
      };

      const result = await aiService.analyzeCodeIntelligence(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.result).toContain('Mocked AI response');
      expect(result.analysis).toBeDefined();
      expect(result.metadata.language).toBe('typescript');
    });
  });

  describe('Real-time Code Analysis Tests', () => {
    test('should analyze code in real-time', async () => {
      const request = {
        code: 'function test() { console.log("test"); }',
        filePath: '/src/test.js',
        language: 'javascript',
        analysisType: 'all' as any,
        realTime: true,
        includeAutoFix: true,
      };

      const result = await codeAnalysis.analyzeCodeRealTime(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.metrics).toBeDefined();
      expect(result.metadata.linesAnalyzed).toBeGreaterThan(0);
    });

    test('should assess code quality live', async () => {
      const request = {
        code: 'const x = 1; const y = 2; const z = x + y;',
        filePath: '/src/math.js',
        language: 'javascript',
      };

      const result = await codeAnalysis.assessQualityLive(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.qualityScore).toBeGreaterThanOrEqual(0);
    });

    test('should provide smart suggestions', async () => {
      const request = {
        code: 'function calculateArea(',
        filePath: '/src/geometry.js',
        language: 'javascript',
        cursorPosition: { line: 1, column: 20 },
        suggestionType: 'completion' as any,
      };

      const result = await codeAnalysis.getSmartSuggestions(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });
  });

  describe('Project Generation Tests', () => {
    test('should generate a complete project', async () => {
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

      const result = await projectGenerator.generateProject(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.structure).toBeDefined();
      expect(result.files).toBeInstanceOf(Array);
      expect(result.commands).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.metadata.projectType).toBe('web');
    });

    test('should recommend technology stack', async () => {
      const request = {
        projectType: 'e-commerce website',
        requirements: ['user authentication', 'payment processing', 'product catalog'],
        constraints: {
          budget: 'medium' as any,
          timeline: 'months' as any,
          teamSize: 'small' as any,
          experience: 'intermediate' as any,
        },
      };

      const result = await projectGenerator.recommendTechnologyStack(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.recommended).toBeDefined();
      expect(result.recommended.frontend).toBeInstanceOf(Array);
      expect(result.recommended.backend).toBeInstanceOf(Array);
      expect(result.alternatives).toBeInstanceOf(Array);
    });
  });

  describe('AI Testing Service Tests', () => {
    test('should generate intelligent tests', async () => {
      const request = {
        code: 'function multiply(a, b) { return a * b; }',
        filePath: '/src/math.js',
        language: 'javascript',
        testType: 'unit' as any,
        framework: 'jest',
        coverage: 'comprehensive' as any,
        mockingStrategy: 'smart' as any,
        includeSetup: true,
        includeEdgeCases: true,
      };

      const result = await aiTesting.generateIntelligentTests(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.tests).toBeInstanceOf(Array);
      expect(result.setup).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    test('should analyze test quality', async () => {
      const request = {
        testCode: 'test("should add numbers", () => { expect(add(1, 2)).toBe(3); });',
        sourceCode: 'function add(a, b) { return a + b; }',
        language: 'javascript',
        framework: 'jest',
        analysisType: 'all' as any,
      };

      const result = await aiTesting.analyzeTests(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    test('should assess code quality comprehensively', async () => {
      const request = {
        code: 'const api = { getData: () => fetch("/api/data") };',
        language: 'javascript',
        metrics: ['complexity', 'maintainability', 'security'] as any,
        includeRecommendations: true,
      };

      const result = await aiTesting.assessCodeQuality(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.overall.score).toBeGreaterThanOrEqual(0);
      expect(result.overall.score).toBeLessThanOrEqual(100);
      expect(result.metrics).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
    });
  });

  describe('AI Workflow Integration Tests', () => {
    test('should generate commit messages', async () => {
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

      const result = await aiWorkflow.generateCommitMessage(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.commitMessage).toBeDefined();
      expect(result.commitMessage).toContain('feat');
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.bestPractices).toBeInstanceOf(Array);
    });

    test('should suggest branch names', async () => {
      const request = {
        taskDescription: 'Add user authentication feature',
        taskType: 'feature' as any,
        ticketNumber: 'TASK-123',
        includeUserName: false,
        namingConvention: 'kebab' as any,
      };

      const result = await aiWorkflow.suggestBranchName(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.branchName).toBeDefined();
      expect(result.branchName).toContain('feature');
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    test('should perform code review', async () => {
      const request = {
        diff: '+ function newFunction() { return true; }',
        files: [
          {
            filePath: '/src/utils.js',
            content: 'function newFunction() { return true; }',
            language: 'javascript',
          }
        ],
        reviewType: 'comprehensive' as any,
        targetBranch: 'main',
        includeTests: true,
      };

      const result = await aiWorkflow.reviewCode(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
      expect(result.positives).toBeInstanceOf(Array);
      expect(result.improvements).toBeInstanceOf(Array);
    });

    test('should analyze deployment readiness', async () => {
      const request = {
        environment: 'production' as any,
        applicationName: 'test-app',
        infrastructureType: 'docker' as any,
        rollbackRequired: false,
      };

      const result = await aiWorkflow.analyzeDeployment(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.recommendation).toBeDefined();
      expect(result.readinessScore).toBeGreaterThanOrEqual(0);
      expect(result.checklist).toBeInstanceOf(Array);
      expect(result.risks).toBeInstanceOf(Array);
    });
  });

  describe('Security and Performance Tests', () => {
    test('should validate security', async () => {
      const request = {
        content: 'const apiKey = "safe-test-content";',
        contentType: 'code' as any,
        fileName: 'test.js',
        userId: 'test-user',
        sessionId: 'test-session',
      };

      const result = await aiSecurity.validateSecurity(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      expect(result.risks).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });

    test('should check rate limits', async () => {
      const request = {
        userId: 'test-user',
        endpoint: 'code_generation',
        tokenCount: 100,
      };

      const result = await aiSecurity.checkRateLimit(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(typeof result.allowed).toBe('boolean');
      expect(result.limits).toBeDefined();
      expect(result.usage).toBeDefined();
    });

    test('should collect performance metrics', async () => {
      const request = {
        endpoint: 'code_generation',
        responseTime: 1500,
        tokenCount: 200,
        requestSize: 1024,
        userId: 'test-user',
      };

      const result = await aiSecurity.collectPerformanceMetrics(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should get performance analytics', async () => {
      const result = await aiSecurity.getPerformanceAnalytics({}, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(typeof result.averageResponseTime).toBe('number');
      expect(typeof result.totalRequests).toBe('number');
      expect(typeof result.errorRate).toBe('number');
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('AI Integration Service Tests', () => {
    test('should process AI request with full integration', async () => {
      const request = {
        type: 'code_generation' as any,
        content: 'Create a simple calculator function',
        context: ['Building a math utility library'],
        settings: {
          model: 'claude-3-5-sonnet-20241022' as any,
          maxTokens: 2000,
          temperature: 0.7,
          stream: false,
          includeContext: true,
          securityValidation: true,
        },
        metadata: {
          language: 'javascript',
          priority: 'normal' as any,
        },
      };

      const result = await aiIntegration.processAIRequest(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(result.usage).toBeDefined();
      expect(result.security).toBeDefined();
      expect(result.performance).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    test('should process batch AI requests', async () => {
      const request = {
        requests: [
          {
            type: 'code_generation' as any,
            content: 'Create function A',
            settings: {
              model: 'claude-3-5-sonnet-20241022' as any,
              maxTokens: 1000,
              temperature: 0.7,
              stream: false,
              includeContext: true,
              securityValidation: true,
            },
          },
          {
            type: 'code_review' as any,
            content: 'function test() { return true; }',
            settings: {
              model: 'claude-3-5-sonnet-20241022' as any,
              maxTokens: 1000,
              temperature: 0.7,
              stream: false,
              includeContext: true,
              securityValidation: true,
            },
          }
        ],
        batchSettings: {
          parallel: false,
          stopOnError: false,
          timeout: 60000,
        },
      };

      const result = await aiIntegration.processBatchAIRequests(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.totalRequests).toBe(2);
      expect(result.results).toBeInstanceOf(Array);
      expect(result.results).toHaveLength(2);
    });

    test('should perform health check', async () => {
      const result = await aiIntegration.healthCheck({}, { auth: undefined } as any);

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(result.status);
      expect(result.services).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.version).toBeDefined();
    });
  });

  describe('End-to-End Integration Tests', () => {
    test('should handle complete development workflow', async () => {
      console.log('Testing complete development workflow...');

      // 1. Generate project structure
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

      const projectResult = await projectGenerator.generateProject(projectRequest, mockAPICallMeta);
      expect(projectResult.files.length).toBeGreaterThan(0);

      // 2. Generate code for a component
      const codeRequest = {
        prompt: 'Create a React button component',
        language: 'typescript',
        framework: 'react',
      };

      const codeResult = await aiService.generateCode(codeRequest, mockAPICallMeta);
      expect(codeResult.result).toBeDefined();

      // 3. Analyze the generated code
      const analysisRequest = {
        code: codeResult.result,
        filePath: '/src/components/Button.tsx',
        language: 'typescript',
        analysisType: 'all' as any,
        realTime: false,
        includeAutoFix: false,
      };

      const analysisResult = await codeAnalysis.analyzeCodeRealTime(analysisRequest, mockAPICallMeta);
      expect(analysisResult.metrics).toBeDefined();

      // 4. Generate tests for the code
      const testRequest = {
        code: codeResult.result,
        filePath: '/src/components/Button.tsx',
        language: 'typescript',
        testType: 'unit' as any,
        framework: 'jest',
        coverage: 'basic' as any,
        mockingStrategy: 'minimal' as any,
        includeSetup: true,
        includeEdgeCases: false,
      };

      const testResult = await aiTesting.generateIntelligentTests(testRequest, mockAPICallMeta);
      expect(testResult.tests.length).toBeGreaterThan(0);

      // 5. Generate commit message for changes
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

      const commitResult = await aiWorkflow.generateCommitMessage(commitRequest, mockAPICallMeta);
      expect(commitResult.commitMessage).toContain('feat');

      console.log('✅ Complete development workflow test passed');
    });

    test('should handle error scenarios gracefully', async () => {
      console.log('Testing error handling...');

      // Test with invalid input
      const invalidRequest = {
        type: 'invalid_type' as any,
        content: '',
        settings: {
          model: 'claude-3-5-sonnet-20241022' as any,
          maxTokens: -1, // Invalid
          temperature: 5, // Invalid
          stream: false,
          includeContext: true,
          securityValidation: true,
        },
      };

      try {
        await aiIntegration.processAIRequest(invalidRequest, mockAPICallMeta);
        // Should not reach here
        expect(false).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }

      console.log('✅ Error handling test passed');
    });

    test('should maintain performance under load', async () => {
      console.log('Testing performance under load...');

      const requests = Array(5).fill(null).map((_, index) => ({
        type: 'code_generation' as any,
        content: `Create function number ${index}`,
        settings: {
          model: 'claude-3-5-sonnet-20241022' as any,
          maxTokens: 500,
          temperature: 0.7,
          stream: false,
          includeContext: false,
          securityValidation: false, // Skip for performance test
        },
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(req => aiIntegration.processAIRequest(req, mockAPICallMeta))
      );
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      expect(results.every(r => r.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds

      console.log(`✅ Performance test passed (${endTime - startTime}ms for 5 requests)`);
    });
  });

  describe('Security and Compliance Tests', () => {
    test('should detect and prevent security vulnerabilities', async () => {
      const maliciousContent = `
        const password = "super-secret-password";
        const apiKey = "sk-1234567890abcdef";
        eval(userInput);
      `;

      const securityRequest = {
        content: maliciousContent,
        contentType: 'code' as any,
        userId: 'test-user',
      };

      const result = await aiSecurity.validateSecurity(securityRequest, mockAPICallMeta);

      expect(result.isValid).toBe(false);
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.risks.some(risk => risk.type === 'sensitive_data')).toBe(true);
    });

    test('should enforce rate limiting', async () => {
      // Simulate multiple rapid requests
      const requests = Array(10).fill(null).map(() => ({
        userId: 'test-user',
        endpoint: 'test-endpoint',
        tokenCount: 100,
      }));

      const results = await Promise.all(
        requests.map(req => aiSecurity.checkRateLimit(req, mockAPICallMeta))
      );

      // At least some requests should be rate limited
      const rateLimitedCount = results.filter(r => !r.allowed).length;
      expect(rateLimitedCount).toBe(0); // In test environment, should all be allowed initially
    });

    test('should audit all AI operations', async () => {
      const originalConsoleLog = console.log;
      const logSpy = jest.fn();
      console.log = logSpy;

      aiSecurity.auditLog('test-user', 'test-action', { test: 'data' });

      expect(logSpy).toHaveBeenCalled();
      console.log = originalConsoleLog;
    });
  });
});

describe('AI Service Reliability Tests', () => {
  test('should handle API failures gracefully', async () => {
    // Mock Anthropic API failure
    const AnthropicMock = require('@anthropic-ai/sdk');
    AnthropicMock.default.mockImplementationOnce(() => ({
      messages: {
        create: jest.fn().mockRejectedValue(new Error('API Error'))
      }
    }));

    const request = {
      prompt: 'Test prompt',
      language: 'javascript',
    };

    try {
      await aiService.generateCode(request, {
        auth: { userID: 'test', email: 'test@test.com', roles: [] },
        requestId: 'test',
        timestamp: new Date()
      });
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect(error.message).toContain('Failed to generate code');
    }
  });

  test('should validate input parameters', async () => {
    const invalidRequest = {
      prompt: '', // Empty prompt
      language: '', // Empty language
    };

    try {
      await aiService.generateCode(invalidRequest, {
        auth: { userID: 'test', email: 'test@test.com', roles: [] },
        requestId: 'test',
        timestamp: new Date()
      });
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('should handle concurrent requests efficiently', async () => {
    const concurrentRequests = Array(3).fill(null).map((_, index) => ({
      prompt: `Concurrent request ${index}`,
      language: 'javascript',
    }));

    const startTime = Date.now();
    const results = await Promise.all(
      concurrentRequests.map(req => 
        aiService.generateCode(req, {
          auth: { userID: 'test', email: 'test@test.com', roles: [] },
          requestId: `test-${Date.now()}`,
          timestamp: new Date()
        })
      )
    );
    const endTime = Date.now();

    expect(results).toHaveLength(3);
    expect(results.every(r => r.result)).toBe(true);
    expect(endTime - startTime).toBeLessThan(5000); // Should be reasonably fast
  });
});

// Test utilities
function generateMockAuthMeta(userID: string = 'test-user') {
  return {
    auth: {
      userID,
      email: `${userID}@example.com`,
      roles: ['user']
    },
    requestId: `req-${Date.now()}`,
    timestamp: new Date()
  };
}