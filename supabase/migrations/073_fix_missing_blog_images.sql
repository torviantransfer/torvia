-- =============================================================
-- 073: Four blog posts point at image files that do not exist
-- =============================================================
--
-- Measured against production 2026-09-07: every one of these returns 404.
--
--   /images/blog/gece-transfer.jpg        antalya-24-7-airport-transfer
--   /images/blog/kas-transfer.jpg         antalya-airport-to-kas-transfer
--   /images/blog/transfer-fiyatlari.jpg   antalya-airport-transfer-prices
--   /images/blog/mercedes-vito-vip.jpg    mercedes-vito-vip-transfer-antalya
--
-- `image_url` is used three times per post — the in-page hero (next/image),
-- og:image and twitter:image, and the BlogPosting schema's `image` — so each
-- broken path costs a visibly empty hero, a thumbnail-less share card and an
-- invalid schema field, across all seven locales. Twenty-eight pages.
--
-- Migrations 008, 009 and 014 each fixed a batch of the same problem, which
-- says the real fix is upstream: the blog editor accepts any string in
-- `image_url` and nothing checks that a file answers. That is worth doing and
-- is not this migration; this one stops the bleeding.
--
-- The replacements are existing files, chosen for what they actually show
-- rather than for filename similarity:
--
--   mercedes-vito-vip.png       the Vito product shot. The post is about that
--                               exact vehicle; the path was simply wrong
--                               (/images/blog/*.jpg vs /images/vehicles/*.png).
--   kas-beach-og.jpg            a real Kaş photograph, already cut to 1200x630
--                               JPG as a social sibling of kas-beach.webp.
--   havaalani-vip-transfer.jpg  a Vito at an international arrivals terminal —
--                               which is what a 24/7 arrivals article is about.
--   two-cars.webp               the two vehicle classes side by side, which is
--                               what a price varies by.
--
-- The owner can replace any of them from /admin/blog, which is the point of the
-- upload field; these are correct, not final.
--
-- Only rows still holding the dead path are touched, so re-running this after
-- an admin has chosen a different photo cannot overwrite that choice.

DO $$
DECLARE
  m RECORD;
  n INT;
  total INT := 0;
  still_broken TEXT;
BEGIN
  FOR m IN
    SELECT * FROM (VALUES
      ('/images/blog/mercedes-vito-vip.jpg', '/images/vehicles/mercedes-vito-vip.png'),
      ('/images/blog/kas-transfer.jpg',      '/images/regions/kas-beach-og.jpg'),
      ('/images/blog/gece-transfer.jpg',     '/images/havaalani-vip-transfer.jpg'),
      ('/images/blog/transfer-fiyatlari.jpg', '/images/two-cars.webp')
    ) AS t(dead, replacement)
  LOOP
    UPDATE blog_posts
    SET image_url = m.replacement, updated_at = NOW()
    WHERE image_url = m.dead;

    GET DIAGNOSTICS n = ROW_COUNT;
    total := total + n;

    -- A zero here is the failure mode migration 037 hit: the statement is
    -- valid, the path simply is not what is stored. Say so rather than
    -- reporting success.
    IF n = 0 THEN
      RAISE WARNING '073: no post found with image_url = % — already fixed, or the stored path differs.', m.dead;
    ELSE
      RAISE NOTICE '073: % post(s) moved from % to %.', n, m.dead, m.replacement;
    END IF;
  END LOOP;

  -- Postcondition: none of the four dead paths may remain anywhere.
  SELECT string_agg(DISTINCT image_url, ', ')
  INTO still_broken
  FROM blog_posts
  WHERE image_url IN (
    '/images/blog/mercedes-vito-vip.jpg',
    '/images/blog/kas-transfer.jpg',
    '/images/blog/gece-transfer.jpg',
    '/images/blog/transfer-fiyatlari.jpg'
  );

  IF still_broken IS NOT NULL THEN
    RAISE EXCEPTION '073 failed: posts still reference missing images: %', still_broken;
  END IF;

  RAISE NOTICE '073 OK — % post(s) repointed at files that exist.', total;
END $$;
