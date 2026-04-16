"use server";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import { MapPin, Clock, CheckCircle, Shield, Star, Plane, ArrowRight, CreditCard } from "lucide-react";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo";

type Locale = "tr" | "en" | "de" | "pl" | "ru";

const content: Record<Locale, {
  title: string;
  metaDesc: string;
  heading: string;
  subheading: string;
  desc: string;
  distance: string;
  duration: string;
  features: string[];
  faqQ1: string; faqA1: string;
  faqQ2: string; faqA2: string;
  faqQ3: string; faqA3: string;
  faqQ4: string; faqA4: string;
  bookCta: string;
  whyTitle: string;
}> = {
  en: {
    title: "Land of Legends Transfer | Antalya Airport to Land of Legends",
    metaDesc: "Private VIP transfer from Antalya Airport to Land of Legends Theme Park Belek. ~30 min, 35 km. Fixed price, meet & greet, free flight tracking. Book online.",
    heading: "Antalya Airport → Land of Legends Transfer",
    subheading: "Private VIP transfer to the most popular theme park in Turkey. Fixed price, no waiting.",
    desc: "Land of Legends Theme Park is located in Belek, approximately 35 km east of Antalya Airport. With TORVIAN's private VIP transfer service, you can reach the park in around 30 minutes in complete comfort — no taxis, no waiting, no surprises.",
    distance: "35 km",
    duration: "~30 min",
    features: [
      "Direct door-to-door transfer from Antalya Airport (AYT)",
      "Fixed price — no meter, no surge pricing",
      "Meet & greet with name sign at arrivals hall",
      "Free flight tracking — we wait if your flight is delayed",
      "Mercedes Vito VIP with air conditioning & free Wi-Fi",
      "Free cancellation up to 24 hours before",
      "24/7 WhatsApp support in English, German, Polish, Russian",
    ],
    faqQ1: "How far is Land of Legends from Antalya Airport?",
    faqA1: "Land of Legends Theme Park in Belek is approximately 35 km from Antalya Airport (AYT). The transfer takes around 30 minutes by private vehicle.",
    faqQ2: "How much does a transfer to Land of Legends cost?",
    faqA2: "Our fixed-price transfer to Land of Legends starts from a set rate per vehicle (not per person). The exact price is shown during booking. No hidden fees.",
    faqQ3: "Can I book a return transfer from Land of Legends to Antalya Airport?",
    faqA3: "Yes, we offer round-trip transfers. You can select return transfer during booking and get a discounted combined rate.",
    faqQ4: "Does the driver wait at the park entrance?",
    faqA4: "For hotel pickups and return transfers, your driver will be at the meeting point at the scheduled time. For airport arrivals, we track your flight and meet you at the arrivals hall.",
    bookCta: "Book Your Transfer",
    whyTitle: "Why Book with TORVIAN?",
  },
  de: {
    title: "Land of Legends Transfer | Flughafen Antalya nach Land of Legends",
    metaDesc: "Privater VIP-Transfer vom Flughafen Antalya zum Land of Legends Freizeitpark Belek. ~30 Min, 35 km. Festpreis, Meet & Greet, kostenlose Flugverfolgung. Online buchen.",
    heading: "Flughafen Antalya → Land of Legends Transfer",
    subheading: "Privater VIP-Transfer in den beliebtesten Freizeitpark der Türkei. Festpreis, keine Wartezeit.",
    desc: "Der Land of Legends Theme Park befindet sich in Belek, etwa 35 km östlich vom Flughafen Antalya. Mit dem privaten VIP-Transfer von TORVIAN erreichen Sie den Park in etwa 30 Minuten — kein Taxi, keine Wartezeit, keine Überraschungen.",
    distance: "35 km",
    duration: "~30 Min",
    features: [
      "Direkttransfer vom Flughafen Antalya (AYT)",
      "Festpreis — kein Taxameter, keine Preisschwankungen",
      "Meet & Greet mit Namensschild in der Ankunftshalle",
      "Kostenlose Flugverfolgung — wir warten bei Verspätung",
      "Mercedes Vito VIP mit Klimaanlage & kostenlosem WLAN",
      "Kostenlose Stornierung bis 24 Stunden vorher",
      "24/7 WhatsApp-Support auf Deutsch",
    ],
    faqQ1: "Wie weit ist der Land of Legends vom Flughafen Antalya entfernt?",
    faqA1: "Der Land of Legends Freizeitpark in Belek liegt etwa 35 km vom Flughafen Antalya (AYT) entfernt. Die Fahrt dauert mit einem Privatfahrzeug ca. 30 Minuten.",
    faqQ2: "Was kostet ein Transfer zum Land of Legends?",
    faqA2: "Unser Festpreistransfer zum Land of Legends beginnt ab einem festen Preis pro Fahrzeug (nicht pro Person). Der genaue Preis wird bei der Buchung angezeigt. Keine versteckten Gebühren.",
    faqQ3: "Kann ich einen Rücktransfer vom Land of Legends zum Flughafen buchen?",
    faqA3: "Ja, wir bieten Hin- und Rücktransfers an. Beim Buchen können Sie den Rücktransfer auswählen und erhalten einen vergünstigten Kombinationspreis.",
    faqQ4: "Wartet der Fahrer am Parkeingang?",
    faqA4: "Bei Hotel-Abholungen und Rücktransfers ist Ihr Fahrer zum vereinbarten Zeitpunkt am Treffpunkt. Bei Flughafenankünften verfolgen wir Ihren Flug und empfangen Sie in der Ankunftshalle.",
    bookCta: "Jetzt Transfer Buchen",
    whyTitle: "Warum TORVIAN wählen?",
  },
  pl: {
    title: "Transfer Land of Legends | Lotnisko Antalya do Land of Legends",
    metaDesc: "Prywatny transfer VIP z lotniska Antalya do parku rozrywki Land of Legends w Belek. ~30 min, 35 km. Stała cena, meet & greet, śledzenie lotu. Rezerwuj online.",
    heading: "Lotnisko Antalya → Transfer Land of Legends",
    subheading: "Prywatny transfer VIP do najpopularniejszego parku rozrywki w Turcji. Stała cena, bez czekania.",
    desc: "Park rozrywki Land of Legends znajduje się w Belek, około 35 km na wschód od lotniska Antalya. Dzięki prywatnemu transferowi VIP TORVIAN dotrzesz do parku w około 30 minut — bez taksówek, bez czekania, bez niespodzianek.",
    distance: "35 km",
    duration: "~30 min",
    features: [
      "Bezpośredni transfer z lotniska Antalya (AYT)",
      "Stała cena — bez licznika, bez zmiennych opłat",
      "Meet & greet z tabliczką z nazwiskiem w hali przylotów",
      "Bezpłatne śledzenie lotu — czekamy przy opóźnieniu",
      "Mercedes Vito VIP z klimatyzacją i bezpłatnym Wi-Fi",
      "Bezpłatna anulacja do 24 godzin wcześniej",
      "Wsparcie WhatsApp 24/7 po polsku",
    ],
    faqQ1: "Jak daleko jest Land of Legends od lotniska Antalya?",
    faqA1: "Park rozrywki Land of Legends w Belek leży około 35 km od lotniska Antalya (AYT). Transfer prywatnym pojazdem trwa około 30 minut.",
    faqQ2: "Ile kosztuje transfer do Land of Legends?",
    faqA2: "Nasz transfer w stałej cenie do Land of Legends zaczyna się od ustalonej stawki za pojazd (nie za osobę). Dokładna cena jest widoczna podczas rezerwacji. Brak ukrytych opłat.",
    faqQ3: "Czy mogę zarezerwować transfer powrotny z Land of Legends na lotnisko?",
    faqA3: "Tak, oferujemy transfery w obie strony. Możesz wybrać transfer powrotny podczas rezerwacji i otrzymać zniżkę na kombinację.",
    faqQ4: "Czy kierowca czeka przy wejściu do parku?",
    faqA4: "Przy odbiorach z hotelu i transferach powrotnych kierowca będzie na miejscu spotkania o umówionej godzinie. Przy przylocie śledzimy Twój lot i czekamy w hali przylotów.",
    bookCta: "Zarezerwuj Transfer",
    whyTitle: "Dlaczego TORVIAN?",
  },
  ru: {
    title: "Трансфер Land of Legends | Аэропорт Анталья — Land of Legends",
    metaDesc: "Частный VIP-трансфер из аэропорта Анталья в парк развлечений Land of Legends в Белеке. ~30 мин, 35 км. Фиксированная цена, встреча в аэропорту, отслеживание рейса. Онлайн-бронирование.",
    heading: "Аэропорт Анталья → Трансфер Land of Legends",
    subheading: "Частный VIP-трансфер в самый популярный парк развлечений Турции. Фиксированная цена, без ожидания.",
    desc: "Парк развлечений Land of Legends расположен в Белеке, примерно в 35 км к востоку от аэропорта Анталья. С частным VIP-трансфером TORVIAN вы доберётесь до парка примерно за 30 минут — без такси, без ожидания, без сюрпризов.",
    distance: "35 км",
    duration: "~30 мин",
    features: [
      "Прямой трансфер из аэропорта Анталья (AYT)",
      "Фиксированная цена — без счётчика, без скачков цены",
      "Встреча с табличкой с именем в зале прилёта",
      "Бесплатное отслеживание рейса — ждём при задержке",
      "Mercedes Vito VIP с кондиционером и бесплатным Wi-Fi",
      "Бесплатная отмена за 24 часа до поездки",
      "Поддержка WhatsApp 24/7 на русском языке",
    ],
    faqQ1: "Как далеко Land of Legends от аэропорта Анталья?",
    faqA1: "Парк развлечений Land of Legends в Белеке находится примерно в 35 км от аэропорта Анталья (AYT). Поездка на частном автомобиле занимает около 30 минут.",
    faqQ2: "Сколько стоит трансфер в Land of Legends?",
    faqA2: "Наш трансфер по фиксированной цене в Land of Legends начинается от установленной ставки за автомобиль (не за человека). Точная цена отображается при бронировании. Никаких скрытых платежей.",
    faqQ3: "Можно ли заказать обратный трансфер из Land of Legends в аэропорт?",
    faqA3: "Да, мы предлагаем трансферы туда и обратно. При бронировании вы можете выбрать обратный трансфер и получить скидку.",
    faqQ4: "Водитель ждёт у входа в парк?",
    faqA4: "При заборе из отеля и обратных трансферах водитель будет на месте встречи в назначенное время. При прилёте мы отслеживаем рейс и встречаем вас в зале прилёта.",
    bookCta: "Забронировать Трансфер",
    whyTitle: "Почему TORVIAN?",
  },
  tr: {
    title: "Land of Legends Transfer | Antalya Havalimanı'ndan Land of Legends'a",
    metaDesc: "Antalya Havalimanı'ndan Land of Legends Belek'e özel VIP transfer. ~30 dk, 35 km. Sabit fiyat, karşılama, uçuş takibi. Online rezervasyon yapın.",
    heading: "Antalya Havalimanı → Land of Legends Transfer",
    subheading: "Türkiye'nin en popüler tema parkına özel VIP transfer. Sabit fiyat, bekleme yok.",
    desc: "Land of Legends Tema Parkı, Antalya Havalimanı'nın yaklaşık 35 km doğusunda Belek'te yer almaktadır. TORVIAN'ın özel VIP transfer hizmetiyle yaklaşık 30 dakikada parka ulaşırsınız — taksi yok, bekleme yok, sürpriz yok.",
    distance: "35 km",
    duration: "~30 dk",
    features: [
      "Antalya Havalimanı (AYT)'ndan kapıdan kapıya direkt transfer",
      "Sabit fiyat — taksimetre yok, gizli ücret yok",
      "Varış salonunda isim tabelasıyla karşılama",
      "Ücretsiz uçuş takibi — gecikmede bekliyoruz",
      "Klimalı ve ücretsiz Wi-Fi'lı Mercedes Vito VIP",
      "24 saate kadar ücretsiz iptal",
      "7/24 Türkçe WhatsApp desteği",
    ],
    faqQ1: "Land of Legends Antalya Havalimanı'na ne kadar uzak?",
    faqA1: "Belek'teki Land of Legends Tema Parkı, Antalya Havalimanı'na (AYT) yaklaşık 35 km uzaklıktadır. Özel araçla transfer yaklaşık 30 dakika sürmektedir.",
    faqQ2: "Land of Legends transferi ne kadar tutar?",
    faqA2: "Land of Legends'a sabit fiyatlı transferimiz araç başına (kişi başına değil) belirli bir ücretle başlamaktadır. Kesin fiyat rezervasyon sırasında gösterilir. Gizli ücret yoktur.",
    faqQ3: "Land of Legends'tan havalimanına dönüş transferi rezervasyonu yapabilir miyim?",
    faqA3: "Evet, gidiş-dönüş transferi sunuyoruz. Rezervasyon sırasında dönüş transferini seçerek indirimli kombinasyon fiyatından yararlanabilirsiniz.",
    faqQ4: "Şoför park girişinde bekliyor mu?",
    faqA4: "Otel alımı ve dönüş transferlerinde şoförünüz belirlenen saatte buluşma noktasında olacaktır. Havalimanı varışlarında uçuşunuzu takip ediyor ve varış salonunda karşılıyoruz.",
    bookCta: "Transfer Rezervasyonu Yap",
    whyTitle: "Neden TORVIAN?",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale as Locale) in content ? (locale as Locale) : "en";
  const c = content[loc];
  const path = "/land-of-legends-transfer";

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: c.faqQ1, acceptedAnswer: { "@type": "Answer", text: c.faqA1 } },
      { "@type": "Question", name: c.faqQ2, acceptedAnswer: { "@type": "Answer", text: c.faqA2 } },
      { "@type": "Question", name: c.faqQ3, acceptedAnswer: { "@type": "Answer", text: c.faqA3 } },
      { "@type": "Question", name: c.faqQ4, acceptedAnswer: { "@type": "Answer", text: c.faqA4 } },
    ],
  };

  return {
    title: c.title,
    description: c.metaDesc,
    alternates: {
      canonical: `https://torviantransfer.com/${loc}${path}`,
      languages: {
        "x-default": `https://torviantransfer.com/en${path}`,
        tr: `https://torviantransfer.com/tr${path}`,
        en: `https://torviantransfer.com/en${path}`,
        de: `https://torviantransfer.com/de${path}`,
        pl: `https://torviantransfer.com/pl${path}`,
        ru: `https://torviantransfer.com/ru${path}`,
      },
    },
    openGraph: seoOpenGraph(loc, path, c.title, c.metaDesc, "/images/regions/belek-golf.jpg"),
    twitter: seoTwitter(c.title, c.metaDesc, "/images/regions/belek-golf.jpg"),
    other: {
      "application/ld+json": JSON.stringify(schema),
    },
  };
}

export default async function LandOfLegendsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = (locale as Locale) in content ? (locale as Locale) : "en";
  const c = content[loc];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: c.faqQ1, acceptedAnswer: { "@type": "Answer", text: c.faqA1 } },
      { "@type": "Question", name: c.faqQ2, acceptedAnswer: { "@type": "Answer", text: c.faqA2 } },
      { "@type": "Question", name: c.faqQ3, acceptedAnswer: { "@type": "Answer", text: c.faqA3 } },
      { "@type": "Question", name: c.faqQ4, acceptedAnswer: { "@type": "Answer", text: c.faqA4 } },
    ],
  };

  const whyPoints = [
    { icon: "✓", text: loc === "en" ? "Fixed price, no surprises" : loc === "de" ? "Festpreis, keine Überraschungen" : loc === "pl" ? "Stała cena, bez niespodzianek" : loc === "ru" ? "Фиксированная цена, без сюрпризов" : "Sabit fiyat, sürpriz yok" },
    { icon: "✓", text: loc === "en" ? "Flight tracking & free waiting" : loc === "de" ? "Flugverfolgung & kostenlose Wartezeit" : loc === "pl" ? "Śledzenie lotu i bezpłatne czekanie" : loc === "ru" ? "Отслеживание рейса и бесплатное ожидание" : "Uçuş takibi ve ücretsiz bekleme" },
    { icon: "✓", text: loc === "en" ? "Meet & greet at arrivals" : loc === "de" ? "Empfang in der Ankunftshalle" : loc === "pl" ? "Powitanie w hali przylotów" : loc === "ru" ? "Встреча в зале прилёта" : "Varış salonunda karşılama" },
    { icon: "✓", text: loc === "en" ? "Secure online booking & payment" : loc === "de" ? "Sichere Online-Buchung & Zahlung" : loc === "pl" ? "Bezpieczna rezerwacja i płatność online" : loc === "ru" ? "Безопасное онлайн-бронирование и оплата" : "Güvenli online rezervasyon ve ödeme" },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pb-16 pt-24 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(255,149,0,0.03) 50%, #FFFFFF 100%)" }}>
          <div className="relative max-w-7xl mx-auto px-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-gray-900">Land of Legends Transfer</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-3xl lg:text-5xl font-bold mb-4 tracking-tight text-gray-900">
                  {c.heading}
                </h1>
                <p className="text-base lg:text-lg text-gray-500 mb-6 leading-relaxed">
                  {c.desc}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <Clock size={16} className="text-blue-600" strokeWidth={1.5} />
                    <span className="text-sm text-gray-900">{c.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <MapPin size={16} className="text-blue-600" strokeWidth={1.5} />
                    <span className="text-sm text-gray-900">{c.distance}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <Star size={16} className="text-yellow-500" strokeWidth={1.5} />
                    <span className="text-sm text-gray-900">4.9★</span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base transition-all"
                  style={{ background: "linear-gradient(135deg, #007AFF 0%, #0056CC 100%)" }}
                >
                  {c.bookCta}
                  <ArrowRight size={18} />
                </Link>
              </div>

              {/* Image */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                <img
                  src="/images/regions/belek-golf.jpg"
                  alt="Land of Legends Transfer Belek"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="text-sm font-medium">Land of Legends · Belek</div>
                  <div className="text-xs opacity-80">Antalya Airport · {c.distance} · {c.duration}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">{c.whyTitle}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {c.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <CheckCircle size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16" style={{ background: "#F5F5F7" }}>
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">FAQ</h2>
            <div className="space-y-4">
              {[
                { q: c.faqQ1, a: c.faqA1 },
                { q: c.faqQ2, a: c.faqA2 },
                { q: c.faqQ3, a: c.faqA3 },
                { q: c.faqQ4, a: c.faqA4 },
              ].map((item, i) => (
                <div key={i} className="rounded-xl bg-white p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 bg-white">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <Plane size={32} className="text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{c.bookCta}</h2>
            <p className="text-gray-500 mb-6">{c.subheading}</p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base"
              style={{ background: "linear-gradient(135deg, #007AFF 0%, #0056CC 100%)" }}
            >
              {c.bookCta}
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <WhatsAppButton />
      <Footer />
    </>
  );
}
