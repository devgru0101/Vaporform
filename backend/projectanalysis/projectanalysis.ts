import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import log from "encore.dev/log";

// Import service definition
import "./encore.service";

// Database setup for project analysis storage
const db = new SQLDatabase("projectanalysis", {
  migrations: "./migrations",
});

// Project Vision Data interfaces (from frontend wizard)
export interface ProjectVisionData {
  name: string;
  description: string;
  coreFeatures: string;
  targetAudience: string;
  inspirationApps: string[];
  projectGoals: string[];
  projectType?: string;
}

// AI Analysis Result interface
export interface ProjectAnalysis {
  id: string;
  requirements: {
    name: string;
    description: string;
    features: string[];
    userType: 'beginner' | 'intermediate' | 'advanced';
    timeline: 'quick' | 'standard' | 'comprehensive';
    scalability: 'small' | 'medium' | 'large' | 'enterprise';
    budget: 'minimal' | 'standard' | 'premium';
    customFeatures: string[];
    targetAudience?: string;
    projectGoals?: string[];
    inspirationApps?: string[];
  };
  recommendations: {
    frontend: {
      framework: string;
      reasoning: string;
      alternatives: string[];
      complexity: number;
      learningCurve: number;
    };
    backend: {
      framework: string;
      language: string;
      reasoning: string;
      alternatives: string[];
      complexity: number;
      learningCurve: number;
    };
    database: {
      type: string;
      specific: string;
      reasoning: string;
      alternatives: string[];
      complexity: number;
    };
    integrations: {
      name: string;
      purpose: string;
      priority: 'essential' | 'recommended' | 'optional';
      complexity: number;
    }[];
    deployment: {
      platform: string;
      reasoning: string;
      alternatives: string[];
      complexity: number;
      cost: string;
    };
  };
  estimatedComplexity: number;
  estimatedTimeline: string;
  riskFactors: string[];
  successFactors: string[];
  createdAt: Date;
  userId?: string;
}

// Feature Analysis interface
export interface FeatureAnalysis {
  suggestedFeatures: string[];
  complexity: number;
  implementationOrder: string[];
  dependencies: Record<string, string[]>;
}

// Request/Response interfaces
interface AnalyzeVisionRequest {
  vision: ProjectVisionData;
  userId?: string;
}

interface SuggestFeaturesRequest {
  projectType: string;
  targetAudience: string;
  inspirationApps: string[];
}

interface AssessComplexityRequest {
  vision: ProjectVisionData;
  selectedFeatures: string[];
}

// Analyze project vision - Main AI analysis endpoint
export const analyzeVision = api(
  { method: "POST", path: "/projectanalysis/analyze-vision", expose: true },
  async ({ vision, userId }: AnalyzeVisionRequest): Promise<ProjectAnalysis> => {
    log.info("Analyzing project vision", { projectName: vision.name, userId });

    try {
      // Calculate complexity and determine project characteristics
      const complexityScore = calculateComplexity(vision);
      const projectType = detectProjectType(vision);
      const scalability = determineScalability(vision);
      
      // Generate AI-powered analysis
      const analysis: ProjectAnalysis = {
        id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        requirements: {
          name: vision.name,
          description: vision.description,
          features: extractFeatures(vision.coreFeatures),
          userType: complexityScore < 4 ? 'beginner' : complexityScore < 7 ? 'intermediate' : 'advanced',
          timeline: complexityScore < 4 ? 'quick' : complexityScore < 7 ? 'standard' : 'comprehensive',
          scalability,
          budget: determineBudget(complexityScore, scalability),
          customFeatures: [],
          targetAudience: vision.targetAudience,
          projectGoals: vision.projectGoals,
          inspirationApps: vision.inspirationApps
        },
        recommendations: generateRecommendations(vision, projectType, complexityScore),
        estimatedComplexity: complexityScore,
        estimatedTimeline: estimateTimeline(complexityScore),
        riskFactors: identifyRiskFactors(vision),
        successFactors: identifySuccessFactors(vision),
        createdAt: new Date(),
        userId
      };

      // Store analysis in database
      await storeAnalysis(analysis);

      log.info("Project vision analysis completed", { 
        analysisId: analysis.id, 
        projectType, 
        complexity: complexityScore 
      });

      return analysis;
    } catch (error) {
      log.error("Project vision analysis failed", { error: (error as Error).message });
      throw APIError.internal("Failed to analyze project vision");
    }
  }
);

// Suggest additional features based on project characteristics
export const suggestFeatures = api(
  { method: "POST", path: "/projectanalysis/suggest-features", expose: true },
  async ({ projectType, targetAudience, inspirationApps }: SuggestFeaturesRequest): Promise<FeatureAnalysis> => {
    log.info("Suggesting features", { projectType, targetAudience });

    try {
      const suggestedFeatures = generateFeatureSuggestions(projectType, targetAudience, inspirationApps);
      const complexity = calculateFeatureComplexity(suggestedFeatures);
      const implementationOrder = prioritizeFeatures(suggestedFeatures, projectType);
      const dependencies = mapFeatureDependencies(suggestedFeatures);

      const analysis: FeatureAnalysis = {
        suggestedFeatures,
        complexity,
        implementationOrder,
        dependencies
      };

      log.info("Feature suggestions generated", { featuresCount: suggestedFeatures.length });

      return analysis;
    } catch (error) {
      log.error("Feature suggestion failed", { error: (error as Error).message });
      throw APIError.internal("Failed to generate feature suggestions");
    }
  }
);

// Assess project complexity based on selected features
export const assessComplexity = api(
  { method: "POST", path: "/projectanalysis/assess-complexity", expose: true },
  async ({ vision, selectedFeatures }: AssessComplexityRequest): Promise<{
    complexity: number;
    breakdown: Record<string, number>;
    recommendations: string[];
  }> => {
    log.info("Assessing complexity", { projectName: vision.name, featuresCount: selectedFeatures.length });

    try {
      const baseComplexity = calculateComplexity(vision);
      const featureComplexity = calculateFeatureComplexity(selectedFeatures);
      const totalComplexity = Math.min(10, baseComplexity + featureComplexity);

      const breakdown = {
        base: baseComplexity,
        features: featureComplexity,
        integrations: calculateIntegrationComplexity(selectedFeatures),
        scalability: getScalabilityComplexity(vision)
      };

      const recommendations = generateComplexityRecommendations(totalComplexity, breakdown);

      log.info("Complexity assessment completed", { totalComplexity });

      return {
        complexity: totalComplexity,
        breakdown,
        recommendations
      };
    } catch (error) {
      log.error("Complexity assessment failed", { error: (error as Error).message });
      throw APIError.internal("Failed to assess complexity");
    }
  }
);

// Get previous analyses for a user
export const getUserAnalyses = api(
  { method: "GET", path: "/projectanalysis/user/:userId", expose: true },
  async ({ userId }: { userId: string }): Promise<{ analyses: ProjectAnalysis[] }> => {
    log.info("Getting user analyses", { userId });

    try {
      const analyses = await db.queryAll`
        SELECT * FROM project_analyses 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC 
        LIMIT 50
      `;

      const parsedAnalyses = analyses.map(row => ({
        id: row.id,
        requirements: JSON.parse(row.requirements),
        recommendations: JSON.parse(row.recommendations),
        estimatedComplexity: row.estimated_complexity,
        estimatedTimeline: row.estimated_timeline,
        riskFactors: JSON.parse(row.risk_factors),
        successFactors: JSON.parse(row.success_factors),
        createdAt: row.created_at,
        userId: row.user_id
      }));

      return { analyses: parsedAnalyses };
    } catch (error) {
      log.error("Failed to get user analyses", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve analyses");
    }
  }
);

// Helper Functions

function calculateComplexity(vision: ProjectVisionData): number {
  let score = 0;
  
  // Base complexity from description and features
  score += Math.min(3, vision.description.length / 100);
  score += Math.min(3, vision.coreFeatures.length / 150);
  
  // Complexity indicators in text
  const complexityKeywords = [
    'real-time', 'scalable', 'microservices', 'ai', 'machine learning', 
    'analytics', 'payment', 'multi-tenant', 'blockchain', 'iot',
    'big data', 'distributed', 'high-availability', 'enterprise'
  ];
  
  const content = (vision.description + ' ' + vision.coreFeatures).toLowerCase();
  complexityKeywords.forEach(keyword => {
    if (content.includes(keyword)) score += 1;
  });
  
  // Goals and inspiration complexity
  score += Math.min(2, vision.projectGoals.length / 2);
  score += Math.min(2, vision.inspirationApps.length / 2);
  
  return Math.min(10, Math.max(1, Math.round(score)));
}

function detectProjectType(vision: ProjectVisionData): string {
  const content = (vision.description + ' ' + vision.coreFeatures + ' ' + vision.targetAudience).toLowerCase();
  
  if (content.includes('e-commerce') || content.includes('shop') || content.includes('marketplace') || content.includes('store')) {
    return 'E-commerce Platform';
  }
  if (content.includes('social') || content.includes('community') || content.includes('chat') || content.includes('messaging')) {
    return 'Social Platform';
  }
  if (content.includes('dashboard') || content.includes('analytics') || content.includes('metrics') || content.includes('reporting')) {
    return 'Analytics Dashboard';
  }
  if (content.includes('blog') || content.includes('cms') || content.includes('content') || content.includes('publishing')) {
    return 'Content Management';
  }
  if (content.includes('api') || content.includes('service') || content.includes('backend') || content.includes('integration')) {
    return 'API Service';
  }
  if (content.includes('mobile') || content.includes('ios') || content.includes('android') || content.includes('app')) {
    return 'Mobile Application';
  }
  if (content.includes('ai') || content.includes('machine learning') || content.includes('ml') || content.includes('prediction')) {
    return 'AI/ML Platform';
  }
  
  return 'Web Application';
}

function determineScalability(vision: ProjectVisionData): 'small' | 'medium' | 'large' | 'enterprise' {
  const content = (vision.description + ' ' + vision.coreFeatures + ' ' + vision.targetAudience).toLowerCase();
  
  if (content.includes('enterprise') || content.includes('million') || content.includes('global') || content.includes('international')) {
    return 'enterprise';
  }
  if (content.includes('thousand') || content.includes('scale') || content.includes('growth') || content.includes('regional')) {
    return 'large';
  }
  if (content.includes('hundreds') || content.includes('local') || content.includes('community') || content.includes('startup')) {
    return 'medium';
  }
  
  return 'small';
}

function determineBudget(complexity: number, scalability: string): 'minimal' | 'standard' | 'premium' {
  if (complexity >= 8 || scalability === 'enterprise') return 'premium';
  if (complexity >= 5 || scalability === 'large') return 'standard';
  return 'minimal';
}

function extractFeatures(coreFeatures: string): string[] {
  // Extract key features from description using keyword matching
  const featureKeywords = [
    'authentication', 'authorization', 'login', 'user management',
    'payment', 'billing', 'subscription', 'checkout',
    'search', 'filtering', 'sorting', 'pagination',
    'real-time', 'notifications', 'chat', 'messaging',
    'analytics', 'reporting', 'dashboard', 'metrics',
    'api', 'integration', 'webhook', 'third-party',
    'mobile', 'responsive', 'pwa', 'offline',
    'admin', 'cms', 'content management', 'moderation',
    'social', 'sharing', 'comments', 'reviews'
  ];
  
  const content = coreFeatures.toLowerCase();
  return featureKeywords.filter(keyword => content.includes(keyword));
}

function generateRecommendations(vision: ProjectVisionData, projectType: string, complexity: number) {
  return {
    frontend: {
      framework: complexity > 6 ? 'React' : 'React',
      reasoning: 'React provides excellent scalability, large ecosystem, and strong TypeScript support',
      alternatives: ['Vue.js', 'Angular', 'Svelte'],
      complexity: complexity > 6 ? 4 : 3,
      learningCurve: 3
    },
    backend: {
      framework: 'Encore.ts',
      language: 'TypeScript',
      reasoning: 'Encore.ts provides type-safe APIs, automatic deployment, built-in monitoring, and excellent developer experience',
      alternatives: ['Node.js + Express', 'Python + FastAPI', 'Go', 'Java Spring'],
      complexity: 3,
      learningCurve: 2
    },
    database: {
      type: 'SQL',
      specific: complexity > 7 ? 'PostgreSQL + Redis' : 'PostgreSQL',
      reasoning: 'PostgreSQL offers reliability, ACID compliance, and excellent performance. Redis for caching if high complexity.',
      alternatives: ['MySQL', 'MongoDB', 'SQLite'],
      complexity: complexity > 7 ? 4 : 3
    },
    integrations: generateIntegrationRecommendations(vision, projectType),
    deployment: {
      platform: 'Encore Cloud',
      reasoning: 'Automatic deployment, monitoring, scaling, and infrastructure management built-in',
      alternatives: ['Vercel', 'AWS', 'Google Cloud', 'Azure'],
      complexity: 2,
      cost: 'Free tier available, scales with usage'
    }
  };
}

function generateIntegrationRecommendations(vision: ProjectVisionData, projectType: string) {
  const recommendations = [];
  
  // Always recommend auth for user-facing apps
  recommendations.push({
    name: 'Authentication',
    purpose: 'User authentication and authorization',
    priority: 'essential' as const,
    complexity: 3
  });
  
  // Project type specific recommendations
  if (projectType === 'E-commerce Platform') {
    recommendations.push({
      name: 'Payment Processing',
      purpose: 'Handle payments and billing',
      priority: 'essential' as const,
      complexity: 4
    });
    recommendations.push({
      name: 'Email Notifications',
      purpose: 'Order confirmations and updates',
      priority: 'recommended' as const,
      complexity: 2
    });
  }
  
  if (projectType === 'Social Platform') {
    recommendations.push({
      name: 'File Storage',
      purpose: 'Store user-uploaded content',
      priority: 'recommended' as const,
      complexity: 3
    });
    recommendations.push({
      name: 'Real-time Messaging',
      purpose: 'Enable live chat and notifications',
      priority: 'recommended' as const,
      complexity: 4
    });
  }
  
  // Analytics for all projects
  recommendations.push({
    name: 'Analytics',
    purpose: 'Track user behavior and application metrics',
    priority: 'recommended' as const,
    complexity: 2
  });
  
  return recommendations;
}

function estimateTimeline(complexity: number): string {
  if (complexity <= 3) return '2-4 weeks';
  if (complexity <= 6) return '4-8 weeks';
  if (complexity <= 8) return '8-16 weeks';
  return '16+ weeks';
}

function identifyRiskFactors(vision: ProjectVisionData): string[] {
  const risks = [];
  const content = (vision.description + ' ' + vision.coreFeatures).toLowerCase();
  
  if (content.includes('real-time')) risks.push('Real-time functionality complexity');
  if (content.includes('payment')) risks.push('Payment processing compliance and security');
  if (content.includes('scale') || content.includes('million')) risks.push('Scalability and performance requirements');
  if (content.includes('ai') || content.includes('machine learning')) risks.push('AI/ML integration complexity');
  if (vision.inspirationApps.length > 3) risks.push('Feature scope creep from multiple inspirations');
  if (content.includes('mobile')) risks.push('Cross-platform compatibility challenges');
  if (content.includes('enterprise')) risks.push('Enterprise security and compliance requirements');
  
  // General risks
  risks.push('Third-party service dependencies', 'User adoption challenges', 'Technical debt accumulation');
  
  return risks;
}

function identifySuccessFactors(vision: ProjectVisionData): string[] {
  return [
    'Clear project vision and well-defined requirements',
    'Iterative development and MVP approach',
    'Comprehensive testing strategy and quality assurance',
    'Regular user feedback integration and validation',
    'Performance monitoring and optimization',
    'Security best practices and compliance',
    'Proper documentation and knowledge sharing',
    'Scalable architecture and clean code practices',
    'Strong project management and communication',
    'Continuous integration and deployment pipeline'
  ];
}

function generateFeatureSuggestions(projectType: string, targetAudience: string, inspirationApps: string[]): string[] {
  const features: string[] = [];
  
  // Base features for all projects
  features.push('User Authentication', 'User Profiles', 'Search Functionality', 'Responsive Design');
  
  // Project type specific features
  switch (projectType) {
    case 'E-commerce Platform':
      features.push('Product Catalog', 'Shopping Cart', 'Payment Processing', 'Order Management', 'Inventory Tracking', 'Reviews and Ratings');
      break;
    case 'Social Platform':
      features.push('Social Feed', 'Messaging System', 'Friend/Follow System', 'Content Sharing', 'Notifications', 'Privacy Controls');
      break;
    case 'Analytics Dashboard':
      features.push('Data Visualization', 'Custom Reports', 'Real-time Metrics', 'Export Functionality', 'Alert System', 'Multi-user Access');
      break;
    case 'Content Management':
      features.push('Content Editor', 'Media Management', 'SEO Tools', 'Content Scheduling', 'Comment System', 'User Roles');
      break;
    case 'API Service':
      features.push('API Documentation', 'Rate Limiting', 'API Keys Management', 'Webhooks', 'Monitoring Dashboard', 'Version Control');
      break;
  }
  
  // Target audience specific features
  if (targetAudience.toLowerCase().includes('business')) {
    features.push('Admin Dashboard', 'Business Analytics', 'Team Management', 'Advanced Reporting');
  }
  if (targetAudience.toLowerCase().includes('developer')) {
    features.push('API Access', 'SDK/Libraries', 'Code Examples', 'Developer Documentation');
  }
  
  return [...new Set(features)]; // Remove duplicates
}

function calculateFeatureComplexity(features: string[]): number {
  const complexityMap: Record<string, number> = {
    'User Authentication': 3,
    'Payment Processing': 5,
    'Real-time Messaging': 4,
    'AI/ML Features': 5,
    'Video Streaming': 5,
    'Blockchain Integration': 5,
    'Search Functionality': 3,
    'File Upload': 2,
    'Email Notifications': 2,
    'Social Feed': 4,
    'Analytics Dashboard': 4,
    'API Integration': 3
  };
  
  const totalComplexity = features.reduce((sum, feature) => {
    return sum + (complexityMap[feature] || 2);
  }, 0);
  
  return Math.min(10, Math.round(totalComplexity / features.length));
}

function prioritizeFeatures(features: string[], projectType: string): string[] {
  const priorityMap: Record<string, number> = {
    'User Authentication': 10,
    'User Profiles': 9,
    'Search Functionality': 8,
    'Responsive Design': 8,
    'Payment Processing': 7,
    'Admin Dashboard': 6,
    'Analytics': 5,
    'Social Features': 4,
    'Advanced Features': 3
  };
  
  return features.sort((a, b) => (priorityMap[b] || 1) - (priorityMap[a] || 1));
}

function mapFeatureDependencies(features: string[]): Record<string, string[]> {
  const dependencies: Record<string, string[]> = {
    'User Profiles': ['User Authentication'],
    'Social Feed': ['User Authentication', 'User Profiles'],
    'Messaging System': ['User Authentication', 'User Profiles'],
    'Payment Processing': ['User Authentication', 'User Profiles'],
    'Order Management': ['User Authentication', 'Payment Processing'],
    'Admin Dashboard': ['User Authentication', 'User Roles'],
    'Advanced Analytics': ['Basic Analytics', 'User Authentication']
  };
  
  return Object.fromEntries(
    Object.entries(dependencies).filter(([feature]) => features.includes(feature))
  );
}

function calculateIntegrationComplexity(features: string[]): number {
  const integrationFeatures = features.filter(f => 
    f.includes('Payment') || f.includes('Social') || f.includes('API') || f.includes('Third-party')
  );
  return Math.min(3, integrationFeatures.length);
}

function getScalabilityComplexity(vision: ProjectVisionData): number {
  const scalability = determineScalability(vision);
  const complexityMap = { small: 1, medium: 2, large: 3, enterprise: 4 };
  return complexityMap[scalability];
}

function generateComplexityRecommendations(complexity: number, breakdown: Record<string, number>): string[] {
  const recommendations = [];
  
  if (complexity >= 8) {
    recommendations.push('Consider breaking into smaller phases or MVP');
    recommendations.push('Implement strong testing and CI/CD practices');
    recommendations.push('Plan for dedicated DevOps and monitoring');
  }
  
  if (breakdown.features > 3) {
    recommendations.push('Prioritize core features for initial release');
    recommendations.push('Consider feature flags for gradual rollout');
  }
  
  if (breakdown.integrations > 2) {
    recommendations.push('Plan integration testing thoroughly');
    recommendations.push('Implement fallback mechanisms for external services');
  }
  
  if (breakdown.scalability > 2) {
    recommendations.push('Design with horizontal scaling in mind');
    recommendations.push('Implement caching and performance optimization');
  }
  
  recommendations.push('Use TypeScript for better maintainability');
  recommendations.push('Implement comprehensive error handling');
  
  return recommendations;
}

async function storeAnalysis(analysis: ProjectAnalysis): Promise<void> {
  await db.exec`
    INSERT INTO project_analyses (
      id, user_id, requirements, recommendations, 
      estimated_complexity, estimated_timeline, 
      risk_factors, success_factors, created_at
    ) VALUES (
      ${analysis.id}, ${analysis.userId}, 
      ${JSON.stringify(analysis.requirements)}, 
      ${JSON.stringify(analysis.recommendations)},
      ${analysis.estimatedComplexity}, ${analysis.estimatedTimeline},
      ${JSON.stringify(analysis.riskFactors)}, 
      ${JSON.stringify(analysis.successFactors)}, 
      ${analysis.createdAt}
    )
  `;
}