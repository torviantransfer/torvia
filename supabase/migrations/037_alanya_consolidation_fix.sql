-- =============================================
-- TORVIAN — Alanya cluster consolidation FIX
-- Source: Google Search Console (Apr–Jul 2026)
-- =============================================
-- Migration 030 unpublished the WRONG post. Data:
--   antalya-havalimani-alanya-transfer-kac-saat  → GSC pos 9.4, 2798 impressions (STRONG, was unpublished)
--   antalya-alanya-transfer-suresi               → GSC pos 39,   185 impressions (WEAK, was kept)
-- Google already ranks "kac-saat" on page 1; keeping the weaker page threw away
-- that ranking. This migration keeps the WINNER Google already trusts and
-- consolidates the weaker duplicate into it.
--
-- DEPLOY NOTE: run this migration AND deploy the matching 301 redirect in
-- next.config.ts (antalya-alanya-transfer-suresi → antalya-havalimani-alanya-transfer-kac-saat)
-- together, so the unpublished "suresi" URL forwards its equity instead of 404ing.
-- =============================================

-- 1. Re-publish the page Google already ranks on page 1
UPDATE blog_posts
SET is_published = true, updated_at = NOW()
WHERE slug = 'antalya-havalimani-alanya-transfer-kac-saat';

-- 2. Unpublish the weaker duplicate (its equity is 301-forwarded via next.config.ts)
UPDATE blog_posts
SET is_published = false, updated_at = NOW()
WHERE slug = 'antalya-alanya-transfer-suresi';
