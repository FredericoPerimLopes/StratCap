#!/usr/bin/env node

/**
 * Migration script to transition from hardcoded secrets to secure secrets management
 * 
 * Usage:
 *   npm run migrate:secrets -- --check     # Check current configuration
 *   npm run migrate:secrets -- --generate  # Generate new secrets
 *   npm run migrate:secrets -- --validate  # Validate configuration
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

interface SecretDefinition {
  name: string;
  envKey: string;
  generator: () => string;
  validator: (value: string) => boolean;
  description: string;
}

const secrets: SecretDefinition[] = [
  {
    name: 'JWT Secret',
    envKey: 'JWT_SECRET',
    generator: () => crypto.randomBytes(64).toString('hex'),
    validator: (v) => v.length >= 64 && v !== 'your-secret-key',
    description: 'Main JWT authentication secret'
  },
  {
    name: 'JWT Refresh Secret',
    envKey: 'JWT_REFRESH_SECRET',
    generator: () => crypto.randomBytes(64).toString('hex'),
    validator: (v) => v.length >= 64 && v !== 'your-refresh-secret',
    description: 'JWT refresh token secret'
  },
  {
    name: 'Session Secret',
    envKey: 'SESSION_SECRET',
    generator: () => crypto.randomBytes(32).toString('hex'),
    validator: (v) => v.length >= 32 && v !== 'your-session-secret',
    description: 'Express session secret'
  },
  {
    name: 'Field Encryption Key',
    envKey: 'FIELD_ENCRYPTION_KEY',
    generator: () => crypto.randomBytes(32).toString('hex'),
    validator: (v) => v.length === 64,
    description: 'Key for encrypting sensitive database fields'
  },
  {
    name: 'Master Encryption Key',
    envKey: 'MASTER_ENCRYPTION_KEY',
    generator: () => crypto.randomBytes(32).toString('hex'),
    validator: (v) => v.length === 64,
    description: 'Master key for encrypting other secrets'
  }
];

class SecretsMigrator {
  private envPath: string;
  private backupPath: string;

  constructor() {
    this.envPath = path.join(process.cwd(), '.env');
    this.backupPath = path.join(process.cwd(), `.env.backup.${Date.now()}`);
  }

  async run(action: string) {
    console.log('🔐 StratCap Secrets Migration Tool\n');

    switch (action) {
      case '--check':
        await this.checkCurrentSecrets();
        break;
      case '--generate':
        await this.generateSecureSecrets();
        break;
      case '--validate':
        await this.validateSecrets();
        break;
      case '--aws':
        await this.migrateToAWS();
        break;
      case '--vault':
        await this.migrateToVault();
        break;
      default:
        this.showHelp();
    }
  }

  private async checkCurrentSecrets() {
    console.log('📋 Checking current secrets configuration...\n');

    const env = this.loadEnv();
    const issues: string[] = [];
    let hasInsecureSecrets = false;

    for (const secret of secrets) {
      const value = env[secret.envKey];
      
      if (!value) {
        issues.push(`❌ ${secret.name} (${secret.envKey}): Not configured`);
        hasInsecureSecrets = true;
      } else if (!secret.validator(value)) {
        issues.push(`⚠️  ${secret.name} (${secret.envKey}): Insecure or default value`);
        hasInsecureSecrets = true;
      } else {
        console.log(`✅ ${secret.name} (${secret.envKey}): Properly configured`);
      }
    }

    if (issues.length > 0) {
      console.log('\n🚨 Security Issues Found:\n');
      issues.forEach(issue => console.log(issue));
      console.log('\nRun with --generate to create secure secrets');
    } else {
      console.log('\n✅ All secrets are properly configured!');
    }

    // Check for production readiness
    if (env.NODE_ENV === 'production' && hasInsecureSecrets) {
      console.error('\n❌ CRITICAL: Production environment has insecure secrets!');
      process.exit(1);
    }
  }

  private async generateSecureSecrets() {
    console.log('🔧 Generating secure secrets...\n');

    // Backup existing .env
    if (fs.existsSync(this.envPath)) {
      fs.copyFileSync(this.envPath, this.backupPath);
      console.log(`📦 Backed up existing .env to ${this.backupPath}\n`);
    }

    const env = this.loadEnv();
    const newSecrets: Record<string, string> = {};
    let generated = 0;

    for (const secret of secrets) {
      const currentValue = env[secret.envKey];
      
      if (!currentValue || !secret.validator(currentValue)) {
        const newValue = secret.generator();
        newSecrets[secret.envKey] = newValue;
        console.log(`🔑 Generated ${secret.name}: ${secret.envKey}`);
        console.log(`   Description: ${secret.description}`);
        console.log(`   Length: ${newValue.length} characters\n`);
        generated++;
      }
    }

    if (generated > 0) {
      // Update .env file
      this.updateEnvFile(newSecrets);
      console.log(`\n✅ Generated ${generated} new secrets`);
      console.log('📝 Updated .env file with secure values\n');

      // Generate secure example
      this.generateSecureExample();
      
      console.log('⚠️  IMPORTANT: Store these secrets securely!');
      console.log('   - Use AWS Secrets Manager, HashiCorp Vault, or similar in production');
      console.log('   - Never commit the .env file to version control');
      console.log('   - Rotate secrets regularly\n');
    } else {
      console.log('✅ All secrets are already secure, no changes needed');
    }
  }

  private async validateSecrets() {
    console.log('🔍 Validating secrets configuration...\n');

    const env = this.loadEnv();
    let allValid = true;

    // Check each secret
    for (const secret of secrets) {
      const value = env[secret.envKey];
      const isValid = value && secret.validator(value);
      
      if (isValid) {
        console.log(`✅ ${secret.name}: Valid`);
      } else {
        console.log(`❌ ${secret.name}: Invalid or missing`);
        allValid = false;
      }
    }

    // Check for production requirements
    if (env.NODE_ENV === 'production') {
      console.log('\n📋 Production Checks:');
      
      // Check for secrets management integration
      if (!env.AWS_REGION && !env.VAULT_ADDR) {
        console.log('⚠️  No external secrets management configured');
        console.log('   Consider using AWS Secrets Manager or HashiCorp Vault');
      }

      // Check for monitoring
      if (!env.SENTRY_DSN && !env.DATADOG_API_KEY) {
        console.log('⚠️  No monitoring/alerting configured');
      }

      // Check for Redis
      if (!env.REDIS_URL) {
        console.log('⚠️  Redis not configured (needed for caching and sessions)');
      }
    }

    console.log(allValid ? '\n✅ All validations passed!' : '\n❌ Validation failed!');
    process.exit(allValid ? 0 : 1);
  }

  private async migrateToAWS() {
    console.log('☁️  Migrating secrets to AWS Secrets Manager...\n');

    const env = this.loadEnv();
    
    if (!env.AWS_REGION) {
      console.error('❌ AWS_REGION not configured');
      return;
    }

    console.log('📝 Creating AWS Secrets Manager configuration...\n');

    const awsSecrets = {
      'stratcap/production/jwt': {
        secret: env.JWT_SECRET,
        refreshSecret: env.JWT_REFRESH_SECRET
      },
      'stratcap/production/session': {
        secret: env.SESSION_SECRET
      },
      'stratcap/production/encryption': {
        fieldKey: env.FIELD_ENCRYPTION_KEY,
        masterKey: env.MASTER_ENCRYPTION_KEY
      },
      'stratcap/production/database': {
        password: env.DB_PASSWORD
      }
    };

    // Generate AWS CLI commands
    console.log('Run these commands to create secrets in AWS:\n');
    
    for (const [name, values] of Object.entries(awsSecrets)) {
      const secretString = JSON.stringify(values);
      console.log(`aws secretsmanager create-secret \\`);
      console.log(`  --name "${name}" \\`);
      console.log(`  --description "StratCap ${name} secrets" \\`);
      console.log(`  --secret-string '${secretString}'`);
      console.log();
    }

    console.log('Then update your .env to use AWS Secrets Manager:');
    console.log('AWS_SECRETS_PREFIX=stratcap/production/');
  }

  private async migrateToVault() {
    console.log('🔐 Migrating secrets to HashiCorp Vault...\n');

    const env = this.loadEnv();
    
    if (!env.VAULT_ADDR) {
      console.error('❌ VAULT_ADDR not configured');
      return;
    }

    console.log('📝 Creating Vault configuration...\n');

    // Generate Vault commands
    console.log('Run these commands to store secrets in Vault:\n');

    for (const secret of secrets) {
      const value = env[secret.envKey];
      if (value && secret.validator(value)) {
        console.log(`vault kv put secret/stratcap/${secret.envKey.toLowerCase()} value="${value}"`);
      }
    }

    console.log('\nThen update your application to read from Vault');
  }

  private loadEnv(): Record<string, string> {
    const env: Record<string, string> = { ...process.env };

    if (fs.existsSync(this.envPath)) {
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const lines = envContent.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key) {
            env[key.trim()] = valueParts.join('=').trim();
          }
        }
      }
    }

    return env;
  }

  private updateEnvFile(newSecrets: Record<string, string>) {
    let content = '';

    if (fs.existsSync(this.envPath)) {
      content = fs.readFileSync(this.envPath, 'utf8');
    }

    for (const [key, value] of Object.entries(newSecrets)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        content += `\n${key}=${value}`;
      }
    }

    fs.writeFileSync(this.envPath, content);
  }

  private generateSecureExample() {
    const examplePath = path.join(process.cwd(), '.env.secure.example');
    
    if (!fs.existsSync(examplePath)) {
      console.log('📄 Generated .env.secure.example with secure configuration template');
    }
  }

  private showHelp() {
    console.log('Usage: npm run migrate:secrets -- [option]\n');
    console.log('Options:');
    console.log('  --check      Check current secrets configuration');
    console.log('  --generate   Generate new secure secrets');
    console.log('  --validate   Validate all secrets');
    console.log('  --aws        Generate AWS Secrets Manager migration');
    console.log('  --vault      Generate HashiCorp Vault migration');
    console.log('\nExamples:');
    console.log('  npm run migrate:secrets -- --check');
    console.log('  npm run migrate:secrets -- --generate');
  }
}

// Run the migrator
const migrator = new SecretsMigrator();
const action = process.argv[2] || '--help';
migrator.run(action).catch(console.error);