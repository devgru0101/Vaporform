import { apiClient } from './api';
import type { 
  ProjectAnalysis, 
  ProjectVisionData, 
  AnalyzeVisionRequest,
  RecommendStackRequest
} from './types';

// Project Analysis service for analyzing project requirements
export const projectAnalysisAPI = {
  // Analyze project vision and requirements
  analyzeVision: async (vision: ProjectVisionData, userId: string): Promise<ProjectAnalysis> => {
    const request: AnalyzeVisionRequest = {
      vision,
      userId
    };
    return apiClient.post<ProjectAnalysis>('/projectanalysis/analyze-vision', request);
  },

  // Get technology stack recommendations based on analysis
  recommendStack: async (
    vision: ProjectVisionData, 
    analysis: ProjectAnalysis, 
    userId: string
  ): Promise<any> => {
    const request: RecommendStackRequest = {
      vision,
      analysis,
      userId
    };
    return apiClient.post('/projectanalysis/recommend-stack', request);
  },

  // Get a specific analysis by ID
  getAnalysis: async (analysisId: string): Promise<ProjectAnalysis> => {
    return apiClient.get<ProjectAnalysis>(`/projectanalysis/${analysisId}`);
  },

  // Get all analyses for a user
  getUserAnalyses: async (userId: string): Promise<{ analyses: ProjectAnalysis[] }> => {
    return apiClient.get<{ analyses: ProjectAnalysis[] }>(`/projectanalysis/user/${userId}`);
  },

  // Validate project requirements
  validateRequirements: async (requirements: any): Promise<{ valid: boolean; errors: string[] }> => {
    return apiClient.post<{ valid: boolean; errors: string[] }>('/projectanalysis/validate', {
      requirements
    });
  },

  // Get complexity estimation
  estimateComplexity: async (vision: ProjectVisionData): Promise<{ complexity: number; factors: string[] }> => {
    return apiClient.post<{ complexity: number; factors: string[] }>('/projectanalysis/complexity', {
      vision
    });
  },

  // Get timeline estimation
  estimateTimeline: async (vision: ProjectVisionData, complexity: number): Promise<{ timeline: string; breakdown: any }> => {
    return apiClient.post<{ timeline: string; breakdown: any }>('/projectanalysis/timeline', {
      vision,
      complexity
    });
  }
};

export default projectAnalysisAPI;