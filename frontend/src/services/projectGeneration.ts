import { apiClient } from './api';
import { API_BASE_URL, WS_URL } from '../config/environment';
import type { 
  ProjectCreationRequest,
  GeneratedProject,
  GenerationProgressEvent
} from './types';

// Project Generation service for creating projects
export const projectGenerationAPI = {
  // Start project generation
  generateProject: async (
    projectData: ProjectCreationRequest,
    options?: {
      includeTests?: boolean;
      includeDocs?: boolean;
      includeExamples?: boolean;
      optimizeForProduction?: boolean;
    }
  ): Promise<{
    generationId: string;
    estimatedTime: string;
    status: string;
  }> => {
    return apiClient.post<{
      generationId: string;
      estimatedTime: string;
      status: string;
    }>('/projectgeneration/generate', {
      projectData,
      options
    });
  },

  // Get generation status
  getGenerationStatus: async (generationId: string): Promise<{
    generationId: string;
    status: string;
    progress: number;
    message: string;
    result?: GeneratedProject;
    error?: string;
  }> => {
    return apiClient.get<{
      generationId: string;
      status: string;
      progress: number;
      message: string;
      result?: GeneratedProject;
      error?: string;
    }>(`/projectgeneration/status/${generationId}`);
  },

  // Get user's project generations
  getUserGenerations: async (
    userId: string,
    limit?: number,
    status?: string
  ): Promise<{
    generations: Array<{
      id: string;
      projectName: string;
      status: string;
      progress: number;
      createdAt: Date;
      completedAt?: Date;
    }>;
  }> => {
    const params: any = { limit, status };
    return apiClient.get<{
      generations: Array<{
        id: string;
        projectName: string;
        status: string;
        progress: number;
        createdAt: Date;
        completedAt?: Date;
      }>;
    }>(`/projectgeneration/user/${userId}`, params);
  },

  // Download generated project
  downloadProject: async (generationId: string): Promise<{
    downloadUrl: string;
    expiresAt: Date;
    files: Record<string, string>;
  }> => {
    return apiClient.get<{
      downloadUrl: string;
      expiresAt: Date;
      files: Record<string, string>;
    }>(`/projectgeneration/download/${generationId}`);
  },

  // Cancel ongoing generation
  cancelGeneration: async (generationId: string): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(`/projectgeneration/cancel/${generationId}`);
  }
};

// Real-time progress tracking with EventSource (Server-Sent Events)
export class ProjectGenerationTracker {
  private eventSource: EventSource | null = null;
  private progressCallback: ((event: GenerationProgressEvent) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;

  constructor(
    private generationId: string,
    private baseUrl: string = API_BASE_URL
  ) {}

  // Start tracking generation progress
  startTracking(
    onProgress: (event: GenerationProgressEvent) => void,
    onError?: (error: Error) => void
  ): void {
    this.progressCallback = onProgress;
    this.errorCallback = onError;

    // Create EventSource connection for real-time updates
    const url = `${this.baseUrl}/projectgeneration/progress/${this.generationId}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const progressEvent: GenerationProgressEvent = JSON.parse(event.data);
        this.progressCallback?.(progressEvent);
      } catch (error) {
        console.error('Error parsing progress event:', error);
        this.errorCallback?.(new Error('Failed to parse progress update'));
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      this.errorCallback?.(new Error('Connection error while tracking progress'));
    };

    this.eventSource.onopen = () => {
      console.log('Progress tracking started for generation:', this.generationId);
    };
  }

  // Stop tracking progress
  stopTracking(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.progressCallback = null;
    this.errorCallback = null;
  }

  // Check if currently tracking
  isTracking(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }
}

// WebSocket-based real-time tracking (alternative to EventSource)
export class ProjectGenerationWebSocketTracker {
  private websocket: WebSocket | null = null;
  private progressCallback: ((event: GenerationProgressEvent) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 2000;

  constructor(
    private generationId: string,
    private baseUrl: string = WS_URL
  ) {}

  // Start tracking with WebSocket
  startTracking(
    onProgress: (event: GenerationProgressEvent) => void,
    onError?: (error: Error) => void
  ): void {
    this.progressCallback = onProgress;
    this.errorCallback = onError;
    this.connect();
  }

  private connect(): void {
    const wsUrl = `${this.baseUrl}/ws/projectgeneration/progress/${this.generationId}`;
    
    try {
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('WebSocket connected for generation:', this.generationId);
        this.reconnectAttempts = 0;
      };

      this.websocket.onmessage = (event) => {
        try {
          const progressEvent: GenerationProgressEvent = JSON.parse(event.data);
          this.progressCallback?.(progressEvent);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.errorCallback?.(new Error('Failed to parse progress update'));
        }
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.errorCallback?.(new Error('WebSocket connection error'));
      };

      this.websocket.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
            this.connect();
          }, this.reconnectInterval);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.errorCallback?.(new Error('Failed to establish WebSocket connection'));
    }
  }

  // Stop tracking
  stopTracking(): void {
    if (this.websocket) {
      this.websocket.close(1000, 'Tracking stopped by user');
      this.websocket = null;
    }
    this.progressCallback = null;
    this.errorCallback = null;
    this.reconnectAttempts = 0;
  }

  // Check if currently tracking
  isTracking(): boolean {
    return this.websocket !== null && this.websocket.readyState === WebSocket.OPEN;
  }
}

export default projectGenerationAPI;