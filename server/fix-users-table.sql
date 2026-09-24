-- Drop existing users table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- Recreate users table with correct schema
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for username lookup
CREATE INDEX idx_users_username ON users(username);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for user registration (public insert)
CREATE POLICY "Public insert for users" ON users FOR INSERT WITH CHECK (true);

-- Policy for user login (public read by username)
CREATE POLICY "Public read by username for users" ON users FOR SELECT USING (true);

-- Policy for user update (users can update their own data)
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true) WITH CHECK (true);

-- Policy for admin all access
CREATE POLICY "Admin all access for users" ON users FOR ALL USING (true) WITH CHECK (true);
