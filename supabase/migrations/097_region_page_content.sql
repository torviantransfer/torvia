-- =============================================
-- 097: Bölge sayfası içeriği panelden
--
-- Otuz bölge sayfası tek şablondan geçiyor; bölgeden bölgeye değişen serbest
-- metin bugüne kadar yalnızca description_* idi. Sayfanın özgünlüğü buradan
-- gelmesi gereken şey, ve her eklemede koda dokunup deploy etmek gerekiyordu.
--
-- Üç yeni sütun, hepsi boşken sayfa bugünkü hâliyle render olur:
--
-- page_content (JSONB)
--   Dil dil içerik. 114 sütunluk tabloya 8 dil × 4 alan daha eklemek yerine tek
--   bir belge. Biçim:
--     {
--       "highlight_images": ["/images/…", "/images/…", "/images/…"],
--       "tr": {
--         "subtitle":   "Hero'daki giriş cümlesi",
--         "about":      "Ek paragraflar — boş satırla ayrılır",
--         "highlights": [{ "title": "…", "description": "…" }, …],
--         "faq":        [{ "question": "…", "answer": "…" }, …]
--       },
--       "de": { … }
--     }
--   Öne çıkanların görseli dilden bağımsız olduğu için bir kez tutulur; metni
--   her dilde ayrıdır. Bir kart ancak o dilde başlığı ve görseli varsa görünür.
--
-- hotels (TEXT[])
--   Otel adları dile göre değişmez, o yüzden dil dışında. NULL = "girilmedi",
--   '{}' = "bilerek boş". Aşağıda bugüne kadar koda gömülü duran dört bölgenin
--   listesi taşınıyor, böylece sayfada hiçbir şey değişmiyor.
--
-- route_name (TEXT)
--   Havalimanından gidilen yol, ör. "D400". Boşsa sayfada gösterilmez.
--
-- Tek transaction, tekrar çalıştırılabilir.
-- =============================================

BEGIN;

ALTER TABLE regions
  ADD COLUMN IF NOT EXISTS page_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hotels       TEXT[],
  ADD COLUMN IF NOT EXISTS route_name   TEXT;

COMMENT ON COLUMN regions.page_content IS
  'Bölge sayfasının panelden düzenlenen dil dil içeriği: subtitle, about, highlights, faq. Biçim için 097 migration başlığına bakın.';
COMMENT ON COLUMN regions.hotels IS
  'Bölge sayfasında listelenen oteller. NULL = girilmedi, boş dizi = bilerek boş.';
COMMENT ON COLUMN regions.route_name IS
  'Havalimanından gidilen yol, ör. D400.';

-- Bugüne kadar src/app/[locale]/[region]/page.tsx içinde gömülü duran liste.
-- Yalnızca henüz girilmemişse yazılır; panelden girilmiş bir listeyi ezmez.
UPDATE regions SET hotels = ARRAY[
  'Aska Lara Resort & Spa', 'Titanic Deluxe Lara', 'Royal Seginus',
  'Titanic Mardan Palace', 'Delphin Imperial', 'Rixos Downtown Antalya'
] WHERE slug = 'kundu-lara' AND hotels IS NULL;

UPDATE regions SET hotels = ARRAY['Rixos Premium Belek', 'Maxx Royal Belek', 'Regnum Carya']
  WHERE slug = 'belek' AND hotels IS NULL;

UPDATE regions SET hotels = ARRAY['Rixos Premium Tekirova']
  WHERE slug = 'tekirova' AND hotels IS NULL;

UPDATE regions SET hotels = ARRAY['Granada Luxury Okurcalar']
  WHERE slug = 'okurcalar' AND hotels IS NULL;

COMMIT;
