-- 067: Romanian blog translations — batch 3 (the comparison cluster)
--
-- Six posts, all answering the same underlying question in different words:
-- what should I actually take from the airport. Taxi, the Havaș shuttle,
-- Uber, a rental car, a shared shuttle — and what a transfer costs.
--
-- The Uber post states a fact that has to stay accurate: Uber has been
-- restricted in Turkey since 2019 and does not operate at Antalya Airport.
-- The same claim already appears in the homeFaq namespace of every messages
-- file, so the two must not drift apart.
--
-- Prices quoted are the same USD figures the homeFaq namespace uses
-- ($35 Kundu-Lara, $40 Belek, $55 Side, $75 Alanya) — the booking engine is
-- the source of truth and the article must not undercut or oversell it.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Taxi or private transfer
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Taxi sau transfer privat de la Aeroportul Antalya?$ro$,
excerpt_ro = $ro$Taxiul merge pe aparat, transferul privat are preț fix stabilit la rezervare. Pe distanțe lungi diferența devine considerabilă. Ce alegi și de ce contează la 2 noaptea.$ro$,
content_ro = $ro$
<p>Un taxi de aeroport și un transfer privat te duc în același loc. Diferența este ce știi dinainte și ce afli la sosire.</p>

<h2>Comparație directă</h2>
<table>
  <tr><th></th><th>Taxi oficial</th><th>Transfer privat</th></tr>
  <tr><td>Preț</td><td>Aparat de taxare</td><td>Fix, stabilit la rezervare</td></tr>
  <tr><td>Când îl afli</td><td>La destinație</td><td>Înainte să pleci de acasă</td></tr>
  <tr><td>Șofer</td><td>Cine este la rând</td><td>Alocat, cu nume și telefon</td></tr>
  <tr><td>Urmărirea zborului</td><td>Nu</td><td>Da</td></tr>
  <tr><td>Scaun pentru copii</td><td>Rareori</td><td>La cerere, montat dinainte</td></tr>
  <tr><td>Așteptare</td><td>Taxată</td><td>60 min gratuit</td></tr>
</table>

<h2>Unde se vede cel mai mult diferența</h2>
<p>Pe un drum de 20 de minute până la Lara, un taxi este o soluție rezonabilă. Pe 130 de kilometri până la Alanya, aparatul de taxare rulează două ore și nu ai cum să știi dinainte unde se oprește. Traficul, ruta aleasă și sezonul intră toate în suma finală.</p>

<h2>Coada de la taxi</h2>
<p>În vârf de sezon, între 14:00 și 19:00, la ieșirea din terminal se formează coadă. După un zbor de trei ore, cu bagaje și copii, asta se adaugă la drumul propriu-zis. Cu un transfer rezervat, șoferul este deja acolo, cu numele tău pe un panou.</p>

<h2>Bariera lingvistică</h2>
<p>Adresa unui hotel din Turcia nu se pronunță întotdeauna cum se scrie, iar nu toți șoferii de taxi vorbesc engleză. La un transfer rezervat, adresa a fost transmisă în scris șoferului înainte ca tu să aterizezi.</p>

<h2>Când taxiul este alegerea corectă</h2>
<p>Sincer: pentru o cursă scurtă neplanificată, în oraș, sau dacă nu ai rezervat nimic și vrei să pleci imediat. Pentru drumul de la aeroport la hotel, cu bagaje și la o oră previzibilă, transferul rezervat câștigă pe aproape toate criteriile.</p>

<h2>Întrebări frecvente</h2>

<h3>Taxiul este mai ieftin?</h3>
<p>Uneori pe distanțe scurte. Pe rutele lungi rareori, iar suma nu se știe dinainte.</p>

<h3>Pot plăti cu cardul în taxi?</h3>
<p>Nu toate taxiurile acceptă card. Transferul se plătește online, la rezervare.</p>

<h3>Ce se întâmplă dacă zborul întârzie?</h3>
<p>La transfer, ora se ajustează automat și așteptarea este gratuită. Un taxi luat la fața locului nu are cum să te aștepte.</p>
$ro$
WHERE slug = 'antalya-havalimani-taksi-mi-vip-transfer-mi';

-- ---------------------------------------------------------------------------
-- 2. Havaș shuttle or private transfer
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Naveta Havaș sau transfer privat de la Aeroportul Antalya?$ro$,
excerpt_ro = $ro$Havaș este ieftin dar merge doar pe rute fixe, cu orar propriu și fără oprire la hotelul tău. Când merită și când te costă jumătate de zi.$ro$,
content_ro = $ro$
<p>Havaș este serviciul de navetă al aeroporturilor din Turcia. Este cea mai ieftină variantă organizată de a pleca din Aeroportul Antalya, dar funcționează pe principii complet diferite de un transfer privat.</p>

<h2>Cum funcționează Havaș</h2>
<ul>
  <li>Pleacă pe <strong>rute fixe</strong>, în principal spre centrul Antalyei și autogară.</li>
  <li>Are <strong>orar propriu</strong>, nu pleacă atunci când aterizezi tu.</li>
  <li>Te lasă într-un <strong>punct de oprire</strong>, nu la hotel.</li>
  <li>Prețul este <strong>per persoană</strong>.</li>
</ul>

<h2>Comparație</h2>
<table>
  <tr><th></th><th>Havaș</th><th>Transfer privat</th></tr>
  <tr><td>Preț</td><td>Per persoană</td><td>Per vehicul</td></tr>
  <tr><td>Plecare</td><td>După orar</td><td>Când aterizezi</td></tr>
  <tr><td>Destinație</td><td>Stație fixă</td><td>Ușa hotelului</td></tr>
  <tr><td>Bagaje</td><td>Limitate</td><td>Portbagaj întreg</td></tr>
  <tr><td>Continuare</td><td>Încă un taxi</td><td>Niciuna</td></tr>
</table>

<h2>Calculul pe care mulți îl uită</h2>
<p>Havaș te lasă în centrul Antalyei. Dacă hotelul tău este în Belek, Side sau Alanya, de acolo mai ai nevoie de un autocar sau un taxi — cu bagajele, la o oră pe care nu o alegi tu. Pentru o familie de patru, prețul per persoană plus a doua cursă ajunge adesea aproape de un transfer privat, dar cu două-trei ore în plus.</p>

<h2>Când Havaș este alegerea potrivită</h2>
<p>Dacă ești singur, cu bagaj mic, mergi în centrul Antalyei și nu te grăbește nimeni. Atunci este imbatabil ca preț.</p>

<h2>Când nu este</h2>
<p>Cu copii, cu bagaje multe, la o sosire de noapte, sau dacă hotelul este în afara orașului. Acolo economia dispare în a doua cursă.</p>

<h2>Întrebări frecvente</h2>

<h3>Havaș merge până în Belek sau Side?</h3>
<p>Nu direct la hoteluri. Rutele principale merg spre centrul Antalyei și autogară.</p>

<h3>Havaș circulă noaptea?</h3>
<p>Are curse și noaptea, dar cu frecvență redusă. Un transfer privat pleacă la ora aterizării tale.</p>

<h3>Este prețul per persoană?</h3>
<p>Da. La transferul privat prețul este per vehicul, indiferent câți sunteți.</p>
$ro$
WHERE slug = 'antalya-havas-mi-vip-transfer-mi';

-- ---------------------------------------------------------------------------
-- 3. Uber in Antalya
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Există Uber în Antalya? Ce funcționează de fapt la aeroport$ro$,
excerpt_ro = $ro$Uber este restricționat în Turcia din 2019 și nu operează în Aeroportul Antalya. Alternativele reale: BiTaksi, naveta Havaș, taxiurile oficiale și transferul privat rezervat dinainte.$ro$,
content_ro = $ro$
<p>Răspunsul scurt: <strong>nu</strong>. Uber este restricționat în Turcia din 2019 și nu operează în Aeroportul Antalya. Dacă ai aplicația instalată, cel mai probabil nu vei găsi niciun vehicul disponibil, iar dacă găsești, nu va fi la aeroport.</p>

<h2>Ce funcționează în schimb</h2>
<table>
  <tr><th>Opțiune</th><th>Cum funcționează</th><th>Preț</th></tr>
  <tr><td>BiTaksi</td><td>Aplicație locală, cheamă un taxi oficial</td><td>Aparat de taxare</td></tr>
  <tr><td>Taxi oficial</td><td>Stație la ieșirea din terminal</td><td>Aparat de taxare</td></tr>
  <tr><td>Naveta Havaș</td><td>Rute fixe, orar propriu</td><td>Per persoană</td></tr>
  <tr><td>Transfer privat</td><td>Rezervat dinainte, ușă în ușă</td><td>Fix, per vehicul</td></tr>
</table>

<h2>BiTaksi, pe scurt</h2>
<p>Este echivalentul local al aplicațiilor de ride-hailing, dar cheamă un taxi obișnuit, cu aparat de taxare. Ajută la comunicare — adresa se introduce în aplicație — dar nu îți dă un preț fix și nu rezolvă coada în vârf de sezon.</p>

<h2>De ce contează pentru drumul de la aeroport</h2>
<p>Cine vine din Europa se așteaptă adesea să deschidă aplicația la aterizare și să plece. În Antalya asta nu funcționează. Ori stai la coada de taxi, ori ai rezervat ceva înainte de plecare. Pe rutele lungi — Side, Alanya, Kaș — diferența dintre cele două ajunge la ore.</p>

<h2>Ce înseamnă „rezervat dinainte”</h2>
<p>Un transfer privat se rezervă online, cu numărul zborului. Zborul este urmărit, șoferul este alocat înainte să aterizezi și te așteaptă în holul de sosiri cu numele tău pe un panou. Prețul este stabilit la rezervare și nu se schimbă.</p>

<h2>Întrebări frecvente</h2>

<h3>Uber va reveni în Turcia?</h3>
<p>Nu există o dată anunțată. Pentru vacanța ta, planifică fără Uber.</p>

<h3>Pot chema un taxi prin aplicație de la aeroport?</h3>
<p>Prin BiTaksi, da, dar tot un taxi cu aparat de taxare vine.</p>

<h3>Care este cea mai previzibilă opțiune?</h3>
<p>Transferul privat rezervat: preț fix, șofer alocat, urmărirea zborului și așteptare gratuită.</p>
$ro$
WHERE slug = 'uber-antalya-havalimani-ulasim';

-- ---------------------------------------------------------------------------
-- 4. Rental car or transfer
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Mașină de închiriat sau transfer în Antalya?$ro$,
excerpt_ro = $ro$O mașină închiriată are sens dacă vrei să explorezi. Pentru drumul de la aeroport la hotel, cu bagaje și după un zbor, calculul arată altfel. Costuri ascunse, parcare și trafic.$ro$,
content_ro = $ro$
<p>Cele două nu rezolvă aceeași problemă. O mașină închiriată îți dă libertate pe toată durata sejurului; un transfer rezolvă un singur drum, dar exact cel în care ești cel mai obosit.</p>

<h2>Ce costă de fapt o mașină închiriată</h2>
<ul>
  <li><strong>Tariful zilnic</strong> — partea pe care o vezi în reclamă.</li>
  <li><strong>Asigurarea suplimentară</strong> — fără ea, garanția blocată pe card este considerabilă.</li>
  <li><strong>Combustibilul.</strong></li>
  <li><strong>Parcarea la hotel</strong>, care nu este întotdeauna gratuită.</li>
  <li><strong>Garanția blocată pe card</strong>, adesea câteva sute de euro pentru toată perioada.</li>
</ul>

<h2>Condusul în zonă</h2>
<p>Drumul de coastă D400 este bine întreținut și ușor de condus. În schimb, centrul Antalyei în orele de vârf și parcarea în stațiunile aglomerate vara sunt altă poveste. Dacă nu ai mai condus în Turcia, prima zi — imediat după zbor, pe întuneric, cu GPS-ul într-o limbă străină — este cea mai grea.</p>

<h2>Combinația care funcționează cel mai bine</h2>
<p>Mulți fac așa: <strong>transfer privat de la aeroport la hotel</strong>, apoi închiriază o mașină din stațiune pentru zilele în care chiar vor să circule. Plătești mașina doar cât o folosești, eviți condusul în prima seară și nu ții un vehicul parcat degeaba lângă hotel toată săptămâna.</p>

<h2>Comparație</h2>
<table>
  <tr><th></th><th>Mașină închiriată</th><th>Transfer privat</th></tr>
  <tr><td>Bun pentru</td><td>Explorat, mai multe zile</td><td>Drumul aeroport-hotel</td></tr>
  <tr><td>Cost</td><td>Zilnic + extra</td><td>O singură dată, fix</td></tr>
  <tr><td>După zbor</td><td>Conduci tu</td><td>Conduce altcineva</td></tr>
  <tr><td>Bagaje</td><td>Limitate de model</td><td>Vehicul ales după grup</td></tr>
</table>

<h2>Întrebări frecvente</h2>

<h3>Am nevoie de permis internațional?</h3>
<p>Permisul european este acceptat în general, dar firma de închiriere poate cere unul internațional. Verifică înainte de plecare.</p>

<h3>Pot lua mașina de la aeroport și returna în oraș?</h3>
<p>De obicei da, uneori cu o taxă de returnare în alt punct.</p>

<h3>Se poate rezerva doar transferul de retur?</h3>
<p>Da. Multe persoane închiriază pentru sejur și rezervă doar cursa spre aeroport, pentru a preda mașina mai devreme.</p>
$ro$
WHERE slug = 'antalya-arac-kiralama-mi-transfer-mi';

-- ---------------------------------------------------------------------------
-- 5. Transfer prices
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Prețuri transfer Aeroportul Antalya: cât costă și ce include$ro$,
excerpt_ro = $ro$Prețurile sunt per vehicul, nu per persoană, și pornesc de la 35 USD spre Kundu-Lara. Ce este inclus, ce nu, și de ce prețul afișat este cel final.$ro$,
content_ro = $ro$
<p>Prețul unui transfer de la Aeroportul Antalya depinde de un singur lucru: <strong>unde mergi</strong>. Nu de câți sunteți. Fiecare destinație are un preț per vehicul, iar acesta rămâne același fie că sunteți doi, fie cinci.</p>

<h2>Prețuri orientative de pornire</h2>
<table>
  <tr><th>Destinație</th><th>De la</th></tr>
  <tr><td>Kundu / Lara</td><td>35 USD</td></tr>
  <tr><td>Belek</td><td>40 USD</td></tr>
  <tr><td>Side</td><td>55 USD</td></tr>
  <tr><td>Alanya</td><td>75 USD</td></tr>
</table>
<p>Prețul exact pentru data ta apare la rezervare, după ce alegi destinația. Cursa dus-întors are reducere față de două curse simple.</p>

<h2>Ce este inclus în preț</h2>
<ul>
  <li>Vehiculul și șoferul</li>
  <li>Combustibilul și taxele de drum</li>
  <li>Întâmpinarea cu panou în holul de sosiri</li>
  <li>Urmărirea zborului</li>
  <li>60 de minute de așteptare gratuită după aterizare</li>
  <li>Transportul din ușă în ușă, fără opriri intermediare</li>
</ul>

<h2>Ce se adaugă separat</h2>
<p>Scaunul pentru copii se solicită la rezervare și apare ca o linie distinctă în total, înainte de plată. Nu există alte suplimente: nu percepem taxă de noapte și nu apar sume în plus la sosire.</p>

<h2>De ce per vehicul și nu per persoană</h2>
<p>Pentru că mașina merge același drum indiferent câți sunteți în ea. Un cuplu plătește cât o familie de patru pentru aceeași cursă — ceea ce înseamnă că, la grup, un transfer privat costă adesea mai puțin decât biletele individuale de navetă.</p>

<h2>Moneda</h2>
<p>Poți vedea prețul în euro sau lei turcești, dar plata este procesată în dolari americani. Suma exactă care se încasează este afișată pe ecranul de plată, sub buton, înainte de confirmare.</p>

<h2>Întrebări frecvente</h2>

<h3>Prețul se schimbă noaptea?</h3>
<p>Nu. Nu percepem o taxă separată de noapte.</p>

<h3>Trebuie să plătesc tot online?</h3>
<p>Poți plăti integral online sau poți alege plata în vehicul, caz în care se achită un avans online și restul șoferului.</p>

<h3>Pot anula și primi banii înapoi?</h3>
<p>Da, gratuit, cu până la 24 de ore înainte de ora preluării.</p>
$ro$
WHERE slug = 'antalya-havalimani-transfer-fiyatlari';

-- ---------------------------------------------------------------------------
-- 6. VIP transfer or shared shuttle
-- ---------------------------------------------------------------------------
UPDATE blog_posts SET
title_ro = $ro$Transfer VIP sau navetă comună? Diferența în timp și bani$ro$,
excerpt_ro = $ro$Naveta comună este mai ieftină per persoană, dar oprește la mai multe hoteluri. La două-trei persoane calculul se schimbă, iar diferența de timp poate fi de două ore.$ro$,
content_ro = $ro$
<p>Amândouă pleacă din același terminal. Diferența începe imediat după aceea: una merge la hotelul tău, cealaltă la hotelurile tuturor.</p>

<h2>Cum funcționează naveta comună</h2>
<p>Vehiculul așteaptă să se umple sau pleacă la ora din program, apoi lasă pasagerii pe rând, în ordinea rutei. Dacă hotelul tău este ultimul, poți sta în mașină de două-trei ori mai mult decât durata reală a drumului.</p>

<h2>Calculul care contează</h2>
<table>
  <tr><th>Grup</th><th>Navetă comună</th><th>Transfer privat</th></tr>
  <tr><td>1 persoană</td><td>Cel mai ieftin</td><td>Mai scump</td></tr>
  <tr><td>2 persoane</td><td>Apropiate</td><td>Apropiate</td></tr>
  <tr><td>3-4 persoane</td><td>Adesea mai scump</td><td>Adesea mai ieftin</td></tr>
  <tr><td>5 persoane</td><td>Mai scump</td><td>Mai ieftin</td></tr>
</table>
<p>Naveta se plătește per persoană, transferul per vehicul. Pragul de rentabilitate se atinge de obicei în jur de trei pasageri — după care privatul este și mai rapid, și mai ieftin.</p>

<h2>Timpul, nu doar banii</h2>
<ul>
  <li><strong>Așteptarea la plecare.</strong> Naveta nu pleacă până nu sunt toți.</li>
  <li><strong>Opririle.</strong> Fiecare hotel înseamnă coborâre, bagaje, plecare.</li>
  <li><strong>Ruta.</strong> Nu este aleasă în funcție de tine.</li>
</ul>
<p>Pe o rută ca Alanya, o navetă comună poate transforma două ore de drum în patru.</p>

<h2>Când naveta este alegerea bună</h2>
<p>Un singur pasager, bagaj mic, sosire dimineața și fără program strâns. Atunci este cea mai ieftină opțiune organizată de pe aeroport.</p>

<h2>Când nu este</h2>
<p>Cu copii mici, cu bagaje multe, la o sosire de noapte, sau când sunteți trei sau mai mulți. Acolo naveta pierde pe ambele criterii deodată.</p>

<h2>Întrebări frecvente</h2>

<h3>Cât durează în plus o navetă comună?</h3>
<p>De obicei de 2-3 ori mai mult decât drumul direct, în funcție de câte hoteluri sunt pe rută înaintea ta.</p>

<h3>Pot rezerva navetă doar pentru retur?</h3>
<p>Da, dar ora de preluare este stabilită de operator, nu de tine — ceea ce contează când ai un zbor de prins.</p>

<h3>Transferul privat înseamnă vehicul de lux?</h3>
<p>Înseamnă vehicul doar pentru grupul tău. La noi este un Mercedes Vito VIP, cu până la 5 locuri.</p>
$ro$
WHERE slug = 'vip-transfer-mi-shuttle-mi';
