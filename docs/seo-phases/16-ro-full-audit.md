# Faz 16 — Romence (/ro) tam denetimi

**Durum:** DONE
**Ölçüm:** production, 2026-09-07 — örnekleme yok, /ro altındaki bütün envanter.

## Kapsam

| Sayfa tipi | URL | PASS | FAIL |
| --- | --- | --- | --- |
| home | 1 | 0 | 1 |
| landing | 6 | 6 | 0 |
| static | 4 | 4 | 0 |
| legal | 5 | 5 | 0 |
| region | 24 | 0 | 24 |
| blog-index | 1 | 1 | 0 |
| blog-post | 25 | 21 | 4 |
| utility | 3 | 2 | 1 |
| private | 5 | 3 | 2 |
| **TOPLAM** | **74** | **42** | **32** |

## Bu dilde bulunanlar

| Bulgu | Seviye | Sayfa | Kayıtlı finding |
| --- | --- | --- | --- |
| `placeholder-leak` | error | 24 | SEO-001 |
| `title-double-brand` | warning | 5 | SEO-012 |
| `og-image-broken` | error | 4 | SEO-010 |
| `should-be-noindex` | error | 3 | SEO-004 |
| `hreflang-incomplete` | error | 2 | SEO-005 |
| `duplicate-title` | error | 2 | SEO-004 / SEO-008 / SEO-019 |
| `duplicate-description` | error | 2 | SEO-004 / SEO-008 |
| `hreflang-no-self` | error | 1 | SEO-005 |
| `canonical-hreflang-conflict` | error | 1 | SEO-005 |
| `hreflang-not-reciprocal` | error | 1 | SEO-005 / SEO-008 |

## Başarısız URL'ler (32)

- `/ro` — hreflang-no-self, canonical-hreflang-conflict, hreflang-incomplete, hreflang-not-reciprocal
- `/ro/admin` — should-be-noindex, duplicate-title, duplicate-description
- `/ro/admin/login` — should-be-noindex, duplicate-title, duplicate-description
- `/ro/adrasan-transfer` — placeholder-leak
- `/ro/alanya-transfer` — placeholder-leak
- `/ro/beldibi-transfer` — placeholder-leak
- `/ro/belek-transfer` — placeholder-leak
- `/ro/blog/antalya-7-24-transfer-hizmeti` — og-image-broken
- `/ro/blog/antalya-havalimani-kas-transfer` — og-image-broken
- `/ro/blog/antalya-havalimani-transfer-fiyatlari` — og-image-broken
- `/ro/blog/antalya-mercedes-vito-vip-transfer` — og-image-broken
- `/ro/bogazkent-transfer` — placeholder-leak
- `/ro/camyuva-transfer` — placeholder-leak
- `/ro/evrenseki-transfer` — placeholder-leak
- `/ro/fethiye-transfer` — placeholder-leak
- `/ro/goynuk-transfer` — placeholder-leak
- `/ro/kadriye-transfer` — placeholder-leak
- `/ro/kalkan-transfer` — placeholder-leak
- `/ro/kargicak-transfer` — placeholder-leak
- `/ro/kas-transfer` — placeholder-leak
- `/ro/kemer-transfer` — placeholder-leak
- `/ro/kiris-transfer` — placeholder-leak
- `/ro/kizilagac-transfer` — placeholder-leak
- `/ro/kundu-lara-transfer` — placeholder-leak
- `/ro/mahmutlar-transfer` — placeholder-leak
- `/ro/marmaris-transfer` — placeholder-leak
- `/ro/okurcalar-transfer` — placeholder-leak
- `/ro/sehirici-transfer` — placeholder-leak
- `/ro/side-transfer` — placeholder-leak
- `/ro/tekirova-transfer` — placeholder-leak
- `/ro/track` — should-be-noindex
- `/ro/turkler-transfer` — placeholder-leak

## Doğrulanan alanlar

| Kontrol | Sonuç |
| --- | --- |
| HTTP 200 | 74/74 |
| 404 | 0 |
| Yönlendirme | 0 |
| Indexlenebilir | 69 |
| Title mevcut | 69/69 |
| Description mevcut | 69/69 |
| Tam olarak 1 H1 | 69/69 |
| Canonical mevcut | 67/69 |
| html lang = ro | 69/69 |
| hreflang kümesi mevcut | 67/69 |
| og:image mevcut | 69/69 |
| og:image HTTP 200 | 65/69 |
| twitter:card mevcut | 69/69 |
| JSON-LD mevcut | 60/69 |
| Geçersiz JSON-LD | 0 |
| alt'sız görsel içeren sayfa | 0 |
| Sitemap'te | 66 |

Tam URL listesi ve alan alan değerler: `docs/seo-runtime-audit.md`, `docs/seo-runtime-audit.json`.
