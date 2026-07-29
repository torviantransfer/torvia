-- 042: Rewrite titles + meta descriptions for page-1 rankings taking zero clicks
--
-- THE PROBLEM (Search Console, 27 Apr – 26 Jul 2026)
--
--   /pl/blog/antalya-havalimani-side-transfer          354 impr · pos 7.1  · 0 clicks
--   /ru/blog/antalya-alanya-transfer-suresi            269 impr · pos 7.4  · 0 clicks
--   /pl/blog/antalya-havalimani-belek-transfer         217 impr · pos 7.9  · 0 clicks
--   /pl/blog/antalya-havalimani-alanya-transfer-...    198 impr · pos 8.4  · 0 clicks
--   /de/blog/uber-antalya-havalimani-ulasim            189 impr · pos 8.9  · 0 clicks
--   /de/blog/antalya-belek-transfer-mesafe-sure        102 impr · pos 8.8  · 0 clicks
--   /pl/blog/antalya-alanya-transfer-suresi             96 impr · pos 6.8  · 0 clicks
--   /en/blog/antalya-kemer-transfer-mesafe-sure         89 impr · pos 6.1  · 0 clicks
--
-- Position 6–8 should yield 2–4% CTR. These yield 0.0%.
--
-- THE CAUSE — intent mismatch. The queries are questions:
--   pl  "belek odległość od lotniska" · "belek jak daleko od lotniska"
--   ru  "расстояние от аэропорта анталии до кемера" · "сколько ехать"
--   de  "entfernung kemer antalya" · "hat alanya einen eigenen flughafen"
--   en  "how far is kemer from antalya airport"
--   tr  "antalya side arası kaç km"
-- ...but the titles were written as sales pitches ("Transfer z lotniska
-- Antalya do Belek | VIP Prywatny"). Nothing in the snippet says the page
-- answers the question, so the user skips it.
--
-- THE FIX — lead with the answer and put the number in the title. A title
-- reading "55 km, 50 minut" matches the query wording, and gives the searcher
-- a reason to click even when an AI Overview has already summarised the topic:
-- it promises the specific figure plus the breakdown behind it.
--
-- Distances/durations below are the values already stored in `regions`
-- (Kemer 55 km/45 min · Side 65 km/55 min · Belek 33 km/30 min ·
--  Alanya 132 km/120 min · Lara 14 km/18 min) so titles cannot contradict
-- the booking engine.
--
-- Only title_<locale> and excerpt_<locale> change. Slugs, content and
-- published dates are untouched. Safe to re-run.


-- ===========================================================================
-- A. Antalya Airport ↔ KEMER — 55 km, 45 min
--    Biggest Russian cluster on the site: /ru/ has 1,050 impressions here.
-- ===========================================================================
UPDATE blog_posts SET
  title_ru   = $$Расстояние от аэропорта Анталии до Кемера: 55 км, 50 минут$$,
  excerpt_ru = $$От аэропорта Анталии (AYT) до Кемера 55 км — примерно 50 минут на трансфере. Время в пути до Бельдиби, Гёйнюка, Чамьювы и Текировы, цены и способы добраться.$$,

  title_pl   = $$Kemer – odległość od lotniska Antalya: 55 km, 50 minut$$,
  excerpt_pl = $$Z lotniska Antalya do Kemer jest 55 km, czyli około 50 minut jazdy. Sprawdź czas przejazdu do Beldibi, Göynük, Çamyuva i Tekirova oraz ceny transferu.$$,

  title_de   = $$Entfernung Flughafen Antalya – Kemer: 55 km, ca. 50 Minuten$$,
  excerpt_de = $$Vom Flughafen Antalya nach Kemer sind es 55 km, etwa 50 Minuten Fahrt. Fahrzeiten nach Beldibi, Göynük, Çamyuva und Tekirova sowie Transferpreise im Überblick.$$,

  title_en   = $$Antalya Airport to Kemer: Distance 55 km, 50 Minutes$$,
  excerpt_en = $$Antalya Airport (AYT) to Kemer is 55 km — about 50 minutes by private transfer. Travel times to Beldibi, Göynük, Çamyuva and Tekirova, plus how to get there.$$,

  title_tr   = $$Antalya Havalimanı (AYT) Kemer Arası Kaç Km? 55 km, 50 Dk$$,
  excerpt_tr = $$Antalya Havalimanı ile Kemer arası 55 km, özel transferle yaklaşık 50 dakika. Beldibi, Göynük, Çamyuva ve Tekirova varış süreleri ve ulaşım seçenekleri.$$
WHERE slug = 'antalya-kemer-transfer-mesafe-sure';


-- ===========================================================================
-- B. Antalya Airport ↔ SIDE — 70 km, 55 min
--    /tr/ 1,053 impr · /pl/ 272 impr · /ru/ 199 impr, all near-zero CTR.
-- ===========================================================================
UPDATE blog_posts SET
  title_tr   = $$Antalya Havalimanı (AYT) Side Arası Kaç Km? 70 km, 60 Dk$$,
  excerpt_tr = $$Antalya Havalimanı ile Side arası 70 km, özel transferle yaklaşık 60 dakika. Evrenseki, Çolaklı, Kızılağaç ve Manavgat mesafeleri ve ulaşım seçenekleri.$$,

  title_pl   = $$Side – odległość od lotniska Antalya: 70 km, 60 minut$$,
  excerpt_pl = $$Z lotniska Antalya do Side jest 70 km, czyli około 60 minut jazdy. Odległości do Evrenseki, Çolaklı, Kızılağaç i Manavgat oraz opcje dojazdu i ceny.$$,

  title_ru   = $$Расстояние от аэропорта Анталии до Сиде: 70 км, 60 минут$$,
  excerpt_ru = $$От аэропорта Анталии до Сиде 70 км — около 60 минут на трансфере. Расстояния до Эвренсеки, Чолаклы, Кызылагача и Манавгата, цены и как добраться.$$,

  title_en   = $$Antalya Airport to Side: Distance 70 km, 60 Minutes$$,
  excerpt_en = $$Antalya Airport (AYT) to Side is 70 km — roughly 60 minutes by private transfer. Distances to Evrenseki, Çolaklı, Kızılağaç and Manavgat, and how to get there.$$,

  title_de   = $$Entfernung Flughafen Antalya – Side: 70 km, ca. 60 Minuten$$,
  excerpt_de = $$Vom Flughafen Antalya nach Side sind es 70 km, etwa 60 Minuten Fahrt. Entfernungen nach Evrenseki, Çolaklı, Kızılağaç und Manavgat sowie Transferoptionen.$$
WHERE slug = 'antalya-side-transfer-mesafe-sure';


-- ===========================================================================
-- C. Antalya Airport ↔ BELEK — 35 km, 30 min
--    Polish queries are explicit: "belek odległość od lotniska",
--    "antalya lotnisko belek odległość", "belek jak daleko od lotniska".
-- ===========================================================================
UPDATE blog_posts SET
  title_pl   = $$Belek – odległość od lotniska Antalya: 35 km, 35 minut$$,
  excerpt_pl = $$Z lotniska Antalya do Belek jest 35 km, czyli tylko około 35 minut jazdy. Odległości do Kadriye i Boğazkent, dojazd do hoteli golfowych oraz ceny transferu.$$,

  title_de   = $$Entfernung Flughafen Antalya – Belek: 35 km, ca. 35 Minuten$$,
  excerpt_de = $$Vom Flughafen Antalya nach Belek sind es nur 35 km, etwa 35 Minuten Fahrt. Entfernungen nach Kadriye und Boğazkent sowie Transfer zu den Golfresorts.$$,

  title_ru   = $$Расстояние от аэропорта Анталии до Белека: 35 км, 35 минут$$,
  excerpt_ru = $$От аэропорта Анталии до Белека всего 35 км — около 35 минут. Расстояния до Кадрие и Богазкента, трансфер до гольф-отелей и фиксированные цены.$$,

  title_tr   = $$Antalya Havalimanı (AYT) Belek Arası Kaç Km? 35 km, 35 Dk$$,
  excerpt_tr = $$Antalya Havalimanı ile Belek arası sadece 35 km, özel transferle yaklaşık 35 dakika. Kadriye ve Boğazkent mesafeleri, golf otellerine ulaşım ve fiyatlar.$$,

  title_en   = $$Antalya Airport to Belek: Distance 35 km, 35 Minutes$$,
  excerpt_en = $$Antalya Airport (AYT) to Belek is just 35 km — about 35 minutes by private transfer. Distances to Kadriye and Boğazkent, plus transfers to the golf resorts.$$
WHERE slug = 'antalya-belek-transfer-mesafe-sure';


-- ===========================================================================
-- D. Antalya Airport → ALANYA, journey time — 130 km, ~2 h
--    /en/ carries 3,189 impressions at 0.16% CTR: the single largest
--    informational miss on the site.
-- ===========================================================================
UPDATE blog_posts SET
  title_en   = $$Antalya Airport to Alanya Transfer Time: 2 Hours, 130 km$$,
  excerpt_en = $$Antalya Airport (AYT) to Alanya takes about 2 hours over 130 km by private transfer. Times to Mahmutlar, Kestel and Konaklı, why Alanya has no usable airport.$$,

  title_pl   = $$Lotnisko Antalya – Alanya: ile trwa? 130 km, 2 godziny$$,
  excerpt_pl = $$Z lotniska Antalya do Alanyi jest 130 km, a przejazd trwa około 2 godzin. Czasy dojazdu do Mahmutlar, Kestel i Konaklı oraz porównanie opcji transportu.$$,

  title_ru   = $$Сколько ехать от аэропорта Анталии до Алании: 130 км, 2 часа$$,
  excerpt_ru = $$От аэропорта Анталии до Алании 130 км — около 2 часов на трансфере. Время в пути до Махмутлара, Кестеля и Конаклы, а также почему в Алании нет аэропорта.$$,

  title_tr   = $$Antalya Havalimanı Alanya Kaç Saat? 130 km, 2 Saat$$,
  excerpt_tr = $$Antalya Havalimanı ile Alanya arası 130 km, özel transferle yaklaşık 2 saat. Mahmutlar, Kestel ve Konaklı süreleri, Alanya'da havalimanı var mı sorusunun cevabı.$$,

  title_de   = $$Antalya Flughafen nach Alanya: Fahrzeit 2 Stunden, 130 km$$,
  excerpt_de = $$Vom Flughafen Antalya nach Alanya sind es 130 km, etwa 2 Stunden Fahrt. Fahrzeiten nach Mahmutlar, Kestel und Konaklı sowie warum Alanya keinen Flughafen hat.$$
WHERE slug = 'antalya-havalimani-alanya-transfer-kac-saat';


-- ===========================================================================
-- E. Antalya → ALANYA travel time (companion post)
--    /ru/ 269 impr · pos 7.4 · 0 clicks — /pl/ 96 impr · pos 6.8 · 0 clicks
-- ===========================================================================
UPDATE blog_posts SET
  title_ru   = $$Анталия – Алания: расстояние 130 км и время в пути 2 часа$$,
  excerpt_ru = $$Расстояние Анталия – Алания составляет 130 км по прибрежной трассе D400, время в пути около 2 часов. Время до каждого района и сравнение способов доехать.$$,

  title_pl   = $$Antalya – Alanya: odległość 130 km i czas przejazdu 2 godziny$$,
  excerpt_pl = $$Odległość Antalya – Alanya to 130 km drogą nadmorską D400, a przejazd trwa około 2 godzin. Czasy dojazdu do każdej dzielnicy i porównanie opcji transportu.$$,

  title_tr   = $$Antalya Havalimanı Alanya Arası Kaç Km? 130 km, 2 Saat$$,
  excerpt_tr = $$Antalya Havalimanı ile Alanya arası 130 km, D400 sahil yolundan yaklaşık 2 saat. Türkler, Avsallar, Konaklı, Kestel ve Mahmutlar için ayrı ayrı mesafe ve süre tablosu.$$,

  title_en   = $$Antalya to Alanya: 130 km and About 2 Hours by Road$$,
  excerpt_en = $$Antalya to Alanya is 130 km along the D400 coastal road, about 2 hours' drive. Journey times for every district plus a comparison of your transport options.$$,

  title_de   = $$Antalya nach Alanya: 130 km und rund 2 Stunden Fahrzeit$$,
  excerpt_de = $$Antalya nach Alanya sind 130 km über die Küstenstraße D400, rund 2 Stunden Fahrt. Fahrzeiten für jeden Ortsteil und ein Vergleich der Transportmöglichkeiten.$$
WHERE slug = 'antalya-alanya-transfer-suresi';


-- ===========================================================================
-- F. Antalya Airport → SIDE transfer (the /pl/ page: 354 impr, pos 7.1, 0 clicks)
-- ===========================================================================
UPDATE blog_posts SET
  title_pl   = $$Transfer z lotniska Antalya do Side: 70 km, 60 minut, ceny$$,
  excerpt_pl = $$Transfer z lotniska Antalya do Side: 70 km i około 60 minut. Prywatny transfer pod hotel, stała cena za pojazd, monitoring lotu i bezpłatne odwołanie 24h.$$,

  title_ru   = $$Трансфер из аэропорта Анталии в Сиде: 70 км, 60 минут, цены$$,
  excerpt_ru = $$Трансфер из аэропорта Анталии в Сиде: 70 км и около 60 минут. Частный трансфер до отеля, фиксированная цена за авто, отслеживание рейса, отмена за 24 ч.$$,

  title_de   = $$Transfer Flughafen Antalya – Side: 70 km, 60 Minuten$$,
  excerpt_de = $$Transfer vom Flughafen Antalya nach Side: 70 km und etwa 60 Minuten. Privattransfer bis zum Hotel, Festpreis pro Fahrzeug, Flugverfolgung, kostenlose Stornierung.$$
WHERE slug = 'antalya-havalimani-side-transfer';


-- ===========================================================================
-- G. Antalya Airport → BELEK transfer (the /pl/ page: 217 impr, pos 7.9, 0 clicks)
-- ===========================================================================
UPDATE blog_posts SET
  title_pl   = $$Transfer z lotniska Antalya do Belek: 35 km, 35 minut, ceny$$,
  excerpt_pl = $$Transfer z lotniska Antalya do Belek: 35 km i tylko 35 minut. Prywatny transfer pod hotel lub pole golfowe, stała cena za pojazd, miejsce na torby golfowe.$$,

  title_ru   = $$Трансфер из аэропорта Анталии в Белек: 35 км, 35 минут, цены$$,
  excerpt_ru = $$Трансфер из аэропорта Анталии в Белек: 35 км и всего 35 минут. Частный трансфер до отеля или гольф-клуба, фиксированная цена, место для гольф-сумок.$$,

  title_tr   = $$Antalya Havalimanı Belek Transfer: 35 km, 35 Dakika, Fiyatlar$$,
  excerpt_tr = $$Antalya Havalimanı'ndan Belek'e transfer: 35 km ve sadece 30 dakika. Otelinize veya golf sahasına özel transfer, sabit fiyat, golf çantası için ekstra yer.$$
WHERE slug = 'antalya-havalimani-belek-transfer';


-- ===========================================================================
-- H. UBER IN ANTALYA
--    /en/ 5,199 impressions at 0.23% CTR — the site's single biggest page.
--    /de/ 189 impressions at position 8.9 with zero clicks.
--    German query is literally "gibt es uber in antalya" — answer it in the title.
-- ===========================================================================
UPDATE blog_posts SET
  title_en   = $$Is Uber Available in Antalya? 2026 Status and Alternatives$$,
  excerpt_en = $$Uber has been banned in Turkey since 2019 and does not operate in Antalya. Here is what actually works in 2026: BiTaksi, Havaş, official taxis and private transfer.$$,

  title_de   = $$Gibt es Uber in Antalya? Status 2026 und beste Alternativen$$,
  excerpt_de = $$Uber ist in der Türkei seit 2019 verboten und fährt nicht in Antalya. Das funktioniert 2026 stattdessen: BiTaksi, Havaş-Bus, offizielles Taxi und Privattransfer.$$,

  title_ru   = $$Работает ли Uber в Анталии? Статус 2026 и альтернативы$$,
  excerpt_ru = $$Uber запрещён в Турции с 2019 года и в Анталии не работает. Что реально работает в 2026 году: BiTaksi, автобус Havaş, официальное такси и частный трансфер.$$,

  title_pl   = $$Czy Uber działa w Antalyi? Status 2026 i alternatywy$$,
  excerpt_pl = $$Uber jest zakazany w Turcji od 2019 roku i nie działa w Antalyi. Co działa w 2026: BiTaksi, autobus Havaş, oficjalna taksówka i prywatny transfer z lotniska.$$,

  title_tr   = $$Antalya'da Uber Var mı? 2026 Durumu ve Alternatifleri$$,
  excerpt_tr = $$Uber Türkiye'de 2019'dan beri yasaklı ve Antalya'da çalışmıyor. 2026'da gerçekten işe yarayanlar: BiTaksi, Havaş otobüsü, resmi taksi ve VIP özel transfer.$$
WHERE slug = 'uber-antalya-havalimani-ulasim';


-- ===========================================================================
-- I. IS THERE AN AIRPORT IN ALANYA
--    German "hat alanya einen eigenen flughafen" sits at position 8.1 and is
--    one of the few queries that already converted a click — worth sharpening.
-- ===========================================================================
UPDATE blog_posts SET
  title_de   = $$Hat Alanya einen eigenen Flughafen? Antwort und Fahrzeiten$$,
  excerpt_de = $$Alanya hat mit Gazipaşa (GZP) einen kleinen Flughafen, doch fast alle Urlaubsflüge landen in Antalya (AYT), 130 km entfernt. Fahrzeiten und Transferoptionen.$$,

  title_en   = $$Is There an Airport in Alanya? Gazipaşa vs Antalya (AYT)$$,
  excerpt_en = $$Alanya has a small airport, Gazipaşa (GZP), but almost all holiday flights land at Antalya (AYT), 130 km away. Transfer times and options from both airports.$$,

  title_tr   = $$Alanya'da Havalimanı Var mı? Gazipaşa ve Antalya Karşılaştırma$$,
  excerpt_tr = $$Alanya'nın Gazipaşa (GZP) adında küçük bir havalimanı var, ancak tatil uçuşlarının neredeyse tamamı 130 km uzaktaki Antalya'ya (AYT) iniyor. Süreler ve seçenekler.$$,

  title_ru   = $$Есть ли аэропорт в Алании? Газипаша и Анталия — сравнение$$,
  excerpt_ru = $$В Алании есть небольшой аэропорт Газипаша (GZP), но почти все туристические рейсы прилетают в Анталию (AYT) в 130 км. Время в пути и варианты трансфера.$$,

  title_pl   = $$Czy Alanya ma lotnisko? Gazipaşa kontra Antalya (AYT)$$,
  excerpt_pl = $$Alanya ma małe lotnisko Gazipaşa (GZP), ale niemal wszystkie loty wakacyjne lądują w Antalyi (AYT), 130 km dalej. Czasy przejazdu i opcje transferu.$$
WHERE slug = 'alanya-airport-transfer';


-- ===========================================================================
-- J. Antalya Airport → LARA BEACH — 15 km, 18 min
--    German query "wie weit ist lara von antalya entfernt" ranks at 8.3.
-- ===========================================================================
UPDATE blog_posts SET
  title_de   = $$Wie weit ist Lara von Antalya entfernt? 15 km, 20 Minuten$$,
  excerpt_de = $$Von Flughafen Antalya nach Lara Beach sind es nur 15 km, etwa 20 Minuten — die kürzeste Transferstrecke der Region. Preise, Hotels und Buchung online.$$,

  title_tr   = $$Antalya Havalimanı Lara Arası Kaç Km? 15 km, 20 Dakika$$,
  excerpt_tr = $$Antalya Havalimanı ile Lara Beach arası sadece 15 km, yaklaşık 18 dakika — bölgenin en kısa transferi. Lara otelleri, fiyatlar ve online rezervasyon.$$,

  title_pl   = $$Lara Beach – odległość od lotniska Antalya: 15 km, 20 minut$$,
  excerpt_pl = $$Z lotniska Antalya do Lara Beach jest tylko 15 km, około 20 minut — najkrótszy transfer w regionie. Hotele w Lara, ceny i rezerwacja online.$$,

  title_en   = $$Antalya Airport to Lara Beach: 15 km, Just 20 Minutes$$,
  excerpt_en = $$Antalya Airport to Lara Beach is only 15 km, about 20 minutes — the shortest transfer in the region. Lara hotels, fixed prices and instant online booking.$$,

  title_ru   = $$Аэропорт Анталии – Лара Бич: 15 км, всего 20 минут$$,
  excerpt_ru = $$От аэропорта Анталии до Лара Бич всего 15 км, около 20 минут — самый короткий трансфер в регионе. Отели Лары, фиксированные цены и онлайн-бронирование.$$
WHERE slug = 'antalya-havalimani-lara-beach-transfer';


-- Verify the rewrite landed:
-- SELECT slug, title_pl, title_ru, title_de FROM blog_posts
--  WHERE slug IN ('antalya-kemer-transfer-mesafe-sure','antalya-side-transfer-mesafe-sure',
--                 'antalya-belek-transfer-mesafe-sure','antalya-havalimani-alanya-transfer-kac-saat',
--                 'antalya-alanya-transfer-suresi','antalya-havalimani-side-transfer',
--                 'antalya-havalimani-belek-transfer','uber-antalya-havalimani-ulasim',
--                 'alanya-airport-transfer','antalya-havalimani-lara-beach-transfer');
