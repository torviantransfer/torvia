import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import DriverPanel from "@/components/driver/DriverPanel";

export default async function DriverPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const supabase = createAdminClient();
  const { token } = await params;

  // Find assignment by token
  const { data: assignment } = await supabase
    .from("driver_assignments")
    .select(
      `*,
       drivers(full_name, phone),
       vehicles(plate_number, brand, model),
       reservations(
         reservation_code, trip_type, pickup_datetime, return_datetime,
         flight_code, adults, children, luggage_count, child_seat,
         welcome_sign, welcome_name, hotel_name, hotel_address, notes,
         status, qr_code_token, locale,
         customers(first_name, last_name, phone, email),
         regions(name_en, name_tr, distance_km, duration_minutes)
       )`
    )
    .eq("link_token", token)
    .single();

  if (!assignment) {
    notFound();
  }

  // The driver link is single-use for operations: once the transfer is completed,
  // the panel is no longer available.
  if (assignment.status === "completed") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-950 mb-2">Transfer Tamamlandı</h1>
            <p className="text-slate-500 text-sm mb-6">
              Bu şoför linki tamamlanan transfer için artık kullanılamaz.
            </p>
            <div className="text-xs font-semibold tracking-[0.2em] text-slate-400">
              TORVIAN
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <DriverPanel
          assignment={JSON.parse(JSON.stringify(assignment))}
          token={token}
        />
      </div>
    </div>
  );
}
