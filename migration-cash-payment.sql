-- Run this in Supabase SQL Editor
-- Adds cash payment + online discount + night tariff support to Torvia

-- 1. Add payment_method column to reservations table
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'online';

-- 2. Add online_discount column to reservations table
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS online_discount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- 3. Cash payment toggle
INSERT INTO settings (key, value) VALUES ('cash_payment_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Online payment discount (e.g. set value to '3' for 3%)
INSERT INTO settings (key, value) VALUES ('online_payment_discount_percent', '0'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 5. Night tariff toggle
INSERT INTO settings (key, value) VALUES ('night_tariff_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6. Night tariff start time (HH:MM format, default midnight)
INSERT INTO settings (key, value) VALUES ('night_tariff_start', '"00:00"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 7. Night tariff end time (HH:MM format, default 07:00)
INSERT INTO settings (key, value) VALUES ('night_tariff_end', '"07:00"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 8. Night tariff surcharge percent (e.g. '4' for +4%)
INSERT INTO settings (key, value) VALUES ('night_tariff_percent', '0'::jsonb)
ON CONFLICT (key) DO NOTHING;
