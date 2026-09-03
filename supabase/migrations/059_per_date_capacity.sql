-- =============================================
-- Per-date capacity overrides
-- =============================================
-- Until now a date was either open (using the global `max_daily_bookings`
-- setting) or closed via a row in `blocked_dates`. Operators need a middle
-- ground: "this Saturday we can run 6 transfers, not 3".
--
-- `blocked_dates` becomes the single per-date override table:
--   • row with max_bookings IS NULL  → date is fully closed (previous behaviour)
--   • row with max_bookings = N      → date accepts at most N transfers
--   • no row                         → date uses the global setting
--
-- Existing rows keep max_bookings NULL, so every currently-closed date stays
-- closed after this migration.

ALTER TABLE blocked_dates
  ADD COLUMN IF NOT EXISTS max_bookings INTEGER;

ALTER TABLE blocked_dates
  DROP CONSTRAINT IF EXISTS blocked_dates_max_bookings_check;

ALTER TABLE blocked_dates
  ADD CONSTRAINT blocked_dates_max_bookings_check
  CHECK (max_bookings IS NULL OR (max_bookings >= 0 AND max_bookings <= 100));

ALTER TABLE blocked_dates
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON TABLE blocked_dates IS
  'One row per date that deviates from the global max_daily_bookings setting. max_bookings NULL = date fully closed; a number = that date accepts at most that many transfers.';

COMMENT ON COLUMN blocked_dates.max_bookings IS
  'NULL = closed. 0 = closed. N > 0 = per-date capacity replacing max_daily_bookings.';

-- The seeded default was only inserted by migration 012; make sure it exists so
-- the booking API and the availability API resolve the same number.
INSERT INTO settings (key, value)
VALUES ('max_daily_bookings', '3')
ON CONFLICT (key) DO NOTHING;
