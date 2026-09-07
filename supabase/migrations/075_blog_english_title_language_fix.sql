-- =============================================================
-- 075: An English post whose English title is in German
-- =============================================================
--
-- /en/blog/flughafen-transfer-antalya serves:
--
--   <title> Flughafen Transfer Antalya: Fixed-Price Rides to Your Hotel
--   <h1>    Flughafen Transfer Antalya: Fixed-Price Rides to Your Hotel
--
-- while the article's own opening heading, written inside content_en, reads:
--
--           Antalya Airport Transfer: Private, Fixed-Price Rides to Your Hotel
--
-- The body is entirely in English — routes, vehicles, what is included, tips,
-- an eight-question FAQ, 1,258 words. Only `title_en` carries the German head
-- term, which is how the page ended up with two contradicting top-level
-- headings (this task's code change demotes body <h1> to <h2>, so the
-- contradiction is now visible as a mismatched title rather than a second H1).
--
-- This is a data typo, not a content decision: the correction is the sentence
-- the author already wrote at the top of their own article. Nothing about the
-- page's topic, intent or URL changes.
--
-- The slug is deliberately left alone. `flughafen-transfer-antalya` is an
-- untidy slug for an English URL, but a slug change costs a redirect on a page
-- whose search performance is unknown here, and Google reads the title and the
-- heading for language, not the path.
--
-- APPLY AFTER 070-074.

DO $$
DECLARE
  n INT;
  new_title CONSTANT TEXT := 'Antalya Airport Transfer: Private, Fixed-Price Rides to Your Hotel';
  old_title CONSTANT TEXT := 'Flughafen Transfer Antalya: Fixed-Price Rides to Your Hotel';
BEGIN
  -- Matched on the slug AND the exact wrong title, so a post whose title has
  -- since been corrected by hand in the admin is left untouched.
  UPDATE blog_posts
  SET title_en = new_title, updated_at = NOW()
  WHERE slug_en = 'flughafen-transfer-antalya'
    AND title_en = old_title;
  GET DIAGNOSTICS n = ROW_COUNT;

  IF n = 0 THEN
    -- The post is also reachable by its base slug if slug_en was never set.
    UPDATE blog_posts
    SET title_en = new_title, updated_at = NOW()
    WHERE slug = 'flughafen-transfer-antalya'
      AND title_en = old_title;
    GET DIAGNOSTICS n = ROW_COUNT;
  END IF;

  IF n = 0 THEN
    RAISE WARNING '075: no post found with the German English-title. Already corrected, or the stored title differs.';
  ELSIF n > 1 THEN
    RAISE EXCEPTION '075 failed: expected at most 1 post, updated %.', n;
  ELSE
    RAISE NOTICE '075: corrected title_en on 1 post.';
  END IF;

  -- Postcondition: the German head term must not remain in any English title.
  IF EXISTS (SELECT 1 FROM blog_posts WHERE title_en = old_title) THEN
    RAISE EXCEPTION '075 failed: an English title still reads "%".', old_title;
  END IF;

  RAISE NOTICE '075 OK.';
END $$;
