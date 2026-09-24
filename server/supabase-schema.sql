-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create destinations table
CREATE TABLE IF NOT EXISTS destinations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Waterfalls', 'Beaches', 'Heritage', 'Hotels', 'Food', 'Events', 'Transport', 'Nature', 'Other')),
  description TEXT NOT NULL,
  short_description TEXT,
  images TEXT[],
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  location_address VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  contact_facebook VARCHAR(255),
  contact_website VARCHAR(255),
  opening_hours VARCHAR(100),
  entrance_fee VARCHAR(100),
  tips TEXT[],
  tags TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  image TEXT,
  date DATE NOT NULL,
  time TIME,
  location VARCHAR(255),
  organizer VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  tags TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accommodations table
CREATE TABLE IF NOT EXISTS accommodations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Hotel', 'Resort', 'Inn', 'Pension House', 'Hostel', 'Guesthouse', 'Homestay', 'Other')),
  description TEXT NOT NULL,
  short_description TEXT,
  images TEXT[],
  location_lat DECIMAL(10, 8) DEFAULT 0,
  location_lng DECIMAL(11, 8) DEFAULT 0,
  location_address VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  contact_facebook VARCHAR(255),
  contact_messenger VARCHAR(255),
  contact_website VARCHAR(255),
  amenities TEXT[],
  room_types TEXT[],
  price_range VARCHAR(100),
  price_min DECIMAL(10, 2) DEFAULT 0,
  price_max DECIMAL(10, 2) DEFAULT 0,
  star_rating INTEGER DEFAULT 0,
  check_in VARCHAR(50),
  check_out VARCHAR(50),
  dot_accredited BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guides table
CREATE TABLE IF NOT EXISTS guides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  image TEXT,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  location_address VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  contact_facebook VARCHAR(255),
  languages TEXT[],
  specialties TEXT[],
  rate VARCHAR(100),
  featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create itinerary_requests table
CREATE TABLE IF NOT EXISTS itinerary_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  travel_date DATE,
  duration INTEGER,
  group_size INTEGER,
  interests TEXT[],
  budget VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_destinations_category ON destinations(category);
CREATE INDEX IF NOT EXISTS idx_destinations_featured ON destinations(featured);
CREATE INDEX IF NOT EXISTS idx_destinations_active ON destinations(is_active);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_accommodations_type ON accommodations(type);
CREATE INDEX IF NOT EXISTS idx_accommodations_featured ON accommodations(featured);
CREATE INDEX IF NOT EXISTS idx_accommodations_active ON accommodations(is_active);
CREATE INDEX IF NOT EXISTS idx_guides_featured ON guides(featured);
CREATE INDEX IF NOT EXISTS idx_guides_active ON guides(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access for destinations" ON destinations FOR SELECT USING (true);
CREATE POLICY "Public read access for events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read access for accommodations" ON accommodations FOR SELECT USING (true);
CREATE POLICY "Public read access for guides" ON guides FOR SELECT USING (true);

-- Create policies for public insert access (for feedback and itinerary requests)
CREATE POLICY "Public insert for feedback" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert for itinerary requests" ON itinerary_requests FOR INSERT WITH CHECK (true);

-- Create policies for admin access (you can add authentication later)
CREATE POLICY "Admin all access for destinations" ON destinations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all access for events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all access for accommodations" ON accommodations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all access for guides" ON guides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all access for itinerary_requests" ON itinerary_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all access for feedback" ON feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all access for admins" ON admins FOR ALL USING (true) WITH CHECK (true);
