-- =============================================
-- TORVIAN TRANSFER — New Blog: Hotel Transfer Antalya
-- Slug: hotel-transfer-antalya
--
-- WHY: Google Trends 24h data shows "hotel transfer antalya" at 53 interest +20%
-- globally. "antalya hotel transfer" also 53 +20%. No existing TORVIAN page
-- targets this query. Creates bottom-of-funnel content: visitor is looking for
-- a hotel transfer → lands here → books immediately.
--
-- TARGET QUERIES:
--   EN: "hotel transfer antalya", "hotel transfer antalya airport", "airport to hotel transfer antalya"
--   DE: "hotel transfer antalya" (DE #1 query from annual data), "antalya flughafen hotel transfer"
--   PL: "transfer z lotniska do hotelu antalya"
--
-- NOTE: Dollar quoting ($$...$$) used throughout to avoid single-quote escaping issues.
-- =============================================

INSERT INTO blog_posts (
  slug,
  title_en,   title_tr,   title_de,   title_pl,   title_ru,
  content_en, content_tr, content_de, content_pl, content_ru,
  excerpt_en, excerpt_tr, excerpt_de, excerpt_pl, excerpt_ru,
  image_url, is_published, published_at
)
VALUES (
  'hotel-transfer-antalya',

  -- TITLES
  'Hotel Transfer Antalya Airport: Private VIP Direct to Your Resort',
  'Antalya Havalimanı Hotel Transferi: Otelinize Kapıdan Kapıya VIP Hizmet',
  'Hotel Transfer Flughafen Antalya: Direkt zu Ihrem Hotel — VIP Privat',
  'Hotel Transfer Lotnisko Antalya: Bezpośrednio do Twojego Hotelu',
  'Трансфер в Отель из Аэропорта Анталии: VIP Напрямую до Вашего Номера',

  -- CONTENT EN
  $$<article>
<p style="font-size:1.1rem;color:#374151;line-height:1.7;">When your flight lands at Antalya Airport (AYT), the fastest, most stress-free way to reach your hotel is a <strong>private hotel transfer</strong> — your driver waits in arrivals with a name sign and drives you directly to your property, door to door, with no stops at other hotels along the way.</p>

<h2 style="color:#1D4ED8;margin-top:32px;">What Is a Hotel Transfer from Antalya Airport?</h2>
<p>A hotel transfer is a pre-booked, private vehicle that picks you up from Antalya Airport and delivers you to your hotel. Unlike a shared shuttle bus (which stops at 6–10 hotels before yours), a private hotel transfer goes only to your destination.</p>
<p>At Torvian Transfer, every hotel transfer uses a <strong>Mercedes Vito VIP</strong> vehicle. Your driver monitors your flight live — if your plane is delayed, they wait at no extra charge. They meet you inside the arrivals hall holding a sign with your name, take your luggage, and guide you to the vehicle.</p>

<h2 style="color:#1D4ED8;margin-top:32px;">Transfer Times and Prices: Antalya Airport to All Hotels</h2>
<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.95rem;">
<thead>
<tr style="background:#1D4ED8;color:#ffffff;">
<th style="padding:10px 14px;text-align:left;">Hotel Area</th>
<th style="padding:10px 14px;text-align:center;">Distance</th>
<th style="padding:10px 14px;text-align:center;">Transfer Time</th>
<th style="padding:10px 14px;text-align:center;">Price (per vehicle)</th>
</tr>
</thead>
<tbody>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Lara / Kundu</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">14–15 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">15–18 min</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">from €25</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Belek</strong> (golf resorts)</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">33 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">30 min</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">from €35</td>
</tr>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Kemer</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">45 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">40 min</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">from €40</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Side</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">75 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">1h 10 min</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">from €45</td>
</tr>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Alanya</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">132 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">~2 hours</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">from €65</td>
</tr>
<tr>
<td style="padding:10px 14px;"><strong>Kas</strong></td>
<td style="padding:10px 14px;text-align:center;">195 km</td>
<td style="padding:10px 14px;text-align:center;">~2h 45 min</td>
<td style="padding:10px 14px;text-align:center;">from €85</td>
</tr>
</tbody>
</table>
<p style="color:#6B7280;font-size:0.85rem;margin-top:4px;">All prices are per vehicle (Mercedes Vito, up to 5 passengers), not per person. A family of 4 travelling to Belek pays €35 total.</p>

<h2 style="color:#1D4ED8;margin-top:32px;">Hotel Transfer vs Airport Taxi vs Shuttle Bus</h2>
<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.9rem;">
<thead>
<tr style="background:#F3F4F6;">
<th style="padding:10px 14px;text-align:left;border-bottom:2px solid #E5E7EB;"></th>
<th style="padding:10px 14px;text-align:center;border-bottom:2px solid #E5E7EB;color:#1D4ED8;font-weight:700;">Private Hotel Transfer</th>
<th style="padding:10px 14px;text-align:center;border-bottom:2px solid #E5E7EB;">Airport Taxi</th>
<th style="padding:10px 14px;text-align:center;border-bottom:2px solid #E5E7EB;">Shuttle Bus</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-weight:600;">Fixed price before you travel</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;color:#16A34A;font-weight:700;">&#10003; Yes</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;color:#DC2626;">&#10007; Negotiate on arrival</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;color:#16A34A;">&#10003; Yes</td>
</tr>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-weight:600;">Direct to your hotel, no stops</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;color:#16A34A;font-weight:700;">&#10003; Yes</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;color:#16A34A;">&#10003; Yes</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;color:#DC2626;">&#10007; Multiple hotel stops</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-weight:600;">Flight tracking, waits free</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;color:#16A34A;font-weight:700;">&#10003; Yes</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;color:#DC2626;">&#10007; No</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;color:#DC2626;">&#10007; Fixed schedule</td>
</tr>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-weight:600;">Meet &amp; Greet inside arrivals</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;color:#16A34A;font-weight:700;">&#10003; Yes, name sign</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;color:#DC2626;">&#10007; Queue outside</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;color:#DC2626;">&#10007; Desk in terminal</td>
</tr>
<tr>
<td style="padding:10px 14px;font-weight:600;">Free cancellation</td>
<td style="padding:10px 14px;text-align:center;color:#16A34A;font-weight:700;">&#10003; Up to 24h before</td>
<td style="padding:10px 14px;text-align:center;color:#DC2626;">&#10007; No booking needed</td>
<td style="padding:10px 14px;text-align:center;color:#F59E0B;">Partial</td>
</tr>
</tbody>
</table>

<h2 style="color:#1D4ED8;margin-top:32px;">How to Book Your Hotel Transfer</h2>
<ol style="padding-left:20px;line-height:2.2;color:#374151;">
<li>Click <strong>Book Now</strong> below and enter your hotel name + flight details.</li>
<li>Choose vehicle type (Vito for up to 5 passengers).</li>
<li>Pay securely online — instant confirmation by email.</li>
<li>On arrival, your driver stands in the arrivals hall with your name sign.</li>
<li>Relax on the way to your hotel. Your holiday starts now.</li>
</ol>

<h2 style="color:#1D4ED8;margin-top:32px;">Frequently Asked Questions</h2>

<h3 style="color:#374151;">How does the driver know which hotel I am staying at?</h3>
<p>When you book, you enter your exact hotel name and address. This is shared with the driver in advance. No explanations needed on arrival.</p>

<h3 style="color:#374151;">Can I book a hotel transfer for the return journey as well?</h3>
<p>Yes. During booking you can add a return trip. The driver comes to your hotel and takes you back to Antalya Airport for your departure flight. Return price matches the arrival price.</p>

<h3 style="color:#374151;">What if my flight is delayed or cancelled?</h3>
<p>We track all flights live. If your flight is delayed, the driver adjusts arrival time automatically — no extra charge for waiting. If your flight is cancelled, contact us and we will reschedule or refund.</p>

<h3 style="color:#374151;">Is the hotel transfer service available around the clock?</h3>
<p>Yes, 24 hours a day, 7 days a week. Many guests arrive on late-night or early-morning flights — we are always ready.</p>

<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Book Your Hotel Transfer Now</h2>
<p style="color:#374151;">Fixed price &middot; Mercedes Vito VIP &middot; Meet &amp; Greet &middot; Flight Tracking &middot; Free Cancellation 24h &middot; Instant Confirmation</p>
<p style="color:#374151;"><strong>Lara/Kundu from €25 &middot; Belek from €35 &middot; Kemer from €40 &middot; Side from €45 &middot; Alanya from €65</strong></p>
<a href="/en/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Book Hotel Transfer &#8212; Instant Confirmation &#8594;</a>
</div>
</article>$$,

  -- CONTENT TR
  $$<article>
<p style="font-size:1.1rem;color:#374151;line-height:1.7;">Antalya Havalimanina indiginizdde otelinize ulasmanin en hizli ve stressiz yolu <strong>ozel hotel transferi</strong>dir. Surucu varis salonunda isim tabelasiyla sizi bekler, bavullarinizi alir ve diger otellerde durmadan dogrudan otelinize goturur.</p>

<h2 style="color:#1D4ED8;margin-top:32px;">Antalya Havalimanı Otel Transferi Nedir?</h2>
<p>Otel transferi, Antalya Havalimanından (AYT) dogrudan otelinize giden onceden rezerve edilmis ozel bir aractir. Bircok otelde duran shuttle servisinin aksine, ozel hotel transferinde arac yalnizca sizin icin gider — kapidan kapiya.</p>
<p>Torvian Transfer olarak tum otel transferlerimizde <strong>Mercedes Vito VIP</strong> minivan kullaniyoruz. Surucu ucusunuzu canli takip eder, varis salonunda isim tabelasiyla sizi karsilar. Ucusunuz gecikirse surucu ucretsiz bekler.</p>

<h2 style="color:#1D4ED8;margin-top:32px;">Otel Bolgelerine Gore Sure ve Fiyatlar</h2>
<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.95rem;">
<thead>
<tr style="background:#1D4ED8;color:#ffffff;">
<th style="padding:10px 14px;text-align:left;">Otel Bolgesi</th>
<th style="padding:10px 14px;text-align:center;">Mesafe</th>
<th style="padding:10px 14px;text-align:center;">Sure</th>
<th style="padding:10px 14px;text-align:center;">Fiyat (arac basina)</th>
</tr>
</thead>
<tbody>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Lara / Kundu</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">14-15 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">15-18 dk.</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">&euro;25</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Belek</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">33 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">30 dk.</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">&euro;35</td>
</tr>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Kemer</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">45 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">40 dk.</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">&euro;40</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Side</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">75 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">1 sa. 10 dk.</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">&euro;45</td>
</tr>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Alanya</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">132 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">~2 saat</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">&euro;65</td>
</tr>
<tr>
<td style="padding:10px 14px;"><strong>Kas</strong></td>
<td style="padding:10px 14px;text-align:center;">195 km</td>
<td style="padding:10px 14px;text-align:center;">~2 sa. 45 dk.</td>
<td style="padding:10px 14px;text-align:center;">&euro;85</td>
</tr>
</tbody>
</table>
<p style="color:#6B7280;font-size:0.85rem;">Fiyatlar arac basinadir (5 yolcuya kadar). Kisi basi degil.</p>

<h2 style="color:#1D4ED8;margin-top:32px;">Sikca Sorulan Sorular</h2>

<h3 style="color:#374151;">Surucu hangi otelde kaldığımı nasil bilecek?</h3>
<p>Rezervasyon sirasinda otel adinizi ve adresinizi giriyorsunuz. Bu bilgi onceden suruculere iletilir. Varis aninda anlatmaniz gerekmiyor.</p>

<h3 style="color:#374151;">Donus icin de rezervasyon yapabilir miyim?</h3>
<p>Evet. Rezervasyon sirasinda donus transferini de ekleyebilirsiniz. Surucu otelinize gelir ve sizi Antalya Havalimanina ulastirir. Fiyat ayni.</p>

<h3 style="color:#374151;">Ucusum gecikirse surucu bekliyor mu?</h3>
<p>Evet. Ucusunuzu canli takip ediyoruz. Gercek inis saatinize gore surucu hazirlanir. Ek bekleme ucreti yoktur.</p>

<h3 style="color:#374151;">Gece gelis veya sabah erken ucuslarda da hizmet var mi?</h3>
<p>Evet, 7/24 hizmetinizdeyiz. Pek cok misafirimiz gece yarisi veya sabah erken saatlerde gelir — surucu her zaman orada olur.</p>

<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Otel Transferinizi Hemen Rezerve Edin</h2>
<p style="color:#374151;">Sabit fiyat &middot; Mercedes Vito VIP &middot; Karsilama &middot; Ucus Takibi &middot; 24 Saat Ucretsiz Iptal &middot; Aninda Onay</p>
<p style="color:#374151;"><strong>Lara/Kundu &euro;25 &middot; Belek &euro;35 &middot; Kemer &euro;40 &middot; Side &euro;45 &middot; Alanya &euro;65</strong></p>
<a href="/tr/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Hemen Rezervasyon Yap &#8594;</a>
</div>
</article>$$,

  -- CONTENT DE
  $$<article>
<p style="font-size:1.1rem;color:#374151;line-height:1.7;">Wenn Ihr Flug in Antalya landet, ist der schnellste und angenehmste Weg zu Ihrem Hotel ein <strong>privater Hotel Transfer</strong> — Ihr Fahrer wartet im Ankunftsbereich mit Ihrem Namensschild und fährt Sie direkt zu Ihrem Hotel, ohne Zwischenstopps.</p>

<h2 style="color:#1D4ED8;margin-top:32px;">Was ist ein Hotel Transfer vom Flughafen Antalya?</h2>
<p>Ein Hotel Transfer ist ein vorgebuchtes, privates Fahrzeug, das Sie vom Flughafen Antalya (AYT) direkt zu Ihrem Hotel bringt. Im Gegensatz zu einem gemeinsamen Shuttle-Bus (der an 6–10 Hotels hält) fährt ein privater Hotel Transfer ausschließlich zu Ihrem Ziel.</p>
<p>Bei Torvian Transfer nutzen wir für alle Hotel Transfers einen <strong>Mercedes Vito VIP</strong>. Der Fahrer verfolgt Ihren Flug in Echtzeit — bei Verspätung wartet er kostenlos. Er empfängt Sie in der Ankunftshalle mit einem Schild und übernimmt Ihr Gepäck.</p>

<h2 style="color:#1D4ED8;margin-top:32px;">Fahrzeiten und Preise — Flughafen Antalya zu allen Hotels</h2>
<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.95rem;">
<thead>
<tr style="background:#1D4ED8;color:#ffffff;">
<th style="padding:10px 14px;text-align:left;">Hotelgebiet</th>
<th style="padding:10px 14px;text-align:center;">Entfernung</th>
<th style="padding:10px 14px;text-align:center;">Fahrzeit</th>
<th style="padding:10px 14px;text-align:center;">Preis (pro Fahrzeug)</th>
</tr>
</thead>
<tbody>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Lara / Kundu</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">14–15 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">15–18 Min.</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">ab &euro;25</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Belek</strong> (Golf-Resorts)</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">33 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">30 Min.</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">ab &euro;35</td>
</tr>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Kemer</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">45 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">40 Min.</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">ab &euro;40</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Side</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">75 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">1h 10 Min.</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">ab &euro;45</td>
</tr>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Alanya</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">132 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">~2 Stunden</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">ab &euro;65</td>
</tr>
<tr>
<td style="padding:10px 14px;"><strong>Kas</strong></td>
<td style="padding:10px 14px;text-align:center;">195 km</td>
<td style="padding:10px 14px;text-align:center;">~2h 45 Min.</td>
<td style="padding:10px 14px;text-align:center;">ab &euro;85</td>
</tr>
</tbody>
</table>
<p style="color:#6B7280;font-size:0.85rem;">Preise pro Fahrzeug (Mercedes Vito, bis 5 Personen). Nicht pro Person.</p>

<h2 style="color:#1D4ED8;margin-top:32px;">Häufig gestellte Fragen</h2>

<h3 style="color:#374151;">Woher weiß der Fahrer, in welchem Hotel ich übernachte?</h3>
<p>Bei der Buchung geben Sie Ihren genauen Hotelnamen und die Adresse an. Diese Daten werden vorab an den Fahrer übermittelt — keine Erklärung bei Ankunft nötig.</p>

<h3 style="color:#374151;">Kann ich auch einen Rücktransfer zum Flughafen buchen?</h3>
<p>Ja. Bei der Buchung können Sie die Rückfahrt hinzufügen. Der Fahrer holt Sie am Hotel ab und bringt Sie zum Flughafen Antalya. Der Preis entspricht der Hinfahrt.</p>

<h3 style="color:#374151;">Was passiert bei Flugverspätung?</h3>
<p>Wir verfolgen alle Flüge in Echtzeit. Bei Verspätung passt der Fahrer die Ankunft automatisch an — keine Extrakosten. Bei Stornierung kontaktieren Sie uns für eine Umbuchung oder Erstattung.</p>

<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Jetzt Hotel Transfer buchen</h2>
<p style="color:#374151;">Festpreis &middot; Mercedes Vito VIP &middot; Abholung mit Schild &middot; Flugverfolgung &middot; Kostenlose Stornierung 24h &middot; Sofortige Bestätigung</p>
<p style="color:#374151;"><strong>Lara/Kundu ab &euro;25 &middot; Belek ab &euro;35 &middot; Kemer ab &euro;40 &middot; Side ab &euro;45 &middot; Alanya ab &euro;65</strong></p>
<a href="/de/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Jetzt buchen &#8212; Sofortige Bestätigung &#8594;</a>
</div>
</article>$$,

  -- CONTENT PL
  $$<article>
<p style="font-size:1.1rem;color:#374151;line-height:1.7;">Po wylądowaniu na lotnisku Antalya najszybszym i najbardziej komfortowym sposobem dotarcia do hotelu jest <strong>prywatny transfer hotelowy</strong> — kierowca czeka na Ciebie w hali przylotów z tabliczką z Twoim imieniem i jedzie bezpośrednio do Twojego hotelu, bez żadnych przystanków.</p>

<h2 style="color:#1D4ED8;margin-top:32px;">Co to jest transfer hotelowy z lotniska Antalya?</h2>
<p>Transfer hotelowy to wcześniej zarezerwowany, prywatny pojazd, który zabiera Cię z lotniska Antalya (AYT) bezpośrednio do Twojego hotelu. W przeciwieństwie do zbiorowego autobusu wahadłowego (który zatrzymuje się przy 6–10 hotelach), prywatny transfer jedzie tylko do Twojego celu.</p>
<p>W Torvian Transfer używamy do transferów hotelowych <strong>Mercedes Vito VIP</strong>. Kierowca śledzi Twój lot na żywo — w przypadku opóźnienia czeka bezpłatnie. Wita Cię w hali przylotów z tabliczką i przejmuje bagaż.</p>

<h2 style="color:#1D4ED8;margin-top:32px;">Czasy przejazdu i ceny ze wszystkich hoteli</h2>
<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.95rem;">
<thead>
<tr style="background:#1D4ED8;color:#ffffff;">
<th style="padding:10px 14px;text-align:left;">Strefa hotelowa</th>
<th style="padding:10px 14px;text-align:center;">Odległość</th>
<th style="padding:10px 14px;text-align:center;">Czas przejazdu</th>
<th style="padding:10px 14px;text-align:center;">Cena (za pojazd)</th>
</tr>
</thead>
<tbody>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Lara / Kundu</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">14–15 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">15–18 min</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">od &euro;25</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Belek</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">33 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">30 min</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">od &euro;35</td>
</tr>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Kemer</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">45 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">40 min</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">od &euro;40</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Side</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">75 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">1h 10 min</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">od &euro;45</td>
</tr>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Alanya</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">132 km</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">~2 godziny</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">od &euro;65</td>
</tr>
<tr>
<td style="padding:10px 14px;"><strong>Kas</strong></td>
<td style="padding:10px 14px;text-align:center;">195 km</td>
<td style="padding:10px 14px;text-align:center;">~2h 45 min</td>
<td style="padding:10px 14px;text-align:center;">od &euro;85</td>
</tr>
</tbody>
</table>
<p style="color:#6B7280;font-size:0.85rem;">Ceny za pojazd (do 5 pasażerów). Nie za osobę.</p>

<h2 style="color:#1D4ED8;margin-top:32px;">Najczęściej zadawane pytania</h2>

<h3 style="color:#374151;">Skąd kierowca wie, w którym hotelu mieszkam?</h3>
<p>Podczas rezerwacji podajesz nazwę i adres hotelu. Informacja ta jest z wyprzedzeniem przekazywana kierowcy — nie musisz nic tłumaczyć po przylocie.</p>

<h3 style="color:#374151;">Czy mogę zarezerwować transfer powrotny na lotnisko?</h3>
<p>Tak. Podczas rezerwacji możesz dodać powrót. Kierowca przyjedzie do Twojego hotelu i zawiezie Cię na lotnisko Antalya. Cena jest taka sama jak przy przylocie.</p>

<h3 style="color:#374151;">Co się dzieje przy opóźnieniu lotu?</h3>
<p>Śledzimy wszystkie loty na żywo. Kierowca dostosowuje godzinę przyjazdu automatycznie — bez dodatkowych opłat za oczekiwanie.</p>

<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Zarezerwuj Transfer Hotelowy Teraz</h2>
<p style="color:#374151;">Stała cena &middot; Mercedes Vito VIP &middot; Spotkanie z tabliczką &middot; Śledzenie lotu &middot; Bezpłatne odwołanie 24h</p>
<p style="color:#374151;"><strong>Lara/Kundu od &euro;25 &middot; Belek od &euro;35 &middot; Kemer od &euro;40 &middot; Side od &euro;45 &middot; Alanya od &euro;65</strong></p>
<a href="/pl/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Rezerwuj Teraz &#8212; Natychmiastowe Potwierdzenie &#8594;</a>
</div>
</article>$$,

  -- CONTENT RU
  $$<article>
<p style="font-size:1.1rem;color:#374151;line-height:1.7;">Когда ваш рейс приземляется в аэропорту Анталии, самый быстрый и комфортный способ добраться до отеля — это <strong>частный трансфер в отель</strong>: водитель ждёт вас в зале прилёта с табличкой с вашим именем и везёт прямо до дверей отеля без промежуточных остановок.</p>

<h2 style="color:#1D4ED8;margin-top:32px;">Что такое трансфер в отель из аэропорта Анталии?</h2>
<p>Трансфер в отель — это заблаговременно забронированный частный автомобиль, который доставляет вас из аэропорта Анталии (AYT) прямо в ваш отель. В отличие от общего шаттла (который делает 6–10 остановок), частный трансфер едет только к вашему месту назначения.</p>
<p>В Torvian Transfer для всех трансферов в отели используется <strong>Mercedes Vito VIP</strong>. Водитель отслеживает ваш рейс в режиме реального времени — при задержке он ждёт бесплатно. Встречает вас в зале прилёта с табличкой и берёт на себя ваш багаж.</p>

<h2 style="color:#1D4ED8;margin-top:32px;">Время в пути и цены до всех курортов</h2>
<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.95rem;">
<thead>
<tr style="background:#1D4ED8;color:#ffffff;">
<th style="padding:10px 14px;text-align:left;">Курорт</th>
<th style="padding:10px 14px;text-align:center;">Расстояние</th>
<th style="padding:10px 14px;text-align:center;">Время</th>
<th style="padding:10px 14px;text-align:center;">Цена (за авто)</th>
</tr>
</thead>
<tbody>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Лара / Кунду</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">14–15 км</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">15–18 мин.</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">от &euro;25</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Белек</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">33 км</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">30 мин.</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">от &euro;35</td>
</tr>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Кемер</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">45 км</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">40 мин.</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">от &euro;40</td>
</tr>
<tr>
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Сиде</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">75 км</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">1ч 10 мин.</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">от &euro;45</td>
</tr>
<tr style="background:#F9FAFB;">
<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;"><strong>Аланья</strong></td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">132 км</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">~2 часа</td>
<td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5E7EB;">от &euro;65</td>
</tr>
<tr>
<td style="padding:10px 14px;"><strong>Каш</strong></td>
<td style="padding:10px 14px;text-align:center;">195 км</td>
<td style="padding:10px 14px;text-align:center;">~2ч 45 мин.</td>
<td style="padding:10px 14px;text-align:center;">от &euro;85</td>
</tr>
</tbody>
</table>
<p style="color:#6B7280;font-size:0.85rem;">Цены за автомобиль (до 5 пассажиров). Не за человека.</p>

<h2 style="color:#1D4ED8;margin-top:32px;">Часто задаваемые вопросы</h2>

<h3 style="color:#374151;">Откуда водитель знает, в каком отеле я остановился?</h3>
<p>При бронировании вы указываете точное название и адрес отеля. Эта информация заранее передаётся водителю — объяснять ничего на месте не нужно.</p>

<h3 style="color:#374151;">Могу ли я заказать обратный трансфер в аэропорт?</h3>
<p>Да. При бронировании можно добавить обратную поездку. Водитель приедет к вашему отелю и отвезёт в аэропорт Анталии. Цена та же, что и на прилёт.</p>

<h3 style="color:#374151;">Что будет при задержке рейса?</h3>
<p>Мы отслеживаем все рейсы в реальном времени. Водитель приедет по фактическому времени прилёта — ожидание бесплатно.</p>

<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:28px;margin-top:40px;">
<h2 style="color:#1D4ED8;margin-top:0;font-size:1.4rem;">Забронировать Трансфер в Отель</h2>
<p style="color:#374151;">Фиксированная цена &middot; Mercedes Vito VIP &middot; Встреча с табличкой &middot; Отслеживание рейса &middot; Отмена за 24ч</p>
<p style="color:#374151;"><strong>Лара/Кунду от &euro;25 &middot; Белек от &euro;35 &middot; Кемер от &euro;40 &middot; Сиде от &euro;45 &middot; Аланья от &euro;65</strong></p>
<a href="/ru/booking" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-top:8px;">Забронировать &#8212; Мгновенное Подтверждение &#8594;</a>
</div>
</article>$$,

  -- EXCERPTS (meta descriptions shown in Google SERP, ~155 chars)
  'Private hotel transfer from Antalya Airport directly to your resort. Fixed price, Mercedes Vito, meet & greet, flight tracking, free cancellation 24h. Belek from €35, Alanya from €65.',
  'Antalya Havalimanindan otelinize ozel VIP hotel transferi. Sabit fiyat, Mercedes Vito, karsilama, ucus takibi. Belek 35 euro, Alanya 65 euro. Online rezervasyon, aninda onay.',
  'VIP Privattransfer vom Flughafen Antalya direkt zu Ihrem Hotel. Festpreis, Mercedes Vito, Abholung mit Namensschild, Flugverfolgung, kein Nachtzuschlag. Belek ab €35, Alanya ab €65.',
  'Prywatny transfer VIP z lotniska Antalya bezposrednio do Twojego hotelu. Stala cena, Mercedes Vito, spotkanie na lotnisku, sledzenie lotu, bezplatne odwolanie 24h. Belek od €35.',
  'Частный VIP-трансфер из аэропорта Анталии прямо в ваш отель. Фиксированная цена, Mercedes Vito, встреча с табличкой, отслеживание рейса. Белек от €35, Аланья от €65.',

  '/images/blog/horizontal-hd.avif',
  true,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_tr = EXCLUDED.title_tr,
  title_de = EXCLUDED.title_de,
  title_pl = EXCLUDED.title_pl,
  title_ru = EXCLUDED.title_ru,
  excerpt_en = EXCLUDED.excerpt_en,
  excerpt_tr = EXCLUDED.excerpt_tr,
  excerpt_de = EXCLUDED.excerpt_de,
  excerpt_pl = EXCLUDED.excerpt_pl,
  excerpt_ru = EXCLUDED.excerpt_ru,
  content_en = EXCLUDED.content_en,
  content_tr = EXCLUDED.content_tr,
  content_de = EXCLUDED.content_de,
  content_pl = EXCLUDED.content_pl,
  content_ru = EXCLUDED.content_ru,
  image_url = EXCLUDED.image_url,
  updated_at = NOW();
