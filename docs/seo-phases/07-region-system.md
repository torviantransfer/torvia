# Faz 07 — Bölge sistemi

**Durum:** DONE

25 aktif bölge × 7 dil = 175 URL tarandı. Pasif iki bölge (`konyaalti`,
`manavgat`) migration 056 gereği bilerek kapalı; sitemap'te yok, doğru davranış.

## Bulgular

Bu fazın üç bulgusu başka fazlarda ayrıntılandırıldı çünkü kök nedenleri oraya
ait:

| ID | Nerede |
| --- | --- |
| SEO-001 — RO title'larında `undefined` | Faz 01 |
| SEO-006 — RO fallback şablonu yok | Faz 04 |
| SEO-011 — fiyat eki admin metnini eziyor | Faz 01 |
| SEO-009 — `land-of-legends-transfer` çakışması | Faz 05 |
| SEO-026 — pasif bölge indexlenebilir metadata | Faz 03 |

## Bölge başına denetlenen alanlar

Her aktif bölge × her indexlenebilir dil için:

| Alan | Kaynak | Durum |
| --- | --- | --- |
| DB slug → route | `slug` (+`-transfer`) | ✅ |
| name | `name_{loc}` → `name_en` | ✅ 7 dil |
| description | `description_{loc}` | ✅ |
| meta title | `meta_title_{loc}` → locale şablonu | ✅ (SEO-001/006/011 sonrası) |
| meta description | `meta_description_{loc}` → locale şablonu | ✅ |
| H1 | `h1_{loc}` → locale şablonu | ✅ 7 dil |
| focus keyword / keywords | panel planlama alanı, HTML'e basılmıyor | ✅ doğru |
| canonical | self, `{BASE}/{loc}/{slug}-transfer` | ✅ |
| noindex | `noindex` kolonu → `applyOverrides` | ✅ + sitemap (SEO-015) |
| OG / Twitter | `og_*`/`twitter_*` → meta → sayfa | ✅ |
| fiyat türevli metadata | artık yalnızca `{price}` token'ı ile | ✅ (SEO-011) |
| görsel | `og_image_url` → `image_url` → `regionImages` map | ✅ |
| görsel alt | `image_alt` → `"{name} Transfer"` | ✅ |
| sitemap | tekrarsız, `noindex` dahil | ✅ (SEO-009/015) |
| iç linkler | ortalama 6–69 | ⚠ bkz. Faz 18 |

## Admin override × fiyat eki — iki davranış ayrı test edildi

`scripts/verify-seo-callers.ts`:

1. **Admin dolu** → `regionMetadata({meta_title_de: "…Festpreis"}, "de", 55)`
   → title tam olarak `"…Festpreis"`. Fiyat eklenmiyor. og:title da aynı.
2. **Admin boş** → fallback şablonu, fiyat etiketiyle
   (`"…| Privat VIP · De la $55 · 30 min"`).
3. **Admin dolu + `{price}`** → token canlı fiyata dönüşüyor; fiyat yoksa
   token ve arkasında kalan ayraç temizleniyor.

## Bölge cross-link mesh'i

Kod, her bölge sayfası için 4 coğrafi komşu + 2 popüler destinasyon seçiyor.
Ölçüm bunun çalıştığını doğruluyor: küçük bölgeler (Evrenseki, Kızılağaç,
Kargıcak) artık 6 iç link alıyor — daha önceki "yıldız" yapıda 0 alıyorlardı.

Kalan zayıf noktalar Faz 18'de.
