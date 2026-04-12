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
    ],
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
              "img-src 'self' data: blob: https://ximlobdcblinqtlizwrz.supabase.co https://*.supabase.co https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://www.facebook.com https://www.google-analytics.com https://maps.gstatic.com https://maps.googleapis.com https://*.googleapis.com",
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
