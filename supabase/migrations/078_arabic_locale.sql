-- ---------------------------------------------------------------------------
-- 078: Arabic locale
-- ---------------------------------------------------------------------------
--
-- Arabic becomes the eighth language. The interface, the confirmation email
-- and the voucher are translated in code (src/messages/ar.json, the ar block
-- in src/lib/email.ts). These columns are the other half: the per-row copy
-- that carries the search traffic and that the SEO panel writes into.
--
-- Migration 062 added Romanian's *content* columns and forgot every column the
-- SEO panel needs, which migration 070 then had to repair -- eight migrations
-- later, after the Romanian tab had spent that whole time answering PGRST204
-- and silently losing an editor's work. This migration adds both halves at
-- once, for all four tables the panel touches, so the Arabic tab works the day
-- the code ships.
--
-- APPLY BEFORE DEPLOYING the matching code change.
--
-- Purely additive and idempotent: every column is nullable with no default and
-- nothing is written to. The application reads NULL as "fall back to English"
-- (`row[`name_${locale}`] || row.name_en`), so until an admin types into one
-- of these, an Arabic page serves the English copy rather than nothing.
--
-- What keeps that fallback out of Google: a region is only offered as an
-- Arabic hreflang alternate once description_ar or meta_title_ar actually
-- holds Arabic (getTranslatedLocales in src/app/[locale]/[region]/page.tsx),
-- and the five inline-copy landing pages stay noindex for Arabic until "ar"
-- joins inlineCopyLocales in src/i18n/config.ts. So this migration cannot,
-- on its own, submit an English page to Google under an Arabic tag.

-- ---------------------------------------------------------------------------
-- 1. regions
-- ---------------------------------------------------------------------------
ALTER TABLE regions ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_title_ar TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_description_ar TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS keywords_ar TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS focus_keyword_ar TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS h1_ar TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS canonical_url_ar TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_title_ar TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_description_ar TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_title_ar TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_description_ar TEXT;

-- Deliberately NOT seeded from name_en, unlike the Dutch and Romanian
-- migrations. Those languages share the Latin alphabet, so an English
-- placeholder reads as an untranslated name; in an Arabic page it reads as a
-- rendering fault. NULL produces the same English fallback without the column
-- claiming to hold Arabic -- and migration 079 fills all 24 with real Arabic.
COMMENT ON COLUMN regions.name_ar IS
  'Arabic region name. Falls back to name_en while empty.';

-- ---------------------------------------------------------------------------
-- 2. blog_posts
-- ---------------------------------------------------------------------------
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS focus_keyword_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS secondary_keywords_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_title_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_description_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS twitter_title_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS twitter_description_ar TEXT;

-- UNIQUE only where present, matching slug_nl (038) and slug_ro (063): most
-- posts will never have an Arabic slug, and NULL must not collide with NULL.
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_ar_key
  ON blog_posts (slug_ar) WHERE slug_ar IS NOT NULL;

COMMENT ON COLUMN blog_posts.slug_ar IS
  'Arabic URL slug. NULL until the post is translated; reads fall back to English.';

-- ---------------------------------------------------------------------------
-- 3. seo_pages — the homepage, the landing pages, booking, the statics
-- ---------------------------------------------------------------------------
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS meta_title_ar TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS meta_description_ar TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS keywords_ar TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS focus_keyword_ar TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS h1_ar TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS intro_ar TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS canonical_url_ar TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_title_ar TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_description_ar TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_title_ar TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_description_ar TEXT;

-- ---------------------------------------------------------------------------
-- 4. landing_pages
-- ---------------------------------------------------------------------------
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS h1_ar TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS intro_ar TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS content_ar TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS meta_title_ar TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS meta_description_ar TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS keywords_ar TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS focus_keyword_ar TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS canonical_url_ar TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS og_title_ar TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS og_description_ar TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS twitter_title_ar TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS twitter_description_ar TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS slug_ar TEXT;

-- Same rule the other locale slugs carry (077): NULL means "use the base
-- slug", but a blank or whitespace-only override would resolve to a URL of one
-- space, so it is rejected rather than tolerated.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'landing_pages_slug_ar_format'
  ) THEN
    ALTER TABLE landing_pages
      ADD CONSTRAINT landing_pages_slug_ar_format
      CHECK (slug_ar IS NULL OR slug_ar ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS landing_pages_slug_ar_key
  ON landing_pages (slug_ar) WHERE slug_ar IS NOT NULL;

-- The slug stays ASCII on purpose. An Arabic-script slug is legal in a URL but
-- reaches Search Console, analytics and shared links percent-encoded, where it
-- is unreadable and where our own normalizeSlug would not round-trip it. The
-- Arabic page therefore lives at a Latin slug under /ar/, the way the Russian
-- pages already do.
COMMENT ON COLUMN landing_pages.slug_ar IS
  'Arabic URL slug override, ASCII only. NULL means use the base slug.';

-- ---------------------------------------------------------------------------
-- 5. Verification — fail loudly rather than ship a half-added language
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  missing TEXT;
BEGIN
  SELECT string_agg(t.table_name || '.' || t.column_name, ', ')
  INTO missing
  FROM (VALUES
      ('regions','name_ar'), ('regions','description_ar'),
      ('regions','meta_title_ar'), ('regions','meta_description_ar'),
      ('regions','keywords_ar'), ('regions','focus_keyword_ar'),
      ('regions','h1_ar'), ('regions','canonical_url_ar'),
      ('regions','og_title_ar'), ('regions','og_description_ar'),
      ('regions','twitter_title_ar'), ('regions','twitter_description_ar'),

      ('blog_posts','title_ar'), ('blog_posts','content_ar'),
      ('blog_posts','excerpt_ar'), ('blog_posts','slug_ar'),
      ('blog_posts','meta_title_ar'), ('blog_posts','meta_description_ar'),
      ('blog_posts','focus_keyword_ar'), ('blog_posts','secondary_keywords_ar'),
      ('blog_posts','canonical_url_ar'),
      ('blog_posts','og_title_ar'), ('blog_posts','og_description_ar'),
      ('blog_posts','twitter_title_ar'), ('blog_posts','twitter_description_ar'),

      ('seo_pages','meta_title_ar'), ('seo_pages','meta_description_ar'),
      ('seo_pages','keywords_ar'), ('seo_pages','focus_keyword_ar'),
      ('seo_pages','h1_ar'), ('seo_pages','intro_ar'),
      ('seo_pages','canonical_url_ar'),
      ('seo_pages','og_title_ar'), ('seo_pages','og_description_ar'),
      ('seo_pages','twitter_title_ar'), ('seo_pages','twitter_description_ar'),

      ('landing_pages','h1_ar'), ('landing_pages','intro_ar'),
      ('landing_pages','content_ar'), ('landing_pages','meta_title_ar'),
      ('landing_pages','meta_description_ar'), ('landing_pages','keywords_ar'),
      ('landing_pages','focus_keyword_ar'), ('landing_pages','canonical_url_ar'),
      ('landing_pages','og_title_ar'), ('landing_pages','og_description_ar'),
      ('landing_pages','twitter_title_ar'), ('landing_pages','twitter_description_ar'),
      ('landing_pages','slug_ar')
  ) AS t(table_name, column_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.table_name
      AND c.column_name = t.column_name
  );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Arabic columns still missing after 078: %', missing;
  END IF;

  RAISE NOTICE '078 OK — all 49 Arabic columns present across regions, blog_posts, seo_pages and landing_pages.';
END $$;
