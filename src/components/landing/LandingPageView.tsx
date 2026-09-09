import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight, MapPin } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeArticleHtml, ARTICLE_PROSE_CLASSES } from "@/lib/richText";
import {
  landingCopy,
  landingLocales,
  absoluteUrl,
  stripHtml,
  type LandingPage,
} from "@/lib/landingPages";

const BASE_URL = "https://torviantransfer.com";

/** The `-transfer` form a region page is always served on. */
function normalizeRegionPath(slug: string) {
  return slug.endsWith("-transfer") ? slug : `${slug}-transfer`;
}

/**
 * "from $80", in the visitor's language.
 *
 * Written as a lookup with a real default rather than a record indexed by
 * locale — the record form is what shipped "…2 oreundefined" into every
 * Romanian region title when a language was added without a key. A lookup that
 * cannot miss cannot do that again.
 */
function fromWord(locale: string): string {
  switch (locale) {
    case "tr":
      return "itibaren";
    case "de":
      return "ab";
    case "pl":
      return "od";
    case "ru":
      return "от";
    case "nl":
      return "vanaf";
    case "ro":
      return "de la";
    default:
      return "from";
  }
}

/**
 * An admin-created landing page.
 *
 * Rendered from a `landing_pages` row by src/app/[locale]/[region]/page.tsx,
 * which is the only dynamic segment under the locale. The layout deliberately
 * mirrors the blog article page rather than the five hardcoded landing pages:
 * those hold their copy as typed React, so their sections only exist because
 * someone wrote them, and there is nothing here to fill a features grid or a
 * price table with. What an admin types is a heading, a lead and a body — so
 * that is what this renders, in the same type scale as the rest of the site.
 */
export default async function LandingPageView({
  page,
  locale,
}: {
  page: LandingPage;
  locale: string;
}) {
  const copy = landingCopy(page, locale);
  const t = await getTranslations({ locale, namespace: "cta" });
  const nt = await getTranslations({ locale, namespace: "nav" });

  const content = sanitizeArticleHtml(copy.content);
  const heading = copy.h1 || page.label;
  const path = `/${page.slug}`;

  // The region this page sells, when it names one. Both the CTA price and the
  // contextual link to the region's own sales page come from it — the same
  // internal-linking reason the blog posts carry `primary_region_slug`: a
  // landing page that ranks should pass that authority to the page that
  // actually takes the booking.
  let regionName: string | null = null;
  let regionSlug: string | null = null;
  let oneWayPrice: number | null = null;

  if (page.cta_region_slug) {
    const supabase = createAdminClient();
    const { data: region } = await supabase
      .from("regions")
      .select("id, slug, name_tr, name_en, is_active")
      .eq("slug", page.cta_region_slug)
      .maybeSingle();

    if (region && region.is_active !== false) {
      regionSlug = region.slug as string;
      regionName =
        ((region[`name_${locale}` as keyof typeof region] as string | null) ??
          (region.name_en as string | null) ??
          (region.name_tr as string | null)) ||
        null;

      // Cheapest vehicle for the region, matching what the region page itself
      // shows. `.single()` would error the moment a second vehicle category
      // exists and silently drop the price, which is how it vanished from the
      // region titles once before.
      const { data: pricing } = await supabase
        .from("pricing")
        .select("one_way_price")
        .eq("region_id", region.id)
        .order("one_way_price", { ascending: true })
        .limit(1)
        .maybeSingle();
      oneWayPrice = (pricing?.one_way_price as number | null) ?? null;
    }
  }

  const description = copy.intro || stripHtml(copy.content).slice(0, 200);
  const image = absoluteUrl(page.image_url ?? page.og_image_url);

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: heading,
    description,
    url: `${BASE_URL}/${locale}${path}`,
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      name: "TORVIAN Transfer",
      url: BASE_URL,
    },
    ...(image ? { primaryImageOfPage: { "@type": "ImageObject", url: image } } : {}),
    // Only the languages this page is genuinely translated into, so the
    // structured data agrees with the hreflang cluster the metadata emits.
    availableLanguage: landingLocales(page),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "TORVIAN Transfer",
        item: `${BASE_URL}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: heading,
        item: `${BASE_URL}/${locale}${path}`,
      },
    ],
  };

  const priceLabel = oneWayPrice ? ` · ${fromWord(locale)} $${Math.round(oneWayPrice)}` : "";
  const bookingHref = regionSlug ? `/booking?region=${regionSlug}` : "/booking";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />
      <main>
        {/* Hero */}
        <section
          className="relative pt-24 pb-9 lg:pt-28 lg:pb-12 overflow-hidden"
          style={{ background: "linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 100%)" }}
        >
          <div className="absolute inset-0">
            <div
              className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px]"
              style={{ backgroundColor: "rgba(0,122,255,0.06)" }}
            />
          </div>

          <div className="relative max-w-3xl mx-auto px-4">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-[13px] text-gray-500"
            >
              <Link href="/" className="transition-colors hover:text-blue-600">
                {nt("home")}
              </Link>
              <span aria-hidden>/</span>
              <span className="text-gray-900">{heading}</span>
            </nav>

            {regionName && regionSlug && (
              <Link
                href={`/${normalizeRegionPath(regionSlug)}`}
                className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-700 transition-colors hover:bg-blue-100"
              >
                <MapPin size={11} />
                {regionName}
              </Link>
            )}

            <h1 className="mt-4 text-[27px] leading-[1.22] sm:text-4xl lg:text-[42px] lg:leading-[1.15] font-bold tracking-tight text-gray-900 text-balance">
              {heading}
            </h1>

            {copy.intro && (
              <p className="mt-5 text-[17px] leading-[1.75] text-gray-500 text-pretty">
                {copy.intro}
              </p>
            )}
          </div>
        </section>

        {/* Hero image. Pages without one get nothing rather than a placeholder;
            the hero gradient already resolves into the body. */}
        {page.image_url && (
          <section className="max-w-4xl mx-auto px-4">
            <div
              className="relative rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[2/1]"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <Image
                src={page.image_url}
                alt={page.image_alt || heading}
                fill
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
                priority
              />
            </div>
          </section>
        )}

        {/* Body */}
        {content && (
          <section className="py-12 lg:py-16">
            <div className="max-w-3xl mx-auto px-4">
              <div
                className={ARTICLE_PROSE_CLASSES}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </section>
        )}

        {/* Booking CTA. The headline copy comes from the `cta` namespace every
            locale already has, so a new landing page never ships an English
            button into a Polish page. */}
        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4">
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(0,122,255,0.05) 0%, rgba(0,122,255,0.05) 100%)",
                border: "1px solid rgba(0,122,255,0.06)",
              }}
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-blue-600 mb-4"
                style={{ backgroundColor: "rgba(0,122,255,0.08)" }}
              >
                <ArrowRight size={12} />
                {t("bookTransfer")}
                {priceLabel}
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                {t("heading")}
              </h2>
              <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">{t("subheading")}</p>
              <Link
                href={bookingHref}
                className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold rounded-full transition-all hover:brightness-110 hover:scale-105"
                style={{ backgroundColor: "#F97316", color: "#fff" }}
              >
                {t("primaryCta")}
                <ArrowRight size={14} />
              </Link>
              {regionSlug && regionName && (
                <div className="mt-4">
                  <Link
                    href={`/${normalizeRegionPath(regionSlug)}`}
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 underline underline-offset-2 hover:text-blue-700"
                  >
                    <MapPin size={13} />
                    {regionName}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <WhatsAppButton />
      <Footer />
    </>
  );
}
