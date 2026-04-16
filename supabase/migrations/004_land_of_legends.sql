-- =============================================
-- Land of Legends Region Entry
-- =============================================
INSERT INTO regions (
  slug,
  name_tr, name_en, name_de, name_pl, name_ru,
  description_tr,
  description_en,
  description_de,
  description_pl,
  description_ru,
  meta_title_tr,
  meta_title_en,
  meta_title_de,
  meta_title_pl,
  meta_title_ru,
  meta_description_tr,
  meta_description_en,
  meta_description_de,
  meta_description_pl,
  meta_description_ru,
  distance_km,
  duration_minutes,
  is_popular,
  is_active,
  sort_order
) VALUES (
  'land-of-legends-transfer',
  'Land of Legends',
  'Land of Legends',
  'Land of Legends',
  'Land of Legends',
  'Land of Legends',

  -- description_tr
  'Land of Legends, Belek yakınlarında dünyanın en büyük eğlence parklarından biridir. Antalya Havalimanı''ndan Land of Legends''a konforlu ve sabit fiyatlı VIP transfer hizmeti sunuyoruz. Yaklaşık 40 km mesafede, 35 dakikalık yolculukla kapınıza kadar servis sağlıyoruz.',

  -- description_en
  'Land of Legends is one of the world''s largest theme parks located near Belek, Antalya. We offer comfortable, fixed-price VIP airport transfers from Antalya Airport to Land of Legends. Approximately 40 km away, your ride takes just 35 minutes door to door.',

  -- description_de
  'Land of Legends ist einer der größten Freizeitparks der Welt in der Nähe von Belek, Antalya. Wir bieten komfortable VIP-Flughafentransfers vom Flughafen Antalya zum Land of Legends zu Festpreisen an. Ca. 40 km entfernt, nur 35 Minuten bis zur Tür.',

  -- description_pl
  'Land of Legends to jeden z największych parków rozrywki na świecie, położony w pobliżu Belek w Antalyi. Oferujemy komfortowe transfery VIP z lotniska w Antalyi do Land of Legends w stałych cenach. Odległość ok. 40 km, czas przejazdu tylko 35 minut.',

  -- description_ru
  'Land of Legends — один из крупнейших в мире тематических парков развлечений вблизи Белека, Анталья. Предлагаем комфортные VIP-трансферы из аэропорта Антальи в Land of Legends по фиксированным ценам. Расстояние около 40 км, время в пути — всего 35 минут.',

  -- meta titles
  'Antalya Havalimanı Land of Legends Transfer | Sabit Fiyat VIP',
  'Antalya Airport to Land of Legends Transfer | Fixed Price VIP',
  'Flughafen Antalya Land of Legends Transfer | Festpreis VIP',
  'Transfer z Lotniska Antalya do Land of Legends | Stała Cena VIP',
  'Трансфер Аэропорт Анталья Land of Legends | Фиксированная Цена VIP',

  -- meta descriptions
  'Antalya Havalimanı''ndan Land of Legends''a özel VIP transfer. Sabit fiyat, 35 dk, 40 km. Profesyonel şoför, konforlu araç. Hemen rezervasyon yap!',
  'Private VIP transfer from Antalya Airport to Land of Legends. Fixed price, 35 min, 40 km. Professional driver, luxury vehicle. Book now!',
  'Privater VIP-Transfer vom Flughafen Antalya zum Land of Legends. Festpreis, 35 Min, 40 km. Professioneller Fahrer, Luxusfahrzeug. Jetzt buchen!',
  'Prywatny transfer VIP z lotniska w Antalyi do Land of Legends. Stała cena, 35 min, 40 km. Profesjonalny kierowca, luksusowy pojazd. Zarezerwuj teraz!',
  'Частный VIP-трансфер из аэропорта Антальи в Land of Legends. Фиксированная цена, 35 мин, 40 км. Профессиональный водитель, люксовый автомобиль. Забронируйте!',

  40.0,   -- distance_km
  35,     -- duration_minutes
  true,   -- is_popular
  true,   -- is_active
  5       -- sort_order
)
ON CONFLICT (slug) DO UPDATE SET
  name_tr = EXCLUDED.name_tr,
  name_en = EXCLUDED.name_en,
  description_en = EXCLUDED.description_en,
  meta_title_en = EXCLUDED.meta_title_en,
  meta_description_en = EXCLUDED.meta_description_en,
  distance_km = EXCLUDED.distance_km,
  duration_minutes = EXCLUDED.duration_minutes,
  is_popular = EXCLUDED.is_popular;


-- =============================================
-- Land of Legends Blog Post (5 languages)
-- =============================================
INSERT INTO blog_posts (
  slug,
  title_tr, title_en, title_de, title_pl, title_ru,
  content_tr, content_en, content_de, content_pl, content_ru,
  image_url,
  is_published,
  published_at
) VALUES (
  'land-of-legends-transfer-rehberi',

  -- titles
  'Land of Legends Transfer Rehberi: Antalya Havalimanından Nasıl Gidilir?',
  'Land of Legends Transfer Guide: How to Get from Antalya Airport',
  'Land of Legends Transfer Guide: Vom Flughafen Antalya zum Erlebnispark',
  'Transfer do Land of Legends: Jak Dostać Się z Lotniska Antalya',
  'Трансфер в Land of Legends: Как Добраться из Аэропорта Антальи',

  -- content_tr
  '<h2>Land of Legends Nerede?</h2>
<p>Land of Legends, Antalya''nın Belek ilçesinde yer alan, 5 milyondan fazla ziyaretçiyi ağırlayan dünyanın en büyük eğlence parklarından biridir. Aqua Park, Kingdom Hotel, alışveriş merkezi ve onlarca eğlence alanından oluşan devasa kompleks, ailelerin en gözde tatil destinasyonlarından biridir.</p>

<h2>Antalya Havalimanından Land of Legends''a Nasıl Gidilir?</h2>
<p>Antalya Havalimanı (AYT), Land of Legends''a yaklaşık <strong>40 km</strong> uzaklıktadır. Havalimanı çıkışından itibaren yaklaşık <strong>35 dakika</strong> sürer. Ulaşım seçenekleri şunlardır:</p>
<ul>
  <li><strong>Özel VIP Transfer (Tavsiye edilir):</strong> Sabit fiyat, doğrudan kapıdan kapıya servis. Bekleme yok, pazarlık yok.</li>
  <li><strong>Taksi:</strong> Taksimetre ile değişken fiyat, bagaj için ek ücret olabilir.</li>
  <li><strong>Servis otobüsü:</strong> Aktarmalı, yavaş ve konforsuzdur.</li>
</ul>

<h2>Neden Özel Transfer Seçmelisiniz?</h2>
<p>Land of Legends genellikle büyük aile gruplarıyla ya da çocuklarla ziyaret edilir. Havalimanında yorgun düşen bir aile için VIP transfer en rahat ve ekonomik seçenektir. TORVIAN Transfer ile:</p>
<ul>
  <li>Sabit, şeffaf fiyat (gizli ücret yok)</li>
  <li>Klimalı, lüks araç</li>
  <li>Uçuş takibi: gecikmeniz olsa da şoförünüz sizi bekler</li>
  <li>Bebek koltuğu talep edebilirsiniz</li>
  <li>WhatsApp ile 7/24 iletişim</li>
</ul>

<h2>Land of Legends Transfer Fiyatları</h2>
<p>Antalya Havalimanı - Land of Legends transfer fiyatlarımız araç tipine göre değişmektedir. Ekonomi, VIP sedan ve minivan seçeneklerimiz mevcuttur. Güncel fiyatlar için hemen rezervasyon formunu kullanın ya da WhatsApp''tan ulaşın.</p>

<h2>Land of Legends Hakkında Bilmeniz Gerekenler</h2>
<p>Parkın içinde konaklama yapıyorsanız (Kingdom Hotel), araçla park girişine kadar bırakılırsınız. Günübirlik ziyaretçiler için ise Aqua Park girişi başlangıç noktasıdır. Ziyaret öncesinde parktaki zaman kısıtlamalarını göz önünde bulundurun; erken gitmeniz önerilir.</p>',

  -- content_en
  '<h2>Where is Land of Legends?</h2>
<p>Land of Legends is one of the world''s largest entertainment complexes, located in Belek, Antalya, welcoming over 5 million visitors annually. The massive complex includes an Aqua Park, Kingdom Hotel, shopping mall, and dozens of entertainment zones — making it a top family destination in Turkey.</p>

<h2>How to Get from Antalya Airport to Land of Legends</h2>
<p>Antalya Airport (AYT) is approximately <strong>40 km</strong> from Land of Legends. The journey takes around <strong>35 minutes</strong> by car. Your transport options are:</p>
<ul>
  <li><strong>Private VIP Transfer (Recommended):</strong> Fixed price, direct door-to-door service. No waiting, no haggling.</li>
  <li><strong>Taxi:</strong> Metered fare, variable cost, possible surcharges for luggage.</li>
  <li><strong>Shuttle bus:</strong> Requires transfers, slower and less comfortable.</li>
</ul>

<h2>Why Choose a Private Transfer?</h2>
<p>Land of Legends is typically visited with family groups or children. After a long flight, a VIP transfer is the most comfortable and cost-effective option. With TORVIAN Transfer you get:</p>
<ul>
  <li>Fixed, transparent pricing (no hidden fees)</li>
  <li>Air-conditioned, luxury vehicle</li>
  <li>Flight tracking: your driver waits even if your flight is delayed</li>
  <li>Child seat available on request</li>
  <li>24/7 WhatsApp support</li>
</ul>

<h2>Land of Legends Transfer Prices</h2>
<p>Our Antalya Airport to Land of Legends transfer prices vary by vehicle type. We offer Economy, VIP Sedan, and Minivan options. Use the booking form for current prices or contact us via WhatsApp.</p>

<h2>What You Should Know About Land of Legends</h2>
<p>If you are staying at the Kingdom Hotel inside the park, you will be dropped off at the hotel entrance. Day visitors are typically dropped at the Aqua Park entrance. Plan to arrive early to make the most of your visit.</p>',

  -- content_de
  '<h2>Wo liegt Land of Legends?</h2>
<p>Land of Legends ist einer der größten Freizeitparks der Welt und befindet sich in Belek, Antalya. Jährlich besuchen über 5 Millionen Menschen den riesigen Komplex mit Aqua Park, Kingdom Hotel, Einkaufszentrum und Dutzenden von Attraktionen.</p>

<h2>Vom Flughafen Antalya zum Land of Legends</h2>
<p>Der Flughafen Antalya (AYT) liegt etwa <strong>40 km</strong> vom Land of Legends entfernt. Die Fahrt dauert ungefähr <strong>35 Minuten</strong>. Ihre Transportmöglichkeiten:</p>
<ul>
  <li><strong>Privater VIP-Transfer (Empfohlen):</strong> Festpreis, direkter Tür-zu-Tür-Service.</li>
  <li><strong>Taxi:</strong> Taxameter-Tarif, variable Kosten.</li>
  <li><strong>Shuttle-Bus:</strong> Umsteigen erforderlich, langsamer und weniger komfortabel.</li>
</ul>

<h2>Warum einen Privattransfer wählen?</h2>
<p>Mit TORVIAN Transfer profitieren Sie von Festpreisen, Flugverfolgung, klimatisierten Luxusfahrzeugen und 24/7 WhatsApp-Support. Kindersitze auf Anfrage erhältlich.</p>

<h2>Wissenswertes über Land of Legends</h2>
<p>Hotelgäste des Kingdom Hotels werden direkt am Hoteleingang abgesetzt. Tagesgäste steigen am Aqua-Park-Eingang aus. Planen Sie eine frühzeitige Ankunft für den besten Erlebnistag.</p>',

  -- content_pl
  '<h2>Gdzie znajduje się Land of Legends?</h2>
<p>Land of Legends to jeden z największych parków rozrywki na świecie, położony w Belek w Antalyi. Rocznie odwiedza go ponad 5 milionów gości. Kompleks obejmuje Aqua Park, Kingdom Hotel, centrum handlowe i dziesiątki stref atrakcji.</p>

<h2>Jak dostać się z lotniska Antalya do Land of Legends?</h2>
<p>Lotnisko Antalya (AYT) znajduje się około <strong>40 km</strong> od Land of Legends. Podróż zajmuje około <strong>35 minut</strong>. Opcje transportu:</p>
<ul>
  <li><strong>Prywatny transfer VIP (Zalecany):</strong> Stała cena, bezpośredni serwis „od drzwi do drzwi".</li>
  <li><strong>Taksówka:</strong> Taryfikator, zmienny koszt.</li>
  <li><strong>Bus wahadłowy:</strong> Przesiadki, wolniejszy i mniej wygodny.</li>
</ul>

<h2>Dlaczego wybrać prywatny transfer?</h2>
<p>Z TORVIAN Transfer otrzymujesz stałe ceny, śledzenie lotu, klimatyzowane pojazdy luksusowe i wsparcie WhatsApp 24/7. Foteliki dziecięce dostępne na życzenie.</p>

<h2>Co warto wiedzieć o Land of Legends?</h2>
<p>Goście Kingdom Hotel są dowożeni bezpośrednio do wejścia hotelowego. Goście jednodniowi wysiadają przy wejściu do Aqua Parku. Zalecamy przyjazd wcześnie rano.</p>',

  -- content_ru
  '<h2>Где находится Land of Legends?</h2>
<p>Land of Legends — один из крупнейших парков развлечений в мире, расположенный в Белеке (Анталья). Ежегодно его посещают более 5 миллионов гостей. Комплекс включает Aqua Park, Kingdom Hotel, торговый центр и десятки аттракционов.</p>

<h2>Как добраться из аэропорта Антальи в Land of Legends?</h2>
<p>Аэропорт Антальи (AYT) находится примерно в <strong>40 км</strong> от Land of Legends. Время в пути — около <strong>35 минут</strong>. Варианты транспорта:</p>
<ul>
  <li><strong>Частный VIP-трансфер (Рекомендуется):</strong> Фиксированная цена, доставка от двери до двери.</li>
  <li><strong>Такси:</strong> Счётчик, переменная стоимость.</li>
  <li><strong>Шаттл-автобус:</strong> Пересадки, медленнее и менее комфортно.</li>
</ul>

<h2>Почему стоит выбрать частный трансфер?</h2>
<p>С TORVIAN Transfer вы получаете фиксированные цены, отслеживание рейса, кондиционированные люксовые автомобили и круглосуточную поддержку в WhatsApp. Детские кресла доступны по запросу.</p>

<h2>Что нужно знать о Land of Legends?</h2>
<p>Гости Kingdom Hotel доставляются прямо к входу в отель. Однодневные посетители выходят у входа в Aqua Park. Рекомендуем приехать пораньше.</p>',

  -- image
  '/images/blog/land-of-legends.jpg',

  true,   -- is_published
  NOW()   -- published_at
)
ON CONFLICT (slug) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  content_en = EXCLUDED.content_en,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at;
