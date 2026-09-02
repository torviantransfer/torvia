import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";

/**
 * Purges the Next.js cache for whatever an admin write just changed.
 *
 * Without this the admin is a write-only form: a corrected meta description
 * lands in the database, the editor sees it, and the live page keeps serving
 * the cached old one until the next deploy — which is exactly the problem
 * moving the copy out of the code was meant to solve.
 *
 * Called from /api/admin/crud, a Route Handler, so paths are *marked* for
 * revalidation and rebuilt on the next visit rather than rebuilt on the spot.
 * That is the right trade here: an editor saving six languages of a region
 * should not pay for thirty page rebuilds, and the first visitor after the
 * save gets fresh content either way.
 */
export async function revalidateForTable(
  table: string,
  row: Record<string, unknown> | null
): Promise<void> {
  try {
    for (const path of pathsFor(table, row)) {
      revalidatePath(path, path.includes("[") ? "page" : undefined);
    }
  } catch (err) {
    // A cache purge failing must never turn a successful save into an error
    // response — the data is already written, and the worst case is stale
    // content until the next deploy.
    console.error("revalidateForTable failed", { table, err });
  }
}

function pathsFor(table: string, row: Record<string, unknown> | null): string[] {
  const all = [...locales];

  switch (table) {
    case "seo_pages": {
      const route = typeof row?.route === "string" ? row.route : null;
      // A page_key with no route (or a delete, where there is no row) can
      // affect any of them, so fall back to the whole locale tree.
      if (route === null) return all.map((l) => `/${l}`);
      return all.map((l) => (route ? `/${l}/${route}` : `/${l}`));
    }

    case "regions": {
      const slug = typeof row?.slug === "string" ? row.slug : null;
      const paths: string[] = [];
      for (const l of all) {
        // The regions index and the homepage both list regions, so a rename
        // or a new photo has to purge those too, not just the detail page.
        paths.push(`/${l}`, `/${l}/regions`);
        if (slug) {
          paths.push(`/${l}/${slug.endsWith("-transfer") ? slug : `${slug}-transfer`}`);
        }
      }
      // Sibling region pages cross-link to each other, so a rename is visible
      // on up to six other pages. Purging the whole dynamic segment is cheaper
      // to reason about than working out which six -- and since this is a
      // Route Handler, unvisited pages cost nothing until someone asks for one.
      paths.push("/[locale]/[region]");
      paths.push("/sitemap.xml");
      return paths;
    }

    case "blog_posts": {
      const paths: string[] = [];
      for (const l of all) paths.push(`/${l}/blog`);
      // Localised slugs mean one post has six different URLs; the pattern
      // covers them all without reconstructing each.
      paths.push("/[locale]/blog/[slug]");
      paths.push("/sitemap.xml");
      return paths;
    }

    case "reviews": {
      // Reviews feed the rating on the homepage and on every region page.
      const paths = all.map((l) => `/${l}`);
      paths.push("/[locale]/[region]");
      return paths;
    }

    case "pricing":
    case "vehicle_categories":
    case "vehicles":
    case "exchange_rates": {
      // Prices appear on the homepage, the regions index and every region
      // page, and are the one thing where showing a stale number is worse
      // than the cost of a broad purge.
      const paths = all.flatMap((l) => [`/${l}`, `/${l}/regions`, `/${l}/booking`]);
      paths.push("/[locale]/[region]");
      return paths;
    }

    case "settings":
      // Settings reach the header, footer and contact details site-wide.
      return all.map((l) => `/${l}`);

    default:
      // drivers, coupons, driver_payments and the like never render on a
      // public page, so there is nothing to purge.
      return [];
  }
}
