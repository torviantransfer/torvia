/**
 * Which reservation statuses mean the money is real, in one place.
 *
 * `deposit_paid` arrived with the pay-the-driver-in-cash flow and was only
 * half wired in. The webhook wrote it, the database refused it (fixed in
 * migration 084), and every screen that asked "has this been paid for?" tested
 * for `paid` alone. So even once the database accepted the value, a cash
 * booking with the deposit in the bank still could not be given a driver, had
 * no voucher, and counted as no revenue.
 *
 * The lists live here rather than being retyped in each file, which is what let
 * one status be added in some places and missed in a dozen others. Anything
 * that branches on "is this paid?" should import from here.
 */

/** The deposit has cleared, or the whole fare has. Either way we have money. */
export const SETTLED_STATUSES = ["paid", "deposit_paid"];

/**
 * A booking that is going to happen: paid for and not cancelled.
 *
 * This is the set that counts as revenue, earns a voucher, and appears in the
 * operator's active list. `pending` has not been paid for and `cancelled` was
 * refunded, so neither belongs.
 */
export const CONFIRMED_STATUSES = [
  ...SETTLED_STATUSES,
  "driver_assigned",
  "passenger_picked_up",
  "completed",
];

/** A driver may be put on a booking that is paid for and not yet under way. */
export const ASSIGNABLE_STATUSES = [...SETTLED_STATUSES, "driver_assigned"];

/** Statuses a customer may still request cancellation from. */
export const CANCELLABLE_STATUSES = [
  "pending",
  ...SETTLED_STATUSES,
  "driver_assigned",
];

/**
 * Bookings that occupy a slot in the day's capacity.
 *
 * `pending` is deliberately absent, and that is the whole point of this list.
 * Capacity used to count every reservation that was not cancelled, so each
 * abandoned checkout — a card form closed, a price compared and left — took a
 * seat off that date permanently and no one ever gave it back. With a daily
 * limit of two, a couple of people who never paid could close a date to every
 * real customer behind them.
 *
 * `cancel_requested` still holds its slot: the request has not been approved
 * yet, and until it is, the transfer is still ours to drive.
 */
export const CAPACITY_STATUSES = [...CONFIRMED_STATUSES, "cancel_requested"];

/** True while the trip is live for the customer: pay, dispatch, pickup. */
export const IN_PROGRESS_STATUSES = [...SETTLED_STATUSES, "driver_assigned", "passenger_picked_up"];

export const isSettled = (status: string) => SETTLED_STATUSES.includes(status);
export const isConfirmed = (status: string) => CONFIRMED_STATUSES.includes(status);

/**
 * The status to return a booking to when a driver assignment is removed or a
 * cancel request is rejected.
 *
 * A cash booking must not land on `paid`: that says the fare is settled, and
 * the driver still has to collect the balance from the passenger.
 */
export const settledStatusFor = (paymentMethod: string | null | undefined) =>
  paymentMethod === "cash" ? "deposit_paid" : "paid";
