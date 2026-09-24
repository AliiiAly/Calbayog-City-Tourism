-- Add category-specific columns to destinations table
-- Run this in Supabase SQL Editor

-- Waterfalls specific
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS waterfall_height VARCHAR(100);
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS swimming_allowed BOOLEAN DEFAULT FALSE;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS trekking_difficulty VARCHAR(50);

-- Beaches specific
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS beach_type VARCHAR(50);
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS best_season VARCHAR(100);

-- Heritage specific
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS historical_period VARCHAR(100);
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS significance TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS tour_guide_available BOOLEAN DEFAULT FALSE;

-- Hotels specific
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS room_types TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS amenities TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS price_range VARCHAR(100);
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

-- Food specific
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS cuisine_type VARCHAR(100);
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS specialties TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS seating_capacity VARCHAR(50);

-- Events specific
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS event_time TIME;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS organizer VARCHAR(255);
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS ticket_price VARCHAR(100);

-- Transport specific
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50);
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS schedule VARCHAR(100);
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS fare VARCHAR(100);

-- Nature specific
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS activities_allowed TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS best_season_nature VARCHAR(100);
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS guide_required BOOLEAN DEFAULT FALSE;

-- Verify all columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'destinations' 
AND column_name IN (
  'waterfall_height', 'swimming_allowed', 'trekking_difficulty',
  'beach_type', 'best_season',
  'historical_period', 'significance', 'tour_guide_available',
  'room_types', 'amenities', 'price_range', 'contact_phone', 'contact_email',
  'cuisine_type', 'specialties', 'seating_capacity',
  'event_date', 'event_time', 'organizer', 'ticket_price',
  'vehicle_type', 'schedule', 'fare',
  'activities_allowed', 'best_season_nature', 'guide_required'
);
