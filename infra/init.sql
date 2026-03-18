-- Graph entities table
CREATE TABLE IF NOT EXISTS graph_entities (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entities_type ON graph_entities(type);
CREATE INDEX idx_entities_name ON graph_entities(name);
CREATE INDEX idx_entities_metadata ON graph_entities USING gin(metadata);

-- Graph relations table
CREATE TABLE IF NOT EXISTS graph_relations (
    id TEXT PRIMARY KEY,
    from_id TEXT NOT NULL REFERENCES graph_entities(id) ON DELETE CASCADE,
    to_id TEXT NOT NULL REFERENCES graph_entities(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    weight DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_relations_from ON graph_relations(from_id);
CREATE INDEX idx_relations_to ON graph_relations(to_id);
CREATE INDEX idx_relations_type ON graph_relations(type);

-- Event store table
CREATE TABLE IF NOT EXISTS event_store (
    sequence_number BIGSERIAL PRIMARY KEY,
    event_id TEXT UNIQUE NOT NULL,
    correlation_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    source TEXT NOT NULL,
    payload JSONB NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_correlation ON event_store(correlation_id);
CREATE INDEX idx_events_type ON event_store(event_type);
CREATE INDEX idx_events_source ON event_store(source);
CREATE INDEX idx_events_timestamp ON event_store(timestamp);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    task_description TEXT NOT NULL,
    task_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    current_phase TEXT NOT NULL DEFAULT 'IDLE',
    context JSONB NOT NULL DEFAULT '{}',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER
);

CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_started ON sessions(started_at DESC);

-- Preferences table
CREATE TABLE IF NOT EXISTS preferences (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    weight DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    source TEXT NOT NULL,
    learned_from TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_preferences_key ON preferences(key);
CREATE INDEX idx_preferences_source ON preferences(source);
