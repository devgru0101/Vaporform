import { api } from "encore.dev/api";

// Interfaces
interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  mimeType?: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

interface ListFilesRequest {
  path?: string;
  projectId?: string;
}

interface CreateFileRequest {
  name: string;
  path: string;
  content: string;
  projectId?: string;
}

interface UpdateFileRequest {
  id: string;
  content: string;
}

interface DeleteFileRequest {
  id: string;
}

// Mock file system data
const mockFiles: FileItem[] = [
  {
    id: 'file-1',
    name: 'README.md',
    path: '/README.md',
    type: 'file',
    size: 1024,
    mimeType: 'text/markdown',
    content: '# Project README\n\nThis is a sample project.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dir-1',
    name: 'src',
    path: '/src',
    type: 'directory',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'file-2',
    name: 'index.ts',
    path: '/src/index.ts',
    type: 'file',
    size: 512,
    mimeType: 'text/typescript',
    content: 'console.log("Hello World!");',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// API Endpoints
export const listFiles = api(
  { method: "GET", path: "/files" },
  async (req: ListFilesRequest): Promise<{ files: FileItem[] }> => {
    const path = req.path || '/';
    
    // Filter files by path
    const filteredFiles = mockFiles.filter(file => {
      if (path === '/') {
        return file.path.split('/').length === 2; // Root level files
      }
      return file.path.startsWith(path);
    });
    
    return { files: filteredFiles };
  }
);

export const getFile = api(
  { method: "GET", path: "/files/:id" },
  async ({ id }: { id: string }): Promise<FileItem> => {
    const file = mockFiles.find(f => f.id === id);
    if (!file) {
      throw new Error("File not found");
    }
    return file;
  }
);

export const createFile = api(
  { method: "POST", path: "/files" },
  async (req: CreateFileRequest): Promise<FileItem> => {
    const fileId = "file-" + Date.now();
    const now = new Date().toISOString();
    
    const newFile: FileItem = {
      id: fileId,
      name: req.name,
      path: req.path,
      type: 'file',
      size: req.content.length,
      mimeType: getMimeType(req.name),
      content: req.content,
      createdAt: now,
      updatedAt: now
    };
    
    mockFiles.push(newFile);
    return newFile;
  }
);

export const updateFile = api(
  { method: "PUT", path: "/files/:id" },
  async ({ id, ...req }: { id: string } & UpdateFileRequest): Promise<FileItem> => {
    const fileIndex = mockFiles.findIndex(f => f.id === id);
    if (fileIndex === -1) {
      throw new Error("File not found");
    }
    
    mockFiles[fileIndex] = {
      ...mockFiles[fileIndex],
      content: req.content,
      size: req.content.length,
      updatedAt: new Date().toISOString()
    };
    
    return mockFiles[fileIndex];
  }
);

export const deleteFile = api(
  { method: "DELETE", path: "/files/:id" },
  async ({ id }: { id: string }): Promise<{ success: boolean }> => {
    const fileIndex = mockFiles.findIndex(f => f.id === id);
    if (fileIndex === -1) {
      throw new Error("File not found");
    }
    
    mockFiles.splice(fileIndex, 1);
    return { success: true };
  }
);

export const createDirectory = api(
  { method: "POST", path: "/files/directory" },
  async (req: { name: string; path: string; projectId?: string }): Promise<FileItem> => {
    const dirId = "dir-" + Date.now();
    const now = new Date().toISOString();
    
    const newDir: FileItem = {
      id: dirId,
      name: req.name,
      path: req.path,
      type: 'directory',
      createdAt: now,
      updatedAt: now
    };
    
    mockFiles.push(newDir);
    return newDir;
  }
);

export const searchFiles = api(
  { method: "GET", path: "/files/search" },
  async ({ query }: { query: string }): Promise<{ files: FileItem[] }> => {
    const results = mockFiles.filter(file =>
      file.name.toLowerCase().includes(query.toLowerCase()) ||
      (file.content && file.content.toLowerCase().includes(query.toLowerCase()))
    );
    
    return { files: results };
  }
);

// Helper function
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'js': 'text/javascript',
    'ts': 'text/typescript',
    'jsx': 'text/javascript',
    'tsx': 'text/typescript',
    'json': 'application/json',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'css': 'text/css',
    'html': 'text/html',
    'py': 'text/x-python',
    'java': 'text/x-java',
    'cpp': 'text/x-c++src',
    'c': 'text/x-csrc'
  };
  
  return mimeTypes[ext || ''] || 'text/plain';
}