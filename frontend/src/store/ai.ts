import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
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

interface AiConversation {
  id: string;
  title: string;
  messages: AiMessage[];
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
  tags: string[];
}

interface AiState {
  conversations: AiConversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  settings: {
    model: string;
    temperature: number;
    maxTokens: number;
    contextWindow: number;
    enableCodeGeneration: boolean;
    enableFileContext: boolean;
    enableProjectContext: boolean;
    autoSave: boolean;
  };
  usage: {
    tokensUsed: number;
    requestsCount: number;
    lastResetDate: Date;
    monthlyLimit: number;
  };
  suggestions: Array<{
    id: string;
    type: 'code' | 'fix' | 'optimize' | 'test' | 'document';
    title: string;
    description: string;
    filePath?: string;
    lineRange?: { start: number; end: number };
  }>;
  contextFiles: string[];
}

const initialState: AiState = {
  conversations: [],
  activeConversationId: null,
  isLoading: false,
  isStreaming: false,
  error: null,
  settings: {
    model: 'claude-3-sonnet',
    temperature: 0.7,
    maxTokens: 4096,
    contextWindow: 200000,
    enableCodeGeneration: true,
    enableFileContext: true,
    enableProjectContext: true,
    autoSave: true,
  },
  usage: {
    tokensUsed: 0,
    requestsCount: 0,
    lastResetDate: new Date(),
    monthlyLimit: 100000,
  },
  suggestions: [],
  contextFiles: [],
};

export const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },
    setConversations: (state, action: PayloadAction<AiConversation[]>) => {
      state.conversations = action.payload;
    },
    createConversation: (state, action: PayloadAction<{ title?: string; projectId?: string }>) => {
      const newConversation: AiConversation = {
        id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: action.payload.title || 'New Conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        projectId: action.payload.projectId,
        tags: [],
      };
      
      state.conversations.unshift(newConversation);
      state.activeConversationId = newConversation.id;
    },
    updateConversation: (state, action: PayloadAction<{ id: string; updates: Partial<AiConversation> }>) => {
      const conversation = state.conversations.find(c => c.id === action.payload.id);
      if (conversation) {
        Object.assign(conversation, action.payload.updates);
        conversation.updatedAt = new Date();
      }
    },
    deleteConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter(c => c.id !== action.payload);
      if (state.activeConversationId === action.payload) {
        state.activeConversationId = state.conversations.length > 0 ? state.conversations[0].id : null;
      }
    },
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: Omit<AiMessage, 'id' | 'timestamp'> }>) => {
      const conversation = state.conversations.find(c => c.id === action.payload.conversationId);
      if (conversation) {
        const newMessage: AiMessage = {
          ...action.payload.message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };
        
        conversation.messages.push(newMessage);
        conversation.updatedAt = new Date();
        
        // Auto-generate title from first user message
        if (conversation.messages.length === 1 && newMessage.role === 'user') {
          conversation.title = newMessage.content.slice(0, 50) + (newMessage.content.length > 50 ? '...' : '');
        }
      }
    },
    updateMessage: (state, action: PayloadAction<{ conversationId: string; messageId: string; updates: Partial<AiMessage> }>) => {
      const conversation = state.conversations.find(c => c.id === action.payload.conversationId);
      if (conversation) {
        const message = conversation.messages.find(m => m.id === action.payload.messageId);
        if (message) {
          Object.assign(message, action.payload.updates);
          conversation.updatedAt = new Date();
        }
      }
    },
    deleteMessage: (state, action: PayloadAction<{ conversationId: string; messageId: string }>) => {
      const conversation = state.conversations.find(c => c.id === action.payload.conversationId);
      if (conversation) {
        conversation.messages = conversation.messages.filter(m => m.id !== action.payload.messageId);
        conversation.updatedAt = new Date();
      }
    },
    updateSettings: (state, action: PayloadAction<Partial<typeof initialState.settings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    updateUsage: (state, action: PayloadAction<{ tokens?: number; requests?: number }>) => {
      if (action.payload.tokens) {
        state.usage.tokensUsed += action.payload.tokens;
      }
      if (action.payload.requests) {
        state.usage.requestsCount += action.payload.requests;
      }
    },
    resetUsage: (state) => {
      state.usage = {
        ...state.usage,
        tokensUsed: 0,
        requestsCount: 0,
        lastResetDate: new Date(),
      };
    },
    setSuggestions: (state, action: PayloadAction<typeof initialState.suggestions>) => {
      state.suggestions = action.payload;
    },
    addSuggestion: (state, action: PayloadAction<Omit<typeof initialState.suggestions[0], 'id'>>) => {
      const newSuggestion = {
        ...action.payload,
        id: `sug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      state.suggestions.push(newSuggestion);
    },
    removeSuggestion: (state, action: PayloadAction<string>) => {
      state.suggestions = state.suggestions.filter(s => s.id !== action.payload);
    },
    clearSuggestions: (state) => {
      state.suggestions = [];
    },
    setContextFiles: (state, action: PayloadAction<string[]>) => {
      state.contextFiles = action.payload;
    },
    addContextFile: (state, action: PayloadAction<string>) => {
      if (!state.contextFiles.includes(action.payload)) {
        state.contextFiles.push(action.payload);
      }
    },
    removeContextFile: (state, action: PayloadAction<string>) => {
      state.contextFiles = state.contextFiles.filter(f => f !== action.payload);
    },
    clearContextFiles: (state) => {
      state.contextFiles = [];
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isStreaming = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetAi: (state) => {
      state.conversations = [];
      state.activeConversationId = null;
      state.isLoading = false;
      state.isStreaming = false;
      state.error = null;
      state.suggestions = [];
      state.contextFiles = [];
    },
  },
});

export const {
  setLoading,
  setStreaming,
  setConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  setActiveConversation,
  addMessage,
  updateMessage,
  deleteMessage,
  updateSettings,
  updateUsage,
  resetUsage,
  setSuggestions,
  addSuggestion,
  removeSuggestion,
  clearSuggestions,
  setContextFiles,
  addContextFile,
  removeContextFile,
  clearContextFiles,
  setError,
  clearError,
  resetAi,
} = aiSlice.actions;