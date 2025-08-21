# Vaporform Testing Guide

## 🧪 Comprehensive Testing Strategy

This document outlines the complete testing strategy for the Vaporform application, including setup, execution, and best practices.

## 📋 Table of Contents

- [Testing Overview](#testing-overview)
- [Test Structure](#test-structure)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Running Tests](#running-tests)
- [Coverage Reports](#coverage-reports)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## 🎯 Testing Overview

The Vaporform application uses a multi-layered testing approach:

### Test Pyramid
```
           /\
          /  \    E2E Tests (Few)
         /____\
        /      \   Integration Tests (Some)
       /        \
      /          \  Unit Tests (Many)
     /____________\
```

### Testing Tools
- **Backend**: Vitest + Node.js Testing Framework
- **Frontend**: Jest + React Testing Library + User Events
- **Integration**: Axios mocking + API contract testing
- **E2E**: Jest with mock components for workflow testing
- **Coverage**: V8 (Backend) + Jest (Frontend)

## 📁 Test Structure

```
/Vaporform
├── backend/
│   ├── tests/
│   │   ├── setup.ts                 # Test configuration
│   │   ├── health.test.ts           # Health service tests
│   │   ├── auth.test.ts             # Authentication tests
│   │   ├── ai-service.test.ts       # AI service tests
│   │   ├── projects.test.ts         # Projects CRUD tests
│   │   ├── files.test.ts            # Files management tests
│   │   └── integration/             # Backend integration tests
│   └── vitest.config.ts             # Vitest configuration
│
├── frontend/
│   ├── src/__tests__/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.test.tsx  # UI component tests
│   │   │   │   └── Icons.test.tsx   # Icon component tests
│   │   │   └── Wizard/
│   │   │       └── ProjectWizard.test.tsx  # Wizard tests
│   │   ├── integration/
│   │   │   └── api-integration.test.tsx    # API integration tests
│   │   └── e2e/
│   │       └── complete-workflow.test.tsx  # E2E workflow tests
│   ├── src/setupTests.ts            # Jest configuration
│   └── jest.config.js               # Jest configuration
│
├── .github/workflows/test.yml       # CI/CD pipeline
├── test-runner.js                   # Comprehensive test runner
└── TESTING.md                       # This file
```

## 🔧 Backend Testing

### Test Coverage
- **Health Service**: Endpoint responses, error handling, performance
- **Authentication**: Login, registration, token validation, security
- **AI Service**: Chat, code generation, code review with mocks
- **Projects**: CRUD operations, validation, permissions
- **Files**: Upload, download, management, project associations

### Running Backend Tests
```bash
# Navigate to backend directory
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Example Test
```typescript
describe('Health Service', () => {
  test('should return healthy status', async () => {
    const response = await health();
    
    expect(response.status).toBe('healthy');
    expect(response.timestamp).toBeDefined();
    expect(response.environment).toBe('test');
  });
});
```

## ⚛️ Frontend Testing

### Test Coverage
- **UI Components**: Button variants, Icon rendering, accessibility
- **Wizard Flow**: Step navigation, validation, state management
- **Integration**: API communication, error handling
- **E2E Workflows**: Complete user journeys from auth to deployment

### Running Frontend Tests
```bash
# Navigate to frontend directory
cd frontend

# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Component tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # E2E tests only

# Run with coverage
npm run test:coverage

# Run in CI mode
npm run test:ci
```

### Example Test
```typescript
describe('Button Component', () => {
  test('should render with correct variant', () => {
    renderWithProvider(<Button variant="primary">Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Click me');
    expect(button).not.toBeDisabled();
  });
});
```

## 🔗 Integration Testing

Integration tests verify the communication between frontend and backend components.

### API Integration Tests
- Authentication flow
- Project management operations
- File upload/download
- AI service interactions
- Error handling and edge cases

### Running Integration Tests
```bash
# Run comprehensive integration tests
node test-runner.js

# Run backend and frontend integration tests in parallel
node test-runner.js --parallel

# Run with coverage reports
node test-runner.js --coverage
```

## 🎭 End-to-End Testing

E2E tests simulate complete user workflows using mock components.

### Covered Workflows
1. **User Registration & Login**
   - Account creation
   - Authentication flow
   - Session management

2. **Project Creation Wizard**
   - Step-by-step navigation
   - Form validation
   - Template selection
   - Configuration setup

3. **AI Chat Interaction**
   - Message sending/receiving
   - Code generation requests
   - Code review workflows

4. **File Management**
   - Upload/download operations
   - Project file organization
   - Real-time collaboration

### Running E2E Tests
```bash
# Frontend E2E tests
cd frontend && npm run test:e2e

# Full workflow testing
node test-runner.js --frontend-only
```

## 🏃‍♂️ Running Tests

### Quick Start
```bash
# Install all dependencies
npm install

# Run comprehensive test suite
node test-runner.js

# Run with installation and coverage
node test-runner.js --install --coverage --parallel
```

### Test Runner Options
```bash
# Backend only
node test-runner.js --backend-only

# Frontend only  
node test-runner.js --frontend-only

# With coverage reports
node test-runner.js --coverage

# Install dependencies first
node test-runner.js --install

# Run tests in parallel
node test-runner.js --parallel

# Show help
node test-runner.js --help
```

### Individual Component Testing
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Specific test files
cd frontend && npm test Button.test.tsx
cd backend && npm test health.test.ts
```

## 📊 Coverage Reports

### Coverage Thresholds
- **Backend**: 80% (branches, functions, lines, statements)
- **Frontend**: 70% (branches, functions, lines, statements)

### Viewing Coverage
```bash
# Generate and view coverage reports
npm run test:coverage

# Coverage files location
backend/coverage/index.html    # Backend coverage
frontend/coverage/index.html   # Frontend coverage
```

### Coverage Exclusions
- Test files themselves
- Configuration files
- Generated code (encore.gen)
- Type definition files

## 🚀 CI/CD Integration

### GitHub Actions Workflow
The project includes a comprehensive CI/CD pipeline (`.github/workflows/test.yml`) that:

1. **Runs tests in parallel** for backend and frontend
2. **Performs security audits** on dependencies
3. **Generates coverage reports** and uploads to Codecov
4. **Runs integration tests** with real database
5. **Provides quality gates** for PR approvals
6. **Creates deployment previews** for PRs

### Pipeline Stages
1. **Backend Tests**: Health, Auth, AI, Projects, Files
2. **Frontend Tests**: Components, Integration, E2E
3. **Integration Tests**: Full-stack communication
4. **Security Audit**: Dependency vulnerability checking
5. **Quality Gates**: Coverage and test result validation
6. **Performance Tests**: Bundle size and load testing
7. **Deployment Preview**: Build verification

### Environment Variables for CI
```yaml
NODE_ENV: test
DATABASE_URL: postgresql://postgres:postgres@localhost:5432/vaporform_test
REDIS_URL: redis://localhost:6379/1
JWT_SECRET: test-secret-key
ANTHROPIC_API_KEY: test-anthropic-key
```

## 🎯 Best Practices

### Writing Tests
1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use descriptive test names** that explain the expected behavior
3. **Test behavior, not implementation** details
4. **Keep tests isolated** and independent
5. **Use proper mocking** for external dependencies

### Test Organization
1. **Group related tests** using `describe` blocks
2. **Use consistent naming** conventions
3. **Keep test files** close to source files
4. **Write tests first** when fixing bugs (TDD)

### Performance
1. **Minimize test setup** and teardown time
2. **Use parallel execution** when possible
3. **Mock expensive operations** like API calls
4. **Share common setup** between related tests

### Maintenance
1. **Update tests** when requirements change
2. **Remove obsolete tests** for deprecated features
3. **Monitor test performance** and optimize slow tests
4. **Review test coverage** regularly

## 🔧 Troubleshooting

### Common Issues

**Tests fail with import errors**
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear caches
npm run clean
rm -rf node_modules
npm install
```

**Mock issues in tests**
```typescript
// Ensure mocks are properly reset
beforeEach(() => {
  jest.clearAllMocks();
});
```

**Coverage not generated**
```bash
# Ensure coverage tools are installed
npm install --save-dev @vitest/coverage-v8

# Check vitest configuration
cat vitest.config.ts
```

**Frontend tests timeout**
```typescript
// Increase timeout in jest.config.js
module.exports = {
  testTimeout: 10000,
  // ...
};
```

### Debug Mode
```bash
# Run tests with debug output
DEBUG=* npm test

# Run specific test with verbose output
npm test -- --verbose Button.test.tsx
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 🤝 Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Maintain coverage thresholds**
3. **Update integration tests** if APIs change
4. **Add E2E tests** for new user workflows
5. **Update this documentation** for new testing patterns

---

For questions about testing or to report issues, please check the [project issues](https://github.com/vaporform/vaporform/issues) or contact the development team.