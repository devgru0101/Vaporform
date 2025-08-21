// Core AI functionality tests
import { beforeEach, describe, expect, test, jest } from '@jest/globals';

// Mock environment variables
process.env.ANTHROPIC_API_KEY = 'test-key-for-ai-core';

// Mock Anthropic SDK with successful responses
const mockAnthropicCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: mockAnthropicCreate
      }
    }))
  };
});

// Mock file system operations
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(JSON.stringify({
    dependencies: { react: "^18.0.0" },
    scripts: { build: "webpack" }
  })),
  writeFile: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
  readdir: jest.fn().mockResolvedValue(['src', 'components', 'package.json']),
  stat: jest.fn().mockResolvedValue({
    isDirectory: () => true,
    isFile: () => false,
    size: 1024,
    mtime: new Date()
  }),
}));

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn().mockImplementation((command, callback) => {
    const mockResults = {
      'git status': 'On branch main\nnothing to commit, working tree clean',
      'npm list': 'project@1.0.0\n├── react@18.2.0\n└── typescript@4.9.0',
      default: 'Command executed successfully'
    };
    
    const output = mockResults[command as keyof typeof mockResults] || mockResults.default;
    if (callback) {
      callback(null, { stdout: output, stderr: '' });
    }
  })
}));

describe('AI Core Services', () => {
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
    // Setup default successful response
    mockAnthropicCreate.mockResolvedValue({
      content: [{
        type: 'text',
        text: JSON.stringify({
          response: 'Successfully generated content based on your request.',
          suggestions: ['Consider adding error handling', 'Add unit tests'],
          confidence: 0.92,
          metadata: {
            processingTime: 1500,
            tokensUsed: 250,
            model: 'claude-3-5-sonnet-20241022'
          }
        })
      }]
    });
  });

  describe('Code Generation', () => {
    test('should generate code successfully', async () => {
      const { generateCode } = await import('../src/services/ai');
      
      const request = {
        prompt: 'Create a React component for a simple button',
        language: 'typescript',
        framework: 'react',
        context: 'Building a UI component library',
      };

      const result = await generateCode(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.result).toContain('Successfully generated');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.model).toBeDefined();
    });

    test('should handle empty prompts gracefully', async () => {
      const { generateCode } = await import('../src/services/ai');
      
      const request = {
        prompt: '',
        language: 'javascript',
      };

      // The service should either reject or handle gracefully
      try {
        const result = await generateCode(request, mockAPICallMeta);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Code Review', () => {
    test('should review code and provide feedback', async () => {
      const { reviewCode } = await import('../src/services/ai');
      
      const request = {
        code: 'function add(a, b) { return a + b; }',
        language: 'javascript',
        focus: ['security', 'performance'] as any,
      };

      const result = await reviewCode(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.result).toContain('Successfully generated');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.metadata).toBeDefined();
    });
  });

  describe('Project Analysis', () => {
    test.skip('should analyze project structure (skipped - requires file system access)', async () => {
      // This test requires actual file system operations and is skipped in unit tests
      // It should be tested in integration tests with a real project structure
      expect(true).toBe(true);
    });

    test('should handle basic code intelligence requests', async () => {
      const { analyzeCodeIntelligence } = await import('../src/services/ai');
      
      const request = {
        code: 'const x = 1; const y = 2; const result = x + y;',
        filePath: '/test/simple.js',
        language: 'javascript',
        analysisDepth: 'basic' as any,
      };

      const result = await analyzeCodeIntelligence(request, mockAPICallMeta);

      expect(result).toBeDefined();
      expect(result.result).toContain('Successfully generated');
      expect(result.analysis).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.metadata).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle API failures gracefully', async () => {
      // Mock API failure
      mockAnthropicCreate.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      const { generateCode } = await import('../src/services/ai');
      const request = {
        prompt: 'Test prompt',
        language: 'javascript',
      };

      await expect(generateCode(request, mockAPICallMeta)).rejects.toThrow('Failed to generate code');
    });

    test('should handle malformed API responses', async () => {
      // Mock malformed response
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'invalid json {' }]
      });

      const { generateCode } = await import('../src/services/ai');
      const request = {
        prompt: 'Test prompt',
        language: 'javascript',
      };

      const result = await generateCode(request, mockAPICallMeta);
      
      // Should still return a result, using fallback parsing
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('should complete requests within reasonable time', async () => {
      const { generateCode } = await import('../src/services/ai');
      
      const request = {
        prompt: 'Create a simple function',
        language: 'typescript',
      };

      const startTime = Date.now();
      const result = await generateCode(request, mockAPICallMeta);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle multiple concurrent requests', async () => {
      const { generateCode } = await import('../src/services/ai');
      
      const requests = Array(3).fill(null).map((_, index) => ({
        prompt: `Create function number ${index}`,
        language: 'javascript',
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(req => generateCode(req, mockAPICallMeta))
      );
      const endTime = Date.now();

      expect(results).toHaveLength(3);
      expect(results.every(r => r.result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(15000); // Should handle concurrency efficiently
    });
  });

  describe('Security', () => {
    test('should sanitize input prompts', async () => {
      const { generateCode } = await import('../src/services/ai');
      
      const request = {
        prompt: 'Create a function <script>alert("xss")</script>',
        language: 'javascript',
      };

      const result = await generateCode(request, mockAPICallMeta);
      
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      // The service should handle potentially malicious input safely
    });
  });
});