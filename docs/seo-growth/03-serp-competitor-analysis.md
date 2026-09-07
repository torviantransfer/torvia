# 03 — Canlı SERP ve Rakip Analizi

**Araştırma tarihi:** 2026-09-07 / 2026-09-08

## Yöntemin sınırı — önce bu

Kullanılan arama aracı **US-locale**. Çekilen sonuçlar gerçek Almanya /
Polonya / Hollanda SERP'i **değildir**.

Bu ne için geçerli:
- rakip keşfi (kim bu alanda oynuyor)
- sayfa tipi tespiti (SERP servis sayfası mı blog mu istiyor)
- rakiplerin hangi dilde nasıl adlandırdığı
- hangi differentiator'ları öne çıkardıkları

Bu ne için geçerli **değil**:
- sıralama kanıtı
- "TORVIAN şu an kaçıncı sırada" iddiası
- ülke bazlı rekabet yoğunluğu ölçümü

Kelime dizimi kararları bu yüzden SERP'e değil, Google Autocomplete'e
dayandırıldı (`02-trends-research.md`) — ve bir vakada SERP'in söylediğinin
tersini gösterdi.

---

## Pazar bazında SERP yapısı

### EN — `antalya airport transfer private`

| Sonuç | Tip |
| --- | --- |
| viator.com (×3 ayrı sonuç) | OTA / marketplace |
| airportstaxitransfers.com | agregatör |
| shuttleboard.net | agregatör |
| antalyaairportshuttle.net | operatör (çok dilli) |
| booktaxiantalya.com | operatör |
| voyagetransfers.com | operatör (çok dilli) |
| antalyaprivatetransfer.com | operatör |

**SERP tipi: transactional service page.** Blog yok.

**Tek başına Viator ilk 10'da üç slot tutuyor.** Kalanı yerleşik operatörler ve
agregatörler. Bu, içerik düzenlemesiyle kapanacak bir fark değil — historical
GSC verisinde İngilizce ticari sorgular pozisyon 76–85'teydi ve bu SERP o
sayıyı açıklıyor.

**Karar:** İngilizce ticari head term'ler için içerik üretilmedi. Eski raporun
"ticari kelimeler bir otorite meselesi, içerikle kapanmaz" sonucu bu SERP ile
tutarlı. §36'ya rağmen: yüksek ticari niyet ≠ kazanılabilir SERP.

### DE — `Flughafentransfer Antalya privat Festpreis`

| Sonuç | Tip |
| --- | --- |
| holidayextras.com/de | büyük agregatör |
| sixt.com/ride | büyük marka |
| transfer7.com/de | operatör |
| antyatransfer.com/de | operatör |
| antalyaairportshuttle.net/de | operatör (EN'de de var) |
| ausflugebuchen.com | operatör |

Ortak differentiator'lar: **Festpreis, Flugverfolgung, kostenlose Wartezeit,
Meet & Greet.** TORVIAN'ın Almanca sayfaları bunların hepsini zaten söylüyor.

Almanca'da agregatör baskısı İngilizce'den az (Viator yok), ama SIXT ve Holiday
Extras marka gücü taşıyor.

### PL — `transfer z lotniska Antalya prywatny cena`

| Sonuç | Tip |
| --- | --- |
| metintour.pl | **Polonya seyahat acentesi** |
| turcjatour.pl | **Polonya seyahat acentesi** |
| alanyawycieczki.pl | **Polonya seyahat acentesi** |
| intui.travel/pl | agregatör |
| vigotours.com/pl | operatör |
| talixo.com | agregatör |
| sootransfer.com/pl | operatör |

**Global agregatör baskısı yok.** Alan büyük ölçüde Polonya pazarına özel
seyahat acentelerinde — Viator, SIXT, Holiday Extras yok.

Bu, historical veride pl'nin neden en iyi ortalama pozisyona (7,6) sahip
olduğunun yapısal açıklaması: **rekabet gerçekten daha zayıf.**

### RU — `трансфер из аэропорта Анталии частный цена`

sputnik8.com, kiwitaxi.ru, intui.travel, get-easy.ru, 724hoteltransfer.com.
Rusça pazarına özel agregatörler (KiwiTaxi, Sputnik8) baskın.

### NL — `privétransfer luchthaven Antalya naar hotel vaste prijs`

viator.com, **antalya-luchthaven-transfer.nl** (adanmış .nl operatörü),
triptime.nl (blog), hoppa.com, suntransfers.com, voyagetransfers.com/nl,
ahatransfer.com, holidaytaxis.com.

8 sonucun 7'si başlığında "luchthaven" kullanıyor. **Bu gözlem, autocomplete
tarafından çürütüldü** — bkz. `02-trends-research.md`, NL bölümü. Rakiplerin
kendilerini nasıl adlandırdığı, kullanıcının ne yazdığının kanıtı değil.

### RO — `transfer privat aeroport Antalya hotel preț`

Sonuçların neredeyse tamamı **İngilizce**: viator (×3), sixt, rentotransfer,
voyagetransfers, antalyaprivatetransfer, toprakviptransfer. Romence tek sonuç:
anta-tour.com.

**Uyarı:** bu, aracın US-locale olmasının en çok bozduğu ölçüm. Gerçek Romanya
SERP'inde Romence sonuç oranı daha yüksek olabilir. "Romence SERP boş" diye bir
sonuç **çıkarılmadı**.

### TR — `Antalya havalimanı transfer özel araç fiyat`

etstur.com, enuygun.com (**büyük TR OTA'ları**), aranturvip.com,
armut.com, toprakviptransfer.com, tuistransfers.com, kayatransfer.net,
busetatravel.com.

Türkiye'de OTA baskısı yüksek (Etstur, Enuygun) ama yerel operatör sayısı da
fazla ve SERP parçalı. Historical veride Türkiye 61 tıklama ile en çok tıklama
üreten pazar.

---

## Rakiplerin ortak intent kapsaması

İncelenen operatör sayfalarının hepsinde şunlar var; TORVIAN'ın ticari
sayfalarında da hepsi mevcut:

| Konu | Rakiplerde | TORVIAN'da |
| --- | --- | --- |
| Sabit fiyat / gizli ücret yok | ✅ | ✅ |
| Uçuş takibi | ✅ | ✅ |
| Meet & greet / isim tabelası | ✅ | ✅ |
| Ücretsiz bekleme | ✅ | ✅ |
| Araç sınıfı seçimi | ✅ | ✅ |
| Çocuk koltuğu | ✅ | ✅ |
| 7/24 | ✅ | ✅ |
| Ücretsiz iptal | ✅ | ✅ |
| Kapıdan kapıya | ✅ | ✅ |
| **Yorum / sosyal kanıt** | ✅ (Viator, Tripadvisor entegre) | ⚠ sistem var, SERP'te görünmüyor |

**Tek yapısal boşluk sosyal kanıt.** Autocomplete bunu bağımsız olarak
doğruluyor: İngilizce'de "reviews" ve "tripadvisor", Rusça'da "отзывы" ilk 10
tamamlama arasında.

Site `reviews` tablosunu ve 5+ onaylı yorumda yıldız üreten bir `Product`
schema'sını zaten taşıyor (`src/lib/reviews.ts`). Yıldızın çıkıp çıkmadığı
onaylı yorum sayısına bağlı ve bu **veri meselesi, kod meselesi değil** —
uydurma yorum eklemek §24 gereği yasak. Sahibine aksiyon olarak bırakıldı.

## Bu analizden çıkan içerik kararı: yok

Rakip metinleri kopyalanmadı. Rakiplerin kapsadığı hiçbir konu TORVIAN'ın
ticari sayfalarında eksik çıkmadığı için **bu araştırma sonucunda hiçbir sayfaya
içerik eklenmedi.** Bulunan tek fark (sosyal kanıt) içerikle değil gerçek
yorum verisiyle kapanır.
