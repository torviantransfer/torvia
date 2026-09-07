import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";

/**
 * Every public URL on this site starts with a locale segment
 * (`localePrefix: "always"` in src/i18n/routing.ts). The rules here used to be
 * written without one — `/admin/`, `/account/`, `/track` — so they matched
 * nothing at all: the real paths are `/tr/admin`, `/de/account`, `/ro/track`.
 * Fourteen admin URLs and seven tracking URLs were crawlable as a result.
 *
 * Expanding them per locale is the only correct form, because robots.txt has
 * no wildcard for "any two-letter prefix" that Google is guaranteed to read
 * the way we mean. Generating the list from `locales` also means a new
 * language cannot be added without its private routes being covered.
 *
 * robots.txt is a crawl directive, not an index directive: a disallowed URL
 * can still be indexed from an external link, with no snippet. So the pages
 * that must stay out of the index also declare `noindex` themselves —
 * src/app/[locale]/admin/layout.tsx, src/app/[locale]/account/layout.tsx and
 * src/app/[locale]/track/page.tsx. This file only saves the crawl budget.
 */
const PRIVATE_ROUTES = ["admin", "account", "track"];

export default function robots(): MetadataRoute.Robots {
  const localePrivate = locales.flatMap((locale) =>
    PRIVATE_ROUTES.map((route) => `/${locale}/${route}`)
  );

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          // `driver` is the one route that is genuinely locale-less
          // (src/app/driver/[token]), so it keeps its bare form.
          "/driver/",
          // The locale-less forms stay: next.config.ts 308-redirects them, and
          // there is no reason to spend crawl budget discovering that.
          ...PRIVATE_ROUTES.map((route) => `/${route}`),
          ...localePrivate,
          // Static assets — no SEO value, reduce crawl budget waste
          "/_next/static/media/",
          "/manifest.json",
        ],
      },
      // Allow Googlebot-Image to crawl images for Google Image Search
      {
        userAgent: "Googlebot-Image",
        allow: "/images/",
      },
    ],
    sitemap: "https://torviantransfer.com/sitemap.xml",
  };
}
