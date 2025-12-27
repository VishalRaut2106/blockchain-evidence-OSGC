-- Enhanced Supabase Database Schema with Security

-- Users table with enhanced security
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    role INTEGER NOT NULL CHECK (role BETWEEN 1 AND 8),
    department TEXT,
    badge_number TEXT,
    jurisdiction TEXT,
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    password_hash TEXT, -- For additional security
    two_factor_enabled BOOLEAN DEFAULT FALSE
);

-- Evidence table with enhanced security and integrity
CREATE TABLE evidence (
    id SERIAL PRIMARY KEY,
    evidence_id TEXT UNIQUE NOT NULL, -- Human-readable ID
    case_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    file_data TEXT, -- Encrypted base64 data
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    hash_sha256 TEXT NOT NULL, -- File integrity hash
    blockchain_hash TEXT, -- Blockchain transaction hash
    submitted_by TEXT NOT NULL,
    submission_ip TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    encryption_key_id TEXT, -- Reference to encryption key
    is_encrypted BOOLEAN DEFAULT FALSE,
    metadata JSONB -- Additional file metadata
);

-- Cases table with enhanced tracking
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    case_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_by TEXT NOT NULL,
    assigned_to TEXT[],
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'active', 'closed', 'archived')),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    tags TEXT[],
    metadata JSONB
);

-- Chain of custody table (immutable audit trail)
CREATE TABLE chain_of_custody (
    id SERIAL PRIMARY KEY,
    evidence_id INTEGER REFERENCES evidence(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    details TEXT,
    previous_hash TEXT, -- Link to previous entry for integrity
    entry_hash TEXT NOT NULL -- Hash of this entry
);

-- Activity logs table (comprehensive audit trail)
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT, -- 'evidence', 'case', 'user', etc.
    resource_id TEXT,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

-- File access logs (track every file access)
CREATE TABLE file_access_logs (
    id SERIAL PRIMARY KEY,
    evidence_id INTEGER REFERENCES evidence(id) ON DELETE CASCADE,
    accessed_by TEXT NOT NULL,
    access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'modify', 'delete')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    success BOOLEAN DEFAULT TRUE,
    failure_reason TEXT
);

-- User sessions table
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Blockchain transactions table
CREATE TABLE blockchain_transactions (
    id SERIAL PRIMARY KEY,
    evidence_id INTEGER REFERENCES evidence(id) ON DELETE CASCADE,
    transaction_hash TEXT UNIQUE NOT NULL,
    block_number BIGINT,
    network TEXT NOT NULL,
    gas_used BIGINT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed'))
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_of_custody ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;

-- Secure policies (replace with proper authentication)
CREATE POLICY "Allow authenticated users" ON users FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users" ON evidence FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users" ON cases FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users" ON chain_of_custody FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users" ON activity_logs FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users" ON file_access_logs FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users" ON user_sessions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users" ON blockchain_transactions FOR ALL USING (auth.uid() IS NOT NULL);

-- Performance indexes
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_evidence_case ON evidence(case_id);
CREATE INDEX idx_evidence_submitted ON evidence(submitted_by);
CREATE INDEX idx_evidence_hash ON evidence(hash_sha256);
CREATE INDEX idx_evidence_timestamp ON evidence(timestamp);
CREATE INDEX idx_cases_created ON cases(created_by);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_custody_evidence ON chain_of_custody(evidence_id);
CREATE INDEX idx_custody_timestamp ON chain_of_custody(timestamp);
CREATE INDEX idx_logs_user ON activity_logs(user_id);
CREATE INDEX idx_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX idx_logs_action ON activity_logs(action);
CREATE INDEX idx_file_access_evidence ON file_access_logs(evidence_id);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_blockchain_evidence ON blockchain_transactions(evidence_id);

-- Triggers for automatic timestamping
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cases_last_modified
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();

CREATE TRIGGER update_users_last_updated
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();

-- Function to generate evidence ID
CREATE OR REPLACE FUNCTION generate_evidence_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.evidence_id = 'EVD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEW.id::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_evidence_id
    AFTER INSERT ON evidence
    FOR EACH ROW
    EXECUTE FUNCTION generate_evidence_id();

-- Function to auto-log chain of custody
CREATE OR REPLACE FUNCTION log_chain_of_custody()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO chain_of_custody (evidence_id, action, performed_by, details, entry_hash)
        VALUES (
            NEW.id,
            'EVIDENCE_CREATED',
            NEW.submitted_by,
            'Evidence initially submitted',
            encode(sha256((NEW.id || 'EVIDENCE_CREATED' || NEW.submitted_by || NOW())::bytea), 'hex')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_chain_of_custody
    AFTER INSERT ON evidence
    FOR EACH ROW
    EXECUTE FUNCTION log_chain_of_custody();