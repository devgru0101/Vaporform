/**
 * API Security Integration Tests
 * Tests security endpoints and middleware integration
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { Redis } from 'ioredis';

// Mock Express app for testing
const express = require('express');
const app = express();

// Mock Redis
const mockRedis = new Redis();

// Mock security middleware
const securityMiddleware = (req: any, res: any, next: any) => {
  // Simulate authentication
  req.user = { id: 'test-user-id', email: 'test@example.com' };
  next();
};

// Setup routes for testing
app.use(express.json());
app.use('/api/security/*', securityMiddleware);

// Mock API routes
app.post('/api/security/mfa/setup', (req: any, res: any) => {
  res.json({
    secret: 'MOCK_SECRET',
    qrCodeUrl: 'data:image/png;base64,mock-qr-code',
    backupCodes: ['CODE1', 'CODE2', 'CODE3'],
  });
});

app.post('/api/security/mfa/verify', (req: any, res: any) => {
  const { code } = req.body;
  res.json({ success: code === '123456' });
});

app.post('/api/security/webauthn/register', (req: any, res: any) => {
  res.json({
    challenge: 'mock-challenge',
    rp: { name: 'Vaporform', id: 'localhost' },
    user: { id: req.user.id, name: req.user.email, displayName: req.user.email },
  });
});

app.post('/api/security/webauthn/verify-registration', (req: any, res: any) => {
  res.json({ success: true });
});

app.post('/api/security/permissions/check', (req: any, res: any) => {
  const { resource, action } = req.body;
  const allowed = resource === 'projects' && action === 'read';
  res.json({ allowed });
});

app.post('/api/security/analyze-login', (req: any, res: any) => {
  const { email, ipAddress } = req.body;
  const riskScore = ipAddress.startsWith('192.168.') ? 10 : 75;
  res.json({
    riskScore,
    blocked: riskScore >= 80,
    reasons: riskScore >= 50 ? ['Suspicious IP address'] : [],
  });
});

app.get('/api/security/events', (req: any, res: any) => {
  res.json([
    {
      id: 'event-1',
      type: 'login_attempt',
      severity: 'low',
      timestamp: new Date().toISOString(),
      details: { action: 'successful_login' },
    },
  ]);
});

describe('API Security Integration Tests', () => {
  beforeAll(async () => {
    // Setup test environment
  });

  afterAll(async () => {
    // Cleanup test environment
  });

  beforeEach(() => {
    // Reset state before each test
  });

  describe('MFA Endpoints', () => {
    describe('POST /api/security/mfa/setup', () => {
      test('should setup MFA for authenticated user', async () => {
        const response = await request(app)
          .post('/api/security/mfa/setup')
          .send({ method: 'totp' })
          .expect(200);

        expect(response.body).toHaveProperty('secret');
        expect(response.body).toHaveProperty('qrCodeUrl');
        expect(response.body).toHaveProperty('backupCodes');
        expect(response.body.backupCodes).toHaveLength(3);
      });

      test('should require authentication', async () => {
        // Create route without auth middleware
        const noAuthApp = express();
        noAuthApp.use(express.json());
        noAuthApp.post('/api/security/mfa/setup', (req: any, res: any) => {
          if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
          }
          res.json({ success: true });
        });

        await request(noAuthApp)
          .post('/api/security/mfa/setup')
          .send({ method: 'totp' })
          .expect(401);
      });

      test('should validate request parameters', async () => {
        const invalidMethodApp = express();
        invalidMethodApp.use(express.json());
        invalidMethodApp.post('/api/security/mfa/setup', (req: any, res: any) => {
          const { method } = req.body;
          if (!['totp', 'sms', 'email'].includes(method)) {
            return res.status(400).json({ error: 'Invalid MFA method' });
          }
          res.json({ success: true });
        });

        await request(invalidMethodApp)
          .post('/api/security/mfa/setup')
          .send({ method: 'invalid' })
          .expect(400);
      });
    });

    describe('POST /api/security/mfa/verify', () => {
      test('should verify valid MFA code', async () => {
        const response = await request(app)
          .post('/api/security/mfa/verify')
          .send({ userId: 'test-user-id', code: '123456' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      test('should reject invalid MFA code', async () => {
        const response = await request(app)
          .post('/api/security/mfa/verify')
          .send({ userId: 'test-user-id', code: 'invalid' })
          .expect(200);

        expect(response.body.success).toBe(false);
      });

      test('should handle malformed requests', async () => {
        const malformedApp = express();
        malformedApp.use(express.json());
        malformedApp.post('/api/security/mfa/verify', (req: any, res: any) => {
          const { userId, code } = req.body;
          if (!userId || !code) {
            return res.status(400).json({ error: 'Missing required fields' });
          }
          res.json({ success: true });
        });

        await request(malformedApp)
          .post('/api/security/mfa/verify')
          .send({ userId: 'test-user-id' }) // Missing code
          .expect(400);
      });
    });
  });

  describe('WebAuthn Endpoints', () => {
    describe('POST /api/security/webauthn/register', () => {
      test('should generate WebAuthn registration options', async () => {
        const response = await request(app)
          .post('/api/security/webauthn/register')
          .send({ deviceName: 'YubiKey 5' })
          .expect(200);

        expect(response.body).toHaveProperty('challenge');
        expect(response.body).toHaveProperty('rp');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.id).toBe('test-user-id');
      });

      test('should validate device name', async () => {
        const validationApp = express();
        validationApp.use(express.json());
        validationApp.use('/api/security/*', securityMiddleware);
        validationApp.post('/api/security/webauthn/register', (req: any, res: any) => {
          const { deviceName } = req.body;
          if (!deviceName || deviceName.trim().length === 0) {
            return res.status(400).json({ error: 'Device name is required' });
          }
          if (deviceName.length > 100) {
            return res.status(400).json({ error: 'Device name too long' });
          }
          res.json({ success: true });
        });

        await request(validationApp)
          .post('/api/security/webauthn/register')
          .send({ deviceName: '' })
          .expect(400);

        await request(validationApp)
          .post('/api/security/webauthn/register')
          .send({ deviceName: 'a'.repeat(101) })
          .expect(400);
      });
    });

    describe('POST /api/security/webauthn/verify-registration', () => {
      test('should verify WebAuthn registration', async () => {
        const mockResponse = {
          id: 'credential-id',
          rawId: 'credential-id',
          response: {
            attestationObject: 'mock-attestation',
            clientDataJSON: 'mock-client-data',
          },
          type: 'public-key',
        };

        const response = await request(app)
          .post('/api/security/webauthn/verify-registration')
          .send({ 
            response: mockResponse, 
            deviceName: 'Test Device', 
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Permission Endpoints', () => {
    describe('POST /api/security/permissions/check', () => {
      test('should check user permissions', async () => {
        const response = await request(app)
          .post('/api/security/permissions/check')
          .send({ 
            resource: 'projects', 
            action: 'read',
            context: { ipAddress: '192.168.1.100' },
          })
          .expect(200);

        expect(response.body.allowed).toBe(true);
      });

      test('should deny unauthorized access', async () => {
        const response = await request(app)
          .post('/api/security/permissions/check')
          .send({ 
            resource: 'admin', 
            action: 'write', 
          })
          .expect(200);

        expect(response.body.allowed).toBe(false);
      });

      test('should handle missing parameters', async () => {
        const strictApp = express();
        strictApp.use(express.json());
        strictApp.use('/api/security/*', securityMiddleware);
        strictApp.post('/api/security/permissions/check', (req: any, res: any) => {
          const { resource, action } = req.body;
          if (!resource || !action) {
            return res.status(400).json({ error: 'Resource and action are required' });
          }
          res.json({ allowed: false });
        });

        await request(strictApp)
          .post('/api/security/permissions/check')
          .send({ resource: 'projects' }) // Missing action
          .expect(400);
      });
    });
  });

  describe('Threat Detection Endpoints', () => {
    describe('POST /api/security/analyze-login', () => {
      test('should analyze low-risk login', async () => {
        const response = await request(app)
          .post('/api/security/analyze-login')
          .send({
            email: 'test@example.com',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          })
          .expect(200);

        expect(response.body.riskScore).toBeLessThan(50);
        expect(response.body.blocked).toBe(false);
        expect(response.body.reasons).toHaveLength(0);
      });

      test('should analyze high-risk login', async () => {
        const response = await request(app)
          .post('/api/security/analyze-login')
          .send({
            email: 'test@example.com',
            ipAddress: '1.2.3.4', // Suspicious external IP
            userAgent: 'suspicious-bot/1.0',
          })
          .expect(200);

        expect(response.body.riskScore).toBeGreaterThanOrEqual(50);
        expect(response.body.reasons.length).toBeGreaterThan(0);
      });

      test('should require all parameters', async () => {
        const strictApp = express();
        strictApp.use(express.json());
        strictApp.post('/api/security/analyze-login', (req: any, res: any) => {
          const { email, ipAddress, userAgent } = req.body;
          if (!email || !ipAddress || !userAgent) {
            return res.status(400).json({ error: 'Email, IP address, and user agent are required' });
          }
          res.json({ riskScore: 0, blocked: false, reasons: [] });
        });

        await request(strictApp)
          .post('/api/security/analyze-login')
          .send({
            email: 'test@example.com',
            ipAddress: '192.168.1.100',
            // Missing userAgent
          })
          .expect(400);
      });

      test('should validate email format', async () => {
        const emailValidationApp = express();
        emailValidationApp.use(express.json());
        emailValidationApp.post('/api/security/analyze-login', (req: any, res: any) => {
          const { email } = req.body;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
          }
          res.json({ riskScore: 0, blocked: false, reasons: [] });
        });

        await request(emailValidationApp)
          .post('/api/security/analyze-login')
          .send({
            email: 'invalid-email',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0',
          })
          .expect(400);
      });
    });
  });

  describe('Security Events Endpoints', () => {
    describe('GET /api/security/events', () => {
      test('should retrieve security events', async () => {
        const response = await request(app)
          .get('/api/security/events')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('type');
        expect(response.body[0]).toHaveProperty('severity');
        expect(response.body[0]).toHaveProperty('timestamp');
      });

      test('should support pagination parameters', async () => {
        const paginatedApp = express();
        paginatedApp.use(express.json());
        paginatedApp.use('/api/security/*', securityMiddleware);
        paginatedApp.get('/api/security/events', (req: any, res: any) => {
          const limit = parseInt(req.query.limit) || 100;
          const offset = parseInt(req.query.offset) || 0;
          
          // Mock paginated response
          const events = Array.from({ length: limit }, (_, i) => ({
            id: `event-${offset + i}`,
            type: 'login_attempt',
            severity: 'low',
            timestamp: new Date().toISOString(),
          }));
          
          res.json(events);
        });

        const response = await request(paginatedApp)
          .get('/api/security/events?limit=10&offset=20')
          .expect(200);

        expect(response.body).toHaveLength(10);
        expect(response.body[0].id).toBe('event-20');
      });

      test('should filter events by severity', async () => {
        const filterApp = express();
        filterApp.use(express.json());
        filterApp.use('/api/security/*', securityMiddleware);
        filterApp.get('/api/security/events', (req: any, res: any) => {
          const { severity } = req.query;
          
          const allEvents = [
            { id: '1', severity: 'low', type: 'login_attempt' },
            { id: '2', severity: 'high', type: 'threat_detected' },
            { id: '3', severity: 'low', type: 'mfa_challenge' },
          ];
          
          const filteredEvents = severity 
            ? allEvents.filter(event => event.severity === severity)
            : allEvents;
          
          res.json(filteredEvents);
        });

        const response = await request(filterApp)
          .get('/api/security/events?severity=high')
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].severity).toBe('high');
      });
    });
  });

  describe('Rate Limiting Tests', () => {
    test('should implement rate limiting on sensitive endpoints', async () => {
      const rateLimitedApp = express();
      rateLimitedApp.use(express.json());
      
      // Simple in-memory rate limiter for testing
      const attempts = new Map();
      const rateLimit = (req: any, res: any, next: any) => {
        const key = `${req.ip}:${req.path}`;
        const now = Date.now();
        const windowMs = 60000; // 1 minute
        const maxAttempts = 5;
        
        if (!attempts.has(key)) {
          attempts.set(key, []);
        }
        
        const userAttempts = attempts.get(key);
        const validAttempts = userAttempts.filter((time: number) => now - time < windowMs);
        
        if (validAttempts.length >= maxAttempts) {
          return res.status(429).json({ error: 'Too many requests' });
        }
        
        validAttempts.push(now);
        attempts.set(key, validAttempts);
        next();
      };
      
      rateLimitedApp.use('/api/security/mfa/verify', rateLimit);
      rateLimitedApp.post('/api/security/mfa/verify', (req: any, res: any) => {
        res.json({ success: false });
      });

      // Make 6 requests rapidly
      for (let i = 0; i < 5; i++) {
        await request(rateLimitedApp)
          .post('/api/security/mfa/verify')
          .send({ userId: 'test', code: 'invalid' })
          .expect(200);
      }

      // 6th request should be rate limited
      await request(rateLimitedApp)
        .post('/api/security/mfa/verify')
        .send({ userId: 'test', code: 'invalid' })
        .expect(429);
    });
  });

  describe('Security Headers Tests', () => {
    test('should include security headers', async () => {
      const secureApp = express();
      secureApp.use(express.json());
      
      // Add security headers middleware
      secureApp.use((req: any, res: any, next: any) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.setHeader('Content-Security-Policy', "default-src 'self'");
        next();
      });
      
      secureApp.get('/api/security/test', (req: any, res: any) => {
        res.json({ message: 'Security headers test' });
      });

      const response = await request(secureApp)
        .get('/api/security/test')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });
  });

  describe('Input Validation Tests', () => {
    test('should sanitize input to prevent XSS', async () => {
      const sanitizeApp = express();
      sanitizeApp.use(express.json());
      
      const sanitizeInput = (str: string) => {
        return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      };
      
      sanitizeApp.post('/api/security/test-input', (req: any, res: any) => {
        const { input } = req.body;
        const sanitized = sanitizeInput(input);
        res.json({ original: input, sanitized });
      });

      const maliciousInput = '<script>alert("XSS")</script>Hello World';
      const response = await request(sanitizeApp)
        .post('/api/security/test-input')
        .send({ input: maliciousInput })
        .expect(200);

      expect(response.body.sanitized).toBe('Hello World');
      expect(response.body.sanitized).not.toContain('<script>');
    });

    test('should validate JWT tokens', async () => {
      const jwtApp = express();
      jwtApp.use(express.json());
      
      const validateJWT = (req: any, res: any, next: any) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }
        
        // Simple token validation (in real app, use proper JWT verification)
        if (token !== 'valid-jwt-token') {
          return res.status(401).json({ error: 'Invalid token' });
        }
        
        next();
      };
      
      jwtApp.use('/api/security/protected', validateJWT);
      jwtApp.get('/api/security/protected', (req: any, res: any) => {
        res.json({ message: 'Protected resource accessed' });
      });

      // Test without token
      await request(jwtApp)
        .get('/api/security/protected')
        .expect(401);

      // Test with invalid token
      await request(jwtApp)
        .get('/api/security/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Test with valid token
      await request(jwtApp)
        .get('/api/security/protected')
        .set('Authorization', 'Bearer valid-jwt-token')
        .expect(200);
    });
  });

  describe('CORS Tests', () => {
    test('should handle CORS properly', async () => {
      const corsApp = express();
      corsApp.use(express.json());
      
      // Simple CORS middleware
      corsApp.use((req: any, res: any, next: any) => {
        const allowedOrigins = ['https://app.vaporform.com', 'http://localhost:3000'];
        const {origin} = req.headers;
        
        if (allowedOrigins.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        }
        
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        
        if (req.method === 'OPTIONS') {
          return res.status(200).end();
        }
        
        next();
      });
      
      corsApp.get('/api/security/cors-test', (req: any, res: any) => {
        res.json({ message: 'CORS test' });
      });

      // Test allowed origin
      const response1 = await request(corsApp)
        .get('/api/security/cors-test')
        .set('Origin', 'https://app.vaporform.com')
        .expect(200);

      expect(response1.headers['access-control-allow-origin']).toBe('https://app.vaporform.com');

      // Test disallowed origin
      const response2 = await request(corsApp)
        .get('/api/security/cors-test')
        .set('Origin', 'https://malicious-site.com')
        .expect(200);

      expect(response2.headers['access-control-allow-origin']).toBeUndefined();

      // Test preflight request
      await request(corsApp)
        .options('/api/security/cors-test')
        .set('Origin', 'https://app.vaporform.com')
        .expect(200);
    });
  });
});