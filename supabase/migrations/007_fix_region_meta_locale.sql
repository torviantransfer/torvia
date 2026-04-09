-- =============================================
-- TORVIAN TRANSFER — Fix Region Meta SEO (locale columns)
-- Code uses meta_title_{locale} and meta_description_{locale}
-- Previous 006 wrote to wrong generic columns
-- This fixes by writing to locale-specific columns
-- =============================================

-- Drop the wrongly-added generic columns
ALTER TABLE regions DROP COLUMN IF EXISTS meta_title;
ALTER TABLE regions DROP COLUMN IF EXISTS meta_description;

-- ============================================
-- KEMER (BREAKOUT keyword!)
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Kemer VIP Transfer | Antalya Havalimanı Kemer Özel Transfer 2026',
  meta_title_en = 'Kemer VIP Transfer | Antalya Airport to Kemer Private Transfer 2026',
  meta_title_de = 'Kemer VIP Transfer | Flughafen Antalya Kemer Privattransfer 2026',
  meta_title_pl = 'Kemer VIP Transfer | Lotnisko Antalya do Kemer Prywatny Transfer 2026',
  meta_title_ru = 'VIP Трансфер в Кемер | Аэропорт Анталии — Кемер 2026',
  meta_description_tr = 'Antalya Havalimanından Kemer''e VIP özel transfer. Beldibi, Göynük, Kemer merkez, Çamyuva, Tekirova. Sabit fiyat, uçuş takibi, ücretsiz bebek koltuğu.',
  meta_description_en = 'VIP private transfer from Antalya Airport to Kemer. Beldibi, Göynük, Kemer center, Çamyuva, Tekirova. Fixed price, flight tracking, free child seats.',
  meta_description_de = 'VIP Privattransfer vom Flughafen Antalya nach Kemer. Beldibi, Göynük, Çamyuva, Tekirova. Festpreis, Flugüberwachung, kostenlose Kindersitze.',
  meta_description_pl = 'Prywatny transfer VIP z lotniska Antalya do Kemer. Beldibi, Göynük, Çamyuva, Tekirova. Stała cena, monitoring lotu, darmowe foteliki.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Кемер. Бельдиби, Гёйнюк, Чамьюва, Текирова. Фиксированная цена, отслеживание рейса, детские кресла бесплатно.'
WHERE slug = 'kemer';

-- ============================================
-- BELEK
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Belek VIP Transfer | Antalya Havalimanı Belek Özel Transfer 2026',
  meta_title_en = 'Belek VIP Transfer | Antalya Airport to Belek Private Transfer 2026',
  meta_title_de = 'Belek VIP Transfer | Flughafen Antalya Belek Privattransfer 2026',
  meta_title_pl = 'Belek VIP Transfer | Lotnisko Antalya do Belek Transfer 2026',
  meta_title_ru = 'VIP Трансфер в Белек | Аэропорт Анталии — Белек 2026',
  meta_description_tr = 'Antalya Havalimanından Belek''e 30 dakikada VIP transfer. Golf otelleri, lüks tatil köyleri. Sabit fiyat, 7/24 hizmet.',
  meta_description_en = 'VIP transfer from Antalya Airport to Belek in just 30 minutes. Golf resorts, luxury hotels. Fixed price, 24/7 service.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Belek in nur 30 Minuten. Golf-Resorts, Luxushotels. Festpreis, 24/7 Service.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Belek w 30 minut. Kurorty golfowe, luksusowe hotele. Stała cena, obsługa 24/7.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Белек за 30 минут. Гольф-курорты, роскошные отели. Фиксированная цена, сервис 24/7.'
WHERE slug = 'belek';

-- ============================================
-- ALANYA
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Alanya VIP Transfer | Antalya Havalimanı Alanya Özel Transfer 2026',
  meta_title_en = 'Alanya VIP Transfer | Antalya Airport to Alanya Private Transfer 2026',
  meta_title_de = 'Alanya VIP Transfer | Flughafen Antalya Alanya Privattransfer 2026',
  meta_title_pl = 'Alanya VIP Transfer | Lotnisko Antalya do Alanyi Transfer 2026',
  meta_title_ru = 'VIP Трансфер в Аланью | Аэропорт Анталии — Аланья 2026',
  meta_description_tr = 'Antalya Havalimanından Alanya''ya VIP özel transfer. Mahmutlar, Oba, Kestel, Konaklı dahil. Sabit fiyat, ücretsiz bebek koltuğu.',
  meta_description_en = 'VIP private transfer from Antalya Airport to Alanya. Mahmutlar, Oba, Kestel, Konaklı included. Fixed price, free child seats.',
  meta_description_de = 'VIP Privattransfer vom Flughafen Antalya nach Alanya. Mahmutlar, Oba, Kestel, Konaklı. Festpreis, kostenlose Kindersitze.',
  meta_description_pl = 'Prywatny transfer VIP z lotniska Antalya do Alanyi. Mahmutlar, Oba, Kestel, Konaklı. Stała cena, darmowe foteliki.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Аланью. Махмутлар, Оба, Кестель, Конаклы. Фиксированная цена, детские кресла бесплатно.'
WHERE slug = 'alanya';

-- ============================================
-- SIDE
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Side VIP Transfer | Antalya Havalimanı Side Özel Transfer 2026',
  meta_title_en = 'Side VIP Transfer | Antalya Airport to Side Private Transfer 2026',
  meta_title_de = 'Side VIP Transfer | Flughafen Antalya Side Privattransfer 2026',
  meta_title_pl = 'Side VIP Transfer | Lotnisko Antalya do Side Transfer 2026',
  meta_title_ru = 'VIP Трансфер в Сиде | Аэропорт Анталии — Сиде 2026',
  meta_description_tr = 'Antalya Havalimanından Side''ye VIP transfer. Manavgat, Kumköy, Titreyengöl, Sorgun dahil. Sabit fiyat, online rezervasyon.',
  meta_description_en = 'VIP transfer from Antalya Airport to Side. Manavgat, Kumköy, Titreyengöl, Sorgun included. Fixed price, online booking.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Side. Manavgat, Kumköy, Titreyengöl, Sorgun. Festpreis, Online-Buchung.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Side. Manavgat, Kumköy, Titreyengöl, Sorgun. Stała cena, rezerwacja online.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Сиде. Манавгат, Кумкёй, Титреенгёль, Соргун. Фиксированная цена, онлайн-бронирование.'
WHERE slug = 'side';

-- ============================================
-- LARA
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Lara VIP Transfer | Antalya Havalimanı Lara Özel Transfer 2026',
  meta_title_en = 'Lara VIP Transfer | Antalya Airport to Lara Private Transfer 2026',
  meta_title_de = 'Lara VIP Transfer | Flughafen Antalya Lara Privattransfer 2026',
  meta_title_pl = 'Lara VIP Transfer | Lotnisko Antalya do Lara Transfer 2026',
  meta_title_ru = 'VIP Трансфер в Лару | Аэропорт Анталии — Лара 2026',
  meta_description_tr = 'Antalya Havalimanından Lara''ya sadece 15 dakikada VIP transfer. Lara plajı, 5 yıldızlı oteller. Sabit fiyat garantisi.',
  meta_description_en = 'VIP transfer from Antalya Airport to Lara in just 15 minutes. Lara Beach, 5-star hotels. Fixed price guarantee.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Lara in nur 15 Minuten. Lara Beach, 5-Sterne-Hotels. Festpreisgarantie.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Lara w 15 minut. Plaża Lara, hotele 5-gwiazdkowe. Gwarancja stałej ceny.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Лару за 15 минут. Пляж Лара, отели 5 звёзд. Гарантия фиксированной цены.'
WHERE slug = 'lara';

-- ============================================
-- KUNDU
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Kundu VIP Transfer | Antalya Havalimanı Kundu Özel Transfer 2026',
  meta_title_en = 'Kundu VIP Transfer | Antalya Airport to Kundu Private Transfer 2026',
  meta_title_de = 'Kundu VIP Transfer | Flughafen Antalya Kundu Privattransfer 2026',
  meta_title_pl = 'Kundu VIP Transfer | Lotnisko Antalya do Kundu Transfer 2026',
  meta_title_ru = 'VIP Трансфер в Кунду | Аэропорт Анталии — Кунду 2026',
  meta_description_tr = 'Antalya Havalimanından Kundu''ya VIP özel transfer. Tema park otelleri, aile dostu tatil köyleri. Sabit fiyat, 7/24 hizmet.',
  meta_description_en = 'VIP transfer from Antalya Airport to Kundu. Theme park hotels, family-friendly resorts. Fixed price, 24/7 service.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Kundu. Themenpark-Hotels, familienfreundliche Resorts. Festpreis, 24/7 Service.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Kundu. Hotele z parkami tematycznymi, kurorty rodzinne. Stała cena, obsługa 24/7.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Кунду. Тематические отели, семейные курорты. Фиксированная цена, сервис 24/7.'
WHERE slug = 'kundu';

-- ============================================
-- ANTALYA CITY CENTER
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Antalya Şehir Merkezi VIP Transfer | Havalimanı Kaleiçi Transfer 2026',
  meta_title_en = 'Antalya City Center VIP Transfer | Airport to Kaleiçi Transfer 2026',
  meta_title_de = 'Antalya Stadtzentrum VIP Transfer | Flughafen Kaleiçi Transfer 2026',
  meta_title_pl = 'Antalya Centrum VIP Transfer | Lotnisko do Kaleiçi 2026',
  meta_title_ru = 'VIP Трансфер в Центр Анталии | Аэропорт — Калеичи 2026',
  meta_description_tr = 'Antalya Havalimanından şehir merkezine VIP transfer. Kaleiçi, Konyaaltı, Muratpaşa. Havaş alternatifi — kapıdan kapıya, sabit fiyat.',
  meta_description_en = 'VIP transfer from Antalya Airport to city center. Kaleiçi, Konyaaltı, Muratpaşa. Havaş alternative — door-to-door, fixed price.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya ins Stadtzentrum. Kaleiçi, Konyaaltı, Muratpaşa. Havaş-Alternative — Tür zu Tür, Festpreis.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do centrum miasta. Kaleiçi, Konyaaltı, Muratpaşa. Alternatywa dla Havaş — od drzwi do drzwi.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в центр города. Калеичи, Коньяалты, Муратпаша. Альтернатива Havaş — от двери до двери.'
WHERE slug = 'antalya-city-center';

-- ============================================
-- KAŞ
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Kaş VIP Transfer | Antalya Havalimanı Kaş Özel Transfer 2026',
  meta_title_en = 'Kaş VIP Transfer | Antalya Airport to Kaş Private Transfer 2026',
  meta_title_de = 'Kaş VIP Transfer | Flughafen Antalya Kaş Privattransfer 2026',
  meta_title_pl = 'Kaş VIP Transfer | Lotnisko Antalya do Kaş Transfer 2026',
  meta_title_ru = 'VIP Трансфер в Каш | Аэропорт Анталии — Каш 2026',
  meta_description_tr = 'Antalya Havalimanından Kaş''a VIP özel transfer. 3 saatlik konforlu yolculuk, muhteşem sahil manzarası. Sabit fiyat.',
  meta_description_en = 'VIP private transfer from Antalya Airport to Kaş. 3-hour comfortable journey with stunning coastal views. Fixed price.',
  meta_description_de = 'VIP Privattransfer vom Flughafen Antalya nach Kaş. 3 Stunden komfortable Fahrt mit atemberaubender Küstenaussicht. Festpreis.',
  meta_description_pl = 'Prywatny transfer VIP z lotniska Antalya do Kaş. 3-godzinna komfortowa podróż z widokami na wybrzeże. Stała cena.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Каш. 3 часа комфортной поездки с потрясающими видами на побережье. Фиксированная цена.'
WHERE slug = 'kas';

-- ============================================
-- KONYAALTI
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Konyaaltı VIP Transfer | Antalya Havalimanı Konyaaltı Transfer 2026',
  meta_title_en = 'Konyaaltı VIP Transfer | Antalya Airport to Konyaaltı Transfer 2026',
  meta_title_de = 'Konyaaltı VIP Transfer | Flughafen Antalya Konyaaltı Transfer 2026',
  meta_title_pl = 'Konyaaltı VIP Transfer | Lotnisko Antalya do Konyaaltı 2026',
  meta_title_ru = 'VIP Трансфер в Коньяалты | Аэропорт Анталии — Коньяалты 2026',
  meta_description_tr = 'Antalya Havalimanından Konyaaltı''na VIP transfer. Konyaaltı plajı, şehir kenarı oteller. 20 dakika mesafe, sabit fiyat.',
  meta_description_en = 'VIP transfer from Antalya Airport to Konyaaltı. Famous Konyaaltı Beach, city-side hotels. 20 minutes, fixed price.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Konyaaltı. Berühmter Konyaaltı-Strand, stadtnahe Hotels. 20 Minuten, Festpreis.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Konyaaltı. Słynna plaża Konyaaltı, hotele blisko miasta. 20 minut, stała cena.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Коньяалты. Знаменитый пляж Коньяалты, городские отели. 20 минут, фиксированная цена.'
WHERE slug = 'konyaalti';

-- ============================================
-- MANAVGAT
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Manavgat VIP Transfer | Antalya Havalimanı Manavgat Özel Transfer 2026',
  meta_title_en = 'Manavgat VIP Transfer | Antalya Airport to Manavgat Transfer 2026',
  meta_title_de = 'Manavgat VIP Transfer | Flughafen Antalya Manavgat Transfer 2026',
  meta_title_pl = 'Manavgat VIP Transfer | Lotnisko Antalya do Manavgat 2026',
  meta_title_ru = 'VIP Трансфер в Манавгат | Аэропорт Анталии — Манавгат 2026',
  meta_description_tr = 'Antalya Havalimanından Manavgat''a VIP transfer. Manavgat Şelalesi, pazar ve doğal güzellikler. Sabit fiyat.',
  meta_description_en = 'VIP transfer from Antalya Airport to Manavgat. Manavgat Waterfall, bazaar and natural beauty. Fixed price.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Manavgat. Manavgat-Wasserfall, Basar und Naturschönheiten. Festpreis.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Manavgat. Wodospad Manavgat, bazar i naturalne piękno. Stała cena.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Манавгат. Водопад Манавгат, базар и природная красота. Фиксированная цена.'
WHERE slug = 'manavgat';

-- ============================================
-- BELDIBI
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Beldibi VIP Transfer | Antalya Havalimanı Beldibi Özel Transfer 2026',
  meta_title_en = 'Beldibi VIP Transfer | Antalya Airport to Beldibi Transfer 2026',
  meta_title_de = 'Beldibi VIP Transfer | Flughafen Antalya Beldibi Transfer 2026',
  meta_title_pl = 'Beldibi VIP Transfer | Lotnisko Antalya do Beldibi 2026',
  meta_title_ru = 'VIP Трансфер в Бельдиби | Аэропорт Анталии — Бельдиби 2026',
  meta_description_tr = 'Antalya Havalimanından Beldibi''ye VIP transfer. Kemer''in en yakın bölgesi, 35 dakika. Sabit fiyat, bebek koltuğu ücretsiz.',
  meta_description_en = 'VIP transfer from Antalya Airport to Beldibi. Closest Kemer area, 35 minutes. Fixed price, free child seats.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Beldibi. Nächster Kemer-Bereich, 35 Minuten. Festpreis, kostenlose Kindersitze.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Beldibi. Najbliższy rejon Kemer, 35 minut. Stała cena, darmowe foteliki.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Бельдиби. Ближайший район Кемера, 35 минут. Фиксированная цена, детские кресла бесплатно.'
WHERE slug = 'beldibi';

-- ============================================
-- GÖYNÜK
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Göynük VIP Transfer | Antalya Havalimanı Göynük Özel Transfer 2026',
  meta_title_en = 'Göynük VIP Transfer | Antalya Airport to Göynük Transfer 2026',
  meta_title_de = 'Göynük VIP Transfer | Flughafen Antalya Göynük Transfer 2026',
  meta_title_pl = 'Göynük VIP Transfer | Lotnisko Antalya do Göynük 2026',
  meta_title_ru = 'VIP Трансфер в Гёйнюк | Аэропорт Анталии — Гёйнюк 2026',
  meta_description_tr = 'Antalya Havalimanından Göynük''e VIP transfer. Göynük Kanyonu, butik oteller. 38 dakika, sabit fiyat.',
  meta_description_en = 'VIP transfer from Antalya Airport to Göynük. Göynük Canyon, boutique hotels. 38 minutes, fixed price.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Göynük. Göynük-Schlucht, Boutique-Hotels. 38 Minuten, Festpreis.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Göynük. Kanion Göynük, butikowe hotele. 38 minut, stała cena.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Гёйнюк. Каньон Гёйнюк, бутик-отели. 38 минут, фиксированная цена.'
WHERE slug = 'goynuk';

-- ============================================
-- TEKIROVA
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Tekirova VIP Transfer | Antalya Havalimanı Tekirova Özel Transfer 2026',
  meta_title_en = 'Tekirova VIP Transfer | Antalya Airport to Tekirova Transfer 2026',
  meta_title_de = 'Tekirova VIP Transfer | Flughafen Antalya Tekirova Transfer 2026',
  meta_title_pl = 'Tekirova VIP Transfer | Lotnisko Antalya do Tekirova 2026',
  meta_title_ru = 'VIP Трансфер в Текирову | Аэропорт Анталии — Текирова 2026',
  meta_description_tr = 'Antalya Havalimanından Tekirova''ya VIP transfer. Olympos, Tahtalı Dağı, lüks tatil köyleri. 55 dakika, sabit fiyat.',
  meta_description_en = 'VIP transfer from Antalya Airport to Tekirova. Olympos, Tahtalı Mountain, luxury resorts. 55 minutes, fixed price.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Tekirova. Olympos, Tahtalı-Berg, Luxusresorts. 55 Minuten, Festpreis.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Tekirova. Olympos, Góra Tahtalı, luksusowe kurorty. 55 minut, stała cena.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Текирову. Олимпос, гора Тахталы, люкс-курорты. 55 минут, фиксированная цена.'
WHERE slug = 'tekirova';

-- ============================================
-- OKURCALAR
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Okurcalar VIP Transfer | Antalya Havalimanı Okurcalar Özel Transfer 2026',
  meta_title_en = 'Okurcalar VIP Transfer | Antalya Airport to Okurcalar Transfer 2026',
  meta_title_de = 'Okurcalar VIP Transfer | Flughafen Antalya Okurcalar Transfer 2026',
  meta_title_pl = 'Okurcalar VIP Transfer | Lotnisko Antalya do Okurcalar 2026',
  meta_title_ru = 'VIP Трансфер в Окурджалар | Аэропорт Анталии — Окурджалар 2026',
  meta_description_tr = 'Antalya Havalimanından Okurcalar''a VIP transfer. Alanya-Side arası popüler tatil bölgesi. Sabit fiyat, online rezervasyon.',
  meta_description_en = 'VIP transfer from Antalya Airport to Okurcalar. Popular resort between Alanya and Side. Fixed price, online booking.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Okurcalar. Beliebtes Resort zwischen Alanya und Side. Festpreis, Online-Buchung.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Okurcalar. Popularny kurort między Alanyą a Side. Stała cena, rezerwacja online.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Окурджалар. Популярный курорт между Аланьей и Сиде. Фиксированная цена, онлайн-бронирование.'
WHERE slug = 'okurcalar';

-- ============================================
-- AVSALLAR
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Avsallar VIP Transfer | Antalya Havalimanı Avsallar Özel Transfer 2026',
  meta_title_en = 'Avsallar VIP Transfer | Antalya Airport to Avsallar Transfer 2026',
  meta_title_de = 'Avsallar VIP Transfer | Flughafen Antalya Avsallar Transfer 2026',
  meta_title_pl = 'Avsallar VIP Transfer | Lotnisko Antalya do Avsallar 2026',
  meta_title_ru = 'VIP Трансфер в Авсаллар | Аэропорт Анталии — Авсаллар 2026',
  meta_description_tr = 'Antalya Havalimanından Avsallar''a VIP transfer. İncekum plajı, aile otelleri. Sabit fiyat, ücretsiz bebek koltuğu.',
  meta_description_en = 'VIP transfer from Antalya Airport to Avsallar. İncekum Beach, family hotels. Fixed price, free child seats.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Avsallar. İncekum-Strand, Familienhotels. Festpreis, kostenlose Kindersitze.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Avsallar. Plaża İncekum, hotele rodzinne. Stała cena, darmowe foteliki.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Авсаллар. Пляж Инджекум, семейные отели. Фиксированная цена, детские кресла бесплатно.'
WHERE slug = 'avsallar';

-- ============================================
-- MAHMUTLAR
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Mahmutlar VIP Transfer | Antalya Havalimanı Mahmutlar Özel Transfer 2026',
  meta_title_en = 'Mahmutlar VIP Transfer | Antalya Airport to Mahmutlar Transfer 2026',
  meta_title_de = 'Mahmutlar VIP Transfer | Flughafen Antalya Mahmutlar Transfer 2026',
  meta_title_pl = 'Mahmutlar VIP Transfer | Lotnisko Antalya do Mahmutlar 2026',
  meta_title_ru = 'VIP Трансфер в Махмутлар | Аэропорт Анталии — Махмутлар 2026',
  meta_description_tr = 'Antalya Havalimanından Mahmutlar''a VIP özel transfer. Alanya''nın popüler bölgesi, uzun sahiller. Sabit fiyat, 7/24.',
  meta_description_en = 'VIP transfer from Antalya Airport to Mahmutlar. Popular Alanya district, long beaches. Fixed price, 24/7 service.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Mahmutlar. Beliebter Stadtteil von Alanya, lange Strände. Festpreis, 24/7.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Mahmutlar. Popularna dzielnica Alanyi, długie plaże. Stała cena, obsługa 24/7.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Махмутлар. Популярный район Аланьи, длинные пляжи. Фиксированная цена, 24/7.'
WHERE slug = 'mahmutlar';

-- ============================================
-- GAZİPAŞA
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Gazipaşa VIP Transfer | Antalya Havalimanı Gazipaşa Özel Transfer 2026',
  meta_title_en = 'Gazipaşa VIP Transfer | Antalya Airport to Gazipaşa Transfer 2026',
  meta_title_de = 'Gazipaşa VIP Transfer | Flughafen Antalya Gazipaşa Transfer 2026',
  meta_title_pl = 'Gazipaşa VIP Transfer | Lotnisko Antalya do Gazipaşa 2026',
  meta_title_ru = 'VIP Трансфер в Газипашу | Аэропорт Анталии — Газипаша 2026',
  meta_description_tr = 'Antalya Havalimanından Gazipaşa''ya VIP transfer. Doğu Antalya''nın sakin tatil bölgesi. Sabit fiyat.',
  meta_description_en = 'VIP transfer from Antalya Airport to Gazipaşa. Quiet eastern Antalya resort area. Fixed price, online booking.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Gazipaşa. Ruhiges Resort im östlichen Antalya. Festpreis.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Gazipaşa. Cichy kurort we wschodniej Antalyi. Stała cena.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Газипашу. Тихий курорт восточной Анталии. Фиксированная цена.'
WHERE slug = 'gazipasa';

-- ============================================
-- OLYMPOS
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Olympos VIP Transfer | Antalya Havalimanı Olympos Özel Transfer 2026',
  meta_title_en = 'Olympos VIP Transfer | Antalya Airport to Olympos Transfer 2026',
  meta_title_de = 'Olympos VIP Transfer | Flughafen Antalya Olympos Transfer 2026',
  meta_title_pl = 'Olympos VIP Transfer | Lotnisko Antalya do Olympos 2026',
  meta_title_ru = 'VIP Трансфер в Олимпос | Аэропорт Анталии — Олимпос 2026',
  meta_description_tr = 'Antalya Havalimanından Olympos''a VIP transfer. Antik kent, Yanartaş, treehouse oteller. Sabit fiyat, doğa yolculuğu.',
  meta_description_en = 'VIP transfer from Antalya Airport to Olympos. Ancient ruins, Chimera flames, treehouse hotels. Fixed price.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Olympos. Antike Ruinen, Chimera-Flammen, Baumhaushotels. Festpreis.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Olympos. Antyczne ruiny, Chimera, hotele na drzewach. Stała cena.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Олимпос. Античные руины, огни Химеры, отели-деревья. Фиксированная цена.'
WHERE slug = 'olympos';

-- ============================================
-- ÇIRALI
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Çıralı VIP Transfer | Antalya Havalimanı Çıralı Özel Transfer 2026',
  meta_title_en = 'Çıralı VIP Transfer | Antalya Airport to Çıralı Transfer 2026',
  meta_title_de = 'Çıralı VIP Transfer | Flughafen Antalya Çıralı Transfer 2026',
  meta_title_pl = 'Çıralı VIP Transfer | Lotnisko Antalya do Çıralı 2026',
  meta_title_ru = 'VIP Трансфер в Чиралы | Аэропорт Анталии — Чиралы 2026',
  meta_description_tr = 'Antalya Havalimanından Çıralı''ya VIP transfer. Caretta caretta plajı, butik pansiyonlar. Sabit fiyat.',
  meta_description_en = 'VIP transfer from Antalya Airport to Çıralı. Caretta caretta beach, boutique guesthouses. Fixed price.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Çıralı. Caretta-Caretta-Strand, Boutique-Pensionen. Festpreis.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Çıralı. Plaża caretta caretta, butikowe pensjonaty. Stała cena.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Чиралы. Пляж каретта-каретта, бутик-пансионы. Фиксированная цена.'
WHERE slug = 'cirali';

-- ============================================
-- ADRASAN
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Adrasan VIP Transfer | Antalya Havalimanı Adrasan Özel Transfer 2026',
  meta_title_en = 'Adrasan VIP Transfer | Antalya Airport to Adrasan Transfer 2026',
  meta_title_de = 'Adrasan VIP Transfer | Flughafen Antalya Adrasan Transfer 2026',
  meta_title_pl = 'Adrasan VIP Transfer | Lotnisko Antalya do Adrasan 2026',
  meta_title_ru = 'VIP Трансфер в Адрасан | Аэропорт Анталии — Адрасан 2026',
  meta_description_tr = 'Antalya Havalimanından Adrasan''a VIP transfer. Sakin koy, kristal deniz, doğa tatili. Sabit fiyat, uçuş takibi.',
  meta_description_en = 'VIP transfer from Antalya Airport to Adrasan. Quiet bay, crystal sea, nature holiday. Fixed price, flight tracking.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Adrasan. Ruhige Bucht, kristallklares Meer, Natururlaub. Festpreis.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Adrasan. Spokojna zatoka, krystaliczne morze, wakacje na łonie natury. Stała cena.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Адрасан. Тихая бухта, кристальное море, отдых на природе. Фиксированная цена.'
WHERE slug = 'adrasan';

-- ============================================
-- DEMRE
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Demre VIP Transfer | Antalya Havalimanı Demre Özel Transfer 2026',
  meta_title_en = 'Demre VIP Transfer | Antalya Airport to Demre Transfer 2026',
  meta_title_de = 'Demre VIP Transfer | Flughafen Antalya Demre Transfer 2026',
  meta_title_pl = 'Demre VIP Transfer | Lotnisko Antalya do Demre 2026',
  meta_title_ru = 'VIP Трансфер в Демре | Аэропорт Анталии — Демре 2026',
  meta_description_tr = 'Antalya Havalimanından Demre''ye VIP transfer. Noel Baba Kilisesi, Myra antik kenti, Kekova. Sabit fiyat.',
  meta_description_en = 'VIP transfer from Antalya Airport to Demre. St. Nicholas Church, Myra ancient city, Kekova. Fixed price.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Demre. Nikolauskirche, antike Stadt Myra, Kekova. Festpreis.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Demre. Kościół Św. Mikołaja, antyczne Myra, Kekova. Stała cena.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Демре. Церковь Св. Николая, античная Мира, Кекова. Фиксированная цена.'
WHERE slug = 'demre';

-- ============================================
-- FİNİKE
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Finike VIP Transfer | Antalya Havalimanı Finike Özel Transfer 2026',
  meta_title_en = 'Finike VIP Transfer | Antalya Airport to Finike Transfer 2026',
  meta_title_de = 'Finike VIP Transfer | Flughafen Antalya Finike Transfer 2026',
  meta_title_pl = 'Finike VIP Transfer | Lotnisko Antalya do Finike 2026',
  meta_title_ru = 'VIP Трансфер в Финике | Аэропорт Анталии — Финике 2026',
  meta_description_tr = 'Antalya Havalimanından Finike''ye VIP transfer. Portakal bahçeleri, sakin liman kasabası. Sabit fiyat.',
  meta_description_en = 'VIP transfer from Antalya Airport to Finike. Orange groves, peaceful harbor town. Fixed price.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Finike. Orangenhaine, ruhige Hafenstadt. Festpreis.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Finike. Gaje pomarańczowe, spokojna przystań. Stała cena.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Финике. Апельсиновые рощи, тихий портовый город. Фиксированная цена.'
WHERE slug = 'finike';

-- ============================================
-- KUMLUCA
-- ============================================
UPDATE regions SET
  meta_title_tr = 'Kumluca VIP Transfer | Antalya Havalimanı Kumluca Özel Transfer 2026',
  meta_title_en = 'Kumluca VIP Transfer | Antalya Airport to Kumluca Transfer 2026',
  meta_title_de = 'Kumluca VIP Transfer | Flughafen Antalya Kumluca Transfer 2026',
  meta_title_pl = 'Kumluca VIP Transfer | Lotnisko Antalya do Kumluca 2026',
  meta_title_ru = 'VIP Трансфер в Кумлуджу | Аэропорт Анталии — Кумлуджа 2026',
  meta_description_tr = 'Antalya Havalimanından Kumluca''ya VIP transfer. Sera bölgesi, Adrasan''a kapı. Sabit fiyat.',
  meta_description_en = 'VIP transfer from Antalya Airport to Kumluca. Greenhouse region, gateway to Adrasan. Fixed price.',
  meta_description_de = 'VIP Transfer vom Flughafen Antalya nach Kumluca. Gewächshausregion, Tor nach Adrasan. Festpreis.',
  meta_description_pl = 'Transfer VIP z lotniska Antalya do Kumluca. Region szklarniowy, brama do Adrasan. Stała cena.',
  meta_description_ru = 'VIP трансфер из аэропорта Анталии в Кумлуджу. Тепличный регион, ворота в Адрасан. Фиксированная цена.'
WHERE slug = 'kumluca';
