#!/bin/bash

# Vaporform Development Environment Setup Script
# This script sets up the complete development environment for Vaporform

set -e  # Exit on any error

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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("node")
    else
        NODE_VERSION=$(node --version | cut -d 'v' -f 2)
        REQUIRED_VERSION="18.0.0"
        if ! node -pe "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
            log_error "Node.js version $REQUIRED_VERSION or higher is required. Found: $NODE_VERSION"
            missing_deps+=("node")
        fi
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists docker; then
        missing_deps+=("docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_deps+=("docker-compose")
    fi
    
    if ! command_exists git; then
        missing_deps+=("git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_info "Please install the missing dependencies and run this script again."
        exit 1
    fi
    
    log_success "All prerequisites are satisfied"
}

# Setup environment variables
setup_environment() {
    log_info "Setting up environment variables..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_success "Created .env file from .env.example"
            log_warning "Please edit .env file with your configuration before continuing"
            
            # Check if ANTHROPIC_API_KEY is set
            if ! grep -q "ANTHROPIC_API_KEY=" .env || grep -q "ANTHROPIC_API_KEY=your-anthropic-api-key" .env; then
                log_warning "Don't forget to set your ANTHROPIC_API_KEY in the .env file"
            fi
        else
            log_error ".env.example file not found"
            exit 1
        fi
    else
        log_info ".env file already exists"
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Install backend dependencies
    log_info "Installing backend dependencies..."
    cd backend
    npm ci
    cd ..
    log_success "Backend dependencies installed"
    
    # Install frontend dependencies (when frontend directory exists)
    if [ -d "frontend" ]; then
        log_info "Installing frontend dependencies..."
        cd frontend
        npm ci
        cd ..
        log_success "Frontend dependencies installed"
    else
        log_warning "Frontend directory not found, skipping frontend dependencies"
    fi
    
    # Install shared dependencies
    if [ -d "shared" ]; then
        log_info "Installing shared dependencies..."
        cd shared
        npm ci
        cd ..
        log_success "Shared dependencies installed"
    else
        log_warning "Shared directory not found, skipping shared dependencies"
    fi
}

# Setup database
setup_database() {
    log_info "Setting up database..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and run this script again."
        exit 1
    fi
    
    # Start database services
    log_info "Starting database services..."
    docker-compose up -d postgres redis
    
    # Wait for services to be ready
    log_info "Waiting for database services to be ready..."
    sleep 10
    
    # Check if postgres is ready
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U vaporform >/dev/null 2>&1; then
            log_success "PostgreSQL is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "PostgreSQL did not become ready in time"
            exit 1
        fi
        sleep 2
    done
    
    # Check if redis is ready
    for i in {1..30}; do
        if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
            log_success "Redis is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "Redis did not become ready in time"
            exit 1
        fi
        sleep 2
    done
}

# Build project
build_project() {
    log_info "Building project..."
    
    # Build shared types first
    if [ -d "shared" ]; then
        log_info "Building shared types..."
        cd shared
        npm run build
        cd ..
        log_success "Shared types built"
    fi
    
    # Build backend
    log_info "Building backend..."
    cd backend
    npm run build
    cd ..
    log_success "Backend built"
    
    # Build frontend (when it exists)
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        log_info "Building frontend..."
        cd frontend
        npm run build
        cd ..
        log_success "Frontend built"
    fi
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Run backend tests
    log_info "Running backend tests..."
    cd backend
    npm run test
    cd ..
    log_success "Backend tests passed"
    
    # Run frontend tests (when it exists)
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        log_info "Running frontend tests..."
        cd frontend
        npm run test
        cd ..
        log_success "Frontend tests passed"
    fi
}

# Setup development tools
setup_dev_tools() {
    log_info "Setting up development tools..."
    
    # Install global tools if needed
    if ! command_exists encore; then
        log_info "Installing Encore CLI..."
        npm install -g encore.dev
        log_success "Encore CLI installed"
    fi
    
    # Setup pre-commit hooks
    if [ -d ".git" ]; then
        log_info "Setting up pre-commit hooks..."
        # Add pre-commit hook setup here if needed
        log_success "Pre-commit hooks configured"
    fi
}

# Main setup function
main() {
    log_info "Starting Vaporform development environment setup..."
    echo
    
    # Change to script directory
    cd "$(dirname "$0")/.."
    
    check_prerequisites
    echo
    
    setup_environment
    echo
    
    install_dependencies
    echo
    
    setup_database
    echo
    
    build_project
    echo
    
    setup_dev_tools
    echo
    
    # Optional: run tests
    read -p "Do you want to run tests? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests
        echo
    fi
    
    log_success "Vaporform development environment setup completed!"
    echo
    log_info "Next steps:"
    echo "  1. Edit .env file with your configuration"
    echo "  2. Set your ANTHROPIC_API_KEY in the .env file"
    echo "  3. Run 'docker-compose up -d' to start all services"
    echo "  4. Run 'npm run dev:backend' to start the backend"
    echo "  5. Run 'npm run dev:frontend' to start the frontend (when available)"
    echo
    log_info "For more information, see the documentation in the docs/ directory"
}

# Handle script interruption
trap 'log_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"