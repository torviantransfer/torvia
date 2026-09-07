# Faz 03 — Indexation, robots, routing

**Durum:** DONE

Bu fazın kök nedeni tek bir mimari gerçek: `localePrefix: "always"`. Sitede
locale'siz hiçbir public sayfa yok, ama `robots.txt` locale'siz yazılmıştı.

---

## SEO-004

**Durum:** FIXED — lokal build'de doğrulandı
**Severity:** CRITICAL
**Category:** indexation / private route exposure
**Affected files:** `src/app/[locale]/admin/layout.tsx`, `src/app/robots.ts`
**Affected URLs:** 14 — `/{locale}/admin` ve `/{locale}/admin/login`, 7 dil
**Affected locales:** 7'sinin tamamı

**Observed behavior (production, 2026-09-07):**

```
/tr/admin        HTTP 200 | <meta name="robots" content="index, follow">
/en/admin        HTTP 200 | <meta name="robots" content="index, follow">
/en/admin/login  HTTP 200 | <meta name="robots" content="index, follow">
```

Admin giriş ekranı, kök layout'un `index, follow` direktifiyle taranabilir ve
indexlenebilir durumda. 14 URL, hepsi aynı title ve description'a sahip
(`duplicate-title` ve `duplicate-description` bulgularının 14'ü buradan).

**Expected behavior:** `noindex, nofollow`.

**Root cause:** iki bağımsız eksik.

1. `src/app/[locale]/admin/layout.tsx` hiçbir metadata tanımlamıyordu. Kardeşi
   `account/layout.tsx` tanımlıyor (`robots: { index: false, follow: false }`) —
   admin unutulmuş.
2. `robots.ts` `"/admin/"` yasaklıyordu. `localePrefix: "always"` yüzünden böyle
   bir yol yok; gerçek yollar `/tr/admin`, `/de/admin`… Kural hiçbir şeyi
   kapsamıyordu.

**Evidence:** yukarıdaki curl çıktısı; `docs/seo-runtime-audit.json` içinde
21 adet `should-be-noindex`.

**Fix:**
- `admin/layout.tsx` artık `export const metadata = { robots: { index: false, follow: false } }`.
  Layout seviyesinde olması, yeni bir admin ekranının direktifsiz eklenememesi
  demek.
- `robots.ts` kuralları `locales`'ten türetiliyor: hem locale'siz form (redirect
  kaynakları için) hem `/{locale}/admin`, `/{locale}/account`, `/{locale}/track`.
  Yeni bir dil eklendiğinde private route'ları otomatik kapsanıyor.

robots.txt bir tarama direktifi, index direktifi değil — bu yüzden ikisi birden
yapıldı. Yasaklı bir URL harici bir linkten yine indexlenebilir.

**Regression test:** `scripts/seo-audit-urls.ts` envanteri `admin`, `admin/login`,
`account*`, `track` route'larını `expect: "noindex"` ile içeriyor;
`should-be-noindex` kuralı ihlali error seviyesinde raporluyor.

**Runtime verification (lokal production build):**

```
/tr/admin        [200] robots=noindex, nofollow
/en/admin/login  [200] robots=noindex, nofollow
```

Üretilen `robots.txt` 21 locale'li Disallow satırı içeriyor.

---

## SEO-007

**Durum:** FIXED — lokal build'de doğrulandı
**Severity:** HIGH
**Category:** indexation / utility route
**Affected files:** `src/app/[locale]/track/page.tsx`, `src/app/robots.ts`
**Affected URLs:** 7 — `/{locale}/track`

**Observed behavior:** `/en/track` ve `/ro/track` HTTP 200, `index, follow`,
kendine referans veren canonical ve 7 dilli tam hreflang kümesi. Aynı zamanda
sitemap'te **yok**. Yani site, Google'a "bu 7 URL indexlenebilir içeriktir"
diyor ama hiçbir zaman göndermiyor.

**Expected behavior:** rezervasyon sorgulama formu bir utility sayfası. `noindex,
follow` — header/footer linkleri equity taşımaya devam etsin.

**Root cause:** sayfa `seoAlternates` + `seoOpenGraph` + `seoTwitter` ile tam bir
içerik sayfası gibi yazılmış; `robots.txt`'teki `/track` kuralı ise locale'siz.

**Fix:** `robots: NOINDEX_ROBOTS`, `alternates` kaldırıldı (noindex bir sayfada
hreflang kümesi, Google'a yok saymasını söylediği 7 URL'yi değerlendirmesini
söylemek olurdu). `robots.txt` locale'li kurallarla kapsıyor.

**Runtime verification (lokal build):**

```
/en/track  [200] robots=noindex, follow | canonical=none
/ro/track  [200] robots=noindex, follow | canonical=none
```

---

## SEO-026

**Durum:** FIXED
**Severity:** LOW
**Category:** indexation
**Affected files:** `src/app/[locale]/[region]/page.tsx`

**Observed behavior:** `generateMetadata`, bulunamayan veya `is_active = false`
olan bir bölge için `{}` dönüyordu. Boş metadata kök layout'un `index, follow`
direktifini miras alır, yani 404 gövdesi indexlenebilir olduğunu iddia ediyordu.
`konyaalti` ve `manavgat` (migration 056, bilerek pasif) bu durumda.

**Fix:** `return { title: "Not Found", robots: NOINDEX_ROBOTS }`.

**Regression test:** `verify-seo-callers.ts` → "aktif bölge indexlenebilir"
(guard'ın yanlışlıkla genişletilmediğini kontrol eder).

---

## SEO-016

**Durum:** FIXED
**Severity:** MEDIUM
**Category:** routing config drift
**Affected files:** `src/proxy.ts`

**Observed behavior:** matcher `"/(tr|en|de|pl|ru|nl)/:path*"` — `ro` yok.

Pratik etkisi yoktu: üçüncü matcher (`/((?!api|auth|_next|_vercel|driver|.*\..*).*)`)
`/ro/*`'yu zaten yakalıyor. Ama dosyadaki dilleri sayan tek satır yedinin altısını
sayıyordu, ve routing'i anlamaya çalışan bir sonraki kişi ona inanırdı.

**Fix:** `ro` eklendi. **Değer olarak literal bırakıldı** — Next dokümantasyonu
(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`,
satır 132) açıkça şunu söylüyor: *"The `matcher` values need to be constants so
they can be statically analyzed at build-time. Dynamic values such as variables
will be ignored."* `locales.join("|")` ile üretmek kuralı düzeltmez, sessizce
siler. Bunu belirten bir yorum eklendi.
