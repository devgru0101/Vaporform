// Virtual file system types
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
  gitStatus?: GitStatus;
  tags: string[];
  annotations: FileAnnotation[];
}

export type GitStatus = 
  | "untracked" 
  | "modified" 
  | "added" 
  | "deleted" 
  | "renamed" 
  | "clean";

export interface FileAnnotation {
  id: string;
  line: number;
  column: number;
  type: "comment" | "todo" | "error" | "warning" | "info";
  content: string;
  author: string;
  createdAt: Date;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
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

export interface FileTree {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileTree[];
  expanded?: boolean;
  isLoading?: boolean;
}

// Request/Response types
export interface CreateFileRequest {
  projectId: string;
  path: string;
  name: string;
  type?: "file" | "directory";
  content?: string;
  encoding?: string;
  permissions?: Partial<FilePermissions>;
}

export interface UpdateFileRequest {
  content?: string;
  name?: string;
  path?: string;
  permissions?: Partial<FilePermissions>;
  message?: string;
}

export interface SearchFilesRequest {
  projectId: string;
  query: string;
  type?: "content" | "filename" | "both";
  fileTypes?: string[];
  maxResults?: number;
  caseSensitive?: boolean;
  useRegex?: boolean;
}

export interface FileOperationRequest {
  operation: "copy" | "move" | "rename";
  destination: string;
  newName?: string;
}

export interface ListFilesRequest {
  projectId: string;
  path?: string;
  recursive?: boolean;
  includeHidden?: boolean;
  type?: "file" | "directory";
  limit?: number;
  offset?: number;
}

export interface GetFileRequest {
  includeContent?: boolean;
  includeVersions?: boolean;
  includeAnnotations?: boolean;
}

export interface CreateAnnotationRequest {
  line: number;
  column?: number;
  type: "comment" | "todo" | "error" | "warning" | "info";
  content: string;
}

export interface UpdateAnnotationRequest {
  content?: string;
  resolved?: boolean;
}

export interface GetFileDiffRequest {
  fromVersion?: number;
  toVersion?: number;
}

export interface FileResponse {
  success: boolean;
  file?: VirtualFile;
  files?: VirtualFile[];
  total?: number;
  error?: string;
}

export interface FileSearchResponse {
  results: FileSearchResult[];
  total: number;
  query: string;
  searchTime: number;
}

export interface FileOperationResponse {
  success: boolean;
  newFileId?: string;
  message?: string;
}

export interface FileTreeResponse {
  tree: FileTree[];
  projectId: string;
  totalFiles: number;
  totalDirectories: number;
}

export interface FileDiffResponse {
  diff: FileDiff;
  oldVersion: number;
  newVersion: number;
}

export interface FileAnnotationResponse {
  annotation: FileAnnotation;
  fileId: string;
}

export interface FileVersionResponse {
  version: FileVersion;
  fileId: string;
  isLatest: boolean;
}

// File upload/download types
export interface FileUploadRequest {
  projectId: string;
  path: string;
  files: File[];
  overwrite?: boolean;
}

export interface FileDownloadRequest {
  fileIds: string[];
  format?: "zip" | "tar";
  includeMetadata?: boolean;
}

export interface FileUploadResponse {
  success: boolean;
  uploadedFiles: VirtualFile[];
  errors?: Array<{
    filename: string;
    error: string;
  }>;
}

export interface FileDownloadResponse {
  downloadUrl: string;
  filename: string;
  size: number;
  expiresAt: Date;
}

// File watching/monitoring types
export interface FileWatchEvent {
  type: "created" | "modified" | "deleted" | "moved";
  fileId: string;
  projectId: string;
  path: string;
  timestamp: Date;
  userId?: string;
  details?: any;
}

export interface FileWatchRequest {
  projectId: string;
  paths?: string[];
  recursive?: boolean;
  events?: Array<"created" | "modified" | "deleted" | "moved">;
}

export interface FileWatchResponse {
  watchId: string;
  projectId: string;
  isActive: boolean;
}