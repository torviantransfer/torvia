-- =============================================
-- 090: Rezervasyonun gün kuru + şoför defterinin para birimi
--
-- Euro geçişinin şoför tarafında yarattığı sorun şu:
--
--   driver_assignments.driver_fee  = ŞİRKETİN şoföre ödediği, DOLAR
--   reservations.driver_amount     = YOLCUNUN şoföre verdiği nakit, artık EURO
--
-- lib/driverLedger.ts nakit işlerde ikincisini deftere ham sayı olarak
-- yazıyordu. İkisi de dolarken doğruydu. Euro geçince şoförün 60 €'luk
-- tahsilatı 70 $'lık hak edişinin karşısına "60" diye yazılır ve her nakit
-- işte bakiye kur farkı kadar (~%16) yanlış çıkar. Kimse hata almaz.
--
-- Çözüm: nakit tutar, rezervasyonun ALINDIĞI GÜNÜN kuruyla dolara çevrilip
-- yazılır. Bugünün kuruyla çevirmek yanlış olurdu — iş aylar önce yapılmış
-- olabilir ve şoförle o günkü kur üzerinden hesaplaşılır.
--
-- Bunun için rezervasyonun o günkü EUR→USD kuru saklanmalı. exchange_rate_eur
-- kolonu ters yönde (USD başına EUR) ve euro bazlı satırlarda anlamsız, o
-- yüzden yeni kolon.
--
-- Ayrıca iki para birimi kolonu açılıyor. Bugün her ikisi de 'USD' — şoför
-- ödemeleri dolar kalıyor, davranış değişmiyor. İleride bazı şoförlere euro
-- ödenmek istenirse şema hazır olsun diye şimdiden konuyor; panelde bir seçim
-- kutusu açmak dışında iş kalmaz.
--
-- Tek transaction, tekrar çalıştırılabilir.
-- =============================================

BEGIN;

-- ---------------------------------------------
-- 1. Rezervasyonun gün kuru: bir euro kaç dolar
-- ---------------------------------------------
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS exchange_rate_usd NUMERIC(12,6);

COMMENT ON COLUMN reservations.exchange_rate_usd IS
  'Rezervasyonun alındığı gün 1 EUR kaç USD ediyordu. Ekranda kullanılmaz; şoför defteri, yolcunun euro nakdini şoförün dolar hak edişine bu kurla yazar. Euro geçişinden önceki satırlarda NULL — onlarda tutarlar zaten dolar.';

-- ---------------------------------------------
-- 2. Şoför ücretinin para birimi
-- ---------------------------------------------
ALTER TABLE driver_assignments
  ADD COLUMN IF NOT EXISTS driver_fee_currency TEXT NOT NULL DEFAULT 'USD';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'driver_assignments_fee_currency_valid'
  ) THEN
    ALTER TABLE driver_assignments
      ADD CONSTRAINT driver_assignments_fee_currency_valid
      CHECK (driver_fee_currency IN ('USD', 'EUR'));
  END IF;
END $$;

COMMENT ON COLUMN driver_assignments.driver_fee_currency IS
  'driver_fee hangi para biriminde. Varsayılan USD: şoförlere dolar ödeniyor. Euro ödenmek istenirse EUR yapılır — defter satırları da o para biriminde yazılır.';

-- ---------------------------------------------
-- 3. Defter satırlarının para birimi
--
-- driver_payments.amount bugüne kadar para birimi taşımıyordu ve dolar olduğu
-- varsayılıyordu. Varsayım artık tutmuyor: aynı satır kümesinde bir dolar hak
-- ediş ve bir euro tahsilat bulunabilir. Kolon, her satırın ne olduğunu
-- kendi üzerinde taşısın diye ekleniyor.
-- ---------------------------------------------
ALTER TABLE driver_payments
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'driver_payments_currency_valid'
  ) THEN
    ALTER TABLE driver_payments
      ADD CONSTRAINT driver_payments_currency_valid
      CHECK (currency IN ('USD', 'EUR'));
  END IF;
END $$;

COMMENT ON COLUMN driver_payments.currency IS
  'Bu satırdaki amount hangi para biriminde. Geçmiş satırların tamamı USD (varsayılan), çünkü euro geçişinden önce her tutar dolardı.';

COMMIT;

-- ---------------------------------------------
-- KONTROL — üç kolon da yerinde olmalı
-- ---------------------------------------------
SELECT
  t.tablo,
  t.kolon,
  CASE WHEN c.column_name IS NULL THEN 'EKSİK' ELSE 'ok' END AS durum,
  c.data_type                                                AS tip,
  c.column_default                                           AS varsayilan
FROM (VALUES
  ('reservations',       'exchange_rate_usd'),
  ('driver_assignments', 'driver_fee_currency'),
  ('driver_payments',    'currency')
) AS t(tablo, kolon)
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name   = t.tablo
 AND c.column_name  = t.kolon
ORDER BY t.tablo;
