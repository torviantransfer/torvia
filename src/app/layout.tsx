import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://torviantransfer.com"),
  title: {
    default: "TORVIAN Transfer | Antalya Airport VIP Transfer",
    template: "%s | TORVIAN Transfer",
  },
  description: "Antalya Airport VIP Transfer Service - Professional private transfer to Belek, Side, Alanya, Kemer and all resort destinations. 24/7 service, flight tracking, fixed prices.",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "TORVIAN Transfer",
    images: [{ url: "/images/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "6tbn128E8xa0iJkgAvTUH1WAokmjvis3MbCF_jCMANg",
  },
};

export const viewport: Viewport = {
  themeColor: "#111113",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <Analytics />
      <Script
        id="google-ads-gtag"
        src="https://www.googletagmanager.com/gtag/js?id=AW-18125256328"
        strategy="afterInteractive"
      />
      <Script id="google-ads-config" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'AW-18125256328');`}
      </Script>
    </>
  );
}
