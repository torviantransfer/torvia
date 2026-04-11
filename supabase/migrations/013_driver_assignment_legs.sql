-- Add leg and pickup_time to driver_assignments for separate outbound/return driver assignment
ALTER TABLE driver_assignments
  ADD COLUMN IF NOT EXISTS leg TEXT NOT NULL DEFAULT 'outbound',
  ADD COLUMN IF NOT EXISTS pickup_time TEXT;

-- Allow two assignments per reservation (one outbound, one return)
-- Drop old unique constraint if it exists (single assignment per reservation)
-- The existing check is done in app code (checking for existing assignment), no DB unique constraint to drop.

-- Add a unique constraint: one assignment per reservation per leg
ALTER TABLE driver_assignments
  ADD CONSTRAINT uq_reservation_leg UNIQUE (reservation_id, leg);
