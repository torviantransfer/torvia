# 06 — İçerik Denetimi

**Makine okunabilir:** `content-audit.json` (496 satır)

## Karar dağılımı

| Karar | URL | Pay |
| --- | ---: | ---: |
| KEEP | 437 | %88,1 |
| NO SEO CHANGE | 55 | %11,1 |
| MINOR | 3 | %0,6 |
| MAJOR | 1 | %0,2 |

**Bu dağılım bir sonuçtur, bir hedef değil.** Görev tanımı §32: "İçerik düzgünse
dokunma. Mevcut metnin %90'ını değiştirmek SEO başarı kriteri değildir."

496 URL'nin 4'ünde değişiklik yapıldı çünkü kanıt yalnız 4'ünde değişiklik
lehine çıktı. Kalanında ya sayfa doğru niyeti hedefliyor, ya değiştirmek için
gereken kanıt (GSC) yok, ya da sayfa zaten ranking alıyor ve §15 dokunmayı
yasaklıyor.

## Değiştirilenler

| ID | URL | Karar | Risk | Ne değişti |
| --- | --- | --- | --- | --- |
| GROWTH-002 | `/de/vip-transfer-antalya` | MAJOR | LOW | DB override temizlendi → sayfa VIP niyetine döndü |
| GROWTH-003 | `/en/antalya-airport-transfer` | MINOR | LOW | DB override temizlendi → kod fallback'i differentiator'ları söylüyor |
| GROWTH-004 | `/nl/kvkk` | MINOR | LOW | DB override temizlendi → `/nl/privacy` ile aynı başlık sorunu bitti |
| GROWTH-006 | `/en/blog/flughafen-transfer-antalya` | MINOR | LOW | `title_en` Almanca ifadeden İngilizceye düzeltildi |

Ayrıca sayfa-üstü değil **site geneli** iki değişiklik:

| ID | Kapsam | Risk | Ne değişti |
| --- | --- | --- | --- |
| GROWTH-001 | 196 blog URL'si (28 yazı × 7 dil) | LOW | "İlgili yazılar" bloğu recency yıldızından konusal + locale-güvenli seçime geçti |
| GROWTH-005 | `/nl` | — | İncelendi, **değiştirilmedi** — bkz. aşağıda |

## İncelenip kasıtlı olarak değiştirilmeyenler

### GROWTH-005 — `/nl` ana sayfa başlığı

Bu maddenin kaydı, bir kararın nasıl geri alındığını göstermek için tutuluyor.

Canlı Hollandaca SERP'te 8 sonucun 7'si başlığında "luchthaven" kullanıyor.
Buna dayanarak `/nl` başlığı "Transfer Luchthaven Antalya…" olarak değiştirildi.

Sonra Google Autocomplete Hollanda verisi çekildi:

| Sorgu | Tamamlama |
| --- | ---: |
| `antalya airport transfer` | 8 |
| `prive transfer antalya` | 10 |
| `antalya luchthaven transfer` | **1** |

**Rakiplerin kendilerini nasıl adlandırdığı, kullanıcının ne yazdığının kanıtı
değil.** Değişiklik geri alındı. Mevcut başlık — "Antalya Airport Transfer |
Privétransfer Belek, Side, Alanya, Kemer" — zaten en çok yazılan iki ifadeyi
taşıyor.

### Thin content (§27)

Birinci audit `/contact` sayfalarını 6 dilde ~240 kelimeyle `thin-content`
uyarısı olarak işaretlemişti.

**Karar: değişiklik yok.** Bir iletişim sayfasının amacı 240 kelimede
tamamlanıyor: telefon, e-posta, WhatsApp, adres, çalışma saatleri, konuşulan
diller, harita ve form. Kelime sayısı için uzatmak §27'nin açıkça yasakladığı
şey.

Denetim ölçütü kelime sayısı değil niyet kapsaması olduğunda bu sayfalar geçer.

### Region sayfaları (168 URL)

Hepsi KEEP. Her sayfada destinasyona özel gerçek veri var: mesafe, süre,
fiyat, otel listesi (`regionHotels`), coğrafi komşular, rota FAQ'ı, breadcrumb,
TaxiService + FAQPage schema. Kelime sayısı 1.100–1.230 aralığında.

Bir kısmı ilk 10'da sıralanıyor (`/pl/beldibi-transfer` 3,6 · `/tr/sehirici-transfer`
3,1 · `/ru/marmaris-transfer` 7,0 · `/tr/side-transfer` 4,3). §15 gereği
dokunulmadı.

### Blog yazıları (188 URL)

Hepsi KEEP, ikisi hariç (GROWTH-006 ve CANN-01/02'nin gated konsolidasyonu).

Karşılaştırma içeriği sitenin ölçülmüş en iyi formatı: %0,48 CTR ve poz 12,3,
bilgi içeriğinin (%0,20) iki katı. Eski raporda "boşluk" denen iki konu
(shuttle vs özel transfer, kiralık araç vs transfer) bu arada yazılmış ve
yayında.

### Legal sayfalar (35 URL)

NO SEO CHANGE. Birinci audit'in çift marka düzeltmesi dışında dokunulmadı.

## Denetlenen ama sorun çıkmayan alanlar

| Kontrol | Sonuç |
| --- | --- |
| alt metni eksik görsel | 531 URL'de **0** |
| geçersiz JSON-LD | **0** |
| birden fazla H1 | 2 sayfa — birinci audit'te kodla çözüldü (`transformTags: { h1: "h2" }`) |
| çevrilmemiş metadata (iki dil aynı title) | **0** |
| eskimiş yıl referansı | Başlıklarda "2026" var; **bu yıl 2026, eskimiş değil** |
| keyword stuffing | Bulunmadı |
| rakiplerin kapsayıp TORVIAN'ın kapsamadığı konu | Bulunmadı (bkz. §03) |
