import { api } from 'encore.dev/api';
import log from 'encore.dev/log';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// AI service configuration
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// AI Testing service schemas
const TestGenerationRequest = z.object({
  code: z.string().min(1),
  filePath: z.string(),
  language: z.string(),
  testType: z.enum(['unit', 'integration', 'e2e', 'performance', 'security']),
  framework: z.string().optional(),
  coverage: z.enum(['basic', 'comprehensive', 'edge-cases']).default('comprehensive'),
  mockingStrategy: z.enum(['minimal', 'extensive', 'smart']).default('smart'),
  includeSetup: z.boolean().default(true),
  includeEdgeCases: z.boolean().default(true),
  projectContext: z.string().optional(),
});

const TestAnalysisRequest = z.object({
  testCode: z.string().min(1),
  sourceCode: z.string().optional(),
  language: z.string(),
  framework: z.string().optional(),
  analysisType: z.enum(['coverage', 'quality', 'completeness', 'performance', 'all']).default('all'),
});

const QualityAssessmentRequest = z.object({
  code: z.string().min(1),
  tests: z.string().optional(),
  language: z.string(),
  metrics: z.array(z.enum([
    'complexity', 
    'maintainability', 
    'testability', 
    'security', 
    'performance', 
    'documentation',
  ])).default(['complexity', 'maintainability', 'testability']),
  includeRecommendations: z.boolean().default(true),
});

const TestSuiteGenerationRequest = z.object({
  projectPath: z.string(),
  includeUnitTests: z.boolean().default(true),
  includeIntegrationTests: z.boolean().default(true),
  includeE2ETests: z.boolean().default(false),
  testFramework: z.string().optional(),
  mockingLibrary: z.string().optional(),
  coverageTarget: z.number().min(0).max(100).default(80),
});

const TestDataGenerationRequest = z.object({
  schema: z.string().optional(),
  dataType: z.enum(['mock', 'fixture', 'factory', 'random']).default('mock'),
  count: z.number().min(1).max(1000).default(10),
  format: z.enum(['json', 'javascript', 'typescript', 'yaml']).default('json'),
  includeEdgeCases: z.boolean().default(true),
});

const TestResponse = z.object({
  tests: z.array(z.object({
    name: z.string(),
    description: z.string(),
    code: z.string(),
    type: z.enum(['unit', 'integration', 'e2e', 'performance', 'security']),
    coverage: z.array(z.string()),
    dependencies: z.array(z.string()).optional(),
  })),
  setup: z.object({
    imports: z.array(z.string()),
    mocks: z.array(z.string()).optional(),
    fixtures: z.array(z.string()).optional(),
    configuration: z.string().optional(),
  }),
  metrics: z.object({
    estimatedCoverage: z.number(),
    testCount: z.number(),
    complexity: z.enum(['low', 'medium', 'high']),
    executionTime: z.string().optional(),
  }),
  recommendations: z.array(z.string()),
  metadata: z.object({
    framework: z.string(),
    language: z.string(),
    generationTime: z.number(),
    model: z.string(),
    timestamp: z.string(),
  }),
});

const QualityReport = z.object({
  overall: z.object({
    score: z.number().min(0).max(100),
    grade: z.enum(['A', 'B', 'C', 'D', 'F']),
    summary: z.string(),
  }),
  metrics: z.object({
    complexity: z.object({
      score: z.number(),
      level: z.enum(['low', 'medium', 'high', 'very-high']),
      details: z.string(),
    }),
    maintainability: z.object({
      score: z.number(),
      level: z.enum(['excellent', 'good', 'fair', 'poor']),
      details: z.string(),
    }),
    testability: z.object({
      score: z.number(),
      coverage: z.number().optional(),
      details: z.string(),
    }),
    security: z.object({
      score: z.number(),
      vulnerabilities: z.array(z.object({
        type: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        description: z.string(),
        recommendation: z.string(),
      })),
      details: z.string(),
    }).optional(),
    performance: z.object({
      score: z.number(),
      bottlenecks: z.array(z.string()),
      details: z.string(),
    }).optional(),
    documentation: z.object({
      score: z.number(),
      coverage: z.number(),
      details: z.string(),
    }).optional(),
  }),
  issues: z.array(z.object({
    type: z.enum(['error', 'warning', 'suggestion']),
    category: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    message: z.string(),
    line: z.number().optional(),
    recommendation: z.string(),
  })),
  recommendations: z.array(z.object({
    priority: z.enum(['low', 'medium', 'high']),
    category: z.string(),
    description: z.string(),
    effort: z.enum(['low', 'medium', 'high']),
    impact: z.enum(['low', 'medium', 'high']),
  })),
  metadata: z.object({
    analysisTime: z.number(),
    linesAnalyzed: z.number(),
    model: z.string(),
    timestamp: z.string(),
  }),
});

// Intelligent test generation endpoint
export const generateIntelligentTests = api(
  { method: 'POST', path: '/ai/generate-tests', auth: true, expose: true },
  async (req: z.infer<typeof TestGenerationRequest>): Promise<z.infer<typeof TestResponse>> => {
    // TODO: Fix auth data access when Encore.ts auth is properly configured
    const userID = 'placeholder-user-id';
    const { 
      code, 
      filePath, 
      language, 
      testType, 
      framework, 
      coverage, 
      mockingStrategy, 
      includeSetup,
      includeEdgeCases,
      projectContext, 
    } = req;
    
    const startTime = Date.now();
    log.info('Intelligent test generation request', { 
      userID, 
      filePath, 
      language, 
      testType,
      coverage, 
    });
    
    try {
      const systemPrompt = `You are an expert test engineer specializing in ${language} and ${testType} testing. 
      
Generate comprehensive, production-ready tests with:
1. Clear test descriptions and naming
2. Proper setup and teardown
3. Edge case coverage
4. Appropriate mocking strategies
5. Performance considerations
6. Security validation (for security tests)

Test Type: ${testType}
Coverage Level: ${coverage}
Mocking Strategy: ${mockingStrategy}
Framework: ${framework || 'standard'}

Ensure tests are:
- Maintainable and readable
- Fast and reliable
- Independent and isolated
- Follow best practices for ${language}
- Include proper assertions
- Handle async operations correctly`;

      let userMessage = `Generate ${testType} tests for this ${language} code:

File: ${filePath}

\`\`\`${language}
${code}
\`\`\`

Requirements:
- Test Type: ${testType}
- Coverage: ${coverage}
- Mocking: ${mockingStrategy}
- Include Setup: ${includeSetup}
- Include Edge Cases: ${includeEdgeCases}`;

      if (framework) {
        userMessage += `\n- Framework: ${framework}`;
      }

      if (projectContext) {
        userMessage += `\n\nProject Context:\n${projectContext}`;
      }

      userMessage += '\n\nGenerate complete test suite with setup, mocks, and comprehensive test cases.';

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage,
        }],
      });

      const testGeneration = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      // Parse the generated tests into structured format
      const structuredTests = await parseGeneratedTests(testGeneration, testType, language, framework);
      
      // Calculate test metrics
      const testMetrics = calculateTestMetrics(structuredTests, code);
      
      // Generate recommendations
      const recommendations = generateTestRecommendations(structuredTests, testType, coverage);
      
      const processingTime = Date.now() - startTime;
      
      log.info('Intelligent test generation completed', { 
        userID, 
        testsGenerated: structuredTests.length,
        estimatedCoverage: testMetrics.estimatedCoverage,
        processingTime, 
      });

      return {
        tests: structuredTests,
        setup: {
          imports: extractImports(testGeneration, language, framework),
          mocks: mockingStrategy !== 'minimal' ? extractMocks(testGeneration) : [],
          fixtures: includeEdgeCases ? extractFixtures(testGeneration) : [],
          configuration: extractConfiguration(testGeneration, framework),
        },
        metrics: testMetrics,
        recommendations,
        metadata: {
          framework: framework || 'standard',
          language,
          generationTime: processingTime,
          model: 'claude-3-5-sonnet-20241022',
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error) {
      const err = error as Error;
      log.error('Intelligent test generation failed', { error: err.message, userID });
      throw new Error('Failed to generate intelligent tests');
    }
  },
);

// Test analysis endpoint
export const analyzeTests = api(
  { method: 'POST', path: '/ai/analyze-tests', auth: true, expose: true },
  async (req: z.infer<typeof TestAnalysisRequest>): Promise<z.infer<typeof QualityReport>> => {
    // TODO: Fix auth data access when Encore.ts auth is properly configured
    const userID = 'placeholder-user-id';
    const { testCode, sourceCode, language, framework, analysisType } = req;
    
    const startTime = Date.now();
    log.info('Test analysis request', { userID, language, framework, analysisType });
    
    try {
      const systemPrompt = `You are an expert test analyzer specializing in ${language} testing. 
      
Analyze the provided tests for:
1. Test quality and completeness
2. Coverage analysis
3. Performance implications
4. Best practice adherence
5. Maintainability concerns
6. Security considerations

Analysis Type: ${analysisType}
Framework: ${framework || 'standard'}

Provide detailed analysis with specific recommendations for improvement.`;

      let userMessage = `Analyze these ${language} tests:

\`\`\`${language}
${testCode}
\`\`\``;

      if (sourceCode) {
        userMessage += `\n\nSource Code being tested:
\`\`\`${language}
${sourceCode}
\`\`\``;
      }

      userMessage += `\n\nFocus on: ${analysisType}
Provide comprehensive analysis with scores, issues, and recommendations.`;

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
      
      // Parse analysis into structured report
      const qualityReport = await parseTestAnalysis(analysis, testCode, sourceCode, language);
      
      const processingTime = Date.now() - startTime;
      
      log.info('Test analysis completed', { 
        userID, 
        overallScore: qualityReport.overall.score,
        issuesFound: qualityReport.issues.length,
        processingTime, 
      });

      return {
        ...qualityReport,
        metadata: {
          analysisTime: processingTime,
          linesAnalyzed: testCode.split('\n').length,
          model: 'claude-3-5-sonnet-20241022',
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error) {
      const err = error as Error;
      log.error('Test analysis failed', { error: err.message, userID });
      throw new Error('Failed to analyze tests');
    }
  },
);

// Quality assessment endpoint
export const assessCodeQuality = api(
  { method: 'POST', path: '/ai/assess-quality', auth: true, expose: true },
  async (req: z.infer<typeof QualityAssessmentRequest>): Promise<z.infer<typeof QualityReport>> => {
    // TODO: Fix auth data access when Encore.ts auth is properly configured
    const userID = 'placeholder-user-id';
    const { code, tests, language, metrics, includeRecommendations } = req;
    
    const startTime = Date.now();
    log.info('Quality assessment request', { userID, language, metrics: metrics.length });
    
    try {
      const systemPrompt = `You are a senior code quality analyst specializing in ${language}. 
      
Perform comprehensive quality assessment focusing on:
${metrics.map(m => `- ${m.charAt(0).toUpperCase() + m.slice(1)}`).join('\n')}

Analyze code for:
1. Code complexity and maintainability
2. Security vulnerabilities and risks
3. Performance bottlenecks and optimizations
4. Testability and test coverage
5. Documentation quality and completeness
6. Best practice adherence

Provide specific, actionable recommendations with priority levels.`;

      let userMessage = `Assess the quality of this ${language} code:

\`\`\`${language}
${code}
\`\`\``;

      if (tests) {
        userMessage += `\n\nExisting Tests:
\`\`\`${language}
${tests}
\`\`\``;
      }

      userMessage += `\n\nAnalyze these metrics: ${metrics.join(', ')}
${includeRecommendations ? 'Include detailed recommendations for improvement.' : ''}

Provide scores (0-100) for each metric and overall quality assessment.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 7000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage,
        }],
      });

      const assessment = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      // Parse assessment into structured report
      const qualityReport = await parseQualityAssessment(assessment, code, tests, language, metrics);
      
      const processingTime = Date.now() - startTime;
      
      log.info('Quality assessment completed', { 
        userID, 
        overallScore: qualityReport.overall.score,
        grade: qualityReport.overall.grade,
        processingTime, 
      });

      return {
        ...qualityReport,
        metadata: {
          analysisTime: processingTime,
          linesAnalyzed: code.split('\n').length,
          model: 'claude-3-5-sonnet-20241022',
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error) {
      const err = error as Error;
      log.error('Quality assessment failed', { error: err.message, userID });
      throw new Error('Failed to assess code quality');
    }
  },
);

// Test suite generation endpoint
export const generateTestSuite = api(
  { method: 'POST', path: '/ai/generate-test-suite', auth: true, expose: true },
  async (req: z.infer<typeof TestSuiteGenerationRequest>): Promise<z.infer<typeof TestResponse>> => {
    // TODO: Fix auth data access when Encore.ts auth is properly configured
    const userID = 'placeholder-user-id';
    const { 
      projectPath, 
      includeUnitTests, 
      includeIntegrationTests, 
      includeE2ETests,
      testFramework,
      mockingLibrary,
      coverageTarget, 
    } = req;
    
    const startTime = Date.now();
    log.info('Test suite generation request', { 
      userID, 
      projectPath,
      coverageTarget,
      unitTests: includeUnitTests,
      integrationTests: includeIntegrationTests,
      e2eTests: includeE2ETests,
    });
    
    try {
      // Analyze project structure
      const projectAnalysis = await analyzeProjectForTesting(projectPath);
      
      const systemPrompt = `You are a test automation architect. Generate a comprehensive test suite for the entire project.
      
Project Analysis:
${projectAnalysis}

Generate tests for:
${includeUnitTests ? '- Unit tests for all functions and classes' : ''}
${includeIntegrationTests ? '- Integration tests for API endpoints and data flow' : ''}
${includeE2ETests ? '- End-to-end tests for user workflows' : ''}

Target Coverage: ${coverageTarget}%
Framework: ${testFramework || 'auto-detect'}
Mocking: ${mockingLibrary || 'auto-detect'}

Create a complete, production-ready test suite with proper organization and setup.`;

      const userMessage = `Generate a comprehensive test suite for this project:

Project Path: ${projectPath}

Requirements:
- Unit Tests: ${includeUnitTests}
- Integration Tests: ${includeIntegrationTests}
- E2E Tests: ${includeE2ETests}
- Coverage Target: ${coverageTarget}%
- Framework: ${testFramework || 'auto-detect'}

Generate organized test files with proper structure and configuration.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage,
        }],
      });

      const testSuite = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      // Parse the generated test suite
      const structuredTests = await parseTestSuite(testSuite, projectPath);
      
      // Calculate suite metrics
      const suiteMetrics = calculateSuiteMetrics(structuredTests, coverageTarget);
      
      const processingTime = Date.now() - startTime;
      
      log.info('Test suite generation completed', { 
        userID, 
        testsGenerated: structuredTests.length,
        estimatedCoverage: suiteMetrics.estimatedCoverage,
        processingTime, 
      });

      return {
        tests: structuredTests,
        setup: {
          imports: extractSuiteImports(testSuite, testFramework),
          mocks: mockingLibrary ? extractSuiteMocks(testSuite) : [],
          fixtures: extractSuiteFixtures(testSuite),
          configuration: generateTestConfiguration(testFramework, mockingLibrary, coverageTarget),
        },
        metrics: suiteMetrics,
        recommendations: generateSuiteRecommendations(structuredTests, coverageTarget),
        metadata: {
          framework: testFramework || 'auto-detected',
          language: 'auto-detected',
          generationTime: processingTime,
          model: 'claude-3-5-sonnet-20241022',
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error) {
      const err = error as Error;
      log.error('Test suite generation failed', { error: err.message, userID });
      throw new Error('Failed to generate test suite');
    }
  },
);

// Test data generation endpoint
export const generateTestData = api(
  { method: 'POST', path: '/ai/generate-test-data', auth: true, expose: true },
  async (req: z.infer<typeof TestDataGenerationRequest>): Promise<any> => {
    // TODO: Fix auth data access when Encore.ts auth is properly configured
    const userID = 'placeholder-user-id';
    const { schema, dataType, count, format, includeEdgeCases } = req;
    
    const startTime = Date.now();
    log.info('Test data generation request', { userID, dataType, count, format });
    
    try {
      const systemPrompt = `You are a test data generation expert. Generate realistic, diverse test data.
      
Data Type: ${dataType}
Format: ${format}
Count: ${count}
Include Edge Cases: ${includeEdgeCases}

Generate data that:
1. Covers typical use cases
2. Includes boundary conditions
3. Tests error scenarios
4. Provides realistic variations
5. Follows proper data formats`;

      let userMessage = `Generate ${count} ${dataType} test data entries in ${format} format.`;

      if (schema) {
        userMessage += `\n\nSchema/Structure:\n${schema}`;
      }

      if (includeEdgeCases) {
        userMessage += '\n\nInclude edge cases like empty values, null, extremes, special characters.';
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

      const testData = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      // Parse and format the generated data
      const formattedData = await formatTestData(testData, format);
      
      const processingTime = Date.now() - startTime;
      
      log.info('Test data generation completed', { 
        userID, 
        dataCount: count,
        format,
        processingTime, 
      });

      return {
        data: formattedData,
        metadata: {
          dataType,
          count,
          format,
          includeEdgeCases,
          generationTime: processingTime,
          model: 'claude-3-5-sonnet-20241022',
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error) {
      const err = error as Error;
      log.error('Test data generation failed', { error: err.message, userID });
      throw new Error('Failed to generate test data');
    }
  },
);

// Utility functions

async function parseGeneratedTests(testGeneration: string, testType: string, _language: string, framework?: string): Promise<any[]> {
  const tests = [];
  const testBlocks = testGeneration.split(/(?:test\(|it\(|describe\()/i);
  
  for (let i = 1; i < testBlocks.length; i++) {
    const block = testBlocks[i];
    const nameMatch = block.match(/['"`]([^'"`]+)['"`]/);
    const name = nameMatch ? nameMatch[1] : `Test ${i}`;
    
    tests.push({
      name,
      description: `${testType} test for ${name}`,
      code: `test('${name}', ${block}`,
      type: testType,
      coverage: extractCoverage(block),
      dependencies: extractDependencies(block, framework),
    });
  }
  
  return tests.slice(0, 20); // Limit to prevent overwhelming
}

async function parseTestAnalysis(analysis: string, testCode: string, sourceCode?: string, _language?: string): Promise<any> {
  return {
    overall: {
      score: extractScore(analysis, 'overall') || 75,
      grade: calculateGrade(extractScore(analysis, 'overall') || 75),
      summary: extractSummary(analysis) || 'Test analysis completed',
    },
    metrics: {
      complexity: {
        score: extractScore(analysis, 'complexity') || 80,
        level: 'medium',
        details: 'Complexity analysis based on test structure',
      },
      maintainability: {
        score: extractScore(analysis, 'maintainability') || 75,
        level: 'good',
        details: 'Maintainability assessment',
      },
      testability: {
        score: extractScore(analysis, 'testability') || 85,
        coverage: calculateCoverage(testCode, sourceCode),
        details: 'Testability evaluation',
      },
    },
    issues: extractIssues(analysis),
    recommendations: extractRecommendations(analysis),
  };
}

async function parseQualityAssessment(assessment: string, code: string, tests?: string, _language?: string, metrics?: string[]): Promise<any> {
  const overallScore = extractScore(assessment, 'overall') || calculateOverallScore(code, tests);
  
  return {
    overall: {
      score: overallScore,
      grade: calculateGrade(overallScore),
      summary: extractSummary(assessment) || 'Quality assessment completed',
    },
    metrics: {
      complexity: {
        score: extractScore(assessment, 'complexity') || calculateComplexityScore(code),
        level: getComplexityLevel(code),
        details: 'Code complexity analysis',
      },
      maintainability: {
        score: extractScore(assessment, 'maintainability') || 75,
        level: 'good',
        details: 'Maintainability assessment',
      },
      testability: {
        score: extractScore(assessment, 'testability') || 80,
        coverage: tests ? calculateCoverage(tests, code) : 0,
        details: 'Testability evaluation',
      },
      security: metrics?.includes('security') ? {
        score: extractScore(assessment, 'security') || 70,
        vulnerabilities: extractVulnerabilities(assessment),
        details: 'Security analysis',
      } : undefined,
      performance: metrics?.includes('performance') ? {
        score: extractScore(assessment, 'performance') || 75,
        bottlenecks: extractBottlenecks(assessment),
        details: 'Performance analysis',
      } : undefined,
      documentation: metrics?.includes('documentation') ? {
        score: extractScore(assessment, 'documentation') || 60,
        coverage: calculateDocCoverage(code),
        details: 'Documentation analysis',
      } : undefined,
    },
    issues: extractIssues(assessment),
    recommendations: extractRecommendations(assessment),
  };
}

async function analyzeProjectForTesting(projectPath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`find ${projectPath} -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | head -20`);
    const files = stdout.trim().split('\n').filter(Boolean);
    
    return `Project contains ${files.length} source files:\n${files.join('\n')}`;
  } catch (error) {
    const err = error as Error;
    return `Unable to analyze project structure: ${err.message}`;
  }
}

async function parseTestSuite(testSuite: string, _projectPath: string): Promise<any[]> {
  return [{
    name: 'Generated Test Suite',
    description: 'Comprehensive test suite for the project',
    code: testSuite,
    type: 'unit',
    coverage: ['all'],
    dependencies: [],
  }];
}

// Helper functions

function extractImports(testCode: string, _language: string, _framework?: string): string[] {
  const imports = [];
  const lines = testCode.split('\n');
  
  for (const line of lines) {
    if (line.includes('import') || line.includes('require')) {
      imports.push(line.trim());
    }
  }
  
  return imports.slice(0, 10);
}

function extractMocks(testCode: string): string[] {
  const mocks = [];
  const mockPattern = /mock|jest\.mock|sinon|stub/gi;
  const lines = testCode.split('\n');
  
  for (const line of lines) {
    if (mockPattern.test(line)) {
      mocks.push(line.trim());
    }
  }
  
  return mocks.slice(0, 5);
}

function extractFixtures(_testCode: string): string[] {
  return ['// Test fixtures would be extracted here'];
}

function extractConfiguration(_testCode: string, framework?: string): string {
  return `// ${framework || 'Test'} configuration`;
}

function calculateTestMetrics(tests: any[], _sourceCode: string): any {
  return {
    estimatedCoverage: Math.min(95, tests.length * 15),
    testCount: tests.length,
    complexity: tests.length > 10 ? 'high' : tests.length > 5 ? 'medium' : 'low',
    executionTime: `${tests.length * 50}ms`,
  };
}

function generateTestRecommendations(_tests: any[], testType: string, coverage: string): string[] {
  const recommendations = [
    'Review generated tests for accuracy and completeness',
    'Add integration with CI/CD pipeline',
    'Consider adding performance benchmarks',
  ];
  
  if (testType === 'unit') {
    recommendations.push('Ensure proper mocking of dependencies');
  }
  
  if (coverage === 'comprehensive') {
    recommendations.push('Validate edge case coverage');
  }
  
  return recommendations;
}

function extractCoverage(_testBlock: string): string[] {
  return ['main-functionality'];
}

function extractDependencies(_testBlock: string, framework?: string): string[] {
  const deps = [];
  if (framework) {
    deps.push(framework);
  }
  return deps;
}

function extractScore(text: string, metric: string): number | null {
  const scoreRegex = new RegExp(`${metric}.*?\\b(\\d+)\\b`, 'i');
  const match = text.match(scoreRegex);
  return match ? parseInt(match[1]) : null;
}

function calculateGrade(score: number): string {
  if (score >= 90) {
    return 'A';
  }
  if (score >= 80) {
    return 'B';
  }
  if (score >= 70) {
    return 'C';
  }
  if (score >= 60) {
    return 'D';
  }
  return 'F';
}

function extractSummary(text: string): string {
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('summary') || line.toLowerCase().includes('overall')) {
      return line.trim();
    }
  }
  return '';
}

function extractIssues(_text: string): any[] {
  return [{
    type: 'suggestion',
    category: 'testing',
    severity: 'medium',
    message: 'Consider adding more edge case tests',
    recommendation: 'Add boundary value testing',
  }];
}

function extractRecommendations(_text: string): any[] {
  return [{
    priority: 'medium',
    category: 'testing',
    description: 'Improve test coverage',
    effort: 'medium',
    impact: 'high',
  }];
}

function calculateOverallScore(code: string, tests?: string): number {
  let score = 70; // Base score
  
  if (tests) {
    score += 15;
  } // Has tests
  if (code.includes('function') || code.includes('class')) {
    score += 10;
  } // Well structured
  
  return Math.min(100, score);
}

function calculateComplexityScore(code: string): number {
  const lines = code.split('\n').length;
  const complexity = Math.max(0, 100 - (lines * 0.1));
  return Math.round(complexity);
}

function getComplexityLevel(code: string): string {
  const lines = code.split('\n').length;
  if (lines > 500) {
    return 'very-high';
  }
  if (lines > 200) {
    return 'high';
  }
  if (lines > 100) {
    return 'medium';
  }
  return 'low';
}

function calculateCoverage(testCode: string, sourceCode?: string): number {
  if (!sourceCode) {
    return 0;
  }
  
  const testLines = testCode.split('\n').length;
  const sourceLines = sourceCode.split('\n').length;
  
  return Math.min(95, (testLines / sourceLines) * 50);
}

function extractVulnerabilities(_text: string): any[] {
  return [];
}

function extractBottlenecks(_text: string): string[] {
  return [];
}

function calculateDocCoverage(code: string): number {
  const lines = code.split('\n');
  const commentLines = lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('/*')).length;
  return Math.min(100, (commentLines / lines.length) * 100);
}

function calculateSuiteMetrics(tests: any[], coverageTarget: number): any {
  return {
    estimatedCoverage: Math.min(coverageTarget, tests.length * 20),
    testCount: tests.length,
    complexity: 'medium',
  };
}

function extractSuiteImports(testSuite: string, framework?: string): string[] {
  return extractImports(testSuite, 'javascript', framework);
}

function extractSuiteMocks(testSuite: string): string[] {
  return extractMocks(testSuite);
}

function extractSuiteFixtures(_testSuite: string): string[] {
  return ['// Suite fixtures'];
}

function generateTestConfiguration(framework?: string, _mockingLibrary?: string, coverageTarget?: number): string {
  return `// Test configuration for ${framework || 'standard'} with ${coverageTarget || 80}% coverage target`;
}

function generateSuiteRecommendations(_tests: any[], coverageTarget: number): string[] {
  return [
    'Review generated test suite for completeness',
    `Ensure ${coverageTarget}% coverage target is met`,
    'Integrate with continuous integration pipeline',
    'Consider adding visual regression tests',
  ];
}

async function formatTestData(testData: string, format: string): Promise<any> {
  try {
    if (format === 'json') {
      return JSON.parse(testData);
    }
    return testData;
  } catch (error) {
    return { raw: testData, error: 'Failed to parse generated data' };
  }
}