import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { fileSystemSlice } from '@/store/fileSystem';
import { aiSlice } from '@/store/ai';
import { Button } from '@/components/ui/Button';
import { SendIcon, AttachIcon, MicIcon, StopIcon } from '@/components/ui/Icons';

const InputContainer = styled.div<{ theme: string }>`
  padding: 12px;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
`;

const InputWrapper = styled.div<{ 
  theme: string; 
  isFocused: boolean; 
  hasContext: boolean;
}>`
  border: 1px solid ${props => {
    if (props.isFocused) return props.theme === 'dark' ? '#007acc' : '#0277bd';
    if (props.hasContext) return props.theme === 'dark' ? '#4a9eff' : '#2196f3';
    return props.theme === 'dark' ? '#3e3e42' : '#e0e0e0';
  }};
  border-radius: 8px;
  background-color: ${props => props.theme === 'dark' ? '#2d2d30' : '#f5f5f5'};
  transition: border-color 0.2s, background-color 0.2s;
  overflow: hidden;
`;

const ContextFiles = styled.div<{ theme: string }>`
  padding: 8px 12px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e0e0e0'};
  background-color: ${props => props.theme === 'dark' ? '#252526' : '#fafafa'};
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const ContextFile = styled.div<{ theme: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: ${props => props.theme === 'dark' ? '#0e4f79' : '#e3f2fd'};
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#1565c0'};
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
`;

const RemoveContextButton = styled.button<{ theme: string }>`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
  }
`;

const InputRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 12px;
`;

const TextAreaWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const TextArea = styled.textarea<{ theme: string }>`
  width: 100%;
  min-height: 20px;
  max-height: 120px;
  padding: 8px 0;
  border: none;
  outline: none;
  background: transparent;
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#333333'};
  font-size: 14px;
  font-family: inherit;
  resize: none;
  line-height: 1.4;
  
  &::placeholder {
    color: ${props => props.theme === 'dark' ? '#6c6c6c' : '#999999'};
  }
`;

const InputActions = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const CharCount = styled.div<{ 
  theme: string; 
  isNearLimit: boolean;
  isOverLimit: boolean;
}>`
  font-size: 11px;
  color: ${props => {
    if (props.isOverLimit) return '#f44336';
    if (props.isNearLimit) return '#ff9800';
    return props.theme === 'dark' ? '#858585' : '#6c757d';
  }};
  margin-right: 8px;
`;

const Suggestions = styled.div<{ theme: string }>`
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const SuggestionChip = styled.button<{ theme: string }>`
  padding: 6px 12px;
  border: 1px solid ${props => props.theme === 'dark' ? '#4a5568' : '#cbd5e0'};
  border-radius: 16px;
  background-color: transparent;
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#2d3748'};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#4a5568' : '#e2e8f0'};
    border-color: ${props => props.theme === 'dark' ? '#6b7280' : '#9ca3af'};
  }
`;

interface ChatInputProps {
  onSendMessage: (message: string, context?: string[]) => void;
  isLoading: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  placeholder = "Type your message..."
}) => {
  const dispatch = useAppDispatch();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const { theme } = useAppSelector(state => state.ui);
  const { contextFiles } = useAppSelector(state => state.ai);
  const { selectedFile } = useAppSelector(state => state.fileSystem);
  
  const maxLength = 8000;
  const isNearLimit = message.length > maxLength * 0.8;
  const isOverLimit = message.length > maxLength;

  // Auto-resize textarea
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Focus on mount
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!message.trim() || isLoading || isOverLimit) return;
    
    const finalMessage = message.trim();
    const context = contextFiles.length > 0 ? contextFiles : undefined;
    
    onSendMessage(finalMessage, context);
    setMessage('');
    
    // Clear context files after sending
    if (contextFiles.length > 0) {
      dispatch(aiSlice.actions.clearContextFiles());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAddCurrentFile = () => {
    if (selectedFile && !contextFiles.includes(selectedFile)) {
      dispatch(aiSlice.actions.addContextFile(selectedFile));
    }
  };

  const handleRemoveContext = (filePath: string) => {
    dispatch(aiSlice.actions.removeContextFile(filePath));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    textAreaRef.current?.focus();
  };

  const suggestions = [
    "Explain this code",
    "Find bugs in this file",
    "Add comments to this code",
    "Refactor this function",
    "Write unit tests",
    "Optimize this code"
  ];

  return (
    <InputContainer theme={theme}>
      <InputWrapper 
        theme={theme} 
        isFocused={isFocused}
        hasContext={contextFiles.length > 0}
      >
        {contextFiles.length > 0 && (
          <ContextFiles theme={theme}>
            {contextFiles.map((filePath) => {
              const fileName = filePath.split('/').pop() || filePath;
              return (
                <ContextFile key={filePath} theme={theme}>
                  📄 {fileName}
                  <RemoveContextButton
                    theme={theme}
                    onClick={() => handleRemoveContext(filePath)}
                  >
                    ×
                  </RemoveContextButton>
                </ContextFile>
              );
            })}
          </ContextFiles>
        )}
        
        <InputRow>
          <TextAreaWrapper>
            <TextArea
              ref={textAreaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              theme={theme}
              maxLength={maxLength}
            />
          </TextAreaWrapper>
          
          <InputActions>
            <CharCount
              theme={theme}
              isNearLimit={isNearLimit}
              isOverLimit={isOverLimit}
            >
              {message.length}/{maxLength}
            </CharCount>
            
            {selectedFile && !contextFiles.includes(selectedFile) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddCurrentFile}
                title="Add current file to context"
              >
                <AttachIcon size={16} />
              </Button>
            )}
            
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={!message.trim() || isLoading || isOverLimit}
              title="Send message (Enter)"
            >
              {isLoading ? <StopIcon size={16} /> : <SendIcon size={16} />}
            </Button>
          </InputActions>
        </InputRow>
      </InputWrapper>
      
      {message.length === 0 && (
        <Suggestions theme={theme}>
          {suggestions.map((suggestion) => (
            <SuggestionChip
              key={suggestion}
              theme={theme}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </SuggestionChip>
          ))}
        </Suggestions>
      )}
    </InputContainer>
  );
};