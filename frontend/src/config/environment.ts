/**
 * Environment configuration for browser compatibility
 * This file safely handles environment variables without relying on process.env
 */

// Detect environment based on URL or build settings
const detectLocalhost = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' || 
           window.location.hostname.includes('192.168.');
  }
  return false;
};

const detectDevelopment = (): boolean => {
  // Check if we're in development mode
  if (typeof window !== 'undefined') {
    return detectLocalhost() || window.location.port === '3001' || window.location.port === '3000';
  }
  return false;
};

const detectProduction = (): boolean => {
  return !detectDevelopment();
};

// Environment flags
export const isDevelopment = detectDevelopment();
export const isProduction = detectProduction();
export const isLocalhost = detectLocalhost();

// API Configuration
export const API_BASE_URL = (() => {
  if (isLocalhost) {
    return 'http://192.168.1.235:4000';
  }
  return 'https://api.vaporform.com';
})();

// WebSocket Configuration
export const WS_URL = (() => {
  if (isLocalhost) {
    return 'ws://192.168.1.235:4000';
  }
  return 'wss://api.vaporform.com';
})();

// Alternative API for specific services (maintaining existing behavior)
export const API_BASE_ALT = (() => {
  if (isProduction) {
    return '';
  }
  return 'http://192.168.1.235:4000';
})();

// Timeouts and retry configuration
export const TIMEOUT = 30000; // 30 seconds
export const RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000; // 1 second

// Environment configuration object
export const ENV_CONFIG = {
  // Environment detection
  isDevelopment,
  isProduction,
  isLocalhost,
  
  // API Configuration
  API_BASE_URL,
  WS_URL,
  API_BASE_ALT,
  
  // Timeouts and retry configuration
  TIMEOUT,
  RETRY_ATTEMPTS,
  RETRY_DELAY,
} as const;

// Safe environment variable access (for any remaining process.env usage)
export const getEnvVar = (key: string, defaultValue: string = ''): string => {
  try {
    // Try to access process.env if available (webpack should polyfill this)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (error) {
    console.warn(`Unable to access environment variable ${key}, using default:`, defaultValue);
  }
  return defaultValue;
};

export default ENV_CONFIG;