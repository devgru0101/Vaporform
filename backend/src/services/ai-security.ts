import { api } from 'encore.dev/api';
import log from 'encore.dev/log';
import { z } from 'zod';
import crypto from 'crypto';

// Security and Performance configurations
const AI_SECURITY_CONFIG = {
  maxTokensPerRequest: 8000,
  maxRequestsPerMinute: 60,
  maxRequestsPerHour: 1000,
  maxRequestsPerDay: 10000,
  maxCodeLength: 50000,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json'],
  blockedPatterns: [
    /password\s*=\s*['""][^'"]*['"]/gi,
    /api[_-]?key\s*=\s*['""][^'"]*['"]/gi,
    /secret\s*=\s*['""][^'"]*['"]/gi,
    /token\s*=\s*['""][^'"]*['"]/gi,
    /private[_-]?key/gi,
    /-----BEGIN.*PRIVATE.*KEY-----/gi,
  ],
  maxContextLength: 100000,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
};

// Rate limiting schemas
const RateLimitRequest = z.object({
  userId: z.string(),
  endpoint: z.string(),
  tokenCount: z.number().optional(),
});

const SecurityValidationRequest = z.object({
  content: z.string(),
  contentType: z.enum(['code', 'text', 'file', 'image']),
  fileName: z.string().optional(),
  userId: z.string(),
  sessionId: z.string().optional(),
});

const PerformanceMetricsRequest = z.object({
  endpoint: z.string(),
  responseTime: z.number(),
  tokenCount: z.number(),
  requestSize: z.number(),
  userId: z.string(),
});

const AIUsageAnalytics = z.object({
  userId: z.string(),
  timeframe: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  includeDetails: z.boolean().default(false),
});

// Response schemas
const SecurityValidationResponse = z.object({
  isValid: z.boolean(),
  risks: z.array(z.object({
    type: z.enum(['sensitive_data', 'malicious_code', 'large_payload', 'rate_limit', 'suspicious_pattern']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    message: z.string(),
    recommendation: z.string(),
  })),
  sanitizedContent: z.string().optional(),
  metadata: z.object({
    contentSize: z.number(),
    processingTime: z.number(),
    timestamp: z.string(),
  }),
});

const RateLimitResponse = z.object({
  allowed: z.boolean(),
  remaining: z.number(),
  resetTime: z.string(),
  limits: z.object({
    perMinute: z.number(),
    perHour: z.number(),
    perDay: z.number(),
  }),
  usage: z.object({
    currentMinute: z.number(),
    currentHour: z.number(),
    currentDay: z.number(),
  }),
});

const PerformanceMetrics = z.object({
  averageResponseTime: z.number(),
  totalRequests: z.number(),
  totalTokens: z.number(),
  errorRate: z.number(),
  cacheHitRate: z.number().optional(),
  resourceUtilization: z.object({
    cpu: z.number(),
    memory: z.number(),
    network: z.number(),
  }).optional(),
  recommendations: z.array(z.string()),
});

// In-memory stores for rate limiting and caching (in production, use Redis)
const rateLimitStore = new Map<string, any>();
const performanceCache = new Map<string, any>();
const userSessions = new Map<string, any>();

// Security validation endpoint
export const validateSecurity = api(
  { method: 'POST', path: '/ai/validate-security', auth: true, expose: true },
  async (req: z.infer<typeof SecurityValidationRequest>): Promise<z.infer<typeof SecurityValidationResponse>> => {
    // TODO: Fix auth data access when Encore.ts auth is properly configured
    const userID = 'placeholder-user-id';
    const { content, contentType, fileName, sessionId } = req;
    
    const startTime = Date.now();
    log.info('Security validation request', { 
      userID, 
      contentType,
      contentSize: content.length,
      fileName, 
    });
    
    try {
      const risks: any[] = [];
      let sanitizedContent = content;
      
      // Check content size
      if (content.length > AI_SECURITY_CONFIG.maxCodeLength) {
        risks.push({
          type: 'large_payload',
          severity: 'high',
          message: `Content exceeds maximum size limit (${AI_SECURITY_CONFIG.maxCodeLength} characters)`,
          recommendation: 'Reduce content size or split into smaller chunks',
        });
      }
      
      // Check for sensitive data patterns
      for (const pattern of AI_SECURITY_CONFIG.blockedPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          risks.push({
            type: 'sensitive_data',
            severity: 'critical',
            message: `Potential sensitive data detected: ${matches[0].substring(0, 20)}...`,
            recommendation: 'Remove or mask sensitive information before processing',
          });
          
          // Sanitize content by masking sensitive data
          sanitizedContent = sanitizedContent.replace(pattern, '[REDACTED]');
        }
      }
      
      // Check file type security
      if (fileName && contentType === 'file') {
        const fileExt = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        if (!AI_SECURITY_CONFIG.allowedFileTypes.includes(fileExt)) {
          risks.push({
            type: 'malicious_code',
            severity: 'high',
            message: `File type ${fileExt} is not allowed`,
            recommendation: 'Only upload supported file types for code analysis',
          });
        }
      }
      
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /eval\s*\(/gi,
        /exec\s*\(/gi,
        /system\s*\(/gi,
        /shell_exec/gi,
        /base64_decode/gi,
        /<script[^>]*>.*?<\/script>/gi,
        /javascript\s*:/gi,
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
          risks.push({
            type: 'suspicious_pattern',
            severity: 'medium',
            message: 'Potentially dangerous code pattern detected',
            recommendation: 'Review code for security implications',
          });
        }
      }
      
      // Session validation
      if (sessionId) {
        const session = userSessions.get(sessionId);
        if (!session || Date.now() - session.lastAccess > AI_SECURITY_CONFIG.sessionTimeout) {
          risks.push({
            type: 'rate_limit',
            severity: 'medium',
            message: 'Session expired or invalid',
            recommendation: 'Please start a new session',
          });
        } else {
          session.lastAccess = Date.now();
          userSessions.set(sessionId, session);
        }
      }
      
      const processingTime = Date.now() - startTime;
      const isValid = !risks.some(risk => risk.severity === 'critical');
      
      log.info('Security validation completed', { 
        userID, 
        isValid,
        risksCount: risks.length,
        processingTime, 
      });
      
      return {
        isValid,
        risks,
        sanitizedContent: isValid ? sanitizedContent : undefined,
        metadata: {
          contentSize: content.length,
          processingTime,
          timestamp: new Date().toISOString(),
        },
      };
      
    } catch (error) {
      const err = error as Error;
      log.error('Security validation failed', { error: err.message, userID });
      throw new Error('Failed to validate security');
    }
  },
);

// Rate limiting check endpoint
export const checkRateLimit = api(
  { method: 'POST', path: '/ai/check-rate-limit', auth: true, expose: true },
  async (req: z.infer<typeof RateLimitRequest>): Promise<z.infer<typeof RateLimitResponse>> => {
    // TODO: Fix auth data access when Encore.ts auth is properly configured  
    const userID = 'placeholder-user-id';
    const { endpoint, tokenCount = 1 } = req;
    
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const hour = Math.floor(now / 3600000);
    const day = Math.floor(now / 86400000);
    
    const key = `${userID}:${endpoint}`;
    
    // Get or create user limits
    const userLimits = rateLimitStore.get(key) || {
      minute: { count: 0, window: minute },
      hour: { count: 0, window: hour },
      day: { count: 0, window: day },
      tokens: { count: 0, window: day },
    };
    
    // Reset counters if window has passed
    if (userLimits.minute.window !== minute) {
      userLimits.minute = { count: 0, window: minute };
    }
    if (userLimits.hour.window !== hour) {
      userLimits.hour = { count: 0, window: hour };
    }
    if (userLimits.day.window !== day) {
      userLimits.day = { count: 0, window: day };
      userLimits.tokens = { count: 0, window: day };
    }
    
    // Check limits
    const allowed = 
      userLimits.minute.count < AI_SECURITY_CONFIG.maxRequestsPerMinute &&
      userLimits.hour.count < AI_SECURITY_CONFIG.maxRequestsPerHour &&
      userLimits.day.count < AI_SECURITY_CONFIG.maxRequestsPerDay &&
      userLimits.tokens.count + tokenCount <= AI_SECURITY_CONFIG.maxTokensPerRequest * 100; // Daily token limit
    
    if (allowed) {
      userLimits.minute.count++;
      userLimits.hour.count++;
      userLimits.day.count++;
      userLimits.tokens.count += tokenCount;
      rateLimitStore.set(key, userLimits);
    }
    
    const nextReset = new Date((minute + 1) * 60000);
    
    log.info('Rate limit check', { 
      userID, 
      endpoint,
      allowed,
      usage: {
        minute: userLimits.minute.count,
        hour: userLimits.hour.count,
        day: userLimits.day.count,
      },
    });
    
    return {
      allowed,
      remaining: AI_SECURITY_CONFIG.maxRequestsPerMinute - userLimits.minute.count,
      resetTime: nextReset.toISOString(),
      limits: {
        perMinute: AI_SECURITY_CONFIG.maxRequestsPerMinute,
        perHour: AI_SECURITY_CONFIG.maxRequestsPerHour,
        perDay: AI_SECURITY_CONFIG.maxRequestsPerDay,
      },
      usage: {
        currentMinute: userLimits.minute.count,
        currentHour: userLimits.hour.count,
        currentDay: userLimits.day.count,
      },
    };
  },
);

// Performance metrics collection endpoint
export const collectPerformanceMetrics = api(
  { method: 'POST', path: '/ai/performance-metrics', auth: true, expose: true },
  async (req: z.infer<typeof PerformanceMetricsRequest>): Promise<any> => {
    // TODO: Fix auth data access when Encore.ts auth is properly configured
    const userID = 'placeholder-user-id';
    const { endpoint, responseTime, tokenCount, requestSize } = req;
    
    const now = Date.now();
    const key = `metrics:${endpoint}`;
    
    // Get or create metrics
    const metrics = performanceCache.get(key) || {
      requests: [],
      totalRequests: 0,
      totalTokens: 0,
      totalResponseTime: 0,
      errors: 0,
      lastUpdated: now,
    };
    
    // Add new data point
    metrics.requests.push({
      timestamp: now,
      responseTime,
      tokenCount,
      requestSize,
      userId: userID,
    });
    
    metrics.totalRequests++;
    metrics.totalTokens += tokenCount;
    metrics.totalResponseTime += responseTime;
    metrics.lastUpdated = now;
    
    // Keep only last 1000 requests for performance
    if (metrics.requests.length > 1000) {
      metrics.requests = metrics.requests.slice(-1000);
    }
    
    performanceCache.set(key, metrics);
    
    log.info('Performance metrics collected', { 
      userID, 
      endpoint,
      responseTime,
      tokenCount,
      requestSize, 
    });
    
    return { success: true };
  },
);

// Performance analytics endpoint
export const getPerformanceAnalytics = api(
  { method: 'GET', path: '/ai/performance-analytics', auth: true, expose: true },
  async (): Promise<z.infer<typeof PerformanceMetrics>> => {
    // TODO: Fix auth data access when Encore.ts auth is properly configured
    const userID = 'placeholder-user-id';
    
    log.info('Performance analytics request', { userID });
    
    try {
      // Aggregate metrics from all endpoints
      let totalRequests = 0;
      let totalTokens = 0;
      let totalResponseTime = 0;
      let errors = 0;
      const responseTimeData: number[] = [];
      
      for (const [key, metrics] of performanceCache.entries()) {
        if (key.startsWith('metrics:')) {
          totalRequests += metrics.totalRequests;
          totalTokens += metrics.totalTokens;
          totalResponseTime += metrics.totalResponseTime;
          errors += metrics.errors || 0;
          
          metrics.requests.forEach((req: any) => {
            responseTimeData.push(req.responseTime);
          });
        }
      }
      
      const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
      const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;
      
      // Generate recommendations based on metrics
      const recommendations: string[] = [];
      
      if (averageResponseTime > 5000) {
        recommendations.push('Consider implementing response caching for better performance');
      }
      
      if (errorRate > 5) {
        recommendations.push('Error rate is high - investigate and improve error handling');
      }
      
      if (totalTokens > 1000000) {
        recommendations.push('High token usage detected - consider optimizing prompts');
      }
      
      // Calculate percentiles
      responseTimeData.sort((a, b) => a - b);
      const p95 = responseTimeData[Math.floor(responseTimeData.length * 0.95)] || 0;
      
      if (p95 > 10000) {
        recommendations.push('95th percentile response time is high - optimize slow endpoints');
      }
      
      log.info('Performance analytics completed', { 
        userID, 
        totalRequests,
        averageResponseTime,
        errorRate, 
      });
      
      return {
        averageResponseTime,
        totalRequests,
        totalTokens,
        errorRate,
        cacheHitRate: calculateCacheHitRate(),
        resourceUtilization: getResourceUtilization(),
        recommendations,
      };
      
    } catch (error) {
      const err = error as Error;
      log.error('Performance analytics failed', { error: err.message, userID });
      throw new Error('Failed to get performance analytics');
    }
  },
);

// AI usage analytics endpoint
export const getAIUsageAnalytics = api(
  { method: 'POST', path: '/ai/usage-analytics', auth: true, expose: true },
  async (req: z.infer<typeof AIUsageAnalytics>): Promise<any> => {
    // TODO: Fix auth data access when Encore.ts auth is properly configured
    const userID = 'placeholder-user-id';
    const { timeframe, includeDetails } = req;
    
    log.info('AI usage analytics request', { userID, timeframe, includeDetails });
    
    try {
      const now = Date.now();
      let startTime: number;
      
      switch (timeframe) {
        case 'hour':
          startTime = now - 3600000;
          break;
        case 'day':
          startTime = now - 86400000;
          break;
        case 'week':
          startTime = now - 604800000;
          break;
        case 'month':
          startTime = now - 2592000000;
          break;
        default:
          startTime = now - 86400000;
      }
      
      // Collect usage data for the user
      const userKey = `${userID}:usage`;
      const usage = rateLimitStore.get(userKey) || {
        requests: [],
        tokens: 0,
        features: new Map(),
        errors: 0,
      };
      
      // Filter data by timeframe
      const filteredRequests = usage.requests.filter((req: any) => req.timestamp >= startTime);
      
      // Calculate analytics
      const analytics = {
        summary: {
          totalRequests: filteredRequests.length,
          totalTokens: filteredRequests.reduce((sum: number, req: any) => sum + (req.tokens || 0), 0),
          successRate: filteredRequests.length > 0 ? 
            ((filteredRequests.length - usage.errors) / filteredRequests.length) * 100 : 100,
          averageTokensPerRequest: filteredRequests.length > 0 ? 
            filteredRequests.reduce((sum: number, req: any) => sum + (req.tokens || 0), 0) / filteredRequests.length : 0,
        },
        features: {
          codeGeneration: filteredRequests.filter((req: any) => req.endpoint?.includes('generate')).length,
          codeReview: filteredRequests.filter((req: any) => req.endpoint?.includes('review')).length,
          testing: filteredRequests.filter((req: any) => req.endpoint?.includes('test')).length,
          chat: filteredRequests.filter((req: any) => req.endpoint?.includes('chat')).length,
          analysis: filteredRequests.filter((req: any) => req.endpoint?.includes('analyz')).length,
        },
        timeAnalysis: generateTimeAnalysis(filteredRequests, timeframe),
        limits: {
          dailyTokenLimit: AI_SECURITY_CONFIG.maxTokensPerRequest * 100,
          dailyRequestLimit: AI_SECURITY_CONFIG.maxRequestsPerDay,
          hourlyRequestLimit: AI_SECURITY_CONFIG.maxRequestsPerHour,
          minuteRequestLimit: AI_SECURITY_CONFIG.maxRequestsPerMinute,
        },
        recommendations: generateUsageRecommendations(filteredRequests, usage),
        details: includeDetails ? filteredRequests.slice(-50) : undefined, // Last 50 requests if details requested
      };
      
      log.info('AI usage analytics completed', { 
        userID, 
        totalRequests: analytics.summary.totalRequests,
        totalTokens: analytics.summary.totalTokens, 
      });
      
      return analytics;
      
    } catch (error) {
      const err = error as Error;
      log.error('AI usage analytics failed', { error: err.message, userID });
      throw new Error('Failed to get AI usage analytics');
    }
  },
);

// Content sanitization function
export const sanitizeContent = (content: string, contentType: string): string => {
  let sanitized = content;
  
  // Remove or mask sensitive patterns
  for (const pattern of AI_SECURITY_CONFIG.blockedPatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  
  // Additional sanitization based on content type
  if (contentType === 'code') {
    // Remove potential eval statements
    sanitized = sanitized.replace(/\beval\s*\(/gi, 'EVAL_REMOVED(');
    
    // Remove system calls
    sanitized = sanitized.replace(/\bsystem\s*\(/gi, 'SYSTEM_REMOVED(');
  }
  
  return sanitized;
};

// Security audit logging
export const auditLog = (userID: string, action: string, details: any) => {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    userID,
    action,
    details,
    ip: 'unknown', // Would get from request in real implementation
    userAgent: 'unknown', // Would get from request in real implementation
  };
  
  // In production, this would be sent to a secure audit log system
  log.info('Security audit', auditEntry);
};

// Input validation middleware
export const validateInput = (input: any, schema: z.ZodSchema): boolean => {
  try {
    schema.parse(input);
    return true;
  } catch (error) {
    const err = error as Error;
    log.warn('Input validation failed', { error: err.message });
    return false;
  }
};

// Helper functions

function calculateCacheHitRate(): number {
  // Simulated cache hit rate calculation
  return Math.random() * 30 + 70; // 70-100% hit rate
}

function getResourceUtilization(): any {
  // Simulated resource utilization
  return {
    cpu: Math.random() * 50 + 30, // 30-80% CPU
    memory: Math.random() * 40 + 40, // 40-80% Memory
    network: Math.random() * 20 + 10, // 10-30% Network
  };
}

function generateTimeAnalysis(requests: any[], timeframe: string): any {
  const buckets = timeframe === 'hour' ? 12 : timeframe === 'day' ? 24 : 7; // 5min, 1hr, 1day buckets
  const bucketSize = timeframe === 'hour' ? 300000 : timeframe === 'day' ? 3600000 : 86400000;
  
  const now = Date.now();
  const analysis = Array(buckets).fill(0).map((_, i) => ({
    timestamp: now - (buckets - i) * bucketSize,
    requests: 0,
    tokens: 0,
  }));
  
  requests.forEach(req => {
    const bucketIndex = Math.floor((now - req.timestamp) / bucketSize);
    if (bucketIndex >= 0 && bucketIndex < buckets) {
      const bucket = analysis[buckets - 1 - bucketIndex];
      bucket.requests++;
      bucket.tokens += req.tokens || 0;
    }
  });
  
  return analysis;
}

function generateUsageRecommendations(requests: any[], usage: any): string[] {
  const recommendations: string[] = [];
  
  if (requests.length > 100) {
    recommendations.push('Consider using batch operations to reduce API calls');
  }
  
  const avgTokens = requests.length > 0 ? 
    requests.reduce((sum, req) => sum + (req.tokens || 0), 0) / requests.length : 0;
  
  if (avgTokens > 2000) {
    recommendations.push('Optimize prompts to reduce token usage per request');
  }
  
  const errorRate = usage.errors / requests.length;
  if (errorRate > 0.05) {
    recommendations.push('Improve error handling to reduce failed requests');
  }
  
  return recommendations;
}

// Token usage optimization
export const optimizeTokenUsage = (prompt: string, maxTokens: number): string => {
  if (prompt.length <= maxTokens * 4) { // Rough estimate: 1 token ≈ 4 characters
    return prompt;
  }
  
  // Truncate and add indication
  const truncated = prompt.substring(0, maxTokens * 4 - 100);
  return `${truncated  }\n\n[Content truncated to fit token limits]`;
};

// Context window management
export const manageContextWindow = (context: string[], maxLength: number): string[] => {
  let totalLength = 0;
  const managedContext: string[] = [];
  
  // Add context items from most recent to oldest until we hit the limit
  for (let i = context.length - 1; i >= 0; i--) {
    const item = context[i];
    if (totalLength + item.length <= maxLength) {
      managedContext.unshift(item);
      totalLength += item.length;
    } else {
      break;
    }
  }
  
  return managedContext;
};

// Security headers and CORS configuration
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Encryption utilities for sensitive data
export const encryptSensitiveData = (data: string, key: string): string => {
  const algorithm = 'aes-256-cbc';
  const cipher = crypto.createCipher(algorithm, key);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return encrypted;
};

export const decryptSensitiveData = (encryptedData: string, key: string): string => {
  const algorithm = 'aes-256-cbc';
  
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};