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
        ],
      },
    ],
    sitemap: "https://torviantransfer.com/sitemap.xml",
  };
}
