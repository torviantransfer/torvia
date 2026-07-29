-- 050: Unpublish duplicate blog posts that migration 030 missed
--
-- CONTEXT: A live coverage query (is_published = true AND content_nl empty)
-- surfaced 4 published posts with no Dutch content. Investigation shows they
-- are all DUPLICATES whose stronger siblings are already published (and already
-- translated to Dutch in migrations 041/049):
--
--   antalya-havalimani-kemer-transfer      → kept: antalya-kemer-transfer-mesafe-sure (041)
--   antalya-havalimani-kemer-vip-transfer  → kept: antalya-kemer-transfer-mesafe-sure (041)
--   antalya-taksi-mi-ozel-transfer-mi      → kept: antalya-havalimani-taksi-mi-vip-transfer-mi (049)
--   uber-antalya-havalimanı-ulasim (ı)     → kept: uber-antalya-havalimani-ulasim (i) (049)
--
-- Migration 030 already intended to unpublish the first three, and
-- next.config.ts (blogConsolidation) already 301-redirects them to their
-- siblings — but the live DB still has them is_published = true, so 030 was
-- evidently not applied (or the rows were re-seeded afterwards). The uber post
-- with the dotless "ı" is the abandoned original of the maintained "i" version.
--
-- WHY unpublish instead of translating: writing Dutch content for these thin
-- duplicates would split ranking signals with the kept siblings (keyword
-- cannibalization) — the exact problem 030 set out to fix. Unpublishing them
-- makes every remaining published post fully Dutch AND removes the duplicates.
--
-- Safe to re-run (idempotent).

UPDATE blog_posts
SET is_published = false, updated_at = NOW()
WHERE slug IN (
  'antalya-havalimani-kemer-transfer',
  'antalya-havalimani-kemer-vip-transfer',
  'antalya-taksi-mi-ozel-transfer-mi',
  'uber-antalya-havalimanı-ulasim'
);

-- Coverage check — should now return 0 rows:
-- SELECT slug FROM blog_posts
--  WHERE is_published = true AND (content_nl IS NULL OR content_nl = '')
--  ORDER BY slug;
