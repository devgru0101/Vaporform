import { z } from 'zod';
import { UUIDSchema, EmailSchema, PasswordSchema, TimestampSchema } from './common';

// User role enumeration
export type UserRole = 'admin' | 'user' | 'viewer';

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  preferences: UserPreferences;
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  editor: {
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    lineNumbers: boolean;
    minimap: boolean;
  };
}

// Authentication
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Profile update
export interface ProfileUpdate {
  name?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

// Zod schemas
export const UserRoleSchema = z.enum(['admin', 'user', 'viewer']);

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.string().default('en'),
  timezone: z.string().default('UTC'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    inApp: z.boolean().default(true),
  }).default({}),
  editor: z.object({
    fontSize: z.number().int().min(8).max(32).default(14),
    tabSize: z.number().int().min(1).max(8).default(2),
    wordWrap: z.boolean().default(true),
    lineNumbers: z.boolean().default(true),
    minimap: z.boolean().default(true),
  }).default({}),
});

export const UserSchema = z.object({
  id: UUIDSchema,
  email: EmailSchema,
  name: z.string().min(1).max(255),
  role: UserRoleSchema,
  isActive: z.boolean(),
  emailVerified: z.boolean(),
  avatar: z.string().url().optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  lastLogin: TimestampSchema.optional(),
  preferences: UserPreferencesSchema,
});

export const LoginCredentialsSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export const RegisterDataSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: z.string().min(1).max(255),
});

export const AuthUserSchema = z.object({
  id: UUIDSchema,
  email: EmailSchema,
  name: z.string(),
  role: UserRoleSchema,
});

export const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatar: z.string().url().optional(),
  preferences: UserPreferencesSchema.partial().optional(),
});

export const PasswordChangeSchema = z.object({
  currentPassword: PasswordSchema,
  newPassword: PasswordSchema,
});

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: TimestampSchema,
});