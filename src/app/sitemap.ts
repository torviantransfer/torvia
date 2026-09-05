import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { localizedBlogSlug } from "@/lib/seo";
import { regionImageUrl } from "@/lib/regionImages";
import { locales as ALL_LOCALES } from "@/i18n/config";

const BASE_URL = "https://torviantransfer.com";
const locales: readonly string[] = ALL_LOCALES;

// Google's image sitemap spec requires <image:loc> to be a fully-qualified
// absolute URL. image_url values stored in the DB are relative paths
// (e.g. "/images/regions/alanya-castle.jpg"), so they must be resolved
// against BASE_URL before being emitted, otherwise GSC reports them as
// "Invalid URL" ("Site haritası okunabiliyor, ancak hataları var").
function absoluteImageUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

// Primary locales get full priority, secondary locales get reduced priority
const primaryLocales = ["en", "tr", "de"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = createAdminClient();
  const { data: regions } = await supabase
    .from("regions")
    .select("slug, is_popular, image_url, og_image_url, description_de, description_pl, description_ru, description_nl, description_ro, meta_title_de, meta_title_pl, meta_title_ru, meta_title_nl, meta_title_ro")
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
    .select("slug, published_at, updated_at, image_url, title_tr, title_en, title_de, title_pl, title_ru, title_nl, title_ro, content_tr, content_en, content_de, content_pl, content_ru, content_nl, content_ro, slug_tr, slug_en, slug_de, slug_pl, slug_ru, slug_nl, slug_ro")
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
    // Head-term hub for "Antalya Airport Transfer" — links out to every
    // region page, so it ranks just under the booking flow itself.
    { path: "antalya-airport-transfer", priority: 0.95 },
    { path: "regions", priority: 0.9 },
    { path: "land-of-legends-transfer", priority: 0.9 },
    { path: "vip-transfer-antalya", priority: 0.9 },
    { path: "hotel-transfer-antalya", priority: 0.9 },
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
      // Region pages render their photo exclusively through next/image, so the
      // only URL in the HTML is the /_next/image proxy — the underlying file is
      // never named anywhere Googlebot-Image can find it. Declaring it here is
      // what actually gets these photos into Google Images.
      const regionImg = regionImageUrl(
        region.slug.replace(/-transfer$/, ""),
        BASE_URL,
        region.og_image_url as string | null,
        region.image_url as string | null
      );
      entries.push({
        url: `${BASE_URL}/${locale}/${regionPath}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: isPopular && isPrimary ? 0.9 : isPopular ? 0.7 : isPrimary ? 0.6 : 0.4,
        ...(regionImg ? { images: [regionImg] } : {}),
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
        url: `${BASE_URL}/${locale}/blog/${localizedBlogSlug(
          post as Record<string, unknown>,
          locale
        )}`,
        lastModified: post.updated_at
          ? new Date(post.updated_at)
          : post.published_at
            ? new Date(post.published_at)
            : new Date(),
        changeFrequency: "monthly",
        priority: isPrimary ? 0.7 : 0.5,
        ...(postImage ? { images: [absoluteImageUrl(postImage)] } : {}),
      });
    }
  }

  return entries;
}
