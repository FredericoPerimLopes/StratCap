-- StratCap Database Initialization Script
-- This script sets up the initial database schema and seed data

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS public;

-- Set search path
SET search_path TO public;

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'investor', 'viewer');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE fund_status AS ENUM ('active', 'closed', 'liquidating', 'fully_realized');
CREATE TYPE transaction_type AS ENUM ('capital_call', 'distribution', 'fee', 'expense', 'other');
CREATE TYPE fee_type AS ENUM ('management', 'carried_interest', 'organizational', 'other');
CREATE TYPE allocation_method AS ENUM ('commitment', 'nav', 'custom');

-- Grant permissions to stratcap user
GRANT ALL PRIVILEGES ON SCHEMA public TO stratcap;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stratcap;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stratcap;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO stratcap;

-- Create initial indexes for performance
-- Note: Additional indexes will be created by Sequelize models

-- Insert default system configuration
-- This will be populated after tables are created by Sequelize

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function to calculate carried interest
CREATE OR REPLACE FUNCTION calculate_carried_interest(
    p_fund_id INTEGER,
    p_distribution_amount DECIMAL(20,4)
) RETURNS DECIMAL(20,4) AS $$
DECLARE
    v_carried_interest_rate DECIMAL(5,4);
    v_hurdle_rate DECIMAL(5,4);
    v_total_contributions DECIMAL(20,4);
    v_total_distributions DECIMAL(20,4);
    v_net_return DECIMAL(20,4);
    v_hurdle_amount DECIMAL(20,4);
    v_carried_interest DECIMAL(20,4);
BEGIN
    -- Get fund parameters
    SELECT 
        COALESCE(carried_interest_rate, 0.20),
        COALESCE(hurdle_rate, 0.08)
    INTO v_carried_interest_rate, v_hurdle_rate
    FROM funds
    WHERE id = p_fund_id;
    
    -- Calculate totals
    SELECT 
        COALESCE(SUM(amount), 0)
    INTO v_total_contributions
    FROM transactions
    WHERE fund_id = p_fund_id
    AND type = 'capital_call';
    
    SELECT 
        COALESCE(SUM(amount), 0)
    INTO v_total_distributions
    FROM transactions
    WHERE fund_id = p_fund_id
    AND type = 'distribution';
    
    -- Calculate net return
    v_net_return := (v_total_distributions + p_distribution_amount) - v_total_contributions;
    
    -- Calculate hurdle amount
    v_hurdle_amount := v_total_contributions * v_hurdle_rate;
    
    -- Calculate carried interest
    IF v_net_return > v_hurdle_amount THEN
        v_carried_interest := (v_net_return - v_hurdle_amount) * v_carried_interest_rate;
    ELSE
        v_carried_interest := 0;
    END IF;
    
    RETURN v_carried_interest;
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate management fees
CREATE OR REPLACE FUNCTION calculate_management_fee(
    p_fund_id INTEGER,
    p_period_start DATE,
    p_period_end DATE
) RETURNS DECIMAL(20,4) AS $$
DECLARE
    v_management_fee_rate DECIMAL(5,4);
    v_commitment_amount DECIMAL(20,4);
    v_days_in_period INTEGER;
    v_annual_fee DECIMAL(20,4);
    v_period_fee DECIMAL(20,4);
BEGIN
    -- Get fund management fee rate
    SELECT 
        COALESCE(management_fee_rate, 0.02)
    INTO v_management_fee_rate
    FROM funds
    WHERE id = p_fund_id;
    
    -- Get total commitments
    SELECT 
        COALESCE(SUM(amount), 0)
    INTO v_commitment_amount
    FROM commitments
    WHERE fund_id = p_fund_id
    AND status = 'active';
    
    -- Calculate days in period
    v_days_in_period := p_period_end - p_period_start + 1;
    
    -- Calculate annual fee
    v_annual_fee := v_commitment_amount * v_management_fee_rate;
    
    -- Calculate period fee (pro-rated)
    v_period_fee := v_annual_fee * (v_days_in_period::DECIMAL / 365);
    
    RETURN v_period_fee;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for investor balances (will be created after tables exist)
-- This will be handled by the application after Sequelize creates the tables

-- Add comments for documentation
COMMENT ON SCHEMA public IS 'StratCap Fund Management Platform Database Schema';
COMMENT ON FUNCTION calculate_carried_interest IS 'Calculates carried interest for a distribution based on fund parameters and performance';
COMMENT ON FUNCTION calculate_management_fee IS 'Calculates management fee for a given period based on fund parameters and commitments';

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'StratCap database initialization completed successfully';
END $$;