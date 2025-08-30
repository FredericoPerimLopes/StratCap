import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';
// import { setupServer } from 'msw/node';

// Configure testing library
configure({ 
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true,
});

// Setup MSW server for API mocking
// export const server = setupServer();

beforeAll(() => {
  // server.listen({ onUnhandledRequest: 'warn' });
  
  // Mock console methods for cleaner test output
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
       args[0].includes('Warning: React.createFactory() is deprecated'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterEach(() => {
  // server.resetHandlers();
  jest.clearAllMocks();
});

afterAll(() => {
  // server.close();
});

// Global test utilities
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock scrollTo and other window methods
window.scrollTo = jest.fn();
window.scroll = jest.fn();
window.scrollBy = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;
  rootMargin: string = '0px';
  thresholds: ReadonlyArray<number> = [0];

  constructor() {}

  disconnect() {
    return null;
  }

  observe() {
    return null;
  }

  unobserve() {
    return null;
  }

  takeRecords() {
    return [];
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}

  disconnect() {
    return null;
  }

  observe() {
    return null;
  }

  unobserve() {
    return null;
  }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.sessionStorage = sessionStorageMock;