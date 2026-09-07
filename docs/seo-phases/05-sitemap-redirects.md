# Faz 05 — Sitemap ve redirect'ler

**Durum:** DONE

## SEO-009

**Durum:** FIXED
**Severity:** HIGH
**Category:** route collision / sitemap
**Affected files:** `src/app/sitemap.ts`, `src/components/admin/seo/entries.ts`, `src/components/admin/SeoManager.tsx`
**Affected URLs:** 7 — `/{locale}/land-of-legends-transfer`

**Observed behavior:** iki ayrı sorun, tek kök nedenden.

1. `sitemap.xml` bu 7 URL'yi **iki kez** listeliyor. 482 girdinin 7'si tekrar.
2. Bu URL'yi kod içindeki landing sayfası servis ediyor
   (`src/app/[locale]/land-of-legends-transfer/page.tsx`), ama admin panelinde
   aynı URL için ikinci bir editör var — `land-of-legends-transfer` slug'lı bölge
   kaydı. Oraya yazılan hiçbir SEO alanı yayına çıkmıyor.

**Root cause:** `regions` tablosunda `slug = 'land-of-legends-transfer'` olan
aktif bir satır var. Slug zaten `-transfer` ile bittiği için bölge döngüsü
`/{locale}/land-of-legends-transfer` üretiyor — statik sayfa döngüsünün üretmiş
olduğu URL'nin aynısı. App Router'da statik route her zaman `[region]`
dinamiğini yener, dolayısıyla sayfayı landing dosyası servis ediyor.

**Evidence:**

```
$ sort urls.txt | uniq -d
https://torviantransfer.com/de/land-of-legends-transfer
https://torviantransfer.com/en/land-of-legends-transfer
… (7 dil)
```

`/ro/land-of-legends-transfer` production title'ı
`"Transfer Land of Legends | Aeroportul Antalya - Land of Legends"` — landing
dosyasının satır içi Romence metni, bölge şablonu değil. (Bölge sayfası olsaydı
SEO-001 gereği `undefined` içerirdi; içermiyor.)

**Fix:**
- `sitemap.ts` artık bir `seen` kümesi tutuyor; hiçbir URL iki kez yazılamaz.
- Bölge kaydı **silinmedi**: fiyat, mesafe ve koordinat taşıyor, rezervasyon
  akışı ona bağlı. Silmek rezervasyonu bozardı.
- Panel artık yalan söylemiyor: `FILE_ROUTE_SHADOWED` haritası ve editörde
  turuncu bir uyarı — "Bu adresi bu kayıt üretmiyor… SEO'sunu Landing →
  land-of-legends-transfer kaydından düzenleyin."

**Regression test:** audit script'i `duplicateSitemapUrls` listesini raporun
başına yazıyor; boş olmalı.

---

## SEO-008

**Durum:** FIXED (kod) / BLOCKED (DB)
**Severity:** HIGH
**Category:** duplicate content / stale migration
**Affected files:** `src/lib/redirects.ts` (yeni), `next.config.ts`, `src/app/sitemap.ts`, `supabase/migrations/071_finish_alanya_duration_consolidation.sql` (yeni)
**Affected URLs:** 6

Ayrıntılı analiz Faz 06'da. Sitemap/redirect tarafı:

- `sitemap.ts` artık `redirectedBlogSlugs(locale)`'i okuyor ve next.config'in
  308'lediği slug'ları yazmıyor. Böylece "Gönderilen URL yönlendirme içeriyor"
  hatası, DB düzelmeden önce de ortadan kalkıyor.
- Bütün redirect kuralları `src/lib/redirects.ts`'e taşındı; `next.config.ts` ve
  `sitemap.ts` aynı listeyi okuyor. Ayrı durdukları sürece sitemap'in bir URL'nin
  308'lendiğini bilmesinin yolu yoktu — ve tam olarak bu oldu.

---

## Sitemap denetimi

| Kontrol | Önce | Sonra |
| --- | --- | --- |
| Toplam girdi | 482 | 475 benzersiz (7 tekrar giderildi) |
| Tekrar eden URL | 7 | 0 |
| 404 veren URL | 0 | 0 |
| Yönlendiren URL | 1 | 0 |
| noindex URL | 0 | 0 (ve artık `noindex` kolonu da okunuyor) |
| Eksik indexlenebilir URL | 0 | 0 |
| Görsel URL'leri mutlak | ✅ | ✅ |
| DB hatası durumunda | boş sitemap | boş sitemap (değişmedi) |

**Not:** sitemap bir Route Handler ve varsayılan olarak cache'li (Next 16 doc:
*"`sitemap.js` is a special Route Handler that is cached by default"*).
`revalidateForTable` bölge ve blog yazımlarında `/sitemap.xml`'i zaten
temizliyordu; `seo_pages` için de eklendi (SEO-015).

## Redirect denetimi

`next.config.ts` + sayfa içi `redirect()`/`permanentRedirect()` + next-intl
middleware birlikte incelendi.

| Kontrol | Sonuç |
| --- | --- |
| 301/308 vs 307 | tarama sonucu: tek redirect 308. Geçici yönlendirme yok. |
| Zincir (>1 adım) | yok |
| Döngü | yok |
| Ölü hedef | yok |
| Eski bölge URL'leri | 36 slug × 7 dil, `-transfer` ekleniyor |
| `-transfer-transfer` | kapsanıyor |
| Locale'siz URL'ler | 24 aktif bölge + 12 sayfa, 308 |
| Eski blog URL'leri | 5 paylaşılan slug + 5 locale'e özel slug (yeni) |
| Türkçe noktalı/noktasız ı | `uber-antalya-havalimanı-ulasim` kapsanıyor |
| Romence dahil bütün diller | ✅ (`locales`'ten üretiliyor) |

Denetim, `LOCALIZED_BLOG_CONSOLIDATION` yapısını gerektiren bir boşluk buldu:
mevcut `BLOG_CONSOLIDATION` haritası her dile **aynı** eski→yeni slug'ı
uyguluyordu, ama diline göre farklı slug taşıyan bir yazı için bu yetmiyor.
Alanya kümesinin Türkçe yarısı kapsanıyor, İngilizce/Almanca/Lehçe/Rusça/
Hollandaca yarıları kapsanmıyordu (bkz. Faz 06).
