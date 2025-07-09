-- StratCap Database Initialization Script
-- This script creates the initial database schema for the StratCap platform

-- Create database if not exists (for development)
-- CREATE DATABASE stratcap;

-- Connect to the stratcap database
\c stratcap;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema
CREATE SCHEMA IF NOT EXISTS stratcap;
SET search_path TO stratcap, public;

-- ============================================================================
-- USERS AND AUTHENTICATION
-- ============================================================================

-- Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    tenant_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- User roles
CREATE TABLE user_roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User role assignments
CREATE TABLE user_role_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    role_id UUID REFERENCES user_roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(user_id),
    UNIQUE(user_id, role_id)
);

-- ============================================================================
-- FUNDS
-- ============================================================================

-- Funds table
CREATE TABLE funds (
    fund_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_name VARCHAR(255) NOT NULL,
    fund_type VARCHAR(50) NOT NULL CHECK (fund_type IN ('private_equity', 'hedge_fund', 'venture_capital', 'real_estate')),
    fund_size DECIMAL(20,2),
    target_size DECIMAL(20,2),
    base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    inception_date DATE NOT NULL,
    target_close_date DATE,
    final_close_date DATE,
    fund_status VARCHAR(20) NOT NULL DEFAULT 'fundraising' CHECK (fund_status IN ('fundraising', 'active', 'closed', 'liquidated')),
    management_fee_rate DECIMAL(5,4) DEFAULT 0.02,
    carried_interest_rate DECIMAL(5,4) DEFAULT 0.20,
    hurdle_rate DECIMAL(5,4) DEFAULT 0.08,
    catch_up_provision BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Fund terms and agreements
CREATE TABLE fund_terms (
    term_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID REFERENCES funds(fund_id) ON DELETE CASCADE,
    term_type VARCHAR(50) NOT NULL,
    term_name VARCHAR(255) NOT NULL,
    term_value JSONB NOT NULL,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INVESTORS
-- ============================================================================

-- Investors table
CREATE TABLE investors (
    investor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_name VARCHAR(255) NOT NULL,
    investor_type VARCHAR(50) NOT NULL CHECK (investor_type IN ('individual', 'institutional', 'fund_of_funds')),
    tax_id VARCHAR(50),
    jurisdiction VARCHAR(100),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address JSONB,
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    kyc_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Investor banking details
CREATE TABLE investor_banking (
    banking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID REFERENCES investors(investor_id) ON DELETE CASCADE,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    routing_number VARCHAR(50),
    swift_code VARCHAR(20),
    iban VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COMMITMENTS
-- ============================================================================

-- Investor commitments to funds
CREATE TABLE commitments (
    commitment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID REFERENCES funds(fund_id) ON DELETE CASCADE,
    investor_id UUID REFERENCES investors(investor_id) ON DELETE CASCADE,
    commitment_amount DECIMAL(20,2) NOT NULL CHECK (commitment_amount > 0),
    commitment_date DATE NOT NULL,
    commitment_type VARCHAR(50) NOT NULL DEFAULT 'initial' CHECK (commitment_type IN ('initial', 'additional', 'transfer')),
    side_letter_terms JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'transferred')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(fund_id, investor_id, commitment_date)
);

-- Commitment modifications and transfers
CREATE TABLE commitment_modifications (
    modification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commitment_id UUID REFERENCES commitments(commitment_id) ON DELETE CASCADE,
    modification_type VARCHAR(50) NOT NULL CHECK (modification_type IN ('increase', 'decrease', 'transfer')),
    old_amount DECIMAL(20,2),
    new_amount DECIMAL(20,2),
    effective_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CAPITAL CALLS
-- ============================================================================

-- Capital calls issued to investors
CREATE TABLE capital_calls (
    call_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID REFERENCES funds(fund_id) ON DELETE CASCADE,
    call_number INTEGER NOT NULL,
    call_date DATE NOT NULL,
    due_date DATE NOT NULL,
    call_purpose TEXT NOT NULL,
    total_call_amount DECIMAL(20,2) NOT NULL CHECK (total_call_amount > 0),
    call_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (call_status IN ('draft', 'issued', 'settled', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(fund_id, call_number)
);

-- Individual investor capital call notices
CREATE TABLE capital_call_notices (
    notice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID REFERENCES capital_calls(call_id) ON DELETE CASCADE,
    commitment_id UUID REFERENCES commitments(commitment_id) ON DELETE CASCADE,
    call_amount DECIMAL(20,2) NOT NULL CHECK (call_amount > 0),
    percentage_called DECIMAL(5,4) NOT NULL,
    management_fee_portion DECIMAL(20,2) DEFAULT 0,
    investment_portion DECIMAL(20,2) DEFAULT 0,
    expenses_portion DECIMAL(20,2) DEFAULT 0,
    notice_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (notice_status IN ('pending', 'paid', 'overdue', 'defaulted')),
    payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DISTRIBUTIONS
-- ============================================================================

-- Fund distributions
CREATE TABLE distributions (
    distribution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID REFERENCES funds(fund_id) ON DELETE CASCADE,
    distribution_number INTEGER NOT NULL,
    distribution_date DATE NOT NULL,
    record_date DATE NOT NULL,
    distribution_type VARCHAR(50) NOT NULL CHECK (distribution_type IN ('income', 'capital', 'return_of_capital')),
    total_distribution_amount DECIMAL(20,2) NOT NULL CHECK (total_distribution_amount > 0),
    distribution_status VARCHAR(20) NOT NULL DEFAULT 'declared' CHECK (distribution_status IN ('declared', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(fund_id, distribution_number)
);

-- Individual investor distributions
CREATE TABLE distribution_notices (
    notice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distribution_id UUID REFERENCES distributions(distribution_id) ON DELETE CASCADE,
    commitment_id UUID REFERENCES commitments(commitment_id) ON DELETE CASCADE,
    gross_distribution DECIMAL(20,2) NOT NULL,
    management_fee_offset DECIMAL(20,2) DEFAULT 0,
    carried_interest DECIMAL(20,2) DEFAULT 0,
    net_distribution DECIMAL(20,2) NOT NULL,
    tax_withholding DECIMAL(20,2) DEFAULT 0,
    notice_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (notice_status IN ('pending', 'paid', 'cancelled')),
    payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AUDIT TRAIL
-- ============================================================================

-- Comprehensive audit trail
CREATE TABLE audit_trail (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'view')),
    user_id UUID REFERENCES users(user_id),
    user_role VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    field_changes JSONB,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    correlation_id UUID,
    data_classification VARCHAR(50) DEFAULT 'internal',
    retention_period INTEGER DEFAULT 2555 -- 7 years in days
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- Funds indexes
CREATE INDEX idx_funds_status ON funds(fund_status);
CREATE INDEX idx_funds_type ON funds(fund_type);
CREATE INDEX idx_funds_inception_date ON funds(inception_date);

-- Investors indexes
CREATE INDEX idx_investors_type ON investors(investor_type);
CREATE INDEX idx_investors_kyc_status ON investors(kyc_status);
CREATE INDEX idx_investors_name ON investors(investor_name);

-- Commitments indexes
CREATE INDEX idx_commitments_fund_investor ON commitments(fund_id, investor_id);
CREATE INDEX idx_commitments_status ON commitments(status);
CREATE INDEX idx_commitments_date ON commitments(commitment_date);

-- Capital calls indexes
CREATE INDEX idx_capital_calls_fund_status ON capital_calls(fund_id, call_status);
CREATE INDEX idx_capital_calls_date ON capital_calls(call_date);
CREATE INDEX idx_capital_call_notices_commitment ON capital_call_notices(commitment_id);
CREATE INDEX idx_capital_call_notices_status ON capital_call_notices(notice_status);

-- Distributions indexes
CREATE INDEX idx_distributions_fund_status ON distributions(fund_id, distribution_status);
CREATE INDEX idx_distributions_date ON distributions(distribution_date);
CREATE INDEX idx_distribution_notices_commitment ON distribution_notices(commitment_id);
CREATE INDEX idx_distribution_notices_status ON distribution_notices(notice_status);

-- Audit trail indexes
CREATE INDEX idx_audit_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_trail(user_id, timestamp);
CREATE INDEX idx_audit_timestamp ON audit_trail(timestamp);
CREATE INDEX idx_audit_correlation ON audit_trail(correlation_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funds_updated_at BEFORE UPDATE ON funds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investors_updated_at BEFORE UPDATE ON investors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commitments_updated_at BEFORE UPDATE ON commitments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_capital_calls_updated_at BEFORE UPDATE ON capital_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_distributions_updated_at BEFORE UPDATE ON distributions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default roles
INSERT INTO user_roles (role_name, description, permissions) VALUES
('admin', 'System Administrator', '["*"]'),
('fund_cfo', 'Fund CFO', '["fund:read", "fund:write", "fund:approve", "investor:read", "investor:write", "investor:pii", "capital_call:create", "capital_call:approve", "distribution:create", "distribution:approve", "report:generate", "report:custom", "report:export"]'),
('fund_manager', 'Fund Manager', '["fund:read", "fund:write", "investor:read", "investor:write", "capital_call:create", "distribution:create", "report:generate", "report:custom"]'),
('accountant', 'Accountant', '["fund:read", "investor:read", "capital_call:create", "distribution:create", "report:generate", "report:export"]'),
('analyst', 'Analyst', '["fund:read", "investor:read", "report:generate"]');

-- Create default admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, is_active, is_verified) VALUES
('admin@stratcap.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewwjIvSHZ5QJK3s6', 'System Administrator', TRUE, TRUE);

-- Assign admin role to default user
INSERT INTO user_role_assignments (user_id, role_id) 
SELECT u.user_id, r.role_id 
FROM users u, user_roles r 
WHERE u.email = 'admin@stratcap.com' AND r.role_name = 'admin';

-- Grant privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA stratcap TO stratcap;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA stratcap TO stratcap;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA stratcap TO stratcap;