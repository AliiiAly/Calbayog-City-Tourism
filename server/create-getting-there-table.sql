-- Drop existing table to recreate with correct schema
DROP TABLE IF EXISTS getting_there CASCADE;

-- Create getting_there table for transportation information
-- NOTE: 'from' is a reserved SQL keyword — using 'origin' instead
CREATE TABLE getting_there (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL CHECK (category IN ('land', 'local')),
  origin VARCHAR(255),       -- for land: where coming from
  steps TEXT[],              -- for land: step-by-step directions
  total_fare VARCHAR(100),   -- for land: total estimated fare
  duration VARCHAR(100),     -- for land: total travel time
  mode VARCHAR(100),         -- for local: transport mode name
  description TEXT,          -- for local: description with fare
  icon VARCHAR(50),          -- for local: emoji icon
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_getting_there_category ON getting_there(category);

-- Insert default land routes
INSERT INTO getting_there (category, origin, steps, total_fare, duration) VALUES
('land', 'Allen Port (Samar)', ARRAY['From Manila: Bus to Matnog Port (Sorsogon)', 'RORO ferry Matnog to Allen Port (Samar) ~1.5 hrs', 'Bus/van Allen to Calbayog City ~3 hrs (P120-P180)'], 'P700-P1,500 (all-in)', '~18-20 hrs from Manila'),
('land', 'Catbalogan City (Samar Capital)', ARRAY['Bus or van Catbalogan to Calbayog City', 'Route: Via Maharlika Highway', 'Duration: ~45 minutes', 'Fare: P60-P100'], 'P60-P100', '~45 min');

-- Insert default local transport
INSERT INTO getting_there (category, mode, description, icon) VALUES
('local', 'Tricycle', 'City Proper & nearby barangays, P10-P30 per ride', '🛺'),
('local', 'Jeepney', 'City routes: Brgy. Mawacat, Oquendo, Tinaplacan, P10-P15', '🚌'),
('local', 'Habal-habal', 'To waterfalls (Oquendo), P50-P200 depending on distance', '🏍️'),
('local', 'Van Rental', 'Tour Calbayog attractions, P2,500-P4,000/day with driver', '🚐'),
('local', 'Motorcycle Rental', 'Self-drive for exploring, P500-P800/day', '🏍️');
