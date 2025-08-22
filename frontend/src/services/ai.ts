import axios from 'axios';
import type { AiMessage } from '@/store/ai';
import { API_BASE_ALT } from '../config/environment';

const API_BASE = API_BASE_ALT;

interface SendMessageRequest {
  conversationId: string;
  message: string;
  context?: string[];
  settings: {
    model: string;
    temperature: number;
    maxTokens: number;
    contextWindow: number;
    enableCodeGeneration: boolean;
    enableFileContext: boolean;
    enableProjectContext: boolean;
  };
}

interface SendMessageResponse {
  content: string;
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

interface CodeGenerationRequest {
  prompt: string;
  language: string;
  context?: string[];
  filePath?: string;
}

interface CodeAnalysisRequest {
  code: string;
  language: string;
  analysisType: 'bugs' | 'performance' | 'security' | 'style' | 'documentation';
}

interface CodeSuggestion {
  id: string;
  type: 'code' | 'fix' | 'optimize' | 'test' | 'document';
  title: string;
  description: string;
  filePath?: string;
  lineRange?: { start: number; end: number };
  code?: string;
  confidence: number;
}

class AiService {
  private baseURL = `${API_BASE}/api/ai`;

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const token = localStorage.getItem('vaporform_token');
    const response = await axios.post(`${this.baseURL}/chat`, request, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async generateCode(request: CodeGenerationRequest): Promise<{ code: string; explanation: string }> {
    const token = localStorage.getItem('vaporform_token');
    const response = await axios.post(`${this.baseURL}/generate-code`, request, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async analyzeCode(request: CodeAnalysisRequest): Promise<{
    issues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      message: string;
      lineNumber?: number;
      suggestion?: string;
    }>;
    summary: string;
  }> {
    const token = localStorage.getItem('vaporform_token');
    const response = await axios.post(`${this.baseURL}/analyze-code`, request, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getSuggestions(filePath: string, context?: string[]): Promise<CodeSuggestion[]> {
    const token = localStorage.getItem('vaporform_token');
    const response = await axios.get(`${this.baseURL}/suggestions`, {
      params: { filePath, context: context?.join(',') },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.suggestions;
  }

  async explainCode(code: string, language: string): Promise<{
    explanation: string;
    complexity: 'low' | 'medium' | 'high';
    keypoints: string[];
  }> {
    const token = localStorage.getItem('vaporform_token');
    const response = await axios.post(`${this.baseURL}/explain-code`, {
      code,
      language
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async generateTests(code: string, language: string, framework?: string): Promise<{
    tests: string;
    coverage: string[];
    explanation: string;
  }> {
    const token = localStorage.getItem('vaporform_token');
    const response = await axios.post(`${this.baseURL}/generate-tests`, {
      code,
      language,
      framework
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async refactorCode(code: string, language: string, instructions: string): Promise<{
    refactoredCode: string;
    changes: Array<{
      type: string;
      description: string;
      lineNumber?: number;
    }>;
    explanation: string;
  }> {
    const token = localStorage.getItem('vaporform_token');
    const response = await axios.post(`${this.baseURL}/refactor-code`, {
      code,
      language,
      instructions
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getDocumentation(code: string, language: string, style?: string): Promise<{
    documentation: string;
    format: 'markdown' | 'jsdoc' | 'sphinx' | 'javadoc';
  }> {
    const token = localStorage.getItem('vaporform_token');
    const response = await axios.post(`${this.baseURL}/generate-docs`, {
      code,
      language,
      style
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getUsageStats(): Promise<{
    tokensUsed: number;
    requestsCount: number;
    monthlyLimit: number;
    resetDate: string;
  }> {
    const token = localStorage.getItem('vaporform_token');
    const response = await axios.get(`${this.baseURL}/usage`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  // Streaming support for real-time responses
  async streamMessage(
    request: SendMessageRequest,
    onChunk: (chunk: string) => void,
    onComplete: (response: SendMessageResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const token = localStorage.getItem('vaporform_token');
    
    try {
      const response = await fetch(`${this.baseURL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No readable stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let finalResponse: SendMessageResponse | null = null;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              if (finalResponse) {
                onComplete(finalResponse);
              }
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'chunk') {
                onChunk(parsed.content);
              } else if (parsed.type === 'complete') {
                finalResponse = parsed.response;
              }
            } catch (e) {
              console.warn('Failed to parse streaming data:', data);
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  }
}

export const aiService = new AiService();

// Hook for using AI service
export const useAiService = () => {
  return aiService;
};