-- =============================================
-- TORVIAN — Duplicate Blog Post Consolidation
-- Source: Google Search Console (Apr–Jun 2026)
-- Problem: Multiple published posts targeting the same queries
--   → Google splits ranking signals → neither ranks on page 1
--   → ~0.1% CTR across 4,000+ impressions
-- Fix: Unpublish old/thin posts, keep newer + better versions
-- Safe: old posts had 0 clicks anyway (verified in GSC)
-- =============================================

-- -----------------------------------------------
-- 1. ALANYA TRANSFER TIME
--    OLD: antalya-havalimani-alanya-transfer-kac-saat (thin, no table)
--    KEEP: antalya-alanya-transfer-suresi (migration 025, full table, excerpts)
-- -----------------------------------------------
UPDATE blog_posts
SET is_published = false, updated_at = NOW()
WHERE slug = 'antalya-havalimani-alanya-transfer-kac-saat';

-- -----------------------------------------------
-- 2. KEMER TRANSFER
--    OLD (2 posts, thin): antalya-havalimani-kemer-transfer, antalya-havalimani-kemer-vip-transfer
--    KEEP: antalya-kemer-transfer-mesafe-sure (migration 018, full table, excerpts)
-- -----------------------------------------------
UPDATE blog_posts
SET is_published = false, updated_at = NOW()
WHERE slug IN (
  'antalya-havalimani-kemer-transfer',
  'antalya-havalimani-kemer-vip-transfer'
);

-- -----------------------------------------------
-- 3. TAXI vs TRANSFER
--    OLD: antalya-taksi-mi-ozel-transfer-mi (no excerpt, no FAQ schema)
--    KEEP: antalya-havalimani-taksi-mi-vip-transfer-mi (migration 029, FAQ + excerpts)
-- -----------------------------------------------
UPDATE blog_posts
SET is_published = false, updated_at = NOW()
WHERE slug = 'antalya-taksi-mi-ozel-transfer-mi';

-- -----------------------------------------------
-- 4. BELEK TRANSFER — check for duplicates
--    OLD: antalya-havalimani-belek-transfer (from insert-blog-posts.sql, no excerpts)
--    If a newer belek post exists from migration 020, keep that one.
--    For now: add excerpts to the old post so it's not thin.
-- -----------------------------------------------
UPDATE blog_posts SET
  excerpt_en = 'Antalya Airport to Belek: ~33 km, approx. 25-35 min by private VIP transfer. Fixed price, meet & greet, free flight tracking. Direct to your golf resort or hotel.',
  excerpt_tr = 'Antalya Havalimanı''ndan Belek''e ~33 km, yaklaşık 25-35 dakika. Sabit fiyat, uçuş takibi, kapıdan kapıya VIP transfer. Doğrudan golf tesisi veya otelinize.',
  excerpt_de = 'Flughafen Antalya nach Belek: ~33 km, ca. 25-35 Min. VIP-Privattransfer. Festpreis, Meet & Greet, kostenlose Flugverfolgung. Direkt zu Ihrem Golf-Resort.',
  excerpt_pl = 'Lotnisko Antalya do Belek: ~33 km, ok. 25-35 min transferem VIP. Stała cena, śledzenie lotu, bezpośrednio do hotelu lub pola golfowego.',
  excerpt_ru = 'Аэропорт Анталии — Белек: ~33 км, ок. 25-35 мин. VIP-трансфером. Фиксированная цена, отслеживание рейса, прямо до гольф-курорта или отеля.',
  updated_at = NOW()
WHERE slug = 'antalya-havalimani-belek-transfer'
  AND (excerpt_en IS NULL OR excerpt_en = '');

-- -----------------------------------------------
-- 5. SIDE TRANSFER — add excerpts if missing
-- -----------------------------------------------
UPDATE blog_posts SET
  excerpt_en = 'Antalya Airport to Side: ~65 km, approx. 50-60 min by private VIP transfer. Fixed price, flight tracking, door-to-door. Covers Side centre, Kumköy, Evrenseki, Kadriye.',
  excerpt_tr = 'Antalya Havalimanı''ndan Side''ye ~65 km, yaklaşık 50-60 dakika. Sabit fiyat, uçuş takibi. Side merkez, Kumköy, Evrenseki, Kadriye bölgelerine hizmet.',
  excerpt_de = 'Flughafen Antalya nach Side: ~65 km, ca. 50-60 Min. VIP-Transfer. Festpreis, Flugverfolgung. Bedient Side Zentrum, Kumköy, Evrenseki, Kadriye.',
  excerpt_pl = 'Lotnisko Antalya do Side: ~65 km, ok. 50-60 min. Stała cena, śledzenie lotu. Obsługuje centrum Side, Kumköy, Evrenseki, Kadriye.',
  excerpt_ru = 'Аэропорт Анталии — Сиде: ~65 км, ок. 50-60 мин. Фиксированная цена, отслеживание рейса. Центр Сиде, Кумкёй, Эврензеки, Кадрие.',
  updated_at = NOW()
WHERE slug = 'antalya-havalimani-side-transfer'
  AND (excerpt_en IS NULL OR excerpt_en = '');

-- -----------------------------------------------
-- 6. TRANSFER PRICES post — add missing excerpts
--    (blog-posts-seed.sql had no excerpt columns)
-- -----------------------------------------------
UPDATE blog_posts SET
  excerpt_en = 'Antalya Airport VIP transfer prices 2026: Belek from €35, Side from €45, Alanya from €65. Fixed price per vehicle, no night surcharge, free flight tracking. Book online.',
  excerpt_tr = 'Antalya Havalimanı transfer fiyatları 2026: Belek''ten €35, Side''den €45, Alanya''dan €65. Araç başına sabit fiyat, gece tarifesi yok, ücretsiz uçuş takibi.',
  excerpt_de = 'Antalya Flughafen Transfer Preise 2026: Belek ab €35, Side ab €45, Alanya ab €65. Festpreis pro Fahrzeug, kein Nachtzuschlag, kostenlose Flugverfolgung.',
  excerpt_pl = 'Ceny transferu z lotniska Antalya 2026: Belek od €35, Side od €45, Alanya od €65. Stała cena za pojazd, bez dopłaty nocnej, bezpłatne śledzenie lotu.',
  excerpt_ru = 'Цены на трансфер из аэропорта Анталии 2026: Белек от €35, Сиде от €45, Аланья от €65. Фиксированная цена за авто, без ночной надбавки, отслеживание рейса.',
  updated_at = NOW()
WHERE slug = 'antalya-havalimani-transfer-fiyatlari'
  AND (excerpt_en IS NULL OR excerpt_en = '');

-- -----------------------------------------------
-- 7. GENERAL TRANSFER GUIDE — add excerpts if missing
-- -----------------------------------------------
UPDATE blog_posts SET
  excerpt_en = 'Complete guide to Antalya Airport transfers 2026: private VIP transfer, taxi, Havaş shuttle, car rental — honest comparison with prices, times and tips.',
  excerpt_tr = 'Antalya Havalimanı transfer rehberi 2026: VIP özel transfer, taksi, Havaş otobüsü, araç kiralama — fiyat ve süre karşılaştırması.',
  excerpt_de = 'Vollständiger Ratgeber für Antalya Flughafen Transfers 2026: VIP-Transfer, Taxi, Havaş-Bus, Mietwagen — ehrlicher Vergleich mit Preisen und Fahrtzeiten.',
  excerpt_pl = 'Kompletny przewodnik po transferach z lotniska Antalya 2026: VIP transfer, taksówka, autobus Havaş, wynajem auta — porównanie cen i czasów.',
  excerpt_ru = 'Полный гид по трансферам из аэропорта Анталии 2026: VIP-трансфер, такси, Havaş, аренда авто — честное сравнение цен и времени.',
  updated_at = NOW()
WHERE slug = 'antalya-havalimani-transfer-rehberi'
  AND (excerpt_en IS NULL OR excerpt_en = '');

-- -----------------------------------------------
-- 8. VIP vs SHUTTLE post — add excerpts if missing
-- -----------------------------------------------
UPDATE blog_posts SET
  excerpt_en = 'VIP private transfer vs airport shuttle in Antalya: why a shared shuttle costs more in total time and comfort. Fixed price door-to-door vs shared bus with hotel drops.',
  excerpt_tr = 'Antalya''da VIP özel transfer mi, servis otobüsü mü? Toplam süre ve konfor açısından neden özel transfer daha mantıklı. Kapıdan kapıya vs paylaşımlı servis.',
  excerpt_de = 'VIP-Privattransfer vs. Shuttle-Bus in Antalya: Warum ein geteilter Shuttle insgesamt mehr Zeit kostet. Tür-zu-Tür Festpreis vs. geteilter Bus mit Hotelstopps.',
  excerpt_pl = 'VIP transfer prywatny vs autobus lotniskowy w Antalyi: dlaczego dzielony shuttle kosztuje więcej łącznego czasu. Stała cena door-to-door vs wspólny bus.',
  excerpt_ru = 'VIP-трансфер vs шаттл в Анталии: почему общий шаттл обходится дороже по суммарному времени. Фиксированная цена от двери до двери vs общий автобус.',
  updated_at = NOW()
WHERE slug = 'vip-transfer-mi-shuttle-mi'
  AND (excerpt_en IS NULL OR excerpt_en = '');
