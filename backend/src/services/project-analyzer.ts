import { api } from "encore.dev/api";
import { ai } from "./ai";

export interface ProjectRequirements {
  description: string;
  features: string[];
  userType: 'beginner' | 'intermediate' | 'advanced';
  timeline: 'quick' | 'standard' | 'comprehensive';
  scalability: 'small' | 'medium' | 'large' | 'enterprise';
  budget: 'minimal' | 'standard' | 'premium';
}

export interface TechnologyRecommendation {
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
}

export interface ArchitecturePattern {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  complexity: number;
  suitability: number;
  reasoning: string;
}

export interface SecurityRequirements {
  authentication: {
    method: string;
    reasoning: string;
    implementation: string[];
  };
  authorization: {
    strategy: string;
    roles: string[];
    permissions: string[];
  };
  dataProtection: {
    encryption: string[];
    compliance: string[];
    privacy: string[];
  };
  apiSecurity: {
    rateLimit: boolean;
    cors: boolean;
    validation: string[];
  };
}

export interface PerformanceConsiderations {
  caching: {
    strategy: string;
    tools: string[];
    reasoning: string;
  };
  optimization: {
    frontend: string[];
    backend: string[];
    database: string[];
  };
  monitoring: {
    tools: string[];
    metrics: string[];
    alerting: string[];
  };
  scaling: {
    horizontal: boolean;
    vertical: boolean;
    strategies: string[];
  };
}

export interface ProjectAnalysis {
  requirements: ProjectRequirements;
  recommendations: TechnologyRecommendation;
  architecture: ArchitecturePattern[];
  security: SecurityRequirements;
  performance: PerformanceConsiderations;
  estimatedComplexity: number;
  estimatedTimeline: string;
  riskFactors: string[];
  successFactors: string[];
}

class ProjectAnalyzerService {
  private readonly technologyDatabase = {
    frontend: {
      react: {
        name: 'React',
        description: 'Popular component-based library',
        complexity: 3,
        learningCurve: 3,
        ecosystem: 'excellent',
        performance: 'good',
        community: 'excellent'
      },
      vue: {
        name: 'Vue.js',
        description: 'Progressive framework with gentle learning curve',
        complexity: 2,
        learningCurve: 2,
        ecosystem: 'good',
        performance: 'excellent',
        community: 'good'
      },
      angular: {
        name: 'Angular',
        description: 'Full-featured framework for enterprise applications',
        complexity: 4,
        learningCurve: 4,
        ecosystem: 'excellent',
        performance: 'good',
        community: 'good'
      },
      svelte: {
        name: 'Svelte',
        description: 'Compile-time optimized framework',
        complexity: 2,
        learningCurve: 2,
        ecosystem: 'growing',
        performance: 'excellent',
        community: 'growing'
      }
    },
    backend: {
      node: {
        express: { name: 'Express.js', complexity: 2, performance: 'good' },
        fastify: { name: 'Fastify', complexity: 2, performance: 'excellent' },
        nestjs: { name: 'NestJS', complexity: 3, performance: 'good' }
      },
      python: {
        django: { name: 'Django', complexity: 3, performance: 'good' },
        fastapi: { name: 'FastAPI', complexity: 2, performance: 'excellent' },
        flask: { name: 'Flask', complexity: 2, performance: 'good' }
      },
      java: {
        spring: { name: 'Spring Boot', complexity: 4, performance: 'excellent' }
      },
      go: {
        gin: { name: 'Gin', complexity: 2, performance: 'excellent' },
        fiber: { name: 'Fiber', complexity: 2, performance: 'excellent' }
      }
    },
    databases: {
      postgresql: {
        name: 'PostgreSQL',
        type: 'relational',
        complexity: 3,
        scaling: 'good',
        features: 'excellent'
      },
      mongodb: {
        name: 'MongoDB',
        type: 'document',
        complexity: 2,
        scaling: 'excellent',
        features: 'good'
      },
      redis: {
        name: 'Redis',
        type: 'cache',
        complexity: 2,
        scaling: 'excellent',
        features: 'specialized'
      },
      mysql: {
        name: 'MySQL',
        type: 'relational',
        complexity: 2,
        scaling: 'good',
        features: 'good'
      }
    }
  };

  async analyzeProjectRequirements(description: string, userPreferences: Partial<ProjectRequirements> = {}): Promise<ProjectAnalysis> {
    try {
      // Extract features and requirements from natural language description
      const extractedFeatures = await this.extractFeaturesFromDescription(description);
      
      // Merge with user preferences
      const requirements: ProjectRequirements = {
        description,
        features: extractedFeatures,
        userType: userPreferences.userType || 'intermediate',
        timeline: userPreferences.timeline || 'standard',
        scalability: userPreferences.scalability || 'medium',
        budget: userPreferences.budget || 'standard',
        ...userPreferences
      };

      // Generate technology recommendations
      const recommendations = await this.generateTechnologyRecommendations(requirements);
      
      // Analyze architecture patterns
      const architecture = await this.analyzeArchitecturePatterns(requirements);
      
      // Assess security requirements
      const security = await this.assessSecurityRequirements(requirements);
      
      // Consider performance requirements
      const performance = await this.analyzePerformanceRequirements(requirements);
      
      // Calculate complexity and timeline
      const estimatedComplexity = this.calculateComplexity(requirements, recommendations);
      const estimatedTimeline = this.estimateTimeline(estimatedComplexity, requirements.timeline);
      
      // Identify risk and success factors
      const riskFactors = await this.identifyRiskFactors(requirements, recommendations);
      const successFactors = await this.identifySuccessFactors(requirements, recommendations);

      return {
        requirements,
        recommendations,
        architecture,
        security,
        performance,
        estimatedComplexity,
        estimatedTimeline,
        riskFactors,
        successFactors
      };
    } catch (error) {
      console.error('Error analyzing project requirements:', error);
      throw new Error('Failed to analyze project requirements');
    }
  }

  private async extractFeaturesFromDescription(description: string): Promise<string[]> {
    const prompt = `
Analyze the following project description and extract key features and requirements:
"${description}"

Return a JSON array of specific features, technologies, and requirements mentioned or implied.
Focus on:
- Core functionality
- User authentication needs
- Data storage requirements
- Integration needs
- UI/UX requirements
- Performance needs
- Security considerations

Example output: ["user authentication", "real-time messaging", "file upload", "responsive design", "payment processing"]
`;

    try {
      const response = await ai.generateResponse({
        prompt,
        model: 'claude-3-sonnet-20240229',
        maxTokens: 500
      });

      // Parse JSON response
      const features = JSON.parse(response.content);
      return Array.isArray(features) ? features : [];
    } catch (error) {
      // Fallback: basic keyword extraction
      return this.extractKeywordsFromDescription(description);
    }
  }

  private extractKeywordsFromDescription(description: string): string[] {
    const keywords = [
      'authentication', 'login', 'user management', 'dashboard', 'admin',
      'database', 'api', 'rest', 'graphql', 'real-time', 'chat', 'messaging',
      'payment', 'stripe', 'paypal', 'e-commerce', 'shopping', 'cart',
      'file upload', 'image', 'video', 'documents', 'storage',
      'responsive', 'mobile', 'pwa', 'progressive web app',
      'analytics', 'tracking', 'monitoring', 'notifications'
    ];

    const lowerDescription = description.toLowerCase();
    return keywords.filter(keyword => lowerDescription.includes(keyword));
  }

  private async generateTechnologyRecommendations(requirements: ProjectRequirements): Promise<TechnologyRecommendation> {
    const { userType, features, scalability, timeline } = requirements;

    // Frontend recommendation logic
    let frontendFramework = 'react';
    if (userType === 'beginner' || timeline === 'quick') {
      frontendFramework = 'vue';
    } else if (scalability === 'enterprise' && features.includes('complex state management')) {
      frontendFramework = 'angular';
    } else if (features.includes('high performance') || features.includes('seo')) {
      frontendFramework = 'svelte';
    }

    // Backend recommendation logic
    let backendFramework = 'express';
    let backendLanguage = 'javascript';
    
    if (features.includes('high performance') || scalability === 'enterprise') {
      if (userType === 'advanced') {
        backendFramework = 'spring';
        backendLanguage = 'java';
      } else {
        backendFramework = 'fastify';
        backendLanguage = 'javascript';
      }
    } else if (features.includes('machine learning') || features.includes('data analysis')) {
      backendFramework = 'fastapi';
      backendLanguage = 'python';
    }

    // Database recommendation logic
    let databaseType = 'relational';
    let specificDatabase = 'postgresql';
    
    if (features.includes('document storage') || features.includes('flexible schema')) {
      databaseType = 'document';
      specificDatabase = 'mongodb';
    } else if (features.includes('high performance') || features.includes('caching')) {
      // Primary database + Redis for caching
      specificDatabase = 'postgresql';
    }

    // Integration recommendations
    const integrations = this.recommendIntegrations(features);

    // Deployment recommendation
    const deployment = this.recommendDeployment(scalability, requirements.budget);

    return {
      frontend: {
        framework: frontendFramework,
        reasoning: this.getFrontendReasoning(frontendFramework, requirements),
        alternatives: this.getFrontendAlternatives(frontendFramework),
        complexity: this.technologyDatabase.frontend[frontendFramework]?.complexity || 3,
        learningCurve: this.technologyDatabase.frontend[frontendFramework]?.learningCurve || 3
      },
      backend: {
        framework: backendFramework,
        language: backendLanguage,
        reasoning: this.getBackendReasoning(backendFramework, backendLanguage, requirements),
        alternatives: this.getBackendAlternatives(backendFramework, backendLanguage),
        complexity: this.getBackendComplexity(backendFramework),
        learningCurve: this.getBackendLearningCurve(backendFramework)
      },
      database: {
        type: databaseType,
        specific: specificDatabase,
        reasoning: this.getDatabaseReasoning(specificDatabase, requirements),
        alternatives: this.getDatabaseAlternatives(specificDatabase),
        complexity: this.technologyDatabase.databases[specificDatabase]?.complexity || 3
      },
      integrations,
      deployment
    };
  }

  private recommendIntegrations(features: string[]): TechnologyRecommendation['integrations'] {
    const integrations: TechnologyRecommendation['integrations'] = [];

    if (features.includes('authentication') || features.includes('login')) {
      integrations.push({
        name: 'Auth0',
        purpose: 'User authentication and authorization',
        priority: 'essential',
        complexity: 2
      });
    }

    if (features.includes('payment') || features.includes('e-commerce')) {
      integrations.push({
        name: 'Stripe',
        purpose: 'Payment processing',
        priority: 'essential',
        complexity: 3
      });
    }

    if (features.includes('email') || features.includes('notifications')) {
      integrations.push({
        name: 'SendGrid',
        purpose: 'Email delivery service',
        priority: 'recommended',
        complexity: 2
      });
    }

    if (features.includes('file upload') || features.includes('storage')) {
      integrations.push({
        name: 'AWS S3',
        purpose: 'File storage and CDN',
        priority: 'recommended',
        complexity: 2
      });
    }

    if (features.includes('analytics') || features.includes('tracking')) {
      integrations.push({
        name: 'Google Analytics',
        purpose: 'Web analytics and user tracking',
        priority: 'optional',
        complexity: 1
      });
    }

    return integrations;
  }

  private recommendDeployment(scalability: string, budget: string): TechnologyRecommendation['deployment'] {
    if (scalability === 'enterprise' || budget === 'premium') {
      return {
        platform: 'AWS/Azure',
        reasoning: 'Enterprise-grade infrastructure with high availability and scalability',
        alternatives: ['Google Cloud', 'Digital Ocean'],
        complexity: 4,
        cost: 'High ($200-1000+/month)'
      };
    } else if (scalability === 'large' || budget === 'standard') {
      return {
        platform: 'Vercel/Netlify + Railway',
        reasoning: 'Balanced performance and cost with easy deployment',
        alternatives: ['Heroku', 'Digital Ocean'],
        complexity: 2,
        cost: 'Medium ($50-200/month)'
      };
    } else {
      return {
        platform: 'Vercel/Netlify',
        reasoning: 'Cost-effective solution for small to medium applications',
        alternatives: ['GitHub Pages', 'Surge.sh'],
        complexity: 1,
        cost: 'Low ($0-50/month)'
      };
    }
  }

  private async analyzeArchitecturePatterns(requirements: ProjectRequirements): Promise<ArchitecturePattern[]> {
    const patterns: ArchitecturePattern[] = [];

    // Monolithic architecture
    patterns.push({
      name: 'Monolithic',
      description: 'Single deployable unit with all functionality',
      pros: ['Simple deployment', 'Easy debugging', 'Good for small teams'],
      cons: ['Scaling challenges', 'Technology lock-in', 'Large codebase'],
      complexity: 2,
      suitability: this.calculateMonolithicSuitability(requirements),
      reasoning: 'Best for small to medium applications with simple requirements'
    });

    // Microservices architecture
    if (requirements.scalability === 'large' || requirements.scalability === 'enterprise') {
      patterns.push({
        name: 'Microservices',
        description: 'Distributed architecture with independent services',
        pros: ['Independent scaling', 'Technology diversity', 'Team autonomy'],
        cons: ['Complex deployment', 'Network overhead', 'Data consistency'],
        complexity: 5,
        suitability: this.calculateMicroservicesSuitability(requirements),
        reasoning: 'Recommended for large-scale applications with multiple teams'
      });
    }

    // Serverless architecture
    if (requirements.timeline === 'quick' || requirements.budget === 'minimal') {
      patterns.push({
        name: 'Serverless',
        description: 'Function-based architecture with automatic scaling',
        pros: ['No server management', 'Pay per use', 'Auto-scaling'],
        cons: ['Vendor lock-in', 'Cold start latency', 'Limited runtime'],
        complexity: 3,
        suitability: this.calculateServerlessSuitability(requirements),
        reasoning: 'Great for event-driven applications and rapid prototyping'
      });
    }

    // JAMstack architecture
    if (requirements.features.includes('static content') || requirements.performance) {
      patterns.push({
        name: 'JAMstack',
        description: 'JavaScript, APIs, and Markup architecture',
        pros: ['High performance', 'Great security', 'Easy scaling'],
        cons: ['Limited dynamic content', 'Build complexity', 'API dependencies'],
        complexity: 2,
        suitability: this.calculateJAMstackSuitability(requirements),
        reasoning: 'Perfect for content-heavy sites with good performance requirements'
      });
    }

    return patterns.sort((a, b) => b.suitability - a.suitability);
  }

  private calculateMonolithicSuitability(requirements: ProjectRequirements): number {
    let score = 70; // Base score

    if (requirements.userType === 'beginner') score += 20;
    if (requirements.timeline === 'quick') score += 15;
    if (requirements.scalability === 'small' || requirements.scalability === 'medium') score += 10;
    if (requirements.budget === 'minimal') score += 10;
    if (requirements.scalability === 'enterprise') score -= 30;
    if (requirements.features.length > 10) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  private calculateMicroservicesSuitability(requirements: ProjectRequirements): number {
    let score = 30; // Base score

    if (requirements.scalability === 'enterprise') score += 40;
    if (requirements.scalability === 'large') score += 25;
    if (requirements.userType === 'advanced') score += 20;
    if (requirements.features.length > 8) score += 15;
    if (requirements.timeline === 'comprehensive') score += 10;
    if (requirements.userType === 'beginner') score -= 30;
    if (requirements.timeline === 'quick') score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  private calculateServerlessSuitability(requirements: ProjectRequirements): number {
    let score = 50; // Base score

    if (requirements.timeline === 'quick') score += 20;
    if (requirements.budget === 'minimal') score += 15;
    if (requirements.features.includes('event-driven')) score += 20;
    if (requirements.features.includes('api')) score += 10;
    if (requirements.scalability === 'enterprise') score -= 10;
    if (requirements.features.includes('real-time')) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  private calculateJAMstackSuitability(requirements: ProjectRequirements): number {
    let score = 40; // Base score

    if (requirements.features.includes('static content')) score += 25;
    if (requirements.features.includes('blog')) score += 20;
    if (requirements.features.includes('documentation')) score += 20;
    if (requirements.features.includes('high performance')) score += 15;
    if (requirements.features.includes('seo')) score += 15;
    if (requirements.features.includes('real-time')) score -= 20;
    if (requirements.features.includes('complex state')) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  private async assessSecurityRequirements(requirements: ProjectRequirements): Promise<SecurityRequirements> {
    const hasUserAccounts = requirements.features.some(f => 
      f.includes('authentication') || f.includes('login') || f.includes('user')
    );
    
    const hasPayments = requirements.features.some(f => 
      f.includes('payment') || f.includes('e-commerce') || f.includes('purchase')
    );

    const hasFileUploads = requirements.features.some(f => 
      f.includes('upload') || f.includes('file') || f.includes('image')
    );

    return {
      authentication: {
        method: hasUserAccounts ? 'OAuth 2.0 + JWT' : 'API Key',
        reasoning: hasUserAccounts 
          ? 'Secure user authentication with industry standards'
          : 'Simple API access control',
        implementation: hasUserAccounts 
          ? ['OAuth providers (Google, GitHub)', 'JWT tokens', 'Refresh token rotation']
          : ['API key validation', 'Rate limiting']
      },
      authorization: {
        strategy: hasUserAccounts ? 'Role-Based Access Control (RBAC)' : 'Simple API Access',
        roles: hasUserAccounts ? ['user', 'admin', 'moderator'] : ['client'],
        permissions: hasUserAccounts 
          ? ['read', 'write', 'delete', 'admin'] 
          : ['api_access']
      },
      dataProtection: {
        encryption: ['TLS 1.3 in transit', 'AES-256 at rest'],
        compliance: hasPayments ? ['PCI DSS', 'GDPR'] : ['GDPR'],
        privacy: ['Data minimization', 'Right to deletion', 'Consent management']
      },
      apiSecurity: {
        rateLimit: true,
        cors: true,
        validation: ['Input sanitization', 'Schema validation', 'SQL injection prevention']
      }
    };
  }

  private async analyzePerformanceRequirements(requirements: ProjectRequirements): Promise<PerformanceConsiderations> {
    const isHighTraffic = requirements.scalability === 'large' || requirements.scalability === 'enterprise';
    const needsRealTime = requirements.features.some(f => f.includes('real-time') || f.includes('chat'));

    return {
      caching: {
        strategy: isHighTraffic ? 'Multi-layer caching' : 'Simple caching',
        tools: isHighTraffic 
          ? ['Redis', 'CDN', 'Browser caching', 'Application caching']
          : ['Browser caching', 'CDN'],
        reasoning: isHighTraffic 
          ? 'Comprehensive caching strategy for high-traffic applications'
          : 'Basic caching for improved user experience'
      },
      optimization: {
        frontend: [
          'Code splitting',
          'Lazy loading',
          'Image optimization',
          'Bundle size optimization',
          ...(isHighTraffic ? ['Service workers', 'Preloading'] : [])
        ],
        backend: [
          'Database indexing',
          'Query optimization',
          'Connection pooling',
          ...(isHighTraffic ? ['Load balancing', 'Horizontal scaling'] : [])
        ],
        database: [
          'Index optimization',
          'Query performance tuning',
          ...(isHighTraffic ? ['Read replicas', 'Sharding'] : [])
        ]
      },
      monitoring: {
        tools: ['Application monitoring', 'Error tracking', ...(isHighTraffic ? ['APM', 'Infrastructure monitoring'] : [])],
        metrics: ['Response time', 'Error rate', 'Throughput', ...(isHighTraffic ? ['Resource utilization', 'Business metrics'] : [])],
        alerting: ['Error alerts', 'Performance degradation', ...(isHighTraffic ? ['SLA breaches', 'Capacity planning'] : [])]
      },
      scaling: {
        horizontal: isHighTraffic,
        vertical: true,
        strategies: isHighTraffic 
          ? ['Auto-scaling', 'Load balancing', 'Microservices']
          : ['Vertical scaling', 'Caching']
      }
    };
  }

  private calculateComplexity(requirements: ProjectRequirements, recommendations: TechnologyRecommendation): number {
    let complexity = 0;

    // Base complexity from requirements
    complexity += requirements.features.length * 0.5;
    complexity += this.getScalabilityComplexity(requirements.scalability);
    complexity += this.getUserTypeComplexity(requirements.userType);

    // Technology complexity
    complexity += recommendations.frontend.complexity;
    complexity += recommendations.backend.complexity;
    complexity += recommendations.database.complexity;
    complexity += recommendations.integrations.reduce((sum, integration) => sum + integration.complexity, 0) * 0.5;
    complexity += recommendations.deployment.complexity;

    return Math.min(10, Math.max(1, Math.round(complexity)));
  }

  private getScalabilityComplexity(scalability: string): number {
    const complexityMap = {
      small: 1,
      medium: 2,
      large: 3,
      enterprise: 4
    };
    return complexityMap[scalability] || 2;
  }

  private getUserTypeComplexity(userType: string): number {
    const complexityMap = {
      beginner: 1,
      intermediate: 2,
      advanced: 3
    };
    return complexityMap[userType] || 2;
  }

  private estimateTimeline(complexity: number, timeline: string): string {
    const baseHours = {
      quick: 8,
      standard: 40,
      comprehensive: 120
    };

    const hours = (baseHours[timeline] || 40) * (complexity / 5);
    
    if (hours <= 8) return '1 day';
    if (hours <= 40) return '1 week';
    if (hours <= 120) return '2-3 weeks';
    if (hours <= 200) return '1 month';
    if (hours <= 400) return '2 months';
    return '3+ months';
  }

  private async identifyRiskFactors(requirements: ProjectRequirements, recommendations: TechnologyRecommendation): Promise<string[]> {
    const risks: string[] = [];

    if (requirements.userType === 'beginner' && recommendations.backend.complexity > 3) {
      risks.push('High backend complexity for beginner skill level');
    }

    if (requirements.timeline === 'quick' && recommendations.integrations.length > 3) {
      risks.push('Many integrations may slow down quick timeline');
    }

    if (requirements.scalability === 'enterprise' && recommendations.deployment.complexity < 3) {
      risks.push('Simple deployment may not support enterprise scaling needs');
    }

    if (requirements.features.includes('real-time') && !recommendations.backend.framework.includes('socket')) {
      risks.push('Real-time features may require additional infrastructure');
    }

    if (requirements.budget === 'minimal' && recommendations.integrations.length > 2) {
      risks.push('Multiple paid services may exceed minimal budget');
    }

    return risks;
  }

  private async identifySuccessFactors(requirements: ProjectRequirements, recommendations: TechnologyRecommendation): Promise<string[]> {
    const factors: string[] = [];

    if (recommendations.frontend.learningCurve <= requirements.userType === 'beginner' ? 2 : 3) {
      factors.push('Frontend technology matches skill level well');
    }

    if (recommendations.backend.complexity <= 3 && requirements.timeline === 'quick') {
      factors.push('Backend complexity appropriate for quick development');
    }

    if (recommendations.integrations.every(i => i.priority !== 'essential' || i.complexity <= 2)) {
      factors.push('Essential integrations are straightforward to implement');
    }

    if (requirements.scalability === 'small' && recommendations.deployment.complexity <= 2) {
      factors.push('Simple deployment strategy matches small scale needs');
    }

    if (recommendations.database.complexity <= 2) {
      factors.push('Database choice is well-suited for the project requirements');
    }

    return factors;
  }

  // Helper methods for technology reasoning
  private getFrontendReasoning(framework: string, requirements: ProjectRequirements): string {
    const reasoningMap = {
      react: 'Large ecosystem, excellent job market, component reusability',
      vue: 'Gentle learning curve, excellent documentation, progressive adoption',
      angular: 'Enterprise-ready, full-featured framework, strong TypeScript support',
      svelte: 'Excellent performance, small bundle size, compile-time optimization'
    };
    return reasoningMap[framework] || 'Popular choice with good community support';
  }

  private getFrontendAlternatives(framework: string): string[] {
    const alternatives = ['react', 'vue', 'angular', 'svelte'].filter(f => f !== framework);
    return alternatives.slice(0, 2);
  }

  private getBackendReasoning(framework: string, language: string, requirements: ProjectRequirements): string {
    const reasoningMap = {
      express: 'Minimal and flexible, large ecosystem, quick development',
      fastify: 'High performance, schema-based validation, TypeScript support',
      nestjs: 'Enterprise architecture, decorators, dependency injection',
      django: 'Batteries included, rapid development, admin interface',
      fastapi: 'Modern Python framework, automatic API docs, high performance',
      spring: 'Enterprise Java framework, robust ecosystem, excellent scalability'
    };
    return reasoningMap[framework] || `Solid ${language} framework with good performance`;
  }

  private getBackendAlternatives(framework: string, language: string): string[] {
    const languageAlternatives = {
      javascript: ['express', 'fastify', 'nestjs'],
      python: ['django', 'fastapi', 'flask'],
      java: ['spring'],
      go: ['gin', 'fiber']
    };
    
    const alternatives = languageAlternatives[language] || [];
    return alternatives.filter(f => f !== framework).slice(0, 2);
  }

  private getBackendComplexity(framework: string): number {
    const complexityMap = {
      express: 2,
      fastify: 2,
      nestjs: 3,
      django: 3,
      fastapi: 2,
      flask: 2,
      spring: 4,
      gin: 2,
      fiber: 2
    };
    return complexityMap[framework] || 3;
  }

  private getBackendLearningCurve(framework: string): number {
    const learningCurveMap = {
      express: 2,
      fastify: 2,
      nestjs: 3,
      django: 3,
      fastapi: 2,
      flask: 2,
      spring: 4,
      gin: 2,
      fiber: 2
    };
    return learningCurveMap[framework] || 3;
  }

  private getDatabaseReasoning(database: string, requirements: ProjectRequirements): string {
    const reasoningMap = {
      postgresql: 'Powerful relational database with excellent JSON support and ACID compliance',
      mongodb: 'Flexible document database with horizontal scaling capabilities',
      mysql: 'Reliable relational database with wide hosting support',
      redis: 'High-performance in-memory database ideal for caching and sessions'
    };
    return reasoningMap[database] || 'Reliable database choice for the requirements';
  }

  private getDatabaseAlternatives(database: string): string[] {
    const alternatives = ['postgresql', 'mongodb', 'mysql', 'redis'].filter(d => d !== database);
    return alternatives.slice(0, 2);
  }
}

export const projectAnalyzer = new ProjectAnalyzerService();

// API endpoints
export const analyzeProject = api(
  { method: "POST", path: "/wizard/analyze" },
  async ({ description, preferences }: { 
    description: string; 
    preferences?: Partial<ProjectRequirements> 
  }): Promise<ProjectAnalysis> => {
    return await projectAnalyzer.analyzeProjectRequirements(description, preferences);
  }
);

export const getTemplateRecommendations = api(
  { method: "POST", path: "/wizard/templates/recommend" },
  async ({ analysis }: { analysis: ProjectAnalysis }): Promise<string[]> => {
    // Return recommended template IDs based on analysis
    const templates: string[] = [];
    
    const { frontend, backend, database } = analysis.recommendations;
    
    // Build template ID based on technology stack
    const templateId = `${frontend.framework}-${backend.framework}-${database.specific}`;
    templates.push(templateId);
    
    // Add alternative templates
    frontend.alternatives.forEach(alt => {
      templates.push(`${alt}-${backend.framework}-${database.specific}`);
    });
    
    return templates.slice(0, 5); // Return top 5 recommendations
  }
);