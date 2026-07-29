-- 038: Dutch (nl) locale + per-locale blog slugs
--
-- WHY THIS EXISTS
--
-- 1) Dutch locale. Search Console (Apr–Jul 2026) shows the Netherlands at
--    1,749 impressions with an average position of 7.1 but a 0.11% CTR —
--    page-one rankings with almost no clicks, because Dutch searchers landed
--    on English pages. Queries are unambiguously Dutch: "antalya luchthaven
--    transfer", "afstand luchthaven antalya naar side", "hoe lang duurt
--    transfer van antalya naar alanya".
--
-- 2) Per-locale blog slugs. Until now every locale shared one Turkish `slug`,
--    so a Polish reader saw /pl/blog/antalya-havalimani-belek-transfer under a
--    Polish title. Six blog pages ranked at avg. position ~7.5 across ~1,500
--    impressions and took ZERO clicks. The URL is the second-most-read element
--    of a search snippet; an unreadable one suppresses the click.
--
-- Safe to re-run: every statement is IF NOT EXISTS / idempotent.
-- The shared `slug` column is left untouched — it stays the permanent
-- identifier and the fallback, so no existing URL can 404.

-- ---------------------------------------------------------------------------
-- regions: Dutch columns
-- ---------------------------------------------------------------------------
ALTER TABLE regions ADD COLUMN IF NOT EXISTS name_nl TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS description_nl TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_title_nl TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_description_nl TEXT;

-- Place names are identical in Dutch (Belek, Side, Kemer...). Backfill from
-- English so the region page never renders an empty name while the Dutch
-- marketing copy is being filled in by migration 039.
UPDATE regions
SET name_nl = name_en
WHERE name_nl IS NULL OR btrim(name_nl) = '';

-- ---------------------------------------------------------------------------
-- blog_posts: Dutch columns
-- ---------------------------------------------------------------------------
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_nl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_nl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_nl TEXT;

-- ---------------------------------------------------------------------------
-- blog_posts: per-locale slugs
--
-- Deliberately nullable. NULL means "use the shared `slug`", which is exactly
-- what the app does (see localizedBlogSlug in src/lib/seo.ts). That keeps this
-- migration non-destructive: nothing changes until a slug is actually set.
-- ---------------------------------------------------------------------------
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug_tr TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug_en TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug_de TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug_pl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug_ru TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug_nl TEXT;

-- Two posts must never resolve to the same URL in the same language, or the
-- router would 301 into a loop. Partial unique indexes enforce that while
-- still allowing many NULLs (posts that use the shared slug).
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_tr_key ON blog_posts (slug_tr) WHERE slug_tr IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_en_key ON blog_posts (slug_en) WHERE slug_en IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_de_key ON blog_posts (slug_de) WHERE slug_de IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_pl_key ON blog_posts (slug_pl) WHERE slug_pl IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_ru_key ON blog_posts (slug_ru) WHERE slug_ru IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_nl_key ON blog_posts (slug_nl) WHERE slug_nl IS NOT NULL;

-- Sanity check — run on its own to confirm the columns landed:
-- SELECT column_name FROM information_schema.columns
--  WHERE table_name = 'blog_posts' AND column_name LIKE 'slug%'
--  ORDER BY column_name;
