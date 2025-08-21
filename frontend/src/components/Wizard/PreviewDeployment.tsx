import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { 
  RocketIcon, 
  CloudIcon, 
  ContainerIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  CogIcon,
  ServerIcon,
  DatabaseIcon
} from '../ui/Icons';

interface ProjectStructure {
  [path: string]: string;
}

interface DeploymentConfig {
  platform: string;
  environment: 'development' | 'staging' | 'production';
  containerized: boolean;
  monitoring: boolean;
  backup: boolean;
  ssl: boolean;
  customDomain?: string;
  environmentVariables: Record<string, string>;
}

interface ResourceEstimate {
  cpu: string;
  memory: string;
  storage: string;
  bandwidth: string;
  cost: string;
}

interface PreviewDeploymentProps {
  projectStructure: ProjectStructure;
  deploymentConfig: DeploymentConfig;
  onDeploymentConfigChange: (config: DeploymentConfig) => void;
  resourceEstimate: ResourceEstimate;
  onDeploy: () => void;
  isDeploying: boolean;
  deploymentInstructions?: string[];
}

const deploymentPlatforms = [
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Optimal for frontend and serverless',
    type: 'Frontend',
    pricing: 'Free tier available',
    features: ['Global CDN', 'Automatic SSL', 'Preview deployments', 'Serverless functions'],
    icon: <CloudIcon className="w-6 h-6" />
  },
  {
    id: 'netlify',
    name: 'Netlify',
    description: 'JAMstack and static site hosting',
    type: 'Frontend',
    pricing: 'Free tier available',
    features: ['Global CDN', 'Form handling', 'Identity service', 'Split testing'],
    icon: <CloudIcon className="w-6 h-6" />
  },
  {
    id: 'railway',
    name: 'Railway',
    description: 'Full-stack deployment with databases',
    type: 'Full-Stack',
    pricing: '$5/month + usage',
    features: ['Database hosting', 'Environment management', 'GitHub integration', 'Metrics'],
    icon: <ServerIcon className="w-6 h-6" />
  },
  {
    id: 'heroku',
    name: 'Heroku',
    description: 'Platform-as-a-Service for web apps',
    type: 'Full-Stack',
    pricing: '$7/month per dyno',
    features: ['Add-on ecosystem', 'Pipeline deployments', 'Automatic scaling', 'Monitoring'],
    icon: <ServerIcon className="w-6 h-6" />
  },
  {
    id: 'aws',
    name: 'AWS',
    description: 'Enterprise cloud infrastructure',
    type: 'Enterprise',
    pricing: 'Pay-as-you-go',
    features: ['Full AWS ecosystem', 'Auto-scaling', 'Global infrastructure', 'Advanced monitoring'],
    icon: <CloudIcon className="w-6 h-6" />
  },
  {
    id: 'docker-compose',
    name: 'Docker Compose',
    description: 'Self-hosted containerized deployment',
    type: 'Self-Hosted',
    pricing: 'Server costs only',
    features: ['Full control', 'Multi-container apps', 'Volume management', 'Network isolation'],
    icon: <ContainerIcon className="w-6 h-6" />
  }
];

export const PreviewDeployment: React.FC<PreviewDeploymentProps> = ({
  projectStructure,
  deploymentConfig,
  onDeploymentConfigChange,
  resourceEstimate,
  onDeploy,
  isDeploying,
  deploymentInstructions = []
}) => {
  const [activeTab, setActiveTab] = useState<'structure' | 'config' | 'deployment'>('structure');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateDeploymentConfig = (updates: Partial<DeploymentConfig>) => {
    onDeploymentConfigChange({ ...deploymentConfig, ...updates });
  };

  const addEnvironmentVariable = (key: string, value: string) => {
    if (key.trim() && value.trim()) {
      updateDeploymentConfig({
        environmentVariables: {
          ...deploymentConfig.environmentVariables,
          [key]: value
        }
      });
    }
  };

  const removeEnvironmentVariable = (key: string) => {
    const newEnvVars = { ...deploymentConfig.environmentVariables };
    delete newEnvVars[key];
    updateDeploymentConfig({ environmentVariables: newEnvVars });
  };

  const renderProjectStructure = () => {
    const files = Object.keys(projectStructure).sort();
    const stats = {
      totalFiles: files.length,
      components: files.filter(f => f.includes('component') || f.includes('Component')).length,
      pages: files.filter(f => f.includes('page') || f.includes('Page')).length,
      apis: files.filter(f => f.includes('api') || f.includes('route')).length,
      tests: files.filter(f => f.includes('test') || f.includes('spec')).length
    };

    return (
      <div className="space-y-6">
        {/* Project Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.totalFiles}</p>
                <p className="text-sm text-gray-600">Total Files</p>
              </div>
              <DocumentIcon className="w-8 h-8 text-blue-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.components}</p>
                <p className="text-sm text-gray-600">Components</p>
              </div>
              <CogIcon className="w-8 h-8 text-green-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.pages}</p>
                <p className="text-sm text-gray-600">Pages</p>
              </div>
              <DocumentIcon className="w-8 h-8 text-purple-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.apis}</p>
                <p className="text-sm text-gray-600">API Routes</p>
              </div>
              <ServerIcon className="w-8 h-8 text-orange-600" />
            </CardContent>
          </Card>
        </div>

        {/* File Tree */}
        <Card>
          <CardHeader>
            <CardTitle>Project Structure</CardTitle>
            <CardDescription>
              Complete file and folder structure of your generated project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm space-y-1 max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-md">
              {files.map(file => {
                const depth = file.split('/').length - 1;
                const fileName = file.split('/').pop();
                const isDirectory = projectStructure[file] === 'Directory';
                const fileExtension = fileName?.split('.').pop();
                
                const getFileIcon = () => {
                  if (isDirectory) return '📁';
                  if (['js', 'jsx', 'ts', 'tsx'].includes(fileExtension || '')) return '📜';
                  if (['json'].includes(fileExtension || '')) return '⚙️';
                  if (['md'].includes(fileExtension || '')) return '📋';
                  if (['css', 'scss', 'sass'].includes(fileExtension || '')) return '🎨';
                  if (['html'].includes(fileExtension || '')) return '🌐';
                  return '📄';
                };
                
                return (
                  <div
                    key={file}
                    className="flex items-center space-x-2 hover:bg-gray-100 px-2 py-1 rounded"
                    style={{ paddingLeft: `${depth * 20}px` }}
                  >
                    <span>{getFileIcon()}</span>
                    <span className={isDirectory ? 'font-semibold text-blue-600' : 'text-gray-900'}>
                      {fileName}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDeploymentConfig = () => (
    <div className="space-y-6">
      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Platform</CardTitle>
          <CardDescription>
            Choose where you want to deploy your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deploymentPlatforms.map(platform => (
              <div
                key={platform.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  deploymentConfig.platform === platform.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:border-gray-300'
                }`}
                onClick={() => updateDeploymentConfig({ platform: platform.id })}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-blue-600">{platform.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{platform.name}</h3>
                      {deploymentConfig.platform === platform.id && (
                        <CheckIcon className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{platform.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {platform.type}
                      </Badge>
                      <span className="text-xs text-gray-500">{platform.pricing}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Environment Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Configuration</CardTitle>
          <CardDescription>
            Configure deployment environment and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Environment</Label>
            <Select
              value={deploymentConfig.environment}
              onValueChange={(value: any) => updateDeploymentConfig({ environment: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="containerized"
                checked={deploymentConfig.containerized}
                onCheckedChange={(checked) => updateDeploymentConfig({ containerized: checked })}
              />
              <Label htmlFor="containerized" className="text-sm">
                Use containerization (Docker)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="monitoring"
                checked={deploymentConfig.monitoring}
                onCheckedChange={(checked) => updateDeploymentConfig({ monitoring: checked })}
              />
              <Label htmlFor="monitoring" className="text-sm">
                Enable monitoring & alerts
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="backup"
                checked={deploymentConfig.backup}
                onCheckedChange={(checked) => updateDeploymentConfig({ backup: checked })}
              />
              <Label htmlFor="backup" className="text-sm">
                Automated backups
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ssl"
                checked={deploymentConfig.ssl}
                onCheckedChange={(checked) => updateDeploymentConfig({ ssl: checked })}
              />
              <Label htmlFor="ssl" className="text-sm">
                SSL/HTTPS enabled
              </Label>
            </div>
          </div>

          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
                <Input
                  id="customDomain"
                  placeholder="myapp.com"
                  value={deploymentConfig.customDomain || ''}
                  onChange={(e) => updateDeploymentConfig({ customDomain: e.target.value })}
                />
              </div>

              {/* Environment Variables */}
              <div>
                <Label>Environment Variables</Label>
                <div className="space-y-2">
                  {Object.entries(deploymentConfig.environmentVariables).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Input value={key} disabled className="w-1/3" />
                      <Input value={value} disabled className="flex-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEnvironmentVariable(key)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <EnvironmentVariableAdd onAdd={addEnvironmentVariable} />
                </div>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </Button>
        </CardContent>
      </Card>

      {/* Resource Estimates */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Estimates</CardTitle>
          <CardDescription>
            Estimated resource requirements and costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">{resourceEstimate.cpu}</div>
              <div className="text-sm text-gray-600">CPU</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">{resourceEstimate.memory}</div>
              <div className="text-sm text-gray-600">Memory</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">{resourceEstimate.storage}</div>
              <div className="text-sm text-gray-600">Storage</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-semibold text-blue-600">{resourceEstimate.cost}</div>
              <div className="text-sm text-gray-600">Est. Monthly Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDeploymentInstructions = () => (
    <div className="space-y-6">
      {/* Deployment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Instructions</CardTitle>
          <CardDescription>
            Step-by-step guide to deploy your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deploymentInstructions.map((instruction, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="text-sm text-gray-900">{instruction}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Final Deploy Button */}
      <div className="text-center">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckIcon className="w-6 h-6" />
              <span className="text-lg font-semibold">Ready to Deploy</span>
            </div>
            <p className="text-gray-600">
              Your project is configured and ready for deployment. 
              Click the button below to start the deployment process.
            </p>
            <Button
              onClick={onDeploy}
              disabled={isDeploying}
              size="lg"
              className="px-8"
            >
              {isDeploying ? (
                <>
                  <RocketIcon className="w-5 h-5 mr-2 animate-bounce" />
                  Deploying...
                </>
              ) : (
                <>
                  <RocketIcon className="w-5 h-5 mr-2" />
                  Deploy Project
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Preview & Deploy
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Review your project structure, configure deployment settings, 
          and deploy your application to the cloud.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'structure'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('structure')}
          >
            <DocumentIcon className="w-4 h-4 inline mr-2" />
            Structure
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'config'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('config')}
          >
            <CogIcon className="w-4 h-4 inline mr-2" />
            Configuration
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'deployment'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('deployment')}
          >
            <RocketIcon className="w-4 h-4 inline mr-2" />
            Deploy
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'structure' && renderProjectStructure()}
        {activeTab === 'config' && renderDeploymentConfig()}
        {activeTab === 'deployment' && renderDeploymentInstructions()}
      </div>
    </div>
  );
};

// Helper component for adding environment variables
const EnvironmentVariableAdd: React.FC<{ onAdd: (key: string, value: string) => void }> = ({ onAdd }) => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (key.trim() && value.trim()) {
      onAdd(key.trim(), value.trim());
      setKey('');
      setValue('');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Input
        placeholder="Variable name"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        className="w-1/3"
      />
      <Input
        placeholder="Value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1"
      />
      <Button onClick={handleAdd} disabled={!key.trim() || !value.trim()}>
        Add
      </Button>
    </div>
  );
};