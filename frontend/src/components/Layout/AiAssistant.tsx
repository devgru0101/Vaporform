import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { aiSlice, AiMessage } from '@/store/ai';
import { useAiService } from '@/services/ai';
import './AiAssistant.css';

export const AiAssistant: React.FC = () => {
  const dispatch = useAppDispatch();
  const aiService = useAiService();
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'settings'>('chat');
  const [inputValue, setInputValue] = useState('');
  
  // Get AI state from Redux
  const { 
    conversations, 
    activeConversationId, 
    isLoading, 
    isStreaming, 
    error,
    settings 
  } = useAppSelector(state => state.ai);
  
  const { token } = useAppSelector(state => state.auth);
  
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  // Initialize with a default conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      dispatch(aiSlice.actions.createConversation({ title: 'Welcome Chat' }));
    }
  }, [conversations.length, dispatch]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !token) return;
    
    const messageContent = inputValue;
    setInputValue('');
    
    // Get or create active conversation
    let conversationId = activeConversationId;
    if (!conversationId) {
      dispatch(aiSlice.actions.createConversation({ title: 'New Chat' }));
      conversationId = conversations[0]?.id || 'temp-id';
    }
    
    if (!conversationId) return;

    // Add user message
    dispatch(aiSlice.actions.addMessage({
      conversationId,
      message: {
        role: 'user',
        content: messageContent,
      }
    }));

    try {
      dispatch(aiSlice.actions.setLoading(true));
      
      // Send message to AI service
      const response = await aiService.sendMessage({
        conversationId,
        message: messageContent,
        context: [], // TODO: Add current file context
        settings
      });

      // Add AI response
      dispatch(aiSlice.actions.addMessage({
        conversationId,
        message: {
          role: 'assistant',
          content: response.content,
          metadata: response.metadata
        }
      }));
      
    } catch (error) {
      dispatch(aiSlice.actions.setError(
        error instanceof Error ? error.message : 'Failed to send message'
      ));
    } finally {
      dispatch(aiSlice.actions.setLoading(false));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <aside className="vf-ai-assistant">
      <div className="vf-ai-header">
        <div className="vf-ai-title">
          <svg className="vf-icon vf-icon-sm" viewBox="0 0 24 24">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 1 1 12 2z"/>
          </svg>
          AI ASSISTANT
        </div>
        <button className="vf-btn vf-btn-ghost">
          <svg className="vf-icon vf-icon-sm" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      
      <div className="vf-ai-tabs">
        <button 
          className={`vf-ai-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
        <button 
          className={`vf-ai-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button 
          className={`vf-ai-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>
      
      {activeTab === 'chat' && (
        <>
          <div className="vf-chat-area">
            {messages.length === 0 && (
              <div className="vf-chat-welcome">
                <div className="vf-welcome-message">
                  <h3>Welcome to Vaporform AI Assistant</h3>
                  <p>I'm here to help with your development tasks. Ask me anything about:</p>
                  <ul>
                    <li>Code optimization and debugging</li>
                    <li>Architecture and design patterns</li>
                    <li>Documentation and testing</li>
                    <li>Technology recommendations</li>
                  </ul>
                </div>
              </div>
            )}
            
            {messages.map(message => (
              <div key={message.id} className={`vf-chat-message ${message.role}`}>
                <div className="vf-message-label">
                  {message.role === 'user' ? 'YOU' : 'CLAUDE'}
                </div>
                <div className="vf-message-content">
                  {message.content}
                  {message.metadata?.codeBlocks?.map((block, index) => (
                    <div key={index} className="vf-code-block">
                      <div className="vf-code-block-header">
                        <span className="vf-code-language">{block.language}</span>
                        {block.fileName && <span className="vf-code-filename">{block.fileName}</span>}
                      </div>
                      <pre className="vf-code-content">
                        <code>{block.code}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="vf-chat-message assistant">
                <div className="vf-message-label">CLAUDE</div>
                <div className="vf-message-content">
                  <div className="vf-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="vf-chat-error">
                <span className="vf-error-icon">⚠</span>
                {error}
                <button 
                  className="vf-error-dismiss"
                  onClick={() => dispatch(aiSlice.actions.clearError())}
                >
                  ×
                </button>
              </div>
            )}
          </div>
          
          <div className="vf-chat-input-container">
            <textarea 
              className="vf-chat-input"
              placeholder="Ask Claude anything..."
              rows={3}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <div className="vf-chat-actions">
              <div className="vf-chat-helpers">
                <button className="vf-helper-btn">
                  <svg className="vf-icon vf-icon-sm" viewBox="0 0 24 24">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
                <button className="vf-helper-btn">
                  <svg className="vf-icon vf-icon-sm" viewBox="0 0 24 24">
                    <polyline points="16 18 22 12 16 6"/>
                    <polyline points="8 6 2 12 8 18"/>
                  </svg>
                  Code
                </button>
                <button className="vf-helper-btn">
                  <svg className="vf-icon vf-icon-sm" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Context
                </button>
              </div>
              <button className="vf-send-btn" onClick={handleSendMessage}>
                Send →
              </button>
            </div>
          </div>
        </>
      )}
      
      {activeTab === 'history' && (
        <div className="vf-ai-content">
          <div className="vf-conversation-list">
            {conversations.length === 0 ? (
              <div className="vf-text-muted vf-p-4">
                No conversations yet. Start chatting to see your conversation history.
              </div>
            ) : (
              conversations.map(conversation => (
                <div 
                  key={conversation.id} 
                  className={`vf-conversation-item ${conversation.id === activeConversationId ? 'active' : ''}`}
                  onClick={() => dispatch(aiSlice.actions.setActiveConversation(conversation.id))}
                >
                  <div className="vf-conversation-title">{conversation.title}</div>
                  <div className="vf-conversation-meta">
                    {conversation.messages.length} messages • {new Date(conversation.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'settings' && (
        <div className="vf-ai-content">
          <div className="vf-ai-settings">
            <div className="vf-setting-group">
              <label className="vf-setting-label">Model</label>
              <select 
                className="vf-input vf-setting-input"
                value={settings.model}
                onChange={(e) => dispatch(aiSlice.actions.updateSettings({ model: e.target.value }))}
              >
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
              </select>
            </div>
            
            <div className="vf-setting-group">
              <label className="vf-setting-label">Temperature ({settings.temperature})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                className="vf-setting-slider"
                value={settings.temperature}
                onChange={(e) => dispatch(aiSlice.actions.updateSettings({ temperature: parseFloat(e.target.value) }))}
              />
            </div>
            
            <div className="vf-setting-group">
              <label className="vf-setting-label">Max Tokens</label>
              <input
                type="number"
                min="100"
                max="8192"
                className="vf-input vf-setting-input"
                value={settings.maxTokens}
                onChange={(e) => dispatch(aiSlice.actions.updateSettings({ maxTokens: parseInt(e.target.value) }))}
              />
            </div>
            
            <div className="vf-setting-group">
              <label className="vf-setting-checkbox">
                <input
                  type="checkbox"
                  checked={settings.enableCodeGeneration}
                  onChange={(e) => dispatch(aiSlice.actions.updateSettings({ enableCodeGeneration: e.target.checked }))}
                />
                Enable code generation
              </label>
            </div>
            
            <div className="vf-setting-group">
              <label className="vf-setting-checkbox">
                <input
                  type="checkbox"
                  checked={settings.enableFileContext}
                  onChange={(e) => dispatch(aiSlice.actions.updateSettings({ enableFileContext: e.target.checked }))}
                />
                Include file context
              </label>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};