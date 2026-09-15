import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Kept as a string union rather than a DB enum: a new action never needs a
 * migration, and the reservation drawer's timeline (ReservationPanel.tsx)
 * only surfaces the handful it explicitly knows how to word.
 */
export type EventAction =
  | "created"
  | "edited"
  | "cancelled"
  | "cancel_rejected"
  | "payment_link_sent"
  | "paid"
  | "payment_failed"
  | "assigned"
  | "unassigned"
  | "status_changed"
  | "leave_added"
  | "leave_removed";

interface LogEventInput {
  reservationId?: string | null;
  driverId?: string | null;
  action: EventAction;
  actor: string;
  detail?: Record<string, unknown>;
}

/**
 * Writes one line to event_log. Never throws — a failed log write must not
 * break the mutation it is recording, so a failure here is only logged to the
 * console, the same way notification_log writes elsewhere are treated.
 */
export async function logEvent(supabase: SupabaseClient, entry: LogEventInput): Promise<void> {
  try {
    const { error } = await supabase.from("event_log").insert({
      reservation_id: entry.reservationId ?? null,
      driver_id: entry.driverId ?? null,
      action: entry.action,
      actor: entry.actor,
      detail: entry.detail ?? null,
    });
    if (error) console.error("event_log insert failed:", error.message);
  } catch (err) {
    console.error("event_log insert threw:", err instanceof Error ? err.message : err);
  }
}

export interface EventLogRow {
  id: string;
  reservation_id: string | null;
  driver_id: string | null;
  action: string;
  actor: string;
  detail: Record<string, unknown> | null;
  created_at: string;
}
