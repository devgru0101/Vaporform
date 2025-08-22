import React from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { updateAi } from '@/store/settings';

export const AiSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { ai } = useAppSelector(state => state.settings);

  const handleAiChange = (field: keyof typeof ai, value: any) => {
    dispatch(updateAi({ [field]: value }));
  };

  const modelOptions = [
    { value: 'claude-3-opus', label: 'Claude 3 Opus', description: 'Most capable, slowest' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', description: 'Balanced performance' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku', description: 'Fastest, most affordable' },
    { value: 'claude-2.1', label: 'Claude 2.1', description: 'Previous generation' },
    { value: 'claude-2.0', label: 'Claude 2.0', description: 'Legacy model' },
  ];

  return (
    <div className="vf-settings-section">
      <div className="vf-settings-section-header">
        <h2 className="vf-settings-section-title">AI Assistant</h2>
        <p className="vf-settings-section-description">
          Configure AI model behavior, features, and performance settings
        </p>
      </div>

      <div className="vf-settings-section-content">
        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Model Configuration</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">AI Model</label>
                <span className="vf-settings-field-description">
                  Choose the Claude model to use for AI assistance
                </span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={ai.model}
                  onChange={(e) => handleAiChange('model', e.target.value)}
                  className="vf-settings-select"
                >
                  {modelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Temperature</label>
                <span className="vf-settings-field-description">
                  Controls randomness in AI responses (0.0 = deterministic, 1.0 = creative)
                </span>
              </div>
              <div className="vf-settings-field-control">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--vf-space-3)' }}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={ai.temperature}
                    onChange={(e) => handleAiChange('temperature', parseFloat(e.target.value))}
                    className="vf-settings-range"
                  />
                  <span style={{ 
                    color: 'var(--vf-text-primary)', 
                    fontFamily: 'var(--vf-font-mono)',
                    minWidth: '40px'
                  }}>
                    {ai.temperature}
                  </span>
                </div>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Max Tokens</label>
                <span className="vf-settings-field-description">
                  Maximum number of tokens per response
                </span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={ai.maxTokens}
                  onChange={(e) => handleAiChange('maxTokens', parseInt(e.target.value))}
                  className="vf-settings-select"
                >
                  <option value={1024}>1,024 tokens</option>
                  <option value={2048}>2,048 tokens</option>
                  <option value={4096}>4,096 tokens</option>
                  <option value={8192}>8,192 tokens</option>
                  <option value={16384}>16,384 tokens</option>
                </select>
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Context Window</label>
                <span className="vf-settings-field-description">
                  Maximum context length for conversations (in tokens)
                </span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={ai.contextWindow}
                  onChange={(e) => handleAiChange('contextWindow', parseInt(e.target.value))}
                  className="vf-settings-select"
                >
                  <option value={50000}>50,000 tokens</option>
                  <option value={100000}>100,000 tokens</option>
                  <option value={200000}>200,000 tokens</option>
                  <option value={500000}>500,000 tokens</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Features</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Auto Suggestions</label>
                <span className="vf-settings-field-description">
                  Enable automatic code suggestions while typing
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={ai.autoSuggestions}
                  onChange={(e) => handleAiChange('autoSuggestions', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Context Sensitive</label>
                <span className="vf-settings-field-description">
                  Use current file and project context for better responses
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={ai.contextSensitive}
                  onChange={(e) => handleAiChange('contextSensitive', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Code Generation</label>
                <span className="vf-settings-field-description">
                  Enable AI-powered code generation and completion
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={ai.codeGeneration}
                  onChange={(e) => handleAiChange('codeGeneration', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Documentation Generation</label>
                <span className="vf-settings-field-description">
                  Automatically generate documentation for code
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={ai.documentationGeneration}
                  onChange={(e) => handleAiChange('documentationGeneration', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Test Generation</label>
                <span className="vf-settings-field-description">
                  Generate unit tests and test cases automatically
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={ai.testGeneration}
                  onChange={(e) => handleAiChange('testGeneration', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Conversation</h3>
          <div className="vf-settings-group-content">
            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Conversation History</label>
                <span className="vf-settings-field-description">
                  Save and maintain chat history between sessions
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={ai.conversationHistory}
                  onChange={(e) => handleAiChange('conversationHistory', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Streaming Response</label>
                <span className="vf-settings-field-description">
                  Show AI responses as they are generated (faster perceived response)
                </span>
              </div>
              <div className="vf-settings-field-control">
                <input
                  type="checkbox"
                  checked={ai.streamingResponse}
                  onChange={(e) => handleAiChange('streamingResponse', e.target.checked)}
                  className="vf-settings-checkbox"
                />
              </div>
            </div>

            <div className="vf-settings-field-row">
              <div className="vf-settings-field-info">
                <label className="vf-settings-field-label">Max Conversations</label>
                <span className="vf-settings-field-description">
                  Maximum number of conversation threads to keep
                </span>
              </div>
              <div className="vf-settings-field-control">
                <select
                  value={ai.maxConversations}
                  onChange={(e) => handleAiChange('maxConversations', parseInt(e.target.value))}
                  className="vf-settings-select"
                >
                  <option value={10}>10 conversations</option>
                  <option value={25}>25 conversations</option>
                  <option value={50}>50 conversations</option>
                  <option value={100}>100 conversations</option>
                  <option value={0}>Unlimited</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Model Comparison</h3>
          <div className="vf-settings-group-content">
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: 'var(--vf-space-2)',
              padding: 'var(--vf-space-3)',
              background: 'var(--vf-bg-secondary)',
              border: '1px solid var(--vf-surface-border)',
              fontSize: 'var(--vf-text-xs)',
              color: 'var(--vf-text-muted)'
            }}>
              <div style={{ fontWeight: 'var(--vf-weight-semibold)', color: 'var(--vf-text-primary)' }}>Model</div>
              <div style={{ fontWeight: 'var(--vf-weight-semibold)', color: 'var(--vf-text-primary)' }}>Speed</div>
              <div style={{ fontWeight: 'var(--vf-weight-semibold)', color: 'var(--vf-text-primary)' }}>Capability</div>
              <div style={{ fontWeight: 'var(--vf-weight-semibold)', color: 'var(--vf-text-primary)' }}>Cost</div>
              
              <div>Claude 3 Opus</div>
              <div>Slow</div>
              <div>Highest</div>
              <div>High</div>
              
              <div>Claude 3 Sonnet</div>
              <div>Medium</div>
              <div>High</div>
              <div>Medium</div>
              
              <div>Claude 3 Haiku</div>
              <div>Fast</div>
              <div>Good</div>
              <div>Low</div>
            </div>
          </div>
        </div>

        <div className="vf-settings-group">
          <h3 className="vf-settings-group-title">Current Configuration</h3>
          <div className="vf-settings-group-content">
            <div style={{
              padding: 'var(--vf-space-4)',
              background: 'var(--vf-bg-secondary)',
              border: '1px solid var(--vf-surface-border)',
              fontFamily: 'var(--vf-font-mono)',
              fontSize: 'var(--vf-text-sm)',
              color: 'var(--vf-text-primary)'
            }}>
              <div>Model: <span style={{ color: 'var(--vf-accent-primary)' }}>{ai.model}</span></div>
              <div>Temperature: <span style={{ color: 'var(--vf-accent-primary)' }}>{ai.temperature}</span></div>
              <div>Max Tokens: <span style={{ color: 'var(--vf-accent-primary)' }}>{ai.maxTokens.toLocaleString()}</span></div>
              <div>Context Window: <span style={{ color: 'var(--vf-accent-primary)' }}>{ai.contextWindow.toLocaleString()}</span></div>
              <div>Features Enabled:</div>
              <ul style={{ marginLeft: 'var(--vf-space-4)', marginTop: 'var(--vf-space-2)' }}>
                {ai.autoSuggestions && <li>Auto Suggestions</li>}
                {ai.contextSensitive && <li>Context Sensitive</li>}
                {ai.codeGeneration && <li>Code Generation</li>}
                {ai.documentationGeneration && <li>Documentation Generation</li>}
                {ai.testGeneration && <li>Test Generation</li>}
                {ai.conversationHistory && <li>Conversation History</li>}
                {ai.streamingResponse && <li>Streaming Response</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};