import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeSlug } from "@/lib/seo";

const BASE_URL = "https://torviantransfer.com";
const locales = ["tr", "en", "de", "pl", "ru"];

// Primary locales get full priority, secondary locales get reduced priority
const primaryLocales = ["en", "tr", "de"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = createAdminClient();
  const { data: regions } = await supabase
    .from("regions")
    .select("slug, is_popular, description_de, description_pl, description_ru, meta_title_de, meta_title_pl, meta_title_ru")
    .eq("is_active", true);

  // Mirror the region page's translation logic: tr/en are always indexed;
  // de/pl/ru are only indexable when the DB actually has translated content.
  // Emitting a locale in the sitemap that the page marks noindex causes the
  // Search Console "Submitted URL marked 'noindex'" error, so keep them in sync.
  const primaryLocalesForRegion = ["tr", "en"];
  const regionHasLocale = (region: Record<string, unknown>, locale: string) => {
    if (primaryLocalesForRegion.includes(locale)) return true;
    const desc = (region[`description_${locale}`] as string | null) ?? "";
    const mt = (region[`meta_title_${locale}`] as string | null) ?? "";
    return desc.trim().length > 0 || mt.trim().length > 0;
  };

  const { data: blogPosts } = await supabase
    .from("blog_posts")
    .select("slug, published_at, image_url, title_tr, title_en, title_de, title_pl, title_ru, content_tr, content_en, content_de, content_pl, content_ru")
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
    // Conversion pages — highest priority after homepage
    { path: "booking", priority: 0.95 },
    { path: "regions", priority: 0.9 },
    { path: "land-of-legends-transfer", priority: 0.9 },
    // Support + info pages
    { path: "contact", priority: 0.8 },
    { path: "faq", priority: 0.7 },
    { path: "about", priority: 0.7 },
    { path: "blog", priority: 0.7 },
    { path: "lara-beach-transfer", priority: 0.9 },
    // Legal — low priority, no crawl budget waste
    { path: "cancellation", priority: 0.4 },
    { path: "privacy", priority: 0.3 },
    { path: "terms", priority: 0.3 },
    { path: "cookies", priority: 0.2 },
    { path: "kvkk", priority: 0.2 },
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
      // Skip locales this region isn't translated into (matches page noindex).
      if (!regionHasLocale(region as Record<string, unknown>, locale)) continue;
      const isPopular = region.is_popular === true;
      const regionPath = region.slug.endsWith("-transfer") ? region.slug : `${region.slug}-transfer`;
      entries.push({
        url: `${BASE_URL}/${locale}/${regionPath}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: isPopular && isPrimary ? 0.9 : isPopular ? 0.7 : isPrimary ? 0.6 : 0.4,
      });
    }
  }

  // Blog posts — only emit URLs for locales that actually have a translated
  // title + content. This prevents Search Console "duplicate without
  // canonical" reports caused by untranslated posts. Slugs are normalized
  // to ASCII for clean canonical URLs.
  for (const locale of locales) {
    const isPrimary = primaryLocales.includes(locale);
    for (const post of blogPosts ?? []) {
      const title = (post[`title_${locale}` as keyof typeof post] as string | null) ?? "";
      const content = (post[`content_${locale}` as keyof typeof post] as string | null) ?? "";
      if (!title.trim() || !content.trim()) continue;
      const postImage = post.image_url as string | null;
      entries.push({
        url: `${BASE_URL}/${locale}/blog/${normalizeSlug(post.slug)}`,
        lastModified: post.published_at ? new Date(post.published_at) : new Date(),
        changeFrequency: "monthly",
        priority: isPrimary ? 0.7 : 0.5,
        ...(postImage ? { images: [postImage] } : {}),
      });
    }
  }

  return entries;
}
