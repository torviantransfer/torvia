-- =============================================================
-- 074: Three seo_pages overrides that are costing the page its claim
-- =============================================================
--
-- Measured against production 2026-09-07/08 by comparing what each page serves
-- against what its source file declares (docs/seo-growth/_ownership.cjs).
-- Thirty-three of the thirty-five landing titles come from code. Exactly two
-- come from a `seo_pages` override — and both overrides are worse than the
-- code fallback they are suppressing. A third override, on `kvkk`, makes two
-- Dutch pages share one title.
--
-- All three fixes are the same shape: set the column back to NULL so the
-- page's own, better-differentiated value takes over. `applyOverrides` treats
-- NULL as "leave the page exactly as it was", so this is the smallest possible
-- change that resolves each one, and it is trivially reversible — retyping the
-- old string in the admin restores it.
--
-- Nothing is deleted but the override itself; the descriptions on these pages
-- are good and are deliberately left alone.
--
-- APPLY AFTER 070-073 and after deploying this task's code.

DO $$
DECLARE
  n INT;
  total INT := 0;
BEGIN
  -- -----------------------------------------------------------------------
  -- 1. /de/vip-transfer-antalya — the override took the generic head term
  -- -----------------------------------------------------------------------
  -- Serving:  "Flughafentransfer Antalya | Privat & VIP zum Festpreis"
  -- Code:     "VIP Transfer Antalya Flughafen | Premium Privatfahrzeug"
  --
  -- "Flughafentransfer Antalya" is the German head term, and four other German
  -- URLs already lead with it: /de (home), /de/antalya-airport-transfer,
  -- /de/blog/flughafentransfer-antalya and /de/blog/antalya-flughafentransfer-ratgeber.
  -- The one page whose job is the VIP/premium intent had given that job up and
  -- joined the queue for a term it cannot win — it carries 619 words and, before
  -- this task's footer change, one inbound link.
  --
  -- The code fallback is the correctly differentiated value. Risk is low: the
  -- German private-transfer queries this page could serve sat at position 36-41
  -- in the last measured window, so there is no ranking here to protect.
  UPDATE seo_pages SET meta_title_de = NULL, updated_at = NOW()
  WHERE page_key = 'vip-transfer-antalya' AND meta_title_de IS NOT NULL;
  GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  RAISE NOTICE '074/1 vip-transfer-antalya.meta_title_de cleared: % row(s)', n;

  -- -----------------------------------------------------------------------
  -- 2. /en/antalya-airport-transfer — the override duplicates the homepage
  -- -----------------------------------------------------------------------
  -- Serving:  "Antalya Airport Transfer | Private & VIP Transfer"
  -- Code:     "Antalya Airport Transfer | Fixed Price, Meet & Greet, Book Online"
  -- Homepage: "Antalya Airport Transfer | Private Transfer to Belek, Side, Alanya, Kemer"
  --
  -- The override says the same thing as the homepage with fewer distinguishing
  -- words. The code fallback names the three things the live English SERP for
  -- this service actually competes on — every ranking result on it leads with
  -- fixed pricing, meet & greet or flight tracking — and it stops this page and
  -- the homepage describing themselves identically.
  UPDATE seo_pages SET meta_title_en = NULL, updated_at = NOW()
  WHERE page_key = 'antalya-airport-transfer' AND meta_title_en IS NOT NULL;
  GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  RAISE NOTICE '074/2 antalya-airport-transfer.meta_title_en cleared: % row(s)', n;

  -- -----------------------------------------------------------------------
  -- 3. /nl/kvkk — two Dutch pages, one title  (finding SEO-019)
  -- -----------------------------------------------------------------------
  -- Serving:  "Privacybeleid"  — identical to /nl/privacy
  -- Page H1:  "Beleid gegevensbescherming"  (from src/messages/nl.json)
  --
  -- The override contradicts the page's own heading and hands its title to a
  -- different page. Clearing it restores "Beleid gegevensbescherming", which is
  -- both the correct Dutch for a data-protection policy and distinct from the
  -- privacy policy next to it. The two pages keep their separate legal intent.
  UPDATE seo_pages SET meta_title_nl = NULL, updated_at = NOW()
  WHERE page_key = 'kvkk' AND meta_title_nl IS NOT NULL;
  GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
  RAISE NOTICE '074/3 kvkk.meta_title_nl cleared: % row(s)', n;

  -- -----------------------------------------------------------------------
  -- Postcondition
  -- -----------------------------------------------------------------------
  -- A zero here is the failure mode migration 037 hit: the statement is valid,
  -- the row simply is not what the WHERE clause expected. Report it rather
  -- than reporting success.
  IF total = 0 THEN
    RAISE WARNING '074: nothing changed. Either this migration has already run, or the overrides were removed from the admin in the meantime.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM seo_pages
    WHERE (page_key = 'vip-transfer-antalya'     AND meta_title_de IS NOT NULL)
       OR (page_key = 'antalya-airport-transfer' AND meta_title_en IS NOT NULL)
       OR (page_key = 'kvkk'                     AND meta_title_nl IS NOT NULL)
  ) THEN
    RAISE EXCEPTION '074 failed: at least one override is still set.';
  END IF;

  RAISE NOTICE '074 OK — % override(s) cleared; pages fall back to their own code values.', total;
END $$;
