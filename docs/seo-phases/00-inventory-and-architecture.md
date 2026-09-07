# Faz 00 — Envanter ve Mimari

**Durum:** DONE

## Amaç

Kod değiştirmeden önce, siteyi kimin ne şekilde ürettiğini ve Google'ın gerçekte
ne gördüğünü ölçmek.

## Yapılanlar

1. `src` altındaki 200+ dosya, 73 migration ve `next.config.ts` okundu.
2. `scripts/seo-inventory.ts` yazıldı — URL envanterini üç bağımsız kaynaktan
   üretir ve aralarındaki farkı raporlar:
   - filesystem route'ları (`src/app/[locale]/**`)
   - `/api/regions` (aktif bölgeler)
   - `sitemap.xml`
3. `scripts/seo-audit-urls.ts` yeniden yazıldı: 8 örnek URL yerine **531 URL**.
4. Production'a karşı tam tarama yapıldı → `docs/seo-runtime-audit.{md,json}`.

## Ölçülen mimari

Bkz. `docs/seo-master-audit.md` §1.

Özet: her indexlenebilir sayfanın metadata'sı tek bir merge fonksiyonundan
geçiyor (`src/lib/seoOverrides.ts → applyOverrides`), ama **fallback'i üreten
kod her tabloda farklı** — ve hatalar oradaydı, merge fonksiyonunda değil.

## İlk taramanın sonucu (fix'lerden önce, production)

```
TOTAL URLS        531
PASSED            466
FAILED            65
404 ERRORS        0
CANONICAL ERRORS  1
HREFLANG ERRORS   13
METADATA ERRORS   18
```

Bu tarama, `undefined` sızıntısını **yakalayamadı**: ilk `placeholder-leak`
kuralı `\bundefined\b` kullanıyordu ve production'daki hata metnin ortasına
yapışmıştı ("2 oreundefined"), yani sol tarafta kelime sınırı yoktu. Kural
düzeltildikten sonra aynı tarama 22 Romence bölge sayfasını yakaladı.

**Ders kayda geçirildi:** bir denetim kuralının kendisi de yanlış olabilir; kural
bilinen bir hatayı yakalayabildiği kanıtlanmadan güvenilmez. `verify:seo` için
aynı yaklaşım uygulandı (bkz. Faz 02).

## Route sınıflandırması

Hiçbir route `UNKNOWN` bırakılmadı — tam tablo `docs/seo-master-audit.md` §2.

| Sınıf | Adet URL |
| --- | --- |
| INDEXABLE COMMERCIAL | 224 |
| INDEXABLE INFORMATIONAL | 223 |
| INDEXABLE (LEGAL) | 35 |
| NOINDEX UTILITY | 21 |
| PRIVATE/ADMIN | 35 |

## Bulgular

### SEO-020

**Durum:** FIXED
**Severity:** MEDIUM
**Category:** tooling / audit coverage
**Affected files:** `scripts/seo-audit-urls.ts`
**Affected URLs:** tamamı (tarama kapsamı)
**Affected locales:** özellikle `ro` — hiç örneklenmiyordu

**Observed behavior:** `npm run audit:seo` sabit 7 URL + sitemap'ten seçilen 1
blog yazısı tarıyordu. Hedef listesinde `/ro` ile başlayan tek bir URL yoktu.
Script "0 hata" diyordu.

**Expected behavior:** aktif/indexlenebilir bütün URL'lerin taranması.

**Root cause:** `TARGETS` sabit dizisi.

**Evidence:** fix'ten önceki çalıştırma — `Sayfa 8 / Teknik hata 0`. Aynı anda 22
Romence bölge sayfasının title'ında literal `undefined` vardı.

**Fix:** `scripts/seo-inventory.ts` + `scripts/seo-audit-urls.ts` yeniden yazıldı.
531 URL, redirect zinciri takibi, hreflang karşılıklılık grafiği, duplicate
title/description/canonical, og:image HTTP kontrolü, iç link grafiği,
`docs/seo-runtime-audit.{md,json}` çıktısı. `SEO_AUDIT_SCOPE=sample` eski hızlı
mod olarak kaldı ama varsayılan değil.

**Regression test:** scriptin kendisi; hata varken exit code 1 döner.

**Runtime verification:** 531/531 URL tarandı, rapor `docs/seo-runtime-audit.md`.
