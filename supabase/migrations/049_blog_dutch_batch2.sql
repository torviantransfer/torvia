-- 049: Dutch (nl) content for the remaining blog posts — batch 2
--
-- Migration 041 was the first Dutch blog batch and covered four route posts
-- (alanya-transfer-suresi, side/kemer/belek-mesafe-sure). This batch fills
-- title_nl / excerpt_nl / content_nl for the remaining published posts so the
-- whole blog is available in Dutch.
--
-- WHY: GSC shows the NL market at 1,749 impressions / position 7.1 with almost
-- no NL landing content behind the blog. Every post with an empty content_nl is
-- skipped by the sitemap (src/app/sitemap.ts) and the /nl/blog list, so Dutch
-- visitors were being sent to English text. Filling these columns turns the
-- existing English rankings into indexable Dutch pages.
--
-- Pattern mirrors 041 exactly: plain UPDATE per slug, $nl$-dollar-quoting so
-- Dutch apostrophes need no escaping. Distances/times match the published
-- EN/TR siblings (and supabase/seed.sql) to avoid contradictions. Internal
-- links point at the localized /nl/booking funnel.
--
-- Safe to re-run. Does NOT touch the 4 posts already translated in 041.


-- ===== 1. antalya-havalimani-transfer-rehberi =====
UPDATE blog_posts SET
title_nl = $nl$Transfer vanaf de luchthaven Antalya: complete gids van vlucht tot hotel$nl$,
excerpt_nl = $nl$Alles over uw transfer vanaf de luchthaven Antalya (AYT): afstanden, reistijden per regio, opties en waarom een privétransfer met vaste prijs de rustigste keuze is.$nl$,
content_nl = $nl$<article>
<p>De luchthaven Antalya (AYT) is de op één na drukste luchthaven van Turkije en de aankomstpoort voor vrijwel alle vakanties aan de Turkse Rivièra. In deze gids leest u hoe u het comfortabelst van het vliegtuig naar uw hotel komt.</p>

<h2>Afstanden en reistijden vanaf AYT</h2>
<table>
<tr><th>Bestemming</th><th>Afstand</th><th>Reistijd</th></tr>
<tr><td>Lara / Kundu</td><td>15 km</td><td>± 15 min</td></tr>
<tr><td>Belek</td><td>33 km</td><td>± 30 min</td></tr>
<tr><td>Kemer</td><td>45 km</td><td>± 45 min</td></tr>
<tr><td>Side</td><td>65 km</td><td>± 55 min</td></tr>
<tr><td>Alanya</td><td>132 km</td><td>± 2 uur</td></tr>
</table>

<h2>Welke vervoersopties zijn er?</h2>
<p>De Havaş-shuttlebus rijdt alleen naar het busstation van Antalya, niet naar de badplaatsen — met bagage moet u daar nog overstappen. Een luchthaventaxi heeft geen vaste prijs en zelden kinderzitjes. Een vooraf geboekte privétransfer brengt u rechtstreeks van deur tot deur.</p>

<h2>Waarom een privétransfer?</h2>
<ul>
<li><strong>Vaste prijs per voertuig</strong> — geen verrassingen door verkeer of vertraging</li>
<li><strong>Vluchtmonitoring</strong> — bij vertraging wacht uw chauffeur zonder extra kosten</li>
<li><strong>Gratis kinderzitjes</strong> — geef ze aan bij het boeken</li>
<li><strong>24/7</strong> — ook bij nachtelijke aankomsten, zonder nachttoeslag</li>
</ul>

<p><a href="/nl/booking">Boek nu online</a> en ontvang direct een bevestiging met de naam van uw chauffeur.</p>
</article>$nl$
WHERE slug = 'antalya-havalimani-transfer-rehberi';


-- ===== 2. belek-golf-otelleri-transfer =====
UPDATE blog_posts SET
title_nl = $nl$Transfer naar de golfresorts van Belek: van de luchthaven naar de fairway$nl$,
excerpt_nl = $nl$Transfer van de luchthaven Antalya naar de golfresorts van Belek: 33 km, 25–40 minuten. Ruime voertuigen voor golftassen, vaste prijs, vluchtmonitoring.$nl$,
content_nl = $nl$<article>
<p>Belek is de golfhoofdstad van Turkije: op 33 km van de luchthaven Antalya (AYT), ongeveer 25 tot 40 minuten rijden. Met een privétransfer komt u uitgerust en op tijd aan bij uw resort en uw eerste tee-time.</p>

<h2>Rechtstreeks naar de grote golfresorts</h2>
<p>Wij brengen u naar alle bekende adressen in Belek, waaronder:</p>
<ul>
<li>Cornelia Diamond Golf Resort &amp; Spa</li>
<li>Regnum Carya Golf &amp; Spa Resort</li>
<li>Gloria Golf Resort</li>
<li>Sueno Hotels (Pines &amp; Dunes)</li>
<li>Maxx Royal Belek Golf Resort</li>
</ul>

<h2>Ruimte voor uw golfuitrusting</h2>
<p>Onze Mercedes Vito VIP-voertuigen hebben een ruime bagageruimte, ook voor golftassen. Voor gezelschappen van 4 tot 8 spelers regelen we een passend voertuig, zodat clubs en koffers gewoon mee kunnen.</p>

<h2>Vaste prijs, geen zorgen</h2>
<p>U betaalt een vaste prijs per voertuig, afgesproken bij de boeking. Bij een vertraagde vlucht wacht uw chauffeur zonder toeslag dankzij vluchtmonitoring.</p>

<p><a href="/nl/booking">Reserveer uw Belek-transfer</a> en begin uw golfvakantie ontspannen.</p>
</article>$nl$
WHERE slug = 'belek-golf-otelleri-transfer';


-- ===== 3. vip-transfer-mi-shuttle-mi =====
UPDATE blog_posts SET
title_nl = $nl$VIP-transfer of shuttle? De transferopties van luchthaven Antalya vergeleken$nl$,
excerpt_nl = $nl$VIP-privétransfer versus shuttlebus vanaf de luchthaven Antalya: prijs per persoon of per voertuig, wachttijd en comfort vergeleken. Voor gezinnen vaak nauwelijks duurder.$nl$,
content_nl = $nl$<article>
<p>Bij aankomst op de luchthaven Antalya kunt u kiezen tussen een gedeelde shuttlebus en een private VIP-transfer. Het verschil in prijs is kleiner dan u denkt — het verschil in comfort groot.</p>

<h2>De shuttlebus</h2>
<p>Een shuttle kost ongeveer 10–15 € per persoon, maar vertrekt pas als hij vol is en stopt bij meerdere hotels voordat u aan de beurt bent. Reken op 30–60 minuten extra wachten en rijden.</p>

<h2>De private VIP-transfer</h2>
<p>Een VIP-transfer kost ongeveer 30–80 € per voertuig — niet per persoon. U rijdt rechtstreeks van deur tot deur, zonder tussenstops, in een Mercedes Vito met airconditioning.</p>

<h2>Wat is voordeliger?</h2>
<p>Voor een gezin van 3 à 4 personen is een VIP-transfer vaak maar enkele euro's duurder dan de shuttle, terwijl u samen sneller en comfortabeler reist. Reist u alleen, dan is de shuttle goedkoper; reist u met familie of veel bagage, dan wint de privétransfer.</p>

<table>
<tr><th></th><th>VIP-transfer</th><th>Shuttle</th></tr>
<tr><td>Prijs</td><td>per voertuig</td><td>per persoon</td></tr>
<tr><td>Route</td><td>rechtstreeks</td><td>meerdere stops</td></tr>
<tr><td>Wachttijd</td><td>chauffeur wacht op u</td><td>u wacht op de bus</td></tr>
</table>

<p><a href="/nl/booking">Bereken uw vaste prijs</a> en vergelijk zelf.</p>
</article>$nl$
WHERE slug = 'vip-transfer-mi-shuttle-mi';


-- ===== 4. side-antik-kent-transfer =====
UPDATE blog_posts SET
title_nl = $nl$Transfer naar Side: naar de antieke stad waar geschiedenis de zee raakt$nl$,
excerpt_nl = $nl$Transfer van de luchthaven Antalya naar Side: ± 65 km, 50–60 minuten. Antieke stad, Apollotempel en gouden stranden. Vaste prijs, van deur tot deur.$nl$,
content_nl = $nl$<article>
<p>Side ligt op ongeveer 65 km van de luchthaven Antalya (AYT), zo'n 50 tot 60 minuten rijden (in de zomerdrukte tot 70 minuten). Het is een van de mooiste bestemmingen aan de kust, waar antieke ruïnes en zandstranden samenkomen.</p>

<h2>Wat maakt Side bijzonder?</h2>
<ul>
<li><strong>Apollotempel</strong> — de iconische zuilen aan zee, uit de 7e eeuw v.Chr.</li>
<li><strong>Romeins theater</strong> met 15.000 zitplaatsen en het Side Museum in een oud badhuis</li>
<li><strong>Watervallen van Manavgat</strong>, op zo'n 10 km afstand</li>
<li><strong>Stranden</strong> als Kumköy en de rustige baai van Titreyengöl</li>
</ul>

<h2>Van de luchthaven naar uw hotel in Side</h2>
<p>Wij brengen u rechtstreeks naar alle deelgebieden — Kumköy, Çolaklı en Titreyengöl. Met een privétransfer hoeft u niet over te stappen of te wachten op andere passagiers.</p>

<h2>Vaste prijs en comfort</h2>
<p>U betaalt een vaste prijs per voertuig, met vluchtmonitoring en gratis kinderzitjes op aanvraag. Uw chauffeur ontvangt u met een naambord in de aankomsthal.</p>

<p><a href="/nl/booking">Boek uw transfer naar Side</a> en start uw vakantie zonder gedoe.</p>
</article>$nl$
WHERE slug = 'side-antik-kent-transfer';


-- ===== 5. uber-antalya-havalimani-ulasim =====
UPDATE blog_posts SET
title_nl = $nl$Werkt Uber in Antalya? Alternatieven voor luchthavenvervoer in 2026$nl$,
excerpt_nl = $nl$Werkt Uber op de luchthaven Antalya? In de praktijk niet. Lees de betrouwbare alternatieven — en waarom een vooraf geboekte privétransfer de zekerste keuze is.$nl$,
content_nl = $nl$<article>
<p>Veel reizigers openen bij aankomst hun Uber-app — maar in Antalya werkt dat niet zoals thuis. Hier leest u wat er wél betrouwbaar is.</p>

<h2>Uber en lokale apps</h2>
<p>Uber is sinds 2019 in Turkije grotendeels aan banden gelegd en niet bruikbaar op de luchthaven Antalya. Lokale apps als BiTaksi zijn Turkstalig en vereisen een lokaal telefoonnummer. Yandex Taxi is hier niet beschikbaar.</p>

<h2>De luchthaventaxi</h2>
<p>Taxi's staan wel klaar, maar hanteren geen vaste prijs, rekenen na middernacht een nachttarief van 50% en hebben zelden kinderzitjes. De uiteindelijke prijs weet u pas bij aankomst.</p>

<h2>De zekerste optie: een vooraf geboekte privétransfer</h2>
<p>Met een privétransfer weet u de prijs vooraf, staat uw chauffeur met een naambord klaar en rijdt u rechtstreeks naar uw hotel. Ter indicatie: Belek vanaf ± 35–50 € en Alanya vanaf ± 80–120 € per voertuig. Russisch- en Engelstalige ondersteuning is beschikbaar.</p>

<p><a href="/nl/booking">Boek vooraf online</a> en vermijd verrassingen bij aankomst.</p>
</article>$nl$
WHERE slug = 'uber-antalya-havalimani-ulasim';


-- ===== 6. antalya-havas-mi-vip-transfer-mi =====
UPDATE blog_posts SET
title_nl = $nl$Havaş-bus of VIP-transfer? Prijs en comfort vergeleken (2026)$nl$,
excerpt_nl = $nl$Havaş-shuttle versus VIP-privétransfer vanaf de luchthaven Antalya. Havaş rijdt alleen naar het centrum, niet naar de resorts — voor gezinnen is VIP vaak voordeliger.$nl$,
content_nl = $nl$<article>
<p>De Havaş-bus is de goedkoopste manier om de luchthaven Antalya te verlaten, maar hij brengt u niet naar uw hotel. Voor de meeste vakantiegangers is dat een belangrijk verschil.</p>

<h2>Waar rijdt Havaş naartoe?</h2>
<p>Havaş rijdt uitsluitend naar het centrum en het busstation van Antalya — niet naar Belek, Side, Kemer of Alanya. Vanaf het busstation moet u met bagage overstappen op een tweede bus of een taxi, wat al gauw 1 tot 1,5 uur extra kost.</p>

<h2>Prijs in de praktijk</h2>
<p>Havaş kost ongeveer 5–8 € per persoon. Voor een gezin van vier is dat samen zo'n 24 € — plus de aansluitende taxi. Een VIP-transfer kost ongeveer 35 € per voertuig, inclusief het hele gezin en alle bagage, rechtstreeks naar de deur.</p>

<h2>Comfort en gemak</h2>
<p>Een VIP-transfer biedt vluchtmonitoring, gratis kinderzitjes en 24/7 service. U wacht niet op een volle bus en stapt nergens over.</p>

<p><a href="/nl/booking">Bereken uw vaste transferprijs</a> en vergelijk met de bus.</p>
</article>$nl$
WHERE slug = 'antalya-havas-mi-vip-transfer-mi';


-- ===== 7. antalya-havalimani-transfer-fiyatlari =====
UPDATE blog_posts SET
title_nl = $nl$Prijzen transfer luchthaven Antalya 2026: wat kost een privétransfer?$nl$,
excerpt_nl = $nl$Hoeveel kost een transfer vanaf de luchthaven Antalya? Prijzen per voertuig per regio, wat is inbegrepen en hoe u de vaste prijs vooraf berekent.$nl$,
content_nl = $nl$<article>
<p>De prijs van een transfer vanaf de luchthaven Antalya hangt vooral af van de afstand tot uw hotel. Belangrijk: onze prijzen gelden <strong>per voertuig</strong>, niet per persoon.</p>

<h2>Indicatie van de prijzen per regio</h2>
<table>
<tr><th>Bestemming</th><th>Afstand</th><th>Vanaf (per voertuig)</th></tr>
<tr><td>Lara / Kundu</td><td>15 km</td><td>vanaf € 25</td></tr>
<tr><td>Belek</td><td>33 km</td><td>vanaf € 35</td></tr>
<tr><td>Kemer</td><td>45 km</td><td>vanaf € 40</td></tr>
<tr><td>Side</td><td>65 km</td><td>vanaf € 45</td></tr>
<tr><td>Alanya</td><td>132 km</td><td>vanaf € 65</td></tr>
</table>
<p>Een gezin van vier naar Belek betaalt dus samen vanaf € 35 — niet per persoon.</p>

<h2>Wat is inbegrepen?</h2>
<ul>
<li>Vaste prijs, vooraf afgesproken</li>
<li>Vluchtmonitoring — gratis wachten bij vertraging</li>
<li>Ontvangst met naambord in de aankomsthal</li>
<li>Gratis kinderzitjes op aanvraag</li>
<li>24/7 service zonder nachttoeslag</li>
</ul>

<h2>Zo berekent u uw prijs</h2>
<p>Kies uw regio en voertuig in ons boekingssysteem en u ziet direct de vaste totaalprijs — inclusief alles, zonder verborgen kosten.</p>

<p><a href="/nl/booking">Bereken nu uw prijs</a>.</p>
</article>$nl$
WHERE slug = 'antalya-havalimani-transfer-fiyatlari';


-- ===== 8. antalya-havalimani-taksi-mi-vip-transfer-mi =====
UPDATE blog_posts SET
title_nl = $nl$Luchthaventaxi of VIP-transfer in Antalya? Het eerlijke verschil$nl$,
excerpt_nl = $nl$Luchthaventaxi versus vooraf geboekte VIP-transfer in Antalya: prijszekerheid, nachttarief, kinderzitjes en comfort vergeleken. Wat kiest u het best?$nl$,
content_nl = $nl$<article>
<p>Bij de uitgang van de luchthaven Antalya staan taxi's klaar, maar een vooraf geboekte privétransfer is vaak voorspelbaarder en niet duurder. Hier is het eerlijke verschil.</p>

<h2>De luchthaventaxi</h2>
<ul>
<li>Geen vaste prijs — u weet het bedrag pas bij aankomst</li>
<li>Nachttarief van 50% na middernacht</li>
<li>Zelden kinderzitjes beschikbaar</li>
<li>Niet elke taxi accepteert een kaartbetaling</li>
</ul>

<h2>De VIP-privétransfer</h2>
<ul>
<li>Vaste prijs per voertuig, vooraf betaald</li>
<li>Chauffeur wacht met naambord, ook bij vertraging (vluchtmonitoring)</li>
<li>Gratis kinderzitjes op aanvraag</li>
<li>Mercedes Vito met airconditioning, meertalige chauffeurs</li>
</ul>

<h2>Welke past bij u?</h2>
<p>Voor een korte, spontane rit overdag kan een taxi volstaan. Voor een nachtelijke aankomst, een gezin met kinderen of een langere route naar Side of Alanya geeft de vaste prijs en zekerheid van een privétransfer duidelijk meer rust.</p>

<p><a href="/nl/booking">Boek uw vaste-prijstransfer</a> en reis zonder verrassingen.</p>
</article>$nl$
WHERE slug = 'antalya-havalimani-taksi-mi-vip-transfer-mi';


-- ===== 9. antalya-havalimani-kas-transfer =====
UPDATE blog_posts SET
title_nl = $nl$Transfer luchthaven Antalya naar Kaş: afstand, reistijd en tips$nl$,
excerpt_nl = $nl$Transfer van de luchthaven Antalya naar Kaş: ± 190 km, ongeveer 3 uur over de kustweg D400. Eén comfortabele auto rechtstreeks naar uw hotel, met een pauze onderweg.$nl$,
content_nl = $nl$<article>
<p>Kaş ligt op ongeveer 190 km van de luchthaven Antalya (AYT), zo'n 3 uur rijden over de schilderachtige kustweg D400. Het is het rustige, chique einde van de Lycische kust — ideaal voor wie duikt, paraglidet of gewoon de drukte ontvlucht.</p>

<h2>Waarom een privétransfer naar Kaş?</h2>
<p>Met het openbaar vervoer betekent Kaş een bus naar het busstation van Antalya en een overstap op een trage kustlijn — al gauw vijf uur of meer. Een privétransfer is één comfortabele auto rechtstreeks naar uw hotel, met een pauze onderweg.</p>

<h2>Wat u onderweg ziet</h2>
<p>De route volgt de kust langs Kemer en de Lycische bergen. Uw chauffeur kan een korte stop inlassen om even te pauzeren of foto's te maken van het uitzicht over zee.</p>

<h2>Vaste prijs, ook op de lange route</h2>
<p>Juist op een rit van drie uur telt zekerheid: een vaste prijs per voertuig, vluchtmonitoring en 24/7 service zonder nachttoeslag. Uw chauffeur ontvangt u met een naambord in de aankomsthal.</p>

<p><a href="/nl/booking">Boek uw transfer naar Kaş</a> en reis ontspannen naar de Lycische kust.</p>
</article>$nl$
WHERE slug = 'antalya-havalimani-kas-transfer';


-- ===== 10. antalya-7-24-transfer-hizmeti =====
UPDATE blog_posts SET
title_nl = $nl$24/7 luchthaventransfer in Antalya: ook bij nachtelijke aankomsten$nl$,
excerpt_nl = $nl$Een luchthaventransfer in Antalya die dag en nacht rijdt — ook om 3 uur 's nachts. Vluchtmonitoring, geen nachttoeslag en een chauffeur die op u wacht.$nl$,
content_nl = $nl$<article>
<p>Veel vluchten naar Antalya landen laat op de avond of midden in de nacht. Juist dan wilt u geen gedoe met wachten of onderhandelen. Onze transfers rijden 24 uur per dag, 7 dagen per week.</p>

<h2>Altijd een chauffeur klaar</h2>
<p>Of uw vlucht nu om 14.00 uur of om 03.00 uur landt: uw chauffeur staat met een naambord in de aankomsthal. Dankzij vluchtmonitoring volgen we uw vlucht live en passen we de ophaaltijd automatisch aan bij vertraging.</p>

<h2>Geen nachttoeslag</h2>
<p>Anders dan bij een luchthaventaxi rekenen wij geen nachttarief. De vaste prijs die u bij het boeken ziet, blijft gelijk — ongeacht het uur.</p>

<h2>Veilig en comfortabel aankomen</h2>
<p>Na een lange reis stapt u zo in een schone Mercedes Vito met airconditioning en rijdt u rechtstreeks naar uw hotel. Gratis kinderzitjes zijn op aanvraag beschikbaar, ook 's nachts.</p>

<p><a href="/nl/booking">Boek uw nachttransfer vooraf</a> en kom zorgeloos aan.</p>
</article>$nl$
WHERE slug = 'antalya-7-24-transfer-hizmeti';


-- ===== 11. antalya-mercedes-vito-vip-transfer =====
UPDATE blog_posts SET
title_nl = $nl$Mercedes Vito VIP-transfer in Antalya: comfort voor het hele gezin$nl$,
excerpt_nl = $nl$Reis vanaf de luchthaven Antalya in een Mercedes Vito VIP: airconditioning, ruime bagageruimte en plaats voor maximaal 5 passagiers. Vaste prijs, van deur tot deur.$nl$,
content_nl = $nl$<article>
<p>Al onze transfers vanaf de luchthaven Antalya rijden met een Mercedes Vito VIP. Het is het ideale voertuig voor gezinnen en kleine groepen die met bagage comfortabel willen reizen.</p>

<h2>Waarom de Mercedes Vito?</h2>
<ul>
<li><strong>Ruimte</strong> — plaats voor maximaal 5 passagiers plus koffers</li>
<li><strong>Airconditioning</strong> — aangenaam koel, ook in de zomerhitte</li>
<li><strong>Grote bagageruimte</strong> — geschikt voor koffers, golftassen en kinderwagens</li>
<li><strong>Comfortabele stoelen</strong> — prettig op zowel korte als lange ritten</li>
</ul>

<h2>Van deur tot deur</h2>
<p>Uw chauffeur ontvangt u met een naambord, helpt met de bagage en rijdt u rechtstreeks naar uw hotel — zonder tussenstops. Gratis kinderzitjes zijn op aanvraag beschikbaar.</p>

<h2>Vaste prijs, meertalige chauffeurs</h2>
<p>U betaalt een vaste prijs per voertuig, met vluchtmonitoring en 24/7 service. Onze chauffeurs spreken meerdere talen, waaronder Engels en Duits.</p>

<p><a href="/nl/booking">Boek uw Mercedes Vito-transfer</a> en reis comfortabel naar uw hotel.</p>
</article>$nl$
WHERE slug = 'antalya-mercedes-vito-vip-transfer';


-- ===== 12. antalya-havalimani-side-transfer =====
UPDATE blog_posts SET
title_nl = $nl$Transfer luchthaven Antalya naar Side: afstand, reistijd en hotels$nl$,
excerpt_nl = $nl$Transfer van de luchthaven Antalya naar Side: ± 65 km, 50–60 minuten met een privétransfer. Rechtstreeks naar Kumköy, Çolaklı en Titreyengöl. Vaste prijs.$nl$,
content_nl = $nl$<article>
<p>Side ligt op ongeveer 65 km van de luchthaven Antalya (AYT), zo'n 50 tot 60 minuten met een privétransfer. Deze populaire badplaats combineert antieke ruïnes met lange zandstranden.</p>

<h2>Afstand en reistijd</h2>
<table>
<tr><th>Gebied</th><th>Afstand vanaf AYT</th><th>Reistijd</th></tr>
<tr><td>Kumköy</td><td>± 60 km</td><td>± 50 min</td></tr>
<tr><td>Side centrum</td><td>± 65 km</td><td>± 55 min</td></tr>
<tr><td>Titreyengöl</td><td>± 68 km</td><td>± 60 min</td></tr>
</table>

<h2>Rechtstreeks naar uw hotel</h2>
<p>Met een privétransfer stapt u niet over en wacht u niet op andere passagiers. Uw chauffeur brengt u van de aankomsthal rechtstreeks naar de ingang van uw hotel in Side, Kumköy of Çolaklı.</p>

<h2>Wat is inbegrepen?</h2>
<p>Een vaste prijs per voertuig, vluchtmonitoring, gratis kinderzitjes op aanvraag en 24/7 service zonder nachttoeslag. Uw chauffeur wacht met een naambord in de aankomsthal.</p>

<p><a href="/nl/booking">Boek uw transfer naar Side</a> en begin uw vakantie ontspannen.</p>
</article>$nl$
WHERE slug = 'antalya-havalimani-side-transfer';


-- ===== 13. antalya-havalimani-belek-transfer =====
UPDATE blog_posts SET
title_nl = $nl$Transfer luchthaven Antalya naar Belek: afstand, reistijd en hotels$nl$,
excerpt_nl = $nl$Transfer van de luchthaven Antalya naar Belek: ± 33 km, 30 minuten met een privétransfer. Golfresorts en 5-sterrenhotels, rechtstreeks van deur tot deur. Vaste prijs.$nl$,
content_nl = $nl$<article>
<p>Belek ligt op ongeveer 33 km van de luchthaven Antalya (AYT), zo'n 30 minuten met een privétransfer. Het is de bekendste golf- en luxebestemming van de Turkse Rivièra.</p>

<h2>Afstand en reistijd</h2>
<table>
<tr><th>Gebied</th><th>Afstand vanaf AYT</th><th>Reistijd</th></tr>
<tr><td>Kadriye</td><td>± 28 km</td><td>± 25 min</td></tr>
<tr><td>Belek centrum</td><td>± 33 km</td><td>± 30 min</td></tr>
<tr><td>Boğazkent</td><td>± 40 km</td><td>± 35 min</td></tr>
</table>

<h2>Rechtstreeks naar uw resort</h2>
<p>Wij brengen u naar alle grote resorts in Belek, van Rixos en Gloria tot Regnum Carya en Maxx Royal. Met een privétransfer rijdt u rechtstreeks van de aankomsthal naar de ingang van uw hotel, zonder tussenstops.</p>

<h2>Wat is inbegrepen?</h2>
<p>Een vaste prijs per voertuig, vluchtmonitoring, ruime bagageruimte voor golftassen en gratis kinderzitjes op aanvraag. Onze service is 24/7 beschikbaar zonder nachttoeslag.</p>

<p><a href="/nl/booking">Boek uw transfer naar Belek</a> en kom uitgerust aan.</p>
</article>$nl$
WHERE slug = 'antalya-havalimani-belek-transfer';


-- ===== 14. land-of-legends-transfer-rehberi =====
UPDATE blog_posts SET
title_nl = $nl$Transfer naar The Land of Legends: zo kom je er vanaf luchthaven Antalya$nl$,
excerpt_nl = $nl$Transfer van de luchthaven Antalya naar The Land of Legends in Belek: ± 40 km, 35 minuten. Rechtstreeks naar het themapark of het Kingdom Hotel. Vaste prijs.$nl$,
content_nl = $nl$<article>
<p>The Land of Legends in Belek is een van de grootste pretparken ter wereld, met jaarlijks meer dan 5 miljoen bezoekers. Het ligt op ongeveer 40 km van de luchthaven Antalya (AYT), zo'n 35 minuten rijden.</p>

<h2>Wat kunt u er beleven?</h2>
<ul>
<li>Groot themapark met achtbanen en shows</li>
<li>Aquapark met glijbanen en golfslagbaden</li>
<li>Het Kingdom Hotel op het terrein zelf</li>
<li>Winkel- en entertainmentboulevard</li>
</ul>

<h2>Rechtstreeks naar de ingang</h2>
<p>Verblijft u in het Kingdom Hotel, dan brengen we u tot aan de deur. Komt u voor een dagje uit, dan zetten we u af bij de hoofdingang of de aquapark-entree. Geen overstappen, geen wachten.</p>

<h2>Handig voor gezinnen</h2>
<p>Met gratis kinderzitjes op aanvraag, een ruime Mercedes Vito en een vaste prijs per voertuig reist u met het hele gezin comfortabel. Vluchtmonitoring zorgt dat uw chauffeur ook bij vertraging klaarstaat.</p>

<p><a href="/nl/booking">Boek uw transfer naar The Land of Legends</a>.</p>
</article>$nl$
WHERE slug = 'land-of-legends-transfer-rehberi';


-- ===== 15. antalya-havalimani-lara-beach-transfer =====
UPDATE blog_posts SET
title_nl = $nl$Transfer luchthaven Antalya naar Lara Beach: de dichtstbijzijnde badplaats$nl$,
excerpt_nl = $nl$Transfer van de luchthaven Antalya naar Lara Beach (Kundu): slechts ± 15 km, 15–20 minuten. De dichtstbijzijnde resortregio. Vaste prijs, van deur tot deur.$nl$,
content_nl = $nl$<article>
<p>Lara Beach — ook bekend als Kundu — is de dichtstbijzijnde grote resortregio bij de luchthaven Antalya (AYT): slechts ongeveer 15 km, 15 tot 20 minuten rijden. Ideaal als u snel bij uw hotel wilt zijn.</p>

<h2>De hotelstrook van Lara/Kundu</h2>
<p>Lara staat bekend om zijn indrukwekkende themahotels langs de kust, waaronder:</p>
<ul>
<li>Aska Lara Resort &amp; Spa</li>
<li>Titanic Deluxe Lara</li>
<li>Royal Seginus</li>
<li>Mardan Palace</li>
</ul>

<h2>Waarom een privétransfer op zo'n korte rit?</h2>
<p>Juist bij een korte rit valt de onzekerheid van een taxi op: geen vaste prijs en soms een minimumtarief. Met een privétransfer weet u de prijs vooraf en rijdt u rechtstreeks van de aankomsthal naar de deur van uw hotel.</p>

<h2>Wat is inbegrepen?</h2>
<p>Vaste prijs per voertuig, ontvangst met naambord, vluchtmonitoring en gratis kinderzitjes op aanvraag — 24/7 en zonder nachttoeslag.</p>

<p><a href="/nl/booking">Boek uw transfer naar Lara Beach</a>.</p>
</article>$nl$
WHERE slug = 'antalya-havalimani-lara-beach-transfer';


-- ===== 16. hotel-transfer-antalya =====
UPDATE blog_posts SET
title_nl = $nl$Hoteltransfer Antalya: privé en rechtstreeks vanaf de luchthaven naar uw resort$nl$,
excerpt_nl = $nl$Een private hoteltransfer vanaf de luchthaven Antalya: uw chauffeur wacht met een naambord en rijdt u rechtstreeks naar uw hotel, zonder tussenstops. Vaste prijs per voertuig.$nl$,
content_nl = $nl$<article>
<p>Als uw vlucht landt op de luchthaven Antalya (AYT), is een <strong>private hoteltransfer</strong> de snelste en meest ontspannen manier om uw hotel te bereiken: uw chauffeur wacht in de aankomsthal met een naambord en rijdt u rechtstreeks naar uw accommodatie, van deur tot deur.</p>

<h2>Wat is een hoteltransfer?</h2>
<p>Een hoteltransfer is een vooraf geboekt privévoertuig dat u ophaalt op de luchthaven en naar uw hotel brengt. Anders dan een gedeelde shuttlebus, die eerst bij zes tot tien andere hotels stopt, rijdt een privétransfer alleen naar uw bestemming.</p>

<h2>Reistijden en prijzen per hotelgebied</h2>
<table>
<tr><th>Hotelgebied</th><th>Afstand</th><th>Reistijd</th><th>Vanaf</th></tr>
<tr><td>Lara / Kundu</td><td>15 km</td><td>± 15 min</td><td>€ 25</td></tr>
<tr><td>Belek</td><td>33 km</td><td>± 30 min</td><td>€ 35</td></tr>
<tr><td>Kemer</td><td>45 km</td><td>± 40 min</td><td>€ 40</td></tr>
<tr><td>Side</td><td>65 km</td><td>± 55 min</td><td>€ 45</td></tr>
<tr><td>Alanya</td><td>132 km</td><td>± 2 uur</td><td>€ 65</td></tr>
</table>
<p>Alle prijzen gelden per voertuig (Mercedes Vito, tot 5 passagiers), niet per persoon.</p>

<h2>Waarom kiezen voor een private hoteltransfer?</h2>
<ul>
<li>Vaste prijs vóór vertrek — geen onderhandelen bij aankomst</li>
<li>Rechtstreeks naar uw hotel, zonder tussenstops</li>
<li>Vluchtmonitoring — uw chauffeur wacht gratis bij vertraging</li>
<li>Gratis kinderzitjes op aanvraag, 24/7 zonder nachttoeslag</li>
</ul>

<p><a href="/nl/booking">Boek uw hoteltransfer online</a> en kom zorgeloos aan.</p>
</article>$nl$
WHERE slug = 'hotel-transfer-antalya';


-- ===== 17. alanya-airport-transfer =====
UPDATE blog_posts SET
title_nl = $nl$Heeft Alanya een luchthaven? Het antwoord voor 2026 + hoe u er komt$nl$,
excerpt_nl = $nl$Heeft Alanya een eigen luchthaven? In de praktijk niet — vrijwel alle vluchten landen op Antalya (AYT), ± 132 km en 2 uur rijden. Zo bereikt u Alanya het comfortabelst.$nl$,
content_nl = $nl$<article>
<p>Veel reizigers zoeken naar een luchthaven in Alanya. Het korte antwoord: Alanya heeft geen eigen commerciële luchthaven van betekenis. Vrijwel alle vluchten landen op de luchthaven Antalya (AYT).</p>

<h2>Antalya (AYT) versus Gazipaşa (GZP)</h2>
<p>Er is een kleine luchthaven, Gazipaşa-Alanya (GZP), op zo'n 38 km ten oosten van Alanya, maar die verwerkt slechts een handvol vluchten. Nagenoeg alle charter- en lijnvluchten uit Nederland en België komen aan op <strong>Antalya (AYT)</strong>.</p>

<h2>Van Antalya naar Alanya</h2>
<p>Alanya ligt op ongeveer 132 km van AYT, zo'n 2 uur rijden over de kustweg D400. De deelgebieden verschillen iets in afstand:</p>
<table>
<tr><th>Gebied</th><th>Afstand vanaf AYT</th><th>Reistijd</th></tr>
<tr><td>Okurcalar</td><td>± 100 km</td><td>± 1 uur 30 min</td></tr>
<tr><td>Alanya centrum</td><td>± 132 km</td><td>± 2 uur</td></tr>
<tr><td>Mahmutlar</td><td>± 145 km</td><td>± 2 uur 15 min</td></tr>
</table>

<h2>Comfortabel op de lange route</h2>
<p>Op een rit van twee uur telt zekerheid: een vaste prijs per voertuig (vanaf € 65), vluchtmonitoring en een korte pauze onderweg. Uw chauffeur ontvangt u met een naambord.</p>

<p><a href="/nl/booking">Boek uw transfer naar Alanya</a>.</p>
</article>$nl$
WHERE slug = 'alanya-airport-transfer';


-- ===== 18. aileler-icin-antalya-transfer-ipuclari =====
UPDATE blog_posts SET
title_nl = $nl$Transfertips voor gezinnen op de luchthaven Antalya: reizen met kinderen$nl$,
excerpt_nl = $nl$Reist u met kinderen naar Antalya? Lees welke kinderzitjes verplicht zijn, hoe u nachtvluchten aanpakt en waarom een privétransfer met gezinnen het handigst is.$nl$,
content_nl = $nl$<article>
<p>Met kinderen reizen vraagt om net iets meer planning. Deze tips helpen u om de transfer vanaf de luchthaven Antalya soepel en veilig te laten verlopen.</p>

<h2>Kinderzitjes zijn verplicht</h2>
<p>De Turkse wet schrijft voor dat kinderen kleiner dan 150 cm een passend kinderzitje gebruiken. Er zijn drie types, die wij gratis op aanvraag leveren:</p>
<ul>
<li><strong>Babyzitje</strong> (0–12 maanden, achterwaarts gericht, tot 13 kg)</li>
<li><strong>Kinderzitje</strong> (1–4 jaar, 9–18 kg)</li>
<li><strong>Zittingverhoger</strong> (4–12 jaar, met gordel)</li>
</ul>

<h2>Nachtvluchten met kinderen</h2>
<p>Veel vluchten landen laat. Bij een shuttle is het vermoeiend wachten met slaperige kinderen; een privétransfer wacht juist op u dankzij vluchtmonitoring en brengt u meteen naar bed... eh, naar het hotel.</p>

<h2>Bagage en kinderwagens</h2>
<p>Onze Mercedes Vito heeft een ruime bagageruimte voor koffers én de kinderwagen. Alles gaat in één voertuig, zonder gepuzzel.</p>

<p><a href="/nl/booking">Boek uw gezinstransfer</a> en geef bij de boeking het aantal en de leeftijd van de kinderen door.</p>
</article>$nl$
WHERE slug = 'aileler-icin-antalya-transfer-ipuclari';


-- ===== 19. aile-cocuk-havalimani-transfer =====
UPDATE blog_posts SET
title_nl = $nl$Luchthaventransfer met kinderen in Antalya: veilig en zonder stress$nl$,
excerpt_nl = $nl$Een luchthaventransfer in Antalya met jonge kinderen: gratis kinderzitjes, ruimte voor de kinderwagen en een chauffeur die op u wacht. Van deur tot deur, vaste prijs.$nl$,
content_nl = $nl$<article>
<p>Reizen met jonge kinderen is het fijnst als alles geregeld is voordat u landt. Een private luchthaventransfer neemt u dat werk uit handen — van de aankomsthal tot de deur van uw hotel.</p>

<h2>Gratis kinderzitjes, correct geïnstalleerd</h2>
<p>Geef bij het boeken het aantal en de leeftijd van uw kinderen op. Wij zorgen voor het juiste babyzitje, kinderzitje of zittingverhoger — gratis en volgens de Turkse verkeersregels (verplicht onder 150 cm).</p>

<h2>Geen wachten, geen overstappen</h2>
<p>Uw chauffeur volgt uw vlucht en staat met een naambord klaar, ook bij vertraging. U stapt direct in en rijdt zonder tussenstops naar uw hotel — geen sleuren met slaperige kinderen langs meerdere hotelstops.</p>

<h2>Ruimte voor alles wat mee moet</h2>
<p>De Mercedes Vito biedt plaats voor het gezin plus koffers, kinderwagen en reiswieg. Airconditioning houdt het aangenaam koel voor de kleintjes.</p>

<p><a href="/nl/booking">Boek uw transfer met kinderen</a> en reis met een gerust hart.</p>
</article>$nl$
WHERE slug = 'aile-cocuk-havalimani-transfer';


-- ===== 20. kis-antalya-tatil-transfer =====
UPDATE blog_posts SET
title_nl = $nl$Wintervakantie in Antalya: transfergids en routes voor het laagseizoen$nl$,
excerpt_nl = $nl$Antalya in de winter: 15–20°C, de zachtste winter van Europa en 30–50% lagere prijzen. Lees hoe uw luchthaventransfer in het laagseizoen verloopt.$nl$,
content_nl = $nl$<article>
<p>Antalya is niet alleen een zomerbestemming. In de winter is het er 15 tot 20°C — een van de zachtste winters van Europa — en liggen de prijzen vaak 30 tot 50% lager. Ook uw transfer verloopt in het laagseizoen soepel.</p>

<h2>Waarom Antalya in de winter?</h2>
<ul>
<li>Milde temperaturen, ideaal voor stedentrips en natuur</li>
<li>Van november tot maart aanzienlijk voordeliger</li>
<li>Rustiger op de weg — transfers verlopen doorgaans vlotter</li>
</ul>

<h2>Veilig onderweg bij winterweer</h2>
<p>Bij een enkele regenbui zorgen onze professionele chauffeurs en goed onderhouden voertuigen (met ABS, ESP en airconditioning/verwarming) voor een veilige rit. Op natte wegen passen we het tempo aan.</p>

<h2>Populaire winterbestemmingen</h2>
<p>Het centrum van Antalya, Konyaaltı, Belek, Kemer en de Lycische kust rond Kaş zijn ook in de winter prachtig. Wij brengen u rechtstreeks van de luchthaven naar uw hotel, tegen een vaste prijs.</p>

<p><a href="/nl/booking">Boek uw wintertransfer</a> en profiteer van de rust van het laagseizoen.</p>
</article>$nl$
WHERE slug = 'kis-antalya-tatil-transfer';


-- ===== 21. regnum-the-crown-belek-transfer =====
UPDATE blog_posts SET
title_nl = $nl$Transfer naar Regnum The Crown (Belek) vanaf de luchthaven Antalya$nl$,
excerpt_nl = $nl$Private transfer van de luchthaven Antalya naar Regnum The Crown in Belek: ± 30 km, zo'n 30 minuten. Rechtstreeks tot aan de hotelingang, vaste prijs, vluchtmonitoring.$nl$,
content_nl = $nl$<article>
<p>Verblijft u in Regnum The Crown in Belek? Dan brengt onze private transfer u rechtstreeks vanaf de luchthaven Antalya (AYT) tot aan de hotelingang — ongeveer 30 km, zo'n 30 minuten rijden.</p>

<h2>Rechtstreeks naar uw resort</h2>
<p>Geen overstappen en geen tussenstops bij andere hotels: uw chauffeur ontvangt u met een naambord in de aankomsthal en rijdt u in één keer naar Regnum The Crown in de golfregio van Belek.</p>

<h2>Comfort dat bij het resort past</h2>
<p>U reist in een Mercedes Vito VIP met airconditioning en ruime bagageruimte — ook voor golftassen. Gratis kinderzitjes zijn op aanvraag beschikbaar.</p>

<h2>Vaste prijs en zekerheid</h2>
<p>De prijs staat vast per voertuig en verandert niet door verkeer of vertraging. Dankzij vluchtmonitoring wacht uw chauffeur kosteloos als uw vlucht later landt, 24/7 en zonder nachttoeslag.</p>

<p><a href="/nl/booking">Boek uw transfer naar Regnum The Crown</a>.</p>
</article>$nl$
WHERE slug = 'regnum-the-crown-belek-transfer';


-- Coverage check — every published post should now have Dutch:
-- SELECT slug FROM blog_posts
--  WHERE is_published = true AND (content_nl IS NULL OR content_nl = '')
--  ORDER BY slug;
