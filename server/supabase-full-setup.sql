-- ============================================================
-- CALBAYOG TOURISM — SUPABASE FULL SETUP
-- Run this ONCE in your Supabase project → SQL Editor
-- This enables the app to work WITHOUT the local backend server
-- and allows image uploads from anywhere.
-- ============================================================

-- ── 1. ROW LEVEL SECURITY POLICIES ──────────────────────────
-- These allow the anon key (used by the app) to read and write
-- all tables without needing the local Express server.

-- Destinations
ALTER TABLE IF EXISTS destinations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON destinations;
CREATE POLICY "Allow all operations" ON destinations FOR ALL USING (true) WITH CHECK (true);

-- Events
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON events;
CREATE POLICY "Allow all operations" ON events FOR ALL USING (true) WITH CHECK (true);

-- Accommodations
ALTER TABLE IF EXISTS accommodations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON accommodations;
CREATE POLICY "Allow all operations" ON accommodations FOR ALL USING (true) WITH CHECK (true);

-- Guides
ALTER TABLE IF EXISTS guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON guides;
CREATE POLICY "Allow all operations" ON guides FOR ALL USING (true) WITH CHECK (true);

-- Getting There
ALTER TABLE IF EXISTS getting_there ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON getting_there;
CREATE POLICY "Allow all operations" ON getting_there FOR ALL USING (true) WITH CHECK (true);

-- Itinerary Requests
ALTER TABLE IF EXISTS itinerary_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON itinerary_requests;
CREATE POLICY "Allow all operations" ON itinerary_requests FOR ALL USING (true) WITH CHECK (true);

-- Feedback
ALTER TABLE IF EXISTS feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON feedback;
CREATE POLICY "Allow all operations" ON feedback FOR ALL USING (true) WITH CHECK (true);

-- Admins
ALTER TABLE IF EXISTS admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON admins;
CREATE POLICY "Allow all operations" ON admins FOR ALL USING (true) WITH CHECK (true);

-- Users
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON users;
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true) WITH CHECK (true);

-- Notifications
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON notifications;
CREATE POLICY "Allow all operations" ON notifications FOR ALL USING (true) WITH CHECK (true);


-- ── 2. STORAGE BUCKET SETUP ──────────────────────────────────
-- Creates the "images" bucket as PUBLIC so uploaded images
-- are accessible without authentication (needed for display).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  52428800,  -- 50 MB max per file
  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml'];


-- ── 3. STORAGE BUCKET POLICIES ───────────────────────────────
-- Allow anyone to read public images, and any user (anon included)
-- to upload/update/delete images in the "images" bucket.

DROP POLICY IF EXISTS "Public read images" ON storage.objects;
CREATE POLICY "Public read images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
CREATE POLICY "Anyone can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "Anyone can update images" ON storage.objects;
CREATE POLICY "Anyone can update images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;
CREATE POLICY "Anyone can delete images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images');


-- ── 4. REALTIME PUBLICATIONS ─────────────────────────────────
-- Ensures all tables broadcast realtime changes to the client.
-- Safe to run multiple times (skips tables already in the publication).

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'destinations','events','accommodations','guides',
    'getting_there','itinerary_requests','feedback','notifications'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    EXCEPTION WHEN others THEN
      -- already a member, skip
    END;
  END LOOP;
END $$;

-- ── DONE ─────────────────────────────────────────────────────
-- After running this script:
-- 1. The app works fully without the local backend server.
-- 2. Admin can add/edit/delete data from any device/location.
-- 3. Images upload directly to Supabase Storage (cloud).
-- 4. All changes appear in realtime on website and app.
