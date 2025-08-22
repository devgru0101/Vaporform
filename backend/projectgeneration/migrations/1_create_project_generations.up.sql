-- Project Generation microservice database schema

-- Project generations table (tracks generation requests and status)
CREATE TABLE project_generations (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    project_name VARCHAR(255) NOT NULL,
    project_data JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'analyzing', 'templating', 'integrating', 'generating', 'completed', 'error')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    message TEXT,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- Generated files table (stores individual file content)
CREATE TABLE generated_files (
    id VARCHAR(255) PRIMARY KEY,
    generation_id VARCHAR(255) NOT NULL REFERENCES project_generations(id) ON DELETE CASCADE,
    file_path VARCHAR(1000) NOT NULL,
    file_content TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100),
    category VARCHAR(50) CHECK (category IN ('config', 'source', 'asset', 'documentation', 'test')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Generation templates mapping (tracks which templates were used)
CREATE TABLE generation_templates (
    id VARCHAR(255) PRIMARY KEY,
    generation_id VARCHAR(255) NOT NULL REFERENCES project_generations(id) ON DELETE CASCADE,
    template_id VARCHAR(255) NOT NULL,
    template_version VARCHAR(50),
    customizations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Generation integrations mapping (tracks which integrations were configured)
CREATE TABLE generation_integrations (
    id VARCHAR(255) PRIMARY KEY,
    generation_id VARCHAR(255) NOT NULL REFERENCES project_generations(id) ON DELETE CASCADE,
    integration_type VARCHAR(100) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'configured' CHECK (status IN ('configured', 'active', 'error')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Generation analytics (tracks usage patterns and performance)
CREATE TABLE generation_analytics (
    id VARCHAR(255) PRIMARY KEY,
    generation_id VARCHAR(255) NOT NULL REFERENCES project_generations(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    project_complexity INTEGER,
    file_count INTEGER,
    total_size_bytes BIGINT,
    generation_time_seconds INTEGER,
    template_used VARCHAR(255),
    integrations_count INTEGER,
    success BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Download tracking (tracks project downloads)
CREATE TABLE generation_downloads (
    id VARCHAR(255) PRIMARY KEY,
    generation_id VARCHAR(255) NOT NULL REFERENCES project_generations(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    download_url VARCHAR(500),
    expires_at TIMESTAMPTZ,
    download_count INTEGER NOT NULL DEFAULT 0,
    last_downloaded TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_project_generations_user_id ON project_generations(user_id);
CREATE INDEX idx_project_generations_status ON project_generations(status);
CREATE INDEX idx_project_generations_created_at ON project_generations(created_at DESC);
CREATE INDEX idx_project_generations_completed_at ON project_generations(completed_at DESC);

CREATE INDEX idx_generated_files_generation_id ON generated_files(generation_id);
CREATE INDEX idx_generated_files_file_path ON generated_files(file_path);
CREATE INDEX idx_generated_files_category ON generated_files(category);

CREATE INDEX idx_generation_templates_generation_id ON generation_templates(generation_id);
CREATE INDEX idx_generation_templates_template_id ON generation_templates(template_id);

CREATE INDEX idx_generation_integrations_generation_id ON generation_integrations(generation_id);
CREATE INDEX idx_generation_integrations_type ON generation_integrations(integration_type);
CREATE INDEX idx_generation_integrations_provider ON generation_integrations(provider);

CREATE INDEX idx_generation_analytics_user_id ON generation_analytics(user_id);
CREATE INDEX idx_generation_analytics_template_used ON generation_analytics(template_used);
CREATE INDEX idx_generation_analytics_success ON generation_analytics(success);
CREATE INDEX idx_generation_analytics_created_at ON generation_analytics(created_at DESC);

CREATE INDEX idx_generation_downloads_generation_id ON generation_downloads(generation_id);
CREATE INDEX idx_generation_downloads_user_id ON generation_downloads(user_id);
CREATE INDEX idx_generation_downloads_expires_at ON generation_downloads(expires_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_generation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_generations_updated_at
    BEFORE UPDATE ON project_generations
    FOR EACH ROW EXECUTE FUNCTION update_generation_updated_at();

-- Function to automatically clean up expired downloads
CREATE OR REPLACE FUNCTION cleanup_expired_downloads()
RETURNS VOID AS $$
BEGIN
    DELETE FROM generation_downloads 
    WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate generation statistics
CREATE OR REPLACE FUNCTION get_generation_stats(user_id_param VARCHAR DEFAULT NULL)
RETURNS TABLE(
    total_generations INTEGER,
    successful_generations INTEGER,
    average_generation_time NUMERIC,
    most_used_template VARCHAR,
    total_files_generated INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_generations,
        COUNT(CASE WHEN ga.success THEN 1 END)::INTEGER as successful_generations,
        AVG(ga.generation_time_seconds)::NUMERIC as average_generation_time,
        MODE() WITHIN GROUP (ORDER BY ga.template_used) as most_used_template,
        SUM(ga.file_count)::INTEGER as total_files_generated
    FROM generation_analytics ga
    WHERE user_id_param IS NULL OR ga.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;