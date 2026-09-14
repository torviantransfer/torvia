-- =============================================
-- 088: Eksik dillerdeki bölge metinleri — ru, nl, ro, ar (+ Arapça adlar)
--
-- Site sekiz dilde yayında: tr, en, de, pl, ru, nl, ro, ar. Bölge sayfasında
-- şablon metin, SSS, menü ve yorumlar sekizinde de çevrili; yalnızca
-- regions.description_{locale} veritabanından gelir ve [region]/page.tsx
-- onu `description_${locale} || description_en` ile okur. Yani bir dilde
-- metin yoksa sayfa sessizce İNGİLİZCEYE düşer.
--
-- 085 (Avsallar, Konaklı) yalnızca tr/en/de/pl yazmıştı. Sonuç canlıda:
--   /ru/avsallar-transfer, /ro/…, /nl/…, /ar/…  hepsi İngilizce paragraf
--   /ru/konakli-transfer,  /ro/…, /nl/…, /ar/…  hepsi İngilizce paragraf
-- Eski bölgelerde bu sorun yok, sekiz dili de dolu. Yani bu bir gerileme.
--
-- ab6a309 ("don't submit five English pages as Romanian ones") tam olarak bu
-- hatayı kapatmıştı; 085 aynı deliği yeniden açtı. Bu dosya hem onu kapatır
-- hem de 086'nın eklediği altı bölgeyi baştan sekiz dilde tamamlar.
--
-- name_ar da hiçbirinde yoktu; sayfa name_en'e düşüyordu, yani Arapça sayfada
-- latin harfli bir bölge adı görünüyordu.
--
-- meta_title / meta_description YAZILMAZ: regionFallbackCopy() bunları zaten
-- her dil için şablondan üretiyor ve panelden düzenlenebiliyor. Doldurmak
-- panelin ürettiği başlığı dondurur, iyileştirmez.
--
-- ÖNCE 086 ÇALIŞTIRILMALI (altı yeni bölge).
--
-- Tek transaction, tekrar çalıştırılabilir.
-- =============================================

BEGIN;

-- ---------------------------------------------
-- 1. ARAPÇA ADLAR — sekiz bölge
-- ---------------------------------------------
UPDATE regions SET name_ar = v.ad
FROM (VALUES
  ('konyaalti', 'كونيا آلتي'),
  ('colakli',   'تشولاكلي'),
  ('cirali',    'تشيرالي'),
  ('kumluca',   'كوملوجا'),
  ('finike',    'فينيكه'),
  ('demre',     'ديمره'),
  ('avsallar',  'أفسلار'),
  ('konakli',   'كوناكلي')
) AS v(slug, ad)
WHERE regions.slug = v.slug;

-- ---------------------------------------------
-- 2. KONYAALTI
-- ---------------------------------------------
UPDATE regions SET
  description_ru = $ru$Коньяалты — прибрежный район в западной части Антальи, примерно в 25 км от аэропорта Антальи (AYT) и около 32 минут на индивидуальном трансфере. Его семикилометровый галечный пляж тянется прямо у подножия гор Бейдаглары: это один из немногих городских пляжей в мире, где можно искупаться, обернуться и увидеть перед собой горный хребет. Бич-парк, Океанариум Антальи и канатная дорога на Тюнектепе расположены прямо над берегом, а старый город Калеичи и Музей Антальи — в пятнадцати минутах. Вдоль набережной стоят городские отели: Akra, Ramada Plaza, Porto Bello, Hotel SU. В отличие от отелей «всё включено» в Кунду и Ларе, Коньяалты — живой городской район: трамвай, магазины, кафе и рестораны в пешей доступности. Аэропорт находится на восточной окраине города, поэтому трансфер пересекает Анталью насквозь — личный водитель довезёт вас прямо до дверей отеля, минуя заботы о пробках. TORVIAN: индивидуальный трансфер из аэропорта, фиксированная цена за автомобиль, встреча с табличкой, отслеживание рейса, 24/7.$ru$,

  description_nl = $nl$Konyaaltı is het kustdistrict aan de westkant van Antalya, ongeveer 25 km van de luchthaven Antalya (AYT) en zo'n 32 minuten met een privétransfer. Het zeven kilometer lange kiezelstrand loopt pal langs de voet van het Beydağları-gebergte — een van de weinige stadsstranden ter wereld waar u kunt zwemmen, zich omdraaien en recht tegen een bergketen aankijken. Beach Park, het Aquarium van Antalya en de kabelbaan naar Tünektepe liggen direct boven het strand; de oude stad Kaleiçi en het Museum van Antalya zijn vijftien minuten verderop. Stadshotels als Akra, Ramada Plaza, Porto Bello en Hotel SU staan langs de boulevard. Anders dan de allesinclusiveresorts in Kundu en Lara is Konyaaltı een echte stadswijk: tram, winkels, cafés en restaurants liggen op loopafstand. De luchthaven ligt aan de oostkant van de stad, dus de transfer doorkruist Antalya helemaal — een privéchauffeur brengt u rechtstreeks tot aan de hoteldeur, zonder dat u zich om het verkeer hoeft te bekommeren. TORVIAN: privétransfer vanaf de luchthaven, vaste prijs per voertuig, ontvangst met naambord, live vluchtopvolging, 24/7.$nl$,

  description_ro = $ro$Konyaaltı este cartierul de coastă din partea de vest a orașului Antalya, la circa 25 km de Aeroportul Antalya (AYT) și la aproximativ 32 de minute cu transfer privat. Plaja sa de pietriș, lungă de șapte kilometri, se întinde chiar la poalele munților Beydağları — una dintre puținele plaje urbane din lume unde poți înota, te poți întoarce și privi direct spre un lanț muntos. Beach Park, Acvariul din Antalya și telecabina spre Tünektepe se află imediat deasupra țărmului, iar orașul vechi Kaleiçi și Muzeul Antalya sunt la cincisprezece minute. De-a lungul falezei se înșiră hoteluri urbane precum Akra, Ramada Plaza, Porto Bello și Hotel SU. Spre deosebire de resorturile all inclusive din Kundu și Lara, Konyaaltı este un cartier viu: tramvaiul, magazinele, cafenelele și restaurantele sunt la o plimbare distanță. Aeroportul se află în partea de est a orașului, așa că transferul traversează Antalya dintr-un capăt în altul — un șofer privat vă duce direct la ușa hotelului, fără să vă preocupați de trafic. TORVIAN: transfer privat de la aeroport, preț fix pe vehicul, întâmpinare cu plăcuță, monitorizarea zborului, 24/7.$ro$,

  description_ar = $ar$كونيا آلتي هي المنطقة الساحلية في الجانب الغربي من أنطاليا، وتبعد نحو 25 كيلومترًا عن مطار أنطاليا (AYT) وحوالي 32 دقيقة بالنقل الخاص. يمتد شاطئها الحصوي على مسافة سبعة كيلومترات عند سفح جبال بيداغلاري مباشرة، وهو من الشواطئ المدينية النادرة التي يمكنك أن تسبح فيها ثم تستدير لترى أمامك سلسلة جبلية كاملة. تقع حديقة الشاطئ وأكواريوم أنطاليا وتلفريك تونك تبه فوق الشاطئ مباشرة، أما مدينة كاليتشي القديمة ومتحف أنطاليا فعلى بعد خمس عشرة دقيقة. تصطف على الكورنيش فنادق المدينة مثل أكرا ورامادا بلازا وبورتو بيلو وهوتيل إس يو. وعلى خلاف منتجعات كوندو ولارا الشاملة، تُعد كونيا آلتي حيًا سكنيًا نابضًا بالحياة: الترام والمتاجر والمقاهي والمطاعم كلها على مسافة قريبة سيرًا. يقع المطار في الطرف الشرقي من المدينة، لذا يعبر النقل أنطاليا من طرف إلى طرف، ويوصلك السائق الخاص إلى باب الفندق مباشرة دون أن تشغل بالك بالازدحام. تورفيان: نقل خاص من المطار، سعر ثابت للمركبة، استقبال بلافتة الاسم، متابعة حية للرحلة، على مدار الساعة.$ar$
WHERE slug = 'konyaalti';

-- ---------------------------------------------
-- 3. ÇOLAKLI
-- ---------------------------------------------
UPDATE regions SET
  description_ru = $ru$Чолаклы — прибрежный посёлок примерно в 56 км от аэропорта Антальи (AYT) и около 48 минут на индивидуальном трансфере, расположенный между Богазкентом и Сиде, примерно в 8 км западнее центра Сиде. Его длинный песчаный пляж с пологим входом особенно ценят семьи с маленькими детьми: море остаётся по пояс далеко от берега. Вдоль побережья выстроились крупные отели «всё включено» — Trendy Verbena, Alba Queen, Adalya Elite, Sunis Elita. В Чолаклы едут те, кому нужно побережье Сиде без его толп и ночной жизни, при этом античный театр и храм Аполлона всего в десяти минутах. Отели стоят в глубине от прибрежного шоссе D400 и близко друг к другу, вывески легко перепутать: личный водитель довезёт вас прямо ко входу именно вашего отеля, не останавливаясь у соседних. TORVIAN: индивидуальный трансфер из аэропорта, фиксированная цена за автомобиль, встреча с табличкой, отслеживание рейса, 24/7.$ru$,

  description_nl = $nl$Çolaklı is een kustdorp op ongeveer 56 km van de luchthaven Antalya (AYT) en zo'n 48 minuten met een privétransfer, gelegen tussen Boğazkent en Side, ruim 8 km ten westen van het centrum van Side. Het lange, flauw aflopende zandstrand is vooral in trek bij gezinnen met kleine kinderen — het water blijft tot ver uit de kust stahoogte. Grote allesinclusiveresorts als Trendy Verbena, Alba Queen, Adalya Elite en Sunis Elita liggen langs de kustlijn. Çolaklı is de keuze voor wie de kust van Side wil zonder de drukte en het nachtleven, terwijl het antieke theater en de Apollotempel toch maar tien minuten verderop liggen. De hotels staan dicht bij elkaar en iets landinwaarts van de kustweg D400, waardoor bewegwijzering makkelijk te verwarren is; een privéchauffeur brengt u rechtstreeks naar de ingang van uw eigen hotel in plaats van onderweg bij elk resort te stoppen. TORVIAN: privétransfer vanaf de luchthaven, vaste prijs per voertuig, ontvangst met naambord, live vluchtopvolging, 24/7.$nl$,

  description_ro = $ro$Çolaklı este un sat de coastă aflat la circa 56 km de Aeroportul Antalya (AYT) și la aproximativ 48 de minute cu transfer privat, între Boğazkent și Side, la vreo 8 km vest de centrul Side. Plaja lungă de nisip, cu intrare lină în apă, este apreciată mai ales de familiile cu copii mici — apa rămâne la înălțimea taliei chiar și departe de mal. De-a lungul țărmului se înșiră resorturi mari all inclusive precum Trendy Verbena, Alba Queen, Adalya Elite și Sunis Elita. Çolaklı este alegerea celor care vor litoralul Side fără aglomerația și viața de noapte de acolo, în timp ce teatrul antic și Templul lui Apollo sunt la doar zece minute. Hotelurile se află retrase față de șoseaua de coastă D400 și aproape unul de altul, iar indicatoarele se confundă ușor; un șofer privat vă duce direct la intrarea hotelului dumneavoastră, fără opriri la celelalte resorturi de pe traseu. TORVIAN: transfer privat de la aeroport, preț fix pe vehicul, întâmpinare cu plăcuță, monitorizarea zborului, 24/7.$ro$,

  description_ar = $ar$تشولاكلي قرية ساحلية تبعد نحو 56 كيلومترًا عن مطار أنطاليا (AYT) وحوالي 48 دقيقة بالنقل الخاص، وتقع بين بوغازكنت وسيدي، على بعد نحو 8 كيلومترات غرب مركز سيدي. يجذب شاطئها الرملي الطويل ذو الانحدار اللطيف العائلات التي لديها أطفال صغار على وجه الخصوص، إذ يبقى الماء بعمق الوقوف لمسافة بعيدة عن الشاطئ. تصطف على الساحل منتجعات شاملة كبيرة مثل تريندي فيربينا وألبا كوين وأداليا إيليت وسونيس إيليتا. تشولاكلي خيار من يريد ساحل سيدي دون زحامها وحياتها الليلية، بينما يبقى المسرح الأثري ومعبد أبولو على بعد عشر دقائق فقط. تقع الفنادق متجاورة وبعيدًا قليلًا عن طريق الساحل D400، ومن السهل الخلط بين اللافتات؛ يوصلك السائق الخاص إلى مدخل فندقك مباشرة بدل التوقف عند كل منتجع في الطريق. تورفيان: نقل خاص من المطار، سعر ثابت للمركبة، استقبال بلافتة الاسم، متابعة حية للرحلة، على مدار الساعة.$ar$
WHERE slug = 'colakli';

-- ---------------------------------------------
-- 4. ÇIRALI
-- ---------------------------------------------
UPDATE regions SET
  description_ru = $ru$Чиралы — пляжная деревня примерно в 88 км от аэропорта Антальи (AYT) и около 1 часа 22 минут на индивидуальном трансфере, между Текировой и Адрасаном. Её трёхкилометровый галечный пляж — охраняемое место гнездования черепах логгерхед, поэтому вдоль берега нет высотных зданий, а ночью пляж не освещают. Здесь останавливаются не в больших отелях, а в маленьких пансионах и бунгало, разбросанных среди апельсиновых садов. На одном краю пляжа лежат руины и ущелье античного Олимпоса, а на склоне выше горят огни Химеры — природный газ, выходящий из скалы и воспламеняющийся сам собой; оба места в пешей доступности. Чиралы находится в конце узкой извилистой дороги, уходящей от прибрежного шоссе, а общественный транспорт здесь ограничен: индивидуальный трансфер тут не удобство, а фактически единственный разумный способ добраться. TORVIAN: индивидуальный трансфер из аэропорта, фиксированная цена за автомобиль, встреча с табличкой, отслеживание рейса, 24/7.$ru$,

  description_nl = $nl$Çıralı is een stranddorp op ongeveer 88 km van de luchthaven Antalya (AYT) en zo'n 1 uur 22 minuten met een privétransfer, gelegen tussen Tekirova en Adrasan. Het drie kilometer lange kiezelstrand is beschermd broedgebied van de onechte karetschildpad; daarom staan er geen hoogbouw langs en blijft het strand 's nachts onverlicht. Overnachten doet u niet in grote hotels maar in kleine pensions en bungalows verspreid tussen de sinaasappelgaarden. Aan het ene eind van het strand liggen de ruïnes en de kloof van het antieke Olympos; op de helling erboven branden de Chimaera-vlammen, aardgas dat uit de rots ontsnapt en vanzelf ontvlamt — beide op loopafstand. Çıralı ligt aan het eind van een smalle, bochtige weg vanaf de kustweg en het openbaar vervoer is beperkt, waardoor een privétransfer hier minder een gemak is dan de enige praktische manier om er te komen. TORVIAN: privétransfer vanaf de luchthaven, vaste prijs per voertuig, ontvangst met naambord, live vluchtopvolging, 24/7.$nl$,

  description_ro = $ro$Çıralı este un sat de plajă aflat la circa 88 km de Aeroportul Antalya (AYT) și la aproximativ 1 oră și 22 de minute cu transfer privat, între Tekirova și Adrasan. Plaja sa de pietriș, lungă de trei kilometri, este sit protejat de cuibărit pentru broaștele-țestoase Caretta caretta — de aceea nu există clădiri înalte de-a lungul ei, iar noaptea plaja nu este iluminată. Cazarea nu înseamnă hoteluri mari, ci pensiuni mici și bungalouri risipite printre livezile de portocali. La un capăt al plajei se află ruinele și cheile anticului Olympos, iar pe versantul de deasupra ard flăcările Chimerei — gaz natural care iese din stâncă și se aprinde de la sine; ambele la o plimbare distanță. Çıralı se află la capătul unui drum îngust și șerpuit care se desprinde din șoseaua de coastă, iar transportul public este limitat, așa că aici transferul privat nu este un moft, ci practic singura cale rezonabilă de a ajunge. TORVIAN: transfer privat de la aeroport, preț fix pe vehicul, întâmpinare cu plăcuță, monitorizarea zborului, 24/7.$ro$,

  description_ar = $ar$تشيرالي قرية شاطئية تبعد نحو 88 كيلومترًا عن مطار أنطاليا (AYT) وحوالي ساعة و22 دقيقة بالنقل الخاص، وتقع بين تكيروفا وأدراسان. شاطئها الحصوي الممتد ثلاثة كيلومترات موقع محمي لتعشيش السلاحف ضخمة الرأس، ولذلك لا توجد مبانٍ عالية على امتداده ولا إضاءة على الرمال ليلًا. الإقامة هنا ليست في فنادق كبيرة بل في بيوت ضيافة صغيرة وأكواخ متناثرة بين بساتين البرتقال. عند أحد طرفي الشاطئ تقع أطلال مدينة أوليمبوس القديمة وواديها، وعلى المنحدر فوقها تشتعل نيران الشيميرا: غاز طبيعي يتسرب من الصخر ويشتعل من تلقاء نفسه، وكلاهما على مسافة قريبة سيرًا. تقع تشيرالي في نهاية طريق ضيق متعرج يتفرع عن طريق الساحل، والنقل العام محدود، لذا فإن النقل الخاص هنا ليس رفاهية بل الوسيلة العملية الوحيدة للوصول. تورفيان: نقل خاص من المطار، سعر ثابت للمركبة، استقبال بلافتة الاسم، متابعة حية للرحلة، على مدار الساعة.$ar$
WHERE slug = 'cirali';

-- ---------------------------------------------
-- 5. KUMLUCA
-- ---------------------------------------------
UPDATE regions SET
  description_ru = $ru$Кумлуджа — районный центр на западном побережье Антальи, примерно в 108 км от аэропорта Антальи (AYT) и около 1 часа 35 минут на индивидуальном трансфере. Это центр тепличного хозяйства Турции, и километры теплиц вдоль дороги к городу говорят о местной экономике почти всё. Для путешественников Кумлуджа — прежде всего ворота и город услуг: отсюда расходятся дороги на Олимпос, Чиралы, Адрасан и бухты Караёз, а в центре есть банки, больница, супермаркеты и еженедельный рынок. Через район проходят одни из красивейших участков Ликийской тропы, а пляжи Караёз и Мавикент — тихие полосы, которые любят те, кто путешествует с палаткой или автодомом. Дорога сюда горная и извилистая, а вечером общественный транспорт редеет: индивидуальный трансфер — самый надёжный способ доехать до дверей, не следя за расписанием. TORVIAN: индивидуальный трансфер из аэропорта, фиксированная цена за автомобиль, встреча с табличкой, отслеживание рейса, 24/7.$ru$,

  description_nl = $nl$Kumluca is een districtsstad aan de westkust van Antalya, ongeveer 108 km van de luchthaven Antalya (AYT) en zo'n 1 uur 35 minuten met een privétransfer. Het is het centrum van de Turkse kastuinbouw, en de kilometers glasopstanden langs de toegangsweg vertellen vrijwel alles over de lokale economie. Voor reizigers is Kumluca vooral een poort en een voorzieningenstad: de wegen naar Olympos, Çıralı, Adrasan en de baaien van Karaöz takken hier af, en in het centrum zijn banken, een ziekenhuis, supermarkten en een weekmarkt. Enkele van de mooiste etappes van het Lycische Pad lopen door het district, en de stranden van Karaöz en Mavikent zijn rustige stroken die geliefd zijn bij kampeerders en campers. De weg erheen is bergachtig en bochtig en het openbaar vervoer wordt 's avonds dun, waardoor een privétransfer de veiligste manier is om zonder op de klok te kijken tot aan de deur te komen. TORVIAN: privétransfer vanaf de luchthaven, vaste prijs per voertuig, ontvangst met naambord, live vluchtopvolging, 24/7.$nl$,

  description_ro = $ro$Kumluca este un oraș de reședință de district pe coasta de vest a provinciei Antalya, la circa 108 km de Aeroportul Antalya (AYT) și la aproximativ 1 oră și 35 de minute cu transfer privat. Este centrul culturii în sere din Turcia, iar kilometrii de sere de-a lungul drumului de acces spun aproape tot ce trebuie știut despre economia locală. Pentru vizitatori, Kumluca este în primul rând o poartă de acces și un oraș de servicii: de aici pornesc drumurile spre Olympos, Çıralı, Adrasan și golfulețele Karaöz, iar în centru sunt bănci, un spital, supermarketuri și un târg săptămânal. Prin district trec unele dintre cele mai frumoase etape ale Drumului Licyan, iar plajele de la Karaöz și Mavikent sunt fâșii liniștite, preferate de cei cu cortul sau cu rulota. Drumul până aici este montan și șerpuit, iar seara transportul public se rărește, așa că transferul privat este cea mai sigură cale de a ajunge la ușă fără să te uiți la ceas. TORVIAN: transfer privat de la aeroport, preț fix pe vehicul, întâmpinare cu plăcuță, monitorizarea zborului, 24/7.$ro$,

  description_ar = $ar$كوملوجا مركز قضاء على الساحل الغربي لأنطاليا، يبعد نحو 108 كيلومترات عن مطار أنطاليا (AYT) وحوالي ساعة و35 دقيقة بالنقل الخاص. وهي مركز الزراعة المحمية في تركيا، وكيلومترات البيوت الزجاجية على طول طريق الوصول تقول معظم ما يلزم معرفته عن اقتصاد المنطقة. بالنسبة للزائرين، كوملوجا بوابة ومدينة خدمات في المقام الأول: من هنا تتفرع الطرق إلى أوليمبوس وتشيرالي وأدراسان وخلجان كارا أوز، وفي المركز مصارف ومستشفى ومتاجر كبرى وسوق أسبوعية. تمر عبر القضاء بعض أجمل مراحل طريق ليكيا، وشواطئ كارا أوز ومافي كنت امتدادات هادئة يفضلها محبو التخييم والمنازل المتنقلة. الطريق إليها جبلي متعرج، والنقل العام يتناقص مساءً، لذا يبقى النقل الخاص أأمن وسيلة للوصول إلى الباب دون مراقبة الساعة. تورفيان: نقل خاص من المطار، سعر ثابت للمركبة، استقبال بلافتة الاسم، متابعة حية للرحلة، على مدار الساعة.$ar$
WHERE slug = 'kumluca';

-- ---------------------------------------------
-- 6. FİNİKE
-- ---------------------------------------------
UPDATE regions SET
  description_ru = $ru$Финике — прибрежный район между Кумлуджей и Демре, примерно в 125 км от аэропорта Антальи (AYT) и около 1 часа 48 минут на индивидуальном трансфере. В Турции его название неотделимо от апельсинов, и зимой, в сезон сбора, цитрусовые сады вокруг города наполняют его своим запахом. Марина Setur Finike — зимняя стоянка для яхт, идущих по Средиземному морю, и большую часть года она придаёт набережной спокойный морской характер. Античный город Ариканда лежит примерно в получасе вверх по горной дороге и считается одним из лучше всего сохранившихся поселений Ликии. Финике никогда не открывали для массового туризма: вместо больших курортов здесь маленькие отели, длинные пустые галечные пляжи и городок, живущий своей жизнью. Дорога из аэропорта идёт через горы, а вечером автобусных вариантов становится мало: на таком расстоянии индивидуальный трансфер — самое простое решение. TORVIAN: индивидуальный трансфер из аэропорта, фиксированная цена за автомобиль, встреча с табличкой, отслеживание рейса, 24/7.$ru$,

  description_nl = $nl$Finike is een kustdistrict tussen Kumluca en Demre, ongeveer 125 km van de luchthaven Antalya (AYT) en zo'n 1 uur 48 minuten met een privétransfer. In Turkije is de naam synoniem met sinaasappels, en in de winter geuren de citrusgaarden rond de stad tijdens de oogst door de hele plaats. Setur Finike Marina is een overwinteringshaven voor jachten die de Middellandse Zee bevaren en geeft de boulevard een groot deel van het jaar een rustig, maritiem karakter. De antieke stad Arykanda ligt ongeveer een halfuur de bergweg op en geldt als een van de best bewaarde nederzettingen van Lycië. Finike is nooit voor massatoerisme ontsloten: in plaats van grote resorts zijn er kleine hotels, lange lege kiezelstranden en een stadscentrum dat zijn eigen gang gaat. De rit vanaf de luchthaven voert over bergwegen en de busverbindingen worden 's avonds schaars, dus op deze afstand is een privétransfer veruit het eenvoudigste antwoord. TORVIAN: privétransfer vanaf de luchthaven, vaste prijs per voertuig, ontvangst met naambord, live vluchtopvolging, 24/7.$nl$,

  description_ro = $ro$Finike este un district de coastă între Kumluca și Demre, la circa 125 km de Aeroportul Antalya (AYT) și la aproximativ 1 oră și 48 de minute cu transfer privat. În Turcia numele său este sinonim cu portocalele, iar iarna, în perioada recoltei, livezile de citrice din jurul orașului îi dau parfumul lor întregii localități. Setur Finike Marina este port de iernare pentru iahturile care străbat Mediterana și dă falezei, mare parte din an, un caracter liniștit, marinăresc. Orașul antic Arykanda se află la vreo jumătate de oră pe drumul de munte și este considerat una dintre cele mai bine păstrate așezări din Licia. Finike nu a fost niciodată deschis turismului de masă: în locul resorturilor mari sunt hoteluri mici, plaje lungi și goale de pietriș și un centru care își vede de treburile lui. Drumul de la aeroport trece prin munți, iar seara opțiunile de autobuz se împuținează, așa că la această distanță transferul privat este de departe soluția cea mai simplă. TORVIAN: transfer privat de la aeroport, preț fix pe vehicul, întâmpinare cu plăcuță, monitorizarea zborului, 24/7.$ro$,

  description_ar = $ar$فينيكه قضاء ساحلي يقع بين كوملوجا وديمره، على بعد نحو 125 كيلومترًا من مطار أنطاليا (AYT) وحوالي ساعة و48 دقيقة بالنقل الخاص. اسمها في تركيا مرادف للبرتقال، وفي الشتاء تفوح رائحة بساتين الحمضيات المحيطة بالمدينة في أنحائها كلها موسم الحصاد. مرسى سيتور فينيكه ميناء شتوي لليخوت الجائلة في البحر المتوسط، ويمنح الواجهة البحرية طابعًا بحريًا هادئًا معظم أيام السنة. تقع مدينة أريكاندا الأثرية على بعد نصف ساعة صعودًا في الطريق الجبلي، وتُعد من أفضل مستوطنات ليكيا حفظًا. لم تُفتح فينيكه يومًا للسياحة الجماعية: فبدل المنتجعات الكبيرة هناك فنادق صغيرة وشواطئ حصوية طويلة خالية ومركز مدينة يمضي في شؤونه الخاصة. الطريق من المطار يمر بدروب جبلية، وخيارات الحافلات تقل مساءً، لذا يبقى النقل الخاص على هذه المسافة أيسر حل بفارق واضح. تورفيان: نقل خاص من المطار، سعر ثابت للمركبة، استقبال بلافتة الاسم، متابعة حية للرحلة، على مدار الساعة.$ar$
WHERE slug = 'finike';

-- ---------------------------------------------
-- 7. DEMRE
-- ---------------------------------------------
UPDATE regions SET
  description_ru = $ru$Демре — район между Финике и Кашем, примерно в 152 км от аэропорта Антальи (AYT) и около 2 часов 12 минут на индивидуальном трансфере. Святой Николай — реальный человек, стоящий за образом Деда Мороза, — был здесь епископом в четвёртом веке; носящая его имя церковь стоит в центре города и привлекает гостей со всего мира. Прямо рядом лежит античная Мира с ликийскими гробницами, вырубленными в скале, и на удивление хорошо сохранившимся театром. Из гавани Андриаке на побережье уходят лодки к затонувшему городу Кекова, ушедшему под воду после землетрясения, — самая известная экскурсия региона. Сам Демре не курорт, а работящий городок, живущий своими теплицами; останавливаются здесь в маленьких отелях и пансионах. Дорога из аэропорта длинная и горная, а поездка на автобусах с пересадками занимает больше трёх часов: на таком расстоянии индивидуальный трансфер даёт заметную разницу и во времени, и в усталости. TORVIAN: индивидуальный трансфер из аэропорта, фиксированная цена за автомобиль, встреча с табличкой, отслеживание рейса, 24/7.$ru$,

  description_nl = $nl$Demre is een district tussen Finike en Kaş, ongeveer 152 km van de luchthaven Antalya (AYT) en zo'n 2 uur 12 minuten met een privétransfer. Sint-Nicolaas — de werkelijke persoon achter de kerstman — was hier in de vierde eeuw bisschop, en de naar hem genoemde kerk staat in het centrum en trekt bezoekers van over de hele wereld. Pal ernaast ligt het antieke Myra, met Lycische graven uitgehakt in de rotswand en een opmerkelijk goed bewaard theater. Vanuit de haven van Andriake aan de kust varen boten naar de gezonken stad Kekova, door een aardbeving onder water verdwenen en de bekendste excursie van de streek. Demre zelf is geen badplaats maar een werkende stad die van haar kassen leeft; overnachten doet u in kleine hotels en pensions. De rit vanaf de luchthaven is lang en bergachtig en de busreis met overstappen duurt ruim drie uur, dus op deze afstand maakt een privétransfer een echt verschil in tijd en vermoeidheid. TORVIAN: privétransfer vanaf de luchthaven, vaste prijs per voertuig, ontvangst met naambord, live vluchtopvolging, 24/7.$nl$,

  description_ro = $ro$Demre este un district între Finike și Kaș, la circa 152 km de Aeroportul Antalya (AYT) și la aproximativ 2 ore și 12 minute cu transfer privat. Sfântul Nicolae — persoana reală din spatele lui Moș Crăciun — a fost episcop aici în secolul al patrulea, iar biserica ce îi poartă numele se află în centrul orașului și atrage vizitatori din toată lumea. Imediat alături se întinde anticul Myra, cu mormintele licyene săpate în peretele de stâncă și un teatru remarcabil de bine păstrat. Din portul Andriake de pe coastă pleacă bărci spre orașul scufundat Kekova, lăsat sub apă de un cutremur — cea mai cunoscută excursie din regiune. Demre însuși nu este o stațiune, ci un orășel muncitor care trăiește din serele sale; cazarea înseamnă hoteluri mici și pensiuni. Drumul de la aeroport este lung și montan, iar călătoria cu autobuzul și schimbări depășește trei ore, așa că la această distanță transferul privat face o diferență reală atât ca timp, cât și ca oboseală. TORVIAN: transfer privat de la aeroport, preț fix pe vehicul, întâmpinare cu plăcuță, monitorizarea zborului, 24/7.$ro$,

  description_ar = $ar$ديمره قضاء يقع بين فينيكه وكاش، على بعد نحو 152 كيلومترًا من مطار أنطاليا (AYT) وحوالي ساعتين و12 دقيقة بالنقل الخاص. كان القديس نيقولاوس، الشخصية الحقيقية وراء بابا نويل، أسقفًا هنا في القرن الرابع، والكنيسة التي تحمل اسمه تقوم في مركز المدينة وتجتذب زوارًا من أنحاء العالم. وإلى جوارها مباشرة تمتد مدينة ميرا الأثرية بمدافنها الليكية المنحوتة في جدار الصخر ومسرحها المحفوظ بدرجة لافتة. ومن ميناء أندرياكي على الساحل تنطلق القوارب إلى مدينة كيكوفا الغارقة التي أغرقها زلزال، وهي أشهر رحلات المنطقة. أما ديمره نفسها فليست منتجعًا بل بلدة عاملة تعيش من بيوتها المحمية، والإقامة فيها في فنادق صغيرة وبيوت ضيافة. الطريق من المطار طويل وجبلي، ورحلة الحافلة بتبديلاتها تتجاوز ثلاث ساعات، لذا يُحدث النقل الخاص على هذه المسافة فرقًا حقيقيًا في الوقت والإرهاق معًا. تورفيان: نقل خاص من المطار، سعر ثابت للمركبة، استقبال بلافتة الاسم، متابعة حية للرحلة، على مدار الساعة.$ar$
WHERE slug = 'demre';

-- ---------------------------------------------
-- 8. AVSALLAR — 085'in açık bıraktığı dört dil
-- ---------------------------------------------
UPDATE regions SET
  description_ru = $ru$Авсаллар — прибрежный городок примерно в 105 км от аэропорта Антальи (AYT) и около 1 часа 35 минут на индивидуальном трансфере, расположенный между Окурджаларом и Тюрклером, приблизительно в 25 км западнее центра Аланьи. На его побережье лежит Инджекум — длинный пляж с мелким песком, за которым начинается сосновый лес, и ряд крупных отелей «всё включено»: Granada Luxury Beach, Long Beach Resort, Rubi Platinum, Azura Deluxe. В отличие от соседних участков, состоящих из одних отелей, Авсаллар — настоящий городок со своими магазинами, ресторанами и еженедельным рынком, так что выйти за пределы отеля здесь не значит ехать на автобусе в Аланью. Отели растянуты вдоль прибрежного шоссе D400, и личный водитель довезёт вас прямо ко входу вашего отеля, не останавливаясь у всех остальных по пути. TORVIAN: индивидуальный трансфер из аэропорта, фиксированная цена за автомобиль, встреча с табличкой, отслеживание рейса, 24/7.$ru$,

  description_nl = $nl$Avsallar is een kustplaats op ongeveer 105 km van de luchthaven Antalya (AYT) en zo'n 1 uur 35 minuten met een privétransfer, gelegen tussen Okurcalar en Türkler, ruwweg 25 km ten westen van het centrum van Alanya. Aan de kustlijn ligt İncekum, een lang strand met fijn zand en dennenbos erachter, met daarlangs een rij grote allesinclusiveresorts als Granada Luxury Beach, Long Beach Resort, Rubi Platinum en Azura Deluxe. Anders dan de nabijgelegen stroken die enkel uit hotels bestaan, is Avsallar ook een echte plaats, met eigen winkels, restaurants en een weekmarkt: buiten het resort komen betekent hier niet meteen een bus naar Alanya. De hotels liggen verspreid langs de kustweg D400, en een privéchauffeur brengt u rechtstreeks naar uw hotelingang in plaats van onderweg bij elk resort te stoppen. TORVIAN: privétransfer vanaf de luchthaven, vaste prijs per voertuig, ontvangst met naambord, live vluchtopvolging, 24/7.$nl$,

  description_ro = $ro$Avsallar este un orășel de coastă aflat la circa 105 km de Aeroportul Antalya (AYT) și la aproximativ 1 oră și 35 de minute cu transfer privat, între Okurcalar și Türkler, la vreo 25 km vest de centrul Alanyei. Pe litoralul său se întinde İncekum, o plajă lungă cu nisip fin în spatele căreia începe pădurea de pini, alături de un șir de resorturi mari all inclusive precum Granada Luxury Beach, Long Beach Resort, Rubi Platinum și Azura Deluxe. Spre deosebire de fâșiile din jur alcătuite numai din hoteluri, Avsallar este și un orășel adevărat, cu magazinele, restaurantele și târgul lui săptămânal, așa că a ieși din resort nu înseamnă aici să iei autobuzul până în Alanya. Hotelurile sunt răspândite de-a lungul șoselei de coastă D400, iar un șofer privat vă duce direct la intrarea hotelului, fără opriri la celelalte unități de pe traseu. TORVIAN: transfer privat de la aeroport, preț fix pe vehicul, întâmpinare cu plăcuță, monitorizarea zborului, 24/7.$ro$,

  description_ar = $ar$أفسلار بلدة ساحلية تبعد نحو 105 كيلومترات عن مطار أنطاليا (AYT) وحوالي ساعة و35 دقيقة بالنقل الخاص، وتقع بين أوكورجالار وتوركلر، على بعد نحو 25 كيلومترًا غرب مركز ألانيا. يضم ساحلها شاطئ إينجه كوم، وهو شاطئ طويل برمال ناعمة تسنده غابة صنوبر، وإلى جانبه صف من المنتجعات الشاملة الكبيرة مثل غرناطة لاكشري بيتش ولونغ بيتش ريزورت وروبي بلاتينيوم وأزورا ديلوكس. وعلى خلاف الامتدادات المجاورة المكوّنة من فنادق فحسب، فإن أفسلار بلدة حقيقية أيضًا، لها متاجرها ومطاعمها وسوقها الأسبوعية، فالخروج من المنتجع هنا لا يعني ركوب حافلة إلى ألانيا. تتوزع الفنادق على امتداد طريق الساحل D400، ويوصلك السائق الخاص إلى مدخل فندقك مباشرة بدل التوقف عند كل منتجع في الطريق. تورفيان: نقل خاص من المطار، سعر ثابت للمركبة، استقبال بلافتة الاسم، متابعة حية للرحلة، على مدار الساعة.$ar$
WHERE slug = 'avsallar';

-- ---------------------------------------------
-- 9. KONAKLI — 085'in açık bıraktığı dört dil
-- ---------------------------------------------
UPDATE regions SET
  description_ru = $ru$Конаклы — курортный посёлок примерно в 118 км от аэропорта Антальи (AYT) и около 1 часа 45 минут на индивидуальном трансфере, расположенный между Тюрклером и Аланьей, примерно в 10 км западнее центра Аланьи. Вдоль всего посёлка тянется длинный пляж с отелями любого размера; среди самых известных — Royal Garden Beach, Club Dizalya, Titan Select и Miarosa Konaklı Garden. Конаклы — не просто гостиничная полоса: у него есть собственный центр с магазинами, кафе, ресторанами и еженедельным рынком, а крепость Аланьи, порт и пляж Клеопатры — в нескольких минутах на машине или долмуше. Именно это сочетание — более спокойная база у моря и город под рукой — и заставляет многих выбирать Конаклы вместо самой Аланьи. TORVIAN: индивидуальный трансфер из аэропорта, фиксированная цена за автомобиль, встреча с табличкой, отслеживание рейса, 24/7.$ru$,

  description_nl = $nl$Konaklı is een badplaats op ongeveer 118 km van de luchthaven Antalya (AYT) en zo'n 1 uur 45 minuten met een privétransfer, gelegen tussen Türkler en Alanya, ongeveer 10 km ten westen van het centrum van Alanya. Over de volle lengte van de plaats loopt een lang strand met hotels van elk formaat — tot de bekendste behoren Royal Garden Beach, Club Dizalya, Titan Select en Miarosa Konaklı Garden. Konaklı is meer dan een hotelstrook: het heeft een eigen centrum met winkels, cafés, restaurants en een weekmarkt, terwijl de burcht, de haven en het Cleopatrastrand van Alanya op een korte rit met auto of dolmuş liggen. Juist die combinatie — een rustiger uitvalsbasis aan zee met de stad binnen handbereik — is voor veel vakantiegangers de reden om in Konaklı te verblijven in plaats van in Alanya zelf. TORVIAN: privétransfer vanaf de luchthaven, vaste prijs per voertuig, ontvangst met naambord, live vluchtopvolging, 24/7.$nl$,

  description_ro = $ro$Konaklı este o stațiune aflată la circa 118 km de Aeroportul Antalya (AYT) și la aproximativ 1 oră și 45 de minute cu transfer privat, între Türkler și Alanya, la vreo 10 km vest de centrul Alanyei. O plajă lungă se întinde pe toată lungimea localității, mărginită de hoteluri de toate mărimile — printre cele mai cunoscute sunt Royal Garden Beach, Club Dizalya, Titan Select și Miarosa Konaklı Garden. Konaklı este mai mult decât o fâșie de hoteluri: are propriul centru cu magazine, cafenele, restaurante și un târg săptămânal, în timp ce cetatea, portul și Plaja Cleopatrei din Alanya sunt la o scurtă cursă cu mașina sau cu dolmușul. Tocmai această combinație — o bază mai liniștită la mare, cu orașul la îndemână — îi face pe mulți vizitatori să aleagă Konaklı în locul Alanyei propriu-zise. TORVIAN: transfer privat de la aeroport, preț fix pe vehicul, întâmpinare cu plăcuță, monitorizarea zborului, 24/7.$ro$,

  description_ar = $ar$كوناكلي بلدة سياحية تبعد نحو 118 كيلومترًا عن مطار أنطاليا (AYT) وحوالي ساعة و45 دقيقة بالنقل الخاص، وتقع بين توركلر وألانيا، على بعد نحو 10 كيلومترات غرب مركز ألانيا. يمتد على طول البلدة شاطئ طويل تصطف عليه فنادق من كل الأحجام، ومن أشهرها رويال غاردن بيتش وكلوب ديزاليا وتيتان سيليكت ومياروزا كوناكلي غاردن. وكوناكلي أكثر من مجرد شريط فنادق: لها مركزها الخاص بمتاجره ومقاهيه ومطاعمه وسوقه الأسبوعية، بينما تبعد قلعة ألانيا ومرفؤها وشاطئ كليوباترا مسافة قصيرة بالسيارة أو الدولموش. وهذا المزيج تحديدًا، قاعدة أهدأ على البحر والمدينة في المتناول، هو ما يدفع كثيرًا من الزوار إلى اختيار كوناكلي بدل الإقامة في ألانيا نفسها. تورفيان: نقل خاص من المطار، سعر ثابت للمركبة، استقبال بلافتة الاسم، متابعة حية للرحلة، على مدار الساعة.$ar$
WHERE slug = 'konakli';

-- ---------------------------------------------
-- 10. GÜVENLİK — sekiz bölgenin sekiz dili de dolu olmalı
--
-- Bir dil boş kalırsa sayfa İngilizceye düşer ve kimse fark etmez; 085'te
-- olan buydu. Burada eksik kalan tek alan transaction'ı düşürür.
-- ---------------------------------------------
DO $$
DECLARE eksik TEXT;
BEGIN
  SELECT string_agg(slug || ' (' || nerede || ')', ', ' ORDER BY slug) INTO eksik
  FROM (
    SELECT r.slug,
           concat_ws(' ',
             CASE WHEN coalesce(r.description_tr,'') = '' THEN 'tr' END,
             CASE WHEN coalesce(r.description_en,'') = '' THEN 'en' END,
             CASE WHEN coalesce(r.description_de,'') = '' THEN 'de' END,
             CASE WHEN coalesce(r.description_pl,'') = '' THEN 'pl' END,
             CASE WHEN coalesce(r.description_ru,'') = '' THEN 'ru' END,
             CASE WHEN coalesce(r.description_nl,'') = '' THEN 'nl' END,
             CASE WHEN coalesce(r.description_ro,'') = '' THEN 'ro' END,
             CASE WHEN coalesce(r.description_ar,'') = '' THEN 'ar' END,
             CASE WHEN coalesce(r.name_ar,'')        = '' THEN 'name_ar' END
           ) AS nerede
    FROM regions r
    WHERE r.slug IN ('konyaalti','colakli','cirali','kumluca','finike','demre',
                     'avsallar','konakli')
  ) x
  WHERE nerede <> '';

  IF eksik IS NOT NULL THEN
    RAISE EXCEPTION 'Bu bölgelerde metin eksik: %. Hiçbir şey yazılmadı.', eksik;
  END IF;
END $$;

COMMIT;

-- ---------------------------------------------
-- KONTROL — sekiz satır, hepsinde diller = 8 ve durum = 'ok'
--
-- Sekizden küçük bir sayı, o bölgenin eksik dildeki sayfasının İngilizce
-- metin sunduğu anlamına gelir.
-- ---------------------------------------------
SELECT
  r.slug,
  r.name_ar                                        AS arapca_ad,
  (CASE WHEN coalesce(r.description_tr,'')<>'' THEN 1 ELSE 0 END
 + CASE WHEN coalesce(r.description_en,'')<>'' THEN 1 ELSE 0 END
 + CASE WHEN coalesce(r.description_de,'')<>'' THEN 1 ELSE 0 END
 + CASE WHEN coalesce(r.description_pl,'')<>'' THEN 1 ELSE 0 END
 + CASE WHEN coalesce(r.description_ru,'')<>'' THEN 1 ELSE 0 END
 + CASE WHEN coalesce(r.description_nl,'')<>'' THEN 1 ELSE 0 END
 + CASE WHEN coalesce(r.description_ro,'')<>'' THEN 1 ELSE 0 END
 + CASE WHEN coalesce(r.description_ar,'')<>'' THEN 1 ELSE 0 END) AS diller,
  CASE WHEN coalesce(r.name_ar,'') = '' THEN 'HATA: arapça ad yok'
       WHEN coalesce(r.description_ar,'') = '' THEN 'HATA: arapça metin yok'
       ELSE 'ok' END                               AS durum
FROM regions r
WHERE r.slug IN ('konyaalti','colakli','cirali','kumluca','finike','demre',
                 'avsallar','konakli')
ORDER BY r.slug;
