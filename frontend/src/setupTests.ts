import '@testing-library/jest-dom';

// Mock Monaco Editor
Object.defineProperty(window, 'MonacoEnvironment', {
  value: {
    getWorkerUrl: () => '',
  },
});

// Mock WebSocket
const MockWebSocket = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  send: jest.fn(),
  CLOSED: 3,
  CLOSING: 2,
  CONNECTING: 0,
  OPEN: 1,
}));

MockWebSocket.CLOSED = 3;
MockWebSocket.CLOSING = 2;
MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;

global.WebSocket = MockWebSocket as any;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress console warnings in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});