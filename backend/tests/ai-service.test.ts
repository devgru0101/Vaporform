/**
 * AI Service Tests
 * Tests for AI chat, code generation, and code review endpoints
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { chat, generate, review } from '../ai/ai';
import { testUtils } from './setup';

// Mock Anthropic SDK
const mockAnthropic = {
  messages: {
    create: jest.fn()
  }
};

jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockAnthropic)
  };
});

describe('AI Service', () => {
  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock response
    mockAnthropic.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: 'Mocked AI response' }]
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Restore original API key
    if (originalApiKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  describe('AI Chat Endpoint', () => {
    const validChatRequest = {
      message: 'How can I optimize my React components?',
      context: 'Working on a large React application',
      projectId: 'test-project-123'
    };

    test('should handle chat request successfully with API key', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      
      const response = await chat(validChatRequest);

      expect(response).toHaveProperty('result');
      expect(response).toHaveProperty('suggestions');
      expect(response).toHaveProperty('confidence');
      expect(response).toHaveProperty('metadata');
      
      expect(response.result).toBe('Mocked AI response');
      expect(response.confidence).toBe(0.9);
      expect(response.metadata.mode).toBe('real');
      expect(response.metadata.model).toBe('claude-3-5-sonnet-20241022');
    });

    test('should handle chat request in mock mode without API key', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      
      const response = await chat(validChatRequest);

      expect(response.result).toContain('Mock AI Response');
      expect(response.result).toContain(validChatRequest.message);
      expect(response.confidence).toBe(0.1);
      expect(response.metadata.mode).toBe('mock');
      expect(response.metadata.model).toBe('mock');
    });

    test('should call Anthropic API with correct parameters', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      
      await chat(validChatRequest);

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: expect.stringContaining('Vaporform AI'),
        messages: [{
          role: 'user',
          content: expect.stringContaining(validChatRequest.message)
        }]
      });
    });

    test('should include context in the message when provided', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      
      await chat(validChatRequest);

      const lastCall = mockAnthropic.messages.create.mock.calls[0][0];
      expect(lastCall.messages[0].content).toContain('Context:');
      expect(lastCall.messages[0].content).toContain(validChatRequest.context);
    });

    test('should validate required message field', async () => {
      const invalidRequest = { message: '', context: 'test' };
      
      await expect(chat(invalidRequest)).rejects.toThrow('Message is required and cannot be empty');
    });

    test('should validate message is not just whitespace', async () => {
      const invalidRequest = { message: '   ', context: 'test' };
      
      await expect(chat(invalidRequest)).rejects.toThrow('Message is required and cannot be empty');
    });

    test('should handle missing optional fields', async () => {
      const minimalRequest = { message: 'Simple test message' };
      
      const response = await chat(minimalRequest);
      expect(response.result).toBeDefined();
    });

    test('should include suggestions in response', async () => {
      const response = await chat(validChatRequest);
      
      expect(response.suggestions).toHaveLength(3);
      expect(response.suggestions).toContain('Ask follow-up questions for clarification');
    });

    test('should handle API errors gracefully', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      mockAnthropic.messages.create.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(chat(validChatRequest)).rejects.toThrow('Failed to process chat request');
    });

    test('should include metadata with timestamp and projectId', async () => {
      const response = await chat(validChatRequest);
      
      expect(response.metadata).toHaveProperty('timestamp');
      expect(response.metadata).toHaveProperty('projectId', validChatRequest.projectId);
      expect(new Date(response.metadata.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Code Generation Endpoint', () => {
    const validGenerationRequest = {
      prompt: 'Create a user authentication function',
      language: 'typescript',
      framework: 'express',
      context: 'Building a REST API'
    };

    test('should generate code successfully with API key', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      
      const response = await generate(validGenerationRequest);

      expect(response).toHaveProperty('result');
      expect(response).toHaveProperty('suggestions');
      expect(response).toHaveProperty('confidence');
      expect(response).toHaveProperty('metadata');
      
      expect(response.result).toBe('Mocked AI response');
      expect(response.confidence).toBe(0.85);
      expect(response.metadata.mode).toBe('real');
    });

    test('should generate mock code without API key', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      
      const response = await generate(validGenerationRequest);

      expect(response.result).toContain('Mock Code Generation');
      expect(response.result).toContain(validGenerationRequest.language);
      expect(response.result).toContain(validGenerationRequest.framework);
      expect(response.confidence).toBe(0.1);
      expect(response.metadata.mode).toBe('mock');
    });

    test('should validate required fields', async () => {
      const invalidRequests = [
        { prompt: '', language: 'typescript' },
        { prompt: '   ', language: 'typescript' },
        { prompt: 'test', language: '' },
        { prompt: 'test', language: '   ' }
      ];

      for (const request of invalidRequests) {
        await expect(generate(request)).rejects.toThrow();
      }
    });

    test('should call Anthropic API with framework-specific prompt', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      
      await generate(validGenerationRequest);

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: expect.stringContaining(validGenerationRequest.framework),
        messages: [{
          role: 'user',
          content: expect.stringContaining(validGenerationRequest.framework)
        }]
      });
    });

    test('should generate language-appropriate mock code', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      
      const languages = [
        { language: 'typescript', expectedContent: 'function mockGeneratedFunction(): string' },
        { language: 'javascript', expectedContent: 'function mockGeneratedFunction()' },
        { language: 'python', expectedContent: 'def mock_generated_function():' },
        { language: 'java', expectedContent: 'public class MockGenerated' }
      ];

      for (const { language, expectedContent } of languages) {
        const response = await generate({ ...validGenerationRequest, language });
        expect(response.result).toContain(expectedContent);
      }
    });

    test('should handle framework being optional', async () => {
      const requestWithoutFramework = {
        prompt: 'Create a simple function',
        language: 'typescript'
      };
      
      const response = await generate(requestWithoutFramework);
      expect(response.result).toBeDefined();
    });

    test('should include metadata with language and framework', async () => {
      const response = await generate(validGenerationRequest);
      
      expect(response.metadata).toHaveProperty('language', validGenerationRequest.language);
      expect(response.metadata).toHaveProperty('framework', validGenerationRequest.framework);
    });

    test('should provide relevant suggestions', async () => {
      const response = await generate(validGenerationRequest);
      
      expect(response.suggestions).toContain('Consider adding error handling');
      expect(response.suggestions).toContain('Add unit tests for this code');
    });
  });

  describe('Code Review Endpoint', () => {
    const validReviewRequest = {
      code: 'function add(a, b) { return a + b; }',
      language: 'javascript',
      focus: ['security', 'performance'] as ('security' | 'performance' | 'style' | 'bugs' | 'all')[]
    };

    test('should review code successfully with API key', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      
      const response = await review(validReviewRequest);

      expect(response).toHaveProperty('result');
      expect(response).toHaveProperty('suggestions');
      expect(response).toHaveProperty('confidence');
      expect(response).toHaveProperty('metadata');
      
      expect(response.result).toBe('Mocked AI response');
      expect(response.confidence).toBe(0.9);
      expect(response.metadata.mode).toBe('real');
    });

    test('should provide mock review without API key', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      
      const response = await review(validReviewRequest);

      expect(response.result).toContain('Mock Code Review');
      expect(response.result).toContain(validReviewRequest.language);
      expect(response.result).toContain('security, performance');
      expect(response.confidence).toBe(0.1);
      expect(response.metadata.mode).toBe('mock');
    });

    test('should validate required fields', async () => {
      const invalidRequests = [
        { code: '', language: 'javascript' },
        { code: '   ', language: 'javascript' },
        { code: 'test code', language: '' },
        { code: 'test code', language: '   ' }
      ];

      for (const request of invalidRequests) {
        await expect(review(request)).rejects.toThrow();
      }
    });

    test('should validate focus areas', async () => {
      const invalidFocusRequest = {
        ...validReviewRequest,
        focus: ['invalid-focus'] as any
      };
      
      await expect(review(invalidFocusRequest)).rejects.toThrow('Invalid focus area');
    });

    test('should accept valid focus areas', async () => {
      const validFocusAreas = [
        ['security'],
        ['performance'],
        ['style'],
        ['bugs'],
        ['all'],
        ['security', 'performance'],
        ['style', 'bugs', 'security']
      ];

      for (const focus of validFocusAreas) {
        const request = { ...validReviewRequest, focus: focus as any };
        const response = await review(request);
        expect(response.result).toBeDefined();
      }
    });

    test('should default to all focus areas when not specified', async () => {
      const requestWithoutFocus = {
        code: 'function test() {}',
        language: 'javascript'
      };
      
      const response = await review(requestWithoutFocus);
      expect(response.metadata.focusAreas).toBe('all');
    });

    test('should call Anthropic API with focus areas in prompt', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      
      await review(validReviewRequest);

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        system: expect.stringContaining('security, performance'),
        messages: [{
          role: 'user',
          content: expect.stringContaining(validReviewRequest.code)
        }]
      });
    });

    test('should include code length in mock review', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      
      const response = await review(validReviewRequest);
      
      expect(response.result).toContain(`${validReviewRequest.code.length} characters`);
    });

    test('should provide review-specific suggestions', async () => {
      const response = await review(validReviewRequest);
      
      expect(response.suggestions).toContain('Consider implementing suggested changes');
      expect(response.suggestions).toContain('Run additional tests after modifications');
    });

    test('should include metadata with focus areas', async () => {
      const response = await review(validReviewRequest);
      
      expect(response.metadata).toHaveProperty('language', validReviewRequest.language);
      expect(response.metadata).toHaveProperty('focusAreas', 'security, performance');
    });
  });

  describe('Error Handling', () => {
    test('should handle Anthropic API network errors', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      mockAnthropic.messages.create.mockRejectedValueOnce(new Error('Network error'));

      await expect(chat({ message: 'test' })).rejects.toThrow('Failed to process chat request');
      await expect(generate({ prompt: 'test', language: 'javascript' })).rejects.toThrow('Failed to generate code');
      await expect(review({ code: 'test', language: 'javascript' })).rejects.toThrow('Failed to review code');
    });

    test('should handle malformed API responses', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      mockAnthropic.messages.create.mockResolvedValueOnce({
        content: [{ type: 'image', source: {} }] // Wrong content type
      });

      const response = await chat({ message: 'test' });
      expect(response.result).toBe(''); // Should handle gracefully
    });

    test('should handle empty API responses', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      mockAnthropic.messages.create.mockResolvedValueOnce({
        content: []
      });

      const response = await chat({ message: 'test' });
      expect(response.result).toBe('');
    });
  });

  describe('Performance and Resource Management', () => {
    test('should use appropriate token limits for different endpoints', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';

      await chat({ message: 'test' });
      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: 4000 })
      );

      await generate({ prompt: 'test', language: 'js' });
      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: 4000 })
      );

      await review({ code: 'test', language: 'js' });
      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: 3000 })
      );
    });

    test('should use consistent model across endpoints', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      const expectedModel = 'claude-3-5-sonnet-20241022';

      await chat({ message: 'test' });
      await generate({ prompt: 'test', language: 'js' });
      await review({ code: 'test', language: 'js' });

      const calls = mockAnthropic.messages.create.mock.calls;
      calls.forEach(call => {
        expect(call[0]).toHaveProperty('model', expectedModel);
      });
    });
  });

  describe('Mock Mode Behavior', () => {
    beforeEach(() => {
      delete process.env.ANTHROPIC_API_KEY;
    });

    test('should provide informative mock responses', async () => {
      const chatResponse = await chat({ message: 'How to debug my code?' });
      const generateResponse = await generate({ prompt: 'Create a function', language: 'python' });
      const reviewResponse = await review({ code: 'def test(): pass', language: 'python' });

      expect(chatResponse.result).toContain('mock response');
      expect(generateResponse.result).toContain('Mock Code Generation');
      expect(reviewResponse.result).toContain('Mock Code Review');
    });

    test('should have consistent low confidence in mock mode', async () => {
      const responses = await Promise.all([
        chat({ message: 'test' }),
        generate({ prompt: 'test', language: 'js' }),
        review({ code: 'test', language: 'js' })
      ]);

      responses.forEach(response => {
        expect(response.confidence).toBe(0.1);
      });
    });

    test('should indicate mock mode in metadata', async () => {
      const responses = await Promise.all([
        chat({ message: 'test' }),
        generate({ prompt: 'test', language: 'js' }),
        review({ code: 'test', language: 'js' })
      ]);

      responses.forEach(response => {
        expect(response.metadata.mode).toBe('mock');
        expect(response.metadata.model).toBe('mock');
      });
    });
  });
});