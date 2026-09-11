-- =============================================
-- Recover the old traffic as visits
--
-- Migration 081 started analytics_sessions empty, because the session id it
-- replaced never expired: one browser was one "session" for as long as it kept
-- its localStorage, so copying those rows across would have produced visits
-- that began in spring and ended in autumn, landing in every date range at
-- once.
--
-- The events themselves are fine, though. Cutting them at every gap longer
-- than 30 minutes rebuilds the visits they came from — which is exactly what
-- the live tracker now does, applied backwards. The old persistent id becomes
-- the visitor id, which is what it always really was, so "how many different
-- people" is answered correctly for the past as well.
--
-- Two things are honestly missing and cannot be recovered:
--
--   * form_started did not exist before this work, so "Form Doldurdu" is zero
--     for every recovered visit. It is not that nobody filled the form; it is
--     that nobody was counting.
--
--   * country was guessed from navigator.language, the browser's *language*
--     rather than its location. de-DE and ru-RU are probably right. en-US is
--     the factory default on most of the planet and says nothing at all, so it
--     is dropped rather than filed as American traffic. Those visits show as
--     "Bilinmiyor" until real geo data accumulates.
--
-- Safe to run twice: recovered rows are marked with a '#' in their id, only
-- events older than the first genuinely-tracked session are considered, and
-- the insert ignores conflicts.
-- =============================================

-- The sessionisation below walks each visitor's events in order. Without this
-- the planner has to sort the whole table to do it.
CREATE INDEX IF NOT EXISTS analytics_events_session_created_idx
  ON analytics_events (session_id, created_at);

WITH cutoff AS (
  -- Where the new tracking took over. Anything at or after this instant is
  -- already a real session row, and rebuilding it would double-count the visit
  -- under a second id.
  SELECT COALESCE(
    (SELECT min(first_seen) FROM analytics_sessions WHERE session_id NOT LIKE '%#%'),
    now()
  ) AS ts
),
src AS (
  SELECT
    e.session_id,
    e.created_at,
    e.page,
    e.event_type,
    e.step,
    e.region,
    e.locale,
    -- See the header: a browser language is not a location, and en-US is the
    -- default nobody changes.
    CASE
      WHEN e.country IS NULL THEN NULL
      WHEN e.country IN ('unknown', 'US') THEN NULL
      ELSE e.country
    END AS country,
    e.source,
    e.medium,
    NULLIF(e.campaign, '') AS campaign,
    e.referrer,
    CASE
      WHEN e.event_type = 'booking_step' AND e.step = 'vehicle_selected'
      THEN e.metadata ->> 'vehicle'
    END AS chosen_vehicle,
    -- Guarded rather than cast blind: one malformed value in months of events
    -- would otherwise abort the whole backfill.
    CASE
      WHEN e.event_type = 'booking_step'
       AND e.step = 'vehicle_selected'
       AND e.metadata ->> 'price' ~ '^[0-9]+(\.[0-9]+)?$'
      THEN (e.metadata ->> 'price')::numeric
    END AS chosen_price
  FROM analytics_events e, cutoff c
  WHERE e.session_id IS NOT NULL
    AND e.created_at < c.ts
),
marked AS (
  SELECT
    src.*,
    CASE
      WHEN lag(created_at) OVER w IS NULL THEN 1
      WHEN created_at - lag(created_at) OVER w > interval '30 minutes' THEN 1
      ELSE 0
    END AS starts_visit
  FROM src
  WINDOW w AS (PARTITION BY session_id ORDER BY created_at)
),
numbered AS (
  SELECT
    marked.*,
    sum(starts_visit) OVER (
      PARTITION BY session_id
      ORDER BY created_at
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS visit_no
  FROM marked
)
INSERT INTO analytics_sessions (
  session_id, visitor_id, first_seen, last_seen, entry_page, last_page,
  region, locale, country, source, medium, campaign, referrer,
  selected_vehicle, form_started, reached_checkout, purchased,
  vehicle_slug, vehicle_price, page_views, events
)
SELECT
  session_id || '#' || visit_no,
  -- The old id identified a browser, never a visit. That is a visitor id.
  session_id,
  min(created_at),
  max(created_at),
  (array_agg(page ORDER BY created_at ASC) FILTER (WHERE page IS NOT NULL))[1],
  (array_agg(page ORDER BY created_at DESC) FILTER (WHERE page IS NOT NULL))[1],
  (array_agg(region ORDER BY created_at DESC) FILTER (WHERE region IS NOT NULL))[1],
  (array_agg(locale ORDER BY created_at ASC) FILTER (WHERE locale IS NOT NULL))[1],
  (array_agg(country ORDER BY created_at ASC) FILTER (WHERE country IS NOT NULL))[1],
  -- First touch, matching how attribution is kept for live visits.
  (array_agg(source ORDER BY created_at ASC) FILTER (WHERE source IS NOT NULL))[1],
  (array_agg(medium ORDER BY created_at ASC) FILTER (WHERE medium IS NOT NULL))[1],
  (array_agg(campaign ORDER BY created_at ASC) FILTER (WHERE campaign IS NOT NULL))[1],
  (array_agg(referrer ORDER BY created_at ASC) FILTER (WHERE referrer IS NOT NULL))[1],
  bool_or(event_type = 'booking_step' AND step = 'vehicle_selected'),
  bool_or(event_type = 'booking_step' AND step = 'form_started'),
  bool_or(event_type = 'booking_step' AND step = 'checkout_initiated'),
  bool_or(event_type = 'payment_success'),
  (array_agg(chosen_vehicle ORDER BY created_at DESC) FILTER (WHERE chosen_vehicle IS NOT NULL))[1],
  (array_agg(chosen_price ORDER BY created_at DESC) FILTER (WHERE chosen_price IS NOT NULL))[1],
  count(*) FILTER (WHERE event_type = 'page_view'),
  count(*)
FROM numbered
GROUP BY session_id, visit_no
ON CONFLICT (session_id) DO NOTHING;

-- What came back, so the result is visible in the SQL editor rather than
-- having to be hunted for in the panel.
SELECT
  count(*) FILTER (WHERE session_id LIKE '%#%')                       AS geri_getirilen_ziyaret,
  count(DISTINCT visitor_id) FILTER (WHERE session_id LIKE '%#%')     AS farkli_kisi,
  count(*) FILTER (WHERE session_id LIKE '%#%' AND country IS NOT NULL) AS ulkesi_bilinen,
  min(first_seen) FILTER (WHERE session_id LIKE '%#%')                AS en_eski_ziyaret
FROM analytics_sessions;
