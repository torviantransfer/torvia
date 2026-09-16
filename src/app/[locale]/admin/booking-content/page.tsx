import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { locales } from "@/i18n/config";
import {
  FAQ_COUNT,
  GUIDE_SECTION_COUNT,
  TRUST_CARD_COUNT,
  readBookingContent,
} from "@/lib/bookingContent";
import BookingContentEditor, { type BookingContentDefaults } from "@/components/admin/booking/BookingContentEditor";

// Saving calls router.refresh(), so this must never be served from a prerender.
export const dynamic = "force-dynamic";

export const metadata = { title: "Booking Sayfası İçeriği — TORVIAN Admin" };

/** /booking'in sabit metinlerini panelden düzenlemek için: bkz. migration 105. */
export default async function AdminBookingContentPage() {
  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("settings")
    .select("key, value")
    .eq("key", "booking_page_content")
    .maybeSingle();

  // What the public page shows where nothing has been written — the same
  // src/messages/<locale>.json text it always used. The editor puts it in the
  // fields so nobody edits against an empty box.
  const defaults: Record<string, BookingContentDefaults> = {};
  for (const l of locales) {
    const t = await getTranslations({ locale: l, namespace: "booking" });
    defaults[l] = {
      trustCards: [
        { title: t("seoFlightTracking"), desc: t("seoFlightTrackingDesc") },
        { title: t("seoInsured"), desc: t("seoInsuredDesc") },
        { title: t("seoSecurePayment"), desc: t("seoSecurePaymentDesc") },
        { title: t("seo247"), desc: t("seo247Desc") },
        { title: t("seoDoorToDoor"), desc: t("seoDoorToDoorDesc") },
        { title: t("seoNoHidden"), desc: t("seoNoHiddenDesc") },
      ].slice(0, TRUST_CARD_COUNT),
      guideHeading: t("guideHeading"),
      guideSections: [
        { title: t("guide1Title"), body: t("guide1Body") },
        { title: t("guide2Title"), body: t("guide2Body") },
        { title: t("guide3Title"), body: t("guide3Body") },
        { title: t("guide4Title"), body: t("guide4Body") },
      ].slice(0, GUIDE_SECTION_COUNT),
      faqTitle: t("seoFaqTitle"),
      faq: [
        { question: t("seoFaq1Q"), answer: t("seoFaq1A") },
        { question: t("seoFaq2Q"), answer: t("seoFaq2A") },
        { question: t("seoFaq3Q"), answer: t("seoFaq3A") },
        { question: t("seoFaq4Q"), answer: t("seoFaq4A") },
        { question: t("seoFaq5Q"), answer: t("seoFaq5A") },
        { question: t("seoFaq6Q"), answer: t("seoFaq6A") },
        { question: t("seoFaq7Q"), answer: t("seoFaq7A") },
        { question: t("seoFaq8Q"), answer: t("seoFaq8A") },
      ].slice(0, FAQ_COUNT),
      closingText: t("seoTextBlock"),
    };
  }

  return (
    <BookingContentEditor
      settingsRowExists={Boolean(row)}
      defaults={defaults}
      content={readBookingContent(row?.value, locales)}
    />
  );
}
