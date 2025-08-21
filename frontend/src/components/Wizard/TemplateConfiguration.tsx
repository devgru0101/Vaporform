import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Textarea } from '../ui/Textarea';
import { 
  CodeIcon, 
  EyeIcon, 
  DocumentTextIcon,
  CogIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '../ui/Icons';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: number;
  techStack: {
    frontend: string;
    backend: string;
    database: string;
  };
  features: string[];
  variables: TemplateVariable[];
  prerequisites: string[];
}

interface TemplateVariable {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'select' | 'multiselect';
  description: string;
  required: boolean;
  default?: any;
  options?: string[];
}

interface ProjectStructure {
  [path: string]: string;
}

interface TemplateConfigurationProps {
  selectedTemplate?: Template;
  templates: Template[];
  onTemplateSelect: (templateId: string) => void;
  configuration: Record<string, any>;
  onConfigurationChange: (config: Record<string, any>) => void;
  projectStructure?: ProjectStructure;
  onPreview: () => void;
  isGeneratingPreview: boolean;
}

const mockTemplates: Template[] = [
  {
    id: 'react-express-postgresql',
    name: 'React Full-Stack App',
    description: 'Complete full-stack application with React frontend, Express.js backend, and PostgreSQL database',
    category: 'Full-Stack',
    complexity: 3,
    techStack: {
      frontend: 'React + TypeScript',
      backend: 'Express.js',
      database: 'PostgreSQL'
    },
    features: [
      'User authentication',
      'CRUD operations',
      'Responsive design',
      'API documentation',
      'Database migrations',
      'TypeScript support'
    ],
    variables: [
      {
        name: 'projectName',
        type: 'string',
        description: 'Project name (used for package.json and folder names)',
        required: true
      },
      {
        name: 'description',
        type: 'string',
        description: 'Project description',
        required: true
      },
      {
        name: 'authProvider',
        type: 'select',
        description: 'Authentication provider',
        options: ['local', 'auth0', 'firebase', 'supabase'],
        default: 'local',
        required: true
      },
      {
        name: 'includeAdmin',
        type: 'boolean',
        description: 'Include admin dashboard',
        default: false,
        required: false
      },
      {
        name: 'apiPrefix',
        type: 'string',
        description: 'API route prefix',
        default: '/api/v1',
        required: false
      }
    ],
    prerequisites: ['Node.js 18+', 'PostgreSQL 14+', 'Docker']
  },
  {
    id: 'vue-fastapi-mongodb',
    name: 'Vue + FastAPI App',
    description: 'Modern web application with Vue.js frontend, FastAPI backend, and MongoDB database',
    category: 'Full-Stack',
    complexity: 3,
    techStack: {
      frontend: 'Vue.js 3',
      backend: 'FastAPI',
      database: 'MongoDB'
    },
    features: [
      'Vue 3 Composition API',
      'FastAPI automatic docs',
      'MongoDB with Pydantic',
      'JWT authentication',
      'Real-time updates'
    ],
    variables: [
      {
        name: 'projectName',
        type: 'string',
        description: 'Project name',
        required: true
      },
      {
        name: 'enableCORS',
        type: 'boolean',
        description: 'Enable CORS for API',
        default: true,
        required: false
      },
      {
        name: 'includeWebSocket',
        type: 'boolean',
        description: 'Include WebSocket support for real-time features',
        default: false,
        required: false
      }
    ],
    prerequisites: ['Python 3.9+', 'Node.js 18+', 'MongoDB']
  }
];

export const TemplateConfiguration: React.FC<TemplateConfigurationProps> = ({
  selectedTemplate,
  templates = mockTemplates,
  onTemplateSelect,
  configuration,
  onConfigurationChange,
  projectStructure,
  onPreview,
  isGeneratingPreview
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'configuration' | 'preview'>('templates');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validate configuration
  useEffect(() => {
    if (selectedTemplate) {
      const errors: Record<string, string> = {};
      
      selectedTemplate.variables.forEach(variable => {
        const value = configuration[variable.name];
        
        if (variable.required && (!value || value === '')) {
          errors[variable.name] = `${variable.name} is required`;
        }
        
        if (value && variable.type === 'number' && isNaN(Number(value))) {
          errors[variable.name] = `${variable.name} must be a number`;
        }
      });
      
      setValidationErrors(errors);
    }
  }, [selectedTemplate, configuration]);

  const updateConfiguration = (key: string, value: any) => {
    onConfigurationChange({
      ...configuration,
      [key]: value
    });
  };

  const renderTemplateCard = (template: Template) => (
    <Card
      key={template.id}
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        selectedTemplate?.id === template.id
          ? 'ring-2 ring-blue-500 border-blue-500'
          : 'hover:border-gray-300'
      }`}
      onClick={() => onTemplateSelect(template.id)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription className="mt-1">
              {template.description}
            </CardDescription>
          </div>
          {selectedTemplate?.id === template.id && (
            <CheckIcon className="w-5 h-5 text-blue-600" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tech Stack */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Tech Stack</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Frontend:</span>
              <span className="font-medium">{template.techStack.frontend}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Backend:</span>
              <span className="font-medium">{template.techStack.backend}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Database:</span>
              <span className="font-medium">{template.techStack.database}</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Features</h4>
          <div className="flex flex-wrap gap-1">
            {template.features.slice(0, 3).map(feature => (
              <Badge key={feature} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
            {template.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.features.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Complexity */}
        <div className="flex justify-between items-center pt-2 border-t">
          <Badge
            className={`text-xs ${
              template.complexity <= 2 ? 'bg-green-100 text-green-800' :
              template.complexity <= 3 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}
          >
            Complexity: {template.complexity}/5
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const renderConfigurationForm = () => {
    if (!selectedTemplate) {
      return (
        <div className="text-center py-8">
          <CogIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a Template First
          </h3>
          <p className="text-gray-600">
            Choose a template from the Templates tab to configure it.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Configure: {selectedTemplate.name}
          </h3>
          <p className="text-gray-600 mb-6">
            Customize the template settings to match your project requirements.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Template Variables</CardTitle>
            <CardDescription>
              Configure the template-specific settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTemplate.variables.map(variable => (
              <div key={variable.name}>
                <Label htmlFor={variable.name}>
                  {variable.name}
                  {variable.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <p className="text-sm text-gray-600 mb-2">{variable.description}</p>
                
                {variable.type === 'string' && (
                  <Input
                    id={variable.name}
                    value={configuration[variable.name] || variable.default || ''}
                    onChange={(e) => updateConfiguration(variable.name, e.target.value)}
                    placeholder={variable.default || ''}
                  />
                )}
                
                {variable.type === 'boolean' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={variable.name}
                      checked={configuration[variable.name] ?? variable.default ?? false}
                      onCheckedChange={(checked) => updateConfiguration(variable.name, checked)}
                    />
                    <Label htmlFor={variable.name} className="text-sm">
                      Enable this feature
                    </Label>
                  </div>
                )}
                
                {variable.type === 'select' && variable.options && (
                  <Select
                    value={configuration[variable.name] || variable.default}
                    onValueChange={(value) => updateConfiguration(variable.name, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {variable.options.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {variable.type === 'number' && (
                  <Input
                    id={variable.name}
                    type="number"
                    value={configuration[variable.name] || variable.default || ''}
                    onChange={(e) => updateConfiguration(variable.name, e.target.value)}
                    placeholder={variable.default?.toString() || ''}
                  />
                )}

                {validationErrors[variable.name] && (
                  <div className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    <span>{validationErrors[variable.name]}</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Prerequisites */}
        <Card>
          <CardHeader>
            <CardTitle>Prerequisites</CardTitle>
            <CardDescription>
              Make sure you have these installed before proceeding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedTemplate.prerequisites.map(prereq => (
                <div key={prereq} className="flex items-center space-x-2">
                  <CheckIcon className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{prereq}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Generate Preview Button */}
        <div className="flex justify-center">
          <Button
            onClick={onPreview}
            disabled={Object.keys(validationErrors).length > 0 || isGeneratingPreview}
            size="lg"
          >
            {isGeneratingPreview ? (
              <>
                <CogIcon className="w-4 h-4 mr-2 animate-spin" />
                Generating Preview...
              </>
            ) : (
              <>
                <EyeIcon className="w-4 h-4 mr-2" />
                Generate Preview
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    if (!projectStructure) {
      return (
        <div className="text-center py-8">
          <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Preview Available
          </h3>
          <p className="text-gray-600">
            Generate a preview from the Configuration tab to see your project structure.
          </p>
        </div>
      );
    }

    const files = Object.keys(projectStructure).sort();
    const folders = Array.from(new Set(
      files
        .map(file => file.split('/').slice(0, -1).join('/'))
        .filter(folder => folder)
    )).sort();

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Project Structure Preview
          </h3>
          <p className="text-gray-600 mb-6">
            This is how your project will be structured when generated.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>File Structure</CardTitle>
            <CardDescription>
              Generated files and folders for your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
              {files.map(file => {
                const depth = file.split('/').length - 1;
                const fileName = file.split('/').pop();
                const isDirectory = projectStructure[file] === 'Directory';
                
                return (
                  <div
                    key={file}
                    className="flex items-center space-x-2"
                    style={{ paddingLeft: `${depth * 20}px` }}
                  >
                    <span className="text-gray-400">
                      {isDirectory ? '📁' : '📄'}
                    </span>
                    <span className={isDirectory ? 'font-semibold text-blue-600' : 'text-gray-900'}>
                      {fileName}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sample file content */}
        {selectedTemplate && (
          <Card>
            <CardHeader>
              <CardTitle>Sample Files</CardTitle>
              <CardDescription>
                Preview of key generated files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">package.json</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md font-mono text-sm overflow-x-auto">
                    <pre>{JSON.stringify({
                      name: configuration.projectName || 'my-project',
                      version: '1.0.0',
                      description: configuration.description || 'Generated project',
                      scripts: {
                        dev: 'npm run dev:frontend & npm run dev:backend',
                        build: 'npm run build:frontend && npm run build:backend'
                      }
                    }, null, 2)}</pre>
                  </div>
                </div>

                <div>
                  <Label className="font-medium">README.md</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                    <pre>{`# ${configuration.projectName || 'My Project'}

${configuration.description || 'Generated project description'}

## Tech Stack

- Frontend: ${selectedTemplate.techStack.frontend}
- Backend: ${selectedTemplate.techStack.backend}
- Database: ${selectedTemplate.techStack.database}

## Quick Start

1. Install dependencies: \`npm install\`
2. Start development: \`npm run dev\`
3. Open http://localhost:3000`}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Configure Your Template
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose a template and customize it to match your specific requirements.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('templates')}
          >
            <CodeIcon className="w-4 h-4 inline mr-2" />
            Templates
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'configuration'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('configuration')}
          >
            <CogIcon className="w-4 h-4 inline mr-2" />
            Configuration
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('preview')}
          >
            <EyeIcon className="w-4 h-4 inline mr-2" />
            Preview
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(renderTemplateCard)}
          </div>
        )}

        {activeTab === 'configuration' && renderConfigurationForm()}

        {activeTab === 'preview' && renderPreview()}
      </div>
    </div>
  );
};