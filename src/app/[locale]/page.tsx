import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
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

  return {
    title: t("title"),
    description: t("description"),
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
      ? "antalya havalimanı transfer, antalya vip transfer, havalimanı transfer, antalya özel transfer, belek transfer, side transfer, alanya transfer, kemer transfer, antalya havalimanı taksi, özel şoför, lüks transfer"
      : locale === "de"
      ? "Antalya Flughafen Transfer, VIP Transfer Antalya, Privattransfer Antalya, Flughafen Transfer Türkei, Belek Transfer, Side Transfer, Alanya Transfer, Kemer Transfer"
      : locale === "ru"
      ? "трансфер из аэропорта Анталии, ВИП трансфер Анталья, частный трансфер Анталья, трансфер Белек, трансфер Сиде, трансфер Аланья, трансфер Кемер"
      : locale === "pl"
      ? "transfer z lotniska Antalya, VIP transfer Antalya, prywatny transfer Antalya, transfer Belek, transfer Side, transfer Alanya"
      : "antalya airport transfer, antalya vip transfer, private transfer antalya airport, belek transfer, side transfer, alanya transfer, kemer transfer, turkey airport transfer",
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

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
      telephone: "+90-850-840-13-27",
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
    telephone: "+90-850-840-13-27",
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
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "1250",
      bestRating: "5",
      worstRating: "1",
    },
    review: [
      {
        "@type": "Review",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
        author: { "@type": "Person", name: "Thomas M." },
        datePublished: "2025-06-15",
        reviewBody: "Excellent VIP transfer service from Antalya Airport. Professional driver, clean Mercedes Vito, and very punctual.",
      },
      {
        "@type": "Review",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
        author: { "@type": "Person", name: "Anna K." },
        datePublished: "2025-07-22",
        reviewBody: "Best airport transfer in Antalya. The driver was waiting with a welcome sign, and the vehicle was spotless.",
      },
    ],
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TORVIAN Transfer",
    url: BASE_URL,
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/{locale}/regions`,
      "query-input": "required name=search_term_string",
    },
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Antalya Airport VIP Transfer",
    provider: {
      "@type": "Organization",
      name: "TORVIAN Transfer",
    },
    areaServed: {
      "@type": "Place",
      name: "Antalya, Turkey",
    },
    serviceType: "Airport Transfer",
    description: "Premium VIP transfer service from Antalya Airport to all resort destinations including Belek, Side, Alanya, Kemer, and more.",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "35",
      highPrice: "180",
      priceCurrency: "USD",
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
