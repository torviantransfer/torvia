import type { Metadata } from "next";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import { MapPin, Clock, CheckCircle, Star, Plane, ArrowRight } from "lucide-react";
import { seoOpenGraph, seoTwitter } from "@/lib/seo";

type Locale = "tr" | "en" | "de" | "pl" | "ru";

const content: Record<Locale, {
  title: string;
  metaDesc: string;
  heading: string;
  subheading: string;
  desc: string;
  distance: string;
  duration: string;
  hotels: string;
  features: string[];
  faqQ1: string; faqA1: string;
  faqQ2: string; faqA2: string;
  faqQ3: string; faqA3: string;
  faqQ4: string; faqA4: string;
  faqQ5: string; faqA5: string;
  bookCta: string;
  whyTitle: string;
  breadcrumb: string;
  taxiNote: string;
}> = {
  en: {
    title: "Antalya Airport to Lara Beach Transfer | Private VIP | ~20 min",
    metaDesc: "Private VIP transfer from Antalya Airport to Lara Beach (Kundu). ~20 min, 15 km. Fixed price, meet & greet, free flight tracking. Better than taxi — book online in 2 minutes.",
    heading: "Antalya Airport → Lara Beach Transfer",
    subheading: "Private VIP transfer to Lara Beach hotels — Aska Lara, Titanic Lara, Royal Seginus. Fixed price, no taxis, no waiting.",
    desc: "Lara Beach (Kundu) is one of Antalya's most popular resort areas, home to some of Turkey's finest 5-star hotels. Located just 15 km east of Antalya Airport (AYT), it's the closest major resort destination — only ~20 minutes by private transfer. Skip the taxi queue and arrive in comfort.",
    distance: "15 km",
    duration: "~20 min",
    hotels: "Aska Lara Resort & Spa, Titanic Deluxe Lara, Royal Seginus, Rixos Downtown Antalya",
    taxiNote: "Why choose a private transfer over a taxi? Fixed price agreed upfront, professional driver with name sign, free flight delay waiting — no surprises.",
    features: [
      "Direct door-to-door from Antalya Airport (AYT) to Lara Beach",
      "Fixed price — no meter, no surge, no haggling",
      "Meet & greet: driver with name sign at arrivals hall",
      "Free flight tracking — we wait if your flight is delayed",
      "Mercedes Vito VIP with A/C, Wi-Fi & child seats available",
      "Free cancellation up to 24 hours before departure",
      "24/7 WhatsApp support in English",
      "Covers all Lara Beach hotels: Aska Lara, Titanic, Royal Seginus & more",
    ],
    faqQ1: "How far is Lara Beach from Antalya Airport?",
    faqA1: "Lara Beach (Kundu area) is approximately 15 km from Antalya Airport (AYT). A private transfer takes around 20 minutes — making it the closest major resort area to the airport.",
    faqQ2: "Is a private transfer cheaper than a taxi from Antalya Airport to Lara Beach?",
    faqA2: "TORVIAN private transfers offer a fixed price agreed before your journey — unlike taxis where the meter runs. There are no hidden fees, no surge pricing, and your driver waits free of charge if your flight is delayed.",
    faqQ3: "Which hotels in Lara Beach do you serve?",
    faqA3: "We serve all hotels in the Lara Beach and Kundu area, including Aska Lara Resort & Spa, Titanic Deluxe Lara Beach Hotel, Royal Seginus Hotel, Rixos Downtown Antalya, Mardan Palace, and all others. Just enter your hotel name during booking.",
    faqQ4: "Can I book a return transfer from Lara Beach to Antalya Airport?",
    faqA4: "Yes. We offer both one-way and round-trip transfers. Book your return transfer from Lara Beach to Antalya Airport during the same booking and receive a discounted combined price.",
    faqQ5: "How do I find my driver at Antalya Airport?",
    faqA5: "Your driver will be waiting at the arrivals hall with a name sign showing your name. We track your flight in real time — if your flight is delayed, your driver will still be there at no extra charge.",
    bookCta: "Book Lara Beach Transfer",
    whyTitle: "Why Choose TORVIAN for Lara Beach?",
    breadcrumb: "Lara Beach Transfer",
  },
  de: {
    title: "Flughafen Antalya nach Lara Beach Transfer | Privat VIP | ~20 Min",
    metaDesc: "Privater VIP-Transfer vom Flughafen Antalya nach Lara Beach (Kundu). ~20 Min, 15 km. Festpreis, Meet & Greet, kostenlose Flugverfolgung. Besser als Taxi — in 2 Min. buchen.",
    heading: "Flughafen Antalya → Lara Beach Transfer",
    subheading: "Privater VIP-Transfer zu Lara Beach Hotels — Aska Lara, Titanic Lara, Royal Seginus. Festpreis, kein Taxi, kein Warten.",
    desc: "Lara Beach (Kundu) ist eines der beliebtesten Resortgebiete Antalyas und beherbergt einige der besten 5-Sterne-Hotels der Türkei. Nur 15 km östlich vom Flughafen Antalya (AYT) gelegen, ist es das nächste große Resort — nur ~20 Minuten mit dem Privattransfer.",
    distance: "15 km",
    duration: "~20 Min",
    hotels: "Aska Lara Resort & Spa, Titanic Deluxe Lara, Royal Seginus, Rixos Downtown Antalya",
    taxiNote: "Warum Privattransfer statt Taxi? Fester Preis im Voraus, professioneller Fahrer mit Namensschild, kostenlose Wartezeit bei Flugverspätung — keine Überraschungen.",
    features: [
      "Direkttransfer vom Flughafen Antalya (AYT) nach Lara Beach",
      "Festpreis — kein Taxameter, keine Preisschwankungen",
      "Meet & Greet mit Namensschild in der Ankunftshalle",
      "Kostenlose Flugverfolgung — wir warten bei Verspätung",
      "Mercedes Vito VIP mit Klimaanlage, WLAN & Kindersitzen",
      "Kostenlose Stornierung bis 24 Stunden vorher",
      "24/7 WhatsApp-Support auf Deutsch",
      "Alle Lara Beach Hotels: Aska Lara, Titanic, Royal Seginus & mehr",
    ],
    faqQ1: "Wie weit ist Lara Beach vom Flughafen Antalya entfernt?",
    faqA1: "Lara Beach (Kundu-Gebiet) liegt etwa 15 km vom Flughafen Antalya (AYT) entfernt. Ein Privattransfer dauert etwa 20 Minuten — damit ist es das nächste große Resortgebiet vom Flughafen.",
    faqQ2: "Ist ein Privattransfer günstiger als ein Taxi vom Flughafen Antalya nach Lara Beach?",
    faqA2: "TORVIAN Privattransfers bieten einen vorab vereinbarten Festpreis — kein laufendes Taxameter. Keine versteckten Gebühren, keine Preisschwankungen, und Ihr Fahrer wartet kostenlos bei Flugverspätung.",
    faqQ3: "Welche Hotels in Lara Beach bedienen Sie?",
    faqA3: "Wir bedienen alle Hotels in Lara Beach und Kundu, darunter Aska Lara Resort & Spa, Titanic Deluxe Lara Beach Hotel, Royal Seginus Hotel, Rixos Downtown Antalya, Mardan Palace und alle anderen. Geben Sie einfach Ihren Hotelnamen bei der Buchung ein.",
    faqQ4: "Kann ich einen Rücktransfer von Lara Beach zum Flughafen buchen?",
    faqA4: "Ja. Wir bieten sowohl einfache als auch Hin- und Rückfahrten an. Buchen Sie den Rücktransfer von Lara Beach zum Flughafen Antalya bei derselben Buchung und erhalten Sie einen vergünstigten Kombinationspreis.",
    faqQ5: "Wie finde ich meinen Fahrer am Flughafen Antalya?",
    faqA5: "Ihr Fahrer wartet in der Ankunftshalle mit einem Schild mit Ihrem Namen. Wir verfolgen Ihren Flug in Echtzeit — bei Verspätung ist Ihr Fahrer trotzdem da, ohne Aufpreis.",
    bookCta: "Lara Beach Transfer Buchen",
    whyTitle: "Warum TORVIAN für Lara Beach?",
    breadcrumb: "Lara Beach Transfer",
  },
  pl: {
    title: "Transfer Lotnisko Antalya — Lara Beach | Prywatny VIP | ~20 min",
    metaDesc: "Prywatny transfer VIP z lotniska Antalya do Lara Beach (Kundu). ~20 min, 15 km. Stała cena, powitanie, śledzenie lotu. Lepsza opcja niż taksówka — rezerwacja online 2 min.",
    heading: "Lotnisko Antalya → Transfer Lara Beach",
    subheading: "Prywatny transfer VIP do hoteli Lara Beach — Aska Lara, Titanic Lara, Royal Seginus. Stała cena, bez taksówek, bez czekania.",
    desc: "Lara Beach (Kundu) to jeden z najpopularniejszych kurortów w Antalyi, mieszczący najlepsze 5-gwiazdkowe hotele w Turcji. Zaledwie 15 km na wschód od lotniska Antalya (AYT) — to najbliższy duży kurort, tylko ~20 minut prywatnym transferem.",
    distance: "15 km",
    duration: "~20 min",
    hotels: "Aska Lara Resort & Spa, Titanic Deluxe Lara, Royal Seginus, Rixos Downtown Antalya",
    taxiNote: "Dlaczego prywatny transfer zamiast taksówki? Stała cena ustalona z góry, profesjonalny kierowca z tabliczką, bezpłatne czekanie przy opóźnieniu lotu.",
    features: [
      "Bezpośredni transfer z lotniska Antalya (AYT) do Lara Beach",
      "Stała cena — bez licznika, bez zmiennych opłat",
      "Powitanie z tabliczką z nazwiskiem w hali przylotów",
      "Bezpłatne śledzenie lotu — czekamy przy opóźnieniu",
      "Mercedes Vito VIP z klimatyzacją, Wi-Fi i fotelikami",
      "Bezpłatna anulacja do 24 godzin wcześniej",
      "Wsparcie WhatsApp 24/7 po polsku",
      "Wszystkie hotele w Lara Beach: Aska Lara, Titanic, Royal Seginus i inne",
    ],
    faqQ1: "Jak daleko jest Lara Beach od lotniska Antalya?",
    faqA1: "Lara Beach (obszar Kundu) leży około 15 km od lotniska Antalya (AYT). Transfer prywatnym pojazdem trwa około 20 minut — to najbliższy duży kurort od lotniska.",
    faqQ2: "Czy prywatny transfer jest tańszy niż taksówka z lotniska Antalya do Lara Beach?",
    faqA2: "Transfery TORVIAN mają stałą cenę ustaloną przed podróżą — w przeciwieństwie do taksówek z licznikiem. Brak ukrytych opłat i bezpłatne czekanie przy opóźnieniu lotu.",
    faqQ3: "Jakie hotele w Lara Beach obsługujecie?",
    faqA3: "Obsługujemy wszystkie hotele w Lara Beach i Kundu: Aska Lara Resort & Spa, Titanic Deluxe Lara Beach Hotel, Royal Seginus Hotel, Rixos Downtown Antalya, Mardan Palace i wszystkie inne. Podaj nazwę hotelu podczas rezerwacji.",
    faqQ4: "Czy mogę zarezerwować transfer powrotny z Lara Beach na lotnisko?",
    faqA4: "Tak. Oferujemy transfery w jedną stronę i w obie strony. Zarezerwuj transfer powrotny z Lara Beach na lotnisko Antalya w tej samej rezerwacji i otrzymaj zniżkę.",
    faqQ5: "Jak znaleźć kierowcę na lotnisku Antalya?",
    faqA5: "Kierowca czeka w hali przylotów z tabliczką z Twoim nazwiskiem. Śledzimy Twój lot na bieżąco — przy opóźnieniu kierowca nadal na Ciebie czeka, bez dodatkowych kosztów.",
    bookCta: "Zarezerwuj Transfer Lara Beach",
    whyTitle: "Dlaczego TORVIAN do Lara Beach?",
    breadcrumb: "Transfer Lara Beach",
  },
  ru: {
    title: "Трансфер Аэропорт Анталья — Пляж Лара | Частный VIP | ~20 мин",
    metaDesc: "Частный VIP-трансфер из аэропорта Анталья на пляж Лара (Кунду). ~20 мин, 15 км. Фиксированная цена, встреча, отслеживание рейса. Лучше такси — бронируйте за 2 мин.",
    heading: "Аэропорт Анталья → Трансфер Пляж Лара",
    subheading: "Частный VIP-трансфер в отели Лара — Aska Lara, Titanic Lara, Royal Seginus. Фиксированная цена, без такси, без ожидания.",
    desc: "Пляж Лара (Кунду) — один из самых популярных курортных районов Антальи, в котором расположены лучшие 5-звёздочные отели Турции. Всего в 15 км к востоку от аэропорта Анталья (AYT) — это ближайший крупный курорт, всего ~20 минут на частном трансфере.",
    distance: "15 км",
    duration: "~20 мин",
    hotels: "Aska Lara Resort & Spa, Titanic Deluxe Lara, Royal Seginus, Rixos Downtown Antalya",
    taxiNote: "Почему частный трансфер лучше такси? Фиксированная цена заранее, профессиональный водитель с табличкой, бесплатное ожидание при задержке рейса.",
    features: [
      "Прямой трансфер из аэропорта Анталья (AYT) на пляж Лара",
      "Фиксированная цена — без счётчика, без скачков цены",
      "Встреча с табличкой с именем в зале прилёта",
      "Бесплатное отслеживание рейса — ждём при задержке",
      "Mercedes Vito VIP с кондиционером, Wi-Fi и детскими креслами",
      "Бесплатная отмена за 24 часа до поездки",
      "Поддержка WhatsApp 24/7 на русском языке",
      "Все отели пляжа Лара: Aska Lara, Titanic, Royal Seginus и другие",
    ],
    faqQ1: "Как далеко пляж Лара от аэропорта Анталья?",
    faqA1: "Пляж Лара (район Кунду) находится примерно в 15 км от аэропорта Анталья (AYT). Частный трансфер займёт около 20 минут — это ближайший крупный курорт к аэропорту.",
    faqQ2: "Частный трансфер дешевле такси из аэропорта Анталья на пляж Лара?",
    faqA2: "Трансферы TORVIAN имеют фиксированную цену, согласованную до поездки — в отличие от такси со счётчиком. Никаких скрытых платежей и бесплатное ожидание при задержке рейса.",
    faqQ3: "В какие отели на пляже Лара вы возите?",
    faqA3: "Мы обслуживаем все отели на пляже Лара и в Кунду: Aska Lara Resort & Spa, Titanic Deluxe Lara Beach Hotel, Royal Seginus Hotel, Rixos Downtown Antalya, Mardan Palace и все остальные. Просто введите название отеля при бронировании.",
    faqQ4: "Можно заказать обратный трансфер с пляжа Лара в аэропорт?",
    faqA4: "Да. Мы предлагаем трансферы в одну сторону и туда-обратно. Закажите обратный трансфер с пляжа Лара в аэропорт Анталья при том же бронировании и получите скидку.",
    faqQ5: "Как найти водителя в аэропорту Анталья?",
    faqA5: "Ваш водитель будет ждать в зале прилёта с табличкой с вашим именем. Мы отслеживаем рейс в режиме реального времени — при задержке водитель всё равно будет там, без доплаты.",
    bookCta: "Забронировать Трансфер Лара Бич",
    whyTitle: "Почему TORVIAN для пляжа Лара?",
    breadcrumb: "Трансфер Лара Бич",
  },
  tr: {
    title: "Antalya Havalimanı'ndan Lara Beach'e Transfer | Özel VIP | ~20 dk",
    metaDesc: "Antalya Havalimanı'ndan Lara Beach (Kundu) özel VIP transfer. ~20 dk, 15 km. Sabit fiyat, karşılama, uçuş takibi. Taksiden daha iyi — 2 dakikada rezervasyon.",
    heading: "Antalya Havalimanı → Lara Beach Transfer",
    subheading: "Lara Beach otellerine özel VIP transfer — Aska Lara, Titanic Lara, Royal Seginus. Sabit fiyat, taksi yok, bekleme yok.",
    desc: "Lara Beach (Kundu), Türkiye'nin en iyi 5 yıldızlı otellerine ev sahipliği yapan Antalya'nın en popüler tatil bölgelerinden biridir. Antalya Havalimanı'nın (AYT) sadece 15 km doğusunda yer alan Lara Beach, havalimanına en yakın büyük tatil bölgesidir — özel transferle yalnızca ~20 dakika.",
    distance: "15 km",
    duration: "~20 dk",
    hotels: "Aska Lara Resort & Spa, Titanic Deluxe Lara, Royal Seginus, Rixos Downtown Antalya",
    taxiNote: "Taksiye göre özel transferin avantajları: Önceden sabit fiyat, isim tabelasıyla profesyonel şoför, uçuş gecikmelerinde ücretsiz bekleme — sürpriz yok.",
    features: [
      "Antalya Havalimanı (AYT)'ndan Lara Beach'e kapıdan kapıya direkt transfer",
      "Sabit fiyat — taksimetre yok, gizli ücret yok",
      "Varış salonunda isim tabelasıyla karşılama",
      "Ücretsiz uçuş takibi — gecikmede bekliyoruz",
      "Klimalı, Wi-Fi ve çocuk koltuğu seçenekli Mercedes Vito VIP",
      "24 saate kadar ücretsiz iptal",
      "7/24 Türkçe WhatsApp desteği",
      "Tüm Lara Beach otelleri: Aska Lara, Titanic, Royal Seginus ve diğerleri",
    ],
    faqQ1: "Lara Beach, Antalya Havalimanı'na ne kadar uzak?",
    faqA1: "Lara Beach (Kundu bölgesi), Antalya Havalimanı'na (AYT) yaklaşık 15 km uzaklıktadır. Özel transferle yaklaşık 20 dakika sürer — bu, havalimanına en yakın büyük tatil bölgesidir.",
    faqQ2: "Özel transfer, Antalya Havalimanı'ndan Lara Beach'e taksiden daha ucuz mu?",
    faqA2: "TORVIAN özel transferleri, yolculuk öncesinde belirlenen sabit fiyat sunar — sayaçla çalışan taksilerden farklı olarak. Gizli ücret yok, uçuş gecikmelerinde ücretsiz bekleme.",
    faqQ3: "Lara Beach'teki hangi otellere hizmet veriyorsunuz?",
    faqA3: "Lara Beach ve Kundu bölgesindeki tüm otellere hizmet veriyoruz: Aska Lara Resort & Spa, Titanic Deluxe Lara Beach Hotel, Royal Seginus Hotel, Rixos Downtown Antalya, Mardan Palace ve diğerleri. Rezervasyon sırasında otel adınızı girmeniz yeterli.",
    faqQ4: "Lara Beach'ten havalimanına dönüş transferi rezervasyonu yapabilir miyim?",
    faqA4: "Evet. Hem tek yön hem de gidiş-dönüş transfer sunuyoruz. Aynı rezervasyonda Lara Beach'ten Antalya Havalimanı'na dönüş transferini seçerek indirimli fiyattan yararlanabilirsiniz.",
    faqQ5: "Antalya Havalimanı'nda şoförümü nasıl bulurum?",
    faqA5: "Şoförünüz, adınızın yazılı olduğu tabela ile varış salonunda sizi bekleyecektir. Uçuşunuzu gerçek zamanlı takip ediyoruz — gecikmede şoförünüz yine de orada olacak, ek ücret yok.",
    bookCta: "Lara Beach Transfer Rezervasyonu Yap",
    whyTitle: "Lara Beach için Neden TORVIAN?",
    breadcrumb: "Lara Beach Transfer",
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
  const path = "/lara-beach-transfer";
  const BASE = "https://torviantransfer.com";

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: c.faqQ1, acceptedAnswer: { "@type": "Answer", text: c.faqA1 } },
      { "@type": "Question", name: c.faqQ2, acceptedAnswer: { "@type": "Answer", text: c.faqA2 } },
      { "@type": "Question", name: c.faqQ3, acceptedAnswer: { "@type": "Answer", text: c.faqA3 } },
      { "@type": "Question", name: c.faqQ4, acceptedAnswer: { "@type": "Answer", text: c.faqA4 } },
      { "@type": "Question", name: c.faqQ5, acceptedAnswer: { "@type": "Answer", text: c.faqA5 } },
    ],
  };

  return {
    title: c.title,
    description: c.metaDesc,
    alternates: {
      canonical: `${BASE}/${loc}${path}`,
      languages: {
        "x-default": `${BASE}/en${path}`,
        tr: `${BASE}/tr${path}`,
        en: `${BASE}/en${path}`,
        de: `${BASE}/de${path}`,
        pl: `${BASE}/pl${path}`,
        ru: `${BASE}/ru${path}`,
      },
    },
    openGraph: seoOpenGraph(loc, path, c.title, c.metaDesc, "/images/regions/kundu-lara.jpg"),
    twitter: seoTwitter(c.title, c.metaDesc, "/images/regions/kundu-lara.jpg"),
    other: {
      "schema-faq": JSON.stringify(faqSchema),
    },
  };
}

export default async function LaraBeachTransferPage({
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
      { "@type": "Question", name: c.faqQ5, acceptedAnswer: { "@type": "Answer", text: c.faqA5 } },
    ],
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    name: "Antalya Airport Lara Beach Transfer — TORVIAN",
    description: c.metaDesc,
    provider: { "@type": "Organization", name: "TORVIAN Transfer", url: "https://torviantransfer.com" },
    areaServed: { "@type": "Place", name: "Lara Beach, Antalya, Turkey" },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "TORVIAN Transfer", item: `https://torviantransfer.com/${loc}` },
      { "@type": "ListItem", position: 2, name: c.breadcrumb, item: `https://torviantransfer.com/${loc}/lara-beach-transfer` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pb-16 pt-24 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(255,149,0,0.03) 50%, #FFFFFF 100%)" }}>
          <div className="relative max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-gray-900">{c.breadcrumb}</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-3xl lg:text-5xl font-bold mb-4 tracking-tight text-gray-900">
                  {c.heading}
                </h1>
                <p className="text-base lg:text-lg text-gray-500 mb-4 leading-relaxed">
                  {c.desc}
                </p>
                <p className="text-sm text-gray-400 mb-6 italic">{c.hotels}</p>

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

                <Link
                  href="/booking?region=kundu-lara"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base transition-all"
                  style={{ background: "linear-gradient(135deg, #007AFF 0%, #0056CC 100%)" }}
                >
                  {c.bookCta}
                  <ArrowRight size={18} />
                </Link>
              </div>

              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                <Image
                  src="/images/regions/kundu-lara.jpg"
                  alt="Lara Beach Kundu hotels transfer from Antalya Airport"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="text-sm font-medium">Lara Beach · Kundu · Antalya</div>
                  <div className="text-xs opacity-80">Antalya Airport (AYT) · {c.distance} · {c.duration}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Taxi vs Private note */}
        <section className="py-8 bg-blue-50 border-y border-blue-100">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-sm text-blue-800 text-center">{c.taxiNote}</p>
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
                { q: c.faqQ5, a: c.faqA5 },
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
              href="/booking?region=kundu-lara"
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
