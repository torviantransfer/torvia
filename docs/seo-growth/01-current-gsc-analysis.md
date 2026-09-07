# 01 — Güncel GSC Analizi

## CURRENT GSC ACCESS: BLOCKED

**Kontrol tarihi:** 2026-09-08

Doğrulama:

```
$ grep -rln "searchconsole|search-console|webmasters|GSC_" src scripts
(sonuç yok — Search Console entegrasyonu yok)

$ env | grep -icE "google|gsc|search"
0
```

Repository'de Search Console API entegrasyonu, servis hesabı, kaydedilmiş
export veya kimlik bilgisi **yok**. `src/components/admin/VisitorAnalyticsHistory.tsx`
sitenin kendi `analytics_events` tablosunu okuyor; Google verisi değil.

Bu nedenle bu görevde:

- son 7 / 28 gün, önceki 28 gün, son 3 ay karşılaştırması **yapılamadı**
- query × page eşlemesi **yapılamadı**
- güncel country/device kırılımı **yapılamadı**
- "bu keyword ayda X aranıyor" gibi hiçbir rakam **üretilmedi**

## Kullanılan baseline

`docs/seo-analiz.md` — GSC export'u, 30 Mayıs – 29 Ağustos 2026 (92 gün).
**Historical evidence olarak kullanıldı, bugünün gerçeği olarak değil.**

| | |
|---|---|
| Gösterim | 31.665 |
| Tıklama | 138 |
| CTR | %0,44 |
| Ortalama pozisyon | 15,9 |

Sorgu kümeleri:

| Küme | Gösterim | CTR | Ort. pozisyon |
| --- | ---: | ---: | ---: |
| Bilgi | 5.377 | %0,20 | 12,8 |
| **Ticari** | 3.911 | %0,08 | **65,0** |
| Karşılaştırma | 839 | %0,48 | 12,3 |

Dil bazında:

| Dil | Gösterim | Tıklama | CTR | Ort. poz |
| --- | ---: | ---: | ---: | ---: |
| en | 14.910 | 34 | %0,23 | 20,6 |
| tr | 6.306 | 31 | %0,49 | 15,6 |
| ru | 5.620 | **36** | **%0,64** | 10,0 |
| pl | 2.988 | 12 | %0,40 | **7,6** |
| de | 798 | 6 | %0,75 | 15,6 |
| **nl** | **63** | **0** | %0,00 | 16,6 |

## §34 — Eski hipotezlerin bugünkü durumu

GSC olmadan sorgu bazlı doğrulama yapılamadı. Yapılabilen: **repo ve canlı
production üzerinden yapısal doğrulama.** Her satırda ne doğrulandığı ve neyin
doğrulanamadığı ayrı yazıldı.

| # | Eski hipotez | Bugün | Yöntem |
| --- | --- | --- | --- |
| 1 | Ticari sorgular çok düşük sırada | **Doğrulanamadı (GSC yok).** Yapısal sebep bulundu: ticari head term'ler dil başına 3–5 URL'ye bölünmüş (bkz. `05-cannibalization.md`). | repo + canlı HTML |
| 2 | Karşılaştırma içeriği ticari landing'lerden iyi ranking alıyor | **Doğrulanamadı.** Ama karşılaştırma envanteri genişlemiş: shuttle-vs-private ve car-rental-vs-transfer yazıları artık var (eski raporda "boşluk" denmişti). | sitemap |
| 3 | Lehçe en güçlü locale | **Dolaylı destek.** Canlı Lehçe SERP'te global agregatör yok; alan Polonya seyahat acentelerinde (metintour.pl, turcjatour.pl, alanyawycieczki.pl). En zayıf rekabet alanı. | canlı SERP |
| 4 | Rusça click üretiyor | **Doğrulanamadı.** | — |
| 5 | Hollandaca URL'ler zayıf | **Yapısal sebep bulundu.** `/nl` ana sayfasının başlığı İngilizce head term ile başlıyordu ("Antalya Airport Transfer"), Hollandaca SERP'te 8 sonucun 7'si "luchthaven" kullanıyor. GROWTH-005 ile düzeltildi. | canlı SERP + repo |
| 6 | Hollanda trafiği İngilizce sayfalara gidiyor | **5 ile aynı sebep.** Doğrulanamadı ama mekanizma tutarlı. | — |
| 7 | İngilizce ticari sorgular pozisyon 50+ | **Rekabet doğrulandı.** Canlı İngilizce SERP'te ilk 10'un 3'ü tek başına Viator; kalanı yerleşik operatörler ve agregatörler. İçerikle kapanacak bir fark değil. | canlı SERP |
| 8 | Uber/Havaş sayfaları fırsat | **Sayfalar yayında ve sağlıklı.** Uber yazısı 7 dilden 6'sında var (nl eksik). | sitemap |
| 9 | Alanya duration konsolidasyonu tek URL'ye gidiyor mu | **Hayır — hâlâ iki yazı yayında.** Birinci audit'te SEO-008 olarak kayıtlı; migration 071 hazır, uygulanmadı. | canlı HTML |
| 10 | Otel adlı sorgular büyüyor mu | **Doğrulanamadı (GSC yok).** Eski ölçüm 13 gösterimdi; planlanabilir fırsat değil. Aksiyon alınmadı. | — |

## Erişim açıldığında ilk çalıştırılacak sorgular

Bu görevin gated bıraktığı iki konsolidasyon kararı buna bağlı
(`09-content-migrations.md`):

1. `page` filtresi `/blog/hotel-transfer-antalya-airport` ve
   `/blog/antalya-airport-hotel-transfer` — hangisi gösterim/tıklama alıyor?
2. `page` filtresi `/blog/flughafen-transfer-antalya` ve
   `/blog/antalya-airport-transfer-guide` — aynı soru.
3. `query` filtresi `hotel transfer antalya` — hangi URL'ye düşüyor?
4. Country = Netherlands, dimension = page — Hollanda trafiği hâlâ İngilizce
   URL'lere mi düşüyor? (GROWTH-005'in etkisini ölçmek için deploy öncesi ve
   sonrası.)
