-- Run this in Supabase → SQL Editor

-- Detections table
CREATE TABLE IF NOT EXISTS detections (
    id              UUID PRIMARY KEY,
    filename        TEXT,
    original_url    TEXT,
    annotated_url   TEXT,
    detections      JSONB,
    violations      JSONB,
    total_detected  INTEGER DEFAULT 0,
    has_violation   BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_detections_created_at ON detections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detections_has_violation ON detections(has_violation);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE detections ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (tighten this when you add auth)
CREATE POLICY "Allow all" ON detections FOR ALL USING (true);
