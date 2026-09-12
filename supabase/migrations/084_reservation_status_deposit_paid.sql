-- ---------------------------------------------------------------------------
-- 084: let a reservation actually say "deposit paid"
-- ---------------------------------------------------------------------------
--
-- The pay-the-driver-in-cash flow takes a deposit by card and leaves the rest
-- for the driver to collect. The Stripe webhook has written `deposit_paid` for
-- those since that feature shipped -- but the status CHECK constraint was
-- created in 001 and never widened, so Postgres rejected every one of those
-- writes. The webhook does not inspect that update's error, so it carried on:
-- the customer got the confirmation mail, the office got the Telegram, the
-- driver voucher went out, and the row stayed `pending`.
--
-- A cash booking with the deposit in the bank was therefore indistinguishable
-- from one nobody had paid for. No driver could be assigned to it (the admin
-- panel only offers assignment on a paid booking), its voucher link was
-- refused, and it was missing from every revenue figure.
--
-- `cancel_requested` is the same omission with a different symptom: the
-- customer's own cancel request does check its error and fails loudly, so that
-- button has never worked either.

ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE reservations ADD CONSTRAINT reservations_status_check
  CHECK (status IN (
    'pending',
    'paid',
    'deposit_paid',
    'driver_assigned',
    'passenger_picked_up',
    'completed',
    'cancelled',
    'cancel_requested'
  ));

-- ---------------------------------------------------------------------------
-- Repair the bookings the rejected writes left behind
-- ---------------------------------------------------------------------------
--
-- Keyed off notification_log rather than off the reservation, because the
-- reservation is exactly what failed to record the payment. The webhook writes
-- one `payment_received` row per succeeded PaymentIntent and that row carries
-- the intent's id, so its existence is the evidence that money arrived -- and
-- the id it carries is the one the rejected update failed to store.
--
-- Only rows still sitting at `pending` are touched, so anything already put
-- right by hand keeps the status it was given.

UPDATE reservations r
SET status = 'deposit_paid',
    stripe_payment_intent_id =
      COALESCE(r.stripe_payment_intent_id, n.metadata->>'payment_intent_id'),
    updated_at = NOW()
FROM notification_log n
WHERE n.type = 'payment_received'
  AND n.metadata->>'reservation_id' = r.id::text
  AND r.status = 'pending'
  AND r.payment_method = 'cash';

-- The same repair for an online booking, where `paid` was always a legal value
-- and so the only way to be stuck is a webhook that never landed.
UPDATE reservations r
SET status = 'paid',
    stripe_payment_intent_id =
      COALESCE(r.stripe_payment_intent_id, n.metadata->>'payment_intent_id'),
    updated_at = NOW()
FROM notification_log n
WHERE n.type = 'payment_received'
  AND n.metadata->>'reservation_id' = r.id::text
  AND r.status = 'pending'
  AND r.payment_method <> 'cash';

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  stuck INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reservations_status_check'
      AND pg_get_constraintdef(oid) LIKE '%deposit_paid%'
  ) THEN
    RAISE EXCEPTION '084: deposit_paid still not allowed by the status constraint';
  END IF;

  SELECT COUNT(*) INTO stuck
  FROM reservations r
  JOIN notification_log n
    ON n.type = 'payment_received'
   AND n.metadata->>'reservation_id' = r.id::text
  WHERE r.status = 'pending';

  IF stuck > 0 THEN
    RAISE EXCEPTION '084: % paid reservation(s) still pending', stuck;
  END IF;

  RAISE NOTICE '084 OK - deposit_paid accepted and the stuck bookings are repaired.';
END $$;
