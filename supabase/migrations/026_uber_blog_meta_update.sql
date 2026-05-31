-- =============================================
-- TORVIAN TRANSFER — Uber Blog Meta Update
-- Source: Google Search Console (April–May 2026)
-- Problem: blog post ranks but CTR is very low
--   "uber antalya"                    28 impressions, 1 click
--   "does uber work in antalya"       42 impressions, 0 clicks
--   "is there uber in antalya"        35 impressions, 0 clicks
--   "uber in antalya"                 33 impressions, 0 clicks
-- Fix: update title + excerpt to directly answer the question
--   → answer in title = higher CTR
-- =============================================

UPDATE blog_posts SET
  title_en   = 'Does Uber Work in Antalya? 2026 Answer + Best Alternatives',
  title_tr   = 'Antalya''da Uber Var Mı? 2026 Güncel Cevap + Alternatifler',
  title_de   = 'Gibt es Uber in Antalya? 2026 Antwort + beste Alternativen',
  title_pl   = 'Czy Uber działa w Antalyi? Odpowiedź 2026 + Alternatywy',
  title_ru   = 'Работает ли Uber в Анталии? Ответ 2026 + лучшие альтернативы',

  excerpt_en = 'Uber has very limited availability in Antalya in 2026. Best alternatives: BiTaksi, Bolt, and pre-booked private VIP transfer — cheaper and more reliable than airport taxis.',
  excerpt_tr = 'Antalya''da Uber 2026 itibarıyla çok sınırlı hizmet vermektedir. En iyi alternatifler: BiTaksi, Bolt ve önceden rezerve edilmiş VIP özel transfer. Havalimanı taksisinden daha uygun.',
  excerpt_de = 'Uber ist in Antalya 2026 nur sehr eingeschränkt verfügbar. Beste Alternativen: BiTaksi, Bolt und vorgebuchter VIP-Privattransfer — günstiger und zuverlässiger als Flughafentaxis.',
  excerpt_pl = 'Uber w Antalyi w 2026 roku ma bardzo ograniczoną dostępność. Najlepsze alternatywy: BiTaksi, Bolt i prywatny transfer VIP — taniej i pewniej niż taksówka lotniskowa.',
  excerpt_ru = 'Uber в Анталии в 2026 году работает очень ограниченно. Лучшие альтернативы: BiTaksi, Bolt и частный VIP-трансфер — дешевле и надёжнее аэропортового такси.'

WHERE slug = 'uber-antalya-havalimani-ulasim';
