# Faz 12 — Almanca (/de) tam denetimi

**Durum:** DONE
**Ölçüm:** production, 2026-09-07 — örnekleme yok, /de altındaki bütün envanter.

## Kapsam

| Sayfa tipi | URL | PASS | FAIL |
| --- | --- | --- | --- |
| home | 1 | 0 | 1 |
| landing | 6 | 6 | 0 |
| static | 4 | 4 | 0 |
| legal | 5 | 5 | 0 |
| region | 24 | 24 | 0 |
| blog-index | 1 | 1 | 0 |
| blog-post | 28 | 23 | 5 |
| utility | 3 | 2 | 1 |
| private | 5 | 3 | 2 |
| **TOPLAM** | **77** | **68** | **9** |

## Bu dilde bulunanlar

| Bulgu | Seviye | Sayfa | Kayıtlı finding |
| --- | --- | --- | --- |
| `hreflang-incomplete` | error | 5 | SEO-005 |
| `title-double-brand` | warning | 5 | SEO-012 |
| `og-image-broken` | error | 4 | SEO-010 |
| `should-be-noindex` | error | 3 | SEO-004 |
| `duplicate-title` | error | 2 | SEO-004 / SEO-008 / SEO-019 |
| `duplicate-description` | error | 2 | SEO-004 / SEO-008 |
| `hreflang-redirect-target` | error | 1 | SEO-008 |
| `hreflang-not-reciprocal` | error | 1 | SEO-005 / SEO-008 |
| `h1-multiple` | warning | 1 | SEO-018 |
| `thin-content` | warning | 1 | SEO-025 |

## Başarısız URL'ler (9)

- `/de` — hreflang-incomplete
- `/de/admin` — should-be-noindex, duplicate-title, duplicate-description
- `/de/admin/login` — should-be-noindex, duplicate-title, duplicate-description
- `/de/blog/antalya-24-7-flughafentransfer` — og-image-broken
- `/de/blog/antalya-flughafentransfer-preise` — og-image-broken
- `/de/blog/fahrzeit-antalya-nach-alanya` — hreflang-redirect-target, hreflang-not-reciprocal
- `/de/blog/mercedes-vito-vip-transfer-flughafen-antalya` — og-image-broken
- `/de/blog/transfer-flughafen-antalya-nach-kas` — og-image-broken
- `/de/track` — should-be-noindex

## Doğrulanan alanlar

| Kontrol | Sonuç |
| --- | --- |
| HTTP 200 | 77/77 |
| 404 | 0 |
| Yönlendirme | 0 |
| Indexlenebilir | 72 |
| Title mevcut | 72/72 |
| Description mevcut | 72/72 |
| Tam olarak 1 H1 | 71/72 |
| Canonical mevcut | 70/72 |
| html lang = de | 72/72 |
| hreflang kümesi mevcut | 70/72 |
| og:image mevcut | 72/72 |
| og:image HTTP 200 | 68/72 |
| twitter:card mevcut | 72/72 |
| JSON-LD mevcut | 63/72 |
| Geçersiz JSON-LD | 0 |
| alt'sız görsel içeren sayfa | 0 |
| Sitemap'te | 69 |

Tam URL listesi ve alan alan değerler: `docs/seo-runtime-audit.md`, `docs/seo-runtime-audit.json`.
