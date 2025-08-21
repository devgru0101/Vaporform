import { api, APIError } from "encore.dev/api";
import log from "encore.dev/log";
import { AuthData } from "../auth/auth";

// Import service definition
import "./encore.service";

// File interface
export interface File {
  id: string;
  name: string;
  path: string;
  content: string;
  size: number;
  type: string;
  projectId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response interfaces (pure TypeScript - no Zod)
interface UploadFileRequest {
  name: string;
  path: string;
  content: string;
  type: string;
  projectId: string;
}

interface UpdateFileRequest {
  name?: string;
  path?: string;
  content?: string;
  type?: string;
}

interface FileResponse {
  id: string;
  name: string;
  path: string;
  content: string;
  size: number;
  type: string;
  projectId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FileListResponse {
  files: FileResponse[];
}

// Validation functions (replacing Zod)
function validateUploadFileRequest(req: UploadFileRequest): void {
  if (!req.name || req.name.trim().length === 0) {
    throw APIError.invalidArgument("File name is required");
  }
  
  if (!req.path || req.path.trim().length === 0) {
    throw APIError.invalidArgument("File path is required");
  }
  
  if (req.content === undefined) {
    throw APIError.invalidArgument("File content is required");
  }
  
  if (!req.type || req.type.trim().length === 0) {
    throw APIError.invalidArgument("File type is required");
  }
  
  if (!req.projectId || req.projectId.trim().length === 0) {
    throw APIError.invalidArgument("Project ID is required");
  }
}

function validateUpdateFileRequest(req: UpdateFileRequest): void {
  if (req.name !== undefined && req.name.trim().length === 0) {
    throw APIError.invalidArgument("File name cannot be empty");
  }
  
  if (req.path !== undefined && req.path.trim().length === 0) {
    throw APIError.invalidArgument("File path cannot be empty");
  }
  
  if (req.type !== undefined && req.type.trim().length === 0) {
    throw APIError.invalidArgument("File type cannot be empty");
  }
}

// Mock file storage (replace with database)
const files: Map<string, File> = new Map();

// Seed with demo files
const demoFiles: File[] = [
  {
    id: "file-1",
    name: "App.tsx",
    path: "src/components/App.tsx",
    content: `import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Welcome to Vaporform</h1>
    </div>
  );
}

export default App;`,
    size: 150,
    type: "typescript",
    projectId: "demo-project-1",
    userId: "demo-user-id",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "file-2",
    name: "package.json",
    path: "package.json",
    content: `{
  "name": "vaporform-demo",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.0.0"
  }
}`,
    size: 120,
    type: "json",
    projectId: "demo-project-1",
    userId: "demo-user-id",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
];

demoFiles.forEach(file => {
  files.set(file.id, file);
});

// Upload/create a new file
export const upload = api(
  { method: "POST", path: "/files/upload", expose: true },
  async ({ name, path, content, type, projectId }: UploadFileRequest): Promise<FileResponse> => {
    // For testing - mock user ID
    const mockUserID = "demo-user-id";
    
    log.info("File upload request", { name, path, projectId, userID: mockUserID });

    // Validation
    validateUploadFileRequest({ name, path, content, type, projectId });

    const newFile: File = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      path: path.trim(),
      content,
      size: content.length,
      type: type.trim(),
      projectId: projectId.trim(),
      userId: mockUserID,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    files.set(newFile.id, newFile);

    log.info("File uploaded", { fileId: newFile.id, userID: mockUserID });

    return {
      id: newFile.id,
      name: newFile.name,
      path: newFile.path,
      content: newFile.content,
      size: newFile.size,
      type: newFile.type,
      projectId: newFile.projectId,
      userId: newFile.userId,
      createdAt: newFile.createdAt,
      updatedAt: newFile.updatedAt,
    };
  }
);

// Get a specific file
export const get = api(
  { method: "GET", path: "/files/:id", expose: true },
  async ({ id }: { id: string }): Promise<FileResponse> => {
    // For testing - mock user ID
    const mockUserID = "demo-user-id";
    
    log.info("Get file request", { fileId: id, userID: mockUserID });

    const file = files.get(id);
    if (!file) {
      throw APIError.notFound("File not found");
    }

    // Check if user owns the file
    if (file.userId !== mockUserID) {
      throw APIError.permissionDenied("Access denied");
    }

    return {
      id: file.id,
      name: file.name,
      path: file.path,
      content: file.content,
      size: file.size,
      type: file.type,
      projectId: file.projectId,
      userId: file.userId,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }
);

// Update a file
export const update = api(
  { method: "PUT", path: "/files/:id", expose: true },
  async ({ id, ...updates }: { id: string } & UpdateFileRequest): Promise<FileResponse> => {
    // For testing - mock user ID
    const mockUserID = "demo-user-id";
    
    log.info("Update file request", { fileId: id, userID: mockUserID });

    // Validation
    validateUpdateFileRequest(updates);

    const file = files.get(id);
    if (!file) {
      throw APIError.notFound("File not found");
    }

    // Check if user owns the file
    if (file.userId !== mockUserID) {
      throw APIError.permissionDenied("Access denied");
    }

    // Clean and prepare updates
    const cleanUpdates: Partial<File> = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
    if (updates.path !== undefined) cleanUpdates.path = updates.path.trim();
    if (updates.content !== undefined) cleanUpdates.content = updates.content;
    if (updates.type !== undefined) cleanUpdates.type = updates.type.trim();

    // Update file fields
    const updatedFile: File = {
      ...file,
      ...cleanUpdates,
      size: updates.content !== undefined ? updates.content.length : file.size,
      updatedAt: new Date(),
    };

    files.set(id, updatedFile);

    log.info("File updated", { fileId: id, userID: mockUserID });

    return {
      id: updatedFile.id,
      name: updatedFile.name,
      path: updatedFile.path,
      content: updatedFile.content,
      size: updatedFile.size,
      type: updatedFile.type,
      projectId: updatedFile.projectId,
      userId: updatedFile.userId,
      createdAt: updatedFile.createdAt,
      updatedAt: updatedFile.updatedAt,
    };
  }
);

// Delete a file
export const remove = api(
  { method: "DELETE", path: "/files/:id", expose: true },
  async ({ id }: { id: string }): Promise<{ success: boolean }> => {
    // For testing - mock user ID
    const mockUserID = "demo-user-id";
    
    log.info("Delete file request", { fileId: id, userID: mockUserID });

    const file = files.get(id);
    if (!file) {
      throw APIError.notFound("File not found");
    }

    // Check if user owns the file
    if (file.userId !== mockUserID) {
      throw APIError.permissionDenied("Access denied");
    }

    files.delete(id);

    log.info("File deleted", { fileId: id, userID: mockUserID });

    return { success: true };
  }
);

// List files by project
export const listByProject = api(
  { method: "GET", path: "/files/project/:projectId", expose: true },
  async ({ projectId }: { projectId: string }): Promise<FileListResponse> => {
    // For testing - mock user ID
    const mockUserID = "demo-user-id";
    
    log.info("List files by project request", { projectId, userID: mockUserID });

    const projectFiles = Array.from(files.values())
      .filter(f => f.projectId === projectId && f.userId === mockUserID)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const fileList = projectFiles.map(file => ({
      id: file.id,
      name: file.name,
      path: file.path,
      content: file.content,
      size: file.size,
      type: file.type,
      projectId: file.projectId,
      userId: file.userId,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    }));

    return { files: fileList };
  }
);