import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
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
  const t = await getTranslations({ locale, namespace: "meta" });

  const titleByLocale: Record<string, string> = {
    tr: "Antalya Havalimanı VIP Transfer | Belek, Side, Alanya, Kemer",
    en: "Antalya Airport VIP Transfer | Private Transfer to Belek, Side, Alanya, Kemer",
    de: "VIP Flughafentransfer Antalya | Privattransfer nach Belek, Side, Alanya, Kemer",
    pl: "Transfer VIP z lotniska Antalya | Transfer do Belek, Side, Alanya, Kemer",
    ru: "VIP трансфер из аэропорта Анталии | Белек, Сиде, Аланья, Кемер",
  };

  const descriptionByLocale: Record<string, string> = {
    tr: "Antalya Havalimanı'ndan Belek, Side, Alanya, Kemer ve tüm tatil bölgelerine özel VIP transfer. Sabit fiyat, uçuş takibi, online rezervasyon.",
    en: "Private transfer from Antalya Airport to Belek, Side, Alanya, Kemer and all Antalya resorts. Fixed price, flight tracking, instant booking.",
    de: "Privater VIP-Transfer vom Flughafen Antalya nach Belek, Side, Alanya, Kemer und allen Resorts. Festpreis, Flugverfolgung, sofortige Buchung.",
    pl: "Prywatny transfer VIP z lotniska Antalya do Belek, Side, Alanya, Kemer i wszystkich kurortów. Stała cena, śledzenie lotu, szybka rezerwacja.",
    ru: "Частный VIP-трансфер из аэропорта Анталии в Белек, Сиде, Аланью, Кемер и другие курорты. Фиксированная цена, отслеживание рейса, онлайн-бронирование.",
  };

  return {
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
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${BASE_URL}/${locale}`,
      siteName: "TORVIAN Transfer",
      type: "website",
      locale: locale === "tr" ? "tr_TR" : locale === "de" ? "de_DE" : locale === "pl" ? "pl_PL" : locale === "ru" ? "ru_RU" : "en_US",
      images: [{ url: `${BASE_URL}/images/og-default.jpg`, width: 1200, height: 630, alt: "TORVIAN Transfer - Antalya Airport VIP Transfer" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [`${BASE_URL}/images/og-default.jpg`],
    },
    keywords: locale === "tr"
      ? "antalya havalimanı transfer, antalya vip transfer, havalimanı transfer, antalya özel transfer, belek transfer, side transfer, alanya transfer, kemer transfer, antalya havalimanı otel transferi, antalya havalimanından otellere özel transfer, antalya havalimanı belek transfer, antalya havalimanı side transfer, antalya havalimanı alanya transfer, antalya havalimanı kemer transfer"
      : locale === "de"
      ? "Antalya Flughafen Transfer, VIP Transfer Antalya, Privattransfer Antalya, Flughafen Transfer Türkei, Belek Transfer, Side Transfer, Alanya Transfer, Kemer Transfer, Antalya Flughafen Hotel Transfer, Privattransfer vom Flughafen Antalya zum Hotel, VIP Transfer Antalya Airport nach Belek, Side Hotel Transfer Antalya Airport"
      : locale === "ru"
      ? "трансфер из аэропорта Анталии, VIP трансфер Анталья, частный трансфер Анталья, трансфер Белек, трансфер Сиде, трансфер Аланья, трансфер Кемер, трансфер в отель из аэропорта Анталии, частный трансфер в отель, VIP трансфер Анталия Белек, трансфер в отель Сиде"
      : locale === "pl"
      ? "transfer z lotniska Antalya, VIP transfer Antalya, prywatny transfer Antalya, transfer Belek, transfer Side, transfer Alanya, transfer do hotelu z lotniska Antalya, prywatny transfer do hotelu, transfer VIP Antalya do Belek, transfer do hotelu Side"
      : "antalya airport transfer, antalya vip transfer, private transfer antalya airport, belek transfer, side transfer, alanya transfer, kemer transfer, antalya airport hotel transfer, private transfer from antalya airport to hotel, vip transfer antalya airport to belek, side hotel transfer antalya airport",
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Fetch approved reviews for AggregateRating schema
  const supabase = createAdminClient();
  const { data: reviewData } = await supabase
    .from("reviews")
    .select("rating")
    .eq("is_approved", true);
  const reviewList = reviewData ?? [];
  const reviewCount = reviewList.length;
  const avgRating = reviewCount >= 5
    ? (reviewList.reduce((s, r) => s + (r.rating as number), 0) / reviewCount).toFixed(1)
    : null;

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
      availableLanguage: ["Turkish", "English", "German", "Russian", "Polish"],
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
      availableLanguage: ["Turkish", "English", "German", "Russian", "Polish"],
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
