-- 068: Romanian blog translations — batch 4 (families, seasons, the service)
--
-- Five posts about who travels and what they get: families with small
-- children, practical tips for family trips, the winter season, the 24/7
-- promise, and the vehicle itself.
--
-- The child-seat fee ($10 per booking) and the free waiting time (60 min for
-- flights, 15 for hotels) are the figures the messages files already state in
-- every language. They are repeated here rather than reinvented, so a reader
-- who checks the FAQ finds the same numbers.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Airport transfer with children
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Transfer de la aeroport cu copii: scaune, bagaje și ore târzii$ro$,
excerpt_ro = $ro$Cu copii mici, drumul de la aeroport la hotel este partea cea mai grea a vacanței. Scaune montate dinainte, așteptare gratuită și de ce o sosire de noapte schimbă totul.$ro$,
content_ro = $ro$
<p>Zborul se termină, dar drumul nu. Pentru o familie cu copii mici, ce se întâmplă între ieșirea din terminal și camera de hotel decide cum începe vacanța.</p>

<h2>Scaunul pentru copii</h2>
<p>Scaunele pentru bebeluși și înălțătoarele se solicită <strong>la rezervare</strong> și sunt montate înainte de sosirea ta, nu improvizate în parcare. Costul este de 10 USD per rezervare și apare ca o linie separată în total, înainte de plată.</p>
<p>Menționează vârsta și greutatea copilului în câmpul de observații — un bebeluș de 8 luni și un copil de 5 ani au nevoie de scaune diferite.</p>

<h2>Bagajul real al unei familii</h2>
<p>Un cărucior, un pat pliant, o geantă de plajă și valizele nu intră într-un sedan. Un Mercedes Vito duce confortabil bagajul unei familii de patru-cinci persoane. Dacă vii cu cărucior dublu sau cu echipament voluminos, scrie-l la rezervare ca să confirmăm spațiul dinainte.</p>

<h2>Sosirile de noapte</h2>
<p>Multe zboruri charter aterizează între miezul nopții și 4 dimineața. Cu copii adormiți, coada la taxi și negocierea prețului sunt exact lucrurile de evitat. La un transfer rezervat, șoferul este deja acolo, mașina este caldă și scaunul este montat.</p>
<p>Nu percepem taxă de noapte — prețul este același la 3 dimineața ca la prânz.</p>

<h2>Dacă zborul întârzie</h2>
<p>Urmărim numărul zborului în timp real. Ora preluării se mută automat și așteptarea rămâne gratuită. Cu copii, asta contează mai mult decât orice: nu trebuie să suni pe nimeni în timp ce ții un bebeluș în brațe.</p>

<h2>Câteva lucruri practice</h2>
<ul>
  <li><strong>Apa.</strong> În vehicul există apă îmbuteliată din partea casei.</li>
  <li><strong>Pauza.</strong> Pe drumurile lungi, spre Alanya sau Kaș, o oprire scurtă se poate cere oricând.</li>
  <li><strong>Locurile din față.</strong> Dacă un copil are rău de mașină, spune-i șoferului — pe drumul spre Kemer ajută.</li>
  <li><strong>Adresa exactă.</strong> Numele complet al hotelului, nu doar stațiunea.</li>
</ul>

<h2>Întrebări frecvente</h2>

<h3>Câte scaune pentru copii pot cere?</h3>
<p>Câte îți trebuie, în limita locurilor din vehicul. Menționează-le pe toate la rezervare.</p>

<h3>Cât costă scaunul pentru copii?</h3>
<p>10 USD per rezervare, nu per scaun-zi. Apare în total înainte de plată.</p>

<h3>Cât este așteptarea gratuită?</h3>
<p>60 de minute după aterizare pentru preluările de la aeroport, 15 minute pentru cele de la hotel.</p>
$ro$
WHERE slug = 'aile-cocuk-havalimani-transfer';

-- ---------------------------------------------------------------------------
-- 2. Family travel tips
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Sfaturi pentru transferul în familie în Antalya$ro$,
excerpt_ro = $ro$Ce să pregătești înainte de plecare, cum să alegi stațiunea în funcție de durata drumului și ce să ceri la rezervare când călătorești cu copii.$ro$,
content_ro = $ro$
<p>Câteva lucruri decise înainte de plecare fac diferența între o sosire liniștită și două ore de nervi cu copii obosiți.</p>

<h2>Alege stațiunea și după durata drumului</h2>
<p>Nu doar după hotel. Diferența dintre 20 de minute și două ore, după un zbor de trei ore, este considerabilă cu copii mici:</p>
<table>
  <tr><th>Stațiune</th><th>Drum de la AYT</th><th>Potrivit pentru</th></tr>
  <tr><td>Kundu / Lara</td><td>± 20 min</td><td>Copii foarte mici, sosiri de noapte</td></tr>
  <tr><td>Belek / Kadriye</td><td>± 35 min</td><td>Familii, resorturi mari</td></tr>
  <tr><td>Kemer</td><td>± 50 min</td><td>Natură, munte și mare</td></tr>
  <tr><td>Side</td><td>± 1 oră</td><td>Plajă și istorie</td></tr>
  <tr><td>Alanya</td><td>± 2 ore</td><td>Sejururi mai lungi</td></tr>
</table>

<h2>Ce să pregătești înainte de plecare</h2>
<ul>
  <li><strong>Numele complet al hotelului</strong> și, dacă îl ai, adresa.</li>
  <li><strong>Numărul zborului</strong> — fără el nu se poate urmări întârzierea.</li>
  <li><strong>Numărul exact de pasageri</strong>, inclusiv bebelușii.</li>
  <li><strong>Scaunele pentru copii</strong>, cu vârsta fiecăruia.</li>
  <li><strong>Bagajul special:</strong> cărucior, pat pliant, echipament sportiv.</li>
</ul>

<h2>În ziua zborului</h2>
<p>Ține la îndemână gustări, apă și o schimbă de haine în bagajul de mână — controlul pașapoartelor în vârf de sezon poate dura. Voucherul de transfer, cu numele și telefonul șoferului, este bine să fie salvat și offline, nu doar în e-mail.</p>

<h2>La sosire</h2>
<p>După bagaje și vamă, șoferul te așteaptă în holul de sosiri cu un panou cu numele tău. Dacă nu îl vezi imediat, sună-l la numărul din voucher înainte să ieși din terminal — aeroportul are mai multe ieșiri.</p>

<h2>Pentru retur</h2>
<p>Rezervă cursa de întoarcere odată cu cea de sosire: are reducere și scutește o discuție la recepția hotelului în ultima seară. Ora se calculează astfel încât să ajungi la aeroport cu cel puțin 2,5 ore înainte de decolare.</p>

<h2>Întrebări frecvente</h2>

<h3>Bebelușii se numără ca pasageri?</h3>
<p>Da, pentru capacitatea vehiculului. Prețul rămâne per vehicul.</p>

<h3>Putem opri pe drum?</h3>
<p>Da, o oprire scurtă se poate cere, mai ales pe rutele lungi.</p>

<h3>Cât de devreme trebuie rezervat?</h3>
<p>Cu cât mai devreme, cu atât mai bine în vârf de sezon, dar se poate și cu o zi înainte, în funcție de disponibilitate.</p>
$ro$
WHERE slug = 'aileler-icin-antalya-transfer-ipuclari';

-- ---------------------------------------------------------------------------
-- 3. Winter holidays
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Antalya iarna: transfer în afara sezonului$ro$,
excerpt_ro = $ro$Iarna, drumurile sunt libere și transferurile mai rapide. Ce hoteluri rămân deschise, cum arată vremea și de ce ianuarie este cea mai liniștită lună pentru drumul de la aeroport.$ro$,
content_ro = $ro$
<p>Antalya nu se închide iarna. Zborurile continuă, o parte dintre hoteluri rămân deschise, iar drumul de la aeroport devine cel mai simplu din tot anul.</p>

<h2>Ce se schimbă pe drum</h2>
<ul>
  <li><strong>Fără trafic de sezon.</strong> Rutele spre Side și Alanya se fac la limita de jos a intervalului: Alanya în jur de două ore, fără cele 20 de minute suplimentare din august.</li>
  <li><strong>Aeroport mai gol.</strong> Ieșirea din terminal durează minute, nu jumătate de oră.</li>
  <li><strong>Aceleași prețuri.</strong> Tariful nu scade și nu crește în funcție de sezon.</li>
</ul>

<h2>Vremea</h2>
<p>Iernile pe coastă sunt blânde, cu temperaturi de obicei între 10 și 17 grade ziua. Plouă mai mult decât vara, iar în munți, spre Kemer și Saklıkent, poate ninge. Drumul de coastă D400 rămâne deschis, dar pe ploaie se conduce mai încet — o cursă poate dura cu 10-15 minute mai mult.</p>

<h2>Ce rămâne deschis</h2>
<p>Multe resorturi mari din Belek, Lara și Kundu funcționează tot anul; unele hoteluri mici din stațiunile de plajă se închid între noiembrie și martie. Verifică înainte de a rezerva transferul, pentru că adresa exactă contează.</p>

<h2>Ce poți face iarna</h2>
<ul>
  <li><strong>Orașul vechi Kaleiçi</strong> și muzeul Antalya, mult mai liniștite.</li>
  <li><strong>Siturile antice</strong> — Side, Perge, Aspendos — fără căldură și fără cozi.</li>
  <li><strong>Saklıkent,</strong> zona de schi la două ore de coastă.</li>
  <li><strong>Termele și spa-urile</strong> hotelurilor mari, care iarna sunt principalul motiv de a veni.</li>
</ul>

<h2>Ce nu se schimbă</h2>
<p>Circulăm 24 de ore din 24, tot anul. Urmărirea zborului, întâmpinarea cu panou și așteptarea gratuită funcționează identic în ianuarie și în iulie.</p>

<h2>Întrebări frecvente</h2>

<h3>Transferurile funcționează iarna?</h3>
<p>Da, tot anul, inclusiv de sărbători.</p>

<h3>Prețurile sunt mai mici în afara sezonului?</h3>
<p>Prețul transferului este același tot anul. Ce se schimbă este durata drumului, în favoarea ta.</p>

<h3>Se poate ajunge la Saklıkent pentru schi?</h3>
<p>Da, se poate rezerva ca transfer separat. Scrie-ne pe WhatsApp cu data și numărul de persoane.</p>
$ro$
WHERE slug = 'kis-antalya-tatil-transfer';

-- ---------------------------------------------------------------------------
-- 4. 24/7 service
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Transfer 24/7 în Antalya: ce înseamnă la 3 dimineața$ro$,
excerpt_ro = $ro$Jumătate dintre zborurile charter aterizează noaptea. Ce se întâmplă la 3 dimineața, de ce nu percepem taxă de noapte și cum funcționează urmărirea zborului la ore imposibile.$ro$,
content_ro = $ro$
<p>„24/7” apare pe multe site-uri. Diferența se vede la ora la care aterizezi de fapt.</p>

<h2>De ce contează</h2>
<p>O mare parte dintre zborurile charter spre Antalya aterizează între miezul nopții și 5 dimineața, pentru că sloturile de zi sunt ocupate de cursele regulate. La acea oră, ghișeele sunt închise, coada la taxi este imprevizibilă și naveta Havaș are curse rare.</p>

<h2>Ce înseamnă la noi</h2>
<ul>
  <li><strong>Șofer alocat dinainte.</strong> Nu se caută cineva la ora aceea — cursa este atribuită înainte ca tu să decolezi.</li>
  <li><strong>Urmărirea zborului.</strong> Dacă aterizezi la 4:10 în loc de 2:40, ora preluării se mută singură.</li>
  <li><strong>Fără taxă de noapte.</strong> Prețul afișat la rezervare este cel final, la orice oră.</li>
  <li><strong>Asistență.</strong> Ne poți scrie pe WhatsApp și noaptea.</li>
</ul>

<h2>Ce primești înainte de zbor</h2>
<p>Un e-mail cu codul rezervării, numele și telefonul șoferului și o hartă a punctului de întâlnire. Salvează-l și offline: la 3 dimineața, într-un aeroport străin, roamingul este exact lucrul care nu merge.</p>

<h2>Dacă zborul se anulează</h2>
<p>Scrie-ne imediat. Reprogramăm cursa pentru noul zbor fără costuri suplimentare sau returnăm integral suma, în funcție de ce îți convine.</p>

<h2>Retururile de dimineață devreme</h2>
<p>Funcționează la fel, în sens invers. Pentru un zbor de la 6 dimineața, preluarea din stațiune se calculează astfel încât să ajungi la aeroport cu cel puțin 2,5 ore înainte — iar șoferul este la ușă la ora stabilită, nu „undeva pe la”.</p>

<h2>Întrebări frecvente</h2>

<h3>Există supliment pentru transferul de noapte?</h3>
<p>Nu. Prețul este același la orice oră.</p>

<h3>Ce se întâmplă dacă zborul are trei ore întârziere?</h3>
<p>Îl urmărim și mutăm ora preluării. Așteptarea rămâne gratuită.</p>

<h3>Pot rezerva în aceeași zi?</h3>
<p>În funcție de disponibilitate, da. Pentru sosirile de noapte, cu cât mai devreme, cu atât mai sigur.</p>
$ro$
WHERE slug = 'antalya-7-24-transfer-hizmeti';

-- ---------------------------------------------------------------------------
-- 5. The vehicle
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Mercedes Vito VIP: vehiculul cu care se face transferul$ro$,
excerpt_ro = $ro$Toate transferurile se fac cu Mercedes Vito VIP: până la 5 pasageri, scaune din piele, aer condiționat pe două zone, Wi-Fi și spațiu real pentru bagaje. Ce încape și ce nu.$ro$,
content_ro = $ro$
<p>Nu alegi între cinci clase de mașini. Toate transferurile se fac cu același vehicul — <strong>Mercedes Vito VIP</strong> — indiferent de destinație și de preț.</p>

<h2>Ce are</h2>
<table>
  <tr><th>Capacitate</th><td>Până la 5 pasageri</td></tr>
  <tr><th>Bagaje</th><td>5 valize mari plus bagaj de mână</td></tr>
  <tr><th>Climatizare</th><td>Pe două zone</td></tr>
  <tr><th>Scaune</th><td>Piele</td></tr>
  <tr><th>Wi-Fi</th><td>Gratuit la bord</td></tr>
  <tr><th>Încărcare</th><td>USB</td></tr>
  <tr><th>Apă</th><td>Îmbuteliată, din partea casei</td></tr>
</table>

<h2>Spațiul, concret</h2>
<p>Cinci valize mari intră în portbagaj fără să se pună nimic pe scaune. Un cărucior încape peste. Ce nu intră fără o discuție prealabilă: două seturi de crose de golf plus bagajul complet al unei familii, sau echipament sportiv voluminos. Pentru acele cazuri, scrie în observații la rezervare și trimitem un vehicul mai mare.</p>

<h2>De ce contează pe drumurile lungi</h2>
<p>Pe 20 de minute până la Lara, orice mașină funcționează. Pe două ore până la Alanya, spațiul pentru picioare, climatizarea și suspensia devin lucrul pe care ți-l amintești. Drumul de coastă are curbe; un vehicul înalt și stabil se resimte diferit față de un sedan încărcat la maximum.</p>

<h2>Grupurile mai mari</h2>
<p>Pentru grupuri peste 5 persoane trimitem mai multe vehicule sau un microbuz, în funcție de număr și bagaje. Se rezervă la fel; scrie numărul real de pasageri și îți propunem varianta potrivită.</p>

<h2>Scaunele pentru copii</h2>
<p>Se montează în Vito înainte de sosirea ta. Se solicită la rezervare, cu vârsta copilului, pentru că un scaun de bebeluș și un înălțător nu sunt același lucru.</p>

<h2>Întrebări frecvente</h2>

<h3>Câte persoane încap?</h3>
<p>Până la 5 pasageri, cu bagajele lor.</p>

<h3>Pot cere un vehicul mai mare?</h3>
<p>Da, pentru grupuri mai mari sau bagaj voluminos. Menționează la rezervare.</p>

<h3>Vehiculul este același pentru toate destinațiile?</h3>
<p>Da. Aceeași clasă de vehicul, fie că mergi 15 km până la Lara sau 190 până la Kaș.</p>
$ro$
WHERE slug = 'antalya-mercedes-vito-vip-transfer';
