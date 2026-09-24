-- Add missing columns to events table to match admin form and user-facing Events page
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) CHECK (category IN ('Festival', 'Cultural', 'Sports', 'Religious', 'Food', 'Music', 'Arts', 'Other')),
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS venue VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ticket_price VARCHAR(100),
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contact JSONB;

-- Migrate existing data from old date/location columns to new ones
UPDATE events 
SET start_date = date, end_date = date, venue = location
WHERE start_date IS NULL;

-- Create index for new date column (PostgreSQL 14+ supports IF NOT EXISTS for indexes)
-- For older versions, this will fail silently if index exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_start_date') THEN
    CREATE INDEX idx_events_start_date ON events(start_date);
  END IF;
END $$;
