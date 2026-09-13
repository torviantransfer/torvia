-- =============================================
-- 085: Avsallar ve Konaklı bölgelerini geri getir + Türkler konum düzeltmesi
--
-- İkisi de 002_seed_regions.sql ile eklenmişti. 010'un DELETE'i
-- (id NOT LIKE 'b0000000%') seed.sql'de olmadıkları için ikisini de sildi —
-- Manavgat'ta (056) yaşanan hatanın aynısı. Canlıda /api/pricing ikisi için de
-- "Region not found" dönüyor (2026-09-14).
--
-- Talep (Google Trends, 5 yıl ortalama):
--   PL: Konaklı 29, Avsallar 15  — sitede olan Türkler 5
--   DE: Avsallar 52, Konaklı 29  — sitede olan Türkler 2
--
-- Mesafe/süre: OSRM yol verisi AYT→Avsallar 103,7 km / 85 dk,
-- AYT→Konaklı 116,9 km / 95 dk. Sitedeki komşularla aynı ölçeğe çekildi
-- (Türkler: OSRM 89 dk → sitede 95 dk). Sahil sırası:
-- Okurcalar → Avsallar → Türkler → Konaklı → Alanya.
--
-- Fiyat canlı Türkler satırından türetilir, elle yazılmaz:
--   Avsallar = Türkler         (Okurcalar ile Türkler arasında, ikisi aynı fiyat)
--   Konaklı  = Türkler + 5 $   (online tek/gidiş-dönüş, nakit tek/gidiş-dönüş);
--              depozito Türkler ile aynı
--
-- Görseller önce Supabase Storage'a yüklenmeli:
--   blog-images/regions/avsallar.jpg
--   blog-images/regions/konakli.jpg
--
-- İki bölge PASİF eklenir. Aktif yapmak panelden (/admin/regions) yapılmalı:
-- panel kaydı site önbelleğini ve sitemap.xml'i yeniler, bu SQL yenilemez.
--
-- Tek transaction: bir adım hata verirse hiçbir şey yazılmaz.
-- Tekrar çalıştırılabilir.
-- =============================================

BEGIN;

-- ---------------------------------------------
-- 1. AVSALLAR — 105 km, 95 dk
-- ---------------------------------------------
INSERT INTO regions (
  slug,
  name_tr, name_en, name_de, name_pl, name_ru, name_nl, name_ro,
  description_tr, description_en, description_de, description_pl,
  distance_km, duration_minutes, latitude, longitude, image_url,
  is_popular, is_active, sort_order
) VALUES (
  'avsallar',
  'Avsallar', 'Avsallar', 'Avsallar', 'Avsallar', 'Авсаллар', 'Avsallar', 'Avsallar',

  $tr$Avsallar, Antalya Havalimanı'na (AYT) yaklaşık 105 km uzaklıkta ve özel transferle yaklaşık 1 saat 35 dakika mesafede bir sahil beldesidir; Okurcalar ile Türkler arasında, Alanya merkezinin yaklaşık 25 km batısında yer alır. Kıyısında çam ormanının önünde uzanan ince kumlu İncekum plajı ve Granada Luxury Beach, Long Beach Resort, Rubi Platinum, Azura Deluxe gibi büyük her şey dahil oteller bulunur. Çevredeki yalnızca otellerden oluşan tatil şeritlerinden farklı olarak Avsallar gerçek bir beldedir: kendi dükkânları, restoranları ve haftalık pazarı vardır; otelden çıkıp dolaşmak için Alanya'ya gitmek gerekmez. Oteller D400 sahil yolu boyunca dağınık olduğu için özel şoför yoldaki diğer otellerde durmadan sizi doğrudan otelinizin kapısına bırakır. TORVIAN: özel havalimanı transferi, araç başına sabit fiyat, isim tabelasıyla karşılama, canlı uçuş takibi, 7/24.$tr$,

  $en$Avsallar is a coastal town about 105 km from Antalya Airport (AYT) and around 1 hour 35 minutes away by private transfer, lying between Okurcalar and Türkler, roughly 25 km west of Alanya centre. Its shoreline takes in İncekum, a long beach of fine sand backed by pine forest, and a row of large all-inclusive resorts such as Granada Luxury Beach, Long Beach Resort, Rubi Platinum and Azura Deluxe. Unlike the purpose-built hotel strips nearby, Avsallar is also a real town, with its own shops, restaurants and weekly market, so stepping outside the resort does not mean taking a bus to Alanya. The hotels are spread out along the D400 coast road, and a private driver takes you straight to your hotel entrance instead of stopping at every resort on the way. TORVIAN: private airport transfer, fixed price per vehicle, name-board welcome, live flight tracking, 24/7.$en$,

  $de$Avsallar ist ein Küstenort rund 105 km vom Flughafen Antalya (AYT) entfernt und mit dem Privattransfer in etwa 1 Stunde 35 Minuten erreichbar, zwischen Okurcalar und Türkler, gut 25 km westlich des Zentrums von Alanya. Zur Küste gehört der İncekum-Strand mit feinem Sand vor Kiefernwald, dazu eine Reihe großer All-inclusive-Resorts wie Granada Luxury Beach, Long Beach Resort, Rubi Platinum und Azura Deluxe. Anders als die reinen Hotelstreifen der Umgebung ist Avsallar ein richtiger Ort mit eigenen Geschäften, Restaurants und einem Wochenmarkt – wer die Anlage verlassen möchte, muss dafür nicht erst mit dem Bus nach Alanya fahren. Die Hotels liegen verteilt entlang der Küstenstraße D400; Ihr Privatfahrer bringt Sie direkt vor den Hoteleingang, ohne Zwischenstopps an anderen Resorts. TORVIAN: Privattransfer Flughafen Antalya nach Avsallar, Festpreis pro Fahrzeug, Empfang mit Namensschild, Flugverfolgung, 24/7.$de$,

  $pl$Avsallar to nadmorska miejscowość położona około 105 km od lotniska Antalya (AYT) i około 1 godziny 35 minut prywatnym transferem, między Okurcalar a Türkler, mniej więcej 25 km na zachód od centrum Alanyi. Do jej wybrzeża należy plaża İncekum z drobnym piaskiem i sosnowym lasem w tle, a wzdłuż niego stoją duże hotele all inclusive, m.in. Granada Luxury Beach, Long Beach Resort, Rubi Platinum i Azura Deluxe. W odróżnieniu od sąsiednich pasów samych hoteli Avsallar jest prawdziwym miasteczkiem z własnymi sklepami, restauracjami i cotygodniowym bazarem, więc żeby wyjść poza hotel, nie trzeba jechać autobusem do Alanyi. Hotele są rozrzucone wzdłuż nadmorskiej drogi D400, a prywatny kierowca zawiezie Cię prosto pod wejście do hotelu, bez zatrzymywania się przy innych obiektach. TORVIAN: prywatny transfer z lotniska Antalya do Avsallar, stała cena za pojazd, powitanie z tabliczką, monitoring lotu, 24/7.$pl$,

  105.0, 95, 36.623384, 31.767902,
  'https://ximlobdcblinqtlizwrz.supabase.co/storage/v1/object/public/blog-images/regions/avsallar.jpg',
  false, false, 9
)
ON CONFLICT (slug) DO UPDATE SET
  name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, name_de = EXCLUDED.name_de,
  name_pl = EXCLUDED.name_pl, name_ru = EXCLUDED.name_ru, name_nl = EXCLUDED.name_nl,
  name_ro = EXCLUDED.name_ro,
  description_tr = EXCLUDED.description_tr, description_en = EXCLUDED.description_en,
  description_de = EXCLUDED.description_de, description_pl = EXCLUDED.description_pl,
  distance_km = EXCLUDED.distance_km, duration_minutes = EXCLUDED.duration_minutes,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  image_url = EXCLUDED.image_url;

-- ---------------------------------------------
-- 2. KONAKLI — 118 km, 105 dk
-- ---------------------------------------------
INSERT INTO regions (
  slug,
  name_tr, name_en, name_de, name_pl, name_ru, name_nl, name_ro,
  description_tr, description_en, description_de, description_pl,
  distance_km, duration_minutes, latitude, longitude, image_url,
  is_popular, is_active, sort_order
) VALUES (
  'konakli',
  'Konaklı', 'Konaklı', 'Konaklı', 'Konaklı', 'Конаклы', 'Konaklı', 'Konaklı',

  $tr$Konaklı, Antalya Havalimanı'na (AYT) yaklaşık 118 km uzaklıkta ve özel transferle yaklaşık 1 saat 45 dakika mesafede bir tatil beldesidir; Türkler ile Alanya arasında, Alanya merkezinin yaklaşık 10 km batısında yer alır. Belde boyunca uzanan uzun sahilde her büyüklükte otel bulunur; en bilinenleri arasında Royal Garden Beach, Club Dizalya, Titan Select ve Miarosa Konaklı Garden sayılabilir. Konaklı yalnızca bir otel şeridi değildir: dükkânları, kafeleri, restoranları ve haftalık pazarıyla kendi merkezi vardır; Alanya Kalesi, liman ve Kleopatra Plajı ise kısa bir araba ya da dolmuş yolculuğu uzaklığındadır. Birçok tatilcinin Alanya merkezi yerine Konaklı'yı seçmesinin nedeni de bu dengedir: sahilde daha sakin bir konaklama, şehir ise hemen yanı başında. TORVIAN: özel havalimanı transferi, araç başına sabit fiyat, isim tabelasıyla karşılama, canlı uçuş takibi, 7/24.$tr$,

  $en$Konaklı is a resort town about 118 km from Antalya Airport (AYT) and around 1 hour 45 minutes away by private transfer, lying between Türkler and Alanya, about 10 km west of Alanya centre. A long beach runs the length of the town, lined with hotels of every size — among the best known are Royal Garden Beach, Club Dizalya, Titan Select and Miarosa Konaklı Garden. Konaklı is more than a hotel strip: it has its own centre with shops, cafés, restaurants and a weekly market, while Alanya's castle, harbour and Cleopatra Beach are a short drive or dolmuş ride away. That combination — a quieter base on the beach with the city close at hand — is why many visitors choose Konaklı over staying in Alanya itself. TORVIAN: private airport transfer, fixed price per vehicle, name-board welcome, live flight tracking, 24/7.$en$,

  $de$Konaklı ist ein Ferienort rund 118 km vom Flughafen Antalya (AYT) entfernt und mit dem Privattransfer in etwa 1 Stunde 45 Minuten erreichbar, zwischen Türkler und Alanya, etwa 10 km westlich des Zentrums von Alanya. Ein langer Strand zieht sich am ganzen Ort entlang, gesäumt von Hotels jeder Größe – zu den bekanntesten zählen Royal Garden Beach, Club Dizalya, Titan Select und Miarosa Konaklı Garden. Konaklı ist mehr als ein Hotelstreifen: Der Ort hat ein eigenes Zentrum mit Geschäften, Cafés, Restaurants und einem Wochenmarkt, und Burg, Hafen und Kleopatra-Strand von Alanya sind mit dem Auto oder Dolmuş schnell erreicht. Genau diese Mischung – ein ruhigerer Urlaubsort am Strand, die Stadt gleich nebenan – ist für viele Urlauber der Grund, in Konaklı statt in Alanya selbst zu wohnen. TORVIAN: Privattransfer Flughafen Antalya nach Konaklı, Festpreis pro Fahrzeug, Empfang mit Namensschild, Flugverfolgung, 24/7.$de$,

  $pl$Konaklı to kurort położony około 118 km od lotniska Antalya (AYT) i około 1 godziny 45 minut prywatnym transferem, między Türkler a Alanyą, mniej więcej 10 km na zachód od centrum Alanyi. Wzdłuż całej miejscowości ciągnie się długa plaża z hotelami każdej wielkości – do najbardziej znanych należą Royal Garden Beach, Club Dizalya, Titan Select i Miarosa Konaklı Garden. Konaklı to coś więcej niż pas hoteli: ma własne centrum ze sklepami, kawiarniami, restauracjami i cotygodniowym bazarem, a zamek, port i Plaża Kleopatry w Alanyi są w zasięgu krótkiej jazdy samochodem lub dolmuszem. Dla wielu turystów właśnie to połączenie – spokojniejsza baza przy plaży i miasto tuż obok – jest powodem, by zamieszkać w Konaklı, a nie w samej Alanyi. TORVIAN: prywatny transfer z lotniska Antalya do Konaklı, stała cena za pojazd, powitanie z tabliczką, monitoring lotu, 24/7.$pl$,

  118.0, 105, 36.585897, 31.890389,
  'https://ximlobdcblinqtlizwrz.supabase.co/storage/v1/object/public/blog-images/regions/konakli.jpg',
  false, false, 10
)
ON CONFLICT (slug) DO UPDATE SET
  name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, name_de = EXCLUDED.name_de,
  name_pl = EXCLUDED.name_pl, name_ru = EXCLUDED.name_ru, name_nl = EXCLUDED.name_nl,
  name_ro = EXCLUDED.name_ro,
  description_tr = EXCLUDED.description_tr, description_en = EXCLUDED.description_en,
  description_de = EXCLUDED.description_de, description_pl = EXCLUDED.description_pl,
  distance_km = EXCLUDED.distance_km, duration_minutes = EXCLUDED.duration_minutes,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  image_url = EXCLUDED.image_url;

-- ---------------------------------------------
-- 3. FİYATLAR — canlı Türkler satırlarından, her araç kategorisi için
--
-- Nakit fiyatlar ve depozito da aynı satırdan gelir, yani kapıda ödeme farkı
-- (online'dan pahalı) ve depozito düzeni Türkler ile birebir aynı kalır.
-- ---------------------------------------------
INSERT INTO pricing (
  region_id, category_id,
  one_way_price, round_trip_price,
  one_way_cash_price, round_trip_cash_price, cash_deposit_amount,
  currency, is_active
)
SELECT
  r.id, p.category_id,
  p.one_way_price + d.delta,
  p.round_trip_price + d.delta,
  p.one_way_cash_price + d.delta,
  p.round_trip_cash_price + d.delta,
  p.cash_deposit_amount,
  p.currency,
  p.is_active
FROM (VALUES ('avsallar', 0), ('konakli', 5)) AS d(slug, delta)
JOIN regions r   ON r.slug = d.slug
JOIN regions src ON src.slug = 'turkler'
JOIN pricing p   ON p.region_id = src.id
ON CONFLICT (region_id, category_id) DO UPDATE SET
  one_way_price         = EXCLUDED.one_way_price,
  round_trip_price      = EXCLUDED.round_trip_price,
  one_way_cash_price    = EXCLUDED.one_way_cash_price,
  round_trip_cash_price = EXCLUDED.round_trip_cash_price,
  cash_deposit_amount   = EXCLUDED.cash_deposit_amount,
  currency              = EXCLUDED.currency,
  is_active             = EXCLUDED.is_active;

-- Türkler'in fiyat satırı yoksa bölgeler fiyatsız kalırdı; o durumda her şeyi
-- geri al. Sessizce 0 satır yazıp devam etmek, Uber yazısını 404'e düşüren
-- hatanın aynısı olurdu.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM regions r
    WHERE r.slug IN ('avsallar', 'konakli')
      AND NOT EXISTS (SELECT 1 FROM pricing p WHERE p.region_id = r.id)
  ) THEN
    RAISE EXCEPTION 'Türkler fiyatı bulunamadı: Avsallar/Konaklı fiyatsız kalırdı. Hiçbir şey yazılmadı.';
  END IF;
END $$;

-- ---------------------------------------------
-- 4. TÜRKLER — yanlış konum ve süre
--
-- Metin "Okurcalar ile Avsallar arasında" diyordu; doğru sıra
-- Okurcalar → Avsallar → Türkler → Konaklı. Metindeki süre (1 saat 25 dk)
-- da bölge satırındaki 95 dk ile çelişiyordu.
--
-- Yalnızca yanlış ifade değiştirilir, metnin geri kalanına dokunulmaz. İfade
-- panelden değiştirilmişse REPLACE hiçbir şey yapmaz — sondaki kontrol
-- sütunu bunu gösterir.
-- ---------------------------------------------
UPDATE regions SET
  description_en = REPLACE(description_en,
    $o$about 1 hour 25 minutes away by private transfer, sitting between Okurcalar and Avsallar just west of Alanya$o$,
    $n$about 1 hour 35 minutes away by private transfer, sitting between Avsallar and Konaklı just west of Alanya$n$),
  description_tr = REPLACE(description_tr,
    $o$yaklaşık 1 saat 25 dakika mesafededir; Alanya'nın hemen batısında Okurcalar ile Avsallar arasında yer alır$o$,
    $n$yaklaşık 1 saat 35 dakika mesafededir; Alanya'nın hemen batısında Avsallar ile Konaklı arasında yer alır$n$),
  description_de = REPLACE(description_de,
    $o$in etwa 1 Stunde 25 Minuten mit dem Privattransfer erreichbar, zwischen Okurcalar und Avsallar westlich von Alanya$o$,
    $n$in etwa 1 Stunde 35 Minuten mit dem Privattransfer erreichbar, zwischen Avsallar und Konaklı westlich von Alanya$n$),
  description_pl = REPLACE(description_pl,
    $o$około 1 godziny 25 minut prywatnym transferem, między Okurcalar a Avsallar tuż na zachód od Alanyi$o$,
    $n$około 1 godziny 35 minut prywatnym transferem, między Avsallar a Konaklı tuż na zachód od Alanyi$n$),
  description_ru = REPLACE(description_ru,
    $o$около 1 часа 25 минут на частном трансфере, между Окурджаларом и Авсалларом, чуть западнее Аланьи$o$,
    $n$около 1 часа 35 минут на частном трансфере, между Авсалларом и Конаклы, чуть западнее Аланьи$n$),
  description_nl = REPLACE(description_nl,
    $o$ongeveer 1 uur 25 minuten met een privétransfer, tussen Okurcalar en Avsallar net ten westen van Alanya$o$,
    $n$ongeveer 1 uur 35 minuten met een privétransfer, tussen Avsallar en Konaklı net ten westen van Alanya$n$)
WHERE slug = 'turkler';

COMMIT;

-- ---------------------------------------------
-- 5. KONTROL — SQL Editor yalnızca son sorgunun sonucunu gösterir
--
-- Beklenen (vip): Avsallar = Türkler; Konaklı = Türkler + 5 $, depozito aynı.
-- turkler_konum sütunu Türkler satırında "düzeltildi" olmalı.
-- ---------------------------------------------
SELECT
  r.slug,
  r.is_active                                     AS aktif,
  r.distance_km                                   AS km,
  r.duration_minutes                              AS dakika,
  vc.slug                                         AS arac,
  p.one_way_price                                 AS online_tek,
  p.round_trip_price                              AS online_gidis_donus,
  p.one_way_cash_price                            AS nakit_tek,
  p.round_trip_cash_price                         AS nakit_gidis_donus,
  p.cash_deposit_amount                           AS depozito,
  p.one_way_cash_price - p.cash_deposit_amount    AS sofore_kalan_tek,
  CASE WHEN r.slug = 'turkler' THEN
    CASE WHEN concat_ws(' ', r.description_tr, r.description_en, r.description_de,
                             r.description_pl, r.description_ru, r.description_nl,
                             r.description_ro)
              ~* '(Okurcalar|Окурджалар).{0,20}(Avsallar|Авсаллар)'
         THEN 'HATA: eski konum hâlâ var'
         ELSE 'düzeltildi' END
  END                                             AS turkler_konum
FROM regions r
LEFT JOIN pricing p            ON p.region_id = r.id
LEFT JOIN vehicle_categories vc ON vc.id = p.category_id
WHERE r.slug IN ('okurcalar', 'avsallar', 'turkler', 'konakli', 'alanya')
ORDER BY r.distance_km, vc.slug;
