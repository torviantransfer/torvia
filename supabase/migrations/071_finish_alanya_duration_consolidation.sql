-- =============================================================
-- 071: Finish the Alanya travel-time consolidation 037 started
-- =============================================================
--
-- Measured on production 2026-09-07, both of these answer 200, both are in
-- sitemap.xml, and both carry a full hreflang cluster:
--
--   KEEP   antalya-havalimani-alanya-transfer-kac-saat   (GSC pos 9.4, 2798 impr)
--     /tr  antalya-havalimani-alanya-transfer-kac-saat
--     /en  antalya-airport-to-alanya-transfer-time
--     /de  antalya-flughafen-nach-alanya-fahrzeit
--     /pl  transfer-lotnisko-antalya-alanya-ile-trwa
--     /ru  skolko-ehat-ot-aeroporta-antalii-do-alanii
--     /nl  hoe-lang-duurt-transfer-antalya-alanya
--     /ro  antalya-havalimani-alanya-transfer-kac-saat
--
--   DROP   antalya-alanya-transfer-suresi                (GSC pos 39, 185 impr)
--     /tr  antalya-alanya-transfer-suresi        ← already 308s (next.config.ts)
--     /en  antalya-to-alanya-travel-time         ← live, indexable, in sitemap
--     /de  fahrzeit-antalya-nach-alanya          ← live, indexable, in sitemap
--     /pl  antalya-alanya-czas-przejazdu         ← live, indexable, in sitemap
--     /ru  antaliya-alaniya-vremya-v-puti        ← live, indexable, in sitemap
--     /nl  reistijd-antalya-naar-alanya          ← live, indexable, in sitemap
--
-- Same question, same 130 km and 2 hours, two URLs per language in five
-- languages. Migration 037 was written to end this and did not: it matched on
-- `slug` alone, and whatever that matched, the post is published today. A
-- migration that raises no error and updates no rows is indistinguishable from
-- one that worked, which is why this one asserts its own outcome at the bottom.
--
-- The Turkish half was masked all along by a redirect in next.config.ts, so the
-- only visible symptom was five duplicate pages nobody was looking at.
--
-- Matching is by *any* of the post's known slugs rather than by `slug`, so it
-- cannot miss for the reason 037 did. None of these strings belongs to the
-- kept post, so the WHERE clause cannot take down the winner.
--
-- The redirects that carry the equity live in src/lib/redirects.ts
-- (LOCALIZED_BLOG_CONSOLIDATION) and must be deployed with this migration, or
-- the five URLs 404 instead of forwarding.

DO $$
DECLARE
  loser_id UUID;
  loser_slug TEXT;
  winner_published BOOLEAN;
  affected INT;
BEGIN
  -- ---- Preconditions ----------------------------------------------------
  SELECT id, slug INTO loser_id, loser_slug
  FROM blog_posts
  WHERE slug = 'antalya-alanya-transfer-suresi'
     OR slug_tr = 'antalya-alanya-transfer-suresi'
     OR slug_en = 'antalya-to-alanya-travel-time'
     OR slug_de = 'fahrzeit-antalya-nach-alanya'
     OR slug_pl = 'antalya-alanya-czas-przejazdu'
     OR slug_ru = 'antaliya-alaniya-vremya-v-puti'
     OR slug_nl = 'reistijd-antalya-naar-alanya'
  LIMIT 2;

  IF loser_id IS NULL THEN
    RAISE NOTICE '071: duplicate Alanya post not found — nothing to do (already removed?).';
    RETURN;
  END IF;

  SELECT is_published INTO winner_published
  FROM blog_posts
  WHERE slug = 'antalya-havalimani-alanya-transfer-kac-saat';

  IF winner_published IS NULL THEN
    RAISE EXCEPTION
      '071 aborted: the post to keep (antalya-havalimani-alanya-transfer-kac-saat) does not exist. Unpublishing the duplicate would leave no page for this query at all.';
  END IF;

  IF winner_published IS NOT TRUE THEN
    RAISE EXCEPTION
      '071 aborted: the post to keep exists but is not published. Publish it first — migration 037 was supposed to and evidently did not.';
  END IF;

  -- ---- The change -------------------------------------------------------
  UPDATE blog_posts
  SET is_published = false, updated_at = NOW()
  WHERE id = loser_id;

  GET DIAGNOSTICS affected = ROW_COUNT;

  -- ---- Postcondition ----------------------------------------------------
  IF affected <> 1 THEN
    RAISE EXCEPTION '071 failed: expected to unpublish exactly 1 row, updated %.', affected;
  END IF;

  IF EXISTS (SELECT 1 FROM blog_posts WHERE id = loser_id AND is_published) THEN
    RAISE EXCEPTION '071 failed: duplicate post % is still published.', loser_slug;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM blog_posts
    WHERE slug = 'antalya-havalimani-alanya-transfer-kac-saat' AND is_published
  ) THEN
    RAISE EXCEPTION '071 failed: the post to keep is no longer published.';
  END IF;

  RAISE NOTICE
    '071 OK — unpublished duplicate "%" (id %). Kept antalya-havalimani-alanya-transfer-kac-saat. Deploy src/lib/redirects.ts with this.',
    loser_slug, loser_id;
END $$;
