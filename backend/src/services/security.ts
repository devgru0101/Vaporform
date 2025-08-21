/**
 * Advanced Security Framework for Vaporform
 * 
 * Implements enterprise-grade security features including:
 * - Multi-Factor Authentication (MFA)
 * - Role-Based Access Control (RBAC) 
 * - Threat Detection and Monitoring
 * - Security Audit Logging
 * - WebAuthn/FIDO2 Support
 */

import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import { AuthenticatorDevice } from "@simplewebauthn/typescript-types";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Redis } from "ioredis";
import winston from "winston";
import { z } from "zod";

// Configuration
const JWT_SECRET = secret("JWT_SECRET");
const ENCRYPTION_KEY = secret("ENCRYPTION_KEY");
const WEBAUTHN_RP_ID = secret("WEBAUTHN_RP_ID", "localhost");
const WEBAUTHN_RP_NAME = secret("WEBAUTHN_RP_NAME", "Vaporform");

// Redis for session and security data
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 1,
});

// Security logger
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'security' },
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' }),
    new winston.transports.Console()
  ]
});

// Types
interface User {
  id: string;
  email: string;
  passwordHash: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  mfaSecret?: string;
  backupCodes?: string[];
  authenticatorDevices?: AuthenticatorDevice[];
  securitySettings: {
    loginNotifications: boolean;
    sessionTimeout: number;
    allowedIPs?: string[];
    requireMFA: boolean;
  };
  auditLog: AuditLogEntry[];
}

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  outcome: 'success' | 'failure' | 'blocked';
  riskScore: number;
  metadata?: Record<string, any>;
}

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'mfa_challenge' | 'permission_check' | 'anomaly_detected' | 'threat_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details: Record<string, any>;
  resolved: boolean;
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
  inheritFrom?: string[];
}

// Validation schemas
const MFASetupSchema = z.object({
  userId: z.string().uuid(),
  method: z.enum(['totp', 'sms', 'email']),
});

const WebAuthnRegistrationSchema = z.object({
  userId: z.string().uuid(),
  deviceName: z.string().min(1).max(100),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  mfaCode: z.string().optional(),
  rememberDevice: z.boolean().default(false),
});

/**
 * Multi-Factor Authentication Service
 */
export class MFAService {
  /**
   * Generate TOTP secret and QR code for user
   */
  static async setupTOTP(userId: string, userEmail: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `Vaporform (${userEmail})`,
        issuer: 'Vaporform',
        length: 32,
      });

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );

      // Store encrypted secret and backup codes
      const encryptedSecret = this.encrypt(secret.base32);
      const encryptedBackupCodes = backupCodes.map(code => this.encrypt(code));

      await redis.hmset(`user:${userId}:mfa`, {
        secret: encryptedSecret,
        backupCodes: JSON.stringify(encryptedBackupCodes),
        enabled: 'false',
        setupTimestamp: Date.now(),
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Log security event
      await this.logSecurityEvent({
        type: 'mfa_challenge',
        severity: 'medium',
        userId,
        ipAddress: 'internal',
        userAgent: 'system',
        timestamp: new Date(),
        details: { action: 'mfa_setup_initiated' },
        resolved: false,
      });

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes,
      };
    } catch (error) {
      securityLogger.error('MFA setup failed', { userId, error: error.message });
      throw new Error('Failed to setup MFA');
    }
  }

  /**
   * Verify TOTP code and enable MFA
   */
  static async verifyAndEnableTOTP(userId: string, code: string): Promise<boolean> {
    try {
      const mfaData = await redis.hmget(`user:${userId}:mfa`, 'secret', 'enabled');
      
      if (!mfaData[0] || mfaData[1] === 'true') {
        throw new Error('Invalid MFA setup state');
      }

      const secret = this.decrypt(mfaData[0]);
      
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: code,
        window: 2, // Allow 2 time steps tolerance
      });

      if (verified) {
        await redis.hset(`user:${userId}:mfa`, 'enabled', 'true');
        
        await this.logSecurityEvent({
          type: 'mfa_challenge',
          severity: 'medium',
          userId,
          ipAddress: 'internal',
          userAgent: 'system',
          timestamp: new Date(),
          details: { action: 'mfa_enabled' },
          resolved: true,
        });

        return true;
      }

      return false;
    } catch (error) {
      securityLogger.error('MFA verification failed', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Verify TOTP code for login
   */
  static async verifyTOTP(userId: string, code: string): Promise<boolean> {
    try {
      const mfaData = await redis.hmget(`user:${userId}:mfa`, 'secret', 'enabled', 'backupCodes');
      
      if (!mfaData[0] || mfaData[1] !== 'true') {
        return false;
      }

      const secret = this.decrypt(mfaData[0]);
      
      // Check TOTP code
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: code,
        window: 2,
      });

      if (verified) {
        await this.logSecurityEvent({
          type: 'mfa_challenge',
          severity: 'low',
          userId,
          ipAddress: 'internal',
          userAgent: 'system',
          timestamp: new Date(),
          details: { action: 'mfa_verified', method: 'totp' },
          resolved: true,
        });
        return true;
      }

      // Check backup codes if TOTP fails
      if (mfaData[2]) {
        const backupCodes = JSON.parse(mfaData[2]).map(this.decrypt);
        const codeIndex = backupCodes.indexOf(code.toUpperCase());
        
        if (codeIndex !== -1) {
          // Remove used backup code
          backupCodes.splice(codeIndex, 1);
          const encryptedCodes = backupCodes.map(this.encrypt);
          await redis.hset(`user:${userId}:mfa`, 'backupCodes', JSON.stringify(encryptedCodes));
          
          await this.logSecurityEvent({
            type: 'mfa_challenge',
            severity: 'medium',
            userId,
            ipAddress: 'internal',
            userAgent: 'system',
            timestamp: new Date(),
            details: { action: 'mfa_verified', method: 'backup_code' },
            resolved: true,
          });
          
          return true;
        }
      }

      return false;
    } catch (error) {
      securityLogger.error('MFA verification failed', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Generate new backup codes
   */
  static async generateNewBackupCodes(userId: string): Promise<string[]> {
    try {
      const backupCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );

      const encryptedBackupCodes = backupCodes.map(code => this.encrypt(code));
      await redis.hset(`user:${userId}:mfa`, 'backupCodes', JSON.stringify(encryptedBackupCodes));

      await this.logSecurityEvent({
        type: 'mfa_challenge',
        severity: 'medium',
        userId,
        ipAddress: 'internal',
        userAgent: 'system',
        timestamp: new Date(),
        details: { action: 'backup_codes_regenerated' },
        resolved: true,
      });

      return backupCodes;
    } catch (error) {
      securityLogger.error('Backup codes generation failed', { userId, error: error.message });
      throw new Error('Failed to generate backup codes');
    }
  }

  /**
   * Encrypt sensitive data
   */
  private static encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, ENCRYPTION_KEY());
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private static decrypt(encryptedData: string): string {
    const algorithm = 'aes-256-gcm';
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher(algorithm, ENCRYPTION_KEY());
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Log security events
   */
  private static async logSecurityEvent(event: Omit<SecurityEvent, 'id'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: crypto.randomUUID(),
      ...event,
    };

    // Store in Redis for real-time monitoring
    await redis.lpush('security:events', JSON.stringify(securityEvent));
    await redis.ltrim('security:events', 0, 9999); // Keep last 10k events

    // Log to file
    securityLogger.info('Security event', securityEvent);
  }
}

/**
 * WebAuthn/FIDO2 Service for Hardware Security Keys
 */
export class WebAuthnService {
  /**
   * Generate registration options for new authenticator
   */
  static async generateRegistrationOptions(userId: string, userEmail: string): Promise<any> {
    try {
      const user = await this.getUser(userId);
      
      const options = await generateRegistrationOptions({
        rpName: WEBAUTHN_RP_NAME(),
        rpID: WEBAUTHN_RP_ID(),
        userID: userId,
        userName: userEmail,
        userDisplayName: user.email,
        attestationType: 'none',
        excludeCredentials: user.authenticatorDevices?.map(device => ({
          id: device.credentialID,
          type: 'public-key',
          transports: device.transports,
        })) || [],
        authenticatorSelection: {
          residentKey: 'discouraged',
        },
      });

      // Store challenge temporarily
      await redis.setex(`webauthn:challenge:${userId}`, 300, options.challenge);

      return options;
    } catch (error) {
      securityLogger.error('WebAuthn registration options generation failed', { userId, error: error.message });
      throw new Error('Failed to generate registration options');
    }
  }

  /**
   * Verify registration response and register device
   */
  static async verifyRegistration(userId: string, response: any, deviceName: string): Promise<boolean> {
    try {
      const expectedChallenge = await redis.get(`webauthn:challenge:${userId}`);
      
      if (!expectedChallenge) {
        throw new Error('Challenge not found or expired');
      }

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: `https://${WEBAUTHN_RP_ID()}`,
        expectedRPID: WEBAUTHN_RP_ID(),
      });

      if (verification.verified && verification.registrationInfo) {
        const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;
        
        const newDevice: AuthenticatorDevice = {
          credentialID,
          credentialPublicKey,
          counter,
          transports: response.response.transports || [],
        };

        // Store device
        const userDevices = await redis.get(`user:${userId}:webauthn_devices`) || '[]';
        const devices = JSON.parse(userDevices);
        devices.push({
          ...newDevice,
          name: deviceName,
          registeredAt: new Date().toISOString(),
        });

        await redis.set(`user:${userId}:webauthn_devices`, JSON.stringify(devices));

        // Clean up challenge
        await redis.del(`webauthn:challenge:${userId}`);

        await MFAService['logSecurityEvent']({
          type: 'mfa_challenge',
          severity: 'medium',
          userId,
          ipAddress: 'internal',
          userAgent: 'system',
          timestamp: new Date(),
          details: { action: 'webauthn_device_registered', deviceName },
          resolved: true,
        });

        return true;
      }

      return false;
    } catch (error) {
      securityLogger.error('WebAuthn registration verification failed', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Generate authentication options
   */
  static async generateAuthenticationOptions(userId: string): Promise<any> {
    try {
      const userDevices = await redis.get(`user:${userId}:webauthn_devices`) || '[]';
      const devices = JSON.parse(userDevices);

      const options = await generateAuthenticationOptions({
        rpID: WEBAUTHN_RP_ID(),
        allowCredentials: devices.map((device: any) => ({
          id: device.credentialID,
          type: 'public-key',
          transports: device.transports,
        })),
      });

      // Store challenge temporarily
      await redis.setex(`webauthn:auth_challenge:${userId}`, 300, options.challenge);

      return options;
    } catch (error) {
      securityLogger.error('WebAuthn authentication options generation failed', { userId, error: error.message });
      throw new Error('Failed to generate authentication options');
    }
  }

  /**
   * Verify authentication response
   */
  static async verifyAuthentication(userId: string, response: any): Promise<boolean> {
    try {
      const expectedChallenge = await redis.get(`webauthn:auth_challenge:${userId}`);
      
      if (!expectedChallenge) {
        throw new Error('Challenge not found or expired');
      }

      const userDevices = await redis.get(`user:${userId}:webauthn_devices`) || '[]';
      const devices = JSON.parse(userDevices);
      
      const device = devices.find((d: any) => 
        Buffer.from(d.credentialID).equals(Buffer.from(response.id, 'base64url'))
      );

      if (!device) {
        throw new Error('Authenticator not registered');
      }

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: `https://${WEBAUTHN_RP_ID()}`,
        expectedRPID: WEBAUTHN_RP_ID(),
        authenticator: device,
      });

      if (verification.verified) {
        // Update counter
        device.counter = verification.authenticationInfo.newCounter;
        await redis.set(`user:${userId}:webauthn_devices`, JSON.stringify(devices));

        // Clean up challenge
        await redis.del(`webauthn:auth_challenge:${userId}`);

        await MFAService['logSecurityEvent']({
          type: 'mfa_challenge',
          severity: 'low',
          userId,
          ipAddress: 'internal',
          userAgent: 'system',
          timestamp: new Date(),
          details: { action: 'webauthn_verified' },
          resolved: true,
        });

        return true;
      }

      return false;
    } catch (error) {
      securityLogger.error('WebAuthn authentication verification failed', { userId, error: error.message });
      return false;
    }
  }

  private static async getUser(userId: string): Promise<User> {
    // This would typically fetch from your user database
    // For now, return a mock user structure
    return {
      id: userId,
      email: 'user@example.com',
      passwordHash: '',
      roles: [],
      permissions: [],
      mfaEnabled: false,
      securitySettings: {
        loginNotifications: true,
        sessionTimeout: 3600,
        requireMFA: false,
      },
      auditLog: [],
    };
  }
}

/**
 * Role-Based Access Control (RBAC) Service
 */
export class RBACService {
  /**
   * Check if user has permission for resource and action
   */
  static async hasPermission(userId: string, resource: string, action: string, context?: Record<string, any>): Promise<boolean> {
    try {
      const userRoles = await this.getUserRoles(userId);
      const userPermissions = await this.getUserPermissions(userRoles);

      for (const permission of userPermissions) {
        if (permission.resource === resource && permission.action === action) {
          // Check conditions if present
          if (permission.conditions && context) {
            const conditionsMet = this.evaluateConditions(permission.conditions, context);
            if (!conditionsMet) continue;
          }

          await MFAService['logSecurityEvent']({
            type: 'permission_check',
            severity: 'low',
            userId,
            ipAddress: context?.ipAddress || 'internal',
            userAgent: context?.userAgent || 'system',
            timestamp: new Date(),
            details: { 
              resource, 
              action, 
              granted: true,
              permission: permission.id 
            },
            resolved: true,
          });

          return true;
        }
      }

      await MFAService['logSecurityEvent']({
        type: 'permission_check',
        severity: 'medium',
        userId,
        ipAddress: context?.ipAddress || 'internal',
        userAgent: context?.userAgent || 'system',
        timestamp: new Date(),
        details: { 
          resource, 
          action, 
          granted: false 
        },
        resolved: true,
      });

      return false;
    } catch (error) {
      securityLogger.error('Permission check failed', { userId, resource, action, error: error.message });
      return false;
    }
  }

  /**
   * Get user roles
   */
  private static async getUserRoles(userId: string): Promise<Role[]> {
    const roleIds = await redis.smembers(`user:${userId}:roles`);
    const roles: Role[] = [];

    for (const roleId of roleIds) {
      const roleData = await redis.get(`role:${roleId}`);
      if (roleData) {
        roles.push(JSON.parse(roleData));
      }
    }

    return roles;
  }

  /**
   * Get permissions for roles
   */
  private static async getUserPermissions(roles: Role[]): Promise<Permission[]> {
    const permissions: Permission[] = [];
    const permissionIds = new Set<string>();

    for (const role of roles) {
      for (const permissionId of role.permissions) {
        if (!permissionIds.has(permissionId)) {
          permissionIds.add(permissionId);
          const permissionData = await redis.get(`permission:${permissionId}`);
          if (permissionData) {
            permissions.push(JSON.parse(permissionData));
          }
        }
      }
    }

    return permissions;
  }

  /**
   * Evaluate permission conditions
   */
  private static evaluateConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
    // Simple condition evaluation - can be extended for complex rules
    for (const [key, expectedValue] of Object.entries(conditions)) {
      if (context[key] !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  /**
   * Create role
   */
  static async createRole(role: Role): Promise<void> {
    await redis.set(`role:${role.id}`, JSON.stringify(role));
  }

  /**
   * Create permission
   */
  static async createPermission(permission: Permission): Promise<void> {
    await redis.set(`permission:${permission.id}`, JSON.stringify(permission));
  }

  /**
   * Assign role to user
   */
  static async assignRole(userId: string, roleId: string): Promise<void> {
    await redis.sadd(`user:${userId}:roles`, roleId);
    
    await MFAService['logSecurityEvent']({
      type: 'permission_check',
      severity: 'medium',
      userId,
      ipAddress: 'internal',
      userAgent: 'system',
      timestamp: new Date(),
      details: { action: 'role_assigned', roleId },
      resolved: true,
    });
  }
}

/**
 * Threat Detection Service
 */
export class ThreatDetectionService {
  /**
   * Analyze login attempt for threats
   */
  static async analyzeLoginAttempt(email: string, ipAddress: string, userAgent: string): Promise<{
    riskScore: number;
    blocked: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    try {
      // Check for rate limiting
      const attempts = await redis.incr(`login_attempts:${ipAddress}`);
      if (attempts === 1) {
        await redis.expire(`login_attempts:${ipAddress}`, 900); // 15 minutes
      }

      if (attempts > 5) {
        riskScore += 50;
        reasons.push('Excessive login attempts from IP');
      }

      // Check for suspicious IP patterns
      const suspiciousIPs = await redis.sismember('suspicious_ips', ipAddress);
      if (suspiciousIPs) {
        riskScore += 70;
        reasons.push('IP address flagged as suspicious');
      }

      // Check for user agent anomalies
      const normalizedUA = this.normalizeUserAgent(userAgent);
      const commonUAs = await redis.zrange('common_user_agents', 0, 99);
      if (!commonUAs.includes(normalizedUA)) {
        riskScore += 20;
        reasons.push('Unusual user agent');
      }

      // Geolocation check (simplified)
      const recentLocations = await redis.lrange(`user_locations:${email}`, 0, 4);
      if (recentLocations.length > 0) {
        // In a real implementation, you'd check actual geolocation
        const currentLocation = await this.getLocationFromIP(ipAddress);
        const isNewLocation = !recentLocations.includes(currentLocation);
        
        if (isNewLocation) {
          riskScore += 30;
          reasons.push('Login from new location');
          await redis.lpush(`user_locations:${email}`, currentLocation);
          await redis.ltrim(`user_locations:${email}`, 0, 9);
        }
      }

      // Time-based analysis
      const currentHour = new Date().getHours();
      const userProfile = await redis.hgetall(`user_profile:${email}`);
      
      if (userProfile.typical_hours) {
        const typicalHours = JSON.parse(userProfile.typical_hours);
        if (!typicalHours.includes(currentHour)) {
          riskScore += 15;
          reasons.push('Login outside typical hours');
        }
      }

      const blocked = riskScore >= 80;

      // Log threat analysis
      await MFAService['logSecurityEvent']({
        type: riskScore >= 50 ? 'threat_detected' : 'login_attempt',
        severity: riskScore >= 80 ? 'critical' : riskScore >= 50 ? 'high' : 'low',
        ipAddress,
        userAgent,
        timestamp: new Date(),
        details: { 
          email, 
          riskScore, 
          reasons,
          blocked 
        },
        resolved: !blocked,
      });

      return { riskScore, blocked, reasons };
    } catch (error) {
      securityLogger.error('Threat analysis failed', { email, ipAddress, error: error.message });
      return { riskScore: 100, blocked: true, reasons: ['Analysis error'] };
    }
  }

  /**
   * Detect anomalous behavior patterns
   */
  static async detectAnomalies(userId: string, action: string, context: Record<string, any>): Promise<{
    isAnomalous: boolean;
    confidence: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let anomalyScore = 0;

    try {
      // Analyze frequency of action
      const actionCount = await redis.incr(`user_action:${userId}:${action}:${Math.floor(Date.now() / 3600000)}`);
      await redis.expire(`user_action:${userId}:${action}:${Math.floor(Date.now() / 3600000)}`, 3600);

      const historicalAvg = await this.getHistoricalAverage(userId, action);
      
      if (actionCount > historicalAvg * 3) {
        anomalyScore += 40;
        reasons.push('Unusual frequency of action');
      }

      // Analyze timing patterns
      const lastAction = await redis.get(`user_last_action:${userId}:${action}`);
      if (lastAction) {
        const timeDiff = Date.now() - parseInt(lastAction);
        if (timeDiff < 1000) { // Less than 1 second
          anomalyScore += 30;
          reasons.push('Rapid successive actions');
        }
      }
      await redis.set(`user_last_action:${userId}:${action}`, Date.now());

      // Resource access patterns
      if (context.resource) {
        const resourceAccess = await redis.incr(`user_resource:${userId}:${context.resource}:daily`);
        await redis.expire(`user_resource:${userId}:${context.resource}:daily`, 86400);
        
        if (resourceAccess > 100) { // Threshold for resource access
          anomalyScore += 25;
          reasons.push('Excessive resource access');
        }
      }

      const isAnomalous = anomalyScore >= 50;
      const confidence = Math.min(anomalyScore / 100, 1);

      if (isAnomalous) {
        await MFAService['logSecurityEvent']({
          type: 'anomaly_detected',
          severity: anomalyScore >= 70 ? 'high' : 'medium',
          userId,
          ipAddress: context.ipAddress || 'internal',
          userAgent: context.userAgent || 'system',
          timestamp: new Date(),
          details: { 
            action, 
            anomalyScore, 
            confidence,
            reasons 
          },
          resolved: false,
        });
      }

      return { isAnomalous, confidence, reasons };
    } catch (error) {
      securityLogger.error('Anomaly detection failed', { userId, action, error: error.message });
      return { isAnomalous: true, confidence: 1, reasons: ['Detection error'] };
    }
  }

  private static normalizeUserAgent(userAgent: string): string {
    // Simplified user agent normalization
    return userAgent.toLowerCase().replace(/\d+\.\d+\.\d+/g, 'X.X.X');
  }

  private static async getLocationFromIP(ipAddress: string): Promise<string> {
    // Simplified geolocation - in production, use a geolocation service
    return ipAddress.startsWith('192.168.') ? 'local' : 'external';
  }

  private static async getHistoricalAverage(userId: string, action: string): Promise<number> {
    // Simplified historical average calculation
    const keys = await redis.keys(`user_action:${userId}:${action}:*`);
    if (keys.length === 0) return 1;
    
    let total = 0;
    for (const key of keys) {
      const value = await redis.get(key);
      total += parseInt(value || '0');
    }
    
    return Math.max(1, Math.floor(total / keys.length));
  }
}

// API Endpoints

export const setupMFA = api(
  { method: "POST", path: "/api/security/mfa/setup", auth: true },
  async ({ userId, method }: { userId: string; method: 'totp' | 'sms' | 'email' }): Promise<{
    secret?: string;
    qrCodeUrl?: string;
    backupCodes?: string[];
  }> => {
    const validation = MFASetupSchema.parse({ userId, method });
    
    if (method === 'totp') {
      const userEmail = 'user@example.com'; // Get from user service
      return await MFAService.setupTOTP(userId, userEmail);
    }
    
    throw new Error('MFA method not supported');
  }
);

export const verifyMFA = api(
  { method: "POST", path: "/api/security/mfa/verify" },
  async ({ userId, code }: { userId: string; code: string }): Promise<{ success: boolean }> => {
    const success = await MFAService.verifyTOTP(userId, code);
    return { success };
  }
);

export const setupWebAuthn = api(
  { method: "POST", path: "/api/security/webauthn/register", auth: true },
  async ({ userId, deviceName }: { userId: string; deviceName: string }): Promise<any> => {
    const validation = WebAuthnRegistrationSchema.parse({ userId, deviceName });
    const userEmail = 'user@example.com'; // Get from user service
    return await WebAuthnService.generateRegistrationOptions(userId, userEmail);
  }
);

export const verifyWebAuthnRegistration = api(
  { method: "POST", path: "/api/security/webauthn/verify-registration", auth: true },
  async ({ userId, response, deviceName }: { userId: string; response: any; deviceName: string }): Promise<{ success: boolean }> => {
    const success = await WebAuthnService.verifyRegistration(userId, response, deviceName);
    return { success };
  }
);

export const checkPermission = api(
  { method: "POST", path: "/api/security/permissions/check", auth: true },
  async ({ userId, resource, action, context }: { 
    userId: string; 
    resource: string; 
    action: string; 
    context?: Record<string, any> 
  }): Promise<{ allowed: boolean }> => {
    const allowed = await RBACService.hasPermission(userId, resource, action, context);
    return { allowed };
  }
);

export const analyzeLoginRisk = api(
  { method: "POST", path: "/api/security/analyze-login" },
  async ({ email, ipAddress, userAgent }: { 
    email: string; 
    ipAddress: string; 
    userAgent: string 
  }): Promise<{ riskScore: number; blocked: boolean; reasons: string[] }> => {
    return await ThreatDetectionService.analyzeLoginAttempt(email, ipAddress, userAgent);
  }
);

export const getSecurityEvents = api(
  { method: "GET", path: "/api/security/events", auth: true },
  async ({ limit = 100 }: { limit?: number }): Promise<SecurityEvent[]> => {
    const events = await redis.lrange('security:events', 0, limit - 1);
    return events.map(event => JSON.parse(event));
  }
);