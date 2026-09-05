import type { Metadata } from "next";
import { getSeoPage, applySeoPage, seoH1, seoIntro } from "@/lib/seoPages";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import { Crown, CheckCircle, Star, Plane, ArrowRight, Wifi, Wind, Users } from "lucide-react";
import { seoAlternates, seoOpenGraph, seoTwitter, INDEXABLE_ROBOTS, NOINDEX_ROBOTS } from "@/lib/seo";

import { inlineCopyLocales, type Locale } from "@/i18n/config";

// Keyword source: this site's own Google Trends research (migrations 031/043/044) —
// "vip transfer antalya" is Germany's #1 query for this service (+30% growth),
// and shows up as a distinct, non-region-specific commercial term worldwide.
// Deliberately NOT a copy of the region-page template: this page sells the
// premium vehicle/service tier itself, not one destination.
/* `Partial`, with English standing in for whatever is missing.
   These five pages carry a whole page of marketing copy per language,
   written inline. A strict `Record<Locale, …>` means no language can be
   added to the site at all until every one of them is rewritten in it —
   which is a reason to postpone a language, not a reason to translate.
   Falling back matches what the region pages already do with their own
   per-locale columns, and it is the difference between a locale that
   ships and a locale that waits. */
const content: Partial<Record<Locale, {
  title: string;
  metaDesc: string;
  heading: string;
  subheading: string;
  desc: string;
  features: string[];
  vehicleTitle: string;
  vehicleSpecs: { label: string; icon: "users" | "wifi" | "wind" | "star" }[];
  regionsTitle: string;
  regions: { label: string; href: string }[];
  faqQ1: string; faqA1: string;
  faqQ2: string; faqA2: string;
  faqQ3: string; faqA3: string;
  faqQ4: string; faqA4: string;
  faqQ5: string; faqA5: string;
  bookCta: string;
  whyTitle: string;
  breadcrumb: string;
  standardNote: string;
}>> = {
  en: {
    title: "VIP Transfer Antalya Airport | Premium Private Car Service",
    metaDesc: "VIP transfer from Antalya Airport: newer Mercedes Vito fleet, English-speaking drivers, priority meet & greet. Fixed price, no shared stops. Book online in 2 minutes.",
    heading: "VIP Transfer Antalya Airport",
    subheading: "The premium tier of TORVIAN's fleet — newer vehicles, English-speaking drivers, and a meet & greet built for guests who don't want to wait in line.",
    desc: "\"VIP transfer\" means more than a private car: it's the top-spec vehicle in our fleet, a driver assigned to you alone from the moment you land, and a pickup that starts the second you clear the arrivals hall — not ten minutes later while a shared shuttle fills up. It costs the same as our standard private transfer; the difference is entirely in the experience.",
    features: [
      "Newest Mercedes Vito in the fleet — leather interior, no worn seats",
      "Driver assigned to you only — never shared with another booking",
      "English-speaking driver as standard; German or Russian on request",
      "Priority meet & greet: your name board is at the front of the arrivals hall",
      "Bottled water and phone charging cable on board",
      "Free Wi-Fi and climate control set before you board",
      "Same fixed price as standard transfer — VIP is a service tier, not a surcharge",
      "Covers every resort area on the coast, from Kundu-Lara to Alanya",
    ],
    vehicleTitle: "The VIP Vehicle",
    vehicleSpecs: [
      { label: "Up to 5 passengers, one group per car", icon: "users" },
      { label: "Free on-board Wi-Fi", icon: "wifi" },
      { label: "Climate control, pre-set for arrival", icon: "wind" },
      { label: "Newest vehicles in the fleet", icon: "star" },
    ],
    regionsTitle: "VIP Transfer Available To",
    regions: [
      { label: "VIP Transfer to Belek", href: "/belek-transfer" },
      { label: "VIP Transfer to Side", href: "/side-transfer" },
      { label: "VIP Transfer to Alanya", href: "/alanya-transfer" },
      { label: "VIP Transfer to Kemer", href: "/kemer-transfer" },
      { label: "VIP Transfer to Kundu-Lara", href: "/kundu-lara-transfer" },
      { label: "VIP Transfer to Antalya City", href: "/sehirici-transfer" },
    ],
    faqQ1: "What actually makes this a \"VIP\" transfer?",
    faqA1: "Three things: the vehicle is the newest Mercedes Vito in our fleet, the driver is assigned to you alone from landing to drop-off (no shared stops, ever), and your meet & greet is prioritized at the front of the arrivals hall rather than a general waiting area.",
    faqQ2: "Does VIP transfer cost more than a standard private transfer?",
    faqA2: "No. At TORVIAN, VIP is our standard service level, not a paid upgrade — every booking already includes the private vehicle, meet & greet, and flight tracking described here at the same fixed price shown at checkout.",
    faqQ3: "Can I request an English- or German-speaking driver?",
    faqA3: "Yes. All drivers speak basic English. If you'd prefer a German- or Russian-speaking driver specifically, add a note when booking and we'll confirm availability before your pickup.",
    faqQ4: "Which vehicle is used for the VIP service?",
    faqA4: "A Mercedes Vito with leather seats, air conditioning, and free Wi-Fi, seating up to 5 passengers with generous luggage space. It's the same model across our fleet — VIP bookings get the newest unit available on your travel date.",
    faqQ5: "Does VIP transfer cover every resort area, or only specific hotels?",
    faqA5: "Every resort area on the Turkish Riviera that we serve — from Kundu-Lara nearest the airport to Alanya at the far east of the coast. Choose your destination during booking and the same VIP standard applies regardless of distance.",
    bookCta: "Book Your VIP Transfer",
    whyTitle: "What You Get With Every VIP Booking",
    breadcrumb: "VIP Transfer Antalya",
    standardNote: "VIP is TORVIAN's standard — every booking includes it at no extra charge. There is no separate \"economy\" tier to upsell you out of.",
  },
  tr: {
    title: "Antalya Havalimanı VIP Transfer | Özel Şoförlü Premium Araç",
    metaDesc: "Antalya Havalimanı'ndan VIP transfer: filodaki en yeni Mercedes Vito, öncelikli karşılama, sadece size ayrılmış şoför. Sabit fiyat, paylaşımlı durak yok. 2 dakikada rezervasyon.",
    heading: "Antalya Havalimanı VIP Transfer",
    subheading: "TORVIAN filosunun premium katmanı — en yeni araçlar, deneyimli şoförler ve varış salonunda beklemeden başlayan karşılama.",
    desc: "\"VIP transfer\" sadece özel araç demek değildir: filomuzdaki en üst seviye araç, indiğiniz andan itibaren yalnızca size ayrılan bir şoför ve paylaşımlı bir servisin dolmasını beklemeden, varış salonundan çıkar çıkmaz başlayan bir karşılama demektir. Fiyatı standart özel transferimizle aynıdır; fark tamamen deneyimdedir.",
    features: [
      "Filodaki en yeni Mercedes Vito — deri koltuk, yıpranmamış iç mekan",
      "Yalnızca size ayrılan şoför — başka bir rezervasyonla paylaşılmaz",
      "Standart olarak İngilizce konuşan şoför; talep üzerine Almanca veya Rusça",
      "Öncelikli karşılama: isim tabelanız varış salonunun en önünde",
      "Araçta su ve telefon şarj kablosu",
      "Binmeden önce ayarlanmış ücretsiz Wi-Fi ve klima",
      "Standart transferle aynı sabit fiyat — VIP bir hizmet seviyesidir, ek ücret değil",
      "Kundu-Lara'dan Alanya'ya kadar sahildeki tüm tatil bölgelerini kapsar",
    ],
    vehicleTitle: "VIP Aracınız",
    vehicleSpecs: [
      { label: "5 yolcuya kadar, araç başına tek grup", icon: "users" },
      { label: "Ücretsiz araç içi Wi-Fi", icon: "wifi" },
      { label: "Varışa göre önceden ayarlanmış klima", icon: "wind" },
      { label: "Filodaki en yeni araçlar", icon: "star" },
    ],
    regionsTitle: "VIP Transfer Hizmeti Verilen Bölgeler",
    regions: [
      { label: "Belek VIP Transfer", href: "/belek-transfer" },
      { label: "Side VIP Transfer", href: "/side-transfer" },
      { label: "Alanya VIP Transfer", href: "/alanya-transfer" },
      { label: "Kemer VIP Transfer", href: "/kemer-transfer" },
      { label: "Kundu-Lara VIP Transfer", href: "/kundu-lara-transfer" },
      { label: "Antalya Şehir Merkezi VIP Transfer", href: "/sehirici-transfer" },
    ],
    faqQ1: "Bu transferi \"VIP\" yapan tam olarak nedir?",
    faqA1: "Üç şey: araç filomuzdaki en yeni Mercedes Vito'dur, şoför inişinizden bırakışınıza kadar yalnızca size ayrılır (asla paylaşımlı durak yapılmaz) ve karşılamanız varış salonunun genel bekleme alanı yerine en önde önceliklidir.",
    faqQ2: "VIP transfer standart özel transferden daha mı pahalı?",
    faqA2: "Hayır. TORVIAN'da VIP, ücretli bir yükseltme değil standart hizmet seviyemizdir — her rezervasyon zaten burada anlatılan özel araç, karşılama ve uçuş takibini ödeme sırasında görülen sabit fiyatla içerir.",
    faqQ3: "İngilizce veya Almanca konuşan bir şoför talep edebilir miyim?",
    faqA3: "Evet. Tüm şoförlerimiz temel İngilizce konuşur. Özellikle Almanca veya Rusça konuşan bir şoför tercih ediyorsanız, rezervasyon sırasında not bırakın; karşılamadan önce müsaitliği onaylarız.",
    faqQ4: "VIP hizmette hangi araç kullanılıyor?",
    faqA4: "Deri koltuklu, klimalı ve ücretsiz Wi-Fi'lı, 5 yolcuya kadar kapasiteli ve geniş bagaj alanına sahip bir Mercedes Vito. Filomuzdaki tüm araçlar aynı modeldir — VIP rezervasyonlar seyahat tarihinizde müsait en yeni aracı alır.",
    faqQ5: "VIP transfer her tatil bölgesini mi kapsıyor, yoksa sadece belirli otelleri mi?",
    faqA5: "Hizmet verdiğimiz Türk Rivierası'ndaki her tatil bölgesini kapsar — havalimanına en yakın Kundu-Lara'dan sahilin doğusundaki Alanya'ya kadar. Rezervasyon sırasında varış noktanızı seçin, mesafeden bağımsız olarak aynı VIP standardı uygulanır.",
    bookCta: "VIP Transferinizi Rezerve Edin",
    whyTitle: "Her VIP Rezervasyonda Neler Dahil",
    breadcrumb: "Antalya VIP Transfer",
    standardNote: "VIP, TORVIAN'ın standardıdır — her rezervasyona ek ücret olmadan dahildir. Sizi yukarı satmak için ayrı bir \"ekonomi\" katmanı yoktur.",
  },
  de: {
    title: "VIP Transfer Antalya Flughafen | Premium Privatfahrzeug",
    metaDesc: "VIP Transfer ab Flughafen Antalya: neuester Mercedes Vito der Flotte, Ihnen allein zugewiesener Fahrer, priorisiertes Meet & Greet. Festpreis, keine Sammelstopps. In 2 Minuten buchen.",
    heading: "VIP Transfer Antalya Flughafen",
    subheading: "Die Premiumstufe der TORVIAN-Flotte — neuere Fahrzeuge, Ihnen allein zugewiesene Fahrer und ein Empfang, der beginnt, sobald Sie die Ankunftshalle verlassen.",
    desc: "\"VIP Transfer\" bedeutet mehr als ein Privatfahrzeug: Es ist das hochwertigste Fahrzeug unserer Flotte, ein Fahrer, der ab der Landung ausschließlich Ihnen zugeteilt ist, und eine Abholung, die beginnt, sobald Sie die Ankunftshalle verlassen — nicht erst zehn Minuten später, während ein Sammelshuttle sich füllt. Der Preis ist derselbe wie bei unserem Standard-Privattransfer; der Unterschied liegt ganz im Erlebnis.",
    features: [
      "Neuester Mercedes Vito der Flotte — Ledersitze, keine abgenutzte Ausstattung",
      "Fahrer nur für Sie — nie mit einer anderen Buchung geteilt",
      "Englischsprachiger Fahrer als Standard; Deutsch oder Russisch auf Anfrage",
      "Priorisiertes Meet & Greet: Ihr Namensschild steht vorne in der Ankunftshalle",
      "Wasser und Ladekabel fürs Telefon an Bord",
      "Kostenloses WLAN und Klimaanlage, vor Ihrer Ankunft eingestellt",
      "Gleicher Festpreis wie beim Standardtransfer — VIP ist eine Servicestufe, kein Aufpreis",
      "Deckt jedes Ferienort an der Küste ab, von Kundu-Lara bis Alanya",
    ],
    vehicleTitle: "Ihr VIP-Fahrzeug",
    vehicleSpecs: [
      { label: "Bis zu 5 Passagiere, eine Gruppe pro Fahrzeug", icon: "users" },
      { label: "Kostenloses WLAN an Bord", icon: "wifi" },
      { label: "Klimaanlage, vor Ankunft eingestellt", icon: "wind" },
      { label: "Neueste Fahrzeuge der Flotte", icon: "star" },
    ],
    regionsTitle: "VIP Transfer Verfügbar Nach",
    regions: [
      { label: "VIP Transfer nach Belek", href: "/belek-transfer" },
      { label: "VIP Transfer nach Side", href: "/side-transfer" },
      { label: "VIP Transfer nach Alanya", href: "/alanya-transfer" },
      { label: "VIP Transfer nach Kemer", href: "/kemer-transfer" },
      { label: "VIP Transfer nach Kundu-Lara", href: "/kundu-lara-transfer" },
      { label: "VIP Transfer Antalya Stadtzentrum", href: "/sehirici-transfer" },
    ],
    faqQ1: "Was macht diesen Transfer wirklich zu \"VIP\"?",
    faqA1: "Drei Dinge: Das Fahrzeug ist der neueste Mercedes Vito unserer Flotte, der Fahrer ist ab der Landung bis zum Ziel ausschließlich Ihnen zugeteilt (nie Sammelstopps), und Ihr Meet & Greet hat Priorität vorne in der Ankunftshalle statt in einem allgemeinen Wartebereich.",
    faqQ2: "Kostet der VIP-Transfer mehr als ein normaler Privattransfer?",
    faqA2: "Nein. Bei TORVIAN ist VIP unser Standard-Servicelevel, kein kostenpflichtiges Upgrade — jede Buchung enthält bereits das hier beschriebene Privatfahrzeug, Meet & Greet und die Flugverfolgung zum selben Festpreis, der beim Bezahlen angezeigt wird.",
    faqQ3: "Kann ich einen englisch- oder deutschsprachigen Fahrer anfragen?",
    faqA3: "Ja. Alle Fahrer sprechen grundlegendes Englisch. Wenn Sie speziell einen deutsch- oder russischsprachigen Fahrer wünschen, hinterlassen Sie bei der Buchung eine Notiz — wir bestätigen die Verfügbarkeit vor Ihrer Abholung.",
    faqQ4: "Welches Fahrzeug wird für den VIP-Service eingesetzt?",
    faqA4: "Ein Mercedes Vito mit Ledersitzen, Klimaanlage und kostenlosem WLAN, mit Platz für bis zu 5 Passagiere und großzügigem Gepäckraum. Es ist dasselbe Modell in unserer gesamten Flotte — VIP-Buchungen erhalten das neueste verfügbare Fahrzeug an Ihrem Reisedatum.",
    faqQ5: "Deckt der VIP-Transfer jedes Ferienort ab oder nur bestimmte Hotels?",
    faqA5: "Jedes Ferienort an der Türkischen Riviera, das wir bedienen — von Kundu-Lara, dem Flughafen am nächsten, bis Alanya im Osten der Küste. Wählen Sie Ihr Ziel bei der Buchung; derselbe VIP-Standard gilt unabhängig von der Entfernung.",
    bookCta: "VIP Transfer Buchen",
    whyTitle: "Das Erhalten Sie Bei Jeder VIP-Buchung",
    breadcrumb: "VIP Transfer Antalya",
    standardNote: "VIP ist der Standard bei TORVIAN — in jeder Buchung ohne Aufpreis enthalten. Es gibt keine separate \"Economy\"-Stufe, aus der wir Sie hochverkaufen.",
  },
  pl: {
    title: "VIP Transfer Antalya Lotnisko | Prywatny Pojazd Premium",
    metaDesc: "VIP transfer z lotniska Antalya: najnowszy Mercedes Vito z floty, kierowca przypisany tylko Tobie, priorytetowe powitanie. Stała cena, bez wspólnych przystanków. Rezerwacja w 2 minuty.",
    heading: "VIP Transfer Antalya Lotnisko",
    subheading: "Premium warstwa floty TORVIAN — nowsze pojazdy, kierowca przypisany tylko Tobie i powitanie, które zaczyna się, gdy tylko opuścisz halę przylotów.",
    desc: "\"VIP transfer\" to więcej niż prywatny pojazd: to najlepszy pojazd w naszej flocie, kierowca przypisany wyłącznie Tobie od momentu lądowania i odbiór, który zaczyna się natychmiast po opuszczeniu hali przylotów — a nie dziesięć minut później, gdy zapełnia się wspólny bus. Cena jest taka sama jak przy standardowym transferze prywatnym; różnica leży całkowicie w doświadczeniu.",
    features: [
      "Najnowszy Mercedes Vito we flocie — skórzane fotele, brak zużytego wnętrza",
      "Kierowca przypisany tylko Tobie — nigdy dzielony z inną rezerwacją",
      "Kierowca mówiący po angielsku standardowo; niemiecki lub rosyjski na życzenie",
      "Priorytetowe powitanie: Twoja tabliczka jest na przedzie hali przylotów",
      "Woda i kabel do ładowania telefonu na pokładzie",
      "Bezpłatne Wi-Fi i klimatyzacja ustawione przed Twoim przybyciem",
      "Ta sama stała cena co przy standardowym transferze — VIP to poziom usługi, nie dopłata",
      "Obejmuje każdy kurort na wybrzeżu, od Kundu-Lara po Alanyę",
    ],
    vehicleTitle: "Twój Pojazd VIP",
    vehicleSpecs: [
      { label: "Do 5 pasażerów, jedna grupa na pojazd", icon: "users" },
      { label: "Bezpłatne Wi-Fi na pokładzie", icon: "wifi" },
      { label: "Klimatyzacja ustawiona przed przybyciem", icon: "wind" },
      { label: "Najnowsze pojazdy floty", icon: "star" },
    ],
    regionsTitle: "Transfer VIP Dostępny Do",
    regions: [
      { label: "VIP Transfer do Belek", href: "/belek-transfer" },
      { label: "VIP Transfer do Side", href: "/side-transfer" },
      { label: "VIP Transfer do Alanyi", href: "/alanya-transfer" },
      { label: "VIP Transfer do Kemer", href: "/kemer-transfer" },
      { label: "VIP Transfer do Kundu-Lara", href: "/kundu-lara-transfer" },
      { label: "VIP Transfer do Centrum Antalyi", href: "/sehirici-transfer" },
    ],
    faqQ1: "Co dokładnie czyni ten transfer \"VIP\"?",
    faqA1: "Trzy rzeczy: pojazd to najnowszy Mercedes Vito w naszej flocie, kierowca jest przypisany wyłącznie Tobie od lądowania do celu (nigdy wspólne przystanki), a Twoje powitanie ma priorytet na przedzie hali przylotów zamiast w ogólnej strefie oczekiwania.",
    faqQ2: "Czy transfer VIP kosztuje więcej niż standardowy transfer prywatny?",
    faqA2: "Nie. W TORVIAN VIP to nasz standardowy poziom usługi, a nie płatne ulepszenie — każda rezerwacja już zawiera opisany tu prywatny pojazd, powitanie i śledzenie lotu w tej samej stałej cenie widocznej przy płatności.",
    faqQ3: "Czy mogę poprosić o kierowcę mówiącego po angielsku lub niemiecku?",
    faqA3: "Tak. Wszyscy kierowcy mówią podstawowym angielskim. Jeśli wolisz konkretnie kierowcę mówiącego po niemiecku lub rosyjsku, zostaw notatkę podczas rezerwacji — potwierdzimy dostępność przed odbiorem.",
    faqQ4: "Jaki pojazd jest używany w usłudze VIP?",
    faqA4: "Mercedes Vito ze skórzanymi fotelami, klimatyzacją i bezpłatnym Wi-Fi, mieszczący do 5 pasażerów z dużą przestrzenią na bagaż. To ten sam model w całej naszej flocie — rezerwacje VIP otrzymują najnowszy dostępny pojazd w dniu podróży.",
    faqQ5: "Czy transfer VIP obejmuje każdy kurort, czy tylko określone hotele?",
    faqA5: "Każdy kurort na Riwierze Tureckiej, który obsługujemy — od Kundu-Lara najbliżej lotniska po Alanyę na wschodnim krańcu wybrzeża. Wybierz cel podczas rezerwacji; ten sam standard VIP obowiązuje niezależnie od odległości.",
    bookCta: "Zarezerwuj Transfer VIP",
    whyTitle: "Co Otrzymujesz Przy Każdej Rezerwacji VIP",
    breadcrumb: "VIP Transfer Antalya",
    standardNote: "VIP to standard TORVIAN — zawarty w każdej rezerwacji bez dodatkowej opłaty. Nie ma osobnego poziomu \"ekonomicznego\", z którego chcielibyśmy Cię namówić na droższą opcję.",
  },
  ru: {
    title: "VIP Трансфер Аэропорт Анталии | Премиальный Частный Автомобиль",
    metaDesc: "VIP-трансфер из аэропорта Анталии: новейший Mercedes Vito в парке, водитель закреплён только за вами, приоритетная встреча. Фиксированная цена, без общих остановок. Бронирование за 2 минуты.",
    heading: "VIP Трансфер Аэропорт Анталии",
    subheading: "Премиальный уровень парка TORVIAN — новые автомобили, водитель только для вас и встреча, которая начинается сразу у выхода из зала прилёта.",
    desc: "«VIP-трансфер» — это больше, чем просто частный автомобиль: это лучший автомобиль нашего парка, водитель, закреплённый исключительно за вами с момента приземления, и подача, которая начинается сразу после выхода из зала прилёта — а не через десять минут, пока заполняется групповой шаттл. Цена такая же, как у стандартного частного трансфера; разница целиком в качестве обслуживания.",
    features: [
      "Новейший Mercedes Vito в парке — кожаный салон, без изношенной отделки",
      "Водитель только для вас — никогда не делится с другим бронированием",
      "Водитель, говорящий по-английски, по умолчанию; немецкий или русский по запросу",
      "Приоритетная встреча: табличка с вашим именем — в первых рядах зала прилёта",
      "Вода и кабель для зарядки телефона в салоне",
      "Бесплатный Wi-Fi и кондиционер, настроенные заранее",
      "Та же фиксированная цена, что и у стандартного трансфера — VIP это уровень сервиса, а не доплата",
      "Покрывает все курортные зоны побережья, от Кунду-Лары до Аланьи",
    ],
    vehicleTitle: "Ваш VIP-Автомобиль",
    vehicleSpecs: [
      { label: "До 5 пассажиров, одна группа на автомобиль", icon: "users" },
      { label: "Бесплатный Wi-Fi в салоне", icon: "wifi" },
      { label: "Кондиционер, настроенный заранее", icon: "wind" },
      { label: "Новейшие автомобили парка", icon: "star" },
    ],
    regionsTitle: "VIP Трансфер Доступен В",
    regions: [
      { label: "VIP трансфер в Белек", href: "/belek-transfer" },
      { label: "VIP трансфер в Сиде", href: "/side-transfer" },
      { label: "VIP трансфер в Аланью", href: "/alanya-transfer" },
      { label: "VIP трансфер в Кемер", href: "/kemer-transfer" },
      { label: "VIP трансфер в Кунду-Лару", href: "/kundu-lara-transfer" },
      { label: "VIP трансфер в центр Анталии", href: "/sehirici-transfer" },
    ],
    faqQ1: "Что именно делает этот трансфер «VIP»?",
    faqA1: "Три вещи: автомобиль — новейший Mercedes Vito нашего парка, водитель закреплён исключительно за вами с момента приземления до высадки (никогда никаких общих остановок), а ваша встреча приоритетна — в первых рядах зала прилёта, а не в общей зоне ожидания.",
    faqQ2: "VIP-трансфер стоит дороже стандартного частного трансфера?",
    faqA2: "Нет. В TORVIAN VIP — это наш стандартный уровень сервиса, а не платное улучшение: каждое бронирование уже включает описанный здесь частный автомобиль, встречу и отслеживание рейса по той же фиксированной цене, которая показана при оформлении.",
    faqQ3: "Могу ли я попросить водителя, говорящего по-английски или по-немецки?",
    faqA3: "Да. Все водители говорят на базовом английском. Если вы предпочитаете именно немецко- или русскоговорящего водителя, оставьте заметку при бронировании — мы подтвердим доступность до вашей встречи.",
    faqQ4: "Какой автомобиль используется для VIP-сервиса?",
    faqA4: "Mercedes Vito с кожаными сиденьями, кондиционером и бесплатным Wi-Fi, вмещающий до 5 пассажиров с просторным багажным отделением. Это одна и та же модель во всём нашем парке — VIP-бронирования получают новейший доступный автомобиль на дату вашей поездки.",
    faqQ5: "VIP-трансфер покрывает все курортные зоны или только определённые отели?",
    faqA5: "Все курортные зоны Турецкой Ривьеры, которые мы обслуживаем — от Кунду-Лары, ближайшей к аэропорту, до Аланьи на восточном краю побережья. Выберите пункт назначения при бронировании — тот же стандарт VIP действует независимо от расстояния.",
    bookCta: "Забронировать VIP Трансфер",
    whyTitle: "Что Входит в Каждое VIP-Бронирование",
    breadcrumb: "VIP Трансфер Анталия",
    standardNote: "VIP — это стандарт TORVIAN, включённый в каждое бронирование без доплаты. Отдельного «эконом»-уровня, из которого вас пытались бы поднять до VIP, у нас нет.",
  },
  nl: {
    title: "VIP Transfer Antalya Luchthaven | Premium Privévoertuig",
    metaDesc: "VIP-transfer vanaf de luchthaven Antalya: nieuwste Mercedes Vito uit de vloot, chauffeur alleen voor u, prioritaire ontvangst. Vaste prijs, geen gedeelde stops. Boek online in 2 minuten.",
    heading: "VIP Transfer Antalya Luchthaven",
    subheading: "De premium laag van de TORVIAN-vloot — nieuwere voertuigen, een chauffeur alleen voor u, en een ontvangst die begint zodra u de aankomsthal verlaat.",
    desc: "\"VIP-transfer\" betekent meer dan een privévoertuig: het is het beste voertuig uit onze vloot, een chauffeur die vanaf de landing uitsluitend aan u is toegewezen, en een ophaalservice die begint zodra u de aankomsthal verlaat — niet tien minuten later terwijl een gedeelde shuttle zich vult. De prijs is hetzelfde als bij onze standaard privétransfer; het verschil zit volledig in de ervaring.",
    features: [
      "Nieuwste Mercedes Vito uit de vloot — leren bekleding, geen versleten interieur",
      "Chauffeur alleen voor u — nooit gedeeld met een andere boeking",
      "Engelssprekende chauffeur als standaard; Duits of Russisch op aanvraag",
      "Prioritaire ontvangst: uw naambord staat vooraan in de aankomsthal",
      "Water en telefoonoplaadkabel aan boord",
      "Gratis wifi en airco, vooraf ingesteld voor uw aankomst",
      "Dezelfde vaste prijs als de standaardtransfer — VIP is een serviceniveau, geen toeslag",
      "Dekt elk resortgebied aan de kust, van Kundu-Lara tot Alanya",
    ],
    vehicleTitle: "Uw VIP-Voertuig",
    vehicleSpecs: [
      { label: "Tot 5 passagiers, één groep per voertuig", icon: "users" },
      { label: "Gratis wifi aan boord", icon: "wifi" },
      { label: "Airco, vooraf ingesteld voor aankomst", icon: "wind" },
      { label: "Nieuwste voertuigen van de vloot", icon: "star" },
    ],
    regionsTitle: "VIP-Transfer Beschikbaar Naar",
    regions: [
      { label: "VIP-transfer naar Belek", href: "/belek-transfer" },
      { label: "VIP-transfer naar Side", href: "/side-transfer" },
      { label: "VIP-transfer naar Alanya", href: "/alanya-transfer" },
      { label: "VIP-transfer naar Kemer", href: "/kemer-transfer" },
      { label: "VIP-transfer naar Kundu-Lara", href: "/kundu-lara-transfer" },
      { label: "VIP-transfer naar Antalya centrum", href: "/sehirici-transfer" },
    ],
    faqQ1: "Wat maakt deze transfer echt \"VIP\"?",
    faqA1: "Drie dingen: het voertuig is de nieuwste Mercedes Vito uit onze vloot, de chauffeur is vanaf de landing tot aan afzetten uitsluitend aan u toegewezen (nooit gedeelde stops), en uw ontvangst heeft prioriteit vooraan in de aankomsthal in plaats van een algemene wachtruimte.",
    faqQ2: "Kost een VIP-transfer meer dan een standaard privétransfer?",
    faqA2: "Nee. Bij TORVIAN is VIP ons standaard serviceniveau, geen betaalde upgrade — elke boeking bevat al het hier beschreven privévoertuig, de ontvangst en vluchtmonitoring voor dezelfde vaste prijs die u bij het afrekenen ziet.",
    faqQ3: "Kan ik een Engels- of Duitssprekende chauffeur aanvragen?",
    faqA3: "Ja. Alle chauffeurs spreken basis Engels. Wilt u specifiek een Duits- of Russischsprekende chauffeur, vermeld dit dan bij het boeken — wij bevestigen de beschikbaarheid vóór uw ophaalmoment.",
    faqQ4: "Welk voertuig wordt gebruikt voor de VIP-service?",
    faqA4: "Een Mercedes Vito met leren stoelen, airconditioning en gratis wifi, met plaats voor maximaal 5 passagiers en ruime bagageruimte. Het is hetzelfde model in onze hele vloot — VIP-boekingen krijgen het nieuwste beschikbare voertuig op uw reisdatum.",
    faqQ5: "Dekt de VIP-transfer elk resortgebied, of alleen bepaalde hotels?",
    faqA5: "Elk resortgebied aan de Turkse Rivièra dat wij bedienen — van Kundu-Lara, het dichtst bij de luchthaven, tot Alanya aan het oostelijke uiteinde van de kust. Kies uw bestemming tijdens het boeken; dezelfde VIP-standaard geldt ongeacht de afstand.",
    bookCta: "Boek Uw VIP-Transfer",
    whyTitle: "Wat U Krijgt Bij Elke VIP-Boeking",
    breadcrumb: "VIP Transfer Antalya",
    standardNote: "VIP is de standaard bij TORVIAN — inbegrepen bij elke boeking zonder toeslag. Er is geen apart \"economy\"-niveau waar wij u vanaf proberen te verkopen.",
  },
};

const iconMap = { users: Users, wifi: Wifi, wind: Wind, star: Star };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Admin-editable overrides. Null when the row is empty or the
  // table is missing, in which case the values below are used verbatim.
  const seoRow = await getSeoPage("vip-transfer-antalya");
  const loc = (locale as Locale) in content ? (locale as Locale) : "en";
  const c = content[loc] ?? content.en!;
  const path = "/vip-transfer-antalya";

  return applySeoPage({
    title: c.title,
    description: c.metaDesc,
    alternates: seoAlternates(locale, path, [...inlineCopyLocales]),
    openGraph: seoOpenGraph(loc, path, c.title, c.metaDesc, "/images/havaalani-vip-transfer.jpg"),
    robots: inlineCopyLocales.includes(locale as Locale) ? INDEXABLE_ROBOTS : NOINDEX_ROBOTS,
    twitter: seoTwitter(c.title, c.metaDesc, "/images/havaalani-vip-transfer.jpg"),
  }, seoRow, locale);
}

export default async function VipTransferAntalyaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Admin-editable page copy. Every getter returns undefined when the
  // field is blank, so the existing expression stays the fallback.
  const seoRow = await getSeoPage("vip-transfer-antalya");
  const loc = (locale as Locale) in content ? (locale as Locale) : "en";
  const c = content[loc] ?? content.en!;

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
    name: "VIP Transfer Antalya Airport — TORVIAN",
    description: c.metaDesc,
    provider: { "@type": "Organization", name: "TORVIAN Transfer", url: "https://torviantransfer.com" },
    areaServed: { "@type": "Place", name: "Antalya, Turkey" },
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
      { "@type": "ListItem", position: 1, name: "TORVIAN Transfer", item: `https://torviantransfer.com/${loc}` },
      { "@type": "ListItem", position: 2, name: c.breadcrumb, item: `https://torviantransfer.com/${loc}/vip-transfer-antalya` },
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
        <section className="relative pb-16 pt-24 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.05) 0%, rgba(0,122,255,0.04) 50%, #FFFFFF 100%)" }}>
          <div className="relative max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-gray-900">{c.breadcrumb}</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ backgroundColor: "rgba(249,115,22,0.1)", color: "#C2410C" }}>
                  <Crown size={12} strokeWidth={2} /> VIP
                </div>
                <h1 className="text-3xl lg:text-5xl font-bold mb-4 tracking-tight text-gray-900">
                  {seoH1(seoRow, locale) ?? c.heading}
                </h1>
                <p className="text-base lg:text-lg text-gray-500 mb-4 leading-relaxed">
                  {seoIntro(seoRow, locale) ?? c.subheading}
                </p>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">{c.desc}</p>

                <div className="flex items-center gap-2 mb-8 p-3 rounded-xl text-xs" style={{ backgroundColor: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", color: "#047857" }}>
                  <CheckCircle size={14} className="flex-shrink-0" />
                  {c.standardNote}
                </div>

                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base transition-all"
                  style={{ background: "linear-gradient(135deg, #007AFF 0%, #0056CC 100%)" }}
                >
                  {c.bookCta}
                  <ArrowRight size={18} />
                </Link>
              </div>

              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                <Image
                  src="/images/havaalani-vip-transfer.jpg"
                  alt="VIP transfer vehicle at Antalya Airport"
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

        {/* Vehicle specs */}
        <section className="py-14" style={{ background: "#F5F5F7" }}>
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center tracking-tight">{c.vehicleTitle}</h2>
            <div className="grid sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {c.vehicleSpecs.map((spec) => {
                const Icon = iconMap[spec.icon];
                return (
                  <div key={spec.label} className="rounded-xl p-5 text-center bg-white" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(249,115,22,0.1)" }}>
                      <Icon size={18} className="text-orange-600" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-medium text-gray-500">{spec.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">{c.whyTitle}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {c.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <CheckCircle size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Regions cross-link */}
        <section className="py-16" style={{ background: "#F5F5F7" }}>
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center tracking-tight">{c.regionsTitle}</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {c.regions.map((region) => (
                <Link
                  key={region.href}
                  href={region.href}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium bg-white hover:text-blue-600 transition-colors"
                  style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  {region.label}
                  <ArrowRight size={13} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">FAQ</h2>
            <div className="space-y-4">
              {[
                { q: c.faqQ1, a: c.faqA1 },
                { q: c.faqQ2, a: c.faqA2 },
                { q: c.faqQ3, a: c.faqA3 },
                { q: c.faqQ4, a: c.faqA4 },
                { q: c.faqQ5, a: c.faqA5 },
              ].map((item) => (
                <div key={item.q} className="rounded-xl p-5" style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16" style={{ background: "#F5F5F7" }}>
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
