import type { Metadata } from "next";
import { getSeoPage, applySeoPage, seoH1, seoIntro } from "@/lib/seoPages";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import {
  Plane,
  CheckCircle,
  ArrowRight,
  MapPin,
  Clock,
  ShieldCheck,
  Tag,
  Headphones,
  Home,
} from "lucide-react";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo";

type Locale = "tr" | "en" | "de" | "pl" | "ru" | "nl";

// Head-term hub for "Antalya Airport Transfer".
//
// The site already targets the *modified* forms of this query — the homepage
// ("Private Transfer Antalya Airport"), /vip-transfer-antalya (VIP),
// /hotel-transfer-antalya (hotel) and /regions (the destination + distance
// directory). None of them owns the bare head term or the intent behind it:
// a first-time arrival asking what actually happens after they land at AYT.
// That is this page's angle, which is why it is built around the arrival flow
// and deliberately does NOT repeat the distance/price table /regions targets.
//
// Its second job is structural: it is the hub that links to every active
// region page. The [region] template's own cross-link block documents that
// the smaller regions (Evrenseki, Kızılağaç, Kargıcak, Boğazkent…) sit on
// almost no impressions because nothing links to them; listing all 24 here
// gives each a link from a page targeting the strongest query in the niche.
//
// Every factual claim below is taken from copy already verified elsewhere in
// this codebase (src/messages/*.json → `faq` and `trust`). Nothing is
// asserted about terminals, named meeting points or night surcharges, since
// the codebase does not establish those — and pricing.ts in fact supports a
// configurable night tariff, so "no night surcharge" would be wrong.
const content: Record<Locale, {
  title: string;
  metaDesc: string;
  heading: string;
  subheading: string;
  desc: string;
  badge: string;
  pills: string[];
  bookCta: string;
  secondaryCta: string;
  stepsTitle: string;
  steps: { title: string; desc: string }[];
  whyTitle: string;
  features: string[];
  destinationsTitle: string;
  destinationsIntro: string;
  allDestinationsTitle: string;
  minLabel: string;
  viewRoute: string;
  faqTitle: string;
  faqs: { q: string; a: string }[];
  breadcrumb: string;
  home: string;
  imageAlt: string;
}> = {
  en: {
    title: "Antalya Airport Transfer | Fixed Price, Meet & Greet, Book Online",
    metaDesc:
      "Private Antalya Airport transfer: one fixed price per vehicle, real-time flight tracking and your driver waiting in the arrivals hall. Free cancellation up to 24h.",
    heading: "Antalya Airport Transfer",
    subheading:
      "Private transfer from Antalya Airport (AYT) straight to your hotel — one fixed price per vehicle, with your driver waiting for you in the arrivals hall.",
    desc:
      "You book before you fly, we track your flight, and a Mercedes Vito takes you door to door. No queue at the taxi rank, no meter running, no surprise at the end of the ride.",
    badge: "Antalya Airport (AYT)",
    pills: [
      "Private transfer, never shared",
      "Fixed price per vehicle",
      "Real-time flight tracking",
      "Direct to your hotel",
      "24/7 support",
      "Free cancellation up to 24h",
    ],
    bookCta: "Book Your Airport Transfer",
    secondaryCta: "See all destinations",
    stepsTitle: "What happens when you land at Antalya Airport",
    steps: [
      { title: "Book before you fly", desc: "Choose your destination, date and time. You get instant confirmation by email with your driver's details and a QR code." },
      { title: "We track your flight", desc: "Add your flight number when booking. We monitor all flights in real time — if yours is delayed, your driver waits for free." },
      { title: "Meet & greet in arrivals", desc: "Your driver is at the designated meeting point in the arrivals hall with a sign bearing your name, and helps you with your luggage to the vehicle." },
      { title: "Door to door", desc: "Straight from the airport to your hotel, villa or any address on the Turkish Riviera — no other pickups, no detours." },
    ],
    whyTitle: "Why book your Antalya Airport transfer with TORVIAN",
    features: [
      "Prices are per vehicle, not per person — up to 5 passengers travel in one Mercedes Vito for the same price.",
      "The price you see at booking is the price you pay. No hidden fees, no surge pricing.",
      "Every arrival at Antalya Airport is flight-tracked, so your driver is timed to your actual landing.",
      "Free cancellation up to 24 hours before your scheduled departure time.",
      "Child seats available for $10 per booking — just request one while booking.",
      "We run transfers 24/7, so a late-night arrival is booked exactly like any other.",
      "Mercedes Vito VIP vehicles with leather seats, Wi-Fi and climate control.",
      "Card payments handled by Stripe on PCI DSS compliant infrastructure.",
    ],
    destinationsTitle: "Where are you heading from the airport?",
    destinationsIntro:
      "Each destination has its own page with the exact distance, transfer time and fixed price for that route.",
    allDestinationsTitle: "All transfer destinations",
    minLabel: "min",
    viewRoute: "View route",
    faqTitle: "Antalya Airport transfer FAQ",
    faqs: [
      { q: "How much does an Antalya Airport transfer cost?", a: "The price depends only on your destination and is fixed per vehicle, not per person — up to 5 passengers pay the same. Open the page for your destination to see its exact fixed price before you book." },
      { q: "How will my driver find me at Antalya Airport?", a: "Your driver will be waiting at the designated meeting point in the arrivals hall with a sign bearing your name. After booking you receive an email with the driver's details and a QR code." },
      { q: "What happens if my flight is delayed?", a: "We track all flights in real time. If your flight is delayed, your driver waits for free." },
      { q: "Are prices per person or per vehicle?", a: "Per vehicle. Up to 5 passengers can travel in a single Mercedes Vito at the same price, so a family pays the same as a solo traveller." },
      { q: "Can I cancel my airport transfer for free?", a: "Yes, free cancellation is available up to 24 hours before your scheduled departure time." },
      { q: "Do you run transfers at night?", a: "Yes, we provide transfer service 24/7. Your driver will be ready and waiting for night flights as well." },
      { q: "Can I book a transfer with a child seat?", a: "Yes. Child seats are available for $10 per booking — request one during booking and it is fitted before your driver leaves for the airport." },
    ],
    breadcrumb: "Antalya Airport Transfer",
    home: "Home",
    imageAlt: "Private transfer vehicle waiting at Antalya Airport",
  },
  tr: {
    title: "Antalya Havalimanı Transfer | Sabit Fiyat, Karşılama, Online Rezervasyon",
    metaDesc:
      "Antalya Havalimanı özel transfer: araç başına sabit fiyat, gerçek zamanlı uçuş takibi ve varış salonunda sizi bekleyen şoför. 24 saat öncesine kadar ücretsiz iptal.",
    heading: "Antalya Havalimanı Transfer",
    subheading:
      "Antalya Havalimanı'ndan (AYT) doğrudan otelinize özel transfer — araç başına tek sabit fiyat, varış salonunda sizi bekleyen şoför.",
    desc:
      "Uçmadan önce rezervasyonunuzu yaparsınız, uçuşunuzu takip ederiz ve Mercedes Vito sizi kapıdan kapıya götürür. Taksi kuyruğu yok, çalışan taksimetre yok, yolculuk sonunda sürpriz yok.",
    badge: "Antalya Havalimanı (AYT)",
    pills: [
      "Özel transfer, paylaşımsız",
      "Araç başına sabit fiyat",
      "Gerçek zamanlı uçuş takibi",
      "Doğrudan otelinize",
      "7/24 destek",
      "24 saat öncesine kadar ücretsiz iptal",
    ],
    bookCta: "Havalimanı Transferinizi Ayırtın",
    secondaryCta: "Tüm bölgeleri görün",
    stepsTitle: "Antalya Havalimanı'na indiğinizde ne oluyor?",
    steps: [
      { title: "Uçmadan önce rezervasyon", desc: "Bölgenizi, tarihinizi ve saatinizi seçin. Şoför bilgileri ve QR kod içeren onay e-postası anında gelir." },
      { title: "Uçuşunuzu takip ediyoruz", desc: "Rezervasyon sırasında uçuş kodunuzu girin. Tüm uçuşları gerçek zamanlı izliyoruz — uçuşunuz gecikirse şoförünüz ücretsiz olarak bekler." },
      { title: "Varış salonunda karşılama", desc: "Şoförünüz varış salonundaki belirlenen buluşma noktasında, adınızın yazılı olduğu tabelayla sizi karşılar ve bagajlarınızla araca kadar eşlik eder." },
      { title: "Kapıdan kapıya", desc: "Havalimanından doğrudan otelinize, villanıza veya Türk Rivierası'ndaki herhangi bir adrese — başka yolcu almadan, sapmadan." },
    ],
    whyTitle: "Antalya Havalimanı transferinizi neden TORVIAN ile ayırtmalısınız?",
    features: [
      "Fiyatlar kişi başı değil araç başınadır — tek bir Mercedes Vito'da 5 yolcuya kadar aynı fiyatla seyahat edebilirsiniz.",
      "Rezervasyonda gördüğünüz fiyat ödediğiniz fiyattır. Gizli ücret yok, yoğunluk zammı yok.",
      "Antalya Havalimanı'na gelen her uçuş takip edilir; şoförünüz gerçek iniş saatinize göre planlanır.",
      "Planlanan kalkış saatinden 24 saat öncesine kadar ücretsiz iptal hakkınız vardır.",
      "Çocuk koltuğu rezervasyon başına 10 dolar — rezervasyon sırasında talep etmeniz yeterli.",
      "7/24 transfer hizmeti veriyoruz; gece geç saatteki bir varış da diğerleri gibi ayırtılır.",
      "Deri koltuklu, Wi-Fi ve klima donanımlı Mercedes Vito VIP araçlar.",
      "Kart ödemeleri PCI DSS uyumlu Stripe altyapısı üzerinden alınır.",
    ],
    destinationsTitle: "Havalimanından nereye gidiyorsunuz?",
    destinationsIntro:
      "Her bölgenin kendi sayfasında o rotanın tam mesafesi, transfer süresi ve sabit fiyatı yer alıyor.",
    allDestinationsTitle: "Tüm transfer bölgeleri",
    minLabel: "dk",
    viewRoute: "Rotayı görüntüle",
    faqTitle: "Antalya Havalimanı transfer — sıkça sorulanlar",
    faqs: [
      { q: "Antalya Havalimanı transferi ne kadar tutuyor?", a: "Fiyat yalnızca gideceğiniz bölgeye göre değişir ve kişi başı değil araç başına sabittir — 5 yolcuya kadar aynı ücreti ödersiniz. Rezervasyondan önce net fiyatı görmek için bölgenizin sayfasını açın." },
      { q: "Havalimanında şoförüm beni nasıl bulacak?", a: "Şoförünüz varış salonundaki belirlenen buluşma noktasında, adınızın yazılı olduğu tabelayla bekliyor olacak. Rezervasyon sonrası şoför bilgileri ve QR kodu içeren bilgilendirme e-postası gönderilir." },
      { q: "Uçuşum rötar yaparsa ne olur?", a: "Tüm uçuşları gerçek zamanlı takip ediyoruz. Uçuşunuz gecikirse şoförünüz ücretsiz olarak bekler." },
      { q: "Fiyatlar kişi başı mı, araç başına mı?", a: "Araç başınadır. Tek bir Mercedes Vito'da 5 yolcuya kadar aynı fiyatla seyahat edebilirsiniz; yani bir aile tek kişiyle aynı ücreti öder." },
      { q: "Havalimanı transferimi ücretsiz iptal edebilir miyim?", a: "Evet, planlanan kalkış saatinden 24 saat öncesine kadar ücretsiz iptal hakkınız bulunmaktadır." },
      { q: "Gece transfer yapıyor musunuz?", a: "Evet, 7/24 transfer hizmeti sunuyoruz. Gece uçuşları için de şoförünüz hazır olacaktır." },
      { q: "Çocuk koltuklu transfer ayırtabilir miyim?", a: "Evet. Çocuk koltuğu rezervasyon başına 10 dolardır — rezervasyon sırasında talep edin, şoförünüz havalimanına çıkmadan önce araca takılır." },
    ],
    breadcrumb: "Antalya Havalimanı Transfer",
    home: "Ana Sayfa",
    imageAlt: "Antalya Havalimanı'nda bekleyen özel transfer aracı",
  },
  de: {
    title: "Flughafen Antalya Transfer | Festpreis, Meet & Greet, Online buchen",
    metaDesc:
      "Privater Transfer ab Flughafen Antalya: Festpreis pro Fahrzeug, Flugverfolgung in Echtzeit und Ihr Fahrer wartet in der Ankunftshalle. Kostenlose Stornierung bis 24 Std.",
    heading: "Flughafen Antalya Transfer",
    subheading:
      "Privater Transfer vom Flughafen Antalya (AYT) direkt zu Ihrem Hotel — ein Festpreis pro Fahrzeug, Ihr Fahrer erwartet Sie in der Ankunftshalle.",
    desc:
      "Sie buchen vor dem Abflug, wir verfolgen Ihren Flug, und ein Mercedes Vito bringt Sie von Tür zu Tür. Keine Warteschlange am Taxistand, kein laufendes Taxameter, keine Überraschung am Ende der Fahrt.",
    badge: "Flughafen Antalya (AYT)",
    pills: [
      "Privattransfer, ohne Mitfahrer",
      "Festpreis pro Fahrzeug",
      "Flugverfolgung in Echtzeit",
      "Direkt zu Ihrem Hotel",
      "24/7 erreichbar",
      "Kostenlose Stornierung bis 24 Std.",
    ],
    bookCta: "Flughafentransfer buchen",
    secondaryCta: "Alle Zielorte ansehen",
    stepsTitle: "Was passiert, wenn Sie am Flughafen Antalya landen",
    steps: [
      { title: "Vor dem Abflug buchen", desc: "Wählen Sie Zielort, Datum und Uhrzeit. Sie erhalten sofort eine Bestätigung per E-Mail mit den Fahrerdaten und einem QR-Code." },
      { title: "Wir verfolgen Ihren Flug", desc: "Geben Sie bei der Buchung Ihre Flugnummer an. Wir verfolgen alle Flüge in Echtzeit — bei Verspätung wartet Ihr Fahrer kostenlos." },
      { title: "Meet & Greet in der Ankunftshalle", desc: "Ihr Fahrer erwartet Sie am designierten Treffpunkt in der Ankunftshalle mit einem Schild mit Ihrem Namen und begleitet Sie mit Ihrem Gepäck zum Fahrzeug." },
      { title: "Von Tür zu Tür", desc: "Direkt vom Flughafen zu Ihrem Hotel, Ihrer Villa oder jeder Adresse an der Türkischen Riviera — ohne Zwischenstopps, ohne Umwege." },
    ],
    whyTitle: "Warum Sie Ihren Flughafentransfer mit TORVIAN buchen",
    features: [
      "Die Preise gelten pro Fahrzeug, nicht pro Person — bis zu 5 Passagiere reisen im selben Mercedes Vito zum gleichen Preis.",
      "Der Preis bei der Buchung ist der Preis, den Sie zahlen. Keine versteckten Gebühren, keine dynamischen Aufschläge.",
      "Jede Ankunft am Flughafen Antalya wird per Flugverfolgung überwacht, Ihr Fahrer ist auf Ihre tatsächliche Landung getaktet.",
      "Kostenlose Stornierung bis 24 Stunden vor der geplanten Abfahrt.",
      "Kindersitze für 10 $ pro Buchung — geben Sie den Wunsch einfach bei der Buchung an.",
      "Wir fahren rund um die Uhr, ein später Nachtflug wird genauso gebucht wie jeder andere Transfer.",
      "Mercedes Vito VIP-Fahrzeuge mit Ledersitzen, WLAN und Klimaanlage.",
      "Kartenzahlungen laufen über Stripe auf PCI-DSS-konformer Infrastruktur.",
    ],
    destinationsTitle: "Wohin geht es vom Flughafen aus?",
    destinationsIntro:
      "Jeder Zielort hat eine eigene Seite mit der genauen Entfernung, Fahrzeit und dem Festpreis für diese Strecke.",
    allDestinationsTitle: "Alle Transferziele",
    minLabel: "Min.",
    viewRoute: "Strecke ansehen",
    faqTitle: "Häufige Fragen zum Flughafentransfer Antalya",
    faqs: [
      { q: "Was kostet ein Transfer ab Flughafen Antalya?", a: "Der Preis hängt allein von Ihrem Zielort ab und gilt als Festpreis pro Fahrzeug, nicht pro Person — bis zu 5 Passagiere zahlen dasselbe. Öffnen Sie die Seite Ihres Zielorts, um den genauen Festpreis vor der Buchung zu sehen." },
      { q: "Wie findet mich mein Fahrer am Flughafen?", a: "Ihr Fahrer erwartet Sie am designierten Treffpunkt in der Ankunftshalle mit einem Schild mit Ihrem Namen. Nach der Buchung erhalten Sie per E-Mail die Fahrerdaten und einen QR-Code." },
      { q: "Was passiert, wenn mein Flug Verspätung hat?", a: "Wir verfolgen alle Flüge in Echtzeit. Bei Verspätung wartet Ihr Fahrer kostenlos." },
      { q: "Gelten die Preise pro Person oder pro Fahrzeug?", a: "Pro Fahrzeug. Bis zu 5 Passagiere können in einem Mercedes Vito zum gleichen Preis reisen — eine Familie zahlt also so viel wie ein Alleinreisender." },
      { q: "Kann ich meinen Flughafentransfer kostenlos stornieren?", a: "Ja, eine kostenlose Stornierung ist bis zu 24 Stunden vor der geplanten Abfahrt möglich." },
      { q: "Fahren Sie auch nachts?", a: "Ja, wir bieten 24/7 Transferservice an. Ihr Fahrer ist auch bei Nachtflügen bereit und wartet." },
      { q: "Kann ich einen Transfer mit Kindersitz buchen?", a: "Ja. Kindersitze sind für 10 $ pro Buchung verfügbar — geben Sie dies bei der Buchung an, dann ist der Sitz montiert, bevor Ihr Fahrer zum Flughafen aufbricht." },
    ],
    breadcrumb: "Flughafen Antalya Transfer",
    home: "Startseite",
    imageAlt: "Privates Transferfahrzeug am Flughafen Antalya",
  },
  pl: {
    title: "Transfer z Lotniska Antalya | Stała cena, powitanie, rezerwacja online",
    metaDesc:
      "Prywatny transfer z lotniska Antalya: stała cena za pojazd, śledzenie lotu w czasie rzeczywistym i kierowca czekający w hali przylotów. Darmowa anulacja do 24 godzin.",
    heading: "Transfer z Lotniska Antalya",
    subheading:
      "Prywatny transfer z lotniska Antalya (AYT) prosto do Twojego hotelu — jedna stała cena za pojazd, kierowca czeka na Ciebie w hali przylotów.",
    desc:
      "Rezerwujesz przed wylotem, my śledzimy Twój lot, a Mercedes Vito zawozi Cię od drzwi do drzwi. Bez kolejki na postoju taksówek, bez taksometru, bez niespodzianek na końcu kursu.",
    badge: "Lotnisko Antalya (AYT)",
    pills: [
      "Transfer prywatny, bez współpasażerów",
      "Stała cena za pojazd",
      "Śledzenie lotu w czasie rzeczywistym",
      "Prosto do Twojego hotelu",
      "Wsparcie 24/7",
      "Darmowa anulacja do 24 godzin",
    ],
    bookCta: "Zarezerwuj transfer z lotniska",
    secondaryCta: "Zobacz wszystkie destynacje",
    stepsTitle: "Co się dzieje, gdy lądujesz na lotnisku Antalya",
    steps: [
      { title: "Rezerwacja przed wylotem", desc: "Wybierz destynację, datę i godzinę. Natychmiast otrzymasz e-mail z potwierdzeniem, danymi kierowcy i kodem QR." },
      { title: "Śledzimy Twój lot", desc: "Podaj numer lotu przy rezerwacji. Śledzimy wszystkie loty w czasie rzeczywistym — jeśli Twój lot jest opóźniony, kierowca czeka bezpłatnie." },
      { title: "Powitanie w hali przylotów", desc: "Kierowca czeka w wyznaczonym punkcie spotkania w hali przylotów z tabliczką z Twoim nazwiskiem i pomaga z bagażem do pojazdu." },
      { title: "Od drzwi do drzwi", desc: "Prosto z lotniska do Twojego hotelu, willi lub dowolnego adresu na Riwierze Tureckiej — bez dodatkowych postojów i objazdów." },
    ],
    whyTitle: "Dlaczego warto zarezerwować transfer z lotniska Antalya w TORVIAN",
    features: [
      "Ceny są za pojazd, nie od osoby — do 5 pasażerów podróżuje jednym Mercedesem Vito w tej samej cenie.",
      "Cena widoczna przy rezerwacji to cena, którą płacisz. Bez ukrytych opłat i dopłat za szczyt.",
      "Każdy przylot na lotnisko Antalya jest monitorowany, więc kierowca jest dopasowany do faktycznej godziny lądowania.",
      "Darmowa anulacja do 24 godzin przed planowanym odjazdem.",
      "Foteliki dziecięce za $10 za rezerwację — wystarczy zaznaczyć przy rezerwacji.",
      "Jeździmy 24/7, więc nocny przylot rezerwuje się dokładnie tak samo jak każdy inny.",
      "Pojazdy Mercedes Vito VIP ze skórzanymi fotelami, Wi-Fi i klimatyzacją.",
      "Płatności kartą obsługuje Stripe na infrastrukturze zgodnej z PCI DSS.",
    ],
    destinationsTitle: "Dokąd jedziesz z lotniska?",
    destinationsIntro:
      "Każda destynacja ma własną stronę z dokładną odległością, czasem przejazdu i stałą ceną dla tej trasy.",
    allDestinationsTitle: "Wszystkie destynacje transferowe",
    minLabel: "min",
    viewRoute: "Zobacz trasę",
    faqTitle: "Transfer z lotniska Antalya — najczęstsze pytania",
    faqs: [
      { q: "Ile kosztuje transfer z lotniska Antalya?", a: "Cena zależy wyłącznie od destynacji i jest stała za pojazd, nie od osoby — do 5 pasażerów płaci tyle samo. Otwórz stronę swojej destynacji, aby zobaczyć dokładną stałą cenę przed rezerwacją." },
      { q: "Jak kierowca mnie znajdzie na lotnisku?", a: "Kierowca czeka w wyznaczonym punkcie spotkania w hali przylotów z tabliczką z Twoim nazwiskiem. Po rezerwacji otrzymasz e-mail z danymi kierowcy i kodem QR." },
      { q: "Co jeśli mój lot jest opóźniony?", a: "Śledzimy wszystkie loty w czasie rzeczywistym. Jeśli Twój lot jest opóźniony, kierowca czeka bezpłatnie." },
      { q: "Ceny są od osoby czy za pojazd?", a: "Za pojazd. Do 5 pasażerów może podróżować jednym Mercedesem Vito w tej samej cenie, więc rodzina płaci tyle co osoba podróżująca samotnie." },
      { q: "Czy mogę bezpłatnie anulować transfer z lotniska?", a: "Tak, darmowa anulacja jest możliwa do 24 godzin przed planowanym odjazdem." },
      { q: "Czy realizujecie transfery w nocy?", a: "Tak, oferujemy transfer 24/7. Kierowca jest gotowy i czeka również na nocne loty." },
      { q: "Czy mogę zarezerwować transfer z fotelikiem dziecięcym?", a: "Tak. Foteliki dziecięce są dostępne za $10 za rezerwację — zaznacz to przy rezerwacji, a fotelik zostanie zamontowany, zanim kierowca wyruszy na lotnisko." },
    ],
    breadcrumb: "Transfer z Lotniska Antalya",
    home: "Strona główna",
    imageAlt: "Prywatny pojazd transferowy czekający na lotnisku Antalya",
  },
  ru: {
    title: "Трансфер из Аэропорта Анталии | Фиксированная цена, встреча, онлайн",
    metaDesc:
      "Частный трансфер из аэропорта Анталии: фиксированная цена за автомобиль, отслеживание рейса в реальном времени и водитель в зале прилёта. Бесплатная отмена за 24 часа.",
    heading: "Трансфер из Аэропорта Анталии",
    subheading:
      "Частный трансфер из аэропорта Анталии (AYT) прямо до вашего отеля — одна фиксированная цена за автомобиль, водитель встречает вас в зале прилёта.",
    desc:
      "Вы бронируете до вылета, мы отслеживаем ваш рейс, а Mercedes Vito везёт вас от двери до двери. Без очереди на стоянке такси, без счётчика и без сюрпризов в конце поездки.",
    badge: "Аэропорт Анталии (AYT)",
    pills: [
      "Частный трансфер, без попутчиков",
      "Фиксированная цена за автомобиль",
      "Отслеживание рейса в реальном времени",
      "Прямо до вашего отеля",
      "Поддержка 24/7",
      "Бесплатная отмена за 24 часа",
    ],
    bookCta: "Забронировать трансфер",
    secondaryCta: "Все направления",
    stepsTitle: "Что происходит, когда вы приземляетесь в аэропорту Анталии",
    steps: [
      { title: "Бронирование до вылета", desc: "Выберите направление, дату и время. Вы сразу получите письмо с подтверждением, данными водителя и QR-кодом." },
      { title: "Мы отслеживаем ваш рейс", desc: "Укажите номер рейса при бронировании. Мы отслеживаем все рейсы в реальном времени — при задержке водитель ждёт бесплатно." },
      { title: "Встреча в зале прилёта", desc: "Водитель встретит вас в назначенном месте встречи в зале прилёта с табличкой с вашим именем и поможет с багажом до автомобиля." },
      { title: "От двери до двери", desc: "Прямо из аэропорта в ваш отель, виллу или по любому адресу на Турецкой Ривьере — без попутчиков и объездов." },
    ],
    whyTitle: "Почему трансфер из аэропорта Анталии стоит бронировать в TORVIAN",
    features: [
      "Цены указаны за автомобиль, а не за человека — до 5 пассажиров едут в одном Mercedes Vito по одной цене.",
      "Цена, которую вы видите при бронировании, — это цена, которую вы платите. Без скрытых сборов и повышающих коэффициентов.",
      "Каждый рейс в аэропорт Анталии отслеживается, поэтому водитель подстроен под фактическое время посадки.",
      "Бесплатная отмена за 24 часа до запланированного отправления.",
      "Детское кресло — $10 за бронирование, просто укажите это при оформлении.",
      "Мы работаем круглосуточно, поэтому ночной прилёт бронируется так же, как и любой другой.",
      "Автомобили Mercedes Vito VIP с кожаным салоном, Wi-Fi и климат-контролем.",
      "Оплата картой проходит через Stripe на инфраструктуре, соответствующей PCI DSS.",
    ],
    destinationsTitle: "Куда вы едете из аэропорта?",
    destinationsIntro:
      "У каждого направления есть своя страница с точным расстоянием, временем в пути и фиксированной ценой маршрута.",
    allDestinationsTitle: "Все направления трансфера",
    minLabel: "мин",
    viewRoute: "Посмотреть маршрут",
    faqTitle: "Трансфер из аэропорта Анталии — частые вопросы",
    faqs: [
      { q: "Сколько стоит трансфер из аэропорта Анталии?", a: "Цена зависит только от направления и фиксирована за автомобиль, а не за человека — до 5 пассажиров платят одинаково. Откройте страницу вашего направления, чтобы увидеть точную фиксированную цену до бронирования." },
      { q: "Как водитель найдёт меня в аэропорту?", a: "Водитель встретит вас в назначенном месте встречи в зале прилёта с табличкой с вашим именем. После бронирования вы получите email с данными водителя и QR-кодом." },
      { q: "Что если мой рейс задержится?", a: "Мы отслеживаем все рейсы в реальном времени. При задержке рейса водитель ждёт бесплатно." },
      { q: "Цены за человека или за автомобиль?", a: "За автомобиль. До 5 пассажиров могут путешествовать в одном Mercedes Vito по одной цене, поэтому семья платит столько же, сколько один пассажир." },
      { q: "Можно ли бесплатно отменить трансфер из аэропорта?", a: "Да, бесплатная отмена возможна за 24 часа до запланированного отправления." },
      { q: "Вы работаете ночью?", a: "Да, мы предоставляем трансфер 24/7. Водитель будет готов и ждать даже для ночных рейсов." },
      { q: "Можно забронировать трансфер с детским креслом?", a: "Да. Детские кресла доступны за $10 за бронирование — укажите это при бронировании, и кресло установят до выезда водителя в аэропорт." },
    ],
    breadcrumb: "Трансфер из Аэропорта Анталии",
    home: "Главная",
    imageAlt: "Частный трансферный автомобиль в аэропорту Анталии",
  },
  nl: {
    title: "Antalya Luchthaven Transfer | Vaste prijs, ontvangst, online boeken",
    metaDesc:
      "Privétransfer vanaf de luchthaven Antalya: vaste prijs per voertuig, realtime vluchtmonitoring en uw chauffeur wacht in de aankomsthal. Gratis annuleren tot 24 uur.",
    heading: "Antalya Luchthaven Transfer",
    subheading:
      "Privétransfer vanaf de luchthaven Antalya (AYT) rechtstreeks naar uw hotel — één vaste prijs per voertuig, met uw chauffeur die in de aankomsthal op u wacht.",
    desc:
      "U boekt voor vertrek, wij volgen uw vlucht en een Mercedes Vito brengt u van deur tot deur. Geen rij bij de taxistandplaats, geen meter die loopt, geen verrassing aan het eind van de rit.",
    badge: "Luchthaven Antalya (AYT)",
    pills: [
      "Privétransfer, niet gedeeld",
      "Vaste prijs per voertuig",
      "Realtime vluchtmonitoring",
      "Rechtstreeks naar uw hotel",
      "24/7 ondersteuning",
      "Gratis annuleren tot 24 uur",
    ],
    bookCta: "Boek uw luchthaventransfer",
    secondaryCta: "Bekijk alle bestemmingen",
    stepsTitle: "Wat er gebeurt als u landt op de luchthaven Antalya",
    steps: [
      { title: "Boek voor u vertrekt", desc: "Kies uw bestemming, datum en tijd. U ontvangt direct een bevestiging per e-mail met de chauffeursgegevens en een QR-code." },
      { title: "Wij volgen uw vlucht", desc: "Vul uw vluchtnummer in bij het boeken. Wij volgen alle vluchten in realtime — heeft uw vlucht vertraging, dan wacht uw chauffeur kosteloos." },
      { title: "Ontvangst in de aankomsthal", desc: "Uw chauffeur wacht op het aangewezen punt in de aankomsthal met een bord met uw naam en begeleidt u met uw bagage naar het voertuig." },
      { title: "Van deur tot deur", desc: "Rechtstreeks van de luchthaven naar uw hotel, villa of elk adres aan de Turkse Rivièra — zonder extra stops of omwegen." },
    ],
    whyTitle: "Waarom u uw Antalya luchthaventransfer bij TORVIAN boekt",
    features: [
      "Prijzen gelden per voertuig, niet per persoon — tot 5 passagiers reizen samen in één Mercedes Vito voor dezelfde prijs.",
      "De prijs die u bij het boeken ziet, is de prijs die u betaalt. Geen verborgen kosten, geen piektoeslagen.",
      "Elke aankomst op de luchthaven Antalya wordt gevolgd, zodat uw chauffeur is afgestemd op uw werkelijke landingstijd.",
      "Gratis annuleren tot 24 uur voor de geplande vertrektijd.",
      "Kinderzitjes voor $10 per boeking — geef dit gewoon aan tijdens het boeken.",
      "Wij rijden 24 uur per dag, dus een nachtelijke aankomst boekt u net als elke andere transfer.",
      "Mercedes Vito VIP-voertuigen met lederen stoelen, wifi en airconditioning.",
      "Kaartbetalingen verlopen via Stripe op PCI DSS-conforme infrastructuur.",
    ],
    destinationsTitle: "Waar gaat u vanaf de luchthaven naartoe?",
    destinationsIntro:
      "Elke bestemming heeft een eigen pagina met de exacte afstand, reistijd en vaste prijs voor die route.",
    allDestinationsTitle: "Alle transferbestemmingen",
    minLabel: "min",
    viewRoute: "Bekijk route",
    faqTitle: "Veelgestelde vragen over de Antalya luchthaventransfer",
    faqs: [
      { q: "Wat kost een transfer vanaf de luchthaven Antalya?", a: "De prijs hangt alleen af van uw bestemming en staat vast per voertuig, niet per persoon — tot 5 passagiers betalen hetzelfde. Open de pagina van uw bestemming om de exacte vaste prijs te zien voordat u boekt." },
      { q: "Hoe vindt mijn chauffeur mij op de luchthaven?", a: "Uw chauffeur wacht op het aangewezen punt in de aankomsthal met een bord met uw naam. Na uw boeking ontvangt u een e-mail met de chauffeursgegevens en een QR-code." },
      { q: "Wat gebeurt er als mijn vlucht vertraging heeft?", a: "Wij volgen alle vluchten in realtime. Heeft uw vlucht vertraging, dan wacht uw chauffeur kosteloos." },
      { q: "Zijn de prijzen per persoon of per voertuig?", a: "Per voertuig. Tot 5 passagiers reizen samen in één Mercedes Vito voor dezelfde prijs, dus een gezin betaalt evenveel als een alleenreizende." },
      { q: "Kan ik mijn luchthaventransfer gratis annuleren?", a: "Ja, u kunt tot 24 uur voor de geplande vertrektijd gratis annuleren." },
      { q: "Rijdt u ook 's nachts?", a: "Ja, wij rijden 24 uur per dag. Ook bij nachtvluchten staat uw chauffeur voor u klaar." },
      { q: "Kan ik een transfer met kinderzitje boeken?", a: "Ja. Kinderzitjes zijn beschikbaar voor $10 per boeking — geef dit aan tijdens het boeken, dan is het zitje geplaatst voordat uw chauffeur naar de luchthaven vertrekt." },
    ],
    breadcrumb: "Antalya Luchthaven Transfer",
    home: "Home",
    imageAlt: "Privé transfervoertuig op de luchthaven Antalya",
  },
};

/**
 * The active regions, mirrored from supabase/seed.sql — the 24 rows that
 * actually have pricing rows and therefore a working /{slug}-transfer page.
 * Held here rather than fetched so the hub prerenders as static HTML like the
 * other service landing pages; /regions is the DB-driven directory.
 */
const REGIONS: { slug: string; km: number; min: number; name: Record<Locale, string> }[] = [
  { slug: "kundu-lara", km: 15, min: 20, name: { tr: "Kundu - Lara", en: "Kundu - Lara", de: "Kundu - Lara", pl: "Kundu - Lara", ru: "Кунду - Лара", nl: "Kundu - Lara" } },
  { slug: "sehirici", km: 12, min: 20, name: { tr: "Antalya Şehiriçi", en: "Antalya City Center", de: "Antalya Zentrum", pl: "Centrum Antalyi", ru: "Центр Анталии", nl: "Antalya City Center" } },
  { slug: "kadriye", km: 30, min: 30, name: { tr: "Kadriye", en: "Kadriye", de: "Kadriye", pl: "Kadriye", ru: "Кадрие", nl: "Kadriye" } },
  { slug: "belek", km: 35, min: 35, name: { tr: "Belek", en: "Belek", de: "Belek", pl: "Belek", ru: "Белек", nl: "Belek" } },
  { slug: "bogazkent", km: 45, min: 40, name: { tr: "Boğazkent", en: "Bogazkent", de: "Bogazkent", pl: "Bogazkent", ru: "Богазкент", nl: "Bogazkent" } },
  { slug: "evrenseki", km: 60, min: 50, name: { tr: "Evrenseki", en: "Evrenseki", de: "Evrenseki", pl: "Evrenseki", ru: "Эвренсеки", nl: "Evrenseki" } },
  { slug: "side", km: 70, min: 60, name: { tr: "Side", en: "Side", de: "Side", pl: "Side", ru: "Сиде", nl: "Side" } },
  { slug: "kizilagac", km: 80, min: 70, name: { tr: "Kızılağaç", en: "Kizilagac", de: "Kızılağaç", pl: "Kizilagac", ru: "Кызылагач", nl: "Kizilagac" } },
  { slug: "okurcalar", km: 100, min: 80, name: { tr: "Okurcalar", en: "Okurcalar", de: "Okurcalar", pl: "Okurcalar", ru: "Окурджалар", nl: "Okurcalar" } },
  { slug: "turkler", km: 110, min: 85, name: { tr: "Türkler", en: "Turkler", de: "Türkler", pl: "Turkler", ru: "Тюрклер", nl: "Turkler" } },
  { slug: "alanya", km: 130, min: 120, name: { tr: "Alanya", en: "Alanya", de: "Alanya", pl: "Alanya", ru: "Аланья", nl: "Alanya" } },
  { slug: "mahmutlar", km: 140, min: 130, name: { tr: "Mahmutlar", en: "Mahmutlar", de: "Mahmutlar", pl: "Mahmutlar", ru: "Махмутлар", nl: "Mahmutlar" } },
  { slug: "kargicak", km: 145, min: 135, name: { tr: "Kargıcak", en: "Kargicak", de: "Kargıcak", pl: "Kargicak", ru: "Каргыджак", nl: "Kargicak" } },
  { slug: "beldibi", km: 40, min: 35, name: { tr: "Beldibi", en: "Beldibi", de: "Beldibi", pl: "Beldibi", ru: "Бельдиби", nl: "Beldibi" } },
  { slug: "goynuk", km: 50, min: 40, name: { tr: "Göynük", en: "Goynuk", de: "Göynük", pl: "Goynuk", ru: "Гёйнюк", nl: "Goynuk" } },
  { slug: "kemer", km: 55, min: 50, name: { tr: "Kemer", en: "Kemer", de: "Kemer", pl: "Kemer", ru: "Кемер", nl: "Kemer" } },
  { slug: "kiris", km: 60, min: 55, name: { tr: "Kiriş", en: "Kiris", de: "Kiriş", pl: "Kiris", ru: "Кириш", nl: "Kiris" } },
  { slug: "camyuva", km: 65, min: 55, name: { tr: "Çamyuva", en: "Camyuva", de: "Çamyuva", pl: "Camyuva", ru: "Чамьюва", nl: "Camyuva" } },
  { slug: "tekirova", km: 70, min: 60, name: { tr: "Tekirova", en: "Tekirova", de: "Tekirova", pl: "Tekirova", ru: "Текирова", nl: "Tekirova" } },
  { slug: "adrasan", km: 95, min: 90, name: { tr: "Adrasan", en: "Adrasan", de: "Adrasan", pl: "Adrasan", ru: "Адрасан", nl: "Adrasan" } },
  { slug: "kas", km: 190, min: 180, name: { tr: "Kaş", en: "Kas", de: "Kaş", pl: "Kas", ru: "Каш", nl: "Kas" } },
  { slug: "kalkan", km: 210, min: 190, name: { tr: "Kalkan", en: "Kalkan", de: "Kalkan", pl: "Kalkan", ru: "Калкан", nl: "Kalkan" } },
  { slug: "fethiye", km: 220, min: 200, name: { tr: "Fethiye", en: "Fethiye", de: "Fethiye", pl: "Fethiye", ru: "Фетхие", nl: "Fethiye" } },
  { slug: "marmaris", km: 300, min: 270, name: { tr: "Marmaris", en: "Marmaris", de: "Marmaris", pl: "Marmaris", ru: "Мармарис", nl: "Marmaris" } },
];

/** Destinations that carry the commercial demand — shown as full cards. */
const FEATURED_SLUGS = ["belek", "side", "kemer", "alanya", "kundu-lara", "sehirici", "kas", "kadriye"];

const regionImages: Record<string, string> = {
  belek: "/images/regions/belek-golf.jpg",
  side: "/images/regions/side-ancient.jpg",
  kemer: "/images/regions/kemer-coast.webp",
  alanya: "/images/regions/alanya-castle.jpg",
  "kundu-lara": "/images/regions/kundu-lara.jpg",
  sehirici: "/images/regions/sehirici.jpg",
  kas: "/images/regions/kas-beach.webp",
  kadriye: "/images/regions/kadriye.jpg",
};

function regionPath(slug: string) {
  return slug.endsWith("-transfer") ? `/${slug}` : `/${slug}-transfer`;
}

const PATH = "/antalya-airport-transfer";
const BASE_URL = "https://torviantransfer.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Admin-editable overrides. Null when the row is empty or the
  // table is missing, in which case the values below are used verbatim.
  const seoRow = await getSeoPage("antalya-airport-transfer");
  const loc = (locale as Locale) in content ? (locale as Locale) : "en";
  const c = content[loc];

  return applySeoPage({
    title: c.title,
    description: c.metaDesc,
    alternates: seoAlternates(locale, PATH),
    openGraph: seoOpenGraph(loc, PATH, c.title, c.metaDesc, "/images/antalya-airport.jpg"),
    twitter: seoTwitter(c.title, c.metaDesc, "/images/antalya-airport.jpg"),
  }, seoRow, locale);
}

export default async function AntalyaAirportTransferPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Admin-editable page copy. Every getter returns undefined when the
  // field is blank, so the existing expression stays the fallback.
  const seoRow = await getSeoPage("antalya-airport-transfer");
  const loc = (locale as Locale) in content ? (locale as Locale) : "en";
  const c = content[loc];
  const pageUrl = `${BASE_URL}/${loc}${PATH}`;

  const featured = FEATURED_SLUGS
    .map((slug) => REGIONS.find((r) => r.slug === slug))
    .filter((r): r is (typeof REGIONS)[number] => Boolean(r));
  const rest = REGIONS.filter((r) => !FEATURED_SLUGS.includes(r.slug));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    name: `${c.heading} — TORVIAN Transfer`,
    description: c.metaDesc,
    provider: {
      "@type": "Organization",
      name: "TORVIAN Transfer",
      url: BASE_URL,
      telephone: "+90-546-940-79-55",
    },
    serviceType: "Airport Transfer",
    areaServed: { "@type": "Place", name: "Antalya, Turkey" },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: pageUrl,
      servicePhone: "+90-546-940-79-55",
      availableLanguage: ["Turkish", "English", "German", "Russian", "Polish", "Dutch"],
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "TORVIAN Transfer", item: `${BASE_URL}/${loc}` },
      { "@type": "ListItem", position: 2, name: c.breadcrumb, item: pageUrl },
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
        <section
          className="relative pb-16 pt-24 overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(16,185,129,0.03) 50%, #FFFFFF 100%)" }}
        >
          <div className="relative max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link href="/" className="hover:text-gray-900 transition-colors">{c.home}</Link>
              <span>/</span>
              <span className="text-gray-900">{c.breadcrumb}</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                  style={{ backgroundColor: "rgba(0,122,255,0.1)", color: "#0056CC" }}
                >
                  <Plane size={12} strokeWidth={2} /> {c.badge}
                </div>
                <h1 className="text-3xl lg:text-5xl font-bold mb-4 tracking-tight text-gray-900">
                  {seoH1(seoRow, locale) ?? c.heading}
                </h1>
                <p className="text-base lg:text-lg text-gray-500 mb-4 leading-relaxed">
                  {seoIntro(seoRow, locale) ?? c.subheading}
                </p>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">{c.desc}</p>

                <ul className="grid sm:grid-cols-2 gap-2 mb-8">
                  {c.pills.map((pill) => (
                    <li key={pill} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                      {pill}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/booking"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base transition-all"
                    style={{ background: "linear-gradient(135deg, #007AFF 0%, #0056CC 100%)" }}
                  >
                    {c.bookCta}
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/regions"
                    className="inline-flex items-center gap-2 px-6 py-4 rounded-xl font-semibold text-gray-700 text-base bg-white transition-colors hover:text-blue-600"
                    style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    {c.secondaryCta}
                  </Link>
                </div>
              </div>

              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                <Image
                  src="/images/antalya-airport.jpg"
                  alt={c.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Arrival flow */}
        <section className="py-16" style={{ background: "#F5F5F7" }}>
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8 text-center tracking-tight">
              {c.stepsTitle}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {c.steps.map((step, i) => (
                <div key={step.title} className="rounded-2xl bg-white p-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-4"
                    style={{ backgroundColor: "rgba(0,122,255,0.1)", color: "#0056CC" }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">{c.whyTitle}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {c.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <CheckCircle size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Destinations hub */}
        <section className="py-16" style={{ background: "#F5F5F7" }}>
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 text-center tracking-tight">
              {c.destinationsTitle}
            </h2>
            <p className="text-sm text-gray-500 text-center mb-8 max-w-2xl mx-auto">
              {c.destinationsIntro}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.map((region) => {
                const img = regionImages[region.slug];
                const name = region.name[loc];
                return (
                  <Link
                    key={region.slug}
                    href={regionPath(region.slug)}
                    className="group rounded-xl overflow-hidden bg-white transition-all hover:scale-[1.02]"
                    style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    {img && (
                      <div className="relative h-36 overflow-hidden">
                        <Image
                          src={img}
                          alt={`${c.badge} — ${name}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 288px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-2 group-hover:text-blue-600 transition-colors">
                        {name} Transfer
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> ~{region.min} {c.minLabel}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {region.km} km
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 group-hover:gap-2 transition-all">
                        {c.viewRoute} <ArrowRight size={12} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <h3 className="text-base font-semibold text-gray-900 mt-12 mb-4 text-center">
              {c.allDestinationsTitle}
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {rest.map((region) => (
                <Link
                  key={region.slug}
                  href={regionPath(region.slug)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white hover:text-blue-600 transition-colors"
                  style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <MapPin size={13} />
                  {region.name[loc]}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="py-12 bg-white">
          <div className="max-w-5xl mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Tag, label: c.pills[1] },
              { icon: Plane, label: c.pills[2] },
              { icon: Home, label: c.pills[3] },
              { icon: Headphones, label: c.pills[4] },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <Icon size={18} className="text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16" style={{ background: "#F5F5F7" }}>
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">{c.faqTitle}</h2>
            <div className="space-y-4">
              {c.faqs.map((item) => (
                <div key={item.q} className="rounded-xl bg-white p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
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
            <ShieldCheck size={32} className="text-blue-600 mx-auto mb-4" />
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
