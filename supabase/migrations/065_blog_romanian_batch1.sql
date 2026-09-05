-- 065: Romanian blog translations — batch 1 (distance & duration cluster)
--
-- The five posts here are the ones that answer "how far" and "how long",
-- which is the question a traveller asks before they book anything. The Dutch
-- pass (041) started with the same cluster for the same reason.
--
-- DATA SOURCE FOR EVERY NUMBER BELOW: supabase/seed.sql, the live regions
-- data. Blog figures have to match what the region page renders from
-- distance_km / duration_minutes, or the article contradicts the booking
-- engine the reader is about to use:
--   kundu-lara 15/20 · kadriye 30/30 · belek 35/35 · beldibi 40/35
--   bogazkent 45/40 · goynuk 50/40 · kemer 55/50 · evrenseki 60/50
--   kiris 60/55 · camyuva 65/55 · side 70/60 · tekirova 70/60
--   kizilagac 80/70 · okurcalar 100/80 · turkler 110/85 · alanya 130/120
--   mahmutlar 140/130 · kargicak 145/135
--
-- `antalya-alanya-transfer-suresi` is deliberately absent. Migration 037
-- unpublished it and next.config.ts 301s it to the surviving Alanya post, so
-- a translation would never render.
--
-- Dollar-quoted ($ro$) so Romanian apostrophes need no SQL escaping.
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Antalya Airport → Alanya, journey time
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Cât durează transferul de la Antalya la Alanya?$ro$,
excerpt_ro = $ro$De la Aeroportul Antalya până la Alanya sunt 130 km, iar drumul durează aproximativ 2 ore cu un transfer privat. Alanya nu are un aeroport propriu utilizabil — AYT este cel mai apropiat. Preț fix, urmărirea zborului.$ro$,
content_ro = $ro$
<p>Drumul de la <strong>Aeroportul Antalya (AYT) la Alanya</strong> durează cu un transfer privat <strong>aproximativ 2 ore</strong>, pe o distanță de <strong>130 de kilometri</strong>. Acesta este timpul real din ușă în ușă, incluzând ieșirea din perimetrul aeroportului și drumul prin Alanya până la hotelul tău.</p>

<h2>Distanță și durată dintr-o privire</h2>
<table>
  <tr><th>Destinație</th><th>Distanța de la AYT</th><th>Durata</th></tr>
  <tr><td>Türkler</td><td>110 km</td><td>± 1 oră 25 min</td></tr>
  <tr><td>Centrul Alanyei</td><td>130 km</td><td>± 2 ore</td></tr>
  <tr><td>Mahmutlar</td><td>140 km</td><td>± 2 ore 10 min</td></tr>
  <tr><td>Kargıcak</td><td>145 km</td><td>± 2 ore 15 min</td></tr>
</table>

<h2>Are Alanya un aeroport propriu?</h2>
<p>Formal da, practic nu. Aeroportul Gazipașa-Alanya (GZP) se află la est de Alanya și operează doar câteva zboruri. Aproape toate cursele charter și regulate din România aterizează pe <strong>Antalya (AYT)</strong>. Așadar, pregătește-te cu AYT ca aeroport de sosire.</p>

<h2>De ce durează uneori mai mult?</h2>
<p>Ruta urmează drumul de coastă D400. Este bine întreținut, dar trei lucruri decid dacă ajungi în ceva sub două ore sau considerabil peste:</p>
<ul>
  <li><strong>Sezonul.</strong> În iulie și august zona Manavgat–Side este mai aglomerată; socotește 15–25 de minute în plus.</li>
  <li><strong>Ora sosirii.</strong> Între 14:00 și 19:00 aterizează majoritatea zborurilor de vacanță, iar ieșirea din aeroport se blochează.</li>
  <li><strong>Hotelul tău exact.</strong> Alanya se întinde pe zeci de kilometri de coastă. Un hotel din Mahmutlar sau Kargıcak este cu 10–15 minute dincolo de centru.</li>
</ul>

<h2>Transfer privat, navetă sau taxi?</h2>
<table>
  <tr><th>Opțiune</th><th>Durată</th><th>Preț</th><th>Din ușă în ușă</th></tr>
  <tr><td>Transfer privat VIP</td><td>± 2 ore</td><td>Fix, per vehicul</td><td>Da</td></tr>
  <tr><td>Navetă comună</td><td>3–4 ore</td><td>Per persoană</td><td>Nu, opriri multiple</td></tr>
  <tr><td>Taxi local</td><td>± 2 ore</td><td>Aparat de taxare, imprevizibil</td><td>Da</td></tr>
  <tr><td>Autocar (prin autogară)</td><td>4 ore și peste</td><td>Redus</td><td>Nu, cu schimbare</td></tr>
</table>
<p>O navetă comună este mai ieftină per persoană, dar lasă mai întâi alți pasageri la hotelurile lor. Pentru o familie de patru, un transfer privat este adesea abia mai scump și cu două ore mai rapid.</p>

<h2>Ce se întâmplă dacă zborul are întârziere?</h2>
<p>Îți urmărim numărul zborului în timp real. Dacă aterizezi mai târziu, ora preluării se mută automat, iar șoferul te așteaptă fără costuri suplimentare. Nu trebuie să anunți nimic și nu trebuie să rezervi din nou.</p>

<h2>Întrebări frecvente</h2>

<h3>Cât durează transferul de la Aeroportul Antalya la Alanya?</h3>
<p>Cu un transfer privat, aproximativ 2 ore pentru 130 km. În vârf de sezon poate ajunge la 2 ore și 20 de minute. O navetă comună face 3–4 ore din cauza opririlor intermediare.</p>

<h3>Este prețul per persoană sau per vehicul?</h3>
<p>Per vehicul. Suma rămâne aceeași fie că sunteți doi, fie că sunteți cinci, atât timp cât încăpeți în mașină. Sunt incluse taxele de drum, combustibilul și timpul de așteptare.</p>

<h3>Pot rezerva și transferul de retur?</h3>
<p>Da, iar rezervarea dus-întors are o reducere. Preluarea de retur din Alanya este programată astfel încât să ajungi la AYT cu cel puțin 2,5 ore înainte de decolare.</p>
$ro$
WHERE slug = 'antalya-havalimani-alanya-transfer-kac-saat';

-- ---------------------------------------------------------------------------
-- 2. Antalya Airport → Side, distance & duration
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Distanța de la Aeroportul Antalya la Side: câți km și cât durează?$ro$,
excerpt_ro = $ro$De la Aeroportul Antalya la Side sunt 70 km, iar transferul privat durează aproximativ o oră. Drumul merge pe D400 prin Serik și Manavgat. Preț fix per vehicul, urmărirea zborului.$ro$,
content_ro = $ro$
<p>Distanța de la <strong>Aeroportul Antalya (AYT) la Side</strong> este de <strong>70 de kilometri</strong>, iar cu un transfer privat drumul durează <strong>aproximativ o oră</strong>. Ruta iese din aeroport pe drumul de coastă D400 și trece prin Serik înainte de a ajunge la Side.</p>

<h2>Side și localitățile din jur</h2>
<table>
  <tr><th>Destinație</th><th>Distanța de la AYT</th><th>Durata</th></tr>
  <tr><td>Kadriye</td><td>30 km</td><td>± 30 min</td></tr>
  <tr><td>Belek</td><td>35 km</td><td>± 35 min</td></tr>
  <tr><td>Boğazkent</td><td>45 km</td><td>± 40 min</td></tr>
  <tr><td>Evrenseki</td><td>60 km</td><td>± 50 min</td></tr>
  <tr><td>Side</td><td>70 km</td><td>± 1 oră</td></tr>
  <tr><td>Kızılağaç</td><td>80 km</td><td>± 1 oră 10 min</td></tr>
</table>
<p>Multe hoteluri care se prezintă ca fiind „în Side” se află de fapt în Evrenseki, Kumköy sau Çolaklı. Diferența este de 5–15 minute, așa că merită să verifici adresa exactă când rezervi.</p>

<h2>Cum arată drumul</h2>
<p>Aproape tot traseul este pe D400, un drum cu două benzi pe sens, bine întreținut. Nu există taxe de trecere pe această rută, iar prețul transferului le include oricum pe toate. Singurele porțiuni în care se poate încetini sunt intrarea în Serik și, vara, zona Manavgat.</p>

<h2>De ce contează ora de aterizare</h2>
<ul>
  <li><strong>Sosire dimineața.</strong> Drum liber, de obicei sub o oră.</li>
  <li><strong>Între 14:00 și 19:00.</strong> Vârful zborurilor charter; ieșirea din aeroport durează mai mult decât drumul propriu-zis în unele zile.</li>
  <li><strong>Sosire noaptea.</strong> Cel mai rapid drum al zilei, iar noi circulăm 24 de ore din 24 fără taxă de noapte.</li>
</ul>

<h2>Ce include prețul</h2>
<p>Prețul este <strong>per vehicul</strong>, nu per persoană, și cuprinde combustibilul, taxele de drum, timpul de așteptare și întâmpinarea cu panou în holul de sosiri. Nu există aparat de taxare și nu apare nicio sumă în plus la sosire.</p>

<h2>Întrebări frecvente</h2>

<h3>Câți kilometri sunt de la aeroportul Antalya la Side?</h3>
<p>70 de kilometri pe drumul de coastă D400, aproximativ o oră cu transfer privat.</p>

<h3>Există navetă de la aeroport la Side?</h3>
<p>Există navete comune, dar acestea opresc la mai multe hoteluri și pot dura de două ori mai mult. Un transfer privat merge direct la adresa ta.</p>

<h3>Se plătește mai mult pentru transferul de noapte?</h3>
<p>Nu percepem o taxă separată de noapte. Prețul afișat la rezervare este cel final.</p>
$ro$
WHERE slug = 'antalya-side-transfer-mesafe-sure';

-- ---------------------------------------------------------------------------
-- 3. Antalya Airport → Kemer, distance & duration
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Distanța de la Aeroportul Antalya la Kemer: câți km și cât durează?$ro$,
excerpt_ro = $ro$De la Aeroportul Antalya la Kemer sunt 55 km, iar transferul privat durează aproximativ 50 de minute. Drumul trece prin Konyaaltı, pe șoseaua de coastă de sub munții Taurus. Preț fix per vehicul.$ro$,
content_ro = $ro$
<p>Distanța de la <strong>Aeroportul Antalya (AYT) la Kemer</strong> este de <strong>55 de kilometri</strong>, iar cu un transfer privat drumul durează <strong>aproximativ 50 de minute</strong>. Ruta traversează Antalya, trece prin Konyaaltı și continuă pe șoseaua de coastă săpată în versanții munților Taurus.</p>

<h2>Kemer și stațiunile de pe coastă</h2>
<table>
  <tr><th>Destinație</th><th>Distanța de la AYT</th><th>Durata</th></tr>
  <tr><td>Beldibi</td><td>40 km</td><td>± 35 min</td></tr>
  <tr><td>Göynük</td><td>50 km</td><td>± 40 min</td></tr>
  <tr><td>Kemer</td><td>55 km</td><td>± 50 min</td></tr>
  <tr><td>Kiriș</td><td>60 km</td><td>± 55 min</td></tr>
  <tr><td>Çamyuva</td><td>65 km</td><td>± 55 min</td></tr>
  <tr><td>Tekirova</td><td>70 km</td><td>± 1 oră</td></tr>
</table>
<p>Beldibi și Göynük sunt înainte de Kemer pe același drum, iar Çamyuva și Tekirova imediat după. Diferența dintre prima și ultima este de aproximativ 25 de minute.</p>

<h2>Un drum frumos, dar cu curbe</h2>
<p>Porțiunea dintre Konyaaltı și Beldibi merge pe faleză, cu marea într-o parte și muntele în cealaltă. Este una dintre cele mai spectaculoase șosele de pe coastă, dar are curbe: dacă cineva din familie are rău de mașină, locurile din față ajută.</p>

<h2>De ce durata poate varia</h2>
<ul>
  <li><strong>Traversarea Antalyei.</strong> Ruta trece pe lângă oraș; la orele de vârf se pot adăuga 10–15 minute.</li>
  <li><strong>Sezonul estival.</strong> Traficul spre stațiuni crește în iulie și august.</li>
  <li><strong>Hotelul exact.</strong> Un hotel din Tekirova este cu 10 minute dincolo de centrul Kemerului.</li>
</ul>

<h2>Ce include prețul</h2>
<p>Prețul este per vehicul, cu până la 5 pasageri la același tarif, și include combustibilul, taxele, timpul de așteptare și întâmpinarea la sosiri. Urmărim zborul, deci o întârziere nu costă nimic în plus.</p>

<h2>Întrebări frecvente</h2>

<h3>Cât durează transferul de la aeroportul Antalya la Kemer?</h3>
<p>Aproximativ 50 de minute pentru 55 km cu transfer privat. Cu o navetă comună, 1,5–2 ore din cauza opririlor.</p>

<h3>Pot ajunge la Olympos sau Adrasan?</h3>
<p>Da. Olympos este la circa 1 oră 15 minute, iar Adrasan la circa 1 oră 25 de minute de aeroport, pe același drum.</p>

<h3>Aveți scaune pentru copii?</h3>
<p>Da, se solicită la rezervare și sunt montate înainte de sosirea ta.</p>
$ro$
WHERE slug = 'antalya-kemer-transfer-mesafe-sure';

-- ---------------------------------------------------------------------------
-- 4. Antalya Airport → Belek, distance & duration
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Distanța de la Aeroportul Antalya la Belek: câți km și cât durează?$ro$,
excerpt_ro = $ro$De la Aeroportul Antalya la Belek sunt 35 km, iar transferul privat durează aproximativ 35 de minute — unul dintre cele mai scurte drumuri de pe coastă. Preț fix per vehicul, direct la resortul de golf.$ro$,
content_ro = $ro$
<p>Distanța de la <strong>Aeroportul Antalya (AYT) la Belek</strong> este de <strong>35 de kilometri</strong>, iar cu un transfer privat drumul durează <strong>aproximativ 35 de minute</strong>. Este una dintre cele mai scurte curse de pe coastă și motivul pentru care Belek este preferat de cei care nu vor să piardă jumătate de zi pe drum.</p>

<h2>Belek și împrejurimile</h2>
<table>
  <tr><th>Destinație</th><th>Distanța de la AYT</th><th>Durata</th></tr>
  <tr><td>Kadriye</td><td>30 km</td><td>± 30 min</td></tr>
  <tr><td>Belek</td><td>35 km</td><td>± 35 min</td></tr>
  <tr><td>Boğazkent</td><td>45 km</td><td>± 40 min</td></tr>
</table>
<p>Multe dintre marile resorturi de golf sunt de fapt în Kadriye, la câteva minute înainte de Belek. Adresa exactă contează mai mult decât numele stațiunii.</p>

<h2>Golful și bagajul</h2>
<p>Belek este centrul de golf al Turciei, iar asta înseamnă genți de crose. Un Mercedes Vito duce confortabil bagajul unei familii, dar dacă vii cu echipament de golf spune-ne la rezervare, în câmpul de observații — confirmăm spațiul înainte, ca să nu existe surprize la sosiri.</p>

<h2>Cum arată drumul</h2>
<p>Ruta iese din aeroport direct pe D400 spre est și nu traversează centrul Antalyei, ceea ce o face rareori afectată de trafic. Chiar și în vârf de sezon rămâne în jur de 40 de minute.</p>

<h2>Ce include prețul</h2>
<p>Preț per vehicul, nu per persoană. Include combustibilul, taxele de drum, timpul de așteptare și întâmpinarea cu panou. Anulare gratuită cu până la 24 de ore înainte.</p>

<h2>Întrebări frecvente</h2>

<h3>Cât durează transferul de la aeroportul Antalya la Belek?</h3>
<p>Aproximativ 35 de minute pentru 35 km cu transfer privat, ușa hotelului inclusă.</p>

<h3>Merită un transfer privat pentru un drum atât de scurt?</h3>
<p>Pentru 35 de minute diferența nu este de timp, ci de comoditate: nu stai la coadă la taxi, nu negociezi prețul și șoferul te așteaptă chiar dacă avionul întârzie.</p>

<h3>Pot rezerva și returul spre aeroport?</h3>
<p>Da, cu reducere pentru dus-întors. Ora preluării de retur se calculează astfel încât să ajungi la aeroport cu timp suficient înainte de zbor.</p>
$ro$
WHERE slug = 'antalya-belek-transfer-mesafe-sure';

-- ---------------------------------------------------------------------------
-- 5. Antalya Airport transfer — the general guide
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Transfer Aeroportul Antalya: ghid complet pentru sosire$ro$,
excerpt_ro = $ro$Cum ajungi de la Aeroportul Antalya la hotel: transfer privat, navetă, taxi sau autocar. Distanțe, durate, prețuri și ce se întâmplă dacă zborul are întârziere.$ro$,
content_ro = $ro$
<p>Aeroportul Antalya (AYT) este poarta de intrare către întreaga Rivieră Turcească. Ce urmează după ce îți iei bagajul depinde de opțiunea de transport aleasă — iar diferența dintre ele se măsoară în ore, nu în minute.</p>

<h2>Cele patru opțiuni</h2>
<table>
  <tr><th>Opțiune</th><th>Preț</th><th>Durată</th><th>Din ușă în ușă</th></tr>
  <tr><td>Transfer privat VIP</td><td>Fix, per vehicul</td><td>Cea mai scurtă</td><td>Da</td></tr>
  <tr><td>Navetă comună</td><td>Per persoană</td><td>De 2–3 ori mai lungă</td><td>Nu</td></tr>
  <tr><td>Taxi oficial</td><td>Aparat de taxare</td><td>Scurtă</td><td>Da</td></tr>
  <tr><td>Autocar public</td><td>Cel mai redus</td><td>Cea mai lungă</td><td>Nu</td></tr>
</table>

<h2>Cât durează până la principalele stațiuni</h2>
<table>
  <tr><th>Destinație</th><th>Distanța</th><th>Durata</th></tr>
  <tr><td>Kundu / Lara</td><td>15 km</td><td>± 20 min</td></tr>
  <tr><td>Belek</td><td>35 km</td><td>± 35 min</td></tr>
  <tr><td>Kemer</td><td>55 km</td><td>± 50 min</td></tr>
  <tr><td>Side</td><td>70 km</td><td>± 1 oră</td></tr>
  <tr><td>Alanya</td><td>130 km</td><td>± 2 ore</td></tr>
</table>

<h2>Unde te întâlnești cu șoferul</h2>
<p>După ce îți ridici bagajele și treci de vamă, șoferul te așteaptă în holul de sosiri cu un panou pe care este scris numele tău. Primești pe e-mail, înainte de zbor, numele lui, numărul de telefon și o hartă a punctului de întâlnire.</p>

<h2>Dacă zborul are întârziere</h2>
<p>Îți urmărim numărul zborului în timp real. Ora preluării se ajustează automat după ora reală de aterizare și nu se percepe niciun cost suplimentar pentru așteptare. Nu trebuie să suni și nu trebuie să rezervi din nou.</p>

<h2>Ce să verifici înainte să rezervi</h2>
<ul>
  <li><strong>Adresa exactă a hotelului.</strong> Numele stațiunii nu este suficient — multe hoteluri „din Side” sunt de fapt în satele vecine.</li>
  <li><strong>Numărul zborului.</strong> Fără el nu putem urmări întârzierea.</li>
  <li><strong>Numărul de pasageri și bagaje.</strong> Prețul este per vehicul, dar capacitatea contează.</li>
  <li><strong>Scaunul pentru copii,</strong> dacă îți trebuie — se montează înainte de sosirea ta.</li>
</ul>

<h2>Întrebări frecvente</h2>

<h3>Este Uber disponibil în Antalya?</h3>
<p>Nu. Uber este restricționat în Turcia din 2019 și nu operează în Aeroportul Antalya. Alternativele sunt BiTaksi, naveta Havaș, taxiurile oficiale sau un transfer privat rezervat în prealabil.</p>

<h3>Se plătește în avans?</h3>
<p>Plata se face online, securizat, la rezervare. Există și varianta cu avans, în care restul se achită șoferului.</p>

<h3>Pot anula?</h3>
<p>Da, gratuit, cu până la 24 de ore înainte de ora preluării.</p>
$ro$
WHERE slug = 'antalya-havalimani-transfer-rehberi';

-- Progress check:
-- SELECT slug, title_ro IS NOT NULL AS has_ro FROM blog_posts
--  WHERE is_published = true ORDER BY slug;
