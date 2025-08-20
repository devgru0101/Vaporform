import { z } from 'zod';
import { ApiResponse, PaginatedResponse, ValidationError } from './common';
import { User, AuthTokens } from './user';
import { Project } from './project';
import { AIResponse } from './ai';

// API endpoint interfaces
export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  authenticated: boolean;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

// Request/Response types for each endpoint
export namespace AuthAPI {
  export interface LoginRequest {
    email: string;
    password: string;
  }

  export interface LoginResponse extends ApiResponse<{
    user: User;
    tokens: AuthTokens;
  }> {}

  export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
  }

  export interface RegisterResponse extends ApiResponse<{
    user: User;
    tokens: AuthTokens;
  }> {}

  export interface RefreshRequest {
    refreshToken: string;
  }

  export interface RefreshResponse extends ApiResponse<{
    tokens: AuthTokens;
  }> {}

  export interface LogoutResponse extends ApiResponse<{}> {}

  export interface ForgotPasswordRequest {
    email: string;
  }

  export interface ForgotPasswordResponse extends ApiResponse<{}> {}

  export interface ResetPasswordRequest {
    token: string;
    password: string;
  }

  export interface ResetPasswordResponse extends ApiResponse<{}> {}
}

export namespace UserAPI {
  export interface GetProfileResponse extends ApiResponse<User> {}

  export interface UpdateProfileRequest {
    name?: string;
    avatar?: string;
    preferences?: Partial<User['preferences']>;
  }

  export interface UpdateProfileResponse extends ApiResponse<User> {}

  export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
  }

  export interface ChangePasswordResponse extends ApiResponse<{}> {}

  export interface DeleteAccountResponse extends ApiResponse<{}> {}
}

export namespace ProjectAPI {
  export interface CreateProjectRequest {
    name: string;
    description: string;
    type: Project['type'];
    language: string;
    framework?: string;
    template?: string;
    aiFeatures?: Partial<Project['config']['aiFeatures']>;
  }

  export interface CreateProjectResponse extends ApiResponse<Project> {}

  export interface GetProjectResponse extends ApiResponse<Project> {}

  export interface ListProjectsRequest {
    page?: number;
    limit?: number;
    status?: Project['status'];
    type?: Project['type'];
    search?: string;
  }

  export interface ListProjectsResponse extends ApiResponse<PaginatedResponse<Project>> {}

  export interface UpdateProjectRequest {
    name?: string;
    description?: string;
    status?: Project['status'];
    config?: Partial<Project['config']>;
  }

  export interface UpdateProjectResponse extends ApiResponse<Project> {}

  export interface DeleteProjectResponse extends ApiResponse<{}> {}

  export interface InviteCollaboratorRequest {
    email: string;
    role: 'collaborator' | 'viewer';
    message?: string;
  }

  export interface InviteCollaboratorResponse extends ApiResponse<{}> {}

  export interface RemoveCollaboratorResponse extends ApiResponse<{}> {}
}

export namespace AIAPI {
  export interface GenerateCodeRequest {
    prompt: string;
    language: string;
    framework?: string;
    context?: string;
    projectId?: string;
  }

  export interface GenerateCodeResponse extends ApiResponse<AIResponse> {}

  export interface ReviewCodeRequest {
    code: string;
    language: string;
    focus?: string[];
    projectId?: string;
  }

  export interface ReviewCodeResponse extends ApiResponse<AIResponse> {}

  export interface DebugCodeRequest {
    code: string;
    error: string;
    language: string;
    context?: string;
    projectId?: string;
  }

  export interface DebugCodeResponse extends ApiResponse<AIResponse> {}

  export interface GenerateTestsRequest {
    code: string;
    language: string;
    testType?: 'unit' | 'integration' | 'e2e';
    framework?: string;
    projectId?: string;
  }

  export interface GenerateTestsResponse extends ApiResponse<AIResponse> {}

  export interface RefactorCodeRequest {
    code: string;
    language: string;
    goals?: string[];
    projectId?: string;
  }

  export interface RefactorCodeResponse extends ApiResponse<AIResponse> {}

  export interface GenerateDocsRequest {
    code: string;
    language: string;
    docType?: 'inline' | 'api' | 'readme' | 'tutorial';
    projectId?: string;
  }

  export interface GenerateDocsResponse extends ApiResponse<AIResponse> {}
}

export namespace FileAPI {
  export interface ListFilesRequest {
    projectId: string;
    path?: string;
    recursive?: boolean;
  }

  export interface ListFilesResponse extends ApiResponse<{
    files: Array<{
      id: string;
      name: string;
      path: string;
      type: 'file' | 'directory';
      size?: number;
      modifiedAt: Date;
    }>;
  }> {}

  export interface GetFileRequest {
    projectId: string;
    filePath: string;
  }

  export interface GetFileResponse extends ApiResponse<{
    id: string;
    name: string;
    path: string;
    content: string;
    language?: string;
    size: number;
    modifiedAt: Date;
  }> {}

  export interface SaveFileRequest {
    projectId: string;
    filePath: string;
    content: string;
  }

  export interface SaveFileResponse extends ApiResponse<{
    id: string;
    path: string;
    size: number;
    modifiedAt: Date;
  }> {}

  export interface DeleteFileRequest {
    projectId: string;
    filePath: string;
  }

  export interface DeleteFileResponse extends ApiResponse<{}> {}

  export interface RenameFileRequest {
    projectId: string;
    oldPath: string;
    newPath: string;
  }

  export interface RenameFileResponse extends ApiResponse<{}> {}
}

// Error response types
export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
  timestamp: string;
  requestId?: string;
}

export interface ValidationErrorResponse extends ApiResponse<never> {
  success: false;
  error: string;
  details: ValidationError[];
}

// WebSocket message types
export namespace WebSocketAPI {
  export type MessageType = 
    | 'project_updated'
    | 'file_changed'
    | 'collaborator_joined'
    | 'collaborator_left'
    | 'ai_response'
    | 'system_notification';

  export interface WebSocketMessage<T = unknown> {
    type: MessageType;
    data: T;
    timestamp: string;
    userId?: string;
    projectId?: string;
  }

  export interface ProjectUpdatedMessage {
    type: 'project_updated';
    data: {
      projectId: string;
      changes: Partial<Project>;
      updatedBy: string;
    };
  }

  export interface FileChangedMessage {
    type: 'file_changed';
    data: {
      projectId: string;
      filePath: string;
      changeType: 'created' | 'modified' | 'deleted' | 'renamed';
      content?: string;
      modifiedBy: string;
    };
  }

  export interface CollaboratorJoinedMessage {
    type: 'collaborator_joined';
    data: {
      projectId: string;
      user: {
        id: string;
        name: string;
        avatar?: string;
      };
    };
  }

  export interface CollaboratorLeftMessage {
    type: 'collaborator_left';
    data: {
      projectId: string;
      userId: string;
    };
  }

  export interface AIResponseMessage {
    type: 'ai_response';
    data: {
      sessionId: string;
      response: AIResponse;
      status: 'completed' | 'error';
    };
  }

  export interface SystemNotificationMessage {
    type: 'system_notification';
    data: {
      level: 'info' | 'warning' | 'error';
      message: string;
      action?: {
        label: string;
        url: string;
      };
    };
  }
}

// Rate limiting
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  windowMs: number;
}

export interface RateLimitExceededError extends ApiError {
  code: 'RATE_LIMIT_EXCEEDED';
  retryAfter: number;
  rateLimitInfo: RateLimitInfo;
}

// Zod schemas for API validation
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string(),
  })).optional(),
  timestamp: z.string(),
  requestId: z.string().optional(),
});

export const RateLimitInfoSchema = z.object({
  limit: z.number().int().min(0),
  remaining: z.number().int().min(0),
  reset: z.date(),
  windowMs: z.number().int().min(0),
});