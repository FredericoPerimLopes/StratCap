import crypto from 'crypto';
import { FieldEncryption } from '../config/secrets';
import { Model, DataTypes } from 'sequelize';

/**
 * Database Field-Level Encryption Utilities
 * 
 * Provides transparent encryption/decryption for sensitive database fields
 */

export interface EncryptedField {
  type: typeof DataTypes.TEXT;
  get(): string | null;
  set(value: string | null): void;
}

/**
 * Create an encrypted field definition for Sequelize models
 */
export function encryptedField(fieldName: string): EncryptedField {
  return {
    type: DataTypes.TEXT,
    get(this: Model): string | null {
      const encrypted = this.getDataValue(fieldName);
      if (!encrypted) return null;
      
      try {
        return FieldEncryption.decrypt(encrypted);
      } catch (error) {
        console.error(`Failed to decrypt ${fieldName}:`, error);
        return null;
      }
    },
    set(this: Model, value: string | null): void {
      if (!value) {
        this.setDataValue(fieldName, null);
        return;
      }
      
      try {
        const encrypted = FieldEncryption.encrypt(value);
        this.setDataValue(fieldName, encrypted);
      } catch (error) {
        console.error(`Failed to encrypt ${fieldName}:`, error);
        throw new Error('Encryption failed');
      }
    }
  };
}

/**
 * Encrypt multiple fields in a data object
 */
export function encryptFields<T extends Record<string, any>>(
  data: T,
  fields: string[]
): T {
  const encrypted = { ...data };
  
  for (const field of fields) {
    if (field in encrypted && encrypted[field]) {
      (encrypted as any)[field] = FieldEncryption.encrypt(encrypted[field]);
    }
  }
  
  return encrypted;
}

/**
 * Decrypt multiple fields in a data object
 */
export function decryptFields<T extends Record<string, any>>(
  data: T,
  fields: string[]
): T {
  const decrypted = { ...data };
  
  for (const field of fields) {
    if (field in decrypted && decrypted[field]) {
      try {
        (decrypted as any)[field] = FieldEncryption.decrypt(decrypted[field]);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        (decrypted as any)[field] = null;
      }
    }
  }
  
  return decrypted;
}

/**
 * Hash sensitive data for searching (one-way)
 */
export function hashForSearch(value: string): string {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

/**
 * Create a searchable encrypted field (stores both encrypted and hashed values)
 */
export interface SearchableEncryptedField {
  encrypted: EncryptedField;
  hash: {
    type: typeof DataTypes.STRING;
    allowNull: boolean;
  };
}

export function searchableEncryptedField(fieldName: string): SearchableEncryptedField {
  return {
    encrypted: encryptedField(fieldName),
    hash: {
      type: DataTypes.STRING(64) as any,
      allowNull: true
    }
  };
}

/**
 * Middleware to automatically encrypt/decrypt model fields
 */
export function encryptionMiddleware(model: any, encryptedFields: string[]) {
  // Before create
  model.beforeCreate(async (instance: any) => {
    for (const field of encryptedFields) {
      if (instance[field]) {
        instance[field] = FieldEncryption.encrypt(instance[field]);
      }
    }
  });

  // Before update
  model.beforeUpdate(async (instance: any) => {
    for (const field of encryptedFields) {
      if (instance.changed(field) && instance[field]) {
        instance[field] = FieldEncryption.encrypt(instance[field]);
      }
    }
  });

  // After find
  model.afterFind(async (result: any) => {
    if (!result) return;

    const decrypt = (instance: any) => {
      for (const field of encryptedFields) {
        if (instance.dataValues && instance.dataValues[field]) {
          try {
            instance.dataValues[field] = FieldEncryption.decrypt(instance.dataValues[field]);
          } catch (error) {
            console.error(`Failed to decrypt ${field}:`, error);
            instance.dataValues[field] = null;
          }
        }
      }
    };

    if (Array.isArray(result)) {
      result.forEach(decrypt);
    } else {
      decrypt(result);
    }
  });
}

/**
 * Database encryption configuration for PostgreSQL
 */
export const databaseEncryptionConfig = {
  // Enable SSL/TLS for connections
  ssl: {
    require: true,
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  },
  
  // Connection encryption
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  },
  
  // Additional security options
  pool: {
    max: 25,
    min: 5,
    acquire: 60000,
    idle: 30000
  }
};

/**
 * Audit log encryption for sensitive operations
 */
export function encryptAuditLog(data: any): string {
  const auditData = {
    ...data,
    timestamp: new Date().toISOString(),
    hash: crypto.randomBytes(16).toString('hex')
  };
  
  return FieldEncryption.encrypt(JSON.stringify(auditData));
}

/**
 * Backup encryption utilities
 */
export class BackupEncryption {
  private static algorithm = 'aes-256-gcm';
  private static key = process.env.BACKUP_ENCRYPTION_KEY 
    ? Buffer.from(process.env.BACKUP_ENCRYPTION_KEY, 'hex')
    : crypto.randomBytes(32);

  static encryptBackup(data: Buffer): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);
    
    const authTag = (cipher as any).getAuthTag();
    
    return Buffer.concat([iv, authTag, encrypted]);
  }

  static decryptBackup(encrypted: Buffer): Buffer {
    const iv = encrypted.slice(0, 16);
    const authTag = encrypted.slice(16, 32);
    const data = encrypted.slice(32);
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    (decipher as any).setAuthTag(authTag);
    
    return Buffer.concat([
      decipher.update(data),
      decipher.final()
    ]);
  }
}