import { api, APICallMeta } from "encore.dev/api";
import log from "encore.dev/log";
import { z } from "zod";
import { AuthData } from "./auth";
import { v4 as uuidv4 } from "uuid";
import { Container } from "./containers";
import { Environment } from "./environment-provisioner";
import { DevServer } from "./dev-server";
import { ServiceMesh, APIGateway } from "./container-networking";
import { ContainerTemplate } from "./container-templates";
import { startContainerMonitoring, stopContainerMonitoring } from "./container-monitoring";

// Integration interfaces
export interface ContainerOrchestration {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  type: "development" | "staging" | "production";
  status: "creating" | "running" | "stopped" | "error" | "deploying" | "scaling";
  components: OrchestrationComponent[];
  configuration: OrchestrationConfig;
  deployment: DeploymentConfig;
  networking: NetworkingConfig;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
  metadata: OrchestrationMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface OrchestrationComponent {
  id: string;
  type: "container" | "environment" | "dev-server" | "service-mesh" | "api-gateway";
  name: string;
  resourceId: string; // ID of the actual resource
  status: "creating" | "running" | "stopped" | "error";
  dependencies: string[]; // IDs of components this depends on
  configuration: ComponentConfig;
  healthCheck: ComponentHealthCheck;
  metadata: { [key: string]: any };
}

export interface ComponentConfig {
  replicas?: number;
  autoScale?: boolean;
  resources?: {
    cpu?: string;
    memory?: string;
    storage?: string;
  };
  environment?: { [key: string]: string };
  labels?: { [key: string]: string };
  annotations?: { [key: string]: string };
}

export interface ComponentHealthCheck {
  enabled: boolean;
  endpoint?: string;
  interval: number;
  timeout: number;
  retries: number;
  status: "healthy" | "unhealthy" | "unknown";
  lastCheck?: Date;
  failureCount: number;
}

export interface OrchestrationConfig {
  strategy: "rolling" | "blue-green" | "canary" | "recreate";
  parallelism: number;
  maxUnavailable: number;
  maxSurge: number;
  progressDeadlineSeconds: number;
  rollbackConfig: {
    enabled: boolean;
    revisionHistoryLimit: number;
    autoRollback: boolean;
    triggerConditions: string[];
  };
  scheduling: {
    nodeSelector?: { [key: string]: string };
    tolerations?: Toleration[];
    affinity?: Affinity;
  };
}

export interface Toleration {
  key: string;
  operator: "Equal" | "Exists";
  value?: string;
  effect: "NoSchedule" | "PreferNoSchedule" | "NoExecute";
}

export interface Affinity {
  nodeAffinity?: NodeAffinity;
  podAffinity?: PodAffinity;
  podAntiAffinity?: PodAffinity;
}

export interface NodeAffinity {
  requiredDuringSchedulingIgnoredDuringExecution?: NodeSelector;
  preferredDuringSchedulingIgnoredDuringExecution?: PreferredSchedulingTerm[];
}

export interface NodeSelector {
  nodeSelectorTerms: NodeSelectorTerm[];
}

export interface NodeSelectorTerm {
  matchExpressions?: NodeSelectorRequirement[];
  matchFields?: NodeSelectorRequirement[];
}

export interface NodeSelectorRequirement {
  key: string;
  operator: "In" | "NotIn" | "Exists" | "DoesNotExist" | "Gt" | "Lt";
  values?: string[];
}

export interface PreferredSchedulingTerm {
  weight: number;
  preference: NodeSelectorTerm;
}

export interface PodAffinity {
  requiredDuringSchedulingIgnoredDuringExecution?: PodAffinityTerm[];
  preferredDuringSchedulingIgnoredDuringExecution?: WeightedPodAffinityTerm[];
}

export interface PodAffinityTerm {
  labelSelector?: LabelSelector;
  namespaces?: string[];
  topologyKey: string;
}

export interface WeightedPodAffinityTerm {
  weight: number;
  podAffinityTerm: PodAffinityTerm;
}

export interface LabelSelector {
  matchLabels?: { [key: string]: string };
  matchExpressions?: LabelSelectorRequirement[];
}

export interface LabelSelectorRequirement {
  key: string;
  operator: "In" | "NotIn" | "Exists" | "DoesNotExist";
  values?: string[];
}

export interface DeploymentConfig {
  imageRegistry: {
    url: string;
    credentials?: {
      username: string;
      password: string;
    };
  };
  buildConfig: {
    enabled: boolean;
    context: string;
    dockerfile: string;
    args?: { [key: string]: string };
    cache: boolean;
  };
  secrets: DeploymentSecret[];
  configMaps: ConfigMap[];
}

export interface DeploymentSecret {
  name: string;
  type: "Opaque" | "kubernetes.io/tls" | "kubernetes.io/dockerconfigjson";
  data: { [key: string]: string };
  stringData?: { [key: string]: string };
}

export interface ConfigMap {
  name: string;
  data: { [key: string]: string };
  binaryData?: { [key: string]: string };
}

export interface NetworkingConfig {
  serviceMeshEnabled: boolean;
  ingressEnabled: boolean;
  loadBalancerEnabled: boolean;
  networkPoliciesEnabled: boolean;
  dnsConfig: {
    enabled: boolean;
    domain?: string;
    subdomain?: string;
  };
  tls: {
    enabled: boolean;
    certificateSource: "letsencrypt" | "manual" | "cert-manager";
    certificates?: TLSCertificate[];
  };
}

export interface TLSCertificate {
  name: string;
  domains: string[];
  issuer?: string;
  secretName: string;
}

export interface MonitoringConfig {
  metricsEnabled: boolean;
  loggingEnabled: boolean;
  tracingEnabled: boolean;
  alerting: {
    enabled: boolean;
    rules: AlertingRule[];
    channels: AlertingChannel[];
  };
  dashboards: Dashboard[];
}

export interface AlertingRule {
  name: string;
  condition: string;
  duration: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  annotations: { [key: string]: string };
}

export interface AlertingChannel {
  name: string;
  type: "email" | "slack" | "webhook" | "pagerduty";
  config: { [key: string]: any };
  enabled: boolean;
}

export interface Dashboard {
  name: string;
  type: "grafana" | "custom";
  config: { [key: string]: any };
  panels: DashboardPanel[];
}

export interface DashboardPanel {
  title: string;
  type: "graph" | "stat" | "table" | "heatmap";
  query: string;
  config: { [key: string]: any };
}

export interface SecurityConfig {
  rbacEnabled: boolean;
  networkPoliciesEnabled: boolean;
  podSecurityPolicyEnabled: boolean;
  imageScanning: {
    enabled: boolean;
    scanOnBuild: boolean;
    scanOnDeploy: boolean;
    policy: "warn" | "block";
  };
  secrets: {
    encryption: boolean;
    rotation: boolean;
    provider: "kubernetes" | "vault" | "aws-secrets-manager";
  };
  compliance: {
    enabled: boolean;
    standards: string[];
    scanning: boolean;
  };
}

export interface OrchestrationMetadata {
  version: string;
  revision: number;
  labels: { [key: string]: string };
  annotations: { [key: string]: string };
  tags: string[];
  environment: string;
  team?: string;
  owner?: string;
  cost?: {
    center: string;
    budget: number;
  };
}

// Request/Response schemas
const CreateOrchestrationRequest = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["development", "staging", "production"]),
  templateId: z.string().optional(),
  components: z.array(z.object({
    type: z.enum(["container", "environment", "dev-server", "service-mesh", "api-gateway"]),
    name: z.string(),
    configuration: z.object({
      image: z.string().optional(),
      replicas: z.number().default(1),
      autoScale: z.boolean().default(false),
      resources: z.object({
        cpu: z.string().default("100m"),
        memory: z.string().default("128Mi"),
        storage: z.string().default("1Gi"),
      }).optional(),
      environment: z.record(z.string()).default({}),
    }),
    dependencies: z.array(z.string()).default([]),
  })),
  configuration: z.object({
    strategy: z.enum(["rolling", "blue-green", "canary", "recreate"]).default("rolling"),
    parallelism: z.number().default(1),
    maxUnavailable: z.number().default(1),
    maxSurge: z.number().default(1),
  }).optional(),
  networking: z.object({
    serviceMeshEnabled: z.boolean().default(false),
    ingressEnabled: z.boolean().default(true),
    loadBalancerEnabled: z.boolean().default(false),
  }).optional(),
  monitoring: z.object({
    metricsEnabled: z.boolean().default(true),
    loggingEnabled: z.boolean().default(true),
    tracingEnabled: z.boolean().default(false),
  }).optional(),
});

const UpdateOrchestrationRequest = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  configuration: z.object({
    strategy: z.enum(["rolling", "blue-green", "canary", "recreate"]).optional(),
    parallelism: z.number().optional(),
    maxUnavailable: z.number().optional(),
    maxSurge: z.number().optional(),
  }).optional(),
  networking: z.object({
    serviceMeshEnabled: z.boolean().optional(),
    ingressEnabled: z.boolean().optional(),
    loadBalancerEnabled: z.boolean().optional(),
  }).optional(),
});

const OrchestrationActionRequest = z.object({
  action: z.enum(["deploy", "scale", "rollback", "pause", "resume", "restart"]),
  parameters: z.object({
    replicas: z.number().optional(),
    revision: z.number().optional(),
    components: z.array(z.string()).optional(),
  }).optional(),
});

// Storage
const orchestrations: Map<string, ContainerOrchestration> = new Map();

// Import functions from other services
import { createContainer, getContainer, startContainer, stopContainer, deleteContainer } from "./containers";
import { createEnvironment, provisionEnvironment } from "./environment-provisioner";
import { createDevServer, startDevServerEndpoint, stopDevServerEndpoint } from "./dev-server";
import { createServiceMesh, createAPIGateway } from "./container-networking";
import { getTemplate } from "./container-templates";

// Orchestration management functions
async function deployOrchestration(orchestration: ContainerOrchestration): Promise<void> {
  log.info("Deploying orchestration", { 
    orchestrationId: orchestration.id, 
    name: orchestration.name,
    type: orchestration.type 
  });

  try {
    orchestration.status = "deploying";
    orchestrations.set(orchestration.id, orchestration);

    // Sort components by dependencies
    const sortedComponents = topologicalSort(orchestration.components);

    // Deploy components in dependency order
    for (const component of sortedComponents) {
      await deployComponent(orchestration, component);
    }

    // Setup networking if enabled
    if (orchestration.networking.serviceMeshEnabled) {
      await setupServiceMesh(orchestration);
    }

    if (orchestration.networking.ingressEnabled) {
      await setupIngress(orchestration);
    }

    // Setup monitoring
    if (orchestration.monitoring.metricsEnabled || orchestration.monitoring.loggingEnabled) {
      await setupMonitoring(orchestration);
    }

    orchestration.status = "running";
    orchestration.metadata.revision++;
    orchestration.updatedAt = new Date();

    log.info("Orchestration deployed successfully", { orchestrationId: orchestration.id });

  } catch (error) {
    orchestration.status = "error";
    log.error("Orchestration deployment failed", { 
      error: error.message, 
      orchestrationId: orchestration.id 
    });
    throw error;
  }

  orchestrations.set(orchestration.id, orchestration);
}

function topologicalSort(components: OrchestrationComponent[]): OrchestrationComponent[] {
  const visited = new Set<string>();
  const temp = new Set<string>();
  const result: OrchestrationComponent[] = [];
  const componentMap = new Map(components.map(c => [c.id, c]));

  function visit(componentId: string) {
    if (temp.has(componentId)) {
      throw new Error(`Circular dependency detected for component: ${componentId}`);
    }
    if (visited.has(componentId)) {
      return;
    }

    temp.add(componentId);
    const component = componentMap.get(componentId);
    if (component) {
      for (const dep of component.dependencies) {
        visit(dep);
      }
      temp.delete(componentId);
      visited.add(componentId);
      result.push(component);
    }
  }

  for (const component of components) {
    if (!visited.has(component.id)) {
      visit(component.id);
    }
  }

  return result;
}

async function deployComponent(
  orchestration: ContainerOrchestration, 
  component: OrchestrationComponent
): Promise<void> {
  log.info("Deploying component", { 
    componentId: component.id, 
    type: component.type, 
    name: component.name 
  });

  try {
    component.status = "creating";

    switch (component.type) {
      case "container":
        await deployContainerComponent(orchestration, component);
        break;
      case "environment":
        await deployEnvironmentComponent(orchestration, component);
        break;
      case "dev-server":
        await deployDevServerComponent(orchestration, component);
        break;
      case "service-mesh":
        await deployServiceMeshComponent(orchestration, component);
        break;
      case "api-gateway":
        await deployAPIGatewayComponent(orchestration, component);
        break;
      default:
        throw new Error(`Unknown component type: ${component.type}`);
    }

    component.status = "running";
    component.healthCheck.status = "healthy";
    component.healthCheck.lastCheck = new Date();

    // Start monitoring for the component
    if (component.type === "container" && orchestration.monitoring.metricsEnabled) {
      startContainerMonitoring(component.resourceId);
    }

  } catch (error) {
    component.status = "error";
    component.healthCheck.status = "unhealthy";
    component.healthCheck.failureCount++;
    
    log.error("Component deployment failed", { 
      error: error.message, 
      componentId: component.id 
    });
    throw error;
  }
}

async function deployContainerComponent(
  orchestration: ContainerOrchestration,
  component: OrchestrationComponent
): Promise<void> {
  const { configuration } = component;
  
  // Create container using the containers service
  const containerRequest = {
    projectId: orchestration.projectId,
    name: component.name,
    image: configuration.environment?.IMAGE || "nginx:latest",
    ports: [{ internal: 80, external: 8080, protocol: "tcp" as const }],
    environment: configuration.environment || {},
    resources: {
      cpuLimit: parseFloat(configuration.resources?.cpu?.replace('m', '') || '100') / 1000,
      memoryLimit: parseInt(configuration.resources?.memory?.replace('Mi', '') || '128'),
      storageLimit: parseInt(configuration.resources?.storage?.replace('Gi', '') || '1') * 1024,
    },
  };

  // This would call the actual createContainer function
  // For now, we'll simulate it
  const containerId = uuidv4();
  component.resourceId = containerId;
  
  log.info("Container component deployed", { 
    componentId: component.id, 
    containerId 
  });
}

async function deployEnvironmentComponent(
  orchestration: ContainerOrchestration,
  component: OrchestrationComponent
): Promise<void> {
  const environmentRequest = {
    projectId: orchestration.projectId,
    name: component.name,
    type: orchestration.type as any,
    techStack: {
      language: "javascript",
      framework: "react",
    },
    autoProvision: true,
  };

  // This would call the actual createEnvironment function
  const environmentId = uuidv4();
  component.resourceId = environmentId;
  
  log.info("Environment component deployed", { 
    componentId: component.id, 
    environmentId 
  });
}

async function deployDevServerComponent(
  orchestration: ContainerOrchestration,
  component: OrchestrationComponent
): Promise<void> {
  // Find the container component this dev server depends on
  const containerComponent = orchestration.components.find(c => 
    component.dependencies.includes(c.id) && c.type === "container"
  );

  if (!containerComponent) {
    throw new Error("Dev server component requires a container dependency");
  }

  const devServerRequest = {
    containerId: containerComponent.resourceId,
    projectId: orchestration.projectId,
    name: component.name,
    type: "development" as const,
    configuration: {
      framework: "react",
      runtime: "18",
      packageManager: "npm" as const,
      startCommand: "npm start",
      port: 3000,
      host: "0.0.0.0",
      env: component.configuration.environment || {},
      workingDirectory: "/app",
      autoRestart: true,
      hotReload: true,
      liveBrowser: true,
      debugMode: orchestration.type === "development",
      sourceMap: true,
    },
  };

  // This would call the actual createDevServer function
  const devServerId = uuidv4();
  component.resourceId = devServerId;
  
  log.info("Dev server component deployed", { 
    componentId: component.id, 
    devServerId 
  });
}

async function deployServiceMeshComponent(
  orchestration: ContainerOrchestration,
  component: OrchestrationComponent
): Promise<void> {
  const serviceMeshRequest = {
    projectId: orchestration.projectId,
    name: component.name,
    type: "istio" as const,
    configuration: {
      enableMutualTLS: true,
      enableTracing: orchestration.monitoring.tracingEnabled,
      enableMetrics: orchestration.monitoring.metricsEnabled,
      enableLogging: orchestration.monitoring.loggingEnabled,
      ingressGateway: {
        enabled: orchestration.networking.ingressEnabled,
        ports: [{ number: 80, name: "http", protocol: "HTTP" as const }],
      },
      security: {
        enableRBAC: orchestration.security.rbacEnabled,
        enablePeerAuthentication: true,
        enableRequestAuthentication: false,
      },
    },
  };

  // This would call the actual createServiceMesh function
  const serviceMeshId = uuidv4();
  component.resourceId = serviceMeshId;
  
  log.info("Service mesh component deployed", { 
    componentId: component.id, 
    serviceMeshId 
  });
}

async function deployAPIGatewayComponent(
  orchestration: ContainerOrchestration,
  component: OrchestrationComponent
): Promise<void> {
  const apiGatewayRequest = {
    projectId: orchestration.projectId,
    name: component.name,
    type: "nginx" as const,
    configuration: {
      listeners: [
        {
          name: "http",
          port: 80,
          protocol: "http" as const,
          address: "0.0.0.0",
        },
      ],
      cors: {
        enabled: true,
        allowOrigins: ["*"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      },
    },
  };

  // This would call the actual createAPIGateway function
  const apiGatewayId = uuidv4();
  component.resourceId = apiGatewayId;
  
  log.info("API gateway component deployed", { 
    componentId: component.id, 
    apiGatewayId 
  });
}

async function setupServiceMesh(orchestration: ContainerOrchestration): Promise<void> {
  log.info("Setting up service mesh", { orchestrationId: orchestration.id });
  
  // Configure service mesh for container components
  const containerComponents = orchestration.components.filter(c => c.type === "container");
  
  for (const component of containerComponents) {
    // Add service to mesh
    // This would call the actual addServiceToMesh function
    log.info("Adding service to mesh", { 
      componentId: component.id, 
      serviceName: component.name 
    });
  }
}

async function setupIngress(orchestration: ContainerOrchestration): Promise<void> {
  log.info("Setting up ingress", { orchestrationId: orchestration.id });
  
  // Configure ingress rules for exposed services
  const exposedComponents = orchestration.components.filter(c => 
    c.configuration.environment?.EXPOSE === "true"
  );
  
  for (const component of exposedComponents) {
    // Create ingress rule
    log.info("Creating ingress rule", { 
      componentId: component.id, 
      serviceName: component.name 
    });
  }
}

async function setupMonitoring(orchestration: ContainerOrchestration): Promise<void> {
  log.info("Setting up monitoring", { orchestrationId: orchestration.id });
  
  // Setup monitoring for all components
  for (const component of orchestration.components) {
    if (component.type === "container") {
      // Enable container monitoring
      startContainerMonitoring(component.resourceId);
    }
    
    // Setup health checks
    await setupComponentHealthCheck(component);
  }
  
  // Setup alerting rules
  if (orchestration.monitoring.alerting.enabled) {
    await setupAlerting(orchestration);
  }
}

async function setupComponentHealthCheck(component: OrchestrationComponent): Promise<void> {
  if (!component.healthCheck.enabled) {
    return;
  }

  log.info("Setting up health check", { 
    componentId: component.id, 
    endpoint: component.healthCheck.endpoint 
  });
  
  // Setup periodic health check
  const healthCheckInterval = setInterval(async () => {
    try {
      const isHealthy = await performHealthCheck(component);
      component.healthCheck.status = isHealthy ? "healthy" : "unhealthy";
      component.healthCheck.lastCheck = new Date();
      
      if (!isHealthy) {
        component.healthCheck.failureCount++;
        log.warn("Component health check failed", { 
          componentId: component.id, 
          failureCount: component.healthCheck.failureCount 
        });
      } else {
        component.healthCheck.failureCount = 0;
      }
      
    } catch (error) {
      component.healthCheck.status = "unhealthy";
      component.healthCheck.failureCount++;
      log.error("Health check error", { 
        error: error.message, 
        componentId: component.id 
      });
    }
  }, component.healthCheck.interval * 1000);

  // Store interval ID for cleanup
  component.metadata.healthCheckInterval = healthCheckInterval;
}

async function performHealthCheck(component: OrchestrationComponent): Promise<boolean> {
  const { healthCheck } = component;
  
  if (!healthCheck.endpoint) {
    // For components without HTTP endpoints, check if resource exists
    return component.status === "running";
  }

  try {
    const response = await fetch(healthCheck.endpoint, {
      method: 'GET',
      timeout: healthCheck.timeout * 1000,
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function setupAlerting(orchestration: ContainerOrchestration): Promise<void> {
  log.info("Setting up alerting", { orchestrationId: orchestration.id });
  
  for (const rule of orchestration.monitoring.alerting.rules) {
    // Setup alerting rule
    log.info("Creating alerting rule", { 
      ruleName: rule.name, 
      severity: rule.severity 
    });
  }
}

async function scaleOrchestration(
  orchestration: ContainerOrchestration, 
  componentId: string, 
  replicas: number
): Promise<void> {
  const component = orchestration.components.find(c => c.id === componentId);
  if (!component) {
    throw new Error("Component not found");
  }

  log.info("Scaling component", { 
    componentId, 
    currentReplicas: component.configuration.replicas, 
    targetReplicas: replicas 
  });

  orchestration.status = "scaling";
  
  try {
    if (component.type === "container") {
      // Scale container using container service
      // This would call the actual scaling function
      log.info("Scaling container component", { componentId, replicas });
    }
    
    component.configuration.replicas = replicas;
    orchestration.status = "running";
    orchestration.updatedAt = new Date();
    
  } catch (error) {
    orchestration.status = "error";
    log.error("Component scaling failed", { 
      error: error.message, 
      componentId 
    });
    throw error;
  }

  orchestrations.set(orchestration.id, orchestration);
}

async function rollbackOrchestration(
  orchestration: ContainerOrchestration, 
  targetRevision?: number
): Promise<void> {
  const revision = targetRevision || orchestration.metadata.revision - 1;
  
  log.info("Rolling back orchestration", { 
    orchestrationId: orchestration.id, 
    targetRevision: revision 
  });

  orchestration.status = "deploying";
  
  try {
    // Implement rollback logic
    // This would involve reverting component configurations to previous revision
    
    orchestration.metadata.revision = revision;
    orchestration.status = "running";
    orchestration.updatedAt = new Date();
    
  } catch (error) {
    orchestration.status = "error";
    log.error("Orchestration rollback failed", { 
      error: error.message, 
      orchestrationId: orchestration.id 
    });
    throw error;
  }

  orchestrations.set(orchestration.id, orchestration);
}

// API Endpoints

// Create orchestration
export const createOrchestration = api<typeof CreateOrchestrationRequest>(
  { method: "POST", path: "/orchestrations", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<ContainerOrchestration> => {
    const { userID } = meta.auth;
    const { projectId, name, description, type, templateId, components, configuration, networking, monitoring } = req;
    
    log.info("Creating orchestration", { projectId, name, type, userID });
    
    const orchestrationId = uuidv4();
    const now = new Date();
    
    // Create orchestration components
    const orchComponents: OrchestrationComponent[] = components.map(comp => ({
      id: uuidv4(),
      type: comp.type,
      name: comp.name,
      resourceId: "", // Will be set during deployment
      status: "creating",
      dependencies: comp.dependencies,
      configuration: {
        replicas: comp.configuration.replicas,
        autoScale: comp.configuration.autoScale,
        resources: comp.configuration.resources,
        environment: comp.configuration.environment,
        labels: {},
        annotations: {},
      },
      healthCheck: {
        enabled: true,
        endpoint: comp.type === "container" ? "/health" : undefined,
        interval: 30,
        timeout: 10,
        retries: 3,
        status: "unknown",
        failureCount: 0,
      },
      metadata: {},
    }));

    const orchestration: ContainerOrchestration = {
      id: orchestrationId,
      projectId,
      name,
      description,
      type,
      status: "creating",
      components: orchComponents,
      configuration: {
        strategy: configuration?.strategy || "rolling",
        parallelism: configuration?.parallelism || 1,
        maxUnavailable: configuration?.maxUnavailable || 1,
        maxSurge: configuration?.maxSurge || 1,
        progressDeadlineSeconds: 600,
        rollbackConfig: {
          enabled: true,
          revisionHistoryLimit: 10,
          autoRollback: false,
          triggerConditions: [],
        },
        scheduling: {},
      },
      deployment: {
        imageRegistry: {
          url: "docker.io",
        },
        buildConfig: {
          enabled: false,
          context: ".",
          dockerfile: "Dockerfile",
          cache: true,
        },
        secrets: [],
        configMaps: [],
      },
      networking: {
        serviceMeshEnabled: networking?.serviceMeshEnabled || false,
        ingressEnabled: networking?.ingressEnabled || true,
        loadBalancerEnabled: networking?.loadBalancerEnabled || false,
        networkPoliciesEnabled: false,
        dnsConfig: {
          enabled: true,
        },
        tls: {
          enabled: false,
          certificateSource: "letsencrypt",
        },
      },
      monitoring: {
        metricsEnabled: monitoring?.metricsEnabled || true,
        loggingEnabled: monitoring?.loggingEnabled || true,
        tracingEnabled: monitoring?.tracingEnabled || false,
        alerting: {
          enabled: false,
          rules: [],
          channels: [],
        },
        dashboards: [],
      },
      security: {
        rbacEnabled: true,
        networkPoliciesEnabled: false,
        podSecurityPolicyEnabled: false,
        imageScanning: {
          enabled: false,
          scanOnBuild: false,
          scanOnDeploy: false,
          policy: "warn",
        },
        secrets: {
          encryption: true,
          rotation: false,
          provider: "kubernetes",
        },
        compliance: {
          enabled: false,
          standards: [],
          scanning: false,
        },
      },
      metadata: {
        version: "1.0.0",
        revision: 1,
        labels: {
          "app.kubernetes.io/name": name,
          "app.kubernetes.io/instance": orchestrationId,
          "app.kubernetes.io/part-of": projectId,
          "app.kubernetes.io/managed-by": "vaporform",
        },
        annotations: {},
        tags: [],
        environment: type,
      },
      createdAt: now,
      updatedAt: now,
      createdBy: userID,
    };

    orchestrations.set(orchestrationId, orchestration);
    
    // Deploy the orchestration
    deployOrchestration(orchestration).catch(error => {
      log.error("Auto-deployment failed", { error: error.message, orchestrationId });
    });
    
    log.info("Orchestration created", { orchestrationId, name });
    
    return orchestration;
  }
);

// Get orchestration
export const getOrchestration = api(
  { method: "GET", path: "/orchestrations/:id", auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<ContainerOrchestration> => {
    const orchestration = orchestrations.get(req.id);
    if (!orchestration) {
      throw new Error("Orchestration not found");
    }
    
    return orchestration;
  }
);

// List orchestrations
export const listOrchestrations = api(
  { method: "GET", path: "/orchestrations", auth: true, expose: true },
  async (req: { projectId?: string; type?: string }, meta: APICallMeta<AuthData>): Promise<{ orchestrations: ContainerOrchestration[]; total: number }> => {
    let filteredOrchestrations = Array.from(orchestrations.values());
    
    if (req.projectId) {
      filteredOrchestrations = filteredOrchestrations.filter(o => o.projectId === req.projectId);
    }
    
    if (req.type) {
      filteredOrchestrations = filteredOrchestrations.filter(o => o.type === req.type);
    }
    
    return {
      orchestrations: filteredOrchestrations,
      total: filteredOrchestrations.length,
    };
  }
);

// Update orchestration
export const updateOrchestration = api<typeof UpdateOrchestrationRequest>(
  { method: "PATCH", path: "/orchestrations/:id", auth: true, expose: true },
  async (req: z.infer<typeof UpdateOrchestrationRequest> & { id: string }, meta: APICallMeta<AuthData>): Promise<ContainerOrchestration> => {
    const { id, name, description, configuration, networking } = req;
    
    const orchestration = orchestrations.get(id);
    if (!orchestration) {
      throw new Error("Orchestration not found");
    }

    // Update fields
    if (name) orchestration.name = name;
    if (description !== undefined) orchestration.description = description;
    
    if (configuration) {
      Object.assign(orchestration.configuration, configuration);
    }
    
    if (networking) {
      Object.assign(orchestration.networking, networking);
    }

    orchestration.updatedAt = new Date();
    orchestration.metadata.revision++;
    
    orchestrations.set(id, orchestration);
    
    log.info("Orchestration updated", { orchestrationId: id });
    
    return orchestration;
  }
);

// Orchestration actions
export const orchestrationAction = api<typeof OrchestrationActionRequest>(
  { method: "POST", path: "/orchestrations/:id/actions", auth: true, expose: true },
  async (req: z.infer<typeof OrchestrationActionRequest> & { id: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean; message: string }> => {
    const { id, action, parameters } = req;
    
    const orchestration = orchestrations.get(id);
    if (!orchestration) {
      throw new Error("Orchestration not found");
    }

    log.info("Orchestration action", { orchestrationId: id, action });

    try {
      switch (action) {
        case "deploy":
          await deployOrchestration(orchestration);
          break;
        case "scale":
          if (parameters?.components && parameters?.replicas) {
            for (const componentId of parameters.components) {
              await scaleOrchestration(orchestration, componentId, parameters.replicas);
            }
          }
          break;
        case "rollback":
          await rollbackOrchestration(orchestration, parameters?.revision);
          break;
        case "pause":
          orchestration.status = "stopped";
          break;
        case "resume":
          await deployOrchestration(orchestration);
          break;
        case "restart":
          orchestration.status = "stopped";
          await new Promise(resolve => setTimeout(resolve, 2000));
          await deployOrchestration(orchestration);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      return { 
        success: true, 
        message: `Action '${action}' completed successfully` 
      };

    } catch (error) {
      return { 
        success: false, 
        message: `Action '${action}' failed: ${error.message}` 
      };
    }
  }
);

// Delete orchestration
export const deleteOrchestration = api(
  { method: "DELETE", path: "/orchestrations/:id", auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean }> => {
    const orchestration = orchestrations.get(req.id);
    if (!orchestration) {
      throw new Error("Orchestration not found");
    }

    log.info("Deleting orchestration", { orchestrationId: req.id });

    // Stop monitoring for all components
    for (const component of orchestration.components) {
      if (component.type === "container") {
        stopContainerMonitoring(component.resourceId);
      }
      
      // Clear health check intervals
      if (component.metadata.healthCheckInterval) {
        clearInterval(component.metadata.healthCheckInterval);
      }
    }

    // Clean up resources
    // This would involve deleting containers, environments, dev servers, etc.
    
    orchestrations.delete(req.id);
    
    return { success: true };
  }
);