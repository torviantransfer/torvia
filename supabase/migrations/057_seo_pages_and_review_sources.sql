-- =============================================================
-- 057: Admin-managed SEO + reviews that can earn a rich snippet
-- =============================================================
--
-- Three problems this migration exists to solve:
--
-- 1. Meta titles/descriptions for the homepage, the five landing pages and
--    the static pages are hardcoded in each page's generateMetadata(). Fixing
--    a wrong description meant a code change and a deploy, so wrong copy sat
--    in Google's index for weeks. `seo_pages` moves that copy into a row an
--    admin can edit.
--
-- 2. Region photos live in a hardcoded map in src/lib/regionImages.ts, and
--    regions have no keyword field at all. Adding a region therefore needed a
--    code change too.
--
-- 3. Reviews cannot produce the star rating competitors show in the SERP.
--    They have no region, no author name of their own (they join to
--    `customers`, which is empty for reviews collected off-site), and no way
--    to mark the handful that should be shown.
--
-- Every column added here is NULLABLE unless stated. The application reads
-- them as "override if present, otherwise keep the current hardcoded value",
-- so applying this migration on its own changes nothing that Google currently
-- sees. Rankings only move when an admin deliberately fills a field in.

-- -------------------------------------------------------------
-- 1. seo_pages -- one row per non-region, non-blog indexable page
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seo_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Stable identifier the code looks the row up by. Never derived from the
  -- route, so a route can be renamed without orphaning its SEO copy.
  page_key TEXT UNIQUE NOT NULL,

  -- 'home' | 'landing' | 'static'. Drives grouping in the admin list and how
  -- strictly the SEO score judges the page (a legal page is not expected to
  -- carry keywords).
  page_type TEXT NOT NULL DEFAULT 'static',

  -- Locale-independent path after the locale segment: '' for the homepage,
  -- 'about', 'vip-transfer-antalya'. Display and preview only; routing does
  -- not read this, so a typo here cannot 404 a live page.
  route TEXT NOT NULL DEFAULT '',

  -- Human label for the admin list.
  label TEXT NOT NULL,

  meta_title_tr TEXT, meta_title_en TEXT, meta_title_de TEXT,
  meta_title_pl TEXT, meta_title_ru TEXT, meta_title_nl TEXT,

  meta_description_tr TEXT, meta_description_en TEXT, meta_description_de TEXT,
  meta_description_pl TEXT, meta_description_ru TEXT, meta_description_nl TEXT,

  -- Comma-separated. Google ignores the keywords meta tag, so these are not
  -- emitted as a <meta name="keywords">; they are the target terms the SEO
  -- score checks the title and description against.
  keywords_tr TEXT, keywords_en TEXT, keywords_de TEXT,
  keywords_pl TEXT, keywords_ru TEXT, keywords_nl TEXT,

  -- The single term the page is meant to rank for, scored most strictly.
  focus_keyword_tr TEXT, focus_keyword_en TEXT, focus_keyword_de TEXT,
  focus_keyword_pl TEXT, focus_keyword_ru TEXT, focus_keyword_nl TEXT,

  -- Editable on-page copy. Empty means "keep whatever the page renders now".
  h1_tr TEXT, h1_en TEXT, h1_de TEXT, h1_pl TEXT, h1_ru TEXT, h1_nl TEXT,
  intro_tr TEXT, intro_en TEXT, intro_de TEXT,
  intro_pl TEXT, intro_ru TEXT, intro_nl TEXT,

  -- Social and search imagery. og_image_url is what WhatsApp, Facebook and X
  -- render; image_url is the in-page / structured-data picture. They are kept
  -- separate because the social one must be 1200x630 JPG and the on-page one
  -- usually should not be.
  image_url TEXT,
  og_image_url TEXT,
  image_alt TEXT,

  -- Lets an admin take a thin page out of the index without a deploy. NULL
  -- means "leave the page's own robots directive alone" -- the default, so
  -- this column cannot silently deindex anything.
  noindex BOOLEAN,

  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_pages_page_key ON seo_pages(page_key);
CREATE INDEX IF NOT EXISTS idx_seo_pages_type ON seo_pages(page_type, sort_order);

ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;

-- Pages are public content; the site reads them during SSR. Writes go through
-- /api/admin/crud, which uses the service role and checks the admin session,
-- so no write policy is granted here.
DROP POLICY IF EXISTS "seo_pages readable by everyone" ON seo_pages;
CREATE POLICY "seo_pages readable by everyone" ON seo_pages
  FOR SELECT USING (true);

-- Seed one row per page that exists today, all copy fields left NULL so each
-- page keeps rendering exactly what it renders now. The rows exist purely so
-- the admin list is complete on first load.
INSERT INTO seo_pages (page_key, page_type, route, label, sort_order) VALUES
  ('home',                     'home',    '',                         'Ana Sayfa',                   0),
  ('antalya-airport-transfer', 'landing', 'antalya-airport-transfer', 'Antalya Havalimani Transfer', 10),
  ('vip-transfer-antalya',     'landing', 'vip-transfer-antalya',     'VIP Transfer Antalya',        11),
  ('hotel-transfer-antalya',   'landing', 'hotel-transfer-antalya',   'Otel Transfer Antalya',       12),
  ('lara-beach-transfer',      'landing', 'lara-beach-transfer',      'Lara Beach Transfer',         13),
  ('land-of-legends-transfer', 'landing', 'land-of-legends-transfer', 'Land of Legends Transfer',    14),
  ('regions',                  'static',  'regions',                  'Bolgeler',                    20),
  ('blog',                     'static',  'blog',                     'Blog',                        21),
  ('about',                    'static',  'about',                    'Hakkimizda',                  22),
  ('contact',                  'static',  'contact',                  'Iletisim',                    23),
  ('faq',                      'static',  'faq',                      'Sikca Sorulan Sorular',       24),
  ('cancellation',             'static',  'cancellation',             'Iptal Kosullari',             30),
  ('privacy',                  'static',  'privacy',                  'Gizlilik Politikasi',         31),
  ('terms',                    'static',  'terms',                    'Kullanim Sartlari',           32),
  ('cookies',                  'static',  'cookies',                  'Cerez Politikasi',            33),
  ('kvkk',                     'static',  'kvkk',                     'KVKK',                        34)
ON CONFLICT (page_key) DO NOTHING;

-- -------------------------------------------------------------
-- 2. regions -- image + keyword fields the admin can fill
-- -------------------------------------------------------------
-- image_url mirrors the hardcoded map in src/lib/regionImages.ts. The
-- backfill below copies that map in verbatim so a region edited through the
-- admin keeps the exact picture it has today; the code keeps the map as the
-- fallback for any row left NULL.
ALTER TABLE regions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS og_image_url TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS image_alt TEXT;

ALTER TABLE regions ADD COLUMN IF NOT EXISTS keywords_tr TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS keywords_en TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS keywords_de TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS keywords_pl TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS keywords_ru TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS keywords_nl TEXT;

ALTER TABLE regions ADD COLUMN IF NOT EXISTS focus_keyword_tr TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS focus_keyword_en TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS focus_keyword_de TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS focus_keyword_pl TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS focus_keyword_ru TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS focus_keyword_nl TEXT;

ALTER TABLE regions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Verbatim copy of src/lib/regionImages.ts, keyed on the bare slug. Written
-- only where image_url is still NULL so re-running this migration never
-- overwrites a choice an admin made later.
UPDATE regions SET image_url = m.path
FROM (VALUES
  ('belek',      '/images/regions/belek-golf.jpg'),
  ('kemer',      '/images/regions/kemer-coast.webp'),
  ('kundu-lara', '/images/regions/kundu-lara.jpg'),
  ('sehirici',   '/images/regions/sehirici.jpg'),
  ('alanya',     '/images/regions/alanya-castle.jpg'),
  ('side',       '/images/regions/side-ancient.jpg'),
  ('kadriye',    '/images/regions/kadriye.jpg'),
  ('bogazkent',  '/images/regions/bogazkent.jpg'),
  ('evrenseki',  '/images/regions/evrenseki.jpg'),
  ('kizilagac',  '/images/regions/kizilagac.jpg'),
  ('okurcalar',  '/images/regions/okurcalar.jpg'),
  ('turkler',    '/images/regions/turkler.jpg'),
  ('mahmutlar',  '/images/regions/mahmutlar.jpg'),
  ('kargicak',   '/images/regions/kargicak.jpg'),
  ('beldibi',    '/images/regions/beldibi.jpg'),
  ('goynuk',     '/images/regions/goynuk-canyon.jpg'),
  ('tekirova',   '/images/regions/tekirova.jpg'),
  ('camyuva',    '/images/regions/camyuva.jpg'),
  ('kiris',      '/images/regions/kiris.jpg'),
  ('adrasan',    '/images/regions/adrasan.jpg'),
  ('kas',        '/images/regions/kas-beach.webp'),
  ('kalkan',     '/images/regions/kalkan.jpg'),
  ('fethiye',    '/images/regions/fethiye.jpg'),
  ('marmaris',   '/images/regions/marmaris.jpg'),
  ('manavgat',   '/images/regions/manavgat-waterfall.jpg'),
  ('konyaalti',  '/images/regions/antalya-marina.jpg')
) AS m(slug, path)
WHERE regions.image_url IS NULL
  AND regexp_replace(regions.slug, '-transfer$', '') = m.slug;

-- The two regions whose photo is .webp keep a 1200x630 JPG sibling for social
-- crawlers, which render .webp inconsistently.
UPDATE regions SET og_image_url = m.path
FROM (VALUES
  ('kemer', '/images/regions/kemer-coast-og.jpg'),
  ('kas',   '/images/regions/kas-beach-og.jpg')
) AS m(slug, path)
WHERE regions.og_image_url IS NULL
  AND regexp_replace(regions.slug, '-transfer$', '') = m.slug;

-- -------------------------------------------------------------
-- 3. reviews -- enough structure to back an aggregateRating
-- -------------------------------------------------------------
-- Reviews were only ever writable by a customer finishing a booking, joined
-- to `customers` for the display name, and had no region. That made three
-- things impossible: attributing a review to the region page it belongs on,
-- entering a review collected off-site, and choosing which reviews appear.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id) ON DELETE SET NULL;

-- Display name for reviews with no `customers` row behind them. When NULL the
-- app keeps falling back to customers.first_name, so existing reviews render
-- exactly as before.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS author_country TEXT;

-- Which locale the comment is written in, so a Russian review is not shown on
-- the Dutch page. NULL means "show everywhere".
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS locale TEXT;

-- 'site' (left in the booking flow) | 'google' | 'tripadvisor' | 'manual'.
-- Only used by the admin list. The schema.org output deliberately does not
-- name a source: claiming a review came from Google when Google did not
-- publish it is exactly what earns a manual action.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'site';

-- Hand-picked for the homepage carousel.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- The real date the review was written, which for an imported review is not
-- created_at. schema.org datePublished and the admin list both read this.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

UPDATE reviews SET published_at = created_at WHERE published_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_region ON reviews(region_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON reviews(is_featured, is_approved);

-- reservation_id is already nullable in 001, so an admin-entered review with
-- no booking behind it needs no change here. Noted so the next reader does
-- not go looking.
