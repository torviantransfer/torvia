import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const BASE_URL = "https://torviantransfer.com";
const locales = ["tr", "en", "de", "pl", "ru"];

// Primary locales get full priority, secondary locales get reduced priority
const primaryLocales = ["en", "tr", "de"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = createAdminClient();
  const { data: regions } = await supabase
    .from("regions")
    .select("slug, is_popular")
    .eq("is_active", true);

  const { data: blogPosts } = await supabase
    .from("blog_posts")
    .select("slug, published_at")
    .eq("is_published", true);

  const entries: MetadataRoute.Sitemap = [];

  // Homepage for each locale
  for (const locale of locales) {
    entries.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    });
  }

  // Static pages
  const staticPages = [
    { path: "about", priority: 0.7 },
    { path: "contact", priority: 0.8 },
    { path: "faq", priority: 0.7 },
    { path: "regions", priority: 0.9 },
    { path: "blog", priority: 0.7 },
    { path: "land-of-legends-transfer", priority: 0.9 },
    { path: "privacy", priority: 0.3 },
    { path: "terms", priority: 0.3 },
    { path: "cookies", priority: 0.2 },
    { path: "cancellation", priority: 0.4 },
  ];
  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}/${page.path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: page.priority,
      });
    }
  }

  // Region pages — popular regions get higher priority, primary locales first
  for (const locale of locales) {
    const isPrimary = primaryLocales.includes(locale);
    for (const region of regions ?? []) {
      const isPopular = region.is_popular === true;
      entries.push({
        url: `${BASE_URL}/${locale}/${region.slug}-transfer`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: isPopular && isPrimary ? 0.9 : isPopular ? 0.7 : isPrimary ? 0.6 : 0.4,
      });
    }
  }

  // Blog posts — primary locales get higher priority
  for (const locale of locales) {
    const isPrimary = primaryLocales.includes(locale);
    for (const post of blogPosts ?? []) {
      entries.push({
        url: `${BASE_URL}/${locale}/blog/${post.slug}`,
        lastModified: post.published_at ? new Date(post.published_at) : new Date(),
        changeFrequency: "monthly",
        priority: isPrimary ? 0.7 : 0.5,
      });
    }
  }

  return entries;
}
