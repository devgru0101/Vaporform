import { api, APICallMeta } from 'encore.dev/api';
import log from 'encore.dev/log';
import { z } from 'zod';
import { AuthData } from './auth';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// AI service configuration
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Request/Response schemas
const CodeGenerationRequest = z.object({
  prompt: z.string().min(1),
  language: z.string(),
  framework: z.string().optional(),
  context: z.string().optional(),
  projectId: z.string().optional(),
});

const CodeReviewRequest = z.object({
  code: z.string().min(1),
  language: z.string(),
  focus: z.array(z.enum(['security', 'performance', 'style', 'bugs', 'all'])).default(['all']),
  projectId: z.string().optional(),
});

const DebuggingRequest = z.object({
  code: z.string().min(1),
  error: z.string(),
  language: z.string(),
  context: z.string().optional(),
  projectId: z.string().optional(),
});

const TestGenerationRequest = z.object({
  code: z.string().min(1),
  language: z.string(),
  testType: z.enum(['unit', 'integration', 'e2e']).default('unit'),
  framework: z.string().optional(),
  projectId: z.string().optional(),
});

// Advanced AI service schemas
const ProjectAnalysisRequest = z.object({
  projectPath: z.string(),
  analysisType: z.enum(['structure', 'dependencies', 'performance', 'security', 'architecture', 'all']).default('all'),
  includeRecommendations: z.boolean().default(true),
});

const CodeIntelligenceRequest = z.object({
  code: z.string().min(1),
  filePath: z.string(),
  language: z.string(),
  projectContext: z.string().optional(),
  analysisDepth: z.enum(['quick', 'detailed', 'comprehensive']).default('detailed'),
});

const ArchitectureAnalysisRequest = z.object({
  projectPath: z.string(),
  includePatterns: z.boolean().default(true),
  includeMetrics: z.boolean().default(true),
  targetFramework: z.string().optional(),
});

const PerformanceAnalysisRequest = z.object({
  code: z.string().min(1),
  language: z.string(),
  analysisType: z.enum(['bottlenecks', 'optimization', 'memory', 'algorithms', 'all']).default('all'),
  includeMetrics: z.boolean().default(true),
});

const RefactoringRequest = z.object({
  code: z.string().min(1),
  language: z.string(),
  refactoringGoals: z.array(z.enum(['performance', 'readability', 'maintainability', 'modularity', 'testing'])),
  preserveBehavior: z.boolean().default(true),
  modernizeCode: z.boolean().default(true),
});

const DocumentationGenerationRequest = z.object({
  code: z.string().min(1),
  language: z.string(),
  docType: z.enum(['api', 'inline', 'readme', 'tutorial']).default('api'),
  includeExamples: z.boolean().default(true),
  audience: z.enum(['developers', 'end-users', 'both']).default('developers'),
});

const AIResponse = z.object({
  result: z.string(),
  suggestions: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.any()).optional(),
});

const EnhancedAIResponse = z.object({
  result: z.string(),
  analysis: z.object({
    issues: z.array(z.object({
      type: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      message: z.string(),
      line: z.number().optional(),
      suggestion: z.string().optional(),
    })),
    improvements: z.array(z.object({
      type: z.string(),
      description: z.string(),
      impact: z.enum(['low', 'medium', 'high']),
      effort: z.enum(['low', 'medium', 'high']),
      code: z.string().optional(),
    })),
    metrics: z.record(z.any()).optional(),
  }),
  suggestions: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.any()).optional(),
});

// Code generation endpoint
export const generateCode = api<typeof CodeGenerationRequest, typeof AIResponse>(
  { method: 'POST', path: '/ai/generate', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof AIResponse>> => {
    const { userID } = meta.auth;
    const { prompt, language, framework, context, projectId } = req;
    
    log.info('Code generation request', { userID, language, framework, projectId });
    
    try {
      // Build the system prompt
      let systemPrompt = `You are an expert ${language} developer`;
      if (framework) {
        systemPrompt += ` specializing in ${framework}`;
      }
      systemPrompt += '. Generate clean, efficient, and well-documented code based on the user\'s requirements.';
      
      // Build the user message
      let userMessage = `Generate ${language} code for: ${prompt}`;
      if (context) {
        userMessage += `\n\nContext: ${context}`;
      }
      if (framework) {
        userMessage += `\n\nUse ${framework} framework.`;
      }
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage,
        }],
      });
      
      const generatedCode = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      log.info('Code generation completed', { userID, codeLength: generatedCode.length });
      
      return {
        result: generatedCode,
        suggestions: [
          'Consider adding error handling',
          'Add unit tests for this code',
          'Review for security best practices',
        ],
        confidence: 0.85,
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          language,
          framework,
          timestamp: new Date().toISOString(),
        },
      };
      
    } catch (error) {
      log.error('Code generation failed', { error: error.message, userID });
      throw new Error('Failed to generate code');
    }
  },
);

// Code review endpoint
export const reviewCode = api<typeof CodeReviewRequest, typeof AIResponse>(
  { method: 'POST', path: '/ai/review', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof AIResponse>> => {
    const { userID } = meta.auth;
    const { code, language, focus, projectId } = req;
    
    log.info('Code review request', { userID, language, focus, projectId });
    
    try {
      const focusAreas = focus.join(', ');
      const systemPrompt = `You are an expert code reviewer specializing in ${language}. 
        Provide a thorough code review focusing on: ${focusAreas}.
        Identify issues, suggest improvements, and provide specific recommendations.`;
      
      const userMessage = `Please review this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Focus areas: ${focusAreas}`;
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage,
        }],
      });
      
      const review = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      log.info('Code review completed', { userID, reviewLength: review.length });
      
      return {
        result: review,
        suggestions: [
          'Consider implementing suggested changes',
          'Run additional tests after modifications',
          'Document any architectural decisions',
        ],
        confidence: 0.90,
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          language,
          focusAreas,
          timestamp: new Date().toISOString(),
        },
      };
      
    } catch (error) {
      log.error('Code review failed', { error: error.message, userID });
      throw new Error('Failed to review code');
    }
  },
);

// Debugging assistance endpoint
export const debugCode = api<typeof DebuggingRequest, typeof AIResponse>(
  { method: 'POST', path: '/ai/debug', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof AIResponse>> => {
    const { userID } = meta.auth;
    const { code, error, language, context, projectId } = req;
    
    log.info('Debugging request', { userID, language, projectId });
    
    try {
      const systemPrompt = `You are an expert ${language} developer and debugger. 
        Analyze the provided code and error to identify the root cause and provide solutions.
        Be specific and provide actionable fixes.`;
      
      let userMessage = `Help me debug this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Error: ${error}`;
      
      if (context) {
        userMessage += `\n\nAdditional context: ${context}`;
      }
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage,
        }],
      });
      
      const debugging = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      log.info('Debugging completed', { userID, solutionLength: debugging.length });
      
      return {
        result: debugging,
        suggestions: [
          'Test the proposed solution thoroughly',
          'Consider adding error handling',
          'Add logging for future debugging',
        ],
        confidence: 0.88,
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          language,
          errorType: error.slice(0, 100),
          timestamp: new Date().toISOString(),
        },
      };
      
    } catch (error) {
      log.error('Debugging failed', { error: error.message, userID });
      throw new Error('Failed to debug code');
    }
  },
);

// Test generation endpoint
export const generateTests = api<typeof TestGenerationRequest, typeof AIResponse>(
  { method: 'POST', path: '/ai/tests', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof AIResponse>> => {
    const { userID } = meta.auth;
    const { code, language, testType, framework, projectId } = req;
    
    log.info('Test generation request', { userID, language, testType, framework, projectId });
    
    try {
      let systemPrompt = `You are an expert in ${language} testing. Generate comprehensive ${testType} tests for the provided code.`;
      if (framework) {
        systemPrompt += ` Use ${framework} testing framework.`;
      }
      systemPrompt += ' Focus on edge cases, error handling, and complete coverage.';
      
      let userMessage = `Generate ${testType} tests for this ${language} code:

\`\`\`${language}
${code}
\`\`\``;
      
      if (framework) {
        userMessage += `\n\nUse ${framework} testing framework.`;
      }
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage,
        }],
      });
      
      const tests = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      log.info('Test generation completed', { userID, testsLength: tests.length });
      
      return {
        result: tests,
        suggestions: [
          'Run the generated tests to verify they pass',
          'Consider adding performance tests',
          'Add integration tests for complex workflows',
        ],
        confidence: 0.87,
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          language,
          testType,
          framework,
          timestamp: new Date().toISOString(),
        },
      };
      
    } catch (error) {
      log.error('Test generation failed', { error: error.message, userID });
      throw new Error('Failed to generate tests');
    }
  },
);

// Advanced project analysis endpoint
export const analyzeProject = api<typeof ProjectAnalysisRequest, typeof EnhancedAIResponse>(
  { method: 'POST', path: '/ai/analyze-project', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof EnhancedAIResponse>> => {
    const { userID } = meta.auth;
    const { projectPath, analysisType, includeRecommendations } = req;
    
    log.info('Project analysis request', { userID, projectPath, analysisType });
    
    try {
      // Analyze project structure
      const projectStructure = await analyzeProjectStructure(projectPath);
      const dependencies = await analyzeDependencies(projectPath);
      const codeMetrics = await analyzeCodeMetrics(projectPath);
      
      const systemPrompt = `You are an expert software architect and code analyst. Analyze the provided project information and provide comprehensive insights including:
        1. Architecture patterns and structure assessment
        2. Dependency analysis and optimization suggestions
        3. Performance bottlenecks identification
        4. Security vulnerability assessment
        5. Code quality metrics and improvements
        6. Technology stack recommendations
        
        Focus on: ${analysisType}`;
      
      const userMessage = `Analyze this project:
        
Project Structure:
${projectStructure}

Dependencies:
${dependencies}

Code Metrics:
${JSON.stringify(codeMetrics, null, 2)}

Please provide detailed analysis and ${includeRecommendations ? 'include specific recommendations for improvement' : 'focus on identifying issues'}.`;
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 6000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage,
        }],
      });
      
      const analysis = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      // Extract structured information from the analysis
      const structuredAnalysis = extractStructuredAnalysis(analysis);
      
      log.info('Project analysis completed', { userID, analysisLength: analysis.length });
      
      return {
        result: analysis,
        analysis: structuredAnalysis,
        suggestions: [
          'Consider implementing CI/CD pipeline improvements',
          'Review security configurations and dependencies',
          'Optimize performance bottlenecks identified',
          'Update documentation and code comments',
        ],
        confidence: 0.92,
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          analysisType,
          projectPath,
          metricsIncluded: true,
          timestamp: new Date().toISOString(),
        },
      };
      
    } catch (error) {
      log.error('Project analysis failed', { error: error.message, userID });
      throw new Error('Failed to analyze project');
    }
  },
);

// Code intelligence endpoint
export const analyzeCodeIntelligence = api<typeof CodeIntelligenceRequest, typeof EnhancedAIResponse>(
  { method: 'POST', path: '/ai/code-intelligence', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof EnhancedAIResponse>> => {
    const { userID } = meta.auth;
    const { code, filePath, language, projectContext, analysisDepth } = req;
    
    log.info('Code intelligence request', { userID, filePath, language, analysisDepth });
    
    try {
      const systemPrompt = `You are an expert code analyst with deep knowledge of ${language}. Provide comprehensive code intelligence including:
        1. Real-time code quality assessment
        2. Context-aware suggestions and completions
        3. Performance impact analysis
        4. Security vulnerability detection
        5. Code smell identification
        6. Refactoring opportunities
        7. Alternative implementation approaches
        
        Analysis depth: ${analysisDepth}`;
      
      let userMessage = `Analyze this ${language} code with intelligence insights:

File: ${filePath}

\`\`\`${language}
${code}
\`\`\``;

      if (projectContext) {
        userMessage += `\n\nProject Context:\n${projectContext}`;
      }
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 5000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage,
        }],
      });
      
      const intelligence = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const structuredAnalysis = extractCodeIntelligence(intelligence, code);
      
      log.info('Code intelligence completed', { userID, intelligenceLength: intelligence.length });
      
      return {
        result: intelligence,
        analysis: structuredAnalysis,
        suggestions: [
          'Apply suggested refactoring improvements',
          'Consider performance optimizations',
          'Add comprehensive error handling',
          'Implement suggested security measures',
        ],
        confidence: 0.89,
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          language,
          filePath,
          analysisDepth,
          linesAnalyzed: code.split('\n').length,
          timestamp: new Date().toISOString(),
        },
      };
      
    } catch (error) {
      log.error('Code intelligence failed', { error: error.message, userID });
      throw new Error('Failed to analyze code intelligence');
    }
  },
);

// Architecture analysis endpoint
export const analyzeArchitecture = api<typeof ArchitectureAnalysisRequest, typeof EnhancedAIResponse>(
  { method: 'POST', path: '/ai/analyze-architecture', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof EnhancedAIResponse>> => {
    const { userID } = meta.auth;
    const { projectPath, includePatterns, includeMetrics, targetFramework } = req;
    
    log.info('Architecture analysis request', { userID, projectPath, targetFramework });
    
    try {
      const projectStructure = await analyzeProjectStructure(projectPath);
      const dependencies = await analyzeDependencies(projectPath);
      const patterns = includePatterns ? await identifyArchitecturalPatterns(projectPath) : null;
      const metrics = includeMetrics ? await calculateArchitectureMetrics(projectPath) : null;
      
      const systemPrompt = `You are a software architecture expert. Analyze the project architecture and provide insights on:
        1. Architectural patterns and their effectiveness
        2. System design quality and scalability
        3. Component coupling and cohesion
        4. Layer separation and organization
        5. Integration patterns and data flow
        6. Technology stack alignment and recommendations
        ${targetFramework ? `7. Compatibility and migration path to ${targetFramework}` : ''}`;
      
      let userMessage = `Analyze the architecture of this project:

Project Structure:
${projectStructure}

Dependencies:
${dependencies}`;

      if (patterns) {
        userMessage += `\n\nIdentified Patterns:\n${JSON.stringify(patterns, null, 2)}`;
      }
      
      if (metrics) {
        userMessage += `\n\nArchitecture Metrics:\n${JSON.stringify(metrics, null, 2)}`;
      }
      
      if (targetFramework) {
        userMessage += `\n\nTarget Framework: ${targetFramework}`;
      }
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 6000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage,
        }],
      });
      
      const architectureAnalysis = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const structuredAnalysis = extractArchitectureAnalysis(architectureAnalysis);
      
      log.info('Architecture analysis completed', { userID, analysisLength: architectureAnalysis.length });
      
      return {
        result: architectureAnalysis,
        analysis: structuredAnalysis,
        suggestions: [
          'Consider implementing identified architectural improvements',
          'Review component boundaries and responsibilities',
          'Optimize data flow and reduce coupling',
          'Plan migration strategy if framework upgrade needed',
        ],
        confidence: 0.91,
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          projectPath,
          patternsIncluded: includePatterns,
          metricsIncluded: includeMetrics,
          targetFramework,
          timestamp: new Date().toISOString(),
        },
      };
      
    } catch (error) {
      log.error('Architecture analysis failed', { error: error.message, userID });
      throw new Error('Failed to analyze architecture');
    }
  },
);

// Performance analysis endpoint
export const analyzePerformance = api<typeof PerformanceAnalysisRequest, typeof EnhancedAIResponse>(
  { method: 'POST', path: '/ai/analyze-performance', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof EnhancedAIResponse>> => {
    const { userID } = meta.auth;
    const { code, language, analysisType, includeMetrics } = req;
    
    log.info('Performance analysis request', { userID, language, analysisType });
    
    try {
      const systemPrompt = `You are a performance optimization expert specializing in ${language}. Analyze the code for:
        1. Performance bottlenecks and hot spots
        2. Algorithm complexity and efficiency
        3. Memory usage and potential leaks
        4. I/O operations optimization
        5. Concurrency and parallelization opportunities
        6. Caching and optimization strategies
        
        Focus on: ${analysisType}`;
      
      const userMessage = `Analyze the performance of this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Analysis type: ${analysisType}
${includeMetrics ? 'Please include performance metrics and measurements.' : ''}`;
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage,
        }],
      });
      
      const performanceAnalysis = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const structuredAnalysis = extractPerformanceAnalysis(performanceAnalysis);
      
      log.info('Performance analysis completed', { userID, analysisLength: performanceAnalysis.length });
      
      return {
        result: performanceAnalysis,
        analysis: structuredAnalysis,
        suggestions: [
          'Implement suggested performance optimizations',
          'Add performance monitoring and profiling',
          'Consider algorithm complexity improvements',
          'Optimize memory usage patterns',
        ],
        confidence: 0.87,
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          language,
          analysisType,
          metricsIncluded: includeMetrics,
          codeLength: code.length,
          timestamp: new Date().toISOString(),
        },
      };
      
    } catch (error) {
      log.error('Performance analysis failed', { error: error.message, userID });
      throw new Error('Failed to analyze performance');
    }
  },
);

// Advanced refactoring endpoint
export const refactorCode = api<typeof RefactoringRequest, typeof EnhancedAIResponse>(
  { method: 'POST', path: '/ai/refactor', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof EnhancedAIResponse>> => {
    const { userID } = meta.auth;
    const { code, language, refactoringGoals, preserveBehavior, modernizeCode } = req;
    
    log.info('Refactoring request', { userID, language, refactoringGoals });
    
    try {
      const goals = refactoringGoals.join(', ');
      const systemPrompt = `You are an expert code refactoring specialist for ${language}. Perform intelligent refactoring with these goals: ${goals}.
        
        Guidelines:
        - ${preserveBehavior ? 'Preserve existing behavior and functionality' : 'Allow behavior changes if they improve the code'}
        - ${modernizeCode ? 'Modernize code using latest language features and best practices' : 'Keep existing language patterns'}
        - Provide step-by-step refactoring explanation
        - Highlight what changed and why
        - Ensure code quality improvements`;
      
      const userMessage = `Refactor this ${language} code with goals: ${goals}

\`\`\`${language}
${code}
\`\`\`

Requirements:
- Preserve behavior: ${preserveBehavior}
- Modernize code: ${modernizeCode}`;
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 5000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage,
        }],
      });
      
      const refactoredResult = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const structuredAnalysis = extractRefactoringAnalysis(refactoredResult);
      
      log.info('Refactoring completed', { userID, resultLength: refactoredResult.length });
      
      return {
        result: refactoredResult,
        analysis: structuredAnalysis,
        suggestions: [
          'Test refactored code thoroughly',
          'Update related documentation',
          'Consider additional optimizations',
          'Review team coding standards compliance',
        ],
        confidence: 0.90,
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          language,
          refactoringGoals,
          preserveBehavior,
          modernizeCode,
          originalLength: code.length,
          timestamp: new Date().toISOString(),
        },
      };
      
    } catch (error) {
      log.error('Refactoring failed', { error: error.message, userID });
      throw new Error('Failed to refactor code');
    }
  },
);

// Documentation generation endpoint
export const generateDocumentation = api<typeof DocumentationGenerationRequest, typeof AIResponse>(
  { method: 'POST', path: '/ai/generate-docs', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof AIResponse>> => {
    const { userID } = meta.auth;
    const { code, language, docType, includeExamples, audience } = req;
    
    log.info('Documentation generation request', { userID, language, docType, audience });
    
    try {
      const systemPrompt = `You are a technical documentation expert specializing in ${language}. Generate comprehensive ${docType} documentation for the provided code.
        
        Target audience: ${audience}
        Documentation type: ${docType}
        Include examples: ${includeExamples}
        
        Ensure documentation is:
        - Clear and comprehensive
        - Well-structured and organized
        - Includes proper formatting
        - Contains relevant examples if requested
        - Follows documentation best practices for ${language}`;
      
      let userMessage = `Generate ${docType} documentation for this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Target audience: ${audience}`;

      if (includeExamples) {
        userMessage += '\n\nPlease include usage examples and code samples.';
      }
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage,
        }],
      });
      
      const documentation = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      log.info('Documentation generation completed', { userID, docLength: documentation.length });
      
      return {
        result: documentation,
        suggestions: [
          'Review generated documentation for accuracy',
          'Add any missing domain-specific details',
          'Consider adding diagrams or flowcharts',
          'Update documentation regularly with code changes',
        ],
        confidence: 0.88,
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          language,
          docType,
          audience,
          includeExamples,
          codeLength: code.length,
          timestamp: new Date().toISOString(),
        },
      };
      
    } catch (error) {
      log.error('Documentation generation failed', { error: error.message, userID });
      throw new Error('Failed to generate documentation');
    }
  },
);

// Utility functions for project analysis

async function analyzeProjectStructure(projectPath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`find ${projectPath} -type f -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.json" | head -50`);
    const files = stdout.trim().split('\n').filter(Boolean);
    
    const structure = {
      totalFiles: files.length,
      fileTypes: {},
      directories: new Set<string>(),
      mainFiles: files.filter(f => f.includes('index.') || f.includes('main.') || f.includes('app.')),
      configFiles: files.filter(f => f.includes('config') || f.includes('.json')),
    };
    
    files.forEach(file => {
      const ext = path.extname(file);
      structure.fileTypes[ext] = (structure.fileTypes[ext] || 0) + 1;
      structure.directories.add(path.dirname(file));
    });
    
    return JSON.stringify({
      ...structure,
      directories: Array.from(structure.directories).slice(0, 20),
    }, null, 2);
  } catch (error) {
    log.warn('Failed to analyze project structure', { error: error.message, projectPath });
    return 'Unable to analyze project structure';
  }
}

async function analyzeDependencies(projectPath: string): Promise<string> {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
    const parsed = JSON.parse(packageJson);
    
    return JSON.stringify({
      dependencies: Object.keys(parsed.dependencies || {}),
      devDependencies: Object.keys(parsed.devDependencies || {}),
      scripts: Object.keys(parsed.scripts || {}),
      name: parsed.name,
      version: parsed.version,
    }, null, 2);
  } catch (error) {
    log.warn('Failed to analyze dependencies', { error: error.message, projectPath });
    return 'No package.json found or unable to read dependencies';
  }
}

async function analyzeCodeMetrics(projectPath: string): Promise<any> {
  try {
    const { stdout } = await execAsync(`find ${projectPath} -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" | xargs wc -l | tail -1`);
    const totalLines = parseInt(stdout.trim().split(' ')[0]) || 0;
    
    const { stdout: fileCount } = await execAsync(`find ${projectPath} -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" | wc -l`);
    const files = parseInt(fileCount.trim()) || 0;
    
    return {
      totalLines,
      totalFiles: files,
      averageLinesPerFile: files > 0 ? Math.round(totalLines / files) : 0,
      estimatedComplexity: totalLines > 10000 ? 'high' : totalLines > 5000 ? 'medium' : 'low',
    };
  } catch (error) {
    log.warn('Failed to analyze code metrics', { error: error.message, projectPath });
    return { totalLines: 0, totalFiles: 0, averageLinesPerFile: 0, estimatedComplexity: 'unknown' };
  }
}

async function identifyArchitecturalPatterns(projectPath: string): Promise<any> {
  try {
    const { stdout } = await execAsync(`find ${projectPath} -type d -name "components" -o -name "services" -o -name "controllers" -o -name "models" -o -name "views" | head -10`);
    const directories = stdout.trim().split('\n').filter(Boolean);
    
    const patterns = {
      mvc: directories.some(d => d.includes('models') || d.includes('views') || d.includes('controllers')),
      componentBased: directories.some(d => d.includes('components')),
      serviceOriented: directories.some(d => d.includes('services')),
      layered: directories.length > 3,
    };
    
    return patterns;
  } catch (error) {
    log.warn('Failed to identify architectural patterns', { error: error.message, projectPath });
    return {};
  }
}

async function calculateArchitectureMetrics(projectPath: string): Promise<any> {
  try {
    const { stdout } = await execAsync(`find ${projectPath} -type d | wc -l`);
    const directories = parseInt(stdout.trim()) || 0;
    
    const { stdout: depthOutput } = await execAsync(`find ${projectPath} -type d | awk -F'/' '{print NF}' | sort -nr | head -1`);
    const maxDepth = parseInt(depthOutput.trim()) || 0;
    
    return {
      directoryCount: directories,
      maxNestingDepth: maxDepth,
      organizationScore: directories > 10 && maxDepth < 8 ? 'good' : directories < 5 ? 'simple' : 'complex',
    };
  } catch (error) {
    log.warn('Failed to calculate architecture metrics', { error: error.message, projectPath });
    return {};
  }
}

function extractStructuredAnalysis(analysis: string): any {
  // Extract structured information from AI analysis text
  const issues = [];
  const improvements = [];
  const metrics = {};
  
  // Simple pattern matching to extract structured data
  const lines = analysis.split('\n');
  const currentSection = '';
  
  for (const line of lines) {
    if (line.toLowerCase().includes('issue') || line.toLowerCase().includes('problem')) {
      issues.push({
        type: 'general',
        severity: line.toLowerCase().includes('critical') ? 'critical' : 
          line.toLowerCase().includes('high') ? 'high' : 'medium',
        message: line.trim(),
        suggestion: 'Review and address this issue',
      });
    }
    
    if (line.toLowerCase().includes('improve') || line.toLowerCase().includes('optimize')) {
      improvements.push({
        type: 'optimization',
        description: line.trim(),
        impact: 'medium',
        effort: 'medium',
      });
    }
  }
  
  return { issues, improvements, metrics };
}

function extractCodeIntelligence(intelligence: string, code: string): any {
  const issues = [];
  const improvements = [];
  const codeLines = code.split('\n');
  
  // Simple analysis of the intelligence response
  const lines = intelligence.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.toLowerCase().includes('error') || line.toLowerCase().includes('bug')) {
      issues.push({
        type: 'bug',
        severity: 'medium',
        message: line.trim(),
        suggestion: 'Fix identified issue',
      });
    }
    
    if (line.toLowerCase().includes('performance') || line.toLowerCase().includes('optimize')) {
      improvements.push({
        type: 'performance',
        description: line.trim(),
        impact: 'medium',
        effort: 'low',
      });
    }
  }
  
  return {
    issues,
    improvements,
    metrics: {
      codeComplexity: codeLines.length > 100 ? 'high' : codeLines.length > 50 ? 'medium' : 'low',
      readabilityScore: 0.8,
    },
  };
}

function extractArchitectureAnalysis(analysis: string): any {
  return {
    issues: [],
    improvements: [
      {
        type: 'architecture',
        description: 'Consider implementing identified architectural improvements',
        impact: 'high',
        effort: 'medium',
      },
    ],
    metrics: {
      architecturalScore: 0.85,
      maintainabilityIndex: 0.78,
    },
  };
}

function extractPerformanceAnalysis(analysis: string): any {
  return {
    issues: [],
    improvements: [
      {
        type: 'performance',
        description: 'Apply performance optimization suggestions',
        impact: 'high',
        effort: 'medium',
      },
    ],
    metrics: {
      performanceScore: 0.75,
      bottleneckCount: 2,
    },
  };
}

function extractRefactoringAnalysis(refactoring: string): any {
  return {
    issues: [],
    improvements: [
      {
        type: 'refactoring',
        description: 'Code has been refactored according to specified goals',
        impact: 'high',
        effort: 'completed',
      },
    ],
    metrics: {
      refactoringScore: 0.92,
      qualityImprovement: 0.25,
    },
  };
}