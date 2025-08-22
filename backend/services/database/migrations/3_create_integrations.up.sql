-- Create integrations tables
CREATE TABLE integrations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'beta')),
    
    -- Integration Configuration
    auth_type VARCHAR(50) NOT NULL DEFAULT 'api_key' CHECK (auth_type IN ('api_key', 'oauth2', 'webhook', 'none')),
    required_credentials JSONB NOT NULL DEFAULT '[]',
    optional_credentials JSONB NOT NULL DEFAULT '[]',
    
    -- Documentation and Setup
    setup_instructions TEXT,
    documentation_url VARCHAR(500),
    support_url VARCHAR(500),
    webhook_url VARCHAR(500),
    
    -- Features and Capabilities
    supported_events JSONB NOT NULL DEFAULT '[]',
    supported_actions JSONB NOT NULL DEFAULT '[]',
    features JSONB NOT NULL DEFAULT '[]',
    
    -- Configuration Schema
    config_schema JSONB NOT NULL DEFAULT '{}',
    default_config JSONB NOT NULL DEFAULT '{}',
    
    -- Compatibility
    supported_frameworks JSONB NOT NULL DEFAULT '[]',
    min_framework_version VARCHAR(50),
    
    -- Pricing and Limits
    pricing_model VARCHAR(50) DEFAULT 'free' CHECK (pricing_model IN ('free', 'freemium', 'paid', 'enterprise')),
    rate_limits JSONB NOT NULL DEFAULT '{}',
    
    -- Metadata
    icon_url VARCHAR(500),
    homepage_url VARCHAR(500),
    popularity INTEGER NOT NULL DEFAULT 0,
    install_count INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ,
    
    -- Search and Discovery
    tags JSONB NOT NULL DEFAULT '[]',
    search_vector tsvector,
    
    -- Flags
    is_official BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    requires_approval BOOLEAN NOT NULL DEFAULT false,
    
    -- Relationships
    created_by VARCHAR(255),
    maintained_by VARCHAR(255)
);

-- User Integration Configurations
CREATE TABLE user_integrations (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- Reference to users table
    integration_id VARCHAR(255) NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    project_id VARCHAR(255),
    
    -- Configuration
    config JSONB NOT NULL DEFAULT '{}',
    credentials JSONB NOT NULL DEFAULT '{}',
    
    -- State
    status VARCHAR(20) NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'pending')),
    last_sync TIMESTAMPTZ,
    error_message TEXT,
    sync_count INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMPTZ,
    
    UNIQUE(user_id, integration_id, project_id)
);

-- Integration Events/Webhooks Log
CREATE TABLE integration_events (
    id VARCHAR(255) PRIMARY KEY,
    user_integration_id VARCHAR(255) NOT NULL REFERENCES user_integrations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    
    -- Processing
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'retrying')),
    processed_at TIMESTAMPTZ,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    error_message TEXT,
    
    -- Metadata
    source VARCHAR(100),
    external_id VARCHAR(255),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_integrations_category ON integrations(category);
CREATE INDEX idx_integrations_provider ON integrations(provider);
CREATE INDEX idx_integrations_status ON integrations(status);
CREATE INDEX idx_integrations_popularity ON integrations(popularity DESC);
CREATE INDEX idx_integrations_search_vector ON integrations USING GIN(search_vector);
CREATE INDEX idx_integrations_tags ON integrations USING GIN(tags);

CREATE INDEX idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX idx_user_integrations_project_id ON user_integrations(project_id);
CREATE INDEX idx_user_integrations_status ON user_integrations(status);
CREATE INDEX idx_user_integrations_integration_id ON user_integrations(integration_id);

CREATE INDEX idx_integration_events_user_integration_id ON integration_events(user_integration_id);
CREATE INDEX idx_integration_events_status ON integration_events(status);
CREATE INDEX idx_integration_events_created_at ON integration_events(created_at);
CREATE INDEX idx_integration_events_event_type ON integration_events(event_type);

-- Create trigger to automatically update search_vector for integrations
CREATE OR REPLACE FUNCTION update_integrations_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        NEW.name || ' ' || 
        NEW.display_name || ' ' || 
        NEW.description || ' ' || 
        COALESCE(array_to_string(ARRAY(SELECT jsonb_array_elements_text(NEW.tags)), ' '), '') || ' ' ||
        COALESCE(array_to_string(ARRAY(SELECT jsonb_array_elements_text(NEW.features)), ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integrations_search_vector_update
    BEFORE INSERT OR UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_integrations_search_vector();

-- Note: update_updated_at_column function already exists from users migration
CREATE TRIGGER integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_integrations_updated_at
    BEFORE UPDATE ON user_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();