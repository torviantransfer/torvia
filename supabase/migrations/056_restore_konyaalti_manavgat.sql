-- =============================================
-- 056: Restore Konyaaltı and Manavgat as bookable regions.
--
-- Both are served in practice but neither has a working page:
--
--   * konyaalti — migration 010 set is_active = false. Its stated reason was
--     that the region overlapped "sehirici" AND had no pricing row, so the
--     page rendered a "Pricing not found" error. The overlap is real but the
--     two are not the same search: "sehirici" is the city centre, Konyaaltı is
--     the beach strip with its own hotels. The content below keeps them apart
--     so they do not compete for the same query.
--
--   * manavgat — migration 010 DELETED the row outright. Its guard was
--     `id NOT LIKE 'b0000000%'`, meant to remove the duplicates migration 002
--     had added on top of seed.sql. But seed.sql never contained manavgat, so
--     every manavgat row matched the guard and the region disappeared
--     completely. This re-inserts it.
--
-- Both are left is_active = false on purpose. See the two manual steps at the
-- bottom of this file — the prices here are placeholders and must be replaced
-- before either region goes live.
--
-- Content is written for all six locales because the region page marks a
-- locale noindex when description_<locale> and meta_title_<locale> are both
-- empty, and sitemap.ts mirrors that. A region added through the admin panel
-- gets names only, so it would launch indexable in tr/en and invisible in
-- de/pl/ru/nl.
-- =============================================

-- ---------------------------------------------
-- 1. MANAVGAT — re-insert (row was deleted)
--
-- distance_km / duration_minutes are road estimates from AYT and should be
-- checked against the figures actually quoted to customers.
-- ---------------------------------------------
INSERT INTO regions (
  slug,
  name_tr, name_en, name_de, name_pl, name_ru, name_nl,
  description_tr, description_en, description_de, description_pl, description_ru, description_nl,
  meta_title_tr, meta_title_en, meta_title_de, meta_title_pl, meta_title_ru, meta_title_nl,
  meta_description_tr, meta_description_en, meta_description_de, meta_description_pl, meta_description_ru, meta_description_nl,
  distance_km, duration_minutes, latitude, longitude,
  is_popular, is_active, sort_order
)
SELECT
  'manavgat',
  'Manavgat', 'Manavgat', 'Manavgat', 'Manavgat', 'Манавгат', 'Manavgat',

  $tr$Antalya Havalimanı'ndan Manavgat'a özel VIP transfer. Manavgat Şelalesi çevresindeki oteller, Side yolu üzerindeki tatil köyleri ve ilçe merkezine sabit fiyatlı, kapıdan kapıya ulaşım.$tr$,
  $en$Private VIP transfer from Antalya Airport to Manavgat. Fixed-price, door-to-door transport to the hotels around Manavgat Waterfall, the resorts along the Side road and the town centre.$en$,
  $de$Privater VIP-Transfer vom Flughafen Antalya nach Manavgat. Festpreis und Tür-zu-Tür-Service zu den Hotels rund um den Manavgat-Wasserfall, den Resorts an der Straße nach Side und ins Stadtzentrum.$de$,
  $pl$Prywatny transfer VIP z lotniska Antalya do Manavgat. Stała cena i przewóz od drzwi do drzwi do hoteli przy wodospadzie Manavgat, kurortów przy drodze do Side oraz do centrum miasta.$pl$,
  $ru$Частный VIP-трансфер из аэропорта Анталии в Манавгат. Фиксированная цена и доставка «от двери до двери» к отелям у водопада Манавгат, курортам вдоль дороги на Сиде и в центр города.$ru$,
  $nl$Privé VIP-transfer vanaf de luchthaven Antalya naar Manavgat. Vaste prijs en vervoer van deur tot deur naar de hotels rond de Manavgat-waterval, de resorts langs de weg naar Side en het stadscentrum.$nl$,

  $tr$Antalya Havalimanı Manavgat Transfer | Sabit Fiyat, Özel Araç$tr$,
  $en$Antalya Airport to Manavgat Transfer | Fixed Price, Private Car$en$,
  $de$Flughafen Antalya Manavgat Transfer | Festpreis, Privatwagen$de$,
  $pl$Transfer z Lotniska Antalya do Manavgat | Stała Cena$pl$,
  $ru$Трансфер Аэропорт Анталии — Манавгат | Фиксированная Цена$ru$,
  $nl$Transfer Luchthaven Antalya naar Manavgat | Vaste Prijs$nl$,

  $tr$Antalya Havalimanı Manavgat transferi. Özel araç, sabit fiyat, uçuş takibi ve online rezervasyon. Manavgat Şelalesi ve çevre otellere kapıdan kapıya transfer.$tr$,
  $en$Antalya Airport to Manavgat transfer. Private vehicle, fixed price, flight tracking and online booking. Door-to-door service to Manavgat Waterfall and nearby hotels.$en$,
  $de$Transfer Flughafen Antalya nach Manavgat. Privatfahrzeug, Festpreis, Flugverfolgung und Online-Buchung. Tür-zu-Tür-Service zum Manavgat-Wasserfall und zu den Hotels der Umgebung.$de$,
  $pl$Transfer z lotniska Antalya do Manavgat. Prywatny pojazd, stała cena, śledzenie lotu i rezerwacja online. Dojazd od drzwi do drzwi do wodospadu Manavgat i okolicznych hoteli.$pl$,
  $ru$Трансфер из аэропорта Анталии в Манавгат. Частный автомобиль, фиксированная цена, отслеживание рейса и онлайн-бронирование. Доставка к водопаду Манавгат и отелям поблизости.$ru$,
  $nl$Transfer van de luchthaven Antalya naar Manavgat. Privévoertuig, vaste prijs, vluchtmonitoring en online reserveren. Van deur tot deur naar de Manavgat-waterval en nabijgelegen hotels.$nl$,

  65.0, 55, 36.786900, 31.443000,
  false, false, 90
WHERE NOT EXISTS (SELECT 1 FROM regions WHERE slug = 'manavgat');

-- ---------------------------------------------
-- 2. KONYAALTI — fill in content on the existing (deactivated) row
--
-- Deliberately written around the beach strip and its hotels, never around
-- "Antalya city centre", which is what `sehirici` already ranks for.
-- ---------------------------------------------
UPDATE regions SET
  name_tr = 'Konyaaltı', name_en = 'Konyaaltı', name_de = 'Konyaaltı',
  name_pl = 'Konyaaltı', name_ru = 'Коньяалты', name_nl = 'Konyaaltı',

  description_tr = $tr$Antalya Havalimanı'ndan Konyaaltı'na özel VIP transfer. Konyaaltı Plajı boyunca uzanan sahil otelleri, Liman ve Hurma bölgesindeki konaklama noktalarına sabit fiyatlı, kapıdan kapıya ulaşım.$tr$,
  description_en = $en$Private VIP transfer from Antalya Airport to Konyaaltı. Fixed-price, door-to-door transport to the seafront hotels along Konyaaltı Beach and to accommodation in the Liman and Hurma districts.$en$,
  description_de = $de$Privater VIP-Transfer vom Flughafen Antalya nach Konyaaltı. Festpreis und Tür-zu-Tür-Service zu den Strandhotels entlang des Konyaaltı-Strands sowie zu Unterkünften in Liman und Hurma.$de$,
  description_pl = $pl$Prywatny transfer VIP z lotniska Antalya do Konyaaltı. Stała cena i przewóz od drzwi do drzwi do nadmorskich hoteli wzdłuż plaży Konyaaltı oraz do obiektów w dzielnicach Liman i Hurma.$pl$,
  description_ru = $ru$Частный VIP-трансфер из аэропорта Анталии в Коньяалты. Фиксированная цена и доставка «от двери до двери» к отелям на первой линии пляжа Коньяалты и к жилью в районах Лиман и Хурма.$ru$,
  description_nl = $nl$Privé VIP-transfer vanaf de luchthaven Antalya naar Konyaaltı. Vaste prijs en vervoer van deur tot deur naar de strandhotels langs het Konyaaltı-strand en naar accommodaties in Liman en Hurma.$nl$,

  meta_title_tr = $tr$Antalya Havalimanı Konyaaltı Transfer | Sabit Fiyat, Özel Araç$tr$,
  meta_title_en = $en$Antalya Airport to Konyaaltı Transfer | Fixed Price, Private Car$en$,
  meta_title_de = $de$Flughafen Antalya Konyaaltı Transfer | Festpreis, Privatwagen$de$,
  meta_title_pl = $pl$Transfer z Lotniska Antalya do Konyaaltı | Stała Cena$pl$,
  meta_title_ru = $ru$Трансфер Аэропорт Анталии — Коньяалты | Фиксированная Цена$ru$,
  meta_title_nl = $nl$Transfer Luchthaven Antalya naar Konyaaltı | Vaste Prijs$nl$,

  meta_description_tr = $tr$Antalya Havalimanı Konyaaltı transferi. Özel araç, sabit fiyat, uçuş takibi ve online rezervasyon. Konyaaltı sahil otellerine kapıdan kapıya transfer.$tr$,
  meta_description_en = $en$Antalya Airport to Konyaaltı transfer. Private vehicle, fixed price, flight tracking and online booking. Door-to-door service to the Konyaaltı beachfront hotels.$en$,
  meta_description_de = $de$Transfer Flughafen Antalya nach Konyaaltı. Privatfahrzeug, Festpreis, Flugverfolgung und Online-Buchung. Tür-zu-Tür-Service zu den Strandhotels von Konyaaltı.$de$,
  meta_description_pl = $pl$Transfer z lotniska Antalya do Konyaaltı. Prywatny pojazd, stała cena, śledzenie lotu i rezerwacja online. Dojazd od drzwi do drzwi do hoteli przy plaży Konyaaltı.$pl$,
  meta_description_ru = $ru$Трансфер из аэропорта Анталии в Коньяалты. Частный автомобиль, фиксированная цена, отслеживание рейса и онлайн-бронирование. Доставка к пляжным отелям Коньяалты.$ru$,
  meta_description_nl = $nl$Transfer van de luchthaven Antalya naar Konyaaltı. Privévoertuig, vaste prijs, vluchtmonitoring en online reserveren. Van deur tot deur naar de strandhotels van Konyaaltı.$nl$,

  distance_km = COALESCE(distance_km, 20.0),
  duration_minutes = COALESCE(duration_minutes, 25),
  latitude = COALESCE(latitude, 36.869700),
  longitude = COALESCE(longitude, 30.635000),
  sort_order = 89
WHERE slug = 'konyaalti';

-- ---------------------------------------------
-- 3. PRICING ROWS — PLACEHOLDER VALUES
--
-- The admin panel's pricing screen can only UPDATE rows that already exist;
-- it has no "add pricing for a new region" action. So the rows have to be
-- created here or the regions can never be priced from the panel at all.
--
-- The numbers are copied from the closest existing region so the row starts
-- from a real figure rather than an invented one:
--   konyaalti <- sehirici   (both inside Antalya)
--   manavgat  <- side       (neighbouring, similar distance)
--
-- THEY ARE NOT THE REAL PRICES FOR THESE ROUTES. Set them in /admin/pricing
-- before activating either region.
-- ---------------------------------------------
INSERT INTO pricing (region_id, category_id, one_way_price, round_trip_price, currency, is_active)
SELECT
  target.id,
  src.category_id,
  src.one_way_price,
  src.round_trip_price,
  src.currency,
  true
FROM (VALUES ('konyaalti', 'sehirici'), ('manavgat', 'side')) AS m(target_slug, source_slug)
JOIN regions target ON target.slug = m.target_slug
JOIN regions source ON source.slug = m.source_slug
JOIN pricing src ON src.region_id = source.id
WHERE NOT EXISTS (
  SELECT 1 FROM pricing p
  WHERE p.region_id = target.id AND p.category_id = src.category_id
);

-- ---------------------------------------------
-- 4. Verify, then do the two manual steps below
-- ---------------------------------------------
SELECT
  r.slug,
  r.is_active,
  r.distance_km,
  r.duration_minutes,
  p.one_way_price   AS placeholder_one_way,
  p.round_trip_price AS placeholder_round_trip
FROM regions r
LEFT JOIN pricing p ON p.region_id = r.id
WHERE r.slug IN ('konyaalti', 'manavgat');

-- MANUAL STEP 1 — /admin/pricing: replace the placeholder prices above with
--                 the real ones for Konyaaltı and Manavgat.
-- MANUAL STEP 2 — /admin/regions: switch both from Pasif to Aktif.
--
-- Until step 2 the pages stay off the site, which is the point: nothing goes
-- live carrying a copied price.
--
-- After activating, redeploy once. Page rendering picks up new regions
-- immediately, but sitemap.xml is generated at build time, so the new URLs
-- reach Search Console only after a fresh build.
