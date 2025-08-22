import React from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { fileSystemSlice } from '@/store/fileSystem';
import './FileExplorer.css';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  isExpanded?: boolean;
  children?: FileItem[];
  isSelected?: boolean;
}

export const FileExplorer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentProject, files } = useAppSelector(state => state.fileSystem);
  
  // If no project is loaded, show empty state
  if (!currentProject) {
    return (
      <div className="vf-file-explorer">
        <div className="vf-explorer-header">
          EXPLORER
          <div className="vf-explorer-actions">
            <button className="vf-btn vf-btn-ghost" title="New File">
              <svg className="vf-icon vf-icon-sm" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </button>
            <button className="vf-btn vf-btn-ghost" title="Refresh">
              <svg className="vf-icon vf-icon-sm" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="vf-file-tree">
          <div className="vf-empty-state">
            <p>No project opened</p>
            <p className="vf-empty-hint">Use the "Create Project" button in the header to get started</p>
          </div>
        </div>
      </div>
    );
  }

  const handleFolderToggle = (folderId: string) => {
    dispatch(fileSystemSlice.actions.toggleFolder(folderId));
  };

  const handleFileSelect = (filePath: string) => {
    dispatch(fileSystemSlice.actions.openFile(filePath));
  };

  const handleNewFile = () => {
    dispatch(fileSystemSlice.actions.createNewFile());
  };

  const handleRefresh = () => {
    dispatch(fileSystemSlice.actions.refreshFileTree());
  };

  const renderFileTree = (items: any[], depth = 0, parentPath = '') => {
    if (!items || items.length === 0) {
      return (
        <div className="vf-empty-state">
          <p>No files in project</p>
        </div>
      );
    }

    return items.map((item, index) => {
      const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      const isFolder = item.type === 'folder';
      const isExpanded = item.isExpanded || false;
      const isSelected = item.isSelected || false;
      
      return (
        <div key={`${item.name}-${depth}-${index}`}>
          <div
            className={`vf-file-item ${isFolder ? 'folder-item' : ''} ${isSelected ? 'selected' : ''}`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => {
              if (isFolder) {
                handleFolderToggle(currentPath);
              } else {
                handleFileSelect(currentPath);
              }
            }}
          >
            <svg className="vf-icon vf-icon-sm" viewBox="0 0 24 24">
              {isFolder ? (
                isExpanded ? (
                  <path d="m6 9 6 6 6-6"/>
                ) : (
                  <path d="m9 18 6-6-6-6"/>
                )
              ) : (
                <g>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  {item.name.endsWith('.tsx') || item.name.endsWith('.ts') ? (
                    <path fill="var(--vf-accent-info)" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  ) : null}
                </g>
              )}
            </svg>
            {item.name}
          </div>
          {isFolder && isExpanded && item.children && (
            <div>
              {renderFileTree(item.children, depth + 1, currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="vf-file-explorer">
      <div className="vf-explorer-header">
        EXPLORER
        <div className="vf-explorer-actions">
          <button className="vf-btn vf-btn-ghost" title="New File" onClick={handleNewFile}>
            <svg className="vf-icon vf-icon-sm" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </button>
          <button className="vf-btn vf-btn-ghost" title="Refresh" onClick={handleRefresh}>
            <svg className="vf-icon vf-icon-sm" viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </button>
          <button className="vf-btn vf-btn-ghost" title="More Actions">
            <svg className="vf-icon vf-icon-sm" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="vf-file-tree">
        {currentProject ? renderFileTree(files || []) : (
          <div className="vf-empty-state">
            <p>No project opened</p>
          </div>
        )}
      </div>
    </div>
  );
};