module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/setupTests.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/coverage/**/*',
    '!src/**/*.mock.{js,jsx,ts,tsx}',
  ],
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
    'cobertura'
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/components/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/utils/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1'
  },
  moduleFileExtensions: [
    'web.js',
    'js',
    'web.ts',
    'ts',
    'web.tsx',
    'tsx',
    'json',
    'web.jsx',
    'jsx'
  ],
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|mjs|cjs|ts|tsx)$',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  resetMocks: true,
  clearMocks: true,
  restoreMocks: true,
  verbose: true,
  testTimeout: 10000,
  maxWorkers: '50%',
  
  // Test organization
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.unit.(test|spec).{js,jsx,ts,tsx}']
    },
    {
      displayName: 'integration', 
      testMatch: ['<rootDir>/src/**/*.integration.(test|spec).{js,jsx,ts,tsx}']
    },
    {
      displayName: 'security',
      testMatch: ['<rootDir>/src/**/*.security.(test|spec).{js,jsx,ts,tsx}']
    }
  ],
  
  // Performance monitoring
  slowTestThreshold: 5,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'report.html',
        expand: true,
        hideIcon: false,
      }
    ]
  ],
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/', 
    '<rootDir>/build/',
    '<rootDir>/dist/'
  ],
  
  // Additional Jest configuration
  bail: false,
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest'
};