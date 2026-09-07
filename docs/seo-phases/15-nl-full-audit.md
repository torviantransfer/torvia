# Faz 15 — Hollandaca (/nl) tam denetimi

**Durum:** DONE
**Ölçüm:** production, 2026-09-07 — örnekleme yok, /nl altındaki bütün envanter.

## Kapsam

| Sayfa tipi | URL | PASS | FAIL |
| --- | --- | --- | --- |
| home | 1 | 0 | 1 |
| landing | 6 | 6 | 0 |
| static | 4 | 4 | 0 |
| legal | 5 | 3 | 2 |
| region | 24 | 24 | 0 |
| blog-index | 1 | 1 | 0 |
| blog-post | 26 | 21 | 5 |
| utility | 3 | 2 | 1 |
| private | 5 | 3 | 2 |
| **TOPLAM** | **75** | **64** | **11** |

## Bu dilde bulunanlar

| Bulgu | Seviye | Sayfa | Kayıtlı finding |
| --- | --- | --- | --- |
| `title-double-brand` | warning | 5 | SEO-012 |
| `duplicate-title` | error | 4 | SEO-004 / SEO-008 / SEO-019 |
| `og-image-broken` | error | 4 | SEO-010 |
| `hreflang-incomplete` | error | 3 | SEO-005 |
| `should-be-noindex` | error | 3 | SEO-004 |
| `duplicate-description` | error | 2 | SEO-004 / SEO-008 |
| `hreflang-redirect-target` | error | 1 | SEO-008 |
| `hreflang-not-reciprocal` | error | 1 | SEO-005 / SEO-008 |
| `thin-content` | warning | 1 | SEO-025 |

## Başarısız URL'ler (11)

- `/nl` — hreflang-incomplete
- `/nl/admin` — should-be-noindex, duplicate-title, duplicate-description
- `/nl/admin/login` — should-be-noindex, duplicate-title, duplicate-description
- `/nl/blog/antalya-24-7-luchthaventransfer` — og-image-broken
- `/nl/blog/mercedes-vito-vip-transfer-antalya` — og-image-broken
- `/nl/blog/prijzen-luchthaventransfer-antalya` — og-image-broken
- `/nl/blog/reistijd-antalya-naar-alanya` — hreflang-redirect-target, hreflang-not-reciprocal
- `/nl/blog/transfer-luchthaven-antalya-kas` — og-image-broken
- `/nl/kvkk` — duplicate-title
- `/nl/privacy` — duplicate-title
- `/nl/track` — should-be-noindex

## Doğrulanan alanlar

| Kontrol | Sonuç |
| --- | --- |
| HTTP 200 | 75/75 |
| 404 | 0 |
| Yönlendirme | 0 |
| Indexlenebilir | 70 |
| Title mevcut | 70/70 |
| Description mevcut | 70/70 |
| Tam olarak 1 H1 | 70/70 |
| Canonical mevcut | 68/70 |
| html lang = nl | 70/70 |
| hreflang kümesi mevcut | 68/70 |
| og:image mevcut | 70/70 |
| og:image HTTP 200 | 66/70 |
| twitter:card mevcut | 70/70 |
| JSON-LD mevcut | 61/70 |
| Geçersiz JSON-LD | 0 |
| alt'sız görsel içeren sayfa | 0 |
| Sitemap'te | 67 |

Tam URL listesi ve alan alan değerler: `docs/seo-runtime-audit.md`, `docs/seo-runtime-audit.json`.
