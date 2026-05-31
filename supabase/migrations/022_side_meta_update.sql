-- =============================================
-- TORVIAN TRANSFER — Side Region Meta Update
-- Source: Google Trends 12 months Worldwide
-- Top keywords (high volume despite declining trend):
--   "antalya airport to side"            interest:94  -%50
--   "side to antalya airport"            interest:93  -%50  (return!)
--   "transfer antalya side"              interest:53  -%40
--   "antalya to side transfer time"      interest:19  -%60
--   "antalya airport to side transfer time" interest:15 -%50
-- Action: add return transfer + transfer time to meta
-- =============================================

UPDATE regions SET
  meta_title_en        = 'Antalya Airport to Side Transfer | Return & One-Way VIP 2026',
  meta_title_tr        = 'Antalya Havalimanı Side Transfer | Gidiş-Dönüş VIP 2026',
  meta_title_de        = 'Flughafen Antalya nach Side Transfer | Hin & Rückfahrt VIP 2026',
  meta_title_pl        = 'Transfer Lotnisko Antalya — Side | W obie strony VIP 2026',
  meta_title_ru        = 'Трансфер Аэропорт Анталья — Сиде | Туда и обратно VIP 2026',

  meta_description_en  = 'Antalya Airport to Side: ~65 km, approx. 55 min by private VIP transfer. Also Side to Antalya Airport return. Fixed price, flight tracking, 24/7. Book online.',
  meta_description_tr  = 'Antalya Havalimanı''ndan Side''ye transfer: ~65 km, ~55 dakika. Side''den havalimanına dönüş transferi de mevcut. Sabit fiyat, uçuş takibi, 7/24.',
  meta_description_de  = 'Flughafen Antalya nach Side: ~65 km, ca. 55 Min. Auch Rücktransfer Side → Flughafen. Festpreis, Flugverfolgung, Tür-zu-Tür, 24/7.',
  meta_description_pl  = 'Lotnisko Antalya do Side: ~65 km, ok. 55 min VIP. Też powrót Side → lotnisko. Stała cena, śledzenie lotu, od drzwi do drzwi, 24/7.',
  meta_description_ru  = 'Аэропорт Анталии — Сиде: ~65 км, ок. 55 мин. Также обратный трансфер Сиде → аэропорт. Фиксированная цена, отслеживание рейса, 24/7.'

WHERE slug = 'side';
