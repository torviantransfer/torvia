# TORVIAN — Devir Notu

**Son güncelleme:** 2026-07-29 (bu oturumun sonunda)
**Dal:** `main` — HEAD: `246b302`, push edildi.

---

## 🆕 BU OTURUMDA NE OLDU — YENİ SOHBETE BUNU OKU, SONRA DEVAM ET

Kullanıcı bana **kalıcı, geniş bir yetki** verdi: "kıdemli SEO/içerik/CRO uzmanı gibi davran,
rutin ve düşük riskli iyileştirmeler için ayrıca onay bekleme" dedi. Bu kural hâlâ geçerli —
yeni sohbette de aynı şekilde davran. Tam kurallar `/memories/repo/seo-operating-charter.md`
içinde (repo-scoped memory, otomatik yükleniyor) — orada yoksa veya bulamıyorsan bu dosyadaki
özete güven:

- **6 dil = 6 ayrı pazar** (tr, en, de, pl, ru, nl). Bir dilde alınan karar diğerlerine
  körü körüne kopyalanmaz.
- **Düşük riskli (onay bekleme):** başlık/meta düzeltme, yazım, iç link, alt text,
  içerik genişletme, blog, SSS, kırık link, teknik SEO düzeltmeleri.
- **Yüksek riskli (önce kısa plan sun, onay al):** domain değişikliği, toplu URL silme,
  site mimarisi, toplu yönlendirme, **fiyat değişikliği**, hukuki metin, **ödeme/rezervasyon
  sistemi değişikliği**, marka pozisyonu değişikliği.
- **"VIP" vs "Private" konusunda tekrar hata yapma:** Site genelinde yerleşik marka ifadesi
  **"Private VIP Transfer"** (dile göre uyarlanmış) — iki ayrı hizmet değil, aynı hizmetin iki
  sinyali (VIP=araç/hizmet kalitesi, Private=paylaşımsız). Bir dilde "VIP" kelimesini tamamen
  silme, ikisini birlikte tut. Detay ve istisna (ana sayfa `<title>`) charter dosyasında.

### Bu oturumda tamamlanan ve push edilen işler
1. `083e3fa` — Ana sayfa SSS'ye 2 yeni soru + localSeo ticari metin genişletmesi (6 dil).
2. `fd74ab9` — **Kendi hatamı düzelttim:** "VIP" kelimesini yanlışlıkla 6 dilin `localSeo`
   bloğundan silmiştim, geri eklendi + blog CTA rozeti artık dile göre değişiyor
   (önceden İngilizce sabitti).
3. `1dfa5f4` — **Sitemap "Invalid URL" hatası (GSC'de kullanıcı bildirdi) düzeltildi.**
   `src/app/sitemap.ts`'teki blog kapak görselleri `<image:loc>` içinde göreli URL
   (`/images/...`) olarak duruyordu, Google mutlak URL istiyor. `absoluteImageUrl()` helper
   eklendi. Vercel deploy sonrası canlı sitemap'i tekrar kontrol etmek iyi olur
   (`https://torviantransfer.com/sitemap.xml`).
4. `246b302` — **Kritik para birimi gösterim hatası bulundu ve düzeltildi.** Onaylanan
   6 maddelik proaktif denetim listesinin 1. maddesini (schema markup) incelerken tesadüfen
   bulundu: fiyatlar DB'de/Stripe'ta her zaman **USD**, ama birkaç yerde ham USD sayısının
   yanına **hiç dönüşüm yapılmadan "€" sembolü** basılıyordu (örn. $45 → görünürde "€45").
   Düzeltilen yerler (hepsi 6 dilde): `src/components/PriceTag.tsx` (artık
   `/api/exchange-rates` + `useCurrency().format()` ile gerçek dönüşüm yapıyor), bölge sayfası
   `<title>` etiketi (Google SERP'te görünen!), blog CTA rozeti + mobil sticky bar
   (`BlogStickyBar.tsx`), bölge sayfası SSS cevabı `faqA5` (görünür metin + FAQPage
   structured data). Build temiz, commit+push edildi.

### ⚠️ BEKLEYEN KARAR — kullanıcıdan onay istendi, henüz onaylanmadı/düzeltilmedi

Aynı incelemede **ayrı ve daha ciddi** bir hesaplama hatası bulundu ama **dokunulmadı** çünkü
işlem/ödeme belgelerini etkiliyor (yukarıdaki "yüksek riskli" kategoriye giriyor):

- **Dosyalar:** `src/components/account/ReservationsList.tsx`,
  `src/components/TrackReservation.tsx`, `src/app/api/stripe/webhook/route.ts`,
  `src/app/api/voucher/route.ts` (tüketiciler: `src/lib/email.ts`, `src/lib/pdf-voucher.ts`).
- **Hata:** USD→EUR dönüşümünü `exchange_rate_eur` (örn. 0.92) ile **bölüyor**, **çarpması**
  gerekirken. Sonuç: rezervasyon onay e-postası, PDF voucher, hesap sayfası ve takip
  sayfasında gösterilen EUR tutarı gerçek değerden **~%18 daha yüksek** görünüyor. Gerçek
  ödeme her zaman doğru şekilde USD olarak Stripe'tan çekiliyor — sadece referans EUR
  gösterimi yanlış, para kaybı yok ama müşteri kafası karışabilir/şikayet gelebilir.
- **Önerilen düzeltme:** 4 dosyada `amount / eurRate` → `amount * eurRate` (basit, izole
  formül düzeltmesi, gerçek ücretlendirmeyi değiştirmiyor).
- **Yapılacak:** Yeni sohbette kullanıcıya bunu hatırlat, onay gelirse düzelt + build + commit,
  sonra `/memories/repo/seo-operating-charter.md`'yi güncelle (zaten bulgu not edildi, "fixed"
  olarak güncellenmesi lazım).

### Sırada — kullanıcının onayladığı 6 maddelik proaktif denetim listesi

```
[x] 1. Schema markup / yapılandırılmış veri kapsamı  ← denetlendi, kapsamlı buldu;
       yan bulgu olarak yukarıdaki para birimi hatası çıktı
[ ] 2. Görsel alt text denetimi                        ← SIRADAKİ
[ ] 3. İç link derinliği / site mimarisi
[ ] 4. Core Web Vitals / sayfa hızı
[ ] 5. Dile özel anahtar kelime & içerik boşluğu analizi (DE/PL/RU/TR/NL için ayrı ayrı,
       İngilizce'nin kopyası OLMAYACAK)
[ ] 6. Rakip analizi + yeni blog konu fırsatları
```

Rapor formatı kullanıcının istediği: 1) tespit edilen sorun, 2) etkilenen dil/sayfa,
3) yapılan işlem, 4) hedef anahtar kelimeler, 5) beklenen SEO etkisi, 6) beklenen
rezervasyon/gelir etkisi, 7) ölçülmesi gereken metrik, 8) sıradaki öncelik.

### ⚠️ Aşağıdaki eski bölümler (migration 038-045 uyarısı, "16/24 bölge" ilerlemesi,
"booking sayfası UX'e başlanmadı") bu oturumdan ÖNCEKİ bir handoff notundan kalma ve
**git log'a göre muhtemelen artık güncel değil** — `git log --oneline` şunları gösteriyor:
`331f398 seo(047): ... (region programme complete 24/24)`, `afe6d2e seo: Dutch content for
21 remaining blog posts`, `0588c35 fix(booking): step + form persistence, coupon summary,
mobile pass`. Yani bölge içerik programı muhtemelen bitti ve booking sayfası UX işi muhtemelen
yapıldı. **Yeni sohbette önce canlı siteyi/DB'yi kontrol et, bu eski notlara körü körüne
güvenme.** Migration 038-045'in Supabase'de çalıştırılıp çalıştırılmadığı ve service_role
anahtarının değiştirilip değiştirilmediği de doğrulanmalı (kullanıcı "service role en son
yapıcam" demişti — hatırlatma yapma, o istediğinde gündeme gelsin).

---

## 🔴 ÖNCE BUNU YAP — SİTE ŞU AN KISMEN BOZUK (eski not, yukarıdaki uyarıya bak)

Kod canlıya çıktı ve `_nl` kolonlarını bekliyor, ama o kolonlar veritabanında yok.
**`supabase/migrations/038_dutch_locale_and_localized_slugs.sql` çalıştırılana kadar şunlar hata veriyor:**

| Dosya | Etki |
|---|---|
| `src/app/api/regions/route.ts` | **Rezervasyon formu bölge listesi gelmiyor → hiç booking alınamaz** |
| `src/app/api/stripe/webhook/route.ts` | Ödeme sonrası onay e-postası gönderilmiyor (ödeme yine de alınır) |
| `src/app/api/voucher/route.ts` | Voucher üretilmiyor |
| `src/app/api/reservations/track/route.ts` | "Rezervasyon takip" çalışmıyor |
| `src/components/Footer.tsx` | Footer'daki popüler bölgeler boş |
| `src/app/sitemap.ts` | Sitemap'te blog ve bölge URL'leri yok |

**Yapılacak:** Supabase → SQL Editor → aşağıdaki dosyaları **bu sırayla** yapıştır ve çalıştır.

```
038_dutch_locale_and_localized_slugs.sql   ← ACİL, önce bu
039_blog_localized_slugs.sql
040_regions_dutch_content.sql
041_blog_dutch_batch1.sql
042_zero_click_titles_rewrite.sql
043_region_content_ru_nl_top6.sql
044_region_content_belek_side_corridor.sql
045_region_content_kemer_corridor.sql
```

Hepsi tekrar çalıştırılabilir (idempotent), zarar vermez.

---

## 🔴 GÜVENLİK — Supabase anahtarını değiştir

Sohbette `service_role` anahtarı düz metin olarak paylaşıldı. Bu anahtar tüm güvenlik
kurallarını (RLS) atlar ve veritabanının tamamına yazma yetkisi verir.

**Yapılacak:** Supabase → Settings → API → `service_role` → Regenerate.
Sonra Vercel'de `SUPABASE_SERVICE_ROLE_KEY` değişkenini güncelle.

---

## Yapılan işler (commit edildi + push edildi)

### 1. Kupon hatası düzeltildi — `c17e1d7`
Müşteri "indirim kodu çalışmıyor" diyordu. Üç ayrı kusur vardı:

1. **Kod sunucuya hiç gitmiyordu.** `BookingWizard`'daki "Uygula" butonu sadece yerel bir
   boolean'ı `true` yapıyordu; fiyat isteği `{region, trip, time}` olarak gidiyordu, içinde
   `coupon` parametresi yoktu.
2. **Bitiş tarihi olmayan kuponlar reddediliyordu.** `new Date(coupon.valid_until)` NULL kolonda
   `1970-01-01` veriyor → `şimdi <= 1970` false. Admin panelinde bitiş tarihi boş bırakılabildiği
   için **"süresiz" yapılan her kupon ölüydü.**
3. **Geri bildirim yoktu.** `couponAppliedSuccess` / `couponInvalid` metinleri 6 dilde de vardı
   ama hiç gösterilmiyordu.

**Çözüm:** `src/lib/coupon.ts` içinde tek bir `evaluateCoupon()`; hem `/api/pricing` hem
`/api/reservations` onu kullanıyor. NULL artık "sınır yok" demek. 11 senaryo test edildi.

### 2. Hollandaca (nl) locale — `15b4101`
- 6. dil olarak eklendi: routing, middleware, hreflang/OG, sitemap, dil seçici, admin formları
- `src/messages/nl.json` — 801 anahtar (tüm diller artık 801'de eşit)
- Rusça'da eskiden beri eksik olan 3 anahtar da tamamlandı
- Tüm dillerde "5 dil" → "6 dil" düzeltmesi

### 3. Dile özel blog URL'leri — `15b4101`
Eskiden her dil aynı Türkçe slug'ı kullanıyordu:
`/pl/blog/antalya-havalimani-belek-transfer` → Polonyalı için anlamsız.
Artık `slug_<locale>` kolonları var; eski URL'ler **301 ile** yenisine gidiyor, sıralama taşınıyor.

### 4. İç link ağı — `15b4101`
Bölge sayfaları eskiden hep aynı 6 popüler bölgeye link veriyordu; diğer 18'i sıfır link alıyordu.
Artık koordinatlardan hesaplanan **4 coğrafi komşu + 2 popüler**.

### 5. Merge — `563f963`
Uzakta 6 commit vardı (başka oturum). Force push yapılmadı, birleştirildi. 3 çakışma çözüldü:
- Blog CTA metinleri → **onlarınki** (i18n anahtarı, Hollandaca'yı otomatik kapsıyor)
- Bölge sorgusu → **birleştirildi** (tam satır + `ctaRegionName`)
- İlgili yazı linkleri → **bizimki** (`localizedBlogSlug`; onlarınki yerel URL sistemini bozardı)

---

## SEO içerik programı — bölge sayfaları

**Neden:** Bir bölge sayfasının görünen metninin ~%90'ı `src/messages/*.json`'dan gelen ortak
şablon (SSS, "Neden TORVIAN", "Nasıl rezervasyon", karşılaştırma tablosu) — 24 bölgede birebir
aynı, sadece `{name}` değişiyor. Sayfayı benzersiz yapan **tek şey** veritabanındaki
`description_<locale>`. 120 karakterlik şablon metinle kalan bölgeleri Google kopya sayıyor.

**Ayrıca:** de/pl/ru/nl için bu kolonlar indekslenebilirliği de kontrol ediyor —
`getTranslatedLocales()` (`src/app/[locale]/[region]/page.tsx`) boşsa sayfayı `noindex` yapıyor,
`src/app/sitemap.ts` de aynısını yansıtıyor.

### İlerleme: 16 / 24 bölge

```
✓ 043  alanya · belek · side · kemer · kundu-lara
✓ 044  kadriye · bogazkent · evrenseki · kizilagac · sehirici
✓ 045  beldibi · goynuk · kiris · camyuva · tekirova · adrasan
  046  okurcalar · turkler · mahmutlar · kargicak          ← SIRADAKİ
  047  kas · kalkan · fethiye · marmaris
```

Her parti: **6 dil birden**, bölge başına ~600-750 karakter özgün metin, hiçbir dil yarım
bırakılmıyor.

---

## ⚠️ Bilinmesi gereken tuzaklar

### `supabase/seed.sql` asıl veri kaynağı — `migrations/002` DEĞİL
Migration 010 şunu yaptı: `DELETE FROM regions WHERE slug IN (...) AND id::text NOT LIKE 'b0000000%'`
— yani 002'den gelen kopyaları sildi, `seed.sql`'dekileri bıraktı.

**Doğru mesafeler (bunları kullan):**

| slug | km | dk | | slug | km | dk |
|---|---|---|---|---|---|---|
| sehirici | 12 | 20 | | side | 70 | 60 |
| kundu-lara | 15 | 20 | | tekirova | 70 | 60 |
| kadriye | 30 | 30 | | kizilagac | 80 | 70 |
| belek | 35 | 35 | | adrasan | 95 | 90 |
| beldibi | 40 | 35 | | okurcalar | 100 | 80 |
| bogazkent | 45 | 40 | | turkler | 110 | 85 |
| goynuk | 50 | 40 | | alanya | 130 | 120 |
| kemer | 55 | 50 | | mahmutlar | 140 | 130 |
| evrenseki | 60 | 50 | | kargicak | 145 | 135 |
| kiris | 60 | 55 | | kas | 190 | 180 |
| camyuva | 65 | 55 | | kalkan | 210 | 190 |
| | | | | fethiye | 220 | 200 |
| | | | | marmaris | 300 | 270 |

Migration 041/042/043 yazılırken 002'nin eski değerleri kullanılmıştı (Kemer 43, Side 65,
Belek 33) — **düzeltildi.** Yeni içerik yazarken yukarıdaki tabloyu kullan.

### `kundu` ve `lara` satırları ÖLÜ
Migration 010 ikisini de `is_active = false` yapıp `kundu-lara`'da birleştirdi.
Haziran'daki migration 036, Kundu ve Lara metinlerini bu ölü satırlara yazmış — **o içerik
hiçbir zaman görünmedi.** Yeni yazarken hedef her zaman `kundu-lara` olmalı.

### Aktif bölge listesi (24)
```
adrasan, alanya, beldibi, belek, bogazkent, camyuva, evrenseki, fethiye,
goynuk, kadriye, kalkan, kargicak, kas, kemer, kiris, kizilagac,
kundu-lara, mahmutlar, marmaris, okurcalar, sehirici, side, tekirova, turkler
```

### İki blog yazısı neredeyse aynı konuda (çözülmedi)
`antalya-havalimani-alanya-transfer-kac-saat` ve `antalya-alanya-transfer-suresi` ikisi de
"Antalya → Alanya ne kadar sürer" diyor, birbirini zayıflatıyor. Birleştirme veya 301 gerekiyor.
İçerik silme işi olduğu için kullanıcı onayı bekliyor.

---

## Search Console bulguları (27 Nis – 26 Tem 2026)

- **Toplam:** 99 tık / 22.400 gösterim / %0,44 TO / ort. pozisyon ~16
- **ABD+İngiltere:** gösterimin %37'si, tıkların %4'ü — pozisyon 70-90, ticari kelimeler
- **Hollanda:** 1.749 gösterim, pozisyon 7,1, TO %0,11 → Hollandaca eklemenin sebebi
- **Blog:** gösterimlerin ~%90'ı. **Bölge (satış) sayfaları: toplam ~700 gösterim**
- **Sıfır tık alan 1. sayfa sayfaları:** ~1.500 gösterim, ort. pozisyon 7,5, 0 tık
  → migration 042 bunların başlıklarını düzeltti (cevabı ve sayıyı başlığa koyma)
- **Türkçe "kaç km" sorgularının %84'ü yerli sürücü** (merkez/otogar/Afyon/Kütahya) — müşteri değil.
  Türkçe başlıklar bu yüzden "Antalya Havalimanı (AYT) ... Arası Kaç Km?" şeklinde havalimanı odaklı.

## Google Trends bulguları (12 aylık)

- **Hollandalılar ticari aramayı İNGİLİZCE yapıyor**: `antalya airport transfer` 100,
  `antalya private transfer` 24 (+%110). Hollandaca'yı sadece soru sorarken kullanıyorlar
  (`afstand`, `hoe lang duurt`). → Hollandaca sayfalar bilgi aramalarını yakalar;
  NL'den gelen rezervasyon trafiği İngilizce sayfalara düşer.
- **Almanya'da `hotel transfer antalya` 69 puanla 5. en büyük terim** — sitede karşılığı zayıf.
  `transfer antalya flughafen` 100. Almanca metinlerde ikisi de kullanılıyor.
- **İngilizce ticari kelimeler:** `antalya private transfer` dünya genelinde +%70, DE +%200.

---

## 🔜 SIRADAKİ İŞ — Booking sayfası (kullanıcı talebi, henüz başlanmadı)

Kullanıcının bildirdiği sorunlar:

1. **Sayfa yenilenince adım başa dönüyor** — adım durumu (step state) kalıcı değil.
   URL'de veya sessionStorage'da tutulmalı.
2. **Kupon uygulanınca özet kısmında görünmüyor** — indirim satırı ve düşen fiyat
   sipariş özetinde gösterilmiyor. (Kupon *hesaplaması* düzeltildi, ama özet UI'ı ayrı iş.)
3. **Mobil uyumlu değil** — %100 mobil olması gerekiyor.
4. **UI/UX elden geçirilmeli:**
   - Input'lar, butonlar, yerleşim, boyut hiyerarşisi
   - Tüm adımlar, butonlar, kartlar, ikonlar, widget'lar tek tek gözden geçirilecek
   - Simetrik, hiyerarşik, erişilebilirlik odaklı
   - Müşterinin kafası karışmayacak netlikte

İlgili dosyalar:
- `src/components/booking/BookingWizard.tsx` (ana form, ~700 satır)
- `src/components/booking/BookingFormMini.tsx`
- `src/components/booking/StripeCheckoutEmbed.tsx`
- `src/app/[locale]/booking/page.tsx`

---

## Kalan diğer işler

- [ ] Migration 038-045'i Supabase'de çalıştır ← **ACİL**
- [ ] Supabase `service_role` anahtarını değiştir ← **ACİL**
- [ ] 046: okurcalar, turkler, mahmutlar, kargicak (4 bölge × 6 dil)
- [ ] 047: kas, kalkan, fethiye, marmaris (4 bölge × 6 dil)
- [ ] Booking sayfası UI/UX + adım durumu + kupon özeti (yukarıda)
- [ ] Kalan ~24 blog yazısının Hollandaca çevirisi (041 sadece 5 tanesini kapsıyor)
- [ ] Alanya çift içerik sorunu (yukarıda)
- [ ] Land of Legends kanibalizasyonu: blog 8. sırada, satış sayfası 39. sırada

---

## Çalışma kuralları (bu projede öğrenilenler)

- **Yeni blog yazısı ekleme.** Sorunu yaratan buydu — blog satış sayfalarını gömüyor.
  Enerji bölge (satış) sayfalarına gitmeli.
- **Ana kelimelerin peşine düşme** (`antalya airport transfer` vb.) — 80. sırada, karşıda
  Booking/GetTransfer/Kiwitaxi var. Bu yıl olmaz.
- **Hiçbir dili yarım bırakma.** Bir bölge veya yazı ele alınıyorsa 6 dilde birden.
- **Mesafe/süre yazmadan önce `supabase/seed.sql`'e bak.** Blog metni ile bölge sayfası
  çelişirse hem müşteriye yanlış bilgi hem Google'a tutarsızlık sinyali gider.
- Migration'lar kullanıcı tarafından **elle** Supabase SQL Editor'e yapıştırılıyor
  (proje kökünde `.env` yok, DDL için doğrudan Postgres bağlantısı gerekiyor).
