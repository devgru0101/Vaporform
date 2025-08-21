/**
 * Comprehensive Security Testing Suite
 * Tests for MFA, RBAC, WebAuthn, and Threat Detection
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MFAService, WebAuthnService, RBACService, ThreatDetectionService } from '../src/services/security';
import Redis from 'ioredis';

// Mock Redis
jest.mock('ioredis');
const mockRedis = {
  hmset: jest.fn(),
  hmget: jest.fn(),
  hset: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  lpush: jest.fn(),
  ltrim: jest.fn(),
  lrange: jest.fn(),
  smembers: jest.fn(),
  sadd: jest.fn(),
  sismember: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  zrange: jest.fn(),
  keys: jest.fn(),
  hgetall: jest.fn(),
};

(Redis as any).mockImplementation(() => mockRedis);

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('mock-random-bytes')),
  randomUUID: jest.fn(() => 'mock-uuid'),
  createCipher: jest.fn(() => ({
    update: jest.fn(() => 'encrypted'),
    final: jest.fn(() => 'data'),
  })),
  createDecipher: jest.fn(() => ({
    update: jest.fn(() => 'decrypted'),
    final: jest.fn(() => 'data'),
  })),
}));

// Mock speakeasy
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(() => ({
    base32: 'MOCK_SECRET',
    otpauth_url: 'otpauth://totp/Vaporform:test@example.com?secret=MOCK_SECRET&issuer=Vaporform',
  })),
  totp: {
    verify: jest.fn(() => true),
  },
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,mock-qr-code')),
}));

// Mock WebAuthn
jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn(() => Promise.resolve({
    challenge: 'mock-challenge',
    rp: { name: 'Vaporform', id: 'localhost' },
    user: { id: 'mock-user-id', name: 'test@example.com', displayName: 'test@example.com' },
    pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
    attestation: 'none',
    excludeCredentials: [],
    authenticatorSelection: { residentKey: 'discouraged' },
  })),
  verifyRegistrationResponse: jest.fn(() => Promise.resolve({
    verified: true,
    registrationInfo: {
      credentialPublicKey: new Uint8Array([1, 2, 3]),
      credentialID: new Uint8Array([4, 5, 6]),
      counter: 0,
    },
  })),
  generateAuthenticationOptions: jest.fn(() => Promise.resolve({
    challenge: 'mock-auth-challenge',
    rpId: 'localhost',
    allowCredentials: [],
  })),
  verifyAuthenticationResponse: jest.fn(() => Promise.resolve({
    verified: true,
    authenticationInfo: { newCounter: 1 },
  })),
}));

describe('Security Framework Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Redis mock responses
    mockRedis.hmget.mockResolvedValue([null, null]);
    mockRedis.get.mockResolvedValue(null);
    mockRedis.lrange.mockResolvedValue([]);
    mockRedis.smembers.mockResolvedValue([]);
    mockRedis.sismember.mockResolvedValue(false);
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.zrange.mockResolvedValue([]);
    mockRedis.keys.mockResolvedValue([]);
    mockRedis.hgetall.mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('MFAService', () => {
    describe('setupTOTP', () => {
      test('should generate TOTP secret and QR code successfully', async () => {
        const userId = 'test-user-id';
        const userEmail = 'test@example.com';

        const result = await MFAService.setupTOTP(userId, userEmail);

        expect(result).toHaveProperty('secret');
        expect(result).toHaveProperty('qrCodeUrl');
        expect(result).toHaveProperty('backupCodes');
        expect(result.backupCodes).toHaveLength(10);
        expect(mockRedis.hmset).toHaveBeenCalledWith(
          `user:${userId}:mfa`,
          expect.objectContaining({
            enabled: 'false',
          })
        );
        expect(mockRedis.lpush).toHaveBeenCalledWith('security:events', expect.any(String));
      });

      test('should handle errors gracefully', async () => {
        mockRedis.hmset.mockRejectedValue(new Error('Redis error'));

        await expect(MFAService.setupTOTP('user-id', 'test@example.com'))
          .rejects.toThrow('Failed to setup MFA');
      });
    });

    describe('verifyAndEnableTOTP', () => {
      test('should verify TOTP code and enable MFA', async () => {
        const userId = 'test-user-id';
        const code = '123456';

        mockRedis.hmget.mockResolvedValue(['encrypted-secret', 'false']);

        const result = await MFAService.verifyAndEnableTOTP(userId, code);

        expect(result).toBe(true);
        expect(mockRedis.hset).toHaveBeenCalledWith(`user:${userId}:mfa`, 'enabled', 'true');
        expect(mockRedis.lpush).toHaveBeenCalledWith('security:events', expect.any(String));
      });

      test('should reject invalid TOTP code', async () => {
        const speakeasy = require('speakeasy');
        speakeasy.totp.verify.mockReturnValue(false);

        mockRedis.hmget.mockResolvedValue(['encrypted-secret', 'false']);

        const result = await MFAService.verifyAndEnableTOTP('user-id', 'invalid');

        expect(result).toBe(false);
        expect(mockRedis.hset).not.toHaveBeenCalled();
      });

      test('should reject if MFA already enabled', async () => {
        mockRedis.hmget.mockResolvedValue(['encrypted-secret', 'true']);

        const result = await MFAService.verifyAndEnableTOTP('user-id', '123456');

        expect(result).toBe(false);
      });
    });

    describe('verifyTOTP', () => {
      test('should verify valid TOTP code', async () => {
        mockRedis.hmget.mockResolvedValue(['encrypted-secret', 'true', null]);

        const result = await MFAService.verifyTOTP('user-id', '123456');

        expect(result).toBe(true);
        expect(mockRedis.lpush).toHaveBeenCalledWith('security:events', expect.any(String));
      });

      test('should verify backup code when TOTP fails', async () => {
        const speakeasy = require('speakeasy');
        speakeasy.totp.verify.mockReturnValue(false);

        const encryptedBackupCodes = JSON.stringify(['encrypted-code-1', 'encrypted-code-2']);
        mockRedis.hmget.mockResolvedValue(['encrypted-secret', 'true', encryptedBackupCodes]);

        const result = await MFAService.verifyTOTP('user-id', 'DECRYPTED'); // Will match decrypted backup code

        expect(result).toBe(true);
        expect(mockRedis.hset).toHaveBeenCalledWith(
          'user:user-id:mfa',
          'backupCodes',
          expect.any(String)
        );
      });

      test('should reject when MFA not enabled', async () => {
        mockRedis.hmget.mockResolvedValue([null, 'false', null]);

        const result = await MFAService.verifyTOTP('user-id', '123456');

        expect(result).toBe(false);
      });
    });

    describe('generateNewBackupCodes', () => {
      test('should generate new backup codes', async () => {
        const result = await MFAService.generateNewBackupCodes('user-id');

        expect(result).toHaveLength(10);
        expect(mockRedis.hset).toHaveBeenCalledWith(
          'user:user-id:mfa',
          'backupCodes',
          expect.any(String)
        );
        expect(mockRedis.lpush).toHaveBeenCalledWith('security:events', expect.any(String));
      });
    });
  });

  describe('WebAuthnService', () => {
    describe('generateRegistrationOptions', () => {
      test('should generate WebAuthn registration options', async () => {
        const userId = 'test-user-id';
        const userEmail = 'test@example.com';

        const result = await WebAuthnService.generateRegistrationOptions(userId, userEmail);

        expect(result).toHaveProperty('challenge');
        expect(result).toHaveProperty('rp');
        expect(mockRedis.setex).toHaveBeenCalledWith(
          `webauthn:challenge:${userId}`,
          300,
          'mock-challenge'
        );
      });
    });

    describe('verifyRegistration', () => {
      test('should verify WebAuthn registration successfully', async () => {
        const userId = 'test-user-id';
        const response = {
          id: 'credential-id',
          response: {
            transports: ['usb'],
          },
        };
        const deviceName = 'YubiKey';

        mockRedis.get.mockResolvedValue('mock-challenge');
        mockRedis.get.mockResolvedValueOnce('[]'); // For devices

        const result = await WebAuthnService.verifyRegistration(userId, response, deviceName);

        expect(result).toBe(true);
        expect(mockRedis.set).toHaveBeenCalledWith(
          `user:${userId}:webauthn_devices`,
          expect.any(String)
        );
        expect(mockRedis.del).toHaveBeenCalledWith(`webauthn:challenge:${userId}`);
      });

      test('should reject when challenge not found', async () => {
        mockRedis.get.mockResolvedValue(null);

        const result = await WebAuthnService.verifyRegistration('user-id', {}, 'device');

        expect(result).toBe(false);
      });
    });

    describe('generateAuthenticationOptions', () => {
      test('should generate authentication options with existing devices', async () => {
        const userId = 'test-user-id';
        const devices = [
          { credentialID: new Uint8Array([1, 2, 3]), transports: ['usb'] },
        ];

        mockRedis.get.mockResolvedValue(JSON.stringify(devices));

        const result = await WebAuthnService.generateAuthenticationOptions(userId);

        expect(result).toHaveProperty('challenge');
        expect(result).toHaveProperty('allowCredentials');
        expect(mockRedis.setex).toHaveBeenCalledWith(
          `webauthn:auth_challenge:${userId}`,
          300,
          'mock-auth-challenge'
        );
      });
    });

    describe('verifyAuthentication', () => {
      test('should verify WebAuthn authentication successfully', async () => {
        const userId = 'test-user-id';
        const response = {
          id: Buffer.from([4, 5, 6]).toString('base64url'),
        };

        mockRedis.get
          .mockResolvedValueOnce('mock-auth-challenge') // Challenge
          .mockResolvedValueOnce(JSON.stringify([{
            credentialID: new Uint8Array([4, 5, 6]),
            counter: 0,
          }])); // Devices

        const result = await WebAuthnService.verifyAuthentication(userId, response);

        expect(result).toBe(true);
        expect(mockRedis.del).toHaveBeenCalledWith(`webauthn:auth_challenge:${userId}`);
      });

      test('should reject when device not found', async () => {
        const userId = 'test-user-id';
        const response = {
          id: Buffer.from([7, 8, 9]).toString('base64url'),
        };

        mockRedis.get
          .mockResolvedValueOnce('mock-auth-challenge')
          .mockResolvedValueOnce(JSON.stringify([{
            credentialID: new Uint8Array([4, 5, 6]),
          }]));

        const result = await WebAuthnService.verifyAuthentication(userId, response);

        expect(result).toBe(false);
      });
    });
  });

  describe('RBACService', () => {
    describe('hasPermission', () => {
      test('should grant permission when user has required role', async () => {
        const userId = 'test-user-id';
        const resource = 'projects';
        const action = 'read';

        mockRedis.smembers.mockResolvedValue(['admin-role']);
        mockRedis.get
          .mockResolvedValueOnce(JSON.stringify({
            id: 'admin-role',
            name: 'Admin',
            permissions: ['projects-read'],
          })) // Role data
          .mockResolvedValueOnce(JSON.stringify({
            id: 'projects-read',
            resource: 'projects',
            action: 'read',
          })); // Permission data

        const result = await RBACService.hasPermission(userId, resource, action);

        expect(result).toBe(true);
        expect(mockRedis.lpush).toHaveBeenCalledWith('security:events', expect.any(String));
      });

      test('should deny permission when user lacks required role', async () => {
        const userId = 'test-user-id';
        const resource = 'admin';
        const action = 'write';

        mockRedis.smembers.mockResolvedValue(['user-role']);
        mockRedis.get.mockResolvedValueOnce(JSON.stringify({
          id: 'user-role',
          name: 'User',
          permissions: ['projects-read'],
        }));

        const result = await RBACService.hasPermission(userId, resource, action);

        expect(result).toBe(false);
      });

      test('should evaluate conditions when present', async () => {
        const userId = 'test-user-id';
        const resource = 'projects';
        const action = 'read';
        const context = { projectId: '123' };

        mockRedis.smembers.mockResolvedValue(['project-member']);
        mockRedis.get
          .mockResolvedValueOnce(JSON.stringify({
            id: 'project-member',
            permissions: ['projects-read-own'],
          }))
          .mockResolvedValueOnce(JSON.stringify({
            id: 'projects-read-own',
            resource: 'projects',
            action: 'read',
            conditions: { projectId: '123' },
          }));

        const result = await RBACService.hasPermission(userId, resource, action, context);

        expect(result).toBe(true);
      });
    });

    describe('createRole', () => {
      test('should create role successfully', async () => {
        const role = {
          id: 'new-role',
          name: 'New Role',
          permissions: ['perm1', 'perm2'],
        };

        await RBACService.createRole(role);

        expect(mockRedis.set).toHaveBeenCalledWith(
          'role:new-role',
          JSON.stringify(role)
        );
      });
    });

    describe('assignRole', () => {
      test('should assign role to user', async () => {
        const userId = 'test-user-id';
        const roleId = 'admin-role';

        await RBACService.assignRole(userId, roleId);

        expect(mockRedis.sadd).toHaveBeenCalledWith(`user:${userId}:roles`, roleId);
        expect(mockRedis.lpush).toHaveBeenCalledWith('security:events', expect.any(String));
      });
    });
  });

  describe('ThreatDetectionService', () => {
    describe('analyzeLoginAttempt', () => {
      test('should detect low risk for normal login', async () => {
        const email = 'test@example.com';
        const ipAddress = '192.168.1.100';
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

        mockRedis.incr.mockResolvedValue(1);
        mockRedis.sismember.mockResolvedValue(false);
        mockRedis.zrange.mockResolvedValue(['mozilla/x.x.x']);
        mockRedis.lrange.mockResolvedValue(['external']);
        mockRedis.hgetall.mockResolvedValue({
          typical_hours: JSON.stringify([9, 10, 11, 12, 13, 14, 15, 16, 17]),
        });

        const result = await ThreatDetectionService.analyzeLoginAttempt(email, ipAddress, userAgent);

        expect(result.riskScore).toBeLessThan(50);
        expect(result.blocked).toBe(false);
        expect(mockRedis.lpush).toHaveBeenCalledWith('security:events', expect.any(String));
      });

      test('should detect high risk for suspicious activity', async () => {
        const email = 'test@example.com';
        const ipAddress = '1.2.3.4';
        const userAgent = 'suspicious-bot/1.0';

        mockRedis.incr.mockResolvedValue(10); // Many attempts
        mockRedis.sismember.mockResolvedValue(true); // Suspicious IP
        mockRedis.zrange.mockResolvedValue(['mozilla/x.x.x']); // UA not in common list
        mockRedis.lrange.mockResolvedValue(['local']); // New location
        mockRedis.hgetall.mockResolvedValue({
          typical_hours: JSON.stringify([9, 10, 11, 12, 13, 14, 15, 16, 17]),
        });

        // Mock current hour to be outside typical hours
        const mockDate = new Date('2023-01-01T02:00:00Z');
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

        const result = await ThreatDetectionService.analyzeLoginAttempt(email, ipAddress, userAgent);

        expect(result.riskScore).toBeGreaterThanOrEqual(80);
        expect(result.blocked).toBe(true);
        expect(result.reasons).toContain('Excessive login attempts from IP');
        expect(result.reasons).toContain('IP address flagged as suspicious');

        jest.restoreAllMocks();
      });
    });

    describe('detectAnomalies', () => {
      test('should detect anomalous behavior patterns', async () => {
        const userId = 'test-user-id';
        const action = 'project_create';
        const context = { ipAddress: '1.2.3.4', resource: 'projects' };

        mockRedis.incr.mockResolvedValueOnce(50); // High frequency
        mockRedis.incr.mockResolvedValueOnce(150); // High resource access
        mockRedis.get.mockResolvedValue(String(Date.now() - 500)); // Recent action
        mockRedis.keys.mockResolvedValue(['key1', 'key2']);

        const result = await ThreatDetectionService.detectAnomalies(userId, action, context);

        expect(result.isAnomalous).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.5);
        expect(result.reasons).toContain('Unusual frequency of action');
        expect(mockRedis.lpush).toHaveBeenCalledWith('security:events', expect.any(String));
      });

      test('should not flag normal behavior as anomalous', async () => {
        const userId = 'test-user-id';
        const action = 'project_view';
        const context = { ipAddress: '192.168.1.100' };

        mockRedis.incr.mockResolvedValueOnce(2); // Normal frequency
        mockRedis.incr.mockResolvedValueOnce(10); // Normal resource access
        mockRedis.get.mockResolvedValue(String(Date.now() - 5000)); // Not too recent
        mockRedis.keys.mockResolvedValue(['key1', 'key2']);

        const result = await ThreatDetectionService.detectAnomalies(userId, action, context);

        expect(result.isAnomalous).toBe(false);
        expect(result.confidence).toBeLessThan(0.5);
      });
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete MFA flow', async () => {
      const userId = 'integration-test-user';
      const userEmail = 'integration@example.com';

      // Setup MFA
      mockRedis.hmget.mockResolvedValue([null, null]);
      const setupResult = await MFAService.setupTOTP(userId, userEmail);
      expect(setupResult).toHaveProperty('secret');

      // Verify and enable
      mockRedis.hmget.mockResolvedValue(['encrypted-secret', 'false']);
      const enableResult = await MFAService.verifyAndEnableTOTP(userId, '123456');
      expect(enableResult).toBe(true);

      // Verify login
      mockRedis.hmget.mockResolvedValue(['encrypted-secret', 'true', null]);
      const verifyResult = await MFAService.verifyTOTP(userId, '123456');
      expect(verifyResult).toBe(true);
    });

    test('should handle permission checking with threat detection', async () => {
      const userId = 'integration-test-user';
      const resource = 'sensitive-data';
      const action = 'read';
      const context = { 
        ipAddress: '1.2.3.4', 
        userAgent: 'suspicious-bot/1.0' 
      };

      // Setup role and permission
      mockRedis.smembers.mockResolvedValue(['admin-role']);
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify({
          id: 'admin-role',
          permissions: ['sensitive-read'],
        }))
        .mockResolvedValueOnce(JSON.stringify({
          id: 'sensitive-read',
          resource: 'sensitive-data',
          action: 'read',
        }));

      // Check permission (should pass)
      const permissionResult = await RBACService.hasPermission(userId, resource, action, context);
      expect(permissionResult).toBe(true);

      // Check for anomalies (should detect suspicious behavior)
      mockRedis.incr.mockResolvedValue(1);
      const anomalyResult = await ThreatDetectionService.detectAnomalies(userId, action, context);
      
      // Even though permission is granted, anomaly detection may flag it
      expect(anomalyResult).toHaveProperty('isAnomalous');
      expect(anomalyResult).toHaveProperty('confidence');
    });
  });

  describe('Error Handling', () => {
    test('should handle Redis connection failures gracefully', async () => {
      mockRedis.hmget.mockRejectedValue(new Error('Redis connection failed'));

      await expect(MFAService.verifyTOTP('user-id', '123456'))
        .resolves.toBe(false);
    });

    test('should handle malformed data gracefully', async () => {
      mockRedis.hmget.mockResolvedValue(['invalid-encrypted-data', 'true']);

      const result = await MFAService.verifyTOTP('user-id', '123456');
      expect(result).toBe(false);
    });

    test('should handle permission check errors', async () => {
      mockRedis.smembers.mockRejectedValue(new Error('Database error'));

      const result = await RBACService.hasPermission('user-id', 'resource', 'action');
      expect(result).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    test('should handle concurrent MFA verifications', async () => {
      const userId = 'perf-test-user';
      const promises: Promise<boolean>[] = [];

      mockRedis.hmget.mockResolvedValue(['encrypted-secret', 'true', null]);

      // Simulate 100 concurrent verifications
      for (let i = 0; i < 100; i++) {
        promises.push(MFAService.verifyTOTP(userId, '123456'));
      }

      const results = await Promise.all(promises);
      expect(results.every(result => result === true)).toBe(true);
    });

    test('should handle rapid permission checks', async () => {
      const userId = 'perf-test-user';
      const promises: Promise<boolean>[] = [];

      mockRedis.smembers.mockResolvedValue(['test-role']);
      mockRedis.get.mockResolvedValue(JSON.stringify({
        id: 'test-role',
        permissions: ['test-perm'],
      }));

      // Simulate 50 rapid permission checks
      for (let i = 0; i < 50; i++) {
        promises.push(RBACService.hasPermission(userId, 'resource', 'action'));
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(50);
    });
  });

  describe('Security Edge Cases', () => {
    test('should prevent timing attacks on MFA verification', async () => {
      const userId = 'timing-test-user';
      
      // Test with valid MFA data
      mockRedis.hmget.mockResolvedValue(['encrypted-secret', 'true', null]);
      const start1 = Date.now();
      await MFAService.verifyTOTP(userId, '123456');
      const duration1 = Date.now() - start1;

      // Test with invalid MFA data
      mockRedis.hmget.mockResolvedValue([null, 'false', null]);
      const start2 = Date.now();
      await MFAService.verifyTOTP(userId, '123456');
      const duration2 = Date.now() - start2;

      // Durations should be similar to prevent timing attacks
      const timingDifference = Math.abs(duration1 - duration2);
      expect(timingDifference).toBeLessThan(100); // Allow 100ms variance
    });

    test('should prevent backup code reuse', async () => {
      const userId = 'backup-test-user';
      const backupCode = 'ABCD1234';

      const speakeasy = require('speakeasy');
      speakeasy.totp.verify.mockReturnValue(false); // Force backup code usage

      const encryptedBackupCodes = JSON.stringify(['encrypted-backup-code']);
      mockRedis.hmget.mockResolvedValue(['encrypted-secret', 'true', encryptedBackupCodes]);

      // First use should succeed
      const result1 = await MFAService.verifyTOTP(userId, 'DECRYPTED');
      expect(result1).toBe(true);

      // Second use of same code should fail (code removed from list)
      mockRedis.hmget.mockResolvedValue(['encrypted-secret', 'true', '[]']);
      const result2 = await MFAService.verifyTOTP(userId, 'DECRYPTED');
      expect(result2).toBe(false);
    });

    test('should handle privilege escalation attempts', async () => {
      const userId = 'escalation-test-user';
      
      // User has limited permissions
      mockRedis.smembers.mockResolvedValue(['user-role']);
      mockRedis.get.mockResolvedValue(JSON.stringify({
        id: 'user-role',
        permissions: ['read-own-data'],
      }));

      // Attempt to access admin resource
      const result = await RBACService.hasPermission(userId, 'admin-panel', 'access');
      expect(result).toBe(false);

      // Verify security event was logged
      expect(mockRedis.lpush).toHaveBeenCalledWith(
        'security:events',
        expect.stringContaining('permission_check')
      );
    });
  });
});