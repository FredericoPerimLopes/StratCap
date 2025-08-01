# StratCap Security Guide

## Overview

This guide covers security best practices and implementation details for the StratCap platform, focusing on secrets management, data encryption, and compliance requirements.

## Table of Contents

1. [Secrets Management](#secrets-management)
2. [Data Encryption](#data-encryption)
3. [Authentication & Authorization](#authentication--authorization)
4. [Security Checklist](#security-checklist)
5. [Compliance](#compliance)

## Secrets Management

### Overview

StratCap uses a comprehensive secrets management system to protect sensitive configuration values. The system provides:

- **Automatic secret generation** for development environments
- **Encryption at rest** for sensitive values
- **Secret rotation** tracking and enforcement
- **Integration** with external secrets management services
- **Validation** and health monitoring

### Quick Start

1. **Check current secrets configuration:**
   ```bash
   npm run secrets:check
   ```

2. **Generate secure secrets (development only):**
   ```bash
   npm run secrets:generate
   ```

3. **Validate production configuration:**
   ```bash
   NODE_ENV=production npm run migrate:secrets -- --validate
   ```

### Configuration

All secrets are managed through environment variables. See `.env.secure.example` for a complete template.

**Critical secrets that must be configured:**

- `JWT_SECRET` - Main authentication secret (64+ characters)
- `JWT_REFRESH_SECRET` - Refresh token secret (64+ characters)
- `SESSION_SECRET` - Express session secret (32+ characters)
- `FIELD_ENCRYPTION_KEY` - Database field encryption (32 bytes hex)
- `MASTER_ENCRYPTION_KEY` - Master key for secrets encryption (32 bytes hex)

### Production Deployment

In production, secrets should be managed through external services:

#### AWS Secrets Manager

1. **Store secrets in AWS:**
   ```bash
   npm run migrate:secrets -- --aws
   ```

2. **Configure AWS integration:**
   ```env
   AWS_REGION=us-east-1
   AWS_SECRETS_PREFIX=stratcap/production/
   ```

3. **Update application to fetch from AWS:**
   ```typescript
   // Automatically handled by secrets manager
   ```

#### HashiCorp Vault

1. **Store secrets in Vault:**
   ```bash
   npm run migrate:secrets -- --vault
   ```

2. **Configure Vault integration:**
   ```env
   VAULT_ADDR=https://vault.your-domain.com
   VAULT_TOKEN=<your-token>
   VAULT_PATH=secret/data/stratcap
   ```

### Secret Rotation

The system tracks secret age and alerts when rotation is needed:

- **JWT secrets**: Rotate every 90 days
- **Session secrets**: Rotate every 365 days
- **Encryption keys**: Rotate every 180 days
- **Database passwords**: Rotate every 60 days

Check rotation status:
```bash
curl http://localhost:5000/health/secrets
```

## Data Encryption

### Field-Level Encryption

Sensitive data fields are encrypted before storage:

```typescript
import { FieldEncryption } from './config/secrets';

// Encrypt sensitive data
const encrypted = FieldEncryption.encrypt(sensitiveValue);

// Decrypt when needed
const decrypted = FieldEncryption.decrypt(encrypted);
```

**Fields that should be encrypted:**

- Bank account numbers
- Tax identification numbers
- Personal identification documents
- API keys and tokens
- Sensitive investor information

### Database Encryption at Rest

PostgreSQL configuration for encryption at rest:

1. **Enable Transparent Data Encryption (TDE)**
2. **Encrypt backup files**
3. **Use encrypted connections (SSL/TLS)**

### Transit Encryption

All data in transit is encrypted:

- **HTTPS only** in production
- **TLS 1.2+** for all connections
- **Certificate pinning** for mobile apps
- **Encrypted database connections**

## Authentication & Authorization

### Multi-Factor Authentication (MFA)

MFA is implemented using TOTP (Time-based One-Time Password):

- **QR code generation** for authenticator apps
- **Backup codes** for recovery
- **Device trust** management
- **Session tracking** per device

### Password Security

- **bcrypt hashing** with salt rounds (10)
- **Minimum requirements**: 8+ characters
- **Breach detection** integration recommended
- **Password history** to prevent reuse

### JWT Token Security

- **Short-lived access tokens** (7 days default)
- **Refresh token rotation**
- **Token blacklisting** on logout
- **Secure storage** in httpOnly cookies

### Role-Based Access Control (RBAC)

Four default roles with hierarchical permissions:

1. **Admin**: Full system access
2. **Manager**: Fund management operations
3. **Analyst**: Read and analysis operations
4. **Viewer**: Read-only access

## Security Checklist

### Development Environment

- [ ] Run `npm run secrets:check` to verify configuration
- [ ] Use `.env.secure.example` as template
- [ ] Never commit `.env` files
- [ ] Use secure secret generation

### Production Deployment

- [ ] Configure external secrets management (AWS/Vault)
- [ ] Enable database encryption at rest
- [ ] Configure HTTPS with proper certificates
- [ ] Set up monitoring and alerting
- [ ] Enable audit logging
- [ ] Configure WAF (Web Application Firewall)
- [ ] Implement DDoS protection
- [ ] Set up intrusion detection
- [ ] Configure backup encryption
- [ ] Enable security headers (CSP, HSTS, etc.)

### Ongoing Security

- [ ] Regular secret rotation
- [ ] Security patch updates
- [ ] Penetration testing
- [ ] Security audit reviews
- [ ] Incident response plan
- [ ] Data breach procedures

## Compliance

### SOX Compliance

- **Audit trails** for all financial operations
- **Segregation of duties** enforcement
- **Change management** controls
- **Access controls** and monitoring

### GDPR Compliance

- **Data encryption** for PII
- **Right to be forgotten** implementation
- **Data portability** exports
- **Consent management** tracking

### Security Standards

Working towards compliance with:

- **ISO 27001** - Information security management
- **SOC 2 Type II** - Security controls audit
- **PCI DSS** - If handling payment data
- **NIST Cybersecurity Framework**

## Security Incident Response

### Incident Classification

1. **Critical**: Data breach, system compromise
2. **High**: Failed authentication attempts, suspicious activity
3. **Medium**: Configuration issues, failed validations
4. **Low**: Informational alerts

### Response Procedures

1. **Detect** - Monitoring and alerting
2. **Assess** - Determine severity and scope
3. **Contain** - Limit damage and prevent spread
4. **Eradicate** - Remove threat
5. **Recover** - Restore normal operations
6. **Review** - Post-incident analysis

### Contact Information

- **Security Team**: security@stratcap.com
- **24/7 Hotline**: +1-XXX-XXX-XXXX
- **Bug Bounty**: https://stratcap.com/security/bug-bounty

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls](https://www.cisecurity.org/controls)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)

## Version History

- **v1.0.0** - Initial security implementation
- **v1.1.0** - Added field-level encryption
- **v1.2.0** - External secrets management support

---

For security concerns or questions, please contact the security team.