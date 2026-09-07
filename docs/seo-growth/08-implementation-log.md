# 08 — Uygulama Kaydı

Her değişiklik tam kaydıyla. Uygulanmayan kararlar da burada — neden
uygulanmadığı, uygulanan kadar önemli.

---

## GROWTH-001 — Blog "ilgili yazılar": recency yıldızı → konusal seçim

| | |
| --- | --- |
| **Locale** | 7'sinin tamamı |
| **URL** | 196 (28 yazı × 7 dil) |
| **Page type** | blog-post |
| **Risk** | LOW |
| **Kaynak** | `src/app/[locale]/blog/[slug]/page.tsx` (kod) |

**Before**

```ts
const { data: related } = await supabase
  .from("blog_posts").select("*")
  .eq("is_published", true).neq("slug", slug)
  .order("published_at", { ascending: false })
  .limit(3);
```

Site genelinde en son yayımlanan 3 yazı, her makalede aynı. Çeviri kontrolü yok.

**After**

Yayındaki tüm yazılar çekiliyor, sonra:
1. bu locale'e **çevrilmiş** olanlar filtreleniyor,
2. aynı destinasyonu (`primary_region_slug` / `blogCtaRegionFallbacks`) paylaşanlar +2 puan,
3. paylaşılan slug'da ortak konu kelimesi olanlar +1 puan,
4. ilk 3.

**Kanıt (ölçülmüş, 2026-09-07)**

| Sayfa | Gelen link |
| --- | ---: |
| `/en/blog/flughafen-transfer-antalya` (en yeni) | **28** |
| `/en/blog/car-rental-vs-private-transfer-antalya` (en yeni) | **28** |
| `/en/blog/uber-antalya-havalimani-ulasim` (6.341 gösterim, poz 7,9) | **1** |
| `/en/blog/antalya-airport-taxi-vs-private-transfer` (2.894 gösterim) | **1** |

İç link eşitliği yayın tarihine göre dağıtılıyordu, konuya veya performansa göre değil.

**İkinci hata:** blok `rp[title_${loc}] || rp.title_en` kullanıyordu. Çeviri
filtresi olmadığı için Hollandaca bir makalenin altında İngilizce başlıklar
çıkıyor ve o locale'de **noindex olan URL'lere** link veriliyordu. Fallback'ler
kaldırıldı.

**Beklenen etki:** link equity'nin konusal olarak akması; karışık dilli anchor
ve noindex hedeflerin bitmesi. Sıralama garantisi verilmiyor.

**Regression check:** `npx tsc --noEmit`, `npm run build`, `verify:growth`
(`related-locale-safety`).

---

## GROWTH-002 — `/de/vip-transfer-antalya` kendi niyetine dönüyor

| | |
| --- | --- |
| **Locale** | de · **URL** 1 · **Page type** landing |
| **Risk** | LOW |
| **Kaynak** | `supabase/migrations/074_seo_override_retargeting.sql` |
| **Primary keyword** | vip transfer antalya · **Intent** commercial investigation |

**Before** (DB override): `Flughafentransfer Antalya | Privat & VIP zum Festpreis`
**After** (kod fallback): `VIP Transfer Antalya Flughafen | Premium Privatfahrzeug`

**Kanıt:** `docs/seo-growth/_ownership.cjs` — 35 landing başlığından 33'ü kod
kaynaklı, 2'si DB override. Bu ikisinden biri.

Beş Almanca URL aynı head term'i taşıyordu (`/de`, `/de/antalya-airport-transfer`,
bu sayfa, iki blog). VIP niyetini hedefleyen tek sayfa onu bırakmıştı.
619 kelime, 1 gelen link. Historical veride Almanca private-transfer sorguları
poz 36–41 → korunacak sıralama yok.

**Beklenen etki:** VIP cluster'ının tek sahibi olması; head term kuyruğunun
beşten dörde inmesi.

---

## GROWTH-003 — `/en/antalya-airport-transfer` differentiator'larını geri alıyor

| | |
| --- | --- |
| **Locale** | en · **Risk** LOW · **Kaynak** migration 074 |

**Before** (override): `Antalya Airport Transfer | Private & VIP Transfer`
**After** (kod): `Antalya Airport Transfer | Fixed Price, Meet & Greet, Book Online`
**Ana sayfa:** `Antalya Airport Transfer | Private Transfer to Belek, Side, Alanya, Kemer`

Override, ana sayfayla aynı şeyi daha az ayırt edici kelimeyle söylüyordu.

**SERP kanıtı:** canlı İngilizce SERP'te sıralanan sonuçların tamamı sabit
fiyat / meet & greet / uçuş takibi vurguluyor. Kod fallback'i üçünü de sayıyor.

---

## GROWTH-004 — `/nl/kvkk` kendi başlığını geri alıyor (SEO-019)

| | |
| --- | --- |
| **Locale** | nl · **Risk** LOW · **Kaynak** migration 074 |

**Before** (override): `Privacybeleid` — `/nl/privacy` ile birebir aynı
**After** (messages): `Beleid gegevensbescherming` — sayfanın kendi H1'i

Override sayfanın kendi başlığıyla çelişiyor ve başlığını başka bir sayfaya
veriyordu. İki sayfanın ayrı legal niyeti korunuyor.

---

## GROWTH-005 — `/nl` ana sayfa: incelendi, DEĞİŞTİRİLMEDİ

| | |
| --- | --- |
| **Locale** | nl · **Risk** — · **Kaynak** yok (geri alındı) |

**Yapılan ve geri alınan:** başlık "Transfer Luchthaven Antalya…" olarak
değiştirildi, sonra eski haline döndürüldü.

**Neden değiştirildi:** canlı Hollandaca SERP'te 8 sonucun 7'si "luchthaven"
kullanıyor.

**Neden geri alındı:** Google Autocomplete (NL) —

| Sorgu | Tamamlama |
| --- | ---: |
| `antalya airport transfer` | 8 |
| `prive transfer antalya` | 10 |
| `antalya luchthaven transfer` | **1** |

Rakiplerin kendilerini nasıl adlandırdığı, kullanıcının ne yazdığının kanıtı
değil. Mevcut başlık zaten en çok yazılan iki ifadeyi taşıyor.

Kayıt tutuluyor çünkü kararın kendisi kadar **nasıl geri alındığı** da bu
görevin çıktısı.

---

## GROWTH-006 — İngilizce yazının Almanca başlığı

| | |
| --- | --- |
| **Locale** | en · **Risk** LOW · **Kaynak** migration 075 |

**Before:** `Flughafen Transfer Antalya: Fixed-Price Rides to Your Hotel`
**After:** `Antalya Airport Transfer: Private, Fixed-Price Rides to Your Hotel`

**Kanıt:** makalenin kendi açılış başlığı (`content_en` içinde) zaten
"Antalya Airport Transfer: Private, Fixed-Price Rides to Your Hotel" diyor.
Gövde tamamen İngilizce, 1.258 kelime. Yalnız `title_en` Almanca head term
taşıyordu. Bu bir veri hatası, içerik kararı değil — düzeltme yazarın kendi
cümlesi.

**Slug'a dokunulmadı** (§43): `flughafen-transfer-antalya` bir İngilizce URL
için düzensiz ama slug değişikliği, arama performansı bilinmeyen bir sayfada
redirect maliyeti demek. Google dil için başlığı ve başlığı okur, yolu değil.

---

## Uygulanmayan kararlar

| ID | Ne | Neden uygulanmadı |
| --- | --- | --- |
| CANN-01 | airport-to-hotel blog konsolidasyonu (≈13 URL) | Hangi yazının gösterim aldığı GSC olmadan bilinemiyor. Migration 030 tam bunu yaptı, yanlış yazıyı kaldırdı, 037 geri almak zorunda kaldı. |
| CANN-02 | airport-transfer guide konsolidasyonu | Aynı sebep. |
| CANN-05 | lara / kundu birleştirme | Kasıtlı ayrı: rota fiyat sayfası ≠ destinasyon landing. |
| CANN-06 | TR destinasyon listesi ayrıştırma | Türkçe'nin en çok linkli üç sayfası ve tek tıklama üreten pazar. Sorgu verisi olmadan risk kabul edilmedi. |
| — | Manavgat aktivasyonu | Gerçek fiyat gerekiyor; placeholder fiyatla yayına almak yasak (§42). |
| — | Yorum/sosyal kanıt | Sahte yorum yasak (§24). Gerçek yorum toplamak sahibin işi. |
| — | `/contact` thin content | 240 kelime niyeti karşılıyor; kelime sayısı için uzatmak yasak (§27). |
