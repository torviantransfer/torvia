-- =============================================================
-- 072: Make the region price suffix explicit instead of implicit
-- =============================================================
--
-- Until now `src/app/[locale]/[region]/page.tsx` appended the cheapest price to
-- any `meta_title_{locale}` that did not already contain a currency symbol:
--
--     "Antalya Havalimanı Belek Özel Transfer | VIP · 30 Dk. · Sabit Fiyat"
--   → "Antalya Havalimanı Belek Özel Transfer | VIP · 30 Dk. · Sabit Fiyat · $55'den"
--
-- The SEO panel showed the first string, Google received the second, and an
-- editor had no way to see the difference — let alone opt out of it. That
-- breaks the one rule the whole panel rests on: what you type is what ships.
--
-- The code now treats a non-empty column as literal, with one exception: the
-- token `{price}` is replaced with this region's live price label (" · From
-- $80", " · Ab $80", " · $80'den" …), or with nothing when the region has no
-- pricing row.
--
-- This migration writes that token into the rows that are currently receiving
-- the suffix implicitly, so the rendered HTML does not change. A title that
-- reads
--
--     "… | VIP · 30 Dk. · Sabit Fiyat{price}"
--
-- produces exactly the bytes it produces today — and now says so in the panel,
-- where an editor can delete the token and get a literal title.
--
-- APPLY AFTER DEPLOYING the matching code change. Run the other way round and
-- the old code, which knows nothing about the token, renders the four
-- characters "{price}" into every region title. The window between the two is
-- the only cost of getting the order wrong the safe way: titles briefly lose
-- their price suffix and gain it back when this runs.
--
-- The conditions mirror the old code exactly:
--   * the column is non-empty                (empty → the page uses its own template)
--   * it contains no $ or €                  (the old `!/[€$]/.test(dbTitle)` guard)
--   * it does not already contain the token  (idempotent; safe to re-run)
--   * the region has a usable price          (the old `oneWayPrice &&` guard)
--
-- No column is emptied and no title is rewritten — the only edit is an append.

DO $$
DECLARE
  loc TEXT;
  col TEXT;
  n INT;
  total INT := 0;
BEGIN
  FOREACH loc IN ARRAY ARRAY['tr','en','de','pl','ru','nl','ro'] LOOP
    col := format('meta_title_%s', loc);

    -- 070 adds meta_title_ro; if this runs against a database that has not had
    -- it applied, say so rather than failing on a missing column.
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'regions' AND column_name = col
    ) THEN
      RAISE WARNING '072: regions.% does not exist — apply migration 070 first.', col;
      CONTINUE;
    END IF;

    EXECUTE format($f$
      UPDATE regions r
      SET %1$I = %1$I || '{price}',
          updated_at = NOW()
      WHERE %1$I IS NOT NULL
        AND btrim(%1$I) <> ''
        AND position('{price}' in %1$I) = 0
        AND %1$I !~ '[$€]'
        AND EXISTS (
          SELECT 1 FROM pricing p
          WHERE p.region_id = r.id
            AND p.one_way_price IS NOT NULL
            AND p.one_way_price > 0
        )
    $f$, col);

    GET DIAGNOSTICS n = ROW_COUNT;
    total := total + n;
    RAISE NOTICE '072: regions.% — % row(s) tokenised.', col, n;
  END LOOP;

  -- Postcondition: nothing may be left in the state the old code would have
  -- appended to but the new code will not. Anything matching here would lose
  -- its price suffix on the next render, which is a visible SERP change and
  -- has to be a deliberate one.
  IF EXISTS (
    SELECT 1 FROM regions r
    WHERE r.is_active
      AND (
        (r.meta_title_tr IS NOT NULL AND btrim(r.meta_title_tr) <> '' AND r.meta_title_tr !~ '[$€]' AND position('{price}' in r.meta_title_tr) = 0)
        OR (r.meta_title_en IS NOT NULL AND btrim(r.meta_title_en) <> '' AND r.meta_title_en !~ '[$€]' AND position('{price}' in r.meta_title_en) = 0)
        OR (r.meta_title_de IS NOT NULL AND btrim(r.meta_title_de) <> '' AND r.meta_title_de !~ '[$€]' AND position('{price}' in r.meta_title_de) = 0)
        OR (r.meta_title_pl IS NOT NULL AND btrim(r.meta_title_pl) <> '' AND r.meta_title_pl !~ '[$€]' AND position('{price}' in r.meta_title_pl) = 0)
        OR (r.meta_title_ru IS NOT NULL AND btrim(r.meta_title_ru) <> '' AND r.meta_title_ru !~ '[$€]' AND position('{price}' in r.meta_title_ru) = 0)
        OR (r.meta_title_nl IS NOT NULL AND btrim(r.meta_title_nl) <> '' AND r.meta_title_nl !~ '[$€]' AND position('{price}' in r.meta_title_nl) = 0)
      )
      AND EXISTS (
        SELECT 1 FROM pricing p
        WHERE p.region_id = r.id AND p.one_way_price IS NOT NULL AND p.one_way_price > 0
      )
  ) THEN
    RAISE EXCEPTION '072 failed: some priced regions still have an untokenised meta title. They would silently lose their price suffix.';
  END IF;

  RAISE NOTICE '072 OK — % region title(s) now carry an explicit {price} token.', total;
END $$;
