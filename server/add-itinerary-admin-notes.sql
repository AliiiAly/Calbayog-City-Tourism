-- Add adminNotes column to itinerary_requests table
-- Run this in Supabase SQL Editor

ALTER TABLE itinerary_requests ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'itinerary_requests' 
AND column_name = 'adminNotes';
