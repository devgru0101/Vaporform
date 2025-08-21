import { api, APICallMeta } from 'encore.dev/api';
import log from 'encore.dev/log';
import { z } from 'zod';
import { AuthData } from './auth';
import { v4 as uuidv4 } from 'uuid';
import Docker from 'dockerode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const docker = new Docker();
const execAsync = promisify(exec);

// Networking interfaces
export interface ServiceMesh {
  id: string;
  projectId: string;
  name: string;
  type: 'istio' | 'linkerd' | 'consul' | 'envoy' | 'nginx' | 'traefik';
  status: 'creating' | 'active' | 'updating' | 'error' | 'destroyed';
  configuration: ServiceMeshConfig;
  services: MeshService[];
  policies: NetworkPolicy[];
  gateways: ServiceGateway[];
  virtualServices: VirtualService[];
  destinationRules: DestinationRule[];
  metrics: ServiceMeshMetrics;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ServiceMeshConfig {
  enableMutualTLS: boolean;
  enableTracing: boolean;
  enableMetrics: boolean;
  enableLogging: boolean;
  ingressGateway: {
    enabled: boolean;
    ports: GatewayPort[];
    tls: TLSConfig;
  };
  egressGateway: {
    enabled: boolean;
    allowedHosts: string[];
  };
  sidecarInjection: {
    enabled: boolean;
    namespaces: string[];
    labels: { [key: string]: string };
  };
  security: {
    enableRBAC: boolean;
    enablePeerAuthentication: boolean;
    enableRequestAuthentication: boolean;
  };
  observability: {
    tracingProvider: 'jaeger' | 'zipkin' | 'datadog';
    metricsProvider: 'prometheus' | 'datadog';
    loggingProvider: 'fluentd' | 'elasticsearch';
  };
}

export interface GatewayPort {
  number: number;
  name: string;
  protocol: 'HTTP' | 'HTTPS' | 'TCP' | 'TLS';
}

export interface TLSConfig {
  mode: 'SIMPLE' | 'MUTUAL' | 'PASSTHROUGH';
  serverCertificate?: string;
  privateKey?: string;
  caCertificates?: string;
  credentialName?: string;
}

export interface MeshService {
  id: string;
  name: string;
  namespace: string;
  containerId: string;
  ports: ServicePort[];
  labels: { [key: string]: string };
  annotations: { [key: string]: string };
  endpoints: ServiceEndpoint[];
  healthCheck: ServiceHealthCheck;
  loadBalancing: LoadBalancingConfig;
  circuitBreaker: CircuitBreakerConfig;
  retryPolicy: RetryPolicyConfig;
  timeout: TimeoutConfig;
  rateLimiting: RateLimitingConfig;
  security: ServiceSecurityConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServicePort {
  name: string;
  port: number;
  targetPort: number;
  protocol: 'HTTP' | 'HTTPS' | 'TCP' | 'UDP' | 'GRPC';
}

export interface ServiceEndpoint {
  id: string;
  address: string;
  port: number;
  status: 'healthy' | 'unhealthy' | 'unknown';
  weight: number;
  lastCheck: Date;
  metadata: { [key: string]: string };
}

export interface ServiceHealthCheck {
  enabled: boolean;
  path?: string;
  port?: number;
  interval: number;
  timeout: number;
  retries: number;
  successThreshold: number;
  failureThreshold: number;
}

export interface LoadBalancingConfig {
  algorithm: 'round_robin' | 'least_conn' | 'random' | 'ip_hash' | 'consistent_hash';
  sessionAffinity: boolean;
  healthyPanicThreshold: number;
  localityLbSetting?: {
    enabled: boolean;
    distribute: { [region: string]: number };
    failover: { [region: string]: string };
  };
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  maxConnections: number;
  maxPendingRequests: number;
  maxRetries: number;
  maxRequests: number;
  consecutiveErrors: number;
  interval: number;
  baseEjectionTime: number;
  maxEjectionPercent: number;
}

export interface RetryPolicyConfig {
  enabled: boolean;
  attempts: number;
  perTryTimeout: number;
  retryOn: string[];
  retryRemoteLocalities: boolean;
}

export interface TimeoutConfig {
  enabled: boolean;
  requestTimeout: number;
  connectionTimeout: number;
  responseTimeout: number;
}

export interface RateLimitingConfig {
  enabled: boolean;
  requestsPerSecond: number;
  requestsPerMinute: number;
  burstSize: number;
  quotas: RateLimitQuota[];
}

export interface RateLimitQuota {
  id: string;
  name: string;
  limit: number;
  window: string; // e.g., "1m", "1h", "1d"
  scope: 'global' | 'per_ip' | 'per_user' | 'per_key';
  headers?: { [key: string]: string };
}

export interface ServiceSecurityConfig {
  authentication: {
    enabled: boolean;
    methods: ('jwt' | 'oauth' | 'basic' | 'api_key')[];
    jwtIssuers?: JWTIssuer[];
  };
  authorization: {
    enabled: boolean;
    rules: AuthorizationRule[];
  };
  tls: {
    enabled: boolean;
    mode: 'SIMPLE' | 'MUTUAL';
    minVersion: string;
    maxVersion: string;
    cipherSuites: string[];
  };
}

export interface JWTIssuer {
  issuer: string;
  jwksUri: string;
  audiences: string[];
}

export interface AuthorizationRule {
  id: string;
  action: 'ALLOW' | 'DENY';
  subjects: string[];
  resources: string[];
  methods: string[];
  conditions?: { [key: string]: string };
}

export interface NetworkPolicy {
  id: string;
  name: string;
  namespace: string;
  type: 'ingress' | 'egress' | 'both';
  podSelector: { [key: string]: string };
  rules: PolicyRule[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyRule {
  id: string;
  direction: 'ingress' | 'egress';
  action: 'allow' | 'deny';
  sources?: PolicyEndpoint[];
  destinations?: PolicyEndpoint[];
  ports?: PolicyPort[];
  protocols: string[];
}

export interface PolicyEndpoint {
  type: 'pod' | 'namespace' | 'cidr' | 'service';
  selector?: { [key: string]: string };
  cidr?: string;
  except?: string[];
}

export interface PolicyPort {
  port: number;
  endPort?: number;
  protocol: 'TCP' | 'UDP' | 'SCTP';
}

export interface ServiceGateway {
  id: string;
  name: string;
  namespace: string;
  type: 'ingress' | 'egress';
  selector: { [key: string]: string };
  servers: GatewayServer[];
  addresses?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GatewayServer {
  port: GatewayPort;
  hosts: string[];
  tls?: TLSConfig;
  defaultEndpoint?: string;
}

export interface VirtualService {
  id: string;
  name: string;
  namespace: string;
  hosts: string[];
  gateways: string[];
  http?: HTTPRoute[];
  tcp?: TCPRoute[];
  tls?: TLSRoute[];
  createdAt: Date;
  updatedAt: Date;
}

export interface HTTPRoute {
  match?: HTTPMatchRequest[];
  route?: HTTPRouteDestination[];
  redirect?: HTTPRedirect;
  rewrite?: HTTPRewrite;
  fault?: HTTPFaultInjection;
  mirror?: ServiceDestination;
  corsPolicy?: CorsPolicy;
  headers?: Headers;
  timeout?: number;
  retries?: HTTPRetry;
}

export interface HTTPMatchRequest {
  name?: string;
  uri?: StringMatch;
  scheme?: StringMatch;
  method?: StringMatch;
  authority?: StringMatch;
  headers?: { [key: string]: StringMatch };
  port?: number;
  sourceLabels?: { [key: string]: string };
  gateways?: string[];
  queryParams?: { [key: string]: StringMatch };
}

export interface StringMatch {
  exact?: string;
  prefix?: string;
  regex?: string;
}

export interface HTTPRouteDestination {
  destination: ServiceDestination;
  weight?: number;
  headers?: Headers;
}

export interface ServiceDestination {
  host: string;
  subset?: string;
  port?: ServicePort;
}

export interface HTTPRedirect {
  uri?: string;
  authority?: string;
  port?: number;
  derivePort?: 'FROM_PROTOCOL_DEFAULT' | 'FROM_REQUEST_PORT';
  scheme?: string;
  redirectCode?: number;
}

export interface HTTPRewrite {
  uri?: string;
  authority?: string;
}

export interface HTTPFaultInjection {
  delay?: {
    fixedDelay?: string;
    percentage?: number;
  };
  abort?: {
    httpStatus?: number;
    grpcStatus?: string;
    http2Error?: string;
    percentage?: number;
  };
}

export interface CorsPolicy {
  allowOrigins?: StringMatch[];
  allowMethods?: string[];
  allowHeaders?: string[];
  exposeHeaders?: string[];
  maxAge?: string;
  allowCredentials?: boolean;
}

export interface Headers {
  request?: {
    set?: { [key: string]: string };
    add?: { [key: string]: string };
    remove?: string[];
  };
  response?: {
    set?: { [key: string]: string };
    add?: { [key: string]: string };
    remove?: string[];
  };
}

export interface HTTPRetry {
  attempts?: number;
  perTryTimeout?: string;
  retryOn?: string;
  retryRemoteLocalities?: boolean;
}

export interface TCPRoute {
  match?: TCPMatchRequest[];
  route?: TCPRouteDestination[];
}

export interface TCPMatchRequest {
  destinationSubnets?: string[];
  port?: number;
  sourceLabels?: { [key: string]: string };
  gateways?: string[];
  sourceNamespace?: string;
}

export interface TCPRouteDestination {
  destination: ServiceDestination;
  weight?: number;
}

export interface TLSRoute {
  match?: TLSMatchRequest[];
  route?: TLSRouteDestination[];
}

export interface TLSMatchRequest {
  sniHosts?: string[];
  destinationSubnets?: string[];
  port?: number;
  sourceLabels?: { [key: string]: string };
  gateways?: string[];
  sourceNamespace?: string;
}

export interface TLSRouteDestination {
  destination: ServiceDestination;
  weight?: number;
}

export interface DestinationRule {
  id: string;
  name: string;
  namespace: string;
  host: string;
  trafficPolicy?: TrafficPolicy;
  subsets?: Subset[];
  exportTo?: string[];
  workloadSelector?: { [key: string]: string };
  createdAt: Date;
  updatedAt: Date;
}

export interface TrafficPolicy {
  loadBalancer?: LoadBalancingConfig;
  connectionPool?: ConnectionPoolSettings;
  outlierDetection?: OutlierDetection;
  tls?: ClientTLSSettings;
  portLevelSettings?: PortTrafficPolicy[];
}

export interface ConnectionPoolSettings {
  tcp?: {
    maxConnections?: number;
    connectTimeout?: string;
    tcpNoDelay?: boolean;
    tcpKeepalive?: TCPKeepAlive;
  };
  http?: {
    http1MaxPendingRequests?: number;
    http2MaxRequests?: number;
    maxRequestsPerConnection?: number;
    maxRetries?: number;
    idleTimeout?: string;
    h2UpgradePolicy?: 'UPGRADE' | 'DO_NOT_UPGRADE';
    useClientProtocol?: boolean;
  };
}

export interface TCPKeepAlive {
  time?: string;
  interval?: string;
  probes?: number;
}

export interface OutlierDetection {
  consecutiveGatewayErrors?: number;
  consecutive5xxErrors?: number;
  interval?: string;
  baseEjectionTime?: string;
  maxEjectionPercent?: number;
  minHealthPercent?: number;
  splitExternalLocalOriginErrors?: boolean;
}

export interface ClientTLSSettings {
  mode: 'DISABLE' | 'SIMPLE' | 'MUTUAL' | 'ISTIO_MUTUAL';
  clientCertificate?: string;
  privateKey?: string;
  caCertificates?: string;
  credentialName?: string;
  subjectAltNames?: string[];
  sni?: string;
  insecureSkipVerify?: boolean;
}

export interface PortTrafficPolicy {
  port: ServicePort;
  loadBalancer?: LoadBalancingConfig;
  connectionPool?: ConnectionPoolSettings;
  outlierDetection?: OutlierDetection;
  tls?: ClientTLSSettings;
}

export interface Subset {
  name: string;
  labels: { [key: string]: string };
  trafficPolicy?: TrafficPolicy;
}

export interface ServiceMeshMetrics {
  totalRequests: number;
  successRate: number;
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  throughput: number;
  activeConnections: number;
  serviceCounts: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
  lastUpdated: Date;
}

export interface APIGateway {
  id: string;
  projectId: string;
  name: string;
  type: 'nginx' | 'envoy' | 'kong' | 'ambassador' | 'traefik';
  status: 'active' | 'inactive' | 'error';
  configuration: APIGatewayConfig;
  routes: APIRoute[];
  middleware: GatewayMiddleware[];
  upstreams: Upstream[];
  certificates: TLSCertificate[];
  rateLimits: RateLimitingConfig;
  metrics: APIGatewayMetrics;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface APIGatewayConfig {
  listeners: GatewayListener[];
  globalRateLimit: {
    enabled: boolean;
    requestsPerSecond: number;
    burstSize: number;
  };
  cors: {
    enabled: boolean;
    allowOrigins: string[];
    allowMethods: string[];
    allowHeaders: string[];
    maxAge: number;
  };
  authentication: {
    enabled: boolean;
    providers: AuthProvider[];
  };
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
  };
  tracing: {
    enabled: boolean;
    samplingRate: number;
    jaegerEndpoint?: string;
  };
}

export interface GatewayListener {
  name: string;
  port: number;
  protocol: 'http' | 'https' | 'tcp' | 'udp';
  address: string;
  tls?: {
    enabled: boolean;
    certificateId?: string;
    minVersion: string;
    maxVersion: string;
  };
}

export interface AuthProvider {
  name: string;
  type: 'jwt' | 'oauth2' | 'basic' | 'api_key';
  config: { [key: string]: any };
  enabled: boolean;
}

export interface APIRoute {
  id: string;
  name: string;
  methods: string[];
  hosts: string[];
  paths: RoutePath[];
  upstreamId: string;
  middleware: string[];
  authentication?: {
    required: boolean;
    providers: string[];
  };
  rateLimit?: {
    enabled: boolean;
    requestsPerSecond: number;
    burstSize: number;
  };
  timeout: number;
  retries: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutePath {
  type: 'exact' | 'prefix' | 'regex';
  value: string;
  rewrite?: string;
}

export interface GatewayMiddleware {
  id: string;
  name: string;
  type: 'cors' | 'rate_limit' | 'auth' | 'transform' | 'cache' | 'compression';
  config: { [key: string]: any };
  enabled: boolean;
  order: number;
}

export interface Upstream {
  id: string;
  name: string;
  algorithm: 'round_robin' | 'least_conn' | 'ip_hash' | 'random';
  targets: UpstreamTarget[];
  healthCheck: UpstreamHealthCheck;
  retries: number;
  connectTimeout: number;
  sendTimeout: number;
  readTimeout: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpstreamTarget {
  id: string;
  host: string;
  port: number;
  weight: number;
  enabled: boolean;
  backup: boolean;
  health: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
}

export interface UpstreamHealthCheck {
  enabled: boolean;
  interval: number;
  timeout: number;
  retries: number;
  httpPath?: string;
  httpExpectedStatus: number[];
  tcpPort?: number;
}

export interface TLSCertificate {
  id: string;
  name: string;
  domains: string[];
  certificate: string;
  privateKey: string;
  chain?: string;
  autoRenew: boolean;
  provider?: 'letsencrypt' | 'manual';
  validFrom: Date;
  validTo: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIGatewayMetrics {
  totalRequests: number;
  requestsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  upstreamHealthStatus: { [upstreamId: string]: 'healthy' | 'unhealthy' };
  statusCodes: { [code: string]: number };
  topPaths: { path: string; requests: number }[];
  lastUpdated: Date;
}

// Request/Response schemas
const CreateServiceMeshRequest = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(100),
  type: z.enum(['istio', 'linkerd', 'consul', 'envoy', 'nginx', 'traefik']),
  configuration: z.object({
    enableMutualTLS: z.boolean().default(true),
    enableTracing: z.boolean().default(true),
    enableMetrics: z.boolean().default(true),
    enableLogging: z.boolean().default(true),
    ingressGateway: z.object({
      enabled: z.boolean().default(true),
      ports: z.array(z.object({
        number: z.number().min(1).max(65535),
        name: z.string(),
        protocol: z.enum(['HTTP', 'HTTPS', 'TCP', 'TLS']),
      })).default([{ number: 80, name: 'http', protocol: 'HTTP' }]),
    }),
    security: z.object({
      enableRBAC: z.boolean().default(true),
      enablePeerAuthentication: z.boolean().default(true),
      enableRequestAuthentication: z.boolean().default(false),
    }),
  }),
});

const CreateAPIGatewayRequest = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(100),
  type: z.enum(['nginx', 'envoy', 'kong', 'ambassador', 'traefik']),
  configuration: z.object({
    listeners: z.array(z.object({
      name: z.string(),
      port: z.number().min(1).max(65535),
      protocol: z.enum(['http', 'https', 'tcp', 'udp']),
      address: z.string().default('0.0.0.0'),
    })),
    cors: z.object({
      enabled: z.boolean().default(false),
      allowOrigins: z.array(z.string()).default(['*']),
      allowMethods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
    }),
  }),
});

const CreateNetworkPolicyRequest = z.object({
  name: z.string().min(1).max(100),
  namespace: z.string().default('default'),
  type: z.enum(['ingress', 'egress', 'both']),
  podSelector: z.record(z.string()),
  rules: z.array(z.object({
    direction: z.enum(['ingress', 'egress']),
    action: z.enum(['allow', 'deny']),
    ports: z.array(z.object({
      port: z.number().min(1).max(65535),
      protocol: z.enum(['TCP', 'UDP', 'SCTP']),
    })).optional(),
    protocols: z.array(z.string()).default(['TCP']),
  })),
});

const CreateServiceRequest = z.object({
  meshId: z.string(),
  name: z.string().min(1).max(100),
  namespace: z.string().default('default'),
  containerId: z.string(),
  ports: z.array(z.object({
    name: z.string(),
    port: z.number().min(1).max(65535),
    targetPort: z.number().min(1).max(65535),
    protocol: z.enum(['HTTP', 'HTTPS', 'TCP', 'UDP', 'GRPC']),
  })),
  labels: z.record(z.string()).default({}),
  healthCheck: z.object({
    enabled: z.boolean().default(true),
    path: z.string().optional(),
    interval: z.number().default(30),
    timeout: z.number().default(10),
    retries: z.number().default(3),
  }),
});

const CreateAPIRouteRequest = z.object({
  gatewayId: z.string(),
  name: z.string().min(1).max(100),
  methods: z.array(z.string()).default(['GET']),
  hosts: z.array(z.string()),
  paths: z.array(z.object({
    type: z.enum(['exact', 'prefix', 'regex']),
    value: z.string(),
    rewrite: z.string().optional(),
  })),
  upstreamId: z.string(),
  timeout: z.number().default(30),
  retries: z.number().default(3),
});

// Storage for networking components
const serviceMeshes: Map<string, ServiceMesh> = new Map();
const apiGateways: Map<string, APIGateway> = new Map();
const networkPolicies: Map<string, NetworkPolicy> = new Map();
const meshServices: Map<string, MeshService> = new Map();
const apiRoutes: Map<string, APIRoute> = new Map();
const upstreams: Map<string, Upstream> = new Map();

// Service mesh management functions
async function deployServiceMesh(serviceMesh: ServiceMesh): Promise<void> {
  const { type, configuration } = serviceMesh;
  
  log.info('Deploying service mesh', { 
    meshId: serviceMesh.id, 
    type, 
    projectId: serviceMesh.projectId, 
  });

  try {
    serviceMesh.status = 'creating';
    
    switch (type) {
      case 'istio':
        await deployIstioMesh(serviceMesh);
        break;
      case 'linkerd':
        await deployLinkerdMesh(serviceMesh);
        break;
      case 'envoy':
        await deployEnvoyMesh(serviceMesh);
        break;
      case 'nginx':
        await deployNginxMesh(serviceMesh);
        break;
      case 'traefik':
        await deployTraefikMesh(serviceMesh);
        break;
      default:
        throw new Error(`Unsupported service mesh type: ${type}`);
    }

    serviceMesh.status = 'active';
    serviceMeshes.set(serviceMesh.id, serviceMesh);
    
    log.info('Service mesh deployed successfully', { meshId: serviceMesh.id });

  } catch (error) {
    serviceMesh.status = 'error';
    serviceMeshes.set(serviceMesh.id, serviceMesh);
    
    log.error('Service mesh deployment failed', { 
      error: error.message, 
      meshId: serviceMesh.id, 
    });
    throw error;
  }
}

async function deployIstioMesh(serviceMesh: ServiceMesh): Promise<void> {
  const { configuration } = serviceMesh;
  
  // Install Istio components
  const istioManifest = generateIstioManifest(serviceMesh);
  await applyKubernetesManifest(istioManifest);
  
  // Configure ingress gateway
  if (configuration.ingressGateway.enabled) {
    const gatewayManifest = generateIstioGatewayManifest(serviceMesh);
    await applyKubernetesManifest(gatewayManifest);
  }
  
  // Enable sidecar injection
  if (configuration.sidecarInjection.enabled) {
    await enableIstioSidecarInjection(serviceMesh);
  }
  
  // Apply security policies
  if (configuration.security.enableRBAC) {
    const rbacManifest = generateIstioRBACManifest(serviceMesh);
    await applyKubernetesManifest(rbacManifest);
  }
}

async function deployLinkerdMesh(serviceMesh: ServiceMesh): Promise<void> {
  // Linkerd deployment logic
  const linkerdManifest = generateLinkerdManifest(serviceMesh);
  await applyKubernetesManifest(linkerdManifest);
}

async function deployEnvoyMesh(serviceMesh: ServiceMesh): Promise<void> {
  // Envoy deployment logic
  const envoyConfig = generateEnvoyConfig(serviceMesh);
  await deployEnvoyProxy(envoyConfig);
}

async function deployNginxMesh(serviceMesh: ServiceMesh): Promise<void> {
  // NGINX deployment logic
  const nginxConfig = generateNginxConfig(serviceMesh);
  await deployNginxController(nginxConfig);
}

async function deployTraefikMesh(serviceMesh: ServiceMesh): Promise<void> {
  // Traefik deployment logic
  const traefikConfig = generateTraefikConfig(serviceMesh);
  await deployTraefikController(traefikConfig);
}

// Configuration generators
function generateIstioManifest(serviceMesh: ServiceMesh): string {
  const { configuration } = serviceMesh;
  
  return `
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: ${serviceMesh.name}
  namespace: istio-system
spec:
  values:
    global:
      meshID: ${serviceMesh.id}
      network: ${serviceMesh.projectId}
      proxy:
        tracer: ${configuration.observability?.tracingProvider || 'jaeger'}
    pilot:
      traceSampling: ${configuration.enableTracing ? 1.0 : 0.0}
  components:
    ingressGateways:
    - name: istio-ingressgateway
      enabled: ${configuration.ingressGateway.enabled}
      k8s:
        service:
          ports:
${configuration.ingressGateway.ports.map(port => `          - port: ${port.number}
            targetPort: ${port.number}
            name: ${port.name}
            protocol: ${port.protocol}`).join('\n')}
    egressGateways:
    - name: istio-egressgateway
      enabled: ${configuration.egressGateway.enabled}
`;
}

function generateIstioGatewayManifest(serviceMesh: ServiceMesh): string {
  const { configuration } = serviceMesh;
  
  return `
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: ${serviceMesh.name}-gateway
  namespace: default
spec:
  selector:
    istio: ingressgateway
  servers:
${configuration.ingressGateway.ports.map(port => `  - port:
      number: ${port.number}
      name: ${port.name}
      protocol: ${port.protocol}
    hosts:
    - "*"`).join('\n')}
`;
}

function generateLinkerdManifest(serviceMesh: ServiceMesh): string {
  return `
apiVersion: v1
kind: Namespace
metadata:
  name: linkerd
  annotations:
    linkerd.io/inject: disabled
  labels:
    linkerd.io/control-plane-ns: linkerd
    config.linkerd.io/admission-webhooks: disabled
---
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: linkerd-${serviceMesh.name}
  labels:
    linkerd.io/control-plane-component: controller
spec:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  allowedCapabilities:
  - NET_ADMIN
  - NET_RAW
  requiredDropCapabilities:
  - ALL
`;
}

function generateEnvoyConfig(serviceMesh: ServiceMesh): any {
  const { configuration } = serviceMesh;
  
  return {
    admin: {
      access_log_path: '/tmp/admin_access.log',
      address: {
        socket_address: { address: '127.0.0.1', port_value: 9901 },
      },
    },
    static_resources: {
      listeners: [
        {
          name: 'listener_0',
          address: {
            socket_address: { address: '0.0.0.0', port_value: 10000 },
          },
          filter_chains: [
            {
              filters: [
                {
                  name: 'envoy.filters.network.http_connection_manager',
                  typed_config: {
                    '@type': 'type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager',
                    stat_prefix: 'ingress_http',
                    codec_type: 'AUTO',
                    route_config: {
                      name: 'local_route',
                      virtual_hosts: [
                        {
                          name: 'local_service',
                          domains: ['*'],
                          routes: [
                            {
                              match: { prefix: '/' },
                              route: { cluster: 'some_service' },
                            },
                          ],
                        },
                      ],
                    },
                    http_filters: [
                      { name: 'envoy.filters.http.router' },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
      clusters: [
        {
          name: 'some_service',
          connect_timeout: '30s',
          type: 'LOGICAL_DNS',
          dns_lookup_family: 'V4_ONLY',
          load_assignment: {
            cluster_name: 'some_service',
            endpoints: [
              {
                lb_endpoints: [
                  {
                    endpoint: {
                      address: {
                        socket_address: {
                          address: '127.0.0.1',
                          port_value: 8080,
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  };
}

function generateNginxConfig(serviceMesh: ServiceMesh): string {
  return `
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server 127.0.0.1:8080;
    }

    server {
        listen 80;
        server_name ${serviceMesh.name}.local;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
`;
}

function generateTraefikConfig(serviceMesh: ServiceMesh): any {
  return {
    global: {
      checkNewVersion: false,
      sendAnonymousUsage: false,
    },
    api: {
      dashboard: true,
      insecure: true,
    },
    entryPoints: {
      web: {
        address: ':80',
      },
      websecure: {
        address: ':443',
      },
    },
    providers: {
      docker: {
        exposedByDefault: false,
      },
    },
    certificatesResolvers: {
      letsencrypt: {
        acme: {
          email: 'admin@example.com',
          storage: '/letsencrypt/acme.json',
          httpChallenge: {
            entryPoint: 'web',
          },
        },
      },
    },
  };
}

// Helper functions for deployment
async function applyKubernetesManifest(manifest: string): Promise<void> {
  // In a real implementation, this would use kubectl or Kubernetes API
  log.info('Applying Kubernetes manifest', { manifestLength: manifest.length });
  
  // Simulate deployment
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function enableIstioSidecarInjection(serviceMesh: ServiceMesh): Promise<void> {
  const { configuration } = serviceMesh;
  
  for (const namespace of configuration.sidecarInjection.namespaces) {
    // Label namespace for sidecar injection
    const labelCommand = `kubectl label namespace ${namespace} istio-injection=enabled --overwrite`;
    await execAsync(labelCommand);
  }
}

async function generateIstioRBACManifest(serviceMesh: ServiceMesh): Promise<string> {
  return `
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: ${serviceMesh.name}-rbac
  namespace: default
spec:
  selector:
    matchLabels:
      app: ${serviceMesh.name}
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/default"]
  - to:
    - operation:
        methods: ["GET", "POST"]
`;
}

async function deployEnvoyProxy(config: any): Promise<void> {
  // Deploy Envoy proxy with configuration
  log.info('Deploying Envoy proxy', { config });
  await new Promise(resolve => setTimeout(resolve, 3000));
}

async function deployNginxController(config: string): Promise<void> {
  // Deploy NGINX controller
  log.info('Deploying NGINX controller', { configLength: config.length });
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function deployTraefikController(config: any): Promise<void> {
  // Deploy Traefik controller
  log.info('Deploying Traefik controller', { config });
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// Service discovery and registration
async function registerService(meshService: MeshService): Promise<void> {
  const serviceMesh = serviceMeshes.get(meshService.id.split('-')[0]); // Extract mesh ID
  if (!serviceMesh) {
    throw new Error('Service mesh not found');
  }

  log.info('Registering service in mesh', { 
    serviceId: meshService.id, 
    serviceName: meshService.name,
    meshType: serviceMesh.type, 
  });

  // Add service to mesh
  serviceMesh.services.push(meshService);
  serviceMeshes.set(serviceMesh.id, serviceMesh);

  // Create service endpoints
  await discoverServiceEndpoints(meshService);

  meshServices.set(meshService.id, meshService);
}

async function discoverServiceEndpoints(meshService: MeshService): Promise<void> {
  // Discover service endpoints from container
  const {containerId} = meshService;
  
  try {
    const dockerContainer = docker.getContainer(containerId);
    const containerInfo = await dockerContainer.inspect();
    
    if (containerInfo.State.Running) {
      const networkSettings = containerInfo.NetworkSettings;
      
      for (const port of meshService.ports) {
        const endpoint: ServiceEndpoint = {
          id: uuidv4(),
          address: networkSettings.IPAddress || '127.0.0.1',
          port: port.targetPort,
          status: 'healthy',
          weight: 100,
          lastCheck: new Date(),
          metadata: {
            containerName: containerInfo.Name,
            imageId: containerInfo.Image,
          },
        };
        
        meshService.endpoints.push(endpoint);
      }
    }
    
    meshServices.set(meshService.id, meshService);
    
  } catch (error) {
    log.error('Failed to discover service endpoints', { 
      error: error.message, 
      serviceId: meshService.id, 
    });
  }
}

// Health checking
async function performHealthCheck(meshService: MeshService): Promise<void> {
  const { healthCheck } = meshService;
  
  if (!healthCheck.enabled) {
    return;
  }

  for (const endpoint of meshService.endpoints) {
    try {
      const isHealthy = await checkEndpointHealth(endpoint, healthCheck);
      endpoint.status = isHealthy ? 'healthy' : 'unhealthy';
      endpoint.lastCheck = new Date();
      
    } catch (error) {
      endpoint.status = 'unhealthy';
      endpoint.lastCheck = new Date();
      log.warn('Health check failed', { 
        error: error.message, 
        endpointId: endpoint.id, 
      });
    }
  }
  
  meshServices.set(meshService.id, meshService);
}

async function checkEndpointHealth(
  endpoint: ServiceEndpoint, 
  healthCheck: ServiceHealthCheck,
): Promise<boolean> {
  const url = `http://${endpoint.address}:${endpoint.port}${healthCheck.path || '/health'}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      timeout: healthCheck.timeout * 1000,
    });
    
    return response.ok;
    
  } catch (error) {
    return false;
  }
}

// Load balancing
function selectEndpoint(
  meshService: MeshService, 
  algorithm: string = 'round_robin',
): ServiceEndpoint | null {
  const healthyEndpoints = meshService.endpoints.filter(e => e.status === 'healthy');
  
  if (healthyEndpoints.length === 0) {
    return null;
  }
  
  switch (algorithm) {
    case 'round_robin':
      return selectRoundRobinEndpoint(healthyEndpoints);
    case 'least_conn':
      return selectLeastConnectionsEndpoint(healthyEndpoints);
    case 'random':
      return selectRandomEndpoint(healthyEndpoints);
    case 'ip_hash':
      return selectIPHashEndpoint(healthyEndpoints, '127.0.0.1'); // Would use actual client IP
    default:
      return healthyEndpoints[0];
  }
}

function selectRoundRobinEndpoint(endpoints: ServiceEndpoint[]): ServiceEndpoint {
  // Simple round-robin implementation
  const index = Date.now() % endpoints.length;
  return endpoints[index];
}

function selectLeastConnectionsEndpoint(endpoints: ServiceEndpoint[]): ServiceEndpoint {
  // In a real implementation, track active connections per endpoint
  return endpoints[0];
}

function selectRandomEndpoint(endpoints: ServiceEndpoint[]): ServiceEndpoint {
  const index = Math.floor(Math.random() * endpoints.length);
  return endpoints[index];
}

function selectIPHashEndpoint(endpoints: ServiceEndpoint[], clientIP: string): ServiceEndpoint {
  // Simple hash of client IP to select endpoint
  let hash = 0;
  for (let i = 0; i < clientIP.length; i++) {
    const char = clientIP.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % endpoints.length;
  return endpoints[index];
}

// API Endpoints

// Create service mesh
export const createServiceMesh = api<typeof CreateServiceMeshRequest>(
  { method: 'POST', path: '/service-mesh', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<ServiceMesh> => {
    const { userID } = meta.auth;
    const { projectId, name, type, configuration } = req;
    
    log.info('Creating service mesh', { projectId, name, type, userID });
    
    const meshId = uuidv4();
    const now = new Date();
    
    const serviceMesh: ServiceMesh = {
      id: meshId,
      projectId,
      name,
      type,
      status: 'creating',
      configuration: {
        ...configuration,
        egressGateway: {
          enabled: false,
          allowedHosts: [],
        },
        sidecarInjection: {
          enabled: true,
          namespaces: ['default'],
          labels: {},
        },
        observability: {
          tracingProvider: 'jaeger',
          metricsProvider: 'prometheus',
          loggingProvider: 'fluentd',
        },
      },
      services: [],
      policies: [],
      gateways: [],
      virtualServices: [],
      destinationRules: [],
      metrics: {
        totalRequests: 0,
        successRate: 0,
        averageLatency: 0,
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
        errorRate: 0,
        throughput: 0,
        activeConnections: 0,
        serviceCounts: {
          total: 0,
          healthy: 0,
          unhealthy: 0,
        },
        lastUpdated: now,
      },
      createdAt: now,
      updatedAt: now,
      createdBy: userID,
    };
    
    // Deploy the service mesh
    await deployServiceMesh(serviceMesh);
    
    return serviceMesh;
  },
);

// Create API gateway
export const createAPIGateway = api<typeof CreateAPIGatewayRequest>(
  { method: 'POST', path: '/api-gateway', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<APIGateway> => {
    const { userID } = meta.auth;
    const { projectId, name, type, configuration } = req;
    
    log.info('Creating API gateway', { projectId, name, type, userID });
    
    const gatewayId = uuidv4();
    const now = new Date();
    
    const apiGateway: APIGateway = {
      id: gatewayId,
      projectId,
      name,
      type,
      status: 'active',
      configuration: {
        ...configuration,
        globalRateLimit: {
          enabled: false,
          requestsPerSecond: 1000,
          burstSize: 100,
        },
        authentication: {
          enabled: false,
          providers: [],
        },
        logging: {
          enabled: true,
          level: 'info',
          format: 'json',
        },
        tracing: {
          enabled: false,
          samplingRate: 0.1,
        },
      },
      routes: [],
      middleware: [],
      upstreams: [],
      certificates: [],
      rateLimits: {
        enabled: false,
        requestsPerSecond: 1000,
        requestsPerMinute: 60000,
        burstSize: 100,
        quotas: [],
      },
      metrics: {
        totalRequests: 0,
        requestsPerSecond: 0,
        averageLatency: 0,
        errorRate: 0,
        upstreamHealthStatus: {},
        statusCodes: {},
        topPaths: [],
        lastUpdated: now,
      },
      createdAt: now,
      updatedAt: now,
      createdBy: userID,
    };
    
    apiGateways.set(gatewayId, apiGateway);
    
    log.info('API gateway created', { gatewayId, name });
    
    return apiGateway;
  },
);

// Add service to mesh
export const addServiceToMesh = api<typeof CreateServiceRequest>(
  { method: 'POST', path: '/service-mesh/:meshId/services', auth: true, expose: true },
  async (req: z.infer<typeof CreateServiceRequest> & { meshId: string }, meta: APICallMeta<AuthData>): Promise<MeshService> => {
    const { meshId, name, namespace, containerId, ports, labels, healthCheck } = req;
    
    const serviceMesh = serviceMeshes.get(meshId);
    if (!serviceMesh) {
      throw new Error('Service mesh not found');
    }
    
    const serviceId = uuidv4();
    const now = new Date();
    
    const meshService: MeshService = {
      id: serviceId,
      name,
      namespace,
      containerId,
      ports,
      labels: {
        ...labels,
        'app': name,
        'version': 'v1',
        'managed-by': 'vaporform',
      },
      annotations: {},
      endpoints: [],
      healthCheck: {
        ...healthCheck,
        successThreshold: 1,
        failureThreshold: 3,
      },
      loadBalancing: {
        algorithm: 'round_robin',
        sessionAffinity: false,
        healthyPanicThreshold: 50,
      },
      circuitBreaker: {
        enabled: false,
        maxConnections: 1000,
        maxPendingRequests: 100,
        maxRetries: 3,
        maxRequests: 1000,
        consecutiveErrors: 5,
        interval: 30,
        baseEjectionTime: 30,
        maxEjectionPercent: 50,
      },
      retryPolicy: {
        enabled: true,
        attempts: 3,
        perTryTimeout: 5,
        retryOn: ['5xx', 'reset', 'connect-failure'],
        retryRemoteLocalities: false,
      },
      timeout: {
        enabled: true,
        requestTimeout: 30,
        connectionTimeout: 10,
        responseTimeout: 30,
      },
      rateLimiting: {
        enabled: false,
        requestsPerSecond: 100,
        requestsPerMinute: 6000,
        burstSize: 20,
        quotas: [],
      },
      security: {
        authentication: {
          enabled: false,
          methods: [],
        },
        authorization: {
          enabled: false,
          rules: [],
        },
        tls: {
          enabled: serviceMesh.configuration.enableMutualTLS,
          mode: 'MUTUAL',
          minVersion: '1.2',
          maxVersion: '1.3',
          cipherSuites: [],
        },
      },
      createdAt: now,
      updatedAt: now,
    };
    
    await registerService(meshService);
    
    log.info('Service added to mesh', { serviceId, meshId, serviceName: name });
    
    return meshService;
  },
);

// Create network policy
export const createNetworkPolicy = api<typeof CreateNetworkPolicyRequest>(
  { method: 'POST', path: '/network-policies', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<NetworkPolicy> => {
    const { name, namespace, type, podSelector, rules } = req;
    
    const policyId = uuidv4();
    const now = new Date();
    
    const networkPolicy: NetworkPolicy = {
      id: policyId,
      name,
      namespace,
      type,
      podSelector,
      rules: rules.map(rule => ({
        ...rule,
        id: uuidv4(),
      })),
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };
    
    networkPolicies.set(policyId, networkPolicy);
    
    // Apply network policy (in real implementation)
    await applyNetworkPolicy(networkPolicy);
    
    log.info('Network policy created', { policyId, name, namespace });
    
    return networkPolicy;
  },
);

async function applyNetworkPolicy(policy: NetworkPolicy): Promise<void> {
  const manifest = generateNetworkPolicyManifest(policy);
  await applyKubernetesManifest(manifest);
}

function generateNetworkPolicyManifest(policy: NetworkPolicy): string {
  return `
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ${policy.name}
  namespace: ${policy.namespace}
spec:
  podSelector:
    matchLabels:
${Object.entries(policy.podSelector).map(([key, value]) => `      ${key}: ${value}`).join('\n')}
  policyTypes:
${policy.type === 'both' ? '  - Ingress\n  - Egress' : 
    policy.type === 'ingress' ? '  - Ingress' : '  - Egress'}
${policy.rules.filter(r => r.direction === 'ingress').length > 0 ? `  ingress:
${policy.rules.filter(r => r.direction === 'ingress').map(rule => `  - from: []
    ports:
${rule.ports?.map(port => `    - port: ${port.port}
      protocol: ${port.protocol}`).join('\n') || '    - {}'}`).join('\n')}` : ''}
${policy.rules.filter(r => r.direction === 'egress').length > 0 ? `  egress:
${policy.rules.filter(r => r.direction === 'egress').map(rule => `  - to: []
    ports:
${rule.ports?.map(port => `    - port: ${port.port}
      protocol: ${port.protocol}`).join('\n') || '    - {}'}`).join('\n')}` : ''}
`;
}

// Get service mesh
export const getServiceMesh = api(
  { method: 'GET', path: '/service-mesh/:id', auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<ServiceMesh> => {
    const serviceMesh = serviceMeshes.get(req.id);
    if (!serviceMesh) {
      throw new Error('Service mesh not found');
    }
    
    // Update metrics
    await updateServiceMeshMetrics(serviceMesh);
    
    return serviceMesh;
  },
);

async function updateServiceMeshMetrics(serviceMesh: ServiceMesh): Promise<void> {
  // Update service mesh metrics from monitoring data
  const healthyServices = serviceMesh.services.filter(s => 
    s.endpoints.some(e => e.status === 'healthy'),
  ).length;
  
  serviceMesh.metrics = {
    ...serviceMesh.metrics,
    serviceCounts: {
      total: serviceMesh.services.length,
      healthy: healthyServices,
      unhealthy: serviceMesh.services.length - healthyServices,
    },
    lastUpdated: new Date(),
  };
  
  serviceMeshes.set(serviceMesh.id, serviceMesh);
}

// List service meshes
export const listServiceMeshes = api(
  { method: 'GET', path: '/service-mesh', auth: true, expose: true },
  async (req: { projectId?: string }, meta: APICallMeta<AuthData>): Promise<{ meshes: ServiceMesh[]; total: number }> => {
    let filteredMeshes = Array.from(serviceMeshes.values());
    
    if (req.projectId) {
      filteredMeshes = filteredMeshes.filter(mesh => mesh.projectId === req.projectId);
    }
    
    return {
      meshes: filteredMeshes,
      total: filteredMeshes.length,
    };
  },
);

// Get API gateway
export const getAPIGateway = api(
  { method: 'GET', path: '/api-gateway/:id', auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<APIGateway> => {
    const apiGateway = apiGateways.get(req.id);
    if (!apiGateway) {
      throw new Error('API gateway not found');
    }
    
    return apiGateway;
  },
);

// List API gateways
export const listAPIGateways = api(
  { method: 'GET', path: '/api-gateway', auth: true, expose: true },
  async (req: { projectId?: string }, meta: APICallMeta<AuthData>): Promise<{ gateways: APIGateway[]; total: number }> => {
    let filteredGateways = Array.from(apiGateways.values());
    
    if (req.projectId) {
      filteredGateways = filteredGateways.filter(gateway => gateway.projectId === req.projectId);
    }
    
    return {
      gateways: filteredGateways,
      total: filteredGateways.length,
    };
  },
);

// Create API route
export const createAPIRoute = api<typeof CreateAPIRouteRequest>(
  { method: 'POST', path: '/api-gateway/:gatewayId/routes', auth: true, expose: true },
  async (req: z.infer<typeof CreateAPIRouteRequest> & { gatewayId: string }, meta: APICallMeta<AuthData>): Promise<APIRoute> => {
    const { gatewayId, name, methods, hosts, paths, upstreamId, timeout, retries } = req;
    
    const apiGateway = apiGateways.get(gatewayId);
    if (!apiGateway) {
      throw new Error('API gateway not found');
    }
    
    const routeId = uuidv4();
    const now = new Date();
    
    const apiRoute: APIRoute = {
      id: routeId,
      name,
      methods,
      hosts,
      paths,
      upstreamId,
      middleware: [],
      timeout,
      retries,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };
    
    apiGateway.routes.push(apiRoute);
    apiGateways.set(gatewayId, apiGateway);
    apiRoutes.set(routeId, apiRoute);
    
    log.info('API route created', { routeId, gatewayId, name });
    
    return apiRoute;
  },
);

// Get network policies
export const getNetworkPolicies = api(
  { method: 'GET', path: '/network-policies', auth: true, expose: true },
  async (req: { namespace?: string }, meta: APICallMeta<AuthData>): Promise<{ policies: NetworkPolicy[]; total: number }> => {
    let filteredPolicies = Array.from(networkPolicies.values());
    
    if (req.namespace) {
      filteredPolicies = filteredPolicies.filter(policy => policy.namespace === req.namespace);
    }
    
    return {
      policies: filteredPolicies,
      total: filteredPolicies.length,
    };
  },
);

// Delete service mesh
export const deleteServiceMesh = api(
  { method: 'DELETE', path: '/service-mesh/:id', auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean }> => {
    const serviceMesh = serviceMeshes.get(req.id);
    if (!serviceMesh) {
      throw new Error('Service mesh not found');
    }
    
    // Clean up mesh components
    serviceMesh.status = 'destroying';
    
    // Remove services
    for (const service of serviceMesh.services) {
      meshServices.delete(service.id);
    }
    
    // Remove policies
    for (const policy of serviceMesh.policies) {
      networkPolicies.delete(policy.id);
    }
    
    serviceMeshes.delete(req.id);
    
    log.info('Service mesh deleted', { meshId: req.id });
    
    return { success: true };
  },
);