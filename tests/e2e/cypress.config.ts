import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    // Test files
    specPattern: 'tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    excludeSpecPattern: ['**/node_modules/**'],
    
    // Support file
    supportFile: 'tests/e2e/support/e2e.ts',
    
    // Fixtures
    fixturesFolder: 'tests/e2e/fixtures',
    
    // Screenshots and videos
    screenshotsFolder: 'tests/e2e/screenshots',
    videosFolder: 'tests/e2e/videos',
    
    // Environment variables
    env: {
      apiUrl: 'http://localhost:8000/api',
      coverage: false,
      codeCoverage: {
        url: 'http://localhost:8000/__coverage__',
      },
    },
    
    setupNodeEvents(on, config) {
      // Task definitions
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        
        // Database seeding and cleanup
        'db:seed'() {
          return require('./support/database').seedTestData();
        },
        
        'db:clean'() {
          return require('./support/database').cleanTestData();
        },
        
        // File operations
        'readFile'(filePath: string) {
          return require('fs').readFileSync(filePath, 'utf8');
        },
        
        // Email testing
        'getLastEmail'() {
          return require('./support/email').getLastEmail();
        },
        
        clearEmails() {
          return require('./support/email').clearEmails();
        }
      });
      
      // Code coverage
      if (config.env.coverage) {
        require('@cypress/code-coverage/task')(on, config);
      }
      
      return config;
    },
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    indexHtmlFile: 'tests/e2e/support/component-index.html'
  },
});