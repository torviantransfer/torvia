-- =============================================
-- Transfer direction
-- =============================================
-- Every reservation was implicitly "airport → region", with a round trip's
-- return leg being the reverse. Customers do book the other way round (hotel →
-- airport) and pick the only shape the form offers, leaving the operator with a
-- record that points the wrong way and no way to correct it.
--
-- `direction` describes the OUTBOUND leg. A round trip's return leg is always
-- the opposite, so the two directions cover both shapes:
--   • airport_to_region → out: AYT → region,  return: region → AYT
--   • region_to_airport → out: region → AYT,  return: AYT → region
--
-- The default preserves the historical meaning of every existing row.

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'airport_to_region';

ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_direction_check;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_direction_check
  CHECK (direction IN ('airport_to_region', 'region_to_airport'));

COMMENT ON COLUMN reservations.direction IS
  'Direction of the outbound leg. A round trip''s return leg runs the opposite way.';
