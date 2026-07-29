export const locales = ["tr", "en", "de", "pl", "ru", "nl"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  pl: "Polski",
  ru: "Русский",
  nl: "Nederlands",
};

export const localeFlags: Record<Locale, string> = {
  tr: "TR",
  en: "EN",
  de: "DE",
  pl: "PL",
  ru: "RU",
  nl: "NL",
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
};

export const currencies = ["USD", "EUR", "TRY"] as const;
export type Currency = (typeof currencies)[number];

export const currencySymbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  TRY: "₺",
};
