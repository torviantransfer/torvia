# Faz 18 — Ticari niyet, iç link mimarisi, kanibalizasyon

**Durum:** DONE

Bu faz kasıtlı olarak en sona bırakıldı (§20): teknik source-of-truth ve
indexation sağlamlaşmadan içerik mimarisi hakkında karar vermek erken olurdu.

## Ölçüm

`scripts/seo-audit-urls.ts` her sayfanın aynı origin'li `<a href>` linklerini
topluyor. Yalnızca **indexlenebilir** sayfalardan gelen linkler sayılıyor: bir
noindex sayfadan gelen link taşınmaya değer bir sinyal değil, ve sayılsaydı
footer'ı olan bir login ekranı orphan bir sayfayı "linkli" gösterirdi.

### Dil başına dağılım (indexlenebilir ticari + hub sayfalar)

| Dil | Sayfa | Ortalama gelen link | En az | <3 link |
| --- | --- | --- | --- | --- |
| tr | 35 | 29.3 | 1 | 3 |
| en | 35 | 29.6 | 1 | 3 |
| de | 35 | 29.6 | 1 | 3 |
| pl | 35 | 29.3 | 1 | 3 |
| ru | 35 | 29.3 | 1 | 3 |
| nl | 35 | 28.9 | 1 | 3 |
| ro | 35 | 28.5 | 1 | 3 |

Dağılım her dilde aynı şekilli — yani sorun içerikte değil, şablonda.

---

## SEO-029

**Durum:** FIXED
**Severity:** HIGH
**Category:** internal linking / commercial architecture
**Affected files:** `src/components/Footer.tsx`, 7 mesaj dosyası
**Affected URLs:** 21 (3 landing × 7 dil)

**Observed behavior (production, /en):**

```
  1  /en/hotel-transfer-antalya   (landing, sitemap priority 0.9)
  1  /en/lara-beach-transfer      (landing, sitemap priority 0.9)
  1  /en/vip-transfer-antalya     (landing, sitemap priority 0.9)
  …
 69  /en/about                    (static)
 69  /en/contact                  (static)
 69  /en/faq                      (static)
```

Sitenin satış yapan üç landing sayfası, indexlenebilir sayfaların **en az link
alanları**. `/en/hotel-transfer-antalya` ve `/en/vip-transfer-antalya`'ya bütün
sitede tek bir link var (`/en/booking`'den); `/en/lara-beach-transfer`'e de tek
(`/en/kundu-lara-transfer`'den). Aynı anda "Hakkımızda" 69 link alıyor.

**Expected behavior:** ticari sayfalar en azından bilgilendirme sayfaları kadar
linklenmeli. İç linkler Google'ın bir sayfanın önemini okuduğu sinyal.

**Root cause:** footer'da dört sütun var — Şirket, Popüler Destinasyonlar,
Yasal, İletişim. Landing sayfaları hiçbirinde değil. `land-of-legends-transfer`
69 link alıyor çünkü bölge kaydı olarak "Popüler Destinasyonlar" sütununa
düşüyor; diğer üçünün bölge kaydı yok, dolayısıyla hiçbir yere düşmüyorlar.

**Fix:** footer'a beşinci bir sütun eklendi — "Transfer Hizmetleri":
`antalya-airport-transfer`, `vip-transfer-antalya`, `hotel-transfer-antalya`,
`lara-beach-transfer`. Etiketler 7 dilde çevrildi
(`footer.servicesHeading`, `footer.linkAirportTransfer` …).

Bu, üç sayfayı 1 linkten ~69'a çıkarır ve `antalya-airport-transfer`'i 25'ten
yükseltir. Yeni sayfa yaratmıyor, mevcut indexlenebilir ticari sayfaları
görünür kılıyor.

**Regression test:** audit script'inin `orphan-page` (0 gelen link, error) ve
`weakly-linked` (<3, bölge sayfaları için warning) kuralları.

**Runtime verification:** deploy sonrası `npm run audit:seo` → raporun
"İç link dağılımı" tablosunda `en` satırındaki "En az" değeri 3'ten büyük
olmalı.

---

## SEO-028

**Durum:** FIXED
**Severity:** HIGH
**Category:** silent query failure / internal linking
**Affected files:** `src/components/home/BlogPreview.tsx`
**Affected URLs:** 7 ana sayfa

**Observed behavior:** ana sayfanın blog bölümü **hiçbir dilde render
edilmiyor**. Production'da yedi ana sayfanın hiçbirinde blog başlığı ya da blog
kartı yok.

**Root cause:** bileşen `select("slug, title, content, image_url, published_at")`
sorguluyor. `blog_posts` tablosunda `title` ve `content` diye kolon **yok** —
migration 001'den beri `title_tr`, `title_en`, … şeklinde. PostgREST hata
dönüyor, `data` null oluyor, `if (!posts) return null` bunu "yazı yok"a
çeviriyor ve bölüm sessizce kayboluyor.

Ana sayfanın bloga giden tek bağlamsal linkleri bunlardı; footer'daki "Blog"
linki dışında hiçbir şey kalmamış.

Ayrıca bileşenin `Locale` tipi **beş** dil tanımlıyordu (`nl` ve `ro` yok), yani
sorgu düzeltilseydi Hollandaca ve Romence ana sayfalarda başlık, alt başlık ve
"tüm yazılar" etiketi `undefined` basılacaktı — SEO-001'in aynı sınıfı.

**Evidence:** production'da yedi ana sayfanın hiçbirinde blog `<h2>`'si yok;
`blog_posts` şemasında (001, satır 243–260) `title`/`content` kolonu yok.

**Fix:** locale kolonları okunuyor, `Locale` tipi merkezden import ediliyor
(7 dil, eksik dil derlemeyi kırar), `localizedBlogSlug()` ile locale'in kendi
URL'sine linkleniyor (aksi hâlde `/nl/blog/<türkçe-slug>` 301'lenirdi), yalnızca
o dile çevrilmiş yazılar gösteriliyor, ve sorgu hatası artık `console.error` ile
loglanıyor.

**Kapsam notu:** aynı sınıfta başka bir hata var mı diye bütün
`.from(x).select("…")` çağrıları migration zincirinden çıkarılan kolon
kümesine karşı denetlendi. SEO tarafında başka bir olmayan-kolon bulunmadı.
Denetim SEO dışında bir tane buldu — bkz. SEO-030.

---

## SEO-030 (SEO dışı — kayda geçirildi, düzeltilmedi)

**Durum:** TODO (sahibinin kararı gerekiyor)
**Severity:** MEDIUM
**Category:** booking availability
**Affected files:** `src/app/api/availability/route.ts:107`

`reservations` tablosundan `category_slug` seçiliyor. Böyle bir kolon şemada
yok — `reservations.category_id UUID REFERENCES vehicle_categories(id)` var
(001, satır 145). Sorgu hata dönüyor, `dateReservations` null oluyor,
`bookedSlugs` boş kalıyor ve **alternatif tarih önerisi her araç sınıfını her
zaman müsait gösteriyor**.

Düzeltilmedi: rezervasyon/müsaitlik davranışını değiştirmek bu görevin kapsamı
dışında ve doğru semantiğin ne olduğu (araç sınıfı başına günlük limit modeli
şemada yok) sahibinin kararı. Kayda geçirildi.

---

## Kanibalizasyon

| Kontrol | Sonuç |
| --- | --- |
| Aynı niyeti hedefleyen iki sayfa | 1 küme bulundu — Alanya süre yazıları, bkz. SEO-008 |
| Aynı locale'de aynı title | 18 sayfa; 14'ü admin (SEO-004), 2'si Alanya kümesi (SEO-008), 2'si `/nl/kvkk`+`/nl/privacy` (SEO-019) |
| Aynı canonical | 2 sayfa (SEO-008) |
| Çevrilmemiş metadata (iki dil aynı title) | 0 |
| Bölge ↔ landing çakışması | 1 (SEO-009, `land-of-legends-transfer`) |
| Blog → bölge bağlamsal link | mevcut — `blogCtaRegionFallbacks` + `primary_region_slug` |
| Bölge → komşu bölge mesh | mevcut, çalışıyor (küçük bölgeler 6–10 link) |
| Breadcrumb | bütün region/landing/blog sayfalarında |

### Search intent ayrımı korundu

Hiçbir blog yazısı satış sayfasına dönüştürülmedi. `/de/blog/…` gibi
bilgilendirici sorgularda sıralanan sayfalar olduğu gibi bırakıldı; yapılan tek
şey mevcut ticari sayfaları footer üzerinden görünür kılmak ve ana sayfanın
bloga giden bağlamsal linklerini geri getirmek oldu.

| Niyet | Sayfa sınıfı | Dokunuldu mu |
| --- | --- | --- |
| Informational | blog yazıları | Hayır (metin değişmedi) |
| Comparison | "taksi mi transfer mi", "mesafe/süre" yazıları | Hayır |
| Commercial investigation | landing sayfaları | Sadece iç link eklendi |
| Transactional | `/booking`, bölge sayfaları | Sadece teknik düzeltmeler |

### Zayıf kalan bölge sayfaları

`marmaris-transfer` (3 link) ve `kizilagac-transfer` (4 link) mesh'in kenarında
kalıyor — coğrafi komşuları az. Bu bir defect değil, mesafeye dayalı seçimin
doğal sonucu. Kayda geçirildi; sahibi isterse bu iki bölgeyi `is_popular`
yaparak footer'a alabilir.
