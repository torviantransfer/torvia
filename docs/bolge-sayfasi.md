# Bölge sayfası — yeni düzen

Antalya Havalimanı'ndan bir bölgeye transferi anlatan sayfa. Otuza yakın bölge
bu tek şablondan geçer; bölgeden bölgeye değişen tek şey veridir.

Düzen `src/components/region/RegionPageView.tsx` içinde. Veri okuma, SEO
override'ları, schema ve yönlendirmeler `src/app/[locale]/[region]/page.tsx`
içinde kalır — sayfa yalnızca veriyi hazırlayıp bileşene verir.

---

## 1. Tasarım kararı

**Sitenin mevcut Apple/iOS görünümü korunur.** iOS mavisi `#007AFF`, Apple
mürekkebi `#1D1D1F`, `#F5F5F7` gri, yumuşak yuvarlaklıklar, gölge yerine
`rgba(0,0,0,.06)` saç teli çizgi.

Bir ara admin panelinin sıcak taş + marka yeşili diline geçmek denendi ve
**vazgeçildi**: public tarafı komple yeniden markalamak, kazanılacak tutarlılığa
değmeyecek kadar geniş bir işti ve canlı trafiği olan sayfalarda gereksiz risk
taşıyordu. Kazanç düzendeydi, renkte değil — o yüzden yalnızca düzen değişti.

## 2. Bölüm sırası

| # | Bölüm | Not |
|---|---|---|
| 1 | Breadcrumb | Ana sayfa / Bölgeler / {bölge} |
| 2 | Hero | H1, giriş, fotoğraf. Masaüstünde metnin altında dört vaat kartı |
| 3 | Künye plakası | Koyu şerit: sabit fiyat · süre · mesafe · kapasite · CTA |
| 4 | Vaat kartları | **Yalnız telefonda** — masaüstünde hero'nun içinde |
| 5 | Fiyat ve araç | Tek kart: solda araç, sağda fiyat + dahil olanlar + araç + CTA |
| 6 | Seçenekler | Dört kart; TORVIAN "Önerilen" rozetiyle öne çıkar |
| 7 | Bölge hakkında | Rakam şeridi, metin, yan fotoğraf, oteller |
| 8 | Öne çıkanlar | **Şimdilik boş** — panelden doldurulacak, bkz. §5 |
| 9 | Yorumlar | Puan özeti + üç yorum |
| 10 | SSS | Bağımsız kutular, ortalı |
| 11 | Yakın bölgeler + aranan ifadeler | İç link ve `routeKeywords` |
| 12 | Kapanış | Koyu şerit, tek CTA |

**Kaldırılanlar:** "Nasıl rezervasyon — 3 adım" ve ayrı "Neden biz" bölümü.
İkisi de otuz sayfada birebir aynıydı. "Neden biz"in metinleri silinmedi —
hero'daki vaat kartlarına taşındı.

**Tek eylem kuralı:** sayfada tek bir eylem var (fiyat al / rezervasyon), üç
yerde aynı biçimde tekrarlanır. Telefonda alttaki sabit çubuk bu işi üstlenir,
bu yüzden künye plakasındaki buton telefonda gizlenir.

## 3. SEO kuralları — bunlara dokunulmaz

- **H1 kısaltılmaz.** `heroTitle` "{bölge} Özel Transfer | Antalya Havalimanı →
  {bölge}" biçiminde tam ifadeyi taşır. Bazı bölgeler bu ifadeyle ilk ondadır;
  havalimanını H1'den çıkarmak tam olarak sıralamayı düşüren değişikliktir.
- **URL değişmez.**
- **On bir SSS'in hepsi kalır.** Liste artık `faqItems` adında tek yerde durur
  ve `FAQPage` schema'sı ondan üretilir; görünen soruyla işaretlenen soru bir
  daha ayrışamaz.
- **Schema:** TaxiService · BreadcrumbList · FAQPage · (5+ onaylı yorumda)
  Product. `HowTo` **kaldırıldı** — görünür "3 adım" bölümü gidince yapısal veri
  sayfada olmayan içeriği tanımlıyordu.
- **Fiyat `PriceTag` ile basılır.** Sitede para birimi değiştirici var; tutarı
  sabit metin olarak yazmak onu bozar.
- Görsel `alt` metinleri, iç linkler ve `routeKeywords` korunur.

## 4. Diller

Sekiz dil: tr · en · de · pl · ru · nl · ro · ar.

Yeni bölümlerin metinlerinin çoğu **yeniden yazılmadı** — zaten her dilde doğal
yazılmış hâlde duruyordu:

| Bölüm | Kaynak |
|---|---|
| Vaat kartları | `regionDetail.fixedPrice*`, `flightTrack*`, `proDrivers*`, `securePay*` |
| Seçenek kartları | `compare` namespace'inin tamamı, `recommended` rozeti dahil |
| Araç, SSS, yorumlar, kapanış | Mevcut `regionDetail` anahtarları |

Yalnızca 31 kısa etiket yeniydi (`kicker*`, `label*`, `incl*`, `priceNote`,
`vehicleLabel`…). Bunlar **çeviri değil**, her dilde o dilin kendi ifadesiyle
yazıldı.

**Türkçede ek tuzağı:** `{name}'e` kalıbı Belek'te doğru, Side'de ve Alanya'da
bozuk olurdu (Side'ye, Alanya'ya). Yeni metinler bu yüzden **"{name} için"**
kurgusuyla yazıldı — her bölgede doğru çalışır. Mevcut SSS metinlerinde bu sorun
hâlâ var; ayrı bir iş.

**Uzun metne dayanıklılık:** Almanca bileşik kelimeler düzeni taşırıyordu.
Başlıklarda `text-balance` + `hyphens-auto` + `break-words`, esnek kutuların
metin kaplarında `min-w-0`, büyük harfli etiketlerde harf aralığı `0.14em`'den
`0.08–0.10em`'e indirildi. Rakamlar `whitespace-nowrap` — "65 dk" ortadan
bölünmez.

## 5. Sıradaki iş — panelden düzenlenebilir alanlar

Bugün bölgeye özgü olan tek serbest metin `regions.description_*`. Şablon otuz
sayfada aynı olduğu için özgünlük buradan gelmeli. Bölgeler ekranına dil dil bir
**"Sayfa içeriği"** sekmesi gelecek; alanların hepsi **opsiyonel** olacak, boşsa
sayfa bugünkü hâliyle render olacak:

| Alan | Boşsa |
|---|---|
| Hero başlık (H1) | bugünkü otomatik başlık |
| Hero alt başlık | bugünkü |
| Hero görseli | koddaki `regionImages` |
| Bölge hakkında — ek paragraflar | yalnız `description_*` |
| Öne çıkanlar (3 kart: başlık, metin, görsel) | bölüm görünmez |
| Oteller | koddaki `regionHotels` listesi |
| Bölgeye özel SSS | yalnız genel on bir soru |

Opsiyonel olmaları önemli: otuz bölge birden doldurulmak zorunda kalmaz, canlı
trafik ilk günden risk almaz, sıralaması olan bölgelere en son dokunulur.

`regionHotels` şu an `[region]/page.tsx` içinde gömülü bir sabittir; bu sekme
gelince veritabanına taşınmalı.
