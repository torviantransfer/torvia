-- =============================================
-- TORVIAN — Taxi vs VIP Transfer Blog SEO Update
-- Source: Google Search Console (April–May 2026)
-- Page: /en/blog/antalya-havalimani-taksi-mi-vip-transfer-mi
-- Problem: +215% impressions but near-zero CTR
--   Top queries: "antalya private transfer" (26 imp), "antalya airport private transfer" (32 imp)
--   "antalya vip transfer cost" (5 imp) — no price content in post
--   German queries hitting EN page ("privat transfer antalya" 13 imp) — DE title not optimized
--   No excerpt set → Google auto-generates weak snippet
--   No FAQ section → no FAQPage rich snippet in SERP
-- Fixes:
--   1. Titles: front-load top query keywords (EN + DE + TR)
--   2. Excerpts: add meta descriptions for all 5 locales
--   3. content_en: append pricing paragraph + FAQ section (triggers FAQPage schema)
--   4. content_de: append FAQ section (triggers FAQPage schema for /de/ page)
-- =============================================

UPDATE blog_posts SET

  -- -----------------------------------------------
  -- TITLES — front-load the highest-volume queries
  -- EN top query: "antalya airport private transfer" (32 imp combined)
  -- DE top query: "privat transfer antalya" (13 imp hitting EN page)
  -- -----------------------------------------------
  title_en = 'Antalya Airport Private Transfer vs Taxi — 2026 Honest Comparison',
  title_de = 'Privattransfer Flughafen Antalya vs Taxi — Vergleich 2026',
  title_tr = 'Antalya Havalimanı Özel Transfer mi Taksi mi? 2026 Karşılaştırması',

  -- -----------------------------------------------
  -- EXCERPTS — optimized meta descriptions (155 chars max)
  -- Target: CTR improvement from SERP snippet
  -- -----------------------------------------------
  excerpt_en = 'Antalya Airport private transfer vs taxi: fixed price, flight tracking, no night surcharges. VIP Mercedes from €35. Honest 2026 comparison guide.',
  excerpt_tr = 'Antalya Havalimanı''nda özel transfer mi taksi mi? Sabit fiyat, uçuş takibi, gece tarifesi yok. Mercedes VIP €35''ten. Dürüst 2026 karşılaştırması.',
  excerpt_de = 'Privattransfer vs. Taxi am Flughafen Antalya: Festpreis, Flugverfolgung, kein Nachtzuschlag. VIP Mercedes ab €35. Ehrlicher Vergleich 2026.',
  excerpt_pl = 'Transfer prywatny vs taksówka na lotnisku Antalya: stała cena, śledzenie lotu, bez dopłaty nocnej. VIP Mercedes od €35. Uczciwy porównanie 2026.',
  excerpt_ru = 'Частный трансфер vs такси в аэропорту Анталии: фиксированная цена, отслеживание рейса, без ночной надбавки. VIP Mercedes от €35. Честное сравнение 2026.',

  -- -----------------------------------------------
  -- CONTENT EN — append pricing info + FAQ section
  -- FAQ H2 pattern "Frequently Asked Questions" triggers FAQPage schema in page.tsx:225
  -- H3 = question, P = answer (extractor regex: h3 + p pairs after FAQ h2)
  -- Addresses "antalya vip transfer cost" query (5 imp, no answer in old content)
  -- -----------------------------------------------
  content_en = content_en || '
<h3>How Much Does an Antalya Airport Private Transfer Cost?</h3>
<p>Unlike metered taxis, TORVIAN VIP transfer prices are fixed and shown upfront at booking. Typical fares from Antalya Airport (AYT): Belek from €35, Kemer from €40, Side from €45, Alanya from €65. No hidden fees, no night surcharges — the price you see is the price you pay.</p>
<h2>Frequently Asked Questions</h2>
<h3>How much does a private VIP transfer from Antalya Airport cost?</h3>
<p>TORVIAN private transfer prices start from €35 for short routes like Belek, up to €85 for longer routes like Kaş or Alanya. All prices are fixed — no meter, no night surcharge, no surprises at drop-off.</p>
<h3>Is a private transfer better than an airport taxi in Antalya?</h3>
<p>For most holiday travellers, yes. A pre-booked private VIP transfer offers a fixed price, real-time flight tracking, a named meet-and-greet sign, and door-to-door service to your hotel — none of which standard Antalya airport taxis provide.</p>
<h3>How do I book a private transfer from Antalya Airport?</h3>
<p>Select your destination, choose your vehicle, and pay securely online via Stripe. You receive instant confirmation and your driver monitors your flight in case of delays — no extra charge for waiting.</p>',

  -- -----------------------------------------------
  -- CONTENT DE — append FAQ section
  -- "Häufig gestellte Fragen" contains "häufig gestellt" → matches FAQ extractor pattern
  -- Targets German queries currently hitting EN page
  -- -----------------------------------------------
  content_de = content_de || '
<h2>Häufig gestellte Fragen</h2>
<h3>Was kostet ein Privattransfer vom Flughafen Antalya?</h3>
<p>TORVIAN Preise beginnen bei €35 für kürzere Strecken wie Belek, bis zu €85 für längere Routen wie Kaş oder Alanya. Alle Preise sind Festpreise — kein Taxameter, kein Nachtzuschlag, keine Überraschungen.</p>
<h3>Ist ein Privattransfer besser als ein Taxi am Flughafen Antalya?</h3>
<p>Für die meisten Urlauber ja. Ein vorgebuchter VIP-Privattransfer bietet Festpreis, Echtzeit-Flugverfolgung, Begrüßungsschild und Tür-zu-Tür-Service — alles, was Antalya Flughafen-Taxis nicht bieten.</p>
<h3>Wie buche ich einen Privattransfer vom Flughafen Antalya?</h3>
<p>Wählen Sie Ihr Ziel, suchen Sie Ihr Fahrzeug und bezahlen Sie sicher online. Sie erhalten sofortige Buchungsbestätigung — Ihr Fahrer verfolgt Ihren Flug und wartet kostenlos bei Verspätungen.</p>',

  image_url = '/images/blog/family-transfer-tips.jpg',
  updated_at = NOW()

WHERE slug = 'antalya-havalimani-taksi-mi-vip-transfer-mi';
