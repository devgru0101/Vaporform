import axios from 'axios';
import type { FileNode } from '@shared/types';
import { API_BASE_ALT } from '../config/environment';

const API_BASE = API_BASE_ALT;

export interface CreateFileRequest {
  path: string;
  content?: string;
  type: 'file' | 'directory';
}

export interface UpdateFileRequest {
  path: string;
  content: string;
}

export interface MoveFileRequest {
  fromPath: string;
  toPath: string;
}

export interface CopyFileRequest {
  fromPath: string;
  toPath: string;
}

export interface FileOperationResponse {
  success: boolean;
  message?: string;
  file?: FileNode;
}

export interface SearchFilesRequest {
  query: string;
  path?: string;
  includeContent?: boolean;
  fileTypes?: string[];
  maxResults?: number;
}

export interface SearchResult {
  file: FileNode;
  matches: Array<{
    line: number;
    content: string;
    column: number;
  }>;
}

class FilesService {
  private baseURL = `${API_BASE}/files`;

  private getAuthHeaders(token: string) {
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  // File System Operations
  async getFileTree(path: string = '/', token: string): Promise<FileNode> {
    const response = await axios.get(
      `${this.baseURL}/tree`,
      {
        params: { path },
        ...this.getAuthHeaders(token)
      }
    );
    return response.data.tree;
  }

  async readFile(path: string, token: string): Promise<{ content: string; encoding: string }> {
    const response = await axios.get(
      `${this.baseURL}/read`,
      {
        params: { path },
        ...this.getAuthHeaders(token)
      }
    );
    return response.data;
  }

  async writeFile(request: UpdateFileRequest, token: string): Promise<FileOperationResponse> {
    const response = await axios.post(
      `${this.baseURL}/write`,
      request,
      this.getAuthHeaders(token)
    );
    return response.data;
  }

  async createFile(request: CreateFileRequest, token: string): Promise<FileOperationResponse> {
    const response = await axios.post(
      `${this.baseURL}/create`,
      request,
      this.getAuthHeaders(token)
    );
    return response.data;
  }

  async deleteFile(path: string, token: string): Promise<FileOperationResponse> {
    const response = await axios.delete(
      `${this.baseURL}/delete`,
      {
        params: { path },
        ...this.getAuthHeaders(token)
      }
    );
    return response.data;
  }

  async moveFile(request: MoveFileRequest, token: string): Promise<FileOperationResponse> {
    const response = await axios.post(
      `${this.baseURL}/move`,
      request,
      this.getAuthHeaders(token)
    );
    return response.data;
  }

  async copyFile(request: CopyFileRequest, token: string): Promise<FileOperationResponse> {
    const response = await axios.post(
      `${this.baseURL}/copy`,
      request,
      this.getAuthHeaders(token)
    );
    return response.data;
  }

  async renameFile(oldPath: string, newPath: string, token: string): Promise<FileOperationResponse> {
    return this.moveFile({ fromPath: oldPath, toPath: newPath }, token);
  }

  // Search Operations
  async searchFiles(request: SearchFilesRequest, token: string): Promise<{ results: SearchResult[]; totalResults: number }> {
    const response = await axios.post(
      `${this.baseURL}/search`,
      request,
      this.getAuthHeaders(token)
    );
    return response.data;
  }

  async searchInFile(path: string, query: string, token: string): Promise<SearchResult> {
    const response = await axios.post(
      `${this.baseURL}/search-in-file`,
      { path, query },
      this.getAuthHeaders(token)
    );
    return response.data;
  }

  // File Information
  async getFileInfo(path: string, token: string): Promise<{
    path: string;
    name: string;
    type: 'file' | 'directory';
    size: number;
    modified: string;
    created: string;
    permissions: string;
    encoding?: string;
    mimeType?: string;
  }> {
    const response = await axios.get(
      `${this.baseURL}/info`,
      {
        params: { path },
        ...this.getAuthHeaders(token)
      }
    );
    return response.data.info;
  }

  async getDirectoryContents(path: string, token: string): Promise<FileNode[]> {
    const response = await axios.get(
      `${this.baseURL}/contents`,
      {
        params: { path },
        ...this.getAuthHeaders(token)
      }
    );
    return response.data.contents;
  }

  // File History and Versions
  async getFileHistory(path: string, token: string): Promise<Array<{
    id: string;
    path: string;
    content: string;
    timestamp: string;
    size: number;
    checksum: string;
  }>> {
    const response = await axios.get(
      `${this.baseURL}/history`,
      {
        params: { path },
        ...this.getAuthHeaders(token)
      }
    );
    return response.data.history;
  }

  async restoreFileVersion(path: string, versionId: string, token: string): Promise<FileOperationResponse> {
    const response = await axios.post(
      `${this.baseURL}/restore`,
      { path, versionId },
      this.getAuthHeaders(token)
    );
    return response.data;
  }

  // Batch Operations
  async batchOperation(operations: Array<{
    type: 'create' | 'update' | 'delete' | 'move' | 'copy';
    path: string;
    targetPath?: string;
    content?: string;
  }>, token: string): Promise<{
    results: FileOperationResponse[];
    successful: number;
    failed: number;
  }> {
    const response = await axios.post(
      `${this.baseURL}/batch`,
      { operations },
      this.getAuthHeaders(token)
    );
    return response.data;
  }

  // File Watching (WebSocket-based)
  watchFiles(paths: string[], token: string): WebSocket {
    const wsUrl = `${this.baseURL.replace('http', 'ws')}/watch?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'watch', paths }));
    };
    
    return ws;
  }

  // File Upload/Download
  async uploadFile(file: File, targetPath: string, token: string): Promise<FileOperationResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', targetPath);
    
    const response = await axios.post(
      `${this.baseURL}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  }

  async downloadFile(path: string, token: string): Promise<Blob> {
    const response = await axios.get(
      `${this.baseURL}/download`,
      {
        params: { path },
        responseType: 'blob',
        ...this.getAuthHeaders(token)
      }
    );
    return response.data;
  }

  // Template Operations
  async createFromTemplate(templateName: string, targetPath: string, variables: Record<string, any>, token: string): Promise<FileOperationResponse> {
    const response = await axios.post(
      `${this.baseURL}/create-from-template`,
      { templateName, targetPath, variables },
      this.getAuthHeaders(token)
    );
    return response.data;
  }

  async getAvailableTemplates(token: string): Promise<Array<{
    name: string;
    description: string;
    variables: Array<{
      name: string;
      type: string;
      description: string;
      default?: any;
      required: boolean;
    }>;
  }>> {
    const response = await axios.get(
      `${this.baseURL}/templates`,
      this.getAuthHeaders(token)
    );
    return response.data.templates;
  }
}

export const filesService = new FilesService();

// Hook for using files service
export const useFilesService = () => {
  return filesService;
};