import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAppSelector } from '@/hooks/redux';
import { Button } from './Button';
import { CopyIcon } from './Icons';

const CodeBlockContainer = styled.div<{ theme: string }>`
  margin: 12px 0;
  border: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e0e0e0'};
  border-radius: 6px;
  overflow: hidden;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#f8f9fa'};
`;

const CodeBlockHeader = styled.div<{ theme: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: ${props => props.theme === 'dark' ? '#2d2d30' : '#f1f3f4'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e0e0e0'};
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#a0a0a0' : '#6c757d'};
`;

const LanguageLabel = styled.span`
  font-weight: 600;
  text-transform: uppercase;
`;

const CopyButton = styled(Button)`
  padding: 4px 8px;
  font-size: 11px;
  min-height: 24px;
`;

const CodeContainer = styled.div<{ theme: string }>`
  position: relative;
  
  pre {
    margin: 0 !important;
    padding: 16px !important;
    background-color: transparent !important;
    font-size: 13px !important;
    line-height: 1.4 !important;
    overflow-x: auto !important;
    
    &::-webkit-scrollbar {
      height: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: ${props => props.theme === 'dark' ? '#2d2d30' : '#f1f1f1'};
    }
    
    &::-webkit-scrollbar-thumb {
      background: ${props => props.theme === 'dark' ? '#424242' : '#c1c1c1'};
      border-radius: 4px;
    }
  }
  
  code {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace !important;
  }
`;

const CopyTooltip = styled.div<{ theme: string; visible: boolean }>`
  position: absolute;
  top: -30px;
  right: 12px;
  background-color: ${props => props.theme === 'dark' ? '#2d2d30' : '#333333'};
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#ffffff'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.2s;
  pointer-events: none;
  z-index: 1000;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    right: 12px;
    border: 4px solid transparent;
    border-top-color: ${props => props.theme === 'dark' ? '#2d2d30' : '#333333'};
  }
`;

interface CodeBlockProps {
  language: string;
  code: string;
  fileName?: string;
  showHeader?: boolean;
  maxHeight?: number;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  language,
  code,
  fileName,
  showHeader = true,
  maxHeight
}) => {
  const { theme } = useAppSelector(state => state.ui);
  const [copyTooltip, setCopyTooltip] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyTooltip(true);
      setTimeout(() => setCopyTooltip(false), 1500);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const getLanguageDisplayName = (lang: string): string => {
    const languageMap: Record<string, string> = {
      js: 'JavaScript',
      jsx: 'JavaScript',
      ts: 'TypeScript',
      tsx: 'TypeScript',
      py: 'Python',
      python: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      cs: 'C#',
      csharp: 'C#',
      php: 'PHP',
      rb: 'Ruby',
      ruby: 'Ruby',
      go: 'Go',
      rs: 'Rust',
      rust: 'Rust',
      swift: 'Swift',
      kt: 'Kotlin',
      kotlin: 'Kotlin',
      scala: 'Scala',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      sass: 'Sass',
      less: 'Less',
      json: 'JSON',
      xml: 'XML',
      yaml: 'YAML',
      yml: 'YAML',
      md: 'Markdown',
      markdown: 'Markdown',
      sql: 'SQL',
      sh: 'Shell',
      bash: 'Bash',
      zsh: 'Zsh',
      fish: 'Fish',
      ps1: 'PowerShell',
      powershell: 'PowerShell',
      dockerfile: 'Dockerfile',
      text: 'Text',
      plaintext: 'Text',
    };
    
    return languageMap[lang.toLowerCase()] || lang.toUpperCase();
  };

  const getSyntaxHighlighterLanguage = (lang: string): string => {
    // Map our language identifiers to react-syntax-highlighter supported languages
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      py: 'python',
      rb: 'ruby',
      cs: 'csharp',
      cpp: 'cpp',
      c: 'c',
      kt: 'kotlin',
      rs: 'rust',
      go: 'go',
      php: 'php',
      swift: 'swift',
      scala: 'scala',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      less: 'less',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      sql: 'sql',
      sh: 'bash',
      bash: 'bash',
      zsh: 'bash',
      fish: 'bash',
      ps1: 'powershell',
      dockerfile: 'docker',
      text: 'text',
      plaintext: 'text',
    };
    
    return languageMap[lang.toLowerCase()] || 'text';
  };

  return (
    <CodeBlockContainer theme={theme}>
      {showHeader && (
        <CodeBlockHeader theme={theme}>
          <div>
            <LanguageLabel>{getLanguageDisplayName(language)}</LanguageLabel>
            {fileName && <span style={{ marginLeft: '8px', opacity: 0.7 }}>{fileName}</span>}
          </div>
          <div style={{ position: 'relative' }}>
            <CopyButton
              variant="ghost"
              size="xs"
              onClick={handleCopy}
              title="Copy code"
            >
              <CopyIcon size={12} />
              Copy
            </CopyButton>
            <CopyTooltip theme={theme} visible={copyTooltip}>
              Copied!
            </CopyTooltip>
          </div>
        </CodeBlockHeader>
      )}
      
      <CodeContainer theme={theme} style={{ maxHeight: maxHeight ? `${maxHeight}px` : undefined, overflow: 'auto' }}>
        <SyntaxHighlighter
          language={getSyntaxHighlighterLanguage(language)}
          style={theme === 'dark' ? vscDarkPlus : vs}
          customStyle={{
            margin: 0,
            padding: '16px',
            backgroundColor: 'transparent',
            fontSize: '13px',
            lineHeight: '1.4',
          }}
          showLineNumbers={code.split('\n').length > 5}
          lineNumberStyle={{
            minWidth: '2em',
            paddingRight: '1em',
            opacity: 0.5,
            userSelect: 'none',
          }}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </CodeContainer>
    </CodeBlockContainer>
  );
};