-- Vaporform Database Initialization
-- This script sets up the initial database schema

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('web', 'mobile', 'desktop', 'api', 'ai', 'other')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'collaborator' CHECK (role IN ('owner', 'collaborator', 'viewer')),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- AI sessions table for tracking AI interactions
CREATE TABLE IF NOT EXISTS ai_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('code_generation', 'code_review', 'debugging', 'testing')),
    request_data JSONB NOT NULL,
    response_data JSONB,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Project files table
CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    content TEXT,
    hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    UNIQUE(project_id, file_path)
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- API keys table for service authentication
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user ON ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_project ON ai_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_files_updated_at BEFORE UPDATE ON project_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role, email_verified) 
VALUES (
    'admin@vaporform.dev',
    crypt('admin123', gen_salt('bf')),
    'Vaporform Admin',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Container management tables
CREATE TABLE IF NOT EXISTS containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    docker_container_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    image VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'creating' CHECK (status IN ('creating', 'running', 'stopped', 'error', 'removed')),
    ports JSONB DEFAULT '[]',
    environment JSONB DEFAULT '{}',
    volumes JSONB DEFAULT '[]',
    resources JSONB DEFAULT '{}',
    health JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    UNIQUE(project_id, name)
);

-- Virtual file system tables
CREATE TABLE IF NOT EXISTS virtual_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_path VARCHAR(1000) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) CHECK (file_type IN ('file', 'directory')),
    file_size BIGINT DEFAULT 0,
    mime_type VARCHAR(255),
    content TEXT,
    binary_content BYTEA,
    hash VARCHAR(64),
    permissions JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id),
    UNIQUE(project_id, file_path)
);

-- File versions for version control
CREATE TABLE IF NOT EXISTS file_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES virtual_files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT,
    hash VARCHAR(64),
    file_size BIGINT,
    commit_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    UNIQUE(file_id, version_number)
);

-- File annotations (comments, todos, etc.)
CREATE TABLE IF NOT EXISTS file_annotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES virtual_files(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    column_number INTEGER DEFAULT 0,
    annotation_type VARCHAR(50) CHECK (annotation_type IN ('comment', 'todo', 'error', 'warning', 'info')),
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP
);

-- Collaboration sessions
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    session_name VARCHAR(255),
    current_document_id UUID REFERENCES virtual_files(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Session participants
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('owner', 'collaborator', 'viewer')),
    color VARCHAR(7), -- Hex color code
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT true,
    UNIQUE(session_id, user_id)
);

-- WebSocket connections tracking
CREATE TABLE IF NOT EXISTS websocket_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    connection_id VARCHAR(255) UNIQUE NOT NULL,
    client_type VARCHAR(50) CHECK (client_type IN ('vscode', 'web', 'mobile', 'api')),
    client_version VARCHAR(100),
    capabilities JSONB DEFAULT '[]',
    ip_address INET,
    user_agent TEXT,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Cursor positions for real-time collaboration
CREATE TABLE IF NOT EXISTS cursor_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_id UUID REFERENCES virtual_files(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    column_number INTEGER NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, user_id, file_id)
);

-- Text selections for real-time collaboration
CREATE TABLE IF NOT EXISTS text_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_id UUID REFERENCES virtual_files(id) ON DELETE CASCADE,
    start_line INTEGER NOT NULL,
    start_column INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    end_column INTEGER NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, user_id, file_id)
);

-- Operational transforms for collaborative editing
CREATE TABLE IF NOT EXISTS operational_transforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    file_id UUID REFERENCES virtual_files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    operation_type VARCHAR(20) CHECK (operation_type IN ('insert', 'delete', 'retain')),
    position INTEGER NOT NULL,
    content TEXT,
    length INTEGER,
    applied BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages for collaboration sessions
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'code_share')),
    mentions JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Container port allocations tracking
CREATE TABLE IF NOT EXISTS container_ports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_id UUID REFERENCES containers(id) ON DELETE CASCADE,
    internal_port INTEGER NOT NULL,
    external_port INTEGER NOT NULL,
    protocol VARCHAR(10) DEFAULT 'tcp' CHECK (protocol IN ('tcp', 'udp')),
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(external_port) -- Ensure no port conflicts
);

-- Container logs for debugging
CREATE TABLE IF NOT EXISTS container_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_id UUID REFERENCES containers(id) ON DELETE CASCADE,
    log_level VARCHAR(20) DEFAULT 'info',
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'stdout'
);

-- Performance metrics for containers
CREATE TABLE IF NOT EXISTS container_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_id UUID REFERENCES containers(id) ON DELETE CASCADE,
    cpu_usage DECIMAL(5,2), -- Percentage
    memory_usage BIGINT, -- Bytes
    memory_limit BIGINT, -- Bytes
    network_rx_bytes BIGINT,
    network_tx_bytes BIGINT,
    disk_read_bytes BIGINT,
    disk_write_bytes BIGINT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Additional indexes for new tables
CREATE INDEX IF NOT EXISTS idx_containers_project ON containers(project_id);
CREATE INDEX IF NOT EXISTS idx_containers_status ON containers(status);
CREATE INDEX IF NOT EXISTS idx_containers_docker_id ON containers(docker_container_id);

CREATE INDEX IF NOT EXISTS idx_virtual_files_project ON virtual_files(project_id);
CREATE INDEX IF NOT EXISTS idx_virtual_files_path ON virtual_files(file_path);
CREATE INDEX IF NOT EXISTS idx_virtual_files_type ON virtual_files(file_type);
CREATE INDEX IF NOT EXISTS idx_virtual_files_hash ON virtual_files(hash);

CREATE INDEX IF NOT EXISTS idx_file_versions_file ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_number ON file_versions(version_number);

CREATE INDEX IF NOT EXISTS idx_file_annotations_file ON file_annotations(file_id);
CREATE INDEX IF NOT EXISTS idx_file_annotations_type ON file_annotations(annotation_type);
CREATE INDEX IF NOT EXISTS idx_file_annotations_resolved ON file_annotations(resolved);

CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_project ON collaboration_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_active ON collaboration_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_online ON session_participants(is_online);

CREATE INDEX IF NOT EXISTS idx_websocket_connections_user ON websocket_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_websocket_connections_session ON websocket_connections(session_id);
CREATE INDEX IF NOT EXISTS idx_websocket_connections_active ON websocket_connections(is_active);

CREATE INDEX IF NOT EXISTS idx_cursor_positions_session ON cursor_positions(session_id);
CREATE INDEX IF NOT EXISTS idx_cursor_positions_user ON cursor_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_cursor_positions_file ON cursor_positions(file_id);

CREATE INDEX IF NOT EXISTS idx_text_selections_session ON text_selections(session_id);
CREATE INDEX IF NOT EXISTS idx_text_selections_user ON text_selections(user_id);

CREATE INDEX IF NOT EXISTS idx_operational_transforms_session ON operational_transforms(session_id);
CREATE INDEX IF NOT EXISTS idx_operational_transforms_file ON operational_transforms(file_id);
CREATE INDEX IF NOT EXISTS idx_operational_transforms_applied ON operational_transforms(applied);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_container_ports_container ON container_ports(container_id);
CREATE INDEX IF NOT EXISTS idx_container_ports_external ON container_ports(external_port);

CREATE INDEX IF NOT EXISTS idx_container_logs_container ON container_logs(container_id);
CREATE INDEX IF NOT EXISTS idx_container_logs_timestamp ON container_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_container_metrics_container ON container_metrics(container_id);
CREATE INDEX IF NOT EXISTS idx_container_metrics_recorded ON container_metrics(recorded_at);

-- Apply update triggers to new tables
CREATE TRIGGER update_containers_updated_at BEFORE UPDATE ON containers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_virtual_files_updated_at BEFORE UPDATE ON virtual_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collaboration_sessions_updated_at BEFORE UPDATE ON collaboration_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO users (email, password_hash, name, role, email_verified) 
VALUES (
    'user@vaporform.dev',
    crypt('user123', gen_salt('bf')),
    'Test User',
    'user',
    true
) ON CONFLICT (email) DO NOTHING;