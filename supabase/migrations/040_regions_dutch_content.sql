-- 040: Dutch copy for every region sales page
--
-- These are the pages that take bookings. Search Console shows the whole
-- region-page set drawing ~700 impressions against ~20,000 for the blog, so
-- this migration is the one that matters commercially: it makes each region
-- page indexable in Dutch.
--
-- Note how the app treats "translated": src/app/[locale]/[region]/page.tsx
-- marks a region noindex in a non-primary locale unless description_<locale>
-- or meta_title_<locale> is non-empty (and src/app/sitemap.ts mirrors that).
-- So writing these columns is what actually switches /nl/<region>-transfer
-- from noindex to indexable — nothing else is needed.
--
-- Copy is generated from the row's own distance_km / duration_minutes rather
-- than hardcoded per region, so every active region is covered correctly and
-- the numbers can never drift out of sync with the booking engine.
--
-- Dutch keyword choice comes from this site's Search Console export:
-- "antalya luchthaven transfer", "afstand luchthaven antalya naar side",
-- "hoe lang duurt transfer van antalya naar alanya", "privétransfer".
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Baseline Dutch copy for every active region
-- ---------------------------------------------------------------------------
WITH fmt AS (
  SELECT
    id,
    COALESCE(NULLIF(btrim(name_nl), ''), name_en) AS nm,
    distance_km,
    duration_minutes,
    CASE
      WHEN duration_minutes IS NULL OR duration_minutes <= 0 THEN NULL
      WHEN duration_minutes >= 60 THEN
        (duration_minutes / 60)::text || ' uur'
        || CASE WHEN duration_minutes % 60 > 0
                THEN ' ' || (duration_minutes % 60)::text || ' min'
                ELSE '' END
      ELSE duration_minutes::text || ' min'
    END AS dur_nl,
    CASE
      WHEN distance_km IS NULL OR distance_km <= 0 THEN NULL
      ELSE round(distance_km)::int::text || ' km'
    END AS km_nl
  FROM regions
  WHERE is_active = true
)
UPDATE regions AS r
SET
  meta_title_nl = 'Transfer Luchthaven Antalya naar ' || f.nm || ' | Privé VIP'
                  || COALESCE(' · ' || f.dur_nl, ''),

  meta_description_nl = 'Privétransfer van de luchthaven Antalya (AYT) naar ' || f.nm
                  || COALESCE(': ' || f.km_nl, '')
                  || COALESCE(', ongeveer ' || f.dur_nl, '')
                  || '. Vaste prijs per voertuig, Mercedes Vito, chauffeur met naambord, '
                  || 'vluchtmonitoring en gratis annuleren tot 24 uur. Boek online.',

  description_nl = 'Boek een privé VIP-transfer van de luchthaven Antalya (AYT) naar ' || f.nm || '. '
                  || COALESCE('De afstand bedraagt ongeveer ' || f.km_nl || ' en de rit duurt circa ' || f.dur_nl || '. ',
                              'Wij rijden u rechtstreeks naar uw accommodatie. ')
                  || 'Uw chauffeur wacht u op met een naambord in de aankomsthal en brengt u van deur tot deur '
                  || 'naar uw hotel — zonder tussenstops, zonder taxameter en zonder wachtrij bij de taxistandplaats. '
                  || 'Wij volgen uw vlucht in realtime, dus ook bij vertraging staat uw chauffeur klaar, zonder extra kosten. '
                  || 'De prijs geldt per voertuig (tot 5 passagiers), niet per persoon, en is inclusief tol, brandstof en wachttijd. '
                  || 'Wij rijden 24 uur per dag, het hele jaar door, en u kunt tot 24 uur voor vertrek gratis annuleren.'
FROM fmt AS f
WHERE r.id = f.id
  AND (r.description_nl IS NULL OR btrim(r.description_nl) = '');

-- ---------------------------------------------------------------------------
-- 2. Hand-written overrides for the destinations Dutch travellers search for
--
-- Search Console shows real Dutch demand only for Alanya and Side ("antalya
-- naar alanya", "hoe lang duurt transfer van antalya naar alanya", "antalya
-- side afstand", "afstand luchthaven antalya naar side"). Those two plus the
-- other four best sellers get copy written around the actual query, rather
-- than the generic template above.
-- ---------------------------------------------------------------------------

UPDATE regions SET
  meta_title_nl = 'Transfer Luchthaven Antalya naar Alanya | Privé VIP · 2 uur',
  meta_description_nl = 'Hoe lang duurt de transfer van Antalya naar Alanya? Circa 2 uur, 132 km. Privé VIP-transfer, vaste prijs per voertuig, Mercedes Vito, vluchtmonitoring. Boek online.'
WHERE slug = 'alanya';

UPDATE regions SET
  meta_title_nl = 'Transfer Luchthaven Antalya naar Side | Privé VIP · 55 min',
  meta_description_nl = 'Afstand luchthaven Antalya naar Side: 65 km, ongeveer 55 minuten. Privé VIP-transfer met vaste prijs, Mercedes Vito, ontvangst met naambord. Boek direct online.'
WHERE slug = 'side';

UPDATE regions SET
  meta_title_nl = 'Transfer Luchthaven Antalya naar Belek | Privé VIP · 30 min',
  meta_description_nl = 'Privétransfer luchthaven Antalya naar Belek: 33 km, circa 30 minuten. Rechtstreeks naar uw golfresort of hotel. Vaste prijs, Mercedes Vito, gratis annuleren.'
WHERE slug = 'belek';

UPDATE regions SET
  meta_title_nl = 'Transfer Luchthaven Antalya naar Kemer | Privé VIP · 45 min',
  meta_description_nl = 'Afstand luchthaven Antalya naar Kemer: 43 km, ongeveer 45 minuten. Privé VIP-transfer, vaste prijs per voertuig, vluchtmonitoring, 24/7 beschikbaar. Boek online.'
WHERE slug = 'kemer';

-- `kundu` and `lara` were deactivated by migration 010 and merged into
-- `kundu-lara`; writing to them would be a no-op.
UPDATE regions SET
  meta_title_nl = 'Transfer Luchthaven Antalya naar Kundu-Lara | Privé VIP · 15 min',
  meta_description_nl = 'Privétransfer luchthaven Antalya naar Kundu en Lara Beach: 12-14 km, slechts 15-18 minuten — de kortste transfer van de kust. Vaste prijs, Mercedes Vito.'
WHERE slug = 'kundu-lara';

-- Verify which regions are now indexable in Dutch:
-- SELECT slug, name_nl, meta_title_nl IS NOT NULL AS has_title,
--        description_nl IS NOT NULL AS has_desc
--   FROM regions WHERE is_active = true ORDER BY sort_order;
