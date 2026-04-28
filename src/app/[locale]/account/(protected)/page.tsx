import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CalendarCheck, Clock, CheckCircle, XCircle, ArrowRight, MapPin } from "lucide-react";

const t: Record<string, Record<string, string>> = {
  title: { en: "Overview", tr: "Genel Bakış", de: "Übersicht", pl: "Przegląd", ru: "Обзор" },
  welcome: { en: "Welcome back", tr: "Tekrar hoş geldiniz", de: "Willkommen zurück", pl: "Witamy ponownie", ru: "С возвращением" },
  upcoming: { en: "Upcoming Transfers", tr: "Yaklaşan Transferler", de: "Bevorstehende Transfers", pl: "Nadchodzące transfery", ru: "Предстоящие трансферы" },
  noUpcoming: { en: "No upcoming transfers", tr: "Yaklaşan transfer yok", de: "Keine bevorstehenden Transfers", pl: "Brak nadchodzących transferów", ru: "Нет предстоящих трансферов" },
  total: { en: "Total Bookings", tr: "Toplam Rezervasyon", de: "Gesamtbuchungen", pl: "Łączne rezerwacje", ru: "Всего бронирований" },
  active: { en: "Active", tr: "Aktif", de: "Aktiv", pl: "Aktywne", ru: "Активных" },
  completed: { en: "Completed", tr: "Tamamlanan", de: "Abgeschlossen", pl: "Zakończone", ru: "Завершённых" },
  cancelled: { en: "Cancelled", tr: "İptal", de: "Storniert", pl: "Anulowane", ru: "Отменённых" },
  viewAll: { en: "View All Reservations", tr: "Tüm Rezervasyonları Gör", de: "Alle Buchungen anzeigen", pl: "Zobacz wszystkie rezerwacje", ru: "Все бронирования" },
  bookNew: { en: "Book New Transfer", tr: "Yeni Transfer Rezervasyonu", de: "Neuen Transfer buchen", pl: "Zarezerwuj nowy transfer", ru: "Забронировать трансфер" },
};

export default async function AccountDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  const userName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "";

  // Find customer record
  const { data: customer } = await admin
    .from("customers")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single();

  let totalCount = 0;
  let activeCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let upcoming: Array<{ reservation_code: string; pickup_datetime: string; status: string; regions: { name_en: string; name_tr: string } | null }> = [];

  if (customer) {
    const { data: reservations } = await admin
      .from("reservations")
      .select("reservation_code, pickup_datetime, status, regions(name_en, name_tr)")
      .eq("customer_id", customer.id)
      .order("pickup_datetime", { ascending: false });

    const all = reservations ?? [];
    totalCount = all.length;
    activeCount = all.filter(r => ["paid", "driver_assigned", "passenger_picked_up"].includes(r.status)).length;
    completedCount = all.filter(r => r.status === "completed").length;
    cancelledCount = all.filter(r => r.status === "cancelled").length;

    upcoming = all
      .filter(r => new Date(r.pickup_datetime) >= new Date() && r.status !== "cancelled" && r.status !== "completed")
      .slice(0, 3)
      .map(r => ({
        ...r,
        regions: Array.isArray(r.regions) ? r.regions[0] ?? null : r.regions,
      })) as typeof upcoming;
  }

  const regionName = (r: { name_en: string; name_tr: string } | null) =>
    r?.[`name_${locale}` as keyof typeof r] ?? r?.name_en ?? "";

  const stats = [
    { label: t.total[locale] ?? t.total.en, value: totalCount, icon: CalendarCheck, color: "text-blue-500", bg: "bg-blue-50" },
    { label: t.active[locale] ?? t.active.en, value: activeCount, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
    { label: t.completed[locale] ?? t.completed.en, value: completedCount, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: t.cancelled[locale] ?? t.cancelled.en, value: cancelledCount, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <h1 className="text-2xl font-bold text-gray-900">{t.title[locale] ?? t.title.en}</h1>
        <p className="text-gray-500 text-sm mt-1">{t.welcome[locale] ?? t.welcome.en}, <span className="text-blue-600 font-medium">{userName}</span></p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.bg}`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming transfers */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h2 className="text-xs text-gray-400 uppercase tracking-[0.15em] font-semibold">{t.upcoming[locale] ?? t.upcoming.en}</h2>
        </div>
        {upcoming.length === 0 ? (
          <div className="p-6">
            <p className="text-gray-400 text-sm">{t.noUpcoming[locale] ?? t.noUpcoming.en}</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            {upcoming.map((r) => (
              <div key={r.reservation_code} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Antalya Airport → {regionName(r.regions)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(r.pickup_datetime).toLocaleDateString("tr-TR")} — {new Date(r.pickup_datetime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">{r.reservation_code}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href={`/${locale}/account/reservations`}
          className="bg-white hover:bg-gray-50 rounded-2xl p-5 flex items-center justify-between transition-all group"
          style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center gap-3">
            <CalendarCheck size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors font-medium">{t.viewAll[locale] ?? t.viewAll.en}</span>
          </div>
          <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
        </a>
        <a
          href={`/${locale}/booking`}
          className="bg-blue-600 hover:bg-blue-700 rounded-2xl p-5 flex items-center justify-between transition-all group shadow-lg shadow-blue-600/20"
        >
          <span className="text-sm text-white font-semibold">{t.bookNew[locale] ?? t.bookNew.en}</span>
          <ArrowRight size={16} className="text-white/80 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  );
}
