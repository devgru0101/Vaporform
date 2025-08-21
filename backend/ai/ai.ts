import { api, APIError } from "encore.dev/api";
import log from "encore.dev/log";
import Anthropic from "@anthropic-ai/sdk";

// Import service definition
import "./encore.service";

// AI service configuration
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Check if API key is available for actual AI calls
const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

// Request/Response interfaces (pure TypeScript - no Zod)
interface ChatRequest {
  message: string;
  context?: string;
  projectId?: string;
}

interface CodeGenerationRequest {
  prompt: string;
  language: string;
  framework?: string;
  context?: string;
}

interface CodeReviewRequest {
  code: string;
  language: string;
  focus?: ("security" | "performance" | "style" | "bugs" | "all")[];
}

interface AIResponse {
  result: string;
  suggestions?: string[];
  confidence: number;
  metadata?: Record<string, any>;
}

// Validation functions (replacing Zod)
function validateChatRequest(req: ChatRequest): void {
  if (!req.message || req.message.trim().length === 0) {
    throw APIError.invalidArgument("Message is required and cannot be empty");
  }
}

function validateCodeGenerationRequest(req: CodeGenerationRequest): void {
  if (!req.prompt || req.prompt.trim().length === 0) {
    throw APIError.invalidArgument("Prompt is required and cannot be empty");
  }
  if (!req.language || req.language.trim().length === 0) {
    throw APIError.invalidArgument("Language is required");
  }
}

function validateCodeReviewRequest(req: CodeReviewRequest): void {
  if (!req.code || req.code.trim().length === 0) {
    throw APIError.invalidArgument("Code is required and cannot be empty");
  }
  if (!req.language || req.language.trim().length === 0) {
    throw APIError.invalidArgument("Language is required");
  }
  if (req.focus && req.focus.length > 0) {
    const validFocusAreas = ["security", "performance", "style", "bugs", "all"];
    for (const area of req.focus) {
      if (!validFocusAreas.includes(area)) {
        throw APIError.invalidArgument(`Invalid focus area: ${area}. Valid areas are: ${validFocusAreas.join(", ")}`);
      }
    }
  }
}

// AI Chat endpoint
export const chat = api(
  { method: "POST", path: "/ai/chat", expose: true },
  async ({ message, context, projectId }: ChatRequest): Promise<AIResponse> => {
    log.info("AI chat request", { messageLength: message.length, projectId });

    // Validation
    validateChatRequest({ message, context, projectId });

    try {
      let result: string;

      if (!hasApiKey) {
        // Mock response when API key is not available
        result = `Mock AI Response: I understand you asked "${message}". This is a mock response since no Anthropic API key is configured. In a real deployment, I would provide intelligent assistance for your development tasks.`;
        log.info("AI chat completed (mock mode)", { messageLength: message.length });
      } else {
        // Real AI response
        let systemPrompt = "You are Vaporform AI, an expert development assistant. Help users with their development tasks, code questions, and project guidance.";
        
        let userMessage = message;
        if (context) {
          userMessage += `\n\nContext: ${context}`;
        }

        const response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{
            role: "user",
            content: userMessage,
          }],
        });

        result = response.content[0]?.type === "text" ? response.content[0].text : "";
        log.info("AI chat completed", { resultLength: result.length });
      }

      return {
        result,
        suggestions: [
          "Ask follow-up questions for clarification",
          "Request specific code examples if needed",
          "Consider breaking complex tasks into smaller steps",
        ],
        confidence: hasApiKey ? 0.9 : 0.1,
        metadata: {
          model: hasApiKey ? "claude-3-5-sonnet-20241022" : "mock",
          timestamp: new Date().toISOString(),
          projectId,
          mode: hasApiKey ? "real" : "mock",
        },
      };
    } catch (error) {
      log.error("AI chat failed", { error: (error as Error).message });
      throw APIError.internal("Failed to process chat request");
    }
  }
);

// Code generation endpoint
export const generate = api(
  { method: "POST", path: "/ai/code-generation", expose: true },
  async ({ prompt, language, framework, context }: CodeGenerationRequest): Promise<AIResponse> => {
    log.info("Code generation request", { language, framework });

    // Validation
    validateCodeGenerationRequest({ prompt, language, framework, context });

    try {
      let generatedCode: string;

      if (!hasApiKey) {
        // Mock response when API key is not available
        generatedCode = `// Mock Code Generation for ${language}${framework ? ` with ${framework}` : ''}
// Request: ${prompt}

${language === 'typescript' ? 'function mockGeneratedFunction(): string {' : 
  language === 'javascript' ? 'function mockGeneratedFunction() {' :
  language === 'python' ? 'def mock_generated_function():' :
  language === 'java' ? 'public class MockGenerated {' :
  '// Mock generated code'}
${language === 'typescript' || language === 'javascript' ? '  return "This is mock generated code";' :
  language === 'python' ? '    return "This is mock generated code"' :
  language === 'java' ? '  public String mockMethod() { return "Mock code"; }' :
  '  // Mock implementation'}
${language === 'typescript' || language === 'javascript' || language === 'java' ? '}' : ''}

// Note: This is a mock response. Configure ANTHROPIC_API_KEY for real code generation.`;
        log.info("Code generation completed (mock mode)", { language, framework });
      } else {
        // Real AI response
        let systemPrompt = `You are an expert ${language} developer`;
        if (framework) {
          systemPrompt += ` specializing in ${framework}`;
        }
        systemPrompt += ". Generate clean, efficient, and well-documented code based on the user's requirements.";

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
            content: userMessage,
          }],
        });

        generatedCode = response.content[0]?.type === "text" ? response.content[0].text : "";
        log.info("Code generation completed", { codeLength: generatedCode.length });
      }

      return {
        result: generatedCode,
        suggestions: [
          "Consider adding error handling",
          "Add unit tests for this code",
          "Review for security best practices",
        ],
        confidence: hasApiKey ? 0.85 : 0.1,
        metadata: {
          model: hasApiKey ? "claude-3-5-sonnet-20241022" : "mock",
          language,
          framework,
          timestamp: new Date().toISOString(),
          mode: hasApiKey ? "real" : "mock",
        },
      };
    } catch (error) {
      log.error("Code generation failed", { error: (error as Error).message });
      throw APIError.internal("Failed to generate code");
    }
  }
);

// Code review endpoint
export const review = api(
  { method: "POST", path: "/ai/code-review", expose: true },
  async ({ code, language, focus = ["all"] }: CodeReviewRequest): Promise<AIResponse> => {
    log.info("Code review request", { language, focus });

    // Validation
    validateCodeReviewRequest({ code, language, focus });

    try {
      const focusAreas = focus.join(", ");
      let review: string;

      if (!hasApiKey) {
        // Mock response when API key is not available
        review = `## Mock Code Review for ${language}

**Focus Areas:** ${focusAreas}

### Analysis
This is a mock code review. The code appears to be ${language} code with a length of ${code.length} characters.

### Mock Findings:
- **Structure**: Code structure analysis would be performed here
- **Performance**: Performance review would identify potential optimizations
- **Security**: Security analysis would check for vulnerabilities
- **Style**: Code style and formatting review would be conducted

### Mock Recommendations:
1. Configure ANTHROPIC_API_KEY for detailed AI-powered code review
2. Consider following ${language} best practices
3. Add appropriate error handling
4. Include comprehensive unit tests

**Note:** This is a mock review. Real AI-powered analysis requires API key configuration.`;
        log.info("Code review completed (mock mode)", { language, focus });
      } else {
        // Real AI response
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
            content: userMessage,
          }],
        });

        review = response.content[0]?.type === "text" ? response.content[0].text : "";
        log.info("Code review completed", { reviewLength: review.length });
      }

      return {
        result: review,
        suggestions: [
          "Consider implementing suggested changes",
          "Run additional tests after modifications",
          "Document any architectural decisions",
        ],
        confidence: hasApiKey ? 0.9 : 0.1,
        metadata: {
          model: hasApiKey ? "claude-3-5-sonnet-20241022" : "mock",
          language,
          focusAreas,
          timestamp: new Date().toISOString(),
          mode: hasApiKey ? "real" : "mock",
        },
      };
    } catch (error) {
      log.error("Code review failed", { error: (error as Error).message });
      throw APIError.internal("Failed to review code");
    }
  }
);