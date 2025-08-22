-- Create wizard sessions table for project creation wizard
CREATE TABLE wizard_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- Reference to users table
    project_vision JSONB NOT NULL DEFAULT '{}',
    tech_stack JSONB NOT NULL DEFAULT '{}',
    integrations JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'complete')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wizard_sessions_user_id ON wizard_sessions(user_id);
CREATE INDEX idx_wizard_sessions_status ON wizard_sessions(status);
CREATE INDEX idx_wizard_sessions_created_at ON wizard_sessions(created_at);

-- Add updated_at trigger (function already exists from users migration)
CREATE TRIGGER wizard_sessions_updated_at
    BEFORE UPDATE ON wizard_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();