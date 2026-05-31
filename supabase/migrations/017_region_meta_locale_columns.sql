-- =============================================
-- Fix: Add locale-specific meta columns for regions
-- Root cause: code reads meta_title_en / meta_description_en but DB only had
--   meta_title / meta_description (no locale suffix) from migration 006.
--   This caused ALL region pages to fall back to a generic template, making
--   them near-identical → Google "duplicate without canonical" on 15 pages.
-- =============================================

ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_title_en TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_title_tr TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_title_de TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_title_pl TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_title_ru TEXT;

ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_description_en TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_description_tr TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_description_de TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_description_pl TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_description_ru TEXT;

-- ─────────────────────────────────────────────────────────────────
-- Populate the affected pages (18 flagged by GSC as duplicates)
-- Unique descriptions per region per language = fixes duplicate signal
-- ─────────────────────────────────────────────────────────────────

-- KAŞ
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Kaş Transfer | VIP Private Transfer 2026',
  meta_title_tr = 'Antalya Havalimanı Kaş Transfer | VIP Özel Transfer 2026',
  meta_title_de = 'Flughafen Antalya nach Kaş Transfer | VIP 2026',
  meta_title_pl = 'Transfer z Lotniska Antalya do Kaş | VIP 2026',
  meta_title_ru = 'Трансфер Аэропорт Анталья — Каш | VIP 2026',
  meta_description_en = 'Private VIP transfer from Antalya Airport to Kaş: 185 km, approx. 3 hours. Famous for diving, yachting and Lycian ruins. Fixed price, door-to-door, 24/7.',
  meta_description_tr = 'Antalya Havalimanından Kaş''a VIP özel transfer: 185 km, yaklaşık 3 saat. Dalış, yat ve Likya kalıntılarıyla ünlü. Sabit fiyat, kapıdan kapıya.',
  meta_description_de = 'VIP-Transfer vom Flughafen Antalya nach Kaş: 185 km, ca. 3 Std. Bekannt für Tauchen, Segeln und Lykische Ruinen. Festpreis, Tür-zu-Tür.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Kaş: 185 km, ok. 3 godz. Słynne z nurkowania, żeglarstwa i ruin licyjskich. Stała cena, od drzwi do drzwi.',
  meta_description_ru = 'VIP-трансфер из аэропорта Анталии в Каш: 185 км, ок. 3 часов. Известен дайвингом, яхтингом и ликийскими руинами. Фиксированная цена.'
WHERE slug = 'kas';

-- KUNDU-LARA
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Kundu-Lara Transfer | 15 min VIP 2026',
  meta_title_tr = 'Antalya Havalimanı Kundu-Lara Transfer | 15 dk VIP 2026',
  meta_title_de = 'Flughafen Antalya nach Kundu-Lara Transfer | 15 min VIP 2026',
  meta_title_pl = 'Transfer z Lotniska Antalya do Kundu-Lara | 15 min VIP 2026',
  meta_title_ru = 'Трансфер Аэропорт Анталья — Кунду-Лара | 15 мин VIP 2026',
  meta_description_en = 'Closest hotel zone to Antalya Airport — only 15 min, 12 km. Kundu-Lara 5-star resorts: Regnum, Kempinski, Mardan Palace. Fixed price VIP transfer.',
  meta_description_tr = 'Antalya Havalimanı''na en yakın otel bölgesi — sadece 15 dk, 12 km. Kundu-Lara 5 yıldızlı oteller: Regnum, Kempinski, Mardan Palace. Sabit fiyat.',
  meta_description_de = 'Nächste Hotelzone vom Flughafen Antalya — nur 15 Min., 12 km. Kundu-Lara 5-Sterne-Resorts: Regnum, Kempinski, Mardan Palace. Festpreis.',
  meta_description_pl = 'Najbliższa strefa hotelowa od lotniska Antalya — tylko 15 min, 12 km. Kurorty 5-gwiazdkowe: Regnum, Kempinski, Mardan Palace. Stała cena.',
  meta_description_ru = 'Ближайшая к аэропорту Анталии гостиничная зона — всего 15 мин, 12 км. 5-звёздочные отели: Regnum, Kempinski, Mardan Palace. Фиксированная цена.'
WHERE slug = 'kundu-lara';

-- EVRENSEKI
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Evrenseki Transfer | VIP Side Area 2026',
  meta_title_tr = 'Antalya Havalimanı Evrenseki Transfer | VIP Side Bölgesi 2026',
  meta_title_de = 'Flughafen Antalya nach Evrenseki Transfer | VIP Side 2026',
  meta_title_pl = 'Transfer Lotnisko Antalya — Evrenseki | VIP okolice Side 2026',
  meta_title_ru = 'Трансфер Аэропорт Анталья — Эвренсеки | VIP район Сиде 2026',
  meta_description_en = 'VIP transfer from Antalya Airport to Evrenseki: 80 km, ~1h 20min. Quiet beach village near Side, popular with families. Fixed price, flight tracking.',
  meta_description_tr = 'Antalya Havalimanı''ndan Evrenseki''ye VIP transfer: 80 km, ~1sa 20dk. Side yakınında sakin plaj köyü, aileler arasında popüler. Sabit fiyat.',
  meta_description_de = 'VIP-Transfer vom Flughafen Antalya nach Evrenseki: 80 km, ~1h 20min. Ruhiges Stranddorf in der Nähe von Side. Festpreis, Flugverfolgung.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Evrenseki: 80 km, ~1h 20min. Spokojna wioska plażowa koło Side, popularna wśród rodzin. Stała cena.',
  meta_description_ru = 'VIP-трансфер из аэропорта Анталии в Эвренсеки: 80 км, ~1ч 20мин. Тихая пляжная деревня рядом с Сиде. Фиксированная цена.'
WHERE slug = 'evrenseki';

-- CAMYUVA (Kemer sub-region)
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Çamyuva Transfer | VIP Kemer 2026',
  meta_title_tr = 'Antalya Havalimanı Çamyuva Transfer | VIP Kemer 2026',
  meta_title_de = 'Flughafen Antalya nach Çamyuva Transfer | VIP Kemer 2026',
  meta_title_pl = 'Transfer Lotnisko Antalya — Çamyuva | VIP Kemer 2026',
  meta_title_ru = 'Трансфер Аэропорт Анталья — Чамьюва | VIP Кемер 2026',
  meta_description_en = 'VIP transfer from Antalya Airport to Çamyuva: 60 km, ~55 min. Charming village between Kemer and Tekirova, pine forests meet the sea. Fixed price.',
  meta_description_tr = 'Antalya Havalimanı''ndan Çamyuva''ya VIP transfer: 60 km, ~55 dk. Kemer ile Tekirova arasında çam ormanlarının denizle buluştuğu köy. Sabit fiyat.',
  meta_description_de = 'VIP-Transfer nach Çamyuva: 60 km, ~55 Min. Charmantes Dorf zwischen Kemer und Tekirova, Kiefernwälder treffen das Meer. Festpreis.',
  meta_description_pl = 'Transfer VIP do Çamyuva: 60 km, ~55 min. Urocza wioska między Kemer a Tekirova, lasy sosnowe nad morzem. Stała cena.',
  meta_description_ru = 'VIP-трансфер в Чамьюву: 60 км, ~55 мин. Уютная деревня между Кемером и Текировой, сосновые леса у моря. Фиксированная цена.'
WHERE slug = 'camyuva';

-- KARGICAK (Alanya sub-region)
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Kargıcak Transfer | VIP Alanya Area 2026',
  meta_title_tr = 'Antalya Havalimanı Kargıcak Transfer | VIP Alanya Bölgesi 2026',
  meta_title_de = 'Flughafen Antalya nach Kargıcak Transfer | VIP Alanya 2026',
  meta_title_pl = 'Transfer Lotnisko Antalya — Kargıcak | VIP okolice Alanya 2026',
  meta_title_ru = 'Трансфер Аэропорт Анталья — Каргыджак | VIP район Аланьи 2026',
  meta_description_en = 'VIP transfer from Antalya Airport to Kargıcak: 145 km, ~2h 15min. Upscale Alanya district with luxury villas and calm beaches. Fixed price, flight tracking.',
  meta_description_tr = 'Antalya Havalimanı''ndan Kargıcak''a VIP transfer: 145 km, ~2sa 15dk. Lüks villalar ve sakin plajlarıyla Alanya''nın seçkin bölgesi. Sabit fiyat.',
  meta_description_de = 'VIP-Transfer nach Kargıcak: 145 km, ~2h 15min. Gehobenes Alanya-Viertel mit Luxusvillen und ruhigen Stränden. Festpreis, Flugverfolgung.',
  meta_description_pl = 'Transfer VIP do Kargıcak: 145 km, ~2h 15min. Ekskluzywna dzielnica Alanyi z luksusowymi willami i spokojnymi plażami. Stała cena.',
  meta_description_ru = 'VIP-трансфер в Каргыджак: 145 км, ~2ч 15мин. Элитный район Аланьи с роскошными виллами и тихими пляжами. Фиксированная цена.'
WHERE slug = 'kargicak';

-- GÖYNÜK
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Göynük Transfer | VIP Canyon & Beach 2026',
  meta_title_tr = 'Antalya Havalimanı Göynük Transfer | VIP Kanyon & Plaj 2026',
  meta_title_de = 'Flughafen Antalya nach Göynük Transfer | VIP Schlucht 2026',
  meta_title_pl = 'Transfer Lotnisko Antalya — Göynük | VIP Kanion 2026',
  meta_title_ru = 'Трансфер Аэропорт Анталья — Гёйнюк | VIP Каньон 2026',
  meta_description_en = 'VIP transfer from Antalya Airport to Göynük: 40 km, ~38 min. Known for Göynük Canyon and boutique hotels in Kemer area. Fixed price, door-to-door.',
  meta_description_tr = 'Antalya Havalimanı''ndan Göynük''e VIP transfer: 40 km, ~38 dk. Göynük Kanyonu ve Kemer bölgesindeki butik otelleriyle tanınır. Sabit fiyat.',
  meta_description_de = 'VIP-Transfer nach Göynük: 40 km, ~38 Min. Bekannt für die Göynük-Schlucht und Boutique-Hotels im Kemer-Gebiet. Festpreis, Tür-zu-Tür.',
  meta_description_pl = 'Transfer VIP do Göynük: 40 km, ~38 min. Znany z Kanionu Göynük i butikowych hoteli w okolicach Kemer. Stała cena.',
  meta_description_ru = 'VIP-трансфер в Гёйнюк: 40 км, ~38 мин. Известен каньоном Гёйнюк и бутик-отелями в районе Кемера. Фиксированная цена.'
WHERE slug = 'goynuk';

-- KİRİŞ
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Kiriş Transfer | VIP Kemer Riviera 2026',
  meta_title_tr = 'Antalya Havalimanı Kiriş Transfer | VIP Kemer Riviera 2026',
  meta_title_de = 'Flughafen Antalya nach Kiriş Transfer | VIP Riviera 2026',
  meta_title_pl = 'Transfer Lotnisko Antalya — Kiriş | VIP Riwiera Kemer 2026',
  meta_title_ru = 'Трансфер Аэропорт Анталья — Кириш | VIP Ривьера Кемер 2026',
  meta_description_en = 'VIP transfer from Antalya Airport to Kiriş: 57 km, ~52 min. Quiet bay near Kemer town, pebble beach and clear Mediterranean waters. Fixed price.',
  meta_description_tr = 'Antalya Havalimanı''ndan Kiriş''e VIP transfer: 57 km, ~52 dk. Kemer yakınında sakin körfez, çakıl plaj ve berrak Akdeniz suları. Sabit fiyat.',
  meta_description_de = 'VIP-Transfer nach Kiriş: 57 km, ~52 Min. Ruhige Bucht nahe Kemer, Kieselstrand und klares Mittelmeer. Festpreis.',
  meta_description_pl = 'Transfer VIP do Kiriş: 57 km, ~52 min. Spokojna zatoka koło Kemer, żwirowa plaża i czyste wody Morza Śródziemnego. Stała cena.',
  meta_description_ru = 'VIP-трансфер в Кириш: 57 км, ~52 мин. Тихая бухта рядом с Кемером, галечный пляж и чистые воды Средиземного моря. Фиксированная цена.'
WHERE slug = 'kiris';

-- TEKİROVA
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Tekirova Transfer | VIP Olympos Area 2026',
  meta_title_tr = 'Antalya Havalimanı Tekirova Transfer | VIP Olympos Bölgesi 2026',
  meta_title_de = 'Flughafen Antalya nach Tekirova Transfer | VIP Olympos 2026',
  meta_title_pl = 'Transfer Lotnisko Antalya — Tekirova | VIP rejon Olympos 2026',
  meta_title_ru = 'Трансфер Аэропорт Анталья — Текирова | VIP район Олимпоса 2026',
  meta_description_en = 'VIP transfer from Antalya Airport to Tekirova: 70 km, ~1h 5min. Gateway to Olympos, Chimaera flame and Tahtalı mountain. Luxury resorts, fixed price.',
  meta_description_tr = 'Antalya Havalimanı''ndan Tekirova''ya VIP transfer: 70 km, ~1sa 5dk. Olympos, Yanartaş ve Tahtalı''ya kapı. Lüks tatil köyleri, sabit fiyat.',
  meta_description_de = 'VIP-Transfer nach Tekirova: 70 km, ~1h 5min. Tor zu Olympos, Chimäre-Flamme und Tahtalı-Berg. Luxusresorts, Festpreis.',
  meta_description_pl = 'Transfer VIP do Tekirova: 70 km, ~1h 5min. Brama do Olimposu, płomienia Chimery i góry Tahtalı. Luksusowe kurorty, stała cena.',
  meta_description_ru = 'VIP-трансфер в Текирову: 70 км, ~1ч 5мин. Ворота в Олимпос, огонь Химеры и гора Тахталы. Роскошные курорты, фиксированная цена.'
WHERE slug = 'tekirova';

-- FETHİYE
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Fethiye Transfer | VIP Blue Lagoon 2026',
  meta_title_tr = 'Antalya Havalimanı Fethiye Transfer | VIP Mavi Lagün 2026',
  meta_title_de = 'Flughafen Antalya nach Fethiye Transfer | VIP Blaue Lagune 2026',
  meta_title_pl = 'Transfer Lotnisko Antalya — Fethiye | VIP Błękitna Laguna 2026',
  meta_title_ru = 'Трансфер Аэропорт Анталья — Фетхие | VIP Голубая Лагуна 2026',
  meta_description_en = 'VIP transfer from Antalya Airport to Fethiye: 210 km, ~3h. Famous for Ölüdeniz Blue Lagoon, paragliding and ancient Lycian tombs. Fixed price.',
  meta_description_tr = 'Antalya Havalimanı''ndan Fethiye''ye VIP transfer: 210 km, ~3 saat. Ölüdeniz Mavi Lagün, yamaç paraşütü ve antik Likya kaya mezarları. Sabit fiyat.',
  meta_description_de = 'VIP-Transfer nach Fethiye: 210 km, ~3 Std. Berühmt für Ölüdeniz Blaue Lagune, Gleitschirmfliegen und lykische Felsengräber. Festpreis.',
  meta_description_pl = 'Transfer VIP do Fethiye: 210 km, ~3 godz. Słynne z Błękitnej Laguny Ölüdeniz, paralotniarstwa i licyjskich grobowców skalnych. Stała cena.',
  meta_description_ru = 'VIP-трансфер в Фетхие: 210 км, ~3 часа. Известен Голубой Лагуной Олюдениз, параглайдингом и ликийскими скальными гробницами. Фиксированная цена.'
WHERE slug = 'fethiye';

-- BOĞAZKENT
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Boğazkent Transfer | VIP Side Area 2026',
  meta_title_tr = 'Antalya Havalimanı Boğazkent Transfer | VIP Side Bölgesi 2026',
  meta_title_de = 'Flughafen Antalya nach Boğazkent Transfer | VIP Side 2026',
  meta_title_pl = 'Transfer Lotnisko Antalya — Boğazkent | VIP okolice Side 2026',
  meta_title_ru = 'Трансфер Аэропорт Анталья — Богазкент | VIP район Сиде 2026',
  meta_description_en = 'VIP transfer from Antalya Airport to Boğazkent: 75 km, ~1h 20min. Thermal spa hotels and long sandy beaches near Side. Fixed price, door-to-door.',
  meta_description_tr = 'Antalya Havalimanı''ndan Boğazkent''e VIP transfer: 75 km, ~1sa 20dk. Side yakınında termal spa otelleri ve uzun kumsal plajlar. Sabit fiyat.',
  meta_description_de = 'VIP-Transfer nach Boğazkent: 75 km, ~1h 20min. Thermalspa-Hotels und lange Sandstrände in der Nähe von Side. Festpreis, Tür-zu-Tür.',
  meta_description_pl = 'Transfer VIP do Boğazkent: 75 km, ~1h 20min. Hotele spa termalne i długie piaszczyste plaże koło Side. Stała cena.',
  meta_description_ru = 'VIP-трансфер в Богазкент: 75 км, ~1ч 20мин. Термальные спа-отели и длинные песчаные пляжи рядом с Сиде. Фиксированная цена.'
WHERE slug = 'bogazkent';

-- MAHMUTLAR
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Mahmutlar Transfer | VIP Alanya 2026',
  meta_title_tr = 'Antalya Havalimanı Mahmutlar Transfer | VIP Alanya 2026',
  meta_title_de = 'Flughafen Antalya nach Mahmutlar Transfer | VIP Alanya 2026',
  meta_title_pl = 'Transfer Lotnisko Antalya — Mahmutlar | VIP Alanya 2026',
  meta_title_ru = 'Трансфер Аэропорт Анталья — Махмутлар | VIP Аланья 2026',
  meta_description_en = 'VIP transfer from Antalya Airport to Mahmutlar: 135 km, ~2h 10min. Popular with Northern European and Russian expats, long beaches east of Alanya. Fixed price.',
  meta_description_tr = 'Antalya Havalimanı''ndan Mahmutlar''a VIP transfer: 135 km, ~2sa 10dk. Kuzey Avrupalı ve Rus expatlar arasında popüler, Alanya doğusunda uzun plajlar. Sabit fiyat.',
  meta_description_de = 'VIP-Transfer nach Mahmutlar: 135 km, ~2h 10min. Beliebt bei nordeuropäischen und russischen Expats, lange Strände östlich von Alanya. Festpreis.',
  meta_description_pl = 'Transfer VIP do Mahmutlar: 135 km, ~2h 10min. Popularny wśród Skandynawów i Rosjan, długie plaże na wschód od Alanyi. Stała cena.',
  meta_description_ru = 'VIP-трансфер в Махмутлар: 135 км, ~2ч 10мин. Популярен среди северноевропейцев и россиян, длинные пляжи к востоку от Аланьи. Фиксированная цена.'
WHERE slug = 'mahmutlar';

-- KEMER (main region, also add locale-specific)
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Kemer VIP Transfer | 45 min, Fixed Price 2026',
  meta_title_tr = 'Antalya Havalimanı Kemer VIP Transfer | 45 dk, Sabit Fiyat 2026',
  meta_title_de = 'Flughafen Antalya Kemer VIP Transfer | 45 Min, Festpreis 2026',
  meta_title_pl = 'Transfer VIP Lotnisko Antalya — Kemer | 45 min, Stała Cena 2026',
  meta_title_ru = 'VIP Трансфер Аэропорт Анталья — Кемер | 45 мин, Цена 2026',
  meta_description_en = 'VIP private transfer from Antalya Airport to Kemer: 50 km, ~45 min. Riviera resorts, Taurus mountains, crystal blue sea. Fixed price, flight tracking, 24/7.',
  meta_description_tr = 'Antalya Havalimanı''ndan Kemer''e VIP özel transfer: 50 km, ~45 dk. Riviera tatil köyleri, Toroslar, kristal mavi deniz. Sabit fiyat, uçuş takibi.',
  meta_description_de = 'VIP-Transfer vom Flughafen Antalya nach Kemer: 50 km, ~45 Min. Riviera-Resorts, Taurus-Berge, kristallblaues Meer. Festpreis, Flugverfolgung.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Kemer: 50 km, ~45 min. Kurorty na Riwierze, góry Taurus, krystalicznie błękitne morze. Stała cena.',
  meta_description_ru = 'VIP-трансфер из аэропорта Анталии в Кемер: 50 км, ~45 мин. Курорты Ривьеры, горы Тавр, кристально синее море. Фиксированная цена.'
WHERE slug = 'kemer';

-- BELDİBİ
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Beldibi Transfer | VIP Kemer Gateway 2026',
  meta_title_tr = 'Antalya Havalimanı Beldibi Transfer | VIP Kemer Girişi 2026',
  meta_title_de = 'Flughafen Antalya nach Beldibi Transfer | VIP Kemer 2026',
  meta_title_pl = 'Transfer Lotnisko Antalya — Beldibi | VIP brama do Kemer 2026',
  meta_title_ru = 'Трансфер Аэропорт Анталья — Белдиби | VIP ворота Кемера 2026',
  meta_description_en = 'VIP transfer from Antalya Airport to Beldibi: 37 km, ~35 min. First resort village entering Kemer, with large all-inclusive hotels. Fixed price.',
  meta_description_tr = 'Antalya Havalimanı''ndan Beldibi''ye VIP transfer: 37 km, ~35 dk. Kemer''e girerken ilk tatil köyü, büyük her şey dahil oteller. Sabit fiyat.',
  meta_description_de = 'VIP-Transfer nach Beldibi: 37 km, ~35 Min. Erstes Ferienort beim Eintritt in Kemer, mit großen All-inclusive-Hotels. Festpreis.',
  meta_description_pl = 'Transfer VIP do Beldibi: 37 km, ~35 min. Pierwsza wioska wypoczynkowa przy wjeździe do Kemer, z dużymi hotelami all-inclusive. Stała cena.',
  meta_description_ru = 'VIP-трансфер в Белдиби: 37 км, ~35 мин. Первый курортный посёлок при въезде в Кемер, крупные отели «всё включено». Фиксированная цена.'
WHERE slug = 'beldibi';

-- SIDE (main region)
UPDATE regions SET
  meta_title_en = 'Antalya Airport to Side VIP Transfer | Ancient City Beach 2026',
  meta_title_tr = 'Antalya Havalimanı Side VIP Transfer | Antik Kent Plajı 2026',
  meta_title_de = 'Flughafen Antalya Side VIP Transfer | Antike Stadt 2026',
  meta_title_pl = 'Transfer VIP Lotnisko Antalya — Side | Starożytne Miasto 2026',
  meta_title_ru = 'VIP Трансфер Аэропорт Анталья — Сиде | Античный Город 2026',
  meta_description_en = 'VIP private transfer from Antalya Airport to Side: 65 km, ~75 min. Roman theatre, Apollo Temple, long sandy beaches. Fixed price, flight tracking, 24/7.',
  meta_description_tr = 'Antalya Havalimanı''ndan Side''ye VIP özel transfer: 65 km, ~75 dk. Roma tiyatrosu, Apollon tapınağı, uzun kumsal plajlar. Sabit fiyat, uçuş takibi.',
  meta_description_de = 'VIP-Transfer vom Flughafen Antalya nach Side: 65 km, ~75 Min. Römisches Theater, Apollon-Tempel, lange Sandstrände. Festpreis, Flugverfolgung.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Side: 65 km, ~75 min. Teatr rzymski, Świątynia Apollina, długie piaszczyste plaże. Stała cena.',
  meta_description_ru = 'VIP-трансфер из аэропорта Анталии в Сиде: 65 км, ~75 мин. Римский театр, храм Аполлона, длинные песчаные пляжи. Фиксированная цена.'
WHERE slug = 'side';
