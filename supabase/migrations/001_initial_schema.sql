-- =============================================
-- TORVIAN Transfer Platform — Database Schema
-- Aligned with application code column names
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. VEHICLE CATEGORIES
-- =============================================
CREATE TABLE vehicle_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  max_passengers INT DEFAULT 5,
  max_luggage INT DEFAULT 5,
  features TEXT[] DEFAULT '{}',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. VEHICLES
-- =============================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES vehicle_categories(id) ON DELETE SET NULL,
  plate_number TEXT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT,
  color TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. REGIONS
-- =============================================
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name_tr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_de TEXT NOT NULL,
  name_pl TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_tr TEXT,
  description_en TEXT,
  description_de TEXT,
  description_pl TEXT,
  description_ru TEXT,
  meta_title_tr TEXT,
  meta_title_en TEXT,
  meta_title_de TEXT,
  meta_title_pl TEXT,
  meta_title_ru TEXT,
  meta_description_tr TEXT,
  meta_description_en TEXT,
  meta_description_de TEXT,
  meta_description_pl TEXT,
  meta_description_ru TEXT,
  distance_km NUMERIC(6,1),
  duration_minutes INT,
  image_url TEXT,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. PRICING (Region x Category)
-- =============================================
CREATE TABLE pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  category_id UUID REFERENCES vehicle_categories(id) ON DELETE CASCADE,
  one_way_price NUMERIC(10,2) NOT NULL,
  round_trip_price NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(region_id, category_id)
);

-- =============================================
-- 5. SETTINGS
-- =============================================
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. EXCHANGE RATES
-- =============================================
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_currency TEXT DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  rate NUMERIC(12,6) NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(base_currency, target_currency)
);

-- =============================================
-- 7. DRIVERS
-- =============================================
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. CUSTOMERS
-- =============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  auth_user_id UUID UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. RESERVATIONS
-- =============================================
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_code TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  region_id UUID REFERENCES regions(id),
  category_id UUID REFERENCES vehicle_categories(id),
  trip_type TEXT NOT NULL CHECK (trip_type IN ('one_way', 'round_trip')),
  pickup_datetime TIMESTAMPTZ NOT NULL,
  return_datetime TIMESTAMPTZ,
  flight_code TEXT,
  adults INT DEFAULT 1,
  children INT DEFAULT 0,
  luggage_count INT DEFAULT 0,
  child_seat BOOLEAN DEFAULT false,
  welcome_sign BOOLEAN DEFAULT false,
  welcome_name TEXT,
  hotel_name TEXT,
  hotel_address TEXT,
  notes TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  night_surcharge NUMERIC(10,2) DEFAULT 0,
  child_seat_fee NUMERIC(10,2) DEFAULT 0,
  welcome_sign_fee NUMERIC(10,2) DEFAULT 0,
  round_trip_discount NUMERIC(10,2) DEFAULT 0,
  coupon_discount NUMERIC(10,2) DEFAULT 0,
  coupon_id UUID,
  total_price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  exchange_rate_eur NUMERIC(12,6),
  exchange_rate_try NUMERIC(12,6),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'paid', 'driver_assigned',
    'passenger_picked_up', 'completed', 'cancelled'
  )),
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  qr_code_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 10. DRIVER ASSIGNMENTS
-- =============================================
CREATE TABLE driver_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  link_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'picked_up', 'completed')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- =============================================
-- 11. DRIVER PAYMENTS (Cari Hesap)
-- =============================================
CREATE TABLE driver_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('earning', 'payment', 'adjustment')),
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 12. COUPONS
-- =============================================
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order NUMERIC(10,2) DEFAULT 0,
  max_uses INT DEFAULT 999,
  used_count INT DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 13. REVIEWS
-- =============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 14. BLOG POSTS
-- =============================================
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title_tr TEXT,
  title_en TEXT,
  title_de TEXT,
  title_pl TEXT,
  title_ru TEXT,
  content_tr TEXT,
  content_en TEXT,
  content_de TEXT,
  content_pl TEXT,
  content_ru TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 15. NOTIFICATION LOG
-- =============================================
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  type TEXT,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_pickup ON reservations(pickup_datetime);
CREATE INDEX idx_reservations_code ON reservations(reservation_code);
CREATE INDEX idx_reservations_qr ON reservations(qr_code_token);
CREATE INDEX idx_driver_assignments_token ON driver_assignments(link_token);
CREATE INDEX idx_driver_assignments_driver ON driver_assignments(driver_id);
CREATE INDEX idx_pricing_region ON pricing(region_id);
CREATE INDEX idx_regions_slug ON regions(slug);
CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_customers_email ON customers(email);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Public read for website data
CREATE POLICY "Public read regions" ON regions FOR SELECT USING (is_active = true);
CREATE POLICY "Public read categories" ON vehicle_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read vehicles" ON vehicles FOR SELECT USING (is_active = true);
CREATE POLICY "Public read pricing" ON pricing FOR SELECT USING (is_active = true);
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Public read exchange_rates" ON exchange_rates FOR SELECT USING (true);
CREATE POLICY "Public read coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Public read approved reviews" ON reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Public read published blogs" ON blog_posts FOR SELECT USING (is_published = true);

-- Guest checkout inserts
CREATE POLICY "Anyone can create reservation" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create customer" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create review" ON reviews FOR INSERT WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Coupon usage increment
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql;
