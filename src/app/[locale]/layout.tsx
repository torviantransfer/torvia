import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Inter, Montserrat, Noto_Sans_Arabic } from "next/font/google";
import { routing } from "@/i18n/routing";
import { localeDirection } from "@/i18n/config";
import CookieConsent from "@/components/CookieConsent";
import PresenceTracker from "@/components/analytics/PresenceTracker";
import MetaPageView from "@/components/analytics/MetaPageView";
import Script from "next/script";
import { PIXEL_ID, GOOGLE_ADS_ID } from "@/lib/pixel";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
});

/**
 * Inter carries no Arabic glyphs, and neither does Montserrat — which only
 * ever sets the Latin wordmark, so it needs none.
 *
 * Loaded with the Arabic subset alone: the @font-face it produces declares a
 * unicode-range covering Arabic script only, so a browser on the other seven
 * languages never requests the file. It costs those pages nothing, and it
 * means stray Arabic anywhere on the site renders properly rather than as
 * empty boxes.
 */
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
});

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["800", "900"],
  variable: "--font-montserrat",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID || PIXEL_ID;

  return (
    <html
      lang={locale}
      dir={localeDirection(locale)}
      className={`${inter.variable} ${montserrat.variable} ${notoArabic.variable} h-full`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* The tag and pixel scripts are the first third-party bytes the page
            waits on; opening those connections while the HTML is still
            parsing saves the DNS + TLS round trips. Kept to two origins —
            more hints than that start competing with each other. Fonts are
            not listed because next/font serves them from our own domain. */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');gtag('config','${GOOGLE_ADS_ID}');`}
            </Script>
          </>
        )}
        {/* The pageview is sent with an event id so the Conversions API can
            report the same pageview from the server and have Meta merge the
            two — see MetaPageView, which picks the id up from the window and
            takes over for client-side navigations. */}
        {fbPixelId && (
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fbPixelId}');var i=(window.crypto&&window.crypto.randomUUID)?window.crypto.randomUUID():'pv_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);window.__fbPageViewId=i;fbq('track','PageView',{},{eventID:i});`}
          </Script>
        )}
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased" style={{ backgroundColor: '#FFFFFF', color: '#1d1d1f' }} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          {children}
          <CookieConsent />
          <PresenceTracker />
          <MetaPageView />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
