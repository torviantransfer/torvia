import { createAdminClient } from "@/lib/supabase/admin";
import {
  CalendarCheck,
  DollarSign,
  Users,
  Car,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import AdminDashboardCharts from "@/components/admin/AdminDashboardCharts";

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createAdminClient();

  const [resCount, driverCount, vehicleCount, reviewCount] = await Promise.all(
    [
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true }),
      supabase.from("drivers").select("id", { count: "exact", head: true }),
      supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("is_approved", true),
    ]
  );

  const { data: recentReservations } = await supabase
    .from("reservations")
    .select(
      "id, reservation_code, status, total_price, pickup_datetime, created_at, customers(first_name, last_name, email), regions(name_en)"
    )
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: paidReservations } = await supabase
    .from("reservations")
    .select("total_price")
    .in("status", [
      "paid",
      "driver_assigned",
      "passenger_picked_up",
      "completed",
    ]);

  const totalRevenue =
    paidReservations?.reduce((sum, r) => sum + r.total_price, 0) ?? 0;

  const stats = [
    {
      label: "Toplam Rezervasyon",
      value: resCount.count ?? 0,
      icon: CalendarCheck,
      gradient: "from-blue-500 to-indigo-600",
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      label: "Gelir",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      label: "Aktif Şoförler",
      value: driverCount.count ?? 0,
      icon: Users,
      gradient: "from-violet-500 to-purple-600",
      bg: "bg-violet-50",
      text: "text-violet-600",
    },
    {
      label: "Araçlar",
      value: vehicleCount.count ?? 0,
      icon: Car,
      gradient: "from-orange-500 to-amber-600",
      bg: "bg-orange-50",
      text: "text-orange-600",
    },
  ];

  const statusConfig: Record<string, { bg: string; dot: string }> = {
    pending: { bg: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
    paid: { bg: "bg-blue-50 text-blue-700", dot: "bg-blue-400" },
    driver_assigned: {
      bg: "bg-violet-50 text-violet-700",
      dot: "bg-violet-400",
    },
    passenger_picked_up: {
      bg: "bg-indigo-50 text-indigo-700",
      dot: "bg-indigo-400",
    },
    completed: { bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
    cancelled: { bg: "bg-red-50 text-red-700", dot: "bg-red-400" },
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Kontrol Paneli</h1>
        <p className="text-sm text-slate-500 mt-1">
          Hoş geldiniz. İşletmenizin genel görünümü.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="relative bg-white rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
            style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center`}
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
              >
                <s.icon size={20} className="text-white" strokeWidth={2} />
              </div>
              <div
                className={`flex items-center gap-1 ${s.text} text-xs font-medium`}
              >
                <TrendingUp size={12} />
                <span>Aktif</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {s.value}
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent reservations */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Clock size={16} className="text-slate-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">
                Son Rezervasyonlar
              </h2>
              <p className="text-xs text-slate-400">Son 10 kayıt</p>
            </div>
          </div>
          <a
            href={`/${locale}/admin/reservations`}
            className="inline-flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors"
          >
            Tümünü Gör
            <ArrowUpRight size={12} />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Kod
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Bölge
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Fiyat
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(recentReservations ?? []).map((r: Record<string, unknown>) => {
                const customer = r.customers as Record<string, string> | null;
                const region = r.regions as Record<string, string> | null;
                const status = (r.status as string) ?? "pending";
                const cfg = statusConfig[status] ?? statusConfig.pending;
                return (
                  <tr
                    key={r.id as string}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs font-semibold text-indigo-600">
                        {r.reservation_code as string}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-slate-800 text-[13px]">
                        {customer?.first_name} {customer?.last_name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {customer?.email}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 text-[13px]">
                      {region?.name_en}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 text-[13px]">
                      {new Date(
                        r.pickup_datetime as string
                      ).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-800 text-[13px]">
                      ${(r.total_price as number).toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                        />
                        {status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {(!recentReservations || recentReservations.length === 0) && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-400 text-sm"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <CalendarCheck
                        size={32}
                        className="text-slate-300"
                        strokeWidth={1}
                      />
                      <p>Henüz rezervasyon yok</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts & Analytics */}
      <AdminDashboardCharts />
    </div>
  );
}
