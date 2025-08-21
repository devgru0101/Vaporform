import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as monaco from 'monaco-editor';
import styled from '@emotion/styled';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { editorSlice } from '@/store/editor';
import { emitCursorUpdate, emitSelectionUpdate, emitOperation } from '@/store/middleware/websocket';
import { aiService } from '@/services/ai';
import { debounce } from 'lodash';

const EditorContainer = styled.div<{ theme: string }>`
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
  position: relative;
`;

const AIIndicator = styled.div<{ active: boolean }>`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: ${props => props.active ? '#007ACC' : '#666'};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  opacity: ${props => props.active ? 1 : 0.7};
  transition: all 0.2s ease;
  
  &::before {
    content: '🤖';
    margin-right: 4px;
  }
`;

const CodeLensContainer = styled.div`
  position: absolute;
  background: rgba(0, 122, 204, 0.1);
  border: 1px solid #007ACC;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  color: #007ACC;
  cursor: pointer;
  z-index: 100;
  
  &:hover {
    background: rgba(0, 122, 204, 0.2);
  }
`;

export const MonacoEditor: React.FC = () => {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  
  // AI-related state
  const [aiActive, setAiActive] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [codeLenses, setCodeLenses] = useState<any[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);
  const [analysisDecorations, setAnalysisDecorations] = useState<string[]>([]);
  
  const { theme } = useAppSelector(state => state.ui);
  const { 
    tabs, 
    activeTabId, 
    editorInstance,
    theme: editorTheme,
    fontSize,
    wordWrap,
    minimap,
    lineNumbers,
    autoSave,
    autoSaveDelay
  } = useAppSelector(state => state.editor);

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // AI Analysis Functions
  const analyzeCodeRealTime = useCallback(async (code: string, filePath: string, language: string) => {
    if (!code.trim()) return;
    
    setAiActive(true);
    try {
      const response = await fetch('/api/ai/analyze-code-realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('vaporform_token')}`
        },
        body: JSON.stringify({
          code,
          filePath,
          language,
          analysisType: 'all',
          realTime: true,
          includeAutoFix: true
        })
      });
      
      if (response.ok) {
        const analysis = await response.json();
        setLastAnalysis(analysis);
        updateEditorDecorations(analysis);
        updateCodeLenses(analysis);
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setAiActive(false);
    }
  }, []);

  const getSmartSuggestions = useCallback(async (
    code: string, 
    filePath: string, 
    language: string, 
    cursorPosition: { line: number; column: number }
  ) => {
    setAiActive(true);
    try {
      const response = await fetch('/api/ai/smart-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('vaporform_token')}`
        },
        body: JSON.stringify({
          code,
          filePath,
          language,
          cursorPosition,
          suggestionType: 'completion'
        })
      });
      
      if (response.ok) {
        const suggestions = await response.json();
        setAiSuggestions(suggestions.suggestions);
        return suggestions.suggestions;
      }
    } catch (error) {
      console.error('Smart suggestions failed:', error);
    } finally {
      setAiActive(false);
    }
    return [];
  }, []);

  const updateEditorDecorations = useCallback((analysis: any) => {
    if (!editorRef.current) return;
    
    const decorations: monaco.editor.IModelDeltaDecoration[] = [];
    
    if (analysis.issues) {
      analysis.issues.forEach((issue: any) => {
        if (issue.line) {
          const severity = issue.severity === 'critical' ? monaco.MarkerSeverity.Error :
                          issue.severity === 'high' ? monaco.MarkerSeverity.Error :
                          issue.severity === 'medium' ? monaco.MarkerSeverity.Warning :
                          monaco.MarkerSeverity.Info;
          
          decorations.push({
            range: new monaco.Range(
              issue.line, 
              issue.column || 1, 
              issue.endLine || issue.line, 
              issue.endColumn || 100
            ),
            options: {
              isWholeLine: !issue.column,
              className: `ai-issue-${issue.severity}`,
              hoverMessage: { value: issue.message },
              minimap: {
                color: severity === monaco.MarkerSeverity.Error ? '#ff0000' : 
                       severity === monaco.MarkerSeverity.Warning ? '#ffaa00' : '#0099ff',
                position: monaco.editor.MinimapPosition.Inline
              },
              overviewRuler: {
                color: severity === monaco.MarkerSeverity.Error ? '#ff0000' : 
                       severity === monaco.MarkerSeverity.Warning ? '#ffaa00' : '#0099ff',
                position: monaco.editor.OverviewRulerLane.Right
              }
            }
          });
        }
      });
    }
    
    if (analysis.suggestions) {
      analysis.suggestions.forEach((suggestion: any) => {
        if (suggestion.range) {
          decorations.push({
            range: new monaco.Range(
              suggestion.range.start.line,
              suggestion.range.start.column,
              suggestion.range.end.line,
              suggestion.range.end.column
            ),
            options: {
              className: 'ai-suggestion',
              hoverMessage: { value: `💡 ${suggestion.description}` },
              linesDecorationsClassName: 'ai-suggestion-glyph'
            }
          });
        }
      });
    }
    
    const newDecorations = editorRef.current.deltaDecorations(analysisDecorations, decorations);
    setAnalysisDecorations(newDecorations);
  }, [analysisDecorations]);

  const updateCodeLenses = useCallback((analysis: any) => {
    if (!analysis.suggestions) return;
    
    const lenses = analysis.suggestions
      .filter((suggestion: any) => suggestion.type === 'refactor' || suggestion.type === 'optimize')
      .map((suggestion: any, index: number) => ({
        id: `lens_${index}`,
        title: suggestion.title,
        description: suggestion.description,
        line: suggestion.range?.start.line || 1,
        action: () => applySuggestion(suggestion)
      }));
    
    setCodeLenses(lenses);
  }, []);

  const applySuggestion = useCallback(async (suggestion: any) => {
    if (!editorRef.current || !suggestion.code) return;
    
    const model = editorRef.current.getModel();
    if (!model) return;
    
    if (suggestion.range) {
      const range = new monaco.Range(
        suggestion.range.start.line,
        suggestion.range.start.column,
        suggestion.range.end.line,
        suggestion.range.end.column
      );
      
      const edit = {
        range,
        text: suggestion.code
      };
      
      model.pushEditOperations([], [edit], () => null);
    }
  }, []);

  // Debounced real-time analysis
  const debouncedAnalysis = useCallback(
    debounce((code: string, filePath: string, language: string) => {
      analyzeCodeRealTime(code, filePath, language);
    }, 1500),
    [analyzeCodeRealTime]
  );

  // Initialize Monaco Editor
  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const editor = monaco.editor.create(containerRef.current, {
      value: activeTab?.content || '',
      language: activeTab?.language || 'plaintext',
      theme: theme === 'dark' ? 'vs-dark' : 'vs',
      fontSize,
      wordWrap,
      minimap: { enabled: minimap },
      lineNumbers,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: true,
      smoothScrolling: true,
      contextmenu: true,
      mouseWheelZoom: true,
      multiCursorModifier: 'ctrlCmd',
      selectionHighlight: true,
      occurrencesHighlight: true,
      codeLens: true,
      folding: true,
      foldingHighlight: true,
      showFoldingControls: 'mouseover',
      matchBrackets: 'always',
      glyphMargin: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      renderLineHighlight: 'line',
      scrollbar: {
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        vertical: 'visible',
        horizontal: 'visible',
        verticalScrollbarSize: 14,
        horizontalScrollbarSize: 14,
      },
    });

    editorRef.current = editor;
    dispatch(editorSlice.actions.setEditorInstance(editor));

    // Content change handler with AI analysis
    const contentChangeDisposable = editor.onDidChangeModelContent((e) => {
      if (!activeTabId) return;
      
      const content = editor.getValue();
      dispatch(editorSlice.actions.updateTabContent({
        tabId: activeTabId,
        content,
        isDirty: true
      }));

      // Emit operational transform for collaboration
      emitOperation({
        operation: {
          type: 'content-change',
          changes: e.changes.map(change => ({
            range: change.range,
            text: change.text,
            rangeLength: change.rangeLength
          }))
        },
        file: activeTab?.filePath || ''
      });

      // Trigger real-time AI analysis
      if (activeTab?.filePath && activeTab?.language && content.trim()) {
        debouncedAnalysis(content, activeTab.filePath, activeTab.language);
      }
    });

    // Cursor position change handler with AI suggestions
    const cursorChangeDisposable = editor.onDidChangeCursorPosition((e) => {
      if (!activeTabId || !activeTab) return;
      
      dispatch(editorSlice.actions.updateTabPosition({
        tabId: activeTabId,
        cursorPosition: {
          line: e.position.lineNumber,
          column: e.position.column
        }
      }));

      // Emit cursor update for collaboration
      emitCursorUpdate({
        file: activeTab.filePath,
        cursor: {
          line: e.position.lineNumber,
          column: e.position.column
        }
      });

      // Trigger smart suggestions on cursor movement
      const content = editor.getValue();
      if (content.trim() && activeTab.language) {
        // Debounced to avoid too many requests
        setTimeout(() => {
          getSmartSuggestions(
            content, 
            activeTab.filePath, 
            activeTab.language, 
            { line: e.position.lineNumber, column: e.position.column }
          );
        }, 500);
      }
    });

    // Selection change handler
    const selectionChangeDisposable = editor.onDidChangeCursorSelection((e) => {
      if (!activeTab) return;
      
      // Emit selection update for collaboration
      emitSelectionUpdate({
        file: activeTab.filePath,
        selection: {
          startLineNumber: e.selection.startLineNumber,
          startColumn: e.selection.startColumn,
          endLineNumber: e.selection.endLineNumber,
          endColumn: e.selection.endColumn
        }
      });
    });

    // Scroll position change handler
    const scrollChangeDisposable = editor.onDidScrollChange((e) => {
      if (!activeTabId) return;
      
      dispatch(editorSlice.actions.updateTabPosition({
        tabId: activeTabId,
        scrollPosition: {
          top: e.scrollTop,
          left: e.scrollLeft
        }
      }));
    });

    // Auto-save functionality
    let autoSaveTimeout: NodeJS.Timeout;
    const autoSaveDisposable = editor.onDidChangeModelContent(() => {
      if (!autoSave || !activeTabId) return;
      
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(() => {
        // TODO: Implement actual file saving
        dispatch(editorSlice.actions.saveTab(activeTabId));
      }, autoSaveDelay);
    });

    // Cleanup
    return () => {
      contentChangeDisposable.dispose();
      cursorChangeDisposable.dispose();
      selectionChangeDisposable.dispose();
      scrollChangeDisposable.dispose();
      autoSaveDisposable.dispose();
      clearTimeout(autoSaveTimeout);
      editor.dispose();
      editorRef.current = null;
    };
  }, []);

  // Update editor content when active tab changes
  useEffect(() => {
    if (!editorRef.current || !activeTab) return;

    const currentValue = editorRef.current.getValue();
    if (currentValue !== activeTab.content) {
      editorRef.current.setValue(activeTab.content);
      
      // Restore cursor and scroll position
      if (activeTab.cursorPosition) {
        editorRef.current.setPosition({
          lineNumber: activeTab.cursorPosition.line,
          column: activeTab.cursorPosition.column
        });
      }
      
      if (activeTab.scrollPosition) {
        editorRef.current.setScrollPosition({
          scrollTop: activeTab.scrollPosition.top,
          scrollLeft: activeTab.scrollPosition.left
        });
      }
    }

    // Update language
    const model = editorRef.current.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, activeTab.language);
    }
  }, [activeTab]);

  // Update editor theme
  useEffect(() => {
    const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';
    monaco.editor.setTheme(monacoTheme);
  }, [theme]);

  // Update editor options
  useEffect(() => {
    if (!editorRef.current) return;
    
    editorRef.current.updateOptions({
      fontSize,
      wordWrap,
      minimap: { enabled: minimap },
      lineNumbers,
    });
  }, [fontSize, wordWrap, minimap, lineNumbers]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;

    // Save shortcut (Ctrl+S)
    const saveAction = editor.addAction({
      id: 'save-file',
      label: 'Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        if (activeTabId) {
          // TODO: Implement actual file saving
          dispatch(editorSlice.actions.saveTab(activeTabId));
        }
      },
    });

    // Find shortcut (Ctrl+F)
    const findAction = editor.addAction({
      id: 'find',
      label: 'Find',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF],
      run: () => {
        editor.getAction('actions.find')?.run();
      },
    });

    // Format document shortcut (Shift+Alt+F)
    const formatAction = editor.addAction({
      id: 'format-document',
      label: 'Format Document',
      keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
      run: async () => {
        await editor.getAction('editor.action.formatDocument')?.run();
      },
    });

    // AI Code Analysis shortcut (Ctrl+Alt+A)
    const aiAnalysisAction = editor.addAction({
      id: 'ai-analyze',
      label: 'AI Code Analysis',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyA],
      run: async () => {
        if (activeTab?.filePath && activeTab?.language) {
          const content = editor.getValue();
          await analyzeCodeRealTime(content, activeTab.filePath, activeTab.language);
        }
      },
    });

    // AI Suggestions shortcut (Ctrl+Space)
    const aiSuggestionsAction = editor.addAction({
      id: 'ai-suggestions',
      label: 'AI Smart Suggestions',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space],
      run: async () => {
        if (activeTab?.filePath && activeTab?.language) {
          const position = editor.getPosition();
          if (position) {
            const content = editor.getValue();
            await getSmartSuggestions(
              content, 
              activeTab.filePath, 
              activeTab.language,
              { line: position.lineNumber, column: position.column }
            );
          }
        }
      },
    });

    // AI Refactor shortcut (Ctrl+Alt+R)
    const aiRefactorAction = editor.addAction({
      id: 'ai-refactor',
      label: 'AI Refactor Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyR],
      run: async () => {
        const selection = editor.getSelection();
        if (selection && !selection.isEmpty() && activeTab?.language) {
          const selectedText = editor.getModel()?.getValueInRange(selection);
          if (selectedText) {
            try {
              setAiActive(true);
              const response = await fetch('/api/ai/refactor', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('vaporform_token')}`
                },
                body: JSON.stringify({
                  code: selectedText,
                  language: activeTab.language,
                  refactoringGoals: ['readability', 'performance'],
                  preserveBehavior: true,
                  modernizeCode: true
                })
              });
              
              if (response.ok) {
                const refactorResult = await response.json();
                // Replace selected text with refactored code
                const refactoredCode = extractCodeFromResponse(refactorResult.result);
                if (refactoredCode) {
                  editor.getModel()?.pushEditOperations([], [{
                    range: selection,
                    text: refactoredCode
                  }], () => null);
                }
              }
            } catch (error) {
              console.error('AI refactoring failed:', error);
            } finally {
              setAiActive(false);
            }
          }
        }
      },
    });

    return () => {
      saveAction.dispose();
      findAction.dispose();
      formatAction.dispose();
      aiAnalysisAction.dispose();
      aiSuggestionsAction.dispose();
      aiRefactorAction.dispose();
    };
  }, [activeTabId, dispatch]);

  // Helper function to extract code from AI response
  const extractCodeFromResponse = (response: string): string | null => {
    // Look for code blocks in the response
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/;
    const match = response.match(codeBlockRegex);
    return match ? match[1].trim() : null;
  };

  if (!activeTab) {
    return null;
  }

  return (
    <EditorContainer ref={containerRef} theme={theme}>
      <AIIndicator active={aiActive}>
        {aiActive ? 'AI Analyzing...' : 'AI Ready'}
      </AIIndicator>
      {codeLenses.map((lens) => (
        <CodeLensContainer
          key={lens.id}
          style={{
            top: `${(lens.line - 1) * 18 + 10}px`,
            left: '10px'
          }}
          onClick={lens.action}
          title={lens.description}
        >
          {lens.title}
        </CodeLensContainer>
      ))}
    </EditorContainer>
  );
};