-- =============================================
-- 095: Şoförün kalıcı paneli ve izin günleri
--
-- Bugüne kadar şoförün eline geçen tek link driver_assignments.link_token idi
-- — göreve özel, iş bitince ölen bir token. portal_token her şoförde kalıcı
-- tek bir link: /driver/panel/[token] bugünkü ve yaklaşan tüm işlerini listeler,
-- her biri kendi göreve-özel linkine açılır.
--
-- driver_leave_days şoförün (veya adminin) işaretlediği izin günleridir;
-- Şoförler listesinde "İzinli" rozeti ve iş atarken uyarı buradan okunur.
--
-- Tek transaction, tekrar çalıştırılabilir.
-- =============================================

BEGIN;

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS portal_token TEXT UNIQUE;
UPDATE drivers SET portal_token = uuid_generate_v4()::text WHERE portal_token IS NULL;

CREATE TABLE IF NOT EXISTS driver_leave_days (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id   UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  leave_date  DATE NOT NULL,
  note        TEXT,
  set_by      TEXT NOT NULL CHECK (set_by IN ('driver', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (driver_id, leave_date)
);

CREATE INDEX IF NOT EXISTS driver_leave_days_driver_idx ON driver_leave_days (driver_id, leave_date);

COMMENT ON COLUMN drivers.portal_token IS
  'Şoförün kalıcı panel linki: /driver/panel/[token]. driver_assignments.link_token göreve özeldir, bu kalıcıdır.';

ALTER TABLE driver_leave_days ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ---------------------------------------------
-- KONTROL
-- ---------------------------------------------
SELECT 'drivers.portal_token' AS nesne,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'drivers' AND column_name = 'portal_token'
  ) THEN 'ok' ELSE 'EKSİK' END AS durum
UNION ALL
SELECT 'driver_leave_days', CASE WHEN to_regclass('public.driver_leave_days') IS NULL THEN 'EKSİK' ELSE 'ok' END;
