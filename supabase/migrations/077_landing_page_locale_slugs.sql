-- ---------------------------------------------------------------------------
-- 077: per-locale slugs for landing pages
-- ---------------------------------------------------------------------------
--
-- Migration 076 gave every landing page one slug shared by all seven
-- languages, so a German visitor saw /de/antalya-kayak-transfer -- a Turkish
-- URL under a German title. Blog posts stopped doing that a while ago for a
-- measured reason: an unreadable URL next to a translated title suppresses CTR
-- on rankings the site already holds (see localizedBlogSlug in src/lib/seo.ts).
-- There is no reason landing pages, which exist to convert, should be the one
-- surface that still does it.
--
-- Same shape as blog_posts, deliberately:
--
-- * `slug` stays required and unique. It is the permanent identifier -- the
--   row's name in the panel, the fallback for any locale left blank, and the
--   URL old inbound links keep pointing at.
-- * `slug_<locale>` is an override. NULL or blank means "use the base slug",
--   so a page can be published in Turkish and localised later without any
--   locale being broken in between.
--
-- The page 301s any non-canonical slug onto the locale's own, so every URL a
-- page has ever answered on keeps working and passes its ranking forward.

ALTER TABLE landing_pages
  ADD COLUMN IF NOT EXISTS slug_tr TEXT,
  ADD COLUMN IF NOT EXISTS slug_en TEXT,
  ADD COLUMN IF NOT EXISTS slug_de TEXT,
  ADD COLUMN IF NOT EXISTS slug_pl TEXT,
  ADD COLUMN IF NOT EXISTS slug_ru TEXT,
  ADD COLUMN IF NOT EXISTS slug_nl TEXT,
  ADD COLUMN IF NOT EXISTS slug_ro TEXT;

-- The same rule the base slug carries, but NULL-tolerant: an empty override is
-- how a locale says "use the base slug". Blank strings are rejected rather
-- than treated as empty, because a row holding ' ' would resolve to a URL of
-- one space and the API validates the trimmed value.
DO $$
DECLARE
  loc TEXT;
BEGIN
  FOREACH loc IN ARRAY ARRAY['tr','en','de','pl','ru','nl','ro'] LOOP
    EXECUTE format(
      'ALTER TABLE landing_pages DROP CONSTRAINT IF EXISTS landing_pages_slug_%s_format',
      loc
    );
    EXECUTE format(
      'ALTER TABLE landing_pages ADD CONSTRAINT landing_pages_slug_%s_format '
      'CHECK (slug_%s IS NULL OR slug_%s ~ ''^[a-z0-9]+(-[a-z0-9]+)*$'')',
      loc, loc, loc
    );
  END LOOP;
END $$;

-- Uniqueness is enforced per column rather than across all eight at once.
--
-- A cross-column exclusion is what the data really wants -- no two pages may
-- share any slug in any language -- but Postgres cannot express that as a
-- single constraint without a trigger, and a trigger here would be a second
-- copy of a rule the API already applies against regions, reserved routes and
-- the redirect table. So the database guarantees what it can express, and
-- landingSlugProblem() in src/lib/landingSlug.ts remains the one place that
-- knows the whole rule.
CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_pages_slug_tr ON landing_pages(slug_tr) WHERE slug_tr IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_pages_slug_en ON landing_pages(slug_en) WHERE slug_en IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_pages_slug_de ON landing_pages(slug_de) WHERE slug_de IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_pages_slug_pl ON landing_pages(slug_pl) WHERE slug_pl IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_pages_slug_ru ON landing_pages(slug_ru) WHERE slug_ru IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_pages_slug_nl ON landing_pages(slug_nl) WHERE slug_nl IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_pages_slug_ro ON landing_pages(slug_ro) WHERE slug_ro IS NOT NULL;
