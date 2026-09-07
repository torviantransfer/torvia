# Faz 14 — Rusça (/ru) tam denetimi

**Durum:** DONE
**Ölçüm:** production, 2026-09-07 — örnekleme yok, /ru altındaki bütün envanter.

## Kapsam

| Sayfa tipi | URL | PASS | FAIL |
| --- | --- | --- | --- |
| home | 1 | 0 | 1 |
| landing | 6 | 6 | 0 |
| static | 4 | 4 | 0 |
| legal | 5 | 5 | 0 |
| region | 24 | 24 | 0 |
| blog-index | 1 | 1 | 0 |
| blog-post | 27 | 22 | 5 |
| utility | 3 | 2 | 1 |
| private | 5 | 3 | 2 |
| **TOPLAM** | **76** | **67** | **9** |

## Bu dilde bulunanlar

| Bulgu | Seviye | Sayfa | Kayıtlı finding |
| --- | --- | --- | --- |
| `title-double-brand` | warning | 5 | SEO-012 |
| `hreflang-incomplete` | error | 4 | SEO-005 |
| `og-image-broken` | error | 4 | SEO-010 |
| `should-be-noindex` | error | 3 | SEO-004 |
| `duplicate-title` | error | 2 | SEO-004 / SEO-008 / SEO-019 |
| `duplicate-description` | error | 2 | SEO-004 / SEO-008 |
| `hreflang-redirect-target` | error | 1 | SEO-008 |
| `hreflang-not-reciprocal` | error | 1 | SEO-005 / SEO-008 |
| `thin-content` | warning | 1 | SEO-025 |

## Başarısız URL'ler (9)

- `/ru` — hreflang-incomplete
- `/ru/admin` — should-be-noindex, duplicate-title, duplicate-description
- `/ru/admin/login` — should-be-noindex, duplicate-title, duplicate-description
- `/ru/blog/antaliya-alaniya-vremya-v-puti` — hreflang-redirect-target, hreflang-not-reciprocal
- `/ru/blog/antaliya-transfer-24-7` — og-image-broken
- `/ru/blog/mercedes-vito-vip-transfer-antaliya` — og-image-broken
- `/ru/blog/transfer-aeroport-antalii-kash` — og-image-broken
- `/ru/blog/tseny-transfera-aeroport-antalii` — og-image-broken
- `/ru/track` — should-be-noindex

## Doğrulanan alanlar

| Kontrol | Sonuç |
| --- | --- |
| HTTP 200 | 76/76 |
| 404 | 0 |
| Yönlendirme | 0 |
| Indexlenebilir | 71 |
| Title mevcut | 71/71 |
| Description mevcut | 71/71 |
| Tam olarak 1 H1 | 71/71 |
| Canonical mevcut | 69/71 |
| html lang = ru | 71/71 |
| hreflang kümesi mevcut | 69/71 |
| og:image mevcut | 71/71 |
| og:image HTTP 200 | 67/71 |
| twitter:card mevcut | 71/71 |
| JSON-LD mevcut | 62/71 |
| Geçersiz JSON-LD | 0 |
| alt'sız görsel içeren sayfa | 0 |
| Sitemap'te | 68 |

Tam URL listesi ve alan alan değerler: `docs/seo-runtime-audit.md`, `docs/seo-runtime-audit.json`.
