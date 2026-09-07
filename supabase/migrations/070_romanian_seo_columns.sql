-- =============================================================
-- 070: The Romanian SEO columns migrations 062–069 never added
-- =============================================================
--
-- Romanian became the seventh locale in migration 062. That migration and the
-- eight after it added the columns the *content* needs — regions.name_ro,
-- description_ro, meta_title_ro, meta_description_ro, and the blog's title_ro,
-- content_ro, excerpt_ro, slug_ro.
--
-- They did not add a single one of the columns the *SEO panel* needs. The
-- panel's field map (src/components/admin/seo/entries.ts) resolves every
-- logical field to `<field>_{locale}` and its locale list has had seven entries
-- since Romanian shipped, so the Romanian tab has been rendering inputs for
-- twenty-eight columns that do not exist:
--
--   seo_pages    11 columns — every one, including meta_title_ro
--   regions       8 columns
--   blog_posts    9 columns
--
-- Saving any of them sends the column name to PostgREST, which answers
-- PGRST204 ("Could not find the '<column>' column"). /api/admin/crud returns
-- that as a 500, so the editor sees "Kaydedilemedi" and loses the work — and
-- because the payload is one UPDATE, a Romanian field left dirty also blocks
-- every other field in the same save.
--
-- APPLY BEFORE DEPLOYING the matching code change. This migration is purely
-- additive: every column is nullable with no default, the application reads
-- NULL as "keep doing exactly what the page does today", and nothing a crawler
-- sees changes until an admin types into one of them.
--
-- Idempotent (ADD COLUMN IF NOT EXISTS throughout) and non-destructive: it
-- creates columns and writes to none of them.

-- -------------------------------------------------------------
-- 1. seo_pages — the homepage, five landing pages, booking, statics
-- -------------------------------------------------------------
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS meta_title_ro TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS meta_description_ro TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS keywords_ro TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS focus_keyword_ro TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS h1_ro TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS intro_ro TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS canonical_url_ro TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_title_ro TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_description_ro TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_title_ro TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_description_ro TEXT;

-- -------------------------------------------------------------
-- 2. regions
-- -------------------------------------------------------------
-- name_ro, description_ro, meta_title_ro and meta_description_ro already exist
-- (migration 062). These are the eight the SEO panel adds on top.
ALTER TABLE regions ADD COLUMN IF NOT EXISTS keywords_ro TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS focus_keyword_ro TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS h1_ro TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS canonical_url_ro TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_title_ro TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_description_ro TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_title_ro TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_description_ro TEXT;

-- -------------------------------------------------------------
-- 3. blog_posts
-- -------------------------------------------------------------
-- title_ro, content_ro, excerpt_ro and slug_ro already exist (migration 063).
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS focus_keyword_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS secondary_keywords_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_title_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_description_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS twitter_title_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS twitter_description_ro TEXT;

-- -------------------------------------------------------------
-- 4. Postcondition
-- -------------------------------------------------------------
-- "The statement did not error" is not the same as "the schema is now right" —
-- migration 037 ran cleanly and updated zero rows. Assert the end state
-- instead, so a partially-applied migration fails loudly here rather than
-- silently in the admin three weeks from now.
DO $$
DECLARE
  missing TEXT;
BEGIN
  SELECT string_agg(t.table_name || '.' || t.column_name, ', ' ORDER BY t.table_name, t.column_name)
  INTO missing
  FROM (
    VALUES
      ('seo_pages','meta_title_ro'), ('seo_pages','meta_description_ro'),
      ('seo_pages','keywords_ro'), ('seo_pages','focus_keyword_ro'),
      ('seo_pages','h1_ro'), ('seo_pages','intro_ro'),
      ('seo_pages','canonical_url_ro'),
      ('seo_pages','og_title_ro'), ('seo_pages','og_description_ro'),
      ('seo_pages','twitter_title_ro'), ('seo_pages','twitter_description_ro'),

      ('regions','name_ro'), ('regions','description_ro'),
      ('regions','meta_title_ro'), ('regions','meta_description_ro'),
      ('regions','keywords_ro'), ('regions','focus_keyword_ro'),
      ('regions','h1_ro'), ('regions','canonical_url_ro'),
      ('regions','og_title_ro'), ('regions','og_description_ro'),
      ('regions','twitter_title_ro'), ('regions','twitter_description_ro'),

      ('blog_posts','title_ro'), ('blog_posts','content_ro'),
      ('blog_posts','excerpt_ro'), ('blog_posts','slug_ro'),
      ('blog_posts','meta_title_ro'), ('blog_posts','meta_description_ro'),
      ('blog_posts','focus_keyword_ro'), ('blog_posts','secondary_keywords_ro'),
      ('blog_posts','canonical_url_ro'),
      ('blog_posts','og_title_ro'), ('blog_posts','og_description_ro'),
      ('blog_posts','twitter_title_ro'), ('blog_posts','twitter_description_ro')
  ) AS t(table_name, column_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.table_name
      AND c.column_name = t.column_name
  );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Romanian SEO columns still missing after 070: %', missing;
  END IF;

  RAISE NOTICE '070 OK — all 36 Romanian columns present across seo_pages, regions and blog_posts.';
END $$;
