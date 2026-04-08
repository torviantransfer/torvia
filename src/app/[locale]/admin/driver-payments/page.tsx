import { createAdminClient } from "@/lib/supabase/admin";
import DriverPayments from "@/components/admin/DriverPayments";

export default async function AdminDriverPaymentsPage() {
  const supabase = createAdminClient();

  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, full_name, phone, is_active")
    .order("full_name");

  const { data: payments } = await supabase
    .from("driver_payments")
    .select(
      "*, drivers(full_name), reservations(reservation_code)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  // Calculate balances per driver
  const balances: Record<
    string,
    { earnings: number; payments: number; adjustments: number; balance: number }
  > = {};

  for (const d of drivers ?? []) {
    balances[d.id] = { earnings: 0, payments: 0, adjustments: 0, balance: 0 };
  }

  for (const p of payments ?? []) {
    if (!balances[p.driver_id]) continue;
    if (p.type === "earning") {
      balances[p.driver_id].earnings += p.amount;
      balances[p.driver_id].balance += p.amount;
    } else if (p.type === "payment") {
      balances[p.driver_id].payments += p.amount;
      balances[p.driver_id].balance -= p.amount;
    } else if (p.type === "adjustment") {
      balances[p.driver_id].adjustments += p.amount;
      balances[p.driver_id].balance += p.amount;
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Şoför Ödemeleri (Cari Hesap)
      </h1>
      <DriverPayments
        drivers={drivers ?? []}
        payments={payments ?? []}
        balances={balances}
      />
    </div>
  );
}
