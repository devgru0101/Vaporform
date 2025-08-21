import { api, APICallMeta } from 'encore.dev/api';
import log from 'encore.dev/log';
import { z } from 'zod';
import { AuthData } from './auth';
import { v4 as uuidv4 } from 'uuid';

// Project interfaces
export interface Project {
  id: string;
  name: string;
  description: string;
  type: 'web' | 'mobile' | 'desktop' | 'api' | 'ai' | 'other';
  status: 'active' | 'paused' | 'completed' | 'archived';
  owner: string;
  collaborators: string[];
  createdAt: Date;
  updatedAt: Date;
  config: ProjectConfig;
}

export interface ProjectConfig {
  framework?: string;
  language: string;
  dependencies: string[];
  environment: Record<string, string>;
  aiFeatures: {
    codeGeneration: boolean;
    codeReview: boolean;
    debugging: boolean;
    testing: boolean;
  };
}

// Request/Response schemas
const CreateProjectRequest = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  type: z.enum(['web', 'mobile', 'desktop', 'api', 'ai', 'other']),
  language: z.string(),
  framework: z.string().optional(),
  aiFeatures: z.object({
    codeGeneration: z.boolean().default(true),
    codeReview: z.boolean().default(true),
    debugging: z.boolean().default(true),
    testing: z.boolean().default(true),
  }).default({}),
});

const UpdateProjectRequest = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  config: z.object({
    framework: z.string().optional(),
    language: z.string().optional(),
    dependencies: z.array(z.string()).optional(),
    environment: z.record(z.string()).optional(),
    aiFeatures: z.object({
      codeGeneration: z.boolean(),
      codeReview: z.boolean(),
      debugging: z.boolean(),
      testing: z.boolean(),
    }).optional(),
  }).optional(),
});

const ProjectResponse = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['web', 'mobile', 'desktop', 'api', 'ai', 'other']),
  status: z.enum(['active', 'paused', 'completed', 'archived']),
  owner: z.string(),
  collaborators: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
  config: z.object({
    framework: z.string().optional(),
    language: z.string(),
    dependencies: z.array(z.string()),
    environment: z.record(z.string()),
    aiFeatures: z.object({
      codeGeneration: z.boolean(),
      codeReview: z.boolean(),
      debugging: z.boolean(),
      testing: z.boolean(),
    }),
  }),
});

// Mock project storage (replace with database)
const projects: Map<string, Project> = new Map();

// Create project endpoint
export const createProject = api<typeof CreateProjectRequest, typeof ProjectResponse>(
  { method: 'POST', path: '/projects', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof ProjectResponse>> => {
    const { userID } = meta.auth;
    const { name, description, type, language, framework, aiFeatures } = req;
    
    log.info('Creating project', { name, type, owner: userID });
    
    const projectId = uuidv4();
    const now = new Date();
    
    const project: Project = {
      id: projectId,
      name,
      description,
      type,
      status: 'active',
      owner: userID,
      collaborators: [],
      createdAt: now,
      updatedAt: now,
      config: {
        framework,
        language,
        dependencies: [],
        environment: {},
        aiFeatures: {
          codeGeneration: aiFeatures?.codeGeneration ?? true,
          codeReview: aiFeatures?.codeReview ?? true,
          debugging: aiFeatures?.debugging ?? true,
          testing: aiFeatures?.testing ?? true,
        },
      },
    };
    
    projects.set(projectId, project);
    
    log.info('Project created successfully', { projectId, name });
    
    return project;
  },
);

// Get project endpoint
export const getProject = api(
  { method: 'GET', path: '/projects/:id', auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<Project> => {
    const { userID } = meta.auth;
    const { id } = req;
    
    const project = projects.get(id);
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Check access permissions
    if (project.owner !== userID && !project.collaborators.includes(userID)) {
      throw new Error('Access denied');
    }
    
    return project;
  },
);

// List projects endpoint
export const listProjects = api(
  { method: 'GET', path: '/projects', auth: true, expose: true },
  async (req: { limit?: number; offset?: number }, meta: APICallMeta<AuthData>): Promise<{ projects: Project[]; total: number }> => {
    const { userID } = meta.auth;
    const { limit = 20, offset = 0 } = req;
    
    // Filter projects for current user
    const userProjects = Array.from(projects.values()).filter(
      project => project.owner === userID || project.collaborators.includes(userID),
    );
    
    // Apply pagination
    const paginatedProjects = userProjects.slice(offset, offset + limit);
    
    return {
      projects: paginatedProjects,
      total: userProjects.length,
    };
  },
);

// Update project endpoint
export const updateProject = api<typeof UpdateProjectRequest, typeof ProjectResponse>(
  { method: 'PUT', path: '/projects/:id', auth: true, expose: true },
  async (req: z.infer<typeof UpdateProjectRequest> & { id: string }, meta: APICallMeta<AuthData>): Promise<z.infer<typeof ProjectResponse>> => {
    const { userID } = meta.auth;
    const { id, ...updates } = req;
    
    const project = projects.get(id);
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Check permissions (only owner can update)
    if (project.owner !== userID) {
      throw new Error('Access denied');
    }
    
    // Apply updates
    const updatedProject: Project = {
      ...project,
      ...updates,
      config: updates.config ? { ...project.config, ...updates.config } : project.config,
      updatedAt: new Date(),
    };
    
    projects.set(id, updatedProject);
    
    log.info('Project updated', { projectId: id, updates: Object.keys(updates) });
    
    return updatedProject;
  },
);

// Delete project endpoint
export const deleteProject = api(
  { method: 'DELETE', path: '/projects/:id', auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean }> => {
    const { userID } = meta.auth;
    const { id } = req;
    
    const project = projects.get(id);
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Check permissions (only owner can delete)
    if (project.owner !== userID) {
      throw new Error('Access denied');
    }
    
    projects.delete(id);
    
    log.info('Project deleted', { projectId: id });
    
    return { success: true };
  },
);