export const locales = ["tr", "en", "de", "pl", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  pl: "Polski",
  ru: "Русский",
};

export const localeFlags: Record<Locale, string> = {
  tr: "TR",
  en: "EN",
  de: "DE",
  pl: "PL",
  ru: "RU",
};

export const currencies = ["USD", "EUR", "TRY"] as const;
export type Currency = (typeof currencies)[number];

export const currencySymbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  TRY: "₺",
};
