import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    videoCompression: 32,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    downloadsFolder: 'cypress/downloads',
    fixturesFolder: 'cypress/fixtures',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Test execution settings
    watchForFileChanges: false,
    chromeWebSecurity: false,
    
    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Environment variables
    env: {
      API_URL: 'http://localhost:3001/api',
      coverage: true,
      codeCoverage: {
        url: 'http://localhost:3001/__coverage__'
      }
    },
    
    setupNodeEvents(on, config) {
      // Code coverage plugin
      require('@cypress/code-coverage/task')(on, config);
      
      // Accessibility plugin
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        }
      });
      
      // Performance testing
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome' && browser.isHeadless) {
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-dev-shm-usage');
        }
        
        return launchOptions;
      });
      
      // Database seeding
      on('task', {
        async 'db:seed'() {
          // Seed test database
          const { exec } = require('child_process');
          return new Promise((resolve, reject) => {
            exec('npm run seed:test', (error, stdout, stderr) => {
              if (error) {
                console.error('Database seeding failed:', error);
                reject(error);
              } else {
                console.log('Database seeded successfully');
                resolve(stdout);
              }
            });
          });
        },
        
        async 'db:clean'() {
          // Clean test database
          const { exec } = require('child_process');
          return new Promise((resolve, reject) => {
            exec('npm run clean:test', (error, stdout, stderr) => {
              if (error) {
                console.error('Database cleaning failed:', error);
                reject(error);
              } else {
                console.log('Database cleaned successfully');
                resolve(stdout);
              }
            });
          });
        }
      });
      
      // File operations
      on('task', {
        readFileMaybe(filename) {
          const fs = require('fs');
          try {
            return fs.readFileSync(filename, 'utf8');
          } catch (e) {
            return null;
          }
        }
      });
      
      // Performance metrics
      on('task', {
        performanceMetrics() {
          // Collect performance metrics
          return {
            timestamp: new Date().toISOString(),
            memory: process.memoryUsage(),
            uptime: process.uptime()
          };
        }
      });
      
      return config;
    }
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    supportFile: 'cypress/support/component.ts',
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    indexHtmlFile: 'cypress/support/component-index.html'
  },
  
  // Global configuration
  includeShadowDom: true,
  numTestsKeptInMemory: 10,
  
  // Reporter configuration
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'cypress/reporter-config.json'
  },
  
  // Browser configuration
  browsers: [
    {
      name: 'chrome',
      family: 'chromium',
      channel: 'stable',
      displayName: 'Chrome',
      version: 'detect',
      path: 'detect',
      majorVersion: 'detect'
    },
    {
      name: 'firefox',
      family: 'firefox',
      channel: 'stable',
      displayName: 'Firefox',
      version: 'detect',
      path: 'detect',
      majorVersion: 'detect'
    }
  ]
});