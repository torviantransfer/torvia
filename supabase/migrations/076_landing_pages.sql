-- ---------------------------------------------------------------------------
-- 076: landing_pages -- landing pages an admin can create without a deploy
-- ---------------------------------------------------------------------------
--
-- The five landing pages this site ranks on (antalya-airport-transfer,
-- vip-transfer-antalya, hotel-transfer-antalya, lara-beach-transfer,
-- land-of-legends-transfer) are React components. Adding a sixth means a code
-- change, a review and a deploy, which is why none has been added since they
-- were written -- and why the marketing side has no way to answer a keyword
-- opportunity in the week it appears.
--
-- This table is the content model for landing pages that are rows instead.
-- `seo_pages` cannot serve that purpose: it holds *overrides* for pages that
-- already exist and deliberately carries no body copy, so a row there with no
-- component behind it renders nothing.
--
-- Shape decisions, and why:
--
-- * `slug` is the whole URL after the locale -- /tr/<slug> -- because that is
--   where the existing landing pages live and where the internal links and
--   backlinks point. It is served by src/app/[locale]/[region]/page.tsx, the
--   only dynamic segment at that depth; that route checks regions first, so a
--   region can never lose its URL to a landing page. See landingPages.ts.
--
-- * Every text column is per-locale, all seven of them. The site has shipped
--   two different bugs from a table that knew about six languages while the
--   panel offered seven (migrations 070 and 063), so there is no "primary
--   language plus translations" here: a locale either has its copy or the page
--   is noindex in that locale and absent from the sitemap.
--
-- * The SEO columns are named exactly as `seo_pages` names them, because the
--   admin SEO panel resolves a column from a shared field map (PAGE_FIELDS in
--   src/components/admin/seo/entries.ts). Matching the names is what lets
--   landing pages appear in that panel without a fourth branch anywhere.

CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Path after the locale segment: 'antalya-kayak-transfer'. Lowercase ASCII,
  -- validated in the API before it ever reaches this column; the constraint
  -- below is the second line, for a row written directly to the database.
  slug TEXT UNIQUE NOT NULL,

  -- Human label for the admin list. Locale-independent on purpose: it names
  -- the page for the person editing it, never for a visitor.
  label TEXT NOT NULL,

  -- Draft by default. A page with no copy in it must not be reachable, and
  -- creating one is a single click.
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,

  sort_order INT DEFAULT 0,

  -- Which region's booking flow the page's CTA opens. Optional: a page about
  -- a service rather than a destination has no single region. Mirrors
  -- blog_posts.primary_region_slug.
  cta_region_slug TEXT,

  -- On-page heading and lead paragraph.
  h1_tr TEXT, h1_en TEXT, h1_de TEXT, h1_pl TEXT, h1_ru TEXT, h1_nl TEXT, h1_ro TEXT,
  intro_tr TEXT, intro_en TEXT, intro_de TEXT, intro_pl TEXT, intro_ru TEXT, intro_nl TEXT, intro_ro TEXT,

  -- The body, as HTML. Sanitised at render time with the same allow-list the
  -- blog uses (src/app/[locale]/blog/[slug]/page.tsx) -- never trusted here,
  -- because a service-role write path means the database cannot assume the
  -- admin UI was the thing that wrote the row.
  content_tr TEXT, content_en TEXT, content_de TEXT, content_pl TEXT, content_ru TEXT, content_nl TEXT, content_ro TEXT,

  -- ---- SEO surface: same column names as seo_pages -----------------------
  meta_title_tr TEXT, meta_title_en TEXT, meta_title_de TEXT,
  meta_title_pl TEXT, meta_title_ru TEXT, meta_title_nl TEXT, meta_title_ro TEXT,

  meta_description_tr TEXT, meta_description_en TEXT, meta_description_de TEXT,
  meta_description_pl TEXT, meta_description_ru TEXT, meta_description_nl TEXT, meta_description_ro TEXT,

  canonical_url_tr TEXT, canonical_url_en TEXT, canonical_url_de TEXT,
  canonical_url_pl TEXT, canonical_url_ru TEXT, canonical_url_nl TEXT, canonical_url_ro TEXT,

  og_title_tr TEXT, og_title_en TEXT, og_title_de TEXT,
  og_title_pl TEXT, og_title_ru TEXT, og_title_nl TEXT, og_title_ro TEXT,

  og_description_tr TEXT, og_description_en TEXT, og_description_de TEXT,
  og_description_pl TEXT, og_description_ru TEXT, og_description_nl TEXT, og_description_ro TEXT,

  twitter_title_tr TEXT, twitter_title_en TEXT, twitter_title_de TEXT,
  twitter_title_pl TEXT, twitter_title_ru TEXT, twitter_title_nl TEXT, twitter_title_ro TEXT,

  twitter_description_tr TEXT, twitter_description_en TEXT, twitter_description_de TEXT,
  twitter_description_pl TEXT, twitter_description_ru TEXT, twitter_description_nl TEXT, twitter_description_ro TEXT,

  -- Not emitted as <meta name="keywords"> -- Google ignores that tag. These
  -- are the target terms the SEO score checks the copy against.
  keywords_tr TEXT, keywords_en TEXT, keywords_de TEXT,
  keywords_pl TEXT, keywords_ru TEXT, keywords_nl TEXT, keywords_ro TEXT,

  focus_keyword_tr TEXT, focus_keyword_en TEXT, focus_keyword_de TEXT,
  focus_keyword_pl TEXT, focus_keyword_ru TEXT, focus_keyword_nl TEXT, focus_keyword_ro TEXT,

  -- Social and on-page imagery. Kept separate for the same reason seo_pages
  -- keeps them separate: og_image_url must be 1200x630 and the hero usually
  -- should not be.
  image_url TEXT,
  og_image_url TEXT,
  twitter_image_url TEXT,
  twitter_card TEXT,
  image_alt TEXT,

  -- Tri-state, like every other table here: NULL means "leave the page's own
  -- directive alone", so neither column can silently deindex anything.
  noindex BOOLEAN,
  nofollow BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lowercase ASCII, digits and single hyphens, no leading or trailing hyphen.
-- A slug is a URL; anything else here produces a page that cannot be linked
-- to correctly and a canonical that disagrees with the address bar.
ALTER TABLE landing_pages DROP CONSTRAINT IF EXISTS landing_pages_slug_format;
ALTER TABLE landing_pages ADD CONSTRAINT landing_pages_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_published
  ON landing_pages(is_published, sort_order);

ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- Published pages are public content read during SSR. Writes go through
-- /api/admin/crud, which uses the service role and checks the admin session,
-- so no write policy is granted here -- same posture as seo_pages.
DROP POLICY IF EXISTS "landing_pages readable by everyone" ON landing_pages;
CREATE POLICY "landing_pages readable by everyone" ON landing_pages
  FOR SELECT USING (true);

-- updated_at is what the admin list sorts "recently edited" by and what the
-- SEO panel shows next to a row, so it has to move on its own.
CREATE OR REPLACE FUNCTION set_landing_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_landing_pages_updated_at ON landing_pages;
CREATE TRIGGER trg_landing_pages_updated_at
  BEFORE UPDATE ON landing_pages
  FOR EACH ROW EXECUTE FUNCTION set_landing_pages_updated_at();
