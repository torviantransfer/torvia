-- 064: Romanian copy for every region sales page
--
-- These are the pages that take bookings. Migration 062 opened the columns;
-- this fills them, and filling them is what actually switches
-- /ro/<region>-transfer from noindex to indexable — nothing else is needed.
-- src/app/[locale]/[region]/page.tsx marks a region noindex in a non-primary
-- locale unless description_<locale> or meta_title_<locale> is non-empty, and
-- src/app/sitemap.ts mirrors that test, so the two move together.
--
-- Copy is generated from each row's own distance_km / duration_minutes rather
-- than written out per region, so every active region is covered and the
-- numbers can never drift away from what the booking engine quotes.
--
-- Romanian grammar the template has to get right:
--   • "oră" for one hour, "ore" for two or more — a hardcoded "ore" reads
--     wrong on the short hops (Kundu, Konyaaltı, city centre).
--   • "de minute" after numbers ending in 00 or in 20-99, plain "minute"
--     otherwise. The template sidesteps this by using the abbreviation "min",
--     which is invariable, exactly as the Dutch migration used "min".
--
-- Safe to re-run: the baseline pass only writes rows whose description_ro is
-- still empty, so hand-written copy is never overwritten by the template.

-- ---------------------------------------------------------------------------
-- 1. Baseline Romanian copy for every active region
-- ---------------------------------------------------------------------------
WITH fmt AS (
  SELECT
    id,
    COALESCE(NULLIF(btrim(name_ro), ''), name_en) AS nm,
    distance_km,
    duration_minutes,
    CASE
      WHEN duration_minutes IS NULL OR duration_minutes <= 0 THEN NULL
      WHEN duration_minutes >= 60 THEN
        (duration_minutes / 60)::text
        || CASE WHEN duration_minutes / 60 = 1 THEN ' oră' ELSE ' ore' END
        || CASE WHEN duration_minutes % 60 > 0
                THEN ' ' || (duration_minutes % 60)::text || ' min'
                ELSE '' END
      ELSE duration_minutes::text || ' min'
    END AS dur_ro,
    CASE
      WHEN distance_km IS NULL OR distance_km <= 0 THEN NULL
      ELSE round(distance_km)::int::text || ' km'
    END AS km_ro
  FROM regions
  WHERE is_active = true
)
UPDATE regions AS r
SET
  meta_title_ro = 'Transfer Aeroport Antalya - ' || f.nm || ' | Privat VIP'
                  || COALESCE(' · ' || f.dur_ro, ''),

  meta_description_ro = 'Transfer privat de la Aeroportul Antalya (AYT) la ' || f.nm
                  || COALESCE(': ' || f.km_ro, '')
                  || COALESCE(', aproximativ ' || f.dur_ro, '')
                  || '. Preț fix per vehicul, Mercedes Vito, șofer cu panou de întâmpinare, '
                  || 'urmărirea zborului și anulare gratuită cu 24 de ore înainte. Rezervă online.',

  description_ro = 'Rezervă un transfer privat VIP de la Aeroportul Antalya (AYT) la ' || f.nm || '. '
                  || COALESCE('Distanța este de aproximativ ' || f.km_ro || ', iar drumul durează în jur de ' || f.dur_ro || '. ',
                              'Te ducem direct la cazarea ta. ')
                  || 'Șoferul te așteaptă în holul de sosiri cu un panou pe care este scris numele tău și te duce '
                  || 'din ușă în ușă până la hotel — fără opriri intermediare, fără aparat de taxare și fără coadă la stația de taxi. '
                  || 'Îți urmărim zborul în timp real, așa că șoferul te așteaptă și dacă avionul întârzie, fără costuri suplimentare. '
                  || 'Prețul este per vehicul (până la 5 pasageri), nu per persoană, și include taxele de drum, combustibilul și timpul de așteptare. '
                  || 'Circulăm 24 de ore din 24, tot anul, iar anularea este gratuită cu până la 24 de ore înainte de plecare.'
FROM fmt AS f
WHERE r.id = f.id
  AND (r.description_ro IS NULL OR btrim(r.description_ro) = '');

-- ---------------------------------------------------------------------------
-- 2. Hand-written copy for the destinations Romanian travellers actually book
--
-- Romanian charter and package traffic to Antalya concentrates on the same
-- coast the other markets do — Alanya, Side, Belek, Kemer, Lara/Kundu — plus
-- Marmaris and Fethiye for the ones flying in and driving west. These get copy
-- written around the phrasing a Romanian would type ("cat dureaza transferul
-- de la aeroportul Antalya la Alanya", "distanta Antalya Side") rather than
-- the template above.
-- ---------------------------------------------------------------------------

UPDATE regions SET
  meta_title_ro = 'Transfer Aeroport Antalya - Alanya | Privat VIP · 2 ore',
  meta_description_ro = 'Cât durează transferul de la Antalya la Alanya? Aproximativ 2 ore, 132 km. Transfer privat VIP, preț fix per vehicul, Mercedes Vito, urmărirea zborului. Rezervă online.'
WHERE slug = 'alanya';

UPDATE regions SET
  meta_title_ro = 'Transfer Aeroport Antalya - Side | Privat VIP · 55 min',
  meta_description_ro = 'Distanța de la aeroportul Antalya la Side: 65 km, aproximativ 55 de minute. Transfer privat VIP cu preț fix, Mercedes Vito, întâmpinare cu panou. Rezervă direct online.'
WHERE slug = 'side';

UPDATE regions SET
  meta_title_ro = 'Transfer Aeroport Antalya - Belek | Privat VIP · 30 min',
  meta_description_ro = 'Transfer privat aeroport Antalya - Belek: 33 km, circa 30 de minute. Direct la resortul tău de golf sau la hotel. Preț fix, Mercedes Vito, anulare gratuită.'
WHERE slug = 'belek';

UPDATE regions SET
  meta_title_ro = 'Transfer Aeroport Antalya - Kemer | Privat VIP · 45 min',
  meta_description_ro = 'Distanța de la aeroportul Antalya la Kemer: 43 km, aproximativ 45 de minute. Transfer privat VIP, preț fix per vehicul, urmărirea zborului, disponibil 24/7. Rezervă online.'
WHERE slug = 'kemer';

-- `kundu` and `lara` were deactivated by migration 010 and merged into
-- `kundu-lara`; writing to them would be a no-op.
UPDATE regions SET
  meta_title_ro = 'Transfer Aeroport Antalya - Kundu-Lara | Privat VIP · 15 min',
  meta_description_ro = 'Transfer privat aeroport Antalya la Kundu și Lara Beach: 12-14 km, doar 15-18 minute — cel mai scurt transfer de pe coastă. Preț fix, Mercedes Vito.'
WHERE slug = 'kundu-lara';

UPDATE regions SET
  meta_title_ro = 'Transfer Aeroport Antalya - Marmaris | Privat VIP',
  meta_description_ro = 'Transfer privat de la aeroportul Antalya la Marmaris, direct la hotelul tău. Preț fix per vehicul, Mercedes Vito, șofer profesionist, urmărirea zborului. Rezervă online.'
WHERE slug = 'marmaris';

UPDATE regions SET
  meta_title_ro = 'Transfer Aeroport Antalya - Fethiye | Privat VIP',
  meta_description_ro = 'Transfer privat aeroport Antalya - Fethiye, fără opriri și fără schimbări de vehicul. Preț fix per vehicul, anulare gratuită cu 24 de ore înainte. Rezervă online.'
WHERE slug = 'fethiye';

UPDATE regions SET
  meta_title_ro = 'Transfer Aeroport Antalya - Kadriye | Privat VIP · 30 min',
  meta_description_ro = 'Transfer privat aeroport Antalya la Kadriye și hotelurile din Belek: circa 30 de minute. Preț fix per vehicul, întâmpinare cu panou, disponibil 24/7.'
WHERE slug = 'kadriye';

UPDATE regions SET
  meta_title_ro = 'Transfer Aeroport Antalya - Centrul Antalyei | Privat VIP',
  meta_description_ro = 'Transfer privat de la aeroportul Antalya în centrul orașului: cel mai scurt drum de pe listă. Preț fix per vehicul, fără aparat de taxare, fără coadă la taxi.'
WHERE slug = 'sehirici';

UPDATE regions SET
  meta_title_ro = 'Transfer Aeroport Antalya - Kaș | Privat VIP',
  meta_description_ro = 'Transfer privat aeroport Antalya la Kaș, pe drumul de coastă. Preț fix per vehicul, Mercedes Vito, urmărirea zborului, șofer care te așteaptă la sosiri.'
WHERE slug = 'kas';

-- Verify which regions are now indexable in Romanian:
-- SELECT slug, name_ro, meta_title_ro IS NOT NULL AS has_title,
--        description_ro IS NOT NULL AS has_desc
--   FROM regions WHERE is_active = true ORDER BY sort_order;
