import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getSeoPage, applySeoPage } from "@/lib/seoPages";
import {
  aggregate as aggregateReviews,
  forLocale,
  productSchema,
  type ReviewRow,
} from "@/lib/reviews";
import { localeOgTags, type Locale } from "@/i18n/config";
import { createAdminClient } from "@/lib/supabase/admin";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import TrustBadges from "@/components/home/TrustBadges";

import RegionsPreview from "@/components/home/RegionsPreview";
import HowItWorks from "@/components/home/HowItWorks";
import VehicleShowcase from "@/components/home/VehicleShowcase";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";
import BlogPreview from "@/components/home/BlogPreview";
import HomeFAQ from "@/components/home/HomeFAQ";
import LocalSeoBlock from "@/components/home/LocalSeoBlock";
import WhatsAppButton from "@/components/WhatsAppButton";

const BASE_URL = "https://torviantransfer.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Admin-editable overrides. Null when the row is empty or the
  // table is missing, in which case the values below are used verbatim.
  const seoRow = await getSeoPage("home");
  const t = await getTranslations({ locale, namespace: "meta" });

  // Titles lead with the exact high-volume head term per market (Google Trends
  // Jul 2026: "antalya airport transfer" / "flughafen transfer antalya" = 100),
  // then the rising commercial modifier "private transfer" (DE +200%, NL +110%,
  // WW +70%). "VIP" kept secondary — it is declining everywhere except UK.
  const titleByLocale: Record<string, string> = {
    tr: "Antalya Havalimanı Transfer | Özel Transfer Belek, Side, Alanya, Kemer",
    en: "Antalya Airport Transfer | Private Transfer to Belek, Side, Alanya, Kemer",
    de: "Antalya Flughafen Transfer | Privattransfer Belek, Side, Alanya, Kemer",
    pl: "Transfer z Lotniska Antalya | Prywatny Transfer Belek, Side, Alanya, Kemer",
    ru: "Трансфер из Аэропорта Анталии | Частный Трансфер Белек, Сиде, Аланья, Кемер",
    nl: "Antalya Airport Transfer | Privétransfer Belek, Side, Alanya, Kemer",
  };

  const descriptionByLocale: Record<string, string> = {
    tr: "Antalya Havalimanı transfer hizmeti: Belek, Side, Alanya, Kemer ve tüm otellere özel transfer. Sabit fiyat, Mercedes Vito, uçuş takibi, anında online rezervasyon.",
    en: "Antalya Airport transfer to Belek, Side, Alanya, Kemer and all resorts. Private door-to-door transfer, fixed price, Mercedes Vito, flight tracking, instant booking.",
    de: "Antalya Flughafen Transfer nach Belek, Side, Alanya, Kemer und allen Hotels. Privater Hotel-Transfer, Festpreis, Mercedes Vito, Flugverfolgung, sofortige Buchung.",
    pl: "Transfer z lotniska Antalya do Belek, Side, Alanya, Kemer i wszystkich hoteli. Prywatny transfer pod drzwi, stała cena, Mercedes Vito, śledzenie lotu, rezerwacja online.",
    ru: "Трансфер из аэропорта Анталии в Белек, Сиде, Аланью, Кемер и все отели. Частный трансфер от двери до двери, фиксированная цена, Mercedes Vito, отслеживание рейса.",
    nl: "Antalya Airport transfer naar Belek, Side, Alanya, Kemer en alle hotels. Privétransfer van deur tot deur, vaste prijs, Mercedes Vito, vluchtmonitoring, direct boeken.",
  };

  return applySeoPage({
    title: titleByLocale[locale] ?? t("title"),
    description: descriptionByLocale[locale] ?? t("description"),
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        "x-default": `${BASE_URL}/en`,
        tr: `${BASE_URL}/tr`,
        en: `${BASE_URL}/en`,
        de: `${BASE_URL}/de`,
        pl: `${BASE_URL}/pl`,
        ru: `${BASE_URL}/ru`,
        nl: `${BASE_URL}/nl`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${BASE_URL}/${locale}`,
      siteName: "TORVIAN Transfer",
      type: "website",
      locale: localeOgTags[locale as Locale] ?? "en_US",
      images: [{ url: `${BASE_URL}/images/og-default.jpg`, width: 1200, height: 630, alt: "TORVIAN Transfer - Antalya Airport VIP Transfer" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [`${BASE_URL}/images/og-default.jpg`],
    },
    keywords: locale === "tr"
      ? "antalya havalimanı transfer, antalya vip transfer, havalimanı transfer, antalya özel transfer, belek transfer, side transfer, alanya transfer, kemer transfer, antalya havalimanı otel transferi, antalya havalimanından otellere özel transfer, antalya havalimanı belek transfer, antalya havalimanı side transfer, antalya havalimanı alanya transfer, antalya havalimanı kemer transfer, Land of Legends transfer, gece varışı özel transfer, taksi yerine özel transfer, Titanic Deluxe Lara transfer"
      : locale === "de"
      ? "Antalya Flughafen Transfer, VIP Transfer Antalya, Privattransfer Antalya, Flughafen Transfer Türkei, Belek Transfer, Side Transfer, Alanya Transfer, Kemer Transfer, Antalya Flughafen Hotel Transfer, Privattransfer vom Flughafen Antalya zum Hotel, VIP Transfer Antalya Airport nach Belek, Side Hotel Transfer Antalya Airport, Land of Legends Privattransfer, Nachttransfer Flughafen Antalya, Alternative zum Taxi, Titanic Deluxe Lara Transfer"
      : locale === "ru"
      ? "трансфер из аэропорта Анталии, VIP трансфер Анталья, частный трансфер Анталья, трансфер Белек, трансфер Сиде, трансфер Аланья, трансфер Кемер, трансфер в отель из аэропорта Анталии, частный трансфер в отель, VIP трансфер Анталия Белек, трансфер в отель Сиде, трансфер Land of Legends, ночной трансфер аэропорт Анталья, трансфер вместо такси, Titanic Deluxe Lara трансфер"
      : locale === "pl"
      ? "transfer z lotniska Antalya, VIP transfer Antalya, prywatny transfer Antalya, transfer Belek, transfer Side, transfer Alanya, transfer do hotelu z lotniska Antalya, prywatny transfer do hotelu, transfer VIP Antalya do Belek, transfer do hotelu Side, transfer Land of Legends, nocny transfer z lotniska Antalya, transfer zamiast taksówki, Titanic Deluxe Lara transfer"
      : locale === "nl"
      ? "antalya airport transfer, antalya private transfer, transfer luchthaven Antalya, privétransfer Antalya, VIP transfer Antalya, transfer Belek, transfer Side, transfer Alanya, transfer Kemer, hotel transfer Antalya, luchthaven Antalya naar hotel, Land of Legends transfer, nachttransfer luchthaven Antalya, transfer in plaats van taxi, Titanic Deluxe Lara transfer"
      : locale === "ro"
      ? "transfer aeroport Antalya, transfer privat Antalya, transfer VIP Antalya, transfer Belek, transfer Side, transfer Alanya, transfer Kemer, transfer aeroport Antalya la hotel, transfer privat de la aeroportul Antalya la hotel, transfer VIP Antalya Belek, transfer hotel Side aeroport Antalya, transfer Land of Legends, transfer de noapte aeroport Antalya, transfer in loc de taxi, transfer Titanic Deluxe Lara"
      : "antalya airport transfer, antalya vip transfer, private transfer antalya airport, belek transfer, side transfer, alanya transfer, kemer transfer, antalya airport hotel transfer, private transfer from antalya airport to hotel, vip transfer antalya airport to belek, side hotel transfer antalya airport, Land of Legends private transfer, late night airport transfer, fixed price transfer instead of taxi, Titanic Deluxe Lara transfer",
  }, seoRow, locale);
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Approved reviews, for both the LocalBusiness aggregateRating below and the
  // Product node that can actually render stars in the SERP.
  const supabase = createAdminClient();
  const { data: reviewData } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, created_at, published_at, author_name, locale, customers(first_name)"
    )
    .eq("is_approved", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(50);
  const reviewList = forLocale((reviewData ?? []) as unknown as ReviewRow[], locale);
  const ratings = aggregateReviews(reviewList);
  const avgRating = ratings.count >= 5 ? ratings.value?.toFixed(1) ?? null : null;
  const reviewCount = ratings.count;

  // JSON-LD Structured Data
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TORVIAN Transfer",
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo.png`,
    description: "Antalya Airport VIP Transfer Service",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Antalya",
      addressRegion: "Antalya",
      addressCountry: "TR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+90-546-940-79-55",
      contactType: "customer service",
      availableLanguage: ["Turkish", "English", "German", "Russian", "Polish", "Dutch"],
    },
    sameAs: [
      "https://instagram.com/torviantransfer",
      "https://facebook.com/torviantransfer",
    ],
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "TORVIAN Transfer",
    image: `${BASE_URL}/images/og-default.jpg`,
    url: BASE_URL,
    telephone: "+90-546-940-79-55",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kemerağzı Mah. Antalya Havalimanı Dış Hatlar Terminali",
      addressLocality: "Muratpaşa",
      addressRegion: "Antalya",
      postalCode: "07230",
      addressCountry: "TR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 36.8987,
      longitude: 30.8005,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "00:00",
        closes: "23:59",
      },
    ],
    // AggregateRating — only included when 5+ approved reviews exist in DB
    ...(avgRating ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating,
        reviewCount: reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  };

  // LocalBusiness keeps its aggregateRating above for the knowledge-panel
  // signal, but Google has not rendered star snippets for self-serving
  // LocalBusiness reviews since 2019. This Product node is the one that can
  // -- see the note at the top of src/lib/reviews.ts. It emits nothing when
  // there are too few approved reviews to back a rating honestly.
  const reviewProductSchema = productSchema({
    name: "Antalya Havalimani Transfer",
    description:
      "Antalya Havalimani'ndan Belek, Side, Alanya, Kemer ve tum otellere sabit fiyatli ozel VIP transfer.",
    url: `${BASE_URL}/${locale}`,
    image: `${BASE_URL}/images/og-default.jpg`,
    reviews: reviewList,
  });

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TORVIAN Transfer",
    url: BASE_URL,
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/${locale}/regions`,
      "query-input": "required name=search_term_string",
    },
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    name: "Antalya Airport VIP Transfer",
    provider: {
      "@type": "Organization",
      name: "TORVIAN Transfer",
      telephone: "+90-546-940-79-55",
      url: BASE_URL,
    },
    areaServed: [
      { "@type": "City", name: "Antalya" },
      { "@type": "City", name: "Belek" },
      { "@type": "City", name: "Side" },
      { "@type": "City", name: "Alanya" },
      { "@type": "City", name: "Kemer" },
      { "@type": "City", name: "Kaş" },
      { "@type": "City", name: "Kalkan" },
      { "@type": "City", name: "Fethiye" },
    ],
    serviceType: "Airport Transfer",
    description: "Premium VIP transfer service from Antalya Airport to all resort destinations including Belek, Side, Alanya, Kemer, and more.",
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${BASE_URL}/${locale}/booking`,
      servicePhone: "+90-546-940-79-55",
      availableLanguage: ["Turkish", "English", "German", "Russian", "Polish", "Dutch"],
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "35",
      highPrice: "180",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "TORVIAN Transfer",
        item: BASE_URL,
      },
    ],
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {reviewProductSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewProductSchema) }}
        />
      )}

      <Header />
      <main className="flex-1">
        <HeroSection />
        <TrustBadges />
        <RegionsPreview />
        <VehicleShowcase />
        <HowItWorks />
        <TestimonialsSection />
        <HomeFAQ />
        <CTASection />
        <LocalSeoBlock />
        <BlogPreview locale={locale} />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
