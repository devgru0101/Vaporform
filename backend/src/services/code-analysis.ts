import { api, APICallMeta } from "encore.dev/api";
import log from "encore.dev/log";
import { z } from "zod";
import { AuthData } from "./auth";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from 'fs/promises';
import * as path from 'path';

// AI service configuration
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Real-time code analysis schemas
const CodeAnalysisRequest = z.object({
  code: z.string().min(1),
  filePath: z.string(),
  language: z.string(),
  analysisType: z.enum([
    "syntax", 
    "quality", 
    "security", 
    "performance", 
    "accessibility", 
    "all"
  ]).default("all"),
  projectContext: z.string().optional(),
  realTime: z.boolean().default(true),
  includeAutoFix: z.boolean().default(true),
});

const LiveQualityAssessmentRequest = z.object({
  code: z.string().min(1),
  filePath: z.string(),
  language: z.string(),
  cursorPosition: z.object({
    line: z.number(),
    column: z.number(),
  }).optional(),
  recentChanges: z.array(z.object({
    range: z.object({
      start: z.object({ line: z.number(), column: z.number() }),
      end: z.object({ line: z.number(), column: z.number() }),
    }),
    text: z.string(),
    timestamp: z.string(),
  })).optional(),
});

const SmartSuggestionsRequest = z.object({
  code: z.string().min(1),
  filePath: z.string(),
  language: z.string(),
  cursorPosition: z.object({
    line: z.number(),
    column: z.number(),
  }),
  context: z.object({
    projectFiles: z.array(z.string()).optional(),
    imports: z.array(z.string()).optional(),
    currentFunction: z.string().optional(),
    variables: z.array(z.string()).optional(),
  }).optional(),
  suggestionType: z.enum([
    "completion", 
    "refactor", 
    "optimize", 
    "fix", 
    "document"
  ]).default("completion"),
});

const CodeAnalysisResponse = z.object({
  issues: z.array(z.object({
    id: z.string(),
    type: z.enum(["error", "warning", "info", "suggestion"]),
    category: z.enum([
      "syntax", 
      "logic", 
      "performance", 
      "security", 
      "style", 
      "accessibility", 
      "maintainability"
    ]),
    severity: z.enum(["low", "medium", "high", "critical"]),
    message: z.string(),
    description: z.string().optional(),
    line: z.number().optional(),
    column: z.number().optional(),
    endLine: z.number().optional(),
    endColumn: z.number().optional(),
    rule: z.string().optional(),
    fixable: z.boolean().default(false),
    autoFix: z.object({
      description: z.string(),
      changes: z.array(z.object({
        range: z.object({
          start: z.object({ line: z.number(), column: z.number() }),
          end: z.object({ line: z.number(), column: z.number() }),
        }),
        newText: z.string(),
      })),
    }).optional(),
  })),
  suggestions: z.array(z.object({
    id: z.string(),
    type: z.enum(["completion", "refactor", "optimize", "alternative"]),
    title: z.string(),
    description: z.string(),
    code: z.string().optional(),
    range: z.object({
      start: z.object({ line: z.number(), column: z.number() }),
      end: z.object({ line: z.number(), column: z.number() }),
    }).optional(),
    confidence: z.number().min(0).max(1),
    impact: z.enum(["low", "medium", "high"]),
  })),
  metrics: z.object({
    complexity: z.number(),
    maintainability: z.number(),
    testCoverage: z.number().optional(),
    performance: z.number(),
    security: z.number(),
    accessibility: z.number().optional(),
    qualityScore: z.number(),
  }),
  recommendations: z.array(z.string()),
  metadata: z.object({
    analysisTime: z.number(),
    linesAnalyzed: z.number(),
    model: z.string(),
    timestamp: z.string(),
  }),
});

const SmartSuggestionsResponse = z.object({
  suggestions: z.array(z.object({
    id: z.string(),
    type: z.enum(["method", "property", "variable", "import", "snippet"]),
    label: z.string(),
    detail: z.string().optional(),
    documentation: z.string().optional(),
    insertText: z.string(),
    range: z.object({
      start: z.object({ line: z.number(), column: z.number() }),
      end: z.object({ line: z.number(), column: z.number() }),
    }).optional(),
    sortText: z.string().optional(),
    filterText: z.string().optional(),
    confidence: z.number().min(0).max(1),
    source: z.enum(["ai", "intellisense", "snippet", "import"]),
  })),
  context: z.object({
    currentScope: z.string().optional(),
    availableSymbols: z.array(z.string()).optional(),
    suggestedImports: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.object({
    processingTime: z.number(),
    model: z.string(),
    timestamp: z.string(),
  }),
});

// Real-time code analysis endpoint
export const analyzeCodeRealTime = api<typeof CodeAnalysisRequest, typeof CodeAnalysisResponse>(
  { method: "POST", path: "/ai/analyze-code-realtime", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof CodeAnalysisResponse>> => {
    const { userID } = meta.auth;
    const { code, filePath, language, analysisType, projectContext, realTime, includeAutoFix } = req;
    
    const startTime = Date.now();
    log.info("Real-time code analysis request", { 
      userID, 
      filePath, 
      language, 
      analysisType,
      codeLength: code.length,
      realTime 
    });
    
    try {
      const systemPrompt = `You are an expert real-time code analyzer with deep knowledge of ${language}. 
      
Perform comprehensive analysis focusing on:
1. Syntax errors and logical issues
2. Code quality and best practices
3. Performance implications
4. Security vulnerabilities
5. Accessibility compliance (if applicable)
6. Maintainability concerns

Analysis type: ${analysisType}
Real-time mode: ${realTime}

For each issue found, provide:
- Precise location (line/column)
- Clear explanation
- Severity level
- ${includeAutoFix ? 'Automatic fix suggestions when possible' : 'Manual fix recommendations'}

Be concise but thorough. Focus on actionable insights.`;

      let userMessage = `Analyze this ${language} code for issues and improvements:

File: ${filePath}

\`\`\`${language}
${code}
\`\`\``;

      if (projectContext) {
        userMessage += `\n\nProject Context:\n${projectContext}`;
      }

      userMessage += `\n\nFocus on: ${analysisType}
Provide detailed analysis with specific line numbers and actionable fixes.`;

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: realTime ? 3000 : 5000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });

      const analysisResult = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      // Parse AI analysis into structured format
      const structuredAnalysis = await parseCodeAnalysis(analysisResult, code, language, includeAutoFix);
      
      // Calculate code metrics
      const metrics = calculateCodeMetrics(code, language);
      
      // Generate intelligent suggestions
      const suggestions = await generateIntelligentSuggestions(code, language, analysisResult);
      
      const processingTime = Date.now() - startTime;
      
      log.info("Real-time code analysis completed", { 
        userID, 
        issuesFound: structuredAnalysis.issues.length,
        suggestionsGenerated: suggestions.length,
        processingTime 
      });

      return {
        issues: structuredAnalysis.issues,
        suggestions,
        metrics,
        recommendations: structuredAnalysis.recommendations,
        metadata: {
          analysisTime: processingTime,
          linesAnalyzed: code.split('\n').length,
          model: "claude-3-5-sonnet-20241022",
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      log.error("Real-time code analysis failed", { error: error.message, userID });
      throw new Error("Failed to analyze code in real-time");
    }
  }
);

// Live quality assessment endpoint
export const assessQualityLive = api<typeof LiveQualityAssessmentRequest, typeof CodeAnalysisResponse>(
  { method: "POST", path: "/ai/assess-quality-live", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof CodeAnalysisResponse>> => {
    const { userID } = meta.auth;
    const { code, filePath, language, cursorPosition, recentChanges } = req;
    
    const startTime = Date.now();
    log.info("Live quality assessment request", { 
      userID, 
      filePath, 
      language,
      hasRecentChanges: !!recentChanges?.length 
    });
    
    try {
      const systemPrompt = `You are a live code quality assessor. Provide instant feedback on code quality as the developer types.

Focus on:
1. Immediate syntax and logic issues
2. Code style and consistency
3. Potential bugs and improvements
4. Performance considerations
5. Best practice adherence

Provide quick, actionable feedback that helps improve code quality in real-time.`;

      let userMessage = `Assess the quality of this ${language} code:

File: ${filePath}
${cursorPosition ? `Cursor at line ${cursorPosition.line}, column ${cursorPosition.column}` : ''}

\`\`\`${language}
${code}
\`\`\``;

      if (recentChanges && recentChanges.length > 0) {
        userMessage += `\n\nRecent changes:`;
        recentChanges.forEach((change, index) => {
          userMessage += `\n${index + 1}. Lines ${change.range.start.line}-${change.range.end.line}: "${change.text}"`;
        });
      }

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2500,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });

      const qualityAssessment = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      // Parse quality assessment
      const structuredAssessment = await parseQualityAssessment(qualityAssessment, code, language);
      
      // Calculate real-time metrics
      const metrics = calculateRealTimeMetrics(code, language, recentChanges);
      
      // Generate contextual suggestions
      const suggestions = await generateContextualSuggestions(code, language, cursorPosition);
      
      const processingTime = Date.now() - startTime;
      
      log.info("Live quality assessment completed", { 
        userID, 
        issuesFound: structuredAssessment.issues.length,
        qualityScore: metrics.qualityScore,
        processingTime 
      });

      return {
        issues: structuredAssessment.issues,
        suggestions,
        metrics,
        recommendations: structuredAssessment.recommendations,
        metadata: {
          analysisTime: processingTime,
          linesAnalyzed: code.split('\n').length,
          model: "claude-3-5-sonnet-20241022",
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      log.error("Live quality assessment failed", { error: error.message, userID });
      throw new Error("Failed to assess code quality live");
    }
  }
);

// Smart suggestions endpoint
export const getSmartSuggestions = api<typeof SmartSuggestionsRequest, typeof SmartSuggestionsResponse>(
  { method: "POST", path: "/ai/smart-suggestions", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof SmartSuggestionsResponse>> => {
    const { userID } = meta.auth;
    const { code, filePath, language, cursorPosition, context, suggestionType } = req;
    
    const startTime = Date.now();
    log.info("Smart suggestions request", { 
      userID, 
      filePath, 
      language, 
      suggestionType,
      cursorLine: cursorPosition.line 
    });
    
    try {
      const systemPrompt = `You are an intelligent code completion and suggestion engine for ${language}.

Provide context-aware suggestions for:
1. Code completion at cursor position
2. Method and property suggestions
3. Import suggestions
4. Refactoring opportunities
5. Code snippets and patterns

Suggestion type: ${suggestionType}
Consider the cursor position and surrounding context to provide relevant, accurate suggestions.`;

      const codeLines = code.split('\n');
      const currentLine = codeLines[cursorPosition.line - 1] || '';
      const beforeCursor = currentLine.substring(0, cursorPosition.column);
      const afterCursor = currentLine.substring(cursorPosition.column);
      
      let userMessage = `Provide smart suggestions for ${language} code:

File: ${filePath}
Cursor position: Line ${cursorPosition.line}, Column ${cursorPosition.column}

Current line: "${currentLine}"
Before cursor: "${beforeCursor}"
After cursor: "${afterCursor}"

Context around cursor:
\`\`\`${language}
${getContextAroundPosition(codeLines, cursorPosition, 5)}
\`\`\``;

      if (context) {
        if (context.currentFunction) {
          userMessage += `\nCurrent function: ${context.currentFunction}`;
        }
        if (context.variables?.length) {
          userMessage += `\nAvailable variables: ${context.variables.join(', ')}`;
        }
        if (context.imports?.length) {
          userMessage += `\nCurrent imports: ${context.imports.join(', ')}`;
        }
      }

      userMessage += `\n\nProvide ${suggestionType} suggestions that are contextually relevant and helpful.`;

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userMessage
        }]
      });

      const suggestionsResult = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      // Parse AI suggestions into structured format
      const structuredSuggestions = await parseSmartSuggestions(
        suggestionsResult, 
        code, 
        language, 
        cursorPosition, 
        suggestionType
      );
      
      const processingTime = Date.now() - startTime;
      
      log.info("Smart suggestions completed", { 
        userID, 
        suggestionsCount: structuredSuggestions.suggestions.length,
        processingTime 
      });

      return {
        suggestions: structuredSuggestions.suggestions,
        context: structuredSuggestions.context,
        metadata: {
          processingTime,
          model: "claude-3-5-sonnet-20241022",
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      log.error("Smart suggestions failed", { error: error.message, userID });
      throw new Error("Failed to generate smart suggestions");
    }
  }
);

// Utility functions

async function parseCodeAnalysis(analysis: string, code: string, language: string, includeAutoFix: boolean): Promise<any> {
  const issues = [];
  const recommendations = [];
  
  // Parse AI analysis for structured issues
  const lines = analysis.split('\n');
  let currentIssue = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect issue patterns
    if (line.toLowerCase().includes('error') || line.toLowerCase().includes('issue')) {
      if (currentIssue) {
        issues.push(currentIssue);
      }
      
      currentIssue = {
        id: `issue_${issues.length + 1}`,
        type: line.toLowerCase().includes('error') ? 'error' : 'warning',
        category: detectCategory(line),
        severity: detectSeverity(line),
        message: line,
        line: extractLineNumber(line),
        fixable: includeAutoFix && line.toLowerCase().includes('fix'),
      };
    }
    
    if (line.toLowerCase().includes('recommend')) {
      recommendations.push(line);
    }
  }
  
  if (currentIssue) {
    issues.push(currentIssue);
  }
  
  return { issues, recommendations };
}

async function parseQualityAssessment(assessment: string, code: string, language: string): Promise<any> {
  const issues = [];
  const recommendations = [];
  
  // Simple parsing for quality assessment
  const lines = assessment.split('\n');
  
  for (const line of lines) {
    if (line.toLowerCase().includes('quality') || line.toLowerCase().includes('improve')) {
      issues.push({
        id: `quality_${issues.length + 1}`,
        type: 'suggestion',
        category: 'style',
        severity: 'low',
        message: line.trim(),
        fixable: false,
      });
    }
    
    if (line.toLowerCase().includes('recommend')) {
      recommendations.push(line.trim());
    }
  }
  
  return { issues, recommendations };
}

async function parseSmartSuggestions(
  suggestions: string, 
  code: string, 
  language: string, 
  cursorPosition: any, 
  suggestionType: string
): Promise<any> {
  const structuredSuggestions = [];
  const lines = suggestions.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line && !line.startsWith('#') && !line.startsWith('//')) {
      structuredSuggestions.push({
        id: `suggestion_${i}`,
        type: detectSuggestionType(line, suggestionType),
        label: line.substring(0, 50),
        insertText: line,
        confidence: 0.8,
        source: 'ai',
      });
    }
  }
  
  return {
    suggestions: structuredSuggestions.slice(0, 10), // Limit to top 10
    context: {
      currentScope: detectCurrentScope(code, cursorPosition),
      availableSymbols: extractAvailableSymbols(code, language),
    }
  };
}

function calculateCodeMetrics(code: string, language: string): any {
  const lines = code.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  
  // Simple complexity calculation
  const complexity = calculateCyclomaticComplexity(code);
  const maintainability = calculateMaintainabilityIndex(code, complexity);
  const performance = calculatePerformanceScore(code, language);
  const security = calculateSecurityScore(code, language);
  
  const qualityScore = (maintainability + performance + security) / 3;
  
  return {
    complexity,
    maintainability,
    performance,
    security,
    qualityScore,
  };
}

function calculateRealTimeMetrics(code: string, language: string, recentChanges?: any[]): any {
  const baseMetrics = calculateCodeMetrics(code, language);
  
  // Adjust metrics based on recent changes
  if (recentChanges && recentChanges.length > 0) {
    const changeImpact = recentChanges.length * 0.1;
    baseMetrics.qualityScore = Math.max(0, baseMetrics.qualityScore - changeImpact);
  }
  
  return baseMetrics;
}

async function generateIntelligentSuggestions(code: string, language: string, analysis: string): Promise<any[]> {
  const suggestions = [];
  
  // Generate suggestions based on analysis
  if (analysis.toLowerCase().includes('performance')) {
    suggestions.push({
      id: 'perf_suggestion_1',
      type: 'optimize',
      title: 'Performance Optimization Available',
      description: 'Consider optimizing this code for better performance',
      confidence: 0.8,
      impact: 'medium',
    });
  }
  
  if (analysis.toLowerCase().includes('refactor')) {
    suggestions.push({
      id: 'refactor_suggestion_1',
      type: 'refactor',
      title: 'Refactoring Opportunity',
      description: 'This code could benefit from refactoring',
      confidence: 0.7,
      impact: 'high',
    });
  }
  
  return suggestions;
}

async function generateContextualSuggestions(code: string, language: string, cursorPosition?: any): Promise<any[]> {
  const suggestions = [];
  
  // Generate contextual suggestions based on cursor position
  if (cursorPosition) {
    const currentLine = code.split('\n')[cursorPosition.line - 1] || '';
    
    if (currentLine.trim().length === 0) {
      suggestions.push({
        id: 'context_suggestion_1',
        type: 'completion',
        title: 'Add Implementation',
        description: 'Consider adding implementation here',
        confidence: 0.6,
        impact: 'low',
      });
    }
  }
  
  return suggestions;
}

// Helper functions

function detectCategory(text: string): string {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('security')) return 'security';
  if (lowerText.includes('performance')) return 'performance';
  if (lowerText.includes('syntax')) return 'syntax';
  if (lowerText.includes('style')) return 'style';
  if (lowerText.includes('accessibility')) return 'accessibility';
  return 'logic';
}

function detectSeverity(text: string): string {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('critical')) return 'critical';
  if (lowerText.includes('high')) return 'high';
  if (lowerText.includes('medium')) return 'medium';
  return 'low';
}

function extractLineNumber(text: string): number | undefined {
  const match = text.match(/line\s+(\d+)/i);
  return match ? parseInt(match[1]) : undefined;
}

function detectSuggestionType(text: string, requestedType: string): string {
  if (requestedType !== 'completion') return requestedType;
  
  const lowerText = text.toLowerCase();
  if (lowerText.includes('function') || lowerText.includes('method')) return 'method';
  if (lowerText.includes('import')) return 'import';
  if (lowerText.includes('variable')) return 'variable';
  return 'snippet';
}

function detectCurrentScope(code: string, cursorPosition: any): string {
  const lines = code.split('\n');
  const currentLine = cursorPosition.line - 1;
  
  // Simple scope detection
  for (let i = currentLine; i >= 0; i--) {
    const line = lines[i];
    if (line.includes('function') || line.includes('class') || line.includes('method')) {
      const match = line.match(/(?:function|class|method)\s+(\w+)/);
      return match ? match[1] : 'unknown';
    }
  }
  
  return 'global';
}

function extractAvailableSymbols(code: string, language: string): string[] {
  const symbols = [];
  const lines = code.split('\n');
  
  // Extract variable and function names
  for (const line of lines) {
    // Simple regex patterns for common symbols
    const varMatches = line.match(/(?:const|let|var)\s+(\w+)/g);
    const funcMatches = line.match(/function\s+(\w+)/g);
    
    if (varMatches) {
      varMatches.forEach(match => {
        const varName = match.split(/\s+/)[1];
        if (varName && !symbols.includes(varName)) {
          symbols.push(varName);
        }
      });
    }
    
    if (funcMatches) {
      funcMatches.forEach(match => {
        const funcName = match.split(/\s+/)[1];
        if (funcName && !symbols.includes(funcName)) {
          symbols.push(funcName);
        }
      });
    }
  }
  
  return symbols.slice(0, 20); // Limit to prevent overwhelming
}

function getContextAroundPosition(lines: string[], position: any, contextLines: number): string {
  const start = Math.max(0, position.line - contextLines - 1);
  const end = Math.min(lines.length, position.line + contextLines);
  
  return lines.slice(start, end).map((line, index) => {
    const lineNumber = start + index + 1;
    const marker = lineNumber === position.line ? ' >>> ' : '     ';
    return `${lineNumber}${marker}${line}`;
  }).join('\n');
}

function calculateCyclomaticComplexity(code: string): number {
  // Simple complexity calculation based on control flow statements
  const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||'];
  let complexity = 1; // Base complexity
  
  for (const keyword of complexityKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = code.match(regex);
    if (matches) {
      complexity += matches.length;
    }
  }
  
  return Math.min(complexity, 100); // Cap at 100
}

function calculateMaintainabilityIndex(code: string, complexity: number): number {
  const lines = code.split('\n').length;
  const volume = code.length;
  
  // Simplified maintainability index calculation
  const maintainability = Math.max(0, 
    100 - (complexity * 2) - (lines * 0.1) - (volume * 0.001)
  );
  
  return Math.min(100, maintainability) / 100; // Normalize to 0-1
}

function calculatePerformanceScore(code: string, language: string): number {
  let score = 1.0;
  const lowerCode = code.toLowerCase();
  
  // Deduct points for potential performance issues
  if (lowerCode.includes('nested loop') || 
      (lowerCode.includes('for') && lowerCode.includes('for'))) {
    score -= 0.2;
  }
  
  if (lowerCode.includes('settimeout') || lowerCode.includes('setinterval')) {
    score -= 0.1;
  }
  
  if (lowerCode.includes('document.getelementby')) {
    score -= 0.1;
  }
  
  return Math.max(0, score);
}

function calculateSecurityScore(code: string, language: string): number {
  let score = 1.0;
  const lowerCode = code.toLowerCase();
  
  // Deduct points for potential security issues
  if (lowerCode.includes('eval(') || lowerCode.includes('innerhtml')) {
    score -= 0.3;
  }
  
  if (lowerCode.includes('localstorage') && lowerCode.includes('password')) {
    score -= 0.2;
  }
  
  if (lowerCode.includes('document.write')) {
    score -= 0.2;
  }
  
  return Math.max(0, score);
}