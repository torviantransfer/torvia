-- =============================================
-- One row per visit, instead of one row per ping
--
-- The presence tracker beats every 25 seconds, and every beat used to become
-- a row in analytics_events. A visitor who reads two pages for ten minutes
-- left roughly two dozen rows behind, all of them saying the same thing.
--
-- That broke the reports in two ways. The dashboard query fetches without a
-- limit, so PostgREST capped it at its max-rows setting and the "last 30 days"
-- view was really the last few hours. And every distribution counted rows, so
-- "top country" ranked by time-on-site rather than by number of people.
--
-- Sessions now live here, one row each, updated in place. analytics_events
-- keeps only events that mean something: page views, funnel steps, payments.
--
-- NOT BACKFILLED, on purpose. The old session id lived in localStorage with no
-- expiry, so one browser was one "session" for as long as it kept its storage.
-- Folding those into rows here would produce visits that began in spring and
-- ended in autumn, landing in every date range at once. Visit history starts
-- from the deploy that carries this migration.
-- =============================================

CREATE TABLE IF NOT EXISTS analytics_sessions (
  session_id text PRIMARY KEY,
  -- Stable across visits, so a returning customer can be told from a new one.
  visitor_id text,

  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  entry_page text,
  last_page text,

  region text,
  locale text,
  -- Resolved from the edge geo headers, never from the browser's language.
  country text,
  city text,

  device text,
  os text,
  browser text,

  -- First-touch attribution: whatever brought them here the first time, kept
  -- for the whole visit even after the query string is gone.
  source text,
  medium text,
  campaign text,
  referrer text,
  -- The ad click ids themselves, so a booking can be handed back to the ad
  -- platform later as an offline conversion.
  gclid text,
  fbclid text,

  selected_vehicle boolean NOT NULL DEFAULT false,
  form_started boolean NOT NULL DEFAULT false,
  reached_checkout boolean NOT NULL DEFAULT false,
  purchased boolean NOT NULL DEFAULT false,

  vehicle_slug text,
  vehicle_price numeric(10,2),
  revenue numeric(10,2),

  page_views integer NOT NULL DEFAULT 0,
  events integer NOT NULL DEFAULT 0
);

-- The live view asks "who was here in the last five minutes", the reports ask
-- "who arrived in this date range". Those are the two orderings that matter.
CREATE INDEX IF NOT EXISTS analytics_sessions_last_seen_idx ON analytics_sessions (last_seen DESC);
CREATE INDEX IF NOT EXISTS analytics_sessions_first_seen_idx ON analytics_sessions (first_seen DESC);
CREATE INDEX IF NOT EXISTS analytics_sessions_visitor_idx ON analytics_sessions (visitor_id);

-- No policies: the tracking route and the admin routes both go through the
-- service role, which bypasses RLS. Enabling it keeps the anon key out.
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;

-- The events table gains the same context, so a single event can still be read
-- on its own without joining back to its session.
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS visitor_id text;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS device text;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS os text;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS browser text;

-- created_at alone is not enough for the funnel query, which always filters a
-- date range and an event type together.
CREATE INDEX IF NOT EXISTS analytics_events_type_created_idx
  ON analytics_events (event_type, created_at DESC);

-- =============================================
-- Upsert a session from one tracked event.
--
-- Written as a function rather than a client-side upsert because the merge
-- rules differ per column: some fields take the newest value, some keep the
-- first one they were given, and the funnel flags only ever go from false to
-- true. Doing that from the app would need a read before every write.
-- =============================================
CREATE OR REPLACE FUNCTION touch_analytics_session(
  p_session_id text,
  p_visitor_id text,
  p_page text,
  p_region text,
  p_locale text,
  p_country text,
  p_city text,
  p_device text,
  p_os text,
  p_browser text,
  p_source text,
  p_medium text,
  p_campaign text,
  p_referrer text,
  p_gclid text,
  p_fbclid text,
  p_event_type text,
  p_step text,
  p_vehicle_slug text,
  p_vehicle_price numeric,
  p_revenue numeric
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO analytics_sessions AS s (
    session_id, visitor_id, first_seen, last_seen, entry_page, last_page,
    region, locale, country, city, device, os, browser,
    source, medium, campaign, referrer, gclid, fbclid,
    selected_vehicle, form_started, reached_checkout, purchased,
    vehicle_slug, vehicle_price, revenue, page_views, events
  ) VALUES (
    p_session_id, p_visitor_id, now(), now(), p_page, p_page,
    p_region, p_locale, p_country, p_city, p_device, p_os, p_browser,
    p_source, p_medium, p_campaign, p_referrer, p_gclid, p_fbclid,
    COALESCE(p_step = 'vehicle_selected', false),
    COALESCE(p_step = 'form_started', false),
    COALESCE(p_step = 'checkout_initiated', false),
    COALESCE(p_event_type = 'payment_success', false),
    CASE WHEN p_step = 'vehicle_selected' THEN p_vehicle_slug END,
    CASE WHEN p_step = 'vehicle_selected' THEN p_vehicle_price END,
    CASE WHEN p_event_type = 'payment_success' THEN p_revenue END,
    CASE WHEN p_event_type = 'page_view' THEN 1 ELSE 0 END,
    1
  )
  ON CONFLICT (session_id) DO UPDATE SET
    last_seen = now(),

    -- Where they are now, and which region they are looking at now.
    last_page = COALESCE(EXCLUDED.last_page, s.last_page),
    region    = COALESCE(EXCLUDED.region, s.region),
    locale    = COALESCE(EXCLUDED.locale, s.locale),

    -- Facts about the visit that were settled when it began. Later events may
    -- fill a gap but never overwrite: a heartbeat carries no utm parameters,
    -- and letting it blank the campaign would lose the attribution.
    visitor_id = COALESCE(s.visitor_id, EXCLUDED.visitor_id),
    country    = COALESCE(s.country, EXCLUDED.country),
    city       = COALESCE(s.city, EXCLUDED.city),
    device     = COALESCE(s.device, EXCLUDED.device),
    os         = COALESCE(s.os, EXCLUDED.os),
    browser    = COALESCE(s.browser, EXCLUDED.browser),
    source     = COALESCE(s.source, EXCLUDED.source),
    medium     = COALESCE(s.medium, EXCLUDED.medium),
    campaign   = COALESCE(s.campaign, EXCLUDED.campaign),
    referrer   = COALESCE(s.referrer, EXCLUDED.referrer),
    gclid      = COALESCE(s.gclid, EXCLUDED.gclid),
    fbclid     = COALESCE(s.fbclid, EXCLUDED.fbclid),

    -- Milestones are one-way. Going back a step does not un-reach it.
    selected_vehicle = s.selected_vehicle OR EXCLUDED.selected_vehicle,
    form_started     = s.form_started     OR EXCLUDED.form_started,
    reached_checkout = s.reached_checkout OR EXCLUDED.reached_checkout,
    purchased        = s.purchased        OR EXCLUDED.purchased,

    -- The vehicle they are on now, which may not be the first one they tried.
    vehicle_slug  = COALESCE(EXCLUDED.vehicle_slug, s.vehicle_slug),
    vehicle_price = COALESCE(EXCLUDED.vehicle_price, s.vehicle_price),
    revenue       = COALESCE(EXCLUDED.revenue, s.revenue),

    page_views = s.page_views + EXCLUDED.page_views,
    events     = s.events + 1;
$$;

REVOKE ALL ON FUNCTION touch_analytics_session(
  text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, text, text, text, text, numeric, numeric
) FROM PUBLIC, anon, authenticated;
