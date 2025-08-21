/**
 * End-to-End User Flow Tests with Playwright
 * Tests complete user journeys through the Vaporform application
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.E2E_API_URL || 'http://localhost:4000';

// Test user credentials
const TEST_USER = {
  email: 'test-user@vaporform.com',
  password: 'SecurePassword123!',
  name: 'Test User',
};

const ADMIN_USER = {
  email: 'admin@vaporform.com',
  password: 'AdminPassword123!',
  name: 'Admin User',
};

// Helper functions
async function loginUser(page: Page, user = TEST_USER) {
  await page.goto(`${BASE_URL}/auth/login`);
  
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.click('[data-testid="login-button"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/workspace');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
}

async function setupMFA(page: Page, method: 'totp' | 'webauthn' = 'totp') {
  await page.goto(`${BASE_URL}/settings/security`);
  
  await page.click('[data-testid="setup-mfa-button"]');
  await page.click(`[data-testid="select-${method}"]`);
  
  if (method === 'totp') {
    await page.click('[data-testid="generate-qr"]');
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    
    // Simulate TOTP code entry (in real test, would use actual TOTP generation)
    await page.fill('[data-testid="verification-code"]', '123456');
    await page.click('[data-testid="verify-code"]');
    
    await expect(page.locator('[data-testid="mfa-complete"]')).toBeVisible();
  }
}

async function createProject(page: Page, projectConfig: {
  type: string;
  name: string;
  requirements: string;
  template: string;
}) {
  await page.goto(`${BASE_URL}/wizard`);
  
  // Step 1: Project Type
  await page.click(`[data-testid="select-${projectConfig.type}"]`);
  await page.click('[data-testid="next-button"]');
  
  // Step 2: Requirements
  await page.fill('[data-testid="requirements-input"]', projectConfig.requirements);
  await page.click('[data-testid="next-button"]');
  
  // Wait for requirements analysis
  await page.waitForSelector('[data-testid="template-step"]', { timeout: 10000 });
  
  // Step 3: Template
  await page.click(`[data-testid="select-${projectConfig.template}"]`);
  await page.click('[data-testid="next-button"]');
  
  // Step 4: Configuration
  await page.fill('[data-testid="project-name-input"]', projectConfig.name);
  await page.fill('[data-testid="project-description-input"]', `Description for ${projectConfig.name}`);
  await page.check('[data-testid="include-tests-checkbox"]');
  await page.check('[data-testid="include-docker-checkbox"]');
  await page.click('[data-testid="next-button"]');
  
  // Step 5: Preview
  await expect(page.locator('[data-testid="preview-summary"]')).toContainText(projectConfig.name);
  await page.click('[data-testid="next-button"]');
  
  // Wait for preview generation
  await page.waitForSelector('[data-testid="deploy-step"]', { timeout: 15000 });
  
  // Step 6: Deploy
  await page.click('[data-testid="next-button"]');
  
  // Wait for project creation
  await page.waitForURL('**/workspace/*', { timeout: 30000 });
}

test.describe('Vaporform E2E User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data and clean state before each test
    await page.goto(BASE_URL);
  });

  test.describe('Authentication Flow', () => {
    test('should complete full registration and login flow', async ({ page }) => {
      // Registration
      await page.goto(`${BASE_URL}/auth/register`);
      
      await page.fill('[data-testid="name-input"]', TEST_USER.name);
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.fill('[data-testid="confirm-password-input"]', TEST_USER.password);
      await page.check('[data-testid="terms-checkbox"]');
      
      await page.click('[data-testid="register-button"]');
      
      // Should redirect to email verification
      await expect(page.locator('[data-testid="verification-message"]')).toBeVisible();
      
      // Simulate email verification (in real test, would check email and click link)
      await page.goto(`${BASE_URL}/auth/verify?token=mock-verification-token`);
      
      // Should redirect to login
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      
      // Login
      await loginUser(page);
      
      // Should be redirected to workspace
      await expect(page.locator('[data-testid="workspace-page"]')).toBeVisible();
    });

    test('should handle MFA setup and login', async ({ page }) => {
      await loginUser(page);
      
      // Setup MFA
      await setupMFA(page, 'totp');
      
      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      
      // Login again with MFA
      await page.goto(`${BASE_URL}/auth/login`);
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-button"]');
      
      // Should prompt for MFA
      await expect(page.locator('[data-testid="mfa-challenge"]')).toBeVisible();
      
      await page.fill('[data-testid="mfa-code-input"]', '123456');
      await page.click('[data-testid="verify-mfa-button"]');
      
      // Should be logged in
      await expect(page.locator('[data-testid="workspace-page"]')).toBeVisible();
    });

    test('should handle WebAuthn authentication', async ({ page, context }) => {
      // Note: WebAuthn testing requires special setup in Playwright
      // This is a simplified version
      
      await loginUser(page);
      
      // Setup WebAuthn
      await page.goto(`${BASE_URL}/settings/security`);
      await page.click('[data-testid="setup-mfa-button"]');
      await page.click('[data-testid="select-webauthn"]');
      
      // Mock WebAuthn registration
      await page.addInitScript(() => {
        // Mock WebAuthn API
        Object.defineProperty(navigator, 'credentials', {
          value: {
            create: () => Promise.resolve({
              id: 'mock-credential-id',
              rawId: new ArrayBuffer(16),
              response: {
                attestationObject: new ArrayBuffer(32),
                clientDataJSON: new ArrayBuffer(16),
              },
              type: 'public-key',
            }),
            get: () => Promise.resolve({
              id: 'mock-credential-id',
              rawId: new ArrayBuffer(16),
              response: {
                authenticatorData: new ArrayBuffer(32),
                clientDataJSON: new ArrayBuffer(16),
                signature: new ArrayBuffer(32),
              },
              type: 'public-key',
            }),
          },
          configurable: true,
        });
      });
      
      await page.click('[data-testid="register-key"]');
      
      // Should complete WebAuthn setup
      await expect(page.locator('[data-testid="mfa-complete"]')).toBeVisible();
    });
  });

  test.describe('Project Creation Wizard', () => {
    test('should create a complete web application project', async ({ page }) => {
      await loginUser(page);
      
      await createProject(page, {
        type: 'web-app',
        name: 'E-commerce Platform',
        requirements: 'A modern e-commerce platform with user authentication, product catalog, shopping cart, payment integration, and admin dashboard.',
        template: 'react-template',
      });
      
      // Verify project was created
      await expect(page.locator('[data-testid="project-workspace"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-title"]')).toContainText('E-commerce Platform');
      
      // Verify project structure
      await expect(page.locator('[data-testid="file-explorer"]')).toBeVisible();
      await expect(page.locator('[data-testid="editor-area"]')).toBeVisible();
      await expect(page.locator('[data-testid="terminal-panel"]')).toBeVisible();
    });

    test('should create an API project with custom configuration', async ({ page }) => {
      await loginUser(page);
      
      await createProject(page, {
        type: 'api',
        name: 'REST API Service',
        requirements: 'RESTful API with authentication, user management, data validation, rate limiting, and comprehensive documentation.',
        template: 'nodejs-template',
      });
      
      // Verify API-specific features
      await expect(page.locator('[data-testid="api-docs-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="endpoint-explorer"]')).toBeVisible();
    });

    test('should handle wizard validation and error states', async ({ page }) => {
      await loginUser(page);
      
      await page.goto(`${BASE_URL}/wizard`);
      
      // Try to proceed without selection
      await expect(page.locator('[data-testid="next-button"]')).toBeDisabled();
      
      // Select project type
      await page.click('[data-testid="select-web-app"]');
      await expect(page.locator('[data-testid="next-button"]')).toBeEnabled();
      await page.click('[data-testid="next-button"]');
      
      // Try to proceed without requirements
      await expect(page.locator('[data-testid="next-button"]')).toBeDisabled();
      
      // Add minimal requirements
      await page.fill('[data-testid="requirements-input"]', 'Test');
      await expect(page.locator('[data-testid="next-button"]')).toBeEnabled();
      
      // Test error handling with network failure
      await page.route('**/api/wizard/analyze-requirements', route => {
        route.fulfill({ status: 500, body: 'Server Error' });
      });
      
      await page.click('[data-testid="next-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to analyze requirements');
    });
  });

  test.describe('Workspace Functionality', () => {
    test('should provide full IDE experience', async ({ page }) => {
      await loginUser(page);
      
      await createProject(page, {
        type: 'web-app',
        name: 'IDE Test Project',
        requirements: 'Simple web application for testing IDE features.',
        template: 'react-template',
      });
      
      // Test file explorer
      await page.click('[data-testid="file-explorer-toggle"]');
      await expect(page.locator('[data-testid="file-tree"]')).toBeVisible();
      
      // Open a file
      await page.click('[data-testid="file-item"]:has-text("App.tsx")');
      await expect(page.locator('[data-testid="editor-tab"]')).toContainText('App.tsx');
      
      // Edit file content
      const editor = page.locator('[data-testid="monaco-editor"]');
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.type('// Modified by E2E test\nconsole.log("Hello from E2E test");');
      
      // Save file
      await page.keyboard.press('Control+S');
      await expect(page.locator('[data-testid="save-indicator"]')).toContainText('Saved');
      
      // Test terminal
      await page.click('[data-testid="terminal-toggle"]');
      await expect(page.locator('[data-testid="terminal-panel"]')).toBeVisible();
      
      const terminal = page.locator('[data-testid="terminal-input"]');
      await terminal.fill('npm test');
      await terminal.press('Enter');
      
      // Should show command output
      await expect(page.locator('[data-testid="terminal-output"]')).toContainText('npm test');
    });

    test('should support AI chat integration', async ({ page }) => {
      await loginUser(page);
      
      await createProject(page, {
        type: 'web-app',
        name: 'AI Chat Test',
        requirements: 'Project for testing AI integration.',
        template: 'react-template',
      });
      
      // Open AI chat
      await page.click('[data-testid="ai-chat-toggle"]');
      await expect(page.locator('[data-testid="ai-chat-panel"]')).toBeVisible();
      
      // Send message to AI
      const chatInput = page.locator('[data-testid="ai-chat-input"]');
      await chatInput.fill('Help me create a new React component');
      await page.click('[data-testid="send-message"]');
      
      // Should show message in chat
      await expect(page.locator('[data-testid="chat-message"]').last()).toContainText('Help me create a new React component');
      
      // Should show AI response (mocked)
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
    });

    test('should handle container deployment', async ({ page }) => {
      await loginUser(page);
      
      await createProject(page, {
        type: 'api',
        name: 'Container Deploy Test',
        requirements: 'API project for testing container deployment.',
        template: 'nodejs-template',
      });
      
      // Open container panel
      await page.click('[data-testid="container-panel-toggle"]');
      await expect(page.locator('[data-testid="container-dashboard"]')).toBeVisible();
      
      // Start container
      await page.click('[data-testid="start-container"]');
      
      // Should show container status
      await expect(page.locator('[data-testid="container-status"]')).toContainText('Starting', { timeout: 10000 });
      await expect(page.locator('[data-testid="container-status"]')).toContainText('Running', { timeout: 30000 });
      
      // Check logs
      await page.click('[data-testid="view-logs"]');
      await expect(page.locator('[data-testid="container-logs"]')).toBeVisible();
      
      // Test health check
      await expect(page.locator('[data-testid="health-status"]')).toContainText('Healthy');
    });
  });

  test.describe('Collaboration Features', () => {
    test('should support real-time collaboration', async ({ browser }) => {
      // Create two browser contexts for different users
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // User 1 creates and shares project
      await loginUser(page1);
      await createProject(page1, {
        type: 'web-app',
        name: 'Collaboration Test',
        requirements: 'Project for testing collaboration features.',
        template: 'react-template',
      });
      
      // Share project
      await page1.click('[data-testid="share-project"]');
      await page1.click('[data-testid="generate-share-link"]');
      
      const shareLink = await page1.locator('[data-testid="share-link"]').textContent();
      
      // User 2 joins project
      await loginUser(page2, { ...TEST_USER, email: 'user2@vaporform.com' });
      await page2.goto(shareLink!);
      
      // Should see shared project
      await expect(page2.locator('[data-testid="project-workspace"]')).toBeVisible();
      await expect(page2.locator('[data-testid="collaboration-indicator"]')).toContainText('2 users online');
      
      // Test real-time editing
      await page1.click('[data-testid="file-item"]:has-text("App.tsx")');
      const editor1 = page1.locator('[data-testid="monaco-editor"]');
      await editor1.click();
      await page1.keyboard.type('// User 1 edit');
      
      // User 2 should see the change
      await expect(page2.locator('[data-testid="monaco-editor"]')).toContainText('// User 1 edit', { timeout: 5000 });
      
      // Test cursor presence
      await expect(page2.locator('[data-testid="remote-cursor"]')).toBeVisible();
      
      await context1.close();
      await context2.close();
    });
  });

  test.describe('Security and Permissions', () => {
    test('should enforce proper access controls', async ({ page }) => {
      await loginUser(page);
      
      // Create project
      await createProject(page, {
        type: 'web-app',
        name: 'Security Test Project',
        requirements: 'Project for testing security features.',
        template: 'react-template',
      });
      
      // Test admin-only features are not accessible
      await expect(page.locator('[data-testid="admin-panel"]')).not.toBeVisible();
      
      // Test project settings access
      await page.click('[data-testid="project-settings"]');
      await expect(page.locator('[data-testid="project-settings-panel"]')).toBeVisible();
      
      // Regular user should not see dangerous settings
      await expect(page.locator('[data-testid="delete-project"]')).not.toBeVisible();
    });

    test('should handle admin-level operations', async ({ page }) => {
      await loginUser(page, ADMIN_USER);
      
      // Admin should see admin panel
      await page.goto(`${BASE_URL}/admin`);
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      
      // Test user management
      await page.click('[data-testid="user-management"]');
      await expect(page.locator('[data-testid="user-list"]')).toBeVisible();
      
      // Test system monitoring
      await page.click('[data-testid="system-monitoring"]');
      await expect(page.locator('[data-testid="monitoring-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
    });
  });

  test.describe('Performance and Reliability', () => {
    test('should handle large project creation', async ({ page }) => {
      await loginUser(page);
      
      // Create large project with many features
      await createProject(page, {
        type: 'web-app',
        name: 'Large Enterprise App',
        requirements: `
          Large enterprise application with:
          - User authentication and authorization
          - Dashboard with real-time data
          - Multiple data tables with pagination
          - File upload and management
          - Reporting and analytics
          - Admin panel
          - API integration
          - Responsive design
          - Multi-language support
          - Notification system
        `,
        template: 'react-template',
      });
      
      // Should complete within reasonable time
      await expect(page.locator('[data-testid="project-workspace"]')).toBeVisible({ timeout: 60000 });
      
      // Test that large project loads properly
      await expect(page.locator('[data-testid="file-explorer"]')).toBeVisible();
      await expect(page.locator('[data-testid="editor-area"]')).toBeVisible();
    });

    test('should handle network interruptions gracefully', async ({ page }) => {
      await loginUser(page);
      
      // Start project creation
      await page.goto(`${BASE_URL}/wizard`);
      await page.click('[data-testid="select-web-app"]');
      await page.click('[data-testid="next-button"]');
      
      await page.fill('[data-testid="requirements-input"]', 'Test project for network interruption');
      
      // Simulate network failure during requirements analysis
      await page.route('**/api/wizard/analyze-requirements', route => {
        route.abort();
      });
      
      await page.click('[data-testid="next-button"]');
      
      // Should show appropriate error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('network');
      
      // Should offer retry option
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      
      // Clear route and retry
      await page.unroute('**/api/wizard/analyze-requirements');
      await page.click('[data-testid="retry-button"]');
      
      // Should proceed normally
      await expect(page.locator('[data-testid="template-step"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work properly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginUser(page);
      
      // Test mobile navigation
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Test wizard on mobile
      await page.click('[data-testid="create-project-mobile"]');
      await expect(page.locator('[data-testid="wizard-page"]')).toBeVisible();
      
      // Should adapt layout for mobile
      await expect(page.locator('[data-testid="wizard-content"]')).toHaveCSS('flex-direction', 'column');
    });
  });

  test.describe('Accessibility', () => {
    test('should be accessible to screen readers', async ({ page }) => {
      await loginUser(page);
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      // Should navigate properly with keyboard
      await expect(page.locator(':focus')).toBeVisible();
      
      // Test ARIA labels
      const createButton = page.locator('[data-testid="create-project"]');
      await expect(createButton).toHaveAttribute('aria-label');
      
      // Test heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      await expect(headings.first()).toBeVisible();
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await loginUser(page);
      
      // This would require axe-core integration for comprehensive testing
      // For now, verify basic contrast requirements
      const primaryButton = page.locator('[data-testid="primary-button"]').first();
      const bgColor = await primaryButton.evaluate(el => 
        getComputedStyle(el).backgroundColor
      );
      const textColor = await primaryButton.evaluate(el => 
        getComputedStyle(el).color
      );
      
      // Basic check that colors are different (real test would calculate contrast ratio)
      expect(bgColor).not.toBe(textColor);
    });
  });
});