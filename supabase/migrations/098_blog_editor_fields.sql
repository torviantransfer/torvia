-- =============================================================
-- 098 — Blog editor fields
-- =============================================================
-- The blog editor was rebuilt as a two-column writing screen. What a writer
-- decides while writing a post now lives on the post:
--
--   image_alt_*    The cover image's alt text, per language. `image_alt`
--                  (migration 058) is a single column, so a Turkish alt text
--                  was served on the German page. That column stays as the
--                  social-share image's alt (SEO Yönetimi); the page falls
--                  back to the post title instead.
--   author_role_*  The author's title under their name ("Kurucu",
--                  "Founder"). `author_name` (058) already exists and is the
--                  same in every language; the role is not.
--   category       One of the keys in src/lib/blogCategories.ts. Plain text
--                  rather than an enum so a new category is a code change,
--                  not a migration.
--
-- Meta title, meta description, robots and social fields stay where they
-- are, edited in SEO Yönetimi.

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_alt_tr TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_alt_en TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_alt_de TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_alt_pl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_alt_ru TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_alt_nl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_alt_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_alt_ar TEXT;

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_role_tr TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_role_en TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_role_de TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_role_pl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_role_ru TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_role_nl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_role_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_role_ar TEXT;

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS category TEXT;

-- Romanian and Arabic were added to the site after 016/038/053, and a post
-- saved from the editor writes every language's columns. Idempotent: the
-- columns that already exist are left alone.
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS focus_keyword_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS focus_keyword_ar TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS secondary_keywords_ro TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS secondary_keywords_ar TEXT;
