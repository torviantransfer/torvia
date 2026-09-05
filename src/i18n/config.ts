export const locales = ["tr", "en", "de", "pl", "ru", "nl", "ro"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/**
 * Locales that have their own copy on the five landing pages which hold their
 * text inline rather than in a messages namespace: antalya-airport-transfer,
 * hotel-transfer-antalya, vip-transfer-antalya, land-of-legends-transfer and
 * lara-beach-transfer.
 *
 * Those pages fall back to English for anything not listed here, so a locale
 * added to this list without its copy being written publishes an English page
 * under an hreflang tag claiming another language — which is a duplicate of
 * the English one, submitted to Google as if it were not. The pages are
 * noindex outside this list and the sitemap leaves them out, mirroring what
 * the region pages already do with their own per-locale columns.
 *
 * Add a locale here in the same commit that writes its copy, never before.
 */
export const inlineCopyLocales: readonly Locale[] = ["tr", "en", "de", "pl", "ru", "nl"];

export const localeNames: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  pl: "Polski",
  ru: "Русский",
  nl: "Nederlands",
  ro: "Română",
};

export const localeFlags: Record<Locale, string> = {
  tr: "TR",
  en: "EN",
  de: "DE",
  pl: "PL",
  ru: "RU",
  nl: "NL",
  ro: "RO",
};

/**
 * BCP 47 tags for <html lang>, hreflang and Open Graph.
 * Kept next to the locale list so a new language can never be added
 * without also declaring how search engines should label it.
 */
export const localeOgTags: Record<Locale, string> = {
  tr: "tr_TR",
  en: "en_US",
  de: "de_DE",
  pl: "pl_PL",
  ru: "ru_RU",
  nl: "nl_NL",
  ro: "ro_RO",
};

export const currencies = ["USD", "EUR", "TRY"] as const;
export type Currency = (typeof currencies)[number];

export const currencySymbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  TRY: "₺",
};

/**
 * Currency shown by default for each locale, so a visitor sees prices in the
 * money they actually think in instead of always starting from USD. An
 * explicit pick in the currency selector is remembered and always wins.
 *
 * Poland uses PLN and Russia RUB, neither of which we price in — EUR and USD
 * are the currencies those markets are most used to seeing for travel.
 */
export const localeCurrencies: Record<Locale, Currency> = {
  tr: "TRY",
  en: "EUR",
  de: "EUR",
  nl: "EUR",
  pl: "EUR",
  ru: "USD",
  ro: "EUR",
};
