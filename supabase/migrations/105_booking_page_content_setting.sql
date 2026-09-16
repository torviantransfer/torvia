-- =============================================
-- 105: Booking sayfası içeriği panelden
--
-- /booking sayfasındaki güven kartları (6), rehber bölümleri (4), SSS (8) ve
-- kapanış paragrafı bugüne kadar yalnızca src/messages/*.json içinde sabit
-- metindi. Yeni bir tablo açmaya gerek yok: `settings` zaten genel amaçlı bir
-- key/value JSONB deposu (bkz. 001_initial_schema.sql), aynı desen
-- regions.page_content'te olduğu gibi burada da işliyor.
--
-- key = 'booking_page_content', value dil dil bir belge:
--   { "tr": { "trustCards": [{title, desc} x6],
--             "guideSections": [{title, body} x4],
--             "faq": [{question, answer} x8],
--             "closingText": "…" },
--     "de": { … }, … }
-- Boş bir alan = "otomatik metin kullanılsın" (src/messages/<locale>.json'daki
-- mevcut booking.* metni). Satır zaten var olmalı ki panel "update" ile
-- yazabilsin (crud route'u settings için var olmayan key'e update atamıyor).
--
-- Tek transaction, tekrar çalıştırılabilir.
-- =============================================

BEGIN;

INSERT INTO settings (key, value)
VALUES ('booking_page_content', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;

COMMIT;
