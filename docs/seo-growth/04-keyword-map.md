# 04 — Keyword Map (page-by-page)

**Üretim:** `docs/seo-growth/_build.cjs` · **Makine okunabilir:** `keyword-map.json`
**Kaynak:** `docs/seo-runtime-audit.json` (531 URL taraması) + canlı SERP + Google Autocomplete
**GSC:** BLOCKED — her satırda `gsc: NO DATA`

## Yöntem

491 indexlenebilir URL için karar. 491 satırı tek tek elle yazmak, kimsenin
kontrol edemeyeceği bir doküman üretirdi. Bunun yerine: **sayfa tipi başına
açık bir kural, sonra kanıtın aksini söylediği adlandırılmış istisnalar.**
Her istisna kendi kanıtını taşır.

| Sayfa tipi | Kural | Gerekçe |
| --- | --- | --- |
| region | KEEP | Route bazlı; mesafe, süre, fiyat, otel ve FAQ destinasyona özel. Bir kısmı ilk 10'da (pl/beldibi 3,6 · tr/sehirici 3,1 · tr/side 4,3). §15 gereği kanıtsız dokunulmaz. |
| blog-post | KEEP | Karşılaştırma kümesi sitenin en iyi performanslı formatı (%0,48 CTR). Dil veya duplikasyon defekti adlandırılmadıkça dokunulmadı. |
| legal | NO SEO CHANGE | Indexlenebilir ama hiçbir şey için yarışmıyor. SEO metniyle şişirmek kapsam dışı (§27). |
| utility / private | NO SEO CHANGE | Birinci audit'te noindex yapıldı (SEO-004 / SEO-007). |
| home / landing / static | KEEP, istisnalar hariç | Aşağıdaki 5 istisna. |

## Karar dağılımı

| Karar | URL |
| --- | ---: |
| KEEP | 432 |
| NO SEO CHANGE | 55 |
| MINOR | 3 |
| MAJOR | 1 |
| **TOPLAM** | **491** |

Dil bazında:

| Dil | URL | KEEP | MINOR | MAJOR | NO SEO CHANGE |
| --- | ---: | ---: | ---: | ---: | ---: |
| tr | 71 | 63 | 0 | 0 | 8 |
| en | 72 | 62 | 2 | 0 | 8 |
| de | 72 | 63 | 0 | 1 | 8 |
| pl | 71 | 63 | 0 | 0 | 8 |
| ru | 71 | 63 | 0 | 0 | 8 |
| nl | 70 | 62 | 1 | 0 | 7 |
| ro | 69 | 61 | 0 | 0 | 8 |

## Cluster sahipliği (§11)

Her primary keyword cluster'ın dil başına tek sahibi var:

| Cluster | Sahip | Niyet |
| --- | --- | --- |
| brand-hub | `/{loc}` | commercial investigation |
| airport-transfer-service | `/{loc}/antalya-airport-transfer` | transactional |
| vip-premium-vehicle | `/{loc}/vip-transfer-antalya` | commercial investigation |
| airport-to-hotel | `/{loc}/hotel-transfer-antalya` | transactional |
| dest-{region} × 25 | `/{loc}/{region}-transfer` | transactional |
| dest-lara-beach | `/{loc}/lara-beach-transfer` | transactional |
| dest-land-of-legends | `/{loc}/land-of-legends-transfer` | transactional |
| booking-action | `/{loc}/booking` | transactional |
| destination-list | `/{loc}/regions` | commercial investigation |
| blog-{topic} × 28 | `/{loc}/blog/{slug}` | informational / comparison |

## İstisnalar — kanıtıyla

### GROWTH-003 — `/en/antalya-airport-transfer`

- **Karar:** MINOR · **Risk:** LOW
- **Cluster:** `airport-transfer-service` · **Niyet:** transactional
- **Mevcut title:** Antalya Airport Transfer | Private & VIP Transfer
- **Gerekçe:** seo_pages.meta_title_en override ('| Private & VIP Transfer') repeats the homepage's claim with fewer distinguishing words. Cleared in 074; the code fallback names fixed price, meet & greet and online booking — the three things every ranking result on the live English SERP leads with.

### GROWTH-006 — `/en/blog/flughafen-transfer-antalya`

- **Karar:** MINOR · **Risk:** LOW
- **Cluster:** `blog-flughafen-transfer-antalya` · **Niyet:** informational
- **Mevcut title:** Flughafen Transfer Antalya: Fixed-Price Rides to Your Hotel
- **Gerekçe:** title_en reads 'Flughafen Transfer Antalya' while the article's own opening heading reads 'Antalya Airport Transfer'. Body is 1,258 words of English. Data typo, corrected in migration 075.

### GROWTH-002 — `/de/vip-transfer-antalya`

- **Karar:** MAJOR · **Risk:** LOW
- **Cluster:** `vip-premium-vehicle` · **Niyet:** commercial investigation
- **Mevcut title:** Flughafentransfer Antalya | Privat & VIP zum Festpreis
- **Gerekçe:** seo_pages.meta_title_de override serves the generic head term 'Flughafentransfer Antalya', which /de, /de/antalya-airport-transfer and two German blog posts already claim. The page gave up the VIP intent it exists for. Override cleared in migration 074 so the differentiated code fallback returns.

### GROWTH-005 — `/nl`

- **Karar:** KEEP · **Risk:** —
- **Cluster:** `brand-hub` · **Niyet:** commercial investigation
- **Mevcut title:** Antalya Airport Transfer | Privétransfer Belek, Side, Alanya, Kemer
- **Gerekçe:** Investigated and deliberately not changed. Dutch competitors title themselves with 'luchthaven' almost uniformly, which argued for retitling — but Google's completions for the Netherlands say Dutch searchers type the English form: 'antalya airport transfer' returns eight completions, 'antalya luchthaven transfer' returns one. A change made on competitor evidence was reverted on user evidence. The existing title already carries both the head term and 'privétransfer', the richest Dutch commercial phrase.

### GROWTH-004 — `/nl/kvkk`

- **Karar:** MINOR · **Risk:** LOW
- **Cluster:** `legal-kvkk` · **Niyet:** none
- **Mevcut title:** Privacybeleid | TORVIAN Transfer
- **Gerekçe:** meta_title_nl override duplicates /nl/privacy's title and contradicts the page's own H1 ('Beleid gegevensbescherming'). Cleared in 074. Finding SEO-019 from the first audit.

## Fırsat sıralaması

Puanlama hacim içermiyor — GSC kapalı olduğu için ölçülecek hacim yok.
Ölçülebilen: ticari yakınlık × SERP kazanılabilirliği × mevcut iç link
desteği × içerik derinliği. SERP zorluğu canlı SERP analizinden
(03-serp-competitor-analysis.md) türetildi:

| Dil | SERP zorluğu (1–10) | Gerekçe |
| --- | ---: | --- |
| en | 9 | Viator ilk 10'da 3 slot + yerleşik operatörler |
| de | 7 | SIXT, Holiday Extras marka gücü |
| ru | 7 | KiwiTaxi, Sputnik8 pazar agregatörleri |
| tr | 6 | Etstur, Enuygun OTA baskısı ama parçalı SERP |
| nl | 6 | Viator + adanmış .nl operatörü |
| pl | 4 | **Global agregatör yok**; alan Polonya acentelerinde |
| ro | 3 | Romence dilinde rakip azlığı (ölçüm sınırlı, bkz. §03) |

En yüksek puanlı 20 URL:

| Skor | URL | Cluster |
| ---: | --- | --- |
| 80 | `/ro/alanya-transfer` | dest-alanya |
| 80 | `/ro/belek-transfer` | dest-belek |
| 80 | `/ro/kas-transfer` | dest-kas |
| 80 | `/ro/kemer-transfer` | dest-kemer |
| 80 | `/ro/kundu-lara-transfer` | dest-kundu-lara |
| 80 | `/ro/side-transfer` | dest-side |
| 78 | `/pl/belek-transfer` | dest-belek |
| 78 | `/pl/kas-transfer` | dest-kas |
| 78 | `/pl/kundu-lara-transfer` | dest-kundu-lara |
| 77 | `/pl/alanya-transfer` | dest-alanya |
| 77 | `/pl/kemer-transfer` | dest-kemer |
| 77 | `/pl/side-transfer` | dest-side |
| 74 | `/ro` | brand-hub |
| 74 | `/ro/booking` | booking-action |
| 72 | `/tr/belek-transfer` | dest-belek |
| 72 | `/tr/kas-transfer` | dest-kas |
| 72 | `/tr/kundu-lara-transfer` | dest-kundu-lara |
| 71 | `/tr/alanya-transfer` | dest-alanya |
| 71 | `/tr/kemer-transfer` | dest-kemer |
| 71 | `/tr/side-transfer` | dest-side |

**Okuma:** en yüksek fırsat yeni içerikte değil — **RO ve PL region
sayfalarında.** RO çünkü Romence rekabet zayıf ve o sayfalar var oldukları
sürece `<title>`'ında literal `undefined` taşıdılar (SEO-001, birinci
audit'te düzeltildi, deploy bekliyor). PL çünkü SERP'te global agregatör
yok ve site zaten poz 7,6 ile en iyi konumlanan dili.

Yani en büyük büyüme kaldıracı **zaten yazılmış düzeltmeyi yayına almak**,
yeni sayfa açmak değil.