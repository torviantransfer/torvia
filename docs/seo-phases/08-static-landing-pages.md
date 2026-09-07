# Faz 08 — Statik ve landing sayfalar

**Durum:** DONE

## page_key → route → okuma zinciri

Her `seo_pages` satırı için: panelde alan var mı, sayfa onu okuyor mu?

| page_key | route | `getSeoPage` | `applySeoPage` | `seoH1` | `seoIntro` |
| --- | --- | --- | --- | --- | --- |
| home | `` | ✅ | ✅ | ❌ | ❌ |
| antalya-airport-transfer | `antalya-airport-transfer` | ✅ | ✅ | ✅ | ✅ |
| vip-transfer-antalya | `vip-transfer-antalya` | ✅ | ✅ | ✅ | ✅ |
| hotel-transfer-antalya | `hotel-transfer-antalya` | ✅ | ✅ | ✅ | ✅ |
| lara-beach-transfer | `lara-beach-transfer` | ✅ | ✅ | ✅ | ✅ |
| land-of-legends-transfer | `land-of-legends-transfer` | ✅ | ✅ | ✅ | ✅ |
| booking | `booking` | ✅ | ✅ | ❌ | ❌ |
| regions | `regions` | ✅ | ✅ | ✅ | ✅ |
| blog | `blog` | ✅ | ✅ | ❌ | ❌ |
| about | `about` | ✅ | ✅ | ✅ | ✅ |
| contact | `contact` | ✅ | ✅ | ✅ | ✅ |
| faq | `faq` | ✅ | ✅ | ✅ | ✅ |
| cancellation | `cancellation` | ✅ | ✅ | ❌ | ❌ |
| privacy | `privacy` | ✅ | ✅ | ❌ | ❌ |
| terms | `terms` | ✅ | ✅ | ❌ | ❌ |
| cookies | `cookies` | ✅ | ✅ | ❌ | ❌ |
| kvkk | `kvkk` | ✅ | ✅ | ❌ | ❌ |

Meta title/description/canonical/robots/OG/Twitter override zinciri **17 sayfanın
17'sinde çalışıyor** — production'da kanıtlandı: `/en/regions` title'ı
`"Antalya Airport Transfer Destinations | TORVIAN Transfer"`, kod fallback'i ise
`"Antalya Airport Transfers | Belek, Side, Alanya, Kemer"`. Fark, DB'de bir
`meta_title_en` override'ı olduğunu ve uygulandığını kanıtlıyor.

`h1_*` / `intro_*` sekiz sayfada panelde görünüyor ama sayfa okumuyor. Bunlar
legal sayfalar (sabit hukuki metin), ana sayfa (H1 `HeroSection` bileşeninde,
çeviri dosyasından) ve `blog` / `booking` (dinamik başlıklar). Bu sayfalarda
düzenlenebilir bir H1 alanı sunmak yanıltıcı, ama H1'i DB'den render etmek de
ana sayfanın hero tasarımını DB içeriğine bağlamak demek. Karar: **sayfa
tarafında değişiklik yok**, bulgu kayda geçti — sahibinin isteyeceği davranış
belli değil ve ranking alan bir ana sayfanın H1'ini kendi başıma DB'ye bağlamak
§22'nin yasakladığı sınıfta bir değişiklik olurdu.

---

## SEO-012

**Durum:** FIXED — lokal build'de doğrulandı
**Severity:** MEDIUM
**Category:** title template
**Affected files:** `src/lib/seoOverrides.ts`, 5 legal sayfa
**Affected URLs:** 36 (5 legal × 7 dil + `/en/regions`)

**Observed behavior (production):**

```
/en/privacy  "Privacy Policy | TORVIAN Transfer | TORVIAN Transfer"
/tr/kvkk     "Kişisel Verilerin Korunması | TORVIAN Transfer | TORVIAN Transfer"
/en/regions  "Antalya Airport Transfer Destinations | TORVIAN Transfer | TORVIAN Transfer"
```

**Root cause:** kök layout `title.template: "%s | TORVIAN Transfer"` tanımlıyor.
Beş legal sayfa markayı kendi de ekliyordu (`${t("heading")} | TORVIAN Transfer`).
`/en/regions` ise DB override'ından geliyor — bir editör panele tam bir title
yazarken şablonun varlığını bilemez.

**Fix:** iki taraflı.
1. Beş legal sayfadan elle eklenen marka kaldırıldı (kök neden).
2. `applyOverrides` sonunda: marka ile biten bir title `title.absolute` olarak
   dönüyor — Next'in şablondan çıkış mekanizması
   (`node_modules/next/dist/docs/…/generate-metadata.md` §absolute). Bu, DB'den
   gelen ve gelecekte yazılacak değerleri de kapsıyor.

`row` null olduğunda bile uygulanıyor, çünkü markayı iki kez basan sayfaların
çoğunun `seo_pages` satırı boştu.

**Regression test:** `verify-seo-callers.ts` → "markayı zaten içeren title
absolute olarak işaretleniyor", "marka içermeyen title string kalıyor",
"adminden gelen markalı title da iki kez çıkmıyor". Ayrıca audit script'inde
`title-double-brand` kuralı.

**Runtime verification (lokal build):**

```
/en/privacy  "Privacy Policy | TORVIAN Transfer"
/tr/terms    "Hizmet Şartları | TORVIAN Transfer"
/ro/cookies  "Politica de cookie-uri | TORVIAN Transfer"
```

---

## SEO-019

**Durum:** PARTIALLY FIXED — kalanı admin verisi
**Severity:** MEDIUM
**Category:** duplicate title
**Affected URLs:** `/nl/kvkk`, `/nl/privacy`

**Observed behavior:** ikisi de `"Privacybeleid | TORVIAN Transfer | TORVIAN Transfer"`.

**Root cause:** iki ayrı şey.
1. Çift marka → SEO-012 ile düzeldi.
2. `/nl/kvkk` sayfasının H1'i `"Beleid gegevensbescherming"` (çeviri dosyası),
   title'ı `"Privacybeleid"`. Yani `seo_pages.meta_title_nl` kolonunda `kvkk`
   için `/nl/privacy` ile aynı metin duruyor. Bu bir **DB değeri**, kod değil.

**Fix:** kod tarafı yapıldı. Kalan kısım panelden düzeltilmeli — panelin kendi
duplicate tespiti (`src/lib/seoDuplicates.ts`) bu çakışmayı zaten gösteriyor.
Sahibinin yazacağı metni ben seçmiyorum; §22 gereği ranking alan bir metni
kendi başıma değiştirmiyorum.

**Runtime verification:** deploy sonrası `/nl/kvkk` title'ı tek markalı olacak
ama `/nl/privacy` ile aynı kalacak; panelde düzeltilince audit'teki
`duplicate-title` bulgusu sıfırlanır.

---

## SEO-022 / SEO-027 — ana sayfa

Bkz. Faz 09 (Romence tutarlılığı) ve Faz 04 (hreflang).

---

## Landing sayfaların locale kapsamı

Beş satır içi kopyalı landing sayfasının hepsinde 7 dil mevcut
(`grep -nE "^\s*(tr|en|de|pl|ru|nl|ro):" ` her dosyada 7 sonuç veriyor) ve
`inlineCopyLocales` yedisini de içeriyor. Yani hepsi doğru şekilde indexlenebilir
ve sitemap'te. Bu alan zaten sağlıklıydı.
