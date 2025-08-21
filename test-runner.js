#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Vaporform
 * Runs all tests across backend and frontend with detailed reporting
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  backend: {
    path: path.join(__dirname, 'backend'),
    testCommand: 'npm test',
    coverageCommand: 'npm run test:coverage',
    name: 'Backend (Encore.ts)'
  },
  frontend: {
    path: path.join(__dirname, 'frontend'),
    testCommand: 'npm test -- --watchAll=false',
    coverageCommand: 'npm run test:coverage',
    name: 'Frontend (React)'
  }
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
const log = (message, color = '') => {
  console.log(`${color}${message}${colors.reset}`);
};

const logHeader = (message) => {
  const border = '='.repeat(60);
  log(`\n${border}`, colors.cyan);
  log(`  ${message}`, colors.bright + colors.cyan);
  log(`${border}`, colors.cyan);
};

const logSection = (message) => {
  log(`\n📋 ${message}`, colors.blue);
  log('-'.repeat(40), colors.blue);
};

const logSuccess = (message) => {
  log(`✅ ${message}`, colors.green);
};

const logError = (message) => {
  log(`❌ ${message}`, colors.red);
};

const logWarning = (message) => {
  log(`⚠️  ${message}`, colors.yellow);
};

const logInfo = (message) => {
  log(`ℹ️  ${message}`, colors.blue);
};

// Check if directory and package.json exist
const checkEnvironment = (component) => {
  const { path: componentPath, name } = config[component];
  
  if (!fs.existsSync(componentPath)) {
    logError(`${name} directory not found: ${componentPath}`);
    return false;
  }
  
  const packageJsonPath = path.join(componentPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    logError(`package.json not found in ${name}: ${packageJsonPath}`);
    return false;
  }
  
  return true;
};

// Run command in specific directory
const runCommand = (command, workDir, name) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    logInfo(`Running: ${command} in ${name}`);
    
    const child = spawn(command, { 
      shell: true, 
      cwd: workDir,
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });
    
    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (code === 0) {
        logSuccess(`${name} completed successfully in ${duration}s`);
        resolve({ success: true, stdout, stderr, duration });
      } else {
        logError(`${name} failed with exit code ${code} after ${duration}s`);
        reject({ success: false, stdout, stderr, duration, exitCode: code });
      }
    });
    
    child.on('error', (error) => {
      logError(`Failed to start ${name}: ${error.message}`);
      reject({ success: false, error: error.message });
    });
  });
};

// Run tests for a specific component
const runComponentTests = async (component, options = {}) => {
  const { path: componentPath, name, testCommand, coverageCommand } = config[component];
  
  logSection(`Testing ${name}`);
  
  if (!checkEnvironment(component)) {
    return { success: false, component, error: 'Environment check failed' };
  }
  
  try {
    const command = options.coverage ? coverageCommand : testCommand;
    const result = await runCommand(command, componentPath, name);
    
    return {
      success: true,
      component,
      name,
      ...result
    };
  } catch (error) {
    return {
      success: false,
      component,
      name,
      ...error
    };
  }
};

// Install dependencies if needed
const installDependencies = async (component) => {
  const { path: componentPath, name } = config[component];
  const nodeModulesPath = path.join(componentPath, 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    logWarning(`Installing dependencies for ${name}...`);
    try {
      await runCommand('npm install', componentPath, `${name} - npm install`);
      logSuccess(`Dependencies installed for ${name}`);
    } catch (error) {
      logError(`Failed to install dependencies for ${name}`);
      throw error;
    }
  }
};

// Generate test summary
const generateSummary = (results) => {
  logHeader('TEST SUMMARY');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  log(`\n📊 Overall Results:`, colors.bright);
  log(`   Total Components: ${totalTests}`);
  log(`   Passed: ${passedTests}`, passedTests > 0 ? colors.green : '');
  log(`   Failed: ${failedTests}`, failedTests > 0 ? colors.red : '');
  
  if (passedTests === totalTests) {
    logSuccess(`\n🎉 All tests passed! (${totalTests}/${totalTests})`);
  } else {
    logError(`\n💥 ${failedTests} component(s) failed testing`);
  }
  
  log('\n📋 Component Details:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}s)` : '';
    log(`   ${status} ${result.name}${duration}`);
    
    if (!result.success && result.error) {
      log(`      Error: ${result.error}`, colors.red);
    }
  });
  
  return passedTests === totalTests;
};

// Main execution function
const runTests = async (options = {}) => {
  const { 
    backend = true, 
    frontend = true, 
    coverage = false, 
    install = false,
    parallel = false 
  } = options;
  
  logHeader('VAPORFORM COMPREHENSIVE TEST SUITE');
  logInfo(`Test Configuration:`);
  logInfo(`  Backend: ${backend ? 'Enabled' : 'Disabled'}`);
  logInfo(`  Frontend: ${frontend ? 'Enabled' : 'Disabled'}`);
  logInfo(`  Coverage: ${coverage ? 'Enabled' : 'Disabled'}`);
  logInfo(`  Auto-install: ${install ? 'Enabled' : 'Disabled'}`);
  logInfo(`  Parallel: ${parallel ? 'Enabled' : 'Disabled'}`);
  
  const components = [];
  if (backend) components.push('backend');
  if (frontend) components.push('frontend');
  
  if (components.length === 0) {
    logWarning('No components selected for testing');
    return true;
  }
  
  const results = [];
  const testOptions = { coverage };
  
  try {
    // Install dependencies if requested
    if (install) {
      logSection('Installing Dependencies');
      for (const component of components) {
        await installDependencies(component);
      }
    }
    
    // Run tests
    if (parallel && components.length > 1) {
      logSection('Running Tests in Parallel');
      const promises = components.map(component => 
        runComponentTests(component, testOptions)
      );
      const parallelResults = await Promise.allSettled(promises);
      
      parallelResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            component: components[index],
            name: config[components[index]].name,
            error: 'Promise rejected',
            details: result.reason
          });
        }
      });
    } else {
      logSection('Running Tests Sequentially');
      for (const component of components) {
        try {
          const result = await runComponentTests(component, testOptions);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            component,
            name: config[component].name,
            error: 'Test execution failed',
            details: error
          });
        }
      }
    }
    
    // Generate summary
    const allPassed = generateSummary(results);
    
    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
  }
};

// CLI argument parsing
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    backend: true,
    frontend: true,
    coverage: false,
    install: false,
    parallel: false,
    help: false
  };
  
  args.forEach(arg => {
    switch (arg) {
      case '--backend-only':
        options.frontend = false;
        break;
      case '--frontend-only':
        options.backend = false;
        break;
      case '--coverage':
        options.coverage = true;
        break;
      case '--install':
        options.install = true;
        break;
      case '--parallel':
        options.parallel = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  });
  
  return options;
};

// Help text
const showHelp = () => {
  logHeader('VAPORFORM TEST RUNNER - HELP');
  
  log('\nUsage: node test-runner.js [options]\n');
  
  log('Options:');
  log('  --backend-only    Run only backend tests');
  log('  --frontend-only   Run only frontend tests');
  log('  --coverage        Generate coverage reports');
  log('  --install         Install dependencies before testing');
  log('  --parallel        Run tests in parallel (when possible)');
  log('  --help, -h        Show this help message\n');
  
  log('Examples:');
  log('  node test-runner.js                    # Run all tests');
  log('  node test-runner.js --coverage         # Run all tests with coverage');
  log('  node test-runner.js --backend-only     # Run only backend tests');
  log('  node test-runner.js --install          # Install deps and run tests');
  log('  node test-runner.js --parallel         # Run tests in parallel\n');
  
  log('Exit Codes:');
  log('  0 - All tests passed');
  log('  1 - One or more tests failed\n');
};

// Main entry point
if (require.main === module) {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  runTests(options).catch(error => {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  runComponentTests,
  generateSummary,
  config
};