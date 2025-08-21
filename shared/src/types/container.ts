// Container management types
export interface Container {
  id: string;
  projectId: string;
  dockerContainerId?: string;
  name: string;
  image: string;
  status: ContainerStatus;
  ports: ContainerPort[];
  environment: Record<string, string>;
  volumes: ContainerVolume[];
  resources: ContainerResources;
  health: ContainerHealth;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type ContainerStatus = 
  | "creating" 
  | "running" 
  | "stopped" 
  | "error" 
  | "removed";

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

export interface ContainerLogs {
  logs: string;
  timestamp: Date;
}

export interface ContainerStats {
  cpuUsage: number; // Percentage
  memoryUsage: number; // Bytes
  memoryLimit: number; // Bytes
  networkRx: number; // Bytes
  networkTx: number; // Bytes
  diskRead: number; // Bytes
  diskWrite: number; // Bytes
  timestamp: Date;
}

export interface ContainerMetrics {
  id: string;
  containerId: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryLimit: number;
  networkRxBytes: number;
  networkTxBytes: number;
  diskReadBytes: number;
  diskWriteBytes: number;
  recordedAt: Date;
}

// Request/Response types
export interface CreateContainerRequest {
  projectId: string;
  name: string;
  image: string;
  ports?: ContainerPort[];
  environment?: Record<string, string>;
  volumes?: ContainerVolume[];
  resources?: Partial<ContainerResources>;
}

export interface UpdateContainerRequest {
  name?: string;
  environment?: Record<string, string>;
  resources?: Partial<ContainerResources>;
}

export interface ContainerActionRequest {
  action: "start" | "stop" | "restart" | "pause" | "unpause";
}

export interface ListContainersRequest {
  projectId?: string;
  status?: ContainerStatus;
  limit?: number;
  offset?: number;
}

export interface GetContainerLogsRequest {
  tail?: number;
  since?: string;
  follow?: boolean;
}

export interface ContainerResponse {
  success: boolean;
  container?: Container;
  containers?: Container[];
  total?: number;
  error?: string;
}

export interface ContainerActionResponse {
  success: boolean;
  status: ContainerStatus;
  message?: string;
}

export interface ContainerLogsResponse {
  logs: string;
  hasMore: boolean;
}

export interface ContainerStatsResponse {
  stats: ContainerStats;
  history?: ContainerStats[];
}