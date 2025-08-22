CREATE TABLE templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    complexity INTEGER NOT NULL DEFAULT 1 CHECK (complexity >= 1 AND complexity <= 10),
    tech_stack JSONB NOT NULL DEFAULT '{}',
    features JSONB NOT NULL DEFAULT '[]',
    supported_integrations JSONB NOT NULL DEFAULT '[]',
    variables JSONB NOT NULL DEFAULT '[]',
    prerequisites JSONB NOT NULL DEFAULT '[]',
    file_structure JSONB NOT NULL DEFAULT '{}',
    config_files JSONB NOT NULL DEFAULT '{}',
    dependencies JSONB NOT NULL DEFAULT '{}',
    dev_dependencies JSONB NOT NULL DEFAULT '{}',
    estimated_setup_time VARCHAR(100) NOT NULL DEFAULT '15 minutes',
    maintenance_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (maintenance_level IN ('low', 'medium', 'high')),
    popularity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    search_vector tsvector,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_complexity ON templates(complexity);
CREATE INDEX idx_templates_popularity ON templates(popularity DESC);
CREATE INDEX idx_templates_is_active ON templates(is_active);
CREATE INDEX idx_templates_search_vector ON templates USING GIN(search_vector);

-- Create trigger to automatically update search_vector
CREATE OR REPLACE FUNCTION update_templates_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', NEW.name || ' ' || NEW.description || ' ' || 
        COALESCE(array_to_string(ARRAY(SELECT jsonb_array_elements_text(NEW.features)), ' '), ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER templates_search_vector_update
    BEFORE INSERT OR UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_templates_search_vector();