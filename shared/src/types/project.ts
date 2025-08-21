import { z } from 'zod';
import { UUIDSchema, TimestampSchema, EntityId } from './common';

// Project types
export type ProjectType = 'web' | 'mobile' | 'desktop' | 'api' | 'ai' | 'other';
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';
export type CollaboratorRole = 'owner' | 'collaborator' | 'viewer';

// Project interfaces
export interface Project {
  id: EntityId;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  ownerId: EntityId;
  collaborators: ProjectCollaborator[];
  config: ProjectConfig;
  createdAt: Date;
  updatedAt: Date;
  stats: ProjectStats;
}

export interface ProjectCollaborator {
  id: EntityId;
  userId: EntityId;
  role: CollaboratorRole;
  addedAt: Date;
  user?: {
    id: EntityId;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface ProjectConfig {
  framework?: string;
  language: string;
  dependencies: string[];
  environment: Record<string, string>;
  aiFeatures: AIFeatures;
  repository?: RepositoryConfig;
  deployment?: DeploymentConfig;
}

export interface AIFeatures {
  codeGeneration: boolean;
  codeReview: boolean;
  debugging: boolean;
  testing: boolean;
  refactoring: boolean;
  documentation: boolean;
}

export interface RepositoryConfig {
  provider: 'github' | 'gitlab' | 'bitbucket';
  url: string;
  branch: string;
  webhookUrl?: string;
}

export interface DeploymentConfig {
  provider: 'aws' | 'gcp' | 'azure' | 'vercel' | 'netlify' | 'docker';
  environment: 'development' | 'staging' | 'production';
  config: Record<string, unknown>;
}

export interface ProjectStats {
  filesCount: number;
  linesOfCode: number;
  lastActivity: Date;
  aiInteractions: number;
  collaboratorsCount: number;
}

// Project file system
export interface ProjectFile {
  id: EntityId;
  projectId: EntityId;
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  content?: string;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: EntityId;
  modifiedBy: EntityId;
}

export interface ProjectDirectory {
  id: EntityId;
  projectId: EntityId;
  path: string;
  name: string;
  parentId?: EntityId;
  children: (ProjectFile | ProjectDirectory)[];
  createdAt: Date;
  updatedAt: Date;
}

// Project creation and updates
export interface CreateProjectRequest {
  name: string;
  description: string;
  type: ProjectType;
  language: string;
  framework?: string;
  template?: string;
  aiFeatures?: Partial<AIFeatures>;
  repository?: RepositoryConfig;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  config?: Partial<ProjectConfig>;
}

export interface InviteCollaboratorRequest {
  email: string;
  role: CollaboratorRole;
  message?: string;
}

// Project templates
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  language: string;
  framework?: string;
  features: string[];
  config: Partial<ProjectConfig>;
  thumbnail?: string;
  tags: string[];
}

// Additional types for frontend compatibility
export interface ProjectSettings {
  name: string;
  description: string;
  language: string;
  framework?: string;
  aiFeatures: AIFeatures;
  environment: Record<string, string>;
  dependencies: string[];
}

// Zod schemas
export const ProjectTypeSchema = z.enum(['web', 'mobile', 'desktop', 'api', 'ai', 'other']);
export const ProjectStatusSchema = z.enum(['active', 'paused', 'completed', 'archived']);
export const CollaboratorRoleSchema = z.enum(['owner', 'collaborator', 'viewer']);

export const AIFeaturesSchema = z.object({
  codeGeneration: z.boolean().default(true),
  codeReview: z.boolean().default(true),
  debugging: z.boolean().default(true),
  testing: z.boolean().default(true),
  refactoring: z.boolean().default(false),
  documentation: z.boolean().default(true),
});

export const RepositoryConfigSchema = z.object({
  provider: z.enum(['github', 'gitlab', 'bitbucket']),
  url: z.string().url(),
  branch: z.string().default('main'),
  webhookUrl: z.string().url().optional(),
});

export const DeploymentConfigSchema = z.object({
  provider: z.enum(['aws', 'gcp', 'azure', 'vercel', 'netlify', 'docker']),
  environment: z.enum(['development', 'staging', 'production']),
  config: z.record(z.unknown()),
});

export const ProjectConfigSchema = z.object({
  framework: z.string().optional(),
  language: z.string(),
  dependencies: z.array(z.string()).default([]),
  environment: z.record(z.string()).default({}),
  aiFeatures: AIFeaturesSchema,
  repository: RepositoryConfigSchema.optional(),
  deployment: DeploymentConfigSchema.optional(),
});

export const ProjectStatsSchema = z.object({
  filesCount: z.number().int().min(0),
  linesOfCode: z.number().int().min(0),
  lastActivity: TimestampSchema,
  aiInteractions: z.number().int().min(0),
  collaboratorsCount: z.number().int().min(0),
});

export const ProjectCollaboratorSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  role: CollaboratorRoleSchema,
  addedAt: TimestampSchema,
  user: z.object({
    id: UUIDSchema,
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().url().optional(),
  }).optional(),
});

export const ProjectSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(1000),
  type: ProjectTypeSchema,
  status: ProjectStatusSchema,
  ownerId: UUIDSchema,
  collaborators: z.array(ProjectCollaboratorSchema),
  config: ProjectConfigSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  stats: ProjectStatsSchema,
});

export const CreateProjectRequestSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000),
  type: ProjectTypeSchema,
  language: z.string().min(1),
  framework: z.string().optional(),
  template: z.string().optional(),
  aiFeatures: AIFeaturesSchema.partial().optional(),
  repository: RepositoryConfigSchema.optional(),
});

export const UpdateProjectRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: ProjectStatusSchema.optional(),
  config: ProjectConfigSchema.partial().optional(),
});

export const InviteCollaboratorRequestSchema = z.object({
  email: z.string().email(),
  role: CollaboratorRoleSchema,
  message: z.string().max(500).optional(),
});

export const ProjectFileSchema = z.object({
  id: UUIDSchema,
  projectId: UUIDSchema,
  path: z.string().min(1).max(500),
  name: z.string().min(1).max(255),
  type: z.enum(['file', 'directory']),
  size: z.number().int().min(0).optional(),
  content: z.string().optional(),
  language: z.string().optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  createdBy: UUIDSchema,
  modifiedBy: UUIDSchema,
});

export const ProjectTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: ProjectTypeSchema,
  language: z.string(),
  framework: z.string().optional(),
  features: z.array(z.string()),
  config: ProjectConfigSchema.partial(),
  thumbnail: z.string().url().optional(),
  tags: z.array(z.string()),
});