/* ==============================
   TORVIAN Transfer — Shared Types
   ============================== */

// ---------- Database row types ----------

export interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  max_passengers: number;
  max_luggage: number;
  features: string[];
  sort_order: number;
  is_active: boolean;
}

export interface Vehicle {
  id: string;
  category_id: string;
  plate_number: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  is_active: boolean;
}

export interface Region {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string;
  name_de: string;
  name_pl: string;
  name_ru: string;
  description_tr: string | null;
  description_en: string | null;
  description_de: string | null;
  description_pl: string | null;
  description_ru: string | null;
  meta_title_tr: string | null;
  meta_title_en: string | null;
  meta_title_de: string | null;
  meta_title_pl: string | null;
  meta_title_ru: string | null;
  meta_description_tr: string | null;
  meta_description_en: string | null;
  meta_description_de: string | null;
  meta_description_pl: string | null;
  meta_description_ru: string | null;
  distance_km: number;
  duration_minutes: number;
  image_url: string | null;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface Pricing {
  id: string;
  region_id: string;
  category_id: string;
  one_way_price: number;
  round_trip_price: number | null;
  currency: string; // always 'USD'
}

export interface ExchangeRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  last_updated: string;
}

export interface Driver {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  is_active: boolean;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  auth_user_id: string | null;
  created_at: string;
}

export type ReservationStatus =
  | "pending"
  | "paid"
  | "driver_assigned"
  | "passenger_picked_up"
  | "completed"
  | "cancelled";

export interface Reservation {
  id: string;
  reservation_code: string;
  customer_id: string;
  region_id: string;
  category_id: string;
  trip_type: "one_way" | "round_trip";
  pickup_datetime: string;
  return_datetime: string | null;
  flight_code: string | null;
  adults: number;
  children: number;
  luggage_count: number;
  child_seat: boolean;
  welcome_sign: boolean;
  welcome_name: string | null;
  hotel_name: string | null;
  hotel_address: string | null;
  notes: string | null;
  base_price: number;
  night_surcharge: number;
  child_seat_fee: number;
  welcome_sign_fee: number;
  round_trip_discount: number;
  coupon_discount: number;
  coupon_id: string | null;
  total_price: number;
  currency: string;
  exchange_rate_eur: number | null;
  exchange_rate_try: number | null;
  status: ReservationStatus;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  qr_code_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverAssignment {
  id: string;
  reservation_id: string;
  driver_id: string;
  vehicle_id: string;
  link_token: string;
  status: "assigned" | "accepted" | "picked_up" | "completed";
  assigned_at: string;
  accepted_at: string | null;
  picked_up_at: string | null;
  completed_at: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export interface Review {
  id: string;
  reservation_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface Settings {
  key: string;
  value: unknown;
}

// ---------- Client-side types ----------

export type CurrencyCode = "USD" | "EUR" | "TRY";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export type Locale = "tr" | "en" | "de" | "pl" | "ru";

export interface PriceCalculation {
  basePrice: number;
  nightSurcharge: number;
  childSeatFee: number;
  welcomeSignFee: number;
  roundTripDiscount: number;
  couponDiscount: number;
  totalPrice: number;
}

export interface BookingFormData {
  // Step 1
  tripType: "one_way" | "round_trip";
  regionSlug: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  returnTime?: string;
  flightCode?: string;
  adults: number;
  children: number;
  luggage: number;
  // Step 2 (vehicle selection - always vip for now)
  categoryId: string;
  childSeat: boolean;
  welcomeSign: boolean;
  welcomeName?: string;
  // Step 3
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hotelName?: string;
  hotelAddress?: string;
  notes?: string;
  couponCode?: string;
}

// ---------- API response types ----------

export interface RegionWithPricing extends Region {
  pricing: Pricing;
}

export interface PriceQuoteResponse {
  region: Region;
  pricing: Pricing;
  calculation: PriceCalculation;
  exchangeRates: {
    EUR: number;
    TRY: number;
  };
}

export interface CreateReservationResponse {
  reservation: Reservation;
  checkoutUrl: string;
}
