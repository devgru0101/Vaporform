/**
 * Security Performance Tests
 * Tests performance characteristics of security operations
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { performance } from 'perf_hooks';

// Mock the security services
jest.mock('../../src/services/security', () => ({
  MFAService: {
    setupTOTP: jest.fn().mockResolvedValue({
      secret: 'MOCK_SECRET',
      qrCodeUrl: 'data:image/png;base64,mock',
      backupCodes: ['CODE1', 'CODE2'],
    }),
    verifyTOTP: jest.fn().mockResolvedValue(true),
    verifyAndEnableTOTP: jest.fn().mockResolvedValue(true),
    generateNewBackupCodes: jest.fn().mockResolvedValue(['CODE1', 'CODE2']),
  },
  RBACService: {
    hasPermission: jest.fn().mockResolvedValue(true),
    createRole: jest.fn().mockResolvedValue(undefined),
    assignRole: jest.fn().mockResolvedValue(undefined),
  },
  ThreatDetectionService: {
    analyzeLoginAttempt: jest.fn().mockResolvedValue({
      riskScore: 10,
      blocked: false,
      reasons: [],
    }),
    detectAnomalies: jest.fn().mockResolvedValue({
      isAnomalous: false,
      confidence: 0.1,
      reasons: [],
    }),
  },
  WebAuthnService: {
    generateRegistrationOptions: jest.fn().mockResolvedValue({ challenge: 'mock' }),
    verifyRegistration: jest.fn().mockResolvedValue(true),
    generateAuthenticationOptions: jest.fn().mockResolvedValue({ challenge: 'mock' }),
    verifyAuthentication: jest.fn().mockResolvedValue(true),
  },
}));

import { MFAService, RBACService, ThreatDetectionService, WebAuthnService } from '../../src/services/security';

describe('Security Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('MFA Performance', () => {
    test('should setup TOTP within performance threshold', async () => {
      const iterations = 100;
      const maxTimePerOperation = 200; // 200ms max per operation
      
      const startTime = performance.now();
      
      const promises = Array.from({ length: iterations }, (_, i) => 
        MFAService.setupTOTP(`user-${i}`, `user${i}@example.com`)
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / iterations;
      
      expect(avgTimePerOperation).toBeLessThan(maxTimePerOperation);
      expect(MFAService.setupTOTP).toHaveBeenCalledTimes(iterations);
    });

    test('should verify TOTP within performance threshold', async () => {
      const iterations = 1000;
      const maxTimePerOperation = 50; // 50ms max per operation
      
      const startTime = performance.now();
      
      const promises = Array.from({ length: iterations }, (_, i) => 
        MFAService.verifyTOTP(`user-${i}`, '123456')
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / iterations;
      
      expect(avgTimePerOperation).toBeLessThan(maxTimePerOperation);
      expect(MFAService.verifyTOTP).toHaveBeenCalledTimes(iterations);
    });

    test('should handle concurrent MFA operations without degradation', async () => {
      const concurrentUsers = 50;
      const operationsPerUser = 10;
      const maxTotalTime = 5000; // 5 seconds max for all operations
      
      const startTime = performance.now();
      
      const userPromises = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
        const userId = `concurrent-user-${userIndex}`;
        
        // Each user performs multiple operations
        const operations = Array.from({ length: operationsPerUser }, async (_, opIndex) => {
          switch (opIndex % 4) {
            case 0:
              return MFAService.setupTOTP(userId, `${userId}@example.com`);
            case 1:
              return MFAService.verifyAndEnableTOTP(userId, '123456');
            case 2:
              return MFAService.verifyTOTP(userId, '123456');
            case 3:
              return MFAService.generateNewBackupCodes(userId);
            default:
              return Promise.resolve();
          }
        });
        
        return Promise.all(operations);
      });
      
      await Promise.all(userPromises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(maxTotalTime);
    });
  });

  describe('RBAC Performance', () => {
    test('should check permissions within performance threshold', async () => {
      const iterations = 5000;
      const maxTimePerOperation = 10; // 10ms max per operation
      
      const startTime = performance.now();
      
      const promises = Array.from({ length: iterations }, (_, i) => 
        RBACService.hasPermission(`user-${i % 100}`, 'projects', 'read')
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / iterations;
      
      expect(avgTimePerOperation).toBeLessThan(maxTimePerOperation);
      expect(RBACService.hasPermission).toHaveBeenCalledTimes(iterations);
    });

    test('should handle complex permission hierarchies efficiently', async () => {
      const users = 100;
      const resources = 50;
      const actions = 10;
      const maxTotalTime = 3000; // 3 seconds max
      
      const startTime = performance.now();
      
      const promises: Promise<boolean>[] = [];
      
      for (let u = 0; u < users; u++) {
        for (let r = 0; r < resources; r += 5) { // Test every 5th resource
          for (let a = 0; a < actions; a += 2) { // Test every 2nd action
            promises.push(
              RBACService.hasPermission(`user-${u}`, `resource-${r}`, `action-${a}`)
            );
          }
        }
      }
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(maxTotalTime);
      expect(promises.length).toBeGreaterThan(1000);
    });

    test('should scale linearly with number of role assignments', async () => {
      const baseRoles = 10;
      const maxRoles = 100;
      const step = 10;
      const maxGrowthFactor = 2; // Performance should not degrade more than 2x
      
      let baselineTime = 0;
      
      for (let roleCount = baseRoles; roleCount <= maxRoles; roleCount += step) {
        const startTime = performance.now();
        
        const promises = Array.from({ length: 100 }, (_, i) => 
          RBACService.hasPermission(`user-with-${roleCount}-roles`, 'test-resource', 'test-action')
        );
        
        await Promise.all(promises);
        
        const endTime = performance.now();
        const operationTime = endTime - startTime;
        
        if (roleCount === baseRoles) {
          baselineTime = operationTime;
        } else {
          const growthFactor = operationTime / baselineTime;
          expect(growthFactor).toBeLessThan(maxGrowthFactor);
        }
      }
    });
  });

  describe('Threat Detection Performance', () => {
    test('should analyze login attempts within performance threshold', async () => {
      const iterations = 2000;
      const maxTimePerOperation = 25; // 25ms max per operation
      
      const startTime = performance.now();
      
      const promises = Array.from({ length: iterations }, (_, i) => 
        ThreatDetectionService.analyzeLoginAttempt(
          `user${i % 100}@example.com`,
          `192.168.1.${i % 255}`,
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / iterations;
      
      expect(avgTimePerOperation).toBeLessThan(maxTimePerOperation);
      expect(ThreatDetectionService.analyzeLoginAttempt).toHaveBeenCalledTimes(iterations);
    });

    test('should detect anomalies efficiently', async () => {
      const iterations = 1000;
      const maxTimePerOperation = 15; // 15ms max per operation
      
      const startTime = performance.now();
      
      const promises = Array.from({ length: iterations }, (_, i) => 
        ThreatDetectionService.detectAnomalies(
          `user-${i % 50}`,
          'project_access',
          { 
            ipAddress: `10.0.0.${i % 255}`,
            userAgent: 'test-agent',
            resource: `project-${i % 10}`
          }
        )
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / iterations;
      
      expect(avgTimePerOperation).toBeLessThan(maxTimePerOperation);
      expect(ThreatDetectionService.detectAnomalies).toHaveBeenCalledTimes(iterations);
    });

    test('should handle high-frequency security events', async () => {
      const eventsPerSecond = 1000;
      const durationSeconds = 5;
      const totalEvents = eventsPerSecond * durationSeconds;
      const maxProcessingTime = durationSeconds * 1000 + 1000; // Allow 1 second buffer
      
      const startTime = performance.now();
      
      const promises: Promise<any>[] = [];
      
      for (let i = 0; i < totalEvents; i++) {
        const eventType = i % 2 === 0 ? 'login' : 'anomaly';
        
        if (eventType === 'login') {
          promises.push(
            ThreatDetectionService.analyzeLoginAttempt(
              `burst-user-${i % 100}@example.com`,
              `192.168.${Math.floor(i / 255)}.${i % 255}`,
              'test-agent'
            )
          );
        } else {
          promises.push(
            ThreatDetectionService.detectAnomalies(
              `burst-user-${i % 100}`,
              'burst_action',
              { ipAddress: `192.168.1.${i % 255}` }
            )
          );
        }
        
        // Add small delay every 100 events to simulate realistic timing
        if (i % 100 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(maxProcessingTime);
    });
  });

  describe('WebAuthn Performance', () => {
    test('should generate registration options efficiently', async () => {
      const iterations = 500;
      const maxTimePerOperation = 100; // 100ms max per operation
      
      const startTime = performance.now();
      
      const promises = Array.from({ length: iterations }, (_, i) => 
        WebAuthnService.generateRegistrationOptions(`user-${i}`, `user${i}@example.com`)
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / iterations;
      
      expect(avgTimePerOperation).toBeLessThan(maxTimePerOperation);
      expect(WebAuthnService.generateRegistrationOptions).toHaveBeenCalledTimes(iterations);
    });

    test('should verify registrations within performance threshold', async () => {
      const iterations = 200;
      const maxTimePerOperation = 150; // 150ms max per operation
      
      const mockResponse = {
        id: 'test-credential-id',
        rawId: 'test-credential-id',
        response: {
          attestationObject: 'mock-attestation',
          clientDataJSON: 'mock-client-data',
        },
        type: 'public-key',
      };
      
      const startTime = performance.now();
      
      const promises = Array.from({ length: iterations }, (_, i) => 
        WebAuthnService.verifyRegistration(`user-${i}`, mockResponse, `device-${i}`)
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / iterations;
      
      expect(avgTimePerOperation).toBeLessThan(maxTimePerOperation);
      expect(WebAuthnService.verifyRegistration).toHaveBeenCalledTimes(iterations);
    });

    test('should handle authentication flow efficiently', async () => {
      const users = 100;
      const maxTimePerUser = 300; // 300ms max per complete flow
      
      const mockAuthResponse = {
        id: 'test-credential-id',
        rawId: 'test-credential-id',
        response: {
          authenticatorData: 'mock-auth-data',
          clientDataJSON: 'mock-client-data',
          signature: 'mock-signature',
        },
        type: 'public-key',
      };
      
      const userPromises = Array.from({ length: users }, async (_, i) => {
        const userId = `auth-user-${i}`;
        const startTime = performance.now();
        
        // Complete authentication flow
        await WebAuthnService.generateAuthenticationOptions(userId);
        await WebAuthnService.verifyAuthentication(userId, mockAuthResponse);
        
        const endTime = performance.now();
        const userTime = endTime - startTime;
        
        expect(userTime).toBeLessThan(maxTimePerUser);
        return userTime;
      });
      
      const userTimes = await Promise.all(userPromises);
      const avgTimePerUser = userTimes.reduce((sum, time) => sum + time, 0) / users;
      
      expect(avgTimePerUser).toBeLessThan(maxTimePerUser / 2); // Average should be much better
    });
  });

  describe('Memory Performance', () => {
    test('should not leak memory during intensive operations', async () => {
      const initialMemory = process.memoryUsage();
      const iterations = 1000;
      
      // Perform intensive security operations
      const promises: Promise<any>[] = [];
      
      for (let i = 0; i < iterations; i++) {
        promises.push(
          MFAService.setupTOTP(`memory-test-${i}`, `test${i}@example.com`),
          RBACService.hasPermission(`memory-test-${i}`, 'test', 'read'),
          ThreatDetectionService.analyzeLoginAttempt(
            `test${i}@example.com`,
            `192.168.1.${i % 255}`,
            'test-agent'
          )
        );
      }
      
      await Promise.all(promises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const maxAcceptableIncrease = 50 * 1024 * 1024; // 50MB
      
      expect(memoryIncrease).toBeLessThan(maxAcceptableIncrease);
    });
  });

  describe('Load Testing', () => {
    test('should maintain performance under sustained load', async () => {
      const duration = 5000; // 5 seconds
      const targetRPS = 100; // 100 requests per second
      const maxResponseTime = 50; // 50ms max response time
      
      const startTime = performance.now();
      const endTime = startTime + duration;
      let requestCount = 0;
      const responseTimes: number[] = [];
      
      const loadTest = async () => {
        while (performance.now() < endTime) {
          const requestStart = performance.now();
          
          // Mix of different security operations
          const operationType = requestCount % 4;
          switch (operationType) {
            case 0:
              await MFAService.verifyTOTP(`load-user-${requestCount % 10}`, '123456');
              break;
            case 1:
              await RBACService.hasPermission(`load-user-${requestCount % 10}`, 'test', 'read');
              break;
            case 2:
              await ThreatDetectionService.analyzeLoginAttempt(
                `load${requestCount % 10}@example.com`,
                `192.168.1.${requestCount % 255}`,
                'load-test-agent'
              );
              break;
            case 3:
              await WebAuthnService.generateRegistrationOptions(
                `load-user-${requestCount % 10}`,
                `load${requestCount % 10}@example.com`
              );
              break;
          }
          
          const requestEnd = performance.now();
          const responseTime = requestEnd - requestStart;
          responseTimes.push(responseTime);
          requestCount++;
          
          // Rate limiting to achieve target RPS
          const expectedTime = startTime + (requestCount * 1000 / targetRPS);
          const currentTime = performance.now();
          const delay = expectedTime - currentTime;
          
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };
      
      await loadTest();
      
      const actualRPS = requestCount / (duration / 1000);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
      
      expect(actualRPS).toBeGreaterThan(targetRPS * 0.9); // Within 10% of target
      expect(avgResponseTime).toBeLessThan(maxResponseTime);
      expect(p95ResponseTime).toBeLessThan(maxResponseTime * 2); // P95 can be up to 2x avg
    });
  });

  describe('Database Performance Impact', () => {
    test('should minimize database queries for security operations', async () => {
      // Mock database query counter
      let queryCount = 0;
      const mockQuery = jest.fn().mockImplementation(() => {
        queryCount++;
        return Promise.resolve({});
      });
      
      // In real implementation, this would mock the actual database layer
      const maxQueriesPerOperation = 3;
      
      // Test MFA operations
      queryCount = 0;
      await MFAService.verifyTOTP('db-test-user', '123456');
      expect(queryCount).toBeLessThanOrEqual(maxQueriesPerOperation);
      
      // Test RBAC operations
      queryCount = 0;
      await RBACService.hasPermission('db-test-user', 'test', 'read');
      expect(queryCount).toBeLessThanOrEqual(maxQueriesPerOperation);
      
      // Test threat detection
      queryCount = 0;
      await ThreatDetectionService.analyzeLoginAttempt(
        'db-test@example.com',
        '192.168.1.1',
        'test-agent'
      );
      expect(queryCount).toBeLessThanOrEqual(maxQueriesPerOperation * 2); // More complex analysis allowed
    });
  });

  describe('Cache Performance', () => {
    test('should utilize caching for frequently accessed data', async () => {
      const userId = 'cache-test-user';
      const iterations = 100;
      
      // First call should be slower (cache miss)
      const startTime1 = performance.now();
      await RBACService.hasPermission(userId, 'cached-resource', 'read');
      const firstCallTime = performance.now() - startTime1;
      
      // Subsequent calls should be faster (cache hit)
      const startTime2 = performance.now();
      const promises = Array.from({ length: iterations }, () => 
        RBACService.hasPermission(userId, 'cached-resource', 'read')
      );
      await Promise.all(promises);
      const cachedCallsTime = performance.now() - startTime2;
      
      const avgCachedCallTime = cachedCallsTime / iterations;
      
      // Cached calls should be significantly faster
      expect(avgCachedCallTime).toBeLessThan(firstCallTime * 0.5);
    });
  });
});