# 🚀 Vaporform Build Guide

## Quick Start - Build from Source

### Prerequisites
- Node.js 18+
- npm 8+
- Docker & Docker Compose (for containerized deployment)

### 1. Clean Install & Build
```bash
# Clone repository
git clone https://github.com/devgru0101/Vaporform.git
cd Vaporform

# Install all dependencies
npm run install:all

# Build all components
npm run build

# Run tests (optional)
npm run test

# Start in development mode
npm run dev
```

### 2. Production Build & Deployment

#### Option A: Docker Compose (Recommended)
```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Option B: Manual Build
```bash
# Build backend (Encore)
cd backend
npm run build  # Creates Docker image via `encore build docker`

# Build frontend
cd ../frontend
npm run build  # Creates production build in ./dist

# Deploy built artifacts to your hosting platform
```

## 🏗️ Architecture

### Backend (Encore.ts)
- **Framework**: Encore.ts v1.49.0+ microservices
- **Database**: Automatic PostgreSQL provisioning
- **Authentication**: JWT tokens with bcrypt hashing
- **Services**: Auth, AI, Files, Health, Integrations, Templates, ProjectWizard

### Frontend (React)
- **Framework**: React 18 + TypeScript
- **State**: Redux Toolkit + React Query
- **Build**: Webpack 5
- **Output**: Static files for nginx/CDN deployment

### Database Migrations
- **Automatic**: Encore automatically applies migrations on startup
- **Location**: `backend/services/*/migrations/*.up.sql`
- **Format**: Sequential numbered migrations (1_create_table.up.sql, 2_add_column.up.sql)

## 🔧 Environment Variables

### Required for Production
```env
# Backend
JWT_SECRET=your-super-secure-jwt-secret-key
NODE_ENV=production
ANTHROPIC_API_KEY=your-anthropic-api-key

# Frontend  
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_WS_URL=wss://your-backend-domain.com
```

### Optional
```env
# Database (Encore manages automatically)
DATABASE_URL=postgresql://...

# Redis (if using external Redis)
REDIS_URL=redis://...
```

## 🚀 Deployment Options

### 1. Encore Cloud (Easiest)
```bash
cd backend
encore auth login
encore app create
git push encore main
```

### 2. AWS/GCP/Azure
1. Build Docker images: `docker-compose build`
2. Push to container registry
3. Deploy with your cloud platform's container service
4. Set environment variables in your cloud console

### 3. VPS/Dedicated Server
```bash
# Use docker-compose for full stack
docker-compose up -d

# Or build and run individually
docker build -t vaporform-backend ./backend
docker build -t vaporform-frontend ./frontend
docker run -p 4000:4000 vaporform-backend
docker run -p 3001:80 vaporform-frontend
```

## 📋 Build Checklist

- ✅ Node.js 18+ installed
- ✅ All npm dependencies installed (`npm run install:all`)
- ✅ Environment variables configured
- ✅ Database migrations tested
- ✅ Authentication system working
- ✅ Frontend builds without errors
- ✅ Backend builds without errors
- ✅ Docker containers start successfully
- ✅ All services can communicate

## 🐛 Common Issues

### "Migration not applied" 
- **Cause**: Rare Encore Docker volume issues
- **Solution**: `docker system prune -a && docker-compose up --build`

### "JWT token invalid"
- **Cause**: JWT_SECRET not set or changed
- **Solution**: Set consistent JWT_SECRET environment variable

### "Database connection failed"
- **Cause**: Database not ready before app starts
- **Solution**: Encore automatically handles this, but check Docker dependencies

### "Frontend can't reach backend"
- **Cause**: CORS or network configuration
- **Solution**: Ensure REACT_APP_API_URL matches backend URL

## 🔍 Monitoring

### Health Checks
- Backend: `GET http://localhost:4000/health`
- Database: Encore dashboard at `http://localhost:9400`

### Logs
```bash
# Docker Compose logs
docker-compose logs -f

# Individual service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```