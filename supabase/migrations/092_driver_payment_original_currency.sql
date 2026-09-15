-- =============================================
-- 092: Şoför cari hareketinde asıl tutar, asıl para birimi, kur ve tarih
--
-- Şoför hesabı dolar tutuluyor, ama şoföre her zaman dolar verilmiyor: bir
-- işin parası bazen euro ödeniyor. Paneldeki form yalnızca "Tutar ($)"
-- aldığı için "şoföre 85 € verdim" kaydı ya 85 $ diye yanlış yazılıyordu ya
-- da elle dolara çevrilip 98,60 $ yazılıyor ve 85 €'nun izi kayboluyordu.
-- İkisinde de ekstre şoförle konuşulacak halde değil.
--
-- Bundan sonra elle girilen her hareket şunları birlikte saklar:
--   amount / currency        hesaba işleyen tutar, dolar      (98,60 USD)
--   original_amount /        şoföre gerçekten verilen          (85,00 EUR)
--   original_currency
--   exchange_rate            çevirmede kullanılan kur, 1 EUR kaç USD (1,16)
-- Kur, ödemenin yapıldığı günün kurudur ve satıra yazılır. Aylar sonra kur
-- değiştiğinde geçmiş bakiye oynamaz.
--
-- paid_at: hareketin olduğu gün. Dün yapılan ödeme bugün girilebilsin diye
-- created_at'ten ayrı tutulur. Mevcut satırlar created_at ile doldurulur.
--
-- Hepsi boş bırakılabilen kolonlar. lib/driverLedger.ts'nin yazdığı
-- otomatik satırlar ve main'deki mevcut kod bu dosyadan etkilenmez.
--
-- Tek transaction, tekrar çalıştırılabilir.
-- =============================================

BEGIN;

ALTER TABLE driver_payments
  ADD COLUMN IF NOT EXISTS original_amount   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS original_currency TEXT,
  ADD COLUMN IF NOT EXISTS exchange_rate     NUMERIC(12,6),
  ADD COLUMN IF NOT EXISTS paid_at           TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'driver_payments_original_currency_valid'
  ) THEN
    ALTER TABLE driver_payments
      ADD CONSTRAINT driver_payments_original_currency_valid
      CHECK (original_currency IS NULL OR original_currency IN ('USD', 'EUR'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'driver_payments_exchange_rate_positive'
  ) THEN
    ALTER TABLE driver_payments
      ADD CONSTRAINT driver_payments_exchange_rate_positive
      CHECK (exchange_rate IS NULL OR exchange_rate > 0);
  END IF;
END $$;

-- Geçmiş satırların tarihi, girildikleri an.
UPDATE driver_payments SET paid_at = created_at WHERE paid_at IS NULL;

ALTER TABLE driver_payments ALTER COLUMN paid_at SET DEFAULT NOW();

-- Ekstre bir şoförün bütün hareketlerini okur.
CREATE INDEX IF NOT EXISTS driver_payments_driver_id_idx
  ON driver_payments (driver_id);

COMMENT ON COLUMN driver_payments.original_amount IS
  'Şoföre gerçekten verilen ya da onunla anlaşılan tutar, original_currency cinsinden. amount bunun hesap para birimine çevrilmiş halidir.';
COMMENT ON COLUMN driver_payments.original_currency IS
  'original_amount hangi para biriminde: USD ya da EUR. NULL = eski satır, amount/currency olduğu gibi okunur.';
COMMENT ON COLUMN driver_payments.exchange_rate IS
  'Çevirmede kullanılan kur: 1 EUR kaç USD. Ödeme gününün kuru; sonradan değişmez.';
COMMENT ON COLUMN driver_payments.paid_at IS
  'Hareketin olduğu an. Elle girilen kayıtlarda seçilen gün; eski satırlarda created_at.';

COMMIT;

-- ---------------------------------------------
-- KONTROL — dört kolon da yerinde olmalı
-- ---------------------------------------------
SELECT
  t.kolon,
  CASE WHEN c.column_name IS NULL THEN 'EKSİK' ELSE 'ok' END AS durum,
  c.data_type                                                AS tip
FROM (VALUES
  ('original_amount'),
  ('original_currency'),
  ('exchange_rate'),
  ('paid_at')
) AS t(kolon)
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name   = 'driver_payments'
 AND c.column_name  = t.kolon
ORDER BY t.kolon;
