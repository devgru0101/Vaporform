import { api, APICallMeta } from "encore.dev/api";
import log from "encore.dev/log";
import { z } from "zod";
import { AuthData } from "./auth";
import Anthropic from "@anthropic-ai/sdk";

// AI service configuration
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
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
  focus: z.array(z.enum(["security", "performance", "style", "bugs", "all"])).default(["all"]),
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
  testType: z.enum(["unit", "integration", "e2e"]).default("unit"),
  framework: z.string().optional(),
  projectId: z.string().optional(),
});

const AIResponse = z.object({
  result: z.string(),
  suggestions: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.any()).optional(),
});

// Code generation endpoint
export const generateCode = api<typeof CodeGenerationRequest, typeof AIResponse>(
  { method: "POST", path: "/ai/generate", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof AIResponse>> => {
    const { userID } = meta.auth;
    const { prompt, language, framework, context, projectId } = req;
    
    log.info("Code generation request", { userID, language, framework, projectId });
    
    try {
      // Build the system prompt
      let systemPrompt = `You are an expert ${language} developer`;
      if (framework) {
        systemPrompt += ` specializing in ${framework}`;
      }
      systemPrompt += `. Generate clean, efficient, and well-documented code based on the user's requirements.`;
      
      // Build the user message
      let userMessage = `Generate ${language} code for: ${prompt}`;
      if (context) {
        userMessage += `\n\nContext: ${context}`;
      }
      if (framework) {
        userMessage += `\n\nUse ${framework} framework.`;
      }
      
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });
      
      const generatedCode = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      log.info("Code generation completed", { userID, codeLength: generatedCode.length });
      
      return {
        result: generatedCode,
        suggestions: [
          "Consider adding error handling",
          "Add unit tests for this code",
          "Review for security best practices"
        ],
        confidence: 0.85,
        metadata: {
          model: "claude-3-5-sonnet-20241022",
          language,
          framework,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      log.error("Code generation failed", { error: error.message, userID });
      throw new Error("Failed to generate code");
    }
  }
);

// Code review endpoint
export const reviewCode = api<typeof CodeReviewRequest, typeof AIResponse>(
  { method: "POST", path: "/ai/review", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof AIResponse>> => {
    const { userID } = meta.auth;
    const { code, language, focus, projectId } = req;
    
    log.info("Code review request", { userID, language, focus, projectId });
    
    try {
      const focusAreas = focus.join(", ");
      const systemPrompt = `You are an expert code reviewer specializing in ${language}. 
        Provide a thorough code review focusing on: ${focusAreas}.
        Identify issues, suggest improvements, and provide specific recommendations.`;
      
      const userMessage = `Please review this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Focus areas: ${focusAreas}`;
      
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });
      
      const review = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      log.info("Code review completed", { userID, reviewLength: review.length });
      
      return {
        result: review,
        suggestions: [
          "Consider implementing suggested changes",
          "Run additional tests after modifications",
          "Document any architectural decisions"
        ],
        confidence: 0.90,
        metadata: {
          model: "claude-3-5-sonnet-20241022",
          language,
          focusAreas,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      log.error("Code review failed", { error: error.message, userID });
      throw new Error("Failed to review code");
    }
  }
);

// Debugging assistance endpoint
export const debugCode = api<typeof DebuggingRequest, typeof AIResponse>(
  { method: "POST", path: "/ai/debug", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof AIResponse>> => {
    const { userID } = meta.auth;
    const { code, error, language, context, projectId } = req;
    
    log.info("Debugging request", { userID, language, projectId });
    
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
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });
      
      const debugging = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      log.info("Debugging completed", { userID, solutionLength: debugging.length });
      
      return {
        result: debugging,
        suggestions: [
          "Test the proposed solution thoroughly",
          "Consider adding error handling",
          "Add logging for future debugging"
        ],
        confidence: 0.88,
        metadata: {
          model: "claude-3-5-sonnet-20241022",
          language,
          errorType: error.slice(0, 100),
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      log.error("Debugging failed", { error: error.message, userID });
      throw new Error("Failed to debug code");
    }
  }
);

// Test generation endpoint
export const generateTests = api<typeof TestGenerationRequest, typeof AIResponse>(
  { method: "POST", path: "/ai/tests", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof AIResponse>> => {
    const { userID } = meta.auth;
    const { code, language, testType, framework, projectId } = req;
    
    log.info("Test generation request", { userID, language, testType, framework, projectId });
    
    try {
      let systemPrompt = `You are an expert in ${language} testing. Generate comprehensive ${testType} tests for the provided code.`;
      if (framework) {
        systemPrompt += ` Use ${framework} testing framework.`;
      }
      systemPrompt += ` Focus on edge cases, error handling, and complete coverage.`;
      
      let userMessage = `Generate ${testType} tests for this ${language} code:

\`\`\`${language}
${code}
\`\`\``;
      
      if (framework) {
        userMessage += `\n\nUse ${framework} testing framework.`;
      }
      
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });
      
      const tests = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      log.info("Test generation completed", { userID, testsLength: tests.length });
      
      return {
        result: tests,
        suggestions: [
          "Run the generated tests to verify they pass",
          "Consider adding performance tests",
          "Add integration tests for complex workflows"
        ],
        confidence: 0.87,
        metadata: {
          model: "claude-3-5-sonnet-20241022",
          language,
          testType,
          framework,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      log.error("Test generation failed", { error: error.message, userID });
      throw new Error("Failed to generate tests");
    }
  }
);