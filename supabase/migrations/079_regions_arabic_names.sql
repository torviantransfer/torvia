-- ---------------------------------------------------------------------------
-- 079: Arabic names for all 24 regions
-- ---------------------------------------------------------------------------
--
-- Migration 078 created regions.name_ar and deliberately left it NULL, where
-- every read falls back to name_en. That fallback is correct but it is not
-- good enough to leave in place: an Arabic speaker searching for a transfer to
-- Belek types بيليك, not "Belek", and a page that renders the destination in
-- Latin script inside Arabic copy reads as broken rather than as untranslated.
--
-- These are transliterations, not translations, because they are place names.
-- The one exception is `sehirici` -- "Antalya City Center" describes a place
-- rather than naming one, so it is translated: وسط مدينة أنطاليا.
--
-- Idempotent: keyed on slug, and it only writes where the column is still
-- empty, so re-running it cannot overwrite an admin's correction from the
-- panel. Matches the shape of 064 (the Romanian region copy).

UPDATE regions SET name_ar = v.name_ar
FROM (VALUES
  ('kundu-lara',  'كوندو - لارا'),
  ('sehirici',    'وسط مدينة أنطاليا'),
  ('kadriye',     'كادريه'),
  ('belek',       'بيليك'),
  ('bogazkent',   'بوغازكنت'),
  ('evrenseki',   'إيفرنسكي'),
  ('side',        'سيده'),
  ('kizilagac',   'كيزيلاغاتش'),
  ('okurcalar',   'أوكورجالار'),
  ('turkler',     'تُركلر'),
  ('alanya',      'ألانيا'),
  ('mahmutlar',   'محمودلار'),
  ('kargicak',    'كارجيجاك'),
  ('beldibi',     'بلديبي'),
  ('goynuk',      'غويْنوك'),
  ('kemer',       'كيمر'),
  ('kiris',       'كيريش'),
  ('camyuva',     'تشامْيوفا'),
  ('tekirova',    'تكيروفا'),
  ('adrasan',     'أدراسان'),
  ('kas',         'كاش'),
  ('kalkan',      'كالكان'),
  ('fethiye',     'فتحية'),
  ('marmaris',    'مرمريس')
) AS v(slug, name_ar)
WHERE regions.slug = v.slug
  AND (regions.name_ar IS NULL OR btrim(regions.name_ar) = '');

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
-- name_ar alone does not put a region into the Arabic sitemap or give it an
-- Arabic hreflang alternate: getTranslatedLocales keys off description_ar and
-- meta_title_ar, which are still NULL. So this migration improves how the
-- Arabic page reads without asking Google to index anything new.
DO $$
DECLARE
  untranslated TEXT;
  latin_left   TEXT;
BEGIN
  SELECT string_agg(slug, ', ') INTO untranslated
  FROM regions WHERE name_ar IS NULL OR btrim(name_ar) = '';

  IF untranslated IS NOT NULL THEN
    RAISE EXCEPTION 'Regions still without an Arabic name after 079: %', untranslated;
  END IF;

  -- A name that is still Latin script means a slug in the list above did not
  -- match a row -- the failure mode this migration exists to prevent.
  SELECT string_agg(slug || ' = ' || name_ar, ', ') INTO latin_left
  FROM regions WHERE name_ar ~ '[A-Za-z]';

  IF latin_left IS NOT NULL THEN
    RAISE EXCEPTION 'Regions whose name_ar is not Arabic script: %', latin_left;
  END IF;

  RAISE NOTICE '079 OK — all 24 regions carry an Arabic-script name.';
END $$;
