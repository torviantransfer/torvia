# 00 — Baseline

**Görev:** SEO growth, keyword, SERP ve içerik optimizasyonu
**Başlangıç:** 2026-09-07 · **Bitiş:** 2026-09-08
**Teknik baseline:** birinci master audit sonrası repository (bkz. `docs/seo-master-audit.md`)

## Bu görev nereden başlıyor

Birinci audit teknik SEO altyapısını denetledi ve düzeltti: 30 bulgu, 4 migration
(070–073), 531 URL taraması. **Bu görev o mimariyi baseline kabul eder ve
yeniden kurmaz.**

Devralınan sözleşme:

| Alan | Sahibi |
| --- | --- |
| `seo_pages.meta_*` / canonical / robots / OG | admin (DB), boşsa sayfa kodu |
| `regions.meta_title_{loc}` | admin (DB), aynen yayınlanır; fiyat yalnız `{price}` token'ıyla |
| `blog_posts.title_{loc}` / `content_{loc}` / `excerpt_{loc}` / `slug_{loc}` | blog editörü |
| `blog_posts.meta_title_{loc}` / `meta_description_{loc}` | SEO paneli |
| Landing sayfa başlıkları | 33/35 kod (`content` kaydı), 2/35 DB override |

Son ölçüm (`docs/seo-runtime-audit.json`, 2026-09-07): 531 URL, 442 PASS.
89 FAIL'ın tamamı birinci audit'in kayıtlı bulgularına ait ve deploy +
migration 070–073 ile kapanıyor.

## Bu görevin kapsamı

Teknik hata avlamak değil. Her indexlenebilir URL için:

1. hangi arama niyetini sahipleneceği,
2. hangi keyword cluster'ının tek sahibi olduğu,
3. içeriğin o role uyup uymadığı.

## Devralınan ve dokunulmayan kararlar

- **070–073 migration'ları değiştirilmedi.** Bu görevin migration'ları 074'ten
  başlıyor.
- **SEO-030** (availability API'sinin olmayan `reservations.category_slug`
  kolonunu sorgulaması) rezervasyon davranışıdır; koduna dokunulmadı.
- **Footer'a eklenen 4 ticari link** korundu; yeni contextual link mimarisi
  bunun üzerine kuruldu.
- Ranking alan region sayfalarına (`/pl/beldibi-transfer` poz 3,6,
  `/tr/sehirici-transfer` poz 3,1, `/tr/side-transfer` poz 4,3) dokunulmadı.

## Ölçüm sınırları

| Sınır | Etki |
| --- | --- |
| **GSC erişimi yok** | Sorgu bazlı doğrulama yapılamadı; `docs/seo-analiz.md` (30 May – 29 Ağu 2026) historical baseline olarak kullanıldı. Bkz. `01-current-gsc-analysis.md`. |
| **Arama aracı US-locale** | Çekilen SERP'ler gerçek ülke SERP'i değil; rakip keşfi ve dil kullanımı için geçerli, sıralama kanıtı olarak değil. Bkz. `03-serp-competitor-analysis.md`. |
| **Google Trends programatik erişim yok** | Sayısal trend verisi üretilmedi. Bkz. `02-trends-research.md`. |
| **Migration'lar uygulanmadı** | Production hâlâ deploy öncesi kodu çalıştırıyor; bu görevin ölçümleri de o duruma ait. |
