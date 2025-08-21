import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useAppSelector } from '@/hooks/redux';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Button } from '@/components/ui/Button';
import { CopyIcon, EditIcon, DeleteIcon } from '@/components/ui/Icons';
import type { AiMessage } from '@/store/ai';

const MessageContainer = styled.div<{ 
  role: 'user' | 'assistant' | 'system'; 
  theme: string;
}>`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  opacity: ${props => props.role === 'system' ? 0.8 : 1};
`;

const Avatar = styled.div<{ 
  role: 'user' | 'assistant' | 'system'; 
  theme: string;
}>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  
  ${props => {
    if (props.role === 'user') {
      return `
        background-color: ${props.theme === 'dark' ? '#0e4f79' : '#1976d2'};
        color: white;
      `;
    } else if (props.role === 'assistant') {
      return `
        background-color: ${props.theme === 'dark' ? '#4a5568' : '#6c757d'};
        color: white;
      `;
    } else {
      return `
        background-color: ${props.theme === 'dark' ? '#2d3748' : '#e9ecef'};
        color: ${props.theme === 'dark' ? '#e2e8f0' : '#495057'};
      `;
    }
  }}
`;

const MessageContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const MessageHeader = styled.div<{ theme: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#a0a0a0' : '#6c757d'};
`;

const MessageRole = styled.span`
  font-weight: 600;
  text-transform: capitalize;
`;

const MessageTime = styled.span`
  opacity: 0.7;
`;

const MessageActions = styled.div`
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  
  ${MessageContainer}:hover & {
    opacity: 1;
  }
`;

const MessageText = styled.div<{ theme: string }>`
  line-height: 1.5;
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#2d3748'};
  word-wrap: break-word;
  
  p {
    margin: 0 0 12px 0;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
  }
  
  li {
    margin: 4px 0;
  }
  
  blockquote {
    border-left: 3px solid ${props => props.theme === 'dark' ? '#4a5568' : '#cbd5e0'};
    padding-left: 12px;
    margin: 8px 0;
    font-style: italic;
    color: ${props => props.theme === 'dark' ? '#a0a0a0' : '#6c757d'};
  }
`;

const LoadingDots = styled.div<{ theme: string }>`
  display: flex;
  gap: 4px;
  align-items: center;
  
  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${props => props.theme === 'dark' ? '#4a5568' : '#6c757d'};
    animation: loading-dots 1.4s infinite ease-in-out;
    
    &:nth-of-type(1) { animation-delay: -0.32s; }
    &:nth-of-type(2) { animation-delay: -0.16s; }
    &:nth-of-type(3) { animation-delay: 0; }
  }
  
  @keyframes loading-dots {
    0%, 80%, 100% {
      opacity: 0.3;
      transform: scale(0.8);
    }
    40% {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const MetadataInfo = styled.div<{ theme: string }>`
  margin-top: 8px;
  padding: 8px;
  background-color: ${props => props.theme === 'dark' ? '#2d3748' : '#f7fafc'};
  border-radius: 4px;
  font-size: 11px;
  color: ${props => props.theme === 'dark' ? '#a0a0a0' : '#6c757d'};
  border: 1px solid ${props => props.theme === 'dark' ? '#4a5568' : '#e2e8f0'};
`;

interface ChatMessageProps {
  message: AiMessage;
  isLoading?: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLoading = false,
  onEdit,
  onDelete
}) => {
  const { theme } = useAppSelector(state => state.ui);
  const { user } = useAppSelector(state => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getAvatarContent = () => {
    switch (message.role) {
      case 'user':
        return user?.name?.charAt(0).toUpperCase() || 'U';
      case 'assistant':
        return '🤖';
      case 'system':
        return '⚙️';
      default:
        return '?';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  const handleEdit = () => {
    if (isEditing) {
      onEdit?.(message.id, editContent);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleDelete = () => {
    onDelete?.(message.id);
  };

  const parseMessageContent = (content: string) => {
    // Simple parsing for code blocks and markdown-like formatting
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    
    let parsedContent = content;
    const codeBlocks: Array<{ language: string; code: string; index: number }> = [];
    
    // Extract code blocks
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2];
      const index = codeBlocks.length;
      
      codeBlocks.push({ language, code, index });
      parsedContent = parsedContent.replace(match[0], `__CODE_BLOCK_${index}__`);
    }
    
    // Split content and render with code blocks
    const parts = parsedContent.split(/(__CODE_BLOCK_\d+__)/);
    
    return parts.map((part, index) => {
      const codeBlockMatch = part.match(/^__CODE_BLOCK_(\d+)__$/);
      if (codeBlockMatch) {
        const blockIndex = parseInt(codeBlockMatch[1]);
        const codeBlock = codeBlocks[blockIndex];
        return (
          <CodeBlock
            key={`code-${index}`}
            language={codeBlock.language}
            code={codeBlock.code}
          />
        );
      }
      
      // Handle inline code and basic formatting
      let formattedPart = part
        .replace(inlineCodeRegex, '<code>$1</code>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      return (
        <div 
          key={`text-${index}`}
          dangerouslySetInnerHTML={{ __html: formattedPart }}
        />
      );
    });
  };

  return (
    <MessageContainer role={message.role} theme={theme}>
      <Avatar role={message.role} theme={theme}>
        {getAvatarContent()}
      </Avatar>
      
      <MessageContent>
        <MessageHeader theme={theme}>
          <MessageRole>{message.role}</MessageRole>
          <MessageTime>{formatTime(message.timestamp)}</MessageTime>
          
          <MessageActions>
            <Button
              variant="ghost"
              size="xs"
              onClick={handleCopy}
              title="Copy message"
            >
              <CopyIcon size={12} />
            </Button>
            {message.role === 'user' && onEdit && (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleEdit}
                title={isEditing ? 'Save' : 'Edit message'}
              >
                <EditIcon size={12} />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleDelete}
                title="Delete message"
              >
                <DeleteIcon size={12} />
              </Button>
            )}
          </MessageActions>
        </MessageHeader>
        
        <MessageText theme={theme}>
          {isLoading ? (
            <LoadingDots theme={theme}>
              <span />
              <span />
              <span />
            </LoadingDots>
          ) : isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '8px',
                border: `1px solid ${theme === 'dark' ? '#4a5568' : '#cbd5e0'}`,
                borderRadius: '4px',
                backgroundColor: theme === 'dark' ? '#2d3748' : '#ffffff',
                color: theme === 'dark' ? '#e2e8f0' : '#2d3748',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleEdit();
                }
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditContent(message.content);
                }
              }}
            />
          ) : (
            parseMessageContent(message.content)
          )}
        </MessageText>
        
        {message.metadata && (
          <MetadataInfo theme={theme}>
            {message.metadata.tokens && `Tokens: ${message.metadata.tokens}`}
            {message.metadata.model && ` • Model: ${message.metadata.model}`}
            {message.metadata.context && ` • Context files: ${message.metadata.context.length}`}
          </MetadataInfo>
        )}
      </MessageContent>
    </MessageContainer>
  );
};