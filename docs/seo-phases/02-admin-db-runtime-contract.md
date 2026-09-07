# Faz 02 — Admin → DB → Runtime kontratı

**Durum:** DONE

## SEO-003

**Durum:** FIXED (migration hazır, uygulanmadı — kimlik bilgisi yok)
**Severity:** CRITICAL
**Category:** schema / migration drift
**Affected files:** `supabase/migrations/070_romanian_seo_columns.sql` (yeni)
**Affected URLs:** Romence SEO düzenlemesi yapılmak istenen her sayfa
**Affected locales:** `ro`

**Observed behavior:** SEO panelinin Romence sekmesi 7. dil olarak görünüyor ve
bütün alanları sunuyor. Kaydetmeye çalışınca `/api/admin/crud` 500 dönüyor,
panel "Kaydedilemedi" gösteriyor. Aynı kayıt içindeki diğer diller de kayboluyor,
çünkü panel değişen bütün kolonları tek bir UPDATE'te gönderiyor.

**Expected behavior:** Romence, diğer altı dille aynı şekilde kaydedilebilmeli.

**Root cause:** migration 062–069 Romence *içerik* kolonlarını ekledi
(`regions.name_ro/description_ro/meta_title_ro/meta_description_ro`,
`blog_posts.title_ro/content_ro/excerpt_ro/slug_ro`) ama SEO panelinin kullandığı
kolonların **hiçbirini** eklemedi. 057 ve 058 o kolonları altı dil için
oluşturmuştu ve Romence eklenirken geri dönülmedi.

Eksik: `seo_pages` 11, `regions` 8, `blog_posts` 9 = **28 kolon**.

**Evidence:**

```
$ grep -rn "_ro\b" supabase/migrations/*.sql | grep "ADD COLUMN"
062_romanian_locale.sql:16: regions.name_ro
062_romanian_locale.sql:17: regions.description_ro
062_romanian_locale.sql:18: regions.meta_title_ro
062_romanian_locale.sql:19: regions.meta_description_ro
063_romanian_blog_columns.sql:13: blog_posts.title_ro
063_romanian_blog_columns.sql:14: blog_posts.content_ro
063_romanian_blog_columns.sql:15: blog_posts.excerpt_ro
063_romanian_blog_columns.sql:16: blog_posts.slug_ro
```

`seo_pages` için tek bir satır yok.

**Fix:** `070_romanian_seo_columns.sql`. Forward-only, idempotent
(`ADD COLUMN IF NOT EXISTS`), hiçbir veriye dokunmuyor, hepsi nullable — yani
uygulanması Google'ın gördüğü hiçbir şeyi değiştirmiyor.

Sonunda bir postcondition bloğu var: 36 kolonun (mevcut 8 + yeni 28) hepsi
`information_schema.columns`'ta yoksa `RAISE EXCEPTION`. "SQL hata vermedi =
başarılı" kabul edilmiyor.

**Regression test:** `scripts/verify-seo-callers.ts` → "seo_pages meta_title_ro
yayına çıkıyor", "bölge meta_title_ro yayına çıkıyor", "blog meta_title_ro yayına
çıkıyor". Bunlar kolonun *tüketildiğini* kanıtlar; kolonun *var olduğunu*
migration'ın postcondition'ı kanıtlar.

**Runtime verification:** BLOCKED — Supabase kimlik bilgisi yok. Migration
uygulandığında postcondition kendini doğrular.

---

## SEO-014

**Durum:** FIXED
**Severity:** MEDIUM
**Category:** admin contract split
**Affected files:** `src/components/admin/BlogManager.tsx`
**Affected locales:** `ro`

**Observed behavior:** SEO paneli bir blog yazısının Romence meta title'ını
sunuyor; blog içerik editöründe Romence sekmesi hiç yok. Yani bir yazının
Romence SERP başlığı yazılabiliyor ama Romence **başlığı, gövdesi ve slug'ı**
yazılamıyor. İki panel sitenin kaç dili olduğu konusunda anlaşamıyor.

**Root cause:** `const LOCALES = ["en","tr","de","pl","ru","nl"]` — ayrı bir
liste, `src/i18n/config.ts`'ten türetilmemiş.

**Fix:** `ro` eklendi; `BlogPost` arayüzü ve `emptyForm` altı yeni alan aldı.
`startEdit` elle yazılmış 36 atama yerine `LOCALES × LOCALISED_FIELDS`
döngüsünden kuruluyor — sekizinci bir dil eklendiğinde bu fonksiyonda
hatırlanacak bir şey kalmıyor.

**Not:** bu değişiklik migration 070'e bağımlı. 070 uygulanmadan deploy edilirse
Romence alanı dolu bir blog kaydı `focus_keyword_ro` yüzünden 500 verir.
Deploy sırası: **070 → deploy**.

**Regression test:** tip sistemi (`FormState` artık `_ro` alanlarını içeriyor;
eksik bir tanesi derlemeyi kırar).

---

## SEO-017

**Durum:** FIXED
**Severity:** MEDIUM
**Category:** silent fallback
**Affected files:** `src/lib/seoPages.ts`

**Observed behavior:** `getSeoPage()` her hatayı `null`'a çeviriyordu. "Satır
yok" ile "tablo yok / kolon yok / anahtar geçersiz" arasında hiçbir fark yoktu;
sayfa hardcoded değerlerle render ediliyor ve hiçbir yerde bir iz kalmıyordu.

**Expected behavior:** görev tanımı §H — EXPECTED FALLBACK sessiz, UNEXPECTED
FALLBACK görünür olmalı; sayfa yine de 500 vermemeli.

**Root cause:** `if (error || !data) return null;` — iki farklı olguyu tek dala
indiriyor.

**Fix:** ikisi ayrıldı. Satır yoksa sessiz. `error` varsa veya `catch`'e
düşerse: `console.error` ile page_key ve mesaj loglanıyor ve `seoReadFailures()`
üzerinden okunabilir hale geliyor. Sayfa yine hardcoded değerlerle render
ediliyor — davranış değişmedi, görünürlük eklendi.

**Runtime verification:** deploy sonrası Vercel loglarında `[seo] seo_pages
okunamadı` araması. Beklenen: hiç.

---

## SEO-021

**Durum:** FIXED
**Severity:** MEDIUM
**Category:** test coverage
**Affected files:** `scripts/verify-seo-overrides.ts`, `scripts/verify-seo-callers.ts` (yeni)

**Observed behavior:** `npm run verify:seo` 60+ assertion ile yeşil geçiyordu ve
SEO-002 (blog override'larının hiç uygulanmaması) aylarca fark edilmedi.

**Root cause:** bütün testler `applyOverrides()`'a doğrudan giriyordu.
`applyOverrides` doğru çalışıyordu. Hata çağıranın gönderdiği option'daydı ve
hiçbir test bir çağıranı çalıştırmıyordu.

**Fix:** iki adım.

1. `blogMetadata()` ve `regionMetadata()` page modüllerinden export edildi.
   `generateMetadata` artık bir DB okuması + bu fonksiyona çağrı.
2. `scripts/verify-seo-callers.ts` bu **page modüllerini import edip**
   fonksiyonları çağırıyor. Yani test edilen şey sayfanın kendi kodu.

Test edilen kontrat her tablo için aynı ve editörün yaşadığı deneyimle birebir:

```
fallback → override ekle → etkin değer değişti → override sil → fallback döndü
```

**Kanıt:** iki hata da geri getirildi (blog: kolonları okumayı bırak; bölge:
6 anahtarlı `priceLabel` kaydına dön) ve **31 kontrat FAIL** verdi. Geri
alındığında hepsi yeniden PASS.

---

## SEO-015

**Durum:** FIXED
**Severity:** MEDIUM
**Category:** admin ↔ sitemap tutarlılığı
**Affected files:** `src/app/sitemap.ts`, `src/lib/revalidate.ts`

**Observed behavior:** panelden bir sayfaya/bölgeye/yazıya `noindex` işaretlenince
sayfa noindex oluyor ama sitemap'te kalmaya devam ediyordu → Search Console
"Gönderilen URL 'noindex' olarak işaretlenmiş" hatası.

**Fix:** `sitemap.ts` artık üç tablonun da `noindex` kolonunu okuyor ve işaretli
olanları atlıyor. `revalidateForTable`, `seo_pages` yazımlarında `/sitemap.xml`
yolunu da temizliyor (bölgeler ve yazılar için zaten yapıyordu).
