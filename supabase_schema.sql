-- ══════════════════════════════════════════════════════
-- WorkGuardAI — Add PPE columns to site_inspections
-- Run this in Supabase → SQL Editor
-- ══════════════════════════════════════════════════════

-- site_inspections already exists, just add the missing PPE columns
ALTER TABLE site_inspections
  ADD COLUMN IF NOT EXISTS original_url    TEXT,
  ADD COLUMN IF NOT EXISTS annotated_url   TEXT,
  ADD COLUMN IF NOT EXISTS detections      JSONB,
  ADD COLUMN IF NOT EXISTS violations      JSONB,
  ADD COLUMN IF NOT EXISTS total_detected  INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_site_inspections_created_at    ON site_inspections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_inspections_has_violation  ON site_inspections(has_violation);
CREATE INDEX IF NOT EXISTS idx_site_inspections_supervisor_id  ON site_inspections(supervisor_id);
