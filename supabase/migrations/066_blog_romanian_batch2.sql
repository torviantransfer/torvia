-- 066: Romanian blog translations — batch 2 (destination posts)
--
-- Batch 1 answered "how far" and "how long". These five answer "what is it
-- like when I get there" for the five destinations that carry their own post:
-- the Belek golf resorts, the ruins at Side, Lara Beach, Kaș, and the theme
-- park at Belek.
--
-- NUMBERS, from the live regions data (see 065's header and the REGIONS table
-- in src/app/[locale]/antalya-airport-transfer/page.tsx):
--   kundu-lara 15/20 · kadriye 30/30 · belek 35/35 · side 70/60
--   adrasan 95/90 · kas 190/180
-- Land of Legends sits in Belek: 35 km, ~30 min, matching what
-- src/app/[locale]/land-of-legends-transfer/page.tsx already tells visitors.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Belek golf resorts
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Transfer către hotelurile de golf din Belek: ce trebuie să știi$ro$,
excerpt_ro = $ro$Belek este centrul de golf al Turciei, la 35 km de Aeroportul Antalya. Cum ajungi la resort cu tot echipamentul, cât durează drumul și de ce adresa contează mai mult decât numele stațiunii.$ro$,
content_ro = $ro$
<p>Belek concentrează cele mai multe terenuri de golf din Turcia, iar hotelurile din jurul lor sunt la <strong>35 de kilometri</strong> de Aeroportul Antalya — aproximativ <strong>35 de minute</strong> cu un transfer privat. Este unul dintre cele mai scurte drumuri de pe coastă, ceea ce înseamnă că poți ajunge pe teren în aceeași zi în care aterizezi.</p>

<h2>Resortul tău este în Belek sau în Kadriye?</h2>
<p>Aceasta este cea mai frecventă confuzie. Multe dintre marile resorturi care se prezintă ca fiind „din Belek” se află de fapt în <strong>Kadriye</strong>, la 30 km de aeroport, cu câteva minute mai devreme pe același drum. Altele sunt dincolo de Belek, spre Boğazkent, la 45 km.</p>
<table>
  <tr><th>Zonă</th><th>Distanța de la AYT</th><th>Durata</th></tr>
  <tr><td>Kadriye</td><td>30 km</td><td>± 30 min</td></tr>
  <tr><td>Belek centru</td><td>35 km</td><td>± 35 min</td></tr>
  <tr><td>Boğazkent</td><td>45 km</td><td>± 40 min</td></tr>
</table>
<p>Când rezervi transferul, scrie numele complet al hotelului, nu doar stațiunea. Diferența poate fi de 15 minute și, mai important, de o cursă care ajunge la ușa potrivită.</p>

<h2>Echipamentul de golf</h2>
<p>O geantă de crose nu intră în bagajul obișnuit al unei familii. Un Mercedes Vito duce confortabil bagajul a patru persoane, dar dacă vii cu unul sau mai multe seturi de crose, notează asta în câmpul de observații la rezervare. Confirmăm spațiul dinainte și, dacă e nevoie, trimitem un vehicul mai mare — nimeni nu vrea să afle asta în holul de sosiri.</p>

<h2>Ora de tee și ora de aterizare</h2>
<p>Dacă ai o rezervare de teren în ziua sosirii, lasă o marjă rezonabilă. Între 14:00 și 19:00 aterizează majoritatea zborurilor charter și ieșirea din aeroport durează mai mult decât drumul propriu-zis. Un zbor de dimineață îți lasă aproape sigur toată după-amiaza liberă.</p>

<h2>De ce transfer privat și nu navetă</h2>
<ul>
  <li><strong>Bagajul.</strong> Navetele comune au spațiu limitat și nu garantează loc pentru echipament sportiv.</li>
  <li><strong>Traseul.</strong> O navetă oprește la mai multe hoteluri; resortul tău poate fi ultimul.</li>
  <li><strong>Ora.</strong> Naveta pleacă când se umple, nu când aterizezi tu.</li>
</ul>

<h2>Întrebări frecvente</h2>

<h3>Cât durează de la aeroport la hotelurile de golf din Belek?</h3>
<p>Aproximativ 35 de minute pentru 35 km. Resorturile din Kadriye sunt cu circa 5 minute mai aproape.</p>

<h3>Pot transporta echipament de golf?</h3>
<p>Da. Menționează-l la rezervare, în câmpul de observații, ca să confirmăm spațiul înainte de sosire.</p>

<h3>Există transfer și între hoteluri și terenurile de golf?</h3>
<p>Da, se poate rezerva separat. Scrie-ne pe WhatsApp cu datele și îți facem o ofertă.</p>
$ro$
WHERE slug = 'belek-golf-otelleri-transfer';

-- ---------------------------------------------------------------------------
-- 2. Side ancient city
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Transfer către Side: cetatea antică și hotelurile din jur$ro$,
excerpt_ro = $ro$Side este la 70 km de Aeroportul Antalya, aproximativ o oră cu transfer privat. Templul lui Apollo, teatrul antic și cum să nu confunzi hotelul din Side cu unul din Evrenseki sau Çolaklı.$ro$,
content_ro = $ro$
<p>Side este singura stațiune de pe coastă unde ruinele antice și hotelurile de plajă stau una lângă alta. Se află la <strong>70 de kilometri</strong> de Aeroportul Antalya, aproximativ <strong>o oră</strong> cu un transfer privat pe drumul de coastă D400.</p>

<h2>Ce vezi în Side</h2>
<ul>
  <li><strong>Templul lui Apollo.</strong> Coloanele de pe malul mării, la capătul peninsulei — cel mai fotografiat punct al stațiunii, mai ales la apus.</li>
  <li><strong>Teatrul antic.</strong> Unul dintre cele mai mari din Asia Mică, cu aproximativ 15.000 de locuri.</li>
  <li><strong>Orașul vechi.</strong> Străzi pietonale printre ruine, cu magazine și restaurante.</li>
  <li><strong>Manavgat.</strong> Cascada și piața sunt la 10 km, o excursie ușoară de jumătate de zi.</li>
</ul>

<h2>Atenție: „hotel în Side” nu înseamnă întotdeauna Side</h2>
<p>Zona hotelieră se întinde mult dincolo de peninsula antică. Multe hoteluri comercializate ca fiind „în Side” se află de fapt în satele vecine:</p>
<table>
  <tr><th>Zonă</th><th>Distanța de la AYT</th><th>Durata</th></tr>
  <tr><td>Evrenseki</td><td>60 km</td><td>± 50 min</td></tr>
  <tr><td>Side</td><td>70 km</td><td>± 1 oră</td></tr>
  <tr><td>Kızılağaç</td><td>80 km</td><td>± 1 oră 10 min</td></tr>
</table>
<p>Diferența este de 5–15 minute, dar pentru șofer înseamnă o adresă complet diferită. Scrie numele exact al hotelului când rezervi.</p>

<h2>Centrul vechi este pietonal</h2>
<p>Zona din jurul templului este închisă traficului auto în cea mai mare parte a zilei. Dacă hotelul tău este în interiorul peninsulei, șoferul te lasă la cea mai apropiată intrare permisă și te ajută cu bagajele până acolo. Merită să știi asta dinainte, ca să nu fie o surpriză.</p>

<h2>Întrebări frecvente</h2>

<h3>Cât durează transferul de la aeroportul Antalya la Side?</h3>
<p>Aproximativ o oră pentru 70 km cu transfer privat, direct la hotel.</p>

<h3>Se poate opri la Manavgat pe drum?</h3>
<p>Da, o oprire scurtă se poate aranja. Menționează la rezervare, în observații.</p>

<h3>Merită să vizitezi ruinele fără ghid?</h3>
<p>Da, situl este deschis și semnalizat. Teatrul are bilet separat; templul de pe mal este în aer liber și se vizitează liber.</p>
$ro$
WHERE slug = 'side-antik-kent-transfer';

-- ---------------------------------------------------------------------------
-- 3. Lara Beach
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Transfer Aeroportul Antalya - Lara Beach: cel mai scurt drum de pe coastă$ro$,
excerpt_ro = $ro$Lara și Kundu sunt la 15 km de Aeroportul Antalya, aproximativ 20 de minute. Hotelurile tematice, plaja cu nisip și de ce această zonă este alegerea pentru sosirile de noapte târziu.$ro$,
content_ro = $ro$
<p>Lara Beach și Kundu sunt cele mai apropiate zone hoteliere de Aeroportul Antalya: <strong>15 kilometri</strong>, aproximativ <strong>20 de minute</strong> cu un transfer privat. Este cel mai scurt drum de pe toată coasta și motivul principal pentru care zona este preferată de familiile cu copii mici și de cei care aterizează noaptea târziu.</p>

<h2>Ce are zona</h2>
<ul>
  <li><strong>Hotelurile tematice.</strong> Kundu este zona cu resorturile construite ca replici — cele mai cunoscute nume de pe coastă sunt aici.</li>
  <li><strong>Plaja cu nisip.</strong> Lara are nisip, spre deosebire de plajele cu pietriș din vestul Antalyei.</li>
  <li><strong>Aproape de oraș.</strong> Centrul Antalyei și orașul vechi Kaleiçi sunt la 15–20 de minute.</li>
  <li><strong>Cascada Düden.</strong> La câțiva kilometri, se varsă direct în mare.</li>
</ul>

<h2>De ce contează pentru o sosire de noapte</h2>
<p>Un zbor care aterizează la 2 dimineața înseamnă, în majoritatea stațiunilor, încă o oră sau două de drum cu copii obosiți. Către Lara sau Kundu sunt 20 de minute. Circulăm 24 de ore din 24 și nu percepem taxă de noapte, așa că prețul rămâne același indiferent de ora aterizării.</p>

<h2>Lara sau Kundu?</h2>
<p>Cele două se învecinează și sunt tratate ca o singură zonă la rezervare. Kundu este puțin mai la est, cu marile resorturi all-inclusive; Lara este mai aproape de oraș, cu o promenadă și restaurante. Diferența de drum între ele este de 3–5 minute.</p>

<h2>Ce include prețul</h2>
<p>Preț fix per vehicul, până la 5 pasageri, cu combustibilul, taxele, timpul de așteptare și întâmpinarea cu panou incluse. Chiar și pe un drum de 20 de minute, un taxi cu aparat de taxare rămâne o sumă pe care nu o știi dinainte.</p>

<h2>Întrebări frecvente</h2>

<h3>Cât durează de la aeroport la Lara Beach?</h3>
<p>Aproximativ 20 de minute pentru 15 km cu transfer privat.</p>

<h3>Merită transferul privat pentru o distanță atât de mică?</h3>
<p>La 2 noaptea, cu bagaje și copii, diferența nu este drumul, ci faptul că cineva te așteaptă cu numele tău pe un panou și mașina este deja acolo.</p>

<h3>Există taxă suplimentară pentru sosirile de noapte?</h3>
<p>Nu. Prețul afișat la rezervare este cel final, la orice oră.</p>
$ro$
WHERE slug = 'antalya-havalimani-lara-beach-transfer';

-- ---------------------------------------------------------------------------
-- 4. Kaș
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Transfer Aeroportul Antalya - Kaș: 190 km pe drumul de coastă$ro$,
excerpt_ro = $ro$Kaș este la 190 km de Aeroportul Antalya, aproximativ 3 ore pe drumul de coastă. Golfuri turcoaz, scufundări și de ce acest drum se face cu un vehicul privat, nu cu autocarul.$ro$,
content_ro = $ro$
<p>Kaș se află la <strong>190 de kilometri</strong> de Aeroportul Antalya, iar drumul durează <strong>aproximativ 3 ore</strong> cu un transfer privat. Este una dintre cele mai lungi curse pe care le facem și, în același timp, una dintre cele mai frumoase: șoseaua urmează coasta lyciană, printre golfuri și sate de munte.</p>

<h2>De ce se face cu vehicul privat</h2>
<p>Pe această distanță diferența dintre opțiuni nu mai este de confort, ci de jumătate de zi:</p>
<table>
  <tr><th>Opțiune</th><th>Durată</th><th>Schimbări</th></tr>
  <tr><td>Transfer privat</td><td>± 3 ore</td><td>Niciuna</td></tr>
  <tr><td>Autocar (prin autogara Antalya)</td><td>5 ore și peste</td><td>Cel puțin una</td></tr>
  <tr><td>Navetă comună</td><td>4–5 ore</td><td>Opriri multiple</td></tr>
</table>
<p>Autocarul pleacă din autogara Antalya, nu din aeroport, deci mai întâi trebuie să ajungi acolo. Cu bagaje, asta adaugă încă o oră înainte ca drumul propriu-zis să înceapă.</p>

<h2>Ce vezi pe drum</h2>
<p>Traseul trece prin Kumluca și Demre — Demre fiind orașul Sfântului Nicolae, cu biserica lui bizantină. O oprire scurtă se poate aranja dinainte, dacă vrei să rupi drumul în două.</p>

<h2>Kaș și împrejurimile</h2>
<ul>
  <li><strong>Kaș centru.</strong> Un orășel de coastă cu străzi înguste, fără hoteluri gigant.</li>
  <li><strong>Kaputaș.</strong> Plaja dintre stânci, la 20 de minute spre Kalkan.</li>
  <li><strong>Kekova.</strong> Satul scufundat, vizitat cu barca din Üçağız.</li>
  <li><strong>Scufundări.</strong> Kaș este principalul centru de scufundări al Turciei.</li>
</ul>

<h2>Ce include prețul</h2>
<p>Preț fix per vehicul pentru toată distanța, cu combustibilul, taxele și timpul de așteptare incluse. Pe 190 de kilometri, un aparat de taxare este exact lucrul pe care nu vrei să îl vezi funcționând.</p>

<h2>Întrebări frecvente</h2>

<h3>Cât durează de la aeroportul Antalya la Kaș?</h3>
<p>Aproximativ 3 ore pentru 190 km cu transfer privat, fără schimbări de vehicul.</p>

<h3>Se poate opri pe drum?</h3>
<p>Da. O oprire scurtă la Demre sau pentru o pauză se aranjează dinainte — menționează la rezervare.</p>

<h3>Kalkan este pe același drum?</h3>
<p>Da, Kalkan este la 210 km, cu circa 20 de minute după Kaș.</p>
$ro$
WHERE slug = 'antalya-havalimani-kas-transfer';

-- ---------------------------------------------------------------------------
-- 5. Land of Legends
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Transfer către The Land of Legends: ghid pentru familii$ro$,
excerpt_ro = $ro$Parcul tematic Land of Legends este în Belek, la 35 km de Aeroportul Antalya, aproximativ 30 de minute. Cum ajungi acolo cu copiii, când să mergi și ce să iei cu tine.$ro$,
content_ro = $ro$
<p>The Land of Legends este cel mai mare parc tematic din Turcia și se află în <strong>Belek</strong>, la <strong>35 de kilometri</strong> de Aeroportul Antalya — aproximativ <strong>30 de minute</strong> cu un transfer privat. Are un parc acvatic, un parc de distracții, un delfinariu și un hotel propriu.</p>

<h2>Cum ajungi acolo</h2>
<p>Poți merge direct de la aeroport, dacă stai la hotelul parcului, sau din stațiunea ta pentru o zi întreagă. Din principalele zone hoteliere:</p>
<table>
  <tr><th>Din</th><th>Durata aproximativă</th></tr>
  <tr><td>Aeroportul Antalya</td><td>± 30 min</td></tr>
  <tr><td>Kundu / Lara</td><td>± 25 min</td></tr>
  <tr><td>Belek / Kadriye</td><td>± 5-10 min</td></tr>
  <tr><td>Side</td><td>± 40 min</td></tr>
</table>

<h2>Cu copiii, ce contează</h2>
<ul>
  <li><strong>Scaunul pentru copii.</strong> Se solicită la rezervare și este montat înainte de sosirea ta — nu improvizat la fața locului.</li>
  <li><strong>Ora de întoarcere.</strong> Parcul se închide seara, iar taxiurile din zonă se aglomerează exact atunci. O cursă de retur rezervată dinainte te scutește de coadă cu copii obosiți.</li>
  <li><strong>Bagajul de zi.</strong> Prosoape, schimburi, geantă de plajă — într-un vehicul privat rămân în mașină, nu le cari toată ziua.</li>
</ul>

<h2>Când să mergi</h2>
<p>Vara, parcul acvatic este cel mai aglomerat între 12:00 și 16:00. O sosire dimineața devreme îți dă două-trei ore mai liniștite. Primăvara și toamna sunt mai puțin aglomerate, dar unele atracții acvatice pot funcționa cu program redus.</p>

<h2>Ce include prețul</h2>
<p>Preț fix per vehicul, dus sau dus-întors, cu combustibilul, taxele și timpul de așteptare incluse. Fără aparat de taxare și fără negociere la ieșirea din parc.</p>

<h2>Întrebări frecvente</h2>

<h3>Cât durează de la aeroport la Land of Legends?</h3>
<p>Aproximativ 30 de minute pentru 35 km cu transfer privat.</p>

<h3>Pot rezerva dus-întors în aceeași zi?</h3>
<p>Da. Stabilim ora de retur la rezervare, iar șoferul te așteaptă la ieșirea din parc.</p>

<h3>Aveți scaune pentru copii și înălțătoare?</h3>
<p>Da, ambele. Se solicită la rezervare și sunt montate înainte de preluare.</p>
$ro$
WHERE slug = 'land-of-legends-transfer-rehberi';

-- Progress check:
-- SELECT slug, title_ro IS NOT NULL AS has_ro FROM blog_posts
--  WHERE is_published = true ORDER BY slug;
