import { locales } from "../i18n/config";

/**
 * Every permanent redirect the site declares, in one place.
 *
 * It used to live entirely inside `next.config.ts`, which meant `sitemap.ts`
 * had no way to know that a URL it was about to submit would 308 away. That is
 * not hypothetical: `/tr/blog/antalya-alanya-transfer-suresi` has been listed
 * in sitemap.xml and redirected by next.config at the same time — the exact
 * shape of Search Console's "Submitted URL has redirect".
 *
 * Imported from `next.config.ts` by relative path (the `@/` alias is not
 * available there), so this module and everything it imports must stay free of
 * aliases and of anything that only exists at request time.
 */

export interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
}

/**
 * Region slugs that have ever been linked without the `-transfer` suffix.
 * Wider than the active list on purpose: these are historical URLs, and a slug
 * dropping out of the regions table does not un-publish the links to it.
 */
export const LEGACY_REGION_SLUGS = [
  "belek", "side", "alanya", "kemer", "konyaalti", "kundu", "lara",
  "kundu-lara", "manavgat", "kas", "kalkan", "fethiye", "marmaris",
  "beldibi", "goynuk", "tekirova", "camyuva", "olympos", "adrasan",
  "demre", "finike", "kumluca", "gazipasa", "okurcalar", "turkler",
  "avsallar", "konakli", "mahmutlar", "kestel", "antalya-city-center",
  "kadriye", "bogazkent", "evrenseki", "kizilagac", "kargicak", "kiris",
];

/**
 * Locale-less region URLs (e.g. `/alanya-transfer`) fall through to the
 * next-intl middleware, which issues a 307. A temporary redirect keeps both
 * URLs indexed and splits the ranking signal, so these get an explicit 308.
 *
 * Only slugs whose `/en/{slug}-transfer` target is guaranteed to answer 200 are
 * listed — `LEGACY_REGION_SLUGS` deliberately is not reused, because it holds
 * slugs like "lara" and "kundu" whose region is actually "kundu-lara".
 */
export const ACTIVE_REGION_SLUGS = [
  "kundu-lara", "sehirici", "kadriye", "belek", "bogazkent", "evrenseki",
  "side", "kizilagac", "okurcalar", "turkler", "alanya", "mahmutlar",
  "kargicak", "beldibi", "goynuk", "kemer", "kiris", "camyuva", "tekirova",
  "adrasan", "kas", "kalkan", "fethiye", "marmaris",
];

/**
 * Blog posts consolidated into a stronger sibling, where the two share one
 * slug across every language.
 *
 * Only clusters where the KEPT post is the better performer in Search Console:
 *   • Kemer  → kept `antalya-kemer-transfer-mesafe-sure` (pos ~5, 900+ impr)
 *   • Taxi   → kept `antalya-havalimani-taksi-mi-vip-transfer-mi`
 *   • Alanya → kept `antalya-havalimani-alanya-transfer-kac-saat` (pos 9.4, 2798 impr)
 */
export const BLOG_CONSOLIDATION: Record<string, string> = {
  "antalya-havalimani-kemer-transfer": "antalya-kemer-transfer-mesafe-sure",
  "antalya-havalimani-kemer-vip-transfer": "antalya-kemer-transfer-mesafe-sure",
  "antalya-taksi-mi-ozel-transfer-mi": "antalya-havalimani-taksi-mi-vip-transfer-mi",
  "antalya-alanya-transfer-suresi": "antalya-havalimani-alanya-transfer-kac-saat",
  // Abandoned original (dotless "ı") of the maintained uber post; unpublished
  // in migration 050. Forward its equity to the "i" version Google indexes.
  "uber-antalya-havalimanı-ulasim": "uber-antalya-havalimani-ulasim",
};

/**
 * The same consolidation, for posts that carry a different slug per language.
 *
 * The Alanya travel-time pair is the case that made this necessary. Migration
 * 037 was written to unpublish the weaker post, and the shared-slug map above
 * covers its Turkish URL — but the post also has en/de/pl/ru/nl slugs of its
 * own, none of which the Turkish rule matches. Those five pages stayed live,
 * indexable and in the sitemap, competing head-to-head with the five
 * translations of the post that was supposed to win:
 *
 *   /en/blog/antalya-to-alanya-travel-time      "Antalya to Alanya: 130 km and About 2 Hours by Road"
 *   /en/blog/antalya-airport-to-alanya-transfer-time  "Antalya Airport to Alanya Transfer Time: 2 Hours, 130 km"
 *
 * Same query, same numbers, two URLs. Redirecting the loser's translations is
 * what actually finishes the consolidation the migration started.
 */
export const LOCALIZED_BLOG_CONSOLIDATION: Record<string, Record<string, string>> = {
  en: {
    "antalya-to-alanya-travel-time": "antalya-airport-to-alanya-transfer-time",
  },
  de: {
    "fahrzeit-antalya-nach-alanya": "antalya-flughafen-nach-alanya-fahrzeit",
  },
  pl: {
    "antalya-alanya-czas-przejazdu": "transfer-lotnisko-antalya-alanya-ile-trwa",
  },
  ru: {
    "antaliya-alaniya-vremya-v-puti": "skolko-ehat-ot-aeroporta-antalii-do-alanii",
  },
  nl: {
    "reistijd-antalya-naar-alanya": "hoe-lang-duurt-transfer-antalya-alanya",
  },
};

/**
 * The blog slugs that redirect away in a given locale.
 *
 * `sitemap.ts` calls this to drop them, so a post that is still flagged
 * published in the database cannot be submitted to Google at a URL that
 * answers 308. The database is the thing that should really change — see
 * `supabase/migrations/071_consolidate_alanya_duration_posts.sql` — but the
 * sitemap must be correct either way, and it must stay correct if a future
 * consolidation is added here and the migration is written a week later.
 */
export function redirectedBlogSlugs(locale: string): Set<string> {
  return new Set([
    ...Object.keys(BLOG_CONSOLIDATION),
    ...Object.keys(LOCALIZED_BLOG_CONSOLIDATION[locale] ?? {}),
  ]);
}

/** The route a locale-less path 308s to, keyed by the bare path. */
const LOCALE_LESS_PAGES = [
  "blog", "faq", "about", "contact", "regions", "terms", "privacy",
  "cookies", "cancellation", "land-of-legends-transfer",
  // Head-term hub. Not covered by ACTIVE_REGION_SLUGS — "antalya-airport" is
  // deliberately not a region, because every transfer starts at the airport.
  "antalya-airport-transfer",
  "track",
];

export function buildRedirects(): RedirectRule[] {
  const rules: RedirectRule[] = [];
  const permanent = true;

  for (const locale of locales) {
    for (const slug of LEGACY_REGION_SLUGS) {
      rules.push({ source: `/${locale}/${slug}`, destination: `/${locale}/${slug}-transfer`, permanent });
      rules.push({
        source: `/${locale}/${slug}-transfer-transfer`,
        destination: `/${locale}/${slug}-transfer`,
        permanent,
      });
    }

    // Land of Legends alternative URL forms.
    rules.push(
      { source: `/${locale}/land-of-legends`, destination: `/${locale}/land-of-legends-transfer`, permanent },
      { source: `/${locale}/landoflegends-transfer`, destination: `/${locale}/land-of-legends-transfer`, permanent },
      { source: `/${locale}/land-of-legends-belek`, destination: `/${locale}/land-of-legends-transfer`, permanent },
      { source: `/${locale}/land-of-legends-transfer-transfer`, destination: `/${locale}/land-of-legends-transfer`, permanent }
    );

    for (const [oldSlug, newSlug] of Object.entries(BLOG_CONSOLIDATION)) {
      rules.push({
        source: `/${locale}/blog/${oldSlug}`,
        destination: `/${locale}/blog/${newSlug}`,
        permanent,
      });
    }
    for (const [oldSlug, newSlug] of Object.entries(LOCALIZED_BLOG_CONSOLIDATION[locale] ?? {})) {
      rules.push({
        source: `/${locale}/blog/${oldSlug}`,
        destination: `/${locale}/blog/${newSlug}`,
        permanent,
      });
    }
  }

  for (const slug of ACTIVE_REGION_SLUGS) {
    rules.push({ source: `/${slug}-transfer`, destination: `/en/${slug}-transfer`, permanent });
  }

  rules.push({ source: "/blog/:slug*", destination: "/en/blog/:slug*", permanent });
  for (const page of LOCALE_LESS_PAGES) {
    rules.push({ source: `/${page}`, destination: `/en/${page}`, permanent });
  }

  return rules;
}
