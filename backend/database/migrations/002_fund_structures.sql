-- ============================================================================
-- FUND STRUCTURES MIGRATION
-- Adds support for hierarchical fund structures (main, parallel, feeder funds)
-- ============================================================================

-- Add structure type to funds table
ALTER TABLE funds 
ADD COLUMN structure_type VARCHAR(20) DEFAULT 'main' 
    CHECK (structure_type IN ('main', 'parallel', 'feeder', 'master', 'blocker', 'aggregator')),
ADD COLUMN parent_fund_id UUID REFERENCES funds(fund_id),
ADD COLUMN master_fund_id UUID REFERENCES funds(fund_id),
ADD COLUMN min_commitment DECIMAL(20,2) DEFAULT 1000000.00 CHECK (min_commitment > 0),
ADD COLUMN max_commitment DECIMAL(20,2),
ADD COLUMN max_investors INTEGER,
ADD COLUMN allocation_strategy VARCHAR(50) DEFAULT 'pro_rata' 
    CHECK (allocation_strategy IN ('pro_rata', 'first_come_first_served', 'tiered', 'custom')),
ADD COLUMN allocation_rules JSONB,
ADD COLUMN fee_sharing_arrangement JSONB;

-- Add constraint to ensure max_commitment >= min_commitment
ALTER TABLE funds 
ADD CONSTRAINT check_commitment_range 
CHECK (max_commitment IS NULL OR max_commitment >= min_commitment);

-- Create fund relationships table
CREATE TABLE fund_relationships (
    relationship_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_fund_id UUID NOT NULL REFERENCES funds(fund_id) ON DELETE CASCADE,
    child_fund_id UUID NOT NULL REFERENCES funds(fund_id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL 
        CHECK (relationship_type IN ('parent-child', 'master-feeder', 'parallel', 'cross-investment')),
    allocation_percentage DECIMAL(5,2) CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
    fee_sharing_percentage DECIMAL(5,2) CHECK (fee_sharing_percentage >= 0 AND fee_sharing_percentage <= 100),
    cross_investment_allowed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_fund_id, child_fund_id, relationship_type)
);

-- Create investor eligibility table
CREATE TABLE fund_investor_eligibility (
    eligibility_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID NOT NULL REFERENCES funds(fund_id) ON DELETE CASCADE,
    investor_type VARCHAR(50) NOT NULL 
        CHECK (investor_type IN ('us_taxable', 'us_tax_exempt', 'non_us', 
                                'qualified_purchaser', 'accredited_investor', 
                                'institutional', 'erisa_plan')),
    is_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fund_id, investor_type)
);

-- Create restricted jurisdictions table
CREATE TABLE fund_restricted_jurisdictions (
    restriction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID NOT NULL REFERENCES funds(fund_id) ON DELETE CASCADE,
    jurisdiction_code VARCHAR(10) NOT NULL,
    restriction_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fund_id, jurisdiction_code)
);

-- Create allocation requests table
CREATE TABLE allocation_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID NOT NULL REFERENCES investors(investor_id),
    requested_amount DECIMAL(20,2) NOT NULL CHECK (requested_amount > 0),
    investor_type VARCHAR(50) NOT NULL,
    jurisdiction VARCHAR(100) NOT NULL,
    preference_order TEXT[], -- Array of fund_ids in preference order
    accepts_side_letter BOOLEAN DEFAULT TRUE,
    tax_transparent_required BOOLEAN DEFAULT FALSE,
    erisa_percentage DECIMAL(5,2),
    request_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (request_status IN ('pending', 'processing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(user_id)
);

-- Create allocation results table
CREATE TABLE allocation_results (
    result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES allocation_requests(request_id),
    total_requested DECIMAL(20,2) NOT NULL,
    total_allocated DECIMAL(20,2) NOT NULL,
    allocation_status VARCHAR(20) NOT NULL 
        CHECK (allocation_status IN ('full', 'partial', 'rejected')),
    rejection_reasons TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create individual fund allocations table
CREATE TABLE fund_allocations (
    allocation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID NOT NULL REFERENCES allocation_results(result_id),
    fund_id UUID NOT NULL REFERENCES funds(fund_id),
    allocated_amount DECIMAL(20,2) NOT NULL CHECK (allocated_amount > 0),
    allocation_percentage DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced commitments table for allocation tracking
ALTER TABLE commitments
ADD COLUMN allocation_request_id UUID REFERENCES allocation_requests(request_id),
ADD COLUMN eligibility_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN verified_by UUID REFERENCES users(user_id),
ADD COLUMN special_fee_terms JSONB;

-- Create view for fund hierarchy
CREATE OR REPLACE VIEW fund_hierarchy AS
WITH RECURSIVE fund_tree AS (
    -- Base case: root funds (no parent)
    SELECT 
        f.fund_id,
        f.fund_name,
        f.structure_type,
        f.parent_fund_id,
        f.target_size,
        f.committed_capital,
        0 as level,
        ARRAY[f.fund_id] as path,
        f.fund_id::TEXT as hierarchy_path
    FROM funds f
    WHERE f.parent_fund_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child funds
    SELECT 
        f.fund_id,
        f.fund_name,
        f.structure_type,
        f.parent_fund_id,
        f.target_size,
        f.committed_capital,
        ft.level + 1,
        ft.path || f.fund_id,
        ft.hierarchy_path || ' > ' || f.fund_name
    FROM funds f
    JOIN fund_tree ft ON f.parent_fund_id = ft.fund_id
)
SELECT * FROM fund_tree
ORDER BY path;

-- Create view for fund capacity
CREATE OR REPLACE VIEW fund_capacity AS
SELECT 
    f.fund_id,
    f.fund_name,
    f.structure_type,
    f.target_size,
    f.committed_capital,
    f.target_size - f.committed_capital as available_capacity,
    CASE 
        WHEN f.target_size > 0 THEN 
            ROUND((f.committed_capital / f.target_size * 100)::numeric, 2)
        ELSE 0 
    END as subscription_percentage,
    f.max_investors,
    COUNT(DISTINCT c.investor_id) as current_investors,
    CASE 
        WHEN f.max_investors IS NOT NULL THEN 
            f.max_investors - COUNT(DISTINCT c.investor_id)
        ELSE NULL 
    END as available_investor_slots
FROM funds f
LEFT JOIN commitments c ON f.fund_id = c.fund_id AND c.status = 'active'
GROUP BY f.fund_id, f.fund_name, f.structure_type, f.target_size, 
         f.committed_capital, f.max_investors;

-- Create indexes for performance
CREATE INDEX idx_fund_relationships_parent ON fund_relationships(parent_fund_id);
CREATE INDEX idx_fund_relationships_child ON fund_relationships(child_fund_id);
CREATE INDEX idx_fund_investor_eligibility_fund ON fund_investor_eligibility(fund_id);
CREATE INDEX idx_fund_restricted_jurisdictions_fund ON fund_restricted_jurisdictions(fund_id);
CREATE INDEX idx_allocation_requests_investor ON allocation_requests(investor_id);
CREATE INDEX idx_allocation_requests_status ON allocation_requests(request_status);
CREATE INDEX idx_allocation_results_request ON allocation_results(request_id);
CREATE INDEX idx_fund_allocations_result ON fund_allocations(result_id);
CREATE INDEX idx_fund_allocations_fund ON fund_allocations(fund_id);

-- Create trigger to update fund relationships timestamp
CREATE TRIGGER update_fund_relationships_timestamp
BEFORE UPDATE ON fund_relationships
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate fund hierarchy (prevent circular references)
CREATE OR REPLACE FUNCTION validate_fund_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for circular reference
    IF NEW.parent_fund_id IS NOT NULL THEN
        WITH RECURSIVE parent_check AS (
            SELECT fund_id, parent_fund_id
            FROM funds
            WHERE fund_id = NEW.parent_fund_id
            
            UNION ALL
            
            SELECT f.fund_id, f.parent_fund_id
            FROM funds f
            JOIN parent_check pc ON f.fund_id = pc.parent_fund_id
        )
        SELECT 1 FROM parent_check WHERE fund_id = NEW.fund_id LIMIT 1;
        
        IF FOUND THEN
            RAISE EXCEPTION 'Circular reference detected in fund hierarchy';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hierarchy validation
CREATE TRIGGER validate_fund_hierarchy_trigger
BEFORE INSERT OR UPDATE OF parent_fund_id ON funds
FOR EACH ROW
EXECUTE FUNCTION validate_fund_hierarchy();

-- Create function to calculate ERISA percentage for a fund
CREATE OR REPLACE FUNCTION calculate_erisa_percentage(p_fund_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_commitments DECIMAL;
    erisa_commitments DECIMAL;
BEGIN
    -- Get total commitments
    SELECT COALESCE(SUM(c.commitment_amount), 0)
    INTO total_commitments
    FROM commitments c
    WHERE c.fund_id = p_fund_id AND c.status = 'active';
    
    -- Get ERISA commitments
    SELECT COALESCE(SUM(c.commitment_amount), 0)
    INTO erisa_commitments
    FROM commitments c
    JOIN investors i ON c.investor_id = i.investor_id
    WHERE c.fund_id = p_fund_id 
      AND c.status = 'active'
      AND i.investor_type = 'erisa_plan';
    
    IF total_commitments = 0 THEN
        RETURN 0;
    ELSE
        RETURN ROUND((erisa_commitments / total_commitments * 100)::numeric, 2);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE fund_relationships IS 'Defines hierarchical and parallel relationships between funds';
COMMENT ON TABLE fund_investor_eligibility IS 'Specifies which investor types are eligible for each fund';
COMMENT ON TABLE fund_restricted_jurisdictions IS 'Lists jurisdictions restricted from investing in specific funds';
COMMENT ON TABLE allocation_requests IS 'Tracks investor allocation requests across fund structures';
COMMENT ON TABLE allocation_results IS 'Stores results of allocation engine processing';
COMMENT ON TABLE fund_allocations IS 'Individual fund allocations within an allocation result';
COMMENT ON VIEW fund_hierarchy IS 'Hierarchical view of fund structures showing parent-child relationships';
COMMENT ON VIEW fund_capacity IS 'Real-time view of fund capacity and subscription status';