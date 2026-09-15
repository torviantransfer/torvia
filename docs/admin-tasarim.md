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

Aşama 9'a kadar: bildirim zili yok (A5); **Yeni rezervasyon** site rezervasyon sayfasını yeni sekmede açar (A3). Ziyaretçi sayısına tıklayınca Canlı Ziyaretçiler açılır.

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
- **Yolculuk:** her bacak için kart — gidiş/dönüş, tarih-saat, uçuş (+durum), başlangıç ve varış noktası, atanmış şoför ve araç (**Değiştir** / **Kaldır**) ya da **Şoför ata**. Şoför ata aynı panelin içinde açılır (şoförlerin o günkü yükü görünür), ücret ve para birimi aynı adımda girilir.
- **Para:** müşterinin ödediği, ödeme türü (online/nakit, kapora, şoförde kalan), şoförlere giden (para birimi + euro karşılığı), bize kalan.
- **Müşteri:** e-posta, telefon, otel ve adres.
- **Not:** müşteri notu, çocuk koltuğu, karşılama tabelası.
- **İptal talebi** varsa panelin en üstünde: talep notu + **Reddet** / **İptali onayla**.
- **Geçmiş:** oluşturma, ödeme, şoför atama, voucher gönderimi zamanları.
- Alt çubuk: Düzenle · İptal et / Kaydı sil (bekleyen ya da iptal edilmiş kayıtta).
- “Tam sayfada aç” mevcut `/admin/reservations/[kod]` sayfasını aynı düzende açar; bu adres paylaşılabilir kalır.

**Uygulamada:**
- Sekme, arama, filtreler, sıralama ve açık panel adrese yazılır (`?tab=driver&region=…&open=TRV-24091`); link gönderilince aynı ekran açılır.
- Liste `/api/admin/reservations` üzerinden sayfa sayfa gelir (60'ar kayıt), aşağı inildikçe devamı yüklenir. Yaklaşan, Bugün, Şoför bekleyen, Ödeme bekleyen ve İptal talebi sekmeleri takvimle sınırlı olduğu için bütün olarak okunur ve sunucuda sıralanır; Geçmiş ve Tümü veritabanında sayfalanır.
- Gidiş-dönüşlerde satır sıradaki bacağı gösterir: gidişi geçmiş, dönüşü yarın olan transfer “Yarın” altında, dönüş saati ve yönüyle durur. Ödeme bekleyen sekmesi yalnızca tarihi gelmemiş kayıtları sayar; tarihi geçmiş ödenmemiş kayıtlar Tümü'nde kalır.
- Satırda ülke yerine rezervasyonun dili görünür; ülke bilgisi kayıtta tutulmuyor.
- Toplu Telegram, A8 hazır olana kadar seçilen her rezervasyonu ayrı mesaj olarak sırayla gönderir. Toplu şoför ata, seçilenler içinde şoför bekleyenlerin panelini sırayla açar (panelde “Seçim · 1/3”). Toplu voucher her rezervasyonun PDF'ini indirir.
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

Liste: sayfa adı, URL, skor rozeti, eksik alan sayısı, son inceleme. Filtre: sorunlu / eksik / noindex, grup, dil. Satır → düzenleme paneli: SERP önizlemesi, sosyal önizleme, alanlar, skor, farkı göstererek kaydetme. Toplu doldurma ve canlı inceleme eylemleri korunur.

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
| A1 | Uçuş durumu (indi, rötar, kalkış) | Uçuş kodu kayıtlı, durum kaynağı yok | Uçuş verisi servisi seçilir (ör. AeroDataBox), rezervasyon uçuşları için periyodik sorgu; rötar “Dikkat gerektiriyor”a düşer. Hazır olana kadar yalnızca uçuş kodu gösterilir. |
| A2 | Ödeme linki gönder | Yok | Bekleyen rezervasyon için Stripe ödeme linki oluşturma + e-posta/WhatsApp ile gönderme uç noktası. |
| A3 | Adminden yeni rezervasyon | Yok | Admin içinden rezervasyon oluşturma akışı (müşteri, güzergah, tarih, araç, fiyat, ödeme türü). Hazır olana kadar buton site rezervasyon sayfasını yeni sekmede açar. |
| A4 | İptalde para iadesi | İptal onayı durumu “iptal edildi” yapar ve şoför atamalarını kapatır; iade yapmaz | Stripe iadesi (tam/kısmi) seçeneği. Hazır olana kadar buton **İptali onayla** der; iade Stripe panelinden yapılır. |
| A5 | Bildirim zili | Kaynak yok | Yeni rezervasyon, iptal talebi, onay bekleyen değerlendirme, ödeme hatası olaylarından bildirim listesi. Hazır olana kadar zil gösterilmez. |
| A6 | Şoförün “izinli” durumu | İzin verisi yok | Şoföre izin günleri alanı. Hazır olana kadar şoför durumu yalnızca atamalardan türetilir: yolda (yolcu alındı), işi var, müsait. |
| A7 | Rezervasyon geçmişi | Ayrı kayıt tablosu yok | Olay kaydı tablosu (oluşturuldu, ödendi, şoför atandı, voucher gönderildi, düzenlendi, iptal). Hazır olana kadar mevcut zaman damgalarından (oluşturma, ödeme, atama, kabul, alış, tamamlanma) derlenir. |
| A8 | Toplu Telegram gönderimi | Tek rezervasyon için var | Seçilen rezervasyonları tek mesajda gönderen uç nokta. |
| A9 | Rötarı şoföre bildir | — | A1 ile birlikte; şoförün WhatsApp'ına hazır mesajla bağlantı (`wa.me`). |

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
- [ ] **Aşama 3 — Bugün:** özet şeridi · dikkat gerektiriyor · günün akışı · şoför durumu · bu ay kutusu · eski grafiklerin taşınması.
- [ ] **Aşama 4 — Operasyon:** Takvim & Kapasite · Canlı Ziyaretçiler (Canlı / Analitik).
- [ ] **Aşama 5 — Filo & Ekip:** Şoförler · Araçlar · Araç Tipleri · Şoför Ödemeleri uyarlaması.
- [ ] **Aşama 6 — Finans:** Kasa uyarlaması · Fiyatlandırma tablosu · Kuponlar.
- [ ] **Aşama 7 — Site & Pazarlama:** Bölgeler · Değerlendirmeler · Blog · Landing · SEO.
- [ ] **Aşama 8 — Sistem:** Ayarlar (Genel, Döviz, Gece tarifesi, Entegrasyonlar).
- [ ] **Aşama 9 — Altyapı:** A1 uçuş durumu · A2 ödeme linki · A3 adminden rezervasyon · A4 iade · A5 bildirimler · A6 izin günleri · A7 olay kaydı · A8 toplu Telegram · A9 rötar bildirimi.
