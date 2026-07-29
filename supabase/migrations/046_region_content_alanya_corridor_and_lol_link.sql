-- 046: Unique region copy — Alanya corridor + Land of Legends internal link
--
-- Fourth batch of the region programme (see 043, 044, 045). Covers the four
-- Alanya-strip resorts still on the 120-char seed text:
--
--   okurcalar  100 km / 80 min   Side–Alanya midpoint, all-inclusive
--   turkler    110 km / 85 min   İncekum coast, family-focused
--   mahmutlar  140 km / 130 min  East of Alanya, long-stay / Russian community
--   kargicak   145 km / 135 min  Beyond Mahmutlar, boutique / villa
--
-- Distances come from supabase/seed.sql — the live regions data. Migration
-- 010's DELETE left seed.sql as the single source of truth for km/min, so
-- copy that contradicts seed.sql will show up as a distance mismatch on the
-- rendered page (region cards read from the same row).
--
-- For de/pl/ru/nl these description_<locale> columns also control
-- indexability: the region page marks itself noindex unless
-- description_<locale> or meta_title_<locale> is filled
-- (getTranslatedLocales in src/app/[locale]/[region]/page.tsx, mirrored by
-- src/app/sitemap.ts).
--
-- Russian gets extra weight on Mahmutlar/Kargıcak — GSC shows a live cluster
-- of Russian-language searches for east-of-Alanya destinations, and the
-- Russian expat community around Mahmutlar means "трансфер Махмутлар" and
-- variants convert as commercial intent rather than tourist curiosity.
--
-- Second half of this file (Land of Legends): the blog post
-- `land-of-legends-transfer-rehberi` ranks position ~10 with ~1,800 impressions
-- while the /land-of-legends-transfer sales page sits at position 39 with 0
-- clicks (GSC, last 90 days). The blog is currently swallowing all of the
-- keyword's link equity because its CTA reads "use the booking form" — no
-- anchor to the sales page. Adding a strong contextual link inside the blog
-- content passes signal from the winning URL to the URL we want to convert on.
--
-- Safe to re-run.


-- ===== OKURCALAR — 100 km, 80 min =====
UPDATE regions SET
  description_en = 'Okurcalar sits 100 km from Antalya Airport (AYT), around 1 hour 20 minutes by private transfer, roughly halfway between Side and Alanya. It is a purpose-built resort strip: a straight line of large all-inclusive hotels facing a long, gently shelving sand-and-pebble beach, with no old town and no through traffic. That layout is exactly the appeal for families with young children — the hotels open directly onto the beach, and the resorts run their own animation, pools and evening entertainment, so guests rarely need to leave the grounds. Local minibuses (dolmuş) reach Alanya and Manavgat, but they are slow and stop at every hotel entrance; a private transfer is the only way to get from a late-arriving flight straight to your resort door. TORVIAN: private airport transfer, fixed price per vehicle, name-board welcome, live flight tracking, 24/7 with no night surcharge.',
  description_tr = 'Okurcalar, Antalya Havalimanı''na (AYT) 100 km uzaklıkta, özel transferle yaklaşık 1 saat 20 dakika mesafededir; Side ile Alanya arasında yer alır. Sonradan planlanmış bir tatil şerididir: uzun ve tatlı eğimli kum-çakıl karışımı bir plaja bakan büyük her şey dahil otellerin dümdüz sıralandığı, eski kenti ve transit trafiği olmayan bir bölge. Bu düzen özellikle küçük çocuklu aileler için idealdir — oteller doğrudan plaja açılır, kendi animasyonunu, havuzlarını ve akşam programını yürütür, konuklar tesis dışına çıkma ihtiyacı duymaz. Yerel dolmuşlar Alanya ve Manavgat''a ulaşır ama yavaştır ve her otel girişinde durur; geç saatli bir uçuşun ardından doğrudan otel kapısına ulaşmanın tek yolu özel transferdir. TORVIAN: özel havalimanı transferi, araç başına sabit fiyat, isim tabelasıyla karşılama, canlı uçuş takibi, 7/24 ve gece zammı yok.',
  description_de = 'Okurcalar liegt 100 km vom Flughafen Antalya (AYT) entfernt, etwa 1 Stunde 20 Minuten mit dem Privattransfer, ungefähr auf halbem Weg zwischen Side und Alanya. Ein geplanter Ferienstreifen: eine gerade Reihe grosser All-inclusive-Hotels an einem langen, flach abfallenden Sand-Kies-Strand, ohne Altstadt und ohne Durchgangsverkehr. Genau das ist der Reiz für Familien mit kleinen Kindern — die Hotels öffnen sich direkt zum Strand, führen eigene Animation, Pools und Abendprogramme, sodass Gäste die Anlage kaum verlassen müssen. Dolmuş-Kleinbusse fahren nach Alanya und Manavgat, sind aber langsam und halten an jedem Hoteleingang; nach einer späten Landung ist der Privattransfer der einzige direkte Weg zur Hoteltür. TORVIAN: Hotel Transfer Antalya nach Okurcalar, Festpreis pro Fahrzeug, Namensschild, Flugverfolgung, 24/7 ohne Nachtzuschlag.',
  description_pl = 'Okurcalar leży 100 km od lotniska Antalya (AYT), około 1 godziny 20 minut prywatnym transferem, mniej więcej w połowie drogi między Side a Alanyą. To zaplanowany pas kurortów: prosta linia dużych hoteli all inclusive nad długą, łagodnie opadającą plażą z piasku i drobnych kamieni, bez starego miasta i bez ruchu tranzytowego. Właśnie taki układ jest atutem dla rodzin z małymi dziećmi — hotele wychodzą prosto na plażę, prowadzą własne animacje, baseny i wieczorne pokazy, więc goście rzadko muszą opuszczać teren. Lokalne dolmusze jeżdżą do Alanyi i Manavgatu, ale są wolne i zatrzymują się przy każdym hotelu; po późnym locie prywatny transfer to jedyny sposób, by dojechać wprost pod drzwi. TORVIAN: prywatny transfer z lotniska, stała cena za pojazd, powitanie z tabliczką, monitoring lotu, 24/7 bez dopłaty nocnej.',
  description_ru = 'Окурджалар находится в 100 км от аэропорта Анталии (AYT), около 1 часа 20 минут на частном трансфере, примерно на полпути между Сиде и Аланьей. Это спроектированная курортная полоса: прямая линия крупных отелей «всё включено» вдоль длинного песчано-галечного пляжа с пологим входом в воду, без старого города и без транзитного движения. Именно такая планировка и привлекает семьи с маленькими детьми — отели выходят прямо на пляж, у каждого своя анимация, бассейны и вечерние шоу, гостям почти не нужно покидать территорию. Долмуши ходят до Аланьи и Манавгата, но идут медленно и останавливаются у каждого отеля; после позднего рейса единственный способ доехать сразу до дверей отеля — частный трансфер. TORVIAN: частный трансфер из аэропорта, фиксированная цена за автомобиль, встреча с табличкой, отслеживание рейса, круглосуточно без ночной наценки.',
  description_nl = 'Okurcalar ligt 100 km van de luchthaven Antalya (AYT), ongeveer 1 uur 20 minuten met een privétransfer, halverwege Side en Alanya. Het is een geplande resortstrook: een rechte lijn van grote all-inclusive hotels langs een lang, glooiend afloopend zand- en kiezelstrand, zonder oude stad en zonder doorgaand verkeer. Precies die opzet is de aantrekkingskracht voor gezinnen met kleine kinderen — de hotels komen direct op het strand uit, verzorgen hun eigen animatie, zwembaden en avondprogramma, en gasten hoeven het terrein bijna niet af. Dolmuş-busjes rijden naar Alanya en Manavgat, maar zijn traag en stoppen bij elke hotelingang; na een late landing is een privétransfer de enige manier om rechtstreeks voor de deur te komen. TORVIAN: Antalya Airport transfer naar Okurcalar, vaste prijs per voertuig, ontvangst met naambord, vluchtmonitoring, 24/7 zonder nachttoeslag.'
WHERE slug = 'okurcalar';


-- ===== TÜRKLER — 110 km, 85 min =====
UPDATE regions SET
  description_en = 'Türkler is a small resort on the İncekum coast, 110 km from Antalya Airport (AYT) and about 1 hour 25 minutes away by private transfer, sitting between Okurcalar and Avsallar just west of Alanya. The area takes its name from İncekum — "fine sand" — and the beach lives up to it: a shallow, gently sloping stretch of soft sand backed by pine forest, one of the calmest bathing bays on this coast, which is why the hotels here lean heavily toward families and older couples rather than the party crowd further east. The village itself is quiet, with a handful of shops and cafés and a promenade for evening walks, and Alanya centre is a 20-minute drive when you want more. TORVIAN: private airport transfer, fixed price per vehicle, meet and greet, flight tracking, 24/7.',
  description_tr = 'Türkler, İncekum sahilinde küçük bir tatil beldesidir; Antalya Havalimanı''na (AYT) 110 km uzaklıkta ve özel transferle yaklaşık 1 saat 25 dakika mesafededir; Alanya''nın hemen batısında Okurcalar ile Avsallar arasında yer alır. Bölge adını İncekum''dan alır — adı gibidir: çam ormanının arkasında uzayan, sığ ve tatlı eğimli, yumuşak kumlu bir kıyı; bu sahilin en sakin banyo koylarından biridir. Bu yüzden buradaki oteller doğudaki eğlence odaklı bölgelerden çok aileler ve orta yaş üstü çiftler için kurulmuştur. Beldenin kendisi sakindir; birkaç dükkân, kafe ve akşam yürüyüşü için bir sahil yolu vardır; daha fazlasını istediğinizde Alanya merkezi 20 dakika sürüş mesafesindedir. TORVIAN: özel havalimanı transferi, araç başına sabit fiyat, karşılama, uçuş takibi, 7/24.',
  description_de = 'Türkler ist ein kleiner Ferienort an der İncekum-Küste, 110 km vom Flughafen Antalya (AYT) entfernt und in etwa 1 Stunde 25 Minuten mit dem Privattransfer erreichbar, zwischen Okurcalar und Avsallar westlich von Alanya. Die Region ist nach İncekum — "feinem Sand" — benannt, und der Strand hält, was der Name verspricht: ein flach abfallender, weicher Sandstreifen vor Kiefernwald, eine der ruhigsten Badebuchten dieser Küste. Deshalb richten sich die Hotels hier deutlich stärker an Familien und ältere Paare als an das Partypublikum weiter östlich. Das Dorf selbst ist ruhig, mit einer Handvoll Läden und Cafés und einer Promenade für den Abendspaziergang; das Zentrum von Alanya ist 20 Fahrminuten entfernt, wenn Sie mehr wollen. TORVIAN: Privattransfer Flughafen Antalya, Festpreis, Flugverfolgung, 24/7.',
  description_pl = 'Türkler to niewielki kurort na wybrzeżu İncekum, 110 km od lotniska Antalya (AYT) i około 1 godziny 25 minut prywatnym transferem, między Okurcalar a Avsallar tuż na zachód od Alanyi. Nazwa okolicy pochodzi od İncekum — "drobny piasek" — i plaża w pełni to potwierdza: płytki, łagodnie opadający pas miękkiego piasku za sosnowym lasem, jedna z najspokojniejszych zatok kąpielowych na tym wybrzeżu. Dlatego hotele nastawiają się tu wyraźnie na rodziny i pary w średnim wieku, a nie na klientelę imprezową dalej na wschód. Sama miejscowość jest cicha — kilka sklepów, kawiarni i promenada na wieczorny spacer; centrum Alanyi jest 20 minut jazdy, kiedy chcecie więcej. TORVIAN: prywatny transfer z lotniska Antalya, stała cena, powitanie, monitoring lotu, 24/7.',
  description_ru = 'Тюрклер — небольшой курорт на побережье Инджекум, в 110 км от аэропорта Анталии (AYT), около 1 часа 25 минут на частном трансфере, между Окурджаларом и Авсалларом, чуть западнее Аланьи. Название района произошло от Инджекум — «мелкий песок», и пляж полностью соответствует названию: мелководная полоса мягкого песка с пологим входом, за которой начинается сосновый лес; это одна из самых спокойных купальных бухт побережья. Именно поэтому местные отели ориентированы прежде всего на семьи и пары постарше, а не на туситусовку, которая гуляет восточнее. Сам посёлок тихий — несколько магазинов и кафе, набережная для вечерней прогулки; до центра Аланьи 20 минут езды, когда захочется движения. TORVIAN: частный трансфер из аэропорта, фиксированная цена, встреча с табличкой, отслеживание рейса, круглосуточно.',
  description_nl = 'Türkler is een kleine badplaats aan de İncekum-kust, 110 km van de luchthaven Antalya (AYT) en ongeveer 1 uur 25 minuten met een privétransfer, tussen Okurcalar en Avsallar net ten westen van Alanya. De streek dankt haar naam aan İncekum — "fijn zand" — en het strand doet die naam eer aan: een ondiepe, glooiend afloopende strook zacht zand voor een dennenbos, een van de rustigste badbaaien van deze kust. Daarom richten de hotels zich hier duidelijk op gezinnen en oudere stellen en niet op het uitgaanspubliek verder oostwaarts. Het dorp zelf is rustig — een handjevol winkels en cafés en een boulevard voor de avondwandeling; het centrum van Alanya ligt op 20 minuten rijden als u meer wilt. TORVIAN: privétransfer vanaf de luchthaven, vaste prijs, ontvangst met naambord, vluchtmonitoring, 24/7.'
WHERE slug = 'turkler';


-- ===== MAHMUTLAR — 140 km, 2 h 10 min =====
UPDATE regions SET
  description_en = 'Mahmutlar sits 140 km from Antalya Airport (AYT), about 2 hours 10 minutes by private transfer, on the coast a few kilometres east of Alanya. Unlike the resort strips further west, Mahmutlar reads as a small town — a working seafront with year-round shops, a Saturday market, a long pebble-and-sand beach and a large Russian-speaking community that has settled here permanently. Guests tend to be either longer-stay tourists in private apartments rather than package hotels, or visitors coming to see friends and family who already live in the town; both mean the transfer needs to reach a specific residential address, not just a hotel gate, and our drivers plan for the additional urban navigation. TORVIAN: private airport transfer, fixed price per vehicle, flight tracking, 24/7 with no night surcharge.',
  description_tr = 'Mahmutlar, Antalya Havalimanı''na (AYT) 140 km uzaklıkta, özel transferle yaklaşık 2 saat 10 dakika mesafededir; Alanya''nın birkaç kilometre doğusunda, sahil şeridinde yer alır. Batıdaki tatil şeritlerinin aksine Mahmutlar küçük bir kasaba gibi okunur — yıl boyu açık dükkânları, cumartesi pazarı, uzun çakıl-kum plajı ve buraya kalıcı yerleşmiş büyük bir Rusça konuşan topluluğu olan çalışan bir sahil. Konuklar genellikle paket otel yerine özel apartman dairelerinde daha uzun süre kalan turistler ya da kasabada yaşayan arkadaş ve akrabalarını ziyarete gelen kişilerdir; her ikisi de transferin sadece bir otel kapısına değil, belirli bir konut adresine ulaşması gerektiği anlamına gelir; şoförlerimiz de ek kentsel yönlendirmeyi hesaba katar. TORVIAN: özel havalimanı transferi, araç başına sabit fiyat, uçuş takibi, 7/24 ve gece zammı yok.',
  description_de = 'Mahmutlar liegt 140 km vom Flughafen Antalya (AYT) entfernt, etwa 2 Stunden 10 Minuten mit dem Privattransfer, einige Kilometer östlich von Alanya an der Küste. Anders als die Ferienstreifen weiter westlich wirkt Mahmutlar wie eine kleine Stadt — eine ganzjährig belebte Uferstrasse mit Läden, Samstagsmarkt, langem Kies-Sand-Strand und einer grossen russischsprachigen Gemeinde, die sich hier dauerhaft niedergelassen hat. Gäste sind meist Langzeitreisende in Privatwohnungen statt in Pauschalhotels oder Besucher, die Freunde und Familie im Ort besuchen; in beiden Fällen muss der Transfer eine konkrete Wohnadresse erreichen und nicht nur ein Hoteltor, was unsere Fahrer bei der Stadtnavigation einplanen. TORVIAN: Privattransfer Antalya Flughafen, Festpreis, Flugverfolgung, 24/7 ohne Nachtzuschlag.',
  description_pl = 'Mahmutlar leży 140 km od lotniska Antalya (AYT), około 2 godzin 10 minut prywatnym transferem, kilka kilometrów na wschód od Alanyi wzdłuż wybrzeża. W odróżnieniu od kurortów na zachodzie Mahmutlar sprawia wrażenie małego miasteczka — nadmorska ulica z całorocznymi sklepami, sobotni bazar, długa plaża z drobnych kamieni i piasku oraz duża rosyjskojęzyczna społeczność osiadła tu na stałe. Goście to zwykle turyści zatrzymujący się na dłużej w prywatnych apartamentach, a nie w hotelach pakietowych, albo odwiedzający znajomych i rodzinę mieszkającą w miasteczku; w obu przypadkach transfer musi dojechać pod konkretny adres mieszkalny, a nie tylko pod bramę hotelu — nasi kierowcy uwzględniają dodatkową nawigację miejską. TORVIAN: prywatny transfer z lotniska, stała cena, monitoring lotu, 24/7 bez dopłaty nocnej.',
  description_ru = 'Махмутлар находится в 140 км от аэропорта Анталии (AYT), около 2 часов 10 минут на частном трансфере, в нескольких километрах восточнее Аланьи по побережью. В отличие от курортных полос западнее Махмутлар воспринимается как небольшой город — круглогодично работающая набережная с магазинами, субботним рынком, длинным галечно-песчаным пляжем и большой русскоязычной общиной, которая осела здесь на постоянной основе. Гости обычно либо длительно живут в частных апартаментах, а не в пакетных отелях, либо приезжают навестить друзей и родственников, уже живущих в городе; в обоих случаях трансфер должен подъехать к конкретному жилому адресу, а не просто к отельным воротам, и водители заранее закладывают дополнительное городское маневрирование. TORVIAN: частный трансфер из аэропорта, фиксированная цена за автомобиль, отслеживание рейса, круглосуточно и без ночной наценки.',
  description_nl = 'Mahmutlar ligt 140 km van de luchthaven Antalya (AYT), ongeveer 2 uur 10 minuten met een privétransfer, enkele kilometers ten oosten van Alanya aan de kust. Anders dan de resortstroken verderop westelijk voelt Mahmutlar aan als een klein stadje — een jaarrond levendige boulevard met winkels, een zaterdagmarkt, een lang kiezel- en zandstrand en een grote Russischtalige gemeenschap die zich hier permanent gevestigd heeft. Gasten zijn meestal langverblijvende toeristen in privéappartementen in plaats van pakketreishotels, of mensen die vrienden en familie bezoeken die al in het stadje wonen; in beide gevallen moet de transfer een concreet woonadres bereiken en niet alleen een hotelpoort — onze chauffeurs houden rekening met die extra stadsnavigatie. TORVIAN: privétransfer vanaf de luchthaven, vaste prijs, vluchtmonitoring, 24/7 zonder nachttoeslag.'
WHERE slug = 'mahmutlar';


-- ===== KARGICAK — 145 km, 2 h 15 min =====
UPDATE regions SET
  description_en = 'Kargıcak lies 145 km from Antalya Airport (AYT), about 2 hours 15 minutes by private transfer, on the coast just past Mahmutlar and roughly 15 km east of Alanya centre. It is where the resort strip finally thins out: the accommodation here is dominated by holiday villas, boutique hotels and residential complexes climbing the hillside above a mostly empty pebble beach, with citrus and banana groves running down to the road. Guests come for the space and the view rather than the nightlife — the Taurus mountains rise straight behind the village, and Alanya centre with its castle, harbour and restaurants is a 20-minute drive when you want the town. Public buses run infrequently along this stretch, so for late arrivals a private transfer with the exact villa or hotel address is the reliable option. TORVIAN: private airport transfer, fixed price, meet and greet, flight tracking, 24/7.',
  description_tr = 'Kargıcak, Antalya Havalimanı''na (AYT) 145 km uzaklıkta, özel transferle yaklaşık 2 saat 15 dakika mesafede, Mahmutlar''ın hemen ötesinde ve Alanya merkezinin yaklaşık 15 km doğusunda, sahil şeridinde yer alır. Tatil şeridinin nihayet inceldiği yerdir: konaklama, ıssıza yakın çakıl bir plajın üzerinde yamaca tırmanan tatil villaları, butik oteller ve rezidans siteleri ağırlıklıdır; narenciye ve muz bahçeleri yola kadar iner. Buraya gelenler gece hayatı için değil, alan ve manzara için gelir — Toros Dağları köyün hemen arkasında yükselir, Alanya merkezi, kalesi, limanı ve lokantalarıyla kasabayı istediğinizde 20 dakika sürüş mesafesindedir. Bu şerit boyunca yerel otobüsler seyrektir; geç varışlarda kesin villa veya otel adresiyle özel transfer, güvenilir tek seçenektir. TORVIAN: özel havalimanı transferi, sabit fiyat, karşılama, uçuş takibi, 7/24.',
  description_de = 'Kargıcak liegt 145 km vom Flughafen Antalya (AYT) entfernt, etwa 2 Stunden 15 Minuten mit dem Privattransfer, direkt hinter Mahmutlar und rund 15 km östlich des Zentrums von Alanya an der Küste. Hier läuft der Ferienstreifen endlich aus: die Unterkünfte sind vor allem Ferienvillen, Boutique-Hotels und Wohnanlagen, die den Hang über einem meist leeren Kiesstrand hinaufklettern, Zitrus- und Bananenhaine reichen bis an die Strasse. Gäste kommen wegen des Platzes und der Aussicht, nicht wegen des Nachtlebens — der Taurus steigt direkt hinter dem Dorf auf, das Zentrum von Alanya mit Burg, Hafen und Restaurants ist 20 Fahrminuten entfernt, wenn Sie Stadt wollen. Öffentliche Busse fahren hier nur selten, daher ist für späte Ankünfte der Privattransfer mit exakter Villen- oder Hoteladresse die zuverlässige Wahl. TORVIAN: Privattransfer, Festpreis, Namensschild, Flugverfolgung, 24/7.',
  description_pl = 'Kargıcak leży 145 km od lotniska Antalya (AYT), około 2 godzin 15 minut prywatnym transferem, tuż za Mahmutlarem i mniej więcej 15 km na wschód od centrum Alanyi wzdłuż wybrzeża. To miejsce, w którym pas kurortów wreszcie się rozrzedza: dominują tu wille wypoczynkowe, butikowe hotele i osiedla mieszkaniowe wspinające się po zboczu nad w większości pustą kamienistą plażą, a gaje cytrusowe i bananowe schodzą aż do drogi. Goście przyjeżdżają dla przestrzeni i widoków, a nie dla życia nocnego — góry Taurus wyrastają tuż za wsią, centrum Alanyi z twierdzą, portem i restauracjami jest o 20 minut jazdy, gdy tęsknicie za miastem. Lokalne autobusy jeżdżą tu rzadko, więc przy późnych przylotach prywatny transfer z dokładnym adresem willi lub hotelu jest jedyną pewną opcją. TORVIAN: prywatny transfer z lotniska, stała cena, powitanie, monitoring lotu, 24/7.',
  description_ru = 'Каргыджак находится в 145 км от аэропорта Анталии (AYT), около 2 часов 15 минут на частном трансфере, сразу за Махмутларом и примерно в 15 км восточнее центра Аланьи по побережью. Здесь курортная полоса наконец редеет: жильё представлено в основном туристическими виллами, бутик-отелями и жилыми комплексами, поднимающимися по склону над почти пустым галечным пляжем, а цитрусовые и банановые сады спускаются до самой дороги. Сюда едут за пространством и видами, а не за ночной жизнью — Таврские горы поднимаются прямо за посёлком, а центр Аланьи с крепостью, гаванью и ресторанами в 20 минутах езды, когда хочется города. Городские автобусы ходят по этому участку редко, поэтому при поздних прилётах частный трансфер с точным адресом виллы или отеля — единственно надёжный вариант. TORVIAN: частный трансфер, фиксированная цена, встреча с табличкой, отслеживание рейса, круглосуточно.',
  description_nl = 'Kargıcak ligt 145 km van de luchthaven Antalya (AYT), ongeveer 2 uur 15 minuten met een privétransfer, net voorbij Mahmutlar en ongeveer 15 km ten oosten van het centrum van Alanya langs de kust. Hier dunt de resortstrook eindelijk uit: de accommodaties bestaan vooral uit vakantievilla''s, boetiekhotels en woonwijken die de helling opklauteren boven een grotendeels leeg kiezelstrand, met citrus- en bananenboomgaarden die tot aan de weg lopen. Gasten komen voor de ruimte en het uitzicht, niet voor het uitgaansleven — het Taurusgebergte rijst direct achter het dorp op, en het centrum van Alanya met zijn kasteel, haven en restaurants ligt op 20 minuten rijden als u de stad wilt opzoeken. Openbare bussen rijden hier onregelmatig, dus bij late aankomsten is een privétransfer met het exacte villa- of hoteladres de betrouwbare keuze. TORVIAN: privétransfer, vaste prijs, ontvangst met naambord, vluchtmonitoring, 24/7.'
WHERE slug = 'kargicak';


-- =============================================================================
-- Land of Legends: 301 the equity from the blog to the sales page
--
-- The blog post carries the SERP position (~10) and the impressions (~1,800),
-- the sales page carries the booking form. Search Console shows the sales
-- page at position 39 with 0 clicks — a link inversion problem, not a content
-- problem. Adding a contextual anchor from the blog's booking section to
-- /land-of-legends-transfer moves internal PageRank from the URL that already
-- ranks to the URL we actually want to convert on. Keeps existing content
-- intact; only rewrites the paragraph that used to say "use the booking form"
-- so the anchor text reads as a natural next step.
-- =============================================================================

UPDATE blog_posts SET
  content_tr = REPLACE(
    content_tr,
    'Antalya Havalimanı - Land of Legends transfer fiyatlarımız araç tipine göre değişmektedir. Ekonomi, VIP sedan ve minivan seçeneklerimiz mevcuttur. Güncel fiyatlar için hemen rezervasyon formunu kullanın ya da WhatsApp''tan ulaşın.',
    'Antalya Havalimanı → Land of Legends transfer fiyatlarımız araç tipine göre değişmektedir. Güncel fiyatı ve tüm dahil olan hizmetleri <a href="/tr/land-of-legends-transfer"><strong>Land of Legends transfer sayfamızda</strong></a> görebilir, aynı sayfadan sabit fiyatla online rezervasyon yapabilirsiniz.'
  ),
  content_en = REPLACE(
    content_en,
    'Our Antalya Airport to Land of Legends transfer prices vary by vehicle type. We offer Economy, VIP Sedan, and Minivan options. Use the booking form for current prices or contact us via WhatsApp.',
    'Our Antalya Airport to Land of Legends transfer prices vary by vehicle type. See the live price and everything that is included on our <a href="/en/land-of-legends-transfer"><strong>Land of Legends transfer page</strong></a>, and book online in the same place at a fixed rate.'
  ),
  content_de = REPLACE(
    content_de,
    'Mit TORVIAN Transfer profitieren Sie von Festpreisen, Flugverfolgung, klimatisierten Luxusfahrzeugen und 24/7 WhatsApp-Support. Kindersitze auf Anfrage erhältlich.',
    'Mit TORVIAN Transfer profitieren Sie von Festpreisen, Flugverfolgung, klimatisierten Luxusfahrzeugen und 24/7 WhatsApp-Support. Kindersitze auf Anfrage erhältlich. Den aktuellen Preis und alle enthaltenen Leistungen finden Sie auf unserer <a href="/de/land-of-legends-transfer"><strong>Land of Legends Transferseite</strong></a> und buchen dort direkt zum Festpreis.'
  ),
  content_pl = REPLACE(
    content_pl,
    'Z TORVIAN Transfer otrzymujesz stałe ceny, śledzenie lotu, klimatyzowane pojazdy luksusowe i wsparcie WhatsApp 24/7. Foteliki dziecięce dostępne na życzenie.',
    'Z TORVIAN Transfer otrzymujesz stałe ceny, śledzenie lotu, klimatyzowane pojazdy luksusowe i wsparcie WhatsApp 24/7. Foteliki dziecięce dostępne na życzenie. Aktualną cenę i pełną listę usług znajdziesz na naszej <a href="/pl/land-of-legends-transfer"><strong>stronie transferu do Land of Legends</strong></a> — tam też zarezerwujesz online w stałej cenie.'
  ),
  content_ru = REPLACE(
    content_ru,
    'С TORVIAN Transfer вы получаете фиксированные цены, отслеживание рейса, кондиционированные люксовые автомобили и круглосуточную поддержку в WhatsApp. Детские кресла доступны по запросу.',
    'С TORVIAN Transfer вы получаете фиксированные цены, отслеживание рейса, кондиционированные люксовые автомобили и круглосуточную поддержку в WhatsApp. Детские кресла доступны по запросу. Актуальную цену и всё, что входит в трансфер, смотрите на нашей <a href="/ru/land-of-legends-transfer"><strong>странице трансфера в Land of Legends</strong></a> — там же можно забронировать онлайн по фиксированной цене.'
  )
WHERE slug = 'land-of-legends-transfer-rehberi';

-- Dutch content for this post is not yet seeded (migration 041 covered a
-- different subset of blog posts). If a later migration adds content_nl for
-- Land of Legends, add the equivalent anchor line at that time — no work
-- required here in the meantime, since the sitemap already skips locales
-- with empty content.


-- Coverage check:
-- SELECT slug,
--        (description_en IS NOT NULL) AS en, (description_tr IS NOT NULL) AS tr,
--        (description_de IS NOT NULL) AS de, (description_pl IS NOT NULL) AS pl,
--        (description_ru IS NOT NULL) AS ru, (description_nl IS NOT NULL) AS nl
--   FROM regions WHERE slug IN ('okurcalar','turkler','mahmutlar','kargicak');

-- Verify Land of Legends internal link injection worked:
-- SELECT slug,
--        content_tr LIKE '%land-of-legends-transfer%' AS tr_has_link,
--        content_en LIKE '%land-of-legends-transfer%' AS en_has_link,
--        content_de LIKE '%land-of-legends-transfer%' AS de_has_link,
--        content_pl LIKE '%land-of-legends-transfer%' AS pl_has_link,
--        content_ru LIKE '%land-of-legends-transfer%' AS ru_has_link
--   FROM blog_posts WHERE slug = 'land-of-legends-transfer-rehberi';
