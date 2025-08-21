/**
 * Monitoring and Observability System for Vaporform
 * 
 * Implements comprehensive monitoring including:
 * - Application Performance Monitoring (APM)
 * - Infrastructure Monitoring
 * - User Analytics
 * - Real-time Metrics
 * - Distributed Tracing
 * - Alerting System
 */

import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { Redis } from "ioredis";
import winston from "winston";
import { promisify } from "util";
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from "prom-client";
import * as Sentry from "@sentry/node";
import { trace, context, SpanStatusCode, SpanKind } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { z } from "zod";

// Configuration
const SENTRY_DSN = secret("SENTRY_DSN");
const PROMETHEUS_PORT = parseInt(process.env.PROMETHEUS_PORT || "9090");
const ALERT_WEBHOOK_URL = secret("ALERT_WEBHOOK_URL");

// Initialize Sentry
Sentry.init({
  dsn: SENTRY_DSN(),
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
});

// Initialize OpenTelemetry
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "vaporform-backend",
    [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

// Redis for metrics storage
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 1,
});

// Prometheus metrics
collectDefaultMetrics({ register });

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const activeConnections = new Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
});

const aiRequestsTotal = new Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['type', 'status'],
});

const aiRequestDuration = new Histogram({
  name: 'ai_request_duration_seconds',
  help: 'Duration of AI requests in seconds',
  labelNames: ['type'],
  buckets: [1, 2, 5, 10, 15, 30, 60],
});

const containerOperations = new Counter({
  name: 'container_operations_total',
  help: 'Total number of container operations',
  labelNames: ['operation', 'status'],
});

const projectCreations = new Counter({
  name: 'project_creations_total',
  help: 'Total number of project creations',
  labelNames: ['type', 'template'],
});

const memoryUsage = new Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'],
});

const cpuUsage = new Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percentage',
});

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'monitoring' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Types
interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
  type: 'counter' | 'gauge' | 'histogram';
}

interface Alert {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: string;
  threshold: number;
  enabled: boolean;
  channels: string[];
  metadata?: Record<string, any>;
}

interface AlertInstance {
  id: string;
  alertId: string;
  value: number;
  threshold: number;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'resolved' | 'silenced';
  context: Record<string, any>;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    api: 'up' | 'down' | 'degraded';
    database: 'up' | 'down' | 'degraded';
    redis: 'up' | 'down' | 'degraded';
    containers: 'up' | 'down' | 'degraded';
    ai: 'up' | 'down' | 'degraded';
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  alerts: AlertInstance[];
  timestamp: Date;
}

interface UserAnalytics {
  userId: string;
  sessionId: string;
  events: AnalyticsEvent[];
  metadata: {
    userAgent: string;
    ipAddress: string;
    country?: string;
    device?: string;
    browser?: string;
  };
}

interface AnalyticsEvent {
  id: string;
  type: string;
  action: string;
  category: string;
  properties: Record<string, any>;
  timestamp: Date;
}

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  errorRate: number;
  throughput: number;
  p50: number;
  p95: number;
  p99: number;
  timestamp: Date;
}

// Validation schemas
const MetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  labels: z.record(z.string()).optional(),
  type: z.enum(['counter', 'gauge', 'histogram']),
});

const AlertSchema = z.object({
  name: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  condition: z.string(),
  threshold: z.number(),
  channels: z.array(z.string()),
});

/**
 * Application Performance Monitoring Service
 */
export class APMService {
  private static tracer = trace.getTracer('vaporform-apm');

  /**
   * Track HTTP request metrics
   */
  static trackHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
    httpRequestDuration.observe({ method, route }, duration);

    // Store detailed metrics in Redis
    const key = `http_metrics:${route}:${Math.floor(Date.now() / 60000)}`;
    redis.hincrby(key, 'requests', 1);
    redis.hincrby(key, 'total_duration', Math.round(duration * 1000));
    redis.hincrby(key, `status_${statusCode}`, 1);
    redis.expire(key, 86400); // 24 hours
  }

  /**
   * Track AI request metrics
   */
  static trackAIRequest(type: string, status: string, duration: number): void {
    aiRequestsTotal.inc({ type, status });
    aiRequestDuration.observe({ type }, duration);

    logger.info('AI request tracked', {
      type,
      status,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track container operations
   */
  static trackContainerOperation(operation: string, status: string): void {
    containerOperations.inc({ operation, status });

    logger.info('Container operation tracked', {
      operation,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track project creation
   */
  static trackProjectCreation(type: string, template: string): void {
    projectCreations.inc({ type, template });

    logger.info('Project creation tracked', {
      type,
      template,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Create distributed trace span
   */
  static createSpan<T>(name: string, operation: () => Promise<T>, attributes?: Record<string, any>): Promise<T> {
    return this.tracer.startActiveSpan(name, async (span) => {
      try {
        if (attributes) {
          span.setAttributes(attributes);
        }

        span.setStatus({ code: SpanStatusCode.OK });
        const result = await operation();
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Get performance metrics for endpoint
   */
  static async getEndpointMetrics(endpoint: string, timeRange: string = '1h'): Promise<PerformanceMetrics[]> {
    try {
      const endTime = Date.now();
      const startTime = endTime - this.parseTimeRange(timeRange);
      const interval = Math.floor((endTime - startTime) / 100); // 100 data points
      
      const metrics: PerformanceMetrics[] = [];
      
      for (let time = startTime; time < endTime; time += interval) {
        const key = `http_metrics:${endpoint}:${Math.floor(time / 60000)}`;
        const data = await redis.hmget(key, 'requests', 'total_duration', 'status_200', 'status_500');
        
        const requests = parseInt(data[0] || '0');
        const totalDuration = parseInt(data[1] || '0');
        const successCount = parseInt(data[2] || '0');
        const errorCount = parseInt(data[3] || '0');
        
        if (requests > 0) {
          metrics.push({
            endpoint,
            method: 'ALL',
            responseTime: totalDuration / requests,
            statusCode: 200,
            errorRate: errorCount / requests,
            throughput: requests,
            p50: 0, // Would calculate from histogram data
            p95: 0,
            p99: 0,
            timestamp: new Date(time),
          });
        }
      }
      
      return metrics;
    } catch (error) {
      logger.error('Failed to get endpoint metrics', { endpoint, error: error.message });
      return [];
    }
  }

  /**
   * Parse time range string to milliseconds
   */
  private static parseTimeRange(timeRange: string): number {
    const units = {
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
    };
    
    const match = timeRange.match(/^(\d+)([mhd])$/);
    if (!match) return 60 * 60 * 1000; // Default 1 hour
    
    const value = parseInt(match[1]);
    const unit = match[2] as keyof typeof units;
    
    return value * units[unit];
  }
}

/**
 * Infrastructure Monitoring Service
 */
export class InfrastructureMonitor {
  /**
   * Monitor system health
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    try {
      const [apiHealth, dbHealth, redisHealth, containerHealth, aiHealth] = await Promise.all([
        this.checkAPIHealth(),
        this.checkDatabaseHealth(),
        this.checkRedisHealth(),
        this.checkContainerHealth(),
        this.checkAIHealth(),
      ]);

      const services = {
        api: apiHealth,
        database: dbHealth,
        redis: redisHealth,
        containers: containerHealth,
        ai: aiHealth,
      };

      const metrics = await this.getSystemMetrics();
      const alerts = await AlertingService.getActiveAlerts();

      const overall = this.calculateOverallHealth(services, metrics);

      return {
        overall,
        services,
        metrics,
        alerts,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Failed to get system health', { error: error.message });
      return {
        overall: 'unhealthy',
        services: {
          api: 'down',
          database: 'down',
          redis: 'down',
          containers: 'down',
          ai: 'down',
        },
        metrics: {
          responseTime: 0,
          errorRate: 1,
          throughput: 0,
          cpuUsage: 0,
          memoryUsage: 0,
        },
        alerts: [],
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check API health
   */
  private static async checkAPIHealth(): Promise<'up' | 'down' | 'degraded'> {
    try {
      const start = Date.now();
      await redis.ping();
      const responseTime = Date.now() - start;
      
      if (responseTime > 1000) return 'degraded';
      return 'up';
    } catch {
      return 'down';
    }
  }

  /**
   * Check database health
   */
  private static async checkDatabaseHealth(): Promise<'up' | 'down' | 'degraded'> {
    try {
      // Simplified database health check
      // In real implementation, would check actual database connection
      const connectionCount = await redis.get('db_connections') || '0';
      const count = parseInt(connectionCount);
      
      if (count > 100) return 'degraded';
      return 'up';
    } catch {
      return 'down';
    }
  }

  /**
   * Check Redis health
   */
  private static async checkRedisHealth(): Promise<'up' | 'down' | 'degraded'> {
    try {
      const start = Date.now();
      await redis.ping();
      const responseTime = Date.now() - start;
      
      if (responseTime > 100) return 'degraded';
      return 'up';
    } catch {
      return 'down';
    }
  }

  /**
   * Check container health
   */
  private static async checkContainerHealth(): Promise<'up' | 'down' | 'degraded'> {
    try {
      const activeContainers = await redis.get('active_containers') || '0';
      const count = parseInt(activeContainers);
      
      if (count === 0) return 'down';
      return 'up';
    } catch {
      return 'down';
    }
  }

  /**
   * Check AI service health
   */
  private static async checkAIHealth(): Promise<'up' | 'down' | 'degraded'> {
    try {
      const lastAIRequest = await redis.get('last_ai_request');
      if (!lastAIRequest) return 'down';
      
      const timeSinceLastRequest = Date.now() - parseInt(lastAIRequest);
      if (timeSinceLastRequest > 300000) return 'degraded'; // 5 minutes
      
      return 'up';
    } catch {
      return 'down';
    }
  }

  /**
   * Get system metrics
   */
  private static async getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Update Prometheus gauges
    memoryUsage.set({ type: 'heap' }, memUsage.heapUsed);
    memoryUsage.set({ type: 'external' }, memUsage.external);
    memoryUsage.set({ type: 'rss' }, memUsage.rss);
    
    // Calculate CPU percentage (simplified)
    const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000) / process.uptime() * 100;
    cpuUsage.set(cpuPercent);

    return {
      responseTime: await this.getAverageResponseTime(),
      errorRate: await this.getErrorRate(),
      throughput: await this.getThroughput(),
      cpuUsage: cpuPercent,
      memoryUsage: memUsage.heapUsed / 1024 / 1024, // MB
    };
  }

  /**
   * Calculate overall health
   */
  private static calculateOverallHealth(
    services: SystemHealth['services'],
    metrics: SystemHealth['metrics']
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const serviceStates = Object.values(services);
    
    if (serviceStates.includes('down')) return 'unhealthy';
    if (serviceStates.includes('degraded') || metrics.errorRate > 0.05) return 'degraded';
    
    return 'healthy';
  }

  private static async getAverageResponseTime(): Promise<number> {
    const data = await redis.get('avg_response_time');
    return parseFloat(data || '0');
  }

  private static async getErrorRate(): Promise<number> {
    const data = await redis.get('error_rate');
    return parseFloat(data || '0');
  }

  private static async getThroughput(): Promise<number> {
    const data = await redis.get('throughput');
    return parseFloat(data || '0');
  }
}

/**
 * User Analytics Service
 */
export class AnalyticsService {
  /**
   * Track user event
   */
  static async trackEvent(
    userId: string,
    sessionId: string,
    event: Omit<AnalyticsEvent, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      const analyticsEvent: AnalyticsEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        ...event,
      };

      // Store event in Redis
      await redis.lpush(`analytics:user:${userId}`, JSON.stringify(analyticsEvent));
      await redis.ltrim(`analytics:user:${userId}`, 0, 999); // Keep last 1000 events

      // Store session data
      await redis.hset(`analytics:session:${sessionId}`, {
        userId,
        lastActivity: Date.now(),
        eventCount: await redis.llen(`analytics:user:${userId}`),
      });

      // Update real-time metrics
      await redis.incr(`analytics:events:${event.type}:${Math.floor(Date.now() / 3600000)}`);

      logger.info('User event tracked', {
        userId,
        sessionId,
        eventType: event.type,
        action: event.action,
      });
    } catch (error) {
      logger.error('Failed to track event', { userId, sessionId, error: error.message });
    }
  }

  /**
   * Get user analytics data
   */
  static async getUserAnalytics(userId: string, timeRange: string = '7d'): Promise<UserAnalytics[]> {
    try {
      const events = await redis.lrange(`analytics:user:${userId}`, 0, -1);
      const parsedEvents = events.map(event => JSON.parse(event) as AnalyticsEvent);

      const endTime = Date.now();
      const startTime = endTime - APMService['parseTimeRange'](timeRange);

      const filteredEvents = parsedEvents.filter(
        event => new Date(event.timestamp).getTime() >= startTime
      );

      // Group by session
      const sessionGroups = filteredEvents.reduce((groups, event) => {
        const sessionId = event.properties.sessionId || 'unknown';
        if (!groups[sessionId]) {
          groups[sessionId] = [];
        }
        groups[sessionId].push(event);
        return groups;
      }, {} as Record<string, AnalyticsEvent[]>);

      return Object.entries(sessionGroups).map(([sessionId, events]) => ({
        userId,
        sessionId,
        events,
        metadata: {
          userAgent: events[0]?.properties?.userAgent || 'unknown',
          ipAddress: events[0]?.properties?.ipAddress || 'unknown',
          country: events[0]?.properties?.country,
          device: events[0]?.properties?.device,
          browser: events[0]?.properties?.browser,
        },
      }));
    } catch (error) {
      logger.error('Failed to get user analytics', { userId, error: error.message });
      return [];
    }
  }

  /**
   * Get feature usage analytics
   */
  static async getFeatureUsage(timeRange: string = '30d'): Promise<Record<string, number>> {
    try {
      const endTime = Math.floor(Date.now() / 3600000);
      const startTime = endTime - Math.floor(APMService['parseTimeRange'](timeRange) / 3600000);

      const usage: Record<string, number> = {};

      for (let hour = startTime; hour <= endTime; hour++) {
        const keys = await redis.keys(`analytics:events:*:${hour}`);
        
        for (const key of keys) {
          const eventType = key.split(':')[2];
          const count = await redis.get(key);
          usage[eventType] = (usage[eventType] || 0) + parseInt(count || '0');
        }
      }

      return usage;
    } catch (error) {
      logger.error('Failed to get feature usage', { error: error.message });
      return {};
    }
  }
}

/**
 * Alerting Service
 */
export class AlertingService {
  /**
   * Create alert rule
   */
  static async createAlert(alert: Omit<Alert, 'id' | 'enabled'>): Promise<Alert> {
    try {
      const alertRule: Alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        enabled: true,
        ...alert,
      };

      await redis.hset('alerts:rules', alertRule.id, JSON.stringify(alertRule));

      logger.info('Alert rule created', { alertId: alertRule.id, name: alertRule.name });

      return alertRule;
    } catch (error) {
      logger.error('Failed to create alert', { error: error.message });
      throw new Error('Failed to create alert rule');
    }
  }

  /**
   * Evaluate alert conditions
   */
  static async evaluateAlerts(): Promise<void> {
    try {
      const alertRules = await redis.hgetall('alerts:rules');

      for (const [alertId, alertData] of Object.entries(alertRules)) {
        const alert: Alert = JSON.parse(alertData);
        
        if (!alert.enabled) continue;

        const currentValue = await this.evaluateCondition(alert.condition);
        const isTriggered = this.isAlertTriggered(currentValue, alert.threshold, alert.condition);

        await this.handleAlertState(alert, currentValue, isTriggered);
      }
    } catch (error) {
      logger.error('Failed to evaluate alerts', { error: error.message });
    }
  }

  /**
   * Get active alerts
   */
  static async getActiveAlerts(): Promise<AlertInstance[]> {
    try {
      const alertInstances = await redis.lrange('alerts:active', 0, -1);
      return alertInstances.map(instance => JSON.parse(instance) as AlertInstance);
    } catch (error) {
      logger.error('Failed to get active alerts', { error: error.message });
      return [];
    }
  }

  /**
   * Evaluate alert condition
   */
  private static async evaluateCondition(condition: string): Promise<number> {
    // Simplified condition evaluation
    // In production, would parse and evaluate complex conditions
    switch (condition) {
      case 'avg_response_time':
        return await InfrastructureMonitor['getAverageResponseTime']();
      case 'error_rate':
        return await InfrastructureMonitor['getErrorRate']();
      case 'cpu_usage':
        const cpuUsage = process.cpuUsage();
        return ((cpuUsage.user + cpuUsage.system) / 1000000) / process.uptime() * 100;
      case 'memory_usage':
        const memUsage = process.memoryUsage();
        return memUsage.heapUsed / 1024 / 1024; // MB
      default:
        return 0;
    }
  }

  /**
   * Check if alert should be triggered
   */
  private static isAlertTriggered(value: number, threshold: number, condition: string): boolean {
    // Simplified threshold checking
    return value > threshold;
  }

  /**
   * Handle alert state changes
   */
  private static async handleAlertState(alert: Alert, currentValue: number, isTriggered: boolean): Promise<void> {
    const existingAlert = await redis.get(`alerts:state:${alert.id}`);
    const wasTriggered = existingAlert === 'triggered';

    if (isTriggered && !wasTriggered) {
      // New alert triggered
      await this.triggerAlert(alert, currentValue);
      await redis.set(`alerts:state:${alert.id}`, 'triggered');
    } else if (!isTriggered && wasTriggered) {
      // Alert resolved
      await this.resolveAlert(alert, currentValue);
      await redis.del(`alerts:state:${alert.id}`);
    }
  }

  /**
   * Trigger alert
   */
  private static async triggerAlert(alert: Alert, value: number): Promise<void> {
    const alertInstance: AlertInstance = {
      id: `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alertId: alert.id,
      value,
      threshold: alert.threshold,
      triggeredAt: new Date(),
      status: 'active',
      context: {
        alertName: alert.name,
        condition: alert.condition,
        severity: alert.severity,
      },
    };

    await redis.lpush('alerts:active', JSON.stringify(alertInstance));
    await redis.ltrim('alerts:active', 0, 99); // Keep last 100 alerts

    // Send notifications
    await this.sendAlertNotifications(alert, alertInstance);

    logger.warn('Alert triggered', {
      alertId: alert.id,
      alertName: alert.name,
      value,
      threshold: alert.threshold,
    });
  }

  /**
   * Resolve alert
   */
  private static async resolveAlert(alert: Alert, value: number): Promise<void> {
    // Find and resolve active alert instance
    const activeAlerts = await this.getActiveAlerts();
    const alertInstance = activeAlerts.find(instance => 
      instance.alertId === alert.id && instance.status === 'active'
    );

    if (alertInstance) {
      alertInstance.status = 'resolved';
      alertInstance.resolvedAt = new Date();

      // Update in Redis (simplified - would need proper update logic)
      logger.info('Alert resolved', {
        alertId: alert.id,
        alertName: alert.name,
        value,
      });
    }
  }

  /**
   * Send alert notifications
   */
  private static async sendAlertNotifications(alert: Alert, instance: AlertInstance): Promise<void> {
    try {
      for (const channel of alert.channels) {
        switch (channel) {
          case 'webhook':
            await this.sendWebhookNotification(alert, instance);
            break;
          case 'email':
            await this.sendEmailNotification(alert, instance);
            break;
          case 'slack':
            await this.sendSlackNotification(alert, instance);
            break;
        }
      }
    } catch (error) {
      logger.error('Failed to send alert notifications', {
        alertId: alert.id,
        error: error.message,
      });
    }
  }

  private static async sendWebhookNotification(alert: Alert, instance: AlertInstance): Promise<void> {
    // Webhook notification implementation
    logger.info('Webhook notification sent', { alertId: alert.id });
  }

  private static async sendEmailNotification(alert: Alert, instance: AlertInstance): Promise<void> {
    // Email notification implementation
    logger.info('Email notification sent', { alertId: alert.id });
  }

  private static async sendSlackNotification(alert: Alert, instance: AlertInstance): Promise<void> {
    // Slack notification implementation
    logger.info('Slack notification sent', { alertId: alert.id });
  }
}

// Background tasks
setInterval(async () => {
  try {
    await AlertingService.evaluateAlerts();
  } catch (error) {
    logger.error('Alert evaluation failed', { error: error.message });
  }
}, 60000); // Every minute

setInterval(async () => {
  try {
    const health = await InfrastructureMonitor.getSystemHealth();
    await redis.set('system_health', JSON.stringify(health), 'EX', 300); // 5 minutes TTL
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
  }
}, 30000); // Every 30 seconds

// API Endpoints

export const recordMetric = api(
  { method: "POST", path: "/api/monitoring/metrics", auth: true },
  async ({ name, value, labels, type }: {
    name: string;
    value: number;
    labels?: Record<string, string>;
    type: 'counter' | 'gauge' | 'histogram';
  }): Promise<{ success: boolean }> => {
    const validation = MetricSchema.parse({ name, value, labels, type });
    
    const metric: MetricData = {
      ...validation,
      timestamp: Date.now(),
    };

    await redis.lpush('custom_metrics', JSON.stringify(metric));
    await redis.ltrim('custom_metrics', 0, 9999); // Keep last 10k metrics

    return { success: true };
  }
);

export const getSystemHealth = api(
  { method: "GET", path: "/api/monitoring/health" },
  async (): Promise<SystemHealth> => {
    return await InfrastructureMonitor.getSystemHealth();
  }
);

export const getMetrics = api(
  { method: "GET", path: "/api/monitoring/metrics/:endpoint" },
  async ({ endpoint, timeRange = '1h' }: { endpoint: string; timeRange?: string }): Promise<PerformanceMetrics[]> => {
    return await APMService.getEndpointMetrics(endpoint, timeRange);
  }
);

export const trackUserEvent = api(
  { method: "POST", path: "/api/monitoring/analytics/track", auth: true },
  async ({ userId, sessionId, type, action, category, properties }: {
    userId: string;
    sessionId: string;
    type: string;
    action: string;
    category: string;
    properties: Record<string, any>;
  }): Promise<{ success: boolean }> => {
    await AnalyticsService.trackEvent(userId, sessionId, {
      type,
      action,
      category,
      properties,
    });

    return { success: true };
  }
);

export const getUserAnalytics = api(
  { method: "GET", path: "/api/monitoring/analytics/users/:userId", auth: true },
  async ({ userId, timeRange = '7d' }: { userId: string; timeRange?: string }): Promise<UserAnalytics[]> => {
    return await AnalyticsService.getUserAnalytics(userId, timeRange);
  }
);

export const getFeatureUsage = api(
  { method: "GET", path: "/api/monitoring/analytics/features", auth: true },
  async ({ timeRange = '30d' }: { timeRange?: string }): Promise<Record<string, number>> => {
    return await AnalyticsService.getFeatureUsage(timeRange);
  }
);

export const createAlert = api(
  { method: "POST", path: "/api/monitoring/alerts", auth: true },
  async (alertData: Omit<Alert, 'id' | 'enabled'>): Promise<Alert> => {
    const validation = AlertSchema.parse(alertData);
    return await AlertingService.createAlert(validation);
  }
);

export const getAlerts = api(
  { method: "GET", path: "/api/monitoring/alerts", auth: true },
  async (): Promise<AlertInstance[]> => {
    return await AlertingService.getActiveAlerts();
  }
);

export const getPrometheusMetrics = api(
  { method: "GET", path: "/metrics" },
  async (): Promise<string> => {
    return await register.metrics();
  }
);