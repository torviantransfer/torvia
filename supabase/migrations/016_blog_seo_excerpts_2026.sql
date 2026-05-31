-- =============================================
-- TORVIAN — Blog SEO Optimization 2026
-- Based on Google Search Console + Trends data (Apr–May 2026)
-- Changes: add excerpt columns, optimize top-3 posts (title + excerpt)
-- Top opportunities: uber-antalya (1549 imp), alanya-kac-saat (1122 imp),
--   havas-transfer (1132 imp across locales)
-- =============================================

-- STEP 1: Add excerpt columns (meta descriptions)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_tr TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_en TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_de TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_pl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_ru TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- =============================================
-- POST 1: uber-antalya-havalimani-ulasim
-- Impressions: 1,549 | Clicks: 6 | CTR: 0.4%
-- Rising queries: "uber antalya airport", "does uber work in antalya",
--   "antalya airport shuttle" (+20%), German "ankunft antalya airport" (Breakout)
-- =============================================
UPDATE blog_posts SET
  title_en = 'Is Uber Available at Antalya Airport? 2026 Guide + Best Alternatives',
  title_tr = 'Antalya Havalimanında Uber Var Mı? 2026 Rehberi + Tüm Alternatifler',
  title_de = 'Gibt es Uber am Flughafen Antalya? Ankunft & Alternativen 2026',
  title_pl = 'Czy Uber Działa na Lotnisku Antalya? Przewodnik 2026 + Alternatywy',
  title_ru = 'Есть ли Uber в Аэропорту Анталии? Гид 2026 + Лучшие Альтернативы',

  excerpt_en = 'Uber is banned in Turkey since 2019. Best alternatives from Antalya Airport 2026: BiTaksi, Havaş shuttle, taxi, or private VIP transfer. Book online, fixed price.',
  excerpt_tr = 'Uber Türkiye''de 2019''dan beri yasaklı. Antalya Havalimanı''ndan otelinize: BiTaksi, Havaş, taksi veya VIP özel transfer. Online rezervasyon, sabit fiyat.',
  excerpt_de = 'Uber ist seit 2019 in der Türkei verboten. Alle Optionen nach Ihrer Ankunft am Flughafen Antalya: BiTaksi, Havaş, Taxi, VIP-Transfer. Jetzt online buchen.',
  excerpt_pl = 'Uber jest zakazany w Turcji od 2019 r. Alternatywy z lotniska Antalya: BiTaksi, autobus Havaş, taksówka, prywatny transfer VIP. Rezerwacja online, stała cena.',
  excerpt_ru = 'Uber запрещён в Турции с 2019 года. Все варианты из аэропорта Анталии: BiTaksi, Havaş, такси, VIP-трансфер. Онлайн бронирование, фиксированная цена.',

  updated_at = NOW()
WHERE slug = 'uber-antalya-havalimani-ulasim';

-- =============================================
-- POST 2: antalya-havalimani-alanya-transfer-kac-saat
-- Impressions: 1,122 | Clicks: 2 | CTR: 0.18%
-- Top queries: "antalya airport to alanya transfer time how long" (69 imp)
--   "alanya airport" +20% (people don't know there's no Alanya airport)
--   "distance antalya airport to alanya"
-- =============================================
UPDATE blog_posts SET
  title_en = 'Antalya Airport to Alanya: How Long? Transfer Time & Distance 2026',
  title_tr = 'Antalya Havalimanından Alanya''ya Transfer Kaç Saat? Mesafe 2026',
  title_de = 'Flughafen Antalya nach Alanya: Wie Lange? Transferzeit 2026',
  title_pl = 'Lotnisko Antalya do Alanyi: Ile Czasu? Transfer i Odległość 2026',
  title_ru = 'Аэропорт Анталии — Аланья: Сколько Ехать? Время и Расстояние 2026',

  excerpt_en = 'Antalya to Alanya: 130 km, approx. 1.5–2 hours by private VIP transfer. No airport in Alanya — AYT is the nearest. Fixed price, flight tracking, door-to-door.',
  excerpt_tr = 'Antalya''dan Alanya''ya 130 km, VIP özel transfer ile yaklaşık 1,5–2 saat. Alanya''da havalimanı yok — en yakını Antalya Havalimanı. Sabit fiyat, uçuş takibi.',
  excerpt_de = 'Antalya nach Alanya: 130 km, ca. 1,5–2 Std. Privattransfer. Kein Flughafen Alanya — AYT ist der nächste. Festpreis, Flugverfolgung, Tür-zu-Tür.',
  excerpt_pl = 'Antalya do Alanyi: 130 km, ok. 1,5–2 godz. prywatnym transferem. Brak lotniska w Alanyi — AYT jest najbliższe. Stała cena, śledzenie lotu, od drzwi do drzwi.',
  excerpt_ru = 'Анталия — Аланья: 130 км, ок. 1,5–2 ч. на частном трансфере. Аэропорта в Аланье нет — ближайший AYT. Фиксированная цена, отслеживание рейса.',

  updated_at = NOW()
WHERE slug = 'antalya-havalimani-alanya-transfer-kac-saat';

-- =============================================
-- POST 3: antalya-havas-mi-vip-transfer-mi
-- Impressions: ~1,132 across all locales | CTR: 0.1–0.3%
-- Rising: "antalya airport shuttle" +20% (capture shuttle searchers)
--   "havas antalya", "havas bus antalya airport"
-- Key insight: Havaş goes to otogar ONLY — not to hotels
-- =============================================
UPDATE blog_posts SET
  title_en = 'Havaş Shuttle vs VIP Transfer Antalya Airport: Which is Better? 2026',
  title_tr = 'Antalya Havaş Otobüsü mu VIP Transfer mi? Fiyat ve Konfor 2026',
  title_de = 'Havaş Shuttle vs. VIP-Transfer Flughafen Antalya: Was Lohnt Sich? 2026',
  title_pl = 'Autobus Havaş czy Transfer VIP Lotnisko Antalya: Co Wybrać? 2026',
  title_ru = 'Автобус Havaş или VIP-Трансфер в Аэропорту Анталии: Что Лучше? 2026',

  excerpt_en = 'Havaş shuttle goes to Antalya bus station only — not your hotel or resort. Private VIP transfer: door-to-door, fixed price, direct to your destination. Compare & book.',
  excerpt_tr = 'Havaş otobüsü sadece Antalya otogara gider — otelinize değil. VIP özel transfer: kapıdan kapıya, sabit fiyat, direkt otelinize. Fiyatları karşılaştırın.',
  excerpt_de = 'Der Havaş Shuttle fährt nur zum Busbahnhof Antalya — nicht zu Ihrem Hotel. VIP-Transfer: Tür-zu-Tür, Festpreis, direkt in Ihr Resort. Vergleichen & buchen.',
  excerpt_pl = 'Autobus Havaş jedzie tylko na dworzec w Antalyi — nie do hotelu. Transfer VIP: od drzwi do drzwi, stała cena, bezpośrednio do ośrodka. Porównaj i rezerwuj.',
  excerpt_ru = 'Автобус Havaş едет только до автовокзала Анталии — не до вашего отеля. VIP-трансфер: от двери до двери, фиксированная цена, прямо в отель.',

  updated_at = NOW()
WHERE slug = 'antalya-havas-mi-vip-transfer-mi';

-- =============================================
-- BONUS: Update other posts with fresh year + updated_at
-- (signals freshness to Google without changing core keywords)
-- =============================================
UPDATE blog_posts SET updated_at = NOW()
WHERE slug IN (
  'antalya-havalimani-transfer-rehberi',
  'antalya-havalimani-kemer-vip-transfer',
  'land-of-legends-transfer-rehberi',
  'vip-transfer-mi-shuttle-mi'
);
