import dotenv from 'dotenv';
import path from 'path';
import { secretsManager } from './secrets';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Initialize secrets manager
let secretsInitialized = false;
const initializeSecrets = async () => {
  if (!secretsInitialized) {
    await secretsManager.initialize();
    secretsInitialized = true;
  }
};

// Lazy load secrets
const getSecureConfig = () => {
  if (!secretsInitialized) {
    throw new Error('Secrets not initialized. Call initializeSecrets() first.');
  }
  
  const secrets = secretsManager.getSecret.bind(secretsManager);
  
  return {
    jwt: {
      secret: secrets('jwt.secret'),
      refreshSecret: secrets('jwt.refreshSecret')
    },
    session: {
      secret: secrets('session.secret')
    },
    database: {
      password: secrets('database.password')
    },
    email: {
      smtpPassword: secrets('email.smtpPassword')
    }
  };
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'stratcap_db',
    user: process.env.DB_USER || 'stratcap_user',
    get password() {
      try {
        return getSecureConfig().database.password;
      } catch {
        return process.env.DB_PASSWORD || '';
      }
    },
  },
  
  jwt: {
    get secret() {
      try {
        return getSecureConfig().jwt.secret;
      } catch {
        return process.env.JWT_SECRET || 'development-secret-key';
      }
    },
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    get refreshSecret() {
      try {
        return getSecureConfig().jwt.refreshSecret;
      } catch {
        return process.env.JWT_REFRESH_SECRET || 'development-refresh-secret';
      }
    },
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  session: {
    get secret() {
      try {
        return getSecureConfig().session.secret;
      } catch {
        return process.env.SESSION_SECRET || 'development-session-secret';
      }
    },
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        get pass() {
          try {
            return getSecureConfig().email.smtpPassword;
          } catch {
            return process.env.SMTP_PASS || '';
          }
        },
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@stratcap.com',
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs',
  },
  
  mfa: {
    appName: process.env.MFA_APP_NAME || 'StratCap',
  },
};

export { initializeSecrets };
export default config;