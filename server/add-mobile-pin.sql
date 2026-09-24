-- Add mobile_pin column to admins table for mobile app login
-- Run this in Supabase SQL Editor

ALTER TABLE admins ADD COLUMN IF NOT EXISTS mobile_pin VARCHAR(20);

-- Update your admin account with a mobile PIN
-- Replace 'your_username' with your actual username
-- Replace '123456' with your desired PIN (keep it simple but secure)
UPDATE admins SET mobile_pin = '123456' WHERE username = 'admin';

-- Verify the update
SELECT id, username, name, email, mobile_pin FROM admins;
