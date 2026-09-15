-- =============================================
-- 093: Kasa (gelir-gider) ve şoföre TL ödeme
--
-- 1. Şoföre TL ödeme
--    Bazı şoförlere doğrudan 1.500 ₺, 3.500 ₺ veriliyor. Şoför hesabı dolar
--    kalır; TL ödeme, ödeme gününün kuruyla dolara çevrilip borçtan düşer ve
--    satır TL tutarı ile kuru yanında saklar (092'deki euro ödemeyle aynı yol).
--    exchange_rate artık "1 birim asıl para kaç USD" demek: EUR için ~1,16,
--    TRY için ~0,024. Böyle küçük bir kuru 6 hane yuvarlasaydı 3.500 ₺'lik
--    ödemede kuruş kayardı, o yüzden hassasiyet 10 haneye çıkıyor.
--
-- 2. Kasa
--    Şirketin kâr/zarar tablosu euro tutulur. Ciro ve şoför maliyeti
--    rezervasyonlardan otomatik gelir; reklam gibi giderler ve diğer gelirler
--    buraya elle girilir. Her hareket girildiği para biriminde saklanır ve o
--    günün kuruyla euroya çevrilmiş hali (amount_eur) yanına yazılır; aylar
--    sonra kur değiştiğinde geçmiş kâr oynamaz.
--
-- 092'den sonra çalıştırılmalı. Tek transaction, tekrar çalıştırılabilir.
-- =============================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'driver_payments' AND column_name = 'exchange_rate'
  ) THEN
    RAISE EXCEPTION '093: driver_payments.exchange_rate yok — önce 092 çalıştırılmalı.';
  END IF;
END $$;

-- ---------------------------------------------
-- 1. Şoföre TL ödeme
-- ---------------------------------------------
ALTER TABLE driver_payments ALTER COLUMN exchange_rate TYPE NUMERIC(18,10);

ALTER TABLE driver_payments DROP CONSTRAINT IF EXISTS driver_payments_original_currency_valid;
ALTER TABLE driver_payments
  ADD CONSTRAINT driver_payments_original_currency_valid
  CHECK (original_currency IS NULL OR original_currency IN ('USD', 'EUR', 'TRY'));

COMMENT ON COLUMN driver_payments.exchange_rate IS
  '1 birim asıl para (original_currency) kaç USD: EUR için ~1,16, TRY için ~0,024. Ödeme gününün kuru; sonradan değişmez.';

-- ---------------------------------------------
-- 2. Kasa kategorileri
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS finance_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  kind        TEXT NOT NULL DEFAULT 'expense' CHECK (kind IN ('income', 'expense')),
  sort_order  INT NOT NULL DEFAULT 100,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO finance_categories (name, kind, sort_order) VALUES
  ('Google Ads',  'expense', 10),
  ('Meta Reklam', 'expense', 20),
  ('Diğer gider', 'expense', 900),
  ('Diğer gelir', 'income',  900)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------
-- 3. Kasa hareketleri
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS finance_entries (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_date     DATE NOT NULL,
  kind           TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  category_id    UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency       TEXT NOT NULL CHECK (currency IN ('EUR', 'USD', 'TRY')),
  -- 1 birim `currency` kaç EUR. Euro için 1.
  exchange_rate  NUMERIC(18,10) NOT NULL CHECK (exchange_rate > 0),
  amount_eur     NUMERIC(12,2) NOT NULL,
  description    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_entries_entry_date_idx ON finance_entries (entry_date);

COMMENT ON TABLE finance_entries IS
  'Kasaya elle girilen gelir ve giderler (reklam vb.). Ciro ve şoför maliyeti buraya yazılmaz, rezervasyonlardan hesaplanır.';
COMMENT ON COLUMN finance_entries.amount_eur IS
  'amount, girildiği günün kuruyla euroya çevrilmiş hali. Raporlar bunu toplar.';

-- Yalnızca sunucu (service role) okur ve yazar.
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ---------------------------------------------
-- KONTROL
-- ---------------------------------------------
SELECT 'finance_categories' AS nesne, COUNT(*)::text AS durum FROM finance_categories
UNION ALL
SELECT 'finance_entries', CASE WHEN to_regclass('public.finance_entries') IS NULL THEN 'EKSİK' ELSE 'ok' END
UNION ALL
SELECT 'driver_payments.exchange_rate', numeric_precision::text || ',' || numeric_scale::text
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'driver_payments' AND column_name = 'exchange_rate';
