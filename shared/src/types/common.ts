import { z } from 'zod';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Error types
export interface ErrorDetails {
  code: string;
  message: string;
  field?: string;
  value?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Timestamps
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// ID types
export type UUID = string;
export type EntityId = UUID;

// Status types
export type Status = 'active' | 'inactive' | 'pending' | 'suspended';

// Environment types
export type Environment = 'development' | 'testing' | 'staging' | 'production';

// Zod schemas for validation
export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const PasswordSchema = z.string().min(8).max(128);
export const TimestampSchema = z.date();

export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    timestamp: z.string(),
    requestId: z.string().optional(),
  });

// File types
export interface BasicFileMetadata {
  id: EntityId;
  name: string;
  size: number;
  type: string;
  path: string;
  hash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const BasicFileMetadataSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  size: z.number().int().min(0),
  type: z.string().min(1).max(100),
  path: z.string().min(1).max(500),
  hash: z.string().optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// Health check
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  version: string;
  uptime: number;
  dependencies: Record<string, {
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    error?: string;
  }>;
}

export const HealthCheckSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  timestamp: TimestampSchema,
  version: z.string(),
  uptime: z.number(),
  dependencies: z.record(z.object({
    status: z.enum(['healthy', 'unhealthy']),
    responseTime: z.number().optional(),
    error: z.string().optional(),
  })),
});