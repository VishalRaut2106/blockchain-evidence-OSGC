-- Case Status Workflow System Database Schema
-- Enhanced case management with explicit status workflow and role-based permissions

-- ============================================================================
-- CASE STATUS WORKFLOW TABLES
-- ============================================================================

-- Case status definitions table
CREATE TABLE case_statuses (
    id SERIAL PRIMARY KEY,
    status_code VARCHAR(50) UNIQUE NOT NULL,
    status_name VARCHAR(100) NOT NULL,
    description TEXT,
    color_code VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'folder',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case status transitions table (defines allowed status changes)
CREATE TABLE case_status_transitions (
    id SERIAL PRIMARY KEY,
    from_status_id INTEGER REFERENCES case_statuses(id),
    to_status_id INTEGER REFERENCES case_statuses(id),
    required_role VARCHAR(50) NOT NULL,
    requires_approval BOOLEAN DEFAULT FALSE,
    approval_role VARCHAR(50),
    transition_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_status_id, to_status_id, required_role)
);

-- Case status history table (audit trail for status changes)
CREATE TABLE case_status_history (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    from_status_id INTEGER REFERENCES case_statuses(id),
    to_status_id INTEGER REFERENCES case_statuses(id),
    changed_by TEXT NOT NULL,
    change_reason TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case assignments table (track who is assigned to cases)
CREATE TABLE case_assignments (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    assigned_to TEXT NOT NULL,
    assigned_by TEXT NOT NULL,
    role_type VARCHAR(50) NOT NULL,
    assignment_type VARCHAR(50) DEFAULT 'primary' CHECK (assignment_type IN ('primary', 'secondary', 'observer')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- Case workflow rules table (business rules for status transitions)
CREATE TABLE case_workflow_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('status_change', 'assignment', 'evidence_requirement', 'time_based')),
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case notifications table (status change notifications)
CREATE TABLE case_notifications (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    recipient_role VARCHAR(50),
    recipient_wallet TEXT,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- ============================================================================
-- UPDATE EXISTING CASES TABLE
-- ============================================================================

-- Add new columns to cases table
ALTER TABLE cases 
ADD COLUMN status_id INTEGER REFERENCES case_statuses(id),
ADD COLUMN priority_level INTEGER DEFAULT 3 CHECK (priority_level BETWEEN 1 AND 5),
ADD COLUMN assigned_investigator TEXT,
ADD COLUMN assigned_prosecutor TEXT,
ADD COLUMN assigned_judge TEXT,
ADD COLUMN court_date TIMESTAMPTZ,
ADD COLUMN deadline_date TIMESTAMPTZ,
ADD COLUMN case_number VARCHAR(50) UNIQUE,
ADD COLUMN jurisdiction VARCHAR(100),
ADD COLUMN case_type VARCHAR(50) DEFAULT 'criminal',
ADD COLUMN estimated_completion TIMESTAMPTZ,
ADD COLUMN actual_completion TIMESTAMPTZ,
ADD COLUMN case_tags TEXT[],
ADD COLUMN metadata JSONB DEFAULT '{}',
ADD COLUMN last_status_change TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN status_changed_by TEXT;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_cases_status_id ON cases(status_id);
CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_priority_level ON cases(priority_level);
CREATE INDEX idx_cases_assigned_investigator ON cases(assigned_investigator);
CREATE INDEX idx_cases_assigned_prosecutor ON cases(assigned_prosecutor);
CREATE INDEX idx_cases_assigned_judge ON cases(assigned_judge);
CREATE INDEX idx_cases_court_date ON cases(court_date);
CREATE INDEX idx_cases_deadline_date ON cases(deadline_date);
CREATE INDEX idx_cases_case_type ON cases(case_type);
CREATE INDEX idx_cases_jurisdiction ON cases(jurisdiction);
CREATE INDEX idx_cases_last_status_change ON cases(last_status_change);

CREATE INDEX idx_case_status_history_case_id ON case_status_history(case_id);
CREATE INDEX idx_case_status_history_created_at ON case_status_history(created_at);
CREATE INDEX idx_case_assignments_case_id ON case_assignments(case_id);
CREATE INDEX idx_case_assignments_assigned_to ON case_assignments(assigned_to);
CREATE INDEX idx_case_notifications_case_id ON case_notifications(case_id);
CREATE INDEX idx_case_notifications_recipient_wallet ON case_notifications(recipient_wallet);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to log case status changes
CREATE OR REPLACE FUNCTION log_case_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
        INSERT INTO case_status_history (
            case_id,
            from_status_id,
            to_status_id,
            changed_by,
            change_reason,
            metadata
        ) VALUES (
            NEW.id,
            OLD.status_id,
            NEW.status_id,
            NEW.status_changed_by,
            'Status updated via system',
            jsonb_build_object(
                'previous_status', OLD.status,
                'new_status', NEW.status,
                'change_timestamp', NOW()
            )
        );
        
        -- Update last status change timestamp
        NEW.last_status_change = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate status transitions
CREATE OR REPLACE FUNCTION validate_case_status_transition()
RETURNS TRIGGER AS $$
DECLARE
    transition_allowed BOOLEAN := FALSE;
    required_role VARCHAR(50);
BEGIN
    -- Skip validation for new records
    IF OLD IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Skip if status hasn't changed
    IF OLD.status_id = NEW.status_id THEN
        RETURN NEW;
    END IF;
    
    -- Check if transition is allowed
    SELECT EXISTS(
        SELECT 1 FROM case_status_transitions cst
        WHERE cst.from_status_id = OLD.status_id
        AND cst.to_status_id = NEW.status_id
        AND cst.is_active = TRUE
    ) INTO transition_allowed;
    
    IF NOT transition_allowed THEN
        RAISE EXCEPTION 'Status transition from % to % is not allowed', OLD.status_id, NEW.status_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign case numbers
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.case_number IS NULL THEN
        NEW.case_number := 'CASE-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEW.id::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER case_status_change_log_trigger
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION log_case_status_change();

CREATE TRIGGER case_status_transition_validation_trigger
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION validate_case_status_transition();

CREATE TRIGGER case_number_generation_trigger
    BEFORE INSERT ON cases
    FOR EACH ROW
    EXECUTE FUNCTION generate_case_number();

-- ============================================================================
-- DEFAULT CASE STATUSES
-- ============================================================================

INSERT INTO case_statuses (status_code, status_name, description, color_code, icon, sort_order) VALUES
('open', 'Open', 'Case created, initial evidence being collected', '#3B82F6', 'folder-open', 1),
('under_investigation', 'Under Investigation', 'Active investigation, evidence being processed', '#F59E0B', 'search', 2),
('evidence_review', 'Evidence Review', 'Evidence collected, under forensic analysis', '#8B5CF6', 'microscope', 3),
('legal_review', 'Legal Review', 'Case under legal professional review', '#10B981', 'scale', 4),
('pending_court', 'Pending Court', 'Ready for court review, awaiting judicial decision', '#EF4444', 'gavel', 5),
('in_trial', 'In Trial', 'Case currently in court proceedings', '#DC2626', 'courthouse', 6),
('closed', 'Closed', 'Case concluded and archived', '#6B7280', 'archive', 7),
('suspended', 'Suspended', 'Case temporarily suspended', '#F97316', 'pause-circle', 8),
('reopened', 'Reopened', 'Previously closed case reopened for new evidence', '#06B6D4', 'refresh-cw', 9);

-- ============================================================================
-- DEFAULT STATUS TRANSITIONS
-- ============================================================================

-- Open -> Under Investigation (Investigators, Evidence Managers)
INSERT INTO case_status_transitions (from_status_id, to_status_id, required_role, transition_name, description) VALUES
(1, 2, 'investigator', 'Start Investigation', 'Begin active investigation of the case'),
(1, 2, 'evidence_manager', 'Start Investigation', 'Begin active investigation of the case');

-- Under Investigation -> Evidence Review (Investigators, Forensic Analysts)
INSERT INTO case_status_transitions (from_status_id, to_status_id, required_role, transition_name, description) VALUES
(2, 3, 'investigator', 'Submit for Evidence Review', 'Submit case for forensic evidence analysis'),
(2, 3, 'forensic_analyst', 'Begin Evidence Review', 'Start forensic analysis of evidence');

-- Evidence Review -> Legal Review (Forensic Analysts, Legal Professionals)
INSERT INTO case_status_transitions (from_status_id, to_status_id, required_role, transition_name, description) VALUES
(3, 4, 'forensic_analyst', 'Submit for Legal Review', 'Evidence analysis complete, ready for legal review'),
(3, 4, 'legal_professional', 'Begin Legal Review', 'Start legal analysis of case');

-- Legal Review -> Pending Court (Legal Professionals, Court Officials)
INSERT INTO case_status_transitions (from_status_id, to_status_id, required_role, transition_name, description) VALUES
(4, 5, 'legal_professional', 'Submit to Court', 'Case ready for court proceedings'),
(4, 5, 'court_official', 'Schedule Court Date', 'Schedule case for court review');

-- Pending Court -> In Trial (Court Officials)
INSERT INTO case_status_transitions (from_status_id, to_status_id, required_role, transition_name, description) VALUES
(5, 6, 'court_official', 'Begin Trial', 'Start court trial proceedings');

-- In Trial -> Closed (Court Officials, Judges)
INSERT INTO case_status_transitions (from_status_id, to_status_id, required_role, transition_name, description) VALUES
(6, 7, 'court_official', 'Close Case', 'Conclude case and archive'),
(6, 7, 'legal_professional', 'Close Case', 'Conclude case and archive');

-- Any status -> Suspended (Admins, Court Officials)
INSERT INTO case_status_transitions (from_status_id, to_status_id, required_role, transition_name, description) VALUES
(1, 8, 'admin', 'Suspend Case', 'Temporarily suspend case'),
(2, 8, 'admin', 'Suspend Case', 'Temporarily suspend case'),
(3, 8, 'admin', 'Suspend Case', 'Temporarily suspend case'),
(4, 8, 'admin', 'Suspend Case', 'Temporarily suspend case'),
(5, 8, 'court_official', 'Suspend Case', 'Temporarily suspend case'),
(6, 8, 'court_official', 'Suspend Case', 'Temporarily suspend case');

-- Closed -> Reopened (Admins, Court Officials)
INSERT INTO case_status_transitions (from_status_id, to_status_id, required_role, transition_name, description) VALUES
(7, 9, 'admin', 'Reopen Case', 'Reopen closed case for new evidence'),
(7, 9, 'court_official', 'Reopen Case', 'Reopen closed case for new evidence');

-- Suspended -> Previous statuses (Admins)
INSERT INTO case_status_transitions (from_status_id, to_status_id, required_role, transition_name, description) VALUES
(8, 1, 'admin', 'Resume as Open', 'Resume suspended case as open'),
(8, 2, 'admin', 'Resume Investigation', 'Resume suspended case under investigation'),
(8, 3, 'admin', 'Resume Evidence Review', 'Resume suspended case in evidence review'),
(8, 4, 'admin', 'Resume Legal Review', 'Resume suspended case in legal review'),
(8, 5, 'admin', 'Resume Pending Court', 'Resume suspended case pending court');

-- ============================================================================
-- DEFAULT WORKFLOW RULES
-- ============================================================================

INSERT INTO case_workflow_rules (rule_name, rule_type, conditions, actions, priority, created_by) VALUES
('Auto-assign Investigator on Open', 'status_change', 
 '{"status_change": {"to": "open"}}',
 '{"assign_role": "investigator", "notify": true}', 
 1, 'system'),

('Evidence Deadline Warning', 'time_based',
 '{"status": "under_investigation", "days_since_status": 30}',
 '{"send_notification": {"type": "deadline_warning", "recipients": ["investigator", "evidence_manager"]}}',
 2, 'system'),

('Court Date Reminder', 'time_based',
 '{"status": "pending_court", "days_until_court_date": 7}',
 '{"send_notification": {"type": "court_reminder", "recipients": ["legal_professional", "court_official"]}}',
 3, 'system');

-- ============================================================================
-- UPDATE EXISTING CASES WITH DEFAULT STATUS
-- ============================================================================

-- Set default status for existing cases
UPDATE cases SET status_id = 1 WHERE status_id IS NULL;

-- Generate case numbers for existing cases
UPDATE cases SET case_number = 'CASE-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(id::TEXT, 6, '0') WHERE case_number IS NULL;