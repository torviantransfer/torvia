-- 039: Readable blog URLs in every language
--
-- Turkish slugs stay untouched (slug_tr is left NULL, so the shared `slug`
-- keeps serving /tr/ — those URLs are already correct and already ranking).
-- Only en/de/pl/ru/nl get their own slug.
--
-- Keywords are taken from the site's own Search Console query export
-- (Apr–Jul 2026), not invented — e.g. the German column for the Kemer
-- distance post uses "entfernung flughafen antalya kemer" because that is
-- the phrasing German users actually typed.
--
-- Old URLs do NOT break: src/app/[locale]/blog/[slug]/page.tsx resolves a post
-- by ANY of its slugs and then issues a 301 to the locale's own slug, so
-- ranking signals transfer instead of dropping.
--
-- Safe to re-run.

UPDATE blog_posts AS b
SET slug_en = v.slug_en,
    slug_de = v.slug_de,
    slug_pl = v.slug_pl,
    slug_ru = v.slug_ru,
    slug_nl = v.slug_nl
FROM (VALUES
  -- shared slug (identifier)                       | en                                        | de                                          | pl                                             | ru                                                | nl
  ('uber-antalya-havalimani-ulasim',                 'is-uber-available-antalya-airport',         'gibt-es-uber-in-antalya',                    'czy-uber-dziala-w-antalyi',                     'rabotaet-li-uber-v-antalii',                       'werkt-uber-in-antalya'),
  ('antalya-havalimani-alanya-transfer-kac-saat',    'antalya-airport-to-alanya-transfer-time',   'antalya-flughafen-nach-alanya-fahrzeit',     'transfer-lotnisko-antalya-alanya-ile-trwa',     'skolko-ehat-ot-aeroporta-antalii-do-alanii',       'hoe-lang-duurt-transfer-antalya-alanya'),
  ('antalya-alanya-transfer-suresi',                 'antalya-to-alanya-travel-time',             'fahrzeit-antalya-nach-alanya',               'antalya-alanya-czas-przejazdu',                 'antaliya-alaniya-vremya-v-puti',                   'reistijd-antalya-naar-alanya'),
  ('antalya-kemer-transfer-mesafe-sure',             'antalya-airport-to-kemer-distance-time',    'entfernung-flughafen-antalya-kemer',         'antalya-kemer-odleglosc-od-lotniska',           'rasstoyanie-ot-aeroporta-antalii-do-kemera',       'afstand-luchthaven-antalya-kemer'),
  ('antalya-side-transfer-mesafe-sure',              'antalya-airport-to-side-distance-time',     'entfernung-flughafen-antalya-side',          'antalya-side-odleglosc-od-lotniska',            'rasstoyanie-ot-aeroporta-antalii-do-side',         'afstand-luchthaven-antalya-side'),
  ('antalya-belek-transfer-mesafe-sure',             'antalya-airport-to-belek-distance-time',    'entfernung-flughafen-antalya-belek',         'belek-odleglosc-od-lotniska-antalya',           'rasstoyanie-ot-aeroporta-antalii-do-beleka',       'afstand-luchthaven-antalya-belek'),
  ('antalya-havas-mi-vip-transfer-mi',               'havas-shuttle-vs-private-transfer-antalya', 'havas-shuttle-oder-privattransfer-antalya',  'autobus-havas-czy-transfer-prywatny-antalya',   'avtobus-havas-ili-chastnyy-transfer-antaliya',     'havas-shuttle-of-privetransfer-antalya'),
  ('antalya-havalimani-taksi-mi-vip-transfer-mi',    'antalya-airport-taxi-vs-private-transfer',  'antalya-flughafen-taxi-oder-privattransfer', 'taksowka-czy-transfer-prywatny-lotnisko-antalya','taksi-ili-chastnyy-transfer-aeroport-antalii',     'taxi-of-privetransfer-luchthaven-antalya'),
  ('antalya-taksi-mi-ozel-transfer-mi',              'antalya-taxi-vs-private-transfer',          'antalya-taxi-oder-privattransfer',           'antalya-taksowka-czy-transfer-prywatny',        'antaliya-taksi-ili-chastnyy-transfer',             'antalya-taxi-of-privetransfer'),
  ('vip-transfer-mi-shuttle-mi',                     'private-transfer-vs-shuttle-antalya',       'privattransfer-oder-shuttle-antalya',        'transfer-prywatny-czy-shuttle-antalya',         'chastnyy-transfer-ili-shattl-antaliya',            'privetransfer-of-shuttle-antalya'),
  ('land-of-legends-transfer-rehberi',               'land-of-legends-transfer-guide',            'transfer-zum-land-of-legends',               'transfer-do-land-of-legends',                   'transfer-v-land-of-legends',                       'transfer-naar-land-of-legends'),
  ('antalya-havalimani-side-transfer',               'antalya-airport-to-side-transfer',          'transfer-flughafen-antalya-nach-side',       'transfer-lotnisko-antalya-side',                'transfer-aeroport-antalii-side',                   'transfer-luchthaven-antalya-side'),
  ('antalya-havalimani-belek-transfer',              'antalya-airport-to-belek-transfer',         'transfer-flughafen-antalya-nach-belek',      'transfer-lotnisko-antalya-belek',               'transfer-aeroport-antalii-belek',                  'transfer-luchthaven-antalya-belek'),
  ('antalya-havalimani-kemer-transfer',              'antalya-airport-to-kemer-transfer',         'transfer-flughafen-antalya-nach-kemer',      'transfer-lotnisko-antalya-kemer',               'transfer-aeroport-antalii-kemer',                  'transfer-luchthaven-antalya-kemer'),
  ('antalya-havalimani-kemer-vip-transfer',          'antalya-airport-kemer-vip-transfer',        'vip-transfer-flughafen-antalya-kemer',       'transfer-vip-lotnisko-antalya-kemer',           'vip-transfer-aeroport-antalii-kemer',              'vip-transfer-luchthaven-antalya-kemer'),
  ('antalya-havalimani-lara-beach-transfer',         'antalya-airport-to-lara-beach-transfer',    'transfer-flughafen-antalya-lara-beach',      'transfer-lotnisko-antalya-lara-beach',          'transfer-aeroport-antalii-lara-beach',             'transfer-luchthaven-antalya-lara-beach'),
  ('antalya-havalimani-kas-transfer',                'antalya-airport-to-kas-transfer',           'transfer-flughafen-antalya-nach-kas',        'transfer-lotnisko-antalya-kas',                 'transfer-aeroport-antalii-kash',                   'transfer-luchthaven-antalya-kas'),
  ('hotel-transfer-antalya',                         'hotel-transfer-antalya-airport',            'hoteltransfer-flughafen-antalya',            'transfer-do-hotelu-antalya',                    'transfer-do-otelya-antaliya',                      'hoteltransfer-luchthaven-antalya'),
  ('alanya-airport-transfer',                        'is-there-an-airport-in-alanya',             'hat-alanya-einen-flughafen',                 'czy-alanya-ma-lotnisko',                        'est-li-aeroport-v-alanii',                         'heeft-alanya-een-luchthaven'),
  ('antalya-7-24-transfer-hizmeti',                  'antalya-24-7-airport-transfer',             'antalya-24-7-flughafentransfer',             'antalya-transfer-24-7',                         'antaliya-transfer-24-7',                           'antalya-24-7-luchthaventransfer'),
  ('antalya-mercedes-vito-vip-transfer',             'mercedes-vito-vip-transfer-antalya',        'mercedes-vito-vip-transfer-flughafen-antalya','mercedes-vito-transfer-vip-antalya',           'mercedes-vito-vip-transfer-antaliya',              'mercedes-vito-vip-transfer-antalya'),
  ('antalya-havalimani-transfer-rehberi',            'antalya-airport-transfer-guide',            'antalya-flughafentransfer-ratgeber',         'przewodnik-transfer-lotnisko-antalya',          'putevoditel-transfer-aeroport-antalii',            'gids-luchthaventransfer-antalya'),
  ('antalya-havalimani-transfer-fiyatlari',          'antalya-airport-transfer-prices',           'antalya-flughafentransfer-preise',           'ceny-transferu-lotnisko-antalya',               'tseny-transfera-aeroport-antalii',                 'prijzen-luchthaventransfer-antalya'),
  ('side-antik-kent-transfer',                       'side-ancient-city-transfer',                'transfer-zur-antiken-stadt-side',            'transfer-do-starozytnego-side',                 'transfer-v-drevniy-side',                          'transfer-naar-de-oude-stad-side'),
  ('aileler-icin-antalya-transfer-ipuclari',         'antalya-transfer-tips-for-families',        'antalya-transfer-tipps-fuer-familien',       'transfer-antalya-porady-dla-rodzin',            'sovety-po-transferu-antaliya-dlya-semey',          'antalya-transfer-tips-voor-gezinnen'),
  ('aile-cocuk-havalimani-transfer',                 'family-airport-transfer-with-children',     'familien-flughafentransfer-mit-kindern',     'rodzinny-transfer-lotniskowy-z-dziecmi',        'semeynyy-transfer-iz-aeroporta-s-detmi',           'gezinstransfer-luchthaven-met-kinderen'),
  ('kis-antalya-tatil-transfer',                     'winter-holiday-transfer-antalya',           'winterurlaub-transfer-antalya',              'zimowy-urlop-transfer-antalya',                 'zimniy-otdyh-transfer-antaliya',                   'wintervakantie-transfer-antalya'),
  ('belek-golf-otelleri-transfer',                   'belek-golf-hotels-transfer',                'belek-golfhotels-transfer',                  'transfer-do-hoteli-golfowych-belek',            'transfer-v-golf-oteli-beleka',                     'transfer-naar-golfhotels-belek'),
  ('regnum-the-crown-belek-transfer',                'regnum-the-crown-belek-transfer',           'regnum-the-crown-belek-transfer',            'transfer-regnum-the-crown-belek',               'transfer-regnum-the-crown-belek-ru',               'transfer-regnum-the-crown-belek-nl')
) AS v(slug, slug_en, slug_de, slug_pl, slug_ru, slug_nl)
WHERE b.slug = v.slug;

-- Verify: every published post and the URL it will serve per locale.
-- SELECT slug, slug_en, slug_de, slug_pl, slug_ru, slug_nl
--   FROM blog_posts WHERE is_published = true ORDER BY slug;
--
-- Any post NOT listed above keeps the shared slug in every language — that is
-- intentional and harmless, it just means its URL was not worth rewriting.
