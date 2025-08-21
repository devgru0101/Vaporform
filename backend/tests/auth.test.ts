/**
 * Authentication Service Tests
 * Tests for user registration, login, token verification, and auth flows
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { login, register, verify, auth } from '../auth/auth';
import { testUtils } from './setup';

// Mock bcrypt for consistent testing
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock jwt for consistent testing
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Authentication Service', () => {
  const validUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  };

  const demoUser = {
    email: 'demo@vaporform.com',
    password: 'password123',
    name: 'Demo User'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockBcrypt.hash.mockResolvedValue('hashed-password' as never);
    mockBcrypt.compare.mockResolvedValue(true as never);
    mockBcrypt.hashSync.mockReturnValue('hashed-password' as never);
    
    mockJwt.sign.mockReturnValue('mocked-jwt-token' as never);
    mockJwt.verify.mockReturnValue({
      userID: 'test-user-id',
      email: 'test@example.com',
      role: 'user'
    } as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    test('should register a new user successfully', async () => {
      const response = await register(validUser);

      expect(response).toHaveProperty('user');
      expect(response).toHaveProperty('token');
      
      expect(response.user.email).toBe(validUser.email);
      expect(response.user.name).toBe(validUser.name);
      expect(response.user.role).toBe('user');
      expect(response.user).toHaveProperty('id');
      
      expect(response.token).toBe('mocked-jwt-token');
    });

    test('should hash password during registration', async () => {
      await register(validUser);
      
      expect(mockBcrypt.hash).toHaveBeenCalledWith(validUser.password, 12);
    });

    test('should generate JWT token with correct payload', async () => {
      await register(validUser);
      
      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userID: expect.any(String),
          email: validUser.email,
          role: 'user'
        }),
        'vaporform-secret-key',
        { expiresIn: '24h' }
      );
    });

    test('should validate email format', async () => {
      const invalidEmailUser = { ...validUser, email: 'invalid-email' };
      
      await expect(register(invalidEmailUser)).rejects.toThrow('Invalid email format');
    });

    test('should validate password length', async () => {
      const shortPasswordUser = { ...validUser, password: '123' };
      
      await expect(register(shortPasswordUser)).rejects.toThrow('Password must be at least 8 characters');
    });

    test('should validate name is provided', async () => {
      const noNameUser = { ...validUser, name: '' };
      
      await expect(register(noNameUser)).rejects.toThrow('Name is required');
      
      const spaceNameUser = { ...validUser, name: '   ' };
      
      await expect(register(spaceNameUser)).rejects.toThrow('Name is required');
    });

    test('should reject duplicate email registration', async () => {
      // First registration should succeed
      await register(validUser);
      
      // Second registration with same email should fail
      await expect(register(validUser)).rejects.toThrow('User already exists');
    });

    test('should generate unique user IDs', async () => {
      const user1 = await register({ ...validUser, email: 'user1@test.com' });
      const user2 = await register({ ...validUser, email: 'user2@test.com' });
      
      expect(user1.user.id).not.toBe(user2.user.id);
    });

    test('should trim whitespace from name', async () => {
      const userWithSpaces = { ...validUser, name: '  Test User  ' };
      const response = await register(userWithSpaces);
      
      expect(response.user.name).toBe('Test User');
    });
  });

  describe('User Login', () => {
    test('should login with demo user successfully', async () => {
      // Mock bcrypt to return true for demo user password
      mockBcrypt.compare.mockResolvedValueOnce(true as never);
      
      const response = await login(demoUser);

      expect(response).toHaveProperty('user');
      expect(response).toHaveProperty('token');
      
      expect(response.user.email).toBe(demoUser.email);
      expect(response.user.role).toBe('user');
      expect(response.token).toBe('mocked-jwt-token');
    });

    test('should validate email format during login', async () => {
      const invalidLogin = { email: 'invalid-email', password: 'password123' };
      
      await expect(login(invalidLogin)).rejects.toThrow('Invalid email format');
    });

    test('should validate password length during login', async () => {
      const shortPasswordLogin = { email: 'test@example.com', password: '123' };
      
      await expect(login(shortPasswordLogin)).rejects.toThrow('Password must be at least 8 characters');
    });

    test('should reject login with non-existent user', async () => {
      const nonExistentUser = { email: 'nonexistent@example.com', password: 'password123' };
      
      await expect(login(nonExistentUser)).rejects.toThrow('Invalid credentials');
    });

    test('should reject login with incorrect password', async () => {
      // Mock bcrypt to return false for incorrect password
      mockBcrypt.compare.mockResolvedValueOnce(false as never);
      
      await expect(login(demoUser)).rejects.toThrow('Invalid credentials');
    });

    test('should verify password against stored hash', async () => {
      await login(demoUser);
      
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        demoUser.password,
        expect.any(String)
      );
    });

    test('should generate JWT token on successful login', async () => {
      mockBcrypt.compare.mockResolvedValueOnce(true as never);
      
      await login(demoUser);
      
      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userID: expect.any(String),
          email: demoUser.email,
          role: 'user'
        }),
        'vaporform-secret-key',
        { expiresIn: '24h' }
      );
    });
  });

  describe('Token Verification', () => {
    test('should verify valid token successfully', async () => {
      const response = await verify();

      expect(response).toHaveProperty('user');
      expect(response).toHaveProperty('valid');
      
      expect(response.valid).toBe(true);
      expect(response.user).toHaveProperty('id');
      expect(response.user).toHaveProperty('email');
      expect(response.user).toHaveProperty('name');
      expect(response.user).toHaveProperty('role');
    });

    test('should return demo user info when no users exist', async () => {
      const response = await verify();
      
      expect(response.user.email).toContain('@');
      expect(response.user.role).toBe('user');
    });

    test('should have consistent response structure', async () => {
      const response = await verify();
      
      expect(response).toEqual({
        user: expect.objectContaining({
          id: expect.any(String),
          email: expect.any(String),
          name: expect.any(String),
          role: expect.any(String)
        }),
        valid: expect.any(Boolean)
      });
    });
  });

  describe('Auth Handler', () => {
    test('should extract and verify JWT token from Authorization header', async () => {
      const mockAuthParams = {
        authorization: 'Bearer valid-jwt-token'
      };

      const result = await auth(mockAuthParams);

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-jwt-token', 'vaporform-secret-key');
      expect(result).toEqual({
        userID: 'test-user-id',
        email: 'test@example.com',
        role: 'user'
      });
    });

    test('should throw error for missing authorization header', async () => {
      const mockAuthParams = {
        authorization: undefined as any
      };

      await expect(auth(mockAuthParams)).rejects.toThrow('Missing authorization token');
    });

    test('should throw error for invalid token format', async () => {
      const mockAuthParams = {
        authorization: 'InvalidTokenFormat'
      };

      await expect(auth(mockAuthParams)).rejects.toThrow('Missing authorization token');
    });

    test('should throw error for invalid JWT token', async () => {
      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const mockAuthParams = {
        authorization: 'Bearer invalid-token'
      };

      await expect(auth(mockAuthParams)).rejects.toThrow('Invalid token');
    });

    test('should handle token without Bearer prefix', async () => {
      const mockAuthParams = {
        authorization: 'direct-token'
      };

      await expect(auth(mockAuthParams)).rejects.toThrow('Missing authorization token');
    });
  });

  describe('Password Security', () => {
    test('should use appropriate salt rounds for password hashing', async () => {
      await register(validUser);
      
      expect(mockBcrypt.hash).toHaveBeenCalledWith(validUser.password, 12);
    });

    test('should not expose password hash in responses', async () => {
      const response = await register(validUser);
      
      expect(response.user).not.toHaveProperty('passwordHash');
      expect(response.user).not.toHaveProperty('password');
    });
  });

  describe('Data Validation', () => {
    test('should validate email with proper regex', async () => {
      const invalidEmails = [
        'notanemail',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user name@domain.com'
      ];

      for (const email of invalidEmails) {
        await expect(register({ ...validUser, email })).rejects.toThrow('Invalid email format');
      }
    });

    test('should accept valid email formats', async () => {
      const validEmails = [
        'user@domain.com',
        'user.name@domain.com',
        'user+tag@domain.co.uk',
        'test123@example-domain.org'
      ];

      for (const email of validEmails) {
        const response = await register({ ...validUser, email, name: `User ${email}` });
        expect(response.user.email).toBe(email);
      }
    });

    test('should enforce minimum password length', async () => {
      const passwords = ['1', '12', '1234567']; // All under 8 characters

      for (const password of passwords) {
        await expect(register({ ...validUser, password })).rejects.toThrow('Password must be at least 8 characters');
      }
    });

    test('should accept valid passwords', async () => {
      const validPasswords = [
        'password123',
        'mySecureP@ssw0rd',
        'averylongpasswordthatisvalid'
      ];

      for (const password of validPasswords) {
        const response = await register({ 
          ...validUser, 
          email: `test-${password.length}@example.com`,
          password 
        });
        expect(response.token).toBe('mocked-jwt-token');
      }
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete registration and login flow', async () => {
      // Register user
      const registerResponse = await register(validUser);
      expect(registerResponse.user.email).toBe(validUser.email);

      // Login with same credentials
      mockBcrypt.compare.mockResolvedValueOnce(true as never);
      const loginResponse = await login(validUser);
      expect(loginResponse.user.email).toBe(validUser.email);
    });

    test('should maintain user data consistency between registration and login', async () => {
      const registerResponse = await register(validUser);
      
      mockBcrypt.compare.mockResolvedValueOnce(true as never);
      const loginResponse = await login(validUser);

      expect(registerResponse.user.email).toBe(loginResponse.user.email);
      expect(registerResponse.user.name).toBe(loginResponse.user.name);
      expect(registerResponse.user.role).toBe(loginResponse.user.role);
    });
  });
});