-- Keep the high-impression Side article's SERP metadata aligned with the
-- current Side region record and the article body: 65 km, about 55 minutes.
UPDATE blog_posts
SET
  title_tr = $$Antalya Havalimanı (AYT) Side Arası Kaç Km? 65 km, 55 Dk$$,
  excerpt_tr = $$Antalya Havalimanı ile Side arası 65 km, özel transferle yaklaşık 55 dakika. Evrenseki, Çolaklı, Kızılağaç ve Manavgat mesafeleri ile ulaşım seçenekleri.$$,
  title_en = $$Antalya Airport to Side: Distance 65 km, 55 Minutes$$,
  excerpt_en = $$Antalya Airport (AYT) to Side is 65 km, about 55 minutes by private transfer. Distances to Evrenseki, Çolaklı, Kızılağaç and Manavgat, plus travel options.$$,
  title_de = $$Entfernung Flughafen Antalya – Side: 65 km, ca. 55 Minuten$$,
  excerpt_de = $$Vom Flughafen Antalya nach Side sind es 65 km, etwa 55 Minuten Fahrt. Entfernungen nach Evrenseki, Çolaklı, Kızılağaç und Manavgat sowie Transferoptionen.$$,
  title_pl = $$Side – odległość od lotniska Antalya: 65 km, 55 minut$$,
  excerpt_pl = $$Z lotniska Antalya do Side jest 65 km, czyli około 55 minut jazdy. Odległości do Evrenseki, Çolaklı, Kızılağaç i Manavgat oraz opcje dojazdu.$$,
  title_ru = $$Расстояние от аэропорта Антальи до Сиде: 65 км, 55 минут$$,
  excerpt_ru = $$От аэропорта Антальи до Сиде 65 км — около 55 минут на частном трансфере. Расстояния до Эвренсеки, Чолаклы, Кызылагача и Манавгата, а также варианты поездки.$$,
  title_nl = $$Afstand luchthaven Antalya – Side: 65 km, ca. 55 minuten$$,
  excerpt_nl = $$Van luchthaven Antalya naar Side is het 65 km, ongeveer 55 minuten met een prive-transfer. Afstanden naar Evrenseki, Çolaklı, Kızılağaç en Manavgat en reismogelijkheden.$$,
  primary_region_slug = COALESCE(primary_region_slug, 'side'),
  updated_at = NOW()
WHERE slug = 'antalya-side-transfer-mesafe-sure';