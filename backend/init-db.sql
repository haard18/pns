-- Initialize PNS Database Schema

-- Create domains table
CREATE TABLE IF NOT EXISTS domains (
    id SERIAL PRIMARY KEY,
    name_hash VARCHAR(66) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(42) NOT NULL,
    resolver VARCHAR(42),
    expiration BIGINT,
    last_updated_block BIGINT NOT NULL,
    last_updated_tx VARCHAR(66) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create event logs table
CREATE TABLE IF NOT EXISTS event_logs (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    name_hash VARCHAR(66) NOT NULL,
    name VARCHAR(255),
    owner VARCHAR(42),
    resolver VARCHAR(42),
    expiration BIGINT,
    block_number BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    transaction_index INTEGER,
    log_index INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB,
    UNIQUE(transaction_hash, log_index)
);

-- Create text records table
CREATE TABLE IF NOT EXISTS text_records (
    id SERIAL PRIMARY KEY,
    name_hash VARCHAR(66) NOT NULL,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    block_number BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name_hash, key)
);

-- Create address records table
CREATE TABLE IF NOT EXISTS address_records (
    id SERIAL PRIMARY KEY,
    name_hash VARCHAR(66) NOT NULL,
    coin_type INTEGER NOT NULL,
    address TEXT NOT NULL,
    block_number BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name_hash, coin_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_domains_owner ON domains(owner);
CREATE INDEX IF NOT EXISTS idx_domains_name ON domains(name);
CREATE INDEX IF NOT EXISTS idx_domains_expiration ON domains(expiration);

CREATE INDEX IF NOT EXISTS idx_event_logs_name_hash ON event_logs(name_hash);
CREATE INDEX IF NOT EXISTS idx_event_logs_event_name ON event_logs(event_name);
CREATE INDEX IF NOT EXISTS idx_event_logs_block_number ON event_logs(block_number);
CREATE INDEX IF NOT EXISTS idx_event_logs_owner ON event_logs(owner);

CREATE INDEX IF NOT EXISTS idx_text_records_name_hash ON text_records(name_hash);
CREATE INDEX IF NOT EXISTS idx_address_records_name_hash ON address_records(name_hash);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_text_records_updated_at BEFORE UPDATE ON text_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_address_records_updated_at BEFORE UPDATE ON address_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial metadata
CREATE TABLE IF NOT EXISTS indexer_metadata (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: last_scanned_block will be stored in Redis for faster access
-- This table can be used as a backup or for analytics
INSERT INTO indexer_metadata (key, value) VALUES ('schema_version', '1.0.0')
ON CONFLICT (key) DO NOTHING;
