/**
 * Just enough user-agent parsing for the visitor reports.
 *
 * Deliberately not a library: the questions the admin panel asks are "phone or
 * desktop", "iOS or Android" and "which browser", and answering those well
 * enough to rank a bar chart takes a handful of patterns. Anything finer would
 * be guessing at strings the browsers themselves are busy freezing.
 */
export interface ClientProfile {
  device: "mobile" | "tablet" | "desktop" | "bot" | null;
  os: string | null;
  browser: string | null;
}

const BOT = /(bot|crawler|spider|crawling|facebookexternalhit|slurp|bingpreview|headlesschrome|lighthouse|gtmetrix|pingdom)/i;

export function parseUserAgent(ua: string | null): ClientProfile {
  if (!ua) return { device: null, os: null, browser: null };

  if (BOT.test(ua)) return { device: "bot", os: null, browser: null };

  // iPadOS reports itself as a Mac, so the tablet test has to come before the
  // desktop one and lean on the touch-capable Macintosh signature.
  const isTablet = /iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const isMobile = !isTablet && /(Android|iPhone|iPod|Mobile|Windows Phone)/i.test(ua);
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let os: string | null = null;
  if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  // Chrome's token appears in almost every other engine's string, so the
  // impostors have to be ruled out first, longest-lived alias last.
  let browser: string | null = null;
  if (/Edg[A-Z]?\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/YaBrowser/i.test(ua)) browser = "Yandex";
  else if (/Firefox|FxiOS/i.test(ua)) browser = "Firefox";
  else if (/Chrome|CriOS/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua)) browser = "Safari";

  return { device, os, browser };
}
