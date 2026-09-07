# 07 — Öncelik Yol Haritası

**Makine okunabilir:** `opportunity-map.json`

## Puanlama yöntemi

Hacim bileşeni **yok** — GSC kapalı olduğu için ölçülecek hacim yok, ve
uydurulmuş hacim §7'nin yasakladığı şey.

Ölçülebilen dört bileşen:

```
skor = ticari yakınlık × 3
     + SERP kazanılabilirliği × 3
     + mevcut iç link desteği × 1,5
     + içerik derinliği × 1,5
     + bu görevde aksiyon alındı mı × 1
```

SERP kazanılabilirliği = `10 − SERP zorluğu`; zorluk canlı SERP analizinden.

## Sıralanmış fırsatlar

### 1. Zaten yazılmış düzeltmeyi yayına almak (skor 80 / 78)

En yüksek puanlı 12 URL'nin tamamı **RO ve PL region sayfaları.**

RO neden en üstte: Romence SERP'te rakip yoğunluğu en düşük **ve** bu sayfalar
var oldukları sürece `<title>`'larında literal `undefined` taşıdılar (SEO-001).
22 Romence bölge sayfası bugün hâlâ öyle — düzeltme repoda, deploy'da değil.

PL neden ikinci: Lehçe SERP'te global agregatör yok, alan Polonya seyahat
acentelerinde; site zaten poz 7,6 ile en iyi konumlanan dili.

**Bu görevin en büyük büyüme kaldıracı yeni içerik değil, deploy.**

| İş | Etki | Efor | Bağımlılık |
| --- | --- | --- | --- |
| Kodu deploy et + migration 070–073 | 22 RO bölge sayfası `undefined`'dan kurtulur; 28 kırık görsel düzelir; 14 admin URL'si indexten çıkar | Düşük | — |

### 2. Migration 074 — üç override düzeltmesi (skor: aksiyon alındı)

| URL | Kazanım |
| --- | --- |
| `/de/vip-transfer-antalya` | Beş Almanca URL'nin paylaştığı head term kuyruğundan çıkıp kendi VIP niyetine dönüyor |
| `/en/antalya-airport-transfer` | Ana sayfayla aynı şeyi söylemeyi bırakıyor; SERP'in yarıştığı üç differentiator'ı söylüyor |
| `/nl/kvkk` | `/nl/privacy` ile aynı başlığı taşımayı bırakıyor |

### 3. GROWTH-001 — iç link yeniden yönlendirmesi (196 URL)

Blog "ilgili yazılar" bloğu artık recency değil konu eşleşmesine göre seçiyor.

Ölçülen önceki durum: en son yayımlanan iki yazı 28'er gelen link alıyordu;
gösterim üreten yazılar (Uber 6.341, taksi 2.894, alanya 2.194) **1'er**.

Bu, iç link eşitsizliğini düzeltmenin yanı sıra bir dil hatasını da kapatıyor:
blok çeviri kontrolü yapmıyordu, yani Hollandaca bir yazının altında İngilizce
başlıklar çıkıyor ve o locale'de noindex olan URL'lere link veriliyordu.

### 4. Manavgat'ı aktive etmek — sahibin kararı

Autocomplete'te `antalya havalimanı transfer manavgat` (TR, #5 tamamlama) ve
`flughafentransfer antalya manavgat` (DE). Region satırı, içerik ve
koordinatlar migration 056'da hazır; **eksik olan gerçek fiyat.**

056'nın kendi yazdığı iki manuel adım:
1. `/admin/pricing` — placeholder fiyatları gerçek Manavgat fiyatlarıyla değiştir
2. `/admin/regions` — Pasif → Aktif

**Bu görevde yapılmadı.** Placeholder fiyatla bir bölge yayına almak §42'nin
yasakladığı şey ve rezervasyon alan bir sitede gerçek para riski.

### 5. Sosyal kanıtı SERP'e taşımak — veri işi, kod işi değil

İngilizce'de "reviews" (#2) ve "tripadvisor" (#9), Rusça'da "отзывы" ilk 10
tamamlama arasında. Rakiplerin tamamı yorum gösteriyor.

Site `reviews` tablosunu ve 5+ onaylı yorumda yıldız üreten `Product`
schema'sını **zaten taşıyor** (`src/lib/reviews.ts`). Yıldızın çıkmaması onaylı
yorum sayısına bağlı.

**Aksiyon sahibinde:** gerçek müşterilerden yorum toplamak ve `/admin/reviews`
üzerinden onaylamak. Sahte yorum §24 gereği yasak, eklenmedi.

### 6. Gated konsolidasyonlar — GSC gerektiriyor

CANN-01 ve CANN-02. Migration'lar hazır (`09-content-migrations.md`), hayatta
kalan URL seçimi sorgu verisine bağlı.

## Yapılmayacaklar — kanıtla

| Öneri | Neden hayır |
| --- | --- |
| İngilizce ticari head term'ler için içerik üretmek | Canlı SERP'te Viator tek başına ilk 10'da 3 slot; kalanı yerleşik operatörler. Historical veride bu sorgular poz 76–85. Otorite meselesi, içerikle kapanmaz. |
| Region sayfalarını yeniden yazmak | 1.100–1.230 kelime, destinasyona özel gerçek veri, bir kısmı ilk 10'da. §15. |
| Her keyword için yeni landing açmak | §22'nin altı koşulunu karşılayan tek aday çıkmadı. |
| "kaç km" formatında yeni içerik | 5.377 gösterim / %0,20 CTR. Format doymuş; Google cevabı SERP'te veriyor. |
| Hollandaca'yı silmek | Düşük performansın yapısal sebebi araştırıldı; dil hatası değil, ölçüm eksikliği. Sayfalar kalıyor. |
| Otel adına özel sayfa üretimi | Eski ölçüm 13 gösterim. Test edilebilir, planlanamaz. |
