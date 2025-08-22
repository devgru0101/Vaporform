-- Template Management microservice database schema

CREATE TABLE templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    complexity INTEGER NOT NULL CHECK (complexity >= 1 AND complexity <= 10),
    tech_stack JSONB NOT NULL,
    features JSONB NOT NULL DEFAULT '[]',
    supported_integrations JSONB NOT NULL DEFAULT '[]',
    variables JSONB NOT NULL DEFAULT '[]',
    prerequisites JSONB NOT NULL DEFAULT '[]',
    file_structure JSONB NOT NULL DEFAULT '{}',
    config_files JSONB NOT NULL DEFAULT '{}',
    dependencies JSONB NOT NULL DEFAULT '{}',
    dev_dependencies JSONB NOT NULL DEFAULT '{}',
    estimated_setup_time VARCHAR(100) NOT NULL,
    maintenance_level VARCHAR(20) NOT NULL CHECK (maintenance_level IN ('low', 'medium', 'high')),
    popularity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    search_vector TSVECTOR
);

-- Template customizations table (user-specific template configurations)
CREATE TABLE template_customizations (
    id VARCHAR(255) PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    customization_name VARCHAR(255) NOT NULL,
    variables JSONB NOT NULL DEFAULT '{}',
    selected_features JSONB NOT NULL DEFAULT '[]',
    customizations JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMPTZ
);

-- Template usage analytics
CREATE TABLE template_usage (
    id VARCHAR(255) PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'download', 'generate', 'customize')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Template reviews and ratings
CREATE TABLE template_reviews (
    id VARCHAR(255) PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    helpful_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_complexity ON templates(complexity);
CREATE INDEX idx_templates_popularity ON templates(popularity DESC);
CREATE INDEX idx_templates_last_updated ON templates(last_updated DESC);
CREATE INDEX idx_templates_active ON templates(is_active);
CREATE INDEX idx_templates_search ON templates USING GIN(search_vector);

CREATE INDEX idx_template_customizations_template_id ON template_customizations(template_id);
CREATE INDEX idx_template_customizations_user_id ON template_customizations(user_id);
CREATE INDEX idx_template_customizations_last_used ON template_customizations(last_used DESC);

CREATE INDEX idx_template_usage_template_id ON template_usage(template_id);
CREATE INDEX idx_template_usage_user_id ON template_usage(user_id);
CREATE INDEX idx_template_usage_action ON template_usage(action);
CREATE INDEX idx_template_usage_created_at ON template_usage(created_at DESC);

CREATE INDEX idx_template_reviews_template_id ON template_reviews(template_id);
CREATE INDEX idx_template_reviews_user_id ON template_reviews(user_id);
CREATE INDEX idx_template_reviews_rating ON template_reviews(rating);

-- Trigger to update search vector when template content changes
CREATE OR REPLACE FUNCTION update_template_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.name, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' || 
        COALESCE(array_to_string(ARRAY(SELECT jsonb_array_elements_text(NEW.features)), ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_templates_search_vector
    BEFORE INSERT OR UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_template_search_vector();

-- Trigger to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_template_updated_at();