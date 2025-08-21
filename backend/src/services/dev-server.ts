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
import chokidar from 'chokidar';
import WebSocket from 'ws';

const docker = new Docker();
const execAsync = promisify(exec);

// Development server interfaces
export interface DevServer {
  id: string;
  containerId: string;
  projectId: string;
  name: string;
  type: 'development' | 'preview' | 'debug';
  status: 'starting' | 'running' | 'stopped' | 'error' | 'restarting';
  configuration: DevServerConfig;
  features: DevServerFeatures;
  performance: DevServerPerformance;
  logs: DevServerLog[];
  watchers: FileWatcher[];
  proxies: DevServerProxy[];
  tunnels: DevServerTunnel[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface DevServerConfig {
  framework: string;
  runtime: string;
  buildTool: string;
  packageManager: string;
  startCommand: string;
  buildCommand?: string;
  testCommand?: string;
  port: number;
  host: string;
  env: { [key: string]: string };
  workingDirectory: string;
  autoRestart: boolean;
  hotReload: boolean;
  liveBrowser: boolean;
  debugMode: boolean;
  sourceMap: boolean;
  customConfig?: { [key: string]: any };
}

export interface DevServerFeatures {
  hotReload: {
    enabled: boolean;
    excludePatterns: string[];
    includePatterns: string[];
    debounceMs: number;
  };
  liveBrowser: {
    enabled: boolean;
    port: number;
    injectScript: boolean;
    syncScrolling: boolean;
    syncClicks: boolean;
    syncForms: boolean;
  };
  debugging: {
    enabled: boolean;
    debugPort: number;
    inspectorPort?: number;
    breakOnStart: boolean;
    sourceMaps: boolean;
  };
  testing: {
    enabled: boolean;
    watchMode: boolean;
    coverage: boolean;
    autoRun: boolean;
  };
  linting: {
    enabled: boolean;
    onSave: boolean;
    autoFix: boolean;
    rules: string[];
  };
  formatting: {
    enabled: boolean;
    onSave: boolean;
    tool: 'prettier' | 'eslint' | 'custom';
    config?: { [key: string]: any };
  };
}

export interface DevServerPerformance {
  startupTime: number; // milliseconds
  buildTime: number; // milliseconds
  reloadTime: number; // milliseconds
  memoryUsage: number; // bytes
  cpuUsage: number; // percentage
  bundleSize?: number; // bytes
  chunksCount?: number;
  moduleCount?: number;
  lastReload: Date;
  reloadCount: number;
}

export interface DevServerLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: 'server' | 'build' | 'test' | 'lint' | 'format';
  message: string;
  metadata?: { [key: string]: any };
}

export interface FileWatcher {
  id: string;
  path: string;
  patterns: string[];
  ignored: string[];
  events: WatchEvent[];
  isActive: boolean;
  lastEvent?: Date;
}

export interface WatchEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
  timestamp: Date;
  size?: number;
}

export interface DevServerProxy {
  id: string;
  path: string;
  target: string;
  changeOrigin: boolean;
  secure: boolean;
  headers?: { [key: string]: string };
  rewrite?: { [key: string]: string };
  auth?: {
    username: string;
    password: string;
  };
}

export interface DevServerTunnel {
  id: string;
  type: 'ngrok' | 'localtunnel' | 'custom';
  localPort: number;
  publicUrl: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  config: TunnelConfig;
  createdAt: Date;
}

export interface TunnelConfig {
  subdomain?: string;
  auth?: string;
  region?: string;
  customDomain?: string;
  headers?: { [key: string]: string };
}

export interface PreviewSession {
  id: string;
  devServerId: string;
  name: string;
  url: string;
  type: 'iframe' | 'popup' | 'tab';
  device: DeviceSimulation;
  features: PreviewFeatures;
  metadata: { [key: string]: any };
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
}

export interface DeviceSimulation {
  type: 'desktop' | 'mobile' | 'tablet' | 'custom';
  name: string;
  width: number;
  height: number;
  userAgent: string;
  pixelRatio: number;
  touchEnabled: boolean;
  orientation: 'portrait' | 'landscape';
}

export interface PreviewFeatures {
  responsive: boolean;
  touchSimulation: boolean;
  networkThrottling: boolean;
  geolocation: boolean;
  console: boolean;
  devTools: boolean;
}

// Request/Response schemas
const CreateDevServerRequest = z.object({
  containerId: z.string(),
  projectId: z.string(),
  name: z.string().min(1).max(100),
  type: z.enum(['development', 'preview', 'debug']).default('development'),
  configuration: z.object({
    framework: z.string(),
    runtime: z.string().default('18'),
    buildTool: z.string().optional(),
    packageManager: z.enum(['npm', 'yarn', 'pnpm']).default('npm'),
    startCommand: z.string().default('npm start'),
    buildCommand: z.string().optional(),
    testCommand: z.string().optional(),
    port: z.number().min(1000).max(65535).default(3000),
    host: z.string().default('0.0.0.0'),
    env: z.record(z.string()).default({}),
    workingDirectory: z.string().default('/app'),
    autoRestart: z.boolean().default(true),
    hotReload: z.boolean().default(true),
    liveBrowser: z.boolean().default(true),
    debugMode: z.boolean().default(false),
    sourceMap: z.boolean().default(true),
  }),
  features: z.object({
    hotReload: z.object({
      enabled: z.boolean().default(true),
      excludePatterns: z.array(z.string()).default(['node_modules/**', '*.log', '.git/**']),
      includePatterns: z.array(z.string()).default(['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx', '**/*.css', '**/*.scss']),
      debounceMs: z.number().default(300),
    }).optional(),
    liveBrowser: z.object({
      enabled: z.boolean().default(true),
      injectScript: z.boolean().default(true),
      syncScrolling: z.boolean().default(false),
      syncClicks: z.boolean().default(false),
      syncForms: z.boolean().default(false),
    }).optional(),
    debugging: z.object({
      enabled: z.boolean().default(false),
      breakOnStart: z.boolean().default(false),
      sourceMaps: z.boolean().default(true),
    }).optional(),
  }).optional(),
});

const UpdateDevServerRequest = z.object({
  configuration: z.object({
    autoRestart: z.boolean().optional(),
    hotReload: z.boolean().optional(),
    debugMode: z.boolean().optional(),
    env: z.record(z.string()).optional(),
  }).optional(),
  features: z.object({
    hotReload: z.object({
      enabled: z.boolean().optional(),
      debounceMs: z.number().optional(),
    }).optional(),
    debugging: z.object({
      enabled: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

const CreatePreviewRequest = z.object({
  name: z.string().min(1).max(100),
  device: z.object({
    type: z.enum(['desktop', 'mobile', 'tablet', 'custom']),
    name: z.string(),
    width: z.number().min(320).max(4096),
    height: z.number().min(240).max(2160),
    userAgent: z.string().optional(),
    pixelRatio: z.number().default(1),
    touchEnabled: z.boolean().default(false),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  }),
  features: z.object({
    responsive: z.boolean().default(true),
    touchSimulation: z.boolean().default(false),
    networkThrottling: z.boolean().default(false),
    console: z.boolean().default(true),
    devTools: z.boolean().default(false),
  }).optional(),
});

const DevServerActionRequest = z.object({
  action: z.enum(['start', 'stop', 'restart', 'rebuild', 'test', 'lint', 'format']),
  options: z.record(z.any()).optional(),
});

// Storage for development servers (replace with database)
const devServers: Map<string, DevServer> = new Map();
const previewSessions: Map<string, PreviewSession> = new Map();
const fileWatchers: Map<string, chokidar.FSWatcher> = new Map();
const webSocketConnections: Map<string, WebSocket[]> = new Map();

// Device presets
const devicePresets: { [key: string]: DeviceSimulation } = {
  'iPhone 13': {
    type: 'mobile',
    name: 'iPhone 13',
    width: 390,
    height: 844,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    pixelRatio: 3,
    touchEnabled: true,
    orientation: 'portrait',
  },
  'Samsung Galaxy S21': {
    type: 'mobile',
    name: 'Samsung Galaxy S21',
    width: 384,
    height: 854,
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
    pixelRatio: 2.75,
    touchEnabled: true,
    orientation: 'portrait',
  },
  'iPad Pro': {
    type: 'tablet',
    name: 'iPad Pro',
    width: 1024,
    height: 1366,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    pixelRatio: 2,
    touchEnabled: true,
    orientation: 'portrait',
  },
  'Desktop 1920x1080': {
    type: 'desktop',
    name: 'Desktop 1920x1080',
    width: 1920,
    height: 1080,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    pixelRatio: 1,
    touchEnabled: false,
    orientation: 'landscape',
  },
};

// Development server management functions
async function startDevServer(devServer: DevServer): Promise<void> {
  const { containerId, configuration } = devServer;
  
  log.info('Starting development server', { 
    devServerId: devServer.id, 
    containerId, 
    framework: configuration.framework, 
  });

  try {
    devServer.status = 'starting';
    devServer.performance.lastReload = new Date();
    const startTime = Date.now();

    // Get Docker container
    const dockerContainer = docker.getContainer(containerId);
    const containerInfo = await dockerContainer.inspect();

    if (!containerInfo.State.Running) {
      throw new Error('Container is not running');
    }

    // Setup development environment based on framework
    await setupDevEnvironment(devServer);

    // Start file watchers
    if (configuration.hotReload) {
      await startFileWatchers(devServer);
    }

    // Start the development server process
    await executeInContainer(containerId, configuration.startCommand, {
      cwd: configuration.workingDirectory,
      env: {
        ...configuration.env,
        NODE_ENV: 'development',
        PORT: configuration.port.toString(),
        HOST: configuration.host,
      },
    });

    // Wait for server to be ready
    await waitForServerReady(devServer);

    devServer.status = 'running';
    devServer.performance.startupTime = Date.now() - startTime;

    // Setup live browser if enabled
    if (devServer.features.liveBrowser.enabled) {
      await setupLiveBrowser(devServer);
    }

    // Setup debugging if enabled
    if (devServer.features.debugging.enabled) {
      await setupDebugging(devServer);
    }

    log.info('Development server started successfully', { 
      devServerId: devServer.id,
      startupTime: devServer.performance.startupTime, 
    });

  } catch (error) {
    devServer.status = 'error';
    addDevServerLog(devServer, 'error', 'server', `Failed to start: ${error.message}`);
    log.error('Failed to start development server', { 
      error: error.message, 
      devServerId: devServer.id, 
    });
    throw error;
  }

  devServers.set(devServer.id, devServer);
}

async function setupDevEnvironment(devServer: DevServer): Promise<void> {
  const { containerId, configuration } = devServer;
  const { framework, packageManager } = configuration;

  addDevServerLog(devServer, 'info', 'server', `Setting up ${framework} development environment`);

  // Install development dependencies if needed
  const devDependencies = getDevDependencies(framework);
  if (devDependencies.length > 0) {
    addDevServerLog(devServer, 'info', 'server', `Installing development dependencies: ${devDependencies.join(', ')}`);
    
    const installCommand = `${packageManager} install ${devDependencies.join(' ')} --save-dev`;
    await executeInContainer(containerId, installCommand, {
      cwd: configuration.workingDirectory,
    });
  }

  // Setup framework-specific configuration
  await setupFrameworkConfig(devServer);
}

function getDevDependencies(framework: string): string[] {
  const dependencies: { [key: string]: string[] } = {
    'react': ['@types/react', '@types/react-dom', 'react-refresh'],
    'vue': ['@vue/cli-service', 'vue-template-compiler'],
    'angular': ['@angular/cli', '@angular-devkit/build-angular'],
    'next': ['@next/bundle-analyzer'],
    'express': ['nodemon', 'concurrently'],
    'fastify': ['fastify-cli'],
    'svelte': ['@sveltejs/adapter-auto'],
    'nuxt': ['@nuxt/devtools'],
  };

  return dependencies[framework] || [];
}

async function setupFrameworkConfig(devServer: DevServer): Promise<void> {
  const { containerId, configuration } = devServer;
  const { framework, workingDirectory } = configuration;

  switch (framework) {
    case 'react':
      await setupReactConfig(devServer);
      break;
    case 'vue':
      await setupVueConfig(devServer);
      break;
    case 'angular':
      await setupAngularConfig(devServer);
      break;
    case 'next':
      await setupNextConfig(devServer);
      break;
    case 'express':
      await setupExpressConfig(devServer);
      break;
    default:
      addDevServerLog(devServer, 'info', 'server', `Using default configuration for ${framework}`);
  }
}

async function setupReactConfig(devServer: DevServer): Promise<void> {
  const { containerId, configuration } = devServer;
  
  // Create or update React development configuration
  const webpackConfig = `
const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    hot: true,
    port: ${configuration.port},
    host: '${configuration.host}',
    allowedHosts: 'all',
    client: {
      webSocketURL: 'ws://localhost:${configuration.port}/ws'
    }
  },
  plugins: [
    new (require('webpack')).HotModuleReplacementPlugin()
  ]
};
`;

  await writeFileToContainer(containerId, 
    path.join(configuration.workingDirectory, 'webpack.dev.js'), 
    webpackConfig,
  );

  addDevServerLog(devServer, 'info', 'build', 'React development configuration updated');
}

async function setupVueConfig(devServer: DevServer): Promise<void> {
  const { containerId, configuration } = devServer;
  
  const vueConfig = `
module.exports = {
  devServer: {
    port: ${configuration.port},
    host: '${configuration.host}',
    hot: true,
    liveReload: true
  },
  configureWebpack: {
    devtool: 'eval-source-map'
  }
};
`;

  await writeFileToContainer(containerId, 
    path.join(configuration.workingDirectory, 'vue.config.js'), 
    vueConfig,
  );

  addDevServerLog(devServer, 'info', 'build', 'Vue development configuration updated');
}

async function setupAngularConfig(devServer: DevServer): Promise<void> {
  const { containerId, configuration } = devServer;
  
  // Update angular.json for development configuration
  const angularConfigPath = path.join(configuration.workingDirectory, 'angular.json');
  
  try {
    const configStr = await readFileFromContainer(containerId, angularConfigPath);
    const config = JSON.parse(configStr);
    
    if (config.projects && Object.keys(config.projects).length > 0) {
      const projectName = Object.keys(config.projects)[0];
      const project = config.projects[projectName];
      
      if (project.architect?.serve) {
        project.architect.serve.options = {
          ...project.architect.serve.options,
          port: configuration.port,
          host: configuration.host,
          hmr: true,
          liveReload: true,
        };
        
        await writeFileToContainer(containerId, angularConfigPath, JSON.stringify(config, null, 2));
        addDevServerLog(devServer, 'info', 'build', 'Angular development configuration updated');
      }
    }
  } catch (error) {
    addDevServerLog(devServer, 'warn', 'build', `Could not update Angular config: ${error.message}`);
  }
}

async function setupNextConfig(devServer: DevServer): Promise<void> {
  const { containerId, configuration } = devServer;
  
  const nextConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true
  },
  env: {
    CUSTOM_KEY: 'development'
  }
};

module.exports = nextConfig;
`;

  await writeFileToContainer(containerId, 
    path.join(configuration.workingDirectory, 'next.config.js'), 
    nextConfig,
  );

  addDevServerLog(devServer, 'info', 'build', 'Next.js development configuration updated');
}

async function setupExpressConfig(devServer: DevServer): Promise<void> {
  const { containerId, configuration } = devServer;
  
  // Create nodemon configuration for Express
  const nodemonConfig = `
{
  "watch": ["src/**/*"],
  "ext": "js,ts,json",
  "ignore": ["node_modules/**/*", "dist/**/*"],
  "exec": "node ${configuration.workingDirectory}/app.js",
  "env": {
    "NODE_ENV": "development",
    "PORT": "${configuration.port}"
  }
}
`;

  await writeFileToContainer(containerId, 
    path.join(configuration.workingDirectory, 'nodemon.json'), 
    nodemonConfig,
  );

  addDevServerLog(devServer, 'info', 'build', 'Express development configuration updated');
}

async function startFileWatchers(devServer: DevServer): Promise<void> {
  const { id: devServerId, containerId, configuration, features } = devServer;
  const { hotReload } = features;

  if (!hotReload.enabled) {
    return;
  }

  addDevServerLog(devServer, 'info', 'server', 'Starting file watchers for hot reload');

  // Create file watcher
  const watcherId = uuidv4();
  const watchPath = `/containers/${containerId}/workspace`; // Mount point for container workspace
  
  const watcher = chokidar.watch(watchPath, {
    ignored: hotReload.excludePatterns,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: hotReload.debounceMs,
      pollInterval: 100,
    },
  });

  const fileWatcher: FileWatcher = {
    id: watcherId,
    path: watchPath,
    patterns: hotReload.includePatterns,
    ignored: hotReload.excludePatterns,
    events: [],
    isActive: true,
  };

  // Setup event handlers
  watcher.on('change', async (filePath) => {
    await handleFileChange(devServer, fileWatcher, 'change', filePath);
  });

  watcher.on('add', async (filePath) => {
    await handleFileChange(devServer, fileWatcher, 'add', filePath);
  });

  watcher.on('unlink', async (filePath) => {
    await handleFileChange(devServer, fileWatcher, 'unlink', filePath);
  });

  watcher.on('error', (error) => {
    addDevServerLog(devServer, 'error', 'server', `File watcher error: ${error.message}`);
  });

  devServer.watchers.push(fileWatcher);
  fileWatchers.set(watcherId, watcher);

  addDevServerLog(devServer, 'info', 'server', `File watcher started for ${watchPath}`);
}

async function handleFileChange(
  devServer: DevServer, 
  fileWatcher: FileWatcher, 
  eventType: WatchEvent['type'], 
  filePath: string,
): Promise<void> {
  const event: WatchEvent = {
    type: eventType,
    path: filePath,
    timestamp: new Date(),
  };

  fileWatcher.events.push(event);
  fileWatcher.lastEvent = event.timestamp;

  // Keep only last 100 events
  if (fileWatcher.events.length > 100) {
    fileWatcher.events.splice(0, fileWatcher.events.length - 100);
  }

  addDevServerLog(devServer, 'info', 'server', `File ${eventType}: ${path.basename(filePath)}`);

  // Trigger hot reload
  await triggerHotReload(devServer, filePath);
}

async function triggerHotReload(devServer: DevServer, changedFile: string): Promise<void> {
  const startTime = Date.now();
  
  try {
    addDevServerLog(devServer, 'info', 'server', 'Triggering hot reload...');

    // Framework-specific hot reload
    await performFrameworkHotReload(devServer, changedFile);

    // Notify connected browsers
    await notifyBrowserClients(devServer, {
      type: 'file-changed',
      file: changedFile,
      timestamp: new Date().toISOString(),
    });

    devServer.performance.reloadTime = Date.now() - startTime;
    devServer.performance.reloadCount++;
    devServer.performance.lastReload = new Date();

    addDevServerLog(devServer, 'info', 'server', `Hot reload completed in ${devServer.performance.reloadTime}ms`);

  } catch (error) {
    addDevServerLog(devServer, 'error', 'server', `Hot reload failed: ${error.message}`);
  }
}

async function performFrameworkHotReload(devServer: DevServer, changedFile: string): Promise<void> {
  const { containerId, configuration } = devServer;
  const { framework } = configuration;

  switch (framework) {
    case 'react':
      // React Fast Refresh is handled by webpack-dev-server
      break;
    case 'vue':
      // Vue hot reload is handled by vue-cli-service
      break;
    case 'next':
      // Next.js handles hot reload automatically
      break;
    case 'express':
      // Restart the server for Express
      await restartExpressServer(devServer);
      break;
    default:
      // Generic reload - send signal to container
      await executeInContainer(containerId, 'pkill -SIGUSR2 node || true', {});
  }
}

async function restartExpressServer(devServer: DevServer): Promise<void> {
  const { containerId } = devServer;
  
  // Use nodemon to restart the server
  await executeInContainer(containerId, 'pkill -SIGUSR2 nodemon || pkill -SIGUSR2 node', {});
  
  addDevServerLog(devServer, 'info', 'server', 'Express server restarted');
}

async function setupLiveBrowser(devServer: DevServer): Promise<void> {
  const { features } = devServer;
  const { liveBrowser } = features;

  if (!liveBrowser.enabled) {
    return;
  }

  const liveBrowserPort = liveBrowser.port || devServer.configuration.port + 1;
  
  // Setup WebSocket server for live browser communication
  const wsServer = new WebSocket.Server({ port: liveBrowserPort });
  
  wsServer.on('connection', (ws) => {
    addDevServerLog(devServer, 'info', 'server', 'Browser client connected to live reload');
    
    // Add to connections
    if (!webSocketConnections.has(devServer.id)) {
      webSocketConnections.set(devServer.id, []);
    }
    webSocketConnections.get(devServer.id)!.push(ws);
    
    ws.on('close', () => {
      const connections = webSocketConnections.get(devServer.id) || [];
      const index = connections.indexOf(ws);
      if (index > -1) {
        connections.splice(index, 1);
      }
    });

    // Send initial configuration
    ws.send(JSON.stringify({
      type: 'config',
      data: {
        syncScrolling: liveBrowser.syncScrolling,
        syncClicks: liveBrowser.syncClicks,
        syncForms: liveBrowser.syncForms,
      },
    }));
  });

  addDevServerLog(devServer, 'info', 'server', `Live browser WebSocket server started on port ${liveBrowserPort}`);
}

async function notifyBrowserClients(devServer: DevServer, message: any): Promise<void> {
  const connections = webSocketConnections.get(devServer.id) || [];
  
  const messageStr = JSON.stringify(message);
  
  connections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

async function setupDebugging(devServer: DevServer): Promise<void> {
  const { containerId, features } = devServer;
  const { debugging } = features;

  if (!debugging.enabled) {
    return;
  }

  const debugPort = debugging.debugPort || 9229;
  const inspectorPort = debugging.inspectorPort || 9230;

  // Enable Node.js debugging
  const debugFlags = [
    `--inspect=0.0.0.0:${debugPort}`,
    debugging.breakOnStart ? '--inspect-brk' : '',
    debugging.sourceMaps ? '--enable-source-maps' : '',
  ].filter(Boolean).join(' ');

  // Update start command to include debug flags
  const originalCommand = devServer.configuration.startCommand;
  devServer.configuration.startCommand = `node ${debugFlags} ${originalCommand.replace(/^(npm|yarn|pnpm)\s+(start|dev)/, '.')}`;

  addDevServerLog(devServer, 'info', 'server', `Debugging enabled on port ${debugPort}`);
}

async function waitForServerReady(devServer: DevServer): Promise<void> {
  const { configuration } = devServer;
  const maxAttempts = 30;
  const delayMs = 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Try to connect to the server
      const response = await fetch(`http://${configuration.host}:${configuration.port}`, {
        method: 'GET',
        timeout: 5000,
      });
      
      if (response.ok || response.status < 500) {
        addDevServerLog(devServer, 'info', 'server', 'Development server is ready');
        return;
      }
    } catch (error) {
      // Server not ready yet
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Development server failed to start within timeout period');
}

// Container execution helpers
async function executeInContainer(
  containerId: string, 
  command: string, 
  options: { cwd?: string; env?: { [key: string]: string } },
): Promise<string> {
  const dockerContainer = docker.getContainer(containerId);
  
  const execOptions = {
    Cmd: ['sh', '-c', command],
    AttachStdout: true,
    AttachStderr: true,
    WorkingDir: options.cwd,
    Env: options.env ? Object.entries(options.env).map(([k, v]) => `${k}=${v}`) : undefined,
  };

  const exec = await dockerContainer.exec(execOptions);
  const stream = await exec.start({ hijack: true, stdin: false });
  
  return new Promise((resolve, reject) => {
    let output = '';
    
    stream.on('data', (chunk) => {
      output += chunk.toString();
    });
    
    stream.on('end', () => {
      resolve(output);
    });
    
    stream.on('error', (error) => {
      reject(error);
    });
  });
}

async function writeFileToContainer(containerId: string, filePath: string, content: string): Promise<void> {
  const command = `cat > "${filePath}" << 'EOF'\n${content}\nEOF`;
  await executeInContainer(containerId, command, {});
}

async function readFileFromContainer(containerId: string, filePath: string): Promise<string> {
  return await executeInContainer(containerId, `cat "${filePath}"`, {});
}

// Utility functions
function addDevServerLog(
  devServer: DevServer, 
  level: DevServerLog['level'], 
  source: DevServerLog['source'], 
  message: string,
  metadata?: any,
): void {
  const logEntry: DevServerLog = {
    id: uuidv4(),
    timestamp: new Date(),
    level,
    source,
    message,
    metadata,
  };

  devServer.logs.push(logEntry);

  // Keep only last 1000 logs
  if (devServer.logs.length > 1000) {
    devServer.logs.splice(0, devServer.logs.length - 1000);
  }

  // Also log to system
  log.info('DevServer log', { 
    devServerId: devServer.id, 
    level, 
    source, 
    message, 
  });
}

async function stopDevServer(devServer: DevServer): Promise<void> {
  log.info('Stopping development server', { devServerId: devServer.id });

  // Stop file watchers
  for (const watcher of devServer.watchers) {
    const fsWatcher = fileWatchers.get(watcher.id);
    if (fsWatcher) {
      await fsWatcher.close();
      fileWatchers.delete(watcher.id);
    }
    watcher.isActive = false;
  }

  // Close WebSocket connections
  const connections = webSocketConnections.get(devServer.id) || [];
  connections.forEach(ws => ws.close());
  webSocketConnections.delete(devServer.id);

  // Stop the development server process in container
  try {
    await executeInContainer(devServer.containerId, 'pkill -f node || true', {});
  } catch (error) {
    addDevServerLog(devServer, 'warn', 'server', `Error stopping process: ${error.message}`);
  }

  devServer.status = 'stopped';
  devServers.set(devServer.id, devServer);

  addDevServerLog(devServer, 'info', 'server', 'Development server stopped');
}

// API Endpoints

// Create development server
export const createDevServer = api<typeof CreateDevServerRequest>(
  { method: 'POST', path: '/dev-servers', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<DevServer> => {
    const { userID } = meta.auth;
    const { containerId, projectId, name, type, configuration, features } = req;
    
    log.info('Creating development server', { containerId, projectId, name, type, userID });
    
    const devServerId = uuidv4();
    const now = new Date();
    
    // Set default features
    const defaultFeatures: DevServerFeatures = {
      hotReload: {
        enabled: features?.hotReload?.enabled ?? true,
        excludePatterns: features?.hotReload?.excludePatterns ?? ['node_modules/**', '*.log', '.git/**'],
        includePatterns: features?.hotReload?.includePatterns ?? ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx', '**/*.css', '**/*.scss'],
        debounceMs: features?.hotReload?.debounceMs ?? 300,
      },
      liveBrowser: {
        enabled: features?.liveBrowser?.enabled ?? true,
        port: configuration.port + 1,
        injectScript: features?.liveBrowser?.injectScript ?? true,
        syncScrolling: features?.liveBrowser?.syncScrolling ?? false,
        syncClicks: features?.liveBrowser?.syncClicks ?? false,
        syncForms: features?.liveBrowser?.syncForms ?? false,
      },
      debugging: {
        enabled: features?.debugging?.enabled ?? false,
        debugPort: 9229,
        inspectorPort: 9230,
        breakOnStart: features?.debugging?.breakOnStart ?? false,
        sourceMaps: features?.debugging?.sourceMaps ?? true,
      },
      testing: {
        enabled: false,
        watchMode: false,
        coverage: false,
        autoRun: false,
      },
      linting: {
        enabled: false,
        onSave: false,
        autoFix: false,
        rules: [],
      },
      formatting: {
        enabled: false,
        onSave: false,
        tool: 'prettier',
      },
    };

    const devServer: DevServer = {
      id: devServerId,
      containerId,
      projectId,
      name,
      type,
      status: 'stopped',
      configuration,
      features: defaultFeatures,
      performance: {
        startupTime: 0,
        buildTime: 0,
        reloadTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        lastReload: now,
        reloadCount: 0,
      },
      logs: [],
      watchers: [],
      proxies: [],
      tunnels: [],
      createdAt: now,
      updatedAt: now,
      createdBy: userID,
    };

    devServers.set(devServerId, devServer);
    
    addDevServerLog(devServer, 'info', 'server', 'Development server created');
    
    log.info('Development server created', { devServerId, containerId });
    
    return devServer;
  },
);

// Start development server
export const startDevServerEndpoint = api(
  { method: 'POST', path: '/dev-servers/:id/start', auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean; message: string }> => {
    const devServer = devServers.get(req.id);
    if (!devServer) {
      throw new Error('Development server not found');
    }

    if (devServer.status === 'running') {
      return { success: true, message: 'Development server is already running' };
    }

    try {
      await startDevServer(devServer);
      return { success: true, message: 'Development server started successfully' };
    } catch (error) {
      return { success: false, message: `Failed to start development server: ${error.message}` };
    }
  },
);

// Stop development server
export const stopDevServerEndpoint = api(
  { method: 'POST', path: '/dev-servers/:id/stop', auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean; message: string }> => {
    const devServer = devServers.get(req.id);
    if (!devServer) {
      throw new Error('Development server not found');
    }

    if (devServer.status === 'stopped') {
      return { success: true, message: 'Development server is already stopped' };
    }

    try {
      await stopDevServer(devServer);
      return { success: true, message: 'Development server stopped successfully' };
    } catch (error) {
      return { success: false, message: `Failed to stop development server: ${error.message}` };
    }
  },
);

// Get development server
export const getDevServer = api(
  { method: 'GET', path: '/dev-servers/:id', auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<DevServer> => {
    const devServer = devServers.get(req.id);
    if (!devServer) {
      throw new Error('Development server not found');
    }
    
    return devServer;
  },
);

// List development servers
export const listDevServers = api(
  { method: 'GET', path: '/dev-servers', auth: true, expose: true },
  async (req: { containerId?: string; projectId?: string; status?: string }, meta: APICallMeta<AuthData>): Promise<{ devServers: DevServer[]; total: number }> => {
    let filteredDevServers = Array.from(devServers.values());
    
    if (req.containerId) {
      filteredDevServers = filteredDevServers.filter(ds => ds.containerId === req.containerId);
    }
    
    if (req.projectId) {
      filteredDevServers = filteredDevServers.filter(ds => ds.projectId === req.projectId);
    }
    
    if (req.status) {
      filteredDevServers = filteredDevServers.filter(ds => ds.status === req.status);
    }
    
    return {
      devServers: filteredDevServers,
      total: filteredDevServers.length,
    };
  },
);

// Development server actions
export const devServerAction = api<typeof DevServerActionRequest>(
  { method: 'POST', path: '/dev-servers/:id/actions', auth: true, expose: true },
  async (req: z.infer<typeof DevServerActionRequest> & { id: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean; message: string; output?: string }> => {
    const { id, action, options } = req;
    
    const devServer = devServers.get(id);
    if (!devServer) {
      throw new Error('Development server not found');
    }

    log.info('Development server action', { devServerId: id, action });

    try {
      let output = '';
      
      switch (action) {
        case 'start':
          await startDevServer(devServer);
          break;
        case 'stop':
          await stopDevServer(devServer);
          break;
        case 'restart':
          await stopDevServer(devServer);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          await startDevServer(devServer);
          break;
        case 'rebuild':
          if (devServer.configuration.buildCommand) {
            output = await executeInContainer(devServer.containerId, devServer.configuration.buildCommand, {
              cwd: devServer.configuration.workingDirectory,
            });
            addDevServerLog(devServer, 'info', 'build', 'Rebuild completed');
          }
          break;
        case 'test':
          if (devServer.configuration.testCommand) {
            output = await executeInContainer(devServer.containerId, devServer.configuration.testCommand, {
              cwd: devServer.configuration.workingDirectory,
            });
            addDevServerLog(devServer, 'info', 'test', 'Tests completed');
          }
          break;
        case 'lint':
          output = await executeInContainer(devServer.containerId, 'npm run lint || yarn lint || pnpm lint', {
            cwd: devServer.configuration.workingDirectory,
          });
          addDevServerLog(devServer, 'info', 'lint', 'Linting completed');
          break;
        case 'format':
          output = await executeInContainer(devServer.containerId, 'npm run format || yarn format || pnpm format', {
            cwd: devServer.configuration.workingDirectory,
          });
          addDevServerLog(devServer, 'info', 'format', 'Formatting completed');
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      return { 
        success: true, 
        message: `Action '${action}' completed successfully`,
        output: output || undefined,
      };

    } catch (error) {
      addDevServerLog(devServer, 'error', 'server', `Action '${action}' failed: ${error.message}`);
      return { 
        success: false, 
        message: `Action '${action}' failed: ${error.message}`, 
      };
    }
  },
);

// Create preview session
export const createPreviewSession = api<typeof CreatePreviewRequest>(
  { method: 'POST', path: '/dev-servers/:id/preview', auth: true, expose: true },
  async (req: z.infer<typeof CreatePreviewRequest> & { id: string }, meta: APICallMeta<AuthData>): Promise<PreviewSession> => {
    const { id: devServerId, name, device, features } = req;
    
    const devServer = devServers.get(devServerId);
    if (!devServer) {
      throw new Error('Development server not found');
    }

    const sessionId = uuidv4();
    const now = new Date();
    
    const previewSession: PreviewSession = {
      id: sessionId,
      devServerId,
      name,
      url: `http://${devServer.configuration.host}:${devServer.configuration.port}`,
      type: 'iframe',
      device,
      features: {
        responsive: features?.responsive ?? true,
        touchSimulation: features?.touchSimulation ?? device.touchEnabled,
        networkThrottling: features?.networkThrottling ?? false,
        geolocation: features?.geolocation ?? false,
        console: features?.console ?? true,
        devTools: features?.devTools ?? false,
      },
      metadata: {},
      createdAt: now,
      lastAccessed: now,
      accessCount: 0,
    };

    previewSessions.set(sessionId, previewSession);
    
    log.info('Preview session created', { sessionId, devServerId, deviceType: device.type });
    
    return previewSession;
  },
);

// Get device presets
export const getDevicePresets = api(
  { method: 'GET', path: '/dev-servers/device-presets', auth: true, expose: true },
  async (req: {}, meta: APICallMeta<AuthData>): Promise<{ [key: string]: DeviceSimulation }> => {
    return devicePresets;
  },
);

// Get development server logs
export const getDevServerLogs = api(
  { method: 'GET', path: '/dev-servers/:id/logs', auth: true, expose: true },
  async (req: { id: string; level?: string; source?: string; limit?: number }, meta: APICallMeta<AuthData>): Promise<{ logs: DevServerLog[]; total: number }> => {
    const devServer = devServers.get(req.id);
    if (!devServer) {
      throw new Error('Development server not found');
    }

    let filteredLogs = devServer.logs;
    
    if (req.level) {
      filteredLogs = filteredLogs.filter(log => log.level === req.level);
    }
    
    if (req.source) {
      filteredLogs = filteredLogs.filter(log => log.source === req.source);
    }
    
    // Return most recent logs first
    filteredLogs = filteredLogs.reverse();
    
    if (req.limit) {
      filteredLogs = filteredLogs.slice(0, req.limit);
    }
    
    return {
      logs: filteredLogs,
      total: filteredLogs.length,
    };
  },
);

// Update development server
export const updateDevServer = api<typeof UpdateDevServerRequest>(
  { method: 'PATCH', path: '/dev-servers/:id', auth: true, expose: true },
  async (req: z.infer<typeof UpdateDevServerRequest> & { id: string }, meta: APICallMeta<AuthData>): Promise<DevServer> => {
    const { id, configuration, features } = req;
    
    const devServer = devServers.get(id);
    if (!devServer) {
      throw new Error('Development server not found');
    }

    // Update configuration
    if (configuration) {
      Object.assign(devServer.configuration, configuration);
    }

    // Update features
    if (features) {
      if (features.hotReload) {
        Object.assign(devServer.features.hotReload, features.hotReload);
      }
      if (features.debugging) {
        Object.assign(devServer.features.debugging, features.debugging);
      }
    }

    devServer.updatedAt = new Date();
    devServers.set(id, devServer);
    
    addDevServerLog(devServer, 'info', 'server', 'Development server configuration updated');
    
    return devServer;
  },
);

// Delete development server
export const deleteDevServer = api(
  { method: 'DELETE', path: '/dev-servers/:id', auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean }> => {
    const devServer = devServers.get(req.id);
    if (!devServer) {
      throw new Error('Development server not found');
    }

    // Stop the server if running
    if (devServer.status === 'running') {
      await stopDevServer(devServer);
    }

    // Clean up preview sessions
    const sessionsToDelete = Array.from(previewSessions.entries())
      .filter(([_, session]) => session.devServerId === req.id)
      .map(([sessionId]) => sessionId);
    
    sessionsToDelete.forEach(sessionId => previewSessions.delete(sessionId));

    devServers.delete(req.id);
    
    log.info('Development server deleted', { devServerId: req.id });
    
    return { success: true };
  },
);