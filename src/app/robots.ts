import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/driver/",
          "/*/booking/",
          "/*/booking/success",
          "/*/booking/cancel",
          "/*/account/",
          "/*/track",
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
