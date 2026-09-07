# 02 — Talep Araştırması (7 Pazar)

**Araştırma tarihi:** 2026-09-08
**Ham veri:** `docs/seo-growth/autocomplete-research.json`
**Araç:** `docs/seo-growth/_autocomplete.cjs`

---

## Google Trends: INSUFFICIENT DATA

Denendi, çalışmadı — varsayılmadı:

```
GET https://trends.google.com/trends/explore?...&geo=NL      → HTTP 429
GET https://trends.google.com/trends/api/explore?...          → HTTP 429
```

Google, Trends'i datacenter IP'lerinden gelen isteklere kapatıyor. Bu ortamda
tarayıcı otomasyonu da yok.

Bu nedenle **hiçbir 0–100 Trends değeri raporlanmadı**, hiçbir "son 12 ayda şu
varyant daha güçlü" iddiası üretilmedi, sezon eğrisi çıkarılmadı.

## Yerine kullanılan: Google Autocomplete

`suggestqueries.google.com`, pazar başına `hl` + `gl` parametreleriyle — **HTTP
200, gerçek veri.** 7 pazar × 5 seed = 35 sorgu.

Bu ne değildir: **hacim değildir.** "Ayda X aranıyor" demek için kullanılamaz.

Bu nedir: Google'ın kendi kaydettiği, o pazarda gerçekten yazılan sorgu
tamamlamaları, kendi popülerlik sırasında. §20'nin sorduğu "hangi kelime dizimi
gerçek kullanıcı dili" sorusunu, relatif ilgi skorundan daha doğrudan yanıtlar.

**Sınır:** her seed için ilk ~10 tamamlama döner. Bir ifadenin listede
olmaması, aranmadığı anlamına gelmez.

---

## Pazar bazında bulgular

### NL — bir kararı çürüttü

| Seed | Tamamlama sayısı |
| --- | ---: |
| `antalya airport transfer` | **8** |
| `prive transfer antalya` | **10** |
| `transfer luchthaven antalya` | 3 |
| `antalya luchthaven transfer` | **1** (yalnız kendisi) |

Canlı Hollandaca SERP'te 8 sonucun 7'si "luchthaven" kullanıyor. Buna bakarak
`/nl` ana sayfasının başlığını "Transfer Luchthaven Antalya" yapmıştım.
**Autocomplete bunun yanlış olduğunu gösterdi:** Hollandalı kullanıcılar
"antalya airport transfer" yazıyor; "antalya luchthaven transfer" tek tamamlama
alıyor.

Rakiplerin nasıl adlandırdığı ile kullanıcıların ne yazdığı aynı şey değil.
**Değişiklik geri alındı.** Mevcut başlık — "Antalya Airport Transfer |
Privétransfer Belek, Side, Alanya, Kemer" — zaten en çok yazılan iki ifadeyi
birden taşıyor.

En zengin Hollandaca ticari ifade: `prive transfer antalya` (10 tamamlama:
side, airport, naar alanya, alanya, corendon, naar side, lara, belek, turkije).

### PL — mevcut başlık formatını doğruluyor

`transfer z lotniska antalya` → 10 tamamlama, **hepsi "do {destinasyon}"**:
do alanya, do hotelu, do side, do kemer, do okurcalar, do belek, do avsallar.

Site zaten tam bu formatta: `Transfer z lotniska Antalya do Belek | VIP Prywatny`.

Locative varyantı (`w Antalyi`) canlı SERP'te de kullanılıyor ama autocomplete
nominatif formu üretiyor. **Değişiklik yok** — pl sitenin en iyi konumlanan
dili (poz 7,6) ve §15 gereği kanıt olmadan dokunulmaz. Kanıt burada değişiklik
lehine değil, mevcut halin lehine çıktı.

### DE — kelime dizimi kararı verilemez, ikisi de gerçek

| Seed | Tamamlama |
| --- | ---: |
| `antalya flughafen transfer` | 10 (vip, zum hotel, nach side, empfehlung…) |
| `flughafentransfer antalya` | 10 (side, alanya, belek, manavgat, kumköy, colakli, lara…) |

İkisi de derin. Bu yüzden Almanca head term kararı **kelime dizimine değil**,
kanibalizasyon ölçümüne dayandırıldı (bkz. `05-cannibalization.md`): beş
Almanca URL aynı ifadeyi taşıyordu, sorun hangi dizim olduğu değil kaç sayfanın
onu sahiplendiğiydi.

### EN — sosyal kanıt baskın modifier

`antalya airport transfer` tamamlamaları sırasıyla:
**reviews** (#2), to hotel, between terminals, to side, time, vip, to alanya,
**tripadvisor** (#9), cheap.

"reviews" ve "tripadvisor" ilk on içinde iki ayrı slot. Sitenin bir yorum
sistemi var (`reviews` tablosu, `productSchema` 5+ onaylı yorumda yıldız
üretiyor). Bu, İngilizce'de içerik değil **güven sinyali** talebi olduğunu
gösteriyor.

`antalya airport transfer between terminals` — sitede karşılığı olmayan bir
sorgu. Terminal arası transfer sunuluyor mu, business data'dan doğrulanamadı;
**uydurulmadı, aksiyon alınmadı.**

### RU — destinasyon bazlı, "отзывы" (yorumlar) yine var

`трансфер из аэропорта анталии` → в аланию, в отель, в кемер, **отзывы**,
в сиде, в каш, в белек, в текирова, в махмутлар.

Adı geçen destinasyonların tamamı aktif region: Alanya, Kemer, Side, Kaş,
Belek, Tekirova, Mahmutlar. Rusça tarafta envanter talebi karşılıyor.

EN'deki gibi burada da yorum/deneyim modifieri ilk 10'da.

### TR — fiyat ve firma modifierleri

`antalya havalimanı transfer` → **ücretleri** (#2), alanya, **firmaları** (#4),
**manavgat** (#5), shuttle, otobüs, havaş, vip, hizmeti.

`antalya havalimanı otel` → **otel transfer** (#1), **otel transfer fiyatları**
(#2), ulaşım, servis, shuttle.

Otel adı sorguları: `susesi otel arası kaç km`, `akra otel arası kaç km`.

### RO — talep yapısı region sayfalarıyla birebir örtüşüyor

`transfer aeroport antalya` → alanya, side, belek, kemer, hotel, lara,
`transfer privat aeroport antalya`.

Bu tam olarak region sayfalarının hedefidir ve başlık formatı zaten uyumlu
(`Transfer Aeroportul Antalya → Belek`).

**Not:** `transfer privat antalya` tamamlamalarında Almanca ve İngilizce
kirlilik var (`flughafen`, `erfahrungen`, `nach alanya`). Romence sorgu
derinliğinin henüz ince olduğunu gösteriyor — §23 gereği RO'da **aşırı
optimizasyon yapılmadı.**

---

## Envanter dışı talep sinyalleri

Autocomplete'te adı geçen ama aktif region'ı olmayan destinasyonlar:

| Destinasyon | Nerede geçiyor | Sitede durumu |
| --- | --- | --- |
| **Manavgat** | tr, de | Region satırı **var**, `is_active = false` (migration 056 — placeholder fiyatla açılmasın diye bilerek kapalı) |
| Avsallar | pl | Region yok |
| Kumköy | de | Region yok |
| Çolaklı | de | Region yok |

**Manavgat tek somut fırsat:** satır, içerik ve koordinatlar hazır; eksik olan
gerçek fiyat. Migration 056 bunu iki manuel adım olarak zaten yazmış
(`/admin/pricing` → gerçek fiyat, `/admin/regions` → Aktif). **Bu görevde
aktive edilmedi** — placeholder fiyatla bir bölge yayına almak §42'nin
yasakladığı şeydir.

Diğer üçü yeni region açmayı gerektirir; tek bir autocomplete satırı §22'nin
"yeterli talep sinyali" eşiğini karşılamaz. **Aksiyon alınmadı, kayda geçti.**

**Sınır:** bu karşılaştırma Latin alfabesi kelime ayrıştırmasıyla yapıldı;
Kiril tamamlamalardaki destinasyonlar (каш, текирова, махмутлар) elle
doğrulandı ve hepsi aktif region çıktı.
