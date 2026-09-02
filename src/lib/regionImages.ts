/**
 * Region hero/social photos, keyed by the bare region slug (no "-transfer").
 *
 * The files are not named after their slug — belek is belek-golf.jpg, side is
 * side-ancient.jpg — so anything that needs a region's picture has to read
 * this map rather than guess. It lives in lib/ because three consumers need
 * it: the region page body, that page's metadata and JSON-LD, and the image
 * sitemap, which previously emitted region URLs with no <image:loc> at all.
 */
export const regionImages: Record<string, string> = {
  belek: "/images/regions/belek-golf.jpg",
  kemer: "/images/regions/kemer-coast.webp",
  "kundu-lara": "/images/regions/kundu-lara.jpg",
  sehirici: "/images/regions/sehirici.jpg",
  alanya: "/images/regions/alanya-castle.jpg",
  side: "/images/regions/side-ancient.jpg",
  kadriye: "/images/regions/kadriye.jpg",
  bogazkent: "/images/regions/bogazkent.jpg",
  evrenseki: "/images/regions/evrenseki.jpg",
  kizilagac: "/images/regions/kizilagac.jpg",
  okurcalar: "/images/regions/okurcalar.jpg",
  turkler: "/images/regions/turkler.jpg",
  mahmutlar: "/images/regions/mahmutlar.jpg",
  kargicak: "/images/regions/kargicak.jpg",
  beldibi: "/images/regions/beldibi.jpg",
  goynuk: "/images/regions/goynuk-canyon.jpg",
  tekirova: "/images/regions/tekirova.jpg",
  camyuva: "/images/regions/camyuva.jpg",
  kiris: "/images/regions/kiris.jpg",
  adrasan: "/images/regions/adrasan.jpg",
  kas: "/images/regions/kas-beach.webp",
  kalkan: "/images/regions/kalkan.jpg",
  fethiye: "/images/regions/fethiye.jpg",
  marmaris: "/images/regions/marmaris.jpg",
  // Restored by migration 056. manavgat-waterfall.jpg was already in the repo
  // but unreferenced — the region row it belonged to had been deleted.
  manavgat: "/images/regions/manavgat-waterfall.jpg",
  // Konyaaltı has no photo of its own yet; the marina sits at the Konyaaltı
  // end of the same shoreline, so it is a truthful stand-in until one is added.
  konyaalti: "/images/regions/antalya-marina.jpg",
};

/**
 * Social-preview replacements for the two regions whose photo is a .webp.
 * Both are 1200x630 JPGs, matching the dimensions the og:image tags declare.
 * Only metadata reads this — the rendered page still uses `regionImages`.
 */
export const ogImageOverrides: Record<string, string> = {
  kemer: "/images/regions/kemer-coast-og.jpg",
  kas: "/images/regions/kas-beach-og.jpg",
};


/**
 * The picture to render in the page body, as a path.
 *
 * `dbPath` is the region row's own image_url, which an admin can now set.
 * When it is empty the hardcoded map above is used, so a database that has
 * not been migrated yet — or a region whose row was never edited — keeps
 * exactly the photo it has today.
 */
export function regionImagePath(slug: string, dbPath?: string | null): string | null {
  const own = dbPath?.trim();
  if (own) return own;
  return regionImages[slug] ?? null;
}

/**
 * The picture social crawlers and structured data should use, as a path.
 * Prefers the row's dedicated og image, then its main image, then the
 * hardcoded overrides, then the hardcoded map.
 */
export function regionSocialImagePath(
  slug: string,
  dbOgPath?: string | null,
  dbPath?: string | null
): string | null {
  const og = dbOgPath?.trim();
  if (og) return og;
  const own = dbPath?.trim();
  if (own) return own;
  return ogImageOverrides[slug] ?? regionImages[slug] ?? null;
}

/** Absolute, crawlable URL of a region's best available picture. */
export function regionImageUrl(
  slug: string,
  baseUrl: string,
  dbOgPath?: string | null,
  dbPath?: string | null
): string | null {
  const path = regionSocialImagePath(slug, dbOgPath, dbPath);
  return path ? (/^https?:\/\//i.test(path) ? path : `${baseUrl}${path}`) : null;
}
