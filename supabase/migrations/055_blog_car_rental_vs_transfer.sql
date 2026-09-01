-- 055: New comparison post — renting a car vs a private transfer in Antalya
--
-- WHY THIS POST
-- Google Trends (GB, Jun–Sep 2026 rising searches) puts "car rental antalya
-- airport" at search interest 21 with +140% growth — the highest-growing
-- genuinely relevant term in that export, and the site has zero content on it.
--
-- WHY A BLOG POST AND NOT A SERVICE PAGE
-- GSC, last 92 days: static service pages hold 28 URLs / 2,165 impressions,
-- blog posts hold 130 URLs / 29,307 impressions at a comparable average
-- position (17.4 vs 15.9). On the one topic the site covers in BOTH formats,
-- the gap is decisive: /tr/blog/land-of-legends-transfer-rehberi draws 1,084
-- impressions and 18 clicks, /tr/land-of-legends-transfer draws 29 and 2.
-- Service pages win their exact term and nothing else; posts catch the
-- question variants. "Should I rent a car or book a transfer" is a question.
--
-- WHAT IT TARGETS
-- Not the bare term "car rental antalya airport" — Rentalcars, Sixt and
-- Booking own that, and they actually rent cars. This targets the decision
-- variant, where the reader has not chosen yet. That is the same shape as the
-- three comparison posts that already work here: uber (6,341 impressions, pos
-- 7.9), havas (1,825, pos 7.0) and taxi-vs-transfer.
--
-- FACTUAL DISCIPLINE
-- Every Torvian claim below is copy already verified elsewhere in this repo
-- (src/messages/*.json → faq/trust): fixed price per vehicle, up to five
-- passengers in a Mercedes Vito, real-time flight tracking with free waiting
-- on delay, a driver at the designated meeting point in the arrivals hall,
-- free cancellation up to 24 hours, child seat at $10 per booking, 24/7.
-- Distances come from supabase/seed.sql, so they match what the region pages
-- render. NO car rental prices, deposit amounts, parking fees or licence rules
-- are stated as fact — those vary by supplier and nationality and cannot be
-- verified from this repo, so the copy tells the reader to check them.
--
-- The post deliberately says when renting IS the better choice. A comparison
-- that never concedes reads as an advert and converts worse.
--
-- primary_region_slug is left NULL: this is not about one destination, so the
-- CTA falls back to the generic /booking funnel — the same setup as the uber
-- post, the site's strongest page.
--
-- image_url is left NULL. The blog template renders a gradient placeholder
-- when a post has no image (see related-posts block in blog/[slug]/page.tsx),
-- so nothing breaks; upload a real photo from the admin blog editor when one
-- exists rather than reusing an unrelated transfer picture here.
--
-- The FAQ heading wording in each language matches the pattern that
-- blog/[slug]/page.tsx looks for when it builds FAQPage schema from h3 + p
-- pairs, so this post emits FAQ structured data like the others.
--
-- Safe to re-run.

INSERT INTO blog_posts (
  slug,
  title_tr, title_en, title_de, title_pl, title_ru, title_nl,
  excerpt_tr, excerpt_en, excerpt_de, excerpt_pl, excerpt_ru, excerpt_nl,
  content_tr, content_en, content_de, content_pl, content_ru, content_nl,
  slug_tr, slug_en, slug_de, slug_pl, slug_ru, slug_nl,
  focus_keyword_tr, focus_keyword_en, focus_keyword_de, focus_keyword_pl, focus_keyword_ru, focus_keyword_nl,
  is_published, published_at
) VALUES (
  'antalya-arac-kiralama-mi-transfer-mi',

  -- ===== TITLES =====
  $t$Antalya'da Araç Kiralama mı Özel Transfer mi? 2026 Karşılaştırması$t$,
  $t$Car Rental vs Private Transfer in Antalya: Which One Do You Actually Need?$t$,
  $t$Mietwagen oder Privattransfer in Antalya? Der ehrliche Vergleich 2026$t$,
  $t$Wynajem Auta czy Transfer Prywatny w Antalyi? Szczery Poradnik 2026$t$,
  $t$Аренда авто или частный трансфер в Анталии? Честное сравнение 2026$t$,
  $t$Huurauto of Privétransfer in Antalya? De eerlijke vergelijking 2026$t$,

  -- ===== EXCERPTS =====
  $e$Antalya'da araç kiralamak mı, havalimanından özel transfer mi? Depozito, otopark, otoyol ve trafik gerçekleriyle dürüst karşılaştırma — ve araç kiralamanın gerçekten daha mantıklı olduğu durumlar.$e$,
  $e$Renting a car in Antalya or booking a private transfer? An honest comparison covering deposits, parking, tolls and traffic — including the trips where renting genuinely makes more sense.$e$,
  $e$Mietwagen in Antalya oder Privattransfer? Ein ehrlicher Vergleich zu Kaution, Parken, Maut und Verkehr — samt der Reisen, bei denen sich ein Mietwagen wirklich lohnt.$e$,
  $e$Wynajem auta w Antalyi czy transfer prywatny? Szczere porównanie: kaucja, parkowanie, opłaty drogowe i ruch — oraz sytuacje, w których auto naprawdę się opłaca.$e$,
  $e$Аренда авто в Анталии или частный трансфер? Честное сравнение: залог, парковка, платные дороги и трафик — и поездки, где машина действительно выгоднее.$e$,
  $e$Een auto huren in Antalya of een privétransfer boeken? Een eerlijke vergelijking over borg, parkeren, tol en verkeer — inclusief de reizen waarbij huren écht verstandiger is.$e$,

  -- ===== CONTENT: TR =====
  $tr$<article>
<p><strong>Antalya'ya iniyorsunuz ve iki seçenek arasında kaldınız:</strong> havalimanında araç kiralamak mı, yoksa özel transferle doğrudan otele geçmek mi? İnternette bu sorunun cevabı genelde tek taraflı verilir. Biz transfer hizmeti veriyoruz ama aşağıda araç kiralamanın gerçekten daha mantıklı olduğu durumları da yazdık — çünkü yanlış seçim tatilin ilk gününü mahvediyor.</p>

<h2>Asıl soru fiyat değil, tatilinizin şekli</h2>
<p>Çoğu kişi bu kararı fiyatla verir ve yanılır. Doğru soru şu: <strong>tatiliniz boyunca araca kaç kez ihtiyacınız olacak?</strong> Cevap "bir gidiş, bir dönüş" ise araç kiralamak size aracı park etmek, yakıt almak ve sigortayla uğraşmak için para ödetir. Cevap "her gün başka bir yere gideceğim" ise transfer yetmez.</p>

<h2>Antalya'da araç kiralarken karşınıza çıkanlar</h2>
<ul>
<li><strong>Kredi kartı bloke:</strong> Neredeyse bütün firmalar kartınızda bir depozito tutar. Tutar firmadan firmaya ve araç sınıfına göre değişir; rezervasyon öncesi mutlaka teyit edin.</li>
<li><strong>Ehliyet:</strong> Bazı ülkelerin ehliyetleri için uluslararası ehliyet (IDP) istenebilir. Kendi ülkenizin durumunu önceden kontrol edin.</li>
<li><strong>Otopark:</strong> Sahil bölgesindeki birçok otel otoparkı ücretli. Kaleiçi ve Antalya merkezde park yeri bulmak yaz aylarında ciddi bir sorun.</li>
<li><strong>Otoyol ve HGS:</strong> Türkiye'de otoyol geçişleri elektronik. Kiralık araçta bu genelde sonradan faturalandırılır.</li>
<li><strong>Trafik:</strong> Antalya–Alanya arasındaki D400, temmuz–ağustos aylarında yoğun. Yol tarifi uygulamalarının verdiği süre sezonda gerçeği yansıtmayabilir.</li>
<li><strong>Yorgunluk:</strong> Uzun bir uçuşun ardından, gece yarısı, tanımadığınız bir yolda araç kullanmak en riskli senaryodur.</li>
</ul>

<h2>Özel transferin kapsadıkları</h2>
<p>TORVIAN transferinde ödediğiniz fiyat <strong>araç başınadır, kişi başına değil</strong> — tek bir Mercedes Vito'da 5 yolcuya kadar aynı ücretle seyahat edersiniz. Rezervasyonda gördüğünüz fiyat ödediğiniz fiyattır; yakıt, otoyol ve bekleme dahildir.</p>
<ul>
<li>Uçuşunuzu gerçek zamanlı takip ediyoruz; rötar olursa şoförünüz ücretsiz bekler</li>
<li>Şoförünüz varış salonundaki belirlenen buluşma noktasında karşılar</li>
<li>Kapıdan kapıya — havalimanından doğrudan otelinize, başka yolcu almadan</li>
<li>Planlanan kalkıştan 24 saat öncesine kadar ücretsiz iptal</li>
<li>Çocuk koltuğu rezervasyon başına 10 dolar, rezervasyon sırasında talep edilir</li>
<li>7/24 hizmet; gece varışları da aynı şekilde ayırtılır</li>
</ul>

<h2>Mesafeler — kararınızı etkiler</h2>
<p>Antalya Havalimanı'ndan başlıca bölgelere olan mesafeler: <strong>Kundu–Lara 15 km</strong>, <strong>Belek 35 km</strong>, <strong>Kemer 55 km</strong>, <strong>Side 70 km</strong>, <strong>Alanya 130 km</strong>, <strong>Kaş 190 km</strong>. Alanya ve Kaş gibi uzak noktalarda, yorgun halde 2–3 saat direksiyon başında olmak ile arka koltukta oturmak arasındaki fark büyüktür.</p>

<h2>Şu durumlarda araç kiralayın</h2>
<p>Dürüst olalım — bazı tatillerde araç açık ara daha iyi:</p>
<ul>
<li>Her gün farklı yere gidecekseniz: Kaş, Kalkan, Olympos, Pamukkale gibi noktaları kendi programınızla gezmek istiyorsanız</li>
<li>Toplu taşımanın zayıf olduğu bir villada veya köyde kalıyorsanız</li>
<li>Konaklamanız uzunsa ve araç günlük hayatınızın parçası olacaksa</li>
<li>Programınız esnekse ve saat kısıtı sevmiyorsanız</li>
</ul>

<h2>Şu durumlarda transfer alın</h2>
<ul>
<li>Her şey dahil bir otelde kalıyor ve çoğunlukla tesiste vakit geçirecekseniz</li>
<li>Gece veya sabaha karşı iniyorsanız</li>
<li>Çocuklu bir aileyseniz ve bagajınız fazlaysa</li>
<li>Türkiye'de ilk kez araç kullanacak olmaktan çekiniyorsanız</li>
<li>Sabit ve önceden bilinen bir fiyat istiyorsanız</li>
</ul>

<h2>Üçüncü bir yol: ikisini birleştirin</h2>
<p>Çoğu tatilcinin gözden kaçırdığı seçenek bu. <strong>Geliş ve dönüşte transfer alın, tatilin ortasında ihtiyacınız olan 2–3 gün için yerel bir firmadan araç kiralayın.</strong> Böylece havalimanı yolculuğunun stresini yaşamaz, aracı da yalnızca gerçekten kullanacağınız günler için ödersiniz. Otelinizin bulunduğu bölgede kiralama yapmak, havalimanında kiralamaktan çoğu zaman daha pratiktir.</p>

<h2>Sık Sorulan Sorular</h2>

<h3>Antalya'da araç kiralamak transferden ucuz mu?</h3>
<p>Sadece havalimanı–otel yolculuğunu düşünürseniz genelde hayır, çünkü kiralama ücretine yakıt, otopark ve otoyol eklenir. Ama tatiliniz boyunca her gün araç kullanacaksanız, günlük maliyet düşer ve araç kiralamak öne geçer. Karar tek bir yolculuğa değil, toplam kullanıma bakılarak verilmeli.</p>

<h3>Transfer fiyatı kişi başı mı, araç başına mı?</h3>
<p>Araç başınadır. Tek bir Mercedes Vito'da 5 yolcuya kadar aynı fiyatla seyahat edilir; yani bir aile, tek başına seyahat eden biriyle aynı ücreti öder.</p>

<h3>Uçuşum gecikirse ne olur?</h3>
<p>Tüm uçuşları gerçek zamanlı takip ediyoruz. Uçuşunuz gecikirse şoförünüz ek ücret olmadan bekler. Kiralık araçta ise ofis kapanmışsa aracı teslim alamayabilirsiniz — gece varışlarında bu gerçek bir risktir.</p>

<h3>Antalya'da araba kullanmak zor mu?</h3>
<p>Şehir merkezi ve sahil yolu genel olarak sürüş için uygundur, ancak yaz aylarında D400 üzerindeki trafik ve Kaleiçi çevresindeki park sorunu ilk kez gelenleri zorlayabilir. Sürüş deneyiminiz varsa yönetilebilir; ancak varış gecesi uzun bir uçuşun ardından direksiyona geçmemenizi öneririz.</p>

<h3>Transferi iptal edebilir miyim?</h3>
<p>Evet, planlanan kalkış saatinden 24 saat öncesine kadar ücretsiz iptal hakkınız bulunmaktadır.</p>
</article>$tr$,

  -- ===== CONTENT: EN =====
  $en$<article>
<p><strong>You land in Antalya with two options in front of you:</strong> pick up a rental car at the airport, or take a private transfer straight to your hotel. Most articles answering this question are selling one of the two. We do run transfers — and below you will also find the trips where renting is genuinely the better call, because the wrong choice ruins the first day of a holiday.</p>

<h2>The real question is not price, it is the shape of your trip</h2>
<p>Most people decide this on price and get it wrong. The question that actually matters is: <strong>how many times will you need a car during your stay?</strong> If the answer is "one journey there and one back", a rental makes you pay to park it, fuel it and insure it while it sits still. If the answer is "somewhere new every day", a transfer will not be enough.</p>

<h2>What renting a car in Antalya actually involves</h2>
<ul>
<li><strong>Card deposit:</strong> Almost every supplier blocks an amount on your credit card. How much depends on the company and the car class — confirm it before you book, not at the desk.</li>
<li><strong>Driving licence:</strong> Depending on your nationality you may need an International Driving Permit alongside your national licence. Check your own country's position in advance.</li>
<li><strong>Parking:</strong> Many hotels along the coast charge for parking, and finding a space around Kaleiçi and central Antalya in high season is a real problem.</li>
<li><strong>Motorway tolls:</strong> Turkish motorway tolls are collected electronically, and on a rental they are usually billed to you afterwards.</li>
<li><strong>Traffic:</strong> The D400 between Antalya and Alanya is heavy in July and August. Journey times from mapping apps often do not reflect peak season.</li>
<li><strong>Tiredness:</strong> Driving an unfamiliar car on unfamiliar roads after a long flight, often near midnight, is the riskiest part of the whole trip.</li>
</ul>

<h2>What a private transfer covers</h2>
<p>With TORVIAN the price is <strong>per vehicle, not per person</strong> — up to five passengers travel in one Mercedes Vito for the same fare. The price you see when booking is the price you pay, and it already includes fuel, tolls and waiting time.</p>
<ul>
<li>We track your flight in real time; if it is delayed, your driver waits at no extra cost</li>
<li>Your driver meets you at the designated meeting point in the arrivals hall</li>
<li>Door to door — straight from the airport to your hotel, with no other pickups</li>
<li>Free cancellation up to 24 hours before your scheduled departure time</li>
<li>Child seats at $10 per booking, requested during checkout</li>
<li>We operate 24/7, so a night arrival is booked exactly like any other</li>
</ul>

<h2>Distances that should shape your decision</h2>
<p>From Antalya Airport: <strong>Kundu–Lara 15 km</strong>, <strong>Belek 35 km</strong>, <strong>Kemer 55 km</strong>, <strong>Side 70 km</strong>, <strong>Alanya 130 km</strong>, <strong>Kaş 190 km</strong>. For the longer routes, the difference between two or three hours behind the wheel while exhausted and the same hours in the back seat is not a small one.</p>

<h2>Rent a car if…</h2>
<p>Being straight about it — for some holidays a car wins easily:</p>
<ul>
<li>You want somewhere new most days: Kaş, Kalkan, Olympos or Pamukkale on your own schedule</li>
<li>You are staying in a villa or village where public transport is thin</li>
<li>Your stay is long and the car becomes part of daily life rather than a transfer</li>
<li>You dislike fixed times and want to leave when you feel like it</li>
</ul>

<h2>Book a transfer if…</h2>
<ul>
<li>You are at an all-inclusive resort and will spend most of your time on site</li>
<li>You land at night or in the early hours</li>
<li>You are travelling as a family with children and plenty of luggage</li>
<li>You would rather not drive in Turkey for the first time on arrival day</li>
<li>You want a fixed price known before you fly</li>
</ul>

<h2>There is a third option: do both</h2>
<p>This is the one most travellers miss. <strong>Take a transfer on arrival and departure, then rent a car locally for the two or three days you actually want one.</strong> You skip the airport drive entirely, and you only pay for the car on the days it moves. Renting in your resort town is often simpler than renting at the airport.</p>

<h2>Frequently Asked Questions</h2>

<h3>Is renting a car in Antalya cheaper than a transfer?</h3>
<p>For the airport journey alone, usually not — once fuel, parking and tolls are added on top of the rental rate. But if you will drive every day of your stay, the cost per day falls and the rental pulls ahead. Judge it on your total use, not on a single journey.</p>

<h3>Is the transfer price per person or per vehicle?</h3>
<p>Per vehicle. Up to five passengers travel in a single Mercedes Vito at the same price, so a family pays what a solo traveller pays.</p>

<h3>What happens if my flight is delayed?</h3>
<p>We track all flights in real time and your driver waits for free. With a rental, a closed desk after a late arrival can mean no car at all — a genuine risk on night flights.</p>

<h3>Is driving in Antalya difficult?</h3>
<p>The city and the coastal road are manageable for an experienced driver, but summer traffic on the D400 and parking around Kaleiçi catch out first-time visitors. It is doable — we would simply not recommend making arrival night your first drive.</p>

<h3>Can I cancel my transfer?</h3>
<p>Yes, free cancellation is available up to 24 hours before your scheduled departure time.</p>
</article>$en$,

  -- ===== CONTENT: DE =====
  $de$<article>
<p><strong>Sie landen in Antalya und stehen vor zwei Möglichkeiten:</strong> am Flughafen einen Mietwagen übernehmen oder mit einem Privattransfer direkt zum Hotel fahren. Die meisten Texte zu dieser Frage verkaufen eine der beiden Seiten. Wir fahren Transfers — trotzdem finden Sie unten die Reisen, bei denen ein Mietwagen wirklich die bessere Wahl ist, denn die falsche Entscheidung verdirbt den ersten Urlaubstag.</p>

<h2>Die eigentliche Frage ist nicht der Preis, sondern Ihr Reisestil</h2>
<p>Die meisten entscheiden nach dem Preis und liegen damit falsch. Entscheidend ist: <strong>Wie oft brauchen Sie während des Aufenthalts ein Auto?</strong> Lautet die Antwort „einmal hin, einmal zurück", zahlen Sie beim Mietwagen fürs Parken, Tanken und Versichern, während er steht. Lautet sie „jeden Tag woanders hin", reicht ein Transfer nicht.</p>

<h2>Was ein Mietwagen in Antalya konkret bedeutet</h2>
<ul>
<li><strong>Kaution:</strong> Fast alle Anbieter blockieren einen Betrag auf der Kreditkarte. Die Höhe hängt von Anbieter und Fahrzeugklasse ab — klären Sie das vor der Buchung, nicht am Schalter.</li>
<li><strong>Führerschein:</strong> Je nach Staatsangehörigkeit kann zusätzlich ein internationaler Führerschein verlangt werden. Prüfen Sie die Regelung für Ihr Land vorab.</li>
<li><strong>Parken:</strong> Viele Hotels an der Küste verlangen Parkgebühren, und rund um Kaleiçi und die Innenstadt ist ein Platz in der Hochsaison schwer zu finden.</li>
<li><strong>Maut:</strong> Türkische Autobahnmaut wird elektronisch erhoben und beim Mietwagen in der Regel nachträglich abgerechnet.</li>
<li><strong>Verkehr:</strong> Die D400 zwischen Antalya und Alanya ist im Juli und August stark befahren. Fahrzeiten aus Karten-Apps bilden die Hochsaison oft nicht ab.</li>
<li><strong>Müdigkeit:</strong> Nach einem langen Flug, häufig um Mitternacht, ein fremdes Auto auf fremden Straßen zu fahren, ist der riskanteste Teil der ganzen Reise.</li>
</ul>

<h2>Was ein Privattransfer abdeckt</h2>
<p>Bei TORVIAN gilt der Preis <strong>pro Fahrzeug, nicht pro Person</strong> — bis zu fünf Passagiere reisen im selben Mercedes Vito zum gleichen Preis. Der Preis bei der Buchung ist der Preis, den Sie zahlen; Kraftstoff, Maut und Wartezeit sind enthalten.</p>
<ul>
<li>Wir verfolgen Ihren Flug in Echtzeit; bei Verspätung wartet Ihr Fahrer kostenlos</li>
<li>Ihr Fahrer erwartet Sie am designierten Treffpunkt in der Ankunftshalle</li>
<li>Von Tür zu Tür — direkt vom Flughafen zu Ihrem Hotel, ohne Zwischenstopps</li>
<li>Kostenlose Stornierung bis 24 Stunden vor der geplanten Abfahrt</li>
<li>Kindersitze für 10 $ pro Buchung, bei der Buchung angeben</li>
<li>Wir fahren rund um die Uhr, eine Nachtankunft wird wie jede andere gebucht</li>
</ul>

<h2>Entfernungen, die Ihre Entscheidung beeinflussen</h2>
<p>Ab Flughafen Antalya: <strong>Kundu–Lara 15 km</strong>, <strong>Belek 35 km</strong>, <strong>Kemer 55 km</strong>, <strong>Side 70 km</strong>, <strong>Alanya 130 km</strong>, <strong>Kaş 190 km</strong>. Auf den längeren Strecken ist der Unterschied zwischen zwei bis drei Stunden am Steuer in müdem Zustand und denselben Stunden auf der Rückbank erheblich.</p>

<h2>Nehmen Sie einen Mietwagen, wenn…</h2>
<p>Ehrlich gesagt gewinnt bei manchen Reisen das Auto deutlich:</p>
<ul>
<li>Sie fast täglich woanders hinwollen: Kaş, Kalkan, Olympos oder Pamukkale nach eigenem Plan</li>
<li>Sie in einer Villa oder einem Dorf mit dünnem Nahverkehr wohnen</li>
<li>Ihr Aufenthalt lang ist und das Auto Teil des Alltags wird</li>
<li>Sie feste Zeiten nicht mögen und losfahren wollen, wann Sie möchten</li>
</ul>

<h2>Buchen Sie einen Transfer, wenn…</h2>
<ul>
<li>Sie in einem All-inclusive-Resort wohnen und die meiste Zeit dort verbringen</li>
<li>Sie nachts oder in den frühen Morgenstunden landen</li>
<li>Sie als Familie mit Kindern und viel Gepäck reisen</li>
<li>Sie am Anreisetag nicht zum ersten Mal in der Türkei fahren möchten</li>
<li>Sie einen Festpreis wollen, den Sie schon vor dem Abflug kennen</li>
</ul>

<h2>Es gibt einen dritten Weg: beides</h2>
<p>Diese Möglichkeit übersehen die meisten. <strong>Nehmen Sie Transfers für An- und Abreise und mieten Sie vor Ort ein Auto für die zwei oder drei Tage, an denen Sie es wirklich brauchen.</strong> Die Flughafenfahrt entfällt, und Sie zahlen das Auto nur an den Tagen, an denen es fährt. Die Anmietung im Urlaubsort ist oft unkomplizierter als am Flughafen.</p>

<h2>Häufig gestellte Fragen</h2>

<h3>Ist ein Mietwagen in Antalya günstiger als ein Transfer?</h3>
<p>Für die reine Flughafenfahrt meist nicht, sobald Kraftstoff, Parken und Maut zur Mietrate hinzukommen. Fahren Sie dagegen jeden Tag, sinken die Kosten pro Tag und der Mietwagen zieht vorbei. Entscheidend ist die Gesamtnutzung, nicht eine einzelne Fahrt.</p>

<h3>Gilt der Transferpreis pro Person oder pro Fahrzeug?</h3>
<p>Pro Fahrzeug. Bis zu fünf Passagiere reisen in einem Mercedes Vito zum gleichen Preis — eine Familie zahlt so viel wie ein Alleinreisender.</p>

<h3>Was passiert, wenn mein Flug Verspätung hat?</h3>
<p>Wir verfolgen alle Flüge in Echtzeit, Ihr Fahrer wartet kostenlos. Beim Mietwagen kann ein geschlossener Schalter nach später Ankunft bedeuten, dass Sie gar kein Auto bekommen — bei Nachtflügen ein reales Risiko.</p>

<h3>Ist Autofahren in Antalya schwierig?</h3>
<p>Stadt und Küstenstraße sind für geübte Fahrer gut machbar, doch der Sommerverkehr auf der D400 und die Parkplatzsuche rund um Kaleiçi überraschen Ersturlauber. Machbar ist es — wir würden die Anreisenacht nur nicht zur ersten Fahrt machen.</p>

<h3>Kann ich meinen Transfer stornieren?</h3>
<p>Ja, eine kostenlose Stornierung ist bis zu 24 Stunden vor der geplanten Abfahrt möglich.</p>
</article>$de$,

  -- ===== CONTENT: PL =====
  $pl$<article>
<p><strong>Lądujesz w Antalyi i masz przed sobą dwie opcje:</strong> odebrać auto z wypożyczalni na lotnisku albo pojechać prywatnym transferem prosto do hotelu. Większość tekstów o tym sprzedaje jedną ze stron. My realizujemy transfery — a mimo to poniżej znajdziesz wyjazdy, przy których auto naprawdę wygrywa, bo zły wybór potrafi zepsuć pierwszy dzień urlopu.</p>

<h2>Prawdziwe pytanie to nie cena, tylko charakter wyjazdu</h2>
<p>Większość decyduje po cenie i się myli. Liczy się co innego: <strong>ile razy w czasie pobytu naprawdę będziesz potrzebować auta?</strong> Jeśli odpowiedź brzmi „raz w jedną i raz w drugą stronę", przy wynajmie płacisz za parkowanie, paliwo i ubezpieczenie samochodu, który stoi. Jeśli brzmi „codziennie gdzie indziej", transfer nie wystarczy.</p>

<h2>Co naprawdę oznacza wynajem auta w Antalyi</h2>
<ul>
<li><strong>Kaucja na karcie:</strong> Niemal każda wypożyczalnia blokuje kwotę na karcie kredytowej. Wysokość zależy od firmy i klasy auta — potwierdź to przed rezerwacją, nie przy ladzie.</li>
<li><strong>Prawo jazdy:</strong> W zależności od obywatelstwa może być wymagane międzynarodowe prawo jazdy obok krajowego. Sprawdź zasady dla swojego kraju wcześniej.</li>
<li><strong>Parkowanie:</strong> Wiele hoteli na wybrzeżu pobiera opłatę za parking, a znalezienie miejsca wokół Kaleiçi i w centrum Antalyi w szczycie sezonu to realny problem.</li>
<li><strong>Opłaty drogowe:</strong> Tureckie autostrady rozliczane są elektronicznie, a przy aucie z wypożyczalni najczęściej doliczane później.</li>
<li><strong>Ruch:</strong> Droga D400 między Antalyą a Alanyą w lipcu i sierpniu jest mocno obciążona. Czasy z map często nie oddają sezonu.</li>
<li><strong>Zmęczenie:</strong> Prowadzenie nieznanego auta po nieznanych drogach po długim locie, często koło północy, to najbardziej ryzykowna część całej podróży.</li>
</ul>

<h2>Co obejmuje transfer prywatny</h2>
<p>W TORVIAN cena jest <strong>za pojazd, nie od osoby</strong> — do pięciu pasażerów jedzie jednym Mercedesem Vito w tej samej cenie. Cena widoczna przy rezerwacji to cena, którą płacisz; paliwo, opłaty drogowe i czas oczekiwania są wliczone.</p>
<ul>
<li>Śledzimy Twój lot w czasie rzeczywistym; przy opóźnieniu kierowca czeka bezpłatnie</li>
<li>Kierowca wita Cię w wyznaczonym punkcie spotkania w hali przylotów</li>
<li>Od drzwi do drzwi — prosto z lotniska do hotelu, bez dodatkowych postojów</li>
<li>Bezpłatna anulacja do 24 godzin przed planowanym odjazdem</li>
<li>Foteliki dziecięce za $10 za rezerwację, zaznaczane przy rezerwacji</li>
<li>Jeździmy 24/7, więc nocny przylot rezerwuje się tak samo jak każdy inny</li>
</ul>

<h2>Odległości, które powinny wpłynąć na decyzję</h2>
<p>Z lotniska Antalya: <strong>Kundu–Lara 15 km</strong>, <strong>Belek 35 km</strong>, <strong>Kemer 55 km</strong>, <strong>Side 70 km</strong>, <strong>Alanya 130 km</strong>, <strong>Kaş 190 km</strong>. Na dłuższych trasach różnica między dwiema–trzema godzinami za kierownicą po locie a tymi samymi godzinami na tylnym siedzeniu jest znacząca.</p>

<h2>Wynajmij auto, jeśli…</h2>
<p>Szczerze — przy części wyjazdów auto wygrywa zdecydowanie:</p>
<ul>
<li>Chcesz niemal codziennie gdzie indziej: Kaş, Kalkan, Olympos czy Pamukkale we własnym rytmie</li>
<li>Mieszkasz w willi lub miejscowości ze słabą komunikacją</li>
<li>Pobyt jest długi, a auto staje się częścią codzienności</li>
<li>Nie lubisz sztywnych godzin i chcesz ruszać, kiedy masz ochotę</li>
</ul>

<h2>Zarezerwuj transfer, jeśli…</h2>
<ul>
<li>Mieszkasz w hotelu all inclusive i większość czasu spędzisz na miejscu</li>
<li>Lądujesz w nocy lub nad ranem</li>
<li>Podróżujesz z dziećmi i sporym bagażem</li>
<li>Wolisz nie prowadzić w Turcji po raz pierwszy w dniu przylotu</li>
<li>Chcesz stałą cenę znaną jeszcze przed wylotem</li>
</ul>

<h2>Jest trzecia droga: połącz oba</h2>
<p>Tę opcję pomija większość turystów. <strong>Weź transfer na przylot i powrót, a auto wynajmij na miejscu na te dwa czy trzy dni, kiedy naprawdę go potrzebujesz.</strong> Omijasz trasę z lotniska, a za auto płacisz tylko wtedy, gdy jeździ. Wynajem w kurorcie bywa prostszy niż na lotnisku.</p>

<h2>Często zadawane pytania</h2>

<h3>Czy wynajem auta w Antalyi jest tańszy niż transfer?</h3>
<p>Dla samego przejazdu z lotniska zwykle nie — po doliczeniu paliwa, parkowania i opłat drogowych do stawki najmu. Ale jeśli będziesz jeździć codziennie, koszt dzienny spada i auto wychodzi na prowadzenie. Licz całkowite użycie, nie jeden przejazd.</p>

<h3>Cena transferu jest od osoby czy za pojazd?</h3>
<p>Za pojazd. Do pięciu pasażerów jedzie jednym Mercedesem Vito w tej samej cenie, więc rodzina płaci tyle co osoba podróżująca sama.</p>

<h3>Co jeśli mój lot się opóźni?</h3>
<p>Śledzimy wszystkie loty w czasie rzeczywistym, a kierowca czeka bezpłatnie. Przy wynajmie zamknięte biuro po późnym przylocie może oznaczać brak auta — przy nocnych lotach to realne ryzyko.</p>

<h3>Czy jazda w Antalyi jest trudna?</h3>
<p>Miasto i droga nadmorska są do opanowania dla doświadczonego kierowcy, ale letni ruch na D400 i parkowanie wokół Kaleiçi zaskakują przyjezdnych po raz pierwszy. Da się — po prostu nie robilibyśmy z nocy przylotu pierwszej jazdy.</p>

<h3>Czy mogę anulować transfer?</h3>
<p>Tak, darmowa anulacja jest możliwa do 24 godzin przed planowanym odjazdem.</p>
</article>$pl$,

  -- ===== CONTENT: RU =====
  $ru$<article>
<p><strong>Вы прилетаете в Анталию, и перед вами два варианта:</strong> взять машину напрокат в аэропорту или доехать до отеля частным трансфером. Большинство статей на эту тему продают одну из сторон. Мы занимаемся трансферами — и всё же ниже честно написали, когда аренда действительно выигрывает, потому что неверный выбор портит первый день отпуска.</p>

<h2>Главный вопрос не цена, а формат поездки</h2>
<p>Большинство решает по цене и ошибается. Важно другое: <strong>сколько раз за отпуск вам действительно нужна машина?</strong> Если ответ «один раз туда и один обратно», то при аренде вы платите за парковку, топливо и страховку простаивающего автомобиля. Если ответ «каждый день в новое место», трансфера не хватит.</p>

<h2>Что на деле означает аренда авто в Анталии</h2>
<ul>
<li><strong>Залог на карте:</strong> Почти все компании блокируют сумму на кредитной карте. Размер зависит от прокатной фирмы и класса машины — уточняйте до бронирования, а не на стойке.</li>
<li><strong>Водительские права:</strong> В зависимости от гражданства может потребоваться международное водительское удостоверение вместе с национальным. Проверьте правила для своей страны заранее.</li>
<li><strong>Парковка:</strong> Многие отели на побережье берут плату за парковку, а найти место в районе Калеичи и в центре Анталии в разгар сезона — реальная проблема.</li>
<li><strong>Платные дороги:</strong> Проезд по турецким автомагистралям оплачивается электронно и при аренде обычно выставляется постфактум.</li>
<li><strong>Трафик:</strong> Трасса D400 между Анталией и Аланьей в июле и августе загружена. Время в пути из навигаторов часто не отражает сезон.</li>
<li><strong>Усталость:</strong> Вести незнакомую машину по незнакомым дорогам после долгого перелёта, нередко за полночь, — самая рискованная часть всей поездки.</li>
</ul>

<h2>Что включает частный трансфер</h2>
<p>В TORVIAN цена указана <strong>за автомобиль, а не за человека</strong> — до пяти пассажиров едут в одном Mercedes Vito по одной цене. Цена, которую вы видите при бронировании, и есть итоговая: топливо, дорожные сборы и время ожидания уже включены.</p>
<ul>
<li>Мы отслеживаем ваш рейс в реальном времени; при задержке водитель ждёт бесплатно</li>
<li>Водитель встречает вас в назначенном месте встречи в зале прилёта</li>
<li>От двери до двери — прямо из аэропорта в отель, без попутчиков</li>
<li>Бесплатная отмена за 24 часа до запланированного отправления</li>
<li>Детское кресло — $10 за бронирование, указывается при оформлении</li>
<li>Работаем круглосуточно, ночной прилёт бронируется так же, как любой другой</li>
</ul>

<h2>Расстояния, которые стоит учесть</h2>
<p>От аэропорта Анталии: <strong>Кунду–Лара 15 км</strong>, <strong>Белек 35 км</strong>, <strong>Кемер 55 км</strong>, <strong>Сиде 70 км</strong>, <strong>Аланья 130 км</strong>, <strong>Каш 190 км</strong>. На длинных маршрутах разница между двумя-тремя часами за рулём в усталом состоянии и теми же часами на заднем сиденье весьма ощутима.</p>

<h2>Берите машину напрокат, если…</h2>
<p>Скажем честно — в некоторых поездках машина выигрывает уверенно:</p>
<ul>
<li>Вы хотите почти каждый день быть в новом месте: Каш, Калкан, Олимпос или Памуккале по своему графику</li>
<li>Вы живёте на вилле или в посёлке со слабым общественным транспортом</li>
<li>Отпуск длинный, и машина становится частью повседневности</li>
<li>Вы не любите фиксированное время и хотите выезжать когда захочется</li>
</ul>

<h2>Бронируйте трансфер, если…</h2>
<ul>
<li>Вы живёте в отеле «всё включено» и большую часть времени проведёте на территории</li>
<li>Вы прилетаете ночью или ранним утром</li>
<li>Вы едете семьёй с детьми и большим багажом</li>
<li>Вам не хочется впервые садиться за руль в Турции в день прилёта</li>
<li>Вам нужна фиксированная цена, известная ещё до вылета</li>
</ul>

<h2>Есть и третий путь: совместить</h2>
<p>Этот вариант упускают чаще всего. <strong>Возьмите трансфер на прилёт и вылет, а машину арендуйте на месте на те два-три дня, когда она действительно нужна.</strong> Дорога из аэропорта отпадает, а за автомобиль вы платите только в дни, когда он едет. Аренда в курортном городке нередко проще, чем в аэропорту.</p>

<h2>Часто задаваемые вопросы</h2>

<h3>Аренда авто в Анталии дешевле трансфера?</h3>
<p>Только ради поездки из аэропорта — обычно нет, как только к тарифу добавятся топливо, парковка и платные дороги. Но если вы будете ездить каждый день, стоимость дня снижается и аренда выходит вперёд. Считайте по общему использованию, а не по одной поездке.</p>

<h3>Цена трансфера за человека или за автомобиль?</h3>
<p>За автомобиль. До пяти пассажиров едут в одном Mercedes Vito по одной цене, поэтому семья платит столько же, сколько один пассажир.</p>

<h3>Что если мой рейс задержится?</h3>
<p>Мы отслеживаем все рейсы в реальном времени, водитель ждёт бесплатно. При аренде закрытая стойка после позднего прилёта может означать, что машины вы не получите — для ночных рейсов это реальный риск.</p>

<h3>Сложно ли водить в Анталии?</h3>
<p>Город и приморская дорога вполне посильны для опытного водителя, но летний трафик на D400 и парковка у Калеичи застают новичков врасплох. Это выполнимо — мы лишь не советовали бы делать ночь прилёта своей первой поездкой за рулём.</p>

<h3>Можно ли отменить трансфер?</h3>
<p>Да, бесплатная отмена возможна за 24 часа до запланированного отправления.</p>
</article>$ru$,

  -- ===== CONTENT: NL =====
  $nl$<article>
<p><strong>U landt in Antalya en staat voor twee keuzes:</strong> een huurauto ophalen op de luchthaven, of met een privétransfer rechtstreeks naar uw hotel. De meeste artikelen hierover verkopen één van beide. Wij rijden transfers — en toch leest u hieronder ook wanneer huren écht de betere keuze is, want de verkeerde beslissing verpest de eerste vakantiedag.</p>

<h2>De echte vraag is niet de prijs, maar de vorm van uw reis</h2>
<p>De meeste mensen beslissen op prijs en zitten er dan naast. Wat werkelijk telt: <strong>hoe vaak heeft u tijdens uw verblijf een auto nodig?</strong> Is het antwoord "één keer heen en één keer terug", dan betaalt u bij een huurauto voor parkeren, brandstof en verzekering terwijl hij stilstaat. Is het "elke dag ergens anders", dan volstaat een transfer niet.</p>

<h2>Wat een huurauto in Antalya werkelijk inhoudt</h2>
<ul>
<li><strong>Borg op uw kaart:</strong> Vrijwel elke verhuurder blokkeert een bedrag op uw creditcard. Hoeveel hangt af van het bedrijf en de autoklasse — regel dit vóór het boeken, niet aan de balie.</li>
<li><strong>Rijbewijs:</strong> Afhankelijk van uw nationaliteit kan een internationaal rijbewijs naast uw nationale vereist zijn. Controleer vooraf wat voor uw land geldt.</li>
<li><strong>Parkeren:</strong> Veel hotels aan de kust rekenen parkeerkosten, en rond Kaleiçi en het centrum van Antalya is een plek vinden in het hoogseizoen een reëel probleem.</li>
<li><strong>Tol:</strong> Turkse snelwegtol wordt elektronisch geïnd en bij een huurauto meestal achteraf doorbelast.</li>
<li><strong>Verkeer:</strong> De D400 tussen Antalya en Alanya is druk in juli en augustus. Reistijden uit kaart-apps geven het hoogseizoen vaak niet weer.</li>
<li><strong>Vermoeidheid:</strong> Na een lange vlucht, vaak rond middernacht, in een onbekende auto over onbekende wegen rijden is het risicovolste deel van de hele reis.</li>
</ul>

<h2>Wat een privétransfer dekt</h2>
<p>Bij TORVIAN geldt de prijs <strong>per voertuig, niet per persoon</strong> — tot vijf passagiers reizen samen in één Mercedes Vito voor dezelfde prijs. De prijs die u bij het boeken ziet is de prijs die u betaalt; brandstof, tol en wachttijd zitten er al in.</p>
<ul>
<li>Wij volgen uw vlucht in realtime; bij vertraging wacht uw chauffeur kosteloos</li>
<li>Uw chauffeur ontvangt u op het aangewezen punt in de aankomsthal</li>
<li>Van deur tot deur — rechtstreeks van de luchthaven naar uw hotel, zonder tussenstops</li>
<li>Gratis annuleren tot 24 uur voor de geplande vertrektijd</li>
<li>Kinderzitjes voor $10 per boeking, aan te geven tijdens het boeken</li>
<li>Wij rijden 24 uur per dag, dus een nachtelijke aankomst boekt u net als elke andere</li>
</ul>

<h2>Afstanden die uw keuze zouden moeten bepalen</h2>
<p>Vanaf de luchthaven Antalya: <strong>Kundu–Lara 15 km</strong>, <strong>Belek 35 km</strong>, <strong>Kemer 55 km</strong>, <strong>Side 70 km</strong>, <strong>Alanya 130 km</strong>, <strong>Kaş 190 km</strong>. Op de langere routes is het verschil tussen twee of drie uur achter het stuur na een vlucht en dezelfde uren op de achterbank aanzienlijk.</p>

<h2>Huur een auto als…</h2>
<p>Eerlijk gezegd wint bij sommige reizen de auto ruimschoots:</p>
<ul>
<li>U wilt bijna elke dag ergens anders heen: Kaş, Kalkan, Olympos of Pamukkale op uw eigen tempo</li>
<li>U verblijft in een villa of dorp met weinig openbaar vervoer</li>
<li>Uw verblijf is lang en de auto wordt onderdeel van het dagelijks leven</li>
<li>U houdt niet van vaste tijden en wilt vertrekken wanneer het u uitkomt</li>
</ul>

<h2>Boek een transfer als…</h2>
<ul>
<li>U in een all-inclusive resort verblijft en er de meeste tijd doorbrengt</li>
<li>U 's nachts of in de vroege ochtend landt</li>
<li>U met kinderen en veel bagage reist</li>
<li>U liever niet voor het eerst in Turkije rijdt op de dag van aankomst</li>
<li>U een vaste prijs wilt die u al voor vertrek kent</li>
</ul>

<h2>Er is een derde weg: doe beide</h2>
<p>Deze optie missen de meeste reizigers. <strong>Neem een transfer bij aankomst en vertrek, en huur ter plaatse een auto voor de twee of drie dagen dat u er echt een wilt.</strong> De rit van en naar de luchthaven vervalt, en u betaalt de auto alleen op de dagen dat hij rijdt. Huren in uw vakantieplaats is vaak eenvoudiger dan op de luchthaven.</p>

<h2>Veelgestelde vragen</h2>

<h3>Is een auto huren in Antalya goedkoper dan een transfer?</h3>
<p>Voor alleen de rit vanaf de luchthaven meestal niet, zodra brandstof, parkeren en tol bij het huurtarief komen. Rijdt u elke dag, dan dalen de kosten per dag en wint de huurauto. Reken op uw totale gebruik, niet op één rit.</p>

<h3>Is de transferprijs per persoon of per voertuig?</h3>
<p>Per voertuig. Tot vijf passagiers reizen in één Mercedes Vito voor dezelfde prijs, dus een gezin betaalt evenveel als een alleenreizende.</p>

<h3>Wat gebeurt er als mijn vlucht vertraging heeft?</h3>
<p>Wij volgen alle vluchten in realtime en uw chauffeur wacht kosteloos. Bij een huurauto kan een gesloten balie na een late landing betekenen dat u helemaal geen auto krijgt — bij nachtvluchten een reëel risico.</p>

<h3>Is autorijden in Antalya lastig?</h3>
<p>De stad en de kustweg zijn goed te doen voor een ervaren bestuurder, maar het zomerverkeer op de D400 en parkeren rond Kaleiçi verrassen wie er voor het eerst komt. Het kan — wij zouden de aankomstnacht alleen niet tot uw eerste rit maken.</p>

<h3>Kan ik mijn transfer annuleren?</h3>
<p>Ja, u kunt tot 24 uur voor de geplande vertrektijd gratis annuleren.</p>
</article>$nl$,

  -- ===== LOCALIZED SLUGS =====
  'antalya-arac-kiralama-mi-transfer-mi',
  'car-rental-vs-private-transfer-antalya',
  'mietwagen-oder-privattransfer-antalya',
  'wynajem-auta-czy-transfer-prywatny-antalya',
  'arenda-avto-ili-chastnyy-transfer-antaliya',
  'huurauto-of-privetransfer-antalya',

  -- ===== FOCUS KEYWORDS =====
  'antalya araç kiralama mı transfer mi',
  'car rental vs private transfer antalya',
  'mietwagen oder privattransfer antalya',
  'wynajem auta czy transfer antalya',
  'аренда авто или трансфер анталия',
  'huurauto of privetransfer antalya',

  true, NOW()
)

ON CONFLICT (slug) DO UPDATE SET
  title_tr = EXCLUDED.title_tr, title_en = EXCLUDED.title_en, title_de = EXCLUDED.title_de,
  title_pl = EXCLUDED.title_pl, title_ru = EXCLUDED.title_ru, title_nl = EXCLUDED.title_nl,
  excerpt_tr = EXCLUDED.excerpt_tr, excerpt_en = EXCLUDED.excerpt_en, excerpt_de = EXCLUDED.excerpt_de,
  excerpt_pl = EXCLUDED.excerpt_pl, excerpt_ru = EXCLUDED.excerpt_ru, excerpt_nl = EXCLUDED.excerpt_nl,
  content_tr = EXCLUDED.content_tr, content_en = EXCLUDED.content_en, content_de = EXCLUDED.content_de,
  content_pl = EXCLUDED.content_pl, content_ru = EXCLUDED.content_ru, content_nl = EXCLUDED.content_nl,
  slug_tr = EXCLUDED.slug_tr, slug_en = EXCLUDED.slug_en, slug_de = EXCLUDED.slug_de,
  slug_pl = EXCLUDED.slug_pl, slug_ru = EXCLUDED.slug_ru, slug_nl = EXCLUDED.slug_nl,
  focus_keyword_tr = EXCLUDED.focus_keyword_tr, focus_keyword_en = EXCLUDED.focus_keyword_en,
  focus_keyword_de = EXCLUDED.focus_keyword_de, focus_keyword_pl = EXCLUDED.focus_keyword_pl,
  focus_keyword_ru = EXCLUDED.focus_keyword_ru, focus_keyword_nl = EXCLUDED.focus_keyword_nl,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- ===== Verification =====
--   SELECT slug, is_published, title_en, slug_en
--     FROM blog_posts WHERE slug = 'antalya-arac-kiralama-mi-transfer-mi';
--
-- Then check the six live URLs render (each shared slug 301s to the locale's
-- own slug, which is the behaviour every other post has):
--   /tr/blog/antalya-arac-kiralama-mi-transfer-mi
--   /en/blog/car-rental-vs-private-transfer-antalya
--   /de/blog/mietwagen-oder-privattransfer-antalya
--   /pl/blog/wynajem-auta-czy-transfer-prywatny-antalya
--   /ru/blog/arenda-avto-ili-chastnyy-transfer-antaliya
--   /nl/blog/huurauto-of-privetransfer-antalya
--
-- Upload a featured image from the admin blog editor when one is available;
-- image_url is intentionally NULL rather than borrowed from another post.
