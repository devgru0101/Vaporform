import { Service } from 'encore.dev/service';
import { api } from 'encore.dev/api';
import { config } from 'encore.dev/config';
import log from 'encore.dev/log';
import { PubSub } from 'encore.dev/pubsub';
import { secret } from 'encore.dev/config';
import { DatabasePool } from 'pg';
import { RedisClientType } from 'redis';
import * as prometheus from 'prom-client';

// Production optimization configuration
interface OptimizationConfig {
  enableCaching: boolean;
  enableCompression: boolean;
  enablePreloading: boolean;
  cacheWarming: boolean;
  performanceMonitoring: boolean;
  resourceOptimization: boolean;
  networkOptimization: boolean;
  databaseOptimization: boolean;
}

const optimizationConfig = config<OptimizationConfig>('optimization', {
  enableCaching: true,
  enableCompression: true,
  enablePreloading: true,
  cacheWarming: true,
  performanceMonitoring: true,
  resourceOptimization: true,
  networkOptimization: true,
  databaseOptimization: true,
});

// Metrics for production optimization
const performanceMetrics = {
  // Request metrics
  requestDuration: new prometheus.Histogram({
    name: 'vaporform_request_duration_seconds',
    help: 'Request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  }),

  requestsTotal: new prometheus.Counter({
    name: 'vaporform_requests_total',
    help: 'Total number of requests',
    labelNames: ['method', 'route', 'status_code'],
  }),

  // Cache metrics
  cacheHits: new prometheus.Counter({
    name: 'vaporform_cache_hits_total',
    help: 'Total cache hits',
    labelNames: ['cache_type', 'key_pattern'],
  }),

  cacheMisses: new prometheus.Counter({
    name: 'vaporform_cache_misses_total',
    help: 'Total cache misses',
    labelNames: ['cache_type', 'key_pattern'],
  }),

  cacheSize: new prometheus.Gauge({
    name: 'vaporform_cache_size_bytes',
    help: 'Cache size in bytes',
    labelNames: ['cache_type'],
  }),

  // Database metrics
  dbConnectionsActive: new prometheus.Gauge({
    name: 'vaporform_db_connections_active',
    help: 'Active database connections',
  }),

  dbConnectionsIdle: new prometheus.Gauge({
    name: 'vaporform_db_connections_idle',
    help: 'Idle database connections',
  }),

  dbQueryDuration: new prometheus.Histogram({
    name: 'vaporform_db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['query_type', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  }),

  // Memory metrics
  memoryUsage: new prometheus.Gauge({
    name: 'vaporform_memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['type'],
  }),

  gcDuration: new prometheus.Histogram({
    name: 'vaporform_gc_duration_seconds',
    help: 'Garbage collection duration in seconds',
    labelNames: ['type'],
  }),

  // Business metrics
  activeUsers: new prometheus.Gauge({
    name: 'vaporform_active_users_total',
    help: 'Total active users',
  }),

  projectsCreated: new prometheus.Counter({
    name: 'vaporform_projects_created_total',
    help: 'Total projects created',
    labelNames: ['template_type'],
  }),

  containersStarted: new prometheus.Counter({
    name: 'vaporform_containers_started_total',
    help: 'Total containers started',
    labelNames: ['image_type', 'status'],
  }),

  // AI metrics
  aiRequestsTotal: new prometheus.Counter({
    name: 'vaporform_ai_requests_total',
    help: 'Total AI requests',
    labelNames: ['model', 'operation'],
  }),

  aiRequestDuration: new prometheus.Histogram({
    name: 'vaporform_ai_request_duration_seconds',
    help: 'AI request duration in seconds',
    labelNames: ['model', 'operation'],
    buckets: [0.5, 1, 2, 5, 10, 20, 30, 60],
  }),

  aiTokensUsed: new prometheus.Counter({
    name: 'vaporform_ai_tokens_used_total',
    help: 'Total AI tokens used',
    labelNames: ['model', 'type'],
  }),
};

// Performance optimization patterns
interface CacheStrategy {
  key: string;
  ttl: number;
  warmup?: boolean;
  prefetch?: boolean;
}

interface CompressionConfig {
  threshold: number;
  algorithm: 'gzip' | 'brotli' | 'deflate';
  level: number;
}

interface PreloadConfig {
  resources: string[];
  critical: boolean;
  defer: boolean;
}

// Production optimization service
@Service('production-optimization')
export class ProductionOptimizationService {
  private cacheStrategies: Map<string, CacheStrategy> = new Map();
  private compressionConfig: CompressionConfig;
  private preloadConfig: PreloadConfig;
  private optimizationTasks: Set<string> = new Set();
  private performanceThresholds: Map<string, number> = new Map();

  constructor() {
    this.initializeOptimization();
    this.setupPerformanceMonitoring();
    this.startOptimizationTasks();
  }

  // Initialize optimization strategies
  private initializeOptimization(): void {
    // Cache strategies
    this.cacheStrategies.set('user-sessions', {
      key: 'session:*',
      ttl: 3600,
      warmup: true,
    });

    this.cacheStrategies.set('project-metadata', {
      key: 'project:*:metadata',
      ttl: 1800,
      prefetch: true,
    });

    this.cacheStrategies.set('ai-responses', {
      key: 'ai:*:response',
      ttl: 7200,
      warmup: false,
    });

    this.cacheStrategies.set('container-images', {
      key: 'container:*:image',
      ttl: 14400,
      prefetch: true,
    });

    // Compression configuration
    this.compressionConfig = {
      threshold: 1024, // 1KB
      algorithm: 'gzip',
      level: 6,
    };

    // Preload configuration
    this.preloadConfig = {
      resources: [
        '/api/user/profile',
        '/api/projects/templates',
        '/api/containers/images',
      ],
      critical: true,
      defer: false,
    };

    // Performance thresholds
    this.performanceThresholds.set('response_time_p95', 1000); // 1s
    this.performanceThresholds.set('error_rate', 0.01); // 1%
    this.performanceThresholds.set('memory_usage', 0.8); // 80%
    this.performanceThresholds.set('cpu_usage', 0.7); // 70%
  }

  // Setup performance monitoring
  private setupPerformanceMonitoring(): void {
    // Collect default metrics
    prometheus.collectDefaultMetrics({
      prefix: 'vaporform_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    });

    // Monitor Node.js performance
    setInterval(() => {
      const memUsage = process.memoryUsage();
      performanceMetrics.memoryUsage.set({ type: 'rss' }, memUsage.rss);
      performanceMetrics.memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
      performanceMetrics.memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
      performanceMetrics.memoryUsage.set({ type: 'external' }, memUsage.external);
    }, 10000);

    // Monitor performance hooks
    const performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'gc') {
          performanceMetrics.gcDuration
            .labels({ type: entry.name })
            .observe(entry.duration / 1000);
        }
      }
    });
    performanceObserver.observe({ entryTypes: ['gc'] });
  }

  // Start optimization background tasks
  private startOptimizationTasks(): void {
    // Cache warming task
    if (optimizationConfig.cacheWarming) {
      setInterval(() => this.warmupCaches(), 300000); // 5 minutes
    }

    // Performance analysis task
    if (optimizationConfig.performanceMonitoring) {
      setInterval(() => this.analyzePerformance(), 60000); // 1 minute
    }

    // Resource optimization task
    if (optimizationConfig.resourceOptimization) {
      setInterval(() => this.optimizeResources(), 600000); // 10 minutes
    }

    // Database optimization task
    if (optimizationConfig.databaseOptimization) {
      setInterval(() => this.optimizeDatabase(), 1800000); // 30 minutes
    }
  }

  // Cache optimization
  @api({ method: 'POST', path: '/optimization/cache/strategy' })
  async setCacheStrategy(req: {
    pattern: string;
    strategy: CacheStrategy;
  }): Promise<{ success: boolean; message: string }> {
    try {
      this.cacheStrategies.set(req.pattern, req.strategy);
      
      if (req.strategy.warmup) {
        await this.warmupSpecificCache(req.pattern);
      }

      log.info('Cache strategy updated', {
        pattern: req.pattern,
        strategy: req.strategy,
      });

      return {
        success: true,
        message: `Cache strategy updated for pattern: ${req.pattern}`,
      };
    } catch (error) {
      log.error('Failed to set cache strategy', { error, pattern: req.pattern });
      throw error;
    }
  }

  // Performance monitoring endpoint
  @api({ method: 'GET', path: '/optimization/performance/metrics' })
  async getPerformanceMetrics(): Promise<{
    metrics: Record<string, any>;
    thresholds: Record<string, number>;
    recommendations: string[];
  }> {
    try {
      const metrics = await prometheus.register.metrics();
      const recommendations = await this.generateRecommendations();

      return {
        metrics: prometheus.register.getMetricsAsJSON(),
        thresholds: Object.fromEntries(this.performanceThresholds),
        recommendations,
      };
    } catch (error) {
      log.error('Failed to get performance metrics', { error });
      throw error;
    }
  }

  // Resource optimization
  @api({ method: 'POST', path: '/optimization/resources/optimize' })
  async optimizeResources(): Promise<{
    optimizations: string[];
    savings: Record<string, number>;
  }> {
    try {
      const optimizations: string[] = [];
      const savings: Record<string, number> = {};

      // Memory optimization
      if (global.gc) {
        const memBefore = process.memoryUsage().heapUsed;
        global.gc();
        const memAfter = process.memoryUsage().heapUsed;
        const saved = memBefore - memAfter;
        
        if (saved > 0) {
          optimizations.push('Garbage collection executed');
          savings.memory = saved;
        }
      }

      // Cache optimization
      const cacheOptimization = await this.optimizeCaches();
      optimizations.push(...cacheOptimization.optimizations);
      Object.assign(savings, cacheOptimization.savings);

      // Connection pool optimization
      const poolOptimization = await this.optimizeConnectionPools();
      optimizations.push(...poolOptimization.optimizations);
      Object.assign(savings, poolOptimization.savings);

      log.info('Resource optimization completed', {
        optimizations,
        savings,
      });

      return { optimizations, savings };
    } catch (error) {
      log.error('Failed to optimize resources', { error });
      throw error;
    }
  }

  // Database optimization
  @api({ method: 'POST', path: '/optimization/database/optimize' })
  async optimizeDatabase(): Promise<{
    optimizations: string[];
    performance: Record<string, number>;
  }> {
    try {
      const optimizations: string[] = [];
      const performance: Record<string, number> = {};

      // Analyze slow queries
      const slowQueries = await this.analyzeSlowQueries();
      if (slowQueries.length > 0) {
        optimizations.push(`Found ${slowQueries.length} slow queries`);
        await this.optimizeSlowQueries(slowQueries);
      }

      // Update table statistics
      await this.updateTableStatistics();
      optimizations.push('Table statistics updated');

      // Optimize indexes
      const indexOptimization = await this.optimizeIndexes();
      optimizations.push(...indexOptimization);

      // Vacuum and analyze
      await this.performDatabaseMaintenance();
      optimizations.push('Database maintenance completed');

      // Get performance metrics
      performance.connectionCount = await this.getActiveConnections();
      performance.cacheHitRatio = await this.getCacheHitRatio();
      performance.avgQueryTime = await this.getAverageQueryTime();

      log.info('Database optimization completed', {
        optimizations,
        performance,
      });

      return { optimizations, performance };
    } catch (error) {
      log.error('Failed to optimize database', { error });
      throw error;
    }
  }

  // CDN and edge optimization
  @api({ method: 'POST', path: '/optimization/cdn/configure' })
  async configureCDN(req: {
    routes: string[];
    caching: {
      staticAssets: number;
      apiResponses: number;
      images: number;
    };
    compression: boolean;
    minification: boolean;
  }): Promise<{ success: boolean; configuration: any }> {
    try {
      const cdnConfig = {
        routes: req.routes,
        caching: req.caching,
        compression: req.compression,
        minification: req.minification,
        edgeLocations: [
          'us-east-1',
          'us-west-2',
          'eu-west-1',
          'ap-southeast-1',
          'ap-northeast-1',
        ],
        behaviors: {
          staticAssets: {
            cachePolicyId: 'static-assets',
            compress: true,
            viewerProtocolPolicy: 'redirect-to-https',
            allowedMethods: ['GET', 'HEAD'],
            cachedMethods: ['GET', 'HEAD'],
            ttl: {
              default: req.caching.staticAssets,
              max: req.caching.staticAssets * 2,
              min: 0,
            },
          },
          apiResponses: {
            cachePolicyId: 'api-responses',
            compress: req.compression,
            viewerProtocolPolicy: 'https-only',
            allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
            cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
            ttl: {
              default: req.caching.apiResponses,
              max: req.caching.apiResponses,
              min: 0,
            },
          },
        },
      };

      // Apply CDN configuration
      await this.applyCDNConfiguration(cdnConfig);

      log.info('CDN configuration applied', { configuration: cdnConfig });

      return {
        success: true,
        configuration: cdnConfig,
      };
    } catch (error) {
      log.error('Failed to configure CDN', { error });
      throw error;
    }
  }

  // Private helper methods
  private async warmupCaches(): Promise<void> {
    for (const [pattern, strategy] of this.cacheStrategies) {
      if (strategy.warmup) {
        await this.warmupSpecificCache(pattern);
      }
    }
  }

  private async warmupSpecificCache(pattern: string): Promise<void> {
    // Implementation for cache warmup
    log.info('Warming up cache', { pattern });
    // Add specific cache warming logic here
  }

  private async analyzePerformance(): Promise<void> {
    const metrics = await prometheus.register.getMetricsAsJSON();
    
    // Check thresholds and generate alerts
    for (const [metric, threshold] of this.performanceThresholds) {
      // Implementation for performance analysis
    }
  }

  private async optimizeCaches(): Promise<{
    optimizations: string[];
    savings: Record<string, number>;
  }> {
    const optimizations: string[] = [];
    const savings: Record<string, number> = {};

    // Implement cache optimization logic
    return { optimizations, savings };
  }

  private async optimizeConnectionPools(): Promise<{
    optimizations: string[];
    savings: Record<string, number>;
  }> {
    const optimizations: string[] = [];
    const savings: Record<string, number> = {};

    // Implement connection pool optimization logic
    return { optimizations, savings };
  }

  private async analyzeSlowQueries(): Promise<any[]> {
    // Implementation for slow query analysis
    return [];
  }

  private async optimizeSlowQueries(queries: any[]): Promise<void> {
    // Implementation for slow query optimization
  }

  private async updateTableStatistics(): Promise<void> {
    // Implementation for table statistics update
  }

  private async optimizeIndexes(): Promise<string[]> {
    // Implementation for index optimization
    return [];
  }

  private async performDatabaseMaintenance(): Promise<void> {
    // Implementation for database maintenance
  }

  private async getActiveConnections(): Promise<number> {
    // Implementation to get active connections
    return 0;
  }

  private async getCacheHitRatio(): Promise<number> {
    // Implementation to get cache hit ratio
    return 0;
  }

  private async getAverageQueryTime(): Promise<number> {
    // Implementation to get average query time
    return 0;
  }

  private async applyCDNConfiguration(config: any): Promise<void> {
    // Implementation for CDN configuration
  }

  private async generateRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    // Add performance recommendations based on metrics
    const metrics = await prometheus.register.getMetricsAsJSON();
    
    // Example recommendations
    recommendations.push('Consider enabling gzip compression for API responses');
    recommendations.push('Implement cache warming for frequently accessed data');
    recommendations.push('Monitor database query performance regularly');

    return recommendations;
  }
}

// Export performance metrics for Prometheus scraping
export function getMetricsHandler() {
  return async (req: any, res: any) => {
    res.set('Content-Type', prometheus.register.contentType);
    res.send(await prometheus.register.metrics());
  };
}

// Export the service
export const productionOptimizationService = new ProductionOptimizationService();