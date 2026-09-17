-- =============================================================
-- 106 — Yarım kalan rezervasyon formları: booking_leads
-- =============================================================
-- Yolcu bilgileri adımında telefon ya da e-posta yazılıp "Devam Et"e hiç
-- basılmadan siteden çıkılırsa, o ana kadar hiçbir yer bu bilgiyi
-- görmüyordu — form alanları yalnızca tarayıcıda duruyordu. Geçerli bir
-- telefon veya e-posta yazıldığı an /api/booking-leads'e sessizce
-- gönderiliyor ve burada kayıt altına alınıyor; rezervasyon tablosuyla
-- karışmasın diye ayrı bir tablo. Panelden manuel silinebilir — WhatsApp
-- rehberine eklenen bir numaranın panelde durmasına gerek yok.
--
-- Bildirim yok (Telegram'a gitmiyor); tek erişim admin panelindeki liste.
--
-- Safe to run twice: does nothing if the table already exists.

CREATE TABLE IF NOT EXISTS booking_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  region_slug TEXT,
  pickup_date TEXT,
  pickup_time TEXT,
  party_size INTEGER,
  locale TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS booking_leads_phone_idx ON booking_leads (phone);
CREATE INDEX IF NOT EXISTS booking_leads_email_idx ON booking_leads (email);
CREATE INDEX IF NOT EXISTS booking_leads_created_at_idx ON booking_leads (created_at DESC);

ALTER TABLE booking_leads ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE booking_leads IS
  'Yolcu bilgisi formuna telefon/e-posta yazılıp rezervasyon tamamlanmadan çıkılan durumlar. Panelden silinebilir, rezervasyonlarla ilişkisi yok.';
