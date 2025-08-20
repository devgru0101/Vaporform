#!/bin/bash

# Vaporform Development Server Script
# This script provides convenient commands for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show usage
show_usage() {
    echo "Vaporform Development Script"
    echo "Usage: $0 <command>"
    echo
    echo "Commands:"
    echo "  start           Start all development services"
    echo "  stop            Stop all services"
    echo "  restart         Restart all services"
    echo "  backend         Start only backend service"
    echo "  frontend        Start only frontend service"
    echo "  db              Start only database services"
    echo "  logs [service]  Show logs for all services or specific service"
    echo "  test            Run all tests"
    echo "  test:backend    Run backend tests"
    echo "  test:frontend   Run frontend tests"
    echo "  lint            Run linting for all services"
    echo "  format          Format code for all services"
    echo "  clean           Clean build artifacts and containers"
    echo "  reset           Reset development environment"
    echo "  status          Show status of all services"
    echo "  help            Show this help message"
    echo
    echo "Examples:"
    echo "  $0 start                 # Start all services"
    echo "  $0 logs backend         # Show backend logs"
    echo "  $0 test:backend         # Run backend tests"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Change to project root
cd "$(dirname "$0")/.."

# Main command handler
case "${1:-help}" in
    start)
        log_info "Starting all development services..."
        check_docker
        docker-compose up -d
        log_success "All services started"
        log_info "Frontend: http://localhost:3000"
        log_info "Backend API: http://localhost:4000"
        log_info "Database: localhost:5432"
        log_info "Redis: localhost:6379"
        ;;
    
    stop)
        log_info "Stopping all services..."
        docker-compose down
        log_success "All services stopped"
        ;;
    
    restart)
        log_info "Restarting all services..."
        docker-compose down
        docker-compose up -d
        log_success "All services restarted"
        ;;
    
    backend)
        log_info "Starting backend service..."
        check_docker
        docker-compose up -d postgres redis
        cd backend
        npm run dev
        ;;
    
    frontend)
        log_info "Starting frontend service..."
        if [ -d "frontend" ]; then
            cd frontend
            npm run dev
        else
            log_error "Frontend directory not found"
            exit 1
        fi
        ;;
    
    db)
        log_info "Starting database services..."
        check_docker
        docker-compose up -d postgres redis
        log_success "Database services started"
        ;;
    
    logs)
        if [ -n "$2" ]; then
            log_info "Showing logs for $2..."
            docker-compose logs -f "$2"
        else
            log_info "Showing logs for all services..."
            docker-compose logs -f
        fi
        ;;
    
    test)
        log_info "Running all tests..."
        
        # Run backend tests
        log_info "Running backend tests..."
        cd backend
        npm run test
        cd ..
        
        # Run frontend tests if frontend exists
        if [ -d "frontend" ]; then
            log_info "Running frontend tests..."
            cd frontend
            npm run test
            cd ..
        fi
        
        # Run shared tests if shared exists
        if [ -d "shared" ]; then
            log_info "Running shared tests..."
            cd shared
            npm run test 2>/dev/null || log_warning "No tests found in shared"
            cd ..
        fi
        
        log_success "All tests completed"
        ;;
    
    test:backend)
        log_info "Running backend tests..."
        cd backend
        npm run test
        log_success "Backend tests completed"
        ;;
    
    test:frontend)
        if [ -d "frontend" ]; then
            log_info "Running frontend tests..."
            cd frontend
            npm run test
            log_success "Frontend tests completed"
        else
            log_error "Frontend directory not found"
            exit 1
        fi
        ;;
    
    lint)
        log_info "Running linting for all services..."
        
        # Lint backend
        log_info "Linting backend..."
        cd backend
        npm run lint
        cd ..
        
        # Lint frontend if it exists
        if [ -d "frontend" ]; then
            log_info "Linting frontend..."
            cd frontend
            npm run lint
            cd ..
        fi
        
        # Lint shared if it exists
        if [ -d "shared" ]; then
            log_info "Linting shared..."
            cd shared
            npm run lint 2>/dev/null || log_warning "No lint script found in shared"
            cd ..
        fi
        
        log_success "Linting completed"
        ;;
    
    format)
        log_info "Formatting code for all services..."
        
        # Format backend
        log_info "Formatting backend..."
        cd backend
        npm run format
        cd ..
        
        # Format frontend if it exists
        if [ -d "frontend" ]; then
            log_info "Formatting frontend..."
            cd frontend
            npm run format
            cd ..
        fi
        
        # Format shared if it exists
        if [ -d "shared" ]; then
            log_info "Formatting shared..."
            cd shared
            npm run format 2>/dev/null || log_warning "No format script found in shared"
            cd ..
        fi
        
        log_success "Code formatting completed"
        ;;
    
    clean)
        log_info "Cleaning build artifacts and containers..."
        
        # Stop and remove containers
        docker-compose down --volumes --remove-orphans
        
        # Remove build artifacts
        rm -rf backend/dist
        rm -rf frontend/dist 2>/dev/null || true
        rm -rf shared/dist 2>/dev/null || true
        
        # Clean node modules cache
        cd backend && npm cache clean --force && cd ..
        if [ -d "frontend" ]; then
            cd frontend && npm cache clean --force && cd ..
        fi
        if [ -d "shared" ]; then
            cd shared && npm cache clean --force && cd ..
        fi
        
        log_success "Cleanup completed"
        ;;
    
    reset)
        log_info "Resetting development environment..."
        
        # Stop services
        docker-compose down --volumes --remove-orphans
        
        # Remove node_modules
        rm -rf backend/node_modules
        rm -rf frontend/node_modules 2>/dev/null || true
        rm -rf shared/node_modules 2>/dev/null || true
        
        # Remove build artifacts
        rm -rf backend/dist
        rm -rf frontend/dist 2>/dev/null || true
        rm -rf shared/dist 2>/dev/null || true
        
        # Reinstall dependencies
        log_info "Reinstalling dependencies..."
        cd backend && npm install && cd ..
        if [ -d "frontend" ]; then
            cd frontend && npm install && cd ..
        fi
        if [ -d "shared" ]; then
            cd shared && npm install && cd ..
        fi
        
        log_success "Environment reset completed"
        ;;
    
    status)
        log_info "Checking service status..."
        docker-compose ps
        ;;
    
    help|--help|-h)
        show_usage
        ;;
    
    *)
        log_error "Unknown command: $1"
        echo
        show_usage
        exit 1
        ;;
esac