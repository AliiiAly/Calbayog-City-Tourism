-- Add getting_there column to destinations table
-- Run this in Supabase SQL Editor

ALTER TABLE destinations ADD COLUMN IF NOT EXISTS getting_there TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'destinations' 
AND column_name = 'getting_there';
