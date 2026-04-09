-- =============================================
-- TORVIAN TRANSFER — SEO Title & Meta Optimization
-- Based on Google Trends 2025 analysis
-- Updates: blog titles (add year), region meta tags
-- =============================================

-- ============================================
-- PART 1: Blog Title Optimization (add 2026 freshness + trending keywords)
-- ============================================

-- Post 1: Add "VIP" and "2026"
UPDATE blog_posts SET
  title_tr = 'Antalya Havalimanı VIP Transfer Rehberi 2026: Uçuştan Otelinize Sorunsuz Ulaşım',
  title_en = 'Antalya Airport VIP Transfer Guide 2026: Seamless Journey From Flight to Hotel',
  title_de = 'Antalya Flughafen Transfer 2026: Stressfreie VIP-Fahrt vom Flug zum Hotel',
  title_pl = 'Transfer VIP z Lotniska Antalya 2026: Bezproblemowa Podróż do Hotelu',
  title_ru = 'VIP Трансфер из Аэропорта Анталии 2026: Комфортный Путь до Отеля'
WHERE slug = 'antalya-havalimani-transfer-rehberi';

-- Post 2: Add "VIP" and "2026"
UPDATE blog_posts SET
  title_tr = 'Belek Golf Otelleri VIP Transfer 2026: Havalimanından Sahaya Lüks Yolculuk',
  title_en = 'Belek Golf Resort VIP Transfer 2026: Luxury Ride From Airport to Fairway',
  title_de = 'Belek Golf-Resort VIP Transfer 2026: Luxusfahrt vom Flughafen zum Fairway',
  title_pl = 'Transfer VIP do Kurortów Golfowych Belek 2026: Luksusowa Podróż',
  title_ru = 'VIP Трансфер в Гольф-Курорты Белека 2026: Роскошная Поездка'
WHERE slug = 'belek-golf-otelleri-transfer';

-- Post 3: Add "2026"
UPDATE blog_posts SET
  title_tr = 'VIP Transfer mi Shuttle mı? Antalya Havalimanı Ulaşım Karşılaştırması 2026',
  title_en = 'VIP Transfer vs Shuttle: Antalya Airport Transport Comparison 2026',
  title_de = 'VIP-Transfer oder Shuttle? Antalya Flughafen Transport Vergleich 2026',
  title_pl = 'Transfer VIP czy Shuttle? Porównanie Transportu na Lotnisku Antalya 2026',
  title_ru = 'VIP-Трансфер или Шаттл? Сравнение Транспорта Анталии 2026'
WHERE slug = 'vip-transfer-mi-shuttle-mi';

-- Post 4: Add "VIP" and "2026"
UPDATE blog_posts SET
  title_tr = 'Aileler İçin Antalya VIP Transfer İpuçları 2026: Çocuklu Seyahat Rehberi',
  title_en = 'Family VIP Transfer Tips Antalya Airport 2026: Traveling With Kids Guide',
  title_de = 'VIP-Transfer Tipps für Familien Antalya 2026: Reisen mit Kindern',
  title_pl = 'Wskazówki VIP Transfer dla Rodzin Antalya 2026: Podróż z Dziećmi',
  title_ru = 'VIP Трансфер для Семей Анталия 2026: Путешествие с Детьми'
WHERE slug = 'aileler-icin-antalya-transfer-ipuclari';

-- Post 5: Side declining in trends, just add "2026" for freshness
UPDATE blog_posts SET
  title_tr = 'Side Antik Kent''e VIP Transfer 2026: Tarih ve Denizin Buluştuğu Nokta',
  title_en = 'Transfer to Side Ancient City 2026: Where History Meets the Sea',
  title_de = 'VIP Transfer nach Side 2026: Die Antike Stadt am Mittelmeer',
  title_pl = 'Transfer VIP do Starożytnego Side 2026: Gdzie Historia Spotyka Morze',
  title_ru = 'VIP Трансфер в Античный Сиде 2026: Где История Встречает Море'
WHERE slug = 'side-antik-kent-transfer';

-- Post 6: Add "VIP" and "2026"
UPDATE blog_posts SET
  title_tr = 'Kışın Antalya''ya VIP Transfer Rehberi 2026: Havalimanı Ulaşım ve Kış Rotaları',
  title_en = 'Winter Holiday in Antalya 2026: VIP Airport Transfer Guide and Winter Routes',
  title_de = 'Winterurlaub Antalya 2026: VIP Flughafen-Transfer und Winterrouten',
  title_pl = 'Zimowe Wakacje Antalya 2026: VIP Transfer z Lotniska i Trasy Zimowe',
  title_ru = 'Зимний Отдых Анталия 2026: VIP Трансфер из Аэропорта и Зимние Маршруты'
WHERE slug = 'kis-antalya-tatil-transfer';


-- ============================================
-- PART 2: Region meta_title & meta_description SEO Optimization
-- Targeting trending long-tail keywords per region
-- ============================================

-- First, add the columns if they don't exist
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Kemer (BREAKOUT keyword!)
UPDATE regions SET
  meta_title = 'Kemer VIP Transfer | Antalya Havalimanı Kemer Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Kemer''e VIP özel transfer. Beldibi, Göynük, Kemer merkez, Çamyuva, Tekirova. Sabit fiyat, uçuş takibi, ücretsiz bebek koltuğu. Online rezervasyon.'
WHERE slug = 'kemer';

-- Belek (weather +80%, belek still popular)
UPDATE regions SET
  meta_title = 'Belek VIP Transfer | Antalya Havalimanı Belek Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Belek''e 30 dakikada VIP transfer. Golf otelleri, lüks tatil köyleri. Sabit fiyat, 7/24 hizmet. Şimdi online rezervasyon yapın.'
WHERE slug = 'belek';

-- Alanya (Russian market interest)
UPDATE regions SET
  meta_title = 'Alanya VIP Transfer | Antalya Havalimanı Alanya Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Alanya''ya VIP özel transfer. Mahmutlar, Oba, Kestel, Konaklı, Avsallar dahil. Sabit fiyat, ücretsiz bebek koltuğu, uçuş takibi.'
WHERE slug = 'alanya';

-- Side (declining but still maintain)
UPDATE regions SET
  meta_title = 'Side VIP Transfer | Antalya Havalimanı Side Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Side''ye VIP transfer. Manavgat, Kumköy, Titreyengöl, Sorgun dahil. Antik kent manzaralı rota. Sabit fiyat, online rezervasyon.'
WHERE slug = 'side';

-- Lara
UPDATE regions SET
  meta_title = 'Lara VIP Transfer | Antalya Havalimanı Lara Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Lara''ya sadece 15 dakikada VIP transfer. Lara plajı, 5 yıldızlı oteller. En yakın tatil bölgesi. Sabit fiyat garantisi.'
WHERE slug = 'lara';

-- Kundu
UPDATE regions SET
  meta_title = 'Kundu VIP Transfer | Antalya Havalimanı Kundu Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Kundu''ya VIP özel transfer. Tema park otelleri, aile dostu tatil köyleri. Sabit fiyat, 7/24 hizmet, ücretsiz bebek koltuğu.'
WHERE slug = 'kundu';

-- Antalya City Center
UPDATE regions SET
  meta_title = 'Antalya Şehir Merkezi VIP Transfer | Havalimanı Kaleiçi Transfer 2026',
  meta_description = 'Antalya Havalimanından şehir merkezine VIP transfer. Kaleiçi, Konyaaltı, Muratpaşa. Havaş alternatifi — kapıdan kapıya, sabit fiyat.'
WHERE slug = 'antalya-city-center';

-- Kaş
UPDATE regions SET
  meta_title = 'Kaş VIP Transfer | Antalya Havalimanı Kaş Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Kaş''a VIP özel transfer. 3 saatlik konforlu yolculuk, muhteşem sahil manzarası. Sabit fiyat, gece-gündüz aynı.'
WHERE slug = 'kas';

-- Konyaaltı
UPDATE regions SET
  meta_title = 'Konyaaltı VIP Transfer | Antalya Havalimanı Konyaaltı Transfer 2026',
  meta_description = 'Antalya Havalimanından Konyaaltı''na VIP transfer. Ünlü konyaaltı plajı, şehir kenarı oteller. 20 dakika mesafe, sabit fiyat.'
WHERE slug = 'konyaalti';

-- Manavgat
UPDATE regions SET
  meta_title = 'Manavgat VIP Transfer | Antalya Havalimanı Manavgat Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Manavgat''a VIP transfer. Manavgat Şelalesi, pazar ve doğal güzellikler. Sabit fiyat, online rezervasyon.'
WHERE slug = 'manavgat';

-- Beldibi (part of Kemer, but separate region)
UPDATE regions SET
  meta_title = 'Beldibi VIP Transfer | Antalya Havalimanı Beldibi Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Beldibi''ye VIP transfer. Kemer''in en yakın bölgesi, 35 dakika. Sabit fiyat, ücretsiz bebek koltuğu.'
WHERE slug = 'beldibi';

-- Göynük
UPDATE regions SET
  meta_title = 'Göynük VIP Transfer | Antalya Havalimanı Göynük Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Göynük''e VIP transfer. Göynük Kanyonu, butik oteller. 38 dakika mesafe, sabit fiyat.'
WHERE slug = 'goynuk';

-- Tekirova
UPDATE regions SET
  meta_title = 'Tekirova VIP Transfer | Antalya Havalimanı Tekirova Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Tekirova''ya VIP transfer. Olympos, Tahtalı Dağı, lüks tatil köyleri. 55 dakika, sabit fiyat.'
WHERE slug = 'tekirova';

-- Okurcalar
UPDATE regions SET
  meta_title = 'Okurcalar VIP Transfer | Antalya Havalimanı Okurcalar Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Okurcalar''a VIP transfer. Alanya-Side arası popüler tatil bölgesi. Sabit fiyat, online rezervasyon.'
WHERE slug = 'okurcalar';

-- Avsallar
UPDATE regions SET
  meta_title = 'Avsallar VIP Transfer | Antalya Havalimanı Avsallar Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Avsallar''a VIP transfer. İncekum plajı, aile otelleri. Sabit fiyat, ücretsiz bebek koltuğu.'
WHERE slug = 'avsallar';

-- Mahmutlar
UPDATE regions SET
  meta_title = 'Mahmutlar VIP Transfer | Antalya Havalimanı Mahmutlar Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Mahmutlar''a VIP özel transfer. Alanya''nın popüler bölgesi, uzun sahiller. Sabit fiyat, 7/24 hizmet.'
WHERE slug = 'mahmutlar';

-- Gazipaşa
UPDATE regions SET
  meta_title = 'Gazipaşa VIP Transfer | Antalya Havalimanı Gazipaşa Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Gazipaşa''ya VIP transfer. Doğu Antalya''nın sakin tatil bölgesi. Sabit fiyat, online rezervasyon.'
WHERE slug = 'gazipasa';

-- Olympos
UPDATE regions SET
  meta_title = 'Olympos VIP Transfer | Antalya Havalimanı Olympos Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Olympos''a VIP transfer. Antik kent, Yanartaş, treehouse oteller. Sabit fiyat, doğa yolculuğu.'
WHERE slug = 'olympos';

-- Çıralı
UPDATE regions SET
  meta_title = 'Çıralı VIP Transfer | Antalya Havalimanı Çıralı Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Çıralı''ya VIP transfer. Caretta caretta plajı, butik pansiyonlar. Doğa kaçamağı, sabit fiyat.'
WHERE slug = 'cirali';

-- Adrasan
UPDATE regions SET
  meta_title = 'Adrasan VIP Transfer | Antalya Havalimanı Adrasan Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Adrasan''a VIP transfer. Sakin koy, kristal deniz, doğa tatili. Sabit fiyat, uçuş takibi.'
WHERE slug = 'adrasan';

-- Demre
UPDATE regions SET
  meta_title = 'Demre VIP Transfer | Antalya Havalimanı Demre Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Demre''ye VIP transfer. Noel Baba Kilisesi, Myra antik kenti, Kekova. Sabit fiyat, online rezervasyon.'
WHERE slug = 'demre';

-- Finike
UPDATE regions SET
  meta_title = 'Finike VIP Transfer | Antalya Havalimanı Finike Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Finike''ye VIP transfer. Portakal bahçeleri, sakin liman kasabası. Sabit fiyat, kapıdan kapıya hizmet.'
WHERE slug = 'finike';

-- Kumluca
UPDATE regions SET
  meta_title = 'Kumluca VIP Transfer | Antalya Havalimanı Kumluca Özel Transfer 2026',
  meta_description = 'Antalya Havalimanından Kumluca''ya VIP transfer. Sera bölgesi, Adrasan''a kapı. Sabit fiyat, online rezervasyon.'
WHERE slug = 'kumluca';
