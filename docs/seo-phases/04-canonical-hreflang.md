# Faz 04 — Canonical ve hreflang

**Durum:** DONE

## Ölçüm yöntemi

`scripts/seo-audit-urls.ts` hreflang'ı tek sayfa üzerinden değil **graf olarak**
denetliyor. Tek bir sayfaya bakarak söylenemeyecek şeyler:

- karşılıklılık (A → B varsa B → A da olmalı)
- kümedeki bir hedefin 404/redirect/noindex olması
- indexlenebilir bir dilin kümede hiç bildirilmemesi

Bunlar ancak bütün küme taranınca kararlaştırılabilir; `SEO_AUDIT_SCOPE=sample`
modunda bu kurallar bilerek kapalı, çünkü eksik veriden yanlış sonuç çıkarmak
hiç sonuç çıkarmamaktan kötü.

---

## SEO-005

**Durum:** FIXED — lokal build'de doğrulandı
**Severity:** HIGH
**Category:** hreflang
**Affected files:** `src/app/[locale]/page.tsx`
**Affected URLs:** 7 ana sayfa
**Affected locales:** 7'sinin tamamı (sadece `ro` değil)

**Observed behavior (production):** `/ro` ana sayfası sitemap'te, canonical'ı
kendini gösteriyor — ve hiçbir ana sayfa, kendisi dahil, `ro` alternatifini
bildirmiyor:

```
/ro → x-default, tr, en, de, pl, ru, nl     (ro YOK)
/en → x-default, tr, en, de, pl, ru, nl     (ro YOK)
```

**Expected behavior:** 7 dil + x-default, karşılıklı.

**Root cause:** `languages` nesnesi elle yazılmıştı ve Romence eklendiğinde
güncellenmedi.

**Neden 7 dili birden etkiliyor:** karşılıklı olmayan bir küme, Google'ın yok
saydığı bir kümedir. `/ro` kendini bildirmediği için küme tutarsız; sinyali
kaybeden sadece Romence ana sayfa değil, yedisi birden.

**Evidence:** `docs/seo-runtime-audit.json` — `/ro` üzerinde `hreflang-no-self`,
`canonical-hreflang-conflict` ve altı `hreflang-not-reciprocal`; diğer altı ana
sayfada `hreflang-incomplete: ro`.

**Fix:** `languages` artık `locales`'ten üretiliyor:

```ts
languages: {
  "x-default": `${BASE_URL}/en`,
  ...Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}`])),
}
```

**Regression test:** audit script'inin `hreflang-incomplete` /
`hreflang-not-reciprocal` / `hreflang-no-self` kuralları.

**Runtime verification (lokal build):** `/tr`, `/en`, `/ro` — üçü de
`x-default, tr, en, de, pl, ru, nl, ro` bildiriyor.

---

## SEO-006

**Durum:** FIXED
**Severity:** HIGH
**Category:** locale fallback
**Affected files:** `src/app/[locale]/[region]/page.tsx`
**Affected locales:** `ro`

**Observed behavior:** `fallbackTitle` ve `fallbackDesc` kayıtlarında `ro` yoktu:

```ts
const dbTitle = dbTitleLocale || fallbackTitle[locale] || (region.meta_title as string | null);
```

Romence kolonu boş bir bölgede zincir `fallbackTitle["ro"]` (undefined) üzerinden
çevrilmemiş genel `meta_title` kolonuna düşüyordu — yani Romence sayfada
İngilizce başlık. Aynı kod yorumunda 2026-08-10 ve 2026-08-24'te `/nl` için
düzeltildiği yazıyor; Romence için tekrarlanmış.

**Fix:** `regionFallbackCopy()` — 7 dil + gerçek `default`. Genel `meta_title` /
`meta_description` kolonları artık hiç kullanılmıyor: locale'e ait şablon her
zaman çevrilmemiş bir kolondan iyidir.

**Regression test:** "ro fallback title'ı Romence şablondan geliyor",
"çevrilmemiş genel meta_title kolonu artık kullanılmıyor".

---

## Canonical denetimi

Tam site taramasında canonical tarafında bulunan tek hata SEO-008'in yan
etkisiydi (bkz. Faz 06): iki yayındaki yazı aynı canonical'ı gösteriyordu.

Kontrol edilen ve **temiz** çıkan başlıklar:

| Kontrol | Sonuç |
| --- | --- |
| self canonical (indexlenebilir sayfalar) | 530/531 doğru |
| cross-locale canonical (çevrilmemiş sayfa → birincil dil) | doğru |
| trailing slash | yok |
| locale'siz canonical | yok |
| host / protokol | hepsi `https://torviantransfer.com` |
| non-ASCII / encoded | yok |
| canonical → 200 final URL | 1 istisna (SEO-008) |
| canonical ↔ hreflang çelişkisi | 1 istisna (SEO-005) |
| `-transfer-transfer` | yok (next.config 308'liyor) |

Admin canonical override'ı `safeCanonical()` ile korunuyor: site dışı veya
bozuk bir değer sessizce düşürülüyor, trailing slash temizleniyor. Bu davranış
`verify:seo` tarafından zaten test ediliyordu ve doğru.
