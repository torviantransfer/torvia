/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    /** Event id of the pageview the pixel snippet fired before hydration. */
    __fbPageViewId?: string;
  }
}

export const PIXEL_ID = "970302365960353";
/** The pixel actually in use — the env override, or the id above. */
export const ACTIVE_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || PIXEL_ID;
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

/**
 * Bir olayın tarayıcı ve sunucu kopyalarını eşleştiren kimlik.
 *
 * Aynı olay iki kez sayılmasın diye hem fbq çağrısına hem de Dönüşümler API'si
 * isteğine bu kimlik verilir; Meta ikisini tek olayda birleştirir.
 */
export function newPixelEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `pv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/* ─── Advanced matching ──────────────────────────────────────────────────────
 * Events Manager flags a pixel whose init carries no customer details: with
 * nothing but cookies to go on, a browser event is matched on the identifiers
 * that shrink every time a browser tightens its storage rules, which is why
 * the warning can appear on a pixel that has been running unchanged for
 * months. The Conversions API side already sends hashed em/ph (lib/capi.ts);
 * this is the browser's half of the same signal.
 *
 * Values are hashed here rather than handed to the pixel raw. Meta accepts
 * SHA-256 hex for every field, and hashing before we store means no readable
 * email or phone number sits in localStorage waiting to be replayed on a
 * later visit.
 */

/** Where the hashed match data lives. Also read by the init snippet in layout.tsx. */
export const ADVANCED_MATCHING_KEY = "TORVIAN_fb_am";

/** How long a stored match stays usable, in ms (90 days). */
export const ADVANCED_MATCHING_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export interface PixelUserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

/** Advanced matching keys mapped to their hashed (or, as a fallback, normalised) values. */
type MatchData = Record<string, string>;

/**
 * Meta's normalisation rules: an email lowercased, a phone reduced to digits
 * with its country code, a name lowercased with punctuation and spacing
 * removed. Getting these wrong does not fail loudly — it just produces a hash
 * that matches nobody.
 */
function normalizeUserData(u: PixelUserData): MatchData {
  const out: MatchData = {};

  const em = (u.email ?? "").trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) out.em = em;

  // PhoneInput hands us E.164 ("+905321234567"), so dropping everything that
  // is not a digit leaves the country code in place, which is what Meta wants.
  const ph = (u.phone ?? "").replace(/\D/g, "");
  if (ph.length >= 8) out.ph = ph;

  const fn = (u.firstName ?? "").trim().toLowerCase().replace(/[^\p{L}]/gu, "");
  if (fn) out.fn = fn;

  const ln = (u.lastName ?? "").trim().toLowerCase().replace(/[^\p{L}]/gu, "");
  if (ln) out.ln = ln;

  return out;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function applyMatchData(data: MatchData): void {
  if (Object.keys(data).length === 0) return;
  // Re-initialising the same pixel id is how the snippet's bare init is
  // upgraded: it attaches the match data to every event sent afterwards and
  // does not itself send anything, so no pageview is duplicated.
  fbq("init", ACTIVE_PIXEL_ID, data);
}

/**
 * Attaches the customer's details to this pixel, and remembers them for later
 * visits.
 *
 * Await it before firing the event it belongs to — advanced matching applies
 * to events sent after the init, not to one already on its way.
 *
 * Never throws: a pixel that cannot match is worth less than one that can, but
 * it is not worth failing a booking over.
 */
export async function setPixelUserData(u: PixelUserData): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const plain = normalizeUserData(u);
    if (Object.keys(plain).length === 0) return;

    if (typeof crypto === "undefined" || !crypto.subtle) {
      // No SubtleCrypto — an insecure origin, or a browser too old for it. The
      // pixel hashes raw values itself, so this visit still matches; nothing is
      // persisted, because a readable email and phone number at rest is the
      // part worth avoiding.
      applyMatchData(plain);
      return;
    }

    const entries = Object.entries(plain);
    const hashedPairs = await Promise.all(
      entries.map(async ([k, v]) => [k, await sha256Hex(v)] as const)
    );
    const hashed: MatchData = Object.fromEntries(hashedPairs);

    try {
      window.localStorage.setItem(
        ADVANCED_MATCHING_KEY,
        JSON.stringify({ t: Date.now(), d: hashed })
      );
    } catch {
      // Private mode / quota — this visit still gets advanced matching.
    }

    applyMatchData(hashed);
  } catch {
    // Hashing or storage failed; the event still goes out unmatched.
  }
}

/** The stored match data, or null if there is none or it has expired. */
export function readStoredPixelUserData(): MatchData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADVANCED_MATCHING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { t?: unknown; d?: unknown };
    if (typeof parsed?.t !== "number" || !parsed.d || typeof parsed.d !== "object") return null;
    if (Date.now() - parsed.t > ADVANCED_MATCHING_TTL_MS) {
      window.localStorage.removeItem(ADVANCED_MATCHING_KEY);
      return null;
    }
    return parsed.d as MatchData;
  } catch {
    return null;
  }
}

/**
 * Re-applies remembered details to the pixel of the current page.
 *
 * The init snippet already does this on a full page load. A client-side
 * navigation does not re-run it, so a route that fires a conversion after one
 * — the success page reached without Stripe's redirect — has to ask for it.
 */
export function applyStoredPixelUserData(): void {
  const stored = readStoredPixelUserData();
  if (stored) applyMatchData(stored);
}

// ─── Standard events ─────────────────────────────────────────────────────────

/**
 * Sayfa görüntülemesi. Sayfanın ilk açılışını layout.tsx'teki piksel snippet'i
 * gönderir; bu fonksiyon istemci tarafı geçişler için MetaPageView'dan
 * çağrılır. Sunucu kopyasıyla eşleşmesi için eventId verilmeli.
 */
export function pixelPageView(eventId?: string) {
  fbq("track", "PageView", {}, eventId ? { eventID: eventId } : undefined);
}

/**
 * Araç seçimi yapılıp booking formu (step 2) açıldığında tetiklenir.
 * @param value    Tahmini fiyat (USD)
 * @param currency Para birimi (default "EUR")
 */
export function pixelInitiateCheckout(value: number, currency = "EUR") {
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
 * @param currency Para birimi (default "EUR")
 */
export function pixelAddPaymentInfo(value: number, currency = "EUR") {
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
 * @param currency        Para birimi (default "EUR")
 * @param regionName      Güzergah adı
 */
export function pixelPurchase(
  reservationCode: string,
  value: number,
  currency = "EUR",
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
 *
 * eventId, /api/contact'a gönderilen kimliğin aynısı olmalı — sunucu da aynı
 * Contact olayını Dönüşümler API'sine yolluyor.
 */
export function pixelContact(eventId?: string) {
  fbq("track", "Contact", {}, eventId ? { eventID: eventId } : undefined);
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
    ...(value !== undefined && { value, currency: "EUR" }),
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
