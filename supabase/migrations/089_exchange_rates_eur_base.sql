-- =============================================
-- 089: Kur tablosuna EUR bazlı satırlar
--
-- Kod artık `base_currency = 'EUR'` okuyor. Bu satırlar yoksa kur haritası boş
-- döner, para birimi seçici çalışmaz ve dolara/liraya geçen ziyaretçi euro
-- fiyatı görmeye devam eder. Cron saatte bir yazıyor ama deploy ile ilk cron
-- arasındaki boşluk canlı bir sitede kabul edilemez, o yüzden satırlar burada
-- baştan konur.
--
-- Rakam elle yazılmaz, mevcut USD bazlı satırlardan türetilir:
--   USD bazlı:  1 USD = e EUR,  1 USD = t TRY
--   EUR bazlı:  1 EUR = 1/e USD,  1 EUR = t/e TRY
-- Böylece bu dosya hangi gün çalıştırılırsa çalıştırılsın o günün kuruyla
-- tutarlı olur; elle yazılmış bir sayı aylar sonra yanlış olurdu.
--
-- USD bazlı satırlar SİLİNMEZ. Artık hiçbir kod onları okumuyor, ama euro
-- geçişinden önce alınan rezervasyonların hangi kurla çevrildiğinin tek kaydı
-- onlar — silmek geçmiş voucher ve e-postaları doğrulanamaz hale getirir.
--
-- Tek transaction, tekrar çalıştırılabilir.
-- =============================================

BEGIN;

-- ---------------------------------------------
-- GÜVENLİK — kaynak satırlar yoksa hiçbir şey yazma
--
-- Türetme USD bazlı EUR satırına bölme yapıyor; satır yoksa ya da rate 0 ise
-- sonuç ya NULL ya sonsuz olur ve sitenin bütün fiyatları bozulur.
-- ---------------------------------------------
DO $$
DECLARE e NUMERIC;
BEGIN
  SELECT rate INTO e
  FROM exchange_rates
  WHERE base_currency = 'USD' AND target_currency = 'EUR';

  IF e IS NULL OR e <= 0 THEN
    RAISE EXCEPTION 'USD→EUR kuru yok ya da gecersiz (%). EUR bazli satirlar turetilemez, hicbir sey yazilmadi.', e;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM exchange_rates
    WHERE base_currency = 'USD' AND target_currency = 'TRY' AND rate > 0
  ) THEN
    RAISE EXCEPTION 'USD→TRY kuru yok ya da gecersiz. Hicbir sey yazilmadi.';
  END IF;
END $$;

-- ---------------------------------------------
-- EUR → USD  ve  EUR → TRY
-- ---------------------------------------------
INSERT INTO exchange_rates (base_currency, target_currency, rate, last_updated)
SELECT 'EUR', 'USD', ROUND(1 / e.rate, 6), NOW()
FROM exchange_rates e
WHERE e.base_currency = 'USD' AND e.target_currency = 'EUR'
ON CONFLICT (base_currency, target_currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  last_updated = EXCLUDED.last_updated;

INSERT INTO exchange_rates (base_currency, target_currency, rate, last_updated)
SELECT 'EUR', 'TRY', ROUND(t.rate / e.rate, 6), NOW()
FROM exchange_rates t
JOIN exchange_rates e
  ON e.base_currency = 'USD' AND e.target_currency = 'EUR'
WHERE t.base_currency = 'USD' AND t.target_currency = 'TRY'
ON CONFLICT (base_currency, target_currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  last_updated = EXCLUDED.last_updated;

-- ---------------------------------------------
-- GÜVENLİK — makul aralık kontrolü
--
-- Ters çevrim kolayca fark edilmeden yanlış yöne gidebilir: 1 EUR ≈ 1,16 USD
-- yerine 0,86 yazılırsa site her fiyatı %26 ucuz gösterir ve kimse hata
-- almaz. Aralık geniş tutuldu, amaç yön hatasını yakalamak.
-- ---------------------------------------------
DO $$
DECLARE u NUMERIC; l NUMERIC;
BEGIN
  SELECT rate INTO u FROM exchange_rates WHERE base_currency='EUR' AND target_currency='USD';
  SELECT rate INTO l FROM exchange_rates WHERE base_currency='EUR' AND target_currency='TRY';

  IF u IS NULL OR u < 1.0 OR u > 1.6 THEN
    RAISE EXCEPTION 'EUR→USD kuru makul degil (%). 1 EUR bir dolardan fazla etmeli; yon ters cevrilmis olabilir.', u;
  END IF;

  IF l IS NULL OR l < 20 OR l > 200 THEN
    RAISE EXCEPTION 'EUR→TRY kuru makul degil (%).', l;
  END IF;
END $$;

COMMIT;

-- ---------------------------------------------
-- KONTROL — dört satır dönmeli
--
-- EUR bazlı iki satır yeni, USD bazlı iki satır geçmiş kayıt olarak durur.
-- kontrol sütunu EUR satırlarında 'ok' olmalı.
-- ---------------------------------------------
SELECT
  base_currency        AS baz,
  target_currency      AS hedef,
  rate                 AS kur,
  last_updated         AS guncellendi,
  CASE
    WHEN base_currency <> 'EUR' THEN 'eski kayit (okunmuyor)'
    WHEN target_currency = 'USD' AND rate BETWEEN 1.0 AND 1.6 THEN 'ok'
    WHEN target_currency = 'TRY' AND rate BETWEEN 20 AND 200  THEN 'ok'
    ELSE 'HATA: kur makul degil'
  END                  AS kontrol
FROM exchange_rates
ORDER BY base_currency DESC, target_currency;
