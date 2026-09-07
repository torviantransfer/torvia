# Faz 09 — Romence tutarlılığı

**Durum:** DONE

Romence 7. dil olarak sonradan eklendi (migration 062, 2026). Bu faz, "eklendi"
denen şeyin gerçekte nereye kadar gittiğini ölçtü.

## Tarama yöntemi

Repository genelinde şu kalıplar arandı:

- `["tr","en","de","pl","ru","nl"]` ve permütasyonları
- `Record<Locale, …>` ve `Record<string, …>` locale haritaları
- `locale === "nl"` ile biten ternary zincirleri
- `type Locale = "tr" | … ` yerel tip tanımları
- `availableLanguage` / `inLanguage` schema alanları
- migration'larda `_ro` ile biten kolonlar

## Sonuç: Romence'nin ulaşmadığı 11 yer

| # | Yer | Etki | Bulgu |
| --- | --- | --- | --- |
| 1 | `[region]` `priceLabel` | 22 URL'de literal `undefined` | SEO-001 |
| 2 | `[region]` `fallbackTitle` / `fallbackDesc` | RO sayfada EN başlık | SEO-006 |
| 3 | Ana sayfa `alternates.languages` | 7 ana sayfanın hreflang kümesi bozuk | SEO-005 |
| 4 | Ana sayfa `titleByLocale` / `descriptionByLocale` | RO farklı, tarihli başlık | SEO-027 |
| 5 | `seo_pages` / `regions` / `blog_posts` RO SEO kolonları | 28 kolon yok, kayıt 500 | SEO-003 |
| 6 | `BlogManager` `LOCALES` | RO içerik düzenlenemiyor | SEO-014 |
| 7 | `availableLanguage` (5 yerde) | Schema'da RO yok | SEO-013 |
| 8 | `proxy.ts` matcher | pratikte etkisiz, yanıltıcı | SEO-016 |
| 9 | `SeoManager` bölge oluşturma | `name_ro` yazılmıyor | SEO-023 |
| 10 | İletişim sayfası dil listesi | RO ziyaretçi kendi dilini görmüyor | SEO-024 |
| 11 | `Footer` / `BlogPreview` `Locale` tipleri | bkz. SEO-028 | Faz 18 |

**Romence'nin doğru şekilde ulaştığı yerler** (bunlar zaten sağlıklıydı):
`src/i18n/config.ts` (`locales`, `inlineCopyLocales`, `localeOgTags`,
`localeCurrencies`), `next.config.ts` redirect locale listesi, 5 landing
sayfasının satır içi kopyası, `src/messages/ro.json` (870/870 anahtar),
bölge sayfasının gövde metinleri, `formatDuration`, `StripeCheckoutEmbed`,
`validations.ts`, `sitemap.ts`, `seo.ts`.

---

## SEO-027

**Durum:** FIXED — lokal build'de doğrulandı
**Severity:** MEDIUM
**Category:** locale coverage
**Affected files:** `src/app/[locale]/page.tsx`
**Affected URLs:** `/ro`

**Observed behavior:** `/ro` title'ı
`"Transfer VIP Aeroportul Antalya | Belek, Side, Alanya, Kemer 2026"` —
`meta` namespace'inden geliyor. Diğer altı dil `titleByLocale`'den, Google
Trends'e göre optimize edilmiş kalıptan geliyor. Romence hem farklı kalıpta hem
de sabit "2026" taşıyor.

**Fix:** `titleByLocale.ro` ve `descriptionByLocale.ro` eklendi, diğer altısıyla
aynı kalıpta.

**Runtime verification (lokal build):**
`/ro` → `"Transfer Aeroport Antalya | Transfer Privat Belek, Side, Alanya, Kemer | TORVIAN Transfer"`

---

## SEO-022

**Durum:** FIXED — lokal build'de doğrulandı
**Severity:** MEDIUM
**Category:** metadata tutarlılığı
**Affected URLs:** 7 ana sayfa
**Affected locales:** ro hariç altısı

**Observed behavior:** `<title>` ile `og:title` altı dilde farklı iki metin:

```
/en  title   : "Antalya Airport Transfer | Private Transfer to Belek, Side, Alanya, Kemer"
     og:title: "Antalya Airport VIP Transfer | Belek, Side, Alanya, Kemer 2026"
```

`description` ile `og:description` için de aynı.

**Root cause:** `title` `titleByLocale`'den, `openGraph.title` `t("title")`'dan
okunuyordu. İkinci kaynak hiç güncellenmemiş.

İlginç şekilde `/ro`'da ikisi aynıydı — çünkü `titleByLocale.ro` yoktu ve o da
`t("title")`'a düşüyordu. Yani tutarlılık, iki hatanın birbirini götürmesinden
geliyordu.

**Fix:** her ikisi de tek bir `title` / `description` değişkeninden okuyor.

**Runtime verification (lokal build):** üç dilde `<title>` ile `og:title` aynı
(marka son eki dışında, ki o şablondan geliyor ve og'ye uygulanmıyor).

---

## SEO-013

**Durum:** FIXED — lokal build'de doğrulandı
**Severity:** MEDIUM
**Category:** structured data
**Affected files:** `page.tsx` (×2 schema), `about`, `antalya-airport-transfer`, `[region]`

**Observed behavior:** 5 yerde
`availableLanguage: ["Turkish","English","German","Russian","Polish","Dutch"]`.
Schema, şirketin Romence hizmet vermediğini söylüyor — sitenin tamamı Romence
olmasına rağmen.

**Fix:** `"Romanian"` eklendi.

**Runtime verification (lokal build):** `/en/about` →
`"availableLanguage":["Turkish","English","German","Russian","Polish","Dutch","Romanian"]`

---

## SEO-023

**Durum:** FIXED
**Severity:** MEDIUM
**Affected files:** `src/components/admin/SeoManager.tsx`

Panelden yeni bölge eklerken `name_ro` yazılmıyordu. `name_ro || name_en`
okuması yüzünden sonuç sessizce İngilizce isim oluyordu. Alan artık yazılıyor.

---

## SEO-024

**Durum:** FIXED
**Severity:** MEDIUM
**Affected files:** `src/app/[locale]/contact/page.tsx`, 7 mesaj dosyası

İletişim sayfasının "konuştuğumuz diller" listesi altı bayrak gösteriyordu.
Romence eklendi (`contact.langRomanian`, 7 dilde çeviriyle).
