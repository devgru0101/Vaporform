import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from '@emotion/styled';
import { useAppSelector } from '@/hooks/redux';
import { aiService } from '@/services/ai';

const Overlay = styled.div<{ visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.visible ? 'flex' : 'none'};
  justify-content: center;
  align-items: flex-start;
  padding-top: 20vh;
  z-index: 9999;
`;

const PaletteContainer = styled.div<{ theme: string }>`
  background: ${props => props.theme === 'dark' ? '#2d2d30' : '#ffffff'};
  border: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e1e1e1'};
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 600px;
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const SearchInput = styled.input<{ theme: string }>`
  background: ${props => props.theme === 'dark' ? '#1e1e1e' : '#f8f8f8'};
  border: none;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e1e1e1'};
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#000000'};
  padding: 16px 20px;
  font-size: 16px;
  outline: none;
  
  &::placeholder {
    color: ${props => props.theme === 'dark' ? '#969696' : '#6f6f6f'};
  }
`;

const ResultsList = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
`;

const ResultItem = styled.div<{ selected: boolean; theme: string }>`
  padding: 12px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${props => props.selected ? 
    (props.theme === 'dark' ? '#094771' : '#e3f2fd') : 'transparent'};
  border-left: 3px solid ${props => props.selected ? '#007ACC' : 'transparent'};
  
  &:hover {
    background: ${props => props.theme === 'dark' ? '#2a2d2e' : '#f5f5f5'};
  }
`;

const ResultIcon = styled.div<{ type: string }>`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  
  &::before {
    content: ${props => {
      switch (props.type) {
        case 'command': return '"⚡"';
        case 'file': return '"📄"';
        case 'ai': return '"🤖"';
        case 'snippet': return '"📝"';
        case 'refactor': return '"🔧"';
        case 'generate': return '"✨"';
        default: return '"•"';
      }
    }};
  }
`;

const ResultContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ResultTitle = styled.div<{ theme: string }>`
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#000000'};
  font-weight: 500;
  font-size: 14px;
`;

const ResultDescription = styled.div<{ theme: string }>`
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#666666'};
  font-size: 12px;
  opacity: 0.8;
`;

const ResultShortcut = styled.div<{ theme: string }>`
  color: ${props => props.theme === 'dark' ? '#969696' : '#6f6f6f'};
  font-size: 12px;
  opacity: 0.7;
  min-width: 60px;
  text-align: right;
`;

const LoadingIndicator = styled.div<{ theme: string }>`
  padding: 20px;
  text-align: center;
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#666666'};
  font-size: 14px;
`;

const AIAssistantMode = styled.div<{ theme: string }>`
  background: ${props => props.theme === 'dark' ? '#1a472a' : '#e8f5e8'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#2d5a3d' : '#c8e6c9'};
  padding: 8px 20px;
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#81c784' : '#2e7d32'};
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '🤖';
  }
`;

interface CommandItem {
  id: string;
  type: 'command' | 'file' | 'ai' | 'snippet' | 'refactor' | 'generate';
  title: string;
  description: string;
  shortcut?: string;
  action: () => void | Promise<void>;
  relevance?: number;
}

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ visible, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommandItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { theme } = useAppSelector(state => state.ui);
  const { activeTabId, tabs } = useAppSelector(state => state.editor);
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // Built-in commands
  const builtInCommands: CommandItem[] = [
    {
      id: 'ai-analyze',
      type: 'ai',
      title: 'AI: Analyze Code',
      description: 'Analyze current file with AI for issues and improvements',
      shortcut: 'Ctrl+Alt+A',
      action: async () => {
        if (activeTab) {
          await analyzeCurrentFile();
        }
      }
    },
    {
      id: 'ai-refactor',
      type: 'refactor',
      title: 'AI: Refactor Selection',
      description: 'Refactor selected code using AI',
      shortcut: 'Ctrl+Alt+R',
      action: async () => {
        if (activeTab) {
          await refactorSelection();
        }
      }
    },
    {
      id: 'ai-generate-tests',
      type: 'generate',
      title: 'AI: Generate Tests',
      description: 'Generate unit tests for current file',
      action: async () => {
        if (activeTab) {
          await generateTests();
        }
      }
    },
    {
      id: 'ai-explain',
      type: 'ai',
      title: 'AI: Explain Code',
      description: 'Get AI explanation of selected code',
      action: async () => {
        if (activeTab) {
          await explainCode();
        }
      }
    },
    {
      id: 'ai-optimize',
      type: 'ai',
      title: 'AI: Optimize Performance',
      description: 'Get AI suggestions for performance optimization',
      action: async () => {
        if (activeTab) {
          await optimizePerformance();
        }
      }
    },
    {
      id: 'ai-generate-docs',
      type: 'generate',
      title: 'AI: Generate Documentation',
      description: 'Generate documentation for current code',
      action: async () => {
        if (activeTab) {
          await generateDocumentation();
        }
      }
    },
    {
      id: 'format-document',
      type: 'command',
      title: 'Format Document',
      description: 'Format the current document',
      shortcut: 'Shift+Alt+F',
      action: () => {
        // Trigger format action
        document.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'F',
          shiftKey: true,
          altKey: true
        }));
      }
    },
    {
      id: 'toggle-theme',
      type: 'command',
      title: 'Toggle Theme',
      description: 'Switch between light and dark theme',
      action: () => {
        // Toggle theme action
      }
    }
  ];

  // AI-powered search and suggestions
  const searchWithAI = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(builtInCommands);
      return;
    }

    setLoading(true);
    try {
      // Check if query starts with AI indicator
      const isAIQuery = searchQuery.startsWith('@ai') || searchQuery.startsWith('>ai');
      setAiMode(isAIQuery);

      if (isAIQuery) {
        // AI-powered natural language command processing
        const aiQuery = searchQuery.replace(/^[@>]ai\s*/, '');
        const aiCommands = await generateAICommands(aiQuery);
        setResults([...aiCommands, ...filterBuiltInCommands(searchQuery)]);
      } else {
        // Regular fuzzy search
        const filtered = filterBuiltInCommands(searchQuery);
        setResults(filtered);
      }
    } catch (error) {
      console.error('Command search failed:', error);
      setResults(filterBuiltInCommands(searchQuery));
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const filterBuiltInCommands = (searchQuery: string): CommandItem[] => {
    const query = searchQuery.toLowerCase();
    return builtInCommands
      .filter(cmd => 
        cmd.title.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query) ||
        cmd.type.includes(query)
      )
      .sort((a, b) => {
        const aScore = calculateRelevance(a, query);
        const bScore = calculateRelevance(b, query);
        return bScore - aScore;
      });
  };

  const calculateRelevance = (item: CommandItem, query: string): number => {
    let score = 0;
    const titleLower = item.title.toLowerCase();
    const descLower = item.description.toLowerCase();
    
    if (titleLower.startsWith(query)) score += 100;
    else if (titleLower.includes(query)) score += 50;
    
    if (descLower.includes(query)) score += 25;
    
    // Boost AI commands when in AI mode
    if (aiMode && item.type === 'ai') score += 30;
    
    return score;
  };

  const generateAICommands = async (query: string): Promise<CommandItem[]> => {
    try {
      // Generate contextual AI commands based on natural language
      const aiCommands: CommandItem[] = [];
      
      if (query.includes('test') || query.includes('testing')) {
        aiCommands.push({
          id: 'ai-smart-tests',
          type: 'generate',
          title: `AI: Generate Tests for "${query}"`,
          description: 'Generate comprehensive tests based on your request',
          action: async () => await generateCustomTests(query)
        });
      }
      
      if (query.includes('refactor') || query.includes('improve')) {
        aiCommands.push({
          id: 'ai-smart-refactor',
          type: 'refactor',
          title: `AI: Smart Refactor - ${query}`,
          description: 'Refactor code based on your specific requirements',
          action: async () => await smartRefactor(query)
        });
      }
      
      if (query.includes('explain') || query.includes('understand')) {
        aiCommands.push({
          id: 'ai-smart-explain',
          type: 'ai',
          title: `AI: Explain - ${query}`,
          description: 'Get detailed explanation based on your question',
          action: async () => await smartExplain(query)
        });
      }
      
      if (query.includes('generate') || query.includes('create')) {
        aiCommands.push({
          id: 'ai-smart-generate',
          type: 'generate',
          title: `AI: Generate - ${query}`,
          description: 'Generate code based on your description',
          action: async () => await smartGenerate(query)
        });
      }
      
      // Always add a general AI assistant option
      aiCommands.push({
        id: 'ai-general',
        type: 'ai',
        title: `AI: "${query}"`,
        description: 'Process this request with AI assistant',
        action: async () => await processGeneralAIRequest(query)
      });
      
      return aiCommands;
    } catch (error) {
      console.error('Failed to generate AI commands:', error);
      return [];
    }
  };

  // AI Command Actions
  const analyzeCurrentFile = async () => {
    if (!activeTab) return;
    // Trigger AI analysis
    console.log('Analyzing current file with AI...');
  };

  const refactorSelection = async () => {
    if (!activeTab) return;
    // Trigger AI refactoring
    console.log('Refactoring selection with AI...');
  };

  const generateTests = async () => {
    if (!activeTab) return;
    // Generate tests with AI
    console.log('Generating tests with AI...');
  };

  const explainCode = async () => {
    if (!activeTab) return;
    // Explain code with AI
    console.log('Explaining code with AI...');
  };

  const optimizePerformance = async () => {
    if (!activeTab) return;
    // Optimize performance with AI
    console.log('Optimizing performance with AI...');
  };

  const generateDocumentation = async () => {
    if (!activeTab) return;
    // Generate documentation with AI
    console.log('Generating documentation with AI...');
  };

  const generateCustomTests = async (query: string) => {
    // Custom test generation based on query
    console.log(`Generating custom tests for: ${query}`);
  };

  const smartRefactor = async (query: string) => {
    // Smart refactoring based on query
    console.log(`Smart refactoring for: ${query}`);
  };

  const smartExplain = async (query: string) => {
    // Smart explanation based on query
    console.log(`Smart explanation for: ${query}`);
  };

  const smartGenerate = async (query: string) => {
    // Smart code generation based on query
    console.log(`Smart generation for: ${query}`);
  };

  const processGeneralAIRequest = async (query: string) => {
    // Process general AI request
    console.log(`Processing AI request: ${query}`);
  };

  // Event handlers
  useEffect(() => {
    if (visible) {
      setQuery('');
      setResults(builtInCommands);
      setSelectedIndex(0);
      setAiMode(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchWithAI(query);
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [query, searchWithAI]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          executeCommand(results[selectedIndex]);
        }
        break;
    }
  };

  const executeCommand = async (command: CommandItem) => {
    try {
      await command.action();
      onClose();
    } catch (error) {
      console.error('Command execution failed:', error);
    }
  };

  if (!visible) return null;

  return (
    <Overlay visible={visible} onClick={onClose}>
      <PaletteContainer theme={theme} onClick={e => e.stopPropagation()}>
        {aiMode && (
          <AIAssistantMode theme={theme}>
            AI Assistant Mode - Natural language commands enabled
          </AIAssistantMode>
        )}
        
        <SearchInput
          ref={inputRef}
          theme={theme}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command or @ai for AI assistant..."
        />
        
        <ResultsList>
          {loading ? (
            <LoadingIndicator theme={theme}>
              🤖 AI is thinking...
            </LoadingIndicator>
          ) : results.length === 0 ? (
            <LoadingIndicator theme={theme}>
              No commands found. Try @ai for AI assistance.
            </LoadingIndicator>
          ) : (
            results.map((item, index) => (
              <ResultItem
                key={item.id}
                selected={index === selectedIndex}
                theme={theme}
                onClick={() => executeCommand(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <ResultIcon type={item.type} />
                <ResultContent>
                  <ResultTitle theme={theme}>{item.title}</ResultTitle>
                  <ResultDescription theme={theme}>{item.description}</ResultDescription>
                </ResultContent>
                {item.shortcut && (
                  <ResultShortcut theme={theme}>{item.shortcut}</ResultShortcut>
                )}
              </ResultItem>
            ))
          )}
        </ResultsList>
      </PaletteContainer>
    </Overlay>
  );
};