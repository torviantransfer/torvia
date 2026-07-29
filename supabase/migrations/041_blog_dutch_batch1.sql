-- 041: Dutch blog translations — batch 1 (distance & duration cluster)
--
-- Scope is deliberate. Search Console's Dutch queries are almost entirely one
-- intent — distance and journey time:
--   "hoe lang is het rijden van antalya naar alanya"
--   "hoe lang duurt transfer van antalya naar alanya"
--   "transfer antalya alanya tijd"  ·  "antalya naar alanya"
--   "antalya side afstand"  ·  "afstand luchthaven antalya naar side"
--   "antalya luchthaven transfer"
-- These five posts cover that cluster. Remaining posts follow in a later batch;
-- until then they simply have no Dutch version, which the app handles by
-- marking /nl/ noindex for that post and omitting it from the sitemap — no
-- duplicate-content risk, no broken page.
--
-- DATA SOURCE FOR EVERY NUMBER BELOW: supabase/seed.sql, which is the live
-- regions data (migration 010 deleted the competing 002 rows via
-- "AND id::text NOT LIKE 'b0000000%'"). Blog figures must match what the
-- region page renders from distance_km / duration_minutes, or the article
-- contradicts the booking engine:
--   kundu-lara 15/20 · kadriye 30/30 · belek 35/35 · beldibi 40/35
--   bogazkent 45/40 · goynuk 50/40 · kemer 55/50 · evrenseki 60/50
--   kiris 60/55 · camyuva 65/55 · side 70/60 · tekirova 70/60
--   kizilagac 80/70 · okurcalar 100/80 · turkler 110/85 · alanya 130/120
--   mahmutlar 140/130 · kargicak 145/135
--
-- Dollar-quoted ($nl$) so Dutch apostrophes need no SQL escaping.
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Antalya Airport → Alanya, journey time
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_nl = $nl$Hoe lang duurt de transfer van Antalya naar Alanya?$nl$,
excerpt_nl = $nl$Van de luchthaven Antalya naar Alanya is het 130 km en duurt de rit ongeveer 2 uur met een privétransfer. Alanya heeft geen bruikbare eigen luchthaven — AYT is de dichtstbijzijnde. Vaste prijs, vluchtmonitoring.$nl$,
content_nl = $nl$
<p>De rit van de <strong>luchthaven Antalya (AYT) naar Alanya</strong> duurt met een privétransfer <strong>ongeveer 2 uur</strong> over een afstand van <strong>130 kilometer</strong>. Dat is de reële deur-tot-deurtijd, inclusief het verlaten van het luchthaventerrein en de rit door Alanya naar uw hotel.</p>

<h2>Afstand en reistijd in één oogopslag</h2>
<table>
  <tr><th>Bestemming</th><th>Afstand vanaf AYT</th><th>Reistijd</th></tr>
  <tr><td>Türkler</td><td>110 km</td><td>± 1 uur 25 min</td></tr>
  <tr><td>Alanya centrum</td><td>130 km</td><td>± 2 uur</td></tr>
  <tr><td>Mahmutlar</td><td>140 km</td><td>± 2 uur 10 min</td></tr>
  <tr><td>Kargıcak</td><td>145 km</td><td>± 2 uur 15 min</td></tr>
</table>

<h2>Heeft Alanya een eigen luchthaven?</h2>
<p>Formeel wel, maar in de praktijk niet. Luchthaven Gazipaşa-Alanya (GZP) ligt ten oosten van Alanya en verwerkt slechts een handvol vluchten. Nagenoeg alle charter- en lijnvluchten uit Nederland en België landen op <strong>Antalya (AYT)</strong>. Reken dus op AYT als uw aankomstluchthaven.</p>

<h2>Waarom loopt de reistijd soms op?</h2>
<p>De route volgt de kustweg D400. Deze is goed onderhouden, maar drie factoren bepalen of u er net onder de twee uur of ruim daarboven over doet:</p>
<ul>
  <li><strong>Seizoen.</strong> In juli en augustus is het rond Manavgat en Side drukker; reken op 15 tot 25 minuten extra.</li>
  <li><strong>Aankomsttijd.</strong> Tussen 14:00 en 19:00 landen de meeste vakantievluchten, waardoor het bij de luchthavenuitgang vol staat.</li>
  <li><strong>Uw exacte hotel.</strong> Alanya strekt zich over tientallen kilometers kust uit. Een hotel in Mahmutlar of Kargıcak ligt 10 tot 15 minuten voorbij het centrum.</li>
</ul>

<h2>Privétransfer, shuttle of taxi?</h2>
<table>
  <tr><th>Optie</th><th>Reistijd</th><th>Prijs</th><th>Deur tot deur</th></tr>
  <tr><td>Privé VIP-transfer</td><td>± 2 uur</td><td>Vast, per voertuig</td><td>Ja</td></tr>
  <tr><td>Gedeelde shuttle</td><td>3–4 uur</td><td>Per persoon</td><td>Nee, meerdere stops</td></tr>
  <tr><td>Lokale taxi</td><td>± 2 uur</td><td>Taxameter, onvoorspelbaar</td><td>Ja</td></tr>
  <tr><td>Lijnbus (via busstation)</td><td>4 uur en langer</td><td>Laag</td><td>Nee, overstappen</td></tr>
</table>
<p>Een gedeelde shuttle is per persoon goedkoper, maar zet eerst andere passagiers af. Bij een gezin van vier is een privétransfer vaak nauwelijks duurder én twee uur sneller.</p>

<h2>Wat als mijn vlucht vertraging heeft?</h2>
<p>Wij volgen uw vluchtnummer in realtime. Landt u later, dan verschuift de ophaaltijd automatisch mee en wacht uw chauffeur zonder extra kosten. U hoeft niets te melden en niets om te boeken.</p>

<h2>Veelgestelde vragen</h2>

<h3>Hoe lang duurt de transfer van de luchthaven Antalya naar Alanya?</h3>
<p>Met een privétransfer ongeveer 2 uur over 130 km. In het hoogseizoen kan dit oplopen tot 2 uur en 20 minuten. Een gedeelde shuttle doet er door tussenstops 3 tot 4 uur over.</p>

<h3>Hoeveel kilometer is het van de luchthaven Antalya naar Alanya?</h3>
<p>De afstand van de luchthaven Antalya naar het centrum van Alanya is 130 kilometer via de kustweg D400. Naar Mahmutlar is het 140 km en naar Kargıcak 145 km.</p>

<h3>Kan ik 's nachts een transfer naar Alanya boeken?</h3>
<p>Ja. Wij rijden 24 uur per dag, het hele jaar door. Voor nachtelijke aankomsten geldt geen toeslag en uw chauffeur staat gewoon klaar in de aankomsthal.</p>

<h3>Wat kost een privétransfer van Antalya naar Alanya?</h3>
<p>De prijs is een vast bedrag per voertuig, niet per persoon, en is inclusief tol, brandstof en wachttijd. Tot 5 passagiers reizen samen in één Mercedes Vito. U ziet het exacte bedrag voordat u boekt.</p>

<h3>Is er een luchthaven in Alanya zelf?</h3>
<p>Gazipaşa-Alanya (GZP) bestaat, maar heeft nauwelijks vluchten vanuit West-Europa. Vrijwel alle reizigers landen op Antalya (AYT) en rijden vandaar door naar Alanya.</p>

<div style="margin:32px 0;padding:24px;border-radius:16px;background:#f1f5f9;border:1px solid #e2e8f0;text-align:center">
  <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a">Privétransfer luchthaven Antalya → Alanya</p>
  <p style="margin:0 0 16px;color:#475569">Vaste prijs per voertuig · Mercedes Vito · vluchtmonitoring · gratis annuleren tot 24 uur vooraf</p>
  <a href="/nl/alanya-transfer" style="display:inline-block;padding:12px 28px;border-radius:999px;background:#F97316;color:#fff;font-weight:600;text-decoration:none">Bekijk prijzen en boek online</a>
</div>
$nl$
WHERE slug = 'antalya-havalimani-alanya-transfer-kac-saat';


-- ---------------------------------------------------------------------------
-- 2. Antalya → Alanya, travel time (companion post)
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_nl = $nl$Antalya naar Alanya: reistijd, afstand en route$nl$,
excerpt_nl = $nl$Van Antalya naar Alanya is het 130 km over de kustweg D400 en duurt de rit circa 2 uur. Bekijk de reistijd per wijk, de beste vertrektijden en uw vervoersopties.$nl$,
content_nl = $nl$
<p>De route <strong>Antalya – Alanya</strong> is 130 kilometer lang en kost u met een privéauto <strong>ongeveer 2 uur</strong>. De hele rit gaat over de kustweg D400, met de Middellandse Zee aan uw rechterhand en het Taurusgebergte links.</p>

<h2>Reistijd per bestemming in de regio Alanya</h2>
<table>
  <tr><th>Bestemming</th><th>Afstand vanaf AYT</th><th>Reistijd</th></tr>
  <tr><td>Okurcalar</td><td>100 km</td><td>± 1 uur 20 min</td></tr>
  <tr><td>Türkler</td><td>110 km</td><td>± 1 uur 25 min</td></tr>
  <tr><td>Alanya centrum</td><td>130 km</td><td>± 2 uur</td></tr>
  <tr><td>Mahmutlar</td><td>140 km</td><td>± 2 uur 10 min</td></tr>
  <tr><td>Kargıcak</td><td>145 km</td><td>± 2 uur 15 min</td></tr>
</table>

<h2>Wat u onderweg passeert</h2>
<p>De D400 voert u langs Belek (35 km), Side (70 km) en Kızılağaç (80 km). Ongeveer halverwege liggen verzorgingsplaatsen waar u kunt pauzeren — handig als u met kinderen reist. Vraag uw chauffeur gerust om een korte stop; bij een privétransfer kost dat niets extra.</p>

<h2>Hoe laat kunt u het beste vertrekken?</h2>
<ul>
  <li><strong>Rustigst:</strong> vroege ochtend (06:00–10:00) en late avond (na 21:00).</li>
  <li><strong>Drukst:</strong> 14:00–19:00, wanneer de meeste vakantievluchten landen.</li>
  <li><strong>Zaterdag</strong> is doorgaans de drukste wisseldag van het seizoen.</li>
</ul>
<p>Bij een privétransfer maakt dit voor de prijs niets uit — die staat vooraf vast, ongeacht het tijdstip of de verkeersdrukte.</p>

<h2>Veelgestelde vragen</h2>

<h3>Hoeveel kilometer is Antalya van Alanya?</h3>
<p>Het is 130 kilometer van de luchthaven Antalya naar het centrum van Alanya, volledig over de kustweg D400.</p>

<h3>Hoe lang duurt de rit van Antalya naar Alanya met de auto?</h3>
<p>Ongeveer 2 uur bij normale verkeersomstandigheden. In het hoogseizoen en tijdens de piekuren kan dit 15 tot 25 minuten langer duren.</p>

<h3>Rijdt er een bus van Antalya naar Alanya?</h3>
<p>Ja, er rijden lijnbussen vanaf het busstation van Antalya. Reken vanaf de luchthaven op 4 uur of meer, inclusief de rit naar het busstation en het wachten. U wordt bovendien in het centrum van Alanya afgezet, niet bij uw hotel.</p>

<h3>Is een privétransfer de moeite waard voor deze afstand?</h3>
<p>Bij twee uur rijden na een vliegreis meestal wel. U wordt in de aankomsthal opgewacht, rijdt zonder tussenstops en wordt voor de deur van uw hotel afgezet. De prijs geldt per voertuig, dus hoe meer reizigers, hoe gunstiger het uitpakt.</p>

<div style="margin:32px 0;padding:24px;border-radius:16px;background:#f1f5f9;border:1px solid #e2e8f0;text-align:center">
  <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a">Boek uw transfer naar Alanya</p>
  <p style="margin:0 0 16px;color:#475569">130 km · ± 2 uur · vaste prijs per voertuig · deur tot deur</p>
  <a href="/nl/alanya-transfer" style="display:inline-block;padding:12px 28px;border-radius:999px;background:#F97316;color:#fff;font-weight:600;text-decoration:none">Bekijk prijzen</a>
</div>
$nl$
WHERE slug = 'antalya-alanya-transfer-suresi';


-- ---------------------------------------------------------------------------
-- 3. Antalya Airport → Side, distance & time
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_nl = $nl$Afstand luchthaven Antalya naar Side: km en reistijd$nl$,
excerpt_nl = $nl$Van de luchthaven Antalya naar Side is het 70 km en duurt de rit ongeveer een uur. Bekijk de reistijd naar Side, Evrenseki en Kızılağaç plus uw vervoersopties.$nl$,
content_nl = $nl$
<p>De afstand van de <strong>luchthaven Antalya (AYT) naar Side</strong> bedraagt <strong>70 kilometer</strong>. Met een privétransfer bent u er in <strong>ongeveer een uur</strong>, rechtstreeks van de aankomsthal naar de deur van uw hotel.</p>

<h2>Afstand en reistijd per bestemming</h2>
<table>
  <tr><th>Bestemming</th><th>Afstand vanaf AYT</th><th>Reistijd</th></tr>
  <tr><td>Boğazkent</td><td>45 km</td><td>± 40 min</td></tr>
  <tr><td>Evrenseki</td><td>60 km</td><td>± 50 min</td></tr>
  <tr><td>Side centrum / antieke stad</td><td>70 km</td><td>± 1 uur</td></tr>
  <tr><td>Kızılağaç</td><td>80 km</td><td>± 1 uur 10 min</td></tr>
</table>

<h2>De route</h2>
<p>U rijdt via de D400 in oostelijke richting langs Belek en Kadriye. Het is een vlotte kustweg zonder bergpassen. Alleen de laatste kilometers naar het centrum van Side kunnen in het hoogseizoen wat langzamer gaan, omdat het oude centrum grotendeels autovrij is.</p>

<h2>Let op: het autovrije centrum van Side</h2>
<p>De antieke kern van Side is deels afgesloten voor autoverkeer. Ligt uw hotel binnen dat gebied, dan zet uw chauffeur u af op het dichtstbijzijnde toegestane punt en helpt hij u met uw bagage. Geef bij het boeken de exacte hotelnaam op, dan plant de chauffeur de beste afzetplek.</p>

<h2>Uw opties vanaf de luchthaven</h2>
<table>
  <tr><th>Optie</th><th>Reistijd</th><th>Deur tot deur</th><th>Prijs</th></tr>
  <tr><td>Privé VIP-transfer</td><td>± 1 uur</td><td>Ja</td><td>Vast, per voertuig</td></tr>
  <tr><td>Gedeelde shuttle</td><td>1,5–2,5 uur</td><td>Nee</td><td>Per persoon</td></tr>
  <tr><td>Taxi</td><td>± 1 uur</td><td>Ja</td><td>Taxameter</td></tr>
  <tr><td>Havaş-bus + lijnbus</td><td>2,5 uur en langer</td><td>Nee</td><td>Laag</td></tr>
</table>

<h2>Veelgestelde vragen</h2>

<h3>Hoeveel kilometer is het van de luchthaven Antalya naar Side?</h3>
<p>70 kilometer via de kustweg D400. De rit duurt met een privétransfer ongeveer een uur.</p>

<h3>Hoe lang duurt de transfer van Antalya naar Side?</h3>
<p>Circa 60 minuten met een privétransfer. Een gedeelde shuttle doet er 1,5 tot 2,5 uur over, omdat onderweg andere passagiers worden afgezet.</p>

<h3>Rijdt de transfer ook naar Evrenseki en Kızılağaç?</h3>
<p>Ja. Alle plaatsen rond Side worden bediend: Boğazkent op 45 km, Evrenseki op 60 km en Kızılağaç op 80 km. De prijs verschilt per bestemming en staat vooraf vast.</p>

<h3>Kan ik 's nachts naar Side worden gebracht?</h3>
<p>Ja, wij rijden 24 uur per dag zonder nachttoeslag. Uw vlucht wordt gevolgd, dus ook bij een late landing staat uw chauffeur klaar.</p>

<div style="margin:32px 0;padding:24px;border-radius:16px;background:#f1f5f9;border:1px solid #e2e8f0;text-align:center">
  <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a">Privétransfer luchthaven Antalya → Side</p>
  <p style="margin:0 0 16px;color:#475569">70 km · ± 1 uur · vaste prijs · gratis annuleren tot 24 uur vooraf</p>
  <a href="/nl/side-transfer" style="display:inline-block;padding:12px 28px;border-radius:999px;background:#F97316;color:#fff;font-weight:600;text-decoration:none">Bekijk prijzen</a>
</div>
$nl$
WHERE slug = 'antalya-side-transfer-mesafe-sure';


-- ---------------------------------------------------------------------------
-- 4. Antalya Airport → Kemer, distance & time
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_nl = $nl$Afstand luchthaven Antalya naar Kemer: km en reistijd$nl$,
excerpt_nl = $nl$Van de luchthaven Antalya naar Kemer is het 55 km en duurt de rit ongeveer 50 minuten over de kustweg langs het Taurusgebergte. Ook naar Beldibi, Göynük en Tekirova.$nl$,
content_nl = $nl$
<p>De afstand van de <strong>luchthaven Antalya (AYT) naar Kemer</strong> is <strong>55 kilometer</strong> en de rit duurt met een privétransfer <strong>ongeveer 50 minuten</strong>. De route loopt door Antalya heen en vervolgens over de spectaculaire kustweg langs de uitlopers van het Taurusgebergte.</p>

<h2>Afstand en reistijd per plaats</h2>
<table>
  <tr><th>Bestemming</th><th>Afstand vanaf AYT</th><th>Reistijd</th></tr>
  <tr><td>Beldibi</td><td>40 km</td><td>± 35 min</td></tr>
  <tr><td>Göynük</td><td>50 km</td><td>± 40 min</td></tr>
  <tr><td>Kemer centrum</td><td>55 km</td><td>± 50 min</td></tr>
  <tr><td>Kiriş</td><td>60 km</td><td>± 55 min</td></tr>
  <tr><td>Çamyuva</td><td>65 km</td><td>± 55 min</td></tr>
  <tr><td>Tekirova</td><td>70 km</td><td>± 1 uur</td></tr>
</table>

<h2>Waarom 55 km toch 50 minuten kost</h2>
<p>De route gaat eerst dwars door Antalya, waar u met stadsverkeer en verkeerslichten te maken krijgt. Daarna volgt de kustweg met bochten en hoogteverschillen. Het is een prachtige rit, maar hard rijden is er niet bij — en dat is maar goed ook, want de uitzichten over zee zijn onderweg het mooiste deel.</p>

<h2>De beste kant om te zitten</h2>
<p>Op de heenweg naar Kemer heeft u vanaf de <strong>rechterkant</strong> van het voertuig het beste zicht op zee. Reist u met kinderen die snel wagenziek worden, kies dan een plek vooraan — het laatste deel van de route kent behoorlijk wat bochten.</p>

<h2>Veelgestelde vragen</h2>

<h3>Hoeveel kilometer is het van de luchthaven Antalya naar Kemer?</h3>
<p>55 kilometer. De rit duurt ongeveer 50 minuten met een privétransfer, inclusief de doorsteek door Antalya.</p>

<h3>Hoe lang duurt de transfer van Antalya naar Kemer?</h3>
<p>Reken op circa 50 minuten. Naar Beldibi bent u er sneller (± 35 min), naar Tekirova duurt het iets langer (± 1 uur).</p>

<h3>Heeft Kemer een eigen luchthaven?</h3>
<p>Nee. De dichtstbijzijnde luchthaven is Antalya (AYT) op 55 km. Alle vluchten vanuit Nederland en België landen daar.</p>

<h3>Is de weg naar Kemer geschikt voor mensen met reisziekte?</h3>
<p>Het laatste deel van de kustweg heeft veel bochten. Neem zo nodig van tevoren een middel tegen reisziekte en vraag uw chauffeur om rustig te rijden — bij een privétransfer is dat geen enkel probleem.</p>

<div style="margin:32px 0;padding:24px;border-radius:16px;background:#f1f5f9;border:1px solid #e2e8f0;text-align:center">
  <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a">Privétransfer luchthaven Antalya → Kemer</p>
  <p style="margin:0 0 16px;color:#475569">55 km · ± 50 min · vaste prijs per voertuig · vluchtmonitoring</p>
  <a href="/nl/kemer-transfer" style="display:inline-block;padding:12px 28px;border-radius:999px;background:#F97316;color:#fff;font-weight:600;text-decoration:none">Bekijk prijzen</a>
</div>
$nl$
WHERE slug = 'antalya-kemer-transfer-mesafe-sure';


-- ---------------------------------------------------------------------------
-- 5. Antalya Airport → Belek, distance & time
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_nl = $nl$Afstand luchthaven Antalya naar Belek: km en reistijd$nl$,
excerpt_nl = $nl$Van de luchthaven Antalya naar Belek is het 35 km en duurt de rit ongeveer 35 minuten — een van de kortste transfers aan de Turkse Rivièra. Ook naar Kadriye en Boğazkent.$nl$,
content_nl = $nl$
<p>Belek ligt op <strong>35 kilometer</strong> van de <strong>luchthaven Antalya (AYT)</strong> en is met een privétransfer in <strong>ongeveer 35 minuten</strong> bereikbaar. Daarmee is het een van de kortste en meest voorspelbare transfers van de hele Turkse Rivièra.</p>

<h2>Afstand en reistijd per bestemming</h2>
<table>
  <tr><th>Bestemming</th><th>Afstand vanaf AYT</th><th>Reistijd</th></tr>
  <tr><td>Kadriye</td><td>30 km</td><td>± 30 min</td></tr>
  <tr><td>Belek centrum</td><td>35 km</td><td>± 35 min</td></tr>
  <tr><td>Boğazkent</td><td>45 km</td><td>± 40 min</td></tr>
</table>

<h2>Ideaal voor golfers</h2>
<p>Belek is het golfcentrum van Turkije, met banen als Regnum Carya, Montgomerie Maxx Royal en Cornelia. Onze Mercedes Vito biedt ruimte aan vijf passagiers plus bagage; reist u met golftassen, vermeld dit dan bij het boeken zodat wij de bagageruimte kunnen bevestigen. Voor grotere groepen zetten wij een tweede voertuig in.</p>

<h2>Waarom deze transfer zo betrouwbaar is</h2>
<p>De route loopt vrijwel volledig over de D400 buiten de stad om, dus u passeert geen stadsverkeer. Zelfs in het hoogseizoen wijkt de reistijd zelden meer dan tien minuten af van de geplande 35 minuten.</p>

<h2>Veelgestelde vragen</h2>

<h3>Hoeveel kilometer is het van de luchthaven Antalya naar Belek?</h3>
<p>35 kilometer, af te leggen in ongeveer 35 minuten met een privétransfer.</p>

<h3>Hoe lang duurt de transfer van Antalya naar Belek?</h3>
<p>Circa 35 minuten. Naar Kadriye bent u er in ongeveer 30 minuten, naar Boğazkent in ongeveer 40 minuten.</p>

<h3>Kan ik golftassen meenemen in de transfer?</h3>
<p>Ja. Geef bij het boeken het aantal golftassen op, dan reserveren wij een voertuig met voldoende bagageruimte of zetten wij een tweede auto in.</p>

<h3>Rijdt de transfer ook naar de golfresorts buiten het centrum?</h3>
<p>Ja, wij rijden deur tot deur naar alle resorts in Belek, Kadriye en Boğazkent, inclusief de golfhotels die enkele kilometers landinwaarts liggen.</p>

<div style="margin:32px 0;padding:24px;border-radius:16px;background:#f1f5f9;border:1px solid #e2e8f0;text-align:center">
  <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a">Privétransfer luchthaven Antalya → Belek</p>
  <p style="margin:0 0 16px;color:#475569">35 km · ± 35 min · vaste prijs · ruimte voor golftassen</p>
  <a href="/nl/belek-transfer" style="display:inline-block;padding:12px 28px;border-radius:999px;background:#F97316;color:#fff;font-weight:600;text-decoration:none">Bekijk prijzen</a>
</div>
$nl$
WHERE slug = 'antalya-belek-transfer-mesafe-sure';

-- Verify which posts now have a Dutch version:
-- SELECT slug, (title_nl IS NOT NULL AND content_nl IS NOT NULL) AS has_dutch
--   FROM blog_posts WHERE is_published = true ORDER BY has_dutch DESC, slug;
