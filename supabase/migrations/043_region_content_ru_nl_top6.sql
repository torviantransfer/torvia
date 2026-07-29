-- 043: Finish the top 6 regions in the two languages migration 036 skipped
--
-- WHY
--
-- A region page is ~90% identical across all 24 regions: the FAQ, "Why
-- TORVIAN", "How to book" and comparison blocks all come from
-- src/messages/*.json with only {name} interpolated. The ONE block that makes
-- a region page unique is `description_<locale>` from the database.
--
-- Migration 036 wrote proper 700+ character descriptions for six regions —
-- but only in EN/TR/DE/PL. Russian was skipped entirely and Dutch did not
-- exist yet. Those pages therefore fall back to the 120-character template
-- from migration 002, which reads the same on every region, so Google sees
-- near-duplicates and indexes almost none of them.
--
-- This migration closes that gap: Alanya, Belek, Side, Kemer and Kundu-Lara
-- now have real, distinct copy in all six languages.
--
-- KEYWORD SOURCES (Google Trends 12-month export + this site's Search Console)
--   RU  "трансфер аэропорт анталия алания", "расстояние от аэропорта
--       анталии до кемера", "индивидуальный трансфер", "частный трансфер"
--   NL  Trends NL shows Dutch users type ENGLISH for commercial intent
--       ("antalya airport transfer" 100, "antalya private transfer" 24, +110%)
--       and Dutch for questions ("afstand", "hoe lang duurt"). Copy below
--       therefore carries both: the English product phrase as a proper noun
--       plus natural Dutch around it.
--
-- Safe to re-run.

-- ===== ALANYA — 130 km, ~2 h =====
UPDATE regions SET
  description_ru = 'Алания — оживлённый курортный город на востоке Турецкой Ривьеры, примерно в 130 км от аэропорта Анталии (AYT); дорога на частном трансфере занимает около 2 часов. Собственного действующего аэропорта у Алании нет, поэтому практически все туристы прилетают именно в Анталию, и трансфер аэропорт Анталия — Алания становится ключевым этапом поездки. Город известен крепостью Алании над морем, пляжем Клеопатры, Красной башней и пещерой Дамлаташ. TORVIAN выполняет индивидуальный трансфер из аэропорта Анталии в любой отель Алании: фиксированная цена за автомобиль, встреча с табличкой, отслеживание рейса, круглосуточно и без пересадок.',
  description_nl = 'Alanya is een levendige badplaats aan de oostkant van de Turkse Rivièra, ongeveer 130 km van de luchthaven Antalya (AYT) — circa 2 uur met een privétransfer. Alanya heeft geen bruikbare eigen luchthaven, dus vrijwel iedere vakantieganger landt op Antalya Airport en heeft daarna een transfer nodig; het is de drukst gereden route van de kust. De stad is bekend om de burcht van Alanya, Cleopatra Beach, de Rode Toren en de Damlataş-grot. TORVIAN verzorgt een Antalya Airport transfer rechtstreeks naar uw hotel in Alanya: vaste prijs per voertuig, ontvangst met naambord, vluchtmonitoring, 24 uur per dag en zonder tussenstops.'
WHERE slug = 'alanya';

-- ===== BELEK — 35 km, ~30 min =====
UPDATE regions SET
  description_ru = 'Белек — главный гольф- и люкс-курорт Турции, всего в 35 км к востоку от аэропорта Анталии (AYT), около 35 минут на частном трансфере. Это одна из самых коротких и предсказуемых трансферных линий побережья. В Белеке более 20 полей для гольфа чемпионского уровня и наибольшая в стране концентрация пятизвёздочных отелей — Cornelia, Ela Quality, Regnum Carya, Gloria, Titanic Deluxe. TORVIAN выполняет прямой трансфер из аэропорта Анталии в Белек и Кадрие: индивидуальный VIP-автомобиль, фиксированная цена, место для гольф-сумок, встреча с табличкой и круглосуточная подача.',
  description_nl = 'Belek is de golf- en luxebestemming van Turkije en ligt slechts 35 km ten oosten van de luchthaven Antalya (AYT) — ongeveer 35 minuten met een privétransfer. Daarmee is dit een van de kortste en meest voorspelbare Antalya Airport transfers van de kust. Belek telt meer dan 20 championship-golfbanen en de hoogste concentratie vijfsterrenhotels van het land, waaronder Cornelia, Ela Quality, Regnum Carya, Gloria en Titanic Deluxe. TORVIAN rijdt rechtstreeks naar uw hotel of golfresort in Belek, Kadriye en Boğazkent: vaste prijs per voertuig, ruimte voor golftassen, ontvangst met naambord, 24/7.'
WHERE slug = 'belek';

-- ===== SIDE — 70 km, ~55 min =====
UPDATE regions SET
  description_ru = 'Сиде расположен в 70 км к востоку от аэропорта Анталии (AYT) — около 60 минут на частном трансфере. Античный город с храмом Аполлона на берегу моря, римским амфитеатром и старой гаванью соседствует с современными курортными посёлками Эвренсеки, Чолаклы, Кызылагач, Титреенгёль и Манавгат. Исторический центр Сиде частично закрыт для автомобилей: водитель TORVIAN подвезёт вас к ближайшей разрешённой точке и поможет с багажом. Мы выполняем индивидуальный трансфер аэропорт Анталия — Сиде: фиксированная цена за машину, отслеживание рейса, круглосуточно.',
  description_nl = 'Side ligt 70 km ten oosten van de luchthaven Antalya (AYT) — ongeveer 60 minuten met een privétransfer. De antieke stad met de Apollotempel aan zee, het Romeinse amfitheater en de oude haven grenst aan moderne badplaatsen als Evrenseki, Çolaklı, Kızılağaç, Titreyengöl en Manavgat. Het historische centrum van Side is deels autovrij; uw chauffeur zet u af op het dichtstbijzijnde toegestane punt en helpt met de bagage. TORVIAN verzorgt de Antalya Airport transfer naar elk hotel in de regio Side: vaste prijs per voertuig, vluchtmonitoring en gratis annuleren tot 24 uur vooraf.'
WHERE slug = 'side';

-- ===== KEMER — 55 km, ~45 min =====
UPDATE regions SET
  description_ru = 'Кемер находится в 55 км от аэропорта Анталии (AYT), дорога занимает около 50 минут: сначала через город, затем по живописному прибрежному шоссе вдоль отрогов Тавра. Курорт зажат между горами и морем и включает посёлки Бельдиби, Гёйнюк, Чамьюва, Кириш и Текирова; рядом находятся античный Фаселис и Олимпос. Последний участок дороги извилистый, поэтому мы рекомендуем индивидуальный трансфер вместо группового автобуса с остановками. TORVIAN подаёт Mercedes Vito прямо к выходу из аэропорта: расстояние и время известны заранее, цена фиксирована, работаем круглосуточно.',
  description_nl = 'Kemer ligt 55 km van de luchthaven Antalya (AYT); de rit duurt ongeveer 50 minuten, eerst dwars door Antalya en daarna over de spectaculaire kustweg langs de uitlopers van het Taurusgebergte. Het resortgebied ligt ingeklemd tussen bergen en zee en omvat Beldibi, Göynük, Çamyuva, Kiriş en Tekirova, met de antieke sites Phaselis en Olympos vlakbij. Het laatste deel van de route kent veel bochten, dus een privétransfer is comfortabeler dan een gedeelde bus met tussenstops. TORVIAN rijdt u met een Mercedes Vito rechtstreeks naar uw hotel: vaste prijs, vluchtmonitoring, 24/7.'
WHERE slug = 'kemer';

-- ===== KUNDU-LARA — 15 km, ~15-18 min =====
--
-- NOTE: migration 010 set the separate `kundu` and `lara` rows to
-- is_active = false and merged them into `kundu-lara`. Migration 036 wrote
-- its Kundu and Lara descriptions to those dead rows, so that copy has never
-- been rendered anywhere. This block writes the combined area description to
-- the row that is actually live.
UPDATE regions SET
  description_ru = 'Кунду и Лара — ближайшие к аэропорту Анталии курортные районы: 15 км и всего 20 минут в пути, самый короткий трансфер на всём побережье. Здесь сосредоточены крупные тематические отели формата «всё включено» с собственными пляжами и аквапарками, а рядом тянется длинная песчаная полоса пляжа Лара; до исторического центра Калеичи — около четверти часа. Короткое расстояние особенно удобно при ночных прилётах и поездках с маленькими детьми. TORVIAN выполняет частный трансфер аэропорт Анталия — Кунду и Лара: фиксированная цена за автомобиль, а не за человека, встреча с табличкой в зале прилёта, детские кресла по запросу, отслеживание рейса, круглосуточно и без ночной наценки.',
  description_nl = 'Kundu en Lara zijn de dichtstbijzijnde resortgebieden bij de luchthaven Antalya: 15 km en slechts 20 minuten rijden — de kortste Antalya Airport transfer van de hele kust. Hier staan de grote all-inclusive themahotels met eigen strand en waterpark, en ligt het lange zandstrand van Lara Beach; het historische centrum Kaleiçi bereikt u in een kwartier. De korte rit is een uitkomst bij nachtelijke aankomsten en bij reizen met jonge kinderen. TORVIAN rijdt met een privé VIP-voertuig rechtstreeks van de terminal naar uw hotel: vaste prijs per voertuig in plaats van per persoon, ontvangst met naambord, kinderzitjes op aanvraag, vluchtmonitoring en 24/7 beschikbaarheid zonder nachttoeslag.'
WHERE slug = 'kundu-lara';

-- ===== KUNDU-LARA — the other four languages =====
--
-- Migration 036 wrote its EN/TR/DE/PL copy for this area to the dead `kundu`
-- and `lara` rows, so the live `kundu-lara` page still shows the 120-character
-- template from migration 002 in every language. This restores all four.
--
-- German keyword note: Trends DE ranks "hotel transfer antalya" at 69 and
-- "transfer antalya flughafen" at 100 — both are worked into the copy below.
UPDATE regions SET
  description_en = 'Kundu and Lara are the closest resort areas to Antalya Airport (AYT): 15 km and just 20 minutes away, the shortest airport transfer on the whole Turkish Riviera. The area is built around large all-inclusive themed hotels with private beaches and water parks, backed by the long sandy stretch of Lara Beach, while the historic Kaleiçi old town is about fifteen minutes further on. The short distance makes it the easiest choice for late-night arrivals and for families travelling with small children. TORVIAN runs a private Antalya airport transfer straight from the terminal to your hotel door: fixed price per vehicle rather than per person, meet and greet with a name board, child seats on request, live flight tracking, 24/7 with no night surcharge.',
  description_tr = 'Kundu ve Lara, Antalya Havalimanı''na (AYT) en yakın tatil bölgeleridir: 15 km ve yalnızca 20 dakika mesafede, tüm Türk Rivierası''nın en kısa havalimanı transferi. Bölge, özel plajları ve aquapark''ları olan büyük her şey dahil temalı otellerin etrafında şekillenmiştir; arkasında Lara Plajı''nın uzun kumsalı, on beş dakika ötesinde ise tarihi Kaleiçi bulunur. Kısa mesafe, gece inen uçuşlar ve küçük çocuklu aileler için bu bölgeyi en pratik seçenek yapar. TORVIAN, terminalden otelinizin kapısına doğrudan özel Antalya havalimanı transferi sunar: kişi başı değil araç başına sabit fiyat, isim tabelasıyla karşılama, talep üzerine çocuk koltuğu, canlı uçuş takibi, 7/24 ve gece zammı olmadan.',
  description_de = 'Hotel Transfer Antalya nach Kundu und Lara: die flughafennächsten Ferienregionen, nur 15 km und 20 Minuten vom Flughafen Antalya (AYT) entfernt — die kürzeste Transferstrecke der Türkischen Riviera. Die Gegend ist geprägt von grossen All-inclusive-Themenhotels mit eigenem Strand und Aquapark, dahinter erstreckt sich der lange Sandstrand von Lara Beach; die Altstadt Kaleiçi liegt rund fünfzehn Minuten weiter. Die kurze Strecke ist ideal bei nächtlicher Ankunft und für Familien mit kleinen Kindern. TORVIAN bietet Privattransfer Antalya Flughafen direkt bis zur Hoteltür: VIP Transfer Antalya zum Festpreis pro Fahrzeug statt pro Person, Abholung mit Namensschild, Kindersitze auf Anfrage, Flugverfolgung, 24/7 ohne Nachtzuschlag.',
  description_pl = 'Kundu i Lara to najbliższe lotnisku regiony wypoczynkowe: 15 km i zaledwie 20 minut od lotniska Antalya (AYT) — najkrótszy transfer z lotniska na całej Riwierze Tureckiej. Okolica opiera się na dużych hotelach all inclusive z prywatnymi plażami i aquaparkami, za nimi ciągnie się długa piaszczysta plaża Lara, a historyczne stare miasto Kaleiçi leży około piętnastu minut dalej. Krótki dojazd sprawia, że jest to najwygodniejszy wybór przy nocnych przylotach i dla rodzin z małymi dziećmi. TORVIAN oferuje prywatny transfer z lotniska Antalya prosto pod drzwi hotelu: stała cena za pojazd, a nie za osobę, powitanie z tabliczką, foteliki dziecięce na życzenie, monitoring lotu, 24/7 bez dopłaty nocnej.'
WHERE slug = 'kundu-lara';

-- Coverage check — should now show 6 languages filled for these six regions:
-- SELECT slug,
--        (description_en IS NOT NULL) AS en, (description_tr IS NOT NULL) AS tr,
--        (description_de IS NOT NULL) AS de, (description_pl IS NOT NULL) AS pl,
--        (description_ru IS NOT NULL) AS ru, (description_nl IS NOT NULL) AS nl
--   FROM regions WHERE slug IN ('alanya','belek','side','kemer','kundu-lara');
