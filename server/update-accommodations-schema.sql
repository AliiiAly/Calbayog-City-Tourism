-- Add missing columns to accommodations table
ALTER TABLE accommodations 
  ADD COLUMN IF NOT EXISTS contact_messenger VARCHAR(255),
  ADD COLUMN IF NOT EXISTS price_min DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_max DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS star_rating INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS check_in VARCHAR(50),
  ADD COLUMN IF NOT EXISTS check_out VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dot_accredited BOOLEAN DEFAULT FALSE;

-- Update type constraint to include new types
ALTER TABLE accommodations 
  DROP CONSTRAINT IF EXISTS accommodations_type_check;

ALTER TABLE accommodations 
  ADD CONSTRAINT accommodations_type_check 
  CHECK (type IN ('Hotel', 'Resort', 'Inn', 'Pension House', 'Hostel', 'Guesthouse', 'Homestay', 'Other'));

-- Make location fields nullable with defaults
ALTER TABLE accommodations 
  ALTER COLUMN location_lat SET DEFAULT 0,
  ALTER COLUMN location_lng SET DEFAULT 0,
  ALTER COLUMN location_lat DROP NOT NULL,
  ALTER COLUMN location_lng DROP NOT NULL;
