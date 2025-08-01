import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Secure Secrets Management System
 * 
 * This module provides secure handling of sensitive configuration values
 * with encryption, validation, and rotation capabilities.
 */

interface SecretConfig {
  value: string;
  encrypted?: boolean;
  rotationInterval?: number; // days
  lastRotated?: Date;
  validator?: (value: string) => boolean;
}

interface SecretsStore {
  jwt: {
    secret: SecretConfig;
    refreshSecret: SecretConfig;
  };
  session: {
    secret: SecretConfig;
  };
  database: {
    password: SecretConfig;
  };
  email: {
    smtpPassword: SecretConfig;
  };
  encryption: {
    masterKey: SecretConfig;
  };
}

class SecretsManager {
  private static instance: SecretsManager;
  private secrets: Map<string, SecretConfig> = new Map();
  private encryptionKey: Buffer;
  private algorithm = 'aes-256-gcm';
  private initialized = false;

  private constructor() {
    // Generate or load master encryption key
    this.encryptionKey = this.getMasterKey();
  }

  public static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  /**
   * Initialize secrets from environment or secure storage
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    // In production, these would come from:
    // - AWS Secrets Manager
    // - HashiCorp Vault
    // - Azure Key Vault
    // - Environment variables with KMS encryption

    // JWT Secrets
    this.registerSecret('jwt.secret', {
      value: this.getSecureValue('JWT_SECRET', () => this.generateSecureToken(64)),
      rotationInterval: 90, // rotate every 90 days
      validator: (v) => v.length >= 32
    });

    this.registerSecret('jwt.refreshSecret', {
      value: this.getSecureValue('JWT_REFRESH_SECRET', () => this.generateSecureToken(64)),
      rotationInterval: 180,
      validator: (v) => v.length >= 32
    });

    // Session Secret
    this.registerSecret('session.secret', {
      value: this.getSecureValue('SESSION_SECRET', () => this.generateSecureToken(32)),
      rotationInterval: 365,
      validator: (v) => v.length >= 32
    });

    // Database Password
    this.registerSecret('database.password', {
      value: this.getSecureValue('DB_PASSWORD', () => {
        throw new Error('Database password must be provided via environment variable');
      }),
      encrypted: true,
      validator: (v) => v.length >= 12
    });

    // Email SMTP Password
    this.registerSecret('email.smtpPassword', {
      value: this.getSecureValue('SMTP_PASS', () => ''),
      encrypted: true,
      validator: (_v) => true // optional
    });

    // Master Encryption Key for field-level encryption
    this.registerSecret('encryption.masterKey', {
      value: this.getSecureValue('FIELD_ENCRYPTION_KEY', () => this.generateSecureToken(32)),
      rotationInterval: 180,
      validator: (v) => v.length === 64 // 32 bytes hex
    });

    this.initialized = true;
    this.validateAllSecrets();
  }

  /**
   * Get a secret value
   */
  public getSecret(key: string): string {
    const secret = this.secrets.get(key);
    if (!secret) {
      throw new Error(`Secret not found: ${key}`);
    }

    // Check if rotation is needed
    if (this.needsRotation(secret)) {
      console.warn(`Secret ${key} needs rotation`);
    }

    return secret.encrypted ? this.decrypt(secret.value) : secret.value;
  }

  /**
   * Register a new secret
   */
  private registerSecret(key: string, config: SecretConfig): void {
    // Validate the secret value
    if (config.validator && !config.validator(config.value)) {
      throw new Error(`Invalid secret value for ${key}`);
    }

    // Encrypt if needed
    if (config.encrypted) {
      config.value = this.encrypt(config.value);
    }

    config.lastRotated = new Date();
    this.secrets.set(key, config);
  }

  /**
   * Get secure value from environment or generate
   */
  private getSecureValue(envKey: string, generator: () => string): string {
    const envValue = process.env[envKey];
    
    if (envValue && envValue !== 'your-secret-key' && 
        envValue !== 'your-refresh-secret' && 
        envValue !== 'your-session-secret') {
      return envValue;
    }

    if (process.env.NODE_ENV === 'production') {
      // In production, we must have proper secrets
      throw new Error(`Production secret not configured: ${envKey}`);
    }

    // In development, generate secure defaults
    console.warn(`Generating development secret for ${envKey}`);
    return generator();
  }

  /**
   * Generate cryptographically secure token
   */
  private generateSecureToken(bytes: number): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Get or generate master encryption key
   */
  private getMasterKey(): Buffer {
    const keyPath = path.join(__dirname, '../../../.master.key');
    
    if (process.env.MASTER_ENCRYPTION_KEY) {
      return Buffer.from(process.env.MASTER_ENCRYPTION_KEY, 'hex');
    }

    if (fs.existsSync(keyPath)) {
      return Buffer.from(fs.readFileSync(keyPath, 'utf8'), 'hex');
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Master encryption key not found in production');
    }

    // Generate new key for development
    const key = crypto.randomBytes(32);
    fs.writeFileSync(keyPath, key.toString('hex'), { mode: 0o600 });
    console.warn('Generated new master encryption key for development');
    return key;
  }

  /**
   * Encrypt a value
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = (cipher as any).getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt a value
   */
  private decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    (decipher as any).setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Check if secret needs rotation
   */
  private needsRotation(secret: SecretConfig): boolean {
    if (!secret.rotationInterval || !secret.lastRotated) {
      return false;
    }

    const daysSinceRotation = Math.floor(
      (Date.now() - secret.lastRotated.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceRotation >= secret.rotationInterval;
  }

  /**
   * Validate all secrets
   */
  private validateAllSecrets(): void {
    const errors: string[] = [];

    this.secrets.forEach((secret, key) => {
      if (secret.validator) {
        const value = secret.encrypted ? this.decrypt(secret.value) : secret.value;
        if (!secret.validator(value)) {
          errors.push(`Invalid secret: ${key}`);
        }
      }
    });

    if (errors.length > 0) {
      throw new Error(`Secret validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Rotate a specific secret
   */
  public async rotateSecret(key: string, newValue: string): Promise<void> {
    const secret = this.secrets.get(key);
    if (!secret) {
      throw new Error(`Secret not found: ${key}`);
    }

    // Validate new value
    if (secret.validator && !secret.validator(newValue)) {
      throw new Error(`Invalid secret value for ${key}`);
    }

    // Update secret
    secret.value = secret.encrypted ? this.encrypt(newValue) : newValue;
    secret.lastRotated = new Date();

    // In production, this would also:
    // 1. Update external secret store
    // 2. Trigger graceful application restart
    // 3. Notify monitoring systems
    console.log(`Secret rotated: ${key}`);
  }

  /**
   * Get secrets health status
   */
  public getHealthStatus(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];

    this.secrets.forEach((secret, key) => {
      if (this.needsRotation(secret)) {
        issues.push(`Secret ${key} needs rotation`);
      }
    });

    return {
      healthy: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
export const secretsManager = SecretsManager.getInstance();

// Helper function to get secrets in config
export const getSecrets = () => {
  const sm = secretsManager;
  
  return {
    jwt: {
      secret: sm.getSecret('jwt.secret'),
      refreshSecret: sm.getSecret('jwt.refreshSecret')
    },
    session: {
      secret: sm.getSecret('session.secret')
    },
    database: {
      password: sm.getSecret('database.password')
    },
    email: {
      smtpPassword: sm.getSecret('email.smtpPassword')
    },
    encryption: {
      masterKey: sm.getSecret('encryption.masterKey')
    }
  };
};

// Field-level encryption utilities
export class FieldEncryption {
  private static key: Buffer;
  private static algorithm = 'aes-256-gcm';

  private static getKey(): Buffer {
    if (!this.key) {
      const keyHex = secretsManager.getSecret('encryption.masterKey');
      this.key = Buffer.from(keyHex, 'hex');
    }
    return this.key;
  }

  public static encrypt(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.getKey(), iv);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = (cipher as any).getAuthTag();
    
    return `enc:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  public static decrypt(encryptedValue: string): string {
    if (!encryptedValue.startsWith('enc:')) {
      return encryptedValue; // Not encrypted
    }

    const parts = encryptedValue.substring(4).split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.getKey(), iv);
    (decipher as any).setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  public static isEncrypted(value: string): boolean {
    return value.startsWith('enc:');
  }
}

// Export types
export type { SecretConfig, SecretsStore };