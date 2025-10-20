-- Create event_store table for event sourcing and audit trail
CREATE TABLE IF NOT EXISTS event_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    aggregate_id VARCHAR(255),
    aggregate_type VARCHAR(255),
    aggregate_version INTEGER DEFAULT 1,
    event_data JSONB NOT NULL,
    metadata JSONB,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED', 'REPLAYED')),
    correlation_id VARCHAR(255),
    causation_id VARCHAR(255),
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    processed_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    occurred_at TIMESTAMP NOT NULL,
    content_hash VARCHAR(255),
    previous_event_id UUID,
    sequence_number BIGSERIAL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_store_aggregate ON event_store(aggregate_id, aggregate_type);
CREATE INDEX IF NOT EXISTS idx_event_store_event_type ON event_store(event_type);
CREATE INDEX IF NOT EXISTS idx_event_store_status ON event_store(status);
CREATE INDEX IF NOT EXISTS idx_event_store_created_at ON event_store(created_at);
CREATE INDEX IF NOT EXISTS idx_event_store_occurred_at ON event_store(occurred_at);
CREATE INDEX IF NOT EXISTS idx_event_store_user_id ON event_store(user_id);
CREATE INDEX IF NOT EXISTS idx_event_store_correlation_id ON event_store(correlation_id);
CREATE INDEX IF NOT EXISTS idx_event_store_sequence_number ON event_store(sequence_number);

-- Create unique index on event_id for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_store_event_id ON event_store(event_id);

-- Add foreign key constraint to previous_event_id (self-referencing)
ALTER TABLE event_store 
ADD CONSTRAINT fk_event_store_previous_event 
FOREIGN KEY (previous_event_id) REFERENCES event_store(id) 
ON DELETE SET NULL;

-- Create a function to automatically update sequence numbers
CREATE OR REPLACE FUNCTION update_event_sequence()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sequence_number IS NULL THEN
        SELECT COALESCE(MAX(sequence_number), 0) + 1 
        INTO NEW.sequence_number 
        FROM event_store;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set sequence numbers
CREATE TRIGGER trigger_update_event_sequence
    BEFORE INSERT ON event_store
    FOR EACH ROW
    EXECUTE FUNCTION update_event_sequence();

-- Grant permissions to application roles
GRANT SELECT, INSERT, UPDATE ON event_store TO authenticated;
GRANT SELECT ON event_store TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE event_store_sequence_number_seq TO authenticated;

-- Create a view for event statistics
CREATE OR REPLACE VIEW event_store_statistics AS
SELECT 
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE status = 'PENDING') as pending_events,
    COUNT(*) FILTER (WHERE status = 'PROCESSED') as processed_events,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed_events,
    COUNT(*) FILTER (WHERE status = 'REPLAYED') as replayed_events,
    MIN(occurred_at) as oldest_event,
    MAX(occurred_at) as newest_event,
    COUNT(DISTINCT event_type) as unique_event_types,
    COUNT(DISTINCT aggregate_type) as unique_aggregate_types
FROM event_store;

-- Grant permissions on the view
GRANT SELECT ON event_store_statistics TO authenticated;

-- Create a function to clean up old events
CREATE OR REPLACE FUNCTION cleanup_old_events(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM event_store 
    WHERE occurred_at < (CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_days)
    AND status = 'PROCESSED';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get event stream for an aggregate
CREATE OR REPLACE FUNCTION get_event_stream(
    p_aggregate_id VARCHAR(255),
    p_aggregate_type VARCHAR(255) DEFAULT NULL,
    p_from_version INTEGER DEFAULT 1,
    p_to_version INTEGER DEFAULT NULL
)
RETURNS TABLE (
    event_id VARCHAR(255),
    event_type VARCHAR(255),
    aggregate_version INTEGER,
    event_data JSONB,
    occurred_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        es.event_id,
        es.event_type,
        es.aggregate_version,
        es.event_data,
        es.occurred_at
    FROM event_store es
    WHERE es.aggregate_id = p_aggregate_id
    AND (p_aggregate_type IS NULL OR es.aggregate_type = p_aggregate_type)
    AND es.aggregate_version >= p_from_version
    AND (p_to_version IS NULL OR es.aggregate_version <= p_to_version)
    ORDER BY es.aggregate_version ASC;
END;
$$ LANGUAGE plpgsql;