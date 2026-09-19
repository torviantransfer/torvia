-- Paying the rest of a cash booking online.
--
-- A "pay in the vehicle" booking takes a deposit online and leaves the balance
-- (reservations.driver_amount) for the driver to collect. Passengers who chose
-- that because they did not yet trust us often want, once the car has arrived,
-- to pay the balance by card instead of handing the driver cash.
--
-- That second payment is its own Stripe PaymentIntent. It cannot go into
-- stripe_payment_intent_id: that column holds the deposit's, and the refund
-- screen refunds whatever it points at. So the balance gets columns of its own.

alter table public.reservations
  add column if not exists balance_payment_intent_id text,
  add column if not exists balance_amount numeric(10, 2),
  add column if not exists balance_paid_at timestamptz;

comment on column public.reservations.balance_payment_intent_id is
  'Stripe PaymentIntent of the balance of a cash booking paid online afterwards; the deposit stays in stripe_payment_intent_id.';
comment on column public.reservations.balance_amount is
  'The balance paid online, in the reservation currency. driver_amount is set to 0 at the same time.';
comment on column public.reservations.balance_paid_at is
  'When the balance was paid online. Set once; a second payment for the same balance is refused.';
