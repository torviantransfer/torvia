import type { Metadata } from "next";
import { getSeoPage, applySeoPage, seoH1, seoIntro } from "@/lib/seoPages";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import { Hotel, CheckCircle, Star, ArrowRight, MapPin, Moon, Users2 } from "lucide-react";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo";

import type { Locale } from "@/i18n/config";

// Keyword source: this site's own Google Trends + Search Console research
// (migrations 031/033/043/044) — "hotel transfer antalya" is Germany's #1
// query for this service (+8% growth) and shows real worldwide interest
// (53, +20%), yet no commercial (booking) page targeted it — only a blog
// post existed. This page is the missing bottom-of-funnel landing page,
// deliberately not built from the [region] template since it is not tied
// to one destination but to "any hotel, any resort area" intent.
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
  hotelsTitle: string;
  hotels: string[];
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
  nightNote: string;
}>> = {
  en: {
    title: "Hotel Transfer Antalya Airport | Direct to Any Hotel, Any Resort",
    metaDesc: "Hotel transfer from Antalya Airport to any hotel on the coast — you don't need to know your exact resort area to book. Fixed price, driver knows the address. Book online.",
    heading: "Hotel Transfer Antalya Airport",
    subheading: "One booking, any hotel on the Turkish Riviera — you just need the hotel name, we handle the route.",
    desc: "Most transfer sites make you pick a resort area before they'll quote you a price. We don't. Tell us your hotel name when you book, and we route the driver there directly — whether it's a five-star resort in Belek or a small boutique hotel in a street your map app has never heard of. The driver already has the exact address before you land.",
    features: [
      "Works for any named hotel, not just the big resort brands",
      "Driver has your exact hotel address before your flight lands",
      "No need to know your \"resort area\" — just your hotel name",
      "Fixed price quoted at booking, based on real distance to your hotel",
      "Late check-in? Driver waits — no extra charge for night arrivals",
      "One transfer per hotel booking, even for groups arriving on different flights",
      "Return transfer from the same hotel bookable in one go",
      "Covers every hotel from Kundu-Lara to Alanya, door to door",
    ],
    hotelsTitle: "A Few Hotels We Transfer To Every Week",
    hotels: [
      "Titanic Deluxe Lara",
      "Rixos Premium Belek",
      "Maxx Royal Belek",
      "Regnum Carya",
      "Rixos Premium Tekirova",
      "Delphin Imperial",
      "Royal Seginus",
      "Granada Luxury Okurcalar",
    ],
    regionsTitle: "Or Browse by Resort Area",
    regions: [
      { label: "Hotels in Belek", href: "/belek-transfer" },
      { label: "Hotels in Side", href: "/side-transfer" },
      { label: "Hotels in Alanya", href: "/alanya-transfer" },
      { label: "Hotels in Kemer", href: "/kemer-transfer" },
      { label: "Hotels in Kundu-Lara", href: "/kundu-lara-transfer" },
      { label: "Hotels in Antalya City", href: "/sehirici-transfer" },
    ],
    faqQ1: "Do you transfer to my exact hotel even if it's not a big resort brand?",
    faqA1: "Yes. Enter your hotel's name and address when booking and the driver is routed there directly — we're not limited to a fixed list of partner hotels. Small boutique hotels and apartments are just as easy to reach as five-star resorts.",
    faqQ2: "What if I don't know which resort area my hotel is in?",
    faqA2: "You don't need to. Type your hotel name in the booking form — the system looks up the location itself, so you never have to identify Belek, Side, or any other area yourself.",
    faqQ3: "How does the driver find my hotel at night?",
    faqA3: "Every driver receives your hotel's GPS coordinates before pickup, not just a name. Night arrivals cost the same as day arrivals — there's no late-arrival surcharge.",
    faqQ4: "Is the price different depending on which hotel I choose?",
    faqA4: "Yes, honestly — price is based on the real driving distance to your hotel, shown to you before you confirm, never a flat guess. Two hotels in the same town can have slightly different prices if one is further off the main road.",
    faqQ5: "Can I book a hotel transfer for a group arriving on separate flights?",
    faqA5: "Yes. Add each flight's arrival time in the booking notes and we'll schedule separate pickups to the same hotel, or combine them into one vehicle if the timing allows.",
    bookCta: "Book Your Hotel Transfer",
    whyTitle: "Why This Is Different From a Regular Airport Transfer",
    breadcrumb: "Hotel Transfer Antalya",
    nightNote: "Arriving after midnight? Your driver is already scheduled — no extra fee, no need to call ahead.",
  },
  tr: {
    title: "Antalya Havalimanı Otel Transferi | Her Otele, Her Bölgeye Direkt",
    metaDesc: "Antalya Havalimanı'ndan sahildeki her otele transfer — rezervasyon için hangi bölgede olduğunuzu bilmenize gerek yok. Sabit fiyat, şoför adresi biliyor. Online rezervasyon.",
    heading: "Antalya Havalimanı Otel Transferi",
    subheading: "Tek rezervasyon, Türk Rivierası'ndaki her otel — sadece otel adını yazın, rotayı biz hallederiz.",
    desc: "Çoğu transfer sitesi fiyat vermeden önce bir tatil bölgesi seçmenizi ister. Biz istemeyiz. Rezervasyon yaparken otel adınızı yazın, şoförü doğrudan oraya yönlendiririz — ister Belek'te beş yıldızlı bir tesis olsun, ister harita uygulamanızın bile duymadığı bir sokaktaki küçük butik otel. Şoförünüzde siz inmeden önce tam adres hazır olur.",
    features: [
      "Sadece büyük otel zincirleri için değil, ismi girilen her otel için çalışır",
      "Şoförde uçuşunuz inmeden önce tam otel adresiniz hazır olur",
      "\"Bölgenizi\" bilmenize gerek yok — sadece otel adınız yeterli",
      "Rezervasyonda otelinize gerçek mesafeye göre sabit fiyat verilir",
      "Geç check-in mi? Şoför bekler — gece varışlarında ek ücret yok",
      "Farklı uçuşlarla gelen gruplar için otel başına tek rezervasyon",
      "Aynı otelden dönüş transferi tek seferde rezerve edilebilir",
      "Kundu-Lara'dan Alanya'ya kadar her oteli kapıdan kapıya kapsar",
    ],
    hotelsTitle: "Her Hafta Transfer Yaptığımız Bazı Oteller",
    hotels: [
      "Titanic Deluxe Lara",
      "Rixos Premium Belek",
      "Maxx Royal Belek",
      "Regnum Carya",
      "Rixos Premium Tekirova",
      "Delphin Imperial",
      "Royal Seginus",
      "Granada Luxury Okurcalar",
    ],
    regionsTitle: "Veya Tatil Bölgesine Göre İnceleyin",
    regions: [
      { label: "Belek'teki Oteller", href: "/belek-transfer" },
      { label: "Side'deki Oteller", href: "/side-transfer" },
      { label: "Alanya'daki Oteller", href: "/alanya-transfer" },
      { label: "Kemer'deki Oteller", href: "/kemer-transfer" },
      { label: "Kundu-Lara'daki Oteller", href: "/kundu-lara-transfer" },
      { label: "Antalya Şehir Merkezi Otelleri", href: "/sehirici-transfer" },
    ],
    faqQ1: "Büyük bir otel zinciri olmasa bile tam olarak benim otelime transfer yapıyor musunuz?",
    faqA1: "Evet. Rezervasyon sırasında otelinizin adını ve adresini girin, şoför doğrudan oraya yönlendirilir — sabit bir partner otel listesiyle sınırlı değiliz. Küçük butik oteller ve apartlar da beş yıldızlı tesisler kadar kolay ulaşılabilir.",
    faqQ2: "Otelimin hangi tatil bölgesinde olduğunu bilmiyorsam ne olur?",
    faqA2: "Bilmenize gerek yok. Rezervasyon formuna otel adınızı yazın — sistem konumu kendisi bulur, Belek, Side veya başka bir bölgeyi kendiniz belirlemeniz gerekmez.",
    faqQ3: "Şoför gece otelimi nasıl buluyor?",
    faqA3: "Her şoför, karşılamadan önce sadece isim değil, otelinizin GPS konumunu da alır. Gece varışları gündüz varışlarıyla aynı fiyattır — geç varış için ek ücret yoktur.",
    faqQ4: "Hangi oteli seçtiğime göre fiyat değişiyor mu?",
    faqA4: "Evet, dürüst olmak gerekirse — fiyat otelinize olan gerçek sürüş mesafesine göre belirlenir ve onaylamadan önce size gösterilir, asla düz bir tahmin değildir. Aynı şehirdeki iki otel, biri ana yoldan uzaksa hafif farklı fiyatlara sahip olabilir.",
    faqQ5: "Farklı uçuşlarla gelen bir grup için otel transferi rezerve edebilir miyim?",
    faqA5: "Evet. Her uçuşun varış saatini rezervasyon notlarına ekleyin; aynı otele ayrı karşılamalar planlarız ya da zamanlama uygunsa tek araçta birleştiririz.",
    bookCta: "Otel Transferinizi Rezerve Edin",
    whyTitle: "Bu Neden Sıradan Bir Havalimanı Transferinden Farklı",
    breadcrumb: "Antalya Otel Transferi",
    nightNote: "Gece yarısından sonra mı varıyorsunuz? Şoförünüz zaten planlanmış — ek ücret yok, önceden aramanıza gerek yok.",
  },
  de: {
    title: "Hotel Transfer Antalya Flughafen | Direkt zu Jedem Hotel, Jedem Ort",
    metaDesc: "Hotel Transfer vom Flughafen Antalya zu jedem Hotel an der Küste — Sie müssen Ihr genaues Ferienort nicht kennen, um zu buchen. Festpreis, Fahrer kennt die Adresse. Online buchen.",
    heading: "Hotel Transfer Antalya Flughafen",
    subheading: "Eine Buchung, jedes Hotel an der Türkischen Riviera — Sie brauchen nur den Hotelnamen, die Route übernehmen wir.",
    desc: "Die meisten Transferseiten verlangen, dass Sie zuerst ein Ferienort auswählen, bevor sie Ihnen einen Preis nennen. Wir nicht. Geben Sie beim Buchen einfach Ihren Hotelnamen an, und wir leiten den Fahrer direkt dorthin — egal ob es ein Fünf-Sterne-Resort in Belek oder ein kleines Boutique-Hotel in einer Straße ist, von der Ihre Karten-App noch nie gehört hat. Der Fahrer hat die genaue Adresse, bevor Sie landen.",
    features: [
      "Funktioniert für jedes benannte Hotel, nicht nur große Ferienort-Marken",
      "Fahrer hat Ihre genaue Hoteladresse, bevor Ihr Flug landet",
      "Sie müssen Ihr \"Ferienort\" nicht kennen — nur Ihren Hotelnamen",
      "Festpreis bei der Buchung, basierend auf der tatsächlichen Entfernung zu Ihrem Hotel",
      "Später Check-in? Der Fahrer wartet — keine Zusatzkosten bei nächtlicher Ankunft",
      "Ein Transfer pro Hotelbuchung, auch bei Gruppen mit unterschiedlichen Flügen",
      "Rücktransfer vom selben Hotel in einem Schritt buchbar",
      "Deckt jedes Hotel von Kundu-Lara bis Alanya ab, Tür zu Tür",
    ],
    hotelsTitle: "Einige Hotels, Zu Denen Wir Jede Woche Fahren",
    hotels: [
      "Titanic Deluxe Lara",
      "Rixos Premium Belek",
      "Maxx Royal Belek",
      "Regnum Carya",
      "Rixos Premium Tekirova",
      "Delphin Imperial",
      "Royal Seginus",
      "Granada Luxury Okurcalar",
    ],
    regionsTitle: "Oder Nach Ferienort Durchsuchen",
    regions: [
      { label: "Hotels in Belek", href: "/belek-transfer" },
      { label: "Hotels in Side", href: "/side-transfer" },
      { label: "Hotels in Alanya", href: "/alanya-transfer" },
      { label: "Hotels in Kemer", href: "/kemer-transfer" },
      { label: "Hotels in Kundu-Lara", href: "/kundu-lara-transfer" },
      { label: "Hotels in Antalya Stadt", href: "/sehirici-transfer" },
    ],
    faqQ1: "Fahren Sie auch zu meinem Hotel, wenn es keine große Ferienort-Marke ist?",
    faqA1: "Ja. Geben Sie beim Buchen Name und Adresse Ihres Hotels an, und der Fahrer wird direkt dorthin geleitet — wir sind nicht auf eine feste Liste von Partnerhotels beschränkt. Kleine Boutique-Hotels und Apartments sind genauso leicht zu erreichen wie Fünf-Sterne-Resorts.",
    faqQ2: "Was, wenn ich nicht weiß, in welchem Ferienort mein Hotel liegt?",
    faqA2: "Das müssen Sie nicht wissen. Geben Sie einfach Ihren Hotelnamen im Buchungsformular ein — das System findet den Standort selbst, Sie müssen Belek, Side oder ein anderes Gebiet nicht selbst bestimmen.",
    faqQ3: "Wie findet der Fahrer mein Hotel nachts?",
    faqA3: "Jeder Fahrer erhält vor der Abholung die GPS-Koordinaten Ihres Hotels, nicht nur den Namen. Nächtliche Ankünfte kosten genauso viel wie tagsüber — es gibt keinen Nachtzuschlag.",
    faqQ4: "Ist der Preis je nach gewähltem Hotel unterschiedlich?",
    faqA4: "Ja, ehrlich gesagt — der Preis basiert auf der tatsächlichen Fahrstrecke zu Ihrem Hotel und wird Ihnen vor der Bestätigung angezeigt, nie eine pauschale Schätzung. Zwei Hotels in derselben Stadt können leicht unterschiedliche Preise haben, wenn eines weiter von der Hauptstraße entfernt liegt.",
    faqQ5: "Kann ich einen Hoteltransfer für eine Gruppe mit getrennten Flügen buchen?",
    faqA5: "Ja. Geben Sie die Ankunftszeit jedes Fluges in den Buchungshinweisen an, und wir planen getrennte Abholungen zum selben Hotel oder kombinieren sie in einem Fahrzeug, wenn die Zeiten es zulassen.",
    bookCta: "Hotel Transfer Buchen",
    whyTitle: "Warum Das Anders Ist Als Ein Normaler Flughafentransfer",
    breadcrumb: "Hotel Transfer Antalya",
    nightNote: "Ankunft nach Mitternacht? Ihr Fahrer ist bereits eingeplant — keine Zusatzkosten, kein Anruf vorab nötig.",
  },
  pl: {
    title: "Transfer do Hotelu Antalya Lotnisko | Bezpośrednio do Każdego Hotelu",
    metaDesc: "Transfer do hotelu z lotniska Antalya do dowolnego hotelu na wybrzeżu — nie musisz znać nazwy swojego kurortu, by zarezerwować. Stała cena, kierowca zna adres. Rezerwacja online.",
    heading: "Transfer do Hotelu Antalya Lotnisko",
    subheading: "Jedna rezerwacja, każdy hotel na Riwierze Tureckiej — wystarczy nazwa hotelu, trasę ustalamy my.",
    desc: "Większość stron z transferami wymaga wyboru kurortu, zanim poda Ci cenę. My nie. Podaj nazwę hotelu podczas rezerwacji, a my skierujemy kierowcę bezpośrednio tam — niezależnie czy to pięciogwiazdkowy resort w Belek, czy mały butikowy hotel przy ulicy, o której Twoja mapa nigdy nie słyszała. Kierowca ma dokładny adres, zanim wylądujesz.",
    features: [
      "Działa dla każdego nazwanego hotelu, nie tylko dużych marek kurortowych",
      "Kierowca ma Twój dokładny adres hotelu przed lądowaniem samolotu",
      "Nie musisz znać swojego \"kurortu\" — wystarczy nazwa hotelu",
      "Stała cena podana przy rezerwacji, oparta na rzeczywistej odległości do hotelu",
      "Późne zameldowanie? Kierowca czeka — bez dopłaty za nocne przyloty",
      "Jeden transfer na rezerwację hotelu, nawet dla grup przylatujących różnymi lotami",
      "Transfer powrotny z tego samego hotelu można zarezerwować od razu",
      "Obejmuje każdy hotel od Kundu-Lara po Alanyę, od drzwi do drzwi",
    ],
    hotelsTitle: "Kilka Hoteli, Do Których Jeździmy Co Tydzień",
    hotels: [
      "Titanic Deluxe Lara",
      "Rixos Premium Belek",
      "Maxx Royal Belek",
      "Regnum Carya",
      "Rixos Premium Tekirova",
      "Delphin Imperial",
      "Royal Seginus",
      "Granada Luxury Okurcalar",
    ],
    regionsTitle: "Lub Przeglądaj Według Kurortu",
    regions: [
      { label: "Hotele w Belek", href: "/belek-transfer" },
      { label: "Hotele w Side", href: "/side-transfer" },
      { label: "Hotele w Alanyi", href: "/alanya-transfer" },
      { label: "Hotele w Kemer", href: "/kemer-transfer" },
      { label: "Hotele w Kundu-Lara", href: "/kundu-lara-transfer" },
      { label: "Hotele w Centrum Antalyi", href: "/sehirici-transfer" },
    ],
    faqQ1: "Czy dojedziecie do mojego hotelu, nawet jeśli to nie duża marka kurortowa?",
    faqA1: "Tak. Podaj nazwę i adres swojego hotelu podczas rezerwacji, a kierowca zostanie skierowany bezpośrednio tam — nie jesteśmy ograniczeni do stałej listy hoteli partnerskich. Małe hotele butikowe i apartamenty są równie łatwo dostępne jak pięciogwiazdkowe resorty.",
    faqQ2: "Co, jeśli nie wiem, w którym kurorcie znajduje się mój hotel?",
    faqA2: "Nie musisz tego wiedzieć. Wpisz nazwę hotelu w formularzu rezerwacji — system sam znajdzie lokalizację, nie musisz samodzielnie określać, czy to Belek, Side czy inny obszar.",
    faqQ3: "Jak kierowca znajduje mój hotel w nocy?",
    faqA3: "Każdy kierowca otrzymuje współrzędne GPS Twojego hotelu przed odbiorem, nie tylko nazwę. Przyloty nocne kosztują tyle samo co dzienne — nie ma dopłaty za późny przylot.",
    faqQ4: "Czy cena różni się w zależności od wybranego hotelu?",
    faqA4: "Tak, szczerze mówiąc — cena opiera się na rzeczywistej odległości do Twojego hotelu i jest pokazywana przed potwierdzeniem, nigdy nie jest płaskim szacunkiem. Dwa hotele w tym samym mieście mogą mieć nieco inne ceny, jeśli jeden znajduje się dalej od głównej drogi.",
    faqQ5: "Czy mogę zarezerwować transfer do hotelu dla grupy przylatującej różnymi lotami?",
    faqA5: "Tak. Dodaj godzinę przylotu każdego lotu w uwagach do rezerwacji, a my zaplanujemy oddzielne odbiory do tego samego hotelu lub połączymy je w jednym pojeździe, jeśli czas na to pozwoli.",
    bookCta: "Zarezerwuj Transfer do Hotelu",
    whyTitle: "Dlaczego To Się Różni Od Zwykłego Transferu z Lotniska",
    breadcrumb: "Transfer do Hotelu Antalya",
    nightNote: "Przylatujesz po północy? Twój kierowca jest już zaplanowany — bez dodatkowej opłaty, bez konieczności dzwonienia wcześniej.",
  },
  ru: {
    title: "Трансфер в Отель из Аэропорта Анталии | Прямо к Любому Отелю",
    metaDesc: "Трансфер в отель из аэропорта Анталии в любой отель на побережье — не нужно знать точный курортный район, чтобы забронировать. Фиксированная цена, водитель знает адрес. Онлайн-бронирование.",
    heading: "Трансфер в Отель из Аэропорта Анталии",
    subheading: "Одно бронирование, любой отель на Турецкой Ривьере — нужно лишь название отеля, маршрут берём на себя мы.",
    desc: "Большинство сайтов трансферов просят сначала выбрать курортный район, прежде чем назвать цену. Мы — нет. Укажите название вашего отеля при бронировании, и мы направим водителя прямо туда — будь то пятизвёздочный курорт в Белеке или небольшой бутик-отель на улице, о которой ваше картографическое приложение никогда не слышало. У водителя уже есть точный адрес до вашей посадки.",
    features: [
      "Работает для любого названного отеля, а не только крупных курортных брендов",
      "У водителя есть точный адрес вашего отеля ещё до посадки самолёта",
      "Не нужно знать свой «курортный район» — достаточно названия отеля",
      "Фиксированная цена при бронировании, рассчитанная по реальному расстоянию до отеля",
      "Поздний заезд? Водитель ждёт — без доплаты за ночное прибытие",
      "Один трансфер на бронирование отеля, даже для групп, прилетающих разными рейсами",
      "Обратный трансфер из того же отеля можно забронировать сразу",
      "Покрывает каждый отель от Кунду-Лары до Аланьи, от двери до двери",
    ],
    hotelsTitle: "Несколько Отелей, Куда Мы Возим Каждую Неделю",
    hotels: [
      "Titanic Deluxe Lara",
      "Rixos Premium Belek",
      "Maxx Royal Belek",
      "Regnum Carya",
      "Rixos Premium Tekirova",
      "Delphin Imperial",
      "Royal Seginus",
      "Granada Luxury Okurcalar",
    ],
    regionsTitle: "Или Выберите по Курортному Району",
    regions: [
      { label: "Отели в Белеке", href: "/belek-transfer" },
      { label: "Отели в Сиде", href: "/side-transfer" },
      { label: "Отели в Аланье", href: "/alanya-transfer" },
      { label: "Отели в Кемере", href: "/kemer-transfer" },
      { label: "Отели в Кунду-Ларе", href: "/kundu-lara-transfer" },
      { label: "Отели в центре Анталии", href: "/sehirici-transfer" },
    ],
    faqQ1: "Вы везёте к моему конкретному отелю, даже если это не крупный курортный бренд?",
    faqA1: "Да. Укажите название и адрес отеля при бронировании, и водитель направляется прямо туда — мы не ограничены фиксированным списком отелей-партнёров. До небольших бутик-отелей и апартаментов добраться так же легко, как до пятизвёздочных курортов.",
    faqQ2: "Что делать, если я не знаю, в каком курортном районе находится мой отель?",
    faqA2: "Вам не нужно это знать. Просто введите название отеля в форме бронирования — система сама определит местоположение, вам не нужно самостоятельно указывать Белек, Сиде или другой район.",
    faqQ3: "Как водитель находит мой отель ночью?",
    faqA3: "Каждый водитель получает GPS-координаты вашего отеля перед встречей, а не только название. Ночные прибытия стоят так же, как и дневные — доплаты за поздний приезд нет.",
    faqQ4: "Отличается ли цена в зависимости от выбранного отеля?",
    faqA4: "Да, честно говоря — цена основана на реальном расстоянии до вашего отеля и показывается вам перед подтверждением, а не является усреднённой оценкой. Два отеля в одном городе могут иметь немного разную цену, если один расположен дальше от главной дороги.",
    faqQ5: "Могу ли я забронировать трансфер в отель для группы, прилетающей разными рейсами?",
    faqA5: "Да. Укажите время прибытия каждого рейса в примечаниях к бронированию, и мы организуем отдельные встречи в том же отеле или объединим их в одном автомобиле, если позволяет расписание.",
    bookCta: "Забронировать Трансфер в Отель",
    whyTitle: "Чем Это Отличается от Обычного Трансфера из Аэропорта",
    breadcrumb: "Трансфер в Отель Анталия",
    nightNote: "Прибываете после полуночи? Ваш водитель уже запланирован — без доплаты, без необходимости звонить заранее.",
  },
  nl: {
    title: "Hotel Transfer Antalya Luchthaven | Direct naar Elk Hotel, Elke Regio",
    metaDesc: "Hoteltransfer van de luchthaven Antalya naar elk hotel aan de kust — u hoeft uw exacte resortgebied niet te kennen om te boeken. Vaste prijs, chauffeur kent het adres. Boek online.",
    heading: "Hotel Transfer Antalya Luchthaven",
    subheading: "Eén boeking, elk hotel aan de Turkse Rivièra — u hoeft alleen de hotelnaam te weten, wij regelen de route.",
    desc: "De meeste transferwebsites laten u eerst een resortgebied kiezen voordat ze een prijs geven. Wij niet. Vermeld uw hotelnaam bij het boeken, en wij sturen de chauffeur er rechtstreeks naartoe — of het nu een vijfsterrenresort in Belek is of een klein boetiekhotel in een straat waar uw kaarten-app nog nooit van heeft gehoord. De chauffeur heeft het exacte adres al voordat u landt.",
    features: [
      "Werkt voor elk genoemd hotel, niet alleen grote resortmerken",
      "Chauffeur heeft uw exacte hoteladres voordat uw vlucht landt",
      "U hoeft uw \"resortgebied\" niet te kennen — alleen uw hotelnaam",
      "Vaste prijs bij boeking, gebaseerd op de werkelijke afstand tot uw hotel",
      "Laat inchecken? De chauffeur wacht — geen extra kosten bij nachtelijke aankomst",
      "Eén transfer per hotelboeking, ook voor groepen die met verschillende vluchten aankomen",
      "Retourtransfer vanaf hetzelfde hotel in één keer boekbaar",
      "Dekt elk hotel van Kundu-Lara tot Alanya, van deur tot deur",
    ],
    hotelsTitle: "Enkele Hotels Waar Wij Elke Week Naartoe Rijden",
    hotels: [
      "Titanic Deluxe Lara",
      "Rixos Premium Belek",
      "Maxx Royal Belek",
      "Regnum Carya",
      "Rixos Premium Tekirova",
      "Delphin Imperial",
      "Royal Seginus",
      "Granada Luxury Okurcalar",
    ],
    regionsTitle: "Of Bekijk Per Resortgebied",
    regions: [
      { label: "Hotels in Belek", href: "/belek-transfer" },
      { label: "Hotels in Side", href: "/side-transfer" },
      { label: "Hotels in Alanya", href: "/alanya-transfer" },
      { label: "Hotels in Kemer", href: "/kemer-transfer" },
      { label: "Hotels in Kundu-Lara", href: "/kundu-lara-transfer" },
      { label: "Hotels in Antalya centrum", href: "/sehirici-transfer" },
    ],
    faqQ1: "Rijdt u ook naar mijn specifieke hotel als het geen groot resortmerk is?",
    faqA1: "Ja. Vul de naam en het adres van uw hotel in bij het boeken, en de chauffeur wordt er rechtstreeks naartoe geleid — wij zijn niet beperkt tot een vaste lijst van partnerhotels. Kleine boetiekhotels en appartementen zijn net zo makkelijk te bereiken als vijfsterrenresorts.",
    faqQ2: "Wat als ik niet weet in welk resortgebied mijn hotel ligt?",
    faqA2: "Dat hoeft u niet te weten. Typ uw hotelnaam in het boekingsformulier — het systeem zoekt de locatie zelf op, u hoeft Belek, Side of een ander gebied niet zelf te bepalen.",
    faqQ3: "Hoe vindt de chauffeur mijn hotel 's nachts?",
    faqA3: "Elke chauffeur ontvangt de GPS-coördinaten van uw hotel vóór het ophalen, niet alleen de naam. Nachtelijke aankomsten kosten hetzelfde als aankomsten overdag — er is geen nachttoeslag.",
    faqQ4: "Verschilt de prijs afhankelijk van welk hotel ik kies?",
    faqA4: "Ja, eerlijk gezegd — de prijs is gebaseerd op de werkelijke rijafstand tot uw hotel en wordt u getoond voordat u bevestigt, nooit een vaste schatting. Twee hotels in dezelfde stad kunnen licht verschillende prijzen hebben als het ene verder van de hoofdweg ligt.",
    faqQ5: "Kan ik een hoteltransfer boeken voor een groep die met verschillende vluchten aankomt?",
    faqA5: "Ja. Voeg de aankomsttijd van elke vlucht toe in de boekingsnotities, en wij plannen aparte ophaalmomenten naar hetzelfde hotel, of combineren ze in één voertuig als de timing het toelaat.",
    bookCta: "Boek Uw Hoteltransfer",
    whyTitle: "Waarom Dit Anders Is Dan Een Gewone Luchthaventransfer",
    breadcrumb: "Hotel Transfer Antalya",
    nightNote: "Aankomst na middernacht? Uw chauffeur staat al ingepland — geen extra kosten, geen noodzaak om vooraf te bellen.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Admin-editable overrides. Null when the row is empty or the
  // table is missing, in which case the values below are used verbatim.
  const seoRow = await getSeoPage("hotel-transfer-antalya");
  const loc = (locale as Locale) in content ? (locale as Locale) : "en";
  const c = content[loc] ?? content.en!;
  const path = "/hotel-transfer-antalya";

  return applySeoPage({
    title: c.title,
    description: c.metaDesc,
    alternates: seoAlternates(locale, path),
    openGraph: seoOpenGraph(loc, path, c.title, c.metaDesc, "/images/antalya-airport.jpg"),
    twitter: seoTwitter(c.title, c.metaDesc, "/images/antalya-airport.jpg"),
  }, seoRow, locale);
}

export default async function HotelTransferAntalyaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Admin-editable page copy. Every getter returns undefined when the
  // field is blank, so the existing expression stays the fallback.
  const seoRow = await getSeoPage("hotel-transfer-antalya");
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
    name: "Hotel Transfer Antalya Airport — TORVIAN",
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
      { "@type": "ListItem", position: 2, name: c.breadcrumb, item: `https://torviantransfer.com/${loc}/hotel-transfer-antalya` },
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
        <section className="relative pb-16 pt-24 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(16,185,129,0.03) 50%, #FFFFFF 100%)" }}>
          <div className="relative max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-gray-900">{c.breadcrumb}</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ backgroundColor: "rgba(16,185,129,0.1)", color: "#047857" }}>
                  <Hotel size={12} strokeWidth={2} /> Any Hotel
                </div>
                <h1 className="text-3xl lg:text-5xl font-bold mb-4 tracking-tight text-gray-900">
                  {seoH1(seoRow, locale) ?? c.heading}
                </h1>
                <p className="text-base lg:text-lg text-gray-500 mb-4 leading-relaxed">
                  {seoIntro(seoRow, locale) ?? c.subheading}
                </p>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">{c.desc}</p>

                <div className="flex items-center gap-2 mb-8 p-3 rounded-xl text-xs" style={{ backgroundColor: "rgba(0,122,255,0.06)", border: "1px solid rgba(0,122,255,0.15)", color: "#0056CC" }}>
                  <Moon size={14} className="flex-shrink-0" />
                  {c.nightNote}
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
                  src="/images/antalya-airport.jpg"
                  alt="Antalya Airport hotel transfer to any resort"
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

        {/* Hotels proof list */}
        <section className="py-14" style={{ background: "#F5F5F7" }}>
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center tracking-tight">{c.hotelsTitle}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {c.hotels.map((hotel) => (
                <div key={hotel} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white text-sm text-gray-700" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                  <Star size={14} className="text-yellow-500 flex-shrink-0" strokeWidth={1.5} />
                  {hotel}
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
                  <MapPin size={13} />
                  {region.label}
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
            <Users2 size={32} className="text-blue-600 mx-auto mb-4" />
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
