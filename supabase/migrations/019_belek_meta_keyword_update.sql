-- =============================================
-- TORVIAN TRANSFER — Belek Region Meta Update
-- Source: Google Trends May 2026
-- Rising keywords:
--   "antalya to belek"         +200%  interest:77
--   "antalya airport to belek" +100%  interest:18
--   "antalya belek transfer"   +80%   interest:16
--   "transfer antalya belek"   +80%   interest:16
--   "belek turkey"             +60%   interest:44
-- Action: align meta titles & descriptions with actual search demand
-- =============================================

UPDATE regions SET
  meta_title_en        = 'Antalya Airport to Belek VIP Transfer | 30 min Fixed Price 2026',
  meta_title_tr        = 'Antalya Havalimanı Belek VIP Transfer | 30 dk Sabit Fiyat 2026',
  meta_title_de        = 'Flughafen Antalya nach Belek VIP Transfer | 30 Min Festpreis 2026',
  meta_title_pl        = 'Transfer Lotnisko Antalya — Belek | 30 min VIP 2026',
  meta_title_ru        = 'Трансфер Аэропорт Анталья — Белек | 30 мин VIP 2026',

  meta_description_en  = 'Antalya Airport to Belek: ~33 km, approx. 30 min by private VIP transfer. World-class golf resorts, 5-star hotels. Fixed price, flight tracking, door-to-door. Book online.',
  meta_description_tr  = 'Antalya Havalimanı''ndan Belek''e transfer: ~33 km, ~30 dakika. Golf sahaları ve lüks otellere kapıdan kapıya. Sabit fiyat, uçuş takibi, 7/24 hizmet.',
  meta_description_de  = 'Flughafen Antalya nach Belek: ~33 km, ca. 30 Min. VIP-Privattransfer zu Golfresorts und 5-Sterne-Hotels. Festpreis, Flugverfolgung, Tür-zu-Tür.',
  meta_description_pl  = 'Lotnisko Antalya do Belek: ~33 km, ok. 30 min prywatnym VIP. Pola golfowe, hotele 5-gwiazdkowe. Stała cena, śledzenie lotu, od drzwi do drzwi.',
  meta_description_ru  = 'Аэропорт Анталии — Белек: ~33 км, ок. 30 мин. VIP-трансфер. Гольф-курорты, 5-звёздочные отели. Фиксированная цена, отслеживание рейса. Онлайн-бронирование.'

WHERE slug = 'belek';
