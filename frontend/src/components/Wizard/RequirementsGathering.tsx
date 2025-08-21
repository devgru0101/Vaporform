import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Checkbox } from '../ui/Checkbox';
import { 
  SparklesIcon, 
  UserGroupIcon, 
  ClockIcon, 
  ChartBarIcon,
  CurrencyDollarIcon,
  LightBulbIcon
} from '../ui/Icons';

interface ProjectRequirements {
  name: string;
  description: string;
  features: string[];
  userType: 'beginner' | 'intermediate' | 'advanced';
  timeline: 'quick' | 'standard' | 'comprehensive';
  scalability: 'small' | 'medium' | 'large' | 'enterprise';
  budget: 'minimal' | 'standard' | 'premium';
  customFeatures: string[];
}

interface RequirementsGatheringProps {
  requirements: Partial<ProjectRequirements>;
  onRequirementsChange: (requirements: Partial<ProjectRequirements>) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  aiSuggestions?: string[];
}

const predefinedFeatures = [
  {
    category: 'Authentication & Users',
    features: [
      'User registration and login',
      'Social media authentication',
      'Role-based access control',
      'User profiles and settings',
      'Password reset functionality',
      'Two-factor authentication'
    ]
  },
  {
    category: 'Data & Content',
    features: [
      'CRUD operations',
      'File upload and storage',
      'Search functionality',
      'Data filtering and sorting',
      'Content management',
      'Data export/import'
    ]
  },
  {
    category: 'Communication',
    features: [
      'Real-time messaging',
      'Email notifications',
      'Push notifications',
      'Comments and reviews',
      'Contact forms',
      'Live chat support'
    ]
  },
  {
    category: 'E-commerce',
    features: [
      'Shopping cart',
      'Payment processing',
      'Order management',
      'Inventory tracking',
      'Product catalog',
      'Discount codes and coupons'
    ]
  },
  {
    category: 'Analytics & Reporting',
    features: [
      'User analytics',
      'Performance dashboards',
      'Custom reports',
      'Data visualization',
      'Export reports',
      'Real-time metrics'
    ]
  },
  {
    category: 'Mobile & PWA',
    features: [
      'Mobile responsive design',
      'Progressive Web App',
      'Offline functionality',
      'Mobile push notifications',
      'Touch-friendly interface',
      'App store deployment'
    ]
  }
];

const userTypeOptions = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'New to development, prefer simple solutions',
    icon: <LightBulbIcon className="w-5 h-5" />
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Some experience, comfortable with modern tools',
    icon: <UserGroupIcon className="w-5 h-5" />
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Experienced developer, want full control',
    icon: <SparklesIcon className="w-5 h-5" />
  }
];

const timelineOptions = [
  {
    value: 'quick',
    label: 'Quick Start',
    description: 'MVP in 1-2 weeks',
    icon: <ClockIcon className="w-5 h-5" />
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Full features in 1-2 months',
    icon: <ClockIcon className="w-5 h-5" />
  },
  {
    value: 'comprehensive',
    label: 'Comprehensive',
    description: 'Enterprise-ready in 3+ months',
    icon: <ClockIcon className="w-5 h-5" />
  }
];

const scalabilityOptions = [
  {
    value: 'small',
    label: 'Small Scale',
    description: '< 1K users, simple hosting',
    icon: <ChartBarIcon className="w-5 h-5" />
  },
  {
    value: 'medium',
    label: 'Medium Scale',
    description: '1K-10K users, cloud hosting',
    icon: <ChartBarIcon className="w-5 h-5" />
  },
  {
    value: 'large',
    label: 'Large Scale',
    description: '10K-100K users, auto-scaling',
    icon: <ChartBarIcon className="w-5 h-5" />
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    description: '100K+ users, multi-region',
    icon: <ChartBarIcon className="w-5 h-5" />
  }
];

const budgetOptions = [
  {
    value: 'minimal',
    label: 'Minimal',
    description: '$0-50/month, free services',
    icon: <CurrencyDollarIcon className="w-5 h-5" />
  },
  {
    value: 'standard',
    label: 'Standard',
    description: '$50-200/month, paid services',
    icon: <CurrencyDollarIcon className="w-5 h-5" />
  },
  {
    value: 'premium',
    label: 'Premium',
    description: '$200+/month, enterprise services',
    icon: <CurrencyDollarIcon className="w-5 h-5" />
  }
];

export const RequirementsGathering: React.FC<RequirementsGatheringProps> = ({
  requirements,
  onRequirementsChange,
  onAnalyze,
  isAnalyzing,
  aiSuggestions = []
}) => {
  const [customFeature, setCustomFeature] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const updateRequirements = (updates: Partial<ProjectRequirements>) => {
    onRequirementsChange({ ...requirements, ...updates });
  };

  const toggleFeature = (feature: string) => {
    const currentFeatures = requirements.features || [];
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    
    updateRequirements({ features: newFeatures });
  };

  const addCustomFeature = () => {
    if (customFeature.trim()) {
      const currentCustom = requirements.customFeatures || [];
      updateRequirements({
        customFeatures: [...currentCustom, customFeature.trim()]
      });
      setCustomFeature('');
    }
  };

  const removeCustomFeature = (feature: string) => {
    const currentCustom = requirements.customFeatures || [];
    updateRequirements({
      customFeatures: currentCustom.filter(f => f !== feature)
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const applySuggestion = (suggestion: string) => {
    updateRequirements({
      description: (requirements.description || '') + '\n\n' + suggestion
    });
  };

  const isValid = requirements.name && 
                 requirements.description && 
                 requirements.userType && 
                 requirements.timeline && 
                 requirements.scalability && 
                 requirements.budget;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Tell Us About Your Project
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Provide details about your project so we can recommend the best 
          technology stack and features for your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Project Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Basic information about your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  placeholder="My Awesome App"
                  value={requirements.name || ''}
                  onChange={(e) => updateRequirements({ name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="projectDescription">Project Description *</Label>
                <Textarea
                  id="projectDescription"
                  placeholder="Describe your project in detail. What problem does it solve? Who are your users? What are the main features you want to include?"
                  rows={4}
                  value={requirements.description || ''}
                  onChange={(e) => updateRequirements({ description: e.target.value })}
                />
              </div>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-blue-600">
                    AI Suggestions
                  </Label>
                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg"
                      >
                        <SparklesIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-blue-800">{suggestion}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 p-0 h-auto"
                            onClick={() => applySuggestion(suggestion)}
                          >
                            Apply suggestion
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Features */}
              <div>
                <Label>Custom Features</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a custom feature..."
                    value={customFeature}
                    onChange={(e) => setCustomFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomFeature()}
                  />
                  <Button onClick={addCustomFeature} disabled={!customFeature.trim()}>
                    Add
                  </Button>
                </div>
                {requirements.customFeatures && requirements.customFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {requirements.customFeatures.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeCustomFeature(feature)}
                      >
                        {feature} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Project Configuration</CardTitle>
              <CardDescription>
                Technical and business requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Type */}
              <div>
                <Label>Your Experience Level *</Label>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {userTypeOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        requirements.userType === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => updateRequirements({ userType: option.value as any })}
                    >
                      <div className="text-blue-600">{option.icon}</div>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <Label>Development Timeline *</Label>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {timelineOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        requirements.timeline === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => updateRequirements({ timeline: option.value as any })}
                    >
                      <div className="text-blue-600">{option.icon}</div>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scalability */}
              <div>
                <Label>Expected Scale *</Label>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {scalabilityOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        requirements.scalability === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => updateRequirements({ scalability: option.value as any })}
                    >
                      <div className="text-blue-600">{option.icon}</div>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <Label>Monthly Budget *</Label>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {budgetOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        requirements.budget === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => updateRequirements({ budget: option.value as any })}
                    >
                      <div className="text-blue-600">{option.icon}</div>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Features & Functionality</CardTitle>
              <CardDescription>
                Select the features you want to include in your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predefinedFeatures.map((category) => (
                  <div key={category.category}>
                    <button
                      className="flex items-center justify-between w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      onClick={() => toggleCategory(category.category)}
                    >
                      <span className="font-medium text-gray-900">
                        {category.category}
                      </span>
                      <span className="text-gray-500">
                        {expandedCategories[category.category] ? '−' : '+'}
                      </span>
                    </button>
                    
                    {expandedCategories[category.category] && (
                      <div className="mt-2 space-y-2 pl-4">
                        {category.features.map((feature) => (
                          <div key={feature} className="flex items-center space-x-2">
                            <Checkbox
                              id={feature}
                              checked={(requirements.features || []).includes(feature)}
                              onCheckedChange={() => toggleFeature(feature)}
                            />
                            <Label htmlFor={feature} className="text-sm">
                              {feature}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Selected Features Summary */}
              {requirements.features && requirements.features.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Selected Features ({requirements.features.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {requirements.features.map((feature) => (
                      <Badge key={feature} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analyze Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={onAnalyze}
          disabled={!isValid || isAnalyzing}
          size="lg"
          className="px-8"
        >
          {isAnalyzing ? (
            <>
              <SparklesIcon className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Your Requirements...
            </>
          ) : (
            <>
              <SparklesIcon className="w-4 h-4 mr-2" />
              Analyze & Get Recommendations
            </>
          )}
        </Button>
      </div>
    </div>
  );
};