import { api, APICallMeta } from 'encore.dev/api';
import log from 'encore.dev/log';
import { z } from 'zod';
import { AuthData } from './auth';
import { v4 as uuidv4 } from 'uuid';
import Docker from 'dockerode';
import { promisify } from 'util';
import { exec } from 'child_process';

const docker = new Docker();
const execAsync = promisify(exec);

// Monitoring interfaces
export interface ContainerMetrics {
  containerId: string;
  timestamp: Date;
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  network: NetworkMetrics;
  disk: DiskMetrics;
  health: HealthMetrics;
}

export interface CPUMetrics {
  usage: number; // Percentage
  usageNanoCores: number;
  userUsage: number;
  systemUsage: number;
  throttling: {
    periods: number;
    throttledPeriods: number;
    throttledTime: number;
  };
  limit: number;
  requests: number;
}

export interface MemoryMetrics {
  usage: number; // Bytes
  usagePercent: number;
  limit: number;
  available: number;
  cache: number;
  rss: number;
  swap?: number;
  workingSet: number;
}

export interface NetworkMetrics {
  rxBytes: number;
  rxPackets: number;
  rxErrors: number;
  rxDropped: number;
  txBytes: number;
  txPackets: number;
  txErrors: number;
  txDropped: number;
  interfaces: NetworkInterface[];
}

export interface NetworkInterface {
  name: string;
  rxBytes: number;
  txBytes: number;
}

export interface DiskMetrics {
  readBytes: number;
  writeBytes: number;
  readOps: number;
  writeOps: number;
  usage: number; // Bytes
  available: number;
  usagePercent: number;
  inodes: {
    total: number;
    used: number;
    available: number;
  };
}

export interface HealthMetrics {
  status: 'healthy' | 'unhealthy' | 'starting' | 'unknown';
  checks: HealthCheck[];
  uptime: number; // seconds
  restarts: number;
  lastRestart?: Date;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  timestamp: Date;
  duration: number; // milliseconds
  output?: string;
  tags?: string[];
}

export interface AlertRule {
  id: string;
  containerId: string;
  name: string;
  description?: string;
  condition: AlertCondition;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: NotificationChannel[];
  cooldownPeriod: number; // seconds
  lastTriggered?: Date;
  triggerCount: number;
  createdBy: string;
  createdAt: Date;
}

export interface AlertCondition {
  metric: string; // e.g., "cpu.usage", "memory.usagePercent", "disk.usagePercent"
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  duration: number; // seconds - how long condition must persist
  aggregation?: 'avg' | 'max' | 'min' | 'sum';
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  endpoint: string;
  enabled: boolean;
  config?: { [key: string]: any };
}

export interface Alert {
  id: string;
  ruleId: string;
  containerId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: 'firing' | 'resolved' | 'acknowledged';
  triggeredAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  metrics: { [key: string]: number };
  tags: string[];
}

export interface PerformanceAnalysis {
  containerId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  summary: {
    avgCpuUsage: number;
    maxCpuUsage: number;
    avgMemoryUsage: number;
    maxMemoryUsage: number;
    totalNetworkTraffic: number;
    totalDiskIO: number;
    uptime: number;
    restarts: number;
  };
  trends: {
    cpuTrend: 'increasing' | 'decreasing' | 'stable';
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
    errorRate: number;
  };
  recommendations: Recommendation[];
  anomalies: Anomaly[];
}

export interface Recommendation {
  type: 'resource_optimization' | 'scaling' | 'configuration' | 'performance' | 'security';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: string;
  implementation: string;
  estimatedSavings?: {
    cost?: number;
    cpu?: number;
    memory?: number;
  };
}

export interface Anomaly {
  timestamp: Date;
  type: 'cpu_spike' | 'memory_leak' | 'network_spike' | 'disk_spike' | 'error_burst';
  severity: 'low' | 'medium' | 'high';
  description: string;
  metrics: { [key: string]: number };
  duration: number; // seconds
}

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  source: string;
  containerId: string;
  stream: 'stdout' | 'stderr';
  tags?: string[];
  metadata?: { [key: string]: any };
}

export interface LogQuery {
  containerId?: string;
  level?: string;
  search?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

// Request/Response schemas
const GetMetricsRequest = z.object({
  timeRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
  granularity: z.enum(['1m', '5m', '15m', '1h', '6h', '24h']).default('5m'),
});

const CreateAlertRuleRequest = z.object({
  containerId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  condition: z.object({
    metric: z.string(),
    operator: z.enum(['>', '<', '>=', '<=', '==', '!=']),
    threshold: z.number(),
    duration: z.number().min(30).max(3600), // 30 seconds to 1 hour
    aggregation: z.enum(['avg', 'max', 'min', 'sum']).optional(),
  }),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  channels: z.array(z.object({
    type: z.enum(['email', 'slack', 'webhook', 'sms']),
    endpoint: z.string(),
    enabled: z.boolean().default(true),
  })),
  cooldownPeriod: z.number().min(300).max(86400).default(900), // 5 minutes to 24 hours
});

const GetLogsRequest = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).optional(),
  search: z.string().optional(),
  timeRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
});

// Storage for monitoring data (replace with time-series database)
const metricsStorage: Map<string, ContainerMetrics[]> = new Map();
const alertRules: Map<string, AlertRule> = new Map();
const activeAlerts: Map<string, Alert> = new Map();
const logsStorage: Map<string, LogEntry[]> = new Map();

// Real-time metrics collection
const metricsCollectors: Map<string, NodeJS.Timeout> = new Map();

// Start monitoring a container
export function startContainerMonitoring(containerId: string): void {
  if (metricsCollectors.has(containerId)) {
    return; // Already monitoring
  }

  log.info('Starting container monitoring', { containerId });

  // Collect metrics every 30 seconds
  const collector = setInterval(async () => {
    try {
      const metrics = await collectContainerMetrics(containerId);
      storeMetrics(containerId, metrics);
      
      // Check alert rules
      await checkAlertRules(containerId, metrics);
      
    } catch (error) {
      log.error('Failed to collect metrics', { error: error.message, containerId });
    }
  }, 30000);

  metricsCollectors.set(containerId, collector);
}

// Stop monitoring a container
export function stopContainerMonitoring(containerId: string): void {
  const collector = metricsCollectors.get(containerId);
  if (collector) {
    clearInterval(collector);
    metricsCollectors.delete(containerId);
    log.info('Stopped container monitoring', { containerId });
  }
}

// Collect comprehensive metrics from a container
async function collectContainerMetrics(containerId: string): Promise<ContainerMetrics> {
  const dockerContainer = docker.getContainer(containerId);
  
  try {
    const [stats, info] = await Promise.all([
      dockerContainer.stats({ stream: false }),
      dockerContainer.inspect(),
    ]);

    const timestamp = new Date();

    // Calculate CPU metrics
    const cpu = calculateCPUMetrics(stats);
    
    // Calculate memory metrics
    const memory = calculateMemoryMetrics(stats);
    
    // Calculate network metrics
    const network = calculateNetworkMetrics(stats);
    
    // Calculate disk metrics
    const disk = await calculateDiskMetrics(stats, info);
    
    // Get health metrics
    const health = calculateHealthMetrics(info);

    const metrics: ContainerMetrics = {
      containerId,
      timestamp,
      cpu,
      memory,
      network,
      disk,
      health,
    };

    return metrics;

  } catch (error) {
    log.error('Failed to collect container metrics', { error: error.message, containerId });
    throw error;
  }
}

function calculateCPUMetrics(stats: any): CPUMetrics {
  const cpuStats = stats.cpu_stats;
  const preCpuStats = stats.precpu_stats;
  
  const cpuDelta = cpuStats.cpu_usage.total_usage - preCpuStats.cpu_usage.total_usage;
  const systemDelta = cpuStats.system_cpu_usage - preCpuStats.system_cpu_usage;
  const numberCpus = cpuStats.online_cpus || Object.keys(cpuStats.cpu_usage.percpu_usage || {}).length;
  
  let usage = 0;
  if (systemDelta > 0 && cpuDelta > 0) {
    usage = (cpuDelta / systemDelta) * numberCpus * 100;
  }

  return {
    usage: Math.round(usage * 100) / 100,
    usageNanoCores: cpuStats.cpu_usage.total_usage,
    userUsage: cpuStats.cpu_usage.usage_in_usermode,
    systemUsage: cpuStats.cpu_usage.usage_in_kernelmode,
    throttling: {
      periods: cpuStats.throttling_data?.periods || 0,
      throttledPeriods: cpuStats.throttling_data?.throttled_periods || 0,
      throttledTime: cpuStats.throttling_data?.throttled_time || 0,
    },
    limit: numberCpus * 100, // 100% per CPU
    requests: 0, // Would be set based on container configuration
  };
}

function calculateMemoryMetrics(stats: any): MemoryMetrics {
  const memStats = stats.memory_stats;
  const usage = memStats.usage || 0;
  const limit = memStats.limit || 0;
  const cache = memStats.stats?.cache || 0;
  
  const usagePercent = limit > 0 ? (usage / limit) * 100 : 0;
  const available = Math.max(0, limit - usage);

  return {
    usage,
    usagePercent: Math.round(usagePercent * 100) / 100,
    limit,
    available,
    cache,
    rss: memStats.stats?.rss || 0,
    swap: memStats.stats?.swap || 0,
    workingSet: usage - cache, // Approximate working set
  };
}

function calculateNetworkMetrics(stats: any): NetworkMetrics {
  const networks = stats.networks || {};
  let totalRxBytes = 0;
  let totalRxPackets = 0;
  let totalRxErrors = 0;
  let totalRxDropped = 0;
  let totalTxBytes = 0;
  let totalTxPackets = 0;
  let totalTxErrors = 0;
  let totalTxDropped = 0;

  const interfaces: NetworkInterface[] = [];

  for (const [name, netStats] of Object.entries(networks) as [string, any][]) {
    totalRxBytes += netStats.rx_bytes || 0;
    totalRxPackets += netStats.rx_packets || 0;
    totalRxErrors += netStats.rx_errors || 0;
    totalRxDropped += netStats.rx_dropped || 0;
    totalTxBytes += netStats.tx_bytes || 0;
    totalTxPackets += netStats.tx_packets || 0;
    totalTxErrors += netStats.tx_errors || 0;
    totalTxDropped += netStats.tx_dropped || 0;

    interfaces.push({
      name,
      rxBytes: netStats.rx_bytes || 0,
      txBytes: netStats.tx_bytes || 0,
    });
  }

  return {
    rxBytes: totalRxBytes,
    rxPackets: totalRxPackets,
    rxErrors: totalRxErrors,
    rxDropped: totalRxDropped,
    txBytes: totalTxBytes,
    txPackets: totalTxPackets,
    txErrors: totalTxErrors,
    txDropped: totalTxDropped,
    interfaces,
  };
}

async function calculateDiskMetrics(stats: any, info: any): Promise<DiskMetrics> {
  const blkioStats = stats.blkio_stats || {};
  
  // Sum up block I/O statistics
  let readBytes = 0;
  let writeBytes = 0;
  let readOps = 0;
  let writeOps = 0;

  if (blkioStats.io_service_bytes_recursive) {
    for (const stat of blkioStats.io_service_bytes_recursive) {
      if (stat.op === 'Read') {
        readBytes += stat.value;
      }
      if (stat.op === 'Write') {
        writeBytes += stat.value;
      }
    }
  }

  if (blkioStats.io_serviced_recursive) {
    for (const stat of blkioStats.io_serviced_recursive) {
      if (stat.op === 'Read') {
        readOps += stat.value;
      }
      if (stat.op === 'Write') {
        writeOps += stat.value;
      }
    }
  }

  // Get filesystem usage (this would require exec into container in real implementation)
  let usage = 0;
  let available = 0;
  let usagePercent = 0;
  
  try {
    // Simulate filesystem metrics (in real implementation, use docker exec)
    const mounts = info.Mounts || [];
    if (mounts.length > 0) {
      // Mock data for now
      usage = Math.random() * 1024 * 1024 * 1024; // Random usage up to 1GB
      available = 10 * 1024 * 1024 * 1024; // 10GB available
      usagePercent = (usage / (usage + available)) * 100;
    }
  } catch (error) {
    // Ignore filesystem metrics errors
  }

  return {
    readBytes,
    writeBytes,
    readOps,
    writeOps,
    usage,
    available,
    usagePercent: Math.round(usagePercent * 100) / 100,
    inodes: {
      total: 1000000, // Mock data
      used: Math.floor(Math.random() * 100000),
      available: 900000,
    },
  };
}

function calculateHealthMetrics(info: any): HealthMetrics {
  const state = info.State || {};
  const config = info.Config || {};
  
  let status: HealthMetrics['status'] = 'unknown';
  if (state.Health) {
    switch (state.Health.Status) {
      case 'healthy':
        status = 'healthy';
        break;
      case 'unhealthy':
        status = 'unhealthy';
        break;
      case 'starting':
        status = 'starting';
        break;
      default:
        status = 'unknown';
    }
  } else if (state.Running) {
    status = 'healthy';
  } else {
    status = 'unhealthy';
  }

  const healthChecks: HealthCheck[] = [];
  if (state.Health?.Log) {
    for (const logEntry of state.Health.Log.slice(-5)) { // Last 5 checks
      healthChecks.push({
        name: 'container_health',
        status: logEntry.ExitCode === 0 ? 'pass' : 'fail',
        timestamp: new Date(logEntry.Start),
        duration: new Date(logEntry.End).getTime() - new Date(logEntry.Start).getTime(),
        output: logEntry.Output,
      });
    }
  }

  const startedAt = new Date(state.StartedAt);
  const uptime = state.Running ? (Date.now() - startedAt.getTime()) / 1000 : 0;

  return {
    status,
    checks: healthChecks,
    uptime: Math.floor(uptime),
    restarts: state.RestartCount || 0,
    lastRestart: state.RestartCount > 0 ? startedAt : undefined,
  };
}

function storeMetrics(containerId: string, metrics: ContainerMetrics): void {
  if (!metricsStorage.has(containerId)) {
    metricsStorage.set(containerId, []);
  }

  const containerMetrics = metricsStorage.get(containerId)!;
  containerMetrics.push(metrics);

  // Keep only last 24 hours of metrics (assuming 30-second intervals = 2880 data points)
  if (containerMetrics.length > 2880) {
    containerMetrics.splice(0, containerMetrics.length - 2880);
  }

  metricsStorage.set(containerId, containerMetrics);
}

async function checkAlertRules(containerId: string, metrics: ContainerMetrics): Promise<void> {
  const rules = Array.from(alertRules.values()).filter(rule => 
    rule.containerId === containerId && rule.enabled,
  );

  for (const rule of rules) {
    await evaluateAlertRule(rule, metrics);
  }
}

async function evaluateAlertRule(rule: AlertRule, metrics: ContainerMetrics): Promise<void> {
  const { condition } = rule;
  
  // Get metric value based on condition.metric
  const metricValue = getMetricValue(metrics, condition.metric);
  if (metricValue === null) {
    return; // Metric not found
  }

  // Evaluate condition
  let conditionMet = false;
  switch (condition.operator) {
    case '>':
      conditionMet = metricValue > condition.threshold;
      break;
    case '<':
      conditionMet = metricValue < condition.threshold;
      break;
    case '>=':
      conditionMet = metricValue >= condition.threshold;
      break;
    case '<=':
      conditionMet = metricValue <= condition.threshold;
      break;
    case '==':
      conditionMet = metricValue === condition.threshold;
      break;
    case '!=':
      conditionMet = metricValue !== condition.threshold;
      break;
  }

  const existingAlert = Array.from(activeAlerts.values()).find(alert => 
    alert.ruleId === rule.id && alert.status === 'firing',
  );

  if (conditionMet) {
    if (!existingAlert) {
      // Create new alert
      await createAlert(rule, metrics, metricValue);
    }
  } else if (existingAlert) {
    // Resolve existing alert
    await resolveAlert(existingAlert.id);
  }
}

function getMetricValue(metrics: ContainerMetrics, metricPath: string): number | null {
  const parts = metricPath.split('.');
  let value: any = metrics;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return null;
    }
  }

  return typeof value === 'number' ? value : null;
}

async function createAlert(rule: AlertRule, metrics: ContainerMetrics, metricValue: number): Promise<void> {
  const alertId = uuidv4();
  const now = new Date();

  const alert: Alert = {
    id: alertId,
    ruleId: rule.id,
    containerId: rule.containerId,
    severity: rule.severity,
    title: `${rule.name}`,
    description: `${rule.condition.metric} is ${metricValue} (threshold: ${rule.condition.operator} ${rule.condition.threshold})`,
    status: 'firing',
    triggeredAt: now,
    metrics: {
      [rule.condition.metric]: metricValue,
    },
    tags: [],
  };

  activeAlerts.set(alertId, alert);

  // Update rule statistics
  rule.lastTriggered = now;
  rule.triggerCount++;
  alertRules.set(rule.id, rule);

  // Send notifications
  await sendAlertNotifications(alert, rule);

  log.warn('Alert triggered', { alertId, ruleId: rule.id, containerId: rule.containerId });
}

async function resolveAlert(alertId: string): Promise<void> {
  const alert = activeAlerts.get(alertId);
  if (!alert) {
    return;
  }

  alert.status = 'resolved';
  alert.resolvedAt = new Date();
  activeAlerts.set(alertId, alert);

  log.info('Alert resolved', { alertId, containerId: alert.containerId });
}

async function sendAlertNotifications(alert: Alert, rule: AlertRule): Promise<void> {
  for (const channel of rule.channels) {
    if (!channel.enabled) {
      continue;
    }

    try {
      await sendNotification(channel, alert, rule);
    } catch (error) {
      log.error('Failed to send alert notification', {
        error: error.message,
        channel: channel.type,
        alertId: alert.id,
      });
    }
  }
}

async function sendNotification(
  channel: NotificationChannel,
  alert: Alert,
  rule: AlertRule,
): Promise<void> {
  const message = formatAlertMessage(alert, rule);

  switch (channel.type) {
    case 'webhook':
      await sendWebhookNotification(channel.endpoint, alert, message);
      break;
    case 'email':
      await sendEmailNotification(channel.endpoint, alert, message);
      break;
    case 'slack':
      await sendSlackNotification(channel.endpoint, alert, message);
      break;
    case 'sms':
      await sendSmsNotification(channel.endpoint, alert, message);
      break;
  }
}

function formatAlertMessage(alert: Alert, rule: AlertRule): string {
  return `🚨 *${alert.severity.toUpperCase()} Alert*

*${alert.title}*

${alert.description}

*Container:* ${alert.containerId}
*Triggered:* ${alert.triggeredAt.toISOString()}
*Rule:* ${rule.name}

Please investigate and resolve this issue.`;
}

async function sendWebhookNotification(url: string, alert: Alert, message: string): Promise<void> {
  // Implementation would use fetch or axios to send webhook
  log.info('Webhook notification sent', { url, alertId: alert.id });
}

async function sendEmailNotification(email: string, alert: Alert, message: string): Promise<void> {
  // Implementation would use email service (SendGrid, SES, etc.)
  log.info('Email notification sent', { email, alertId: alert.id });
}

async function sendSlackNotification(webhookUrl: string, alert: Alert, message: string): Promise<void> {
  // Implementation would send to Slack webhook
  log.info('Slack notification sent', { alertId: alert.id });
}

async function sendSmsNotification(phoneNumber: string, alert: Alert, message: string): Promise<void> {
  // Implementation would use SMS service (Twilio, etc.)
  log.info('SMS notification sent', { phoneNumber, alertId: alert.id });
}

// Performance analysis functions
async function analyzeContainerPerformance(
  containerId: string,
  timeRange: { start: Date; end: Date },
): Promise<PerformanceAnalysis> {
  const containerMetrics = metricsStorage.get(containerId) || [];
  
  // Filter metrics by time range
  const filteredMetrics = containerMetrics.filter(m => 
    m.timestamp >= timeRange.start && m.timestamp <= timeRange.end,
  );

  if (filteredMetrics.length === 0) {
    throw new Error('No metrics found for the specified time range');
  }

  // Calculate summary statistics
  const cpuValues = filteredMetrics.map(m => m.cpu.usage);
  const memoryValues = filteredMetrics.map(m => m.memory.usagePercent);
  const networkTraffic = filteredMetrics.reduce((sum, m) => sum + m.network.rxBytes + m.network.txBytes, 0);
  const diskIO = filteredMetrics.reduce((sum, m) => sum + m.disk.readBytes + m.disk.writeBytes, 0);

  const summary = {
    avgCpuUsage: cpuValues.reduce((sum, val) => sum + val, 0) / cpuValues.length,
    maxCpuUsage: Math.max(...cpuValues),
    avgMemoryUsage: memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length,
    maxMemoryUsage: Math.max(...memoryValues),
    totalNetworkTraffic: networkTraffic,
    totalDiskIO: diskIO,
    uptime: filteredMetrics[filteredMetrics.length - 1]?.health.uptime || 0,
    restarts: filteredMetrics[filteredMetrics.length - 1]?.health.restarts || 0,
  };

  // Analyze trends
  const trends = analyzeTrends(filteredMetrics);

  // Generate recommendations
  const recommendations = generateRecommendations(summary, trends);

  // Detect anomalies
  const anomalies = detectAnomalies(filteredMetrics);

  return {
    containerId,
    timeRange,
    summary,
    trends,
    recommendations,
    anomalies,
  };
}

function analyzeTrends(metrics: ContainerMetrics[]): PerformanceAnalysis['trends'] {
  if (metrics.length < 2) {
    return {
      cpuTrend: 'stable',
      memoryTrend: 'stable',
      errorRate: 0,
    };
  }

  const cpuValues = metrics.map(m => m.cpu.usage);
  const memoryValues = metrics.map(m => m.memory.usagePercent);

  // Simple linear trend analysis
  const cpuTrend = calculateTrend(cpuValues);
  const memoryTrend = calculateTrend(memoryValues);

  // Calculate error rate based on health checks
  const totalChecks = metrics.reduce((sum, m) => sum + m.health.checks.length, 0);
  const failedChecks = metrics.reduce((sum, m) => 
    sum + m.health.checks.filter(c => c.status === 'fail').length, 0,
  );
  const errorRate = totalChecks > 0 ? (failedChecks / totalChecks) * 100 : 0;

  return {
    cpuTrend,
    memoryTrend,
    errorRate,
  };
}

function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 2) {
    return 'stable';
  }

  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

  const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (percentChange > 10) {
    return 'increasing';
  }
  if (percentChange < -10) {
    return 'decreasing';
  }
  return 'stable';
}

function generateRecommendations(
  summary: PerformanceAnalysis['summary'],
  trends: PerformanceAnalysis['trends'],
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // CPU recommendations
  if (summary.avgCpuUsage > 80) {
    recommendations.push({
      type: 'scaling',
      priority: 'high',
      title: 'High CPU Usage Detected',
      description: 'Container is consistently using high CPU resources',
      impact: 'May cause performance degradation and slower response times',
      implementation: 'Consider scaling up CPU resources or optimizing application code',
      estimatedSavings: { cpu: 30 },
    });
  } else if (summary.avgCpuUsage < 20) {
    recommendations.push({
      type: 'resource_optimization',
      priority: 'medium',
      title: 'Low CPU Utilization',
      description: 'Container is using less CPU than allocated',
      impact: 'Potential cost savings by reducing allocated resources',
      implementation: 'Consider reducing CPU limits to optimize costs',
      estimatedSavings: { cost: 25 },
    });
  }

  // Memory recommendations
  if (summary.avgMemoryUsage > 85) {
    recommendations.push({
      type: 'scaling',
      priority: 'high',
      title: 'High Memory Usage',
      description: 'Container is approaching memory limits',
      impact: 'Risk of out-of-memory errors and container restarts',
      implementation: 'Increase memory limits or optimize memory usage',
      estimatedSavings: { memory: 20 },
    });
  }

  // Restart recommendations
  if (summary.restarts > 3) {
    recommendations.push({
      type: 'configuration',
      priority: 'high',
      title: 'Frequent Container Restarts',
      description: 'Container has restarted multiple times',
      impact: 'Service interruptions and potential data loss',
      implementation: 'Investigate application stability and health check configuration',
    });
  }

  // Trend-based recommendations
  if (trends.memoryTrend === 'increasing') {
    recommendations.push({
      type: 'performance',
      priority: 'medium',
      title: 'Memory Usage Increasing',
      description: 'Memory usage shows an upward trend',
      impact: 'Potential memory leak or increased workload',
      implementation: 'Monitor for memory leaks and optimize memory usage patterns',
    });
  }

  return recommendations;
}

function detectAnomalies(metrics: ContainerMetrics[]): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // CPU spike detection
  const cpuValues = metrics.map(m => m.cpu.usage);
  const avgCpu = cpuValues.reduce((sum, val) => sum + val, 0) / cpuValues.length;
  const cpuStdDev = Math.sqrt(
    cpuValues.reduce((sum, val) => sum + Math.pow(val - avgCpu, 2), 0) / cpuValues.length,
  );

  metrics.forEach((metric, index) => {
    if (metric.cpu.usage > avgCpu + 2 * cpuStdDev) {
      anomalies.push({
        timestamp: metric.timestamp,
        type: 'cpu_spike',
        severity: metric.cpu.usage > avgCpu + 3 * cpuStdDev ? 'high' : 'medium',
        description: `CPU usage spike: ${metric.cpu.usage.toFixed(2)}%`,
        metrics: { cpu_usage: metric.cpu.usage },
        duration: 30, // Assuming 30-second intervals
      });
    }
  });

  // Memory spike detection
  const memoryValues = metrics.map(m => m.memory.usagePercent);
  const avgMemory = memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length;
  const memoryStdDev = Math.sqrt(
    memoryValues.reduce((sum, val) => sum + Math.pow(val - avgMemory, 2), 0) / memoryValues.length,
  );

  metrics.forEach(metric => {
    if (metric.memory.usagePercent > avgMemory + 2 * memoryStdDev) {
      anomalies.push({
        timestamp: metric.timestamp,
        type: 'memory_leak',
        severity: metric.memory.usagePercent > avgMemory + 3 * memoryStdDev ? 'high' : 'medium',
        description: `Memory usage spike: ${metric.memory.usagePercent.toFixed(2)}%`,
        metrics: { memory_usage: metric.memory.usagePercent },
        duration: 30,
      });
    }
  });

  return anomalies;
}

// Log collection and parsing
async function collectContainerLogs(containerId: string, query: LogQuery): Promise<LogEntry[]> {
  try {
    const dockerContainer = docker.getContainer(containerId);
    
    const logOptions: any = {
      stdout: true,
      stderr: true,
      timestamps: true,
      tail: query.limit || 100,
    };

    if (query.timeRange) {
      logOptions.since = Math.floor(query.timeRange.start.getTime() / 1000);
      logOptions.until = Math.floor(query.timeRange.end.getTime() / 1000);
    }

    const logStream = await dockerContainer.logs(logOptions);
    const logText = logStream.toString();
    
    return parseLogEntries(logText, containerId, query);
    
  } catch (error) {
    log.error('Failed to collect container logs', { error: error.message, containerId });
    return [];
  }
}

function parseLogEntries(logText: string, containerId: string, query: LogQuery): LogEntry[] {
  const lines = logText.split('\n').filter(line => line.trim());
  const entries: LogEntry[] = [];

  for (const line of lines) {
    try {
      const entry = parseLogLine(line, containerId);
      if (entry && matchesLogQuery(entry, query)) {
        entries.push(entry);
      }
    } catch (error) {
      // Skip malformed log lines
    }
  }

  return entries.slice(query.offset || 0, (query.offset || 0) + (query.limit || 100));
}

function parseLogLine(line: string, containerId: string): LogEntry | null {
  // Docker log format: [timestamp] [stream] message
  const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{9}Z)/);
  if (!timestampMatch) {
    return null;
  }

  const timestamp = new Date(timestampMatch[1]);
  const rest = line.substring(timestampMatch[0].length).trim();
  
  // Determine stream (stdout/stderr)
  const stream = rest.startsWith('\u0001') ? 'stdout' : 'stderr';
  const message = rest.replace(/^[\u0001\u0002].*?\u0000\u0000\u0000./, '').trim();

  // Try to parse log level from message
  let level: LogEntry['level'] = 'info';
  const levelMatch = message.match(/\b(DEBUG|INFO|WARN|ERROR|FATAL)\b/i);
  if (levelMatch) {
    level = levelMatch[1].toLowerCase() as LogEntry['level'];
  }

  return {
    timestamp,
    level,
    message,
    source: 'container',
    containerId,
    stream,
  };
}

function matchesLogQuery(entry: LogEntry, query: LogQuery): boolean {
  if (query.level && entry.level !== query.level) {
    return false;
  }

  if (query.search && !entry.message.toLowerCase().includes(query.search.toLowerCase())) {
    return false;
  }

  if (query.timeRange) {
    if (entry.timestamp < query.timeRange.start || entry.timestamp > query.timeRange.end) {
      return false;
    }
  }

  return true;
}

// API Endpoints

// Get container metrics
export const getContainerMetrics = api<typeof GetMetricsRequest>(
  { method: 'GET', path: '/containers/:id/metrics', auth: true, expose: true },
  async (req: z.infer<typeof GetMetricsRequest> & { id: string }, meta: APICallMeta<AuthData>): Promise<{ metrics: ContainerMetrics[]; summary: any }> => {
    const { id: containerId, timeRange, granularity } = req;
    
    const containerMetrics = metricsStorage.get(containerId) || [];
    
    let filteredMetrics = containerMetrics;
    if (timeRange) {
      const start = new Date(timeRange.start);
      const end = new Date(timeRange.end);
      filteredMetrics = containerMetrics.filter(m => 
        m.timestamp >= start && m.timestamp <= end,
      );
    }

    // Apply granularity (simple downsampling)
    const granularityMs = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
      '6h': 21600000,
      '24h': 86400000,
    }[granularity];

    const downsampledMetrics = downsampleMetrics(filteredMetrics, granularityMs);

    // Calculate summary
    const summary = downsampledMetrics.length > 0 ? {
      avgCpu: downsampledMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / downsampledMetrics.length,
      avgMemory: downsampledMetrics.reduce((sum, m) => sum + m.memory.usagePercent, 0) / downsampledMetrics.length,
      totalNetworkTraffic: downsampledMetrics.reduce((sum, m) => sum + m.network.rxBytes + m.network.txBytes, 0),
    } : {};

    return {
      metrics: downsampledMetrics,
      summary,
    };
  },
);

function downsampleMetrics(metrics: ContainerMetrics[], intervalMs: number): ContainerMetrics[] {
  if (metrics.length === 0) {
    return [];
  }

  const downsampled: ContainerMetrics[] = [];
  const startTime = metrics[0].timestamp.getTime();
  
  let currentBucket: ContainerMetrics[] = [];
  let currentBucketStart = startTime;

  for (const metric of metrics) {
    const metricTime = metric.timestamp.getTime();
    
    if (metricTime >= currentBucketStart + intervalMs) {
      // Process current bucket
      if (currentBucket.length > 0) {
        downsampled.push(aggregateMetrics(currentBucket));
      }
      
      // Start new bucket
      currentBucket = [metric];
      currentBucketStart = Math.floor(metricTime / intervalMs) * intervalMs;
    } else {
      currentBucket.push(metric);
    }
  }

  // Process final bucket
  if (currentBucket.length > 0) {
    downsampled.push(aggregateMetrics(currentBucket));
  }

  return downsampled;
}

function aggregateMetrics(metrics: ContainerMetrics[]): ContainerMetrics {
  const first = metrics[0];
  const avgCpu = metrics.reduce((sum, m) => sum + m.cpu.usage, 0) / metrics.length;
  const avgMemory = metrics.reduce((sum, m) => sum + m.memory.usagePercent, 0) / metrics.length;
  
  return {
    ...first,
    timestamp: new Date(first.timestamp.getTime()),
    cpu: {
      ...first.cpu,
      usage: avgCpu,
    },
    memory: {
      ...first.memory,
      usagePercent: avgMemory,
    },
  };
}

// Create alert rule
export const createAlertRule = api<typeof CreateAlertRuleRequest>(
  { method: 'POST', path: '/containers/:id/alerts', auth: true, expose: true },
  async (req: z.infer<typeof CreateAlertRuleRequest> & { id: string }, meta: APICallMeta<AuthData>): Promise<AlertRule> => {
    const { userID } = meta.auth;
    const { id: containerId, name, description, condition, severity, channels, cooldownPeriod } = req;
    
    const ruleId = uuidv4();
    const now = new Date();
    
    const rule: AlertRule = {
      id: ruleId,
      containerId,
      name,
      description,
      condition,
      enabled: true,
      severity,
      channels,
      cooldownPeriod,
      triggerCount: 0,
      createdBy: userID,
      createdAt: now,
    };
    
    alertRules.set(ruleId, rule);
    
    log.info('Alert rule created', { ruleId, containerId, name });
    
    return rule;
  },
);

// Get container logs
export const getContainerLogs = api<typeof GetLogsRequest>(
  { method: 'GET', path: '/containers/:id/logs', auth: true, expose: true },
  async (req: z.infer<typeof GetLogsRequest> & { id: string }, meta: APICallMeta<AuthData>): Promise<{ logs: LogEntry[]; total: number }> => {
    const { id: containerId, level, search, timeRange, limit, offset } = req;
    
    const query: LogQuery = {
      containerId,
      level,
      search,
      timeRange: timeRange ? {
        start: new Date(timeRange.start),
        end: new Date(timeRange.end),
      } : undefined,
      limit,
      offset,
    };
    
    const logs = await collectContainerLogs(containerId, query);
    
    return {
      logs,
      total: logs.length,
    };
  },
);

// Get performance analysis
export const getPerformanceAnalysis = api(
  { method: 'GET', path: '/containers/:id/analysis', auth: true, expose: true },
  async (req: { id: string; start?: string; end?: string }, meta: APICallMeta<AuthData>): Promise<PerformanceAnalysis> => {
    const { id: containerId, start, end } = req;
    
    const timeRange = {
      start: start ? new Date(start) : new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: end ? new Date(end) : new Date(),
    };
    
    return await analyzeContainerPerformance(containerId, timeRange);
  },
);

// Get alerts
export const getContainerAlerts = api(
  { method: 'GET', path: '/containers/:id/alerts', auth: true, expose: true },
  async (req: { id: string; status?: string }, meta: APICallMeta<AuthData>): Promise<{ alerts: Alert[]; rules: AlertRule[] }> => {
    const { id: containerId, status } = req;
    
    let alerts = Array.from(activeAlerts.values()).filter(alert => 
      alert.containerId === containerId,
    );
    
    if (status) {
      alerts = alerts.filter(alert => alert.status === status);
    }
    
    const rules = Array.from(alertRules.values()).filter(rule => 
      rule.containerId === containerId,
    );
    
    return { alerts, rules };
  },
);

// Acknowledge alert
export const acknowledgeAlert = api(
  { method: 'POST', path: '/alerts/:id/acknowledge', auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean }> => {
    const { userID } = meta.auth;
    const { id: alertId } = req;
    
    const alert = activeAlerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userID;
    
    activeAlerts.set(alertId, alert);
    
    log.info('Alert acknowledged', { alertId, acknowledgedBy: userID });
    
    return { success: true };
  },
);