import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from '@emotion/styled';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { aiSlice } from '@/store/ai';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ConversationList } from './ConversationList';
import { AiSettings } from './AiSettings';
import { useAiService } from '@/services/ai';
import { Button } from '@/components/ui/Button';
import { NewChatIcon, SettingsIcon, HistoryIcon, ClearIcon, FileIcon, ImageIcon, CodeIcon, MicIcon } from '@/components/ui/Icons';

const AiChatContainer = styled.div<{ theme: string }>`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#333333'};
`;

const ChatHeader = styled.div<{ theme: string }>`
  padding: 12px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${props => props.theme === 'dark' ? '#252526' : '#f8f8f8'};
`;

const HeaderTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 4px;
`;

const ChatMessages = styled.div<{ theme: string }>`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme === 'dark' ? '#2d2d30' : '#f1f1f1'};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme === 'dark' ? '#424242' : '#c1c1c1'};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme === 'dark' ? '#555555' : '#a8a8a8'};
  }
`;

const EmptyState = styled.div<{ theme: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 24px;
  color: ${props => props.theme === 'dark' ? '#858585' : '#6c757d'};
`;

const EmptyStateIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyStateText = styled.div`
  font-size: 14px;
  margin-bottom: 8px;
`;

const EmptyStateSubtext = styled.div`
  font-size: 12px;
  opacity: 0.7;
`;

const ChatInputContainer = styled.div<{ theme: string }>`
  border-top: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  background-color: ${props => props.theme === 'dark' ? '#252526' : '#f8f8f8'};
`;

const ViewToggle = styled.div<{ theme: string }>`
  display: flex;
  background-color: ${props => props.theme === 'dark' ? '#2d2d30' : '#f3f3f3'};
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ViewButton = styled.button<{ isActive: boolean; theme: string }>`
  flex: 1;
  padding: 6px 12px;
  font-size: 12px;
  border: none;
  cursor: pointer;
  background-color: ${props => props.isActive 
    ? (props.theme === 'dark' ? '#094771' : '#e3f2fd')
    : 'transparent'
  };
  color: ${props => props.isActive 
    ? (props.theme === 'dark' ? '#ffffff' : '#1976d2')
    : (props.theme === 'dark' ? '#cccccc' : '#666666')
  };
  
  &:hover {
    background-color: ${props => props.isActive 
      ? (props.theme === 'dark' ? '#0e5a8a' : '#bbdefb')
      : (props.theme === 'dark' ? '#3e3e42' : '#e8e8e8')
    };
  }
`;

const MultiModalBar = styled.div<{ theme: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  background-color: ${props => props.theme === 'dark' ? '#252526' : '#f8f8f8'};
`;

const ModalButton = styled.button<{ active?: boolean; theme: string }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  background-color: ${props => props.active 
    ? (props.theme === 'dark' ? '#094771' : '#e3f2fd')
    : 'transparent'
  };
  color: ${props => props.active 
    ? (props.theme === 'dark' ? '#ffffff' : '#1976d2')
    : (props.theme === 'dark' ? '#cccccc' : '#666666')
  };
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#3e3e42' : '#e8e8e8'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AttachmentPreview = styled.div<{ theme: string }>`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
`;

const AttachmentItem = styled.div<{ theme: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  border-radius: 4px;
  background-color: ${props => props.theme === 'dark' ? '#2d2d30' : '#f8f8f8'};
  font-size: 12px;
  max-width: 200px;
`;

const AttachmentName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`;

const RemoveAttachment = styled.button<{ theme: string }>`
  background: none;
  border: none;
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#666666'};
  cursor: pointer;
  padding: 2px;
  border-radius: 2px;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#3e3e42' : '#e8e8e8'};
  }
`;

const ContextPanel = styled.div<{ theme: string; visible: boolean }>`
  display: ${props => props.visible ? 'block' : 'none'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  background-color: ${props => props.theme === 'dark' ? '#252526' : '#f8f8f8'};
  max-height: 200px;
  overflow-y: auto;
`;

const ContextItem = styled.div<{ theme: string; selected: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.selected 
    ? (props.theme === 'dark' ? '#094771' : '#e3f2fd')
    : 'transparent'
  };
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#3e3e42' : '#e8e8e8'};
  }
`;

const VoiceIndicator = styled.div<{ recording: boolean; theme: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  background-color: ${props => props.recording 
    ? (props.theme === 'dark' ? '#4a1a1a' : '#ffebee')
    : (props.theme === 'dark' ? '#252526' : '#f8f8f8')
  };
  color: ${props => props.recording 
    ? (props.theme === 'dark' ? '#ff6b6b' : '#d32f2f')
    : (props.theme === 'dark' ? '#cccccc' : '#666666')
  };
  font-size: 12px;
  
  ${props => props.recording && `
    animation: pulse 2s infinite;
  `}
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
`;

const SmartSuggestions = styled.div<{ theme: string }>`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  background-color: ${props => props.theme === 'dark' ? '#252526' : '#f8f8f8'};
`;

const SuggestionChip = styled.button<{ theme: string }>`
  padding: 4px 8px;
  border: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  border-radius: 12px;
  background-color: ${props => props.theme === 'dark' ? '#2d2d30' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#666666'};
  font-size: 11px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#3e3e42' : '#f0f0f0'};
    border-color: ${props => props.theme === 'dark' ? '#007ACC' : '#007ACC'};
  }
`;

type ViewMode = 'chat' | 'conversations' | 'settings';

interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'image' | 'code';
  content: string;
  size?: number;
  preview?: string;
}

interface ContextItem {
  id: string;
  type: 'file' | 'function' | 'class' | 'variable';
  name: string;
  content: string;
  location?: string;
}

export const AiChatPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const aiService = useAiService();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  
  // Multi-modal state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [selectedContext, setSelectedContext] = useState<ContextItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [fileContextEnabled, setFileContextEnabled] = useState(true);
  const [projectContextEnabled, setProjectContextEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  const { theme } = useAppSelector(state => state.ui);
  const { 
    conversations, 
    activeConversationId, 
    isLoading, 
    isStreaming,
    error,
    settings 
  } = useAppSelector(state => state.ai);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const { tabs, activeTabId } = useAppSelector(state => state.editor);
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages]);

  // Generate smart suggestions based on current context
  useEffect(() => {
    if (activeTab && fileContextEnabled) {
      generateSmartSuggestions();
    }
  }, [activeTab, fileContextEnabled]);

  // Multi-modal handlers
  const handleFileAttachment = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(async (file) => {
      const content = await readFileContent(file);
      const attachment: Attachment = {
        id: `attach_${Date.now()}_${Math.random()}`,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        content,
        size: file.size,
        preview: file.type.startsWith('image/') ? content : undefined
      };
      
      setAttachments(prev => [...prev, attachment]);
    });

    // Reset input
    event.target.value = '';
  }, []);

  const handleCodeAttachment = useCallback(() => {
    if (!activeTab) return;

    const attachment: Attachment = {
      id: `code_${Date.now()}`,
      name: activeTab.filePath.split('/').pop() || 'current_file',
      type: 'code',
      content: activeTab.content,
      preview: activeTab.content.slice(0, 200) + '...'
    };

    setAttachments(prev => [...prev, attachment]);
  }, [activeTab]);

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  }, []);

  const handleVoiceToggle = useCallback(async () => {
    if (!voiceEnabled) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setVoiceEnabled(true);
      } catch (error) {
        console.error('Microphone access denied:', error);
        return;
      }
    }

    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setRecordingTime(0);
      // TODO: Process voice input
    } else {
      // Start recording
      setIsRecording(true);
      // TODO: Start voice recording
    }
  }, [voiceEnabled, isRecording]);

  const toggleContextPanel = useCallback(() => {
    setShowContextPanel(prev => !prev);
    if (!showContextPanel && fileContextEnabled) {
      loadAvailableContext();
    }
  }, [showContextPanel, fileContextEnabled]);

  const handleContextSelect = useCallback((context: ContextItem) => {
    setSelectedContext(prev => {
      const exists = prev.find(c => c.id === context.id);
      if (exists) {
        return prev.filter(c => c.id !== context.id);
      } else {
        return [...prev, context];
      }
    });
  }, []);

  const generateSmartSuggestions = useCallback(async () => {
    if (!activeTab) return;

    const suggestions = [
      "Explain this code",
      "Find potential bugs",
      "Suggest improvements",
      "Generate tests",
      "Add documentation",
      "Optimize performance"
    ];

    // Add context-specific suggestions
    if (activeTab.language === 'javascript' || activeTab.language === 'typescript') {
      suggestions.push("Convert to TypeScript", "Add JSDoc comments");
    }

    if (activeTab.content.includes('function') || activeTab.content.includes('const')) {
      suggestions.push("Refactor this function");
    }

    setSmartSuggestions(suggestions.slice(0, 6));
  }, [activeTab]);

  const loadAvailableContext = useCallback(async () => {
    const contextItems: ContextItem[] = [];

    // Add current file context
    if (activeTab && fileContextEnabled) {
      contextItems.push({
        id: `file_${activeTab.id}`,
        type: 'file',
        name: activeTab.filePath.split('/').pop() || 'current_file',
        content: activeTab.content,
        location: activeTab.filePath
      });
    }

    // Add project context (simplified - would normally parse AST)
    if (projectContextEnabled) {
      tabs.forEach(tab => {
        if (tab.id !== activeTabId) {
          contextItems.push({
            id: `project_file_${tab.id}`,
            type: 'file',
            name: tab.filePath.split('/').pop() || tab.filePath,
            content: tab.content.slice(0, 500) + '...',
            location: tab.filePath
          });
        }
      });
    }

    setSelectedContext([]);
  }, [activeTab, fileContextEnabled, projectContextEnabled, tabs, activeTabId]);

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = reject;
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleNewConversation = () => {
    dispatch(aiSlice.actions.createConversation({}));
    setViewMode('chat');
  };

  const handleClearConversation = () => {
    if (activeConversationId) {
      dispatch(aiSlice.actions.updateConversation({
        id: activeConversationId,
        updates: { messages: [] }
      }));
    }
  };

  const handleSendMessage = async (content: string, context?: string[]) => {
    if (!activeConversationId) {
      // Create new conversation if none exists
      dispatch(aiSlice.actions.createConversation({}));
      return;
    }

    try {
      // Prepare enhanced context with attachments and selected context
      const enhancedContext = [...(context || [])];
      
      // Add attachment content to context
      attachments.forEach(attachment => {
        enhancedContext.push(`[${attachment.type.toUpperCase()}: ${attachment.name}]\n${attachment.content}`);
      });
      
      // Add selected context items
      selectedContext.forEach(contextItem => {
        enhancedContext.push(`[${contextItem.type.toUpperCase()}: ${contextItem.name}]\n${contextItem.content}`);
      });

      // Add current file context if enabled
      if (fileContextEnabled && activeTab && !selectedContext.find(c => c.id === `file_${activeTab.id}`)) {
        enhancedContext.push(`[CURRENT_FILE: ${activeTab.filePath}]\n${activeTab.content}`);
      }

      // Prepare message metadata
      const messageMetadata = {
        context: enhancedContext,
        attachments: attachments.map(att => ({
          id: att.id,
          name: att.name,
          type: att.type,
          size: att.size
        })),
        fileContext: fileContextEnabled,
        projectContext: projectContextEnabled,
        voiceInput: isRecording
      };

      // Add user message
      dispatch(aiSlice.actions.addMessage({
        conversationId: activeConversationId,
        message: {
          role: 'user',
          content,
          metadata: messageMetadata
        }
      }));

      // Send to AI service with enhanced context
      dispatch(aiSlice.actions.setStreaming(true));
      
      const response = await aiService.sendMessage({
        conversationId: activeConversationId,
        message: content,
        context: enhancedContext,
        settings: {
          ...settings,
          enableFileContext: fileContextEnabled,
          enableProjectContext: projectContextEnabled
        }
      });

      // Add assistant response
      dispatch(aiSlice.actions.addMessage({
        conversationId: activeConversationId,
        message: {
          role: 'assistant',
          content: response.content,
          metadata: {
            ...response.metadata,
            contextUsed: enhancedContext.length > 0,
            attachmentsProcessed: attachments.length
          }
        }
      }));

      // Update usage
      if (response.metadata?.tokens) {
        dispatch(aiSlice.actions.updateUsage({ 
          tokens: response.metadata.tokens,
          requests: 1
        }));
      }

      // Clear attachments after sending
      setAttachments([]);
      setSelectedContext([]);

    } catch (error) {
      console.error('Failed to send message:', error);
      dispatch(aiSlice.actions.setError(error instanceof Error ? error.message : 'Failed to send message'));
    } finally {
      dispatch(aiSlice.actions.setStreaming(false));
    }
  };

  const handleSuggestionClick = useCallback((suggestion: string) => {
    if (activeConversationId) {
      handleSendMessage(suggestion);
    }
  }, [activeConversationId, handleSendMessage]);

  const renderContent = () => {
    switch (viewMode) {
      case 'conversations':
        return <ConversationList />;
      case 'settings':
        return <AiSettings />;
      default:
        return (
          <>
            {/* Multi-modal toolbar */}
            <MultiModalBar theme={theme}>
              <ModalButton
                theme={theme}
                onClick={handleFileAttachment}
                title="Attach files or images"
              >
                <FileIcon size={14} />
                Files
              </ModalButton>
              
              <ModalButton
                theme={theme}
                onClick={handleCodeAttachment}
                disabled={!activeTab}
                title="Attach current code file"
              >
                <CodeIcon size={14} />
                Code
              </ModalButton>
              
              <ModalButton
                theme={theme}
                active={showContextPanel}
                onClick={toggleContextPanel}
                title="Project context"
              >
                Context ({selectedContext.length})
              </ModalButton>
              
              <ModalButton
                theme={theme}
                active={fileContextEnabled}
                onClick={() => setFileContextEnabled(!fileContextEnabled)}
                title="Include current file in context"
              >
                File Context
              </ModalButton>
              
              <ModalButton
                theme={theme}
                onClick={handleVoiceToggle}
                disabled={!voiceEnabled && !isRecording}
                title={isRecording ? "Stop recording" : "Voice input"}
              >
                <MicIcon size={14} />
                {isRecording ? 'Recording...' : 'Voice'}
              </ModalButton>
            </MultiModalBar>

            {/* Voice recording indicator */}
            {isRecording && (
              <VoiceIndicator recording={isRecording} theme={theme}>
                🎤 Recording... {Math.floor(recordingTime / 1000)}s
                <ModalButton theme={theme} onClick={handleVoiceToggle}>
                  Stop
                </ModalButton>
              </VoiceIndicator>
            )}

            {/* Smart suggestions */}
            {smartSuggestions.length > 0 && (
              <SmartSuggestions theme={theme}>
                {smartSuggestions.map((suggestion, index) => (
                  <SuggestionChip
                    key={index}
                    theme={theme}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </SuggestionChip>
                ))}
              </SmartSuggestions>
            )}

            {/* Attachments preview */}
            {attachments.length > 0 && (
              <AttachmentPreview theme={theme}>
                {attachments.map((attachment) => (
                  <AttachmentItem key={attachment.id} theme={theme}>
                    {attachment.type === 'image' ? <ImageIcon size={14} /> : 
                     attachment.type === 'code' ? <CodeIcon size={14} /> : 
                     <FileIcon size={14} />}
                    <AttachmentName>{attachment.name}</AttachmentName>
                    <RemoveAttachment
                      theme={theme}
                      onClick={() => handleRemoveAttachment(attachment.id)}
                    >
                      ×
                    </RemoveAttachment>
                  </AttachmentItem>
                ))}
              </AttachmentPreview>
            )}

            {/* Context panel */}
            <ContextPanel theme={theme} visible={showContextPanel}>
              {tabs.map(tab => (
                <ContextItem
                  key={tab.id}
                  theme={theme}
                  selected={selectedContext.some(c => c.id === `project_file_${tab.id}`)}
                  onClick={() => handleContextSelect({
                    id: `project_file_${tab.id}`,
                    type: 'file',
                    name: tab.filePath.split('/').pop() || tab.filePath,
                    content: tab.content.slice(0, 500) + '...',
                    location: tab.filePath
                  })}
                >
                  <FileIcon size={14} />
                  {tab.filePath.split('/').pop() || tab.filePath}
                  {tab.isDirty && ' (modified)'}
                </ContextItem>
              ))}
            </ContextPanel>

            <ChatMessages theme={theme}>
              {!activeConversation || activeConversation.messages.length === 0 ? (
                <EmptyState theme={theme}>
                  <EmptyStateIcon>🤖</EmptyStateIcon>
                  <EmptyStateText>Start a conversation with Claude</EmptyStateText>
                  <EmptyStateSubtext>
                    Ask questions, get code help, or discuss your project.
                    Use the toolbar above to attach files and add context.
                  </EmptyStateSubtext>
                </EmptyState>
              ) : (
                <>
                  {activeConversation.messages.map((message) => (
                    <ChatMessage 
                      key={message.id} 
                      message={message} 
                    />
                  ))}
                  {isStreaming && (
                    <ChatMessage 
                      message={{
                        id: 'loading',
                        role: 'assistant',
                        content: '...',
                        timestamp: new Date()
                      }}
                      isLoading
                    />
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </ChatMessages>

            <ChatInputContainer theme={theme}>
              <ChatInput 
                onSendMessage={handleSendMessage}
                isLoading={isLoading || isStreaming}
                placeholder={
                  attachments.length > 0 || selectedContext.length > 0 
                    ? `Ask about your ${attachments.length + selectedContext.length} attached item(s)...`
                    : "Ask Claude anything..."
                }
              />
            </ChatInputContainer>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.md,.png,.jpg,.jpeg,.gif"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </>
        );
    }
  };

  return (
    <AiChatContainer theme={theme}>
      <ChatHeader theme={theme}>
        <HeaderTitle>AI Assistant</HeaderTitle>
        <HeaderActions>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewConversation}
            title="New Conversation"
          >
            <NewChatIcon size={16} />
          </Button>
          {activeConversation && activeConversation.messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearConversation}
              title="Clear Conversation"
            >
              <ClearIcon size={16} />
            </Button>
          )}
        </HeaderActions>
      </ChatHeader>

      <ViewToggle theme={theme}>
        <ViewButton
          isActive={viewMode === 'chat'}
          theme={theme}
          onClick={() => setViewMode('chat')}
        >
          Chat
        </ViewButton>
        <ViewButton
          isActive={viewMode === 'conversations'}
          theme={theme}
          onClick={() => setViewMode('conversations')}
        >
          History
        </ViewButton>
        <ViewButton
          isActive={viewMode === 'settings'}
          theme={theme}
          onClick={() => setViewMode('settings')}
        >
          Settings
        </ViewButton>
      </ViewToggle>

      {renderContent()}
    </AiChatContainer>
  );
};