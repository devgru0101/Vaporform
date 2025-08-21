import { z } from 'zod';
import { TimestampSchema, EntityId } from './common';

// AI service types
export type AIServiceType = 'code_generation' | 'code_review' | 'debugging' | 'testing' | 'refactoring' | 'documentation';
export type AIModel = 'claude-3-5-sonnet-20241022' | 'claude-3-haiku-20240307' | 'claude-3-opus-20240229';
export type AISessionStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

// AI request interfaces
export interface AIRequest {
  id: EntityId;
  userId: EntityId;
  projectId?: EntityId;
  type: AIServiceType;
  model: AIModel;
  prompt: string;
  context?: AIContext;
  config: AIRequestConfig;
  createdAt: Date;
}

export interface AIContext {
  language?: string;
  framework?: string;
  fileContent?: string;
  filePath?: string;
  projectStructure?: string;
  dependencies?: string[];
  codeSnippets?: CodeSnippet[];
  errorLogs?: string[];
}

export interface CodeSnippet {
  filePath: string;
  content: string;
  startLine?: number;
  endLine?: number;
  language?: string;
}

export interface AIRequestConfig {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
  timeout?: number;
}

// AI response interfaces
export interface AIResponse {
  id: EntityId;
  requestId: EntityId;
  type: AIServiceType;
  model: AIModel;
  content: string;
  suggestions?: string[];
  confidence: number;
  metadata: AIResponseMetadata;
  usage: TokenUsage;
  createdAt: Date;
  completedAt: Date;
}

export interface AIResponseMetadata {
  processingTime: number;
  cacheHit?: boolean;
  version: string;
  flags?: string[];
  reasoning?: string;
  alternativeApproaches?: string[];
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

// AI session management
export interface AISession {
  id: EntityId;
  userId: EntityId;
  projectId?: EntityId;
  type: AIServiceType;
  status: AISessionStatus;
  requests: AIRequest[];
  responses: AIResponse[];
  totalCost: number;
  startedAt: Date;
  completedAt?: Date;
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  iterationCount: number;
  totalTokens: number;
  averageConfidence: number;
  successRate: number;
  userFeedback?: UserFeedback[];
}

export interface UserFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  helpful: boolean;
  timestamp: Date;
}

// Specific AI service requests
export interface CodeGenerationRequest {
  prompt: string;
  language: string;
  framework?: string;
  style?: 'functional' | 'object-oriented' | 'procedural';
  includeComments: boolean;
  includeTests: boolean;
  targetComplexity?: 'simple' | 'moderate' | 'complex';
}

export interface CodeReviewRequest {
  code: string;
  language: string;
  focusAreas: CodeReviewFocus[];
  severity?: 'low' | 'medium' | 'high';
  includeRefactoring: boolean;
}

export type CodeReviewFocus = 'security' | 'performance' | 'maintainability' | 'style' | 'bugs' | 'best-practices';

export interface DebuggingRequest {
  code: string;
  error: string;
  language: string;
  stackTrace?: string;
  environment?: string;
  reproductionSteps?: string[];
}

export interface TestGenerationRequest {
  code: string;
  language: string;
  testType: 'unit' | 'integration' | 'e2e';
  framework?: string;
  coverage?: 'basic' | 'comprehensive' | 'edge-cases';
  mockingStrategy?: 'minimal' | 'extensive';
}

export interface RefactoringRequest {
  code: string;
  language: string;
  goals: RefactoringGoal[];
  preserveBehavior: boolean;
  modernizeCode: boolean;
}

export type RefactoringGoal = 'performance' | 'readability' | 'maintainability' | 'modularity' | 'reduce-complexity';

export interface DocumentationRequest {
  code: string;
  language: string;
  docType: 'inline' | 'api' | 'readme' | 'tutorial';
  audience: 'developers' | 'end-users' | 'both';
  includeExamples: boolean;
}

// AI service responses
export interface CodeGenerationResponse extends AIResponse {
  code: string;
  explanation: string;
  dependencies?: string[];
  testSuggestions?: string[];
}

export interface CodeReviewResponse extends AIResponse {
  issues: CodeIssue[];
  improvements: CodeImprovement[];
  score: number;
  summary: string;
}

export interface CodeIssue {
  type: 'bug' | 'security' | 'performance' | 'style' | 'maintainability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  line?: number;
  column?: number;
  message: string;
  suggestion?: string;
  rule?: string;
}

export interface CodeImprovement {
  type: 'optimization' | 'modernization' | 'simplification' | 'best-practice';
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  codeSnippet?: string;
}

// Zod schemas
export const AIServiceTypeSchema = z.enum(['code_generation', 'code_review', 'debugging', 'testing', 'refactoring', 'documentation']);
export const AIModelSchema = z.enum(['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229']);
export const AISessionStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']);

export const CodeSnippetSchema = z.object({
  filePath: z.string(),
  content: z.string(),
  startLine: z.number().int().min(1).optional(),
  endLine: z.number().int().min(1).optional(),
  language: z.string().optional(),
});

export const AIContextSchema = z.object({
  language: z.string().optional(),
  framework: z.string().optional(),
  fileContent: z.string().optional(),
  filePath: z.string().optional(),
  projectStructure: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  codeSnippets: z.array(CodeSnippetSchema).optional(),
  errorLogs: z.array(z.string()).optional(),
});

export const AIRequestConfigSchema = z.object({
  maxTokens: z.number().int().min(1).max(8000).default(4000),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).default(1),
  presencePenalty: z.number().min(-2).max(2).default(0),
  frequencyPenalty: z.number().min(-2).max(2).default(0),
  stopSequences: z.array(z.string()).optional(),
  timeout: z.number().int().min(1000).max(300000).default(30000),
});

export const TokenUsageSchema = z.object({
  promptTokens: z.number().int().min(0),
  completionTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0),
  cost: z.number().min(0).optional(),
});

export const UserFeedbackSchema = z.object({
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  comment: z.string().max(1000).optional(),
  helpful: z.boolean(),
  timestamp: TimestampSchema,
});

export const CodeGenerationRequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  language: z.string().min(1),
  framework: z.string().optional(),
  style: z.enum(['functional', 'object-oriented', 'procedural']).optional(),
  includeComments: z.boolean().default(true),
  includeTests: z.boolean().default(false),
  targetComplexity: z.enum(['simple', 'moderate', 'complex']).optional(),
});

export const CodeReviewFocusSchema = z.enum(['security', 'performance', 'maintainability', 'style', 'bugs', 'best-practices']);

export const CodeReviewRequestSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  focusAreas: z.array(CodeReviewFocusSchema),
  severity: z.enum(['low', 'medium', 'high']).default('medium'),
  includeRefactoring: z.boolean().default(true),
});

export const DebuggingRequestSchema = z.object({
  code: z.string().min(1),
  error: z.string().min(1),
  language: z.string().min(1),
  stackTrace: z.string().optional(),
  environment: z.string().optional(),
  reproductionSteps: z.array(z.string()).optional(),
});

export const TestGenerationRequestSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  testType: z.enum(['unit', 'integration', 'e2e']),
  framework: z.string().optional(),
  coverage: z.enum(['basic', 'comprehensive', 'edge-cases']).default('comprehensive'),
  mockingStrategy: z.enum(['minimal', 'extensive']).default('minimal'),
});

export const RefactoringGoalSchema = z.enum(['performance', 'readability', 'maintainability', 'modularity', 'reduce-complexity']);

export const RefactoringRequestSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  goals: z.array(RefactoringGoalSchema),
  preserveBehavior: z.boolean().default(true),
  modernizeCode: z.boolean().default(true),
});

export const DocumentationRequestSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  docType: z.enum(['inline', 'api', 'readme', 'tutorial']),
  audience: z.enum(['developers', 'end-users', 'both']),
  includeExamples: z.boolean().default(true),
});

// Frontend AI types for backwards compatibility
export interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    context?: string[];
    codeBlocks?: Array<{
      language: string;
      code: string;
      fileName?: string;
    }>;
  };
}

export interface AiConversation {
  id: string;
  title: string;
  messages: AiMessage[];
  createdAt: Date;
  updatedAt: Date;
  projectId: string | undefined;
  tags: string[];
}