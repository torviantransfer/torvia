-- ---------------------------------------------------------------------------
-- 080: what we pay the driver, per leg
-- ---------------------------------------------------------------------------
--
-- A reservation has a price the customer pays and a price we agree with the
-- driver. Only the first was ever recorded. The second lived in the admin's
-- head, and the driver ledger (driver_payments) had to be typed into by hand
-- for every single job -- which is why it is mostly empty, and why there has
-- never been a figure anywhere for what the company actually earns.
--
-- Note this is NOT reservations.driver_amount, which already exists and means
-- the opposite: the cash the driver COLLECTS FROM the passenger on a cash
-- booking, printed on the driver voucher. Naming this one driver_fee keeps the
-- two apart, because on a cash job both apply at once and they pull in
-- opposite directions.
--
-- Per assignment rather than per reservation: a round trip is two assignments
-- and can be two different drivers at two different rates. driver_assignments
-- already carries `leg`, so this is the row that knows whose money it is.

ALTER TABLE driver_assignments
  ADD COLUMN IF NOT EXISTS driver_fee NUMERIC(10,2);

-- Nothing may quietly become a negative payout. NULL is the real "not set
-- yet" -- the admin assigns a driver first and agrees the rate afterwards --
-- and it is what the summary counts as an unpriced transfer rather than as
-- a free one.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'driver_assignments_driver_fee_positive'
  ) THEN
    ALTER TABLE driver_assignments
      ADD CONSTRAINT driver_assignments_driver_fee_positive
      CHECK (driver_fee IS NULL OR driver_fee >= 0);
  END IF;
END $$;

COMMENT ON COLUMN driver_assignments.driver_fee IS
  'What we pay this driver for this leg, in USD. NULL = not agreed yet. Not to be confused with reservations.driver_amount, which is cash the driver collects from the passenger.';

-- ---------------------------------------------------------------------------
-- Tying ledger rows back to the assignment that caused them
-- ---------------------------------------------------------------------------
--
-- Setting a fee writes into driver_payments: the fee as an `earning`, and on a
-- cash booking the passenger's cash as a `payment`, because the driver has
-- already been handed that money. Editing the fee has to replace those rows
-- rather than stack another set on top, and removing the assignment has to
-- take them with it -- so each generated row needs to know which assignment it
-- came from.
--
-- ON DELETE CASCADE is the point, not a convenience: unassigning is already
-- refused once the trip has started, so any assignment that can still be
-- deleted is one that never happened, and its ledger entries are not history
-- worth keeping. Letting the database enforce that is what stops a phantom
-- debt outliving the job.
--
-- assignment_id IS NULL is what marks a row as hand-entered. The manual form
-- cannot set it, so the two kinds never collide and a real payout typed in by
-- hand is never swept away by an edit.
ALTER TABLE driver_payments
  ADD COLUMN IF NOT EXISTS assignment_id UUID
  REFERENCES driver_assignments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS driver_payments_assignment_id_idx
  ON driver_payments (assignment_id) WHERE assignment_id IS NOT NULL;

COMMENT ON COLUMN driver_payments.assignment_id IS
  'The assignment whose fee generated this row. NULL means hand-entered in the admin panel.';

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'driver_assignments'
      AND column_name = 'driver_fee'
  ) THEN
    RAISE EXCEPTION '080: driver_assignments.driver_fee missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'driver_payments'
      AND column_name = 'assignment_id'
  ) THEN
    RAISE EXCEPTION '080: driver_payments.assignment_id missing';
  END IF;

  RAISE NOTICE '080 OK — driver_fee and the ledger link are in place.';
END $$;
