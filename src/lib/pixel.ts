/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const PIXEL_ID = "970302365960353";
export const GOOGLE_ADS_ID = "AW-18125256328";

// ─── Core helper ────────────────────────────────────────────────────────────

function fbq(...args: any[]) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

function gtag(...args: any[]) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

// ─── Standard events ─────────────────────────────────────────────────────────

/** Her sayfa geçişinde tetiklenir (layout.tsx'te zaten var) */
export function pixelPageView() {
  fbq("track", "PageView");
}

/**
 * Araç seçimi yapılıp booking formu (step 2) açıldığında tetiklenir.
 * @param value    Tahmini fiyat (USD)
 * @param currency Para birimi (default "USD")
 */
export function pixelInitiateCheckout(value: number, currency = "USD") {
  fbq("track", "InitiateCheckout", {
    value,
    currency,
    content_type: "product",
    content_ids: ["transfer"],
  });
}

/**
 * Müşteri bilgileri doldurulup ödeme adımına (step 3) geçildiğinde tetiklenir.
 * @param value    Toplam fiyat (USD)
 * @param currency Para birimi (default "USD")
 */
export function pixelAddPaymentInfo(value: number, currency = "USD") {
  fbq("track", "AddPaymentInfo", {
    value,
    currency,
    content_type: "product",
    content_ids: ["transfer"],
  });
}

/**
 * Ödeme başarıyla tamamlandığında tetiklenir.
 * @param reservationCode Rezervasyon kodu
 * @param value           Ödenen toplam (USD)
 * @param currency        Para birimi (default "USD")
 * @param regionName      Güzergah adı
 */
export function pixelPurchase(
  reservationCode: string,
  value: number,
  currency = "USD",
  regionName?: string
) {
  // Meta only. The Google Ads conversion used to be fired from here too, which
  // meant it went out both at payment confirmation and again on the success
  // page — see gAdsConversionPurchase, which is now the single Ads entry point.
  fbq("track", "Purchase", {
    value,
    currency,
    content_type: "product",
    content_ids: ["transfer"],
    content_name: regionName ?? "Airport Transfer",
    order_id: reservationCode,
  }, { eventID: `purchase_${reservationCode}` });
}

/* ─── Purchase de-duplication ───────────────────────────────────────────────
 * The success page is a plain URL: refreshing it, hitting back, or reopening
 * a bookmark would re-fire the conversion. Remembering which reservations
 * have already been reported keeps it to one send per booking. Google Ads
 * also de-duplicates on transaction_id, so a browser with storage disabled
 * degrades to Ads-side de-duplication rather than to double counting.
 */

const PURCHASE_TRACKED_KEY = "TORVIAN_tracked_purchases";
const MAX_TRACKED = 20;

function readTrackedPurchases(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PURCHASE_TRACKED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function hasTrackedPurchase(reservationCode: string): boolean {
  return readTrackedPurchases().includes(reservationCode);
}

export function markPurchaseTracked(reservationCode: string): void {
  if (typeof window === "undefined") return;
  try {
    const next = [
      reservationCode,
      ...readTrackedPurchases().filter((c) => c !== reservationCode),
    ].slice(0, MAX_TRACKED);
    window.localStorage.setItem(PURCHASE_TRACKED_KEY, JSON.stringify(next));
  } catch {
    // Private mode / storage disabled — Ads still de-duplicates on transaction_id.
  }
}

/**
 * İletişim formu başarıyla gönderildiğinde tetiklenir.
 */
export function pixelContact() {
  fbq("track", "Contact");
}

/**
 * Bölge / transfer detay sayfası açıldığında tetiklenir.
 * @param regionName Bölge adı
 * @param value      Başlangıç fiyatı (opsiyonel)
 */
export function pixelViewContent(regionName: string, value?: number) {
  fbq("track", "ViewContent", {
    content_name: regionName,
    content_type: "product",
    content_ids: ["transfer"],
    ...(value !== undefined && { value, currency: "USD" }),
  });
}

/**
 * Arama / bölge seçimi yapıldığında tetiklenir.
 */
export function pixelSearch(query: string) {
  fbq("track", "Search", {
    search_string: query,
    content_type: "product",
  });
}

/**
 * The single place a Google Ads purchase conversion is sent.
 *
 * `value` must be the amount Stripe actually captured — for a cash booking
 * that is the deposit, not the full fare — and `currency` the currency of that
 * charge, both read off the PaymentIntent rather than off the reservation.
 *
 * transaction_id is the reservation code, which is what lets Ads discard
 * repeats even when the browser cannot remember what it already sent.
 */
export function gAdsConversionPurchase(
  value: number,
  currency: string,
  transactionId?: string
) {
  gtag("event", "conversion_event_purchase", {
    value,
    currency,
    transaction_id: transactionId,
  });
}
