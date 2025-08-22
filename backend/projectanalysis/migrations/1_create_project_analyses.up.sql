CREATE TABLE project_analyses (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    requirements JSONB NOT NULL,
    recommendations JSONB NOT NULL,
    estimated_complexity INTEGER NOT NULL CHECK (estimated_complexity >= 1 AND estimated_complexity <= 10),
    estimated_timeline VARCHAR(50) NOT NULL,
    risk_factors JSONB NOT NULL DEFAULT '[]',
    success_factors JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feature_suggestions (
    id VARCHAR(255) PRIMARY KEY,
    project_type VARCHAR(100) NOT NULL,
    target_audience VARCHAR(255),
    inspiration_apps JSONB DEFAULT '[]',
    suggested_features JSONB NOT NULL DEFAULT '[]',
    complexity INTEGER NOT NULL,
    implementation_order JSONB NOT NULL DEFAULT '[]',
    dependencies JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complexity_assessments (
    id VARCHAR(255) PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    base_complexity INTEGER NOT NULL,
    feature_complexity INTEGER NOT NULL,
    total_complexity INTEGER NOT NULL,
    breakdown JSONB NOT NULL DEFAULT '{}',
    recommendations JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_analyses_user_id ON project_analyses(user_id);
CREATE INDEX idx_project_analyses_created_at ON project_analyses(created_at);
CREATE INDEX idx_feature_suggestions_project_type ON feature_suggestions(project_type);