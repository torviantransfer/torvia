-- ---------------------------------------------------------------------------
-- 079: Arabic names for the regions
-- ---------------------------------------------------------------------------
--
-- Migration 078 created regions.name_ar and deliberately left it NULL, where
-- every read falls back to name_en. That fallback is correct but it is not
-- good enough to leave in place: an Arabic speaker searching for a transfer to
-- Belek types بيليك, not "Belek", and a page that renders the destination in
-- Latin script inside Arabic copy reads as broken rather than as untranslated.
--
-- These are transliterations, not translations, because they are place names.
-- The exceptions are the two rows that describe a place rather than name one --
-- `sehirici` and `antalya-city-center`, both "Antalya City Center" -- which are
-- translated as وسط مدينة أنطاليا.
--
-- The list is longer than supabase/seed.sql: the live table has grown by eleven
-- rows since that seed was written, added through the admin panel. That is also
-- why the check at the bottom no longer demands that *every* region carry an
-- Arabic name. A region added tomorrow would make such a check fail forever,
-- over a row this migration never claimed to cover. It asserts what it can
-- actually promise instead -- that every slug named here matched a row, and
-- that nothing it wrote is still Latin script -- and merely reports anything
-- outside its list, which goes on falling back to English exactly as before.
--
-- Idempotent: keyed on slug, and it only writes where the column is still
-- empty, so re-running it cannot overwrite a correction made in the panel.

UPDATE regions SET name_ar = v.name_ar
FROM (VALUES
  -- The 24 in supabase/seed.sql
  ('kundu-lara',               'كوندو - لارا'),
  ('sehirici',                 'وسط مدينة أنطاليا'),
  ('kadriye',                  'كادريه'),
  ('belek',                    'بيليك'),
  ('bogazkent',                'بوغازكنت'),
  ('evrenseki',                'إيفرنسكي'),
  ('side',                     'سيده'),
  ('kizilagac',                'كيزيلاغاتش'),
  ('okurcalar',                'أوكورجالار'),
  ('turkler',                  'تُركلر'),
  ('alanya',                   'ألانيا'),
  ('mahmutlar',                'محمودلار'),
  ('kargicak',                 'كارجيجاك'),
  ('beldibi',                  'بلديبي'),
  ('goynuk',                   'غويْنوك'),
  ('kemer',                    'كيمر'),
  ('kiris',                    'كيريش'),
  ('camyuva',                  'تشامْيوفا'),
  ('tekirova',                 'تكيروفا'),
  ('adrasan',                  'أدراسان'),
  ('kas',                      'كاش'),
  ('kalkan',                   'كالكان'),
  ('fethiye',                  'فتحية'),
  ('marmaris',                 'مرمريس'),

  -- Added to the live table after that seed was written
  ('lara',                     'لارا'),
  ('kundu',                    'كوندو'),
  ('konyaalti',                'كونيالتي'),
  ('antalya-city-center',      'وسط مدينة أنطاليا'),
  ('manavgat',                 'مانافغات'),
  ('gazipasa',                 'غازي باشا'),
  ('demre',                    'دمره'),
  ('finike',                   'فينيكه'),
  ('kumluca',                  'كوملوجا'),
  ('olympos',                  'أوليمبوس'),
  -- A theme park rather than a town: the name is a brand, and this is how Gulf
  -- travel sites write it.
  ('land-of-legends-transfer', 'لاند أوف ليجندز')
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
  unmatched  TEXT;
  latin_left TEXT;
  uncovered  TEXT;
  covered    INT;
BEGIN
  -- A slug here matching no row is a typo in this file, and would leave a
  -- region reading in English while the migration reported success.
  SELECT string_agg(v.slug, ', ') INTO unmatched
  FROM (VALUES
    ('kundu-lara'), ('sehirici'), ('kadriye'), ('belek'), ('bogazkent'),
    ('evrenseki'), ('side'), ('kizilagac'), ('okurcalar'), ('turkler'),
    ('alanya'), ('mahmutlar'), ('kargicak'), ('beldibi'), ('goynuk'),
    ('kemer'), ('kiris'), ('camyuva'), ('tekirova'), ('adrasan'),
    ('kas'), ('kalkan'), ('fethiye'), ('marmaris'),
    ('lara'), ('kundu'), ('konyaalti'), ('antalya-city-center'),
    ('manavgat'), ('gazipasa'), ('demre'), ('finike'), ('kumluca'),
    ('olympos'), ('land-of-legends-transfer')
  ) AS v(slug)
  WHERE NOT EXISTS (SELECT 1 FROM regions r WHERE r.slug = v.slug);

  IF unmatched IS NOT NULL THEN
    RAISE EXCEPTION '079: these slugs match no region — check the spelling: %', unmatched;
  END IF;

  -- Latin characters in name_ar mean something other than this migration wrote
  -- the column, or wrote it wrongly.
  SELECT string_agg(slug || ' = ' || name_ar, ', ') INTO latin_left
  FROM regions WHERE name_ar ~ '[A-Za-z]';

  IF latin_left IS NOT NULL THEN
    RAISE EXCEPTION '079: name_ar is not Arabic script for: %', latin_left;
  END IF;

  SELECT count(*) INTO covered
  FROM regions WHERE name_ar IS NOT NULL AND btrim(name_ar) <> '';

  -- Not an error: anything listed here falls back to name_en, which is what
  -- every region did before this migration existed.
  SELECT string_agg(slug, ', ') INTO uncovered
  FROM regions WHERE name_ar IS NULL OR btrim(name_ar) = '';

  IF uncovered IS NOT NULL THEN
    RAISE NOTICE '079: still falling back to English (add these in the panel): %', uncovered;
  END IF;

  RAISE NOTICE '079 OK — % regions carry an Arabic-script name.', covered;
END $$;
