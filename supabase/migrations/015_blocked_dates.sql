-- Blocked dates table for manual capacity management
CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocked_date DATE UNIQUE NOT NULL,
  reason TEXT,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON blocked_dates(blocked_date);

ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- Only service role (admin client) can manage blocked dates
CREATE POLICY "Service role full access" ON blocked_dates
  USING (true)
  WITH CHECK (true);
