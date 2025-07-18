-- ============================================================================
-- FUND EVENTS MIGRATION
-- Adds support for fund events (capital calls, distributions, management fees)
-- with automatic investor calculation capabilities
-- ============================================================================

-- Create fund events table
CREATE TABLE fund_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID NOT NULL REFERENCES funds(fund_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL 
        CHECK (event_type IN ('capital_call', 'distribution', 'management_fee', 
                             'expense_allocation', 'performance_fee', 'special_distribution')),
    event_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Event dates
    event_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    record_date DATE NOT NULL,
    
    -- Financial details
    total_amount DECIMAL(20,2) NOT NULL CHECK (total_amount > 0),
    calculation_method VARCHAR(50) DEFAULT 'pro_rata' 
        CHECK (calculation_method IN ('pro_rata', 'flat_amount', 'tiered', 'custom')),
    calculation_basis VARCHAR(50) DEFAULT 'commitment' 
        CHECK (calculation_basis IN ('commitment', 'paid_in', 'nav')),
    
    -- Status and workflow
    status VARCHAR(50) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'pending_approval', 'approved', 'processing', 
                         'completed', 'cancelled', 'failed')),
    created_by UUID NOT NULL REFERENCES users(user_id),
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata and audit
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    
    -- Constraints
    CONSTRAINT check_effective_after_event CHECK (effective_date >= event_date),
    CONSTRAINT check_approval_consistency CHECK (
        (approved_by IS NULL AND approved_at IS NULL) OR 
        (approved_by IS NOT NULL AND approved_at IS NOT NULL)
    )
);

-- Create capital call events table (extends fund_events)
CREATE TABLE capital_call_events (
    event_id UUID PRIMARY KEY REFERENCES fund_events(event_id) ON DELETE CASCADE,
    call_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    call_purpose TEXT NOT NULL,
    
    -- Amount breakdown
    investment_amount DECIMAL(20,2) DEFAULT 0 CHECK (investment_amount >= 0),
    management_fee_amount DECIMAL(20,2) DEFAULT 0 CHECK (management_fee_amount >= 0),
    expense_amount DECIMAL(20,2) DEFAULT 0 CHECK (expense_amount >= 0),
    organizational_expense_amount DECIMAL(20,2) DEFAULT 0 CHECK (organizational_expense_amount >= 0),
    
    -- Call settings
    call_percentage DECIMAL(5,2) CHECK (call_percentage >= 0 AND call_percentage <= 100),
    minimum_call_amount DECIMAL(20,2) CHECK (minimum_call_amount > 0),
    allow_partial_funding BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    UNIQUE(fund_id, call_number),
    CONSTRAINT check_due_date CHECK (due_date >= (SELECT effective_date FROM fund_events WHERE event_id = capital_call_events.event_id))
);

-- Create distribution events table (extends fund_events)
CREATE TABLE distribution_events (
    event_id UUID PRIMARY KEY REFERENCES fund_events(event_id) ON DELETE CASCADE,
    distribution_number INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    
    -- Distribution classification
    distribution_type VARCHAR(50) NOT NULL DEFAULT 'return_of_capital'
        CHECK (distribution_type IN ('income', 'capital_gain', 'return_of_capital')),
    source_description TEXT,
    
    -- Tax implications
    tax_year INTEGER NOT NULL,
    withholding_required BOOLEAN DEFAULT FALSE,
    default_withholding_rate DECIMAL(5,4) DEFAULT 0 CHECK (default_withholding_rate >= 0 AND default_withholding_rate <= 1),
    
    -- Distribution calculations
    gross_distribution DECIMAL(20,2) NOT NULL CHECK (gross_distribution > 0),
    management_fee_offset DECIMAL(20,2) DEFAULT 0 CHECK (management_fee_offset >= 0),
    expense_offset DECIMAL(20,2) DEFAULT 0 CHECK (expense_offset >= 0),
    
    -- Constraints
    UNIQUE(fund_id, distribution_number),
    CONSTRAINT check_payment_date CHECK (payment_date >= (SELECT effective_date FROM fund_events WHERE event_id = distribution_events.event_id)),
    CONSTRAINT check_net_positive CHECK (gross_distribution >= management_fee_offset + expense_offset)
);

-- Create management fee events table (extends fund_events)
CREATE TABLE management_fee_events (
    event_id UUID PRIMARY KEY REFERENCES fund_events(event_id) ON DELETE CASCADE,
    fee_period_start DATE NOT NULL,
    fee_period_end DATE NOT NULL,
    
    -- Fee calculation
    fee_rate DECIMAL(5,4) NOT NULL CHECK (fee_rate > 0 AND fee_rate <= 1),
    fee_basis VARCHAR(50) NOT NULL DEFAULT 'commitment'
        CHECK (fee_basis IN ('commitment', 'invested_capital', 'nav')),
    calculation_frequency VARCHAR(20) NOT NULL DEFAULT 'quarterly'
        CHECK (calculation_frequency IN ('monthly', 'quarterly', 'annually')),
    
    -- Proration settings
    prorate_for_period BOOLEAN DEFAULT TRUE,
    days_in_period INTEGER NOT NULL CHECK (days_in_period > 0),
    
    -- Payment terms
    payment_method VARCHAR(50) DEFAULT 'offset'
        CHECK (payment_method IN ('offset', 'direct_payment', 'capital_call')),
    payment_due_date DATE,
    
    -- Constraints
    CONSTRAINT check_fee_period CHECK (fee_period_end > fee_period_start),
    CONSTRAINT check_days_calculation CHECK (
        days_in_period = (fee_period_end - fee_period_start + 1)
    )
);

-- Create investor event calculations table
CREATE TABLE investor_event_calculations (
    calculation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES fund_events(event_id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES investors(investor_id) ON DELETE CASCADE,
    commitment_id UUID NOT NULL REFERENCES commitments(commitment_id) ON DELETE CASCADE,
    
    -- Ownership basis
    ownership_percentage DECIMAL(7,4) NOT NULL CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100),
    calculation_basis_amount DECIMAL(20,2) NOT NULL CHECK (calculation_basis_amount >= 0),
    
    -- Calculated amounts
    gross_amount DECIMAL(20,2) NOT NULL CHECK (gross_amount >= 0),
    management_fee_offset DECIMAL(20,2) DEFAULT 0 CHECK (management_fee_offset >= 0),
    expense_offset DECIMAL(20,2) DEFAULT 0 CHECK (expense_offset >= 0),
    withholding_amount DECIMAL(20,2) DEFAULT 0 CHECK (withholding_amount >= 0),
    net_amount DECIMAL(20,2) NOT NULL CHECK (net_amount >= 0),
    
    -- Breakdown (for capital calls)
    investment_portion DECIMAL(20,2) CHECK (investment_portion >= 0),
    management_fee_portion DECIMAL(20,2) CHECK (management_fee_portion >= 0),
    expense_portion DECIMAL(20,2) CHECK (expense_portion >= 0),
    
    -- Status and overrides
    calculation_status VARCHAR(50) DEFAULT 'calculated'
        CHECK (calculation_status IN ('calculated', 'validated', 'approved', 'overridden')),
    override_reason TEXT,
    override_by UUID REFERENCES users(user_id),
    override_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(event_id, investor_id),
    CONSTRAINT check_net_calculation CHECK (
        net_amount = gross_amount - management_fee_offset - expense_offset - withholding_amount
    ),
    CONSTRAINT check_override_consistency CHECK (
        (calculation_status != 'overridden') OR 
        (override_reason IS NOT NULL AND override_by IS NOT NULL AND override_at IS NOT NULL)
    )
);

-- Create event processing results table
CREATE TABLE event_processing_results (
    processing_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES fund_events(event_id) ON DELETE CASCADE,
    
    -- Summary statistics
    total_investors_processed INTEGER NOT NULL CHECK (total_investors_processed >= 0),
    total_gross_amount DECIMAL(20,2) NOT NULL CHECK (total_gross_amount >= 0),
    total_net_amount DECIMAL(20,2) NOT NULL CHECK (total_net_amount >= 0),
    total_withholding DECIMAL(20,2) DEFAULT 0 CHECK (total_withholding >= 0),
    
    -- Validation results
    validation_errors TEXT[],
    validation_warnings TEXT[],
    
    -- Processing status
    processing_status VARCHAR(50) NOT NULL DEFAULT 'completed'
        CHECK (processing_status IN ('completed', 'partial', 'failed')),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_by UUID REFERENCES users(user_id)
);

-- Create event history/audit table
CREATE TABLE event_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES fund_events(event_id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(user_id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    ip_address INET,
    user_agent TEXT
);

-- Create event notifications table
CREATE TABLE event_notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES fund_events(event_id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES investors(investor_id) ON DELETE CASCADE,
    
    -- Notification details
    notification_type VARCHAR(50) NOT NULL
        CHECK (notification_type IN ('capital_call', 'distribution', 'management_fee', 'reminder')),
    notification_method VARCHAR(50) NOT NULL DEFAULT 'email'
        CHECK (notification_method IN ('email', 'sms', 'portal', 'mail')),
    
    -- Content
    subject VARCHAR(255),
    message_body TEXT,
    template_used VARCHAR(100),
    
    -- Delivery tracking
    status VARCHAR(50) DEFAULT 'pending'
        CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_fund_events_fund_id ON fund_events(fund_id);
CREATE INDEX idx_fund_events_type_status ON fund_events(event_type, status);
CREATE INDEX idx_fund_events_dates ON fund_events(event_date, effective_date, record_date);
CREATE INDEX idx_capital_call_events_fund_call ON capital_call_events(fund_id, call_number);
CREATE INDEX idx_distribution_events_fund_dist ON distribution_events(fund_id, distribution_number);
CREATE INDEX idx_investor_calculations_event ON investor_event_calculations(event_id);
CREATE INDEX idx_investor_calculations_investor ON investor_event_calculations(investor_id);
CREATE INDEX idx_event_history_event ON event_history(event_id);
CREATE INDEX idx_event_history_timestamp ON event_history(timestamp);
CREATE INDEX idx_event_notifications_event ON event_notifications(event_id);
CREATE INDEX idx_event_notifications_investor ON event_notifications(investor_id);
CREATE INDEX idx_event_notifications_status ON event_notifications(status);

-- Create triggers for automatic updates
CREATE TRIGGER update_fund_events_timestamp
BEFORE UPDATE ON fund_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate event total amount matches components
CREATE OR REPLACE FUNCTION validate_event_total_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- For capital calls, validate component breakdown
    IF NEW.event_type = 'capital_call' THEN
        DECLARE
            component_total DECIMAL(20,2);
        BEGIN
            SELECT COALESCE(cc.investment_amount, 0) + 
                   COALESCE(cc.management_fee_amount, 0) + 
                   COALESCE(cc.expense_amount, 0) + 
                   COALESCE(cc.organizational_expense_amount, 0)
            INTO component_total
            FROM capital_call_events cc
            WHERE cc.event_id = NEW.event_id;
            
            IF component_total IS NOT NULL AND component_total != NEW.total_amount THEN
                RAISE EXCEPTION 'Total amount must equal sum of component amounts for capital calls';
            END IF;
        END;
    END IF;
    
    -- For distributions, validate net amount calculation
    IF NEW.event_type = 'distribution' THEN
        DECLARE
            net_amount DECIMAL(20,2);
        BEGIN
            SELECT de.gross_distribution - COALESCE(de.management_fee_offset, 0) - COALESCE(de.expense_offset, 0)
            INTO net_amount
            FROM distribution_events de
            WHERE de.event_id = NEW.event_id;
            
            IF net_amount IS NOT NULL AND net_amount != NEW.total_amount THEN
                RAISE EXCEPTION 'Total amount must equal net distribution amount';
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for amount validation
CREATE TRIGGER validate_event_amounts_trigger
AFTER INSERT OR UPDATE ON fund_events
FOR EACH ROW
EXECUTE FUNCTION validate_event_total_amount();

-- Create function to automatically create event history entries
CREATE OR REPLACE FUNCTION create_event_history_entry()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO event_history (event_id, action, user_id, metadata)
        VALUES (NEW.event_id, 'created', NEW.created_by, 
                jsonb_build_object('event_type', NEW.event_type, 'event_name', NEW.event_name));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log status changes
        IF OLD.status != NEW.status THEN
            INSERT INTO event_history (event_id, action, user_id, metadata)
            VALUES (NEW.event_id, 'status_changed', NEW.created_by,
                    jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
        END IF;
        
        -- Log approvals
        IF OLD.approved_by IS NULL AND NEW.approved_by IS NOT NULL THEN
            INSERT INTO event_history (event_id, action, user_id, metadata)
            VALUES (NEW.event_id, 'approved', NEW.approved_by,
                    jsonb_build_object('approved_at', NEW.approved_at));
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic history logging
CREATE TRIGGER event_history_trigger
AFTER INSERT OR UPDATE ON fund_events
FOR EACH ROW
EXECUTE FUNCTION create_event_history_entry();

-- Create function to calculate investor event amounts
CREATE OR REPLACE FUNCTION calculate_investor_amounts(p_event_id UUID)
RETURNS TABLE (
    investor_id UUID,
    commitment_id UUID,
    ownership_percentage DECIMAL,
    gross_amount DECIMAL,
    net_amount DECIMAL
) AS $$
DECLARE
    event_record RECORD;
    total_basis DECIMAL := 0;
BEGIN
    -- Get event details
    SELECT fe.*, fe.calculation_basis
    INTO event_record
    FROM fund_events fe
    WHERE fe.event_id = p_event_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found: %', p_event_id;
    END IF;
    
    -- Calculate total basis amount
    IF event_record.calculation_basis = 'commitment' THEN
        SELECT COALESCE(SUM(c.commitment_amount), 0)
        INTO total_basis
        FROM commitments c
        WHERE c.fund_id = event_record.fund_id
          AND c.status = 'active'
          AND c.commitment_date <= event_record.record_date;
    ELSIF event_record.calculation_basis = 'paid_in' THEN
        -- This would need actual paid-in calculation logic
        total_basis := 1000000; -- Placeholder
    END IF;
    
    IF total_basis = 0 THEN
        RAISE EXCEPTION 'No eligible commitments found for calculation';
    END IF;
    
    -- Return calculated amounts for each investor
    RETURN QUERY
    SELECT 
        c.investor_id,
        c.commitment_id,
        ROUND((c.commitment_amount / total_basis * 100)::numeric, 4) as ownership_percentage,
        ROUND((event_record.total_amount * c.commitment_amount / total_basis)::numeric, 2) as gross_amount,
        ROUND((event_record.total_amount * c.commitment_amount / total_basis)::numeric, 2) as net_amount
    FROM commitments c
    WHERE c.fund_id = event_record.fund_id
      AND c.status = 'active'
      AND c.commitment_date <= event_record.record_date
    ORDER BY c.commitment_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Create views for reporting
CREATE OR REPLACE VIEW event_summary AS
SELECT 
    fe.event_id,
    fe.fund_id,
    f.fund_name,
    fe.event_type,
    fe.event_name,
    fe.event_date,
    fe.effective_date,
    fe.total_amount,
    fe.status,
    fe.created_by,
    u.user_name as created_by_name,
    fe.approved_by,
    au.user_name as approved_by_name,
    fe.created_at,
    COUNT(iec.calculation_id) as investor_count,
    COALESCE(SUM(iec.gross_amount), 0) as calculated_total
FROM fund_events fe
LEFT JOIN funds f ON fe.fund_id = f.fund_id
LEFT JOIN users u ON fe.created_by = u.user_id
LEFT JOIN users au ON fe.approved_by = au.user_id
LEFT JOIN investor_event_calculations iec ON fe.event_id = iec.event_id
GROUP BY fe.event_id, f.fund_name, u.user_name, au.user_name;

-- Create view for investor event history
CREATE OR REPLACE VIEW investor_event_history AS
SELECT 
    iec.investor_id,
    i.investor_name,
    fe.fund_id,
    f.fund_name,
    fe.event_id,
    fe.event_type,
    fe.event_name,
    fe.event_date,
    fe.effective_date,
    iec.ownership_percentage,
    iec.gross_amount,
    iec.net_amount,
    iec.withholding_amount,
    fe.status,
    fe.created_at
FROM investor_event_calculations iec
JOIN fund_events fe ON iec.event_id = fe.event_id
JOIN investors i ON iec.investor_id = i.investor_id
JOIN funds f ON fe.fund_id = f.fund_id
ORDER BY fe.event_date DESC, iec.gross_amount DESC;

-- Add comments for documentation
COMMENT ON TABLE fund_events IS 'Master table for all fund events (capital calls, distributions, etc.)';
COMMENT ON TABLE capital_call_events IS 'Extended details for capital call events';
COMMENT ON TABLE distribution_events IS 'Extended details for distribution events';
COMMENT ON TABLE management_fee_events IS 'Extended details for management fee events';
COMMENT ON TABLE investor_event_calculations IS 'Calculated investor-specific amounts for each event';
COMMENT ON TABLE event_processing_results IS 'Results and summary of event processing runs';
COMMENT ON TABLE event_history IS 'Audit trail for all event actions and changes';
COMMENT ON TABLE event_notifications IS 'Tracking of notifications sent to investors';
COMMENT ON VIEW event_summary IS 'Summary view of events with calculated totals';
COMMENT ON VIEW investor_event_history IS 'Complete history of events affecting each investor';