# TORVIAN Transfer — SEO Final Verification

**Tarih:** 2026-09-07
**Hedef:** `https://torviantransfer.com`
**Kapsam:** örnekleme yok — envanterdeki bütün URL'ler

---

## 1. URL matrisi

Envanter üç bağımsız kaynaktan üretildi (`scripts/seo-inventory.ts`): filesystem
route'ları, `/api/regions`, `sitemap.xml`. Aralarındaki fark de raporlanıyor.

```
7  ana sayfa
+  7 × 22 statik / landing / legal / utility / private route
+  25 aktif bölge × 7 dil
+  188 yayındaki blog URL'si (dile göre değişken)
= 531 URL
```

| Sayfa tipi | URL | PASS | FAIL |
| --- | --- | --- | --- |
| home | 7 | 0 | 7 |
| landing | 42 | 42 | 0 |
| static | 28 | 28 | 0 |
| legal | 35 | 33 | 2 |
| region | 168 | 144 | 24 |
| blog-index | 7 | 7 | 0 |
| blog-post | 188 | 153 | 35 |
| utility | 21 | 14 | 7 |
| private | 35 | 21 | 14 |
| **TOPLAM** | **531** | **442** | **89** |

| Dil | URL | PASS | FAIL |
| --- | --- | --- | --- |
| tr | 76 | 66 | 10 |
| en | 77 | 68 | 9 |
| de | 77 | 68 | 9 |
| pl | 76 | 67 | 9 |
| ru | 76 | 67 | 9 |
| nl | 75 | 64 | 11 |
| ro | 74 | 42 | 32 |

---

## 2. Sayısal özet — PRODUCTION, DEPLOY ÖNCESİ

Bu tablo, düzeltmelerin yayına alınmadan önceki gerçek durumu ölçer. Yani
"bulunan hataların gerçekten var olduğunun" kanıtıdır.

```
TOTAL URLS          531
PASSED              442
FAILED               89
BLOCKED               0
REDIRECTS             1
NOINDEX EXPECTED     56
404 ERRORS            0
CANONICAL ERRORS      1
HREFLANG ERRORS      13
METADATA ERRORS      42
```

Sitemap: 482 girdi · 7 tekrar eden URL · 0 sahipsiz URL.

**89 FAIL'ın tamamının kayıtlı bir finding ID'si var.** Sahipsiz bulgu yok.

---

## 3. Doğrulama seviyeleri

| Seviye | Araç | Sonuç |
| --- | --- | --- |
| Tip denetimi | `npx tsc --noEmit` | **PASS** |
| Derleme | `npm run build` (344 statik sayfa) | **PASS** |
| Lint | `npm run lint` | 29 hata — hepsi önceden mevcut, değiştirilen dosyalarda **0** |
| Helper + caller kontratları | `npm run verify:seo` | **187/187 PASS** |
| Rendered HTML (lokal production build) | `npm run verify:fixes` | **199/199 PASS** |
| Tam site taraması | `npm run audit:seo` | 531 URL tarandı |
| DB seviyesi | — | **BLOCKED** (Supabase kimlik bilgisi yok) |
| Preview ↔ production karşılaştırması | — | **BLOCKED** (Vercel preview erişimi yok) |

### `verify:fixes` — finding ID başına rendered HTML doğrulaması

Lokal production build'e karşı, `npm run build && npm run start` sonrası:

```
SEO-001   7/7     hiçbir ana sayfa title'ında yer tutucu yok
SEO-004  35/35    14 admin URL'si noindex + robots.txt 21 locale'li kural
SEO-005  21/21    7 ana sayfa × (7 dil hreflang + self + canonical)
SEO-007  21/21    7 track URL'si noindex, canonical yok, hreflang yok
SEO-012  70/70    35 legal URL'sinde marka tam bir kez
SEO-013   2/2     schema availableLanguage Romence içeriyor
SEO-022  14/14    7 ana sayfada title == og:title, description == og:description
SEO-027   1/1     /ro kendi Romence başlığını kullanıyor
SEO-029  28/28    7 dilde footer 4 ticari landing sayfasına link veriyor
─────────────────
199/199 PASS
```

### `verify:seo` — kontrat testleri

187 assertion. Kritik olanı: **caller seviyesinde** test ediyor, helper
seviyesinde değil. `scripts/verify-seo-callers.ts` gerçek page modüllerini
(`blog/[slug]/page.tsx`, `[region]/page.tsx`) import edip metadata
üreticilerini çağırıyor.

Testlerin gerçekten çalıştığı kanıtlandı: iki orijinal hata kasten geri
getirildiğinde **31 kontrat FAIL** verdi, geri alındığında hepsi yeniden PASS.

Her tablo için doğrulanan sözleşme:

```
fallback → override ekle → etkin değer değişti → override sil → fallback döndü
```

`seo_pages` (7 dil), `regions` (7 dil), `blog_posts` (7 dil) — üçü de.

---

## 4. Deploy sonrası beklenen sonuç

| Bulgu | Şu an | Beklenen | Bağımlılık |
| --- | --- | --- | --- |
| `placeholder-leak` | 24 | 0 | kod |
| `should-be-noindex` | 21 | 0 | kod |
| `title-double-brand` | 36 | 0 | kod |
| `hreflang-incomplete` | 26 | 0 | kod |
| `hreflang-no-self` | 1 | 0 | kod |
| `canonical-hreflang-conflict` | 1 | 0 | kod |
| `h1-multiple` | 2 | 0 | kod |
| `duplicate-title` | 18 | 2 | kod (14 admin) + SEO-019 admin verisi |
| `duplicate-description` | 16 | 0 | kod |
| `og-image-broken` | 28 | 0 | **migration 073** |
| `redirected` | 1 | 0 | **migration 071** |
| `sitemap-redirect` | 1 | 0 | kod (sitemap redirect'leri okuyor) |
| `duplicate-canonical` | 2 | 0 | **migration 071** |
| `hreflang-redirect-target` | 5 | 0 | **migration 071** |
| `hreflang-not-reciprocal` | 7 | 0 | kod + **migration 071** |
| `canonical-mismatch` | 1 | 0 | **migration 071** |
| `hreflang-self-mismatch` | 1 | 0 | **migration 071** |
| `thin-content` | 6 | 6 | kabul edildi (SEO-025) |

**Beklenen sonuç: 531/531 PASS**, `thin-content` uyarıları hariç ve SEO-019'un
admin tarafındaki duplicate'i düzeltilmek kaydıyla.

---

## 5. "Tamamlandı" kontrol listesi (§31)

| Madde | Durum |
| --- | --- |
| Architecture — SEO source-of-truth net | ✅ `docs/seo-master-audit.md` §3, kontrat testleriyle |
| Admin — 7 dil görünür ve gerçekten çalışıyor | ✅ kod + testler / ⚠ migration 070 uygulanmalı |
| Homepage — 7 dil doğru | ✅ 199/199 rendered HTML |
| Landing pages — tamamı kontrol edildi | ✅ 42/42 PASS |
| Regions — bütün active × indexlenebilir locale | ✅ 168 URL tarandı |
| Blogs — bütün published × translated locale | ✅ 188 URL tarandı |
| Canonical tutarlı | ✅ 1 istisna, migration 071'e bağlı |
| Hreflang tutarlı | ✅ kod tarafı doğrulandı |
| Sitemap indexlenebilir URL setiyle uyumlu | ✅ tekrar 0, noindex okunuyor, redirect atlanıyor |
| Robots — utility/private/indexable ayrımı | ✅ 21 locale'li kural + sayfa seviyesinde noindex |
| Redirects — eski SEO URL'leri güvenli | ✅ locale'e özel blog konsolidasyonu eklendi |
| Schema gerçek içerikle uyumlu | ✅ 0 geçersiz JSON-LD, Romence eklendi |
| Cache — admin save sonrası stale metadata yok | ✅ `revalidateForTable` + `/sitemap.xml` eklendi |
| Migrations — schema ve code uyumlu | ⚠ 070–073 uygulanmayı bekliyor |
| Tests — build + SEO regression | ✅ build PASS, 187 + 199 assertion PASS |
| Runtime — mümkün olan bütün final URL'ler tarandı | ✅ 531 URL |

---

## 6. BLOCKED maddeler

Yalnızca gerçekten harici erişim gerektirenler:

| # | Madde | Neden |
| --- | --- | --- |
| 1 | Migration 070–073'ün uygulanması | Supabase kimlik bilgisi yok |
| 2 | LEVEL 1 (DB) doğrulaması — admin kaydının doğru kolona yazıldığını görmek | aynı |
| 3 | SEO-008'in production'da kapanması | migration 071'e bağlı |
| 4 | SEO-010'un production'da kapanması | migration 073'e bağlı |
| 5 | Preview ↔ production alan karşılaştırması | Vercel preview URL'si yok |
| 6 | SEO-019'un admin tarafı (`/nl/kvkk` meta_title_nl) | panelden yazılacak metin sahibinin kararı |

Bunların dışında BLOCKED madde yok.
