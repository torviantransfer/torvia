# TORVIAN Transfer — Tam Site Denetim Raporu
**Tarih:** 11 Nisan 2026

---

## 🔴 KRİTİK SORUNLAR

### 1. TURUNCU RENK KULLANIMI (Marka İhlali)
Marka renkleri: Mavi `#007AFF`, Yeşil `#10B981` (sadece logo). Turuncu OLMAMALI.

| Dosya | Satır | Detay |
|-------|-------|-------|
| `src/components/home/TrustBadges.tsx` | 13 | `#FF9500` + `rgba(255,149,0,0.08)` — badge rengi |
| `src/components/home/HowItWorks.tsx` | 11 | `#F97316` — Step 2 ikon rengi |
| `src/components/home/VehicleShowcase.tsx` | 27 | `#F97316` — Armchair spec ikonu |
| `src/app/[locale]/about/page.tsx` | 85, 104, 127, 129, 253 | `#FF9500` — yıldız, ikon, badge, CTA buton |
| `src/app/[locale]/contact/page.tsx` | 86 | `#FF9500` — saat ikonu |
| `src/app/[locale]/faq/page.tsx` | 61, 87 | `#FF9500` — FAQ 5-8 badge, CTA buton |
| `src/app/[locale]/cancellation/page.tsx` | 88, 130 | `#FF9500` — Step 2 ve Step 6 badge |
| `src/app/[locale]/track/page.tsx` | 44 | `text-orange-500` — MapPin ikonu |
| `src/app/[locale]/[region]/page.tsx` | 362, 555 | `#F97316` — CTA butonları |
| `src/app/[locale]/blog/page.tsx` | 177 | `#F97316` — buton |
| `src/app/[locale]/blog/[slug]/page.tsx` | 252 | `#F97316` — buton |
| `src/components/booking/StripeCheckoutEmbed.tsx` | 32, 51-68 | `#F97316` — Stripe primary renk + border |
| `src/app/[locale]/error.tsx` | 23 | `#FF3B30 → #FF9500` gradient |
| `src/app/global-error.tsx` | 29 | `#FF3B30 → #FF9500` gradient |
| `src/components/driver/DriverPanel.tsx` | 154, 177, 200 | `orange-500/600` — header, ikon, yazı |

### 2. GÜVENLİK AÇIĞI — Telegram Token
- **Dosya:** `test-telegram.mjs` (satır 6)
- **Sorun:** Bot token açık metin: `8747170445:AAEE3ivmdB2dJOZ-...`
- **Çözüm:** Dosyayı SİL, token'ı Telegram'dan iptal et

### 3. METADATA EKSİK SAYFALAR (SEO)
| Sayfa | Durum | Öneri |
|-------|-------|-------|
| `track/page.tsx` | Metadata yok | SEO metadata ekle |
| `booking/success/page.tsx` | Metadata yok | `robots: { index: false }` ekle |
| `booking/cancel/page.tsx` | Metadata yok | `robots: { index: false }` ekle |
| `account/login/page.tsx` | Metadata yok | `robots: { index: false }` ekle |
| `account/(protected)/page.tsx` | Metadata yok | `robots: { index: false }` ekle |
| `account/(protected)/profile/page.tsx` | Metadata yok | `robots: { index: false }` ekle |
| `account/reset-password/page.tsx` | Metadata yok | `robots: { index: false }` ekle |

### 4. HERO GÖRSELİ OPTİMİZE DEĞİL
- **Dosya:** `src/components/home/HeroSection.tsx` (satır 17)
- **Sorun:** `unoptimized` ve `quality={100}` kullanılıyor
- **Etki:** Next.js görsel optimizasyonu devre dışı, sayfa hızı düşer
- **Çözüm:** Her ikisini kaldır

### 5. BUILD BLOCKER — Resend API Key
- **Dosya:** `src/app/api/newsletter/route.ts`
- **Sorun:** `RESEND_API_KEY` eksik, build fail oluyor
- **Çözüm:** Vercel env'e ekle veya route'u conditional yap

---

## 🟡 ÖNEMLİ SORUNLAR

### 6. DARK THEME KALINTILARI
| Dosya | Satır | Detay |
|-------|-------|-------|
| `src/components/booking/BookingFormMini.tsx` | 343, 417 | `bg-gray-800 hover:bg-gray-900` — tarih butonları koyu |
| `src/components/driver/QRScanner.tsx` | 142 | `bg-gray-800` — koyu buton |
| `src/components/driver/DriverPanel.tsx` | 407 | `bg-gray-800` — koyu buton |

### 7. AuthModal ÇEVİRİLER HARDCODED
- **Dosya:** `src/components/auth/AuthModal.tsx` (satır 9-11)
- **Sorun:** Çeviriler bileşen içinde inline nesne olarak tanımlı
- **Çözüm:** JSON dosyalarına taşı, `t("auth.loginTitle")` kullan

### 8. BookingFormMini HAVALİMANI ADI
- **Dosya:** `src/components/booking/BookingFormMini.tsx` (satır 186)
- **Sorun:** `"Antalya Havalimanı (AYT)"` sadece Türkçe yazılmış
- **Çözüm:** `t("booking.airport")` kullan (zaten tüm dillerde mevcut)

### 9. DEV DOSYALARI REPODA
Üretime gitmemesi gereken dosyalar:
```
test-telegram.mjs    ← SİL (güvenlik)
fix-all-design.js    ← .gitignore
fix-round2.js        ← .gitignore
fix-round3.js        ← .gitignore
fix-round4.js        ← .gitignore
fix-translations.js  ← .gitignore
rebrand.js           ← .gitignore
rebrand-fix.js       ← .gitignore
run-seed.js          ← .gitignore
update-seo.js        ← .gitignore
```

### 10. GECE ÜCRETİ ÇELİŞKİSİ
- **Terms sayfası:** "%15 gece farkı uygulanır"
- **FAQ sayfası:** "Gece farkı uygulanmaz"
- **Çözüm:** Politikaya karar ver, tüm dillerde tutarlı yap

### 11. FOOTER ARIA-LABEL ÇEVRİLMEMİŞ
- **Dosya:** `src/components/Footer.tsx` (satır 74-80)
- **Sorun:** `aria-label="TORVIAN Transfer on Instagram"` vb. sadece İngilizce
- **Çözüm:** JSON'a ekle, `t()` ile çevir

### 12. HERO ALT TEXT BOŞ
- **Dosya:** `src/components/home/HeroSection.tsx` (satır 17)
- **Sorun:** `alt=""` — SEO için açıklayıcı metin olmalı
- **Çözüm:** `alt="Antalya Airport VIP Transfer Service"` gibi

---

## 🟢 İYİ DURUMDA — DEĞİŞİKLİK GEREKMİYOR

| Alan | Durum |
|------|-------|
| Hreflang / Canonical URL'ler | ✅ 5 dil mükemmel |
| Structured Data (JSON-LD) | ✅ 8 sayfada kapsamlı schema |
| robots.txt & Sitemap | ✅ Dinamik, doğru yapıda |
| API güvenliği | ✅ Zod validasyon, rate limiting, admin koruması |
| Stripe webhook doğrulaması | ✅ İmza kontrolü var |
| TypeScript strict mode | ✅ Tip hataları yok |
| Security headers (HSTS, CSP, X-Frame) | ✅ Kapsamlı |
| Çeviri dosyaları (5 dil) | ✅ %100 anahtar tutarlılığı |
| next-intl routing | ✅ localePrefix: "always" |
| Supabase RLS | ✅ Row-level security aktif |
| Dependency'ler | ✅ Temiz, güncel |
| Input validasyonu (Zod) | ✅ Tüm mutasyon endpoint'lerinde |
| Rate limiting | ✅ newsletter, contact, reservations |

---

## 📋 VERCEL DEPLOY CHECKLIST

Vercel Environment Variables olarak eklenmeli:
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_AUDIENCE_ID`
- [ ] `ADMIN_EMAILS`
- [ ] `TELEGRAM_BOT_TOKEN`
- [ ] `TELEGRAM_CHAT_ID`
- [ ] `NEXT_PUBLIC_SITE_URL` → `https://torviantransfer.com`
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER`
- [ ] `NEXT_PUBLIC_GA_ID`
- [ ] `NEXT_PUBLIC_FB_PIXEL_ID`

---

## 📊 ÖZET

| Kategori | Kritik | Önemli | İyi |
|----------|--------|--------|-----|
| Tasarım tutarlılığı | 2 | 1 | — |
| SEO | 2 | 1 | 5 |
| Dil/Çeviri | — | 3 | 2 |
| Kod/Güvenlik | 1 | 1 | 6 |
| **TOPLAM** | **5** | **6** | **13** |

---

## 🔄 12 Nisan 2026 Güncelleme Notu

Bu rapora ek olarak, canlı UI ve rezervasyon akışında aşağıdaki eksikler tespit edildi:

1. Booking akışında (bölge seçimi sonrası) navbar görünmüyordu.  
2. Booking hero ve ana sayfa hero alanlarında metinler fixed navbar altına kayıyordu.  
3. Mobil booking adımlarında buton/metin taşmaları ve sıkışmalar vardı.  
4. "Bu tarih dolu" uyarı kartı genel tasarım dilinden kopuktu.  
5. Marka/iletişim tutarlılığı için telefon/WhatsApp alanlarında tek numara standardı gerekliydi.  
6. Voucher/e-posta içeriklerinde isim tabelası ifadesi geçen metinler operasyonla uyumsuzdu.  
7. Gece tarifesi metinlerinde "uygulanmaz" tarzı ifadeler farklı sayfalarda tutarsızlık üretiyordu.

### Uygulanan Düzeltmeler (Faz-1)

- Navbar, booking sayfasında tüm akışta görünür hale getirildi.
- Hero alanlarındaki navbar çakışması düzeltildi.
- Booking step 2 mobil düzeni iyileştirildi (buton boyutları, satır taşmaları, padding/stack).
- Tarih doluluk uyarısı kartı, sitenin mavi tasarım diline uygun hale getirildi.
- Voucher/e-posta metinlerinde isim tabelası referansları "belirlenen buluşma noktası" ifadesine çekildi.
- Numara standardı 08508401327 olacak şekilde güncellendi.
- TR/EN metinlerinde gece tarifesi ifadeleri daha nötr ve tutarlı hale getirildi.

### Devam Eden / Sonraki Faz

- Kalan dil dosyalarında (DE/PL/RU) karşılama tabelası ve gece tarifesi metinlerinin aynı politika ile tamamen hizalanması.
- Mobil breakpoint testlerinin cihaz bazlı doğrulaması (özellikle 320px ve 360px genişlik).
