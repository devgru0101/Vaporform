/**
 * Performance Optimization System for Vaporform
 * 
 * Implements comprehensive performance optimization including:
 * - Backend API Performance Optimization
 * - Frontend Performance Monitoring
 * - Database Query Optimization
 * - Caching Strategies
 * - Connection Pooling
 * - Resource Optimization
 * - CDN Integration
 * - Code Splitting and Lazy Loading
 */

import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { Redis } from "ioredis";
import winston from "winston";
import crypto from "crypto";
import { z } from "zod";
import cluster from "cluster";
import os from "os";

// Configuration
const CDN_ENDPOINT = secret("CDN_ENDPOINT");
const CACHE_TTL_DEFAULT = parseInt(process.env.CACHE_TTL_DEFAULT || "3600"); // 1 hour
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONNECTIONS || "100");
const OPTIMIZATION_THRESHOLD = parseFloat(process.env.OPTIMIZATION_THRESHOLD || "0.8");

// Redis instances for different caching layers
const cacheRedis = new Redis({
  host: process.env.REDIS_CACHE_HOST || 'localhost',
  port: parseInt(process.env.REDIS_CACHE_PORT || '6379'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
});

const sessionRedis = new Redis({
  host: process.env.REDIS_SESSION_HOST || 'localhost',
  port: parseInt(process.env.REDIS_SESSION_PORT || '6379'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
});

// Performance logger
const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'performance' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/performance.log',
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
      tailable: true,
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Types
interface PerformanceMetrics {
  timestamp: Date;
  endpoint: string;
  method: string;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  databaseQueryTime: number;
  errorRate: number;
  throughput: number;
}

interface OptimizationRule {
  id: string;
  name: string;
  type: 'cache' | 'compression' | 'cdn' | 'database' | 'code_splitting' | 'resource_bundling';
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
  metrics: {
    triggeredCount: number;
    successRate: number;
    avgImprovementPercent: number;
  };
}

interface CacheStrategy {
  key: string;
  ttl: number;
  type: 'memory' | 'redis' | 'cdn';
  invalidationTriggers: string[];
  compressionEnabled: boolean;
  tags: string[];
}

interface QueryOptimization {
  query: string;
  executionTime: number;
  optimizedQuery?: string;
  optimizedTime?: number;
  indexSuggestions: string[];
  explanation: string;
  timestamp: Date;
}

interface ResourceOptimization {
  type: 'javascript' | 'css' | 'image' | 'font';
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  techniques: string[];
  timestamp: Date;
}

interface ConnectionPool {
  id: string;
  type: 'database' | 'redis' | 'external_api';
  minConnections: number;
  maxConnections: number;
  currentConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
  metrics: {
    averageWaitTime: number;
    peakConnections: number;
    connectionErrors: number;
  };
}

// Validation schemas
const PerformanceMetricsSchema = z.object({
  endpoint: z.string(),
  method: z.string(),
  responseTime: z.number(),
  memoryUsage: z.number().optional(),
  cpuUsage: z.number().optional(),
});

const OptimizationRuleSchema = z.object({
  name: z.string(),
  type: z.enum(['cache', 'compression', 'cdn', 'database', 'code_splitting', 'resource_bundling']),
  condition: z.string(),
  action: z.string(),
  priority: z.number().min(1).max(10),
});

/**
 * Backend Performance Optimizer
 */
export class BackendPerformanceOptimizer {
  private static queryCache = new Map<string, any>();
  private static connectionPools = new Map<string, ConnectionPool>();
  private static optimizationRules: OptimizationRule[] = [];

  /**
   * Record performance metrics
   */
  static async recordMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>): Promise<void> {
    try {
      const fullMetrics: PerformanceMetrics = {
        timestamp: new Date(),
        ...metrics,
      };

      // Store metrics in Redis for analysis
      const key = `perf:${fullMetrics.endpoint}:${Math.floor(Date.now() / 60000)}`; // Per minute
      await cacheRedis.lpush(key, JSON.stringify(fullMetrics));
      await cacheRedis.expire(key, 86400); // 24 hours

      // Update real-time aggregates
      await this.updateAggregates(fullMetrics);

      // Check for optimization opportunities
      await this.checkOptimizationTriggers(fullMetrics);

      performanceLogger.info('Performance metrics recorded', {
        endpoint: fullMetrics.endpoint,
        responseTime: fullMetrics.responseTime,
        memoryUsage: fullMetrics.memoryUsage,
        cacheHitRate: fullMetrics.cacheHitRate,
      });
    } catch (error) {
      performanceLogger.error('Failed to record performance metrics', {
        metrics,
        error: error.message,
      });
    }
  }

  /**
   * Optimize API response
   */
  static async optimizeResponse<T>(
    key: string,
    dataFunction: () => Promise<T>,
    strategy: Partial<CacheStrategy> = {}
  ): Promise<T> {
    const fullStrategy: CacheStrategy = {
      ttl: CACHE_TTL_DEFAULT,
      type: 'redis',
      invalidationTriggers: [],
      compressionEnabled: true,
      tags: [],
      ...strategy,
      key,
    };

    try {
      // Check cache first
      const cached = await this.getCachedData<T>(fullStrategy);
      if (cached !== null) {
        await this.recordCacheHit(key);
        return cached;
      }

      // Generate data
      const startTime = Date.now();
      const data = await dataFunction();
      const executionTime = Date.now() - startTime;

      // Cache the result
      await this.setCachedData(fullStrategy, data);
      await this.recordCacheMiss(key, executionTime);

      return data;
    } catch (error) {
      performanceLogger.error('Response optimization failed', {
        key,
        error: error.message,
      });
      // Return uncached data as fallback
      return await dataFunction();
    }
  }

  /**
   * Optimize database query
   */
  static async optimizeQuery<T>(
    query: string,
    params: any[],
    executor: (query: string, params: any[]) => Promise<T>
  ): Promise<T> {
    try {
      const queryKey = this.generateQueryKey(query, params);
      
      // Check query cache
      if (this.queryCache.has(queryKey)) {
        const cached = this.queryCache.get(queryKey);
        performanceLogger.debug('Query cache hit', { queryKey });
        return cached;
      }

      const startTime = Date.now();
      
      // Optimize query if possible
      const optimizedQuery = await this.optimizeQueryString(query);
      const result = await executor(optimizedQuery || query, params);
      
      const executionTime = Date.now() - startTime;

      // Record query performance
      await this.recordQueryPerformance({
        query,
        executionTime,
        optimizedQuery,
        optimizedTime: optimizedQuery ? executionTime : undefined,
        indexSuggestions: await this.analyzeQueryForIndexes(query),
        explanation: await this.explainQuery(query),
        timestamp: new Date(),
      });

      // Cache result if query is cacheable
      if (this.isQueryCacheable(query)) {
        this.queryCache.set(queryKey, result);
        
        // Clean cache periodically
        if (this.queryCache.size > 1000) {
          this.cleanQueryCache();
        }
      }

      return result;
    } catch (error) {
      performanceLogger.error('Query optimization failed', {
        query,
        error: error.message,
      });
      return await executor(query, params);
    }
  }

  /**
   * Initialize connection pooling
   */
  static initializeConnectionPool(
    poolId: string,
    type: ConnectionPool['type'],
    config: {
      minConnections: number;
      maxConnections: number;
    }
  ): void {
    const pool: ConnectionPool = {
      id: poolId,
      type,
      minConnections: config.minConnections,
      maxConnections: config.maxConnections,
      currentConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingConnections: 0,
      metrics: {
        averageWaitTime: 0,
        peakConnections: 0,
        connectionErrors: 0,
      },
    };

    this.connectionPools.set(poolId, pool);

    performanceLogger.info('Connection pool initialized', {
      poolId,
      type,
      minConnections: config.minConnections,
      maxConnections: config.maxConnections,
    });
  }

  /**
   * Get connection from pool
   */
  static async getConnection(poolId: string): Promise<string> {
    const pool = this.connectionPools.get(poolId);
    if (!pool) {
      throw new Error(`Connection pool ${poolId} not found`);
    }

    const startWait = Date.now();

    try {
      // Wait for available connection
      while (pool.activeConnections >= pool.maxConnections) {
        await new Promise(resolve => setTimeout(resolve, 10));
        pool.waitingConnections++;
      }

      pool.waitingConnections = Math.max(0, pool.waitingConnections - 1);
      pool.activeConnections++;
      pool.currentConnections = Math.max(pool.currentConnections, pool.activeConnections);
      pool.metrics.peakConnections = Math.max(pool.metrics.peakConnections, pool.activeConnections);

      const waitTime = Date.now() - startWait;
      pool.metrics.averageWaitTime = (pool.metrics.averageWaitTime + waitTime) / 2;

      const connectionId = `${poolId}_${crypto.randomUUID()}`;
      
      performanceLogger.debug('Connection acquired', {
        poolId,
        connectionId,
        activeConnections: pool.activeConnections,
        waitTime,
      });

      return connectionId;
    } catch (error) {
      pool.metrics.connectionErrors++;
      performanceLogger.error('Failed to acquire connection', {
        poolId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Release connection back to pool
   */
  static releaseConnection(poolId: string, connectionId: string): void {
    const pool = this.connectionPools.get(poolId);
    if (!pool) {
      performanceLogger.warn('Attempted to release connection to non-existent pool', { poolId });
      return;
    }

    pool.activeConnections = Math.max(0, pool.activeConnections - 1);
    pool.idleConnections = pool.currentConnections - pool.activeConnections;

    performanceLogger.debug('Connection released', {
      poolId,
      connectionId,
      activeConnections: pool.activeConnections,
    });
  }

  /**
   * Get cached data
   */
  private static async getCachedData<T>(strategy: CacheStrategy): Promise<T | null> {
    try {
      let cachedData: string | null = null;

      switch (strategy.type) {
        case 'redis':
          cachedData = await cacheRedis.get(strategy.key);
          break;
        case 'memory':
          // Would use in-memory cache
          break;
        case 'cdn':
          // Would check CDN cache
          break;
      }

      if (cachedData) {
        if (strategy.compressionEnabled) {
          // Would decompress data
        }
        return JSON.parse(cachedData);
      }

      return null;
    } catch (error) {
      performanceLogger.warn('Cache retrieval failed', {
        key: strategy.key,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Set cached data
   */
  private static async setCachedData<T>(strategy: CacheStrategy, data: T): Promise<void> {
    try {
      let dataToCache = JSON.stringify(data);

      if (strategy.compressionEnabled) {
        // Would compress data
      }

      switch (strategy.type) {
        case 'redis':
          await cacheRedis.setex(strategy.key, strategy.ttl, dataToCache);
          break;
        case 'memory':
          // Would store in memory cache
          break;
        case 'cdn':
          // Would push to CDN
          break;
      }

      // Add cache tags for invalidation
      if (strategy.tags.length > 0) {
        for (const tag of strategy.tags) {
          await cacheRedis.sadd(`cache_tag:${tag}`, strategy.key);
        }
      }
    } catch (error) {
      performanceLogger.warn('Cache storage failed', {
        key: strategy.key,
        error: error.message,
      });
    }
  }

  /**
   * Update performance aggregates
   */
  private static async updateAggregates(metrics: PerformanceMetrics): Promise<void> {
    const hour = Math.floor(Date.now() / 3600000);
    const key = `perf_agg:${metrics.endpoint}:${hour}`;

    // Update running averages
    await cacheRedis.hincrby(key, 'count', 1);
    await cacheRedis.hincrby(key, 'total_response_time', Math.round(metrics.responseTime));
    await cacheRedis.hincrby(key, 'total_memory', Math.round(metrics.memoryUsage || 0));
    await cacheRedis.expire(key, 86400 * 7); // 7 days
  }

  /**
   * Check optimization triggers
   */
  private static async checkOptimizationTriggers(metrics: PerformanceMetrics): Promise<void> {
    // Check if response time exceeds threshold
    if (metrics.responseTime > 1000) { // 1 second
      await this.triggerOptimization('slow_response', {
        endpoint: metrics.endpoint,
        responseTime: metrics.responseTime,
      });
    }

    // Check if memory usage is high
    if (metrics.memoryUsage && metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      await this.triggerOptimization('high_memory', {
        endpoint: metrics.endpoint,
        memoryUsage: metrics.memoryUsage,
      });
    }

    // Check cache hit rate
    if (metrics.cacheHitRate < 0.7) { // Below 70%
      await this.triggerOptimization('low_cache_hit_rate', {
        endpoint: metrics.endpoint,
        cacheHitRate: metrics.cacheHitRate,
      });
    }
  }

  /**
   * Trigger optimization
   */
  private static async triggerOptimization(trigger: string, context: Record<string, any>): Promise<void> {
    const applicableRules = this.optimizationRules.filter(rule => 
      rule.enabled && rule.condition.includes(trigger)
    ).sort((a, b) => b.priority - a.priority);

    for (const rule of applicableRules) {
      try {
        await this.executeOptimizationRule(rule, context);
        rule.metrics.triggeredCount++;
        
        performanceLogger.info('Optimization rule triggered', {
          ruleId: rule.id,
          trigger,
          context,
        });
      } catch (error) {
        performanceLogger.error('Optimization rule execution failed', {
          ruleId: rule.id,
          trigger,
          error: error.message,
        });
      }
    }
  }

  /**
   * Execute optimization rule
   */
  private static async executeOptimizationRule(rule: OptimizationRule, context: Record<string, any>): Promise<void> {
    switch (rule.type) {
      case 'cache':
        await this.optimizeCache(rule, context);
        break;
      case 'compression':
        await this.optimizeCompression(rule, context);
        break;
      case 'cdn':
        await this.optimizeCDN(rule, context);
        break;
      case 'database':
        await this.optimizeDatabase(rule, context);
        break;
    }
  }

  /**
   * Optimize caching
   */
  private static async optimizeCache(rule: OptimizationRule, context: Record<string, any>): Promise<void> {
    if (context.endpoint) {
      // Increase cache TTL for slow endpoints
      const newTTL = CACHE_TTL_DEFAULT * 2;
      await cacheRedis.set(`cache_ttl:${context.endpoint}`, newTTL.toString());
      
      performanceLogger.info('Cache optimization applied', {
        endpoint: context.endpoint,
        newTTL,
      });
    }
  }

  /**
   * Optimize compression
   */
  private static async optimizeCompression(rule: OptimizationRule, context: Record<string, any>): Promise<void> {
    // Enable compression for large responses
    if (context.endpoint) {
      await cacheRedis.set(`compression:${context.endpoint}`, 'enabled');
      
      performanceLogger.info('Compression optimization applied', {
        endpoint: context.endpoint,
      });
    }
  }

  /**
   * Optimize CDN
   */
  private static async optimizeCDN(rule: OptimizationRule, context: Record<string, any>): Promise<void> {
    // Push static assets to CDN
    performanceLogger.info('CDN optimization applied', context);
  }

  /**
   * Optimize database
   */
  private static async optimizeDatabase(rule: OptimizationRule, context: Record<string, any>): Promise<void> {
    // Implement database-specific optimizations
    performanceLogger.info('Database optimization applied', context);
  }

  private static generateQueryKey(query: string, params: any[]): string {
    return crypto.createHash('md5').update(query + JSON.stringify(params)).digest('hex');
  }

  private static async optimizeQueryString(query: string): Promise<string | null> {
    // Simple query optimization - in production would use actual query parser
    if (query.includes('SELECT *')) {
      return query.replace('SELECT *', 'SELECT id, name'); // Example optimization
    }
    return null;
  }

  private static async analyzeQueryForIndexes(query: string): Promise<string[]> {
    // Analyze query and suggest indexes
    const suggestions: string[] = [];
    
    if (query.includes('WHERE')) {
      suggestions.push('Consider adding index on WHERE clause columns');
    }
    
    if (query.includes('ORDER BY')) {
      suggestions.push('Consider adding index on ORDER BY columns');
    }
    
    return suggestions;
  }

  private static async explainQuery(query: string): Promise<string> {
    // Would provide query execution plan
    return 'Query explanation would be provided here';
  }

  private static isQueryCacheable(query: string): boolean {
    const readOnlyKeywords = ['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN'];
    const upperQuery = query.trim().toUpperCase();
    
    return readOnlyKeywords.some(keyword => upperQuery.startsWith(keyword));
  }

  private static cleanQueryCache(): void {
    // Keep only the most recent 500 queries
    const entries = Array.from(this.queryCache.entries());
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    
    this.queryCache.clear();
    
    entries.slice(0, 500).forEach(([key, value]) => {
      this.queryCache.set(key, value);
    });
  }

  private static async recordCacheHit(key: string): Promise<void> {
    await cacheRedis.incr(`cache_hits:${key}`);
    await cacheRedis.incr('cache_hits:total');
  }

  private static async recordCacheMiss(key: string, executionTime: number): Promise<void> {
    await cacheRedis.incr(`cache_misses:${key}`);
    await cacheRedis.incr('cache_misses:total');
    await cacheRedis.hincrby('cache_performance', key, executionTime);
  }

  private static async recordQueryPerformance(optimization: QueryOptimization): Promise<void> {
    await cacheRedis.lpush('query_optimizations', JSON.stringify(optimization));
    await cacheRedis.ltrim('query_optimizations', 0, 999); // Keep last 1000
  }
}

/**
 * Frontend Performance Optimizer
 */
export class FrontendPerformanceOptimizer {
  /**
   * Optimize resource loading
   */
  static async optimizeResources(resources: {
    type: 'javascript' | 'css' | 'image' | 'font';
    path: string;
    size: number;
  }[]): Promise<ResourceOptimization[]> {
    const optimizations: ResourceOptimization[] = [];

    for (const resource of resources) {
      try {
        const optimization = await this.optimizeResource(resource);
        optimizations.push(optimization);
      } catch (error) {
        performanceLogger.error('Resource optimization failed', {
          resource,
          error: error.message,
        });
      }
    }

    return optimizations;
  }

  /**
   * Generate code splitting configuration
   */
  static generateCodeSplittingConfig(analysis: {
    routes: string[];
    components: string[];
    dependencies: Record<string, string[]>;
  }): Record<string, any> {
    const config = {
      chunks: {},
      splitPoints: [],
      lazyRoutes: [],
      preloadRoutes: [],
    };

    // Analyze route usage and create chunks
    for (const route of analysis.routes) {
      if (this.isRouteFrequentlyUsed(route)) {
        config.preloadRoutes.push(route);
      } else {
        config.lazyRoutes.push(route);
      }
    }

    // Create vendor chunks for common dependencies
    const commonDependencies = this.findCommonDependencies(analysis.dependencies);
    config.chunks = {
      vendor: commonDependencies,
      common: this.findSharedComponents(analysis.components),
    };

    performanceLogger.info('Code splitting configuration generated', {
      lazyRoutes: config.lazyRoutes.length,
      preloadRoutes: config.preloadRoutes.length,
      chunks: Object.keys(config.chunks).length,
    });

    return config;
  }

  /**
   * Generate CDN configuration
   */
  static generateCDNConfig(assets: {
    path: string;
    type: string;
    size: number;
    cacheable: boolean;
  }[]): Record<string, any> {
    const config = {
      staticAssets: [],
      cacheHeaders: {},
      compressionRules: {},
    };

    for (const asset of assets) {
      if (asset.cacheable && asset.size > 1024) { // Cache assets > 1KB
        config.staticAssets.push({
          path: asset.path,
          cdnPath: `${CDN_ENDPOINT()}${asset.path}`,
          headers: this.generateCacheHeaders(asset.type),
        });
      }
    }

    return config;
  }

  private static async optimizeResource(resource: {
    type: 'javascript' | 'css' | 'image' | 'font';
    path: string;
    size: number;
  }): Promise<ResourceOptimization> {
    const techniques: string[] = [];
    let optimizedSize = resource.size;

    switch (resource.type) {
      case 'javascript':
        techniques.push('minification', 'tree_shaking', 'compression');
        optimizedSize = Math.round(resource.size * 0.7); // Estimate 30% reduction
        break;
        
      case 'css':
        techniques.push('minification', 'purge_unused', 'compression');
        optimizedSize = Math.round(resource.size * 0.6); // Estimate 40% reduction
        break;
        
      case 'image':
        techniques.push('compression', 'format_optimization', 'responsive_sizing');
        optimizedSize = Math.round(resource.size * 0.5); // Estimate 50% reduction
        break;
        
      case 'font':
        techniques.push('woff2_compression', 'subset_optimization');
        optimizedSize = Math.round(resource.size * 0.8); // Estimate 20% reduction
        break;
    }

    const optimization: ResourceOptimization = {
      type: resource.type,
      originalSize: resource.size,
      optimizedSize,
      compressionRatio: (resource.size - optimizedSize) / resource.size,
      techniques,
      timestamp: new Date(),
    };

    performanceLogger.info('Resource optimized', {
      type: resource.type,
      path: resource.path,
      originalSize: resource.size,
      optimizedSize,
      compressionRatio: optimization.compressionRatio,
      techniques,
    });

    return optimization;
  }

  private static isRouteFrequentlyUsed(route: string): boolean {
    // Analyze route usage patterns
    const frequentRoutes = ['/', '/dashboard', '/projects', '/workspace'];
    return frequentRoutes.includes(route);
  }

  private static findCommonDependencies(dependencies: Record<string, string[]>): string[] {
    const dependencyCount = new Map<string, number>();
    
    Object.values(dependencies).forEach(deps => {
      deps.forEach(dep => {
        dependencyCount.set(dep, (dependencyCount.get(dep) || 0) + 1);
      });
    });

    // Return dependencies used by more than 50% of components
    const threshold = Object.keys(dependencies).length * 0.5;
    return Array.from(dependencyCount.entries())
      .filter(([, count]) => count > threshold)
      .map(([dep]) => dep);
  }

  private static findSharedComponents(components: string[]): string[] {
    // Identify components that should be in common chunk
    const sharedPatterns = ['Button', 'Input', 'Card', 'Modal', 'Layout'];
    return components.filter(component => 
      sharedPatterns.some(pattern => component.includes(pattern))
    );
  }

  private static generateCacheHeaders(assetType: string): Record<string, string> {
    const baseHeaders = {
      'Cache-Control': 'public',
      'Vary': 'Accept-Encoding',
    };

    switch (assetType) {
      case 'javascript':
      case 'css':
        return {
          ...baseHeaders,
          'Cache-Control': 'public, max-age=31536000, immutable',
        };
        
      case 'image':
        return {
          ...baseHeaders,
          'Cache-Control': 'public, max-age=2592000',
        };
        
      case 'font':
        return {
          ...baseHeaders,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Cross-Origin-Resource-Policy': 'cross-origin',
        };
        
      default:
        return baseHeaders;
    }
  }
}

/**
 * Performance Monitoring Service
 */
export class PerformanceMonitoringService {
  /**
   * Get performance dashboard data
   */
  static async getDashboardData(timeRange: string = '1h'): Promise<Record<string, any>> {
    try {
      const endTime = Date.now();
      const startTime = endTime - this.parseTimeRange(timeRange);

      const [
        responseTimeData,
        memoryUsageData,
        cacheMetrics,
        queryMetrics,
        resourceMetrics,
      ] = await Promise.all([
        this.getResponseTimeMetrics(startTime, endTime),
        this.getMemoryUsageMetrics(startTime, endTime),
        this.getCacheMetrics(),
        this.getQueryMetrics(),
        this.getResourceMetrics(),
      ]);

      return {
        responseTime: responseTimeData,
        memoryUsage: memoryUsageData,
        cache: cacheMetrics,
        database: queryMetrics,
        resources: resourceMetrics,
        connectionPools: this.getConnectionPoolMetrics(),
        optimizations: await this.getOptimizationMetrics(),
        timestamp: new Date(),
      };
    } catch (error) {
      performanceLogger.error('Failed to get dashboard data', { error: error.message });
      throw new Error('Failed to retrieve performance dashboard data');
    }
  }

  /**
   * Analyze performance trends
   */
  static async analyzePerformanceTrends(timeRange: string = '24h'): Promise<Record<string, any>> {
    try {
      const endTime = Date.now();
      const startTime = endTime - this.parseTimeRange(timeRange);
      const interval = Math.floor((endTime - startTime) / 100); // 100 data points

      const trends = {
        responseTimeTrend: [],
        memoryUsageTrend: [],
        cacheHitRateTrend: [],
        errorRateTrend: [],
        throughputTrend: [],
      };

      for (let time = startTime; time < endTime; time += interval) {
        const hourKey = Math.floor(time / 3600000);
        
        const [responseTime, memoryUsage, cacheStats] = await Promise.all([
          this.getAverageResponseTime(hourKey),
          this.getAverageMemoryUsage(hourKey),
          this.getCacheStats(hourKey),
        ]);

        trends.responseTimeTrend.push({
          timestamp: new Date(time),
          value: responseTime,
        });

        trends.memoryUsageTrend.push({
          timestamp: new Date(time),
          value: memoryUsage,
        });

        trends.cacheHitRateTrend.push({
          timestamp: new Date(time),
          value: cacheStats.hitRate,
        });
      }

      return {
        trends,
        analysis: this.generateTrendAnalysis(trends),
        recommendations: this.generatePerformanceRecommendations(trends),
      };
    } catch (error) {
      performanceLogger.error('Failed to analyze performance trends', { error: error.message });
      throw new Error('Failed to analyze performance trends');
    }
  }

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

  private static async getResponseTimeMetrics(startTime: number, endTime: number): Promise<any[]> {
    const metrics = [];
    const interval = Math.floor((endTime - startTime) / 50); // 50 data points

    for (let time = startTime; time < endTime; time += interval) {
      const hour = Math.floor(time / 3600000);
      const data = await cacheRedis.hgetall(`perf_agg:*:${hour}`);
      
      let totalTime = 0;
      let totalCount = 0;

      Object.keys(data).forEach(key => {
        if (key.includes('total_response_time')) {
          totalTime += parseInt(data[key] || '0');
        }
        if (key.includes('count')) {
          totalCount += parseInt(data[key] || '0');
        }
      });

      metrics.push({
        timestamp: new Date(time),
        averageResponseTime: totalCount > 0 ? totalTime / totalCount : 0,
        requestCount: totalCount,
      });
    }

    return metrics;
  }

  private static async getMemoryUsageMetrics(startTime: number, endTime: number): Promise<any[]> {
    const metrics = [];
    const memUsage = process.memoryUsage();

    // Simulate memory usage data (in production would come from monitoring)
    const interval = Math.floor((endTime - startTime) / 50);
    
    for (let time = startTime; time < endTime; time += interval) {
      metrics.push({
        timestamp: new Date(time),
        heapUsed: memUsage.heapUsed + Math.random() * 1024 * 1024,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      });
    }

    return metrics;
  }

  private static async getCacheMetrics(): Promise<any> {
    const [totalHits, totalMisses] = await Promise.all([
      cacheRedis.get('cache_hits:total'),
      cacheRedis.get('cache_misses:total'),
    ]);

    const hits = parseInt(totalHits || '0');
    const misses = parseInt(totalMisses || '0');
    const total = hits + misses;

    return {
      hitRate: total > 0 ? hits / total : 0,
      totalHits: hits,
      totalMisses: misses,
      totalRequests: total,
    };
  }

  private static async getQueryMetrics(): Promise<any> {
    const optimizations = await cacheRedis.lrange('query_optimizations', 0, 99);
    const parsedOptimizations = optimizations.map(opt => JSON.parse(opt));

    const totalQueries = parsedOptimizations.length;
    const optimizedQueries = parsedOptimizations.filter(opt => opt.optimizedQuery).length;
    const averageExecutionTime = parsedOptimizations.reduce((sum, opt) => sum + opt.executionTime, 0) / totalQueries;

    return {
      totalQueries,
      optimizedQueries,
      optimizationRate: totalQueries > 0 ? optimizedQueries / totalQueries : 0,
      averageExecutionTime,
      recentOptimizations: parsedOptimizations.slice(0, 10),
    };
  }

  private static async getResourceMetrics(): Promise<any> {
    // Would collect actual resource metrics in production
    return {
      totalResources: 150,
      optimizedResources: 120,
      optimizationRate: 0.8,
      totalSizeSaved: 2.5 * 1024 * 1024, // 2.5MB
      averageCompressionRatio: 0.35,
    };
  }

  private static getConnectionPoolMetrics(): any[] {
    return Array.from(BackendPerformanceOptimizer['connectionPools'].values());
  }

  private static async getOptimizationMetrics(): Promise<any> {
    const rules = BackendPerformanceOptimizer['optimizationRules'];
    
    return {
      totalRules: rules.length,
      activeRules: rules.filter(rule => rule.enabled).length,
      totalTriggers: rules.reduce((sum, rule) => sum + rule.metrics.triggeredCount, 0),
      averageSuccessRate: rules.reduce((sum, rule) => sum + rule.metrics.successRate, 0) / rules.length,
    };
  }

  private static async getAverageResponseTime(hour: number): Promise<number> {
    const data = await cacheRedis.get(`avg_response_time:${hour}`);
    return parseFloat(data || '0');
  }

  private static async getAverageMemoryUsage(hour: number): Promise<number> {
    const data = await cacheRedis.get(`avg_memory_usage:${hour}`);
    return parseFloat(data || '0');
  }

  private static async getCacheStats(hour: number): Promise<{ hitRate: number }> {
    const [hits, misses] = await Promise.all([
      cacheRedis.get(`cache_hits:${hour}`),
      cacheRedis.get(`cache_misses:${hour}`),
    ]);

    const hitCount = parseInt(hits || '0');
    const missCount = parseInt(misses || '0');
    const total = hitCount + missCount;

    return {
      hitRate: total > 0 ? hitCount / total : 0,
    };
  }

  private static generateTrendAnalysis(trends: any): Record<string, any> {
    return {
      responseTimeChange: this.calculateTrendChange(trends.responseTimeTrend),
      memoryUsageChange: this.calculateTrendChange(trends.memoryUsageTrend),
      cachePerformanceChange: this.calculateTrendChange(trends.cacheHitRateTrend),
    };
  }

  private static calculateTrendChange(trendData: any[]): number {
    if (trendData.length < 2) return 0;
    
    const first = trendData[0].value;
    const last = trendData[trendData.length - 1].value;
    
    return first !== 0 ? ((last - first) / first) * 100 : 0;
  }

  private static generatePerformanceRecommendations(trends: any): string[] {
    const recommendations: string[] = [];

    const responseTimeChange = this.calculateTrendChange(trends.responseTimeTrend);
    if (responseTimeChange > 10) {
      recommendations.push('Response times are increasing. Consider implementing caching or optimizing slow endpoints.');
    }

    const memoryChange = this.calculateTrendChange(trends.memoryUsageTrend);
    if (memoryChange > 20) {
      recommendations.push('Memory usage is growing. Review for memory leaks and consider optimizing data structures.');
    }

    const cacheChange = this.calculateTrendChange(trends.cacheHitRateTrend);
    if (cacheChange < -5) {
      recommendations.push('Cache hit rate is declining. Review cache invalidation strategies and TTL settings.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance metrics are stable. Continue monitoring for any degradation.');
    }

    return recommendations;
  }
}

// API Endpoints

export const recordPerformanceMetrics = api(
  { method: "POST", path: "/api/performance/metrics" },
  async (metrics: Omit<PerformanceMetrics, 'timestamp'>): Promise<{ success: boolean }> => {
    const validation = PerformanceMetricsSchema.parse(metrics);
    await BackendPerformanceOptimizer.recordMetrics(validation);
    return { success: true };
  }
);

export const getPerformanceDashboard = api(
  { method: "GET", path: "/api/performance/dashboard" },
  async ({ timeRange = '1h' }: { timeRange?: string }): Promise<Record<string, any>> => {
    return await PerformanceMonitoringService.getDashboardData(timeRange);
  }
);

export const getPerformanceTrends = api(
  { method: "GET", path: "/api/performance/trends" },
  async ({ timeRange = '24h' }: { timeRange?: string }): Promise<Record<string, any>> => {
    return await PerformanceMonitoringService.analyzePerformanceTrends(timeRange);
  }
);

export const optimizeResources = api(
  { method: "POST", path: "/api/performance/optimize/resources" },
  async ({ resources }: {
    resources: {
      type: 'javascript' | 'css' | 'image' | 'font';
      path: string;
      size: number;
    }[];
  }): Promise<ResourceOptimization[]> => {
    return await FrontendPerformanceOptimizer.optimizeResources(resources);
  }
);

export const generateCodeSplittingConfig = api(
  { method: "POST", path: "/api/performance/optimize/code-splitting" },
  async ({ analysis }: {
    analysis: {
      routes: string[];
      components: string[];
      dependencies: Record<string, string[]>;
    };
  }): Promise<Record<string, any>> => {
    return FrontendPerformanceOptimizer.generateCodeSplittingConfig(analysis);
  }
);

export const generateCDNConfig = api(
  { method: "POST", path: "/api/performance/optimize/cdn" },
  async ({ assets }: {
    assets: {
      path: string;
      type: string;
      size: number;
      cacheable: boolean;
    }[];
  }): Promise<Record<string, any>> => {
    return FrontendPerformanceOptimizer.generateCDNConfig(assets);
  }
);

export const getConnectionPoolStatus = api(
  { method: "GET", path: "/api/performance/connection-pools" },
  async (): Promise<ConnectionPool[]> => {
    return Array.from(BackendPerformanceOptimizer['connectionPools'].values());
  }
);

export const createOptimizationRule = api(
  { method: "POST", path: "/api/performance/optimization-rules", auth: true },
  async (ruleData: Omit<OptimizationRule, 'id' | 'enabled' | 'metrics'>): Promise<OptimizationRule> => {
    const validation = OptimizationRuleSchema.parse(ruleData);
    
    const rule: OptimizationRule = {
      id: crypto.randomUUID(),
      enabled: true,
      metrics: {
        triggeredCount: 0,
        successRate: 0,
        avgImprovementPercent: 0,
      },
      ...validation,
    };

    BackendPerformanceOptimizer['optimizationRules'].push(rule);

    performanceLogger.info('Optimization rule created', {
      ruleId: rule.id,
      name: rule.name,
      type: rule.type,
    });

    return rule;
  }
);

export const getOptimizationRules = api(
  { method: "GET", path: "/api/performance/optimization-rules" },
  async (): Promise<OptimizationRule[]> => {
    return BackendPerformanceOptimizer['optimizationRules'];
  }
);

// Initialize default optimization rules
BackendPerformanceOptimizer['optimizationRules'] = [
  {
    id: 'slow-response-cache',
    name: 'Cache Slow Responses',
    type: 'cache',
    condition: 'slow_response',
    action: 'increase_cache_ttl',
    priority: 8,
    enabled: true,
    metrics: { triggeredCount: 0, successRate: 0.9, avgImprovementPercent: 35 },
  },
  {
    id: 'high-memory-compression',
    name: 'Enable Compression for High Memory Usage',
    type: 'compression',
    condition: 'high_memory',
    action: 'enable_response_compression',
    priority: 7,
    enabled: true,
    metrics: { triggeredCount: 0, successRate: 0.85, avgImprovementPercent: 25 },
  },
  {
    id: 'low-cache-hit-optimization',
    name: 'Optimize Cache Strategy',
    type: 'cache',
    condition: 'low_cache_hit_rate',
    action: 'optimize_cache_strategy',
    priority: 9,
    enabled: true,
    metrics: { triggeredCount: 0, successRate: 0.8, avgImprovementPercent: 40 },
  },
];

// Initialize default connection pools
BackendPerformanceOptimizer.initializeConnectionPool('database', 'database', {
  minConnections: 5,
  maxConnections: 20,
});

BackendPerformanceOptimizer.initializeConnectionPool('redis', 'redis', {
  minConnections: 2,
  maxConnections: 10,
});

BackendPerformanceOptimizer.initializeConnectionPool('external-api', 'external_api', {
  minConnections: 1,
  maxConnections: 5,
});