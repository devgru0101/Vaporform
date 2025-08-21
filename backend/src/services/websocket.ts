import { api, APICallMeta } from "encore.dev/api";
import log from "encore.dev/log";
import { z } from "zod";
import { AuthData } from "./auth";
import { v4 as uuidv4 } from "uuid";
import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";

// WebSocket interfaces
export interface WebSocketConnection {
  id: string;
  userId: string;
  projectId: string;
  sessionId: string;
  socket: WebSocket;
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
  participants: SessionParticipant[];
  currentDocument?: string;
  cursors: Map<string, CursorPosition>;
  selections: Map<string, SelectionRange>;
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
  | "sync_response";

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

// Request/Response schemas
const CreateSessionRequest = z.object({
  projectId: z.string(),
  documentId: z.string().optional(),
  sessionName: z.string().optional(),
});

const JoinSessionRequest = z.object({
  sessionId: z.string(),
  clientType: z.enum(["vscode", "web", "mobile", "api"]).default("web"),
  clientVersion: z.string().optional(),
  capabilities: z.array(z.string()).default([]),
});

const SendMessageRequest = z.object({
  sessionId: z.string(),
  type: z.enum([
    "cursor_move", "text_change", "selection_change", 
    "file_open", "file_close", "chat_message", "ping"
  ]),
  payload: z.any(),
});

const CursorMovePayload = z.object({
  fileId: z.string(),
  line: z.number(),
  column: z.number(),
});

const TextChangePayload = z.object({
  fileId: z.string(),
  operation: z.object({
    type: z.enum(["insert", "delete", "retain"]),
    position: z.number(),
    content: z.string().optional(),
    length: z.number().optional(),
  }),
});

const ChatMessagePayload = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(["text", "code_share"]).default("text"),
  mentions: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
});

// Global state management
const connections: Map<string, WebSocketConnection> = new Map();
const sessions: Map<string, CollaborationSession> = new Map();
const userSessions: Map<string, Set<string>> = new Map(); // userId -> sessionIds
const projectSessions: Map<string, Set<string>> = new Map(); // projectId -> sessionIds
const chatHistory: Map<string, ChatMessage[]> = new Map(); // sessionId -> messages

// WebSocket server (will be initialized by Encore)
let wsServer: WebSocketServer | null = null;

// Color palette for user cursors
const USER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"
];

// Helper functions
function generateUserColor(userId: string): string {
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

function broadcastToSession(sessionId: string, message: WebSocketMessage, excludeUserId?: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  session.participants.forEach(participant => {
    if (excludeUserId && participant.userId === excludeUserId) return;
    
    const userConnections = Array.from(connections.values())
      .filter(conn => conn.userId === participant.userId && conn.sessionId === sessionId);
    
    userConnections.forEach(conn => {
      if (conn.isActive && conn.socket.readyState === WebSocket.OPEN) {
        try {
          conn.socket.send(JSON.stringify(message));
        } catch (error) {
          log.error("Failed to send message to client", { 
            error: error.message,
            connectionId: conn.id,
            userId: participant.userId
          });
        }
      }
    });
  });
}

function applyOperationalTransform(sessionId: string, operation: OperationalTransform): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  // Add operation to session history
  session.operations.push(operation);
  
  // Broadcast operation to all participants
  const message: WebSocketMessage = {
    id: uuidv4(),
    type: "text_change",
    payload: operation,
    timestamp: new Date(),
    userId: operation.userId,
    sessionId,
  };
  
  broadcastToSession(sessionId, message, operation.userId);
  
  // Mark operation as applied
  operation.applied = true;
  session.updatedAt = new Date();
}

function handleCursorMove(connectionId: string, payload: any): void {
  const connection = connections.get(connectionId);
  if (!connection) return;
  
  const session = sessions.get(connection.sessionId);
  if (!session) return;
  
  const cursorPosition: CursorPosition = {
    userId: connection.userId,
    fileId: payload.fileId,
    line: payload.line,
    column: payload.column,
    timestamp: new Date(),
  };
  
  session.cursors.set(connection.userId, cursorPosition);
  
  const message: WebSocketMessage = {
    id: uuidv4(),
    type: "cursor_move",
    payload: cursorPosition,
    timestamp: new Date(),
    userId: connection.userId,
    sessionId: connection.sessionId,
  };
  
  broadcastToSession(connection.sessionId, message, connection.userId);
}

function handleTextChange(connectionId: string, payload: any): void {
  const connection = connections.get(connectionId);
  if (!connection) return;
  
  const operation: OperationalTransform = {
    id: uuidv4(),
    type: payload.operation.type,
    position: payload.operation.position,
    content: payload.operation.content,
    length: payload.operation.length,
    userId: connection.userId,
    timestamp: new Date(),
    applied: false,
  };
  
  applyOperationalTransform(connection.sessionId, operation);
}

function handleChatMessage(connectionId: string, payload: any): void {
  const connection = connections.get(connectionId);
  if (!connection) return;
  
  const session = sessions.get(connection.sessionId);
  if (!session) return;
  
  const participant = session.participants.find(p => p.userId === connection.userId);
  if (!participant) return;
  
  const chatMessage: ChatMessage = {
    id: uuidv4(),
    sessionId: connection.sessionId,
    userId: connection.userId,
    userName: participant.userName,
    content: payload.content,
    type: payload.type || "text",
    mentions: payload.mentions || [],
    timestamp: new Date(),
    metadata: payload.metadata,
  };
  
  // Store in chat history
  if (!chatHistory.has(connection.sessionId)) {
    chatHistory.set(connection.sessionId, []);
  }
  chatHistory.get(connection.sessionId)!.push(chatMessage);
  
  // Broadcast to session
  const message: WebSocketMessage = {
    id: uuidv4(),
    type: "chat_message",
    payload: chatMessage,
    timestamp: new Date(),
    userId: connection.userId,
    sessionId: connection.sessionId,
  };
  
  broadcastToSession(connection.sessionId, message);
}

// Create collaboration session endpoint
export const createSession = api<typeof CreateSessionRequest>(
  { method: "POST", path: "/ws/sessions", auth: true, expose: true },
  async (req: z.infer<typeof CreateSessionRequest>, meta: APICallMeta<AuthData>): Promise<{ sessionId: string; wsUrl: string }> => {
    const { userID } = meta.auth;
    const { projectId, documentId, sessionName } = req;
    
    log.info("Creating collaboration session", { projectId, documentId, userID });
    
    const sessionId = uuidv4();
    const now = new Date();
    
    // TODO: Get user name from user service
    const userName = `User_${userID.slice(0, 8)}`;
    
    const participant: SessionParticipant = {
      userId: userID,
      userName,
      role: "owner",
      color: generateUserColor(userID),
      joinedAt: now,
      lastSeen: now,
      isOnline: true,
    };
    
    const session: CollaborationSession = {
      id: sessionId,
      projectId,
      participants: [participant],
      currentDocument: documentId,
      cursors: new Map(),
      selections: new Map(),
      operations: [],
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };
    
    sessions.set(sessionId, session);
    
    // Update user and project session mappings
    if (!userSessions.has(userID)) {
      userSessions.set(userID, new Set());
    }
    userSessions.get(userID)!.add(sessionId);
    
    if (!projectSessions.has(projectId)) {
      projectSessions.set(projectId, new Set());
    }
    projectSessions.get(projectId)!.add(sessionId);
    
    // Initialize chat history
    chatHistory.set(sessionId, []);
    
    const wsUrl = `ws://localhost:4000/ws/connect?sessionId=${sessionId}&token=${meta.auth}`;
    
    log.info("Collaboration session created", { sessionId, projectId });
    
    return { sessionId, wsUrl };
  }
);

// Join collaboration session endpoint
export const joinSession = api<typeof JoinSessionRequest>(
  { method: "POST", path: "/ws/sessions/:sessionId/join", auth: true, expose: true },
  async (req: z.infer<typeof JoinSessionRequest> & { sessionId: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean; wsUrl: string }> => {
    const { userID } = meta.auth;
    const { sessionId, clientType, clientVersion, capabilities } = req;
    
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    // TODO: Check if user has permission to join this project
    
    // TODO: Get user name from user service
    const userName = `User_${userID.slice(0, 8)}`;
    
    // Check if user is already a participant
    let participant = session.participants.find(p => p.userId === userID);
    if (!participant) {
      participant = {
        userId: userID,
        userName,
        role: "collaborator",
        color: generateUserColor(userID),
        joinedAt: new Date(),
        lastSeen: new Date(),
        isOnline: true,
      };
      session.participants.push(participant);
    } else {
      participant.isOnline = true;
      participant.lastSeen = new Date();
    }
    
    // Update user session mapping
    if (!userSessions.has(userID)) {
      userSessions.set(userID, new Set());
    }
    userSessions.get(userID)!.add(sessionId);
    
    session.updatedAt = new Date();
    
    const wsUrl = `ws://localhost:4000/ws/connect?sessionId=${sessionId}&token=${meta.auth}`;
    
    log.info("User joined collaboration session", { sessionId, userID });
    
    return { success: true, wsUrl };
  }
);

// Get session info endpoint
export const getSession = api(
  { method: "GET", path: "/ws/sessions/:sessionId", auth: true, expose: true },
  async (req: { sessionId: string }, meta: APICallMeta<AuthData>): Promise<CollaborationSession> => {
    const { userID } = meta.auth;
    const { sessionId } = req;
    
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    // Check if user is a participant
    const isParticipant = session.participants.some(p => p.userId === userID);
    if (!isParticipant) {
      throw new Error("Access denied");
    }
    
    return {
      ...session,
      cursors: Array.from(session.cursors.entries()).reduce((acc, [key, value]) => {
        acc.set(key, value);
        return acc;
      }, new Map()),
      selections: Array.from(session.selections.entries()).reduce((acc, [key, value]) => {
        acc.set(key, value);
        return acc;
      }, new Map()),
    };
  }
);

// Get chat history endpoint
export const getChatHistory = api(
  { method: "GET", path: "/ws/sessions/:sessionId/chat", auth: true, expose: true },
  async (req: { sessionId: string; limit?: number; offset?: number }, meta: APICallMeta<AuthData>): Promise<{ messages: ChatMessage[]; total: number }> => {
    const { userID } = meta.auth;
    const { sessionId, limit = 50, offset = 0 } = req;
    
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    // Check if user is a participant
    const isParticipant = session.participants.some(p => p.userId === userID);
    if (!isParticipant) {
      throw new Error("Access denied");
    }
    
    const messages = chatHistory.get(sessionId) || [];
    const paginatedMessages = messages.slice(offset, offset + limit);
    
    return {
      messages: paginatedMessages,
      total: messages.length,
    };
  }
);

// List user sessions endpoint
export const listUserSessions = api(
  { method: "GET", path: "/ws/sessions", auth: true, expose: true },
  async (req: { active?: boolean }, meta: APICallMeta<AuthData>): Promise<{ sessions: CollaborationSession[]; total: number }> => {
    const { userID } = meta.auth;
    const { active = true } = req;
    
    const userSessionIds = userSessions.get(userID) || new Set();
    let userActiveSessions = Array.from(userSessionIds)
      .map(sessionId => sessions.get(sessionId)!)
      .filter(session => session);
    
    if (active) {
      userActiveSessions = userActiveSessions.filter(session => session.isActive);
    }
    
    return {
      sessions: userActiveSessions,
      total: userActiveSessions.length,
    };
  }
);

// Leave session endpoint
export const leaveSession = api(
  { method: "POST", path: "/ws/sessions/:sessionId/leave", auth: true, expose: true },
  async (req: { sessionId: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean }> => {
    const { userID } = meta.auth;
    const { sessionId } = req;
    
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    // Find and update participant
    const participant = session.participants.find(p => p.userId === userID);
    if (participant) {
      participant.isOnline = false;
      participant.lastSeen = new Date();
    }
    
    // Close all user connections for this session
    const userConnections = Array.from(connections.values())
      .filter(conn => conn.userId === userID && conn.sessionId === sessionId);
    
    userConnections.forEach(conn => {
      conn.isActive = false;
      if (conn.socket.readyState === WebSocket.OPEN) {
        conn.socket.close();
      }
      connections.delete(conn.id);
    });
    
    // Remove from user sessions mapping
    const userSessionSet = userSessions.get(userID);
    if (userSessionSet) {
      userSessionSet.delete(sessionId);
    }
    
    // Remove cursors and selections
    session.cursors.delete(userID);
    session.selections.delete(userID);
    
    // Broadcast user leave event
    const message: WebSocketMessage = {
      id: uuidv4(),
      type: "user_leave",
      payload: { userId: userID },
      timestamp: new Date(),
      userId: userID,
      sessionId,
    };
    
    broadcastToSession(sessionId, message, userID);
    
    // Check if session should be deactivated (no online participants)
    const hasOnlineParticipants = session.participants.some(p => p.isOnline);
    if (!hasOnlineParticipants) {
      session.isActive = false;
    }
    
    session.updatedAt = new Date();
    
    log.info("User left collaboration session", { sessionId, userID });
    
    return { success: true };
  }
);

// WebSocket connection handler (to be called by WebSocket middleware)
export function handleWebSocketConnection(ws: WebSocket, request: IncomingMessage): void {
  const url = new URL(request.url!, `http://${request.headers.host}`);
  const sessionId = url.searchParams.get('sessionId');
  const token = url.searchParams.get('token');
  
  if (!sessionId || !token) {
    ws.close(1008, "Missing sessionId or token");
    return;
  }
  
  // TODO: Verify JWT token and extract user ID
  // For now, using mock user ID
  const userId = "mock_user_id";
  
  const session = sessions.get(sessionId);
  if (!session) {
    ws.close(1008, "Session not found");
    return;
  }
  
  const connectionId = uuidv4();
  const connection: WebSocketConnection = {
    id: connectionId,
    userId,
    projectId: session.projectId,
    sessionId,
    socket: ws,
    isActive: true,
    connectedAt: new Date(),
    lastActivity: new Date(),
    metadata: {
      userAgent: request.headers['user-agent'],
      ipAddress: request.socket.remoteAddress,
      clientType: "web", // TODO: Extract from headers
      capabilities: [],
    },
  };
  
  connections.set(connectionId, connection);
  
  // Set up message handler
  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      connection.lastActivity = new Date();
      
      switch (message.type) {
        case "cursor_move":
          handleCursorMove(connectionId, message.payload);
          break;
        case "text_change":
          handleTextChange(connectionId, message.payload);
          break;
        case "chat_message":
          handleChatMessage(connectionId, message.payload);
          break;
        case "ping":
          ws.send(JSON.stringify({
            id: uuidv4(),
            type: "pong",
            payload: {},
            timestamp: new Date(),
            userId,
            sessionId,
          }));
          break;
        default:
          log.warn("Unknown WebSocket message type", { type: message.type });
      }
    } catch (error) {
      log.error("Failed to process WebSocket message", { 
        error: error.message,
        connectionId 
      });
    }
  });
  
  // Set up close handler
  ws.on('close', () => {
    connection.isActive = false;
    connections.delete(connectionId);
    
    // Update participant status
    const participant = session.participants.find(p => p.userId === userId);
    if (participant) {
      participant.lastSeen = new Date();
      
      // Check if user has other active connections
      const hasOtherConnections = Array.from(connections.values())
        .some(conn => conn.userId === userId && conn.sessionId === sessionId && conn.isActive);
      
      if (!hasOtherConnections) {
        participant.isOnline = false;
      }
    }
    
    log.info("WebSocket connection closed", { connectionId, userId, sessionId });
  });
  
  // Set up error handler
  ws.on('error', (error) => {
    log.error("WebSocket error", { 
      error: error.message,
      connectionId,
      userId,
      sessionId 
    });
  });
  
  // Send welcome message
  const welcomeMessage: WebSocketMessage = {
    id: uuidv4(),
    type: "user_join",
    payload: {
      sessionId,
      participants: session.participants,
      cursors: Array.from(session.cursors.values()),
      selections: Array.from(session.selections.values()),
    },
    timestamp: new Date(),
    userId,
    sessionId,
  };
  
  ws.send(JSON.stringify(welcomeMessage));
  
  log.info("WebSocket connection established", { connectionId, userId, sessionId });
}

// Initialize WebSocket server (called by Encore runtime)
export function initializeWebSocketServer(server: any): void {
  wsServer = new WebSocketServer({ server, path: "/ws/connect" });
  
  wsServer.on('connection', handleWebSocketConnection);
  
  log.info("WebSocket server initialized");
}