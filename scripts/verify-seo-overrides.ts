/**
 * Proves the contract the SEO admin panel rests on: a row with no overrides
 * set produces metadata byte-identical to what the page produced before it.
 *
 * Worth keeping runnable rather than checking once by hand, because the two
 * regressions it caught are both easy to reintroduce:
 *
 *  - assigning `next.robots` unconditionally, which puts an explicit
 *    `robots: undefined` on pages that declare none. Next.js reads that as
 *    "unset this field" rather than "inherit", which is exactly how the region
 *    and blog pages lost `max-image-preview: large` and their SERP thumbnails.
 *  - rebuilding `openGraph.images` to change the URL and dropping the `alt`
 *    the page had already set.
 *
 * Run with:  npm run verify:seo
 */
import { applyOverrides } from "../src/lib/seoOverrides";
import type { Metadata } from "next";

let failures = 0;
function check(name: string, before: Metadata, row: Record<string, unknown>) {
  const after = applyOverrides(before, { row, locale: "en" });
  const a = JSON.stringify(before);
  const b = JSON.stringify(after);
  const same = a === b;
  // An explicit `robots: undefined` key is the trap that started all of this,
  // so its presence is asserted separately from deep equality.
  const robotsKeyAdded = !("robots" in before) && "robots" in after;
  const ok = same && !robotsKeyAdded;
  if (!ok) failures++;
  console.log(`${ok ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"}  ${name}`);
  if (!ok) {
    console.log("   önce:", a);
    console.log("   sonra:", b);
    if (robotsKeyAdded) console.log("   \x1b[31mrobots anahtarı eklendi (undefined)\x1b[0m");
  }
}

// A seo_pages row as migration 057/058 seeds it: labels only, no copy.
const emptySeoPage = {
  id: "1", page_key: "about", page_type: "static", route: "about", label: "Hakkımızda",
  meta_title_en: null, meta_description_en: null, canonical_url_en: null,
  og_title_en: null, og_description_en: null, og_image_url: null,
  twitter_title_en: null, twitter_description_en: null, twitter_image_url: null,
  twitter_card: null, image_url: null, image_alt: null, noindex: null, nofollow: null,
};

check("statik sayfa — robots yok, override yok", {
  title: "Hakkımızda | TORVIAN",
  description: "Bir açıklama",
  alternates: { canonical: "https://torviantransfer.com/en/about" },
  openGraph: { title: "Hakkımızda", images: [{ url: "https://torviantransfer.com/images/og-default.jpg", width: 1200, height: 630, alt: "Hakkımızda" }] },
}, emptySeoPage);

check("landing — twitter da var", {
  title: "VIP Transfer",
  description: "d",
  alternates: { canonical: "https://torviantransfer.com/en/vip-transfer-antalya", languages: { en: "x" } },
  openGraph: { title: "VIP", description: "d", images: [{ url: "https://x/i.jpg", width: 1200, height: 630, alt: "VIP" }] },
  twitter: { card: "summary_large_image", title: "VIP", description: "d", images: ["https://x/i.jpg"] },
}, emptySeoPage);

// A region row after 057's backfill: image_url IS populated from the code map.
check("bölge — image_url backfill dolu, alt korunmalı", {
  title: "Belek Transfer",
  description: "d",
  alternates: { canonical: "https://torviantransfer.com/en/belek-transfer" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  openGraph: { title: "Belek", description: "d", images: [{ url: "https://torviantransfer.com/images/regions/belek-golf.jpg", width: 1200, height: 630, alt: "Belek Transfer" }] },
  twitter: { card: "summary_large_image", title: "Belek", description: "d", images: ["https://torviantransfer.com/images/regions/belek-golf.jpg"] },
} as Metadata, {
  id: "2", slug: "belek", image_url: "/images/regions/belek-golf.jpg",
  og_image_url: null, image_alt: null, noindex: null, nofollow: null,
  meta_title_en: null, meta_description_en: null, canonical_url_en: null,
});

// A blog post: image_url populated, excerpt-driven description.
check("blog — image_url dolu, alt korunmalı", {
  title: "Side Ancient City",
  description: "d",
  alternates: { canonical: "https://torviantransfer.com/en/blog/side" },
  robots: { index: true, follow: true },
  openGraph: { title: "Side", description: "d", images: [{ url: "https://torviantransfer.com/images/blog/side-temple.avif", width: 1200, height: 630, alt: "Side Ancient City" }] },
  twitter: { card: "summary_large_image", title: "Side", description: "d", images: ["https://torviantransfer.com/images/blog/side-temple.avif"] },
} as Metadata, {
  id: "3", slug: "side", image_url: "https://torviantransfer.com/images/blog/side-temple.avif",
  og_image_url: null, image_alt: null, noindex: null, nofollow: null,
});

console.log("\n--- override GİRİLDİĞİNDE değişmeli ---");
const withOverride = applyOverrides(
  { title: "Eski", description: "eski", alternates: { canonical: "https://torviantransfer.com/en/about" } },
  { row: { ...emptySeoPage, meta_title_en: "Yeni başlık", noindex: true }, locale: "en" }
);
const changed = withOverride.title === "Yeni başlık" && withOverride.robots !== undefined;
console.log(`${changed ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"}  override uygulanıyor`);
if (!changed) failures++;

console.log(`\n${failures === 0 ? "\x1b[32mTÜM KONTROLLER GEÇTİ\x1b[0m" : `\x1b[31m${failures} KONTROL BAŞARISIZ\x1b[0m`}`);
process.exit(failures === 0 ? 0 : 1);
