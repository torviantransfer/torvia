-- =============================================
-- 091: Geride kalan fiyat satırlarını da euroya çevir
--
-- 087 yalnızca 'vip' (Mercedes Vito) kategorisini çevirdi. Ama `pricing`
-- tablosunda başka araç kategorilerine ait satırlar da var — bir aracın
-- kategorisi pasife alındığında fiyat satırları silinmiyor, olduğu yerde
-- kalıyor. Onlar hâlâ DOLAR tutarları taşıyor ve artık currency='USD'
-- yazdıkları için euro sanılmaya açıklar.
--
-- Bugün bunun iki sonucu oldu, ikisi de canlıda:
--
--   1. Bölge sayfası ve schema.org "en ucuz" satırı seçiyordu ve aktif
--      kategoriye bakmıyordu. Marmaris, emekli bir aracın 280'ini euro diye
--      ilan etti (gerçek fiyat 318) ve artık yapmadığımız 530'luk bir
--      gidiş-dönüş teklifini Google'a gösterdi. Kod tarafı aynı commit'te
--      düzeltildi: üç sorgu da aktif kategori şartı arıyor.
--
--   2. O kategorilerden biri panelden yeniden aktif edilirse, dolar rakamları
--      euro olarak satılırdı — %16 fazla tahsilat, hiçbir yerde hata yok.
--
-- Bu dosya ikincisini kapatır: euro olmayan her satır aynı kurla (0,86266,
-- 087'nin kullandığı) çevrilir ve currency='EUR' yapılır. 087'nin yazdığı
-- satırlara dokunmaz — onlar zaten EUR.
--
-- Ayrıca gidiş-dönüş kapalı sekiz bölgede round_trip alanları HER kategori
-- için boşaltılır. Tek bir kategoride kapatmak yetmez: yarın başka bir araç
-- aktif edilse o rotada yine dönüş satılmaya başlardı.
--
-- Tek transaction, tekrar çalıştırılabilir (ikinci çalıştırmada eşleşen satır
-- kalmaz, hiçbir şey değişmez).
-- =============================================

BEGIN;

-- ---------------------------------------------
-- 1. Euro olmayan her fiyat satırı
--
-- Kur elle yazılmadı; 087 ile aynı olması için USD bazlı satırdan okunur.
-- O satır silinmiş olsaydı çevrim sessizce NULL üretirdi, o yüzden önce
-- kontrol edilir.
-- ---------------------------------------------
DO $$
DECLARE e NUMERIC;
BEGIN
  SELECT rate INTO e
  FROM exchange_rates
  WHERE base_currency = 'USD' AND target_currency = 'EUR';

  IF e IS NULL OR e <= 0 THEN
    RAISE EXCEPTION 'USD→EUR kuru yok ya da gecersiz (%). Cevrim yapilamaz, hicbir sey yazilmadi.', e;
  END IF;
END $$;

UPDATE pricing p SET
  one_way_price         = ROUND(p.one_way_price         * e.rate),
  round_trip_price      = ROUND(p.round_trip_price      * e.rate),
  one_way_cash_price    = ROUND(p.one_way_cash_price    * e.rate),
  round_trip_cash_price = ROUND(p.round_trip_cash_price * e.rate),
  cash_deposit_amount   = ROUND(p.cash_deposit_amount   * e.rate),
  currency              = 'EUR'
FROM exchange_rates e
WHERE e.base_currency = 'USD'
  AND e.target_currency = 'EUR'
  AND p.currency IS DISTINCT FROM 'EUR';

-- ---------------------------------------------
-- 2. Gidiş-dönüş kapalı bölgeler — her araç için
--
-- 087 bunu yalnızca 'vip' satırında yaptı. Kapalı olması gereken rota,
-- hangi araç seçilirse seçilsin kapalı olmalı.
-- ---------------------------------------------
UPDATE pricing p SET
  round_trip_price               = NULL,
  round_trip_cash_price          = NULL,
  round_trip_cash_deposit_amount = NULL
FROM regions r
WHERE r.id = p.region_id
  AND r.slug IN ('kumluca', 'finike', 'demre', 'kas', 'kalkan', 'fethiye', 'marmaris')
  AND (p.round_trip_price IS NOT NULL
       OR p.round_trip_cash_price IS NOT NULL
       OR p.round_trip_cash_deposit_amount IS NOT NULL);

-- ---------------------------------------------
-- 3. GÜVENLİK — dolarda kalan satır bırakma
-- ---------------------------------------------
DO $$
DECLARE kalan INT;
BEGIN
  SELECT COUNT(*) INTO kalan FROM pricing WHERE currency IS DISTINCT FROM 'EUR';
  IF kalan > 0 THEN
    RAISE EXCEPTION '% satir hala EUR degil. Hicbir sey yazilmadi.', kalan;
  END IF;
END $$;

COMMIT;

-- ---------------------------------------------
-- KONTROL — araç bazında özet
--
-- para_birimi her satırda EUR olmalı. cift_yon_satiri sütunu, gidiş-dönüş
-- kapalı yedi bölgede 0 olmalı.
-- ---------------------------------------------
SELECT
  vc.slug                                            AS arac,
  vc.name                                            AS arac_adi,
  vc.is_active                                       AS arac_aktif,
  COUNT(*)                                           AS fiyat_satiri,
  COUNT(*) FILTER (WHERE p.currency = 'EUR')         AS eur_satiri,
  MIN(p.one_way_price)                               AS en_dusuk,
  MAX(p.one_way_price)                               AS en_yuksek,
  COUNT(*) FILTER (
    WHERE p.round_trip_price IS NOT NULL
      AND r.slug IN ('kumluca','finike','demre','kas','kalkan','fethiye','marmaris')
  )                                                  AS kapali_rotada_cift_yon
FROM pricing p
JOIN vehicle_categories vc ON vc.id = p.category_id
JOIN regions r             ON r.id = p.region_id
GROUP BY vc.id, vc.slug, vc.name, vc.is_active
ORDER BY vc.is_active DESC, vc.slug;
