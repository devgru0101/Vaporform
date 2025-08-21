import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckIcon, ClockIcon, CodeIcon, DatabaseIcon, ServerIcon } from '../ui/Icons';

interface ProjectType {
  id: string;
  name: string;
  description: string;
  category: string;
  techStack: {
    frontend: string;
    backend: string;
    database: string;
  };
  features: string[];
  complexity: number;
  estimatedTime: string;
  useCase: string;
  icon: React.ReactNode;
  popular: boolean;
}

interface ProjectTypeSelectorProps {
  selectedType?: string;
  onTypeSelect: (typeId: string) => void;
}

const projectTypes: ProjectType[] = [
  {
    id: 'react-full-stack',
    name: 'React Full-Stack App',
    description: 'Complete web application with React frontend and Express backend',
    category: 'Full-Stack',
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
      'TypeScript support'
    ],
    complexity: 3,
    estimatedTime: '2-3 weeks',
    useCase: 'Web applications, dashboards, business tools',
    icon: <CodeIcon className="w-8 h-8" />,
    popular: true
  },
  {
    id: 'vue-spa',
    name: 'Vue.js Single Page App',
    description: 'Modern SPA with Vue.js and optional backend API',
    category: 'Frontend',
    techStack: {
      frontend: 'Vue.js 3',
      backend: 'FastAPI (Optional)',
      database: 'MongoDB (Optional)'
    },
    features: [
      'Vue 3 Composition API',
      'Pinia state management',
      'Vue Router',
      'Progressive Web App',
      'Component library'
    ],
    complexity: 2,
    estimatedTime: '1-2 weeks',
    useCase: 'Interactive websites, content management, portfolios',
    icon: <CodeIcon className="w-8 h-8" />,
    popular: false
  },
  {
    id: 'angular-enterprise',
    name: 'Angular Enterprise App',
    description: 'Enterprise-grade application with Angular and NestJS',
    category: 'Enterprise',
    techStack: {
      frontend: 'Angular',
      backend: 'NestJS',
      database: 'PostgreSQL'
    },
    features: [
      'Angular Material',
      'Role-based authentication',
      'Microservices ready',
      'Enterprise patterns',
      'Comprehensive testing'
    ],
    complexity: 4,
    estimatedTime: '1-2 months',
    useCase: 'Large-scale applications, enterprise systems, complex workflows',
    icon: <ServerIcon className="w-8 h-8" />,
    popular: false
  },
  {
    id: 'api-backend',
    name: 'REST API Backend',
    description: 'Robust backend API with authentication and database',
    category: 'Backend',
    techStack: {
      frontend: 'N/A',
      backend: 'Express.js',
      database: 'PostgreSQL'
    },
    features: [
      'RESTful API design',
      'JWT authentication',
      'Input validation',
      'Error handling',
      'API documentation'
    ],
    complexity: 2,
    estimatedTime: '1 week',
    useCase: 'Mobile apps, third-party integrations, microservices',
    icon: <DatabaseIcon className="w-8 h-8" />,
    popular: true
  },
  {
    id: 'microservices',
    name: 'Microservices Architecture',
    description: 'Scalable microservices setup with API gateway',
    category: 'Microservices',
    techStack: {
      frontend: 'React',
      backend: 'Multiple Services',
      database: 'Multiple Databases'
    },
    features: [
      'API Gateway',
      'Service discovery',
      'Container orchestration',
      'Circuit breaker',
      'Distributed logging'
    ],
    complexity: 5,
    estimatedTime: '2-3 months',
    useCase: 'Large-scale systems, high-traffic applications, team autonomy',
    icon: <ServerIcon className="w-8 h-8" />,
    popular: false
  },
  {
    id: 'static-site',
    name: 'Static Site (JAMstack)',
    description: 'Fast static site with modern build tools',
    category: 'JAMstack',
    techStack: {
      frontend: 'Next.js / Gatsby',
      backend: 'Serverless Functions',
      database: 'Headless CMS'
    },
    features: [
      'Static site generation',
      'SEO optimized',
      'Fast loading',
      'CDN deployment',
      'Headless CMS'
    ],
    complexity: 2,
    estimatedTime: '1 week',
    useCase: 'Blogs, documentation, marketing sites, portfolios',
    icon: <CodeIcon className="w-8 h-8" />,
    popular: true
  }
];

const complexityColors = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-green-100 text-green-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-orange-100 text-orange-800',
  5: 'bg-red-100 text-red-800'
};

const complexityLabels = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Medium',
  4: 'Complex',
  5: 'Very Complex'
};

export const ProjectTypeSelector: React.FC<ProjectTypeSelectorProps> = ({
  selectedType,
  onTypeSelect
}) => {
  const categories = Array.from(new Set(projectTypes.map(type => type.category)));

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Project Type
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select the type of project you want to create. Each template includes 
          modern tools, best practices, and everything you need to get started quickly.
        </p>
      </div>

      {categories.map(category => (
        <div key={category} className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
            {category}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectTypes
              .filter(type => type.category === category)
              .map(type => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedType === type.id
                      ? 'ring-2 ring-blue-500 border-blue-500'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => onTypeSelect(type.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-blue-600">
                          {type.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {type.name}
                            {type.popular && (
                              <Badge variant="secondary" className="text-xs">
                                Popular
                              </Badge>
                            )}
                          </CardTitle>
                        </div>
                      </div>
                      {selectedType === type.id && (
                        <CheckIcon className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                      {type.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Tech Stack */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Tech Stack
                      </h4>
                      <div className="space-y-1 text-sm">
                        {type.techStack.frontend !== 'N/A' && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Frontend:</span>
                            <span className="font-medium">{type.techStack.frontend}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500">Backend:</span>
                          <span className="font-medium">{type.techStack.backend}</span>
                        </div>
                        {type.techStack.database !== 'N/A' && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Database:</span>
                            <span className="font-medium">{type.techStack.database}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Key Features
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {type.features.slice(0, 3).map(feature => (
                          <Badge
                            key={feature}
                            variant="outline"
                            className="text-xs"
                          >
                            {feature}
                          </Badge>
                        ))}
                        {type.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{type.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Complexity and Time */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={`text-xs ${
                            complexityColors[type.complexity as keyof typeof complexityColors]
                          }`}
                        >
                          {complexityLabels[type.complexity as keyof typeof complexityLabels]}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <ClockIcon className="w-4 h-4" />
                        <span>{type.estimatedTime}</span>
                      </div>
                    </div>

                    {/* Use Case */}
                    <div className="text-xs text-gray-500 italic">
                      Best for: {type.useCase}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}

      {/* Custom Project Option */}
      <div className="border-t pt-8">
        <Card
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-dashed ${
            selectedType === 'custom'
              ? 'ring-2 ring-blue-500 border-blue-500'
              : 'hover:border-gray-300'
          }`}
          onClick={() => onTypeSelect('custom')}
        >
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                <CodeIcon className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Custom Project
              </h3>
              <p className="text-gray-600 max-w-md">
                Start with a custom configuration. Choose your own tech stack 
                and requirements through our guided setup.
              </p>
              {selectedType === 'custom' && (
                <div className="mt-3">
                  <CheckIcon className="w-5 h-5 text-blue-600 mx-auto" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};