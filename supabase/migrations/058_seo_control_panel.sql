-- =============================================================
-- 058: Full SEO control surface -- canonical, robots, OG/Twitter
-- =============================================================
--
-- 057 gave the admin meta copy. This adds the rest of what a page actually
-- declares to a crawler, so every field visible in the panel is a field the
-- panel can also change:
--
--   * canonical      -- computed in src/lib/seo.ts today, never stored
--   * follow/nofollow -- only noindex existed, and only on seo_pages
--   * OG and Twitter  -- always mirrored the meta title/description
--
-- The same three columns land on `regions` and `blog_posts` so the panel does
-- not have to special-case where a page's row lives.
--
-- The override contract from 057 is unchanged and is the reason this is safe
-- to apply against a ranking site: every column is NULL, and the application
-- reads NULL as "keep doing exactly what the code does today". Applying this
-- migration changes nothing a crawler sees.

-- -------------------------------------------------------------
-- 1. seo_pages
-- -------------------------------------------------------------
-- Absolute URL. NULL means "keep whatever seoAlternates() computes", which is
-- the correct answer for every page today -- this exists for the rare case of
-- a duplicate that has to be pointed somewhere by hand.
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS canonical_url_tr TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS canonical_url_en TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS canonical_url_de TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS canonical_url_pl TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS canonical_url_ru TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS canonical_url_nl TEXT;

-- Tri-state like `noindex`: NULL leaves the page's own directive alone.
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS nofollow BOOLEAN;

ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_title_tr TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_title_en TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_title_de TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_title_pl TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_title_ru TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_title_nl TEXT;

ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_description_tr TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_description_en TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_description_de TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_description_pl TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_description_ru TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS og_description_nl TEXT;

ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_title_tr TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_title_en TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_title_de TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_title_pl TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_title_ru TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_title_nl TEXT;

ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_description_tr TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_description_en TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_description_de TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_description_pl TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_description_ru TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_description_nl TEXT;

-- One image and one card type for all locales: a per-language social image
-- is a real need on almost no site, and six more columns to leave blank is a
-- cost paid on every screen.
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_image_url TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_card TEXT;

-- /booking is a public, indexable page that 057 missed entirely, so it could
-- not be seen or managed at all. Seeded with every copy field NULL, like the
-- rest.
INSERT INTO seo_pages (page_key, page_type, route, label, sort_order) VALUES
  ('booking', 'landing', 'booking', 'Rezervasyon', 15)
ON CONFLICT (page_key) DO NOTHING;

-- -------------------------------------------------------------
-- 2. regions
-- -------------------------------------------------------------
ALTER TABLE regions ADD COLUMN IF NOT EXISTS canonical_url_tr TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS canonical_url_en TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS canonical_url_de TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS canonical_url_pl TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS canonical_url_ru TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS canonical_url_nl TEXT;

ALTER TABLE regions ADD COLUMN IF NOT EXISTS noindex BOOLEAN;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS nofollow BOOLEAN;

ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_title_tr TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_title_en TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_title_de TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_title_pl TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_title_ru TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_title_nl TEXT;

ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_description_tr TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_description_en TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_description_de TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_description_pl TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_description_ru TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_description_nl TEXT;

ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_title_tr TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_title_en TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_title_de TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_title_pl TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_title_ru TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_title_nl TEXT;

ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_description_tr TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_description_en TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_description_de TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_description_pl TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_description_ru TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_description_nl TEXT;

ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_image_url TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS twitter_card TEXT;

ALTER TABLE regions ADD COLUMN IF NOT EXISTS h1_tr TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS h1_en TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS h1_de TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS h1_pl TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS h1_ru TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS h1_nl TEXT;

-- -------------------------------------------------------------
-- 3. blog_posts
-- -------------------------------------------------------------
-- Posts have `title_*` and `excerpt_*`, which serve double duty as the page's
-- H1 and its meta description. Those are different jobs -- an H1 reads to a
-- human on the page, a title tag competes for a click in a result list -- and
-- forcing one string to do both is why several posts have titles that are
-- either too long for the SERP or too terse on the page. These columns let
-- them diverge; NULL keeps today's behaviour, where title_* and excerpt_* are
-- used for both.
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title_tr TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title_en TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title_de TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title_pl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title_ru TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title_nl TEXT;

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description_tr TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description_en TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description_de TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description_pl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description_ru TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description_nl TEXT;

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url_tr TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url_en TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url_de TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url_pl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url_ru TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url_nl TEXT;

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS noindex BOOLEAN;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS nofollow BOOLEAN;

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_title_tr TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_title_en TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_title_de TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_title_pl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_title_ru TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_title_nl TEXT;

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_description_tr TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_description_en TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_description_de TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_description_pl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_description_ru TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_description_nl TEXT;

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_image_url TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS twitter_image_url TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS twitter_card TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_alt TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- -------------------------------------------------------------
-- 4. seo_audit_log
-- -------------------------------------------------------------
-- An SEO change can cost a ranking weeks later, long after anyone remembers
-- making it. Without a record of what a field held before, "traffic dropped
-- in March" has no answer. Every admin write records the old and new value.
CREATE TABLE IF NOT EXISTS seo_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Which row changed. `table_name` is one of the CRUD allowlist entries.
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  -- Human label at the time of the change, so a later rename does not make
  -- the log unreadable.
  record_label TEXT,

  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,

  changed_by TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_audit_record ON seo_audit_log(table_name, record_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_audit_time ON seo_audit_log(changed_at DESC);

ALTER TABLE seo_audit_log ENABLE ROW LEVEL SECURITY;
-- No policy is granted: the log is written and read with the service role
-- from admin routes only. Nothing public should be able to read who changed
-- what, and nothing at all should be able to rewrite history.
