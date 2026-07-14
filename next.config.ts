import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    qualities: [75, 80],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ximlobdcblinqtlizwrz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
  },
  async redirects() {
    const locales = ["tr", "en", "de", "pl", "ru"];
    // Known region slugs — redirect bare slug to slug-transfer
    const regionSlugs = [
      "belek", "side", "alanya", "kemer", "konyaalti", "kundu", "lara",
      "kundu-lara", "manavgat", "kas", "kalkan", "fethiye", "marmaris",
      "beldibi", "goynuk", "tekirova", "camyuva", "olympos", "adrasan",
      "demre", "finike", "kumluca", "gazipasa", "okurcalar", "turkler",
      "avsallar", "konakli", "mahmutlar", "kestel", "antalya-city-center",
      "kadriye", "bogazkent", "evrenseki", "kizilagac", "kargicak", "kiris",
    ];
    const rules: { source: string; destination: string; permanent: boolean }[] = [];
    for (const locale of locales) {
      for (const slug of regionSlugs) {
        rules.push({
          source: `/${locale}/${slug}`,
          destination: `/${locale}/${slug}-transfer`,
          permanent: true,
        });
        rules.push({
          source: `/${locale}/${slug}-transfer-transfer`,
          destination: `/${locale}/${slug}-transfer`,
          permanent: true,
        });
      }
    }
    // Land of Legends alternative URL forms
    for (const locale of locales) {
      rules.push(
        { source: `/${locale}/land-of-legends`, destination: `/${locale}/land-of-legends-transfer`, permanent: true },
        { source: `/${locale}/landoflegends-transfer`, destination: `/${locale}/land-of-legends-transfer`, permanent: true },
        { source: `/${locale}/land-of-legends-belek`, destination: `/${locale}/land-of-legends-transfer`, permanent: true },
        { source: `/${locale}/land-of-legends-transfer-transfer`, destination: `/${locale}/land-of-legends-transfer`, permanent: true },
      );
    }
    // Locale-less region URLs (e.g. /alanya-transfer) currently fall through
    // to next-intl middleware, which issues a 307 (temporary) redirect to
    // /en/alanya-transfer. A temporary redirect keeps BOTH URLs indexed in
    // Search Console, splitting ranking signals (duplicate content). Emit an
    // explicit 308 (permanent) redirect so Google consolidates to the canonical
    // /en/ version. Only the 24 seeded ACTIVE regions are listed here — their
    // /en/{slug}-transfer target is guaranteed to return 200. (The broader
    // regionSlugs array above intentionally is NOT reused: it contains slugs
    // like "lara"/"kundu" whose /en/{slug}-transfer would 404, since the active
    // region is "kundu-lara".)
    const activeRegionSlugs = [
      "kundu-lara", "sehirici", "kadriye", "belek", "bogazkent", "evrenseki",
      "side", "kizilagac", "okurcalar", "turkler", "alanya", "mahmutlar",
      "kargicak", "beldibi", "goynuk", "kemer", "kiris", "camyuva", "tekirova",
      "adrasan", "kas", "kalkan", "fethiye", "marmaris",
    ];
    for (const slug of activeRegionSlugs) {
      rules.push({
        source: `/${slug}-transfer`,
        destination: `/en/${slug}-transfer`,
        permanent: true,
      });
    }
    // Blog consolidation — posts unpublished by migration 030 return 200 today
    // (static build not yet redeployed) but will 404 on the next deploy, throwing
    // away their accumulated ranking signal. 301-redirect each dead post to its
    // surviving sibling so the equity is preserved. Only clusters where the KEPT
    // post is the stronger performer in Search Console are listed here:
    //   • Kemer  → kept `antalya-kemer-transfer-mesafe-sure` (pos ~5, 900+ impr)
    //   • Taxi   → kept `antalya-havalimani-taksi-mi-vip-transfer-mi`
    // Alanya cluster: migration 037 (already applied) re-published the stronger page
    // Google ranks (`antalya-havalimani-alanya-transfer-kac-saat`, pos 9.4, 2798 impr)
    // and unpublished the weaker `antalya-alanya-transfer-suresi`; this 301 forwards
    // the weaker URL's equity to the winner.
    const blogConsolidation: Record<string, string> = {
      "antalya-havalimani-kemer-transfer": "antalya-kemer-transfer-mesafe-sure",
      "antalya-havalimani-kemer-vip-transfer": "antalya-kemer-transfer-mesafe-sure",
      "antalya-taksi-mi-ozel-transfer-mi": "antalya-havalimani-taksi-mi-vip-transfer-mi",
      "antalya-alanya-transfer-suresi": "antalya-havalimani-alanya-transfer-kac-saat",
    };
    for (const locale of locales) {
      for (const [oldSlug, newSlug] of Object.entries(blogConsolidation)) {
        rules.push({
          source: `/${locale}/blog/${oldSlug}`,
          destination: `/${locale}/blog/${newSlug}`,
          permanent: true,
        });
      }
    }
    // Redirect bare (locale-less) blog/page paths to default locale
    rules.push(
      { source: "/blog", destination: "/en/blog", permanent: true },
      { source: "/blog/:slug*", destination: "/en/blog/:slug*", permanent: true },
      { source: "/faq", destination: "/en/faq", permanent: true },
      { source: "/about", destination: "/en/about", permanent: true },
      { source: "/contact", destination: "/en/contact", permanent: true },
      { source: "/regions", destination: "/en/regions", permanent: true },
      // Additional locale-less paths — ensure 308 permanent (not 307 from middleware)
      { source: "/terms", destination: "/en/terms", permanent: true },
      { source: "/privacy", destination: "/en/privacy", permanent: true },
      { source: "/cookies", destination: "/en/cookies", permanent: true },
      { source: "/cancellation", destination: "/en/cancellation", permanent: true },
      { source: "/land-of-legends-transfer", destination: "/en/land-of-legends-transfer", permanent: true },
      { source: "/track", destination: "/en/track", permanent: true },
    );
    return rules;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdnjs.cloudflare.com https://www.googletagmanager.com https://connect.facebook.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://ximlobdcblinqtlizwrz.supabase.co https://*.supabase.co https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://www.facebook.com https://www.google-analytics.com https://maps.gstatic.com https://maps.googleapis.com https://*.googleapis.com https://api.qrserver.com",
              "connect-src 'self' https://ximlobdcblinqtlizwrz.supabase.co https://api.stripe.com https://*.google-analytics.com https://www.googletagmanager.com https://stats.g.doubleclick.net https://www.facebook.com https://router.project-osrm.org https://maps.googleapis.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com https://www.google.com https://maps.google.com https://www.google.com.tr",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
