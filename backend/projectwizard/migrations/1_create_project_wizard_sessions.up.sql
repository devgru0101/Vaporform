CREATE TABLE project_creation_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_step INTEGER NOT NULL DEFAULT 0,
    steps JSONB NOT NULL DEFAULT '[]',
    project_data JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned'))
);

CREATE TABLE project_creation_steps (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    step_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT false,
    step_data JSONB DEFAULT '{}',
    validation_errors JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, step_id)
);

CREATE TABLE project_generation_results (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    generated_files JSONB NOT NULL DEFAULT '{}',
    deployment_instructions JSONB NOT NULL DEFAULT '[]',
    template_used VARCHAR(255),
    integrations_configured JSONB DEFAULT '[]',
    generation_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_creation_sessions_user_id ON project_creation_sessions(user_id);
CREATE INDEX idx_project_creation_sessions_status ON project_creation_sessions(status);
CREATE INDEX idx_project_creation_steps_session_id ON project_creation_steps(session_id);