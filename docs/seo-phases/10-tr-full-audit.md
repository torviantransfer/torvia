# Faz 10 — Türkçe (/tr) tam denetimi

**Durum:** DONE
**Ölçüm:** production, 2026-09-07 — örnekleme yok, /tr altındaki bütün envanter.

## Kapsam

| Sayfa tipi | URL | PASS | FAIL |
| --- | --- | --- | --- |
| home | 1 | 0 | 1 |
| landing | 6 | 6 | 0 |
| static | 4 | 4 | 0 |
| legal | 5 | 5 | 0 |
| region | 24 | 24 | 0 |
| blog-index | 1 | 1 | 0 |
| blog-post | 27 | 21 | 6 |
| utility | 3 | 2 | 1 |
| private | 5 | 3 | 2 |
| **TOPLAM** | **76** | **66** | **10** |

## Bu dilde bulunanlar

| Bulgu | Seviye | Sayfa | Kayıtlı finding |
| --- | --- | --- | --- |
| `title-double-brand` | warning | 5 | SEO-012 |
| `duplicate-title` | error | 4 | SEO-004 / SEO-008 / SEO-019 |
| `duplicate-description` | error | 4 | SEO-004 / SEO-008 |
| `og-image-broken` | error | 4 | SEO-010 |
| `hreflang-incomplete` | error | 3 | SEO-005 |
| `should-be-noindex` | error | 3 | SEO-004 |
| `duplicate-canonical` | error | 2 | SEO-008 |
| `redirected` | error | 1 | SEO-008 |
| `sitemap-redirect` | error | 1 | SEO-008 |
| `hreflang-not-reciprocal` | error | 1 | SEO-005 / SEO-008 |
| `canonical-mismatch` | warning | 1 | SEO-008 |
| `hreflang-self-mismatch` | warning | 1 | SEO-008 |
| `thin-content` | warning | 1 | SEO-025 |

## Başarısız URL'ler (10)

- `/tr` — hreflang-incomplete
- `/tr/admin` — should-be-noindex, duplicate-title, duplicate-description
- `/tr/admin/login` — should-be-noindex, duplicate-title, duplicate-description
- `/tr/blog/antalya-7-24-transfer-hizmeti` — og-image-broken
- `/tr/blog/antalya-alanya-transfer-suresi` — redirected, sitemap-redirect, hreflang-not-reciprocal, duplicate-title, duplicate-description, duplicate-canonical
- `/tr/blog/antalya-havalimani-alanya-transfer-kac-saat` — duplicate-title, duplicate-description, duplicate-canonical
- `/tr/blog/antalya-havalimani-kas-transfer` — og-image-broken
- `/tr/blog/antalya-havalimani-transfer-fiyatlari` — og-image-broken
- `/tr/blog/antalya-mercedes-vito-vip-transfer` — og-image-broken
- `/tr/track` — should-be-noindex

## Doğrulanan alanlar

| Kontrol | Sonuç |
| --- | --- |
| HTTP 200 | 76/76 |
| 404 | 0 |
| Yönlendirme | 1 |
| Indexlenebilir | 71 |
| Title mevcut | 71/71 |
| Description mevcut | 71/71 |
| Tam olarak 1 H1 | 71/71 |
| Canonical mevcut | 69/71 |
| html lang = tr | 71/71 |
| hreflang kümesi mevcut | 69/71 |
| og:image mevcut | 71/71 |
| og:image HTTP 200 | 67/71 |
| twitter:card mevcut | 71/71 |
| JSON-LD mevcut | 62/71 |
| Geçersiz JSON-LD | 0 |
| alt'sız görsel içeren sayfa | 0 |
| Sitemap'te | 68 |

Tam URL listesi ve alan alan değerler: `docs/seo-runtime-audit.md`, `docs/seo-runtime-audit.json`.
