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
  fbq("track", "Purchase", {
    value,
    currency,
    content_type: "product",
    content_ids: ["transfer"],
    content_name: regionName ?? "Airport Transfer",
    order_id: reservationCode,
  });
  // Google Ads conversion (event name from Google Ads dashboard)
  gtag("event", "ads_conversion_Satın_alma_i_lemi_1", {
    value,
    currency,
    transaction_id: reservationCode,
  });
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
