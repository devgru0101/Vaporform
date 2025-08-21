import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'encore.gen/**'
    ],
    coverage: {
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      include: [
        'health/**/*.ts',
        'auth/**/*.ts',
        'ai/**/*.ts',
        'projects/**/*.ts',
        'files/**/*.ts'
      ],
      exclude: [
        'tests/**',
        'node_modules/**',
        'encore.gen/**',
        '**/*.d.ts',
        '**/encore.service.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    silent: false,
    reporter: ['verbose', 'junit'],
    outputFile: {
      junit: './coverage/junit.xml'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '~/': path.resolve(__dirname, './')
    }
  }
});