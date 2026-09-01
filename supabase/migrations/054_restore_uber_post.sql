-- 054: Bring the Uber post back — migration 050 unpublished the live copy
--
-- WHAT BROKE
-- /en/blog/uber-antalya-havalimani-ulasim is the site's single biggest
-- organic asset: 6,341 impressions at position 7.9 over the last 92 days,
-- 20% of every impression the site received. Together with its five sibling
-- locales it carried 7,019 impressions and 22 clicks — 22% of impressions and
-- 16% of clicks sitewide. Every one of those URLs currently renders "Not
-- Found": the page still answers HTTP 200, so Search Console has no idea the
-- page is dead, and everyone who clicks lands on an empty page.
--
-- WHY
-- The post was seeded in migration 005 with a DOTLESS ı:
--     uber-antalya-havalimanı-ulasim
-- From migration 016 onward every migration that touched it used the DOTTED i:
--     uber-antalya-havalimani-ulasim
-- Those never matched. 026 (meta), 032/035 (CTA), 039 (localized slugs), 042
-- (the zero-click title rewrite) and 049 (Dutch) each updated zero rows on
-- this post, silently — which is also why it has no localized slugs, why its
-- title never got the rewrite 042 gave every other distance/comparison post,
-- and why it has no Dutch content.
--
-- The site still served it correctly, because `normalizeSlug` maps ı → i, so
-- the public URL has always been the dotted form. That is the URL Google
-- indexed and ranked.
--
-- Then 050 unpublished it. Its comment reads:
--     uber-antalya-havalimanı-ulasim (ı) → kept: uber-antalya-havalimani-ulasim (i)
-- assuming the dotted row was the maintained copy and the dotless one an
-- abandoned duplicate. The dotted row never existed. 050 removed the only copy.
--
-- WHAT THIS MIGRATION DOES
-- 1. Republishes the post — restores 7,019 impressions worth of URLs.
-- 2. Renames the slug to the dotted form so future migrations stop missing it.
--    This does NOT change any public URL: `localizedBlogSlug` already returns
--    normalizeSlug(slug), i.e. the dotted form, so every URL Google has
--    indexed stays byte-identical.
--
-- WHAT IT DELIBERATELY DOES NOT DO
-- No localized slugs (039) and no title rewrite (042) are applied here. Both
-- are worth doing, but adding slug_en would start 301-ing the URL that is
-- currently ranked 7.9, and rewriting the title changes the SERP snippet.
-- Neither belongs in the same change as a restore: get the page back to
-- exactly what Google indexed first, confirm recovery, then decide.
--
-- next.config.ts is untouched. Its dotless redirect rule was suspected of
-- causing the 500 that non-ASCII blog URLs return, but that 500 also happens
-- on blog URLs with no redirect rule at all, and the percent-encoded form
-- (which is what every browser and crawler actually sends) returns 200.
--
-- Safe to re-run.

-- ===== 1. Republish =====
UPDATE blog_posts
SET is_published = true,
    updated_at = NOW()
WHERE slug IN (
  'uber-antalya-havalimanı-ulasim',
  'uber-antalya-havalimani-ulasim'
);

-- ===== 2. Normalize the slug to the dotted form =====
-- `slug` is UNIQUE, so only rename when the dotted form is free. If a dotted
-- row somehow exists, the rename is skipped and step 1 has already published
-- both — no data is lost and this migration stays re-runnable.
UPDATE blog_posts
SET slug = 'uber-antalya-havalimani-ulasim',
    updated_at = NOW()
WHERE slug = 'uber-antalya-havalimanı-ulasim'
  AND NOT EXISTS (
    SELECT 1 FROM blog_posts b2
    WHERE b2.slug = 'uber-antalya-havalimani-ulasim'
  );

-- ===== Verification =====
-- Expect exactly one row, is_published = true, slug with the dotted i:
--
--   SELECT slug, is_published, title_en
--     FROM blog_posts
--    WHERE slug LIKE 'uber-antalya-havaliman%';
--
-- Then check the live URLs return real content rather than "Not Found":
--   /en/blog/uber-antalya-havalimani-ulasim
--   /ru/blog/uber-antalya-havalimani-ulasim
--   /tr/blog/uber-antalya-havalimani-ulasim
--   /de/blog/uber-antalya-havalimani-ulasim
--   /pl/blog/uber-antalya-havalimani-ulasim
--
-- Follow-up, only after recovery is confirmed in Search Console:
--   - re-apply 039's localized slugs for this post
--   - re-apply 042's title rewrite ("Uber in Antalya 2026 — availability")
--   - re-apply 049's Dutch translation
