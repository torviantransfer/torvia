# 10 — Final Lokal Doğrulama

**Tarih:** 2026-09-08
**Kapsam:** repository + hazırlanmış migration'lar + lokal production build.
Deploy yapılmadı, Supabase'e bağlanılmadı, commit/push yapılmadı.

## §49 — production burada başarı kriteri değil

Bu görevde deployment yok. `docs/seo-runtime-audit.json` production'ın
**deploy öncesi** halini ölçüyor; oradaki 89 FAIL birinci audit'in kayıtlı
bulgularıdır ve deploy + migration 070–073 ile kapanır.

`verify:growth` bu ayrımı kodda taşıyor: iki koşul (RO başlıklarındaki
`undefined`, Alanya yönlendirmesi) production'dan okunur ama **repo düzeltmesi**
üzerinden assert edilir; production sayısı "deploy bekliyor" olarak raporlanır.

## Test sonuçları

| Test | Sonuç |
| --- | --- |
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| Değiştirilen dosyalarda ESLint | **0 hata** |
| `npm run verify:seo` (birinci audit regression) | **PASS** |
| `npm run verify:fixes` (rendered HTML, finding ID başına) | **PASS** |
| `npm run verify:growth` (bu görev) | **PASS** |

Birinci audit'in test kontratları bu görevin değişikliklerinden sonra da
geçiyor — kırılmadı.

## `verify:growth` neyi doğruluyor

§39'un istediği kontroller, §40'ın yasakladığı keyword-density testi olmadan:

- keyword map envanteri kapsıyor, envanter dışı URL içermiyor
- **hiçbir keyword cluster aynı locale'de iki URL'ye atanmamış** (§11)
- sahipsiz cluster yok; dört ticari cluster 7 dilde de sahipli
- hedef URL'lerin hiçbiri noindex değil
- hiçbir hedefte boş title / boş H1 yok
- indexlenebilir ticari hedeflerin tamamı sitemap'te
- GROWTH-001'in üç koşulu kodda (recency sorgusu gitti, çeviri filtresi var,
  İngilizce fallback kalmadı)
- 074 ve 075 mevcut ve beklenen değişikliği içeriyor
- **070–073 korunmuş** (§50)
- **footer'ın 4 ticari linki korunmuş** (§53)
- autocomplete araştırması dosyada ve NL kararının dayandığı ölçüm yeniden
  doğrulanabiliyor
- 11 dokümanın tamamı mevcut

## Lokal render doğrulaması

`npm run build && npm run start` sonrası `verify:fixes` çalıştırıldı —
7 dil × admin/track/legal/homepage/footer.

**Sınır:** lokal runtime'da Supabase kimlik bilgisi yok. Bu nedenle region ve
blog gövdeleri render edilemiyor; bu sayfaların metadata'sı `verify:seo`
içindeki caller testleriyle (page modüllerini import edip metadata
üreticilerini çağırarak) doğrulanıyor.

**Kod seviyesi ve migration seviyesi ayrı:**

| Değişiklik | Kod | Migration | Lokal doğrulandı |
| --- | --- | --- | --- |
| GROWTH-001 ilgili yazılar | ✅ | — | tsc + build + verify:growth |
| GROWTH-002/003/004 override'lar | — | 074 | migration içeriği; etkisi DB'ye bağlı |
| GROWTH-005 NL (geri alındı) | ✅ | — | verify:fixes |
| GROWTH-006 blog başlığı | — | 075 | migration içeriği; etkisi DB'ye bağlı |

Migration'lar **uygulanmadı**, dolayısıyla 074/075'in rendered HTML etkisi bu
ortamda ölçülemez. Uygulandıktan sonraki doğrulama komutları
`09-content-migrations.md` sonunda.

## 7 dil QA (§46)

`docs/seo-runtime-audit.json` üzerinden, 531 URL:

| Kontrol | Sonuç |
| --- | --- |
| Karışık dilli içerik | 1 bulundu (`title_en` Almanca) → GROWTH-006 |
| Çevrilmemiş fallback (iki dil aynı title) | 0 |
| Bozuk HTML | 0 |
| H1 yok | 0 |
| Birden fazla H1 | 2 → birinci audit'te kodla çözüldü |
| Aynı locale'de duplicate title | 18 → 14'ü admin (SEO-004), 2'si Alanya (071), 2'si `/nl/kvkk`+`/nl/privacy` (074) |
| Aynı primary keyword cluster'a iki sahip | **0** (verify:growth ile assert ediliyor) |
| `html lang` = locale | 531/531 |
| Türkçe ı/İ, Lehçe ł/ń, Kiril, Romence diakritik | Mesajlar 7 dilde 870/870 anahtar; render'da bozulma yok |

**Hollandaca doğallık** ayrıca incelendi ve bir kararın geri alınmasına yol açtı
(GROWTH-005).

## İç link ölçümü (§26)

Birinci audit'in footer düzeltmesi sonrası ölçüm (`docs/seo-runtime-audit.md`,
"İç link dağılımı"): 7 dilde ortalama 28,5–29,6 gelen link, orphan 0.

Bu görevin GROWTH-001'i **blog katmanındaki** dağılımı düzeltiyor:

| | Önce | Sonra (beklenen) |
| --- | --- | --- |
| En son yayımlanan 2 yazı | 28'er link | konusal olarak dağılmış |
| Gösterim üreten yazılar (Uber, taksi, alanya) | 1'er link | konu eşleşmesine göre |
| Çevirisi olmayan locale'e link | var | yok |

Kesin sonraki sayı deploy sonrası `npm run audit:seo` ile ölçülecek — raporun
"İç link dağılımı" tablosu bu ölçümü zaten üretiyor.

## Bilinen ve kasıtlı olarak açık bırakılanlar

| Konu | Neden |
| --- | --- |
| CANN-01, CANN-02 konsolidasyonu | GSC gerekiyor; kanıtsız hayatta kalan seçmek migration 030'un hatası |
| `thin-content` × 6 (`/contact`) | Niyet 240 kelimede karşılanıyor (§27) |
| Manavgat aktivasyonu | Gerçek fiyat gerekiyor (§42) |
| Sosyal kanıt / yorum | Gerçek yorum toplanmalı; sahte yorum yasak (§24) |
| SEO-030 (availability API) | Rezervasyon davranışı, bu görevin kapsamı dışı (§52) |
