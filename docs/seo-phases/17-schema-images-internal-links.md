# Faz 17 — Structured data, görseller, iç linkler

**Durum:** DONE

## Structured data envanteri

531 sayfanın tamamından JSON-LD blokları ayrıştırıldı.

| Sayfa tipi | Emitlenen tipler |
| --- | --- |
| home (7) | Organization, LocalBusiness, WebSite, TaxiService, BreadcrumbList, FAQPage |
| landing (42) | TaxiService, FAQPage, BreadcrumbList |
| region (168) | TaxiService, BreadcrumbList, FAQPage, HowTo |
| static/regions (7) | Organization, LocalBusiness, FAQPage, ItemList |
| blog-post (188) | BlogPosting, BreadcrumbList, FAQPage (57'sinde) |
| blog-index (7) | yok |
| legal (35) | yok |
| utility / private | yok |

**Geçersiz JSON-LD: 0.** Bütün bloklar `JSON.parse` ile ayrıştırılabiliyor.

### Denetlenen ve doğru bulunanlar

| Kontrol | Sonuç |
| --- | --- |
| Görünür içerikle uyum | FAQPage soruları sayfadaki FAQ bölümüyle aynı (`t("faqQ*")` / `faqHotelsQ`) |
| URL | `provider.url`, `availableChannel.serviceUrl`, breadcrumb `item` — hepsi mutlak ve canonical ile uyumlu |
| Language | `WebSite.inLanguage` sayfa locale'i |
| Image | og:image ile aynı kaynaktan |
| Price | `AggregateOffer` 35–180 USD; `priceCurrency: "USD"` — sayfadaki `$` ile tutarlı |
| Reviews / rating | `productSchema` yalnızca 5+ onaylı yorum varken emitleniyor; kaynağı iddia etmiyor |
| `availableLanguage` | ❌ Romence yoktu → SEO-013, düzeltildi |
| Duplicate schema | yok |
| Yanlış tip | yok |

### Google guideline riski

`region` sayfalarındaki `HowTo` bloğu dikkat çekildi. Google, HowTo zengin
sonuçlarını Ağustos 2023'te masaüstü ve mobilde tamamen kaldırdı; blok artık
zengin sonuç üretmiyor ama bir ihlal de değil ve görünür içerikle uyumlu.
**Değişiklik yapılmadı** — kaldırmak bir kazanç sağlamaz, riski de yok.

`LocalBusiness` üzerindeki `aggregateRating` self-serving review sınıfında.
Kodun kendi yorumu bunu zaten kabul ediyor ve asıl yıldız üretimi ayrı bir
`Product` düğümüne bırakılmış. Bu doğru ayrım; dokunulmadı.

### Legal sayfalarda schema yok

35 legal URL'de hiç JSON-LD yok. Bu bir eksiklik değil: bir gizlilik politikası
için doğru schema tipi yok ve `Article` iddia etmek yanlış olur.

---

## SEO-010

**Durum:** FIXED (migration hazır)
**Severity:** HIGH
**Category:** broken assets
**Affected files:** `supabase/migrations/073_fix_missing_blog_images.sql`
**Affected URLs:** 28 (4 yazı × 7 dil)

**Observed behavior:** 4 blog yazısının `image_url` değeri 404 dönen dosyaları
gösteriyor:

```
/images/blog/gece-transfer.jpg        antalya-24-7-airport-transfer
/images/blog/kas-transfer.jpg         antalya-airport-to-kas-transfer
/images/blog/transfer-fiyatlari.jpg   antalya-airport-transfer-prices
/images/blog/mercedes-vito-vip.jpg    mercedes-vito-vip-transfer-antalya
```

`public/images/blog/` içinde 11 dosya var; bu dördü yok.

`image_url` üç yerde kullanılıyor — sayfadaki hero (`next/image`), og:image +
twitter:image, ve BlogPosting schema'sının `image` alanı. Yani her biri: boş
hero, thumbnail'siz paylaşım kartı, geçersiz schema alanı. Yedi dilde.

**Evidence:** `docs/seo-runtime-audit.json` — 28 `og-image-broken` bulgusu;
og:image HTTP durum dağılımı `{200: 503, 404: 28}`. Production'da hero'nun da
kırık olduğu `_next/image?url=%2Fimages%2Fblog%2Fmercedes-vito-vip.jpg` ile
doğrulandı.

**Root cause:** blog editörü `image_url` alanına herhangi bir string kabul
ediyor ve hiçbir yerde dosyanın var olup olmadığı kontrol edilmiyor. 008, 009 ve
014 numaralı migration'lar aynı sorunun daha önceki partilerini düzeltmiş — yani
bu tekrar eden bir sınıf.

**Fix:** `073_fix_missing_blog_images.sql`. Var olan dosyalarla eşleştirme,
dosya adı benzerliğine değil **ne gösterdiğine** göre seçildi:

| Ölü yol | Yerine | Neden |
| --- | --- | --- |
| `blog/mercedes-vito-vip.jpg` | `vehicles/mercedes-vito-vip.png` | Yazının konusu olan aracın kendi fotoğrafı; yol yanlıştı, dosya duruyordu |
| `blog/kas-transfer.jpg` | `regions/kas-beach-og.jpg` | Gerçek Kaş fotoğrafı, zaten 1200×630 JPG sosyal kardeş |
| `blog/gece-transfer.jpg` | `havaalani-vip-transfer.jpg` | Dış hatlar terminalinde Vito — 7/24 varış yazısının konusu |
| `blog/transfer-fiyatlari.jpg` | `two-cars.webp` | Fiyatın değiştiği iki araç sınıfı yan yana |

Migration yalnızca hâlâ ölü yolu tutan satırlara dokunuyor, yani sahibi panelden
başka bir fotoğraf seçtiyse üzerine yazmıyor. Sonunda dört yolun hiçbirinin
kalmadığını doğrulayan bir postcondition var; bulunamayan her yol için `RAISE
WARNING`, kalan varsa `RAISE EXCEPTION`.

**Regression test:** `scripts/seo-audit-urls.ts` her og:image'ı HEAD ile
kontrol ediyor; 200 dışı bir yanıt `og-image-broken` error'u.

**Runtime verification:** BLOCKED — migration uygulanmadan doğrulanamaz.

---

## Görsel alt metinleri

531 sayfanın **hiçbirinde** alt'sız `<img>` yok. Bölge ve blog sayfaları
`image_alt` kolonunu ya da açıklayıcı bir fallback'i kullanıyor
(`"{name} Transfer"`). Bu alan sağlıklıydı; değişiklik yapılmadı.

---

## İç link grafiği

`scripts/seo-audit-urls.ts` artık her sayfanın aynı origin'li `<a href>`
linklerini topluyor ve **yalnızca indexlenebilir sayfalardan gelen** linkleri
sayıyor. Sonuçlar Faz 18'de.
