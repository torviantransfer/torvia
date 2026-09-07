import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { buildRedirects } from "./src/lib/redirects";

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
  // Every rule lives in src/lib/redirects.ts so sitemap.ts can read the same
  // list and stop submitting URLs that redirect away. See the note there.
  async redirects() {
    return buildRedirects();
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
              // gtag.js (GA4 + Google Ads conversion tracking) loads a secondary
              // script from googleads.g.doubleclick.net and pings several more
              // google.com/doubleclick.net endpoints for beacons/pixels — without
              // these, both GA4 and Google Ads conversions are silently dropped by
              // the browser (visible as CSP violation errors in devtools, not as
              // any app-level failure).
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdnjs.cloudflare.com https://www.googletagmanager.com https://googleads.g.doubleclick.net https://connect.facebook.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              // Google Ads drops its remarketing-audience pixel on
              // ad.doubleclick.net and on the visitor's local Google ccTLD, so
              // those are listed per market we run ads in — CSP has no wildcard
              // for a suffix like "www.google.*". Missing them does not break
              // conversions, but the audience lists stay empty.
              "img-src 'self' data: blob: https://ximlobdcblinqtlizwrz.supabase.co https://*.supabase.co https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://www.facebook.com https://www.google-analytics.com https://www.google.com https://www.google.com.tr https://www.google.de https://www.google.nl https://www.google.pl https://www.google.ru https://www.google.co.uk https://googleads.g.doubleclick.net https://ad.doubleclick.net https://maps.gstatic.com https://maps.googleapis.com https://*.googleapis.com https://api.qrserver.com",
              "connect-src 'self' https://ximlobdcblinqtlizwrz.supabase.co https://api.stripe.com https://*.google-analytics.com https://analytics.google.com https://www.google.com https://www.google.com.tr https://www.google.de https://www.google.nl https://www.google.pl https://www.google.ru https://www.google.co.uk https://www.googletagmanager.com https://googleads.g.doubleclick.net https://ad.doubleclick.net https://stats.g.doubleclick.net https://www.facebook.com https://router.project-osrm.org https://maps.googleapis.com",
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
