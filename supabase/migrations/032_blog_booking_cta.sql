-- =============================================
-- TORVIAN TRANSFER — Blog Booking CTA Injection
-- Source: Google Search Console + Google Trends (Jun 2026)
--
-- FIX NOTE: All Turkish apostrophes inside SQL string literals
-- are doubled ('den → ''den, 'dan → ''dan) per PostgreSQL escaping rules.
--
-- POSTS TARGETED (all currently published):
--   1. antalya-havalimani-transfer-rehberi
--   2. antalya-alanya-transfer-suresi
--   3. uber-antalya-havalimani-ulasim
--   4. antalya-havalimani-taksi-mi-vip-transfer-mi
--   5-10. Generic CTA: fiyatlari, shuttle, kemer, belek, side, regnum
-- =============================================

-- =============================================
-- 1. antalya-havalimani-transfer-rehberi — generic CTA
-- =============================================
UPDATE blog_posts SET
  content_en = content_en || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Book Your Antalya Airport Transfer Now</h2>
<p style="color:#374151;">Stop searching — book your private VIP transfer in 2 minutes. Fixed price, instant confirmation, free cancellation up to 24h before.</p>
<ul style="color:#374151;padding-left:20px;margin:12px 0;">
<li><strong>Lara / Kundu</strong> — 15 min from airport</li>
<li><strong>Belek</strong> — 30 min from airport, from &euro;35</li>
<li><strong>Kemer</strong> — 40 min from airport, from &euro;40</li>
<li><strong>Side</strong> — 1h 10min from airport, from &euro;45</li>
<li><strong>Alanya</strong> — 2 hours from airport, from &euro;65</li>
</ul>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Mercedes Vito VIP &nbsp;&middot;&nbsp; &#10003; Meet &amp; Greet sign &nbsp;&middot;&nbsp; &#10003; Flight tracking &nbsp;&middot;&nbsp; &#10003; No hidden fees</p>
<a href="/en/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Book Now &#8212; Instant Confirmation &#8594;</a>
</div>',

  content_tr = content_tr || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Antalya Havalimanı Transferinizi Hemen Rezerve Edin</h2>
<p style="color:#374151;">Aramayı bırakın — 2 dakikada VIP ozel transferinizi rezerve edin. Sabit fiyat, anında onay, 24 saat oncesine kadar ucretsiz iptal.</p>
<ul style="color:#374151;padding-left:20px;margin:12px 0;">
<li><strong>Lara / Kundu</strong> — Havalimanına 15 dakika</li>
<li><strong>Belek</strong> — 30 dakika, Euro 35 den baslayan fiyatlar</li>
<li><strong>Kemer</strong> — 40 dakika, Euro 40 dan baslayan fiyatlar</li>
<li><strong>Side</strong> — 1 sa. 10 dk., Euro 45 den baslayan fiyatlar</li>
<li><strong>Alanya</strong> — 2 saat, Euro 65 den baslayan fiyatlar</li>
</ul>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Mercedes Vito VIP &nbsp;&middot;&nbsp; &#10003; Isimli karsilama &nbsp;&middot;&nbsp; &#10003; Ucus takibi &nbsp;&middot;&nbsp; &#10003; Gizli ucret yok</p>
<a href="/tr/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Hemen Rezervasyon Yap &#8594;</a>
</div>',

  content_de = content_de || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Jetzt Ihren Flughafen-Transfer buchen</h2>
<p style="color:#374151;">Hören Sie auf zu suchen &#8212; buchen Sie Ihren VIP-Privattransfer in 2 Minuten. Festpreis, sofortige Bestätigung, kostenlose Stornierung bis 24h vorher.</p>
<ul style="color:#374151;padding-left:20px;margin:12px 0;">
<li><strong>Lara / Kundu</strong> &#8212; 15 Min. vom Flughafen</li>
<li><strong>Belek</strong> &#8212; 30 Min., ab &euro;35</li>
<li><strong>Kemer</strong> &#8212; 40 Min., ab &euro;40</li>
<li><strong>Side</strong> &#8212; 1h 10Min., ab &euro;45</li>
<li><strong>Alanya</strong> &#8212; 2 Stunden, ab &euro;65</li>
</ul>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Mercedes Vito VIP &nbsp;&middot;&nbsp; &#10003; Abholung mit Namensschild &nbsp;&middot;&nbsp; &#10003; Flugverfolgung &nbsp;&middot;&nbsp; &#10003; Kein Nachtzuschlag</p>
<a href="/de/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Jetzt buchen &#8212; Sofortige Bestätigung &#8594;</a>
</div>',

  content_pl = content_pl || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Zarezerwuj Transfer z Lotniska Antalya Teraz</h2>
<p style="color:#374151;">Przestań szukać &#8212; zarezerwuj prywatny transfer VIP w 2 minuty. Stała cena, natychmiastowe potwierdzenie, bezpłatne odwołanie do 24h przed.</p>
<ul style="color:#374151;padding-left:20px;margin:12px 0;">
<li><strong>Lara / Kundu</strong> &#8212; 15 min od lotniska</li>
<li><strong>Belek</strong> &#8212; 30 min, od &euro;35</li>
<li><strong>Kemer</strong> &#8212; 40 min, od &euro;40</li>
<li><strong>Side</strong> &#8212; 1h 10min, od &euro;45</li>
<li><strong>Alanya</strong> &#8212; 2 godziny, od &euro;65</li>
</ul>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Mercedes Vito VIP &nbsp;&middot;&nbsp; &#10003; Spotkanie na lotnisku &nbsp;&middot;&nbsp; &#10003; Śledzenie lotu &nbsp;&middot;&nbsp; &#10003; Bez ukrytych opłat</p>
<a href="/pl/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Rezerwuj Teraz &#8212; Natychmiastowe Potwierdzenie &#8594;</a>
</div>',

  content_ru = content_ru || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Забронируйте Трансфер из Аэропорта Анталии Сейчас</h2>
<p style="color:#374151;">Прекратите поиски &#8212; забронируйте частный VIP-трансфер за 2 минуты. Фиксированная цена, мгновенное подтверждение, бесплатная отмена за 24ч.</p>
<ul style="color:#374151;padding-left:20px;margin:12px 0;">
<li><strong>Лара / Кунду</strong> &#8212; 15 мин от аэропорта</li>
<li><strong>Белек</strong> &#8212; 30 мин, от &euro;35</li>
<li><strong>Кемер</strong> &#8212; 40 мин, от &euro;40</li>
<li><strong>Сиде</strong> &#8212; 1ч 10мин, от &euro;45</li>
<li><strong>Аланья</strong> &#8212; 2 часа, от &euro;65</li>
</ul>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Mercedes Vito VIP &nbsp;&middot;&nbsp; &#10003; Встреча с табличкой &nbsp;&middot;&nbsp; &#10003; Отслеживание рейса &nbsp;&middot;&nbsp; &#10003; Без скрытых доплат</p>
<a href="/ru/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Забронировать &#8212; Мгновенное Подтверждение &#8594;</a>
</div>',

  updated_at = NOW()
WHERE slug = 'antalya-havalimani-transfer-rehberi';

-- =============================================
-- 2. antalya-alanya-transfer-suresi — destination-specific CTA
-- =============================================
UPDATE blog_posts SET
  content_en = content_en || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Book Your Antalya Airport &#8594; Alanya Transfer</h2>
<p style="color:#374151;">Now you know it takes ~2 hours &#8212; lock in your fixed-price private transfer before prices rise. Door-to-door, flight tracking included, driver waits free if your flight is delayed.</p>
<p style="color:#374151;"><strong>From &euro;65 per vehicle</strong> (not per person) &middot; Mercedes Vito VIP &middot; Up to 5 passengers</p>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Fixed price &#8212; no meter, no surprises &nbsp;&middot;&nbsp; &#10003; Free cancellation 24h before &nbsp;&middot;&nbsp; &#10003; Instant confirmation</p>
<a href="/en/alanya-transfer" style="display:inline-block;background:#1D4ED8;color:#ffffff;padding:12px 22px;border-radius:8px;font-weight:600;text-decoration:none;margin-top:8px;margin-right:12px;">View Alanya Transfer &#8594;</a>
<a href="/en/booking?region=alanya" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Book Now &#8212; Instant Confirmation &#8594;</a>
</div>',

  content_tr = content_tr || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Antalya Havalimanı &#8594; Alanya Transferinizi Rezerve Edin</h2>
<p style="color:#374151;">~2 saat surdugunu artık biliyorsunuz &#8212; sabit fiyatlı ozel transferinizi hemen ayırtın. Kapıdan kapıya, ucus takibi dahil, rotar olsa bile soforunuz ucretsiz bekler.</p>
<p style="color:#374151;"><strong>Arac basına euro 65 den</strong> (kisi bası degil) &middot; Mercedes Vito VIP &middot; 5 yolcuya kadar</p>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Sabit fiyat &#8212; taksimetre yok &nbsp;&middot;&nbsp; &#10003; 24 saat oncesine kadar ucretsiz iptal &nbsp;&middot;&nbsp; &#10003; Anında onay</p>
<a href="/tr/alanya-transfer" style="display:inline-block;background:#1D4ED8;color:#ffffff;padding:12px 22px;border-radius:8px;font-weight:600;text-decoration:none;margin-top:8px;margin-right:12px;">Alanya Transfer Sayfası &#8594;</a>
<a href="/tr/booking?region=alanya" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Hemen Rezervasyon Yap &#8594;</a>
</div>',

  content_de = content_de || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Jetzt Transfer Flughafen Antalya &#8594; Alanya buchen</h2>
<p style="color:#374151;">Jetzt wissen Sie: ~2 Stunden Fahrt. Sichern Sie sich Ihren VIP-Privattransfer zum Festpreis. Tür-zu-Tür, Flugverfolgung inklusive &#8212; Fahrer wartet kostenlos bei Verspätung.</p>
<p style="color:#374151;"><strong>Ab &euro;65 pro Fahrzeug</strong> (nicht pro Person) &middot; Mercedes Vito VIP &middot; Bis zu 5 Personen</p>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Festpreis &#8212; kein Taxameter &nbsp;&middot;&nbsp; &#10003; Kostenlose Stornierung 24h &nbsp;&middot;&nbsp; &#10003; Sofortige Bestätigung</p>
<a href="/de/alanya-transfer" style="display:inline-block;background:#1D4ED8;color:#ffffff;padding:12px 22px;border-radius:8px;font-weight:600;text-decoration:none;margin-top:8px;margin-right:12px;">Alanya Transfer ansehen &#8594;</a>
<a href="/de/booking?region=alanya" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Jetzt buchen &#8212; Sofortige Bestätigung &#8594;</a>
</div>',

  content_pl = content_pl || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Zarezerwuj Transfer Lotnisko Antalya &#8594; Alanya</h2>
<p style="color:#374151;">Teraz wiesz &#8212; ~2 godziny. Zarezerwuj prywatny transfer VIP w stałej cenie. Door-to-door, śledzenie lotu w zestawie, kierowca czeka bezpłatnie przy opóźnieniu.</p>
<p style="color:#374151;"><strong>Od &euro;65 za pojazd</strong> (nie za osobę) &middot; Mercedes Vito VIP &middot; Do 5 pasażerów</p>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Stała cena &nbsp;&middot;&nbsp; &#10003; Bezpłatne odwołanie 24h &nbsp;&middot;&nbsp; &#10003; Natychmiastowe potwierdzenie</p>
<a href="/pl/alanya-transfer" style="display:inline-block;background:#1D4ED8;color:#ffffff;padding:12px 22px;border-radius:8px;font-weight:600;text-decoration:none;margin-top:8px;margin-right:12px;">Transfer Alanya &#8594;</a>
<a href="/pl/booking?region=alanya" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Rezerwuj Teraz &#8594;</a>
</div>',

  content_ru = content_ru || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Забронируйте Трансфер Аэропорт Анталия &#8594; Аланья</h2>
<p style="color:#374151;">Теперь вы знаете &#8212; ~2 часа в пути. Зафиксируйте цену на частный VIP-трансфер. От двери до двери, отслеживание рейса включено, водитель ждёт бесплатно при задержке.</p>
<p style="color:#374151;"><strong>От &euro;65 за автомобиль</strong> (не на человека) &middot; Mercedes Vito VIP &middot; До 5 пассажиров</p>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Фиксированная цена &nbsp;&middot;&nbsp; &#10003; Отмена за 24ч &nbsp;&middot;&nbsp; &#10003; Мгновенное подтверждение</p>
<a href="/ru/alanya-transfer" style="display:inline-block;background:#1D4ED8;color:#ffffff;padding:12px 22px;border-radius:8px;font-weight:600;text-decoration:none;margin-top:8px;margin-right:12px;">Трансфер Аланья &#8594;</a>
<a href="/ru/booking?region=alanya" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Забронировать &#8594;</a>
</div>',

  updated_at = NOW()
WHERE slug = 'antalya-alanya-transfer-suresi';

-- =============================================
-- 3. uber-antalya-havalimani-ulasim — orange warning CTA
-- =============================================
UPDATE blog_posts SET
  content_en = content_en || '
<div style="background:#FFF7ED;border:2px solid #FED7AA;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#C2410C;margin-top:0;font-size:1.4rem;">Uber Not Available? Book a Private Transfer Instead</h2>
<p style="color:#374151;">Since Uber has very limited availability in Antalya, most travellers use pre-booked private VIP transfers. Often cheaper than an unmetered airport taxi &#8212; and you know the price before you travel.</p>
<p style="color:#374151;"><strong>Belek from &euro;35 &middot; Kemer from &euro;40 &middot; Side from &euro;45 &middot; Alanya from &euro;65</strong></p>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Fixed price shown at booking &nbsp;&middot;&nbsp; &#10003; Mercedes Vito &nbsp;&middot;&nbsp; &#10003; Flight tracking &nbsp;&middot;&nbsp; &#10003; Free cancellation 24h &nbsp;&middot;&nbsp; &#10003; No cash needed</p>
<a href="/en/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Book Private Transfer &#8212; See Price Instantly &#8594;</a>
</div>',

  content_tr = content_tr || '
<div style="background:#FFF7ED;border:2px solid #FED7AA;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#C2410C;margin-top:0;font-size:1.4rem;">Uber Yok mu? Ozel Transfer Rezerve Edin</h2>
<p style="color:#374151;">Antalya da Uber cok kısıtlı calıstıgından, cogu yolcu onceden rezerve edilmis VIP ozel transfer tercih eder. Genellikle takimetresiz havalimanı taksisinden daha uygun &#8212; ve fiyatı yolculuk oncesinde biliyorsunuz.</p>
<p style="color:#374151;"><strong>Belek &euro;35 &middot; Kemer &euro;40 &middot; Side &euro;45 &middot; Alanya &euro;65</strong></p>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Rezervasyonda sabit fiyat &nbsp;&middot;&nbsp; &#10003; Mercedes Vito &nbsp;&middot;&nbsp; &#10003; Ucus takibi &nbsp;&middot;&nbsp; &#10003; Ucretsiz iptal 24 saat</p>
<a href="/tr/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Ozel Transfer Rezerve Et &#8212; Anında Fiyat &#8594;</a>
</div>',

  content_de = content_de || '
<div style="background:#FFF7ED;border:2px solid #FED7AA;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#C2410C;margin-top:0;font-size:1.4rem;">Kein Uber? Jetzt Privattransfer buchen</h2>
<p style="color:#374151;">Da Uber in Antalya kaum verfügbar ist, nutzen die meisten Reisenden vorgebuchte VIP-Privattransfers. Oft günstiger als ein unversteuertes Flughafen-Taxi &#8212; und der Preis steht vor der Reise fest.</p>
<p style="color:#374151;"><strong>Belek ab &euro;35 &middot; Kemer ab &euro;40 &middot; Side ab &euro;45 &middot; Alanya ab &euro;65</strong></p>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Festpreis bei Buchung &nbsp;&middot;&nbsp; &#10003; Mercedes Vito &nbsp;&middot;&nbsp; &#10003; Flugverfolgung &nbsp;&middot;&nbsp; &#10003; Kostenlose Stornierung 24h</p>
<a href="/de/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Privattransfer buchen &#8212; Preis sofort sehen &#8594;</a>
</div>',

  content_pl = content_pl || '
<div style="background:#FFF7ED;border:2px solid #FED7AA;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#C2410C;margin-top:0;font-size:1.4rem;">Nie ma Ubera? Zarezerwuj Prywatny Transfer</h2>
<p style="color:#374151;">Ponieważ Uber ma bardzo ograniczoną dostępność w Antalyi, większość podróżnych korzysta z prywatnych transferów VIP. Często taniej niż taksówka bez licznika &#8212; a cenę znasz przed wyjazdem.</p>
<p style="color:#374151;"><strong>Belek od &euro;35 &middot; Kemer od &euro;40 &middot; Side od &euro;45 &middot; Alanya od &euro;65</strong></p>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Stała cena przy rezerwacji &nbsp;&middot;&nbsp; &#10003; Mercedes Vito &nbsp;&middot;&nbsp; &#10003; Śledzenie lotu &nbsp;&middot;&nbsp; &#10003; Bezpłatne odwołanie 24h</p>
<a href="/pl/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Zarezerwuj Transfer &#8212; Zobacz Cenę &#8594;</a>
</div>',

  content_ru = content_ru || '
<div style="background:#FFF7ED;border:2px solid #FED7AA;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#C2410C;margin-top:0;font-size:1.4rem;">Нет Uber? Закажите Частный Трансфер</h2>
<p style="color:#374151;">Поскольку Uber почти недоступен в Анталии, большинство путешественников заказывают частные VIP-трансферы заранее. Часто дешевле аэропортового такси без счётчика &#8212; и цену вы знаете до поездки.</p>
<p style="color:#374151;"><strong>Белек от &euro;35 &middot; Кемер от &euro;40 &middot; Сиде от &euro;45 &middot; Аланья от &euro;65</strong></p>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Фиксированная цена &nbsp;&middot;&nbsp; &#10003; Mercedes Vito &nbsp;&middot;&nbsp; &#10003; Отслеживание рейса &nbsp;&middot;&nbsp; &#10003; Отмена за 24ч</p>
<a href="/ru/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Заказать Трансфер &#8212; Увидеть Цену &#8594;</a>
</div>',

  updated_at = NOW()
WHERE slug = 'uber-antalya-havalimani-ulasim';

-- =============================================
-- 4. antalya-havalimani-taksi-mi-vip-transfer-mi
-- =============================================
UPDATE blog_posts SET
  content_en = content_en || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Ready to Skip the Taxi Queue? Book Your Private Transfer</h2>
<p style="color:#374151;">You have seen the comparison. Private VIP transfer wins on price, comfort, and peace of mind. Book yours now &#8212; takes 2 minutes, instant confirmation.</p>
<p style="color:#374151;"><strong>Belek from &euro;35 &middot; Side from &euro;45 &middot; Alanya from &euro;65 &middot; Kas from &euro;85</strong> &#8212; per vehicle, not per person.</p>
<p style="color:#6B7280;font-size:0.9rem;">&#10003; Fixed price &#8212; no meter surprises &nbsp;&middot;&nbsp; &#10003; Flight tracking, driver waits free &nbsp;&middot;&nbsp; &#10003; Free cancellation 24h</p>
<a href="/en/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Book Private Transfer Now &#8594;</a>
</div>',

  content_tr = content_tr || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Taksi Kuyrugunu Atlamaya Hazır mısınız?</h2>
<p style="color:#374151;">Karsılastırmayı gordunus. Fiyat, konfor ve huzur acısından ozel VIP transfer kazanır. Simdi rezervasyon yapın &#8212; 2 dakika surer, anında onay gelir.</p>
<p style="color:#374151;"><strong>Belek &euro;35 &middot; Side &euro;45 &middot; Alanya &euro;65 &middot; Kas &euro;85</strong> &#8212; arac basına, kisi bası degil.</p>
<a href="/tr/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Ozel Transfer Rezerve Et &#8594;</a>
</div>',

  content_de = content_de || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Bereit, die Taxischlange zu überspringen?</h2>
<p style="color:#374151;">Sie haben den Vergleich gesehen. VIP-Privattransfer gewinnt bei Preis, Komfort und Sicherheit. Jetzt buchen &#8212; 2 Minuten, sofortige Bestätigung.</p>
<p style="color:#374151;"><strong>Belek ab &euro;35 &middot; Side ab &euro;45 &middot; Alanya ab &euro;65 &middot; Kas ab &euro;85</strong> &#8212; pro Fahrzeug, nicht pro Person.</p>
<a href="/de/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Privattransfer jetzt buchen &#8594;</a>
</div>',

  content_pl = content_pl || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Gotowy pominąć kolejkę po taksówkę?</h2>
<p style="color:#374151;">Widziałeś porównanie. Prywatny transfer VIP wygrywa ceną, komfortem i spokojem ducha. Zarezerwuj teraz &#8212; 2 minuty, natychmiastowe potwierdzenie.</p>
<p style="color:#374151;"><strong>Belek od &euro;35 &middot; Side od &euro;45 &middot; Alanya od &euro;65 &middot; Kas od &euro;85</strong> &#8212; za pojazd, nie za osobę.</p>
<a href="/pl/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Zarezerwuj Prywatny Transfer &#8594;</a>
</div>',

  content_ru = content_ru || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Готовы миновать очередь к такси?</h2>
<p style="color:#374151;">Вы видели сравнение. Частный VIP-трансфер выигрывает по цене, комфорту и спокойствию. Бронируйте сейчас &#8212; 2 минуты, мгновенное подтверждение.</p>
<p style="color:#374151;"><strong>Белек от &euro;35 &middot; Сиде от &euro;45 &middot; Аланья от &euro;65 &middot; Каш от &euro;85</strong> &#8212; за автомобиль, не на человека.</p>
<a href="/ru/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Заказать Частный Трансфер &#8594;</a>
</div>',

  updated_at = NOW()
WHERE slug = 'antalya-havalimani-taksi-mi-vip-transfer-mi';

-- =============================================
-- 5-10. Remaining posts — generic CTA block
-- =============================================
UPDATE blog_posts SET
  content_en = content_en || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Book Your Antalya Airport Transfer</h2>
<p style="color:#374151;">Fixed price &middot; Mercedes Vito &middot; Meet &amp; Greet &middot; Flight Tracking &middot; Free Cancellation 24h &middot; Instant Confirmation</p>
<p style="color:#374151;"><strong>Belek from &euro;35 &middot; Kemer from &euro;40 &middot; Side from &euro;45 &middot; Alanya from &euro;65</strong></p>
<a href="/en/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Book Now &#8212; Instant Confirmation &#8594;</a>
</div>',

  content_tr = content_tr || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Antalya Havalimanı Transferinizi Rezerve Edin</h2>
<p style="color:#374151;">Sabit fiyat &middot; Mercedes Vito &middot; Karsilama &middot; Ucus Takibi &middot; 24 Saat Ucretsiz Iptal &middot; Anında Onay</p>
<p style="color:#374151;"><strong>Belek euro 35 &middot; Kemer euro 40 &middot; Side euro 45 &middot; Alanya euro 65</strong></p>
<a href="/tr/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Hemen Rezervasyon Yap &#8594;</a>
</div>',

  content_de = content_de || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Jetzt Transfer buchen</h2>
<p style="color:#374151;">Festpreis &middot; Mercedes Vito &middot; Abholung mit Schild &middot; Flugverfolgung &middot; Kostenlose Stornierung 24h</p>
<p style="color:#374151;"><strong>Belek ab &euro;35 &middot; Kemer ab &euro;40 &middot; Side ab &euro;45 &middot; Alanya ab &euro;65</strong></p>
<a href="/de/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Jetzt buchen &#8212; Sofortige Bestätigung &#8594;</a>
</div>',

  content_pl = content_pl || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Zarezerwuj Transfer</h2>
<p style="color:#374151;">Stała cena &middot; Mercedes Vito &middot; Spotkanie na lotnisku &middot; Śledzenie lotu &middot; Bezpłatne odwołanie 24h</p>
<p style="color:#374151;"><strong>Belek od &euro;35 &middot; Kemer od &euro;40 &middot; Side od &euro;45 &middot; Alanya od &euro;65</strong></p>
<a href="/pl/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Rezerwuj Teraz &#8594;</a>
</div>',

  content_ru = content_ru || '
<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Забронировать Трансфер</h2>
<p style="color:#374151;">Фиксированная цена &middot; Mercedes Vito &middot; Встреча с табличкой &middot; Отслеживание рейса &middot; Отмена за 24ч</p>
<p style="color:#374151;"><strong>Белек от &euro;35 &middot; Кемер от &euro;40 &middot; Сиде от &euro;45 &middot; Аланья от &euro;65</strong></p>
<a href="/ru/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Забронировать &#8594;</a>
</div>',

  updated_at = NOW()
WHERE slug IN (
  'antalya-havalimani-transfer-fiyatlari',
  'vip-transfer-mi-shuttle-mi',
  'antalya-kemer-transfer-mesafe-sure',
  'antalya-havalimani-belek-transfer',
  'antalya-havalimani-side-transfer',
  'antalya-regnum-crown-transfer'
);
