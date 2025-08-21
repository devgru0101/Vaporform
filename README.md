# Vaporform

AI-powered development environment with React frontend and pure Encore.ts backend

## Overview

Vaporform is a professional AI-powered development environment that integrates artificial intelligence capabilities into the developer workflow. It features a React-based IDE interface with a pure Encore.ts backend and Claude AI integration for intelligent code generation, review, debugging, and project management.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Services   │
│  (React 18)     │◄──►│   (Encore.ts)   │◄──►│   (Claude AI)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Redux Toolkit   │    │   PostgreSQL    │    │   File System   │
│ State Management│    │   Database      │    │   Integration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## System Dependencies

### Required Software
- **Node.js** 18.x or later
- **npm** 9.x or later
- **Git** 2.30 or later
- **Docker** 20.x or later (optional, for database)
- **Docker Compose** 1.29 or later (optional, for database)

### Operating System Support
- Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
- macOS 11+ (Big Sur or later)
- Windows 10/11 with WSL2

### Hardware Requirements
- **Minimum**: 4GB RAM, 2 CPU cores, 10GB disk space
- **Recommended**: 8GB RAM, 4 CPU cores, 25GB disk space
- **Network**: Stable internet connection for AI API calls

## Installation and Setup

### 1. Clone Repository
```bash
git clone https://github.com/devgru0101/Vaporform.git
cd Vaporform
```

### 2. Install Encore.ts (Backend Runtime)
```bash
# Install Encore CLI globally
curl -L https://encore.dev/install.sh | bash

# Verify installation
encore version
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration (see Configuration section)

# Initialize database (if using PostgreSQL)
encore run
```

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Verify Installation
- Frontend: http://localhost:3001
- Backend API: http://192.168.1.235:4001 (or your configured IP)
- File Server: http://localhost:3000

## Configuration

### Backend Environment Variables

Create `backend/.env` file:

```env
# Application Configuration
NODE_ENV=development
PORT=4001
HOST=0.0.0.0

# Security
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3001

# AI Services
ANTHROPIC_API_KEY=your-anthropic-api-key

# Database (Optional - Encore.ts can use built-in SQLite)
DATABASE_URL=postgresql://username:password@localhost:5432/vaporform

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Configuration

Create `frontend/.env` file:

```env
# API Configuration
REACT_APP_API_URL=http://192.168.1.235:4001
REACT_APP_WS_URL=ws://192.168.1.235:4001

# Development
REACT_APP_ENV=development
REACT_APP_DEBUG=true

# Build Configuration
PUBLIC_URL=/
GENERATE_SOURCEMAP=true
```

### Network Configuration

For development across multiple devices:

1. **Backend**: Configure to listen on all interfaces
   ```bash
   # In backend/.env
   HOST=0.0.0.0
   PORT=4001
   ```

2. **Frontend**: Update API endpoints to use your local IP
   ```bash
   # Find your local IP
   ip addr show  # Linux
   ifconfig      # macOS
   ipconfig      # Windows
   
   # Update REACT_APP_API_URL in frontend/.env
   REACT_APP_API_URL=http://YOUR_LOCAL_IP:4001
   ```

## Development Workflow

### Starting Development Environment

1. **Terminal 1** - Backend:
   ```bash
   cd backend
   encore run
   ```

2. **Terminal 2** - Frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Terminal 3** - File Server (optional):
   ```bash
   # From project root
   node file-server.js
   ```

### Application Flow

1. **Authentication**:
   - User accesses frontend at localhost:3001
   - Login/register forms connect to backend auth service
   - JWT tokens stored in localStorage for session persistence
   - Demo credentials: `demo@vaporform.com` / `password123`

2. **Project Management**:
   - File explorer connects to backend file system
   - Project wizard creates new projects via backend wizard service
   - Real-time file operations through Redux state management

3. **AI Integration**:
   - AI assistant panel connects to backend AI service
   - Claude API integration for code generation and analysis
   - Conversation history stored in Redux state

4. **Development Features**:
   - Code editor with syntax highlighting
   - Real-time collaboration (WebSocket)
   - File system operations
   - Project templates and scaffolding

## API Endpoints

### Authentication Service (/auth)
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `GET /auth/verify` - Token verification

### Project Wizard Service (/wizard)
- `POST /wizard/session` - Create project session
- `GET /wizard/templates` - List project templates
- `POST /wizard/analyze` - Analyze project requirements
- `POST /wizard/generate` - Generate project structure

### AI Service (/ai)
- `POST /ai/chat` - AI conversation
- `POST /ai/analyze` - Code analysis
- `POST /ai/generate` - Code generation

### Files Service (/files)
- `GET /files/list` - List directory contents
- `POST /files/create` - Create file/directory
- `PUT /files/update` - Update file content
- `DELETE /files/delete` - Delete file/directory

### Projects Service (/projects)
- `GET /projects/list` - List user projects
- `POST /projects/create` - Create new project
- `GET /projects/:id` - Get project details

## Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Frontend Tests
```bash
cd frontend

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Test Structure
- Unit tests: `**/*.test.ts`, `**/*.test.tsx`
- Integration tests: `**/*.integration.test.ts`
- E2E tests: `src/__tests__/e2e/`

## Deployment

### Production Build

1. **Backend**:
   ```bash
   cd backend
   npm run build
   encore build
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

### Docker Deployment

```bash
# Build images
docker-compose build

# Start production environment
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-Specific Configuration

**Staging**:
- Use staging API keys
- Enable debug logging
- Connect to staging database

**Production**:
- Use production API keys
- Disable debug features
- Enable performance monitoring
- Use production database
- Enable SSL/TLS

## Troubleshooting

### Common Issues

1. **Port Conflicts**:
   ```bash
   # Check port usage
   netstat -tulpn | grep :3001
   netstat -tulpn | grep :4001
   
   # Kill processes using ports
   sudo fuser -k 3001/tcp
   sudo fuser -k 4001/tcp
   ```

2. **Encore.ts Installation**:
   ```bash
   # Reinstall Encore CLI
   curl -L https://encore.dev/install.sh | bash
   
   # Verify PATH
   echo $PATH
   which encore
   ```

3. **Database Connection**:
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connection
   psql -h localhost -U username -d vaporform
   ```

4. **Network Issues**:
   ```bash
   # Test API connectivity
   curl http://192.168.1.235:4001/health
   
   # Check firewall rules
   sudo ufw status
   sudo firewall-cmd --list-all
   ```

### Development Tips

- Use `npm run dev` for hot reloading
- Check browser dev tools for frontend errors
- Monitor backend logs with `encore logs`
- Use Redux DevTools for state debugging
- Enable verbose logging in development

## Security Considerations

- JWT tokens expire after 24 hours
- API rate limiting prevents abuse
- Input validation using Zod schemas
- CORS configured for development domains
- File upload restrictions by type and size
- Environment variables for sensitive data

## Performance Optimization

- Redis caching for frequent API calls
- Code splitting in React frontend
- Lazy loading of components
- Optimized bundle sizes
- CDN for static assets
- Database query optimization

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

### Development Standards
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Unit tests for all new features
- Documentation for API changes
- Conventional commit messages

## License

MIT License - see LICENSE file for details.

## Support

- GitHub Issues: https://github.com/devgru0101/Vaporform/issues
- Documentation: ./docs/
- Support Email: support@vaporform.dev

---

Built by the Vaporform development team using modern web technologies and AI integration.