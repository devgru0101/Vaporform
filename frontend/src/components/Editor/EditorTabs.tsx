import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { editorSlice } from '@/store/editor';
import { CloseIcon } from '@/components/ui/Icons';

const TabsContainer = styled.div<{ theme: string }>`
  height: 35px;
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  background-color: ${props => props.theme === 'dark' ? '#2d2d30' : '#f3f3f3'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  
  &::-webkit-scrollbar {
    height: 0;
  }
`;

const Tab = styled.div<{ 
  isActive: boolean; 
  isDirty: boolean; 
  theme: string;
}>`
  display: flex;
  align-items: center;
  min-width: 120px;
  max-width: 200px;
  height: 35px;
  padding: 0 12px;
  cursor: pointer;
  user-select: none;
  position: relative;
  background-color: ${props => props.isActive 
    ? (props.theme === 'dark' ? '#1e1e1e' : '#ffffff')
    : 'transparent'
  };
  color: ${props => props.isActive
    ? (props.theme === 'dark' ? '#ffffff' : '#333333')
    : (props.theme === 'dark' ? '#969696' : '#6c6c6c')
  };
  border-right: 1px solid ${props => props.theme === 'dark' ? '#3e3e42' : '#e5e5e5'};
  
  &:hover {
    background-color: ${props => props.isActive
      ? (props.theme === 'dark' ? '#1e1e1e' : '#ffffff')
      : (props.theme === 'dark' ? '#2a2d2e' : '#e8e8e8')
    };
  }
  
  ${props => props.isActive && `
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background-color: ${props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
    }
  `}
`;

const TabIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  font-size: 12px;
`;

const TabLabel = styled.div`
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DirtyIndicator = styled.div<{ theme: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${props => props.theme === 'dark' ? '#ffffff' : '#333333'};
  margin-right: 6px;
`;

const CloseButton = styled.button<{ theme: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 3px;
  color: ${props => props.theme === 'dark' ? '#969696' : '#6c6c6c'};
  opacity: 0;
  transition: opacity 0.2s, background-color 0.2s;
  
  ${Tab}:hover & {
    opacity: 1;
  }
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#3e3e42' : '#e0e0e0'};
    color: ${props => props.theme === 'dark' ? '#ffffff' : '#000000'};
  }
`;

const getFileIcon = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const iconMap: Record<string, string> = {
    js: '📄',
    jsx: '⚛️',
    ts: '🔷',
    tsx: '⚛️',
    py: '🐍',
    java: '☕',
    cpp: '⚡',
    c: '⚡',
    cs: '#️⃣',
    php: '🐘',
    rb: '💎',
    go: '🐹',
    rs: '🦀',
    swift: '🐦',
    kt: '🎯',
    scala: '⚖️',
    html: '🌐',
    css: '🎨',
    scss: '🎨',
    sass: '🎨',
    less: '🎨',
    json: '📋',
    xml: '📄',
    yaml: '⚙️',
    yml: '⚙️',
    md: '📝',
    sql: '🗃️',
    sh: '💻',
    bash: '💻',
    zsh: '💻',
    fish: '🐠',
    ps1: '💙',
    dockerfile: '🐳',
    env: '⚙️',
    gitignore: '🙈',
    txt: '📄',
  };
  
  return iconMap[extension || ''] || '📄';
};

export const EditorTabs: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector(state => state.ui);
  const { tabs, activeTabId } = useAppSelector(state => state.editor);
  
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);

  const handleTabClick = (tabId: string) => {
    dispatch(editorSlice.actions.switchTab(tabId));
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    dispatch(editorSlice.actions.closeTab(tabId));
  };

  const handleTabMiddleClick = (e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      dispatch(editorSlice.actions.closeTab(tabId));
    }
  };

  // Drag and drop functionality for tab reordering
  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    if (draggedTab && draggedTab !== tabId) {
      setDragOverTab(tabId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTab(null);
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    
    if (!draggedTab || draggedTab === targetTabId) return;
    
    // TODO: Implement tab reordering logic
    console.log('Reorder tab:', draggedTab, 'to position of:', targetTabId);
    
    setDraggedTab(null);
    setDragOverTab(null);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverTab(null);
  };

  return (
    <TabsContainer theme={theme}>
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          isActive={tab.isActive}
          isDirty={tab.isDirty}
          theme={theme}
          onClick={() => handleTabClick(tab.id)}
          onMouseDown={(e) => handleTabMiddleClick(e, tab.id)}
          draggable
          onDragStart={(e) => handleDragStart(e, tab.id)}
          onDragOver={(e) => handleDragOver(e, tab.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, tab.id)}
          onDragEnd={handleDragEnd}
          style={{
            opacity: draggedTab === tab.id ? 0.5 : 1,
            transform: dragOverTab === tab.id ? 'translateX(2px)' : 'none',
          }}
          title={`${tab.filePath}${tab.isDirty ? ' • Modified' : ''}`}
        >
          <TabIcon>
            {getFileIcon(tab.fileName)}
          </TabIcon>
          
          <TabLabel>
            {tab.fileName}
          </TabLabel>
          
          {tab.isDirty ? (
            <DirtyIndicator theme={theme} />
          ) : (
            <CloseButton
              theme={theme}
              onClick={(e) => handleTabClose(e, tab.id)}
              title="Close tab"
            >
              <CloseIcon size={12} />
            </CloseButton>
          )}
        </Tab>
      ))}
    </TabsContainer>
  );
};