// WebSocket and real-time collaboration types
export interface WebSocketConnection {
  id: string;
  userId: string;
  projectId: string;
  sessionId: string;
  isActive: boolean;
  connectedAt: Date;
  lastActivity: Date;
  metadata: ConnectionMetadata;
}

export interface ConnectionMetadata {
  userAgent?: string;
  ipAddress?: string;
  clientType: "vscode" | "web" | "mobile" | "api";
  clientVersion?: string;
  capabilities: string[];
}

export interface CollaborationSession {
  id: string;
  projectId: string;
  sessionName?: string;
  participants: SessionParticipant[];
  currentDocument?: string;
  cursors: CursorPosition[];
  selections: SelectionRange[];
  operations: OperationalTransform[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface SessionParticipant {
  userId: string;
  userName: string;
  role: "owner" | "collaborator" | "viewer";
  color: string;
  joinedAt: Date;
  lastSeen: Date;
  isOnline: boolean;
}

export interface CursorPosition {
  userId: string;
  fileId: string;
  line: number;
  column: number;
  timestamp: Date;
}

export interface SelectionRange {
  userId: string;
  fileId: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  timestamp: Date;
}

export interface OperationalTransform {
  id: string;
  type: "insert" | "delete" | "retain";
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: Date;
  applied: boolean;
}

export interface WebSocketMessage {
  id: string;
  type: MessageType;
  payload: any;
  timestamp: Date;
  userId: string;
  sessionId: string;
}

export type MessageType = 
  | "cursor_move"
  | "text_change"
  | "selection_change"
  | "file_open"
  | "file_close"
  | "chat_message"
  | "user_join"
  | "user_leave"
  | "ping"
  | "pong"
  | "error"
  | "sync_request"
  | "sync_response"
  | "document_change"
  | "status_update";

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  content: string;
  type: "text" | "system" | "code_share";
  mentions: string[];
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Message payload types
export interface CursorMovePayload {
  fileId: string;
  line: number;
  column: number;
}

export interface TextChangePayload {
  fileId: string;
  operation: {
    type: "insert" | "delete" | "retain";
    position: number;
    content?: string;
    length?: number;
  };
}

export interface SelectionChangePayload {
  fileId: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface FileOpenPayload {
  fileId: string;
  fileName: string;
  filePath: string;
}

export interface FileClosePayload {
  fileId: string;
}

export interface ChatMessagePayload {
  content: string;
  type?: "text" | "code_share";
  mentions?: string[];
  metadata?: Record<string, any>;
}

export interface UserJoinPayload {
  userId: string;
  userName: string;
  color: string;
  timestamp: Date;
}

export interface UserLeavePayload {
  userId: string;
  reason?: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: any;
}

export interface SyncRequestPayload {
  fileId: string;
  lastKnownVersion: number;
}

export interface SyncResponsePayload {
  fileId: string;
  currentVersion: number;
  operations: OperationalTransform[];
  content?: string;
}

export interface DocumentChangePayload {
  fileId: string;
  changeType: "created" | "modified" | "deleted" | "renamed";
  newName?: string;
  newPath?: string;
}

export interface StatusUpdatePayload {
  userId: string;
  status: "online" | "away" | "busy" | "offline";
  message?: string;
}

// Request/Response types
export interface CreateSessionRequest {
  projectId: string;
  documentId?: string;
  sessionName?: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  wsUrl: string;
  session: CollaborationSession;
}

export interface JoinSessionRequest {
  sessionId: string;
  clientType?: "vscode" | "web" | "mobile" | "api";
  clientVersion?: string;
  capabilities?: string[];
}

export interface JoinSessionResponse {
  success: boolean;
  wsUrl: string;
  session: CollaborationSession;
}

export interface SendMessageRequest {
  sessionId: string;
  type: MessageType;
  payload: any;
}

export interface GetSessionRequest {
  sessionId: string;
  includeHistory?: boolean;
  includeParticipants?: boolean;
}

export interface GetChatHistoryRequest {
  sessionId: string;
  limit?: number;
  offset?: number;
  since?: Date;
}

export interface GetChatHistoryResponse {
  messages: ChatMessage[];
  total: number;
  hasMore: boolean;
}

export interface ListSessionsRequest {
  projectId?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListSessionsResponse {
  sessions: CollaborationSession[];
  total: number;
}

export interface LeaveSessionRequest {
  sessionId: string;
  reason?: string;
}

export interface LeaveSessionResponse {
  success: boolean;
  message?: string;
}

export interface SessionInviteRequest {
  sessionId: string;
  userIds: string[];
  message?: string;
}

export interface SessionInviteResponse {
  success: boolean;
  invitedUsers: string[];
  failedInvites?: Array<{
    userId: string;
    reason: string;
  }>;
}

// Real-time event types
export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  sessionId: string;
  userId: string;
  timestamp: Date;
  data: any;
}

export type RealtimeEventType = 
  | "participant_joined"
  | "participant_left"
  | "cursor_moved"
  | "text_changed"
  | "selection_changed"
  | "file_opened"
  | "file_closed"
  | "chat_message_sent"
  | "document_changed"
  | "status_changed";

// Collaboration statistics
export interface CollaborationStats {
  sessionId: string;
  totalParticipants: number;
  activeParticipants: number;
  totalMessages: number;
  totalOperations: number;
  averageLatency: number;
  uptime: number;
  lastActivity: Date;
}

export interface UserPresence {
  userId: string;
  userName: string;
  status: "online" | "away" | "busy" | "offline";
  lastSeen: Date;
  currentDocument?: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
}

// WebSocket connection management
export interface ConnectionConfig {
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  timeout: number;
  compression: boolean;
}

export interface ConnectionState {
  status: "connecting" | "connected" | "disconnected" | "error";
  lastConnected?: Date;
  reconnectAttempts: number;
  latency: number;
  error?: string;
}

// Conflict resolution
export interface ConflictResolution {
  id: string;
  operationId: string;
  conflictType: "concurrent_edit" | "outdated_operation" | "missing_dependency";
  resolution: "accept" | "reject" | "merge" | "manual";
  resolvedBy: string;
  resolvedAt: Date;
  details: any;
}

export interface MergeRequest {
  operations: OperationalTransform[];
  baseVersion: number;
  targetVersion: number;
  strategy: "auto" | "manual" | "last_writer_wins";
}

export interface MergeResponse {
  success: boolean;
  mergedOperations: OperationalTransform[];
  conflicts?: ConflictResolution[];
  newVersion: number;
}