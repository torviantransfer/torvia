import { turkishNameForms } from "@/lib/trSuffix";
import type { RegionFaqEntry } from "@/lib/regionContent";

/**
 * The text a region page shows when nobody has written its own.
 *
 * Shared by the public page, which renders it, and the admin's region editor,
 * which shows it inside the fields — so what the panel calls "automatic" is
 * the exact sentence a visitor reads, not a description of it.
 */

/** A `regionDetail` translator; loose on purpose so either caller's `t` fits. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Translate = (key: any, values?: any) => string;

export function formatDuration(minutes: number, locale: string): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (locale === "tr") return h > 0 ? `${h} saat${m > 0 ? ` ${m} dakika` : ""}` : `${m} dakika`;
  if (locale === "de") return h > 0 ? `${h} Std.${m > 0 ? ` ${m} Min.` : ""}` : `${m} Min.`;
  if (locale === "pl") return h > 0 ? `${h} godz.${m > 0 ? ` ${m} min` : ""}` : `${m} min`;
  if (locale === "ru") return h > 0 ? `${h} ч${m > 0 ? ` ${m} мин` : ""}` : `${m} мин`;
  if (locale === "nl") return h > 0 ? `${h} uur${m > 0 ? ` ${m} min` : ""}` : `${m} min`;
  if (locale === "ro") return h > 0 ? `${h} ${h === 1 ? "oră" : "ore"}${m > 0 ? ` ${m} min` : ""}` : `${m} min`;
  if (locale === "ar") {
    const hours = h === 1 ? "ساعة" : h === 2 ? "ساعتان" : h <= 10 ? "ساعات" : "ساعة";
    return h > 0 ? `${h} ${hours}${m > 0 ? ` ${m} دقيقة` : ""}` : `${m} دقيقة`;
  }
  return h > 0 ? `${h} hour${h !== 1 ? "s" : ""}${m > 0 ? ` ${m} min` : ""}` : `${m} min`;
}

/** The hero sentence under the heading. */
export function heroIntroDefault(name: string, locale: string): string {
  return locale === "tr"
    ? `${name} için Antalya Havalimanı'ndan özel VIP transfer. Sabit fiyat, profesyonel şoför, uçuş takibi ve online rezervasyon.`
    : locale === "de"
      ? `Privater VIP-Transfer vom Flughafen Antalya nach ${name}. Festpreis, professioneller Fahrer, Flugverfolgung und Online-Buchung.`
      : locale === "pl"
        ? `Prywatny transfer VIP z lotniska Antalya do ${name}. Stała cena, profesjonalny kierowca, śledzenie lotu i szybka rezerwacja.`
        : locale === "ru"
          ? `Частный VIP-трансфер из аэропорта Анталии в ${name}. Фиксированная цена, профессиональный водитель, отслеживание рейса и онлайн-бронирование.`
          : locale === "nl"
            ? `Privé VIP-transfer vanaf de luchthaven Antalya naar ${name}. Vaste prijs, professionele chauffeur, vluchtmonitoring en online reservering.`
            : locale === "ro"
              ? `Transfer privat VIP de la Aeroportul Antalya la ${name}. Preț fix, șofer profesionist, urmărirea zborului și rezervare online.`
              : `Private VIP transfer from Antalya Airport to ${name}. Fixed price, professional driver, flight tracking and online booking.`;
}

/** The generic paragraph under the region description. */
export function aboutDefault(t: Translate, name: string, durationMinutes: number | null): string {
  return t("aboutDescDefault", { name, ...turkishNameForms(name), duration: durationMinutes ?? 0 });
}

export function hotelsIntroText(name: string, locale: string): string {
  return locale === "tr"
    ? `${name} bölgesindeki tüm otellere hizmet veriyoruz, öne çıkanlar:`
    : locale === "de"
      ? `Wir bedienen alle Hotels in ${name}, darunter:`
      : locale === "pl"
        ? `Obsługujemy wszystkie hotele w ${name}, w tym:`
        : locale === "ru"
          ? `Мы обслуживаем все отели в ${name}, включая:`
          : locale === "nl"
            ? `Wij bedienen alle hotels in ${name}, waaronder:`
            : locale === "ro"
              ? `Deservim toate hotelurile din ${name}, printre care:`
              : locale === "ar"
                ? `نخدم جميع الفنادق في ${name}، ومنها:`
                : `We serve every hotel in ${name}, including:`;
}

function hotelsFaq(name: string, locale: string, hotels: string[]): RegionFaqEntry {
  const question = locale === "tr"
    ? `${name} bölgesinde hangi otellere transfer sağlıyorsunuz?`
    : locale === "de"
      ? `Welche Hotels in ${name} bedienen Sie?`
      : locale === "pl"
        ? `Do jakich hoteli w ${name} zapewniacie transfer?`
        : locale === "ru"
          ? `В какие отели в ${name} вы осуществляете трансфер?`
          : locale === "nl"
            ? `Welke hotels in ${name} bedient u?`
            : locale === "ro"
              ? `Către ce hoteluri din ${name} faceți transfer?`
              : locale === "ar"
                ? `إلى أي فنادق في ${name} توفّرون النقل؟`
                : `Which hotels in ${name} do you provide transfer to?`;
  const answer = locale === "tr"
    ? `${name} bölgesindeki tüm otellere transfer sağlıyoruz; öne çıkanlar arasında ${hotels.join(", ")} bulunur. Rezervasyon sırasında otel adınızı belirtmeniz yeterlidir.`
    : locale === "de"
      ? `Wir bedienen alle Hotels in ${name}, darunter ${hotels.join(", ")}. Geben Sie bei der Buchung einfach Ihren Hotelnamen an.`
      : locale === "pl"
        ? `Zapewniamy transfer do wszystkich hoteli w ${name}, w tym do ${hotels.join(", ")}. Wystarczy podać nazwę hotelu podczas rezerwacji.`
        : locale === "ru"
          ? `Мы осуществляем трансфер во все отели в ${name}, включая ${hotels.join(", ")}. Просто укажите название отеля при бронировании.`
          : locale === "nl"
            ? `Wij verzorgen transfers naar alle hotels in ${name}, waaronder ${hotels.join(", ")}. Vermeld gewoon uw hotelnaam tijdens het boeken.`
            : locale === "ro"
              ? `Facem transfer către toate hotelurile din ${name}, printre care ${hotels.join(", ")}. Este suficient să scrii numele hotelului la rezervare.`
              : locale === "ar"
                ? `نوفّر النقل إلى جميع الفنادق في ${name}، ومنها ${hotels.join("، ")}. يكفي كتابة اسم فندقك عند الحجز.`
                : `We provide transfer to every hotel in ${name}, including ${hotels.join(", ")}. Just enter your hotel name during booking.`;
  return { question, answer };
}

/**
 * The questions every region page carries, filled with this region's
 * figures. Region-specific questions written in the panel go above these.
 */
export function generalFaq(
  t: Translate,
  opts: {
    name: string;
    locale: string;
    durationMinutes: number | null;
    distanceKm: number | string | null;
    price: number;
    hotels: string[];
  }
): RegionFaqEntry[] {
  const { name, locale, durationMinutes, distanceKm, price, hotels } = opts;
  const nameForms = turkishNameForms(name);
  const duration = durationMinutes ? formatDuration(durationMinutes, locale) : "—";
  const distance = distanceKm ?? "—";
  return [
    { question: t("faqQ1", { name, ...nameForms }), answer: t("faqA1", { name, ...nameForms, duration, distance }) },
    { question: t("faqQ2", { name, ...nameForms }), answer: t("faqA2") },
    { question: t("faqQ3", { name }), answer: t("faqA3") },
    { question: t("faqQ4"), answer: t("faqA4") },
    { question: t("faqQ5", { name, ...nameForms }), answer: t("faqA5", { name, ...nameForms, price }) },
    { question: t("faqQ6", { name, ...nameForms }), answer: t("faqA6") },
    { question: t("faqQ7", { name }), answer: t("faqA7") },
    { question: t("faqQ8", { name }), answer: t("faqA8") },
    { question: t("faqQ9", { name, ...nameForms }), answer: t("faqA9", { name, ...nameForms }) },
    { question: t("faqQ10", { name }), answer: t("faqA10", { name, distance, duration }) },
    ...(hotels.length > 0 ? [hotelsFaq(name, locale, hotels)] : []),
  ];
}
