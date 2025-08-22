import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { 
  LightBulbIcon, 
  UserGroupIcon, 
  SparklesIcon, 
  RobotIcon,
  CloseIcon
} from '../../ui/Icons';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { updateProjectData, analyzeProjectVision } from '../../../store/projectWizard';

interface ProjectVisionStepProps {
  className?: string;
}

const INSPIRATION_APPS = [
  'Slack', 'Notion', 'Figma', 'Discord', 'GitHub', 'Spotify', 'Netflix', 
  'Airbnb', 'Uber', 'Instagram', 'TikTok', 'Zoom', 'Shopify', 'Stripe',
  'Linear', 'Airtable', 'Vercel', 'Supabase', 'Railway', 'PlanetScale'
];

export const ProjectVisionStep: React.FC<ProjectVisionStepProps> = ({ className }) => {
  const dispatch = useDispatch();
  const { projectData, isAnalyzing, aiSuggestions } = useSelector(
    (state: RootState) => state.projectWizard
  );

  // Local state for form inputs
  const [formData, setFormData] = useState({
    projectName: projectData.projectName || '',
    description: projectData.description || '',
    coreFeatures: projectData.coreFeatures || '',
    targetAudience: projectData.targetAudience || '',
    inspirationApps: projectData.inspirationApps || [],
    projectGoals: projectData.projectGoals || []
  });

  const [currentGoal, setCurrentGoal] = useState('');
  const [showInspirationSuggestions, setShowInspirationSuggestions] = useState(false);
  const [inspirationInput, setInspirationInput] = useState('');

  // Update Redux state when form data changes
  useEffect(() => {
    dispatch(updateProjectData(formData));
  }, [formData, dispatch]);

  // Trigger AI analysis when key fields change
  useEffect(() => {
    if (formData.projectName && formData.description && formData.coreFeatures) {
      const timeoutId = setTimeout(() => {
        dispatch(analyzeProjectVision({
          name: formData.projectName,
          description: formData.description,
          features: formData.coreFeatures,
          audience: formData.targetAudience
        }));
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [formData.projectName, formData.description, formData.coreFeatures, formData.targetAudience, dispatch]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddGoal = () => {
    if (currentGoal.trim() && !formData.projectGoals.includes(currentGoal.trim())) {
      setFormData(prev => ({
        ...prev,
        projectGoals: [...prev.projectGoals, currentGoal.trim()]
      }));
      setCurrentGoal('');
    }
  };

  const handleRemoveGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      projectGoals: prev.projectGoals.filter((_, i) => i !== index)
    }));
  };

  const handleAddInspiration = (app: string) => {
    if (!formData.inspirationApps.includes(app)) {
      setFormData(prev => ({
        ...prev,
        inspirationApps: [...prev.inspirationApps, app]
      }));
    }
    setInspirationInput('');
    setShowInspirationSuggestions(false);
  };

  const handleRemoveInspiration = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inspirationApps: prev.inspirationApps.filter((_, i) => i !== index)
    }));
  };

  const filteredInspirationApps = INSPIRATION_APPS.filter(app =>
    app.toLowerCase().includes(inspirationInput.toLowerCase()) &&
    !formData.inspirationApps.includes(app)
  );

  return (
    <div className={`vision-step ${className || ''}`}>
      <div className="vision-header">
        <h2>Define Your Project Vision</h2>
        <p>Tell us about your project idea and we'll help you shape it into reality</p>
      </div>

      <div className="vision-content">
        {/* Left Column - Form */}
        <div className="vision-form">
          {/* Project Name */}
          <div className="form-group">
            <label htmlFor="projectName" className="form-label required">
              <LightBulbIcon size={16} />
              Project Name
            </label>
            <Input
              id="projectName"
              type="text"
              placeholder="Enter your project name..."
              value={formData.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              maxLength={50}
              className="form-input"
            />
            <div className="character-count">
              {formData.projectName.length}/50
            </div>
          </div>

          {/* Project Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label required">
              Project Description
            </label>
            <Textarea
              id="description"
              placeholder="Describe what your project does, its main purpose, and what problems it solves..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              maxLength={500}
              className="form-textarea"
            />
            <div className="character-count">
              {formData.description.length}/500
            </div>
          </div>

          {/* Core Features */}
          <div className="form-group">
            <label htmlFor="coreFeatures" className="form-label required">
              Core Functionality
            </label>
            <Textarea
              id="coreFeatures"
              placeholder="List the key features and functionality you want to include..."
              value={formData.coreFeatures}
              onChange={(e) => handleInputChange('coreFeatures', e.target.value)}
              rows={3}
              maxLength={400}
              className="form-textarea"
            />
            <div className="character-count">
              {formData.coreFeatures.length}/400
            </div>
          </div>

          {/* Target Audience */}
          <div className="form-group">
            <label htmlFor="targetAudience" className="form-label">
              <UserGroupIcon size={16} />
              Target Audience
            </label>
            <Input
              id="targetAudience"
              type="text"
              placeholder="Who will use this application?"
              value={formData.targetAudience}
              onChange={(e) => handleInputChange('targetAudience', e.target.value)}
              maxLength={100}
              className="form-input"
            />
            <div className="character-count">
              {formData.targetAudience.length}/100
            </div>
          </div>

          {/* Inspiration Apps */}
          <div className="form-group">
            <label className="form-label">
              <SparklesIcon size={16} />
              Inspiration Apps
            </label>
            <div className="inspiration-input-container">
              <Input
                type="text"
                placeholder="Add apps that inspire your project..."
                value={inspirationInput}
                onChange={(e) => {
                  setInspirationInput(e.target.value);
                  setShowInspirationSuggestions(e.target.value.length > 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inspirationInput.trim()) {
                    handleAddInspiration(inspirationInput.trim());
                  }
                }}
                className="form-input"
              />
              
              {showInspirationSuggestions && filteredInspirationApps.length > 0 && (
                <div className="inspiration-suggestions">
                  {filteredInspirationApps.slice(0, 6).map(app => (
                    <button
                      key={app}
                      className="inspiration-suggestion"
                      onClick={() => handleAddInspiration(app)}
                    >
                      {app}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {formData.inspirationApps.length > 0 && (
              <div className="inspiration-tags">
                {formData.inspirationApps.map((app, index) => (
                  <div key={index} className="inspiration-tag">
                    <span>{app}</span>
                    <button
                      onClick={() => handleRemoveInspiration(index)}
                      className="remove-tag"
                    >
                      <CloseIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project Goals */}
          <div className="form-group">
            <label className="form-label">
              Project Goals
            </label>
            <div className="goal-input-container">
              <Input
                type="text"
                placeholder="Add a project goal..."
                value={currentGoal}
                onChange={(e) => setCurrentGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddGoal();
                  }
                }}
                className="form-input"
              />
              <button
                onClick={handleAddGoal}
                disabled={!currentGoal.trim()}
                className="add-goal-btn"
              >
                Add
              </button>
            </div>

            {formData.projectGoals.length > 0 && (
              <div className="goals-list">
                {formData.projectGoals.map((goal, index) => (
                  <div key={index} className="goal-item">
                    <span>{goal}</span>
                    <button
                      onClick={() => handleRemoveGoal(index)}
                      className="remove-goal"
                    >
                      <CloseIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - AI Suggestions */}
        <div className="vision-ai-panel">
          <div className="ai-panel-header">
            <RobotIcon size={20} />
            <h3>Claude's Analysis</h3>
            {isAnalyzing && <div className="ai-loading">Analyzing...</div>}
          </div>

          {aiSuggestions ? (
            <div className="ai-suggestions">
              {aiSuggestions.projectType && (
                <div className="suggestion-section">
                  <h4>Project Type</h4>
                  <p>{aiSuggestions.projectType}</p>
                </div>
              )}

              {aiSuggestions.complexity && (
                <div className="suggestion-section">
                  <h4>Complexity Assessment</h4>
                  <div className="complexity-badge complexity-{aiSuggestions.complexity.level}">
                    {aiSuggestions.complexity.level} ({aiSuggestions.complexity.score}/10)
                  </div>
                  <p>{aiSuggestions.complexity.reasoning}</p>
                </div>
              )}

              {aiSuggestions.recommendations && aiSuggestions.recommendations.length > 0 && (
                <div className="suggestion-section">
                  <h4>Recommendations</h4>
                  <ul className="recommendation-list">
                    {aiSuggestions.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSuggestions.additionalFeatures && aiSuggestions.additionalFeatures.length > 0 && (
                <div className="suggestion-section">
                  <h4>Suggested Features</h4>
                  <div className="feature-suggestions">
                    {aiSuggestions.additionalFeatures.map((feature, index) => (
                      <div key={index} className="feature-suggestion">
                        <span>{feature}</span>
                        <button
                          onClick={() => {
                            const newFeatures = formData.coreFeatures + 
                              (formData.coreFeatures ? '\n' : '') + `• ${feature}`;
                            handleInputChange('coreFeatures', newFeatures);
                          }}
                          className="add-feature-btn"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="ai-placeholder">
              <p>Start filling out your project details and I'll provide personalized suggestions and analysis.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .vision-step {
          max-width: 1100px;
          margin: 0 auto;
        }

        .vision-header {
          text-align: center;
          margin-bottom: var(--vf-space-8);
        }

        .vision-header h2 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-2xl);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-2) 0;
          text-transform: uppercase;
        }

        .vision-header p {
          font-size: var(--vf-text-base);
          color: var(--vf-text-muted);
          margin: 0;
        }

        .vision-content {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: var(--vf-space-8);
        }

        .vision-form {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-6);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-2);
        }

        .form-label {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-sm);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: var(--vf-space-2);
        }

        .form-label.required::after {
          content: '*';
          color: var(--vf-accent-danger);
          margin-left: var(--vf-space-1);
        }

        .form-input,
        .form-textarea {
          background: var(--vf-bg-tertiary);
          border: 2px solid var(--vf-surface-border);
          color: var(--vf-text-primary);
          padding: var(--vf-space-3);
          font-family: var(--vf-font-body);
          font-size: var(--vf-text-base);
          transition: border-color var(--vf-transition-fast);
          resize: vertical;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--vf-accent-primary);
        }

        .form-textarea {
          min-height: 80px;
          line-height: 1.5;
        }

        .character-count {
          font-size: var(--vf-text-xs);
          color: var(--vf-text-muted);
          text-align: right;
          font-family: var(--vf-font-mono);
        }

        .inspiration-input-container {
          position: relative;
        }

        .inspiration-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--vf-bg-tertiary);
          border: 2px solid var(--vf-surface-border);
          border-top: none;
          max-height: 200px;
          overflow-y: auto;
          z-index: 10;
        }

        .inspiration-suggestion {
          display: block;
          width: 100%;
          padding: var(--vf-space-2) var(--vf-space-3);
          background: transparent;
          border: none;
          color: var(--vf-text-secondary);
          text-align: left;
          cursor: pointer;
          transition: background-color var(--vf-transition-fast);
        }

        .inspiration-suggestion:hover {
          background: var(--vf-bg-elevated);
          color: var(--vf-text-primary);
        }

        .inspiration-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--vf-space-2);
          margin-top: var(--vf-space-2);
        }

        .inspiration-tag {
          background: var(--vf-accent-primary);
          color: var(--vf-bg-primary);
          padding: var(--vf-space-1) var(--vf-space-2);
          font-size: var(--vf-text-xs);
          font-weight: var(--vf-weight-bold);
          display: flex;
          align-items: center;
          gap: var(--vf-space-1);
        }

        .remove-tag {
          background: transparent;
          border: none;
          color: var(--vf-bg-primary);
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .remove-tag:hover {
          opacity: 0.7;
        }

        .goal-input-container {
          display: flex;
          gap: var(--vf-space-2);
        }

        .add-goal-btn {
          background: var(--vf-accent-primary);
          color: var(--vf-bg-primary);
          border: 2px solid var(--vf-accent-primary);
          padding: var(--vf-space-3) var(--vf-space-4);
          font-family: var(--vf-font-body);
          font-size: var(--vf-text-sm);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
          cursor: pointer;
          transition: all var(--vf-transition-fast);
          white-space: nowrap;
        }

        .add-goal-btn:hover:not(:disabled) {
          background: var(--vf-accent-active);
          border-color: var(--vf-accent-active);
        }

        .add-goal-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .goals-list {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-2);
          margin-top: var(--vf-space-2);
        }

        .goal-item {
          background: var(--vf-bg-tertiary);
          border: 1px solid var(--vf-surface-border);
          padding: var(--vf-space-2) var(--vf-space-3);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--vf-space-2);
        }

        .goal-item span {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-secondary);
        }

        .remove-goal {
          background: transparent;
          border: none;
          color: var(--vf-text-muted);
          cursor: pointer;
          padding: var(--vf-space-1);
          display: flex;
          align-items: center;
          transition: color var(--vf-transition-fast);
        }

        .remove-goal:hover {
          color: var(--vf-accent-danger);
        }

        .vision-ai-panel {
          background: var(--vf-bg-secondary);
          border: 2px solid var(--vf-surface-border);
          padding: var(--vf-space-4);
          height: fit-content;
          position: sticky;
          top: 0;
        }

        .ai-panel-header {
          display: flex;
          align-items: center;
          gap: var(--vf-space-2);
          margin-bottom: var(--vf-space-4);
          padding-bottom: var(--vf-space-3);
          border-bottom: 1px solid var(--vf-surface-border);
        }

        .ai-panel-header h3 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-base);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0;
          text-transform: uppercase;
          flex: 1;
        }

        .ai-loading {
          font-size: var(--vf-text-xs);
          color: var(--vf-accent-info);
          font-family: var(--vf-font-mono);
        }

        .ai-suggestions {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-4);
        }

        .suggestion-section h4 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-sm);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-accent-primary);
          margin: 0 0 var(--vf-space-2) 0;
          text-transform: uppercase;
        }

        .suggestion-section p {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-secondary);
          line-height: 1.4;
          margin: 0;
        }

        .complexity-badge {
          padding: var(--vf-space-1) var(--vf-space-2);
          font-size: var(--vf-text-xs);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
          margin-bottom: var(--vf-space-2);
          display: inline-block;
        }

        .complexity-low {
          background: var(--vf-accent-success);
          color: var(--vf-bg-primary);
        }

        .complexity-medium {
          background: var(--vf-accent-primary);
          color: var(--vf-bg-primary);
        }

        .complexity-high {
          background: var(--vf-accent-danger);
          color: var(--vf-text-primary);
        }

        .recommendation-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .recommendation-list li {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-secondary);
          line-height: 1.4;
          margin-bottom: var(--vf-space-2);
          position: relative;
          padding-left: var(--vf-space-4);
        }

        .recommendation-list li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: var(--vf-accent-primary);
          font-weight: var(--vf-weight-bold);
        }

        .feature-suggestions {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-2);
        }

        .feature-suggestion {
          background: var(--vf-bg-tertiary);
          border: 1px solid var(--vf-surface-border);
          padding: var(--vf-space-2);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--vf-space-2);
        }

        .feature-suggestion span {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-secondary);
          flex: 1;
        }

        .add-feature-btn {
          background: transparent;
          border: 1px solid var(--vf-accent-primary);
          color: var(--vf-accent-primary);
          padding: var(--vf-space-1) var(--vf-space-2);
          font-size: var(--vf-text-xs);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
          cursor: pointer;
          transition: all var(--vf-transition-fast);
        }

        .add-feature-btn:hover {
          background: var(--vf-accent-primary);
          color: var(--vf-bg-primary);
        }

        .ai-placeholder {
          text-align: center;
          padding: var(--vf-space-6);
        }

        .ai-placeholder p {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-muted);
          line-height: 1.5;
          margin: 0;
        }

        @media (max-width: 768px) {
          .vision-content {
            grid-template-columns: 1fr;
            gap: var(--vf-space-4);
          }

          .vision-ai-panel {
            position: static;
          }
        }
      `}</style>
    </div>
  );
};

export default ProjectVisionStep;