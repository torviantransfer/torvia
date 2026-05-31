-- =============================================
-- Create custom analytics events table for booking and funnel tracking
-- =============================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  event_type text NOT NULL,
  page text,
  step text,
  region text,
  locale text,
  country text,
  referrer text,
  source text,
  medium text,
  campaign text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events (created_at);
CREATE INDEX IF NOT EXISTS analytics_events_session_id_idx ON analytics_events (session_id);
CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS analytics_events_country_idx ON analytics_events (country);
