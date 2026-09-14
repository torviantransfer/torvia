-- =============================================
-- 086: Altı yeni bölge — Konyaaltı, Çolaklı, Çıralı, Kumluca, Finike, Demre
--
-- Fiyat listesinde yer alan ama sitede karşılığı olmayan bölgeler. İkisi
-- Alanya yolunda (Konyaaltı, Çolaklı), dördü Kemer/Finike yolunda.
--
-- Mesafe/süre OSRM yol verisinden alındı ve sitedeki komşularla aynı ölçeğe
-- çekildi (085'te Türkler için yapılanın aynısı — OSRM süreleri sitedekinden
-- birkaç dakika sapıyor, ikisini karıştırmak sıralamayı bozar):
--   Konyaaltı OSRM  24,6 km /  30 dk  →  25 km /  32 dk
--   Çolaklı   OSRM  56,4 km /  60 dk  →  56 km /  48 dk
--   Çıralı    OSRM  95,6 km /  92 dk  →  88 km /  82 dk
--   Kumluca   OSRM 111,3 km /  93 dk  → 108 km /  95 dk
--   Finike    OSRM 128,8 km / 106 dk  → 125 km / 108 dk
--   Demre     OSRM 156,2 km / 130 dk  → 152 km / 132 dk
--
-- Sıralama fiyat listesindeki sırayla tutarlı:
--   Boğazkent 40 → Çolaklı 56 → Evrenseki 60
--   Tekirova 55 → Çıralı 88 → Adrasan 90 → Kumluca 108 → Finike 125
--     → Demre 152 → Kaş 187
--
-- Bu dosya FİYAT YAZMAZ. Fiyatlar 087'de, diğer 28 bölgeyle birlikte euro
-- olarak girilir — bölgeler orada fiyatsız kalmasın diye ayrı tutuldu.
--
-- Altısı da PASİF eklenir. Aktif etmek panelden (/admin/regions) yapılmalı:
-- önce sayfaları görüp onaylarsın, panel kaydı önbelleği ve sitemap'i yeniler.
--
-- Görseller önce Supabase Storage'a yüklenmeli:
--   blog-images/regions/{konyaalti,colakli,cirali,kumluca,finike,demre}.jpg
--
-- Tek transaction. Tekrar çalıştırılabilir.
-- =============================================

BEGIN;

-- ---------------------------------------------
-- 1. KONYAALTI — 25 km, 32 dk
-- ---------------------------------------------
INSERT INTO regions (
  slug, name_tr, name_en, name_de, name_pl, name_ru, name_nl, name_ro,
  description_tr, description_en, description_de, description_pl,
  distance_km, duration_minutes, latitude, longitude, image_url,
  is_popular, is_active, sort_order
) VALUES (
  'konyaalti',
  'Konyaaltı', 'Konyaaltı', 'Konyaaltı', 'Konyaaltı', 'Коньяалты', 'Konyaaltı', 'Konyaaltı',

  $tr$Konyaaltı, Antalya Havalimanı'na (AYT) yaklaşık 25 km uzaklıkta ve özel transferle yaklaşık 32 dakika mesafede, Antalya'nın batı yakasındaki sahil ilçesidir. Yedi kilometrelik çakıl plajı Beydağları'nın hemen eteğinde uzanır; şehirde denize girip arkanıza döndüğünüzde dağ manzarası görebileceğiniz sayılı yerlerden biridir. Beach Park, Antalya Akvaryumu ve Tünektepe teleferiği plajın hemen üzerindedir, Kaleiçi ve Antalya Müzesi ise on beş dakikalık mesafededir. Akra, Ramada Plaza, Porto Bello ve Hotel SU gibi şehir otelleri sahil boyunca sıralanır. Kundu ve Lara'daki her şey dahil tatil köylerinden farklı olarak Konyaaltı yaşayan bir şehir mahallesidir: tramvay, market, kafe ve restoranlar yürüme mesafesindedir. Havalimanı şehrin doğusunda kaldığı için transfer tüm şehri baştan sona geçer; özel şoför sizi trafikte bırakmadan doğrudan otelinizin kapısına götürür. TORVIAN: özel havalimanı transferi, araç başına sabit fiyat, isim tabelasıyla karşılama, canlı uçuş takibi, 7/24.$tr$,

  $en$Konyaaltı is the coastal district on Antalya's western side, about 25 km from Antalya Airport (AYT) and around 32 minutes away by private transfer. Its seven-kilometre pebble beach runs along the foot of the Beydağları mountains — one of the few city beaches anywhere where you can swim, turn around, and look straight at a mountain range. Beach Park, the Antalya Aquarium and the Tünektepe cable car sit directly above the shore, and Kaleiçi old town and the Antalya Museum are fifteen minutes away. City hotels such as Akra, Ramada Plaza, Porto Bello and Hotel SU line the seafront. Unlike the all-inclusive resorts at Kundu and Lara, Konyaaltı is a working city district: the tram, shops, cafés and restaurants are all within walking distance. The airport lies on the far eastern side of the city, so the transfer crosses Antalya end to end — a private driver takes you straight to your hotel door instead of leaving you to work out the traffic. TORVIAN: private airport transfer, fixed price per vehicle, name-board welcome, live flight tracking, 24/7.$en$,

  $de$Konyaaltı ist der Küstenbezirk im Westen von Antalya, rund 25 km vom Flughafen Antalya (AYT) entfernt und mit dem Privattransfer in etwa 32 Minuten erreichbar. Der sieben Kilometer lange Kiesstrand verläuft direkt am Fuß des Beydağları-Gebirges – einer der wenigen Stadtstrände überhaupt, an dem man schwimmen, sich umdrehen und auf eine Bergkette blicken kann. Beach Park, das Antalya-Aquarium und die Seilbahn auf den Tünektepe liegen unmittelbar oberhalb des Strandes, die Altstadt Kaleiçi und das Antalya-Museum fünfzehn Minuten entfernt. Stadthotels wie Akra, Ramada Plaza, Porto Bello und Hotel SU reihen sich an der Uferpromenade. Anders als die All-inclusive-Anlagen in Kundu und Lara ist Konyaaltı ein lebendiger Stadtteil: Straßenbahn, Geschäfte, Cafés und Restaurants sind fußläufig erreichbar. Der Flughafen liegt am östlichen Stadtrand, der Transfer durchquert Antalya also vollständig – Ihr Privatfahrer bringt Sie direkt vor den Hoteleingang, ohne dass Sie sich mit dem Verkehr befassen müssen. TORVIAN: Privattransfer Flughafen Antalya nach Konyaaltı, Festpreis pro Fahrzeug, Empfang mit Namensschild, Flugverfolgung, 24/7.$de$,

  $pl$Konyaaltı to nadmorska dzielnica po zachodniej stronie Antalyi, około 25 km od lotniska Antalya (AYT) i około 32 minut prywatnym transferem. Jej siedmiokilometrowa żwirowa plaża ciągnie się u stóp gór Beydağları – to jedna z niewielu miejskich plaż na świecie, gdzie można popływać, odwrócić się i spojrzeć wprost na pasmo górskie. Beach Park, Akwarium w Antalyi i kolejka linowa na Tünektepe znajdują się tuż nad brzegiem, a starówka Kaleiçi i Muzeum Antalyi są piętnaście minut dalej. Wzdłuż nadmorskiej promenady stoją hotele miejskie, m.in. Akra, Ramada Plaza, Porto Bello i Hotel SU. W odróżnieniu od kompleksów all inclusive w Kundu i Larze Konyaaltı jest żyjącą dzielnicą miasta: tramwaj, sklepy, kawiarnie i restauracje są w zasięgu spaceru. Lotnisko leży po wschodniej stronie miasta, więc transfer przecina całą Antalyę – prywatny kierowca zawiezie Cię prosto pod wejście do hotelu, bez zmagania się z korkami. TORVIAN: prywatny transfer z lotniska Antalya do Konyaaltı, stała cena za pojazd, powitanie z tabliczką, monitoring lotu, 24/7.$pl$,

  25.0, 32, 36.858300, 30.639400,
  'https://ximlobdcblinqtlizwrz.supabase.co/storage/v1/object/public/blog-images/regions/konyaalti.jpg',
  false, false, 11
)
ON CONFLICT (slug) DO UPDATE SET
  name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, name_de = EXCLUDED.name_de,
  name_pl = EXCLUDED.name_pl, name_ru = EXCLUDED.name_ru, name_nl = EXCLUDED.name_nl,
  name_ro = EXCLUDED.name_ro,
  description_tr = EXCLUDED.description_tr, description_en = EXCLUDED.description_en,
  description_de = EXCLUDED.description_de, description_pl = EXCLUDED.description_pl,
  distance_km = EXCLUDED.distance_km, duration_minutes = EXCLUDED.duration_minutes,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  image_url = EXCLUDED.image_url;

-- ---------------------------------------------
-- 2. ÇOLAKLI — 56 km, 48 dk
-- ---------------------------------------------
INSERT INTO regions (
  slug, name_tr, name_en, name_de, name_pl, name_ru, name_nl, name_ro,
  description_tr, description_en, description_de, description_pl,
  distance_km, duration_minutes, latitude, longitude, image_url,
  is_popular, is_active, sort_order
) VALUES (
  'colakli',
  'Çolaklı', 'Çolaklı', 'Çolaklı', 'Çolaklı', 'Чолаклы', 'Çolaklı', 'Çolaklı',

  $tr$Çolaklı, Antalya Havalimanı'na (AYT) yaklaşık 56 km uzaklıkta ve özel transferle yaklaşık 48 dakika mesafede bir sahil beldesidir; Boğazkent ile Side arasında, Side merkezinin yaklaşık 8 km batısında yer alır. Uzun ve sığ kumsalı özellikle küçük çocuklu aileler için tercih edilir; deniz metrelerce açılana kadar ayakta durulabilecek derinliktedir. Trendy Verbena, Alba Queen, Adalya Elite ve Sunis Elita gibi büyük her şey dahil oteller sahil boyunca sıralanır. Çolaklı, Side'nin kalabalığından ve gece hayatından uzak sakin bir tatil arayanların seçtiği yerdir; antik tiyatro ve Apollon Tapınağı ise yalnızca on dakikalık mesafededir. Oteller D400 sahil yolundan içeride ve birbirine yakın olduğu için tabelalar kolayca karışır; özel şoför doğrudan sizin otelinizin kapısına bırakır, yoldaki diğer otellerde durmaz. TORVIAN: özel havalimanı transferi, araç başına sabit fiyat, isim tabelasıyla karşılama, canlı uçuş takibi, 7/24.$tr$,

  $en$Çolaklı is a coastal village about 56 km from Antalya Airport (AYT) and around 48 minutes away by private transfer, lying between Boğazkent and Side, roughly 8 km west of Side centre. Its long, shallow sandy beach is a particular draw for families with small children — the water stays standing depth for a long way out. Large all-inclusive resorts such as Trendy Verbena, Alba Queen, Adalya Elite and Sunis Elita line the shore. Çolaklı is where people go who want the Side coast without Side's crowds and nightlife, while the ancient theatre and the Temple of Apollo are still only ten minutes away. The hotels sit back from the D400 coast road and close together, so signage is easy to confuse; a private driver takes you directly to your own hotel entrance rather than stopping at every resort along the way. TORVIAN: private airport transfer, fixed price per vehicle, name-board welcome, live flight tracking, 24/7.$en$,

  $de$Çolaklı ist ein Küstenort rund 56 km vom Flughafen Antalya (AYT) entfernt und mit dem Privattransfer in etwa 48 Minuten erreichbar, zwischen Boğazkent und Side gelegen, gut 8 km westlich des Zentrums von Side. Der lange, flach abfallende Sandstrand ist vor allem bei Familien mit kleinen Kindern beliebt – das Wasser bleibt weit hinaus stehtief. Große All-inclusive-Anlagen wie Trendy Verbena, Alba Queen, Adalya Elite und Sunis Elita säumen die Küste. Çolaklı ist die Wahl für alle, die die Küste von Side ohne dessen Trubel und Nachtleben möchten; das antike Theater und der Apollon-Tempel sind trotzdem nur zehn Minuten entfernt. Die Hotels liegen dicht beieinander abseits der Küstenstraße D400, die Beschilderung ist leicht zu verwechseln – Ihr Privatfahrer bringt Sie direkt vor Ihren Hoteleingang, ohne Zwischenstopps an anderen Anlagen. TORVIAN: Privattransfer Flughafen Antalya nach Çolaklı, Festpreis pro Fahrzeug, Empfang mit Namensschild, Flugverfolgung, 24/7.$de$,

  $pl$Çolaklı to nadmorska miejscowość oddalona o około 56 km od lotniska Antalya (AYT) i około 48 minut prywatnym transferem, położona między Boğazkent a Side, mniej więcej 8 km na zachód od centrum Side. Długa, łagodnie opadająca piaszczysta plaża jest szczególnie ceniona przez rodziny z małymi dziećmi – woda sięga do pasa jeszcze daleko od brzegu. Wzdłuż wybrzeża stoją duże hotele all inclusive, m.in. Trendy Verbena, Alba Queen, Adalya Elite i Sunis Elita. Çolaklı wybierają ci, którzy chcą wybrzeża Side bez jego tłumów i życia nocnego, a antyczny teatr i Świątynia Apollina są wciąż tylko dziesięć minut dalej. Hotele stoją blisko siebie w głębi od nadmorskiej drogi D400 i łatwo pomylić oznaczenia – prywatny kierowca zawiezie Cię prosto pod wejście do Twojego hotelu, bez postojów przy innych obiektach. TORVIAN: prywatny transfer z lotniska Antalya do Çolaklı, stała cena za pojazd, powitanie z tabliczką, monitoring lotu, 24/7.$pl$,

  56.0, 48, 36.777200, 31.265300,
  'https://ximlobdcblinqtlizwrz.supabase.co/storage/v1/object/public/blog-images/regions/colakli.jpg',
  false, false, 12
)
ON CONFLICT (slug) DO UPDATE SET
  name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, name_de = EXCLUDED.name_de,
  name_pl = EXCLUDED.name_pl, name_ru = EXCLUDED.name_ru, name_nl = EXCLUDED.name_nl,
  name_ro = EXCLUDED.name_ro,
  description_tr = EXCLUDED.description_tr, description_en = EXCLUDED.description_en,
  description_de = EXCLUDED.description_de, description_pl = EXCLUDED.description_pl,
  distance_km = EXCLUDED.distance_km, duration_minutes = EXCLUDED.duration_minutes,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  image_url = EXCLUDED.image_url;

-- ---------------------------------------------
-- 3. ÇIRALI — 88 km, 82 dk
-- ---------------------------------------------
INSERT INTO regions (
  slug, name_tr, name_en, name_de, name_pl, name_ru, name_nl, name_ro,
  description_tr, description_en, description_de, description_pl,
  distance_km, duration_minutes, latitude, longitude, image_url,
  is_popular, is_active, sort_order
) VALUES (
  'cirali',
  'Çıralı', 'Çıralı', 'Çıralı', 'Çıralı', 'Чиралы', 'Çıralı', 'Çıralı',

  $tr$Çıralı, Antalya Havalimanı'na (AYT) yaklaşık 88 km uzaklıkta ve özel transferle yaklaşık 1 saat 22 dakika mesafede, Tekirova ile Adrasan arasında kalan bir sahil köyüdür. Üç kilometrelik çakıl plajı caretta caretta yuvalama alanı olduğu için koruma altındadır: sahilde yüksek bina yoktur, geceleri plaj ışıklandırılmaz. Konaklama büyük otellerden değil, portakal bahçelerinin arasına dağılmış küçük pansiyon ve bungalovlardan oluşur. Plajın bir ucunda Olympos antik kenti ve kanyonu, tepenin üzerinde ise topraktan çıkan doğal gazın kendiliğinden yandığı Yanartaş (Khimaira) ateşleri bulunur; ikisi de yürüme mesafesindedir. Çıralı sahil yolundan sapan dar ve virajlı bir yolun sonundadır, toplu taşıma sınırlıdır; özel transfer burada kolaylık değil, pratikte tek makul ulaşım biçimidir. TORVIAN: özel havalimanı transferi, araç başına sabit fiyat, isim tabelasıyla karşılama, canlı uçuş takibi, 7/24.$tr$,

  $en$Çıralı is a beach village about 88 km from Antalya Airport (AYT) and around 1 hour 22 minutes away by private transfer, set between Tekirova and Adrasan. Its three-kilometre pebble beach is a protected loggerhead turtle nesting site, which is why there are no high-rise buildings along it and no lighting on the sand at night. Accommodation is not large hotels but small pensions and bungalows scattered among the orange groves. At one end of the beach lie the ruins and gorge of ancient Olympos; on the hillside above burn the Chimaera flames, natural gas seeping from the rock and igniting on its own — both within walking distance. Çıralı sits at the end of a narrow, winding road off the coast highway and public transport is limited, so a private transfer here is less a convenience than the only practical way in. TORVIAN: private airport transfer, fixed price per vehicle, name-board welcome, live flight tracking, 24/7.$en$,

  $de$Çıralı ist ein Stranddorf rund 88 km vom Flughafen Antalya (AYT) entfernt und mit dem Privattransfer in etwa 1 Stunde 22 Minuten erreichbar, zwischen Tekirova und Adrasan gelegen. Sein drei Kilometer langer Kiesstrand ist geschütztes Brutgebiet der Unechten Karettschildkröte – deshalb gibt es hier keine Hochbauten und nachts keine Beleuchtung am Strand. Übernachtet wird nicht in großen Hotels, sondern in kleinen Pensionen und Bungalows zwischen den Orangenhainen. An einem Ende des Strandes liegen die Ruinen und die Schlucht des antiken Olympos, am Hang darüber brennen die Chimaera-Flammen: Erdgas, das aus dem Fels austritt und sich von selbst entzündet – beides zu Fuß erreichbar. Çıralı liegt am Ende einer schmalen, kurvigen Straße abseits der Küstenstraße, der öffentliche Nahverkehr ist begrenzt – ein Privattransfer ist hier weniger Komfort als die einzige praktikable Anreise. TORVIAN: Privattransfer Flughafen Antalya nach Çıralı, Festpreis pro Fahrzeug, Empfang mit Namensschild, Flugverfolgung, 24/7.$de$,

  $pl$Çıralı to nadmorska wioska oddalona o około 88 km od lotniska Antalya (AYT) i około 1 godziny 22 minut prywatnym transferem, położona między Tekirovą a Adrasanem. Jej trzykilometrowa żwirowa plaża jest chronionym lęgowiskiem żółwi karetta – dlatego nie ma tu wysokich budynków, a nocą plaża nie jest oświetlona. Nocuje się nie w dużych hotelach, lecz w małych pensjonatach i bungalowach rozrzuconych wśród gajów pomarańczowych. Na jednym końcu plaży leżą ruiny i wąwóz antycznego Olympos, a na zboczu powyżej płoną ognie Chimery – gaz ziemny wydobywający się ze skały i zapalający się samoczynnie; obydwa miejsca są w zasięgu spaceru. Çıralı leży na końcu wąskiej, krętej drogi odchodzącej od nadmorskiej trasy, a komunikacja publiczna jest ograniczona – prywatny transfer nie jest tu wygodą, lecz praktycznie jedynym rozsądnym sposobem dojazdu. TORVIAN: prywatny transfer z lotniska Antalya do Çıralı, stała cena za pojazd, powitanie z tabliczką, monitoring lotu, 24/7.$pl$,

  88.0, 82, 36.413300, 30.474700,
  'https://ximlobdcblinqtlizwrz.supabase.co/storage/v1/object/public/blog-images/regions/cirali.jpg',
  false, false, 13
)
ON CONFLICT (slug) DO UPDATE SET
  name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, name_de = EXCLUDED.name_de,
  name_pl = EXCLUDED.name_pl, name_ru = EXCLUDED.name_ru, name_nl = EXCLUDED.name_nl,
  name_ro = EXCLUDED.name_ro,
  description_tr = EXCLUDED.description_tr, description_en = EXCLUDED.description_en,
  description_de = EXCLUDED.description_de, description_pl = EXCLUDED.description_pl,
  distance_km = EXCLUDED.distance_km, duration_minutes = EXCLUDED.duration_minutes,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  image_url = EXCLUDED.image_url;

-- ---------------------------------------------
-- 4. KUMLUCA — 108 km, 95 dk
-- ---------------------------------------------
INSERT INTO regions (
  slug, name_tr, name_en, name_de, name_pl, name_ru, name_nl, name_ro,
  description_tr, description_en, description_de, description_pl,
  distance_km, duration_minutes, latitude, longitude, image_url,
  is_popular, is_active, sort_order
) VALUES (
  'kumluca',
  'Kumluca', 'Kumluca', 'Kumluca', 'Kumluca', 'Кумлуджа', 'Kumluca', 'Kumluca',

  $tr$Kumluca, Antalya Havalimanı'na (AYT) yaklaşık 108 km uzaklıkta ve özel transferle yaklaşık 1 saat 35 dakika mesafede, Antalya'nın batı kıyısındaki ilçe merkezidir. Türkiye'nin sera tarımının merkezi sayılır; ilçeye giren yol boyunca kilometrelerce uzanan seralar bölgenin kendi ekonomisini anlatır. Tatilciler için Kumluca çoğunlukla bir geçiş ve hizmet noktasıdır: Olympos, Çıralı, Adrasan ve Karaöz koyları buradan ayrılan yollarla ulaşılır, ilçe merkezinde banka, hastane, market ve haftalık pazar bulunur. Likya Yolu'nun en güzel etapları ilçe sınırları içindedir ve Karaöz ile Mavikent sahilleri kalabalıktan uzak, kamp ve karavan için tercih edilen yerlerdir. Bölgeye giden yol dağlık ve virajlıdır, akşam saatlerinde toplu taşıma seyrekleşir; özel transfer saat kaygısı olmadan kapıya ulaşmanın en güvenli yoludur. TORVIAN: özel havalimanı transferi, araç başına sabit fiyat, isim tabelasıyla karşılama, canlı uçuş takibi, 7/24.$tr$,

  $en$Kumluca is a district town on Antalya's western coast, about 108 km from Antalya Airport (AYT) and around 1 hour 35 minutes away by private transfer. It is the centre of Turkey's greenhouse farming, and the kilometres of glasshouses lining the approach road tell you most of what you need to know about the local economy. For visitors Kumluca is mainly a gateway and a service town: the roads to Olympos, Çıralı, Adrasan and the Karaöz coves all branch from here, and the centre has banks, a hospital, supermarkets and a weekly market. Some of the finest stages of the Lycian Way run through the district, and the beaches at Karaöz and Mavikent are quiet stretches favoured by campers and campervans. The road in is mountainous and winding and public transport thins out in the evening, so a private transfer is the safest way to reach the door without watching the clock. TORVIAN: private airport transfer, fixed price per vehicle, name-board welcome, live flight tracking, 24/7.$en$,

  $de$Kumluca ist eine Kreisstadt an der Westküste von Antalya, rund 108 km vom Flughafen Antalya (AYT) entfernt und mit dem Privattransfer in etwa 1 Stunde 35 Minuten erreichbar. Der Ort ist das Zentrum des türkischen Gewächshausanbaus – die kilometerlangen Glashäuser entlang der Zufahrtsstraße erzählen das Wesentliche über die Wirtschaft der Region. Für Urlauber ist Kumluca vor allem Tor und Versorgungsort: Von hier zweigen die Straßen nach Olympos, Çıralı, Adrasan und zu den Buchten von Karaöz ab, im Zentrum gibt es Banken, ein Krankenhaus, Supermärkte und einen Wochenmarkt. Einige der schönsten Etappen des Lykischen Wegs verlaufen durch den Landkreis, und die Strände von Karaöz und Mavikent sind ruhige Abschnitte, die bei Campern und Wohnmobilisten beliebt sind. Die Anfahrt führt über kurvige Bergstraßen, und der öffentliche Nahverkehr wird abends dünn – ein Privattransfer ist der sicherste Weg bis vor die Tür, ohne auf die Uhr zu sehen. TORVIAN: Privattransfer Flughafen Antalya nach Kumluca, Festpreis pro Fahrzeug, Empfang mit Namensschild, Flugverfolgung, 24/7.$de$,

  $pl$Kumluca to miasto powiatowe na zachodnim wybrzeżu Antalyi, około 108 km od lotniska Antalya (AYT) i około 1 godziny 35 minut prywatnym transferem. To centrum tureckiej uprawy szklarniowej – kilometry szklarni wzdłuż drogi dojazdowej mówią niemal wszystko o gospodarce regionu. Dla turystów Kumluca jest przede wszystkim bramą i miastem usługowym: stąd odchodzą drogi do Olympos, Çıralı, Adrasanu i zatoczek Karaöz, a w centrum są banki, szpital, supermarkety i cotygodniowy bazar. Przez powiat biegną jedne z najpiękniejszych etapów Drogi Likijskiej, a plaże w Karaöz i Mavikent to spokojne odcinki chętnie wybierane przez kempingowiczów i kamperowiczów. Droga dojazdowa jest górska i kręta, a wieczorem komunikacja publiczna rzednie – prywatny transfer to najbezpieczniejszy sposób, by dotrzeć pod drzwi bez patrzenia na zegarek. TORVIAN: prywatny transfer z lotniska Antalya do Kumlucy, stała cena za pojazd, powitanie z tabliczką, monitoring lotu, 24/7.$pl$,

  108.0, 95, 36.370300, 30.290300,
  'https://ximlobdcblinqtlizwrz.supabase.co/storage/v1/object/public/blog-images/regions/kumluca.jpg',
  false, false, 14
)
ON CONFLICT (slug) DO UPDATE SET
  name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, name_de = EXCLUDED.name_de,
  name_pl = EXCLUDED.name_pl, name_ru = EXCLUDED.name_ru, name_nl = EXCLUDED.name_nl,
  name_ro = EXCLUDED.name_ro,
  description_tr = EXCLUDED.description_tr, description_en = EXCLUDED.description_en,
  description_de = EXCLUDED.description_de, description_pl = EXCLUDED.description_pl,
  distance_km = EXCLUDED.distance_km, duration_minutes = EXCLUDED.duration_minutes,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  image_url = EXCLUDED.image_url;

-- ---------------------------------------------
-- 5. FİNİKE — 125 km, 108 dk
-- ---------------------------------------------
INSERT INTO regions (
  slug, name_tr, name_en, name_de, name_pl, name_ru, name_nl, name_ro,
  description_tr, description_en, description_de, description_pl,
  distance_km, duration_minutes, latitude, longitude, image_url,
  is_popular, is_active, sort_order
) VALUES (
  'finike',
  'Finike', 'Finike', 'Finike', 'Finike', 'Финике', 'Finike', 'Finike',

  $tr$Finike, Antalya Havalimanı'na (AYT) yaklaşık 125 km uzaklıkta ve özel transferle yaklaşık 1 saat 48 dakika mesafede, Kumluca ile Demre arasında kalan bir sahil ilçesidir. Adı Türkiye'de portakalla özdeşleşmiştir; ilçeyi çevreleyen narenciye bahçeleri kışın hasat mevsiminde bütün kasabaya kokusunu verir. Setur Finike Marina yılın büyük bölümünde Akdeniz'i dolaşan yelkenlilerin kışlama limanıdır ve kasabanın sahil kesimine sakin, denizci bir hava katar. Antik Arykanda kenti, dağ yolunda yaklaşık yarım saat mesafededir ve Likya'nın en iyi korunmuş yerleşimlerinden biri sayılır. Finike kitlesel turizme açılmamış bir yerdir: büyük tatil köyleri yerine küçük oteller, uzun ve boş çakıl plajlar, kendi halinde bir kasaba merkezi bulunur. Havalimanından geliş dağ yolundan geçer ve akşam saatlerinde otobüs seçenekleri azalır; özel transfer bu mesafede en rahat çözümdür. TORVIAN: özel havalimanı transferi, araç başına sabit fiyat, isim tabelasıyla karşılama, canlı uçuş takibi, 7/24.$tr$,

  $en$Finike is a coastal district between Kumluca and Demre, about 125 km from Antalya Airport (AYT) and around 1 hour 48 minutes away by private transfer. In Turkey its name is synonymous with oranges, and in winter the citrus groves around the town scent the whole place at harvest. Setur Finike Marina is a wintering harbour for yachts cruising the Mediterranean and gives the seafront a quiet, seafaring character for much of the year. The ancient city of Arykanda lies about half an hour up the mountain road and is reckoned one of the best preserved settlements in Lycia. Finike has never been opened up to mass tourism: instead of large resorts there are small hotels, long empty pebble beaches and a town centre that goes about its own business. The drive from the airport runs over mountain roads and bus options thin out in the evening, so at this distance a private transfer is much the easiest answer. TORVIAN: private airport transfer, fixed price per vehicle, name-board welcome, live flight tracking, 24/7.$en$,

  $de$Finike ist ein Küstenbezirk zwischen Kumluca und Demre, rund 125 km vom Flughafen Antalya (AYT) entfernt und mit dem Privattransfer in etwa 1 Stunde 48 Minuten erreichbar. In der Türkei ist der Name gleichbedeutend mit Orangen – im Winter durchzieht der Duft der Zitrushaine zur Erntezeit den ganzen Ort. Die Setur Finike Marina ist Winterhafen für Yachten, die das Mittelmeer bereisen, und verleiht der Uferzone einen großen Teil des Jahres einen ruhigen, seemännischen Charakter. Die antike Stadt Arykanda liegt etwa eine halbe Stunde die Bergstraße hinauf und gilt als eine der besterhaltenen Siedlungen Lykiens. Finike wurde nie für den Massentourismus erschlossen: statt großer Anlagen gibt es kleine Hotels, lange leere Kiesstrände und ein Stadtzentrum, das seinen eigenen Geschäften nachgeht. Die Anfahrt vom Flughafen führt über Bergstraßen, und abends werden die Busverbindungen dünn – auf dieser Distanz ist ein Privattransfer die mit Abstand bequemste Lösung. TORVIAN: Privattransfer Flughafen Antalya nach Finike, Festpreis pro Fahrzeug, Empfang mit Namensschild, Flugverfolgung, 24/7.$de$,

  $pl$Finike to nadmorski powiat między Kumlucą a Demre, około 125 km od lotniska Antalya (AYT) i około 1 godziny 48 minut prywatnym transferem. W Turcji jego nazwa jest synonimem pomarańczy – zimą, w czasie zbiorów, zapach gajów cytrusowych otaczających miasto niesie się po całej okolicy. Setur Finike Marina jest zimowym portem dla jachtów pływających po Morzu Śródziemnym i przez większą część roku nadaje nabrzeżu spokojny, żeglarski charakter. Antyczne miasto Arykanda leży około pół godziny drogą górską w górę i uchodzi za jedną z najlepiej zachowanych osad Licji. Finike nigdy nie zostało otwarte na masową turystykę: zamiast wielkich kompleksów są tu małe hotele, długie puste żwirowe plaże i centrum miasteczka żyjące własnym rytmem. Dojazd z lotniska prowadzi drogami górskimi, a wieczorem połączeń autobusowych ubywa – na tym dystansie prywatny transfer jest zdecydowanie najwygodniejszym rozwiązaniem. TORVIAN: prywatny transfer z lotniska Antalya do Finike, stała cena za pojazd, powitanie z tabliczką, monitoring lotu, 24/7.$pl$,

  125.0, 108, 36.300600, 30.145000,
  'https://ximlobdcblinqtlizwrz.supabase.co/storage/v1/object/public/blog-images/regions/finike.jpg',
  false, false, 15
)
ON CONFLICT (slug) DO UPDATE SET
  name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, name_de = EXCLUDED.name_de,
  name_pl = EXCLUDED.name_pl, name_ru = EXCLUDED.name_ru, name_nl = EXCLUDED.name_nl,
  name_ro = EXCLUDED.name_ro,
  description_tr = EXCLUDED.description_tr, description_en = EXCLUDED.description_en,
  description_de = EXCLUDED.description_de, description_pl = EXCLUDED.description_pl,
  distance_km = EXCLUDED.distance_km, duration_minutes = EXCLUDED.duration_minutes,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  image_url = EXCLUDED.image_url;

-- ---------------------------------------------
-- 6. DEMRE — 152 km, 132 dk
-- ---------------------------------------------
INSERT INTO regions (
  slug, name_tr, name_en, name_de, name_pl, name_ru, name_nl, name_ro,
  description_tr, description_en, description_de, description_pl,
  distance_km, duration_minutes, latitude, longitude, image_url,
  is_popular, is_active, sort_order
) VALUES (
  'demre',
  'Demre', 'Demre', 'Demre', 'Demre', 'Демре', 'Demre', 'Demre',

  $tr$Demre, Antalya Havalimanı'na (AYT) yaklaşık 152 km uzaklıkta ve özel transferle yaklaşık 2 saat 12 dakika mesafede, Finike ile Kaş arasında kalan bir ilçedir. Noel Baba'nın gerçek kişisi olan Aziz Nikolaos dördüncü yüzyılda buranın piskoposuydu; adını taşıyan kilise ilçe merkezindedir ve dünyanın dört bir yanından ziyaretçi çeker. Hemen yanı başında, kayaya oyulmuş Likya mezarları ve iyi korunmuş antik tiyatrosuyla Myra antik kenti yer alır. Kıyıdaki Andriake limanından kalkan tekneler, deprem sonrası sular altında kalan Kekova batık şehrine gider — bölgenin en bilinen gezisidir. Demre'nin kendisi turistik bir tatil beldesi değil, seralarıyla geçinen çalışkan bir kasabadır; konaklama küçük otel ve pansiyonlardan oluşur. Havalimanından geliş uzun ve dağlıktır, aktarmalı otobüs yolculuğu üç saati aşar; bu mesafede özel transfer zaman ve yorgunluk açısından net fark yaratır. TORVIAN: özel havalimanı transferi, araç başına sabit fiyat, isim tabelasıyla karşılama, canlı uçuş takibi, 7/24.$tr$,

  $en$Demre is a district between Finike and Kaş, about 152 km from Antalya Airport (AYT) and around 2 hours 12 minutes away by private transfer. Saint Nicholas — the real person behind Father Christmas — was bishop here in the fourth century, and the church that bears his name stands in the town centre, drawing visitors from around the world. Immediately beside it lies ancient Myra, with its Lycian tombs cut into the cliff face and a remarkably well preserved theatre. From the harbour at Andriake on the coast, boats run out to the sunken city of Kekova, submerged by earthquake and the best known excursion in the region. Demre itself is not a resort but a working town living off its greenhouses; accommodation is small hotels and pensions. The drive from the airport is long and mountainous and the bus journey with changes runs past three hours, so at this distance a private transfer makes a real difference in both time and fatigue. TORVIAN: private airport transfer, fixed price per vehicle, name-board welcome, live flight tracking, 24/7.$en$,

  $de$Demre ist ein Landkreis zwischen Finike und Kaş, rund 152 km vom Flughafen Antalya (AYT) entfernt und mit dem Privattransfer in etwa 2 Stunden 12 Minuten erreichbar. Der heilige Nikolaus – die reale Person hinter dem Weihnachtsmann – war hier im vierten Jahrhundert Bischof; die nach ihm benannte Kirche steht im Ortszentrum und zieht Besucher aus aller Welt an. Unmittelbar daneben liegt das antike Myra mit seinen in die Felswand geschlagenen lykischen Gräbern und einem bemerkenswert gut erhaltenen Theater. Vom Hafen Andriake an der Küste fahren Boote zur versunkenen Stadt Kekova, die ein Erdbeben unter Wasser setzte – der bekannteste Ausflug der Region. Demre selbst ist kein Ferienort, sondern eine arbeitende Kleinstadt, die von ihren Gewächshäusern lebt; übernachtet wird in kleinen Hotels und Pensionen. Die Anfahrt vom Flughafen ist lang und bergig, die Busfahrt mit Umstiegen dauert über drei Stunden – auf dieser Distanz macht ein Privattransfer bei Zeit und Erschöpfung einen deutlichen Unterschied. TORVIAN: Privattransfer Flughafen Antalya nach Demre, Festpreis pro Fahrzeug, Empfang mit Namensschild, Flugverfolgung, 24/7.$de$,

  $pl$Demre to powiat między Finike a Kaş, około 152 km od lotniska Antalya (AYT) i około 2 godzin 12 minut prywatnym transferem. Święty Mikołaj – rzeczywista postać stojąca za Świętym Mikołajem – był tu biskupem w IV wieku, a kościół noszący jego imię stoi w centrum miasta i przyciąga odwiedzających z całego świata. Tuż obok leży antyczna Myra z grobowcami likijskimi wykutymi w skalnej ścianie i wyjątkowo dobrze zachowanym teatrem. Z portu Andriake na wybrzeżu odpływają łodzie do zatopionego miasta Kekova, pogrążonego przez trzęsienie ziemi – to najbardziej znana wycieczka w regionie. Samo Demre nie jest kurortem, lecz pracującym miasteczkiem żyjącym ze szklarni; nocuje się w małych hotelach i pensjonatach. Dojazd z lotniska jest długi i górzysty, a podróż autobusem z przesiadkami przekracza trzy godziny – na tym dystansie prywatny transfer robi realną różnicę w czasie i zmęczeniu. TORVIAN: prywatny transfer z lotniska Antalya do Demre, stała cena za pojazd, powitanie z tabliczką, monitoring lotu, 24/7.$pl$,

  152.0, 132, 36.243900, 29.985300,
  'https://ximlobdcblinqtlizwrz.supabase.co/storage/v1/object/public/blog-images/regions/demre.jpg',
  false, false, 16
)
ON CONFLICT (slug) DO UPDATE SET
  name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, name_de = EXCLUDED.name_de,
  name_pl = EXCLUDED.name_pl, name_ru = EXCLUDED.name_ru, name_nl = EXCLUDED.name_nl,
  name_ro = EXCLUDED.name_ro,
  description_tr = EXCLUDED.description_tr, description_en = EXCLUDED.description_en,
  description_de = EXCLUDED.description_de, description_pl = EXCLUDED.description_pl,
  distance_km = EXCLUDED.distance_km, duration_minutes = EXCLUDED.duration_minutes,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  image_url = EXCLUDED.image_url;

COMMIT;

-- ---------------------------------------------
-- KONTROL — altı satır dönmeli, hepsi aktif=false, fiyat yok
--
-- Fiyatlar 087 ile gelir. 087 çalışmadan bu bölgeleri panelden AKTİF ETME:
-- fiyatsız bir bölge /api/pricing'den "Pricing not found" döner ve sayfası
-- rezervasyon alamaz.
-- ---------------------------------------------
SELECT
  r.slug,
  r.name_tr                          AS ad,
  r.is_active                        AS aktif,
  r.distance_km                      AS km,
  r.duration_minutes                 AS dakika,
  COUNT(p.id)                        AS fiyat_satiri,
  CASE WHEN r.description_tr IS NOT NULL
        AND r.description_en IS NOT NULL
        AND r.description_de IS NOT NULL
        AND r.description_pl IS NOT NULL
       THEN 'tr/en/de/pl tam' ELSE 'EKSİK METİN' END AS metin
FROM regions r
LEFT JOIN pricing p ON p.region_id = r.id
WHERE r.slug IN ('konyaalti', 'colakli', 'cirali', 'kumluca', 'finike', 'demre')
GROUP BY r.id, r.slug, r.name_tr, r.is_active, r.distance_km, r.duration_minutes,
         r.description_tr, r.description_en, r.description_de, r.description_pl
ORDER BY r.distance_km;
