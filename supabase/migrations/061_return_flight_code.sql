-- =============================================
-- Return flight code
-- =============================================
-- A round trip carries two flights and the table held one. The customer typed
-- the arrival flight into `flight_code` and the return one, if they thought to
-- mention it at all, into the free-text notes — where nothing reads it.
--
-- The two are not worth the same. The arrival flight IS the schedule: it is
-- what the driver watches to know a 3am landing is an hour late rather than a
-- no-show. The return flight is a check on one the customer already gave us —
-- they choose their own pickup time for the way back, and that time can be
-- impossible. A 10:00 flight with a 09:00 pickup from Alanya, two hours out,
-- is a missed flight that anyone can see coming once the number is on record.
--
-- Nullable, because every one-way booking has no return leg and every row
-- written before today has no answer to give.

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS return_flight_code TEXT;

COMMENT ON COLUMN reservations.return_flight_code IS
  'Flight the customer is catching on the return leg. NULL on a one-way booking.';
