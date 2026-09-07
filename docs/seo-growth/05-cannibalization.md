# 05 — Kanibalizasyon

**Ölçüm:** `docs/seo-runtime-audit.json` üzerinde varlık-farkında (entity-aware)
kümeleme. Makine okunabilir: `_cannibalization.json`

## Yöntem — neden başlık benzerliği yetmiyor

İlk denemede locale içi başlık token benzerliği (Jaccard ≥ 0,45) ölçüldü ve
EN'de 37 çift çıktı. Bunların çoğu **şablon benzerliğiydi, kanibalizasyon
değil**: "Antalya Airport to Belek: Distance 35 km" ile "Antalya Airport to
Kemer: Distance 55 km" aynı şablonu paylaşıyor ama farklı sorguları hedefliyor.

İkinci ölçüm **varlık eşleşmesi** şart koştu: iki URL ancak aynı destinasyonu
veya aynı konu varlığını hedefliyorsa aynı kümede sayıldı. Farklı destinasyon =
farklı sorgu = kanibalizasyon değil.

Bu ayrım olmadan üretilen liste, gerçek 6 kümeyi 70+ gürültü satırının içinde
kaybederdi.

## Bulunan kümeler

| ID | Küme | Dil | Karar |
| --- | --- | --- | --- |
| CANN-01 | airport-to-hotel (blog katmanı) | 7 dil | CONSOLIDATE — **gated** |
| CANN-02 | airport-transfer guide (blog katmanı) | en, de | CONSOLIDATE — **gated** |
| CANN-03 | alanya travel time | 6 dil | RESOLVED (migration 071 bekliyor) |
| CANN-04 | vip / premium head term (DE) | de | RESOLVED (migration 074) |
| CANN-05 | lara / kundu destinasyonu | 7 dil | **KEEP BOTH** — kasıtlı intent ayrımı |
| CANN-06 | destinasyon listesi (TR) | tr | **KEEP** — izlenecek |

---

## CANN-01 — airport-to-hotel, blog katmanı

Her dilde **1 landing + 2 blog** aynı niyeti hedefliyor.

İngilizce örnek:

| URL | Tip | Kelime | Başlık |
| --- | --- | ---: | --- |
| `/en/hotel-transfer-antalya` | landing | 603 | Hotel Transfer Antalya Airport \| Direct to Any Hotel, Any Resort |
| `/en/blog/hotel-transfer-antalya-airport` | blog | 730 | Hotel Transfer Antalya Airport: Private VIP Direct to Your Resort |
| `/en/blog/antalya-airport-hotel-transfer` | blog | 502 | Antalya Airport Hotel Transfer: How It Works, Prices & Tips 2026 |

İki blogun bölüm yapısı karşılaştırıldı — aynı yazı:

| `hotel-transfer-antalya-airport` | `antalya-airport-hotel-transfer` |
| --- | --- |
| What Is a Hotel Transfer from Antalya Airport? | How a Hotel Transfer Works |
| Transfer Times and Prices | Hotel Transfer Prices |
| Hotel Transfer vs Airport Taxi vs Shuttle Bus | How It Compares to Shuttle or Taxi |
| How to Book Your Hotel Transfer | Booking Tips |
| FAQ (4 soru) | — |

Aynı niyet, aynı bölümler, aynı varlıklar. 7 dilde ≈ 13 URL.

**Karar: CONSOLIDATE — ama uygulanmadı.**

Gerekçe §15 ve tarihsel kanıt: **migration 030 tam olarak bunu yaptı ve yanlış
yazıyı yayından kaldırdı**; migration 037 geri almak zorunda kaldı. Hangisinin
gösterim aldığını GSC olmadan bilmenin yolu yok. Kanıtsız hayatta kalan
seçmek, aynı hatayı tekrarlamaktır.

Gerekli sorgu ve hazırlanmış migration: `09-content-migrations.md`.

## CANN-02 — airport-transfer guide, blog katmanı

| URL | Kelime | Gelen link | Başlık |
| --- | ---: | ---: | --- |
| `/en/antalya-airport-transfer` | 801 | 25 | Antalya Airport Transfer \| Private & VIP Transfer |
| `/en/blog/flughafen-transfer-antalya` | **1.258** | 28 | Flughafen Transfer Antalya: Fixed-Price Rides to Your Hotel |
| `/en/blog/antalya-airport-transfer-guide` | 562 | 1 | Antalya Airport VIP Transfer Guide 2026 |

Blog, sahiplenmesi gereken landing sayfasından hem daha uzun hem daha çok
linkli. Almanca'da aynı yapı (`flughafentransfer-antalya` 1.136w / 29 link,
`antalya-flughafentransfer-ratgeber` 434w / 1 link).

**Bu görevde yapılan:** İngilizce başlıktaki Almanca ifade düzeltildi
(GROWTH-006, migration 075). **Konsolidasyon CANN-01 ile aynı sebeple gated.**

## CANN-04 — Almanca head term, beş URL (ÇÖZÜLDÜ)

Ölçümden önce beş Almanca URL aynı ifadeyi taşıyordu:

| URL | Başlık | Gelen link |
| --- | --- | ---: |
| `/de` | Antalya Flughafen Transfer \| … | 69 |
| `/de/antalya-airport-transfer` | Flughafen Antalya Transfer \| … | 25 |
| **`/de/vip-transfer-antalya`** | **Flughafentransfer Antalya** \| Privat & VIP zum Festpreis | **1** |
| `/de/blog/flughafentransfer-antalya` | Flughafentransfer Antalya: … | 28 |
| `/de/blog/antalya-flughafentransfer-ratgeber` | Antalya Flughafen Transfer 2026: … | 1 |

VIP landing sayfası — var olma sebebi VIP niyeti olan sayfa — o niyeti bırakıp
kazanamayacağı bir head term kuyruğuna girmişti. Sebep bir `seo_pages`
override'ıydı; **kod fallback'i (`VIP Transfer Antalya Flughafen | Premium
Privatfahrzeug`) zaten doğru ayrışmıştı.**

**Çözüm:** migration 074 override'ı NULL'a çekiyor, sayfa kendi niyetine dönüyor.

## CANN-05 — lara / kundu (KASITLI OLARAK AYRI BIRAKILDI)

`/{loc}/lara-beach-transfer` (landing) ve `/{loc}/kundu-lara-transfer` (region)
aynı destinasyonu hedefliyor, başlık benzerliği 0,67.

**Birleştirilmedi.** Region sayfası destinasyon setinin içindeki fiyatlı rota
sayfası; landing sayfası Lara Beach'in bağımsız giriş noktası ve 7 dilde kendi
satır içi metnini taşıyor. Birleştirmek, ranking geçmişi olan bir destinasyonda
iki indexli URL'den birini kaybetmek demek. Niyet farkı (rota fiyatlandırması
vs destinasyon landing) gerçek.

## CANN-06 — TR destinasyon listesi (İZLENECEK)

`/tr`, `/tr/regions` ve `/tr/booking` üçü de "Belek, Side, Alanya, Kemer"
listesiyle bitiyor (benzerlik 0,60–0,86).

**Dokunulmadı.** Bunlar Türkçe'nin en çok linkli üç sayfası ve Türkiye sitenin
anlamlı tıklama üreten tek pazarı (138 tıklamanın 61'i). Sorgu verisi olmadan
bu üçünü yeniden adlandırmak, çalışan tek locale'i riske atmaktır.

---

## Kanibalizasyon olarak sayılmayanlar

| Görüntü | Neden değil |
| --- | --- |
| 25 region × 7 dil aynı şablon | Farklı destinasyon = farklı sorgu. Her sayfada gerçek mesafe, süre, fiyat, otel listesi ve rota FAQ'ı var. |
| "Distance/duration" blogları (Belek, Kemer, Side, Lara) | Aynı şablon, farklı varlık. |
| `/about` ile VIP landing (tr/pl/ru) | `/about` marka sayfası; ticari sorguda yarışmıyor. |
