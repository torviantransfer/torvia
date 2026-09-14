-- =============================================
-- 087: Tüm fiyatlar euroya — 34 bölge, Mercedes Vito (vip)
--
-- Site bugüne kadar dolarla fiyatlandırıldı ve euro yalnızca ekranda yapılan
-- bir çevirimdi. Bundan sonra tersi: fiyatlar euro olarak saklanır, Stripe
-- euro çeker, dolar ve lira ekranda çevrilir. Kod tarafı ayrı commit'te.
--
-- Rakamlar işletmenin verdiği dolar fiyat listesinden, 1 USD = 0,86266 EUR
-- (Frankfurter, 2026-09-14) ile çevrilip tam euroya yuvarlandı. Çevrim geri
-- döndüğünde listedeki dolar rakamı çıkar (örn. 75 $ → 65 € → 75,35 $ → 75 $),
-- yani ziyaretçi navbardan dolara geçtiğinde listedeki fiyatı görür.
--
-- DEPOZİTO — yalnızca kapıda ödeme (nakit) rezervasyonlarında alınır.
-- İşletmenin kuralı: en az 15 €, 70 € için 35 €, 140 € için 55 €. Merdiven:
--     ≤45 € → 15    |   81-110 € → 45   |  211-300 € → 90
--   46-60 € → 25    |  111-150 € → 55   |     301+ € → 110
--   61-80 € → 35    |  151-210 € → 70
--
-- Depozito için İKİNCİ bir kolon açılıyor: cash_deposit_amount tek değerdi ve
-- tek yön ile çift yön aynı depozitoyu alıyordu. 145 €'luk bir gidiş-dönüş,
-- 78 €'luk tek yönle aynı 35 € depozitoyu verirse kural anlamını yitirir.
--
-- ÇİFT YÖN — sekiz bölgede kapatılır (round_trip_price = NULL). İşletme bu
-- mesafelerde dönüş transferi yapmıyor; fiyat listesinde de çift yön sütunu
-- boş bırakılmış. Kaş, Kalkan, Fethiye ve Marmaris'te bugüne kadar satılıyordu,
-- bu onun düzeltmesidir. NULL bırakmak doğru biçim: /api/reservations zaten
-- round_trip_price yoksa çift yön rezervasyonu reddediyor.
--
-- Land of Legends listede çift yönsüz görünüyor ama havalimanına 40 km, yani
-- "uzak olduğu için yapmıyoruz" gerekçesi ona uymuyor ve bugün çift yön
-- satıyor. Listenin kendi formülüyle korundu (çift yön = 2 × tek yön − 1 →
-- 87 $ → 75 €). Kapatılması isteniyorsa tek satır: aşağıdaki listede
-- 'land-of-legends-transfer' satırının 2. ve 4. değerini NULL yap.
--
-- Tek transaction, tekrar çalıştırılabilir. Bir bölge eksikse hiçbir şey
-- yazılmaz — 010 ve 056'da bölgeler sessizce atlandığı için sayfalar
-- fiyatsız kalmıştı, o hata burada baştan engelleniyor.
--
-- ÖNCE 086 ÇALIŞTIRILMALI (Konyaaltı, Çolaklı, Çıralı, Kumluca, Finike, Demre).
-- =============================================

BEGIN;

-- ---------------------------------------------
-- 1. Çift yön için ayrı depozito kolonu
-- ---------------------------------------------
ALTER TABLE pricing
  ADD COLUMN IF NOT EXISTS round_trip_cash_deposit_amount NUMERIC(10,2);

COMMENT ON COLUMN pricing.round_trip_cash_deposit_amount IS
  'Gidiş-dönüş nakit rezervasyonunda online çekilen depozito. NULL = çift yön satılmıyor ya da tek yön depozitosu kullanılır. Tek yön karşılığı: cash_deposit_amount.';

-- ---------------------------------------------
-- 2. Fiyatlar — (slug, online tek, online çift, nakit tek, nakit çift,
--                depozito tek, depozito çift), hepsi EUR
-- ---------------------------------------------
CREATE TEMP TABLE yeni_fiyat (
  slug         TEXT PRIMARY KEY,
  online_tek   NUMERIC(10,2) NOT NULL,
  online_cift  NUMERIC(10,2),
  nakit_tek    NUMERIC(10,2),
  nakit_cift   NUMERIC(10,2),
  depozito_tek NUMERIC(10,2),
  depozito_cift NUMERIC(10,2)
) ON COMMIT DROP;

INSERT INTO yeni_fiyat VALUES
  ('sehirici', 28, 54, 35, 66, 15, 35),
  ('konyaalti', 31, 61, 39, 73, 15, 35),
  ('kundu-lara', 31, 61, 39, 73, 15, 35),
  ('land-of-legends-transfer', 38, 75, 48, 89, 25, 45),
  ('kadriye', 34, 66, 44, 80, 15, 35),
  ('belek', 39, 77, 49, 91, 25, 45),
  ('bogazkent', 41, 80, 51, 94, 25, 45),
  ('colakli', 41, 82, 53, 97, 25, 45),
  ('evrenseki', 42, 84, 53, 98, 25, 45),
  ('side', 43, 85, 54, 100, 25, 45),
  ('manavgat', 45, 89, 56, 104, 25, 45),
  ('kizilagac', 47, 92, 59, 108, 25, 45),
  ('okurcalar', 54, 108, 66, 123, 35, 55),
  ('avsallar', 55, 110, 67, 125, 35, 55),
  ('turkler', 56, 111, 68, 127, 35, 55),
  ('konakli', 56, 111, 68, 127, 35, 55),
  ('alanya', 65, 129, 78, 145, 35, 55),
  ('mahmutlar', 77, 153, 94, 173, 45, 70),
  ('kargicak', 78, 154, 95, 175, 45, 70),
  ('beldibi', 32, 63, 40, 75, 15, 35),
  ('goynuk', 38, 75, 46, 87, 25, 45),
  ('kemer', 49, 97, 58, 110, 25, 45),
  ('kiris', 50, 99, 59, 112, 25, 55),
  ('camyuva', 51, 101, 60, 114, 25, 55),
  ('tekirova', 57, 113, 67, 128, 35, 55),
  ('cirali', 67, 134, 78, 148, 35, 55),
  ('adrasan', 77, 153, 90, 170, 45, 70),
  ('kumluca', 85, NULL, 99, NULL, 45, NULL),
  ('finike', 98, NULL, 113, NULL, 55, NULL),
  ('demre', 137, NULL, 154, NULL, 70, NULL),
  ('kas', 157, NULL, 177, NULL, 70, NULL),
  ('kalkan', 172, NULL, 195, NULL, 70, NULL),
  ('fethiye', 219, NULL, 249, NULL, 90, NULL),
  ('marmaris', 318, NULL, 357, NULL, 110, NULL);

-- ---------------------------------------------
-- 3. GÜVENLİK — eksik bölge varsa hiçbir şey yazma
--
-- 010'un ve 056'nın hatası, JOIN'in eşleşmeyen satırı sessizce atlamasıydı:
-- bölge yazılmadı, kimse fark etmedi, sayfa aylarca fiyatsız kaldı. Burada
-- eşleşmeyen tek bir slug bile transaction'ı düşürür.
-- ---------------------------------------------
DO $$
DECLARE eksik TEXT;
BEGIN
  SELECT string_agg(f.slug, ', ' ORDER BY f.slug) INTO eksik
  FROM yeni_fiyat f
  WHERE NOT EXISTS (SELECT 1 FROM regions r WHERE r.slug = f.slug);

  IF eksik IS NOT NULL THEN
    RAISE EXCEPTION 'Bu slug''lar regions tablosunda yok: %. Önce 086 çalıştırılmalı. Hiçbir şey yazılmadı.', eksik;
  END IF;
END $$;

-- Vito kategorisi yoksa da durmalı: fiyat yazılacak satır kalmaz.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vehicle_categories WHERE slug = 'vip') THEN
    RAISE EXCEPTION 'vehicle_categories içinde ''vip'' (Mercedes Vito) yok. Hiçbir şey yazılmadı.';
  END IF;
END $$;

-- ---------------------------------------------
-- 4. YAZ — Vito (vip) için 34 bölgenin tamamı
--
-- UPSERT: mevcut 28 bölge güncellenir, 086'nın eklediği 6 bölge için satır
-- oluşturulur. Diğer araç kategorileri (ileride Sprinter/Transporter) kendi
-- fiyatlarını korur — burada yalnızca 'vip' hedeflenir.
-- ---------------------------------------------
INSERT INTO pricing (
  region_id, category_id,
  one_way_price, round_trip_price,
  one_way_cash_price, round_trip_cash_price,
  cash_deposit_amount, round_trip_cash_deposit_amount,
  currency, is_active
)
SELECT
  r.id, vc.id,
  f.online_tek, f.online_cift,
  f.nakit_tek, f.nakit_cift,
  f.depozito_tek, f.depozito_cift,
  'EUR', true
FROM yeni_fiyat f
JOIN regions r             ON r.slug = f.slug
CROSS JOIN vehicle_categories vc
WHERE vc.slug = 'vip'
ON CONFLICT (region_id, category_id) DO UPDATE SET
  one_way_price                  = EXCLUDED.one_way_price,
  round_trip_price               = EXCLUDED.round_trip_price,
  one_way_cash_price             = EXCLUDED.one_way_cash_price,
  round_trip_cash_price          = EXCLUDED.round_trip_cash_price,
  cash_deposit_amount            = EXCLUDED.cash_deposit_amount,
  round_trip_cash_deposit_amount = EXCLUDED.round_trip_cash_deposit_amount,
  currency                       = 'EUR',
  is_active                      = true;

-- ---------------------------------------------
-- 5. Listede olmayan bölgeler dolar kalmasın
--
-- Aktif bir bölgenin fiyatı listede yoksa, para birimi euroya geçtikten sonra
-- o satır dolar tutarını euro olarak sunar — sessiz bir %16 zam. Öyle bir satır
-- varsa transaction düşer ve hangisi olduğu yazılır.
-- ---------------------------------------------
DO $$
DECLARE atlanan TEXT;
BEGIN
  SELECT string_agg(DISTINCT r.slug, ', ') INTO atlanan
  FROM pricing p
  JOIN regions r            ON r.id = p.region_id
  JOIN vehicle_categories vc ON vc.id = p.category_id
  WHERE vc.slug = 'vip'
    AND r.is_active = true
    AND p.currency IS DISTINCT FROM 'EUR';

  IF atlanan IS NOT NULL THEN
    RAISE EXCEPTION 'Bu aktif bölgeler fiyat listesinde yok ve dolar kalıyor: %. Listeye eklenmeli. Hiçbir şey yazılmadı.', atlanan;
  END IF;
END $$;

COMMIT;

-- ---------------------------------------------
-- KONTROL — SQL Editor yalnızca son sorgunun sonucunu gösterir
--
-- Beklenen: 34 satır, para_birimi hepsinde EUR, dogrulama hepsinde 'ok'.
-- cift_yon sütunu sekiz bölgede 'KAPALI' olmalı: kumluca, finike, demre,
-- kas, kalkan, fethiye, marmaris (+ istenirse land-of-legends-transfer).
-- dolar_karsiligi sütunu işletmenin gönderdiği liste rakamını vermeli.
-- ---------------------------------------------
SELECT
  r.slug,
  r.is_active                                   AS bolge_aktif,
  p.currency                                    AS para_birimi,
  p.one_way_price                               AS online_tek,
  ROUND(p.one_way_price / 0.86266)              AS dolar_karsiligi,
  p.one_way_cash_price                          AS nakit_tek,
  p.cash_deposit_amount                         AS depozito_tek,
  p.one_way_cash_price - p.cash_deposit_amount  AS sofore_kalan_tek,
  CASE WHEN p.round_trip_price IS NULL THEN 'KAPALI'
       ELSE p.round_trip_price::TEXT END        AS cift_yon,
  p.round_trip_cash_deposit_amount              AS depozito_cift,
  CASE
    WHEN p.currency <> 'EUR'                          THEN 'HATA: euro degil'
    WHEN p.one_way_price IS NULL OR p.one_way_price<=0 THEN 'HATA: tek yon fiyati yok'
    WHEN p.one_way_cash_price IS NOT NULL
     AND p.cash_deposit_amount >= p.one_way_cash_price THEN 'HATA: depozito fiyati asiyor'
    WHEN p.round_trip_price IS NOT NULL
     AND p.round_trip_cash_deposit_amount IS NULL     THEN 'HATA: cift yon depozitosu yok'
    ELSE 'ok'
  END                                           AS dogrulama
FROM pricing p
JOIN regions r             ON r.id = p.region_id
JOIN vehicle_categories vc ON vc.id = p.category_id
WHERE vc.slug = 'vip'
ORDER BY p.one_way_price;
