# Backend Schema Audit Report - StratCap

## Overview
This document provides a comprehensive audit of the StratCap backend database schema, API endpoints, and validation rules. The system uses **Sequelize ORM** with **PostgreSQL** as the database, **TypeScript** for type safety, and **Joi** for request validation.

## Database Configuration
- **ORM**: Sequelize v6.37.7
- **Database**: PostgreSQL
- **Language**: TypeScript
- **Validation**: Joi v17.12.2
- **Encryption**: Database-level encryption configured for production
- **Connection Pool**: Max 25, Min 5 connections

## Database Models (42 Total)

### 1. Core Entity Models

#### **User** (`Users` table)
- **Primary Key**: `id` (INTEGER, auto-increment)
- **Fields**:
  - `email` (STRING, unique, email validation)
  - `password` (STRING, bcrypt hashed)
  - `firstName` (STRING, required)
  - `lastName` (STRING, required)
  - `role` (ENUM: 'admin', 'manager', 'analyst', 'viewer', default: 'viewer')
  - `isActive` (BOOLEAN, default: true)
  - `mfaSecret` (STRING, nullable)
  - `mfaEnabled` (BOOLEAN, default: false)
  - `mfaBackupCodes` (TEXT, nullable)
  - `lastLogin` (DATE, nullable)
  - `passwordResetToken` (STRING, nullable)
  - `passwordResetExpires` (DATE, nullable)
  - `passwordChangedAt` (DATE, nullable)
- **Relationships**: Many-to-Many with FundFamily (through UserFundFamilies)
- **Hooks**: Password hashing on create/update
- **Methods**: `validatePassword()`, `fullName` getter

#### **FundFamily** (`FundFamilies` table)
- **Primary Key**: `id` (INTEGER, auto-increment)
- **Fields**:
  - `name` (STRING, required)
  - `code` (STRING, unique, required)
  - `description` (TEXT, nullable)
  - `managementCompany` (STRING, required)
  - `primaryCurrency` (STRING(3), default: 'USD')
  - `fiscalYearEnd` (STRING(5), MM-DD format, default: '12-31')
  - `status` (ENUM: 'active', 'inactive', 'archived', default: 'active')
  - `settings` (JSONB, default: {})
- **Relationships**: 
  - Has Many Funds
  - Many-to-Many with Users
- **Validation**: Currency code (3 chars), fiscal year format

#### **Fund** (`Funds` table)
- **Primary Key**: `id` (INTEGER, auto-increment)
- **Foreign Keys**: `fundFamilyId` → FundFamilies.id
- **Fields**:
  - `name` (STRING, required)
  - `code` (STRING, required)
  - `type` (ENUM: 'master', 'feeder', 'parallel', 'subsidiary')
  - `vintage` (INTEGER, required)
  - `targetSize` (DECIMAL(20,2), required, string getters)
  - `hardCap` (DECIMAL(20,2), nullable, string getters)
  - `managementFeeRate` (DECIMAL(5,4), required, string getters)
  - `carriedInterestRate` (DECIMAL(5,4), required, string getters)
  - `preferredReturnRate` (DECIMAL(5,4), required, string getters)
  - `investmentPeriodEnd` (DATE, nullable)
  - `termEnd` (DATE, nullable)
  - `extensionPeriods` (INTEGER, default: 0)
  - `extensionLength` (INTEGER, default: 12 months)
  - `currency` (STRING(3), default: 'USD')
  - `status` (ENUM: 'fundraising', 'investing', 'harvesting', 'closed')
  - `settings` (JSONB, default: {})
- **Indexes**: Unique on (fundFamilyId, code)
- **Relationships**: 
  - Belongs to FundFamily
  - Has Many Commitments, Investments, CapitalActivities, InvestorClasses
- **Decimal Getters**: Custom getters for Decimal.js integration

#### **InvestorEntity** (`InvestorEntities` table)
- **Primary Key**: `id` (INTEGER, auto-increment)
- **Fields**:
  - `name` (STRING, required)
  - `legalName` (STRING, required)
  - `type` (ENUM: 'individual', 'institution', 'fund', 'trust', 'other')
  - `entityType` (STRING, nullable) - More specific type
  - `taxId` (STRING, nullable)
  - `registrationNumber` (STRING, nullable)
  - `domicile` (STRING(2), country code, required)
  - `taxResidence` (STRING(2), nullable)
  - `accreditedInvestor` (BOOLEAN, default: false)
  - `qualifiedPurchaser` (BOOLEAN, default: false)
  - Address fields: `address`, `city`, `state`, `postalCode`, `country`
  - Contact fields: `primaryContact`, `primaryEmail` (with email validation), `primaryPhone`
  - `kycStatus` (ENUM: 'pending', 'approved', 'rejected', 'expired', default: 'pending')
  - `kycDate` (DATE, nullable)
  - `amlStatus` (ENUM: 'pending', 'approved', 'rejected', 'expired', default: 'pending')
  - `amlDate` (DATE, nullable)
  - `notes` (TEXT, nullable)
  - `metadata` (JSONB, default: {})
- **Indexes**: On name, tax_id
- **Relationships**: Has Many Commitments

### 2. Financial Models

#### **Commitment** (`Commitments` table)
- **Primary Key**: `id` (INTEGER, auto-increment)
- **Foreign Keys**: 
  - `fundId` → Funds.id
  - `investorEntityId` → InvestorEntities.id
  - `investorClassId` → InvestorClasses.id
  - `closingId` → Closings.id (nullable)
- **Fields**:
  - `commitmentAmount` (DECIMAL(20,2), required, string getter)
  - `commitmentDate` (DATE, required)
  - `status` (ENUM: 'pending', 'active', 'suspended', 'terminated', default: 'active')
  - `sideLetterTerms` (JSONB, nullable)
  - `feeOverrides` (JSONB, nullable)
  - Financial tracking fields (all DECIMAL(20,2) with string getters):
    - `capitalCalled` (default: 0)
    - `capitalReturned` (default: 0)
    - `unfundedCommitment` (default: 0)
    - `preferredReturn` (default: 0)
    - `carriedInterest` (default: 0)
  - `lastUpdated` (DATE, nullable)
  - `notes` (TEXT, nullable)
  - `metadata` (JSONB, default: {})
- **Indexes**: On fund_id, investor_entity_id, investor_class_id, status
- **Relationships**: 
  - Belongs to Fund, InvestorEntity, InvestorClass, Closing
  - Has Many Transactions

#### **CapitalActivity** (`CapitalActivities` table)
- **Primary Key**: `id` (INTEGER, auto-increment)
- **Foreign Keys**: 
  - `fundId` → Funds.id
  - `approvedBy` → Users.id (nullable)
- **Fields**:
  - `eventType` (ENUM: 'capital_call', 'distribution', 'equalization', 'reallocation')
  - `eventNumber` (STRING, required)
  - `eventDate` (DATE, required)
  - `dueDate` (DATE, nullable)
  - `description` (STRING, required)
  - `status` (ENUM: 'draft', 'pending', 'approved', 'completed', 'cancelled', default: 'draft')
  - Amount fields (all DECIMAL(20,2) with string getters):
    - `totalAmount` (required)
    - `baseAmount` (nullable)
    - `feeAmount` (nullable)
    - `expenseAmount` (nullable)
  - `currency` (STRING(3), default: 'USD')
  - `purpose` (TEXT, nullable)
  - `notices` (JSONB, nullable)
  - `calculations` (JSONB, nullable)
  - Approval tracking:
    - `approvedAt` (DATE, nullable)
    - `completedAt` (DATE, nullable)
  - `notes` (TEXT, nullable)
  - `metadata` (JSONB, default: {})
- **Indexes**: On fund_id, event_type, status, unique(fund_id, event_number)
- **Relationships**: 
  - Belongs to Fund, User (approver)
  - Has Many Transactions, CapitalAllocations, DistributionAllocations

#### **Transaction** (`Transactions` table)
- **Primary Key**: `id` (INTEGER, auto-increment)
- **Foreign Keys**: 
  - `fundId` → Funds.id
  - `commitmentId` → Commitments.id
  - `capitalActivityId` → CapitalActivities.id (nullable)
  - `reversalOfId` → Transactions.id (nullable, self-reference)
- **Fields**:
  - `transactionDate` (DATE, required)
  - `effectiveDate` (DATE, required)
  - `transactionType` (ENUM: 'capital_call', 'distribution', 'fee', 'expense', 'equalization', 'transfer', 'adjustment')
  - `transactionCode` (STRING, required)
  - `description` (STRING, required)
  - Amount fields (DECIMAL with string getters):
    - `amount` (DECIMAL(20,2), required)
    - `baseAmount` (DECIMAL(20,2), nullable)
    - `exchangeRate` (DECIMAL(10,6), nullable)
  - `currency` (STRING(3), default: 'USD')
  - `direction` (ENUM: 'debit', 'credit')
  - Classification fields:
    - `category` (STRING, nullable)
    - `subCategory` (STRING, nullable)
    - `glAccountCode` (STRING, nullable)
  - Reversal tracking:
    - `isReversed` (BOOLEAN, default: false)
  - Batch processing:
    - `batchId` (STRING, nullable)
    - `referenceNumber` (STRING, nullable)
  - `notes` (TEXT, nullable)
  - `metadata` (JSONB, default: {})
- **Indexes**: On fund_id, commitment_id, capital_activity_id, transaction_date, transaction_type, batch_id
- **Relationships**: 
  - Belongs to Fund, Commitment, CapitalActivity
  - Self-reference for reversals

#### **FeeCalculation** (`FeeCalculations` table)
- **Primary Key**: `id` (INTEGER, auto-increment)
- **Foreign Keys**: `fundId` → Funds.id
- **Fields**:
  - Period definition:
    - `periodStartDate` (DATE, required)
    - `periodEndDate` (DATE, required)
    - `calculationDate` (DATE, required, default: NOW)
  - Fee classification:
    - `feeType` (ENUM: 'management', 'carried_interest', 'other')
    - `basis` (ENUM: 'nav', 'commitments', 'invested_capital', 'distributions')
  - Calculation fields (all DECIMAL with string getters and Decimal.js integration):
    - `basisAmount` (DECIMAL(20,2), required)
    - `feeRate` (DECIMAL(5,4), required)
    - `grossFeeAmount` (DECIMAL(20,2), required)
    - `netFeeAmount` (DECIMAL(20,2), required) - After offsets/waivers
  - Processing status:
    - `status` (ENUM: 'calculated', 'posted', 'paid', 'reversed', default: 'calculated')
    - `isAccrual` (BOOLEAN, default: false)
  - `description` (TEXT, nullable)
  - `calculationMethod` (STRING, nullable)
  - `metadata` (JSONB, default: {})
- **Indexes**: Composite on (fund_id, period_start_date, period_end_date, fee_type), calculation_date, status
- **Relationships**: 
  - Belongs to Fund
  - Has Many FeeCharges, FeeOffsets, FeeWaivers
- **Decimal Getters**: Custom methods for Decimal.js integration

### 3. Supporting Models

#### **InvestorClass** (Referenced but not detailed)
- Manages investor class definitions and terms

#### **Closing** (Referenced but not detailed)
- Tracks fund closing events

#### **Investment** (Referenced but not detailed)
- Portfolio investment tracking

#### **DistributionEvent**, **DistributionAllocation** (Referenced)
- Distribution processing and allocation

#### **WaterfallCalculation**, **WaterfallTier** (Referenced)
- Waterfall distribution calculations

#### **Document** (Referenced)
- Document management and storage

#### **AuditLog**, **SystemConfiguration** (Referenced)
- System auditing and configuration

## API Validation Schemas (Joi)

### Authentication Schemas
- `register`: email, password (min 8), firstName, lastName, role (optional)
- `login`: email, password
- `changePassword`: currentPassword, newPassword (min 8)
- `resetPassword`: token, password (min 8)

### Fund Management Schemas
- `createFundFamily`: name, code, managementCompany (required), currency (3 chars), fiscalYearEnd (MM-DD format)
- `createFund`: fundFamilyId, name, code, type (enum), vintage (1900-2100), financial rates, dates, settings
- `updateFund`: Partial update schema with same validations

### Investor Management Schemas
- `createInvestor`: name, legalName, type (enum), domicile (2 chars), accreditation flags, contact info
- `updateInvestor`: Partial update schema
- `updateKycStatus`, `updateAmlStatus`: Status enums with dates

### Financial Schemas
- `createCommitment`: fundId, investorEntityId, investorClassId, commitmentAmount, commitmentDate
- `createCapitalActivity`: fundId, eventType (enum), eventNumber, eventDate, amounts, currency
- `updateCommitment`, `updateStatus`: Partial updates with validation

### Waterfall Calculation Schemas
- `waterfallCalculation`: fundId, distributionAmount (decimal pattern), distributionDate, calculationType, customTiers
- `hypotheticalScenarios`: fundId, array of scenarios (1-10 items)
- `preferredReturnCalculation`: capitalBase, annualRate, daysSinceContribution, amounts
- `carriedInterestCalculation`: distributionAmount, rates, returns, contributions

### Common Schemas
- `id`: Positive integer validation
- `pagination`: page, limit (1-100), sort, order (asc/desc)

## Foreign Key Relationships

### Primary Entity Relationships
```
FundFamily (1) ←→ (M) Fund
Fund (1) ←→ (M) Commitment
Fund (1) ←→ (M) CapitalActivity
Fund (1) ←→ (M) Transaction
Fund (1) ←→ (M) FeeCalculation
Fund (1) ←→ (M) InvestorClass

InvestorEntity (1) ←→ (M) Commitment
InvestorClass (1) ←→ (M) Commitment

Commitment (1) ←→ (M) Transaction
CapitalActivity (1) ←→ (M) Transaction (optional)

FeeCalculation (1) ←→ (M) FeeCharge
FeeCalculation (1) ←→ (M) FeeOffset
FeeCalculation (1) ←→ (M) FeeWaiver

User (M) ←→ (M) FundFamily (through UserFundFamilies)
```

### Lookup Fields & References
- **Currency Fields**: Always 3-character codes (USD default)
- **Country Fields**: 2-character codes (domicile, taxResidence)
- **Status Enums**: Consistent across models (pending, active, etc.)
- **Date Fields**: Proper DATE types with nullable options
- **JSON Fields**: JSONB for PostgreSQL optimization (settings, metadata, calculations)

## Validation Rules & Constraints

### Field-Level Validations
1. **Email Fields**: Built-in Sequelize email validation + Joi email validation
2. **Decimal Fields**: Proper precision (20,2) for money, (5,4) for rates, (10,6) for exchange rates
3. **Enum Validations**: Strict enum types prevent invalid values
4. **String Length**: Appropriate limits (currency: 3, country: 2, etc.)
5. **Date Validations**: Proper date types, ISO format in Joi
6. **Decimal Pattern Matching**: Joi regex patterns for decimal values

### Database-Level Constraints
1. **Primary Keys**: Auto-increment integers
2. **Foreign Key Constraints**: Proper references with CASCADE options
3. **Unique Constraints**: Email uniqueness, fund family codes, composite keys
4. **Index Optimization**: Strategic indexes on foreign keys and query fields
5. **Default Values**: Sensible defaults for status fields, currencies, booleans

### Business Logic Validations
1. **Password Security**: bcrypt hashing with salt rounds
2. **MFA Integration**: TOTP secret management
3. **Audit Trails**: Automatic timestamping (createdAt, updatedAt)
4. **Decimal Precision**: Consistent handling of financial amounts
5. **Status Workflows**: Proper state transitions in enums

## Security Features

### Authentication & Authorization
- **JWT-based authentication**
- **Role-based access control** (admin, manager, analyst, viewer)
- **Multi-factor authentication** support
- **Password reset tokens** with expiration
- **Session management** with secure tokens

### Data Protection
- **Database encryption** for production
- **Password hashing** with bcrypt
- **Sensitive data handling** (PII, financial data)
- **Audit logging** for compliance
- **Rate limiting** on API endpoints

### API Security
- **Input validation** on all endpoints
- **SQL injection prevention** through ORM
- **XSS protection** through input sanitization
- **CORS configuration** for frontend integration

## Recommendations

### Schema Improvements
1. **Add composite indexes** for complex queries (fund_id + transaction_date)
2. **Implement soft deletes** for critical entities
3. **Add data archival strategy** for historical data
4. **Consider partitioning** for transaction tables
5. **Implement database versioning** for schema migrations

### Validation Enhancements
1. **Add cross-field validations** (start date < end date)
2. **Implement business rule validations** (commitment limits)
3. **Add data consistency checks** (sum validations)
4. **Enhance error messaging** for better UX
5. **Add field-level encryption** for sensitive data

### Performance Optimizations
1. **Query optimization** with proper indexing
2. **Connection pooling** configuration
3. **Caching strategies** for reference data
4. **Pagination** for large datasets
5. **Async processing** for bulk operations

## Summary

The StratCap backend implements a comprehensive schema for private equity fund management with:
- **42 total models** covering all business entities
- **Sequelize ORM** with TypeScript for type safety
- **PostgreSQL** with encryption and connection pooling
- **Joi validation** for all API endpoints
- **Proper foreign key relationships** and indexing
- **Security features** including authentication, authorization, and data protection
- **Financial precision** with Decimal.js integration
- **Audit trails** and compliance features

The schema is well-designed for private equity operations with proper data modeling, validation, and security controls in place.