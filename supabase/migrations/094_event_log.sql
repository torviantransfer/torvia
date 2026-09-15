-- =============================================
-- 094: Olay kaydı
--
-- Rezervasyon çekmecesindeki "Geçmiş" bölümü şimdiye kadar yalnızca satırda
-- zaten duran zaman damgalarından (created_at, assigned_at, ...) kurulabiliyordu
-- — kim düzenledi, kim iptal etti, ödeme linkini kim gönderdi hiçbir yerde
-- durmuyordu. notification_log bu iş için değil, giden mesajlar için var.
--
-- event_log tek bir rezervasyona veya şoföre bağlı serbest metin bir olay
-- kaydıdır: action (ör. "edited", "cancelled", "payment_link_sent"), actor
-- (admin e-postası, "system" veya şoför adı) ve isteğe bağlı detail (JSON).
--
-- Tek transaction, tekrar çalıştırılabilir.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS event_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id  UUID REFERENCES reservations(id) ON DELETE CASCADE,
  driver_id       UUID REFERENCES drivers(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,
  actor           TEXT NOT NULL,
  detail          JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS event_log_reservation_idx ON event_log (reservation_id, created_at);
CREATE INDEX IF NOT EXISTS event_log_driver_idx ON event_log (driver_id, created_at);

COMMENT ON TABLE event_log IS
  'Rezervasyon/şoför üzerinde kim ne yaptı kaydı. Yalnızca sunucu (service role) yazar ve okur.';

-- Yalnızca sunucu (service role) okur ve yazar — driver_payments, finance_entries ile aynı yol.
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ---------------------------------------------
-- KONTROL
-- ---------------------------------------------
SELECT 'event_log' AS nesne, CASE WHEN to_regclass('public.event_log') IS NULL THEN 'EKSİK' ELSE 'ok' END AS durum;
