import { createAdminClient } from "@/lib/supabase/admin";
import { INDEXABLE_ROBOTS, NOINDEX_ROBOTS } from "@/lib/seo";
import { applyOverrides, ov } from "@/lib/seoOverrides";
import { regionImagePath, regionImageUrl } from "@/lib/regionImages";
import {
  aggregate as aggregateReviews,
  markupEligible,
  MIN_REVIEWS_FOR_SCHEMA,
  authorName,
  forLocale,
  productSchema,
  type ReviewRow,
} from "@/lib/reviews";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import RegionStickyBar from "@/components/region/RegionStickyBar";
import RegionPageView from "@/components/region/RegionPageView";
import { paragraphs, readHotels, readPageContent } from "@/lib/regionContent";
import { turkishNameForms } from "@/lib/trSuffix";
import { aboutDefault, generalFaq, heroIntroDefault, hotelsIntroText } from "@/lib/regionDefaults";
import PriceTag from "@/components/PriceTag";
import { Link } from "@/i18n/routing";
import {
} from "lucide-react";
import LandingPageView from "@/components/landing/LandingPageView";
import { getLandingPage, landingMetadata, landingCanonicalSlug } from "@/lib/landingPages";

import type { Locale } from "@/i18n/config";
const ALL_LOCALES: Locale[] = ["tr", "en", "de", "pl", "ru", "nl", "ro", "ar"];
const PRIMARY_LOCALES: Locale[] = ["tr", "en"];
const BASE_URL = "https://torviantransfer.com";

/**
 * Determine which locales are considered "translated" for a region.
 * tr and en are always treated as primary. de/pl/ru are only included
 * when the DB has locale-specific description or meta_title content,
 * preventing GSC "duplicate without user-selected canonical" reports.
 */
function getTranslatedLocales(region: Record<string, unknown>): Locale[] {
  return ALL_LOCALES.filter((l) => {
    if (PRIMARY_LOCALES.includes(l)) return true;
    const desc = (region[`description_${l}`] as string | null | undefined) ?? "";
    const mt = (region[`meta_title_${l}`] as string | null | undefined) ?? "";
    return desc.trim().length > 0 || mt.trim().length > 0;
  });
}

function normalizeRegionPath(slug: string) {
  return slug.endsWith("-transfer") ? slug : `${slug}-transfer`;
}

function stripTransferSuffix(regionPath: string) {
  return regionPath.replace(/-transfer$/, "");
}

async function findRegionByPath(supabase: ReturnType<typeof createAdminClient>, regionPath: string) {
  const baseSlug = stripTransferSuffix(regionPath);

  let { data: region } = await supabase
    .from("regions")
    .select("*")
    .eq("slug", baseSlug)
    .single();

  if (!region) {
    const suffixedSlug = normalizeRegionPath(baseSlug);
    if (suffixedSlug !== baseSlug) {
      const { data: fallbackRegion } = await supabase
        .from("regions")
        .select("*")
        .eq("slug", suffixedSlug)
        .single();
      region = fallbackRegion;
    }
  }

  return region;
}

/**
 * The admin-created landing page at this exact slug, or null.
 *
 * This segment is the only dynamic one directly under the locale, so it is
 * where a root-level `/tr/<slug>` has to be resolved — the App Router does not
 * allow a second `[landing]` folder beside `[region]`. Two rules keep that
 * sharing honest:
 *
 * 1. It is consulted *before* the `-transfer` normalisation below, which would
 *    otherwise 308 /tr/kampanya to /tr/kampanya-transfer and 404 it.
 * 2. An active region always wins the slug. Regions carry the pricing rows the
 *    booking flow reads and the rankings the site already has, so a collision
 *    costs the landing page its URL, never the region. The admin refuses to
 *    save a colliding slug in the first place; this is the second line, for a
 *    row written directly to the database or a region added afterwards.
 */
async function findLandingByPath(
  supabase: ReturnType<typeof createAdminClient>,
  slugParam: string
) {
  const landing = await getLandingPage(slugParam);
  if (!landing) return null;
  const region = await findRegionByPath(supabase, normalizeRegionPath(stripTransferSuffix(slugParam)));
  if (region && region.is_active === true) return null;
  return landing;
}

export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = createAdminClient();
  const [{ data: regions }, { data: landings }] = await Promise.all([
    supabase.from("regions").select("slug").eq("is_active", true),
    // `*` for the same reason sitemap.ts uses it: naming the per-locale slug
    // columns makes the whole query fail wherever migration 077 has not been
    // applied, and a build that quietly prerenders no landing pages is harder
    // to notice than one that prerenders them without their localised slugs.
    supabase.from("landing_pages").select("*").eq("is_published", true),
  ]);

  const locales: Locale[] = ALL_LOCALES;
  const params: { locale: string; region: string }[] = [];

  for (const locale of locales) {
    // Two sources feed one segment now, so a slug present in both would be
    // prerendered twice. The admin refuses to create such a slug, but a region
    // added afterwards can still collide, and a duplicate param is a build
    // error rather than a wrong page.
    const seen = new Set<string>();
    const add = (slug: string) => {
      if (seen.has(slug)) return;
      seen.add(slug);
      params.push({ locale, region: slug });
    };

    for (const region of regions ?? []) {
      add(normalizeRegionPath(region.slug));
    }
    // Prerendered alongside the regions rather than left to on-demand ISR: a
    // landing page is published precisely when someone is about to send paid
    // traffic to it, and the first visitor should not be the one who pays for
    // the render.
    for (const landing of landings ?? []) {
      // This locale's own slug, which is the only address it will not be
      // redirected away from. Prerendering the shared slug for every language
      // would build seven pages whose first act is a 301.
      add(landingCanonicalSlug(landing as never, locale));
    }
  }
  return params;
}

/**
 * The " · From $80" fragment appended to a region's title, per locale.
 *
 * Written as a function with a real default rather than a
 * `Record<string, string>` literal. The record had no `ro` key, so
 * `priceLabel[locale]` was `undefined` on Romanian pages — and it was
 * interpolated into a template string anyway, which shipped
 * "…| Privat VIP · 2 oreundefined" as the <title> of every Romanian region
 * page for as long as Romanian has existed. A lookup that cannot miss cannot
 * do that again.
 *
 * one_way_price is stored in USD (see supabase/seed.sql), so the label says $.
 * Metadata is server-rendered with no per-visitor currency; labelling it "€"
 * without converting misstated the price in every title tag.
 */
function priceLabelFor(locale: string, price: number | null | undefined): string {
  if (!price) return "";
  const amount = Math.round(Number(price));
  if (!Number.isFinite(amount) || amount <= 0) return "";
  switch (locale) {
    case "tr": return ` · $${amount}'den`;
    case "de": return ` · Ab $${amount}`;
    case "pl": return ` · Od $${amount}`;
    case "ru": return ` · От $${amount}`;
    case "nl": return ` · Vanaf $${amount}`;
    case "ro": return ` · De la ${amount}`;
    case "ar": return ` · ابتداءً من ${amount}`;
    default: return ` · From $${amount}`;
  }
}

/** The token an admin writes to pull the live price into their own copy. */
const PRICE_TOKEN = /\{price\}/g;

/**
 * Substitutes `{price}` in admin-entered copy, and leaves copy without the
 * token exactly as written.
 *
 * This is the whole source-of-truth rule for region meta text. The previous
 * behaviour appended the price to any admin title that did not already
 * contain a currency symbol, so the SEO panel showed one string and Google
 * received another — an editor who deliberately wrote a 58-character title
 * got a 71-character one and had no way to see it, let alone stop it.
 *
 * The price stays available, but only where the copy asks for it. That keeps
 * the CTR feature, makes it visible in the panel, and keeps the rule "what
 * you type is what ships".
 */
export function resolvePriceTokens(copy: string, priceLabel: string): string {
  PRICE_TOKEN.lastIndex = 0;
  if (!PRICE_TOKEN.test(copy)) return copy;
  PRICE_TOKEN.lastIndex = 0;
  // The label carries its own " · " separator, so a token written after one
  // would double it. Collapse that here rather than asking every editor to
  // remember the rule — and trim a trailing separator left behind when the
  // region has no pricing row and the token resolves to nothing.
  return copy
    .replace(PRICE_TOKEN, priceLabel)
    .replace(/\s*·\s*·\s*/g, " · ")
    .replace(/\s{2,}/g, " ")
    .replace(/[\s·|–-]+$/, "")
    .trim();
}

/**
 * The title and description a region page falls back to when its own column
 * for this locale is empty.
 *
 * Format matches Google Trends top queries per market:
 *   EN: "transfer from antalya airport" (UK #1, 100 interest, +4%)
 *   DE: "vip privattransfer" (+30%), "hotel transfer antalya" (#1 DE)
 *   PL: correct "do {name}" grammar + VIP keyword
 *
 * Romanian was missing from both maps, so /ro fell through to the generic
 * untranslated `meta_title` column — an English title on a Romanian page —
 * whenever the Romanian column was empty.
 */
function regionFallbackCopy(
  locale: string,
  v: {
    name: string;
    priceLabel: string;
    oneWayPrice: number | null | undefined;
    info: string;
    durStr: string;
  }
): { title: string; description: string } {
  const { name, priceLabel, oneWayPrice, info, durStr } = v;
  const dur = durStr ? ` · ${durStr}` : "";
  const price = oneWayPrice ? Math.round(Number(oneWayPrice)) : null;

  switch (locale) {
    case "tr":
      return {
        title: `Antalya Havalimanı ${name} Özel Transfer | VIP${priceLabel}${dur}`.trim(),
        description: `Antalya Havalimanı'ndan ${turkishNameForms(name).name_e} özel VIP transfer.${info ? ` Süre: ${info}` : ""}${price ? ` Araç başına $${price}'den.` : ""} Sabit fiyat, Mercedes Vito, karşılama, uçuş takibi. Online rezervasyon.`,
      };
    case "de":
      return {
        title: `VIP Privattransfer Flughafen Antalya → ${name}${priceLabel}${dur}`.trim(),
        description: `VIP Privattransfer Flughafen Antalya → ${name}.${info}${price ? ` Ab $${price} pro Fahrzeug.` : ""} Mercedes Vito, Abholung mit Schild, Flugverfolgung, kein Nachtzuschlag. Jetzt buchen.`,
      };
    case "pl":
      return {
        title: `Transfer z lotniska Antalya do ${name} | VIP Prywatny${priceLabel}${dur}`.trim(),
        description: `Prywatny transfer VIP z lotniska Antalya do ${name}.${info}${price ? ` Od $${price} za pojazd.` : ""} Mercedes Vito, spotkanie, śledzenie lotu, bezpłatne odwołanie 24h. Rezerwuj online.`,
      };
    case "ru":
      return {
        title: `Трансфер Аэропорт Анталия → ${name} | VIP${priceLabel}${dur}`.trim(),
        description: `Частный VIP-трансфер из аэропорта Анталии в ${name}.${info}${price ? ` От $${price} за авто.` : ""} Mercedes Vito, встреча, отслеживание рейса, отмена за 24ч. Бронировать онлайн.`,
      };
    case "nl":
      return {
        title: `Transfer Luchthaven Antalya naar ${name} | Privé VIP${priceLabel}${dur}`.trim(),
        description: `Privétransfer van de luchthaven Antalya naar ${name}.${info}${price ? ` Vanaf $${price} per voertuig.` : ""} Mercedes Vito, chauffeur met naambord, vluchtmonitoring, gratis annuleren tot 24 uur. Boek online — directe bevestiging.`,
      };
    case "ro":
      return {
        title: `Transfer Aeroportul Antalya → ${name} | Privat VIP${priceLabel}${dur}`.trim(),
        description: `Transfer privat VIP de la Aeroportul Antalya la ${name}.${info}${price ? ` De la ${price} per vehicul.` : ""} Mercedes Vito, întâmpinare cu placă, urmărirea zborului, anulare gratuită 24h. Rezervă online.`,
      };
    case "ar":
      return {
        title: `نقل من مطار أنطاليا إلى ${name} | خاص VIP${priceLabel}${dur}`.trim(),
        description: `نقل خاص VIP من مطار أنطاليا إلى ${name}.${info}${price ? ` ابتداءً من ${price} للمركبة.` : ""} مرسيدس فيتو، استقبال بلافتة تحمل اسمك، متابعة الرحلة، إلغاء مجاني حتى 24 ساعة. احجز عبر الإنترنت — تأكيد فوري.`,
      };
    default:
      return {
        title: `Transfer from Antalya Airport to ${name} | Private VIP${priceLabel}${dur}`.trim(),
        description: `Private transfer from Antalya Airport to ${name}.${info}${price ? ` From $${price} per vehicle.` : ""} Mercedes Vito, meet & greet, flight tracking, free cancellation 24h. Book online — instant confirmation.`,
      };
  }
}

/**
 * Everything `generateMetadata` does once the region row and its cheapest
 * price have been loaded.
 *
 * Exported so `npm run verify:seo` can assert the source-of-truth contract
 * against the page's own code rather than against a copy of its rules. The two
 * defects this file carried — a `priceLabel` map with no Romanian key, and a
 * price suffix appended over an admin's title — were both invisible to a unit
 * test of `applyOverrides`, because neither was in `applyOverrides`.
 */
export function regionMetadata(
  region: Record<string, unknown>,
  locale: string,
  oneWayPrice: number | null | undefined
): Metadata {
  const regionPath = normalizeRegionPath(String(region.slug));
  const regionSlugBase = stripTransferSuffix(regionPath);

  const name = (region[`name_${locale}`] as string | null) || (region.name_en as string);

  const priceLabel = priceLabelFor(locale, oneWayPrice);

  const km = region.distance_km ? `${Number(region.distance_km)} km` : "";
  const durMin: number = (region.duration_minutes as number | null) ?? 0;
  const durStr = durMin > 0
    ? durMin < 60
      ? `${durMin} min`
      : `${Math.floor(durMin / 60)}h ${durMin % 60}min`
    : "";
  const info = km && durStr ? ` ${durStr}, ${km}.` : "";

  // Used only when this locale's own DB column is empty. These carry the
  // price; a DB column does not unless it asks for it with {price}.
  const fallback = regionFallbackCopy(locale, { name, priceLabel, oneWayPrice, info, durStr });

  // ---- Source of truth --------------------------------------------------
  //
  // A non-empty `meta_title_{locale}` is what the SEO panel displays, so it is
  // what production must serve — character for character, minus the {price}
  // token it may deliberately contain.
  //
  // Only this locale's own column counts. Falling back to the untranslated
  // `meta_title` column served an English title on /nl, /de, /pl, /ru pages
  // whenever the locale column was empty (confirmed live on /nl/kemer-transfer,
  // /nl/belek-transfer, /nl/alanya-transfer 2026-08-10 and again 2026-08-24 —
  // GSC shows these rank fine but get ~0% CTR), so the localized template wins
  // over the generic column and the generic column is not consulted at all.
  const dbTitleLocale = ov(region, `meta_title_${locale}`);
  const metaTitle = dbTitleLocale
    ? resolvePriceTokens(dbTitleLocale, priceLabel)
    : fallback.title;

  const dbDescLocale = ov(region, `meta_description_${locale}`);
  const metaDesc = dbDescLocale
    ? resolvePriceTokens(dbDescLocale, priceLabel)
    : fallback.description;

  // Social preview image. This used to be built as
  // `/images/regions/{slug}.jpg`, but the files on disk are not named after
  // the slug — belek is belek-golf.jpg, side is side-ancient.jpg, and kemer
  // and kas are .webp. That made og:image a 404 on six regions (belek, side,
  // alanya, kemer, kas, goynuk — five of them the popular ones), so those
  // pages shared with no thumbnail on WhatsApp, Facebook and X. The page body
  // was always correct because it reads `regionImages`; only the metadata
  // guessed. Read the same map here, and fall back to the site's default OG
  // image rather than to a URL that may not exist.
  //
  // Two of those photos are stored as .webp, which Facebook's crawler still
  // renders inconsistently, so they get a JPG sibling cut to the 1200x630 the
  // og:image tags below declare. Those two files exist only to be the social
  // preview — the page body keeps using the .webp original, which next/image
  // serves better.
  //
  // The region row's own image_url / og_image_url now win when an admin has
  // set them; the map stays as the fallback so an unedited region — or a
  // database that has not run migration 057 — keeps the picture it has today.
  const regionImg =
    regionImageUrl(
      regionSlugBase,
      BASE_URL,
      region.og_image_url as string | null,
      region.image_url as string | null
    ) ?? `${BASE_URL}/images/og-default.jpg`;
  const regionImgAlt = ((region.image_alt as string | null) ?? "").trim() || `${name} Transfer`;

  // Which locales have actual content for this region?
  const translatedLocales = getTranslatedLocales(region);
  const isTranslated = translatedLocales.includes(locale as Locale);

  // Admin overrides on top of everything computed above. A region row with no
  // SEO fields filled in produces byte-identical metadata to before.
  return applyOverrides(
    {
    title: metaTitle,
    description: metaDesc,
    alternates: isTranslated
      ? {
          canonical: `${BASE_URL}/${locale}/${regionPath}`,
          languages: {
            "x-default": `${BASE_URL}/en/${regionPath}`,
            ...Object.fromEntries(
              translatedLocales.map((l) => [l, `${BASE_URL}/${l}/${regionPath}`])
            ),
          },
        }
      : {
          // Non-translated locale: point canonical to primary (tr) to resolve
          // GSC "duplicate without user-selected canonical" errors.
          canonical: `${BASE_URL}/tr/${regionPath}`,
        },
    robots: isTranslated ? INDEXABLE_ROBOTS : NOINDEX_ROBOTS,
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      url: `${BASE_URL}/${locale}/${regionPath}`,
      type: "website",
      siteName: "TORVIAN Transfer",
      images: [{ url: regionImg, width: 1200, height: 630, alt: regionImgAlt }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: metaTitle,
      description: metaDesc,
      images: [regionImg],
    },
    },
    { row: region, locale, rowOwnsMetaText: true }
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; region: string }>;
}): Promise<Metadata> {
  const supabase = createAdminClient();
  const { locale, region: regionParam } = await params;

  // Checked before the `-transfer` guard below, which returns `{}` for any
  // other shape and would have left every landing page with no metadata at all
  // — no title, no canonical, and the root layout's index/follow inherited by
  // a page Google had never been told about.
  const landing = await findLandingByPath(supabase, regionParam);
  if (landing) return landingMetadata(landing, locale);

  // A slug without the suffix either redirects onto a real region or, since
  // the page stopped appending the suffix blindly, 404s here. `{}` let that
  // 404 inherit the root layout's index/follow — the same defect the branch
  // below was already fixed for. Say noindex either way; a redirect discards
  // this metadata anyway.
  if (!regionParam.endsWith("-transfer")) {
    return { title: "Not Found", robots: NOINDEX_ROBOTS };
  }
  const normalizedRegionPath = normalizeRegionPath(stripTransferSuffix(regionParam));
  const region = await findRegionByPath(supabase, normalizedRegionPath);

  // A slug with no row, or a row an admin has deactivated, renders a 404 body
  // below. Returning `{}` let that 404 inherit the root layout's index/follow,
  // so a dead URL advertised itself to Google as indexable content. Say
  // noindex explicitly.
  if (!region || region.is_active !== true) {
    return { title: "Not Found", robots: NOINDEX_ROBOTS };
  }

  // Fetch pricing to include in meta title/description for better SERP CTR.
  // Google Trends (Jun 2026): "private transfer antalya airport" +100% Worldwide,
  // "antalya to belek transfer" +60%. Price in title improves qualified CTR.
  // Lowest price across every vehicle for this region. The label this feeds
  // is "From / İtibaren / Ab", so the cheapest vehicle is the honest number.
  // `.single()` used to be fine because there was exactly one vehicle
  // category; the moment a second one is added it errors and the price
  // silently vanishes from all 144 region titles.
  const { data: pricingMeta } = await supabase
    .from("pricing")
    .select("one_way_price, vehicle_categories!inner(is_active)")
    .eq("region_id", region.id)
    .eq("is_active", true)
    .eq("vehicle_categories.is_active", true)
    .order("one_way_price", { ascending: true })
    .limit(1)
    .maybeSingle();

  return regionMetadata(
    region as Record<string, unknown>,
    locale,
    pricingMeta?.one_way_price as number | null | undefined
  );
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ locale: string; region: string }>;
}) {
  const supabase = createAdminClient();
  const { locale, region: regionParam } = await params;

  // An admin-created landing page claims its slug exactly as typed — before
  // the suffix rule below, which exists for regions and would redirect
  // /tr/kampanya to a /tr/kampanya-transfer that does not exist.
  const landing = await findLandingByPath(supabase, regionParam);
  if (landing) {
    // A page answers on every slug it has ever carried, in any language, but
    // it only *belongs* on this locale's own. 301 the rest so an old address
    // and another language's address both keep working and hand their ranking
    // to the canonical URL rather than competing with it.
    const canonical = landingCanonicalSlug(landing, locale);
    if (canonical && canonical !== regionParam) {
      permanentRedirect(`/${locale}/${canonical}`);
    }
    return <LandingPageView page={landing} locale={locale} />;
  }

  // Keep a single canonical suffix and immediately redirect malformed variants.
  //
  // Only when a region actually answers at the suffixed path. This rule was
  // written when every slug reaching this segment was a region, so appending
  // the suffix unconditionally was harmless. It is not harmless now: a landing
  // page whose row could not be read -- a schema change not yet applied, a
  // transient Supabase failure -- fell through to here and sent
  // /en/antalya-airport-transfer-prices to
  // /en/antalya-airport-transfer-prices-transfer, which then 404s. A redirect
  // onto a dead URL is worse than a 404: it hides the real problem from
  // whoever is looking at it, and it teaches Google an address that will never
  // exist. An unknown slug now 404s where it stands.
  if (!regionParam.endsWith("-transfer")) {
    const suffixed = normalizeRegionPath(regionParam);
    const target = await findRegionByPath(supabase, suffixed);
    if (target && target.is_active === true) redirect(`/${locale}/${suffixed}`);
    notFound();
  }
  const normalizedRegionPath = normalizeRegionPath(stripTransferSuffix(regionParam));
  if (normalizedRegionPath !== regionParam) {
    redirect(`/${locale}/${normalizedRegionPath}`);
  }
  const t = await getTranslations({ locale, namespace: "regionDetail" });
  const nt = await getTranslations({ locale, namespace: "nav" });

  const region = await findRegionByPath(supabase, normalizedRegionPath);

  if (!region || region.is_active !== true) notFound();

  const regionPath = normalizeRegionPath(region.slug);
  const slug = stripTransferSuffix(regionPath);

  /**
   * Cheapest bookable vehicle for this region — same reasoning as in
   * generateMetadata. Region pages show a single "from" price rather than a
   * per-vehicle list; the vehicle choice belongs to the booking flow.
   *
   * "Bookable" is the whole filter, and it was missing. A price row survives
   * its vehicle being switched off, so the cheapest row in the table is not
   * necessarily one anyone can buy: on the day the fares moved to euro, only
   * the active category was converted, and this query went on quoting a
   * retired vehicle's dollar figure — Marmaris advertised 280 and a round trip
   * of 530 that we no longer run, both of them labelled as euro, in the
   * schema.org offers Google reads. /api/pricing has always filtered on the
   * category being active; this is the same condition.
   */
  const { data: pricing } = await supabase
    .from("pricing")
    .select("one_way_price, round_trip_price, vehicle_categories!inner(is_active)")
    .eq("region_id", region.id)
    .eq("is_active", true)
    .eq("vehicle_categories.is_active", true)
    .order("one_way_price", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Reviews for this region.
  //
  // This query used to have no region filter at all, so every one of the ~30
  // region pages rendered the same six reviews. `region_id` is NULL for every
  // review collected before migration 057, so those are pulled in too rather
  // than being orphaned — they are genuine reviews of the service, just not
  // attributed to a destination yet.
  const { data: reviewRows } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, created_at, published_at, author_name, author_country, locale, source, is_featured, region_id, customers(first_name)"
    )
    .eq("is_approved", true)
    .or(`region_id.eq.${region.id},region_id.is.null`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(12);

  // Locale filtering happens in memory: a review with no locale belongs on
  // every language's page, which is not expressible as one PostgREST filter
  // alongside the region clause above.
  const reviews = forLocale((reviewRows ?? []) as unknown as ReviewRow[], locale).slice(0, 6);

  // Cross-links to other regions.
  //
  // This block used to return the same six `is_popular` regions on every
  // region page, which made the internal link graph a star: the six popular
  // destinations collected every link and the ~18 smaller ones (Evrenseki,
  // Kızılağaç, Kargıcak, Boğazkent…) received none. Search Console shows the
  // result — those pages sit on 3–47 impressions each, because internal links
  // are how Google decides a page matters.
  //
  // Now it is a mesh: four geographic neighbours (a traveller comparing
  // Kemer also looks at Beldibi and Göynük, not at Alanya) plus two popular
  // destinations for commercial pull. Every region ends up linked from the
  // pages around it on the coast.
  const { data: allRegions } = await supabase
    .from("regions")
    .select("slug, name_tr, name_en, name_de, name_pl, name_ru, name_nl, name_ro, name_ar, duration_minutes, distance_km, is_popular, latitude, longitude, image_url")
    .eq("is_active", true)
    .neq("slug", region.slug)
    .order("sort_order", { ascending: true });

  type CrossLinkRegion = {
    slug: string;
    name_tr: string; name_en: string; name_de: string;
    name_pl: string; name_ru: string; name_nl: string; name_ro: string;
    name_ar: string;
    duration_minutes: number | null;
    distance_km: number | null;
    is_popular: boolean | null;
    latitude: number | null;
    longitude: number | null;
    image_url: string | null;
  };

  const otherRegions = (() => {
    const pool = (allRegions ?? []) as unknown as CrossLinkRegion[];
    if (pool.length === 0) return [] as CrossLinkRegion[];

    const lat = Number(region.latitude);
    const lng = Number(region.longitude);
    const km = Number(region.distance_km);

    // Squared distance is enough for ranking — no need for a real haversine.
    // Falls back to "similar distance from the airport", which along Antalya's
    // single coastal road is a good proxy for being neighbours.
    const proximity = (r: CrossLinkRegion): number => {
      const rLat = Number(r.latitude);
      const rLng = Number(r.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(rLat) && Number.isFinite(rLng)) {
        return (rLat - lat) ** 2 + (rLng - lng) ** 2;
      }
      const rKm = Number(r.distance_km);
      if (Number.isFinite(km) && Number.isFinite(rKm)) return Math.abs(rKm - km);
      return Number.POSITIVE_INFINITY;
    };

    const neighbours = [...pool]
      .sort((a, b) => proximity(a) - proximity(b))
      .slice(0, 4);

    const chosen = new Set(neighbours.map((r) => r.slug));
    const popular = pool.filter((r) => r.is_popular === true && !chosen.has(r.slug));

    return [...neighbours, ...popular].slice(0, 6);
  })();

  const name = region[`name_${locale as Locale}`] || region.name_en;
  const description =
    region[`description_${locale as Locale}`] || region.description_en;
  const regionImage = regionImagePath(slug, region.image_url as string | null);
  // Turkish endings for the name — Belek'e, Side'ye, Konyaaltı'na. See trSuffix.
  const nameForms = turkishNameForms(name);

  /*
   * Content written in the admin panel (Bölgeler → region editor). Every field
   * is optional; an empty one falls through to exactly what the page rendered
   * before the panel existed, so an untouched region is unchanged.
   */
  const pageContent = readPageContent((region as Record<string, unknown>).page_content, [locale]);
  const panel = pageContent.locales[locale];
  const extraAbout = paragraphs(panel.about);
  const routeName = typeof region.route_name === "string" && region.route_name.trim() ? region.route_name.trim() : null;
  const highlights = panel.highlights
    .map((h, i) => ({
      title: h.title.trim(),
      description: h.description.trim(),
      image: pageContent.highlightImages[i]?.trim() ?? "",
    }))
    .filter((h) => h.title && h.image)
    .map((h) => ({ ...h, imageAlt: `${h.title} — ${name}` }));

  // Schema.org structured data
  // The figure shown on the page must be the one marked up, or the two disagree.
  const ratings = aggregateReviews(markupEligible(reviews));

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    name: `TORVIAN ${name} Transfer`,
    description: description || t("defaultDesc", { name, ...turkishNameForms(name) }),
    // Google picks the thumbnail for a rich result from the entity's `image`,
    // and this schema had none — the region pages ranked with no picture
    // beside them. Prefer the JPG sibling cut for social (ogImageOverrides)
    // over the .webp original, since it is already 1200x630 and every
    // consumer renders JPG. Absolute URL: schema.org image must not be
    // relative or Google drops it silently.
    image:
      regionImageUrl(
        slug,
        BASE_URL,
        region.og_image_url as string | null,
        region.image_url as string | null
      ) ?? `${BASE_URL}/images/og-default.jpg`,
    provider: {
      "@type": "Organization",
      name: "TORVIAN Transfer",
      url: "https://torviantransfer.com",
      telephone: "+90-242-606-07-63",
      logo: `${BASE_URL}/images/logo.png`,
      image: `${BASE_URL}/images/logo.png`,
    },
    areaServed: {
      "@type": "Place",
      name: name,
      ...(regionImage ? { image: `${BASE_URL}${regionImage}` } : {}),
    },
    serviceType: "Airport Transfer",
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `https://torviantransfer.com/${locale}/${regionPath}`,
      servicePhone: "+90-242-606-07-63",
      availableLanguage: ["Turkish", "English", "German", "Russian", "Polish", "Dutch", "Romanian"],
    },
    offers: pricing
      ? [
          {
            "@type": "Offer",
            name: `${name} One-Way Transfer`,
            price: pricing.one_way_price,
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            url: `https://torviantransfer.com/${locale}/${regionPath}`,
          },
          ...(pricing.round_trip_price
            ? [
                {
                  "@type": "Offer",
                  name: `${name} Round-Trip Transfer`,
                  price: pricing.round_trip_price,
                  priceCurrency: "EUR",
                  availability: "https://schema.org/InStock",
                  url: `https://torviantransfer.com/${locale}/${regionPath}`,
                },
              ]
            : []),
        ]
      : undefined,
    // No aggregateRating here on purpose. Google renders review snippets only
    // for a fixed list of types and TaxiService is not one of them, so the
    // rating this node used to carry could never produce stars. It moved to
    // the Product node below, which is a type Google does render.
  };

  // The node that can actually earn stars in the SERP. Returns null unless
  // there are enough approved reviews to back a rating, in which case nothing
  // is emitted -- see src/lib/reviews.ts.
  const reviewProductSchema = productSchema({
    name: `Antalya Havalimani - ${name} Transfer`,
    description: description || t("defaultDesc", { name, ...turkishNameForms(name) }),
    url: `${BASE_URL}/${locale}/${regionPath}`,
    image:
      regionImageUrl(
        slug,
        BASE_URL,
        region.og_image_url as string | null,
        region.image_url as string | null
      ) ?? `${BASE_URL}/images/og-default.jpg`,
    price: pricing?.one_way_price as number | null | undefined,
    reviews,
  });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "TORVIAN Transfer", item: `https://torviantransfer.com/${locale}` },
      { "@type": "ListItem", position: 2, name: nt("regions"), item: `https://torviantransfer.com/${locale}/regions` },
      { "@type": "ListItem", position: 3, name: `${name} Transfer`, item: `https://torviantransfer.com/${locale}/${regionPath}` },
    ],
  };

  const price = pricing?.one_way_price ?? 0;

  // Named 5-star resorts guests specifically search for by brand ("Titanic
  // Deluxe Lara transfer", etc.) — only listed for the regions that actually
  // contain them, so this stays real rather than padded.
  const regionHotels: Record<string, string[]> = {
    "kundu-lara": ["Aska Lara Resort & Spa", "Titanic Deluxe Lara", "Royal Seginus", "Titanic Mardan Palace", "Delphin Imperial", "Rixos Downtown Antalya"],
    belek: ["Rixos Premium Belek", "Maxx Royal Belek", "Regnum Carya"],
    tekirova: ["Rixos Premium Tekirova"],
    okurcalar: ["Granada Luxury Okurcalar"],
  };
  // Panel wins once migration 097 has run; the map above is only the fallback
  // for a database that does not have the column yet.
  const hotelsForRegion = readHotels((region as Record<string, unknown>).hotels) ?? regionHotels[region.slug] ?? [];
  const hotelsIntro = hotelsIntroText(name, locale);

  /*
   * One list, two consumers: the accordion on the page and the FAQPage schema
   * below. They used to be written out separately, which is how a rendered
   * question and its marked-up twin drift apart.
   */
  const faqItems = [
    ...panel.faq.filter((f) => f.question.trim() && f.answer.trim()),
    ...generalFaq(t, {
      name,
      locale,
      durationMinutes: region.duration_minutes ?? null,
      distanceKm: region.distance_km ?? null,
      price,
      hotels: hotelsForRegion,
      overrides: panel.faqOverrides,
    }),
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  // An admin-set H1 wins; the locale templates below stay as the fallback.
  const heroTitleOverride = ov(region as Record<string, unknown>, `h1_${locale}`);
  const heroTitle = heroTitleOverride ?? (locale === "tr"
    ? `${name} Özel Transfer | Antalya Havalimanı → ${name}`
    : locale === "de"
      ? `Privater Transfer nach ${name} | Flughafen Antalya → ${name}`
      : locale === "pl"
        ? `Prywatny transfer do ${name} | Lotnisko Antalya → ${name}`
        : locale === "ru"
          ? `Частный трансфер в ${name} | Аэропорт Анталии → ${name}`
          : locale === "nl"
            ? `Privétransfer naar ${name} | Luchthaven Antalya → ${name}`
            : locale === "ro"
              ? `Transfer privat către ${name} | Aeroportul Antalya → ${name}`
              : `Private Transfer to ${name} | Antalya Airport → ${name}`);

  const heroDescription = heroIntroDefault(name, locale);

  const routeKeywords = locale === "tr"
    ? [`Antalya Havalimanı ${name} transfer`, `${name} özel transfer`, `${name} otel transferi`, `${name} çocuk koltuklu transfer`, `sabit fiyatlı ${name} transfer`, `${name} VIP transfer`, `gece varışı ${name} transfer`, `taksi yerine ${name} transfer`, `${name} transfer fiyatları`, `${name} transfer rezervasyon`]
    : locale === "de"
      ? [`Flughafen Antalya ${name} Transfer`, `${name} Privattransfer`, `${name} Hotel Transfer`, `${name} Kindersitz Transfer`, `Festpreis ${name} Transfer`, `${name} VIP Transfer`, `Nachttransfer nach ${name}`, `Alternative zum Taxi nach ${name}`, `${name} Transfer Preis`, `${name} Transfer jetzt buchen`]
        : locale === "pl"
        ? [`transfer z lotniska Antalya do ${name}`, `transfer VIP do ${name}`, `transfer do hotelu ${name}`, `transfer z fotelikiem dla dzieci do ${name}`, `transfer ze stałą ceną do ${name}`, `${name} transfer prywatny`, `nocny transfer do ${name}`, `transfer zamiast taksówki do ${name}`, `cena transferu do ${name}`, `zarezerwuj transfer do ${name}`]
        : locale === "ru"
          ? [`трансфер из Анталии в ${name}`, `VIP трансфер ${name}`, `трансфер в отель ${name}`, `трансфер с детским креслом ${name}`, `трансфер с фиксированной ценой ${name}`, `частный трансфер ${name}`, `ночной трансфер в ${name}`, `трансфер вместо такси в ${name}`, `цена трансфера в ${name}`, `забронировать трансфер в ${name}`]
          : locale === "nl"
            ? [`Luchthaven Antalya ${name} transfer`, `${name} privétransfer`, `${name} hoteltransfer`, `${name} transfer met kinderzitje`, `vaste prijs ${name} transfer`, `${name} VIP transfer`, `nachttransfer naar ${name}`, `transfer in plaats van taxi naar ${name}`, `${name} transfer prijs`, `${name} transfer boeken`]
            : locale === "ro"
              ? [`transfer aeroport Antalya ${name}`, `transfer privat ${name}`, `transfer hotel ${name}`, `transfer cu scaun pentru copii ${name}`, `transfer preț fix ${name}`, `transfer VIP ${name}`, `transfer de noapte ${name}`, `transfer in loc de taxi ${name}`, `preț transfer ${name}`, `rezervare transfer ${name}`]
              : locale === "ar"
                ? [`نقل من مطار أنطاليا إلى ${name}`, `نقل خاص إلى ${name}`, `نقل فندق ${name}`, `نقل مع مقعد أطفال إلى ${name}`, `نقل بسعر ثابت إلى ${name}`, `نقل VIP ${name}`, `نقل ليلي إلى ${name}`, `بديل التاكسي إلى ${name}`, `سعر النقل إلى ${name}`, `حجز نقل ${name}`]
              : [`Antalya Airport to ${name} transfer`, `private transfer to ${name}`, `${name} hotel transfer`, `family transfer to ${name}`, `fixed-price transfer to ${name}`, `VIP transfer ${name}`, `late night transfer to ${name}`, `${name} transfer instead of taxi`, `${name} transfer price`, `book ${name} transfer online`];
  const routeIntentLabel = locale === "tr"
    ? "Bu rota için sık aranan ifadeler"
    : locale === "de"
      ? "Häufige Suchbegriffe für diese Route"
      : locale === "pl"
        ? "Często wyszukiwane frazy dla tej trasy"
        : locale === "ru"
          ? "Часто ищут по этому маршруту"
          : locale === "nl"
            ? "Veelgezochte zoekwoorden voor deze route"
            : locale === "ro"
              ? "Căutări frecvente pentru această rută"
              : locale === "ar"
                ? "عبارات البحث الشائعة لهذا المسار"
                : "Common search phrases for this route";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {reviewProductSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewProductSchema) }}
        />
      )}
      <Header />
      <main className="flex-1">
        <RegionPageView
          locale={locale}
          breadcrumb={
            <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-gray-500">
              <Link href="/" className="transition-colors hover:text-gray-900">{t("home")}</Link>
              <span aria-hidden="true">/</span>
              <Link href="/regions" className="transition-colors hover:text-gray-900">{nt("regions")}</Link>
              <span aria-hidden="true">/</span>
              <span className="text-gray-900">{name}</span>
            </nav>
          }
          name={name}
          heading={heroTitle}
          intro={panel.subtitle.trim() || heroDescription}
          price={price ? <PriceTag amount={price} showLabel={false} /> : "—"}
          distanceKm={region.distance_km ? Number(region.distance_km) : null}
          durationMinutes={region.duration_minutes ? Number(region.duration_minutes) : null}
          heroImage={regionImage ?? "/images/regions/belek-golf.jpg"}
          heroImageAlt={t("imageAlt", { name, ...nameForms })}
          regionImage={regionImage}
          regionImageAlt={t("imageAlt", { name, ...nameForms })}
          about={
            // Written paragraphs replace the generic one — that sentence is the
            // same on every region page, and the point of the panel is to stop that.
            (extraAbout.length > 0
              ? [description, ...extraAbout]
              : [description, aboutDefault(t, name, region.duration_minutes ?? null)]
            ).filter(Boolean)
          }
          routeName={routeName}
          highlights={highlights}
          hotels={hotelsForRegion}
          hotelsIntro={hotelsIntro}
          reviews={reviews.map((r) => ({
            author: authorName(r, t("guest")),
            rating: Number(r.rating) || 5,
            text: r.comment ?? "",
            fromGoogle: r.source === "google",
          }))}
          ratingAverage={ratings.value !== null && ratings.count >= MIN_REVIEWS_FOR_SCHEMA ? ratings.value.toFixed(1) : undefined}
          ratingLine={ratings.value !== null && ratings.count >= MIN_REVIEWS_FOR_SCHEMA ? `(${ratings.count})` : undefined}
          faq={faqItems}
          otherRegions={otherRegions.map((r) => ({
            name: r[`name_${locale as Locale}`] || r.name_en,
            href: `/${locale}/${normalizeRegionPath(r.slug)}`,
          }))}
          searchPhrases={routeKeywords}
          searchPhrasesLabel={routeIntentLabel}
          bookHref={`/${locale}/booking?region=${slug}`}
        />
      </main>
      <Footer />
      <WhatsAppButton aboveStickyBar />
      <RegionStickyBar regionSlug={slug} />
    </>
  );
}
