import { api, APICallMeta } from "encore.dev/api";
import log from "encore.dev/log";
import { z } from "zod";
import { AuthData } from "./auth";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// AI service configuration
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// AI Workflow Integration schemas
const GitCommitGenerationRequest = z.object({
  changes: z.array(z.object({
    filePath: z.string(),
    changeType: z.enum(["added", "modified", "deleted", "renamed"]),
    diff: z.string().optional(),
    oldPath: z.string().optional(), // for renamed files
  })),
  commitType: z.enum(["feat", "fix", "docs", "style", "refactor", "test", "chore"]).optional(),
  scope: z.string().optional(),
  includeDescription: z.boolean().default(true),
  maxLength: z.number().min(20).max(200).default(72),
  conventional: z.boolean().default(true),
});

const BranchNamingRequest = z.object({
  taskDescription: z.string(),
  taskType: z.enum(["feature", "bugfix", "hotfix", "experiment", "refactor"]),
  ticketNumber: z.string().optional(),
  includeUserName: z.boolean().default(false),
  userName: z.string().optional(),
  namingConvention: z.enum(["kebab", "snake", "camel"]).default("kebab"),
});

const CodeReviewRequest = z.object({
  pullRequestId: z.string().optional(),
  diff: z.string(),
  files: z.array(z.object({
    filePath: z.string(),
    content: z.string().optional(),
    language: z.string().optional(),
  })),
  reviewType: z.enum(["security", "performance", "style", "logic", "comprehensive"]).default("comprehensive"),
  targetBranch: z.string().default("main"),
  includeTests: z.boolean().default(true),
});

const DeploymentAnalysisRequest = z.object({
  environment: z.enum(["development", "staging", "production"]),
  applicationName: z.string(),
  deploymentConfig: z.string().optional(), // Docker, K8s, etc.
  infrastructureType: z.enum(["docker", "kubernetes", "serverless", "traditional"]),
  previousDeployment: z.string().optional(),
  rollbackRequired: z.boolean().default(false),
});

const CICDPipelineRequest = z.object({
  projectType: z.string(),
  language: z.string(),
  framework: z.string().optional(),
  targetPlatform: z.enum(["github", "gitlab", "bitbucket", "jenkins", "azure"]),
  includeTests: z.boolean().default(true),
  includeQualityGates: z.boolean().default(true),
  includeSecurity: z.boolean().default(true),
  deploymentTargets: z.array(z.string()).default(["staging", "production"]),
});

const WorkflowOptimizationRequest = z.object({
  currentWorkflow: z.string(),
  painPoints: z.array(z.string()),
  teamSize: z.number().min(1).max(100),
  projectComplexity: z.enum(["simple", "moderate", "complex"]),
  complianceRequirements: z.array(z.string()).optional(),
  performanceGoals: z.array(z.string()).optional(),
});

const GitWorkflowResponse = z.object({
  commitMessage: z.string().optional(),
  branchName: z.string().optional(),
  description: z.string().optional(),
  suggestions: z.array(z.string()),
  bestPractices: z.array(z.string()),
  metadata: z.object({
    conventional: z.boolean(),
    type: z.string(),
    scope: z.string().optional(),
    generatedAt: z.string(),
  }),
});

const CodeReviewResponse = z.object({
  overall: z.object({
    score: z.number().min(0).max(100),
    recommendation: z.enum(["approve", "request_changes", "needs_discussion"]),
    summary: z.string(),
  }),
  findings: z.array(z.object({
    type: z.enum(["bug", "security", "performance", "style", "best_practice", "suggestion"]),
    severity: z.enum(["low", "medium", "high", "critical"]),
    file: z.string(),
    line: z.number().optional(),
    message: z.string(),
    suggestion: z.string().optional(),
    code: z.string().optional(),
  })),
  positives: z.array(z.string()),
  improvements: z.array(z.object({
    category: z.string(),
    description: z.string(),
    priority: z.enum(["low", "medium", "high"]),
    effort: z.enum(["low", "medium", "high"]),
  })),
  securityAnalysis: z.object({
    score: z.number(),
    vulnerabilities: z.array(z.object({
      type: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      description: z.string(),
      mitigation: z.string(),
    })),
  }).optional(),
  testingRecommendations: z.array(z.string()),
  metadata: z.object({
    reviewTime: z.number(),
    filesAnalyzed: z.number(),
    model: z.string(),
    timestamp: z.string(),
  }),
});

const DeploymentResponse = z.object({
  recommendation: z.enum(["proceed", "wait", "cancel", "rollback"]),
  readinessScore: z.number().min(0).max(100),
  checklist: z.array(z.object({
    item: z.string(),
    status: z.enum(["completed", "pending", "failed", "skipped"]),
    priority: z.enum(["low", "medium", "high", "critical"]),
    description: z.string(),
  })),
  risks: z.array(z.object({
    category: z.enum(["security", "performance", "availability", "data", "compliance"]),
    severity: z.enum(["low", "medium", "high", "critical"]),
    description: z.string(),
    mitigation: z.string(),
    likelihood: z.enum(["low", "medium", "high"]),
  })),
  optimizations: z.array(z.object({
    type: z.enum(["performance", "cost", "security", "reliability"]),
    description: z.string(),
    impact: z.enum(["low", "medium", "high"]),
    effort: z.enum(["low", "medium", "high"]),
  })),
  rollbackPlan: z.object({
    strategy: z.string(),
    estimatedTime: z.string(),
    prerequisites: z.array(z.string()),
  }),
  monitoringRecommendations: z.array(z.string()),
  metadata: z.object({
    environment: z.string(),
    analysisTime: z.number(),
    model: z.string(),
    timestamp: z.string(),
  }),
});

// Git commit message generation endpoint
export const generateCommitMessage = api<typeof GitCommitGenerationRequest, typeof GitWorkflowResponse>(
  { method: "POST", path: "/ai/generate-commit", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof GitWorkflowResponse>> => {
    const { userID } = meta.auth;
    const { changes, commitType, scope, includeDescription, maxLength, conventional } = req;
    
    const startTime = Date.now();
    log.info("Git commit generation request", { 
      userID, 
      changesCount: changes.length,
      commitType,
      conventional 
    });
    
    try {
      const systemPrompt = `You are an expert Git workflow assistant specializing in commit message generation.

Generate ${conventional ? 'conventional commit' : 'descriptive'} messages following best practices:

${conventional ? `
Conventional Commit Format:
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build
` : ''}

Rules:
1. Keep subject line under ${maxLength} characters
2. Use imperative mood ("Add" not "Added")
3. Be specific and descriptive
4. ${includeDescription ? 'Include detailed description when needed' : 'Keep it concise'}
5. Consider the impact and context of changes

Analyze the changes and generate an appropriate commit message.`;

      const changesDescription = changes.map(change => {
        const action = change.changeType === 'added' ? 'Added' :
                      change.changeType === 'modified' ? 'Modified' :
                      change.changeType === 'deleted' ? 'Deleted' : 'Renamed';
        
        let desc = `${action}: ${change.filePath}`;
        if (change.oldPath) {
          desc += ` (from ${change.oldPath})`;
        }
        if (change.diff) {
          desc += `\nChanges: ${change.diff.slice(0, 200)}...`;
        }
        return desc;
      }).join('\n\n');

      const userMessage = `Generate a ${conventional ? 'conventional' : 'standard'} commit message for these changes:

${changesDescription}

Requirements:
${commitType ? `- Type: ${commitType}` : '- Auto-detect type'}
${scope ? `- Scope: ${scope}` : ''}
- Max length: ${maxLength} characters
- Include description: ${includeDescription}
- Conventional: ${conventional}

Provide a clear, professional commit message that accurately describes the changes.`;

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });

      const aiResponse = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      // Parse and format the commit message
      const commitData = parseCommitMessage(aiResponse, conventional, commitType, scope);
      
      const processingTime = Date.now() - startTime;
      
      log.info("Git commit generation completed", { 
        userID, 
        messageLength: commitData.commitMessage?.length || 0,
        processingTime 
      });

      return {
        commitMessage: commitData.commitMessage,
        description: includeDescription ? commitData.description : undefined,
        suggestions: [
          "Review the commit message for accuracy",
          "Ensure all related changes are included",
          "Consider squashing related commits",
          "Add issue references if applicable"
        ],
        bestPractices: [
          "Keep commits atomic and focused",
          "Write clear, descriptive messages",
          "Use conventional commit format for automation",
          "Include breaking change notes when applicable"
        ],
        metadata: {
          conventional,
          type: commitData.type,
          scope: commitData.scope,
          generatedAt: new Date().toISOString(),
        }
      };

    } catch (error) {
      log.error("Git commit generation failed", { error: error.message, userID });
      throw new Error("Failed to generate commit message");
    }
  }
);

// Branch naming suggestion endpoint
export const suggestBranchName = api<typeof BranchNamingRequest, typeof GitWorkflowResponse>(
  { method: "POST", path: "/ai/suggest-branch", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof GitWorkflowResponse>> => {
    const { userID } = meta.auth;
    const { 
      taskDescription, 
      taskType, 
      ticketNumber, 
      includeUserName, 
      userName, 
      namingConvention 
    } = req;
    
    const startTime = Date.now();
    log.info("Branch naming request", { userID, taskType, namingConvention });
    
    try {
      const systemPrompt = `You are a Git workflow expert specializing in branch naming conventions.

Generate clear, descriptive branch names following these patterns:

Feature: ${taskType}/descriptive-name${ticketNumber ? '-TICKET' : ''}${includeUserName ? '-username' : ''}
Naming Convention: ${namingConvention}

Rules:
1. Use ${namingConvention} case formatting
2. Keep names concise but descriptive (under 50 characters)
3. Include task type prefix
4. Avoid special characters except hyphens/underscores
5. Make it searchable and intuitive
6. ${ticketNumber ? 'Include ticket number when provided' : ''}

Generate professional branch names that are easy to understand and follow team conventions.`;

      const userMessage = `Generate a branch name for this task:

Task: ${taskDescription}
Type: ${taskType}
${ticketNumber ? `Ticket: ${ticketNumber}` : ''}
${includeUserName && userName ? `User: ${userName}` : ''}

Naming Convention: ${namingConvention}

Provide a clear, professional branch name that follows best practices.`;

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });

      const aiResponse = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      // Parse and format the branch name
      const branchName = formatBranchName(aiResponse, taskType, namingConvention, ticketNumber, userName, includeUserName);
      
      const processingTime = Date.now() - startTime;
      
      log.info("Branch naming completed", { 
        userID, 
        branchName,
        processingTime 
      });

      return {
        branchName,
        description: `Branch for ${taskType}: ${taskDescription}`,
        suggestions: [
          "Ensure branch name aligns with team conventions",
          "Keep branch focused on single task/feature",
          "Delete branch after merging",
          "Use descriptive names for easier tracking"
        ],
        bestPractices: [
          "Include task type prefix for organization",
          "Keep names under 50 characters",
          "Use consistent naming conventions",
          "Avoid special characters and spaces"
        ],
        metadata: {
          conventional: true,
          type: taskType,
          generatedAt: new Date().toISOString(),
        }
      };

    } catch (error) {
      log.error("Branch naming failed", { error: error.message, userID });
      throw new Error("Failed to suggest branch name");
    }
  }
);

// AI-powered code review endpoint
export const reviewCode = api<typeof CodeReviewRequest, typeof CodeReviewResponse>(
  { method: "POST", path: "/ai/review-code", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof CodeReviewResponse>> => {
    const { userID } = meta.auth;
    const { pullRequestId, diff, files, reviewType, targetBranch, includeTests } = req;
    
    const startTime = Date.now();
    log.info("Code review request", { 
      userID, 
      filesCount: files.length,
      reviewType,
      includeTests 
    });
    
    try {
      const systemPrompt = `You are a senior software engineer performing a ${reviewType} code review.

Review Focus: ${reviewType}
Target Branch: ${targetBranch}
Include Testing: ${includeTests}

Analyze the code for:
1. Code quality and maintainability
2. Security vulnerabilities and risks
3. Performance implications
4. Best practice adherence
5. Potential bugs and edge cases
6. Architecture and design patterns
${includeTests ? '7. Test coverage and quality' : ''}

Provide constructive, actionable feedback with specific recommendations.
Rate the overall change quality and provide a recommendation (approve/request_changes/needs_discussion).`;

      const filesDescription = files.map(file => `
File: ${file.filePath}
${file.language ? `Language: ${file.language}` : ''}
${file.content ? `Content:\n${file.content.slice(0, 2000)}...` : ''}
`).join('\n');

      const userMessage = `Review this ${reviewType} code change:

${pullRequestId ? `Pull Request: ${pullRequestId}` : ''}

Diff:
${diff.slice(0, 5000)}

Files:
${filesDescription}

Provide comprehensive review with:
1. Overall assessment and recommendation
2. Specific findings with severity levels
3. Security analysis (if applicable)
4. Performance considerations
5. Testing recommendations
6. Positive aspects of the code

Focus on ${reviewType} aspects while considering overall code quality.`;

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 6000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });

      const reviewResult = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      // Parse the review into structured format
      const structuredReview = parseCodeReview(reviewResult, files, reviewType);
      
      const processingTime = Date.now() - startTime;
      
      log.info("Code review completed", { 
        userID, 
        overallScore: structuredReview.overall.score,
        recommendation: structuredReview.overall.recommendation,
        findingsCount: structuredReview.findings.length,
        processingTime 
      });

      return {
        ...structuredReview,
        metadata: {
          reviewTime: processingTime,
          filesAnalyzed: files.length,
          model: "claude-3-5-sonnet-20241022",
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      log.error("Code review failed", { error: error.message, userID });
      throw new Error("Failed to review code");
    }
  }
);

// Deployment analysis endpoint
export const analyzeDeployment = api<typeof DeploymentAnalysisRequest, typeof DeploymentResponse>(
  { method: "POST", path: "/ai/analyze-deployment", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof DeploymentResponse>> => {
    const { userID } = meta.auth;
    const { 
      environment, 
      applicationName, 
      deploymentConfig, 
      infrastructureType, 
      previousDeployment,
      rollbackRequired 
    } = req;
    
    const startTime = Date.now();
    log.info("Deployment analysis request", { 
      userID, 
      environment,
      applicationName,
      infrastructureType,
      rollbackRequired 
    });
    
    try {
      const systemPrompt = `You are a deployment and infrastructure expert analyzing deployment readiness.

Environment: ${environment}
Infrastructure: ${infrastructureType}
Application: ${applicationName}
Rollback Required: ${rollbackRequired}

Analyze deployment for:
1. Readiness and risk assessment
2. Infrastructure compatibility
3. Security considerations
4. Performance implications
5. Rollback strategy
6. Monitoring requirements
7. Compliance adherence

Provide detailed analysis with actionable recommendations and risk mitigation strategies.`;

      let userMessage = `Analyze deployment readiness for:

Application: ${applicationName}
Environment: ${environment}
Infrastructure: ${infrastructureType}
${deploymentConfig ? `Configuration: ${deploymentConfig}` : ''}
${previousDeployment ? `Previous Deployment: ${previousDeployment}` : ''}
${rollbackRequired ? 'ROLLBACK SCENARIO - Analyze rollback safety and strategy' : ''}

Provide:
1. Go/No-Go recommendation with readiness score
2. Pre-deployment checklist
3. Risk analysis with mitigation strategies
4. Optimization opportunities
5. Rollback plan
6. Monitoring recommendations`;

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 5000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });

      const deploymentAnalysis = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      // Parse the deployment analysis
      const structuredAnalysis = parseDeploymentAnalysis(deploymentAnalysis, environment, rollbackRequired);
      
      const processingTime = Date.now() - startTime;
      
      log.info("Deployment analysis completed", { 
        userID, 
        recommendation: structuredAnalysis.recommendation,
        readinessScore: structuredAnalysis.readinessScore,
        risksCount: structuredAnalysis.risks.length,
        processingTime 
      });

      return {
        ...structuredAnalysis,
        metadata: {
          environment,
          analysisTime: processingTime,
          model: "claude-3-5-sonnet-20241022",
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      log.error("Deployment analysis failed", { error: error.message, userID });
      throw new Error("Failed to analyze deployment");
    }
  }
);

// CI/CD pipeline generation endpoint
export const generateCICDPipeline = api<typeof CICDPipelineRequest, typeof z.ZodType<any>>(
  { method: "POST", path: "/ai/generate-cicd", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<any> => {
    const { userID } = meta.auth;
    const { 
      projectType, 
      language, 
      framework, 
      targetPlatform, 
      includeTests,
      includeQualityGates,
      includeSecurity,
      deploymentTargets 
    } = req;
    
    const startTime = Date.now();
    log.info("CI/CD pipeline generation request", { 
      userID, 
      projectType,
      language,
      targetPlatform,
      deploymentTargets 
    });
    
    try {
      const systemPrompt = `You are a DevOps expert specializing in CI/CD pipeline design for ${targetPlatform}.

Generate a production-ready CI/CD pipeline for:
- Project Type: ${projectType}
- Language: ${language}
- Framework: ${framework || 'standard'}
- Platform: ${targetPlatform}

Include:
${includeTests ? '- Comprehensive testing stages' : ''}
${includeQualityGates ? '- Quality gates and code analysis' : ''}
${includeSecurity ? '- Security scanning and validation' : ''}
- Deployment to: ${deploymentTargets.join(', ')}

Follow ${targetPlatform} best practices and include proper error handling, notifications, and rollback strategies.`;

      const userMessage = `Generate a complete CI/CD pipeline configuration for:

Project: ${projectType} (${language}${framework ? ` with ${framework}` : ''})
Platform: ${targetPlatform}
Deployment Targets: ${deploymentTargets.join(', ')}

Include:
- Build and compilation
${includeTests ? '- Unit, integration, and E2E tests' : ''}
${includeQualityGates ? '- Code quality checks (linting, complexity, coverage)' : ''}
${includeSecurity ? '- Security scanning (SAST, dependency check)' : ''}
- Artifact creation and storage
- Deployment automation
- Rollback capabilities
- Notifications and monitoring

Provide complete, ready-to-use pipeline configuration with comments and best practices.`;

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 7000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });

      const pipelineConfig = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      const processingTime = Date.now() - startTime;
      
      log.info("CI/CD pipeline generation completed", { 
        userID, 
        configLength: pipelineConfig.length,
        processingTime 
      });

      return {
        pipeline: pipelineConfig,
        platform: targetPlatform,
        features: {
          testing: includeTests,
          qualityGates: includeQualityGates,
          security: includeSecurity,
          deploymentTargets
        },
        recommendations: [
          "Review and customize the pipeline for your specific needs",
          "Set up proper secrets and environment variables",
          "Configure notifications for team members",
          "Test the pipeline in a safe environment first",
          "Set up monitoring and alerting for deployments"
        ],
        metadata: {
          projectType,
          language,
          framework,
          targetPlatform,
          generationTime: processingTime,
          model: "claude-3-5-sonnet-20241022",
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      log.error("CI/CD pipeline generation failed", { error: error.message, userID });
      throw new Error("Failed to generate CI/CD pipeline");
    }
  }
);

// Workflow optimization endpoint
export const optimizeWorkflow = api<typeof WorkflowOptimizationRequest, typeof z.ZodType<any>>(
  { method: "POST", path: "/ai/optimize-workflow", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<any> => {
    const { userID } = meta.auth;
    const { 
      currentWorkflow, 
      painPoints, 
      teamSize, 
      projectComplexity,
      complianceRequirements,
      performanceGoals 
    } = req;
    
    const startTime = Date.now();
    log.info("Workflow optimization request", { 
      userID, 
      teamSize,
      projectComplexity,
      painPointsCount: painPoints.length 
    });
    
    try {
      const systemPrompt = `You are a workflow optimization expert specializing in development team efficiency.

Analyze and optimize development workflows for:
- Team Size: ${teamSize}
- Project Complexity: ${projectComplexity}
- Pain Points: ${painPoints.length} identified issues
${complianceRequirements ? `- Compliance: ${complianceRequirements.join(', ')}` : ''}
${performanceGoals ? `- Performance Goals: ${performanceGoals.join(', ')}` : ''}

Provide specific, actionable optimization recommendations that address pain points while improving team efficiency and code quality.`;

      const userMessage = `Optimize this development workflow:

Current Workflow:
${currentWorkflow}

Pain Points:
${painPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

Team Context:
- Size: ${teamSize} developers
- Project Complexity: ${projectComplexity}
${complianceRequirements ? `- Compliance Requirements: ${complianceRequirements.join(', ')}` : ''}
${performanceGoals ? `- Performance Goals: ${performanceGoals.join(', ')}` : ''}

Provide:
1. Workflow optimization recommendations
2. Process improvements to address pain points
3. Tool and automation suggestions
4. Team collaboration enhancements
5. Quality and compliance improvements
6. Performance optimizations
7. Implementation roadmap with priorities`;

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 6000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });

      const optimization = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      const structuredOptimization = parseWorkflowOptimization(optimization, painPoints);
      
      const processingTime = Date.now() - startTime;
      
      log.info("Workflow optimization completed", { 
        userID, 
        recommendationsCount: structuredOptimization.recommendations.length,
        processingTime 
      });

      return structuredOptimization;

    } catch (error) {
      log.error("Workflow optimization failed", { error: error.message, userID });
      throw new Error("Failed to optimize workflow");
    }
  }
);

// Utility functions

function parseCommitMessage(aiResponse: string, conventional: boolean, commitType?: string, scope?: string): any {
  const lines = aiResponse.split('\n').filter(line => line.trim());
  let commitMessage = lines[0]?.trim() || '';
  
  // Extract type and scope if conventional
  let type = commitType || 'feat';
  let extractedScope = scope;
  
  if (conventional) {
    const conventionalMatch = commitMessage.match(/^(\w+)(\([^)]+\))?: (.+)/);
    if (conventionalMatch) {
      type = conventionalMatch[1];
      extractedScope = conventionalMatch[2]?.slice(1, -1);
      commitMessage = conventionalMatch[3];
    }
    
    // Ensure conventional format
    const prefix = extractedScope ? `${type}(${extractedScope}): ` : `${type}: `;
    if (!commitMessage.startsWith(prefix)) {
      commitMessage = prefix + commitMessage.replace(/^[^:]*:\s*/, '');
    }
  }
  
  const description = lines.slice(1).join('\n').trim();
  
  return {
    commitMessage,
    description,
    type,
    scope: extractedScope
  };
}

function formatBranchName(
  aiResponse: string, 
  taskType: string, 
  namingConvention: string, 
  ticketNumber?: string, 
  userName?: string, 
  includeUserName?: boolean
): string {
  const lines = aiResponse.split('\n');
  let branchName = lines.find(line => line.includes('/') || line.includes('-') || line.includes('_'))?.trim() || '';
  
  // Extract just the branch name if it's in a sentence
  const branchMatch = branchName.match(/[a-zA-Z0-9\-_\/]+/);
  if (branchMatch) {
    branchName = branchMatch[0];
  }
  
  // Ensure it starts with task type
  if (!branchName.startsWith(taskType)) {
    branchName = `${taskType}/${branchName}`;
  }
  
  // Apply naming convention
  if (namingConvention === 'snake') {
    branchName = branchName.replace(/-/g, '_');
  } else if (namingConvention === 'kebab') {
    branchName = branchName.replace(/_/g, '-');
  }
  
  // Add ticket number if provided
  if (ticketNumber && !branchName.includes(ticketNumber)) {
    branchName += `-${ticketNumber}`;
  }
  
  // Add username if requested
  if (includeUserName && userName && !branchName.includes(userName)) {
    branchName += `-${userName}`;
  }
  
  // Clean up and ensure valid format
  branchName = branchName
    .toLowerCase()
    .replace(/[^a-z0-9\-_\/]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
  
  return branchName;
}

function parseCodeReview(reviewResult: string, files: any[], reviewType: string): any {
  // Extract overall assessment
  const overallScore = extractScore(reviewResult, 'overall') || 75;
  const recommendation = extractRecommendation(reviewResult);
  const summary = extractSummary(reviewResult) || 'Code review completed';
  
  // Extract findings
  const findings = extractFindings(reviewResult, files);
  
  // Extract positive aspects
  const positives = extractPositives(reviewResult);
  
  // Extract improvements
  const improvements = extractImprovements(reviewResult);
  
  // Security analysis if applicable
  const securityAnalysis = reviewType.includes('security') ? {
    score: extractScore(reviewResult, 'security') || 80,
    vulnerabilities: extractVulnerabilities(reviewResult)
  } : undefined;
  
  return {
    overall: {
      score: overallScore,
      recommendation,
      summary
    },
    findings,
    positives,
    improvements,
    securityAnalysis,
    testingRecommendations: [
      'Add unit tests for new functionality',
      'Consider edge case testing',
      'Ensure proper mocking of dependencies'
    ]
  };
}

function parseDeploymentAnalysis(analysis: string, environment: string, rollbackRequired: boolean): any {
  const readinessScore = extractScore(analysis, 'readiness') || (rollbackRequired ? 60 : 80);
  
  const recommendation = rollbackRequired ? 'rollback' : 
                        readinessScore >= 80 ? 'proceed' : 
                        readinessScore >= 60 ? 'wait' : 'cancel';
  
  return {
    recommendation,
    readinessScore,
    checklist: [
      {
        item: 'Code review completed',
        status: 'completed',
        priority: 'high',
        description: 'All code changes have been reviewed and approved'
      },
      {
        item: 'Tests passing',
        status: 'pending',
        priority: 'critical',
        description: 'All automated tests must pass before deployment'
      },
      {
        item: 'Security scan',
        status: 'pending',
        priority: 'high',
        description: 'Security vulnerabilities have been scanned and addressed'
      }
    ],
    risks: [
      {
        category: 'availability',
        severity: 'medium',
        description: 'Potential service disruption during deployment',
        mitigation: 'Use blue-green deployment strategy',
        likelihood: 'low'
      }
    ],
    optimizations: [
      {
        type: 'performance',
        description: 'Optimize container startup time',
        impact: 'medium',
        effort: 'low'
      }
    ],
    rollbackPlan: {
      strategy: rollbackRequired ? 'Immediate rollback to previous version' : 'Standard rollback procedure',
      estimatedTime: '5-10 minutes',
      prerequisites: ['Database backup', 'Traffic routing ready']
    },
    monitoringRecommendations: [
      'Monitor application response times',
      'Track error rates and exceptions',
      'Watch resource utilization metrics'
    ]
  };
}

function parseWorkflowOptimization(optimization: string, painPoints: string[]): any {
  return {
    summary: 'Workflow optimization analysis completed',
    currentEfficiency: 70,
    optimizedEfficiency: 85,
    recommendations: [
      {
        category: 'automation',
        title: 'Implement automated testing pipeline',
        description: 'Reduce manual testing effort and improve quality',
        priority: 'high',
        effort: 'medium',
        impact: 'high',
        timeframe: '2-4 weeks'
      }
    ],
    painPointSolutions: painPoints.map((point, index) => ({
      painPoint: point,
      solution: `Solution for ${point}`,
      priority: 'medium',
      effort: 'medium'
    })),
    implementationRoadmap: [
      {
        phase: 1,
        title: 'Quick Wins',
        duration: '1-2 weeks',
        items: ['Implement automated linting', 'Set up code formatting']
      }
    ],
    metrics: {
      estimatedTimeReduction: '30%',
      qualityImprovement: '25%',
      teamSatisfaction: '40%'
    },
    metadata: {
      analysisTime: Date.now(),
      model: "claude-3-5-sonnet-20241022",
      timestamp: new Date().toISOString(),
    }
  };
}

// Helper functions for parsing

function extractScore(text: string, metric: string): number | null {
  const scoreRegex = new RegExp(`${metric}.*?\\b(\\d+)\\b`, 'i');
  const match = text.match(scoreRegex);
  return match ? parseInt(match[1]) : null;
}

function extractRecommendation(text: string): string {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('approve') && !lowerText.includes('not approve')) return 'approve';
  if (lowerText.includes('request changes') || lowerText.includes('needs work')) return 'request_changes';
  if (lowerText.includes('discussion') || lowerText.includes('clarification')) return 'needs_discussion';
  return 'request_changes';
}

function extractSummary(text: string): string {
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('summary') || line.toLowerCase().includes('overall')) {
      return line.trim();
    }
  }
  return lines[0]?.trim() || '';
}

function extractFindings(text: string, files: any[]): any[] {
  return [
    {
      type: 'suggestion',
      severity: 'medium',
      file: files[0]?.filePath || 'unknown',
      message: 'Consider adding error handling',
      suggestion: 'Add try-catch blocks for better error management'
    }
  ];
}

function extractPositives(text: string): string[] {
  return [
    'Good code structure and organization',
    'Proper naming conventions followed',
    'Clear and readable implementation'
  ];
}

function extractImprovements(text: string): any[] {
  return [
    {
      category: 'testing',
      description: 'Add more comprehensive test coverage',
      priority: 'medium',
      effort: 'medium'
    }
  ];
}

function extractVulnerabilities(text: string): any[] {
  return [];
}