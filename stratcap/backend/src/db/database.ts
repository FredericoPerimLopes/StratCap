import { Sequelize } from 'sequelize';
import { config } from '../config/config';
import { databaseEncryptionConfig } from '../utils/encryption';

// Models will be imported after sequelize instance is created

// Merge encryption config with base config
const databaseConfig = {
  dialect: 'postgres' as const,
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  logging: config.env === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '25'),
    min: parseInt(process.env.DB_POOL_MIN || '5'),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000'),
    idle: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
  },
  // SSL/TLS configuration for encrypted connections
  ...(config.env === 'production' && {
    dialectOptions: databaseEncryptionConfig.dialectOptions,
  }),
  // Query timeout - removed as incompatible with Sequelize Options type
  // Retry configuration
  retry: {
    max: 3,
  },
};

const sequelize = new Sequelize(databaseConfig);

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Import and initialize all models
    console.log('🔧 Registering database models...');
    const models = await import('../models');
    console.log(`✅ ${Object.keys(models.default).length} models registered successfully`);
    
    if (config.env === 'development') {
      // CRITICAL: Drop all tables first to eliminate UUID schema corruption
      console.log('🗑️  Dropping all existing tables to clear UUID corruption...');
      await sequelize.drop({ cascade: true });
      
      // Force recreation of tables with fresh INTEGER schema
      console.log('🔄 Syncing database schema with INTEGER models...');
      await sequelize.sync({ force: true, alter: false });
      console.log(`✅ Database synchronized: ${Object.keys(sequelize.models).length} tables created`);
      
      // Log created tables for verification
      const tableNames = Object.keys(sequelize.models);
      console.log(`📊 Created tables: ${tableNames.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    console.error('Full error:', error);
    process.exit(1);
  }
};

export default sequelize;