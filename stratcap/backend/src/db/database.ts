import { Sequelize } from 'sequelize';
import { config } from '../config/config';
import { databaseEncryptionConfig } from '../utils/encryption';

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
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    if (config.env === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export default sequelize;