import { api, APICallMeta } from "encore.dev/api";
import log from "encore.dev/log";
import { z } from "zod";
import { AuthData } from "./auth";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import { Readable } from "stream";

// File system interfaces
export interface VirtualFile {
  id: string;
  projectId: string;
  path: string;
  name: string;
  type: "file" | "directory";
  size: number;
  mimeType?: string;
  content?: string;
  binaryContent?: Buffer;
  hash: string;
  permissions: FilePermissions;
  metadata: FileMetadata;
  versions: FileVersion[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export interface FilePermissions {
  owner: string;
  group?: string;
  mode: number; // Unix-style permissions
  readable: boolean;
  writable: boolean;
  executable: boolean;
}

export interface FileMetadata {
  encoding?: string;
  language?: string;
  lineCount?: number;
  isHidden: boolean;
  isBinary: boolean;
  isSymlink: boolean;
  symlinkTarget?: string;
  gitStatus?: "untracked" | "modified" | "added" | "deleted" | "renamed" | "clean";
  tags: string[];
  annotations: FileAnnotation[];
}

export interface FileAnnotation {
  id: string;
  line: number;
  column: number;
  type: "comment" | "todo" | "error" | "warning" | "info";
  content: string;
  author: string;
  createdAt: Date;
}

export interface FileVersion {
  id: string;
  version: number;
  content: string;
  hash: string;
  size: number;
  message?: string;
  createdAt: Date;
  createdBy: string;
}

export interface FileDiff {
  oldFile: Partial<VirtualFile>;
  newFile: Partial<VirtualFile>;
  changes: FileDiffChange[];
}

export interface FileDiffChange {
  type: "add" | "delete" | "modify";
  line: number;
  oldContent?: string;
  newContent?: string;
}

export interface FileSearchResult {
  file: VirtualFile;
  matches: FileMatch[];
  score: number;
}

export interface FileMatch {
  line: number;
  column: number;
  content: string;
  matchedText: string;
}

// Request/Response schemas
const CreateFileRequest = z.object({
  projectId: z.string(),
  path: z.string(),
  name: z.string(),
  type: z.enum(["file", "directory"]).default("file"),
  content: z.string().optional(),
  encoding: z.string().default("utf-8"),
  permissions: z.object({
    mode: z.number().default(0o644),
    readable: z.boolean().default(true),
    writable: z.boolean().default(true),
    executable: z.boolean().default(false),
  }).default({}),
});

const UpdateFileRequest = z.object({
  content: z.string().optional(),
  name: z.string().optional(),
  path: z.string().optional(),
  permissions: z.object({
    mode: z.number(),
    readable: z.boolean(),
    writable: z.boolean(),
    executable: z.boolean(),
  }).optional(),
  message: z.string().optional(),
});

const SearchFilesRequest = z.object({
  projectId: z.string(),
  query: z.string(),
  type: z.enum(["content", "filename", "both"]).default("both"),
  fileTypes: z.array(z.string()).optional(),
  maxResults: z.number().min(1).max(100).default(20),
  caseSensitive: z.boolean().default(false),
  useRegex: z.boolean().default(false),
});

const FileOperationRequest = z.object({
  operation: z.enum(["copy", "move", "rename"]),
  destination: z.string(),
  newName: z.string().optional(),
});

const FileResponse = z.object({
  id: z.string(),
  projectId: z.string(),
  path: z.string(),
  name: z.string(),
  type: z.enum(["file", "directory"]),
  size: z.number(),
  mimeType: z.string().optional(),
  hash: z.string(),
  permissions: z.object({
    owner: z.string(),
    mode: z.number(),
    readable: z.boolean(),
    writable: z.boolean(),
    executable: z.boolean(),
  }),
  metadata: z.object({
    encoding: z.string().optional(),
    language: z.string().optional(),
    lineCount: z.number().optional(),
    isHidden: z.boolean(),
    isBinary: z.boolean(),
    gitStatus: z.enum(["untracked", "modified", "added", "deleted", "renamed", "clean"]).optional(),
    tags: z.array(z.string()),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastModifiedBy: z.string(),
});

// Mock file storage (replace with database and file system)
const files: Map<string, VirtualFile> = new Map();
const projectFileTrees: Map<string, Set<string>> = new Map();

// Base directory for project files
const BASE_PROJECTS_DIR = process.env.VAPORFORM_PROJECTS_DIR || "/tmp/vaporform/projects";

// Helper functions
function generateFileHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function detectMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.jsx': 'application/javascript',
    '.tsx': 'application/typescript',
    '.html': 'text/html',
    '.css': 'text/css',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.py': 'text/x-python',
    '.java': 'text/x-java-source',
    '.cpp': 'text/x-c++src',
    '.c': 'text/x-csrc',
    '.go': 'text/x-go',
    '.rs': 'text/x-rust',
    '.php': 'application/x-httpd-php',
    '.xml': 'application/xml',
    '.yaml': 'application/x-yaml',
    '.yml': 'application/x-yaml',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function detectLanguage(filename: string): string | undefined {
  const ext = path.extname(filename).toLowerCase();
  const languages: Record<string, string> = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.go': 'go',
    '.rs': 'rust',
    '.php': 'php',
    '.rb': 'ruby',
    '.sh': 'bash',
    '.sql': 'sql',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
  };
  return languages[ext];
}

function getProjectFilePath(projectId: string, filePath: string): string {
  return path.join(BASE_PROJECTS_DIR, projectId, filePath);
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if ((error as any).code !== 'EEXIST') {
      throw error;
    }
  }
}

// Create file endpoint
export const createFile = api<typeof CreateFileRequest, typeof FileResponse>(
  { method: "POST", path: "/files", auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<z.infer<typeof FileResponse>> => {
    const { userID } = meta.auth;
    const { projectId, path: filePath, name, type, content = "", encoding, permissions } = req;
    
    log.info("Creating file", { projectId, filePath, name, type, userID });
    
    const fileId = uuidv4();
    const now = new Date();
    const fullPath = path.join(filePath, name);
    const physicalPath = getProjectFilePath(projectId, fullPath);
    
    // Ensure parent directory exists
    await ensureDirectoryExists(path.dirname(physicalPath));
    
    const hash = generateFileHash(content);
    const mimeType = type === "file" ? detectMimeType(name) : undefined;
    const language = type === "file" ? detectLanguage(name) : undefined;
    
    const file: VirtualFile = {
      id: fileId,
      projectId,
      path: fullPath,
      name,
      type,
      size: content.length,
      mimeType,
      content: type === "file" ? content : undefined,
      hash,
      permissions: {
        owner: userID,
        mode: permissions.mode,
        readable: permissions.readable,
        writable: permissions.writable,
        executable: permissions.executable,
      },
      metadata: {
        encoding: type === "file" ? encoding : undefined,
        language,
        lineCount: type === "file" ? content.split('\n').length : undefined,
        isHidden: name.startsWith('.'),
        isBinary: false, // TODO: Detect binary files
        isSymlink: false,
        gitStatus: "untracked",
        tags: [],
        annotations: [],
      },
      versions: [{
        id: uuidv4(),
        version: 1,
        content,
        hash,
        size: content.length,
        message: "Initial version",
        createdAt: now,
        createdBy: userID,
      }],
      createdAt: now,
      updatedAt: now,
      createdBy: userID,
      lastModifiedBy: userID,
    };
    
    try {
      // Write to physical file system
      if (type === "file") {
        await fs.writeFile(physicalPath, content, encoding as BufferEncoding);
      } else {
        await fs.mkdir(physicalPath, { recursive: true });
      }
      
      // Store in virtual file system
      files.set(fileId, file);
      
      // Update project file tree
      if (!projectFileTrees.has(projectId)) {
        projectFileTrees.set(projectId, new Set());
      }
      projectFileTrees.get(projectId)!.add(fileId);
      
      log.info("File created successfully", { fileId, fullPath, size: file.size });
      
      return file;
      
    } catch (error) {
      log.error("File creation failed", { 
        error: error.message, 
        fileId, 
        fullPath 
      });
      
      throw new Error(`Failed to create file: ${error.message}`);
    }
  }
);

// Get file endpoint
export const getFile = api(
  { method: "GET", path: "/files/:id", auth: true, expose: true },
  async (req: { id: string; includeContent?: boolean }, meta: APICallMeta<AuthData>): Promise<VirtualFile> => {
    const { userID } = meta.auth;
    const { id, includeContent = false } = req;
    
    const file = files.get(id);
    if (!file) {
      throw new Error("File not found");
    }
    
    // TODO: Add permission check
    
    if (includeContent && file.type === "file") {
      try {
        const physicalPath = getProjectFilePath(file.projectId, file.path);
        const content = await fs.readFile(physicalPath, file.metadata.encoding as BufferEncoding || 'utf-8');
        file.content = content;
      } catch (error) {
        log.warn("Failed to read file content from disk", { 
          error: error.message, 
          fileId: id 
        });
      }
    }
    
    return file;
  }
);

// Update file endpoint
export const updateFile = api<typeof UpdateFileRequest, typeof FileResponse>(
  { method: "PUT", path: "/files/:id", auth: true, expose: true },
  async (req: z.infer<typeof UpdateFileRequest> & { id: string }, meta: APICallMeta<AuthData>): Promise<z.infer<typeof FileResponse>> => {
    const { userID } = meta.auth;
    const { id, content, name, path: newPath, permissions, message } = req;
    
    const file = files.get(id);
    if (!file) {
      throw new Error("File not found");
    }
    
    // TODO: Add permission check
    
    const now = new Date();
    let needsPhysicalUpdate = false;
    let oldPhysicalPath: string | undefined;
    let newPhysicalPath: string | undefined;
    
    // Handle content updates
    if (content !== undefined && file.type === "file") {
      const newHash = generateFileHash(content);
      
      if (newHash !== file.hash) {
        // Create new version
        const newVersion: FileVersion = {
          id: uuidv4(),
          version: file.versions.length + 1,
          content,
          hash: newHash,
          size: content.length,
          message: message || `Update by ${userID}`,
          createdAt: now,
          createdBy: userID,
        };
        
        file.versions.push(newVersion);
        file.content = content;
        file.size = content.length;
        file.hash = newHash;
        file.metadata.lineCount = content.split('\n').length;
        needsPhysicalUpdate = true;
      }
    }
    
    // Handle name/path changes
    if (name && name !== file.name) {
      oldPhysicalPath = getProjectFilePath(file.projectId, file.path);
      file.name = name;
      file.path = path.join(path.dirname(file.path), name);
      newPhysicalPath = getProjectFilePath(file.projectId, file.path);
      file.mimeType = file.type === "file" ? detectMimeType(name) : undefined;
      file.metadata.language = file.type === "file" ? detectLanguage(name) : undefined;
      file.metadata.isHidden = name.startsWith('.');
      needsPhysicalUpdate = true;
    }
    
    if (newPath && newPath !== path.dirname(file.path)) {
      oldPhysicalPath = oldPhysicalPath || getProjectFilePath(file.projectId, file.path);
      file.path = path.join(newPath, file.name);
      newPhysicalPath = getProjectFilePath(file.projectId, file.path);
      needsPhysicalUpdate = true;
    }
    
    // Handle permission updates
    if (permissions) {
      file.permissions = { ...file.permissions, ...permissions };
    }
    
    file.updatedAt = now;
    file.lastModifiedBy = userID;
    
    try {
      // Update physical file system
      if (needsPhysicalUpdate) {
        newPhysicalPath = newPhysicalPath || getProjectFilePath(file.projectId, file.path);
        
        if (oldPhysicalPath && oldPhysicalPath !== newPhysicalPath) {
          // Move/rename file
          await ensureDirectoryExists(path.dirname(newPhysicalPath));
          await fs.rename(oldPhysicalPath, newPhysicalPath);
        }
        
        if (content !== undefined && file.type === "file") {
          await fs.writeFile(newPhysicalPath, content, file.metadata.encoding as BufferEncoding || 'utf-8');
        }
      }
      
      files.set(id, file);
      
      log.info("File updated successfully", { 
        fileId: id, 
        path: file.path, 
        version: file.versions.length 
      });
      
      return file;
      
    } catch (error) {
      log.error("File update failed", { 
        error: error.message, 
        fileId: id 
      });
      
      throw new Error(`Failed to update file: ${error.message}`);
    }
  }
);

// Delete file endpoint
export const deleteFile = api(
  { method: "DELETE", path: "/files/:id", auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean }> => {
    const { userID } = meta.auth;
    const { id } = req;
    
    const file = files.get(id);
    if (!file) {
      throw new Error("File not found");
    }
    
    // TODO: Add permission check
    
    try {
      // Remove from physical file system
      const physicalPath = getProjectFilePath(file.projectId, file.path);
      
      if (file.type === "directory") {
        await fs.rmdir(physicalPath, { recursive: true });
      } else {
        await fs.unlink(physicalPath);
      }
      
      // Remove from virtual file system
      files.delete(id);
      
      // Update project file tree
      const projectFiles = projectFileTrees.get(file.projectId);
      if (projectFiles) {
        projectFiles.delete(id);
      }
      
      log.info("File deleted successfully", { fileId: id, path: file.path });
      
      return { success: true };
      
    } catch (error) {
      log.error("File deletion failed", { 
        error: error.message, 
        fileId: id 
      });
      
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
);

// List files endpoint
export const listFiles = api(
  { method: "GET", path: "/files", auth: true, expose: true },
  async (req: { 
    projectId: string; 
    path?: string; 
    recursive?: boolean; 
    includeHidden?: boolean;
    type?: "file" | "directory";
  }, meta: APICallMeta<AuthData>): Promise<{ files: VirtualFile[]; total: number }> => {
    const { userID } = meta.auth;
    const { projectId, path: filterPath = "", recursive = false, includeHidden = false, type } = req;
    
    const projectFiles = projectFileTrees.get(projectId);
    if (!projectFiles) {
      return { files: [], total: 0 };
    }
    
    let filteredFiles = Array.from(projectFiles)
      .map(fileId => files.get(fileId)!)
      .filter(file => file && file.projectId === projectId);
    
    // Filter by path
    if (filterPath) {
      if (recursive) {
        filteredFiles = filteredFiles.filter(file => 
          file.path.startsWith(filterPath)
        );
      } else {
        filteredFiles = filteredFiles.filter(file => 
          path.dirname(file.path) === filterPath
        );
      }
    }
    
    // Filter by type
    if (type) {
      filteredFiles = filteredFiles.filter(file => file.type === type);
    }
    
    // Filter hidden files
    if (!includeHidden) {
      filteredFiles = filteredFiles.filter(file => !file.metadata.isHidden);
    }
    
    // TODO: Add permission filtering
    
    return {
      files: filteredFiles,
      total: filteredFiles.length,
    };
  }
);

// Search files endpoint
export const searchFiles = api<typeof SearchFilesRequest>(
  { method: "POST", path: "/files/search", auth: true, expose: true },
  async (req: z.infer<typeof SearchFilesRequest>, meta: APICallMeta<AuthData>): Promise<{ results: FileSearchResult[]; total: number }> => {
    const { userID } = meta.auth;
    const { projectId, query, type, fileTypes, maxResults, caseSensitive, useRegex } = req;
    
    const projectFiles = projectFileTrees.get(projectId);
    if (!projectFiles) {
      return { results: [], total: 0 };
    }
    
    const results: FileSearchResult[] = [];
    const searchFlags = caseSensitive ? 'g' : 'gi';
    const searchRegex = useRegex ? new RegExp(query, searchFlags) : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), searchFlags);
    
    for (const fileId of projectFiles) {
      const file = files.get(fileId);
      if (!file) continue;
      
      // Filter by file types
      if (fileTypes && fileTypes.length > 0) {
        const fileExt = path.extname(file.name).toLowerCase();
        if (!fileTypes.includes(fileExt)) continue;
      }
      
      const matches: FileMatch[] = [];
      let score = 0;
      
      // Search filename
      if (type === "filename" || type === "both") {
        const nameMatches = file.name.match(searchRegex);
        if (nameMatches) {
          score += nameMatches.length * 10; // Higher weight for filename matches
          matches.push({
            line: 0,
            column: file.name.indexOf(nameMatches[0]),
            content: file.name,
            matchedText: nameMatches[0],
          });
        }
      }
      
      // Search content
      if ((type === "content" || type === "both") && file.content && file.type === "file") {
        const lines = file.content.split('\n');
        lines.forEach((line, lineIndex) => {
          const lineMatches = line.match(searchRegex);
          if (lineMatches) {
            score += lineMatches.length;
            lineMatches.forEach(match => {
              matches.push({
                line: lineIndex + 1,
                column: line.indexOf(match),
                content: line,
                matchedText: match,
              });
            });
          }
        });
      }
      
      if (matches.length > 0) {
        results.push({
          file,
          matches,
          score,
        });
      }
      
      if (results.length >= maxResults) break;
    }
    
    // Sort by score (relevance)
    results.sort((a, b) => b.score - a.score);
    
    return {
      results,
      total: results.length,
    };
  }
);

// File operation endpoint (copy, move, rename)
export const fileOperation = api<typeof FileOperationRequest>(
  { method: "POST", path: "/files/:id/operations", auth: true, expose: true },
  async (req: z.infer<typeof FileOperationRequest> & { id: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean; newFileId?: string }> => {
    const { userID } = meta.auth;
    const { id, operation, destination, newName } = req;
    
    const file = files.get(id);
    if (!file) {
      throw new Error("File not found");
    }
    
    // TODO: Add permission check
    
    try {
      const currentPhysicalPath = getProjectFilePath(file.projectId, file.path);
      
      switch (operation) {
        case "copy": {
          const newFileId = uuidv4();
          const newFileName = newName || file.name;
          const newPath = path.join(destination, newFileName);
          const newPhysicalPath = getProjectFilePath(file.projectId, newPath);
          
          // Copy physical file
          await ensureDirectoryExists(path.dirname(newPhysicalPath));
          await fs.copyFile(currentPhysicalPath, newPhysicalPath);
          
          // Create new virtual file entry
          const newFile: VirtualFile = {
            ...file,
            id: newFileId,
            path: newPath,
            name: newFileName,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userID,
            lastModifiedBy: userID,
          };
          
          files.set(newFileId, newFile);
          projectFileTrees.get(file.projectId)?.add(newFileId);
          
          log.info("File copied successfully", { 
            originalId: id, 
            newId: newFileId, 
            destination: newPath 
          });
          
          return { success: true, newFileId };
        }
        
        case "move":
        case "rename": {
          const newFileName = newName || file.name;
          const newPath = operation === "move" 
            ? path.join(destination, file.name)
            : path.join(path.dirname(file.path), newFileName);
          const newPhysicalPath = getProjectFilePath(file.projectId, newPath);
          
          // Move/rename physical file
          await ensureDirectoryExists(path.dirname(newPhysicalPath));
          await fs.rename(currentPhysicalPath, newPhysicalPath);
          
          // Update virtual file entry
          file.path = newPath;
          file.name = newFileName;
          file.updatedAt = new Date();
          file.lastModifiedBy = userID;
          
          if (newFileName !== file.name) {
            file.mimeType = file.type === "file" ? detectMimeType(newFileName) : undefined;
            file.metadata.language = file.type === "file" ? detectLanguage(newFileName) : undefined;
            file.metadata.isHidden = newFileName.startsWith('.');
          }
          
          files.set(id, file);
          
          log.info(`File ${operation}d successfully`, { 
            fileId: id, 
            oldPath: file.path,
            newPath 
          });
          
          return { success: true };
        }
        
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
    } catch (error) {
      log.error(`File ${operation} failed`, { 
        error: error.message, 
        fileId: id 
      });
      
      throw new Error(`Failed to ${operation} file: ${error.message}`);
    }
  }
);

// Get file diff endpoint
export const getFileDiff = api(
  { method: "GET", path: "/files/:id/diff", auth: true, expose: true },
  async (req: { id: string; fromVersion?: number; toVersion?: number }, meta: APICallMeta<AuthData>): Promise<FileDiff> => {
    const { userID } = meta.auth;
    const { id, fromVersion, toVersion } = req;
    
    const file = files.get(id);
    if (!file) {
      throw new Error("File not found");
    }
    
    const versions = file.versions;
    if (versions.length < 2) {
      throw new Error("File has insufficient versions for diff");
    }
    
    const oldVersion = fromVersion 
      ? versions.find(v => v.version === fromVersion)
      : versions[versions.length - 2];
    
    const newVersion = toVersion
      ? versions.find(v => v.version === toVersion)
      : versions[versions.length - 1];
    
    if (!oldVersion || !newVersion) {
      throw new Error("Invalid version numbers");
    }
    
    // Simple diff implementation (could be enhanced with proper diff algorithm)
    const oldLines = oldVersion.content.split('\n');
    const newLines = newVersion.content.split('\n');
    const changes: FileDiffChange[] = [];
    
    const maxLines = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];
      
      if (oldLine === undefined) {
        changes.push({
          type: "add",
          line: i + 1,
          newContent: newLine,
        });
      } else if (newLine === undefined) {
        changes.push({
          type: "delete",
          line: i + 1,
          oldContent: oldLine,
        });
      } else if (oldLine !== newLine) {
        changes.push({
          type: "modify",
          line: i + 1,
          oldContent: oldLine,
          newContent: newLine,
        });
      }
    }
    
    return {
      oldFile: { ...oldVersion, path: file.path, name: file.name },
      newFile: { ...newVersion, path: file.path, name: file.name },
      changes,
    };
  }
);