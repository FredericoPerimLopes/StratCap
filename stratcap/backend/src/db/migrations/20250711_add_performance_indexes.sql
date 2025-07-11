-- Migration: Add Performance Indexes and Constraints
-- Date: 2025-07-11
-- Description: Add missing indexes for performance optimization and foreign key constraints

-- Fund table indexes
CREATE INDEX IF NOT EXISTS idx_funds_fund_family_id ON funds(fund_family_id);
CREATE INDEX IF NOT EXISTS idx_funds_vintage ON funds(vintage);
CREATE INDEX IF NOT EXISTS idx_funds_status ON funds(status);
CREATE INDEX IF NOT EXISTS idx_funds_created_at ON funds(created_at);

-- InvestorEntity table indexes
CREATE INDEX IF NOT EXISTS idx_investor_entities_type ON investor_entities(type);
CREATE INDEX IF NOT EXISTS idx_investor_entities_kyc_status ON investor_entities(kyc_status);
CREATE INDEX IF NOT EXISTS idx_investor_entities_aml_status ON investor_entities(aml_status);
CREATE INDEX IF NOT EXISTS idx_investor_entities_domicile ON investor_entities(domicile);
CREATE INDEX IF NOT EXISTS idx_investor_entities_created_at ON investor_entities(created_at);

-- Commitment table indexes (additional to existing ones)
CREATE INDEX IF NOT EXISTS idx_commitments_commitment_date ON commitments(commitment_date);
CREATE INDEX IF NOT EXISTS idx_commitments_closing_id ON commitments(closing_id);
CREATE INDEX IF NOT EXISTS idx_commitments_created_at ON commitments(created_at);
CREATE INDEX IF NOT EXISTS idx_commitments_last_updated ON commitments(last_updated);

-- Transaction table indexes (additional to existing ones)
CREATE INDEX IF NOT EXISTS idx_transactions_effective_date ON transactions(effective_date);
CREATE INDEX IF NOT EXISTS idx_transactions_direction ON transactions(direction);
CREATE INDEX IF NOT EXISTS idx_transactions_is_reversed ON transactions(is_reversed);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_number ON transactions(reference_number);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- CapitalActivity table indexes
CREATE INDEX IF NOT EXISTS idx_capital_activities_fund_id ON capital_activities(fund_id);
CREATE INDEX IF NOT EXISTS idx_capital_activities_event_type ON capital_activities(event_type);
CREATE INDEX IF NOT EXISTS idx_capital_activities_event_date ON capital_activities(event_date);
CREATE INDEX IF NOT EXISTS idx_capital_activities_due_date ON capital_activities(due_date);
CREATE INDEX IF NOT EXISTS idx_capital_activities_status ON capital_activities(status);
CREATE INDEX IF NOT EXISTS idx_capital_activities_created_at ON capital_activities(created_at);

-- Investment table indexes
CREATE INDEX IF NOT EXISTS idx_investments_fund_id ON investments(fund_id);
CREATE INDEX IF NOT EXISTS idx_investments_investment_date ON investments(investment_date);
CREATE INDEX IF NOT EXISTS idx_investments_exit_date ON investments(exit_date);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_created_at ON investments(created_at);

-- InvestorClass table indexes
CREATE INDEX IF NOT EXISTS idx_investor_classes_fund_id ON investor_classes(fund_id);
CREATE INDEX IF NOT EXISTS idx_investor_classes_class_type ON investor_classes(class_type);
CREATE INDEX IF NOT EXISTS idx_investor_classes_created_at ON investor_classes(created_at);

-- Closing table indexes
CREATE INDEX IF NOT EXISTS idx_closings_fund_id ON closings(fund_id);
CREATE INDEX IF NOT EXISTS idx_closings_closing_date ON closings(closing_date);
CREATE INDEX IF NOT EXISTS idx_closings_status ON closings(status);
CREATE INDEX IF NOT EXISTS idx_closings_created_at ON closings(created_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_commitments_fund_investor ON commitments(fund_id, investor_entity_id);
CREATE INDEX IF NOT EXISTS idx_commitments_status_fund ON commitments(status, fund_id);
CREATE INDEX IF NOT EXISTS idx_transactions_fund_date ON transactions(fund_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_commitment_date ON transactions(commitment_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type_date ON transactions(transaction_type, transaction_date);

-- Add missing foreign key constraints if they don't exist
DO $$
BEGIN
    -- Fund to FundFamily constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'funds' AND constraint_name = 'fk_funds_fund_family_id'
    ) THEN
        ALTER TABLE funds ADD CONSTRAINT fk_funds_fund_family_id 
        FOREIGN KEY (fund_family_id) REFERENCES fund_families(id) ON DELETE RESTRICT;
    END IF;

    -- Commitment constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'commitments' AND constraint_name = 'fk_commitments_fund_id'
    ) THEN
        ALTER TABLE commitments ADD CONSTRAINT fk_commitments_fund_id 
        FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'commitments' AND constraint_name = 'fk_commitments_investor_entity_id'
    ) THEN
        ALTER TABLE commitments ADD CONSTRAINT fk_commitments_investor_entity_id 
        FOREIGN KEY (investor_entity_id) REFERENCES investor_entities(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'commitments' AND constraint_name = 'fk_commitments_investor_class_id'
    ) THEN
        ALTER TABLE commitments ADD CONSTRAINT fk_commitments_investor_class_id 
        FOREIGN KEY (investor_class_id) REFERENCES investor_classes(id) ON DELETE RESTRICT;
    END IF;

    -- Transaction constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'transactions' AND constraint_name = 'fk_transactions_fund_id'
    ) THEN
        ALTER TABLE transactions ADD CONSTRAINT fk_transactions_fund_id 
        FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'transactions' AND constraint_name = 'fk_transactions_commitment_id'
    ) THEN
        ALTER TABLE transactions ADD CONSTRAINT fk_transactions_commitment_id 
        FOREIGN KEY (commitment_id) REFERENCES commitments(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'transactions' AND constraint_name = 'fk_transactions_capital_activity_id'
    ) THEN
        ALTER TABLE transactions ADD CONSTRAINT fk_transactions_capital_activity_id 
        FOREIGN KEY (capital_activity_id) REFERENCES capital_activities(id) ON DELETE SET NULL;
    END IF;

END $$;

-- Add check constraints for data integrity
DO $$
BEGIN
    -- Ensure commitment amounts are positive
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_commitments_positive_amounts'
    ) THEN
        ALTER TABLE commitments ADD CONSTRAINT chk_commitments_positive_amounts 
        CHECK (
            commitment_amount::DECIMAL > 0 AND 
            capital_called::DECIMAL >= 0 AND 
            capital_returned::DECIMAL >= 0 AND 
            unfunded_commitment::DECIMAL >= 0
        );
    END IF;

    -- Ensure transaction amounts are positive
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_transactions_positive_amount'
    ) THEN
        ALTER TABLE transactions ADD CONSTRAINT chk_transactions_positive_amount 
        CHECK (amount::DECIMAL > 0);
    END IF;

    -- Ensure effective date is not before transaction date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_transactions_effective_date'
    ) THEN
        ALTER TABLE transactions ADD CONSTRAINT chk_transactions_effective_date 
        CHECK (effective_date >= transaction_date);
    END IF;

    -- Ensure fund vintage is reasonable
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_funds_vintage_range'
    ) THEN
        ALTER TABLE funds ADD CONSTRAINT chk_funds_vintage_range 
        CHECK (vintage >= 1900 AND vintage <= EXTRACT(YEAR FROM NOW()) + 10);
    END IF;

END $$;

-- Create partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_commitments_active_status ON commitments(fund_id, investor_entity_id) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_transactions_unreversed ON transactions(fund_id, transaction_date) 
WHERE is_reversed = false;

CREATE INDEX IF NOT EXISTS idx_transactions_capital_calls ON transactions(commitment_id, transaction_date) 
WHERE transaction_type = 'capital_call' AND is_reversed = false;

CREATE INDEX IF NOT EXISTS idx_transactions_distributions ON transactions(commitment_id, transaction_date) 
WHERE transaction_type = 'distribution' AND is_reversed = false;

-- Add database comments for documentation
COMMENT ON INDEX idx_funds_fund_family_id IS 'Index for fund family joins';
COMMENT ON INDEX idx_commitments_fund_investor IS 'Composite index for commitment lookups by fund and investor';
COMMENT ON INDEX idx_transactions_fund_date IS 'Composite index for transaction reporting by fund and date';
COMMENT ON INDEX idx_commitments_active_status IS 'Partial index for active commitments only';
COMMENT ON INDEX idx_transactions_unreversed IS 'Partial index for non-reversed transactions only';

-- Create function to update commitment calculations
CREATE OR REPLACE FUNCTION update_commitment_calculations()
RETURNS TRIGGER AS $$
BEGIN
    -- Update commitment totals when transactions change
    UPDATE commitments SET
        capital_called = COALESCE((
            SELECT SUM(amount::DECIMAL)
            FROM transactions 
            WHERE commitment_id = NEW.commitment_id 
            AND transaction_type = 'capital_call' 
            AND is_reversed = false
        ), 0),
        capital_returned = COALESCE((
            SELECT SUM(amount::DECIMAL)
            FROM transactions 
            WHERE commitment_id = NEW.commitment_id 
            AND transaction_type = 'distribution' 
            AND is_reversed = false
        ), 0),
        last_updated = NOW()
    WHERE id = NEW.commitment_id;

    -- Update unfunded commitment
    UPDATE commitments SET
        unfunded_commitment = GREATEST(0, commitment_amount::DECIMAL - capital_called::DECIMAL)
    WHERE id = NEW.commitment_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update commitment calculations
DROP TRIGGER IF EXISTS trigger_update_commitment_calculations ON transactions;
CREATE TRIGGER trigger_update_commitment_calculations
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    WHEN (NEW.transaction_type IN ('capital_call', 'distribution') OR OLD.transaction_type IN ('capital_call', 'distribution'))
    EXECUTE FUNCTION update_commitment_calculations();

-- Analyze tables for better query planning
ANALYZE fund_families;
ANALYZE funds;
ANALYZE investor_entities;
ANALYZE investor_classes;
ANALYZE commitments;
ANALYZE transactions;
ANALYZE capital_activities;
ANALYZE investments;
ANALYZE closings;