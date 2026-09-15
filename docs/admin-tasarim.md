# Torvian Admin Paneli — Yeni Tasarım

Bu belge admin panelinin yeni arayüzünü tanımlar. Görsel referans: [`admin-tasarim-taslak.html`](admin-tasarim-taslak.html) (tarayıcıda açılır; Bugün ve Rezervasyonlar ekranları dolu, diğer sekmeler iskelet).

Panelde günün büyük kısmı geçiyor. Eski arayüz işi görüyordu ama her sayfa kendi buton, kart ve tablo stilini taşıyordu; ekranlar kalabalık, asıl işler (şoför atama, voucher, Telegram) menülerin içine gömülüydü. Yeni tasarımın amacı her ekranda aynı dili konuşmak ve yapılacak işi öne çıkarmak.

Çalışma yarıda kalırsa en alttaki **İlerleme** listesinden devam edilir.

---

## 1. İlkeler

1. **Önce yapılacak iş.** Bir ekran açıldığında ilk görülen şey sayı yığını değil, halledilmesi gerekenlerdir: şoförsüz transfer, iptal talebi, bekleyen ödeme.
2. **Yerinden kalkmadan işlem.** Sık yapılan işler (şoför ata, WhatsApp, ara, voucher, Telegram) bulunduğu satırda ya da sağdan açılan panelde tek tıkla yapılır. Listeden ayrılmak gerekmez.
3. **Renk sadece anlam taşır.** Zemin açık ve nötr, ana butonlar mürekkep siyahı. Sarı = dikkat, kırmızı = sorun/iptal, yeşil = tamam/ödendi, mavi = atandı, mor = yolda/yolcu alındı. Süs için renk kullanılmaz.
4. **Her ekran aynı parçalarla kurulur.** Sayfa başlığı → sekmeler → filtre çubuğu → liste → sağ panel. Yeni bir ekran yeni bir stil icat etmez.
5. **Telefonda da tam çalışır.** Tablolar kart olur, sağ panel tam ekran olur, üst çubukta sadece ikonlar kalır.
6. **Sahte buton yok.** Arkasında çalışan bir işlem olmayan hiçbir buton, rozet ya da sayı ekranda yer almaz. Altyapısı olmayan özellikler Bölüm 7'de ayrıca listelenir; hazır olana kadar gösterilmez.

---

## 2. Görsel dil

### 2.1 Renkler

| Rol | Değişken | Değer |
|---|---|---|
| Sayfa zemini | `--bg` | `#f5f5f2` |
| Kart / yüzey | `--surface` | `#ffffff` |
| İkincil yüzey (tablo başlığı, grup satırı) | `--surface-2` | `#fafaf8` |
| Çizgi | `--line` | `#e7e6e1` |
| İnce çizgi (satır arası) | `--line-2` | `#f0efeb` |
| Ana metin | `--ink` | `#15171b` |
| İkincil metin | `--ink-2` | `#3b4048` |
| Soluk metin | `--muted` | `#71757d` |
| En soluk (ipucu, eksen) | `--faint` | `#a4a7ad` |
| Marka | `--brand` / `--brand-ink` / `--brand-soft` | `#0e8a61` / `#0a6a4a` / `#e6f4ee` |

Anlam renkleri (metin / zemin):

| Anlam | Metin | Zemin | Kullanım |
|---|---|---|---|
| Yeşil | `#127a3e` | `#e3f3e8` | ödendi, zamanında, tamam |
| Sarı | `#a15c07` | `#fdf2d8` (çizgi `#f5d58a`) | dikkat, şoför bekliyor, ödeme bekliyor, rötar |
| Kırmızı | `#b4233c` | `#fde8eb` | iptal talebi, hata, zarar |
| Mavi | `#1f55c7` | `#e5edfd` | şoför atandı, karşılama |
| Mor | `#5b3cc4` | `#eeeafc` | yolcu alındı, çıkış |
| Turkuaz | `#0f766e` | `#e0f2f0` | kapora ödendi |
| Nötr | `#3b4048` | `#f0efeb` | iptal edildi, planlandı |

### 2.2 Yazı

- Yazı tipi: **Inter** (projede `next/font` ile zaten yüklü), yedek `system-ui`.
- Gövde 14px / 1.5. Tablo hücreleri 13–13.5px. Küçük bilgi 12px. Bölüm etiketleri 11.5px, büyük harf, `letter-spacing: .06em`.
- Sayfa başlığı 24px, 700, `letter-spacing: -.02em` (telefonda 21px).
- Büyük rakamlar (özet şeridi) 26px, 700. Saatler 15px, 700.
- Hizalanması gereken sayılar (saat, tutar, tablo sütunları) `tabular-nums`. Tek başına duran büyük rakamlar normal rakam.
- Rezervasyon kodu, plaka, uçuş kodu: eşaralıklı yazı.

### 2.3 Ölçüler

- Köşe: kart 14px, buton/girdi 9–10px, rozet 7px, küçük buton 8px.
- Gölge: kartlarda çok hafif (`0 1px 2px rgba(21,23,27,.05)`); açılır panel ve pencerelerde belirgin (`0 24px 60px rgba(21,23,27,.18)`).
- Buton yüksekliği 34px (küçük 28px). Girdi 34px. Satır yüksekliği ~56px.
- Sayfa kenar boşluğu masaüstünde 28px, telefonda 16px. En geniş içerik 1440px.
- İkonlar: Lucide (`lucide-react`), 16px, çizgi kalınlığı 1.8.

---

## 3. Uygulama iskeleti

### 3.1 Yan menü

Açık zeminli (`#fbfbf9`), sağında ince çizgi, 256px. Üstte logo + "Admin" etiketi + daraltma düğmesi; altında **Ara veya komut… Ctrl K** kutusu. Menü beş gruptan oluşur:

| Grup | Sekme | Yol | İkon |
|---|---|---|---|
| Operasyon | Bugün | `/admin` | `sun` |
| | Rezervasyonlar | `/admin/reservations` | `ticket` |
| | Takvim & Kapasite | `/admin/availability`, `/admin/calendar` | `calendar-days` |
| | Canlı Ziyaretçiler | `/admin/live-visitors` | `radio` |
| Filo & Ekip | Şoförler | `/admin/drivers` | `users` |
| | Araçlar | `/admin/vehicles` | `car` |
| | Araç Tipleri | `/admin/vehicle-categories` | `layers` |
| | Şoför Ödemeleri | `/admin/driver-payments` | `wallet` |
| Finans | Kasa | `/admin/finance` | `landmark` |
| | Fiyatlandırma | `/admin/pricing` | `tags` |
| | Kuponlar | `/admin/coupons` | `ticket-percent` |
| Site & Pazarlama | Bölgeler | `/admin/regions` | `map-pin` |
| | Değerlendirmeler | `/admin/reviews` | `star` |
| | Blog Yazıları | `/admin/blog` | `file-text` |
| | Landing Sayfaları | `/admin/landing` | `layout-template` |
| | SEO Yönetimi | `/admin/seo` | `search-check` |
| Sistem | Ayarlar | `/admin/settings` | `settings` |

- Aktif sekme: beyaz zemin, ince çerçeve, ikon marka yeşili.
- Sayaç rozetleri gerçek veriden gelir: Rezervasyonlar = şoför bekleyen + iptal talebi (sarı), Değerlendirmeler = onay bekleyen, Canlı Ziyaretçiler = şu an sitede olan.
- Sayaçlar `/api/admin/shell` üzerinden 30 saniyede bir ve her sayfa değişiminde yenilenir. Şoför bekleyen sayısı yalnızca bugün ve sonrasındaki bacakları sayar.
- Daraltılmış hâl: 68px, sadece ikonlar. Tercih `adm_sidebar` çerezinde tutulur; sunucu ilk açılışta okuduğu için sayfa yüklenirken menü zıplamaz.
- Altta: yönetici adı/e-postası, tıklayınca **Çıkış yap**.
- 900px altında menü soldan açılan çekmece olur; üst çubukta menü düğmesi çıkar.

### 3.2 Üst çubuk

Yapışkan, 60px, yarı saydam zemin, sayfa kaydırılınca alt çizgi belirir. Soldan sağa: (telefonda menü düğmesi) · yol (Admin › Sekme) · sitede anlık ziyaretçi sayısı · arama · bildirim · **Yeni rezervasyon**. Telefonda yol yalnızca sekme adını, butonlar yalnızca ikonu gösterir.

Bildirim zili yok (A5, kasıtlı). **Yeni rezervasyon** admin içinde kendi formunu açar (A3). Ziyaretçi sayısına tıklayınca Canlı Ziyaretçiler açılır.

### 3.3 Komut paleti (Ctrl K / ⌘ K)

Her ekrandan açılır, Esc ile kapanır. Bölümler:
- **Hızlı işlemler:** Yeni rezervasyon, Şoföre ödeme yap, Kasaya gider ekle.
- **Rezervasyonlar:** kod, müşteri adı, telefon, uçuş kodu, otel ile arama; sonuca tıklayınca rezervasyonun sağ paneli açılır.
- **Sayfalar:** menüdeki bütün sekmeler.
Klavyeyle yukarı/aşağı gezilir, Enter açar.

- Arama `/api/admin/search` ile yapılır: kod, uçuş (gidiş ve dönüş), otel, müşteri adı, soyadı, ad + soyad, e-posta, telefon. En fazla 8 sonuç; önce yaklaşan transferler (en yakını üstte), sonra geçmiş olanlar.
- Sonuca tıklayınca Rezervasyonlar ekranı o rezervasyonun sağ paneli açık gelir (`?open=KOD`).
- **Şoföre ödeme yap** Şoför Ödemeleri'ni ödeme penceresi açık gelir (`?pay=1`), **Kasaya gider ekle** Kasa'yı gider penceresi açık getirir (`?add=expense`). Pencere kapanınca parametre adresten silinir, sayfa yenilenince tekrar açılmaz.

---

## 4. Bileşenler

Hepsi `src/components/admin/ui/` altında toplanır; sayfalar kendi stilini yazmaz. Mevcut `AdminUi.tsx`, `AdminDialog.tsx` ve `PeriodBar.tsx` bu klasöre taşınır ve bu dile uyarlanır.

| Bileşen | Tanım |
|---|---|
| `Button` | Türler: `primary` (mürekkep), `brand` (yeşil), `outline`, `ghost`, `warn` (sarı), `danger-ghost` (kırmızı yazı). Boylar: `md` 34px, `sm` 28px. İkon + metin, telefonda sadece ikon seçeneği. |
| `Chip` | Başında nokta olan durum rozeti. Tonlar Bölüm 2.1'deki anlam renkleri. `plain` türünde nokta yok (sayılar için). |
| `Card` / `CardHead` | Beyaz kart; başlık, alt başlık, sağda eylemler. `flush` türünde iç boşluk yok (tablolar için). |
| `PageHeader` | Üst etiket (tarih ya da grup adı), başlık, sağda eylemler. |
| `Tabs` | Alt çizgili sekmeler, yanında sayı rozeti (sarı/kırmızı olabilir). URL'ye yazılır (`?tab=`). |
| `Segmented` | Gri zeminli seçici: Bugün / Yarın / Bu hafta, Liste / Takvim. |
| `Toolbar` | Arama kutusu + filtre düğmeleri (kesik çizgili; seçilince dolu çerçeve ve seçili değer) + sağda görünüm ve sıralama. |
| `DataGrid` | Satır tabanlı liste: başlık satırı, gün grupları (“Bugün · Salı 15 Eylül — 7 transfer · €920 · 3 şoför bekliyor”), seçim kutusu, üzerine gelince çıkan satır eylemleri, seçili satırda sol yeşil çizgi. Telefonda her satır karta dönüşür. |
| `SelectionBar` | Satır seçilince altta beliren koyu çubuk: “2 seçili · Telegram'a gönder · Şoför ata · Voucher · ✕”. |
| `Drawer` | Sağdan açılan 460px detay paneli (telefonda tam ekran): başlıkta kod + durum, önceki/sonraki, tam sayfada aç, kapat; altında hızlı eylem ızgarası; içerik bölümleri; altta sabit Düzenle / İptal et. Esc ve dış tıklama kapatır. |
| `StatStrip` | Tek kart içinde bölmeli özet şeridi (etiket + büyük rakam + açıklama). Dikkat gerektiren değer sarı. |
| `InboxItem` | “Dikkat gerektiriyor” satırı: renkli ikon kutusu, başlık, bilgi satırı, sağda doğrudan eylem butonları. |
| `TimelineItem` | Saat, yön ikonu (karşılama/çıkış), güzergah + müşteri, uçuş, şoför ya da **Şoför ata**. |
| `Avatar` | Baş harfler; `sm` 24px, `md` 30px, `lg` 40px. |
| `EmptyState` | Ortalanmış ikon kutusu, başlık, açıklama, tek eylem. |
| `Dialog` | Kısa işlemler için orta pencere (telefonda alttan açılan sayfa). |
| `Field` | Etiketli girdi/seçim/tarih; odakta ince halka; hata metni altında kırmızı. |
| `CommandPalette` | Bölüm 3.3. |
| `Toast` | Alt ortada kısa bildirim; başarı koyu, hata kırmızı. `useToast()` ile çağrılır; sağlayıcı iskelette. |
| `PeriodBar` | Rapor ekranlarının dönem seçicisi (Kasa, şoför carisi). |

Renkler, köşeler ve gölgeler `globals.css` içinde `adm-` önekli değişkenlerdir (`bg-adm-surface`, `text-adm-muted`, `rounded-adm-lg`, `shadow-adm-sm` …); sitenin kendi değişkenleriyle karışmaz. Durum etiketleri ve tonları `ui/status.ts` içinde tek yerde durur. Sitenin genel mavi odak halkası admin içinde `.adm-root` kuralıyla ezilir; kendi çerçevesi olmayan alanlar (palet arama kutusu, tarih seçici) `adm-bare` sınıfı alır.

### 4.1 Durum eşlemeleri

**Rezervasyon durumu**

| Değer | Etiket | Ton |
|---|---|---|
| `pending` | Ödeme bekliyor | sarı |
| `paid` | Ödendi | yeşil |
| `deposit_paid` | Kapora ödendi | turkuaz |
| `driver_assigned` | Şoför atandı | mavi |
| `passenger_picked_up` | Yolcu alındı | mor |
| `completed` | Tamamlandı | yeşil (soluk) |
| `cancel_requested` | İptal talebi | kırmızı |
| `cancelled` | İptal edildi | nötr |

**Şoför ataması**

| Değer | Etiket | Ton |
|---|---|---|
| `assigned` | Şoföre gönderildi | nötr |
| `accepted` | Şoför kabul etti | mavi |
| `picked_up` | Yolcu alındı | mor |
| `completed` | Tamamlandı | yeşil |

**Ödeme sütunu:** Online (soluk metin) · Nakit — şoförde €X (sarı metin) · Ödeme bekliyor (kırmızı metin).

**Transfer yönü:** Karşılama (`plane-landing`, mavi) · Çıkış (`plane-takeoff`, mor).

---

## 5. Ekranlar

### 5.1 Bugün (`/admin`)

Günün operasyon ekranı. Üstte “Bugün / Yarın / Bu hafta” seçici; bütün kutular seçili güne göre dolar.

1. **Başlık:** “Salı, 15 Eylül 2026 · Antalya 08:42” / “Günaydın, bugün 14 transfer var”.
2. **Özet şeridi:** Transfer (karşılama/çıkış dağılımı) · Yolcu (bavul) · Şoför bekleyen (en yakın saat, sarı) · Nakit tahsilat (kaç işte şoförde) · Günün cirosu (düne göre %).
3. **Dikkat gerektiriyor:** sırayla şoförsüz transferler (**Şoför ata**), iptal talepleri (**Reddet** / **İptali onayla**), bekleyen ödemeler, rötar yapan uçuşlar (uçuş kaynağı olduğunda). Liste boşsa “Bugün için bekleyen iş yok”.
4. **Günün akışı:** saat başlıklarıyla gruplu zaman çizelgesi; “şimdi” çizgisi; satıra tıklayınca rezervasyon paneli açılır; “Liste olarak aç” Rezervasyonlar'ın Bugün sekmesine gider.
5. **Sağ sütun:** Şoförler (bugünkü durumu: yolda / müsait, iş sayısı, sıradaki saat) · Bu ay (net kâr, son 6 ay çubukları, şoförlere borç, bu ay reklam) → Kasa.

Eski kontrol panelindeki grafikler (aylık gelir, durum dağılımı, popüler bölgeler, transfer türleri, ödeme hunisi) “Bugün” ekranından kaldırılır; Kasa ve Canlı Ziyaretçiler > Analitik altına taşınır. Eski “Gelir” kartı dolar ve euro tutarları birlikte topladığı için kullanılmaz.

**Uygulamada:**
- Gün seçimi adrese yazılır: `/admin`, `/admin?day=tomorrow`, `/admin?day=week`. Bu hafta bugün dahil yedi gündür; akış saat yerine günlere göre gruplanır.
- Transfer sayısı bacak sayısıdır: gidiş-dönüşün o aralığa düşen her bacağı ayrı sayılır. Ödeme bekleyenler sayılmaz, “Dikkat gerektiriyor”da listelenir.
- Ciro, alış günü aralığa düşen onaylı rezervasyonların euro karşılığıdır (Kasa'daki kural); önceki eşit uzunluktaki dönemle karşılaştırılır.
- Nakit tahsilat, gidiş bacağında şoförün müşteriden alacağı tutarın euro karşılığıdır.
- Dikkat gerektiriyor: şoförsüz bacaklar (panel içinde Şoför ata), yanıt bekleyen bütün iptal talepleri (Aç · Reddet · İptali onayla) ve aralıktaki bekleyen ödemeler (WhatsApp · Aç). Her türden ilk beşi gösterilir, fazlası için Rezervasyonlar'ın ilgili sekmesine bağlantı çıkar.
- Şoför durumu atamalardan türetilir: yolda (yolcu alındı), işi var (sıradaki işi var), müsait. Satır şoförün carisini açar.
- Bu ay: net kâr Kasa ile aynı hesaptır; son altı ay çubukları net kârdır. Şoförlere borç, şoför carilerindeki alacakların dolar toplamıdır. Reklam, adında reklam, Google ya da Meta geçen gider kategorilerinin toplamıdır.
- Rötar satırı (A1), uçuş verisi API'si alınınca eklenir. Ödeme linki (A2) rezervasyon çekmecesinde var; Bugün'ün bekleyen-ödeme satırlarına ayrıca eklenmedi.
- Eski grafikler Aşama 4'e kadar Canlı Ziyaretçiler sayfasının altında durur.

### 5.2 Rezervasyonlar (`/admin/reservations`)

1. **Başlık:** “Rezervasyonlar” · sağda Dışa aktar, Yeni rezervasyon.
2. **Sekmeler:** Yaklaşan · Bugün · Şoför bekleyen (sarı sayı) · Ödeme bekleyen (sarı) · İptal talebi (kırmızı) · Geçmiş · Tümü. Varsayılan: Yaklaşan.
3. **Filtre çubuğu:** arama (kod, müşteri, e-posta, telefon, uçuş, otel, bölge, şoför) · Tarih aralığı · Bölge · Şoför · Ödeme (online/nakit/bekliyor) · sağda Liste/Takvim görünümü ve sıralama (alış saati / kayıt tarihi).
4. **Liste sütunları:** seçim · Saat (+ karşılama/çıkış) · Rezervasyon (müşteri adı, kod, ülke, yolcu, bavul) · Güzergah (başlangıç → varış, bölge, gidiş-dönüş işareti) · Uçuş (kod; kaynak varsa durum) · Şoför (avatar, ad, plaka ya da **Şoför ata**) · Ödeme (tutar + online/nakit/bekliyor) · Durum · satır eylemleri (WhatsApp, diğer).
5. **Gruplama:** alış gününe göre; grup başlığında transfer sayısı, toplam ciro (euro) ve şoför bekleyen sayısı.
6. **Toplu işlemler:** seçilen satırlar için Telegram'a gönder, Şoför ata, Voucher indir.
7. **Sayfalama:** ilk yüklemede yaklaşan transferler; kaydırdıkça devamı. 200 kayıt sınırı kalkar.

**Rezervasyon paneli (sağdan):**
- Başlık: kod, durum, müşteri adı, ülke · yolcu · bavul · dil.
- Hızlı eylemler: WhatsApp · Ara · Voucher · Telegram.
- **Yolculuk:** her bacak için kart — gidiş/dönüş, tarih-saat, uçuş (+durum), başlangıç ve varış noktası, atanmış şoför ve araç (**Değiştir** / **Kaldır**, **Rötar bildir**) ya da **Şoför ata**. Şoför ata aynı panelin içinde açılır (şoförlerin o günkü yükü görünür), ücret ve para birimi aynı adımda girilir.
- **Para:** müşterinin ödediği, ödeme türü (online/nakit, kapora, şoförde kalan), şoförlere giden (para birimi + euro karşılığı), bize kalan. Online ödeme alınmışsa başlıkta **Para iadesi**; iade yapılmışsa tutarı ve zamanı bölümün başında durur.
- **Müşteri:** e-posta, telefon, otel ve adres.
- **Not:** müşteri notu, çocuk koltuğu, karşılama tabelası.
- **İptal talebi** varsa panelin en üstünde: talep notu + **Reddet** / **İptali onayla**. Onay yalnızca rezervasyonu kapatır; para iadesi Para bölümünden ayrıca yapılır.
- **Geçmiş:** oluşturma, ödeme, şoför atama, voucher gönderimi zamanları.
- Alt çubuk: Düzenle · İptal et / Kaydı sil (bekleyen ya da iptal edilmiş kayıtta).
- “Tam sayfada aç” mevcut `/admin/reservations/[kod]` sayfasını aynı düzende açar; bu adres paylaşılabilir kalır.

**Uygulamada:**
- Sekme, arama, filtreler, sıralama ve açık panel adrese yazılır (`?tab=driver&region=…&open=TRV-24091`); link gönderilince aynı ekran açılır.
- Liste `/api/admin/reservations` üzerinden sayfa sayfa gelir (60'ar kayıt), aşağı inildikçe devamı yüklenir. Yaklaşan, Bugün, Şoför bekleyen, Ödeme bekleyen ve İptal talebi sekmeleri takvimle sınırlı olduğu için bütün olarak okunur ve sunucuda sıralanır; Geçmiş ve Tümü veritabanında sayfalanır.
- Gidiş-dönüşlerde satır sıradaki bacağı gösterir: gidişi geçmiş, dönüşü yarın olan transfer “Yarın” altında, dönüş saati ve yönüyle durur. Ödeme bekleyen sekmesi yalnızca tarihi gelmemiş kayıtları sayar; tarihi geçmiş ödenmemiş kayıtlar Tümü'nde kalır.
- Satırda ülke yerine rezervasyonun dili görünür; ülke bilgisi kayıtta tutulmuyor.
- Toplu Telegram, seçilen rezervasyonları tek mesajda gönderir (çok büyük bir seçim 4096 karakter sınırını aşarsa birden fazla mesaja bölünür). Toplu şoför ata, seçilenler içinde şoför bekleyenlerin panelini sırayla açar (panelde “Seçim · 1/3”). Toplu voucher her rezervasyonun PDF'ini indirir.
- Dışa aktar mevcut `/api/admin/export` uç noktasını kullanır; sekme ödeme bekleyen ya da iptal talebiyse durum, tarih filtresi varsa tarih aralığı aktarılır.
- Liste/Takvim seçicisindeki Takvim, Aşama 4'e kadar mevcut `/admin/calendar` sayfasını açar.
- Sayfa başlığında yalnızca Dışa aktar durur; Yeni rezervasyon her ekranda üst çubukta zaten olduğu için tekrarlanmaz.
- Şoför atamada çakışma kontrolü mevcut şoför kaldırılmadan önce yapılır; çakışma görülüp vazgeçilirse eski atama yerinde kalır.

### 5.3 Takvim & Kapasite

Tek sekmede birleşir: **Takvim** (ay/hafta görünümü, günde transfer yoğunluğu, güne tıklayınca sağ panelde o günün transferleri) ve **Kapasite** (günlük araç/transfer limitleri, kapatılmış günler ve sebepleri, not). Mevcut `blocked-dates`, `date-capacity`, `calendar` işlevleri korunur.

### 5.4 Canlı Ziyaretçiler

Sekmeler: **Canlı** (şu an sitedekiler: sayfa, dil, ülke, cihaz, süre; az önce ayrılanlar) · **Analitik** (ziyaret, rezervasyon hunisi — araç seçti, form doldurdu, ödeme başlattı, satın aldı —, trafik kaynakları, aylık gelir ve durum grafikleri). Özet şeridi: şu an sitede · bugün ziyaret · bugün rezervasyon · dönüşüm oranı.

### 5.5 Şoförler

Liste: ad, telefon, durum (aktif/pasif), bugünkü iş sayısı, bu ay iş sayısı, cari bakiye. Sekmeler: Aktif · Pasif · Tümü. Satır → sağ panel: iletişim, bugünkü ve yaklaşan işler, bu ayın özeti, **Cariyi aç**, **Ödeme yap**, Düzenle, Pasife al. Yeni şoför: Dialog.

### 5.6 Araçlar

Liste: plaka, marka-model, yıl, renk, araç tipi, durum, görsel küçük resmi. Satır → sağ panel: bilgiler, görsel yükleme, bu araçla yapılan son işler, Düzenle, Pasife al. Yeni araç: Dialog.

### 5.7 Araç Tipleri

Kart ızgarası: görsel, ad, kapasite (yolcu/bavul), aktif/pasif, sıradaki fiyat bağlantısı. Tıklayınca düzenleme sayfası: genel bilgiler + çok dilli ad ve açıklama sekmeleri + görsel.

### 5.8 Şoför Ödemeleri

Mevcut yapı korunur, bu dile uyarlanır: özet şeridi (şoförlere borç, size borçlu, bu ay ödenen, yaklaşan) · arama ve durum filtresi · şoför listesi (her satırda **Ödeme yap**) · son hareketler. Şoför carisi tam sayfa kalır: bugünkü bakiye, dönem seçimi, İşler/Hareketler sekmeleri, Excel/PDF.

### 5.9 Kasa

Mevcut yapı korunur, bu dile uyarlanır: dönem çubuğu · net kâr kartı + ciro, şoför maliyeti, giderler, diğer gelir · Ciro ve maliyet / Net kâr grafikleri · aylık tablo · gider dağılımı · gelir-gider listesi · transfer bazında kâr · Excel/PDF · **Gider / gelir ekle**.

### 5.10 Fiyatlandırma

Bölge × araç tipi fiyat tablosu (tek yön / gidiş-dönüş, euro). Hücre tıklanınca yerinde düzenlenir; değişen hücreler işaretlenir, üstte “N değişiklik · Kaydet / Geri al” çubuğu çıkar. Filtre: bölge arama, araç tipi. Ek eylemler: toplu % artır/azalt, Telegram'a fiyat listesi gönder. Gece tarifesi Ayarlar'da kalır.

### 5.11 Kuponlar

Liste: kod, indirim (% / tutar), kullanım / limit, geçerlilik tarihleri, durum. Sekmeler: Aktif · Süresi dolan · Tümü. Yeni kupon: Dialog.

### 5.12 Bölgeler

Liste: ad, slug, mesafe, süre, sıra, aktif. Satır → düzenleme sayfası: genel bilgiler + her dil için ad, açıklama ve SEO alanları (dil sekmeleri, eksik dil sayısı rozetli).

### 5.13 Değerlendirmeler

Sekmeler: Onay bekleyen (sayı rozeti) · Yayında · Reddedilen. Satırda puan, yorum, ad, ülke, dil, kaynak; satırda doğrudan **Onayla** / **Reddet**. Elle değerlendirme ekleme: Dialog.

### 5.14 Blog Yazıları

Liste: başlık, dillerin doluluk durumu (her dil için nokta), yayın durumu, tarih. Yazı düzenleme tam sayfa: **Genel** (slug, kapak görseli, anahtar kelimeler, yayın) ve **Dil içeriği** (dil sekmeleri) sekmeleri; sağda önizleme.

### 5.15 Landing Sayfaları

Blog ile aynı düzen: liste + tam sayfa editör (başlık, alt başlık, görsel ve açıklaması, slug, dil sekmeleri).

### 5.16 SEO Yönetimi

Dört tabloyu birden yönetir — `seo_pages` (ana sayfa, statik ve kod içindeki landing sayfaları), `landing_pages` (panelden oluşturulanlar), `regions`, `blog_posts` — yedi dilde.

1. **Üst şerit:** sayfa sayısı · seçili dilin ortalama skoru · taranan / toplam · teknik hata · yinelenen metin.
2. **Tarama kutusu:** panel, sayfaların gerçek HTML çıktısını okuyarak yayındaki title, canonical, robots, hreflang ve schema değerlerini gösterir. Okuma kaynağı seçilir (Public site / Bu deployment) ve hangi adresten okunduğu yazılır — önizlemenin rakamlarıyla production'ınkiler tek bir şeymiş gibi gösterilmez. Kaynak değişince eski okumalar atılır.
3. **Filtreler:** arama (sayfa adı, URL, slug, başlık) · sayfa türü · sorun (Hepsi / Sorunlu / Eksik metadata / noindex) · dil.
4. **Liste sütunları:** Sayfa (tür rozeti, yayında değil / yinelenen işareti) · URL · Title (değerin admin'den mi sayfa kodundan mı geldiğini gösteren nokta) · Index · Canonical · Hreflang · Sağlık · Skor · Güncelleme.
5. **Başlık eylemleri:** Toplu doldur · Yeni bölge (pasif açılır, sitemap'e girmez).

**SEO paneli (sağdan):** başlıkta sayfa türü, skor ve yayındaki adrese bağlantı; altında dil sekmeleri (her dilin doluluk durumuyla) ve üç sekme:

- **Alanlar** — arama sonucu (meta başlık/açıklama, karakter sayacı) · canonical · indeksleme (noindex / nofollow, üç durumlu) · anahtar kelimeler · sayfa metni (H1, giriş) · Open Graph · X/Twitter · görsel ve alt metni · URL (salt okunur).
- **Önizleme** — SERP ve sosyal kart önizlemesi.
- **Teknik** — canlı okumadan gelen denetim bulguları, skor dökümü, runtime özeti, hreflang ve schema. Bir bulguya tıklanınca Alanlar sekmesi açılır ve ilgili kutuya gidilir.

Alt çubukta değişiklik sayısı ve **Kaydet**; kaydetmeden önce farkı gösteren pencere açılır. Ctrl/⌘ + S aynı pencereyi açar.

**Uygulamada:**
- Her alanın yanında sayfanın **şu an yayında olan** değeri durur. Boş bir kutu "bu sayfanın başlığı yok" demek değildir — başlık sayfanın kendi kodundan geliyor olabilir; puanlama da bu etkin değere göre yapılır.
- Okuma engellenirse (Vercel koruma sayfası) hiçbir alanda "mevcut değer" gösterilmez ve panel bunu açıkça yazar; boş görünenler doldurulmaz.
- Bir bölge satırının adresini kod içindeki landing sayfası servis ediyorsa panel bunu söyler ve doğru kaydı gösterir — oradaki alanlar yayına çıkmaz.
- Filtreler, dil ve açık sayfa adrese yazılır (`?locale=de&issue=problems&open=…`); link gönderilince aynı ekran açılır.
- URL değiştirme bu panelden yapılmaz: 301 yönlendirme gerekir, yönlendirmeler `src/lib/redirects.ts` içinde durur.

### 5.17 Ayarlar

Sol alt menülü tek sayfa: **Genel** (uygulama ayarları) · **Döviz kurları** (EUR bazlı kurlar, son güncelleme, Şimdi yenile) · **Gece tarifesi** · **Entegrasyonlar** (Stripe anahtarları, Resend, Telegram bot ve grup, WhatsApp numarası, site adresi, yönetici e-postaları — değerler maskeli gösterilir).

### 5.18 Giriş ekranı

Açık zemin üzerinde tek kart: logo, “Torvian Admin”, e-posta, şifre, Giriş yap. Hata mesajı alanın altında; “Invalid login credentials” Türkçe gösterilir. Giriş formu bütün admin adreslerinde layout'tan gelir; `/admin/login` yalnızca eski yer imleri için kalır ve panele yönlendirir.

---

## 6. Telefon ve tablet

| Genişlik | Davranış |
|---|---|
| ≤ 1180px | Bugün ekranında sağ sütun alta iner; özet şeridi 3 sütun; tabloda satır eylemleri gizlenir. |
| ≤ 900px | Yan menü çekmece olur; üst çubukta menü düğmesi; sayfa kenar boşluğu 16px. |
| ≤ 760px | Tablolar karta dönüşür (saat + durum / müşteri / güzergah / şoför + ödeme); sağ panel tam ekran; özet şeridi 2 sütun; üst çubukta yalnızca ikonlar; filtre düğmeleri alt satıra akar. |

Dokunma hedefleri en az 34px. Satır içi eylemler telefonda karta dokununca açılan panelde yer alır.

---

## 7. Altyapısı kurulacak özellikler

Taslakta görünen ama bugün arkasında çalışan bir işlem olmayan özellikler. Hazır olana kadar ekranda gösterilmez.

| # | Özellik | Bugünkü durum | Yapılacak |
|---|---|---|---|
| A1 | Uçuş durumu (indi, rötar, kalkış) | Uçuş kodu kayıtlı, durum kaynağı yok | **Karar: sonraya.** Uçuş verisi API'si alındığında eklenecek (ör. AeroDataBox): rezervasyon uçuşları için periyodik sorgu; rötar “Dikkat gerektiriyor”a düşer. O zamana kadar yalnızca uçuş kodu gösterilir. |
| A2 | Ödeme linki gönder | **Yapıldı (Aşama 9).** Rezervasyon çekmecesinde "Ödeme linki" hızlı eylemi: `pending` bir rezervasyon için Stripe Checkout Session oluşturur (webhook'un beklediği aynı metadata ile — reservation_id, is_deposit, ...), linki kopyala/WhatsApp'la gönder penceresi açılır. | — |
| A3 | Adminden yeni rezervasyon | **Yapıldı (Aşama 9).** `/admin/reservations/new` — tam sayfa form (müşteri, bölge/araç, tarih-saat, yolcu/bavul, ödeme türü), canlı fiyat önizlemesi. Kayıt "Ödeme bekliyor" olarak açılır, ardından A2 ile ödeme linki gönderilir; ödeme gelince durum Stripe webhook'u ile değişir. Üst çubuktaki **Yeni rezervasyon** ve komut paleti artık buraya açılır. | — |
| A4 | İptalde para iadesi | **Yapıldı (Aşama 11).** Rezervasyon çekmecesinin **Para** bölümünde "Para iadesi": pencere açılırken tahsil edilen, o ana kadar iade edilmiş ve kalan tutar Stripe'tan okunur — kendi sütunlarımızdan değil, çünkü `total_price` tahsil edileni değil rezervasyonun tutarını söyler, nakit kayıtta yalnızca kapora çekilmiştir ve Stripe panelinden yapılmış bir iade bizde hiç görünmez. Tamamı ya da bir kısmı iade edilir; buton tutarı açıkça yazar. Fazla iade sunucuda da engellenir, tekrar basmaya karşı idempotency anahtarı var. Sonuç `reservations.refunded_amount` ve `event_log`'a işlenir. İade rezervasyonun durumunu değiştirmez — iptal ayrı işlemdir. | — |
| A5 | Bildirim zili | Kaynak yok | **Yapılmayacak — 16.09.2026'da bir daha teyit edildi.** Zil gösterilmez; yapılacak işler Bugün ekranında ve menü sayaçlarında zaten görünüyor. |
| A6 | Şoförün “izinli” durumu | **Yapıldı (Aşama 9).** `drivers.portal_token` + `/driver/panel/[token]` — her şoförün kalıcı, tek linki: bütün işlerini (bugün, yaklaşan, son tamamlananlar) görür, her işe kendi göreve-özel linkinden girer, önündeki 14 günden izin günlerini işaretler/kaldırır. Admin de Şoförler çekmecesinden aynı 14 günlük ızgaradan izin ekler/kaldırır ve "Panel linki"ni kopyalar. İzinli şoför bugün için "İzinli" rozetiyle listede ve çekmecede görünür. Mevcut iş başına link (`/driver/[token]`) değişmeden çalışmaya devam ediyor. | — |
| A7 | Rezervasyon geçmişi | **Yapıldı (Aşama 9).** `event_log` tablosu — kim (admin e-postası/"system") ne yaptı (oluşturdu, düzenledi, ödeme linki gönderdi, ödeme alındı/başarısız, iptal onayladı/reddetti). Rezervasyon çekmecesinin Geçmiş bölümü artık bunu, atama zaman damgalarıyla birlikte tek zaman çizelgesinde gösteriyor. | — |
| A8 | Toplu Telegram gönderimi | **Yapıldı (Aşama 9).** Seçilen rezervasyonları tek mesajda gönderen uç nokta (`/api/admin/send-to-telegram-bulk`); yalnızca çok büyük bir seçim Telegram'ın 4096 karakter sınırını aşarsa birden fazla mesaja bölünür. | — |
| A9 | Rötarı şoföre bildir | **Yapıldı (Aşama 11).** Atanmış şoförün satırında "Rötar bildir": süre seçilir (15 dk – 1,5 saat ya da serbest), planlanan ve yeni saat yan yana gösterilir, gidecek mesaj önizlenir, WhatsApp hazır metinle açılır. Bildirim rezervasyonun saatini değiştirmez, yalnızca şoförü haberdar eder; `event_log`'a işlenir. A1 geldiğinde aynı mesaj uçuş verisinden otomatik tetiklenecek. | — |

---

## 8. Uygulama kuralları

- Her aşama ayrı branch'te yapılır (`feat/admin-ui-<aşama>`), önizlemede test edilir, sonra `main`'e alınır.
- Hiçbir mevcut işlev kaybolmaz; bir ekran yenilenirken eski ekrandaki her eylem yeni ekranda bir yere karşılık gelir.
- Tutarlar para birimiyle gösterilir; farklı para birimleri aynı toplamda karıştırılmaz.
- Her aşama sonunda: TypeScript ve ESLint temiz, masaüstü ve telefon görünümü kontrol edilmiş, önizlemede gerçek veriyle denenmiş.
- Tasarım dışına çıkan her karar bu belgeye işlenir.

---

## 9. İlerleme

- [x] **Aşama 0 — Tasarım:** taslak (`admin-tasarim-taslak.html`) ve bu belge.
- [x] **Aşama 1 — Temel:** renk ve ölçü değişkenleri · `ui/` bileşenleri (Bölüm 4) · yeni yan menü ve üst çubuk · komut paleti · telefon çekmecesi · giriş ekranı.
- [x] **Aşama 2 — Rezervasyonlar:** sekmeler ve filtreler · gruplu liste · sağ panel · panel içinde şoför atama · toplu işlemler · detay sayfasının yeni düzeni · sayfalama.
- [x] **Aşama 3 — Bugün:** özet şeridi · dikkat gerektiriyor · günün akışı · şoför durumu · bu ay kutusu · eski grafiklerin taşınması.
- [x] **Aşama 4 — Operasyon:** Takvim & Kapasite (aylık takvim, gün paneli, varsayılan kapasite, transfere tıklayınca rezervasyon paneli) · Canlı Ziyaretçiler (Canlı / Analitik sekmesi; eski kontrol paneli grafikleri Analitik'e taşındı, ciro artık euro ve transfer tarihine göre).
- [x] **Aşama 5 — Filo & Ekip:** Şoförler (sekmeler, arama, sağ panelden iletişim/işler/bu ay özeti/ödeme/pasife alma) · Araçlar (liste, sağ panel, görsel yükleme) · Araç Tipleri (kart ızgarası, düzenleme penceresi — tek dilli ad/açıklama, bkz. not aşağıda) · Şoför Ödemeleri tasarım diline tam geçti.
- [x] **Aşama 6 — Finans:** Kasa ve Şoför Ödemeleri tam uyarlandı. Fiyatlandırma (araç tipi seçici, toplu fiyat güncelleme, satır düzenleme) ve Kuponlar (sekmeler, liste, pencere) yeni bileşenlere geçti.
- [x] **Aşama 7 — Site & Pazarlama:** Bölgeler (liste + çok dilli ad/açıklama penceresi — meta alanları SEO Yönetimi'nde kalıyor) · Değerlendirmeler (sekmeler, liste, pencere — bkz. not aşağıda) · Blog Yazıları (liste + Genel/Dil içeriği sekmeli tam sayfa editör) · Landing Sayfaları (liste + editör) yeni bileşenlere geçti. **SEO Yönetimi hariç** — bkz. not aşağıda.
- [x] **Aşama 8 — Sistem:** Ayarlar, sol menülü dört bölüme ayrıldı (Genel, Döviz kurları, Gece tarifesi, Entegrasyonlar).
- [x] **Aşama 9 — Altyapı:** A3 adminden rezervasyon (`/admin/reservations/new`, tam sayfa form, canlı fiyat önizlemesi) + A2 ödeme linki (Stripe Checkout, "Ödeme linki" hızlı eylemi, WhatsApp'a gönder) · A6 şoförün kalıcı paneli (`/driver/panel/[token]`) ve izin günleri (şoför kendi panelinden, admin Şoförler çekmecesinden işaretler; "İzinli" rozeti) · A7 olay kaydı (`event_log` tablosu, rezervasyon çekmecesindeki Geçmiş'e işleniyor) · A8 toplu Telegram (seçilenler tek mesajda gönderiliyor). Aşama 9'da A4 (iade) yapılmadı; A1, A4, A9 ve A5'in bugünkü durumu için Bölüm 7'deki tabloya bakın.
- [x] **Aşama 10 — SEO Yönetimi:** ekran liste + sağdan panel yapısına geçti ve tek dosyadan (1695 satır) modüllere bölündü. Panelin içinde üç sekme var — Alanlar · Önizleme · Teknik — çünkü üçü birden bir çekmeceye sığmıyor ve düzenleyen aynı anda yalnızca biriyle çalışıyor. Filtreler, dil ve açık sayfa adrese yazılıyor (`?locale=de&issue=problems&open=…`), böylece bir soruna atılan link karşıda aynı ekranı açıyor. Kapsam aynı kaldı: dört tablo (`seo_pages`, `regions`, `blog_posts`, `landing_pages`), yedi dil, puanlama, canlı okuma, SERP/sosyal önizleme, toplu doldurma ve farkı göstererek kaydetme.

- [x] **Aşama 11 — Para iadesi ve rötar bildirimi:** A4 iade (`/api/admin/refund`, çekmecenin Para bölümünden tam/kısmi, tutarlar Stripe'tan okunuyor, migration `096_reservation_refunds.sql`) · A9 rötar bildirimi (atanmış şoförün satırından, hazır WhatsApp mesajı, `event_log`'a işleniyor).

### Aşama 10'un dosyaları

| Dosya | Sorumluluk |
|---|---|
| `seo/SeoScreen.tsx` | Ekran kabuğu: veri, filtre durumu, adres senkronu, pencereler |
| `seo/useInspections.ts` | Canlı okuma — tarama, hedef deployment, kaynak |
| `seo/useSeoTable.ts` | entries · yinelenenler · skor · denetim · filtre · istatistik |
| `seo/useSeoDraft.ts` | Düzenlenen satırın taslağı ve kaydetme yazımı |
| `seo/SeoToolbar.tsx` | İstatistik şeridi, tarama kutusu, arama ve filtreler |
| `seo/SeoList.tsx` | `DataGrid` sütunları ve satır hücreleri |
| `seo/SeoPanel.tsx` | Çekmece kabuğu, uyarılar, sekmeler, kaydetme |
| `seo/SeoFields.tsx` | Bir sayfanın bir dildeki bütün SEO alanları |
| `seo/scoring.ts` | `scoreEntry` ve `auditFor` |
| `seo/pageTypes.ts` · `TriToggle.tsx` · `NewRegionDialog.tsx` | Sayfa türü meta'sı, üç durumlu anahtar, yeni bölge penceresi |

### Devam notları

- Aşama 1–9 `main`'de ve canlıda. Aşama 10 (`feat/admin-ui-seo`) ve Aşama 11 (`feat/admin-refund-delay`) branch'te, önizleme bekliyor. Panelin bütün ekranları artık tasarım dilinde.
- **Aşama 10 ve 11 yerelde gerçek veriyle denenmedi** — `.env.local` Supabase anahtarı taşımadığı için yalnızca TypeScript, ESLint ve `next build` ile doğrulandı. Önizlemede ilk bakılacaklar: SEO ekranının tarama sütunları ve panelin üç sekmesi; iadenin Stripe'tan okuduğu tutarlar (önce **test modunda** bir ödeme üzerinde denenmeli).
- **Aşama 11 bir migration getiriyor** — `096_reservation_refunds.sql`. Canlıya alınmadan önce Supabase'de çalıştırılmalı, yoksa iade yazımı `refunded_amount` sütununu bulamaz (para Stripe'ta iade edilir ama satıra işlenmez).
- Geriye yalnızca **A1 uçuş durumu** kaldı; uçuş verisi API'si alınınca yapılacak. A9'un mesajı o zaman elle değil uçuş verisinden tetiklenecek.
- **Araç Tipleri'nde bir sapma:** Bölüm 5.7 "çok dilli ad ve açıklama sekmeleri" diyor, ama `vehicle_categories` tablosunda böyle sütunlar yok (tek `name`/`description`). Olmayan bir alan için sahte sekme koymak yerine tek dilli formla bırakıldı. Çok dilli isim gerekiyorsa önce veritabanına `name_xx`/`description_xx` sütunları eklenmeli.
- **Değerlendirmeler'de bir sapma:** Bölüm 5.13 "Onay bekleyen · Yayında · Reddedilen" diyor, ama `reviews` tablosunda ayrı bir "reddedildi" durumu yok — `is_approved` iki hâlli. Sekmeler gerçek veriye göre Onay bekleyen · Yayında · Öne çıkan · Tümü olarak kuruldu.
- Canlıda ilk bakılacaklar: bu turda eklenen her ekranın sorguları gerçek veriyle ilk kez canlıda çalışacak — Takvim & Kapasite, Canlı Ziyaretçiler'in iki sekmesi, Şoförler/Araçlar/Araç Tipleri, Kuponlar, Değerlendirmeler, Bölgeler, Fiyatlandırma, Ayarlar, Blog ve Landing editörleri. Bir sorun görülürse önce o düzeltilir.
- Yerelde `.env.local` gerçek Supabase anahtarı taşımadığı için ekranlar geçici bir önizleme sayfasında (`/tr/zz-ui-onizleme`, sahte veri ve sahte API yanıtlarıyla) kontrol edilir; bu sayfa commit'e girmez.
- Aşama 9 iki yeni migration getiriyor (`094_event_log.sql`, `095_driver_portal_and_leave.sql`) — canlıya alınmadan önce Supabase'de çalıştırılmaları gerekiyor, yoksa olay kaydı ve şoför paneli linkleri çalışmaz.
- Commit ve PR metinlerinde yapay zeka satırı (Co-Authored-By vb.) kullanılmaz. Eski commit'lerdeki satırlar için geçmişin yeniden yazılması ve `.claude/settings.json`, `CLAUDE.md` dosyalarının repodan kaldırılması henüz kararlaştırılmadı.
