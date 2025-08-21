# Vaporform

> AI-powered development environment combining modified VSCode IDE, Encore.ts backend, and Claude Code SDK integration

## Overview

Vaporform is a revolutionary AI-powered development environment that seamlessly integrates artificial intelligence capabilities into the developer workflow. It combines a modified VSCode IDE with a robust Encore.ts backend and Claude Code SDK integration to provide intelligent code generation, review, debugging, and testing capabilities.

## Features

### Core Features
- 🤖 **AI-Powered Code Generation** - Generate code using Claude AI with contextual awareness
- 🔍 **Intelligent Code Review** - Automated code analysis and improvement suggestions
- 🐛 **Smart Debugging** - AI-assisted error detection and resolution
- 🧪 **Automated Testing** - Generate comprehensive test suites automatically
- 📚 **Documentation Generation** - Create inline docs, APIs, and tutorials
- 🔄 **Code Refactoring** - Intelligent code optimization and modernization

### Development Environment
- 🎨 **Modified VSCode IDE** - Enhanced with AI capabilities and custom integrations
- ⚡ **Real-time Collaboration** - Multi-user project development with live updates
- 🏗️ **Project Templates** - Pre-configured setups for popular frameworks
- 🔧 **Container Orchestration** - Docker-based development and deployment
- 🚀 **CI/CD Integration** - Automated testing, security scanning, and deployment

### AI & Security
- 🛡️ **Enterprise Security** - Role-based access control and audit logging
- 📊 **Analytics & Insights** - Development metrics and AI usage analytics
- 🔐 **API Management** - Secure AI service integration with rate limiting
- 🌐 **Multi-language Support** - TypeScript, JavaScript, Python, Go, and more

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Services   │
│  (VSCode Mod)   │◄──►│   (Encore.ts)   │◄──►│   (Claude AI)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web UI/UX     │    │   PostgreSQL    │    │   Redis Cache   │
│   Components    │    │   Database      │    │   & Sessions    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git
- Anthropic API Key

### 1. Clone and Setup
```bash
git clone https://github.com/your-org/vaporform.git
cd vaporform
cp .env.example .env
# Edit .env with your configuration
```

### 2. Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend  
cd ../frontend && npm install

# Shared types
cd ../shared && npm install
```

### 3. Start Development Environment
```bash
# Start all services
docker-compose up -d

# Or start individually
npm run dev:backend
npm run dev:frontend
```

### 4. Access the Application
- Frontend: http://localhost:3001
- Files Server: http://localhost:3000  
- Backend API: http://localhost:4000
- Database: localhost:5432 (requires Docker)
- Redis: localhost:6379 (requires Docker)

## Project Structure

```
vaporform/
├── backend/                 # Encore.ts backend services
│   ├── src/
│   │   ├── services/       # API endpoints and business logic
│   │   ├── middleware/     # Authentication, validation, etc.
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Helper functions and utilities
│   ├── tests/              # Backend test suites
│   └── config/             # Configuration files
├── frontend/               # Modified VSCode frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── views/          # Page-level components
│   │   ├── stores/         # State management
│   │   ├── utils/          # Frontend utilities
│   │   └── types/          # Frontend-specific types
│   ├── public/             # Static assets
│   └── assets/             # Build assets
├── shared/                 # Shared types and utilities
│   └── src/
│       ├── types/          # Common type definitions
│       └── utils/          # Shared utility functions
├── infrastructure/         # Docker, Terraform, K8s configs
│   ├── docker/             # Docker configurations
│   ├── terraform/          # Infrastructure as code
│   ├── kubernetes/         # K8s deployment configs
│   └── nginx/              # Reverse proxy configuration
├── docs/                   # Documentation
├── scripts/                # Build and deployment scripts
├── tests/                  # Integration and E2E tests
└── .github/                # CI/CD workflows
```

## Development

### Available Scripts

#### Backend
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run unit tests
npm run test:coverage    # Run tests with coverage
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

#### Frontend
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run unit tests
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

#### Docker Commands
```bash
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f backend    # View backend logs
docker-compose exec backend sh    # Shell into backend container
```

### Environment Variables

Create `.env` file from `.env.example`:

```env
# Application
NODE_ENV=development
PORT=4000

# Security
JWT_SECRET=your-super-secure-jwt-secret
CORS_ORIGIN=http://localhost:3001

# AI Services
ANTHROPIC_API_KEY=your-anthropic-api-key

# Database
DATABASE_URL=postgresql://vaporform:vaporform@localhost:5432/vaporform
REDIS_URL=redis://localhost:6379
```

## API Documentation

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Project Management
- `GET /projects` - List user projects
- `POST /projects` - Create new project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### AI Services
- `POST /ai/generate` - Generate code
- `POST /ai/review` - Review code
- `POST /ai/debug` - Debug assistance
- `POST /ai/tests` - Generate tests
- `POST /ai/refactor` - Refactor code
- `POST /ai/docs` - Generate documentation

## Testing

### Running Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests with coverage
npm run test:coverage
```

### Test Structure
- `**/*.test.ts` - Unit tests
- `**/*.spec.ts` - Integration tests
- `tests/e2e/` - End-to-end tests

## Deployment

### Production Build
```bash
# Build all services
npm run build:all

# Build Docker images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
npm run deploy:prod
```

### CI/CD Pipeline
The project includes comprehensive CI/CD workflows:
- **Lint & Type Check** - Code quality validation
- **Unit Tests** - Automated testing with coverage
- **Security Scanning** - Dependency and container security
- **Build & Deploy** - Automated deployment to staging/production

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Use conventional commit messages
- Ensure all CI checks pass
- Update documentation as needed

## Security

- Authentication via JWT tokens
- Role-based access control
- Rate limiting on API endpoints
- Input validation with Zod schemas
- Security headers via Helmet
- Regular dependency updates
- Container security scanning

## Performance

- Redis caching for frequent queries
- Database query optimization
- CDN for static assets
- Gzip compression
- Connection pooling
- Horizontal scaling support

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📚 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/your-org/vaporform/issues)
- 💬 [Discussions](https://github.com/your-org/vaporform/discussions)
- 📧 Email: support@vaporform.dev

## Roadmap

### Phase 1 (Current)
- ✅ Core AI integration
- ✅ Project management
- ✅ User authentication
- ⏳ VSCode modifications

### Phase 2
- 🔄 Real-time collaboration
- 🔄 Advanced AI features
- 🔄 Plugin ecosystem
- 🔄 Mobile companion app

### Phase 3
- 📋 Enterprise features
- 📋 Advanced analytics
- 📋 Custom AI models
- 📋 Marketplace integration

---

**Built with ❤️ by the Vaporform Team**