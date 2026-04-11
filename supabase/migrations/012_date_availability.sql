-- =============================================
-- Date Availability & Blocking System
-- =============================================

-- Blocked dates table (admin can manually block dates)
CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocked_date)
);

CREATE INDEX idx_blocked_dates_date ON blocked_dates(blocked_date);

-- Add max_daily_bookings setting
INSERT INTO settings (key, value) VALUES
  ('max_daily_bookings', '3')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocked_dates_read" ON blocked_dates FOR SELECT USING (true);
