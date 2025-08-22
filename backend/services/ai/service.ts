import { api } from "encore.dev/api";

// Interfaces
interface ChatRequest {
  message: string;
  context?: string;
  sessionId?: string;
}

interface ChatResponse {
  response: string;
  sessionId: string;
  timestamp: string;
}

interface ProjectAnalysisRequest {
  projectDescription: string;
  requirements: string[];
}

interface ProjectAnalysisResponse {
  analysis: {
    complexity: 'low' | 'medium' | 'high';
    estimatedTime: string;
    recommendedTechStack: {
      frontend: string[];
      backend: string[];
      database: string[];
    };
    suggestedFeatures: string[];
    risks: string[];
  };
}

interface CodeGenerationRequest {
  prompt: string;
  language: string;
  framework?: string;
}

interface CodeGenerationResponse {
  code: string;
  explanation: string;
  files: Array<{
    name: string;
    content: string;
    type: string;
  }>;
}

// API Endpoints
export const chat = api(
  { method: "POST", path: "/ai/chat" },
  async (req: ChatRequest): Promise<ChatResponse> => {
    const sessionId = req.sessionId || "session-" + Date.now();
    
    // Mock AI response
    const responses = [
      "I'd be happy to help you with that! Let me analyze your request and provide some suggestions.",
      "That's an interesting project idea! Here are some recommendations based on your requirements.",
      "I can definitely assist with that development task. Let me break it down for you.",
      "Great question! Based on current best practices, I'd suggest the following approach."
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      response: response + " " + req.message,
      sessionId,
      timestamp: new Date().toISOString()
    };
  }
);

export const analyzeProject = api(
  { method: "POST", path: "/ai/analyze" },
  async (req: ProjectAnalysisRequest): Promise<ProjectAnalysisResponse> => {
    // Mock analysis based on description complexity
    const wordCount = req.projectDescription.split(' ').length;
    const complexity = wordCount > 50 ? 'high' : wordCount > 20 ? 'medium' : 'low';
    
    const techStacks = {
      low: {
        frontend: ['React', 'HTML/CSS'],
        backend: ['Node.js', 'Express'],
        database: ['SQLite']
      },
      medium: {
        frontend: ['React', 'TypeScript', 'Tailwind CSS'],
        backend: ['Node.js', 'Express', 'TypeScript'],
        database: ['PostgreSQL']
      },
      high: {
        frontend: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
        backend: ['Node.js', 'TypeScript', 'Microservices'],
        database: ['PostgreSQL', 'Redis']
      }
    };
    
    return {
      analysis: {
        complexity,
        estimatedTime: complexity === 'high' ? '3-6 months' : complexity === 'medium' ? '1-3 months' : '2-6 weeks',
        recommendedTechStack: techStacks[complexity],
        suggestedFeatures: [
          'User authentication',
          'Dashboard interface',
          'Data visualization',
          'API integration',
          'Mobile responsiveness'
        ],
        risks: [
          'Technical complexity',
          'Timeline estimation',
          'Third-party dependencies',
          'Scalability considerations'
        ]
      }
    };
  }
);

export const generateCode = api(
  { method: "POST", path: "/ai/generate" },
  async (req: CodeGenerationRequest): Promise<CodeGenerationResponse> => {
    // Mock code generation
    const templates = {
      javascript: `// Generated ${req.language} code
function ${req.prompt.replace(/\s+/g, '')}() {
  console.log('Hello from AI-generated code!');
  // TODO: Implement ${req.prompt}
  return true;
}`,
      typescript: `// Generated ${req.language} code
interface ${req.prompt.replace(/\s+/g, '')}Interface {
  id: string;
  name: string;
}

export function ${req.prompt.replace(/\s+/g, '')}(): ${req.prompt.replace(/\s+/g, '')}Interface {
  // TODO: Implement ${req.prompt}
  return {
    id: 'generated-id',
    name: 'Generated Name'
  };
}`,
      react: `// Generated React component
import React from 'react';

interface ${req.prompt.replace(/\s+/g, '')}Props {
  // Add your props here
}

export const ${req.prompt.replace(/\s+/g, '')}: React.FC<${req.prompt.replace(/\s+/g, '')}Props> = () => {
  return (
    <div>
      <h1>${req.prompt}</h1>
      {/* TODO: Implement component logic */}
    </div>
  );
};`
    };
    
    const code = templates[req.language as keyof typeof templates] || templates.javascript;
    
    return {
      code,
      explanation: `This is a generated ${req.language} implementation for: ${req.prompt}`,
      files: [
        {
          name: `${req.prompt.replace(/\s+/g, '')}.${req.language === 'typescript' ? 'ts' : req.language === 'react' ? 'tsx' : 'js'}`,
          content: code,
          type: req.language
        }
      ]
    };
  }
);

export const getSuggestions = api(
  { method: "GET", path: "/ai/suggestions" },
  async (): Promise<{ suggestions: string[] }> => {
    return {
      suggestions: [
        "Create a React dashboard component",
        "Set up user authentication system",
        "Build a REST API with Express",
        "Implement data validation",
        "Add responsive design",
        "Create database models",
        "Set up testing framework",
        "Configure deployment pipeline"
      ]
    };
  }
);