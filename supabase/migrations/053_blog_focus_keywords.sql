-- =============================================
-- Focus keyword / secondary keywords per locale for the blog admin editor.
-- Editorial reference fields only (not rendered on the public page) — they
-- back the on-page SEO checklist (keyword-in-title / keyword-in-description)
-- shown next to the Google preview in the admin editor.
-- =============================================

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS focus_keyword_tr TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS focus_keyword_en TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS focus_keyword_de TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS focus_keyword_pl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS focus_keyword_ru TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS focus_keyword_nl TEXT;

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS secondary_keywords_tr TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS secondary_keywords_en TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS secondary_keywords_de TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS secondary_keywords_pl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS secondary_keywords_ru TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS secondary_keywords_nl TEXT;
