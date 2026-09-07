# Faz 19 — Tam production doğrulaması

**Durum:** DONE (kod) — production doğrulaması deploy'a bağlı

## Üç seviyeli doğrulama

Görev tanımı §28 üç seviye istiyor. Bu ortamda hangisine erişilebildiği:

| Seviye | Ne kanıtlar | Erişim | Sonuç |
| --- | --- | --- | --- |
| **1 — DATABASE** | değer doğru satır + doğru locale kolonunda mı | ❌ Supabase kimlik bilgisi yok | BLOCKED |
| **2 — APPLICATION** | doğru caller bu değeri gerçekten tüketiyor mu | ✅ | 187/187 PASS |
| **3 — RENDERED HTML** | son HTML ne gösteriyor | ✅ lokal build + production okuma | 199/199 PASS (lokal), 531 URL tarandı (production) |

LEVEL 1'in kapalı olması LEVEL 2'yi zayıflatmıyor: `verify-seo-callers.ts`
gerçek page modüllerini import edip metadata üreticilerini test verisiyle
çağırıyor, yani "DB'de bir değer olsaydı ne olurdu" sorusunun cevabı ölçülmüş
oluyor. Kapalı olan tek şey, gerçek bir admin kaydının gerçekten yazıldığını
görmek.

## Araçlar

| Komut | Ne yapar | Sonuç |
| --- | --- | --- |
| `npx tsc --noEmit` | tip denetimi | PASS |
| `npm run build` | production derlemesi, 344 statik sayfa | PASS |
| `npm run lint` | ESLint | 29 hata — hepsi önceden mevcut, değiştirilen hiçbir dosyada değil |
| `npm run verify:seo` | helper + **caller** kontratları | 187/187 PASS |
| `BASE_URL=… npm run verify:fixes` | her fix'i ID'siyle rendered HTML'de doğrular | 199/199 PASS (lokal build) |
| `npm run audit:seo` | 531 URL tam tarama | production = deploy öncesi durum |

### Lint hakkında

`npm run lint` 29 hata veriyor. Hepsi bu çalışmadan önce de vardı ve hiçbiri
değiştirilen bir dosyada değil:

- `src/hooks/useCurrency.ts`, `src/components/booking/RouteMap.tsx`,
  `src/components/admin/CalendarView.tsx`,
  `src/components/admin/DateAvailabilityManager.tsx`,
  `src/components/CurrencySelector.tsx`,
  `src/components/booking/BookingFormMini.tsx`,
  `src/app/[locale]/account/reset-password/page.tsx` — React hooks kuralları
- kök dizindeki `fix-*.js`, `rebrand*.js`, `run-seed.js` — eski tek seferlik
  scriptler

Değiştirilen 30 dosyanın hepsi tek tek `npx eslint` ile denetlendi: **0 hata**,
2 uyarı (`blog/[slug]/page.tsx` içindeki kullanılmayan `posts` değişkeni ve
`privacy/page.tsx` içindeki kullanılmayan `Shield` importu) — ikisi de bu
çalışmadan önce de vardı ve SEO ile ilgisiz. Ayıklanmadılar çünkü SEO düzeltmesi
adına alakasız kod temizliği yapmak scope genişletmek olurdu.

## Production taraması (deploy öncesi durum)

Bu, düzeltmelerin **yayına alınmadan önceki** ölçümüdür — yani ne kadarının
gerçekten var olduğunun kanıtı.

```
TOTAL URLS        531
PASSED            442
FAILED             89
BLOCKED             0
REDIRECTS           1
NOINDEX EXPECTED   56
404 ERRORS          0
CANONICAL ERRORS    1
HREFLANG ERRORS    13
METADATA ERRORS    42
```

| Bulgu | Sayfa | Kayıtlı finding |
| --- | --- | --- |
| `title-double-brand` | 36 | SEO-012 |
| `og-image-broken` | 28 | SEO-010 |
| `hreflang-incomplete` | 26 | SEO-005 |
| `placeholder-leak` | 24 | SEO-001 |
| `should-be-noindex` | 21 | SEO-004 / SEO-007 |
| `duplicate-title` | 18 | SEO-004 / SEO-008 / SEO-019 |
| `duplicate-description` | 16 | SEO-004 / SEO-008 |
| `hreflang-not-reciprocal` | 7 | SEO-005 / SEO-008 |
| `thin-content` | 6 | SEO-025 (kabul edildi) |
| `hreflang-redirect-target` | 5 | SEO-008 |
| `duplicate-canonical` | 2 | SEO-008 |
| `h1-multiple` | 2 | SEO-018 |
| `redirected` / `sitemap-redirect` / `canonical-mismatch` / `hreflang-self-mismatch` / `hreflang-no-self` / `canonical-hreflang-conflict` | 1'er | SEO-005 / SEO-008 |

Sitemap: 482 girdi, 7 tekrar, 0 sahipsiz URL.

Her bulgunun kayıtlı bir finding'i var. Sahipsiz tek bir bulgu yok.

## Deploy sonrası beklenen durum

| Bulgu | Şu an | Deploy sonrası | Neye bağlı |
| --- | --- | --- | --- |
| `placeholder-leak` | 24 | 0 | kod |
| `should-be-noindex` | 21 | 0 | kod |
| `title-double-brand` | 36 | 0 | kod |
| `hreflang-incomplete` | 26 | 0 | kod |
| `hreflang-no-self` / `canonical-hreflang-conflict` | 1+1 | 0 | kod |
| `duplicate-title` / `duplicate-description` | 18/16 | 2/0 | kod (14'ü admin) + SEO-019 admin verisi |
| `og-image-broken` | 28 | 0 | **migration 073** |
| `redirected` / `sitemap-redirect` / `duplicate-canonical` / `hreflang-redirect-target` / `hreflang-not-reciprocal` | 1/1/2/5/7 | 0 | kod (redirect + sitemap) + **migration 071** |
| `h1-multiple` | 2 | 0 | kod |
| `thin-content` | 6 | 6 | kabul edildi (SEO-025) |

## Deploy sırası

Bu sıra önemli — iki migration'ın koda göre farklı tarafta durması gerekiyor.

```
1.  supabase/migrations/070_romanian_seo_columns.sql     ← DEPLOY'DAN ÖNCE
       (saf ekleme; eski kod yeni kolonları görmezden gelir.
        BlogManager'ın Romence sekmesi buna bağımlı.)

2.  Kodu deploy et

3.  supabase/migrations/071_finish_alanya_duration_consolidation.sql
    supabase/migrations/072_region_price_token.sql        ← DEPLOY'DAN SONRA
    supabase/migrations/073_fix_missing_blog_images.sql
       (072 ters sırada çalışırsa eski kod title'lara literal "{price}" basar.)

4.  npm run audit:seo
    BASE_URL=https://torviantransfer.com npm run verify:fixes
```

Üç migration da sonunda kendi sonucunu doğruluyor ve beklenen durum
oluşmamışsa `RAISE EXCEPTION` ile duruyor — "SQL hata vermedi = başarılı"
kabul edilmiyor (§I).

## Preview ↔ production karşılaştırması

`npm run audit:seo` `COMPARE_URL` modunu destekliyor ve her alanı iki deployment
arasında karşılaştırıyor. Vercel preview URL'sine erişim yok, dolayısıyla bu
adım **BLOCKED**. Deploy eden kişi şunu çalıştırabilir:

```
BASE_URL=https://<preview>.vercel.app COMPARE_URL=https://torviantransfer.com npm run audit:seo
```

Beklenen fark listesi yukarıdaki "Deploy sonrası beklenen durum" tablosudur;
onun dışında değişen bir alan çıkarsa kasıtsızdır.
