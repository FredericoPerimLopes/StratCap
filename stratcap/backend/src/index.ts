import app from './app';
import { config, initializeSecrets } from './config/config';
import { connectDatabase } from './db/database';
import logger from './utils/logger';

const startServer = async () => {
  try {
    // Initialize secure secrets management
    logger.info('Initializing secrets management...');
    await initializeSecrets();
    logger.info('Secrets management initialized successfully');

    // Connect to database
    await connectDatabase();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.error('UNHANDLED REJECTION! Shutting down...');
      logger.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      logger.info('SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated!');
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();// Model fix applied at Mon Aug 11 01:49:08 -03 2025
