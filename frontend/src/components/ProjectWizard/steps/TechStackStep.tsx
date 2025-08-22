import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { 
  RobotIcon, 
  CheckIcon, 
  ServerIcon, 
  CodeIcon, 
  DatabaseIcon,
  SparklesIcon
} from '../../ui/Icons';
import { updateTechStack, getRecommendedTemplates } from '../../../store/projectWizard';

interface TechStackStepProps {
  className?: string;
}

const TECH_STACK_TEMPLATES = [
  {
    id: 'encore-react',
    name: 'Encore.ts + React',
    description: 'Full-stack TypeScript with Encore backend and React frontend',
    category: 'Recommended',
    badge: 'Popular',
    techStack: {
      backend: 'Encore.ts',
      frontend: 'React + TypeScript',
      database: 'PostgreSQL',
      hosting: 'Encore Cloud'
    },
    features: [
      'Type-safe APIs',
      'Real-time capabilities',
      'Built-in auth',
      'Auto-scaling',
      'Monitoring included'
    ],
    complexity: 'Medium',
    setupTime: '15 minutes',
    pros: [
      'Fast development',
      'Type safety end-to-end',
      'Built-in infrastructure',
      'Great for MVPs'
    ],
    cons: [
      'Encore-specific patterns',
      'Limited to TypeScript'
    ]
  },
  {
    id: 'encore-solid',
    name: 'Encore.ts + Solid.js',
    description: 'High-performance setup with Encore backend and Solid.js frontend',
    category: 'Alternative',
    badge: 'Fast',
    techStack: {
      backend: 'Encore.ts',
      frontend: 'Solid.js + TypeScript',
      database: 'PostgreSQL',
      hosting: 'Encore Cloud'
    },
    features: [
      'Superior performance',
      'Small bundle size',
      'Reactive primitives',
      'Type-safe APIs'
    ],
    complexity: 'Medium',
    setupTime: '20 minutes',
    pros: [
      'Fastest frontend performance',
      'Smaller bundles than React',
      'Modern reactive system'
    ],
    cons: [
      'Smaller ecosystem',
      'Learning curve'
    ]
  },
  {
    id: 'encore-vue',
    name: 'Encore.go + Vue 3',
    description: 'Scalable Go backend with modern Vue.js frontend',
    category: 'Alternative',
    badge: 'Scalable',
    techStack: {
      backend: 'Encore.go',
      frontend: 'Vue 3 + TypeScript',
      database: 'PostgreSQL',
      hosting: 'Encore Cloud'
    },
    features: [
      'Go performance',
      'Vue 3 Composition API',
      'Strong typing',
      'Enterprise ready'
    ],
    complexity: 'High',
    setupTime: '25 minutes',
    pros: [
      'Excellent performance',
      'Great developer experience',
      'Strong typing',
      'Mature ecosystem'
    ],
    cons: [
      'Multi-language complexity',
      'Longer setup time'
    ]
  },
  {
    id: 'custom',
    name: 'Custom Configuration',
    description: 'Choose your own tech stack components',
    category: 'Custom',
    badge: 'Flexible',
    techStack: {
      backend: 'Choose...',
      frontend: 'Choose...',
      database: 'Choose...',
      hosting: 'Choose...'
    },
    features: [
      'Full flexibility',
      'Any technology',
      'Custom architecture',
      'Your choice'
    ],
    complexity: 'Variable',
    setupTime: 'Variable',
    pros: [
      'Complete control',
      'Use preferred tools',
      'Optimize for specific needs'
    ],
    cons: [
      'More setup required',
      'No built-in integration'
    ]
  }
];

const CUSTOM_OPTIONS = {
  backend: [
    { id: 'encore-ts', name: 'Encore.ts', description: 'TypeScript backend framework' },
    { id: 'encore-go', name: 'Encore.go', description: 'Go backend framework' },
    { id: 'nodejs', name: 'Node.js + Express', description: 'JavaScript backend' },
    { id: 'nestjs', name: 'NestJS', description: 'TypeScript Node.js framework' },
    { id: 'python', name: 'Python + FastAPI', description: 'Python backend' },
    { id: 'rails', name: 'Ruby on Rails', description: 'Ruby backend framework' }
  ],
  frontend: [
    { id: 'react', name: 'React', description: 'Popular UI library' },
    { id: 'vue', name: 'Vue.js', description: 'Progressive framework' },
    { id: 'solid', name: 'Solid.js', description: 'High-performance framework' },
    { id: 'svelte', name: 'Svelte', description: 'Compile-time framework' },
    { id: 'angular', name: 'Angular', description: 'Full framework' },
    { id: 'vanilla', name: 'Vanilla JS', description: 'No framework' }
  ],
  database: [
    { id: 'postgresql', name: 'PostgreSQL', description: 'Relational database' },
    { id: 'mysql', name: 'MySQL', description: 'Popular SQL database' },
    { id: 'mongodb', name: 'MongoDB', description: 'Document database' },
    { id: 'redis', name: 'Redis', description: 'In-memory database' },
    { id: 'sqlite', name: 'SQLite', description: 'Lightweight database' },
    { id: 'supabase', name: 'Supabase', description: 'PostgreSQL + APIs' }
  ],
  hosting: [
    { id: 'encore-cloud', name: 'Encore Cloud', description: 'Integrated hosting' },
    { id: 'vercel', name: 'Vercel', description: 'Frontend + serverless' },
    { id: 'netlify', name: 'Netlify', description: 'Jamstack hosting' },
    { id: 'aws', name: 'AWS', description: 'Amazon cloud services' },
    { id: 'gcp', name: 'Google Cloud', description: 'Google cloud platform' },
    { id: 'railway', name: 'Railway', description: 'Simple deployment' }
  ]
};

export const TechStackStep: React.FC<TechStackStepProps> = ({ className }) => {
  const dispatch = useDispatch();
  const { 
    projectData, 
    analysis, 
    recommendedTemplates, 
    availableTemplates,
    isLoadingTemplates,
    isAnalyzing 
  } = useSelector((state: RootState) => state.projectWizard);

  const [selectedTemplate, setSelectedTemplate] = useState(
    projectData.techStack.selectedTemplate || 'encore-react'
  );
  const [customChoices, setCustomChoices] = useState({
    backend: '',
    frontend: '',
    database: '',
    hosting: ''
  });
  const [showCustomConfig, setShowCustomConfig] = useState(false);

  // Update Redux state when selections change
  useEffect(() => {
    dispatch(updateTechStack({
      selectedTemplate,
      ...customChoices
    }));
  }, [selectedTemplate, customChoices, dispatch]);

  // Trigger AI analysis for recommended templates
  useEffect(() => {
    if (projectData.vision.name && projectData.vision.description && analysis) {
      const requirements = {
        projectType: analysis.requirements.name,
        complexity: analysis.estimatedComplexity,
        features: analysis.requirements.features,
        techPreferences: projectData.vision.projectGoals
      };
      
      dispatch(getRecommendedTemplates(requirements));
    }
  }, [projectData.vision, analysis, dispatch]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === 'custom') {
      setShowCustomConfig(true);
    } else {
      setShowCustomConfig(false);
    }
  };

  const handleCustomChoice = (category: string, value: string) => {
    setCustomChoices(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const selectedTemplateData = TECH_STACK_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className={`techstack-step ${className || ''}`}>
      <div className="techstack-header">
        <h2>Choose Your Tech Stack</h2>
        <p>Select the technologies that will power your application</p>
      </div>

      <div className="techstack-content">
        {/* AI Recommendations Panel */}
        {analysis && (
          <div className="ai-recommendations">
            <div className="ai-header">
              <RobotIcon size={20} />
              <h3>Claude's Recommendations</h3>
              {isAnalyzing && <div className="ai-loading">Analyzing...</div>}
            </div>
            
            <div className="recommendation-content">
              <div className="recommended-stack">
                <h4>Recommended for Your Project</h4>
                <div className="stack-recommendation">
                  <div className="stack-item">
                    <CodeIcon size={16} />
                    <span>Frontend: {analysis.recommendations.frontend.framework}</span>
                  </div>
                  <div className="stack-item">
                    <ServerIcon size={16} />
                    <span>Backend: {analysis.recommendations.backend.framework}</span>
                  </div>
                  <div className="stack-item">
                    <DatabaseIcon size={16} />
                    <span>Database: {analysis.recommendations.database.type}</span>
                  </div>
                </div>
                <p className="recommendation-reason">
                  {analysis.recommendations.frontend.reasoning}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Template Selection */}
        <div className="template-section">
          <h3>Select a Template</h3>
          <div className="template-grid">
            {TECH_STACK_TEMPLATES.map(template => (
              <div
                key={template.id}
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <div className="template-header">
                  <div className="template-title">
                    <h4>{template.name}</h4>
                    <div className="template-badges">
                      <span className={`category-badge ${template.category.toLowerCase()}`}>
                        {template.category}
                      </span>
                      {template.badge && (
                        <span className="feature-badge">
                          {template.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedTemplate === template.id && (
                    <CheckIcon size={20} className="selected-icon" />
                  )}
                </div>

                <p className="template-description">
                  {template.description}
                </p>

                <div className="tech-stack-preview">
                  <div className="stack-row">
                    <span className="stack-label">Backend:</span>
                    <span className="stack-value">{template.techStack.backend}</span>
                  </div>
                  <div className="stack-row">
                    <span className="stack-label">Frontend:</span>
                    <span className="stack-value">{template.techStack.frontend}</span>
                  </div>
                  <div className="stack-row">
                    <span className="stack-label">Database:</span>
                    <span className="stack-value">{template.techStack.database}</span>
                  </div>
                  <div className="stack-row">
                    <span className="stack-label">Hosting:</span>
                    <span className="stack-value">{template.techStack.hosting}</span>
                  </div>
                </div>

                <div className="template-meta">
                  <div className="meta-item">
                    <span className="meta-label">Complexity:</span>
                    <span className={`complexity-badge ${template.complexity.toLowerCase()}`}>
                      {template.complexity}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Setup:</span>
                    <span className="meta-value">{template.setupTime}</span>
                  </div>
                </div>

                <div className="template-features">
                  <h5>Key Features</h5>
                  <ul>
                    {template.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Configuration */}
        {showCustomConfig && (
          <div className="custom-config">
            <h3>Custom Configuration</h3>
            <div className="custom-grid">
              {Object.entries(CUSTOM_OPTIONS).map(([category, options]) => (
                <div key={category} className="custom-category">
                  <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                  <div className="custom-options">
                    {options.map(option => (
                      <button
                        key={option.id}
                        className={`custom-option ${customChoices[category] === option.id ? 'selected' : ''}`}
                        onClick={() => handleCustomChoice(category, option.id)}
                      >
                        <div className="option-content">
                          <span className="option-name">{option.name}</span>
                          <span className="option-description">{option.description}</span>
                        </div>
                        {customChoices[category] === option.id && (
                          <CheckIcon size={16} className="option-check" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Template Details */}
        {selectedTemplateData && selectedTemplate !== 'custom' && (
          <div className="template-details">
            <h3>Template Details</h3>
            <div className="details-grid">
              <div className="pros-cons">
                <div className="pros">
                  <h4>Advantages</h4>
                  <ul>
                    {selectedTemplateData.pros.map((pro, index) => (
                      <li key={index}>{pro}</li>
                    ))}
                  </ul>
                </div>
                <div className="cons">
                  <h4>Considerations</h4>
                  <ul>
                    {selectedTemplateData.cons.map((con, index) => (
                      <li key={index}>{con}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .techstack-step {
          max-width: 1200px;
          margin: 0 auto;
        }

        .techstack-header {
          text-align: center;
          margin-bottom: var(--vf-space-8);
        }

        .techstack-header h2 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-2xl);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-2) 0;
          text-transform: uppercase;
        }

        .techstack-header p {
          font-size: var(--vf-text-base);
          color: var(--vf-text-muted);
          margin: 0;
        }

        .techstack-content {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-8);
        }

        .ai-recommendations {
          background: var(--vf-bg-secondary);
          border: 2px solid var(--vf-accent-primary);
          padding: var(--vf-space-4);
        }

        .ai-header {
          display: flex;
          align-items: center;
          gap: var(--vf-space-2);
          margin-bottom: var(--vf-space-4);
          padding-bottom: var(--vf-space-3);
          border-bottom: 1px solid var(--vf-surface-border);
        }

        .ai-header h3 {
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

        .recommended-stack h4 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-sm);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-accent-primary);
          margin: 0 0 var(--vf-space-3) 0;
          text-transform: uppercase;
        }

        .stack-recommendation {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-2);
          margin-bottom: var(--vf-space-3);
        }

        .stack-item {
          display: flex;
          align-items: center;
          gap: var(--vf-space-2);
          font-size: var(--vf-text-sm);
          color: var(--vf-text-secondary);
        }

        .recommendation-reason {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-muted);
          line-height: 1.4;
          margin: 0;
        }

        .template-section h3 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-xl);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-4) 0;
          text-transform: uppercase;
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--vf-space-4);
        }

        .template-card {
          background: var(--vf-bg-tertiary);
          border: 2px solid var(--vf-surface-border);
          padding: var(--vf-space-4);
          cursor: pointer;
          transition: all var(--vf-transition-fast);
        }

        .template-card:hover {
          border-color: var(--vf-surface-border-light);
        }

        .template-card.selected {
          border-color: var(--vf-accent-primary);
          background: var(--vf-bg-secondary);
        }

        .template-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--vf-space-3);
        }

        .template-title h4 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-base);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-2) 0;
        }

        .template-badges {
          display: flex;
          gap: var(--vf-space-2);
        }

        .category-badge,
        .feature-badge {
          padding: var(--vf-space-1) var(--vf-space-2);
          font-size: var(--vf-text-xs);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
        }

        .category-badge.recommended {
          background: var(--vf-accent-success);
          color: var(--vf-bg-primary);
        }

        .category-badge.alternative {
          background: var(--vf-accent-primary);
          color: var(--vf-bg-primary);
        }

        .category-badge.custom {
          background: var(--vf-text-muted);
          color: var(--vf-bg-primary);
        }

        .feature-badge {
          background: var(--vf-bg-primary);
          color: var(--vf-text-secondary);
          border: 1px solid var(--vf-surface-border);
        }

        .selected-icon {
          color: var(--vf-accent-primary);
        }

        .template-description {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-secondary);
          line-height: 1.4;
          margin: 0 0 var(--vf-space-4) 0;
        }

        .tech-stack-preview {
          background: var(--vf-bg-primary);
          border: 1px solid var(--vf-surface-border);
          padding: var(--vf-space-3);
          margin-bottom: var(--vf-space-4);
        }

        .stack-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--vf-space-1);
        }

        .stack-row:last-child {
          margin-bottom: 0;
        }

        .stack-label {
          font-size: var(--vf-text-xs);
          color: var(--vf-text-muted);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
        }

        .stack-value {
          font-size: var(--vf-text-xs);
          color: var(--vf-text-secondary);
          font-family: var(--vf-font-mono);
        }

        .template-meta {
          display: flex;
          gap: var(--vf-space-4);
          margin-bottom: var(--vf-space-4);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: var(--vf-space-2);
        }

        .meta-label {
          font-size: var(--vf-text-xs);
          color: var(--vf-text-muted);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
        }

        .complexity-badge {
          padding: var(--vf-space-1) var(--vf-space-2);
          font-size: var(--vf-text-xs);
          font-weight: var(--vf-weight-bold);
          text-transform: uppercase;
        }

        .complexity-badge.low {
          background: var(--vf-accent-success);
          color: var(--vf-bg-primary);
        }

        .complexity-badge.medium {
          background: var(--vf-accent-primary);
          color: var(--vf-bg-primary);
        }

        .complexity-badge.high {
          background: var(--vf-accent-danger);
          color: var(--vf-text-primary);
        }

        .meta-value {
          font-size: var(--vf-text-xs);
          color: var(--vf-text-secondary);
          font-family: var(--vf-font-mono);
        }

        .template-features h5 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-xs);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-2) 0;
          text-transform: uppercase;
        }

        .template-features ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .template-features li {
          font-size: var(--vf-text-xs);
          color: var(--vf-text-muted);
          margin-bottom: var(--vf-space-1);
          position: relative;
          padding-left: var(--vf-space-3);
        }

        .template-features li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--vf-accent-primary);
        }

        .custom-config h3 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-xl);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-4) 0;
          text-transform: uppercase;
        }

        .custom-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--vf-space-6);
        }

        .custom-category h4 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-base);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-3) 0;
          text-transform: uppercase;
        }

        .custom-options {
          display: flex;
          flex-direction: column;
          gap: var(--vf-space-2);
        }

        .custom-option {
          background: var(--vf-bg-tertiary);
          border: 2px solid var(--vf-surface-border);
          padding: var(--vf-space-3);
          cursor: pointer;
          transition: all var(--vf-transition-fast);
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
        }

        .custom-option:hover {
          border-color: var(--vf-surface-border-light);
        }

        .custom-option.selected {
          border-color: var(--vf-accent-primary);
          background: var(--vf-bg-secondary);
        }

        .option-content {
          flex: 1;
        }

        .option-name {
          display: block;
          font-size: var(--vf-text-sm);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin-bottom: var(--vf-space-1);
        }

        .option-description {
          display: block;
          font-size: var(--vf-text-xs);
          color: var(--vf-text-muted);
        }

        .option-check {
          color: var(--vf-accent-primary);
        }

        .template-details h3 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-xl);
          font-weight: var(--vf-weight-bold);
          color: var(--vf-text-primary);
          margin: 0 0 var(--vf-space-4) 0;
          text-transform: uppercase;
        }

        .pros-cons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--vf-space-6);
        }

        .pros h4,
        .cons h4 {
          font-family: var(--vf-font-display);
          font-size: var(--vf-text-base);
          font-weight: var(--vf-weight-bold);
          margin: 0 0 var(--vf-space-3) 0;
          text-transform: uppercase;
        }

        .pros h4 {
          color: var(--vf-accent-success);
        }

        .cons h4 {
          color: var(--vf-accent-danger);
        }

        .pros ul,
        .cons ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .pros li,
        .cons li {
          font-size: var(--vf-text-sm);
          color: var(--vf-text-secondary);
          margin-bottom: var(--vf-space-2);
          position: relative;
          padding-left: var(--vf-space-4);
          line-height: 1.4;
        }

        .pros li::before {
          content: '+';
          position: absolute;
          left: 0;
          color: var(--vf-accent-success);
          font-weight: var(--vf-weight-bold);
        }

        .cons li::before {
          content: '−';
          position: absolute;
          left: 0;
          color: var(--vf-accent-danger);
          font-weight: var(--vf-weight-bold);
        }

        @media (max-width: 768px) {
          .template-grid {
            grid-template-columns: 1fr;
          }

          .custom-grid {
            grid-template-columns: 1fr;
          }

          .pros-cons {
            grid-template-columns: 1fr;
          }

          .template-meta {
            flex-direction: column;
            gap: var(--vf-space-2);
          }
        }
      `}</style>
    </div>
  );
};

export default TechStackStep;