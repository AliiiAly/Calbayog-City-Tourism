  -- Fix notifications table: make user_id nullable (global notifications visible to all)
  -- Drop FK constraint and make user_id nullable

  -- Drop old table and recreate cleanly
  DROP TABLE IF EXISTS notifications CASCADE;

  CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- nullable: NULL means visible to ALL users
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
  CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

  -- Enable RLS
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

  -- Policy: Anyone can view global notifications (user_id IS NULL) or their own
  CREATE POLICY "View own or global notifications"
    ON notifications FOR SELECT
    USING (user_id IS NULL OR auth.uid()::text = user_id::text);

  -- Policy: Users can update their own or global notifications
  CREATE POLICY "Update own or global notifications"
    ON notifications FOR UPDATE
    USING (user_id IS NULL OR auth.uid()::text = user_id::text);

  -- Policy: Service role can insert any notifications
  CREATE POLICY "Service role can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

  -- Policy: Service role can delete notifications
  CREATE POLICY "Service role can delete notifications"
    ON notifications FOR DELETE
    USING (true);

  -- Function to update updated_at
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Trigger
  DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
  CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  -- =============================================
  -- SEED: Create global notifications for all existing content
  -- =============================================

  -- Notifications for existing events
  INSERT INTO notifications (user_id, type, title, message, data, created_at)
  SELECT
    NULL,
    'event_added',
    'Event: ' || title,
    'Check out this event: ' || title || COALESCE(' at ' || venue, '') || COALESCE(' on ' || TO_CHAR(start_date, 'Mon DD, YYYY'), ''),
    jsonb_build_object('eventId', id::text, 'eventTitle', title, 'category', COALESCE(category, ''), 'startDate', COALESCE(start_date::text, '')),
    COALESCE(created_at, NOW())
  FROM events
  WHERE is_active = true
  ORDER BY created_at DESC;

  -- Notifications for existing destinations
  INSERT INTO notifications (user_id, type, title, message, data, created_at)
  SELECT
    NULL,
    'destination_added',
    'Destination: ' || name,
    'Discover this destination: ' || name || COALESCE(' - ' || SUBSTRING(description, 1, 80), ''),
    jsonb_build_object('destinationId', id::text, 'destinationName', name, 'category', COALESCE(category, '')),
    COALESCE(created_at, NOW())
  FROM destinations
  WHERE is_active = true
  ORDER BY created_at DESC;

  -- Notifications for existing guides
  INSERT INTO notifications (user_id, type, title, message, data, created_at)
  SELECT
    NULL,
    'guide_added',
    'Tour Guide: ' || name,
    name || ' is available as a tour guide in Calbayog.',
    jsonb_build_object('guideName', name),
    COALESCE(created_at, NOW())
  FROM guides
  WHERE is_active = true
  ORDER BY created_at DESC;
