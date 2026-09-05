-- =============================================
-- Romanian locale
-- =============================================
-- The interface, the confirmation email and the voucher are translated in
-- code. These columns are the other half: the per-region copy that carries
-- the search traffic.
--
-- The site does not wait for them. Every read falls back to English —
-- `region[name_${locale}] || region.name_en` — so Romanian pages serve
-- English copy until someone writes Romanian, rather than serving nothing.
-- The columns exist so the SEO panel has somewhere to put it.
--
-- Seeded from English for the same reason the Dutch migration did: an empty
-- meta title is worse than an English one.

ALTER TABLE regions ADD COLUMN IF NOT EXISTS name_ro TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS description_ro TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_title_ro TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_description_ro TEXT;

UPDATE regions
SET name_ro = name_en
WHERE name_ro IS NULL OR btrim(name_ro) = '';

COMMENT ON COLUMN regions.name_ro IS
  'Romanian region name. Falls back to name_en while empty.';
