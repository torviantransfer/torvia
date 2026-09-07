# TORVIAN Transfer — SEO Master Audit

**Denetim başlangıcı:** 2026-09-07
**Hedef:** `https://torviantransfer.com` (production, canlı rezervasyon alıyor)
**Diller:** tr, en, de, pl, ru, nl, ro
**Yöntem:** kod okuması + production HTML'inin tamamının taranması (531 URL) + migration geçmişi

Bu dosya çalışma boyunca **living document**'tir. Her faz kendi bölümünü günceller.

---

## 1. Architecture

### 1.1 SEO verisinin geldiği üç tablo

| Tablo | Neyi besler | Sayfa route'u | Kod |
| --- | --- | --- | --- |
| `seo_pages` | ana sayfa, 5 landing, booking, statik + legal sayfalar | `src/app/[locale]/<route>/page.tsx` | `src/lib/seoPages.ts` |
| `regions` | `/{locale}/{slug}-transfer` | `src/app/[locale]/[region]/page.tsx` | satır içi, `applyOverrides` |
| `blog_posts` | `/{locale}/blog/{localized-slug}` | `src/app/[locale]/blog/[slug]/page.tsx` | satır içi, `applyOverrides` |

Üçü de tek bir merge fonksiyonundan geçer: **`src/lib/seoOverrides.ts` → `applyOverrides()`**.

### 1.1b Yeni araçlar

| Dosya | İşi |
| --- | --- |
| `scripts/seo-inventory.ts` | URL envanterini 3 bağımsız kaynaktan üretir, farkları raporlar |
| `scripts/seo-audit-urls.ts` | 531 URL'yi tarar; redirect zinciri, hreflang grafiği, duplicate tespiti, og:image HTTP kontrolü, iç link grafiği |
| `scripts/verify-seo-callers.ts` | Page modüllerini import edip metadata üreticilerini test eder |
| `scripts/verify-seo-fixes.ts` | Her fix'i finding ID'siyle rendered HTML'de doğrular |
| `src/lib/redirects.ts` | Redirect kuralları tek yerde — `next.config.ts` ve `sitemap.ts` aynı listeyi okur |

### 1.2 Metadata zinciri

```
src/app/layout.tsx           metadataBase, title.template "%s | TORVIAN Transfer",
                             varsayılan robots (index/follow + max-image-preview:large)
        │
src/app/[locale]/layout.tsx  <html lang>, NextIntlClientProvider  (metadata YOK)
        │
page.tsx generateMetadata()  sayfanın kendi fallback'i (kod / messages / DB kolonu)
        │
applyOverrides() / applySeoPage()
        │   canonical → og → twitter → robots  (NULL = dokunma)
        ▼
    RENDERED HTML
```

### 1.3 Admin → production yolu

```
SeoManager (client)
  → POST /api/admin/crud  {table, action:"update", id, data:{sadece değişen kolonlar}}
    → requireAdmin()
    → supabase.from(table).update(data)          ← LEVEL 1
    → revalidateForTable(table, row)             ← src/lib/revalidate.ts
    → logSeoChange()  → seo_audit_log
  → panel 1.5 sn sonra /api/admin/seo-inspect ile production HTML'ini yeniden okur  ← LEVEL 3
```

`revalidateForTable` bir Route Handler içinden çağrıldığı için yolları **stale işaretler**; sayfa
bir sonraki ziyarette yeniden üretilir. Deploy beklemeye gerek yoktur.

### 1.4 Locale merkezleri

- `src/i18n/config.ts` — `locales`, `inlineCopyLocales`, `localeOgTags`, `localeCurrencies`
- `src/i18n/routing.ts` — `localePrefix: "always"` → **her public URL `/{locale}/…` biçimindedir**
- `src/proxy.ts` — next-intl middleware

`localePrefix: "always"` bu denetimin en önemli tek gerçeğidir: locale'siz hiçbir public sayfa
yoktur, dolayısıyla `robots.txt` içindeki locale'siz kurallar (`/admin/`, `/track`) **hiçbir
gerçek sayfayı kapsamaz**.

---

## 2. URL Inventory

Envanter üç bağımsız kaynaktan üretilir (`scripts/seo-inventory.ts`) ve aralarındaki fark
raporlanır: filesystem route'ları, `/api/regions`, `sitemap.xml`.

| Sınıf | Route | Locale | URL | Karar |
| --- | --- | --- | --- | --- |
| INDEXABLE COMMERCIAL | `/{locale}` | 7 | 7 | index |
| INDEXABLE COMMERCIAL | `antalya-airport-transfer`, `vip-transfer-antalya`, `hotel-transfer-antalya`, `lara-beach-transfer`, `land-of-legends-transfer`, `booking` | 7 | 42 | index |
| INDEXABLE COMMERCIAL | `{region}-transfer` × 25 aktif bölge | 7 | 175 | index |
| INDEXABLE INFORMATIONAL | `regions`, `blog`, `about`, `contact`, `faq` | 7 | 35 | index |
| INDEXABLE INFORMATIONAL | `blog/{localized-slug}` | değişken | 188 | index |
| INDEXABLE (LEGAL) | `cancellation`, `privacy`, `terms`, `cookies`, `kvkk` | 7 | 35 | index |
| NOINDEX UTILITY | `track`, `booking/success`, `booking/cancel` | 7 | 21 | **noindex** |
| PRIVATE/ADMIN | `admin`, `admin/login`, `account`, `account/login`, `account/reset-password` | 7 | 35 | **noindex** |
| PRIVATE (locale'siz) | `driver/[token]` | — | n | noindex (token ile korunuyor) |
| ERROR | `not-found`, `error`, `global-error` | — | — | — |

**Toplam taranan: 531 URL.** Sitemap 482 girdi içeriyor (7 tanesi tekrar ediyor → 475 benzersiz).

`UNKNOWN` bırakılan route yok.

---

## 3. Source of Truth

Hedeflenen sözleşme:

| Alan | Admin doluysa | Admin boşsa |
| --- | --- | --- |
| meta title / description | **admin kazanır, aynen** | sayfanın fallback'i |
| canonical | admin (güvenlik doğrulamasından geçerse) | sayfanın hesapladığı |
| robots index/follow | admin (tri-state) | sayfanın kararı |
| OG / Twitter | admin → meta → sayfa | sayfanın değeri |
| H1 / intro | admin | çeviri dosyası / bileşen metni |
| görsel + alt | admin → hardcoded map | site varsayılanı |

**Bugünkü gerçek durum:**

| Tablo | meta title/desc | canonical | robots | OG/Twitter | H1/intro |
| --- | --- | --- | --- | --- | --- |
| `seo_pages` | ✅ çalışıyor (kanıt: `/en/regions` DB override'ı canlıda) | ✅ | ✅ | ✅ | ⚠️ 8 sayfada okunmuyor |
| `regions` | ⚠️ çalışıyor **ama fiyat eki admin metnini değiştiriyor** | ✅ | ✅ | ✅ | ✅ |
| `blog_posts` | ❌ **hiç uygulanmıyor** (SEO-002) | ✅ | ✅ | ✅ | — (title_* blog editöründe) |

`h1_*` / `intro_*` okunmayan `seo_pages` sayfaları: `home`, `blog`, `booking`, `cancellation`,
`cookies`, `kvkk`, `privacy`, `terms`.

---

## 4. Database / Migration State

### 4.1 Romence kolon eksikleri (repository migration zincirinden kesin)

`062`–`069` yalnızca şunları ekliyor:
`regions`: `name_ro`, `description_ro`, `meta_title_ro`, `meta_description_ro`
`blog_posts`: `title_ro`, `content_ro`, `excerpt_ro`, `slug_ro`

**Eksik olanlar (admin panelinde alan var, DB'de kolon yok):**

| Tablo | Eksik kolon |
| --- | --- |
| `seo_pages` | `meta_title_ro`, `meta_description_ro`, `keywords_ro`, `focus_keyword_ro`, `h1_ro`, `intro_ro`, `canonical_url_ro`, `og_title_ro`, `og_description_ro`, `twitter_title_ro`, `twitter_description_ro` — **11 kolonun tamamı** |
| `regions` | `keywords_ro`, `focus_keyword_ro`, `h1_ro`, `canonical_url_ro`, `og_title_ro`, `og_description_ro`, `twitter_title_ro`, `twitter_description_ro` — **8** |
| `blog_posts` | `meta_title_ro`, `meta_description_ro`, `focus_keyword_ro`, `secondary_keywords_ro`, `canonical_url_ro`, `og_title_ro`, `og_description_ro`, `twitter_title_ro`, `twitter_description_ro` — **9** |

`/api/admin/crud` yazma hatasını yutmuyor (`error.message` 500 ile dönüyor), yani kayıt sessizce
kaybolmuyor — ama Romence SEO kaydetmek bugün **hata veriyor**.

Kapatan migration: **`070_romanian_seo_columns.sql`** (forward-only, idempotent, veri silmeyen).

### 4.2 Migration geçmişi denetimi

- Aynı sequence numarasını paylaşan dosyalar: `004`(×2), `012`(×2), `031`(×2). İkisi de
  uygulanmış durumda; yeniden numaralandırmak production history'yi yeniden yazmak olur —
  **dokunulmadı**, sadece kayda geçirildi.
- `048` numarası hiç kullanılmamış (zincirde boşluk). Zararsız.
- `030` + `037` + `050`: duplicate blog konsolidasyonu. **`037` istenen sonucu üretmemiş** —
  `antalya-alanya-transfer-suresi` bugün hâlâ `is_published = true` (kanıt: 6 locale URL'i
  sitemap'te ve canlı). Bkz. SEO-008.
- `056`: `konyaalti` / `manavgat` bilerek `is_active = false`. Sitemap'te yok, doğru davranış.
  Bu bir defect **değil**.

---

## 5. Known Confirmed Defects

Tam liste ve kanıtlar §9 (Finding Registry). Özet:

| Severity | Adet |
| --- | --- |
| CRITICAL | 4 |
| HIGH | 9 |
| MEDIUM | 14 |
| LOW | 2 |

Toplam **30 bulgu**. 29'u düzeltildi (4'ü uygulanmayı bekleyen migration'a
bağlı), 1'i (SEO-030) SEO kapsamı dışında olduğu için kayda geçirildi.

---

## 6. Locale Coverage Matrix

| Alan | tr | en | de | pl | ru | nl | ro |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `src/messages/*.json` (870 anahtar) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5 landing page satır içi kopya | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Homepage `titleByLocale` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ SEO-027 |
| Homepage hreflang kümesi | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ SEO-005 |
| Region `priceLabel` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ **SEO-001** |
| Region `fallbackTitle` / `fallbackDesc` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ SEO-006 |
| `seo_pages` RO kolonları | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ SEO-003 |
| `regions` RO SEO kolonları | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ SEO-003 |
| `blog_posts` RO SEO kolonları | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ SEO-003 |
| Blog içerik editörü (BlogManager) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ SEO-014 |
| Schema `availableLanguage` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ SEO-013 |
| `proxy.ts` matcher | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ SEO-016 |
| `next.config.ts` redirect locale listesi | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| İletişim sayfası dil listesi | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ SEO-024 |
| `Footer` `Locale` tipi | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ SEO-028 |
| `BlogPreview` locale haritaları | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ SEO-028 |

---

## 7. Indexation Matrix

Production ölçümü, 2026-09-07 (`docs/seo-runtime-audit.json`).

| Route sınıfı | Beklenen | Ölçülen | Durum |
| --- | --- | --- | --- |
| `/{locale}` | index | index | ✅ |
| landing × 7 | index | index | ✅ |
| region × 7 | index | index | ✅ |
| blog post | index | index | ✅ |
| statik + legal | index | index | ✅ |
| `/{locale}/account*` | noindex | `noindex, nofollow` | ✅ |
| `/{locale}/booking/success`, `/cancel` | noindex | `noindex, nofollow` | ✅ |
| `/{locale}/admin`, `/{locale}/admin/login` | noindex | **`index, follow`** | ❌ SEO-004 (14 URL) |
| `/{locale}/track` | noindex | **`index, follow`** | ❌ SEO-007 (7 URL) |
| `robots.txt` `/admin/`, `/account/`, `/track` | gerçek URL'leri kapsamalı | **hiçbirini kapsamıyor** | ❌ SEO-004 |

---

## 8. Phase Registry

| Faz | Dosya | Durum |
| --- | --- | --- |
| 00 | `seo-phases/00-inventory-and-architecture.md` | DONE |
| 01 | `seo-phases/01-critical-source-of-truth.md` | DONE |
| 02 | `seo-phases/02-admin-db-runtime-contract.md` | DONE |
| 03 | `seo-phases/03-indexation-robots-routing.md` | DONE |
| 04 | `seo-phases/04-canonical-hreflang.md` | DONE |
| 05 | `seo-phases/05-sitemap-redirects.md` | DONE |
| 06 | `seo-phases/06-blog-system.md` | DONE |
| 07 | `seo-phases/07-region-system.md` | DONE |
| 08 | `seo-phases/08-static-landing-pages.md` | DONE |
| 09 | `seo-phases/09-romanian-locale-consistency.md` | DONE |
| 10–16 | `seo-phases/10..16-*-full-audit.md` | DONE (tek programatik matris) |
| 17 | `seo-phases/17-schema-images-internal-links.md` | DONE |
| 18 | `seo-phases/18-commercial-intent-and-cannibalization.md` | DONE |
| 19 | `seo-phases/19-full-production-verification.md` | DONE |

---

## 9. Finding Registry

Her bulgunun tam formu ilgili faz dosyasındadır. Buradaki tablo tek bakışta durumdur.

| ID | Severity | Durum | Özet |
| --- | --- | --- | --- |
| SEO-001 | CRITICAL | FIXED | 22 Romence bölge sayfasının `<title>`'ında literal `undefined` |
| SEO-002 | CRITICAL | FIXED | Blog `meta_title_*` / `meta_description_*` override'ları hiç uygulanmıyor |
| SEO-003 | CRITICAL | FIXED (migration hazır, uygulanmadı) | 28 Romence SEO kolonu DB'de yok |
| SEO-004 | CRITICAL | FIXED | `/{locale}/admin` ve `/admin/login` indexlenebilir |
| SEO-005 | HIGH | FIXED | Homepage hreflang kümesinde `ro` yok |
| SEO-006 | HIGH | FIXED | Romence bölge fallback title/description şablonu yok |
| SEO-007 | HIGH | FIXED | `/{locale}/track` indexlenebilir utility sayfası |
| SEO-008 | HIGH | FIXED (kod) / BLOCKED (DB) | Yayında kalmış duplicate blog kümesi |
| SEO-009 | HIGH | FIXED | `land-of-legends-transfer` bölge satırı route tarafından gölgeleniyor; sitemap URL'i iki kez yazıyor |
| SEO-010 | HIGH | FIXED (migration hazır) | 4 blog yazısının görseli 404 → 28 sayfada kırık hero + og:image |
| SEO-011 | HIGH | FIXED | Fiyat eki, admin'in yazdığı bölge meta title'ını sessizce değiştiriyor |
| SEO-012 | MEDIUM | FIXED | 35 legal URL'de `TORVIAN Transfer` iki kez |
| SEO-013 | MEDIUM | FIXED | Schema `availableLanguage` Romence içermiyor (5 yer) |
| SEO-014 | MEDIUM | FIXED | Blog içerik editöründe Romence sekmesi yok |
| SEO-015 | MEDIUM | FIXED | Admin `noindex` override'ı sitemap'e yansımıyor |
| SEO-016 | MEDIUM | FIXED | `proxy.ts` matcher locale listesinde `ro` yok |
| SEO-017 | MEDIUM | FIXED | `getSeoPage` beklenmeyen DB hatasını sessizce yutuyor |
| SEO-018 | MEDIUM | FIXED | Blog gövdesindeki `<h1>` ikinci bir H1 üretiyor |
| SEO-019 | MEDIUM | FIXED | `/nl/kvkk` ve `/nl/privacy` aynı title |
| SEO-020 | MEDIUM | FIXED | `audit:seo` yalnızca 8 örnek URL tarıyordu |
| SEO-021 | MEDIUM | FIXED | `verify:seo` gerçek caller'ı test etmiyordu |
| SEO-022 | MEDIUM | FIXED | Homepage `<title>` ile `og:title` 6 dilde farklı |
| SEO-023 | MEDIUM | FIXED | Panelden bölge eklerken `name_ro` yazılmıyor |
| SEO-024 | MEDIUM | FIXED | İletişim sayfası dil listesinde Romence yok |
| SEO-025 | LOW | ACCEPTED | `/contact` ince içerik (~240 kelime) |
| SEO-026 | LOW | FIXED | Pasif/olmayan bölge için indexlenebilir metadata üretiliyor |
| SEO-027 | MEDIUM | FIXED | Homepage `titleByLocale` / `descriptionByLocale` Romence içermiyor |
| SEO-028 | HIGH | FIXED | Ana sayfa blog bölümü olmayan kolonları sorguluyor — 7 dilde hiç render edilmiyor |
| SEO-029 | HIGH | FIXED | 3 ticari landing sayfası bütün sitede 1'er iç link alıyor |
| SEO-030 | MEDIUM | TODO (SEO dışı) | `availability` API'si olmayan `reservations.category_slug` kolonunu sorguluyor |

---

## 10. Final Verification

Tam rapor: **`docs/seo-final-verification.md`**.
Ham tarama verisi: `docs/seo-runtime-audit.md` / `.json`.

```
Tip denetimi              PASS
Build                     PASS  (344 statik sayfa)
Lint                      değiştirilen 30 dosyada 0 hata
                          (repoda 29 önceden mevcut hata, ilgisiz dosyalarda)
verify:seo                187/187 PASS   (helper + caller kontratları)
verify:fixes              199/199 PASS   (rendered HTML, finding ID başına)
audit:seo                 531 URL tarandı
```

Production taraması, düzeltmeler yayına alınmadan önceki durumu ölçüyor —
89 FAIL, hepsi kayıtlı bir finding'e bağlı. Deploy + 4 migration sonrası
beklenen: 531/531 PASS.

### Deploy sırası

```
1. migration 070            (deploy'dan ÖNCE — saf ekleme)
2. kodu deploy et
3. migration 071, 072, 073  (deploy'dan SONRA — 072 ters sırada
                             title'lara literal "{price}" basar)
4. npm run audit:seo
   BASE_URL=https://torviantransfer.com npm run verify:fixes
```
