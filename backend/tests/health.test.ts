/**
 * Health Service Tests
 * Tests for health monitoring and status endpoints
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { health, status } from '../health/health';

describe('Health Service', () => {
  beforeEach(() => {
    // Reset any environment variables or mocks
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Clean up after each test
    // jest.clearAllMocks(); // Commented out for vitest
  });

  describe('GET /health', () => {
    test('should return healthy status with correct format', async () => {
      const response = await health();

      expect(response).toHaveProperty('status', 'healthy');
      expect(response).toHaveProperty('timestamp');
      expect(response).toHaveProperty('environment');
      expect(response).toHaveProperty('version');
      
      // Verify timestamp is a valid ISO string
      expect(() => new Date(response.timestamp).toISOString()).not.toThrow();
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Verify environment
      expect(response.environment).toBe('test');
      
      // Verify version
      expect(response.version).toBe('1.0.0');
    });

    test('should return consistent response structure', async () => {
      const response1 = await health();
      const response2 = await health();

      // Structure should be consistent
      expect(Object.keys(response1)).toEqual(Object.keys(response2));
      expect(response1.status).toBe(response2.status);
      expect(response1.environment).toBe(response2.environment);
      expect(response1.version).toBe(response2.version);
    });

    test('should reflect current environment', async () => {
      // Test development environment
      process.env.NODE_ENV = 'development';
      const devResponse = await health();
      expect(devResponse.environment).toBe('development');

      // Test production environment
      process.env.NODE_ENV = 'production';
      const prodResponse = await health();
      expect(prodResponse.environment).toBe('production');
    });

    test('should handle missing NODE_ENV gracefully', async () => {
      delete process.env.NODE_ENV;
      const response = await health();
      expect(response.environment).toBe('development'); // Default fallback
    });

    test('should have timestamp within reasonable time window', async () => {
      const beforeCall = new Date();
      const response = await health();
      const afterCall = new Date();
      
      const responseTime = new Date(response.timestamp);
      
      expect(responseTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime() - 1000);
      expect(responseTime.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
    });
  });

  describe('GET /api/status', () => {
    test('should return API status with correct format', async () => {
      const response = await status();

      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('version');
      
      expect(response.message).toBe('Vaporform Backend API is running on Encore.ts');
      expect(response.version).toBe('1.0.0');
    });

    test('should have consistent message format', async () => {
      const response = await status();
      
      expect(typeof response.message).toBe('string');
      expect(response.message).toContain('Vaporform');
      expect(response.message).toContain('Backend API');
      expect(response.message).toContain('Encore.ts');
    });

    test('should return expected version', async () => {
      const response = await status();
      
      expect(response.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(response.version).toBe('1.0.0');
    });

    test('should be synchronous and fast', async () => {
      const start = Date.now();
      await status();
      const duration = Date.now() - start;
      
      // Should complete very quickly (under 100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Health Service Integration', () => {
    test('both endpoints should be available simultaneously', async () => {
      const [healthResponse, statusResponse] = await Promise.all([
        health(),
        status()
      ]);

      expect(healthResponse.status).toBe('healthy');
      expect(statusResponse.message).toContain('running');
    });

    test('should maintain consistent version across endpoints', async () => {
      const healthResponse = await health();
      const statusResponse = await status();

      expect(healthResponse.version).toBe(statusResponse.version);
    });

    test('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() => Promise.all([
        health(),
        status()
      ]));

      const results = await Promise.all(requests);

      results.forEach(([healthResponse, statusResponse]) => {
        expect(healthResponse.status).toBe('healthy');
        expect(statusResponse.message).toContain('running');
      });
    });
  });

  describe('Error Handling', () => {
    test('health endpoint should be resilient to environment changes', async () => {
      // Test with various NODE_ENV values
      const environments = ['test', 'development', 'production', 'staging'];
      
      for (const env of environments) {
        process.env.NODE_ENV = env;
        const response = await health();
        expect(response.environment).toBe(env);
        expect(response.status).toBe('healthy');
      }
    });

    test('should handle undefined environment gracefully', async () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      
      try {
        const response = await health();
        expect(response.environment).toBe('development');
        expect(response.status).toBe('healthy');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('Performance', () => {
    test('health endpoint should respond quickly', async () => {
      const times: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await health();
        times.push(Date.now() - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(50); // Should average under 50ms
    });

    test('status endpoint should respond quickly', async () => {
      const times: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await status();
        times.push(Date.now() - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(50); // Should average under 50ms
    });
  });
});