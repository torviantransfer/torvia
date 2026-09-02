import { createAdminClient } from "@/lib/supabase/admin";
import { INDEXABLE_ROBOTS, NOINDEX_ROBOTS } from "@/lib/seo";
import { applyOverrides, ov } from "@/lib/seoOverrides";
import { regionImagePath, regionImageUrl } from "@/lib/regionImages";
import {
  aggregate as aggregateReviews,
  authorName,
  forLocale,
  productSchema,
  type ReviewRow,
} from "@/lib/reviews";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import RegionStickyBar from "@/components/region/RegionStickyBar";
import RegionCompareTable from "@/components/region/RegionCompareTable";
import PriceTag from "@/components/PriceTag";
import { Link } from "@/i18n/routing";
import {
  MapPin,
  Clock,
  ArrowRight,
  Shield,
  Star,
  Users,
  Plane,
  CreditCard,
  CheckCircle,
  Zap,
  Navigation,
  CalendarCheck,
} from "lucide-react";

type Locale = "tr" | "en" | "de" | "pl" | "ru" | "nl";
const ALL_LOCALES: Locale[] = ["tr", "en", "de", "pl", "ru", "nl"];
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

function formatDuration(minutes: number, locale: string): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (locale === "tr") return h > 0 ? `${h} saat${m > 0 ? ` ${m} dakika` : ""}` : `${m} dakika`;
  if (locale === "de") return h > 0 ? `${h} Std.${m > 0 ? ` ${m} Min.` : ""}` : `${m} Min.`;
  if (locale === "pl") return h > 0 ? `${h} godz.${m > 0 ? ` ${m} min` : ""}` : `${m} min`;
  if (locale === "ru") return h > 0 ? `${h} ч${m > 0 ? ` ${m} мин` : ""}` : `${m} мин`;
  if (locale === "nl") return h > 0 ? `${h} uur${m > 0 ? ` ${m} min` : ""}` : `${m} min`;
  return h > 0 ? `${h} hour${h !== 1 ? "s" : ""}${m > 0 ? ` ${m} min` : ""}` : `${m} min`;
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

export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = createAdminClient();
  const { data: regions } = await supabase
    .from("regions")
    .select("slug")
    .eq("is_active", true);

  const locales: Locale[] = ALL_LOCALES;
  const params: { locale: string; region: string }[] = [];

  for (const locale of locales) {
    for (const region of regions ?? []) {
      params.push({ locale, region: normalizeRegionPath(region.slug) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; region: string }>;
}): Promise<Metadata> {
  const supabase = createAdminClient();
  const { locale, region: regionParam } = await params;
  if (!regionParam.endsWith("-transfer")) return {};
  const normalizedRegionPath = normalizeRegionPath(stripTransferSuffix(regionParam));
  const region = await findRegionByPath(supabase, normalizedRegionPath);

  if (!region) return {};

  const regionPath = normalizeRegionPath(region.slug);
  const regionSlugBase = stripTransferSuffix(regionPath);

  const name = region[`name_${locale}`] || region.name_en;

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
    .select("one_way_price")
    .eq("region_id", region.id)
    .order("one_way_price", { ascending: true })
    .limit(1)
    .maybeSingle();
  const oneWayPrice = pricingMeta?.one_way_price as number | null | undefined;
  // one_way_price is stored in USD (see supabase/seed.sql) — labeling it with
  // "€" without conversion misrepresented the price in every title tag across
  // all 6 locales (Google SERP snippet + on-page). Metadata is server-rendered
  // with no per-visitor currency, so show the true base currency ($).
  const priceLabel: Record<string, string> = {
    en: oneWayPrice ? ` · From $${Math.round(oneWayPrice)}` : "",
    de: oneWayPrice ? ` · Ab $${Math.round(oneWayPrice)}` : "",
    pl: oneWayPrice ? ` · Od $${Math.round(oneWayPrice)}` : "",
    tr: oneWayPrice ? ` · $${Math.round(oneWayPrice)}'den` : "",
    ru: oneWayPrice ? ` · От $${Math.round(oneWayPrice)}` : "",
    nl: oneWayPrice ? ` · Vanaf $${Math.round(oneWayPrice)}` : "",
  };

  const km = region.distance_km ? `${Number(region.distance_km)} km` : "";
  const durMin: number = region.duration_minutes ?? 0;
  const durStr = durMin > 0
    ? durMin < 60
      ? `${durMin} min`
      : `${Math.floor(durMin / 60)}h ${durMin % 60}min`
    : "";
  const info = km && durStr ? ` ${durStr}, ${km}.` : "";

  // Fallback titles — used only when DB meta_title_{locale} is empty.
  // Format matches Google Trends top queries per market:
  //   EN: "transfer from antalya airport" (UK #1, 100 interest, +4%)
  //   DE: "vip privattransfer" (+30%), "hotel transfer antalya" (#1 DE)
  //   PL: correct "do {name}" grammar + VIP keyword
  const fallbackTitle: Record<string, string> = {
    en: `Transfer from Antalya Airport to ${name} | Private VIP${priceLabel.en}${durStr ? ` · ${durStr}` : ""}`.trim(),
    de: `VIP Privattransfer Flughafen Antalya → ${name}${priceLabel.de}${durStr ? ` · ${durStr}` : ""}`.trim(),
    pl: `Transfer z lotniska Antalya do ${name} | VIP Prywatny${priceLabel.pl}${durStr ? ` · ${durStr}` : ""}`.trim(),
    tr: `Antalya Havalimanı ${name} Özel Transfer | VIP${priceLabel.tr}${durStr ? ` · ${durStr}` : ""}`.trim(),
    ru: `Трансфер Аэропорт Анталия → ${name} | VIP${priceLabel.ru}${durStr ? ` · ${durStr}` : ""}`.trim(),
    nl: `Transfer Luchthaven Antalya naar ${name} | Privé VIP${priceLabel.nl}${durStr ? ` · ${durStr}` : ""}`.trim(),
  };

  // DB title takes priority, but only this locale's own column — falling back
  // to the untranslated `meta_title` column here served an English title on
  // /nl, /de, /pl, /ru pages whenever the locale-specific DB field was empty
  // (confirmed live on /nl/kemer-transfer, /nl/belek-transfer, /nl/alanya-transfer
  // 2026-08-10 and again 2026-08-24 — GSC shows these rank fine but get ~0% CTR).
  // The localized fallbackTitle template must win over the generic English column.
  const dbTitleLocale = region[`meta_title_${locale}`] as string | null;
  const dbTitle = dbTitleLocale || fallbackTitle[locale] || (region.meta_title as string | null);
  const metaTitle = dbTitle
    ? (oneWayPrice && !/[€$]/.test(dbTitle) ? `${dbTitle}${priceLabel[locale]}` : dbTitle)
    : fallbackTitle.en;

  // Fallback descriptions — include price, USPs optimised per Trends:
  //   EN: "meet & greet, flight tracking, free cancellation" (top UK USPs)
  //   DE: "hotel transfer" angle — "direkt zu Ihrem Hotel"
  const fallbackDesc: Record<string, string> = {
    en: `Private transfer from Antalya Airport to ${name}.${info}${oneWayPrice ? ` From $${Math.round(oneWayPrice)} per vehicle.` : ""} Mercedes Vito, meet & greet, flight tracking, free cancellation 24h. Book online — instant confirmation.`,
    de: `VIP Privattransfer Flughafen Antalya → ${name}.${info}${oneWayPrice ? ` Ab $${Math.round(oneWayPrice)} pro Fahrzeug.` : ""} Mercedes Vito, Abholung mit Schild, Flugverfolgung, kein Nachtzuschlag. Jetzt buchen.`,
    pl: `Prywatny transfer VIP z lotniska Antalya do ${name}.${info}${oneWayPrice ? ` Od $${Math.round(oneWayPrice)} za pojazd.` : ""} Mercedes Vito, spotkanie, śledzenie lotu, bezpłatne odwołanie 24h. Rezerwuj online.`,
    tr: `Antalya Havalimanı'ndan ${name}'ye özel VIP transfer.${info ? ` Süre: ${info}` : ""}${oneWayPrice ? ` Araç başına $${Math.round(oneWayPrice)}'den.` : ""} Sabit fiyat, Mercedes Vito, karşılama, uçuş takibi. Online rezervasyon.`,
    ru: `Частный VIP-трансфер из аэропорта Анталии в ${name}.${info}${oneWayPrice ? ` От $${Math.round(oneWayPrice)} за авто.` : ""} Mercedes Vito, встреча, отслеживание рейса, отмена за 24ч. Бронировать онлайн.`,
    nl: `Privétransfer van de luchthaven Antalya naar ${name}.${info}${oneWayPrice ? ` Vanaf $${Math.round(oneWayPrice)} per voertuig.` : ""} Mercedes Vito, chauffeur met naambord, vluchtmonitoring, gratis annuleren tot 24 uur. Boek online — directe bevestiging.`,
  };
  // Same locale-fallback fix as metaTitle above: this locale's own DB column,
  // then this locale's own template, only then the generic (English) column.
  const metaDesc =
    (region[`meta_description_${locale}`] as string | null) ||
    fallbackDesc[locale] ||
    (region.meta_description as string | null) ||
    fallbackDesc.en;

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
  const translatedLocales = getTranslatedLocales(region as Record<string, unknown>);
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
    { row: region as Record<string, unknown>, locale }
  );
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ locale: string; region: string }>;
}) {
  const supabase = createAdminClient();
  const { locale, region: regionParam } = await params;
  // Keep a single canonical suffix and immediately redirect malformed variants.
  if (!regionParam.endsWith("-transfer")) {
    redirect(`/${locale}/${normalizeRegionPath(regionParam)}`);
  }
  const normalizedRegionPath = normalizeRegionPath(stripTransferSuffix(regionParam));
  if (normalizedRegionPath !== regionParam) {
    redirect(`/${locale}/${normalizedRegionPath}`);
  }
  const t = await getTranslations({ locale, namespace: "regionDetail" });
  const bt = await getTranslations({ locale, namespace: "booking" });
  const nt = await getTranslations({ locale, namespace: "nav" });

  const region = await findRegionByPath(supabase, normalizedRegionPath);

  if (!region || region.is_active !== true) notFound();

  const regionPath = normalizeRegionPath(region.slug);
  const slug = stripTransferSuffix(regionPath);

  // Cheapest vehicle for this region — same reasoning as in generateMetadata.
  // Region pages show a single "from" price rather than a per-vehicle list;
  // the vehicle choice belongs to the booking flow.
  const { data: pricing } = await supabase
    .from("pricing")
    .select("one_way_price, round_trip_price")
    .eq("region_id", region.id)
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
    .select("slug, name_tr, name_en, name_de, name_pl, name_ru, name_nl, duration_minutes, distance_km, is_popular, latitude, longitude, image_url")
    .eq("is_active", true)
    .neq("slug", region.slug)
    .order("sort_order", { ascending: true });

  type CrossLinkRegion = {
    slug: string;
    name_tr: string; name_en: string; name_de: string;
    name_pl: string; name_ru: string; name_nl: string;
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

  // Schema.org structured data
  const ratings = aggregateReviews(reviews);

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    name: `TORVIAN ${name} Transfer`,
    description: description || t("defaultDesc", { name }),
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
      telephone: "+90-546-940-79-55",
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
      servicePhone: "+90-546-940-79-55",
      availableLanguage: ["Turkish", "English", "German", "Russian", "Polish", "Dutch"],
    },
    offers: pricing
      ? [
          {
            "@type": "Offer",
            name: `${name} One-Way Transfer`,
            price: pricing.one_way_price,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: `https://torviantransfer.com/${locale}/${regionPath}`,
          },
          ...(pricing.round_trip_price
            ? [
                {
                  "@type": "Offer",
                  name: `${name} Round-Trip Transfer`,
                  price: pricing.round_trip_price,
                  priceCurrency: "USD",
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
    description: description || t("defaultDesc", { name }),
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
  const hotelsForRegion = regionHotels[region.slug] ?? [];
  const hotelsIntro = locale === "tr"
    ? `${name} bölgesindeki tüm otellere hizmet veriyoruz, öne çıkanlar:`
    : locale === "de"
      ? `Wir bedienen alle Hotels in ${name}, darunter:`
      : locale === "pl"
        ? `Obsługujemy wszystkie hotele w ${name}, w tym:`
        : locale === "ru"
          ? `Мы обслуживаем все отели в ${name}, включая:`
          : locale === "nl"
            ? `Wij bedienen alle hotels in ${name}, waaronder:`
            : `We serve every hotel in ${name}, including:`;
  const faqHotelsQ = locale === "tr"
    ? `${name} bölgesinde hangi otellere transfer sağlıyorsunuz?`
    : locale === "de"
      ? `Welche Hotels in ${name} bedienen Sie?`
      : locale === "pl"
        ? `Do jakich hoteli w ${name} zapewniacie transfer?`
        : locale === "ru"
          ? `В какие отели в ${name} вы осуществляете трансфер?`
          : locale === "nl"
            ? `Welke hotels in ${name} bedient u?`
            : `Which hotels in ${name} do you provide transfer to?`;
  const faqHotelsA = locale === "tr"
    ? `${name} bölgesindeki tüm otellere transfer sağlıyoruz; öne çıkanlar arasında ${hotelsForRegion.join(", ")} bulunur. Rezervasyon sırasında otel adınızı belirtmeniz yeterlidir.`
    : locale === "de"
      ? `Wir bedienen alle Hotels in ${name}, darunter ${hotelsForRegion.join(", ")}. Geben Sie bei der Buchung einfach Ihren Hotelnamen an.`
      : locale === "pl"
        ? `Zapewniamy transfer do wszystkich hoteli w ${name}, w tym do ${hotelsForRegion.join(", ")}. Wystarczy podać nazwę hotelu podczas rezerwacji.`
        : locale === "ru"
          ? `Мы осуществляем трансфер во все отели в ${name}, включая ${hotelsForRegion.join(", ")}. Просто укажите название отеля при бронировании.`
          : locale === "nl"
            ? `Wij verzorgen transfers naar alle hotels in ${name}, waaronder ${hotelsForRegion.join(", ")}. Vermeld gewoon uw hotelnaam tijdens het boeken.`
            : `We provide transfer to every hotel in ${name}, including ${hotelsForRegion.join(", ")}. Just enter your hotel name during booking.`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: t("faqQ1", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA1", { name, duration: region.duration_minutes ? formatDuration(region.duration_minutes, locale) : "—", distance: region.distance_km ?? "—" }) } },
      { "@type": "Question", name: t("faqQ2", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA2") } },
      { "@type": "Question", name: t("faqQ3", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA3") } },
      { "@type": "Question", name: t("faqQ4"), acceptedAnswer: { "@type": "Answer", text: t("faqA4") } },
      { "@type": "Question", name: t("faqQ5", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA5", { name, price }) } },
      { "@type": "Question", name: t("faqQ6", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA6") } },
      { "@type": "Question", name: t("faqQ7", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA7") } },
      { "@type": "Question", name: t("faqQ8", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA8") } },
      { "@type": "Question", name: t("faqQ9", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA9", { name }) } },
      { "@type": "Question", name: t("faqQ10", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA10", { name, distance: region.distance_km ?? "—", duration: region.duration_minutes ? formatDuration(region.duration_minutes, locale) : "—" }) } },
      ...(hotelsForRegion.length > 0 ? [{ "@type": "Question", name: faqHotelsQ, acceptedAnswer: { "@type": "Answer", text: faqHotelsA } }] : []),
    ],
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
            : `Private Transfer to ${name} | Antalya Airport → ${name}`);

  const heroDescription = locale === "tr"
    ? `${name} için Antalya Havalimanı'ndan özel VIP transfer. Sabit fiyat, profesyonel şoför, uçuş takibi ve online rezervasyon.`
    : locale === "de"
      ? `Privater VIP-Transfer vom Flughafen Antalya nach ${name}. Festpreis, professioneller Fahrer, Flugverfolgung und Online-Buchung.`
      : locale === "pl"
        ? `Prywatny transfer VIP z lotniska Antalya do ${name}. Stała cena, profesjonalny kierowca, śledzenie lotu i szybka rezerwacja.`
        : locale === "ru"
          ? `Частный VIP-трансфер из аэропорта Анталии в ${name}. Фиксированная цена, профессиональный водитель, отслеживание рейса и онлайн-бронирование.`
          : locale === "nl"
            ? `Privé VIP-transfer vanaf de luchthaven Antalya naar ${name}. Vaste prijs, professionele chauffeur, vluchtmonitoring en online reservering.`
            : `Private VIP transfer from Antalya Airport to ${name}. Fixed price, professional driver, flight tracking and online booking.`;

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: t("howToBookTitle"),
        step: [
          { "@type": "HowToStep", position: 1, name: t("howToBookStep1"), text: t("howToBookStep1Desc", { name }) },
          { "@type": "HowToStep", position: 2, name: t("howToBookStep2"), text: t("howToBookStep2Desc") },
          { "@type": "HowToStep", position: 3, name: t("howToBookStep3"), text: t("howToBookStep3Desc") },
        ],
      }) }} />
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative pb-16 pt-24 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(255,149,0,0.03) 50%, #FFFFFF 100%)" }}>
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(0,122,255,0.06)" }} />
          </div>
          <div className="relative max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link href="/" className="hover:text-gray-900 transition-colors">{t("home")}</Link>
              <span>/</span>
              <Link href="/regions" className="hover:text-gray-900 transition-colors">{nt("regions")}</Link>
              <span>/</span>
              <span className="text-gray-900">{name}</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
              {/* Phones get a different running order than desktop: title →
                  route facts → price → CTA, with the search-phrase list pushed
                  to the end. On a narrow screen the phrase list was the first
                  thing under the H1 and pushed price and booking below the
                  fold. `flex flex-col` + `order-*` reorders visually while the
                  DOM order stays exactly as it was, so crawlers and screen
                  readers see the unchanged sequence. `lg:block` drops flex
                  entirely on desktop, which makes every `order-*` inert there —
                  the desktop layout is untouched. */}
              <div className="flex flex-col lg:block">
                <h1 className="order-1 text-3xl lg:text-5xl font-bold mb-4 lg:mb-5 tracking-tight text-gray-900">
                  {heroTitle}
                </h1>
                <p className="order-2 text-base lg:text-lg text-gray-500 mb-6 lg:mb-8 leading-relaxed">
                  {heroDescription}
                </p>

                <div className="order-7 mb-6 lg:mb-8">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">
                    {routeIntentLabel}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {routeKeywords.map((keyword) => (
                      <span key={keyword} className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {hotelsForRegion.length > 0 && (
                  <p className="order-8 text-sm text-gray-500 mb-6 lg:mb-8">
                    {hotelsIntro} <span className="text-gray-700">{hotelsForRegion.join(", ")}</span>
                  </p>
                )}

                <div className="order-3 flex flex-wrap gap-3 mb-6 lg:mb-8">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <Clock size={16} className="text-blue-600" strokeWidth={1.5} />
                    <span className="text-sm text-gray-900">~{region.duration_minutes ? formatDuration(region.duration_minutes, locale) : `${region.duration_minutes} ${t("min")}`}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <MapPin size={16} className="text-blue-600" strokeWidth={1.5} />
                    <span className="text-sm text-gray-900">{Number(region.distance_km)} km</span>
                  </div>
                </div>

                {/* Pricing Display */}
                {pricing && (
                  <div className="order-4 flex flex-wrap gap-4 mb-5">
                    <div className="rounded-xl px-5 py-4" style={{ backgroundColor: "rgba(0,122,255,0.05)", border: "1px solid rgba(0,122,255,0.12)" }}>
                      <div className="text-xs text-gray-400 mb-1">{t("fromPrice")}</div>
                      <div className="text-2xl font-bold text-gray-900"><PriceTag amount={pricing.one_way_price} showLabel={false} /></div>
                      <div className="text-xs text-gray-500">{t("oneWay")} · {t("perVehicle")}</div>
                    </div>
                    {pricing.round_trip_price && (
                      <div className="rounded-xl px-5 py-4" style={{ backgroundColor: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.15)" }}>
                        {/* "From", not "Round trip" — the label under the
                            figure already says round trip, so repeating it
                            above read as a copy-paste slip. Both cards now
                            carry the same "from" caption, which is also what
                            the figure means: the cheapest vehicle's price. */}
                        <div className="text-xs text-gray-400 mb-1">{t("fromPrice")}</div>
                        <div className="text-2xl font-bold text-gray-900"><PriceTag amount={pricing.round_trip_price} showLabel={false} /></div>
                        <div className="text-xs text-gray-500">{t("roundTrip")} · {t("perVehicle")}</div>
                      </div>
                    )}
                  </div>
                )}
                {/* Phone-only hero CTA. Desktop already reaches booking from
                    the route-intent block right below the fold, but on a phone
                    that block sits a full screen further down, so the price had
                    no action next to it. `routeIntentPrimaryCta` and the href
                    are the same label and target that block uses — no new
                    string and no new link destination. */}
                <Link
                  href={`/booking?region=${slug}`}
                  className="order-5 lg:hidden mb-5 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-md transition active:scale-[0.99]"
                >
                  {t("routeIntentPrimaryCta")}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>

                {/* Trust strip */}
                {/* mb only on phones: reordering moved the search-phrase block
                    below this strip, and with no bottom margin the two ran
                    together. Desktop keeps this as the last element, so it
                    stays flush there. */}
                <div className="order-6 mb-8 lg:mb-0 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                    <CheckCircle size={12} className="text-emerald-400" />
                    {t("freeCancellation")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                    <Shield size={12} className="text-blue-600" />
                    {t("securePayTitle")}
                  </span>
                </div>
              </div>

              {/* Region Image */}
              {regionImage && (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                  <Image
                    src={regionImage}
                    alt={t("imageAlt", { name })}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Route intent block */}
        <section className="py-6 lg:py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 to-white p-6 lg:p-8">
              <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                  {t("routeIntentTitle", { name })}
                </h2>
                <p className="text-sm leading-relaxed text-gray-600">
                  {t("routeIntentDesc", { name })}
                </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/booking?region=${slug}`} className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                    {t("routeIntentPrimaryCta")}
                  </Link>
                  <Link href="/regions" className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                    {t("routeIntentSecondaryCta")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose + CTA */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">{t("whyChoose")}</h2>
                <div className="space-y-3">
                  {[
                    { icon: Shield, title: t("fixedPriceTitle"), desc: t("fixedPriceDesc") },
                    { icon: Users, title: t("proDriversTitle"), desc: t("proDriversDesc") },
                    { icon: Plane, title: t("flightTrackTitle"), desc: t("flightTrackDesc") },
                    { icon: CreditCard, title: t("securePayTitle"), desc: t("securePayDesc") },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-4 p-5 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(0,122,255,0.08)" }}>
                        <Icon size={18} className="text-blue-600" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">{title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Book CTA Card */}
              <div className="rounded-2xl p-8" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                  {t("bookYourTransfer", { name })}
                </h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  {t("bookDesc")}
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    t("driveFromAirport", { duration: formatDuration(region.duration_minutes, locale) }),
                    t("mercedesVito"),
                    t("freeFlightMonitoring"),
                    t("freeCancellation"),
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-sm text-gray-500">{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/booking?region=${slug}`}
                  className="w-full py-4 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:brightness-110 shadow-lg"
                  style={{ backgroundColor: '#2563EB', boxShadow: '0 8px 25px rgba(37,99,235,0.25)' }}
                >
                  {bt("title")} <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Vehicle Features */}
        <section className="py-16" style={{ borderTop: "1px solid rgba(0,0,0,0.03)" }}>
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">{t("vehicleHeading")}</h2>
            <div className="grid sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { label: t("specPassengers"), icon: Users },
                { label: t("specWifi"), icon: Zap },
                { label: t("specClimate"), icon: Shield },
                { label: t("specLeather"), icon: Star },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="rounded-xl p-5 text-center" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(0,122,255,0.08)" }}>
                    <Icon size={18} className="text-blue-600" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-medium text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to Book — 3 Steps */}
        <section className="py-16" style={{ borderTop: "1px solid rgba(0,0,0,0.03)" }}>
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center tracking-tight">{t("howToBookTitle")}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { num: "1", title: t("howToBookStep1"), desc: t("howToBookStep1Desc", { name }) },
                { num: "2", title: t("howToBookStep2"), desc: t("howToBookStep2Desc") },
                { num: "3", title: t("howToBookStep3"), desc: t("howToBookStep3Desc") },
              ].map(({ num, title, desc }) => (
                <div key={num} className="flex gap-4 p-6 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600" style={{ backgroundColor: "rgba(0,122,255,0.08)" }}>
                    {num}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href={`/booking?region=${slug}`}
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold rounded-xl transition-all hover:brightness-110"
                style={{ backgroundColor: '#2563EB', color: '#fff' }}
              >
                {t("bookNow")} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* About Region - SEO Content */}
        <section className="py-16" style={{ borderTop: "1px solid rgba(0,0,0,0.03)" }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-5 gap-10">
              <div className="lg:col-span-3">
                <h2 className="text-2xl font-bold text-gray-900 mb-5 tracking-tight">{t("aboutRegion", { name })}</h2>
                {description ? (
                  <div className="space-y-4">
                    <p className="text-gray-600 leading-relaxed text-[15px]">
                      {description}
                    </p>
                    <p className="text-gray-500 leading-relaxed">
                      {t("aboutDescDefault", { name, duration: region.duration_minutes })}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 leading-relaxed">
                    {t("aboutDescDefault", { name, duration: region.duration_minutes })}
                  </p>
                )}
              </div>
              <div className="lg:col-span-2">
                <div className="rounded-2xl p-6" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="space-y-4">
                    {[
                      { icon: Navigation, text: t("highlightDistance", { distance: region.distance_km }) },
                      { icon: Clock, text: t("highlightDuration", { duration: region.duration_minutes }) },
                      { icon: CalendarCheck, text: t("highlightAvailable") },
                      { icon: Users, text: t("highlightMeetGreet") },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(0,122,255,0.08)" }}>
                          <Icon size={14} className="text-blue-600" strokeWidth={1.5} />
                        </div>
                        <span className="text-sm text-gray-500">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <section className="py-16" style={{ borderTop: "1px solid rgba(0,0,0,0.03)" }}>
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center tracking-tight">{t("customerReviews")}</h2>
              {/* The visible counterpart of the aggregateRating in the Product
                  schema. Google cross-checks that a rating it is asked to show
                  as a snippet is also visible on the page. */}
              {ratings.value !== null && (
                <div className="flex items-center justify-center gap-2 mb-8">
                  <span className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        size={15}
                        className={j < Math.round(ratings.value!) ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                      />
                    ))}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{ratings.value.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({ratings.count})</span>
                </div>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviews.map((review, i) => {
                  return (
                    <div key={i} className="rounded-xl p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} size={14} className={j < review.rating ? "text-amber-400 fill-amber-400" : "text-[#333]"} />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-500 mb-2">&ldquo;{review.comment}&rdquo;</p>
                      )}
                      <p className="text-xs text-gray-500">{authorName(review, t("guest"))}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="py-16" style={{ borderTop: "1px solid rgba(0,0,0,0.03)" }}>
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center tracking-tight">{t("faqHeading", { name })}</h2>
            <div className="space-y-3">
              {[
                { q: t("faqQ1", { name }), a: t("faqA1", { name, duration: region.duration_minutes ? formatDuration(region.duration_minutes, locale) : "—", distance: region.distance_km ?? "—" }) },
                { q: t("faqQ2", { name }), a: t("faqA2") },
                { q: t("faqQ3", { name }), a: t("faqA3") },
                { q: t("faqQ4"), a: t("faqA4") },
                { q: t("faqQ5", { name }), a: t("faqA5", { name, price }) },
                { q: t("faqQ6", { name }), a: t("faqA6") },
                { q: t("faqQ7", { name }), a: t("faqA7") },
                { q: t("faqQ8", { name }), a: t("faqA8") },
                { q: t("faqQ9", { name }), a: t("faqA9", { name }) },
                { q: t("faqQ10", { name }), a: t("faqA10", { name, distance: region.distance_km ?? "—", duration: region.duration_minutes ? formatDuration(region.duration_minutes, locale) : "—" }) },
                ...(hotelsForRegion.length > 0 ? [{ q: faqHotelsQ, a: faqHotelsA }] : []),
              ].map(({ q, a }) => (
                <details key={q} className="rounded-xl overflow-hidden group" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <summary className="px-5 py-4 cursor-pointer font-medium text-gray-900 text-sm flex items-center justify-between">
                    {q}
                    <span className="text-gray-500 group-open:rotate-180 transition-transform">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-gray-500" style={{ borderTop: "1px solid rgba(0,0,0,0.03)" }}>{a}</div>
                </details>
              ))}
            </div>

          </div>
        </section>

        {/* Other Popular Destinations */}
        <RegionCompareTable regionName={name} torvianPrice={price} />

        {otherRegions && otherRegions.length > 0 && (
          <section className="py-16" style={{ borderTop: "1px solid rgba(0,0,0,0.03)" }}>
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center tracking-tight">{t("otherDestinations")}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherRegions.map((r) => {
                  const rName = r[`name_${locale as Locale}`] || r.name_en;
                  const rImage = regionImagePath(stripTransferSuffix(r.slug), r.image_url);
                  return (
                    <Link
                      key={r.slug}
                      href={`/${r.slug.endsWith("-transfer") ? r.slug : `${r.slug}-transfer`}`}
                      className="group rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
                    >
                      {rImage && (
                        <div className="relative h-36 overflow-hidden">
                          <Image
                            src={rImage}
                            alt={t("imageAlt", { name: rName })}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 text-sm mb-2 group-hover:text-blue-600 transition-colors">{rName} Transfer</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Clock size={12} /> ~{r.duration_minutes} {t("min")}</span>
                          <span className="flex items-center gap-1"><MapPin size={12} /> {r.distance_km} km</span>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 group-hover:gap-2 transition-all">
                          {t("viewTransfer")} <ArrowRight size={12} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Back-link to the airport head-term hub, which links out to
                  every region — this is the return edge of that hub. */}
              <div className="mt-8 text-center">
                <Link
                  href="/antalya-airport-transfer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:gap-2 transition-all"
                >
                  {t("airportHubLink")} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Cross-link: Lara Beach dedicated page for the Kundu-Lara region */}
        {slug === "kundu-lara" && (
          <section className="py-8 bg-blue-50 border-y border-blue-100">
            <div className="max-w-3xl mx-auto px-4 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-blue-800">
                {locale === "tr" ? "Lara Beach otellerine özel transfer rehberimize bakın" :
                 locale === "de" ? "Sehen Sie unsere spezielle Seite für Lara Beach Hotels" :
                 locale === "pl" ? "Zobacz naszą dedykowaną stronę dla hoteli Lara Beach" :
                 locale === "ru" ? "Смотрите нашу страницу для отелей пляжа Лара" :
                 locale === "nl" ? "Bekijk onze speciale pagina voor Lara Beach hotels" :
                 "See our dedicated Lara Beach transfer page with hotel-specific info"}
              </p>
              <Link
                href="/lara-beach-transfer"
                className="text-sm font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap"
              >
                Lara Beach Transfer →
              </Link>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16" style={{ borderTop: "1px solid rgba(0,0,0,0.03)" }}>
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">{t("readyToBook", { name })}</h2>
            <p className="text-gray-500 mb-8">{t("readyDesc")}</p>
            <Link
              href={`/booking?region=${slug}`}
              className="inline-flex items-center gap-2 px-8 py-4 text-white font-bold rounded-xl transition-all hover:brightness-110 shadow-lg"
              style={{ backgroundColor: '#2563EB', boxShadow: '0 8px 25px rgba(37,99,235,0.25)' }}
            >
              {t("bookNow")} <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton aboveStickyBar />
      <RegionStickyBar regionSlug={slug} />
    </>
  );
}
