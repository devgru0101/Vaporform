import { api } from 'encore.dev/api';
import { ProjectFiles } from './project-templates';
import { ProjectAnalysis } from './project-analyzer';

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  url: string;
  cloneUrl: string;
  language: string;
  stargazersCount: number;
  forksCount: number;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  topics: string[];
  license?: {
    name: string;
    spdxId: string;
  };
}

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  content?: string;
  encoding?: string;
  downloadUrl?: string;
}

export interface RepositoryAnalysis {
  repository: GitHubRepository;
  structure: GitHubFile[];
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    tools: string[];
    languages: Record<string, number>;
  };
  dependencies: {
    frontend: Record<string, string>;
    backend: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  configurations: {
    hasDockerfile: boolean;
    hasDockerCompose: boolean;
    hasCI: boolean;
    hasTests: boolean;
    hasLinting: boolean;
    hasTypeScript: boolean;
  };
  metrics: {
    linesOfCode: number;
    fileCount: number;
    testCoverage?: number;
    complexity: number;
    maintainability: 'low' | 'medium' | 'high';
  };
  recommendations: {
    modernization: string[];
    security: string[];
    performance: string[];
    testing: string[];
    tooling: string[];
  };
}

export interface MigrationPlan {
  steps: MigrationStep[];
  estimatedTime: string;
  complexity: number;
  riskLevel: 'low' | 'medium' | 'high';
  prerequisites: string[];
  rollbackPlan: string[];
}

export interface MigrationStep {
  id: string;
  title: string;
  description: string;
  type: 'analysis' | 'backup' | 'migration' | 'testing' | 'deployment';
  estimatedTime: string;
  dependencies: string[];
  instructions: string[];
  validation: string[];
  rollback: string[];
}

class GitHubIntegrationService {
  private readonly GITHUB_API_BASE = 'https://api.github.com';
  
  async analyzeRepository(repoUrl: string, accessToken?: string): Promise<RepositoryAnalysis> {
    try {
      const { owner, repo } = this.parseRepositoryUrl(repoUrl);
      
      // Fetch repository information
      const repository = await this.fetchRepositoryInfo(owner, repo, accessToken);
      
      // Fetch repository structure
      const structure = await this.fetchRepositoryStructure(owner, repo, accessToken);
      
      // Analyze tech stack
      const techStack = await this.analyzeTechStack(structure, owner, repo, accessToken);
      
      // Analyze dependencies
      const dependencies = await this.analyzeDependencies(structure, owner, repo, accessToken);
      
      // Check configurations
      const configurations = await this.analyzeConfigurations(structure);
      
      // Calculate metrics
      const metrics = await this.calculateMetrics(structure, owner, repo, accessToken);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        techStack, 
        dependencies, 
        configurations, 
        metrics,
      );

      return {
        repository,
        structure,
        techStack,
        dependencies,
        configurations,
        metrics,
        recommendations,
      };
    } catch (error) {
      console.error('Error analyzing repository:', error);
      throw new Error('Failed to analyze repository');
    }
  }

  async createMigrationPlan(
    analysis: RepositoryAnalysis,
    targetAnalysis: ProjectAnalysis,
  ): Promise<MigrationPlan> {
    const steps: MigrationStep[] = [];
    let complexity = 1;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Step 1: Analysis and Planning
    steps.push({
      id: 'analysis',
      title: 'Repository Analysis and Planning',
      description: 'Analyze current codebase and plan migration strategy',
      type: 'analysis',
      estimatedTime: '2-4 hours',
      dependencies: [],
      instructions: [
        'Review current architecture and dependencies',
        'Identify breaking changes and compatibility issues',
        'Create detailed migration timeline',
        'Set up development environment',
      ],
      validation: [
        'Migration plan documented',
        'All dependencies identified',
        'Risk assessment completed',
      ],
      rollback: ['N/A - Planning phase'],
    });

    // Step 2: Backup and Version Control
    steps.push({
      id: 'backup',
      title: 'Backup and Version Control Setup',
      description: 'Create backups and set up migration branch',
      type: 'backup',
      estimatedTime: '1 hour',
      dependencies: ['analysis'],
      instructions: [
        'Create full repository backup',
        'Create migration branch',
        'Tag current stable version',
        'Set up separate development environment',
      ],
      validation: [
        'Backup created and verified',
        'Migration branch ready',
        'Version tagged',
      ],
      rollback: [
        'Restore from backup',
        'Reset to tagged version',
      ],
    });

    // Technology migration steps
    const currentTech = analysis.techStack;
    const targetTech = targetAnalysis.recommendations;

    // Frontend migration
    if (this.needsFrontendMigration(currentTech.frontend, targetTech.frontend.framework)) {
      complexity += 2;
      riskLevel = 'medium';
      
      steps.push({
        id: 'frontend-migration',
        title: `Migrate Frontend to ${targetTech.frontend.framework}`,
        description: `Migrate from ${currentTech.frontend.join(', ')} to ${targetTech.frontend.framework}`,
        type: 'migration',
        estimatedTime: '1-2 weeks',
        dependencies: ['backup'],
        instructions: [
          `Set up ${targetTech.frontend.framework} project structure`,
          'Install required dependencies',
          'Migrate components one by one',
          'Update routing and state management',
          'Migrate styles and assets',
          'Update build configuration',
        ],
        validation: [
          'All components migrated and functional',
          'Build process working',
          'No TypeScript/linting errors',
          'Core functionality preserved',
        ],
        rollback: [
          'Switch back to migration branch',
          'Restore original frontend files',
          'Revert build configuration',
        ],
      });
    }

    // Backend migration
    if (this.needsBackendMigration(currentTech.backend, targetTech.backend.framework)) {
      complexity += 2;
      if (riskLevel === 'low') {
        riskLevel = 'medium';
      }
      
      steps.push({
        id: 'backend-migration',
        title: `Migrate Backend to ${targetTech.backend.framework}`,
        description: `Migrate from ${currentTech.backend.join(', ')} to ${targetTech.backend.framework}`,
        type: 'migration',
        estimatedTime: '1-3 weeks',
        dependencies: ['backup'],
        instructions: [
          `Set up ${targetTech.backend.framework} project structure`,
          'Install dependencies and configure environment',
          'Migrate API endpoints and middleware',
          'Update database connections and models',
          'Migrate authentication and authorization',
          'Update error handling and logging',
        ],
        validation: [
          'All API endpoints working',
          'Database connections functional',
          'Authentication working',
          'Error handling properly implemented',
        ],
        rollback: [
          'Switch back to original backend',
          'Restore database connections',
          'Revert API configurations',
        ],
      });
    }

    // Database migration
    if (this.needsDatabaseMigration(currentTech.database, targetTech.database.specific)) {
      complexity += 3;
      riskLevel = 'high';
      
      steps.push({
        id: 'database-migration',
        title: `Migrate Database to ${targetTech.database.specific}`,
        description: `Migrate from ${currentTech.database.join(', ')} to ${targetTech.database.specific}`,
        type: 'migration',
        estimatedTime: '3-5 days',
        dependencies: ['backup'],
        instructions: [
          'Set up new database instance',
          'Create migration scripts',
          'Export data from current database',
          'Transform data for new schema',
          'Import data to new database',
          'Update application database connections',
          'Test data integrity and performance',
        ],
        validation: [
          'All data migrated successfully',
          'Data integrity verified',
          'Performance benchmarks met',
          'Application connects to new database',
        ],
        rollback: [
          'Restore original database',
          'Revert connection strings',
          'Restore backup data',
        ],
      });
    }

    // Testing and validation
    steps.push({
      id: 'testing',
      title: 'Comprehensive Testing',
      description: 'Test all migrated functionality',
      type: 'testing',
      estimatedTime: '3-5 days',
      dependencies: steps.filter(s => s.type === 'migration').map(s => s.id),
      instructions: [
        'Run all existing tests',
        'Perform manual testing of core features',
        'Test API endpoints with integration tests',
        'Verify database operations',
        'Test authentication and authorization',
        'Performance testing and optimization',
      ],
      validation: [
        'All tests passing',
        'Core functionality working',
        'Performance meets requirements',
        'No critical bugs identified',
      ],
      rollback: [
        'Document all issues found',
        'Revert to backup if critical issues exist',
      ],
    });

    // Deployment and finalization
    steps.push({
      id: 'deployment',
      title: 'Deployment and Go-Live',
      description: 'Deploy migrated application to production',
      type: 'deployment',
      estimatedTime: '1-2 days',
      dependencies: ['testing'],
      instructions: [
        'Update deployment configurations',
        'Deploy to staging environment',
        'Perform final testing in staging',
        'Deploy to production with zero-downtime strategy',
        'Monitor application health and performance',
        'Update documentation and team knowledge',
      ],
      validation: [
        'Application deployed successfully',
        'All systems operational',
        'Performance monitoring active',
        'Team trained on new system',
      ],
      rollback: [
        'Implement blue-green deployment rollback',
        'Restore from production backup',
        'Revert DNS and load balancer settings',
      ],
    });

    // Calculate total estimated time
    const estimatedTime = this.calculateTotalTime(steps);

    return {
      steps,
      estimatedTime,
      complexity,
      riskLevel,
      prerequisites: [
        'Access to source repository',
        'Development environment setup',
        'Database access and backup capabilities',
        'Staging environment for testing',
        'Team coordination and communication plan',
      ],
      rollbackPlan: [
        'Maintain original code in separate branch',
        'Keep database backups accessible',
        'Document all configuration changes',
        'Test rollback procedures in staging',
        'Have monitoring and alerting ready',
      ],
    };
  }

  async importRepository(
    repoUrl: string,
    targetDirectory: string,
    accessToken?: string,
  ): Promise<ProjectFiles> {
    try {
      const { owner, repo } = this.parseRepositoryUrl(repoUrl);
      const structure = await this.fetchRepositoryStructure(owner, repo, accessToken);
      
      const files: ProjectFiles = {};
      
      for (const file of structure) {
        if (file.type === 'file' && file.downloadUrl) {
          const content = await this.fetchFileContent(file.downloadUrl, accessToken);
          files[file.path] = content;
        }
      }
      
      return files;
    } catch (error) {
      console.error('Error importing repository:', error);
      throw new Error('Failed to import repository');
    }
  }

  private parseRepositoryUrl(repoUrl: string): { owner: string; repo: string } {
    const githubUrlRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?/;
    const match = repoUrl.match(githubUrlRegex);
    
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ''),
    };
  }

  private async fetchRepositoryInfo(
    owner: string, 
    repo: string, 
    accessToken?: string,
  ): Promise<GitHubRepository> {
    const url = `${this.GITHUB_API_BASE}/repos/${owner}/${repo}`;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `token ${accessToken}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch repository info: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      name: data.name,
      fullName: data.full_name,
      description: data.description || '',
      url: data.html_url,
      cloneUrl: data.clone_url,
      language: data.language || 'Unknown',
      stargazersCount: data.stargazers_count,
      forksCount: data.forks_count,
      isPrivate: data.private,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      topics: data.topics || [],
      license: data.license ? {
        name: data.license.name,
        spdxId: data.license.spdx_id,
      } : undefined,
    };
  }

  private async fetchRepositoryStructure(
    owner: string, 
    repo: string, 
    accessToken?: string,
    path = '',
  ): Promise<GitHubFile[]> {
    const url = `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `token ${accessToken}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch repository structure: ${response.statusText}`);
    }
    
    const data = await response.json();
    const files: GitHubFile[] = [];
    
    for (const item of data) {
      const file: GitHubFile = {
        name: item.name,
        path: item.path,
        type: item.type === 'dir' ? 'dir' : 'file',
        size: item.size,
        downloadUrl: item.download_url,
      };
      
      files.push(file);
      
      // Recursively fetch subdirectories (limit depth to avoid infinite recursion)
      if (item.type === 'dir' && path.split('/').length < 5) {
        const subFiles = await this.fetchRepositoryStructure(owner, repo, accessToken, item.path);
        files.push(...subFiles);
      }
    }
    
    return files;
  }

  private async fetchFileContent(downloadUrl: string, accessToken?: string): Promise<string> {
    const headers: Record<string, string> = {};
    
    if (accessToken) {
      headers['Authorization'] = `token ${accessToken}`;
    }

    const response = await fetch(downloadUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.statusText}`);
    }
    
    return await response.text();
  }

  private async analyzeTechStack(
    structure: GitHubFile[],
    owner: string,
    repo: string,
    accessToken?: string,
  ): Promise<RepositoryAnalysis['techStack']> {
    const frontend: string[] = [];
    const backend: string[] = [];
    const database: string[] = [];
    const tools: string[] = [];
    const languages: Record<string, number> = {};

    // Check for package.json files
    const packageJsonFiles = structure.filter(f => f.name === 'package.json');
    for (const file of packageJsonFiles) {
      if (file.downloadUrl) {
        try {
          const content = await this.fetchFileContent(file.downloadUrl, accessToken);
          const packageJson = JSON.parse(content);
          
          // Analyze dependencies
          const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
          
          // Frontend frameworks
          if (deps.react) {
            frontend.push('React');
          }
          if (deps.vue) {
            frontend.push('Vue.js');
          }
          if (deps['@angular/core']) {
            frontend.push('Angular');
          }
          if (deps.svelte) {
            frontend.push('Svelte');
          }
          
          // Backend frameworks
          if (deps.express) {
            backend.push('Express.js');
          }
          if (deps.fastify) {
            backend.push('Fastify');
          }
          if (deps['@nestjs/core']) {
            backend.push('NestJS');
          }
          if (deps.koa) {
            backend.push('Koa.js');
          }
          
          // Database libraries
          if (deps.mongoose) {
            database.push('MongoDB');
          }
          if (deps.pg || deps.postgres) {
            database.push('PostgreSQL');
          }
          if (deps.mysql || deps.mysql2) {
            database.push('MySQL');
          }
          if (deps.redis) {
            database.push('Redis');
          }
          if (deps.typeorm) {
            database.push('TypeORM');
          }
          
          // Tools
          if (deps.webpack) {
            tools.push('Webpack');
          }
          if (deps.vite) {
            tools.push('Vite');
          }
          if (deps.jest) {
            tools.push('Jest');
          }
          if (deps.eslint) {
            tools.push('ESLint');
          }
          if (deps.prettier) {
            tools.push('Prettier');
          }
          if (deps.typescript) {
            tools.push('TypeScript');
          }
          
        } catch (error) {
          console.error('Error parsing package.json:', error);
        }
      }
    }

    // Check for Python requirements.txt or setup.py
    const pythonFiles = structure.filter(f => 
      f.name === 'requirements.txt' || f.name === 'setup.py' || f.name === 'Pipfile',
    );
    
    if (pythonFiles.length > 0) {
      languages['Python'] = 1;
      // Could analyze Python dependencies here
    }

    // Check for other language indicators
    if (structure.some(f => f.name.endsWith('.java'))) {
      languages['Java'] = 1;
    }
    
    if (structure.some(f => f.name.endsWith('.go'))) {
      languages['Go'] = 1;
    }
    
    if (structure.some(f => f.name.endsWith('.rs'))) {
      languages['Rust'] = 1;
    }

    // Check for configuration files
    if (structure.some(f => f.name === 'Dockerfile')) {
      tools.push('Docker');
    }
    if (structure.some(f => f.name === 'docker-compose.yml')) {
      tools.push('Docker Compose');
    }
    if (structure.some(f => f.name === 'kubernetes' || f.path.includes('k8s'))) {
      tools.push('Kubernetes');
    }

    return {
      frontend: Array.from(new Set(frontend)),
      backend: Array.from(new Set(backend)),
      database: Array.from(new Set(database)),
      tools: Array.from(new Set(tools)),
      languages,
    };
  }

  private async analyzeDependencies(
    structure: GitHubFile[],
    owner: string,
    repo: string,
    accessToken?: string,
  ): Promise<RepositoryAnalysis['dependencies']> {
    const frontend: Record<string, string> = {};
    const backend: Record<string, string> = {};
    const devDependencies: Record<string, string> = {};

    const packageJsonFiles = structure.filter(f => f.name === 'package.json');
    
    for (const file of packageJsonFiles) {
      if (file.downloadUrl) {
        try {
          const content = await this.fetchFileContent(file.downloadUrl, accessToken);
          const packageJson = JSON.parse(content);
          
          // Determine if it's frontend or backend based on dependencies
          const deps = packageJson.dependencies || {};
          const devDeps = packageJson.devDependencies || {};
          
          if (deps.react || deps.vue || deps['@angular/core'] || deps.svelte) {
            // Frontend package.json
            Object.assign(frontend, deps);
          } else if (deps.express || deps.fastify || deps['@nestjs/core']) {
            // Backend package.json
            Object.assign(backend, deps);
          }
          
          Object.assign(devDependencies, devDeps);
          
        } catch (error) {
          console.error('Error parsing package.json:', error);
        }
      }
    }

    return {
      frontend,
      backend,
      devDependencies,
    };
  }

  private async analyzeConfigurations(structure: GitHubFile[]): Promise<RepositoryAnalysis['configurations']> {
    return {
      hasDockerfile: structure.some(f => f.name === 'Dockerfile'),
      hasDockerCompose: structure.some(f => f.name === 'docker-compose.yml' || f.name === 'docker-compose.yaml'),
      hasCI: structure.some(f => 
        f.path.includes('.github/workflows') || 
        f.name === '.gitlab-ci.yml' || 
        f.name === '.travis.yml' ||
        f.name === 'Jenkinsfile',
      ),
      hasTests: structure.some(f => 
        f.path.includes('test') || 
        f.path.includes('spec') || 
        f.name.includes('.test.') ||
        f.name.includes('.spec.'),
      ),
      hasLinting: structure.some(f => 
        f.name === '.eslintrc.js' || 
        f.name === '.eslintrc.json' ||
        f.name === 'tslint.json',
      ),
      hasTypeScript: structure.some(f => 
        f.name === 'tsconfig.json' || 
        f.name.endsWith('.ts') || 
        f.name.endsWith('.tsx'),
      ),
    };
  }

  private async calculateMetrics(
    structure: GitHubFile[],
    owner: string,
    repo: string,
    accessToken?: string,
  ): Promise<RepositoryAnalysis['metrics']> {
    const fileCount = structure.filter(f => f.type === 'file').length;
    const codeFiles = structure.filter(f => 
      f.type === 'file' && this.isCodeFile(f.name),
    );
    
    let linesOfCode = 0;
    let complexity = 1;
    
    // Sample a few files to estimate total lines of code
    const sampleFiles = codeFiles.slice(0, Math.min(10, codeFiles.length));
    let totalSampleLines = 0;
    
    for (const file of sampleFiles) {
      if (file.downloadUrl) {
        try {
          const content = await this.fetchFileContent(file.downloadUrl, accessToken);
          const lines = content.split('\n').length;
          totalSampleLines += lines;
        } catch (error) {
          // Skip files that can't be fetched
        }
      }
    }
    
    // Estimate total lines based on sample
    if (sampleFiles.length > 0) {
      const avgLinesPerFile = totalSampleLines / sampleFiles.length;
      linesOfCode = Math.round(avgLinesPerFile * codeFiles.length);
    }

    // Calculate complexity based on file count and structure
    if (fileCount > 1000) {
      complexity = 5;
    } else if (fileCount > 500) {
      complexity = 4;
    } else if (fileCount > 100) {
      complexity = 3;
    } else if (fileCount > 20) {
      complexity = 2;
    } else {
      complexity = 1;
    }

    // Determine maintainability
    let maintainability: 'low' | 'medium' | 'high' = 'medium';
    
    const hasGoodStructure = structure.some(f => f.path.includes('src/')) && 
                           structure.some(f => f.path.includes('test/'));
    const hasDocumentation = structure.some(f => f.name.toLowerCase() === 'readme.md');
    const hasTypeScript = structure.some(f => f.name === 'tsconfig.json');
    
    if (hasGoodStructure && hasDocumentation && hasTypeScript) {
      maintainability = 'high';
    } else if (!hasGoodStructure || linesOfCode > 50000) {
      maintainability = 'low';
    }

    return {
      linesOfCode,
      fileCount,
      complexity,
      maintainability,
    };
  }

  private async generateRecommendations(
    techStack: RepositoryAnalysis['techStack'],
    dependencies: RepositoryAnalysis['dependencies'],
    configurations: RepositoryAnalysis['configurations'],
    metrics: RepositoryAnalysis['metrics'],
  ): Promise<RepositoryAnalysis['recommendations']> {
    const modernization: string[] = [];
    const security: string[] = [];
    const performance: string[] = [];
    const testing: string[] = [];
    const tooling: string[] = [];

    // Modernization recommendations
    if (!techStack.tools.includes('TypeScript')) {
      modernization.push('Migrate to TypeScript for better type safety and developer experience');
    }
    
    if (!configurations.hasDockerfile) {
      modernization.push('Add Docker containerization for consistent deployment');
    }
    
    if (techStack.frontend.includes('React') && !dependencies.frontend['react-router-dom']) {
      modernization.push('Add React Router for better routing management');
    }

    // Security recommendations
    if (!configurations.hasLinting) {
      security.push('Add ESLint with security rules to catch potential vulnerabilities');
    }
    
    security.push('Implement proper environment variable management');
    security.push('Add security headers and CORS configuration');
    security.push('Regular dependency updates to patch security vulnerabilities');

    // Performance recommendations
    if (metrics.linesOfCode > 10000) {
      performance.push('Consider code splitting and lazy loading for better performance');
    }
    
    performance.push('Implement caching strategies (Redis, CDN)');
    performance.push('Optimize database queries and add indexing');
    performance.push('Add performance monitoring and profiling');

    // Testing recommendations
    if (!configurations.hasTests) {
      testing.push('Add comprehensive test suite (unit, integration, E2E)');
    }
    
    testing.push('Implement test coverage reporting');
    testing.push('Add automated testing in CI/CD pipeline');
    testing.push('Set up testing environments and data fixtures');

    // Tooling recommendations
    if (!configurations.hasCI) {
      tooling.push('Set up CI/CD pipeline for automated testing and deployment');
    }
    
    if (!techStack.tools.includes('Prettier')) {
      tooling.push('Add Prettier for consistent code formatting');
    }
    
    tooling.push('Add pre-commit hooks for code quality enforcement');
    tooling.push('Implement automated dependency updates');

    return {
      modernization,
      security,
      performance,
      testing,
      tooling,
    };
  }

  private isCodeFile(filename: string): boolean {
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.php',
      '.rb', '.swift', '.kt', '.scala', '.cs', '.cpp', '.c', '.h',
    ];
    
    return codeExtensions.some(ext => filename.endsWith(ext));
  }

  private needsFrontendMigration(current: string[], target: string): boolean {
    return !current.some(tech => tech.toLowerCase().includes(target.toLowerCase()));
  }

  private needsBackendMigration(current: string[], target: string): boolean {
    return !current.some(tech => tech.toLowerCase().includes(target.toLowerCase()));
  }

  private needsDatabaseMigration(current: string[], target: string): boolean {
    return !current.some(db => db.toLowerCase().includes(target.toLowerCase()));
  }

  private calculateTotalTime(steps: MigrationStep[]): string {
    // Simplified time calculation - in a real implementation,
    // this would be more sophisticated
    const totalSteps = steps.length;
    
    if (totalSteps <= 3) {
      return '1-2 weeks';
    }
    if (totalSteps <= 5) {
      return '3-4 weeks';
    }
    if (totalSteps <= 7) {
      return '1-2 months';
    }
    return '2-3 months';
  }
}

export const githubIntegration = new GitHubIntegrationService();

// API endpoints
export const analyzeRepository = api(
  { method: 'POST', path: '/github/analyze' },
  async ({ 
    repoUrl, 
    accessToken, 
  }: { 
    repoUrl: string; 
    accessToken?: string 
  }): Promise<RepositoryAnalysis> => {
    return await githubIntegration.analyzeRepository(repoUrl, accessToken);
  },
);

export const createMigrationPlan = api(
  { method: 'POST', path: '/github/migration-plan' },
  async ({ 
    repositoryAnalysis, 
    targetAnalysis, 
  }: { 
    repositoryAnalysis: RepositoryAnalysis; 
    targetAnalysis: ProjectAnalysis 
  }): Promise<MigrationPlan> => {
    return await githubIntegration.createMigrationPlan(repositoryAnalysis, targetAnalysis);
  },
);

export const importRepository = api(
  { method: 'POST', path: '/github/import' },
  async ({ 
    repoUrl, 
    targetDirectory, 
    accessToken, 
  }: { 
    repoUrl: string; 
    targetDirectory: string; 
    accessToken?: string 
  }): Promise<ProjectFiles> => {
    return await githubIntegration.importRepository(repoUrl, targetDirectory, accessToken);
  },
);