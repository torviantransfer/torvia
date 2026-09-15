-- =============================================
-- 096: Para iadesi (A4)
--
-- İptal onayı şimdiye kadar yalnızca durumu "cancelled" yapıyor ve şoför
-- atamalarını kapatıyordu; para iadesi Stripe panelinden elle yapılıyordu.
-- Artık iade panelden yapılabiliyor, dolayısıyla bir rezervasyonun ne kadarının
-- iade edildiğini burada da tutmamız gerekiyor.
--
-- Doğruluk kaynağı yine Stripe'tır: iade yapılmadan önce PaymentIntent okunur,
-- gerçekte tahsil edilmiş tutar ve o ana kadar iade edilmiş kısım oradan gelir.
-- Buradaki iki sütun, çekmecenin her açılışında Stripe'a gitmeden durumu
-- gösterebilmek için tutulan aynadır.
--
-- refunded_amount, ödemenin yapıldığı para biriminde ve Stripe'ın döndürdüğü
-- toplam iade tutarıdır (kısmi iadeler biriktikçe büyür). refunded_currency
-- rezervasyonun kendi `currency` sütunundan ayrı tutulur: eski kayıtlar USD
-- tahsil edilmişken satırın para birimi değişmiş olabilir ve iadeyi asıl
-- tahsilatın para biriminden başka bir şeyle göstermek yanlış olur.
--
-- Tek transaction, tekrar çalıştırılabilir.
-- =============================================

BEGIN;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS refunded_amount    NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_currency  TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at        TIMESTAMPTZ;

COMMENT ON COLUMN reservations.refunded_amount IS
  'Stripe''ta bu rezervasyon için iade edilmiş toplam tutar. 0 = iade yok.';
COMMENT ON COLUMN reservations.refunded_currency IS
  'İadenin para birimi — tahsilatın para birimi, satırın currency sütunu değil.';
COMMENT ON COLUMN reservations.refunded_at IS
  'Son iadenin zamanı.';

-- Kısmen veya tamamen iade edilmiş kayıtlar finans ekranlarında aranacak.
CREATE INDEX IF NOT EXISTS idx_reservations_refunded
  ON reservations (refunded_at DESC)
  WHERE refunded_amount > 0;

COMMIT;
