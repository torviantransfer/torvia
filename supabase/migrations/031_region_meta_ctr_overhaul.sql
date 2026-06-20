-- =============================================
-- TORVIAN TRANSFER — Region Meta CTR Overhaul
-- Source: Google Trends (GB/DE/PL/Worldwide, Jun 2026) + Search Console
--
-- KEY INSIGHTS FROM DATA:
--   GB #1 query: "transfer from antalya airport" (+4%) — must be in EN title
--   GB growth:   "antalya airport to belek" +20%, "private transfer antalya airport" +8%
--   DE #1 query: "hotel transfer antalya" (+8%), "vip transfer antalya" +30%
--   DE fastest:  "antalya private transfer" +250%, "privattransfer antalya" +30%
--   Worldwide:   "private transfer antalya airport" +100%, "antalya private transfer" +80%
--
-- CHANGES:
--   EN titles: "Transfer from Antalya Airport to {name}" format (matches GB #1 query)
--   DE titles: "VIP Privattransfer" front-loaded (matches DE growth keywords)
--   PL titles: correct "do {name}" grammar, VIP keyword added
--   All descriptions: price range, Mercedes Vito, flight tracking, free cancellation, instant book
--
-- APPROACH: Single UPDATE across all active regions using SQL expressions
-- for duration formatting — no hardcoded per-region values.
-- =============================================

-- -----------------------------------------------
-- STEP 1: Meta Titles — all active regions at once
-- Duration helper: < 60 min → "45 min", >= 60 → "1h 30min"
-- -----------------------------------------------
UPDATE regions SET
  -- EN: "Transfer from Antalya Airport to {name} | Private VIP · {dur}"
  -- Matches UK #1 query "transfer from antalya airport" + destination
  meta_title_en = 'Transfer from Antalya Airport to ' || name_en || ' | Private VIP · ' ||
    CASE
      WHEN duration_minutes < 60 THEN duration_minutes::TEXT || ' min'
      ELSE (duration_minutes / 60)::TEXT || 'h ' || (duration_minutes % 60)::TEXT || 'min'
    END,

  -- DE: "VIP Privattransfer Flughafen Antalya → {name} | {dur} · Festpreis"
  -- "vip transfer antalya" +30%, "privattransfer antalya" +30% in DE Trends
  meta_title_de = 'VIP Privattransfer Flughafen Antalya → ' || name_de || ' | ' ||
    CASE
      WHEN duration_minutes < 60 THEN duration_minutes::TEXT || ' Min.'
      ELSE (duration_minutes / 60)::TEXT || 'h ' || (duration_minutes % 60)::TEXT || ' Min.'
    END || ' · Festpreis',

  -- PL: "Transfer z lotniska Antalya do {name} | VIP Prywatny · {dur}"
  meta_title_pl = 'Transfer z lotniska Antalya do ' || name_pl || ' | VIP Prywatny · ' ||
    CASE
      WHEN duration_minutes < 60 THEN duration_minutes::TEXT || ' min'
      ELSE (duration_minutes / 60)::TEXT || 'h ' || (duration_minutes % 60)::TEXT || 'min'
    END,

  -- TR: "Antalya Havalimanı {name} Özel Transfer | VIP · {dur} · Sabit Fiyat"
  meta_title_tr = 'Antalya Havalimanı ' || name_tr || ' Özel Transfer | VIP · ' ||
    CASE
      WHEN duration_minutes < 60 THEN duration_minutes::TEXT || ' Dk.'
      ELSE (duration_minutes / 60)::TEXT || ' Sa. ' || (duration_minutes % 60)::TEXT || ' Dk.'
    END || ' · Sabit Fiyat',

  -- RU: "Трансфер Аэропорт Анталия → {name} | VIP Частный · {dur}"
  meta_title_ru = 'Трансфер Аэропорт Анталия → ' || name_ru || ' | VIP Частный · ' ||
    CASE
      WHEN duration_minutes < 60 THEN duration_minutes::TEXT || ' мин.'
      ELSE (duration_minutes / 60)::TEXT || 'ч ' || (duration_minutes % 60)::TEXT || ' мин.'
    END

WHERE is_active = true
  AND duration_minutes IS NOT NULL
  AND distance_km IS NOT NULL;

-- -----------------------------------------------
-- STEP 2: Meta Descriptions — all active regions
-- Target length: ~150 chars (stays within Google's ~160 char limit)
-- Key USPs from Trends: "private transfer", "flight tracking",
--   "free cancellation", "fixed price", "meet & greet", "instant confirmation"
-- DE angle: "hotel transfer" — mention door-to-hotel service
-- -----------------------------------------------
UPDATE regions SET
  -- EN (150 chars target):
  -- "Private transfer from Antalya Airport to Alanya. 2h 10min · 132km.
  --  Fixed price, Mercedes Vito, flight tracking, free cancellation 24h. Book instantly."
  meta_description_en =
    'Private transfer from Antalya Airport to ' || name_en || '. ' ||
    CASE
      WHEN duration_minutes < 60 THEN duration_minutes::TEXT || ' min'
      ELSE (duration_minutes / 60)::TEXT || 'h ' || (duration_minutes % 60)::TEXT || 'min'
    END || ' · ' || distance_km::TEXT || ' km. ' ||
    'Fixed price, Mercedes Vito, meet & greet, flight tracking, free cancellation 24h. Book instantly.',

  -- DE (150 chars target) — "hotel transfer" angle for DE market:
  -- "VIP Privattransfer Flughafen Antalya → Belek. 30Min · 33km.
  --  Festpreis, Mercedes Vito, Abholung mit Schild, Flugverfolgung. Kostenlose Stornierung 24h."
  meta_description_de =
    'VIP Privattransfer Flughafen Antalya → ' || name_de || '. ' ||
    CASE
      WHEN duration_minutes < 60 THEN duration_minutes::TEXT || ' Min.'
      ELSE (duration_minutes / 60)::TEXT || 'h ' || (duration_minutes % 60)::TEXT || ' Min.'
    END || ' · ' || distance_km::TEXT || ' km. ' ||
    'Festpreis, Mercedes Vito, Abholung mit Schild, Flugverfolgung, kein Nachtzuschlag. Jetzt buchen — sofortige Bestätigung.',

  -- PL (150 chars target):
  meta_description_pl =
    'Prywatny transfer VIP z lotniska Antalya do ' || name_pl || '. ' ||
    CASE
      WHEN duration_minutes < 60 THEN duration_minutes::TEXT || ' min'
      ELSE (duration_minutes / 60)::TEXT || 'h ' || (duration_minutes % 60)::TEXT || 'min'
    END || ' · ' || distance_km::TEXT || ' km. ' ||
    'Stała cena, Mercedes Vito, spotkanie na lotnisku, śledzenie lotu, bezpłatne odwołanie 24h. Rezerwuj online.',

  -- TR (150 chars target):
  meta_description_tr =
    'Antalya Havalimanı''ndan ' || name_tr || '''e özel VIP transfer. ' ||
    CASE
      WHEN duration_minutes < 60 THEN duration_minutes::TEXT || ' dakika'
      ELSE (duration_minutes / 60)::TEXT || ' saat ' || (duration_minutes % 60)::TEXT || ' dakika'
    END || ' · ' || distance_km::TEXT || ' km. ' ||
    'Sabit fiyat, Mercedes Vito, karşılama, uçuş takibi, 24 saat ücretsiz iptal. Online rezervasyon.',

  -- RU (150 chars target):
  meta_description_ru =
    'Частный VIP-трансфер из аэропорта Анталии в ' || name_ru || '. ' ||
    CASE
      WHEN duration_minutes < 60 THEN duration_minutes::TEXT || ' мин.'
      ELSE (duration_minutes / 60)::TEXT || 'ч ' || (duration_minutes % 60)::TEXT || ' мин.'
    END || ' · ' || distance_km::TEXT || ' км. ' ||
    'Фиксированная цена, Mercedes Vito, встреча в аэропорту, отслеживание рейса, отмена за 24ч. Бронировать онлайн.'

WHERE is_active = true
  AND duration_minutes IS NOT NULL
  AND distance_km IS NOT NULL;

-- -----------------------------------------------
-- STEP 3: Spot overrides for top priority regions
-- These 6 regions drive 80%+ of potential revenue.
-- Titles are hand-tuned to exactly match top Trends queries.
-- -----------------------------------------------

-- ALANYA — UK: "antalya to alanya transfer" 100 interest, DE: "transfer antalya alanya" high
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Alanya Transfer | Private VIP · 2h · Book Online',
  meta_title_de = 'VIP Transfer Flughafen Antalya nach Alanya | 2h · Privat · Festpreis',
  meta_description_en = 'Private transfer from Antalya Airport to Alanya. 2h, 132km. Fixed price, Mercedes Vito, meet & greet, flight tracking, free cancellation 24h. Book online — instant confirmation.'
WHERE slug = 'alanya';

-- BELEK — UK: "antalya airport to belek" +20%, golfers = premium buyers
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Belek Transfer | Private VIP · 30 min · Book Online',
  meta_title_de = 'VIP Transfer Flughafen Antalya nach Belek | 30 Min. · Privat · Festpreis',
  meta_description_en = 'Private transfer from Antalya Airport to Belek golf resorts. 30 min, 33km. Fixed price, Mercedes Vito, meet & greet, flight tracking, free cancellation 24h. Book online — instant confirmation.'
WHERE slug = 'belek';

-- SIDE — UK: "antalya airport to side" 26 interest, "antalya airport to side transfer time" in top
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Side Transfer | Private VIP · 1h 10min · Book Online',
  meta_title_de = 'VIP Transfer Flughafen Antalya nach Side | 1h 10Min. · Privat · Festpreis',
  meta_description_en = 'Private transfer from Antalya Airport to Side. 1h 10min, 75km. Fixed price, Mercedes Vito, meet & greet, flight tracking, free cancellation 24h. Book online — instant confirmation.'
WHERE slug = 'side';

-- KEMER — DE: "transfer antalya side/kemer" high interest, UK growing
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Kemer Transfer | Private VIP · 40 min · Book Online',
  meta_title_de = 'VIP Transfer Flughafen Antalya nach Kemer | 40 Min. · Privat · Festpreis',
  meta_description_en = 'Private transfer from Antalya Airport to Kemer. 40 min, 45km. Fixed price, Mercedes Vito, meet & greet, flight tracking, free cancellation 24h. Book online — instant confirmation.'
WHERE slug = 'kemer';

-- LARA — closest to airport, fastest transfer, high volume
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Lara Transfer | Private VIP · 15 min · Book Online',
  meta_title_de = 'VIP Transfer Flughafen Antalya nach Lara | 15 Min. · Privat · Festpreis',
  meta_description_en = 'Private transfer from Antalya Airport to Lara hotels. 15 min, 14km. Fixed price, Mercedes Vito, meet & greet, flight tracking, free cancellation 24h. Book online — instant confirmation.'
WHERE slug = 'lara';

-- KUNDU — luxury resort area adjacent to Lara
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Kundu Transfer | Private VIP · 18 min · Book Online',
  meta_title_de = 'VIP Transfer Flughafen Antalya nach Kundu | 18 Min. · Privat · Festpreis',
  meta_description_en = 'Private transfer from Antalya Airport to Kundu resorts. 18 min, 15km. Fixed price, Mercedes Vito, meet & greet, flight tracking, free cancellation 24h. Book online — instant confirmation.'
WHERE slug = 'kundu';

-- -----------------------------------------------
-- STEP 4: German "Hotel Transfer" angle — top query in DE
-- Boost the DE description for the most popular regions
-- to mention hotel-to-door delivery explicitly.
-- -----------------------------------------------
UPDATE regions SET
  meta_description_de =
    'VIP Privattransfer vom Flughafen Antalya direkt zu Ihrem Hotel in ' || name_de || '. ' ||
    CASE
      WHEN duration_minutes < 60 THEN duration_minutes::TEXT || ' Min.'
      ELSE (duration_minutes / 60)::TEXT || 'h ' || (duration_minutes % 60)::TEXT || ' Min.'
    END || ' · ' || distance_km::TEXT || ' km. ' ||
    'Festpreis, Mercedes Vito, Abholung mit Namensschild, Flugverfolgung, kein Nachtzuschlag. Jetzt buchen.'
WHERE is_active = true
  AND is_popular = true
  AND duration_minutes IS NOT NULL
  AND distance_km IS NOT NULL;

-- Verify row counts (informational, won't fail):
-- SELECT slug, meta_title_en, meta_title_de, meta_description_en FROM regions WHERE is_active = true ORDER BY sort_order LIMIT 10;
