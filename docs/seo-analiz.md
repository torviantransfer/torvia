# SEO ve Dönüşüm Analizi — Torvian Transfer

**Veri kaynağı:** Google Search Console, `torviantransfer.com`, 30 Mayıs – 29 Ağustos 2026 (92 gün)
**Dosyalar:** `Sorgular.csv` (1.000 sorgu), `Sayfa sayısı.csv` (256 URL), `Ülkeler.csv` (138 ülke), `Cihazlar.csv`
**Hazırlanma:** 1 Eylül 2026 · Yalnızca analiz, kod değişikliği yapılmadı

> GSC'nin 1.000 satır sınırı nedeniyle sorgu dosyası tam evren değil. Sayfa dosyası (31.665 gösterim) sorgu dosyasından (10.805 gösterim) daha kapsamlı; oran hesaplarında hangisinin kullanıldığı her tabloda belirtildi.

---

## Özet: üç sayı

| | |
|---|---|
| **31.665** | toplam gösterim (92 gün) |
| **138** | toplam tıklama |
| **%0,44** | tıklama oranı |

Ortalama pozisyon 15,9. Bu pozisyonda sektör normali %1,5–2,5 TO'dur; beklenen 400–800 tıklama yerine 138 alınmış. **Sorun sıralama değil, sıralamanın tıklamaya dönüşmemesi.**

---

## Tespitlerinin doğrulanması

| # | Tespit | Sonuç |
|---|---|---|
| 1 | Bilgi sorguları poz 6-12 / TO %0-1, ticari sorgular poz 40-95 | ✅ **Doğrulandı** — Bilgi poz 12,8 TO %0,20 · Ticari poz 65,0 TO %0,08 |
| 2 | "kaç km" cevap kutusu yüzünden tıklanmıyor, ticari niyeti yok | ⚠️ **Kısmen** — düşük TO doğrulandı (%0,20), ama cevap kutusu **kanıtlanamadı**; GSC SERP özelliği vermiyor. Ticari niyet yokluğu doğru. |
| 3 | Otel adlı sorgular geliyor ve en yüksek niyetli | ⚠️ **Niyet doğru, hacim yanlış** — 4 otel sorgusu, **toplam 12 gösterim**, hepsi 0 tıklama. Ölçülebilir fırsat değil, gizli talep sinyali. |
| 4 | "alanya transfer time" varyantlarında kanibalizasyon | ⚠️ **Var ama farklı yerde** — 43 varyant çoğunlukla **tek** İngilizce sayfaya düşüyor (normal long-tail). Gerçek kanibalizasyon: aynı dilde iki ayrı yazı + tek soruya 4 farklı slug. Bkz. D. |
| 5 | Rusça hacim yüksek ama rezervasyon getirmiyor | ✅ **Doğrulandı, ama Rusça en iyi TO'ya sahip** — ru %0,64 TO ile en yüksek. Asıl kayıp ABD (4.892 gösterim, **0 tıklama**) ve Hollanda (2.077 gösterim, **1 tıklama**). |

### Doğrulanamayan varsayım: "EN ve DE trafiği dönüşüyor"

3 rezervasyonun geldiği ülkelerin GSC organik tıklaması:

| Ülke | Gösterim | **Tıklama** | Pozisyon |
|---|---:|---:|---:|
| İngiltere | 3.613 | **5** | 30,9 |
| İsviçre | 103 | **0** | 10,32 |
| Macaristan | 32 | **0** | 7,62 |

**İsviçre ve Macaristan'dan 92 günde tek bir organik tıklama yok.** O iki rezervasyon organik aramadan gelmiş olamaz — Ads, doğrudan trafik, referans veya sosyal kaynaklı olmalı. İngiltere'deki 5 tıklamadan birinin rezervasyona dönmesi mümkün ama doğrulanamaz.

**Aksiyon:** GA4 veya Ads panelinden bu 3 rezervasyonun kanalını teyit et. Organik SEO'nun dönüşüm ürettiği varsayımı şu an **veriyle desteklenmiyor**.

---

## A. Sorgu kümeleme

*Kaynak: `Sorgular.csv` — 1.000 sorgu, 10.805 gösterim, 22 tıklama*

| Küme | Sorgu | Gösterim | Pay | Tıklama | TO | Ort. pozisyon |
|---|---:|---:|---:|---:|---:|---:|
| **BILGI** | 494 | 5.377 | %49,8 | 11 | %0,20 | 12,8 |
| **TICARI** | 277 | 3.911 | %36,2 | 3 | %0,08 | **65,0** |
| **KARSILASTIRMA** | 81 | 839 | %7,8 | 4 | %0,48 | 12,3 |
| **NAVIGASYONEL** | 142 | 649 | %6,0 | 4 | %0,62 | 44,5 |
| **MARKA** | 6 | 29 | %0,3 | 0 | %0,00 | 65,3 |

**Okuma:**

- Gösterimin yarısı bilgi amaçlı, üçte biri ticari. Ticari küme **pozisyon 65**'te — yani ilk 6 sayfada hiç görünmüyor.
- Karşılaştırma kümesi hem iyi pozisyonda (12,3) hem en yüksek TO'ya yakın (%0,48). **Hacmi en küçük ama verimi en yüksek küme bu.**
- Marka sorgusu 29 gösterim. Marka bilinirliği pratikte sıfır.

### Ticari kümenin pozisyon dağılımı

| Konum | Gösterim |
|---|---:|
| 1–3 | 3 |
| 4–10 | 36 |
| 11–20 | 21 |
| 21–50 | 861 |
| **51+** | **2.990** |

Ticari gösterimlerin **%76'sı 51. sıranın gerisinde**. İlk 10'da yalnızca 36 gösterim var.

---

## B. Fırsat tablosu

**Filtre:** gösterim > 20 **VE** pozisyon 4–15 **VE** ticari veya karşılaştırma niyetli

**Sonuç: 10 sorgu, 478 gösterim, 2 tıklama. Hiçbiri TICARI değil — hepsi KARSILASTIRMA.**

| # | Sorgu | Dil | Poz | Gösterim | Tık | Hedeflemesi gereken sayfa |
|---|---|---|---:|---:|---:|---|
| 1 | uber availability in antalya turkey 2026 | en | 9,5 | 63 | 0 | `/en/blog/uber-antalya-havalimani-ulasim` |
| 2 | uber antalya turkey availability 2026 | en | 6,0 | 62 | 0 | aynı |
| 3 | uber antalya availability 2026 | en | 7,9 | 62 | 0 | aynı |
| 4 | uber antalya availability current status | en | 13,1 | 62 | 0 | aynı |
| 5 | havas antalya airport | en | 9,8 | 55 | 0 | `/en/blog/antalya-havas-mi-vip-transfer-mi` |
| 6 | uber antalya turkey available 2026 | en | 6,3 | 54 | 0 | `/en/blog/uber-antalya-havalimani-ulasim` |
| 7 | is uber available in antalya turkey 2026 | en | 12,0 | 37 | 0 | aynı |
| 8 | havas antalya | en | 10,7 | 30 | 2 | `/en/blog/antalya-havas-mi-vip-transfer-mi` |
| 9 | uber availability antalya turkey 2026 | en | 9,9 | 30 | 0 | `/en/blog/uber-antalya-havalimani-ulasim` |
| 10 | uber antalya | en | 7,9 | 23 | 0 | aynı |

**Bu tablonun asıl bulgusu, boş olan kısmı:** filtreye giren **tek bir ticari sorgu yok**. Ticari niyetli sorgular arasında pozisyon 4–15 aralığında yalnızca 24 sorgu var ve toplam **51 gösterim** taşıyorlar (en yükseği 17 gösterimle `antalya havalimanı land of legends transfer`).

**Sonuç: ticari kelimelerde "biraz itersek ilk 5'e çıkar" diyebileceğimiz tek bir sorgu bile yok.** Ticari trafiğin tamamı 21+ pozisyonda ve oraya içerik düzenlemesiyle ulaşılmaz.

Fırsatın tamamı **Uber ve Havaş karşılaştırma kümesinde** — 6 ayrı Uber varyantı pozisyon 6–13'te, 370 gösterim, 0 tıklama. İki sayfa hepsini karşılıyor.

---

## C. Boşa giden trafik

**Filtre:** gösterim > 50 **VE** tıklama = 0 → **41 sorgu, 3.553 gösterim (sorgu evreninin %33'ü)**

### C1. İyi pozisyon, sıfır tıklama — SERP özelliği şüphesi

| Sorgu | Dil | Poz | Gösterim | Muhtemel sebep |
|---|---|---:|---:|---|
| side antalya merkez arası kaç km | tr | 9,3 | **266** | Sayısal cevap; Google kutuda veriyor |
| antalya side arası kaç km | tr | 7,4 | 217 | aynı |
| side antalya arası kaç km | tr | 10,4 | 199 | aynı |
| antalya airport to alanya transfer time how long | en | 10,4 | 169 | aynı |
| antalya havalimanı land of legends arası kaç km | tr | 6,3 | 93 | aynı |
| сколько ехать от анталии до кемера | ru | 9,9 | 81 | aynı |
| антали�� аэропорт кемер расстояние | ru | 9,2 | 70 | aynı |
| от анталии до кемера сколько ехать | ru | 8,6 | 69 | aynı |
| alanyada havaalani varmi | tr | 12,4 | 72 | Evet/hayır cevabı; kutuda veriliyor |
| ayt side arası kaç km | tr | 9,5 | 63 | Sayısal cevap |
| the land of legends antalya havalimanı arası kaç km | tr | 7,2 | 55 | Sayısal cevap |
| анталия кемер расстояние | ru | 11,5 | 51 | Sayısal cevap |

**Ortak nokta:** hepsi tek sayıyla veya tek kelimeyle cevaplanabilen sorular. Bu, sıfır TO'nun en olası açıklaması — ama **GSC SERP özelliği verisi vermediği için kanıtlanamaz.** Doğrulamak için bu sorguları gizli sekmede elle aratmak gerekir.

Bu grup tek başına **1.405 gösterim** taşıyor ve tıklama üretmiyor.

### C2. Kötü pozisyon — sebep açık

| Sorgu | Dil | Poz | Gösterim |
|---|---|---:|---:|
| antalya airport private transfers | en | 76,0 | 145 |
| antalya private transfer | en | 78,7 | 120 |
| antalya privattransfer | de | 36,3 | 98 |
| private transfer antalya airport | en | 76,9 | 94 |
| antalya havalimani alanya | tr | 95,9 | 89 |
| antalya private transfers | en | 82,0 | 89 |
| privat transfer antalya | en | 53,3 | 87 |
| antalya havaalanı alanya | tr | 94,6 | 82 |
| antalya airport private transfer | en | 77,1 | 82 |
| private transfer antalya | en | 84,1 | 76 |
| private transfers antalya airport | en | 83,6 | 75 |
| antalya airport transfers | en | 59,6 | 71 |
| antalya vip transfer | en | 89,1 | 66 |
| antalya airport transfer | en | 60,4 | 55 |
| privater transfer antalya | de | 39,5 | 54 |
| privattransfer antalya flughafen | de | 41,0 | 53 |
| antalya airport taxi | en | 46,1 | 52 |
| antalya vip shuttle | en | 48,8 | 51 |

**Sebep: pozisyon.** Bu grup **1.439 gösterim** ve hepsi 36+ pozisyonda. Burada title/meta düzeltmesinin etkisi sıfırdır; bu bir otorite meselesi.

### C3. İyi pozisyon, tıklanabilir niyet — asıl kayıp

| Sorgu | Dil | Poz | Gösterim |
|---|---|---:|---:|
| uber antalya turkey availability 2026 | en | 6,0 | 62 |
| uber antalya turkey available 2026 | en | 6,3 | 54 |
| uber antalya availability 2026 | en | 7,9 | 62 |
| uber availability in antalya turkey 2026 | en | 9,5 | 63 |
| uber availability antalya turkey 2026 | en | 9,9 | 30 |
| havas antalya airport | en | 9,8 | 55 |
| uber antalya availability current status | en | 13,1 | 62 |

**388 gösterim, pozisyon 6–13, 0 tıklama.** Bu sorguların cevabı tek kelimeyle verilemiyor ("Uber Antalya'da var mı, hangi hizmetler, nasıl kullanılır") — yani C1'deki cevap kutusu açıklaması buraya uymuyor.

**En olası sebep başlık uyumsuzluğu.** Sorgular "availability 2026" ve "current status" içeriyor; sayfa başlığı bu ifadeleri taşımıyor. Bu, veriden çıkan **en somut ve en düzeltilebilir kayıp**.

---

## D. Kanibalizasyon

### D1. "Alanya transfer süresi" — 43 varyant, 972 gösterim, 1 tıklama, ort. poz 17,3

Varyantların çoğu tek bir İngilizce sayfaya düşüyor; bu **normal long-tail**, kanibalizasyon değil. Asıl sorun sayfa tarafında:

| Sayfa | Gösterim | Tık | Poz |
|---|---:|---:|---:|
| `/en/blog/antalya-havalimani-alanya-transfer-kac-saat` | 2.194 | 3 | 9,5 |
| `/ru/blog/antalya-havalimani-alanya-transfer-kac-saat` | 549 | 1 | 13,4 |
| **`/ru/blog/antalya-alanya-transfer-suresi`** | **269** | **0** | **7,4** |
| `/tr/blog/antalya-havalimani-alanya-transfer-kac-saat` | 574 | 1 | 48,1 |
| **`/tr/blog/antalya-alanya-transfer-suresi`** | **232** | **1** | **37,5** |
| `/pl/blog/antalya-alanya-transfer-suresi` | 388 | 1 | 7,0 |
| `/pl/blog/antalya-havalimani-alanya-transfer-kac-saat` | 41 | 0 | 8,4 |

**Rusça'da iki ayrı sayfa aynı konuda yarışıyor** ve daha iyi pozisyondaki (7,4) daha az gösterim alıyor. Türkçe'de de aynı durum. `next.config.ts` içinde `antalya-alanya-transfer-suresi → antalya-havalimani-alanya-transfer-kac-saat` yönlendirmesi tanımlı ve migration 037 zayıf olanı yayından kaldırmış — **ama GSC hâlâ ikisine de gösterim veriyor**, yani ya yönlendirme canlıda yok ya Google yeniden taramadı.

### D2. "Alanya'nın havalimanı var mı" — tek soru, 4 farklı slug, 6 dil

| Sayfa | Gösterim | Poz |
|---|---:|---:|
| `/de/blog/hat-alanya-einen-flughafen` | 114 | 9,9 |
| `/pl/blog/czy-alanya-ma-lotnisko` | 91 | 8,6 |
| `/ru/blog/czy-alanya-ma-lotnisko` | 79 | 5,9 |
| `/en/blog/is-there-an-airport-in-alanya` | 57 | 20,9 |
| `/blog/hat-alanya-einen-flughafen` | 14 | 9,0 |
| `/en/blog/hat-alanya-einen-flughafen` | 14 | 14,1 |
| `/nl/blog/heeft-alanya-een-luchthaven` | 13 | 9,3 |
| `/blog/czy-alanya-ma-lotnisko` | 12 | 9,6 |
| `/en/blog/czy-alanya-ma-lotnisko` | 12 | 13,0 |

**İki yapısal hata görünüyor:**

1. **Rusça sayfa Lehçe slug'la indekslenmiş** (`/ru/blog/czy-alanya-ma-lotnisko`, poz 5,9). Rusça bir kullanıcı SERP'te Lehçe URL görüyor.
2. **İngilizce'de üç ayrı URL** aynı soruyu hedefliyor: `is-there-an-airport-in-alanya`, `hat-alanya-einen-flughafen`, `czy-alanya-ma-lotnisko`. Ve İngilizce'nin kendi slug'ı (20,9) diğer ikisinden **kötü** konumda.
3. **Dil öneki olmayan iki URL** (`/blog/...`) gösterim alıyor — bunların `/en/`'e 308 dönmesi gerekiyordu.

Toplam 406 gösterim, 2 tıklama, 9 URL'ye bölünmüş.

### D3. Taksi karşılaştırma yazısı

| Sayfa | Gösterim | Tık | Poz |
|---|---:|---:|---:|
| `/en/blog/antalya-havalimani-taksi-mi-vip-transfer-mi` | **2.894** | 5 | **63,6** |
| `/en/blog/antalya-taksi-mi-ozel-transfer-mi` | 2 | 0 | **6,5** |

Aynı konuda iki İngilizce yazı. Gösterimi alan poz 63'te, iyi konumdaki poz 6,5'te ama görünmüyor. `next.config.ts` bu çifti yönlendirme listesine almış — **canlıda uygulanmamış görünüyor**.

---

## E. Dil bazlı ROI

*Kaynak: `Sayfa sayısı.csv` — 31.665 gösterim, 138 tıklama*

| Dil | URL | Gösterim | Pay | Tıklama | TO | Ort. poz |
|---|---:|---:|---:|---:|---:|---:|
| **en** | 49 | 14.910 | %47,1 | 34 | %0,23 | 20,6 |
| **tr** | 41 | 6.306 | %19,9 | 31 | %0,49 | 15,6 |
| **ru** | 37 | 5.620 | %17,7 | **36** | **%0,64** | **10,0** |
| **pl** | 46 | 2.988 | %9,4 | 12 | %0,40 | **7,6** |
| (dil öneki yok) | 21 | 980 | %3,1 | 19 | %1,94 | 34,1 |
| **de** | 42 | 798 | %2,5 | 6 | %0,75 | 15,6 |
| **nl** | 20 | 63 | %0,2 | **0** | %0,00 | 16,6 |

### Ülke bazlı

| Ülke | Gösterim | Tıklama | TO | Poz |
|---|---:|---:|---:|---:|
| Türkiye | 7.430 | 61 | %0,82 | 13,37 |
| **ABD** | **4.892** | **0** | **%0,00** | 31,34 |
| İngiltere | 3.613 | 5 | %0,14 | 30,90 |
| Rusya | 2.823 | 14 | %0,50 | 11,19 |
| Almanya | 2.746 | 14 | %0,51 | 19,69 |
| Polonya | 2.623 | 9 | %0,34 | 6,97 |
| **Hollanda** | **2.077** | **1** | **%0,05** | **7,17** |
| Ukrayna | 1.484 | **18** | **%1,21** | 8,04 |

### Değerlendirme

**Yatırım yapılmalı:**

- **Lehçe (pl)** — ortalama pozisyon **7,6**, sitenin en iyi konumlanan dili. Gösterim payı yalnızca %9,4, yani tavan çok yüksek. Polonya'da rekabet zayıf ve site zaten kazanıyor.
- **Rusça (ru)** — pozisyon 10,0 ve **en yüksek tıklama sayısı (36)**. "Rusça dönüşmüyor" tespiti tıklama tarafında yanlış; ru en verimli dil. Rezervasyona dönmemesinin sebebi ayrı bir konu (ödeme, güven, dil desteği) ve GSC'den görülemez.
- **Ukrayna trafiği** — %1,21 TO ile en yüksek. Ayrı bir `uk` dili yok; bu trafik Rusça sayfalara düşüyor.

**Durdurulmalı / gözden geçirilmeli:**

- **Hollandaca (nl)** — 20 URL, **63 gösterim, 0 tıklama**. Ülke tarafında Hollanda 2.077 gösterim alıyor ama bunlar `nl` sayfalarına değil İngilizce sayfalara düşüyor. Hollandaca içerik yatırımının karşılığı **yok**. Migration 038–041–049 ile eklenen Hollandaca katmanı ölçülebilir getiri üretmemiş.
- **İngilizce (en)** — hacmin %47'si ama ortalama pozisyon 20,6 ve TO %0,23. ABD'den 4.892 gösterim / 0 tıklama. **İngilizce ticari terimlerde rekabet aşılamıyor**; İngilizce'de yalnızca karşılaştırma içeriği (Uber/Havaş) çalışıyor.

**Not:** Rezervasyon oranı dil bazında **hesaplanamıyor** — GSC dönüşüm verisi taşımaz ve bilinen 3 rezervasyonun ikisi organik tıklama almayan ülkelerden. Bu satır için **veri yetersiz**.

---

## F. Eksik içerik

### F1. Otel adlı sorgular — talep var, hacim ölçülemiyor

| Sorgu | Gösterim | Poz |
|---|---:|---:|
| castival hotel to antalya airport | 6 | 71,3 |
| port river hotel & spa to antalya airport | 3 | 80,7 |
| antalya airport to vikingen infinity resort transfer time | 2 | 58,5 |
| aska lara resort & spa havalimanı arası kaç km | 1 | 9,0 |
| antalya havalimanı aska lara arası kaç km | 1 | 11,0 |

**Toplam 13 gösterim.** Niyet çok yüksek (otel adını yazan kişi rezervasyon yapacak) ama **ölçülen hacim ihmal edilebilir**. Bunun iki okuması var ve veriden hangisi doğru anlaşılmıyor:

- Talep gerçekten küçük, ya da
- Site bu sorgular için o kadar geride ki gösterim bile almıyor (4 sorgunun 3'ü 58+ pozisyonda)

`regionHotels` haritası (`src/app/[locale]/[region]/page.tsx`) yalnızca 4 bölge için dolu ve Aska Lara, Titanic, Delphin, Rixos, Maxx Royal, Regnum içeriyor. **Castival, Port River ve Vikingen Infinity sitede hiç geçmiyor.**

**Karar:** Bu, ölçülmüş bir fırsat değil, test edilecek bir hipotez. Düşük efor gerektirdiği için denenebilir, ama beklenti kurulmamalı.

### F2. Karşılaştırma sorguları — sitede karşılığı var ama eksik

| Konu | Mevcut sayfa | Durum |
|---|---|---|
| Uber | `/en/blog/uber-antalya-havalimani-ulasim` (6.341 gösterim, poz 7,9) | Var — başlık "2026 availability" ifadesini taşımıyor |
| Havaş | `/en/blog/antalya-havas-mi-vip-transfer-mi` (1.825 gösterim, poz 7,0) | Var |
| Taksi | 2 çakışan yazı (D3) | Konsolide edilmemiş |
| Alanya havalimanı | 4 çakışan slug (D2) | Konsolide edilmemiş |
| **Shuttle vs özel transfer** | **yok** | Boşluk |
| **Kiralık araç vs transfer** | **yok** | Boşluk |
| **BiTaksi** | **yok** | `bitaksi antalya available 2026` (3 gösterim, poz 8,7), `bitaksi or uber in antalya` (1, poz 7) |

### F3. Veride görünen, sitede karşılığı olmayan diğer konular

- **Havaş fiyat/saat sorguları:** `antalya havaş ücreti 2026` (5), `antalya havaş fiyatları` (12), `havaş antalya fiyat 2026` (8), `antalya havaş fiyat 2026` (11), `alanya otogar havaş saatleri` (1), `havaş her saat var mı` (1) — toplam ~38 gösterim, hepsi fiyat/saat odaklı. Mevcut Havaş yazısı karşılaştırma yapıyor, **güncel fiyat ve saat vermiyor**.
- **Gazipaşa:** `antalya airport gazipasa` (1, poz 16), `antalya gazipasa airport` (1, poz 18), `gazipasa flygplats` (1, poz 31), `gazipasa lufthavn` (1, poz 36). İskandinav dillerinde de aranıyor. Sitede Gazipaşa içeriği yok.
- **Şehir içi kalkışlı mesafe sorguları:** `antalya otogar side arası kaç km` (13, poz 12,8), `muratpaşa side arası kaç km` (23, poz 10,1), `lara kundu side arası kaç km` (15, poz 9,3), `konyaaltı side arası kaç km` (1) — havalimanından değil, **şehir içinden** kalkış. ~50 gösterim, mevcut içerik havalimanı odaklı.

---

## G. Öncelikli aksiyon listesi

ICE = Impact × Confidence × Ease (her biri 1–10), skor = ortalama.

| # | Aksiyon | I | C | E | **ICE** | Etki | Efor | Etkilenen dosyalar |
|---|---|---:|---:|---:|---:|---|---|---|
| 1 | **D3'teki taksi yazısı çiftini konsolide et.** `/en/blog/antalya-havalimani-taksi-mi-vip-transfer-mi` (2.894 gösterim, poz 63,6) ile `/en/blog/antalya-taksi-mi-ozel-transfer-mi` (poz 6,5) aynı konuda. Zayıf olanı yayından kaldır, 301 ver. | 8 | 7 | 8 | **7,7** | Yüksek | Düşük | `next.config.ts`, migration (blog_posts) |
| 2 | **Uber yazısının başlığına "2026" ve "availability" ekle.** 6 varyant poz 6–13, 370 gösterim, 0 tıklama. Sorgular yılı ve "availability/current status" içeriyor, başlık taşımıyor. Yalnızca `title_en`/`excerpt_en`. | 7 | 6 | 9 | **7,3** | Orta-yüksek | Düşük | migration (blog_posts) |
| 3 | **D2'deki Alanya-havalimanı slug karmaşasını çöz.** 9 URL, 406 gösterim, 2 tıklama. Özellikle `/ru/blog/czy-alanya-ma-lotnisko` (Rusça sayfa, Lehçe slug, poz 5,9) ve 3 ayrı İngilizce URL. | 7 | 7 | 6 | **6,7** | Orta-yüksek | Orta | `blog_posts.slug_*`, `next.config.ts` |
| 4 | **D1'deki Alanya-süre çiftini kontrol et.** `next.config.ts`'te yönlendirme tanımlı ama GSC iki URL'e de gösterim veriyor. Önce canlıda 301 dönüyor mu test et; dönmüyorsa sebebini bul. | 6 | 8 | 8 | **7,3** | Orta | Düşük | (önce teşhis, kod değişikliği olmayabilir) |
| 5 | **3 rezervasyonun kanalını GA4/Ads'ten doğrula.** İsviçre ve Macaristan'da 0 organik tıklama var. SEO stratejisinin tamamı bu cevaba bağlı. | 9 | 9 | 9 | **9,0** | Yüksek | Düşük | — (kod yok) |
| 6 | **C1'deki 12 sorguyu gizli sekmede elle arat.** 1.405 gösterim, 0 tıklama. Cevap kutusu var mı yok mu, GSC söylemiyor. Varsa bu trafik geri kazanılamaz ve mesafe içeriğine yatırım durdurulmalı. | 8 | 9 | 8 | **8,3** | Yüksek | Düşük | — (kod yok) |
| 7 | **Shuttle vs özel transfer karşılaştırma yazısı.** Karşılaştırma kümesi %0,48 TO ile bilgi kümesinin (%0,20) iki katı. Yeni URL, mevcut hiçbir sayfaya dokunmuyor. | 6 | 5 | 6 | **5,7** | Orta | Orta | yeni migration (blog_posts) |
| 8 | **Havaş yazısına güncel fiyat ve sefer saati bölümü ekle.** ~38 gösterim fiyat/saat odaklı, mevcut yazı bunu karşılamıyor. Bakımı sürekli gerektirir. | 5 | 6 | 5 | **5,3** | Düşük-orta | Orta | migration (blog_posts) |
| 9 | **Lehçe içeriği genişlet.** pl ortalama pozisyon 7,6 (en iyi dil) ama gösterim payı %9,4. Mevcut kazanan formatı (mesafe + karşılaştırma) Lehçe'de çoğalt. | 6 | 5 | 4 | **5,0** | Orta | Yüksek | yeni migration'lar |
| 10 | **Hollandaca yatırımını durdur.** 20 URL, 63 gösterim, 0 tıklama, 92 gün. Mevcut sayfalar kalsın (zararı yok), yeni Hollandaca içerik üretilmesin. | 4 | 8 | 10 | **7,3** | Düşük | Sıfır | — (karar) |

### Sıralama (ICE'ye göre)

1. **9,0** — Rezervasyon kanalını doğrula *(kod yok)*
2. **8,3** — C1 sorgularını SERP'te elle kontrol et *(kod yok)*
3. **7,7** — Taksi yazısı çiftini konsolide et
4. **7,3** — Uber başlığına "2026 availability" ekle
5. **7,3** — Alanya-süre yönlendirmesini teşhis et
6. **7,3** — Hollandaca yatırımını durdur *(karar)*
7. **6,7** — Alanya-havalimanı slug karmaşası
8. **5,7** — Shuttle karşılaştırma yazısı
9. **5,3** — Havaş fiyat/saat bölümü
10. **5,0** — Lehçe içerik genişletme

**İlk iki madde kod gerektirmiyor ve stratejinin geri kalanını belirliyor.** 5. madde "organik hiç dönüşmüyor" sonucunu verirse öncelik sırası tamamen değişir; 6. madde "cevap kutusu var" sonucunu verirse gösterimin %46'sı kalıcı olarak yazılabilir.

---

## Ne yapılmamalı

Veriden çıkan, aksiyona **karşı** bulgular:

- **Ticari kelimeler için içerik üretme.** 3.911 gösterim, ortalama pozisyon 65, ilk 15'te 51 gösterim. Bu bir otorite/backlink meselesi; içerikle kapanmaz.
- **Bölge sayfası başlıklarına dokunma.** Bölge sayfaları 970 gösterim (toplamın %3) ama bir kısmı ilk 10'da: `/pl/beldibi-transfer` poz 3,6 · `/tr/sehirici-transfer` poz 3,1 · `/ru/marmaris-transfer` poz 7,0 · `/tr/side-transfer` poz 4,3. Bunlar rekabetin olmadığı yerlerde kazanıyor; müdahale kayıp riski taşır.
- **Yeni "kaç km" içeriği üretme.** 5.377 gösterim, %0,20 TO. Format doymuş.
- **Otel adlı sayfa üretimine büyük yatırım.** 13 gösterim ölçüldü. Test edilebilir, planlanamaz.

---

## Veri sınırları

- GSC sorgu dosyası 1.000 satırla sınırlı; gerçek sorgu evreni daha büyük.
- SERP özelliği (cevap kutusu, harita, AI Overview) verisi GSC'de yok. C1'deki teşhis **varsayım**, elle doğrulanmalı.
- Dönüşüm verisi GSC'de yok. Dil bazlı rezervasyon oranı **hesaplanamadı**.
- Sorgu → sayfa eşlemesi bu export'ta yok. D bölümündeki eşlemeler sayfa listesinden çıkarım yoluyla yapıldı.
- Veri 30 Mayıs – 29 Ağustos; sezon içi. Kış davranışı farklı olabilir.
