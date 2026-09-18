import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/* With the site's own header and footer, so a visitor who followed a dead
   link still has the navigation, the booking link and the contact details
   in front of them — the bare page it replaced offered one button and
   nothing else. Header reads the query string, hence the Suspense boundary
   this page may be pre-rendered without. */
export default function LocaleNotFound() {
  const t = useTranslations("notFound");

  return (
    <>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main className="flex min-h-[70vh] items-center justify-center bg-white px-4 pb-16 pt-32">
        <div className="text-center">
          <p className="mb-3 text-[88px] font-semibold leading-none tracking-[-0.04em] text-[#d1d1d6]">404</p>
          <h1 className="mb-2 text-[24px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">{t("title")}</h1>
          <p className="mb-8 text-[15px] text-[#6e6e73]">{t("description")}</p>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-[12px] bg-[#007AFF] px-7 text-[15px] font-semibold text-white transition hover:bg-[#0062CC] active:scale-[0.98]"
          >
            {t("goHome")}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
