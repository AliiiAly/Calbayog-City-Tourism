-- Add getting_there column to destinations table
ALTER TABLE destinations 
  ADD COLUMN IF NOT EXISTS getting_there TEXT;
