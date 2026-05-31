-- =============================================
-- TORVIAN TRANSFER — Alanya Region Meta Update
-- Source: Google Search Console (April–May 2026)
-- Top impressions: "antalya airport to alanya transfer time how long" (69)
-- Action: add transfer time (~2 hours) to meta for direct answer
-- =============================================

UPDATE regions SET
  meta_title_en        = 'Antalya Airport to Alanya Transfer | ~2 Hours Fixed Price 2026',
  meta_title_tr        = 'Antalya Havalimanı Alanya Transfer | ~2 Saat Sabit Fiyat 2026',
  meta_title_de        = 'Flughafen Antalya nach Alanya Transfer | ~2 Std. Festpreis 2026',
  meta_title_pl        = 'Transfer Lotnisko Antalya — Alanya | ~2 godz. Stała cena 2026',
  meta_title_ru        = 'Трансфер Аэропорт Анталья — Аланья | ~2 часа Цена 2026',

  meta_description_en  = 'Antalya Airport to Alanya: ~132 km, approx. 2 hours by private VIP transfer. Okurcalar, Konaklı, Mahmutlar all covered. Fixed price, flight tracking, door-to-door.',
  meta_description_tr  = 'Antalya Havalimanı''ndan Alanya''ya transfer: ~132 km, ~2 saat. Okurcalar, Konaklı, Mahmutlar dahil. Sabit fiyat, uçuş takibi, kapıdan kapıya.',
  meta_description_de  = 'Flughafen Antalya nach Alanya: ~132 km, ca. 2 Std. VIP-Transfer. Okurcalar, Konaklı, Mahmutlar inklusive. Festpreis, Flugverfolgung, Tür-zu-Tür.',
  meta_description_pl  = 'Lotnisko Antalya do Alanyi: ~132 km, ok. 2 godz. VIP. Okurcalar, Konaklı, Mahmutlar w zasięgu. Stała cena, śledzenie lotu, od drzwi do drzwi.',
  meta_description_ru  = 'Аэропорт Анталии — Аланья: ~132 км, ок. 2 часов VIP. Окурджалар, Конаклы, Махмутлар. Фиксированная цена, отслеживание рейса, от двери до двери.'

WHERE slug = 'alanya';
