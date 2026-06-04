-- =================================================================
-- TORVIAN — Cash Payment + Deposit System Migration
-- Run this in Supabase SQL Editor
-- =================================================================

-- ── 1. Add columns to reservations ────────────────────────────────
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS online_discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS driver_amount   NUMERIC(10,2) NOT NULL DEFAULT 0;

-- ── 2. Add cash price columns to pricing table ────────────────────
ALTER TABLE pricing
  ADD COLUMN IF NOT EXISTS one_way_cash_price    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cash_deposit_amount   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS round_trip_cash_price NUMERIC(10,2);

-- ── 3. Update all region prices ───────────────────────────────────
-- Online RT  = Kaptan×2 + Komisyon
-- Cash RT    = Online RT + 5
-- RT Deposit = same as one-way deposit (komisyon sabit)
-- Driver RT  = Cash RT - Deposit = Kaptan×2

-- Kundu-Lara  (Kaptan $30, Komisyon $10)
UPDATE pricing SET
  one_way_price=40,     one_way_cash_price=45,    cash_deposit_amount=15,
  round_trip_price=70,  round_trip_cash_price=75
  WHERE region_id='b0000000-0000-0000-0000-000000000001';

-- Antalya Şehiriçi  (Kaptan $35, Komisyon $10)
UPDATE pricing SET
  one_way_price=45,     one_way_cash_price=50,    cash_deposit_amount=15,
  round_trip_price=80,  round_trip_cash_price=85
  WHERE region_id='b0000000-0000-0000-0000-000000000002';

-- Kadriye  (Kaptan $40, Komisyon $10)
UPDATE pricing SET
  one_way_price=50,     one_way_cash_price=55,    cash_deposit_amount=15,
  round_trip_price=90,  round_trip_cash_price=95
  WHERE region_id='b0000000-0000-0000-0000-000000000003';

-- Belek  (Kaptan $35, Komisyon $15)
UPDATE pricing SET
  one_way_price=50,     one_way_cash_price=55,    cash_deposit_amount=20,
  round_trip_price=85,  round_trip_cash_price=90
  WHERE region_id='b0000000-0000-0000-0000-000000000004';

-- Boğazkent  (Kaptan $40, Komisyon $15)
UPDATE pricing SET
  one_way_price=55,     one_way_cash_price=60,    cash_deposit_amount=20,
  round_trip_price=95,  round_trip_cash_price=100
  WHERE region_id='b0000000-0000-0000-0000-000000000005';

-- Evrenseki  (Kaptan $40, Komisyon $15)
UPDATE pricing SET
  one_way_price=55,     one_way_cash_price=60,    cash_deposit_amount=20,
  round_trip_price=95,  round_trip_cash_price=100
  WHERE region_id='b0000000-0000-0000-0000-000000000006';

-- Side  (Kaptan $50, Komisyon $15)
UPDATE pricing SET
  one_way_price=65,      one_way_cash_price=70,    cash_deposit_amount=20,
  round_trip_price=115,  round_trip_cash_price=120
  WHERE region_id='b0000000-0000-0000-0000-000000000007';

-- Kızılağaç  (Kaptan $55, Komisyon $15)
UPDATE pricing SET
  one_way_price=70,      one_way_cash_price=75,    cash_deposit_amount=20,
  round_trip_price=125,  round_trip_cash_price=130
  WHERE region_id='b0000000-0000-0000-0000-000000000008';

-- Okurcalar  (Kaptan $60, Komisyon $15)
UPDATE pricing SET
  one_way_price=75,      one_way_cash_price=80,    cash_deposit_amount=20,
  round_trip_price=135,  round_trip_cash_price=140
  WHERE region_id='b0000000-0000-0000-0000-000000000009';

-- Türkler  (Kaptan $60, Komisyon $15)
UPDATE pricing SET
  one_way_price=75,      one_way_cash_price=80,    cash_deposit_amount=20,
  round_trip_price=135,  round_trip_cash_price=140
  WHERE region_id='b0000000-0000-0000-0000-000000000010';

-- Alanya  (Kaptan $65, Komisyon $20)
UPDATE pricing SET
  one_way_price=85,      one_way_cash_price=90,    cash_deposit_amount=25,
  round_trip_price=150,  round_trip_cash_price=155
  WHERE region_id='b0000000-0000-0000-0000-000000000011';

-- Mahmutlar  (Kaptan $70, Komisyon $25)
UPDATE pricing SET
  one_way_price=95,      one_way_cash_price=100,   cash_deposit_amount=30,
  round_trip_price=165,  round_trip_cash_price=170
  WHERE region_id='b0000000-0000-0000-0000-000000000012';

-- Kargıcak  (Kaptan $75, Komisyon $15)
UPDATE pricing SET
  one_way_price=90,      one_way_cash_price=95,    cash_deposit_amount=20,
  round_trip_price=165,  round_trip_cash_price=170
  WHERE region_id='b0000000-0000-0000-0000-000000000013';

-- Beldibi  (Kaptan $35, Komisyon $10)
UPDATE pricing SET
  one_way_price=45,     one_way_cash_price=50,    cash_deposit_amount=15,
  round_trip_price=80,  round_trip_cash_price=85
  WHERE region_id='b0000000-0000-0000-0000-000000000014';

-- Göynük  (Kaptan $40, Komisyon $15)
UPDATE pricing SET
  one_way_price=55,     one_way_cash_price=60,    cash_deposit_amount=20,
  round_trip_price=95,  round_trip_cash_price=100
  WHERE region_id='b0000000-0000-0000-0000-000000000015';

-- Kemer  (Kaptan $50, Komisyon $15)
UPDATE pricing SET
  one_way_price=65,      one_way_cash_price=70,    cash_deposit_amount=20,
  round_trip_price=115,  round_trip_cash_price=120
  WHERE region_id='b0000000-0000-0000-0000-000000000016';

-- Kiriş  (Kaptan $45, Komisyon $15)
UPDATE pricing SET
  one_way_price=60,      one_way_cash_price=65,    cash_deposit_amount=20,
  round_trip_price=105,  round_trip_cash_price=110
  WHERE region_id='b0000000-0000-0000-0000-000000000017';

-- Çamyuva  (Kaptan $45, Komisyon $15)
UPDATE pricing SET
  one_way_price=60,      one_way_cash_price=65,    cash_deposit_amount=20,
  round_trip_price=105,  round_trip_cash_price=110
  WHERE region_id='b0000000-0000-0000-0000-000000000018';

-- Tekirova  (Kaptan $60, Komisyon $15)
UPDATE pricing SET
  one_way_price=75,      one_way_cash_price=80,    cash_deposit_amount=20,
  round_trip_price=135,  round_trip_cash_price=140
  WHERE region_id='b0000000-0000-0000-0000-000000000019';

-- Adrasan  (Kaptan $70, Komisyon $20)
UPDATE pricing SET
  one_way_price=90,      one_way_cash_price=95,    cash_deposit_amount=25,
  round_trip_price=160,  round_trip_cash_price=165
  WHERE region_id='b0000000-0000-0000-0000-000000000020';

-- Kaş  (Kaptan $145, Komisyon $25)
UPDATE pricing SET
  one_way_price=170,     one_way_cash_price=175,   cash_deposit_amount=30,
  round_trip_price=315,  round_trip_cash_price=320
  WHERE region_id='b0000000-0000-0000-0000-000000000021';

-- Kalkan  (Kaptan $155, Komisyon $25)
UPDATE pricing SET
  one_way_price=180,     one_way_cash_price=185,   cash_deposit_amount=30,
  round_trip_price=335,  round_trip_cash_price=340
  WHERE region_id='b0000000-0000-0000-0000-000000000022';

-- Fethiye  (Kaptan $165, Komisyon $30)
UPDATE pricing SET
  one_way_price=195,     one_way_cash_price=200,   cash_deposit_amount=35,
  round_trip_price=360,  round_trip_cash_price=365
  WHERE region_id='b0000000-0000-0000-0000-000000000023';

-- Marmaris  (Kaptan $250, Komisyon $40)
UPDATE pricing SET
  one_way_price=290,     one_way_cash_price=295,   cash_deposit_amount=45,
  round_trip_price=540,  round_trip_cash_price=545
  WHERE region_id='b0000000-0000-0000-0000-000000000024';

-- ── 4. Settings ───────────────────────────────────────────────────
INSERT INTO settings (key, value) VALUES ('cash_payment_enabled', 'false'::jsonb)
  ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES ('night_tariff_enabled', 'false'::jsonb)
  ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES ('night_tariff_start', '"00:00"'::jsonb)
  ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES ('night_tariff_end', '"07:00"'::jsonb)
  ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES ('night_tariff_percent', '0'::jsonb)
  ON CONFLICT (key) DO NOTHING;
