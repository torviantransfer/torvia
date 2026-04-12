-- =============================================
-- TORVIAN Transfer Platform — Seed Data
-- =============================================

-- Vehicle Category
INSERT INTO vehicle_categories (id, name, slug, description, max_passengers, max_luggage, features, sort_order) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'VIP', 'vip', 'Mercedes-Benz Vito VIP Tourer with premium features', 5, 5, ARRAY['ac','wifi','water','leather','usb'], 1);

-- Vehicles
INSERT INTO vehicles (id, category_id, plate_number, brand, model, year, color) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '07 VLR 01', 'Mercedes-Benz', 'Vito Tourer', 2024, 'Black'),
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', '07 VLR 02', 'Mercedes-Benz', 'Vito Tourer', 2024, 'Black'),
  ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', '07 VLR 03', 'Mercedes-Benz', 'Vito Tourer', 2023, 'Black');

-- Drivers
INSERT INTO drivers (id, full_name, phone, is_active) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Driver 1', '+08508401327', true),
  ('d0000000-0000-0000-0000-000000000002', 'Driver 2', '+08508401327', true),
  ('d0000000-0000-0000-0000-000000000003', 'Driver 3', '+08508401327', true);

-- Regions (24 routes from Antalya Airport)
INSERT INTO regions (id, slug, name_tr, name_en, name_de, name_pl, name_ru, distance_km, duration_minutes, is_popular, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'kundu-lara',      'Kundu - Lara',       'Kundu - Lara',        'Kundu - Lara',       'Kundu - Lara',       'Кунду - Лара',       15, 20, true, 1),
  ('b0000000-0000-0000-0000-000000000002', 'sehirici',        'Antalya Şehiriçi',   'Antalya City Center', 'Antalya Zentrum',    'Centrum Antalyi',    'Центр Анталии',      12, 20, false, 2),
  ('b0000000-0000-0000-0000-000000000003', 'kadriye',         'Kadriye',            'Kadriye',             'Kadriye',            'Kadriye',            'Кадрие',             30, 30, false, 3),
  ('b0000000-0000-0000-0000-000000000004', 'belek',           'Belek',              'Belek',               'Belek',              'Belek',              'Белек',              35, 35, true, 4),
  ('b0000000-0000-0000-0000-000000000005', 'bogazkent',       'Boğazkent',          'Bogazkent',           'Bogazkent',          'Bogazkent',          'Богазкент',          45, 40, false, 5),
  ('b0000000-0000-0000-0000-000000000006', 'evrenseki',       'Evrenseki',          'Evrenseki',           'Evrenseki',          'Evrenseki',          'Эвренсеки',          60, 50, false, 6),
  ('b0000000-0000-0000-0000-000000000007', 'side',            'Side',               'Side',                'Side',               'Side',               'Сиде',               70, 60, true, 7),
  ('b0000000-0000-0000-0000-000000000008', 'kizilagac',       'Kızılağaç',          'Kizilagac',           'Kızılağaç',          'Kizilagac',          'Кызылагач',          80, 70, false, 8),
  ('b0000000-0000-0000-0000-000000000009', 'okurcalar',       'Okurcalar',          'Okurcalar',           'Okurcalar',          'Okurcalar',          'Окурджалар',         100, 80, false, 9),
  ('b0000000-0000-0000-0000-000000000010', 'turkler',         'Türkler',            'Turkler',             'Türkler',            'Turkler',            'Тюрклер',            110, 85, false, 10),
  ('b0000000-0000-0000-0000-000000000011', 'alanya',          'Alanya',             'Alanya',              'Alanya',             'Alanya',             'Аланья',             130, 120, true, 11),
  ('b0000000-0000-0000-0000-000000000012', 'mahmutlar',       'Mahmutlar',          'Mahmutlar',           'Mahmutlar',          'Mahmutlar',          'Махмутлар',          140, 130, false, 12),
  ('b0000000-0000-0000-0000-000000000013', 'kargicak',        'Kargıcak',           'Kargicak',            'Kargıcak',           'Kargicak',           'Каргыджак',          145, 135, false, 13),
  ('b0000000-0000-0000-0000-000000000014', 'beldibi',         'Beldibi',            'Beldibi',             'Beldibi',            'Beldibi',            'Бельдиби',           40, 35, false, 14),
  ('b0000000-0000-0000-0000-000000000015', 'goynuk',          'Göynük',             'Goynuk',              'Göynük',             'Goynuk',             'Гёйнюк',            50, 40, false, 15),
  ('b0000000-0000-0000-0000-000000000016', 'kemer',           'Kemer',              'Kemer',               'Kemer',              'Kemer',              'Кемер',              55, 50, true, 16),
  ('b0000000-0000-0000-0000-000000000017', 'kiris',           'Kiriş',              'Kiris',               'Kiriş',              'Kiris',              'Кириш',              60, 55, false, 17),
  ('b0000000-0000-0000-0000-000000000018', 'camyuva',         'Çamyuva',            'Camyuva',             'Çamyuva',            'Camyuva',            'Чамьюва',            65, 55, false, 18),
  ('b0000000-0000-0000-0000-000000000019', 'tekirova',        'Tekirova',           'Tekirova',            'Tekirova',           'Tekirova',           'Текирова',           70, 60, false, 19),
  ('b0000000-0000-0000-0000-000000000020', 'adrasan',         'Adrasan',            'Adrasan',             'Adrasan',            'Adrasan',            'Адрасан',            95, 90, false, 20),
  ('b0000000-0000-0000-0000-000000000021', 'kas',             'Kaş',                'Kas',                 'Kaş',                'Kas',                'Каш',                190, 180, true, 21),
  ('b0000000-0000-0000-0000-000000000022', 'kalkan',          'Kalkan',             'Kalkan',              'Kalkan',             'Kalkan',             'Калкан',             210, 190, false, 22),
  ('b0000000-0000-0000-0000-000000000023', 'fethiye',         'Fethiye',            'Fethiye',             'Fethiye',            'Fethiye',            'Фетхие',             220, 200, false, 23),
  ('b0000000-0000-0000-0000-000000000024', 'marmaris',        'Marmaris',           'Marmaris',            'Marmaris',           'Marmaris',           'Мармарис',           300, 270, false, 24);

-- Pricing (USD)
INSERT INTO pricing (region_id, category_id, one_way_price, round_trip_price, currency) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 35.00, 60.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 35.00, 60.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 40.00, 75.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 40.00, 75.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 45.00, 85.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 50.00, 90.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 55.00, 100.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 60.00, 110.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001', 65.00, 120.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001', 65.00, 120.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 75.00, 140.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001', 75.00, 140.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000001', 80.00, 150.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000001', 40.00, 75.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000001', 45.00, 85.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000001', 55.00, 100.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000001', 60.00, 110.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000001', 60.00, 110.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000001', 60.00, 110.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000001', 75.00, 140.00, 'USD'),
  ('b0000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000001', 160.00, NULL, 'USD'),
  ('b0000000-0000-0000-0000-000000000022', 'c0000000-0000-0000-0000-000000000001', 165.00, NULL, 'USD'),
  ('b0000000-0000-0000-0000-000000000023', 'c0000000-0000-0000-0000-000000000001', 170.00, NULL, 'USD'),
  ('b0000000-0000-0000-0000-000000000024', 'c0000000-0000-0000-0000-000000000001', 270.00, NULL, 'USD');

-- Exchange Rates
INSERT INTO exchange_rates (base_currency, target_currency, rate) VALUES
  ('USD', 'EUR', 0.92),
  ('USD', 'TRY', 38.50);

-- Settings (simple numeric JSONB values - code reads via Number(value))
INSERT INTO settings (key, value) VALUES
  ('night_surcharge_percent', '15'),
  ('child_seat_fee', '10'),
  ('welcome_sign_fee', '5'),
  ('company_name', '"TORVIAN Transfer"'),
  ('contact_email', '"torviantransfer@gmail.com"'),
  ('whatsapp_number', '"08508401327"'),
  ('cancellation_free_hours', '24');

-- Test Coupon
INSERT INTO coupons (code, discount_type, discount_value, max_uses, valid_until, is_active) VALUES
  ('WELCOME10', 'percent', 10.00, 100, '2026-12-31', true);
