-- =============================================
-- Romanian blog columns
-- =============================================
-- Migration 062 gave the regions their Romanian copy; this does the same for
-- the blog. Each post carries its title, body, excerpt and slug per language,
-- and the reads already fall back to English when a language is missing —
-- so a Romanian visitor sees an English post rather than a blank one.
--
-- `slug_ro` is what makes a Romanian post reachable at a Romanian URL. It is
-- UNIQUE only where present, matching the Dutch migration (038): most posts
-- will never have one, and NULL must not collide with NULL.

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug_ro TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_ro_key
  ON blog_posts (slug_ro) WHERE slug_ro IS NOT NULL;

COMMENT ON COLUMN blog_posts.slug_ro IS
  'Romanian URL slug. NULL until the post is translated; reads fall back to English.';
