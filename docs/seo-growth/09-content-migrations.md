# 09 — Migration'lar ve Uygulama Sırası

## Bu görevde oluşturulanlar

| # | Dosya | Ne yapıyor | Risk |
| --- | --- | --- | --- |
| 074 | `074_seo_override_retargeting.sql` | Üç `seo_pages` override'ını NULL'a çeker (GROWTH-002/003/004) | LOW |
| 075 | `075_blog_english_title_language_fix.sql` | `title_en`'deki Almanca ifadeyi düzeltir (GROWTH-006) | LOW |

Her ikisi de forward-only, idempotent (yalnız beklenen eski değeri hedefler),
veri silmez, `GET DIAGNOSTICS` ile etkilenen satırı sayar ve beklenen son durum
oluşmazsa `RAISE EXCEPTION` verir.

**070–073'e dokunulmadı, yeniden numaralandırılmadı.**

### Neden yalnız iki migration

Görev tanımı §30 "mantıksal gruplara böl" diyor ama aynı zamanda "küçük ve
ilişkili değişiklikleri gereksiz 20 migration'a bölme". Üç override düzeltmesi
tek bir mantıksal iş (yanlış override'ı geri al) ve tek dosyada; blog başlık
düzeltmesi farklı bir tabloya dokunduğu için ayrı.

Yüzlerce metni körlemesine replace eden bir içerik migration'ı **yazılmadı** —
çünkü kanıt yüzlerce metnin değişmesini gerektirmedi (bkz. `06-content-audit.md`).

---

## Hazırlanmış ama UYGULANMAYAN migration'lar

Aşağıdaki iki konsolidasyon kararı GSC sorgusu olmadan verilemez ve bu görevde
**yazılmadı** — çünkü hayatta kalan URL'yi seçmeden yazılan bir migration,
yanlış URL'yi kaldırma riskini dosyaya gömer.

### CANN-01 — airport-to-hotel blog çifti

Adaylar (her dilde):

- A: `hotel-transfer-antalya-airport` — 730 kelime, FAQ var
- B: `antalya-airport-hotel-transfer` — 502 kelime, FAQ yok

**Önce çalıştırılacak GSC sorgusu:**

```
Search Console → Performance → Pages
  filter: page contains "hotel-transfer-antalya-airport"
  filter: page contains "antalya-airport-hotel-transfer"
  range: last 3 months
  compare: impressions, clicks, average position
```

Hangisi gösterim/tıklama alıyorsa **o kalır**; diğeri `is_published = false`
yapılır ve `LOCALIZED_BLOG_CONSOLIDATION` (`src/lib/redirects.ts`) içine dil
başına slug eşlemesi eklenir.

**Neden şimdi yapılmadı:** migration 030 tam olarak bunu kanıtsız yaptı,
Google'ın poz 9,4'te sıraladığı Alanya yazısını yayından kaldırdı ve migration
037 geri almak zorunda kaldı. Aynı hatayı tekrarlamamak için bekletiliyor.

### CANN-02 — airport-transfer guide çifti (en, de)

Adaylar:

- A: `flughafen-transfer-antalya` — 1.258w (en) / 1.136w (de), 28–29 gelen link
- B: `antalya-airport-transfer-guide` / `antalya-flughafentransfer-ratgeber` — 562w / 434w, 1 gelen link

Aynı GSC sorgusu, aynı karar mekanizması.

**Not:** A'nın 28 gelen linki GROWTH-001'den önceki recency yıldızının eseriydi;
bu görevden sonra o sayı düşecek. Konsolidasyon kararı gelen linke değil
gösterime bakmalı.

---

## Tam uygulama sırası

```
─── VERİTABANI (deploy'dan ÖNCE) ───────────────────────────────
1.  070_romanian_seo_columns.sql
        Saf ekleme. Eski kod yeni kolonları görmezden gelir.
        BlogManager'ın Romence sekmesi buna bağımlı.

─── DEPLOY ─────────────────────────────────────────────────────
2.  git commit + push + Vercel deploy
        (birinci audit'in kod düzeltmeleri + bu görevin GROWTH-001'i)

─── VERİTABANI (deploy'dan SONRA) ──────────────────────────────
3.  071_finish_alanya_duration_consolidation.sql
4.  072_region_price_token.sql
        ⚠ Ters sırada çalışırsa eski kod bölge title'larına literal
          "{price}" basar. Mutlaka deploy'dan sonra.
5.  073_fix_missing_blog_images.sql
6.  074_seo_override_retargeting.sql
7.  075_blog_english_title_language_fix.sql

─── DOĞRULAMA ──────────────────────────────────────────────────
8.  npm run audit:seo
9.  BASE_URL=https://torviantransfer.com npm run verify:fixes
10. npm run verify:growth
```

## Uygulandıktan sonra beklenen

| Ölçüt | Şimdi | Sonra |
| --- | --- | --- |
| `placeholder-leak` (RO title'larında `undefined`) | 24 | 0 |
| `og-image-broken` | 28 | 0 |
| `should-be-noindex` | 21 | 0 |
| `title-double-brand` | 36 | 0 |
| `hreflang-incomplete` | 26 | 0 |
| `duplicate-title` | 18 | 0 |
| Almanca head term'i taşıyan URL | 5 | 4 |
| `/nl/kvkk` = `/nl/privacy` başlığı | evet | hayır |
| İngilizce yazıda Almanca başlık | 1 | 0 |

`thin-content` uyarıları (6) kasıtlı olarak kalıyor — bkz. `06-content-audit.md`.
