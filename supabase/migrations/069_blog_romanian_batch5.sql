-- 069: Romanian blog translations — batch 5 (final)
--
-- The last five: the English-language Alanya route post, the Belek and Side
-- route posts, the general hotel-transfer post, and the Regnum hotel post.
-- With these, every published post has a Romanian version, which is what
-- moves /ro/blog out of noindex and into the sitemap.
--
-- These overlap in subject with batch 1's distance posts, so the copy is
-- deliberately written from a different angle — arrival and hotel logistics
-- rather than kilometres — to avoid two Romanian pages competing for the
-- same query.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Alanya airport transfer
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Transfer aeroport Alanya: de unde se ajunge de fapt$ro$,
excerpt_ro = $ro$Alanya are un aeroport propriu, Gazipașa (GZP), dar aproape toate zborurile aterizează la Antalya (AYT), la 130 km. Ce înseamnă asta pentru transferul tău și cum alegi.$ro$,
content_ro = $ro$
<p>Dacă ai rezervat un hotel în Alanya, primul lucru de lămurit este pe ce aeroport aterizezi. Sunt două posibile, iar diferența dintre ele este de aproape două ore de drum.</p>

<h2>Antalya (AYT) sau Gazipașa (GZP)?</h2>
<table>
  <tr><th></th><th>Antalya (AYT)</th><th>Gazipașa (GZP)</th></tr>
  <tr><td>Distanța până la Alanya</td><td>130 km</td><td>40 km</td></tr>
  <tr><td>Durata transferului</td><td>± 2 ore</td><td>± 45 min</td></tr>
  <tr><td>Număr de zboruri</td><td>Foarte multe</td><td>Puține</td></tr>
  <tr><td>Zboruri din România</td><td>Aproape toate</td><td>Rare</td></tr>
</table>
<p>Gazipașa este mai aproape, dar operează un număr redus de curse. În practică, aproape toate zborurile charter și regulate spre această coastă aterizează la <strong>Antalya</strong>. Verifică pe biletul tău codul aeroportului înainte de a rezerva transferul.</p>

<h2>Alanya este mai lungă decât pare</h2>
<p>Zona hotelieră se întinde pe zeci de kilometri de-a lungul coastei, iar hotelul tău poate fi la 15 minute după centru:</p>
<table>
  <tr><th>Zonă</th><th>Distanța de la AYT</th><th>Durata</th></tr>
  <tr><td>Türkler</td><td>110 km</td><td>± 1 oră 25 min</td></tr>
  <tr><td>Alanya centru</td><td>130 km</td><td>± 2 ore</td></tr>
  <tr><td>Mahmutlar</td><td>140 km</td><td>± 2 ore 10 min</td></tr>
  <tr><td>Kargıcak</td><td>145 km</td><td>± 2 ore 15 min</td></tr>
</table>

<h2>Ce să scrii la rezervare</h2>
<ul>
  <li><strong>Aeroportul de sosire</strong> — AYT sau GZP.</li>
  <li><strong>Numele complet al hotelului,</strong> nu doar „Alanya”.</li>
  <li><strong>Numărul zborului,</strong> pentru urmărirea întârzierii.</li>
</ul>

<h2>Drumul de retur</h2>
<p>De la Alanya spre aeroport, ora preluării se calculează astfel încât să ajungi cu cel puțin 2,5 ore înainte de decolare. Pe două ore de drum, marja contează: un zbor de dimineață înseamnă o preluare în zori, iar asta se stabilește la rezervare, nu în ultima seară la recepție.</p>

<h2>Întrebări frecvente</h2>

<h3>Merită să caut zboruri spre Gazipașa?</h3>
<p>Dacă găsești unul potrivit, economisești peste o oră de drum. Dar oferta este limitată și adesea mai scumpă.</p>

<h3>Cât durează de la Antalya la Alanya?</h3>
<p>Aproximativ 2 ore pentru 130 km cu transfer privat.</p>

<h3>Se poate rezerva transfer și de la Gazipașa?</h3>
<p>Da. Alege aeroportul corect la rezervare, pentru că prețul și durata diferă.</p>
$ro$
WHERE slug = 'alanya-airport-transfer';

-- ---------------------------------------------------------------------------
-- 2. Antalya Airport → Belek (arrival-focused)
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Transfer Aeroportul Antalya - Belek: cum decurge sosirea$ro$,
excerpt_ro = $ro$De la aterizare până la ușa hotelului din Belek: unde te întâlnești cu șoferul, cât durează ieșirea din aeroport și ce se întâmplă dacă zborul are întârziere.$ro$,
content_ro = $ro$
<p>Belek este la 35 de kilometri de Aeroportul Antalya, aproximativ 35 de minute. Partea care surprinde pe mulți nu este drumul, ci ce se întâmplă înainte de el.</p>

<h2>Din avion până în mașină</h2>
<ol>
  <li><strong>Controlul pașapoartelor.</strong> În vârf de sezon poate dura 20-40 de minute.</li>
  <li><strong>Bagajele.</strong> Încă 10-20 de minute, în funcție de zbor.</li>
  <li><strong>Vama.</strong> De obicei rapid.</li>
  <li><strong>Holul de sosiri.</strong> Șoferul te așteaptă cu un panou cu numele tău.</li>
</ol>
<p>Cu alte cuvinte: de la aterizare până la plecarea din parcare pot trece 40 de minute sau o oră. Este normal și este inclus în cele 60 de minute de așteptare gratuită.</p>

<h2>Cum îl găsești pe șofer</h2>
<p>Panoul cu numele tău este în holul de sosiri, după vamă. Cu câteva ore înainte de zbor primești pe e-mail numele șoferului, numărul lui de telefon și o hartă a punctului de întâlnire. Dacă nu îl vezi imediat, sună-l înainte să ieși din terminal — aeroportul are mai multe ieșiri și este ușor să vă rataţi.</p>

<h2>Drumul spre Belek</h2>
<p>Ruta iese direct pe D400 spre est, fără să traverseze centrul Antalyei, ceea ce o face rareori afectată de trafic. Chiar și în august rămâne în jur de 40 de minute.</p>

<h2>Belek sau Kadriye?</h2>
<p>Multe dintre marile resorturi de golf sunt de fapt în Kadriye, cu 5 minute mai devreme pe același drum. Pentru șofer sunt două adrese diferite, așa că scrie numele complet al hotelului la rezervare.</p>

<h2>Dacă zborul întârzie</h2>
<p>Îți urmărim numărul zborului. Ora preluării se ajustează automat și nu se percepe nimic în plus. Nu trebuie să anunți nimic.</p>

<h2>Întrebări frecvente</h2>

<h3>Cât timp mă așteaptă șoferul?</h3>
<p>60 de minute după aterizare, gratuit. Dacă zborul întârziase, se numără de la ora reală de aterizare.</p>

<h3>Pot cere o oprire la un magazin?</h3>
<p>O oprire scurtă se poate aranja. Menționează la rezervare.</p>

<h3>Ce se întâmplă dacă îmi pierd bagajul?</h3>
<p>Sună șoferul de la biroul de bagaje. Așteaptă cât rezolvi formalitățile, în limita rezonabilului.</p>
$ro$
WHERE slug = 'antalya-havalimani-belek-transfer';

-- ---------------------------------------------------------------------------
-- 3. Antalya Airport → Side (arrival-focused)
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Transfer Aeroportul Antalya - Side: ce trebuie să știi la sosire$ro$,
excerpt_ro = $ro$Drumul spre Side durează aproximativ o oră. Zona pietonală din centrul vechi, hotelurile din satele vecine și cum se face preluarea de retur pentru un zbor de dimineață.$ro$,
content_ro = $ro$
<p>Side este la aproximativ o oră de Aeroportul Antalya, pe drumul de coastă D400. Drumul este simplu; ce merită știut dinainte ține de ultimii kilometri.</p>

<h2>Centrul vechi este pietonal</h2>
<p>Peninsula din jurul templului lui Apollo este închisă traficului auto în cea mai mare parte a zilei. Dacă hotelul tău este acolo, șoferul te lasă la cea mai apropiată intrare permisă și te ajută cu bagajele. Nu este o scurtătură sau o scuză — este regula locală, aceeași pentru toate vehiculele.</p>

<h2>Hotelul tău este chiar în Side?</h2>
<p>Zona hotelieră se întinde mult dincolo de peninsulă, iar multe hoteluri vândute ca fiind „în Side” sunt în satele vecine:</p>
<table>
  <tr><th>Zonă</th><th>Distanța de la AYT</th><th>Durata</th></tr>
  <tr><td>Evrenseki</td><td>60 km</td><td>± 50 min</td></tr>
  <tr><td>Side</td><td>70 km</td><td>± 1 oră</td></tr>
  <tr><td>Kızılağaç</td><td>80 km</td><td>± 1 oră 10 min</td></tr>
</table>
<p>Scrie numele complet al hotelului la rezervare. Diferența de drum este mică, dar adresa este cu totul alta.</p>

<h2>Ce se vede pe drum</h2>
<p>Traseul trece prin Serik și pe lângă Manavgat. Nu sunt taxe de trecere, iar prețul le include oricum pe toate. Vara, singurele porțiuni care încetinesc sunt intrarea în Serik și zona Manavgat la orele de vârf.</p>

<h2>Returul pentru un zbor de dimineață</h2>
<p>Multe zboruri spre Europa pleacă dis-de-dimineață. Pentru un zbor la 6:00, preluarea din Side se face în jur de 3:00, ca să ajungi cu 2,5 ore înainte. Stabilește ora la rezervare, nu în ultima seară — recepția hotelului nu are cum să îți garanteze o mașină la ora aceea.</p>

<h2>Întrebări frecvente</h2>

<h3>Cât durează transferul până la Side?</h3>
<p>Aproximativ o oră pentru 70 km cu transfer privat.</p>

<h3>Șoferul intră în centrul vechi?</h3>
<p>Doar dacă accesul este permis în acel moment. Altfel, te lasă la cea mai apropiată intrare și te ajută cu bagajele.</p>

<h3>Se poate opri la cascada Manavgat?</h3>
<p>Da, o oprire scurtă se poate aranja dinainte.</p>
$ro$
WHERE slug = 'antalya-havalimani-side-transfer';

-- ---------------------------------------------------------------------------
-- 4. Hotel transfer, general
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Transfer de la aeroport la hotel în Antalya: cum funcționează$ro$,
excerpt_ro = $ro$Transferul din ușă în ușă, de la holul de sosiri până la recepția hotelului. Ce informații trebuie date la rezervare, cum se face întâmpinarea și ce înseamnă preț per vehicul.$ro$,
content_ro = $ro$
<p>Un transfer de la aeroport la hotel înseamnă un lucru simplu: un vehicul rezervat doar pentru grupul tău, care te ia din holul de sosiri și te lasă la recepția hotelului. Fără opriri intermediare, fără schimbări și fără aparat de taxare.</p>

<h2>Cum decurge</h2>
<ol>
  <li><strong>Rezervi online</strong> cu destinația, data, ora și numărul zborului.</li>
  <li><strong>Primești confirmarea</strong> pe e-mail, cu codul rezervării și un cod QR.</li>
  <li><strong>Îți urmărim zborul</strong> și alocăm șoferul înainte să aterizezi.</li>
  <li><strong>Șoferul te așteaptă</strong> în holul de sosiri, cu un panou cu numele tău.</li>
  <li><strong>Mergeți direct</strong> la hotel.</li>
</ol>

<h2>Ce trebuie să dai la rezervare</h2>
<ul>
  <li><strong>Numele complet al hotelului</strong> — nu doar stațiunea. Multe hoteluri au nume asemănătoare, iar unele „din Side” sunt în satele vecine.</li>
  <li><strong>Numărul zborului</strong> — fără el nu putem urmări întârzierea.</li>
  <li><strong>Numărul de pasageri și bagaje,</strong> inclusiv copiii.</li>
  <li><strong>Scaunul pentru copii,</strong> dacă îți trebuie.</li>
</ul>

<h2>Preț per vehicul</h2>
<p>Prețul depinde de destinație, nu de numărul de persoane. Un cuplu plătește cât o familie de patru pentru aceeași cursă. Sunt incluse combustibilul, taxele de drum, timpul de așteptare și întâmpinarea. La sosire nu se mai adaugă nimic.</p>

<h2>Așteptarea</h2>
<p>60 de minute gratuit după aterizare pentru preluările de la aeroport, 15 minute pentru cele de la hotel. Dacă zborul întârzie, cele 60 de minute se numără de la ora reală de aterizare, nu de la cea programată.</p>

<h2>Returul</h2>
<p>Se poate rezerva odată cu sosirea, cu reducere, sau separat oricând. Ora preluării din hotel se calculează în funcție de zbor și de distanță.</p>

<h2>Întrebări frecvente</h2>

<h3>Șoferul intră în hotel?</h3>
<p>Te duce până la intrarea hotelului și te ajută cu bagajele.</p>

<h3>Ce fac dacă hotelul se schimbă după rezervare?</h3>
<p>Scrie-ne cu cel puțin 12 ore înainte. Modificăm adresa; dacă noua rută are alt tarif, se poate ajusta prețul.</p>

<h3>Pot plăti la sosire?</h3>
<p>Există varianta cu plată în vehicul: se achită un avans online, restul șoferului.</p>
$ro$
WHERE slug = 'hotel-transfer-antalya';

-- ---------------------------------------------------------------------------
-- 5. Regnum Carya / The Crown, Belek
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Transfer către Regnum Carya și The Crown, Belek$ro$,
excerpt_ro = $ro$Resorturile Regnum din Belek sunt la aproximativ 35 de minute de Aeroportul Antalya. Cum ajungi acolo cu echipamentul de golf și de ce adresa exactă a resortului contează.$ro$,
content_ro = $ro$
<p>Complexul Regnum din Belek este la aproximativ <strong>35 de kilometri</strong> de Aeroportul Antalya — în jur de <strong>35 de minute</strong> cu un transfer privat, pe D400 spre est, fără să traversezi Antalya.</p>

<h2>De ce contează numele exact al clădirii</h2>
<p>Complexul are mai multe unități pe același domeniu, iar intrările nu sunt în același loc. Un șofer care primește doar „Regnum, Belek” poate ajunge la poarta greșită și pierde 10 minute căutând recepția potrivită. Scrie numele complet al resortului la rezervare, exact cum apare pe voucherul de cazare.</p>

<h2>Golful</h2>
<p>Zona este construită în jurul terenurilor de golf, iar asta înseamnă bagaj special. Un Mercedes Vito duce confortabil valizele unei familii, dar un set sau două de crose peste ele este altceva. Notează echipamentul în câmpul de observații: confirmăm spațiul dinainte și, dacă e cazul, trimitem un vehicul mai mare.</p>

<h2>Sosirea</h2>
<p>Șoferul te așteaptă în holul de sosiri cu un panou cu numele tău. Primești pe e-mail, înainte de zbor, numele lui, telefonul și harta punctului de întâlnire. Cu urmărirea zborului activă, o întârziere nu costă nimic în plus.</p>

<h2>Transferuri în timpul sejurului</h2>
<p>Din Belek se pot rezerva curse separate spre terenurile de golf din zonă, spre Land of Legends (5-10 minute) sau spre Side pentru o zi (± 40 de minute). Se rezervă la fel ca transferul de aeroport.</p>

<h2>Returul</h2>
<p>Rezervat odată cu sosirea, are reducere. Ora preluării se calculează astfel încât să ajungi la aeroport cu cel puțin 2,5 ore înainte de decolare — pe 35 de minute de drum, marja este confortabilă chiar și pentru zborurile de dimineață.</p>

<h2>Întrebări frecvente</h2>

<h3>Cât durează de la aeroport la Regnum?</h3>
<p>Aproximativ 35 de minute pentru 35 km cu transfer privat.</p>

<h3>Pot transporta crose de golf?</h3>
<p>Da. Menționează-le la rezervare ca să confirmăm spațiul.</p>

<h3>Se poate rezerva transfer spre terenurile de golf?</h3>
<p>Da, ca o cursă separată. Scrie-ne pe WhatsApp cu ora și numărul de persoane.</p>
$ro$
WHERE slug = 'regnum-the-crown-belek-transfer';

-- Final check — every published post should now report true:
-- SELECT slug, title_ro IS NOT NULL AND content_ro IS NOT NULL AS ro_ready
--   FROM blog_posts WHERE is_published = true ORDER BY ro_ready, slug;
