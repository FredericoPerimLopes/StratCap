import { config } from '../src/config/config';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'stratcap_test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock external services in test environment
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-id' })),
  })),
}));

// Global test setup
beforeAll(async () => {
  // Setup test database
  const { sequelize } = require('../src/models');
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Cleanup test database
  const { sequelize } = require('../src/models');
  await sequelize.close();
});

afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();
});