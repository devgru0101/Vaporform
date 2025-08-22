CREATE TABLE integration_providers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    logo_url VARCHAR(500),
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    setup_time VARCHAR(100) NOT NULL,
    pricing JSONB NOT NULL,
    features JSONB NOT NULL DEFAULT '[]',
    requirements JSONB NOT NULL DEFAULT '[]',
    documentation JSONB NOT NULL,
    configuration JSONB NOT NULL,
    compatibility JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    popularity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE integration_configurations (
    id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255),
    user_id VARCHAR(255),
    integration_type VARCHAR(100) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    environment_variables JSONB NOT NULL DEFAULT '{}',
    webhook_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'configured' CHECK (status IN ('configured', 'active', 'error', 'disabled')),
    last_tested TIMESTAMPTZ,
    test_results JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_integration_providers_type ON integration_providers(type);
CREATE INDEX idx_integration_providers_category ON integration_providers(category);
CREATE INDEX idx_integration_configurations_project_id ON integration_configurations(project_id);