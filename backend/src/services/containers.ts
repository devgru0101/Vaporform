import { api, APICallMeta } from "encore.dev/api";
import log from "encore.dev/log";
import { z } from "zod";
import { AuthData } from "./auth";
import Docker from "dockerode";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs/promises";
import * as path from "path";
import { promisify } from "util";
import { exec } from "child_process";
import crypto from "crypto";

// Docker client instance
const docker = new Docker();

// Enhanced container interfaces with advanced features
export interface Container {
  id: string;
  projectId: string;
  dockerContainerId?: string;
  name: string;
  image: string;
  status: "creating" | "running" | "stopped" | "error" | "removed" | "building" | "deploying" | "scaling" | "updating";
  ports: ContainerPort[];
  environment: Record<string, string>;
  volumes: ContainerVolume[];
  resources: ContainerResources;
  health: ContainerHealth;
  networking: ContainerNetworking;
  security: ContainerSecurity;
  scaling: ContainerScaling;
  monitoring: ContainerMonitoring;
  metadata: ContainerMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ContainerPort {
  internal: number;
  external: number;
  protocol: "tcp" | "udp";
}

export interface ContainerVolume {
  hostPath: string;
  containerPath: string;
  readOnly: boolean;
}

export interface ContainerResources {
  cpuLimit: number; // CPU units (0.1 = 100m)
  memoryLimit: number; // Memory in MB
  storageLimit: number; // Storage in MB
  cpuReservation?: number; // Reserved CPU
  memoryReservation?: number; // Reserved memory
  gpuLimit?: number; // GPU allocation
  networkBandwidth?: number; // Network bandwidth in Mbps
  iopsLimit?: number; // Disk I/O operations per second
}

export interface ContainerHealth {
  status: "healthy" | "unhealthy" | "starting" | "unknown";
  lastCheck: Date;
  failureCount: number;
  checks: ContainerHealthCheck[];
}

export interface ContainerHealthCheck {
  timestamp: Date;
  status: "pass" | "fail";
  output?: string;
  latency: number;
}

// New advanced container interfaces
export interface ContainerNetworking {
  networkMode: "bridge" | "host" | "overlay" | "macvlan" | "none";
  dnsConfig?: {
    nameservers: string[];
    search: string[];
    options: string[];
  };
  hostname?: string;
  domainname?: string;
  extraHosts?: { [hostname: string]: string };
  links?: string[];
  aliases?: string[];
  networkId?: string;
  ipAddress?: string;
  gateway?: string;
  subnetMask?: string;
  macAddress?: string;
  exposedServices?: ContainerService[];
}

export interface ContainerService {
  name: string;
  port: number;
  protocol: "http" | "https" | "tcp" | "udp" | "grpc";
  healthCheck?: {
    path?: string;
    interval: number;
    timeout: number;
    retries: number;
  };
  loadBalancing?: {
    strategy: "round_robin" | "least_connections" | "ip_hash";
    enabled: boolean;
  };
}

export interface ContainerSecurity {
  runAsUser?: number;
  runAsGroup?: number;
  readOnlyRootFilesystem?: boolean;
  allowPrivilegeEscalation?: boolean;
  dropCapabilities?: string[];
  addCapabilities?: string[];
  seLinuxOptions?: {
    user?: string;
    role?: string;
    type?: string;
    level?: string;
  };
  seccompProfile?: string;
  apparmorProfile?: string;
  noNewPrivileges?: boolean;
  userNamespaceMode?: string;
  privileged?: boolean;
  secrets?: ContainerSecret[];
}

export interface ContainerSecret {
  name: string;
  mountPath: string;
  mode?: number;
  uid?: number;
  gid?: number;
}

export interface ContainerScaling {
  minReplicas: number;
  maxReplicas: number;
  currentReplicas: number;
  targetCpuUtilization?: number;
  targetMemoryUtilization?: number;
  scaleUpCooldown?: number; // seconds
  scaleDownCooldown?: number; // seconds
  autoScalingEnabled: boolean;
  customMetrics?: ScalingMetric[];
}

export interface ScalingMetric {
  name: string;
  type: "cpu" | "memory" | "network" | "custom";
  targetValue: number;
  currentValue?: number;
}

export interface ContainerMonitoring {
  metricsEnabled: boolean;
  loggingEnabled: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
  logRetentionDays: number;
  metricsRetentionDays: number;
  alerting?: {
    enabled: boolean;
    rules: AlertRule[];
  };
  tracing?: {
    enabled: boolean;
    samplingRate: number;
    jaegerEndpoint?: string;
  };
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: number; // seconds
  severity: "low" | "medium" | "high" | "critical";
  channels: string[]; // notification channels
}

export interface ContainerMetadata {
  labels: { [key: string]: string };
  annotations: { [key: string]: string };
  techStack?: TechStack;
  buildInfo?: BuildInfo;
  deploymentInfo?: DeploymentInfo;
}

export interface TechStack {
  language: string;
  framework?: string;
  runtime?: string;
  buildTool?: string;
  packageManager?: string;
  dependencies?: string[];
}

export interface BuildInfo {
  dockerfile?: string;
  buildArgs?: { [key: string]: string };
  buildContext?: string;
  buildStage?: string;
  multistage?: boolean;
  baseImage?: string;
  finalImage?: string;
  buildTime?: Date;
  buildDuration?: number; // seconds
}

export interface DeploymentInfo {
  strategy: "rolling" | "blue_green" | "canary" | "recreate";
  rolloutStatus?: "progressing" | "complete" | "failed" | "paused";
  revision?: number;
  progressDeadlineSeconds?: number;
  minReadySeconds?: number;
}

// Request/Response schemas
const CreateContainerRequest = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(100),
  image: z.string().min(1),
  ports: z.array(z.object({
    internal: z.number().min(1).max(65535),
    external: z.number().min(1).max(65535),
    protocol: z.enum(["tcp", "udp"]).default("tcp"),
  })).default([]),
  environment: z.record(z.string()).default({}),
  volumes: z.array(z.object({
    hostPath: z.string(),
    containerPath: z.string(),
    readOnly: z.boolean().default(false),
  })).default([]),
  resources: z.object({
    cpuLimit: z.number().min(0.1).max(8).default(1),
    memoryLimit: z.number().min(128).max(8192).default(512),
    storageLimit: z.number().min(100).max(10240).default(1024),
    cpuReservation: z.number().min(0.1).max(8).optional(),
    memoryReservation: z.number().min(128).max(8192).optional(),
    gpuLimit: z.number().min(0).max(4).optional(),
    networkBandwidth: z.number().min(1).max(10000).optional(),
    iopsLimit: z.number().min(100).max(100000).optional(),
  }).default({}),
  networking: z.object({
    networkMode: z.enum(["bridge", "host", "overlay", "macvlan", "none"]).default("bridge"),
    hostname: z.string().optional(),
    domainname: z.string().optional(),
    dnsConfig: z.object({
      nameservers: z.array(z.string()),
      search: z.array(z.string()),
      options: z.array(z.string()),
    }).optional(),
  }).optional(),
  security: z.object({
    runAsUser: z.number().optional(),
    runAsGroup: z.number().optional(),
    readOnlyRootFilesystem: z.boolean().default(false),
    allowPrivilegeEscalation: z.boolean().default(false),
    dropCapabilities: z.array(z.string()).default([]),
    addCapabilities: z.array(z.string()).default([]),
    privileged: z.boolean().default(false),
  }).optional(),
  scaling: z.object({
    minReplicas: z.number().min(1).default(1),
    maxReplicas: z.number().min(1).default(1),
    autoScalingEnabled: z.boolean().default(false),
    targetCpuUtilization: z.number().min(1).max(100).optional(),
    targetMemoryUtilization: z.number().min(1).max(100).optional(),
  }).optional(),
  monitoring: z.object({
    metricsEnabled: z.boolean().default(true),
    loggingEnabled: z.boolean().default(true),
    logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
    logRetentionDays: z.number().min(1).max(365).default(30),
    metricsRetentionDays: z.number().min(1).max(365).default(30),
  }).optional(),
});

const UpdateContainerRequest = z.object({
  name: z.string().min(1).max(100).optional(),
  environment: z.record(z.string()).optional(),
  resources: z.object({
    cpuLimit: z.number().min(0.1).max(8),
    memoryLimit: z.number().min(128).max(8192),
    storageLimit: z.number().min(100).max(10240),
  }).optional(),
});

const ContainerActionRequest = z.object({
  action: z.enum(["start", "stop", "restart", "pause", "unpause"]),
});

const ContainerResponse = z.object({
  id: z.string(),
  projectId: z.string(),
  dockerContainerId: z.string().optional(),
  name: z.string(),
  image: z.string(),
  status: z.enum(["creating", "running", "stopped", "error", "removed"]),
  ports: z.array(z.object({
    internal: z.number(),
    external: z.number(),
    protocol: z.enum(["tcp", "udp"]),
  })),
  environment: z.record(z.string()),
  volumes: z.array(z.object({
    hostPath: z.string(),
    containerPath: z.string(),
    readOnly: z.boolean(),
  })),
  resources: z.object({
    cpuLimit: z.number(),
    memoryLimit: z.number(),
    storageLimit: z.number(),
  }),
  health: z.object({
    status: z.enum(["healthy", "unhealthy", "starting", "unknown"]),
    lastCheck: z.date(),
    failureCount: z.number(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Mock container storage (replace with database)
const containers: Map<string, Container> = new Map();

// Port management for external ports
const allocatedPorts: Set<number> = new Set();

// Network management
const containerNetworks: Map<string, string> = new Map();

// Container replicas for scaling
const containerReplicas: Map<string, string[]> = new Map();

// Container monitoring data
const containerMetrics: Map<string, any[]> = new Map();

// Helper function to allocate available port
function allocatePort(preferredPort?: number): number {
  if (preferredPort && !allocatedPorts.has(preferredPort)) {
    allocatedPorts.add(preferredPort);
    return preferredPort;
  }
  
  // Find available port in range 3000-9000
  for (let port = 3000; port <= 9000; port++) {
    if (!allocatedPorts.has(port)) {
      allocatedPorts.add(port);
      return port;
    }
  }
  
  throw new Error("No available ports");
}

// Advanced helper functions for container orchestration
const execAsync = promisify(exec);

// Docker network management
async function createContainerNetwork(projectId: string, networkMode: string = "bridge"): Promise<string> {
  const networkName = `vaporform_${projectId}_network`;
  
  try {
    // Check if network already exists
    const networks = await docker.listNetworks({
      filters: { name: [networkName] }
    });
    
    if (networks.length > 0) {
      return networks[0].Id;
    }
    
    // Create new network
    const network = await docker.createNetwork({
      Name: networkName,
      Driver: networkMode === "bridge" ? "bridge" : networkMode,
      Labels: {
        'vaporform.project.id': projectId,
        'vaporform.managed': 'true'
      },
      IPAM: {
        Config: [{
          Subnet: '172.20.0.0/16',
          Gateway: '172.20.0.1'
        }]
      }
    });
    
    return network.id;
  } catch (error) {
    log.error("Failed to create container network", { error: error.message, projectId });
    throw new Error(`Failed to create network: ${error.message}`);
  }
}

// Dockerfile generation based on tech stack
async function generateDockerfile(techStack: TechStack, projectPath: string): Promise<string> {
  const { language, framework, runtime, packageManager } = techStack;
  
  let dockerfile = "";
  
  switch (language.toLowerCase()) {
    case "javascript":
    case "typescript":
      dockerfile = await generateNodeDockerfile(framework, runtime, packageManager);
      break;
    case "python":
      dockerfile = await generatePythonDockerfile(framework, runtime);
      break;
    case "java":
      dockerfile = await generateJavaDockerfile(framework, runtime);
      break;
    case "go":
      dockerfile = await generateGoDockerfile(framework);
      break;
    default:
      dockerfile = generateGenericDockerfile(language, runtime);
  }
  
  // Write Dockerfile to project directory
  const dockerfilePath = path.join(projectPath, "Dockerfile");
  await fs.writeFile(dockerfilePath, dockerfile);
  
  return dockerfilePath;
}

async function generateNodeDockerfile(framework?: string, runtime: string = "18", packageManager: string = "npm"): Promise<string> {
  return `# Multi-stage build for Node.js application
FROM node:${runtime}-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
${packageManager === "yarn" ? "COPY yarn.lock ./" : ""}
${packageManager === "pnpm" ? "COPY pnpm-lock.yaml ./" : ""}

# Install dependencies
RUN ${packageManager} install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN ${packageManager} run build 2>/dev/null || echo "No build script found"

# Production stage
FROM node:${runtime}-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./
${packageManager === "yarn" ? "COPY yarn.lock ./" : ""}

# Install production dependencies only
RUN ${packageManager} install --production --frozen-lockfile && ${packageManager} cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist 2>/dev/null || echo "No dist directory"
COPY --from=builder --chown=nodejs:nodejs /app/build ./build 2>/dev/null || echo "No build directory"
COPY --from=builder --chown=nodejs:nodejs /app/public ./public 2>/dev/null || echo "No public directory"

# Copy source if no build output
COPY --chown=nodejs:nodejs . .

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node healthcheck.js || exit 1

EXPOSE 3000

CMD ["${packageManager}", "start"]
`;
}

async function generatePythonDockerfile(framework?: string, runtime: string = "3.11"): Promise<string> {
  return `# Multi-stage build for Python application
FROM python:${runtime}-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
COPY pyproject.toml . 2>/dev/null || echo "No pyproject.toml"

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:${runtime}-slim AS production

WORKDIR /app

# Create non-root user
RUN useradd --create-home --shell /bin/bash app

# Copy Python packages from builder
COPY --from=builder /root/.local /home/app/.local

# Copy application code
COPY --chown=app:app . .

USER app

# Update PATH for user packages
ENV PATH=/home/app/.local/bin:$PATH

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD python healthcheck.py || exit 1

EXPOSE 8000

${framework === "django" ? 'CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]' : 
  framework === "flask" ? 'CMD ["python", "app.py"]' :
  framework === "fastapi" ? 'CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]' :
  'CMD ["python", "main.py"]'}
`;
}

async function generateJavaDockerfile(framework?: string, runtime: string = "17"): Promise<string> {
  return `# Multi-stage build for Java application
FROM openjdk:${runtime}-jdk-slim AS builder

WORKDIR /app

# Copy build files
COPY pom.xml . 2>/dev/null || echo "No pom.xml"
COPY build.gradle . 2>/dev/null || echo "No build.gradle"
COPY gradlew . 2>/dev/null || echo "No gradlew"
COPY gradle ./gradle 2>/dev/null || echo "No gradle directory"

# Copy source code
COPY src ./src

# Build application
RUN if [ -f "pom.xml" ]; then ./mvnw package -DskipTests; fi
RUN if [ -f "build.gradle" ]; then ./gradlew build -x test; fi

# Production stage
FROM openjdk:${runtime}-jre-slim AS production

WORKDIR /app

# Create non-root user
RUN useradd --create-home --shell /bin/bash app

# Copy JAR file
COPY --from=builder --chown=app:app /app/target/*.jar app.jar 2>/dev/null || echo "Maven build"
COPY --from=builder --chown=app:app /app/build/libs/*.jar app.jar 2>/dev/null || echo "Gradle build"

USER app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
`;
}

async function generateGoDockerfile(framework?: string): Promise<string> {
  return `# Multi-stage build for Go application
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Production stage
FROM alpine:latest AS production

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Create non-root user
RUN adduser -D -s /bin/sh app

# Copy binary from builder
COPY --from=builder --chown=app:app /app/main .

USER app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["./main"]
`;
}

function generateGenericDockerfile(language: string, runtime?: string): string {
  return `# Generic Dockerfile for ${language}
FROM ${language}:${runtime || 'latest'}

WORKDIR /app

# Copy application files
COPY . .

# Install dependencies (modify as needed)
RUN echo "Install dependencies for ${language}"

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
USER app

EXPOSE 8080

CMD ["echo", "Configure your application startup command"]
`;
}

// Container health monitoring
async function checkContainerHealth(containerId: string): Promise<ContainerHealth> {
  const container = containers.get(containerId);
  if (!container || !container.dockerContainerId) {
    throw new Error("Container not found or not initialized");
  }

  try {
    const dockerContainer = docker.getContainer(container.dockerContainerId);
    const info = await dockerContainer.inspect();
    const stats = await dockerContainer.stats({ stream: false });

    const now = new Date();
    const isHealthy = info.State.Running && (info.State.Health?.Status === 'healthy' || !info.State.Health);
    
    const healthCheck: ContainerHealthCheck = {
      timestamp: now,
      status: isHealthy ? "pass" : "fail",
      output: info.State.Health?.Log?.[0]?.Output || "",
      latency: 0
    };

    const health: ContainerHealth = {
      status: isHealthy ? "healthy" : "unhealthy",
      lastCheck: now,
      failureCount: info.State.Health?.FailingStreak || 0,
      checks: [healthCheck, ...(container.health.checks || [])].slice(0, 10)
    };

    // Update container health
    container.health = health;
    containers.set(containerId, container);

    return health;
  } catch (error) {
    log.error("Health check failed", { error: error.message, containerId });
    
    const failedHealth: ContainerHealth = {
      status: "unhealthy",
      lastCheck: new Date(),
      failureCount: (container.health.failureCount || 0) + 1,
      checks: [{
        timestamp: new Date(),
        status: "fail",
        output: error.message,
        latency: 0
      }, ...(container.health.checks || [])].slice(0, 10)
    };

    container.health = failedHealth;
    containers.set(containerId, container);

    return failedHealth;
  }
}

// Container scaling
async function scaleContainer(containerId: string, replicas: number): Promise<void> {
  const container = containers.get(containerId);
  if (!container) {
    throw new Error("Container not found");
  }

  const currentReplicas = containerReplicas.get(containerId) || [];
  const currentCount = currentReplicas.length + 1; // Include original container

  if (replicas === currentCount) {
    return; // Already at desired scale
  }

  if (replicas > currentCount) {
    // Scale up
    const replicasToCreate = replicas - currentCount;
    const newReplicas: string[] = [];

    for (let i = 0; i < replicasToCreate; i++) {
      const replicaId = uuidv4();
      const replicaName = `${container.name}-replica-${i + 1}`;
      
      const replicaContainer: Container = {
        ...container,
        id: replicaId,
        name: replicaName,
        dockerContainerId: undefined,
        status: "creating",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Allocate new ports for replica
      replicaContainer.ports = container.ports.map(port => ({
        ...port,
        external: allocatePort()
      }));

      const dockerContainerId = await createDockerContainer(replicaContainer);
      replicaContainer.dockerContainerId = dockerContainerId;

      const dockerContainer = docker.getContainer(dockerContainerId);
      await dockerContainer.start();

      replicaContainer.status = "running";
      containers.set(replicaId, replicaContainer);
      newReplicas.push(replicaId);
    }

    containerReplicas.set(containerId, [...currentReplicas, ...newReplicas]);
  } else {
    // Scale down
    const replicasToRemove = currentCount - replicas;
    const replicasToDelete = currentReplicas.slice(-replicasToRemove);

    for (const replicaId of replicasToDelete) {
      const replica = containers.get(replicaId);
      if (replica && replica.dockerContainerId) {
        const dockerContainer = docker.getContainer(replica.dockerContainerId);
        try {
          await dockerContainer.stop();
          await dockerContainer.remove();
        } catch (error) {
          log.warn("Failed to remove replica", { error: error.message, replicaId });
        }

        // Release ports
        replica.ports.forEach(port => allocatedPorts.delete(port.external));
        containers.delete(replicaId);
      }
    }

    const remainingReplicas = currentReplicas.filter(id => !replicasToDelete.includes(id));
    containerReplicas.set(containerId, remainingReplicas);
  }

  // Update scaling info
  container.scaling.currentReplicas = replicas;
  container.updatedAt = new Date();
  containers.set(containerId, container);
}

// Auto-scaling based on metrics
async function checkAutoScaling(containerId: string): Promise<void> {
  const container = containers.get(containerId);
  if (!container || !container.scaling.autoScalingEnabled) {
    return;
  }

  const { scaling } = container;
  const { minReplicas, maxReplicas, targetCpuUtilization, targetMemoryUtilization } = scaling;

  try {
    // Get current metrics
    if (container.dockerContainerId) {
      const dockerContainer = docker.getContainer(container.dockerContainerId);
      const stats = await dockerContainer.stats({ stream: false });

      const cpuUsage = calculateCpuUsage(stats);
      const memoryUsage = calculateMemoryUsage(stats);

      let shouldScaleUp = false;
      let shouldScaleDown = false;

      if (targetCpuUtilization && cpuUsage > targetCpuUtilization) {
        shouldScaleUp = true;
      }
      if (targetMemoryUtilization && memoryUsage > targetMemoryUtilization) {
        shouldScaleUp = true;
      }

      if (targetCpuUtilization && cpuUsage < targetCpuUtilization * 0.5) {
        shouldScaleDown = true;
      }
      if (targetMemoryUtilization && memoryUsage < targetMemoryUtilization * 0.5) {
        shouldScaleDown = true;
      }

      const currentReplicas = scaling.currentReplicas;

      if (shouldScaleUp && currentReplicas < maxReplicas) {
        await scaleContainer(containerId, Math.min(currentReplicas + 1, maxReplicas));
        log.info("Auto-scaled up", { containerId, newReplicas: currentReplicas + 1 });
      } else if (shouldScaleDown && currentReplicas > minReplicas) {
        await scaleContainer(containerId, Math.max(currentReplicas - 1, minReplicas));
        log.info("Auto-scaled down", { containerId, newReplicas: currentReplicas - 1 });
      }
    }
  } catch (error) {
    log.error("Auto-scaling check failed", { error: error.message, containerId });
  }
}

function calculateCpuUsage(stats: any): number {
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const numberCpus = stats.cpu_stats.online_cpus;
  
  if (systemDelta > 0 && cpuDelta > 0) {
    return (cpuDelta / systemDelta) * numberCpus * 100;
  }
  return 0;
}

function calculateMemoryUsage(stats: any): number {
  if (stats.memory_stats.limit > 0) {
    return (stats.memory_stats.usage / stats.memory_stats.limit) * 100;
  }
  return 0;
}

// Container security scanning
async function scanContainerSecurity(image: string): Promise<any> {
  try {
    // Use Docker Scout or similar tool for security scanning
    const { stdout } = await execAsync(`docker scout cves ${image} --format json || echo "{}"`);
    return JSON.parse(stdout || "{}");
  } catch (error) {
    log.warn("Security scan failed", { error: error.message, image });
    return {};
  }
}

// Enhanced Docker container creation with advanced features
async function createDockerContainer(container: Container): Promise<string> {
  const portBindings: any = {};
  const exposedPorts: any = {};
  
  // Setup port bindings
  container.ports.forEach(port => {
    const key = `${port.internal}/${port.protocol}`;
    exposedPorts[key] = {};
    portBindings[key] = [{ HostPort: port.external.toString() }];
  });
  
  // Setup volume bindings
  const binds = container.volumes.map(vol => 
    `${vol.hostPath}:${vol.containerPath}${vol.readOnly ? ':ro' : ''}`
  );
  
  // Setup environment variables
  const envVars = Object.entries(container.environment).map(
    ([key, value]) => `${key}=${value}`
  );

  // Setup networking
  const networkMode = container.networking?.networkMode || "bridge";
  const networkId = networkMode === "bridge" ? 
    await createContainerNetwork(container.projectId, networkMode) : 
    undefined;

  // Setup security options
  const securityOpts: string[] = [];
  if (container.security) {
    if (container.security.seccompProfile) {
      securityOpts.push(`seccomp=${container.security.seccompProfile}`);
    }
    if (container.security.apparmorProfile) {
      securityOpts.push(`apparmor=${container.security.apparmorProfile}`);
    }
    if (container.security.noNewPrivileges) {
      securityOpts.push('no-new-privileges');
    }
  }

  // Setup capability drops and adds
  const capDrop = container.security?.dropCapabilities || ["ALL"];
  const capAdd = container.security?.addCapabilities || [];

  // Setup resource limits
  const resources = container.resources;
  const hostConfig: any = {
    PortBindings: portBindings,
    Binds: binds,
    Memory: resources.memoryLimit * 1024 * 1024, // Convert MB to bytes
    MemoryReservation: resources.memoryReservation ? resources.memoryReservation * 1024 * 1024 : undefined,
    CpuQuota: Math.floor(resources.cpuLimit * 100000), // Convert to quota
    CpuReservation: resources.cpuReservation ? Math.floor(resources.cpuReservation * 100000) : undefined,
    CpuPeriod: 100000,
    RestartPolicy: { Name: "unless-stopped" },
    SecurityOpt: securityOpts,
    CapDrop: capDrop,
    CapAdd: capAdd,
    ReadonlyRootfs: container.security?.readOnlyRootFilesystem || false,
    Privileged: container.security?.privileged || false,
    UsernsMode: container.security?.userNamespaceMode,
  };

  // Add storage limit if specified
  if (resources.storageLimit) {
    hostConfig.StorageOpt = {
      size: `${resources.storageLimit}M`
    };
  }

  // Add GPU support if specified
  if (resources.gpuLimit && resources.gpuLimit > 0) {
    hostConfig.DeviceRequests = [{
      Driver: "nvidia",
      Count: resources.gpuLimit,
      Capabilities: [["gpu"]]
    }];
  }

  // Add IOPS limits if specified
  if (resources.iopsLimit) {
    hostConfig.BlkioDeviceReadIOps = [{
      Path: "/dev/sda",
      Rate: resources.iopsLimit
    }];
    hostConfig.BlkioDeviceWriteIOps = [{
      Path: "/dev/sda", 
      Rate: resources.iopsLimit
    }];
  }

  // Setup network-specific configuration
  if (networkId) {
    hostConfig.NetworkMode = networkId;
  }

  // Create container configuration
  const containerConfig: any = {
    Image: container.image,
    name: `vaporform_${container.projectId}_${container.name}`,
    Env: envVars,
    ExposedPorts: exposedPorts,
    HostConfig: hostConfig,
    Labels: {
      'vaporform.project.id': container.projectId,
      'vaporform.container.id': container.id,
      'vaporform.managed': 'true',
      'vaporform.tech.stack': container.metadata?.techStack?.language || 'unknown',
      'vaporform.monitoring.enabled': container.monitoring?.metricsEnabled ? 'true' : 'false',
      ...container.metadata?.labels
    },
    User: container.security?.runAsUser ? 
      `${container.security.runAsUser}${container.security.runAsGroup ? ':' + container.security.runAsGroup : ''}` : 
      undefined,
  };

  // Add hostname and domainname if specified
  if (container.networking?.hostname) {
    containerConfig.Hostname = container.networking.hostname;
  }
  if (container.networking?.domainname) {
    containerConfig.Domainname = container.networking.domainname;
  }

  // Add extra hosts
  if (container.networking?.extraHosts) {
    containerConfig.HostConfig.ExtraHosts = Object.entries(container.networking.extraHosts)
      .map(([hostname, ip]) => `${hostname}:${ip}`);
  }

  // Add DNS configuration
  if (container.networking?.dnsConfig) {
    const { dnsConfig } = container.networking;
    if (dnsConfig.nameservers?.length) {
      containerConfig.HostConfig.Dns = dnsConfig.nameservers;
    }
    if (dnsConfig.search?.length) {
      containerConfig.HostConfig.DnsSearch = dnsConfig.search;
    }
    if (dnsConfig.options?.length) {
      containerConfig.HostConfig.DnsOptions = dnsConfig.options;
    }
  }

  // Add health check if monitoring is enabled
  if (container.monitoring?.metricsEnabled) {
    containerConfig.Healthcheck = {
      Test: ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
      Interval: 30000000000, // 30 seconds in nanoseconds
      Timeout: 3000000000,   // 3 seconds in nanoseconds
      StartPeriod: 5000000000, // 5 seconds in nanoseconds
      Retries: 3
    };
  }

  try {
    // Perform security scan before creating container
    if (container.security) {
      const securityScanResult = await scanContainerSecurity(container.image);
      if (securityScanResult.critical > 0) {
        log.warn("Critical vulnerabilities found in image", { 
          image: container.image, 
          critical: securityScanResult.critical 
        });
      }
    }

    const dockerContainer = await docker.createContainer(containerConfig);
    
    // Connect to custom network if specified
    if (networkId && container.networking?.networkMode === "bridge") {
      const network = docker.getNetwork(networkId);
      await network.connect({
        Container: dockerContainer.id,
        EndpointConfig: {
          IPAMConfig: container.networking.ipAddress ? {
            IPv4Address: container.networking.ipAddress
          } : undefined,
          Aliases: container.networking.aliases || []
        }
      });
    }
    
    return dockerContainer.id;
  } catch (error) {
    log.error("Failed to create Docker container", { error: error.message });
    throw new Error(`Failed to create container: ${error.message}`);
  }
}

// Create container endpoint
export const createContainer = api<typeof CreateContainerRequest, typeof ContainerResponse>(
  { method: "POST", path: "/containers", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof ContainerResponse>> => {
    const { userID } = meta.auth;
    const { projectId, name, image, ports, environment, volumes, resources } = req;
    
    log.info("Creating container", { projectId, name, image, userID });
    
    const containerId = uuidv4();
    const now = new Date();
    
    // Allocate external ports
    const allocatedPortMappings = ports.map(port => ({
      internal: port.internal,
      external: allocatePort(port.external),
      protocol: port.protocol,
    }));
    
    const container: Container = {
      id: containerId,
      projectId,
      name,
      image,
      status: "creating",
      ports: allocatedPortMappings,
      environment: {
        ...environment,
        VAPORFORM_PROJECT_ID: projectId,
        VAPORFORM_CONTAINER_ID: containerId,
      },
      volumes,
      resources: {
        cpuLimit: resources.cpuLimit || 1,
        memoryLimit: resources.memoryLimit || 512,
        storageLimit: resources.storageLimit || 1024,
      },
      health: {
        status: "starting",
        lastCheck: now,
        failureCount: 0,
        checks: [],
      },
      createdAt: now,
      updatedAt: now,
      createdBy: userID,
    };
    
    try {
      // Create Docker container
      const dockerContainerId = await createDockerContainer(container);
      container.dockerContainerId = dockerContainerId;
      
      // Start the container
      const dockerContainer = docker.getContainer(dockerContainerId);
      await dockerContainer.start();
      
      container.status = "running";
      container.health.status = "healthy";
      
      containers.set(containerId, container);
      
      log.info("Container created successfully", { 
        containerId, 
        dockerContainerId, 
        ports: allocatedPortMappings 
      });
      
      return container;
      
    } catch (error) {
      log.error("Container creation failed", { 
        error: error.message, 
        containerId, 
        projectId 
      });
      
      // Release allocated ports on failure
      allocatedPortMappings.forEach(port => allocatedPorts.delete(port.external));
      
      container.status = "error";
      containers.set(containerId, container);
      
      throw new Error(`Failed to create container: ${error.message}`);
    }
  }
);

// Get container endpoint
export const getContainer = api(
  { method: "GET", path: "/containers/:id", auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<Container> => {
    const { userID } = meta.auth;
    const { id } = req;
    
    const container = containers.get(id);
    if (!container) {
      throw new Error("Container not found");
    }
    
    // TODO: Add permission check based on project access
    
    // Update container status from Docker
    if (container.dockerContainerId) {
      try {
        const dockerContainer = docker.getContainer(container.dockerContainerId);
        const info = await dockerContainer.inspect();
        
        const statusMapping: Record<string, Container["status"]> = {
          'running': 'running',
          'exited': 'stopped',
          'created': 'stopped',
          'paused': 'stopped',
          'restarting': 'running',
          'removing': 'removed',
          'dead': 'error',
        };
        
        container.status = statusMapping[info.State.Status] || 'error';
        container.updatedAt = new Date();
        
        // Update health status
        if (info.State.Health) {
          container.health.status = info.State.Health.Status === 'healthy' ? 'healthy' : 'unhealthy';
          container.health.failureCount = info.State.Health.FailingStreak || 0;
        }
        
        containers.set(id, container);
      } catch (error) {
        log.error("Failed to inspect Docker container", { 
          error: error.message, 
          containerId: id 
        });
      }
    }
    
    return container;
  }
);

// List containers endpoint
export const listContainers = api(
  { method: "GET", path: "/containers", auth: true, expose: true },
  async (req: { projectId?: string; status?: string }, meta: APICallMeta<AuthData>): Promise<{ containers: Container[]; total: number }> => {
    const { userID } = meta.auth;
    const { projectId, status } = req;
    
    let filteredContainers = Array.from(containers.values());
    
    // Filter by project ID if specified
    if (projectId) {
      filteredContainers = filteredContainers.filter(c => c.projectId === projectId);
    }
    
    // Filter by status if specified
    if (status) {
      filteredContainers = filteredContainers.filter(c => c.status === status);
    }
    
    // TODO: Add permission filtering based on user's project access
    
    return {
      containers: filteredContainers,
      total: filteredContainers.length,
    };
  }
);

// Container action endpoint (start, stop, restart, etc.)
export const containerAction = api<typeof ContainerActionRequest>(
  { method: "POST", path: "/containers/:id/actions", auth: true, expose: true },
  async (req: z.infer<typeof ContainerActionRequest> & { id: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean; status: string }> => {
    const { userID } = meta.auth;
    const { id, action } = req;
    
    log.info("Container action requested", { containerId: id, action, userID });
    
    const container = containers.get(id);
    if (!container) {
      throw new Error("Container not found");
    }
    
    if (!container.dockerContainerId) {
      throw new Error("Container not properly initialized");
    }
    
    try {
      const dockerContainer = docker.getContainer(container.dockerContainerId);
      
      switch (action) {
        case "start":
          await dockerContainer.start();
          container.status = "running";
          break;
        case "stop":
          await dockerContainer.stop();
          container.status = "stopped";
          break;
        case "restart":
          await dockerContainer.restart();
          container.status = "running";
          break;
        case "pause":
          await dockerContainer.pause();
          container.status = "stopped";
          break;
        case "unpause":
          await dockerContainer.unpause();
          container.status = "running";
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      container.updatedAt = new Date();
      containers.set(id, container);
      
      log.info("Container action completed", { containerId: id, action, status: container.status });
      
      return { success: true, status: container.status };
      
    } catch (error) {
      log.error("Container action failed", { 
        error: error.message, 
        containerId: id, 
        action 
      });
      
      container.status = "error";
      container.updatedAt = new Date();
      containers.set(id, container);
      
      throw new Error(`Action failed: ${error.message}`);
    }
  }
);

// Delete container endpoint
export const deleteContainer = api(
  { method: "DELETE", path: "/containers/:id", auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean }> => {
    const { userID } = meta.auth;
    const { id } = req;
    
    log.info("Deleting container", { containerId: id, userID });
    
    const container = containers.get(id);
    if (!container) {
      throw new Error("Container not found");
    }
    
    try {
      // Stop and remove Docker container
      if (container.dockerContainerId) {
        const dockerContainer = docker.getContainer(container.dockerContainerId);
        
        try {
          await dockerContainer.stop();
        } catch (error) {
          // Container might already be stopped
          log.warn("Container stop failed during deletion", { error: error.message });
        }
        
        await dockerContainer.remove({ force: true });
      }
      
      // Release allocated ports
      container.ports.forEach(port => allocatedPorts.delete(port.external));
      
      // Remove from storage
      containers.delete(id);
      
      log.info("Container deleted successfully", { containerId: id });
      
      return { success: true };
      
    } catch (error) {
      log.error("Container deletion failed", { 
        error: error.message, 
        containerId: id 
      });
      
      throw new Error(`Failed to delete container: ${error.message}`);
    }
  }
);

// Get container logs endpoint
export const getContainerLogs = api(
  { method: "GET", path: "/containers/:id/logs", auth: true, expose: true },
  async (req: { id: string; tail?: number; since?: string }, meta: APICallMeta<AuthData>): Promise<{ logs: string }> => {
    const { userID } = meta.auth;
    const { id, tail = 100, since } = req;
    
    const container = containers.get(id);
    if (!container) {
      throw new Error("Container not found");
    }
    
    if (!container.dockerContainerId) {
      throw new Error("Container not properly initialized");
    }
    
    try {
      const dockerContainer = docker.getContainer(container.dockerContainerId);
      
      const logOptions: any = {
        stdout: true,
        stderr: true,
        tail,
        timestamps: true,
      };
      
      if (since) {
        logOptions.since = since;
      }
      
      const logStream = await dockerContainer.logs(logOptions);
      const logs = logStream.toString();
      
      return { logs };
      
    } catch (error) {
      log.error("Failed to get container logs", { 
        error: error.message, 
        containerId: id 
      });
      
      throw new Error(`Failed to get logs: ${error.message}`);
    }
  }
);

// Get container stats endpoint
export const getContainerStats = api(
  { method: "GET", path: "/containers/:id/stats", auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<{ stats: any }> => {
    const { userID } = meta.auth;
    const { id } = req;
    
    const container = containers.get(id);
    if (!container) {
      throw new Error("Container not found");
    }
    
    if (!container.dockerContainerId) {
      throw new Error("Container not properly initialized");
    }
    
    try {
      const dockerContainer = docker.getContainer(container.dockerContainerId);
      const stats = await dockerContainer.stats({ stream: false });
      
      return { stats };
      
    } catch (error) {
      log.error("Failed to get container stats", { 
        error: error.message, 
        containerId: id 
      });
      
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }
);