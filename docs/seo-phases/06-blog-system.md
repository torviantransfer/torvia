# Faz 06 — Blog sistemi

**Durum:** DONE

Yayındaki 188 blog URL'sinin tamamı tarandı (7 dil × değişken sayıda çevrilmiş
yazı). Ayrıntı: `docs/seo-runtime-audit.md`.

| Dil | Yayındaki yazı |
| --- | --- |
| tr | 27 |
| en | 28 |
| de | 28 |
| pl | 27 |
| ru | 27 |
| nl | 26 |
| ro | 25 |

## Blog editörü ↔ SEO editörü kontratı

İki panel aynı yazıyı düzenliyor ve sınırları netleştirildi:

| Alan | Sahibi | Kolon |
| --- | --- | --- |
| Başlık / H1 | Blog editörü | `title_{loc}` |
| Gövde | Blog editörü | `content_{loc}` |
| Özet | Blog editörü | `excerpt_{loc}` |
| Locale slug | Blog editörü | `slug_{loc}` |
| Yayın durumu | Blog editörü | `is_published` |
| SERP title | SEO paneli | `meta_title_{loc}` |
| SERP description | SEO paneli | `meta_description_{loc}` |
| Canonical / robots / OG / Twitter | SEO paneli | ilgili kolonlar |

SEO paneli `title_{loc}`'u salt-okunur gösteriyor (`BLOG_FIELDS.h1 = null`), yani
aynı string iki yerde düzenlenemiyor. Çatışma yok — ama SEO panelindeki
`meta_title_*` **hiç uygulanmıyordu**, bkz. SEO-002 (Faz 01), ve blog editöründe
Romence sekmesi yoktu, bkz. SEO-014 (Faz 02). İkisi de düzeltildi.

---

## SEO-008

**Durum:** FIXED (kod) / BLOCKED (DB migration uygulanmadı)
**Severity:** HIGH
**Category:** duplicate content / cannibalization
**Affected files:** `src/lib/redirects.ts`, `supabase/migrations/071_finish_alanya_duration_consolidation.sql`
**Affected URLs:** 12 (2 yazı × 6 dil)
**Affected locales:** tr, en, de, pl, ru, nl

**Observed behavior:** aynı soruyu yanıtlayan iki yazı, ikisi de yayında, ikisi
de sitemap'te, her biri kendi hreflang kümesiyle:

| Dil | KALAN (`…kac-saat`) | GİDECEK (`…suresi`) |
| --- | --- | --- |
| tr | `antalya-havalimani-alanya-transfer-kac-saat` | `antalya-alanya-transfer-suresi` (308'leniyor) |
| en | `antalya-airport-to-alanya-transfer-time` | `antalya-to-alanya-travel-time` |
| de | `antalya-flughafen-nach-alanya-fahrzeit` | `fahrzeit-antalya-nach-alanya` |
| pl | `transfer-lotnisko-antalya-alanya-ile-trwa` | `antalya-alanya-czas-przejazdu` |
| ru | `skolko-ehat-ot-aeroporta-antalii-do-alanii` | `antaliya-alaniya-vremya-v-puti` |
| nl | `hoe-lang-duurt-transfer-antalya-alanya` | `reistijd-antalya-naar-alanya` |

Başlıklar:
- `"Antalya Airport to Alanya Transfer Time: 2 Hours, 130 km"`
- `"Antalya to Alanya: 130 km and About 2 Hours by Road"`

Aynı sorgu, aynı sayılar, iki URL — beş dilde.

**Expected behavior:** migration 037'nin hedeflediği durum: zayıf olan yayından
kaldırılmış, URL'leri güçlü olana 301'lenmiş.

**Root cause:** iki katmanlı.

1. **Migration 037 çalıştı ama 0 satır güncelledi** (ya da hiç uygulanmadı).
   `UPDATE blog_posts SET is_published = false WHERE slug = 'antalya-alanya-transfer-suresi'`
   — tek bir kolona bakıyor. Yazı bugün yayında; sitemap'te 6 URL'si var.
   Bu, görev tanımı §I'de tarif edilen sınıfın kendisi: SQL hata vermedi,
   iş yapılmadı.
2. **`next.config.ts`'in konsolidasyon haritası dil-bağımsız.** Her dile *aynı*
   eski→yeni slug'ı uyguluyordu. Türkçe yarısı kapsandı (ve semptomu gizledi);
   diğer beş dilin kendi slug'ları hiçbir kurala uymuyordu, yayında kaldılar.

**Evidence:** her iki yazının 6'şar URL'si için production'dan çekilen
title + hreflang kümeleri (yukarıdaki tablo bu ölçümden). Ayrıca
`docs/seo-runtime-audit.json`: `duplicate-title`, `duplicate-description`,
`duplicate-canonical`, `redirected`, `sitemap-redirect`,
5× `hreflang-redirect-target`, 6× `hreflang-not-reciprocal`.

**Fix (üç parça):**

1. `src/lib/redirects.ts` → `LOCALIZED_BLOG_CONSOLIDATION`: beş dilin kendi
   slug'ları için 308 kuralları. Equity kaybolmadan aktarılıyor.
2. `sitemap.ts` → `redirectedBlogSlugs(locale)` ile 308'lenen slug'ları
   listelemiyor. DB düzelmeden önce de sitemap tutarlı.
3. `071_finish_alanya_duration_consolidation.sql` → yazıyı yayından kaldırıyor.
   037'nin hatasını tekrarlamamak için:
   - eşleşme `slug` **veya** herhangi bir `slug_{locale}` üzerinden
   - kalan yazının var ve yayında olduğu önce doğrulanıyor, değilse `RAISE
     EXCEPTION` ile hiçbir şey yapmadan duruyor (yoksa bu sorgu için hiç sayfa
     kalmazdı)
   - `GET DIAGNOSTICS` ile tam 1 satır etkilendiği kontrol ediliyor
   - sonrasında hem kaldırılanın yayından çıktığı hem kalanın yayında olduğu
     yeniden okunuyor

**Regression test:** audit script'inin `duplicate-title`, `duplicate-canonical`,
`sitemap-redirect` ve `hreflang-redirect-target` kuralları.

**Runtime verification:** BLOCKED — migration uygulanmadan production'da
doğrulanamaz. Uygulandıktan sonra `npm run audit:seo` bu 5 bulgu sınıfını
sıfırlamalı.

---

## SEO-018

**Durum:** FIXED
**Severity:** MEDIUM
**Category:** document outline
**Affected files:** `src/app/[locale]/blog/[slug]/page.tsx`
**Affected URLs:** 2 ölçüldü, sınıf olarak bütün yazılar

**Observed behavior:**

```
/en/blog/flughafen-transfer-antalya
  h1[0]: "Flughafen Transfer Antalya: Fixed-Price Rides to Your Hotel"
  h1[1]: "Antalya Airport Transfer: Private, Fixed-Price Rides to Your Hotel"
```

İki H1, biri Almanca anahtar kelimeli bir İngilizce başlık.

**Root cause:** sayfa yazının başlığını `<h1>` olarak render ediyor, ve
`sanitizeHtml` gövdedeki `<h1>` etiketlerine izin veriyor. İçe aktarılmış birkaç
yazının gövdesi kendi `<h1>`'iyle başlıyor.

**Fix:** `transformTags: { h1: "h2" }`. Editör ne yapıştırırsa yapıştırsın
belgede tam olarak bir üst düzey başlık kalıyor.

**Not:** `/en/blog/flughafen-transfer-antalya` — İngilizce URL'de Almanca
anahtar kelimeyle başlayan bir İngilizce yazı. Bu bir *içerik* kararı, teknik
hata değil; §22 gereği ranking alan bir başlığı teknik denetim sırasında
değiştirmedim. Sahibine not olarak bırakılıyor.

---

## Blog denetim özeti

| Kontrol | Sonuç |
| --- | --- |
| base slug + 7 locale slug | hepsi normalize ASCII |
| çevirisi olmayan dilde yayın | yok — `getTranslatedLocales` noindex + birincil dile canonical |
| localized slug'a 301 | çalışıyor (`permanentRedirect` sayfa içinde) |
| eski URL'lerin 404'lenmesi | yok |
| hreflang kümeleri | 1 küme hatalı (SEO-008), gerisi temiz |
| meta title/description override | SEO-002'den sonra çalışıyor |
| kırık görsel | 4 yazı (SEO-010) |
| birden fazla H1 | 2 sayfa (SEO-018) |
