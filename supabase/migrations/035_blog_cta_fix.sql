-- =============================================
-- TORVIAN TRANSFER — Blog CTA & Design Fix
-- 2026-06-20
--
-- 1. Add primary_region_slug to blog_posts for dynamic pricing
-- 2. Strip duplicate HTML CTA blocks (added by 032, 033, 034)
--    because the React CTA in page.tsx is the canonical one
-- 3. Strip inline styles from structural HTML elements in new blogs
--    (h1-h6, th, td, tr, p) so Tailwind styles apply consistently
-- 4. Set primary_region_slug for region-specific blogs
-- =============================================

-- ===== STEP 1: Add primary_region_slug column =====
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS primary_region_slug TEXT NULL;

-- ===== STEP 2: Strip HTML CTA blocks from all affected posts =====
-- All CTA blocks start with chr(10)||'<div style="background:#EFF6FF' (blue)
-- or chr(10)||'<div style="background:#FFF7ED' (orange, uber post only)
-- We truncate content at the first occurrence to remove the CTA and everything after.

UPDATE blog_posts SET
  content_en = CASE
    WHEN position(chr(10) || '<div style="background:#EFF6FF' IN content_en) > 0
      THEN left(content_en, position(chr(10) || '<div style="background:#EFF6FF' IN content_en) - 1)
    WHEN position(chr(10) || '<div style="background:#FFF7ED' IN content_en) > 0
      THEN left(content_en, position(chr(10) || '<div style="background:#FFF7ED' IN content_en) - 1)
    ELSE content_en
  END,
  content_tr = CASE
    WHEN position(chr(10) || '<div style="background:#EFF6FF' IN content_tr) > 0
      THEN left(content_tr, position(chr(10) || '<div style="background:#EFF6FF' IN content_tr) - 1)
    WHEN position(chr(10) || '<div style="background:#FFF7ED' IN content_tr) > 0
      THEN left(content_tr, position(chr(10) || '<div style="background:#FFF7ED' IN content_tr) - 1)
    ELSE content_tr
  END,
  content_de = CASE
    WHEN position(chr(10) || '<div style="background:#EFF6FF' IN content_de) > 0
      THEN left(content_de, position(chr(10) || '<div style="background:#EFF6FF' IN content_de) - 1)
    WHEN position(chr(10) || '<div style="background:#FFF7ED' IN content_de) > 0
      THEN left(content_de, position(chr(10) || '<div style="background:#FFF7ED' IN content_de) - 1)
    ELSE content_de
  END,
  content_pl = CASE
    WHEN position(chr(10) || '<div style="background:#EFF6FF' IN content_pl) > 0
      THEN left(content_pl, position(chr(10) || '<div style="background:#EFF6FF' IN content_pl) - 1)
    WHEN position(chr(10) || '<div style="background:#FFF7ED' IN content_pl) > 0
      THEN left(content_pl, position(chr(10) || '<div style="background:#FFF7ED' IN content_pl) - 1)
    ELSE content_pl
  END,
  content_ru = CASE
    WHEN position(chr(10) || '<div style="background:#EFF6FF' IN content_ru) > 0
      THEN left(content_ru, position(chr(10) || '<div style="background:#EFF6FF' IN content_ru) - 1)
    WHEN position(chr(10) || '<div style="background:#FFF7ED' IN content_ru) > 0
      THEN left(content_ru, position(chr(10) || '<div style="background:#FFF7ED' IN content_ru) - 1)
    ELSE content_ru
  END,
  updated_at = NOW()
WHERE slug IN (
  'antalya-havalimani-transfer-rehberi',
  'antalya-alanya-transfer-suresi',
  'uber-antalya-havalimani-ulasim',
  'antalya-havalimani-taksi-mi-vip-transfer-mi',
  'antalya-havalimani-transfer-fiyatlari',
  'vip-transfer-mi-shuttle-mi',
  'antalya-kemer-transfer-mesafe-sure',
  'antalya-havalimani-belek-transfer',
  'antalya-havalimani-side-transfer',
  'antalya-regnum-crown-transfer',
  'hotel-transfer-antalya',
  'alanya-airport-transfer'
);

-- ===== STEP 3: Fix design inconsistency in new blog posts =====
-- Strip inline styles from structural HTML elements so page.tsx Tailwind CSS applies.
-- Targets: h1-h6 (was blue #1D4ED8), th/td/tr (was custom padding/borders/zebra),
--          p (was custom color/font-size).
-- Preserves: div (colored Quick Answer boxes must keep their inline styles).

UPDATE blog_posts SET
  content_en = regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    content_en,
    '<(h[1-6]) style="[^"]*">', '<\1>', 'g'),
    '<(th) style="[^"]*">', '<\1>', 'g'),
    '<(td) style="[^"]*">', '<\1>', 'g'),
    '<(tr) style="[^"]*">', '<\1>', 'g'),
    '<(p) style="[^"]*">', '<\1>', 'g'),
    '<(li) style="[^"]*">', '<\1>', 'g'),

  content_tr = regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    content_tr,
    '<(h[1-6]) style="[^"]*">', '<\1>', 'g'),
    '<(th) style="[^"]*">', '<\1>', 'g'),
    '<(td) style="[^"]*">', '<\1>', 'g'),
    '<(tr) style="[^"]*">', '<\1>', 'g'),
    '<(p) style="[^"]*">', '<\1>', 'g'),
    '<(li) style="[^"]*">', '<\1>', 'g'),

  content_de = regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    content_de,
    '<(h[1-6]) style="[^"]*">', '<\1>', 'g'),
    '<(th) style="[^"]*">', '<\1>', 'g'),
    '<(td) style="[^"]*">', '<\1>', 'g'),
    '<(tr) style="[^"]*">', '<\1>', 'g'),
    '<(p) style="[^"]*">', '<\1>', 'g'),
    '<(li) style="[^"]*">', '<\1>', 'g'),

  content_pl = regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    content_pl,
    '<(h[1-6]) style="[^"]*">', '<\1>', 'g'),
    '<(th) style="[^"]*">', '<\1>', 'g'),
    '<(td) style="[^"]*">', '<\1>', 'g'),
    '<(tr) style="[^"]*">', '<\1>', 'g'),
    '<(p) style="[^"]*">', '<\1>', 'g'),
    '<(li) style="[^"]*">', '<\1>', 'g'),

  content_ru = regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    content_ru,
    '<(h[1-6]) style="[^"]*">', '<\1>', 'g'),
    '<(th) style="[^"]*">', '<\1>', 'g'),
    '<(td) style="[^"]*">', '<\1>', 'g'),
    '<(tr) style="[^"]*">', '<\1>', 'g'),
    '<(p) style="[^"]*">', '<\1>', 'g'),
    '<(li) style="[^"]*">', '<\1>', 'g'),

  updated_at = NOW()
WHERE slug IN ('hotel-transfer-antalya', 'alanya-airport-transfer');

-- ===== STEP 4: Set primary_region_slug for dynamic pricing =====
-- Used by blog page to fetch one_way_price from pricing table.
-- Maps to the region slug in the regions table (not the URL path).

UPDATE blog_posts SET primary_region_slug = 'alanya'
WHERE slug IN ('antalya-alanya-transfer-suresi', 'alanya-airport-transfer');

UPDATE blog_posts SET primary_region_slug = 'kemer'
WHERE slug = 'antalya-kemer-transfer-mesafe-sure';

UPDATE blog_posts SET primary_region_slug = 'belek'
WHERE slug = 'antalya-havalimani-belek-transfer';

UPDATE blog_posts SET primary_region_slug = 'side'
WHERE slug = 'antalya-havalimani-side-transfer';
