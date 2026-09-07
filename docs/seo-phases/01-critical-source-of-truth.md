# Faz 01 — Kritik: Source of Truth

**Durum:** DONE

Bu fazdaki üç bulgu da aynı sınıfta: **panelin gösterdiği değer ile Google'ın
aldığı değer aynı değil.**

---

## SEO-001

**Durum:** FIXED (kodda) — production doğrulaması deploy'a bağlı
**Severity:** CRITICAL
**Category:** rendered metadata / locale coverage
**Affected files:** `src/app/[locale]/[region]/page.tsx`
**Affected URLs:** 22 URL — `/ro/{slug}-transfer`, aktif 25 bölgeden fiyatı olan 22 tanesi
**Affected locales:** `ro`

**Observed behavior:** Romence bölge sayfalarının `<title>` etiketi literal
`undefined` kelimesiyle bitiyor. Production'da ölçüldü, 2026-09-07:

```
/ro/alanya-transfer
  <title>Transfer Aeroport Antalya - Alanya | Privat VIP · 2 oreundefined | TORVIAN Transfer</title>
/ro/belek-transfer
  <title>Transfer Aeroport Antalya - Belek | Privat VIP · 30 minundefined | TORVIAN Transfer</title>
/ro/kemer-transfer
  <title>Transfer Aeroport Antalya - Kemer | Privat VIP · 45 minundefined | TORVIAN Transfer</title>
```

22/25 aktif bölgede aynı. Fiyat satırı olmayan 3 bölge (fiyatsız oldukları için)
etkilenmemiş.

**Expected behavior:** Romence fiyat etiketi (`· De la $80`) veya fiyat yoksa
hiçbir şey.

**Root cause:**

```ts
const priceLabel: Record<string, string> = {
  en: …, de: …, pl: …, tr: …, ru: …, nl: …,   // ro YOK
};
…
`${dbTitle}${priceLabel[locale]}`              // priceLabel["ro"] === undefined
```

`Record<string, string>` tipi, olmayan bir anahtar için `undefined` dönmesine
rağmen TypeScript'i uyarmaz (`noUncheckedIndexedAccess` açık değil), ve sonuç
doğrudan template literal'e giriyor. Romence 062 numaralı migration'la eklendi;
bu map güncellenmedi.

**Evidence:** yukarıdaki production HTML çıktısı; `docs/seo-runtime-audit.json`
içinde 24 adet `placeholder-leak` bulgusu.

**Fix:** `priceLabel` kaydı `priceLabelFor(locale, price)` fonksiyonuna
dönüştürüldü — `switch` + gerçek `default`. Bir dil eksik kalırsa artık İngilizce
etiketi alır, `undefined` alamaz. Aynı şekilde `fallbackTitle` / `fallbackDesc`
kayıtları `regionFallbackCopy()` fonksiyonuna dönüştürüldü.

**Regression test:** `scripts/verify-seo-callers.ts` →
"bölge {locale} title'ı temiz (fiyat: 55|yok)" — 7 dil × 2 fiyat durumu × 2 alan
= 28 assertion. Ayrıca `scripts/seo-audit-urls.ts` içindeki `placeholder-leak`
kuralı her taramada title/description/og/h1'i tarar.

Hatanın geri getirilip testin kırıldığı doğrulandı: `priceLabelFor` yerine
6 anahtarlı bir kayıt konduğunda 31 kontrat FAIL veriyor.

**Runtime verification:** deploy sonrası `npm run audit:seo` → `placeholder-leak`
bulgusu 0 olmalı. Şu an 24 (production eski kodu çalıştırıyor).

---

## SEO-002

**Durum:** FIXED
**Severity:** CRITICAL
**Category:** admin override chain
**Affected files:** `src/app/[locale]/blog/[slug]/page.tsx`
**Affected URLs:** 188 yayındaki blog URL'sinin tamamı
**Affected locales:** 7'sinin tamamı

**Observed behavior:** SEO panelinde bir blog yazısına `meta_title_de` yazılıp
kaydediliyor, Supabase'e yazılıyor, panel "Kaydedildi" diyor — ve production
HTML'inde hiçbir değişiklik olmuyor. `meta_description_*` için de aynı.

**Expected behavior:** dolu bir `meta_title_{locale}` kolonu SERP title'ı olmalı;
boşsa `title_{locale}` (yazının H1'i) fallback olmalı. Migration 058 bu kolonları
tam olarak bunun için ekledi.

**Root cause:** iki parçalı ve tek başına hiçbiri hata gibi görünmüyor.

1. `generateMetadata` fallback'i `title_${loc}` ve `excerpt_${loc}`'ten kuruyordu;
   `meta_title_*` / `meta_description_*` kolonlarına **hiç bakmıyordu**
   (`grep meta_title src/app/[locale]/blog/[slug]/page.tsx` → 0 sonuç).
2. Sonra `applyOverrides(..., { rowOwnsMetaText: true })` çağırıyordu.
   `rowOwnsMetaText` bayrağının anlamı "bu kolonları ben zaten okudum, üzerime
   yazma" — ve bayrak, override'ı uygulayacak tek kod yolunu kapatıyor:

```ts
const title = rowOwnsMetaText ? undefined : ov(row, `meta_title_${locale}`);
```

Bayrak bölge sayfası için doğruydu (fiyat ekini korumak için eklenmişti) ve blog
sayfasına kopyalanmıştı — okuma kısmı olmadan.

**Evidence:** kod okuması kesin. `applyOverrides` unit testleri bu davranışı
doğru bulup geçiyordu, çünkü hata `applyOverrides`'ta değil çağıranındaydı.

**Fix:** çağıran artık kolonları gerçekten okuyor:

```ts
const title = ov(post, `meta_title_${loc}`) ?? heading;
const description = ov(post, `meta_description_${loc}`) ?? excerpt;
```

`rowOwnsMetaText: true` yerinde kaldı — artık doğru: çözülen değeri ham kolonun
ezmesini engelliyor.

**Regression test:** `scripts/verify-seo-callers.ts`, gerçek page modülünü import
edip `blogMetadata()` çağırıyor:
- override yokken title yazının başlığı
- override eklenince title override
- og:title da değişiyor
- override boşaltılınca fallback geri geliyor
- 7 dilin her biri ayrı ayrı
- bir dilin override'ı diğer dili etkilemiyor

Hata geri getirildiğinde testler FAIL veriyor (doğrulandı).

**Runtime verification:** BLOCKED — override'ın canlıda göründüğünü kanıtlamak
için Supabase'e yazma yetkisi gerekiyor. Test verisiyle üç seviyenin ikisi
(APPLICATION ve HTML üretimi) kanıtlandı; LEVEL 1 (DB) erişimi yok.

---

## SEO-011

**Durum:** FIXED
**Severity:** HIGH
**Category:** source of truth
**Affected files:** `src/app/[locale]/[region]/page.tsx`, `supabase/migrations/072_region_price_token.sql`
**Affected URLs:** ~150 bölge URL'si (fiyatı olan aktif bölgeler × indexlenebilir diller)
**Affected locales:** 7'sinin tamamı

**Observed behavior:** admin panelinde bir bölgenin meta title'ı
`"Antalya Flughafen Privattransfer | Festpreis"` olarak görünüyor; production
`"Antalya Flughafen Privattransfer | Festpreis · Ab $55"` yayınlıyor. Editör
farkı göremiyor, kapatamıyor, uzunluğunu hesaplayamıyor.

**Expected behavior (görev tanımı §2 ve §12):** admin alanı doluysa aynen
yayınlanmalı; boşsa dinamik fiyatlı fallback kullanılabilir.

**Root cause:**

```ts
const metaTitle = dbTitle
  ? (oneWayPrice && !/[€$]/.test(dbTitle) ? `${dbTitle}${priceLabel[locale]}` : dbTitle)
  : fallbackTitle.en;
```

**Evidence:** `/en/alanya-transfer` production title'ı
`"Antalya Airport to Alanya Transfer | Private VIP · 2h · Book Online · From $80"`
— son parça DB kolonunda yok, kod ekliyor.

**Fix:** iki parçalı sözleşme.

1. Dolu kolon **aynen** yayınlanır.
2. Kolonda `{price}` token'ı varsa, o token bu bölgenin canlı fiyat etiketiyle
   değiştirilir (fiyat yoksa temizce silinir). Token açık, panelde görünür ve
   editörün kontrolünde.

CTR özelliği kayboluyor mu? Hayır: `supabase/migrations/072_region_price_token.sql`,
bugün fiyat eki alan satırların sonuna `{price}` yazıyor — yani yayınlanan HTML
byte-byte aynı kalıyor, ama artık panelde görünüyor ve silinebiliyor.

**Deploy sırası önemli:** önce kod, sonra 072. Ters sırada eski kod title'lara
literal `{price}` basar. Yanlış sıranın maliyeti sadece kod ile 072 arasındaki
pencerede fiyat ekinin görünmemesi.

**Regression test:** `scripts/verify-seo-callers.ts` →
"fiyat eki admin title'ına eklenmiyor", "{price} token'ı fiyat etiketine
dönüşüyor", "fiyat yokken token temiz siliniyor", "token ayraçtan sonra yazılsa
bile ayraç iki kez çıkmıyor".

**Runtime verification:** deploy + 072 sonrası `COMPARE_URL` modu ile
"hiçbir alan değişmedi" kontratı çalıştırılmalı.
