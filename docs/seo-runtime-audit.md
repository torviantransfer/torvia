# SEO Runtime Audit

- **Hedef:** https://torviantransfer.com
- **Kapsam:** full
- **Çalıştırma:** 2026-09-07T15:26:46.853Z
- **Sitemap girdisi:** 482
- **Aktif bölge:** 25

## Özet

| Ölçüt | Değer |
| --- | --- |
| TOTAL URLS | 531 |
| PASSED | 442 |
| FAILED | 89 |
| BLOCKED | 0 |
| REDIRECTS | 1 |
| NOINDEX EXPECTED | 56 |
| 404 ERRORS | 0 |
| CANONICAL ERRORS | 1 |
| HREFLANG ERRORS | 13 |
| METADATA ERRORS | 42 |

## Dil bazında

| Dil | URL | PASS | FAIL |
| --- | --- | --- | --- |
| tr | 76 | 66 | 10 |
| en | 77 | 68 | 9 |
| de | 77 | 68 | 9 |
| pl | 76 | 67 | 9 |
| ru | 76 | 67 | 9 |
| nl | 75 | 64 | 11 |
| ro | 74 | 42 | 32 |

## Bulgu türleri

| Bulgu | Seviye | Sayfa |
| --- | --- | --- |
| `title-double-brand` | warning | 36 |
| `og-image-broken` | error | 28 |
| `hreflang-incomplete` | error | 26 |
| `placeholder-leak` | error | 24 |
| `should-be-noindex` | error | 21 |
| `duplicate-title` | error | 18 |
| `duplicate-description` | error | 16 |
| `hreflang-not-reciprocal` | error | 7 |
| `thin-content` | warning | 6 |
| `hreflang-redirect-target` | error | 5 |
| `duplicate-canonical` | error | 2 |
| `h1-multiple` | warning | 2 |
| `redirected` | error | 1 |
| `sitemap-redirect` | error | 1 |
| `canonical-mismatch` | warning | 1 |
| `hreflang-self-mismatch` | warning | 1 |
| `hreflang-no-self` | error | 1 |
| `canonical-hreflang-conflict` | error | 1 |

## Sitemap'te tekrar eden URL

- `/de/land-of-legends-transfer`
- `/en/land-of-legends-transfer`
- `/nl/land-of-legends-transfer`
- `/pl/land-of-legends-transfer`
- `/ro/land-of-legends-transfer`
- `/ru/land-of-legends-transfer`
- `/tr/land-of-legends-transfer`

## Başarısız URL'ler (89)

### `/tr`

- HTTP 200
- title: Antalya Havalimanı Transfer | Özel Transfer Belek, Side, Alanya, Kemer | TORVIAN Transfer
- canonical: https://torviantransfer.com/tr
- robots: index, follow
- **ERROR** `hreflang-incomplete` — hreflang kümesi eksik: /(ana sayfa) için indexlenebilir ama bildirilmeyen diller: ro

### `/tr/admin`

- HTTP 200
- title: TORVIAN Transfer | Antalya Airport VIP Transfer
- canonical: —
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/tr/admin, /tr/admin/login): TORVIAN Transfer | Antalya Airport VIP Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/tr/admin, /tr/admin/login): Antalya Airport VIP Transfer Service - Professional private transfer to Belek, S

### `/tr/admin/login`

- HTTP 200
- title: TORVIAN Transfer | Antalya Airport VIP Transfer
- canonical: —
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/tr/admin, /tr/admin/login): TORVIAN Transfer | Antalya Airport VIP Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/tr/admin, /tr/admin/login): Antalya Airport VIP Transfer Service - Professional private transfer to Belek, S

### `/tr/blog/antalya-7-24-transfer-hizmeti`

- HTTP 200
- title: 7/24 Antalya Havalimanı Transfer — Gece Geç Saatte de Güvenli Ulaşım | TORVIAN Transfer
- canonical: https://torviantransfer.com/tr/blog/antalya-7-24-transfer-hizmeti
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/gece-transfer.jpg

### `/tr/blog/antalya-alanya-transfer-suresi`

- HTTP 200 (1 yönlendirme)
- title: Antalya Havalimanı Alanya Kaç Saat? 130 km, 2 Saat | TORVIAN Transfer
- canonical: https://torviantransfer.com/tr/blog/antalya-havalimani-alanya-transfer-kac-saat
- robots: index, follow
- **ERROR** `redirected` — Yönlendirme: 308 → /tr/blog/antalya-havalimani-alanya-transfer-kac-saat
- **ERROR** `sitemap-redirect` — Sitemap'te ama yönlendiriyor: → https://torviantransfer.com/tr/blog/antalya-havalimani-alanya-transfer-kac-saat
- **ERROR** `hreflang-not-reciprocal` — hreflang karşılıklı değil: /tr/blog/antalya-alanya-transfer-suresi → /tr/blog/antalya-havalimani-alanya-transfer-kac-saat, ama geri dönüş yok (Google kümeyi yok sayar)
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/tr/blog/antalya-alanya-transfer-suresi, /tr/blog/antalya-havalimani-alanya-transfer-kac-saat): Antalya Havalimanı Alanya Kaç Saat? 130 km, 2 Saat | TORVIAN Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/tr/blog/antalya-alanya-transfer-suresi, /tr/blog/antalya-havalimani-alanya-transfer-kac-saat): Antalya Havalimanı ile Alanya arası 130 km, özel transferle yaklaşık 2 saat. Mah
- **ERROR** `duplicate-canonical` — Aynı canonical: 2 indexlenebilir sayfa /tr/blog/antalya-havalimani-alanya-transfer-kac-saat adresini gösteriyor (/tr/blog/antalya-alanya-transfer-suresi, /tr/blog/antalya-havalimani-alanya-transfer-kac-saat)

### `/tr/blog/antalya-havalimani-alanya-transfer-kac-saat`

- HTTP 200
- title: Antalya Havalimanı Alanya Kaç Saat? 130 km, 2 Saat | TORVIAN Transfer
- canonical: https://torviantransfer.com/tr/blog/antalya-havalimani-alanya-transfer-kac-saat
- robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/tr/blog/antalya-alanya-transfer-suresi, /tr/blog/antalya-havalimani-alanya-transfer-kac-saat): Antalya Havalimanı Alanya Kaç Saat? 130 km, 2 Saat | TORVIAN Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/tr/blog/antalya-alanya-transfer-suresi, /tr/blog/antalya-havalimani-alanya-transfer-kac-saat): Antalya Havalimanı ile Alanya arası 130 km, özel transferle yaklaşık 2 saat. Mah
- **ERROR** `duplicate-canonical` — Aynı canonical: 2 indexlenebilir sayfa /tr/blog/antalya-havalimani-alanya-transfer-kac-saat adresini gösteriyor (/tr/blog/antalya-alanya-transfer-suresi, /tr/blog/antalya-havalimani-alanya-transfer-kac-saat)

### `/tr/blog/antalya-havalimani-kas-transfer`

- HTTP 200
- title: Antalya Havalimanı Kaş Transfer — Sabit Fiyatlı VIP Araç Rehberi | TORVIAN Transfer
- canonical: https://torviantransfer.com/tr/blog/antalya-havalimani-kas-transfer
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/kas-transfer.jpg

### `/tr/blog/antalya-havalimani-transfer-fiyatlari`

- HTTP 200
- title: Antalya Havalimanı Transfer Fiyatları 2026 — Güncel Sabit Fiyat Listesi | TORVIAN Transfer
- canonical: https://torviantransfer.com/tr/blog/antalya-havalimani-transfer-fiyatlari
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/transfer-fiyatlari.jpg

### `/tr/blog/antalya-mercedes-vito-vip-transfer`

- HTTP 200
- title: Mercedes Vito ile Antalya VIP Transfer — Lüks Ulaşımın Adresi | TORVIAN Transfer
- canonical: https://torviantransfer.com/tr/blog/antalya-mercedes-vito-vip-transfer
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/mercedes-vito-vip.jpg

### `/tr/track`

- HTTP 200
- title: Rezervasyon Takip | TORVIAN Transfer
- canonical: https://torviantransfer.com/tr/track
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow

### `/en`

- HTTP 200
- title: Antalya Airport Transfer | Private Transfer to Belek, Side, Alanya, Kemer | TORVIAN Transfer
- canonical: https://torviantransfer.com/en
- robots: index, follow
- **ERROR** `hreflang-incomplete` — hreflang kümesi eksik: /(ana sayfa) için indexlenebilir ama bildirilmeyen diller: ro

### `/en/admin`

- HTTP 200
- title: TORVIAN Transfer | Antalya Airport VIP Transfer
- canonical: —
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/en/admin, /en/admin/login): TORVIAN Transfer | Antalya Airport VIP Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/en/admin, /en/admin/login): Antalya Airport VIP Transfer Service - Professional private transfer to Belek, S

### `/en/admin/login`

- HTTP 200
- title: TORVIAN Transfer | Antalya Airport VIP Transfer
- canonical: —
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/en/admin, /en/admin/login): TORVIAN Transfer | Antalya Airport VIP Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/en/admin, /en/admin/login): Antalya Airport VIP Transfer Service - Professional private transfer to Belek, S

### `/en/blog/antalya-24-7-airport-transfer`

- HTTP 200
- title: 24/7 Antalya Airport Transfer — Late Night & Early Morning Arrivals | TORVIAN Transfer
- canonical: https://torviantransfer.com/en/blog/antalya-24-7-airport-transfer
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/gece-transfer.jpg

### `/en/blog/antalya-airport-to-kas-transfer`

- HTTP 200
- title: Antalya Airport to Kas Private VIP Transfer — Complete Guide | TORVIAN Transfer
- canonical: https://torviantransfer.com/en/blog/antalya-airport-to-kas-transfer
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/kas-transfer.jpg

### `/en/blog/antalya-airport-transfer-prices`

- HTTP 200
- title: Antalya Airport Transfer Cost 2026 — Fixed Price Guide | TORVIAN Transfer
- canonical: https://torviantransfer.com/en/blog/antalya-airport-transfer-prices
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/transfer-fiyatlari.jpg

### `/en/blog/antalya-to-alanya-travel-time`

- HTTP 200
- title: Antalya to Alanya: 130 km and About 2 Hours by Road | TORVIAN Transfer
- canonical: https://torviantransfer.com/en/blog/antalya-to-alanya-travel-time
- robots: index, follow
- **ERROR** `hreflang-redirect-target` — hreflang yönlendirilen adrese işaret ediyor: tr → https://torviantransfer.com/tr/blog/antalya-alanya-transfer-suresi → https://torviantransfer.com/tr/blog/antalya-havalimani-alanya-transfer-kac-saat
- **ERROR** `hreflang-not-reciprocal` — hreflang karşılıklı değil: /en/blog/antalya-to-alanya-travel-time → /tr/blog/antalya-alanya-transfer-suresi, ama geri dönüş yok (Google kümeyi yok sayar)

### `/en/blog/mercedes-vito-vip-transfer-antalya`

- HTTP 200
- title: Mercedes Vito VIP Transfer Antalya — Luxury Airport Minivan | TORVIAN Transfer
- canonical: https://torviantransfer.com/en/blog/mercedes-vito-vip-transfer-antalya
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/mercedes-vito-vip.jpg

### `/en/track`

- HTTP 200
- title: Track Reservation | TORVIAN Transfer
- canonical: https://torviantransfer.com/en/track
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow

### `/de`

- HTTP 200
- title: Antalya Flughafen Transfer | Privattransfer Belek, Side, Alanya, Kemer | TORVIAN Transfer
- canonical: https://torviantransfer.com/de
- robots: index, follow
- **ERROR** `hreflang-incomplete` — hreflang kümesi eksik: /(ana sayfa) için indexlenebilir ama bildirilmeyen diller: ro

### `/de/admin`

- HTTP 200
- title: TORVIAN Transfer | Antalya Airport VIP Transfer
- canonical: —
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/de/admin, /de/admin/login): TORVIAN Transfer | Antalya Airport VIP Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/de/admin, /de/admin/login): Antalya Airport VIP Transfer Service - Professional private transfer to Belek, S

### `/de/admin/login`

- HTTP 200
- title: TORVIAN Transfer | Antalya Airport VIP Transfer
- canonical: —
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/de/admin, /de/admin/login): TORVIAN Transfer | Antalya Airport VIP Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/de/admin, /de/admin/login): Antalya Airport VIP Transfer Service - Professional private transfer to Belek, S

### `/de/blog/antalya-24-7-flughafentransfer`

- HTTP 200
- title: 24/7 Antalya Flughafen Transfer — Auch für Nacht- und Frühflüge | TORVIAN Transfer
- canonical: https://torviantransfer.com/de/blog/antalya-24-7-flughafentransfer
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/gece-transfer.jpg

### `/de/blog/antalya-flughafentransfer-preise`

- HTTP 200
- title: Antalya Flughafen Transfer Preise 2026 — Aktuelle Festpreise | TORVIAN Transfer
- canonical: https://torviantransfer.com/de/blog/antalya-flughafentransfer-preise
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/transfer-fiyatlari.jpg

### `/de/blog/fahrzeit-antalya-nach-alanya`

- HTTP 200
- title: Antalya nach Alanya: 130 km und rund 2 Stunden Fahrzeit | TORVIAN Transfer
- canonical: https://torviantransfer.com/de/blog/fahrzeit-antalya-nach-alanya
- robots: index, follow
- **ERROR** `hreflang-redirect-target` — hreflang yönlendirilen adrese işaret ediyor: tr → https://torviantransfer.com/tr/blog/antalya-alanya-transfer-suresi → https://torviantransfer.com/tr/blog/antalya-havalimani-alanya-transfer-kac-saat
- **ERROR** `hreflang-not-reciprocal` — hreflang karşılıklı değil: /de/blog/fahrzeit-antalya-nach-alanya → /tr/blog/antalya-alanya-transfer-suresi, ama geri dönüş yok (Google kümeyi yok sayar)

### `/de/blog/mercedes-vito-vip-transfer-flughafen-antalya`

- HTTP 200
- title: Mercedes Vito VIP Transfer Antalya — Luxus Flughafentransfer | TORVIAN Transfer
- canonical: https://torviantransfer.com/de/blog/mercedes-vito-vip-transfer-flughafen-antalya
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/mercedes-vito-vip.jpg

### `/de/blog/transfer-flughafen-antalya-nach-kas`

- HTTP 200
- title: Flughafen Antalya nach Kaş VIP Transfer — Vollständiger Leitfaden | TORVIAN Transfer
- canonical: https://torviantransfer.com/de/blog/transfer-flughafen-antalya-nach-kas
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/kas-transfer.jpg

### `/de/track`

- HTTP 200
- title: Buchung Verfolgen | TORVIAN Transfer
- canonical: https://torviantransfer.com/de/track
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow

### `/pl`

- HTTP 200
- title: Transfer z Lotniska Antalya | Prywatny Transfer Belek, Side, Alanya, Kemer | TORVIAN Transfer
- canonical: https://torviantransfer.com/pl
- robots: index, follow
- **ERROR** `hreflang-incomplete` — hreflang kümesi eksik: /(ana sayfa) için indexlenebilir ama bildirilmeyen diller: ro

### `/pl/admin`

- HTTP 200
- title: TORVIAN Transfer | Antalya Airport VIP Transfer
- canonical: —
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/pl/admin, /pl/admin/login): TORVIAN Transfer | Antalya Airport VIP Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/pl/admin, /pl/admin/login): Antalya Airport VIP Transfer Service - Professional private transfer to Belek, S

### `/pl/admin/login`

- HTTP 200
- title: TORVIAN Transfer | Antalya Airport VIP Transfer
- canonical: —
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/pl/admin, /pl/admin/login): TORVIAN Transfer | Antalya Airport VIP Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/pl/admin, /pl/admin/login): Antalya Airport VIP Transfer Service - Professional private transfer to Belek, S

### `/pl/blog/antalya-alanya-czas-przejazdu`

- HTTP 200
- title: Antalya – Alanya: odległość 130 km i czas przejazdu 2 godziny | TORVIAN Transfer
- canonical: https://torviantransfer.com/pl/blog/antalya-alanya-czas-przejazdu
- robots: index, follow
- **ERROR** `hreflang-redirect-target` — hreflang yönlendirilen adrese işaret ediyor: tr → https://torviantransfer.com/tr/blog/antalya-alanya-transfer-suresi → https://torviantransfer.com/tr/blog/antalya-havalimani-alanya-transfer-kac-saat
- **ERROR** `hreflang-not-reciprocal` — hreflang karşılıklı değil: /pl/blog/antalya-alanya-czas-przejazdu → /tr/blog/antalya-alanya-transfer-suresi, ama geri dönüş yok (Google kümeyi yok sayar)

### `/pl/blog/antalya-transfer-24-7`

- HTTP 200
- title: Transfer z Lotniska Antalya 24/7 — Nocne i Poranne Loty | TORVIAN Transfer
- canonical: https://torviantransfer.com/pl/blog/antalya-transfer-24-7
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/gece-transfer.jpg

### `/pl/blog/ceny-transferu-lotnisko-antalya`

- HTTP 200
- title: Ceny Transferu z Lotniska Antalya 2026 — Stałe Ceny | TORVIAN Transfer
- canonical: https://torviantransfer.com/pl/blog/ceny-transferu-lotnisko-antalya
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/transfer-fiyatlari.jpg

### `/pl/blog/mercedes-vito-transfer-vip-antalya`

- HTTP 200
- title: Mercedes Vito VIP Transfer Antalya — Luksusowy Transfer Lotniskowy | TORVIAN Transfer
- canonical: https://torviantransfer.com/pl/blog/mercedes-vito-transfer-vip-antalya
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/mercedes-vito-vip.jpg

### `/pl/blog/transfer-lotnisko-antalya-kas`

- HTTP 200
- title: Transfer z Lotniska Antalya do Kaş — Przewodnik VIP | TORVIAN Transfer
- canonical: https://torviantransfer.com/pl/blog/transfer-lotnisko-antalya-kas
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/kas-transfer.jpg

### `/pl/track`

- HTTP 200
- title: Śledź Rezerwację | TORVIAN Transfer
- canonical: https://torviantransfer.com/pl/track
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow

### `/ru`

- HTTP 200
- title: Трансфер из Аэропорта Анталии | Частный Трансфер Белек, Сиде, Аланья, Кемер | TORVIAN Transfer
- canonical: https://torviantransfer.com/ru
- robots: index, follow
- **ERROR** `hreflang-incomplete` — hreflang kümesi eksik: /(ana sayfa) için indexlenebilir ama bildirilmeyen diller: ro

### `/ru/admin`

- HTTP 200
- title: TORVIAN Transfer | Antalya Airport VIP Transfer
- canonical: —
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/ru/admin, /ru/admin/login): TORVIAN Transfer | Antalya Airport VIP Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/ru/admin, /ru/admin/login): Antalya Airport VIP Transfer Service - Professional private transfer to Belek, S

### `/ru/admin/login`

- HTTP 200
- title: TORVIAN Transfer | Antalya Airport VIP Transfer
- canonical: —
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/ru/admin, /ru/admin/login): TORVIAN Transfer | Antalya Airport VIP Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/ru/admin, /ru/admin/login): Antalya Airport VIP Transfer Service - Professional private transfer to Belek, S

### `/ru/blog/antaliya-alaniya-vremya-v-puti`

- HTTP 200
- title: Анталия – Алания: расстояние 130 км и время в пути 2 часа | TORVIAN Transfer
- canonical: https://torviantransfer.com/ru/blog/antaliya-alaniya-vremya-v-puti
- robots: index, follow
- **ERROR** `hreflang-redirect-target` — hreflang yönlendirilen adrese işaret ediyor: tr → https://torviantransfer.com/tr/blog/antalya-alanya-transfer-suresi → https://torviantransfer.com/tr/blog/antalya-havalimani-alanya-transfer-kac-saat
- **ERROR** `hreflang-not-reciprocal` — hreflang karşılıklı değil: /ru/blog/antaliya-alaniya-vremya-v-puti → /tr/blog/antalya-alanya-transfer-suresi, ama geri dönüş yok (Google kümeyi yok sayar)

### `/ru/blog/antaliya-transfer-24-7`

- HTTP 200
- title: Трансфер Аэропорт Анталии 24/7 — Ночные и Ранние Рейсы | TORVIAN Transfer
- canonical: https://torviantransfer.com/ru/blog/antaliya-transfer-24-7
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/gece-transfer.jpg

### `/ru/blog/mercedes-vito-vip-transfer-antaliya`

- HTTP 200
- title: Mercedes Vito ВИП Трансфер Анталия — Роскошный Трансфер | TORVIAN Transfer
- canonical: https://torviantransfer.com/ru/blog/mercedes-vito-vip-transfer-antaliya
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/mercedes-vito-vip.jpg

### `/ru/blog/transfer-aeroport-antalii-kash`

- HTTP 200
- title: Трансфер из Аэропорта Анталии в Каш — Полное Руководство | TORVIAN Transfer
- canonical: https://torviantransfer.com/ru/blog/transfer-aeroport-antalii-kash
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/kas-transfer.jpg

### `/ru/blog/tseny-transfera-aeroport-antalii`

- HTTP 200
- title: Цены на Трансфер из Аэропорта Анталии 2026 — Фиксированные Тарифы | TORVIAN Transfer
- canonical: https://torviantransfer.com/ru/blog/tseny-transfera-aeroport-antalii
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/transfer-fiyatlari.jpg

### `/ru/track`

- HTTP 200
- title: Отследить Бронирование | TORVIAN Transfer
- canonical: https://torviantransfer.com/ru/track
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow

### `/nl`

- HTTP 200
- title: Antalya Airport Transfer | Privétransfer Belek, Side, Alanya, Kemer | TORVIAN Transfer
- canonical: https://torviantransfer.com/nl
- robots: index, follow
- **ERROR** `hreflang-incomplete` — hreflang kümesi eksik: /(ana sayfa) için indexlenebilir ama bildirilmeyen diller: ro

### `/nl/admin`

- HTTP 200
- title: TORVIAN Transfer | Antalya Airport VIP Transfer
- canonical: —
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/nl/admin, /nl/admin/login): TORVIAN Transfer | Antalya Airport VIP Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/nl/admin, /nl/admin/login): Antalya Airport VIP Transfer Service - Professional private transfer to Belek, S

### `/nl/admin/login`

- HTTP 200
- title: TORVIAN Transfer | Antalya Airport VIP Transfer
- canonical: —
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/nl/admin, /nl/admin/login): TORVIAN Transfer | Antalya Airport VIP Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/nl/admin, /nl/admin/login): Antalya Airport VIP Transfer Service - Professional private transfer to Belek, S

### `/nl/blog/antalya-24-7-luchthaventransfer`

- HTTP 200
- title: 24/7 luchthaventransfer in Antalya: ook bij nachtelijke aankomsten | TORVIAN Transfer
- canonical: https://torviantransfer.com/nl/blog/antalya-24-7-luchthaventransfer
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/gece-transfer.jpg

### `/nl/blog/mercedes-vito-vip-transfer-antalya`

- HTTP 200
- title: Mercedes Vito VIP-transfer in Antalya: comfort voor het hele gezin | TORVIAN Transfer
- canonical: https://torviantransfer.com/nl/blog/mercedes-vito-vip-transfer-antalya
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/mercedes-vito-vip.jpg

### `/nl/blog/prijzen-luchthaventransfer-antalya`

- HTTP 200
- title: Prijzen transfer luchthaven Antalya 2026: wat kost een privétransfer? | TORVIAN Transfer
- canonical: https://torviantransfer.com/nl/blog/prijzen-luchthaventransfer-antalya
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/transfer-fiyatlari.jpg

### `/nl/blog/reistijd-antalya-naar-alanya`

- HTTP 200
- title: Antalya naar Alanya: reistijd, afstand en route | TORVIAN Transfer
- canonical: https://torviantransfer.com/nl/blog/reistijd-antalya-naar-alanya
- robots: index, follow
- **ERROR** `hreflang-redirect-target` — hreflang yönlendirilen adrese işaret ediyor: tr → https://torviantransfer.com/tr/blog/antalya-alanya-transfer-suresi → https://torviantransfer.com/tr/blog/antalya-havalimani-alanya-transfer-kac-saat
- **ERROR** `hreflang-not-reciprocal` — hreflang karşılıklı değil: /nl/blog/reistijd-antalya-naar-alanya → /tr/blog/antalya-alanya-transfer-suresi, ama geri dönüş yok (Google kümeyi yok sayar)

### `/nl/blog/transfer-luchthaven-antalya-kas`

- HTTP 200
- title: Transfer luchthaven Antalya naar Kaş: afstand, reistijd en tips | TORVIAN Transfer
- canonical: https://torviantransfer.com/nl/blog/transfer-luchthaven-antalya-kas
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/kas-transfer.jpg

### `/nl/kvkk`

- HTTP 200
- title: Privacybeleid | TORVIAN Transfer | TORVIAN Transfer
- canonical: https://torviantransfer.com/nl/kvkk
- robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/nl/kvkk, /nl/privacy): Privacybeleid | TORVIAN Transfer | TORVIAN Transfer

### `/nl/privacy`

- HTTP 200
- title: Privacybeleid | TORVIAN Transfer | TORVIAN Transfer
- canonical: https://torviantransfer.com/nl/privacy
- robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/nl/kvkk, /nl/privacy): Privacybeleid | TORVIAN Transfer | TORVIAN Transfer

### `/nl/track`

- HTTP 200
- title: Boeking volgen | TORVIAN Transfer
- canonical: https://torviantransfer.com/nl/track
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow

### `/ro`

- HTTP 200
- title: Transfer VIP Aeroportul Antalya | Belek, Side, Alanya, Kemer 2026 | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro
- robots: index, follow
- **ERROR** `hreflang-no-self` — hreflang kendini içermiyor: ro etiketi yok: x-default, tr, en, de, pl, ru, nl
- **ERROR** `canonical-hreflang-conflict` — Canonical hreflang kümesinde yok: canonical=https://torviantransfer.com/ro
- **ERROR** `hreflang-incomplete` — hreflang kümesi eksik: /(ana sayfa) için indexlenebilir ama bildirilmeyen diller: ro
- **ERROR** `hreflang-not-reciprocal` — hreflang karşılıklı değil: /ro → /tr, ama geri dönüş yok (Google kümeyi yok sayar)

### `/ro/admin`

- HTTP 200
- title: TORVIAN Transfer | Antalya Airport VIP Transfer
- canonical: —
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/ro/admin, /ro/admin/login): TORVIAN Transfer | Antalya Airport VIP Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/ro/admin, /ro/admin/login): Antalya Airport VIP Transfer Service - Professional private transfer to Belek, S

### `/ro/admin/login`

- HTTP 200
- title: TORVIAN Transfer | Antalya Airport VIP Transfer
- canonical: —
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow
- **ERROR** `duplicate-title` — Aynı title: 2 sayfa aynı değeri kullanıyor (/ro/admin, /ro/admin/login): TORVIAN Transfer | Antalya Airport VIP Transfer
- **ERROR** `duplicate-description` — Aynı description: 2 sayfa aynı değeri kullanıyor (/ro/admin, /ro/admin/login): Antalya Airport VIP Transfer Service - Professional private transfer to Belek, S

### `/ro/adrasan-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Adrasan | Privat VIP · 1 oră 25 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/adrasan-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Adrasan | Privat VIP · 1 oră 25 minundefined | TORVIAN Transfer

### `/ro/alanya-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Alanya | Privat VIP · 2 oreundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/alanya-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Alanya | Privat VIP · 2 oreundefined | TORVIAN Transfer

### `/ro/beldibi-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Beldibi | Privat VIP · 35 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/beldibi-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Beldibi | Privat VIP · 35 minundefined | TORVIAN Transfer

### `/ro/belek-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Belek | Privat VIP · 30 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/belek-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Belek | Privat VIP · 30 minundefined | TORVIAN Transfer

### `/ro/blog/antalya-7-24-transfer-hizmeti`

- HTTP 200
- title: Transfer 24/7 în Antalya: ce înseamnă la 3 dimineața | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/blog/antalya-7-24-transfer-hizmeti
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/gece-transfer.jpg

### `/ro/blog/antalya-havalimani-kas-transfer`

- HTTP 200
- title: Transfer Aeroportul Antalya - Kaș: 190 km pe drumul de coastă | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/blog/antalya-havalimani-kas-transfer
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/kas-transfer.jpg

### `/ro/blog/antalya-havalimani-transfer-fiyatlari`

- HTTP 200
- title: Prețuri transfer Aeroportul Antalya: cât costă și ce include | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/blog/antalya-havalimani-transfer-fiyatlari
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/transfer-fiyatlari.jpg

### `/ro/blog/antalya-mercedes-vito-vip-transfer`

- HTTP 200
- title: Mercedes Vito VIP: vehiculul cu care se face transferul | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/blog/antalya-mercedes-vito-vip-transfer
- robots: index, follow
- **ERROR** `og-image-broken` — og:image erişilemiyor: HTTP 404 — https://torviantransfer.com/images/blog/mercedes-vito-vip.jpg

### `/ro/bogazkent-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Bogazkent | Privat VIP · 35 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/bogazkent-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Bogazkent | Privat VIP · 35 minundefined | TORVIAN Transfer

### `/ro/camyuva-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Çamyuva | Privat VIP · 48 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/camyuva-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Çamyuva | Privat VIP · 48 minundefined | TORVIAN Transfer

### `/ro/evrenseki-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Evrenseki | Privat VIP · 50 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/evrenseki-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Evrenseki | Privat VIP · 50 minundefined | TORVIAN Transfer

### `/ro/fethiye-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Fethiye | Privat VIPundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/fethiye-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Fethiye | Privat VIPundefined | TORVIAN Transfer

### `/ro/goynuk-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Göynük | Privat VIP · 38 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/goynuk-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Göynük | Privat VIP · 38 minundefined | TORVIAN Transfer

### `/ro/kadriye-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Kadriye | Privat VIP · 30 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/kadriye-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Kadriye | Privat VIP · 30 minundefined | TORVIAN Transfer

### `/ro/kalkan-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Kalkan | Privat VIP · 3 ore 30 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/kalkan-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Kalkan | Privat VIP · 3 ore 30 minundefined | TORVIAN Transfer

### `/ro/kargicak-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Kargicak | Privat VIP · 1 oră 50 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/kargicak-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Kargicak | Privat VIP · 1 oră 50 minundefined | TORVIAN Transfer

### `/ro/kas-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Kaș | Privat VIPundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/kas-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Kaș | Privat VIPundefined | TORVIAN Transfer

### `/ro/kemer-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Kemer | Privat VIP · 45 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/kemer-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Kemer | Privat VIP · 45 minundefined | TORVIAN Transfer

### `/ro/kiris-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Kiris | Privat VIP · 45 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/kiris-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Kiris | Privat VIP · 45 minundefined | TORVIAN Transfer

### `/ro/kizilagac-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Kizilagac | Privat VIP · 1 oră 10 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/kizilagac-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Kizilagac | Privat VIP · 1 oră 10 minundefined | TORVIAN Transfer

### `/ro/kundu-lara-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Kundu-Lara | Privat VIP · 15 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/kundu-lara-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Kundu-Lara | Privat VIP · 15 minundefined | TORVIAN Transfer

### `/ro/mahmutlar-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Mahmutlar | Privat VIP · 2 ore 10 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/mahmutlar-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Mahmutlar | Privat VIP · 2 ore 10 minundefined | TORVIAN Transfer

### `/ro/marmaris-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Marmaris | Privat VIPundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/marmaris-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Marmaris | Privat VIPundefined | TORVIAN Transfer

### `/ro/okurcalar-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Okurcalar | Privat VIP · 1 oră 30 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/okurcalar-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Okurcalar | Privat VIP · 1 oră 30 minundefined | TORVIAN Transfer

### `/ro/sehirici-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Centrul Antalyei | Privat VIPundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/sehirici-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Centrul Antalyei | Privat VIPundefined | TORVIAN Transfer

### `/ro/side-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Side | Privat VIP · 55 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/side-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Side | Privat VIP · 55 minundefined | TORVIAN Transfer

### `/ro/tekirova-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Tekirova | Privat VIP · 50 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/tekirova-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Tekirova | Privat VIP · 50 minundefined | TORVIAN Transfer

### `/ro/track`

- HTTP 200
- title: Urmărește rezervarea | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/track
- robots: index, follow
- **ERROR** `should-be-noindex` — Indexlenmemesi gereken sayfa indexlenebilir: robots: index, follow

### `/ro/turkler-transfer`

- HTTP 200
- title: Transfer Aeroport Antalya - Türkler | Privat VIP · 1 oră 35 minundefined | TORVIAN Transfer
- canonical: https://torviantransfer.com/ro/turkler-transfer
- robots: index, follow
- **ERROR** `placeholder-leak` — Metinde yer tutucu değer: title içinde "undefined" geçiyor: Transfer Aeroport Antalya - Türkler | Privat VIP · 1 oră 35 minundefined | TORVIAN Transfer

## İç link dağılımı (indexlenebilir ticari sayfalar)

| Dil | Sayfa | Ortalama gelen link | En az | Orphan (0) | Zayıf (<3) |
| --- | --- | --- | --- | --- | --- |
| tr | 35 | 29.3 | 1 | 0 | 3 |
| en | 35 | 29.6 | 1 | 0 | 3 |
| de | 35 | 29.6 | 1 | 0 | 3 |
| pl | 35 | 29.3 | 1 | 0 | 3 |
| ru | 35 | 29.3 | 1 | 0 | 3 |
| nl | 35 | 28.9 | 1 | 0 | 3 |
| ro | 35 | 28.5 | 1 | 0 | 3 |

### En az link alan bölge sayfaları

| URL | Gelen link |
| --- | --- |
| `/tr/marmaris-transfer` | 3 |
| `/en/marmaris-transfer` | 3 |
| `/de/marmaris-transfer` | 3 |
| `/pl/marmaris-transfer` | 3 |
| `/ru/marmaris-transfer` | 3 |
| `/nl/marmaris-transfer` | 3 |
| `/ro/marmaris-transfer` | 3 |
| `/tr/kizilagac-transfer` | 4 |
| `/en/kizilagac-transfer` | 4 |
| `/de/kizilagac-transfer` | 4 |
| `/pl/kizilagac-transfer` | 4 |
| `/ru/kizilagac-transfer` | 4 |
| `/nl/kizilagac-transfer` | 4 |
| `/ro/kizilagac-transfer` | 4 |
| `/tr/adrasan-transfer` | 6 |
| `/tr/evrenseki-transfer` | 6 |
| `/tr/fethiye-transfer` | 6 |
| `/tr/kalkan-transfer` | 6 |
| `/tr/kargicak-transfer` | 6 |
| `/tr/mahmutlar-transfer` | 6 |

## Tüm URL'ler

| URL | Tip | HTTP | Index | Sitemap | Gelen link | Sonuç |
| --- | --- | --- | --- | --- | --- | --- |
| `/tr` | home | 200 | index | var | 68 | FAIL |
| `/tr/about` | static | 200 | index | var | 68 | PASS |
| `/tr/account` | private | 200 | noindex | yok | 0 | PASS |
| `/tr/account/login` | private | 200 | noindex | yok | 0 | PASS |
| `/tr/account/reset-password` | private | 200 | noindex | yok | 0 | PASS |
| `/tr/admin` | private | 200 | index | yok | 0 | FAIL |
| `/tr/admin/login` | private | 200 | index | yok | 0 | FAIL |
| `/tr/adrasan-transfer` | region | 200 | index | var | 6 | PASS |
| `/tr/alanya-transfer` | region | 200 | index | var | 68 | PASS |
| `/tr/antalya-airport-transfer` | landing | 200 | index | var | 25 | PASS |
| `/tr/beldibi-transfer` | region | 200 | index | var | 7 | PASS |
| `/tr/belek-transfer` | region | 200 | index | var | 68 | PASS |
| `/tr/blog` | blog-index | 200 | index | var | 68 | PASS |
| `/tr/blog/aileler-icin-antalya-transfer-ipuclari` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/alanya-airport-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/antalya-7-24-transfer-hizmeti` | blog-post | 200 | index | var | 1 | FAIL |
| `/tr/blog/antalya-alanya-transfer-suresi` | blog-post | 200 | index | var | 1 | FAIL |
| `/tr/blog/antalya-arac-kiralama-mi-transfer-mi` | blog-post | 200 | index | var | 27 | PASS |
| `/tr/blog/antalya-belek-transfer-mesafe-sure` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/antalya-havalimani-alanya-transfer-kac-saat` | blog-post | 200 | index | var | 1 | FAIL |
| `/tr/blog/antalya-havalimani-belek-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/antalya-havalimani-kas-transfer` | blog-post | 200 | index | var | 1 | FAIL |
| `/tr/blog/antalya-havalimani-lara-beach-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/antalya-havalimani-otel-transferi-rehberi` | blog-post | 200 | index | var | 2 | PASS |
| `/tr/blog/antalya-havalimani-side-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/antalya-havalimani-taksi-mi-vip-transfer-mi` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/antalya-havalimani-transfer-fiyatlari` | blog-post | 200 | index | var | 1 | FAIL |
| `/tr/blog/antalya-havalimani-transfer-rehberi` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/antalya-havas-mi-vip-transfer-mi` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/antalya-kemer-transfer-mesafe-sure` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/antalya-mercedes-vito-vip-transfer` | blog-post | 200 | index | var | 1 | FAIL |
| `/tr/blog/antalya-side-transfer-mesafe-sure` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/belek-golf-otelleri-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/hotel-transfer-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/kis-antalya-tatil-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/land-of-legends-transfer-rehberi` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/regnum-the-crown-belek-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/side-antik-kent-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/uber-antalya-havalimani-ulasim` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/blog/vip-transfer-mi-shuttle-mi` | blog-post | 200 | index | var | 1 | PASS |
| `/tr/bogazkent-transfer` | region | 200 | index | var | 10 | PASS |
| `/tr/booking` | landing | 200 | index | var | 60 | PASS |
| `/tr/booking/cancel` | utility | 200 | noindex | yok | 0 | PASS |
| `/tr/booking/success` | utility | 200 | noindex | yok | 0 | PASS |
| `/tr/camyuva-transfer` | region | 200 | index | var | 7 | PASS |
| `/tr/cancellation` | legal | 200 | index | var | 68 | PASS |
| `/tr/contact` | static | 200 | index | var | 68 | PASS |
| `/tr/cookies` | legal | 200 | index | var | 68 | PASS |
| `/tr/evrenseki-transfer` | region | 200 | index | var | 6 | PASS |
| `/tr/faq` | static | 200 | index | var | 68 | PASS |
| `/tr/fethiye-transfer` | region | 200 | index | var | 6 | PASS |
| `/tr/goynuk-transfer` | region | 200 | index | var | 7 | PASS |
| `/tr/hotel-transfer-antalya` | landing | 200 | index | var | 1 | PASS |
| `/tr/kadriye-transfer` | region | 200 | index | var | 7 | PASS |
| `/tr/kalkan-transfer` | region | 200 | index | var | 6 | PASS |
| `/tr/kargicak-transfer` | region | 200 | index | var | 6 | PASS |
| `/tr/kas-transfer` | region | 200 | index | var | 68 | PASS |
| `/tr/kemer-transfer` | region | 200 | index | var | 68 | PASS |
| `/tr/kiris-transfer` | region | 200 | index | var | 9 | PASS |
| `/tr/kizilagac-transfer` | region | 200 | index | var | 4 | PASS |
| `/tr/kundu-lara-transfer` | region | 200 | index | var | 68 | PASS |
| `/tr/kvkk` | legal | 200 | index | var | 68 | PASS |
| `/tr/land-of-legends-transfer` | landing | 200 | index | var | 68 | PASS |
| `/tr/lara-beach-transfer` | landing | 200 | index | var | 1 | PASS |
| `/tr/mahmutlar-transfer` | region | 200 | index | var | 6 | PASS |
| `/tr/marmaris-transfer` | region | 200 | index | var | 3 | PASS |
| `/tr/okurcalar-transfer` | region | 200 | index | var | 6 | PASS |
| `/tr/privacy` | legal | 200 | index | var | 68 | PASS |
| `/tr/regions` | static | 200 | index | var | 68 | PASS |
| `/tr/sehirici-transfer` | region | 200 | index | var | 9 | PASS |
| `/tr/side-transfer` | region | 200 | index | var | 68 | PASS |
| `/tr/tekirova-transfer` | region | 200 | index | var | 9 | PASS |
| `/tr/terms` | legal | 200 | index | var | 68 | PASS |
| `/tr/track` | utility | 200 | index | yok | 0 | FAIL |
| `/tr/turkler-transfer` | region | 200 | index | var | 6 | PASS |
| `/tr/vip-transfer-antalya` | landing | 200 | index | var | 1 | PASS |
| `/en` | home | 200 | index | var | 69 | FAIL |
| `/en/about` | static | 200 | index | var | 69 | PASS |
| `/en/account` | private | 200 | noindex | yok | 0 | PASS |
| `/en/account/login` | private | 200 | noindex | yok | 0 | PASS |
| `/en/account/reset-password` | private | 200 | noindex | yok | 0 | PASS |
| `/en/admin` | private | 200 | index | yok | 0 | FAIL |
| `/en/admin/login` | private | 200 | index | yok | 0 | FAIL |
| `/en/adrasan-transfer` | region | 200 | index | var | 6 | PASS |
| `/en/alanya-transfer` | region | 200 | index | var | 69 | PASS |
| `/en/antalya-airport-transfer` | landing | 200 | index | var | 25 | PASS |
| `/en/beldibi-transfer` | region | 200 | index | var | 7 | PASS |
| `/en/belek-transfer` | region | 200 | index | var | 69 | PASS |
| `/en/blog` | blog-index | 200 | index | var | 69 | PASS |
| `/en/blog/antalya-24-7-airport-transfer` | blog-post | 200 | index | var | 1 | FAIL |
| `/en/blog/antalya-airport-hotel-transfer` | blog-post | 200 | index | var | 2 | PASS |
| `/en/blog/antalya-airport-taxi-vs-private-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/antalya-airport-to-alanya-transfer-time` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/antalya-airport-to-belek-distance-time` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/antalya-airport-to-belek-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/antalya-airport-to-kas-transfer` | blog-post | 200 | index | var | 1 | FAIL |
| `/en/blog/antalya-airport-to-kemer-distance-time` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/antalya-airport-to-lara-beach-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/antalya-airport-to-side-distance-time` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/antalya-airport-to-side-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/antalya-airport-transfer-guide` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/antalya-airport-transfer-prices` | blog-post | 200 | index | var | 1 | FAIL |
| `/en/blog/antalya-to-alanya-travel-time` | blog-post | 200 | index | var | 1 | FAIL |
| `/en/blog/antalya-transfer-tips-for-families` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/belek-golf-hotels-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/car-rental-vs-private-transfer-antalya` | blog-post | 200 | index | var | 28 | PASS |
| `/en/blog/flughafen-transfer-antalya` | blog-post | 200 | index | var | 28 | PASS |
| `/en/blog/havas-shuttle-vs-private-transfer-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/hotel-transfer-antalya-airport` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/is-there-an-airport-in-alanya` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/land-of-legends-transfer-guide` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/mercedes-vito-vip-transfer-antalya` | blog-post | 200 | index | var | 1 | FAIL |
| `/en/blog/private-transfer-vs-shuttle-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/regnum-the-crown-belek-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/side-ancient-city-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/uber-antalya-havalimani-ulasim` | blog-post | 200 | index | var | 1 | PASS |
| `/en/blog/winter-holiday-transfer-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/en/bogazkent-transfer` | region | 200 | index | var | 10 | PASS |
| `/en/booking` | landing | 200 | index | var | 61 | PASS |
| `/en/booking/cancel` | utility | 200 | noindex | yok | 0 | PASS |
| `/en/booking/success` | utility | 200 | noindex | yok | 0 | PASS |
| `/en/camyuva-transfer` | region | 200 | index | var | 7 | PASS |
| `/en/cancellation` | legal | 200 | index | var | 69 | PASS |
| `/en/contact` | static | 200 | index | var | 69 | PASS |
| `/en/cookies` | legal | 200 | index | var | 69 | PASS |
| `/en/evrenseki-transfer` | region | 200 | index | var | 6 | PASS |
| `/en/faq` | static | 200 | index | var | 69 | PASS |
| `/en/fethiye-transfer` | region | 200 | index | var | 6 | PASS |
| `/en/goynuk-transfer` | region | 200 | index | var | 7 | PASS |
| `/en/hotel-transfer-antalya` | landing | 200 | index | var | 1 | PASS |
| `/en/kadriye-transfer` | region | 200 | index | var | 7 | PASS |
| `/en/kalkan-transfer` | region | 200 | index | var | 6 | PASS |
| `/en/kargicak-transfer` | region | 200 | index | var | 6 | PASS |
| `/en/kas-transfer` | region | 200 | index | var | 69 | PASS |
| `/en/kemer-transfer` | region | 200 | index | var | 69 | PASS |
| `/en/kiris-transfer` | region | 200 | index | var | 9 | PASS |
| `/en/kizilagac-transfer` | region | 200 | index | var | 4 | PASS |
| `/en/kundu-lara-transfer` | region | 200 | index | var | 69 | PASS |
| `/en/kvkk` | legal | 200 | index | var | 69 | PASS |
| `/en/land-of-legends-transfer` | landing | 200 | index | var | 69 | PASS |
| `/en/lara-beach-transfer` | landing | 200 | index | var | 1 | PASS |
| `/en/mahmutlar-transfer` | region | 200 | index | var | 6 | PASS |
| `/en/marmaris-transfer` | region | 200 | index | var | 3 | PASS |
| `/en/okurcalar-transfer` | region | 200 | index | var | 6 | PASS |
| `/en/privacy` | legal | 200 | index | var | 69 | PASS |
| `/en/regions` | static | 200 | index | var | 69 | PASS |
| `/en/sehirici-transfer` | region | 200 | index | var | 9 | PASS |
| `/en/side-transfer` | region | 200 | index | var | 69 | PASS |
| `/en/tekirova-transfer` | region | 200 | index | var | 9 | PASS |
| `/en/terms` | legal | 200 | index | var | 69 | PASS |
| `/en/track` | utility | 200 | index | yok | 0 | FAIL |
| `/en/turkler-transfer` | region | 200 | index | var | 6 | PASS |
| `/en/vip-transfer-antalya` | landing | 200 | index | var | 1 | PASS |
| `/de` | home | 200 | index | var | 69 | FAIL |
| `/de/about` | static | 200 | index | var | 69 | PASS |
| `/de/account` | private | 200 | noindex | yok | 0 | PASS |
| `/de/account/login` | private | 200 | noindex | yok | 0 | PASS |
| `/de/account/reset-password` | private | 200 | noindex | yok | 0 | PASS |
| `/de/admin` | private | 200 | index | yok | 0 | FAIL |
| `/de/admin/login` | private | 200 | index | yok | 0 | FAIL |
| `/de/adrasan-transfer` | region | 200 | index | var | 6 | PASS |
| `/de/alanya-transfer` | region | 200 | index | var | 69 | PASS |
| `/de/antalya-airport-transfer` | landing | 200 | index | var | 25 | PASS |
| `/de/beldibi-transfer` | region | 200 | index | var | 7 | PASS |
| `/de/belek-transfer` | region | 200 | index | var | 69 | PASS |
| `/de/blog` | blog-index | 200 | index | var | 69 | PASS |
| `/de/blog/antalya-24-7-flughafentransfer` | blog-post | 200 | index | var | 1 | FAIL |
| `/de/blog/antalya-flughafen-nach-alanya-fahrzeit` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/antalya-flughafen-taxi-oder-privattransfer` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/antalya-flughafentransfer-preise` | blog-post | 200 | index | var | 1 | FAIL |
| `/de/blog/antalya-flughafentransfer-ratgeber` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/antalya-transfer-tipps-fuer-familien` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/belek-golfhotels-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/entfernung-flughafen-antalya-belek` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/entfernung-flughafen-antalya-kemer` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/entfernung-flughafen-antalya-side` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/fahrzeit-antalya-nach-alanya` | blog-post | 200 | index | var | 1 | FAIL |
| `/de/blog/flughafentransfer-antalya` | blog-post | 200 | index | var | 28 | PASS |
| `/de/blog/hat-alanya-einen-flughafen` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/havas-shuttle-oder-privattransfer-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/hotel-transfer-antalya-flughafen` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/hoteltransfer-flughafen-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/mercedes-vito-vip-transfer-flughafen-antalya` | blog-post | 200 | index | var | 1 | FAIL |
| `/de/blog/mietwagen-oder-privattransfer-antalya` | blog-post | 200 | index | var | 28 | PASS |
| `/de/blog/privattransfer-oder-shuttle-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/regnum-the-crown-belek-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/transfer-flughafen-antalya-lara-beach` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/transfer-flughafen-antalya-nach-belek` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/transfer-flughafen-antalya-nach-kas` | blog-post | 200 | index | var | 1 | FAIL |
| `/de/blog/transfer-flughafen-antalya-nach-side` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/transfer-zum-land-of-legends` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/transfer-zur-antiken-stadt-side` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/uber-antalya-havalimani-ulasim` | blog-post | 200 | index | var | 1 | PASS |
| `/de/blog/winterurlaub-transfer-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/de/bogazkent-transfer` | region | 200 | index | var | 10 | PASS |
| `/de/booking` | landing | 200 | index | var | 61 | PASS |
| `/de/booking/cancel` | utility | 200 | noindex | yok | 0 | PASS |
| `/de/booking/success` | utility | 200 | noindex | yok | 0 | PASS |
| `/de/camyuva-transfer` | region | 200 | index | var | 7 | PASS |
| `/de/cancellation` | legal | 200 | index | var | 69 | PASS |
| `/de/contact` | static | 200 | index | var | 69 | PASS |
| `/de/cookies` | legal | 200 | index | var | 69 | PASS |
| `/de/evrenseki-transfer` | region | 200 | index | var | 6 | PASS |
| `/de/faq` | static | 200 | index | var | 69 | PASS |
| `/de/fethiye-transfer` | region | 200 | index | var | 6 | PASS |
| `/de/goynuk-transfer` | region | 200 | index | var | 7 | PASS |
| `/de/hotel-transfer-antalya` | landing | 200 | index | var | 1 | PASS |
| `/de/kadriye-transfer` | region | 200 | index | var | 7 | PASS |
| `/de/kalkan-transfer` | region | 200 | index | var | 6 | PASS |
| `/de/kargicak-transfer` | region | 200 | index | var | 6 | PASS |
| `/de/kas-transfer` | region | 200 | index | var | 69 | PASS |
| `/de/kemer-transfer` | region | 200 | index | var | 69 | PASS |
| `/de/kiris-transfer` | region | 200 | index | var | 9 | PASS |
| `/de/kizilagac-transfer` | region | 200 | index | var | 4 | PASS |
| `/de/kundu-lara-transfer` | region | 200 | index | var | 69 | PASS |
| `/de/kvkk` | legal | 200 | index | var | 69 | PASS |
| `/de/land-of-legends-transfer` | landing | 200 | index | var | 69 | PASS |
| `/de/lara-beach-transfer` | landing | 200 | index | var | 1 | PASS |
| `/de/mahmutlar-transfer` | region | 200 | index | var | 6 | PASS |
| `/de/marmaris-transfer` | region | 200 | index | var | 3 | PASS |
| `/de/okurcalar-transfer` | region | 200 | index | var | 6 | PASS |
| `/de/privacy` | legal | 200 | index | var | 69 | PASS |
| `/de/regions` | static | 200 | index | var | 69 | PASS |
| `/de/sehirici-transfer` | region | 200 | index | var | 9 | PASS |
| `/de/side-transfer` | region | 200 | index | var | 69 | PASS |
| `/de/tekirova-transfer` | region | 200 | index | var | 9 | PASS |
| `/de/terms` | legal | 200 | index | var | 69 | PASS |
| `/de/track` | utility | 200 | index | yok | 0 | FAIL |
| `/de/turkler-transfer` | region | 200 | index | var | 6 | PASS |
| `/de/vip-transfer-antalya` | landing | 200 | index | var | 1 | PASS |
| `/pl` | home | 200 | index | var | 68 | FAIL |
| `/pl/about` | static | 200 | index | var | 68 | PASS |
| `/pl/account` | private | 200 | noindex | yok | 0 | PASS |
| `/pl/account/login` | private | 200 | noindex | yok | 0 | PASS |
| `/pl/account/reset-password` | private | 200 | noindex | yok | 0 | PASS |
| `/pl/admin` | private | 200 | index | yok | 0 | FAIL |
| `/pl/admin/login` | private | 200 | index | yok | 0 | FAIL |
| `/pl/adrasan-transfer` | region | 200 | index | var | 6 | PASS |
| `/pl/alanya-transfer` | region | 200 | index | var | 68 | PASS |
| `/pl/antalya-airport-transfer` | landing | 200 | index | var | 25 | PASS |
| `/pl/beldibi-transfer` | region | 200 | index | var | 7 | PASS |
| `/pl/belek-transfer` | region | 200 | index | var | 68 | PASS |
| `/pl/blog` | blog-index | 200 | index | var | 68 | PASS |
| `/pl/blog/antalya-alanya-czas-przejazdu` | blog-post | 200 | index | var | 1 | FAIL |
| `/pl/blog/antalya-havalimani-otel-transferi-rehberi` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/antalya-kemer-odleglosc-od-lotniska` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/antalya-side-odleglosc-od-lotniska` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/antalya-transfer-24-7` | blog-post | 200 | index | var | 1 | FAIL |
| `/pl/blog/autobus-havas-czy-transfer-prywatny-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/belek-odleglosc-od-lotniska-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/ceny-transferu-lotnisko-antalya` | blog-post | 200 | index | var | 1 | FAIL |
| `/pl/blog/czy-alanya-ma-lotnisko` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/mercedes-vito-transfer-vip-antalya` | blog-post | 200 | index | var | 1 | FAIL |
| `/pl/blog/przewodnik-transfer-lotnisko-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/taksowka-czy-transfer-prywatny-lotnisko-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/transfer-antalya-porady-dla-rodzin` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/transfer-do-hoteli-golfowych-belek` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/transfer-do-hotelu-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/transfer-do-land-of-legends` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/transfer-do-starozytnego-side` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/transfer-lotnisko-antalya-alanya-ile-trwa` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/transfer-lotnisko-antalya-belek` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/transfer-lotnisko-antalya-kas` | blog-post | 200 | index | var | 1 | FAIL |
| `/pl/blog/transfer-lotnisko-antalya-lara-beach` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/transfer-lotnisko-antalya-side` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/transfer-prywatny-czy-shuttle-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/transfer-regnum-the-crown-belek` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/uber-antalya-havalimani-ulasim` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/blog/wynajem-auta-czy-transfer-prywatny-antalya` | blog-post | 200 | index | var | 27 | PASS |
| `/pl/blog/zimowy-urlop-transfer-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/pl/bogazkent-transfer` | region | 200 | index | var | 10 | PASS |
| `/pl/booking` | landing | 200 | index | var | 60 | PASS |
| `/pl/booking/cancel` | utility | 200 | noindex | yok | 0 | PASS |
| `/pl/booking/success` | utility | 200 | noindex | yok | 0 | PASS |
| `/pl/camyuva-transfer` | region | 200 | index | var | 7 | PASS |
| `/pl/cancellation` | legal | 200 | index | var | 68 | PASS |
| `/pl/contact` | static | 200 | index | var | 68 | PASS |
| `/pl/cookies` | legal | 200 | index | var | 68 | PASS |
| `/pl/evrenseki-transfer` | region | 200 | index | var | 6 | PASS |
| `/pl/faq` | static | 200 | index | var | 68 | PASS |
| `/pl/fethiye-transfer` | region | 200 | index | var | 6 | PASS |
| `/pl/goynuk-transfer` | region | 200 | index | var | 7 | PASS |
| `/pl/hotel-transfer-antalya` | landing | 200 | index | var | 1 | PASS |
| `/pl/kadriye-transfer` | region | 200 | index | var | 7 | PASS |
| `/pl/kalkan-transfer` | region | 200 | index | var | 6 | PASS |
| `/pl/kargicak-transfer` | region | 200 | index | var | 6 | PASS |
| `/pl/kas-transfer` | region | 200 | index | var | 68 | PASS |
| `/pl/kemer-transfer` | region | 200 | index | var | 68 | PASS |
| `/pl/kiris-transfer` | region | 200 | index | var | 9 | PASS |
| `/pl/kizilagac-transfer` | region | 200 | index | var | 4 | PASS |
| `/pl/kundu-lara-transfer` | region | 200 | index | var | 68 | PASS |
| `/pl/kvkk` | legal | 200 | index | var | 68 | PASS |
| `/pl/land-of-legends-transfer` | landing | 200 | index | var | 68 | PASS |
| `/pl/lara-beach-transfer` | landing | 200 | index | var | 1 | PASS |
| `/pl/mahmutlar-transfer` | region | 200 | index | var | 6 | PASS |
| `/pl/marmaris-transfer` | region | 200 | index | var | 3 | PASS |
| `/pl/okurcalar-transfer` | region | 200 | index | var | 6 | PASS |
| `/pl/privacy` | legal | 200 | index | var | 68 | PASS |
| `/pl/regions` | static | 200 | index | var | 68 | PASS |
| `/pl/sehirici-transfer` | region | 200 | index | var | 9 | PASS |
| `/pl/side-transfer` | region | 200 | index | var | 68 | PASS |
| `/pl/tekirova-transfer` | region | 200 | index | var | 9 | PASS |
| `/pl/terms` | legal | 200 | index | var | 68 | PASS |
| `/pl/track` | utility | 200 | index | yok | 0 | FAIL |
| `/pl/turkler-transfer` | region | 200 | index | var | 6 | PASS |
| `/pl/vip-transfer-antalya` | landing | 200 | index | var | 1 | PASS |
| `/ru` | home | 200 | index | var | 68 | FAIL |
| `/ru/about` | static | 200 | index | var | 68 | PASS |
| `/ru/account` | private | 200 | noindex | yok | 0 | PASS |
| `/ru/account/login` | private | 200 | noindex | yok | 0 | PASS |
| `/ru/account/reset-password` | private | 200 | noindex | yok | 0 | PASS |
| `/ru/admin` | private | 200 | index | yok | 0 | FAIL |
| `/ru/admin/login` | private | 200 | index | yok | 0 | FAIL |
| `/ru/adrasan-transfer` | region | 200 | index | var | 6 | PASS |
| `/ru/alanya-transfer` | region | 200 | index | var | 68 | PASS |
| `/ru/antalya-airport-transfer` | landing | 200 | index | var | 25 | PASS |
| `/ru/beldibi-transfer` | region | 200 | index | var | 7 | PASS |
| `/ru/belek-transfer` | region | 200 | index | var | 68 | PASS |
| `/ru/blog` | blog-index | 200 | index | var | 68 | PASS |
| `/ru/blog/antaliya-alaniya-vremya-v-puti` | blog-post | 200 | index | var | 1 | FAIL |
| `/ru/blog/antaliya-transfer-24-7` | blog-post | 200 | index | var | 1 | FAIL |
| `/ru/blog/antalya-havalimani-otel-transferi-rehberi` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/arenda-avto-ili-chastnyy-transfer-antaliya` | blog-post | 200 | index | var | 27 | PASS |
| `/ru/blog/avtobus-havas-ili-chastnyy-transfer-antaliya` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/chastnyy-transfer-ili-shattl-antaliya` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/est-li-aeroport-v-alanii` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/mercedes-vito-vip-transfer-antaliya` | blog-post | 200 | index | var | 1 | FAIL |
| `/ru/blog/putevoditel-transfer-aeroport-antalii` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/rasstoyanie-ot-aeroporta-antalii-do-beleka` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/rasstoyanie-ot-aeroporta-antalii-do-kemera` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/rasstoyanie-ot-aeroporta-antalii-do-side` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/skolko-ehat-ot-aeroporta-antalii-do-alanii` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/sovety-po-transferu-antaliya-dlya-semey` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/taksi-ili-chastnyy-transfer-aeroport-antalii` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/transfer-aeroport-antalii-belek` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/transfer-aeroport-antalii-kash` | blog-post | 200 | index | var | 1 | FAIL |
| `/ru/blog/transfer-aeroport-antalii-lara-beach` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/transfer-aeroport-antalii-side` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/transfer-do-otelya-antaliya` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/transfer-regnum-the-crown-belek-ru` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/transfer-v-drevniy-side` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/transfer-v-golf-oteli-beleka` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/transfer-v-land-of-legends` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/tseny-transfera-aeroport-antalii` | blog-post | 200 | index | var | 1 | FAIL |
| `/ru/blog/uber-antalya-havalimani-ulasim` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/blog/zimniy-otdyh-transfer-antaliya` | blog-post | 200 | index | var | 1 | PASS |
| `/ru/bogazkent-transfer` | region | 200 | index | var | 10 | PASS |
| `/ru/booking` | landing | 200 | index | var | 60 | PASS |
| `/ru/booking/cancel` | utility | 200 | noindex | yok | 0 | PASS |
| `/ru/booking/success` | utility | 200 | noindex | yok | 0 | PASS |
| `/ru/camyuva-transfer` | region | 200 | index | var | 7 | PASS |
| `/ru/cancellation` | legal | 200 | index | var | 68 | PASS |
| `/ru/contact` | static | 200 | index | var | 68 | PASS |
| `/ru/cookies` | legal | 200 | index | var | 68 | PASS |
| `/ru/evrenseki-transfer` | region | 200 | index | var | 6 | PASS |
| `/ru/faq` | static | 200 | index | var | 68 | PASS |
| `/ru/fethiye-transfer` | region | 200 | index | var | 6 | PASS |
| `/ru/goynuk-transfer` | region | 200 | index | var | 7 | PASS |
| `/ru/hotel-transfer-antalya` | landing | 200 | index | var | 1 | PASS |
| `/ru/kadriye-transfer` | region | 200 | index | var | 7 | PASS |
| `/ru/kalkan-transfer` | region | 200 | index | var | 6 | PASS |
| `/ru/kargicak-transfer` | region | 200 | index | var | 6 | PASS |
| `/ru/kas-transfer` | region | 200 | index | var | 68 | PASS |
| `/ru/kemer-transfer` | region | 200 | index | var | 68 | PASS |
| `/ru/kiris-transfer` | region | 200 | index | var | 9 | PASS |
| `/ru/kizilagac-transfer` | region | 200 | index | var | 4 | PASS |
| `/ru/kundu-lara-transfer` | region | 200 | index | var | 68 | PASS |
| `/ru/kvkk` | legal | 200 | index | var | 68 | PASS |
| `/ru/land-of-legends-transfer` | landing | 200 | index | var | 68 | PASS |
| `/ru/lara-beach-transfer` | landing | 200 | index | var | 1 | PASS |
| `/ru/mahmutlar-transfer` | region | 200 | index | var | 6 | PASS |
| `/ru/marmaris-transfer` | region | 200 | index | var | 3 | PASS |
| `/ru/okurcalar-transfer` | region | 200 | index | var | 6 | PASS |
| `/ru/privacy` | legal | 200 | index | var | 68 | PASS |
| `/ru/regions` | static | 200 | index | var | 68 | PASS |
| `/ru/sehirici-transfer` | region | 200 | index | var | 9 | PASS |
| `/ru/side-transfer` | region | 200 | index | var | 68 | PASS |
| `/ru/tekirova-transfer` | region | 200 | index | var | 9 | PASS |
| `/ru/terms` | legal | 200 | index | var | 68 | PASS |
| `/ru/track` | utility | 200 | index | yok | 0 | FAIL |
| `/ru/turkler-transfer` | region | 200 | index | var | 6 | PASS |
| `/ru/vip-transfer-antalya` | landing | 200 | index | var | 1 | PASS |
| `/nl` | home | 200 | index | var | 67 | FAIL |
| `/nl/about` | static | 200 | index | var | 67 | PASS |
| `/nl/account` | private | 200 | noindex | yok | 0 | PASS |
| `/nl/account/login` | private | 200 | noindex | yok | 0 | PASS |
| `/nl/account/reset-password` | private | 200 | noindex | yok | 0 | PASS |
| `/nl/admin` | private | 200 | index | yok | 0 | FAIL |
| `/nl/admin/login` | private | 200 | index | yok | 0 | FAIL |
| `/nl/adrasan-transfer` | region | 200 | index | var | 6 | PASS |
| `/nl/alanya-transfer` | region | 200 | index | var | 67 | PASS |
| `/nl/antalya-airport-transfer` | landing | 200 | index | var | 25 | PASS |
| `/nl/beldibi-transfer` | region | 200 | index | var | 7 | PASS |
| `/nl/belek-transfer` | region | 200 | index | var | 67 | PASS |
| `/nl/blog` | blog-index | 200 | index | var | 67 | PASS |
| `/nl/blog/afstand-luchthaven-antalya-belek` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/afstand-luchthaven-antalya-kemer` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/afstand-luchthaven-antalya-side` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/antalya-24-7-luchthaventransfer` | blog-post | 200 | index | var | 1 | FAIL |
| `/nl/blog/antalya-havalimani-otel-transferi-rehberi` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/antalya-transfer-tips-voor-gezinnen` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/gids-luchthaventransfer-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/havas-shuttle-of-privetransfer-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/heeft-alanya-een-luchthaven` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/hoe-lang-duurt-transfer-antalya-alanya` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/hoteltransfer-luchthaven-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/huurauto-of-privetransfer-antalya` | blog-post | 200 | index | var | 26 | PASS |
| `/nl/blog/mercedes-vito-vip-transfer-antalya` | blog-post | 200 | index | var | 1 | FAIL |
| `/nl/blog/prijzen-luchthaventransfer-antalya` | blog-post | 200 | index | var | 1 | FAIL |
| `/nl/blog/privetransfer-of-shuttle-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/reistijd-antalya-naar-alanya` | blog-post | 200 | index | var | 1 | FAIL |
| `/nl/blog/taxi-of-privetransfer-luchthaven-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/transfer-luchthaven-antalya-belek` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/transfer-luchthaven-antalya-kas` | blog-post | 200 | index | var | 1 | FAIL |
| `/nl/blog/transfer-luchthaven-antalya-lara-beach` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/transfer-luchthaven-antalya-side` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/transfer-naar-de-oude-stad-side` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/transfer-naar-golfhotels-belek` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/transfer-naar-land-of-legends` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/transfer-regnum-the-crown-belek-nl` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/blog/wintervakantie-transfer-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/nl/bogazkent-transfer` | region | 200 | index | var | 10 | PASS |
| `/nl/booking` | landing | 200 | index | var | 59 | PASS |
| `/nl/booking/cancel` | utility | 200 | noindex | yok | 0 | PASS |
| `/nl/booking/success` | utility | 200 | noindex | yok | 0 | PASS |
| `/nl/camyuva-transfer` | region | 200 | index | var | 7 | PASS |
| `/nl/cancellation` | legal | 200 | index | var | 67 | PASS |
| `/nl/contact` | static | 200 | index | var | 67 | PASS |
| `/nl/cookies` | legal | 200 | index | var | 67 | PASS |
| `/nl/evrenseki-transfer` | region | 200 | index | var | 6 | PASS |
| `/nl/faq` | static | 200 | index | var | 67 | PASS |
| `/nl/fethiye-transfer` | region | 200 | index | var | 6 | PASS |
| `/nl/goynuk-transfer` | region | 200 | index | var | 7 | PASS |
| `/nl/hotel-transfer-antalya` | landing | 200 | index | var | 1 | PASS |
| `/nl/kadriye-transfer` | region | 200 | index | var | 7 | PASS |
| `/nl/kalkan-transfer` | region | 200 | index | var | 6 | PASS |
| `/nl/kargicak-transfer` | region | 200 | index | var | 6 | PASS |
| `/nl/kas-transfer` | region | 200 | index | var | 67 | PASS |
| `/nl/kemer-transfer` | region | 200 | index | var | 67 | PASS |
| `/nl/kiris-transfer` | region | 200 | index | var | 9 | PASS |
| `/nl/kizilagac-transfer` | region | 200 | index | var | 4 | PASS |
| `/nl/kundu-lara-transfer` | region | 200 | index | var | 67 | PASS |
| `/nl/kvkk` | legal | 200 | index | var | 67 | FAIL |
| `/nl/land-of-legends-transfer` | landing | 200 | index | var | 67 | PASS |
| `/nl/lara-beach-transfer` | landing | 200 | index | var | 1 | PASS |
| `/nl/mahmutlar-transfer` | region | 200 | index | var | 6 | PASS |
| `/nl/marmaris-transfer` | region | 200 | index | var | 3 | PASS |
| `/nl/okurcalar-transfer` | region | 200 | index | var | 6 | PASS |
| `/nl/privacy` | legal | 200 | index | var | 67 | FAIL |
| `/nl/regions` | static | 200 | index | var | 67 | PASS |
| `/nl/sehirici-transfer` | region | 200 | index | var | 9 | PASS |
| `/nl/side-transfer` | region | 200 | index | var | 67 | PASS |
| `/nl/tekirova-transfer` | region | 200 | index | var | 9 | PASS |
| `/nl/terms` | legal | 200 | index | var | 67 | PASS |
| `/nl/track` | utility | 200 | index | yok | 0 | FAIL |
| `/nl/turkler-transfer` | region | 200 | index | var | 6 | PASS |
| `/nl/vip-transfer-antalya` | landing | 200 | index | var | 1 | PASS |
| `/ro` | home | 200 | index | var | 66 | FAIL |
| `/ro/about` | static | 200 | index | var | 66 | PASS |
| `/ro/account` | private | 200 | noindex | yok | 0 | PASS |
| `/ro/account/login` | private | 200 | noindex | yok | 0 | PASS |
| `/ro/account/reset-password` | private | 200 | noindex | yok | 0 | PASS |
| `/ro/admin` | private | 200 | index | yok | 0 | FAIL |
| `/ro/admin/login` | private | 200 | index | yok | 0 | FAIL |
| `/ro/adrasan-transfer` | region | 200 | index | var | 6 | FAIL |
| `/ro/alanya-transfer` | region | 200 | index | var | 66 | FAIL |
| `/ro/antalya-airport-transfer` | landing | 200 | index | var | 25 | PASS |
| `/ro/beldibi-transfer` | region | 200 | index | var | 7 | FAIL |
| `/ro/belek-transfer` | region | 200 | index | var | 66 | FAIL |
| `/ro/blog` | blog-index | 200 | index | var | 66 | PASS |
| `/ro/blog/aileler-icin-antalya-transfer-ipuclari` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/alanya-airport-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/antalya-7-24-transfer-hizmeti` | blog-post | 200 | index | var | 1 | FAIL |
| `/ro/blog/antalya-arac-kiralama-mi-transfer-mi` | blog-post | 200 | index | var | 25 | PASS |
| `/ro/blog/antalya-belek-transfer-mesafe-sure` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/antalya-havalimani-alanya-transfer-kac-saat` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/antalya-havalimani-belek-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/antalya-havalimani-kas-transfer` | blog-post | 200 | index | var | 1 | FAIL |
| `/ro/blog/antalya-havalimani-lara-beach-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/antalya-havalimani-side-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/antalya-havalimani-taksi-mi-vip-transfer-mi` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/antalya-havalimani-transfer-fiyatlari` | blog-post | 200 | index | var | 1 | FAIL |
| `/ro/blog/antalya-havalimani-transfer-rehberi` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/antalya-havas-mi-vip-transfer-mi` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/antalya-kemer-transfer-mesafe-sure` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/antalya-mercedes-vito-vip-transfer` | blog-post | 200 | index | var | 1 | FAIL |
| `/ro/blog/antalya-side-transfer-mesafe-sure` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/belek-golf-otelleri-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/hotel-transfer-antalya` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/kis-antalya-tatil-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/land-of-legends-transfer-rehberi` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/regnum-the-crown-belek-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/side-antik-kent-transfer` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/uber-antalya-havalimani-ulasim` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/blog/vip-transfer-mi-shuttle-mi` | blog-post | 200 | index | var | 1 | PASS |
| `/ro/bogazkent-transfer` | region | 200 | index | var | 10 | FAIL |
| `/ro/booking` | landing | 200 | index | var | 58 | PASS |
| `/ro/booking/cancel` | utility | 200 | noindex | yok | 0 | PASS |
| `/ro/booking/success` | utility | 200 | noindex | yok | 0 | PASS |
| `/ro/camyuva-transfer` | region | 200 | index | var | 7 | FAIL |
| `/ro/cancellation` | legal | 200 | index | var | 66 | PASS |
| `/ro/contact` | static | 200 | index | var | 66 | PASS |
| `/ro/cookies` | legal | 200 | index | var | 66 | PASS |
| `/ro/evrenseki-transfer` | region | 200 | index | var | 6 | FAIL |
| `/ro/faq` | static | 200 | index | var | 66 | PASS |
| `/ro/fethiye-transfer` | region | 200 | index | var | 6 | FAIL |
| `/ro/goynuk-transfer` | region | 200 | index | var | 7 | FAIL |
| `/ro/hotel-transfer-antalya` | landing | 200 | index | var | 1 | PASS |
| `/ro/kadriye-transfer` | region | 200 | index | var | 7 | FAIL |
| `/ro/kalkan-transfer` | region | 200 | index | var | 6 | FAIL |
| `/ro/kargicak-transfer` | region | 200 | index | var | 6 | FAIL |
| `/ro/kas-transfer` | region | 200 | index | var | 66 | FAIL |
| `/ro/kemer-transfer` | region | 200 | index | var | 66 | FAIL |
| `/ro/kiris-transfer` | region | 200 | index | var | 9 | FAIL |
| `/ro/kizilagac-transfer` | region | 200 | index | var | 4 | FAIL |
| `/ro/kundu-lara-transfer` | region | 200 | index | var | 66 | FAIL |
| `/ro/kvkk` | legal | 200 | index | var | 66 | PASS |
| `/ro/land-of-legends-transfer` | landing | 200 | index | var | 66 | PASS |
| `/ro/lara-beach-transfer` | landing | 200 | index | var | 1 | PASS |
| `/ro/mahmutlar-transfer` | region | 200 | index | var | 6 | FAIL |
| `/ro/marmaris-transfer` | region | 200 | index | var | 3 | FAIL |
| `/ro/okurcalar-transfer` | region | 200 | index | var | 6 | FAIL |
| `/ro/privacy` | legal | 200 | index | var | 66 | PASS |
| `/ro/regions` | static | 200 | index | var | 66 | PASS |
| `/ro/sehirici-transfer` | region | 200 | index | var | 9 | FAIL |
| `/ro/side-transfer` | region | 200 | index | var | 66 | FAIL |
| `/ro/tekirova-transfer` | region | 200 | index | var | 9 | FAIL |
| `/ro/terms` | legal | 200 | index | var | 66 | PASS |
| `/ro/track` | utility | 200 | index | yok | 0 | FAIL |
| `/ro/turkler-transfer` | region | 200 | index | var | 6 | FAIL |
| `/ro/vip-transfer-antalya` | landing | 200 | index | var | 1 | PASS |
